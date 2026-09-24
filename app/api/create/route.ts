import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { createPostZodSchema } from "@/zod/creatPostZodSchema";
import slugify from "slugify";

const createSlug = (value: string) =>
  slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });

const getUniqueSlug = async (preferredSlug: string) => {
  const baseSlug = createSlug(preferredSlug);

  const existingPosts = await prisma.post.findMany({
    where: {
      OR: [{ slug: baseSlug }, { slug: { startsWith: baseSlug + "-" } }],
    },
    select: {
      slug: true,
    },
  });

  const existingSlugs = new Set(existingPosts.map((post) => post.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let nextSlug = baseSlug + "-" + suffix;

  while (existingSlugs.has(nextSlug)) {
    suffix += 1;
    nextSlug = baseSlug + "-" + suffix;
  }

  return nextSlug;
};

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
    const slug = await getUniqueSlug(validation.data.slug);

    const post = await prisma.post.create({
      data: {
        ...validation.data,
        slug,
      },
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
        { message: "Please try again. This slug was just used." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Something went wrong while creating the post" },
      { status: 500 },
    );
  }
}
