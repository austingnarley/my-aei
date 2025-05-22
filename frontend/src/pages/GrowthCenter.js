import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';

const GrowthCenter = () => {
  const { growthPlan } = useAppContext();
  const [activeDay, setActiveDay] = useState(1);
  const [showFaithMode, setShowFaithMode] = useState(false);
  const [selectedFaith, setSelectedFaith] = useState('');
  const [journalEntry, setJournalEntry] = useState('');
  const [journalSubmitted, setJournalSubmitted] = useState(false);
  
  const faithOptions = [
    { id: 'christianity', name: 'Christianity' },
    { id: 'buddhism', name: 'Buddhism' },
    { id: 'islam', name: 'Islam' },
    { id: 'judaism', name: 'Judaism' },
    { id: 'hinduism', name: 'Hinduism' },
    { id: 'spiritual', name: 'Non-denominational Spiritual' }
  ];
  
  const handleJournalSubmit = (e) => {
    e.preventDefault();
    if (!journalEntry.trim()) return;
    
    // In a real app, we would send this to the API
    console.log('Journal submitted:', journalEntry);
    setJournalSubmitted(true);
    // Don't clear the entry to allow the user to see what they submitted
  };
  
  const handleFaithToggle = () => {
    setShowFaithMode(!showFaithMode);
    if (!showFaithMode && !selectedFaith) {
      setSelectedFaith('spiritual'); // Default selection
    }
  };

  if (!growthPlan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Growth Center</h1>
            <p className="text-gray-600 mt-2">
              Where emotional awareness becomes actionable growth
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Faith Mode</span>
            <button
              onClick={handleFaithToggle}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                showFaithMode ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  showFaithMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Faith Selection (visible only when Faith Mode is on) */}
      {showFaithMode && (
        <div className="bg-indigo-50 p-6 rounded-xl mb-8">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4">Faith Framework</h2>
          <p className="text-gray-700 mb-4">
            Select your preferred spiritual or faith framework to receive content aligned with your values and beliefs.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {faithOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSelectedFaith(option.id)}
                className={`p-3 rounded-lg text-center transition-colors ${
                  selectedFaith === option.id
                    ? 'bg-indigo-200 text-indigo-800'
                    : 'bg-white hover:bg-indigo-100 text-gray-700'
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Plan */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              This Week's Journey: {growthPlan.current_week.theme}
            </h2>
            
            {/* Day tabs */}
            <div className="flex overflow-x-auto space-x-2 mb-6">
              {growthPlan.current_week.days.map(day => (
                <button
                  key={day.day}
                  onClick={() => setActiveDay(day.day)}
                  className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                    activeDay === day.day
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>
            
            {/* Active day content */}
            {growthPlan.current_week.days.map(day => (
              <div key={day.day} className={activeDay === day.day ? 'block' : 'hidden'}>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{day.title}</h3>
                  <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full mb-4">
                    {day.activity_type}
                  </div>
                  <p className="text-gray-700">{day.content}</p>
                  
                  {/* Faith-specific content (shown only in Faith Mode) */}
                  {showFaithMode && selectedFaith && (
                    <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                      <h4 className="text-md font-medium text-indigo-800 mb-2">
                        {selectedFaith === 'christianity' ? 'Scripture Reflection' : 
                         selectedFaith === 'buddhism' ? 'Dharma Teaching' :
                         selectedFaith === 'islam' ? 'Quranic Wisdom' :
                         selectedFaith === 'judaism' ? 'Torah Insight' :
                         selectedFaith === 'hinduism' ? 'Vedic Guidance' :
                         'Spiritual Perspective'}
                      </h4>
                      <p className="text-gray-700">
                        {selectedFaith === 'christianity' ? 
                          '"Do not conform to the pattern of this world, but be transformed by the renewing of your mind." This transformation begins with recognizing your inherent worth and validating your experiences.' :
                          
                         selectedFaith === 'buddhism' ? 
                          'The Buddha teaches us to observe our thoughts without judgment. As you practice emotional self-validation, notice how it cultivates compassion toward yourself and others.' :
                          
                         selectedFaith === 'islam' ? 
                          'Allah created each person with a unique purpose and inherent dignity. Honor the emotions that arise within you as signs pointing toward greater self-awareness.' :
                          
                         selectedFaith === 'judaism' ? 
                          'The Talmud teaches that each person contains worlds within them. Your emotions are valid messengers, worthy of your attention and respect.' :
                          
                         selectedFaith === 'hinduism' ? 
                          'The practice of self-validation aligns with the concept of Ahimsa (non-violence) applied to oneself, honoring your emotions without harsh judgment.' :
                          
                         'Every emotion that arises within you has wisdom to offer. By validating rather than judging your feelings, you create space for growth and healing.'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Journaling area */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Reflection Journal</h3>
                  <form onSubmit={handleJournalSubmit}>
                    <div className="mb-4">
                      <textarea
                        rows="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Reflect on today's practice..."
                        value={journalEntry}
                        onChange={(e) => setJournalEntry(e.target.value)}
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={!journalEntry.trim() || journalSubmitted}
                      className={`py-2 px-4 rounded-md font-medium text-white transition-colors ${
                        !journalEntry.trim() || journalSubmitted
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {journalSubmitted ? 'Submitted ✓' : 'Save Reflection'}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side panel with goals and practices */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Growth Goals</h2>
            <div className="space-y-3">
              {growthPlan.goals.map((goal, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-none mr-3">
                    <div className="w-5 h-5 border-2 border-indigo-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-gray-700">{goal}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Practice</h2>
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Today's Micro-Practice</h3>
              <p className="text-gray-700 mb-4">
                Take three deep breaths whenever you notice self-criticism today. With each exhale, 
                mentally say "I acknowledge this feeling without judgment."
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Set a reminder</span>
                <button className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 transition-colors">
                  Remind Me
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium text-gray-800 mb-3">Suggested Scripts</h3>
              <div className="space-y-3">
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    "I notice I'm feeling [emotion] right now, and that's completely valid given the situation."
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">
                    "My feelings don't need to be justified to be real. I can acknowledge them without judgment."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthCenter;
