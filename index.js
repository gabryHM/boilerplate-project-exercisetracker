const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const mongoose = require('mongoose');

const mongoDB = process.env.MONGO_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ username: req.body.username });
    const savedUser = await user.save();
    res.json(savedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (err) return console.error(err);
    res.json(users);
  });
});


app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const exercise = new Exercise({
      userId: req.params._id,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });
    
    const savedExercise = await exercise.save();
    const user = await User.findById(req.params._id);
    if (!user) return res.status(404).send('User not found');
    
    res.json({
      _id: user._id,
      username: user.username,
      date: new Date(savedExercise.date).toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get('/api/users/:_id/logs', (req, res) => {
  Exercise.find({ userId: req.params._id }, (err, exercises) => {
    if (err) return console.error(err);
    res.json(exercises);
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
