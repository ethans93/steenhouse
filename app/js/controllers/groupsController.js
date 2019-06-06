'use strict';

let GroupsCtrl = function ($rootScope, $scope, $location, $window, ServerCtrl, ModalCtrls, SessionCtrl) {
	$scope.groupsLoad = function(){
		ServerCtrl.getGroups()
			.then(function(data){
				if(data.result === 'success'){
					$scope.groups = data.groups;
					$scope.admins = data.admins;
					$scope.groups.forEach(function(g) {
						g.prefix = g.name.split('#')[0];
						g.suffix = g.name.split('#')[1];
						g.url = g.name.replace(" ", "_") + "!" + g.id;
						$scope.admins.forEach(function(a) {
							if(g.admin === a.id){
								g.admin_name = a.name.split(" ")[0];
							}
						})
					})
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message);
				}	
			})
	}

	$scope.goToGroup = function(group){
		$location.path('/hub/groups/' + group);
	}
	$scope.leaveGroup = function(groupID){
		ModalCtrls.leaveGroup(groupID);
	}
	$scope.createGroup = function(){
		ModalCtrls.createGroup();
	}
	$scope.joinGroup = function(){
		ModalCtrls.joinGroup();
	}
	$rootScope.$on('refreshGroups', function() {
		$scope.groupsLoad();
	})
};

module.exports = GroupsCtrl;