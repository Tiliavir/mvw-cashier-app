'use strict';

// ─── App State ────────────────────────────────────────────────────────────────
const App = (function () {
  let state = null;
  // cart: { itemId: quantity }
  let cart = {};

  // ─── Init ────────────────────────────────────────────────────────────────
  function init() {
    state = Store.loadState();
    const active = Store.getActiveEvent(state);
    if (!active) {
      location.replace('create.html');
      return;
    }
    const title = document.getElementById('cashier-event-name');
    if (title) title.textContent = active.name;
    UI.renderItemGrid(active.items, cart);
    updateTransactionBar();
    bindEvents();
  }

  // ─── Transaction bar update ───────────────────────────────────────────────
  function updateTransactionBar() {
    const active = Store.getActiveEvent(state);
    if (!active) return;
    const itemsMap = Models.buildItemsMap(active.items);
    const total = Models.calculateTotal(cart, itemsMap);
    const receivedInput = document.getElementById('tx-received');
    const received = receivedInput ? Models.safeParseFloat(receivedInput.value) : 0;
    const safeReceived = received < 0 ? 0 : received;
    const change = Models.calculateChange(total, safeReceived);
    const tip = Models.calculateTip(total, safeReceived, change);
    UI.renderTransactionBar(total, safeReceived, change, tip);
  }

  // ─── Bind events ─────────────────────────────────────────────────────────
  function bindEvents() {
    // Per-tile debounce to prevent ghost-click double-counting on mobile
    const tileLastClick = {};

    // Item grid click: tile adds item, qty badge reduces
    on('item-grid', 'click', function (e) {
      const tile = e.target.closest('.item-tile');
      if (!tile) return;
      const id = tile.dataset.id;
      const now = Date.now();
      if (tileLastClick[id] && now - tileLastClick[id] < 300) return;
      tileLastClick[id] = now;
      if (e.target.closest('.tile-qty')) {
        if (cart[id] > 1) {
          cart[id]--;
        } else {
          delete cart[id];
        }
      } else {
        cart[id] = (cart[id] || 0) + 1;
      }
      const active = Store.getActiveEvent(state);
      if (active) UI.renderItemGrid(active.items, cart);
      updateTransactionBar();
    });

    // Cancel transaction
    on('btn-cancel-tx', 'click', function () {
      cart = {};
      const receivedInput = document.getElementById('tx-received');
      const tipInput = document.getElementById('tx-tip');
      if (receivedInput) receivedInput.value = '';
      if (tipInput) tipInput.value = '';
      const active = Store.getActiveEvent(state);
      if (active) UI.renderItemGrid(active.items, cart);
      updateTransactionBar();
    });

    // Received input
    on('tx-received', 'input', function () {
      updateTransactionBar();
    });

    // Tip input – user may override auto-calculated tip
    on('tx-tip', 'input', function () {
      const active = Store.getActiveEvent(state);
      if (!active) return;
      const itemsMap = Models.buildItemsMap(active.items);
      const total = Models.calculateTotal(cart, itemsMap);
      const receivedInput = document.getElementById('tx-received');
      const tipInput = document.getElementById('tx-tip');
      const received = receivedInput ? Models.safeParseFloat(receivedInput.value) : 0;
      const safeReceived = received < 0 ? 0 : received;
      const manualTip = tipInput ? Models.safeParseFloat(tipInput.value) : 0;
      const safeTip = manualTip < 0 ? 0 : manualTip;
      const change = Math.max(0, Math.round((safeReceived - total - safeTip) * 100) / 100);
      const changeEl = document.getElementById('tx-change');
      if (changeEl) changeEl.textContent = UI.formatCurrency(change);
    });

    // Next transaction
    on('btn-next-tx', 'click', function () {
      const active = Store.getActiveEvent(state);
      if (!active) return;

      const hasItems = Object.values(cart).some(function (q) { return q > 0; });
      if (!hasItems) { alert('Bitte mindestens einen Artikel auswählen.'); return; }

      const itemsMap = Models.buildItemsMap(active.items);
      const total = Models.calculateTotal(cart, itemsMap);
      const receivedInput = document.getElementById('tx-received');
      const tipInput = document.getElementById('tx-tip');
      const received = receivedInput ? Models.safeParseFloat(receivedInput.value) : 0;
      const safeReceived = received < 0 ? 0 : received;

      const tipRaw = tipInput ? tipInput.value : '';
      let tip, change;
      if (tipRaw !== '') {
        tip = Math.max(0, Models.safeParseFloat(tipRaw));
        change = Math.max(0, Math.round((safeReceived - total - tip) * 100) / 100);
      } else {
        change = Models.calculateChange(total, safeReceived);
        tip = Models.calculateTip(total, safeReceived, change);
      }

      const txItems = [];
      for (const itemId in cart) {
        if (cart[itemId] > 0) {
          txItems.push({ itemId: itemId, quantity: cart[itemId] });
        }
      }

      const tx = Models.createTransaction(txItems, total, safeReceived, change, tip);
      state = Store.addTransaction(state, active.id, tx);

      cart = {};
      if (receivedInput) receivedInput.value = '';
      if (tipInput) tipInput.value = '';
      const updatedActive = Store.getActiveEvent(state);
      if (updatedActive) UI.renderItemGrid(updatedActive.items, cart);
      updateTransactionBar();
    });

    // Settings navigation
    on('btn-settings', 'click', function () {
      location.href = 'settings.html';
    });
  }

  // ─── Utility: attach listener if element exists ───────────────────────────
  function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init: init };
}());

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
