import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import useApi from '../../hooks/useApi';
import { getUsers, updateUserStatus, getUserDetails, updateUser } from '../../utils/api';
import colors from '../../utils/colors';

const UserManagementScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: users, loading, error, request: fetchUsers } = useApi(getUsers);
  const { loading: statusLoading, request: changeUserStatus } = useApi(updateUserStatus);
  const { data: userDetails, loading: detailsLoading, request: fetchUserDetails } = useApi(getUserDetails);
  const { loading: updateLoading, request: requestUpdateUser } = useApi(updateUser);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (users) {
      filterUsers();
    }
  }, [users, searchQuery]);

  const loadUsers = async () => {
    await fetchUsers();
  };

  const filterUsers = () => {
    if (!users) return;
    
    const filtered = users.filter(user => {
      const searchTerm = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
      );
    });
    
    setFilteredUsers(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserPress = (user) => {
    setSelectedUser(user);
    loadUserDetails(user._id);
  };

  const loadUserDetails = async (userId) => {
    const result = await fetchUserDetails(userId);
    if (result.success) {
      setEditName(userDetails.name);
      setEditEmail(userDetails.email);
      setEditPhone(userDetails.phone || '');
      setEditRole(userDetails.role);
      setIsEditModalVisible(true);
    } else {
      Alert.alert('Error', 'Failed to load user details');
    }
  };

  const handleStatusChange = (user, newStatus) => {
    Alert.alert(
      `${newStatus === 'active' ? 'Activate' : 'Deactivate'} User`,
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            const result = await changeUserStatus(user._id, { status: newStatus });
            if (result.success) {
              Alert.alert('Success', `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
              loadUsers();
            } else {
              Alert.alert('Error', result.error || `Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} user`);
            }
          }
        },
      ]
    );
  };

  const handleUpdateUser = async () => {
    if (!editName.trim() || !editEmail.trim() || !editRole.trim()) {
      Alert.alert('Error', 'Name, email and role are required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(editEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const userData = {
      name: editName,
      email: editEmail,
      phone: editPhone,
      role: editRole,
    };

    const result = await requestUpdateUser(selectedUser._id, userData);
    
    if (result.success) {
      Alert.alert('Success', 'User updated successfully');
      setIsEditModalVisible(false);
      loadUsers();
    } else {
      Alert.alert('Error', result.error || 'Failed to update user');
    }
  };

  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard}>
      <TouchableOpacity 
        style={styles.userCardContent}
        onPress={() => handleUserPress(item)}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                <Text style={styles.roleBadgeText}>{item.role}</Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: item.status === 'active' ? colors.success : colors.error }
              ]}>
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.userActions}>
          {item.status === 'active' ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusChange(item, 'inactive')}
            >
              <Feather name="user-x" size={20} color={colors.error} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusChange(item, 'active')}
            >
              <Feather name="user-check" size={20} color={colors.success} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );

  const renderEditUserModal = () => (
    <Modal
      visible={isEditModalVisible}
      onClose={() => setIsEditModalVisible(false)}
      title="Edit User"
      footer={
        <View style={styles.modalFooter}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => setIsEditModalVisible(false)}
            style={styles.modalButton}
          />
          <Button
            title="Save"
            onPress={handleUpdateUser}
            loading={updateLoading}
            style={styles.modalButton}
          />
        </View>
      }
    >
      {detailsLoading ? (
        <Loading message="Loading user details..." />
      ) : (
        <View>
          <Input
            label="Name"
            value={editName}
            onChangeText={setEditName}
            placeholder="Enter name"
          />
          <Input
            label="Email"
            value={editEmail}
            onChangeText={setEditEmail}
            placeholder="Enter email"
            keyboardType="email-address"
          />
          <Input
            label="Phone"
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder="Enter phone (optional)"
            keyboardType="phone-pad"
          />
          
          <Text style={styles.roleLabel}>Role</Text>
          <View style={styles.roleToggle}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                editRole === 'customer' && styles.roleButtonActive,
              ]}
              onPress={() => setEditRole('customer')}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  editRole === 'customer' && styles.roleButtonTextActive,
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleButton,
                editRole === 'tailor' && styles.roleButtonActive,
              ]}
              onPress={() => setEditRole('tailor')}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  editRole === 'tailor' && styles.roleButtonTextActive,
                ]}
              >
                Tailor
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleButton,
                editRole === 'admin' && styles.roleButtonActive,
              ]}
              onPress={() => setEditRole('admin')}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  editRole === 'admin' && styles.roleButtonTextActive,
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="User Management" showBack={false} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color={colors.gray} style={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search users..."
            style={styles.searchInput}
            inputStyle={styles.searchInputText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Feather name="x" size={20} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <Loading />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load users</Text>
          <Button 
            title="Try Again" 
            onPress={loadUsers} 
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="users" size={64} color={colors.lightGray} />
              <Text style={styles.emptyTitle}>No Users Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? "Try a different search term" : "No users available"}
              </Text>
            </View>
          }
        />
      )}
      
      {renderEditUserModal()}
    </SafeAreaView>
  );
};

// Helper functions
const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getRoleColor = (role) => {
  switch(role) {
    case 'admin':
      return '#D4AF37'; // Gold
    case 'tailor':
      return colors.primary; // Pastel blue
    case 'customer':
      return colors.gray;
    default:
      return colors.gray;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 40,
    padding: 0,
    margin: 0,
  },
  searchInputText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  userCard: {
    marginBottom: 12,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.black,
  },
  userEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  roleBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.white,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.white,
    textTransform: 'capitalize',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  roleLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    marginBottom: 8,
    color: colors.black,
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.gray,
  },
  roleButtonTextActive: {
    color: colors.white,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 8,
    minWidth: 100,
  },
});

export default UserManagementScreen;