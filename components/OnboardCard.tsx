"use client";

import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface OnboardCardProps {
  duration?: number;
  step1?: string;
  step2?: string;
  step3?: string;
  className?: string;
}

const OnboardCard = ({
  duration = 6600,
  step1 = "Google Account Verified",
  step2 = "Preparing Workspace",
  step3 = "Launching Studio",
  className,
}: OnboardCardProps) => {
  const steps = [step1, step2, step3];
  const stepDuration = Math.max(2000, Math.floor(duration / steps.length));
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => prev + 1);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [stepDuration]);

  const visibleIndices = [stepIndex - 1, stepIndex, stepIndex + 1];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-full max-w-[280px] h-[190px] overflow-hidden select-none",
        className
      )}
    >
      <AnimatePresence initial={false}>
        {visibleIndices.map((vIndex) => {
          const stepText = steps[((vIndex % steps.length) + steps.length) % steps.length];
          const position = vIndex - stepIndex; // -1 = top (completed), 0 = center (active), 1 = bottom (upcoming)
          const isCompleted = position < 0;
          const isActive = position === 0;

          return (
            <motion.div
              key={vIndex}
              initial={{
                y: position > 0 ? 116 : -116,
                scale: 0.85,
                opacity: 0,
              }}
              animate={{
                y: position * 58,
                scale: isActive ? 1 : 0.92,
                opacity: Math.abs(position) > 1 ? 0 : isActive ? 1 : 0.7,
                zIndex: isActive ? 10 : 4,
              }}
              exit={{
                y: -116,
                scale: 0.85,
                opacity: 0,
                zIndex: 1,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 24,
                mass: 0.8,
              }}
              className={cn(
                "absolute flex w-full flex-col justify-center gap-2 rounded-xl border py-2.5 px-3.5 transition-colors duration-300",
                isActive
                  ? "border-neutral-200 bg-white shadow-md"
                  : "border-neutral-200/80 bg-neutral-50 shadow-sm"
              )}
            >
              <div className="flex items-center justify-start gap-2 text-xs font-medium">
                {isCompleted ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="text-neutral-700 font-medium">{stepText}</span>
                  </>
                ) : isActive ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-green-600 animate-spin shrink-0" />
                    <span className="text-neutral-900 font-semibold">{stepText}</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500 font-medium">{stepText}</span>
                  </>
                )}
              </div>

              <div className="ml-5.5 h-1.5 w-[calc(100%-24px)] overflow-hidden rounded-full bg-neutral-100 border border-neutral-200/60">
                {isCompleted ? (
                  <div className="h-full w-full bg-green-500 rounded-full" />
                ) : isActive ? (
                  <motion.div
                    key={`progress-${vIndex}`}
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      delay: 0.25,
                      duration: (stepDuration - 450) / 1000,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  />
                ) : (
                  <div className="h-full w-0 bg-neutral-200 rounded-full" />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Subtle top/bottom fade mask */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-20" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-20" />
    </div>
  );
};

export default OnboardCard;

