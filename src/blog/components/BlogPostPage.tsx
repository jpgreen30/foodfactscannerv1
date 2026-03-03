import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Share2, Facebook, Twitter, Linkedin, Mail, Link2, Tag, User, Download } from "lucide-react";
import { BlogHeader } from "./BlogHeader";
import { Button } from "@/components/ui/button";
import { BlogPost, formatDate, getRelatedPosts } from "@/blog/types";
import { BLOG_POSTS } from "@/blog/content/posts";
import { useToast } from "@/hooks/use-toast";
import { LeadMagnetModal } from "@/components/LeadMagnetModal";
import { useState } from "react";

interface BlogPostPageProps {
  post: BlogPost;
}

const PDF_URL = `https://vzwbngmfqhurlcienera.supabase.co/functions/v1/generate-cheat-sheet-pdf`;

// Lead magnet configurations
const LEAD_MAGNETS: Record<string, { title: string; description: string; fileName: string; downloadUrl?: string }> = {
  "15-toxic-ingredients": {
    title: "15 Toxic Ingredients Cheat Sheet",
    description: "Get our free printable guide showing the 15 most dangerous ingredients hiding in baby food labels. Keep it in your wallet for grocery shopping!",
    fileName: "15-toxic-ingredients-cheatsheet.pdf",
    downloadUrl: PDF_URL,
  },
  "homemade-recipes": {
    title: "50 Homemade Baby Food Recipes",
    description: "Get 50 easy, nutritious recipes for babies 4-12 months. Save $400+/year and eliminate toxic ingredient risks!",
    fileName: "50-homemade-baby-food-recipes.pdf",
  },
  "baby-food-safety-report": {
    title: "2025 Baby Food Safety Report",
    description: "Get our comprehensive report with heavy metal test results for 500+ baby food products. Know exactly which brands are safe.",
    fileName: "2025-baby-food-safety-report.pdf",
  },
};

// Simple markdown renderer for blog content
function renderMarkdown(
  content: string,
  onLeadMagnetClick: (key: string) => void
): JSX.Element {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for lead magnet marker
    if (trimmed.includes("[LEAD_MAGNET:") && trimmed.includes("]")) {
      const match = trimmed.match(/\[LEAD_MAGNET:(\w+)\]/);
      if (match) {
        const leadMagnetKey = match[1];
        const config = LEAD_MAGNETS[leadMagnetKey];
        if (config) {
          elements.push(
            <div key={key++} className="my-8 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-6 h-6 text-primary" />
                <h4 className="font-bold text-lg text-foreground">Download Your Free Cheat Sheet</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-5">
                <span className="flex items-center gap-1.5">✓ Wallet-sized PDF</span>
                <span className="flex items-center gap-1.5">✓ Quick reference guide</span>
                <span className="flex items-center gap-1.5">✓ Take it to the grocery store</span>
                <span className="flex items-center gap-1.5">✓ Share with other parents</span>
              </div>
              <Button
                size="lg"
                className="gap-2 w-full sm:w-auto"
                onClick={() => onLeadMagnetClick(leadMagnetKey)}
              >
                <Download className="w-4 h-4" />
                📥 Download: 15 Toxic Ingredients Cheat Sheet
              </Button>
            </div>
          );
          continue;
        }
      }
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={key++} className="text-3xl md:text-4xl font-bold text-foreground mt-8 mb-4">
          {trimmed.replace("# ", "")}
        </h1>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-2xl md:text-3xl font-bold text-foreground mt-8 mb-4">
          {trimmed.replace("## ", "")}
        </h2>
      );
    } else if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4 key={key++} className="text-lg md:text-xl font-semibold text-foreground mt-5 mb-2">
          {trimmed.replace("#### ", "")}
        </h4>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-xl md:text-2xl font-semibold text-foreground mt-6 mb-3">
          {trimmed.replace("### ", "")}
        </h3>
      );
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <p key={key++} className="font-semibold text-foreground mt-4 mb-2">
          {trimmed.replace(/\*\*/g, "")}
        </p>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        listItems.push(lines[i].trim().replace(/^[-*] /, "").replace(/\*\*/g, "**"));
        i++;
      }
      i--;
      
      elements.push(
        <ul key={key++} className="list-disc pl-6 space-y-2 my-4 text-foreground">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ 
              __html: item.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") 
            }} />
          ))}
        </ul>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^\d+/)?.[0];
      const text = trimmed.replace(/^\d+\.\s/, "").replace(/\*\*/g, "**");
      elements.push(
        <div key={key++} className="flex gap-3 my-3 text-foreground">
          <span className="font-bold text-primary min-w-[24px]">{num}.</span>
          <span dangerouslySetInnerHTML={{ 
            __html: text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") 
          }} />
        </div>
      );
    } else if (trimmed.startsWith("| ") && trimmed.includes(" | ")) {
      continue;
    } else if (trimmed.startsWith("---")) {
      elements.push(<hr key={key++} className="border-border my-8" />);
    } else if (trimmed.startsWith("[")) {
      const match = trimmed.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        const [_, text, url] = match;
        if (text.includes("→") || text.includes("Download")) {
          elements.push(
            <div key={key++} className="my-6">
              <Button size="lg" className="gap-2" asChild>
                <Link to={url}>
                  {text.replace("→", "").trim()}
                  <span>→</span>
                </Link>
              </Button>
            </div>
          );
        } else {
          elements.push(
            <p key={key++} className="my-2">
              <Link to={url} className="text-primary hover:underline">
                {text}
              </Link>
            </p>
          );
        }
      }
    } else if (trimmed === "") {
      continue;
    } else {
      const formatted = trimmed
        .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, "<code className='bg-muted px-1 rounded'>$1</code>");
      
      elements.push(
        <p key={key++} className="text-foreground leading-relaxed my-4" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
  }

  return <>{elements}</>;
}

