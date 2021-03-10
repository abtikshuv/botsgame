const express = require('express');
const app = express();
const cors = require('cors');

const uploadRouter = require('./src/routes/uploadRouter');
const authRouter = require('./src/routes/authRouter');
const gameRouter = require('./src/routes/gameRouter');
const apiIndex = require('./src/routes/index');

const cookieParser = require('cookie-parser');
const { getBot } = require('./src/utils/botUtils')

const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const { accessProtectionmiddleware, asyncMiddleware } = require('./src/utils/middlewares');
const { checkUser, getLeaderboard, getGame, getGroupsNames } = require('./src/utils/dbUtils');

const gameController = require('./src/gameWorker/gameController');

const gameWorker = require('./src/gameWorker/gameWorker');

const PORT = process.env.PORT || 8099;

app.use(cors(
  {
    origin: 'https://botsgame.herokuapp.com',
    credentials: true
  }
));

passport.use(new LocalStrategy(
  function (username, password, done) {
    // check user
    if (!checkUser(username, password))
      return done(null, false, { message: 'Unauthorized' });

    return done(null, { group: username });
  }
))

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretysecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    path: '/',
    secure: true,
    maxAge: 1000*60*60*24,
    sameSite: 'none',
    httpOnly: true
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((userDataFromCookie, done) => {
  // check user
  return done(null, { group: userDataFromCookie.group });
})


//app.use(accessProtectionmiddleware);

app.use('/server/api', apiIndex(passport));

//app.use('/auth', authRouter(passport));


//app.use('/upload', uploadRouter);

//app.use('/game', gameRouter);

// app.get('/leaderboard', async function (req, res) {
//   try {
//     res.json(await getLeaderboard())
//   }
//   catch (e) {
//     console.log(e);
//   }
// })

// app.get('/users', async function (req, res){
//   try {
//     res.json(await getGroupsNames())
//   }
//   catch (e) {
//     console.log(e);
//   }
// })

// app.get('/game/temp', asyncMiddleware(async function (req, res, next) {
//   //gameData = {} //FROM DB;
//   players = [{ playerid: 27, bot: getBot("example", "temp") }, { playerid: 8, bot: getBot("example", "example") }, { playerid: 9, bot: getBot("example", "example") }, { playerid: 1, bot: getBot("example", "example") }];
//   stub = await gameController.runGame(players);
//   res.json(stub);
// }));


app.get('/', function (req, res) {
  res.send('Hello World')
});


app.listen(PORT, () => console.log('App listening on port ' + PORT));

process.on('warning', e=>console.warn(e.stack));

gameWorker();
