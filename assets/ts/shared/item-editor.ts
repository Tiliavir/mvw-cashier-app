import type { Item } from './models';
import { Models } from './models';
import { UI } from './ui';

// ─── Item editor ──────────────────────────────────────────────────────────────
// Item list shared by the create and edit pages: add form, inline edit,
// remove and drag-and-drop reorder. The page owns where the items live.
interface ItemStore {
  getItems(): Item[];
  setItems(items: Item[]): void;
}

interface ItemEditor {
  render(): void;
  stopEditing(): void;
}

function bindItemEditor(store: ItemStore): ItemEditor {
  let editingItemId: string | null = null;

  function render(): void {
    UI.renderSetupItems(store.getItems(), editingItemId);
  }

  function stopEditing(): void {
    editingItemId = null;
    render();
  }

  function addItem(): void {
    const nameInput = document.getElementById('item-name') as HTMLInputElement | null;
    const priceInput = document.getElementById('item-price') as HTMLInputElement | null;
    const colorInput = document.getElementById('item-color') as HTMLInputElement | null;
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
    store.setItems([...store.getItems(), Models.createItem(name, price, color)]);
    stopEditing();
    if (nameInput) nameInput.value = '';
    if (priceInput) priceInput.value = '';
    if (colorInput) colorInput.value = '#cccccc';
    if (nameInput) nameInput.focus();
  }

  function saveItem(container: HTMLElement, id: string): void {
    const values = UI.readItemEditRow(container, id);
    if (!values) return;
    if (!values.name) {
      alert('Bitte Artikelname eingeben.');
      return;
    }
    const price = Models.safeParseFloat(values.price);
    store.setItems(
      store.getItems().map((i) => (i.id === id ? { ...i, name: values.name, price, color: values.color } : i)),
    );
    stopEditing();
  }

  function handleClick(container: HTMLElement, target: HTMLElement): void {
    const removeBtn = target.closest<HTMLElement>('.btn-remove-item');
    if (removeBtn) {
      store.setItems(store.getItems().filter((i) => i.id !== removeBtn.dataset.id));
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
      render();
    }
  }

  function reorder(srcId: string, dstId: string): void {
    const items = store.getItems();
    const moved = Models.moveItem(items, srcId, dstId);
    if (moved === items) return;
    store.setItems(moved);
    render();
  }

  const addBtn = document.getElementById('btn-add-item');
  if (addBtn) addBtn.addEventListener('click', addItem);

  const container = document.getElementById('setup-items-list');
  if (container) {
    container.addEventListener('click', (e: Event) => {
      handleClick(container, e.target as HTMLElement);
    });
    UI.bindSetupItemsDragDrop(container, reorder);
  }

  return { render, stopEditing };
}

export const ItemEditor = {
  bind: bindItemEditor,
};
export type { ItemStore };
