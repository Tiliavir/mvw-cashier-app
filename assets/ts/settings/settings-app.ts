import { Models, Storage, UI } from '../shared/index';

// ─── Settings Page ────────────────────────────────────────────────────────────
const SettingsApp = (() => {
  let state = Storage.loadState();

  function init(): void {
    state = Storage.loadState();
    renderActiveEvent();
    renderAllEvents();
    bindEvents();
  }

  function renderActiveEvent(): void {
    const active = Storage.getActiveEvent(state);
    const nameEl = document.getElementById('settings-event-name');
    const revenueEl = document.getElementById('settings-revenue');
    const txCountEl = document.getElementById('settings-tx-count');
    const closeBtn = document.getElementById('btn-close-event') as HTMLButtonElement;

    if (active) {
      const totals = Models.calculateEventTotals(active);
      if (nameEl) nameEl.textContent = active.name;
      if (revenueEl) revenueEl.textContent = UI.formatCurrency(totals.revenue);
      if (txCountEl) txCountEl.textContent = String(totals.transactionCount);
      if (closeBtn) closeBtn.disabled = false;
    } else {
      if (nameEl) nameEl.textContent = '—';
      if (revenueEl) revenueEl.textContent = UI.formatCurrency(0);
      if (txCountEl) txCountEl.textContent = '0';
      if (closeBtn) closeBtn.disabled = true;
    }
  }

  function renderAllEvents(): void {
    const container = document.getElementById('all-events-list');
    if (!container) return;
    container.innerHTML = '';

    if (state.events.length === 0) {
      container.innerHTML = '<p class="empty-hint">Keine Veranstaltungen vorhanden.</p>';
      return;
    }

    const sorted = state.events.slice().sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    sorted.forEach((event) => {
      const totals = Models.calculateEventTotals(event);
      const isActive = event.id === state.activeEventId;
      const row = document.createElement('div');
      row.className = 'all-event-row';

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

      const dateSpan = document.createElement('span');
      dateSpan.className = 'all-event-date';
      dateSpan.textContent = UI.formatDate(event.createdAt);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'all-event-actions';

      const editLink = document.createElement('a');
      editLink.className = 'all-event-link';
      editLink.href = new URL(`edit/?id=${event.id}`, document.baseURI).href;
      editLink.textContent = 'Bearbeiten';

      const statsLink = document.createElement('a');
      statsLink.className = 'all-event-link';
      statsLink.href = new URL(`stats/?id=${event.id}`, document.baseURI).href;
      statsLink.textContent = 'Statistik';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'all-event-delete';
      deleteBtn.textContent = 'Löschen';
      deleteBtn.addEventListener('click', (() => {
        const ev = event;
        return () => {
          if (!confirm('Veranstaltung "' + ev.name + '" wirklich löschen?')) return;
          state = Storage.deleteEvent(state, ev.id);
          renderActiveEvent();
          renderAllEvents();
        };
      })());

      actionsDiv.appendChild(editLink);
      actionsDiv.appendChild(statsLink);
      actionsDiv.appendChild(deleteBtn);

      row.appendChild(nameSpan);
      row.appendChild(revenueSpan);
      row.appendChild(dateSpan);
      row.appendChild(actionsDiv);

      container.appendChild(row);
    });
  }

  function bindEvents(): void {
    on('btn-back-cashier', 'click', () => {
      sessionStorage.setItem('vt-direction', 'back');
      location.href = (document.getElementById('btn-back-cashier') as HTMLElement).dataset.href!;
    });

    on('btn-close-event', 'click', () => {
      const active = Storage.getActiveEvent(state);
      if (!active) return;
      if (!confirm('Veranstaltung "' + active.name + '" wirklich beenden?')) return;
      state = Storage.closeEvent(state, active.id);
      renderActiveEvent();
      renderAllEvents();
    });
  }

  function on(id: string, event: string, handler: EventListener): void {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  SettingsApp.init();
});
