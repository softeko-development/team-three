import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const id = Number((body as { id?: unknown }).id);

  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ message: "Valid post id is required" }, { status: 422 });
  }

  try {
    await prisma.post.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Something went wrong while deleting the post" },
      { status: 500 },
    );
  }
}
