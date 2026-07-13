import { Navigate } from "react-router-dom";
import { AppLoading } from "../components/AppLoading";
import { useAuth } from "./AuthContext";

type PublicOnlyRouteProps = {
  children: React.ReactNode;
};

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app/feed" replace />;
  }

  return children;
}
