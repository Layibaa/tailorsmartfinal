const mongoose = require('mongoose');

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
    // ✅ UPDATED: Changed to suit type
    suitType: {
      type: String,
      required: [true, 'Suit type is required'],
      enum: {
        values: ['2-piece', '3-piece'],
        message: '{VALUE} is not a supported suit type'
      }
    },
    // ✅ NEW: Shalwar style
    shalwarStyle: {
      type: String,
      enum: {
        values: ['simple', 'patiala', 'gharara', 'capri', 'other'],
        message: '{VALUE} is not a supported shalwar style'
      },
      required: true
    },
    // ✅ NEW: Kameez style
    kameezStyle: {
      type: String,
      enum: {
        values: ['simple', 'anarkali', 'angrakka', 'a-line', 'other'],
        message: '{VALUE} is not a supported kameez style'
      },
      required: true
    },
    // ✅ NEW: Dupatta details (for 3-piece only)
    dupattaDetails: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      hasPeco: { type: Boolean, default: false }
    },
    // ✅ UPDATED: Combined measurements for shalwar and kameez
    measurements: {
      // Kameez measurements
      chest: { type: Number, min: 0 },
      shoulder: { type: Number, min: 0 },
      sleeveLength: { type: Number, min: 0 },
      neck: { type: Number, min: 0 },
      kameezLength: { type: Number, min: 0 },
      // Shalwar measurements
      waist: { type: Number, min: 0 },
      hip: { type: Number, min: 0 },
      inseam: { type: Number, min: 0 },
      outseam: { type: Number, min: 0 },
      thigh: { type: Number, min: 0 }
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
    expectedCompletionDate: Date,
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

// Pre-save middleware to track actual completion
OrderSchema.pre('save', function(next) {
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

// Indexes for efficient queries
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ tailor: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ isLocked: 1 });

module.exports = mongoose.model('Order', OrderSchema);