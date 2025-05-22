import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';

// Context Providers
import { AppProvider } from './contexts/AppContext';
import { FaithProvider } from './contexts/FaithContext';

// Pages (will import these from separate files after creation)
import Dashboard from './pages/Dashboard';
import MessageAnalyzer from './pages/MessageAnalyzer';
import RelationshipHub from './pages/RelationshipHub';
import GrowthCenter from './pages/GrowthCenter';
import Home from './pages/Home';

// Components
const Header = () => {
  const location = useLocation();
  const { faithModeEnabled, toggleFaithMode } = useFaith();
  
  return (
    <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-6 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl font-extrabold">My ÆI</span>
            <span className="text-sm bg-purple-900 px-2 py-1 rounded-md opacity-75">Alpha</span>
          </Link>
          
          <div className="flex items-center">
            <nav className="hidden md:flex space-x-8 mr-6">
              <Link to="/message-analyzer" 
                className={`font-medium hover:text-purple-300 transition-colors ${location.pathname === '/message-analyzer' ? 'text-white' : 'text-purple-300'}`}>
                Message Analyzer
              </Link>
              <Link to="/dashboard" 
                className={`font-medium hover:text-purple-300 transition-colors ${location.pathname === '/dashboard' ? 'text-white' : 'text-purple-300'}`}>
                Dashboard
              </Link>
              <Link to="/relationships" 
                className={`font-medium hover:text-purple-300 transition-colors ${location.pathname === '/relationships' ? 'text-white' : 'text-purple-300'}`}>
                Relationships
              </Link>
              <Link to="/growth-center" 
                className={`font-medium hover:text-purple-300 transition-colors ${location.pathname === '/growth-center' ? 'text-white' : 'text-purple-300'}`}>
                Growth Center
              </Link>
            </nav>
            
            {/* Faith Mode Toggle */}
            <div className="hidden md:flex items-center space-x-2 border-l border-purple-600 pl-6">
              <span className="text-xs font-medium">Faith Mode</span>
              <button
                onClick={toggleFaithMode}
                className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors focus:outline-none ${
                  faithModeEnabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
                aria-label="Toggle Faith Mode"
              >
                <span
                  className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${
                    faithModeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-white focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 py-8 mt-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="mb-4 md:mb-0">
          <h3 className="text-white text-lg font-bold mb-2">My ÆI</h3>
          <p className="text-sm">Emotional Intelligence & Relationship Clarity</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
          <div>
            <h4 className="text-white font-medium mb-2">Privacy</h4>
            <p className="text-xs">Your data is encrypted and never stored without consent.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Support</h4>
            <p className="text-xs">help@myaei.app</p>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-4 border-t border-gray-800 text-xs text-center">
        &copy; {new Date().getFullYear()} My ÆI. All rights reserved.
      </div>
    </div>
  </footer>
);

const PrivacyBanner = ({ onAccept }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white py-4 px-6 shadow-lg z-50">
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <p className="mb-4 md:mb-0 text-sm">
          <span className="font-bold">Privacy Notice:</span> Text is sent to an AI service for analysis (encrypted in transit).
          You can disable this in Settings.
        </p>
        <button 
          onClick={onAccept}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors text-sm"
        >
          Accept & Continue
        </button>
      </div>
    </div>
  </div>
);

function MainLayout({ children }) {
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(true);

  useEffect(() => {
    // Check if user has already accepted privacy notice
    const hasAccepted = localStorage.getItem('privacyAccepted');
    if (hasAccepted) {
      setShowPrivacyBanner(false);
    }
  }, []);

  const handlePrivacyAccept = () => {
    localStorage.setItem('privacyAccepted', 'true');
    setShowPrivacyBanner(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      {showPrivacyBanner && <PrivacyBanner onAccept={handlePrivacyAccept} />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppProvider>
        <FaithProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/message-analyzer" element={<MessageAnalyzer />} />
              <Route path="/relationships" element={<RelationshipHub />} />
              <Route path="/growth-center" element={<GrowthCenter />} />
            </Routes>
          </MainLayout>
        </FaithProvider>
      </AppProvider>
    </Router>
  );
}

export default App;
