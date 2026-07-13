import { useAuth } from "../auth/AuthContext";
import { PlaceholderPage } from "../components/PlaceholderPage";

export function ProfilePlaceholderPage() {
  const { user } = useAuth();

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
    </PlaceholderPage>
  );
}
