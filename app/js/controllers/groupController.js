'use strict';

let GroupCtrl = function ($scope, $location, $window, $routeParams, ServerCtrl, ModalCtrls, SessionCtrl) {
	$scope.groupLoad = function(){
		$scope.group = SessionCtrl.getGroup();
		console.log($routeParams.groupid)
	}
};

module.exports = GroupCtrl;