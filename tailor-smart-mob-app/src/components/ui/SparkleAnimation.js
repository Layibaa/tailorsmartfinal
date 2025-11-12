// tailor-smart-mob-app/src/components/ui/SparkleAnimation.js
// ✨ Animated sparkle effect for design refinement

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * SparkleAnimation Component
 * Displays animated sparkles across the canvas during refinement
 * @param {boolean} visible - Whether animation is visible
 */
const SparkleAnimation = ({ visible }) => {
  // Create 8 sparkle animations
  const sparkles = useRef([...Array(8)].map(() => ({
    opacity: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
    translateX: useRef(new Animated.Value(0)).current,
    translateY: useRef(new Animated.Value(0)).current,
  }))).current;

  useEffect(() => {
    if (visible) {
      // Start all sparkle animations
      sparkles.forEach((sparkle, index) => {
        // Stagger the animations
        setTimeout(() => {
          animateSparkle(sparkle);
        }, index * 100);
      });
    } else {
      // Reset all animations
      sparkles.forEach((sparkle) => {
        sparkle.opacity.setValue(0);
        sparkle.scale.setValue(0);
      });
    }
  }, [visible]);

  const animateSparkle = (sparkle) => {
    // Random position
    const randomX = Math.random() * SCREEN_WIDTH - SCREEN_WIDTH / 2;
    const randomY = Math.random() * SCREEN_HEIGHT - SCREEN_HEIGHT / 2;
    
    sparkle.translateX.setValue(randomX);
    sparkle.translateY.setValue(randomY);

    // Parallel animations
    Animated.loop(
      Animated.sequence([
        // Fade in and scale up
        Animated.parallel([
          Animated.timing(sparkle.opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.scale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Hold
        Animated.delay(200),
        // Fade out and scale down
        Animated.parallel([
          Animated.timing(sparkle.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle.scale, {
            toValue: 0.5,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Small delay before restart
        Animated.delay(300),
      ])
    ).start();
  };

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {sparkles.map((sparkle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.sparkle,
            {
              opacity: sparkle.opacity,
              transform: [
                { translateX: sparkle.translateX },
                { translateY: sparkle.translateY },
                { scale: sparkle.scale },
              ],
            },
          ]}
        >
          <Feather name="star" size={24} color={colors.primary} />
        </Animated.View>
      ))}
      
      {/* Center glow effect */}
      <Animated.View style={styles.centerGlow}>
        <View style={styles.glowCircle} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  sparkle: {
    position: 'absolute',
  },
  centerGlow: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
});

export default SparkleAnimation;