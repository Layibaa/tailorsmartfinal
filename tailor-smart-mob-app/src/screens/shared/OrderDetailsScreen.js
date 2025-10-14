// ✨ UPDATED: OrderDetailsScreen.js - Added Image Display Section
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image // ✨ NEW
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import { 
  getCustomerOrderDetails, 
  getTailorOrderDetails,
  updateOrderStatus,
  confirmOrder,
  deleteOrder,
  sendMessage
} from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import { measurementLabels } from '../../utils/validation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../../services/api';

const priceSchema = Yup.object().shape({
  price: Yup.number()
    .required('Price is required')
    .min(1, 'Price must be at least 1')
    .typeError('Price must be a number')
});

const OrderDetailsScreen = ({ route, navigation }) => {
  const { orderId, actionRequired, action } = route.params || {};
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPriceModalVisible, setIsPriceModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  // ✨ NEW: Image modal states
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // ✨ END NEW
  
  const { user } = useContext(AuthContext);
  const { sendOrderNotification } = useContext(NotificationContext);

  const handleDeleteOrder = async () => {
    console.log('Delete function triggered');
    try {
      setIsUpdating(true);
      const response = await deleteOrder(orderId);
      console.log('Order deleted successfully:', response);
      
      navigation.navigate('CustomerTabs', { screen: 'Orders' });
    } catch (error) {
      console.error('Delete failed:', error.response?.data || error.message);
      Alert.alert(
        'Error',
        error.response?.data?.msg || 'Could not delete the order.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const loadOrderDetails = async () => {
    try {
      let response;
      if (user.role === 'customer') {
        response = await getCustomerOrderDetails(orderId);
      } else {
        response = await getTailorOrderDetails(orderId);
      }
      setOrder(response.order);
      
      if (actionRequired) {
        if (user.role === 'tailor' && response.order.status === 'pending') {
          if (action === 'reject') {
            handleRejectOrder();
          } else {
            setIsPriceModalVisible(true);
          }
        } else if (user.role === 'customer' && response.order.status === 'accepted') {
          setIsStatusModalVisible(true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load order details');
      console.error('Error loading order details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  // ✨ NEW: Handle Image Preview
  const openImageModal = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setIsImageModalVisible(true);
  };
  // ✨ END NEW

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending Approval',
      accepted: 'Accepted (Waiting for Confirmation)',
      rejected: 'Rejected',
      confirmed: 'Confirmed',
      making: 'In Production',
      payment_done: 'Payment Received',
      completed: 'Completed'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    return colors[status] || colors.gray;
  };

  const handleAcceptOrder = async (values) => {
    try {
      setIsUpdating(true);
      await updateOrderStatus(orderId, {
        status: 'accepted',
        price: parseFloat(values.price)
      });
      
      if (order.customer) {
        sendOrderNotification(
          order.customer._id,
          orderId,
          'accepted',
          `Your order has been accepted. The price is PKR${values.price}`
        );
      }
      
      Alert.alert('Success', 'Order accepted with price');
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to accept order');
      console.error('Error accepting order:', error);
    } finally {
      setIsUpdating(false);
      setIsPriceModalVisible(false);
    }
  };

  const handleRejectOrder = async () => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await updateOrderStatus(orderId, { status: 'rejected' });
              
              if (order.customer) {
                sendOrderNotification(
                  order.customer._id,
                  orderId,
                  'rejected',
                  'Your order has been rejected by the tailor'
                );
              }
              
              Alert.alert('Success', 'Order rejected');
              loadOrderDetails();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.msg || 'Failed to reject order');
              console.error('Error rejecting order:', error);
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleConfirmOrder = async () => {
    try {
      setIsUpdating(true);
      await confirmOrder(orderId);
      
      if (order.tailor) {
        sendOrderNotification(
          order.tailor._id,
          orderId,
          'confirmed',
          'Order confirmed. You can start working on it.'
        );
      }
      
      Alert.alert('Success', 'Order confirmed');
      setIsStatusModalVisible(false);
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to confirm order');
      console.error('Error confirming order:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setIsUpdating(true);
      await updateOrderStatus(orderId, { status: newStatus });
      
      if (order.customer) {
        const statusMessages = {
          making: 'Your order is now being made',
          payment_done: 'Payment received for your order',
          completed: 'Your order has been completed and is ready for pickup'
        };
        
        sendOrderNotification(
          order.customer._id,
          orderId,
          newStatus,
          statusMessages[newStatus] || `Order status updated to ${newStatus}`
        );
      }
      
      Alert.alert('Success', 'Order status updated');
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to update order status');
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderPriceModal = () => (
    <Modal
      visible={isPriceModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsPriceModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Set Price for Order</Text>
          
          <Formik
            initialValues={{ price: '' }}
            validationSchema={priceSchema}
            onSubmit={handleAcceptOrder}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.modalForm}>
                <Input
                  label="Enter Price (PKR)"
                  placeholder="e.g. 150"
                  value={values.price}
                  onChangeText={(text) => {
                    const numericValue = text.replace(/[^0-9.]/g, '');
                    handleChange('price')(numericValue);
                  }}
                  onBlur={handleBlur('price')}
                  keyboardType="numeric"
                  error={touched.price && errors.price}
                  iconName=""
                />
                
                <View style={styles.modalButtonsContainer}>
                  <Button
                    title="Accept Order"
                    onPress={handleSubmit}
                    loading={isUpdating}
                  />
                  <Button
                    title="Cancel"
                    onPress={() => setIsPriceModalVisible(false)}
                    outline
                    buttonStyle={styles.cancelButton}
                  />
                </View>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </Modal>
  );

  const renderStatusModal = () => (
    <Modal
      visible={isStatusModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsStatusModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Confirm Order</Text>
          <Text style={styles.modalText}>
            The tailor has accepted your order with a price of ${order?.price}. 
            Do you want to confirm this order?
          </Text>
          
          <View style={styles.modalButtonsContainer}>
            <Button
              title="Confirm Order"
              onPress={handleConfirmOrder}
              loading={isUpdating}
            />
            <Button
              title="Cancel"
              onPress={() => setIsStatusModalVisible(false)}
              outline
              buttonStyle={styles.cancelButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // ✨ NEW: Render Image Modal
  const renderImageModal = () => (
    <Modal
      visible={isImageModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setIsImageModalVisible(false)}
    >
      <View style={styles.imageModalOverlay}>
        <TouchableOpacity 
          style={styles.imageModalClose}
          onPress={() => setIsImageModalVisible(false)}
        >
          <Feather name="x" size={32} color={colors.white} />
        </TouchableOpacity>
        
        {selectedImage && (
          <>
            <Text style={styles.imageModalTitle}>{selectedImage.title}</Text>
            <Image 
              source={{ uri: selectedImage.url }}
              style={styles.imageModalContent}
              resizeMode="contain"
            />
          </>
        )}
      </View>
    </Modal>
  );
  // ✨ END NEW

  const getNextStatus = () => {
    if (!order) return null;
    
    const statusFlow = {
      confirmed: 'making',
      making: 'payment_done',
      payment_done: 'completed'
    };
    
    return statusFlow[order.status] || null;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order details..." />;
  }

  if (!order) {
    return (
      <View style={globalStyles.emptyStateContainer}>
        <Feather name="alert-circle" size={50} color={colors.error} />
        <Text style={globalStyles.emptyStateText}>Order not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => navigation.goBack()} 
          buttonStyle={styles.goBackButton}
        />
      </View>
    );
  }

  const nextStatus = getNextStatus();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Order Header with Status */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderIdText}>Order #{orderId.substring(0, 8)}</Text>
          <Text style={styles.orderDateText}>
            Placed on {formatDate(order.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      {/* Order Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Garment Type:</Text>
          <Text style={styles.infoValue}>{order.garmentType}</Text>
        </View>
        
        {order.price > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price:</Text>
            <Text style={styles.infoValue}>${order.price}</Text>
          </View>
        )}
        
        {user.role === 'customer' && order.tailor && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tailor:</Text>
            <Text style={styles.infoValue}>{order.tailor.name}</Text>
          </View>
        )}
        
        {user.role === 'tailor' && order.customer && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer:</Text>
            <Text style={styles.infoValue}>{order.customer.name}</Text>
          </View>
        )}
        
        {order.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.infoLabel}>Notes:</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}
      </View>

      {/* ✨ NEW: Design Reference Section */}
      {(order.referenceImage?.url || order.customerSketch?.url) && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Design Reference</Text>
          
          {order.referenceImage?.url && (
            <View style={styles.designReferenceItem}>
              <View style={styles.designReferenceHeader}>
                <Feather name="image" size={18} color={colors.black} />
                <Text style={styles.designReferenceLabel}>Reference Image</Text>
              </View>
              <TouchableOpacity 
                style={styles.designImageContainer}
                onPress={() => openImageModal(order.referenceImage.url, 'Reference Image')}
              >
                <Image 
                  source={{ uri: order.referenceImage.url }}
                  style={styles.designImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Feather name="maximize-2" size={24} color={colors.white} />
                  <Text style={styles.imageOverlayText}>Tap to view full size</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {order.customerSketch?.url && (
            <View style={styles.designReferenceItem}>
              <View style={styles.designReferenceHeader}>
                <Feather name="edit-3" size={18} color={colors.black} />
                <Text style={styles.designReferenceLabel}>Customer Sketch</Text>
              </View>
              <TouchableOpacity 
                style={styles.designImageContainer}
                onPress={() => openImageModal(order.customerSketch.url, 'Customer Sketch')}
              >
                <Image 
                  source={{ uri: order.customerSketch.url }}
                  style={styles.designImage}
                  resizeMode="contain"
                />
                <View style={styles.imageOverlay}>
                  <Feather name="maximize-2" size={24} color={colors.white} />
                  <Text style={styles.imageOverlayText}>Tap to view full size</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      {/* ✨ END NEW */}

      {/* Measurements Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Measurements</Text>
        
        {order.measurements && Object.keys(order.measurements).length > 0 ? (
          Object.entries(order.measurements).map(([key, value]) => (
            <View style={styles.infoRow} key={key}>
              <Text style={styles.infoLabel}>{measurementLabels[key] || key}:</Text>
              <Text style={styles.infoValue}>{value} cm</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No measurement data available</Text>
        )}
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        {/* Tailor Actions */}
        {user.role === 'tailor' && (
          <>
            {order.status === 'pending' && (
              <View style={styles.actionButtonsContainer}>
                <Button
                  title="Accept Order"
                  onPress={() => setIsPriceModalVisible(true)}
                  buttonStyle={styles.acceptButton}
                  icon="check"
                />
                <Button
                  title="Reject Order"
                  onPress={handleRejectOrder}
                  buttonStyle={styles.rejectButton}
                  danger
                  icon="x"
                />
              </View>
            )}
            
            {nextStatus && (
              <Button
                title={`Update Status to ${getStatusLabel(nextStatus)}`}
                onPress={() => handleUpdateStatus(nextStatus)}
                icon="arrow-right"
                iconPosition="right"
              />
            )}
          </>
        )}
        
        {/* Customer Actions */}
        {user.role === 'customer' && (
          <>
            {order.status === 'accepted' && (
              <Button
                title="Confirm Order"
                onPress={() => setIsStatusModalVisible(true)}
                icon="check"
              />
            )}
            {(order.status === 'pending' || order.status === 'accepted' || order.status === 'rejected') && (
              <Button
                title="Delete Order"
                onPress={handleDeleteOrder}
                danger
                icon="trash-2"
                buttonStyle={{ marginTop: 12 }}
              />
            )}
          </>
        )}

        {/* Message Action for both roles */}
        <Button
          title={`Message ${user.role === 'customer' ? 'Tailor' : 'Customer'}`}
          onPress={() => navigation.navigate('Chat', {
            userId: user.role === 'customer' ? order.tailor._id : order.customer._id,
            name: user.role === 'customer' ? order.tailor.name : order.customer.name,
            orderId: order._id
          })}
          outline
          icon="message-square"
          buttonStyle={styles.messageButton}
        />
      </View>

      {/* Modals */}
      {renderPriceModal()}
      {renderStatusModal()}
      {renderImageModal()} {/* ✨ NEW */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  contentContainer: {
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4
  },
  orderDateText: {
    fontSize: 14,
    color: colors.gray
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.gray
  },
  statusText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12
  },
  infoSection: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray,
    flex: 1
  },
  infoValue: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize'
  },
  notesContainer: {
    marginTop: 8
  },
  notesText: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 6,
    lineHeight: 20
  },
  // ✨ NEW: Design Reference Styles
  designReferenceItem: {
    marginBottom: 16
  },
  designReferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  designReferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginLeft: 8
  },
  designImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.lightGray
  },
  designImage: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageOverlayText: {
    color: colors.white,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500'
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8
  },
  imageModalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  imageModalContent: {
    width: '90%',
    height: '70%'
  },
  // ✨ END NEW
  noDataText: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 24
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  acceptButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: colors.success
  },
  rejectButton: {
    flex: 1,
    marginLeft: 8
  },
  messageButton: {
    marginTop: 12
  },
  goBackButton: {
    marginTop: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 16,
    textAlign: 'center'
  },
  modalText: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center'
  },
  modalForm: {
    width: '100%'
  },
  modalButtonsContainer: {
    marginTop: 20
  },
  cancelButton: {
    marginTop: 12
  }
});

export default OrderDetailsScreen;