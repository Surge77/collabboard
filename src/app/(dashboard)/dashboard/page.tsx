import { auth, signOut } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? 'there';

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your boards</h1>
          <p className="text-foreground/60 text-sm">Signed in as {name}</p>
        </div>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="border-foreground/15 text-foreground/50 flex h-64 items-center justify-center rounded-xl border border-dashed text-sm">
        No boards yet — board management arrives in Phase 1.
      </div>
    </main>
  );
}
