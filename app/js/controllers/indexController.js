'use strict';

let IndexCtrl = function ($rootScope, $scope, $location, $window, $route, $uibModal, SessionCtrl, ServerCtrl, ModalCtrls) {

    /*Closes navbar after selection*/
    $('#mainNav a').click(function () {
        $(".navbar-collapse").collapse('hide');
    });
    $scope.collapse = function(){
        $(".navbar-collapse").collapse('hide');
    }
    
    $scope.$on('$locationChangeSuccess', function () {
        $scope.currentPage = $location.path();
    });

    $rootScope.$on('$routeChangeStart', (event, next, current) => {
        ServerCtrl.post('/authenticate', {token: $window.sessionStorage.getItem('token')})
            .then(function(data){
                if(next.restrictions.restricted && !data.auth){
                    $location.path('/home');
                }
                if(!next.restrictions.restricted && data.auth){
                    $location.path(current.originalPath);
                }
                if(data.auth){
                    $window.sessionStorage.setItem('auth', true);
                }
                else{
                    $window.sessionStorage.removeItem('auth');
                } 
            })
    });
    $rootScope.$on('refresh', function() {
        $route.reload();
    })

    $scope.isSignedIn = function(){
        return SessionCtrl.isSignedIn();
    };

    $scope.loc = function(){
        return (SessionCtrl.isSignedIn() ? 'hub' : 'home');
    }

    $scope.signout = function(){
        $scope.collapse();
        SessionCtrl.signout();
        $location.path('/home');
    } 

    $scope.signUpModal = function(){
        $scope.collapse();
        $uibModal.open(ModalCtrls.signUp())
            .result.then((res)=>{
                if(res.success){
                    SessionCtrl.pushAlerts(res.type, res.message);
                }
                else{
                    $scope.signInModal()
                }
            })
    }
    $scope.signInModal = function(){
        $scope.collapse();
        $uibModal.open(ModalCtrls.signIn())
            .result.then((res)=>{
                if(res.success){
                    SessionCtrl.pushAlerts(res.type, res.message);
                }
                else{
                    $scope.signUpModal()
                }
            })
    }

    $scope.indexAlerts = SessionCtrl.getAlerts();
   
    $scope.closeAlert = function(index) {
        SessionCtrl.spliceAlerts(index);
        $scope.indexAlerts = SessionCtrl.getAlerts();
    };

    $scope.currentTime = function(){
        var dt = new Date();
        var time = dt.getHours() + ":" + dt.getMinutes();
        return time;
    }

};

module.exports = IndexCtrl;
