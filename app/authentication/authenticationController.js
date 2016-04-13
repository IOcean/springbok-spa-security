(function () {
    'use strict';

    angular.module('springbok.security').controller('authenticationController', authenticationController);
    
    authenticationController.$inject = ['$scope', 'authenticationRedirect', 'authenticationService', '$location'];
    
    function authenticationController($scope, authenticationRedirect, authenticationService, $location) {
        var authentication = this;
        
        authentication.account = authenticationService.account;
        
        this.login = function () {
            authenticationService.login(this.account.username, this.account.password).then(function() {
                $scope.$emit('Notify', 'success', 'SECURITY_LOGIN_SUCCESS');
                
                if (!_.isNull(authenticationRedirect.url)) {
                    $location.path(authenticationRedirect.url);
                    authenticationRedirect.url = null;
                }
            }, function(error) {
                console.log(error);
                
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
            
            //avoid user to reconnect with less credentials on the same current page
            authenticationRedirect.url = '/';
        };
    }
})();