let express = require('express');
let bodyParser = require('body-parser');
let cors = require('cors');
let path = require('path');
let multipart = require('connect-multiparty');

module.exports.setupApp = function setupApp() {
    var app = express();

    return Promise.resolve(app)
      .then(setupMiddleware)
};
function setupMiddleware(app) {
    //Using static files such as client-side javascript, css, and html.
    app.use(express.static(path.join(__dirname + '/../dist')));
    app.use(cors());
    app.use(multipart({
        uploadDir: 'tmp_images/'
    }));

    const allowCrossDomain = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
    };

    app.use(allowCrossDomain);

    //Using bodyParser in order to get variables from input data
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    return app;
}
