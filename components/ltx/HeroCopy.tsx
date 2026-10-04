"use client";

import React from 'react';

interface HeroCopyProps {
  titleHidden: boolean;
}

export const HeroCopy: React.FC<HeroCopyProps> = ({ titleHidden }) => {
  return (
    <div className={`hero ${titleHidden ? 'title-hidden' : ''}`}>
      <h1 className="hero-title" aria-label="Your FASHION Copilot">
        <span>Your</span>
        <span>FASHION</span>
        <span>Copilot</span>
      </h1>

      <p className="hero-desc">
        VTOL FIT builds open world models that give you full control, from production-grade video
        to systems that understand and operate in the physical world.
      </p>
    </div>
  );
};
