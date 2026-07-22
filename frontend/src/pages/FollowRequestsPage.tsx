import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  acceptFollowRequestApi,
  getIncomingFollowRequestsApi,
  rejectFollowRequestApi,
  type IncomingFollowRequest,
  type IncomingFollowRequestUser
} from "../lib/api";

type FollowRequestAction = "accept" | "reject";

function formatSuccessMessage(message: string | undefined, fallback: string) {
  const nextMessage = message ?? fallback;

  return /[.!?]$/.test(nextMessage) ? nextMessage : `${nextMessage}.`;
}

function getDisplayName(user: IncomingFollowRequestUser) {
  return user.displayName?.trim() || user.username;
}

function getFallbackLetter(user: IncomingFollowRequestUser) {
  return getDisplayName(user).charAt(0).toUpperCase() || "?";
}

function formatRequestDate(createdAt: string) {
  const requestDate = new Date(createdAt);

  if (Number.isNaN(requestDate.getTime())) {
    return null;
  }

  return requestDate.toLocaleDateString();
}

export function FollowRequestsPage() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<IncomingFollowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingRequestActions, setPendingRequestActions] =
    useState<Record<string, FollowRequestAction | undefined>>({});
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const pendingRequestActionsRef =
    useRef<Record<string, FollowRequestAction | undefined>>({});

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadFollowRequests() {
      setRequests([]);
      setErrorMessage(null);
      setActionErrorMessage(null);
      setSuccessMessage(null);

      if (!accessToken) {
        setIsLoading(false);
        setErrorMessage("Could not load follow requests.");
        return;
      }

      setIsLoading(true);

      try {
        const response = await getIncomingFollowRequestsApi(accessToken);

        if (!isCurrentRequest) {
          return;
        }

        setRequests(response.data.requests);
        setErrorMessage(null);
        setActionErrorMessage(null);
      } catch {
        if (!isCurrentRequest) {
          return;
        }

        setRequests([]);
        setErrorMessage("Could not load follow requests.");
      } finally {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      }
    }

    void loadFollowRequests();

    return () => {
      isCurrentRequest = false;
    };
  }, [accessToken]);

  async function handleFollowRequestAction(
    request: IncomingFollowRequest,
    action: FollowRequestAction
  ) {
    if (!accessToken || pendingRequestActionsRef.current[request.id]) {
      return;
    }

    pendingRequestActionsRef.current = {
      ...pendingRequestActionsRef.current,
      [request.id]: action
    };
    setPendingRequestActions((currentActions) => ({
      ...currentActions,
      [request.id]: action
    }));
    setSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const response = action === "accept"
        ? await acceptFollowRequestApi(accessToken, request.id)
        : await rejectFollowRequestApi(accessToken, request.id);

      setRequests((currentRequests) =>
        currentRequests.filter((currentRequest) => currentRequest.id !== request.id)
      );
      setSuccessMessage(formatSuccessMessage(
        response.message,
        action === "accept" ? "Follow request accepted." : "Follow request rejected."
      ));
    } catch {
      setActionErrorMessage("Could not update follow request.");
    } finally {
      const nextPendingRequestActions = { ...pendingRequestActionsRef.current };
      delete nextPendingRequestActions[request.id];
      pendingRequestActionsRef.current = nextPendingRequestActions;

      setPendingRequestActions((currentActions) => {
        const nextActions = { ...currentActions };
        delete nextActions[request.id];

        return nextActions;
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-950">Follow requests</h1>
      </div>

      {successMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {successMessage}
        </div>
      ) : null}

      {actionErrorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionErrorMessage}
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {isLoading ? (
          <p className="text-sm text-gray-600">Loading follow requests...</p>
        ) : null}

        {!isLoading && errorMessage ? (
          <p className="text-sm text-red-700">{errorMessage}</p>
        ) : null}

        {!isLoading && !errorMessage && requests.length === 0 ? (
          <p className="text-sm text-gray-600">No follow requests yet.</p>
        ) : null}

        {!isLoading && !errorMessage && requests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => {
              const requester = request.requester;
              const displayName = getDisplayName(requester);
              const requestDate = formatRequestDate(request.createdAt);
              const pendingRequestAction = pendingRequestActions[request.id];
              const isPendingRequest = pendingRequestAction !== undefined;

              return (
                <div
                  className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  key={request.id}
                >
                  <Link
                    className="flex min-w-0 gap-4 rounded-md outline-none transition hover:bg-gray-50 focus:ring-2 focus:ring-gray-200"
                    to={`/app/users/${encodeURIComponent(requester.username)}`}
                  >
                    {requester.profilePictureUrl ? (
                      <img
                        className="h-12 w-12 flex-none rounded-full border border-gray-200 object-cover"
                        src={requester.profilePictureUrl}
                        alt={`${displayName} profile`}
                      />
                    ) : (
                      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-base font-semibold text-gray-700">
                        {getFallbackLetter(requester)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-sm font-semibold text-gray-950">
                          {displayName}
                        </h2>
                        <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {requester.isPrivate ? "Private" : "Public"}
                        </span>
                      </div>
                      <p className="mt-1 break-words text-sm text-gray-600">
                        @{requester.username}
                      </p>
                      {requester.bio ? (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-700">
                          {requester.bio}
                        </p>
                      ) : null}
                      {requestDate ? (
                        <p className="mt-2 text-xs text-gray-500">{requestDate}</p>
                      ) : null}
                    </div>
                  </Link>

                  <div className="flex flex-none gap-3 sm:justify-end">
                    <button
                      className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                      type="button"
                      disabled={isPendingRequest}
                      onClick={() => void handleFollowRequestAction(request, "accept")}
                    >
                      {pendingRequestAction === "accept" ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                      type="button"
                      disabled={isPendingRequest}
                      onClick={() => void handleFollowRequestAction(request, "reject")}
                    >
                      {pendingRequestAction === "reject" ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
