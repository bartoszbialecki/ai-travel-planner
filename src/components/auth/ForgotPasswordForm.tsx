import React, { useState } from "react";
import AuthHeader from "./AuthHeader";
import AuthFooter from "./AuthFooter";
import { Button } from "../ui/button";

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Invalid email format";
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
      <AuthHeader title="Password recovery" />
      {submitted ? (
        <div className="text-green-600 text-center mb-6">
          If the provided email exists, we have sent a password reset link.
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </>
      )}
      <AuthFooter mode="forgot" />
    </form>
  );
};

export default ForgotPasswordForm;
