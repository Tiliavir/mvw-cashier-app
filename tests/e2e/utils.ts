export const STORAGE_KEY = 'kassierer_app_v1';

export function buildSeedState() {
  const eventId = 'event-1';
  const now = new Date('2025-01-01T12:00:00.000Z').toISOString();
  return {
    eventId,
    state: {
      events: [
        {
          id: eventId,
          name: 'Vereinsfest',
          createdAt: now,
          items: [
            { id: 'item-1', name: 'Wasser', price: 1.5, color: '#85c1e9' },
            { id: 'item-2', name: 'Bier', price: 2.5, color: '#e67e22' },
          ],
          transactions: [
            {
              timestamp: now,
              items: [{ itemId: 'item-1', quantity: 2 }],
              total: 3.0,
              received: 5.0,
              change: 2.0,
            },
          ],
          closed: false,
        },
      ],
      activeEventId: eventId,
    },
  };
}

export function buildClosedEventSeed() {
  const eventId = 'event-closed';
  const now = new Date('2025-01-02T10:00:00.000Z').toISOString();
  return {
    eventId,
    state: {
      events: [
        {
          id: eventId,
          name: 'Sommerfest',
          createdAt: now,
          items: [
            { id: 'item-1', name: 'Kuchen', price: 2.5, color: '#d7ccc8' },
          ],
          transactions: [
            {
              timestamp: now,
              items: [{ itemId: 'item-1', quantity: 1 }],
              total: 2.5,
              received: 5.0,
              change: 2.5,
            },
          ],
          closed: true,
        },
      ],
      activeEventId: null,
    },
  };
}

