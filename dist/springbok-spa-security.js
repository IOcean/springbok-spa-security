(function () {
    'use-strict';

    var securityDependencies = ['ngCookies', 'springbok.core'];

    var security = angular.module('springbok.security', securityDependencies);

    security.run(['endpoints', function (endpoints) {
        endpoints.add('accounts', 'accounts');
        endpoints.add('currentAccount', 'accounts/authenticated');
        endpoints.add('credentials', 'credentials');
    }]);
})();
(function () {
    'use strict';

    angular.module('springbok.security').controller('authenticationController', authenticationController);

    authenticationController.$inject = ['$scope', '$location', 'session', 'authenticationRedirect', 'authenticationService'];

    function authenticationController($scope, $location, session, authenticationRedirect, authenticationService) {
        var authentication = this;

        authentication.session = session;

        this.login = function () {
            authenticationService.login().then(function () {
                $scope.$emit('Notify', 'success', 'SECURITY_LOGIN_SUCCESS');
                $scope.$emit('AuthenticationChange');

                if (!_.isNull(authenticationRedirect.url)) {
                    $location.path(authenticationRedirect.url);
                    authenticationRedirect.url = null;
                }
            }, function (error) {
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
(function () {
    'use strict';

    angular.module('springbok.security').value('authenticationRedirect', {
        url: null
    });
})();
(function () {
    'use strict';

    angular.module('springbok.security').service('authenticationService', authenticationService);

    authenticationService.$inject = ['$q', '$http', 'session', 'endpoints', 'credentialService', 'searchCriterias'];

    function authenticationService($q, $http, session, endpoints, credentialService, searchCriterias) {
        var authentication = this;

        authentication.logout = function () {
            delete $http.defaults.headers.common['Authorization'];
            credentialService.clean();
            searchCriterias.clear();
            session.clear();
        };

        authentication.login = function () {
            var defer = $q.defer();

            session.setTokenAndExpiration();

            $http.get(endpoints.get('currentAccount')).then(function (currentAccount) {
                if (currentAccount.status === 200) {
                    session.update(currentAccount.data);
                    credentialService.getCredentialsForUsername(session.account.username);

                    defer.resolve(currentAccount.infos);
                }
            }, function (error) {
                authentication.logout();

                if (error.status === 403 || error.status === 401) {
                    defer.reject({ reason: 'wrongCredentials' });
                } else {
                    defer.reject({ reason: 'serverError' });
                }
            });

            return defer.promise;
        };
    }
})();
(function () {

    'use strict';

    angular.module('springbok.security').service('credentialService', credentialService);

    credentialService.$inject = ['endpoints', '$http', '$q'];

    function credentialService(endpoints, $http, $q) {
        var credentials = [];
        var promise;

        return {
            all: function () {
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