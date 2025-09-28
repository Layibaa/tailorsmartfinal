import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { 
  getTailorOrders,
  getPendingOrders,
  getActiveOrders,
  getAllConversations
} from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import OrderCard from '../../components/orders/OrderCard';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';

const TailorDashboard = ({ navigation }) => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useContext(AuthContext);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // Load pending orders
      const pendingResponse = await getPendingOrders()
        .catch(error => {
          console.error('Error fetching pending orders:', error.response?.data || error.message);
          return { orders: [] }; // Provide fallback data
        });
      setPendingOrders(pendingResponse.orders || []);

      // Load active orders
      const activeResponse = await getActiveOrders()
        .catch(error => {
          console.error('Error fetching active orders:', error.response?.data || error.message);
          return { orders: [] }; // Provide fallback data
        });
      setActiveOrders(activeResponse.orders || []);

      // Load conversations
      const conversationsResponse = await getAllConversations()
        .catch(error => {
          console.error('Error fetching conversations:', error.response?.data || error.message);
          return { conversations: [] }; // Provide fallback data
        });
      setConversations(conversationsResponse.conversations || []);
    } catch (error) {
      // More detailed error handling
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      
      Alert.alert(
        'Error Loading Data',
        'Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload data when screen comes into focus
      setIsLoading(true);
      loadDashboardData();
    });

    return unsubscribe;
  }, [navigation]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Handle order press
  const handleOrderPress = (orderId) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  // Handle logout 
const handleLogout = async () => {
  try {
    const result = await logout();
    if (result.success) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to logout');
    }
  } catch (error) {
    console.error('Logout error:', error);
    Alert.alert('Error', 'An unexpected error occurred during logout');
  }
};


  // Handle profile navigation
  const handleProfile = () => {
    setShowMenu(false);
    navigation.navigate('Profile');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Tailor'}</Text>
          <Text style={styles.shopName}>
            {user?.tailorProfile?.shopName || 'Your Tailoring Shop'}
          </Text>
        </View>
        
        {/* Hamburger Menu */}
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Feather name="menu" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Shop Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={require('../../assets/Black.png')}  
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>{user?.tailorProfile?.shopName || 'Your Tailoring Shop'}</Text>
            <Text style={styles.bannerSubtitle}>{user?.tailorProfile?.shopLocation || 'Shop Location'}</Text>
          </View>
        </View>

        {/* Dashboard Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.pending }]}>
              <Feather name="clock" size={20} color={colors.white} />
            </View>
            <Text style={styles.statCount}>{pendingOrders?.length || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.making }]}>
              <Feather name="scissors" size={20} color={colors.white} />
            </View>
            <Text style={styles.statCount}>{activeOrders?.length || 0}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.info }]}>
              <Feather name="message-circle" size={20} color={colors.white} />
            </View>
            <Text style={styles.statCount}>{conversations?.length || 0}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </View>
        </View>

        {/* Pending Order Requests */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {!pendingOrders || pendingOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={40} color={colors.lightGray} />
              <Text style={styles.emptyText}>No pending order requests</Text>
            </View>
          ) : (
            pendingOrders.slice(0, 2).map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onPress={() => handleOrderPress(order._id)}
                userRole="tailor"
                showActions={true}
                onAccept={() => navigation.navigate('OrderDetails', { 
                  orderId: order._id,
                  actionRequired: true
                })}
                onReject={() => navigation.navigate('OrderDetails', { 
                  orderId: order._id,
                  actionRequired: true,
                  action: 'reject'
                })}
              />
            ))
          )}
        </View>

        {/* Active Orders */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Active')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {!activeOrders || activeOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="activity" size={40} color={colors.lightGray} />
              <Text style={styles.emptyText}>No active orders</Text>
            </View>
          ) : (
            activeOrders.slice(0, 2).map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onPress={() => handleOrderPress(order._id)}
                userRole="tailor"
              />
            ))
          )}
        </View>

        {/* Recent Messages */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Messages</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Messages')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {!conversations || conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="message-circle" size={40} color={colors.lightGray} />
              <Text style={styles.emptyText}>No recent messages</Text>
            </View>
          ) : (
            conversations.slice(0, 3).map(conversation => (
              <TouchableOpacity
                key={conversation._id}
                style={styles.conversationItem}
                onPress={() => navigation.navigate('Chat', {
                  userId: conversation._id,
                  name: conversation.userInfo?.name || 'Customer'
                })}
              >
                <View style={styles.conversationAvatar}>
                  <Feather name="user" size={24} color={colors.white} />
                </View>
                <View style={styles.conversationContent}>
                  <Text style={styles.conversationName}>
                    {conversation.userInfo?.name || 'Customer'}
                  </Text>
                  <Text style={styles.conversationMessage} numberOfLines={1}>
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </Text>
                </View>
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setShowMenu(false)}>
                <Feather name="x" size={24} color={colors.black} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
              <Feather name="user" size={20} color={colors.black} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Feather name="log-out" size={20} color={colors.error || '#dc3545'} />
              <Text style={[styles.menuItemText, { color: colors.error || '#dc3545' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16
  },
  welcomeText: {
    fontSize: 16,
    color: colors.gray
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black
  },
  shopName: {
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 2
  },
  menuButton: {
    padding: 8
  },
  scrollView: {
    flex: 1
  },
  bannerContainer: {
    margin: 16,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden'
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    justifyContent: 'center'
  },
  bannerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  bannerSubtitle: {
    color: colors.white,
    fontSize: 14
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black
  },
  seeAllText: {
    color: colors.black,
    fontWeight: '500'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.lightGray,
    borderRadius: 8
  },
  emptyText: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 12
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  conversationContent: {
    flex: 1
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4
  },
  conversationMessage: {
    fontSize: 14,
    color: colors.gray
  },
  unreadBadge: {
    backgroundColor: colors.black,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  // Menu Modal Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15
  },
  menuItemText: {
    fontSize: 16,
    color: colors.black,
    marginLeft: 15
  }
});

export default TailorDashboard;