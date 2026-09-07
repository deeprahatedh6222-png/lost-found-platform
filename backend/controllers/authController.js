const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email
});

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
      })
      .select('id, name, email')
      .single();

    if (error) throw error;

    res.status(201).json({ token: createToken(user.id), user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    res.json({ token: createToken(user.id), user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

module.exports = { register, login, me };
