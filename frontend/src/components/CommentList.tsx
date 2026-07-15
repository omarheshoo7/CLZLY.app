import type { PostComment } from "../lib/api";

type CommentListProps = {
  postId: string;
  commentsCount: number;
  latestComment: PostComment | null;
  comments: PostComment[];
  isExpanded: boolean;
  isPreviewLoading: boolean;
  isCommentsLoading: boolean;
  isLoadingMore: boolean;
  commentsErrorMessage?: string | null;
  loadMoreErrorMessage?: string | null;
  hasMore: boolean;
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
  return value.length > 8 ? `${value.slice(0, 8)}...` : value;
}

function getCommentAuthorLabel(comment: PostComment) {
  return comment.author?.username ?? `User ${shortenId(comment.authorId)}`;
}

function isOwnComment(comment: PostComment, currentUserId: string | null) {
  if (!currentUserId) {
    return false;
  }

  return comment.author?.id === currentUserId || comment.authorId === currentUserId;
}

type CommentItemProps = {
  postId: string;
  comment: PostComment;
  currentUserId: string | null;
  pendingDeleteCommentId: string | null;
  deleteErrorMessage?: string | null;
  onDeleteComment: (postId: string, comment: PostComment) => void;
  showDeleteControl?: boolean;
};

function CommentItem({
  postId,
  comment,
  currentUserId,
  pendingDeleteCommentId,
  deleteErrorMessage,
  onDeleteComment,
  showDeleteControl = false
}: CommentItemProps) {
  const canDelete = showDeleteControl && isOwnComment(comment, currentUserId);
  const isDeleting = pendingDeleteCommentId === comment.id;

  return (
    <li className="rounded-md bg-gray-50 px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-gray-950">
            {getCommentAuthorLabel(comment)}
          </span>
          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
        </div>
        {canDelete ? (
          <button
            className="text-xs font-semibold text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:text-red-300"
            type="button"
            onClick={() => onDeleteComment(postId, comment)}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-gray-800">
        {comment.content}
      </p>
      {deleteErrorMessage ? (
        <p className="mt-2 text-sm text-red-700">{deleteErrorMessage}</p>
      ) : null}
    </li>
  );
}

export function CommentList({
  postId,
  commentsCount,
  latestComment,
  comments,
  isExpanded,
  isPreviewLoading,
  isCommentsLoading,
  isLoadingMore,
  commentsErrorMessage,
  loadMoreErrorMessage,
  hasMore,
  currentUserId,
  pendingDeleteCommentId,
  deleteCommentErrorByCommentId,
  onToggleComments,
  onLoadMoreComments,
  onDeleteComment
}: CommentListProps) {
  const shouldShowToggle = commentsCount > 0 || isExpanded;
  const toggleLabel = isExpanded ? "Hide comments" : "View comments";

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {!isExpanded ? (
        <div className="space-y-3">
          {isPreviewLoading ? (
            <p className="text-sm text-gray-500">Loading latest comment...</p>
          ) : null}

          {!isPreviewLoading && latestComment ? (
            <ul className="space-y-2">
              <CommentItem
                postId={postId}
                comment={latestComment}
                currentUserId={currentUserId}
                pendingDeleteCommentId={pendingDeleteCommentId}
                deleteErrorMessage={null}
                onDeleteComment={onDeleteComment}
              />
            </ul>
          ) : null}
        </div>
      ) : null}

      {shouldShowToggle ? (
        <button
          className="mt-3 text-sm font-semibold text-gray-700 transition hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-400"
          type="button"
          onClick={() => onToggleComments(postId)}
          disabled={isCommentsLoading}
        >
          {isCommentsLoading ? "Loading comments..." : toggleLabel}
        </button>
      ) : null}

      {isExpanded ? (
        <div className="mt-3 space-y-3">
          {isCommentsLoading ? (
            <p className="text-sm text-gray-500">Loading comments...</p>
          ) : null}

          {!isCommentsLoading && commentsErrorMessage ? (
            <p className="text-sm text-red-700">{commentsErrorMessage}</p>
          ) : null}

          {!isCommentsLoading && !commentsErrorMessage && comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments yet.</p>
          ) : null}

          {!isCommentsLoading && comments.length > 0 ? (
            <ul className="space-y-2">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  postId={postId}
                  comment={comment}
                  currentUserId={currentUserId}
                  pendingDeleteCommentId={pendingDeleteCommentId}
                  deleteErrorMessage={deleteCommentErrorByCommentId[comment.id] ?? null}
                  onDeleteComment={onDeleteComment}
                  showDeleteControl
                />
              ))}
            </ul>
          ) : null}

          {hasMore ? (
            <div>
              {loadMoreErrorMessage ? (
                <p className="mb-2 text-sm text-red-700">{loadMoreErrorMessage}</p>
              ) : null}
              <button
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-950 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                type="button"
                onClick={() => onLoadMoreComments(postId)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load more comments"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
