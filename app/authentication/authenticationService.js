(function () {
    'use strict';

    /**
     * Provider service authentication
     */
    angular.module('springbok.security').provider('authenticationService', function() {
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

        this.$get = ['endpoints', '$http', '$rootScope', '$cookies', 'credentialService', 'searchCriterias', 
            function (endpoints, $http, $rootScope, $cookies, credentialService, searchCriterias) {
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
                    var postData = new FormData();
                    postData.append('username', login);
                    postData.append('password', password);
                    postData.append('submit', 'login');
                    postData.append('_spring_security_remember_me', true);
                    
                    var self = this;
                    var p = $http.post(endpoints.get('login'), postData)
                        .success(function (data, status) {
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
