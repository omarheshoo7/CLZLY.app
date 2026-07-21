import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  followUserApi,
  searchUsersApi,
  unfollowUserApi,
  type SearchUser
} from "../lib/api";

function formatSuccessMessage(message: string | undefined, fallback: string) {
  const nextMessage = message ?? fallback;

  return /[.!?]$/.test(nextMessage) ? nextMessage : `${nextMessage}.`;
}

function getDisplayName(user: SearchUser) {
  return user.displayName?.trim() || user.username;
}

function getFallbackLetter(user: SearchUser) {
  return getDisplayName(user).charAt(0).toUpperCase() || "?";
}

function getFollowSuccessFallback(status: "PENDING" | "ACCEPTED") {
  return status === "PENDING"
    ? "Follow request sent successfully."
    : "User followed successfully.";
}

export function SearchPage() {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingUsername, setPendingUsername] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isFollowActionPending = pendingUsername !== null;

  function handleQueryChange(value: string) {
    setQuery(value);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  function updateUserFollowStatus(
    username: string,
    followStatus: SearchUser["followStatus"]
  ) {
    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.username === username
          ? {
              ...currentUser,
              followStatus
            }
          : currentUser
      )
    );
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    setSuccessMessage(null);
    setErrorMessage(null);

    if (trimmedQuery.length < 2) {
      setHasSearched(true);
      setErrorMessage("Enter at least 2 characters.");
      return;
    }

    if (!accessToken) {
      setHasSearched(true);
      setErrorMessage("Could not search users.");
      return;
    }

    setIsSearching(true);

    try {
      const response = await searchUsersApi(accessToken, trimmedQuery);

      setUsers(response.data.users);
      setHasSearched(true);
    } catch {
      setUsers([]);
      setHasSearched(true);
      setErrorMessage("Could not search users.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleFollowUser(user: SearchUser) {
    if (!accessToken || pendingUsername) {
      return;
    }

    setPendingUsername(user.username);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await followUserApi(accessToken, user.username);
      const nextFollowStatus = response.data.follow.status === "PENDING"
        ? "REQUESTED"
        : "FOLLOWING";

      updateUserFollowStatus(user.username, nextFollowStatus);
      setSuccessMessage(formatSuccessMessage(
        response.message,
        getFollowSuccessFallback(response.data.follow.status)
      ));
    } catch {
      setErrorMessage("Could not follow user.");
    } finally {
      setPendingUsername(null);
    }
  }

  async function handleUnfollowUser(user: SearchUser) {
    if (!accessToken || pendingUsername) {
      return;
    }

    setPendingUsername(user.username);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await unfollowUserApi(accessToken, user.username);

      updateUserFollowStatus(user.username, "NONE");
      setSuccessMessage(formatSuccessMessage(response.message, "User unfollowed successfully."));
    } catch {
      setErrorMessage("Could not unfollow user.");
    } finally {
      setPendingUsername(null);
    }
  }

  function renderFollowAction(user: SearchUser) {
    const isPendingUser = pendingUsername === user.username;

    if (user.followStatus === "SELF") {
      return (
        <span className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
          Your profile
        </span>
      );
    }

    if (user.followStatus === "REQUESTED") {
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

    if (user.followStatus === "FOLLOWING") {
      return (
        <button
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          type="button"
          disabled={isFollowActionPending}
          onClick={() => void handleUnfollowUser(user)}
        >
          {isPendingUser ? "Unfollowing..." : "Unfollow"}
        </button>
      );
    }

    return (
      <button
        className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        type="button"
        disabled={isFollowActionPending}
        onClick={() => void handleFollowUser(user)}
      >
        {isPendingUser ? "Following..." : "Follow"}
      </button>
    );
  }

  const shouldShowInitialEmptyState = !hasSearched && users.length === 0 && !errorMessage;
  const shouldShowNoResults = hasSearched && !isSearching && !errorMessage && users.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Search
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-950">Search</h1>
        <p className="mt-2 text-gray-600">
          Search for users by username or name.
        </p>
      </header>

      <form
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => void handleSearchSubmit(event)}
      >
        <label className="block text-sm font-medium text-gray-800" htmlFor="user-search-query">
          Search users
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="user-search-query"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
            type="search"
            autoComplete="off"
            placeholder="Search by username or name"
            value={query}
            disabled={isSearching}
            onChange={(event) => handleQueryChange(event.target.value)}
          />
          <button
            className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            type="submit"
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

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

      {shouldShowInitialEmptyState ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
          Search for users to get started.
        </div>
      ) : null}

      {shouldShowNoResults ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
          No users found.
        </div>
      ) : null}

      {users.length > 0 ? (
        <div className="flex flex-col gap-4">
          {users.map((user) => {
            const displayName = getDisplayName(user);

            return (
              <article
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                key={user.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex min-w-0 gap-4">
                      <Link
                        className="flex-none rounded-full outline-none transition focus:ring-2 focus:ring-gray-200"
                        to={`/app/users/${encodeURIComponent(user.username)}`}
                      >
                        {user.profilePictureUrl ? (
                          <img
                            className="h-14 w-14 rounded-full border border-gray-200 object-cover"
                            src={user.profilePictureUrl}
                            alt={`${displayName} profile`}
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-lg font-semibold text-gray-700">
                            {getFallbackLetter(user)}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            className="rounded-md outline-none transition hover:text-gray-700 focus:ring-2 focus:ring-gray-200"
                            to={`/app/users/${encodeURIComponent(user.username)}`}
                          >
                            <h2 className="break-words text-lg font-semibold text-gray-950">
                              {displayName}
                            </h2>
                          </Link>
                          <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {user.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                        <Link
                          className="mt-1 block rounded-md text-sm text-gray-600 outline-none transition hover:text-gray-950 focus:ring-2 focus:ring-gray-200"
                          to={`/app/users/${encodeURIComponent(user.username)}`}
                        >
                          @{user.username}
                        </Link>
                      </div>
                    </div>
                    {user.bio ? (
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-700 sm:ml-[4.5rem]">
                        {user.bio}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-none sm:justify-end">
                    {renderFollowAction(user)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
