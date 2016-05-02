(function () {
    'use strict';

    angular.module('springbok.security').service('authenticationService', authenticationService);
    
    authenticationService.$inject = ['$q', '$http', 'session', 'endpoints', 'credentialService', 'searchCriterias'];
    
    function authenticationService($q, $http, session, endpoints, credentialService, searchCriterias) {
        var authentication = this;
        
        authentication.logout = function() {
            delete $http.defaults.headers.common['Authorization'];
            credentialService.clean();
            searchCriterias.clear();
            session.clear();
        };
        
        authentication.login = function() {
            var defer = $q.defer();
            
            session.setAuthorizationHeader();
            
            $http.get(endpoints.get('currentAccount')).then(function(currentAccount) {
                if (currentAccount.status === 200) {
                    session.update(currentAccount.data);
                    credentialService.getCredentialsForUsername(session.account.username);
                    
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
            
            return defer.promise;
        };
    }
})();
