import type { FeedPost } from "../lib/api";

type PostCardProps = {
  post: FeedPost;
  isLikePending: boolean;
  likeErrorMessage?: string | null;
  onToggleLike: (post: FeedPost) => Promise<void> | void;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

function shortenId(value: string) {
  return value.length > 12 ? `${value.slice(0, 12)}...` : value;
}

export function PostCard({
  post,
  isLikePending,
  likeErrorMessage,
  onToggleLike
}: PostCardProps) {
  const wasUpdated = post.updatedAt !== post.createdAt;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-medium text-gray-700">
          Author ID: <span className="text-gray-950">{shortenId(post.authorId)}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">Posted {formatDate(post.createdAt)}</p>
        {wasUpdated ? (
          <p className="mt-1 text-xs text-gray-500">Updated {formatDate(post.updatedAt)}</p>
        ) : null}
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-950">{post.content}</p>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{post.likesCount} likes</span>
          <span>{post.commentsCount} comments</span>
        </div>

        <button
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-950 hover:text-gray-950 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 sm:w-auto"
          type="button"
          disabled={isLikePending}
          onClick={() => void onToggleLike(post)}
        >
          {isLikePending ? "Updating..." : post.likedByMe ? "Unlike" : "Like"}
        </button>
      </div>

      {likeErrorMessage ? (
        <p className="mt-3 text-sm text-red-700">{likeErrorMessage}</p>
      ) : null}
    </article>
  );
}
