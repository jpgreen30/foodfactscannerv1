import { useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, AlertTriangle, Lightbulb, HelpCircle, MessageSquare, Send, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { usePostComments, PostComment } from '@/hooks/usePostComments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PostDetailProps {
  post: CommunityPost;
  onBack: () => void;
  onLike: (postId: string) => Promise<boolean>;
}

const postTypeConfig = {
  warning: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' },
  tip: { icon: Lightbulb, color: 'text-primary', bg: 'bg-primary/20' },
  question: { icon: HelpCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  experience: { icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

const CommentItem = ({ 
  comment, 
  onReply, 
  onDelete,
  depth = 0 
}: { 
  comment: PostComment; 
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => Promise<boolean>;
  depth?: number;
}) => {
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isAuthor = user?.id === comment.user_id;
  const authorName = comment.author?.display_name || comment.author?.first_name || 'Anonymous';

  return (
    <div className={cn('space-y-2', depth > 0 && 'ml-8 border-l-2 border-border pl-4')}>
      <div className="flex items-start gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="text-xs bg-muted">
            {authorName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
          <p className="text-sm text-foreground mt-1">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            {depth === 0 && user && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Reply
              </button>
            )}
            {isAuthor && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies.map((reply) => (
        <CommentItem 
          key={reply.id} 
          comment={reply} 
          onReply={onReply} 
          onDelete={onDelete}
          depth={depth + 1} 
        />
      ))}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(comment.id)} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const PostDetail = ({ post, onBack, onLike }: PostDetailProps) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { comments, loading: commentsLoading, addComment, deleteComment } = usePostComments(post.id);

  const typeConfig = postTypeConfig[post.post_type] || postTypeConfig.experience;
  const TypeIcon = typeConfig.icon;
  const authorName = post.author?.display_name || post.author?.first_name || 'Anonymous';

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onLike(post.id);
    setIsLiking(false);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post.title,
        text: post.content.substring(0, 100),
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!' });
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const success = await addComment(newComment, replyingTo);
    if (success) {
      setNewComment('');
      setReplyingTo(null);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="font-semibold text-foreground">Post</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Post Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/20 text-primary">
                  {authorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{authorName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                  <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full', typeConfig.bg)}>
                    <TypeIcon className={cn('w-3 h-3', typeConfig.color)} />
                    <span className={cn('text-xs capitalize', typeConfig.color)}>{post.post_type}</span>
                  </div>
                </div>
              </div>
            </div>

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

            <div>
              <h1 className="text-xl font-bold text-foreground mb-2">{post.title}</h1>
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 py-3 border-y border-border">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  post.is_liked ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'
                )}
              >
                <Heart className={cn('w-5 h-5', post.is_liked && 'fill-current')} />
                <span>{post.like_count}</span>
              </button>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comment_count}</span>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors ml-auto"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Comments</h3>
            
            {commentsLoading ? (
              <div className="text-center text-muted-foreground py-4">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">No comments yet. Be the first!</div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onReply={setReplyingTo}
                    onDelete={deleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Comment Input */}
      {user && (
        <div className="p-4 border-t border-border space-y-2">
          {replyingTo && (
            <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
              <span className="text-sm text-muted-foreground">Replying to comment</span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-xs text-primary hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
              rows={2}
              className="flex-1 resize-none bg-muted border-0"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="icon"
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
