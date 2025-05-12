import React, { useCallback, useState, useEffect } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
// Fallback images in case API fails
import img1 from "../../../assets/GalleryImages/1.webp";
import img2 from "../../../assets/GalleryImages/2.webp";
import img3 from "../../../assets/GalleryImages/3.webp";
import img4 from "../../../assets/GalleryImages/4.webp";

const GalleryPageSection2 = () => {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback gallery data
  const fallbackGallery = [
    { src: img1, alt: "Gallery image 1" },
    { src: img2, alt: "Gallery image 2" },
    { src: img3, alt: "Gallery image 3" },
    { src: img4, alt: "Gallery image 4" }
  ];

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);

        try {
          // Try to fetch from API
          const res = await axios.get('http://localhost:5000/api/gallery');

          if (res.data && res.data.length > 0) {
            // Format the data for our gallery
            // Since we're using mock data, we'll use the fallback images instead of the API paths
            const formattedGallery = res.data.map((item, index) => ({
              src: fallbackGallery[index % fallbackGallery.length].src, // Use fallback images in a loop
              alt: item.title || "Gallery image",
              title: item.title,
              description: item.description
            }));
            setGallery(formattedGallery);
            console.log("Gallery images loaded from API with fallback images");
          } else {
            throw new Error("No gallery images returned from API");
          }
        } catch (apiError) {
          console.error("Error fetching from API, using fallback data:", apiError);
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

    fetchGalleryImages();
  }, []);
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
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      handleNext();
    }

    if (touchStart - touchEnd < -150) {
      handlePrev();
    }
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
            <img
              src={gallery[currentIndex].src}
              alt={gallery[currentIndex].alt}
              className="max-w-full max-h-full object-contain"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
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
