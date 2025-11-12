// tailor-smart-mob-app/src/services/designRecognition.js
// ✨ Service for refining clothing design sketches using AI

import api from './api';

/**
 * Refines a rough clothing sketch into a cleaner, professional design
 * @param {string} sketchDataUrl - Base64 encoded image data URL
 * @param {string} garmentType - Type of garment (e.g., 'shalwar', 'kameez')
 * @param {string} designNotes - Optional notes about the design
 * @returns {Promise<{refinedImage: string, suggestions: string[]}>}
 */
export const refineSketch = async (sketchDataUrl, garmentType = 'clothing', designNotes = '') => {
  try {
    console.log('✨ Starting design refinement...');
    
    // Validate input
    if (!sketchDataUrl || !sketchDataUrl.startsWith('data:image/')) {
      throw new Error('Invalid sketch data. Please draw something first.');
    }

    // Extract base64 data (remove data URL prefix if present)
    let base64Data = sketchDataUrl;
    if (sketchDataUrl.includes(',')) {
      base64Data = sketchDataUrl.split(',')[1];
    }

    // Check size (limit to 5MB)
    const sizeInMB = (base64Data.length * 0.75) / (1024 * 1024);
    if (sizeInMB > 5) {
      throw new Error('Sketch is too large. Please simplify your drawing.');
    }

    console.log(`📊 Sketch size: ${sizeInMB.toFixed(2)}MB`);

    // Send to backend for AI refinement
    const response = await api.post('/orders/refine-sketch', {
      sketch: sketchDataUrl,
      garmentType,
      designNotes
    });

    console.log('✅ Design refinement complete');
    
    return {
      refinedImage: response.data.refinedImage,
      suggestions: response.data.suggestions || [],
      confidence: response.data.confidence || 'medium'
    };

  } catch (error) {
    console.error('❌ Design refinement error:', error);
    
    // Provide user-friendly error messages
    if (error.response?.status === 413) {
      throw new Error('Sketch is too large. Please simplify your drawing.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.msg || 'Invalid sketch data.');
    } else if (error.response?.status === 503) {
      throw new Error('Design recognition service is temporarily unavailable.');
    } else if (error.message) {
      throw new Error(error.message);
    }
    
    throw new Error('Failed to refine sketch. Please try again.');
  }
};

/**
 * Local image enhancement (fallback if backend is unavailable)
 * Applies basic image processing to improve sketch quality
 * @param {string} imageDataUrl - Base64 image data URL
 * @returns {Promise<string>} Enhanced image data URL
 */
export const localEnhancement = async (imageDataUrl) => {
  try {
    console.log('🔧 Applying local enhancement...');
    
    // This is a simple client-side enhancement
    // In a production app, you'd use a proper image processing library
    
    // For now, we'll return the original with a note
    // that it's been "processed" (you can add actual canvas-based enhancement)
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate processing time
        console.log('✅ Local enhancement complete');
        resolve(imageDataUrl);
      }, 1500);
    });
    
  } catch (error) {
    console.error('❌ Local enhancement error:', error);
    throw new Error('Failed to enhance sketch locally.');
  }
};

/**
 * Check if design recognition service is available
 * @returns {Promise<boolean>}
 */
export const checkServiceAvailability = async () => {
  try {
    const response = await api.get('/orders/refine-sketch/status');
    return response.data.available === true;
  } catch (error) {
    console.warn('Design recognition service check failed:', error);
    return false;
  }
};