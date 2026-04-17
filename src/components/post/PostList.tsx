import PostCard from "./PostCard";
import type { PostWithCounts } from "@/types";

interface PostListProps {
  posts: PostWithCounts[];
}

export default function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-text-primary mb-2">还没有文章</h3>
        <p className="text-sm text-text-secondary">成为第一个发布文章的人吧！</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
