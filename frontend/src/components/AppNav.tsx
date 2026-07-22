import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Feed", to: "/app/feed" },
  { label: "Search", to: "/app/search" },
  { label: "Requests", to: "/app/follow-requests" },
  { label: "Profile", to: "/app/profile" },
  { label: "Saved", to: "/app/saved" },
  { label: "Hidden Posts", to: "/app/hidden-posts" }
];

export function AppNav() {
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
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
