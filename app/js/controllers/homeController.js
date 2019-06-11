'use strict';

let HomeCtrl = function ($scope, $location, $window, $uibModal, SessionCtrl, ServerCtrl, ModalCtrls) {
    $scope.homeLoad = function(){
        ServerCtrl.post('/authenticate', {token: $window.sessionStorage.getItem('token')})
            .then(function(data){
                if(data.auth){
                    $location.path('/hub');
                }
            })
    }
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
