'use strict';

let SignUpCtrl = function ($scope, $location, $window, SessionCtrl, ServerCtrl, ModalCtrls) {
	$scope.submit = function (newUser) {
        if ($scope.form.$valid) {
            ServerCtrl.signup(newUser)
            	.then(function (data) {
                	if (data.success) {
                        SessionCtrl.signin(data.token);
                        SessionCtrl.setName(data.name);
                        $location.path('/hub');                     
                	}
                    ModalCtrls.alert(data.title, data.message)
            	}); 
        }   
    };
    $scope.goToSignIn = function () {
        ModalCtrls.signIn();
    };
};

module.exports = SignUpCtrl;