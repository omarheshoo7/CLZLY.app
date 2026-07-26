import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { PostCard } from "../components/PostCard";
import {
  ApiError,
  acceptFollowRequestApi,
  createCommentApi,
  deleteCommentApi,
  deletePostApi,
  followUserApi,
  getPostCommentsApi,
  getProfilePostsApi,
  getUserFollowersApi,
  getUserFollowingApi,
  getUserProfileApi,
  hidePostApi,
  isPendingFollowRequestError,
  likePostApi,
  rejectFollowRequestApi,
  savePostApi,
  unlikePostApi,
  unfollowUserApi,
  unsavePostApi,
  updatePostApi,
  type FeedPagination,
  type FeedPost,
  type FollowStatus,
  type PostComment,
  type PostCommentsPagination,
  type SocialGraphPagination,
  type SocialGraphUser,
  type UserFollowStatus,
  type UserProfile,
  type UserProfileData
} from "../lib/api";

const PROFILE_POSTS_PAGE_SIZE = 20;
const SOCIAL_GRAPH_PAGE_SIZE = 20;
const COMMENTS_PAGE_SIZE = 20;
const LATEST_COMMENT_PREVIEW_LIMIT = 1;
const emptyPostsPagination: FeedPagination = {
  nextCursor: null,
  hasMore: false
};
const emptySocialGraphPagination: SocialGraphPagination = {
  nextCursor: null,
  hasMore: false
};

type SocialGraphTab = "followers" | "following";

function formatSuccessMessage(message: string | undefined, fallback: string) {
  const nextMessage = message ?? fallback;

  return /[.!?]$/.test(nextMessage) ? nextMessage : `${nextMessage}.`;
}

function getDisplayName(user: UserProfile) {
  return user.displayName?.trim() || user.username;
}

function getFallbackLetter(user: UserProfile) {
  return getDisplayName(user).charAt(0).toUpperCase() || "?";
}

function getSocialGraphDisplayName(user: SocialGraphUser) {
  return user.displayName?.trim() || user.username;
}

function getSocialGraphFallbackLetter(user: SocialGraphUser) {
  return user.username.charAt(0).toUpperCase() || "?";
}

function getFollowSuccessFallback(status: FollowStatus) {
  return status === "PENDING"
    ? "Follow request sent successfully."
    : "User followed successfully.";
}

