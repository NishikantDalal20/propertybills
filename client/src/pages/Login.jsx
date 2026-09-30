import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'verify-reset-otp' | 'set-new-password' | 'otp'
  const [otp, setOtp] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const { login, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formattedEmail = form.email.trim().toLowerCase();
      const res = await login({
        ...form,
        email: formattedEmail
      });

      if (res?.requiresVerification) {
        toast.error(res.message || 'Please verify your email address.');
        setForm(prev => ({ ...prev, email: formattedEmail }));
        setMode('otp');
        return;
      }

      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        const msg = err.response.data.message || 'Please verify your email address.';
        setError(msg);
        toast.error(msg);
        setForm(prev => ({ ...prev, email: form.email.trim().toLowerCase() }));
        setMode('otp');
      } else {
        const msg = err.response?.data?.message || 'Login failed';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      const msg = 'Please enter the 6-digit verification code.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyOtp(form.email, otp.trim());
      toast.success('Email verified! Logged in successfully.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) {
      const msg = 'Please enter your email address.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedEmail = form.email.trim().toLowerCase();
      const res = await forgotPassword(formattedEmail);
      toast.success(res?.message || 'Password reset code sent to your email!');
      setForm(prev => ({ ...prev, email: formattedEmail }));
      setOtp('');
      setMode('verify-reset-otp');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      const msg = 'Please enter the 6-digit verification code.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const cleanOtp = otp.trim();
      const res = await verifyResetOtp(form.email, cleanOtp);
      toast.success(res?.message || 'Code verified successfully!');
      setVerifiedOtp(cleanOtp);
      setNewPassword('');
      setConfirmPassword('');
      setMode('set-new-password');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      const msg = 'New password must be at least 6 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'Passwords do not match.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await resetPassword(form.email, verifiedOtp, newPassword);
      toast.success(res?.message || 'Password reset successfully! Please log in.');
      setForm(prev => ({ ...prev, password: '' }));
      setOtp('');
      setVerifiedOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError('');
    try {
      if (mode === 'forgot' || mode === 'verify-reset-otp' || mode === 'set-new-password') {
        const res = await forgotPassword(form.email);
        toast.success(res?.message || 'New password reset code sent!');
      } else {
        const res = await resendOtp(form.email);
        toast.success(res?.message || 'New verification code sent to your email!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend code';
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-sans">
      <Card className="w-full max-w-md">
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Sign in to manage your property bills and readings.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-xs font-semibold text-blue-600 hover:underline focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg">
                {loading ? <LoadingSpinner size="sm" color="white" label="Signing in..." /> : 'Login'}
              </Button>
            </CardContent>

            <CardFooter className="p-8 pt-0 justify-center">
              <p className="text-xs text-center text-gray-500">
                No account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
              </p>
            </CardFooter>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit}>
            <CardHeader className="p-8 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold mb-3">
                🔐
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Forgot Password</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Enter your registered email address to receive a 6-digit reset code.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg">
                {loading ? <LoadingSpinner size="sm" color="white" label="Sending Code..." /> : 'Send Reset Code'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                >
                  &larr; Back to Login
                </button>
              </div>
            </CardContent>
          </form>
        )}

        {mode === 'verify-reset-otp' && (
          <form onSubmit={handleVerifyResetOtpSubmit}>
            <CardHeader className="p-8 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold mb-3">
                ✉️
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Enter Reset Code</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{form.email}</span> to verify your identity.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="reset-otp">6-Digit Reset Code</Label>
                <Input
                  id="reset-otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center text-2xl tracking-[0.4em] font-mono py-3 font-bold"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg">
                {loading ? <LoadingSpinner size="sm" color="white" label="Verifying..." /> : 'Verify Code'}
              </Button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-blue-600 hover:underline font-semibold disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend Reset Code'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-gray-500 hover:text-gray-900"
                >
                  Back to Login
                </button>
              </div>
            </CardContent>
          </form>
        )}

        {mode === 'set-new-password' && (
          <form onSubmit={handleSetNewPasswordSubmit}>
            <CardHeader className="p-8 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-3">
                🔑
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Set New Password</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Code verified! Enter your new password for <span className="font-semibold text-gray-900">{form.email}</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" size="lg">
                {loading ? <LoadingSpinner size="sm" color="white" label="Saving..." /> : 'Save New Password & Sign In'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-xs text-gray-500 hover:text-gray-900 font-medium"
                >
                  Cancel & Back to Login
                </button>
              </div>
            </CardContent>
          </form>
        )}

        {mode === 'otp' && (
          <form onSubmit={handleOtpVerify}>
            <CardHeader className="p-8 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold mb-3">
                ✉️
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Enter the 6-digit verification code sent to <span className="font-semibold text-gray-900">{form.email}</span>.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="otp">6-Digit Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center text-2xl tracking-[0.4em] font-mono py-3 font-bold"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold" size="lg">
                {loading ? <LoadingSpinner size="sm" color="white" label="Verifying..." /> : 'Verify & Sign In'}
              </Button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-blue-600 hover:underline font-semibold disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  Back to Sign In
                </button>
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0 justify-center border-t border-gray-100 mt-2">
              <p className="text-xs text-center text-gray-500 pt-4">
                No account? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}