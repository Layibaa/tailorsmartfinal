// COMPLETE OrderDetailsScreen.js with Price Negotiation Feature
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
  TextInput,
  Dimensions,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  getCustomerOrderDetails, 
  getTailorOrderDetails,
  updateOrderStatus,
  confirmOrder,
  deleteOrder,
  sendMessage,
  updateOrder,
  lockOrder,
  requestPriceNegotiation,
  updateOrderPrice
} from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import colors from '../../styles/colors';
import { measurementLabels, getRequiredMeasurementsForGarment } from '../../utils/validation';
import DrawingCanvas from '../../components/ui/DrawingCanvas';

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
  
  // Price negotiation states
  const [isPriceEditModalVisible, setIsPriceEditModalVisible] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  
  // Editing states
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [editedMeasurements, setEditedMeasurements] = useState({});
  const [measurementErrors, setMeasurementErrors] = useState({});
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  
  const [isEditingImages, setIsEditingImages] = useState(false);
  
  const [isEditingDupatta, setIsEditingDupatta] = useState(false);
  const [editedDupattaDetails, setEditedDupattaDetails] = useState({
    length: '',
    width: '',
    hasPeco: false
  });

  // Image states
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [tempReferenceImage, setTempReferenceImage] = useState(null);
  const [tempCustomerSketch, setTempCustomerSketch] = useState(null);
  
  const [changeHistory, setChangeHistory] = useState([]);

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
      
      console.log('📦 Order loaded:', {
        id: response.order._id,
        status: response.order.status,
        isLocked: response.order.isLocked
      });
      
      setOrder(response.order);
      setEditedNotes(response.order.notes || '');
      setEditedMeasurements(response.order.measurements || {});
      setNewPrice(response.order.price?.toString() || '');

      if (response.order.dupattaDetails) {
        setEditedDupattaDetails({
          length: response.order.dupattaDetails.length?.toString() || '',
          width: response.order.dupattaDetails.width?.toString() || '',
          hasPeco: response.order.dupattaDetails.hasPeco || false
        });
      }
      
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

 const canEdit = () => {
    if (!order) return false;
    const editableStatuses = ['pending', 'accepted', 'confirmed'];
    const canEditStatus = editableStatuses.includes(order.status);
    return !order.isLocked && canEditStatus;
  };

  const canToggleLock = () => {
    if (!order || user.role !== 'customer') return false;
    const lockableStatuses = ['accepted', 'confirmed'];
    return lockableStatuses.includes(order.status);
  };

  const handleToggleLock = async () => {
    if (!canToggleLock()) {
      Alert.alert('Cannot Lock', 'You can only lock orders that are accepted or confirmed.');
      return;
    }

    try {
      const newLockState = !order.isLocked;
      
      Alert.alert(
        newLockState ? 'Lock Design?' : 'Unlock Design?',
        newLockState 
          ? 'Once locked, no further changes can be made by either party. The tailor can then proceed with production.\n\nAre you sure all details are correct?'
          : 'Unlocking will allow both parties to edit measurements, notes, and design references again.\n\nDo you want to unlock?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: newLockState ? 'Yes, Lock It' : 'Yes, Unlock It',
            style: newLockState ? 'default' : 'destructive',
            onPress: async () => {
              try {
                setIsUpdating(true);
                await lockOrder(orderId, newLockState);
                
                setChangeHistory(prev => [{
                  userName: user.name,
                  action: newLockState ? 'locked the design 🔒' : 'unlocked the design 🔓',
                  timestamp: new Date().toISOString()
                }, ...prev]);
                
                const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
                await sendMessage({
                  receiverId,
                  content: newLockState 
                    ? `🔒 ${user.name} has locked the design. All details are finalized.`
                    : `🔓 ${user.name} has unlocked the design. You can now make changes again.`,
                  orderId: order._id
                });
                
                Alert.alert(
                  'Success! ✓',
                  newLockState 
                    ? 'Design is now locked! 🔒\n\nThe tailor has been notified.'
                    : 'Design is now unlocked! 🔓\n\nYou can make changes again.',
                  [{ text: 'OK', onPress: () => loadOrderDetails() }]
                );
                
              } catch (error) {
                console.error('❌ Lock toggle error:', error);
                Alert.alert('Error', error.response?.data?.msg || 'Failed to update lock status');
              } finally {
                setIsUpdating(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Toggle lock error:', error);
    }
  };

  const validateMeasurement = (field, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return 'Must be a number';
    }
    if (numValue < 20) {
      return 'Must be at least 20 cm';
    }
    if (numValue > 200) {
      return 'Cannot exceed 200 cm';
    }
    return null;
  };

  const handleMeasurementChange = (field, value) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setEditedMeasurements(prev => ({
      ...prev,
      [field]: sanitized
    }));
    
    const error = validateMeasurement(field, sanitized);
    setMeasurementErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
    });
  };

  const handleSaveMeasurements = async () => {
    if (!canEdit()) {
      Alert.alert('Cannot Edit', 'This order is locked or cannot be edited in current status.');
      return;
    }

    if (Object.keys(measurementErrors).length > 0) {
      Alert.alert('Invalid Values', 'Please fix measurement errors before saving.');
      return;
    }

    const requiredFields = getRequiredMeasurementsForGarment(order.garmentType);
    const missingFields = requiredFields.filter(field => !editedMeasurements[field]);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Measurements',
        `Please fill in: ${missingFields.map(f => measurementLabels[f]).join(', ')}`
      );
      return;
    }

    try {
      setIsUpdating(true);
      console.log('💾 Saving measurements:', editedMeasurements);
      
      const measurements = {};
      requiredFields.forEach(field => {
        if (editedMeasurements[field]) {
          measurements[field] = parseFloat(editedMeasurements[field]);
        }
      });
      
      await updateOrder(orderId, { measurements });
      
      setChangeHistory(prev => [{
        userName: user.name,
        action: 'updated measurements 📏',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
      await sendMessage({
        receiverId,
        content: `📏 ${user.name} has updated the measurements. Please review the changes.`,
        orderId: order._id
      });
      
      setIsEditingMeasurements(false);
      Alert.alert('Success! ✓', 'Measurements updated successfully. The other party has been notified.');
      loadOrderDetails();
    } catch (error) {
      console.error('❌ Save measurements error:', error);
      Alert.alert('Error', error.response?.data?.msg || error.message || 'Failed to update measurements');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!canEdit()) {
      Alert.alert('Cannot Edit', 'This order is locked or cannot be edited in current status.');
      return;
    }

    if (editedNotes.trim() === (order.notes || '').trim()) {
      setIsEditingNotes(false);
      return;
    }

    try {
      setIsUpdating(true);
      console.log('💾 Saving notes');
      
      await updateOrder(orderId, { notes: editedNotes.trim() });
      
      setChangeHistory(prev => [{
        userName: user.name,
        action: 'updated order notes 📝',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
      await sendMessage({
        receiverId,
        content: `📝 ${user.name} has updated the order notes: "${editedNotes.trim().substring(0, 50)}${editedNotes.length > 50 ? '...' : ''}"`,
        orderId: order._id
      });
      
      setIsEditingNotes(false);
      Alert.alert('Success! ✓', 'Notes updated successfully.');
      loadOrderDetails();
    } catch (error) {
      console.error('❌ Save notes error:', error);
      Alert.alert('Error', error.message || 'Failed to update notes');
    } finally {
      setIsUpdating(false);
    }
  };

  // Price Negotiation Handlers
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

  // NEW: Handle save dupatta details
  const handleSaveDupattaDetails = async () => {
    if (!canEdit()) {
      Alert.alert('Cannot Edit', 'This order is locked or cannot be edited in current status.');
      return;
    }

    const length = parseFloat(editedDupattaDetails.length);
    const width = parseFloat(editedDupattaDetails.width);

    if (isNaN(length) || length < 200 || length > 350) {
      Alert.alert('Invalid Length', 'Dupatta length must be between 200-350 cm');
      return;
    }

    if (isNaN(width) || width < 70 || width > 150) {
      Alert.alert('Invalid Width', 'Dupatta width must be between 70-150 cm');
      return;
    }

    try {
      setIsUpdating(true);
      console.log('💾 Saving dupatta details');
      
      await updateOrder(orderId, {
        dupattaDetails: {
          length,
          width,
          hasPeco: editedDupattaDetails.hasPeco
        }
      });
      
      setChangeHistory(prev => [{
        userName: user.name,
        action: 'updated dupatta details 🧣',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
      await sendMessage({
        receiverId,
        content: `🧣 ${user.name} has updated the dupatta details.`,
        orderId: order._id
      });
      
      setIsEditingDupatta(false);
      Alert.alert('Success!', 'Dupatta details updated successfully.');
      loadOrderDetails();
    } catch (error) {
      console.error('❌ Save dupatta details error:', error);
      Alert.alert('Error', error.message || 'Failed to update dupatta details');
    } finally {
      setIsUpdating(false);
    }
  };

  const pickImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!asset.base64) {
          Alert.alert('Error', 'Failed to process image. Please try again.');
          return;
        }

        const sizeInMB = (asset.base64.length * 0.75) / (1024 * 1024);
        if (sizeInMB > 5) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
          return;
        }

        let base64Data = asset.base64;
        if (base64Data.startsWith('data:')) {
          base64Data = base64Data.split(',')[1] || base64Data;
        }

        const mimeType = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${base64Data}`;
        
        if (type === 'reference') {
          setTempReferenceImage({ uri: asset.uri, base64: base64Image });
        } else {
          setTempCustomerSketch({ uri: asset.uri, base64: base64Image });
        }
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCanvasSave = (signature) => {
    setTempCustomerSketch({ uri: signature, base64: signature });
    setIsCanvasVisible(false);
  };

  const handleSaveImages = async () => {
    if (!canEdit()) {
      Alert.alert('Cannot Edit', 'This order is locked or cannot be edited in current status.');
      return;
    }

    try {
      setIsUpdating(true);
      console.log('💾 Saving images');
      
      const updateData = {};
      
      if (tempReferenceImage) {
        updateData.referenceImage = tempReferenceImage.base64;
      }
      
      if (tempCustomerSketch) {
        updateData.customerSketch = tempCustomerSketch.base64;
      }
      
      if (Object.keys(updateData).length === 0) {
        setIsEditingImages(false);
        return;
      }
      
      await updateOrder(orderId, updateData);
      
      setChangeHistory(prev => [{
        userName: user.name,
        action: 'updated design references 🖼️',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
      await sendMessage({
        receiverId,
        content: `🖼️ ${user.name} has updated the design references. Please review the new images.`,
        orderId: order._id
      });
      
      setIsEditingImages(false);
      setTempReferenceImage(null);
      setTempCustomerSketch(null);
      Alert.alert('Success! ✓', 'Design references updated successfully.');
      loadOrderDetails();
    } catch (error) {
      console.error('❌ Save images error:', error);
      Alert.alert('Error', error.message || 'Failed to update images');
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
          'Order confirmed. You can now collaborate on the final design.'
        );
      }
      
      Alert.alert(
        'Order Confirmed! ✓', 
        'You can now work with the tailor to finalize measurements and design.'
      );
      setIsStatusModalVisible(false);
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to confirm order');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending Approval',
      accepted: 'Accepted - Review Details',
      confirmed: 'Confirmed - Finalizing Design',
      making: 'In Production',
      payment_done: 'Payment Received',
      completed: 'Completed',
      rejected: 'Rejected'
    };
    return statusMap[status] || status;
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

  const requiredMeasurements = getRequiredMeasurementsForGarment(order.garmentType);

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
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      {/* Lock Status Banner */}
      <View style={[
        styles.lockBanner,
        order.isLocked ? styles.lockedBanner : styles.unlockedBanner
      ]}>
        <View style={styles.lockBannerContent}>
          <Feather 
            name={order.isLocked ? "lock" : "unlock"} 
            size={24} 
            color={order.isLocked ? colors.success : colors.warning} 
          />
          <View style={styles.lockBannerText}>
            <Text style={styles.lockBannerTitle}>
              {order.isLocked ? '🔒 Design Locked' : '🔓 Design Unlocked'}
            </Text>
            <Text style={styles.lockBannerDescription}>
              {order.isLocked 
                ? 'All details are finalized. No further changes can be made.' + 
                  (user.role === 'customer' ? ' You can unlock if changes are needed.' : ' Customer must unlock to make changes.')
                : 'Both parties can edit measurements, notes, and design references.' +
                  (user.role === 'customer' ? ' Lock when you\'re satisfied.' : ' Customer will lock when satisfied.')
              }
            </Text>
          </View>
        </View>
        
        {canToggleLock() && (
          <TouchableOpacity
            style={[
              styles.lockButton,
              order.isLocked ? styles.unlockButton : styles.lockButtonStyle
            ]}
            onPress={handleToggleLock}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Feather 
                  name={order.isLocked ? "unlock" : "lock"} 
                  size={16} 
                  color={colors.white} 
                />
                <Text style={styles.lockButtonText}>
                  {order.isLocked ? 'Unlock' : 'Lock Design'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
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

      {/* Collaborative Editing Notice */}
      {canEdit() && (
        <View style={styles.editNotice}>
          <Feather name="edit-3" size={20} color={colors.primary} />
          <Text style={styles.editNoticeText}>
            ✨ Both parties can edit order details. Changes will notify the other party. 🔒 Lock when finalized.
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

        {/* Show price edit button for tailor if negotiation requested and not yet changed */}
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
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📝 Order Notes</Text>
          {canEdit() && !isEditingNotes && (
            <TouchableOpacity onPress={() => setIsEditingNotes(true)} style={styles.editIconButton}>
              <Feather name="edit-3" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {isEditingNotes ? (
          <View>
            <TextInput
              style={styles.notesInput}
              value={editedNotes}
              onChangeText={setEditedNotes}
              multiline
              numberOfLines={4}
              placeholder="Add any special instructions..."
              editable={!isUpdating}
            />
            <View style={styles.buttonRow}>
              <Button 
                title="Save" 
                onPress={handleSaveNotes} 
                buttonStyle={styles.smallButton}
                loading={isUpdating}
                disabled={isUpdating}
              />
              <Button 
                title="Cancel" 
                onPress={() => {
                  setEditedNotes(order.notes || '');
                  setIsEditingNotes(false);
                }} 
                outline 
                buttonStyle={styles.smallButton}
                disabled={isUpdating}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.notesText}>{order.notes || 'No notes provided'}</Text>
        )}
      </View>

      {/* NEW: Dupatta Details Section (3-piece only) */}
      {order.suitType === '3-piece' && order.dupattaDetails && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🧣 Dupatta Details</Text>
            {canEdit() && !isEditingDupatta && (
              <TouchableOpacity onPress={() => setIsEditingDupatta(true)} style={styles.editIconButton}>
                <Feather name="edit-3" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {isEditingDupatta ? (
            <View style={styles.dupattaEditor}>
              <Text style={styles.editorInfo}>
                Update dupatta measurements and decoration preferences
              </Text>
              <View style={styles.measurementInputContainer}>
                <Text style={styles.measurementInputLabel}>Length (cm)</Text>
                <TextInput
                  style={styles.measurementInput}
                  value={editedDupattaDetails.length}
                  onChangeText={(text) => setEditedDupattaDetails(prev => ({
                    ...prev,
                    length: text.replace(/[^0-9.]/g, '')
                  }))}
                  keyboardType="decimal-pad"
                  placeholder="Enter length (200-350 cm)"
                  editable={!isUpdating}
                />
              </View>
              <View style={styles.measurementInputContainer}>
                <Text style={styles.measurementInputLabel}>Width (cm)</Text>
                <TextInput
                  style={styles.measurementInput}
                  value={editedDupattaDetails.width}
                  onChangeText={(text) => setEditedDupattaDetails(prev => ({
                    ...prev,
                    width: text.replace(/[^0-9.]/g, '')
                  }))}
                  keyboardType="decimal-pad"
                  placeholder="Enter width (70-150 cm)"
                  editable={!isUpdating}
                />
              </View>
              <View style={styles.pecoToggleContainer}>
                <View style={styles.pecoLabelContainer}>
                  <Feather name="scissors" size={18} color={colors.black} />
                  <Text style={styles.pecoToggleLabel}>Add Peco Decoration</Text>
                </View>
                <Switch
                  value={editedDupattaDetails.hasPeco}
                  onValueChange={(value) => setEditedDupattaDetails(prev => ({
                    ...prev,
                    hasPeco: value
                  }))}
                  trackColor={{ false: colors.lightGray, true: colors.primary }}
                  thumbColor={editedDupattaDetails.hasPeco ? colors.white : colors.gray}
                  disabled={isUpdating}
                />
              </View>
              <View style={styles.buttonRow}>
                <Button 
                  title="Save Changes" 
                  onPress={handleSaveDupattaDetails} 
                  buttonStyle={styles.smallButton}
                  loading={isUpdating}
                  disabled={isUpdating}
                />
                <Button 
                  title="Cancel" 
                  onPress={() => {
                    setEditedDupattaDetails({
                      length: order.dupattaDetails.length?.toString() || '',
                      width: order.dupattaDetails.width?.toString() || '',
                      hasPeco: order.dupattaDetails.hasPeco || false
                    });
                    setIsEditingDupatta(false);
                  }} 
                  outline 
                  buttonStyle={styles.smallButton}
                  disabled={isUpdating}
                />
              </View>
            </View>
          ) : (
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
          )}
        </View>
      )}

      {/* Design References Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🖼️ Design Reference</Text>
          {canEdit() && !isEditingImages && (
            <TouchableOpacity onPress={() => setIsEditingImages(true)} style={styles.editIconButton}>
              <Feather name="edit-3" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditingImages ? (
          <View>
            <Text style={styles.imageEditTitle}>Reference Image</Text>
            {tempReferenceImage || order.referenceImage?.url ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: tempReferenceImage?.uri || order.referenceImage.url }} 
                  style={styles.imagePreview}
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setTempReferenceImage(null)}
                >
                  <Feather name="x" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage('reference')}>
                <Feather name="upload" size={20} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.imageEditTitle, { marginTop: 16 }]}>Customer Sketch</Text>
            {tempCustomerSketch || order.customerSketch?.url ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: tempCustomerSketch?.uri || order.customerSketch.url }} 
                  style={styles.imagePreview}
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setTempCustomerSketch(null)}
                >
                  <Feather name="x" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={() => setIsCanvasVisible(true)}>
                <Feather name="edit-3" size={20} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Draw Sketch</Text>
              </TouchableOpacity>
            )}

            <View style={styles.buttonRow}>
              <Button 
                title="Save Changes" 
                onPress={handleSaveImages} 
                buttonStyle={styles.smallButton}
                loading={isUpdating}
                disabled={isUpdating}
              />
              <Button 
                title="Cancel" 
                onPress={() => {
                  setTempReferenceImage(null);
                  setTempCustomerSketch(null);
                  setIsEditingImages(false);
                }} 
                outline 
                buttonStyle={styles.smallButton}
                disabled={isUpdating}
              />
            </View>
          </View>
        ) : (
          <View>
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
            {!order.referenceImage?.url && !order.customerSketch?.url && (
              <Text style={styles.noDataText}>No design references provided</Text>
            )}
          </View>
        )}
      </View>

      {/* Measurements Section - UPDATED with grouping */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📏 Measurements</Text>
          {canEdit() && !isEditingMeasurements && (
            <TouchableOpacity onPress={() => setIsEditingMeasurements(true)} style={styles.editIconButton}>
              <Feather name="edit-3" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditingMeasurements ? (
          <View style={styles.measurementEditor}>
            <Text style={styles.editorInfo}>
              Update measurements and notify the other party of changes
            </Text>
            <ScrollView style={styles.measurementScroll}>
              {requiredMeasurements.map(field => (
                <View key={field} style={styles.measurementInputContainer}>
                  <Text style={styles.measurementInputLabel}>
                    {measurementLabels[field]}
                  </Text>
                  <TextInput
                    style={[
                      styles.measurementInput,
                      measurementErrors[field] && styles.measurementInputError
                    ]}
                    value={editedMeasurements[field]?.toString() || ''}
                    onChangeText={(text) => handleMeasurementChange(field, text)}
                    keyboardType="decimal-pad"
                    placeholder="Enter value"
                    editable={!isUpdating}
                  />
                  {measurementErrors[field] && (
                    <Text style={styles.errorText}>{measurementErrors[field]}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={styles.buttonRow}>
              <Button 
                title="Save Changes" 
                onPress={handleSaveMeasurements} 
                buttonStyle={styles.smallButton}
                loading={isUpdating}
                disabled={isUpdating || Object.keys(measurementErrors).length > 0}
              />
              <Button 
                title="Cancel" 
                onPress={() => {
                  setEditedMeasurements(order.measurements);
                  setMeasurementErrors({});
                  setIsEditingMeasurements(false);
                }} 
                outline 
                buttonStyle={styles.smallButton}
                disabled={isUpdating}
              />
            </View>
          </View>
        ) : (
          <View>
            {/* Kameez Measurements */}
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

            {/* Shalwar Measurements */}
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
        )}
      </View>

      {/* Change History */}
      {changeHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="clock" size={20} color={colors.gray} />
            <Text style={styles.sectionTitle}>Recent Changes</Text>
          </View>
          <View style={styles.changeHistoryList}>
            {changeHistory.slice(0, 5).map((change, idx) => (
              <View key={idx} style={styles.changeHistoryItem}>
                <View style={styles.changeIconContainer}>
                  <Feather 
                    name={
                      change.action.includes('locked') || change.action.includes('unlocked') ? 'lock' :
                      change.action.includes('measurements') ? 'maximize' :
                      change.action.includes('notes') ? 'file-text' :
                      change.action.includes('references') ? 'image' :
                      change.action.includes('dupatta') ? 'minimize' :
                      'user'
                    } 
                    size={14} 
                    color={colors.primary} 
                  />
                </View>
                <View style={styles.changeContent}>
                  <Text style={styles.changeText}>
                    <Text style={styles.changeUserName}>{change.userName}</Text>
                    {' '}
                    <Text style={styles.changeAction}>{change.action}</Text>
                  </Text>
                  <Text style={styles.changeTime}>
                    {new Date(change.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        {user.role === 'tailor' && order.status === 'pending' && (
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
        )}
        
        {user.role === 'customer' && order.status === 'accepted' && (
          <Button
            title="✓ Confirm & Start Collaboration"
            onPress={() => setIsStatusModalVisible(true)}
            disabled={isUpdating}
          />
        )}

        {order.isLocked && user.role === 'tailor' && order.status === 'confirmed' && (
          <Button
            title="🚀 Start Production"
            onPress={async () => {
              try {
                setIsUpdating(true);
                await updateOrderStatus(orderId, { status: 'making' });
                Alert.alert('Success', 'Production started!');
                loadOrderDetails();
              } catch (error) {
                Alert.alert('Error', 'Failed to start production');
              } finally {
                setIsUpdating(false);
              }
            }}
            disabled={isUpdating}
          />
        )}

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

      {/* Price Modal */}
      <Modal visible={isPriceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Price for Order</Text>
            <Text style={styles.modalSubtitle}>
              Enter the price for this {order.garmentType} order
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

      {/* Confirm Modal */}
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
              Review the price and confirm to start working with the tailor on your design.
            </Text>

            <Button 
              title="✓ Confirm Order" 
              onPress={handleConfirmOrder}
              loading={isUpdating}
              disabled={isUpdating}
            />


      {/* Show negotiate button only if price hasn't been changed yet */}
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

{/* ADD NEW: Price Edit Modal (Tailor Only) */}

  {/* Price Edit Modal (Tailor Only) */}
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

      {/* Image View Modal */}
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

      {/* Canvas Modal */}
      <Modal visible={isCanvasVisible} animationType="slide">
        <DrawingCanvas 
          onSave={handleCanvasSave}
          onClose={() => setIsCanvasVisible(false)}
          garmentType={order?.garmentType || 'clothing'}
          designNotes={order?.notes || editedNotes || ''}
        />
      </Modal>

      {/* Bottom Spacing */}
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
    fontSize: 12
  },
  lockBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2
  },
  lockedBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC'
  },
  unlockedBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D'
  },
  lockBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  lockBannerText: {
    flex: 1,
    marginLeft: 12
  },
  lockBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4
  },
  lockBannerDescription: {
    fontSize: 13,
    color: colors.darkGray,
    lineHeight: 18
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8
  },
  lockButtonStyle: {
    backgroundColor: colors.success
  },
  unlockButton: {
    backgroundColor: colors.warning
  },
  lockButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14
  },
  editNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8
  },
  editNoticeText: {
    flex: 1,
    color: colors.primary,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
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
  editIconButton: {
    padding: 8,
    backgroundColor: colors.primary + '10',
    borderRadius: 8
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
  notesInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12
  },
  notesText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20
  },
  // NEW: Dupatta styles
  dupattaEditor: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 8
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
  pecoToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginTop: 12
  },
  pecoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  pecoToggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
    color: colors.black
  },
  // NEW: Measurement grouping styles
  measurementGroup: {
    marginBottom: 20
  },
  measurementGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12
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
  imageEditTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8,
    marginTop: 8
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.lightGray
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8
  },
  noDataText: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12
  },
  measurementEditor: {
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 8
  },
  editorInfo: {
    fontSize: 13,
    color: colors.darkGray,
    marginBottom: 12,
    lineHeight: 18
  },
  measurementScroll: {
    maxHeight: 300
  },
  measurementInputContainer: {
    marginBottom: 12
  },
  measurementInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 6
  },
  measurementInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  measurementInputError: {
    borderColor: colors.error
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4
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
  changeHistoryList: {
    marginTop: 8
  },
  changeHistoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10
  },
  changeIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2
  },
  changeContent: {
    flex: 1
  },
  changeText: {
    fontSize: 14,
    lineHeight: 20
  },
  changeUserName: {
    fontWeight: '600',
    color: colors.black
  },
  changeAction: {
    color: colors.darkGray
  },
  changeTime: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12
  },
  smallButton: {
    flex: 1
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 32
  },
  actionButton: {
    flex: 1
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
  dupattaEditor: {
  backgroundColor: colors.lightGray,
  padding: 16,
  borderRadius: 8
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
pecoToggleContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  backgroundColor: colors.white,
  borderRadius: 8,
  marginTop: 12
},
pecoLabelContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  flex: 1
},
pecoToggleLabel: {
  fontSize: 15,
  fontWeight: '500',
  marginLeft: 8,
  color: colors.black
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
  modalText: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 12,
    textAlign: 'center'
  },
  modalPrice: {
    fontWeight: 'bold',
    color: colors.success,
    fontSize: 18
  },
  modalDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 22,
    marginBottom: 20,
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8
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
  }
});
  export default OrderDetailsScreen; 