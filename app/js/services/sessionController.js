'use strict';

let SessionCtrl = function ($injector, $window, ServerCtrl) {
	this.signin = function (token) {
        $window.sessionStorage.setItem('token', token);
    };
    this.signout = function () {
        $window.sessionStorage.removeItem('token');
        $window.sessionStorage.removeItem('auth');
    };
    this.isSignedIn = function () {
    	return ($window.sessionStorage.getItem('auth'));
    };
    this.setName = function(name){
        $window.sessionStorage.setItem('name', name);
    }
    this.getName = function(){
        return($window.sessionStorage.getItem('name'));
    }

    var indexAlerts = [];
    this.pushAlerts = function(type, msg){
        indexAlerts.push({type: type, msg: msg})
    }
    this.getAlerts = function(){
        return indexAlerts
    }
    this.spliceAlerts = function(index){
       indexAlerts.splice(index, 1);
    }

    var group = {};
    this.setGroup = function(g){
        group = g;
    }
    this.getGroup = function(){
        return group;
    }
};

module.exports = SessionCtrl;