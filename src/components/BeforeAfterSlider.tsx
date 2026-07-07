import React, { useRef, useState, useEffect, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = 'До',
  afterLabel = 'Після',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDragging) updatePosition(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) updatePosition(e.touches[0].clientX);
    };
    const onEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className="before-after-container"
      style={{ height: 200, background: '#000', cursor: isDragging ? 'ew-resize' : 'ew-resize' }}
    >
      {/* After (full width background) */}
      <img
        src={afterSrc}
        alt="Після"
        className="absolute inset-0 w-full h-full object-cover select-none"
        draggable={false}
      />

      {/* Before (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeSrc}
          alt="До"
          className="absolute inset-0 h-full object-cover select-none"
          style={{ width: `${100 / (position / 100)}%` }}
          draggable={false}
        />
      </div>

      {/* Handle */}
      <div
        className="before-after-handle"
        style={{ left: `calc(${position}% - 1.5px)` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        {/* Arrow icons */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg"
          style={{ background: 'white', color: '#111', left: 1.5 }}
        >
          ⟺
        </div>
      </div>

      {/* Labels */}
      <div
        className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white"
        style={{ background: 'rgba(0,0,0,0.6)' }}
      >
        {beforeLabel}
      </div>
      <div
        className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-bold text-white"
        style={{ background: 'rgba(0,0,0,0.6)' }}
      >
        {afterLabel}
      </div>
    </div>
  );
};

export default BeforeAfterSlider;
