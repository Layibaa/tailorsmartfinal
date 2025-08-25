import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';
import Button from '../ui/Button';

const TailorCard = ({ tailor, onPress, onMessagePress, onOrderPress }) => { 

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      
      <View style={styles.content}>
        <Text style={styles.name}>{tailor.name}</Text>
        
        {tailor.tailorProfile && (
          <>
            <View style={styles.infoRow}>
              <Feather name="home" size={16} color={colors.gray} style={styles.icon} />
              <Text style={styles.infoText}>
                {tailor.tailorProfile.shopName || 'Shop name not available'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={colors.gray} style={styles.icon} />
              <Text style={styles.infoText}>
                {tailor.tailorProfile.shopLocation || 'Location not available'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="dollar-sign" size={16} color={colors.gray} style={styles.icon} />
              <Text style={styles.infoText}>
                Avg. Price: ${tailor.tailorProfile.averagePrice || 'N/A'}
              </Text>
            </View>
          </>
        )}
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Message" 
            onPress={onMessagePress} 
            icon="message-square"
            small
            outline
            buttonStyle={styles.messageButton} 
          />
          <Button 
            title="Order" 
            onPress={onOrderPress} 
            icon="shopping-bag"
            small
            buttonStyle={styles.orderButton} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: 150
  },
  content: {
    padding: 16
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: colors.black
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  icon: {
    marginRight: 8
  },
  infoText: {
    fontSize: 14,
    color: colors.darkGray,
    flex: 1
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  messageButton: {
    flex: 1,
    marginRight: 8
  },
  orderButton: {
    flex: 1
  }
});

export default TailorCard;