function removeRecordEntry<T>(record: Record<string, T>, key: string) {
  const nextRecord = { ...record };
  delete nextRecord[key];
  return nextRecord;
}

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowActionPending, setIsFollowActionPending] = useState(false);
  const [pendingFollowRequestAction, setPendingFollowRequestAction] =
    useState<"accept" | "decline" | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsPagination, setPostsPagination] = useState<FeedPagination>(emptyPostsPagination);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [postsErrorMessage, setPostsErrorMessage] = useState<string | null>(null);
  const [loadMorePostsErrorMessage, setLoadMorePostsErrorMessage] = useState<string | null>(null);
  const [postActionMessage, setPostActionMessage] = useState<string | null>(null);
  const [activeSocialGraphTab, setActiveSocialGraphTab] = useState<SocialGraphTab>("followers");
  const [socialGraphUsers, setSocialGraphUsers] = useState<SocialGraphUser[]>([]);
  const [socialGraphPagination, setSocialGraphPagination] =
    useState<SocialGraphPagination>(emptySocialGraphPagination);
  const [isSocialGraphLoading, setIsSocialGraphLoading] = useState(false);
  const [isLoadingMoreSocialGraph, setIsLoadingMoreSocialGraph] = useState(false);
  const [socialGraphErrorMessage, setSocialGraphErrorMessage] = useState<string | null>(null);
  const [loadMoreSocialGraphErrorMessage, setLoadMoreSocialGraphErrorMessage] =
    useState<string | null>(null);
  const [isSocialGraphPrivate, setIsSocialGraphPrivate] = useState(false);
  const [pendingLikePostId, setPendingLikePostId] = useState<string | null>(null);
  const [likeErrorByPostId, setLikeErrorByPostId] = useState<Record<string, string | undefined>>({});
  const [pendingSavedPostId, setPendingSavedPostId] = useState<string | null>(null);
  const [savedPostErrorById, setSavedPostErrorById] = useState<Record<string, string | undefined>>({});
  const [pendingHidePostId, setPendingHidePostId] = useState<string | null>(null);
  const [hidePostErrorById, setHidePostErrorById] = useState<Record<string, string | null>>({});
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
  const currentProfileUsernameRef = useRef<string | null>(null);
  const currentRouteUsernameRef = useRef<string | null>(null);
  const activeSocialGraphTabRef = useRef<SocialGraphTab>("followers");

  currentRouteUsernameRef.current = username ?? null;

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadProfile() {
      setIsLoading(true);
      setProfile(null);
      setSuccessMessage(null);
      setErrorMessage(null);

      if (!username || !accessToken) {
        if (isCurrentRequest) {
          setErrorMessage("Could not load profile.");
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await getUserProfileApi(accessToken, username);

        if (isCurrentRequest) {
          setProfile(response.data);
        }
      } catch {
        if (isCurrentRequest) {
          setProfile(null);
          setErrorMessage("Could not load profile.");
        }
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isCurrentRequest = false;
    };
  }, [accessToken, username]);

  async function refreshProfile() {
    if (!accessToken || !username) {
      throw new Error("Profile cannot be refreshed");
    }

    const response = await getUserProfileApi(accessToken, username);

    setProfile(response.data);
    setSocialGraphUsers([]);
    setSocialGraphPagination(emptySocialGraphPagination);
    setSocialGraphErrorMessage(null);
    setLoadMoreSocialGraphErrorMessage(null);
    setIsSocialGraphPrivate(false);
  }

  useEffect(() => {
    currentProfileUsernameRef.current = profile?.user.username ?? null;
  }, [profile?.user.username]);

  useEffect(() => {
    activeSocialGraphTabRef.current = activeSocialGraphTab;
  }, [activeSocialGraphTab]);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadProfilePosts() {
      setPosts([]);
      setPostsPagination(emptyPostsPagination);
      setPostsErrorMessage(null);
      setLoadMorePostsErrorMessage(null);
      setPostActionMessage(null);

      if (!accessToken || !profile || !profile.user.username || !profile.canViewPosts) {
        setIsPostsLoading(false);
        return;
      }

      setIsPostsLoading(true);

      try {
        const response = await getProfilePostsApi(accessToken, profile.user.username, {
          limit: PROFILE_POSTS_PAGE_SIZE
        });

        if (!isCurrentRequest) {
          return;
        }

        setPosts(response.data.posts);
        setPostsPagination(response.data.pagination);
        setPostsErrorMessage(null);
        setLoadMorePostsErrorMessage(null);
      } catch {
        if (!isCurrentRequest) {
          return;
        }

        setPosts([]);
        setPostsPagination(emptyPostsPagination);
        setPostsErrorMessage("Could not load posts.");
        setLoadMorePostsErrorMessage(null);
      } finally {
        if (isCurrentRequest) {
          setIsPostsLoading(false);
        }
      }
    }

    void loadProfilePosts();

    return () => {
      isCurrentRequest = false;
    };
  }, [accessToken, profile?.canViewPosts, profile?.user.username]);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadSocialGraph() {
      setSocialGraphUsers([]);
      setSocialGraphPagination(emptySocialGraphPagination);
      setSocialGraphErrorMessage(null);
      setLoadMoreSocialGraphErrorMessage(null);
      setIsSocialGraphPrivate(false);

      if (!accessToken || !profile || !profile.user.username) {
        setIsSocialGraphLoading(false);
        return;
      }

      if (!profile.canViewPosts) {
        setIsSocialGraphPrivate(true);
        setIsSocialGraphLoading(false);
        return;
      }

      const targetUsername = profile.user.username;
      const targetTab = activeSocialGraphTab;

      setIsSocialGraphLoading(true);

      try {
        const response = targetTab === "followers"
          ? await getUserFollowersApi(accessToken, targetUsername, {
              limit: SOCIAL_GRAPH_PAGE_SIZE
            })
          : await getUserFollowingApi(accessToken, targetUsername, {
              limit: SOCIAL_GRAPH_PAGE_SIZE
            });

        if (
          !isCurrentRequest ||
          currentProfileUsernameRef.current !== targetUsername ||
          activeSocialGraphTabRef.current !== targetTab
        ) {
          return;
        }

        const nextUsers = "followers" in response.data
          ? response.data.followers
          : response.data.following;

        setSocialGraphUsers(nextUsers);
        setSocialGraphPagination(response.data.pagination);
        setSocialGraphErrorMessage(null);
        setLoadMoreSocialGraphErrorMessage(null);
        setIsSocialGraphPrivate(false);
      } catch (error) {
        if (
          !isCurrentRequest ||
          currentProfileUsernameRef.current !== targetUsername ||
          activeSocialGraphTabRef.current !== targetTab
        ) {
          return;
        }

        if (error instanceof ApiError && error.statusCode === 403) {
          setIsSocialGraphPrivate(true);
          setSocialGraphErrorMessage(null);
        } else {
          setSocialGraphErrorMessage(
            targetTab === "followers"
              ? "Could not load followers."
              : "Could not load following."
          );
        }

        setSocialGraphUsers([]);
        setSocialGraphPagination(emptySocialGraphPagination);
        setLoadMoreSocialGraphErrorMessage(null);
      } finally {
        if (
          isCurrentRequest &&
          currentProfileUsernameRef.current === profile.user.username &&
          activeSocialGraphTabRef.current === activeSocialGraphTab
        ) {
          setIsSocialGraphLoading(false);
        }
      }
    }

    void loadSocialGraph();

    return () => {
      isCurrentRequest = false;
    };
  }, [accessToken, activeSocialGraphTab, profile?.canViewPosts, profile?.user.username]);

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

  function updateProfileFollowState(
    targetUsername: string,
    followStatus: UserFollowStatus,
    canViewPosts: boolean,
    followersCountDelta = 0
  ) {
    setProfile((currentProfile) => {
      if (!currentProfile || currentProfile.user.username !== targetUsername) {
        return currentProfile;
      }

      return {
        ...currentProfile,
        canViewPosts,
        stats: {
          ...currentProfile.stats,
          followersCount: Math.max(0, currentProfile.stats.followersCount + followersCountDelta)
        },
        user: {
          ...currentProfile.user,
          followStatus
        }
      };
    });
  }

  function clearLikeError(postId: string) {
    setLikeErrorByPostId((currentErrors) => ({
      ...currentErrors,
      [postId]: undefined
    }));
  }

  function clearPostLocalState(postId: string) {
    setLikeErrorByPostId((currentErrors) => removeRecordEntry(currentErrors, postId));
    setSavedPostErrorById((currentErrors) => removeRecordEntry(currentErrors, postId));
    setHidePostErrorById((currentErrors) => removeRecordEntry(currentErrors, postId));
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
    setPendingLikePostId((currentPendingPostId) =>
      currentPendingPostId === postId ? null : currentPendingPostId
    );
    setPendingSavedPostId((currentPendingPostId) =>
      currentPendingPostId === postId ? null : currentPendingPostId
    );
    setPendingHidePostId((currentPendingPostId) =>
      currentPendingPostId === postId ? null : currentPendingPostId
    );
    setPendingCommentPostId((currentPendingPostId) =>
      currentPendingPostId === postId ? null : currentPendingPostId
    );
    setPendingDeletePostId((currentPendingPostId) =>
      currentPendingPostId === postId ? null : currentPendingPostId
    );
    setPendingEditPostId((currentPendingPostId) =>
      currentPendingPostId === postId ? null : currentPendingPostId
    );
    setEditingPostId((currentEditingPostId) =>
      currentEditingPostId === postId ? null : currentEditingPostId
    );
  }

  function removePostFromProfile(postId: string) {
    setPosts((currentPosts) =>
      currentPosts.filter((currentPost) => currentPost.id !== postId)
    );
    clearPostLocalState(postId);
  }

  async function handleLoadMoreSocialGraph() {
    if (
      !accessToken ||
      !profile ||
      !socialGraphPagination.nextCursor ||
      isLoadingMoreSocialGraph ||
      isSocialGraphPrivate
    ) {
      return;
    }

    const targetUsername = profile.user.username;
    const targetTab = activeSocialGraphTab;

    setIsLoadingMoreSocialGraph(true);
    setLoadMoreSocialGraphErrorMessage(null);

    try {
      const response = targetTab === "followers"
        ? await getUserFollowersApi(accessToken, targetUsername, {
            limit: SOCIAL_GRAPH_PAGE_SIZE,
            cursor: socialGraphPagination.nextCursor
          })
        : await getUserFollowingApi(accessToken, targetUsername, {
            limit: SOCIAL_GRAPH_PAGE_SIZE,
            cursor: socialGraphPagination.nextCursor
          });

      if (
        currentProfileUsernameRef.current !== targetUsername ||
        activeSocialGraphTabRef.current !== targetTab
      ) {
        return;
      }

      const nextUsers = "followers" in response.data
        ? response.data.followers
        : response.data.following;

      setSocialGraphUsers((currentUsers) => [...currentUsers, ...nextUsers]);
      setSocialGraphPagination(response.data.pagination);
      setLoadMoreSocialGraphErrorMessage(null);
    } catch (error) {
      if (
        currentProfileUsernameRef.current !== targetUsername ||
        activeSocialGraphTabRef.current !== targetTab
      ) {
        return;
      }

      if (error instanceof ApiError && error.statusCode === 403) {
        setIsSocialGraphPrivate(true);
        setLoadMoreSocialGraphErrorMessage(null);
      } else {
        setLoadMoreSocialGraphErrorMessage(
          targetTab === "followers"
            ? "Could not load followers."
            : "Could not load following."
        );
      }
    } finally {
      if (
        currentProfileUsernameRef.current === targetUsername &&
        activeSocialGraphTabRef.current === targetTab
      ) {
        setIsLoadingMoreSocialGraph(false);
      }
    }
  }

  async function handleLoadMorePosts() {
    if (!accessToken || !profile || !postsPagination.nextCursor || isLoadingMorePosts) {
      return;
    }

    const targetUsername = profile.user.username;

    setIsLoadingMorePosts(true);
    setLoadMorePostsErrorMessage(null);

    try {
      const response = await getProfilePostsApi(accessToken, targetUsername, {
        limit: PROFILE_POSTS_PAGE_SIZE,
        cursor: postsPagination.nextCursor
      });

      if (
        currentProfileUsernameRef.current !== targetUsername ||
        currentRouteUsernameRef.current !== targetUsername
      ) {
        return;
      }

      setPosts((currentPosts) => [...currentPosts, ...response.data.posts]);
      setPostsPagination(response.data.pagination);
      setLoadMorePostsErrorMessage(null);
    } catch {
      if (
        currentProfileUsernameRef.current !== targetUsername ||
        currentRouteUsernameRef.current !== targetUsername
      ) {
        return;
      }

      setLoadMorePostsErrorMessage("Could not load posts.");
    } finally {
      setIsLoadingMorePosts(false);
    }
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

  async function handleToggleSavedPost(post: FeedPost) {
    if (!accessToken || pendingSavedPostId) {
      return;
    }

    setPendingSavedPostId(post.id);
    setSavedPostErrorById((currentErrors) => ({
      ...currentErrors,
      [post.id]: undefined
    }));

    try {
      if (post.savedByMe) {
        await unsavePostApi(accessToken, post.id);
      } else {
        await savePostApi(accessToken, post.id);
      }

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === post.id
            ? {
                ...currentPost,
                savedByMe: !post.savedByMe
              }
            : currentPost
        )
      );
    } catch {
      setSavedPostErrorById((currentErrors) => ({
        ...currentErrors,
        [post.id]: "Could not update saved post."
      }));
    } finally {
      setPendingSavedPostId(null);
    }
  }

  async function handleHidePost(postId: string) {
    if (!accessToken || pendingHidePostId) {
      return;
    }

    setPendingHidePostId(postId);
    setHidePostErrorById((currentErrors) => ({
      ...currentErrors,
      [postId]: null
    }));
    setPostActionMessage(null);

    try {
      await hidePostApi(accessToken, postId);
      removePostFromProfile(postId);
      setPostActionMessage("Post hidden.");
    } catch {
      setHidePostErrorById((currentErrors) => ({
        ...currentErrors,
        [postId]: "Could not hide post."
      }));
    } finally {
      setPendingHidePostId(null);
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

    try {
      await deletePostApi({
        accessToken,
        postId
      });

      removePostFromProfile(postId);
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

    if (rawDraft.length > 2000) {
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

    try {
      const response = await updatePostApi({
        accessToken,
        postId,
        content: trimmedDraft
      });

      setPosts((currentPosts) =>
        currentPosts.map((currentPost) =>
          currentPost.id === postId
            ? {
                ...currentPost,
                ...response.data.post,
                likesCount: currentPost.likesCount,
                likedByMe: currentPost.likedByMe,
                commentsCount: currentPost.commentsCount
              }
            : currentPost
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
      const response = await createCommentApi(accessToken, postId, {
        content: trimmedContent
      });
      const createdComment = response.data.comment;

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
        currentPosts.map((currentPost) =>
          currentPost.id === postId
            ? {
                ...currentPost,
                commentsCount: Math.max(0, currentPost.commentsCount - 1)
              }
            : currentPost
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

  async function handleFollowUser() {
    if (!accessToken || !profile || isFollowActionPending) {
      return;
    }

    const targetUsername = profile.user.username;
    const targetIsPrivate = profile.user.isPrivate;
    const previousFollowStatus = profile.user.followStatus;

    setIsFollowActionPending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await followUserApi(accessToken, targetUsername);
      const nextFollowStatus = response.data.follow.status === "PENDING"
        ? "REQUESTED"
        : "FOLLOWING";
      const nextCanViewPosts = response.data.follow.status === "ACCEPTED"
        ? true
        : !targetIsPrivate;
      const followersCountDelta = response.data.follow.status === "ACCEPTED" &&
        previousFollowStatus !== "FOLLOWING"
        ? 1
        : 0;

      updateProfileFollowState(
        targetUsername,
        nextFollowStatus,
        nextCanViewPosts,
        followersCountDelta
      );
      setSuccessMessage(formatSuccessMessage(
        response.message,
        getFollowSuccessFallback(response.data.follow.status)
      ));
    } catch (error) {
      setErrorMessage(
        isPendingFollowRequestError(error)
          ? "Follow request already sent to this account."
          : "Could not follow user."
      );
    } finally {
      setIsFollowActionPending(false);
    }
  }

  async function handleUnfollowUser() {
    if (!accessToken || !profile || isFollowActionPending) {
      return;
    }

    const targetUsername = profile.user.username;
    const targetIsPrivate = profile.user.isPrivate;
    const previousFollowStatus = profile.user.followStatus;

    setIsFollowActionPending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await unfollowUserApi(accessToken, targetUsername);
      const followersCountDelta = previousFollowStatus === "FOLLOWING" ? -1 : 0;

      updateProfileFollowState(targetUsername, "NONE", !targetIsPrivate, followersCountDelta);
      setSuccessMessage(formatSuccessMessage(response.message, "User unfollowed successfully."));
    } catch {
      setErrorMessage("Could not unfollow user.");
    } finally {
      setIsFollowActionPending(false);
    }
  }

  async function handleFollowRequestAction(action: "accept" | "decline") {
    if (
      !accessToken ||
      !profile ||
      profile.user.followStatus !== "REQUESTED_ME" ||
      !profile.user.followRequestId ||
      pendingFollowRequestAction
    ) {
      return;
    }

    const followRequestId = profile.user.followRequestId;

    setPendingFollowRequestAction(action);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (action === "accept") {
        await acceptFollowRequestApi(accessToken, followRequestId);
      } else {
        await rejectFollowRequestApi(accessToken, followRequestId);
      }

      await refreshProfile();
      setSuccessMessage(
        action === "accept" ? "Follow request accepted." : "Follow request declined."
      );
    } catch {
      setErrorMessage("Could not update follow request.");
    } finally {
      setPendingFollowRequestAction(null);
    }
  }

  function renderFollowAction() {
    if (!profile) {
      return null;
    }

    if (profile.user.followStatus === "SELF") {
      return (
        <span className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
          Your profile
        </span>
      );
    }

    if (profile.user.followStatus === "REQUESTED") {
      return (
        <button
          className="rounded-md border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500"
          type="button"
          disabled
        >
          Requested
        </button>
      );
    }

    if (profile.user.followStatus === "REQUESTED_ME") {
      return (
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            type="button"
            disabled={pendingFollowRequestAction !== null}
            onClick={() => void handleFollowRequestAction("accept")}
          >
            {pendingFollowRequestAction === "accept" ? "Accepting..." : "Accept"}
          </button>
          <button
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            type="button"
            disabled={pendingFollowRequestAction !== null}
            onClick={() => void handleFollowRequestAction("decline")}
          >
            {pendingFollowRequestAction === "decline" ? "Declining..." : "Decline"}
          </button>
        </div>
      );
    }

    if (profile.user.followStatus === "FOLLOWING") {
      return (
        <button
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          type="button"
          disabled={isFollowActionPending}
          onClick={() => void handleUnfollowUser()}
        >
          {isFollowActionPending ? "Unfollowing..." : "Unfollow"}
        </button>
      );
    }

    return (
      <button
        className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        type="button"
        disabled={isFollowActionPending}
        onClick={() => void handleFollowUser()}
      >
        {isFollowActionPending ? "Following..." : "Follow"}
      </button>
    );
  }

  function renderConnectionsSection() {
    if (!profile) {
      return null;
    }

    const isFollowersTab = activeSocialGraphTab === "followers";
    const loadingMessage = isFollowersTab ? "Loading followers..." : "Loading following...";
    const emptyMessage = isFollowersTab ? "No followers yet." : "Not following anyone yet.";

    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-950">Connections</h2>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  isFollowersTab
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-600 hover:text-gray-950"
                }`}
                type="button"
                onClick={() => setActiveSocialGraphTab("followers")}
              >
                Followers
              </button>
              <button
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                  !isFollowersTab
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-600 hover:text-gray-950"
                }`}
                type="button"
                onClick={() => setActiveSocialGraphTab("following")}
              >
                Following
              </button>
            </div>
          </div>

          {isSocialGraphPrivate ? (
            <p className="text-sm text-gray-600">
              This profile&apos;s connections are private.
            </p>
          ) : null}

          {!isSocialGraphPrivate && isSocialGraphLoading ? (
            <p className="text-sm text-gray-600">{loadingMessage}</p>
          ) : null}

          {!isSocialGraphPrivate && !isSocialGraphLoading && socialGraphErrorMessage ? (
            <p className="text-sm text-red-700">{socialGraphErrorMessage}</p>
          ) : null}

          {!isSocialGraphPrivate &&
          !isSocialGraphLoading &&
          !socialGraphErrorMessage &&
          socialGraphUsers.length === 0 ? (
            <p className="text-sm text-gray-600">{emptyMessage}</p>
          ) : null}

          {!isSocialGraphPrivate && socialGraphUsers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {socialGraphUsers.map((socialGraphUser) => {
                const socialGraphDisplayName = getSocialGraphDisplayName(socialGraphUser);

                return (
                  <div className="py-4 first:pt-0 last:pb-0" key={socialGraphUser.id}>
                    <Link
                      className="flex min-w-0 gap-4 rounded-md outline-none transition hover:bg-gray-50 focus:ring-2 focus:ring-gray-200"
                      to={`/app/users/${encodeURIComponent(socialGraphUser.username)}`}
                    >
                      {socialGraphUser.profilePictureUrl ? (
                        <img
                          className="h-12 w-12 flex-none rounded-full border border-gray-200 object-cover"
                          src={socialGraphUser.profilePictureUrl}
                          alt={`${socialGraphDisplayName} profile`}
                        />
                      ) : (
                        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-base font-semibold text-gray-700">
                          {getSocialGraphFallbackLetter(socialGraphUser)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-semibold text-gray-950">
                            {socialGraphDisplayName}
                          </h3>
                          <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {socialGraphUser.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                        <p className="mt-1 break-words text-sm text-gray-600">
                          @{socialGraphUser.username}
                        </p>
                        {socialGraphUser.bio ? (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">
                            {socialGraphUser.bio}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : null}

          {!isSocialGraphPrivate && !isSocialGraphLoading && socialGraphPagination.hasMore ? (
            <div className="flex flex-col items-center gap-3">
              {loadMoreSocialGraphErrorMessage ? (
                <p className="text-sm text-red-700">{loadMoreSocialGraphErrorMessage}</p>
              ) : null}
              <button
                className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                type="button"
                onClick={() => void handleLoadMoreSocialGraph()}
                disabled={isLoadingMoreSocialGraph}
              >
                {isLoadingMoreSocialGraph ? "Loading..." : "Load More"}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  function renderPostsSection() {
    if (!profile) {
      return null;
    }

    if (!profile.canViewPosts) {
      return (
        <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          This account is private.
        </section>
      );
    }

    return (
      <section className="space-y-4">
        {postActionMessage ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {postActionMessage}
          </div>
        ) : null}

        {isPostsLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Loading posts...
          </div>
        ) : null}

        {!isPostsLoading && postsErrorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            {postsErrorMessage}
          </div>
        ) : null}

        {!isPostsLoading && !postsErrorMessage && posts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            No posts yet.
          </div>
        ) : null}

        {!isPostsLoading && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => {
              const isOwnProfilePost =
                user?.id !== undefined &&
                (post.author?.id === user.id || post.authorId === user.id);

              return (
                <PostCard
                  key={post.id}
                  post={post}
                  isLikePending={pendingLikePostId === post.id}
                  likeErrorMessage={likeErrorByPostId[post.id] ?? null}
                  onToggleLike={handleToggleLike}
                  isSavePending={pendingSavedPostId === post.id}
                  savedPostError={savedPostErrorById[post.id] ?? null}
                  onToggleSavedPost={handleToggleSavedPost}
                  canHide={Boolean(user?.id) && !isOwnProfilePost}
                  isHiding={pendingHidePostId === post.id}
                  hideError={hidePostErrorById[post.id] ?? null}
                  onHide={() => void handleHidePost(post.id)}
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
              );
            })}
          </div>
        ) : null}

        {!isPostsLoading && postsPagination.hasMore ? (
          <div className="flex flex-col items-center gap-3">
            {loadMorePostsErrorMessage ? (
              <p className="text-sm text-red-700">{loadMorePostsErrorMessage}</p>
            ) : null}
            <button
              className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              type="button"
              onClick={() => void handleLoadMorePosts()}
              disabled={isLoadingMorePosts}
            >
              {isLoadingMorePosts ? "Loading posts..." : "Load More"}
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  const displayName = profile ? getDisplayName(profile.user) : "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <button
        aria-label="Go back"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-lg font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
            return;
          }

          navigate("/app/search");
        }}
      >
        ←
      </button>

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          Loading profile...
        </div>
      ) : null}

      {!isLoading && errorMessage && !profile ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!isLoading && profile ? (
        <>
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-5">
                {profile.user.profilePictureUrl ? (
                  <img
                    className="h-20 w-20 flex-none rounded-full border border-gray-200 object-cover"
                    src={profile.user.profilePictureUrl}
                    alt={`${displayName} profile`}
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-none items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-2xl font-semibold text-gray-700">
                    {getFallbackLetter(profile.user)}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-2xl font-bold text-gray-950">
                      {displayName}
                    </h1>
                    <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {profile.user.isPrivate ? "Private" : "Public"}
                    </span>
                  </div>
                  <p className="mt-1 break-words text-sm text-gray-600">
                    @{profile.user.username}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-gray-950">
                        {profile.stats.postsCount}
                      </span>
                      <span className="text-gray-600">Posts</span>
                    </div>
                    <button
                      className="flex items-baseline gap-1 rounded-md text-left transition hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      type="button"
                      onClick={() => setActiveSocialGraphTab("followers")}
                    >
                      <span className="font-semibold text-gray-950">
                        {profile.stats.followersCount}
                      </span>
                      <span className="text-gray-600">Followers</span>
                    </button>
                    <button
                      className="flex items-baseline gap-1 rounded-md text-left transition hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      type="button"
                      onClick={() => setActiveSocialGraphTab("following")}
                    >
                      <span className="font-semibold text-gray-950">
                        {profile.stats.followingCount}
                      </span>
                      <span className="text-gray-600">Following</span>
                    </button>
                  </div>
                  {profile.user.bio ? (
                    <p className="mt-4 whitespace-pre-wrap break-words text-sm text-gray-700">
                      {profile.user.bio}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-none sm:justify-end">
                {renderFollowAction()}
              </div>
            </div>
          </section>

          {successMessage ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {renderConnectionsSection()}

          {renderPostsSection()}
        </>
      ) : null}
    </div>
  );
}
