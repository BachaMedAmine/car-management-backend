import * as bcrypt from 'bcrypt';
import { connect, connection } from 'mongoose';
import { User, UserSchema } from './src/users/schemas/user.schema'; // Import the schema properly

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await connect('mongodb://localhost:27017/car-management-db'); // Update your database URI if different

    // Define the User model
    const UserModel = connection.model('User', UserSchema);

    // Check if the admin user already exists
    const existingAdmin = await UserModel.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists. Skipping creation.');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('adminpassword', 10);

    // Create the admin user
    await UserModel.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'admin',
      refreshTokens: [],
    });

    console.log('Admin created successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    connection.close(); // Close the connection
  }
};

// Execute the seed function
seedAdmin();