import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileCheck, Clock, XCircle, CheckCircle2, LogOut } from 'lucide-react';

interface Profile {
  full_name: string;
  email: string;
}

interface KYCVerification {
  id: string;
  verification_status: 'pending' | 'under_review' | 'verified' | 'rejected';
  submitted_at: string;
  rejection_reason?: string;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [kycStatus, setKycStatus] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const { data: kycData } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .maybeSingle();

    setProfile(profileData);
    setKycStatus(kycData);
    setLoading(false);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-600',
          text: 'लंबित / Pending',
          message: 'आपका आवेदन समीक्षा के लिए प्राप्त हुआ है / Your application has been received for review'
        };
      case 'under_review':
        return {
          icon: FileCheck,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-600',
          text: 'समीक्षाधीन / Under Review',
          message: 'आपके दस्तावेजों की समीक्षा की जा रही है / Your documents are being reviewed'
        };
      case 'verified':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-600',
          text: 'सत्यापित / Verified',
          message: 'आपका केवाईसी सत्यापन सफलतापूर्वक पूर्ण हुआ / Your KYC verification is successfully completed'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-600',
          text: 'अस्वीकृत / Rejected',
          message: 'आपका आवेदन अस्वीकृत कर दिया गया है / Your application has been rejected'
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-600',
          text: 'अज्ञात / Unknown',
          message: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">लोड हो रहा है... / Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-t-4 border-orange-600 mb-6">
        <div className="bg-gradient-to-r from-orange-50 to-green-50 px-6 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-blue-900">
              स्वागत है / Welcome
            </h2>
            <p className="text-gray-700 mt-1">{profile?.full_name}</p>
            <p className="text-sm text-gray-600">{profile?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
          >
            <LogOut className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">लॉगआउट / Logout</span>
          </button>
        </div>

        <div className="px-6 py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            केवाईसी सत्यापन स्थिति / KYC Verification Status
          </h3>

          {kycStatus ? (
            <div>
              {(() => {
                const statusInfo = getStatusInfo(kycStatus.verification_status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div className={`${statusInfo.bg} border-l-4 ${statusInfo.border} rounded-lg p-6`}>
                    <div className="flex items-start space-x-4">
                      <StatusIcon className={`h-8 w-8 ${statusInfo.color} flex-shrink-0`} />
                      <div className="flex-1">
                        <h4 className={`text-xl font-bold ${statusInfo.color} mb-2`}>
                          {statusInfo.text}
                        </h4>
                        <p className="text-gray-700 mb-3">{statusInfo.message}</p>

                        {kycStatus.verification_status === 'rejected' && kycStatus.rejection_reason && (
                          <div className="bg-white border border-red-200 rounded p-3 mt-3">
                            <p className="text-sm font-semibold text-red-800 mb-1">
                              अस्वीकृति कारण / Rejection Reason:
                            </p>
                            <p className="text-sm text-gray-700">{kycStatus.rejection_reason}</p>
                          </div>
                        )}

                        <div className="mt-4 text-sm text-gray-600">
                          <p>
                            <strong>आवेदन तिथि / Submitted:</strong>{' '}
                            {new Date(kycStatus.submitted_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                कोई केवाईसी आवेदन नहीं / No KYC Application
              </h4>
              <p className="text-gray-600 mb-4">
                आपने अभी तक केवाईसी सत्यापन के लिए आवेदन नहीं किया है।
              </p>
              <p className="text-gray-600">
                You have not applied for KYC verification yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          महत्वपूर्ण सूचना / Important Information
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>केवाईसी सत्यापन 2-3 कार्य दिवसों में पूर्ण हो जाता है / KYC verification completes in 2-3 working days</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>सभी दस्तावेज स्पष्ट और पठनीय होने चाहिए / All documents must be clear and readable</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>आधार संख्या 12 अंकों की होनी चाहिए / Aadhaar number must be 12 digits</span>
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <span>फोटो हाल का और स्पष्ट होना चाहिए / Photo should be recent and clear</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
