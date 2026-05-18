import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  auth, db,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from '../firebase.js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

async function saveUserProfile(user, extra = {}) {
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName || extra.displayName || '',
        photoURL:    user.photoURL || '',
        provider:    extra.provider || 'email',
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    // Non-fatal — profile saving is best-effort
    console.warn('Profile save failed:', e.message);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Google sign-in ── */
  const loginWithGoogle = useCallback(async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserProfile(result.user, { provider: 'google' });
      return { ok: true };
    } catch (e) {
      const msg = friendlyAuthError(e.code);
      setAuthError(msg);
      return { ok: false, error: msg };
    }
  }, []);

  /* ── Email sign-in ── */
  const loginWithEmail = useCallback(async (email, password) => {
    setAuthError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserProfile(result.user, { provider: 'email' });
      return { ok: true };
    } catch (e) {
      const msg = friendlyAuthError(e.code);
      setAuthError(msg);
      return { ok: false, error: msg };
    }
  }, []);

  /* ── Email sign-up ── */
  const registerWithEmail = useCallback(async (email, password, displayName) => {
    setAuthError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      await saveUserProfile(result.user, { provider: 'email', displayName });
      return { ok: true };
    } catch (e) {
      const msg = friendlyAuthError(e.code);
      setAuthError(msg);
      return { ok: false, error: msg };
    }
  }, []);

  /* ── Sign out ── */
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setAuthError(''), []);

  return (
    <AuthContext.Provider value={{
      user, loading, authError, clearError,
      loginWithGoogle, loginWithEmail, registerWithEmail, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

/* ── Human-readable Firebase error messages ── */
function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found':        'No account found with this email.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/email-already-in-use':  'An account with this email already exists.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/popup-closed-by-user':  'Sign-in was cancelled.',
    'auth/network-request-failed':'Network error. Check your connection.',
    'auth/too-many-requests':     'Too many attempts. Please try again later.',
    'auth/invalid-credential':    'Invalid email or password.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  };
  return map[code] || 'An unexpected error occurred. Please try again.';
}
