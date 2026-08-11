import React, { useState, useRef } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs for inputs to prevent React controlled state from locking browser autofill / user edits
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = emailRef.current?.value.trim() || '';
    const passwordVal = passwordRef.current?.value.trim() || '';
    const nameVal = nameRef.current?.value.trim() || '';

    if (!emailVal || !passwordVal) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Real Firebase Sign Up
        const userCred = await createUserWithEmailAndPassword(auth, emailVal, passwordVal);
        if (nameVal && userCred.user) {
          await updateProfile(userCred.user, { displayName: nameVal });
        }
        console.log('✅ [Firebase Auth] Account created successfully for UID:', userCred.user.uid);
      } else {
        // Real Firebase Sign In
        const userCred = await signInWithEmailAndPassword(auth, emailVal, passwordVal);
        console.log('✅ [Firebase Auth] Signed in successfully for UID:', userCred.user.uid);
      }
    } catch (err: any) {
      console.error('❌ [Firebase Auth Error]:', err);
      let msg = err?.message || 'Authentication failed.';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please check your credentials.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try signing in instead.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters long.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      // Authenticate with shared demo account so Web and Android share the exact same Firestore paths
      const demoEmail = 'demo.learner@skillsnap.ai';
      const demoPass = 'DemoLearnerPass123!';
      try {
        const userCred = await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        console.log('✅ [Firebase Auth Shared Demo] Signed in successfully for UID:', userCred.user.uid);
      } catch (signInErr) {
        console.log('Creating shared demo account in Firebase Auth...');
        const userCred = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
        if (userCred.user) {
          await updateProfile(userCred.user, { displayName: 'SkillSnap Demo Learner' });
        }
        console.log('✅ [Firebase Auth Shared Demo] Created new shared account for UID:', userCred.user.uid);
      }
    } catch (err: any) {
      console.warn('Shared email sign in fallback, attempting anonymous auth:', err);
      try {
        const userCred = await signInAnonymously(auth);
        console.log('✅ [Firebase Auth Anonymous Fallback] Signed in for UID:', userCred.user.uid);
      } catch (finalErr: any) {
        setError(finalErr?.message || 'Demo Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    if (emailRef.current) emailRef.current.value = '';
    if (passwordRef.current) passwordRef.current.value = '';
    if (nameRef.current) nameRef.current.value = '';
    setError(null);
  };

  const handleToggleMode = (targetSignUp: boolean) => {
    setIsSignUp(targetSignUp);
    setError(null);
    setTimeout(() => handleClearAll(), 10);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/30 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            SkillSnap <span className="ai-gradient-text">AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            AI-Powered E-Learning & Career Readiness Platform
          </p>
        </div>

        {/* Auth Container Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Instant Student Access
            </div>
            <p className="text-[11px] text-slate-300 mb-3">
              Sign in with a real authenticated Firebase session in 1 click.
            </p>
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>Explore as Demo Student</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="relative flex items-center justify-between mb-6">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isSignUp ? 'Create New Account' : 'Sign In With Credentials'}
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              title="Clear all fields"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear Form</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Uncontrolled Form keyed by mode so inputs remount cleanly */}
          <form
            key={isSignUp ? 'mode-signup' : 'mode-signin'}
            onSubmit={handleAuthSubmit}
            className="space-y-4"
            autoComplete="off"
          >
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={nameRef}
                    type="text"
                    name="user_fullname"
                    autoComplete="off"
                    defaultValue=""
                    placeholder="Alex Mercer"
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => { if (nameRef.current) nameRef.current.value = ''; }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={emailRef}
                  type="email"
                  name="user_email_address"
                  autoComplete="off"
                  defaultValue=""
                  placeholder="alex@skillsnap.ai"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => { if (emailRef.current) emailRef.current.value = ''; }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={passwordRef}
                  type="password"
                  name="user_password_secret"
                  autoComplete="new-password"
                  defaultValue=""
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => { if (passwordRef.current) passwordRef.current.value = ''; }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span>{isSignUp ? 'Create Real Account' : 'Sign In with Real Account'}</span>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => handleToggleMode(!isSignUp)}
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-6 flex items-center justify-center space-x-6 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Real Firebase Auth</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cloud Firestore Sync</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Credentials</span>
        </div>
      </div>
    </div>
  );
};
