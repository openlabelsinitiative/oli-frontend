/**
 * Simplified Documentation Configuration
 * Consolidates all documentation structure and utilities
 */

import React from 'react';
import TagDocumentation from '../components/docs/TagDocumentation';
import APIReference from '../components/docs/APIReference';

export interface DocSection {
  id: string;
  title: string;
  description: string;
  githubUrl?: string;
  githubPath?: string;
  component?: React.ComponentType<any>;
  order?: number;
  parent?: string;
  children?: DocSection[];
  fileType?: 'markdown' | 'yaml' | 'json' | 'text';
  isClickable?: boolean; // New property to control if section can be navigated to
}

export interface ParsedLink {
  originalHref: string;
  resolvedHref: string;
  linkType: 'external' | 'github-file' | 'github-directory' | 'internal-doc' | 'relative';
  openInNewTab: boolean;
  title?: string;
  description?: string;
}

export interface LinkResolutionContext {
  currentFilePath: string;
  repositoryOwner: string;
  repositoryName: string;
  branch: string;
  baseGitHubUrl: string;
}

/**
 * Documentation sections configuration
 */
export const DOC_SECTIONS: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    description: 'Introduction to the Open Labels Initiative',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/README.md',
    githubPath: 'README.md',
    order: 0,
    children: []
  },
  {
    id: 'label-schema',
    title: 'Label Schema',
    description: 'Data Model & Tag Definitions',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/1_label_schema/README.md',
    githubPath: '1_label_schema/README.md',
    order: 1,
    children: [
      {
        id: 'tag-documentation',
        title: 'Tag Definitions and ValueSets',
        description: 'Interactive tag definitions and value sets browser',
        component: TagDocumentation,
        parent: 'label-schema'
      }
    ]
  },
  {
    id: 'label-pool',
    title: 'Label Pool',
    description: 'Label Pool & Data Entry',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/README.md',
    githubPath: '2_label_pool/README.md',
    order: 2,
    children: [
      {
        id: 'attestation-schema',
        title: 'Attestation Schema',
        description: 'Ethereum Attestation Service schemas and resolvers',
        githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/attestation_schema/README.md',
        githubPath: '2_label_pool/attestation_schema/README.md',
        parent: 'label-pool',
        isClickable: false, // No README file exists in GitHub
        children: [
            {
              id: 'eas-schema-versioning',
              title: 'EAS Schema Versioning',
              description: 'Schema versioning configuration for Ethereum Attestation Service',
              githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/attestation_schema/EAS_schema_versioning.yml',
              githubPath: '2_label_pool/attestation_schema/EAS_schema_versioning.yml',
              parent: 'attestation-schema',
              fileType: 'yaml' as const
            }
        ]
      },
      {
        id: 'tooling-read',
        title: 'Reading Tools',
        description: 'Tools for reading data from the label pool',
        githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/tooling_read/README.md',
        githubPath: '2_label_pool/tooling_read/README.md',
        parent: 'label-pool',
        isClickable: false, // No README file exists in GitHub
        children: [
          {
            id: 'tooling-read-bigquery',
            title: 'BigQuery Tables',
            description: 'Public BigQuery tables for historical analytics and backfills',
            githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/tooling_read/bigquery/README.md',
            githubPath: '2_label_pool/tooling_read/bigquery/README.md',
            parent: 'tooling-read'
          },
          {
            id: 'tooling-read-parquet',
            title: 'Parquet Tools',
            description: 'Parquet data processing and export tools',
            githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/tooling_read/parquet/README.md',
            githubPath: '2_label_pool/tooling_read/parquet/README.md',
            parent: 'tooling-read'
          },
          {
            id: 'tooling-read-python',
            title: 'Python Reading Tools',
            description: 'Python tools and notebooks for reading labels from the pool',
            githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/tooling_read/python/README.md',
            githubPath: '2_label_pool/tooling_read/python/README.md',
            parent: 'tooling-read'
          }
        ]
      },
      {
        id: 'tooling-write',
        title: 'Writing Tools',
        description: 'Tools for writing data to the label pool',
        githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/tooling_write/README.md',
        githubPath: '2_label_pool/tooling_write/README.md',
        parent: 'label-pool',
        isClickable: false, // No README file exists in GitHub
        children: [
          {
            id: 'tooling-write-python',
            title: 'Python Writing Tools',
            description: 'Python tools for writing labels to the pool',
            githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/tooling_write/python/README.md',
            githubPath: '2_label_pool/tooling_write/python/README.md',
            parent: 'tooling-write'
          },
          {
            id: 'tooling-write-typescript',
            title: 'TypeScript Writing Tools',
            description: 'TypeScript tools for writing labels to the pool',
            githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/2_label_pool/tooling_write/typescript/README.md',
            githubPath: '2_label_pool/tooling_write/typescript/README.md',
            parent: 'tooling-write'
          }
        ]
      }
    ]
  },
  {
    id: 'label-trust',
    title: 'Label Trust',
    description: 'Label Confidence & Trust Algorithms',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/3_label_trust/README.md',
    githubPath: '3_label_trust/README.md',
    order: 3,
    children: []
  },
  {
    id: 'oli-python',
    title: 'OLI Python Package',
    description: 'Python tools for writing labels to the pool',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/oli-python/main/README.md',
    githubPath: 'oli-python/README.md',
    order: 4,
    children: []
  },
  {
    id: 'oli-hardhat',
    title: 'OLI Hardhat Plugin',
    description: 'Hardhat plugin for generating and publishing Open Labels attestations during deployments',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/oli-hardhat/main/README.md',
    githubPath: 'README.md',
    order: 5,
    children: []
  },
  {
    id: 'oli-sdk',
    title: 'OLI SDK',
    description: 'TypeScript SDK for integrating with the Open Labels ecosystem and label pool',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/oli-sdk/main/README.md',
    githubPath: 'README.md',
    order: 6,
    children: []
  },
  {
    id: 'partnerships',
    title: 'Partnerships',
    description: 'Partnership documentation and collaboration opportunities',
    githubUrl: 'https://raw.githubusercontent.com/openlabelsinitiative/OLI/main/PARTNERSHIPS.md',
    githubPath: 'PARTNERSHIPS.md',
    order: 7,
    children: []
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Interactive API documentation with testing capabilities',
    component: APIReference,
    order: 8,
    children: []
  }
];

