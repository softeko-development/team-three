"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

type Post = {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type PostsResponse = {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

type StatusFilter = "all" | "published" | "draft";

type DeleteResponse = {
  message?: string;
};

const emptyPagination: PostsResponse["pagination"] = {
  page: 1,
  limit: 5,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

const GetPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState(emptyPagination);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();

    const getPosts = async () => {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      if (status !== "all") {
        params.set("status", status);
      }

      try {
        const response = await fetch(`/api/get?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch posts");
        }

        const data = (await response.json()) as PostsResponse;
        setPosts(data.posts);
        setPagination(data.pagination);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError("Could not load posts. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    getPosts();

    return () => controller.abort();
  }, [page, debouncedSearch, status, refreshKey]);

  const changeStatus = (nextStatus: StatusFilter) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const deletePost = async (post: Post) => {
    setOpenMenuPostId(null);

    const result = await Swal.fire({
      title: "Delete this post?",
      text: `This will permanently delete \"${post.title}\".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#52525b",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) {
      return;
    }

    setDeletingPostId(post.id);
    setError("");

    try {
      const response = await fetch("/api/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: post.id }),
      });

      const data = (await response.json().catch(() => ({}))) as DeleteResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete post");
      }

      await Swal.fire({
        title: "Deleted",
        text: data.message || "Post deleted successfully",
        icon: "success",
        timer: 1600,
        showConfirmButton: false,
      });

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete post. Please try again.";

      setError(message);
      void Swal.fire({
        title: "Delete failed",
        text: message,
        icon: "error",
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Showing {posts.length} of {pagination.total} posts
          </p>
        </div>
        <Link
          href="/posts/create"
          className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          Create post
        </Link>
      </div>

      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search posts by title"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
        />

        <div className="flex rounded-md border border-zinc-300 p-1 dark:border-zinc-700">
          {(["all", "published", "draft"] as StatusFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeStatus(item)}
              className={`rounded px-3 py-1.5 text-sm font-medium capitalize ${
                status === item
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {item === "draft" ? "Unpublished" : item}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <p className="rounded-md border border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            Loading posts...
          </p>
        ) : posts.length === 0 ? (
          <p className="rounded-md border border-zinc-200 p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            No posts found.
          </p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">{post.title}</h2>
                  <p className="text-sm text-zinc-500">/{post.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-800">
                    {post.published ? "Published" : "Draft"}
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Post actions"
                      onClick={() =>
                        setOpenMenuPostId((currentId) =>
                          currentId === post.id ? null : post.id,
                        )
                      }
                      className="rounded-md border border-zinc-200 px-2 py-1 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    >
                      ...
                    </button>
                    {openMenuPostId === post.id && (
                      <div className="absolute right-0 z-10 mt-2 w-36 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
                        <button
                          type="button"
                          disabled={deletingPostId === post.id}
                          onClick={() => deletePost(post)}
                          className="w-full rounded px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-950/40"
                        >
                          {deletingPostId === post.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {post.content && (
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                  {post.content}
                </p>
              )}
            </article>
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-200 pt-5 text-sm dark:border-zinc-800">
        <button
          type="button"
          disabled={!pagination.hasPreviousPage || isLoading}
          onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
          className="rounded-md border border-zinc-300 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 dark:border-zinc-700 dark:disabled:border-zinc-800"
        >
          Previous
        </button>

        <span className="text-zinc-600 dark:text-zinc-400">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        <button
          type="button"
          disabled={!pagination.hasNextPage || isLoading}
          onClick={() => setPage((currentPage) => currentPage + 1)}
          className="rounded-md border border-zinc-300 px-4 py-2 font-medium disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400 dark:border-zinc-700 dark:disabled:border-zinc-800"
        >
          Next
        </button>
      </div>
    </main>
  );
};

export default GetPosts;
