'use strict';

let ListCtrl = function ($scope, $location, $window, $uibModal, $parse, ServerCtrl, ModalCtrls, SessionCtrl) {
	$scope.listLoad = function(){
		ServerCtrl.get('/getList')
			.then(function(data){
				if(data.result === 'success'){
					if(data.list.length === 0){
						$scope.emptyList = true;
					}
					else{
						$scope.isItemOpen = [];
						$scope.emptyList = false;
						$scope.list = data.list;
						$scope.groups = data.groups;
						$scope.groupsTrim = [];
						$scope.groups.forEach(function(g) {
							g.prefix = g.name.split('#')[0];
							g.suffix = g.name.split('#')[1];
							$scope.groupsTrim.push({id: g.id, name: g.prefix})
						})
						$scope.list.forEach(function(item) {
							$scope.isItemOpen.push(false);
							item.groupsAllowedExpanded = [];
							if(item.groups_allowed != null){
								item.groups_allowed.forEach(function(obj) {
									$scope.groups.forEach(function(g) {
										if(obj === g.id){
											item.groupsAllowedExpanded.push({id: g.id, prefix: g.prefix, suffix: g.suffix})
										}
									})
								})
							}
						})
					}
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message);
				}
			})
	}
	$scope.viewItem = function(index){
		$scope['item' + index] = !$scope['item' + index];
	}	
	$scope.addItem = function(){
		$uibModal.open(ModalCtrls.addItem($scope.groupsTrim, 'Add'))
			.result.then(()=>{$scope.listLoad()})
	}
	$scope.removeItem = function(id){
		$uibModal.open(ModalCtrls.removeItem(id))
			.result.then(()=>{$scope.listLoad()})
	}
	$scope.updateItem = function(item){
		$uibModal.open(ModalCtrls.updateItem(item, $scope.groupsTrim, 'Update'))
			.result.then(()=>{$scope.listLoad()})
	}
};


module.exports = ListCtrl;