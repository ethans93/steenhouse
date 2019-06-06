const launchFactory = require('./server/launch-factory');
const _ = require('lodash');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const Cookie = require('cookie');
const randomize = require('randomatic');
const Salt = parseInt(process.env.SALT);
const nodedir = require('node-dir');
const jwt = require('jsonwebtoken');

require('dotenv').config();

module.exports.createApp = function () {
    return launchFactory.setupApp()
        .then(mountUrlEndpoints);
};

function mountUrlEndpoints(app) {

    app.get('/', function (req, res) {
        res.sendFile('dist/index.html', { root: __dirname });
    });

    const pool = new Pool();

    console.log(randomize('A0', 10));
    pool.on('error', (err, client) => {
      if(err.message === 'write after end'){
        console.error(new Date() + " - Idle pool timed out\n")
      }
      else{
        console.error(new Date() + "\nUnexpected error on idle client\n" + err.stack + "\n")
      }
    })

    app.post('/signup', function(request, result) {
      var newUser = request.body;
      let hashPass = bcrypt.hashSync(newUser.pw, Salt);
      let dob = "2000-" + newUser.bday.replace('/', '-');
      pool.connect()
        .then(client => {
          var queryStringA = 'SELECT check_duplicate_email($1);';
          var queryStringB = 'SELECT check_code($1, $2);';
          var queryStringC = 'SELECT create_user($1, $2, $3, $4, $5, $6);';
          client.query(queryStringA, [newUser.email])
            .then(res => {
              if(res.rows[0].check_duplicate_email){
                client.release();
                result.json({result: 'fail', type: 'warning', message: 'Email already in use', input: ['email']});
              }
              else{
                client.query(queryStringB, [newUser.group, newUser.code])
                  .then(res => {
                    switch(res.rows[0].check_code){
                      case -3:
                        client.release();
                        result.json({result: 'fail', type: 'warning', message: 'No group with the name \"' + request.body.group + '\" was found!', input: ['group']});
                        break;
                      case -2:
                        client.release();
                        result.json({result: 'fail', type: 'warning', message: 'No invitation using that code was found for the group \"' + request.body.group + '\".', input: ['code']});
                        break;
                      case -1:
                        client.release();
                        result.json({result: 'fail', type: 'warning', message: 'That invitation has already been used!', input: ['group', 'code']});
                        break;
                      default:
                        client.query(queryStringC, [newUser.email, hashPass, dob, newUser.name, newUser.code, res.rows[0].check_code])
                          .then(res => {
                            client.release();
                            var userID = res.rows[0].create_user;
                            var email = request.body.email;
                            var firstName = request.body.name.split(" ", 1);
                            var token = jwt.sign({userID: userID, email: email}, process.env.KEY,{expiresIn: '1d'});
                            result.setHeader('Set-Cookie', Cookie.serialize('token', token, {
                              maxAge: 60 * 60 * 24 * 1
                            }));
                            console.log(new Date() + "\nNew user added: " + newUser.email + "\n");
                            result.json({result: 'success', type: 'success', message: 'Welcome ' + firstName[0] + '!', token: token, name: firstName[0]});
                          })
                          .catch(err => {
                            client.release();
                            console.error(new Date() + "\nError connecting to database, create_user (function) for " + newUser.email + ":\n" + err.stack + "\n");
                            result.status(500).json({result: 'critical', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                          })
                    }
                  })
                  .catch(err => {
                    client.release();
                    console.error(new Date() + "\nError connecting to database, check_code (function) for " + newUser.email + ":\n" + err.stack + "\n");
                    result.status(500).json({result: 'critical', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                  })
              }
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, check_duplicate_email (function) for " + newUser.email + ":\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/signin', function (request, result) {
      var userEmail = request.body.email;
      pool.connect()
        .then(client => {
          var queryString = 'SELECT * FROM signin($1);';
          client.query(queryString, [userEmail])
            .then(res => {
              client.release();
              var user = res.rows[0]
              if(user.result){
                bcrypt.compare(request.body.pw, user.pw, (err, res) => {
                  if(err){
                    console.error(new Date() + "\nError with bcrypt\n" + err.stack + "\n");
                    result.status(500).json({result: 'critical', type: 'danger', message: 'Problem with our encryption service. Try again later!'});
                  }
                  if(res){
                    var userID = user.id;
                    var email = user.email;
                    var firstName = user.name.split(" ", 1);
                    var token = jwt.sign({userID: userID, email: email}, process.env.KEY,{expiresIn: '1d'});
                    result.setHeader('Set-Cookie', Cookie.serialize('token', token, {
                      maxAge: 60 * 60 * 24 * 1
                    }));
                    result.json({result: 'success', type: 'success', message: 'Welcome back ' + firstName[0] + '!', token: token, name: firstName[0]});
                  }
                  else{
                    result.json({result: 'fail', type: 'warning', message: 'The email and/or password entered was invalid'});
                  }
                })
              }
              else{
                result.json({result: 'fail', type: 'warning', message: 'The email and/or password entered was invalid'});
              }
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, signin (function)\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.get('/getOdinPics',function(request, result){
      var files = []
      nodedir.paths((__dirname + '\\dist\\images'), true, function(err, paths) {
        try{
          if (err) throw err;
          paths.forEach(function(p){
            var temp = p.split("\\");
            if(temp[temp.length - 1].substring(0,3) === "IMG"){
              files.push(temp[temp.length - 1]);
            }
          })
          result.json({result: 'success', picArray: files});
        }
        catch(err){
          console.error(new Date() + "\nError retrieving Odin pics\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', type: 'warning', message: 'We can\'t seem to find any pictures, try again later!'});
        }
      });   
    })

    app.post('/authenticate', function(request, result) {
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        var decodedLocal = jwt.verify(request.body.token, process.env.KEY);
        if(decodedCookie.userID === decodedLocal.userID && decodedCookie.email === decodedLocal.email){
          result.json({result: 'success', auth: true})
        }
        else{
          result.json({result: 'fail', auth: false, type: 'warning', message: 'if else'})
        }
      } 
      catch(err){
        result.json({result: 'fail', auth: false, type: 'warning', message: 'Catch'})
      }
    })

    app.post('/createGroup', function(request, result) {
      var userID;
      var group = request.body;
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'});
      }
      pool.connect()
        .then(client => {
          var queryString = 'SELECT create_group($1, $2, $3)';
          client.query(queryString, [group.name, userID, group.restrict])
            .then(res => {
              client.release();
              var groupNameTrim = res.rows[0].create_group.split("#", 1)[0];
              result.json({result: 'success', emit: 'refreshGroups', type: 'success', message: 'New group \"' + groupNameTrim + '\" was created!'});
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, create_group (function)\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
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
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      pool.connect()
        .then(client => {
          var queryStringA = 'SELECT id, name, member_count, admin, restrict FROM public.groups WHERE id in (SELECT group_id FROM public.groups_users WHERE user_id = $1 AND leave = false ORDER BY date_joined ASC);'
          var queryStringB = 'WITH _groups AS (SELECT group_id FROM public.groups_users WHERE user_id = $1 AND leave = false), _admins AS (SELECT admin FROM public.groups WHERE id IN (SELECT group_id FROM _groups)) SELECT id, name FROM public.users WHERE id IN (SELECT admin FROM _admins)'
          client.query(queryStringA, [userID])
            .then(res => {
              groups = res.rows;
              client.query(queryStringB, [userID])
                .then(res => {
                  client.release();
                  admins = res.rows;
                  result.json({result: 'success', groups: groups, admins: admins});
                })
                .catch(err => {
                  client.release();
                  console.error(new Date() + "\nError connecting to database, getGroups\n" + err.stack + "\n");
                  result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                })
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, getGroups\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.get('/getList', function(request, result) {
      var userID;
      var list = [];
      var groups = [];
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      pool.connect()
        .then(client => {
          var queryStringA = 'SELECT id, item_name, item_notes, link, public, groups_allowed FROM public.users_list WHERE user_id = $1 ORDER BY date_created ASC;';
          var queryStringB = 'WITH _groups AS (SELECT group_id FROM public.groups_users WHERE user_id = $1 AND leave = false) SELECT id, name FROM public.groups WHERE id IN (SELECT group_id FROM _groups)';
          client.query(queryStringA, [userID])
            .then(res => {
              list = res.rows;
              client.query(queryStringB, [userID])
                .then(res => {
                  client.release();
                  groups = res.rows;
                  result.json({result: 'success', list: list, groups: groups})
                })
                .catch(err => {
                  client.release();
                  console.error(new Date() + "\nError connecting to database, getList\n" + err.stack + "\n");
                  result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                })
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, getList\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })

    })

    app.post('/addItem', function(request, result) {
      var userID;
      var item = request.body;
      var groupsAllowed = [];
      item.selected.forEach(function(obj) {
        groupsAllowed.push(obj.id);
      })
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      pool.connect()
        .then(client => {
          var queryString = 'INSERT INTO public.users_list(user_id, item_name, item_notes, link, public, groups_allowed, date_created) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP(2))';
          client.query(queryString, [userID, item.name, item.notes, item.link, item.public, groupsAllowed])
            .then(res => {
              client.release();
              result.json({result: 'success', emit: 'refreshList', type: 'success', message: 'Item added'})
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, addItem\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/removeItem', function(request, result) {
      var userID;
      var itemID = request.body.id;
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      pool.connect()
        .then(client => {
          var queryString = 'DELETE FROM public.users_list WHERE id = $1 AND user_id = $2;';
          client.query(queryString, [itemID, userID])
            .then(res => {
              client.release();
              result.json({result: 'success', emit: 'refreshList', type: 'warning', message: 'Item removed'});
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, removeItem\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/updateItem', function(request, result) {
      var userID;
      var item = request.body;
      var groupsAllowed = [];
      item.selected.forEach(function(obj) {
        groupsAllowed.push(obj.id);
      })
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      pool.connect()
        .then(client => {
          var queryString = 'UPDATE public.users_list SET item_name = $1, item_notes = $2, link = $3, public = $4, groups_allowed = $5 WHERE id = $6 AND user_id = $7;';
          client.query(queryString, [item.name, item.notes, item.link, item.public, groupsAllowed, item.id, userID])
            .then(res => {
              client.release();
              result.json({result: 'success', emit: 'refreshList', type: 'info', message: 'Item updated'})
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, updateItem\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/leaveGroup', function(request, result) {
      var userID;
      var groupID = request.body.id;
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      pool.connect()
        .then(client =>{
          var queryString = 'UPDATE public.groups_users SET leave = true WHERE group_id = $1 AND user_id = $2;';
          client.query(queryString, [groupID, userID])
            .then(res => {
              client.release();
              result.json({result: 'success', emit: 'refreshGroups', type: 'warning', message: 'Group Left'});
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, leaveGroup\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/joinGroup', function(request, result) {
      var userID;
      var groupInfo = request.body;
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      pool.connect()
        .then(client => {
          var queryStringA = 'SELECT check_code($1, $2);';
          var queryStringB = 'UPDATE public.groups_users SET user_id= $1, date_joined = CURRENT_TIMESTAMP(2) WHERE group_id = $2 AND code = $3;';
          client.query(queryStringA, [groupInfo.name, groupInfo.code])
            .then(res => {
              switch(res.rows[0].check_code){
                case -3:
                  client.release();
                  result.json({result: 'fail', type: 'warning', message: 'No group with the name \"' + groupInfo.name + '\" was found!'});
                  break;
                case -2:
                  client.release();
                  result.json({result: 'fail', type: 'warning', message: 'No invitation using that code was found for the group \"' + groupInfo.name + '\".'});
                  break;
                case -1:
                  client.release();
                  result.json({result: 'fail', type: 'warning', message: 'That invitation has already been used!'});
                  break;
                default:
                  client.query(queryStringB, [userID, res.rows[0].check_code, groupInfo.code])
                    .then(res => {
                      client.release();
                      result.json({result: 'success', emit: 'refreshGroups', type: 'info', message: 'Group Joined'});
                    })
                    .catch(err => {
                      client.release();
                      console.error(new Date() + "\nError connecting to database, joinGroup\n" + err.stack + "\n");
                      result.status(500).json({result: 'critical', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                    })
              }
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, check_code(function)\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    return app;
}
