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
				controller: function($rootScope, $scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl, ModalCtrls){
					$scope.resNull = false;
					$scope.group = {restrict: null}
					$scope.submit = function(group){
						if($scope.form.$valid && $scope.group.restrict != null){
							ServerCtrl.createGroup(group)
            					.then(function (data) {
                					if (data.result === 'success') {
                						$rootScope.$emit(data.emit);
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
		addItem : function(groups, type){
			$uibModal.open({
				templateUrl: '../views/modals/additem_modal.html',
				controller: function($rootScope, $scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					$scope.type = btn;
					$scope.groupsTrim = groups;
					$scope.item = {
						notes: '',
						link: '',
						public: null,
						selected: []
					}
					$scope.submit = function(item){
						if($scope.form.$valid && item.public != null){
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
		},
		updateItem: function(item, groups, type){
			$uibModal.open({
				templateUrl: '../views/modals/additem_modal.html',
				controller: function($rootScope, $scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					$scope.type = type;
					$scope.groupsTrim = groups;
					$scope.item = {
						id: item.id,
						name: item.item_name,
						notes: item.item_notes,
						link: item.link,
						public: item.public,
						selected: item.groupsAllowedExpanded
					}
					$scope.submit = function(item){
						if($scope.form.$valid){
							item.selected = (item.public === true ? [] : item.selected);
							ServerCtrl.updateItem(item)
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
		leaveGroup: function(groupID){
			$uibModal.open({
				templateUrl: '../views/modals/leavegroup_modal.html',
				controller: function($rootScope, $scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					$scope.confirm = function(){
						ServerCtrl.server('/leaveGroup', {id: groupID})
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
		},
		joinGroup: function(){
			$uibModal.open({
				templateUrl: '../views/modals/joingroup_modal.html',
				controller: function($rootScope, $scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					$scope.submit = function(groupInfo){
						if($scope.form.$valid){
							ServerCtrl.server('/joinGroup', groupInfo)
								.then(function(data) {
									SessionCtrl.pushAlerts(data.type, data.message);
									if(data.result === 'success'){
										$rootScope.$emit(data.emit);
										$uibModalInstance.close();
									}
								})
						}
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