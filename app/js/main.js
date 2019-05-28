'use strict';
global.$ = global.jQuery = require('jquery');

let angular     = require('angular'),
    route       = require('angular-route'),
    uib         = require('ui-bootstrap4'),
    touch       = require('angular-touch');
    
require('../css/imported/import.css');
require('../../node_modules/bootstrap/dist/js/bootstrap.min.js');
require('../../node_modules/moment/min/moment.min.js');
require('../../node_modules/angular-ui-calendar/src/calendar.js');
require('../../node_modules/fullcalendar/dist/fullcalendar.min.js');

let IndexCtrl           = require('../js/controllers/indexController.js'),
    HomeCtrl            = require('../js/controllers/homeController.js'),
    SignUpCtrl          = require('../js/controllers/signupController.js'),
    SignInCtrl          = require('../js/controllers/signinController.js'),
    HubCtrl             = require('../js/controllers/hubController.js'),
    GroupsCtrl          = require('../js/controllers/groupsController.js'),
    ListCtrl            = require('../js/controllers/listController.js'),

    pwCheck				= require('../js/directives/pwCheck.js'),

    ModalCtrls			= require('../js/factory/modalControllers.js'),
    ServerCtrl			= require('../js/factory/serverController.js'),

    SessionCtrl			= require('../js/services/sessionController.js'),

    OdinCtrl            = require('../js/controllers/odinController.js');

let app = angular.module('Steenhouse', [route, uib, touch, 'ui.calendar']);

app.config(function ($routeProvider, $httpProvider) {
    $routeProvider
    	.when("/home", {templateUrl: "../views/home.html", controller: "HomeCtrl", restrictions: {restricted: false}})
   		.when("/home/signup", {templateUrl: "../views/signup.html", controller: "SignUpCtrl", restrictions: {restricted: false}})
        .when("/hub", {templateUrl: "../views/hub.html", controller: "HubCtrl", restrictions: {restricted: true}})
        .when("/hub/groups", {templateUrl: "../views/groups.html", controller: "GroupsCtrl", restrictions: {restricted: true}})
        //.when("/hub/groups/:group", {templateUrl: "../views/group.html", controller: "GroupCtrl", restrictions: {restricted: true}})
        .when("/hub/mylist", {templateUrl: "../views/list.html", controller: "ListCtrl", restrictions: {restricted: true}})
        //.when("/hub/account", {templateUrl: "../views/account.html", controller: "AccountCtrl", restrictions: {restricted: true}})
        .when("/hub/odin", {templateUrl: "../views/odin.html", controller: "OdinCtrl", restrictions: {restricted: true}})
        .otherwise({redirectTo: "/home"});
});

app.controller("IndexCtrl", ["$rootScope", "$scope", "$location", "$window", "$route", "SessionCtrl", "ServerCtrl", "ModalCtrls", IndexCtrl]);
app.controller("HomeCtrl", ["$scope", "$location", "$window", "SessionCtrl", "ServerCtrl", "ModalCtrls", HomeCtrl]);
app.controller("SignUpCtrl", ["$scope", "$location", "$window", "SessionCtrl", "ServerCtrl", "ModalCtrls", SignUpCtrl]);
app.controller("SignInCtrl", ["$scope", "$location", "$window", "SessionCtrl", "ServerCtrl", SignInCtrl]);
app.controller("HubCtrl", ["$scope", "$location", "$window", "SessionCtrl", "ModalCtrls", HubCtrl]);
app.controller("GroupsCtrl", ["$scope", "$location", "$window", "ServerCtrl", "ModalCtrls", "SessionCtrl", GroupsCtrl]);
app.controller("ListCtrl", ["$scope", "$location", "$window", ListCtrl]);

app.controller("OdinCtrl", ["$scope", "$location", "$window", "ServerCtrl", OdinCtrl]);
//List
//Group
//Account

app.directive('pwCheck', [pwCheck]);

app.factory('ModalCtrls', ['$http', '$uibModal', ModalCtrls]);
app.factory('ServerCtrl', ['$http', ServerCtrl]);

app.service('SessionCtrl', ['$injector', '$window', 'ServerCtrl', SessionCtrl]);





