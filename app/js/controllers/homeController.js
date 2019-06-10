'use strict';

let HomeCtrl = function ($scope, $location, $window, $uibModal, SessionCtrl, ServerCtrl, ModalCtrls) {
	$scope.signUpModalHome = function(){
		$uibModal.open(ModalCtrls.signUp())
			.result.then((res)=>{
                if(res.success){
                    SessionCtrl.pushAlerts(res.type, res.message);
                }
                else{
                    $scope.signInModalHome()
                }
            })
	}
	$scope.signInModalHome = function(){
		$uibModal.open(ModalCtrls.signIn())
			.result.then((res)=>{
                if(res.success){
                    SessionCtrl.pushAlerts(res.type, res.message);
                }
                else{
                    $scope.signUpModalHome()
                }
            })
	}
};

module.exports = HomeCtrl;
