import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaTrash, FaImage, FaEdit, FaTimes } from 'react-icons/fa';
import AdminLayout from './AdminLayout';
import { mockApi } from '../../utils/mockApi';

const GalleryAdmin = () => {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);

      try {
        // Try to fetch from API in development, use mock API in production
        let galleryData;

        if (window.location.hostname === 'localhost') {
          // Development mode - try to use real API
          const res = await axios.get('http://localhost:5000/api/gallery');
          console.log("Gallery data received from API:", res.data);
          galleryData = res.data;
        } else {
          // Production mode - use mock API
          galleryData = await mockApi.getGallery();
          console.log("Gallery data received from mock API:", galleryData);
        }

        // Add local URLs for preview
        const imagesWithLocalUrls = galleryData.map(image => ({
          ...image,
          localUrl: image.imageUrl.startsWith('/src')
            ? image.imageUrl
            : '/src/assets/logo.png' // Use the image URL or a default image
        }));

        setImages(imagesWithLocalUrls);
      } catch (apiError) {
        console.error("API error:", apiError);
        // Use mock data as fallback
        const mockImages = await mockApi.getGallery();
        setImages(mockImages.map(image => ({
          ...image,
          localUrl: '/src/assets/logo.png'
        })));
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

      // Create a new image object
      const newImageData = {
        title,
        description,
        imageUrl: '/src/assets/logo.png', // Default image path
      };

      let newImage;

      if (window.location.hostname === 'localhost') {
        // Development mode - try to use real API
        try {
          const formData = new FormData();
          formData.append('title', title);
          formData.append('description', description);
          formData.append('image', file);

          const res = await axios.post('http://localhost:5000/api/gallery', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          newImage = {
            ...res.data,
            localUrl: preview // Use the preview as the local URL
          };
        } catch (apiError) {
          console.log("API call failed, using mock data:", apiError);
          // Fall back to mock API
          newImage = await mockApi.addGalleryItem(newImageData);
          newImage.localUrl = preview;
        }
      } else {
        // Production mode - use mock API
        newImage = await mockApi.addGalleryItem(newImageData);
        newImage.localUrl = preview;
      }

      // Add the new image to the state
      setImages(prevImages => [newImage, ...prevImages]);

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

      if (window.location.hostname === 'localhost') {
        // Development mode - try to use real API
        try {
          await axios.delete(`http://localhost:5000/api/gallery/${id}`);
        } catch (apiError) {
          console.log("API call failed, using mock data:", apiError);
          // Fall back to mock API
          await mockApi.deleteGalleryItem(id);
        }
      } else {
        // Production mode - use mock API
        await mockApi.deleteGalleryItem(id);
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

  const handleUpdateImage = async (e) => {
    e.preventDefault();

    if (!editingImage) return;

    try {
      setLoading(true);
      setError(null);

      const updatedData = {
        title: editTitle,
        description: editDescription
      };

      if (window.location.hostname === 'localhost') {
        // Development mode - try to use real API
        try {
          await axios.put(`http://localhost:5000/api/gallery/${editingImage._id}`, updatedData);
        } catch (apiError) {
          console.log("API call failed, using mock data:", apiError);
          // Fall back to mock API
          await mockApi.updateGalleryItem(editingImage._id, updatedData);
        }
      } else {
        // Production mode - use mock API
        await mockApi.updateGalleryItem(editingImage._id, updatedData);
      }

      // Update the image in the state
      setImages(images.map(img =>
        img._id === editingImage._id ? {
          ...img,
          title: editTitle,
          description: editDescription
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
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Gallery Images
          </h2>

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