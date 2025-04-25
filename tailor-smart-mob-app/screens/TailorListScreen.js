import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator
} from 'react-native';

const TailorListScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for tailors
  const tailors = [
    { 
      id: '1', 
      name: 'John Smith', 
      rating: 4.8, 
      specialty: 'Suits & Formal Wear',
      location: 'New York, NY',
      experience: '12 years'
    },
    { 
      id: '2', 
      name: 'Maria Garcia', 
      rating: 4.7, 
      specialty: 'Dresses & Skirts',
      location: 'Los Angeles, CA',
      experience: '8 years'
    },
    { 
      id: '3', 
      name: 'David Lee', 
      rating: 4.9, 
      specialty: 'Custom Designs',
      location: 'Chicago, IL',
      experience: '15 years'
    },
    { 
      id: '4', 
      name: 'Sophia Rodriguez', 
      rating: 4.5, 
      specialty: 'Alterations & Repairs',
      location: 'Miami, FL',
      experience: '7 years'
    },
    { 
      id: '5', 
      name: 'James Wilson', 
      rating: 4.6, 
      specialty: 'Wedding Attire',
      location: 'Boston, MA',
      experience: '10 years'
    },
  ];

  // Filter tailors based on search query
  const filteredTailors = tailors.filter(tailor => 
    tailor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tailor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tailor.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTailorItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.tailorCard}
      onPress={() => navigation.navigate('TailorDetail', { tailorId: item.id })}
    >
      <View style={styles.tailorHeader}>
        <View style={styles.tailorImagePlaceholder}>
          <Text style={styles.tailorInitials}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.tailorInfo}>
          <Text style={styles.tailorName}>{item.name}</Text>
          <Text style={styles.tailorRating}>★ {item.rating}</Text>
          <Text style={styles.tailorSpecialty}>{item.specialty}</Text>
        </View>
      </View>
      <View style={styles.tailorFooter}>
        <Text style={styles.tailorLocation}>{item.location}</Text>
        <Text style={styles.tailorExperience}>{item.experience}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialty, or location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredTailors}
          renderItem={renderTailorItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tailors found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 15,
  },
  tailorCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tailorHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tailorImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tailorInitials: {
    fontSize: 24,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  tailorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tailorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tailorRating: {
    color: '#FFB800',
    fontSize: 14,
    marginBottom: 4,
  },
  tailorSpecialty: {
    fontSize: 14,
    color: '#666',
  },
  tailorFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tailorLocation: {
    fontSize: 13,
    color: '#666',
  },
  tailorExperience: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TailorListScreen;