function ShareButtons({ post }: { post: BlogPost }) {
  const { toast } = useToast();
  const shareUrl = `https://foodfactscanner.com/blog/${post.slug}`;
  const shareText = `${post.title} - FoodFactScanner`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied!", description: "Share it anywhere you like." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy the link.", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Share:</span>
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
      >
        <Facebook className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')}
      >
        <Twitter className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')}
      >
        <Linkedin className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        onClick={() => window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`, '_blank')}
      >
        <Mail className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        onClick={handleCopyLink}
      >
        <Link2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-12 pt-12 border-t border-border">
      <h3 className="text-xl font-bold mb-6">Related Articles</h3>
      <div className="grid md:grid-cols-3 gap-6">
        {posts.map(post => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
            <article className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all">
              <span className="text-xs text-primary font-medium uppercase">
                {post.category.replace(/-/g, " ")}
              </span>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mt-2 line-clamp-2">
                {post.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {post.excerpt}
              </p>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function BlogPostPage({ post }: BlogPostPageProps) {
  const relatedPosts = getRelatedPosts(BLOG_POSTS, post.slug);
  const [leadMagnetOpen, setLeadMagnetOpen] = useState(false);
  const [activeLeadMagnet, setActiveLeadMagnet] = useState<string | null>(null);

  const handleLeadMagnetClick = (key: string) => {
    setActiveLeadMagnet(key);
    setLeadMagnetOpen(true);
  };

  const leadMagnetConfig = activeLeadMagnet ? LEAD_MAGNETS[activeLeadMagnet] : null;

  return (
    <>
      <article className="min-h-screen bg-background">
        <BlogHeader />
        {/* Header */}
        <header className="bg-gradient-to-br from-primary/5 via-accent/5 to-background py-12 md:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
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

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium uppercase text-xs tracking-wide">
                  {post.category.replace(/-/g, " ")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readingTime} min read
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground">
                {post.excerpt}
              </p>

              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{post.author}</p>
                  <p className="text-sm text-muted-foreground">{post.authorTitle}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="container mx-auto px-4 max-w-4xl -mt-8">
          <div className="bg-muted rounded-xl h-64 md:h-96 overflow-hidden border border-border">
            {post.image ? (
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <p className="text-sm">{post.category.replace(/-/g, " ")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 max-w-4xl py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-lg max-w-none"
          >
            {renderMarkdown(post.content, handleLeadMagnetClick)}
          </motion.div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-border">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {post.tags.map(tag => (
              <Link key={tag} to={`/blog/tag/${encodeURIComponent(tag)}`}>
                <span className="text-sm bg-muted hover:bg-muted/80 px-3 py-1 rounded-full text-muted-foreground transition-colors">
                  {tag}
                </span>
              </Link>
            ))}
          </div>

          {/* Share */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <ShareButtons post={post} />
            <Button variant="outline" asChild>
              <Link to="/scanner">
                Scan Your Baby's Food →
              </Link>
            </Button>
          </div>

          {/* Related Posts */}
          <RelatedPosts posts={relatedPosts} />
        </div>

        {/* CTA Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Don't Just Read — Take Action
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Knowledge is power, but scanning is protection. See exactly what's in your baby's food in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/scanner">Scan Food Free →</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/subscription">Get Unlimited Scans</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>

      {/* Lead Magnet Modal */}
      {leadMagnetConfig && (
        <LeadMagnetModal
          isOpen={leadMagnetOpen}
          onClose={() => setLeadMagnetOpen(false)}
          title={leadMagnetConfig.title}
          description={leadMagnetConfig.description}
          fileName={leadMagnetConfig.fileName}
          downloadUrl={leadMagnetConfig.downloadUrl}
          source={activeLeadMagnet!}
        />
      )}
    </>
  );
}
