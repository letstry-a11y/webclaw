"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import type { CommentWithReplies } from "@/types";

interface CommentSectionProps {
  postId: string;
  comments: CommentWithReplies[];
}

export default function CommentSection({ postId, comments: initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);

  const handleNewComment = (comment: CommentWithReplies) => {
    setComments([comment, ...comments]);
  };

  const handleNewReply = (parentId: string, reply: CommentWithReplies) => {
    setComments(
      comments.map((c) =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
  };

  return (
    <section className="bg-white rounded-xl p-6 sm:p-8 border border-border-light">
      <h3 className="text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        评论 ({comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})
      </h3>

      <CommentForm postId={postId} onSuccess={handleNewComment} />

      <div className="mt-6 space-y-0 divide-y divide-border-light">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReply={handleNewReply}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-text-tertiary text-sm">
          暂无评论，来说点什么吧~
        </div>
      )}
    </section>
  );
}
