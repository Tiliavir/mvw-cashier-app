import type { Event, Item } from './models';
import type { AppState } from './storage';

// ─── Format helpers ──────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

// ─── Screen management ────────────────────────────────────────────────
function showScreen(screenId: string): void {
  const screens = document.querySelectorAll('.screen');
  screens.forEach((screen) => {
    screen.classList.remove('active');
  });
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
}

// ─── Setup Screen ────────────────────────────────────────────────────
function renderSetupScreen(): void {
  showScreen('screen-setup');
}

// ─── Item list rendering (setup and settings) ────────────────────────
function renderSetupItems(items: Item[], editingItemId: string | null, containerId?: string): void {
  const container = document.getElementById(containerId || 'setup-items-list');
  if (!container) return;
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<p class="empty-hint">Noch keine Artikel. Füge oben Artikel hinzu.</p>';
    return;
  }
  items.forEach((item) => {
    const div = document.createElement('div');
    div.dataset.id = item.id;

    if (item.id === editingItemId) {
      div.className = 'setup-item-row setup-item-edit';
      div.innerHTML =
        '<input type="text" class="text-input edit-name" value="' +
        escapeAttr(item.name) +
        '" aria-label="Artikelname" autocomplete="off">' +
        '<input type="number" class="text-input edit-price" value="' +
        escapeAttr(String(item.price)) +
        '" step="0.01" aria-label="Preis">' +
        '<input type="color" class="color-input edit-color" value="' +
        escapeAttr(item.color) +
        '" aria-label="Farbe">' +
        '<button class="btn-icon btn-save-item" data-id="' +
        escapeAttr(item.id) +
        '" aria-label="Speichern">✓</button>' +
        '<button class="btn-icon btn-cancel-edit" data-id="' +
        escapeAttr(item.id) +
        '" aria-label="Abbrechen">✕</button>';
    } else {
      div.className = 'setup-item-row';
      div.draggable = true;
      div.innerHTML =
        '<span class="drag-handle" aria-hidden="true">⠿</span>' +
        '<span class="setup-item-color" style="background:' +
        escapeAttr(item.color) +
        '"></span>' +
        '<span class="setup-item-name">' +
        escapeHtml(item.name) +
        '</span>' +
        '<span class="setup-item-price">' +
        formatCurrency(item.price) +
        '</span>' +
        '<button class="btn-icon btn-remove-item" data-id="' +
        escapeAttr(item.id) +
        '" aria-label="Artikel entfernen">✕</button>';
    }
    container.appendChild(div);
  });

  // Auto-focus the name field when entering edit mode
  if (editingItemId) {
    const nameInput = container.querySelector('.edit-name') as HTMLInputElement;
    if (nameInput) nameInput.focus();
  }
}

// ─── Cashier Screen ──────────────────────────────────────────────────
function renderCashierScreen(event: Event, cart: Record<string, number>): void {
  showScreen('screen-cashier');
  const title = document.getElementById('cashier-event-name');
  if (title) title.textContent = event.name;
  renderItemGrid(event.items, cart);
}

function renderItemGrid(items: Item[], cart: Record<string, number>): void {
  const grid = document.getElementById('item-grid');
  if (!grid) return;
  grid.innerHTML = '';
  items.forEach((item) => {
    const qty = cart[item.id] || 0;
    const tile = document.createElement('button');
    tile.className = 'item-tile';
    tile.style.backgroundColor = item.color;
    tile.dataset.id = item.id;
    tile.setAttribute('aria-label', `${item.name} ${formatCurrency(item.price)}`);

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
      qtyEl.textContent = String(qty);
      qtyEl.title = 'Anzahl verringern';
      tile.appendChild(qtyEl);
    }

    grid.appendChild(tile);
  });
}

// ─── Transaction bar ─────────────────────────────────────────────────
function renderTransactionBar(total: number, _received: number, change: number): void {
  const totalEl = document.getElementById('tx-total');
  if (totalEl) totalEl.textContent = formatCurrency(total);

  const changeEl = document.getElementById('tx-change');
  if (changeEl) {
    changeEl.textContent = formatCurrency(change);
    changeEl.classList.toggle('tx-change-negative', change < 0);
  }
}

// ─── Settings Screen ─────────────────────────────────────────────────
function renderSettingsScreen(
  state: AppState,
  calculateEventTotals: (event: Event) => { revenue: number; transactionCount: number },
): void {
  showScreen('screen-settings');

  const activeEvent = state.events.find((e: Event) => e.id === state.activeEventId);

  const nameEl = document.getElementById('settings-event-name');
  const revenueEl = document.getElementById('settings-revenue');
  const txCountEl = document.getElementById('settings-tx-count');
  const closeBtn = document.getElementById('btn-close-event') as HTMLButtonElement;

  if (activeEvent) {
    const totals = calculateEventTotals(activeEvent);
    if (nameEl) nameEl.textContent = activeEvent.name;
    if (revenueEl) revenueEl.textContent = formatCurrency(totals.revenue);
    if (txCountEl) txCountEl.textContent = String(totals.transactionCount);
    if (closeBtn) closeBtn.disabled = false;
  } else {
    if (nameEl) nameEl.textContent = '—';
    if (revenueEl) revenueEl.textContent = formatCurrency(0);
    if (txCountEl) txCountEl.textContent = '0';
    if (closeBtn) closeBtn.disabled = true;
  }

  renderPastEvents(state.events, calculateEventTotals);
}

