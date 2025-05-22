import React, { useState, useEffect } from 'react';
import './App.css';

// Components
const Header = () => (
  <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-6 shadow-lg">
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-extrabold">My ÆI</span>
          <span className="text-sm bg-purple-900 px-2 py-1 rounded-md opacity-75">Alpha</span>
        </div>
        <nav className="hidden md:flex space-x-8">
          <a href="#analyzer" className="font-medium hover:text-purple-300 transition-colors">
            Message Analyzer
          </a>
          <a href="#dashboard" className="font-medium hover:text-purple-300 transition-colors">
            Dashboard
          </a>
          <a href="#" className="font-medium text-purple-300 hover:text-white transition-colors opacity-50">
            Relationships
          </a>
          <a href="#" className="font-medium text-purple-300 hover:text-white transition-colors opacity-50">
            Growth Center
          </a>
        </nav>
      </div>
    </div>
  </header>
);

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

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper function to format flag types for display
  const formatFlagType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get health score color
  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <section id="dashboard" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Emotional Dashboard</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your emotional command center for tracking patterns, health scores, and communication trends.
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin h-10 w-10 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Health Score Card */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Emotional Health Score</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e6e6e6"
                        strokeWidth="3"
                        strokeDasharray="100, 100"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={dashboardData.health_score >= 80 ? "#10B981" : 
                                dashboardData.health_score >= 60 ? "#FBBF24" :
                                dashboardData.health_score >= 40 ? "#F97316" : "#EF4444"}
                        strokeWidth="3"
                        strokeDasharray={`${dashboardData.health_score}, 100`}
                      />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <span className={`text-3xl font-bold ${getHealthScoreColor(dashboardData.health_score)}`}>
                        {dashboardData.health_score}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">Based on {dashboardData.total_analyses} analyzed messages</p>
                </div>
              </div>
              
              {/* Flag Incidence Card */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Red Flag Incidence</h3>
                {Object.keys(dashboardData.flag_counts).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(dashboardData.flag_counts).map(([flagType, count]) => (
                      <div key={flagType} className="relative pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-700">{formatFlagType(flagType)}</span>
                          </div>
                          <div className="text-sm text-gray-600">{count}</div>
                        </div>
                        <div className="overflow-hidden h-2 mt-1 text-xs flex rounded bg-gray-200">
                          <div 
                            style={{ width: `${(count / dashboardData.total_flags_detected) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-600"
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 italic">No flags detected yet</p>
                  </div>
                )}
              </div>
              
              {/* Timeline Card */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Sentiment Timeline</h3>
                {dashboardData.sentiment_timeline.length > 0 ? (
                  <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
                    {dashboardData.sentiment_timeline.map(([date, sentiment], index) => {
                      const formattedDate = new Date(date).toLocaleString();
                      return (
                        <div key={index} className="flex items-center">
                          <div 
                            className={`w-3 h-3 rounded-full mr-2 ${
                              sentiment === 'positive' ? 'bg-green-500' :
                              sentiment === 'negative' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}
                          ></div>
                          <div className="text-sm text-gray-600 truncate flex-grow">{formattedDate}</div>
                          <div 
                            className={`text-sm font-medium ml-2 ${
                              sentiment === 'positive' ? 'text-green-600' :
                              sentiment === 'negative' ? 'text-red-600' :
                              'text-gray-600'
                            }`}
                          >
                            {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 italic">No sentiment data yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-12 text-center">
            <img 
              src="https://images.unsplash.com/photo-1717501218385-55bc3a95be94" 
              alt="Emotional data visualization" 
              className="max-w-md mx-auto rounded-lg shadow-md"
            />
            <p className="mt-4 text-sm text-gray-500 max-w-xl mx-auto">
              My ÆI continuously learns from your communication patterns to provide increasingly personalized insights
              and help you build healthier relationships through emotional intelligence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
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

const FlagCard = ({ flag }) => {
  // Helper to determine severity color
  const getSeverityColor = (score) => {
    if (score >= 0.8) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 0.5) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  // Helper to format flag type for display
  const formatFlagType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-900">{formatFlagType(flag.type)}</h3>
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(flag.severity)} border`}
        >
          {Math.round(flag.severity * 100)}%
        </span>
      </div>
      <div className="mt-2">
        <p className="text-gray-500 text-sm">Evidence:</p>
        <blockquote className="mt-1 italic text-gray-700 border-l-4 border-purple-300 pl-3 py-1">
          "{flag.evidence}"
        </blockquote>
      </div>
    </div>
  );
};

const MessageAnalyzer = () => {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!message.trim()) return;
    
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: message })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      setAnalysis(result);

      // Save to local history (simplified version of IndexedDB)
      const history = JSON.parse(localStorage.getItem('messageHistory') || '[]');
      history.unshift(result);
      localStorage.setItem('messageHistory', JSON.stringify(history.slice(0, 5)));
      
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze message. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section id="analyzer" className="bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Message Analyzer</h2>
            <p className="text-lg text-gray-600">
              Paste a message, email, or journal entry to uncover emotional patterns and blind spots.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Enter text to analyze
              </label>
              <textarea
                id="message"
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Paste a message, email, or journal entry here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-md transition-colors flex items-center disabled:bg-purple-400"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !message.trim()}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    'Analyze'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {analysis && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h3>
                
                <div className="flex items-center mb-6">
                  <span className="text-sm font-medium text-gray-700 mr-3">Overall Sentiment:</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                    ${analysis.overall_sentiment === 'positive' ? 'bg-green-100 text-green-800' : 
                      analysis.overall_sentiment === 'negative' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'}`}
                  >
                    {analysis.overall_sentiment.charAt(0).toUpperCase() + analysis.overall_sentiment.slice(1)}
                  </span>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Detected Patterns:</h4>
                  {analysis.flags && analysis.flags.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.flags.map((flag, index) => (
                        <FlagCard key={index} flag={flag} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No concerning patterns detected.</p>
                  )}
                </div>
                
                {analysis.suggested_reframe && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-2">Suggested Reframe:</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-gray-800">{analysis.suggested_reframe}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

function App() {
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
        <section className="bg-gradient-to-b from-indigo-900 to-purple-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Decode Emotional Patterns. Build Healthier Relationships.</h1>
              <p className="text-xl opacity-90 mb-8">
                My ÆI helps you recognize emotional red flags, understand toxic patterns, and develop healthier communication.
              </p>
              <a href="#analyzer" className="inline-block bg-white text-purple-800 font-medium py-3 px-8 rounded-lg hover:bg-purple-100 transition-colors">
                Try Message Analysis
              </a>
            </div>
          </div>
        </section>
        
        <MessageAnalyzer />
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                My ÆI combines behavioral science, natural language processing, and adaptive feedback to help you build emotional intelligence.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-purple-50 p-6 rounded-xl">
                <div className="bg-purple-900 text-white w-10 h-10 rounded-full flex items-center justify-center mb-4">1</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Analysis</h3>
                <p className="text-gray-600">
                  Paste messages or journal entries to uncover hidden emotional patterns and communication blind spots.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-6 rounded-xl">
                <div className="bg-indigo-900 text-white w-10 h-10 rounded-full flex items-center justify-center mb-4">2</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pattern Recognition</h3>
                <p className="text-gray-600">
                  AI detects communication red flags like gaslighting, guilt-tripping, and emotional invalidation.
                </p>
              </div>
              
              <div className="bg-violet-50 p-6 rounded-xl">
                <div className="bg-violet-900 text-white w-10 h-10 rounded-full flex items-center justify-center mb-4">3</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Personalized Growth</h3>
                <p className="text-gray-600">
                  Get actionable insights and reframing suggestions based on your unique communication style.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {showPrivacyBanner && <PrivacyBanner onAccept={handlePrivacyAccept} />}
    </div>
  );
}

export default App;
