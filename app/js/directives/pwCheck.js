'use strict';

let pwCheck = function () {
	return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            let firstPassword = '#' + attrs.pwCheck;
            elem.add(firstPassword).on('keyup', function () {
                scope.$apply(function () {
                    let v = elem.val() === $(firstPassword).val();
                    ctrl.$setValidity('pwmatch', v);
                });
            });
        }
    }

};

module.exports = pwCheck;