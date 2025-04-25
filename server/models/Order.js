const mongoose = require('mongoose');

// Measurements schema
const MeasurementsSchema = new mongoose.Schema({
  chest: {
    type: String,
    trim: true
  },
  waist: {
    type: String,
    trim: true
  },
  hips: {
    type: String,
    trim: true
  },
  inseam: {
    type: String,
    trim: true
  },
  sleeve: {
    type: String,
    trim: true
  },
  shoulder: {
    type: String,
    trim: true
  },
  length: {
    type: String,
    trim: true
  },
  neck: {
    type: String,
    trim: true
  },
  other: {
    type: String,
    trim: true
  }
});

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    garmentType: {
      type: String,
      required: [true, 'Please specify the garment type'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true
    },
    measurements: {
      type: MeasurementsSchema,
      default: {}
    },
    fabricImage: {
      type: String
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Pending'
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    isMeasurementsLocked: {
      type: Boolean,
      default: false
    },
    completedDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Add index for faster lookups
OrderSchema.index({ customer: 1, status: 1 });
OrderSchema.index({ tailor: 1, status: 1 }); 

// Update order completed date when status changes to completed
OrderSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Completed' && !this.completedDate) {
    this.completedDate = Date.now();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
