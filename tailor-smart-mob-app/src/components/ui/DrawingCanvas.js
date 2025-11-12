import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Droplet, Trash2, X, Check, Zap, Info } from 'lucide-react';

const DrawingCanvas = ({ onSave, onClose, garmentType = 'clothing', designNotes = '' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hasDrawing, setHasDrawing] = useState(false);
  
  // Pattern dropper states
  const [isPatternMode, setIsPatternMode] = useState(false);
  const [patternImage, setPatternImage] = useState(null);
  const [patterns, setPatterns] = useState([]);
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  
  // AI refinement states
  const [isRefining, setIsRefining] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      setContext(ctx);
    }
  }, []);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (event) => {
    if (isPatternMode) return; // Don't draw in pattern mode
    
    event.preventDefault();
    const pos = getCoordinates(event);
    setIsDrawing(true);
    setLastPos(pos);
    setHasDrawing(true);
  };

  const draw = (event) => {
    if (!isDrawing || !context || isPatternMode) return;
    event.preventDefault();

    const pos = getCoordinates(event);

    context.beginPath();
    context.moveTo(lastPos.x, lastPos.y);
    context.lineTo(pos.x, pos.y);
    context.stroke();

    setLastPos(pos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (context) {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      setHasDrawing(false);
      setPatterns([]);
      setPatternImage(null);
      setIsPatternMode(false);
    }
  };

  // Load pattern image
  const handlePatternUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setPatternImage({ img, dataUrl: e.target.result });
        setIsPatternMode(true);
        setShowPatternPicker(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Flood fill algorithm for pattern dropper
  const floodFill = (startX, startY, pattern) => {
    if (!context || !pattern) return;

    const canvas = canvasRef.current;
    const imageData = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const pixels = imageData.data;
    
    // Get the color at start position
    const startPos = (Math.floor(startY) * CANVAS_WIDTH + Math.floor(startX)) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // Don't fill if clicking on a line (black color)
    if (startR < 50 && startG < 50 && startB < 50) {
      return;
    }

    // Create pattern
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    
    // Set pattern size (tile the image)
    const patternSize = 100;
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    
    // Draw the pattern image
    patternCtx.drawImage(pattern.img, 0, 0, patternSize, patternSize);
    
    // Create canvas pattern
    const canvasPattern = context.createPattern(patternCanvas, 'repeat');
    
    // Find the bounding box of the shape
    const visited = new Set();
    const queue = [[Math.floor(startX), Math.floor(startY)]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    
    const colorMatch = (pos) => {
      const r = pixels[pos];
      const g = pixels[pos + 1];
      const b = pixels[pos + 2];
      const a = pixels[pos + 3];
      
      // Check if color matches start color (within tolerance)
      const tolerance = 30;
      return Math.abs(r - startR) < tolerance &&
             Math.abs(g - startG) < tolerance &&
             Math.abs(b - startB) < tolerance &&
             Math.abs(a - startA) < tolerance;
    };

    // BFS to find all connected pixels
    while (queue.length > 0) {
      const [x, y] = queue.shift();
      const key = `${x},${y}`;
      
      if (visited.has(key)) continue;
      if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) continue;
      
      const pos = (y * CANVAS_WIDTH + x) * 4;
      
      if (!colorMatch(pos)) continue;
      
      visited.add(key);
      
      // Update bounding box
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      // Add neighbors
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    // Draw the pattern in the bounded area
    context.save();
    context.fillStyle = canvasPattern;
    
    // Create a path from visited pixels
    context.beginPath();
    visited.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      context.fillRect(x, y, 1, 1);
    });
    
    context.restore();
    
    // Store pattern info
    setPatterns(prev => [...prev, {
      startX,
      startY,
      pattern: pattern.dataUrl,
      bounds: { minX, maxX, minY, maxY }
    }]);
  };

  const handleCanvasClick = (event) => {
    if (!isPatternMode || !patternImage) return;
    
    const pos = getCoordinates(event);
    floodFill(pos.x, pos.y, patternImage);
  };

  const handleSave = () => {
    if (!hasDrawing) {
      alert('Please draw something before saving.');
      return;
    }

    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const exitPatternMode = () => {
    setIsPatternMode(false);
    setPatternImage(null);
  };

  return (
    <div style={styles.container}>
      {/* Sparkle Animation (placeholder) */}
      {showSparkles && (
        <div style={styles.sparkleOverlay}>
          <div style={styles.sparkleText}>✨ Refining Design... ✨</div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Draw Your Design</h2>
        <button onClick={onClose} style={styles.closeButton}>
          <X size={24} />
        </button>
      </div>

      {/* Pattern Mode Banner */}
      {isPatternMode && (
        <div style={styles.patternBanner}>
          <div style={styles.patternBannerContent}>
            <Droplet size={20} color="#3B82F6" />
            <div style={styles.patternBannerText}>
              <strong>Pattern Mode Active</strong>
              <span>Click on any closed shape to fill it with your pattern</span>
            </div>
          </div>
          <button onClick={exitPatternMode} style={styles.exitPatternButton}>
            <X size={16} />
            Exit Pattern Mode
          </button>
        </div>
      )}

      {/* Canvas Container */}
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            ...styles.canvas,
            cursor: isPatternMode ? 'crosshair' : 'default'
          }}
          onMouseDown={isPatternMode ? handleCanvasClick : startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={isPatternMode ? handleCanvasClick : startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Instructions */}
      <div style={styles.instructions}>
        <Info size={16} color="#6B7280" />
        <span style={styles.instructionsText}>
          {isPatternMode 
            ? '🎨 Click inside closed shapes to fill them with your pattern'
            : '✏️ Draw closed shapes, then use Pattern Dropper to fill them with designs'
          }
        </span>
      </div>

      {/* Pattern Dropper Section */}
      <div style={styles.toolsContainer}>
        {!isPatternMode ? (
          <button 
            style={{
              ...styles.patternButton,
              opacity: hasDrawing ? 1 : 0.5
            }}
            onClick={() => setShowPatternPicker(true)}
            disabled={!hasDrawing}
          >
            <Droplet size={18} />
            <span>🎨 Pattern Dropper</span>
          </button>
        ) : (
          <div style={styles.activePatternInfo}>
            <div style={styles.patternPreview}>
              {patternImage && (
                <img 
                  src={patternImage.dataUrl} 
                  alt="Pattern" 
                  style={styles.patternPreviewImage}
                />
              )}
            </div>
            <div style={styles.patternInfo}>
              <strong>Active Pattern</strong>
              <span style={styles.patternCount}>
                {patterns.length} shape{patterns.length !== 1 ? 's' : ''} filled
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pattern Picker Modal */}
      {showPatternPicker && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Upload Pattern Image</h3>
            <p style={styles.modalDescription}>
              Choose an image to use as a pattern for filling shapes. Works best with seamless textures.
            </p>
            
            <label style={styles.uploadLabel}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePatternUpload}
                style={styles.fileInput}
              />
              <div style={styles.uploadBox}>
                <Upload size={32} color="#3B82F6" />
                <span style={styles.uploadText}>Click to upload pattern image</span>
                <span style={styles.uploadSubtext}>PNG, JPG, or GIF</span>
              </div>
            </label>

            <button 
              onClick={() => setShowPatternPicker(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={styles.buttonContainer}>
        <button 
          style={styles.clearButton} 
          onClick={clearCanvas}
          disabled={isRefining}
        >
          <Trash2 size={18} />
          <span>Clear All</span>
        </button>
        
        <button 
          style={{
            ...styles.saveButton,
            opacity: isRefining ? 0.5 : 1
          }}
          onClick={handleSave}
          disabled={isRefining}
        >
          <Check size={18} />
          <span>Save Sketch</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    position: 'relative'
  },
  sparkleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  sparkleText: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3B82F6',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    paddingTop: '50px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000000',
    margin: 0
  },
  closeButton: {
    padding: '8px',
    borderRadius: '20px',
    backgroundColor: '#F3F4F6',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  patternBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: '12px 16px',
    borderBottom: '2px solid #3B82F6',
    gap: '12px'
  },
  patternBannerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  patternBannerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  exitPatternButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #3B82F6',
    borderRadius: '8px',
    color: '#3B82F6',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '14px'
  },
  canvasContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#F3F4F6'
  },
  canvas: {
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    touchAction: 'none',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  instructions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    paddingTop: '12px',
    paddingBottom: '12px',
    backgroundColor: '#F3F4F6',
    borderTop: '1px solid #E5E7EB'
  },
  instructionsText: {
    fontSize: '14px',
    color: '#6B7280',
    flex: 1
  },
  toolsContainer: {
    padding: '16px',
    paddingTop: '8px',
    paddingBottom: '8px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E5E7EB'
  },
  patternButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: '14px 20px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.2s'
  },
  activePatternInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#F0FDF4',
    borderRadius: '12px',
    border: '2px solid #86EFAC'
  },
  patternPreview: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #86EFAC'
  },
  patternPreviewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  patternInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1
  },
  patternCount: {
    fontSize: '12px',
    color: '#16A34A',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '8px'
  },
  modalDescription: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '20px',
    lineHeight: '1.5'
  },
  uploadLabel: {
    display: 'block',
    cursor: 'pointer',
    marginBottom: '16px'
  },
  fileInput: {
    display: 'none'
  },
  uploadBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px',
    backgroundColor: '#F9FAFB',
    border: '2px dashed #3B82F6',
    borderRadius: '12px',
    transition: 'all 0.2s'
  },
  uploadText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#3B82F6'
  },
  uploadSubtext: {
    fontSize: '12px',
    color: '#6B7280'
  },
  cancelButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '8px',
    color: '#374151',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonContainer: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E5E7EB'
  },
  clearButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid #E5E7EB',
    fontSize: '16px',
    fontWeight: '600',
    color: '#000000',
    cursor: 'pointer'
  },
  saveButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: '#000000',
    padding: '16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    cursor: 'pointer'
  }
};

export default DrawingCanvas;