const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'fallback_secret_key';
const EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '480', 10);

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(401).json({
      error: true,
      detail: 'Invalid username or password',
    });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        error: true,
        detail: 'Invalid username or password',
      });
    }

    const isMatch = await user.verifyPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        detail: 'Invalid username or password',
      });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: `${EXPIRE_MINUTES}m`,
      }
    );

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        name: user.name,
        doctor_id: user.doctor_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, detail: 'Internal server error' });
  }
});

module.exports = router;
