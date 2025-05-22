import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RelationshipHub = () => {
  const { relationships, setRelationships, analyzeMessage } = useAppContext();
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    name: '',
    type: 'Friend',
    notes: ''
  });
  const [quickMessage, setQuickMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Handle new relationship submission
  const handleSubmitNewRelationship = (e) => {
    e.preventDefault();
    
    const relationship = {
      id: Date.now().toString(),
      name: newRelationship.name,
      type: newRelationship.type,
      notes: newRelationship.notes,
      health_score: 75, // Default starting score
      last_contact: new Date().toISOString(),
      sentiment: 'neutral',
      flag_history: []
    };
    
    setRelationships([...relationships, relationship]);
    setNewRelationship({ name: '', type: 'Friend', notes: '' });
    setShowNewForm(false);
    setSelectedRelationship(relationship);
  };

  // Handle quick message analysis
  const handleQuickAnalysis = async (e) => {
    e.preventDefault();
    if (!quickMessage.trim() || !selectedRelationship) return;
    
    setIsAnalyzing(true);
    try {
      await analyzeMessage(quickMessage, null, selectedRelationship.id);
      setQuickMessage('');
      
      // In a real app, we would update the relationship with the new analysis data
      // For this demo, we'll just simulate it
      const updatedRelationships = relationships.map(rel => {
        if (rel.id === selectedRelationship.id) {
          return {
            ...rel,
            last_contact: new Date().toISOString(),
            flag_history: [
              ...rel.flag_history,
              {
                date: new Date().toISOString(),
                text: quickMessage.substring(0, 30) + (quickMessage.length > 30 ? '...' : ''),
                flags: [] // In a real app, this would come from the analysis result
              }
            ]
          };
        }
        return rel;
      });
      
      setRelationships(updatedRelationships);
      setSelectedRelationship(updatedRelationships.find(rel => rel.id === selectedRelationship.id));
    } catch (err) {
      console.error('Quick analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sample data for the relationship trend chart
  const generateTrendData = (relationship) => {
    if (!relationship) return [];
    
    // In a real app, this would use actual historical data
    const today = new Date();
    return Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (9 - i));
      
      // Create some random but trending data
      const score = Math.max(
        30, 
        Math.min(
          100, 
          relationship.health_score + ((Math.random() - 0.5) * 20) - ((9 - i) * 2)
        )
      );
      
      return {
        date: date.toLocaleDateString(),
        score: Math.round(score)
      };
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Relationship Hub</h1>
        <p className="text-gray-600 mt-2">
          Track the emotional health of your key relationships over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Relationship List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Connections</h2>
              <button
                onClick={() => setShowNewForm(true)}
                className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200 transition-colors"
              >
                Add New
              </button>
            </div>
            
            {relationships.length > 0 ? (
              <div className="space-y-3">
                {relationships.map(relationship => (
                  <div 
                    key={relationship.id}
                    onClick={() => setSelectedRelationship(relationship)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRelationship && selectedRelationship.id === relationship.id
                        ? 'bg-indigo-50 border border-indigo-100'
                        : 'hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-800">{relationship.name}</h3>
                        <p className="text-xs text-gray-500">{relationship.type}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-white ${
                        relationship.health_score > 75 
                          ? 'bg-green-500' 
                          : relationship.health_score > 50 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}>
                        {relationship.health_score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No relationships added yet</p>
                <button
                  onClick={() => setShowNewForm(true)}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Add Your First Relationship
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Relationship Detail or New Form */}
        <div className="lg:col-span-3">
          {showNewForm ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Add New Relationship</h2>
                <button
                  onClick={() => setShowNewForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
              
              <form onSubmit={handleSubmitNewRelationship}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newRelationship.name}
                    onChange={(e) => setNewRelationship({...newRelationship, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Type
                  </label>
                  <select
                    id="type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newRelationship.type}
                    onChange={(e) => setNewRelationship({...newRelationship, type: e.target.value})}
                  >
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Partner">Partner</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Manager">Manager</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newRelationship.notes}
                    onChange={(e) => setNewRelationship({...newRelationship, notes: e.target.value})}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
                  disabled={!newRelationship.name}
                >
                  Add Relationship
                </button>
              </form>
            </div>
          ) : selectedRelationship ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{selectedRelationship.name}</h2>
                  <p className="text-gray-600">{selectedRelationship.type}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-medium ${
                  selectedRelationship.health_score > 75 
                    ? 'bg-green-100 text-green-800' 
                    : selectedRelationship.health_score > 50 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  Health Score: {selectedRelationship.health_score}
                </div>
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Last Contact</h3>
                  <p className="text-lg font-semibold text-indigo-700">
                    {new Date(selectedRelationship.last_contact).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Current Sentiment</h3>
                  <p className="text-lg font-semibold text-purple-700 capitalize">
                    {selectedRelationship.sentiment}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Interactions Analyzed</h3>
                  <p className="text-lg font-semibold text-blue-700">
                    {selectedRelationship.flag_history.length}
                  </p>
                </div>
              </div>
              
              {/* Health Trend Chart */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Relationship Health Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={generateTrendData(selectedRelationship)}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Flag History */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Flag History Timeline</h3>
                {selectedRelationship.flag_history.length > 0 ? (
                  <div className="space-y-4">
                    {selectedRelationship.flag_history.map((entry, index) => (
                      <div key={index} className="flex">
                        <div className="flex-none mr-4">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 mt-2"></div>
                          <div className="w-0.5 h-full bg-indigo-200 ml-1.5 mt-1"></div>
                        </div>
                        <div className="flex-grow pb-6">
                          <div className="text-sm text-gray-500 mb-1">
                            {new Date(entry.date).toLocaleString()}
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-800">{entry.text}</p>
                            {entry.flags && entry.flags.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {entry.flags.map((flag, fidx) => (
                                  <span key={fidx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Healthy communication
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-600">No interaction history yet</p>
                  </div>
                )}
              </div>
              
              {/* Quick Analysis Form */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Message Analysis</h3>
                <form onSubmit={handleQuickAnalysis}>
                  <div className="mb-4">
                    <textarea
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Paste a message from ${selectedRelationship.name} to analyze...`}
                      value={quickMessage}
                      onChange={(e) => setQuickMessage(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isAnalyzing || !quickMessage.trim()}
                    className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                      isAnalyzing || !quickMessage.trim()
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Message'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 text-indigo-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Select a relationship
              </h3>
              <p className="text-gray-600 mb-6">
                Or add a new one to start tracking your relationship health
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add New Relationship
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelationshipHub;
