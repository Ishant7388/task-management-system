"use client";

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">

      {/* MAIN CONTAINER */}
      <div className="max-w-6xl w-full mx-auto grid md:grid-cols-2 gap-10 items-center p-10">

        {/* LEFT CONTENT */}
        <div className="space-y-6 animate-fade-in">

          <h1 className="text-5xl font-bold text-gray-800 leading-tight">
            Task Manager 🚀
          </h1>

          <p className="text-gray-600 text-lg">
            Organize your work, boost productivity, and track your progress
            with a modern task management system.
          </p>

          {/* BUTTONS */}
          <div className="flex gap-4">

            <Link href="/login">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105">
                Sign In
              </button>
            </Link>

            <Link href="/register">
              <button className="bg-white border border-gray-300 hover:bg-gray-100 px-6 py-3 rounded-xl shadow-md transition transform hover:scale-105">
                Sign Up
              </button>
            </Link>

          </div>

        </div>

        {/* RIGHT IMAGE */}
        <div className="flex justify-center animate-float">

      <img
        src="https://cdn-icons-png.flaticon.com/512/9068/9068756.png"
        alt="task illustration"
        className="w-[350px] drop-shadow-xl"
      />

        </div>

      </div>

      {/* CUSTOM ANIMATIONS */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }
      `}</style>
    </div>
  );
}