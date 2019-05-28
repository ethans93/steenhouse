const launchFactory = require('./server/launch-factory');
const _ = require('lodash');
const { Pool, Client } = require('pg');
const bcrypt = require('bcryptjs');
const Cookie = require('cookie');
const randomize = require('randomatic');
const Salt = parseInt(process.env.SALT);
const nodedir = require('node-dir');
const jwt = require('jsonwebtoken');

const EventEmitter = require('events');

require('dotenv').config();

module.exports.createApp = function () {
    return launchFactory.setupApp()
        .then(mountUrlEndpoints);
};

function mountUrlEndpoints(app) {
    console.log(randomize('A0', 10));

    app.get('/', function (req, res) {
        res.sendFile('dist/index.html', { root: __dirname });
    });

    const pool = new Pool();
    const pgClient = new Client();

    pool.on('error', (err, client) => {
      if(err.message === 'write after end'){
        console.error(new Date() + " - Idle pool timed out\n")
      }
      else{
        console.error(new Date() + "\nUnexpected error on idle client\n" + err.stack + "\n")
      }
    })
    pool.on('connect', (client) => {
      console.log("Pool Connected");
    })
    pool.on('removed', (client) => {
      console.log("Removed");
    })

    app.post('/signup', function(request, result) {
      let hashPass = bcrypt.hashSync(request.body.pw, Salt);
      let dob = "2000-" + request.body.bday.replace('/', '-');
      pool.connect((err, client, release) => {
        if(err){
          console.error(new Date() + "\nError acquiring client\n" + err.stack + "\n");
          result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
        }
        client.query('SELECT check_duplicate_email($1);', [request.body.email], (err, res) => {
          release()
          if(err){
            console.error(new Date() + "\nError connecting to database, check_duplicate_email (function) for " + request.body.email + ":\n" + err.stack + "\n");
            result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
          }
          if(res.rows[0].check_duplicate_email){
            result.json({success: false, title: 'Invalid Email', message: 'Email already in use'});
          }
          else{
            client.query('SELECT check_code($1, $2);', [request.body.group, request.body.code], (err, res) => {
              release()
              if(err){
                console.error(new Date() + "\nError connecting to database, check_code (function)\n" + err.stack + "\n");
                result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
              }
              switch(res.rows[0].check_code){
                case -3:
                  result.json({success: false, title: 'Group Not Found', message: 'No group with the name \"' + request.body.group + '\" was found!'});
                  break;
                case -2:
                  result.json({success: false, title: 'Invalid Code', message: 'No invitation using that code was found for the group \"' + request.body.group + '\".'});
                  break;
                case -1:
                  result.json({success: false, title: 'Invitation Already Used', message: 'That invitation has already been used!'});
                  break;
                default:
                  client.query('SELECT create_user($1, $2, $3, $4, $5, $6);', [request.body.email, hashPass, dob, request.body.name, request.body.code, res.rows[0].check_code], (err, res) => {
                    release()
                    if(err){
                      console.error(new Date() + "\nError connecting to database, create_user (function)\n" + err.stack + "\n");
                      result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
                    }
                    var userID = res.rows[0].create_user;
                    var email = request.body.email;
                    var firstName = request.body.name.split(" ", 1);
                    var token = jwt.sign({userID: userID, email: email}, process.env.KEY,{expiresIn: '1d'});
                    result.setHeader('Set-Cookie', Cookie.serialize('token', token, {
                                maxAge: 60 * 60 * 24 * 1
                              }));
                    console.log(new Date() + "\nNew user added: " + request.body.email + "\n");
                    result.json({success: true, title: 'Sign Up Complete', message: 'Welcome ' + firstName[0] + '!', token: token, name: firstName[0]});
                  })
              }
            })
          }
        })
      })
    })

    app.post('/signin', function (request, result) {
      pool.connect((err, client, release) => {
        if(err){
          console.error(new Date() + "\nError acquiring client\n" + err.stack + "\n");
          result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
        }
        client.query('SELECT * FROM signin($1);', [request.body.email], (err, res) => {
          release();
          if(err){
            console.error(new Date() + "\nError connecting to database, signin (function)\n" + err.stack + "\n");
            result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
          }
          var user = res.rows[0]
          if(user.result){
            bcrypt.compare(request.body.pw, user.pw, (err, res) => {
              if(err){
                console.error(new Date() + "\nError with bcrypt\n" + err.stack + "\n");
                result.status(500).json({success: false, title: 'Error', message: 'Error on our end. Try again later!'});
              }
              if(res){
                var userID = user.id;
                var email = user.email;
                var firstName = user.name.split(" ", 1);
                var token = jwt.sign({userID: userID, email: email}, process.env.KEY,{expiresIn: '1d'});
                result.setHeader('Set-Cookie', Cookie.serialize('token', token, {
                                maxAge: 60 * 60 * 24 * 1
                              }));
                result.json({success: true, title: '', message: 'Welcome back ' + firstName[0] + '!', token: token, name: firstName[0]});
              }
              else{
                result.json({success: false, title: 'Invalid Email/Password', message: 'The email and/or password entered was invalid'});
              }
            })
          }
          else{
            result.json({success: false, title: 'Invalid Email/Password', message: 'The email and/or password entered was invalid'});
          }
        })

        //client.query(('SELECT * FROM signin($1);', [request.body.email])

      })
    })

    app.get('/getOdinPics',function(request, result){
      var files = []
      nodedir.paths((__dirname + '\\dist\\images'), true, function(err, paths) {
        if (err) throw err;
        paths.forEach(function(p){
          var temp = p.split("\\");
          if(temp[temp.length - 1].substring(0,3) === "IMG"){
            files.push(temp[temp.length - 1]);
          }
        })
        result.json({picArray: files});
      });
    })

    app.post('/authenticate', function(request, result) {
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        var decodedLocal = jwt.verify(request.body.token, process.env.KEY);
        if(decodedCookie.userID === decodedLocal.userID && decodedCookie.email === decodedLocal.email){
          result.json({auth: true, msg: 'Success'})
        }
        else{
          result.json({auth: false, msg: 'Not signed in'})
        }
      } 
      catch(err){
        result.json({auth: false, msg: 'Expired'})
      }
    })

    app.post('/createGroup', function(request, result) {
      pool.connect((err, client, release) => {
        if(err){
          console.error(new Date() + "\nError acquiring client\n" + err.stack + "\n");
          result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
        }
        try{
          var cookies = Cookie.parse(request.headers.cookie || '');
          var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
          client.query('SELECT create_group($1, $2, $3)', [request.body.name, decodedCookie.userID, request.body.restrict], (err, res) => {
            release();
            if(err){
              console.error(new Date() + "\nError connecting to database, create_group (function)\n" + err.stack + "\n");
              result.status(500).json({success: false, title: 'Error', message: 'Error on our end, the database is currently down. Try again later!'});
            }
            var groupNameTrim = res.rows[0].create_group.split("%", 1)[0]
            result.json({success: true, title: '', message: 'New group \"' + groupNameTrim + '\" was created!'});
          })
        } 
        catch(err){
          result.json({success: false, title: '', message: 'Session timed out. Please refresh page and log back in.'})
        }
      })
    })

    app.get('/getGroups', function(request, result) {
      var userID;
      var groups = [];
      var admins = [];
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({success: false, title: '', message: 'Session timed out. Please refresh page and log back in.'})
      }
      pool.connect()
        .then(client => {
          var queryStringA = 'SELECT id, name, member_count, admin, restrict FROM public.groups WHERE id in (SELECT group_id FROM public.groups_users WHERE user_id = $1 AND leave = false) ORDER BY date_created ASC;'
          var queryStringB = 'WITH _groups AS (SELECT group_id FROM public.groups_users WHERE user_id = $1 AND leave = false), _admins AS (SELECT admin FROM public.groups WHERE id IN (SELECT group_id FROM _groups)) SELECT id, name FROM public.users WHERE id IN (SELECT admin FROM _admins)'
          client.query(queryStringA, [userID])
            .then(res => {
              groups = res.rows;
              client.query(queryStringB, [userID])
                .then(res => {
                  client.release();
                  admins = res.rows;
                  result.json({success: true, groups: groups, admins: admins});
                })
                .catch(err => {
                  client.release();
                  console.error(new Date() + "\nError connecting to database, getGroups\n" + err.stack + "\n");
                  result.status(500).json({success: false, title: 'Internal Server Error', message: 'Error on our end, the database is currently down. Try again later!'});
                })
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, getGroups\n" + err.stack + "\n");
              result.status(500).json({success: false, title: 'Internal Server Error', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
    })
    
    return app;
}
