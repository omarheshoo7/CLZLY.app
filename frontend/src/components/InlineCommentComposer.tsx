const MAX_COMMENT_LENGTH = 1000;

type InlineCommentComposerProps = {
  postId: string;
  value: string;
  isPending: boolean;
  errorMessage?: string | null;
  successMessage?: string | null;
  onChange: (postId: string, value: string) => void;
  onSubmit: (postId: string) => Promise<void> | void;
};

export function InlineCommentComposer({
  postId,
  value,
  isPending,
  errorMessage,
  successMessage,
  onChange,
  onSubmit
}: InlineCommentComposerProps) {
  const lengthErrorMessage = value.length > MAX_COMMENT_LENGTH
    ? "Comment content must be 1000 characters or less."
    : null;
  const isSubmitDisabled =
    isPending || value.trim().length === 0 || value.length > MAX_COMMENT_LENGTH;

  return (
    <form
      className="mt-4 border-t border-gray-100 pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(postId);
      }}
    >
      <label className="sr-only" htmlFor={`comment-${postId}`}>
        Write a comment
      </label>
      <textarea
        id={`comment-${postId}`}
        className="min-h-20 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        placeholder="Write a comment..."
        value={value}
        disabled={isPending}
        onChange={(event) => onChange(postId, event.target.value)}
      />

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {value.length} / {MAX_COMMENT_LENGTH}
        </p>
        <button
          className="rounded-md bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          type="submit"
          disabled={isSubmitDisabled}
        >
          {isPending ? "Commenting..." : "Comment"}
        </button>
      </div>

      {lengthErrorMessage || errorMessage ? (
        <p className="mt-2 text-sm text-red-700">{lengthErrorMessage ?? errorMessage}</p>
      ) : null}

      {successMessage ? (
        <p className="mt-2 text-sm font-medium text-green-700">{successMessage}</p>
      ) : null}
    </form>
  );
}
