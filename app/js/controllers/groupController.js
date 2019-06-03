'use strict';

let GroupCtrl = function ($scope, $location, $window, $routeParams, ServerCtrl, ModalCtrls, SessionCtrl) {
	$scope.groupLoad = function(){
		console.log($routeParams.groupid)
	}
};

module.exports = GroupCtrl;