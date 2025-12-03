// OrderDetailsScreen.js - WEB COMPATIBLE VERSION WITH NEGOTIATION
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
  ActivityIndicator,
  Platform,
  TextInput
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup'; 
import { 
  getCustomerOrderDetails, 
  getTailorOrderDetails,
  updateOrderStatus,
  confirmOrder
} from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import colors from '../../styles/colors';
import { measurementLabels } from '../../utils/validation';
import CollaborativeOrderEditor from '../../components/orders/CollaborativeOrderEditor';
import { Feather, Send } from '@expo/vector-icons';
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
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isStatusUpdateModalVisible, setIsStatusUpdateModalVisible] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [localOrder, setLocalOrder] = useState(null);

// Find this section with other useState declarations and add these:
const [showNegotiatePopup, setShowNegotiatePopup] = useState(false);
const [showChatWithTailor, setShowChatWithTailor] = useState(false);
const [negotiationMessages, setNegotiationMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [tailorProposedPrice, setTailorProposedPrice] = useState(null);
const [showPriceUpdatePopup, setShowPriceUpdatePopup] = useState(false);
const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Negotiation state
  const [negotiationState, setNegotiationState] = useState({
    isNegotiating: false,
    customerRequestedNegotiation: false,
    tailorUpdatedPrice: false,
    newPrice: null,
    priceUpdateCount: 0
  });
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showPriceUpdateModal, setShowPriceUpdateModal] = useState(false);
  const [tempNewPrice, setTempNewPrice] = useState('');

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
      
      console.log('📦 Order loaded:', response.order);
      setOrder(response.order);
      setLocalOrder(response.order);
      
      if (actionRequired) {
        if (user.role === 'tailor' && response.order.status === 'pending') {
          if (action === 'reject') {
            handleRejectOrder();
          } else {
            setIsPriceModalVisible(true);
          }
        } else if (user.role === 'customer' && response.order.status === 'accepted') {
          setShowNegotiationModal(true);
        }
      }
    } catch (error) {
      console.error('❌ Load order error:', error);
      if (Platform.OS === 'web') {
        alert('Failed to load order details');
      } else {
        Alert.alert('Error', 'Failed to load order details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNegotiatePrice = () => {
    console.log('💬 Customer wants to negotiate');
    setNegotiationState(prev => ({
      ...prev,
      isNegotiating: true,
      customerRequestedNegotiation: true
    }));
    setShowNegotiationModal(false);
    
    navigation.navigate('Chat', {
      userId: order.tailor._id,
      name: order.tailor.name,
      orderId: order._id
    });
  };

  const handleTailorUpdatePrice = () => {
    if (!tempNewPrice || isNaN(tempNewPrice) || parseFloat(tempNewPrice) <= 0) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid price');
      } else {
        Alert.alert('Invalid Price', 'Please enter a valid price');
      }
      return;
    }

    const newPrice = parseFloat(tempNewPrice);
    console.log('💰 Tailor updating price to:', newPrice);
    
    setNegotiationState(prev => ({
      ...prev,
      tailorUpdatedPrice: true,
      newPrice: newPrice,
      priceUpdateCount: prev.priceUpdateCount + 1,
      customerRequestedNegotiation: false
    }));
    
    setOrder(prev => ({
      ...prev,
      price: newPrice
    }));
    
    setShowPriceUpdateModal(false);
    setTempNewPrice('');
    
    if (Platform.OS === 'web') {
      alert('Price updated. Customer will be notified.');
    } else {
      Alert.alert('Success', 'Price updated. Customer will be notified.');
    }
  };

  const handleConfirmNegotiatedOrder = async () => {
    try {
      setIsUpdating(true);
      await confirmOrder(orderId);
      
      if (order.tailor) {
        sendOrderNotification(
          order.tailor._id,
          orderId,
          'confirmed',
          'Order confirmed with negotiated price. Production can begin.'
        );
      }
      
      setNegotiationState({
        isNegotiating: false,
        customerRequestedNegotiation: false,
        tailorUpdatedPrice: false,
        newPrice: null,
        priceUpdateCount: 0
      });
      
      if (Platform.OS === 'web') {
        alert('Order Confirmed! ✓ The tailor will begin production.');
      } else {
        Alert.alert('Order Confirmed! ✓', 'The tailor will begin production.');
      }
      
      loadOrderDetails();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert(error.response?.data?.msg || 'Failed to confirm order');
      } else {
        Alert.alert('Error', error.response?.data?.msg || 'Failed to confirm order');
      }
    } finally {
      setIsUpdating(false);
    }
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
      
      if (Platform.OS === 'web') {
        alert('Order accepted. Customer can now review and confirm.');
      } else {
        Alert.alert('Success', 'Order accepted. Customer can now review and confirm.');
      }
      setIsPriceModalVisible(false);
      loadOrderDetails();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert(error.response?.data?.msg || 'Failed to accept order');
      } else {
        Alert.alert('Error', error.response?.data?.msg || 'Failed to accept order');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectOrder = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to reject this order?')) {
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
          
          alert('The order has been rejected.');
          navigation.goBack();
        } catch (error) {
          alert('Failed to reject order');
        } finally {
          setIsUpdating(false);
        }
      }
    } else {
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
    }
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
      
      if (Platform.OS === 'web') {
        alert('Order Confirmed! ✓ The tailor will begin production.');
      } else {
        Alert.alert('Order Confirmed! ✓', 'The tailor will begin production.');
      }
      setIsStatusModalVisible(false);
      loadOrderDetails();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert(error.response?.data?.msg || 'Failed to confirm order');
      } else {
        Alert.alert('Error', error.response?.data?.msg || 'Failed to confirm order');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    console.log('🔄 Setting up status update for:', newStatus);
    setPendingStatusUpdate(newStatus);
    setIsStatusUpdateModalVisible(true);
  };

  const handleSaveChanges = (editedOrder) => {
    console.log('💾 Saving changes:', editedOrder);
    setLocalOrder(editedOrder);
    setOrder(editedOrder);
  };

  const handleRequestChanges = (editedOrder, note) => {
    console.log('📤 Requesting changes:', note);
    setLocalOrder(editedOrder);
    setOrder(editedOrder);
  };

  const handleApproveChanges = (editedOrder) => {
    console.log('✅ Approving changes');
    setLocalOrder(editedOrder);
    setOrder(editedOrder);
  };

  const handleLockOrder = (editedOrder) => {
    console.log('🔒 Locking order');
    setLocalOrder(editedOrder);
    setOrder(editedOrder);
  };

