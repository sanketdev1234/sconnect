// src/components/Home.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { UserContext } from './usercontext';
import axios from 'axios';

import Sidebar from './Sidebar';
import CreateMeeting from './Meet/CreateMeeting';
import Login from './Auth/Login';
import Signup from './Auth/Signup';
import Showmeetdetail from './Meet/Showmeetdetail';
import Userdashboard from './Userdashboard';
import ScoketChat from './Chat/ScoketChat';
import Joinmeeting from './Meet/Joinmeet';
import NotFound from './Notfound';
import ProfileCreation from './profile/profilecreate';
import DisplayProfile from './profile/profileview';
import UpdateProfile from './profile/updateprofile';
import CreatePost from './post/createpost';
import LandingPage from './Landingpage';
import SeeAllPosts from './post/seeallpost';
import EditPost from './post/editpost';
import SeeAllPostsUser from './post/seespecificpost';
import ShowmyConnections from './connections/showmyconnections';
import Showincomingrequest from './connections/incomingrequests';
import VideoCall from './Video/VideoCall';

// Routes where sidebar should NOT appear
const NO_SIDEBAR_ROUTES = ['/', '/landingpage', '/login', '/signup'];

// ─── Route Guards ──────────────────────────────────────────────────────────────

// Redirect to /login if not authenticated
// Backend: GET /auth/authstatus → { status: true, user } or "token not found"
function ProtectedRoute({ children }) {
  const { curruser, authLoading } = useContext(UserContext);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!curruser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect to /dashboard if already logged in (for login/signup pages)
function PublicRoute({ children }) {
  const { curruser, authLoading } = useContext(UserContext);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (curruser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─── Layout Shell ──────────────────────────────────────────────────────────────

function AppShell({ children }) {
  const location = useLocation();
  const showSidebar = !NO_SIDEBAR_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {showSidebar && <Sidebar />}
      <div className={showSidebar ? 'md:ml-60' : ''}>
        {children}
      </div>
    </div>
  );
}

// ─── Main Home Component ───────────────────────────────────────────────────────

export default function Home() {
  return (
    <AppShell>
      <Routes>

        {/* ── Public Routes ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landingpage" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* ── Protected Routes ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Userdashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <SeeAllPosts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed/:full_name"
          element={
            <ProtectedRoute>
              <SeeAllPostsUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/createpost"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editpost/:postId"
          element={
            <ProtectedRoute>
              <EditPost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/newmeet"
          element={
            <ProtectedRoute>
              <CreateMeeting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/joinmeet"
          element={
            <ProtectedRoute>
              <Joinmeeting />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meet/:id/detail"
          element={
            <ProtectedRoute>
              <Showmeetdetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ongoingmeet/:meetid/:joinid"
          element={
            <ProtectedRoute>
              <ScoketChat />
            </ProtectedRoute>
          }
        />
        <Route
  path="/videocall/:joinid"
  element={
    <ProtectedRoute>
      <VideoCall />
    </ProtectedRoute>
  }
/>
        <Route
          path="/createprofile"
          element={
            <ProtectedRoute>
              <ProfileCreation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/getprofile/:wantid"
          element={
            <ProtectedRoute>
              <DisplayProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/updateprofile/:wantid/:profileId"
          element={
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/myconnections"
          element={
            <ProtectedRoute>
              <ShowmyConnections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incomingrequests"
          element={
            <ProtectedRoute>
              <Showincomingrequest />
            </ProtectedRoute>
          }
        />
        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </AppShell>
  );
}