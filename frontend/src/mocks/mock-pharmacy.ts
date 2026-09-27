import type { OrderStatus } from "@/types/marketplace";
import type { InventoryItem, InventoryStatus, InventoryUpdateInput, PharmacyCustomer, PharmacyDashboardSummary, PharmacyOrder, RefillRequest } from "@/types/pharmacy";

const INVENTORY_KEY = "drugspot-pharmacy-inventory";
const ORDERS_KEY = "drugspot-pharmacy-orders";
const REFILLS_KEY = "drugspot-pharmacy-refills";
const pause = (duration = 220) => new Promise((resolve) => window.setTimeout(resolve, duration));

const seedInventory: InventoryItem[] = [
  { id: "inv-amox", productName: "Amoxicillin", strength: "500 mg", sku: "AMX-500-20", category: "Antibiotics", stockCount: 8, reorderLevel: 12, unitPrice: 4800, requiresPrescription: true, status: "low_stock", updatedAt: "2026-09-27T08:10:00+01:00" },
  { id: "inv-par", productName: "Paracetamol", strength: "500 mg", sku: "PCM-500-24", category: "Pain relief", stockCount: 64, reorderLevel: 20, unitPrice: 1200, requiresPrescription: false, status: "in_stock", updatedAt: "2026-09-27T08:00:00+01:00" },
  { id: "inv-amlo", productName: "Amlodipine", strength: "5 mg", sku: "AML-005-30", category: "Cardiovascular", stockCount: 4, reorderLevel: 10, unitPrice: 3500, requiresPrescription: true, status: "low_stock", updatedAt: "2026-09-26T16:20:00+01:00" },
  { id: "inv-vitc", productName: "Vitamin C", strength: "1000 mg", sku: "VTC-1000-10", category: "Vitamins", stockCount: 31, reorderLevel: 8, unitPrice: 2900, requiresPrescription: false, status: "in_stock", updatedAt: "2026-09-26T12:00:00+01:00" },
  { id: "inv-cet", productName: "Cetirizine", strength: "10 mg", sku: "CTZ-010-10", category: "Allergy", stockCount: 0, reorderLevel: 10, unitPrice: 1800, requiresPrescription: false, status: "out_of_stock", updatedAt: "2026-09-25T14:30:00+01:00" },
];

const seedOrders: PharmacyOrder[] = [
  { id: "ph-order-1", reference: "DSP-4821", patientName: "Amara Okoro", patientPhone: "+234 801 234 5678", status: "pharmacy_review", paymentStatus: "paid", fulfillmentMethod: "delivery", total: 11100, createdAt: "2026-09-27T08:30:00+01:00", prescriptionFileName: "prescription-amara.pdf", items: [{ id: "poi-1", name: "Amoxicillin 500 mg", quantity: 2, unitPrice: 4800, requiresPrescription: true }] },
  { id: "ph-order-2", reference: "DSP-4760", patientName: "Tunde Adeyemi", patientPhone: "+234 802 111 9020", status: "accepted", paymentStatus: "paid", fulfillmentMethod: "pickup", total: 5300, createdAt: "2026-09-27T07:45:00+01:00", items: [{ id: "poi-2", name: "Paracetamol 500 mg", quantity: 2, unitPrice: 1200, requiresPrescription: false }, { id: "poi-3", name: "Vitamin C 1000 mg", quantity: 1, unitPrice: 2900, requiresPrescription: false }] },
  { id: "ph-order-3", reference: "DSP-4698", patientName: "Ngozi Eze", patientPhone: "+234 803 470 1102", status: "preparing", paymentStatus: "pending", fulfillmentMethod: "delivery", total: 5000, createdAt: "2026-09-26T15:10:00+01:00", items: [{ id: "poi-4", name: "Amlodipine 5 mg", quantity: 1, unitPrice: 3500, requiresPrescription: true }] },
  { id: "ph-order-4", reference: "DSP-4511", patientName: "Bola Yusuf", patientPhone: "+234 805 240 3022", status: "completed", paymentStatus: "paid", fulfillmentMethod: "pickup", total: 7600, createdAt: "2026-09-25T11:00:00+01:00", items: [{ id: "poi-5", name: "Vitamin C 1000 mg", quantity: 2, unitPrice: 2900, requiresPrescription: false }] },
];

