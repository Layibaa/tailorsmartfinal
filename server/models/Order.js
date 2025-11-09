const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
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
    garmentType: {
      type: String,
      required: [true, 'Garment type is required'],
      enum: {
        values: ['shalwar', 'kameez'],
        message: '{VALUE} is not a supported garment type'
      }
    },
    shalwarStyle: {
      type: String,
      enum: {
        values: ['simple', 'patiala', 'gharara', 'capri', 'other'],
        message: '{VALUE} is not a supported shalwar style'
      }
    },
    kameezStyle: {
      type: String,
      enum: {
        values: ['simple', 'anarkali', 'angrakka', 'a-line', 'other'],
        message: '{VALUE} is not a supported kameez style'
      }
    },
    measurements: {
      chest: { type: Number, min: 0 },
      waist: { type: Number, min: 0 },
      shoulder: { type: Number, min: 0 },
      length: { type: Number, min: 0 },
      sleeve: { type: Number, min: 0 },
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
    
    // ✨ NEW: Delivery Time Prediction Fields
    estimatedCompletionDate: {
      type: Date
    },
    predictionConfidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    actualCompletionDate: {
      type: Date
    },
    predictionAccuracy: {
      type: Number, // Percentage (0-100)
      min: 0,
      max: 100
    },
    complexityScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    predictionFactors: {
      tailorWorkload: Number,
      avgCompletionTime: Number,
      complexityAdjustment: Number,
      historicalAccuracy: Number
    },
    
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

// Pre-save middleware to update timeline and calculate prediction accuracy
OrderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      date: new Date(),
      notes: `Order ${this.isNew ? 'created' : 'updated'} with status: ${this.status}`
    });
    
    // ✨ NEW: Calculate accuracy when order is completed
    if (this.status === 'completed' && !this.actualCompletionDate) {
      this.actualCompletionDate = new Date();
      
      if (this.estimatedCompletionDate) {
        const estimatedTime = this.estimatedCompletionDate.getTime();
        const actualTime = this.actualCompletionDate.getTime();
        const difference = Math.abs(actualTime - estimatedTime);
        const daysDifference = difference / (1000 * 60 * 60 * 24);
        
        // Calculate accuracy (100% if within 1 day, decreasing by 10% per day difference)
        this.predictionAccuracy = Math.max(0, 100 - (daysDifference * 10));
      }
    }
  }
  next();
});

// Indexes for efficient queries
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ tailor: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ isLocked: 1 });
OrderSchema.index({ tailor: 1, status: 1 });
OrderSchema.index({ estimatedCompletionDate: 1 });

module.exports = mongoose.model('Order', OrderSchema);