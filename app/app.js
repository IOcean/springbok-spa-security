(function() {
    'use-strict';
    
    let sec = angular.module('security', []);
    
    sec.service('ModuleService', ModuleService);
    
    function ModuleService() {
        this.getValue = function() {
            return 'value from module';
        };
    }
})();