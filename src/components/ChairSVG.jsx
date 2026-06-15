import React from 'react';

const ChairSVG = ({ fabricId, legId, animateStyle = {} }) => {
  let cushionColor = '#BAC2B9'; // Linen default (FAB-02)
  if (fabricId === 'FAB-01') cushionColor = '#8C99A4'; // Velvet
  if (fabricId === 'FAB-03') cushionColor = '#DFDCD6'; // Silk
  if (fabricId === 'FAB-04') cushionColor = '#5C534C'; // Leather

  let legsColor = '#1C1B18'; // Black default
  if (legId === 'bronze') legsColor = '#A88F80';
  if (legId === 'white-oak') legsColor = '#D2C9B1';

  return (
    <svg 
      viewBox="0 0 200 200" 
      width="100%" 
      height="220" 
      style={{ 
        stroke: '#5C534C', 
        strokeWidth: '1.2', 
        fill: 'none', 
        strokeLinecap: 'round', 
        strokeLinejoin: 'round', 
        ...animateStyle 
      }}
    >
      {/* Chair Backrest */}
      <path d="M 60,60 L 140,60 Q 148,60 148,68 L 148,110 L 52,110 L 52,68 Q 52,60 60,60 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />
      
      {/* Chair Cushion */}
      <rect x="46" y="110" width="108" height="24" rx="4" style={{ fill: cushionColor, strokeWidth: '1.4', transition: 'fill 0.5s' }} />
      
      {/* Chair Arms */}
      <path d="M 46,104 L 38,104 C 34,104 34,124 34,124 L 46,124 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />
      <path d="M 154,104 L 162,104 C 166,104 166,124 166,124 L 154,124 Z" style={{ fill: cushionColor, transition: 'fill 0.5s' }} />

      {/* Chair Legs */}
      <line x1="56" y1="134" x2="42" y2="176" style={{ stroke: legsColor, strokeWidth: '2.5', transition: 'stroke 0.5s' }} />
      <line x1="144" y1="134" x2="158" y2="176" style={{ stroke: legsColor, strokeWidth: '2.5', transition: 'stroke 0.5s' }} />
      <line x1="68" y1="134" x2="72" y2="170" style={{ stroke: legsColor, strokeWidth: '1.8', opacity: 0.7, transition: 'stroke 0.5s' }} />
      <line x1="132" y1="134" x2="128" y2="170" style={{ stroke: legsColor, strokeWidth: '1.8', opacity: 0.7, transition: 'stroke 0.5s' }} />

      {/* Structural crossbar */}
      <line x1="42" y1="165" x2="158" y2="165" style={{ stroke: legsColor, strokeWidth: '1.2', transition: 'stroke 0.5s' }} />
    </svg>
  );
};

export default ChairSVG;
