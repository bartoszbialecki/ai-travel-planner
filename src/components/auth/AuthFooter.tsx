import React from "react";

interface AuthFooterProps {
  mode: "login" | "register";
}

const AuthFooter: React.FC<AuthFooterProps> = ({ mode }) => {
  // Render footer links depending on the current auth mode
  return (
    <div className="mt-6 text-center text-sm text-gray-500">
      {mode === "login" && (
        <>
          <span>Don&apos;t have an account? </span>
          <a href="/auth/register" className="text-blue-600 hover:underline cursor-pointer">
            Register
          </a>
        </>
      )}
      {mode === "register" && (
        <>
          <span>Already have an account? </span>
          <a href="/auth/login" className="text-blue-600 hover:underline cursor-pointer">
            Log in
          </a>
        </>
      )}
    </div>
  );
};

export default AuthFooter;
