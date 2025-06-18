'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from './firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Helper function to set the auth token cookie
const setAuthCookie = async (user: User | null) => {
  if (user) {
    const token = await user.getIdToken();
    // Set the auth token as an HTTP-only cookie
    document.cookie = `auth_token=${token}; path=/; max-age=3600; SameSite=Strict`;  // Removed HttpOnly for debugging
    console.log('Auth token cookie set:', document.cookie.includes('auth_token'));
  } else {
    // Remove the auth token cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    console.log('Auth token cookie removed');
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User exists' : 'No user');
      await setAuthCookie(user);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add select_account to force account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Use popup authentication
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await setAuthCookie(result.user);
        router.push('/home');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await setAuthCookie(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 