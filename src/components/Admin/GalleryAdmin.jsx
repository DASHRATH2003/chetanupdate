import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { FaUpload, FaTrash, FaImage, FaEdit, FaTimes, FaSync } from 'react-icons/fa';
import AdminLayout from './AdminLayout';
import { mockApi } from '../../utils/mockApi';
import GalleryContext from '../../context/GalleryContext';
import imageStorage from '../../utils/simpleImageStorage';

// Helper function to get image source from storage or use fallback
const getImageSource = (imageUrl) => {
  console.log("Admin - Getting image source for:", imageUrl);

  if (!imageUrl) {
    console.log("Admin - No image URL provided, returning fallback");
    return '/src/assets/GalleryImages/1.webp';
  }

  // If it's a direct URL or path, return it
  if (!imageUrl.startsWith('img:')) {
    // Check if it's a relative path to assets
    if (imageUrl.startsWith('/src/assets/')) {
      console.log("Admin - Image URL is a relative path to assets");
      return imageUrl;
    }

    // Check if it's a data URL
    if (imageUrl.startsWith('data:')) {
      console.log("Admin - Image URL is a data URL");
      return imageUrl;
    }

    // Check if it's an absolute URL
    if (imageUrl.startsWith('http')) {
      console.log("Admin - Image URL is an absolute URL");
      return imageUrl;
    }

    // For other paths, assume it's a relative path
    console.log("Admin - Image URL is a direct path, returning as is");
    return imageUrl;
  }

  // Try to get the data URL from our image storage utility
  try {
    const key = imageUrl.substring(4); // Remove the 'img:' prefix
    console.log("Admin - Looking for image with key:", key);

    // First check localStorage directly
    const directImageData = localStorage.getItem(`gallery-img-${key}`);
    if (directImageData) {
      console.log("Admin - Image data found directly in localStorage");
      return directImageData;
    }

    // Then try the image storage utility
    const imageResult = imageStorage.getImage(key);
    console.log("Admin - Image found in storage utility:", !!imageResult);

    if (imageResult && imageResult.data) {
      console.log("Admin - Image data retrieved successfully from storage utility");
      return imageResult.data;
    }

    // Check if this is a default gallery item
    if (key.startsWith('default-')) {
      const defaultIndex = parseInt(key.split('-')[1]);
      if (defaultIndex >= 1 && defaultIndex <= 4) {
        console.log(`Admin - Using built-in default image for key: ${key}`);
        return `/src/assets/GalleryImages/${defaultIndex}.webp`;
      }
    }

    console.log("Admin - Image not found in storage");
  } catch (error) {
    console.error("Admin - Error retrieving image:", error);
  }

  console.log("Admin - Using fallback image");
  // Fallback to a default image if we couldn't get the stored image
  return '/src/assets/GalleryImages/1.webp';
};

