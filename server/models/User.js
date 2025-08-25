const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email'
      },
      unique: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'customer', 'tailor'],
        message: '{VALUE} is not supported'
      },
      default: 'customer'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: String,
    otpExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return validator.isMobilePhone(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    tailorProfile: {
      shopName: String,
      shopLocation: String,
      experience: Number,
      specialties: [String],
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      reviews: [
        {
          customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          rating: {
            type: Number,
            min: 1,
            max: 5,
            required: true
          },
          comment: String,
          date: {
            type: Date,
            default: Date.now
          }
        }
      ]
    },
    customerProfile: {
      
      age: Number,
      gender: String,
      weight: Number,
      height: Number,
      
      address: String,
      preferredStyles: [String],
      savedMeasurements: {
        chest: Number,
        waist: Number,
        hip: Number,
        shoulder: Number,
        sleeveLength: Number,
        neck: Number,
        inseam: Number,
        outseam: Number,
        thigh: Number
      }
    }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function() {
  // Only hash password if it's modified
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);