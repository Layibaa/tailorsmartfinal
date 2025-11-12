// OrderDetailsScreen.js - COMPLETE FIX
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import { 
  getCustomerOrderDetails, 
  getTailorOrderDetails,
  updateOrderStatus,
  confirmOrder,
  requestPriceNegotiation,
  updateOrderPrice
} from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import colors from '../../styles/colors';
import { measurementLabels } from '../../utils/validation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [isPriceEditModalVisible, setIsPriceEditModalVisible] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const { user } = useContext(AuthContext);
  const { sendOrderNotification } = useContext(NotificationContext);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setIsLoading(true);
      let response;
      if (user.role === 'customer') {
        response = await getCustomerOrderDetails(orderId);
      } else {
        response = await getTailorOrderDetails(orderId);
      }
      
      setOrder(response.order);
      setNewPrice(response.order.price?.toString() || '');
      
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
      console.error('❌ Load order error:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNegotiatePrice = async () => {
    try {
      setIsUpdating(true);
      setIsStatusModalVisible(false);
      
      await requestPriceNegotiation(orderId);
      
      Alert.alert(
        'Negotiation Requested',
        'Your price negotiation request has been sent to the tailor. You\'ll be redirected to chat to discuss the price.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Chat', {
                userId: order.tailor._id,
                name: order.tailor.name,
                orderId: order._id
              });
            }
          }
        ]
      );
      
      loadOrderDetails();
    } catch (error) {
      console.error('❌ Negotiate price error:', error);
      Alert.alert('Error', error.response?.data?.msg || 'Failed to request price negotiation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePrice = async () => {
    const priceValue = parseFloat(newPrice);
    
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price');
      return;
    }

    if (priceValue === order.price) {
      Alert.alert('Same Price', 'Please enter a different price');
      return;
    }

    Alert.alert(
      'Update Price',
      `Change price from PKR ${order.price} to PKR ${priceValue}?\n\n⚠️ This can only be done once.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              setIsUpdating(true);
              await updateOrderPrice(orderId, priceValue);
              
              Alert.alert(
                'Price Updated!',
                'The customer has been notified about the new price.',
                [{ text: 'OK', onPress: () => {
                  setIsPriceEditModalVisible(false);
                  loadOrderDetails();
                }}]
              );
            } catch (error) {
              console.error('❌ Update price error:', error);
              
              if (error.response?.data?.alreadyChanged) {
                Alert.alert('Cannot Update', 'Price has already been changed and cannot be modified again');
              } else {
                Alert.alert('Error', error.response?.data?.msg || 'Failed to update price');
              }
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
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
          `Your order has been accepted. The price is PKR ${values.price}`
        );
      }
      
      Alert.alert('Success', 'Order accepted. Customer can now review and confirm.');
      setIsPriceModalVisible(false);
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to accept order');
    } finally {
      setIsUpdating(false);
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
              Alert.alert('Order Rejected', 'The order has been rejected.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to reject order');
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
          'Order confirmed. Production can begin.'
        );
      }
      
      Alert.alert('Order Confirmed! ✓', 'The tailor will begin production.');
      setIsStatusModalVisible(false);
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to confirm order');
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ FIXED: Status update with proper error handling
  const handleUpdateStatus = async (newStatus, statusLabel) => {
    const confirmMessages = {
      making: 'Start production on this order?',
      payment_done: 'Confirm that payment has been received?',
      completed: 'Mark this order as completed and ready for pickup?'
    };

    const successMessages = {
      making: 'Production started! ✓',
      payment_done: 'Payment confirmed! ✓',
      completed: 'Order completed! 🎉'
    };

    const notificationMessages = {
      making: 'Your order is now being made',
      payment_done: 'Payment received for your order',
      completed: '🎉 Your order is completed and ready for pickup!'
    };

    Alert.alert(
      'Update Status',
      confirmMessages[newStatus] || `Update status to ${statusLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsUpdating(true);
              
              console.log('🔄 Updating order status:', { orderId, newStatus });
              
              // Call API with proper payload
              const response = await updateOrderStatus(orderId, { status: newStatus });
              
              console.log('✅ Status updated successfully:', response);
              
              // Send notification to customer
              if (order.customer) {
                sendOrderNotification(
                  order.customer._id,
                  orderId,
                  newStatus,
                  notificationMessages[newStatus]
                );
              }
              
              // Show success message
              Alert.alert('Success', successMessages[newStatus] || 'Order status updated', [
                {
                  text: 'OK',
                  onPress: async () => {
                    // Reload order details to show next button
                    await loadOrderDetails();
                  }
                }
              ]);
              
            } catch (error) {
              console.error('❌ Update status error:', error);
              console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
              });
              
              Alert.alert(
                'Error', 
                error.response?.data?.msg || error.message || 'Failed to update status'
              );
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      confirmed: 'Confirmed',
      making: 'In Production',
      payment_done: 'Payment Received',
      completed: 'Completed'
    };
    return labels[status] || status;
  };

  // ✅ FIXED: Render correct button based on status
  const renderTailorActionButton = () => {
    if (!order || user.role !== 'tailor') return null;

    console.log('🎯 Rendering button for status:', order.status);

    switch (order.status) {
      case 'pending':
        return (
          <View style={styles.buttonRow}>
            <Button
              title="Accept Order"
              onPress={() => setIsPriceModalVisible(true)}
              buttonStyle={styles.actionButton}
              disabled={isUpdating}
            />
            <Button
              title="Reject"
              onPress={handleRejectOrder}
              danger
              buttonStyle={styles.actionButton}
              disabled={isUpdating}
            />
          </View>
        );

      case 'confirmed':
        return (
          <Button
            title="🚀 Start Production"
            onPress={() => handleUpdateStatus('making', 'In Production')}
            disabled={isUpdating}
            loading={isUpdating}
          />
        );

      case 'making':
        return (
          <Button
            title="💰 Mark Payment Done"
            onPress={() => handleUpdateStatus('payment_done', 'Payment Done')}
            disabled={isUpdating}
            loading={isUpdating}
          />
        );

      case 'payment_done':
        return (
          <Button
            title="✅ Mark as Completed"
            onPress={() => handleUpdateStatus('completed', 'Completed')}
            disabled={isUpdating}
            loading={isUpdating}
          />
        );

      case 'accepted':
        return (
          <View style={styles.waitingContainer}>
            <Feather name="clock" size={20} color={colors.warning} />
            <Text style={styles.waitingText}>
              ⏳ Waiting for customer confirmation
            </Text>
          </View>
        );

      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={styles.completedText}>
              ✅ Order completed
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order details..." />;
  }

  if (!order) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="alert-circle" size={50} color={colors.error} />
        <Text style={styles.emptyText}>Order not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderIdText}>Order #{orderId.substring(0, 8)}</Text>
          <Text style={styles.orderDateText}>
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors[order.status] || colors.gray }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      {/* Price Negotiation Status Banners */}
      {order.priceNegotiationRequested && !order.priceChangedByTailor && (
        <View style={styles.negotiationBanner}>
          <Feather name="message-circle" size={20} color={colors.warning} />
          <Text style={styles.negotiationText}>
            💬 Price negotiation in progress. {user.role === 'tailor' ? 'Update the price when ready.' : 'Waiting for tailor response.'}
          </Text>
        </View>
      )}

      {order.priceChangedByTailor && (
        <View style={styles.priceChangedBanner}>
          <Feather name="check-circle" size={20} color={colors.success} />
          <Text style={styles.priceChangedText}>
            ✅ Price updated from PKR {order.originalPrice} to PKR {order.price}
          </Text>
        </View>
      )}

      {/* Order Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        
        {order.price > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price:</Text>
            <View style={styles.priceContainer}>
              <Text style={[styles.infoValue, styles.priceText]}>PKR {order.price}</Text>
              {order.priceChangedByTailor && order.originalPrice && (
                <Text style={styles.originalPrice}>
                  (was PKR {order.originalPrice})
                </Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Suit Type:</Text>
          <Text style={styles.infoValue}>{order.suitType}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Shalwar Style:</Text>
          <Text style={styles.infoValue}>{order.shalwarStyle}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kameez Style:</Text>
          <Text style={styles.infoValue}>{order.kameezStyle}</Text>
        </View>

        {user.role === 'tailor' && 
         order.status === 'accepted' && 
         order.priceNegotiationRequested && 
         !order.priceChangedByTailor && (
          <TouchableOpacity 
            style={styles.editPriceButton}
            onPress={() => setIsPriceEditModalVisible(true)}
          >
            <Feather name="edit-2" size={16} color={colors.white} />
            <Text style={styles.editPriceButtonText}>Update Price (One-Time)</Text>
          </TouchableOpacity>
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
      </View>

      {/* Notes Section */}
      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Order Notes</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      {/* Dupatta Details Section */}
      {order.suitType === '3-piece' && order.dupattaDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧣 Dupatta Details</Text>
          <View style={styles.dupattaDetailsContainer}>
            <View style={styles.dupattaDetailRow}>
              <Text style={styles.dupattaLabel}>Length:</Text>
              <Text style={styles.dupattaValue}>{order.dupattaDetails.length} cm</Text>
            </View>
            <View style={styles.dupattaDetailRow}>
              <Text style={styles.dupattaLabel}>Width:</Text>
              <Text style={styles.dupattaValue}>{order.dupattaDetails.width} cm</Text>
            </View>
            <View style={styles.dupattaDetailRow}>
              <Text style={styles.dupattaLabel}>Peco Decoration:</Text>
              <View style={styles.pecoStatusContainer}>
                {order.dupattaDetails.hasPeco ? (
                  <>
                    <Feather name="check-circle" size={16} color={colors.success} />
                    <Text style={[styles.dupattaValue, { color: colors.success, marginLeft: 6 }]}>Yes</Text>
                  </>
                ) : (
                  <>
                    <Feather name="x-circle" size={16} color={colors.gray} />
                    <Text style={[styles.dupattaValue, { color: colors.gray, marginLeft: 6 }]}>No</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Design References Section */}
      {(order.referenceImage?.url || order.customerSketch?.url) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🖼️ Design Reference</Text>
          {order.referenceImage?.url && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Reference Image:</Text>
              <TouchableOpacity onPress={() => {
                setSelectedImage({ url: order.referenceImage.url, title: 'Reference Image' });
                setIsImageModalVisible(true);
              }}>
                <Image source={{ uri: order.referenceImage.url }} style={styles.imagePreview} />
              </TouchableOpacity>
            </View>
          )}
          {order.customerSketch?.url && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Customer Sketch:</Text>
              <TouchableOpacity onPress={() => {
                setSelectedImage({ url: order.customerSketch.url, title: 'Customer Sketch' });
                setIsImageModalVisible(true);
              }}>
                <Image source={{ uri: order.customerSketch.url }} style={styles.imagePreview} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Measurements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📏 Measurements</Text>
        
        <View style={styles.measurementGroup}>
          <Text style={styles.measurementGroupTitle}>👔 Kameez</Text>
          <View style={styles.measurementsGrid}>
            {['chest', 'shoulder', 'sleeveLength', 'neck', 'kameezLength'].map(key => (
              order.measurements[key] && (
                <View style={styles.measurementCard} key={key}>
                  <Text style={styles.measurementLabel}>{measurementLabels[key]}</Text>
                  <Text style={styles.measurementValue}>
                    {order.measurements[key]} <Text style={styles.unitText}>cm</Text>
                  </Text>
                </View>
              )
            ))}
          </View>
        </View>

        <View style={styles.measurementGroup}>
          <Text style={styles.measurementGroupTitle}>👖 Shalwar</Text>
          <View style={styles.measurementsGrid}>
            {['waist', 'hip', 'inseam', 'outseam', 'thigh'].map(key => (
              order.measurements[key] && (
                <View style={styles.measurementCard} key={key}>
                  <Text style={styles.measurementLabel}>{measurementLabels[key]}</Text>
                  <Text style={styles.measurementValue}>
                    {order.measurements[key]} <Text style={styles.unitText}>cm</Text>
                  </Text>
                </View>
              )
            ))}
          </View>
        </View>
      </View>

      {/* ✅ FIXED: Actions Section */}
      <View style={styles.actionsSection}>
        {/* Tailor actions */}
        {renderTailorActionButton()}
        
        {/* Customer actions */}
        {user.role === 'customer' && order.status === 'accepted' && (
          <Button
            title="✓ Confirm Order"
            onPress={() => setIsStatusModalVisible(true)}
            disabled={isUpdating}
          />
        )}

        {/* Message button for both roles */}
        <Button
          title={`💬 Message ${user.role === 'customer' ? 'Tailor' : 'Customer'}`}
          onPress={() => navigation.navigate('Chat', {
            userId: user.role === 'customer' ? order.tailor._id : order.customer._id,
            name: user.role === 'customer' ? order.tailor.name : order.customer.name,
            orderId: order._id
          })}
          outline
          buttonStyle={{ marginTop: 12 }}
          disabled={isUpdating}
        />
      </View>

      {/* Modals */}
      <Modal visible={isPriceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Price for Order</Text>
            <Text style={styles.modalSubtitle}>
              Enter the price for this {order.suitType} order
            </Text>
            <Formik
              initialValues={{ price: '' }}
              validationSchema={priceSchema}
              onSubmit={handleAcceptOrder}
            >
              {({ handleChange, handleSubmit, values, errors, touched }) => (
                <View>
                  <Input
                    label="Enter Price (PKR)"
                    value={values.price}
                    onChangeText={handleChange('price')}
                    keyboardType="numeric"
                    error={touched.price && errors.price}
                    placeholder="e.g., 2500"
                    iconName="dollar-sign"
                  />
                  <Button 
                    title="Accept Order" 
                    onPress={handleSubmit}
                    loading={isUpdating}
                    disabled={isUpdating}
                  />
                  <Button 
                    title="Cancel" 
                    onPress={() => setIsPriceModalVisible(false)} 
                    outline 
                    buttonStyle={{ marginTop: 12 }}
                    disabled={isUpdating}
                  />
                </View>
              )}
            </Formik>
          </View>
        </View>
      </Modal>

      <Modal visible={isStatusModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Order</Text>
            <Text style={styles.modalPrice}>PKR {order?.price}</Text>
            
            {order?.priceChangedByTailor && order?.originalPrice && (
              <View style={styles.priceComparisonContainer}>
                <Text style={styles.priceComparisonText}>
                  Original: PKR {order.originalPrice}
                </Text>
                <Feather name="arrow-right" size={16} color={colors.gray} />
                <Text style={styles.priceComparisonText}>
                  Updated: PKR {order.price}
                </Text>
              </View>
            )}

            <Text style={styles.modalDescription}>
              Review the price and confirm to proceed with the order.
            </Text>

            <Button 
              title="✓ Confirm Order" 
              onPress={handleConfirmOrder}
              loading={isUpdating}
              disabled={isUpdating}
            />

            {!order?.priceChangedByTailor && (
              <Button 
                title="💬 Negotiate Price" 
                onPress={handleNegotiatePrice}
                outline
                buttonStyle={{ 
                  marginTop: 12, 
                  backgroundColor: colors.warning,
                  borderColor: colors.warning 
                }}
                textStyle={{ color: colors.white }}
                disabled={isUpdating}
              />
            )}

            <Button 
              title="Cancel" 
              onPress={() => setIsStatusModalVisible(false)} 
              outline 
              buttonStyle={{ marginTop: 12 }}
              disabled={isUpdating}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={isPriceEditModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Price</Text>
            
            <View style={styles.priceInfoContainer}>
              <Text style={styles.priceInfoLabel}>Current Price:</Text>
              <Text style={styles.priceInfoValue}>PKR {order?.price}</Text>
            </View>

            <Text style={styles.warningText}>
              ⚠️ You can only change the price once. Make sure it's correct!
            </Text>

            <Input
              label="New Price (PKR)"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
              placeholder="Enter new price"
              iconName="dollar-sign"
            />

            <Button 
              title="Update Price" 
              onPress={handleUpdatePrice}
              loading={isUpdating}
              disabled={isUpdating}
            />

            <Button 
              title="Cancel" 
              onPress={() => {
                setNewPrice(order?.price?.toString() || '');
                setIsPriceEditModalVisible(false);
              }} 
              outline 
              buttonStyle={{ marginTop: 12 }}
              disabled={isUpdating}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={isImageModalVisible} transparent animationType="fade">
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

      <View style={styles.bottomSpacing} />
    </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black
  },
  orderDateText: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'capitalize'
  },
  negotiationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8
  },
  negotiationText: {
    flex: 1,
    fontSize: 13,
    color: colors.darkGray,
    lineHeight: 18
  },
  priceChangedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    gap: 8
  },
  priceChangedText: {
    flex: 1,
    fontSize: 13,
    color: colors.success,
    fontWeight: '500',
    lineHeight: 18
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray
  },
  infoValue: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success
  },
  originalPrice: {
    fontSize: 12,
    color: colors.gray,
    textDecorationLine: 'line-through',
    marginTop: 2
  },
  editPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8
  },
  editPriceButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14
  },
  notesText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20
  },
  dupattaDetailsContainer: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 8
  },
  dupattaDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.white
  },
  dupattaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black
  },
  dupattaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black
  },
  pecoStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  imageContainer: {
    marginBottom: 16
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  measurementGroup: {
    marginBottom: 20
  },
  measurementGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  measurementCard: {
    width: '47%',
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 12
  },
  measurementLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 6
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  unitText: {
    fontSize: 14,
    color: colors.gray
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 32
  },
  actionButton: {
    flex: 1
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '20',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12
  },
  waitingText: {
    fontSize: 14,
    color: colors.darkGray,
    fontWeight: '500'
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12
  },
  completedText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8,
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
    textAlign: 'center'
  },
  modalPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
    marginVertical: 12
  },
  priceComparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12
  },
  priceComparisonText: {
    fontSize: 12,
    color: colors.gray
  },
  modalDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 22,
    marginBottom: 20,
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    textAlign: 'center'
  },
  priceInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  priceInfoLabel: {
    fontSize: 14,
    color: colors.gray
  },
  priceInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black
  },
  warningText: {
    fontSize: 13,
    color: colors.warning,
    backgroundColor: colors.warning + '20',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center'
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
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9
  },
  bottomSpacing: {
    height: 40
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginTop: 16,
    marginBottom: 24
  }
});

export default OrderDetailsScreen;