"use client";

import { useState } from "react";
import axios from "axios";
import Image from "next/image";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    try {
      const res = await axios.post(
        `${API_ORIGIN}/api/auth/login`,
        { email, password },
        {
          withCredentials: true,
        }
      );

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT IMAGE */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center">
        <Image
          src="/images/login.jpg"
          alt="login"
          width={400}
          height={400}
          className="rounded-xl shadow-xl"
        />
      </div>

      {/* RIGHT FORM */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">

          <h2 className="text-3xl font-bold text-center mb-6">
            Welcome Back 👋
          </h2>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center bg-red-100 p-2 rounded">
              {error}
            </p>
          )}

          <input
            className="w-full p-3 border rounded-lg mb-4"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full p-3 border rounded-lg mb-6"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg"
          >
            Login
          </button>

          <p className="text-sm mt-4 text-center">
            Don’t have an account?{" "}
            <a href="/register" className="text-blue-600 font-semibold">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
