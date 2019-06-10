'use strict';

let SignUpCtrl = function ($scope, $location, $window, SessionCtrl, ServerCtrl, ModalCtrls) {
    var formInputs = ['email', 'group', 'code'];
	$scope.submit = function (newUser) {
        if ($scope.form.$valid) {
            ServerCtrl.post('/signup', newUser)
            	.then(function (data) {
                	if (data.result === 'success') {
                        SessionCtrl.signin(data.token);
                        SessionCtrl.setName(data.name);
                        $location.path('/hub');                     
                	}
                    else if(data.result === 'fail'){
                        formInputs.forEach(function(input) {
                            $('#' + input).removeClass('invalid-form')
                        })
                        data.input.forEach(function(i) {
                            $('#' + i).addClass('invalid-form')
                        })
                    }
                    SessionCtrl.pushAlerts(data.type, data.message)
            	}); 
        }   
    };
    $scope.goToSignIn = function () {
        ModalCtrls.signIn();
    };
    
};

module.exports = SignUpCtrl;