import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Input from '../ui/Input';
import Button from '../ui/Button';
import colors from '../../styles/colors';
import { measurementLabels, getRequiredMeasurementsForGarment } from '../../utils/validation';

const MeasurementEditor = ({ 
  measurements, 
  onSave, 
  onCancel, 
  garmentType,
  userRole 
}) => {
  const [editedMeasurements, setEditedMeasurements] = useState(measurements);
  const [errors, setErrors] = useState({});

  const requiredFields = getRequiredMeasurementsForGarment(garmentType);

  const handleChange = (field, value) => {
    const numValue = parseFloat(value);
    setEditedMeasurements(prev => ({
      ...prev,
      [field]: numValue
    }));
    
    // Validate
    if (isNaN(numValue) || numValue < 20 || numValue > 200) {
      setErrors(prev => ({
        ...prev,
        [field]: 'Must be between 20-200 cm'
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    // Check for missing required fields
    const missingFields = requiredFields.filter(
      field => !editedMeasurements[field] || isNaN(editedMeasurements[field])
    );

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Measurements',
        `Please fill in: ${missingFields.map(f => measurementLabels[f]).join(', ')}`
      );
      return;
    }

    if (Object.keys(errors).length > 0) {
      Alert.alert('Invalid Values', 'Please fix the errors before saving');
      return;
    }

    onSave(editedMeasurements);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="edit-3" size={20} color={colors.primary} />
        <Text style={styles.headerText}>Edit Measurements</Text>
      </View>

      <Text style={styles.infoText}>
        {userRole === 'customer' 
          ? 'Update measurements and notify the tailor of changes'
          : 'Suggest measurement adjustments to the customer'}
      </Text>

      <ScrollView 
        style={styles.fieldsContainer}
        showsVerticalScrollIndicator={false}
      >
        {requiredFields.map(field => (
          <View key={field} style={styles.fieldWrapper}>
            <Input
              label={measurementLabels[field]}
              value={editedMeasurements[field]?.toString() || ''}
              onChangeText={(text) => {
                const sanitized = text.replace(/[^0-9.]/g, '');
                handleChange(field, sanitized);
              }}
              keyboardType="decimal-pad"
              error={errors[field]}
              placeholder="Enter value"
              iconName="maximize"
              rightText="cm"
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          icon="check"
          disabled={Object.keys(errors).length > 0}
        />
        <Button
          title="Cancel"
          onPress={onCancel}
          outline
          icon="x"
          buttonStyle={styles.cancelButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    marginVertical: 8
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black
  },
  infoText: {
    fontSize: 13,
    color: colors.gray,
    marginBottom: 16,
    lineHeight: 18
  },
  fieldsContainer: {
    maxHeight: 400
  },
  fieldWrapper: {
    marginBottom: 12
  },
  buttonContainer: {
    marginTop: 16,
    gap: 12
  },
  cancelButton: {
    marginTop: 0
  }
});

export default MeasurementEditor;