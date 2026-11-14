import type { Item } from '../shared/index';
import { Models, Storage, UI } from '../shared/index';

// ─── Create Page ──────────────────────────────────────────────────────────────
const CreateApp = (() => {
  let pendingItems: Item[] = [];
  let editingItemId: string | null = null;

  const EXAMPLE_ITEMS = [
    { name: 'Softdrinks', price: 2.0, color: '#3498db' },
    { name: 'Bier', price: 2.5, color: '#e67e22' },
    { name: 'Wasser', price: 1.5, color: '#85c1e9' },
    { name: 'Wein', price: 3.0, color: '#9b59b6' },
    { name: 'Schorle', price: 2.0, color: '#27ae60' },
    { name: 'Pfand+', price: 2.0, color: '#95a5a6' },
    { name: 'Pfand-', price: -2.0, color: '#95a5a6' },
    { name: 'Grillwurst', price: 3.5, color: '#e67e22' },
    { name: 'Bratwurst', price: 3.0, color: '#d35400' },
    { name: 'Pommes', price: 3.0, color: '#f1c40f' },
    { name: 'Steak', price: 6.0, color: '#795548' },
    { name: 'Kaffee', price: 2.0, color: '#4e342e' },
    { name: 'Kuchen', price: 2.5, color: '#d7ccc8' },
    { name: 'Torte', price: 3.0, color: '#f48fb1' },
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
    if (btn) btn.disabled = !checkbox?.checked;
  }

  function onDropReorder(srcId: string, dstId: string): void {
    pendingItems = Models.moveItem(pendingItems, srcId, dstId);
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
        handleItemsClick(container, e.target as HTMLElement);
      });

      // Drag & drop handlers (desktop and touch)
      UI.bindSetupItemsDragDrop(container, onDropReorder);
    }

    on('btn-example-config', 'click', () => {
      const nameInput = document.getElementById('event-name') as HTMLInputElement;
      if (nameInput && !nameInput.value.trim()) {
        nameInput.value = 'Vereinsfest';
      }
      pendingItems = EXAMPLE_ITEMS.map((cfg) => Models.createItem(cfg.name, cfg.price, cfg.color));
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
        void importFile(file).finally(() => {
          fileInput.value = '';
        });
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
      if (!checkbox?.checked) {
        alert('Bitte den Haftungsausschluss akzeptieren.');
        return;
      }
      const currentState = Storage.loadState();
      const event = Models.createEvent(name);
      event.items = pendingItems.slice();
      Storage.addEvent(currentState, event);
      location.href = document.baseURI;
    });
  }

  function handleItemsClick(container: HTMLElement, target: HTMLElement): void {
    const removeBtn = target.closest<HTMLElement>('.btn-remove-item');
    if (removeBtn) {
      pendingItems = pendingItems.filter((i: Item) => i.id !== removeBtn.dataset.id);
      stopEditing();
      return;
    }
    const saveBtn = target.closest<HTMLElement>('.btn-save-item');
    if (saveBtn) {
      saveItem(container, saveBtn.dataset.id ?? '');
      return;
    }
    if (target.closest('.btn-cancel-edit')) {
      stopEditing();
      return;
    }
    const row = target.closest<HTMLElement>('.setup-item-row');
    if (row && !row.classList.contains('setup-item-edit')) {
      editingItemId = row.dataset.id ?? null;
      renderItems();
    }
  }

  function saveItem(container: HTMLElement, id: string): void {
    const values = UI.readItemEditRow(container, id);
    if (!values) return;
    if (!values.name) {
      alert('Bitte Artikelname eingeben.');
      return;
    }
    const idx = pendingItems.findIndex((i: Item) => i.id === id);
    if (idx >= 0) {
      pendingItems[idx] = {
        ...pendingItems[idx],
        name: values.name,
        price: Models.safeParseFloat(values.price),
        color: values.color,
      };
    }
    stopEditing();
  }

  function stopEditing(): void {
    editingItemId = null;
    renderItems();
  }

  async function importFile(file: File): Promise<void> {
    const errorEl = document.getElementById('import-error');
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data.name !== 'string' || !Array.isArray(data.items)) {
        throw new Error('Ungültiges Format');
      }
      const nameInput = document.getElementById('event-name') as HTMLInputElement;
      if (nameInput) nameInput.value = data.name;
      pendingItems = data.items.map((it: Record<string, unknown>) =>
        Models.createItem((it.name as string) || '', (it.price as number) || 0, (it.color as string) || '#cccccc'),
      );
      editingItemId = null;
      renderItems();
      if (errorEl) errorEl.textContent = '';
    } catch {
      if (errorEl) errorEl.textContent = 'Fehler beim Importieren: Ungültiges JSON-Format.';
    }
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
