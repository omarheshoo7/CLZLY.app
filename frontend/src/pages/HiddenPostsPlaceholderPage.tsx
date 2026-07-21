import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  getHiddenPostsApi,
  unhidePostApi,
  type FeedPagination,
  type HiddenFeedPost
} from "../lib/api";
import { postTypeLabels } from "../lib/postTypes";

const HIDDEN_POSTS_PAGE_SIZE = 10;

const emptyPagination: FeedPagination = {
  nextCursor: null,
  hasMore: false
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString();
}

function getAuthorName(post: HiddenFeedPost) {
  return post.author?.displayName ?? post.author?.username ?? "Unknown user";
}

export function HiddenPostsPlaceholderPage() {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<HiddenFeedPost[]>([]);
  const [pagination, setPagination] = useState<FeedPagination>(emptyPagination);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadMoreErrorMessage, setLoadMoreErrorMessage] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pendingUnhidePostId, setPendingUnhidePostId] = useState<string | null>(null);
  const [unhideErrorById, setUnhideErrorById] = useState<Record<string, string | null>>({});

  function removeUnhideError(postId: string) {
    setUnhideErrorById((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[postId];
      return nextErrors;
    });
  }

  const loadInitialHiddenPosts = useCallback(async (
    isCurrentRequest: () => boolean = () => true
  ) => {
    if (!accessToken) {
      if (isCurrentRequest()) {
        setPosts([]);
        setPagination(emptyPagination);
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
      const response = await getHiddenPostsApi({
        accessToken,
        limit: HIDDEN_POSTS_PAGE_SIZE
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
      setErrorMessage("Could not load hidden posts.");
    } finally {
      if (isCurrentRequest()) {
        setIsLoadingInitial(false);
      }
    }
  }, [accessToken]);

  useEffect(() => {
    let isCurrentRequest = true;

    void loadInitialHiddenPosts(() => isCurrentRequest);

    return () => {
      isCurrentRequest = false;
    };
  }, [loadInitialHiddenPosts]);

  async function handleLoadMore() {
    if (!accessToken || !pagination.nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setLoadMoreErrorMessage(null);

    try {
      const response = await getHiddenPostsApi({
        accessToken,
        limit: HIDDEN_POSTS_PAGE_SIZE,
        cursor: pagination.nextCursor
      });

      setPosts((currentPosts) => [...currentPosts, ...response.data.posts]);
      setPagination(response.data.pagination);
    } catch {
      setLoadMoreErrorMessage("Could not load more hidden posts.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleUnhidePost(postId: string) {
    if (!accessToken || pendingUnhidePostId) {
      return;
    }

    setPendingUnhidePostId(postId);
    removeUnhideError(postId);
    setPageMessage(null);

    try {
      await unhidePostApi(accessToken, postId);
      setPosts((currentPosts) =>
        currentPosts.filter((currentPost) => currentPost.id !== postId)
      );
      removeUnhideError(postId);
      setPageMessage("Post unhidden.");
    } catch {
      setUnhideErrorById((currentErrors) => ({
        ...currentErrors,
        [postId]: "Could not unhide post."
      }));
    } finally {
      setPendingUnhidePostId(null);
    }
  }

  const shouldShowEmptyState = !isLoadingInitial && !errorMessage && posts.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Hidden
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">Hidden Posts</h1>
        <p className="mt-2 text-gray-600">
          Posts you hide from your feed will appear here.
        </p>
      </header>

      {pageMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {pageMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button
            className="mt-3 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:text-red-800"
            type="button"
            onClick={() => void loadInitialHiddenPosts()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {isLoadingInitial ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
          Loading hidden posts...
        </div>
      ) : null}

      {shouldShowEmptyState ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">No hidden posts yet.</h2>
          <p className="mt-2 text-sm text-gray-600">
            Posts you hide from your feed will appear here.
          </p>
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {posts.map((post) => {
            const wasUpdated = post.updatedAt !== post.createdAt;
            const isUnhidePending = pendingUnhidePostId === post.id;
            const unhideError = unhideErrorById[post.id];

            return (
              <article
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                key={post.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-950">{getAuthorName(post)}</p>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {postTypeLabels[post.type]}
                      </span>
                      {post.savedByMe ? (
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Saved
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Posted {formatDate(post.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Hidden {formatDate(post.hiddenAt)}
                    </p>
                    {wasUpdated ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Updated {formatDate(post.updatedAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <button
                      className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      disabled={isUnhidePending}
                      onClick={() => void handleUnhidePost(post.id)}
                    >
                      {isUnhidePending ? "Unhiding..." : "Unhide"}
                    </button>
                    {unhideError ? (
                      <p className="text-sm text-red-700">{unhideError}</p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {post.content}
                </p>

                {post.imageUrl ? (
                  <img
                    alt=""
                    className="mt-4 max-h-96 w-full rounded-lg border border-gray-200 object-cover"
                    src={post.imageUrl}
                  />
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {pagination.hasMore ? (
        <div className="flex flex-col items-center gap-3">
          {loadMoreErrorMessage ? (
            <p className="text-sm text-red-700">{loadMoreErrorMessage}</p>
          ) : null}
          <button
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLoadingMore}
            onClick={() => void handleLoadMore()}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
