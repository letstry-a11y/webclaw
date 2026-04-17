import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { getFingerprint } from "@/lib/fingerprint";
import PostForm from "@/components/post/PostForm";
import type { Attachment } from "@/lib/validators";

interface Props {
  params: Promise<{ slug: string }>;
}

function parseAttachments(raw: string): Attachment[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default async function EditPostPage({ params }: Props) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);

  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || post.type !== "blog") notFound();

  const admin = await isAdmin();
  const fp = await getFingerprint();
  const isOwner = !!post.authorFingerprint && post.authorFingerprint === fp;

  if (!admin && !isOwner) {
    redirect(`/posts/${encodeURIComponent(slug)}`);
  }

  return (
    <PostForm
      mode="edit"
      initial={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        category: post.category,
        tags: post.tags,
        authorName: post.authorName,
        coverImage: post.coverImage,
        attachments: parseAttachments(post.attachments),
      }}
    />
  );
}
