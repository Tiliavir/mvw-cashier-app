'use strict';

// ─── App State ────────────────────────────────────────────────────────────────
const App = (function () {
  let state = null;
  // cart: { itemId: quantity }
  let cart = {};
  // Pending setup items (before event is saved)
  let pendingItems = [];
  // Drag-and-drop: ID of item being dragged
  let dragSrcId = null;
  // Inline edit: ID of item currently being edited in setup list
  let editingItemId = null;
  // Inline edit: ID of item currently being edited in settings list
  let settingsEditingItemId = null;

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
    editingItemId = null;
    UI.renderSetupScreen();
    UI.renderSetupItems(pendingItems, editingItemId);
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
    settingsEditingItemId = null;
    UI.renderSettingsScreen(state, Models.calculateEventTotals);
    const active = Store.getActiveEvent(state);
    const section = document.getElementById('settings-items-section');
    if (section) section.style.display = active ? '' : 'none';
    if (active) {
      UI.renderSetupItems(active.items, settingsEditingItemId, 'settings-items-list');
    }
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
      editingItemId = null;
      UI.renderSetupItems(pendingItems, editingItemId);

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
      editingItemId = null;
      UI.renderSetupItems(pendingItems, editingItemId);
    });

    // Inline edit: click row to enter edit mode; save / cancel
    on('setup-items-list', 'click', function (e) {
      // Save button
      if (e.target.closest('.btn-save-item')) {
        const btn = e.target.closest('.btn-save-item');
        const id = btn.dataset.id;
        const container = document.getElementById('setup-items-list');
        const row = container ? container.querySelector('[data-id="' + id + '"]') : null;
        if (!row) return;
        const nameInput = row.querySelector('.edit-name');
        const priceInput = row.querySelector('.edit-price');
        const colorInput = row.querySelector('.edit-color');
        const name = nameInput ? nameInput.value.trim() : '';
        const price = priceInput ? priceInput.value : '';
        const color = colorInput ? colorInput.value : '#cccccc';
        if (!name) { alert('Bitte Artikelname eingeben.'); return; }
        const idx = pendingItems.findIndex(function (i) { return i.id === id; });
        if (idx >= 0) {
          pendingItems[idx] = Object.assign({}, pendingItems[idx], {
            name: name,
            price: Models.safeParseFloat(price),
            color: color,
          });
        }
        editingItemId = null;
        UI.renderSetupItems(pendingItems, editingItemId);
        return;
      }

      // Cancel button
      if (e.target.closest('.btn-cancel-edit')) {
        editingItemId = null;
        UI.renderSetupItems(pendingItems, editingItemId);
        return;
      }

      // Click on a non-edit row: enter edit mode (ignore remove button)
      if (e.target.closest('.btn-remove-item')) return;
      const row = e.target.closest('.setup-item-row');
      if (!row || row.classList.contains('setup-item-edit')) return;
      editingItemId = row.dataset.id;
      UI.renderSetupItems(pendingItems, editingItemId);
    });

    // Drag-and-drop reordering of setup items
    on('setup-items-list', 'dragstart', function (e) {
      const row = e.target.closest('.setup-item-row');
      if (!row) return;
      dragSrcId = row.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      row.classList.add('dragging');
    });

    on('setup-items-list', 'dragend', function (e) {
      const row = e.target.closest('.setup-item-row');
      if (row) row.classList.remove('dragging');
      document.querySelectorAll('.setup-item-row.drag-over').forEach(function (el) {
        el.classList.remove('drag-over');
      });
      dragSrcId = null;
    });

    on('setup-items-list', 'dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const row = e.target.closest('.setup-item-row');
      if (!row || row.dataset.id === dragSrcId) return;
      document.querySelectorAll('.setup-item-row.drag-over').forEach(function (el) {
        el.classList.remove('drag-over');
      });
      row.classList.add('drag-over');
    });

    on('setup-items-list', 'dragleave', function (e) {
      const row = e.target.closest('.setup-item-row');
      if (row) row.classList.remove('drag-over');
    });

    on('setup-items-list', 'drop', function (e) {
      e.preventDefault();
      const row = e.target.closest('.setup-item-row');
      if (!row) return;
      row.classList.remove('drag-over');
      const dropId = row.dataset.id;
      if (!dragSrcId || dragSrcId === dropId) return;
      const srcIdx = pendingItems.findIndex(function (i) { return i.id === dragSrcId; });
      const dstIdx = pendingItems.findIndex(function (i) { return i.id === dropId; });
      if (srcIdx < 0 || dstIdx < 0) return;
      const moved = pendingItems.splice(srcIdx, 1)[0];
      pendingItems.splice(dstIdx, 0, moved);
      UI.renderSetupItems(pendingItems, editingItemId);
      dragSrcId = null;
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
    // Item grid click (delegated): left-click tile to add, click qty badge to remove
    on('item-grid', 'click', function (e) {
      const tile = e.target.closest('.item-tile');
      if (!tile) return;
      const id = tile.dataset.id;
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

    // ── Settings items management ────────────────────────────────────────────
    // Add item to active event
    on('btn-settings-add-item', 'click', function () {
      const active = Store.getActiveEvent(state);
      if (!active) return;

      const nameInput = document.getElementById('settings-item-name');
      const priceInput = document.getElementById('settings-item-price');
      const colorInput = document.getElementById('settings-item-color');

      const name = nameInput ? nameInput.value.trim() : '';
      const price = priceInput ? priceInput.value : '';
      const color = colorInput ? colorInput.value.trim() : '#cccccc';

      if (!name) { alert('Bitte Artikelname eingeben.'); return; }
      if (price === '' || price === null) { alert('Bitte Preis eingeben.'); return; }

      const item = Models.createItem(name, price, color);
      state = Store.addItemToEvent(state, active.id, item);
      settingsEditingItemId = null;

      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (colorInput) colorInput.value = '#cccccc';
      if (nameInput) nameInput.focus();

      const updatedActive = Store.getActiveEvent(state);
      if (updatedActive) UI.renderSetupItems(updatedActive.items, settingsEditingItemId, 'settings-items-list');
    });

    // Settings items list: remove, inline edit save/cancel, enter edit mode
    on('settings-items-list', 'click', function (e) {
      const active = Store.getActiveEvent(state);
      if (!active) return;

      // Remove item
      const removeBtn = e.target.closest('.btn-remove-item');
      if (removeBtn) {
        const id = removeBtn.dataset.id;
        state = Store.removeItemFromEvent(state, active.id, id);
        settingsEditingItemId = null;
        const updatedActive = Store.getActiveEvent(state);
        if (updatedActive) UI.renderSetupItems(updatedActive.items, settingsEditingItemId, 'settings-items-list');
        return;
      }

      // Save edited item
      if (e.target.closest('.btn-save-item')) {
        const btn = e.target.closest('.btn-save-item');
        const id = btn.dataset.id;
        const container = document.getElementById('settings-items-list');
        const row = container ? container.querySelector('[data-id="' + id + '"]') : null;
        if (!row) return;
        const nameInput = row.querySelector('.edit-name');
        const priceInput = row.querySelector('.edit-price');
        const colorInput = row.querySelector('.edit-color');
        const name = nameInput ? nameInput.value.trim() : '';
        const price = priceInput ? priceInput.value : '';
        const color = colorInput ? colorInput.value : '#cccccc';
        if (!name) { alert('Bitte Artikelname eingeben.'); return; }
        const item = active.items.find(function (i) { return i.id === id; });
        if (item) {
          const updatedItem = Object.assign({}, item, {
            name: name,
            price: Models.safeParseFloat(price),
            color: color,
          });
          state = Store.updateItemInEvent(state, active.id, updatedItem);
        }
        settingsEditingItemId = null;
        const updatedActive = Store.getActiveEvent(state);
        if (updatedActive) UI.renderSetupItems(updatedActive.items, settingsEditingItemId, 'settings-items-list');
        return;
      }

      // Cancel edit
      if (e.target.closest('.btn-cancel-edit')) {
        settingsEditingItemId = null;
        UI.renderSetupItems(active.items, settingsEditingItemId, 'settings-items-list');
        return;
      }

      // Click on row to enter edit mode
      const row = e.target.closest('.setup-item-row');
      if (!row || row.classList.contains('setup-item-edit')) return;
      settingsEditingItemId = row.dataset.id;
      UI.renderSetupItems(active.items, settingsEditingItemId, 'settings-items-list');
    });

    // Settings items drag-and-drop reordering
    on('settings-items-list', 'dragstart', function (e) {
      const row = e.target.closest('.setup-item-row');
      if (!row) return;
      dragSrcId = row.dataset.id;
      e.dataTransfer.effectAllowed = 'move';
      row.classList.add('dragging');
    });

    on('settings-items-list', 'dragend', function (e) {
      const row = e.target.closest('.setup-item-row');
      if (row) row.classList.remove('dragging');
      document.querySelectorAll('#settings-items-list .setup-item-row.drag-over').forEach(function (el) {
        el.classList.remove('drag-over');
      });
      dragSrcId = null;
    });

    on('settings-items-list', 'dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const row = e.target.closest('.setup-item-row');
      if (!row || row.dataset.id === dragSrcId) return;
      document.querySelectorAll('#settings-items-list .setup-item-row.drag-over').forEach(function (el) {
        el.classList.remove('drag-over');
      });
      row.classList.add('drag-over');
    });

    on('settings-items-list', 'dragleave', function (e) {
      const row = e.target.closest('.setup-item-row');
      if (row) row.classList.remove('drag-over');
    });

    on('settings-items-list', 'drop', function (e) {
      e.preventDefault();
      const active = Store.getActiveEvent(state);
      if (!active) return;
      const row = e.target.closest('.setup-item-row');
      if (!row) return;
      row.classList.remove('drag-over');
      const dropId = row.dataset.id;
      if (!dragSrcId || dragSrcId === dropId) return;
      const items = active.items.slice();
      const srcIdx = items.findIndex(function (i) { return i.id === dragSrcId; });
      const dstIdx = items.findIndex(function (i) { return i.id === dropId; });
      if (srcIdx < 0 || dstIdx < 0) return;
      const moved = items.splice(srcIdx, 1)[0];
      items.splice(dstIdx, 0, moved);
      state = Store.reorderItemsInEvent(state, active.id, items);
      const updatedActive = Store.getActiveEvent(state);
      if (updatedActive) UI.renderSetupItems(updatedActive.items, settingsEditingItemId, 'settings-items-list');
      dragSrcId = null;
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