/**
 * Default link resolution context
 */
export const DEFAULT_LINK_CONTEXT: LinkResolutionContext = {
  currentFilePath: 'README.md',
  repositoryOwner: 'openlabelsinitiative',
  repositoryName: 'OLI',
  branch: 'main',
  baseGitHubUrl: 'https://github.com/openlabelsinitiative/OLI'
};

/**
 * Simple link resolver class
 */
export class SimpleLinkResolver {
  private context: LinkResolutionContext;
  private sectionMap: Map<string, DocSection>;

  constructor(context: LinkResolutionContext = DEFAULT_LINK_CONTEXT, sections: DocSection[] = DOC_SECTIONS) {
    this.context = context;
    this.sectionMap = new Map();
    this.buildSectionMap(sections);
  }

  private static hasLoggedMappings = false;

  private buildSectionMap(sections: DocSection[]): void {
    const addSection = (section: DocSection) => {
      const repoInfo = section.githubUrl ? getRepoInfoFromUrl(section.githubUrl) : null;
      const repoOwner = repoInfo?.owner || this.context.repositoryOwner;
      const repoName = repoInfo?.repo || this.context.repositoryName;
      const branch = repoInfo?.branch || this.context.branch;
      const baseGitHubUrl = repoInfo?.baseGitHubUrl || `https://github.com/${repoOwner}/${repoName}`;
      
      // Map by GitHub path with extensive variations
      if (section.githubPath) {
        if (!this.sectionMap.has(section.githubPath)) {
          this.sectionMap.set(section.githubPath, section);
        }
        if (!this.sectionMap.has(section.githubPath.toLowerCase())) {
          this.sectionMap.set(section.githubPath.toLowerCase(), section);
        }
        
        // Handle README.md variations
        if (section.githubPath.endsWith('/README.md')) {
          const dirPath = section.githubPath.replace('/README.md', '');
          this.sectionMap.set(dirPath, section);
          this.sectionMap.set(dirPath + '/', section);
          this.sectionMap.set('/' + dirPath, section);
          this.sectionMap.set('/' + dirPath + '/', section);
        }
        
        // Map with leading slashes
        this.sectionMap.set('/' + section.githubPath, section);
        
        // Map common reference patterns found in content
        if (section.githubPath === '1_label_schema/README.md') {
          this.sectionMap.set('/1_label_schema/README.md', section);
          this.sectionMap.set('/././1_label_schema/README.md', section); // Found in content
          this.sectionMap.set('1_label_schema', section);
          this.sectionMap.set('/1_label_schema', section);
          
          // Map sample_data paths correctly to 1_label_schema
          this.sectionMap.set('1_label_schema/sample_data/op-mainnet_top_100_contracts_by_txcount_2024_07_24.json', section);
          this.sectionMap.set('1_label_schema/sample_data/base_top_100_contracts_by_txcount_2024_07_24.json', section);
          this.sectionMap.set('sample_data/op-mainnet_top_100_contracts_by_txcount_2024_07_24.json', section);
          this.sectionMap.set('sample_data/base_top_100_contracts_by_txcount_2024_07_24.json', section);
        }
        
        if (section.githubPath === '2_label_pool/README.md') {
          this.sectionMap.set('/2_label_pool/README.md', section);
          this.sectionMap.set('2_label_pool', section);
          this.sectionMap.set('/2_label_pool', section);
          this.sectionMap.set('2_label_pool/README.md', section);
        }
        
        // Map the OLI Python package section
        if (section.githubPath === 'oli-python/README.md') {
          // Map GitHub URLs to the oli-python repository
          this.sectionMap.set('https://github.com/openlabelsinitiative/oli-python', section);
          this.sectionMap.set('https://github.com/openlabelsinitiative/oli-python/blob/main/README.md', section);
          this.sectionMap.set('openlabelsinitiative/oli-python', section);
          this.sectionMap.set('oli-python', section);
          this.sectionMap.set('oli-python/README.md', section);
          
          // Note: Removed incorrect mappings to tooling_write/python paths
          // These should map to the actual tooling-write-python section, not oli-python
        }
        
        // Map tooling write python paths (separate from oli-python)
        if (section.githubPath?.includes('tooling_write/python')) {
          this.sectionMap.set('tooling_write/python/README.md', section);
          this.sectionMap.set('2_label_pool/tooling_write/python/README.md', section);
          this.sectionMap.set('/2_label_pool/tooling_write/python/README.md', section);
          this.sectionMap.set('2_label_pool/tooling_write/python', section);
          this.sectionMap.set('/2_label_pool/tooling_write/python', section);
        }
        
        if (section.githubPath?.includes('tooling_write/typescript')) {
          this.sectionMap.set('tooling_write/typescript/README.md', section);
          this.sectionMap.set('2_label_pool/tooling_write/typescript', section);
          this.sectionMap.set('/2_label_pool/tooling_write/typescript/README.md', section);
          this.sectionMap.set('tooling_write/bulk_offchain_typescript/README.md', section); // Alternative naming
        }
        
        if (section.githubPath?.includes('tooling_read/python')) {
          this.sectionMap.set('tooling_read/python/README.md', section);
          this.sectionMap.set('2_label_pool/tooling_read/python', section);
          this.sectionMap.set('/2_label_pool/tooling_read/python/README.md', section);
          this.sectionMap.set('2_label_pool/tooling_read/graphql_python', section); // Alternative naming
        }
        
        // Map attestation schema paths
        if (section.githubPath?.includes('attestation_schema')) {
          this.sectionMap.set('2_label_pool/attestation_schema', section);
          this.sectionMap.set('/2_label_pool/attestation_schema', section);
          this.sectionMap.set('attestation_schema', section);
          this.sectionMap.set('/attestation_schema', section);
        }
        
        if (section.githubPath?.includes('EAS_schema_versioning.yml')) {
          this.sectionMap.set('2_label_pool/attestation_schema/EAS_schema_versioning.yml', section);
          this.sectionMap.set('/2_label_pool/attestation_schema/EAS_schema_versioning.yml', section);
          this.sectionMap.set('attestation_schema/EAS_schema_versioning.yml', section);
        }
        
        if (section.githubPath === '3_label_trust/README.md') {
          this.sectionMap.set('/3_label_trust/README.md', section);
          this.sectionMap.set('3_label_trust', section);
          this.sectionMap.set('/3_label_trust', section);
          this.sectionMap.set('3_label_confidence', section); // Alternative name found in content
          this.sectionMap.set('/3_label_confidence', section);
          this.sectionMap.set('3_label_confidence/README.md', section);
        }
        
        if (section.githubPath === 'PARTNERSHIPS.md') {
          this.sectionMap.set('/PARTNERSHIPS.md', section);
          this.sectionMap.set('PARTNERSHIPS', section);
          this.sectionMap.set('/PARTNERSHIPS', section);
        }
      }
      
      // Map by section ID
      this.sectionMap.set(section.id, section);
      
      // Map by GitHub URL if available (both raw and blob formats)
      if (section.githubUrl) {
        const path = this.extractGitHubFilePath(section.githubUrl);
        if (path) {
          if (!this.sectionMap.has(path)) {
            this.sectionMap.set(path, section);
          }
          if (!this.sectionMap.has(path.toLowerCase())) {
            this.sectionMap.set(path.toLowerCase(), section);
          }
          
          // Also create blob URL mapping for common GitHub links
          const blobUrl = section.githubUrl
            .replace('raw.githubusercontent.com', 'github.com')
            .replace(`/${branch}/`, `/blob/${branch}/`);
          this.sectionMap.set(blobUrl, section);
          
          // Create direct GitHub blob URL (handle different repositories)
          const directBlobUrl = `${baseGitHubUrl}/blob/${branch}/${path}`;

          this.sectionMap.set(directBlobUrl, section);
          
          // Also map the double-slash version (common issue)
          const doubleSlashUrl = directBlobUrl.replace(`/blob/${branch}/`, `/blob/${branch}//`);
          this.sectionMap.set(doubleSlashUrl, section);
        }
      }
      
      if (section.children) {
        section.children.forEach(child => {
          addSection(child);
          // Handle nested children (3 levels deep)
          if (child.children) {
            child.children.forEach(addSection);
          }
        });
      }
    };

    sections.forEach(addSection);
  }

