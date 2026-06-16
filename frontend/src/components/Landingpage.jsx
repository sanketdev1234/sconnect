// src/components/Landingpage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from './ResizableNavbar';

const features = [
  { icon: '👤', title: 'Professional Profile', desc: 'Showcase your experience, education, and skills with a clean profile.' },
  { icon: '🌐', title: 'Expand Your Network', desc: 'Connect with peers, colleagues, and mentors in your industry.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'JWT authentication and secure credential handling keep your data safe.' },
  { icon: '📰', title: 'Global Feed', desc: 'Share updates, articles, and engage with the professional community.' },
  { icon: '💬', title: 'Direct Messaging', desc: 'Collaborate instantly with integrated real-time chat in meeting rooms.' },
  { icon: '📹', title: 'Video Meetings', desc: 'Create and join meetings with a unique joining ID in seconds.' },
];

export default function LandingPage() {
  const [user, setUser] = useState('');

  useEffect(() => {
    axios.get('/auth/authstatus', { withCredentials: true })
      .then(res => { if (res.data?.user) setUser(res.data.user.display_name); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-light text-gray-900 mb-4 leading-tight">
            Welcome to your professional community
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Connect with colleagues, showcase your journey, and grow your career with S-Connect.
          </p>
          {user ? (
            <Link to="/dashboard" className="inline-block px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors">
              Welcome back, {user} — Go to Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="inline-block px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors">
              Get Started for Free
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-10">
            Built for the modern professional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-lg mb-3">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}