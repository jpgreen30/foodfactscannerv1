import { Helmet } from "react-helmet-async";
import { BlogPost, generateArticleSchema, generateBreadcrumbSchema } from "@/blog/types";

interface BlogSEOProps {
  post?: BlogPost;
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  isBlogIndex?: boolean;
}

export function BlogSEO({ 
  post, 
  title, 
  description, 
  canonicalUrl,
  ogImage = "https://foodfactscanner.com/og-image.jpg",
  isBlogIndex = false 
}: BlogSEOProps) {
  const siteUrl = "https://foodfactscanner.com";
  
  // Use post data if provided, otherwise use overrides
  const pageTitle = post?.metaTitle || post?.title || title || "Baby Food Safety Blog | FoodFactScanner®";
  const pageDescription = post?.metaDescription || post?.excerpt || description || 
    "Expert articles on baby food safety, FDA recalls, toxic ingredients, heavy metals in baby food, and safe baby food brands. Keep your baby safe with FoodFactScanner® — the #1 baby food safety scanner.";
  const pageUrl = post 
    ? `${siteUrl}/blog/${post.slug}` 
    : canonicalUrl || `${siteUrl}/blog`;
  const pageImage = post?.image ? `${siteUrl}${post.image}` : ogImage;
  
  // Generate structured data
  const structuredData = post 
    ? [
        generateArticleSchema(post),
        generateBreadcrumbSchema(post)
      ]
    : [generateBreadcrumbSchema()];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={post?.tags?.join(", ") || "baby food safety, toxic ingredients baby food, heavy metals baby food, FDA baby food recall, safe baby food brands, baby food scanner"} />
      <link rel="canonical" href={pageUrl} />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={isBlogIndex ? "website" : "article"} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content="FoodFactScanner" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={pageImage} />
      
      {/* Article Specific (if blog post) */}
      {post && (
        <>
          <meta property="article:published_time" content={post.date} />
          <meta property="article:author" content={post.author} />
          <meta property="article:section" content={post.category} />
          {post.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
}

// RSS Feed Generator
export function generateRSSFeed(posts: BlogPost[]): string {
  const siteUrl = "https://foodfactscanner.com";
  
  const rssItems = posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${post.author}</author>
      <category>${post.category}</category>
      <description>${escapeXml(post.excerpt)}</description>
    </item>
  `).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FoodFactScanner Blog - Baby Food Safety</title>
    <link>${siteUrl}/blog</link>
    <description>Expert articles on baby food safety, FDA recalls, toxic ingredients, and heavy metals.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
}

// Sitemap Generator
export function generateSitemap(posts: BlogPost[]): string {
  const siteUrl = "https://foodfactscanner.com";
  const today = new Date().toISOString().split("T")[0];
  
  const staticUrls = [
    { url: "", priority: "1.0" },
    { url: "/blog", priority: "0.9" },
    { url: "/scanner", priority: "0.9" },
    { url: "/subscription", priority: "0.8" },
  ];
  
  const postUrls = posts.map(post => ({
    url: `/blog/${post.slug}`,
    priority: post.featured ? "0.8" : "0.6",
    lastmod: post.date
  }));
  
  const allUrls: { url: string; priority: string; lastmod?: string }[] = [...staticUrls, ...postUrls];
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls.map(({ url, priority, lastmod }) => `
  <url>
    <loc>${siteUrl}${url}</loc>
    <lastmod>${lastmod || today}</lastmod>
    <priority>${priority}</priority>
  </url>
  `).join("")}
</urlset>`;
}

// Helper to escape XML
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
