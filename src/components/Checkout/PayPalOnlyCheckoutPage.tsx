"use client";

import { useState } from "react";

import CustomerDataForm from "@/components/Checkout/CustomerDataForm";
import TicketHoldersForm from "@/components/Checkout/TicketHoldersForm";
import { useCart } from "@/hooks/use-cart";
import { CustomerData } from "@/lib/zodSchemas";
import {
  SelectShipmentMethod,
  type ShipmentSelection,
} from "@/components/Checkout/SelectShipmentMethod";
import {
  calculateCartWithCampaigns,
  type Campaign,
  type ShipmentMethodsResponse,
  type TicketHolderData,
} from "@putiikkipalvelu/storefront-sdk";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";
import { CheckoutSteps } from "@/components/Checkout/CheckoutSteps";
import { getShippingOptions } from "@/lib/actions/shipmentActions";
import { PayPalPayButton } from "./PayPalPayButton";

/**
 * Checkout for stores whose only payment method is PayPal. Stripe-page shape:
 * no payment-method step of its own — the PayPal button is the terminal action
 * on the shipping step (or right after customer data / ticket holders when
 * nothing ships). No pending order exists until the buyer clicks.
 */
const PayPalOnlyCheckoutPage = ({ campaigns }: { campaigns: Campaign[] }) => {
  const { toast } = useToast();
  const { items: cartItems, discount } = useCart();
  const { cartTotal } = calculateCartWithCampaigns(cartItems, campaigns);

  const discountAmount = discount
    ? discount.discountType === "PERCENTAGE"
      ? Math.round((cartTotal * discount.discountValue) / 100)
      : discount.discountValue
    : 0;
  const cartTotalAfterDiscount = cartTotal - discountAmount;

  const requiresShipping = cartItems.some(
    (item) => !item.isTicket && !item.isDigital
  );
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
  const [ticketHolders, setTicketHolders] = useState<
    Record<string, TicketHolderData[]> | undefined
  >(undefined);

  const buildSteps = () => {
    const s: { number: number; title: string }[] = [
      { number: 1, title: "Asiakastiedot" },
    ];
    if (requiresHolders) {
      s.push({ number: s.length + 1, title: "Lipun haltijat" });
    }
    if (requiresShipping) {
      // Payment happens ON the shipping step (the PayPal button renders
      // there) — a separate "Maksutapa" step would never be reached
      s.push({ number: s.length + 1, title: "Toimitus ja maksu" });
    } else {
      s.push({ number: s.length + 1, title: "Maksutapa" });
    }
    return s;
  };
  const steps = buildSteps();

  const holdersStep = requiresHolders ? 2 : -1;
  const shippingStep = requiresShipping ? (requiresHolders ? 3 : 2) : -1;
  const paymentStep = steps[steps.length - 1].number;

  const handleCustomerDataSubmit = async (data: CustomerData) => {
    setIsLoading(true);
    setCustomerData(data);
    if (!data) {
      return;
    }

    if (requiresHolders) {
      setStep(holdersStep);
      setIsLoading(false);
      return;
    }

    if (!requiresShipping) {
      setStep(paymentStep);
      setIsLoading(false);
      return;
    }

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

    if (!requiresShipping) {
      setStep(paymentStep);
      setIsLoading(false);
      return;
    }

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

  const handleGoBack = () => {
    if (step > 1) {
      const newStep = step - 1;
      setStep(newStep);
      if (newStep === 1) {
        setSelectedShipping(null);
      }
    }
  };

  const paypalButton = (shipmentRequired: boolean) => (
    <PayPalPayButton
      customerData={customerData}
      shipment={
        selectedShipping
          ? {
              shipmentMethodId: selectedShipping.shipmentMethodId,
              pickupId: selectedShipping.pickupPointId,
              serviceId: selectedShipping.serviceId,
            }
          : null
      }
      ticketHolders={ticketHolders}
      disabled={(shipmentRequired && !selectedShipping) || isLoading}
      onLoadingChange={setIsLoading}
      cartItems={cartItems}
      cartTotal={cartTotalAfterDiscount}
      discountCode={discount?.code}
    />
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 mt-24 md:mt-48 mb-12">
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
            {paypalButton(true)}
          </div>
        </>
      )}

      {step === paymentStep && !requiresShipping && (
        <div className="mt-12 flex justify-center mx-auto max-w-2xl">
          {paypalButton(false)}
        </div>
      )}
    </div>
  );
};

export default PayPalOnlyCheckoutPage;
