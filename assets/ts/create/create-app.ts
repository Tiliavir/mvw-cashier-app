import { Models, Storage, UI, Paths } from '../shared/index';

// ─── Create Page ──────────────────────────────────────────────────────────────
const CreateApp = (() => {
  let pendingItems: any[] = [];
  let editingItemId: string | null = null;
  let dragSrcId: string | null = null;
  let touchDragSrcId: string | null = null;
  let touchClone: HTMLElement | null = null;

  const EXAMPLE_ITEMS = [
    { name: 'Softdrinks', price: 2.00, color: '#3498db' },
    { name: 'Bier', price: 2.50, color: '#e67e22' },
    { name: 'Wasser', price: 1.50, color: '#85c1e9' },
    { name: 'Wein', price: 3.00, color: '#9b59b6' },
    { name: 'Schorle', price: 2.00, color: '#27ae60' },
    { name: 'Pfand+', price: 2.00, color: '#95a5a6' },
    { name: 'Pfand-', price: -2.00, color: '#95a5a6' },
    { name: 'Grillwurst', price: 3.50, color: '#e67e22' },
    { name: 'Bratwurst', price: 3.00, color: '#d35400' },
    { name: 'Pommes', price: 3.00, color: '#f1c40f' },
    { name: 'Steak', price: 6.00, color: '#795548' },
    { name: 'Kaffee', price: 2.00, color: '#4e342e' },
    { name: 'Kuchen', price: 2.50, color: '#d7ccc8' },
    { name: 'Torte', price: 3.00, color: '#f48fb1' },
  ];

  function init(): void {
    renderItems();
    bindEvents();
    updateStartButton();
  }

  function renderItems(): void {
    UI.renderSetupItems(pendingItems, editingItemId);
  }

  function updateStartButton(): void {
    const btn = document.getElementById('btn-start-event') as HTMLButtonElement;
    const checkbox = document.getElementById('accept-liability') as HTMLInputElement;
    if (btn) btn.disabled = !(checkbox && checkbox.checked);
  }

  function onDropReorder(srcId: string, dstId: string): void {
    if (!srcId || srcId === dstId) return;
    const srcIdx = pendingItems.findIndex((i: any) => i.id === srcId);
    const dstIdx = pendingItems.findIndex((i: any) => i.id === dstId);
    if (srcIdx < 0 || dstIdx < 0) return;
    const [moved] = pendingItems.splice(srcIdx, 1);
    pendingItems.splice(dstIdx, 0, moved);
    renderItems();
  }

  function bindEvents(): void {
    const container = document.getElementById('setup-items-list');

    on('accept-liability', 'change', updateStartButton);

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
      pendingItems.push(item);
      editingItemId = null;
      renderItems();
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (colorInput) colorInput.value = '#cccccc';
      if (nameInput) nameInput.focus();
    });

    if (container) {
      container.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const removeBtn = target.closest('.btn-remove-item');
        if (removeBtn) {
          pendingItems = pendingItems.filter((i: any) => i.id !== (removeBtn as any).dataset.id);
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
          const idx = pendingItems.findIndex((i: any) => i.id === id);
          if (idx >= 0) {
            pendingItems[idx] = {
              ...pendingItems[idx],
              name,
              price: Models.safeParseFloat(priceInput ? priceInput.value : '0'),
              color: colorInput ? colorInput.value : '#cccccc',
            };
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

      // Drag & drop handlers (desktop and touch)
      setupDragDrop(container);
    }

    on('btn-example-config', 'click', () => {
      const nameInput = document.getElementById('event-name') as HTMLInputElement;
      if (nameInput && !nameInput.value.trim()) {
        nameInput.value = 'Vereinsfest';
      }
      pendingItems = EXAMPLE_ITEMS.map((cfg: any) => Models.createItem(cfg.name, cfg.price, cfg.color));
      editingItemId = null;
      renderItems();
    });

    on('btn-import', 'click', () => {
      const fileInput = document.getElementById('import-file') as HTMLInputElement;
      if (fileInput) fileInput.click();
    });

    const fileInput = document.getElementById('import-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
          const errorEl = document.getElementById('import-error');
          try {
            const data = JSON.parse(ev.target?.result as string);
            if (!data || typeof data.name !== 'string' || !Array.isArray(data.items)) {
              throw new Error('Ungültiges Format');
            }
            const nameInput = document.getElementById('event-name') as HTMLInputElement;
            if (nameInput) nameInput.value = data.name;
            pendingItems = data.items.map((it: any) =>
              Models.createItem(it.name || '', it.price || 0, it.color || '#cccccc')
            );
            editingItemId = null;
            renderItems();
            if (errorEl) errorEl.textContent = '';
          } catch {
            if (errorEl) errorEl.textContent = 'Fehler beim Importieren: Ungültiges JSON-Format.';
          }
          fileInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    on('btn-start-event', 'click', () => {
      const nameInput = document.getElementById('event-name') as HTMLInputElement;
      const name = nameInput ? nameInput.value.trim() : '';
      const checkbox = document.getElementById('accept-liability') as HTMLInputElement;
      if (!name) {
        alert('Bitte Veranstaltungsname eingeben.');
        return;
      }
      if (pendingItems.length === 0) {
        alert('Bitte mindestens einen Artikel hinzufügen.');
        return;
      }
      if (!checkbox || !checkbox.checked) {
        alert('Bitte den Haftungsausschluss akzeptieren.');
        return;
      }
      const currentState = Storage.loadState();
      const event = Models.createEvent(name);
      event.items = pendingItems.slice();
      Storage.addEvent(currentState, event);
      location.href = Paths.page('');
    });
  }

  function setupDragDrop(container: HTMLElement): void {
    // Desktop drag-and-drop
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

    // Touch drag-and-drop
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
        touchClone.style.left = (touch.clientX - row.offsetWidth / 2) + 'px';
        touchClone.style.top = (touch.clientY - row.offsetHeight / 2) + 'px';
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
        touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
        touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px';
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
  CreateApp.init();
});

