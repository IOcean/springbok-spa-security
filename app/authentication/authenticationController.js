(function () {
    'use strict';

    angular.module('springbok.security').controller('authenticationController', authenticationController);
    
    authenticationController.$inject = ['$scope', 'authenticationRedirect', 'authenticationService', '$location'];
    
    function authenticationController($scope, authenticationRedirect, authenticationService, $location) {
        var authentication = this;
        
        authentication.account = authenticationService.account;
        
        this.login = function () {
            authenticationService.login().then(function() {
                $scope.$emit('Notify', 'success', 'SECURITY_LOGIN_SUCCESS');
                
                if (!_.isNull(authenticationRedirect.url)) {
                    $location.path(authenticationRedirect.url);
                    authenticationRedirect.url = null;
                }
            }, function(error) {
                if (error.reason === 'wrongCredentials') {
                    $scope.$emit('Notify', 'error', 'SECURITY_LOGIN_INVALID'); 
                } else {
                    $scope.$emit('Notify', 'error', 'ERROR_SERVER');
                }
            });
        };
        
        this.logout = function () {
            authenticationService.logout();
            $scope.$emit('Notify', 'warning', 'SECURITY_LOGIN_LOGOUT');
            $location.path('/');
        };
    }
})();