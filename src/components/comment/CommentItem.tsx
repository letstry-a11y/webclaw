"use client";

import { useState } from "react";
import { Reply } from "lucide-react";
import { formatDate } from "@/lib/utils";
import CommentForm from "./CommentForm";
import type { CommentWithReplies } from "@/types";

interface CommentItemProps {
  comment: CommentWithReplies;
  postId: string;
  onReply: (parentId: string, reply: CommentWithReplies) => void;
}

export default function CommentItem({ comment, postId, onReply }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-medium text-primary">
            {comment.authorName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-text-primary">{comment.authorName}</span>
            <span className="text-xs text-text-tertiary">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{comment.content}</p>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 mt-2 text-xs text-text-tertiary hover:text-primary transition-colors"
          >
            <Reply className="w-3.5 h-3.5" />
            回复
          </button>

          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                compact
                onSuccess={(reply) => {
                  onReply(comment.id, reply);
                  setShowReplyForm(false);
                }}
                onCancel={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-border-light space-y-3">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-tag-bg flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-tag-text">
                      {reply.authorName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-text-primary">{reply.authorName}</span>
                      <span className="text-xs text-text-tertiary">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
