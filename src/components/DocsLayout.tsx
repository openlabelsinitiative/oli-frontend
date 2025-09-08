import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useSearchParams } from 'next/navigation';
import TagDocumentation from './TagDocumentation';
import FaqScript from './FaqScript';

interface DocsSection {
  id: string;
  title: string;
  description: string;
  githubUrl?: string;
  component?: React.ComponentType;
  content?: string;
}

const DocsLayout: React.FC = () => {
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');
  
  const [activeSection, setActiveSection] = useState(
    // Use the section from URL params if valid, otherwise default to 'overview'
    sectionParam && ['overview', 'label-schema', 'label-pool', 'label-trust'].includes(sectionParam)
      ? sectionParam
      : 'overview'
  );
  
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [content, setContent] = useState<{ [key: string]: string }>({});

  const sections: DocsSection[] = useMemo(() => [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Introduction to the Open Labels Initiative',
      githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/README.md'
    },
    {
      id: 'label-schema',
      title: 'Label Schema',
      description: 'Data Model & Tag Definitions',
      component: TagDocumentation
    },
    {
      id: 'label-pool',
      title: 'Label Pool',
      description: 'Label Pool & Data Entry',
      githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/README.md'
    },
    {
      id: 'label-trust',
      title: 'Label Trust',
      description: 'Label Confidence & Trust Algorithms',
      githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/3_label_confidence/README.md'
    }
  ], []);

  const fetchContent = useCallback(async (section: DocsSection) => {
    if (!section.githubUrl || content[section.id]) return;

    setLoading(prev => ({ ...prev, [section.id]: true }));
    
    try {
      const response = await fetch(section.githubUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      let text = await response.text();
      
      // Process FAQ sections with details/summary tags
      text = processFaqSections(text);
      
      setContent(prev => ({ ...prev, [section.id]: text }));
    } catch (error) {
      console.error(`Error fetching ${section.title}:`, error);
      setContent(prev => ({ ...prev, [section.id]: `# Error Loading Content\n\nFailed to load content from GitHub. Please try again later or visit the [source directly](${section.githubUrl}).` }));
    } finally {
      setLoading(prev => ({ ...prev, [section.id]: false }));
    }
  }, [content]);

  useEffect(() => {
    const currentSection = sections.find(s => s.id === activeSection);
    if (currentSection && currentSection.githubUrl) {
      fetchContent(currentSection);
    }
  }, [activeSection, fetchContent, sections]);

  // Handle FAQ scrolling after content loads
  useEffect(() => {
    if (content[activeSection] && activeSection === 'overview') {
      // Check if we should scroll to FAQ
      const shouldScrollToFAQ = typeof window !== 'undefined' && sessionStorage.getItem('scrollToFAQ');
      
      if (shouldScrollToFAQ) {
        // Clear the flag
        sessionStorage.removeItem('scrollToFAQ');
        
        // Wait for content to render, then scroll to FAQ
        setTimeout(() => {
          // Try multiple selectors to find the FAQ section
          const faqSelectors = [
            'h1[id*="frequently-asked-questions"]',
            'h2[id*="frequently-asked-questions"]', 
            'h1[id*="faq"]',
            'h2[id*="faq"]',
            '[id*="frequently-asked-questions"]',
            '.custom-faq-container'
          ];
          
          let faqElement = null;
          for (const selector of faqSelectors) {
            faqElement = document.querySelector(selector);
            if (faqElement) break;
          }
          
          // If we still can't find it, try text-based search
          if (!faqElement) {
            const headings = document.querySelectorAll('h1, h2, h3');
            for (const heading of headings) {
              if (heading.textContent?.toLowerCase().includes('frequently asked questions') || 
                  heading.textContent?.toLowerCase().includes('faq')) {
                faqElement = heading;
                break;
              }
            }
          }
          
          if (faqElement) {
            faqElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 1000); // Wait 1 second for content to render
      }
    }
  }, [content, activeSection]);

  // Process FAQ sections with details/summary tags
  const processFaqSections = (text: string): string => {
    // For the specific format in the FAQ section, let's use a completely different approach
    // We'll replace the markdown details/summary tags with custom HTML divs that we can style
    
    // Replace the entire FAQ section with custom HTML
    const faqSectionRegex = /(# Frequently Asked Questions \(FAQ\)[\s\S]*?)(?=^#|$)/m;
    const match = text.match(faqSectionRegex);
    
    if (match) {
      const faqSection = match[1];
      
      // Extract each FAQ item
      const faqItems = faqSection.split('<details>').filter(item => item.includes('<summary>'));
      
      // Build a custom HTML FAQ section
      let customFaqHtml = '# Frequently Asked Questions (FAQ)\n\n<div class="custom-faq-container">\n';
      
      faqItems.forEach(item => {
        // Extract question and answer
        const questionMatch = item.match(/<summary><strong>(.*?)<\/strong><\/summary>/);
        if (!questionMatch) return;
        
        const question = questionMatch[1];
        // Process the answer content to fix links
        let answer = item.replace(/<summary><strong>.*?<\/strong><\/summary>/, '').replace('</details>', '').trim();
        
        // Fix GitHub links in the answer content
        answer = answer.replace(/href="(github\.com[^"]+)"/g, 'href="https://$1"');
        answer = answer.replace(/href="([^"]+\.md)"/g, 'href="https://github.com/openlabelsinitiative/OLI/blob/main/$1"');
        answer = answer.replace(/href="([^"]+\/README\.md)"/g, 'href="https://github.com/openlabelsinitiative/OLI/blob/main/$1"');
        answer = answer.replace(/href="(\/[^"]+)"/g, 'href="https://github.com/openlabelsinitiative/OLI/tree/main$1"');
        
        // Format as custom HTML
        customFaqHtml += `
<div class="custom-faq-item">
  <button class="custom-faq-question" onclick="this.parentElement.classList.toggle('active')">
    <strong>${question}</strong>
    <span class="custom-faq-icon">+</span>
  </button>
  <div class="custom-faq-answer">
    ${answer}
  </div>
</div>
`;
      });
      
      customFaqHtml += '</div>\n';
      
      // Replace the original FAQ section with our custom HTML
      return text.replace(match[0], customFaqHtml);
    }
    
    return text;
  };

  const renderContent = () => {
    const currentSection = sections.find(s => s.id === activeSection);
    if (!currentSection) return null;

    if (currentSection.component) {
      const Component = currentSection.component;
      return <Component />;
    }

    if (loading[activeSection]) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documentation...</p>
          </div>
        </div>
      );
    }

    if (content[activeSection]) {
      return (
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // Custom link renderer to handle GitHub links
              a: ({ href, children, ...props }) => {
                const hrefString = typeof href === 'string' ? href : '';
                
                // Different types of links we need to handle
                const startsWithGitHub = hrefString.startsWith('github.com');
                const isGitHubRepo = hrefString.includes('github.com');
                const isGitHubRelative = !hrefString.startsWith('http') && (hrefString.includes('.md') || hrefString.includes('.yml'));
                const isGitHubDirectory = !hrefString.startsWith('http') && 
                  (hrefString.startsWith('/') || 
                   hrefString.includes('/README.md') || 
                   hrefString.match(/\/[^\/]+\/$/));
                
                // Determine the final href
                let finalHref = hrefString;
                
                // Handle links starting with "github.com" without protocol
                if (startsWithGitHub) {
                  finalHref = `https://${hrefString}`;
                }
                
                // Handle GitHub relative links (.md files)
                else if (isGitHubRelative) {
                  finalHref = `https://github.com/openlabelsinitiative/OLI/blob/main/${hrefString}`;
                }
                
                // Handle GitHub directory links
                else if (isGitHubDirectory) {
                  finalHref = `https://github.com/openlabelsinitiative/OLI/tree/main${hrefString.startsWith('/') ? hrefString : '/' + hrefString}`;
                }
                
                // Always open GitHub links in a new tab
                const openInNewTab = isGitHubRepo || isGitHubRelative || isGitHubDirectory || hrefString.startsWith('http');
                
                return (
                  <a 
                    href={finalHref}
                    target={openInNewTab ? '_blank' : undefined}
                    rel={openInNewTab ? 'noopener noreferrer' : undefined}
                    className="text-indigo-600 hover:text-indigo-800 underline"
                    {...props}
                  >
                    {children}
                    {(isGitHubRepo || isGitHubRelative || isGitHubDirectory) && (
                      <span className="inline-block ml-1 text-xs text-gray-500" title="Opens in GitHub">
                        <svg className="inline-block w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </a>
                );
              },
              // Custom image renderer for GitHub images
              img: ({ src, alt, ...props }) => {
                const srcString = typeof src === 'string' ? src : '';
                const finalSrc = srcString?.startsWith('http') 
                  ? srcString 
                  : `https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/${srcString}`;
                
                return (
                  <img 
                    src={finalSrc}
                    alt={alt || ''}
                    className="max-w-full h-auto rounded-lg shadow-sm"
                    {...props}
                  />
                );
              },
              // Custom table styling
              table: ({ children, ...props }) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg" {...props}>
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children, ...props }) => (
                <thead className="bg-gray-50" {...props}>
                  {children}
                </thead>
              ),
              tbody: ({ children, ...props }) => (
                <tbody className="bg-white divide-y divide-gray-200" {...props}>
                  {children}
                </tbody>
              ),
              tr: ({ children, ...props }) => (
                <tr className="hover:bg-gray-50" {...props}>
                  {children}
                </tr>
              ),
              th: ({ children, ...props }) => (
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300"
                  {...props}
                >
                  {children}
                </th>
              ),
              td: ({ children, ...props }) => (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200" {...props}>
                  {children}
                </td>
              ),
              // Custom details/summary for expandable sections
              details: ({ children, ...props }) => (
                <details className="my-4 border border-gray-200 rounded-lg overflow-hidden" {...props}>
                  {children}
                </details>
              ),
              summary: ({ children, ...props }) => (
                <summary className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 font-medium text-gray-900 border-b border-gray-200 flex items-center justify-between" {...props}>
                  <span>{children}</span>
                  <svg className="w-5 h-5 text-gray-500 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
              ),
              // Custom code block styling
              pre: ({ children, ...props }) => (
                <pre className="bg-gray-100 border border-gray-200 rounded-lg p-4 overflow-x-auto" {...props}>
                  {children}
                </pre>
              ),
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                return (
                  <code 
                    className={isInline 
                      ? "bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" 
                      : "block"
                    }
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              // Custom blockquote styling
              blockquote: ({ children, ...props }) => (
                <blockquote className="border-l-4 border-indigo-500 bg-indigo-50 p-4 my-4 italic" {...props}>
                  {children}
                </blockquote>
              ),
              // Custom list styling
              ul: ({ children, ...props }) => (
                <ul className="list-disc list-inside space-y-2 my-4" {...props}>
                  {children}
                </ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="list-decimal list-inside space-y-2 my-4" {...props}>
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => (
                <li className="text-gray-700" {...props}>
                  {children}
                </li>
              ),
              // Custom heading styling
              h1: ({ children, ...props }) => (
                <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200" {...props}>
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => (
                <h2 className="text-2xl font-semibold text-gray-900 mt-6 mb-3" {...props}>
                  {children}
                </h2>
              ),
              h3: ({ children, ...props }) => (
                <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2" {...props}>
                  {children}
                </h3>
              ),
              h4: ({ children, ...props }) => (
                <h4 className="text-lg font-medium text-gray-900 mt-3 mb-2" {...props}>
                  {children}
                </h4>
              ),
              // Custom paragraph styling
              p: ({ children, ...props }) => (
                <p className="text-gray-700 leading-relaxed my-3" {...props}>
                  {children}
                </p>
              )
            }}
          >
            {content[activeSection]}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No content available</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Include the FAQ script for client-side functionality */}
      <FaqScript />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Documentation</h1>
            <p className="mt-2 text-lg text-gray-600">
              Complete guide to the Open Labels Initiative
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="font-medium">{section.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{section.description}</div>
                  </button>
                ))}
              </nav>
              
              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <a
                    href="https://github.com/openlabelsinitiative/OLI"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub Repository
                  </a>
                  <a
                    href="https://t.me/olilabels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.10.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                    Telegram Community
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {sections.find(s => s.id === activeSection)?.title}
                    </h2>
                    <p className="mt-1 text-gray-600">
                      {sections.find(s => s.id === activeSection)?.description}
                    </p>
                  </div>
                  {sections.find(s => s.id === activeSection)?.githubUrl && (
                    <a
                      href={sections.find(s => s.id === activeSection)?.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                      </svg>
                      View on GitHub
                    </a>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsLayout;
