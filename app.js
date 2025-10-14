require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const bodyParser = require('body-parser');

console.log('=== SERVER STARTING ===');

const app = express();

const allowedOrigins = [
  'https://swiftierankinghub.com',
  'https://www.swiftierankinghub.com', 
  'https://api.swiftierankinghub.com' 
  'http://localhost:4200',
  'http://localhost:3000',              
];

app.use(cors({
  origin: function(origin, callback) {
    console.log('🔍 CORS Debug - Incoming request from origin:', origin);
    
    if (!origin) {
      console.log('✅ CORS: No origin header (allowing - likely same-origin request)');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('❌ CORS REJECTED:');
      console.log('   Requesting origin:', origin);
      console.log('   Allowed origins:', allowedOrigins);
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    console.log('✅ CORS APPROVED origin:', origin);
    return callback(null, true);
  },
  credentials: true
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const albumRoutes = require('./routes/albums');
const authRoutes = require('./routes/auth');
const mailRoutes = require('./routes/sendMail')
const forgotPasswordRoutes = require('./routes/passwords');
const rankingsRoutes = require('./routes/rankings');
const profileRoutes = require('./routes/profile');
const userRoutes = require('./routes/users')

app.get('/', (req, res) => {
  res.send('Welcome to the Swiftie Ranking Hub API!');
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});
app.use('/api/albums', albumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sendMail', mailRoutes);
app.use('/api/passwords', forgotPasswordRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);

mongoose.connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
})
.then(() => console.info("Connected to the DB"))
.catch((e) => console.error("DB Connection Error:", e));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));