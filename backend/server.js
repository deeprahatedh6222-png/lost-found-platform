const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Lost & Found API (Supabase)' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/claims', require('./routes/claimRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

app.use((error, req, res, next) => {
  console.error(error);

  if (error.code === '23505') {
    return res.status(409).json({ message: 'Duplicate data is not allowed' });
  }

  if (error.code === '23514') {
    return res.status(400).json({ message: 'Validation failed — check field constraints' });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Image must be 5 MB or smaller' });
  }

  res.status(error.statusCode || 500).json({ message: error.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
