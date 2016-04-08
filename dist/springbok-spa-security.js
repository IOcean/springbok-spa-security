(function () {
    'use-strict';

    const securityDependencies = ['ngCookies', 'springbok.core'];

    const security = angular.module('springbok.security', securityDependencies);

    security.run(['endpoints', function (endpoints) {
        endpoints.add('login', 'authentication');
        endpoints.add('logout', 'logout');
        endpoints.add('authenticatedUser', 'accounts/authenticated');
        endpoints.add('credentialsSearch', 'credentials/search');
    }]);
})();
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
(function () {
    'use strict';

    angular.module('springbok.security').value('authenticationRedirect', {
        url: null
    });
})();
(function () {
    'use strict';

    /**
     * Provider service authentication
     */

    angular.module('springbok.security').provider('authenticationService', function () {
        /**
         * Configuration default of service
         */
        var $config = {
            user: {
                login: '',
                password: '',
                auth: false
            },
            authCookieName: 'authentification'
        };
        /**
         * Function initialise configuration login default
         */
        this.setDefaultLogin = function (login) {
            $config.user.login = login;
        };
        /**
         * Function initialise configuration password default
         */
        this.setDefaultPwd = function (pwd) {
            $config.user.password = pwd;
        };
        /**
         * Function initialise configuration authCookieName
         */
        this.setCookieName = function (cookieName) {
            $config.authCookieName = cookieName;
        };

        this.$get = ['endpoints', '$http', '$rootScope', '$cookies', 'credentialService', 'searchCriterias', function (endpoints, $http, $rootScope, $cookies, credentialService, searchCriterias) {
            /**
             * Constructor of service
             */
            function AuthService() {
                this.user = _.clone($config.user);
                this.updateUsersInfo();
            }

            /**
             * Function login
             * @param login
             * @param password
             */
            AuthService.prototype.login = function (login, password) {
                var postData = {
                    username: login,
                    password: password,
                    submit: 'login',
                    _spring_security_remember_me: true
                };

                var config = {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                };

                var self = this;
                var p = $http.post(endpoints.get('login'), jQuery.param(postData), config).success(function (data, status) {
                    if (status === 403) {
                        $rootScope.$broadcast('NotifyError', 'SECURITY_LOGIN_INVALID');
                        self.forceLogout();
                    } else if (status === 200) {
                        self.getUserInfos().then(function (user) {
                            self.setAuthCookie(user);
                            $rootScope.$broadcast('$onAuthenticationSuccess');
                            $rootScope.$broadcast('NotifyInfo', 'SECURITY_LOGIN_SUCCESS');
                            $rootScope.$broadcast('AuthChange', true);
                        });
                    }
                });

                p.then(function (data) {
                    if (data.status === 200) {
                        var promise = credentialService.getCredentialsForUserLogin(login);
                        promise.then(function (data) {
                            credentialService.setCredentials(data);
                        });
                    }
                });
            };

            AuthService.prototype.getUserInfos = function () {
                return $http.get(endpoints.get('authenticatedUser')).then(function (result) {
                    return result.data;
                });
            };

            /**
             * Function set cookie
             * @param login
             */
            AuthService.prototype.setAuthCookie = function (user) {
                this.user.login = user.login;
                this.user.auth = true;
                this.user.password = null;

                $cookies.put($config.authCookieName, {
                    auth: true,
                    current: _.omit(user, 'password'),
                    login: user.login
                });
            };
            /**
             * Function test cookie Exist
             * @returns boolean
             */
            AuthService.prototype.authCookieExists = function () {
                return !_.isUndefined($cookies.get($config.authCookieName));
            };
            /**
             * Function delete cookie
             */
            AuthService.prototype.deleteAuthCookie = function () {
                this.user.login = $config.user.login;
                this.user.password = $config.user.password;
                this.user.auth = $config.user.auth;
                $cookies.remove($config.authCookieName);
            };
            /**
             * Function logout
             */
            AuthService.prototype.logout = function () {
                var self = this;
                credentialService.clean();
                searchCriterias.resetAllSearchCriterias();
                $http.post(endpoints.get('logout')).success(function () {
                    self.forceLogout();
                    $rootScope.$broadcast('NotifyInfo', 'SECURITY_LOGIN_LOGOUT');
                    $rootScope.$broadcast('AuthChange', false);
                    $rootScope.$broadcast('$onLogoutSuccess');
                });
            };
            /**
             * Function force logout users
             */
            AuthService.prototype.forceLogout = function () {
                this.deleteAuthCookie();
                credentialService.clean();
                searchCriterias.resetAllSearchCriterias();
            };
            /**
             * Function update users info
             */
            AuthService.prototype.updateUsersInfo = function () {
                if (this.authCookieExists()) {
                    var users = $cookies.get($config.authCookieName);
                    this.user.login = users.login;
                    this.user.auth = users.auth;
                    $rootScope.$broadcast('$onAlreadyAuthenticated');
                    $rootScope.$broadcast('AuthChange', users.auth);
                }
            };
            /**
             * Function get users login
             */
            AuthService.prototype.getLogin = function () {
                if (this.authCookieExists()) {
                    return $cookies.get($config.authCookieName).login;
                } else {
                    return '';
                }
            };

            AuthService.prototype.getCurrentUser = function () {
                if (this.authCookieExists()) {
                    return $cookies.get($config.authCookieName).current;
                }
            };

            return new AuthService();
        }];
    });
})();
(function () {

    'use strict';

    angular.module('springbok.security').service('credentialService', credentialService);

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
                        login: userLogin
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