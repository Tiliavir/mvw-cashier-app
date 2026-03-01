'use strict';
/**
 * Unit tests for models.js and storage.js (Node.js compatible, no test framework needed)
 */

const Models = require('../models.js');

// Minimal localStorage stub for storage.js
global.localStorage = {
  _store: {},
  getItem(key) { return this._store[key] || null; },
  setItem(key, value) { this._store[key] = String(value); },
  removeItem(key) { delete this._store[key]; },
};

const Storage = require('../storage.js');

// ─── Test runner ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log('  ✓ ' + description);
    passed++;
  } catch (e) {
    console.error('  ✗ ' + description);
    console.error('    ' + e.message);
    failed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || '') + ' — expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
  }
}

function assertClose(actual, expected, msg) {
  if (Math.abs(actual - expected) > 0.001) {
    throw new Error((msg || '') + ' — expected ' + expected + ' but got ' + actual);
  }
}

function assertDefined(value, msg) {
  if (value === undefined || value === null) {
    throw new Error((msg || 'value') + ' should not be null/undefined');
  }
}

// ─── Models tests ──────────────────────────────────────────────────────────────
console.log('\nModels:');

test('safeParseFloat parses valid number', function () {
  assertEqual(Models.safeParseFloat('3.5'), 3.5);
});

test('safeParseFloat returns 0 for NaN', function () {
  assertEqual(Models.safeParseFloat('abc'), 0);
});

test('safeParseFloat returns 0 for empty string', function () {
  assertEqual(Models.safeParseFloat(''), 0);
});

test('safeParseFloat handles negative values', function () {
  assertEqual(Models.safeParseFloat('-2.00'), -2);
});

test('calculateTotal returns correct sum', function () {
  const items = [
    { id: 'a', price: 2.5 },
    { id: 'b', price: 3.0 },
  ];
  const map = Models.buildItemsMap(items);
  const cart = { a: 2, b: 1 };
  assertClose(Models.calculateTotal(cart, map), 8.0);
});

test('calculateTotal handles negative prices (Pfand)', function () {
  const items = [
    { id: 'a', price: 2.5 },
    { id: 'pfand', price: -2.0 },
  ];
  const map = Models.buildItemsMap(items);
  const cart = { a: 1, pfand: 1 };
  assertClose(Models.calculateTotal(cart, map), 0.5);
});

test('calculateTotal returns 0 for empty cart', function () {
  assertEqual(Models.calculateTotal({}, {}), 0);
});

test('calculateChange returns correct change', function () {
  assertClose(Models.calculateChange(8.0, 10.0), 2.0);
});

test('calculateChange returns 0 when received less than total', function () {
  assertEqual(Models.calculateChange(8.0, 5.0), 0);
});

test('calculateChange returns 0 for negative received', function () {
  assertEqual(Models.calculateChange(5.0, -1), 0);
});

test('calculateTip returns correct tip', function () {
  // total=8, received=10, change=2 → tip=0
  assertClose(Models.calculateTip(8.0, 10.0, 2.0), 0);
});

test('calculateTip returns tip when no change given back', function () {
  // total=8, received=10, change=0 → tip=2
  assertClose(Models.calculateTip(8.0, 10.0, 0), 2.0);
});

test('calculateTip returns 0 for negative received', function () {
  assertEqual(Models.calculateTip(5.0, -1, 0), 0);
});

test('createEvent sets correct fields', function () {
  const e = Models.createEvent('Test Event');
  assertEqual(e.name, 'Test Event');
  assertEqual(e.closed, false);
  assertEqual(Array.isArray(e.items), true);
  assertEqual(Array.isArray(e.transactions), true);
  assertDefined(e.id);
  assertDefined(e.createdAt);
});

test('createItem sets correct fields', function () {
  const item = Models.createItem('Bratwurst', '2.50', 'rot');
  assertEqual(item.name, 'Bratwurst');
  assertClose(item.price, 2.5);
  assertEqual(item.color, 'rot');
  assertDefined(item.id);
});

