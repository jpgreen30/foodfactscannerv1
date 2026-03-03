# FoodFactScanner Blog Setup

## SEO-Optimized Static Blog

This is a static Markdown blog built into your Vite + React app. No backend required, fully SEO-friendly.

## Features

✅ **Server-Side SEO Ready**
- Dynamic meta tags (title, description, OG images)
- Structured data (JSON-LD) for articles
- Canonical URLs
- Breadcrumb schema

✅ **Content**
- 5 launch articles targeting high-value keywords
- FDA recall news (fresh, time-sensitive content)
- Heavy metals deep-dive (evergreen, high search volume)
- Toxic ingredients guide (lead magnet content)
- Safe brands ranking (buyer intent keywords)
- Homemade recipes (DIY/parenting keywords)

✅ **Technical**
- Static JSON-LD structured data
- Open Graph tags for social sharing
- RSS feed generator
- Sitemap generator
- Related posts
- Category/tag system

## Adding New Posts

1. Edit `src/blog/content/posts.ts`
2. Add new post object to `BLOG_POSTS` array
3. Follow existing format:

```typescript
{
  slug: "your-post-url",
  title: "SEO-Optimized Title",
  excerpt: "Compelling meta description (155 chars)",
  content: `Markdown content...`,
  date: "2025-01-20",
  author: "Dr. Sarah Mitchell",
  authorTitle: "Pediatric Nutritionist",
  category: "fda-recalls",
  tags: ["tag1", "tag2"],
  featured: false,
  metaTitle: "SEO Title (60 chars)",
  metaDescription: "SEO Description (155 chars)"
}
```

## Categories

- `fda-recalls` — Breaking news on FDA recalls
- `toxic-ingredients` — Ingredient deep-dives
- `safe-alternatives` — Safe brand recommendations
- `parenting-tips` — General feeding advice
- `heavy-metals` — Heavy metal research

## URLs

- Blog index: `/blog`
- Individual post: `/blog/{slug}`

## Next Steps for Full SEO

1. **Add blog link to main navigation**
   - Add "Blog" link in your header/footer

2. **Create blog images**
   - Add featured images to `/public/blog/`
   - Update image paths in posts

3. **Generate RSS & Sitemap**
   - Uncomment generator code
   - Add build step to output `/public/rss.xml` and `/public/sitemap.xml`

4. **Google Search Console**
   - Submit sitemap
   - Request indexing for new posts

5. **Content Strategy**
   - Publish 2-3 posts per week
   - Target: FDA recalls (fast), evergreen guides (slow)
   - Cross-post to Medium/LinkedIn with canonical links

## Content Ideas (Next 10 Posts)

1. "Gerber vs Beech-Nut: Which Is Safer?" (comparison keyword)
2. "Rice Cereal Alternatives Without Arsenic" (solution keyword)
3. "Lead in Baby Food: What the 2021 Report Revealed" (research keyword)
4. "Organic Baby Food vs Conventional: Is It Worth It?" (buying intent)
5. "Baby Food Pouches vs Jars: Safety Comparison" (comparison)
6. "How to Read a Baby Food Label (Step-by-Step)" (tutorial)
7. "Hidden Sugar in 'Healthy' Baby Foods" (shocking/viral)
8. "Top 5 Baby Food Brands to Avoid in 2025" (negative keyword)
9. "Making Baby Food in a Blender: 5 Minute Recipes" (DIY)
10. "FDA Closer to Zero: Will Baby Food Actually Get Safer?" (news)

## SEO Keywords Targeted

Primary:
- baby food recall 2025
- heavy metals in baby food
- toxic ingredients baby food
- safest baby food brands
- arsenic in baby food
- lead in baby food

Long-tail:
- is [brand] baby food safe
- how to avoid arsenic in baby food
- best organic baby food without heavy metals
- baby food without rice
- homemade baby food recipes 6 months

---

Blog is ready to drive organic traffic! 🚀
