"use client";

import React from "react";
import Link from "next/link";

export const Header: React.FC = () => {
  return (
    <header className="stage-header" role="banner">
      <div className="header-left">
        <Link aria-label="VTOL FIT home" href="/" className="logo-link">
          <div className="vtol-brand">
            <span className="vtol-logo-icon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <span className="vtol-logo-text">VTOL FIT</span>
          </div>
        </Link>

        <nav className="meta" aria-label="Main Navigation">
          <a href="#use-cases" className="nav-link">
            Use Cases
          </a>
          <a href="#about" className="nav-link">
            About Us
          </a>
        </nav>
      </div>

      <div>
        <Link
          href="/studio"
          className="try-now-btn"
          aria-label="Try VTOL FIT now"
        >
          Try it now
        </Link>
      </div>
    </header>
  );
};
