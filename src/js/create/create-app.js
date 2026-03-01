'use strict';

// ─── Create Page ──────────────────────────────────────────────────────────────
const CreateApp = (function () {
  let pendingItems = [];
  let editingItemId = null;
  let dragSrcId = null;
  let touchDragSrcId = null;
  let touchClone = null;

  const EXAMPLE_ITEMS = [
    { name: 'Softdrinks', price: 2.00, color: '#3498db' },
    { name: 'Bier',       price: 2.50, color: '#e67e22' },
    { name: 'Wasser',     price: 1.50, color: '#85c1e9' },
    { name: 'Wein',       price: 3.00, color: '#9b59b6' },
    { name: 'Schorle',    price: 2.00, color: '#27ae60' },
    { name: 'Pfand+',     price: 2.00, color: '#95a5a6' },
    { name: 'Pfand-',     price: -2.00, color: '#95a5a6' },
    { name: 'Grillwurst', price: 3.50, color: '#e67e22' },
    { name: 'Bratwurst',  price: 3.00, color: '#d35400' },
    { name: 'Pommes',     price: 3.00, color: '#f1c40f' },
    { name: 'Steak',      price: 6.00, color: '#795548' },
    { name: 'Kaffee',     price: 2.00, color: '#4e342e' },
    { name: 'Kuchen',     price: 2.50, color: '#d7ccc8' },
    { name: 'Torte',      price: 3.00, color: '#f48fb1' },
  ];

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    renderItems();
    bindEvents();
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  function renderItems() {
    UI.renderSetupItems(pendingItems, editingItemId);
  }

  // ─── Reorder helper ───────────────────────────────────────────────────────
  function onDropReorder(srcId, dstId) {
    if (!srcId || srcId === dstId) return;
    const srcIdx = pendingItems.findIndex(function (i) { return i.id === srcId; });
    const dstIdx = pendingItems.findIndex(function (i) { return i.id === dstId; });
    if (srcIdx < 0 || dstIdx < 0) return;
    const moved = pendingItems.splice(srcIdx, 1)[0];
    pendingItems.splice(dstIdx, 0, moved);
    renderItems();
  }

  // ─── Bind events ─────────────────────────────────────────────────────────
  function bindEvents() {
    const container = document.getElementById('setup-items-list');

    // Add item
    on('btn-add-item', 'click', function () {
      const nameInput = document.getElementById('item-name');
      const priceInput = document.getElementById('item-price');
      const colorInput = document.getElementById('item-color');
      const name = nameInput ? nameInput.value.trim() : '';
      const price = priceInput ? priceInput.value : '';
      const color = colorInput ? colorInput.value.trim() : '#cccccc';
      if (!name) { alert('Bitte Artikelname eingeben.'); return; }
      if (price === '') { alert('Bitte Preis eingeben.'); return; }
      const item = Models.createItem(name, price, color);
      pendingItems.push(item);
      editingItemId = null;
      renderItems();
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (colorInput) colorInput.value = '#cccccc';
      if (nameInput) nameInput.focus();
    });

    // Item list interactions (delegated)
    if (container) {
      container.addEventListener('click', function (e) {
        // Remove item
        const removeBtn = e.target.closest('.btn-remove-item');
        if (removeBtn) {
          pendingItems = pendingItems.filter(function (i) { return i.id !== removeBtn.dataset.id; });
          editingItemId = null;
          renderItems();
          return;
        }

        // Save edit
        const saveBtn = e.target.closest('.btn-save-item');
        if (saveBtn) {
          const id = saveBtn.dataset.id;
          const row = container.querySelector('[data-id="' + id + '"]');
          if (!row) return;
          const nameInput = row.querySelector('.edit-name');
          const priceInput = row.querySelector('.edit-price');
          const colorInput = row.querySelector('.edit-color');
          const name = nameInput ? nameInput.value.trim() : '';
          if (!name) { alert('Bitte Artikelname eingeben.'); return; }
          const idx = pendingItems.findIndex(function (i) { return i.id === id; });
          if (idx >= 0) {
            pendingItems[idx] = Object.assign({}, pendingItems[idx], {
              name: name,
              price: Models.safeParseFloat(priceInput ? priceInput.value : '0'),
              color: colorInput ? colorInput.value : '#cccccc',
            });
          }
          editingItemId = null;
          renderItems();
          return;
        }

        // Cancel edit
        if (e.target.closest('.btn-cancel-edit')) {
          editingItemId = null;
          renderItems();
          return;
        }

        // Enter edit mode
        if (e.target.closest('.btn-remove-item')) return;
        const row = e.target.closest('.setup-item-row');
        if (!row || row.classList.contains('setup-item-edit')) return;
        editingItemId = row.dataset.id;
        renderItems();
      });

      // Desktop drag-and-drop
      container.addEventListener('dragstart', function (e) {
        const row = e.target.closest('.setup-item-row');
        if (!row) return;
        dragSrcId = row.dataset.id;
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('dragging');
      });

      container.addEventListener('dragend', function (e) {
        const row = e.target.closest('.setup-item-row');
        if (row) row.classList.remove('dragging');
        document.querySelectorAll('.setup-item-row.drag-over').forEach(function (el) {
          el.classList.remove('drag-over');
        });
        dragSrcId = null;
      });

      container.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const row = e.target.closest('.setup-item-row');
        if (!row || row.dataset.id === dragSrcId) return;
        document.querySelectorAll('.setup-item-row.drag-over').forEach(function (el) {
          el.classList.remove('drag-over');
        });
        row.classList.add('drag-over');
      });

      container.addEventListener('dragleave', function (e) {
        const row = e.target.closest('.setup-item-row');
        if (row) row.classList.remove('drag-over');
      });

      container.addEventListener('drop', function (e) {
        e.preventDefault();
        const row = e.target.closest('.setup-item-row');
        if (!row) return;
        row.classList.remove('drag-over');
        const dropId = row.dataset.id;
        if (dragSrcId && dragSrcId !== dropId) {
          onDropReorder(dragSrcId, dropId);
        }
        dragSrcId = null;
      });

      // Touch drag-and-drop
      container.addEventListener('touchstart', function (e) {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;
        const row = handle.closest('.setup-item-row');
        if (!row) return;
        touchDragSrcId = row.dataset.id;
        e.preventDefault();
        touchClone = row.cloneNode(true);
        touchClone.style.cssText = 'left:0;opacity:0.7;pointer-events:none;position:fixed;top:0;width:' + row.offsetWidth + 'px;z-index:1000;';
        document.body.appendChild(touchClone);
        const touch = e.touches[0];
        touchClone.style.left = (touch.clientX - row.offsetWidth / 2) + 'px';
        touchClone.style.top = (touch.clientY - row.offsetHeight / 2) + 'px';
      }, { passive: false });

      container.addEventListener('touchmove', function (e) {
        if (!touchDragSrcId || !touchClone) return;
        e.preventDefault();
        const touch = e.touches[0];
        touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
        touchClone.style.top = (touch.clientY - touchClone.offsetHeight / 2) + 'px';
        document.querySelectorAll('.setup-item-row.drag-over').forEach(function (el) {
          el.classList.remove('drag-over');
        });
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const row = el ? el.closest('.setup-item-row') : null;
        if (row && row.dataset.id !== touchDragSrcId) row.classList.add('drag-over');
      }, { passive: false });

      container.addEventListener('touchend', function (e) {
        if (!touchDragSrcId) return;
        if (touchClone) { touchClone.remove(); touchClone = null; }
        document.querySelectorAll('.setup-item-row.drag-over').forEach(function (el) {
          el.classList.remove('drag-over');
        });
        const touch = e.changedTouches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const row = el ? el.closest('.setup-item-row') : null;
        if (row && row.dataset.id !== touchDragSrcId) {
          onDropReorder(touchDragSrcId, row.dataset.id);
        }
        touchDragSrcId = null;
      });
    }

    // Example config
    on('btn-example-config', 'click', function () {
      const nameInput = document.getElementById('event-name');
      if (nameInput && !nameInput.value.trim()) {
        nameInput.value = 'Vereinsfest';
      }
      pendingItems = EXAMPLE_ITEMS.map(function (cfg) {
        return Models.createItem(cfg.name, cfg.price, cfg.color);
      });
      editingItemId = null;
      renderItems();
    });

    // Import JSON
    on('btn-import', 'click', function () {
      const fileInput = document.getElementById('import-file');
      if (fileInput) fileInput.click();
    });

    const fileInput = document.getElementById('import-file');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
          const errorEl = document.getElementById('import-error');
          try {
            const data = JSON.parse(ev.target.result);
            if (!data || typeof data.name !== 'string' || !Array.isArray(data.items)) {
              throw new Error('Ungültiges Format');
            }
            const nameInput = document.getElementById('event-name');
            if (nameInput) nameInput.value = data.name;
            pendingItems = data.items.map(function (it) {
              return Models.createItem(it.name || '', it.price || 0, it.color || '#cccccc');
            });
            editingItemId = null;
            renderItems();
            if (errorEl) errorEl.textContent = '';
          } catch (_e) {
            if (errorEl) errorEl.textContent = 'Fehler beim Importieren: Ungültiges JSON-Format.';
          }
          fileInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    // Start event
    on('btn-start-event', 'click', function () {
      const nameInput = document.getElementById('event-name');
      const name = nameInput ? nameInput.value.trim() : '';
      if (!name) { alert('Bitte Veranstaltungsname eingeben.'); return; }
      if (pendingItems.length === 0) { alert('Bitte mindestens einen Artikel hinzufügen.'); return; }
      const currentState = Store.loadState();
      const event = Models.createEvent(name);
      event.items = pendingItems.slice();
      Store.addEvent(currentState, event);
      location.href = Paths.page('');
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
  CreateApp.init();
});
