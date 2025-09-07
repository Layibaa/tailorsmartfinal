// utils/measurementPredictor.js
import * as tf from '@tensorflow/tfjs';


class MeasurementPredictor {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.scaler = {
      input: {
        mean: [30, 65, 165, 1.5], // age, weight, height, gender (0=female, 1=male)
        std: [10, 15, 10, 0.5]
      },
      output: {
        mean: [95, 75, 100, 42, 58, 38, 100, 105, 55], // measurements means
        std: [12, 10, 12, 5, 8, 4, 15, 15, 8] // measurements stds
      }
    };
    this.initializeModel();
  }

  // Normalize input features
  normalizeInput(age, weight, height, gender) {
    const genderNum = gender === 'male' ? 1 : 0;
    const features = [age, weight, height, genderNum];
    
    return features.map((val, idx) => 
      (val - this.scaler.input.mean[idx]) / this.scaler.input.std[idx]
    );
  }

  // Denormalize predictions
  denormalizePredictions(predictions) {
    return predictions.map((val, idx) => 
      val * this.scaler.output.std[idx] + this.scaler.output.mean[idx]
    );
  }

  async initializeModel() {
    try {
      // Create a simple neural network for measurement prediction
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [4], // age, weight, height, gender
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 64,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 9, // 9 measurements
            activation: 'linear'
          })
        ]
      });

      // Compile the model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Pre-train with synthetic data
      await this.preTrainWithSyntheticData();
      
      this.isModelLoaded = true;
      console.log('ML Model initialized and pre-trained successfully');
    } catch (error) {
      console.error('Error initializing ML model:', error);
      this.isModelLoaded = false;
    }
  }

  // Generate synthetic training data based on realistic body measurement correlations
  generateSyntheticData(numSamples = 1000) {
    const inputs = [];
    const outputs = [];

    for (let i = 0; i < numSamples; i++) {
      // Generate random demographics
      const age = Math.random() * 50 + 18; // 18-68 years
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const baseHeight = gender === 'male' ? 175 : 162; // cm
      const height = baseHeight + (Math.random() - 0.5) * 20;
      const bmi = 20 + Math.random() * 10; // BMI 20-30
      const weight = (bmi * height * height) / 10000;

      // Generate correlated measurements with some realistic formulas
      const heightFactor = height / 170; // normalize around 170cm
      const weightFactor = weight / 65; // normalize around 65kg
      const genderFactor = gender === 'male' ? 1.1 : 0.9;

      const chest = Math.max(80, 85 * heightFactor * weightFactor * genderFactor + (Math.random() - 0.5) * 10);
      const waist = Math.max(60, chest * 0.75 + (Math.random() - 0.5) * 8);
      const hip = Math.max(75, chest * 1.05 + (Math.random() - 0.5) * 10);
      const shoulder = Math.max(35, height * 0.24 + (Math.random() - 0.5) * 4);
      const sleeveLength = Math.max(50, height * 0.32 + (Math.random() - 0.5) * 6);
      const neck = Math.max(30, 35 + weight * 0.05 + (Math.random() - 0.5) * 3);
      const inseam = Math.max(70, height * 0.55 + (Math.random() - 0.5) * 8);
      const outseam = Math.max(90, inseam + 25 + (Math.random() - 0.5) * 5);
      const thigh = Math.max(45, waist * 0.7 + (Math.random() - 0.5) * 6);

      inputs.push(this.normalizeInput(age, weight, height, gender));
      outputs.push([chest, waist, hip, shoulder, sleeveLength, neck, inseam, outseam, thigh]);
    }

    return { inputs, outputs };
  }

  async preTrainWithSyntheticData() {
    try {
      const { inputs, outputs } = this.generateSyntheticData(2000);
      
      const inputTensor = tf.tensor2d(inputs);
      const outputTensor = tf.tensor2d(outputs);

      // Normalize outputs
      const normalizedOutputs = outputs.map(measurements => 
        measurements.map((val, idx) => 
          (val - this.scaler.output.mean[idx]) / this.scaler.output.std[idx]
        )
      );
      const normalizedOutputTensor = tf.tensor2d(normalizedOutputs);

      await this.model.fit(inputTensor, normalizedOutputTensor, {
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (epoch % 20 === 0) {
              console.log(`Training epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
            }
          }
        }
      });

      // Cleanup tensors
      inputTensor.dispose();
      outputTensor.dispose();
      normalizedOutputTensor.dispose();

      console.log('Pre-training completed successfully');
    } catch (error) {
      console.error('Error during pre-training:', error);
      throw error;
    }
  }

  async predictMeasurements(customerProfile) {
    if (!this.isModelLoaded || !this.model) {
      console.warn('Model not loaded, using fallback predictions');
      return this.getFallbackMeasurements(customerProfile);
    }

    try {
      const { age, weight, height, gender } = customerProfile;
      
      // Validate input
      if (!age || !weight || !height || !gender) {
        throw new Error('Missing required profile data for prediction');
      }

      // Normalize input
      const normalizedInput = this.normalizeInput(age, weight, height, gender);
      const inputTensor = tf.tensor2d([normalizedInput]);

      // Make prediction
      const prediction = await this.model.predict(inputTensor);
      const predictionArray = await prediction.data();

      // Denormalize predictions
      const denormalizedPredictions = this.denormalizePredictions(Array.from(predictionArray));

      // Cleanup tensor
      inputTensor.dispose();
      prediction.dispose();

      // Round to nearest cm and ensure positive values
      const measurements = {
        chest: Math.max(70, Math.round(denormalizedPredictions[0])),
        waist: Math.max(60, Math.round(denormalizedPredictions[1])),
        hip: Math.max(70, Math.round(denormalizedPredictions[2])),
        shoulder: Math.max(30, Math.round(denormalizedPredictions[3])),
        sleeveLength: Math.max(50, Math.round(denormalizedPredictions[4])),
        neck: Math.max(30, Math.round(denormalizedPredictions[5])),
        inseam: Math.max(70, Math.round(denormalizedPredictions[6])),
        outseam: Math.max(90, Math.round(denormalizedPredictions[7])),
        thigh: Math.max(45, Math.round(denormalizedPredictions[8]))
      };

      console.log('ML Predictions generated:', measurements);
      return measurements;
    } catch (error) {
      console.error('Error making prediction:', error);
      return this.getFallbackMeasurements(customerProfile);
    }
  }

  // Fallback method using simple statistical correlations
  getFallbackMeasurements(customerProfile) {
    const { age, weight, height, gender } = customerProfile;
    
    const heightFactor = height / 170;
    const weightFactor = weight / 65;
    const genderFactor = gender === 'male' ? 1.1 : 0.9;
    const ageFactor = 1 + (age - 30) * 0.002; // slight increase with age

    return {
      chest: Math.round(85 * heightFactor * weightFactor * genderFactor * ageFactor),
      waist: Math.round(75 * heightFactor * weightFactor * genderFactor * ageFactor * 0.9),
      hip: Math.round(90 * heightFactor * weightFactor * genderFactor * ageFactor * 1.05),
      shoulder: Math.round(height * 0.24 * genderFactor),
      sleeveLength: Math.round(height * 0.32),
      neck: Math.round(35 + weight * 0.08),
      inseam: Math.round(height * 0.55),
      outseam: Math.round(height * 0.55 + 25),
      thigh: Math.round(50 * weightFactor * genderFactor)
    };
  }

  // Method to improve model with real user data (optional)
  async improveModelWithUserData(userMeasurements) {
    if (!this.isModelLoaded || userMeasurements.length === 0) return;

    try {
      // This would be called when users provide actual measurements
      // to continuously improve the model
      console.log('Model improvement with user data:', userMeasurements.length, 'samples');
      // Implementation would depend on your data collection strategy
    } catch (error) {
      console.error('Error improving model:', error);
    }
  }
}

// Create singleton instance
export const measurementPredictor = new MeasurementPredictor();
export default measurementPredictor;