  resolveLink(href: string): ParsedLink {
    const originalHref = href;
    
    // Normalize URLs - fix double slashes
    const normalizedHref = href.replace(/([^:]\/)\/+/g, '$1');
    
    // External links
    if (normalizedHref.startsWith('http') && !normalizedHref.includes(this.context.baseGitHubUrl)) {
      return {
        originalHref,
        resolvedHref: normalizedHref,
        linkType: 'external',
        openInNewTab: true
      };
    }

    // Internal doc links (start with #)
    if (normalizedHref.startsWith('#')) {
      return {
        originalHref,
        resolvedHref: normalizedHref,
        linkType: 'internal-doc',
        openInNewTab: false
      };
    }

    // GitHub links - handle various formats
    if (normalizedHref.includes('github.com') || normalizedHref.includes('raw.githubusercontent.com') || normalizedHref.includes(this.context.baseGitHubUrl)) {
      let resolvedHref = normalizedHref;
      
      // Normalize URLs that don't start with https
      if (normalizedHref.startsWith('github.com')) {
        resolvedHref = `https://${normalizedHref}`;
      } else if (normalizedHref.startsWith('raw.githubusercontent.com')) {
        resolvedHref = `https://${normalizedHref}`;
      }

      // Check if this links to a section we have
      const section = this.findSectionByGitHubUrl(resolvedHref);
      if (section) {
        return {
          originalHref,
          resolvedHref: `#${section.id}`,
          linkType: 'internal-doc',
          openInNewTab: false,
          title: section.title,
          description: section.description
        };
      }

      // If it's a link to our repository but we don't have a matching section,
      // convert blob URLs to the proper format but keep as external
      if (resolvedHref.includes(this.context.baseGitHubUrl)) {
        // Convert raw URLs to blob URLs for better user experience
        if (resolvedHref.includes('raw.githubusercontent.com')) {
          const path = this.extractGitHubFilePath(resolvedHref);
          if (path) {
            resolvedHref = `${this.context.baseGitHubUrl}/blob/${this.context.branch}/${path}`;
          }
        }
      }

      return {
        originalHref,
        resolvedHref,
        linkType: 'github-file',
        openInNewTab: true
      };
    }

    // Relative links and file paths
    if (!normalizedHref.startsWith('http') && (normalizedHref.includes('.md') || normalizedHref.includes('/') || normalizedHref.startsWith('./') || normalizedHref.startsWith('../'))) {
      const resolvedPath = this.resolveRelativePath(normalizedHref);
      
      // Try to find a matching section with various path formats
      let section = this.sectionMap.get(resolvedPath) || 
                   this.sectionMap.get(resolvedPath.toLowerCase()) ||
                   this.sectionMap.get(resolvedPath.replace(/^\//, '')) || // Remove leading slash
                   this.sectionMap.get(resolvedPath.replace(/\/$/, '')); // Remove trailing slash
      
      // If not found, try adding README.md for directory paths
      if (!section && !resolvedPath.includes('.')) {
        section = this.sectionMap.get(`${resolvedPath}/README.md`) ||
                 this.sectionMap.get(`${resolvedPath.replace(/\/$/, '')}/README.md`);
      }
      
      if (section) {
        return {
          originalHref,
          resolvedHref: `#${section.id}`,
          linkType: 'internal-doc',
          openInNewTab: false,
          title: section.title,
          description: section.description
        };
      }

      // Convert to GitHub URL
      const cleanPath = resolvedPath.replace(/^\//, '');
      const isDirectory = !normalizedHref.includes('.') || normalizedHref.endsWith('/');
      const gitHubPath = isDirectory ? 'tree' : 'blob';
      
      // Special handling to ensure sample_data links from 1_label_schema go to the correct location
      let finalPath = cleanPath;
      if (cleanPath.includes('sample_data/') && this.context.currentFilePath.includes('1_label_schema')) {
        if (!cleanPath.startsWith('1_label_schema/')) {
          finalPath = `1_label_schema/${cleanPath}`;
        }
      }
      
      const resolvedHref = `${this.context.baseGitHubUrl}/${gitHubPath}/${this.context.branch}/${finalPath}`;

      return {
        originalHref,
        resolvedHref,
        linkType: isDirectory ? 'github-directory' : 'github-file',
        openInNewTab: true
      };
    }

    // Default to external
    return {
      originalHref,
      resolvedHref: normalizedHref,
      linkType: 'external',
      openInNewTab: true
    };
  }

  private findSectionByGitHubUrl(url: string): DocSection | null {
    // First check if the URL is directly mapped in our section map
    const directSection = this.sectionMap.get(url);
    if (directSection) {
      return directSection;
    }
    
    // Also check common variations
    const urlWithoutTrailingSlash = url.replace(/\/$/, '');
    const urlWithTrailingSlash = url.endsWith('/') ? url : url + '/';
    
    if (this.sectionMap.has(urlWithoutTrailingSlash)) {
      return this.sectionMap.get(urlWithoutTrailingSlash)!;
    }
    if (this.sectionMap.has(urlWithTrailingSlash)) {
      return this.sectionMap.get(urlWithTrailingSlash)!;
    }
    
    // Normalize the URL to extract the file path
    const normalizedPath = this.extractGitHubFilePath(url);
    if (!normalizedPath) return null;

    // Check direct matches first
    for (const section of this.sectionMap.values()) {
      if (section.githubUrl === url || section.githubUrl === url.replace('/blob/', '/raw/')) {
        return section;
      }
      
      // Check if the GitHub path matches
      if (section.githubPath === normalizedPath) {
        return section;
      }
      
      // Check if section's GitHub URL contains the same path
      if (section.githubUrl) {
        const sectionPath = this.extractGitHubFilePath(section.githubUrl);
        if (sectionPath === normalizedPath) {
          return section;
        }
      }
    }
    return null;
  }

  private extractGitHubFilePath(url: string): string | null {
    // Handle various GitHub URL formats:
    // https://github.com/owner/repo/blob/branch/path/file.md
    // https://raw.githubusercontent.com/owner/repo/branch/path/file.md
    // https://github.com/owner/repo/tree/branch/path/
    
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname === 'github.com') {
        // Format: /owner/repo/blob|tree/branch/path...
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length >= 4 && (pathParts[2] === 'blob' || pathParts[2] === 'tree')) {
          return pathParts.slice(4).join('/'); // Remove owner/repo/blob|tree/branch
        }
      } else if (urlObj.hostname === 'raw.githubusercontent.com') {
        // Format: /owner/repo/branch/path...
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length >= 3) {
          return pathParts.slice(3).join('/'); // Remove owner/repo/branch
        }
      }
    } catch {
      // Invalid URL, try regex fallback
      const githubMatch = url.match(/github\.com\/[^\/]+\/[^\/]+\/(?:blob|tree)\/[^\/]+\/(.+)$/);
      if (githubMatch) return githubMatch[1];
      
      const rawMatch = url.match(/raw\.githubusercontent\.com\/[^\/]+\/[^\/]+\/[^\/]+\/(.+)$/);
      if (rawMatch) return rawMatch[1];
    }
    
