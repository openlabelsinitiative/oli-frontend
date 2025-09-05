# Blog Content Guide

This guide explains how to create and format blog posts for the Open Labels Initiative blog.

## Front Matter Structure

Each blog post should start with YAML front matter that includes the following fields:

```yaml
---
title: "Your Blog Post Title"
excerpt: "A brief description of your post (1-2 sentences)"
date: "YYYY-MM-DD"
author: "Author Name"
authorSocial:
  twitter: "https://twitter.com/username"
  discord: "https://discord.gg/server"
  farcaster: "https://warpcast.com/username"
  telegram: "https://t.me/channel"
  website: "https://yourwebsite.com"
tags: ["tag1", "tag2", "tag3"]
featured: true/false
readingTime: 5
seo:
  title: "SEO Title (optional)"
  description: "SEO Description (optional)"
  keywords: ["keyword1", "keyword2"]
---
```

## Required Fields

- **title**: The main title of your blog post
- **excerpt**: A brief summary (1-2 sentences) that appears in blog listings
- **date**: Publication date in YYYY-MM-DD format
- **author**: The author's name as it should appear
- **tags**: Array of relevant tags for categorization

## Optional Fields

- **authorSocial**: Object containing social media links (all fields are optional)
  - **twitter**: Twitter/X profile URL
  - **discord**: Discord server invite link
  - **farcaster**: Farcaster profile URL
  - **telegram**: Telegram channel/group link
  - **website**: Personal or project website URL
- **featured**: Boolean to mark posts as featured (appears in featured section)
- **readingTime**: Estimated reading time in minutes
- **seo**: SEO metadata object
  - **title**: Custom SEO title (defaults to post title)
  - **description**: Custom SEO description (defaults to excerpt)
  - **keywords**: Array of SEO keywords

## Social Links Guidelines

The `authorSocial` field allows authors to share their social media presence. All fields are optional:

- **Twitter**: Use full profile URL (e.g., `https://twitter.com/username`)
- **Discord**: Use server invite link (e.g., `https://discord.gg/server`)
- **Farcaster**: Use Warpcast profile URL (e.g., `https://warpcast.com/username`)
- **Telegram**: Use channel/group link (e.g., `https://t.me/channel`)
- **Website**: Use full website URL (e.g., `https://yourwebsite.com`)

## Content Formatting

After the front matter, write your content in Markdown format. The blog supports:

- **Headers**: Use `#`, `##`, `###` for different heading levels
- **Bold text**: Use `**text**` or `__text__`
- **Italic text**: Use `*text*` or `_text_`
- **Links**: Use `[text](url)`
- **Images**: Use `![alt text](image-url)`
- **Code blocks**: Use triple backticks with language specification
- **Lists**: Use `-` or `*` for unordered lists, numbers for ordered lists
- **Blockquotes**: Use `>` for quoted text

## Example Blog Post

```markdown
---
title: "Example Blog Post"
excerpt: "This is an example blog post that demonstrates the proper format and structure."
date: "2025-01-20"
author: "John Doe"
authorSocial:
  twitter: "https://twitter.com/johndoe"
  discord: "https://discord.gg/example"
  website: "https://johndoe.com"
tags: ["example", "guide", "blogging"]
featured: false
readingTime: 3
seo:
  title: "Example Blog Post - OLI Blog"
  description: "Learn how to write blog posts for the Open Labels Initiative blog."
  keywords: ["blog", "guide", "example", "oli"]
---

# Example Blog Post

This is the main content of your blog post. You can use all standard Markdown formatting.

## Subsection

You can create subsections with different heading levels.

### Code Examples

```javascript
// Your code examples here
console.log("Hello, World!");
```

### Lists

- Item 1
- Item 2
- Item 3

### Links

You can link to [external resources](https://example.com) or internal pages.

---

*This concludes the example blog post.*
```

## Best Practices

1. **Write clear, engaging titles** that accurately describe the content
2. **Keep excerpts concise** but informative
3. **Use relevant tags** to help readers find your content
4. **Include social links** to help readers connect with you
5. **Use proper Markdown formatting** for better readability
6. **Include images** where appropriate to enhance the content
7. **Proofread your content** before publishing

## File Naming

Save your blog post files with a descriptive name in kebab-case format:
- `my-blog-post.md`
- `announcement-new-feature.md`
- `technical-deep-dive.md`

## Image Guidelines

When including images in your blog posts:

1. Place images in the `public/blog-images/` directory
2. Use descriptive filenames
3. Include alt text for accessibility
4. Optimize images for web (compress if needed)
5. Use relative paths: `/blog-images/filename.png`

## Need Help?

If you have questions about creating blog content, please reach out to the OLI team through our community channels.
