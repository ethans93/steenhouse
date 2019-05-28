'use strict';

let ServerCtrl = function ($http) {
	return{
        signup: function (userInfo) {
            return $http({
                method: 'POST',
                url: '/signup',
                headers: {
                    'Content-type': 'application/json'
                },
                data: userInfo
            }).then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
            });
        },
        signin: function (userInfo) {
            return $http({
                method: 'POST',
                url: '/signin',
                headers: {
                    'Content-type': 'application/json'
                },
                data: userInfo
            }).then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
            });
        },
        getOdinPics: function(){
            return $http({
                method: 'GET',
                url: '/getOdinPics',
                headers: {
                    'Content-type': 'application/json'
                }
            }).then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
            });
        },
        authenticate: function(token){
            return $http({
                method: 'POST',
                url: '/authenticate',
                headers: {
                    'Content-type': 'application/json'
                },
                data: token
            }).then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
            });
        },
        createGroup: function(groupInfo){
            return $http({
                method: 'POST',
                url: '/createGroup',
                headers: {
                    'Content-type': 'application/json'
                },
                data: groupInfo
            }).then( function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
            });
        },
        getGroups: function(){
            return $http({
                method: 'GET',
                url: '/getGroups',
                headers: {
                    'Content-type': 'application/json'
                }
            }).then( function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
                return response.data;
            });
        }
	}
};

module.exports = ServerCtrl;