const startNegotiation = () => {
  setShowNegotiatePopup(false);
  setShowChatWithTailor(true);
  setNegotiationMessages([
    {
      id: 1,
      sender: 'system',
      message: 'You can now discuss the price with your tailor',
      timestamp: new Date().toISOString()
    }
  ]);
};

const handleSendMessage = () => {
  if (newMessage.trim()) {
    const newMsg = {
      id: negotiationMessages.length + 1,
      sender: 'customer',
      message: newMessage,
      timestamp: new Date().toISOString()
    };
    setNegotiationMessages([...negotiationMessages, newMsg]);
    setNewMessage('');
    
    // Simulate tailor response after 2 seconds
    setTimeout(() => {
      const tailorMsg = {
        id: negotiationMessages.length + 2,
        sender: 'tailor',
        message: 'Thank you for your message. Let me review your request.',
        timestamp: new Date().toISOString()
      };
      setNegotiationMessages(prev => [...prev, tailorMsg]);
    }, 2000);
  }
};

// Simulate tailor updating price (for UI demo)
const simulateTailorPriceUpdate = () => {
  const newPrice = 4500; // Example new price
  setTailorProposedPrice(newPrice);
  setShowPriceUpdatePopup(true);
  
  const priceUpdateMsg = {
    id: negotiationMessages.length + 1,
    sender: 'tailor',
    message: `I've updated the price to PKR ${newPrice}. Please review.`,
    timestamp: new Date().toISOString()
  };
  setNegotiationMessages(prev => [...prev, priceUpdateMsg]);
};

