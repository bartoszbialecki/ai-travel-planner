import React, { useState } from "react";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";
import { Button } from "../ui/button";

const ResetPasswordForm: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!password) newErrors.password = "Hasło jest wymagane";
    else if (password.length < 8) newErrors.password = "Hasło musi mieć co najmniej 8 znaków";
    else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[@$!%*?&]/.test(password)
    ) {
      newErrors.password = "Hasło musi zawierać wielką i małą literę, cyfrę oraz znak specjalny";
    }
    if (!confirmPassword) newErrors.confirmPassword = "Potwierdź hasło";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Hasła nie są identyczne";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true); // do not submit
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 w-full">
      <AuthHeader title="Resetowanie hasła" />
      {submitted ? (
        <div className="text-green-600 text-center mb-6">Hasło zostało zresetowane. Możesz się teraz zalogować.</div>
      ) : (
        <>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nowe hasło
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Powtórz hasło
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
          <Button type="submit" className="w-full">
            Zresetuj hasło
          </Button>
        </>
      )}
      <AuthFooter mode="reset" />
    </form>
  );
};

export default ResetPasswordForm;