    return null;
  }

  private resolveRelativePath(href: string): string {
    // Handle absolute paths from repository root (starting with /)
    if (href.startsWith('/')) {
      // Clean up the path by resolving . and .. components
      const cleanedPath = this.normalizePath(href.slice(1)); // Remove leading /
      return cleanedPath;
    }
    
    const currentDir = this.context.currentFilePath.split('/').slice(0, -1).join('/');
    
    if (href.startsWith('./')) {
      const cleanedPath = this.normalizePath(`${currentDir}/${href.slice(2)}`);
      return cleanedPath;
    }
    
    if (href.startsWith('../')) {
      const parts = href.split('/');
      const dirParts = currentDir.split('/');
      
      let upCount = 0;
      for (const part of parts) {
        if (part === '..') {
          upCount++;
        } else {
          break;
        }
      }
      
      const targetDir = dirParts.slice(0, -upCount).join('/');
      const remainingPath = parts.slice(upCount).join('/');
      
      const fullPath = targetDir ? `${targetDir}/${remainingPath}` : remainingPath;
      return this.normalizePath(fullPath);
    }

    const fullPath = `${currentDir}/${href}`;
    return this.normalizePath(fullPath);
  }

  private normalizePath(path: string): string {
    // Split the path into parts and resolve . and .. components
    const parts = path.split('/').filter(part => part !== '');
    const resolved: string[] = [];
    
    for (const part of parts) {
      if (part === '.') {
        // Skip current directory references
        continue;
      } else if (part === '..') {
        // Go up one directory
        if (resolved.length > 0) {
          resolved.pop();
        }
      } else {
        resolved.push(part);
      }
    }
    
    return resolved.join('/');
  }

  updateContext(newContext: Partial<LinkResolutionContext>): void {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Debug method to see all mapped paths (useful for testing)
   */
  getMappedPaths(): string[] {
    return Array.from(this.sectionMap.keys()).filter(key => key !== '' && !key.includes('#'));
  }

  /**
   * Debug method to see all mapped URLs
   */
  getMappedUrls(): { [url: string]: string } {
    const urlMap: { [url: string]: string } = {};
    for (const [key, section] of this.sectionMap.entries()) {
      if (key.startsWith('http') || key.includes('/')) {
        urlMap[key] = section.id;
      }
    }
    return urlMap;
  }

  /**
   * Debug method to test link resolution
   */
  testLink(href: string): { resolved: ParsedLink; section?: DocSection } {
    const resolved = this.resolveLink(href);
    let section: DocSection | undefined;
    
    if (resolved.linkType === 'internal-doc' && resolved.resolvedHref.startsWith('#')) {
      const sectionId = resolved.resolvedHref.slice(1);
      section = this.sectionMap.get(sectionId);
    }
    
    return { resolved, section };
  }
}

