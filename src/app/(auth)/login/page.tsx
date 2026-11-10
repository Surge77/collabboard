import { redirect } from 'next/navigation';

import { SiteHeader } from '@/components/site/SiteHeader';
import { buttonClass } from '@/components/ui/Button';
import { auth, signIn } from '@/lib/auth';
import { signInErrorMessage, toCallbackPath } from '@/lib/sign-in';

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl, error } = await searchParams;
  // Invited users arrive with the board URL as callbackUrl; send them back
  // there, never off-site (toCallbackPath keeps only same-site paths).
  const redirectTo = toCallbackPath(callbackUrl);
  const session = await auth();
  if (session) redirect(redirectTo);

  const errorMessage = signInErrorMessage(error);
  const isInvite = redirectTo.startsWith('/board/');

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="border-line bg-surface w-full max-w-sm rounded-lg border p-8">
          <h1 className="text-foreground text-xl font-semibold tracking-[-0.01em]">
            Sign in to CollabBoard
          </h1>
          <p className="text-ink-soft mt-1.5 text-sm">
            {isInvite
              ? 'Sign in to open the board you were invited to.'
              : 'Continue with the account your team uses.'}
          </p>

          {errorMessage ? (
            <p
              role="alert"
              className="border-danger/40 bg-danger-soft text-danger mt-5 rounded-md border px-3 py-2 text-[13px]"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2">
            <form
              action={async () => {
                'use server';
                await signIn('google', { redirectTo });
              }}
            >
              <button type="submit" className={`${buttonClass('secondary')} w-full`}>
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
                  />
                  <path
                    fill="#34A853"
                    d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>
            <form
              action={async () => {
                'use server';
                await signIn('github', { redirectTo });
              }}
            >
              <button type="submit" className={`${buttonClass('secondary')} w-full`}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
                </svg>
                Continue with GitHub
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
