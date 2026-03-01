'use strict';

// ─── Store namespace (avoids conflict with browser's window.Storage) ──────────
var Store = (function () {

  const STORAGE_KEY = 'kassierer_app_v1';

  // ─── Default state ──────────────────────────────────────────────────────
  function defaultState() {
    return {
      events: [],
      activeEventId: null,
    };
  }

  // ─── Load / Save ─────────────────────────────────────────────────────────
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      // Basic integrity check
      if (!parsed || !Array.isArray(parsed.events)) return defaultState();
      return parsed;
    } catch (_e) {
      return defaultState();
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }

  // ─── Event operations ────────────────────────────────────────────────────
  function addEvent(state, event) {
    const newState = Object.assign({}, state);
    newState.events = state.events.concat(event);
    newState.activeEventId = event.id;
    saveState(newState);
    return newState;
  }

  function setActiveEvent(state, eventId) {
    const newState = Object.assign({}, state, { activeEventId: eventId });
    saveState(newState);
    return newState;
  }

  function getActiveEvent(state) {
    if (!state.activeEventId) return null;
    return state.events.find(function (e) { return e.id === state.activeEventId; }) || null;
  }

  function updateEvent(state, updatedEvent) {
    const newState = Object.assign({}, state);
    newState.events = state.events.map(function (e) {
      return e.id === updatedEvent.id ? updatedEvent : e;
    });
    saveState(newState);
    return newState;
  }

  // ─── Item operations ───────────────────────────────────────────────────────
  function addItemToEvent(state, eventId, item) {
    const event = state.events.find(function (e) { return e.id === eventId; });
    if (!event) return state;
    const updatedEvent = Object.assign({}, event);
    updatedEvent.items = event.items.concat(item);
    return updateEvent(state, updatedEvent);
  }

  function removeItemFromEvent(state, eventId, itemId) {
    const event = state.events.find(function (e) { return e.id === eventId; });
    if (!event) return state;
    const updatedEvent = Object.assign({}, event);
    updatedEvent.items = event.items.filter(function (i) { return i.id !== itemId; });
    return updateEvent(state, updatedEvent);
  }

  function updateItemInEvent(state, eventId, updatedItem) {
    const event = state.events.find(function (e) { return e.id === eventId; });
    if (!event) return state;
    const updatedEvent = Object.assign({}, event);
    updatedEvent.items = event.items.map(function (i) {
      return i.id === updatedItem.id ? updatedItem : i;
    });
    return updateEvent(state, updatedEvent);
  }

  function reorderItemsInEvent(state, eventId, reorderedItems) {
    const event = state.events.find(function (e) { return e.id === eventId; });
    if (!event) return state;
    const updatedEvent = Object.assign({}, event, { items: reorderedItems });
    return updateEvent(state, updatedEvent);
  }

  // ─── Transaction operations ──────────────────────────────────────────────
  function addTransaction(state, eventId, transaction) {
    const event = state.events.find(function (e) { return e.id === eventId; });
    if (!event) return state;
    const updatedEvent = Object.assign({}, event);
    updatedEvent.transactions = event.transactions.concat(transaction);
    return updateEvent(state, updatedEvent);
  }

  // ─── Close event ─────────────────────────────────────────────────────────
  function closeEvent(state, eventId) {
    const event = state.events.find(function (e) { return e.id === eventId; });
    if (!event) return state;
    const updatedEvent = Object.assign({}, event, { closed: true });
    let newState = updateEvent(state, updatedEvent);
    if (newState.activeEventId === eventId) {
      newState = Object.assign({}, newState, { activeEventId: null });
      saveState(newState);
    }
    return newState;
  }

  // ─── Delete event ─────────────────────────────────────────────────────────
  function deleteEvent(state, eventId) {
    const newState = Object.assign({}, state);
    newState.events = state.events.filter(function (e) { return e.id !== eventId; });
    if (newState.activeEventId === eventId) {
      newState.activeEventId = null;
    }
    saveState(newState);
    return newState;
  }

  // ─── Reset (for testing / manual reset) ───────────────────────────────────
  function resetState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_e) { /* ignore */ }
    return defaultState();
  }

  return {
    STORAGE_KEY,
    defaultState,
    loadState,
    saveState,
    addEvent,
    setActiveEvent,
    getActiveEvent,
    updateEvent,
    addItemToEvent,
    removeItemFromEvent,
    updateItemInEvent,
    reorderItemsInEvent,
    addTransaction,
    closeEvent,
    deleteEvent,
    resetState,
  };
}());

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Store;
}

