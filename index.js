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

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
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

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const query = {
      userId: user._id,
    };

    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) {
        const fromDate = new Date(req.query.from);
        query.date.$gte = fromDate;
      }
      if (req.query.to) {
        const toDate = new Date(req.query.to);
        query.date.$lte = toDate;
      }
    }

    let exercises = await Exercise.find(query).limit(parseInt(req.query.limit));

    exercises = exercises.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(),
    }));

    const response = {
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
