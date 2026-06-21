// src/components/Landingpage.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './usercontext';
import Navbar from './ResizableNavbar';
import {
  UserCircle,
  Users,
  FileText,
  Rss,
  MessageSquare,
  Video,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const features = [
  {
    icon: UserCircle,
    title: 'Professional Profile',
    desc: 'Build a complete profile with your experience, education, skills, and social links. Download it as a PDF resume anytime.',
  },
  {
    icon: Users,
    title: 'Grow Your Network',
    desc: 'Send and receive connection requests. Manage your professional network and discover people in your field.',
  },
  {
    icon: Rss,
    title: 'Activity Feed',
    desc: 'Share posts with your connections. Like, comment, and stay updated with what your network is doing.',
  },
  {
    icon: Video,
    title: 'Video Meetings',
    desc: 'Create instant meetings with a unique joining ID. Share it with anyone and collaborate in real time.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time Chat',
    desc: 'Chat inside meeting rooms. Edit and delete your messages. Stay connected throughout the session.',
  },
  {
    icon: FileText,
    title: 'Resume Download',
    desc: 'Your profile automatically generates a downloadable PDF resume — ready to share with employers.',
  },
];

const steps = [
  { step: '01', title: 'Create your account', desc: 'Sign up in seconds with your name and email.' },
  { step: '02', title: 'Build your profile', desc: 'Add your experience, education, and social links.' },
  { step: '03', title: 'Connect & collaborate', desc: 'Find connections, post updates, and start meetings.' },
];

export default function LandingPage() {
  const { curruser, authLoading } = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">

          {/* Tag line */}
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-gray-600">Professional Networking Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Connect. Collaborate.<br />
            <span className="text-gray-500 font-normal">Grow your career.</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            S-Connect brings your professional network together — with profiles,
            posts, real-time meetings, and chat all in one place.
          </p>

          {/* CTA — aware of auth state */}
          {authLoading ? (
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto" />
          ) : curruser ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Logged in as <span className="font-semibold text-gray-900">{curruser.display_name}</span>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Go to Dashboard
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Get Started — It's Free
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-600 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="py-14 px-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
            How it works
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-10">
            Up and running in 3 steps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps — desktop only */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(50%+24px)] right-0 h-px bg-gray-200" />
                )}
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mb-3 z-10">
                  {s.step}
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="py-14 px-4 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
            Features
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-10">
            Everything you need in one place
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <Icon size={18} className="text-gray-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── What you get ─────────────────────────────────────── */}
      <section className="py-14 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-2">
            Why S-Connect
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-8">
            Built for professionals
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Free to join — no credit card required',
              'Secure JWT-based authentication',
              'Real-time chat inside meeting rooms',
              'Auto-generated PDF resume from your profile',
              'Role-based connection management',
              'Personalized post feed from your network',
              'Edit and delete your own messages',
              'Create and join meetings with a unique ID',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 py-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────── */}
      {!authLoading && !curruser && (
        <section className="py-14 px-4 bg-gray-900">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Join S-Connect today and start building your professional network.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Create your account
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Already a member? Sign in
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">S-Connect</span>
          </div>
          <p className="text-xs text-gray-400">
            Built by Sanket Zilpe · {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Sign Up
            </Link>
            <Link to="/contact" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}