"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  createPostZodSchema,
  type CreatePostInput,
} from "@/zod/creatPostZodSchema";

type CreatePostResponse = {
  message?: string;
  errors?: Partial<Record<keyof CreatePostInput, string[]>>;
};

const CreatePostForm = () => {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      published: false,
    },
  });

  const onSubmit = async (data: CreatePostInput) => {
    setServerError("");

    const validation = createPostZodSchema.safeParse(data);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;

      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (messages?.[0]) {
          setError(field as keyof CreatePostInput, {
            type: "validate",
            message: messages[0],
          });
        }
      });

      return;
    }

    try {
      const response = await fetch("/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });

      const result = (await response.json().catch(() => ({}))) as CreatePostResponse;

      if (!response.ok) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages?.[0]) {
              setError(field as keyof CreatePostInput, {
                type: "server",
                message: messages[0],
              });
            }
          });
        }

        const message = result.message || "Failed to create post";
        setServerError(message);
        toast.error(message);
        return;
      }

      reset();
      toast.success(result.message || "Post created successfully");
    } catch {
      const message = "Network error. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto w-full max-w-2xl space-y-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create post</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Add a title, unique slug, and content for your new post.
        </p>
      </div>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {serverError}
        </p>
      )}

      <div className="grid gap-5">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            placeholder="Getting started with Prisma"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="block text-sm font-medium">
            Slug
          </label>
          <input
            id="slug"
            placeholder="getting-started-with-prisma"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
            {...register("slug")}
          />
          {errors.slug && (
            <p className="text-sm text-red-600">{errors.slug.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            rows={8}
            placeholder="Write your post content..."
            className="min-h-44 w-full resize-y rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900"
            {...register("content")}
          />
          {errors.content && (
            <p className="text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        <label className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <span>
            <span className="block text-sm font-medium">Publish now</span>
            <span className="block text-sm text-zinc-600 dark:text-zinc-400">
              Keep this off to save the post as a draft.
            </span>
          </span>
          <input type="checkbox" className="h-5 w-5" {...register("published")} />
        </label>
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <button
          type="reset"
          className="rounded-md border px-4 py-2 text-sm font-medium"
          disabled={isSubmitting}
          onClick={() => {
            setServerError("");

          }}
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950"
        >
          {isSubmitting ? "Creating..." : "Create post"}
        </button>
      </div>
      </form>
    </>
  );
};

export default CreatePostForm;