const customers: PharmacyCustomer[] = [
  { id: "customer-1", name: "Amara Okoro", phone: "+234 801 234 5678", email: "amara@example.com", orderCount: 6, totalSpent: 48600, lastOrderAt: "2026-09-27T08:30:00+01:00" },
  { id: "customer-2", name: "Tunde Adeyemi", phone: "+234 802 111 9020", email: "tunde@example.com", orderCount: 3, totalSpent: 19700, lastOrderAt: "2026-09-27T07:45:00+01:00" },
  { id: "customer-3", name: "Ngozi Eze", phone: "+234 803 470 1102", email: "ngozi@example.com", orderCount: 9, totalSpent: 81300, lastOrderAt: "2026-09-26T15:10:00+01:00" },
];

const seedRefills: RefillRequest[] = [
  { id: "refill-1", patientName: "Amara Okoro", medicationName: "Amlodipine", strength: "5 mg", quantity: 1, status: "requested", requestedAt: "2026-09-27T08:05:00+01:00", notes: "Six doses remaining." },
  { id: "refill-2", patientName: "Ngozi Eze", medicationName: "Metformin", strength: "500 mg", quantity: 2, status: "accepted", requestedAt: "2026-09-26T13:20:00+01:00" },
  { id: "refill-3", patientName: "Bola Yusuf", medicationName: "Atorvastatin", strength: "20 mg", quantity: 1, status: "ready", requestedAt: "2026-09-25T09:40:00+01:00" },
];

function read<T>(key: string, seed: T[]): T[] { const stored = localStorage.getItem(key); if (stored) return JSON.parse(stored) as T[]; localStorage.setItem(key, JSON.stringify(seed)); return structuredClone(seed); }
function write<T>(key: string, items: T[]) { localStorage.setItem(key, JSON.stringify(items)); }
function inventoryStatus(stock: number, reorder: number): InventoryStatus { return stock === 0 ? "out_of_stock" : stock <= reorder ? "low_stock" : "in_stock"; }

export const mockPharmacy = {
  async dashboard(): Promise<PharmacyDashboardSummary> { await pause(); const orders = read(ORDERS_KEY, seedOrders); const inventory = read(INVENTORY_KEY, seedInventory); const refills = read(REFILLS_KEY, seedRefills); return { openOrders: orders.filter((item) => !["completed", "cancelled"].includes(item.status)).length, lowStockItems: inventory.filter((item) => item.status !== "in_stock").length, refillRequests: refills.filter((item) => item.status === "requested").length, todaySales: orders.filter((item) => item.paymentStatus === "paid" && item.createdAt.startsWith("2026-09-27")).reduce((sum, item) => sum + item.total, 0), weekSales: orders.filter((item) => item.paymentStatus === "paid").reduce((sum, item) => sum + item.total, 0), fulfilledThisWeek: orders.filter((item) => item.status === "completed").length, recentOrders: orders.slice(0, 4), lowStock: inventory.filter((item) => item.status !== "in_stock").slice(0, 4) }; },
  async orders() { await pause(); return read(ORDERS_KEY, seedOrders); },
  async updateOrderStatus(id: string, status: OrderStatus) { await pause(); const items = read(ORDERS_KEY, seedOrders); const order = items.find((item) => item.id === id); if (!order) throw new Error("Order not found."); order.status = status; write(ORDERS_KEY, items); return order; },
  async inventory() { await pause(); return read(INVENTORY_KEY, seedInventory); },
  async updateInventory(id: string, input: InventoryUpdateInput) { await pause(); const items = read(INVENTORY_KEY, seedInventory); const item = items.find((value) => value.id === id); if (!item) throw new Error("Inventory item not found."); Object.assign(item, input, { status: inventoryStatus(input.stockCount, input.reorderLevel), updatedAt: new Date().toISOString() }); write(INVENTORY_KEY, items); return item; },
  async customers() { await pause(); return structuredClone(customers); },
  async refills() { await pause(); return read(REFILLS_KEY, seedRefills); },
  async updateRefillStatus(id: string, status: RefillRequest["status"]) { await pause(); const items = read(REFILLS_KEY, seedRefills); const item = items.find((value) => value.id === id); if (!item) throw new Error("Refill request not found."); item.status = status; write(REFILLS_KEY, items); return item; },
};
