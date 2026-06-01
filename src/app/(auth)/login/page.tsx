import { redirect } from 'next/navigation';

import { auth, signIn } from '@/lib/auth';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/dashboard');

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Sign in to CollabBoard</h1>
        <p className="text-foreground/60 mt-2 text-sm">
          Continue with a provider to start drawing.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/dashboard' });
          }}
        >
          <button
            type="submit"
            className="border-foreground/15 hover:bg-foreground/5 w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            Continue with Google
          </button>
        </form>
        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: '/dashboard' });
          }}
        >
          <button
            type="submit"
            className="border-foreground/15 hover:bg-foreground/5 w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
          >
            Continue with GitHub
          </button>
        </form>
      </div>
    </main>
  );
}
