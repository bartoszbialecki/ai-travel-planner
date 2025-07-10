import React from "react";

interface AuthFooterProps {
  mode: "login" | "register" | "forgot" | "reset";
}

const AuthFooter: React.FC<AuthFooterProps> = ({ mode }) => {
  // Render footer links depending on the current auth mode
  return (
    <div className="mt-6 text-center text-sm text-gray-500">
      {mode === "login" && (
        <>
          <span>Don't have an account? </span>
          <a href="/auth/register" className="text-blue-600 hover:underline">
            Register
          </a>
          <span> &middot; </span>
          <a href="/auth/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </>
      )}
      {mode === "register" && (
        <>
          <span>Already have an account? </span>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </>
      )}
      {mode === "forgot" && (
        <>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Back to login
          </a>
        </>
      )}
      {mode === "reset" && (
        <>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Back to login
          </a>
        </>
      )}
    </div>
  );
};

export default AuthFooter;
