import { Models, Storage, UI } from '../shared/index';

// ─── Edit Page ────────────────────────────────────────────────────────────────
const EditApp = (() => {
  let state = Storage.loadState();
  let eventId: string | null = null;
  let editingItemId: string | null = null;

  function init(): void {
    eventId = new URLSearchParams(location.search).get('id');
    state = Storage.loadState();
    const event = state.events.find((e) => e.id === eventId);

    if (!event) {
      const errEl = document.getElementById('edit-error');
      if (errEl) errEl.hidden = false;
      return;
    }

    const contentEl = document.getElementById('edit-content');
    if (contentEl) contentEl.hidden = false;

    const titleEl = document.getElementById('edit-event-name');
    if (titleEl) titleEl.textContent = event.name;

    renderItems();
    bindEvents();
  }

  function currentEvent() {
    return state.events.find((e) => e.id === eventId) || null;
  }

  function renderItems(): void {
    const event = currentEvent();
    if (!event) return;
    UI.renderSetupItems(event.items, editingItemId);
  }

  function onDropReorder(srcId: string, dstId: string): void {
    const event = currentEvent();
    if (!event || !eventId) return;
    const items = Models.moveItem(event.items, srcId, dstId);
    if (items === event.items) return;
    state = Storage.reorderItemsInEvent(state, eventId, items);
    renderItems();
  }

  function bindEvents(): void {
    const container = document.getElementById('setup-items-list');

    on('btn-back-settings', 'click', () => {
      sessionStorage.setItem('vt-direction', 'back');
      const href = (document.getElementById('btn-back-settings') as HTMLElement).dataset.href;
      if (href) location.href = href;
    });

    on('btn-add-item', 'click', () => {
      const nameInput = document.getElementById('item-name') as HTMLInputElement;
      const priceInput = document.getElementById('item-price') as HTMLInputElement;
      const colorInput = document.getElementById('item-color') as HTMLInputElement;
      const name = nameInput ? nameInput.value.trim() : '';
      const price = priceInput ? priceInput.value : '';
      const color = colorInput ? colorInput.value.trim() : '#cccccc';
      if (!name) {
        alert('Bitte Artikelname eingeben.');
        return;
      }
      if (price === '') {
        alert('Bitte Preis eingeben.');
        return;
      }
      const item = Models.createItem(name, price, color);
      if (eventId) state = Storage.addItemToEvent(state, eventId, item);
      editingItemId = null;
      renderItems();
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (colorInput) colorInput.value = '#cccccc';
      if (nameInput) nameInput.focus();
    });

    on('btn-export', 'click', () => {
      const event = currentEvent();
      if (!event) return;
      const data = {
        name: event.name,
        items: event.items.map((it) => ({ name: it.name, price: it.price, color: it.color })),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.name.replace(/[^a-z0-9äöüß]/gi, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    if (container) {
      container.addEventListener('click', (e: Event) => {
        const event = currentEvent();
        if (!event) return;
        const target = e.target as HTMLElement;

        const removeBtn = target.closest('.btn-remove-item');
        if (removeBtn) {
          const removeId = (removeBtn as HTMLElement).dataset.id;
          if (eventId && removeId) state = Storage.removeItemFromEvent(state, eventId, removeId);
          editingItemId = null;
          renderItems();
          return;
        }

        const saveBtn = target.closest('.btn-save-item');
        if (saveBtn) {
          const id = (saveBtn as HTMLElement).dataset.id;
          const row = container.querySelector(`[data-id="${id}"]`);
          if (!row) return;
          const nameInput = row.querySelector('.edit-name') as HTMLInputElement;
          const priceInput = row.querySelector('.edit-price') as HTMLInputElement;
          const colorInput = row.querySelector('.edit-color') as HTMLInputElement;
          const name = nameInput ? nameInput.value.trim() : '';
          if (!name) {
            alert('Bitte Artikelname eingeben.');
            return;
          }
          const item = event.items.find((i) => i.id === id);
          if (item && eventId) {
            const updated = {
              ...item,
              name,
              price: Models.safeParseFloat(priceInput ? priceInput.value : '0'),
              color: colorInput ? colorInput.value : '#cccccc',
            };
            state = Storage.updateItemInEvent(state, eventId, updated);
          }
          editingItemId = null;
          renderItems();
          return;
        }

        if (target.closest('.btn-cancel-edit')) {
          editingItemId = null;
          renderItems();
          return;
        }

        if (target.closest('.btn-remove-item')) return;
        const row = target.closest('.setup-item-row');
        if (!row || row.classList.contains('setup-item-edit')) return;
        editingItemId = (row as HTMLElement).dataset.id ?? null;
        renderItems();
      });

      UI.bindSetupItemsDragDrop(container, onDropReorder);
    }
  }

  function on(id: string, event: string, handler: EventListener): void {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  EditApp.init();
});
