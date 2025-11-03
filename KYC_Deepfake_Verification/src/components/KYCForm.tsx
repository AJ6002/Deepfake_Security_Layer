import { useState, useRef, FormEvent } from 'react';
import { Upload, FileText, Camera, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export const KYCForm = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- State for Deepfake Verification ---
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    panNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const documentInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Deepfake API Call Function ---
  const verifyDeepfake = async (imageFile: File) => {
    if (!imageFile) return;

    setIsVerifying(true);
    setVerificationResult(null);
    setIsVerified(false);

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('API request failed');

      const result = await response.json();
      console.log('Deepfake API Response:', result);

      if (result.final_prediction === 'Real') {
        setVerificationResult(`Verified as Real (Confidence: ${(result.confidence_for_real * 100).toFixed(2)}%)`);
        setIsVerified(true);
      } else {
        setVerificationResult(`Verification Failed: Potential Deepfake Detected.`);
        setIsVerified(false);
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationResult('Error: Could not connect to verification service.');
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileSelect = (file: File, type: 'document' | 'photo') => {
    if (type === 'document') {
      setDocumentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setDocumentPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      
      // Trigger deepfake check on photo selection
      verifyDeepfake(file);
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!documentFile || !photoFile) {
      alert('कृपया सभी दस्तावेज अपलोड करें / Please upload all documents');
      return;
    }

    // --- Check if photo is verified before submitting ---
    if (!isVerified) {
      alert('Image verification failed or is not complete. Please upload a clear, authentic selfie.');
      return;
    }

    setLoading(true);

    try {
      const documentUrl = await uploadFile(documentFile, 'documents');
      const photoUrl = await uploadFile(photoFile, 'photos');

      const { error } = await supabase.from('kyc_verifications').insert({
        user_id: user!.id,
        aadhaar_number: formData.aadhaarNumber,
        pan_number: formData.panNumber || null,
        address_line1: formData.addressLine1,
        address_line2: formData.addressLine2 || null,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        document_type: 'aadhaar',
        document_url: documentUrl,
        photo_url: photoUrl,
      });

      if (error) throw error;

      setSubmitted(true);
    } catch (error: any) {
      alert('त्रुटि: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center border-t-4 border-green-600">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">सफलतापूर्वक सबमिट किया गया!</h2>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Successfully Submitted!</h3>
          <p className="text-gray-600 mb-6">
            आपका केवाईसी आवेदन सफलतापूर्वक सबमिट कर दिया गया है। सत्यापन में 2-3 कार्य दिवस लग सकते हैं।
          </p>
          <p className="text-gray-600">
            Your KYC application has been submitted successfully. Verification may take 2-3 working days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border-t-4 border-orange-600">
        <div className="bg-gradient-to-r from-orange-50 to-green-50 px-6 py-6">
          <h2 className="text-2xl font-bold text-blue-900 text-center">
            केवाईसी सत्यापन फॉर्म / KYC Verification Form
          </h2>
          <p className="text-center text-sm text-gray-600 mt-2">
            आधार आधारित पहचान सत्यापन / Aadhaar-based Identity Verification
          </p>
        </div>

        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="flex justify-between items-center">
            <div className={`flex items-center ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 1 ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-400'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Personal Details</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-300">
              <div className={`h-full ${step >= 2 ? 'bg-orange-600' : ''}`}></div>
            </div>
            <div className={`flex items-center ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 2 ? 'border-orange-600 bg-orange-600 text-white' : 'border-gray-400'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">Documents</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                व्यक्तिगत विवरण / Personal Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  आधार नंबर / Aadhaar Number *
                </label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  required
                  maxLength={12}
                  pattern="[0-9]{12}"
                  value={formData.aadhaarNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="1234 5678 9012"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पैन नंबर / PAN Number (वैकल्पिक / Optional)
                </label>
                <input
                  type="text"
                  name="panNumber"
                  maxLength={10}
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  value={formData.panNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="ABCDE1234F"
                />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 pt-4">
                पता / Address
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पता पंक्ति 1 / Address Line 1 *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  required
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पता पंक्ति 2 / Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    शहर / City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    राज्य / State *
                  </label>
                  <select
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">राज्य चुनें / Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  पिन कोड / PIN Code *
                </label>
                <input
                  type="text"
                  name="pincode"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="110001"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg"
              >
                अगला: दस्तावेज अपलोड करें / Next: Upload Documents
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                दस्तावेज अपलोड करें / Upload Documents
              </h3>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>महत्वपूर्ण / Important:</strong> कृपया स्पष्ट और पठनीय दस्तावेज अपलोड करें।
                  Please upload clear and readable documents.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  आधार कार्ड / Aadhaar Card *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                  {documentPreview ? (
                    <div className="space-y-4">
                      <img src={documentPreview} alt="Document" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={() => documentInputRef.current?.click()}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        बदलें / Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                      <button
                        type="button"
                        onClick={() => documentInputRef.current?.click()}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        <Upload className="h-5 w-5 inline mr-2" />
                        दस्तावेज चुनें / Select Document
                      </button>
                      <p className="text-xs text-gray-500">JPG, PNG (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'document')}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  फोटो / Photograph *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors">
                  {photoPreview ? (
                    <div className="space-y-4">
                      <img src={photoPreview} alt="Photo" className="max-h-48 mx-auto rounded" />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        बदलें / Change
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        <Upload className="h-5 w-5 inline mr-2" />
                        फोटो चुनें / Select Photo
                      </button>
                      <p className="text-xs text-gray-500">JPG, PNG (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'photo')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* --- VERIFICATION STATUS DISPLAY --- */}
              {isVerifying && <p className="text-blue-500 mt-2 text-center">Verifying photo, please wait...</p>}
              {verificationResult && (
                  <p className={`mt-2 text-center font-semibold ${isVerified ? 'text-green-600' : 'text-red-500'}`}>
                      {verificationResult}
                  </p>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  पिछला / Previous
                </button>
                <button
                  type="submit"
                  disabled={loading || !documentFile || !photoFile || !isVerified || isVerifying}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'सबमिट हो रहा है...' : 'सबमिट करें / Submit'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};