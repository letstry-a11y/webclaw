"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
}

export default function LikeButton({ postId, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const handleLike = async () => {
    if (liked) return;

    setAnimating(true);
    setLiked(true);
    setCount((c) => c + 1);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setLiked(false);
        setCount((c) => c - 1);
      } else {
        setCount(data.likeCount);
      }
    } catch {
      setLiked(false);
      setCount((c) => c - 1);
    }

    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleLike}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border",
        liked
          ? "bg-accent/10 text-accent border-accent/20"
          : "bg-white text-text-secondary border-border hover:border-accent hover:text-accent"
      )}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-all",
          liked && "fill-accent",
          animating && "animate-like"
        )}
      />
      <span>{count}</span>
    </button>
  );
}
