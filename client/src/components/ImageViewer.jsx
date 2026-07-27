import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, RotateCw } from 'lucide-react';

const ImageViewer = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Entrance animation
    setTimeout(() => setIsAnimating(false), 50);
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      // if (e.key === '0') handleResetZoom();
      if (e.key === 'r' || e.key === 'R') {
        if (e.shiftKey) handleRotateLeft();
        else handleRotateRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetView();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetView();
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - 0.25, 0.5);
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const resetView = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Scroll to zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => {
      const newScale = Math.min(Math.max(prev + delta, 0.5), 5);
      if (newScale <= 1) setPosition({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  // Drag to pan (when zoomed in)
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on backdrop to close (only if not zoomed)
  const handleBackdropClick = (e) => {
    if (e.target === containerRef.current && scale <= 1) {
      handleClose();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] transition-all duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
      style={{ isolation: 'isolate' }}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      {/* Main container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        onClick={handleBackdropClick}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Close button — top right */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-[210] bg-black/50 hover:bg-red-500/80 backdrop-blur-md border border-white/10 rounded-full p-2.5 text-white transition-all duration-200 hover:scale-110 hover:rotate-90 group"
          title="Close (Esc)"
        >
          <X className="w-6 h-6 group-hover:text-white" strokeWidth={2.5} />
        </button>

        {/* Navigation — previous */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-[210] bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full p-3 text-white transition-all duration-200 hover:scale-110"
              title="Previous (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-[210] bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full p-3 text-white transition-all duration-200 hover:scale-110"
              title="Next (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Zoom controls bar — bottom center */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[210] flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 shadow-2xl">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom Out (−)"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          {/* Zoom percentage display */}
          <span className="text-white/70 text-xs font-bold w-12 text-center tabular-nums select-none">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          {/* 
          <div className="w-px h-5 bg-white/20 mx-1" /> */}
          {/* 
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            title="Reset (0)"
          >
            <RotateCcw className="w-5 h-5" />
          </button> */}

          <div className="w-px h-5 bg-white/20 mx-1" />

          <button
            onClick={handleRotateRight}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            title="Rotate (R)"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Image counter — bottom right */}
        {images.length > 1 && (
          <div className="absolute bottom-6 right-6 z-[210] bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-xs font-bold px-3.5 py-2 rounded-xl select-none">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* The image */}
        <img
          ref={imageRef}
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className={`max-h-[85vh] max-w-[90vw] object-contain select-none ${isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
            }`}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
};

export default ImageViewer;