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
                $scope.$emit('AuthenticationChange');
                
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
                
                $scope.$emit('AuthenticationChange');
            });
        };
        
        this.logout = function () {
            authenticationService.logout();
            authentication.account = authenticationService.account;
            $scope.$emit('Notify', 'warning', 'SECURITY_LOGIN_LOGOUT');
            $scope.$emit('AuthenticationChange');
            $location.path('/');
        };
    }
})();