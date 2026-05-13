'use client';

export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-scale-in motion-reduce:animate-none">{children}</div>;
}
