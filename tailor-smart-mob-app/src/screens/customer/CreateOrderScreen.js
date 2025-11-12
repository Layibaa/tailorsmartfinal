// ✅ UPDATED: CreateOrderScreen.js - Suit-based ordering
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

  const suitTypes = [
    { value: '2-piece', label: '2-Piece Suit', description: 'Shalwar + Kameez' },
    { value: '3-piece', label: '3-Piece Suit', description: 'Shalwar + Kameez + Dupatta' },
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
    suitType: Yup.string()
      .oneOf(['2-piece', '3-piece'], 'Please select a suit type')
      .required('Suit type is required'),
    shalwarStyle: Yup.string()
      .oneOf(['simple', 'patiala', 'gharara', 'capri', 'other'])
      .required('Shalwar style is required'),
    kameezStyle: Yup.string()
      .oneOf(['simple', 'anarkali', 'angrakka', 'a-line', 'other'])
      .required('Kameez style is required'),
    notes: Yup.string()
      .max(500, 'Notes are too long (max 500 characters)')
  });

  const handleSubmit = (values) => {
    const orderData = {
      tailorId,
      tailorName,
      suitType: values.suitType,
      shalwarStyle: values.shalwarStyle,
      kameezStyle: values.kameezStyle,
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
          showsVerticalScrollIndicator={true}
          persistentScrollbar={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Create New Order</Text>
            <Text style={styles.headerSubtitle}>
              For tailor: <Text style={styles.tailorName}>{tailorName}</Text>
            </Text>
          </View>

          <Formik
            initialValues={{
              suitType: '',
              shalwarStyle: '',
              kameezStyle: '',
              notes: ''
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
              <View style={styles.formContainer}>
                {/* Suit Type Selection */}
                <Text style={styles.sectionTitle}>Select Suit Type</Text>
                <View style={styles.suitTypesContainer}>
                  {suitTypes.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.suitTypeCard,
                        values.suitType === option.value && styles.selectedSuitType
                      ]}
                      onPress={() => setFieldValue('suitType', option.value)}
                    >
                      <View style={styles.suitTypeHeader}>
                        <Text
                          style={[
                            styles.suitTypeLabel,
                            values.suitType === option.value && styles.selectedSuitTypeText
                          ]}
                        >
                          {option.label}
                        </Text>
                        {values.suitType === option.value && (
                          <Feather name="check-circle" size={24} color={colors.white} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.suitTypeDescription,
                          values.suitType === option.value && styles.selectedSuitTypeDescription
                        ]}
                      >
                        {option.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {touched.suitType && errors.suitType && (
                  <Text style={styles.errorText}>{errors.suitType}</Text>
                )}

                {values.suitType && (
                  <>
                    {/* Shalwar Style Selection */}
                    <Text style={styles.sectionTitle}>Select Shalwar Style</Text>
                    <View style={styles.styleButtonsContainer}>
                      {shalwarStyles.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.styleButton,
                            values.shalwarStyle === option.value && styles.selectedStyleButton
                          ]}
                          onPress={() => setFieldValue('shalwarStyle', option.value)}
                        >
                          <Text
                            style={[
                              styles.styleButtonText,
                              values.shalwarStyle === option.value && styles.selectedStyleButtonText
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {touched.shalwarStyle && errors.shalwarStyle && (
                      <Text style={styles.errorText}>{errors.shalwarStyle}</Text>
                    )}

                    {/* Kameez Style Selection */}
                    <Text style={styles.sectionTitle}>Select Kameez Style</Text>
                    <View style={styles.styleButtonsContainer}>
                      {kameezStyles.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.styleButton,
                            values.kameezStyle === option.value && styles.selectedStyleButton
                          ]}
                          onPress={() => setFieldValue('kameezStyle', option.value)}
                        >
                          <Text
                            style={[
                              styles.styleButtonText,
                              values.kameezStyle === option.value && styles.selectedStyleButtonText
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {touched.kameezStyle && errors.kameezStyle && (
                      <Text style={styles.errorText}>{errors.kameezStyle}</Text>
                    )}
                  </>
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
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
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
  suitTypesContainer: {
    gap: 12,
    marginBottom: 16
  },
  suitTypeCard: {
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.white
  },
  selectedSuitType: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  suitTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  suitTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black
  },
  selectedSuitTypeText: {
    color: colors.white
  },
  suitTypeDescription: {
    fontSize: 14,
    color: colors.gray
  },
  selectedSuitTypeDescription: {
    color: colors.white,
    opacity: 0.9
  },
  styleButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 10
  },
  styleButton: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.white
  },
  selectedStyleButton: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  styleButtonText: {
    color: colors.black,
    fontWeight: '500',
    fontSize: 14
  },
  selectedStyleButtonText: {
    color: colors.white
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12
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