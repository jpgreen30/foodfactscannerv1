// Blog post type definitions
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  authorTitle?: string;
  category: string;
  tags: string[];
  featured?: boolean;
  image?: string;
  readingTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
  description: string;
  postCount: number;
}

// Categories for baby food safety blog
export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    name: "FDA Recalls",
    slug: "fda-recalls",
    description: "Breaking news on baby food recalls and safety alerts from the FDA",
    postCount: 0
  },
  {
    name: "Toxic Ingredients",
    slug: "toxic-ingredients",
    description: "Deep dives into harmful chemicals and additives found in baby food",
    postCount: 0
  },
  {
    name: "Safe Alternatives",
    slug: "safe-alternatives",
    description: "Curated lists of clean, organic baby foods that pass our safety tests",
    postCount: 0
  },
  {
    name: "Parenting Tips",
    slug: "parenting-tips",
    description: "Expert advice on feeding your baby safely and confidently",
    postCount: 0
  },
  {
    name: "Heavy Metals",
    slug: "heavy-metals",
    description: "Research and findings on arsenic, lead, cadmium, and mercury in baby food",
    postCount: 0
  }
];

// Helper to calculate reading time
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Helper to format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate structured data for SEO
export function generateArticleSchema(post: BlogPost): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.image || "https://foodfactscanner.com/og-image.jpg",
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Person",
      "name": post.author,
      "jobTitle": post.authorTitle || "Baby Food Safety Expert"
    },
    "publisher": {
      "@type": "Organization",
      "name": "FoodFactScanner",
      "logo": {
        "@type": "ImageObject",
        "url": "https://foodfactscanner.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://foodfactscanner.com/blog/${post.slug}`
    }
  };
}

// Get related posts by category
export function getRelatedPosts(posts: BlogPost[], currentSlug: string, limit = 3): BlogPost[] {
  const current = posts.find(p => p.slug === currentSlug);
  if (!current) return posts.slice(0, limit);
  return posts
    .filter(p => p.slug !== currentSlug && p.category === current.category)
    .slice(0, limit);
}

// Generate breadcrumb schema
export function generateBreadcrumbSchema(post?: BlogPost): Record<string, unknown> {
  const items = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://foodfactscanner.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://foodfactscanner.com/blog"
    }
  ];

  if (post) {
    items.push({
      "@type": "ListItem",
      "position": 3,
      "name": post.title,
      "item": `https://foodfactscanner.com/blog/${post.slug}`
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items
  };
}
