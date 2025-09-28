import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Alert,
  Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getCustomerOrders, getAllConversations } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import OrderCard from '../../components/orders/OrderCard';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import { CommonActions } from '@react-navigation/native';

const CustomerDashboard = ({ navigation }) => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { user, logout } = useContext(AuthContext);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      // Load orders
      const ordersResponse = await getCustomerOrders();
      const sortedOrders = ordersResponse?.orders
        ? ordersResponse.orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
        : [];
      setRecentOrders(sortedOrders);

      // Load conversations
      const conversationsResponse = await getAllConversations();
      setConversations(conversationsResponse?.conversations || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
      console.error('Error loading dashboard data:', error);
      setRecentOrders([]);
      setConversations([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Handle order press
  const handleOrderPress = (orderId) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  // Handle Logout
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

  // Menu items
  const menuItems = [
    {
      id: 'profile',
      title: 'My Profile',
      icon: 'user',
      onPress: () => {
        setShowMenu(false);
        navigation.navigate('Profile');
      }
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out',
      onPress: () => {
        setShowMenu(false);
        handleLogout();
      }
    }
  ];

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Feather name="menu" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://unsplash.com/photos/photo-of-gray-sewing-machine-foot-lock-with-thread-on-black-cloth-jNKv4QohAk0' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Get your perfect fit</Text>
            <Text style={styles.bannerSubtitle}>Find a tailor to create custom garments</Text>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => navigation.navigate('Tailors')}
            >
              <Text style={styles.bannerButtonText}>Browse Tailors</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Tailors')}
          >
            <Feather name="search" size={24} color={colors.black} />
            <Text style={styles.quickActionText}>Find Tailors</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Orders')}
          >
            <Feather name="shopping-bag" size={24} color={colors.black} />
            <Text style={styles.quickActionText}>My Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Feather name="message-square" size={24} color={colors.black} />
            <Text style={styles.quickActionText}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="shopping-bag" size={40} color={colors.lightGray} />
              <Text style={styles.emptyText}>You don't have any orders yet</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Tailors')}
              >
                <Text style={styles.emptyButtonText}>Find a Tailor</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                onPress={() => handleOrderPress(order._id)}
                userRole="customer"
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

          {conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="message-circle" size={40} color={colors.lightGray} />
              <Text style={styles.emptyText}>No recent messages</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation with a tailor to discuss your order
              </Text>
            </View>
          ) : (
            conversations.slice(0, 3).map(conversation => (
              <TouchableOpacity
                key={conversation._id}
                style={styles.conversationItem}
                onPress={() => navigation.navigate('Chat', {
                  userId: conversation._id,
                  name: conversation.userInfo?.name || 'Unknown'
                })}
              >
                <View style={styles.conversationAvatar}>
                  <Feather
                    name={conversation.userInfo?.role === 'tailor' ? 'scissors' : 'user'}
                    size={24}
                    color={colors.white}
                  />
                </View>
                <View style={styles.conversationContent}>
                  <Text style={styles.conversationName}>
                    {conversation.userInfo?.name || 'Unknown'}
                    <Text style={styles.conversationRole}>
                      {' • '}{conversation.userInfo?.role || 'user'}
                    </Text>
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
        transparent
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
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Feather name="user" size={24} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.menuUserName}>{user?.name || 'User'}</Text>
                  <Text style={styles.menuUserEmail}>{user?.email || 'email@example.com'}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.menuItems}>
              {menuItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <Feather name={item.icon} size={20} color={colors.black} />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  <Feather name="chevron-right" size={16} color={colors.gray} />
                </TouchableOpacity>
              ))}
            </View>
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
    paddingBottom: 16,
    backgroundColor: colors.white
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
  menuButton: {
    padding: 8
  },
  scrollView: {
    flex: 1
  },
  bannerContainer: {
    margin: 16,
    height: 180,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  bannerSubtitle: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 16
  },
  bannerButton: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  bannerButtonText: {
    color: colors.black,
    fontWeight: '600'
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 5,
    backgroundColor: colors.white,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  quickActionText: {
    marginTop: 8,
    color: colors.black,
    fontWeight: '500'
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
    borderRadius: 8,
    marginTop: 8
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.darkGray,
    marginTop: 12,
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 16
  },
  emptyButton: {
    backgroundColor: colors.black,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '600'
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
  conversationRole: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.gray
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
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34 // Safe area padding
  },
  menuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  menuUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4
  },
  menuUserEmail: {
    fontSize: 14,
    color: colors.gray
  },
  menuItems: {
    paddingTop: 8
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
    marginLeft: 16
  }
});

export default CustomerDashboard;