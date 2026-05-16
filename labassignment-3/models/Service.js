const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    enum: ['General Dentistry', 'Emergency Dentistry', 'Root Canals', 'Tooth Extractions', 'Invisalign', 'Cosmetic Dentistry', 'Preventive Care']
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 4.5 
  },
  stock: { 
    type: Number, 
    default: 100,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: '/images/dental-default.jpg'
  }
}, {
  timestamps: true
});

// Create index for search functionality
serviceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', serviceSchema);