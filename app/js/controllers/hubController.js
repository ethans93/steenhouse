'use strict';

let HubCtrl = function ($scope, $location, $window, $uibModal, SessionCtrl, ModalCtrls) {
	$scope.initCalendar = function(){
		$scope.hubName = SessionCtrl.getName();
	};
	$scope.eventSources = [];
	$scope.createGroup = function(){
		$uibModal.open(ModalCtrls.createGroup());
	}

	$scope.joinGroup = function(){
		$uibModal.open(ModalCtrls.joinGroup());
	}

	$scope.goToGroups = function(){
		$location.path('/hub/groups');
	}

	$scope.goToList = function(){
		$location.path('/hub/mylist');
	}

};

module.exports = HubCtrl;