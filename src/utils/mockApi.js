// Mock API functions for use in production when no backend is available

// Mock gallery data
const mockGalleryData = [
  { 
    _id: '1', 
    title: 'Image 1', 
    description: 'Description 1', 
    imageUrl: '/src/assets/logo.png' 
  },
  { 
    _id: '2', 
    title: 'Image 2', 
    description: 'Description 2', 
    imageUrl: '/src/assets/logo.png' 
  },
  { 
    _id: '3', 
    title: 'Image 3', 
    description: 'Description 3', 
    imageUrl: '/src/assets/logo.png' 
  }
];

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
    return Promise.resolve(mockGalleryData);
  },
  addGalleryItem: (item) => {
    const newItem = {
      _id: Date.now().toString(),
      ...item,
      imageUrl: '/src/assets/logo.png'
    };
    mockGalleryData.unshift(newItem);
    return Promise.resolve(newItem);
  },
  updateGalleryItem: (id, item) => {
    const index = mockGalleryData.findIndex(i => i._id === id);
    if (index !== -1) {
      mockGalleryData[index] = { ...mockGalleryData[index], ...item };
      return Promise.resolve(mockGalleryData[index]);
    }
    return Promise.reject(new Error('Gallery item not found'));
  },
  deleteGalleryItem: (id) => {
    const index = mockGalleryData.findIndex(i => i._id === id);
    if (index !== -1) {
      mockGalleryData.splice(index, 1);
      return Promise.resolve({ success: true });
    }
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
