// Cache configuration
const CACHE_NAME = 'mzansi-ride-v1';
const OFFLINE_URL = '/offline';
const CORE_ASSETS = [
  '/',
  '/offline',
  '/icon.png',
  '/manifest.json'
];

// Supabase Config (Safe for Public Use)
const SUPABASE_URL = 'https://jvqdkdrgrazbvnornwvc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2cWRrZHJncmF6YnZub3Jud3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTc4ODUsImV4cCI6MjA5MjI5Mzg4NX0.atjEm3jbTTYJw8r1LNUKTN4erYnuhn4yFOA_bzQZ_38';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background Sync Listener
self.addEventListener('sync', (event) => {
  if (event.tag === 'mzansi-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const db = await openDB();
  const actions = await getAllActions(db);

  for (const action of actions) {
    try {
      await replayAction(action);
      await deleteAction(db, action.id);
      console.log(`[SW Sync] Successfully synced action: ${action.type}`);
    } catch (err) {
      console.error(`[SW Sync] Failed to sync action ${action.id}:`, err);
      // We don't delete on failure, so it retries next time
    }
  }
}

async function replayAction(action) {
  let url = '';
  let method = 'POST';
  let body = {};

  switch (action.type) {
    case 'SUBMIT_TRIP':
      url = `${SUPABASE_URL}/rest/v1/trips`;
      body = {
        rider_id: action.data.riderId,
        pickup_address: action.data.pickup,
        dropoff_address: action.data.dropoff,
        status: action.data.status || 'requested',
        fare: action.data.fare,
        currency: action.data.currency || 'ZAR'
      };
      break;
    case 'TRIGGER_SOS':
      url = `${SUPABASE_URL}/rest/v1/sos_alerts`;
      body = {
        user_id: action.userId,
        location: action.data.location,
        trip_id: action.data.tripId,
        severity: 'critical'
      };
      break;
    case 'CAST_VOTE':
      url = `${SUPABASE_URL}/rest/v1/coop_votes`;
      body = {
        proposal_id: action.data.proposalId,
        profile_id: action.userId,
        vote: action.data.vote
      };
      break;
    case 'MARK_NOTIFICATION_READ':
      url = `${SUPABASE_URL}/rest/v1/notifications?id=eq.${action.data.notificationId}`;
      method = 'PATCH';
      body = { read: true };
      break;
    case 'CREATE_PROPOSAL':
      url = `${SUPABASE_URL}/rest/v1/coop_proposals`;
      body = {
        title: action.data.title,
        description: action.data.description,
        deadline: action.data.deadline,
        total_eligible: action.data.totalEligible || 1000
      };
      break;
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }

  const response = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${action.authToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sync fetch failed: ${response.status} - ${errorText}`);
  }
}

// Minimal IDB implementation for SW
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MzansiRideSync', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync_queue', 'readonly');
    const store = transaction.objectStore('sync_queue');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('sync_queue', 'readwrite');
    const store = transaction.objectStore('sync_queue');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
