"use client";

import { useState } from "react";

import CustomerDataForm from "@/components/Checkout/CustomerDataForm";
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
} from "@putiikkipalvelu/storefront-sdk";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";
import { CheckoutSteps } from "@/components/Checkout/CheckoutSteps";
import { getShippingOptions } from "@/lib/actions/shipmentActions";
import { CheckoutButton } from "../Cart/CheckoutButton";
import { apiCreatePaytrailCheckoutSession } from "@/lib/actions/paytrailActions";
import PaymentSelection from "./PaytrailPaymentSelection";

const PaytrailCheckoutPage = ({ campaigns }: { campaigns: Campaign[] }) => {
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

  // Ticket-only carts don't need shipping
  const requiresShipping = cartItems.some((item) => !item.isTicket);

  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [shippingOptions, setShippingOptions] =
    useState<ShipmentMethodsResponse | null>(null);
  const [step, setStep] = useState(1);
  const [selectedShipping, setSelectedShipping] =
    useState<ShipmentSelection | null>(null);
  const [paytrailData, setPaytrailData] =
    useState<PaytrailCheckoutResponse | null>(null);

  const steps = requiresShipping
    ? [
        { number: 1, title: "Asiakastiedot" },
        { number: 2, title: "Toimitustapa" },
        { number: 3, title: "Maksutapa" },
      ]
    : [
        { number: 1, title: "Asiakastiedot" },
        { number: 2, title: "Maksutapa" },
      ];

  const handleCustomerDataSubmit = async (data: CustomerData) => {
    setIsLoading(true);
    setCustomerData(data);
    if (!data) {
      return;
    }

    // Skip shipping for ticket-only carts — create Paytrail session directly
    if (!requiresShipping) {
      const result = await apiCreatePaytrailCheckoutSession(null, data);

      if (result.success) {
        setPaytrailData(result.data);
        setStep(2);
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
    // Pass campaigns and discountAmount for accurate free shipping calculation
    const result = await getShippingOptions(
      data.postal_code,
      cartItems,
      campaigns,
      discountAmount
    );

    if (result.success) {
      setShippingOptions(result.data);
      setStep(2);
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

  const handlePaytrailCheckout = async () => {
    const validationResult = customerDataSchema.safeParse(customerData);
    if (!validationResult.success) {
      console.error("Customer data validation failed:", validationResult.error);
      return;
    }

    const validatedCustomerData = validationResult.data;
    setIsLoading(true);

    // Convert to the format expected by the checkout API
    const chosenShipmentMethod = selectedShipping
      ? {
          shipmentMethodId: selectedShipping.shipmentMethodId,
          pickupId: selectedShipping.pickupPointId,
          serviceId: selectedShipping.serviceId,
        }
      : null;

    const result = await apiCreatePaytrailCheckoutSession(
      chosenShipmentMethod,
      validatedCustomerData
    );

    if (result.success) {
      setPaytrailData(result.data);
      setStep(3);
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

        {step === 2 && requiresShipping && (
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

        {step === 2 && !requiresShipping && paytrailData && (
          <div className="mt-6 flex justify-start mx-auto max-w-screen-2xl">
            <PaymentSelection paytrailData={paytrailData} />
          </div>
        )}

        {step === 3 && paytrailData && (
          <div className="mt-6 flex justify-start mx-auto max-w-screen-2xl">
            <PaymentSelection paytrailData={paytrailData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaytrailCheckoutPage;
