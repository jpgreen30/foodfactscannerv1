import { useState } from 'react';
import { Users, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PostComposer } from '@/components/community/PostComposer';
import { useCommunityFeed, PostType } from '@/hooks/useCommunityFeed';
import { useNavigate } from 'react-router-dom';

interface ShareToCommunityProps {
  productName: string;
  brand?: string;
  healthScore: number;
  verdict: string;
  barcode?: string | null;
}

export const ShareToCommunityButton = ({ 
  productName, 
  brand, 
  healthScore, 
  verdict, 
  barcode 
}: ShareToCommunityProps) => {
  const [showModal, setShowModal] = useState(false);
  const { createPost } = useCommunityFeed();
  const navigate = useNavigate();

  // Only show for harmful products
  if (verdict !== 'avoid' && verdict !== 'caution') {
    return null;
  }

  const handleSubmit = async (data: {
    title: string;
    content: string;
    post_type: PostType;
    product_barcode?: string;
    product_name?: string;
    health_score?: number;
    verdict?: string;
  }) => {
    const success = await createPost(data);
    if (success) {
      setShowModal(false);
      navigate('/community');
    }
    return success;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex-1 gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
      >
        <Users className="w-4 h-4" />
        Warn Others
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Share Warning with Community
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-sm text-muted-foreground mb-4">
            Help protect other families by sharing your experience with this product.
          </p>

          <PostComposer
            onSubmit={handleSubmit}
            prefillData={{
              product_name: productName,
              product_barcode: barcode || undefined,
              health_score: healthScore,
              verdict: verdict,
            }}
            onCancel={() => setShowModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
