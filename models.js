'use strict';

// ─── Models namespace ─────────────────────────────────────────────────────────
var Models = (function () {

  // ─── UUID helper ─────────────────────────────────────────────────────────
  function generateId() {
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

  // ─── Model factories ─────────────────────────────────────────────────────
  function createEvent(name) {
    return {
      id: generateId(),
      name: String(name).trim(),
      createdAt: new Date().toISOString(),
      items: [],
      transactions: [],
      closed: false,
    };
  }

  function createItem(name, price, color) {
    const parsedPrice = safeParseFloat(price);
    return {
      id: generateId(),
      name: String(name).trim(),
      price: parsedPrice,
      color: String(color).trim(),
    };
  }

  function createTransaction(items, total, received, change, tip) {
    return {
      timestamp: new Date().toISOString(),
      items: items,
      total: total,
      received: received,
      change: change,
      tip: tip,
    };
  }

  // ─── Pure calculation functions ───────────────────────────────────────────
  function safeParseFloat(value) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  function calculateTotal(cart, itemsMap) {
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

  function calculateChange(total, received) {
    const r = safeParseFloat(received);
    if (r < 0) return 0;
    const change = r - total;
    return change < 0 ? 0 : Math.round(change * 100) / 100;
  }

  function calculateTip(total, received, change) {
    const r = safeParseFloat(received);
    if (r < 0) return 0;
    const tip = r - total - change;
    return tip < 0 ? 0 : Math.round(tip * 100) / 100;
  }

  function buildItemsMap(items) {
    const map = {};
    for (const item of items) {
      map[item.id] = item;
    }
    return map;
  }

  function calculateEventTotals(event) {
    let totalRevenue = 0;
    let totalTip = 0;
    for (const tx of event.transactions) {
      totalRevenue += tx.total;
      totalTip += tx.tip;
    }
    return {
      revenue: Math.round(totalRevenue * 100) / 100,
      tip: Math.round(totalTip * 100) / 100,
      transactionCount: event.transactions.length,
    };
  }

  function calculateItemsSold(event) {
    const sold = {};
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

  return {
    generateId,
    createEvent,
    createItem,
    createTransaction,
    safeParseFloat,
    calculateTotal,
    calculateChange,
    calculateTip,
    buildItemsMap,
    calculateEventTotals,
    calculateItemsSold,
  };
}());

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Models;
}

