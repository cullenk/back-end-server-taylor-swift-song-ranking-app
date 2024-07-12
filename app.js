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

const albumRoutes = require('./routes/albums');
const authRoutes = require('./routes/auth');
const forgotPasswordRoutes = require('./routes/passwords');
const rankingsRoutes = require('./routes/rankings');
const profileRoutes = require('./routes/profile');

app.use('/api/albums', albumRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/passwords', forgotPasswordRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/profile', profileRoutes);

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