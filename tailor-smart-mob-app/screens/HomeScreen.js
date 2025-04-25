import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen = ({ navigation }) => {
  // Sample data for featured tailors
  const featuredTailors = [
    { id: '1', name: 'John Smith', rating: 4.8, specialty: 'Suits & Formal Wear' },
    { id: '2', name: 'Maria Garcia', rating: 4.7, specialty: 'Dresses & Skirts' },
    { id: '3', name: 'David Lee', rating: 4.9, specialty: 'Custom Designs' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to TailorSmart</Text>
        <Text style={styles.subtitle}>Find the perfect tailor for your needs</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Tailors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TailorList')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tailorList}
        >
          {featuredTailors.map(tailor => (
            <TouchableOpacity 
              key={tailor.id} 
              style={styles.tailorCard}
              onPress={() => navigation.navigate('TailorDetail', { tailorId: tailor.id })}
            >
              <View style={styles.tailorImagePlaceholder}>
                <Text style={styles.tailorInitials}>{tailor.name.charAt(0)}</Text>
              </View>
              <Text style={styles.tailorName}>{tailor.name}</Text>
              <Text style={styles.tailorRating}>★ {tailor.rating}</Text>
              <Text style={styles.tailorSpecialty}>{tailor.specialty}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('NewOrder')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>+</Text>
            </View>
            <Text style={styles.actionText}>New Order</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('OrderList')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📋</Text>
            </View>
            <Text style={styles.actionText}>My Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('ChatList')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>💬</Text>
            </View>
            <Text style={styles.actionText}>Messages</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>👤</Text>
            </View>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepTitle}>Find a Tailor</Text>
          <Text style={styles.stepDesc}>Browse through our selection of professional tailors</Text>
        </View>
        
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepTitle}>Create an Order</Text>
          <Text style={styles.stepDesc}>Specify your requirements and measurements</Text>
        </View>
        
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepTitle}>Chat & Confirm</Text>
          <Text style={styles.stepDesc}>Discuss details with your tailor and confirm your order</Text>
        </View>
        
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>4</Text>
          <Text style={styles.stepTitle}>Get Your Clothes</Text>
          <Text style={styles.stepDesc}>Receive your perfectly tailored garments</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    padding: 20,
    backgroundColor: '#4A90E2',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  tailorList: {
    flexDirection: 'row',
    marginLeft: -10,
  },
  tailorCard: {
    width: 150,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tailorImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  tailorInitials: {
    fontSize: 24,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  tailorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tailorRating: {
    color: '#FFB800',
    fontSize: 14,
    marginBottom: 5,
  },
  tailorSpecialty: {
    fontSize: 12,
    color: '#666',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIconText: {
    fontSize: 24,
    color: '#4A90E2',
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4A90E2',
    color: 'white',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: 'bold',
    marginRight: 15,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  stepDesc: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default HomeScreen;