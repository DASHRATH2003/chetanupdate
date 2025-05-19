/**
 * Utility functions for storing and retrieving images
 * This uses a combination of localStorage and IndexedDB to handle large images
 */

// Check if IndexedDB is available
const indexedDBAvailable = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

// Database name and store name
const DB_NAME = 'galleryImagesDB';
const STORE_NAME = 'images';
let db = null;
let dbInitialized = false;
let dbInitPromise = null;

/**
 * Initialize the database
 * @returns {Promise} A promise that resolves when the database is ready
 */
export const initDB = () => {
  // If we already have an initialization promise, return it
  if (dbInitPromise) {
    return dbInitPromise;
  }

  // Create a new initialization promise
  dbInitPromise = new Promise((resolve, reject) => {
    // If already initialized, resolve immediately
    if (dbInitialized && db) {
      console.log('IndexedDB already initialized');
      resolve(true);
      return;
    }

    if (!indexedDBAvailable) {
      console.warn('IndexedDB is not available, falling back to localStorage only');
      dbInitialized = true;
      resolve(false);
      return;
    }

    console.log('Initializing IndexedDB...');
    const request = indexedDBAvailable.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event.target.error);
      dbInitialized = true;
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      dbInitialized = true;
      console.log('IndexedDB initialized successfully');
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        console.log('Created images object store');
      }
    };
  });

  return dbInitPromise;
};

/**
 * Store an image in IndexedDB or localStorage
 * @param {string} key - The key to store the image under
 * @param {string} imageData - The image data (usually a data URL)
 * @returns {Promise} A promise that resolves when the image is stored
 */
export const storeImage = async (key, imageData) => {
  console.log(`Storing image with key: ${key}`);

  try {
    // Make sure the database is initialized first
    await initDB();

    // Try to use IndexedDB first
    if (db && dbInitialized) {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);

          const request = store.put({ id: key, data: imageData });

          request.onsuccess = () => {
            console.log(`Image stored in IndexedDB with key: ${key}`);
            // Store a marker in localStorage to indicate this image is in IndexedDB
            localStorage.setItem(`idb-${key}`, 'true');
            resolve(true);
          };

          request.onerror = (event) => {
            console.error('Error storing image in IndexedDB:', event.target.error);
            // Fall back to localStorage
            try {
              localStorage.setItem(key, imageData);
              console.log(`Image stored in localStorage with key: ${key}`);
              resolve(true);
            } catch (error) {
              console.error('Error storing image in localStorage:', error);
              reject(error);
            }
          };
        } catch (error) {
          console.error('Transaction error:', error);
          // Fall back to localStorage
          try {
            localStorage.setItem(key, imageData);
            console.log(`Image stored in localStorage with key: ${key}`);
            resolve(true);
          } catch (localStorageError) {
            console.error('Error storing image in localStorage:', localStorageError);
            reject(localStorageError);
          }
        }
      });
    } else {
      // Fall back to localStorage
      try {
        localStorage.setItem(key, imageData);
        console.log(`Image stored in localStorage with key: ${key}`);
        return Promise.resolve(true);
      } catch (error) {
        console.error('Error storing image in localStorage:', error);
        return Promise.reject(error);
      }
    }
  } catch (initError) {
    console.error('Error initializing database:', initError);
    // Fall back to localStorage
    try {
      localStorage.setItem(key, imageData);
      console.log(`Image stored in localStorage with key: ${key}`);
      return Promise.resolve(true);
    } catch (error) {
      console.error('Error storing image in localStorage:', error);
      return Promise.reject(error);
    }
  }
};

/**
 * Get an image from IndexedDB or localStorage
 * @param {string} key - The key the image is stored under
 * @returns {Promise<string>} A promise that resolves with the image data
 */
