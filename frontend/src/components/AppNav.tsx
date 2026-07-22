import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getIncomingFollowRequestsApi } from "../lib/api";

const navItems = [
  { label: "Feed", to: "/app/feed" },
  { label: "Search", to: "/app/search" },
  { label: "Requests", to: "/app/follow-requests" },
  { label: "Profile", to: "/app/profile" },
  { label: "Saved", to: "/app/saved" },
  { label: "Hidden Posts", to: "/app/hidden-posts" }
];

export function AppNav() {
  const { accessToken } = useAuth();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadPendingRequestsCount() {
      if (!accessToken) {
        setPendingRequestsCount(0);
        return;
      }

      try {
        const response = await getIncomingFollowRequestsApi(accessToken);

        if (isCurrentRequest) {
          setPendingRequestsCount(response.data.requests.length);
        }
      } catch {
        if (isCurrentRequest) {
          setPendingRequestsCount(0);
        }
      }
    }

    void loadPendingRequestsCount();

    return () => {
      isCurrentRequest = false;
    };
  }, [accessToken]);

  return (
    <nav className="flex flex-wrap gap-2" aria-label="App navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => [
            "rounded-md px-3 py-2 text-sm font-medium transition",
            isActive
              ? "bg-gray-950 text-white"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
          ].join(" ")}
        >
          <span>{item.label}</span>
          {item.to === "/app/follow-requests" && pendingRequestsCount > 0 ? (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
              {pendingRequestsCount}
            </span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}
