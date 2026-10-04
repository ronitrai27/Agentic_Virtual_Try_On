"use client";

import React, { useMemo } from 'react';
import { ControlKey, PlaybackState, SceneId } from '../../lib/ltx/types';
import { CAPSULE_POSITIONS, CONTROL_COLUMNS } from '../../lib/ltx/constants';

interface ControllerProps {
  activeScene: SceneId;
  playbackState: PlaybackState;
  activeControl: ControlKey | null;
  isLocked: boolean;
  collapsed: boolean;
  hoveredIndex: number | null;
  focusedIndex: number | null;
  selectedLabelOffset: { x: number; y: number } | null;
  controllerRef: React.RefObject<HTMLDivElement | null>;
  capsuleRef: React.RefObject<HTMLDivElement | null>;
  cellRefs: React.MutableRefObject<Record<number, HTMLElement | null>>;
  onControlClick: (control: ControlKey, element?: HTMLElement) => void;
  onResetClick: () => void;
  setHoveredIndex: (idx: number | null) => void;
  setFocusedIndex: (idx: number | null) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const Controller: React.FC<ControllerProps> = ({
  activeScene,
  playbackState,
  activeControl,
  isLocked,
  collapsed,
  hoveredIndex,
  focusedIndex,
  selectedLabelOffset,
  controllerRef,
  capsuleRef,
  cellRefs,
  onControlClick,
  onResetClick,
  setHoveredIndex,
  setFocusedIndex,
  onPointerMove,
}) => {
  // Determine highlighted index for the sliding capsule (0 is base label)
  const activeHighlightIndex = useMemo(() => {
    if (hoveredIndex !== null) return hoveredIndex;
    if (focusedIndex !== null) return focusedIndex;
    return 0;
  }, [hoveredIndex, focusedIndex]);

  const hasHighlight = activeHighlightIndex > 0;

  // Compute CSS custom properties for capsule positioning
  const capsuleStyle = useMemo(() => {
    const pos = CAPSULE_POSITIONS[activeHighlightIndex] || CAPSULE_POSITIONS[0];
    return {
      '--cap-left': pos.left,
      '--cap-width': pos.width,
    } as React.CSSProperties;
  }, [activeHighlightIndex]);

  return (
    <div
      ref={controllerRef}
      role="group"
      aria-label="Scene state controller"
      className={`controller ${collapsed ? 'collapsed' : ''} ${hasHighlight ? 'has-highlight' : ''}`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setHoveredIndex(null)}
    >
      {/* Rear glass track */}
      <div className="track glass" aria-hidden="true" />

      {/* Foreground sliding glass capsule */}
      <div
        ref={capsuleRef}
        className="capsule glass"
        style={capsuleStyle}
        aria-hidden="true"
      />

      {/* Grid columns */}
      <div className="cells">
        {CONTROL_COLUMNS.map((col) => {
          const isSelectedBranch = activeControl === col.key;
          const isChosenCell = collapsed && isSelectedBranch;
          const isResetMode = isChosenCell && (playbackState === 'selected' || playbackState === 'starting');

          // Non-interactive label cell (Index 0)
          if (!col.isAction) {
            return (
              <div
                key="label"
                ref={(el) => {
                  cellRefs.current[col.index] = el;
                }}
                className={`cell label-cell cell-index-${col.index}`}
                aria-hidden="true"
              >
                {col.label}
              </div>
            );
          }

          // Active transform when traveling to capsule center
          const labelStyle: React.CSSProperties = {};
          if (isChosenCell && selectedLabelOffset) {
            labelStyle.transform = `translate(${selectedLabelOffset.x}px, ${selectedLabelOffset.y}px)`;
          }

          // In selected mode, button becomes Reset
          if (isResetMode) {
            const isActionable = playbackState === 'selected' && !isLocked;
            return (
              <button
                key={col.key}
                ref={(el) => {
                  cellRefs.current[col.index] = el;
                }}
                type="button"
                className={`cell chosen-cell reset-mode reset-button cell-index-${col.index}`}
                style={labelStyle}
                disabled={!isActionable}
                onClick={onResetClick}
                aria-label={`Reset ${col.label} back to base scene`}
              >
                Reset
              </button>
            );
          }

          // Regular option button
          const isOptionDisabled = isLocked || activeScene !== 'base' || collapsed;
          const ariaHidden = collapsed ? 'true' : undefined;
          const tabIndex = isOptionDisabled ? -1 : 0;

          return (
            <button
              key={col.key}
              ref={(el) => {
                cellRefs.current[col.index] = el;
              }}
              type="button"
              className={`cell cell-index-${col.index} ${isChosenCell ? 'chosen-cell' : ''}`}
              style={labelStyle}
              disabled={isOptionDisabled}
              aria-hidden={ariaHidden}
              tabIndex={tabIndex}
              onMouseEnter={() => setHoveredIndex(col.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setFocusedIndex(col.index)}
              onBlur={() => setFocusedIndex(null)}
              onClick={(e) => col.key && onControlClick(col.key, e.currentTarget)}
              aria-label={`Switch to ${col.label} state`}
            >
              {col.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
