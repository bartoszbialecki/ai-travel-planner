import React from "react";

interface AuthHeaderProps {
  title: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ title }) => (
  <div className="flex flex-col items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
  </div>
);

export default AuthHeader;
