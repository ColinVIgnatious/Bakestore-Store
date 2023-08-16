const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  discountType: {
    type: String,
    enum: ['Percentage', 'Fixed'],
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
    min: 0,
    max: 2000,
  },
  minimumAmount: {
    type: Number,
    required: true,
  },
 

  expirationDate: {
    type: Date,
    required: true,
  },
  maxRedemptions: {
    type: Number,
    default: null, // Set to null for unlimited redemptions
  },
  totalRedemptions: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Coupon', couponSchema,'coupons')
