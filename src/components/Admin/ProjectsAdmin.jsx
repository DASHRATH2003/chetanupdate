import React, { useState, useEffect, useContext } from 'react';
import { FaUpload, FaTrash, FaEdit, FaTimes, FaProjectDiagram, FaFilter } from 'react-icons/fa';
import ProjectContext from '../../context/ProjectContext';
import AdminLayout from './AdminLayout';

const ProjectsAdmin = () => {
  const { projects, setProjects, addProject, updateProject, deleteProject } = useContext(ProjectContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [section, setSection] = useState('Banner');
  const [completed, setCompleted] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editCompleted, setEditCompleted] = useState(false);
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState('');

  useEffect(() => {
    // Projects are already loaded from the ProjectContext
    setLoading(false);
  }, []);

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

  const handleEditFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setEditFile(selectedFile);

    // Create preview
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
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

      // Create a new project with default description if not provided
      const newProject = {
        _id: Date.now().toString(), // Generate a unique ID
        title,
        description: description || `${title} - ${category} project by Chethan Jodidhar`, // Use default description if not provided
        imageUrl: preview, // Use the preview as the image URL
        category,
        section,
        completed,
        year: new Date().getFullYear().toString(),
        createdAt: new Date().toISOString()
      };

      // Add the new project using the context function
      console.log("Adding new project:", newProject);
      addProject(newProject);

      setSuccess('Project added successfully!');
      setTitle('');
      setDescription('');
      setCategory('');
      setCompleted(false);
      setFile(null);
      setPreview('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);

    } catch (err) {
      setError('Failed to add project');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      setLoading(true);

      // Delete the project using the context function
      deleteProject(id);
      setSuccess('Project deleted successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to delete project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setEditTitle(project.title);
    setEditDescription(project.description || '');
    setEditCategory(project.category || '');
    setEditSection(project.section || 'Banner');
    setEditCompleted(project.completed || false);
    setEditPreview(project.imageUrl);
    setEditFile(null);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingProject(null);
    setEditTitle('');
    setEditDescription('');
    setEditCategory('');
    setEditSection('Banner');
    setEditCompleted(false);
    setEditFile(null);
    setEditPreview('');
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();

    if (!editingProject) return;

    try {
      setLoading(true);
      setError(null);

      // Create an updated project object - maintain existing description
      const updatedProject = {
        ...editingProject,
        title: editTitle,
        description: editingProject.description || `${editTitle} - ${editCategory} project by Chethan Jodidhar`, // Maintain existing description
        category: editCategory,
        section: editingProject.section || 'Banner', // Maintain existing section
        completed: editingProject.completed || false, // Maintain existing completed status
        imageUrl: editFile ? editPreview : editingProject.imageUrl,
        year: editingProject.year || new Date().getFullYear().toString()
      };

      // Update the project using the context function
      updateProject(updatedProject);

      setSuccess('Project updated successfully!');
      handleCancelEdit();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to update project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on section
  const filteredProjects = filter === 'all'
    ? projects
    : projects.filter(project => project.section === filter);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          Projects Management
        </h1>

        {/* Upload Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Add New Project
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Film, Commercial, etc."
                />
              </div>
            </div>

            {/* Hidden fields with default values */}
            <input type="hidden" id="section" value={section} />
            <input type="hidden" id="completed" checked={completed} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Image
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
                    Adding Project...
                  </>
                ) : (
                  'Add Project'
                )}
              </button>
              <a
                href="/chethan-jodidhar/projects"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                View Projects Page
              </a>
            </div>
          </form>
        </div>

        {/* Projects List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Projects
            </h2>

            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-500 dark:text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Sections</option>
                <option value="Home">Home Page</option>
                <option value="Banner">Banner Section</option>
                <option value="Section2">Section 2</option>
                <option value="Section3">Section 3</option>
                <option value="Cameo">Cameo Section</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <div key={project._id} className="relative group">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="h-48 w-full object-cover object-center"
                    />
                    {project.completed && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs">
                        Completed
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{project.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{project.category}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Section: {project.section}</p>
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-2 bg-blue-500 text-white rounded-full"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
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
              <FaProjectDiagram className="text-4xl mb-2" />
              <p>No projects found. Add your first project!</p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editMode && editingProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Edit Project
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

              <form onSubmit={handleUpdateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label htmlFor="editCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <input
                      type="text"
                      id="editCategory"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                {/* Hidden fields to maintain existing values */}
                <input type="hidden" id="editDescription" value={editDescription} />
                <input type="hidden" id="editSection" value={editSection} />
                <input type="hidden" id="editCompleted" checked={editCompleted} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project Image
                  </label>
                  <div className="mt-1 flex items-center">
                    <label className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus-within:outline-none">
                      <span className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md">
                        <FaUpload className="mr-2" />
                        Change Image
                      </span>
                      <input
                        id="edit-file-upload"
                        name="edit-file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleEditFileChange}
                      />
                    </label>
                    <p className="pl-3 text-sm text-gray-500 dark:text-gray-400">
                      {editFile ? editFile.name : 'Keep current image'}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current Image:</p>
                  <img
                    src={editPreview}
                    alt="Current"
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
                      'Update Project'
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

export default ProjectsAdmin;


