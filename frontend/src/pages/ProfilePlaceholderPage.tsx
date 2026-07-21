import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { PlaceholderPage } from "../components/PlaceholderPage";
import { followUserApi, unfollowUserApi } from "../lib/api";

type FollowAction = "follow" | "unfollow";

function formatSuccessMessage(message: string | undefined, fallback: string) {
  const nextMessage = message ?? fallback;

  return /[.!?]$/.test(nextMessage) ? nextMessage : `${nextMessage}.`;
}

export function ProfilePlaceholderPage() {
  const { user, accessToken } = useAuth();
  const [targetUsername, setTargetUsername] = useState("");
  const [pendingAction, setPendingAction] = useState<FollowAction | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastActionTarget, setLastActionTarget] = useState<string | null>(null);
  const isActionPending = pendingAction !== null;

  function handleTargetUsernameChange(value: string) {
    setTargetUsername(value);
    setSuccessMessage(null);
    setErrorMessage(null);
    setLastActionTarget(null);
  }

  function getValidatedTargetUsername(action: FollowAction) {
    const trimmedUsername = targetUsername.trim();

    if (!trimmedUsername) {
      setSuccessMessage(null);
      setErrorMessage("Username is required.");
      return null;
    }

    if (user?.username && trimmedUsername.toLowerCase() === user.username.toLowerCase()) {
      setSuccessMessage(null);
      setErrorMessage("You cannot follow yourself.");
      return null;
    }

    if (!accessToken) {
      setSuccessMessage(null);
      setErrorMessage(action === "follow" ? "Could not follow user." : "Could not unfollow user.");
      return null;
    }

    return trimmedUsername;
  }

  async function handleFollowUser() {
    const trimmedUsername = getValidatedTargetUsername("follow");

    if (!trimmedUsername || !accessToken || pendingAction) {
      return;
    }

    setPendingAction("follow");
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await followUserApi(accessToken, trimmedUsername);

      setLastActionTarget(trimmedUsername);
      setSuccessMessage(formatSuccessMessage(response.message, "User followed successfully."));
    } catch {
      setErrorMessage("Could not follow user.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUnfollowUser() {
    const trimmedUsername = getValidatedTargetUsername("unfollow");

    if (!trimmedUsername || !accessToken || pendingAction) {
      return;
    }

    setPendingAction("unfollow");
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await unfollowUserApi(accessToken, trimmedUsername);

      setLastActionTarget(trimmedUsername);
      setSuccessMessage(formatSuccessMessage(response.message, "User unfollowed successfully."));
    } catch {
      setErrorMessage("Could not unfollow user.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <PlaceholderPage
      title="Profile"
      description="Your profile page will appear here."
    >
      {user ? (
        <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-700">
          <p>
            Signed in as <span className="font-semibold text-gray-950">{user.username}</span>
          </p>
          <p className="mt-1">{user.email}</p>
        </div>
      ) : null}

      <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
        <div>
          <h3 className="text-base font-semibold text-gray-950">Follow users</h3>
          <p className="mt-1 text-sm text-gray-600">
            Enter a username to follow or unfollow another user.
          </p>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-800" htmlFor="follow-target-username">
            Username
          </label>
          <input
            id="follow-target-username"
            className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
            type="text"
            autoComplete="off"
            placeholder="example_username"
            value={targetUsername}
            disabled={isActionPending}
            onChange={(event) => handleTargetUsernameChange(event.target.value)}
          />
          <p className="mt-2 text-xs text-gray-500">
            Your feed updates after you refresh it.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            type="button"
            disabled={isActionPending}
            onClick={() => void handleFollowUser()}
          >
            {pendingAction === "follow" ? "Following..." : "Follow"}
          </button>
          <button
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
            type="button"
            disabled={isActionPending}
            onClick={() => void handleUnfollowUser()}
          >
            {pendingAction === "unfollow" ? "Unfollowing..." : "Unfollow"}
          </button>
        </div>

        {successMessage ? (
          <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
            {lastActionTarget ? (
              <span className="sr-only"> Target username: {lastActionTarget}</span>
            ) : null}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </PlaceholderPage>
  );
}
