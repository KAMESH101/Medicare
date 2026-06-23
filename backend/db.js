const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('[DB] ❌ MONGO_URI is not defined in environment variables.');
}

// Cache the connection across serverless invocations (critical for Vercel)
let cachedConn = null;

async function connectDB() {
  // If already connected, reuse it
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  if (!MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set.');
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });

    cachedConn = conn;
    console.log('[DB] Connected to MongoDB successfully.');

    // Auto-seed on fresh database (skip in production for speed)
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase();
    }

    return conn;
  } catch (err) {
    cachedConn = null;
    console.error('[DB] MongoDB connection error:', err.message);
    throw err; // Let the route handler return a proper 500 response
  }
}

async function seedDatabase() {
  try {
    // Import models here to avoid circular reference issues
    const User = require('./models/User');
    const Patient = require('./models/Patient');
    const Appointment = require('./models/Appointment');

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[DB] Database already seeded. Skipping seeder.');
      return;
    }

    console.log('[DB] Empty database detected. Seeding demo data...');

    // 1. Seed Users
    const seedUsers = [
      { username: 'admin',     role: 'admin',        name: 'Administrator',       doctor_id: null },
      { username: 'dr.anitha', role: 'doctor',       name: 'Dr. Anitha Krishnan', doctor_id: 1    },
      { username: 'dr.suresh', role: 'doctor',       name: 'Dr. Suresh Patel',    doctor_id: 2    },
      { username: 'riya',      role: 'receptionist', name: 'Riya Sharma',         doctor_id: null },
    ];

    const passMap = {
      'admin': 'admin123',
      'dr.anitha': 'doc123',
      'dr.suresh': 'doc456',
      'riya': 'rec123'
    };

    const usersToCreate = [];
    for (const u of seedUsers) {
      const hashedPassword = await bcrypt.hash(passMap[u.username], 10);
      usersToCreate.push({ ...u, password: hashedPassword });
    }

    const createdUsers = await User.insertMany(usersToCreate);
    console.log(`[DB] Seeded ${createdUsers.length} users.`);

    // 2. Seed Patients
    const Patient_ = Patient;
    const seedPatients = [
      { name: 'Priya Nair',   age: 34, gender: 'Female', blood: 'O+',  phone: '9876543210', email: 'priya@email.com', address: 'Anna Nagar, Chennai', condition: 'Hypertension',    status: 'Active',   joined: '2024-01-15' },
      { name: 'Rajan Kumar',  age: 58, gender: 'Male',   blood: 'A+',  phone: '9876543211', email: 'rajan@email.com', address: 'T Nagar, Chennai',    condition: 'Diabetes Type 2', status: 'Active',   joined: '2024-02-20' },
      { name: 'Meena Pillai', age: 42, gender: 'Female', blood: 'B-',  phone: '9876543212', email: 'meena@email.com', address: 'Adyar, Chennai',      condition: 'Asthma',          status: 'Inactive', joined: '2024-03-05' },
      { name: 'Arjun Sharma', age: 27, gender: 'Male',   blood: 'AB+', phone: '9876543213', email: 'arjun@email.com', address: 'Velachery, Chennai',  condition: 'Migraine',        status: 'Active',   joined: '2024-04-10' },
    ];
    const createdPatients = await Patient_.insertMany(seedPatients);
    console.log(`[DB] Seeded ${createdPatients.length} patients.`);

    // 3. Seed Appointments
    const Appointment_ = Appointment;
    const [priya, rajan, meena, arjun] = createdPatients;
    const seedAppointments = [
      { patient_id: priya._id.toString(),  patient_name: 'Priya Nair',   doctor_id: 1, doctor_name: 'Dr. Anitha Krishnan', date: '2026-05-12', time: '10:00', type: 'Follow-up',    status: 'Confirmed', notes: 'BP check' },
      { patient_id: rajan._id.toString(),  patient_name: 'Rajan Kumar',  doctor_id: 2, doctor_name: 'Dr. Suresh Patel',    date: '2026-05-13', time: '14:30', type: 'Consultation', status: 'Pending',   notes: 'Sugar level check' },
      { patient_id: meena._id.toString(),  patient_name: 'Meena Pillai', doctor_id: 3, doctor_name: 'Dr. Kavya Reddy',     date: '2026-05-14', time: '11:00', type: 'Routine',      status: 'Confirmed', notes: 'Breathing test' },
      { patient_id: arjun._id.toString(),  patient_name: 'Arjun Sharma', doctor_id: 1, doctor_name: 'Dr. Anitha Krishnan', date: '2026-05-15', time: '09:30', type: 'Consultation', status: 'Cancelled', notes: 'Migraine analysis' },
    ];
    const createdAppts = await Appointment_.insertMany(seedAppointments);
    console.log(`[DB] Seeded ${createdAppts.length} appointments.`);

  } catch (err) {
    console.error('[DB] Seeding error:', err.message);
  }
}

module.exports = { connectDB };