export const getImage = async (key) => {
  console.log(`Getting image with key: ${key}`);

  try {
    // Make sure the database is initialized first
    await initDB();

    // Check if this image is in IndexedDB
    const isInIndexedDB = localStorage.getItem(`idb-${key}`) === 'true';

    if (isInIndexedDB && db && dbInitialized) {
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);

          const request = store.get(key);

          request.onsuccess = (event) => {
            if (event.target.result) {
              console.log(`Image retrieved from IndexedDB with key: ${key}`);
              resolve(event.target.result.data);
            } else {
              console.log(`Image not found in IndexedDB with key: ${key}`);
              // Try localStorage as fallback
              const localData = localStorage.getItem(key);
              if (localData) {
                console.log(`Image retrieved from localStorage with key: ${key}`);
                resolve(localData);
              } else {
                resolve(null);
              }
            }
          };

          request.onerror = (event) => {
            console.error('Error getting image from IndexedDB:', event.target.error);
            // Try localStorage as fallback
            const localData = localStorage.getItem(key);
            if (localData) {
              console.log(`Image retrieved from localStorage with key: ${key}`);
              resolve(localData);
            } else {
              resolve(null);
            }
          };
        } catch (error) {
          console.error('Transaction error:', error);
          // Try localStorage as fallback
          const localData = localStorage.getItem(key);
          if (localData) {
            console.log(`Image retrieved from localStorage with key: ${key}`);
            resolve(localData);
          } else {
            resolve(null);
          }
        }
      });
    } else {
      // Get from localStorage
      const data = localStorage.getItem(key);
      if (data) {
        console.log(`Image retrieved from localStorage with key: ${key}`);
        return Promise.resolve(data);
      } else {
        console.log(`Image not found in localStorage with key: ${key}`);
        return Promise.resolve(null);
      }
    }
  } catch (initError) {
    console.error('Error initializing database:', initError);
    // Fall back to localStorage
    const data = localStorage.getItem(key);
    if (data) {
      console.log(`Image retrieved from localStorage with key: ${key}`);
      return Promise.resolve(data);
    } else {
      console.log(`Image not found in localStorage with key: ${key}`);
      return Promise.resolve(null);
    }
  }
};

/**
 * Remove an image from storage
 * @param {string} key - The key the image is stored under
 * @returns {Promise} A promise that resolves when the image is removed
 */
export const removeImage = async (key) => {
  console.log(`Removing image with key: ${key}`);

  try {
    // Make sure the database is initialized first
    await initDB();

    // Check if this image is in IndexedDB
    const isInIndexedDB = localStorage.getItem(`idb-${key}`) === 'true';

    if (isInIndexedDB && db && dbInitialized) {
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);

          const request = store.delete(key);

          request.onsuccess = () => {
            console.log(`Image removed from IndexedDB with key: ${key}`);
            localStorage.removeItem(`idb-${key}`);
            // Also remove from localStorage in any case
            localStorage.removeItem(key);
            resolve(true);
          };

          request.onerror = (event) => {
            console.error('Error removing image from IndexedDB:', event.target.error);
            // Still try to remove from localStorage
            localStorage.removeItem(key);
            localStorage.removeItem(`idb-${key}`);
            resolve(false);
          };
        } catch (error) {
          console.error('Transaction error:', error);
          // Still try to remove from localStorage
          localStorage.removeItem(key);
          localStorage.removeItem(`idb-${key}`);
          resolve(false);
        }
      });
    }

    // Also remove from localStorage in any case
    localStorage.removeItem(key);
    localStorage.removeItem(`idb-${key}`);

    return Promise.resolve(true);
  } catch (initError) {
    console.error('Error initializing database:', initError);
    // Still try to remove from localStorage
    localStorage.removeItem(key);
    localStorage.removeItem(`idb-${key}`);
    return Promise.resolve(false);
  }
};

// Initialize the database when this module is imported
initDB().catch(error => {
  console.error('Failed to initialize image storage database:', error);
});

export default {
  initDB,
  storeImage,
  getImage,
  removeImage
};
