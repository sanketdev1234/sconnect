// src/components/Notfound.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from './usercontext';
import {
  ArrowLeft, Home, Search,
  LayoutDashboard, Rss, Users
} from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  const { curruser } = useContext(UserContext);

  const quickLinks = curruser
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/feed', label: 'Feed', icon: Rss },
        { to: '/myconnections', label: 'Connections', icon: Users },
      ]
    : [
        { to: '/', label: 'Home', icon: Home },
        { to: '/login', label: 'Sign In', icon: Search },
      ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* 404 number */}
        <div className="mb-6">
          <p className="text-8xl font-bold text-gray-200 select-none leading-none">
            404
          </p>
          <div className="w-16 h-1 bg-gray-900 rounded-full mx-auto -mt-3" />
        </div>

        {/* Message */}
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          {curruser && ' Head back to the dashboard to pick up where you left off.'}
        </p>

        {/* Primary actions */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
          <Link
            to={curruser ? '/dashboard' : '/'}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home size={15} />
            {curruser ? 'Dashboard' : 'Home'}
          </Link>
        </div>

        {/* Quick links */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Quick Links
          </p>
          <div className="space-y-1">
            {quickLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Icon size={15} className="text-gray-400" />
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}