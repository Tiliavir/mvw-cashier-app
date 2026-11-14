import type { Item } from '../shared/index';
import { ItemEditor, Models, Storage, UI } from '../shared/index';

// ─── Create Page ──────────────────────────────────────────────────────────────
const CreateApp = (() => {
  let pendingItems: Item[] = [];
  let editor: ReturnType<typeof ItemEditor.bind> | null = null;

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
    editor = ItemEditor.bind({
      getItems: () => pendingItems,
      setItems: (items) => {
        pendingItems = items;
      },
    });
    editor.render();
    bindEvents();
    updateStartButton();
  }

  function replaceItems(items: Item[]): void {
    pendingItems = items;
    if (editor) editor.stopEditing();
  }

  function updateStartButton(): void {
    const btn = document.getElementById('btn-start-event') as HTMLButtonElement;
    const checkbox = document.getElementById('accept-liability') as HTMLInputElement;
    if (btn) btn.disabled = !checkbox?.checked;
  }

  function bindEvents(): void {
    UI.on('accept-liability', 'change', updateStartButton);

    UI.on('btn-example-config', 'click', () => {
      const nameInput = document.getElementById('event-name') as HTMLInputElement;
      if (nameInput && !nameInput.value.trim()) {
        nameInput.value = 'Vereinsfest';
      }
      replaceItems(EXAMPLE_ITEMS.map((cfg) => Models.createItem(cfg.name, cfg.price, cfg.color)));
    });

    UI.on('btn-import', 'click', () => {
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

    UI.on('btn-start-event', 'click', () => {
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

  async function importFile(file: File): Promise<void> {
    const errorEl = document.getElementById('import-error');
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data.name !== 'string' || !Array.isArray(data.items)) {
        throw new Error('Ungültiges Format');
      }
      const nameInput = document.getElementById('event-name') as HTMLInputElement;
      if (nameInput) nameInput.value = data.name;
      replaceItems(
        data.items.map((it: Record<string, unknown>) =>
          Models.createItem((it.name as string) || '', (it.price as number) || 0, (it.color as string) || '#cccccc'),
        ),
      );
      if (errorEl) errorEl.textContent = '';
    } catch {
      if (errorEl) errorEl.textContent = 'Fehler beim Importieren: Ungültiges JSON-Format.';
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  CreateApp.init();
});
