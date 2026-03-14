import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useGetMe } from "@workspace/api-client-react";
import type { User as ApiUser } from "@workspace/api-client-react";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: ApiUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Set token for the fetch interceptor
        window.__FIREBASE_TOKEN__ = await user.getIdToken();
      } else {
        window.__FIREBASE_TOKEN__ = null;
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch application user profile if firebase auth is present
  const { data: apiUser, isLoading: apiUserLoading } = useGetMe({
    query: {
      queryKey: ["me"],
      enabled: !!firebaseUser && !loading,
      retry: false,
    }
  });

  const logout = async () => {
    await signOut(auth);
    window.__FIREBASE_TOKEN__ = null;
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: apiUser || null,
        loading: loading || (!!firebaseUser && apiUserLoading),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
