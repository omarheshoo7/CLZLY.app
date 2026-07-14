import { useState, type FormEvent } from "react";
import { ApiError, createPostApi } from "../lib/api";

const MAX_POST_LENGTH = 2000;

type CreatePostFormProps = {
  accessToken: string;
  onPostCreated: () => Promise<void> | void;
};

function getCreatePostErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Could not create post.";
}

export function CreatePostForm({ accessToken, onPostCreated }: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedContent = content.trim();
  const isOverLimit = content.length > MAX_POST_LENGTH;
  const isSubmitDisabled = isSubmitting || trimmedContent.length === 0 || isOverLimit;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (trimmedContent.length === 0) {
      setErrorMessage("Post content is required.");
      return;
    }

    if (isOverLimit) {
      setErrorMessage("Post content must be 2000 characters or less.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createPostApi(accessToken, {
        content: trimmedContent
      });

      setContent("");
      setErrorMessage(null);

      try {
        await onPostCreated();
      } catch {
        setErrorMessage("Post created, but the feed could not refresh.");
      }
    } catch (error) {
      setErrorMessage(getCreatePostErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div>
        <h3 className="text-base font-semibold text-gray-950">Create a post</h3>
        <p className="mt-1 text-sm text-gray-600">
          Share a text update with your feed.
        </p>
      </div>

      <div className="mt-4">
        <label className="sr-only" htmlFor="post-content">
          Post content
        </label>
        <textarea
          id="post-content"
          className="min-h-32 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 disabled:cursor-not-allowed disabled:bg-gray-50"
          placeholder="What would you like to share?"
          value={content}
          maxLength={MAX_POST_LENGTH}
          disabled={isSubmitting}
          onChange={(event) => {
            setContent(event.target.value);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
        />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-sm ${isOverLimit ? "text-red-700" : "text-gray-500"}`}>
          {content.length} / {MAX_POST_LENGTH}
        </p>
        <button
          className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          type="submit"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? "Posting..." : "Post"}
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </form>
  );
}
