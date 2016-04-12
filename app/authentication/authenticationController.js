(function () {
    'use strict';

    angular.module('springbok.security.authentication').controller('authenticationController', authenticationController);
    
    authenticationController.$inject = ['authenticationRedirect', 'authenticationService', '$location'];
    
    function authenticationController(authenticationRedirect, authenticationService, $location) {
        var authentication = this;
        
        authentication.account = authenticationService.account;
        
        this.login = function () {
            authenticationService.login(this.account.username, this.account.password).then(function() {
                if (!_.isNull(authenticationRedirect.url)) {
                    $location.path(authenticationRedirect.url);
                    authenticationRedirect.url = null;
                }
            });
        };
        
        this.logout = function () {
            authenticationService.logout();
            //avoid user to reconnect with less credentials on the same current page
            authenticationRedirect.url = '/';
        };
    }
})();