const acceptNewPrice = () => {
  setOrder({ ...order, totalAmount: tailorProposedPrice });
  setShowPriceUpdatePopup(false);
  setShowChatWithTailor(false);
  setShowSuccessPopup(true);
};

const rejectNewPrice = () => {
  setShowPriceUpdatePopup(false);
  const rejectMsg = {
    id: negotiationMessages.length + 1,
    sender: 'customer',
    message: 'I would like to discuss the price further.',
    timestamp: new Date().toISOString()
  };
  setNegotiationMessages(prev => [...prev, rejectMsg]);
};

  const confirmStatusUpdate = async () => {
    if (!pendingStatusUpdate) return;

    const successMessages = {
      making: 'Production started!',
      payment_done: 'Payment confirmed!',
      completed: 'Order completed!'
    };

    const notificationMessages = {
      making: 'Your order is now being made',
      payment_done: 'Payment received for your order',
      completed: 'Your order is completed and ready for pickup!'
    };

    try {
      setIsUpdating(true);
      
      console.log('🔄 Updating order status to:', pendingStatusUpdate);
      
      const response = await updateOrderStatus(orderId, { 
        status: pendingStatusUpdate 
      });
      
      console.log('✅ Status updated successfully:', response);
      
      if (order.customer) {
        sendOrderNotification(
          order.customer._id,
          orderId,
          pendingStatusUpdate,
          notificationMessages[pendingStatusUpdate]
        );
      }
      
      setIsStatusUpdateModalVisible(false);
      setPendingStatusUpdate(null);
      
      await loadOrderDetails();
      
      if (Platform.OS === 'web') {
        alert(successMessages[pendingStatusUpdate]);
      } else {
        Alert.alert('Success', successMessages[pendingStatusUpdate]);
      }
      
    } catch (error) {
      console.error('❌ Update status error:', error);
      console.error('Error response:', error.response?.data);
      
      setIsStatusUpdateModalVisible(false);
      setPendingStatusUpdate(null);
      
      if (Platform.OS === 'web') {
        alert(error.response?.data?.msg || error.message || 'Failed to update status');
      } else {
        Alert.alert('Error', error.response?.data?.msg || error.message || 'Failed to update status');
      }
    } finally {
      setIsUpdating(false);
    }
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

  const renderTailorActionButton = () => {
    if (!order || user.role !== 'tailor') return null;

    console.log('🎯 Rendering action button for status:', order.status);

    switch (order.status) {
      case 'pending':
        return (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => {
                console.log('Accept Order pressed');
                setIsPriceModalVisible(true);
              }}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Accept Order</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => {
                console.log('Reject pressed');
                handleRejectOrder();
              }}
              disabled={isUpdating}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        );

      case 'confirmed':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              console.log('🚀 Start Production button pressed');
              handleUpdateStatus('making');
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Start Production</Text>
            )}
          </TouchableOpacity>
        );

      case 'making':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              console.log('💰 Mark Payment Done button pressed');
              handleUpdateStatus('payment_done');
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Mark Payment Done</Text>
            )}
          </TouchableOpacity>
        );

      case 'payment_done':
        return (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              console.log('✔️ Mark as Completed button pressed');
              handleUpdateStatus('completed');
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Mark as Completed</Text>
            )}
          </TouchableOpacity>
        );

      case 'accepted':
  return (
    <View>
      <View style={styles.waitingContainer}>
        <Feather name="clock" size={20} color={colors.warning} />
        <Text style={styles.waitingText}>
          Waiting for customer confirmation
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editPriceButton}
        onPress={() => {
          setTempNewPrice(order.price.toString());
          setShowPriceUpdateModal(true);
        }}
        disabled={isUpdating}
      >
        <Feather name="edit-2" size={18} color={colors.primary} />
        <Text style={styles.editPriceButtonText}>Edit Price</Text>
      </TouchableOpacity>
    </View>
  );

      case 'completed':
        return (
          <View style={styles.completedContainer}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={styles.completedText}>
              Order completed
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        
        {order.price > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price:</Text>
            <Text style={[styles.infoValue, styles.priceText]}>PKR {order.price}</Text>
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

      {order.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Notes</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}

      {order.suitType === '3-piece' && order.dupattaDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dupatta Details</Text>
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

      {(order.referenceImage?.url || order.customerSketch?.url) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Reference</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Measurements</Text>
        
        <View style={styles.measurementGroup}>
          <Text style={styles.measurementGroupTitle}>Kameez</Text>
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
          <Text style={styles.measurementGroupTitle}>Shalwar</Text>
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

      <View style={styles.actionsSection}>
        {renderTailorActionButton()}

        {user.role === 'tailor' && 
         order.status === 'accepted' && 
         negotiationState.customerRequestedNegotiation && 
         negotiationState.priceUpdateCount === 0 && (
          <View style={styles.negotiationBanner}>
            <View style={styles.negotiationBannerContent}>
              <Feather name="message-circle" size={20} color={colors.warning} />
              <Text style={styles.negotiationBannerText}>
                Customer wants to negotiate price
              </Text>
            </View>
            <TouchableOpacity
              style={styles.updatePriceButton}
              onPress={() => {
                setTempNewPrice(order.price.toString());
                setShowPriceUpdateModal(true);
              }}
            >
              <Text style={styles.updatePriceButtonText}>Update Price</Text>
            </TouchableOpacity>
          </View>
        )}
        
      {user.role === 'customer' && order.status === 'accepted' && (
  <>
    {negotiationState.tailorUpdatedPrice ? (
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleConfirmNegotiatedOrder}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>
            Confirm Order (PKR {negotiationState.newPrice})
          </Text>
        )}
      </TouchableOpacity>
    ) : (
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.warning }]}
          onPress={() => setShowNegotiatePopup(true)}
          disabled={isUpdating}
        >
          <Text style={styles.actionButtonText}>Negotiate Price</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => setShowNegotiationModal(true)}
          disabled={isUpdating}
        >
          <Text style={styles.actionButtonText}>Confirm Order</Text>
        </TouchableOpacity>
      </View>
    )}
  </>
)}

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('Chat', {
            userId: user.role === 'customer' ? order.tailor._id : order.customer._id,
            name: user.role === 'customer' ? order.tailor.name : order.customer.name,
            orderId: order._id
          })}
          disabled={isUpdating}
        >
          <Text style={styles.outlineButtonText}>
            Message {user.role === 'customer' ? 'Tailor' : 'Customer'}
          </Text>
        </TouchableOpacity>

        {!order.isLocked && ['confirmed', 'making'].includes(order.status) && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditorVisible(true)}
            disabled={isUpdating}
          >
            <Feather name="edit-3" size={18} color={colors.primary} />
            <Text style={styles.editButtonText}>Edit Order</Text>
          </TouchableOpacity>
        )}
      </View>

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
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={handleSubmit}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Accept Order</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.outlineButton, { marginTop: 12 }]}
                    onPress={() => setIsPriceModalVisible(false)}
                    disabled={isUpdating}
                  >
                    <Text style={styles.outlineButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>
        </View>
      </Modal>

  <Modal visible={showNegotiationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Order Price</Text>
            <Text style={styles.modalPrice}>PKR {order?.price}</Text>
            
            <Text style={styles.modalDescription}>
              Would you like to confirm this price or negotiate with the tailor?
            </Text>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => {
                setShowNegotiationModal(false);
                setIsStatusModalVisible(true);
              }}
              disabled={isUpdating}
            >
              <Text style={styles.primaryButtonText}>Confirm Price</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.outlineButton, { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
              onPress={handleNegotiatePrice}
              disabled={isUpdating}
            >
              <Feather name="message-circle" size={18} color={colors.primary} />
              <Text style={[styles.outlineButtonText, { marginLeft: 8 }]}>
                Negotiate Price
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.textButton, { marginTop: 12 }]}
              onPress={() => setShowNegotiationModal(false)}
            >
              <Text style={styles.textButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

  <Modal visible={showPriceUpdateModal} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Update Price</Text>
        <Text style={styles.modalSubtitle}>
          Enter new price for this order
        </Text>

        <View style={styles.priceInputContainer}>
          <Text style={styles.priceInputLabel}>New Price (PKR)</Text>
          <TextInput
            style={styles.priceInput}
            value={tempNewPrice}
            onChangeText={setTempNewPrice}
            keyboardType="numeric"
            placeholder="e.g., 2500"
          />
        </View>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleTailorUpdatePrice}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Update Price</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.outlineButton, { marginTop: 12 }]}
          onPress={() => {
            setShowPriceUpdateModal(false);
            setTempNewPrice('');
          }}
        >
          <Text style={styles.outlineButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>

  <Modal visible={isStatusModalVisible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Confirm Order</Text>
        <Text style={styles.modalPrice}>PKR {order?.price}</Text>
        
        <Text style={styles.modalDescription}>
          By confirming, you accept the price and the tailor will begin production.
        </Text>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleConfirmOrder}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Confirm Order</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.outlineButton, { marginTop: 12 }]}
          onPress={() => setIsStatusModalVisible(false)}
          disabled={isUpdating}
        >
          <Text style={styles.outlineButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>

  <Modal visible={isStatusUpdateModalVisible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Update Order Status</Text>
        <Text style={styles.modalDescription}>
          {pendingStatusUpdate === 'making' && 'Start production on this order?'}
          {pendingStatusUpdate === 'payment_done' && 'Confirm that payment has been received?'}
          {pendingStatusUpdate === 'completed' && 'Mark this order as completed and ready for pickup?'}
        </Text>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={confirmStatusUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Confirm</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.outlineButton, { marginTop: 12 }]}
          onPress={() => {
            setIsStatusUpdateModalVisible(false);
            setPendingStatusUpdate(null);
          }}
          disabled={isUpdating}
        >
          <Text style={styles.outlineButtonText}>Cancel</Text>
        </TouchableOpacity>
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

  <Modal
    visible={isEditorVisible}
    animationType="slide"
    onRequestClose={() => setIsEditorVisible(false)}
  >
    <View style={{ flex: 1, paddingTop: 40 }}>
      <CollaborativeOrderEditor
        order={localOrder || order}
        userRole={user.role}
        onSaveChanges={handleSaveChanges}
        onRequestChanges={handleRequestChanges}
        onApproveChanges={handleApproveChanges}
        onLockOrder={handleLockOrder}
        onClose={() => setIsEditorVisible(false)}
      />
    </View>
  </Modal>
{/* Add these three modals right before </ScrollView> */}

{/* Negotiate Price Popup */}
<Modal visible={showNegotiatePopup} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.modalIconContainer}>
        <Feather name="message-circle" size={32} color={colors.warning} />
      </View>
      <Text style={styles.modalTitle}>Negotiate Price</Text>
      <Text style={styles.modalDescription}>
        Would you like to discuss the price with your tailor?
      </Text>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={startNegotiation}
      >
        <Text style={styles.primaryButtonText}>Start Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.outlineButton, { marginTop: 12 }]}
        onPress={() => setShowNegotiatePopup(false)}
      >
        <Text style={styles.outlineButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Chat with Tailor Modal */}
