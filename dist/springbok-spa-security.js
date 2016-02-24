(function () {
    'use-strict';

    const security = angular.module('security', []);

    security.service('ModuleService', ModuleService);

    function ModuleService() {
        this.getValue = function () {
            return 'value from module';
        };
    }
})();