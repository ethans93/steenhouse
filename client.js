const launchFactory = require('./server/launch-factory');
const _ = require('lodash');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const Cookie = require('cookie');
const randomize = require('randomatic');
const Salt = parseInt(process.env.SALT);
const nodedir = require('node-dir');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

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

    pool.on('error', (err, client) => {
      if(err.message === 'write after end'){
        console.error(new Date() + " - Idle pool timed out\n")
      }
      else{
        console.error(new Date() + "\nUnexpected error on idle client\n" + err.stack + "\n")
      }
    })

    AWS.config.update({accessKeyId: process.env.KEY_ID, secretAccessKey: process.env.ACCESS});

     // var imageInfo = {path: 'C:/Users/ethan/Pictures/Odin/png/IMG_0500.png', groupID: 10};
     //  var pathArray = imageInfo.path.split('/');
     //  var dbKey = pathArray[pathArray.length - 1].split('.')[0];
     //  var s3Key = process.env.BUCKET_KEY + imageInfo.groupID + '_' + dbKey + '.png';
     //  console.log(s3Key)

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
      nodedir.paths((__dirname + '/dist/images'), true, function(err, paths) {
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

    app.post('/uploadImage', function(request, result) {
      var data = _.pick(request.body.file, 'type')
      var file = request.files.file;
      var groupID = request.body.groupID
      var dbKey = file.name.split('.')[0] + '.png';
      var s3Key = process.env.BUCKET_KEY + groupID + '_' + dbKey;
      pool.connect()
        .then(client => {
          var queryString = 'SELECT check_image($1, $2)';
          client.query(queryString, [dbKey, groupID])
            .then(res => {
              client.release();
              if(res.rows[0].check_image){
                fs.readFile(file.path, function (err, data) {
                  if(err){ 
                    console.error(new Date() + "\nError reading file, uploadImage\n" + err.stack + "\n");
                    result.status(500).json({result: 'critical', type: 'warning', message: 'Something is wrong on our end, try again later!'});
                  }
                  var base64data = new Buffer.from(data, 'binary');
                  var s3 = new AWS.S3();
                  s3.putObject({
                    Bucket: process.env.BUCKET,
                    Key: s3Key,
                    Body: base64data,
                    ACL: 'public-read'
                  },function (err, res) {
                      cleanDir();
                      if(err){s
                        console.error(new Date() + "\nError uploading image, s3.putObject\n" + err + "\n");
                        result.json({result: 'fail', type: 'danger', message: 'Image failed to upload, try again later'})
                      }
                      result.json({result: 'success', type: 'info', message: 'Image uploaded'})
                  });
                });
              }
              else{
                result.json({result: 'fail', type: 'warning', message: 'An image with that same name has already been uploaded'})
              }
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, check_image (function)\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    function cleanDir(){
      fs.readdir('tmp_images/', (err, files) => {
        if(err){ 
          console.error(new Date() + "\nError reading dir, cleanDir\n" + err.stack + "\n");
          result.json({result: 'backend', type: 'info', message: 'Image uploaded'});
        }
        for (const file of files) {
          fs.stat(path.join('tmp_images/', file), function(err, stat) {
            if(err){
              console.error(new Date() + "\nError getting " + file + " stats, cleanDir\n" + err + "\n");
            }
            var now = new Date().getTime();
            var endTime = new Date(stat.ctime).getTime() + 600000;
            if(now > endTime){
              fs.unlink(path.join('tmp_images/', file), err => {
                if(err){
                  console.error(new Date() + "\nError unlinking " + file + ", cleanDir\n" + err + "\n");
                }
              });
            }
          })     
        }
      });
    }    


    app.post('/retrieveImages', function(request, result) {
      var groupID = request.body.groupID;
      pool.connect()
        .then(client => {
          var queryString = 'SELECT key FROM public.groups_images WHERE group_id = $1 ORDER BY date_added DESC';
          client.query(queryString, [groupID])
            .then(res => {
              var images = [];
              client.release();
              for(var i = 0; i < res.rows.length; i++){
                images.push({key: res.rows[i].key, url: (process.env.BUCKET_URL + process.env.BUCKET_KEY + groupID + '_' + res.rows[i].key)})
              }
              result.json({result: 'success', images: images})
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, retrieveImages)\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
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
                  result.json({result: 'success', groups: groups, admins: admins, userID: userID});
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
          var queryString = 'INSERT INTO public.users_list(user_id, item_name, item_notes, link, public, groups_allowed, claim_id, date_created) VALUES ($1, $2, $3, $4, $5, $6, 0, CURRENT_TIMESTAMP)';
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
          var queryStringA = 'UPDATE public.groups_users SET leave = true WHERE group_id = $1 AND user_id = $2;';
          var queryStringB = 'UPDATE public.groups SET member_count = (member_count - 1) WHERE id = $1;'
          client.query(queryStringA, [groupID, userID])
            .then(res => {
              client.query(queryStringB, [groupID])
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
          var queryStringB = 'UPDATE public.groups_users SET user_id= $1, leave = false, date_joined = CURRENT_TIMESTAMP WHERE group_id = $2 AND code = $3;';
          var queryStringC = 'UPDATE public.groups SET member_count = (member_count + 1) WHERE id = $1;'
          client.query(queryStringA, [groupInfo.name, groupInfo.code])
            .then(res => {
              var check_code = res.rows[0].check_code;
              switch(check_code){
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
                  client.query(queryStringB, [userID, check_code, groupInfo.code])
                    .then(res => {
                      client.query(queryStringC, [check_code])
                        .then(res => {
                          client.release();
                          result.json({result: 'success', emit: 'refreshGroups', type: 'info', message: 'Group Joined'});
                        })
                        .catch(err => {
                          client.release();
                          console.error(new Date() + "\nError connecting to database, joinGroupC\n" + err.stack + "\n");
                          result.status(500).json({result: 'critical', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                        })
                    })
                    .catch(err => {
                      client.release();
                      console.error(new Date() + "\nError connecting to database, joinGroupB\n" + err.stack + "\n");
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

    app.post('/generateCode', function(request, result) {
      var userID;
      var info = request.body;
      try{
        var cookies = Cookie.parse(request.headers.cookie || '');
        var decodedCookie = jwt.verify(cookies.token, process.env.KEY);
        userID = decodedCookie.userID;
      }
      catch(err){
        result.json({result: 'timeout', emit: 'refresh', type: 'info', message: 'Session timed out'})
      }
      if(!info.restrict || userID === info.admin){
        var code = randomize('A0', 10);
        pool.connect()
          .then(client => {
            var queryString = 'INSERT INTO public.groups_users(group_id, code, creator) VALUES ($1, $2, $3);'
            client.query(queryString, [info.id, code, userID])
              .then(res => {
                client.release();
                result.json({result: 'success', name: info.name, code: code})
              })
              .catch(err => {
                client.release();
                console.error(new Date() + "\nError connecting to database, generateCode\n" + err.stack + "\n");
                result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
              })
          })
          .catch(err => {
            console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
            result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
          })
      }
      else{
        result.json({result: 'fail', type: 'warning', message: 'You are not authorized to generate invite codes'})
      }
    })

    app.post('/getGroup', function(request, result) {
     var userID;
     var groupID = request.body.groupID;
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
          var queryStringA = 'SELECT public.validate_group_visit($1, $2);';
          var queryStringB = 'SELECT admin, restrict FROM public.groups WHERE id = $1'
          client.query(queryStringA, [userID, groupID])
            .then(res => {
              if(res.rows[0].validate_group_visit){
                client.query(queryStringB, [groupID])
                  .then(res => {
                    client.release();
                    var admin = (res.rows[0].admin === userID);
                    var invite = (!res.rows[0].restrict || admin);
                    result.json({result: 'success', admin: admin, invite: invite})
                  })
                  .catch(err => {
                    client.release();
                    console.error(new Date() + "\nError connecting to database, getGroup\n" + err.stack + "\n");
                    result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                  })
              }
              else{
                client.release();
                result.json({result: 'fail', type: 'warning', message: 'You are not authorized to view that group'})
              }

            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, validate_group_visit(function)\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/getWishlists', function(request, result) {
      var userID;
      var groupID = request.body.groupID;
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
          var queryStringPre = 'WITH _users AS (SELECT user_id FROM public.groups_users WHERE user_id != $1 AND group_id = $2 AND leave = false) '
          var queryStringA = 'SELECT id, user_id, item_name, item_notes, link, public, groups_allowed, claim_id, occasion, occ_date, date_created FROM public.users_list WHERE user_id IN (SELECT user_id FROM _users) ORDER BY id ASC;';
          var queryStringB = 'SELECT id, name FROM public.users WHERE id IN (SELECT user_id FROM _users) ORDER BY name ASC;'
          client.query((queryStringPre + queryStringA), [userID, groupID])
            .then(res => {
              var lists = res.rows;
              client.query((queryStringPre + queryStringB), [userID, groupID])
                .then(res => {
                  client.release();
                  var members = res.rows;
                  members.forEach(function(mem) {
                    mem.list = [];
                  })
                  lists.forEach(function(list) {
                    list.hidden = (list.public ? false : true);
                    for(var i = 0; i < list.groups_allowed.length; i++){
                      if(list.groups_allowed[i] === parseInt(groupID)){
                        list.hidden = false;
                      }
                    }
                    members.forEach(function(mem) {
                      if(list.user_id === mem.id && !list.hidden){
                        mem.list.push(list);
                      }
                    })
                  })
                  result.json({result: 'success', lists: members, userID: userID})
                })
                .catch(err => {
                  client.release();
                  console.error(new Date() + "\nError connecting to database, getWishlistsB\n" + err.stack + "\n");
                  result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
                })
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, getWishlistsA\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/getInvites', function(request, result) {
      var userID;
      var groupID = request.body.groupID;
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
          var queryString = 'SELECT group_id, code FROM public.groups_users WHERE creator = $1 AND group_id = $2 AND leave IS NULL';
          client.query(queryString, [userID, groupID])
            .then(res => {
              client.release();
              result.json({result: 'success', invites: res.rows})
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, getInvites\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/claimItem', function(request, result) {
      var userID;
      var itemID = request.body.itemID;
      var occasion = request.body.claim.occ;
      var claimDate = '2000-' + request.body.claim.date.replace('/', '-');
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
          var queryString = 'UPDATE public.users_list SET claim_id = $1, occasion = $2, occ_date = $3 WHERE id = $4;';
          client.query(queryString, [userID, occasion, claimDate, itemID])
            .then(res => {
              client.release();
              result.json({result: 'success', type: 'info', message: 'Item claimed'})
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, claimItem\n" + err.stack + "\n");
              result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'Error on our end, the database is currently down. Try again later!'});
            })
        })
        .catch(err => {
          console.error(new Date() + "\nError connecting to database\n" + err.stack + "\n");
          result.status(500).json({result: 'critical', emit: '', type: 'danger', message: 'The database is currently down. Try again later!'});
        })
    })

    app.post('/unclaimItem', function(request, result) {
      var userID;
      var itemID = request.body.itemID;
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
          var queryString = 'SELECT unclaim_item($1, $2)';
          client.query(queryString, [itemID, userID])
            .then(res => {
              client.release();
              if(res.rows[0].unclaim_item){
                result.json({result: 'success', type: 'info', message: 'Item unclaimed'})
              }
              else{
                result.json({result: 'fail', type: 'warning', message: 'Failed to unclaim item, unauthorized'})
              }
            })
            .catch(err => {
              client.release();
              console.error(new Date() + "\nError connecting to database, unclaimItem\n" + err.stack + "\n");
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