<Modal visible={showChatWithTailor} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { maxHeight: '80%', width: '90%' }]}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.chatHeaderTitle}>Chat with Tailor</Text>
            <Text style={styles.chatHeaderSubtitle}>Discuss price details</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowChatWithTailor(false)}>
          <Feather name="x" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Messages Area */}
      <ScrollView style={styles.messagesContainer}>
        {negotiationMessages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.sender === 'customer' && styles.messageWrapperRight
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                msg.sender === 'customer' && styles.messageBubbleCustomer,
                msg.sender === 'tailor' && styles.messageBubbleTailor,
                msg.sender === 'system' && styles.messageBubbleSystem
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.sender === 'customer' && styles.messageTextWhite
              ]}>
                {msg.message}
              </Text>
              <Text style={[
                styles.messageTime,
                msg.sender === 'customer' && styles.messageTimeWhite
              ]}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.chatInputContainer}>
        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Feather name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
        
        {/* Demo button */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={simulateTailorPriceUpdate}
        >
          <Text style={styles.demoButtonText}>[Demo] Tailor Updates Price</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

{/* Price Update Acceptance Modal */}
<Modal visible={showPriceUpdatePopup} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={[styles.modalIconContainer, { backgroundColor: colors.success + '20' }]}>
        <Feather name="dollar-sign" size={32} color={colors.success} />
      </View>
      <Text style={styles.modalTitle}>Price Updated</Text>
      <Text style={styles.modalDescription}>
        Your tailor has proposed a new price
      </Text>
      <View style={styles.priceComparisonContainer}>
        <Text style={styles.oldPriceText}>
          Previous: PKR {order?.price}
        </Text>
        <Text style={styles.newPriceText}>
          PKR {tailorProposedPrice}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={acceptNewPrice}
      >
        <Text style={styles.primaryButtonText}>Accept Price</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.outlineButton, { marginTop: 12 }]}
        onPress={rejectNewPrice}
      >
        <Text style={styles.outlineButtonText}>Decline</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Success Modal */}
