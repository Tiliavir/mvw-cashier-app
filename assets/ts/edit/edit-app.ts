import { Models, Storage, UI, Paths } from '../shared/index';

// ─── Edit Page ────────────────────────────────────────────────────────────────
const EditApp = (() => {
  let state = Storage.loadState();
  let eventId: string | null = null;
  let editingItemId: string | null = null;
  let dragSrcId: string | null = null;
  let touchDragSrcId: string | null = null;
  let touchClone: HTMLElement | null = null;

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
    if (!event || !srcId || srcId === dstId) return;
    const items = event.items.slice();
    const srcIdx = items.findIndex((i) => i.id === srcId);
    const dstIdx = items.findIndex((i) => i.id === dstId);
    if (srcIdx < 0 || dstIdx < 0) return;
    const [moved] = items.splice(srcIdx, 1);
    items.splice(dstIdx, 0, moved);
    if (eventId) state = Storage.reorderItemsInEvent(state, eventId, items);
    renderItems();
  }

  function bindEvents(): void {
    const container = document.getElementById('setup-items-list');

    on('btn-back-settings', 'click', () => {
      sessionStorage.setItem('vt-direction', 'back');
      location.href = Paths.page('settings');
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
      a.download = event.name.replace(/[^a-z0-9äöüß]/gi, '_') + '.json';
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
          if (eventId) state = Storage.removeItemFromEvent(state, eventId, (removeBtn as any).dataset.id);
          editingItemId = null;
          renderItems();
          return;
        }

        const saveBtn = target.closest('.btn-save-item');
        if (saveBtn) {
          const id = (saveBtn as any).dataset.id;
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
        editingItemId = (row as any).dataset.id;
        renderItems();
      });

      setupDragDrop(container);
    }
  }

  function setupDragDrop(container: HTMLElement): void {
    container.addEventListener('dragstart', (e: Event) => {
      const event = e as DragEvent;
      const row = (event.target as HTMLElement).closest('.setup-item-row');
      if (!row) return;
      dragSrcId = (row as any).dataset.id;
      if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
      row.classList.add('dragging');
    });

    container.addEventListener('dragend', (e: Event) => {
      const event = e as DragEvent;
      const row = (event.target as HTMLElement).closest('.setup-item-row');
      if (row) row.classList.remove('dragging');
      document.querySelectorAll('.setup-item-row.drag-over').forEach((el) => {
        el.classList.remove('drag-over');
      });
      dragSrcId = null;
    });

    container.addEventListener('dragover', (e: Event) => {
      const event = e as DragEvent;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      const row = (event.target as HTMLElement).closest('.setup-item-row');
      if (!row || (row as any).dataset.id === dragSrcId) return;
      document.querySelectorAll('.setup-item-row.drag-over').forEach((el) => {
        el.classList.remove('drag-over');
      });
      row.classList.add('drag-over');
    });

    container.addEventListener('dragleave', (e: Event) => {
      const event = e as DragEvent;
      const row = (event.target as HTMLElement).closest('.setup-item-row');
      if (row) row.classList.remove('drag-over');
    });

    container.addEventListener('drop', (e: Event) => {
      const event = e as DragEvent;
      event.preventDefault();
      const row = (event.target as HTMLElement).closest('.setup-item-row');
      if (!row) return;
      row.classList.remove('drag-over');
      const dropId = (row as any).dataset.id;
      if (dragSrcId && dragSrcId !== dropId) {
        onDropReorder(dragSrcId, dropId);
      }
      dragSrcId = null;
    });

    container.addEventListener(
      'touchstart',
      (e: Event) => {
        const event = e as TouchEvent;
        const handle = (event.target as HTMLElement).closest('.drag-handle');
        if (!handle) return;
        const row = handle.closest('.setup-item-row');
        if (!row) return;
        touchDragSrcId = (row as any).dataset.id;
        event.preventDefault();
        touchClone = row.cloneNode(true) as HTMLElement;
        touchClone.style.cssText = `left:0;opacity:0.7;pointer-events:none;position:fixed;top:0;width:${row.offsetWidth}px;z-index:1000;`;
        document.body.appendChild(touchClone);
        const touch = event.touches[0];
        touchClone.style.left = touch.clientX - row.offsetWidth / 2 + 'px';
        touchClone.style.top = touch.clientY - row.offsetHeight / 2 + 'px';
      },
      { passive: false }
    );

    container.addEventListener(
      'touchmove',
      (e: Event) => {
        const event = e as TouchEvent;
        if (!touchDragSrcId || !touchClone) return;
        event.preventDefault();
        const touch = event.touches[0];
        touchClone.style.left = touch.clientX - touchClone.offsetWidth / 2 + 'px';
        touchClone.style.top = touch.clientY - touchClone.offsetHeight / 2 + 'px';
        document.querySelectorAll('.setup-item-row.drag-over').forEach((el) => {
          el.classList.remove('drag-over');
        });
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const row = el ? el.closest('.setup-item-row') : null;
        if (row && (row as any).dataset.id !== touchDragSrcId) row.classList.add('drag-over');
      },
      { passive: false }
    );

    container.addEventListener('touchend', (e: Event) => {
      const event = e as TouchEvent;
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
      const row = el ? el.closest('.setup-item-row') : null;
      if (row && (row as any).dataset.id !== touchDragSrcId) {
        onDropReorder(touchDragSrcId, (row as any).dataset.id);
      }
      touchDragSrcId = null;
    });
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
