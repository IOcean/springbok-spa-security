(function () {
    'use strict';

    angular.module('springbok.security.authentication').service('authenticationService', authenticationService);
    
    authenticationService.$inject = ['$log', '$q', '$http', 'endpoints', 'credentialService', 'searchCriterias'];
    
    function authenticationService($log, $q, $http, endpoints, credentialService, searchCriterias) {
        var authentication = this;
        
        initAccount();
        
        authentication.logout = function() {
            initAccount();
            $http.defaults.headers.common['Authorization'] = '';
            localStorage.removeItem('auth');
            credentialService.clean();
            searchCriterias.resetAllSearchCriterias();
        };
        
        authentication.login = function() {
            var deferred = $q.defer();
            
            $http.get(endpoints.get('currentAccount')).then(function(currentAccount) {
                if (currentAccount.status === 200) {
                    $http.defaults.headers.common['Authorization'] = getAuthorizationHeader();
                    authentication.account.infos = currentAccount.data;
                    authentication.account.authenticated = true;
                    
                    credentialService.getCredentialsForUsername(authentication.account.username);
                    
                    deferred.resolve(currentAccount.infos);
                } else if (currentAccount.status === 403 || currentAccount.status === 401) {
                    $log.debug("Wrong username/password");
                    deferred.reject();
                } else {
                    $log.error('An error occured during login');
                    authentication.logout();
                    deferred.reject();
                }
            }, function() {
                $log.error('An error occured during login');
                authentication.logout();
                deferred.reject();
            });
            
            return deferred.promise;
        };
        
        authentication.getCurrentAccount = function () {
            return authentication.account.infos;
        };
        
        function initAccount() {
            authentication.account = {
                infos : {},
                username: '',
                password: '',
                authenticated: false
            };
        };
     
        function getAuthorizationHeader () {
            var authorizationheader = 'Basic ';
            
            authorizationheader += 'YWRtaW46YWRtaW4=';
            
            return authorizationheader;
        };
    }
})();
