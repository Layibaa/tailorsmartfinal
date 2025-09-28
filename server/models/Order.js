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
    // ✅ Fixed: Match frontend field names exactly
    measurements: {
      chest: { type: Number, min: 0 },
      waist: { type: Number, min: 0 },
      shoulder: { type: Number, min: 0 },
      length: { type: Number, min: 0 },     // ✅ 'length' not 'sleeveLength'
      sleeve: { type: Number, min: 0 },     // ✅ 'sleeve' not 'neck', 'inseam', etc.
      // Removed unused fields that don't match frontend
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'confirmed', 'making', 'payment_done', 'completed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },
    // ✅ Lock field - this is crucial for the functionality
    isLocked: {
      type: Boolean,
      default: false
    },
    price: {
      type: Number,
      min: 0,
      default: 0  // ✅ Added default value
    },
    notes: {
      type: String,
      maxlength: 500
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

// Pre-save middleware to update timeline
OrderSchema.pre('save', function(next) {
  // If this is a new order or status has changed
  if (this.isNew || this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      date: new Date(),
      notes: `Order ${this.isNew ? 'created' : 'updated'} with status: ${this.status}`
    });
  }
  next();
});

// Indexes for efficient queries
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ tailor: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ isLocked: 1 }); // ✅ Added index for lock queries

module.exports = mongoose.model('Order', OrderSchema);