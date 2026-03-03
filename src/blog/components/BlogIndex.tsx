import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogPost, formatDate, BLOG_CATEGORIES, BlogCategory } from "@/blog/types";
import { BlogHeader } from "./BlogHeader";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all ${
        featured ? "md:col-span-2 md:grid md:grid-cols-2 md:gap-6" : ""
      }`}
    >
      <div className={`bg-muted overflow-hidden ${featured ? "md:h-full h-48" : "h-48"}`}>
        {post.image ? (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            {post.category.replace(/-/g, " ")}
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium uppercase tracking-wide">
            {post.category.replace(/-/g, " ")}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readingTime} min read
          </span>
        </div>
        
        <h2 className={`font-bold text-foreground group-hover:text-primary transition-colors mb-3 ${
          featured ? "text-2xl md:text-3xl" : "text-xl"
        }`}>
          <Link to={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        
        <p className="text-muted-foreground mb-4 flex-grow">
          {post.excerpt}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
          
          <Link to={`/blog/${post.slug}`}>
            <Button variant="ghost" size="sm" className="gap-1 group/btn">
              Read More
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

interface CategoryCardProps {
  category: BlogCategory;
}

function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link to={`/blog/category/${category.slug}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
      >
        <h3 className="font-semibold text-foreground capitalize mb-1">
          {category.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {category.description}
        </p>
      </motion.div>
    </Link>
  );
}

interface BlogIndexProps {
  posts: BlogPost[];
  featuredPosts: BlogPost[];
}

export function BlogIndex({ posts, featuredPosts }: BlogIndexProps) {
  const regularPosts = posts.filter(p => !p.featured);
  
  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-background py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Baby Food Safety Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Expert articles on FDA recalls, toxic ingredients, heavy metals, and how to keep your baby safe.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-semibold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {BLOG_CATEGORIES.map(category => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full" />
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map(post => (
                <BlogCard key={post.slug} post={post} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <span className="w-2 h-8 bg-accent rounded-full" />
            Latest Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Get Recall Alerts First
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">
              FDA recalls happen without warning. Join 12,000+ parents who get instant alerts when baby food is recalled.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background"
              />
              <Button size="lg" className="gap-2">
                Get Alerts Free
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              No spam. Unsubscribe anytime. We protect your email like we protect babies.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
