import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, AlertTriangle, Lightbulb, HelpCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { CommunityPost } from '@/hooks/useCommunityFeed';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FeedCardProps {
  post: CommunityPost;
  onLike: (postId: string) => Promise<boolean>;
  onDelete: (postId: string) => Promise<boolean>;
  onClick: (post: CommunityPost) => void;
}

const postTypeConfig = {
  warning: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  tip: { icon: Lightbulb, color: 'text-primary', bg: 'bg-primary/20' },
  question: { icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  experience: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

export const FeedCard = ({ post, onLike, onDelete, onClick }: FeedCardProps) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const isAuthor = user?.id === post.user_id;
  const typeConfig = postTypeConfig[post.post_type] || postTypeConfig.experience;
  const TypeIcon = typeConfig.icon;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    await onLike(post.id);
    setIsLiking(false);
  };

  const handleDelete = async () => {
    await onDelete(post.id);
    setShowDeleteDialog(false);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: post.title,
        text: post.content.substring(0, 100),
        url: window.location.origin + `/community?post=${post.id}`,
      });
    } catch {
      navigator.clipboard.writeText(window.location.origin + `/community?post=${post.id}`);
      toast({ title: 'Link copied!' });
    }
  };

  const authorName = post.author?.display_name || post.author?.first_name || 'Anonymous';
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <>
      <div
        onClick={() => onClick(post)}
        className="bg-card border border-border rounded-xl p-4 space-y-3 cursor-pointer hover:border-primary/30 transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-primary/20 text-primary">
                {authorInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground text-sm">{authorName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full', typeConfig.bg)}>
              <TypeIcon className={cn('w-3 h-3', typeConfig.color)} />
              <span className={cn('text-xs capitalize', typeConfig.color)}>{post.post_type}</span>
            </div>
            {isAuthor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Product Tag */}
        {post.product_name && (
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">Product:</span>
            <span className="text-sm font-medium text-foreground">{post.product_name}</span>
            {post.health_score !== null && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full ml-auto',
                post.health_score >= 70 ? 'bg-green-500/20 text-green-400' :
                post.health_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              )}>
                {post.health_score}/100
              </span>
            )}
          </div>
        )}

        {/* Title & Content */}
        <div>
          <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              post.is_liked ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'
            )}
          >
            <Heart className={cn('w-4 h-4', post.is_liked && 'fill-current')} />
            {post.like_count}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(post);
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {post.comment_count}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
