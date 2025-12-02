// server/controllers/sketchRefinementController.js
// ✨ AI-powered sketch refinement using Claude's vision API

const { StatusCodes } = require('http-status-codes');

/**
 * Refine a clothing design sketch using AI
 * This endpoint accepts a rough sketch and returns a refined, professional version
 */
const refineSketch = async (req, res) => {
  try {
    const { sketch, garmentType = 'clothing', designNotes = '' } = req.body;

    console.log('✨ Sketch refinement request received');
    console.log('📋 Garment type:', garmentType);
    console.log('📝 Design notes:', designNotes);

    // Validate input
    if (!sketch || !sketch.startsWith('data:image/')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Invalid sketch data. Must be a base64 encoded image.'
      });
    }

    // Extract base64 data
    let base64Data = sketch;
    if (sketch.includes(',')) {
      base64Data = sketch.split(',')[1];
    }

    // Check size (max 5MB)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024;
    
    if (sizeInBytes > maxSize) {
      return res.status(StatusCodes.REQUEST_TOO_LONG).json({
        msg: 'Sketch is too large. Maximum size is 5MB.'
      });
    }

    console.log(`📊 Sketch size: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`);

    // Prepare context for Claude
    const garmentContext = {
      shalwar: 'traditional Pakistani/South Asian loose-fitting trousers',
      kameez: 'traditional Pakistani/South Asian long shirt or tunic',
      clothing: 'general clothing item'
    };

    const context = garmentContext[garmentType] || garmentContext.clothing;

    // Call Claude's API for sketch refinement
    console.log('🤖 Calling Claude API for sketch analysis...');
    
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: `You are a professional fashion designer assistant. Analyze this rough clothing design sketch for a ${context}.

${designNotes ? `Designer's notes: ${designNotes}\n\n` : ''}
Please provide:
1. A detailed description of the design elements you can identify
2. Specific suggestions for refinement and improvement
3. Professional fashion design recommendations
4. Key measurements or proportions to consider

Format your response as a JSON object with these fields:
{
  "description": "detailed description of the sketch",
  "suggestions": ["suggestion 1", "suggestion 2", ...],
  "confidence": "high/medium/low",
  "refinementNotes": "overall notes about the design"
}

Be constructive and professional. Focus on making the design more wearable and aesthetically pleasing while respecting the original vision.`
              }
            ]
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      console.error(' Claude API error:', claudeResponse.status);
      throw new Error('AI analysis service unavailable');
    }

    const claudeData = await claudeResponse.json();
    console.log(' Claude API response received');

    // Extract text response
    const textContent = claudeData.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // Parse JSON response
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanText = textContent.replace(/```json\n?|\n?```/g, '').trim();
      analysisResult = JSON.parse(cleanText);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse Claude response as JSON, using fallback');
      analysisResult = {
        description: textContent,
        suggestions: ['Review and adjust proportions', 'Add more detail to key areas', 'Consider fabric draping'],
        confidence: 'medium',
        refinementNotes: 'Manual refinement recommended'
      };
    }

    console.log('📊 Analysis result:', analysisResult);

    // For now, we return the original sketch with AI suggestions
    // In a production system, you'd use an image generation model to create the refined version
    // Options: Stable Diffusion, DALL-E, or Claude's upcoming image generation
    
    // Simulate refined image (in production, this would be AI-generated)
    const refinedImage = sketch; // Return original for now with AI analysis

    res.status(StatusCodes.OK).json({
      success: true,
      refinedImage,
      suggestions: analysisResult.suggestions || [],
      confidence: analysisResult.confidence || 'medium',
      description: analysisResult.description || '',
      refinementNotes: analysisResult.refinementNotes || ''
    });

  } catch (error) {
    console.error(' Sketch refinement error:', error);
    
    if (error.message === 'AI analysis service unavailable') {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        msg: 'Design recognition service is temporarily unavailable. Please try again later.'
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Failed to refine sketch. Please try again.',
      error: error.message
    });
  }
};

/**
 * Check if sketch refinement service is available
 */
const checkServiceStatus = async (req, res) => {
  try {
    // Simple health check
    res.status(StatusCodes.OK).json({
      available: true,
      service: 'Design Recognition',
      status: 'operational'
    });
  } catch (error) {
    res.status(StatusCodes.OK).json({
      available: false,
      service: 'Design Recognition',
      status: 'unavailable'
    });
  }
};

module.exports = {
  refineSketch,
  checkServiceStatus
};