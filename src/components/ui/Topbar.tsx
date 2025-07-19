import React, { useEffect, useState } from "react";
import { Button } from "./button";

interface User {
  id: string;
  email: string;
}

interface TopbarProps {
  user: User | null;
}

export const Topbar: React.FC<TopbarProps> = ({ user: initialUser }) => {
  const [user, setUser] = useState<User | null>(initialUser);

  // Optionally, you can sync with prop changes (if needed)
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  return (
    <nav className="w-full bg-white/80 backdrop-blur-soft border-b border-gray-200/50 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-soft">
      <div className="flex items-center gap-6">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-medium">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="font-bold text-xl text-gradient group-hover:opacity-80 transition-opacity">
            AI Travel Planner
          </span>
        </a>
        {user && (
          <div className="hidden md:flex items-center gap-1">
            <a
              href="/"
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Dashboard
            </a>
            <a
              href="/generate"
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Generate Plan
            </a>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600 font-medium">{user.email}</span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <a
              href="/auth/login"
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Login
            </a>
            <Button asChild className="gradient-primary hover:opacity-90 transition-opacity shadow-medium">
              <a href="/auth/register">Get Started</a>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};
