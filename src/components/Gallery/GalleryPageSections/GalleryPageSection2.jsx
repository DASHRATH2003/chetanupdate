import React, { useCallback, useState, useEffect, useContext } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
// Fallback images in case API fails
import img1 from "../../../assets/GalleryImages/1.webp";
import img2 from "../../../assets/GalleryImages/2.webp";
import img3 from "../../../assets/GalleryImages/3.webp";
import img4 from "../../../assets/GalleryImages/4.webp";
import { mockApi } from "../../../utils/mockApi";
import GalleryContext from "../../../context/GalleryContext";
import imageStorage from '../../../utils/simpleImageStorage';

// Helper function to get image source from storage or use fallback
const getImageSource = (imageUrl) => {
  console.log("Getting image source for:", imageUrl);

  if (!imageUrl) {
    console.log("No image URL provided, returning null");
    return null;
  }

  // If it's a direct URL or path, return it
  if (!imageUrl.startsWith('img:')) {
    console.log("Image URL is a direct path, returning as is");
    return imageUrl;
  }

  // Try to get the data URL from our image storage utility
  try {
    const key = imageUrl.substring(4); // Remove the 'img:' prefix
    console.log("Looking for image with key:", key);

    const imageResult = imageStorage.getImage(key);
    console.log("Image found:", !!imageResult);

    if (imageResult && imageResult.data) {
      console.log("Image data retrieved successfully");
      return imageResult.data;
    } else {
      console.log("Image not found in storage");
    }
  } catch (error) {
    console.error("Error retrieving image:", error);
  }

  console.log("Using fallback image");
  // Fallback to a default image if we couldn't get the stored image
  return img1;
};

