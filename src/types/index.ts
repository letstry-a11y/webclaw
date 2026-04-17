import type { Post, Comment, Category } from "@prisma/client";

export type PostWithCounts = Post & {
  _count?: {
    comments: number;
    likes: number;
  };
};

export type CommentWithReplies = Comment & {
  replies: Comment[];
};

export type { Post, Comment, Category };
