"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { ControlKey, Direction, PlaybackState, SceneId, VideoClipConfig } from '../lib/ltx/types';
import { BASE_VIDEO_ID, CONTROL_COLUMNS, CONTROL_INDEX_MAP, VIDEO_CLIPS } from '../lib/ltx/constants';

interface UseLtxEngineReturn {
  activeScene: SceneId;
  playbackState: PlaybackState;
  visibleVideoId: string;
  activeControl: ControlKey | null;
  direction: Direction | null;
  isLocked: boolean;
  readyVideos: Record<string, boolean>;
  allReady: boolean;
  errorMessage: string | null;
  focusedIndex: number | null;
  hoveredIndex: number | null;
  titleHidden: boolean;
  collapsed: boolean;
  selectedLabelOffset: { x: number; y: number } | null;
  videoRefs: React.MutableRefObject<Record<string, HTMLVideoElement | null>>;
  controllerRef: React.RefObject<HTMLDivElement | null>;
  cellRefs: React.MutableRefObject<Record<number, HTMLElement | null>>;
  capsuleRef: React.RefObject<HTMLDivElement | null>;
  handleControlClick: (control: ControlKey, element?: HTMLElement) => void;
  handleResetClick: () => void;
  handleRetry: () => void;
  setHoveredIndex: (idx: number | null) => void;
  setFocusedIndex: (idx: number | null) => void;
  handlePointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  announcement: string;
}

