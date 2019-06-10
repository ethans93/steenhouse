'use strict';

let SessionCtrl = function ($injector, $window) {
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
        if(indexAlerts.length > 0){
            indexAlerts.splice(0);
        }
        indexAlerts.push({type: type, msg: msg})
    }
    this.getAlerts = function(){
        return indexAlerts
    }
    this.spliceAlerts = function(index){
       indexAlerts.splice(index, 1);
    }
    this.chunkArray = function(arr, size){
        var newArr = [];
        for (var i=0; i<arr.length; i+=size) {
            newArr.push(arr.slice(i, i+size));
        }
        return newArr;
    }
};

module.exports = SessionCtrl;