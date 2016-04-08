(function () {

    'use strict';

    angular.module('springbok.security').service( 'credentialService', credentialService);
    
    credentialService.$inject = ['endpoints', '$http', '$q'];
    
    function credentialService(endpoints, $http, $q) {
        var credentials = [];
        var promise;

        return {
            getCredentialsForUserLogin: function (userLogin) {
                if (!_.isUndefined(credentials) && credentials.length > 0 && !_.isUndefined(promise)) {
                    return promise;
                }

                var deferred = $q.defer();

                var credentialsParams = {
                    params: {
                        size: 1000,
                        direction: 'asc',
                        properties: 'label',
                        username: userLogin
                    }
                };

                $http.get(endpoints.get('credentialsSearch'), credentialsParams).success(function (data) {
                    credentials = data.content;
                    deferred.resolve(credentials);
                });

                promise = deferred.promise;
                return promise;
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
