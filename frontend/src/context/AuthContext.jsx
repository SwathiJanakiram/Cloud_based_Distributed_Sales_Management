// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { getUsers } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Role is stored in the backend — we read it from token claims if set
        // or we rely on the backend's 403 to enforce it.
        // For local routing we read the role from the DB via a small trick:
        // The verifyFirebaseToken middleware attaches role to req.user.
        // We fetch /users?limit=1 (admin only) to probe, or we store role in
        // Firebase custom claims (recommended). For now we read from localStorage
        // after the first login.
        const savedRole = localStorage.getItem("userRole");
        setRole(savedRole);
      } else {
        setUser(null);
        setRole(null);
        localStorage.removeItem("userRole");
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // After login the backend knows the role. We'll read it from a /me endpoint
    // or from localStorage set during previous session.
    // For a cleaner approach, set Firebase custom claims on your backend.
    return cred;
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("userRole");
  };

  // Call this after login to persist role (role comes from backend response)
  const setUserRole = (r) => {
    setRole(r);
    localStorage.setItem("userRole", r);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