test('createItem parses price correctly', function () {
  const item = Models.createItem('Pfand', '-2.00', 'hellgrau');
  assertClose(item.price, -2.0);
});

test('buildItemsMap creates lookup by id', function () {
  const items = [{ id: 'x', price: 1 }, { id: 'y', price: 2 }];
  const map = Models.buildItemsMap(items);
  assertEqual(map['x'].price, 1);
  assertEqual(map['y'].price, 2);
});

test('calculateEventTotals sums transactions correctly', function () {
  const event = {
    transactions: [
      { total: 5.0, tip: 1.0 },
      { total: 3.0, tip: 0.5 },
    ],
  };
  const result = Models.calculateEventTotals(event);
  assertClose(result.revenue, 8.0);
  assertClose(result.tip, 1.5);
  assertEqual(result.transactionCount, 2);
});

test('calculateEventTotals returns zeros for no transactions', function () {
  const event = { transactions: [] };
  const result = Models.calculateEventTotals(event);
  assertEqual(result.revenue, 0);
  assertEqual(result.tip, 0);
  assertEqual(result.transactionCount, 0);
});

test('generateId returns non-empty string', function () {
  const id = Models.generateId();
  assertEqual(typeof id, 'string');
  assertEqual(id.length > 0, true);
});

test('generateId returns unique values', function () {
  const ids = new Set();
  for (let i = 0; i < 100; i++) ids.add(Models.generateId());
  assertEqual(ids.size, 100, 'All IDs should be unique');
});

test('calculateItemsSold returns correct quantities and revenue', function () {
  const item1 = Models.createItem('Bier', '2.50', '#e67e22');
  const item2 = Models.createItem('Wasser', '1.50', '#85c1e9');
  const event = Models.createEvent('Test');
  event.items = [item1, item2];
  event.transactions = [
    { items: [{ itemId: item1.id, quantity: 2 }, { itemId: item2.id, quantity: 1 }], total: 6.5, tip: 0 },
    { items: [{ itemId: item1.id, quantity: 1 }], total: 2.5, tip: 0 },
  ];
  const sold = Models.calculateItemsSold(event);
  assertEqual(sold[item1.id].name, 'Bier');
  assertEqual(sold[item1.id].quantity, 3);
  assertClose(sold[item1.id].revenue, 7.5);
  assertEqual(sold[item2.id].name, 'Wasser');
  assertEqual(sold[item2.id].quantity, 1);
  assertClose(sold[item2.id].revenue, 1.5);
});

test('calculateItemsSold returns empty object for no transactions', function () {
  const event = Models.createEvent('Test');
  event.items = [Models.createItem('Bier', '2.50', '#000')];
  event.transactions = [];
  const sold = Models.calculateItemsSold(event);
  assertEqual(Object.keys(sold).length, 0);
});

test('calculateItemsSold ignores unknown itemIds', function () {
  const event = Models.createEvent('Test');
  event.items = [];
  event.transactions = [
    { items: [{ itemId: 'nonexistent', quantity: 1 }], total: 0, tip: 0 },
  ];
  const sold = Models.calculateItemsSold(event);
  assertEqual(Object.keys(sold).length, 0);
});

test('calculateItemsSold handles mix of known and unknown itemIds', function () {
  const item = Models.createItem('Bier', '2.50', '#f80');
  const event = Models.createEvent('Test');
  event.items = [item];
  event.transactions = [
    { items: [{ itemId: item.id, quantity: 1 }, { itemId: 'ghost', quantity: 5 }], total: 2.5, tip: 0 },
  ];
  const sold = Models.calculateItemsSold(event);
  assertEqual(Object.keys(sold).length, 1, 'only the known item is counted');
  assertEqual(sold[item.id].quantity, 1);
  assertClose(sold[item.id].revenue, 2.5);
});

// ─── Storage tests ─────────────────────────────────────────────────────────────
console.log('\nStorage:');

test('defaultState returns empty state', function () {
  const s = Storage.defaultState();
  assertEqual(Array.isArray(s.events), true);
  assertEqual(s.events.length, 0);
  assertEqual(s.activeEventId, null);
});

