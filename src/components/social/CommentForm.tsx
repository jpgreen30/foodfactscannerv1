import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  isReply?: boolean;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Share your thoughts about this product...',
  initialValue = '',
  submitLabel = 'Post',
  isReply = false,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxLength = 1000;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onSubmit(content.trim());
    setIsSubmitting(false);

    if (success) {
      setContent('');
      onCancel?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`space-y-2 ${isReply ? 'pl-4 border-l-2 border-muted' : ''}`}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[80px] resize-none bg-background"
        disabled={isSubmitting}
      />
      
      <div className="flex items-center justify-between">
        <span className={`text-xs ${remainingChars < 100 ? 'text-warning' : 'text-muted-foreground'}`}>
          {remainingChars} characters remaining
        </span>
        
        <div className="flex gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            <Send className="w-4 h-4 mr-1" />
            {isSubmitting ? 'Posting...' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
