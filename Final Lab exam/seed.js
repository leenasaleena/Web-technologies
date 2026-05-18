
const mongoose = require('mongoose');
const Service = require('./models/Service');
const User = require('./models/User');

async function seedDatabase() {
try {
await mongoose.connect('mongodb://localhost:27017/beehive_dental');


    console.log('✅ Connected to MongoDB');

    // Clear database
    await Service.deleteMany({});
    await User.deleteMany({});

    console.log('📦 Cleared existing data');

    // Services
   const services = [
            { name: "Comprehensive Dental Exam", price: 89, category: "General Dentistry", rating: 4.8, stock: 100, description: "Complete oral examination including X-rays, cancer screening, and treatment planning.", duration: "60 mins", imageUrl: "/images/beehive-1.jpg", isOnSale: true, salePrice: 59 },
            { name: "Professional Teeth Cleaning", price: 79, category: "General Dentistry", rating: 4.9, stock: 100, description: "Deep cleaning to remove plaque, tartar, and stains from teeth surfaces.", duration: "45 mins", imageUrl: "/images/beehive-2.jpg", isOnSale: true, salePrice: 49 },
            { name: "Emergency Dental Care", price: 199, category: "Emergency Dentistry", rating: 4.9, stock: 100, description: "Immediate care for severe tooth pain, infections, or dental trauma.", duration: "60 mins", imageUrl: "/images/beehive-3.jpg", isOnSale: false },
            { name: "Root Canal Therapy", price: 599, category: "Root Canals", rating: 4.8, stock: 100, description: "Treatment for infected tooth pulp to save natural tooth.", duration: "90 mins", imageUrl: "/images/beehive-4.jpg", isOnSale: true, salePrice: 449 },
            { name: "Wisdom Teeth Removal", price: 349, category: "Tooth Extractions", rating: 4.8, stock: 100, description: "Extraction of impacted or erupted wisdom teeth.", duration: "90 mins", imageUrl: "/images/beehive-dental-tour0.jpg", isOnSale: false },
            { name: "Invisalign Full Treatment", price: 4999, category: "Invisalign", rating: 4.9, stock: 100, description: "Complete clear aligner treatment for teeth straightening.", duration: "12-18 months", imageUrl: "/images/beehive-dental-tour1-scaled.jpg", isOnSale: true, salePrice: 3999 },
            { name: "Teeth Whitening", price: 299, category: "Cosmetic Dentistry", rating: 4.8, stock: 100, description: "Professional in-office whitening treatment.", duration: "60 mins", imageUrl: "/images/beehive-iso.png", isOnSale: true, salePrice: 199 },
            { name: "Sports Mouthguard", price: 89, category: "Preventive Care", rating: 4.8, stock: 100, description: "Custom-fitted protective mouthguard for athletes.", duration: "30 mins", imageUrl: "/images/hex02.png", isOnSale: false },
            { name: "Dental Bonding", price: 199, category: "Cosmetic Dentistry", rating: 4.7, stock: 100, description: "Tooth-colored resin to repair chips and gaps.", duration: "45 mins", imageUrl: "/images/beehive-1.jpg", isOnSale: true, salePrice: 129 },
            { name: "Porcelain Veneers", price: 999, category: "Cosmetic Dentistry", rating: 4.9, stock: 100, description: "Custom shells to improve tooth appearance.", duration: "2 visits", imageUrl: "/images/beehive-2.jpg", isOnSale: false },
            { name: "Night Guard", price: 249, category: "Preventive Care", rating: 4.8, stock: 100, description: "Custom appliance to prevent teeth grinding damage.", duration: "45 mins", imageUrl: "/images/beehive-3.jpg", isOnSale: true, salePrice: 179 },
            { name: "Oral Cancer Screening", price: 59, category: "Preventive Care", rating: 4.9, stock: 100, description: "Comprehensive screening for early detection.", duration: "15 mins", imageUrl: "/images/beehive-4.jpg", isOnSale: false },
            { name: "Tooth Extraction", price: 149, category: "Tooth Extractions", rating: 4.7, stock: 100, description: "Removal of damaged or problematic teeth.", duration: "45 mins", imageUrl: "/images/beehive-dental-tour0.jpg", isOnSale: true, salePrice: 99 },
            { name: "Invisalign Express", price: 2499, category: "Invisalign", rating: 4.8, stock: 100, description: "Short-term treatment for minor corrections.", duration: "6 months", imageUrl: "/images/beehive-dental-tour1-scaled.jpg", isOnSale: true, salePrice: 1999 },
            { name: "Fluoride Treatment", price: 45, category: "Preventive Care", rating: 4.6, stock: 100, description: "Mineral treatment to strengthen tooth enamel.", duration: "20 mins", imageUrl: "/images/beehive-iso.png", isOnSale: false },
            { name: "Dental Sealants", price: 55, category: "Preventive Care", rating: 4.7, stock: 100, description: "Protective coating for back teeth to prevent cavities.", duration: "30 mins", imageUrl: "/images/hex02.png", isOnSale: true, salePrice: 39 },
            { name: "Emergency Tooth Repair", price: 159, category: "Emergency Dentistry", rating: 4.8, stock: 100, description: "Restoration of chipped, cracked, or fractured teeth.", duration: "60 mins", imageUrl: "/images/beehive-1.jpg", isOnSale: false },
            { name: "Root Canal Retreatment", price: 799, category: "Root Canals", rating: 4.7, stock: 100, description: "Revision of previous root canal treatment.", duration: "90 mins", imageUrl: "/images/beehive-2.jpg", isOnSale: true, salePrice: 599 },
            { name: "Surgical Extraction", price: 299, category: "Tooth Extractions", rating: 4.6, stock: 100, description: "Removal of impacted or broken teeth requiring incision.", duration: "75 mins", imageUrl: "/images/beehive-3.jpg", isOnSale: false },
            { name: "Invisalign Teen", price: 4599, category: "Invisalign", rating: 4.9, stock: 100, description: "Clear aligner treatment designed for teenagers.", duration: "12-18 months", imageUrl: "/images/beehive-4.jpg", isOnSale: true, salePrice: 3699 }
        ];


    await Service.insertMany(services);

    console.log(`✅ Inserted ${services.length} services`);

    // CREATE USERS
    // IMPORTANT:
    // DO NOT HASH PASSWORDS HERE
    // User model hashes automatically

    const admin = new User({
        name: 'Admin User',
        email: 'admin@beehive.com',
        password: 'admin123',
        role: 'admin'
    });

    await admin.save();

    console.log('✅ Admin user created');

    const customer = new User({
        name: 'John Customer',
        email: 'customer@example.com',
        password: 'customer123',
        role: 'customer'
    });

    await customer.save();

    console.log('✅ Customer user created');

    console.log('\n🎉 Database seeding complete!');
    console.log('Admin: admin@beehive.com / admin123');
    console.log('Customer: customer@example.com / customer123');

    process.exit(0);

} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}

}
seedDatabase();
