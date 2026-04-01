'use client';
import React, { useState, useEffect } from 'react';
import Notification from '../attestation/Notification';
import BasicInfoSection from './sections/BasicInfoSection';
import SocialSection from './sections/SocialSection';
import DevelopmentSection from './sections/DevelopmentSection';
import AdditionalSection from './sections/AdditionalSection';
import { PROJECT_DESCRIPTIONS } from '@/constants/projectDescriptions';

interface ProjectFormData {
  name: string;
  display_name: string;
  description: string;
  websites: string[];
  social: {
    twitter: { url: string }[];
    telegram: { url: string }[];
    discord: { url: string }[];
  };
  github: string[];
  npm: string[];
  crates: string[];
  pypi: string[];
  go: string[];
  open_collective: string;
  defillama: string[];
  comments: string;
}

const initialFormData: ProjectFormData = {
  name: '',
  display_name: '',
  description: '',
  websites: [''],
  social: {
    twitter: [{ url: '' }],
    telegram: [{ url: '' }],
    discord: [{ url: '' }],
  },
  github: [''],
  npm: [''],
  crates: [''],
  pypi: [''],
  go: [''],
  open_collective: '',
  defillama: [''],
  comments: ''
};

const AddProjectForm = () => {
    const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatedYaml, setGeneratedYaml] = useState<string>('');
    const [isClient, setIsClient] = useState(false);
    const [yamlInput, setYamlInput] = useState<string>('');
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [hasAutoFilled, setHasAutoFilled] = useState<boolean>(false);
    useEffect(() => { setIsClient(true); }, []);

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        if (!formData.name.trim()) {
          newErrors.name = 'Project name is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.name)) {
          newErrors.name = 'Project name must contain only lowercase letters, numbers, and dashes';
        }
        if (!formData.display_name.trim()) {
          newErrors.display_name = 'Display name is required';
        }
        // Validate URLs
        const validateUrls = (urls: string[], prefix: string) => {
          urls.forEach((url, index) => {
            if (url && !isValidUrl(url)) {
              newErrors[`${prefix}_${index}`] = 'Please enter a valid URL';
            }
          });
        };
        validateUrls(formData.websites, 'website');
        validateUrls(formData.github, 'github');
        validateUrls(formData.npm, 'npm');
        validateUrls(formData.crates, 'crates');
        validateUrls(formData.pypi, 'pypi');
        validateUrls(formData.go, 'go');
        validateUrls(formData.defillama, 'defillama');
        if (formData.open_collective && !isValidUrl(formData.open_collective)) {
          newErrors.open_collective = 'Please enter a valid URL';
        }
        ['twitter', 'telegram', 'discord'].forEach(platform => {
            formData.social[platform as keyof typeof formData.social].forEach((social, index) => {
            if (social.url && !isValidUrl(social.url)) {
                newErrors[`${platform}_${index}`] = `Please enter a valid ${platform} URL`;
            }
            });
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const validateYamlDescription = (description: string) => {
      // Check for common YAML issues in descriptions
      const issues = [];
      
      // Check for unescaped colons that might break YAML structure
      if (description.includes(': ') && !description.startsWith('>')) {
        issues.push('Description contains unescaped colons. Consider using the multiline format (description: >)');
      }
      
      // Check for unescaped apostrophes/quotes
      if ((description.includes("'") || description.includes('"')) && !description.startsWith('>')) {
        issues.push('Description contains quotes that may cause YAML parsing issues');
      }
      
      // Check for YAML special characters
      const specialChars = ['[', ']', '{', '}', '|', '>', '@', '`'];
      const foundSpecial = specialChars.filter(char => description.includes(char));
      if (foundSpecial.length > 0 && !description.startsWith('>')) {
        issues.push(`Description contains YAML special characters: ${foundSpecial.join(', ')}`);
      }
      
      return issues;
    };

    const parseYamlAndFillForm = (yamlText: string) => {
      try {
        const lines = yamlText.trim().split('\n');
        const parsed: any = {};
        let currentSection = '';
        let isInArray = false;
        let isInSocial = false;
        let currentSocialPlatform = '';
        let descriptionLines: string[] = [];
        let isInDescription = false;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();
          
          if (!trimmedLine || trimmedLine.startsWith('#')) continue;

          // Handle description with > multiline format
          if (trimmedLine === 'description: >') {
            isInDescription = true;
            continue;
          }

          if (isInDescription) {
            if (line.startsWith('  ') && trimmedLine) {
              descriptionLines.push(trimmedLine);
              continue;
            } else {
              // End of description
              isInDescription = false;
              parsed.description = descriptionLines.join(' ');
              descriptionLines = [];
            }
          }

          // Handle simple key-value pairs
          if (trimmedLine.includes(':') && !line.startsWith('  ') && !line.startsWith('    ') && !trimmedLine.startsWith('- ')) {
            const [key, ...valueParts] = trimmedLine.split(':');
            const value = valueParts.join(':').trim();
            
            if (key === 'websites' || key === 'github' || key === 'npm' || key === 'crates' || key === 'pypi' || key === 'go' || key === 'defillama') {
              currentSection = key;
              isInArray = true;
              isInSocial = false;
              parsed[key] = [];
            } else if (key === 'social') {
              currentSection = 'social';
              isInSocial = true;
              isInArray = false;
              parsed.social = {};
            } else if (value && !['websites', 'social', 'github', 'npm', 'crates', 'pypi', 'go', 'defillama'].includes(key)) {
              parsed[key] = value;
              currentSection = '';
              isInArray = false;
              isInSocial = false;
            }
          }
          // Handle array items
          else if (trimmedLine.startsWith('- url:') && isInArray) {
            const url = trimmedLine.replace('- url:', '').trim();
            if (url && parsed[currentSection]) {
              parsed[currentSection].push(url);
            }
          }
          // Handle social platforms
          else if (line.startsWith('  ') && !line.startsWith('    ') && trimmedLine.includes(':') && isInSocial) {
            const [platform] = trimmedLine.split(':');
            currentSocialPlatform = platform.trim();
            // Map 'x' to 'twitter' as the form uses 'twitter'
            if (currentSocialPlatform === 'x') {
              currentSocialPlatform = 'twitter';
            }
            if (['twitter', 'telegram', 'discord'].includes(currentSocialPlatform)) {
              parsed.social[currentSocialPlatform] = [];
            }
          }
          // Handle social platform URLs
          else if (line.startsWith('    ') && trimmedLine.startsWith('- url:') && isInSocial && currentSocialPlatform) {
            const url = trimmedLine.replace('- url:', '').trim();
            if (url && parsed.social[currentSocialPlatform]) {
              parsed.social[currentSocialPlatform].push(url);
            }
          }
        }

        // If description is still being processed
        if (isInDescription && descriptionLines.length > 0) {
          parsed.description = descriptionLines.join(' ');
        }

        // Convert parsed data to form format
        const newFormData: ProjectFormData = {
          name: parsed.name || '',
          display_name: parsed.display_name || '',
          description: parsed.description || '',
          websites: parsed.websites && parsed.websites.length > 0 ? [...parsed.websites, ''] : [''],
          social: {
            twitter: parsed.social?.twitter ? parsed.social.twitter.map((url: string) => ({ url })) : [{ url: '' }],
            telegram: parsed.social?.telegram ? parsed.social.telegram.map((url: string) => ({ url })) : [{ url: '' }],
            discord: parsed.social?.discord ? parsed.social.discord.map((url: string) => ({ url })) : [{ url: '' }],
          },
          github: parsed.github && parsed.github.length > 0 ? [...parsed.github, ''] : [''],
          npm: parsed.npm && parsed.npm.length > 0 ? [...parsed.npm, ''] : [''],
          crates: parsed.crates && parsed.crates.length > 0 ? [...parsed.crates, ''] : [''],
          pypi: parsed.pypi && parsed.pypi.length > 0 ? [...parsed.pypi, ''] : [''],
          go: parsed.go && parsed.go.length > 0 ? [...parsed.go, ''] : [''],
          open_collective: parsed.open_collective || '',
          defillama: parsed.defillama && parsed.defillama.length > 0 ? [...parsed.defillama, ''] : [''],
          comments: parsed.comments || ''
        };

        // Add empty entries for social platforms if they have data
        Object.keys(newFormData.social).forEach(platform => {
          const socialPlatform = newFormData.social[platform as keyof typeof newFormData.social];
          if (socialPlatform.length > 0 && socialPlatform[socialPlatform.length - 1].url !== '') {
            socialPlatform.push({ url: '' });
          }
        });

        // Validate the description for YAML issues
        if (parsed.description) {
          const descriptionIssues = validateYamlDescription(parsed.description);
          if (descriptionIssues.length > 0) {
            setNotification({
              message: `⚠️ YAML parsed successfully, but description has potential issues: ${descriptionIssues.join('. ')}`,
              type: 'error'
            });
          }
        }

        setFormData(newFormData);
        setYamlInput('');
        setHasAutoFilled(true);
        setCurrentStep(2);
        
        if (!parsed.description || validateYamlDescription(parsed.description || '').length === 0) {
          setNotification({
            message: 'YAML data successfully parsed and form filled! Please review and complete the remaining fields.',
            type: 'success'
          });
        }
      } catch {
        setNotification({
          message: 'Error parsing YAML. Please check the format and try again.',
          type: 'error'
        });
      }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateForm()) {
        return;
      }
      setIsSubmitting(true);
      try {
        const yaml = generateYaml();
        setGeneratedYaml(yaml);
        setCurrentStep(3);
        setNotification({
          message: 'YAML generated successfully! Next: Create a Pull Request to submit your project.',
          type: 'success'
        });
      } catch (error) {
        setNotification({
          message: error instanceof Error ? error.message : 'Error generating YAML',
          type: 'error'
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleClearForm = () => {
      const freshFormData = JSON.parse(JSON.stringify(initialFormData));
      setFormData(freshFormData);
      setErrors({});
      setGeneratedYaml('');
      setHasAutoFilled(false);
      setCurrentStep(1);
      setNotification({
          message: 'Form cleared! Start over by pasting YAML or filling manually.',
          type: 'success'
        });
    };

    const generateYamlForProject = (projectData: ProjectFormData) => {
      let yaml = `version: 7\n`;
      yaml += `name: ${projectData.name}\n`;
      yaml += `display_name: ${projectData.display_name}\n`;
      if (projectData.description) {
        yaml += `description: ${projectData.description}\n`;
      }
      const addUrlsSection = (sectionName: string, urls: string[]) => {
        const filteredUrls = urls.filter(url => url.trim());
        if (filteredUrls.length > 0) {
          yaml += `${sectionName}:\n`;
          filteredUrls.forEach(url => {
            yaml += `  - url: ${url}\n`;
          });
        }
      };
      addUrlsSection('websites', projectData.websites);
      if (projectData.social.discord.length > 0 || projectData.social.telegram.length > 0 || projectData.social.twitter.length > 0) {
          yaml += 'social:\n';
          const addSocialSection = (platform: 'twitter' | 'telegram' | 'discord') => {
              const filteredPlatform = projectData.social[platform].filter(item => item.url.trim());
              if (filteredPlatform.length > 0) {
                yaml += `  ${platform}:\n`;
                filteredPlatform.forEach(item => {
                    yaml += `    - url: ${item.url}\n`;
                });
              }
          };
          ['twitter', 'telegram', 'discord'].forEach(platform => {
              addSocialSection(platform as 'twitter' | 'telegram' | 'discord');
          });
      }
      addUrlsSection('github', projectData.github);
      addUrlsSection('npm', projectData.npm);
      addUrlsSection('crates', projectData.crates);
      addUrlsSection('pypi', projectData.pypi);
      addUrlsSection('go', projectData.go);
      if (projectData.open_collective.trim()) {
        yaml += `open_collective: ${projectData.open_collective}\n`;
      }
      addUrlsSection('defillama', projectData.defillama);
      if (projectData.comments.trim()) {
        yaml += `comments: |\n${projectData.comments.split('\n').map(line => `  ${line}`).join('\n')}\n`;
      }
      return yaml;
    };

    const generateYaml = () => {
      return generateYamlForProject(formData);
    };

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      
      // Move to step 2 if user starts manually filling and hasn't auto-filled
      if (!hasAutoFilled && currentStep === 1 && value.trim()) {
        setCurrentStep(2);
        setNotification({
          message: 'Great! Continue filling out all required fields.',
          type: 'success'
        });
      }
      
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

    type ArrayFields = Extract<keyof ProjectFormData, 'websites' | 'github' | 'npm' | 'crates' | 'pypi' | 'go' | 'defillama'>;
    const handleArrayChange = (fieldName: ArrayFields, index: number, value: string) => {
      setFormData(prev => {
        const updatedArray = [...prev[fieldName]];
        updatedArray[index] = value;
        if (index === updatedArray.length - 1 && value.trim()) {
          updatedArray.push('');
        }
        return {
          ...prev,
          [fieldName]: updatedArray
        };
      });
      if (errors[`${fieldName}_${index}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`${fieldName}_${index}`];
          return newErrors;
        });
      }
    };
    const handleSocialChange = (platform: 'twitter' | 'telegram' | 'discord', index: number, value: string) => {
      const updatedSocial = { ...formData.social };
      updatedSocial[platform][index].url = value;
      if (index === updatedSocial[platform].length - 1 && value.trim()) {
        updatedSocial[platform].push({ url: '' });
      }
      setFormData(prev => ({
        ...prev,
        social: updatedSocial
      }));
      if (errors[`${platform}_${index}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`${platform}_${index}`];
          return newErrors;
        });
      }
    };
    const removeArrayItem = (fieldName: ArrayFields, index: number) => {
      setFormData(prev => {
        const updatedArray = prev[fieldName].filter((_, i) => i !== index);
        return {
          ...prev,
          [fieldName]: updatedArray.length ? updatedArray : ['']
        };
      });
    };
    const removeSocial = (platform: 'twitter' | 'telegram' | 'discord', index: number) => {
      const updatedSocial = { ...formData.social };
      updatedSocial[platform] = updatedSocial[platform].filter((_, i) => i !== index);
      if (updatedSocial[platform].length === 0) {
        updatedSocial[platform].push({ url: '' });
      }
      setFormData(prev => ({
        ...prev,
        social: updatedSocial
      }));
    };
    const steps = [
      { id: 1, title: 'Auto-fill or Start Manual Entry', description: 'Paste YAML from Site Profiler GPT or start filling manually' },
      { id: 2, title: 'Complete Project Details', description: 'Fill in all required project information' },
      { id: 3, title: 'Generate & Submit', description: 'Create YAML and submit pull request' }
    ];
    return (
      <>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <div className="max-w-7xl mx-auto mt-0 mb-4 bg-white/80 shadow-2xl rounded-3xl border border-gray-100 backdrop-blur-lg">
          {/* Step Progress Indicator */}
          <div className="px-8 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    currentStep >= step.id 
                      ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <div className="ml-3 hidden md:block">
                      <div className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                      currentStep > step.id ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}: {steps.find(s => s.id === currentStep)?.title}
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8 px-8 py-8">
            {/* Step 1: YAML Auto-fill Section */}
            {currentStep === 1 && (
              <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-6 border border-blue-200 shadow-lg overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 left-0 w-full h-full bg-white/5"></div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute top-4 left-4 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Quick Start: Auto-fill from YAML
                      </h3>
                      <p className="text-sm text-gray-600">Recommended: Use Site Profiler GPT for instant setup</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    Step 1
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={yamlInput}
                      onChange={(e) => setYamlInput(e.target.value)}
                      placeholder={`Paste your YAML here, for example:
version: 7
name: icecreamswap
display_name: IceCreamSwap
description: >
  IceCreamSwap is a multichain decentralized finance...
websites:
  - url: https://icecreamswap.com/
social:
  twitter:
    - url: https://twitter.com/icecream_swap
github:
  - url: https://github.com/IceCreamSwapCom/IceCreamSwapUi`}
                      rows={8}
                      className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg shadow-sm text-sm font-mono bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    />
                    {yamlInput && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => parseYamlAndFillForm(yamlInput)}
                      disabled={!yamlInput.trim()}
                      className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-medium text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Parse YAML & Auto-Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => setYamlInput('')}
                      className="px-4 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors border border-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-3">
                      Or skip auto-fill and start manually:
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-2 text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                      Fill Form Manually →
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            )}
            {/* Step 2: Complete Form Details */}
            {currentStep >= 2 && (
              <div className="space-y-8">
                {hasAutoFilled && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">
                        Form auto-filled successfully! Please review and complete any missing fields below.
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Basic Info Section */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center mr-2">1</span>
                    Basic Information
                  </h2>
                  <BasicInfoSection
                    formData={formData}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    handleArrayChange={handleArrayChange}
                    removeArrayItem={removeArrayItem}
                    PROJECT_DESCRIPTIONS={PROJECT_DESCRIPTIONS}
                    isClient={isClient}
                  />
                </div>

                {/* Social Section */}
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                  <h2 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full text-xs flex items-center justify-center mr-2">2</span>
                    Social Media
                  </h2>
                  <SocialSection
                    formData={formData}
                    errors={errors}
                    handleSocialChange={handleSocialChange}
                    removeSocial={removeSocial}
                    PROJECT_DESCRIPTIONS={PROJECT_DESCRIPTIONS}
                  />
                </div>

                {/* Development Section */}
                <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
                  <h2 className="text-xl font-bold text-pink-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-pink-600 text-white rounded-full text-xs flex items-center justify-center mr-2">3</span>
                    Development Resources
                  </h2>
                  <DevelopmentSection
                    formData={formData}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    handleArrayChange={handleArrayChange}
                    removeArrayItem={removeArrayItem}
                    isClient={isClient}
                  />
                </div>

                {/* Additional Section */}
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center mr-2">4</span>
                    Additional Information
                  </h2>
                  <AdditionalSection
                    formData={formData}
                    errors={errors}
                    handleInputChange={handleInputChange}
                    handleArrayChange={handleArrayChange}
                    removeArrayItem={removeArrayItem}
                  />
                </div>
              </div>
            )}
            {/* Step 3: Generate YAML and Submit */}
            {currentStep >= 2 && (
              <div className="space-y-6">
                {/* Progress reminder for step 2 */}
                {currentStep === 2 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-yellow-800">
                        Please complete all required fields above, then generate your YAML below.
                      </span>
                    </div>
                  </div>
                )}

                {/* Generate YAML Button */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || currentStep < 2}
                    className="flex-1 flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating YAML...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Generate YAML Preview
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm font-semibold border border-gray-200"
                  >
                    Reset Form
                  </button>
                </div>

                {/* Step 3: YAML Preview and GitHub Submission */}
                {isClient && generatedYaml && currentStep === 3 && (
                  <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-6 border border-blue-200 shadow-lg overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 left-0 w-full h-full bg-white/5"></div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className="absolute top-4 left-4 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute bottom-4 right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm flex items-center justify-center mr-3">✓</span>
                        YAML Generated Successfully!
                      </h3>
                      <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                        Step 3
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 mb-4 border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Generated YAML Preview:</h4>
                      <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {generatedYaml}
                      </pre>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        <strong>Final Step:</strong> Create a pull request to submit your project to the OSS directory.
                      </p>
                      
                      <a
                        href={`https://github.com/opensource-observer/oss-directory/new/main/data/projects/${formData.name.charAt(0).toLowerCase()}?filename=${formData.name}.yaml&value=${encodeURIComponent(generatedYaml)}&message=${encodeURIComponent(`Add ${formData.display_name} project`)}&description=Adding%20project%20via%20Open%20Labels%20Initiative%20form`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => { fetch('/api/discord/pr-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectName: formData.display_name }) }); }}
                        className="w-full flex justify-center items-center px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:via-purple-700 hover:to-pink-600 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      >
                        <svg 
                          className="w-5 h-5 mr-2" 
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        Create Pull Request & Submit Project
                      </a>
                      
                      <p className="text-xs text-gray-500 text-center">
                        This will open GitHub where you can review and submit your project addition.
                      </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </>
    );
};

export default AddProjectForm;