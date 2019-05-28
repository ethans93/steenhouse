'use strict';

let HubCtrl = function ($scope, $location, $window, SessionCtrl, ModalCtrls) {
	$scope.initCalendar = function(){
		$scope.hubName = SessionCtrl.getName();
	};
	$scope.eventSources = [];
	$scope.createGroup = function(){
		ModalCtrls.createGroup();
	}

	$scope.goToGroups = function(){
		$location.path('/hub/groups');
	}

	$scope.goToList = function(){
		$location.path('/hub/mylist');
	}

};

module.exports = HubCtrl;