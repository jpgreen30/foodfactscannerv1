import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Tag, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlogSEO } from "@/blog/components/BlogSEO";
import { BlogHeader } from "@/blog/components/BlogHeader";
import { formatDate } from "@/blog/types";
import { getPostsByTag } from "@/blog/content/posts";
import { Calendar, Clock } from "lucide-react";

function TagCard({ post }: { post: ReturnType<typeof getPostsByTag>[0] }) {
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
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium uppercase text-xs tracking-wide">
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

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = tag ? decodeURIComponent(tag) : "";
  const posts = decodedTag ? getPostsByTag(decodedTag) : [];

  if (posts.length === 0) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <BlogSEO 
        title={`${decodedTag} | Baby Food Safety Blog`}
        description={`Articles about ${decodedTag} — expert guides on baby food safety, recalls, and toxic ingredients.`}
        canonicalUrl={`https://foodfactscanner.com/blog/tag/${encodeURIComponent(decodedTag)}`}
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
              
              <div className="flex items-center gap-3 mb-4">
                <Tag className="w-8 h-8 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {decodedTag}
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Articles tagged with "{decodedTag}" — expert guides on baby food safety, recalls, and keeping your little one healthy.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                {posts.length} article{posts.length !== 1 ? 's' : ''} tagged
              </p>
            </motion.div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <TagCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
            Worried About {decodedTag}?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Scan any baby food product and instantly see if it contains {decodedTag} or other harmful ingredients.
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
