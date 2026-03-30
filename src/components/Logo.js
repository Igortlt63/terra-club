import React from 'react';

export default function Logo({ size = 48, showText = true, className = '' }) {
  const r   = size * 0.42;
  const ry  = size * 0.46;
  const cx  = size * 0.5;
  const cy  = size * 0.5;
  const totalH = showText ? size * 1.55 : size;
  const id  = `lg${size}`;

  return (
    <svg
      width={size} height={totalH}
      viewBox={`0 0 ${size} ${totalH}`}
      fill="none" xmlns="http://www.w3.org/2000/svg"
      className={className} style={{ flexShrink:0 }}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#40D9F0"/>
          <stop offset="45%"  stopColor="#1AABCC"/>
          <stop offset="100%" stopColor="#0B7BAA"/>
        </linearGradient>
        <filter id={`g${size}`}>
          <feGaussianBlur stdDeviation={Math.max(0.8, size*0.025)} result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Свечение */}
      <ellipse cx={cx} cy={cy} rx={r+size*0.07} ry={ry+size*0.07}
        fill="none" stroke="#40D9F0" strokeWidth={size*0.10} opacity="0.10"/>
      {/* Кольцо */}
      <ellipse cx={cx} cy={cy} rx={r} ry={ry}
        fill="none" stroke={`url(#${id})`}
        strokeWidth={size*0.058} strokeLinecap="round"
        filter={`url(#g${size})`}/>
      {/* Текст */}
      {showText && (
        <text x={cx} y={size*1.33}
          fontFamily="-apple-system,'SF Pro Display','Inter',sans-serif"
          fontSize={size*0.22} fontWeight="700"
          letterSpacing={size*0.038}
          textAnchor="middle" fill="white">TERRA</text>
      )}
    </svg>
  );
}
