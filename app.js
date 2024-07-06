require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

const albumController = require('./myControllers/albumController');
const authRoutes = require('./routes/auth');
const forgotPasswordRoutes = require('./routes/passwords');
const rankingsRoutes = require('./routes/rankings');
const searchRoutes = require('./routes/search');
const profileRoutes = require('./routes/profile')

app.use('/api/albums', albumController);
app.use('/api/auth', authRoutes);
app.use('/api/passwords', forgotPasswordRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/profile', profileRoutes)

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.info("Connected to the DB"))
.catch((e) => console.error("DB Connection Error:", e));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
