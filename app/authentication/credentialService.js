(function () {

    'use strict';

    angular.module('springbok.security').service( 'credentialService', credentialService);
    
    credentialService.$inject = ['endpoints', '$http', '$q'];
    
    function credentialService(endpoints, $http, $q) {
        var credentials = [];
        var promise;

        return {
            all: function() {
                var deferred = $q.defer();

                var credentialsParams = {
                    params: {
                        size: 1000,
                        direction: 'asc',
                        properties: 'label'
                    }
                };

                $http.get(endpoints.get('credentials') + '/search', credentialsParams).then(function (credentials) {
                    deferred.resolve(credentials.data.content);
                });

                return deferred.promise;
            },
            getCredentialsForUsername: function (username) {
                if (!_.isUndefined(credentials) && credentials.length > 0 && !_.isUndefined(promise)) {
                    return promise;
                }

                var deferred = $q.defer();

                var credentialsParams = {
                    params: {
                        size: 1000,
                        direction: 'asc',
                        properties: 'label',
                        username: username
                    }
                };

                $http.get(endpoints.get('credentials') + '/search', credentialsParams).then(function (userCredentials) {
                    credentials = userCredentials.data.content;
                    deferred.resolve(credentials);
                });

                return deferred.promise;
            },
            hasCredential: function (credentialCode) {
                var filtredResults = _.filter(credentials, function (c) {
                    return c.code === credentialCode;
                });
                return filtredResults.length > 0;
            },
            setCredentials: function (creds) {
                credentials = creds;
            },
            clean: function () {
                credentials = [];
                promise = null;
            }
        };
    }
})();