export function useLtxEngine(): UseLtxEngineReturn {
  const [activeScene, setActiveScene] = useState<SceneId>('base');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('loading');
  const [visibleVideoId, setVisibleVideoId] = useState<string>(BASE_VIDEO_ID);
  const [activeControl, setActiveControl] = useState<ControlKey | null>(null);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [readyVideos, setReadyVideos] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [titleHidden, setTitleHidden] = useState<boolean>(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [selectedLabelOffset, setSelectedLabelOffset] = useState<{ x: number; y: number } | null>(null);
  const [announcement, setAnnouncement] = useState<string>('Loading interactive scene...');

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const controllerRef = useRef<HTMLDivElement | null>(null);
  const capsuleRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Record<number, HTMLElement | null>>({});

  const transitionTokenRef = useRef<number>(0);
  const isLockedRef = useRef<boolean>(false);
  const activeRafRef = useRef<number | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deadlineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const hadFocusBeforeTransitionRef = useRef<boolean>(false);

  // Helper to get video config
  const getVideoConfig = useCallback((id: string): VideoClipConfig | undefined => {
    return VIDEO_CLIPS.find((c) => c.id === id);
  }, []);

  // Compute readiness
  const allReady = VIDEO_CLIPS.every((clip) => !!readyVideos[clip.id]);

  // Clean up timers & RAF
  const cleanupTransition = useCallback(() => {
    if (activeRafRef.current) {
      cancelAnimationFrame(activeRafRef.current);
      activeRafRef.current = null;
    }
    if (titleTimerRef.current) {
      clearTimeout(titleTimerRef.current);
      titleTimerRef.current = null;
    }
    if (deadlineTimeoutRef.current) {
      clearTimeout(deadlineTimeoutRef.current);
      deadlineTimeoutRef.current = null;
    }
  }, []);

  // Check initial media readiness on mount
  useEffect(() => {
    const handleLoaded = (id: string) => {
      setReadyVideos((prev) => {
        if (prev[id]) return prev;
        const next = { ...prev, [id]: true };
        return next;
      });
    };

    VIDEO_CLIPS.forEach((clip) => {
      const vid = videoRefs.current[clip.id];
      if (vid) {
        if (vid.readyState >= 2) {
          handleLoaded(clip.id);
        } else {
          const onCanPlay = () => handleLoaded(clip.id);
          const onLoadedData = () => handleLoaded(clip.id);
          vid.addEventListener('canplay', onCanPlay, { once: true });
          vid.addEventListener('loadeddata', onLoadedData, { once: true });
        }
      }
    });
  }, []);

  // When base video is ready, park at 0
  useEffect(() => {
    const baseVid = videoRefs.current[BASE_VIDEO_ID];
    if (baseVid && readyVideos[BASE_VIDEO_ID] && playbackState === 'loading') {
      baseVid.currentTime = 0;
      baseVid.pause();
      setVisibleVideoId(BASE_VIDEO_ID);
      setPlaybackState('ready');
      setAnnouncement('Scene ready. Use controls to explore.');
    }
  }, [readyVideos, playbackState]);

  // Pointer move updates --glass-x and --glass-y without re-rendering
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const controller = controllerRef.current;
    if (!controller) return;
    const rect = controller.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    controller.style.setProperty('--glass-x', `${x.toFixed(1)}%`);
    controller.style.setProperty('--glass-y', `${y.toFixed(1)}%`);
  }, []);

  // Seamless Frame Decoder Helper with Document Visibility Pausing
  const waitForDecodedFrame = useCallback(
    (videoEl: HTMLVideoElement, token: number): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        let rvfcId: number | null = null;
        let settled = false;
        let remainingMs = 12000;
        let startTimestamp = performance.now();

        const cleanup = () => {
          settled = true;
          if (rvfcId !== null && 'cancelVideoFrameCallback' in videoEl) {
            (videoEl as unknown as { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(rvfcId);
          }
          document.removeEventListener('visibilitychange', onVisibilityChange);
          if (deadlineTimeoutRef.current) {
            clearTimeout(deadlineTimeoutRef.current);
            deadlineTimeoutRef.current = null;
          }
        };

        const onVisibilityChange = () => {
          if (document.hidden) {
            // Tab blurred/hidden -> pause timer & pause video
            const elapsed = performance.now() - startTimestamp;
            remainingMs = Math.max(1000, remainingMs - elapsed);
            if (deadlineTimeoutRef.current) {
              clearTimeout(deadlineTimeoutRef.current);
              deadlineTimeoutRef.current = null;
            }
            videoEl.pause();
            videoEl.currentTime = 0;
          } else {
            // Tab visible -> restart timer & resume play
            startTimestamp = performance.now();
            deadlineTimeoutRef.current = setTimeout(() => {
              if (!settled && transitionTokenRef.current === token) {
                cleanup();
                reject(new Error('First-frame decode timeout'));
              }
            }, remainingMs);
            videoEl.play().catch((err) => {
              if (!settled && transitionTokenRef.current === token) {
                cleanup();
                reject(err);
              }
            });
          }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        deadlineTimeoutRef.current = setTimeout(() => {
          if (!settled && transitionTokenRef.current === token) {
            cleanup();
            reject(new Error('First-frame decode timeout'));
          }
        }, remainingMs);

        // Check if requestVideoFrameCallback is supported
        const targetAny = videoEl as unknown as {
          requestVideoFrameCallback?: (cb: (now: number, metadata: { mediaTime: number }) => void) => number;
        };

        if (typeof targetAny.requestVideoFrameCallback === 'function') {
          const checkFrame = (_now: number, metadata: { mediaTime: number }) => {
            if (settled || transitionTokenRef.current !== token) return;
            // Require mediaTime <= 0.5 && readyState >= 2 to reject stale endpoint frames
            if (metadata.mediaTime <= 0.5 && videoEl.readyState >= 2) {
              cleanup();
              resolve();
            } else {
              if (targetAny.requestVideoFrameCallback) {
                rvfcId = targetAny.requestVideoFrameCallback(checkFrame);
              }
            }
          };
          rvfcId = targetAny.requestVideoFrameCallback(checkFrame);
        } else {
          // Fallback without rVFC: checked readiness + playing + double rAF tick
          const onPlaying = () => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                if (settled || transitionTokenRef.current !== token) return;
                if (videoEl.readyState >= 2 && !videoEl.paused) {
                  cleanup();
                  resolve();
                }
              });
            });
          };
          videoEl.addEventListener('playing', onPlaying, { once: true });
        }
      });
    },
    []
  );

  // Rewind helper
  const rewindVideo = useCallback((videoEl: HTMLVideoElement): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (videoEl.currentTime > 0.001) {
        const onSeeked = () => {
          videoEl.removeEventListener('seeked', onSeeked);
          resolve();
        };
        videoEl.addEventListener('seeked', onSeeked, { once: true });
        videoEl.currentTime = 0;
      } else {
        videoEl.currentTime = 0;
        resolve();
      }
    });
  }, []);

  // Playback monitor loop: runs on active video to catch terminal hold time accurately
  const monitorTerminalHold = useCallback(
    (
      videoEl: HTMLVideoElement,
      clipConfig: VideoClipConfig,
      token: number,
      onHoldReached: () => void
    ) => {
      let isCompleted = false;

      const finishHold = () => {
        if (isCompleted || transitionTokenRef.current !== token) return;
        isCompleted = true;
        videoEl.pause();
        if (activeRafRef.current) {
          cancelAnimationFrame(activeRafRef.current);
          activeRafRef.current = null;
        }
        videoEl.removeEventListener('ended', finishHold);
        onHoldReached();
      };

      videoEl.addEventListener('ended', finishHold, { once: true });

      const checkTick = () => {
        if (isCompleted || transitionTokenRef.current !== token) return;
        if (videoEl.currentTime >= clipConfig.targetHoldTime) {
          finishHold();
          return;
        }
        activeRafRef.current = requestAnimationFrame(checkTick);
      };

      activeRafRef.current = requestAnimationFrame(checkTick);
    },
    []
  );

  // Calculate dx, dy offset from cell to collapsed capsule center
  const calculateLabelOffset = useCallback((colIndex: number) => {
    const controller = controllerRef.current;
    const cellEl = cellRefs.current[colIndex];
    if (!controller || !cellEl) return null;

    const controllerRect = controller.getBoundingClientRect();
    const cellRect = cellEl.getBoundingClientRect();

    // The collapsed capsule is 200px wide, centered at controller width / 2
    const targetCenterX = controllerRect.left + controllerRect.width / 2;
    const targetCenterY = controllerRect.top + controllerRect.height / 2;

    const cellCenterX = cellRect.left + cellRect.width / 2;
    const cellCenterY = cellRect.top + cellRect.height / 2;

    const dx = targetCenterX - cellCenterX;
    const dy = targetCenterY - cellCenterY;

    return { x: dx, y: dy };
  }, []);

  // FORWARD TRANSITION (on control click)
  const handleControlClick = useCallback(
    async (control: ControlKey, originatingEl?: HTMLElement) => {
      // 1. SYNCHRONOUS LOCK: check & lock immediately before any await
      if (isLockedRef.current || activeScene !== 'base') return;

      isLockedRef.current = true;
      setIsLocked(true);
      setErrorMessage(null);

      // Capture if the button had focus before disabling
      const activeEl = document.activeElement as HTMLElement | null;
      hadFocusBeforeTransitionRef.current =
        (originatingEl && activeEl === originatingEl) ||
        (activeEl && controllerRef.current?.contains(activeEl)) ||
        false;
      lastFocusedElementRef.current = originatingEl || activeEl;

      const token = ++transitionTokenRef.current;
      cleanupTransition();

      const colIndex = CONTROL_INDEX_MAP[control];
      const offset = calculateLabelOffset(colIndex);
      setSelectedLabelOffset(offset);

      const targetId = `${control}-forward`;
      const clipConfig = getVideoConfig(targetId);
      const targetVideo = videoRefs.current[targetId];

      if (!clipConfig || !targetVideo) {
        isLockedRef.current = false;
        setIsLocked(false);
        setErrorMessage('Video clip not found');
        return;
      }

      // Update state for UI motion
      setActiveControl(control);
      setDirection('forward');
      setPlaybackState('starting');
      setCollapsed(true);
      setAnnouncement(`Transitioning to ${control} scene.`);

      // Title hide timer: min(duration * 0.12, 0.9) seconds
      const titleHideMs = Math.min(clipConfig.duration * 0.12, 0.9) * 1000;
      titleTimerRef.current = setTimeout(() => {
        if (transitionTokenRef.current === token) {
          setTitleHidden(true);
        }
      }, titleHideMs);

      try {
        // 2. Rewind hidden target video to 0
        await rewindVideo(targetVideo);
        if (transitionTokenRef.current !== token) return;

        // 3. Register first-frame callback BEFORE play()
        const framePromise = waitForDecodedFrame(targetVideo, token);

        // 4. Call play() and catch rejection in Promise.all
        const playPromise = targetVideo.play();

        await Promise.all([playPromise, framePromise]);
        if (transitionTokenRef.current !== token) return;

        // 5. Reveal target video atomically once first decoded frame is ready
        setVisibleVideoId(targetId);
        setPlaybackState('playing');

        // 6. Monitor active video until hold time
        monitorTerminalHold(targetVideo, clipConfig, token, () => {
          if (transitionTokenRef.current !== token) return;

          // 7. Commit state
          setActiveScene(control);
          setPlaybackState('selected');
          isLockedRef.current = false;
          setIsLocked(false);
          setAnnouncement(`${control} selected. Click Reset to return to base.`);

          // Focus restoration to Reset button
          if (hadFocusBeforeTransitionRef.current) {
            requestAnimationFrame(() => {
              const resetBtn = controllerRef.current?.querySelector<HTMLButtonElement>('.reset-button');
              if (resetBtn) {
                resetBtn.focus({ preventScroll: true });
              }
            });
          }
        });
      } catch (err: unknown) {
        if (transitionTokenRef.current !== token) return;
        console.error('Transition error:', err);
        isLockedRef.current = false;
        setIsLocked(false);
        setPlaybackState('error');
        setErrorMessage('Video playback could not be started. Please try again.');
        setAnnouncement('Playback error. Click Retry.');
      }
    },
    [
      activeScene,
      calculateLabelOffset,
      cleanupTransition,
      getVideoConfig,
      monitorTerminalHold,
      rewindVideo,
      waitForDecodedFrame,
    ]
  );

  // REVERSE TRANSITION (on Reset click)
  const handleResetClick = useCallback(async () => {
    // Synchronous lock
    if (isLockedRef.current || !activeControl || playbackState !== 'selected') return;

    isLockedRef.current = true;
    setIsLocked(true);
    setErrorMessage(null);

    const token = ++transitionTokenRef.current;
    cleanupTransition();

    const control = activeControl;
    const reverseId = `${control}-reverse`;
    const reverseClip = getVideoConfig(reverseId);
    const reverseVideo = videoRefs.current[reverseId];

    if (!reverseClip || !reverseVideo) {
      isLockedRef.current = false;
      setIsLocked(false);
      setErrorMessage('Reverse clip not found');
      return;
    }

    // Start reverse choreography: Expand bar and fade Reset in parallel
    setDirection('reverse');
    setPlaybackState('starting');
    setCollapsed(false);
    setSelectedLabelOffset(null);
    setAnnouncement(`Reversing back to base scene.`);

    try {
      // Rewind target reverse video to 0
      await rewindVideo(reverseVideo);
      if (transitionTokenRef.current !== token) return;

      // Register first frame callback BEFORE play()
      const framePromise = waitForDecodedFrame(reverseVideo, token);
      const playPromise = reverseVideo.play();

      await Promise.all([playPromise, framePromise]);
      if (transitionTokenRef.current !== token) return;

      // Switch visibility to reverse video atomically
      setVisibleVideoId(reverseId);
      setPlaybackState('playing');

      // Monitor until hold time
      monitorTerminalHold(reverseVideo, reverseClip, token, () => {
        if (transitionTokenRef.current !== token) return;

        // Base scene commits: title reveals, scene goes to base
        setActiveScene('base');
        setActiveControl(null);
        setDirection(null);
        setPlaybackState('ready');
        setTitleHidden(false);
        isLockedRef.current = false;
        setIsLocked(false);
        setAnnouncement('Returned to base scene.');

        // Restore focus to original control button if applicable
        if (hadFocusBeforeTransitionRef.current && lastFocusedElementRef.current) {
          requestAnimationFrame(() => {
            lastFocusedElementRef.current?.focus({ preventScroll: true });
          });
        }
      });
    } catch (err: unknown) {
      if (transitionTokenRef.current !== token) return;
      console.error('Reverse transition error:', err);
      isLockedRef.current = false;
      setIsLocked(false);
      setPlaybackState('error');
      setErrorMessage('Reverse playback error. Please try again.');
    }
  }, [
    activeControl,
    cleanupTransition,
    getVideoConfig,
    monitorTerminalHold,
    playbackState,
    rewindVideo,
    waitForDecodedFrame,
  ]);

  // Retry handler
  const handleRetry = useCallback(() => {
    setErrorMessage(null);
    if (activeScene !== 'base' && activeControl) {
      handleResetClick();
    } else {
      setActiveScene('base');
      setPlaybackState('ready');
      isLockedRef.current = false;
      setIsLocked(false);
    }
  }, [activeControl, activeScene, handleResetClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTransition();
    };
  }, [cleanupTransition]);

  return {
    activeScene,
    playbackState,
    visibleVideoId,
    activeControl,
    direction,
    isLocked,
    readyVideos,
    allReady,
    errorMessage,
    focusedIndex,
    hoveredIndex,
    titleHidden,
    collapsed,
    selectedLabelOffset,
    videoRefs,
    controllerRef,
    cellRefs,
    capsuleRef,
    handleControlClick,
    handleResetClick,
    handleRetry,
    setHoveredIndex,
    setFocusedIndex,
    handlePointerMove,
    announcement,
  };
}
