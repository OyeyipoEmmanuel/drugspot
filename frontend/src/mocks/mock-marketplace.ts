import type {
  CheckoutInput,
  MarketplaceFilters,
  Order,
  OrderStatus,
  Pharmacy,
  PreOrderRequest,
  Product,
} from "@/types/marketplace";

const ORDERS_KEY = "drugspot-mock-orders";
const PREORDERS_KEY = "drugspot-mock-preorders";

export const seedPharmacies: Pharmacy[] = [
  {
    id: "pharm-bluecare",
    name: "BlueCare Pharmacy",
    verified: true,
    rating: 4.8,
    reviewCount: 284,
    address: "18 Admiralty Way, Lekki Phase 1, Lagos",
    area: "Lekki",
    distanceKm: 1.8,
    phone: "+234 800 555 0142",
    hours: "Open today · 8:00 AM–9:00 PM",
    supportsDelivery: true,
    supportsPickup: true,
    deliveryFee: 1500,
    description: "A licensed community pharmacy providing prescription review, medicine counselling, pickup, and same-day local delivery.",
  },
  {
    id: "pharm-healthfirst",
    name: "HealthFirst Pharmacy",
    verified: true,
    rating: 4.6,
    reviewCount: 176,
    address: "4 Fola Osibo Street, Lekki, Lagos",
    area: "Lekki",
    distanceKm: 3.2,
    phone: "+234 800 555 0191",
    hours: "Open today · 7:30 AM–8:30 PM",
    supportsDelivery: true,
    supportsPickup: true,
    deliveryFee: 1200,
    description: "Verified pharmacy with a focus on chronic-care refills, wellness products, and pharmacist-led support.",
  },
  {
    id: "pharm-medpoint",
    name: "MedPoint Pharmacy",
    verified: true,
    rating: 4.7,
    reviewCount: 98,
    address: "22 Awolowo Road, Ikoyi, Lagos",
    area: "Ikoyi",
    distanceKm: 5.7,
    phone: "+234 800 555 0175",
    hours: "Open today · 9:00 AM–7:00 PM",
    supportsDelivery: false,
    supportsPickup: true,
    deliveryFee: 0,
    description: "Licensed pharmacy premises offering pharmacist review, prescription fulfilment, and scheduled pickup.",
  },
];

