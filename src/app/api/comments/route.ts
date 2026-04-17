import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createCommentSchema.parse(body);

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorName: data.authorName || "匿名用户",
        postId: data.postId,
        parentId: data.parentId || null,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
