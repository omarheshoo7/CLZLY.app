import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function ProtectedHomePage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">CLZLY</p>
        <h1 className="mt-3 text-3xl font-bold text-gray-950">Welcome to CLZLY</h1>
        <p className="mt-2 text-gray-600">You are logged in.</p>

        {user ? (
          <div className="mt-6 rounded-md bg-gray-50 p-4 text-sm text-gray-700">
            <p>
              Signed in as <span className="font-semibold text-gray-950">{user.username}</span>
            </p>
            <p className="mt-1">{user.email}</p>
          </div>
        ) : null}

        <button
          className="mt-6 rounded-md bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </section>
    </main>
  );
}
