(function() {
    'use-strict';
    
    const securityDependencies = [
        'ngCookies',
        'springbok.core'
    ];
    
    const security = angular.module('springbok.security', securityDependencies);
    
    security.run(['endpoints', function (endpoints) {
        endpoints.add('login', 'authentication');
        endpoints.add('logout', 'logout');
        endpoints.add('authenticatedUser', 'users/authenticated');
        endpoints.add('credentialsSearch', 'credential/search');
    }]);
})();