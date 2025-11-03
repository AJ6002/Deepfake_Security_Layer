import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        if (!fullName.trim()) {
          throw new Error('कृपया पूरा नाम दर्ज करें / Please enter full name');
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'एक त्रुटि हुई / An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border-t-4 border-orange-600">
          <div className="bg-gradient-to-r from-orange-50 to-green-50 px-6 py-8">
            <div className="flex justify-center mb-4">
              {isLogin ? (
                <LogIn className="h-12 w-12 text-blue-900" />
              ) : (
                <UserPlus className="h-12 w-12 text-blue-900" />
              )}
            </div>
            <h2 className="text-center text-2xl font-bold text-blue-900">
              {isLogin ? 'लॉगिन करें / Login' : 'पंजीकरण करें / Register'}
            </h2>
            <p className="text-center text-sm text-gray-600 mt-2">
              {isLogin
                ? 'अपने खाते में लॉगिन करें / Login to your account'
                : 'नया खाता बनाएं / Create new account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  पूरा नाम / Full Name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="अपना पूरा नाम दर्ज करें"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                ईमेल / Email *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                पासवर्ड / Password *
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'कृपया प्रतीक्षा करें...' : isLogin ? 'लॉगिन करें / Login' : 'पंजीकरण करें / Register'}
            </button>

            <div className="text-center pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-blue-900 hover:text-orange-600 font-medium text-sm transition-colors"
              >
                {isLogin
                  ? 'नया खाता बनाएं / Create New Account'
                  : 'पहले से खाता है? लॉगिन करें / Already have account? Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
