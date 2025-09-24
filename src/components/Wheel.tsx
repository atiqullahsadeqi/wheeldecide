'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';

interface WheelProps {
  choices: string[];
  onChoiceSelected?: (choice: string) => void;
}

export const Wheel: React.FC<WheelProps> = ({ choices, onChoiceSelected }) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const startTsRef = useRef<number | null>(null);
  const lastSpecialGroupRef = useRef<'atiq' | 'azim' | null>(null);

  const SPIN_DURATION_MS = 3000;
  const MAX_RATE = 1.5; // fast at start
  const MIN_RATE = 0.4; // slow near the end

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const startPlaybackRateAnimation = () => {
    startTsRef.current = performance.now();
    const tick = (ts: number) => {
      if (!startTsRef.current || !audioRef.current) return;
      const elapsed = ts - startTsRef.current;
      const t = Math.min(1, Math.max(0, elapsed / SPIN_DURATION_MS));
      const eased = easeOutCubic(t);
      const rate = MAX_RATE - (MAX_RATE - MIN_RATE) * eased; // decreases over time
      audioRef.current.playbackRate = rate;
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      }
    };
    rafIdRef.current = requestAnimationFrame(tick);
  };

  const stopPlaybackRateAnimation = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    startTsRef.current = null;
    if (audioRef.current) audioRef.current.playbackRate = 1;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/WheelDecideFX1_Soft_Short.ogg');
    audio.preload = 'auto';
    audio.loop = true;
    audio.volume = 0.6;
    audioRef.current = audio;
    return () => {
      try {
        audio.pause();
      } catch {}
      audioRef.current = null;
    };
  }, []);

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSelectedChoice(''); // Clear previous result during spin
    
    // Play looping spin sound
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
      }
    } catch {}
    startPlaybackRateAnimation();
    
    // Determine target index with special-case handling for "atiq" and "azim"
    const lower = choices.map(c => c.toLowerCase());
    const atiqIndices: number[] = [];
    const azimIndices: number[] = [];
    lower.forEach((c, i) => {
      if (c.includes('atiq')) atiqIndices.push(i);
      if (c.includes('azim')) azimIndices.push(i);
    });

    const pickRandom = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)];
    let targetIndex: number;
    if (atiqIndices.length > 0 || azimIndices.length > 0) {
      if (atiqIndices.length > 0 && azimIndices.length > 0) {
        // Alternate between groups; first time is random
        let group: 'atiq' | 'azim';
        if (lastSpecialGroupRef.current === 'atiq') group = 'azim';
        else if (lastSpecialGroupRef.current === 'azim') group = 'atiq';
        else group = Math.random() < 0.5 ? 'atiq' : 'azim';
        const pool = group === 'atiq' ? atiqIndices : azimIndices;
        targetIndex = pickRandom(pool);
        lastSpecialGroupRef.current = group;
      } else if (atiqIndices.length > 0) {
        targetIndex = pickRandom(atiqIndices);
        lastSpecialGroupRef.current = 'atiq';
      } else {
        targetIndex = pickRandom(azimIndices);
        lastSpecialGroupRef.current = 'azim';
      }
    } else {
      targetIndex = Math.floor(Math.random() * Math.max(1, choices.length));
      lastSpecialGroupRef.current = null;
    }

    // Compute rotation delta so the wheel lands centered on targetIndex
    const sliceAngleLocal = 360 / Math.max(1, choices.length);
    const prevNorm = ((rotation % 360) + 360) % 360;
    const desiredNorm = ((360 - (targetIndex + 0.5) * sliceAngleLocal) % 360 + 360) % 360;
    const baseTurns = 3 + Math.floor(Math.random() * 4); // 3..6 full turns
    const alignDelta = (desiredNorm - prevNorm + 360) % 360;
    const finalRotation = baseTurns * 360 + alignDelta;

    setRotation(prev => prev + finalRotation);
    
    // Stop spinning after animation and determine result
    setTimeout(() => {
      setIsSpinning(false);
      // Stop sound
      try {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
      } catch {}
      stopPlaybackRateAnimation();
      
      // Set the predetermined result
      const result = choices[targetIndex];
      
      setSelectedChoice(result);
      onChoiceSelected?.(result);
    }, 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSpin();
    }
  };
  

  const sliceAngle = 360 / choices.length;
  const baseColors = ['#ffffff', '#1d4ed8', '#ffff00']; // White, Blue, Yellow
  const textRadius = 85; // fixed inner radius for labels
  const angleRad = (sliceAngle * Math.PI) / 180;
  const maxTextWidth = Math.max(0, 2 * textRadius * Math.sin(angleRad / 2) - 12); // chord length minus padding

  const getMeasureContext = () => {
    if (!canvasRef.current && typeof document !== 'undefined') {
      canvasRef.current = document.createElement('canvas');
    }
    return canvasRef.current?.getContext('2d') || null;
  };

  const measureTextWidth = (text: string, fontSize: number) => {
    const ctx = getMeasureContext();
    if (!ctx) return Infinity;
    ctx.font = `500 ${fontSize}px Arial`;
    return ctx.measureText(text).width;
  };
  
  const computeFontSize = (text: string) => {
    const base = 14;
    const min = 8;
    const max = 16;
    const baseWidth = measureTextWidth(text, base);
    if (!isFinite(baseWidth) || baseWidth === 0) return base;
    let proposed = Math.floor(base * (maxTextWidth / baseWidth));
    proposed = Math.max(min, Math.min(max, proposed));
    while (measureTextWidth(text, proposed) > maxTextWidth && proposed > min) {
      proposed -= 1;
    }
    return proposed;
  };

  const uniformFontSize = useMemo(() => {
    const sizes = choices.map((c) => computeFontSize(c));
    if (sizes.length === 0) return 14;
    return Math.min(...sizes);
  }, [choices, maxTextWidth]);
  
  // Assign colors randomly while preventing adjacent duplicates (including wrap-around)
  const assignedColors = useMemo(() => {
    const n = choices.length;
    if (n === 0) return [] as string[];
    const colors: string[] = [];
    for (let i = 0; i < n; i++) {
      const prev = i > 0 ? colors[i - 1] : null;
      const pool = baseColors.filter((c) => c !== prev);
      const choice = pool[Math.floor(Math.random() * pool.length)] || pool[0];
      colors.push(choice);
    }
    // Fix wrap-around if first and last end up equal
    if (n > 1 && colors[0] === colors[n - 1]) {
      const alt = baseColors.filter((c) => c !== colors[n - 2] && c !== colors[0]);
      if (alt.length > 0) {
        colors[n - 1] = alt[Math.floor(Math.random() * alt.length)] || alt[0];
      }
    }
    return colors;
  }, [choices]);
  

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Title */}
      <h1 className="text-4xl font-bold text-white text-center mb-4">
        WHAT TO DO UNDER QUARANTINE?
      </h1>
      
      {/* Wheel Container */}
      <div className="relative">

        {/* Wheel */}
        <div className="relative w-full max-w-[16rem] sm:max-w-[22rem] md:max-w-[28rem] aspect-square cursor-pointer" role="button" aria-label="Spin the wheel" onClick={handleSpin}>
          {/* Indicator arrow (pointing inward, black, aligned to edge) */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-black rotate-180"></div>
          </div>
          
          <div
            ref={wheelRef}
            className="relative w-full h-full rounded-full overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
            }}
            role="img"
            aria-label={`Wheel with ${choices.length} choices, currently showing: ${selectedChoice || 'Ready to spin'}`}
          >
            <svg className="w-full h-full" viewBox="0 0 280 280">
              {choices.map((choice, index) => {
                const fillColor = assignedColors[index] ?? baseColors[index % 3];
                const textColor = fillColor === '#1d4ed8' ? '#ffffff' : '#000000';
                const startAngle = index * sliceAngle;
                const endAngle = (index + 1) * sliceAngle;
                const midAngle = startAngle + sliceAngle / 2;
                
                // Convert angles to radians
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                const midRad = (midAngle - 90) * Math.PI / 180;
                
                // Calculate points for the slice
                const centerX = 140;
                const centerY = 140;
                const radius = 138;
                
                const x1 = centerX + radius * Math.cos(startRad);
                const y1 = centerY + radius * Math.sin(startRad);
                const x2 = centerX + radius * Math.cos(endRad);
                const y2 = centerY + radius * Math.sin(endRad);
                
                // Text position
                const textX = centerX + textRadius * Math.cos(midRad);
                const textY = centerY + textRadius * Math.sin(midRad);
                
                // Rotate labels tangentially (aligned with circle), then flip to keep upright
                let textRotation = midAngle + 90; // tangent alignment
                textRotation = ((textRotation % 360) + 360) % 360; // normalize
                if (textRotation > 90 && textRotation < 270) {
                  textRotation = (textRotation + 180) % 360;
                }
                
                return (
                  <g key={index}>
                    <path
                      d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                      fill={fillColor}
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={textColor}
                      fontSize={uniformFontSize}
                      fontWeight="500"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      className="select-none"
                    >
                      {choice}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Center circle (no result text here) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-15 h-15 bg-black border-2 border-yellow-400 rounded-full flex items-center justify-center">
              <div className="text-white text-sm font-bold text-center leading-tight px-2">
                
              </div>
            </div>
          </div>

          {/* Result overlay on top of the wheel with vertical gradients */}
          {selectedChoice && !isSpinning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black to-transparent" />
              <div className="relative w-full px-5 py-3 text-white text-lg sm:text-xl font-bold text-center">
                {selectedChoice}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Spin Button */}
      <button
        onClick={handleSpin}
        onKeyDown={handleKeyDown}
        disabled={isSpinning}
        className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
        aria-label={isSpinning ? 'Wheel is spinning, please wait' : 'Spin the wheel to select a random choice'}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN'}
      </button>

    </div>
  );
};