export const seedProducts: Product[] = [
  {
    id: "prod-paracetamol",
    name: "Paracetamol",
    genericName: "Paracetamol",
    brand: "Emzor",
    category: "Pain & fever",
    form: "Tablet",
    strength: "500 mg",
    packSize: "20 tablets",
    description: "Pain and fever relief. Use only as directed on the label or by a healthcare professional.",
    requiresPrescription: false,
    requiresPharmacistReview: false,
    offers: [
      { id: "offer-para-blue", pharmacyId: "pharm-bluecare", price: 850, stockCount: 24, stockStatus: "available", preorderSupported: false },
      { id: "offer-para-health", pharmacyId: "pharm-healthfirst", price: 780, stockCount: 9, stockStatus: "available", preorderSupported: false },
    ],
  },
  {
    id: "prod-amoxicillin",
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    brand: "Beecham",
    category: "Prescription medicine",
    form: "Capsule",
    strength: "500 mg",
    packSize: "21 capsules",
    description: "Antibiotic medicine supplied only after prescription validation and pharmacy review.",
    requiresPrescription: true,
    requiresPharmacistReview: true,
    offers: [
      { id: "offer-amox-blue", pharmacyId: "pharm-bluecare", price: 6200, stockCount: 8, stockStatus: "available", preorderSupported: true },
      { id: "offer-amox-med", pharmacyId: "pharm-medpoint", price: 5900, stockCount: 3, stockStatus: "low_stock", preorderSupported: true },
    ],
  },
  {
    id: "prod-amlodipine",
    name: "Amlodipine",
    genericName: "Amlodipine besylate",
    brand: "Norvasc",
    category: "Heart health",
    form: "Tablet",
    strength: "5 mg",
    packSize: "30 tablets",
    description: "Prescription medicine used as directed by a qualified healthcare professional.",
    requiresPrescription: true,
    requiresPharmacistReview: true,
    offers: [
      { id: "offer-amlo-health", pharmacyId: "pharm-healthfirst", price: 4800, stockCount: 5, stockStatus: "low_stock", preorderSupported: true },
      { id: "offer-amlo-blue", pharmacyId: "pharm-bluecare", price: 5100, stockCount: 0, stockStatus: "out_of_stock", preorderSupported: true, estimatedRestockDate: "2026-09-29" },
    ],
  },
  {
    id: "prod-vitamin-c",
    name: "Vitamin C",
    genericName: "Ascorbic acid",
    brand: "HealthPlus",
    category: "Vitamins",
    form: "Effervescent tablet",
    strength: "1000 mg",
    packSize: "20 tablets",
    description: "Vitamin C supplement in a convenient effervescent tablet.",
    requiresPrescription: false,
    requiresPharmacistReview: false,
    offers: [
      { id: "offer-vit-health", pharmacyId: "pharm-healthfirst", price: 3950, stockCount: 18, stockStatus: "available", preorderSupported: false },
      { id: "offer-vit-blue", pharmacyId: "pharm-bluecare", price: 4200, stockCount: 14, stockStatus: "available", preorderSupported: false },
    ],
  },
  {
    id: "prod-cetirizine",
    name: "Cetirizine",
    genericName: "Cetirizine hydrochloride",
    brand: "Zyrtec",
    category: "Allergy",
    form: "Tablet",
    strength: "10 mg",
    packSize: "10 tablets",
    description: "Allergy symptom relief. Ask a pharmacist if you take other medicines or have questions.",
    requiresPrescription: false,
    requiresPharmacistReview: false,
    offers: [
      { id: "offer-cet-med", pharmacyId: "pharm-medpoint", price: 2700, stockCount: 0, stockStatus: "out_of_stock", preorderSupported: true, estimatedRestockDate: "2026-09-30" },
    ],
  },
];

const seedOrders: Order[] = [
  {
    id: "order-demo-1024",
    reference: "DSP-1024",
    pharmacy: seedPharmacies[0],
    items: [{ id: "oi-demo", productId: "prod-paracetamol", name: "Paracetamol", strength: "500 mg", quantity: 2, unitPrice: 850, requiresPrescription: false }],
    status: "preparing",
    paymentStatus: "paid",
    paymentMethod: "card",
    fulfillmentMethod: "pickup",
    recipientName: "Amara Okoro",
    phone: "+234 801 234 5678",
    subtotal: 1700,
    deliveryFee: 0,
    total: 1700,
    createdAt: "2026-09-24T10:15:00+01:00",
    timeline: makeTimeline("preparing", "pickup"),
  },
];

function pause(duration = 250) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function makeTimeline(currentStatus: OrderStatus, fulfillment: "delivery" | "pickup") {
  const statuses: { status: OrderStatus; label: string }[] = [
    { status: "placed", label: "Order placed" },
    { status: "pharmacy_review", label: "Pharmacy review" },
    { status: "accepted", label: "Order accepted" },
    { status: "preparing", label: "Preparing order" },
    fulfillment === "delivery"
      ? { status: "out_for_delivery", label: "Out for delivery" }
      : { status: "ready_for_pickup", label: "Ready for pickup" },
    { status: "completed", label: "Completed" },
  ];
  const currentIndex = Math.max(0, statuses.findIndex(({ status }) => status === currentStatus));
  return statuses.map((item, index) => ({
    id: `${item.status}-${index}`,
    ...item,
    complete: index <= currentIndex,
    occurredAt: index <= currentIndex ? new Date(Date.now() - (currentIndex - index) * 3_600_000).toISOString() : undefined,
  }));
}

function readOrders() {
  const saved = localStorage.getItem(ORDERS_KEY);
  if (!saved) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(seedOrders));
    return structuredClone(seedOrders);
  }
  return JSON.parse(saved) as Order[];
}

function readPreorders() {
  return JSON.parse(localStorage.getItem(PREORDERS_KEY) ?? "[]") as PreOrderRequest[];
}