export function getRepoInfoFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'raw.githubusercontent.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 3) {
        const [owner, repo, branch = DEFAULT_LINK_CONTEXT.branch] = parts;
        return {
          owner,
          repo,
          branch,
          baseGitHubUrl: `https://github.com/${owner}/${repo}`
        };
      }
    }

    if (parsed.hostname === 'github.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.length >= 4 && (parts[2] === 'blob' || parts[2] === 'tree')) {
        const [owner, repo, , branch = DEFAULT_LINK_CONTEXT.branch] = parts;
        return {
          owner,
          repo,
          branch,
          baseGitHubUrl: `https://github.com/${owner}/${repo}`
        };
      }
    }
  } catch {
    // Fall through to null
  }

  return null;
}

/**
 * Utility functions
 */
export const findSectionById = (sectionId: string, sections: DocSection[]): DocSection | undefined => {
  const searchRecursive = (sections: DocSection[]): DocSection | undefined => {
    for (const section of sections) {
      if (section.id === sectionId) return section;
      if (section.children) {
        const found = searchRecursive(section.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  
  return searchRecursive(sections);
};

export const getAllValidSectionIds = (sections: DocSection[]): string[] => {
  const ids: string[] = [];
  
  const addIds = (section: DocSection) => {
    ids.push(section.id);
    if (section.children) {
      section.children.forEach(child => {
        addIds(child); // Recursive to handle nested children
      });
    }
  };
  
  sections.forEach(addIds);
  return ids;
};
