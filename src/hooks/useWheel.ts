import { useCallback } from 'react';

interface SpinResult {
  rotation: number;
  selectedIndex: number;
}

export const useWheel = (choices: string[]) => {
  const getRandomChoice = useCallback((): string => {
    if (choices.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  }, [choices]);

  const spinWheel = useCallback((selectedChoice: string): SpinResult => {
    const selectedIndex = choices.indexOf(selectedChoice);
    if (selectedIndex === -1) {
      // Fallback to random selection
      const randomIndex = Math.floor(Math.random() * choices.length);
      return {
        rotation: 1080 + (360 - (randomIndex * (360 / choices.length))), // 3 full turns + alignment
        selectedIndex: randomIndex
      };
    }

    // Calculate rotation: 3-6 full turns + alignment to selected slice
    const baseRotation = 1080 + Math.random() * 1080; // 3-6 full turns
    const sliceAngle = 360 / choices.length;
    const targetAngle = selectedIndex * sliceAngle;
    const finalRotation = baseRotation + (360 - targetAngle);

    return {
      rotation: finalRotation,
      selectedIndex
    };
  }, [choices]);

  return {
    getRandomChoice,
    spinWheel
  };
};
