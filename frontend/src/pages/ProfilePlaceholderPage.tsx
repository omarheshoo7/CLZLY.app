import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  uploadProfilePictureApi,
  updateMyPrivacyApi,
  updateMyProfileApi,
  type UpdateMyProfileInput
} from "../lib/api";

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function normalizeUserText(value: string | null) {
  return value && value.length > 0 ? value : null;
}

function getFallbackLetter(displayName: string, username: string | undefined) {
  const normalizedDisplayName = normalizeOptionalText(displayName);
  const source = normalizedDisplayName ?? username ?? "U";

  return source.charAt(0).toUpperCase();
}

export function ProfilePlaceholderPage() {
  const { user, accessToken, refreshSession } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);
  const [privacySuccessMessage, setPrivacySuccessMessage] = useState<string | null>(null);
  const [privacyErrorMessage, setPrivacyErrorMessage] = useState<string | null>(null);
  const [selectedProfilePictureFile, setSelectedProfilePictureFile] = useState<File | null>(null);
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);
  const [profilePictureUploadSuccessMessage, setProfilePictureUploadSuccessMessage] = useState<string | null>(null);
  const [profilePictureUploadErrorMessage, setProfilePictureUploadErrorMessage] = useState<string | null>(null);
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setDisplayName(user.displayName ?? "");
    setBio(user.bio ?? "");
    setProfilePictureUrl(user.profilePictureUrl ?? "");
    setIsPrivate(user.isPrivate);
    setHasAvatarError(false);
  }, [user]);

  const normalizedDisplayName = useMemo(() => normalizeOptionalText(displayName), [displayName]);
  const normalizedBio = useMemo(() => normalizeOptionalText(bio), [bio]);
  const normalizedProfilePictureUrl = useMemo(
    () => normalizeOptionalText(profilePictureUrl),
    [profilePictureUrl]
  );

  const hasProfileChanges = Boolean(user) && (
    normalizedDisplayName !== normalizeUserText(user?.displayName ?? null) ||
    normalizedBio !== normalizeUserText(user?.bio ?? null) ||
    normalizedProfilePictureUrl !== normalizeUserText(user?.profilePictureUrl ?? null)
  );
  const hasPrivacyChanges = Boolean(user) && isPrivate !== user?.isPrivate;
  const canSaveProfile = Boolean(accessToken && user && hasProfileChanges && !isSavingProfile);
  const canSavePrivacy = Boolean(accessToken && user && hasPrivacyChanges && !isSavingPrivacy);
  const shouldShowAvatarImage = Boolean(normalizedProfilePictureUrl && !hasAvatarError);
  const fallbackLetter = getFallbackLetter(displayName, user?.username);

  function syncProfileFormFromUser(nextUser: NonNullable<typeof user>) {
    setDisplayName(nextUser.displayName ?? "");
    setBio(nextUser.bio ?? "");
    setProfilePictureUrl(nextUser.profilePictureUrl ?? "");
    setHasAvatarError(false);
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !user || isSavingProfile || !hasProfileChanges) {
      return;
    }

    const payload: UpdateMyProfileInput = {};

    if (normalizedDisplayName !== normalizeUserText(user.displayName)) {
      payload.displayName = normalizedDisplayName;
    }

    if (normalizedBio !== normalizeUserText(user.bio)) {
      payload.bio = normalizedBio;
    }

    if (normalizedProfilePictureUrl !== normalizeUserText(user.profilePictureUrl)) {
      payload.profilePictureUrl = normalizedProfilePictureUrl;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccessMessage(null);
    setProfileErrorMessage(null);

    try {
      const response = await updateMyProfileApi(accessToken, payload);

      syncProfileFormFromUser(response.data.user);
      setProfileSuccessMessage("Profile updated successfully.");
      await refreshSession();
    } catch {
      setProfileErrorMessage("Could not update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePrivacySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken || !user || isSavingPrivacy || !hasPrivacyChanges) {
      return;
    }

    setIsSavingPrivacy(true);
    setPrivacySuccessMessage(null);
    setPrivacyErrorMessage(null);

    try {
      const response = await updateMyPrivacyApi(accessToken, { isPrivate });

      setIsPrivate(response.data.user.isPrivate);
      setPrivacySuccessMessage("Privacy updated successfully.");
      await refreshSession();
    } catch {
      setPrivacyErrorMessage("Could not update privacy.");
    } finally {
      setIsSavingPrivacy(false);
    }
  }

  function handleProfilePictureUrlChange(value: string) {
    setProfilePictureUrl(value);
    setHasAvatarError(false);
    setProfilePictureUploadSuccessMessage(null);
    setProfilePictureUploadErrorMessage(null);
  }

  function handleProfilePictureFileChange(event: ChangeEvent<HTMLInputElement>) {
    setSelectedProfilePictureFile(event.target.files?.[0] ?? null);
    setProfilePictureUploadSuccessMessage(null);
    setProfilePictureUploadErrorMessage(null);
  }

  async function handleProfilePictureUpload() {
    if (!accessToken || !selectedProfilePictureFile || isUploadingProfilePicture) {
      return;
    }

    setIsUploadingProfilePicture(true);
    setProfilePictureUploadSuccessMessage(null);
    setProfilePictureUploadErrorMessage(null);

    try {
      const response = await uploadProfilePictureApi(accessToken, selectedProfilePictureFile);

      setProfilePictureUrl(response.data.profilePictureUrl);
      setHasAvatarError(false);
      syncProfileFormFromUser(response.data.user);
      await refreshSession();
      setSelectedProfilePictureFile(null);

      if (profilePictureInputRef.current) {
        profilePictureInputRef.current.value = "";
      }

      setProfilePictureUploadSuccessMessage("Profile picture uploaded successfully.");
    } catch {
      setProfilePictureUploadErrorMessage("Could not upload profile picture.");
    } finally {
      setIsUploadingProfilePicture(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold text-gray-950">Profile settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your public profile and account privacy.
        </p>
      </header>

      <section className="mt-6 rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold text-gray-950">Account</h2>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-2xl font-semibold text-gray-600">
            {shouldShowAvatarImage ? (
              <img
                className="size-full object-cover"
                src={normalizedProfilePictureUrl ?? undefined}
                alt=""
                onError={() => setHasAvatarError(true)}
              />
            ) : (
              <span>{fallbackLetter}</span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-sm text-gray-500">Username</p>
            <p className="break-words text-base font-semibold text-gray-950">
              {user?.username ?? ""}
            </p>
            <p className="mt-2 text-sm text-gray-500">Email</p>
            <p className="break-words text-sm text-gray-800">{user?.email ?? ""}</p>
            <p className="mt-3 inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
              {user?.isPrivate ? "Private account" : "Public account"}
            </p>
          </div>
        </div>
      </section>

      <form className="mt-6 rounded-md border border-gray-200 bg-white p-5" onSubmit={handleProfileSubmit}>
        <h2 className="text-base font-semibold text-gray-950">Profile details</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="profile-display-name">
              Display name
            </label>
            <input
              id="profile-display-name"
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
              type="text"
              maxLength={50}
              value={displayName}
              disabled={isSavingProfile}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setProfileSuccessMessage(null);
                setProfileErrorMessage(null);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="profile-bio">
              Bio
            </label>
            <textarea
              id="profile-bio"
              className="mt-2 block min-h-28 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
              maxLength={160}
              value={bio}
              disabled={isSavingProfile}
              onChange={(event) => {
                setBio(event.target.value);
                setProfileSuccessMessage(null);
                setProfileErrorMessage(null);
              }}
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-800">Upload profile picture</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label
                className="inline-flex cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                htmlFor="profile-picture-upload"
              >
                Choose image
              </label>
              <input
                ref={profilePictureInputRef}
                id="profile-picture-upload"
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploadingProfilePicture}
                onChange={handleProfilePictureFileChange}
              />
              <span className="min-w-0 break-words text-sm text-gray-600">
                {selectedProfilePictureFile?.name ?? "No image selected"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                type="button"
                disabled={!accessToken || !selectedProfilePictureFile || isUploadingProfilePicture}
                onClick={handleProfilePictureUpload}
              >
                {isUploadingProfilePicture ? "Uploading..." : "Upload profile picture"}
              </button>

              {profilePictureUploadSuccessMessage ? (
                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {profilePictureUploadSuccessMessage}
                </p>
              ) : null}

              {profilePictureUploadErrorMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {profilePictureUploadErrorMessage}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800" htmlFor="profile-picture-url">
              Profile picture URL
            </label>
            <input
              id="profile-picture-url"
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-950 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-gray-950 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-100 disabled:text-gray-500"
              type="url"
              maxLength={500}
              value={profilePictureUrl}
              disabled={isSavingProfile}
              onChange={(event) => {
                handleProfilePictureUrlChange(event.target.value);
                setProfileSuccessMessage(null);
                setProfileErrorMessage(null);
              }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            type="submit"
            disabled={!canSaveProfile}
          >
            Save profile
          </button>

          {profileSuccessMessage ? (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {profileSuccessMessage}
            </p>
          ) : null}

          {profileErrorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileErrorMessage}
            </p>
          ) : null}
        </div>
      </form>

      <form className="mt-6 rounded-md border border-gray-200 bg-white p-5" onSubmit={handlePrivacySubmit}>
        <h2 className="text-base font-semibold text-gray-950">Privacy</h2>
        <p className="mt-2 text-sm text-gray-600">
          Private accounts require approval for new followers.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label
            className={[
              "cursor-pointer rounded-md border p-4 transition",
              !isPrivate
                ? "border-gray-950 bg-gray-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            ].join(" ")}
          >
            <input
              className="sr-only"
              type="radio"
              name="account-privacy"
              checked={!isPrivate}
              disabled={isSavingPrivacy}
              onChange={() => {
                setIsPrivate(false);
                setPrivacySuccessMessage(null);
                setPrivacyErrorMessage(null);
              }}
            />
            <span className="block text-sm font-semibold text-gray-950">Public account</span>
          </label>

          <label
            className={[
              "cursor-pointer rounded-md border p-4 transition",
              isPrivate
                ? "border-gray-950 bg-gray-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            ].join(" ")}
          >
            <input
              className="sr-only"
              type="radio"
              name="account-privacy"
              checked={isPrivate}
              disabled={isSavingPrivacy}
              onChange={() => {
                setIsPrivate(true);
                setPrivacySuccessMessage(null);
                setPrivacyErrorMessage(null);
              }}
            />
            <span className="block text-sm font-semibold text-gray-950">Private account</span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            type="submit"
            disabled={!canSavePrivacy}
          >
            Save privacy
          </button>

          {privacySuccessMessage ? (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {privacySuccessMessage}
            </p>
          ) : null}

          {privacyErrorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {privacyErrorMessage}
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
