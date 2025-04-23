import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../utils/colors';

const Card = ({ 
  children, 
  style, 
  onPress, 
  elevation = 2,
  padding = 'medium', // 'small', 'medium', 'large'
}) => {
  const getPaddingStyle = () => {
    switch(padding) {
      case 'small':
        return { padding: 10 };
      case 'medium':
        return { padding: 16 };
      case 'large':
        return { padding: 24 };
      default:
        return { padding: 16 };
    }
  };

  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      style={[
        styles.card, 
        { 
          shadowOpacity: elevation * 0.05,
          elevation: elevation,
        },
        getPaddingStyle(),
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
});

export default Card;