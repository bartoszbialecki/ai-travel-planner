import React from "react";

interface AuthHeaderProps {
  title: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ title }) => (
  <div className="flex flex-col items-center mb-6">
    <a href="/" className="mb-2">
      <img src="/favicon.svg" alt="AI Travel Planner Logo" className="h-10 w-10" />
    </a>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
  </div>
);

export default AuthHeader;
