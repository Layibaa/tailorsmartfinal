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

const TailorListScreen = ({ navigation }) => {
  const [tailors, setTailors] = useState([]);
  const [filteredTailors, setFilteredTailors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load tailors data
  const loadTailors = async () => {
    try {
      const response = await getAllTailors();
      setTailors(response.tailors);
      setFilteredTailors(response.tailors);
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

  // Filter tailors based on search query
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredTailors(tailors);
    } else {
      const filtered = tailors.filter(
        tailor =>
          tailor.name.toLowerCase().includes(text.toLowerCase()) ||
          (tailor.tailorProfile?.shopName && tailor.tailorProfile.shopName.toLowerCase().includes(text.toLowerCase())) ||
          (tailor.tailorProfile?.shopLocation && tailor.tailorProfile.shopLocation.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredTailors(filtered);
    }
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
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="users" size={50} color={colors.lightGray} />
      <Text style={styles.emptyText}>
        {searchQuery.trim() !== ''
          ? 'No tailors match your search'
          : 'No tailors available'}
      </Text>
      {searchQuery.trim() !== '' && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => {
            setSearchQuery('');
            setFilteredTailors(tailors);
          }}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

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
              setFilteredTailors(tailors);
            }}
          >
            <Feather name="x" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>
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
