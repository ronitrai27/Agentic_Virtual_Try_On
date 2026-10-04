"use client";

import React from 'react';
import { useLtxEngine } from '../../hooks/useLtxEngine';
import { MediaLayer } from './MediaLayer';
import { HeroCopy } from './HeroCopy';
import { Controller } from './Controller';
import { Header } from './Header';
import { LiveRegion } from './LiveRegion';

export const Stage: React.FC = () => {
  const {
    activeScene,
    playbackState,
    visibleVideoId,
    activeControl,
    isLocked,
    collapsed,
    hoveredIndex,
    focusedIndex,
    titleHidden,
    selectedLabelOffset,
    errorMessage,
    announcement,
    videoRefs,
    controllerRef,
    capsuleRef,
    cellRefs,
    handleControlClick,
    handleResetClick,
    handleRetry,
    setHoveredIndex,
    setFocusedIndex,
    handlePointerMove,
  } = useLtxEngine();

  return (
    <main className={`stage ${titleHidden ? 'title-hidden' : ''}`}>
      {/* 1. 8 Persistent <video> elements */}
      <MediaLayer visibleVideoId={visibleVideoId} videoRefs={videoRefs} />

      {/* 2. Hero Copy (h1 + p) */}
      <HeroCopy titleHidden={titleHidden} />

      {/* 3. Controller (.track, .capsule, .cells) */}
      <Controller
        activeScene={activeScene}
        playbackState={playbackState}
        activeControl={activeControl}
        isLocked={isLocked}
        collapsed={collapsed}
        hoveredIndex={hoveredIndex}
        focusedIndex={focusedIndex}
        selectedLabelOffset={selectedLabelOffset}
        controllerRef={controllerRef}
        capsuleRef={capsuleRef}
        cellRefs={cellRefs}
        onControlClick={handleControlClick}
        onResetClick={handleResetClick}
        setHoveredIndex={setHoveredIndex}
        setFocusedIndex={setFocusedIndex}
        onPointerMove={handlePointerMove}
      />

      {/* 4. Header */}
      <Header />

      {/* 5. Live status & notice */}
      <LiveRegion
        announcement={announcement}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />
    </main>
  );
};
