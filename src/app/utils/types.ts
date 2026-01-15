// =============================================================================
// Types from SDK (use imports instead of duplicating):
// =============================================================================
// Shipping: ShipmentMethodsResponse, HomeDeliveryOption, PickupPointOption, OpeningHours
// Customer: Customer (use instead of User), CustomerOrder, OrderLineItem, etc.
// Pricing: PriceInfo
// =============================================================================

export interface ShipitResponse {
  status: string;
  number: number;
  trackingNumber: string;
  trackingUrls: string[];
  orderId: string;
  freightDoc: string[];
}

export type OrderData = {
  status: string;
  orderShipmentMethod: {
    id: string;
    name: string;
    price: number;
    vatRate: number;
    logo: string;
  };
  orderCustomerData: {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string;
  };

  shipitData?: ShipitResponse;
};

// PriceInfo - now exported from SDK, keeping local for custom getPriceInfo function
export interface PriceInfo {
  currentPrice: number;
  salePrice: number | null;
  salePercent: string | null;
  isOnSale: boolean;
}

// ShipitShippingMethod kept for Order type (checkout/payment flow)
export interface ShipitShippingMethod {
  id: string;
  serviceIds: string[];
  name: string;
  carriers: string[];
  logos: string[];
  pickUpIncluded: boolean;
  homeDelivery: boolean;
  worldwideDelivery: boolean;
  fragile: boolean;
  domesticDeliveries: boolean;
  information?: string | null;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  height: number;
  length: number;
  type: string;
  width: number;
  price: number;
  weight: number;
  showPickupPoints: boolean;
}

export type OrderCustomerData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address: string;
  city: string;
  postalCode: string;
};

export interface OrderLineItems {
  id: string;
  orderId: string;
  itemType: ItemType;
  quantity: number;
  price: number;
  totalAmount: number;
  productCode: string;
  name: string;
  vatRate: number;
  images: string[];
}

export type PreOrderLineItems = {
  itemType: string;
  quantity: number;
  price: number;
  vatRate: number;
};

export type OrderShipmentMethod = {
  id: string;
  serviceId?: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  price: number;
  orderId: string;
  vatRate?: number | null;
  trackingNumber?: string;
  trackingUrls?: string[];
  shipmentNumber?: string;
  freightDoc?: string[];
};

export interface Order {
  id: string;
  storeId?: string;
  createdAt: Date;
  totalAmount: number;
  status: OrderStatus;
  paytrailTransactionId?: string;
  shipitShippingMethodId?: string;
  shipitOrderId?: string;
  trackingNumber?: string;
  trackingUrls: string[];
  freightDoc: string[];
  orderNumber: number;
  customerDataId?: string;
  orderCustomerData?: OrderCustomerData;
  ShipitShippingMethod?: ShipitShippingMethod;
  orderShipmentMethod?: OrderShipmentMethod;
  OrderLineItems: OrderLineItems[];
}

export enum OrderStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  SHIPPED = "SHIPPED",
}

export enum ItemType {
  SHIPPING = "SHIPPING",
  VARIATION = "VARIATION",
  PRODUCT = "PRODUCT",
}

export type StoreName = {
  name: string;
};

export type StoreSettingsWithName = {
  id: string;
  storeId: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  currency: string;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
  defaultVatRate: number;
  logoUrl: string | null;
  Store: StoreName;
};

// User type replaced by Customer from SDK:
// import { Customer } from '@putiikkipalvelu/storefront-sdk';
