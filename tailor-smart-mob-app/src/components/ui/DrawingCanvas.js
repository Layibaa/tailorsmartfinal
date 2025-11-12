// tailor-smart-mob-app/src/components/ui/DrawingCanvas.js
// ✅ ENHANCED: Canvas Component with AI Design Recognition

import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';
import SparkleAnimation from './SparkleAnimation';
import { refineSketch, localEnhancement } from '../../services/designRecognition';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_WIDTH = Math.min(SCREEN_WIDTH - 32, 600);
const CANVAS_HEIGHT = 400;

/**
 * DrawingCanvas Component with AI Design Recognition
 * @param {function} onSave - Callback when sketch is saved
 * @param {function} onClose - Callback when canvas is closed
 * @param {string} garmentType - Type of garment being designed
 * @param {string} designNotes - Optional design notes
 */
const DrawingCanvas = ({ onSave, onClose, garmentType = 'clothing', designNotes = '' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hasDrawing, setHasDrawing] = useState(false);
  
  // ✨ NEW: Design recognition states
  const [isRefining, setIsRefining] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

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
    let clientX, clientY;
    
    if (event.nativeEvent) {
      if (event.nativeEvent.touches && event.nativeEvent.touches.length > 0) {
        clientX = event.nativeEvent.touches[0].pageX;
        clientY = event.nativeEvent.touches[0].pageY;
      } else {
        clientX = event.nativeEvent.pageX;
        clientY = event.nativeEvent.pageY;
      }
    } else {
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
    setHasDrawing(true); // Mark that user has drawn something
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
      setHasDrawing(false);
    }
  };

  // ✨ NEW: Design Recognition Handler
  const handleRefineDesign = async () => {
    if (!hasDrawing) {
      Alert.alert('No Drawing', 'Please draw your design first before refining it.');
      return;
    }

    try {
      // Confirm action
      Alert.alert(
        '✨ Refine Design',
        'AI will analyze your sketch and create a cleaner, professional version. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '✨ Refine',
            onPress: async () => {
              setIsRefining(true);
              setShowSparkles(true);

              try {
                // Capture current canvas
                const currentSketch = canvasRef.current.toDataURL('image/png');
                
                console.log('✨ Starting AI refinement...');
                
                // Call AI refinement service
                const result = await refineSketch(currentSketch, garmentType, designNotes);
                
                // Load refined image onto canvas
                if (result.refinedImage) {
                  await loadImageToCanvas(result.refinedImage);
                  
                  // Show success message with suggestions
                  let successMessage = '✨ Your design has been refined!';
                  if (result.suggestions && result.suggestions.length > 0) {
                    successMessage += '\n\n💡 Suggestions:\n' + result.suggestions.join('\n');
                  }
                  
                  Alert.alert('Success! ✨', successMessage);
                } else {
                  throw new Error('No refined image received');
                }

              } catch (error) {
                console.error('❌ Refinement error:', error);
                
                // Offer fallback option
                Alert.alert(
                  'Refinement Unavailable',
                  error.message + '\n\nWould you like to apply basic enhancement instead?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Apply Basic Enhancement',
                      onPress: async () => {
                        try {
                          const currentSketch = canvasRef.current.toDataURL('image/png');
                          const enhanced = await localEnhancement(currentSketch);
                          await loadImageToCanvas(enhanced);
                          Alert.alert('Enhanced ✓', 'Basic enhancement applied to your sketch.');
                        } catch (localError) {
                          Alert.alert('Error', 'Enhancement failed. Your original sketch is preserved.');
                        }
                      }
                    }
                  ]
                );
              } finally {
                setIsRefining(false);
                setShowSparkles(false);
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Refine handler error:', error);
      Alert.alert('Error', 'Failed to start refinement process.');
    }
  };

  // ✨ NEW: Load refined image back to canvas
  const loadImageToCanvas = (imageDataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        if (context) {
          // Clear canvas
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          // Draw refined image
          context.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          console.log('✅ Refined image loaded to canvas');
          resolve();
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load refined image'));
      };
      
      img.src = imageDataUrl;
    });
  };

  const handleSave = () => {
    if (!hasDrawing) {
      Alert.alert('No Drawing', 'Please draw something before saving.');
      return;
    }

    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* ✨ NEW: Sparkle animation overlay */}
      <SparkleAnimation visible={showSparkles} />

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
          Draw your design sketch. Use the refine button to make it professional!
        </Text>
      </View>

      {/* ✨ NEW: Design Recognition Button */}
      <View style={styles.toolsContainer}>
        <TouchableOpacity 
          style={[
            styles.refineButton,
            (!hasDrawing || isRefining) && styles.refineButtonDisabled
          ]} 
          onPress={handleRefineDesign}
          disabled={!hasDrawing || isRefining}
        >
          {isRefining ? (
            <>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.refineButtonText}>Refining...</Text>
            </>
          ) : (
            <>
              <Feather name="zap" size={18} color={colors.white} />
              <Text style={styles.refineButtonText}>✨ Refine Design</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearCanvas}
          disabled={isRefining}
        >
          <Feather name="trash-2" size={18} color={colors.black} />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, isRefining && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isRefining}
        >
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
  // ✨ NEW: Tools container for refine button
  toolsContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  refineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  refineButtonDisabled: {
    backgroundColor: colors.gray,
    shadowOpacity: 0,
    elevation: 0,
  },
  refineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
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
  saveButtonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.5,
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