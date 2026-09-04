const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/** Shown above checkout while the project is still using the test environment. */
export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Production checkout is not configured yet. Complete go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full rounded-2xl border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-700 dark:text-amber-400">
        All payments made in the preview are in test mode.
      </div>
    );
  }
  return null;
}
