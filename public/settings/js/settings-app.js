'use strict';

// ─── Settings Page ────────────────────────────────────────────────────────────
const SettingsApp = (function () {
  let state = null;

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    state = Store.loadState();
    renderActiveEvent();
    renderAllEvents();
    bindEvents();
  }

  // ─── Render active event info ─────────────────────────────────────────────
  function renderActiveEvent() {
    const active = Store.getActiveEvent(state);
    const nameEl = document.getElementById('settings-event-name');
    const revenueEl = document.getElementById('settings-revenue');
    const tipEl = document.getElementById('settings-tip');
    const txCountEl = document.getElementById('settings-tx-count');
    const closeBtn = document.getElementById('btn-close-event');

    if (active) {
      const totals = Models.calculateEventTotals(active);
      if (nameEl) nameEl.textContent = active.name;
      if (revenueEl) revenueEl.textContent = UI.formatCurrency(totals.revenue);
      if (tipEl) tipEl.textContent = UI.formatCurrency(totals.tip);
      if (txCountEl) txCountEl.textContent = String(totals.transactionCount);
      if (closeBtn) closeBtn.disabled = false;
    } else {
      if (nameEl) nameEl.textContent = '—';
      if (revenueEl) revenueEl.textContent = UI.formatCurrency(0);
      if (tipEl) tipEl.textContent = UI.formatCurrency(0);
      if (txCountEl) txCountEl.textContent = '0';
      if (closeBtn) closeBtn.disabled = true;
    }
  }

  // ─── Render all events list ───────────────────────────────────────────────
  function renderAllEvents() {
    const container = document.getElementById('all-events-list');
    if (!container) return;
    container.innerHTML = '';

    if (state.events.length === 0) {
      container.innerHTML = '<p class="empty-hint">Keine Veranstaltungen vorhanden.</p>';
      return;
    }

    const sorted = state.events.slice().sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    sorted.forEach(function (event) {
      const totals = Models.calculateEventTotals(event);
      const isActive = event.id === state.activeEventId;
      const row = document.createElement('div');
      row.className = 'all-event-row';

      // Row 1: name (+ active badge) on left, revenue on right
      const nameSpan = document.createElement('span');
      nameSpan.className = 'all-event-name';
      nameSpan.textContent = event.name;
      if (isActive) {
        const badge = document.createElement('span');
        badge.className = 'event-badge-active';
        badge.textContent = 'Aktiv';
        nameSpan.appendChild(badge);
      }

      const revenueSpan = document.createElement('span');
      revenueSpan.className = 'all-event-revenue';
      revenueSpan.textContent = UI.formatCurrency(totals.revenue);

      // Row 2: date on left, action buttons on right
      const dateSpan = document.createElement('span');
      dateSpan.className = 'all-event-date';
      dateSpan.textContent = UI.formatDate(event.createdAt);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'all-event-actions';

      const editLink = document.createElement('a');
      editLink.className = 'all-event-link';
      editLink.href = '/edit/?id=' + encodeURIComponent(event.id);
      editLink.textContent = 'Bearbeiten';

      const statsLink = document.createElement('a');
      statsLink.className = 'all-event-link';
      statsLink.href = '/stats/?id=' + encodeURIComponent(event.id);
      statsLink.textContent = 'Statistik';

      actionsDiv.appendChild(editLink);
      actionsDiv.appendChild(statsLink);

      row.appendChild(nameSpan);
      row.appendChild(revenueSpan);
      row.appendChild(dateSpan);
      row.appendChild(actionsDiv);

      container.appendChild(row);
    });
  }

  // ─── Bind events ─────────────────────────────────────────────────────────
  function bindEvents() {
    // Back to cashier (back direction)
    on('btn-back-cashier', 'click', function () {
      sessionStorage.setItem('vt-direction', 'back');
      location.href = '/';
    });

    // Close event
    on('btn-close-event', 'click', function () {
      const active = Store.getActiveEvent(state);
      if (!active) return;
      if (!confirm('Veranstaltung "' + active.name + '" wirklich beenden?')) return;
      state = Store.closeEvent(state, active.id);
      renderActiveEvent();
      renderAllEvents();
    });
  }

  // ─── Utility ──────────────────────────────────────────────────────────────
  function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init: init };
}());

document.addEventListener('DOMContentLoaded', function () {
  SettingsApp.init();
});
