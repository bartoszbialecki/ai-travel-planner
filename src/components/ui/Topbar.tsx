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
    <nav className="w-full bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <a href="/" className="font-bold text-lg text-blue-600">
          AI Travel Planner
        </a>
        {user && (
          <>
            <a href="/" className="ml-4 text-gray-700 hover:text-blue-600">
              Dashboard
            </a>
            <a href="/generate" className="ml-4 text-gray-700 hover:text-blue-600">
              Generate Plan
            </a>
            <a href="/profile" className="ml-4 text-gray-700 hover:text-blue-600">
              Profile
            </a>
          </>
        )}
      </div>
      <div>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm">{user.email}</span>
            <Button variant="outline" onClick={handleLogout} className="ml-2">
              Logout
            </Button>
          </div>
        ) : (
          <>
            <a href="/auth/login" className="mr-2 text-gray-700 hover:text-blue-600">
              Login
            </a>
            <a href="/auth/register" className="text-gray-700 hover:text-blue-600">
              Register
            </a>
          </>
        )}
      </div>
    </nav>
  );
};
