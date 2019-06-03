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
                					if (data.result === 'success') {
                						SessionCtrl.signin(data.token);
                						SessionCtrl.setName(data.name);
                						$location.path('/hub');
                    	 				$uibModalInstance.close();	
                					}
                					SessionCtrl.pushAlerts(data.type, data.message);
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
                					if (data.result === 'success') {
            							SessionCtrl.signin(data.token);
            							SessionCtrl.setName(data.name);
            							$location.path('/hub');
            							$uibModalInstance.close();                     
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
            					})
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
                					if (data.result === 'success') {
                    	 				$uibModalInstance.close();	
                					}
                					SessionCtrl.pushAlerts(data.type, data.message);
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
									if(data.result === 'success'){
										$rootScope.$emit(data.emit);
										$uibModalInstance.close();
									}
									SessionCtrl.pushAlerts(data.type, data.message);
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
								if(data.emit != ''){
									$rootScope.$emit(data.emit);
								}
								SessionCtrl.pushAlerts(data.type, data.message);
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