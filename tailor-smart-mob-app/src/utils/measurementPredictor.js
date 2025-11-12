// utils/measurementPredictor.js - PAKISTAN-FOCUSED VERSION
// This version uses statistical correlations instead of TensorFlow for better Expo Go compatibility

class MeasurementPredictor {
  constructor() {
    // Statistical data based on Pakistani anthropometric measurements
    // Sources: Pakistan health surveys and South Asian body measurement studies
    this.pakistaniAverages = {
      male: {
        height: 169, // cm (average Pakistani male)
        weight: 65,  // kg
        chest: 92,
        waist: 82,
        hip: 95,
        shoulder: 42,
        sleeveLength: 60,
        neck: 38,
        inseam: 76,
        outseam: 100,
        thigh: 54
      },
      female: {
        height: 157, // cm (average Pakistani female)
        weight: 57,  // kg
        chest: 88,
        waist: 74,
        hip: 96,
        shoulder: 38,
        sleeveLength: 56,
        neck: 34,
        inseam: 70,
        outseam: 94,
        thigh: 52
      }
    };
  }

  /**
   * Calculate BMI (Body Mass Index)
   */
  calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  /**
   * Get body frame category based on height and weight
   */
  getBodyFrame(gender, height, weight) {
    const bmi = this.calculateBMI(weight, height);
    
    // BMI categories adjusted for South Asian population
    if (bmi < 18.5) return 'slim';
    if (bmi < 23) return 'average'; // Lower threshold for South Asians
    if (bmi < 27.5) return 'heavy'; // Adjusted for South Asian standards
    return 'very_heavy';
  }

  /**
   * Calculate age factor for measurements
   * Measurements typically increase slightly with age due to lifestyle
   */
  getAgeFactor(age) {
    if (age < 25) return 0.97; // Younger adults slightly slimmer
    if (age < 40) return 1.0;  // Prime adult years
    if (age < 55) return 1.03; // Slight increase
    return 1.05; // Older adults
  }

  /**
   * Main prediction method - returns measurements in centimeters
   */
  predictMeasurements(customerProfile) {
    try {
      const { age, weight, height, gender } = customerProfile;
      
      // Validate input
      if (!age || !weight || !height || !gender) {
        console.warn('Missing profile data for prediction');
        return null;
      }

      // Normalize gender input
      const normalizedGender = gender.toLowerCase() === 'male' ? 'male' : 'female';
      const baseStats = this.pakistaniAverages[normalizedGender];

      // Calculate scaling factors
      const heightFactor = height / baseStats.height;
      const weightFactor = weight / baseStats.weight;
      const ageFactor = this.getAgeFactor(age);
      const bodyFrame = this.getBodyFrame(normalizedGender, height, weight);

      // Frame-specific adjustments
      const frameAdjustments = {
        slim: 0.92,
        average: 1.0,
        heavy: 1.08,
        very_heavy: 1.15
      };
      const frameMultiplier = frameAdjustments[bodyFrame];

      // Calculate measurements with realistic correlations
      const measurements = {
        // Upper body measurements
        chest: Math.round(
          baseStats.chest * 
          Math.sqrt(heightFactor * weightFactor) * 
          frameMultiplier * 
          ageFactor
        ),
        
        waist: Math.round(
          baseStats.waist * 
          weightFactor * 
          frameMultiplier * 
          ageFactor * 
          1.02 // Waist tends to increase more with weight
        ),
        
        hip: Math.round(
          baseStats.hip * 
          Math.sqrt(heightFactor * weightFactor) * 
          frameMultiplier * 
          ageFactor
        ),
        
        shoulder: Math.round(
          baseStats.shoulder * 
          heightFactor * 
          Math.pow(weightFactor, 0.3) * // Less influenced by weight
          (normalizedGender === 'male' ? 1.0 : 0.95)
        ),
        
        sleeveLength: Math.round(
          baseStats.sleeveLength * 
          heightFactor * 
          (normalizedGender === 'male' ? 1.0 : 0.97)
        ),
        
        neck: Math.round(
          baseStats.neck * 
          Math.pow(weightFactor, 0.6) * 
          frameMultiplier * 
          ageFactor
        ),
        
        // Lower body measurements
        inseam: Math.round(
          baseStats.inseam * 
          heightFactor * 
          (normalizedGender === 'male' ? 1.0 : 0.96)
        ),
        
        outseam: Math.round(
          baseStats.outseam * 
          heightFactor * 
          (normalizedGender === 'male' ? 1.0 : 0.97)
        ),
        
        thigh: Math.round(
          baseStats.thigh * 
          Math.sqrt(weightFactor * heightFactor) * 
          frameMultiplier
        )
      };

      // Ensure all measurements are within realistic ranges
      const validatedMeasurements = this.validateMeasurements(measurements, normalizedGender);

      console.log('✅ Measurements predicted:', {
        gender: normalizedGender,
        height,
        weight,
        age,
        bodyFrame,
        measurements: validatedMeasurements
      });

      return validatedMeasurements;
    } catch (error) {
      console.error('❌ Error predicting measurements:', error);
      return null;
    }
  }

  /**
   * Validate and constrain measurements to realistic ranges
   */
  validateMeasurements(measurements, gender) {
    const ranges = {
      male: {
        chest: { min: 75, max: 130 },
        waist: { min: 65, max: 120 },
        hip: { min: 80, max: 130 },
        shoulder: { min: 35, max: 55 },
        sleeveLength: { min: 50, max: 70 },
        neck: { min: 32, max: 48 },
        inseam: { min: 65, max: 90 },
        outseam: { min: 90, max: 115 },
        thigh: { min: 45, max: 75 }
      },
      female: {
        chest: { min: 70, max: 120 },
        waist: { min: 60, max: 110 },
        hip: { min: 80, max: 130 },
        shoulder: { min: 32, max: 48 },
        sleeveLength: { min: 48, max: 65 },
        neck: { min: 28, max: 42 },
        inseam: { min: 60, max: 85 },
        outseam: { min: 85, max: 110 },
        thigh: { min: 42, max: 70 }
      }
    };

    const genderRanges = ranges[gender];
    const validated = {};

    for (const [key, value] of Object.entries(measurements)) {
      const range = genderRanges[key];
      if (range) {
        validated[key] = Math.max(range.min, Math.min(range.max, value));
      } else {
        validated[key] = value;
      }
    }

    return validated;
  }

  /**
   * Get measurement confidence level
   */
  getConfidence(customerProfile) {
    const { age, weight, height } = customerProfile;
    
    // Check if values are within typical Pakistani ranges
    const heightInRange = height >= 145 && height <= 190;
    const weightInRange = weight >= 40 && weight <= 120;
    const ageInRange = age >= 16 && age <= 80;

    if (heightInRange && weightInRange && ageInRange) {
      return 'high';
    } else if (heightInRange && weightInRange) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get explanation for the predicted measurements
   */
  getExplanation(customerProfile, bodyFrame) {
    const { age, gender } = customerProfile;
    const genderText = gender.toLowerCase() === 'male' ? 'male' : 'female';
    
    let explanation = `Based on your profile (${genderText}, ${age} years old), `;
    explanation += `with a ${bodyFrame} build according to Pakistani standards, `;
    explanation += `these are the estimated measurements. `;
    explanation += `Please verify and adjust as needed for the best fit.`;

    return explanation;
  }
}

// Create singleton instance
export const measurementPredictor = new MeasurementPredictor();
export default measurementPredictor;