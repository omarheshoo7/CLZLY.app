import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  followUserApi,
  getUserProfileApi,
  unfollowUserApi,
  type FollowStatus,
  type UserFollowStatus,
  type UserProfile,
  type UserProfileData
} from "../lib/api";

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

function getFollowSuccessFallback(status: FollowStatus) {
  return status === "PENDING"
    ? "Follow request sent successfully."
    : "User followed successfully.";
}

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowActionPending, setIsFollowActionPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadProfile() {
      setIsLoading(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      if (!username || !accessToken) {
        if (isCurrentRequest) {
          setProfile(null);
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

  function updateProfileFollowState(
    targetUsername: string,
    followStatus: UserFollowStatus,
    canViewPosts: boolean
  ) {
    setProfile((currentProfile) => {
      if (!currentProfile || currentProfile.user.username !== targetUsername) {
        return currentProfile;
      }

      return {
        ...currentProfile,
        canViewPosts,
        user: {
          ...currentProfile.user,
          followStatus
        }
      };
    });
  }

  async function handleFollowUser() {
    if (!accessToken || !profile || isFollowActionPending) {
      return;
    }

    const targetUsername = profile.user.username;
    const targetIsPrivate = profile.user.isPrivate;

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

      updateProfileFollowState(targetUsername, nextFollowStatus, nextCanViewPosts);
      setSuccessMessage(formatSuccessMessage(
        response.message,
        getFollowSuccessFallback(response.data.follow.status)
      ));
    } catch {
      setErrorMessage("Could not follow user.");
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

    setIsFollowActionPending(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await unfollowUserApi(accessToken, targetUsername);

      updateProfileFollowState(targetUsername, "NONE", !targetIsPrivate);
      setSuccessMessage(formatSuccessMessage(response.message, "User unfollowed successfully."));
    } catch {
      setErrorMessage("Could not unfollow user.");
    } finally {
      setIsFollowActionPending(false);
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

  const displayName = profile ? getDisplayName(profile.user) : "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        className="text-sm font-semibold text-gray-700 transition hover:text-gray-950"
        to="/app/search"
      >
        Back to search
      </Link>

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

          <section className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            {profile.canViewPosts
              ? "Posts will be added in the next milestone."
              : "This account is private."}
          </section>
        </>
      ) : null}
    </div>
  );
}
