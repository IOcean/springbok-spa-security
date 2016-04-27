(function () {
    'use strict';

    angular.module('springbok.security').service('authenticationService', authenticationService);
    
    authenticationService.$inject = ['$q', '$http', 'encryptionUtils', 'endpoints', 'credentialService', 'searchCriterias'];
    
    function authenticationService($q, $http, encryptionUtils, endpoints, credentialService, searchCriterias) {
        var authentication = this;
        
        initAccount();
        
        authentication.logout = function() {
            initAccount();
            delete $http.defaults.headers.common['Authorization'];
            credentialService.clean();
            searchCriterias.clear();
        };
        
        authentication.login = function() {
            var defer = $q.defer();
            
            $http.defaults.headers.common['Authorization'] = getAuthorizationHeader();
            
            $http.get(endpoints.get('currentAccount')).then(function(currentAccount) {
                if (currentAccount.status === 200) {
                    authentication.account.infos = currentAccount.data;
                    authentication.account.authenticated = true;
                    
                    credentialService.getCredentialsForUsername(authentication.account.username);
                    
                    defer.resolve(currentAccount.infos);
                }
            }, function(error) {
                authentication.logout();
                
                if (error.status === 403 || error.status === 401) {
                    defer.reject({reason: 'wrongCredentials'});
                } else {
                    defer.reject({reason: 'serverError'});
                }
            });
            
            authentication.account.authenticated = true;
            
            return defer.promise;
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
        }
     
        function getAuthorizationHeader() {
            var authorizationheader = 'Basic ';
            
            authorizationheader += encryptionUtils.encodeToBase64(authentication.account.username + ':' + authentication.account.password);
            
            return authorizationheader;
        }
    }
})();
