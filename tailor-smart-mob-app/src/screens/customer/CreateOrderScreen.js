import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import colors from '../../styles/colors';

const CreateOrderScreen = ({ route, navigation }) => {
  const { tailorId, tailorName } = route.params;
  const [loading, setLoading] = useState(false);

  const garmentTypes = [
    { value: 'shalwar', label: 'Shalwar' },
    { value: 'kameez', label: 'Kameez' },
  ];

  const shalwarStyles = [
    { value: 'simple', label: 'Simple' },
    { value: 'patiala', label: 'Patiala' },
    { value: 'gharara', label: 'Gharara' },
    { value: 'capri', label: 'Capri' },
    { value: 'other', label: 'Other' },
  ];

  const kameezStyles = [
    { value: 'simple', label: 'Simple' },
    { value: 'anarkali', label: 'Anarkali' },
    { value: 'angrakka', label: 'Angrakka' },
    { value: 'a-line', label: 'A-Line' },
    { value: 'other', label: 'Other' },
  ];

  const validationSchema = Yup.object({
    garmentType: Yup.string()
      .oneOf(['shalwar', 'kameez'], 'Please select a garment type')
      .required('Garment type is required'),
    style: Yup.string()
      .when('garmentType', {
        is: 'shalwar',
        then: () => Yup.string()
          .oneOf(['simple', 'patiala', 'gharara', 'capri', 'other'])
          .required('Shalwar style is required'),
        otherwise: () => Yup.string()
          .when('garmentType', {
            is: 'kameez',
            then: () => Yup.string()
              .oneOf(['simple', 'anarkali', 'angrakka', 'a-line', 'other'])
              .required('Kameez style is required'),
            otherwise: () => Yup.string()
          })
      }),
    notes: Yup.string()
      .max(500, 'Notes are too long (max 500 characters)')
  });

  const handleSubmit = (values) => {
    const orderData = {
      tailorId,
      tailorName,
      garmentType: values.garmentType,
      [values.garmentType === 'shalwar' ? 'shalwarStyle' : 'kameezStyle']: values.style,
      notes: values.notes || ''
    };

    navigation.navigate('Measurements', orderData);
  };

  return (
    <View style={{ flex: 1 }}>
   <KeyboardAvoidingView 
  style={styles.container}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
  <ScrollView
  style={styles.scrollView}
  contentContainerStyle={styles.contentContainer}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={true} // ✅ show scrollbar
  persistentScrollbar={true} // ✅ keeps it visible while scrolling
  nestedScrollEnabled={true} // ✅ improves nested scrolling in some Android cases
>

    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Create New Order</Text>
      <Text style={styles.headerSubtitle}>
        For tailor: <Text style={styles.tailorName}>{tailorName}</Text>
      </Text>
    </View>

    <Formik
      initialValues={{
        garmentType: '',
        style: '',
        notes: ''
      }}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Select Garment Type</Text>
          <View style={styles.garmentTypesContainer}>
            {garmentTypes.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.garmentTypeButton,
                  values.garmentType === option.value && styles.selectedGarmentType
                ]}
                onPress={() => {
                  setFieldValue('garmentType', option.value);
                  setFieldValue('style', '');
                }}
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

          {values.garmentType && (
            <>
              <Text style={styles.sectionTitle}>
                Select {values.garmentType === 'shalwar' ? 'Shalwar' : 'Kameez'} Style
              </Text>
              <View style={styles.garmentTypesContainer}>
                {(values.garmentType === 'shalwar' ? shalwarStyles : kameezStyles).map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.garmentTypeButton,
                      values.style === option.value && styles.selectedGarmentType
                    ]}
                    onPress={() => setFieldValue('style', option.value)}
                  >
                    <Text
                      style={[
                        styles.garmentTypeText,
                        values.style === option.value && styles.selectedGarmentTypeText
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

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
</KeyboardAvoidingView>
</View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  }, 
scrollView: {
  backgroundColor: colors.white,
},

contentContainer: {
  flexGrow: 1,          // ✅ ensures content takes available space
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 120,   // ✅ space for buttons + keyboard
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
  formContainer: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12,
    marginTop: 16
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
  buttonsContainer: {
    marginTop: 24
  },
  cancelButton: {
    marginTop: 12
  },
  cancelButtonText: {
    color: colors.black
  }
});

export default CreateOrderScreen;