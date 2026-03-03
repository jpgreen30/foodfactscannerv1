import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CommentForm } from './CommentForm';
import { CommentCard } from './CommentCard';
import { useProductComments } from '@/hooks/useProductComments';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ProductCommentsProps {
  productBarcode: string;
  productName: string;
  defaultOpen?: boolean;
}

export function ProductComments({
  productBarcode,
  productName,
  defaultOpen = false,
}: ProductCommentsProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const {
    comments,
    loading,
    error,
    addComment,
    editComment,
    deleteComment,
    toggleLike,
    commentCount,
  } = useProductComments(productBarcode, productName);

  const handleAddComment = async (content: string) => {
    return await addComment(content);
  };

  const handleReply = async (content: string, parentId: string) => {
    return await addComment(content, parentId);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="font-medium">Community Comments</span>
            {commentCount > 0 && (
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {commentCount}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 space-y-4">
          {/* Add comment form */}
          {user ? (
            <CommentForm
              onSubmit={handleAddComment}
              placeholder="Share your experience with this product..."
            />
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Sign in to join the conversation
              </p>
              <Button asChild size="sm">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          )}

          {/* Comments list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{error}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-4">
                {comments.map(comment => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onEdit={editComment}
                    onDelete={deleteComment}
                    onToggleLike={toggleLike}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
