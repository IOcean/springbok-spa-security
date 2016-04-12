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

    authenticationController.$inject = ['authenticationRedirect', 'authenticationService', '$location'];

    function authenticationController(authenticationRedirect, authenticationService, $location) {
        var authentication = this;

        authentication.account = authenticationService.account;

        this.login = function () {
            authenticationService.login(this.account.username, this.account.password).then(function () {
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
(function () {
    'use strict';

    angular.module('springbok.security').value('authenticationRedirect', {
        url: null
    });
})();
(function () {
    'use strict';

    angular.module('springbok.security').service('authenticationService', authenticationService);

    authenticationService.$inject = ['$q', '$http', 'encryptionUtils', 'endpoints', 'credentialService', 'searchCriterias'];

    function authenticationService($q, $http, encryptionUtils, endpoints, credentialService, searchCriterias) {
        var authentication = this;

        initAccount();

        authentication.logout = function () {
            initAccount();
            delete $http.defaults.headers.common['Authorization'];
            credentialService.clean();
            searchCriterias.resetAllSearchCriterias();
        };

        authentication.login = function () {
            var defer = $q.defer();

            $http.defaults.headers.common['Authorization'] = getAuthorizationHeader();

            $http.get(endpoints.get('currentAccount')).then(function (currentAccount) {
                if (currentAccount.status === 200) {
                    authentication.account.infos = currentAccount.data;
                    authentication.account.authenticated = true;

                    credentialService.getCredentialsForUsername(authentication.account.username);

                    defer.resolve(currentAccount.infos);
                } else if (currentAccount.status === 403 || currentAccount.status === 401) {
                    defer.reject('Wrong username/password');
                } else {
                    authentication.logout();
                    defer.reject('An error occured during login');
                }
            }, function () {
                authentication.logout();
                defer.reject('An error occured during login');
            });

            return defer.promise;
        };

        authentication.getCurrentAccount = function () {
            return authentication.account.infos;
        };

        function initAccount() {
            authentication.account = {
                infos: {},
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