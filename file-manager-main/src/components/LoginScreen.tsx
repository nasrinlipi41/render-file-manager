import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, Loader2, HardDrive } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('ইউজারনেম এবং পাসওয়ার্ড উভয়ই পূরণ করুন!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'লগইন করতে ব্যর্থ হয়েছে!');
      }

      // Success! Pass token back to parent
      localStorage.setItem('ahnaf_auth_token', data.token);
      onLoginSuccess(data.token);
    } catch (err: any) {
      setError(err.message || 'ইউজারনেম অথবা পাসওয়ার্ড ভুল হয়েছে!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fadeIn">
        {/* Banner/Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-8 text-center relative overflow-hidden">
          {/* Subtle decorative background circle */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-50/50 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex p-3 bg-blue-50 rounded-2xl mb-4 border border-blue-100 shadow-sm relative z-10">
            <HardDrive className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-slate-800 relative z-10">অগ্রিম ফাইল ম্যানেজার</h2>
          <p className="text-xs text-slate-500 mt-1.5 font-medium relative z-10">ওয়েবসাইটটি অ্যাক্সেস করতে অনুগ্রহ করে লগইন করুন</p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">ইউজারনেম (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="ইউজারনেম লিখুন"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400 font-sans"
                  id="username_input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">পাসওয়ার্ড (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="পাসওয়ার্ড লিখুন"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400 font-sans font-mono"
                  id="password_input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  id="password_toggle"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
              id="login_submit_btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <span>লগইন করুন</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            নিরাপত্তার স্বার্থে যেকোনো অননুমোদিত প্রবেশ সম্পূর্ণ নিষিদ্ধ।
          </p>
        </div>
      </div>
    </div>
  );
}
