'use strict';

let ModalCtrls = function () {
    this.alert = function(title, message){
    	return{
    		templateUrl: '../views/modals/alert_modal.html',
    		backdrop: 'static',
    		controller: function($scope, $uibModalInstance){
    			$scope.title = title
    			$scope.message = message;
    			$scope.close = function(){
    				$uibModalInstance.dismiss();
    			}
    		}
    	}
    }

    this.signIn = function(){
    	return{
    		templateUrl: '../views/modals/signin_modal.html',
				backdrop: 'static',
				controller: function($scope,$location, $uibModalInstance, SessionCtrl, ServerCtrl, ModalCtrls){
					$scope.submit = function (user) {
        				if ($scope.form.$valid) {
            				ServerCtrl.post('/signin', user)
            					.then(function (data) {
                					if (data.result === 'success') {
                						SessionCtrl.signin(data.token);
                						SessionCtrl.setName(data.name);
                                        $location.path('/hub');
                    	 				$uibModalInstance.close({success: true, type: data.type, message: data.message});	
                					}
                                    else{
                                       SessionCtrl.pushAlerts(data.type, data.message); 
                                    }
                					
            					}); 
        				}
    				};
					$scope.close = function(){
						$uibModalInstance.dismiss();
					}
					$scope.switchToSignUp = function(){
						$uibModalInstance.close(false);
					}
				}
    	}
    }

    this.signUp = function(){
    	return{
    		templateUrl: '../views/modals/signup_modal.html',
				backdrop: 'static',
				controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl, ModalCtrls){
					$scope.submit = function (newUser) {
        				if ($scope.form.$valid) {
            				ServerCtrl.post('/signup', newUser)
            					.then(function (data) {
                					if (data.result === 'success') {
            							SessionCtrl.signin(data.token);
            							SessionCtrl.setName(data.name);
                                        $location.path('/hub');
            							$uibModalInstance.close({success: true, type: data.type, message: data.message});                     
            						}
            						else if(data.result === 'fail'){
            							formInputs.forEach(function(input) {
            								$('#' + input).removeClass('invalid-form')
            							})
            							data.input.forEach(function(i) {
            								$('#' + i).addClass('invalid-form')
            							})
                                        SessionCtrl.pushAlerts(data.type, data.message)
            						}
                                    else{
                                        SessionCtrl.pushAlerts(data.type, data.message)
                                    }
            						
            					})
        				}
    				};
					$scope.close = function(){
						$uibModalInstance.dismiss();
					}
					$scope.switchToSignIn = function(){
						$uibModalInstance.close(false);
					}
				}
    	}
    }

    this.createGroup = function(){
    	return {
    		templateUrl:'../views/modals/creategroup_modal.html',
				backdrop: 'static',
				animation: true,
				controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl, ModalCtrls){
					$scope.resNull = false;
					$scope.group = {restrict: null}
					$scope.submit = function(group){
						if($scope.form.$valid && $scope.group.restrict != null){
							ServerCtrl.post('/createGroup', group)
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
						$uibModalInstance.dismiss();
					}
				}
    	}
    }

    this.addItem = function(groups, type){
    	return {
    		templateUrl: '../views/modals/additem_modal.html',
				backdrop: 'static',
				controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					$scope.type = type;
					$scope.groupsTrim = groups;
					$scope.item = {
						notes: '',
						link: '',
						public: null,
						selected: []
					}
					$scope.submit = function(item){
						if($scope.form.$valid && item.public != null){
							ServerCtrl.post('/addItem', item)
								.then(function(data) {
									if(data.result === 'success'){
										$uibModalInstance.close();
									}
									SessionCtrl.pushAlerts(data.type, data.message);
								})
						}	
					}
					$scope.close = function(){
						$uibModalInstance.dismiss();
					}
					
				}
    	}
    }

    this.removeItem = function(id){
    	return {
    		templateUrl: '../views/modals/removeitem_modal.html',
				backdrop: 'static',
				controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
					$scope.confirm = function(){
						ServerCtrl.post('/removeItem', {id: id})
							.then(function(data) {
								SessionCtrl.pushAlerts(data.type, data.message);
								if(data.result === 'success'){
									$uibModalInstance.close();
								}
							})
					}
					$scope.close = function(){
						$uibModalInstance.dismiss();
					}
				}
    	}
    }

    this.updateItem = function(item, groups, type){
    	return {
    		templateUrl: '../views/modals/additem_modal.html',
				backdrop: 'static',
				controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
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
							ServerCtrl.post('/updateItem', item)
								.then(function(data) {
									if(data.result === 'success'){
										$uibModalInstance.close();
									}
									SessionCtrl.pushAlerts(data.type, data.message);
								})
						}	
					}
					$scope.close = function(){
						$uibModalInstance.dismiss();
					}
				}
    	}
    }

    this.leaveGroup = function(groupID){
        return{
            templateUrl: '../views/modals/leavegroup_modal.html',
            backdrop: 'static',
            controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
                $scope.confirm = function(){
                    ServerCtrl.post('/leaveGroup', {id: groupID})
                    .then(function(data) {
                        SessionCtrl.pushAlerts(data.type, data.message);
                        if(data.result === 'success'){
                            $uibModalInstance.close();
                        }
                    })
                }
                $scope.close = function(){
                    $uibModalInstance.dismiss();
                }
            }

        }
    }

    this.joinGroup = function(){
    	return {
    		templateUrl: '../views/modals/joingroup_modal.html',
    		backdrop: 'static',
    		controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl){
    			$scope.submit = function(groupInfo){
    				if($scope.form.$valid){
    					ServerCtrl.post('/joinGroup', groupInfo)
    					.then(function(data) {
    						SessionCtrl.pushAlerts(data.type, data.message);
    						if(data.result === 'success'){
    							$uibModalInstance.close();
    						}
    					})
    				}
    			}
    			$scope.close = function(){
    				$uibModalInstance.dismiss();
    			}
    		}
    	}
    }

    this.showCode = function(info){
        return{
            templateUrl: '../views/modals/showcode_modal.html',
            backdrop: 'static',
            controller: function($scope, $location, $uibModalInstance, SessionCtrl){
                $scope.name = info.name;
                $scope.code = info.code;
                $scope.close = function(){
                    $uibModalInstance.close();
                }
                $scope.alert= function(){
                    SessionCtrl.pushAlerts('info', 'Info copied to clipboard')
                }
            }
        }
    }

    this.uploadImage = function(groupID){
        return {
            templateUrl: '../views/modals/uploadimage_modal.html',
            backdrop: 'static',
            controller: function($scope, $location, $uibModalInstance, SessionCtrl, ServerCtrl, Upload){
                $scope.loadBarInvis = true;
                $scope.progressPercentage = 0;
                $scope.submit = function() {
                    if ($scope.form.file.$valid && $scope.file) {
                        $scope.loadBarInvis = false;
                        $scope.upload($scope.file);
                    }
                };
                $scope.upload = function (file) {
                    Upload.upload({
                        url: '/uploadImage',
                        data: {file: file, groupID: groupID}
                    }).then(function (resp) {
                        SessionCtrl.pushAlerts(resp.data.type, resp.data.message)
                        if(resp.data.result === 'success'){
                            $uibModalInstance.close(true);
                        }
                        else{
                            $scope.file = null;
                            $scope.loadBarInvis = true;
                            $scope.progressPercentage = 0;
                        }
                    }, function (resp) {
                        SessionCtrl.pushAlerts(resp.data.type, resp.data.message)
                        $uibModalInstance.close(false);
                    }, function (evt) {
                        $scope.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    });
                 };
                $scope.close = function(){
                    $uibModalInstance.dismiss();
                }
            }
        }
    }
};

module.exports = ModalCtrls;