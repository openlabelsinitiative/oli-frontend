'use client';

import React, { useState, useEffect } from 'react';
// Removed unused Search import
import { Combobox } from '@headlessui/react';
import Image from 'next/image';
import Link from 'next/link';
import { useDropdownContext } from '@/contexts/DropdownContext';

// Define a type for the raw project item from the API
type RawProjectItem = [
  string, // owner_project
  string, // display_name
  string | null, // description
  string | null, // main_github
  string | null, // twitter
  string | null, // website
  string | null, // logo_path
  string | null, // sub_category
  string | null  // main_category
];

type Project = {
  owner_project: string;
  display_name: string;
  description: string | null;
  main_github: string | null;
  twitter: string | null;
  website: string | null;
  logo_path: string | null;
  sub_category: string | null;
  main_category: string | null;
};

const OwnerProjectSelect = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => {
  const dropdownContext = useDropdownContext();
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (query.length < 3) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Add cache-busting parameters to ensure fresh data on every request
        const timestamp = Date.now();
        const response = await fetch(`https://api.growthepie.com/v1/labels/projects.json?t=${timestamp}`, {
          cache: 'no-store', // Prevent browser caching
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        const rawData = await response.json();
        
        // Transform the data structure with proper typing
        const transformedProjects = rawData.data.data.map((item: RawProjectItem) => ({
          owner_project: item[0],
          display_name: item[1],
          description: item[2],
          main_github: item[3],
          twitter: item[4],
          website: item[5],
          logo_path: item[6],
          sub_category: item[7],
          main_category: item[8]
        }));

        // Filter based on search term - ensure owner_project exists (required for key/value)
        const filteredProjects = transformedProjects.filter((project:Project) => {
          // Skip projects without owner_project (required field)
          if (!project.owner_project) return false;
          
          // Check if display_name or owner_project matches the query
          return (
            (project.display_name && project.display_name.toLowerCase().includes(query.toLowerCase())) ||
            project.owner_project.toLowerCase().includes(query.toLowerCase())
          );
        });

        setProjects(filteredProjects);
      } catch (err) {
        setError('Failed to fetch projects');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchProjects, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Close other dropdowns when this one opens
  useEffect(() => {
    if (isOpen && dropdownContext && query.length > 2) {
      dropdownContext.setOpenDropdownId('owner_project');
    }
  }, [isOpen, query, dropdownContext]);

  // Function to build the logo URL
  const getLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    return `https://api.growthepie.com/v1/apps/logos/${logoPath}`;
  };

  // Project not found component
  const ProjectNotFound = () => (
    <div className="p-6 text-sm bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800 mb-2">
            Couldn&apos;t find your project?
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-1.5 mb-4 text-sm">
            <li>Check if you&apos;ve spelled the project name correctly</li>
            <li>Try searching by the project&apos;s GitHub name</li>
            <li>Search with different keywords related to your project</li>
          </ul>
          <p className="text-gray-700 mb-3 text-sm">
            If you still can&apos;t find your project, you can add it to our directory:
          </p>
          <Link 
            href="/project" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Project
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <Combobox 
      value={value} 
      onChange={(selectedValue: string | null) => {
        if (selectedValue && typeof selectedValue === 'string') {
          onChange(selectedValue);
        }
        setIsOpen(false);
        if (dropdownContext) {
          dropdownContext.setOpenDropdownId(null);
        }
      }}
    >
      <div className="relative" data-combobox="owner_project">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Combobox.Input
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 sm:text-sm text-gray-900 bg-white transition-all duration-200 placeholder:text-gray-400"
            onChange={(event) => {
              setQuery(event.target.value);
              if (event.target.value.length > 2) {
                setIsOpen(true);
              }
            }}
            displayValue={(projectName: string) => projectName}
            placeholder="Search for a project (min. 3 characters)"
            onFocus={() => {
              if (query.length > 2) {
                setIsOpen(true);
              }
            }}
            onBlur={() => {
              // Delay closing to allow option clicks
              setTimeout(() => setIsOpen(false), 200);
            }}
          />
        </div>
        
        {query.length > 2 && isOpen && (
          <Combobox.Options className="absolute z-[9999] mt-2 max-h-96 w-full overflow-auto rounded-xl bg-white py-2 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-100" static>
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <div className="flex items-center space-x-2 text-gray-500">
                  <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Loading projects...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 mx-2 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-red-700">{error}</span>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div className="p-2">
                <ProjectNotFound />
              </div>
            ) : (
              projects.map((project) => (
                <Combobox.Option
                  key={project.owner_project}
                  value={project.owner_project}
                  className={({ active, selected }) =>
                    `relative cursor-pointer select-none py-3 px-4 mx-1 rounded-lg transition-all duration-150 ${
                      active 
                        ? 'bg-indigo-50 border border-indigo-200 shadow-sm' 
                        : selected
                        ? 'bg-indigo-100/50 border border-indigo-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-10 h-10 relative rounded-lg bg-white border border-gray-200 p-1.5 flex items-center justify-center shadow-sm">
                        {project.logo_path ? (
                          <Image
                            src={getLogoUrl(project.logo_path) || ''}
                            alt={`${project.display_name || project.owner_project} logo`}
                            width={32}
                            height={32}
                            className="object-contain rounded"
                          />
                        ) : (
                          <div className="w-full h-full rounded bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-indigo-600">
                              {(project.display_name || project.owner_project || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-semibold text-gray-900 truncate ${selected ? 'text-indigo-700' : ''}`}>
                            {project.display_name || project.owner_project}
                          </span>
                          {selected && (
                            <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {[project.website, project.twitter, project.sub_category].filter(value => value).length > 0 && (
                          <div className="flex items-center flex-wrap gap-2 mt-1.5">
                            {project.website && (
                              <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                {project.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </span>
                            )}
                            {project.sub_category && (
                              <span className="inline-flex items-center text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
                                {project.sub_category}
                              </span>
                            )}
                          </div>
                        )}
                        {project.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                            {project.description.length > 150 
                              ? `${project.description.slice(0, 150)}...`
                              : project.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
};

export default OwnerProjectSelect;