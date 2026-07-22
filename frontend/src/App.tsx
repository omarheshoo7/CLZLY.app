import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { AppLoading } from "./components/AppLoading";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PublicOnlyRoute } from "./auth/PublicOnlyRoute";
import { useAuth } from "./auth/AuthContext";
import { FeedPlaceholderPage } from "./pages/FeedPlaceholderPage";
import { FollowRequestsPage } from "./pages/FollowRequestsPage";
import { HiddenPostsPlaceholderPage } from "./pages/HiddenPostsPlaceholderPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePlaceholderPage } from "./pages/ProfilePlaceholderPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SavedPlaceholderPage } from "./pages/SavedPlaceholderPage";
import { SearchPage } from "./pages/SearchPage";
import { UserProfilePage } from "./pages/UserProfilePage";

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  return <Navigate to={isAuthenticated ? "/app/feed" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/login"
        element={(
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/register"
        element={(
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/app"
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<Navigate to="/app/feed" replace />} />
        <Route path="feed" element={<FeedPlaceholderPage section="all" />} />
        <Route path="feed/questions" element={<FeedPlaceholderPage section="questions" />} />
        <Route path="feed/help-needed" element={<FeedPlaceholderPage section="help-needed" />} />
        <Route path="feed/marketplace" element={<FeedPlaceholderPage section="marketplace" />} />
        <Route path="feed/resources" element={<FeedPlaceholderPage section="resources" />} />
        <Route path="feed/updates" element={<FeedPlaceholderPage section="updates" />} />
        <Route path="feed/personal" element={<FeedPlaceholderPage section="personal" />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="follow-requests" element={<FollowRequestsPage />} />
        <Route path="users/:username" element={<UserProfilePage />} />
        <Route path="profile" element={<ProfilePlaceholderPage />} />
        <Route path="saved" element={<SavedPlaceholderPage />} />
        <Route path="hidden-posts" element={<HiddenPostsPlaceholderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
