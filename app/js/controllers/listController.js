'use strict';

let ListCtrl = function ($rootScope, $scope, $location, $window, ServerCtrl, ModalCtrls, SessionCtrl) {
	$scope.listLoad = function(){
		ServerCtrl.getList()
			.then(function(data){
				if(data.success){
					if(data.list.length === 0){
						$scope.emptyList = true;
					}
					else{
						var removeCount = 0;
						var i = 0;
						data.list.forEach(function(l) {
							if(l.remove === true){
								removeCount++;
							}
							$scope['item' + i] = true;
							i++;
						})
						if(removeCount === data.list.length){
							$scope.emptyList = true;
						}
						else{
							$scope.emptyList = false;
							$scope.list = data.list;
							$scope.groups = data.groups;
							$scope.groups.forEach(function(g) {
								g.prefix = g.name.split('#')[0];
								g.suffix = g.name.split('#')[1];
							})
							$scope.list.forEach(function(item) {
								item.groupsAllowedExpanded = [];
								if(item.groups_allowed != null){
									item.groups_allowed.forEach(function(obj) {
										$scope.groups.forEach(function(g) {
											if(obj === g.id){
												item.groupsAllowedExpanded.push({id: g.id, name: g.prefix})
											}
										})
									})
								}
							})
						}
					}
				}
				else{
					SessionCtrl.pushAlerts('warning', data.message);
				}
				
			})
	}
	$scope.viewItem = function(index){
		$scope['item' + index] = !$scope['item' + index];
	}	
	$scope.addItem = function(){
		ModalCtrls.addItem($scope.groups);
	}
	$scope.removeItem = function(id){
		ModalCtrls.removeItem(id)
	}
	$rootScope.$on('refreshList', function() {
		$scope.listLoad();
	})

};


module.exports = ListCtrl;