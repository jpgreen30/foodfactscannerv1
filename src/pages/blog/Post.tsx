import { useParams, Navigate } from "react-router-dom";
import { BlogPostPage } from "@/blog/components/BlogPostPage";
import { BlogSEO } from "@/blog/components/BlogSEO";
import { getPostBySlug } from "@/blog/content/posts";

export default function BlogPostPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <BlogSEO post={post} />
      <BlogPostPage post={post} />
    </>
  );
}
