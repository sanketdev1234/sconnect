// src/components/usercontext.jsx
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext(null);

export function UserContextProvider({ children }) {
  const [curruser, setcurruser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true until first auth check completes

  // Backend: GET /auth/authstatus
  // Success → { status: true, user: {...} }
  // No token → "token not found" (plain text, status 200)
  // Invalid token → "token not match" (plain text)
  useEffect(() => {
    axios.get('/auth/authstatus', { withCredentials: true })
      .then(res => {
        // Backend returns JSON only on success, plain strings on failure
        if (res.data?.status === true && res.data?.user) {
          setcurruser(res.data.user);
        } else {
          setcurruser(null);
        }
      })
      .catch(() => {
        setcurruser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  return (
    <UserContext.Provider value={{ curruser, setcurruser, authLoading }}>
      {children}
    </UserContext.Provider>
  );
}