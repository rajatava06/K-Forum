import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosSetup';
import { signInWithGoogle } from '../services/firebase';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Shield } from 'lucide-react';

// Google "G" SVG logo
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState('login'); // 'login' | 'otp'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [verificationOTP, setVerificationOTP] = useState('');
  const [userId, setUserId] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', formData);
      if (response.data.requiresVerification) {
        setUserId(response.data.userId);
        setStep('otp');
        toast.success(response.data.message || 'Please verify your email.');
      } else {
        login(response.data.user, response.data.token);
        toast.success(`Welcome back, ${response.data.user.name}!`);
        navigate('/');
      }
    } catch (error) {
      if (error.response?.status === 403 && error.response.data?.requiresVerification) {
        setUserId(error.response.data.userId);
        setStep('otp');
        toast.success(error.response.data.message || 'Please verify your email.');
        return;
      }
      toast.error(error.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    console.log('--- Google Sign-In Started ---');
    try {
      console.log('1. Calling signInWithGoogle (Firebase popup)...');
      const result = await signInWithGoogle();
      console.log('2. Firebase Sign-In success, user:', result.user.email);

      const idToken = await result.user.getIdToken();
      console.log('3. Obtained Firebase ID Token');

      console.log('4. Sending token to backend /api/auth/firebase...');
      const response = await axios.post('/api/auth/firebase', { idToken });
      console.log('5. Backend response success:', response.data);

      login(response.data.user, response.data.token);
      toast.success(`Welcome, ${response.data.user.name}! 🎉`);
      navigate('/');
    } catch (error) {
      console.error('--- Google Sign-In Error ---');
      console.error('Error Code/Message:', error.code, error.message);
      if (error.response) {
        console.error('Backend Data:', error.response.data);
        console.error('Backend Status:', error.response.status);
      }
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Popup closed by user.');
        return;
      }
      toast.error(error.response?.data?.message || 'Google sign-in failed. Check console for details.');
    } finally {
      setGoogleLoading(false);
      console.log('--- Google Sign-In Ended ---');
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/verify-otp', { userId, otp: verificationOTP });
      login(response.data.user, response.data.token);
      toast.success('Email verified successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
            <span className="text-white font-extrabold text-2xl">K</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">K-Forum</h1>
          <p className="text-gray-400 text-sm mt-1">Your student community</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          {step === 'login' ? (
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-gray-400 text-sm mb-6">Sign in to your account</p>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200 mb-5 disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                {googleLoading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">or email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 text-white pl-9 pr-4 py-3 rounded-xl border border-white/10 focus:border-emerald-500/60 focus:bg-white/8 focus:outline-none transition-all text-sm placeholder-gray-600"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 text-white pl-9 pr-4 py-3 rounded-xl border border-white/10 focus:border-emerald-500/60 focus:outline-none transition-all text-sm placeholder-gray-600"
                      placeholder="Enter your password"
                    />
                  </div>
                  <div className="text-right mt-2">
                    <Link to="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white py-3 rounded-xl font-semibold hover:from-emerald-400 hover:to-teal-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1a1f2e] text-gray-400">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const demoCredentials = {
                        email: 'dummy@kiit.ac.in',
                        password: 'dummy123'
                      };

                      const response = await axios.post('/api/auth/login', demoCredentials);

                      if (response.data.requiresVerification) {
                        setUserId(response.data.userId);
                        setStep('otp');
                        toast.success(response.data.message || 'Please verify your email.');
                      } else {
                        login(response.data.user, response.data.token);
                        toast.success(`Welcome Demo User!`);
                        navigate('/');
                      }
                    } catch (error) {
                      console.error('Demo Login Error:', error);
                      toast.error('Failed to login as demo user');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Demo User Login
                </button>


              </form>

              <p className="text-center text-gray-400 text-sm mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Create one
                </Link>
              </p>
            </div>
          ) : (
            /* OTP Step */
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">Verify Email</h2>
                <p className="text-gray-400 text-sm">Enter the 6-digit code sent to your email</p>
              </div>

              <form onSubmit={handleOTPSubmit} className="space-y-4">
                <input
                  type="text"
                  value={verificationOTP}
                  onChange={(e) => setVerificationOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength="6"
                  className="w-full bg-white/5 text-white px-4 py-4 rounded-xl border border-white/10 focus:border-emerald-500/60 focus:outline-none transition-all text-center text-3xl tracking-[0.5em] font-bold placeholder-gray-600"
                  placeholder="------"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || verificationOTP.length !== 6}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-all"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
                <button type="button" onClick={() => setStep('login')} className="w-full text-gray-400 hover:text-white text-sm transition-colors py-2">
                  ← Back to login
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;