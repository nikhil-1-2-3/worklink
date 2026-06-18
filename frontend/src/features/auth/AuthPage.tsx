import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ShieldAlert, Loader2 } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    mobile: '',
    password: '',
    fullName: '',
    role: 'worker'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        const { data } = await api.post('/auth/login', {
          mobile: formData.mobile,
          password: formData.password
        });
        setAuth(data, data.token);
        if (data.role === 'admin') navigate('/admin/dashboard');
        else if (data.role === 'employer') navigate('/employer/dashboard');
        else navigate('/worker/dashboard');
      } else {
        const { data } = await api.post('/auth/register', formData);
        setAuth(data, data.token);
        if (data.role === 'employer') navigate('/employer/dashboard');
        else navigate('/worker/dashboard');
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        <button 
          onClick={() => navigate('/home')}
          className="absolute -top-12 left-0 text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1 transition"
        >
          ← Back to Home
        </button>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            <img src="/logo.png" alt="WorkLink Logo" className="h-16 mx-auto object-contain scale-125" />
          </h1>
          <p className="text-slate-500 font-medium">
            {isLogin ? 'Welcome back' : 'Create your account instantly'}
          </p>
        </div>

        <Card className="p-8 shadow-xl shadow-slate-200/50 border-slate-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-start gap-2 border border-red-100">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleFinalSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">I want to:</label>
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none bg-slate-50 hover:bg-white"
                  >
                    <option value="worker">Find Jobs (Worker)</option>
                    <option value="employer">Post Jobs (Employer)</option>
                  </select>
                </div>
              </>
            )}

            <Input
              label="Mobile Number"
              name="mobile"
              type="tel"
              placeholder="Enter 10-digit number"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? 'Sign In securely' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-brand-600 hover:text-brand-700 hover:underline"
            >
              {isLogin ? 'Create one now' : 'Sign In'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
