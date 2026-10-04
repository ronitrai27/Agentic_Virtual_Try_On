"use client";

import React from 'react';
import { VIDEO_CLIPS } from '../../lib/ltx/constants';

interface MediaLayerProps {
  visibleVideoId: string;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
}

export const MediaLayer: React.FC<MediaLayerProps> = ({ visibleVideoId, videoRefs }) => {
  return (
    <div className="media-container" aria-hidden="true">
      {VIDEO_CLIPS.map((clip) => {
        const isVisible = visibleVideoId === clip.id;
        return (
          <video
            key={clip.id}
            ref={(el) => {
              videoRefs.current[clip.id] = el;
            }}
            src={clip.url}
            className={`media ${isVisible ? 'visible' : ''}`}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
          />
        );
      })}
    </div>
  );
};
