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

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────');
console.log('Tests passed: ' + passed);
console.log('Tests failed: ' + failed);
console.log('─────────────────────────────\n');

if (failed > 0) {
  process.exit(1);
}
