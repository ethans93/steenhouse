'use strict';
global.$ = global.jQuery = require('jquery');

let angular     = require('angular'),
    animate     = require('angular-animate'),
    clipboard   = require('ngclipboard'),
    file        = require('ng-file-upload'),
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
    HubCtrl             = require('../js/controllers/hubController.js'),
    GroupsCtrl          = require('../js/controllers/groupsController.js'),
    GroupCtrl           = require('../js/controllers/groupController.js'),
    ListCtrl            = require('../js/controllers/listController.js'),
    ProfileCtrl         = require('../js/controllers/profileController.js'),

    pwCheck             = require('../js/directives/pwCheck.js'),

    ServerCtrl          = require('../js/factory/serverController.js'),

    SessionCtrl			= require('../js/services/sessionController.js'),
    ModalCtrls          = require('../js/services/modalControllers.js');

let app = angular.module('Steenhouse', [animate, clipboard, file, route, uib, touch, 'ui.calendar']);

app.config(function ($routeProvider, $httpProvider) {
    $routeProvider
    	.when("/home", {templateUrl: "../views/home.html", controller: "HomeCtrl", restrictions: {restricted: false}})
        .when("/hub", {templateUrl: "../views/hub.html", controller: "HubCtrl", restrictions: {restricted: true}})
        .when("/hub/groups", {templateUrl: "../views/groups.html", controller: "GroupsCtrl", restrictions: {restricted: true}})
        .when("/hub/groups/:group!:groupid", {templateUrl: "../views/group.html", controller: "GroupCtrl", restrictions: {restricted: true}})
        .when("/hub/mylist", {templateUrl: "../views/list.html", controller: "ListCtrl", restrictions: {restricted: true}})
        .when("/hub/profile", {templateUrl: "../views/profile.html", controller: "ProfileCtrl", restrictions: {restricted: true}})
        .otherwise({redirectTo: "/home"});
});

app.controller("IndexCtrl", ["$rootScope", "$scope", "$location", "$window", "$route", "$uibModal", "SessionCtrl", "ServerCtrl", "ModalCtrls", IndexCtrl]);
app.controller("HomeCtrl", ["$scope", "$location", "$window", "$uibModal", "SessionCtrl", "ServerCtrl", "ModalCtrls", HomeCtrl]);
app.controller("HubCtrl", ["$scope", "$location", "$window", "$uibModal", "SessionCtrl", "ModalCtrls", HubCtrl]);
app.controller("GroupsCtrl", ["$scope", "$location", "$window", "$uibModal", "ServerCtrl", "ModalCtrls", "SessionCtrl", GroupsCtrl]);
app.controller("GroupCtrl", ["$scope", "$location", "$window", "$route", "$routeParams", "$uibModal", "ServerCtrl", "ModalCtrls", "SessionCtrl", GroupCtrl]);
app.controller("ListCtrl", ["$scope", "$location", "$window", "$uibModal", "$parse", "ServerCtrl", "ModalCtrls", "SessionCtrl", ListCtrl]);
app.controller("ProfileCtrl", ["$scope", "$location", "$window", "$uibModal", "ServerCtrl", "SessionCtrl", "ModalCtrls", ProfileCtrl]);

app.directive('pwCheck', [pwCheck]);

app.factory('ServerCtrl', ['$http', ServerCtrl]);

app.service('SessionCtrl', ['$injector', '$window', SessionCtrl]);
app.service('ModalCtrls', [ModalCtrls]);





