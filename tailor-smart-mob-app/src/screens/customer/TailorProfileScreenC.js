import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getTailorById } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import TailorReviewsSection from '../../components/TailorReviewsSection';

const TailorProfileScreen = ({ route, navigation }) => {
  const { tailorId } = route.params;
  const { user } = useContext(AuthContext);
  const [tailor, setTailor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTailorProfile();
  }, [tailorId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setRefreshKey(prev => prev + 1);
    });
    return unsubscribe;
  }, [navigation]);

  const loadTailorProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getTailorById(tailorId);
      setTailor(response.tailor);
    } catch (error) {
      console.error('Error loading tailor profile:', error);
      Alert.alert('Error', 'Failed to load tailor profile', [
        { text: 'Retry', onPress: loadTailorProfile },
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessagePress = () => {
    navigation.navigate('Chat', { userId: tailor._id, name: tailor.name });
  };

  const handleOrderPress = () => {
    navigation.navigate('CreateOrder', { tailorId: tailor._id, tailorName: tailor.name });
  };

  const handleWriteReview = () => {
    navigation.navigate('WriteReview', { tailorId: tailor._id, tailorName: tailor.name });
  };

  if (isLoading) return <LoadingSpinner fullScreen text="Loading tailor profile..." />;

  if (!tailor)
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>Tailor not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Remove flex:1 from ScrollView */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        nestedScrollEnabled
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tailor Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Feather name="user" size={48} color={colors.white} />
            </View>
          </View>

          <Text style={styles.name}>{tailor.name}</Text>

          {tailor.tailorProfile?.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Feather name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{tailor.tailorProfile.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({tailor.tailorProfile.reviewCount || 0} reviews)
              </Text>
            </View>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoRow}>
            <Feather name="mail" size={20} color={colors.gray} />
            <Text style={styles.infoText}>{tailor.email}</Text>
          </View>
          {tailor.phone && (
            <View style={styles.infoRow}>
              <Feather name="phone" size={20} color={colors.gray} />
              <Text style={styles.infoText}>{tailor.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={20} color={colors.gray} />
            <Text style={styles.infoText}>
              {tailor.city}
              {tailor.region ? `, ${tailor.region}` : ''}
            </Text>
          </View>
        </View>

        {/* Shop Info */}
        {tailor.tailorProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            {tailor.tailorProfile.shopName && (
              <View style={styles.infoRow}>
                <Feather name="home" size={20} color={colors.gray} />
                <Text style={styles.infoText}>{tailor.tailorProfile.shopName}</Text>
              </View>
            )}
            {tailor.tailorProfile.shopLocation && (
              <View style={styles.infoRow}>
                <Feather name="navigation" size={20} color={colors.gray} />
                <Text style={styles.infoText}>{tailor.tailorProfile.shopLocation}</Text>
              </View>
            )}
            {tailor.tailorProfile.averagePrice && (
              <View style={styles.infoRow}>
                <Text style={styles.infoText}>
                  Average Price: Rs. {tailor.tailorProfile.averagePrice}
                </Text>
              </View>
            )}
            {tailor.tailorProfile.experience && (
              <View style={styles.infoRow}>
                <Feather name="award" size={20} color={colors.gray} />
                <Text style={styles.infoText}>
                  {tailor.tailorProfile.experience} years of experience
                </Text>
              </View>
            )}
            {tailor.tailorProfile.specialties?.length > 0 && (
              <View style={styles.specialtiesContainer}>
                <View style={styles.infoRow}>
                  <Feather name="scissors" size={20} color={colors.gray} />
                  <Text style={styles.infoLabel}>Specialties:</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {tailor.tailorProfile.specialties.map((specialty, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {user?.role === 'customer' && (
              <TouchableOpacity style={styles.writeReviewButton} onPress={handleWriteReview}>
                <Feather name="edit-3" size={16} color={colors.white} />
                <Text style={styles.writeReviewText}>Write Review</Text>
              </TouchableOpacity>
            )}
          </View>
          <TailorReviewsSection tailorId={tailorId} key={refreshKey} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button title="Message" onPress={handleMessagePress} icon="message-square" outline />
          <Button title="Place Order" onPress={handleOrderPress} icon="shopping-bag" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: { paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20, backgroundColor: colors.white },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.black },
  placeholder: { width: 40 },
  profileCard: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.black, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.black, marginBottom: 8 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 16, fontWeight: '600', color: colors.black, marginLeft: 4 },
  reviewCount: { fontSize: 14, color: colors.gray, marginLeft: 4 },
  section: { paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.black, marginBottom: 16 },
  reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  writeReviewButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.black, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  writeReviewText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoText: { fontSize: 16, color: colors.darkGray, marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 16, color: colors.darkGray, marginLeft: 12, fontWeight: '500' },
  specialtiesContainer: { marginTop: 4 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginLeft: 32 },
  tag: { backgroundColor: colors.lightGray, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 14, color: colors.black, fontWeight: '500' },
  actionButtons: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 24, gap: 12 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.white },
  errorText: { fontSize: 18, color: colors.error, marginVertical: 20, textAlign: 'center' },
});

export default TailorProfileScreen;
