import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const FaithContext = createContext();

// Faith options
export const FAITH_OPTIONS = [
  { id: 'christianity', name: 'Christianity' },
  { id: 'buddhism', name: 'Buddhism' },
  { id: 'islam', name: 'Islam' },
  { id: 'judaism', name: 'Judaism' },
  { id: 'hinduism', name: 'Hinduism' },
  { id: 'spiritual', name: 'Non-denominational Spiritual' }
];

// Custom hook to use the context
export const useFaith = () => useContext(FaithContext);

export const FaithProvider = ({ children }) => {
  // State
  const [faithModeEnabled, setFaithModeEnabled] = useState(false);
  const [selectedFaith, setSelectedFaith] = useState('');
  
  // Load settings from localStorage on initial render
  useEffect(() => {
    const storedFaithMode = localStorage.getItem('faithModeEnabled');
    const storedFaith = localStorage.getItem('selectedFaith');
    
    if (storedFaithMode) {
      setFaithModeEnabled(storedFaithMode === 'true');
    }
    
    if (storedFaith) {
      setSelectedFaith(storedFaith);
    }
  }, []);
  
  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('faithModeEnabled', faithModeEnabled.toString());
    if (selectedFaith) {
      localStorage.setItem('selectedFaith', selectedFaith);
    }
  }, [faithModeEnabled, selectedFaith]);
  
  // Toggle faith mode
  const toggleFaithMode = () => {
    setFaithModeEnabled(prev => !prev);
    
    // If enabling faith mode and no faith is selected, set default
    if (!faithModeEnabled && !selectedFaith) {
      setSelectedFaith('spiritual');
    }
  };
  
  // Change faith
  const changeFaith = (faithId) => {
    if (FAITH_OPTIONS.some(option => option.id === faithId)) {
      setSelectedFaith(faithId);
    }
  };
  
  // Get faith-specific content
  const getFaithContent = (contentType, context = {}) => {
    if (!faithModeEnabled || !selectedFaith) {
      return null;
    }
    
    // Content library for different faiths and content types
    const faithContent = {
      // Scripture reflections
      'scripture': {
        'christianity': `"${context.theme || 'Love your neighbor as yourself'}." This teaching reminds us that healthy relationships require both self-care and compassion for others.`,
        'buddhism': `The Buddha teaches that mindful awareness of our thoughts and emotions leads to freedom from suffering. Notice what arises within you without judgment.`,
        'islam': `The Quran reminds us that Allah created us with purpose and dignity. Honor both yourself and others in your interactions.`,
        'judaism': `The Torah teaches us that each person contains worlds within them. Your emotions and experiences are worthy of respect and understanding.`,
        'hinduism': `The practice of Ahimsa (non-violence) applies not only to actions but to our thoughts and words, both toward others and ourselves.`,
        'spiritual': `Every emotion that arises within you has wisdom to offer. By honoring rather than judging your feelings, you create space for growth.`
      },
      
      // Daily practices
      'practice': {
        'christianity': `Take a moment of prayer, connecting with divine love before responding to difficult situations.`,
        'buddhism': `Practice three mindful breaths before responding to challenging messages or emotions.`,
        'islam': `Remember that patience is a virtue highly regarded in Islam. Take time to reflect before responding.`,
        'judaism': `Consider the concept of "lashon hara" (harmful speech) before responding, ensuring your words bring healing rather than harm.`,
        'hinduism': `Connect to your inner wisdom through a moment of meditation before engaging with difficult emotions.`,
        'spiritual': `Ground yourself in your core values before responding to emotional triggers or challenges.`
      },
      
      // Emotional reframes
      'reframe': {
        'christianity': `Consider that everyone is on their own spiritual journey. What might God be teaching both of you through this challenge?`,
        'buddhism': `This difficulty is temporary and offers an opportunity to practice compassion for yourself and others.`,
        'islam': `Allah does not burden a soul beyond what it can bear. Trust that you have the strength to face this challenge with grace.`,
        'judaism': `This moment is an opportunity for "tikkun olam" – participating in the healing and repair of the world by choosing understanding over conflict.`,
        'hinduism': `Your response to this challenge is part of your dharma (life purpose). What response aligns with your highest self?`,
        'spiritual': `Every challenge contains a gift of growth. What wisdom might this situation be offering you?`
      }
    };
    
    return faithContent[contentType]?.[selectedFaith] || null;
  };
  
  // Context value
  const value = {
    faithModeEnabled,
    selectedFaith,
    toggleFaithMode,
    changeFaith,
    getFaithContent,
    faithOptions: FAITH_OPTIONS
  };
  
  return <FaithContext.Provider value={value}>{children}</FaithContext.Provider>;
};
