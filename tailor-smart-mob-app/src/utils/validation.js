import * as Yup from 'yup';

// Validation schema for login
export const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

// Validation schema for customer registration
export const CustomerSignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  age: Yup.number()
    .min(16, 'You must be at least 16 years old')
    .max(100, 'Age cannot exceed 100')
    .required('Age is required'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
    .required('Gender is required'),
  weight: Yup.number()
    .min(30, 'Weight must be at least 30kg')
    .max(250, 'Weight cannot exceed 250kg')
    .required('Weight is required'),
  height: Yup.number()
    .min(100, 'Height must be at least 100cm')
    .max(250, 'Height cannot exceed 250cm')
    .required('Height is required')
});

// Validation schema for tailor registration
export const TailorSignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  shopName: Yup.string()
    .min(3, 'Shop name must be at least 3 characters')
    .required('Shop name is required'),
  shopLocation: Yup.string()
    .min(5, 'Shop location must be at least 5 characters')
    .required('Shop location is required'),
  averagePrice: Yup.number()
    .min(10, 'Average price must be at least 10')
    .required('Average price is required')
});

// Validation schema for message
export const MessageSchema = Yup.object().shape({
  content: Yup.string()
    .required('Message content is required')
    .min(1, 'Message cannot be empty')
    .max(500, 'Message is too long (max 500 characters)')
});

// Validation schema for order creation
export const OrderSchema = Yup.object().shape({
  tailorId: Yup.string()
    .required('Tailor is required'),
  garmentType: Yup.string()
    .oneOf(['shirt', 'pants', 'suit', 'dress', 'skirt', 'blazer', 'other'], 'Invalid garment type')
    .required('Garment type is required'),
  notes: Yup.string()
    .max(500, 'Notes are too long (max 500 characters)')
});

// Validation schema for measurements
export const MeasurementsSchema = {
  shirt: Yup.object().shape({
    chest: Yup.number()
      .min(50, 'Chest measurement must be at least 50cm')
      .max(200, 'Chest measurement cannot exceed 200cm')
      .required('Chest measurement is required'),
    shoulder: Yup.number()
      .min(30, 'Shoulder measurement must be at least 30cm')
      .max(100, 'Shoulder measurement cannot exceed 100cm')
      .required('Shoulder measurement is required'),
    sleeveLength: Yup.number()
      .min(40, 'Sleeve length must be at least 40cm')
      .max(100, 'Sleeve length cannot exceed 100cm')
      .required('Sleeve length is required'),
    neck: Yup.number()
      .min(25, 'Neck measurement must be at least 25cm')
      .max(70, 'Neck measurement cannot exceed 70cm')
      .required('Neck measurement is required')
  }),
  pants: Yup.object().shape({
    waist: Yup.number()
      .min(50, 'Waist measurement must be at least 50cm')
      .max(200, 'Waist measurement cannot exceed 200cm')
      .required('Waist measurement is required'),
    hip: Yup.number()
      .min(70, 'Hip measurement must be at least 70cm')
      .max(200, 'Hip measurement cannot exceed 200cm')
      .required('Hip measurement is required'),
    inseam: Yup.number()
      .min(50, 'Inseam measurement must be at least 50cm')
      .max(120, 'Inseam measurement cannot exceed 120cm')
      .required('Inseam measurement is required'),
    outseam: Yup.number()
      .min(70, 'Outseam measurement must be at least 70cm')
      .max(150, 'Outseam measurement cannot exceed 150cm')
      .required('Outseam measurement is required'),
    thigh: Yup.number()
      .min(40, 'Thigh measurement must be at least 40cm')
      .max(100, 'Thigh measurement cannot exceed 100cm')
      .required('Thigh measurement is required')
  }),
  suit: Yup.object().shape({
    chest: Yup.number()
      .min(50, 'Chest measurement must be at least 50cm')
      .max(200, 'Chest measurement cannot exceed 200cm')
      .required('Chest measurement is required'),
    shoulder: Yup.number()
      .min(30, 'Shoulder measurement must be at least 30cm')
      .max(100, 'Shoulder measurement cannot exceed 100cm')
      .required('Shoulder measurement is required'),
    sleeveLength: Yup.number()
      .min(40, 'Sleeve length must be at least 40cm')
      .max(100, 'Sleeve length cannot exceed 100cm')
      .required('Sleeve length is required'),
    waist: Yup.number()
      .min(50, 'Waist measurement must be at least 50cm')
      .max(200, 'Waist measurement cannot exceed 200cm')
      .required('Waist measurement is required'),
    hip: Yup.number()
      .min(70, 'Hip measurement must be at least 70cm')
      .max(200, 'Hip measurement cannot exceed 200cm')
      .required('Hip measurement is required'),
    inseam: Yup.number()
      .min(50, 'Inseam measurement must be at least 50cm')
      .max(120, 'Inseam measurement cannot exceed 120cm')
      .required('Inseam measurement is required')
  }),
  dress: Yup.object().shape({
    chest: Yup.number()
      .min(50, 'Chest measurement must be at least 50cm')
      .max(200, 'Chest measurement cannot exceed 200cm')
      .required('Chest measurement is required'),
    waist: Yup.number()
      .min(50, 'Waist measurement must be at least 50cm')
      .max(200, 'Waist measurement cannot exceed 200cm')
      .required('Waist measurement is required'),
    hip: Yup.number()
      .min(70, 'Hip measurement must be at least 70cm')
      .max(200, 'Hip measurement cannot exceed 200cm')
      .required('Hip measurement is required'),
    shoulder: Yup.number()
      .min(30, 'Shoulder measurement must be at least 30cm')
      .max(100, 'Shoulder measurement cannot exceed 100cm')
      .required('Shoulder measurement is required'),
    sleeveLength: Yup.number()
      .min(0, 'Sleeve length cannot be negative')
      .max(100, 'Sleeve length cannot exceed 100cm')
  }),
  skirt: Yup.object().shape({
    waist: Yup.number()
      .min(50, 'Waist measurement must be at least 50cm')
      .max(200, 'Waist measurement cannot exceed 200cm')
      .required('Waist measurement is required'),
    hip: Yup.number()
      .min(70, 'Hip measurement must be at least 70cm')
      .max(200, 'Hip measurement cannot exceed 200cm')
      .required('Hip measurement is required')
  }),
  blazer: Yup.object().shape({
    chest: Yup.number()
      .min(50, 'Chest measurement must be at least 50cm')
      .max(200, 'Chest measurement cannot exceed 200cm')
      .required('Chest measurement is required'),
    shoulder: Yup.number()
      .min(30, 'Shoulder measurement must be at least 30cm')
      .max(100, 'Shoulder measurement cannot exceed 100cm')
      .required('Shoulder measurement is required'),
    sleeveLength: Yup.number()
      .min(40, 'Sleeve length must be at least 40cm')
      .max(100, 'Sleeve length cannot exceed 100cm')
      .required('Sleeve length is required'),
    waist: Yup.number()
      .min(50, 'Waist measurement must be at least 50cm')
      .max(200, 'Waist measurement cannot exceed 200cm')
      .required('Waist measurement is required')
  }),
  other: Yup.object().shape({
    chest: Yup.number()
      .min(50, 'Chest measurement must be at least 50cm')
      .max(200, 'Chest measurement cannot exceed 200cm'),
    waist: Yup.number()
      .min(50, 'Waist measurement must be at least 50cm')
      .max(200, 'Waist measurement cannot exceed 200cm'),
    hip: Yup.number()
      .min(70, 'Hip measurement must be at least 70cm')
      .max(200, 'Hip measurement cannot exceed 200cm'),
    shoulder: Yup.number()
      .min(30, 'Shoulder measurement must be at least 30cm')
      .max(100, 'Shoulder measurement cannot exceed 100cm'),
    sleeveLength: Yup.number()
      .min(0, 'Sleeve length cannot be negative')
      .max(100, 'Sleeve length cannot exceed 100cm'),
    neck: Yup.number()
      .min(25, 'Neck measurement must be at least 25cm')
      .max(70, 'Neck measurement cannot exceed 70cm'),
    inseam: Yup.number()
      .min(0, 'Inseam measurement cannot be negative')
      .max(120, 'Inseam measurement cannot exceed 120cm'),
    outseam: Yup.number()
      .min(0, 'Outseam measurement cannot be negative')
      .max(150, 'Outseam measurement cannot exceed 150cm'),
    thigh: Yup.number()
      .min(0, 'Thigh measurement cannot be negative')
      .max(100, 'Thigh measurement cannot exceed 100cm')
  })
};

