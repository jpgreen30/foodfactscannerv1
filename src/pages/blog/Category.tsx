import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogSEO } from "@/blog/components/BlogSEO";
import { BlogHeader } from "@/blog/components/BlogHeader";
import { BLOG_CATEGORIES, formatDate, BlogCategory } from "@/blog/types";
import { getPostsByCategory } from "@/blog/content/posts";
import { Calendar, Clock } from "lucide-react";

function CategoryCard({ post }: { post: ReturnType<typeof getPostsByCategory>[0] }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all"
    >
      <Link to={`/blog/${post.slug}`}>
        <div className="bg-muted h-48 flex items-center justify-center">
          <div className="text-muted-foreground text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
          </div>
        </div>
      </Link>
      
      <div className="p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.readingTime} min read
          </span>
        </div>
        
        <h2 className="text-xl font-bold text-foreground mb-3 hover:text-primary transition-colors">
          <Link to={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>
        
        <p className="text-muted-foreground mb-4">
          {post.excerpt}
        </p>
        
        <Link to={`/blog/${post.slug}`}>
          <Button variant="outline" size="sm">
            Read Article →
          </Button>
        </Link>
      </div>
    </motion.article>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  
  const category = BLOG_CATEGORIES.find(c => c.slug === slug);
  const posts = slug ? getPostsByCategory(slug) : [];

  if (!category || posts.length === 0) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <BlogSEO 
        title={`${category.name} | Baby Food Safety Blog`}
        description={category.description}
        canonicalUrl={`https://foodfactscanner.com/blog/category/${slug}`}
      />
      
      <div className="min-h-screen bg-background">
        <BlogHeader />
        {/* Header */}
        <section className="bg-gradient-to-br from-primary/5 via-accent/5 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link to="/blog">
                <Button variant="ghost" className="gap-2 mb-6 -ml-4">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Button>
              </Link>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 capitalize">
                {category.name.replace(/-/g, " ")}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                {category.description}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                {posts.length} article{posts.length !== 1 ? 's' : ''} in this category
              </p>
            </motion.div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <CategoryCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Want Real-Time Food Safety Alerts?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Get notified instantly when baby food is recalled or found to contain toxic ingredients.
            </p>
            <Button size="lg" asChild>
              <Link to="/scanner">Scan Your Baby's Food Free →</Link>
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
