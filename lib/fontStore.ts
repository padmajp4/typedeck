/**
 * Uploaded font files, kept in IndexedDB so they survive a reload. The bytes
 * stay on the user's machine; nothing here talks to a server. localStorage is
 * unsuitable because font binaries are far too large for it.
 */

const DB_NAME = "typedeck";
const DB_VERSION = 1;
const STORE = "uploads";

export interface StoredFont {
  /** Font family name, and the primary key. */
  family: string;
  weight: number;
  italic: boolean;
  bytes: ArrayBuffer;
  addedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "family" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    openDb()
      .then((db) => {
        const tx = db.transaction(STORE, mode);
        const request = fn(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      })
      .catch(reject);
  });
}

/** Private browsing and some lockdown settings make IndexedDB unavailable. */
function available() {
  return typeof indexedDB !== "undefined";
}

export async function saveFont(font: StoredFont) {
  if (!available()) return;
  try {
    await run("readwrite", (store) => store.put(font));
  } catch {
    // Quota or private-mode failures should not break the upload itself.
  }
}

export async function loadStoredFonts(): Promise<StoredFont[]> {
  if (!available()) return [];
  try {
    return (await run<StoredFont[]>("readonly", (store) => store.getAll())) ?? [];
  } catch {
    return [];
  }
}

export async function clearStoredFonts() {
  if (!available()) return;
  try {
    await run("readwrite", (store) => store.clear());
  } catch {
    // Nothing useful to do if the store cannot be opened.
  }
}
