(function () {
    'use strict';

    angular.module('springbok.security').controller('authenticationController', authenticationController);
    
    authenticationController.$inject = ['authenticationRedirect', 'authenticationService', '$location'];
    
    function authenticationController(authenticationRedirect, authenticationService, $location) {
        this.user = authenticationService.user;
        
        this.login = function () {
            authenticationService.login(this.user.login, this.user.password);
            
            if (!_.isNull(authenticationRedirect.url)) {
                $location.path(authenticationRedirect.url);
                authenticationRedirect.url = null;
            }
        };
        
        /**
         * Logout the current user, redirecting to ng-view home
         * in order to avoid reconnecting to a page with no credentials
         */
        this.logout = function () {
            authenticationService.logout();
            //avoid user to reconnect with less credentials on the same current page
            authenticationRedirect.url = '/';
        };
    }
})();