test('loadState returns default on empty localStorage', function () {
  global.localStorage._store = {};
  const s = Storage.loadState();
  assertEqual(s.events.length, 0);
});

test('loadState returns default on invalid JSON', function () {
  global.localStorage._store[Storage.STORAGE_KEY] = 'not-json{{{';
  const s = Storage.loadState();
  assertEqual(s.events.length, 0);
});

test('addEvent adds event and sets activeEventId', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Sommerfest');
  state = Storage.addEvent(state, event);
  assertEqual(state.events.length, 1);
  assertEqual(state.activeEventId, event.id);
});

test('getActiveEvent returns correct event', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Sommerfest');
  state = Storage.addEvent(state, event);
  const active = Storage.getActiveEvent(state);
  assertDefined(active);
  assertEqual(active.id, event.id);
});

test('getActiveEvent returns null when no active event', function () {
  const state = Storage.defaultState();
  const active = Storage.getActiveEvent(state);
  assertEqual(active, null);
});

test('addItemToEvent adds item to event', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Test');
  state = Storage.addEvent(state, event);
  const item = Models.createItem('Bratwurst', 2.5, 'rot');
  state = Storage.addItemToEvent(state, event.id, item);
  const active = Storage.getActiveEvent(state);
  assertEqual(active.items.length, 1);
  assertEqual(active.items[0].name, 'Bratwurst');
});

test('removeItemFromEvent removes item', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Test');
  state = Storage.addEvent(state, event);
  const item = Models.createItem('Bratwurst', 2.5, 'rot');
  state = Storage.addItemToEvent(state, event.id, item);
  state = Storage.removeItemFromEvent(state, event.id, item.id);
  const active = Storage.getActiveEvent(state);
  assertEqual(active.items.length, 0);
});

test('addTransaction records transaction', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Test');
  state = Storage.addEvent(state, event);
  const tx = Models.createTransaction([], 5.0, 10.0, 5.0, 0);
  state = Storage.addTransaction(state, event.id, tx);
  const active = Storage.getActiveEvent(state);
  assertEqual(active.transactions.length, 1);
  assertClose(active.transactions[0].total, 5.0);
});

test('closeEvent sets closed=true and clears activeEventId', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Test');
  state = Storage.addEvent(state, event);
  state = Storage.closeEvent(state, event.id);
  assertEqual(state.events[0].closed, true);
  assertEqual(state.activeEventId, null);
});

test('setActiveEvent updates activeEventId', function () {
  let state = Storage.defaultState();
  const e1 = Models.createEvent('E1');
  const e2 = Models.createEvent('E2');
  state = Storage.addEvent(state, e1);
  state = Storage.addEvent(state, e2);
  state = Storage.setActiveEvent(state, e1.id);
  assertEqual(state.activeEventId, e1.id);
});

test('resetState clears localStorage and returns default', function () {
  global.localStorage._store[Storage.STORAGE_KEY] = '{"events":[],"activeEventId":null}';
  const s = Storage.resetState();
  assertEqual(s.events.length, 0);
  assertEqual(global.localStorage._store[Storage.STORAGE_KEY], undefined);
});

test('updateItemInEvent updates item fields', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Test');
  state = Storage.addEvent(state, event);
  const item = Models.createItem('Alt', '1.00', '#aaaaaa');
  state = Storage.addItemToEvent(state, event.id, item);
  const updated = Object.assign({}, item, { name: 'Neu', price: 2.5, color: '#ff0000' });
  state = Storage.updateItemInEvent(state, event.id, updated);
  const active = Storage.getActiveEvent(state);
  assertEqual(active.items[0].name, 'Neu');
  assertClose(active.items[0].price, 2.5);
  assertEqual(active.items[0].color, '#ff0000');
  assertEqual(active.items[0].id, item.id, 'id must not change');
});

test('updateItemInEvent is a no-op for unknown event', function () {
  let state = Storage.defaultState();
  const item = Models.createItem('X', '1.00', '#000');
  const stateBefore = state;
  const stateAfter = Storage.updateItemInEvent(state, 'nonexistent', item);
  assertEqual(stateAfter.events.length, stateBefore.events.length);
});

