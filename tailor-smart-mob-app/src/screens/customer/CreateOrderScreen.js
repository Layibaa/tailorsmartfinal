import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import { OrderSchema, garmentTypeOptions } from '../../utils/validation';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import { Image } from 'react-native';

const CreateOrderScreen = ({ route, navigation }) => {
  const { tailorId, tailorName } = route.params;
  const [loading, setLoading] = useState(false);

  // Schema for order creation
  const validationSchema = Yup.object({
    garmentType: Yup.string()
      .oneOf(['shirt', 'pants', 'suit', 'dress', 'skirt', 'blazer', 'other'], 'Invalid garment type')
      .required('Garment type is required'),
    notes: Yup.string()
      .max(500, 'Notes are too long (max 500 characters)')
  });

  // Submit order and navigate to measurements screen
  const handleSubmit = (values) => {
    navigation.navigate('Measurements', {
      tailorId,
      tailorName,
      garmentType: values.garmentType,
      notes: values.notes || ''
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Create New Order</Text>
        <Text style={styles.headerSubtitle}>
          For tailor: <Text style={styles.tailorName}>{tailorName}</Text>
        </Text>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoBoxHeader}>
          <Feather name="info" size={20} color={colors.black} style={styles.infoIcon} />
          <Text style={styles.infoTitle}>Order Process</Text>
        </View>
        <Text style={styles.infoText}>
          1. Select garment type and add notes{'\n'}
          2. Enter measurements{'\n'}
          3. Submit order request{'\n'}
          4. Tailor accepts/rejects and sets price{'\n'}
          5. Confirm order after price is set
        </Text>
      </View>

      <Formik
        initialValues={{
          garmentType: '',
          notes: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <View style={styles.formContainer}>
            {/* Garment Type Selection */}
            <Text style={styles.sectionTitle}>Select Garment Type</Text>
            <View style={styles.garmentTypesContainer}>
              {garmentTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.garmentTypeButton,
                    values.garmentType === option.value && styles.selectedGarmentType
                  ]}
                  onPress={() => setFieldValue('garmentType', option.value)}
                >
                  <Text
                    style={[
                      styles.garmentTypeText,
                      values.garmentType === option.value && styles.selectedGarmentTypeText
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {touched.garmentType && errors.garmentType && (
              <Text style={styles.errorText}>{errors.garmentType}</Text>
            )}

            {/* Additional Notes */}
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Input
              multiline
              numberOfLines={4}
              placeholder="Add any special instructions or details here"
              value={values.notes}
              onChangeText={handleChange('notes')}
              onBlur={handleBlur('notes')}
              error={touched.notes && errors.notes}
              iconName="file-text"
            />



            {/* Navigation Buttons */}
            <View style={styles.buttonsContainer}>
              <Button
                title="Next: Enter Measurements"
                onPress={handleSubmit}
                icon="arrow-right"
                iconPosition="right"
                loading={loading}
              />
              <Button
                title="Cancel"
                onPress={() => navigation.goBack()}
                outline
                buttonStyle={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
            </View>
          </View>
        )}
      </Formik>
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
  headerContainer: {
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray
  },
  tailorName: {
    fontWeight: '600',
    color: colors.black
  },
  infoBox: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  infoIcon: {
    marginRight: 8
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  infoText: {
    color: colors.darkGray,
    lineHeight: 22
  },
  formContainer: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12
  },
  garmentTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  garmentTypeButton: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10
  },
  selectedGarmentType: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  garmentTypeText: {
    color: colors.black,
    fontWeight: '500'
  },
  selectedGarmentTypeText: {
    color: colors.white
  },
  errorText: {
    color: colors.error,
    marginBottom: 12
  },
  garmentImagesContainer: {
    marginTop: 16,
    marginBottom: 24
  },
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  garmentImage: {
    width: '48%',
    height: 150,
    borderRadius: 8
  },
  buttonsContainer: {
    marginTop: 16
  },
  cancelButton: {
    marginTop: 12
  },
  cancelButtonText: {
    color: colors.black
  }
}); 

export default CreateOrderScreen;
