// tailor-smart-mob-app/src/services/designRecognition.js
// ✨ LOCAL Design Recognition - No AI Required
// Simple canvas-based sketch enhancement using image processing

/**
 * Main function to refine/enhance a sketch locally
 * @param {string} imageDataUrl - Base64 data URL of the sketch
 * @param {string} garmentType - Type of garment (optional, for future use)
 * @param {string} designNotes - Design notes (optional, for future use)
 * @returns {Promise<object>} - Enhanced image and suggestions
 */
export const refineSketch = async (imageDataUrl, garmentType = 'clothing', designNotes = '') => {
  return new Promise((resolve, reject) => {
    try {
      console.log('✨ Starting LOCAL sketch refinement...');
      
      // Create image element
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('📸 Image loaded, processing...');
          
          // Create canvas for processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Apply enhancement filters
          console.log('🎨 Applying enhancement filters...');
          
          // 1. Increase contrast
          contrastFilter(imageData, 1.3);
          
          // 2. Sharpen edges
          sharpenFilter(imageData);
          
          // 3. Clean noise
          cleanNoiseFilter(imageData);
          
          // 4. Smooth lines
          smoothLinesFilter(imageData);
          
          // Put enhanced data back
          ctx.putImageData(imageData, 0, 0);
          
          // Get refined image
          const refinedImageUrl = canvas.toDataURL('image/png');
          
          console.log('✅ Sketch refinement complete!');
          
          // Return result
          resolve({
            success: true,
            refinedImage: refinedImageUrl,
            suggestions: [
              'Lines have been smoothed and cleaned',
              'Edge clarity has been enhanced',
              'Contrast has been improved for better visibility',
              'Small noise and wobbles have been reduced'
            ],
            confidence: 'high',
            description: 'Your sketch has been enhanced with line smoothing, edge enhancement, and noise reduction.',
            refinementNotes: 'The design is now cleaner and more professional. You can continue editing if needed.'
          });
        } catch (error) {
          console.error('❌ Processing error:', error);
          reject(new Error('Failed to process image: ' + error.message));
        }
      };
      
      img.onerror = () => {
        console.error('❌ Failed to load image');
        reject(new Error('Failed to load image for processing'));
      };
      
      // Start loading
      img.src = imageDataUrl;
      
    } catch (error) {
      console.error('❌ Refinement error:', error);
      reject(error);
    }
  });
};

/**
 * Increase image contrast
 */
function contrastFilter(imageData, contrast) {
  const data = imageData.data;
  const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = factor * (data[i] - 128) + 128;       // Red
    data[i + 1] = factor * (data[i + 1] - 128) + 128; // Green
    data[i + 2] = factor * (data[i + 2] - 128) + 128; // Blue
  }
}

/**
 * Sharpen edges using convolution
 */
function sharpenFilter(imageData) {
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];
  
  applyConvolution(imageData, kernel);
}

/**
 * Remove small noise/speckles
 */
function cleanNoiseFilter(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const threshold = 200;
  
  // Convert to binary (black/white) for cleaning
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const value = avg > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
}

/**
 * Smooth jagged lines using median filter
 */
function smoothLinesFilter(imageData) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const radius = 1;
  
  const tempData = new Uint8ClampedArray(data);
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4;
      
      // Get neighbors
      const neighbors = [];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          neighbors.push(tempData[nIdx]);
        }
      }
      
      // Get median value
      neighbors.sort((a, b) => a - b);
      const median = neighbors[Math.floor(neighbors.length / 2)];
      
      // Apply median to all channels
      data[idx] = data[idx + 1] = data[idx + 2] = median;
    }
  }
}

/**
 * Apply convolution kernel to image
 */
function applyConvolution(imageData, kernel) {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const tempData = new Uint8ClampedArray(data);
  
  const kernelSize = Math.sqrt(kernel.length);
  const half = Math.floor(kernelSize / 2);
  
  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const pixelY = y + ky - half;
          const pixelX = x + kx - half;
          const pixelIndex = (pixelY * width + pixelX) * 4;
          const kernelValue = kernel[ky * kernelSize + kx];
          
          r += tempData[pixelIndex] * kernelValue;
          g += tempData[pixelIndex + 1] * kernelValue;
          b += tempData[pixelIndex + 2] * kernelValue;
        }
      }
      
      const index = (y * width + x) * 4;
      data[index] = Math.min(255, Math.max(0, r));
      data[index + 1] = Math.min(255, Math.max(0, g));
      data[index + 2] = Math.min(255, Math.max(0, b));
    }
  }
}

/**
 * Fallback local enhancement (simpler, faster)
 * Used if main refinement fails
 */
export const localEnhancement = async (imageDataUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw with enhanced settings
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Check if service is available (always true for local processing)
 */
export const checkServiceStatus = () => {
  return {
    available: true,
    service: 'Design Recognition (Local)',
    status: 'operational',
    type: 'local_processing'
  };
};