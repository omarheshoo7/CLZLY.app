import type { FeedPost } from "../lib/api";

type PostCardProps = {
  post: FeedPost;
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

export function PostCard({ post }: PostCardProps) {
  const wasUpdated = post.updatedAt !== post.createdAt;

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Author ID: <span className="text-gray-950">{shortenId(post.authorId)}</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">Posted {formatDate(post.createdAt)}</p>
          {wasUpdated ? (
            <p className="mt-1 text-xs text-gray-500">Updated {formatDate(post.updatedAt)}</p>
          ) : null}
        </div>

        {post.likedByMe ? (
          <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            Liked by you
          </span>
        ) : null}
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-950">{post.content}</p>

      <div className="mt-5 flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
        <span>{post.likesCount} likes</span>
        <span>{post.commentsCount} comments</span>
      </div>
    </article>
  );
}
