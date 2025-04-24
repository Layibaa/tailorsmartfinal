import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Card from '../components/Card';
import TailorCard from '../components/TailorCard';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { AuthContext } from '../services/auth';
import { fetchFeaturedTailors, fetchRecentOrders } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const { authState } = useContext(AuthContext);
  const [featuredTailors, setFeaturedTailors] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isTailor = authState.user?.role === 'tailor';
  const userName = authState.user?.name || 'User';

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      if (!isTailor) {
        // Load featured tailors for customers
        const tailors = await fetchFeaturedTailors();
        setFeaturedTailors(tailors);
      }
      
      // Load recent orders for both customers and tailors
      const orders = await fetchRecentOrders();
      setRecentOrders(orders);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadHomeData();
  }, [isTailor]);

  if (loading && !refreshing) {
    return <Loading />;
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const renderFeaturedTailors = () => {
    if (featuredTailors.length === 0) {
      return (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>No tailors found nearby</Text>
        </View>
      );
    }

    return featuredTailors.map((tailor) => (
      <TailorCard
        key={tailor._id}
        tailor={tailor}
        onPress={() => navigation.navigate('TailorDetail', { tailorId: tailor._id })}
      />
    ));
  };

  const renderRecentOrderItem = (order) => {
    return (
      <TouchableOpacity
        key={order._id}
        style={styles.orderItem}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}
      >
        <View style={styles.orderIconContainer}>
          <Ionicons 
            name={order.garmentType === 'Shirt' ? 'shirt-outline' : 'cut-outline'} 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>{order.garmentType}</Text>
          <Text style={styles.orderStatus}>{order.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        showLogo={true}
        leftIcon="menu"
        rightIcon="notifications-outline"
        onLeftPress={() => navigation.openDrawer()}
        onRightPress={() => navigation.navigate('Notifications')}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getTimeOfDay()},</Text>
          <Text style={styles.userName}>{userName}!</Text>
        </View>
        
        {!isTailor && (
          <Card style={styles.actionCard}>
            <Text style={styles.actionText}>Need new tailored clothes?</Text>
            <Button
              title="Create New Order"
              onPress={() => navigation.navigate('NewOrder')}
              style={styles.actionButton}
            />
          </Card>
        )}
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isTailor ? 'Recent Job Requests' : 'Recent Orders'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.recentOrdersCard}>
          {recentOrders.length > 0 ? (
            recentOrders.map(renderRecentOrderItem)
          ) : (
            <View style={styles.emptyOrders}>
              <Ionicons name="document-text-outline" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyOrdersText}>
                {isTailor ? 'No recent job requests' : 'No recent orders'}
              </Text>
              {!isTailor && (
                <TouchableOpacity
                  style={styles.createOrderButton}
                  onPress={() => navigation.navigate('NewOrder')}
                >
                  <Text style={styles.createOrderText}>Create New Order</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>
        
        {!isTailor && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Tailors</Text>
              <TouchableOpacity onPress={() => navigation.navigate('TailorList')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {renderFeaturedTailors()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  actionButton: {
    width: 150,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.primary,
  },
  recentOrdersCard: {
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  orderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  orderStatus: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginTop: 2,
  },
  emptyOrders: {
    padding: 32,
    alignItems: 'center',
  },
  emptyOrdersText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginTop: 16,
    marginBottom: 16,
  },
  createOrderButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  createOrderText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.white,
  },
  emptySection: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
});

export default HomeScreen;