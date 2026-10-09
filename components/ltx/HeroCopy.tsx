"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn, useSession } from '@/lib/auth-client';
import { ArrowRight, Loader2 } from 'lucide-react';

interface HeroCopyProps {
  titleHidden: boolean;
}

export const HeroCopy: React.FC<HeroCopyProps> = ({ titleHidden }) => {
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/callback",
      });
    } catch (err) {
      console.error("Sign in failed:", err);
      setLoading(false);
    }
  };

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

      <div className="hero-cta">
        {isPending ? (
          <button className="hero-register-btn opacity-80 cursor-wait" disabled>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </button>
        ) : session?.user ? (
          <Link href="/callback" className="hero-register-btn" aria-label="Go to Studio">
            <span>Continue to Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="hero-register-btn"
            aria-label="Register now"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <>
                <span>Register Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

