-- Create product_comments table
CREATE TABLE public.product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  parent_id UUID REFERENCES public.product_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comment_likes table
CREATE TABLE public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.product_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, comment_id)
);

-- Create indexes for performance
CREATE INDEX idx_product_comments_barcode ON public.product_comments(product_barcode);
CREATE INDEX idx_product_comments_parent ON public.product_comments(parent_id);
CREATE INDEX idx_product_comments_user ON public.product_comments(user_id);
CREATE INDEX idx_comment_likes_comment ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON public.comment_likes(user_id);

-- Enable RLS
ALTER TABLE public.product_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_comments
CREATE POLICY "Anyone authenticated can read comments"
ON public.product_comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own comments"
ON public.product_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.product_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.product_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for comment_likes
CREATE POLICY "Anyone authenticated can read likes"
ON public.comment_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own likes"
ON public.comment_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.comment_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;

-- Create trigger for updated_at
CREATE TRIGGER update_product_comments_updated_at
BEFORE UPDATE ON public.product_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get comment count for a product
CREATE OR REPLACE FUNCTION public.get_product_comment_count(p_barcode TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.product_comments
  WHERE product_barcode = p_barcode;
$$;

-- Function to toggle comment like
CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.comment_likes
    WHERE comment_id = p_comment_id AND user_id = auth.uid()
  ) INTO v_exists;
  
  IF v_exists THEN
    DELETE FROM public.comment_likes
    WHERE comment_id = p_comment_id AND user_id = auth.uid();
    RETURN FALSE;
  ELSE
    INSERT INTO public.comment_likes (user_id, comment_id)
    VALUES (auth.uid(), p_comment_id);
    RETURN TRUE;
  END IF;
END;
$$;