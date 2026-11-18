import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { shanghaiDate } from "@/lib/report-week";
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
      key={post.id}
      mode="edit"
      postId={post.id}
      postSlug={post.slug}
      initial={{
        title: post.title,
        content: post.content,
        eventDate: post.eventDate ? shanghaiDate(post.eventDate) : "",
        eventLocation: post.eventLocation || "",
        eventLink: post.eventLink || "",
      }}
    />
  );
}
