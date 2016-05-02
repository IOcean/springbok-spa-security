(function () {
    'use strict';
    
    angular.module('springbok.security').service('session', session);
    
    session.$inject = ['encryptionUtils'];
    
    function session(encryptionUtils) {
        var session = this;
        
        session.account = {};
        
        getCurrent();
        
        session.persist = function() {
            localStorage.account = JSON.stringify(session.account);
        };
        
        session.update = function(account) {
            session.account.infos = account;
            session.account.authenticated = true;
            session.persist();
        };
        
        session.clear = function() {
            init();
            localStorage.clear();
        };
        
        session.getCurrent = getCurrent;
        
        session.setAuthorizationHeader = function() {
            var authorizationheader = 'Basic ';
            authorizationheader += encryptionUtils.encodeToBase64(session.account.username + ':' + session.account.password);
            
            session.account.token = authorizationheader;
            session.persist();
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
                infos : {},
                username: '',
                password: '',
                authenticated: false
            };
        };
    }
})();

