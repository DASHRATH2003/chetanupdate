import React, { createContext, useState, useEffect, useCallback } from 'react';
import img1 from "../assets/GalleryImages/1.webp";
import img2 from "../assets/GalleryImages/2.webp";
import img3 from "../assets/GalleryImages/3.webp";
import img4 from "../assets/GalleryImages/4.webp";
import imageStorage from '../utils/simpleImageStorage';

// Storage event listener for cross-tab synchronization
const STORAGE_CHANGE_EVENT = 'galleryStorageChange';

export const GalleryContext = createContext();

export const GalleryProvider = ({ children }) => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now()); // Track last update time

  // Function to refresh gallery data from localStorage
  const refreshGalleryFromStorage = useCallback(() => {
    console.log("Refreshing gallery data from localStorage");
    setLoading(true);

    try {
      // Try to load gallery from localStorage
      const savedGallery = localStorage.getItem('gallery');

      if (savedGallery) {
        try {
          const parsedGallery = JSON.parse(savedGallery);

          // Validate the gallery data
          if (Array.isArray(parsedGallery) && parsedGallery.length > 0) {
            // Process any image references and deduplicate
            const uniqueItemsMap = new Map();

            parsedGallery.forEach(item => {
              if (!item || !item._id) {
                console.warn("Invalid gallery item:", item);
                return; // Skip invalid items
              }

              // Check if this item is already in the map
              if (uniqueItemsMap.has(item._id)) {
                // Compare timestamps and keep the most recent
                const existingItem = uniqueItemsMap.get(item._id);
                const existingTimestamp = existingItem.timestamp || existingItem.lastUpdated || 0;
                const newTimestamp = item.timestamp || item.lastUpdated || 0;

                if (newTimestamp > existingTimestamp) {
                  // Replace with newer item
                  uniqueItemsMap.set(item._id, item);
                }

                return; // Skip further processing
              }

              // Add to map
              uniqueItemsMap.set(item._id, item);
            });

            // Convert map to array
            const processedGallery = Array.from(uniqueItemsMap.values());

            setGallery(processedGallery);
            console.log("Gallery data refreshed successfully");
          } else {
            console.warn("Empty or invalid gallery array in localStorage");
            // Don't reset to default if refresh fails
          }
        } catch (error) {
          console.error("Error parsing gallery from localStorage:", error);
        }
      } else {
        console.log("No saved gallery found in localStorage");
      }
    } catch (error) {
      console.error("Error refreshing gallery:", error);
    } finally {
      setLoading(false);
      setLastUpdate(Date.now());
    }
  }, []);

  // Listen for storage events (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'gallery' || event.key === 'gallery-last-updated') {
        console.log("Gallery data changed in another tab, refreshing");
        refreshGalleryFromStorage();
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events (for same-tab synchronization)
    window.addEventListener(STORAGE_CHANGE_EVENT, refreshGalleryFromStorage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(STORAGE_CHANGE_EVENT, refreshGalleryFromStorage);
    };
  }, [refreshGalleryFromStorage]);

  // Initialize with default gallery items or load from localStorage
  useEffect(() => {
    const initializeGallery = () => {
      console.log("GalleryProvider initialized");

      try {
        console.log("All localStorage keys:", Object.keys(localStorage));

        // Try to load gallery from localStorage
        const savedGallery = localStorage.getItem('gallery');
        console.log("Saved gallery exists:", !!savedGallery);

        if (savedGallery) {
          console.log("Saved gallery length:", savedGallery.length);

          try {
            const parsedGallery = JSON.parse(savedGallery);
            console.log("Loaded gallery from localStorage:", parsedGallery);

            // Validate the gallery data
            if (Array.isArray(parsedGallery) && parsedGallery.length > 0) {
              console.log("Gallery is a valid array with items");

              // Check if all required fields are present
              const isValid = parsedGallery.every(item =>
                item && item._id && (item.imageUrl || item.src)
              );

              if (isValid) {
                console.log("All gallery items have required fields");

                // Process any image references and deduplicate
                const uniqueItemsMap = new Map();

                parsedGallery.forEach(item => {
                  if (!item || !item._id) {
                    console.warn("Invalid gallery item:", item);
                    return; // Skip invalid items
                  }

                  // Check if this item is already in the map
                  if (uniqueItemsMap.has(item._id)) {
                    console.log(`Duplicate item found with ID ${item._id}, using most recent`);

                    // Compare timestamps and keep the most recent
                    const existingItem = uniqueItemsMap.get(item._id);
                    const existingTimestamp = existingItem.timestamp || existingItem.lastUpdated || 0;
                    const newTimestamp = item.timestamp || item.lastUpdated || 0;

                    if (newTimestamp > existingTimestamp) {
                      // Replace with newer item
                      uniqueItemsMap.set(item._id, item);
                    }

                    return; // Skip further processing
                  }

                  // If the image is stored in our image storage, verify it exists
                  if (item.imageUrl && item.imageUrl.startsWith('img:')) {
                    const imageKey = item.imageUrl.substring(4); // Remove 'img:' prefix
                    const imageData = imageStorage.getImage(imageKey);

                    if (!imageData) {
                      console.warn(`Image not found for key: ${imageKey}, using fallback`);
                      uniqueItemsMap.set(item._id, {
                        ...item,
                        imageUrl: '/src/assets/GalleryImages/1.webp'
                      });
                      return;
                    }
                  }

                  // Add to map
                  uniqueItemsMap.set(item._id, item);
                });

                // Convert map to array
                const processedGallery = Array.from(uniqueItemsMap.values());

                setGallery(processedGallery);
                console.log("Gallery data is valid and loaded successfully");
              } else {
                console.warn("Invalid gallery data in localStorage, using defaults");
                initializeDefaultGallery();
              }
            } else {
              console.warn("Empty or invalid gallery array in localStorage, using defaults");
              initializeDefaultGallery();
            }
          } catch (error) {
            console.error("Error parsing gallery from localStorage:", error);
            // Fall back to default gallery
            initializeDefaultGallery();
          }
        } else {
          console.log("No saved gallery found, using defaults");
          // No saved gallery, use defaults
          initializeDefaultGallery();
        }
      } catch (error) {
        console.error("Error initializing gallery:", error);
        initializeDefaultGallery();
      } finally {
        setLoading(false);
      }
    };

    // Initialize the gallery immediately
    initializeGallery();
  }, []);

  // Helper function to initialize default gallery
  const initializeDefaultGallery = () => {
    // Create default gallery items with unique IDs
    const defaultGallery = [
      {
        _id: 'default-1',
        title: 'Image 1',
        description: 'Description 1',
        imageUrl: '/src/assets/GalleryImages/1.webp',
        alt: "Gallery image 1"
      },
      {
        _id: 'default-2',
        title: 'Image 2',
        description: 'Description 2',
        imageUrl: '/src/assets/GalleryImages/2.webp',
        alt: "Gallery image 2"
      },
      {
        _id: 'default-3',
        title: 'Image 3',
        description: 'Description 3',
        imageUrl: '/src/assets/GalleryImages/3.webp',
        alt: "Gallery image 3"
      },
      {
        _id: 'default-4',
        title: 'Image 4',
        description: 'Description 4',
        imageUrl: '/src/assets/GalleryImages/4.webp',
        alt: "Gallery image 4"
      }
    ];

    // Set the gallery state
    setGallery(defaultGallery);
    console.log("Default gallery set:", defaultGallery);

    // Save to localStorage
    try {
      localStorage.setItem('gallery', JSON.stringify(defaultGallery));
    } catch (error) {
      console.error("Error saving default gallery to localStorage:", error);
    }

    // Try to store the images in the background
    setTimeout(() => {
      try {
        // Store the default images in our storage
        imageStorage.storeImage('gallery-image-default-1', img1)
          .catch(err => console.error("Error storing default image 1:", err));
        imageStorage.storeImage('gallery-image-default-2', img2)
          .catch(err => console.error("Error storing default image 2:", err));
        imageStorage.storeImage('gallery-image-default-3', img3)
          .catch(err => console.error("Error storing default image 3:", err));
        imageStorage.storeImage('gallery-image-default-4', img4)
          .catch(err => console.error("Error storing default image 4:", err));
      } catch (error) {
        console.error("Error initializing default gallery images:", error);
      }
    }, 0);
  };

  // Add a new gallery item
  const addGalleryItem = async (item) => {
    console.log("Adding gallery item:", item);

    // Create a safe copy of the item for localStorage
    const safeItem = {
      _id: item._id || `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: item.title || 'Untitled',
      description: item.description || '',
      imageUrl: item.imageUrl,
      alt: item.alt || item.title || 'Gallery image',
      timestamp: Date.now() // Add timestamp for tracking
    };

    console.log("Safe item created:", safeItem);

    // If imageUrl is a data URL (from FileReader), store it using our image storage utility
    if (safeItem.imageUrl && safeItem.imageUrl.startsWith('data:')) {
      console.log("Image URL is a data URL, storing separately");

      // Generate a unique key for the image
      const imageKey = safeItem._id;

      // Store the image with metadata
      const success = await imageStorage.storeImage(imageKey, item.imageUrl, {
        title: safeItem.title,
        description: safeItem.description,
        alt: safeItem.alt
      });

      if (success) {
        console.log("Image stored successfully with key:", imageKey);
        // Store a reference to the image
        safeItem.imageUrl = `img:${imageKey}`;
      } else {
        console.error("Error storing image");
        // If storing the image fails, use a fallback
        safeItem.imageUrl = '/src/assets/GalleryImages/1.webp';
      }
    }

    // Use functional update to ensure we're working with the latest state
    setGallery(prevGallery => {
      // Check if this item already exists (by ID)
      const existingItemIndex = prevGallery.findIndex(item => item._id === safeItem._id);

      // Create new gallery array - either replace existing item or add to beginning
      const newGallery = existingItemIndex >= 0
        ? [
            ...prevGallery.slice(0, existingItemIndex),
            safeItem,
            ...prevGallery.slice(existingItemIndex + 1)
          ]
        : [safeItem, ...prevGallery];

      // Save to localStorage
      try {
        // Ensure we don't have duplicates before saving
        const uniqueItemsMap = new Map();
        newGallery.forEach(item => {
          if (item && item._id) {
            // If item already exists in map, keep the one with the most recent timestamp
            if (uniqueItemsMap.has(item._id)) {
              const existingItem = uniqueItemsMap.get(item._id);
              const existingTimestamp = existingItem.timestamp || existingItem.lastUpdated || 0;
              const newTimestamp = item.timestamp || item.lastUpdated || 0;

              if (newTimestamp > existingTimestamp) {
                uniqueItemsMap.set(item._id, item);
              }
            } else {
              uniqueItemsMap.set(item._id, item);
            }
          }
        });

        // Convert map back to array
        const uniqueGallery = Array.from(uniqueItemsMap.values());

        // Save gallery metadata separately from images
        const galleryJson = JSON.stringify(uniqueGallery);
        console.log("Gallery JSON length:", galleryJson.length);

        localStorage.setItem('gallery', galleryJson);
        console.log("Gallery saved to localStorage");

        // Also save a timestamp of the last update
        const updateTime = Date.now();
        localStorage.setItem('gallery-last-updated', updateTime.toString());
        setLastUpdate(updateTime);

        console.log("Gallery item added:", safeItem);
        console.log("Updated gallery:", uniqueGallery);

        // Dispatch a custom event to notify other components in the same tab
        window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));

        // Return the deduplicated gallery
        return uniqueGallery;
      } catch (error) {
        console.error("Error saving gallery to localStorage:", error);
        return newGallery;
      }
    });
  };

  // Update an existing gallery item
  const updateGalleryItem = async (updatedItem) => {
    console.log("Updating gallery item:", updatedItem);

    // Find the existing item
    const existingItem = gallery.find(item => item._id === updatedItem._id);
    if (!existingItem) {
      console.error("Item not found for update:", updatedItem._id);
      return;
    }

    // Create a safe copy of the updated item
    const safeItem = {
      ...existingItem, // Keep existing properties
      _id: updatedItem._id,
      title: updatedItem.title || 'Untitled',
      description: updatedItem.description || '',
      imageUrl: updatedItem.imageUrl || existingItem.imageUrl,
      alt: updatedItem.alt || updatedItem.title || 'Gallery image',
      lastUpdated: Date.now() // Add update timestamp
    };

    // If imageUrl is a data URL (from FileReader), store it using our image storage utility
    if (safeItem.imageUrl && safeItem.imageUrl.startsWith('data:')) {
      console.log("Image URL is a data URL, storing separately");

      // Generate a unique key for the image (use existing ID)
      const imageKey = safeItem._id;

      // Store the image with metadata
      const success = await imageStorage.storeImage(imageKey, updatedItem.imageUrl, {
        title: safeItem.title,
        description: safeItem.description,
        alt: safeItem.alt
      });

      if (success) {
        console.log("Image stored successfully with key:", imageKey);
        // Store a reference to the image
        safeItem.imageUrl = `img:${imageKey}`;
      } else {
        console.error("Error storing image");
        // If storing the image fails, keep the existing URL
        safeItem.imageUrl = existingItem.imageUrl;
      }
    }

    // Use functional update to ensure we're working with the latest state
    setGallery(prevGallery => {
      const newGallery = prevGallery.map(item =>
        item._id === safeItem._id ? safeItem : item
      );

      // Save to localStorage
      try {
        localStorage.setItem('gallery', JSON.stringify(newGallery));
        // Also save a timestamp of the last update
        const updateTime = Date.now();
        localStorage.setItem('gallery-last-updated', updateTime.toString());
        setLastUpdate(updateTime);

        console.log("Gallery item updated:", safeItem);

        // Dispatch a custom event to notify other components in the same tab
        window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
      } catch (error) {
        console.error("Error saving gallery to localStorage:", error);
      }

      return newGallery;
    });
  };

  // Delete a gallery item
  const deleteGalleryItem = async (id) => {
    console.log("Deleting gallery item:", id);

    // Check if we need to remove any stored image data
    const itemToDelete = gallery.find(item => item._id === id);
    if (!itemToDelete) {
      console.error("Item not found for deletion:", id);
      return;
    }

    // If the image is stored in our image storage, remove it
    if (itemToDelete.imageUrl && itemToDelete.imageUrl.startsWith('img:')) {
      try {
        // Extract the key from the URL
        const imageKey = itemToDelete.imageUrl.substring(4); // Remove 'img:' prefix

        // Remove the stored image data using our utility
        const success = imageStorage.removeImage(imageKey);
        if (success) {
          console.log("Image removed successfully with key:", imageKey);
        } else {
          console.warn("Failed to remove image with key:", imageKey);
        }
      } catch (error) {
        console.error("Error removing image:", error);
      }
    }

    // Use functional update to ensure we're working with the latest state
    setGallery(prevGallery => {
      const newGallery = prevGallery.filter(item => item._id !== id);

      // Save to localStorage
      try {
        localStorage.setItem('gallery', JSON.stringify(newGallery));
        // Also save a timestamp of the last update
        const updateTime = Date.now();
        localStorage.setItem('gallery-last-updated', updateTime.toString());
        setLastUpdate(updateTime);

        console.log("Gallery item deleted:", id);

        // Dispatch a custom event to notify other components in the same tab
        window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
      } catch (error) {
        console.error("Error saving gallery to localStorage:", error);
      }

      return newGallery;
    });
  };

  return (
    <GalleryContext.Provider
      value={{
        gallery,
        loading,
        error,
        lastUpdate,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        refreshGalleryFromStorage,
        setGallery
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
};

export default GalleryContext;
