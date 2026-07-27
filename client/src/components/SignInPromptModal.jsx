import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, X, Sparkles, Shield } from 'lucide-react';

const SignInPromptModal = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only set timer if user is signed out and hasn't dismissed the prompt this session
    const isDismissed = sessionStorage.getItem('kforum_signin_prompt_dismissed');

    if (!user && !loading && !isDismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 20000); // 20 seconds

      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [user, loading]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('kforum_signin_prompt_dismissed', 'true');
  };

  const handleNavigate = (path) => {
    handleClose();
    navigate(path);
  };

  if (!isOpen || user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-scale-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-gray-900 via-slate-900 to-[#0b101b] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] text-center">
        
        {/* Close X Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Glow Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/30 mb-5">
          <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Modal Title & Text */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Enjoying <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">K-Forum</span>?
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed mb-6">
          Sign in now to ask questions, react to posts, vote in polls, connect with peers, and track your daily streaks!
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleNavigate('/login')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In to Continue</span>
          </button>

          <button
            onClick={() => handleNavigate('/register')}
            className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <span>Create New Account</span>
          </button>
        </div>

        {/* Dismiss Text */}
        <button
          onClick={handleClose}
          className="mt-5 text-xs text-gray-500 hover:text-gray-400 underline transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default SignInPromptModal;
