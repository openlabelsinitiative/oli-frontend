import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import gfm from 'remark-gfm';
import readingTime from 'reading-time';

// Types for blog post data
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  authorSocial?: {
    twitter?: string;
    discord?: string;
    farcaster?: string;
    telegram?: string;
    website?: string;
  };
  tags: string[];
  featured: boolean;
  readingTime: number;
  content: string;
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export type BlogPostMeta = Omit<BlogPost, 'content'>;

// Directory paths
const BLOG_DIRECTORY = path.join(process.cwd(), 'Content/blog');

// Get all blog post slugs
export function getBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    console.log('Blog directory not found:', BLOG_DIRECTORY);
    return [];
  }
  
  const fileNames = fs.readdirSync(BLOG_DIRECTORY);
  return fileNames
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''));
}

// Get blog post metadata only (for listing pages)
export function getBlogPostMeta(slug: string): BlogPostMeta | null {
  try {
    const fullPath = path.join(BLOG_DIRECTORY, `${slug}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Calculate reading time from content
    const readingTimeResult = readingTime(content);

    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      date: data.date || '',
      author: data.author || 'Anonymous',
      authorSocial: data.authorSocial || {},
      tags: data.tags || [],
      featured: data.featured || false,
      readingTime: data.readingTime || Math.ceil(readingTimeResult.minutes),
      seo: data.seo || {
        title: data.title,
        description: data.excerpt,
        keywords: data.tags
      }
    };
  } catch (error) {
    console.error(`Error reading blog post metadata for ${slug}:`, error);
    return null;
  }
}

// Get full blog post with content
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(BLOG_DIRECTORY, `${slug}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Process markdown content to HTML
    const processedContent = await remark()
      .use(gfm) // GitHub Flavored Markdown
      .use(html, { sanitize: false })
      .process(content);

    const contentHtml = processedContent.toString();

    // Calculate reading time
    const readingTimeResult = readingTime(content);

    return {
      slug,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      date: data.date || '',
      author: data.author || 'Anonymous',
      authorSocial: data.authorSocial || {},
      tags: data.tags || [],
      featured: data.featured || false,
      readingTime: data.readingTime || Math.ceil(readingTimeResult.minutes),
      content: contentHtml,
      seo: data.seo || {
        title: data.title,
        description: data.excerpt,
        keywords: data.tags
      }
    };
  } catch (error) {
    console.error(`Error reading blog post for ${slug}:`, error);
    return null;
  }
}

// Get all blog posts metadata (sorted by date, most recent first)
export function getAllBlogPosts(): BlogPostMeta[] {
  const slugs = getBlogSlugs();
  
  const posts = slugs
    .map((slug) => getBlogPostMeta(slug))
    .filter((post): post is BlogPostMeta => post !== null)
    .sort((a, b) => {
      // Sort by date descending (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return posts;
}

// Get featured blog posts
export function getFeaturedBlogPosts(): BlogPostMeta[] {
  return getAllBlogPosts().filter(post => post.featured);
}

// Get blog posts by tag
export function getBlogPostsByTag(tag: string): BlogPostMeta[] {
  return getAllBlogPosts().filter(post => 
    post.tags.some(postTag => 
      postTag.toLowerCase() === tag.toLowerCase()
    )
  );
}

// Get related blog posts (same tags, excluding current post)
export function getRelatedBlogPosts(currentSlug: string, limit: number = 3): BlogPostMeta[] {
  const currentPost = getBlogPostMeta(currentSlug);
  if (!currentPost) return [];

  const allPosts = getAllBlogPosts();
  
  // Calculate relevance score based on shared tags
  const postsWithScore = allPosts
    .filter(post => post.slug !== currentSlug)
    .map(post => {
      const sharedTags = post.tags.filter(tag => 
        currentPost.tags.some(currentTag => 
          currentTag.toLowerCase() === tag.toLowerCase()
        )
      );
      return {
        post,
        score: sharedTags.length
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return postsWithScore.map(item => item.post);
}

// Get all unique tags across all posts
export function getAllTags(): string[] {
  const allPosts = getAllBlogPosts();
  const tagsSet = new Set<string>();
  
  allPosts.forEach(post => {
    post.tags.forEach(tag => tagsSet.add(tag));
  });

  return Array.from(tagsSet).sort();
}

// Search blog posts by title, excerpt, or tags
export function searchBlogPosts(query: string): BlogPostMeta[] {
  const searchTerm = query.toLowerCase();
  
  return getAllBlogPosts().filter(post => {
    return (
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  });
}

// Generate blog post URL
export function getBlogPostUrl(slug: string): string {
  return `/blog/${slug}`;
}

// Generate tag URL
export function getTagUrl(tag: string): string {
  return `/blog/tag/${encodeURIComponent(tag.toLowerCase())}`;
}

// Generate structured data for a blog post (JSON-LD)
export function generateBlogPostStructuredData(post: BlogPost, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `${baseUrl}/og-image.png`, // Default OG image
    datePublished: post.date,
    dateModified: post.date, // Could be enhanced with lastModified
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Open Labels Initiative',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/oli-logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${getBlogPostUrl(post.slug)}`,
    },
    keywords: post.seo.keywords?.join(', ') || post.tags.join(', '),
  };
}

// Generate RSS feed data
export function generateRSSFeed(): string {
  const posts = getAllBlogPosts().slice(0, 20); // Latest 20 posts
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://openlabelsinitiative.org';

  const rssItems = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <link>${baseUrl}${getBlogPostUrl(post.slug)}</link>
      <guid>${baseUrl}${getBlogPostUrl(post.slug)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${post.author}</author>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('')}
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Open Labels Initiative Blog</title>
    <description>Latest updates and insights from the Open Labels Initiative</description>
    <link>${baseUrl}/blog</link>
    <atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;
}

// Pagination utilities
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPosts: number;
}

export function paginateBlogPosts(
  posts: BlogPostMeta[],
  page: number = 1,
  postsPerPage: number = 10
): { posts: BlogPostMeta[]; pagination: PaginationInfo } {
  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = posts.slice(startIndex, endIndex);

  return {
    posts: paginatedPosts,
    pagination: {
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      totalPosts
    }
  };
}
