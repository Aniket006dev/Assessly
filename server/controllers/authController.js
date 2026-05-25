const jwt  = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'assessly_secret_key', { expiresIn: '7d' });

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { name, email, password, schoolName, schoolCity } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user  = await User.create({ name, email, password, school: { name: schoolName||'Delhi Public School', city: schoolCity||'Bokaro Steel City' } });
    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
};

const getMe           = async (req, res) => res.json({ success: true, user: req.user });
const updateProfile   = async (req, res, next) => {
  try {
    const { name, schoolName, schoolCity } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, school: { name: schoolName, city: schoolCity } },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updateProfile };
