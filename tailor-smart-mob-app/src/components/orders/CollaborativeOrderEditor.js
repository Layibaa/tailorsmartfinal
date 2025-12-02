import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  TextInput,
  Switch
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../styles/colors';
import { measurementLabels } from '../../utils/validation';
import DrawingCanvas from '../ui/DrawingCanvas';

const CollaborativeOrderEditor = ({ 
  order, 
  userRole, 
  onSaveChanges, 
  onRequestChanges, 
  onApproveChanges,
  onLockOrder,
  onClose 
}) => {
  const [editedOrder, setEditedOrder] = useState(null);
  const [editStatus, setEditStatus] = useState('idle'); // 'idle', 'editing', 'pending_approval', 'ready_to_lock'
  const [changeRequester, setChangeRequester] = useState(null);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [sketchType, setSketchType] = useState(null); // 'reference' or 'customer'
  const [changeNote, setChangeNote] = useState('');
  const [showChangeNoteModal, setShowChangeNoteModal] = useState(false);

  useEffect(() => {
    if (order) {
      setEditedOrder({
        ...order,
        measurements: { ...order.measurements },
        dupattaDetails: order.dupattaDetails ? { ...order.dupattaDetails } : null,
        referenceImage: order.referenceImage ? { ...order.referenceImage } : null,
        customerSketch: order.customerSketch ? { ...order.customerSketch } : null,
        editHistory: order.editHistory || []
      });
    }
  }, [order]);

  const handleMeasurementChange = (key, value) => {
    setEditedOrder(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [key]: value
      }
    }));
    if (editStatus === 'idle') {
      setEditStatus('editing');
    }
  };

  const handleDupattaChange = (key, value) => {
    setEditedOrder(prev => ({
      ...prev,
      dupattaDetails: {
        ...prev.dupattaDetails,
        [key]: value
      }
    }));
    if (editStatus === 'idle') {
      setEditStatus('editing');
    }
  };

  const pickImage = async (imageType) => {
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
          Alert.alert('Error', 'Failed to process image.');
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
        
        if (imageType === 'reference') {
          setEditedOrder(prev => ({
            ...prev,
            referenceImage: {
              url: asset.uri,
              base64: base64Image
            }
          }));
        }
        
        if (editStatus === 'idle') {
          setEditStatus('editing');
        }
        
        Alert.alert('Success', 'Image updated successfully!');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const openCanvas = (type) => {
    setSketchType(type);
    setIsCanvasVisible(true);
  };

  const handleCanvasSave = (signature) => {
    if (sketchType === 'customer') {
      setEditedOrder(prev => ({
        ...prev,
        customerSketch: {
          url: signature,
          base64: signature
        }
      }));
    }
    
    if (editStatus === 'idle') {
      setEditStatus('editing');
    }
    
    setIsCanvasVisible(false);
    setSketchType(null);
    Alert.alert('Success', 'Sketch updated!');
  };

  const clearImage = (imageType) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (imageType === 'reference') {
              setEditedOrder(prev => ({
                ...prev,
                referenceImage: null
              }));
            } else if (imageType === 'sketch') {
              setEditedOrder(prev => ({
                ...prev,
                customerSketch: null
              }));
            }
            if (editStatus === 'idle') {
              setEditStatus('editing');
            }
          }
        }
      ]
    );
  };

  const handleSaveEdit = () => {
    const changeLog = {
      timestamp: new Date().toISOString(),
      changedBy: userRole,
      status: 'saved'
    };
    
    setEditedOrder(prev => ({
      ...prev,
      editHistory: [...(prev.editHistory || []), changeLog]
    }));
    
    onSaveChanges(editedOrder);
    setEditStatus('idle');
    Alert.alert('Success', 'Changes saved successfully!');
  };

  const handleRequestChanges = () => {
    setShowChangeNoteModal(true);
  };

  const submitChangeRequest = () => {
    const changeLog = {
      timestamp: new Date().toISOString(),
      requestedBy: userRole,
      note: changeNote,
      status: 'pending_approval'
    };
    
    setEditedOrder(prev => ({
      ...prev,
      editHistory: [...(prev.editHistory || []), changeLog]
    }));
    
    setEditStatus('pending_approval');
    setChangeRequester(userRole);
    onRequestChanges(editedOrder, changeNote);
    setShowChangeNoteModal(false);
    setChangeNote('');
    Alert.alert('Request Sent', 'Changes have been submitted for approval.');
  };

  const handleApproveChanges = () => {
    Alert.alert(
      'Approve Changes',
      'Do you want to approve these changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            const changeLog = {
              timestamp: new Date().toISOString(),
              approvedBy: userRole,
              status: 'approved'
            };
            
            setEditedOrder(prev => ({
              ...prev,
              editHistory: [...(prev.editHistory || []), changeLog]
            }));
            
            setEditStatus('ready_to_lock');
            setChangeRequester(null);
            onApproveChanges(editedOrder);
            Alert.alert('Success', 'Changes approved! Order is ready to lock.');
          }
        }
      ]
    );
  };

  const handleLockOrder = () => {
    Alert.alert(
      'Lock Order',
      'Once locked, no further edits can be made. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          style: 'destructive',
          onPress: () => {
            const changeLog = {
              timestamp: new Date().toISOString(),
              lockedBy: userRole,
              status: 'locked'
            };
            
            setEditedOrder(prev => ({
              ...prev,
              editHistory: [...(prev.editHistory || []), changeLog],
              isLocked: true
            }));
            
            onLockOrder(editedOrder);
            Alert.alert('Locked', 'Order has been locked.');
            onClose();
          }
        }
      ]
    );
  };

  const getStatusBarInfo = () => {
    switch (editStatus) {
      case 'editing':
        return {
          text: 'Editing in progress',
          color: colors.warning,
          icon: 'edit-3'
        };
      case 'pending_approval':
        return {
          text: `Waiting for ${changeRequester === 'tailor' ? 'customer' : 'tailor'} approval`,
          color: colors.primary,
          icon: 'clock'
        };
      case 'ready_to_lock':
        return {
          text: 'Ready to lock',
          color: colors.success,
          icon: 'check-circle'
        };
      default:
        return {
          text: 'No changes',
          color: colors.gray,
          icon: 'info'
        };
    }
  };

  if (!editedOrder) return null;

  const statusInfo = getStatusBarInfo();
  const canEdit = !order.isLocked && editStatus !== 'pending_approval';
  const canRequestChanges = editStatus === 'editing' && !order.isLocked;
  const canApprove = editStatus === 'pending_approval' && changeRequester !== userRole;
  const canLock = (editStatus === 'ready_to_lock' || editStatus === 'idle') && userRole === 'customer' && !order.isLocked;

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: statusInfo.color + '20' }]}>
        <Feather name={statusInfo.icon} size={20} color={statusInfo.color} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
        {/* Measurements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kameez Measurements</Text>
          {['chest', 'shoulder', 'sleeveLength', 'neck', 'kameezLength'].map(key => (
            editedOrder.measurements[key] && (
              <View style={styles.measurementRow} key={key}>
                <Text style={styles.measurementLabel}>{measurementLabels[key]}</Text>
                <TextInput
                  style={[styles.measurementInput, !canEdit && styles.disabledInput]}
                  value={editedOrder.measurements[key]?.toString()}
                  onChangeText={(text) => handleMeasurementChange(key, text)}
                  keyboardType="numeric"
                  editable={canEdit}
                />
                <Text style={styles.unitText}>cm</Text>
              </View>
            )
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shalwar Measurements</Text>
          {['waist', 'hip', 'inseam', 'outseam', 'thigh'].map(key => (
            editedOrder.measurements[key] && (
              <View style={styles.measurementRow} key={key}>
                <Text style={styles.measurementLabel}>{measurementLabels[key]}</Text>
                <TextInput
                  style={[styles.measurementInput, !canEdit && styles.disabledInput]}
                  value={editedOrder.measurements[key]?.toString()}
                  onChangeText={(text) => handleMeasurementChange(key, text)}
                  keyboardType="numeric"
                  editable={canEdit}
                />
                <Text style={styles.unitText}>cm</Text>
              </View>
            )
          ))}
        </View>

        {/* Dupatta Section */}
        {order.suitType === '3-piece' && editedOrder.dupattaDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dupatta Details</Text>
            
            <View style={styles.measurementRow}>
              <Text style={styles.measurementLabel}>Length</Text>
              <TextInput
                style={[styles.measurementInput, !canEdit && styles.disabledInput]}
                value={editedOrder.dupattaDetails.length?.toString()}
                onChangeText={(text) => handleDupattaChange('length', text)}
                keyboardType="numeric"
                editable={canEdit}
              />
              <Text style={styles.unitText}>cm</Text>
            </View>

            <View style={styles.measurementRow}>
              <Text style={styles.measurementLabel}>Width</Text>
              <TextInput
                style={[styles.measurementInput, !canEdit && styles.disabledInput]}
                value={editedOrder.dupattaDetails.width?.toString()}
                onChangeText={(text) => handleDupattaChange('width', text)}
                keyboardType="numeric"
                editable={canEdit}
              />
              <Text style={styles.unitText}>cm</Text>
            </View>

            <View style={styles.pecoRow}>
              <Text style={styles.measurementLabel}>Peco Decoration</Text>
              <Switch
                value={editedOrder.dupattaDetails.hasPeco}
                onValueChange={(value) => handleDupattaChange('hasPeco', value)}
                trackColor={{ false: colors.lightGray, true: colors.primary }}
                thumbColor={editedOrder.dupattaDetails.hasPeco ? colors.white : colors.gray}
                disabled={!canEdit}
              />
            </View>
          </View>
        )}

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design Reference</Text>
          
          <View style={styles.imageBlock}>
            <Text style={styles.imageLabel}>Reference Image</Text>
            {editedOrder.referenceImage?.url ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: editedOrder.referenceImage.url }} 
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                {canEdit && (
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => clearImage('reference')}
                  >
                    <Feather name="x" size={20} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            ) : canEdit ? (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => pickImage('reference')}
              >
                <Feather name="upload" size={20} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noImageText}>No reference image</Text>
            )}
          </View>

          <View style={styles.imageBlock}>
            <Text style={styles.imageLabel}>Customer Sketch</Text>
            {editedOrder.customerSketch?.url ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: editedOrder.customerSketch.url }} 
                  style={styles.imagePreview}
                  resizeMode="contain"
                />
                {canEdit && (
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => clearImage('sketch')}
                  >
                    <Feather name="x" size={20} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            ) : canEdit ? (
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => openCanvas('customer')}
              >
                <Feather name="edit-3" size={20} color={colors.primary} />
                <Text style={styles.uploadButtonText}>Draw Sketch</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noImageText}>No sketch</Text>
            )}
          </View>
        </View>

        {/* Edit History */}
        {editedOrder.editHistory && editedOrder.editHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit History</Text>
            {editedOrder.editHistory.map((log, index) => (
              <View key={index} style={styles.historyItem}>
                <Feather name="clock" size={14} color={colors.gray} />
                <Text style={styles.historyText}>
                  {new Date(log.timestamp).toLocaleString()} - {log.changedBy || log.requestedBy || log.approvedBy || log.lockedBy}: {log.status}
                  {log.note && ` - ${log.note}`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {canEdit && editStatus === 'editing' && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
            <Feather name="save" size={18} color={colors.white} />
            <Text style={styles.saveButtonText}>Save Edit</Text>
          </TouchableOpacity>
        )}

        {canRequestChanges && (
          <TouchableOpacity style={styles.requestButton} onPress={handleRequestChanges}>
            <Feather name="send" size={18} color={colors.white} />
            <Text style={styles.requestButtonText}>Request Changes</Text>
          </TouchableOpacity>
        )}

        {canApprove && (
          <TouchableOpacity style={styles.approveButton} onPress={handleApproveChanges}>
            <Feather name="check" size={18} color={colors.white} />
            <Text style={styles.approveButtonText}>Approve Changes</Text>
          </TouchableOpacity>
        )}

        {canLock && (
          <TouchableOpacity style={styles.lockButton} onPress={handleLockOrder}>
            <Feather name="lock" size={18} color={colors.white} />
            <Text style={styles.lockButtonText}>Lock Order</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas Modal */}
      <Modal
        visible={isCanvasVisible}
        animationType="slide"
        onRequestClose={() => setIsCanvasVisible(false)}
      >
        <DrawingCanvas 
          onSave={handleCanvasSave}
          onClose={() => {
            setIsCanvasVisible(false);
            setSketchType(null);
          }}
          garmentType={order.suitType}
          designNotes=""
        />
      </Modal>

      {/* Change Note Modal */}
      <Modal
        visible={showChangeNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowChangeNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Request Changes</Text>
            <Text style={styles.modalDescription}>
              Add a note explaining the changes you made:
            </Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={4}
              placeholder="Describe your changes..."
              value={changeNote}
              onChangeText={setChangeNote}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowChangeNoteModal(false);
                  setChangeNote('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSubmitButton}
                onPress={submitChangeRequest}
                disabled={!changeNote.trim()}
              >
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
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
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  measurementLabel: {
    fontSize: 14,
    color: colors.black,
    flex: 1
  },
  measurementInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 8,
    width: 80,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: colors.white
  },
  disabledInput: {
    backgroundColor: colors.lightGray,
    color: colors.gray
  },
  unitText: {
    fontSize: 14,
    color: colors.gray,
    width: 30
  },
  pecoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  imageBlock: {
    marginBottom: 16
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
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
    gap: 8
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary
  },
  noImageText: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: 'italic',
    paddingVertical: 12
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8
  },
  historyText: {
    fontSize: 12,
    color: colors.gray,
    flex: 1
  },
  actionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: 12
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8
  },
  requestButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8
  },
  approveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8
  },
  lockButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightGray,
    paddingVertical: 14,
    borderRadius: 8
  },
  closeButtonText: {
    color: colors.black,
    fontSize: 16,
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
    marginBottom: 8
  },
  modalDescription: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16
  },
  noteInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 100
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center'
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white
  }
});

export default CollaborativeOrderEditor;