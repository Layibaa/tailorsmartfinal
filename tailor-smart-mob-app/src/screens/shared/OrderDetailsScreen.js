// Enhanced OrderDetailsScreen.js - Full collaborative editing support
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
  TextInput
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
  lockOrder
} from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import colors from '../../styles/colors';
import { measurementLabels } from '../../utils/validation';
import LockStatusBanner from '../../components/orders/LockStatusBanner';
import MeasurementEditor from '../../components/orders/MeasurementEditor';
import ChangeHistory from '../../components/orders/ChangeHistory';
import DrawingCanvas from '../../components/ui/DrawingCanvas';

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
  
  // Editing states
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [isEditingImages, setIsEditingImages] = useState(false);
  
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
      let response;
      if (user.role === 'customer') {
        response = await getCustomerOrderDetails(orderId);
      } else {
        response = await getTailorOrderDetails(orderId);
      }
      setOrder(response.order);
      setEditedNotes(response.order.notes || '');
      
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

  // Can edit if: not locked AND (pending OR accepted OR confirmed)
  const canEdit = () => {
    if (!order) return false;
    return !order.isLocked && ['pending', 'accepted', 'confirmed'].includes(order.status);
  };

  // Customer can lock if: status is accepted or confirmed AND not already locked
  const canLock = () => {
    if (!order || user.role !== 'customer') return false;
    return !order.isLocked && ['accepted', 'confirmed'].includes(order.status);
  };

  // Customer can unlock if: locked AND (accepted or confirmed)
  const canUnlock = () => {
    if (!order || user.role !== 'customer') return false;
    return order.isLocked && ['accepted', 'confirmed'].includes(order.status);
  };

  // Handle lock/unlock
  const handleToggleLock = async () => {
    try {
      const newLockState = !order.isLocked;
      
      Alert.alert(
        newLockState ? 'Lock Design?' : 'Unlock Design?',
        newLockState 
          ? 'Once locked, no further changes can be made by either party. The tailor can then start production.'
          : 'Unlocking will allow both parties to edit measurements, notes, and design references again.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: newLockState ? 'Lock' : 'Unlock',
            onPress: async () => {
              try {
                setIsUpdating(true);
                await lockOrder(orderId, newLockState);
                
                // Add to change history
                setChangeHistory(prev => [{
                  userName: user.name,
                  action: newLockState ? 'locked the design' : 'unlocked the design',
                  timestamp: new Date().toISOString()
                }, ...prev]);
                
                // Send notification to other party
                const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
                await sendMessage({
                  receiverId,
                  content: newLockState 
                    ? `Design has been locked. Production can begin.`
                    : `Design has been unlocked. Changes can now be made.`,
                  orderId: order._id
                });
                
                Alert.alert(
                  'Success',
                  newLockState 
                    ? 'Design locked! The tailor can now start production.'
                    : 'Design unlocked! You can now make changes.'
                );
                
                loadOrderDetails();
              } catch (error) {
                Alert.alert('Error', error.response?.data?.msg || 'Failed to update lock status');
              } finally {
                setIsUpdating(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Toggle lock error:', error);
    }
  };

  // Handle measurement updates
  const handleSaveMeasurements = async (newMeasurements) => {
    try {
      setIsUpdating(true);
      
      await updateOrder(orderId, {
        measurements: newMeasurements
      });
      
      // Add to change history
      setChangeHistory(prev => [{
        userName: user.name,
        action: 'updated measurements',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      // Notify other party
      const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
      await sendMessage({
        receiverId,
        content: `${user.name} has updated the measurements. Please review.`,
        orderId: order._id
      });
      
      setIsEditingMeasurements(false);
      Alert.alert('Success', 'Measurements updated successfully');
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update measurements');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle notes update
  const handleSaveNotes = async () => {
    if (editedNotes === order.notes) {
      setIsEditingNotes(false);
      return;
    }

    try {
      setIsUpdating(true);
      
      await updateOrder(orderId, {
        notes: editedNotes
      });
      
      setChangeHistory(prev => [{
        userName: user.name,
        action: 'updated notes',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
      await sendMessage({
        receiverId,
        content: `${user.name} has updated the order notes.`,
        orderId: order._id
      });
      
      setIsEditingNotes(false);
      Alert.alert('Success', 'Notes updated successfully');
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update notes');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle image picker
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
          setTempReferenceImage({
            uri: asset.uri,
            base64: base64Image
          });
        } else {
          setTempCustomerSketch({
            uri: asset.uri,
            base64: base64Image
          });
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle canvas sketch
  const handleCanvasSave = (signature) => {
    setTempCustomerSketch({
      uri: signature,
      base64: signature
    });
    setIsCanvasVisible(false);
  };

  // Save image changes
  const handleSaveImages = async () => {
    try {
      setIsUpdating(true);
      
      const updateData = {};
      
      if (tempReferenceImage) {
        updateData.referenceImage = tempReferenceImage.base64;
      }
      
      if (tempCustomerSketch) {
        updateData.customerSketch = tempCustomerSketch.base64;
      }
      
      await updateOrder(orderId, updateData);
      
      setChangeHistory(prev => [{
        userName: user.name,
        action: 'updated design references',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      const receiverId = user.role === 'customer' ? order.tailor._id : order.customer._id;
      await sendMessage({
        receiverId,
        content: `${user.name} has updated the design references.`,
        orderId: order._id
      });
      
      setIsEditingImages(false);
      setTempReferenceImage(null);
      setTempCustomerSketch(null);
      Alert.alert('Success', 'Design references updated successfully');
      loadOrderDetails();
    } catch (error) {
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
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to accept order');
    } finally {
      setIsUpdating(false);
      setIsPriceModalVisible(false);
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
          'Order confirmed. You can now collaborate on the final design.'
        );
      }
      
      Alert.alert(
        'Order Confirmed', 
        'You can now work with the tailor to finalize measurements and design. Lock the design when you\'re ready for production.'
      );
      setIsStatusModalVisible(false);
      loadOrderDetails();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.msg || 'Failed to confirm order');
    } finally {
      setIsUpdating(false);
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
      completed: 'Completed'
    };
    return statusMap[status] || status;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderIdText}>Order #{orderId.substring(0, 8)}</Text>
          <Text style={styles.orderDateText}>Placed on {formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors[order.status] || colors.gray }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      {/* Lock Status Banner */}
      <LockStatusBanner
        isLocked={order.isLocked}
        onToggleLock={handleToggleLock}
        canToggleLock={canLock() || canUnlock()}
        userRole={user.role}
        orderStatus={order.status}
      />

      {/* Collaborative Editing Notice */}
      {canEdit() && (
        <View style={styles.editNotice}>
          <Feather name="edit-3" size={20} color={colors.primary} />
          <Text style={styles.editNoticeText}>
            Both parties can edit order details. Lock when finalized.
          </Text>
        </View>
      )}

      {/* Order Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Garment Type:</Text>
          <Text style={styles.infoValue}>{order.garmentType}</Text>
        </View>
        
        {order.price > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price:</Text>
            <Text style={styles.infoValue}>PKR {order.price}</Text>
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
      </View>

      {/* Notes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Order Notes</Text>
          {canEdit() && !isEditingNotes && (
            <TouchableOpacity onPress={() => setIsEditingNotes(true)} style={styles.editButton}>
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
            />
            <View style={styles.buttonRow}>
              <Button title="Save" onPress={handleSaveNotes} buttonStyle={styles.smallButton} />
              <Button 
                title="Cancel" 
                onPress={() => {
                  setEditedNotes(order.notes || '');
                  setIsEditingNotes(false);
                }} 
                outline 
                buttonStyle={styles.smallButton}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.notesText}>{order.notes || 'No notes provided'}</Text>
        )}
      </View>

      {/* Design References Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Design Reference</Text>
          {canEdit() && !isEditingImages && (
            <TouchableOpacity onPress={() => setIsEditingImages(true)} style={styles.editButton}>
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
              <Button title="Save Changes" onPress={handleSaveImages} buttonStyle={styles.smallButton} />
              <Button 
                title="Cancel" 
                onPress={() => {
                  setTempReferenceImage(null);
                  setTempCustomerSketch(null);
                  setIsEditingImages(false);
                }} 
                outline 
                buttonStyle={styles.smallButton}
              />
            </View>
          </View>
        ) : (
          <View>
            {order.referenceImage?.url && (
              <TouchableOpacity onPress={() => {
                setSelectedImage({ url: order.referenceImage.url, title: 'Reference Image' });
                setIsImageModalVisible(true);
              }}>
                <Image source={{ uri: order.referenceImage.url }} style={styles.imagePreview} />
              </TouchableOpacity>
            )}
            {order.customerSketch?.url && (
              <TouchableOpacity onPress={() => {
                setSelectedImage({ url: order.customerSketch.url, title: 'Customer Sketch' });
                setIsImageModalVisible(true);
              }}>
                <Image source={{ uri: order.customerSketch.url }} style={styles.imagePreview} />
              </TouchableOpacity>
            )}
            {!order.referenceImage?.url && !order.customerSketch?.url && (
              <Text style={styles.noDataText}>No design references provided</Text>
            )}
          </View>
        )}
      </View>

      {/* Measurements Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          {canEdit() && !isEditingMeasurements && (
            <TouchableOpacity onPress={() => setIsEditingMeasurements(true)} style={styles.editButton}>
              <Feather name="edit-3" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {isEditingMeasurements ? (
          <MeasurementEditor
            measurements={order.measurements}
            onSave={handleSaveMeasurements}
            onCancel={() => setIsEditingMeasurements(false)}
            garmentType={order.garmentType}
            userRole={user.role}
          />
        ) : (
          <View style={styles.measurementsGrid}>
            {Object.entries(order.measurements).map(([key, value]) => (
              <View style={styles.measurementCard} key={key}>
                <Text style={styles.measurementLabel}>{measurementLabels[key] || key}</Text>
                <Text style={styles.measurementValue}>
                  {value} <Text style={styles.unitText}>cm</Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Change History */}
      <ChangeHistory changes={changeHistory} />

      {/* Actions */}
      <View style={styles.actionsSection}>
        {user.role === 'tailor' && order.status === 'pending' && (
          <View style={styles.buttonRow}>
            <Button
              title="Accept Order"
              onPress={() => setIsPriceModalVisible(true)}
              buttonStyle={styles.actionButton}
            />
            <Button
              title="Reject"
              onPress={() => {/* reject logic */}}
              danger
              buttonStyle={styles.actionButton}
            />
          </View>
        )}
        
        {user.role === 'customer' && order.status === 'accepted' && (
          <Button
            title="Confirm & Start Collaboration"
            onPress={() => setIsStatusModalVisible(true)}
          />
        )}

        {order.isLocked && user.role === 'tailor' && ['confirmed'].includes(order.status) && (
          <Button
            title="Start Production"
            onPress={() => updateOrderStatus(orderId, { status: 'making' }).then(loadOrderDetails)}
          />
        )}

        <Button
          title={`Message ${user.role === 'customer' ? 'Tailor' : 'Customer'}`}
          onPress={() => navigation.navigate('Chat', {
            userId: user.role === 'customer' ? order.tailor._id : order.customer._id,
            name: user.role === 'customer' ? order.tailor.name : order.customer.name
          })}
          outline
          buttonStyle={{ marginTop: 12 }}
        />
      </View>

      {/* Modals */}
      <Modal visible={isPriceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Price for Order</Text>
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
                  />
                  <Button title="Accept Order" onPress={handleSubmit} />
                  <Button 
                    title="Cancel" 
                    onPress={() => setIsPriceModalVisible(false)} 
                    outline 
                    buttonStyle={{ marginTop: 12 }}
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
            <Text style={styles.modalText}>
              Price: PKR {order?.price}. After confirmation, you can work with the tailor to finalize the design.
            </Text>
            <Button title="Confirm Order" onPress={handleConfirmOrder} />
            <Button 
              title="Cancel" 
              onPress={() => setIsStatusModalVisible(false)} 
              outline 
              buttonStyle={{ marginTop: 12 }}
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

      <Modal visible={isCanvasVisible} animationType="slide">
        <DrawingCanvas 
          onSave={handleCanvasSave}
          onClose={() => setIsCanvasVisible(false)}
        />
      </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  orderIdText: {
    fontSize: 18,
    fontWeight: 'bold'
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
  editNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8
  },
  editNoticeText: {
    flex: 1,
    color: colors.primary,
    fontWeight: '500'
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
    fontWeight: '600'
  },
  editButton: {
    padding: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  infoLabel: {
    color: colors.gray
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
  reviewSection: {
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 12
  },
  reviewPrompt: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12,
    textAlign: 'center'
  },
  reviewButton: {
    marginTop: 8
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.success + '20',
    borderRadius: 8
  },
  reviewedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8
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
  },
  sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16
},
editButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: colors.primary + '10',
  borderRadius: 8
},
editButtonText: {
  color: colors.primary,
  fontWeight: '600',
  fontSize: 14
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
  fontSize: 24,
  fontWeight: 'bold',
  color: colors.black
},
unitText: {
  fontSize: 14,
  color: colors.gray
}
});

export default OrderDetailsScreen;