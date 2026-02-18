import { TravelPin, AppConfig, DEFAULT_CONFIG } from './types';

const DB_NAME = 'travel-pins-db';
const DB_VERSION = 2;
const PINS_STORE = 'pins';
const CONFIG_STORE = 'config';
const CONFIG_KEY = 'app-config';

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(PINS_STORE)) {
                db.createObjectStore(PINS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(CONFIG_STORE)) {
                db.createObjectStore(CONFIG_STORE);
            }
        };
    });
};

// ── Pins ──────────────────────────────────────────────────────────────────────

export const getAllPins = async (): Promise<TravelPin[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PINS_STORE, 'readonly');
        const store = transaction.objectStore(PINS_STORE);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

export const savePinToDB = async (pin: TravelPin): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PINS_STORE, 'readwrite');
        const store = transaction.objectStore(PINS_STORE);
        const request = store.put(pin);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

export const deletePinFromDB = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PINS_STORE, 'readwrite');
        const store = transaction.objectStore(PINS_STORE);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

// ── Config ────────────────────────────────────────────────────────────────────

export const getConfig = async (): Promise<AppConfig> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CONFIG_STORE, 'readonly');
        const store = transaction.objectStore(CONFIG_STORE);
        const request = store.get(CONFIG_KEY);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ?? DEFAULT_CONFIG);
    });
};

export const saveConfig = async (config: AppConfig): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CONFIG_STORE, 'readwrite');
        const store = transaction.objectStore(CONFIG_STORE);
        const request = store.put(config, CONFIG_KEY);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};
