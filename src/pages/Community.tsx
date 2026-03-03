import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { FeedFilters } from '@/components/community/FeedFilters';
import { FeedCard } from '@/components/community/FeedCard';
import { PostComposer } from '@/components/community/PostComposer';
import { PostDetail } from '@/components/community/PostDetail';
import { useCommunityFeed, CommunityPost } from '@/hooks/useCommunityFeed';
import { useAuth } from '@/contexts/AuthContext';

const Community = () => {
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const { user } = useAuth();
  const { 
    posts, 
    loading, 
    error, 
    filter, 
    setFilter, 
    createPost, 
    toggleLike, 
    deletePost 
  } = useCommunityFeed();

  const handlePostClick = (post: CommunityPost) => {
    setSelectedPost(post);
  };

  const handleBack = () => {
    setSelectedPost(null);
  };

  // Show post detail view
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>{selectedPost.title} | Baby Food Safety Community | FoodFactScanner®</title>
        </Helmet>
        <PostDetail 
          post={selectedPost} 
          onBack={handleBack} 
          onLike={toggleLike}
        />
      </div>
    );
  }

  return (
    <AppLayout className="bg-background" containerClassName="max-w-2xl space-y-6">
      <Helmet>
        <title>Baby Food Safety Community | Share Warnings & Tips | FoodFactScanner®</title>
        <meta name="description" content="Join the FoodFactScanner® community. Share baby food safety warnings, toxic ingredient alerts, FDA recall tips, and experiences with other parents protecting their children." />
        <meta name="keywords" content="baby food safety community, baby food warnings, toxic baby food alerts, parent baby food tips, FDA recall community" />
        <link rel="canonical" href="https://foodfactscanner.com/community" />
        <meta property="og:url" content="https://foodfactscanner.com/community" />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Hero Section */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Community Feed</h1>
        </div>
        <p className="text-muted-foreground">
          Share warnings, tips, and experiences about food products
        </p>
      </div>

      {/* Create Post Button */}
      {user && !showComposer && (
        <Button
          onClick={() => setShowComposer(true)}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Share with the community
        </Button>
      )}

      {/* Post Composer */}
      {showComposer && (
        <PostComposer
          onSubmit={createPost}
          onCancel={() => setShowComposer(false)}
        />
      )}

      {/* Filters */}
      <FeedFilters activeFilter={filter} onFilterChange={setFilter} />

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading posts: {error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Users className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-foreground">No posts yet</h3>
            <p className="text-muted-foreground text-sm">
              Be the first to share your experience!
            </p>
          </div>
          {user && !showComposer && (
            <Button onClick={() => setShowComposer(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              onLike={toggleLike}
              onDelete={deletePost}
              onClick={handlePostClick}
            />
          ))}
        </div>
      )}

      {/* Sign in prompt */}
      {!user && (
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
          <h3 className="font-semibold text-foreground">Join the conversation</h3>
          <p className="text-sm text-muted-foreground">
            Sign in to share warnings, comment on posts, and connect with other parents
          </p>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      )}
    </AppLayout>
  );
};

export default Community;
