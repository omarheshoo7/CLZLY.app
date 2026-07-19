import type { FeedPost, PostComment } from "../lib/api";
import { postTypeLabels } from "../lib/postTypes";
import { CommentList } from "./CommentList";
import { InlineCommentComposer } from "./InlineCommentComposer";

const MAX_POST_LENGTH = 2000;

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
  pendingDeletePostId: string | null;
  deletePostError?: string | null;
  isEditingPost: boolean;
  editPostDraft: string;
  isEditPending: boolean;
  editPostError?: string | null;
  pendingDeleteCommentId: string | null;
  deleteCommentErrorByCommentId: Record<string, string | undefined>;
  onDeletePost: (postId: string) => Promise<void> | void;
  onStartEditPost: (post: FeedPost) => void;
  onCancelEditPost: (postId: string) => void;
  onEditPostDraftChange: (postId: string, value: string) => void;
  onSaveEditPost: (postId: string) => Promise<void> | void;
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
  pendingDeletePostId,
  deletePostError,
  isEditingPost,
  editPostDraft,
  isEditPending,
  editPostError,
  pendingDeleteCommentId,
  deleteCommentErrorByCommentId,
  onDeletePost,
  onStartEditPost,
  onCancelEditPost,
  onEditPostDraftChange,
  onSaveEditPost,
  onToggleComments,
  onLoadMoreComments,
  onDeleteComment
}: PostCardProps) {
  const wasUpdated = post.updatedAt !== post.createdAt;
  const heartSymbol = post.likedByMe ? "♥" : "♡";
  const authorName = post.author?.username ?? "Unknown user";
  const isOwnPost =
    currentUserId !== null &&
    (post.author?.id === currentUserId || post.authorId === currentUserId);
  const isDeletePending = pendingDeletePostId === post.id;
  const trimmedEditPostDraft = editPostDraft.trim();
  const isEditOverLimit = editPostDraft.length > MAX_POST_LENGTH;
  const isSaveEditDisabled =
    isEditPending ||
    trimmedEditPostDraft.length === 0 ||
    trimmedEditPostDraft === post.content.trim() ||
    isEditOverLimit;
  const heartClassName = post.likedByMe
    ? "scale-110 text-red-500"
    : "text-gray-400 group-hover:text-red-400";

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-gray-950">{authorName}</p>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
              {postTypeLabels[post.type]}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Posted {formatDate(post.createdAt)}</p>
          {wasUpdated ? (
            <p className="mt-1 text-xs text-gray-500">Updated {formatDate(post.updatedAt)}</p>
          ) : null}
        </div>

        {isOwnPost && !isEditingPost ? (
          <div className="flex items-center gap-2">
            <button
              className="rounded-md px-2 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-950"
              type="button"
              onClick={() => onStartEditPost(post)}
            >
              Edit
            </button>
            <button
              className="rounded-md px-2 py-1 text-sm font-medium text-red-700 transition hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isDeletePending}
              onClick={() => void onDeletePost(post.id)}
            >
              {isDeletePending ? "Deleting..." : "Delete"}
            </button>
          </div>
        ) : null}
      </div>

      {deletePostError ? (
        <p className="mt-3 text-sm text-red-700">{deletePostError}</p>
      ) : null}

      {isEditingPost ? (
        <div className="mt-4">
          <label className="sr-only" htmlFor={`edit-post-content-${post.id}`}>
            Edit post content
          </label>
          <textarea
            id={`edit-post-content-${post.id}`}
            className="min-h-28 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-gray-950 focus:ring-2 focus:ring-gray-950/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            value={editPostDraft}
            disabled={isEditPending}
            onChange={(event) => onEditPostDraftChange(post.id, event.target.value)}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm ${isEditOverLimit ? "text-red-700" : "text-gray-500"}`}>
              {editPostDraft.length} / {MAX_POST_LENGTH}
            </p>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={isEditPending}
                onClick={() => onCancelEditPost(post.id)}
              >
                Cancel
              </button>
              <button
                className="rounded-md bg-gray-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                type="button"
                disabled={isSaveEditDisabled}
                onClick={() => void onSaveEditPost(post.id)}
              >
                {isEditPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          {editPostError ? (
            <p className="mt-3 text-sm text-red-700">{editPostError}</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-950">{post.content}</p>
      )}

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
