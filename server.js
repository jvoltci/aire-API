const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
//const knex = require('knex');
const path = require('path');
const PollApp = require('./modules/poll')

/*const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
});*/

const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 5000;
const io = require('socket.io')(server);
const poll = new PollApp(io);

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use('/node_modules',  express.static( path.join(__dirname, '/node_modules')));
app.use((req, res, next) => {
  const allowedOrigins = ['https://jvoltci.github.io/aire', 'https://aire.ivehement.com'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
       res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

poll.init();

app.get('/', (req, res) => { res.send('It is working') })
app.post('/pseudonym', (req, res) => { poll.handlePseudonym(req, res) })
app.post('/fetchq', (req, res) => { poll.fetchListQnP(req, res) })
app.post('/fetchlivefeed', (req, res) => { poll.fetchLiveFeed(req, res) })
app.post('/listparticipants', (req, res) => { poll.listParticipants(req, res) })


// Start server
server.listen(port, () => {
  console.log(`listening on ${port}`);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user



module.exports = server;