'use strict';

let OdinCtrl = function ($scope, $location, $window, ServerCtrl) {
	$scope.myInterval = 0;
  	$scope.noWrapSlides = false;
  	$scope.active = 0;
  	var end;

  	$scope.album = []

  	$scope.makeAlbum = function(){
  		ServerCtrl.getOdinPics()
            	.then(function (data) {
                	for(var i = 0; i < data.picArray.length; i++){
                		$scope.album.push({id: i, src: "images/" + data.picArray[i], alt: "Odin " + (i + 1)})
                	}
            	}); 
  	}

	$scope.right = function(){
		if($scope.active === 0){
			$scope.active = end;
		}
		else{
			$scope.active--;
		}
	}
	$scope.left = function(){
		if($scope.active === ($scope.album.length - 1)){
			$scope.active = 0;
		}
		else{
			$scope.active++;
		}
	}
};

module.exports = OdinCtrl;