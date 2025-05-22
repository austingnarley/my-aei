import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-extrabold mb-8 leading-tight">
              My ÆI — Emotional Intelligence & Relationship Clarity System
            </h1>
            <p className="text-xl mb-10 opacity-90">
              Decode emotional red flags, recognize toxic patterns, and build healthier relationships —
              using behavioral science, spiritual insight, and adaptive AI feedback.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/message-analyzer"
                className="bg-white text-indigo-900 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-100 transition-colors shadow-lg"
              >
                Try Message Analyzer
              </Link>
              <Link
                to="/dashboard"
                className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-600 transition-colors border border-indigo-600 shadow-lg"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Key Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Dashboard Feature */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Dashboard</h3>
              <p className="text-gray-600 mb-4">Your emotional command center with health scores, flag incidence graphs, and relationship sentiment maps.</p>
              <Link to="/dashboard" className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
                Explore &rarr;
              </Link>
            </div>

            {/* Message Analyzer Feature */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Message Analyzer</h3>
              <p className="text-gray-600 mb-4">Scan messages to uncover emotional red flags, conflict cycles, and communication patterns.</p>
              <Link to="/message-analyzer" className="text-purple-600 font-medium hover:text-purple-800 transition-colors">
                Analyze &rarr;
              </Link>
            </div>

            {/* Relationship Hub Feature */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Relationship Hub</h3>
              <p className="text-gray-600 mb-4">Interactive profiles for key connections with health scores, flag history, and sentiment trends.</p>
              <Link to="/relationships" className="text-pink-600 font-medium hover:text-pink-800 transition-colors">
                Connect &rarr;
              </Link>
            </div>

            {/* Growth Center Feature */}
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Growth Center</h3>
              <p className="text-gray-600 mb-4">Personalized plans with self-inquiry prompts, micro-practices, and goal-setting frameworks.</p>
              <Link to="/growth-center" className="text-green-600 font-medium hover:text-green-800 transition-colors">
                Grow &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center mb-12">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Natural Language Processing + Behavioral AI</h3>
                <p className="text-gray-600">
                  Built on cognitive and emotional models: CBT, IFS, NVC, Polyvagal Theory. Maps tone, intention, and communication context to distinguish chronic toxicity from normal conflict.
                </p>
              </div>
              <div className="md:w-1/2 bg-white p-6 rounded-xl shadow-md">
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row-reverse items-center">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pl-8">
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">Adaptive Feedback Engine</h3>
                <p className="text-gray-600">
                  Learns your patterns as you journal, set goals, and label behaviors. Adjusts insights based on your growth, preferences, and relational focus for increasingly personalized reflections.
                </p>
              </div>
              <div className="md:w-1/2 bg-white p-6 rounded-xl shadow-md">
                <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-indigo-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your relationships?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
            My ÆI is a mirror for your blind spots, a framework for transformation, and a path to emotional freedom — in language your nervous system and spirit can understand.
          </p>
          <Link
            to="/message-analyzer"
            className="bg-white text-indigo-900 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-100 transition-colors shadow-lg inline-block"
          >
            Start Your Journey
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
