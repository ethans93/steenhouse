'use strict';

let ServerCtrl = function ($http) {
	return{
        get: function(url){
            return $http({
                method: 'GET',
                url: url,
                headers: {
                    'Content-type': 'application/json'
                }
            }).then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
                return response.data;
            });
        },
        post: function (url, data) {
            return $http({
                method: 'POST',
                url: url,
                headers: {
                    'Content-type': 'application/json'
                },
                data: data
            }).then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log("errorCallback " + response.data);
                return response.data;
            });
        }
	}
};

module.exports = ServerCtrl;
