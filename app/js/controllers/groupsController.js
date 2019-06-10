'use strict';

let GroupsCtrl = function ($scope, $location, $window, $uibModal, ServerCtrl, ModalCtrls, SessionCtrl) {
	$scope.groupsLoad = function(){
		ServerCtrl.get('/getGroups')
			.then(function(data){
				if(data.result === 'success'){
					$scope.groups = data.groups;
					$scope.admins = data.admins;
					$scope.userID = data.userID;
					$scope.isGroupClosed = [];
					$scope.groups.forEach(function(g) {
						$scope.isGroupClosed.push(true);
						g.prefix = g.name.split('#')[0];
						g.suffix = g.name.split('#')[1];
						g.url = g.name.replace(" ", "_") + "!" + g.id;
						$scope.admins.forEach(function(a) {
							if(g.admin === a.id){
								g.admin_name = a.name.split(" ")[0];
							}
						})
						g.code = {id: g.id, admin: g.admin, name: g.name, restrict: g.restrict};
					})
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message);
				}	
			})
	}
	$scope.openGroup = function(index){
		$scope.isGroupClosed[index] = !$scope.isGroupClosed[index];	
		for(var i = 0; i < $scope.isGroupClosed.length; i++){
			if(i != index){
				$scope.isGroupClosed[i] = true;
			}	
		}		
	}
	$scope.goToGroup = function(group){
		$location.path('/hub/groups/' + group);
	}
	$scope.leaveGroup = function(groupID){
		$uibModal.open(ModalCtrls.leaveGroup(groupID))
			.result.then(()=>{$scope.groupsLoad()})
	}
	$scope.createGroup = function(){
		$uibModal.open(ModalCtrls.createGroup())
			.result.then(()=>{$scope.groupsLoad()})
	}
	$scope.joinGroup = function(){
		$uibModal.open(ModalCtrls.joinGroup())
			.result.then(()=>{$scope.groupsLoad()})
	}
	$scope.generateCode = function(gCode){
		ServerCtrl.post('/generateCode', gCode)
			.then(function(data) {
				if(data.result === 'success'){
					$uibModal.open(ModalCtrls.showCode(data))
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message)
				}
			})
	}
};

module.exports = GroupsCtrl;