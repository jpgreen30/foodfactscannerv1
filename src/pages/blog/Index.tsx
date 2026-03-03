import { BlogIndex } from "@/blog/components/BlogIndex";
import { BlogSEO } from "@/blog/components/BlogSEO";
import { getAllPosts, getFeaturedPosts } from "@/blog/content/posts";

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const featuredPosts = getFeaturedPosts();

  return (
    <>
      <BlogSEO 
        title="Baby Food Safety Blog | FDA Recalls & Toxic Ingredients"
        description="Expert articles on baby food safety, FDA recalls, toxic ingredients, heavy metals, and how to protect your baby. Stay informed with FoodFactScanner."
        isBlogIndex 
      />
      <BlogIndex posts={posts} featuredPosts={featuredPosts} />
    </>
  );
}
