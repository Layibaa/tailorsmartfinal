// server/models/Order.js - REMOVED PRICE NEGOTIATION
const mongoose = require('mongoose');

// CREATE EXPLICIT MEASUREMENT SCHEMA
const MeasurementSchema = new mongoose.Schema({
  // Kameez measurements
  chest: { 
    type: Number, 
    required: [true, 'Chest measurement is required'],
    min: [50, 'Chest must be at least 50cm'],
    max: [200, 'Chest cannot exceed 200cm']
  },
  shoulder: { 
    type: Number, 
    required: [true, 'Shoulder measurement is required'],
    min: [30, 'Shoulder must be at least 30cm'],
    max: [100, 'Shoulder cannot exceed 100cm']
  },
  sleeveLength: { 
    type: Number, 
    required: [true, 'Sleeve length is required'],
    min: [40, 'Sleeve length must be at least 40cm'],
    max: [100, 'Sleeve length cannot exceed 100cm']
  },
  neck: { 
    type: Number, 
    required: [true, 'Neck measurement is required'],
    min: [25, 'Neck must be at least 25cm'],
    max: [70, 'Neck cannot exceed 70cm']
  },
  kameezLength: { 
    type: Number, 
    required: [true, 'Kameez length is required'],
    min: [60, 'Kameez length must be at least 60cm'],
    max: [150, 'Kameez length cannot exceed 150cm']
  },
  
  // Shalwar measurements
  waist: { 
    type: Number, 
    required: [true, 'Waist measurement is required'],
    min: [50, 'Waist must be at least 50cm'],
    max: [200, 'Waist cannot exceed 200cm']
  },
  hip: { 
    type: Number, 
    required: [true, 'Hip measurement is required'],
    min: [70, 'Hip must be at least 70cm'],
    max: [200, 'Hip cannot exceed 200cm']
  },
  inseam: { 
    type: Number, 
    required: [true, 'Inseam is required'],
    min: [50, 'Inseam must be at least 50cm'],
    max: [120, 'Inseam cannot exceed 120cm']
  },
  outseam: { 
    type: Number, 
    required: [true, 'Outseam is required'],
    min: [70, 'Outseam must be at least 70cm'],
    max: [150, 'Outseam cannot exceed 150cm']
  },
  thigh: { 
    type: Number, 
    required: [true, 'Thigh measurement is required'],
    min: [40, 'Thigh must be at least 40cm'],
    max: [100, 'Thigh cannot exceed 100cm']
  }
}, { _id: false });

// CREATE EXPLICIT DUPATTA SCHEMA
const DupattaDetailsSchema = new mongoose.Schema({
  length: { 
    type: Number, 
    required: [true, 'Dupatta length is required for 3-piece'],
    min: [200, 'Dupatta length must be at least 200cm'],
    max: [350, 'Dupatta length cannot exceed 350cm']
  },
  width: { 
    type: Number, 
    required: [true, 'Dupatta width is required for 3-piece'],
    min: [70, 'Dupatta width must be at least 70cm'],
    max: [150, 'Dupatta width cannot exceed 150cm']
  },
  hasPeco: { 
    type: Boolean, 
    default: false 
  }
}, { _id: false });

// MAIN ORDER SCHEMA - REMOVED PRICE NEGOTIATION FIELDS
const OrderSchema = new mongoose.Schema(
  {
    estimatedDeliveryDays: {
      type: Number,
      min: 0,
      default: null
    },
    deliveryConfidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    expectedCompletionDate: Date,
    actualCompletionDate: {
      type: Date,
      default: null
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    tailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tailor ID is required']
    },
    suitType: {
      type: String,
      required: [true, 'Suit type is required'],
      enum: {
        values: ['2-piece', '3-piece'],
        message: '{VALUE} is not a supported suit type'
      }
    },
    shalwarStyle: {
      type: String,
      enum: {
        values: ['simple', 'patiala', 'gharara', 'capri', 'other'],
        message: '{VALUE} is not a supported shalwar style'
      },
      required: true
    },
    kameezStyle: {
      type: String,
      enum: {
        values: ['simple', 'anarkali', 'angrakka', 'a-line', 'other'],
        message: '{VALUE} is not a supported kameez style'
      },
      required: true
    },
    
    measurements: {
      type: MeasurementSchema,
      required: [true, 'Measurements are required']
    },
    
    dupattaDetails: {
      type: DupattaDetailsSchema,
      default: null
    },
    
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'confirmed', 'making', 'payment_done', 'completed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },
    isLocked: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      min: 0,
      default: 0
    },
    notes: {
      type: String,
      maxlength: 500
    },
    referenceImage: {
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date }
    },
    customerSketch: {
      url: { type: String },
      publicId: { type: String },
      uploadedAt: { type: Date }
    },
    timeline: [
      {
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected', 'confirmed', 'making', 'payment_done', 'completed']
        },
        date: {
          type: Date,
          default: Date.now
        },
        notes: String
      }
    ],
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    paymentMethod: String,
    deliveryMethod: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'pickup'
    },
    deliveryAddress: String
  },
  { timestamps: true }
);

// Pre-save middleware
OrderSchema.pre('save', function(next) {
  console.log('💾 PRE-SAVE HOOK - Order data:', {
    id: this._id,
    suitType: this.suitType,
    hasMeasurements: !!this.measurements,
    measurements: this.measurements,
    measurementKeys: this.measurements ? Object.keys(this.measurements.toObject()) : [],
    hasDupatta: !!this.dupattaDetails,
    dupattaDetails: this.dupattaDetails
  });
  
  if (this.isModified('status') && this.status === 'completed' && !this.actualCompletionDate) {
    this.actualCompletionDate = new Date();
  }
  
  if (this.isNew || this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      date: new Date(),
      notes: `Order ${this.isNew ? 'created' : 'updated'} with status: ${this.status}`
    });
  }
  
  next();
});

// Method to calculate delivery accuracy
OrderSchema.methods.getDeliveryAccuracy = function() {
  if (!this.actualCompletionDate || !this.expectedCompletionDate) {
    return null;
  }
  
  const expectedTime = this.expectedCompletionDate.getTime();
  const actualTime = this.actualCompletionDate.getTime();
  const diffDays = Math.abs((actualTime - expectedTime) / (1000 * 60 * 60 * 24));
  
  return {
    wasOnTime: actualTime <= expectedTime,
    differenceInDays: Math.round(diffDays),
    expectedDate: this.expectedCompletionDate,
    actualDate: this.actualCompletionDate
  };
};

// Indexes
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ tailor: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ isLocked: 1 });

module.exports = mongoose.model('Order', OrderSchema);