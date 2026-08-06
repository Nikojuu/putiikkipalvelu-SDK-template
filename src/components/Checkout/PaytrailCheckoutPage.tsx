"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CustomerDataForm from "@/components/Checkout/CustomerDataForm";
import TicketHoldersForm from "@/components/Checkout/TicketHoldersForm";
import { useCart } from "@/hooks/use-cart";
import { CustomerData, customerDataSchema } from "@/lib/zodSchemas";
import {
  SelectShipmentMethod,
  type ShipmentSelection,
} from "@/components/Checkout/SelectShipmentMethod";
import {
  calculateCartWithCampaigns,
  type Campaign,
  type ShipmentMethodsResponse,
  type PaytrailCheckoutResponse,
  type TicketHolderData,
} from "@putiikkipalvelu/storefront-sdk";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";
import { CheckoutSteps } from "@/components/Checkout/CheckoutSteps";
import { getShippingOptions } from "@/lib/actions/shipmentActions";
import { CheckoutButton } from "../Cart/CheckoutButton";
import {
  apiCreatePaytrailCheckoutSession,
  apiReleasePaytrailOrder,
} from "@/lib/actions/paytrailActions";
import PaymentSelection from "./PaytrailPaymentSelection";
import { PayPalPayButton } from "./PayPalPayButton";
import { trackBeginCheckout } from "@/lib/gtm";

// How long the customer may idle on the payment-method step before their
// pending order is cancelled, its reserved stock released, and they are sent
// back to the cart. The backend reconcile cron remains the backstop for
// closed tabs, so this only needs to cover an open, idle tab.
const PAYMENT_PAGE_TIMEOUT_MS = 30 * 60 * 1000;

