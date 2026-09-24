import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { createPostZodSchema } from "@/zod/creatPostZodSchema";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  const validation = createPostZodSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const post = await prisma.post.create({
      data: validation.data,
    });

    return NextResponse.json(
      { message: "Post created successfully", post },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "A post with this slug already exists" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Something went wrong while creating the post" },
      { status: 500 },
    );
  }
}
