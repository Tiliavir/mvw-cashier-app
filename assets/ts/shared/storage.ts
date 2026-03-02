import type { Event, Item, Transaction } from './models';

const STORAGE_KEY = 'kassierer_app_v1';

// ─── State interface ──────────────────────────────────────────────────
interface AppState {
  events: Event[];
  activeEventId: string | null;
}

// ─── Default state ───────────────────────────────────────────────────
function defaultState(): AppState {
  return {
    events: [],
    activeEventId: null,
  };
}

// ─── Load / Save ──────────────────────────────────────────────────────
function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    // Basic integrity check
    if (!parsed || !Array.isArray(parsed.events)) return defaultState();
    return parsed;
  } catch (_e) {
    return defaultState();
  }
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// ─── Event operations ─────────────────────────────────────────────────
function addEvent(state: AppState, event: Event): AppState {
  const newState: AppState = { ...state };
  newState.events = [...state.events, event];
  newState.activeEventId = event.id;
  saveState(newState);
  return newState;
}

function setActiveEvent(state: AppState, eventId: string): AppState {
  const newState: AppState = { ...state, activeEventId: eventId };
  saveState(newState);
  return newState;
}

function getActiveEvent(state: AppState): Event | null {
  if (!state.activeEventId) return null;
  return state.events.find((e) => e.id === state.activeEventId) || null;
}

function updateEvent(state: AppState, updatedEvent: Event): AppState {
  const newState: AppState = { ...state };
  newState.events = state.events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
  saveState(newState);
  return newState;
}

// ─── Item operations ──────────────────────────────────────────────────
function addItemToEvent(state: AppState, eventId: string, item: Item): AppState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;
  const updatedEvent: Event = { ...event };
  updatedEvent.items = [...event.items, item];
  return updateEvent(state, updatedEvent);
}

function removeItemFromEvent(state: AppState, eventId: string, itemId: string): AppState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;
  const updatedEvent: Event = { ...event };
  updatedEvent.items = event.items.filter((i) => i.id !== itemId);
  return updateEvent(state, updatedEvent);
}

function updateItemInEvent(state: AppState, eventId: string, updatedItem: Item): AppState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;
  const updatedEvent: Event = { ...event };
  updatedEvent.items = event.items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
  return updateEvent(state, updatedEvent);
}

function reorderItemsInEvent(state: AppState, eventId: string, reorderedItems: Item[]): AppState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;
  const updatedEvent: Event = { ...event, items: reorderedItems };
  return updateEvent(state, updatedEvent);
}

// ─── Transaction operations ───────────────────────────────────────────
function addTransaction(state: AppState, eventId: string, transaction: Transaction): AppState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;
  const updatedEvent: Event = { ...event };
  updatedEvent.transactions = [...event.transactions, transaction];
  return updateEvent(state, updatedEvent);
}

// ─── Close event ──────────────────────────────────────────────────────
function closeEvent(state: AppState, eventId: string): AppState {
  const event = state.events.find((e) => e.id === eventId);
  if (!event) return state;
  const updatedEvent: Event = { ...event, closed: true };
  let newState = updateEvent(state, updatedEvent);
  if (newState.activeEventId === eventId) {
    newState = { ...newState, activeEventId: null };
    saveState(newState);
  }
  return newState;
}

// ─── Delete event ─────────────────────────────────────────────────────
function deleteEvent(state: AppState, eventId: string): AppState {
  const newState: AppState = { ...state };
  newState.events = state.events.filter((e) => e.id !== eventId);
  if (newState.activeEventId === eventId) {
    newState.activeEventId = null;
  }
  saveState(newState);
  return newState;
}

// ─── Reset (for testing / manual reset) ───────────────────────────────
function resetState(): AppState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_e) {
    /* ignore */
  }
  return defaultState();
}

export const Storage = {
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

export type { AppState };

