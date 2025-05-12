import React, { createContext, useState, useEffect } from 'react';
import timepass2025 from "../assets/Projects/ChethanJodidharProjects/timepass2025.webp";
import project1 from "../assets/Projects/ChethanJodidharProjects/project1.webp";
import cameo from "../assets/Projects/ChethanJodidharProjects/chethanjodidharprojects.webp";

export const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize with default projects or load from localStorage
  useEffect(() => {
    console.log("ProjectProvider initialized");

    // Try to load projects from localStorage
    const savedProjects = localStorage.getItem('projects');

    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        console.log("Loaded projects from localStorage:", parsedProjects);
        setProjects(parsedProjects);
      } catch (error) {
        console.error("Error parsing projects from localStorage:", error);
        // Fall back to default projects
        initializeDefaultProjects();
      }
    } else {
      // No saved projects, use defaults
      initializeDefaultProjects();
    }

    setLoading(false);
  }, []);

  // Helper function to initialize default projects
  const initializeDefaultProjects = () => {
    const defaultProjects = [
      {
        _id: '1',
        title: 'Timepass',
        description: 'A comedy film directed by Chethan Jodidhar.',
        imageUrl: timepass2025,
        category: 'Film',
        section: 'Banner',
        completed: true,
        year: '2025',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        title: 'Vidhi',
        description: 'A drama film exploring social issues.',
        imageUrl: project1,
        category: 'Film',
        section: 'Banner',
        completed: true,
        year: '2021',
        createdAt: new Date().toISOString()
      },
      {
        _id: '3',
        title: 'Director Cameo',
        description: 'Special appearance in a feature film.',
        imageUrl: cameo,
        category: 'Film',
        section: 'Cameo',
        completed: true,
        year: '2023',
        createdAt: new Date().toISOString()
      }
    ];

    setProjects(defaultProjects);
    console.log("Default projects set:", defaultProjects);

    // Save to localStorage
    localStorage.setItem('projects', JSON.stringify(defaultProjects));
  };

  // Add a new project
  const addProject = (project) => {
    // Use functional update to ensure we're working with the latest state
    setProjects(prevProjects => {
      const newProjects = [project, ...prevProjects];
      // Save to localStorage
      localStorage.setItem('projects', JSON.stringify(newProjects));
      console.log("Project added:", project);
      console.log("Updated projects:", newProjects);
      return newProjects;
    });
  };

  // Update an existing project
  const updateProject = (updatedProject) => {
    // Use functional update to ensure we're working with the latest state
    setProjects(prevProjects => {
      const newProjects = prevProjects.map(project =>
        project._id === updatedProject._id ? updatedProject : project
      );
      // Save to localStorage
      localStorage.setItem('projects', JSON.stringify(newProjects));
      console.log("Project updated:", updatedProject);
      return newProjects;
    });
  };

  // Delete a project
  const deleteProject = (id) => {
    // Use functional update to ensure we're working with the latest state
    setProjects(prevProjects => {
      const newProjects = prevProjects.filter(project => project._id !== id);
      // Save to localStorage
      localStorage.setItem('projects', JSON.stringify(newProjects));
      console.log("Project deleted:", id);
      return newProjects;
    });
  };

  // Get projects by section
  const getProjectsBySection = (section) => {
    return projects.filter(project => project.section === section);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loading,
        error,
        addProject,
        updateProject,
        deleteProject,
        getProjectsBySection,
        setProjects
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
