import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useFaith } from '../contexts/FaithContext';

const MessageAnalyzer = () => {
  const [theirMessage, setTheirMessage] = useState('');
  const [yourMessage, setYourMessage] = useState('');
  const [context, setContext] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [result, setResult] = useState(null);
  const [historyView, setHistoryView] = useState(false);
  
  const { 
    analyzeMessage, 
    isLoading, 
    error, 
    analysisHistory,
    relationships
  } = useAppContext();

  const { faithModeEnabled, getFaithContent } = useFaith();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Make sure at least one of the message fields is filled
    if (!theirMessage.trim() && !yourMessage.trim()) return;

    // Combine messages into a conversation format
    const conversationText = [
      theirMessage.trim() ? `Their message: ${theirMessage}` : '',
      yourMessage.trim() ? `Your response: ${yourMessage}` : ''
    ].filter(Boolean).join('\n\n');
    
    try {
      const data = await analyzeMessage(
        conversationText, 
        context || null, 
        selectedRelationship || null
      );
      setResult(data);
      setTheirMessage('');
      setYourMessage('');
      setContext('');
    } catch (err) {
      console.error('Analysis submission error:', err);
    }
  };

  const relationshipOptions = [
    { id: '', name: 'None/General' },
    ...(relationships || [])
  ];

  const renderAnalysisCard = (analysis) => {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Analysis {analysis.relationship_name ? `(${analysis.relationship_name})` : ''}
          </h3>
          <span className="text-sm text-gray-500">
            {new Date(analysis.created_at).toLocaleString()}
          </span>
        </div>
        
        {/* Original Text */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Conversation</h4>
          <div className="whitespace-pre-wrap text-gray-800">{analysis.text}</div>
        </div>
        
        {/* Flags Section */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Emotional Red Flags</h4>
          {analysis.flags && analysis.flags.length > 0 ? (
            <div className="space-y-3">
              {analysis.flags.map((flag, idx) => (
                <div key={idx} className="bg-red-50 border border-red-100 p-3 rounded-lg">
                  <div className="flex items-start">
                    <div className="w-3 h-3 mt-1 rounded-full mr-2 bg-red-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {flag.participant 
                          ? `${flag.type} (${flag.participant.charAt(0).toUpperCase() + flag.participant.slice(1)} Message)` 
                          : flag.type}
                      </p>
                      <p className="text-sm text-gray-600">
                        {flag.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 p-3 rounded-lg">
              <div className="flex items-start">
                <div className="w-3 h-3 mt-1 rounded-full mr-2 bg-green-500"></div>
                <p className="text-sm text-gray-800">
                  No emotional red flags detected in this conversation.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Emotional Intelligence Analysis */}
        <div className="mb-6 space-y-6">
          {/* Sentiment and Confidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Sentiment</h4>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    analysis.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    analysis.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {analysis.sentiment ? analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1) : 'Neutral'}
                  </span>
                  {analysis.confidence_score && (
                    <span className="text-xs text-gray-600">
                      Confidence: {Math.round(analysis.confidence_score * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Emotional Maturity Level */}
            {analysis.emotional_maturity_level && (
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">Emotional Maturity</h4>
                <div className="p-4 bg-cyan-50 rounded-lg">
                  <p className="text-sm text-gray-800">{analysis.emotional_maturity_level}</p>
                </div>
              </div>
            )}
          </div>

          {/* Emotional Tone */}
          {analysis.emotional_tone && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Emotional Tone</h4>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-gray-800">{analysis.emotional_tone}</p>
              </div>
            </div>
          )}

          {/* Communication Style */}
          {analysis.communication_style && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Communication Style</h4>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-gray-800">{analysis.communication_style}</p>
              </div>
            </div>
          )}

          {/* Relationship Insights */}
          {analysis.relationship_insights && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Relationship Insights</h4>
              <div className="p-4 bg-rose-50 rounded-lg">
                <p className="text-gray-800">{analysis.relationship_insights}</p>
              </div>
            </div>
          )}

          {/* Potential Triggers */}
          {analysis.potential_triggers && analysis.potential_triggers.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Potential Triggers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {analysis.potential_triggers.map((trigger, idx) => (
                  <div key={idx} className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
                    <p className="text-sm text-gray-800">{trigger}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Emotional Flags */}
          {analysis.emotional_flags && analysis.emotional_flags.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-3">Emotional Patterns</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {analysis.emotional_flags.map((flag, idx) => (
                  <div key={idx} className="bg-purple-50 border border-purple-100 p-2 rounded-lg">
                    <span className="text-xs font-medium text-purple-800">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* General Interpretation */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">General Interpretation</h4>
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-gray-800">{analysis.interpretation}</p>
          </div>
        </div>
        
        {/* Suggestions Section */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">Personalized Suggestions</h4>
          <div className="space-y-3">
            {analysis.suggestions && analysis.suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-green-50 border border-green-100 p-3 rounded-lg">
                <p className="text-sm text-gray-800">{suggestion}</p>
              </div>
            ))}
          </div>
          
          {/* Faith-Based Perspective (when Faith Mode is enabled) */}
          {faithModeEnabled && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">Faith Perspective</h4>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                <p className="text-sm text-gray-800">
                  {getFaithContent('reframe') || 
                   "Consider how your faith tradition might guide you to approach this conversation with compassion, understanding, and wisdom."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Message Analyzer</h1>
        <p className="text-gray-600 mt-2">
          Analyze conversations to uncover emotional patterns and identify potential red flags in both messages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className={`lg:col-span-${historyView ? 1 : 2}`}>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">New Conversation Analysis</h2>
              <button
                onClick={() => setHistoryView(!historyView)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {historyView ? 'Hide History' : 'Show History'}
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Related To (Optional)
                </label>
                <select
                  id="relationship"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                >
                  {relationshipOptions.map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="theirMessage" className="block text-sm font-medium text-gray-700 mb-1">
                  Their Message
                </label>
                <textarea
                  id="theirMessage"
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="What did they say? Paste their message here..."
                  value={theirMessage}
                  onChange={(e) => setTheirMessage(e.target.value)}
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label htmlFor="yourMessage" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Response
                </label>
                <textarea
                  id="yourMessage"
                  rows="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="What did you say in response? (Optional)"
                  value={yourMessage}
                  onChange={(e) => setYourMessage(e.target.value)}
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">
                  *At least one of the message fields is required
                </p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
                  Context (Optional)
                </label>
                <textarea
                  id="context"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add any relevant context about this conversation..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                ></textarea>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading || (!theirMessage.trim() && !yourMessage.trim())}
                className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                  isLoading || (!theirMessage.trim() && !yourMessage.trim())
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Conversation'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results or History */}
        <div className={`lg:col-span-${historyView ? 2 : 1}`}>
          {result && !historyView && renderAnalysisCard(result)}
          
          {historyView && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Analysis History</h2>
              
              {analysisHistory && analysisHistory.length > 0 ? (
                <div className="space-y-6">
                  {analysisHistory.map((item, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {item.relationship_name || 'General Analysis'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.flags && item.flags.length > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.flags && item.flags.length > 0 
                            ? `${item.flags.length} flag${item.flags.length > 1 ? 's' : ''}` 
                            : 'Healthy'}
                        </div>
                      </div>
                      <p className="text-gray-700 mt-2 line-clamp-2">
                        {item.text}
                      </p>
                      <button
                        onClick={() => {
                          setResult(item);
                          setHistoryView(false);
                        }}
                        className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <p className="text-gray-600">No analysis history yet</p>
                </div>
              )}
            </div>
          )}
          
          {!result && !historyView && (
            <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-indigo-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Enter conversation to analyze
              </h3>
              <p className="text-gray-600 mb-4">
                Your analysis results will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageAnalyzer;