// Validation schema for price input
export const PriceSchema = Yup.object().shape({
  price: Yup.number()
    .min(1, 'Price must be at least 1')
    .required('Price is required')
});

// Helper to get required measurements for a garment type
export const getRequiredMeasurementsForGarment = (garmentType) => {
  switch (garmentType) {
    case 'shirt':
      return ['chest', 'shoulder', 'sleeveLength', 'neck'];
    case 'pants':
      return ['waist', 'hip', 'inseam', 'outseam', 'thigh'];
    case 'suit':
      return ['chest', 'shoulder', 'sleeveLength', 'waist', 'hip', 'inseam'];
    case 'dress':
      return ['chest', 'waist', 'hip', 'shoulder', 'sleeveLength'];
    case 'skirt':
      return ['waist', 'hip'];
    case 'blazer':
      return ['chest', 'shoulder', 'sleeveLength', 'waist'];
    case 'other':
      return ['chest', 'waist', 'hip', 'shoulder', 'sleeveLength', 'neck', 'inseam', 'outseam', 'thigh'];
    default:
      return [];
  }
};

// Measurement labels for UI
export const measurementLabels = {
  chest: 'Chest Circumference (cm)',
  waist: 'Waist Circumference (cm)',
  hip: 'Hip Circumference (cm)',
  shoulder: 'Shoulder Width (cm)',
  sleeveLength: 'Sleeve Length (cm)',
  neck: 'Neck Circumference (cm)',
  inseam: 'Inseam Length (cm)',
  outseam: 'Outseam Length (cm)',
  thigh: 'Thigh Circumference (cm)'
};

// Garment type options for UI
export const garmentTypeOptions = [
  { label: 'Shirt', value: 'shirt' },
  { label: 'Pants', value: 'pants' },
  { label: 'Suit', value: 'suit' },
  { label: 'Dress', value: 'dress' },
  { label: 'Skirt', value: 'skirt' },
  { label: 'Blazer', value: 'blazer' },
  { label: 'Other', value: 'other' }
];
