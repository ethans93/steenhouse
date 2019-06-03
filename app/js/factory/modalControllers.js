'use strict';

let ModalCtrls = function ($http,$uibModal) {
	return{
		alert: function(title, message){
			$uibModal.open({
				templateUrl: '../views/modals/alert_modal.html',
				controller: function($scope, $uibModalInstance){
					$scope.title = title
					$scope.message = message;
					$scope.close = function(){
						$uibModalInstance.close();
					}
				}
			})
		},
		signIn: function(){
			$uibModal.open({
				templateUrl: '../views/modals/signin_modal.html',
				controller: function($scope,$location, $uibModalInstance, SessionCtrl, ServerCtrl, ModalCtrls){
					$scope.submit = function (user) {
        				if ($scope.form.$valid) {
            				ServerCtrl.signin(user)
            					.then(function (data) {
                					if (data.success) {
                						SessionCtrl.signin(data.token);
                						SessionCtrl.setName(data.name);
                						$location.path('/hub');
                    	 				$uibModalInstance.close();
                    	 				SessionCtrl.pushAlerts('success', data.message);	
                					}
                					else{
                						ModalCtrls.alert(data.title, data.message);
                					}
            					}); 
        				}
    				};
					$scope.close = function(){
						$uibModalInstance.close();
					}
					$scope.switchToSignUp = function(){
						ModalCtrls.signUp();
						$uibModalInstance.close();
					}
				}
			})
		},
		signUp: function(){
			$uibModal.open({
				templateUrl: '../views/modals/signup_modal.html',
				controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl, ModalCtrls){
					$scope.submit = function (newUser) {
        				if ($scope.form.$valid) {
            				ServerCtrl.signup(newUser)
            					.then(function (data) {
                					if (data.success) {
                						SessionCtrl.signin(data.token);
                						SessionCtrl.setName(data.name);
                						$location.path('/hub');
                    	 				$uibModalInstance.close();	
                						SessionCtrl.pushAlerts('success', data.message);	
                					}
                					else{
                						ModalCtrls.alert(data.title, data.message);
                					}
            					}); 
        				}
    				};
					$scope.close = function(){
						$uibModalInstance.close();
					}
					$scope.switchToSignIn = function(){
						ModalCtrls.signIn();
						$uibModalInstance.close();
					}
				}
			})
		},
		createGroup: function(){
			$uibModal.open({
				templateUrl:'../views/modals/creategroup_modal.html',
				controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl, ModalCtrls){
					$scope.resNull = false;
					$scope.group = {restrict: null}
					$scope.submit = function(group){
						if($scope.form.$valid && $scope.group.restrict != null){
							ServerCtrl.createGroup(group)
            					.then(function (data) {
                					if (data.success) {
                    	 				$uibModalInstance.close();
                    	 				SessionCtrl.pushAlerts('success', data.message);	
                					}
                					else{
                						SessionCtrl.pushAlerts('warning', data.message);
                					}
            					});
						}
						else if(!$scope.form.$valid && $scope.group.restrict != null){
							$scope.resNull = false;
						}
						else{
							$scope.resNull = true;
						}
					}
					$scope.close = function(){
						$uibModalInstance.close();
					}
				}
			})
		},
		addItem : function(groups){
			$uibModal.open({
				templateUrl: '../views/modals/additem_modal.html',
				controller: function($rootScope, $scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					SessionCtrl.pushAlerts('info', 'TEST');
					$scope.groups = groups;
					$scope.groupsTrim = [];
					$scope.groups.forEach(function(g) {
						g.prefix = g.name.split('#')[0];
						g.suffix = g.name.split('#')[1];
						$scope.groupsTrim.push({id: g.id, name: g.prefix})
					})
					$scope.submit = function(item){
						if($scope.form.$valid){
							item.notes = (item.notes === undefined ? item.notes = "" : item.notes = item.notes);
							item.selected = (item.selected === undefined ? item.selected = [] : item.selected = item.selected);
							ServerCtrl.addItem(item)
								.then(function(data) {
									if(data.success){
										$rootScope.$emit(data.emit);
										SessionCtrl.pushAlerts(data.type, data.message);
										$uibModalInstance.close();
									}
									else{
										SessionCtrl.pushAlerts('warning', data.message);
									}
								})
						}	
					}
					$scope.close = function(){
						$uibModalInstance.close();
					}
					
				}
			})
		},
		removeItem: function(id){
			$uibModal.open({
				templateUrl: '../views/modals/removeitem_modal.html',
				controller: function($rootScope, $scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					$scope.confirm = function(){
						ServerCtrl.removeItem({id: id})
							.then(function(data) {
								SessionCtrl.pushAlerts(data.type, data.message);
								$rootScope.$emit(data.emit);
								if(data.result === 'success'){
									$uibModalInstance.close();
								}
							})
					}
					$scope.close = function(){
						$uibModalInstance.close();
					}
				}
			})
		}
	}
};

module.exports = ModalCtrls;