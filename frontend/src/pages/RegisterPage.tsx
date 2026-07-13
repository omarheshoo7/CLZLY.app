import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { ApiError } from "../lib/api";

function validateRegisterForm({
  email,
  username,
  password
}: {
  email: string;
  username: string;
  password: string;
}) {
  const trimmedEmail = email.trim();
  const trimmedUsername = username.trim();

  if (!trimmedEmail) {
    return "Email is required.";
  }

  if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
    return "Email must be a valid email address.";
  }

  if (!trimmedUsername) {
    return "Username is required.";
  }

  if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
    return "Username must be 3 to 30 characters.";
  }

  if (!/^[A-Za-z0-9_]+$/.test(trimmedUsername)) {
    return "Username can only contain letters, numbers, and underscores.";
  }

  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include uppercase, lowercase, and number.";
  }

  return null;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateRegisterForm({ email, username, password });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        email: email.trim(),
        username: username.trim(),
        password
      });
      navigate("/app", { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Start using CLZLY.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-gray-800">Email</span>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-800">Username</span>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-800">Password</span>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-950 outline-none transition focus:border-gray-900 focus:ring-2 focus:ring-gray-200"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />
        </label>

        <button
          className="w-full rounded-md bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link className="font-semibold text-gray-950 underline-offset-4 hover:underline" to="/login">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