const GalleryAdmin = () => {
  // Use the GalleryContext
  const {
    gallery,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    setGallery,
    refreshGalleryFromStorage,
    lastUpdate
  } = useContext(GalleryContext);

  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true); // Track if API is available

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Check if API is available when component mounts
  useEffect(() => {
    const checkApiAvailability = async () => {
      if (window.location.hostname === 'localhost') {
        try {
          console.log("Checking API availability...");
          await axios.get('http://localhost:5000/api/health', {
            timeout: 1000 // Short timeout for quick check
          });
          console.log("API is available");
          setApiAvailable(true);
        } catch (error) {
          console.log("API is not available:", error.message);
          setApiAvailable(false);
        }
      }
    };

    checkApiAvailability();
  }, []);

  // Fetch gallery images when component mounts, API availability changes, or gallery is updated
  useEffect(() => {
    console.log("Gallery admin detected update, refreshing images...");
    fetchGalleryImages();
  }, [apiAvailable, lastUpdate]); // Re-fetch when API availability or lastUpdate changes



  const fetchGalleryImages = async () => {
    // Prevent multiple simultaneous fetches
    if (loading) {
      console.log("Already loading gallery images, skipping fetch");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching gallery images...");

      // Create a map to track unique IDs
      const uniqueImagesMap = new Map();

      // Check for image keys in localStorage
      const imageKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gallery-img-')) {
          const imageId = key.substring('gallery-img-'.length);
          imageKeys.push(imageId);
          console.log(`Found stored image with key: ${imageId}`);
        }
      }

      // First try to use the gallery from context
      if (gallery && gallery.length > 0) {
        console.log("Using gallery data from context:", gallery);

        // Process gallery items from context
        gallery.forEach(image => {
          if (!image || !image._id) {
            console.warn("Invalid gallery item found:", image);
            return; // Skip invalid items
          }

          // Use the existing ID
          const imageId = image._id;

          // Get the image source
          const imageUrl = getImageSource(image.imageUrl || image.src);

          // Skip items with no valid image source
          if (!imageUrl) {
            console.warn(`No valid image source for item ${imageId}, skipping`);
            return;
          }

          // Add to map with ID as key to ensure uniqueness
          uniqueImagesMap.set(imageId, {
            ...image,
            _id: imageId,
            localUrl: imageUrl,
            timestamp: image.timestamp || image.lastUpdated || Date.now()
          });
        });
      }

      // Check for any stored images not in the gallery
      imageKeys.forEach(imageKey => {
        // If this image is not already in our map, add it
        if (!uniqueImagesMap.has(imageKey)) {
          console.log(`Found stored image not in gallery: ${imageKey}`);

          // Get the image metadata
          const metadataString = localStorage.getItem(`gallery-meta-${imageKey}`);
          const metadata = metadataString ? JSON.parse(metadataString) : {};

          // Get the image source
          const imageUrl = getImageSource(`img:${imageKey}`);

          // Add to map
          uniqueImagesMap.set(imageKey, {
            _id: imageKey,
            title: metadata.title || 'Untitled Image',
            description: metadata.description || '',
            imageUrl: `img:${imageKey}`,
            localUrl: imageUrl,
            alt: metadata.alt || 'Gallery image',
            timestamp: metadata.timestamp || Date.now()
          });

          console.log(`Added missing image to gallery: ${imageKey}`);
        }
      });

      try {
        // Try to fetch from API in development, use mock API in production
        let galleryData = [];

        if (window.location.hostname === 'localhost' && apiAvailable) {
          try {
            // Development mode - try to use real API
            console.log("Attempting to connect to API...");
            const res = await axios.get('http://localhost:5000/api/gallery', {
              timeout: 2000 // Set a timeout to avoid long waits
            });
            console.log("Gallery data received from API:", res.data);
            galleryData = res.data;
            setApiAvailable(true); // API is available
          } catch (apiError) {
            console.log("API call failed, using mock data:", apiError);

            // If connection refused, mark API as unavailable to prevent future attempts
            if (apiError.code === 'ERR_NETWORK' || apiError.code === 'ECONNABORTED') {
              console.log("API server is not available, will use mock data for future requests");
              setApiAvailable(false);
            }

            // Fall back to mock API
            galleryData = await mockApi.getGallery();
            console.log("Gallery data received from mock API:", galleryData);
          }
        } else {
          // Production mode or API not available - use mock API
          if (!apiAvailable) {
            console.log("Using mock API (API server marked as unavailable)");
          } else {
            console.log("Using mock API (production mode)");
          }
          galleryData = await mockApi.getGallery();
          console.log("Gallery data received from mock API:", galleryData);
        }

        // Process gallery items from API/mock API
        galleryData.forEach(image => {
          if (!image || !image._id) {
            console.warn("Invalid gallery item from API:", image);
            return; // Skip invalid items
          }

          // Use the existing ID
          const imageId = image._id;

          // Determine the local URL
          let localUrl = '/src/assets/GalleryImages/1.webp'; // Default fallback

          if (image.imageUrl) {
            if (image.imageUrl.startsWith('/src')) {
              localUrl = image.imageUrl;
            } else if (image.imageUrl.startsWith('/uploads')) {
              localUrl = `http://localhost:5000${image.imageUrl}`;
            } else if (image.imageUrl.startsWith('img:')) {
              localUrl = getImageSource(image.imageUrl);
            }
          }

          // Check if this item already exists in the map
          if (uniqueImagesMap.has(imageId)) {
            console.log(`Item with ID ${imageId} already exists, skipping duplicate`);
            return; // Skip duplicates
          }

          // Add to map with ID as key to ensure uniqueness
          uniqueImagesMap.set(imageId, {
            ...image,
            _id: imageId,
            localUrl
          });
        });

        // Update the gallery context with unique items
        const uniqueGalleryItems = Array.from(uniqueImagesMap.values());
        setGallery(uniqueGalleryItems);

        // Convert map to array for state
        setImages(uniqueGalleryItems);

        console.log("Processed gallery images:", uniqueGalleryItems.length);
      } catch (error) {
        console.error("Error fetching gallery data:", error);

        // If we have items from context, use those
        if (uniqueImagesMap.size > 0) {
          const uniqueGalleryItems = Array.from(uniqueImagesMap.values());
          setImages(uniqueGalleryItems);
        } else {
          setError('Failed to fetch gallery images');
        }
      }
    } catch (err) {
      setError('Failed to fetch gallery images');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select an image to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Generate a truly unique ID with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const uniqueId = `gallery-${timestamp}-${randomString}`;

      console.log("Generated unique ID for new gallery item:", uniqueId);

      // Create a new image object with the preview URL
      const newImageData = {
        _id: uniqueId,
        title,
        description,
        imageUrl: preview, // Use the preview data URL
        src: preview,
        alt: title || "Gallery image",
        timestamp: timestamp
      };

      let newImage;

      // First add to context to ensure it's saved in localStorage
      try {
        await addGalleryItem({...newImageData});
        console.log("Successfully added to context");
      } catch (contextError) {
        console.error("Error adding to context:", contextError);
        setError('Failed to save image to local storage');
        setUploading(false);
        return;
      }

      // Then try API or mock API
      if (window.location.hostname === 'localhost' && apiAvailable) {
        // Development mode and API is available - try to use real API
        try {
          console.log("Attempting to upload to API...");
          const formData = new FormData();
          formData.append('_id', uniqueId); // Include the ID to ensure consistency
          formData.append('title', title);
          formData.append('description', description);
          formData.append('image', file);

          const res = await axios.post('http://localhost:5000/api/gallery', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 2000 // Set a timeout to avoid long waits
          });

          console.log("Successfully added to API:", res.data);

          newImage = {
            ...res.data,
            _id: uniqueId, // Ensure we use our generated ID
            localUrl: preview // Use the preview as the local URL
          };
        } catch (apiError) {
          console.log("API call failed, using mock data:", apiError);

          // If connection refused, mark API as unavailable to prevent future attempts
          if (apiError.code === 'ERR_NETWORK' || apiError.code === 'ECONNABORTED') {
            console.log("API server is not available, will use mock data for future requests");
            setApiAvailable(false);
          }

          // Fall back to mock API
          try {
            const mockResult = await mockApi.addGalleryItem({...newImageData, _id: uniqueId});
            console.log("Successfully added to mock API:", mockResult);

            newImage = {
              ...mockResult,
              _id: uniqueId, // Ensure we use our generated ID
              localUrl: preview
            };
          } catch (mockError) {
            console.error("Mock API error:", mockError);
            // Already added to context, so we can continue
            newImage = {
              ...newImageData,
              localUrl: preview
            };
          }
        }
      } else {
        // Production mode or API not available - use mock API
        if (!apiAvailable) {
          console.log("Using mock API (API server marked as unavailable)");
        } else {
          console.log("Using mock API (production mode)");
        }

        try {
          const mockResult = await mockApi.addGalleryItem({...newImageData, _id: uniqueId});
          console.log("Successfully added to mock API:", mockResult);

          newImage = {
            ...mockResult,
            _id: uniqueId, // Ensure we use our generated ID
            localUrl: preview
          };
        } catch (mockError) {
          console.error("Mock API error:", mockError);
          // Already added to context, so we can continue
          newImage = {
            ...newImageData,
            localUrl: preview
          };
        }
      }

      // Add the new image to the state
      setImages(prevImages => {
        // Check if the image already exists in the state
        const exists = prevImages.some(img => img._id === uniqueId);

        if (exists) {
          // Update the existing image
          return prevImages.map(img =>
            img._id === uniqueId ? newImage : img
          );
        } else {
          // Add the new image to the beginning of the array
          return [newImage, ...prevImages];
        }
      });

      setSuccess('Image uploaded successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      setPreview('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Deleting gallery item with ID:", id);

      // First delete from context to ensure it's removed from localStorage
      try {
        await deleteGalleryItem(id);
        console.log("Successfully deleted from context");
      } catch (contextError) {
        console.error("Error deleting from context:", contextError);
        setError('Failed to delete image from local storage');
        return;
      }

      // Then try API or mock API
      if (window.location.hostname === 'localhost' && apiAvailable) {
        // Development mode and API is available - try to use real API
        try {
          console.log("Attempting to delete from API...");
          await axios.delete(`http://localhost:5000/api/gallery/${id}`, {
            timeout: 2000 // Set a timeout to avoid long waits
          });
          console.log("Successfully deleted from API");
        } catch (apiError) {
          console.log("API call failed, using mock data:", apiError);

          // If connection refused, mark API as unavailable to prevent future attempts
          if (apiError.code === 'ERR_NETWORK' || apiError.code === 'ECONNABORTED') {
            console.log("API server is not available, will use mock data for future requests");
            setApiAvailable(false);
          }

          // Fall back to mock API
          try {
            await mockApi.deleteGalleryItem(id);
            console.log("Successfully deleted from mock API");
          } catch (mockError) {
            console.error("Mock API error:", mockError);
            // Already deleted from context, so we can continue
          }
        }
      } else {
        // Production mode or API not available - use mock API
        if (!apiAvailable) {
          console.log("Using mock API (API server marked as unavailable)");
        } else {
          console.log("Using mock API (production mode)");
        }

        try {
          await mockApi.deleteGalleryItem(id);
          console.log("Successfully deleted from mock API");
        } catch (mockError) {
          console.error("Mock API error:", mockError);
          // Already deleted from context, so we can continue
        }
      }

      // Remove the image from the state
      setImages(images.filter(image => image._id !== id));
      setSuccess('Image deleted successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to delete image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (image) => {
    setEditingImage(image);
    setEditTitle(image.title);
    setEditDescription(image.description || '');
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingImage(null);
    setEditTitle('');
    setEditDescription('');
  };

  // Function to reset gallery data and fix duplicate keys
  const handleResetGallery = async () => {
    if (!window.confirm('Are you sure you want to reset the gallery? This will clear all gallery data and fix any duplicate key issues.')) {
      return;
    }

    try {
      setResetting(true);
      setError(null);

      console.log("Resetting gallery data...");

      // Clear localStorage gallery data
      localStorage.removeItem('gallery');
      localStorage.removeItem('gallery-last-updated');

      // Clear any image storage keys
      const imageKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('gallery-img-') || key.startsWith('gallery-meta-'))) {
          imageKeys.push(key);
        }
      }

      // Remove all gallery-related items
      imageKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`Cleared ${imageKeys.length} gallery-related items from localStorage`);

      // Reset the gallery context
      setGallery([]);

      // Reset the local state
      setImages([]);

      // Refresh gallery data from storage
      refreshGalleryFromStorage();

      setSuccess('Gallery data has been reset successfully. The page will reload in 2 seconds.');

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error resetting gallery:", error);
      setError('Failed to reset gallery data');
    } finally {
      setResetting(false);
    }
  };

  const handleUpdateImage = async (e) => {
    e.preventDefault();

    if (!editingImage) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Updating gallery item with ID:", editingImage._id);

      const updatedImage = {
        ...editingImage,
        title: editTitle,
        description: editDescription,
        lastUpdated: Date.now()
      };

      // First update in context to ensure it's updated in localStorage
      try {
        await updateGalleryItem(updatedImage);
        console.log("Successfully updated in context");
      } catch (contextError) {
        console.error("Error updating in context:", contextError);
        setError('Failed to update image in local storage');
        setLoading(false);
        return;
      }

      // Then try API or mock API
      if (window.location.hostname === 'localhost' && apiAvailable) {
        // Development mode and API is available - try to use real API
        try {
          console.log("Attempting to update in API...");
          await axios.put(`http://localhost:5000/api/gallery/${editingImage._id}`, {
            title: editTitle,
            description: editDescription
          }, {
            timeout: 2000 // Set a timeout to avoid long waits
          });
          console.log("Successfully updated in API");
        } catch (apiError) {
          console.log("API call failed, using mock data:", apiError);

          // If connection refused, mark API as unavailable to prevent future attempts
          if (apiError.code === 'ERR_NETWORK' || apiError.code === 'ECONNABORTED') {
            console.log("API server is not available, will use mock data for future requests");
            setApiAvailable(false);
          }

          // Fall back to mock API
          try {
            await mockApi.updateGalleryItem(editingImage._id, {
              title: editTitle,
              description: editDescription
            });
            console.log("Successfully updated in mock API");
          } catch (mockError) {
            console.error("Mock API error:", mockError);
            // Already updated in context, so we can continue
          }
        }
      } else {
        // Production mode or API not available - use mock API
        if (!apiAvailable) {
          console.log("Using mock API (API server marked as unavailable)");
        } else {
          console.log("Using mock API (production mode)");
        }

        try {
          await mockApi.updateGalleryItem(editingImage._id, {
            title: editTitle,
            description: editDescription
          });
          console.log("Successfully updated in mock API");
        } catch (mockError) {
          console.error("Mock API error:", mockError);
          // Already updated in context, so we can continue
        }
      }

      // Update the image in the state
      setImages(images.map(img =>
        img._id === editingImage._id ? {
          ...img,
          title: editTitle,
          description: editDescription,
          lastUpdated: Date.now()
        } : img
      ));

      setSuccess('Image updated successfully!');
      handleCancelEdit();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to update image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          Gallery Management
        </h1>

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Upload New Image
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Image
              </label>
              <div className="mt-1 flex items-center">
                <label className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus-within:outline-none">
                  <span className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md">
                    <FaUpload className="mr-2" />
                    Select Image
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-3 text-sm text-gray-500 dark:text-gray-400">
                  {file ? file.name : 'No file selected'}
                </p>
              </div>
            </div>

            {preview && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Preview:</p>
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 h-40 w-auto object-cover rounded-md"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Upload Image'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Gallery Images */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Gallery Images
            </h2>
            <button
              onClick={handleResetGallery}
              disabled={resetting}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <FaSync className={`mr-2 ${resetting ? 'animate-spin' : ''}`} />
              {resetting ? 'Resetting...' : 'Reset Gallery'}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((image) => (
                <div key={image._id} className="relative group">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={image.localUrl || '/src/assets/logo.png'}
                      alt={image.title}
                      className="h-48 w-full object-cover object-center"
                    />
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{image.title}</h3>
                    {image.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{image.description}</p>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(image)}
                      className="p-2 bg-blue-500 text-white rounded-full"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(image._id)}
                      className="p-2 bg-red-500 text-white rounded-full"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              <FaImage className="text-4xl mb-2" />
              <p>No gallery images found. Upload your first image!</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editMode && editingImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Edit Gallery Image
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <form onSubmit={handleUpdateImage} className="space-y-4">
                <div>
                  <label htmlFor="editTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    id="editTitle"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (optional)
                  </label>
                  <textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  ></textarea>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Image:</p>
                  <img
                    src={editingImage.localUrl || '/src/assets/logo.png'}
                    alt={editingImage.title}
                    className="mt-2 h-40 w-auto object-cover rounded-md"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update Image'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GalleryAdmin;