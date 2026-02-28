'use strict';

// ─── App State ────────────────────────────────────────────────────────────────
const App = (function () {
  let state = null;
  // cart: { itemId: quantity }
  let cart = {};
  // Pending setup items (before event is saved)
  let pendingItems = [];

  // ─── Init ───────────────────────────────────────────────────────────────────
  function init() {
    state = Store.loadState();

    const active = Store.getActiveEvent(state);
    if (!active) {
      showSetup();
    } else {
      showCashier();
    }

    bindGlobalEvents();
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────
  function showSetup() {
    pendingItems = [];
    UI.renderSetupScreen();
    UI.renderSetupItems(pendingItems);
  }

  function showCashier() {
    const active = Store.getActiveEvent(state);
    if (!active) {
      showSetup();
      return;
    }
    cart = {};
    UI.renderCashierScreen(active, cart);
    updateTransactionBar();
  }

  function showSettings() {
    UI.renderSettingsScreen(state, Models.calculateEventTotals);
  }

  // ─── Transaction bar update ──────────────────────────────────────────────────
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

  // ─── Bind events ────────────────────────────────────────────────────────────
  function bindGlobalEvents() {
    // ── Setup screen ────────────────────────────────────────────────────────
    // Add item button
    on('btn-add-item', 'click', function () {
      const nameInput = document.getElementById('item-name');
      const priceInput = document.getElementById('item-price');
      const colorInput = document.getElementById('item-color');

      const name = nameInput ? nameInput.value.trim() : '';
      const price = priceInput ? priceInput.value : '';
      const color = colorInput ? colorInput.value.trim() : '#cccccc';

      if (!name) { alert('Bitte Artikelname eingeben.'); return; }
      if (price === '' || price === null) { alert('Bitte Preis eingeben.'); return; }

      const item = Models.createItem(name, price, color);
      pendingItems.push(item);
      UI.renderSetupItems(pendingItems);

      // Reset input fields
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (colorInput) colorInput.value = '#cccccc';
      if (nameInput) nameInput.focus();
    });

    // Remove item (delegated)
    on('setup-items-list', 'click', function (e) {
      const btn = e.target.closest('.btn-remove-item');
      if (!btn) return;
      const id = btn.dataset.id;
      pendingItems = pendingItems.filter(function (i) { return i.id !== id; });
      UI.renderSetupItems(pendingItems);
    });

    // Start event button
    on('btn-start-event', 'click', function () {
      const nameInput = document.getElementById('event-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) { alert('Bitte Veranstaltungsname eingeben.'); return; }

      const event = Models.createEvent(name);
      event.items = pendingItems.slice();
      state = Store.addEvent(state, event);
      showCashier();
    });

    // ── Cashier screen ───────────────────────────────────────────────────────
    // Item grid click (delegated)
    on('item-grid', 'click', function (e) {
      const tile = e.target.closest('.item-tile');
      if (!tile) return;
      const id = tile.dataset.id;
      cart[id] = (cart[id] || 0) + 1;
      const active = Store.getActiveEvent(state);
      if (active) UI.renderItemGrid(active.items, cart);
      updateTransactionBar();
    });

    // Received input
    on('tx-received', 'input', function () {
      updateTransactionBar();
    });

    // Tip input – user may override the auto-calculated tip;
    // recalculate change to keep: received = total + change + tip
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

      // Prefer manually entered tip; fall back to auto-calculated value
      const tipRaw = tipInput ? tipInput.value : '';
      let tip, change;
      if (tipRaw !== '') {
        tip = Math.max(0, Models.safeParseFloat(tipRaw));
        change = Math.max(0, Math.round((safeReceived - total - tip) * 100) / 100);
      } else {
        change = Models.calculateChange(total, safeReceived);
        tip = Models.calculateTip(total, safeReceived, change);
      }

      // Build transaction items array
      const txItems = [];
      for (const itemId in cart) {
        if (cart[itemId] > 0) {
          txItems.push({ itemId: itemId, quantity: cart[itemId] });
        }
      }

      const tx = Models.createTransaction(txItems, total, safeReceived, change, tip);
      state = Store.addTransaction(state, active.id, tx);

      // Reset
      cart = {};
      if (receivedInput) receivedInput.value = '';
      if (tipInput) tipInput.value = '';
      const updatedActive = Store.getActiveEvent(state);
      if (updatedActive) UI.renderItemGrid(updatedActive.items, cart);
      updateTransactionBar();
    });

    // Settings button
    on('btn-settings', 'click', function () {
      showSettings();
    });

    // ── Settings screen ──────────────────────────────────────────────────────
    // Back to cashier
    on('btn-back-cashier', 'click', function () {
      showCashier();
    });

    // Close event
    on('btn-close-event', 'click', function () {
      const active = Store.getActiveEvent(state);
      if (!active) return;
      if (!confirm('Veranstaltung "' + active.name + '" wirklich beenden?')) return;
      state = Store.closeEvent(state, active.id);
      showSettings();
    });

    // New event
    on('btn-new-event', 'click', function () {
      showSetup();
    });
  }

  // ─── Utility: attach listener if element exists ──────────────────────────
  function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init: init };
})();

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  App.init();
});
