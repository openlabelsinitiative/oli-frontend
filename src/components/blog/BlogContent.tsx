'use client';

import { useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Clock, User, Calendar, ArrowLeft, Share2, Copy, Check, Twitter, Linkedin } from 'lucide-react';
import { useState } from 'react';
import { BlogPost } from '@/lib/blog';
import AuthorSocialLinks from './AuthorSocialLinks';

interface BlogContentProps {
  post: BlogPost;
}

export default function BlogContent({ post }: BlogContentProps) {
  const [copied, setCopied] = useState(false);
  // Add syntax highlighting and other enhancements
  useEffect(() => {
    // Add copy buttons to code blocks
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      const pre = block.parentElement;
      if (pre && !pre.querySelector('.copy-button')) {
        const button = document.createElement('button');
        button.className = 'copy-button absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white text-xs transition-colors shadow-lg';
        button.innerHTML = 'Copy';
        button.onclick = () => {
          navigator.clipboard.writeText(block.textContent || '');
          button.innerHTML = 'Copied!';
          setTimeout(() => {
            button.innerHTML = 'Copy';
          }, 2000);
        };
        
        pre.classList.add('relative');
        pre.appendChild(button);
      }
    });

    // Replace regular images with zoom functionality
    const images = document.querySelectorAll('.prose img');
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement;
      if (imgElement.src && !imgElement.classList.contains('image-zoom-processed')) {
        imgElement.classList.add('image-zoom-processed');
        
        // Create a wrapper for the zoom functionality
        const wrapper = document.createElement('div');
        wrapper.className = 'image-zoom-wrapper my-8';
        imgElement.parentNode?.insertBefore(wrapper, imgElement);
        wrapper.appendChild(imgElement);
        
        // Add zoom functionality
        let isMouseDown = false;
        
        wrapper.addEventListener('mousedown', (e) => {
          isMouseDown = true;
          imgElement.style.transform = 'scale(1.5)';
          imgElement.style.cursor = 'zoom-out';
          updateZoomPosition(e);
        });
        
        wrapper.addEventListener('mouseup', () => {
          isMouseDown = false;
          imgElement.style.transform = 'scale(1)';
          imgElement.style.cursor = 'zoom-in';
        });
        
        wrapper.addEventListener('mousemove', (e) => {
          if (isMouseDown) {
            updateZoomPosition(e);
          }
        });
        
        wrapper.addEventListener('mouseleave', () => {
          isMouseDown = false;
          imgElement.style.transform = 'scale(1)';
          imgElement.style.cursor = 'zoom-in';
        });
        
        const updateZoomPosition = (e: MouseEvent) => {
          const rect = wrapper.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          imgElement.style.transformOrigin = `${x}% ${y}%`;
        };
      }
    });
  }, [post.content]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: url,
        });
      } catch {
        // Fallback to copy URL
        copyUrl();
      }
    } else {
      copyUrl();
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Back to blog link */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/blog"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to blog
          </Link>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article header */}
        <header className="mb-12">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag.toLowerCase())}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl">
            {post.excerpt}
          </p>

          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8 p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium">{post.author}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <time dateTime={post.date} className="font-medium">
                {format(new Date(post.date), 'MMMM d, yyyy')}
              </time>
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span>{post.readingTime} min read</span>
            </div>
          </div>

          {/* Share button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Link copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share article
                </>
              )}
            </button>
          </div>
        </header>

        {/* Article content */}
        <div 
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-pre:relative prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-lg prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-gray-800 prose-code:font-mono prose-code:text-sm prose-img:rounded-xl prose-img:shadow-lg prose-img:cursor-zoom-in prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl prose-strong:text-gray-900 prose-strong:font-semibold"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Article footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col gap-6 p-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl">
            {/* Author info and social links */}
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Written by {post.author}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Published on {format(new Date(post.date), 'MMMM d, yyyy')}
                </p>
                <AuthorSocialLinks authorSocial={post.authorSocial} />
              </div>
            </div>
            
            {/* Share buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Share:</span>
              <button
                onClick={() => {
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              
              <button
                onClick={copyUrl}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title="Copy link"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
