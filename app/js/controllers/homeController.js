'use strict';

let HomeCtrl = function ($scope, $location, $window, SessionCtrl, ServerCtrl, ModalCtrls) {
	$scope.signUpModal = function(){
		ModalCtrls.signUp();
	}
};

module.exports = HomeCtrl;
