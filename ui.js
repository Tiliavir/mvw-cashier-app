'use strict';

// ─── UI namespace ─────────────────────────────────────────────────────────────
var UI = (function () {

  // ─── Format helpers ─────────────────────────────────────────────────────
  function formatCurrency(value) {
    return value.toFixed(2).replace('.', ',') + ' €';
  }

  function formatDate(isoString) {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (_e) {
      return isoString;
    }
  }

  // ─── Screen management ───────────────────────────────────────────────────
  function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(function (s) {
      s.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
  }

  // ─── Setup Screen ────────────────────────────────────────────────────────
  function renderSetupScreen() {
    showScreen('screen-setup');
  }

  // ─── Item list rendering (setup) ─────────────────────────────────────────
  function renderSetupItems(items, editingItemId) {
    const container = document.getElementById('setup-items-list');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
      container.innerHTML = '<p class="empty-hint">Noch keine Artikel. Füge oben Artikel hinzu.</p>';
      return;
    }
    items.forEach(function (item) {
      const div = document.createElement('div');
      div.dataset.id = item.id;

      if (item.id === editingItemId) {
        div.className = 'setup-item-row setup-item-edit';
        div.innerHTML =
          '<input type="text" class="text-input edit-name" value="' + escapeAttr(item.name) + '" aria-label="Artikelname" autocomplete="off">' +
          '<input type="number" class="text-input edit-price" value="' + escapeAttr(String(item.price)) + '" step="0.01" aria-label="Preis">' +
          '<input type="color" class="color-input edit-color" value="' + escapeAttr(item.color) + '" aria-label="Farbe">' +
          '<button class="btn-icon btn-save-item" data-id="' + escapeAttr(item.id) + '" aria-label="Speichern">✓</button>' +
          '<button class="btn-icon btn-cancel-edit" data-id="' + escapeAttr(item.id) + '" aria-label="Abbrechen">✕</button>';
      } else {
        div.className = 'setup-item-row';
        div.draggable = true;
        div.innerHTML =
          '<span class="drag-handle" aria-hidden="true">⠿</span>' +
          '<span class="setup-item-color" style="background:' + escapeAttr(item.color) + '"></span>' +
          '<span class="setup-item-name">' + escapeHtml(item.name) + '</span>' +
          '<span class="setup-item-price">' + formatCurrency(item.price) + '</span>' +
          '<button class="btn-icon btn-remove-item" data-id="' + escapeAttr(item.id) + '" aria-label="Artikel entfernen">✕</button>';
      }
      container.appendChild(div);
    });

    // Auto-focus the name field when entering edit mode
    if (editingItemId) {
      const nameInput = container.querySelector('.edit-name');
      if (nameInput) nameInput.focus();
    }
  }

  // ─── Cashier Screen ──────────────────────────────────────────────────────
  function renderCashierScreen(event, cart) {
    showScreen('screen-cashier');
    const title = document.getElementById('cashier-event-name');
    if (title) title.textContent = event.name;
    renderItemGrid(event.items, cart);
  }

  function renderItemGrid(items, cart) {
    const grid = document.getElementById('item-grid');
    if (!grid) return;
    grid.innerHTML = '';
    items.forEach(function (item) {
      const qty = cart[item.id] || 0;
      const tile = document.createElement('button');
      tile.className = 'item-tile';
      tile.style.backgroundColor = item.color;
      tile.dataset.id = item.id;
      tile.setAttribute('aria-label', item.name + ' ' + formatCurrency(item.price));

      const nameEl = document.createElement('span');
      nameEl.className = 'tile-name';
      nameEl.textContent = item.name;

      const priceEl = document.createElement('span');
      priceEl.className = 'tile-price';
      priceEl.textContent = formatCurrency(item.price);

      tile.appendChild(nameEl);
      tile.appendChild(priceEl);

      if (qty > 0) {
        const qtyEl = document.createElement('span');
        qtyEl.className = 'tile-qty';
        qtyEl.textContent = qty;
        tile.appendChild(qtyEl);
      }

      grid.appendChild(tile);
    });
  }

  // ─── Transaction bar ─────────────────────────────────────────────────────
  function renderTransactionBar(total, received, change, tip) {
    const totalEl = document.getElementById('tx-total');
    if (totalEl) totalEl.textContent = formatCurrency(total);

    const changeEl = document.getElementById('tx-change');
    if (changeEl) changeEl.textContent = formatCurrency(change);

    const tipEl = document.getElementById('tx-tip');
    if (tipEl) tipEl.value = tip > 0 ? tip.toFixed(2) : '';
  }

  // ─── Settings Screen ─────────────────────────────────────────────────────
  function renderSettingsScreen(state, calculateEventTotals) {
    showScreen('screen-settings');

    const activeEvent = state.events.find(function (e) { return e.id === state.activeEventId; });

    const nameEl = document.getElementById('settings-event-name');
    const revenueEl = document.getElementById('settings-revenue');
    const tipEl = document.getElementById('settings-tip');
    const txCountEl = document.getElementById('settings-tx-count');
    const closeBtn = document.getElementById('btn-close-event');

    if (activeEvent) {
      const totals = calculateEventTotals(activeEvent);
      if (nameEl) nameEl.textContent = activeEvent.name;
      if (revenueEl) revenueEl.textContent = formatCurrency(totals.revenue);
      if (tipEl) tipEl.textContent = formatCurrency(totals.tip);
      if (txCountEl) txCountEl.textContent = totals.transactionCount;
      if (closeBtn) closeBtn.disabled = false;
    } else {
      if (nameEl) nameEl.textContent = '—';
      if (revenueEl) revenueEl.textContent = formatCurrency(0);
      if (tipEl) tipEl.textContent = formatCurrency(0);
      if (txCountEl) txCountEl.textContent = '0';
      if (closeBtn) closeBtn.disabled = true;
    }

    renderPastEvents(state.events, calculateEventTotals);
  }

  function renderPastEvents(events, calculateEventTotals) {
    const container = document.getElementById('past-events-list');
    if (!container) return;
    container.innerHTML = '';

    const closed = events.filter(function (e) { return e.closed; });
    if (closed.length === 0) {
      container.innerHTML = '<p class="empty-hint">Keine abgeschlossenen Veranstaltungen.</p>';
      return;
    }

    closed.forEach(function (event) {
      const totals = calculateEventTotals(event);
      const row = document.createElement('div');
      row.className = 'past-event-row';
      row.innerHTML =
        '<span class="past-event-name">' + escapeHtml(event.name) + '</span>' +
        '<span class="past-event-date">' + formatDate(event.createdAt) + '</span>' +
        '<span class="past-event-revenue">' + formatCurrency(totals.revenue) + '</span>' +
        '<span class="past-event-tx">' + totals.transactionCount + ' Tx</span>';
      container.appendChild(row);
    });
  }

  // ─── XSS helpers ─────────────────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return {
    formatCurrency,
    formatDate,
    showScreen,
    renderSetupScreen,
    renderSetupItems,
    renderCashierScreen,
    renderItemGrid,
    renderTransactionBar,
    renderSettingsScreen,
    renderPastEvents,
    escapeHtml,
    escapeAttr,
  };
}());

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UI;
}

