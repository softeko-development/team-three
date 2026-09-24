import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PAGE_SIZE = 5;

const getPage = (value: string | null) => {
  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = getPage(searchParams.get("page"));
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status");
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    ...(search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(status === "published" ? { published: true } : {}),
    ...(status === "draft" ? { published: false } : {}),
  };

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.post.count({ where }),
    ]);

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit: PAGE_SIZE,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong while fetching posts" },
      { status: 500 },
    );
  }
}
