/**
 * IDBManager: A simple native wrapper for IndexedDB to handle Background Sync actions.
 */

const DB_NAME = 'MzansiRideSync';
const DB_VERSION = 2; // Incremented for new store
const STORE_SYNC = 'sync_queue';
const STORE_STATE = 'stored_state';

export interface SyncAction {
  id?: number;
  type: string;
  data: any;
  userId: string;
  timestamp: number;
  authToken: string;
}

export class IDBManager {
  private static db: IDBDatabase | null = null;

  static async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_SYNC)) {
          db.createObjectStore(STORE_SYNC, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(STORE_STATE)) {
          db.createObjectStore(STORE_STATE);
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // --- Background Sync Queue Methods ---

  static async addAction(action: Omit<SyncAction, 'id'>): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SYNC, 'readwrite');
      const store = transaction.objectStore(STORE_SYNC);
      const request = store.add(action);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  static async getActions(): Promise<SyncAction[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SYNC, 'readonly');
      const store = transaction.objectStore(STORE_SYNC);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async removeAction(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SYNC, 'readwrite');
      const store = transaction.objectStore(STORE_SYNC);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Persistent State Caching Methods ---

  static async setCachedData(key: string, data: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_STATE, 'readwrite');
      const store = transaction.objectStore(STORE_STATE);
      const request = store.put(data, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async getCachedData(key: string): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_STATE, 'readonly');
      const store = transaction.objectStore(STORE_STATE);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async clearQueue(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SYNC, 'readwrite');
      const store = transaction.objectStore(STORE_SYNC);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
