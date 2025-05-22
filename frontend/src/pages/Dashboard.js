import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

// Chart components (using recharts)
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const DashboardCard = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    {children}
  </div>
);

const Dashboard = () => {
  const { 
    dashboardData, 
    isLoadingDashboard, 
    dashboardError,
    relationships,
    analysisHistory 
  } = useAppContext();

  if (isLoadingDashboard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p>{dashboardError}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data for flag counts
  const flagChartData = dashboardData?.flag_counts 
    ? Object.entries(dashboardData.flag_counts).map(([type, count]) => ({
        name: type.replace('_', ' '),
        count
      }))
    : [];

  // Prepare data for sentiment timeline
  const sentimentData = dashboardData?.sentiment_timeline 
    ? dashboardData.sentiment_timeline.map(([date, sentiment]) => ({
        date: new Date(date).toLocaleDateString(),
        value: sentiment === 'positive' ? 1 : sentiment === 'neutral' ? 0 : -1,
        sentiment
      }))
    : [];

  // COLORS for pie chart
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Emotional Command Center</h1>
        <p className="text-gray-600 mt-2">Get a full overview of your communication and relational health in one place.</p>
      </div>

      {/* Top row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Health Score */}
        <DashboardCard title="Overall Health Score" className="text-center">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <svg className="w-32 h-32">
                <circle
                  className="text-gray-200"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
                <circle
                  className={`${
                    dashboardData?.health_score > 75 
                      ? 'text-green-500' 
                      : dashboardData?.health_score > 50 
                      ? 'text-yellow-500' 
                      : 'text-red-500'
                  }`}
                  strokeWidth="10"
                  strokeDasharray={`${dashboardData?.health_score * 3.51}, 351`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-gray-800">
                {dashboardData?.health_score || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Based on consistency, clarity, and conflict repair</p>
          </div>
        </DashboardCard>

        {/* Quick Stats */}
        <DashboardCard title="Communication Summary">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Total Messages Analyzed</span>
                <span className="text-sm font-medium text-indigo-600">{dashboardData?.total_analyses || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, (dashboardData?.total_analyses || 0) * 5)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Red Flags Detected</span>
                <span className="text-sm font-medium text-red-600">{dashboardData?.total_flags_detected || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(100, (dashboardData?.total_flags_detected || 0) * 10)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Relationships Tracked</span>
                <span className="text-sm font-medium text-purple-600">{relationships?.length || 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, (relationships?.length || 0) * 20)}%` }}></div>
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Live Alerts */}
        <DashboardCard title="Live Alerts">
          {analysisHistory && analysisHistory.length > 0 ? (
            <div className="space-y-3">
              {analysisHistory.slice(0, 3).map((analysis, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  analysis.flags && analysis.flags.length > 0 
                    ? 'bg-red-50 border border-red-100' 
                    : 'bg-green-50 border border-green-100'
                }`}>
                  <div className="flex items-start">
                    <div className={`w-3 h-3 mt-1 rounded-full mr-2 ${
                      analysis.flags && analysis.flags.length > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {analysis.flags && analysis.flags.length > 0 
                          ? `${analysis.flags.length} flag${analysis.flags.length > 1 ? 's' : ''} detected` 
                          : 'Healthy communication'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(analysis.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/message-analyzer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium block text-center mt-4">
                View all analyses &rarr;
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-gray-500 mb-4">No recent activity to display</p>
              <Link to="/message-analyzer" className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors">
                Analyze a message
              </Link>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Red Flag Incidence Graph */}
        <DashboardCard title="Red Flag Incidence">
          {flagChartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={flagChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <p className="text-gray-500 mb-4">No red flags detected yet</p>
              <Link to="/message-analyzer" className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors">
                Analyze a message
              </Link>
            </div>
          )}
        </DashboardCard>

        {/* Sentiment Timeline */}
        <DashboardCard title="Communication Trendline">
          {sentimentData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sentimentData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    ticks={[-1, 0, 1]} 
                    tickFormatter={(value) => {
                      return value === 1 ? 'Positive' : value === 0 ? 'Neutral' : 'Negative';
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => {
                      return value === 1 ? 'Positive' : value === 0 ? 'Neutral' : 'Negative';
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <p className="text-gray-500 mb-4">Not enough data to display sentiment trends</p>
              <Link to="/message-analyzer" className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors">
                Analyze more messages
              </Link>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Relationship Sentiment Map */}
        <DashboardCard title="Relationship Sentiment Map">
          {relationships && relationships.length > 0 ? (
            <div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={relationships.map(r => ({
                        name: r.name,
                        value: r.health_score
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {relationships.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <Link to="/relationships" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium block text-center">
                  View all relationships &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-gray-500 mb-4">No relationships tracked yet</p>
              <Link to="/relationships" className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-200 transition-colors">
                Add a relationship
              </Link>
            </div>
          )}
        </DashboardCard>

        {/* Goal Progress */}
        <DashboardCard title="Goal Progress" className="col-span-1 lg:col-span-2">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Set healthy boundaries</span>
                <span className="text-sm font-medium text-green-600">60%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Recognize gaslighting</span>
                <span className="text-sm font-medium text-green-600">85%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Improve emotional regulation</span>
                <span className="text-sm font-medium text-green-600">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/growth-center" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium block text-center">
                View your growth plan &rarr;
              </Link>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default Dashboard;
