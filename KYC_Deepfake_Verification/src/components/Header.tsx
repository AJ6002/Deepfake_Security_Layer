import { Shield } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-orange-600 via-white to-green-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-900 p-2 rounded-full">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">DigiSakti</h1>
              <p className="text-sm text-gray-700">डिजिटल पहचान सत्यापन प्रणाली</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-blue-900">भारत सरकार</p>
              <p className="text-xs text-gray-600">Government of India</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
