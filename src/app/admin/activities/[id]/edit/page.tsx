import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import NewActivityForm from "../../new/NewActivityForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditActivityPage({ params }: Props) {
  const { id } = await params;

  if (!(await isAdmin())) redirect("/admin/login");

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || post.type !== "activity") notFound();

  return (
    <NewActivityForm
      mode="edit"
      postId={post.id}
      postSlug={post.slug}
      initial={{
        title: post.title,
        content: post.content,
        eventDate: post.eventDate ? post.eventDate.toISOString().split("T")[0] : "",
        eventLocation: post.eventLocation || "",
        eventLink: post.eventLink || "",
      }}
    />
  );
}
