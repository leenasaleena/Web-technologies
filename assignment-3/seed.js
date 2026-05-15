const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beehive_dental')
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Service Schema
const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 4.5 },
  stock: { type: Number, default: 100 },
  description: String,
  duration: String,
  imageUrl: String
});

const Service = mongoose.model('Service', serviceSchema);

const services = [
  // General Dentistry (using beehive-1.jpg)
  { name: "Comprehensive Dental Exam", price: 89, category: "General Dentistry", rating: 4.8, stock: 100, description: "Complete oral examination including X-rays, cancer screening, and treatment planning.", duration: "60 mins", imageUrl: "/images/beehive-1.jpg" },
  { name: "Professional Teeth Cleaning", price: 79, category: "General Dentistry", rating: 4.9, stock: 100, description: "Deep cleaning to remove plaque, tartar, and stains from teeth surfaces.", duration: "45 mins", imageUrl: "/images/beehive-2.jpg" },
  { name: "Dental Sealants", price: 45, category: "General Dentistry", rating: 4.7, stock: 100, description: "Protective coating applied to back teeth to prevent cavities.", duration: "30 mins", imageUrl: "/images/beehive-3.jpg" },
  { name: "Fluoride Treatment", price: 35, category: "General Dentistry", rating: 4.6, stock: 100, description: "Mineral treatment to strengthen tooth enamel and prevent decay.", duration: "20 mins", imageUrl: "/images/beehive-4.jpg" },
  
  // Emergency Dentistry
  { name: "Emergency Dental Care", price: 199, category: "Emergency Dentistry", rating: 4.9, stock: 100, description: "Immediate care for severe tooth pain, infections, or dental trauma.", duration: "60 mins", imageUrl: "/images/beehive-dental-tour0.jpg" },
  { name: "Toothache Relief", price: 129, category: "Emergency Dentistry", rating: 4.8, stock: 100, description: "Diagnosis and treatment of acute tooth pain.", duration: "45 mins", imageUrl: "/images/beehive-dental-tour1-scaled.jpg" },
  { name: "Broken Tooth Repair", price: 159, category: "Emergency Dentistry", rating: 4.7, stock: 100, description: "Restoration of chipped, cracked, or fractured teeth.", duration: "60 mins", imageUrl: "/images/beehive-1.jpg" },
  
  // Root Canals
  { name: "Root Canal Therapy - Anterior", price: 599, category: "Root Canals", rating: 4.8, stock: 100, description: "Treatment for infected front tooth pulp to save natural tooth.", duration: "90 mins", imageUrl: "/images/beehive-2.jpg" },
  { name: "Root Canal Therapy - Premolar", price: 699, category: "Root Canals", rating: 4.7, stock: 100, description: "Treatment for infected premolar teeth.", duration: "90 mins", imageUrl: "/images/beehive-3.jpg" },
  { name: "Root Canal Therapy - Molar", price: 799, category: "Root Canals", rating: 4.8, stock: 100, description: "Complex treatment for infected back teeth.", duration: "120 mins", imageUrl: "/images/beehive-4.jpg" },
  
  // Tooth Extractions
  { name: "Simple Tooth Extraction", price: 149, category: "Tooth Extractions", rating: 4.7, stock: 100, description: "Removal of visible, non-impacted teeth.", duration: "45 mins", imageUrl: "/images/beehive-dental-tour0.jpg" },
  { name: "Surgical Extraction", price: 299, category: "Tooth Extractions", rating: 4.6, stock: 100, description: "Removal of impacted or broken teeth requiring incision.", duration: "75 mins", imageUrl: "/images/beehive-dental-tour1-scaled.jpg" },
  { name: "Wisdom Teeth Removal", price: 349, category: "Tooth Extractions", rating: 4.8, stock: 100, description: "Extraction of impacted or erupted wisdom teeth.", duration: "90 mins", imageUrl: "/images/beehive-1.jpg" },
  
  // Invisalign
  { name: "Invisalign Consultation", price: 0, category: "Invisalign", rating: 4.9, stock: 100, description: "Free consultation and 3D smile preview.", duration: "45 mins", imageUrl: "/images/beehive-2.jpg" },
  { name: "Invisalign Full Treatment", price: 4999, category: "Invisalign", rating: 4.9, stock: 100, description: "Complete clear aligner treatment for teeth straightening.", duration: "12-18 months", imageUrl: "/images/beehive-3.jpg" },
  { name: "Invisalign Express", price: 2499, category: "Invisalign", rating: 4.8, stock: 100, description: "Short-term treatment for minor corrections.", duration: "6 months", imageUrl: "/images/beehive-4.jpg" },
  
  // Cosmetic Dentistry
  { name: "Teeth Whitening", price: 299, category: "Cosmetic Dentistry", rating: 4.8, stock: 100, description: "Professional in-office whitening treatment.", duration: "60 mins", imageUrl: "/images/beehive-dental-tour0.jpg" },
  { name: "Porcelain Veneers", price: 999, category: "Cosmetic Dentistry", rating: 4.9, stock: 100, description: "Custom shells to improve tooth appearance.", duration: "2 visits", imageUrl: "/images/beehive-dental-tour1-scaled.jpg" },
  { name: "Dental Bonding", price: 199, category: "Cosmetic Dentistry", rating: 4.7, stock: 100, description: "Tooth-colored resin to repair chips and gaps.", duration: "45 mins", imageUrl: "/images/beehive-1.jpg" },
  
  // Preventive Care
  { name: "Sports Mouthguard", price: 89, category: "Preventive Care", rating: 4.8, stock: 100, description: "Custom-fitted protective mouthguard for athletes.", duration: "30 mins", imageUrl: "/images/beehive-2.jpg" },
  { name: "Night Guard", price: 249, category: "Preventive Care", rating: 4.8, stock: 100, description: "Custom appliance to prevent teeth grinding damage.", duration: "45 mins", imageUrl: "/images/beehive-3.jpg" },
  { name: "Oral Cancer Screening", price: 59, category: "Preventive Care", rating: 4.9, stock: 100, description: "Comprehensive screening for early detection.", duration: "15 mins", imageUrl: "/images/beehive-4.jpg" }
];

async function seedDatabase() {
  try {
    // Clear existing data
    await Service.deleteMany({});
    console.log('Cleared existing services');
    
    // Insert new services
    await Service.insertMany(services);
    console.log(`Inserted ${services.length} services into database`);
    
    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();