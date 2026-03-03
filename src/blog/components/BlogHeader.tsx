import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" title="Go to Home">
          <Logo size="sm" />
        </Link>
        <Link
          to="/blog"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Blog
        </Link>
      </div>
    </header>
  );
}
