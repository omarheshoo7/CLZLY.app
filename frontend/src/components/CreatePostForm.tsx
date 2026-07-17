import { useEffect, useState, type FormEvent } from "react";
import { ApiError, createPostApi, type PostType } from "../lib/api";
import { postTypeOptions, postTypePrompts } from "../lib/postTypes";

const MAX_POST_LENGTH = 2000;

type CreatePostFormProps = {
  accessToken: string;
  defaultPostType?: PostType;
  onPostCreated: () => Promise<void> | void;
};

function getCreatePostErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Could not create post.";
}

export function CreatePostForm({
  accessToken,
  defaultPostType = "PERSONAL",
  onPostCreated
}: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>(defaultPostType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPrompt = postTypePrompts[postType];
  const trimmedContent = content.trim();
  const isOverLimit = content.length > MAX_POST_LENGTH;
  const isSubmitDisabled = isSubmitting || trimmedContent.length === 0 || isOverLimit;

  useEffect(() => {
    setPostType(defaultPostType);
  }, [defaultPostType]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

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
    setSuccessMessage(null);

    try {
      await createPostApi(accessToken, {
        content: trimmedContent,
        type: postType
      });

      setContent("");
      setPostType(defaultPostType);
      setErrorMessage(null);

      try {
        await onPostCreated();
        setSuccessMessage("Posted successfully.");
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
          {selectedPrompt.helperText}
        </p>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="post-type">
          Type
        </label>
        <select
          id="post-type"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 disabled:cursor-not-allowed disabled:bg-gray-50 sm:max-w-xs"
          value={postType}
          disabled={isSubmitting}
          onChange={(event) => {
            setPostType(event.target.value as PostType);
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
        >
          {postTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="sr-only" htmlFor="post-content">
          Post content
        </label>
        <textarea
          id="post-content"
          className="min-h-32 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 disabled:cursor-not-allowed disabled:bg-gray-50"
          placeholder={selectedPrompt.placeholder}
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
        <p className="mt-2 text-sm text-gray-500">
          Example: {selectedPrompt.example}
        </p>
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
      {successMessage ? (
        <div
          className="fixed right-4 top-4 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 shadow-lg"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}
    </form>
  );
}
