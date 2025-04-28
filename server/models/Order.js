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
        values: ['shirt', 'pants', 'suit', 'dress', 'skirt', 'blouse', 'jacket', 'other'],
        message: '{VALUE} is not a supported garment type'
      }
    },
    measurements: {
      chest: Number,
      waist: Number,
      hip: Number,
      shoulder: Number,
      sleeveLength: Number,
      neck: Number,
      inseam: Number,
      outseam: Number,
      thigh: Number
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'rejected', 'confirmed', 'making', 'payment_done', 'completed'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },
    price: {
      type: Number,
      min: 0
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

// Index for efficient queries
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ tailor: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);