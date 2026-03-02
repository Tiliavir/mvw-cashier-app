// ─── UUID helper ─────────────────────────────────────────────────────
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Model interfaces ─────────────────────────────────────────────────
interface Event {
  id: string;
  name: string;
  createdAt: string;
  items: Item[];
  transactions: Transaction[];
  closed: boolean;
}

interface Item {
  id: string;
  name: string;
  price: number;
  color: string;
}

interface Transaction {
  timestamp: string;
  items: { itemId: string; quantity: number }[];
  total: number;
  received: number;
  change: number;
}

// ─── Model factories ─────────────────────────────────────────────────
function createEvent(name: string): Event {
  return {
    id: generateId(),
    name: String(name).trim(),
    createdAt: new Date().toISOString(),
    items: [],
    transactions: [],
    closed: false,
  };
}

function createItem(name: string, price: number | string, color: string): Item {
  const parsedPrice = safeParseFloat(price);
  return {
    id: generateId(),
    name: String(name).trim(),
    price: parsedPrice,
    color: String(color).trim(),
  };
}

function createTransaction(
  items: { itemId: string; quantity: number }[],
  total: number,
  received: number,
  change: number
): Transaction {
  return {
    timestamp: new Date().toISOString(),
    items: items,
    total: total,
    received: received,
    change: change,
  };
}

// ─── Pure calculation functions ───────────────────────────────────────
function safeParseFloat(value: string | number): number {
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

function calculateTotal(cart: Record<string, number>, itemsMap: Record<string, Item>): number {
  let total = 0;
  for (const itemId in cart) {
    const quantity = cart[itemId];
    const item = itemsMap[itemId];
    if (item && quantity > 0) {
      total += item.price * quantity;
    }
  }
  // Round to 2 decimal places to avoid floating point issues
  return Math.round(total * 100) / 100;
}

function calculateChange(total: number, received: number | string): number {
  const r = safeParseFloat(received);
  if (r < 0) return 0;
  const change = r - total;
  return change < 0 ? 0 : Math.round(change * 100) / 100;
}

function buildItemsMap(items: Item[]): Record<string, Item> {
  const map: Record<string, Item> = {};
  for (const item of items) {
    map[item.id] = item;
  }
  return map;
}

interface EventTotals {
  revenue: number;
  transactionCount: number;
}

function calculateEventTotals(event: Event): EventTotals {
  let totalRevenue = 0;
  for (const tx of event.transactions) {
    totalRevenue += tx.total;
  }
  return {
    revenue: Math.round(totalRevenue * 100) / 100,
    transactionCount: event.transactions.length,
  };
}

interface ItemSoldInfo {
  name: string;
  quantity: number;
  revenue: number;
}

function calculateItemsSold(event: Event): Record<string, ItemSoldInfo> {
  const sold: Record<string, ItemSoldInfo> = {};
  const itemsMap = buildItemsMap(event.items);
  for (const tx of event.transactions) {
    for (const txItem of tx.items) {
      const item = itemsMap[txItem.itemId];
      if (!item) continue;
      if (!sold[txItem.itemId]) {
        sold[txItem.itemId] = { name: item.name, quantity: 0, revenue: 0 };
      }
      sold[txItem.itemId].quantity += txItem.quantity;
      sold[txItem.itemId].revenue = Math.round(
        (sold[txItem.itemId].revenue + item.price * txItem.quantity) * 100
      ) / 100;
    }
  }
  return sold;
}

export const Models = {
  generateId,
  createEvent,
  createItem,
  createTransaction,
  safeParseFloat,
  calculateTotal,
  calculateChange,
  buildItemsMap,
  calculateEventTotals,
  calculateItemsSold,
};

export type { Event, Item, Transaction, EventTotals, ItemSoldInfo };

