import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useFaith } from '../contexts/FaithContext';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const RelationshipHub = () => {
  const { relationships, setRelationships, analyzeMessage } = useAppContext();
  const { faithModeEnabled, getFaithContent } = useFaith();
  
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [relationshipHistory, setRelationshipHistory] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  
  const [newRelationship, setNewRelationship] = useState({
    name: '',
    type: 'Friend',
    notes: ''
  });
  
  const [quickMessage, setQuickMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch relationships from API
  const fetchRelationships = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/relationships`);
      setRelationships(response.data || []);
    } catch (err) {
      console.error('Failed to fetch relationships:', err);
      setError('Failed to load relationships. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch relationship history when a relationship is selected
  const fetchRelationshipHistory = async (relationshipId) => {
    if (!relationshipId) return;
    
    try {
      setIsLoadingHistory(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/relationships/${relationshipId}/history`
      );
      setRelationshipHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch relationship history:', err);
      // Don't show error UI for history, just log it
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Create a new relationship
  const handleSubmitNewRelationship = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const relationship = {
        id: Date.now().toString(),
        name: newRelationship.name,
        type: newRelationship.type,
        notes: newRelationship.notes,
        health_score: 75, // Default starting score
        last_contact: new Date().toISOString(),
        sentiment: 'neutral',
        flag_history: [],
        created_at: new Date().toISOString()
      };
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/relationships`,
        relationship
      );
      
      setRelationships([...relationships, response.data]);
      setNewRelationship({ name: '', type: 'Friend', notes: '' });
      setShowNewForm(false);
      setSelectedRelationship(response.data);
    } catch (err) {
      console.error('Failed to create relationship:', err);
      setError('Failed to create relationship. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update an existing relationship
  const handleUpdateRelationship = async (e) => {
    e.preventDefault();
    if (!selectedRelationship) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/relationships/${selectedRelationship.id}`,
        {
          name: selectedRelationship.name,
          type: selectedRelationship.type,
          notes: selectedRelationship.notes
        }
      );
      
      // Update relationships list
      setRelationships(relationships.map(rel => 
        rel.id === response.data.id ? response.data : rel
      ));
      
      setShowEditForm(false);
    } catch (err) {
      console.error('Failed to update relationship:', err);
      setError('Failed to update relationship. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a relationship
  const handleDeleteRelationship = async () => {
    if (!selectedRelationship || !window.confirm(`Are you sure you want to delete the relationship with ${selectedRelationship.name}?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/relationships/${selectedRelationship.id}`
      );
      
      // Update relationships list
      setRelationships(relationships.filter(rel => rel.id !== selectedRelationship.id));
      setSelectedRelationship(null);
    } catch (err) {
      console.error('Failed to delete relationship:', err);
      setError('Failed to delete relationship. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick message analysis
  const handleQuickAnalysis = async (e) => {
    e.preventDefault();
    if (!quickMessage.trim() || !selectedRelationship) return;
    
    setIsAnalyzing(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/relationships/${selectedRelationship.id}/analyze`,
        {
          text: quickMessage,
          context: `Quick analysis for relationship with ${selectedRelationship.name}`,
          relationship_id: selectedRelationship.id
        }
      );
      
      setQuickMessage('');
      
      // Refresh relationship history
      await fetchRelationshipHistory(selectedRelationship.id);
      
      // Refresh relationships list to get updated health score, etc.
      await fetchRelationships();
    } catch (err) {
      console.error('Quick analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchRelationships();
  }, []);
  
  // Load relationship history when a relationship is selected
  useEffect(() => {
    if (selectedRelationship) {
      fetchRelationshipHistory(selectedRelationship.id);
    } else {
      setRelationshipHistory(null);
    }
  }, [selectedRelationship]);
  
  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
  
  // Map sentiment to color
  const getSentimentColor = (sentiment) => {
    return sentiment === 'positive' ? '#4ade80' : 
           sentiment === 'neutral' ? '#a78bfa' : 
           '#f87171';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Relationship Hub</h1>
        <p className="text-gray-600 mt-2">
          Track the emotional health of your key relationships over time.
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Relationship List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Connections</h2>
              <button
                onClick={() => setShowNewForm(true)}
                className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md hover:bg-indigo-200 transition-colors"
                disabled={isLoading}
              >
                Add New
              </button>
            </div>
            
            {isLoading && !relationships.length ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : relationships.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {relationships.map(relationship => (
                  <div 
                    key={relationship.id}
                    onClick={() => {
                      setSelectedRelationship(relationship);
                      setShowNewForm(false);
                      setShowEditForm(false);
                    }}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
                  disabled={isLoading || !newRelationship.name}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </span>
                  ) : 'Add Relationship'}
                </button>
              </form>
            </div>
          ) : showEditForm && selectedRelationship ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Edit Relationship</h2>
                <button
                  onClick={() => setShowEditForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
              
              <form onSubmit={handleUpdateRelationship}>
                <div className="mb-4">
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedRelationship.name}
                    onChange={(e) => setSelectedRelationship({
                      ...selectedRelationship, 
                      name: e.target.value
                    })}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Type
                  </label>
                  <select
                    id="edit-type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedRelationship.type}
                    onChange={(e) => setSelectedRelationship({
                      ...selectedRelationship, 
                      type: e.target.value
                    })}
                    disabled={isLoading}
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
                  <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="edit-notes"
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={selectedRelationship.notes || ''}
                    onChange={(e) => setSelectedRelationship({
                      ...selectedRelationship, 
                      notes: e.target.value
                    })}
                    disabled={isLoading}
                  ></textarea>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteRelationship}
                    className="py-3 px-4 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-md transition-colors"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </div>
              </form>
            </div>
          ) : selectedRelationship ? (
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{selectedRelationship.name}</h2>
                  <p className="text-gray-600">{selectedRelationship.type}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`px-4 py-2 rounded-lg font-medium ${
                    selectedRelationship.health_score > 75 
                      ? 'bg-green-100 text-green-800' 
                      : selectedRelationship.health_score > 50 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    Health Score: {selectedRelationship.health_score}
                  </div>
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
              
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : (
                <>
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
                        {relationshipHistory?.analyses?.length || 0}
                      </p>
                    </div>
                  </div>
                  
                  {relationshipHistory ? (
                    <>
                      {/* Health Trend Chart */}
                      {relationshipHistory.health_trend.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Relationship Health Trend</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={relationshipHistory.health_trend}
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
                      )}
                      
                      {/* Sentiment and Flag Distribution */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Sentiment Distribution */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Distribution</h3>
                          {Object.values(relationshipHistory.sentiment_counts).some(count => count > 0) ? (
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={Object.entries(relationshipHistory.sentiment_counts).map(([key, value]) => ({
                                      name: key.charAt(0).toUpperCase() + key.slice(1),
                                      value
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {Object.keys(relationshipHistory.sentiment_counts).map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={getSentimentColor(entry)} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                              No sentiment data available yet
                            </div>
                          )}
                        </div>
                        
                        {/* Flag Distribution */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Flag Distribution</h3>
                          {Object.keys(relationshipHistory.flag_types).length > 0 ? (
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={Object.entries(relationshipHistory.flag_types).map(([key, value]) => ({
                                    name: key,
                                    count: value
                                  }))}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end"
                                    height={60}
                                    tick={{ fontSize: 12 }}
                                  />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="count" fill="#f87171" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                              No flag data available yet
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Analysis History */}
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Analyses</h3>
                        {relationshipHistory.analyses.length > 0 ? (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {relationshipHistory.analyses.slice(0, 5).map((analysis, index) => (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm text-gray-500">
                                    {new Date(analysis.created_at).toLocaleString()}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    analysis.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                    analysis.sentiment === 'neutral' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
                                  </span>
                                </div>
                                <p className="text-gray-800 mb-3">{analysis.text}</p>
                                {analysis.flags && analysis.flags.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {analysis.flags.map((flag, fidx) => (
                                      <span key={fidx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                        {flag.type}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    No flags detected
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-gray-600">No analysis history yet</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mb-8 bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-600">No history data available for this relationship yet</p>
                    </div>
                  )}
                  
                  {/* Faith-Based Insight */}
                  {faithModeEnabled && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Faith-Based Insight</h3>
                      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <p className="text-gray-700">
                          {getFaithContent('reframe', { theme: 'relationship' }) || 
                           "Your faith tradition offers wisdom about relationships and how to nurture them with compassion and understanding."}
                        </p>
                      </div>
                    </div>
                  )}
                  
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
                          disabled={isAnalyzing}
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
                        {isAnalyzing ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                          </span>
                        ) : 'Analyze Message'}
                      </button>
                    </form>
                  </div>
                </>
              )}
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
                disabled={isLoading}
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
