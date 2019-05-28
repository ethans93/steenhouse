'use strict';

let GroupsCtrl = function ($scope, $location, $window, ServerCtrl, ModalCtrls, SessionCtrl) {
	$scope.groupsLoad = function(){
		ServerCtrl.getGroups()
			.then(function(data){
				if(data.success){
					$scope.groups = data.groups;
					$scope.admins = data.admins;
					$scope.groups.forEach(function(g) {
						g.prefix = g.name.split('%')[0];
						g.suffix = g.name.split('%')[1];
						$scope.admins.forEach(function(a) {
							if(g.admin === a.id){
								g.admin_name = a.name.split(" ")[0];
							}
						})
					})
				}
				else{
					SessionCtrl.pushAlerts('danger', data.message);
				}
				
			})
	}

};

module.exports = GroupsCtrl;