function renderPastEvents(
  events: Event[],
  calculateEventTotals: (event: Event) => { revenue: number; transactionCount: number },
): void {
  const container = document.getElementById('past-events-list');
  if (!container) return;
  container.innerHTML = '';

  const closed = events.filter((e: Event) => e.closed);
  if (closed.length === 0) {
    container.innerHTML = '<p class="empty-hint">Keine abgeschlossenen Veranstaltungen.</p>';
    return;
  }

  closed.forEach((event: Event) => {
    const totals = calculateEventTotals(event);
    const row = document.createElement('div');
    row.className = 'past-event-row';
    row.innerHTML =
      '<span class="past-event-name">' +
      escapeHtml(event.name) +
      '</span>' +
      '<span class="past-event-date">' +
      formatDate(event.createdAt) +
      '</span>' +
      '<span class="past-event-revenue">' +
      formatCurrency(totals.revenue) +
      '</span>' +
      '<span class="past-event-tx">' +
      totals.transactionCount +
      ' Tx</span>';
    container.appendChild(row);
  });
}

// ─── XSS helpers ─────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Setup item drag-and-drop ────────────────────────────────────────
function bindSetupItemsDragDrop(container: HTMLElement, onReorder: (srcId: string, dstId: string) => void): void {
  let dragSrcId: string | null = null;
  let touchDragSrcId: string | null = null;
  let touchClone: HTMLElement | null = null;

  // Desktop drag-and-drop
  container.addEventListener('dragstart', (event) => {
    const row = (event.target as HTMLElement).closest('.setup-item-row');
    if (!row) return;
    dragSrcId = (row as HTMLElement).dataset.id ?? null;
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    row.classList.add('dragging');
  });

  container.addEventListener('dragend', (event) => {
    const row = (event.target as HTMLElement).closest('.setup-item-row');
    if (row) row.classList.remove('dragging');
    document.querySelectorAll('.setup-item-row.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
    dragSrcId = null;
  });

  container.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const row = (event.target as HTMLElement).closest('.setup-item-row');
    if (!row || (row as HTMLElement).dataset.id === dragSrcId) return;
    document.querySelectorAll('.setup-item-row.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
    row.classList.add('drag-over');
  });

  container.addEventListener('dragleave', (event) => {
    const row = (event.target as HTMLElement).closest('.setup-item-row');
    if (row) row.classList.remove('drag-over');
  });

  container.addEventListener('drop', (event) => {
    event.preventDefault();
    const row = (event.target as HTMLElement).closest('.setup-item-row');
    if (!row) return;
    row.classList.remove('drag-over');
    const dropId = (row as HTMLElement).dataset.id;
    if (dragSrcId && dropId && dragSrcId !== dropId) {
      onReorder(dragSrcId, dropId);
    }
    dragSrcId = null;
  });

  // Touch drag-and-drop
  container.addEventListener(
    'touchstart',
    (event) => {
      const handle = (event.target as HTMLElement).closest('.drag-handle');
      if (!handle) return;
      const row = handle.closest<HTMLElement>('.setup-item-row');
      if (!row) return;
      touchDragSrcId = row.dataset.id ?? null;
      event.preventDefault();
      touchClone = row.cloneNode(true) as HTMLElement;
      touchClone.style.cssText = `left:0;opacity:0.7;pointer-events:none;position:fixed;top:0;width:${row.offsetWidth}px;z-index:1000;`;
      document.body.appendChild(touchClone);
      const touch = event.touches[0];
      touchClone.style.left = `${touch.clientX - row.offsetWidth / 2}px`;
      touchClone.style.top = `${touch.clientY - row.offsetHeight / 2}px`;
    },
    { passive: false },
  );

  container.addEventListener(
    'touchmove',
    (event) => {
      if (!touchDragSrcId || !touchClone) return;
      event.preventDefault();
      const touch = event.touches[0];
      touchClone.style.left = `${touch.clientX - touchClone.offsetWidth / 2}px`;
      touchClone.style.top = `${touch.clientY - touchClone.offsetHeight / 2}px`;
      document.querySelectorAll('.setup-item-row.drag-over').forEach((el) => {
        el.classList.remove('drag-over');
      });
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      const row = el ? el.closest('.setup-item-row') : null;
      if (row && (row as HTMLElement).dataset.id !== touchDragSrcId) row.classList.add('drag-over');
    },
    { passive: false },
  );

  container.addEventListener('touchend', (event) => {
    if (!touchDragSrcId) return;
    if (touchClone) {
      touchClone.remove();
      touchClone = null;
    }
    document.querySelectorAll('.setup-item-row.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });
    const touch = event.changedTouches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el ? el.closest<HTMLElement>('.setup-item-row') : null;
    const dropId = row ? row.dataset.id : undefined;
    if (dropId && dropId !== touchDragSrcId) {
      onReorder(touchDragSrcId, dropId);
    }
    touchDragSrcId = null;
  });
}

export const UI = {
  formatCurrency,
  formatDate,
  showScreen,
  renderSetupScreen,
  renderSetupItems,
  bindSetupItemsDragDrop,
  renderCashierScreen,
  renderItemGrid,
  renderTransactionBar,
  renderSettingsScreen,
  renderPastEvents,
  escapeHtml,
  escapeAttr,
};
