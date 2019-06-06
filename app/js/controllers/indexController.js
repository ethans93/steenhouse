'use strict';

let IndexCtrl = function ($rootScope, $scope, $location, $window, $route, SessionCtrl, ServerCtrl, ModalCtrls) {

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
        ServerCtrl.authenticate({token: $window.sessionStorage.getItem('token')})
            .then(function(data){
                if(next.restrictions.restricted && !data.auth){
                    $location.path('/home');
                    //SessionCtrl.pushAlerts(data.type, data.message);
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

    // $(function () {
    //     var lastScrollTop = 0;
    //     var $navbar = $('.navbar');
        
    //     $(window).scroll(function(event){
    //         if($(window).width() < 992){
    //             var st = $(this).scrollTop();

    //             if (st > lastScrollTop) { 
    //                 $navbar.fadeOut();
    //                 $scope.collapse();
    //             } 
    //             else {
    //                 $navbar.fadeIn();
    //             }
    //             lastScrollTop = st;
    //         }
    //     });
    // });

    $scope.signInModal = function(){
        $scope.collapse();
        ModalCtrls.signIn();
    }

    $scope.indexAlerts = SessionCtrl.getAlerts();
   
    $scope.closeAlert = function(index) {
        SessionCtrl.spliceAlerts(index);
        $scope.indexAlerts = SessionCtrl.getAlerts();
    };

};

module.exports = IndexCtrl;