const PaytrailCheckoutPage = ({
  campaigns,
  showPaypal = false,
}: {
  campaigns: Campaign[];
  showPaypal?: boolean;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const { items: cartItems, discount } = useCart();
  const { cartTotal } = calculateCartWithCampaigns(cartItems, campaigns);

  // Calculate discount amount from discount code (if applied)
  const discountAmount = discount
    ? discount.discountType === "PERCENTAGE"
      ? Math.round((cartTotal * discount.discountValue) / 100)
      : discount.discountValue
    : 0;

  // Cart total after discount code (used for free shipping threshold)
  const cartTotalAfterDiscount = cartTotal - discountAmount;

  // Ticket-only / digital-only / mixed non-shippable carts don't need shipping
  const requiresShipping = cartItems.some(
    (item) => !item.isTicket && !item.isDigital
  );

  // Check if any ticket requires holder names
  const ticketItemsRequiringHolder = cartItems.filter(
    (item) => item.isTicket && item.product.ticketInfo?.requiresHolder
  );
  const requiresHolders = ticketItemsRequiringHolder.length > 0;

  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [shippingOptions, setShippingOptions] =
    useState<ShipmentMethodsResponse | null>(null);
  const [step, setStep] = useState(1);
  const [selectedShipping, setSelectedShipping] =
    useState<ShipmentSelection | null>(null);
  const [paytrailData, setPaytrailData] =
    useState<PaytrailCheckoutResponse | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [ticketHolders, setTicketHolders] = useState<
    Record<string, TicketHolderData[]> | undefined
  >(undefined);
  const timeoutFiredRef = useRef(false);

  // A previous "Siirry maksamaan" click left a PENDING order holding reserved
  // stock — release it before creating a replacement session so the stock
  // isn't reserved twice.
  const releasePreviousOrder = async () => {
    if (!orderId) return;
    setOrderId(null);
    try {
      await apiReleasePaytrailOrder(orderId);
    } catch {
      // Best effort — the reconcile cron releases it eventually.
    }
  };

  // PayPal checkout failed AFTER the Paytrail order was released: the bank
  // grid on screen is backed by a CANCELLED order — paying it would go
  // through the oversell re-take path. Tear the dead grid down and step back
  // so the next attempt creates a fresh session.
  const handlePaypalFailed = () => {
    setPaytrailData(null);
    setOrderId(null);
    setStep(requiresShipping ? shippingStep : 1);
  };

  // Build steps dynamically
  const buildSteps = () => {
    const s: { number: number; title: string }[] = [
      { number: 1, title: "Asiakastiedot" },
    ];
    if (requiresHolders) {
      s.push({ number: s.length + 1, title: "Lipun haltijat" });
    }
    if (requiresShipping) {
      s.push({ number: s.length + 1, title: "Toimitustapa" });
    }
    s.push({ number: s.length + 1, title: "Maksutapa" });
    return s;
  };
  const steps = buildSteps();

  // Calculate which step number each phase is at
  const holdersStep = requiresHolders ? 2 : -1;
  const shippingStep = requiresShipping
    ? (requiresHolders ? 3 : 2)
    : -1;
  const paymentStep = steps[steps.length - 1].number;

  // Payment-page timeout. Timestamp-based (not a bare setTimeout): background
  // tabs throttle timers, so an overdue timeout must also fire when the tab
  // regains visibility/focus. Clicking a bank button navigates this tab away
  // and unmounts the component, so the timer can never fire mid-bank-flow.
  //
  // IMPORTANT: never release on unmount/beforeunload — unloading also happens
  // when the customer navigates TO the bank, and releasing there would cancel
  // every real payment attempt.
  useEffect(() => {
    if (step !== paymentStep || !paytrailData || !orderId) return;

    timeoutFiredRef.current = false;
    const startedAt = Date.now();

    const expire = async () => {
      if (timeoutFiredRef.current) return;
      timeoutFiredRef.current = true;

      // Release BEFORE redirecting: the customer's own reservation would
      // otherwise count against them in cart validation.
      const result = await apiReleasePaytrailOrder(orderId).catch(() => null);

      // The payment won the race — the order is already paid, don't send the
      // customer back to the cart.
      if (
        result?.success &&
        !result.released &&
        (result.status === "PAID" || result.status === "SHIPPED")
      ) {
        router.push(`/payment/success/${orderId}`);
        return;
      }

      // Released (or release failed — the cron backstop covers it): move the
      // customer off the now-dead payment page.
      router.push("/cart?expired=1");
    };

    const check = () => {
      if (Date.now() - startedAt >= PAYMENT_PAGE_TIMEOUT_MS) {
        void expire();
      }
    };

    const interval = setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [step, paymentStep, paytrailData, orderId, router]);

  const handleCustomerDataSubmit = async (data: CustomerData) => {
    setIsLoading(true);
    setCustomerData(data);
    if (!data) {
      return;
    }

    // If holders needed, go to holders step
    if (requiresHolders) {
      setStep(holdersStep);
      setIsLoading(false);
      return;
    }

    // Skip shipping for ticket-only carts — create Paytrail session directly
    if (!requiresShipping) {
      await releasePreviousOrder();
      const result = await apiCreatePaytrailCheckoutSession(null, data);

      if (result.success) {
        setPaytrailData(result.data);
        setOrderId(result.orderId);
        setStep(paymentStep);
      } else {
        console.error("Checkout failed:", result.error);
        toast({
          title: "Virhe maksun käsittelyssä",
          description: result.error || "Tuntematon virhe",
          className:
            "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
          action: (
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
          ),
        });
      }

      setIsLoading(false);
      return;
    }

    // Fetch shipping options for the customer's postal code
    const result = await getShippingOptions(
      data.postal_code,
      cartItems,
      campaigns,
      discountAmount
    );

    if (result.success) {
      setShippingOptions(result.data);
      setStep(shippingStep);
    } else {
      toast({
        title: "Virhe haettaessa toimitustapoja",
        description: result.error || "Yritä myöhemmin uudestaan",
        className:
          "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
        action: (
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
        ),
      });
      console.error("Error fetching shipping options:", result.error);
    }

    setIsLoading(false);
  };

  const handleTicketHoldersSubmit = async (
    holders: Record<string, TicketHolderData[]>
  ) => {
    setIsLoading(true);
    setTicketHolders(holders);

    // If no shipping, create Paytrail session directly
    if (!requiresShipping) {
      const validatedCustomerData = customerDataSchema.safeParse(customerData);
      if (!validatedCustomerData.success) {
        setIsLoading(false);
        return;
      }

      await releasePreviousOrder();
      const result = await apiCreatePaytrailCheckoutSession(
        null,
        validatedCustomerData.data,
        holders
      );

      if (result.success) {
        setPaytrailData(result.data);
        setOrderId(result.orderId);
        setStep(paymentStep);
      } else {
        console.error("Checkout failed:", result.error);
        toast({
          title: "Virhe maksun käsittelyssä",
          description: result.error || "Tuntematon virhe",
          className:
            "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
        });
      }

      setIsLoading(false);
      return;
    }

    // Fetch shipping options
    const result = await getShippingOptions(
      customerData!.postal_code,
      cartItems,
      campaigns,
      discountAmount
    );

    if (result.success) {
      setShippingOptions(result.data);
      setStep(shippingStep);
    } else {
      toast({
        title: "Virhe haettaessa toimitustapoja",
        description: result.error || "Yritä myöhemmin uudestaan",
        className:
          "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
      });
    }

    setIsLoading(false);
  };

  // Map the selected shipping to the checkout API shape
  const chosenShipmentMethodForApi = () =>
    selectedShipping
      ? {
          shipmentMethodId: selectedShipping.shipmentMethodId,
          pickupId: selectedShipping.pickupPointId,
          serviceId: selectedShipping.serviceId,
        }
      : null;

  const handlePaytrailCheckout = async () => {
    const validationResult = customerDataSchema.safeParse(customerData);
    if (!validationResult.success) {
      console.error("Customer data validation failed:", validationResult.error);
      return;
    }

    const validatedCustomerData = validationResult.data;
    setIsLoading(true);

    trackBeginCheckout(cartItems, cartTotalAfterDiscount, discount?.code);

    const chosenShipmentMethod = chosenShipmentMethodForApi();

    await releasePreviousOrder();
    const result = await apiCreatePaytrailCheckoutSession(
      chosenShipmentMethod,
      validatedCustomerData,
      ticketHolders
    );

    if (result.success) {
      setPaytrailData(result.data);
      setOrderId(result.orderId);
      setStep(paymentStep);
    } else {
      console.error("Checkout failed:", result.error);
      toast({
        title: "Virhe maksun käsittelyssä",
        description: result.error || "Tuntematon virhe",
        className:
          "bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800",
        action: (
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
        ),
      });
    }

    setIsLoading(false);
  };

  const handleGoBack = () => {
    if (step > 1) {
      const newStep = step - 1;
      setStep(newStep);

      if (newStep === 1) {
        // Reset shipping selection when going back
        setSelectedShipping(null);
      }
    }
  };

  return (
    <div className="bg-warm-white min-h-screen">
      <div className="max-w-screen-2xl mx-auto px-4 pt-24 md:pt-32 pb-12">
        <CheckoutSteps currentStep={step} steps={steps} />

        {step === 1 && (
          <CustomerDataForm
            handleSubmit={handleCustomerDataSubmit}
            initialData={customerData}
            isLoading={isLoading}
          />
        )}

        {step === holdersStep && requiresHolders && (
          <TicketHoldersForm
            ticketItems={ticketItemsRequiringHolder}
            onSubmit={handleTicketHoldersSubmit}
            initialData={ticketHolders}
            isLoading={isLoading}
          />
        )}

        {step === shippingStep && requiresShipping && (
          <>
            <div className="mt-6 flex justify-start mx-auto max-w-screen-2xl">
              <SelectShipmentMethod
                shippingOptions={shippingOptions}
                onSelect={setSelectedShipping}
                cartTotal={cartTotalAfterDiscount}
              />
            </div>
            <div className="mt-12 flex justify-between items-center mx-auto max-w-2xl gap-4">
              <button
                onClick={handleGoBack}
                className="group inline-flex items-center gap-2 px-6 py-3 border border-charcoal/30 text-charcoal font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:border-rose-gold hover:text-rose-gold"
              >
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                <span>Takaisin</span>
              </button>
              <form action={handlePaytrailCheckout}>
                <CheckoutButton disabled={!selectedShipping} />
              </form>
            </div>
          </>
        )}

        {step === paymentStep && paytrailData && (
          <>
            <div className="mt-6 flex justify-start mx-auto max-w-screen-2xl">
              {/* Frozen while a PayPal checkout is in flight: its click has
                  already released the Paytrail order backing these forms */}
              <PaymentSelection
                paytrailData={paytrailData}
                disabled={isLoading}
              />
            </div>

            {/* PayPal below the Paytrail provider grid, equal-weight option.
                Its click releases the already-created Paytrail pending order
                first, so stock is never reserved twice. */}
            {showPaypal && (
              <div className="mt-10 mx-auto max-w-2xl flex flex-col items-center gap-4">
                <div className="flex items-center gap-4 w-full max-w-xs">
                  <div className="flex-1 h-[1px] bg-charcoal/20" />
                  <span className="text-sm text-charcoal/60 font-secondary uppercase tracking-wider">
                    tai
                  </span>
                  <div className="flex-1 h-[1px] bg-charcoal/20" />
                </div>
                <PayPalPayButton
                  customerData={customerData}
                  shipment={chosenShipmentMethodForApi()}
                  ticketHolders={ticketHolders}
                  disabled={isLoading}
                  onLoadingChange={setIsLoading}
                  onBeforeCheckout={releasePreviousOrder}
                  onCheckoutFailed={handlePaypalFailed}
                  cartItems={cartItems}
                  cartTotal={cartTotalAfterDiscount}
                  discountCode={discount?.code}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaytrailCheckoutPage;
