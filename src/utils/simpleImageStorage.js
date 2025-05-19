/**
 * Simple image storage utility that uses localStorage for metadata
 * and stores compressed image data directly
 */

// Prefix for all image keys in localStorage
const IMAGE_KEY_PREFIX = 'gallery-img-';
// Prefix for all image metadata keys in localStorage
const METADATA_KEY_PREFIX = 'gallery-meta-';

/**
 * Compress an image data URL to reduce its size
 * @param {string} dataUrl - The original data URL
 * @param {number} maxWidth - Maximum width of the compressed image
 * @param {number} quality - Quality of the compressed image (0-1)
 * @returns {Promise<string>} - A promise that resolves with the compressed data URL
 */
const compressImage = (dataUrl, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Store an image in localStorage
 * @param {string} key - The key to store the image under (without prefix)
 * @param {string} imageData - The image data URL
 * @param {Object} metadata - Additional metadata to store with the image
 * @returns {Promise<boolean>} - A promise that resolves with true if successful
 */
export const storeImage = async (key, imageData, metadata = {}) => {
  try {
    if (!key) {
      console.error("Cannot store image: No key provided");
      return false;
    }

    if (!imageData) {
      console.error(`Cannot store image with key ${key}: No image data provided`);
      return false;
    }

    console.log(`Storing image with key: ${key}`);

    // Compress the image data
    const compressedData = await compressImage(imageData);
    console.log(`Original size: ${imageData.length}, Compressed size: ${compressedData.length}`);

    // Store the image data
    try {
      localStorage.setItem(`${IMAGE_KEY_PREFIX}${key}`, compressedData);
    } catch (storageError) {
      console.error(`Error storing image data in localStorage: ${storageError.message}`);

      // Try to free up space by removing old images
      try {
        const oldKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey && storageKey.startsWith(IMAGE_KEY_PREFIX) && storageKey !== `${IMAGE_KEY_PREFIX}${key}`) {
            oldKeys.push(storageKey);
          }
        }

        // Sort by timestamp if available
        oldKeys.sort((a, b) => {
          const metaA = localStorage.getItem(`${METADATA_KEY_PREFIX}${a.substring(IMAGE_KEY_PREFIX.length)}`);
          const metaB = localStorage.getItem(`${METADATA_KEY_PREFIX}${b.substring(IMAGE_KEY_PREFIX.length)}`);

          if (metaA && metaB) {
            try {
              const timestampA = JSON.parse(metaA).timestamp || 0;
              const timestampB = JSON.parse(metaB).timestamp || 0;
              return timestampA - timestampB;
            } catch (e) {
              return 0;
            }
          }
          return 0;
        });

        // Remove oldest images first
        for (let i = 0; i < Math.min(oldKeys.length, 3); i++) {
          localStorage.removeItem(oldKeys[i]);
          console.log(`Removed old image to free up space: ${oldKeys[i]}`);
        }

        // Try again
        localStorage.setItem(`${IMAGE_KEY_PREFIX}${key}`, compressedData);
      } catch (retryError) {
        console.error(`Failed to store image after cleanup: ${retryError.message}`);
        return false;
      }
    }

    // Store metadata
    const metadataWithTimestamp = {
      ...metadata,
      timestamp: Date.now(),
      originalKey: key
    };

    try {
      localStorage.setItem(`${METADATA_KEY_PREFIX}${key}`, JSON.stringify(metadataWithTimestamp));
    } catch (metaError) {
      console.error(`Error storing image metadata: ${metaError.message}`);
      // Continue anyway, the image data is more important
    }

    console.log(`Image stored successfully with key: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error storing image with key ${key}:`, error);
    return false;
  }
};

/**
 * Get an image from localStorage
 * @param {string} key - The key the image is stored under (without prefix)
 * @returns {Object|null} - The image data and metadata, or null if not found
 */
export const getImage = (key) => {
  try {
    if (!key) {
      console.error("Cannot get image: No key provided");
      return null;
    }

    console.log(`Getting image with key: ${key}`);

    // Get the image data
    const imageData = localStorage.getItem(`${IMAGE_KEY_PREFIX}${key}`);

    if (!imageData) {
      console.log(`Image not found with key: ${key}`);

      // Check if this is a default gallery item
      if (key.startsWith('default-')) {
        // For default items, return the corresponding default image
        const defaultIndex = parseInt(key.split('-')[1]);
        if (defaultIndex >= 1 && defaultIndex <= 4) {
          console.log(`Using built-in default image for key: ${key}`);
          return {
            data: `/src/assets/GalleryImages/${defaultIndex}.webp`,
            metadata: {
              isDefault: true,
              originalKey: key
            }
          };
        }
      }

      return null;
    }

    // Get metadata
    const metadataString = localStorage.getItem(`${METADATA_KEY_PREFIX}${key}`);
    const metadata = metadataString ? JSON.parse(metadataString) : {};

    // Update the access timestamp in metadata
    try {
      const updatedMetadata = {
        ...metadata,
        lastAccessed: Date.now()
      };
      localStorage.setItem(`${METADATA_KEY_PREFIX}${key}`, JSON.stringify(updatedMetadata));
    } catch (metaError) {
      // Ignore metadata update errors
      console.warn(`Could not update metadata for key ${key}:`, metaError);
    }

    console.log(`Image retrieved successfully with key: ${key}`);

    return {
      data: imageData,
      metadata
    };
  } catch (error) {
    console.error(`Error getting image with key ${key}:`, error);
    return null;
  }
};

/**
 * Remove an image from localStorage
 * @param {string} key - The key the image is stored under (without prefix)
 * @returns {boolean} - True if successful
 */
export const removeImage = (key) => {
  try {
    console.log(`Removing image with key: ${key}`);

    // Remove the image data
    localStorage.removeItem(`${IMAGE_KEY_PREFIX}${key}`);

    // Remove metadata
    localStorage.removeItem(`${METADATA_KEY_PREFIX}${key}`);

    console.log(`Image removed successfully with key: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error removing image with key ${key}:`, error);
    return false;
  }
};

/**
 * List all stored images
 * @returns {Array} - Array of image keys
 */
export const listImages = () => {
  try {
    const keys = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith(IMAGE_KEY_PREFIX)) {
        keys.push(key.substring(IMAGE_KEY_PREFIX.length));
      }
    }

    return keys;
  } catch (error) {
    console.error('Error listing images:', error);
    return [];
  }
};

export default {
  storeImage,
  getImage,
  removeImage,
  listImages
};
