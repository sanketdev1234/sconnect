// src/components/ResizableNavbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/auth/authstatus", { withCredentials: true })
      .then(res => setUser(res.data?.user?.display_name || null))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await axios.get("/auth/logout", { withCredentials: true });
    toast.success("Logged out successfully!");
    setUser(null);
    navigate("/landingpage");
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
              <div className="w-7 h-7 bg-gray-900 text-white rounded flex items-center justify-center text-xs font-bold">S</div>
              <span className="hidden sm:inline">S-Connect</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <a href="#features" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                Features
              </a>
              <a href="/contact" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
                Contact
              </a>
              {user && (
                <span className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                  {user.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link to="/newmeet" className="px-4 py-1.5 text-sm font-semibold border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                    New Meet
                  </Link>
                  <Link to="/joinmeet" className="px-4 py-1.5 text-sm font-semibold border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                    Join Meet
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-1.5 text-sm font-semibold bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-1.5 text-sm font-semibold border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                    Log In
                  </Link>
                  <Link to="/signup" className="px-4 py-1.5 text-sm font-semibold bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600 hover:text-gray-900">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 px-4 py-3 space-y-2 bg-white">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">Features</a>
            <a href="/contact" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">Contact</a>
            <div className="pt-2 border-t border-gray-200 space-y-2">
              {user ? (
                <>
                  <Link to="/newmeet" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-center">New Meet</Link>
                  <Link to="/joinmeet" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-center">Join Meet</Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full px-3 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-center">Log In</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg text-center">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}