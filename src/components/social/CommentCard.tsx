import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Heart, Reply, Edit, Trash2, MoreHorizontal } from 'lucide-react';
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
import { CommentForm } from './CommentForm';
import { Comment } from '@/hooks/useProductComments';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface CommentCardProps {
  comment: Comment;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  onEdit: (commentId: string, content: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onToggleLike: (commentId: string) => Promise<boolean>;
  isReply?: boolean;
}

export function CommentCard({
  comment,
  onReply,
  onEdit,
  onDelete,
  onToggleLike,
  isReply = false,
}: CommentCardProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const isAuthor = user?.id === comment.user_id;
  const initials = comment.author_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await onToggleLike(comment.id);
    setIsLiking(false);
  };

  const handleReply = async (content: string) => {
    return await onReply(content, comment.id);
  };

  const handleEdit = async (content: string) => {
    const success = await onEdit(comment.id, content);
    if (success) setShowEditForm(false);
    return success;
  };

  const handleDelete = async () => {
    await onDelete(comment.id);
    setShowDeleteDialog(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'pl-4 ml-4 border-l-2 border-muted' : ''}`}
    >
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-muted-foreground italic">(edited)</span>
            )}
          </div>

          {showEditForm ? (
            <div className="mt-2">
              <CommentForm
                onSubmit={handleEdit}
                onCancel={() => setShowEditForm(false)}
                initialValue={comment.content}
                submitLabel="Save"
                placeholder="Edit your comment..."
              />
            </div>
          ) : (
            <p className="text-sm mt-1 break-words">{comment.content}</p>
          )}

          {!showEditForm && (
            <div className="flex items-center gap-1 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 gap-1 ${comment.is_liked ? 'text-red-500' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={`w-3.5 h-3.5 ${comment.is_liked ? 'fill-current' : ''}`} />
                <span className="text-xs">{comment.like_count || ''}</span>
              </Button>

              {!isReply && user && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span className="text-xs">Reply</span>
                </Button>
              )}

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => setShowEditForm(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                placeholder={`Reply to ${comment.author_name}...`}
                submitLabel="Reply"
                isReply
              />
            </div>
          )}

          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleLike={onToggleLike}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
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
    </motion.div>
  );
}
