import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Lock, Mail, AlertCircle, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [step, setStep] = useState('LOGIN'); //'LOGIN', 'FORGOT_EMAIL', 'FORGOT_OTP', 'FORGOT_RESET', 'SUCCESS'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/admin/dashboard');
            } else {
                setError(result.message || 'Invalid credentials');
            }
        } catch {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        if (!resetEmail) {
            setError('Please enter your email address');
            return;
        }
        setLoading(true);
        try {
            await authAPI.forgotPassword(resetEmail);
            setStep('FORGOT_OTP');
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }
        setLoading(true);
        try {
            await authAPI.verifyOTP(resetEmail, otp);
            setStep('FORGOT_RESET');
        } catch (err) {
            setError(err.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await authAPI.resetPassword(resetEmail, otp, newPassword);
            setStep('SUCCESS');
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setStep('LOGIN');
        setResetEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-900 p-8 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {step === 'LOGIN' ? 'Welcome Back' : 'Security Check'}
                        </h2>
                        <p className="text-indigo-200">
                            {step === 'LOGIN' ? 'Sign in to access your dashboard' : 'Recover your admin account'}
                        </p>
                    </div>
                    {/* Decorative Background Circles */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-800 rounded-full opacity-50 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-indigo-700 rounded-full opacity-50 blur-2xl"></div>
                </div>

                <div className="p-8">
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 text-red-700"
                            >
                                <AlertCircle size={20} className="shrink-0" />
                                <p className="text-sm">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step: Login Form */}
                    {step === 'LOGIN' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            autoComplete="username"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="admin@example.com"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-700">Password</label>
                                        <button 
                                            type="button"
                                            onClick={() => setStep('FORGOT_EMAIL')}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            autoComplete="current-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                            placeholder="••••••••"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Signing In...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
                                <p className="mb-2">Demo Credentials:</p>
                                <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-900">Super Admin</p>
                                        <p>super@admin.com</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Lodge Admin</p>
                                        <p>bhakti@admin.com</p>
                                    </div>
                                    <div className="col-span-2 text-center text-gray-400 font-mono">
                                        password: password
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step: Forgot Password - Email */}
                    {step === 'FORGOT_EMAIL' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <button 
                                onClick={() => setStep('LOGIN')}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Back to Login
                            </button>
                            
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Forgot Password?</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Enter your registered email address and we'll send you a 6-digit verification code.
                                </p>
                            </div>

                            <form onSubmit={handleRequestOTP} className="space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder="Enter your email"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Send OTP'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step: Forgot Password - OTP */}
                    {step === 'FORGOT_OTP' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <button 
                                onClick={() => setStep('FORGOT_EMAIL')}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Change Email
                            </button>
                            
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <KeyRound size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">OTP Verification</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    We've sent a 6-digit code to <br/><span className="font-semibold text-gray-700">{resetEmail}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOTP} className="space-y-6">
                                <input
                                    type="text"
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="block w-full px-3 py-4 border-2 border-dashed border-gray-300 rounded-xl text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-200"
                                    placeholder="000000"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify OTP'}
                                </button>
                                <p className="text-center text-xs text-gray-400">
                                    Didn't receive the code? 
                                    <button 
                                        type="button" 
                                        onClick={handleRequestOTP}
                                        className="ml-1 text-indigo-600 font-bold hover:underline"
                                    >Resend</button>
                                </p>
                            </form>
                        </motion.div>
                    )}

                    {/* Step: Forgot Password - Reset */}
                    {step === 'FORGOT_RESET' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="mb-6 text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">New Password</h3>
                                <p className="text-gray-500 text-sm mt-1">
                                    Create a strong password to secure your account.
                                </p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder="Min 6 characters"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                        placeholder="Repeat new password"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Reset Password'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step: Success */}
                    {step === 'SUCCESS' && (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
                            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h3>
                            <p className="text-gray-500 mb-8">
                                Your account security has been updated successfully. You can now sign in with your new password.
                            </p>
                            <button
                                onClick={resetFlow}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-all active:scale-[0.98]"
                            >
                                Back to Login
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;

