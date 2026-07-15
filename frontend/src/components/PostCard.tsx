import type { FeedPost, PostComment } from "../lib/api";
import { CommentList } from "./CommentList";
import { InlineCommentComposer } from "./InlineCommentComposer";

type PostCardProps = {
  post: FeedPost;
  isLikePending: boolean;
  likeErrorMessage?: string | null;
  onToggleLike: (post: FeedPost) => Promise<void> | void;
  commentDraft: string;
  isCommentPending: boolean;
  commentErrorMessage?: string | null;
  commentSuccessMessage?: string | null;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => Promise<void> | void;
  latestComment: PostComment | null;
  comments: PostComment[];
  areCommentsExpanded: boolean;
  isLatestCommentLoading: boolean;
  isCommentsLoading: boolean;
  isLoadingMoreComments: boolean;
  commentsErrorMessage?: string | null;
  loadMoreCommentsErrorMessage?: string | null;
  hasMoreComments: boolean;
  currentUserId: string | null;
  pendingDeleteCommentId: string | null;
  deleteCommentErrorByCommentId: Record<string, string | undefined>;
  onToggleComments: (postId: string) => void;
  onLoadMoreComments: (postId: string) => void;
  onDeleteComment: (postId: string, comment: PostComment) => void;
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
  onToggleLike,
  commentDraft,
  isCommentPending,
  commentErrorMessage,
  commentSuccessMessage,
  onCommentDraftChange,
  onSubmitComment,
  latestComment,
  comments,
  areCommentsExpanded,
  isLatestCommentLoading,
  isCommentsLoading,
  isLoadingMoreComments,
  commentsErrorMessage,
  loadMoreCommentsErrorMessage,
  hasMoreComments,
  currentUserId,
  pendingDeleteCommentId,
  deleteCommentErrorByCommentId,
  onToggleComments,
  onLoadMoreComments,
  onDeleteComment
}: PostCardProps) {
  const wasUpdated = post.updatedAt !== post.createdAt;
  const heartSymbol = post.likedByMe ? "♥" : "♡";
  const heartClassName = post.likedByMe
    ? "scale-110 text-red-500"
    : "text-gray-400 group-hover:text-red-400";

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

      <div className="mt-5 border-t border-gray-100 pt-4">
        <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600">
          <button
            aria-label={post.likedByMe ? "Unlike post" : "Like post"}
            className="group inline-flex items-center gap-2 rounded-full px-2 py-1 font-medium text-gray-700 transition hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLikePending}
            onClick={() => void onToggleLike(post)}
          >
            <span
              className={`text-2xl leading-none transition duration-150 ${heartClassName} ${
                isLikePending ? "scale-95" : ""
              }`}
              aria-hidden="true"
            >
              {heartSymbol}
            </span>
            <span>{post.likesCount}</span>
          </button>
          <span>{post.commentsCount} comments</span>
        </div>

        {likeErrorMessage ? (
          <p className="mt-3 text-sm text-red-700">{likeErrorMessage}</p>
        ) : null}
      </div>

      <InlineCommentComposer
        postId={post.id}
        value={commentDraft}
        isPending={isCommentPending}
        errorMessage={commentErrorMessage}
        successMessage={commentSuccessMessage}
        onChange={onCommentDraftChange}
        onSubmit={onSubmitComment}
      />

      <CommentList
        postId={post.id}
        commentsCount={post.commentsCount}
        latestComment={latestComment}
        comments={comments}
        isExpanded={areCommentsExpanded}
        isPreviewLoading={isLatestCommentLoading}
        isCommentsLoading={isCommentsLoading}
        isLoadingMore={isLoadingMoreComments}
        commentsErrorMessage={commentsErrorMessage}
        loadMoreErrorMessage={loadMoreCommentsErrorMessage}
        hasMore={hasMoreComments}
        currentUserId={currentUserId}
        pendingDeleteCommentId={pendingDeleteCommentId}
        deleteCommentErrorByCommentId={deleteCommentErrorByCommentId}
        onToggleComments={onToggleComments}
        onLoadMoreComments={onLoadMoreComments}
        onDeleteComment={onDeleteComment}
      />
    </article>
  );
}
