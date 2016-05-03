(function () {
    'use-strict';

    const securityDependencies = ['ngCookies', 'springbok.core'];

    const security = angular.module('springbok.security', securityDependencies);

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

                $http.get(endpoints.get('credentials') + '/search', credentialsParams).success(function (data) {
                    credentials = data.content;
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
(function () {
    'use strict';

    angular.module('springbok.security').service('session', session);

    session.$inject = ['encryptionUtils'];

    function session(encryptionUtils) {
        var session = this;

        session.defaultExpirationDurationInMilliseconds = 1 * 3600 * 1000; // 1 hour
        session.account = {};

        getCurrent();

        session.persist = function () {
            localStorage.account = JSON.stringify(session.account);
        };

        session.update = function (account) {
            session.account.infos = account;
            session.account.authenticated = true;
            session.persist();
        };

        session.isExpired = function () {
            var isExpired = true;
            var currentDateTime = new Date().getTime();
            var sessionDateTime = session.account.expiration;

            if (!_.isNull(sessionDateTime) && !_.isUndefined(sessionDateTime)) {
                var dateTimeDifference = currentDateTime - sessionDateTime;
                isExpired = dateTimeDifference >= session.defaultExpirationDurationInMilliseconds;
            }

            return isExpired;
        };

        session.clear = function () {
            init();
            localStorage.clear();
        };

        session.getCurrent = getCurrent;

        session.setTokenAndExpiration = function () {
            var authorizationheader = 'Basic ';
            authorizationheader += encryptionUtils.encodeToBase64(session.account.username + ':' + session.account.password);

            session.account.token = authorizationheader;
            session.account.expiration = new Date().getTime();
            session.persist();
        };

        session.setDefaultExpirationDurationInMilliseconds = function (defaultExpirationDurationInMilliseconds) {
            session.defaultExpirationDurationInMilliseconds = defaultExpirationDurationInMilliseconds;
        };

        function getCurrent() {
            if (localStorage.account) {
                var account = JSON.parse(localStorage.account);
                session.account = account;
            } else {
                init();
            }

            return session.account;
        }

        function init() {
            session.account = {
                infos: {},
                username: '',
                password: '',
                expiration: null,
                authenticated: false
            };
        }
    }
})();