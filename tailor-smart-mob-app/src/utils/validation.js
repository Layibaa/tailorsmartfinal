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

// ✅ UPDATED: Validation schema for order creation (suit-based)
export const OrderSchema = Yup.object().shape({
  tailorId: Yup.string()
    .required('Tailor is required'),
  suitType: Yup.string()
    .oneOf(['2-piece', '3-piece'], 'Invalid suit type')
    .required('Suit type is required'),
  shalwarStyle: Yup.string()
    .oneOf(['simple', 'patiala', 'gharara', 'capri', 'other'], 'Invalid shalwar style')
    .required('Shalwar style is required'),
  kameezStyle: Yup.string()
    .oneOf(['simple', 'anarkali', 'angrakka', 'a-line', 'other'], 'Invalid kameez style')
    .required('Kameez style is required'),
  notes: Yup.string()
    .max(500, 'Notes are too long (max 500 characters)')
});

// ✅ UPDATED: Validation schema for measurements (suit-based)
export const MeasurementsSchema = {
  '2-piece': Yup.object().shape({
    // Kameez measurements
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
      .required('Neck measurement is required'),
    kameezLength: Yup.number()
      .min(60, 'Kameez length must be at least 60cm')
      .max(150, 'Kameez length cannot exceed 150cm')
      .required('Kameez length is required'),
    // Shalwar measurements
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
  '3-piece': Yup.object().shape({
    // Kameez measurements
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
      .required('Neck measurement is required'),
    kameezLength: Yup.number()
      .min(60, 'Kameez length must be at least 60cm')
      .max(150, 'Kameez length cannot exceed 150cm')
      .required('Kameez length is required'),
    // Shalwar measurements
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
      .required('Thigh measurement is required'),
    // Dupatta measurements
    dupattaLength: Yup.number()
      .min(50, 'Dupatta length must be at least 50cm')
      .max(100, 'Dupatta length cannot exceed 100cm')
      .required('Dupatta length is required'),
    dupattaWidth: Yup.number()
      .min(50, 'Dupatta width must be at least 50cm')
      .max(100, 'Dupatta width cannot exceed 100cm')
      .required('Dupatta width is required')
  })
};

// Validation schema for price input
export const PriceSchema = Yup.object().shape({
  price: Yup.number()
    .min(1, 'Price must be at least 1')
    .required('Price is required')
});

// ✅ UPDATED: Helper to get required measurements for a suit type
// Replace getRequiredMeasurementsForGarment function
export const getRequiredMeasurementsForGarment = (suitType) => {
  // Return ONLY body measurements (same for 2-piece and 3-piece)
  return [
    // Kameez
    'chest', 'shoulder', 'sleeveLength', 'neck', 'kameezLength',
    // Shalwar
    'waist', 'hip', 'inseam', 'outseam', 'thigh'
  ];
};

export const getDupattaRequiredFields = () => {
  return ['dupattaLength', 'dupattaWidth'];
};

// ✅ UPDATED: Measurement labels for UI
export const measurementLabels = {
  // Kameez measurements
  chest: 'Chest Circumference',
  shoulder: 'Shoulder Width',
  sleeveLength: 'Sleeve Length',
  neck: 'Neck Circumference',
  kameezLength: 'Kameez Length',
  // Shalwar measurements
  waist: 'Waist Circumference',
  hip: 'Hip Circumference',
  inseam: 'Inseam Length',
  outseam: 'Outseam Length',
  thigh: 'Thigh Circumference',
  // Dupatta measurements
  dupattaLength: 'Dupatta Length',
  dupattaWidth: 'Dupatta Width'
};

// ✅ UPDATED: Suit type options for UI
export const suitTypeOptions = [
  { label: '2-Piece Suit (Shalwar + Kameez)', value: '2-piece' },
  { label: '3-Piece Suit (Shalwar + Kameez + Dupatta)', value: '3-piece' }
];

// Shalwar style options for UI
export const shalwarStyleOptions = [
  { label: 'Simple', value: 'simple' },
  { label: 'Patiala', value: 'patiala' },
  { label: 'Gharara', value: 'gharara' },
  { label: 'Capri', value: 'capri' },
  { label: 'Other', value: 'other' }
];

// Kameez style options for UI
export const kameezStyleOptions = [
  { label: 'Simple', value: 'simple' },
  { label: 'Anarkali', value: 'anarkali' },
  { label: 'Angrakka', value: 'angrakka' },
  { label: 'A-line', value: 'a-line' },
  { label: 'Other', value: 'other' }
];