test('reorderItemsInEvent reorders items in event', function () {
  let state = Storage.defaultState();
  const event = Models.createEvent('Test');
  state = Storage.addEvent(state, event);
  const a = Models.createItem('A', '1.00', '#aaa');
  const b = Models.createItem('B', '2.00', '#bbb');
  state = Storage.addItemToEvent(state, event.id, a);
  state = Storage.addItemToEvent(state, event.id, b);
  const reordered = [b, a];
  state = Storage.reorderItemsInEvent(state, event.id, reordered);
  const active = Storage.getActiveEvent(state);
  assertEqual(active.items[0].name, 'B');
  assertEqual(active.items[1].name, 'A');
});

// ─── Drag-and-drop reorder helper (mirrors app.js logic) ─────────────────────
console.log('\nReorder logic (drag-and-drop):');

function reorderItems(items, srcId, dstId) {
  const arr = items.slice();
  const srcIdx = arr.findIndex(function (i) { return i.id === srcId; });
  const dstIdx = arr.findIndex(function (i) { return i.id === dstId; });
  if (srcIdx < 0 || dstIdx < 0 || srcIdx === dstIdx) return arr;
  const moved = arr.splice(srcIdx, 1)[0];
  arr.splice(dstIdx, 0, moved);
  return arr;
}

test('reorder moves item from index 0 to index 2', function () {
  const items = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
  ];
  const result = reorderItems(items, 'a', 'c');
  assertEqual(result[0].id, 'b');
  assertEqual(result[1].id, 'c');
  assertEqual(result[2].id, 'a');
});

test('reorder moves item from last to first', function () {
  const items = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
  ];
  const result = reorderItems(items, 'c', 'a');
  assertEqual(result[0].id, 'c');
  assertEqual(result[1].id, 'a');
  assertEqual(result[2].id, 'b');
});

test('reorder is a no-op when src equals dst', function () {
  const items = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ];
  const result = reorderItems(items, 'a', 'a');
  assertEqual(result[0].id, 'a');
  assertEqual(result[1].id, 'b');
});

test('reorder does not mutate original array', function () {
  const items = [
    { id: 'a', name: 'A' },
    { id: 'b', name: 'B' },
  ];
  reorderItems(items, 'a', 'b');
  assertEqual(items[0].id, 'a', 'original should be unchanged');
});

// ─── Inline-edit item update (mirrors app.js logic) ──────────────────────────
console.log('\nInline-edit item update:');

test('updateItem in pendingItems updates name, price and color', function () {
  let pendingItems = [
    Models.createItem('Alt', '1.00', '#aaaaaa'),
  ];
  const id = pendingItems[0].id;
  const idx = pendingItems.findIndex(function (i) { return i.id === id; });
  pendingItems[idx] = Object.assign({}, pendingItems[idx], {
    name: 'Neu',
    price: Models.safeParseFloat('2.50'),
    color: '#ff0000',
  });
  assertEqual(pendingItems[0].name, 'Neu');
  assertClose(pendingItems[0].price, 2.5);
  assertEqual(pendingItems[0].color, '#ff0000');
  assertEqual(pendingItems[0].id, id, 'id must not change');
});

// ─── Manual tip override logic (mirrors app.js next-tx handler) ───────────────
console.log('\nManual tip override:');

test('manual tip calculates change as received - total - tip', function () {
  const total = 7.5;
  const received = 10.0;
  const manualTip = 0.5;
  const change = Math.max(0, Math.round((received - total - manualTip) * 100) / 100);
  assertClose(change, 2.0);
});

test('manual tip clamps change to 0 if tip exceeds available amount', function () {
  const total = 7.5;
  const received = 8.0;
  const manualTip = 5.0; // more than the 0.5 surplus
  const change = Math.max(0, Math.round((received - total - manualTip) * 100) / 100);
  assertEqual(change, 0);
});


// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────');
console.log('Tests passed: ' + passed);
console.log('Tests failed: ' + failed);
console.log('─────────────────────────────\n');

if (failed > 0) {
  process.exit(1);
}
