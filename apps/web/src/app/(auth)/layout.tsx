import { Brand } from '@/components/brand';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-app">
      <div className="absolute inset-0 aurora pointer-events-none -z-10" />
      <header className="container py-6">
        <Brand />
      </header>
      <main className="flex-1 grid place-items-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
