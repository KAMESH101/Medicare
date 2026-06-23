const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Get all patients - All authenticated roles
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const list = await Patient.find({}).sort({ name: 1 });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

// Create new patient - Admin & Receptionist
router.post('/', authenticateJWT, requireRole('admin', 'receptionist'), async (req, res) => {
  const { name, age, gender, blood, phone, email, address, condition, status } = req.body;

  if (!name || !age || !phone) {
    return res.status(422).json({ error: true, detail: 'Missing required fields: name, age, phone' });
  }

  try {
    // Duplicate check: same name and phone
    const existing = await Patient.findOne({
      name: name.trim(),
      phone: phone.trim(),
    });

    if (existing) {
      return res.status(409).json({
        error: true,
        detail: 'A patient with this name and phone already exists',
      });
    }

    const patient = new Patient({
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      blood,
      phone: phone.trim(),
      email: (email || '').trim(),
      address: (address || '').trim(),
      condition: condition || 'General',
      status: status || 'Active',
      joined: new Date().toISOString().slice(0, 10),
    });

    await patient.save();
    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

// Update patient - Admin only
router.put('/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: true, detail: 'Patient not found' });
    }

    // Clean update fields
    for (const key of ['name', 'phone', 'email', 'address']) {
      if (updateFields[key] !== undefined) {
        updateFields[key] = String(updateFields[key]).trim();
      }
    }

    // Duplicate check if name or phone are changing
    if (updateFields.name || updateFields.phone) {
      const checkName = updateFields.name || patient.name;
      const checkPhone = updateFields.phone || patient.phone;

      const dup = await Patient.findOne({
        _id: { $ne: id },
        name: checkName,
        phone: checkPhone,
      });

      if (dup) {
        return res.status(409).json({
          error: true,
          detail: 'A patient with this name and phone already exists',
        });
      }
    }

    // Apply updates
    Object.assign(patient, updateFields);
    await patient.save();
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

// Delete patient & cascade appointments - Admin only
router.delete('/:id', authenticateJWT, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: true, detail: 'Patient not found' });
    }

    // Cascade delete appointments
    await Appointment.deleteMany({ patient_id: id });
    await Patient.findByIdAndDelete(id);

    res.status(204).send(); // No Content
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

module.exports = router;
