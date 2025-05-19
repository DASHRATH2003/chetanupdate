// Mock API functions for use in production when no backend is available

// Helper function to get gallery data from localStorage or use defaults
const getGalleryData = () => {
  try {
    const storedGallery = localStorage.getItem('gallery');
    if (storedGallery) {
      return JSON.parse(storedGallery);
    }
  } catch (error) {
    console.error('Error getting gallery data from localStorage:', error);
  }

  // Default gallery data if nothing in localStorage
  return [
    {
      _id: '1',
      title: 'Image 1',
      description: 'Description 1',
      imageUrl: '/src/assets/GalleryImages/1.webp'
    },
    {
      _id: '2',
      title: 'Image 2',
      description: 'Description 2',
      imageUrl: '/src/assets/GalleryImages/2.webp'
    },
    {
      _id: '3',
      title: 'Image 3',
      description: 'Description 3',
      imageUrl: '/src/assets/GalleryImages/3.webp'
    }
  ];
};

// Helper function to save gallery data to localStorage
const saveGalleryData = (data) => {
  try {
    localStorage.setItem('gallery', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving gallery data to localStorage:', error);
    return false;
  }
};

// Mock projects data
const mockProjectsData = [
  {
    _id: '1',
    title: 'Project 1',
    description: 'Description 1',
    imageUrl: '/src/assets/logo.png',
    category: 'Category 1',
    section: 'Banner',
    completed: true,
    year: '2023'
  },
  {
    _id: '2',
    title: 'Project 2',
    description: 'Description 2',
    imageUrl: '/src/assets/logo.png',
    category: 'Category 2',
    section: 'Section2',
    completed: false,
    year: '2024'
  },
  {
    _id: '3',
    title: 'Project 3',
    description: 'Description 3',
    imageUrl: '/src/assets/logo.png',
    category: 'Category 3',
    section: 'Cameo',
    completed: true,
    year: '2022'
  }
];

// Mock contacts data
const mockContactsData = [
  {
    _id: '1',
    name: 'Contact 1',
    email: 'contact1@example.com',
    message: 'Message 1',
    isRead: true
  },
  {
    _id: '2',
    name: 'Contact 2',
    email: 'contact2@example.com',
    message: 'Message 2',
    isRead: false
  },
  {
    _id: '3',
    name: 'Contact 3',
    email: 'contact3@example.com',
    message: 'Message 3',
    isRead: false
  }
];

// Mock API functions
export const mockApi = {
  // Gallery API
  getGallery: () => {
    const galleryData = getGalleryData();
    console.log('Mock API - getGallery:', galleryData);
    return Promise.resolve(galleryData);
  },
  addGalleryItem: (item) => {
    const galleryData = getGalleryData();

    // Use the provided ID or generate a new one
    const newItem = {
      _id: item._id || `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...item,
      // Use the provided imageUrl or fallback to a default
      imageUrl: item.imageUrl || '/src/assets/GalleryImages/1.webp',
      timestamp: Date.now()
    };

    console.log('Mock API - addGalleryItem:', newItem);

    // Add to the beginning of the array
    galleryData.unshift(newItem);

    // Save to localStorage
    saveGalleryData(galleryData);

    return Promise.resolve(newItem);
  },
  updateGalleryItem: (id, item) => {
    console.log('Mock API - updateGalleryItem:', id, item);

    const galleryData = getGalleryData();
    const index = galleryData.findIndex(i => i._id === id);

    if (index !== -1) {
      // Update the item
      galleryData[index] = {
        ...galleryData[index],
        ...item,
        lastUpdated: Date.now()
      };

      // Save to localStorage
      saveGalleryData(galleryData);

      return Promise.resolve(galleryData[index]);
    }

    console.error('Gallery item not found for update:', id);
    return Promise.reject(new Error('Gallery item not found'));
  },
  deleteGalleryItem: (id) => {
    console.log('Mock API - deleteGalleryItem:', id);

    const galleryData = getGalleryData();
    const index = galleryData.findIndex(i => i._id === id);

    if (index !== -1) {
      // Remove the item
      galleryData.splice(index, 1);

      // Save to localStorage
      saveGalleryData(galleryData);

      return Promise.resolve({ success: true });
    }

    console.error('Gallery item not found for deletion:', id);
    return Promise.reject(new Error('Gallery item not found'));
  },

  // Projects API
  getProjects: () => {
    return Promise.resolve(mockProjectsData);
  },
  addProject: (project) => {
    const newProject = {
      _id: Date.now().toString(),
      ...project,
      imageUrl: '/src/assets/logo.png'
    };
    mockProjectsData.unshift(newProject);
    return Promise.resolve(newProject);
  },
  updateProject: (id, project) => {
    const index = mockProjectsData.findIndex(p => p._id === id);
    if (index !== -1) {
      mockProjectsData[index] = { ...mockProjectsData[index], ...project };
      return Promise.resolve(mockProjectsData[index]);
    }
    return Promise.reject(new Error('Project not found'));
  },
  deleteProject: (id) => {
    const index = mockProjectsData.findIndex(p => p._id === id);
    if (index !== -1) {
      mockProjectsData.splice(index, 1);
      return Promise.resolve({ success: true });
    }
    return Promise.reject(new Error('Project not found'));
  },

  // Contacts API
  getContacts: () => {
    return Promise.resolve(mockContactsData);
  },
  addContact: (contact) => {
    const newContact = {
      _id: Date.now().toString(),
      ...contact,
      isRead: false
    };
    mockContactsData.unshift(newContact);
    return Promise.resolve(newContact);
  },
  updateContact: (id, contact) => {
    const index = mockContactsData.findIndex(c => c._id === id);
    if (index !== -1) {
      mockContactsData[index] = { ...mockContactsData[index], ...contact };
      return Promise.resolve(mockContactsData[index]);
    }
    return Promise.reject(new Error('Contact not found'));
  },
  deleteContact: (id) => {
    const index = mockContactsData.findIndex(c => c._id === id);
    if (index !== -1) {
      mockContactsData.splice(index, 1);
      return Promise.resolve({ success: true });
    }
    return Promise.reject(new Error('Contact not found'));
  }
};

export default mockApi;