export const mockMarketplace = {
  async listProducts(filters: MarketplaceFilters = {}) {
    await pause();
    const search = filters.search?.trim().toLowerCase() ?? "";
    return seedProducts.filter((product) => {
      const searchMatch = !search || [product.name, product.genericName, product.brand, product.category].some((value) => value.toLowerCase().includes(search));
      const categoryMatch = !filters.category || filters.category === "All" || product.category === filters.category;
      const availabilityMatch = !filters.availability || filters.availability === "all"
        || (filters.availability === "available" && product.offers.some((offer) => offer.stockStatus !== "out_of_stock"))
        || (filters.availability === "preorder" && product.offers.some((offer) => offer.stockStatus === "out_of_stock" && offer.preorderSupported));
      return searchMatch && categoryMatch && availabilityMatch;
    });
  },
  async product(id: string) {
    await pause();
    const product = seedProducts.find((item) => item.id === id);
    if (!product) throw new Error("Product not found.");
    return structuredClone(product);
  },
  async listPharmacies() {
    await pause();
    return structuredClone(seedPharmacies);
  },
  async pharmacy(id: string) {
    await pause();
    const pharmacy = seedPharmacies.find((item) => item.id === id);
    if (!pharmacy) throw new Error("Pharmacy not found.");
    return {
      pharmacy: structuredClone(pharmacy),
      products: seedProducts.filter((product) => product.offers.some((offer) => offer.pharmacyId === id)),
    };
  },
  async listOrders() {
    await pause();
    return readOrders();
  },
  async order(id: string) {
    await pause();
    const order = readOrders().find((item) => item.id === id);
    if (!order) throw new Error("Order not found.");
    return order;
  },
  async checkout(input: CheckoutInput) {
    await pause(600);
    if (!input.items.length) throw new Error("Your cart is empty.");
    const pharmacy = input.items[0].pharmacy;
    const subtotal = input.items.reduce((sum, item) => sum + item.offer.price * item.quantity, 0);
    const deliveryFee = input.fulfillmentMethod === "delivery" ? pharmacy.deliveryFee : 0;
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      reference: `DSP-${Math.floor(1000 + Math.random() * 9000)}`,
      pharmacy,
      items: input.items.map((item) => ({ id: crypto.randomUUID(), productId: item.product.id, name: item.product.name, strength: item.product.strength, quantity: item.quantity, unitPrice: item.offer.price, requiresPrescription: item.product.requiresPrescription })),
      status: input.items.some((item) => item.product.requiresPharmacistReview) ? "pharmacy_review" : "placed",
      paymentStatus: input.paymentMethod === "cash_on_delivery" ? "pending" : "paid",
      paymentMethod: input.paymentMethod,
      fulfillmentMethod: input.fulfillmentMethod,
      recipientName: input.recipientName,
      phone: input.phone,
      deliveryAddress: input.deliveryAddress,
      prescriptionFileName: input.prescriptionFileName,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      createdAt: now,
      timeline: makeTimeline(input.items.some((item) => item.product.requiresPharmacistReview) ? "pharmacy_review" : "placed", input.fulfillmentMethod),
    };
    const orders = readOrders();
    localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...orders]));
    return order;
  },
  async preorder(productId: string, pharmacyId: string, quantity: number) {
    await pause();
    const product = seedProducts.find((item) => item.id === productId);
    const pharmacy = seedPharmacies.find((item) => item.id === pharmacyId);
    const offer = product?.offers.find((item) => item.pharmacyId === pharmacyId);
    if (!product || !pharmacy || !offer?.preorderSupported) throw new Error("Pre-order is not available for this item.");
    const request: PreOrderRequest = { id: crypto.randomUUID(), productId, productName: product.name, pharmacyId, pharmacyName: pharmacy.name, quantity, status: "requested", requestedAt: new Date().toISOString(), estimatedRestockDate: offer.estimatedRestockDate };
    localStorage.setItem(PREORDERS_KEY, JSON.stringify([request, ...readPreorders()]));
    return request;
  },
};
