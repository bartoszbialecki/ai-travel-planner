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
          <span>Nie masz konta? </span>
          <a href="/auth/register" className="text-blue-600 hover:underline">
            Zarejestruj się
          </a>
          <span> &middot; </span>
          <a href="/auth/forgot-password" className="text-blue-600 hover:underline">
            Nie pamiętasz hasła?
          </a>
        </>
      )}
      {mode === "register" && (
        <>
          <span>Masz już konto? </span>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Zaloguj się
          </a>
        </>
      )}
      {mode === "forgot" && (
        <>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Powrót do logowania
          </a>
        </>
      )}
      {mode === "reset" && (
        <>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Powrót do logowania
          </a>
        </>
      )}
    </div>
  );
};

export default AuthFooter;
