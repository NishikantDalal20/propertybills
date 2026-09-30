import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function Register() {
  const [step, setStep] = useState(1); // 1: Register Form, 2: OTP Verification
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'owner' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const { register, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formattedEmail = form.email.trim().toLowerCase();
      const formattedName = form.name.trim();

      const res = await register({
        ...form,
        name: formattedName,
        email: formattedEmail
      });

      if (res?.requiresOtp) {
        toast.success(res.message || 'Verification code sent to your email!');
        setForm(prev => ({ ...prev, email: formattedEmail }));
        setStep(2);
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
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
      toast.success('Email verified! Account created successfully.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
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
      const res = await resendOtp(form.email);
      toast.success(res?.message || 'New verification code sent to your email!');
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
        {step === 1 ? (
          <form onSubmit={handleRegisterSubmit}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Register to manage your property bills and tenants.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-8 pt-0 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
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
                <Label htmlFor="password">Password</Label>
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
                {loading ? <LoadingSpinner size="sm" color="white" label="Sending Code..." /> : 'Send Verification Code'}
              </Button>
            </CardContent>

            <CardFooter className="p-8 pt-0 justify-center">
              <p className="text-xs text-center text-gray-500">
                Have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login here</Link>
              </p>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleOtpVerify}>
            <CardHeader className="p-8 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold mb-3">
                ✉️
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                We sent a 6-digit verification code to <span className="font-semibold text-gray-900">{form.email}</span>.
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
                {loading ? <LoadingSpinner size="sm" color="white" label="Verifying..." /> : 'Verify & Activate Account'}
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
                  onClick={() => { setStep(1); setError(''); }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  Change Email
                </button>
              </div>
            </CardContent>

            <CardFooter className="p-8 pt-0 justify-center border-t border-gray-100 mt-2">
              <p className="text-xs text-center text-gray-500 pt-4">
                Already verified? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login here</Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}