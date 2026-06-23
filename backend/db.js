const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicare';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB successfully.');
    
    // Trigger auto-seeding check
    await seedDatabase();
  } catch (err) {
    console.error('[DB] MongoDB connection error:', err.message);
    console.warn('[DB] ⚠️  Server will run WITHOUT database. Set MONGO_URI in .env to connect.');
    console.warn('[DB] ⚠️  Get a free MongoDB Atlas URI at: https://www.mongodb.com/cloud/atlas');
    // Don't exit — allow server to run (frontend falls back to localStorage)
  }
}

async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[DB] Database already seeded. Skipping seeder.');
      return;
    }

    console.log('[DB] Empty database detected. Seeding demo data...');

    // 1. Seed Users (Hash passwords first)
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
      const plainPass = passMap[u.username];
      const hashedPassword = await bcrypt.hash(plainPass, 10);
      usersToCreate.push({
        ...u,
        password: hashedPassword
      });
    }

    const createdUsers = await User.insertMany(usersToCreate);
    console.log(`[DB] Successfully seeded ${createdUsers.length} users.`);

    // 2. Seed Patients
    const seedPatients = [
      { name: 'Priya Nair',          age: 34, gender: 'Female', blood: 'O+',  phone: '9876543210', email: 'priya@email.com',  address: 'Anna Nagar, Chennai',  condition: 'Hypertension',   status: 'Active',   joined: '2024-01-15' },
      { name: 'Rajan Kumar',         age: 58, gender: 'Male',   blood: 'A+',  phone: '9876543211', email: 'rajan@email.com',  address: 'T Nagar, Chennai',     condition: 'Diabetes Type 2', status: 'Active',   joined: '2024-02-20' },
      { name: 'Meena Pillai',        age: 42, gender: 'Female', blood: 'B-',  phone: '9876543212', email: 'meena@email.com',  address: 'Adyar, Chennai',       condition: 'Asthma',         status: 'Inactive', joined: '2024-03-05' },
      { name: 'Arjun Sharma',        age: 27, gender: 'Male',   blood: 'AB+', phone: '9876543213', email: 'arjun@email.com',  address: 'Velachery, Chennai',   condition: 'Migraine',       status: 'Active',   joined: '2024-04-10' },
    ];
    const createdPatients = await Patient.insertMany(seedPatients);
    console.log(`[DB] Successfully seeded ${createdPatients.length} patients.`);

    // 3. Seed Appointments (Map to the newly created patient ObjectIds)
    const priya = createdPatients.find(p => p.name === 'Priya Nair');
    const rajan = createdPatients.find(p => p.name === 'Rajan Kumar');
    const meena = createdPatients.find(p => p.name === 'Meena Pillai');
    const arjun = createdPatients.find(p => p.name === 'Arjun Sharma');

    const seedAppointments = [
      { patient_id: priya._id.toString(), patient_name: 'Priya Nair',   doctor_id: 1, doctor_name: 'Dr. Anitha Krishnan',     date: '2026-05-12', time: '10:00', type: 'Follow-up',    status: 'Confirmed', notes: 'BP check' },
      { patient_id: rajan._id.toString(), patient_name: 'Rajan Kumar',  doctor_id: 2, doctor_name: 'Dr. Suresh Patel',        date: '2026-05-13', time: '14:30', type: 'Consultation', status: 'Pending',   notes: 'Sugar level check' },
      { patient_id: meena._id.toString(), patient_name: 'Meena Pillai', doctor_id: 3, doctor_name: 'Dr. Kavya Reddy',         date: '2026-05-14', time: '11:00', type: 'Routine',      status: 'Confirmed', notes: 'Breathing test' },
      { patient_id: arjun._id.toString(), patient_name: 'Arjun Sharma', doctor_id: 1, doctor_name: 'Dr. Anitha Krishnan',     date: '2026-05-15', time: '09:30', type: 'Consultation', status: 'Cancelled', notes: 'Migraine analysis' },
    ];

    const createdAppts = await Appointment.insertMany(seedAppointments);
    console.log(`[DB] Successfully seeded ${createdAppts.length} appointments.`);
  } catch (err) {
    console.error('[DB] Database seeding error:', err.message);
  }
}

module.exports = { connectDB };
