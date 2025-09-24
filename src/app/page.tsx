'use client';

import { Wheel } from '../components/Wheel';
import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import choicesData from '../data/choices.json';

export default function Home() {
  const [choices, setChoices] = useLocalStorage<string[]>('wheeldecide-choices', choicesData);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [inputChoices, setInputChoices] = useState<string[]>(choicesData);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setInputChoices(choices);
  }, [choices]);

  const handleChoiceSelected = (choice: string) => {
    setSelectedChoice(choice);
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputChoices];
    newInputs[index] = value;
    setInputChoices(newInputs);
  };

  const handleAddInput = () => {
    if (inputChoices.length < 100) {
      setInputChoices([...inputChoices, '']);
    }
  };

  const handleRemoveInput = (index: number) => {
    if (inputChoices.length > 2) {
      const newInputs = inputChoices.filter((_, i) => i !== index);
      setInputChoices(newInputs);
    }
  };

  // Apply builder changes to current wheel choices
  const handleSaveChoices = () => {
    const validChoices = inputChoices.map(c => c.trim()).filter(c => c !== '');
    if (validChoices.length > 0) {
      setChoices(validChoices);
    }
  };

  const handlePasteList = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      const newChoices = [...inputChoices, ...lines].slice(0, 100);
      setInputChoices(newChoices);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="container mx-auto px-4 py-8">
        {/* Wheel Section */}
        <div className="flex justify-center mb-8">
          <Wheel 
            choices={choices} 
            onChoiceSelected={handleChoiceSelected}
          />
        </div>


        {/* Divider */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Wheel Builder Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center justify-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Wheel Builder
          </h2>


          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <label className="text-gray-400 text-sm">
                Choices (enter up to 100 choices):
              </label>
              <button 
                onClick={handlePasteList}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Paste List
              </button>
            </div>

            <div className="space-y-2">
              {inputChoices.map((choice, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400"
                    placeholder={`Choice ${index + 1}`}
                  />
                  <button 
                    onClick={() => handleRemoveInput(index)}
                    disabled={inputChoices.length <= 2}
                    className="w-8 h-8 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {/* Add new input button */}
              {inputChoices.length < 100 && (
                <button
                  onClick={handleAddInput}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded border border-gray-600 transition-colors"
                >
                  + Add Choice
                </button>
              )}
            </div>

            {/* Save Choices Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleSaveChoices}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded font-semibold transition-colors"
              >
                Save Choices
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
