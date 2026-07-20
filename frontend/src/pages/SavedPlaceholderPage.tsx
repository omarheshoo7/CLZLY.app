import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { PostCard } from "../components/PostCard";
import {
  createCommentApi,
  deleteCommentApi,
  deletePostApi,
  getPostCommentsApi,
  getSavedPostsApi,
  likePostApi,
  savePostApi,
  unlikePostApi,
  unsavePostApi,
  updatePostApi,
  type FeedPagination,
  type FeedPost,
  type PostComment,
  type PostCommentsPagination
} from "../lib/api";

const SAVED_POSTS_PAGE_SIZE = 20;
const COMMENTS_PAGE_SIZE = 20;
const LATEST_COMMENT_PREVIEW_LIMIT = 1;
const MAX_POST_LENGTH = 2000;
const MAX_COMMENT_LENGTH = 1000;

const emptyPagination: FeedPagination = {
  nextCursor: null,
  hasMore: false
};

function removeRecordEntry<T>(record: Record<string, T>, key: string) {
  const nextRecord = { ...record };
  delete nextRecord[key];
  return nextRecord;
}

export function SavedPlaceholderPage() {
  const { accessToken, user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [pagination, setPagination] = useState<FeedPagination>(emptyPagination);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pendingLikePostId, setPendingLikePostId] = useState<string | null>(null);
  const [likeErrorByPostId, setLikeErrorByPostId] = useState<Record<string, string | undefined>>({});
  const [pendingSavedPostId, setPendingSavedPostId] = useState<string | null>(null);
  const [savedPostErrorById, setSavedPostErrorById] = useState<Record<string, string | undefined>>({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<string, string | undefined>>({});
  const [pendingCommentPostId, setPendingCommentPostId] = useState<string | null>(null);
  const [commentErrorByPostId, setCommentErrorByPostId] = useState<Record<string, string | undefined>>({});
  const [commentSuccessByPostId, setCommentSuccessByPostId] = useState<Record<string, string | undefined>>({});
  const [latestCommentByPostId, setLatestCommentByPostId] = useState<Record<string, PostComment | null | undefined>>({});
  const [latestCommentLoadingByPostId, setLatestCommentLoadingByPostId] = useState<Record<string, boolean | undefined>>({});
  const [expandedCommentsPostIds, setExpandedCommentsPostIds] = useState<Record<string, boolean | undefined>>({});
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, PostComment[] | undefined>>({});
  const [commentsPaginationByPostId, setCommentsPaginationByPostId] = useState<Record<string, PostCommentsPagination | undefined>>({});
  const [commentsLoadingByPostId, setCommentsLoadingByPostId] = useState<Record<string, boolean | undefined>>({});
  const [loadMoreCommentsLoadingByPostId, setLoadMoreCommentsLoadingByPostId] = useState<Record<string, boolean | undefined>>({});
  const [commentsErrorByPostId, setCommentsErrorByPostId] = useState<Record<string, string | undefined>>({});
  const [loadMoreCommentsErrorByPostId, setLoadMoreCommentsErrorByPostId] = useState<Record<string, string | undefined>>({});
  const [pendingDeletePostId, setPendingDeletePostId] = useState<string | null>(null);
  const [deletePostErrorById, setDeletePostErrorById] = useState<Record<string, string | undefined>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostDraftById, setEditPostDraftById] = useState<Record<string, string | undefined>>({});
  const [pendingEditPostId, setPendingEditPostId] = useState<string | null>(null);
  const [editPostErrorById, setEditPostErrorById] = useState<Record<string, string | undefined>>({});
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);
  const [deleteCommentErrorByCommentId, setDeleteCommentErrorByCommentId] = useState<Record<string, string | undefined>>({});

  function clearPostLocalState(postId: string) {
    setLikeErrorByPostId((currentErrors) => removeRecordEntry(currentErrors, postId));
    setSavedPostErrorById((currentErrors) => removeRecordEntry(currentErrors, postId));
    setCommentDraftByPostId((currentDrafts) => removeRecordEntry(currentDrafts, postId));
    setCommentErrorByPostId((currentErrors) => removeRecordEntry(currentErrors, postId));
    setCommentSuccessByPostId((currentSuccesses) => removeRecordEntry(currentSuccesses, postId));
    setLatestCommentByPostId((currentComments) => removeRecordEntry(currentComments, postId));
    setLatestCommentLoadingByPostId((currentLoading) => removeRecordEntry(currentLoading, postId));
    setExpandedCommentsPostIds((currentExpanded) => removeRecordEntry(currentExpanded, postId));
    setCommentsByPostId((currentComments) => removeRecordEntry(currentComments, postId));
    setCommentsPaginationByPostId((currentPagination) => removeRecordEntry(currentPagination, postId));
    setCommentsLoadingByPostId((currentLoading) => removeRecordEntry(currentLoading, postId));
    setLoadMoreCommentsLoadingByPostId((currentLoading) => removeRecordEntry(currentLoading, postId));
    setCommentsErrorByPostId((currentErrors) => removeRecordEntry(currentErrors, postId));
    setLoadMoreCommentsErrorByPostId((currentErrors) => removeRecordEntry(currentErrors, postId));
    setDeletePostErrorById((currentErrors) => removeRecordEntry(currentErrors, postId));
    setEditPostDraftById((currentDrafts) => removeRecordEntry(currentDrafts, postId));
    setEditPostErrorById((currentErrors) => removeRecordEntry(currentErrors, postId));
    setPendingSavedPostId((currentPendingPostId) =>
      currentPendingPostId === postId ? null : currentPendingPostId
    );
    setEditingPostId((currentEditingPostId) =>
      currentEditingPostId === postId ? null : currentEditingPostId
    );
  }

  const loadInitialSavedPosts = useCallback(async (isCurrentRequest: () => boolean = () => true) => {
    if (!accessToken) {
      if (isCurrentRequest()) {
        setIsLoadingInitial(false);
      }
      return;
    }

    setIsLoadingInitial(true);
    setErrorMessage(null);
    setLoadMoreErrorMessage(null);
    setPageMessage(null);
    setPosts([]);
    setPagination(emptyPagination);

    try {
      const response = await getSavedPostsApi(accessToken, {
        limit: SAVED_POSTS_PAGE_SIZE
      });

      if (!isCurrentRequest()) {
        return;
      }

      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch {
      if (!isCurrentRequest()) {
        return;
      }

      setPosts([]);
      setPagination(emptyPagination);
      setErrorMessage("Could not load saved posts.");
    } finally {
      if (isCurrentRequest()) {
        setIsLoadingInitial(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    let isCurrentRequest = true;

    void loadInitialSavedPosts(() => isCurrentRequest);

    return () => {
      isCurrentRequest = false;
    };
  }, [loadInitialSavedPosts]);

  useEffect(() => {
    if (!accessToken || posts.length === 0) {
      return;
    }

    let isCurrentRequest = true;

    for (const post of posts) {
      if (
        post.commentsCount === 0 ||
        latestCommentByPostId[post.id] !== undefined ||
        latestCommentLoadingByPostId[post.id]
      ) {
        continue;
      }

      setLatestCommentLoadingByPostId((currentLoading) => ({
        ...currentLoading,
        [post.id]: true
      }));

      void getPostCommentsApi(accessToken, post.id, {
        limit: LATEST_COMMENT_PREVIEW_LIMIT,
        sort: "latest"
      })
        .then((response) => {
          if (!isCurrentRequest) {
            return;
          }

          setLatestCommentByPostId((currentComments) => ({
            ...currentComments,
            [post.id]: response.data.comments[0] ?? null
          }));
        })
        .catch(() => {
          if (!isCurrentRequest) {
            return;
          }

          setLatestCommentByPostId((currentComments) => ({
            ...currentComments,
            [post.id]: null
          }));
        })
        .finally(() => {
          if (!isCurrentRequest) {
            return;
          }

          setLatestCommentLoadingByPostId((currentLoading) => ({
            ...currentLoading,
            [post.id]: false
          }));
        });
    }

    return () => {
      isCurrentRequest = false;
    };
  }, [accessToken, posts]);

  async function handleLoadMore() {
    if (!accessToken || !pagination.nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);

    try {
      const response = await getSavedPostsApi(accessToken, {
        limit: SAVED_POSTS_PAGE_SIZE,
        cursor: pagination.nextCursor
      });

      setPosts((currentPosts) => [...currentPosts, ...response.data.posts]);
      setPagination(response.data.pagination);
    } catch {
      setLoadMoreErrorMessage("Could not load more saved posts.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function clearLikeError(postId: string) {
    setLikeErrorByPostId((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));
  }

  async function handleToggleLike(post: FeedPost) {
    if (!accessToken || pendingLikePostId) {
      return;
    }

    setPendingLikePostId(post.id);
    clearLikeError(post.id);
    setPageMessage(null);

    try {
      if (post.likedByMe) {
        await unlikePostApi(accessToken, post.id);
        setPosts((currentPosts) =>
          currentPosts.map((currentPost) =>
            currentPost.id === post.id
              ? {
                  ...currentPost,
                  likedByMe: false,
                  likesCount: Math.max(0, currentPost.likesCount - 1)
                }
              : currentPost
          )
        );
      } else {
        await likePostApi(accessToken, post.id);
        setPosts((currentPosts) =>
          currentPosts.map((currentPost) =>
            currentPost.id === post.id
              ? {
                  ...currentPost,
                  likedByMe: true,
                  likesCount: currentPost.likesCount + 1
                }
              : currentPost
          )
        );
      }
    } catch {
      setLikeErrorByPostId((currentErrors) => ({
        ...currentErrors,
        [post.id]: "Could not update like."
      }));
    } finally {
      setPendingLikePostId(null);
    }
  }

  async function handleToggleSavedPost(post: FeedPost) {
    if (!accessToken || pendingSavedPostId) {
      return;
    }

    setPendingSavedPostId(post.id);
    setSavedPostErrorById((currentErrors) => ({
      ...currentErrors,
      [post.id]: undefined
    }));
    setPageMessage(null);

    try {
      if (post.savedByMe) {
        await unsavePostApi(accessToken, post.id);
        setPosts((currentPosts) =>
          currentPosts.filter((currentPost) => currentPost.id !== post.id)
        );
        clearPostLocalState(post.id);
        setPageMessage("Post removed from Saved.");
      } else {
        await savePostApi(accessToken, post.id);
        setPosts((currentPosts) =>
          currentPosts.map((currentPost) =>
            currentPost.id === post.id
              ? {
                  ...currentPost,
                  savedByMe: true
                }
              : currentPost
          )
        );
      }
    } catch {
      setSavedPostErrorById((currentErrors) => ({
        ...currentErrors,
        [post.id]: "Could not update saved post."
      }));
    } finally {
      setPendingSavedPostId(null);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!accessToken || pendingDeletePostId) {
      return;
    }

    const shouldDelete = window.confirm("Delete this post? This cannot be undone.");

    if (!shouldDelete) {
      return;
    }

    setPendingDeletePostId(postId);
    setDeletePostErrorById((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));
    setPageMessage(null);

    try {
      await deletePostApi({
        accessToken,
        postId
      });

      setPosts((currentPosts) =>
        currentPosts.filter((currentPost) => currentPost.id !== postId)
      );
      clearPostLocalState(postId);
    } catch {
      setDeletePostErrorById((currentErrors) => ({
        ...currentErrors,
        [postId]: "Could not delete post."
      }));
    } finally {
      setPendingDeletePostId(null);
    }
  }

  function handleStartEditPost(post: FeedPost) {
    setEditingPostId(post.id);
    setEditPostDraftById((currentDrafts) => ({
      ...currentDrafts,
      [post.id]: post.content
    }));
    setEditPostErrorById((currentErrors) => ({
      ...currentErrors,
      [post.id]: undefined
    }));
    setPageMessage(null);
  }

  function handleCancelEditPost(postId: string) {
    setEditingPostId((currentEditingPostId) =>
      currentEditingPostId === postId ? null : currentEditingPostId
    );
    setEditPostDraftById((currentDrafts) => removeRecordEntry(currentDrafts, postId));
    setEditPostErrorById((currentErrors) => removeRecordEntry(currentErrors, postId));
  }

  function handleEditPostDraftChange(postId: string, value: string) {
    setEditPostDraftById((currentDrafts) => ({
      ...currentDrafts,
      [postId]: value
    }));
    setEditPostErrorById((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));
  }

  async function handleSaveEditPost(postId: string) {
    if (!accessToken || pendingEditPostId) {
      return;
    }

    const currentPost = posts.find((post) => post.id === postId);

    if (!currentPost) {
      return;
    }

    const rawDraft = editPostDraftById[postId] ?? "";
    const trimmedDraft = rawDraft.trim();

    if (!trimmedDraft) {
      setEditPostErrorById((currentErrors) => ({
        ...currentErrors,
        [postId]: "Post content is required."
      }));
      return;
    }

    if (trimmedDraft === currentPost.content.trim()) {
      return;
    }

    if (rawDraft.length > MAX_POST_LENGTH) {
      setEditPostErrorById((currentErrors) => ({
        ...currentErrors,
        [postId]: "Post content must be 2000 characters or less."
      }));
      return;
    }

    setPendingEditPostId(postId);
    setEditPostErrorById((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));
    setPageMessage(null);

    try {
      const response = await updatePostApi({
        accessToken,
        postId,
        content: trimmedDraft
      });

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                ...response.data.post,
                likesCount: post.likesCount,
                likedByMe: post.likedByMe,
                commentsCount: post.commentsCount,
                savedByMe: post.savedByMe
              }
            : post
        )
      );

      setEditingPostId(null);
      setEditPostDraftById((currentDrafts) => removeRecordEntry(currentDrafts, postId));
      setEditPostErrorById((currentErrors) => removeRecordEntry(currentErrors, postId));
    } catch {
      setEditPostErrorById((currentErrors) => ({
        ...currentErrors,
        [postId]: "Could not update post."
      }));
    } finally {
      setPendingEditPostId(null);
    }
  }

  function handleCommentDraftChange(postId: string, value: string) {
    setCommentDraftByPostId((currentDrafts) => ({
      ...currentDrafts,
      [postId]: value
    }));
    setCommentErrorByPostId((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));
    setCommentSuccessByPostId((currentSuccesses) => ({
      ...currentSuccesses,
      [postId]: undefined
    }));
    setPageMessage(null);
  }

  async function handleSubmitComment(postId: string) {
    if (!accessToken || pendingCommentPostId) {
      return;
    }

    const rawContent = commentDraftByPostId[postId] ?? "";
    const trimmedContent = rawContent.trim();

    if (!trimmedContent) {
      setCommentErrorByPostId((currentErrors) => ({
        ...currentErrors,
        [postId]: "Comment content is required."
      }));
      return;
    }

    if (rawContent.length > MAX_COMMENT_LENGTH) {
      setCommentErrorByPostId((currentErrors) => ({
        ...currentErrors,
        [postId]: "Comment content must be 1000 characters or less."
      }));
      return;
    }

    setPendingCommentPostId(postId);
    setCommentErrorByPostId((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));
    setCommentSuccessByPostId((currentSuccesses) => ({
      ...currentSuccesses,
      [postId]: undefined
    }));

    try {
      const response = await createCommentApi(accessToken, postId, {
        content: trimmedContent
      });
      const createdComment = response.data.comment;

      setCommentDraftByPostId((currentDrafts) => ({
        ...currentDrafts,
        [postId]: ""
      }));

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                commentsCount: post.commentsCount + 1
              }
            : post
        )
      );

      setLatestCommentByPostId((currentComments) => ({
        ...currentComments,
        [postId]: createdComment
      }));

      if (expandedCommentsPostIds[postId]) {
        setCommentsByPostId((currentComments) => ({
          ...currentComments,
          [postId]: [...(currentComments[postId] ?? []), createdComment]
        }));
      }

      setCommentSuccessByPostId((currentSuccesses) => ({
        ...currentSuccesses,
        [postId]: "Comment posted."
      }));
    } catch {
      setCommentErrorByPostId((currentErrors) => ({
        ...currentErrors,
        [postId]: "Could not add comment."
      }));
    } finally {
      setPendingCommentPostId(null);
    }
  }

  async function handleToggleComments(postId: string) {
    if (!accessToken || commentsLoadingByPostId[postId]) {
      return;
    }

    if (expandedCommentsPostIds[postId]) {
      setExpandedCommentsPostIds((currentExpanded) => ({
        ...currentExpanded,
        [postId]: false
      }));
      return;
    }

    setExpandedCommentsPostIds((currentExpanded) => ({
      ...currentExpanded,
      [postId]: true
    }));

    if (commentsByPostId[postId]) {
      return;
    }

    setCommentsLoadingByPostId((currentLoading) => ({
      ...currentLoading,
      [postId]: true
    }));
    setCommentsErrorByPostId((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));

    try {
      const response = await getPostCommentsApi(accessToken, postId, {
        limit: COMMENTS_PAGE_SIZE,
        sort: "oldest"
      });

      setCommentsByPostId((currentComments) => ({
        ...currentComments,
        [postId]: response.data.comments
      }));
      setCommentsPaginationByPostId((currentPagination) => ({
        ...currentPagination,
        [postId]: response.data.pagination
      }));
    } catch {
      setCommentsErrorByPostId((currentErrors) => ({
        ...currentErrors,
        [postId]: "Could not load comments."
      }));
    } finally {
      setCommentsLoadingByPostId((currentLoading) => ({
        ...currentLoading,
        [postId]: false
      }));
    }
  }

  async function handleLoadMoreComments(postId: string) {
    if (!accessToken || loadMoreCommentsLoadingByPostId[postId]) {
      return;
    }

    const nextCursor = commentsPaginationByPostId[postId]?.nextCursor;

    if (!nextCursor) {
      return;
    }

    setLoadMoreCommentsLoadingByPostId((currentLoading) => ({
      ...currentLoading,
      [postId]: true
    }));
    setLoadMoreCommentsErrorByPostId((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));

    try {
      const response = await getPostCommentsApi(accessToken, postId, {
        limit: COMMENTS_PAGE_SIZE,
        cursor: nextCursor,
        sort: "oldest"
      });

      setCommentsByPostId((currentComments) => ({
        ...currentComments,
        [postId]: [...(currentComments[postId] ?? []), ...response.data.comments]
      }));
      setCommentsPaginationByPostId((currentPagination) => ({
        ...currentPagination,
        [postId]: response.data.pagination
      }));
    } catch {
      setLoadMoreCommentsErrorByPostId((currentErrors) => ({
        ...currentErrors,
        [postId]: "Could not load more comments."
      }));
    } finally {
      setLoadMoreCommentsLoadingByPostId((currentLoading) => ({
        ...currentLoading,
        [postId]: false
      }));
    }
  }

  async function handleDeleteComment(postId: string, comment: PostComment) {
    if (!accessToken || pendingDeleteCommentId) {
      return;
    }

    setPendingDeleteCommentId(comment.id);
    setDeleteCommentErrorByCommentId((currentErrors) => ({
      ...currentErrors,
      [comment.id]: undefined
    }));

    try {
      await deleteCommentApi(accessToken, postId, comment.id);

      const currentLoadedComments = commentsByPostId[postId] ?? [];
      const remainingLoadedComments = currentLoadedComments.filter(
        (currentComment) => currentComment.id !== comment.id
      );

      setCommentsByPostId((currentComments) => ({
        ...currentComments,
        [postId]: remainingLoadedComments
      }));

      setCommentsPaginationByPostId((currentPagination) => {
        const postPagination = currentPagination[postId];

        if (!postPagination || postPagination.nextCursor !== comment.id) {
          return currentPagination;
        }

        const nextCursor = remainingLoadedComments.at(-1)?.id ?? null;

        return {
          ...currentPagination,
          [postId]: {
            ...postPagination,
            nextCursor,
            hasMore: nextCursor ? postPagination.hasMore : false
          }
        };
      });

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                commentsCount: Math.max(0, post.commentsCount - 1)
              }
            : post
        )
      );

      setDeleteCommentErrorByCommentId((currentErrors) => ({
        ...currentErrors,
        [comment.id]: undefined
      }));

      if (latestCommentByPostId[postId]?.id === comment.id) {
        try {
          const response = await getPostCommentsApi(accessToken, postId, {
            limit: LATEST_COMMENT_PREVIEW_LIMIT,
            sort: "latest"
          });

          setLatestCommentByPostId((currentLatestComments) => ({
            ...currentLatestComments,
            [postId]: response.data.comments[0] ?? null
          }));
        } catch {
          setLatestCommentByPostId((currentLatestComments) => ({
            ...currentLatestComments,
            [postId]: null
          }));
        }
      }
    } catch {
      setDeleteCommentErrorByCommentId((currentErrors) => ({
        ...currentErrors,
        [comment.id]: "Could not delete comment."
      }));
    } finally {
      setPendingDeleteCommentId(null);
    }
  }

  const hasPosts = posts.length > 0;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-950">Saved</h2>
        <p className="mt-2 text-sm text-gray-600">
          Posts you saved will appear here.
        </p>
      </div>

      {pageMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800 shadow-sm">
          {pageMessage}
        </div>
      ) : null}

      {isLoadingInitial ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          Loading saved posts...
        </div>
      ) : null}

      {!isLoadingInitial && errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-red-900">Could not load saved posts.</h3>
          <button
            className="mt-4 rounded-md bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            type="button"
            onClick={() => void loadInitialSavedPosts()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoadingInitial && !errorMessage && !hasPosts ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-950">No saved posts yet.</h3>
          <p className="mt-2 text-sm text-gray-600">
            Save posts from your feed to find them here later.
          </p>
        </div>
      ) : null}

      {!isLoadingInitial && !errorMessage && hasPosts ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isLikePending={pendingLikePostId === post.id}
              likeErrorMessage={likeErrorByPostId[post.id] ?? null}
              onToggleLike={handleToggleLike}
              isSavePending={pendingSavedPostId === post.id}
              savedPostError={savedPostErrorById[post.id] ?? null}
              onToggleSavedPost={handleToggleSavedPost}
              commentDraft={commentDraftByPostId[post.id] ?? ""}
              isCommentPending={pendingCommentPostId === post.id}
              commentErrorMessage={commentErrorByPostId[post.id] ?? null}
              commentSuccessMessage={commentSuccessByPostId[post.id] ?? null}
              onCommentDraftChange={handleCommentDraftChange}
              onSubmitComment={handleSubmitComment}
              latestComment={latestCommentByPostId[post.id] ?? null}
              comments={commentsByPostId[post.id] ?? []}
              areCommentsExpanded={expandedCommentsPostIds[post.id] ?? false}
              isLatestCommentLoading={latestCommentLoadingByPostId[post.id] ?? false}
              isCommentsLoading={commentsLoadingByPostId[post.id] ?? false}
              isLoadingMoreComments={loadMoreCommentsLoadingByPostId[post.id] ?? false}
              commentsErrorMessage={commentsErrorByPostId[post.id] ?? null}
              loadMoreCommentsErrorMessage={loadMoreCommentsErrorByPostId[post.id] ?? null}
              hasMoreComments={commentsPaginationByPostId[post.id]?.hasMore ?? false}
              currentUserId={user?.id ?? null}
              pendingDeletePostId={pendingDeletePostId}
              deletePostError={deletePostErrorById[post.id] ?? null}
              isEditingPost={editingPostId === post.id}
              editPostDraft={editPostDraftById[post.id] ?? post.content}
              isEditPending={pendingEditPostId === post.id}
              editPostError={editPostErrorById[post.id] ?? null}
              pendingDeleteCommentId={pendingDeleteCommentId}
              deleteCommentErrorByCommentId={deleteCommentErrorByCommentId}
              onDeletePost={handleDeletePost}
              onStartEditPost={handleStartEditPost}
              onCancelEditPost={handleCancelEditPost}
              onEditPostDraftChange={handleEditPostDraftChange}
              onSaveEditPost={handleSaveEditPost}
              onToggleComments={handleToggleComments}
              onLoadMoreComments={handleLoadMoreComments}
              onDeleteComment={handleDeleteComment}
            />
          ))}
        </div>
      ) : null}

      {!isLoadingInitial && !errorMessage && pagination.hasMore ? (
        <div className="flex flex-col items-center gap-3">
          {loadMoreErrorMessage ? (
            <p className="text-sm text-red-700">{loadMoreErrorMessage}</p>
          ) : null}
          <button
            className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            type="button"
            onClick={() => void handleLoadMore()}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
