(function () {
    'use strict'

    angular.module('app', [
        'ngRoute',
        'mm.foundation'
    ]);

    angular.module('app')
        .config(config)
        .controller('OmegaCalculatorCtrl', OmegaCalculatorCtrl)
        .controller('ModalServerXPCtrl', ModalServerXPCtrl)
        .directive('coerceInteger', coerceInteger)
        .directive('coerceFloat', coerceFloat);

    config.$inject = ['$routeProvider'];
    function config($routeProvider) {
        $routeProvider.when('/omega-calculator', {
            templateUrl: 'views/omega-calculator.tpl.html',
            controller: 'OmegaCalculatorCtrl'
        });

        $routeProvider.otherwise({
            redirectTo: '/omega-calculator'
        });
    }

    OmegaCalculatorCtrl.$inject = ['$scope', '$modal'];
    function OmegaCalculatorCtrl($scope, $modal) {
        var assumptions = {
            seconds_per_run: 60,
            omega_week_bonus: true,
            cosmic_week_bonus: false,
            omega_week_bonus_amount: 0.24,
            omega_xp_per_orb: 16100000,
            xp_per_orb: 29936,
            green_orbs_run: 44.0,
            boss_mob_value_orbs: 1.0,

            boost_sheet: 0,
            boost_server: 0,
            boost_server2: 0,

            xp_per_run: 0,
            omega_orbs_per_run: 0,
            omega_orbs_per_hour: 0,
            runs_per_hour: 0
        };

        $scope.updateOmegasGained = updateOmegasGained;
        $scope.getTotalPlannedHours = getTotalPlannedHours;
        $scope.getTotalOmegasGained = getTotalOmegasGained;
        $scope.openModalServerXP = openModalServerXP;

        init();

        function init() {
            $scope.weekModel = [];
            $scope.model = angular.copy(assumptions);
            $scope.$watchCollection('model', update);
        }

        function openModalServerXP($event) {
            $event.preventDefault();
            var modalInstance = $modal.open({
                templateUrl: 'views/modal-server-xp.tpl.html',
                controller: 'ModalServerXPCtrl'
            });
        }

        function update() {
            var m = $scope.model;
            calcStats(m);
            calcWeekStats();
        }

        function calcStats(m) {
            var omega_xp_per_orb;
            if (m.omega_week_bonus) {
                omega_xp_per_orb = m.omega_xp_per_orb * (1.0 - m.omega_week_bonus_amount);
            }
            else {
                omega_xp_per_orb = m.omega_xp_per_orb;
            }

            var green_orbs_run;
            if (m.cosmic_week_bonus) {
                green_orbs_run = m.green_orbs_run * 2;
            }
            else {
                green_orbs_run = m.green_orbs_run;
            }

            var base_xp_per_run = (green_orbs_run + m.boss_mob_value_orbs) * m.xp_per_orb;

            var server_boost = ((m.boost_server + 100.0) / 100.0) * ((m.boost_server2 + 100.0) / 100.0)
            var xp_bonus_mult = ((m.boost_sheet + 100.0) / 100.0) * server_boost;

            m.xp_per_run = base_xp_per_run * xp_bonus_mult;
            m.omega_orbs_per_run = m.xp_per_run / omega_xp_per_orb;

            m.runs_per_hour = 60 / (m.seconds_per_run / 60)
            m.omega_orbs_per_hour = m.runs_per_hour * m.omega_orbs_per_run;
        }

        function calcWeekStats() {
            var day = angular.copy($scope.model);
            resetForDay(day);
            var days = [];

            for (var i = 1; i < 10; i++) {
                var s = angular.copy(day);
                s.boost_server = 24 * i;
                s.planned_hours = 0;
                s.omegas_gained = 0;
                calcStats(s);
                days.push(s);
            }

            $scope.weekModel = days;
        }

        function updateOmegasGained(row) {
            row.omegas_gained = (row.planned_hours || 0) * row.omega_orbs_per_hour;
        }

        function resetForDay(stats) {
            stats.boost_server = 0;
            stats.xp_per_run = 0;
            stats.omega_orbs_per_run = 0;
            stats.omega_orbs_per_hour = 0;
            stats.runs_per_hour = 0;
        }

        function getTotalPlannedHours() {
            var total = 0;
            _.each($scope.weekModel, function (row) {
                total += row.planned_hours || 0;
            });

            return total;
        }

        function getTotalOmegasGained() {
            var total = 0;
            _.each($scope.weekModel, function (row) {
                total += row.omegas_gained;
            });

            return total;
        }
    }

    function ModalServerXPCtrl($scope, $modalInstance) {
        var defaults = {
            base_orb_value: 29936,
            your_orb_value: 29936,
            sheet_xp_boost: 0,
            server_xp: 0
        };
        $scope.cancel = cancel;

        init();

        function init() {
            $scope.model = angular.copy(defaults);
            $scope.$watchCollection('model', update);
        }

        function update() {
            $scope.model.server_xp = ($scope.model.your_orb_value / (($scope.model.sheet_xp_boost + 100) / 100 * $scope.model.base_orb_value)) * 100 - 100;
        }

        function cancel() {
            $modalInstance.dismiss('cancel');
        }
    }

    function coerceInteger() {
        return {
            require: 'ngModel',
            link: function (scope, ele, attr, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    return parseInt(viewValue, 10);
                });
            }
        };
    }

    function coerceFloat() {
        return {
            require: 'ngModel',
            link: function (scope, ele, attr, ctrl) {
                ctrl.$parsers.unshift(function (viewValue) {
                    return parseFloat(viewValue, 10);
                });
            }
        };
    }

})();