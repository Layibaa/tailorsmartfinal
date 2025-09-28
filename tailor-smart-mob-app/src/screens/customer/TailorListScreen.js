import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getAllTailors } from '../../services/api';
import TailorCard from '../../components/tailors/TailorCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import TailorLocationFilter from '../../components/filters/TailorLocationFilter';

const TailorListScreen = ({ navigation }) => {
const [tailors, setTailors] = useState([]);
const [filteredTailors, setFilteredTailors] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [selectedCity, setSelectedCity] = useState('');
const [selectedRegion, setSelectedRegion] = useState('');

  // Load tailors data 
const loadTailors = async (filters = {}) => {
  try {
    const response = await getAllTailors(filters);
    setTailors(response.tailors);
    applySearchFilter(response.tailors, searchQuery);
  } catch (error) {
    Alert.alert('Error', 'Failed to load tailors');
    console.error('Error loading tailors:', error);
  } finally {
    setIsLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    loadTailors();
  }, []);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadTailors();
  };

// Apply search filter to current tailors
const applySearchFilter = (tailorList, query) => {
  if (query.trim() === '') {
    setFilteredTailors(tailorList);
  } else {
    const filtered = tailorList.filter(
      tailor =>
        tailor.name.toLowerCase().includes(query.toLowerCase()) ||
        (tailor.tailorProfile?.shopName && tailor.tailorProfile.shopName.toLowerCase().includes(query.toLowerCase())) ||
        (tailor.tailorProfile?.shopLocation && tailor.tailorProfile.shopLocation.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredTailors(filtered);
  }
};

// Filter tailors based on search query
const handleSearch = (text) => {
  setSearchQuery(text);
  applySearchFilter(tailors, text);
};

// Handle city filter change
const handleCityChange = (city) => {
  setSelectedCity(city);
  setSelectedRegion(''); // Clear region when city changes
  
  const filters = { city };
  loadTailors(filters);
};

// Handle region filter change
const handleRegionChange = (region) => {
  setSelectedRegion(region);
  
  const filters = { 
    city: selectedCity,
    region: region 
  };
  loadTailors(filters);
};



  // Navigate to tailor profile
  const handleTailorPress = (tailor) => {
    // For now, just log the tailor. We could navigate to a detail screen in the future.
    console.log('Tailor pressed:', tailor);
  };

  // Navigate to chat with tailor
  const handleMessagePress = (tailor) => {
    navigation.navigate('Chat', {
      userId: tailor._id,
      name: tailor.name
    });
  };

  // Navigate to create order with this tailor
  const handleOrderPress = (tailor) => {
    navigation.navigate('CreateOrder', {
      tailorId: tailor._id,
      tailorName: tailor.name
    });
  };

 // Render empty state
const renderEmptyState = () => {
  let emptyMessage = 'No tailors available';
  let showClearButton = false;
  
  if (selectedCity || selectedRegion) {
    const location = selectedRegion 
      ? `${selectedRegion}, ${selectedCity}` 
      : selectedCity;
    emptyMessage = `No tailors found in ${location}`;
    showClearButton = true;
  } else if (searchQuery.trim() !== '') {
    emptyMessage = 'No tailors match your search';
    showClearButton = true;
  }

  return (
    <View style={styles.emptyContainer}>
      <Feather name="users" size={50} color={colors.lightGray} />
      <Text style={styles.emptyText}>{emptyMessage}</Text>
      {showClearButton && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => {
            setSearchQuery('');
            setSelectedCity('');
            setSelectedRegion('');
            loadTailors();
          }}
        >
          <Text style={styles.clearSearchText}>Clear All Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

  // Render tailor card
  const renderTailorCard = ({ item }) => (
    <TailorCard
      tailor={item}
      onPress={() => handleTailorPress(item)}
      onMessagePress={() => handleMessagePress(item)}
      onOrderPress={() => handleOrderPress(item)}
    />
  );

 // Render header with search
const renderHeader = () => (
  <View>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Find Tailors</Text>
      <Text style={styles.headerSubtitle}>Browse and connect with skilled tailors</Text>
      
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={colors.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or location"
          value={searchQuery}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              applySearchFilter(tailors, '');
            }}
          >
            <Feather name="x" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
    
    <TailorLocationFilter
      selectedCity={selectedCity}
      selectedRegion={selectedRegion}
      onCityChange={handleCityChange}
      onRegionChange={handleRegionChange}
    />
  </View>
);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading tailors..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTailors}
        renderItem={renderTailorCard}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    padding: 16,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 20
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.black
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16
  },
  clearSearchButton: {
    backgroundColor: colors.black,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  clearSearchText: {
    color: colors.white,
    fontWeight: '600'
  }
});

export default TailorListScreen;
