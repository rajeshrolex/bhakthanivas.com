const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import db
const connectDB = require('./config/database');

// Call connectDB
connectDB();

// Build check
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Import routes
const lodgeRoutes = require('./routes/lodgeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const templeRoutes = require('./routes/templeRoutes');
const dailyPriceRoutes = require('./routes/dailyPriceRoutes');
const blockedDateRoutes = require('./routes/blockedDateRoutes');

// Basic test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/lodges', lodgeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/temples', templeRoutes);
app.use('/api/daily-prices', dailyPriceRoutes);
app.use('/api/blocked-dates', blockedDateRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

