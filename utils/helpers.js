const User = require('../models/User');

exports.createInitialAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@cloudblitz.com',
        passwordHash: 'admin123',
        role: 'admin',
      });
      console.log('✅ Initial admin user created');
      console.log('📧 Email: admin@cloudblitz.com');
      console.log('🔑 Password: admin123');
    }
  } catch (error) {
    console.error('Error creating initial admin:', error.message);
  }
};