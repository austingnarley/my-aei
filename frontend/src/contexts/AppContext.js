import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Global state
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [growthPlan, setGrowthPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      setDashboardError(null);
      
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/dashboard`);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setDashboardError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  // Fetch analysis history
  const fetchAnalysisHistory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/history`);
      setAnalysisHistory(response.data || []);
    } catch (err) {
      console.error('Failed to fetch analysis history:', err);
      setError('Failed to load analysis history');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze message
  const analyzeMessage = async (text, context = null, relationshipId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/analyze`, {
        text,
        context,
        relationship_id: relationshipId
      });
      
      // Update local history
      setAnalysisHistory(prev => [response.data, ...prev]);
      
      // Refresh dashboard data to reflect the new analysis
      fetchDashboardData();
      
      return response.data;
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze message. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchDashboardData();
    fetchAnalysisHistory();
    
    // This will be replaced with actual API calls when we implement the backend
    setRelationships([
      { 
        id: "1", 
        name: "John Doe", 
        type: "Friend",
        health_score: 72,
        last_contact: new Date().toISOString(),
        sentiment: "positive",
        flag_history: []
      },
      { 
        id: "2", 
        name: "Jane Smith", 
        type: "Family",
        health_score: 85,
        last_contact: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        sentiment: "positive",
        flag_history: []
      }
    ]);
    
    setGrowthPlan({
      current_week: {
        theme: "Emotional self-validation",
        days: [
          {
            day: 1,
            title: "Understanding Self-Validation",
            activity_type: "Guided Self-Inquiry",
            content: "Reflect on when you've dismissed your own feelings. What triggers self-doubt about your emotional responses?"
          },
          {
            day: 2,
            title: "Recognizing Emotional Patterns",
            activity_type: "Emotional Pattern Reframe",
            content: "Identify a recurring emotional response that you often judge. How would you respond to a friend with the same feelings?"
          },
          {
            day: 3,
            title: "Practice Validating Language",
            activity_type: "Practice/Script Challenge",
            content: "Write three statements that validate your feelings about a recent difficult situation."
          },
          {
            day: 4,
            title: "Micro-Ritual",
            activity_type: "Daily Practice",
            content: "Each time you notice self-criticism today, place a hand over your heart and say 'This feeling is valid.'"
          },
          {
            day: 5,
            title: "Weekly Reflection",
            activity_type: "Journal Prompt",
            content: "How has validating your emotions changed your interactions this week? What differences did you notice?"
          }
        ]
      },
      goals: [
        "Affirm my feelings without judgment",
        "Recognize when I'm dismissing my own emotions",
        "Respond to myself with the same compassion I'd offer others"
      ]
    });
  }, []);

  // Refresh data periodically or on specific events
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Value object to be provided to consumers
  const value = {
    dashboardData,
    isLoadingDashboard,
    dashboardError,
    relationships,
    analysisHistory,
    growthPlan,
    isLoading,
    error,
    analyzeMessage,
    fetchDashboardData,
    fetchAnalysisHistory,
    setRelationships
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