const GalleryPageSection2 = () => {
  // Use the GalleryContext
  const {
    gallery: contextGallery,
    loading: contextLoading,
    lastUpdate: contextLastUpdate,
    refreshGalleryFromStorage
  } = useContext(GalleryContext);

  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(false); // Default to false to avoid unnecessary API calls

  // Fallback gallery data
  const fallbackGallery = [
    { src: img1, alt: "Gallery image 1" },
    { src: img2, alt: "Gallery image 2" },
    { src: img3, alt: "Gallery image 3" },
    { src: img4, alt: "Gallery image 4" }
  ];

  // Function to process gallery items from context
  const processGalleryItems = useCallback(() => {
    if (!contextGallery || contextGallery.length === 0) {
      console.log("No gallery data in context");
      return null;
    }

    console.log("Processing gallery data from context, items:", contextGallery.length);

    // Create a map to track unique IDs
    const uniqueItemsMap = new Map();

    // Process each gallery item
    contextGallery.forEach((item, index) => {
      if (!item || !item._id) {
        console.warn(`Invalid gallery item at index ${index}:`, item);
        return; // Skip invalid items
      }

      // Get the image source
      const imageSrc = getImageSource(item.imageUrl || item.src);

      // Add to map with ID as key to ensure uniqueness
      uniqueItemsMap.set(item._id, {
        src: imageSrc || img1, // Use fallback if no image source
        alt: item.title || item.alt || "Gallery image",
        title: item.title,
        description: item.description,
        _id: item._id // Keep the ID for reference
      });
    });

    // Convert map to array
    return Array.from(uniqueItemsMap.values());
  }, [contextGallery]);

  // Effect to update gallery when context changes
  useEffect(() => {
    const updateGallery = async () => {
      try {
        setLoading(true);
        console.log("Updating gallery from context...");

        // Process gallery items
        const formattedGallery = processGalleryItems();

        if (formattedGallery && formattedGallery.length > 0) {
          console.log(`Processed ${formattedGallery.length} unique gallery items from context`);
          setGallery(formattedGallery);
        } else {
          console.warn("No valid gallery items found in context");
          // Try to refresh from storage
          refreshGalleryFromStorage();
        }
      } catch (error) {
        console.error("Error updating gallery:", error);
        setError("Failed to update gallery");
      } finally {
        setLoading(false);
      }
    };

    updateGallery();
  }, [contextGallery, contextLastUpdate, processGalleryItems, refreshGalleryFromStorage]);

  // Check API availability on mount
  useEffect(() => {
    const checkApiAvailability = async () => {
      if (window.location.hostname === 'localhost') {
        try {
          console.log("Gallery frontend checking API availability...");
          const response = await axios.get('http://localhost:5000/api/health', {
            timeout: 1000 // Short timeout for quick check
          });
          console.log("API is available:", response.status === 200);
          setApiAvailable(response.status === 200);
        } catch (error) {
          console.log("API is not available:", error.message);
          setApiAvailable(false);
        }
      } else {
        // In production, don't try to use the API
        setApiAvailable(false);
      }
    };

    checkApiAvailability();
  }, []);

  // Initial load effect
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setLoading(true);
        console.log("Loading gallery images...");

        // First try to use gallery from context
        const formattedGallery = processGalleryItems();

        if (formattedGallery && formattedGallery.length > 0) {
          setGallery(formattedGallery);
          setLoading(false);
          return;
        } else {
          console.log("No gallery data in context or empty gallery");
        }

        // If no context data, try API or mock API
        try {
          let galleryData;

          if (window.location.hostname === 'localhost' && apiAvailable) {
            // Development mode and API is available - try to use real API
            console.log("Attempting to fetch gallery from API...");
            try {
              const res = await axios.get('http://localhost:5000/api/gallery', {
                timeout: 2000 // Set a timeout to avoid long waits
              });
              console.log("Gallery data received from API:", res.data);
              galleryData = res.data;
            } catch (apiError) {
              console.log("API call failed, using mock data:", apiError);
              // Fall back to mock API
              galleryData = await mockApi.getGallery();
              console.log("Gallery data received from mock API (after API failure):", galleryData);
            }
          } else {
            // Production mode or API not available - use mock API
            console.log("Using mock API for gallery data");
            galleryData = await mockApi.getGallery();
            console.log("Gallery data received from mock API:", galleryData);
          }

          if (galleryData && galleryData.length > 0) {
            // Format the data for our gallery
            const formattedGallery = galleryData.map((item) => ({
              // Use the actual image URL from the gallery data
              src: item.imageUrl.startsWith('http')
                ? item.imageUrl
                : window.location.hostname === 'localhost'
                  ? `http://localhost:5000${item.imageUrl}`
                  : item.imageUrl,
              alt: item.title || "Gallery image",
              title: item.title,
              description: item.description
            }));
            setGallery(formattedGallery);
            console.log("Gallery images loaded successfully");
          } else {
            throw new Error("No gallery images returned");
          }
        } catch (apiError) {
          console.error("Error fetching gallery data, using fallback data:", apiError);
          // Use fallback data on error
          setGallery(fallbackGallery);
          console.log("Using fallback gallery images");
        }
      } catch (err) {
        console.error("Error in gallery loading:", err);
        setError("Failed to load gallery images");
        // Use fallback data on error
        setGallery(fallbackGallery);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryImages();
  }, [processGalleryItems, apiAvailable]); // Run when processGalleryItems or apiAvailable changes
  const [currentIndex, setCurrentIndex] = useState(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleImageClick = (index) => setCurrentIndex(index);

  const handleCloseModal = () => setCurrentIndex(null);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  }, [gallery.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  }, [gallery.length]);

  const handleTouchStart = (e) => {
    // Store the touch position, not the event
    if (e && e.targetTouches && e.targetTouches[0]) {
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const handleTouchMove = (e) => {
    // Store the touch position, not the event
    if (e && e.targetTouches && e.targetTouches[0]) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const handleTouchEnd = (e) => {
    // Prevent passing the event object
    e && e.preventDefault && e.preventDefault();

    // Use the stored positions for calculations
    const swipeDistance = touchStart - touchEnd;

    if (swipeDistance > 150) {
      handleNext();
    } else if (swipeDistance < -150) {
      handlePrev();
    }

    // Reset touch positions
    setTouchStart(0);
    setTouchEnd(0);
  };



  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentIndex === null) return;
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") handleCloseModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, handleNext, handlePrev]);

  return (
    <section className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gallery.map((image, index) => (
            <div
              key={index}
              className="relative group overflow-hidden rounded-lg cursor-pointer aspect-square"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onClick={() => handleImageClick(index)}
              />
              {image.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <h3 className="text-sm font-medium">{image.title}</h3>
                  {image.description && <p className="text-xs mt-1">{image.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {currentIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <div
              className="w-full h-full flex items-center justify-center touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={gallery[currentIndex].src}
                alt={gallery[currentIndex].alt}
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              <h3 className="text-lg font-medium">{gallery[currentIndex].title}</h3>
              {gallery[currentIndex].description && (
                <p className="text-sm mt-1 max-w-md mx-auto">{gallery[currentIndex].description}</p>
              )}
            </div>
            <button
              className="absolute top-4 right-4 text-white bg-gray-700 bg-opacity-50 hover:bg-opacity-75 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
              onClick={handleCloseModal}
            >
              <X size={24} />
            </button>
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-gray-700 bg-opacity-50 hover:bg-opacity-75 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
              onClick={handlePrev}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-gray-700 bg-opacity-50 hover:bg-opacity-75 rounded-full w-10 h-10 flex items-center justify-center transition-colors duration-200"
              onClick={handleNext}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default GalleryPageSection2;
