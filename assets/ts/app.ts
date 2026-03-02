import { Models, Storage, UI, Paths } from './shared/index';

// ─── App State ────────────────────────────────────────────────────────────────
const App = (() => {
  let state = Storage.loadState();
  // cart: { itemId: quantity }
  let cart: Record<string, number> = {};

  // ─── Init ──────────────────────────────────────────────────────────────────
  function init(): void {
    state = Storage.loadState();
    const active = Storage.getActiveEvent(state);
    if (!active) {
      location.replace(Paths.page('create'));
      return;
    }
    const title = document.getElementById('cashier-event-name');
    if (title) title.textContent = active.name;
    UI.renderItemGrid(active.items, cart);
    updateTransactionBar();
    bindEvents();
  }

  // ─── Transaction bar update ───────────────────────────────────────────────
  function updateTransactionBar(): void {
    const active = Storage.getActiveEvent(state);
    if (!active) return;
    const itemsMap = Models.buildItemsMap(active.items);
    const total = Models.calculateTotal(cart, itemsMap);
    const receivedInput = document.getElementById('tx-received') as HTMLInputElement;
    const received = receivedInput ? Models.safeParseFloat(receivedInput.value) : 0;
    const safeReceived = received < 0 ? 0 : received;
    // Show negative change when underpaid; keep 0 when no amount entered yet
    const displayChange = safeReceived > 0 ? Math.round((safeReceived - total) * 100) / 100 : 0;
    UI.renderTransactionBar(total, safeReceived, displayChange);
  }

  // ─── Bind events ──────────────────────────────────────────────────────────
  function bindEvents(): void {
    // Per-tile debounce to prevent ghost-click double-counting on mobile
    const tileLastClick: Record<string, number> = {};

    // Item grid click: tile adds item, qty badge reduces
    on('item-grid', 'click', (e: Event) => {
      const event = e as MouseEvent;
      const tile = (event.target as HTMLElement).closest('.item-tile');
      if (!tile) return;
      const id = (tile as HTMLElement).dataset.id;
      if (!id) return;
      const now = Date.now();
      if (tileLastClick[id] && now - tileLastClick[id] < 150) return;
      tileLastClick[id] = now;
      if ((event.target as HTMLElement).closest('.tile-qty')) {
        if (cart[id] > 1) {
          cart[id]--;
        } else {
          delete cart[id];
        }
      } else {
        cart[id] = (cart[id] || 0) + 1;
      }
      const active = Storage.getActiveEvent(state);
      if (active) UI.renderItemGrid(active.items, cart);
      updateTransactionBar();
    });

    // Cancel transaction
    on('btn-cancel-tx', 'click', () => {
      cart = {};
      const receivedInput = document.getElementById('tx-received') as HTMLInputElement;
      if (receivedInput) receivedInput.value = '';
      const active = Storage.getActiveEvent(state);
      if (active) UI.renderItemGrid(active.items, cart);
      updateTransactionBar();
    });

    // Received input
    on('tx-received', 'input', () => {
      updateTransactionBar();
    });

    // Next transaction
    on('btn-next-tx', 'click', () => {
      const active = Storage.getActiveEvent(state);
      if (!active) return;

      const hasItems = Object.values(cart).some((q) => q > 0);
      if (!hasItems) {
        alert('Bitte mindestens einen Artikel auswählen.');
        return;
      }

      const itemsMap = Models.buildItemsMap(active.items);
      const total = Models.calculateTotal(cart, itemsMap);
      const receivedInput = document.getElementById('tx-received') as HTMLInputElement;
      const received = receivedInput ? Models.safeParseFloat(receivedInput.value) : 0;
      const safeReceived = received < 0 ? 0 : received;

      const change = Models.calculateChange(total, safeReceived);

      const txItems: { itemId: string; quantity: number }[] = [];
      for (const itemId in cart) {
        if (cart[itemId] > 0) {
          txItems.push({ itemId: itemId, quantity: cart[itemId] });
        }
      }

      const tx = Models.createTransaction(txItems, total, safeReceived, change);
      state = Storage.addTransaction(state, active.id, tx);

      cart = {};
      if (receivedInput) receivedInput.value = '';
      const updatedActive = Storage.getActiveEvent(state);
      if (updatedActive) UI.renderItemGrid(updatedActive.items, cart);
      updateTransactionBar();
    });

    // Settings navigation
    on('btn-settings', 'click', () => {
      location.href = Paths.page('settings');
    });
  }

  // ─── Utility: attach listener if element exists ───────────────────────────
  function on(id: string, event: string, handler: EventListener): void {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init };
})();

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

