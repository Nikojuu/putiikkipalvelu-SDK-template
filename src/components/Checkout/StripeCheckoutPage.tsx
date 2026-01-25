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
} from "@putiikkipalvelu/storefront-sdk";
import { useToast } from "@/hooks/use-toast";
import { XCircle, Loader2 } from "lucide-react";
import { CheckoutSteps } from "@/components/Checkout/CheckoutSteps";

import { getShippingOptions } from "@/lib/actions/shipmentActions";

import { useRouter } from "next/navigation";
import { apiCreateStripeCheckoutSession } from "@/lib/actions/stripeActions";

const StripeCheckoutPage = ({ campaigns }: { campaigns: Campaign[] }) => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [shippingOptions, setShippingOptions] =
    useState<ShipmentMethodsResponse | null>(null);
  const [step, setStep] = useState(1);
  const [selectedShipping, setSelectedShipping] =
    useState<ShipmentSelection | null>(null);

  const router = useRouter();

  const steps = [
    { number: 1, title: "Asiakastiedot" },
    { number: 2, title: "Toimitustapa" },
    { number: 3, title: "Tilausvahvistus" },
  ];

  const handleCustomerDataSubmit = async (data: CustomerData) => {
    setIsLoading(true);
    setCustomerData(data);
    if (!data) {
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
            <div className="flex flex-col"></div>
          </div>
        ),
      });
      console.error("Error fetching shipping options:", result.error);
    }

    setIsLoading(false);
  };

  const handleStripeCheckout = async () => {
    // Prevent double submission
    if (isLoading) return;
    setIsLoading(true);

    // Revalidate customer data with Zod schema
    const validationResult = customerDataSchema.safeParse(customerData);
    if (!validationResult.success) {
      console.error("Customer data validation failed:", validationResult.error);
      setIsLoading(false);
      return;
    }

    // Use the validated data
    const validatedCustomerData = validationResult.data;

    // Convert to the format expected by the checkout API
    const chosenShipmentMethod = selectedShipping
      ? {
          shipmentMethodId: selectedShipping.shipmentMethodId,
          pickupId: selectedShipping.pickupPointId,
          serviceId: selectedShipping.serviceId,
        }
      : null;

    const result = await apiCreateStripeCheckoutSession(
      chosenShipmentMethod,
      validatedCustomerData
    );

    if (result.success) {
      router.push(result.data.url);
    } else {
      console.error("Checkout error:", result.error);
      toast({
        title: "Virhe",
        description: result.error || "Maksun käsittely epäonnistui. Yritä uudelleen.",
        className: "bg-red-50 border-red-200",
      });
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step > 1) {
      const newStep = step - 1;
      setStep(newStep);

      // Reset data based on the new step
      if (newStep === 1) {
        // Reset shipping selection when going back
        setSelectedShipping(null);
      }
    }
  };

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

      {step === 2 && (
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
            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={!selectedShipping || isLoading}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-charcoal text-warm-white font-secondary text-sm tracking-wider uppercase transition-all duration-300 hover:bg-rose-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Odota</span>
                </>
              ) : (
                <>
                  <span>Siirry maksamaan</span>
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StripeCheckoutPage;
