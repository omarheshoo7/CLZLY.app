import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { CreatePostForm } from "../components/CreatePostForm";
import { PostCard } from "../components/PostCard";
import {
  ApiError,
  createCommentApi,
  getFeedApi,
  likePostApi,
  unlikePostApi,
  type FeedPagination,
  type FeedPost
} from "../lib/api";

const emptyPagination: FeedPagination = {
  nextCursor: null,
  hasMore: false
};

function getRequestErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Could not load feed.";
}

export function FeedPlaceholderPage() {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [pagination, setPagination] = useState<FeedPagination>(emptyPagination);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const [pendingLikePostId, setPendingLikePostId] = useState<string | null>(null);
  const [likeErrorByPostId, setLikeErrorByPostId] = useState<Record<string, string | undefined>>({});
  const [commentDraftByPostId, setCommentDraftByPostId] = useState<Record<string, string | undefined>>({});
  const [pendingCommentPostId, setPendingCommentPostId] = useState<string | null>(null);
  const [commentErrorByPostId, setCommentErrorByPostId] = useState<Record<string, string | undefined>>({});
  const [commentSuccessByPostId, setCommentSuccessByPostId] = useState<Record<string, string | undefined>>({});

  const loadInitialFeed = useCallback(async (isCurrentRequest: () => boolean = () => true) => {
    if (!accessToken) {
      if (isCurrentRequest()) {
        setIsLoadingInitial(false);
      }
      return;
    }

    setIsLoadingInitial(true);
    setErrorMessage(null);
    setLoadMoreErrorMessage(null);

    try {
      const response = await getFeedApi(accessToken);

      if (!isCurrentRequest()) {
        return;
      }

      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      if (!isCurrentRequest()) {
        return;
      }

      setPosts([]);
      setPagination(emptyPagination);
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      if (isCurrentRequest()) {
        setIsLoadingInitial(false);
      }
    }
  }, [accessToken]);

  const refreshFirstFeedPage = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    const response = await getFeedApi(accessToken);

    setPosts(response.data.posts);
    setPagination(response.data.pagination);
    setLoadMoreErrorMessage(null);
    setErrorMessage(null);
  }, [accessToken]);

  useEffect(() => {
    let isCurrentRequest = true;

    void loadInitialFeed(() => isCurrentRequest);

    return () => {
      isCurrentRequest = false;
    };
  }, [loadInitialFeed]);

  async function handleLoadMore() {
    if (!accessToken || !pagination.nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);

    try {
      const response = await getFeedApi(accessToken, {
        cursor: pagination.nextCursor
      });

      setPosts((currentPosts) => [...currentPosts, ...response.data.posts]);
      setPagination(response.data.pagination);
    } catch (error) {
      setLoadMoreErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handlePostCreated() {
    await refreshFirstFeedPage();
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

    if (rawContent.length > 1000) {
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
      await createCommentApi(accessToken, postId, {
        content: trimmedContent
      });

      setCommentDraftByPostId((currentDrafts) => ({
        ...currentDrafts,
        [postId]: ""
      }));

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === postId
            ? {
                ...currentPost,
                commentsCount: currentPost.commentsCount + 1
              }
            : currentPost
        )
      );

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

  const hasPosts = posts.length > 0;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-950">Feed</h2>
        <p className="mt-2 text-sm text-gray-600">
          Posts from you and people you follow will appear here.
        </p>
      </div>

      {accessToken ? (
        <CreatePostForm
          accessToken={accessToken}
          onPostCreated={handlePostCreated}
        />
      ) : null}

      {isLoadingInitial ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          Loading feed...
        </div>
      ) : null}

      {!isLoadingInitial && errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-red-900">Could not load feed.</h3>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
          <button
            className="mt-4 rounded-md bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800"
            type="button"
            onClick={() => void loadInitialFeed()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!isLoadingInitial && !errorMessage && !hasPosts ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-950">No posts yet.</h3>
          <p className="mt-2 text-sm text-gray-600">
            Posts from people you follow will appear here.
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
              commentDraft={commentDraftByPostId[post.id] ?? ""}
              isCommentPending={pendingCommentPostId === post.id}
              commentErrorMessage={commentErrorByPostId[post.id] ?? null}
              commentSuccessMessage={commentSuccessByPostId[post.id] ?? null}
              onCommentDraftChange={handleCommentDraftChange}
              onSubmitComment={handleSubmitComment}
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
