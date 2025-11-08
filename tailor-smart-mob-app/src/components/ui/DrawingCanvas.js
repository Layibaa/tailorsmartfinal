// tailor-smart-mob-app/src/components/ui/DrawingCanvas.js
// ✅ WEB-COMPATIBLE Canvas Component for drawing sketches

import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = Math.min(SCREEN_WIDTH - 32, 600);
const CANVAS_HEIGHT = 400;

const DrawingCanvas = ({ onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set up drawing style
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fill with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      setContext(ctx);
    }
  }, []);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle both mouse and touch events
    let clientX, clientY;
    
    if (event.nativeEvent) {
      // React Native event
      if (event.nativeEvent.touches && event.nativeEvent.touches.length > 0) {
        clientX = event.nativeEvent.touches[0].pageX;
        clientY = event.nativeEvent.touches[0].pageY;
      } else {
        clientX = event.nativeEvent.pageX;
        clientY = event.nativeEvent.pageY;
      }
    } else {
      // Browser event
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const pos = getCoordinates(event);
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = (event) => {
    if (!isDrawing || !context) return;
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
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Draw Your Design</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
            touchAction: 'none',
            cursor: 'crosshair'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </View>

      <View style={styles.instructions}>
        <Feather name="info" size={16} color={colors.gray} />
        <Text style={styles.instructionsText}>
          Draw your design sketch here. Use your mouse or finger to draw.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
          <Feather name="trash-2" size={18} color={colors.black} />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Feather name="check" size={18} color={colors.white} />
          <Text style={styles.saveButtonText}>Save Sketch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.black
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.lightGray
  },
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.lightGray
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.lightGray,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  instructionsText: {
    fontSize: 14,
    color: colors.gray,
    marginLeft: 8,
    flex: 1
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.lightGray
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
    padding: 16,
    borderRadius: 8
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginLeft: 8
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8
  }
});

export default DrawingCanvas;