<Modal visible={showSuccessPopup} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={[styles.modalIconContainer, { backgroundColor: colors.success + '20' }]}>
        <Feather name="check-circle" size={32} color={colors.success} />
      </View>
      <Text style={styles.modalTitle}>Order Confirmed!</Text>
      <Text style={styles.modalDescription}>
        Your order has been confirmed with the new price. The tailor will begin production.
      </Text>
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => {
          setShowSuccessPopup(false);
          loadOrderDetails();
        }}
      >
        <Text style={styles.primaryButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
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
priceText: {
fontSize: 18,
fontWeight: 'bold',
color: colors.success
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
flex: 1,
paddingVertical: 14,
borderRadius: 8,
alignItems: 'center',
justifyContent: 'center',
minHeight: 48
},
acceptButton: {
backgroundColor: colors.primary
},
rejectButton: {
backgroundColor: colors.error
},
actionButtonText: {
color: colors.white,
fontSize: 16,
fontWeight: '600'
},
primaryButton: {
backgroundColor: colors.primary,
paddingVertical: 14,
borderRadius: 8,
alignItems: 'center',
justifyContent: 'center',
minHeight: 48,
marginBottom: 12
},
primaryButtonText: {
color: colors.white,
fontSize: 16,
fontWeight: '600'
},
outlineButton: {
backgroundColor: 'transparent',
borderWidth: 2,
borderColor: colors.primary,
paddingVertical: 14,
borderRadius: 8,
alignItems: 'center',
justifyContent: 'center',
minHeight: 48
},
outlineButtonText: {
color: colors.primary,
fontSize: 16,
fontWeight: '600'
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
},
editButton: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 8,
backgroundColor: colors.white,
borderWidth: 2,
borderColor: colors.primary,
paddingVertical: 14,
borderRadius: 8,
minHeight: 48
},
editButtonText: {
color: colors.primary,
fontSize: 16,
fontWeight: '600'
},
negotiationBanner: {
backgroundColor: colors.warning + '20',
borderRadius: 8,
padding: 16,
marginBottom: 12,
borderWidth: 1,
borderColor: colors.warning
},
negotiationBannerContent: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 12
},
negotiationBannerText: {
fontSize: 14,
color: colors.darkGray,
fontWeight: '500',
marginLeft: 8,
flex: 1
},
updatePriceButton: {
backgroundColor: colors.primary,
paddingVertical: 10,
paddingHorizontal: 16,
borderRadius: 6,
alignItems: 'center'
},
updatePriceButtonText: {
color: colors.white,
fontSize: 14,
fontWeight: '600'
},
priceInputContainer: {
marginBottom: 20
},
priceInputLabel: {
fontSize: 14,
fontWeight: '500',
color: colors.black,
marginBottom: 8
},
priceInput: {
borderWidth: 1,
borderColor: colors.lightGray,
borderRadius: 8,
paddingVertical: 12,
paddingHorizontal: 16,
fontSize: 16,
color: colors.black
},
textButton: {
paddingVertical: 12,
alignItems: 'center'
},
textButtonText: {
fontSize: 14,
color: colors.gray,
fontWeight: '500'
},
modalIconContainer: {
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.warning + '20',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  marginBottom: 16
},
chatHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: colors.lightGray,
  marginBottom: 16
},
chatHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12
},
avatarCircle: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: colors.primary + '20',
  alignItems: 'center',
  justifyContent: 'center'
},
chatHeaderTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: colors.black
},
chatHeaderSubtitle: {
  fontSize: 12,
  color: colors.gray
},
messagesContainer: {
  flex: 1,
  marginBottom: 16
},
messageWrapper: {
  marginBottom: 12,
  alignItems: 'flex-start'
},
messageWrapperRight: {
  alignItems: 'flex-end'
},
messageBubble: {
  maxWidth: '75%',
  padding: 12,
  borderRadius: 16
},
messageBubbleCustomer: {
  backgroundColor: colors.primary,
  borderBottomRightRadius: 4
},
messageBubbleTailor: {
  backgroundColor: colors.lightGray,
  borderBottomLeftRadius: 4
},
messageBubbleSystem: {
  backgroundColor: colors.info + '20',
  alignSelf: 'center',
  maxWidth: '90%'
},
messageText: {
  fontSize: 14,
  color: colors.black,
  lineHeight: 20
},
messageTextWhite: {
  color: colors.white
},
messageTime: {
  fontSize: 10,
  color: colors.gray,
  marginTop: 4
},
messageTimeWhite: {
  color: colors.white + 'CC'
},
chatInputContainer: {
  borderTopWidth: 1,
  borderTopColor: colors.lightGray,
  paddingTop: 16
},
chatInputRow: {
  flexDirection: 'row',
  gap: 12,
  marginBottom: 12
},
chatInput: {
  flex: 1,
  borderWidth: 1,
  borderColor: colors.lightGray,
  borderRadius: 20,
  paddingHorizontal: 16,
  paddingVertical: 10,
  fontSize: 14,
  maxHeight: 100
},
sendButton: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center'
},
demoButton: {
  backgroundColor: colors.success + '20',
  paddingVertical: 8,
  borderRadius: 8,
  alignItems: 'center'
},
demoButtonText: {
  fontSize: 12,
  color: colors.success,
  fontWeight: '600'
},
priceComparisonContainer: {
  backgroundColor: colors.lightGray,
  padding: 16,
  borderRadius: 8,
  marginVertical: 16,
  alignItems: 'center'
},
oldPriceText: {
  fontSize: 14,
  color: colors.gray,
  textDecorationLine: 'line-through',
  marginBottom: 8
},
newPriceText: {
  fontSize: 28,
  fontWeight: 'bold',
  color: colors.success
},
editPriceButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  backgroundColor: colors.white,
  borderWidth: 2,
  borderColor: colors.primary,
  paddingVertical: 12,
  borderRadius: 8,
  marginTop: 12
},
editPriceButtonText: {
  color: colors.primary,
  fontSize: 15,
  fontWeight: '600'
},
});
export default OrderDetailsScreen;