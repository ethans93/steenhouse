'use strict';

let GroupCtrl = function ($scope, $location, $window, $route, $routeParams, $uibModal, ServerCtrl, ModalCtrls, SessionCtrl) {
	var groupID = {groupID: $routeParams.groupid};
	$scope.groupName = {
		name: $routeParams.group.replace('_', ' '),
		prefix: $routeParams.group.split('#')[0].replace('_', ' '),
		suffix: $routeParams.group.split('#')[1]
	}
	$scope.groupView = 'wishlists';
	$scope.isCollapsedHori = true;
	$scope.groupLoad = function(){
		ServerCtrl.post('/getGroup', {groupID: groupID.groupID, groupName: $scope.groupName.name})
			.then(function(data){
				if(data.result === 'success'){
					$scope.isAdmin = data.admin;
					$scope.canInvite = data.invite;
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message);
				}
				if(data.result === 'fail'){
					$location.path('/hub');
				}
			})
		
	}
	$scope.loadWishlists = function(){
		ServerCtrl.post('/getWishlists', groupID)
			.then(function(data) {
				if(data.result === 'success'){
					$scope.lists = data.lists;
					$scope.userID = data.userID;
					$scope.userEmptyList = (data.lists.length > 0 ? false : true);
					$scope.personListClosed = [];
					$scope.lists.forEach(function(person) {
						person.first = person.name.split(" ", 1)[0];
						person.emptyList = (person.list.length === 0 ? true : false);
						$scope.personListClosed.push(true);
						person.list.forEach(function(item) {
							if(item.occ_date){
								var dateArray = item.occ_date.split('-');
								item.occ_date_pretty = dateArray[1] + '/' + dateArray[2].split('T')[0];
							}
							if(item.claim_id != 0){
								item.claim_name = '';
								for(var i = 0; i < $scope.lists.length; i++){
									if($scope.lists[i].id === item.claim_id){
										item.claim_name = $scope.lists[i].name.split(" ", 1)[0];
										break;
									}
									else if($scope.userID === item.claim_id){
										item.claim_name = 'Me';
										break;
									}
									else{
										item.claim_name = 'Another Group';
									}
								}
							}
						})
					})
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message);
				}
			})
	}
	$scope.claimItem = function(id){
		$uibModal.open(ModalCtrls.claimItem(id))
			.result.then((result)=> {
				if(result){
					$scope.loadWishlists()
				}
			})
	}
	$scope.unclaimItem = function(id){
		$uibModal.open(ModalCtrls.unclaimItem(id))
			.result.then((result)=> {
				if(result){
					$scope.loadWishlists()
				}
			})
	}
	$scope.myClaim = function(id){
		return ($scope.userID === id)
	}
	$scope.whoClaim = function(id){
		$scope.lists.forEach(function(person) {
			if(person.id === id){
				return person.first;
			}
			else{
				return 'Another group'
			}
		})
	}
	$scope.loadChatroom = function(){
		console.log('chatroom');
	}
	$scope.loadGallery = function(){
		$scope.galleryType = 'gallery'
		ServerCtrl.post('/retrieveImages', groupID)
			.then(function(data) {
				if(data.result === 'success'){
					if(data.images.length > 0){
						$scope.noImages = false;
						$scope.images = data.images;
						$scope.colOne= new Array();
						$scope.colTwo= new Array();
						$scope.colThree= new Array();
						$scope.colFour= new Array();
						for(var i = 0; i <$scope.images.length; i = i + 4){
							if($scope.images[i])$scope.colOne.push($scope.images[i]);
							if($scope.images[i+1])$scope.colTwo.push($scope.images[i+1]);
							if($scope.images[i+2])$scope.colThree.push($scope.images[i+2]);
							if($scope.images[i+3])$scope.colFour.push($scope.images[i+3]);
						}
						$scope.myInterval = 3000;
					  	$scope.noWrapSlides = false;
					  	$scope.active = 0;
					  	var end = $scope.images.length - 1;
						$scope.right = function(){
							if($scope.active === 0){
								$scope.active = end;
							}
							else{
								$scope.active--;
							}
						}
						$scope.left = function(){
							if($scope.active === end){
								$scope.active = 0;
							}
							else{
								$scope.active++;
							}
						}
					}
					else{
						$scope.noImages = true;
					}
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message)
				}
			})
	}
	$scope.uploadImage = function(){
		$uibModal.open(ModalCtrls.uploadImage(groupID.groupID))
			.result.then((result)=> {
				if(result){
					$scope.loadGallery()
				}
				else{
					SessionCtrl.pushAlerts('danger', 'File is incorrect format')
				}
			})
	}
	$scope.removeImage = function(event, key){
		if($scope.isAdmin && (event.ctrlKey || event.metaKey)){
			var title = 'Remove Image';
			var msg = 'Are you sure you want to remove this image?';
			var icon = 'far fa-trash-alt';
			var button = 'Remove';
			$uibModal.open(ModalCtrls.confirm(title, msg, icon, button))
				.result.then(() => {
					ServerCtrl.post('/removeImage', {groupID: groupID.groupID, key: key})
						.then(function(data) {
							SessionCtrl.pushAlerts(data.type, data.message);
							if(data.result === 'success'){
								$scope.loadGallery();
							}
						})
				})
		}	
	}
	$scope.loadInvites = function(){
		ServerCtrl.post('/getInvites', groupID)
			.then(function(data) {
				if(data.result === 'success'){
					$scope.openInvites = SessionCtrl.chunkArray(data.invites, 2);
					$scope.noInvites = (data.invites.length > 0 ? false : true)
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message);
				}
				
			})
	}
	$scope.generateCode = function(){
		ServerCtrl.post('/generateCode', {id: groupID.groupID, restrict: false, admin: 0, name: 'New code generated'})
			.then(function(data) {
				if(data.result === 'success'){
					SessionCtrl.pushAlerts('success', data.name);
					$scope.loadInvites();
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message)
				}
			})
	}
	$scope.loadAdmin = function(){
		ServerCtrl.post('/getAdmin', groupID)
			.then(function(data) {
				if(data.result === 'success'){
					$scope.groupSettings = data.group;
					$scope.groupSettings.prefix = data.group.name.split('#')[0];
					$scope.groupSettings.suffix = '#' + data.group.name.split('#')[1];
					$scope.groupSettings.restrictSimple = ($scope.groupSettings.restrict ? 'Yes' : 'No');
					for(var i = 0; i < data.members.length; i++){
						if(data.members[i].id === data.group.admin){
							$scope.groupSettings.adminName = data.members[i].name;
							break;
						}
					}
					$scope.membersAdmin = data.members;
					$scope.adminEdit = false;
					$scope.groupNew = {
								name: $scope.groupSettings.prefix,
								admin: $scope.groupSettings.adminName,
								restrict: $scope.groupSettings.restrict
							}
					$scope.adminNameValid = true;

					$scope.edit = function(){
						$scope.adminEdit = !$scope.adminEdit;
						$scope.adminNameValid = true;
						$scope.groupNew = {
								name: $scope.groupSettings.prefix,
								admin: $scope.groupSettings.adminName,
								restrict: $scope.groupSettings.restrict
							}
					}

					$scope.submitAdmin = function(groupNew){
						$scope.adminNameValid = ($scope.groupSettings.adminName.replace(" ", "") === groupNew.admin.replace(" ", "") ? true : false)
						groupNew.diffAdmin = false;
						if(!$scope.adminNameValid){
							for(var i = 0; i < $scope.membersAdmin.length; i++){
								if($scope.membersAdmin[i].name.replace(" ", "") === groupNew.admin.replace(" ", "")){
									$scope.adminNameValid = true;
									groupNew.diffAdmin = true;
									groupNew.adminID = $scope.membersAdmin[i].id;
									break;
								}
							}
						}
						if($scope.adminNameValid){
							var title = 'Confirm Changes';
							var msg = 'Are you sure you want to make these changes?';
							var icon = 'fas fa-check';
							var button = 'Confirm';
							$uibModal.open(ModalCtrls.confirm(title, msg, icon, button))
								.result.then(() => {
									ServerCtrl.post('/editGroup', {groupID: groupID.groupID, new: groupNew})
										.then(function(data) {
											SessionCtrl.pushAlerts(data.type, data.message)
											if(data.result === 'success'){
												var url = '/hub/groups/' + groupNew.name.replace(" ", "_") + $scope.groupSettings.suffix + '!' + groupID.groupID;
												$location.path(url)
												$route.reload();
											}
										})
								})
						}	
					}
				}
				else{
					SessionCtrl.pushAlerts(data.type, data.message);
				}
			})
	}
	$scope.viewImage = function(url){

	}
	$scope.kickMember = function(memberID){
		var title = 'Kick Member';
		var msg = 'Are you sure you want to kick this member from the group?';
		var icon = 'fas fa-user-times';
		var button = 'Kick';
		$uibModal.open(ModalCtrls.confirm(title, msg, icon, button))
			.result.then(() => {
				ServerCtrl.post('/kickMember', {group: groupID.groupID, member: memberID})
					.then(function(data) {
						SessionCtrl.pushAlerts(data.type, data.message);
						if(data.result === 'success'){
							$scope.loadAdmin();
						}
					})
			})
	}
	$scope.changeView = function(dest, bool){
		$scope.groupView = dest;
		if(bool){
			$scope.isCollapsedHori = !$scope.isCollapsedHori;
		}
	}
};

module.exports = GroupCtrl;