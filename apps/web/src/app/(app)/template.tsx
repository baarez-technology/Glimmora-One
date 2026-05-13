'use client';

// Next App Router re-mounts the template on every route change, so this
// gives us a fresh fade-up for every navigation inside the app shell.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up motion-reduce:animate-none">{children}</div>;
}
