'use strict';

// ─── Edit Page ────────────────────────────────────────────────────────────────
const EditApp = (function () {
  let state = null;
  let eventId = null;
  let editingItemId = null;
  let dragSrcId = null;
  let touchDragSrcId = null;
  let touchClone = null;

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    eventId = new URLSearchParams(location.search).get('id');
    state = Store.loadState();
    const event = state.events.find(function (e) { return e.id === eventId; });

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

  // ─── Current event ────────────────────────────────────────────────────────
  function currentEvent() {
    return state.events.find(function (e) { return e.id === eventId; }) || null;
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  function renderItems() {
    const event = currentEvent();
    if (!event) return;
    UI.renderSetupItems(event.items, editingItemId);
  }

  // ─── Reorder helper ───────────────────────────────────────────────────────
  function onDropReorder(srcId, dstId) {
    const event = currentEvent();
    if (!event || !srcId || srcId === dstId) return;
    const items = event.items.slice();
    const srcIdx = items.findIndex(function (i) { return i.id === srcId; });
    const dstIdx = items.findIndex(function (i) { return i.id === dstId; });
    if (srcIdx < 0 || dstIdx < 0) return;
    const moved = items.splice(srcIdx, 1)[0];
    items.splice(dstIdx, 0, moved);
    state = Store.reorderItemsInEvent(state, eventId, items);
    renderItems();
  }

  // ─── Bind events ─────────────────────────────────────────────────────────
  function bindEvents() {
    const container = document.getElementById('setup-items-list');

    // Back to settings (back direction)
    on('btn-back-settings', 'click', function () {
      sessionStorage.setItem('vt-direction', 'back');
      location.href = '/settings/';
    });

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
      state = Store.addItemToEvent(state, eventId, item);
      editingItemId = null;
      renderItems();
      if (nameInput) nameInput.value = '';
      if (priceInput) priceInput.value = '';
      if (colorInput) colorInput.value = '#cccccc';
      if (nameInput) nameInput.focus();
    });

    // Export
    on('btn-export', 'click', function () {
      const event = currentEvent();
      if (!event) return;
      const data = {
        name: event.name,
        items: event.items.map(function (it) {
          return { name: it.name, price: it.price, color: it.color };
        }),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = event.name.replace(/[^a-z0-9äöüß]/gi, '_') + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    // Item list interactions (delegated)
    if (container) {
      container.addEventListener('click', function (e) {
        const event = currentEvent();
        if (!event) return;

        // Remove
        const removeBtn = e.target.closest('.btn-remove-item');
        if (removeBtn) {
          state = Store.removeItemFromEvent(state, eventId, removeBtn.dataset.id);
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
          const item = event.items.find(function (i) { return i.id === id; });
          if (item) {
            const updated = Object.assign({}, item, {
              name: name,
              price: Models.safeParseFloat(priceInput ? priceInput.value : '0'),
              color: colorInput ? colorInput.value : '#cccccc',
            });
            state = Store.updateItemInEvent(state, eventId, updated);
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
  }

  // ─── Utility ──────────────────────────────────────────────────────────────
  function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

  return { init: init };
}());

document.addEventListener('DOMContentLoaded', function () {
  EditApp.init();
});
