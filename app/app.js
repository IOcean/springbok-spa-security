(function() {
    'use-strict';
    
    const securityDependencies = [
        'ngCookies',
        'springbok.core'
    ];
    
    const security = angular.module('springbok.security', securityDependencies);
    
    security.run(['endpoints', function (endpoints) {
        endpoints.add('accounts', 'accounts');
        endpoints.add('currentAccount', 'accounts/authenticated');
        endpoints.add('credentials', 'credentials');
    }]);
})();