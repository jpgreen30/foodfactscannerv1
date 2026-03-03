import { useState } from 'react';
import { AlertTriangle, Lightbulb, HelpCircle, MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { PostType } from '@/hooks/useCommunityFeed';

interface PostComposerProps {
  onSubmit: (data: {
    title: string;
    content: string;
    post_type: PostType;
    product_barcode?: string;
    product_name?: string;
    health_score?: number;
    verdict?: string;
  }) => Promise<boolean>;
  prefillData?: {
    product_name?: string;
    product_barcode?: string;
    health_score?: number;
    verdict?: string;
  };
  onCancel?: () => void;
}

const postTypes: { id: PostType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'warning', label: 'Warning', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-destructive/20 text-destructive border-destructive/30' },
  { id: 'tip', label: 'Tip', icon: <Lightbulb className="w-4 h-4" />, color: 'bg-primary/20 text-primary border-primary/30' },
  { id: 'question', label: 'Question', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'experience', label: 'Experience', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
];

export const PostComposer = ({ onSubmit, prefillData, onCancel }: PostComposerProps) => {
  const [title, setTitle] = useState(prefillData?.product_name ? `Warning about ${prefillData.product_name}` : '');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('warning');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmit({
      title: title.trim(),
      content: content.trim(),
      post_type: postType,
      product_barcode: prefillData?.product_barcode,
      product_name: prefillData?.product_name,
      health_score: prefillData?.health_score,
      verdict: prefillData?.verdict,
    });

    if (success) {
      setTitle('');
      setContent('');
      setPostType('warning');
      onCancel?.();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Share with the Community</h3>
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Post Type Selection */}
      <div className="flex flex-wrap gap-2">
        {postTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setPostType(type.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              postType === type.id
                ? type.color
                : 'bg-muted text-muted-foreground border-transparent hover:border-border'
            )}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      {/* Product Tag */}
      {prefillData?.product_name && (
        <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
          <span className="text-xs text-muted-foreground">About:</span>
          <span className="text-sm font-medium text-foreground">{prefillData.product_name}</span>
          {prefillData.health_score && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              prefillData.health_score >= 70 ? 'bg-green-500/20 text-green-400' :
              prefillData.health_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            )}>
              Score: {prefillData.health_score}
            </span>
          )}
        </div>
      )}

      {/* Title Input */}
      <Input
        placeholder="Give your post a title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        className="bg-muted border-0 focus-visible:ring-1"
      />

      {/* Content Input */}
      <Textarea
        placeholder="Share your experience, warning, or question..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        rows={4}
        className="bg-muted border-0 focus-visible:ring-1 resize-none"
      />

      {/* Character Count & Submit */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/1000 characters
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim() || isSubmitting}
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
};
