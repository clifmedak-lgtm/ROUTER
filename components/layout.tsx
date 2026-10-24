

import type { ReactNode } from "react";

export function Logo() {
  return (
    <a href="/" className="text-2xl font-bold tracking-tight">
      Router<span className="text-green-600">.</span>
    </a>
  );
}

export function Navbar() {
  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />

        <div className="flex items-center gap-5 text-sm">
          <a href="/ride" className="hover:text-green-600">
            Book a ride
          </a>
          <a href="/trips" className="hover:text-green-600">
            My trips
          </a>
          <a href="/drive" className="hover:text-green-600">
            Become a driver
          </a>
          <a
            href="/sign-in"
            className="rounded-lg bg-green-600 px-4 py-2 text-white"
          >
            Sign in
          </a>
        </div>
      </nav>
    </header>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      {description && (
        <p className="mt-2 text-gray-600">{description}</p>
      )}
      {children}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t px-6 py-8 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} Router. All rights reserved.
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function Spinner() {
  return (
    <div
      className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-green-600"
      role="status"
      aria-label="Loading"
    />
  );
}

export function Protected({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
