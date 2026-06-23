const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient_id: {
    type: String,
    required: true,
  },
  patient_name: {
    type: String,
    required: true,
  },
  doctor_id: {
    type: Number,
    required: true,
  },
  doctor_name: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'Consultation',
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Confirmed', 'Cancelled'],
  },
  notes: {
    type: String,
    default: '',
  },
});

AppointmentSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
