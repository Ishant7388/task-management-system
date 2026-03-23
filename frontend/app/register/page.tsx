"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // 🔥 PASSWORD STRENGTH
  const getPasswordStrength = (password: string) => {
    let score = 0;

    if (password.length >= 5) score++;
    if (/[A-Za-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@#$*]/.test(password)) score++;

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
    if (score === 3)
      return { label: "Medium", color: "bg-yellow-500", width: "66%" };

    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const strength = getPasswordStrength(password);

  // 🔥 VALIDATION
  const validate = () => {
    if (!firstName.trim() || !lastName.trim()) {
      return "First name and last name are required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@#$*])[A-Za-z\d@#$*]{5,}$/;

    if (!passwordRegex.test(password)) {
      return "Password must include letters, numbers & special characters (@#$*)";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match";
    }

    return "";
  };

  const handleRegister = async () => {
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await axios.post(`${API_ORIGIN}/api/auth/register`, {
        name: `${firstName} ${lastName}`,
        email,
        password,
      });

      window.location.href = "/login";
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT IMAGE */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center">
        <Image
          src="/images/register.jpg"
          alt="register"
          width={420}
          height={420}
          className="rounded-xl shadow-xl"
        />
      </div>

      {/* RIGHT FORM */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 px-4">
        
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md">
        

          <h2 className="text-3xl font-bold text-center mb-6">
            Create Account ✨
          </h2>

          {/* ERROR */}
          {error && (
            <p className="text-red-500 text-sm mb-4 text-center bg-red-100 p-2 rounded">
              {error}
            </p>
          )}

          {/* NAME */}
          <div className="flex gap-3 mb-4">
            <input
              className="w-1/2 p-3 border rounded-lg"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="w-1/2 p-3 border rounded-lg"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <input
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* PASSWORD */}
          <input
            className="w-full p-3 border rounded-lg mb-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* 🔥 PASSWORD STRENGTH */}
          {password && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Password strength</span>
                <span
                  className={`font-semibold ${
                    strength.label === "Weak"
                      ? "text-red-500"
                      : strength.label === "Medium"
                      ? "text-yellow-500"
                      : "text-green-600"
                  }`}
                >
                  {strength.label}
                </span>
              </div>

              <div className="w-full bg-gray-200 h-2 rounded">
                <div
                  className={`h-2 rounded ${strength.color}`}
                  style={{ width: strength.width }}
                ></div>
              </div>
            </div>
          )}

          {/* PASSWORD RULES */}
          <div className="mb-4 bg-gray-50 border rounded-lg p-3 text-sm text-gray-700">
            <p className="font-semibold mb-2">Password must contain:</p>
            <ul className="space-y-1">
              <li>• At least 5 characters</li>
              <li>• At least one letter (A–Z or a–z)</li>
              <li>• At least one number (0–9)</li>
              <li>• At least one special character (@ # $ *)</li>
            </ul>
          </div>

          {/* CONFIRM PASSWORD */}
          <input
            className="w-full p-3 border rounded-lg mb-6"
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {/* BUTTON */}
          <button
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg hover:opacity-90 transition"
          >
            Register
          </button>

          {/* FOOTER */}
          <p className="text-sm mt-4 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-semibold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
