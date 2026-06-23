const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Get all appointments (Doctor-scoped on backend)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'doctor') {
      query.doctor_id = req.user.doctor_id;
    }
    const list = await Appointment.find(query).sort({ date: 1, time: 1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

// Book appointment - Admin & Receptionist
router.post('/', authenticateJWT, requireRole('admin', 'receptionist'), async (req, res) => {
  const { patient_id, patient_name, doctor_id, doctor_name, date, time, type, status, notes } = req.body;

  if (!patient_id || !doctor_id || !date || !time) {
    return res.status(422).json({ error: true, detail: 'Missing required fields: patient_id, doctor_id, date, time' });
  }

  try {
    // Conflict slot check: same doctor, date, time, not cancelled
    const conflict = await Appointment.findOne({
      doctor_id: parseInt(doctor_id, 10),
      date,
      time,
      status: { $ne: 'Cancelled' },
    });

    if (conflict) {
      return res.status(409).json({
        error: true,
        detail: `This slot is already booked for ${conflict.patient_name}`,
      });
    }

    const appointment = new Appointment({
      patient_id: String(patient_id),
      patient_name,
      doctor_id: parseInt(doctor_id, 10),
      doctor_name,
      date,
      time,
      type: type || 'Consultation',
      status: status || 'Pending',
      notes: notes || '',
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

// Edit appointment - Admin only
router.put('/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: true, detail: 'Appointment not found' });
    }

    const newDoctor = updateFields.doctor_id !== undefined ? parseInt(updateFields.doctor_id, 10) : appointment.doctor_id;
    const newDate = updateFields.date || appointment.date;
    const newTime = updateFields.time || appointment.time;
    const newStatus = updateFields.status || appointment.status;

    // Double booking conflict validation when updating date/time/doctor
    if (newStatus !== 'Cancelled') {
      const conflict = await Appointment.findOne({
        _id: { $ne: id },
        doctor_id: newDoctor,
        date: newDate,
        time: newTime,
        status: { $ne: 'Cancelled' },
      });

      if (conflict) {
        return res.status(409).json({
          error: true,
          detail: `This slot is already booked for ${conflict.patient_name}`,
        });
      }
    }

    // Cast fields to correct types if present
    if (updateFields.doctor_id !== undefined) updateFields.doctor_id = parseInt(updateFields.doctor_id, 10);
    if (updateFields.patient_id !== undefined) updateFields.patient_id = String(updateFields.patient_id);

    // Apply updates
    Object.assign(appointment, updateFields);
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

// Cancel appointment - Admin only
router.delete('/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: true, detail: 'Appointment not found' });
    }

    appointment.status = 'Cancelled';
    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

module.exports = router;
