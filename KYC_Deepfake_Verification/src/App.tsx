import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { KYCForm } from './components/KYCForm';
import { Dashboard } from './components/Dashboard';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'dashboard' | 'kyc'>('dashboard');
  const [hasKYC, setHasKYC] = useState(false);
  const [checkingKYC, setCheckingKYC] = useState(true);

  useEffect(() => {
    if (user) {
      checkKYCStatus();
    } else {
      setCheckingKYC(false);
    }
  }, [user]);

  const checkKYCStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('kyc_verifications')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    setHasKYC(!!data);
    setCheckingKYC(false);
  };

  if (loading || checkingKYC) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
        <Header />
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">लोड हो रहा है... / Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
        <Header />
        <Login />
        <footer className="bg-blue-900 text-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm">
              © 2024 भारत सरकार / Government of India | सर्वाधिकार सुरक्षित / All Rights Reserved
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <Header />

      {!hasKYC && (
        <div className="bg-gradient-to-r from-orange-600 to-green-600 text-white py-3 px-4 text-center shadow-lg">
          <p className="text-sm font-medium">
            कृपया अपना केवाईसी सत्यापन पूर्ण करें / Please complete your KYC verification
          </p>
        </div>
      )}

      {hasKYC && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setView('dashboard')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                view === 'dashboard'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              डैशबोर्ड / Dashboard
            </button>
            <button
              onClick={() => setView('kyc')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                view === 'kyc'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              केवाईसी फॉर्म / KYC Form
            </button>
          </div>
        </div>
      )}

      {hasKYC ? (
        view === 'dashboard' ? <Dashboard /> : <KYCForm />
      ) : (
        <KYCForm />
      )}

      <footer className="bg-blue-900 text-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div>
              <h4 className="font-semibold mb-2">संपर्क / Contact</h4>
              <p className="text-sm text-gray-300">helpdesk@digishakti.gov.in</p>
              <p className="text-sm text-gray-300">1800-XXX-XXXX (Toll Free)</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">कार्य समय / Working Hours</h4>
              <p className="text-sm text-gray-300">सोमवार - शुक्रवार / Mon - Fri</p>
              <p className="text-sm text-gray-300">9:00 AM - 6:00 PM IST</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">महत्वपूर्ण लिंक / Important Links</h4>
              <p className="text-sm text-gray-300">गोपनीयता नीति / Privacy Policy</p>
              <p className="text-sm text-gray-300">नियम और शर्तें / Terms & Conditions</p>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-6 pt-4 text-center">
            <p className="text-sm text-gray-300">
              © 2024 भारत सरकार / Government of India | सर्वाधिकार सुरक्षित / All Rights Reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
