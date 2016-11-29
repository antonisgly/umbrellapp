
var weatherApp = angular.module('weatherApp', ['ui.router', 'ngGeolocation', 'google.places']);

/*** UI ROUTE ***/
weatherApp.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/'); // ROUTE TO START IF THE VIEW DOES NOT EXIST
    $stateProvider  // ROUTE DECLARATION
    .state('search', {
        url: '/',
        controller: 'mainCtrl'
    })
    .state('weather', {
        url: '/weather',
        templateUrl: 'pages/weather.html',
        controller: 'weatherCtrl'
    });
});
/*** END OF UI ROUTE ***/

/*** CONTROLLERS ***/
weatherApp.controller('mainCtrl', function($scope, $rootScope, loadingLayer, $timeout, $geolocation, $http, httpCallToWeatherApi, $state) {
    $rootScope.bgColor = 'searchPageColor'; // CHANGE BG COLOR WHEN THE CLIENT VISIT THE SEARCH VIEW
    $rootScope.umbrella='umbrella'; // ALSO CHANGE THE UMBRELLA ICON AT THE NAVBAR
    loadingLayer.showLoading(); // SHOW LOADING LAYER
    $timeout(function() { // AND HIDE AFTER 2 SEC
        loadingLayer.hideLoading();
    }, 2000);
    $scope.openSidebar = function (){ // OPEN SIDEBAR MENU
        console.log('dsfsd');
        document.getElementById('sidebar').style.display='block';
    };
    $scope.closeSidebar = function() { // CLOSE SIDEBAR MENU
        document.getElementById('sidebar').style.display='none';
    };
    $scope.searchByCoords = function (){ // SEARCH BY LAT AND LONG
        $geolocation.getCurrentPosition({ // SOMETIMES GOOGLE CHROME BLOCKS YOU IF YOU RUN IT FROM LOCALHOST
            timeout: 60000,
            enableHighAccuracy: true
        }).then(function(position) { // IF WE GET THE COORDS
            $rootScope.myPosition = position; // WE SAVE THEM ON $ROOTSCOPE VAR
            $scope.myPosition = position;  // AND ON PRESENT VIEW'S $SCOPE VAR
            httpCallToWeatherApi.withCoords($scope.myPosition.coords.longitude, $scope.myPosition.coords.latitude)
                .then(function (response) {  // IF WE GET THE JSON RESPONSE AND IT'S ALL GOOD
                    console.log(response);
                    $rootScope.response = response.data.weatherdata; // ROOTSCOPE OBJECT TO GAIN ACCESS FROM WEATHER CONTROLLER
                    loadingLayer.showLoading(); // SHOW LOADING LAYER
                    $timeout(function() {
                        loadingLayer.hideLoading(); // HIDE AFTER 2 SEC
                        $state.go('weather'); // THEN GO TO WEATHER VIEW
                    }, 2000);
                }, function myError(response) {  // IF WE GOT ERROR
                    console.log(response.statusText); // IF CHROME BLOCK THE HTTP CALL WE GET 'BAD GATEWAY ERROR'
                });
        });
    };
    $scope.searchByPlace = function() { // SEARCH BY PLACE FROM GOOGLE AUTOCOMPLETE
        $rootScope.place = {}; // DECLARE AN EMPTY OBJECT WHICH WILL CARRY OUR PLACE INFO
        if($scope.place) { // IF THE INPUT IS NOT EMPTY *** WE GET $SCOPE.PLACE FROM ng-model="place" DIRECTIVE
            $rootScope.place.name = $scope.place.name; // WE SAVE THE DATA TO GAIN ACCESS FROM WEATHER CONTROLLER
            angular.forEach($scope.place.address_components, function(key, value) { // FIRST LOOP TO OBJECT
                angular.forEach(key, function(type, typeValue){ // SECOND-NESTED LOOP TO GET COUNTRY CODE
                    if (type[0] === 'country') {
                        $rootScope.place.short_name = key.short_name; // SAVE IT TO $ROOTSCOPE
                    }
                });
            });
        }
        if (($rootScope.place.name && $rootScope.place.short_name) !== null) { // IF WE GOT PLACE'S INFO
            httpCallToWeatherApi.withPlace($rootScope.place.name,$rootScope.place.short_name)
                .then(function (response) { // IF WE GET THE JSON RESPONSE
                    console.log(response);
                    $rootScope.response = response.data.weatherdata; // $ROOTSCOPE OBJECT FOR GAIN ACCESS FROM WEATHER CONTROLLER
                    loadingLayer.showLoading(); // SHOW LOADING LAYER
                    $timeout(function() { // SET TIMEOUT
                        loadingLayer.hideLoading(); // HIDE THE LAYER
                        $state.go('weather'); // AND ROUTE TO WEATHER VIEW
                    }, 2000); // AFTER 2 SEC
                }, function myError(response) {  // ELSE IF WE GOT ERROR
                    console.log(response.statusText);
                });
        }
    }
});

weatherApp.controller('weatherCtrl', function($scope, $rootScope, $state) {
    /*** DECLARE OPENWEATHERMAP API CONDITIONS WITH ICON FONT ***/
    $rootScope.icons = {
        '5' : 'R',
        '2' : '0',
        '3' : 'Q',
        '6' : 'W',
        '7' : 'M',
        '8' : 'B'
    };
    $rootScope.bgColor = 'weatherPageColor'; // CHANGE THE BG COLOR
    $rootScope.umbrella='umbrellaPurple'; // CHANGE THE UMBRELLA ICON AT NAVBAR
});
/*** END OF CONTROLLERS ***/

/*** FACTORIES ***/
weatherApp.factory('loadingLayer', function (){
    return {
        showLoading: function () { // SHOW LOADING LAYER
            document.getElementById('loadingLayer').style.width='100%';
            document.getElementById('loadingLayer').style.height='100%';
            document.getElementById('umbrella').style.display='block';
            document.getElementById('logo').style.display='block';
        },
        hideLoading: function () { // HIDE LOADING LAYER
            document.getElementById('umbrella').style.display='none';
            document.getElementById('logo').style.display='none';
            document.getElementById('loadingLayer').style.height='0';
            document.getElementById('loadingLayer').style.width='0';

        }
    }
});

weatherApp.factory('httpCallToWeatherApi', function ($http) {
    return {
        withCoords: function (long, lat) {
          return $http({ // WE MAKE A CALL TO OPENWEATHERMAP WITH RE REQUIRED PARAMETERS AND RETURN THE DATA
                    method: 'GET',
                    url : 'http://api.openweathermap.org/data/2.5/forecast/daily',
                    params: {
                        mode: 'xml',
                        lon: long,
                        lat: lat,
                        units: 'metric',
                        cnt: '6',
                        appid: 'a8173d37f9e003cc58ffb419874c23fb'
                    },
                    // NOW WE HAVE TO CONVERT THE XML RESPONSE FROM THE API TO JSON
                    transformResponse: function (cnv) {
                        var x2js = new X2JS();
                        var aftCnv = x2js.xml_str2json(cnv);
                        return aftCnv;
                    }
                })
        },
        withPlace: function (placeName, placeShortName) {
            return $http({ // WE MAKE A CALL TO OPENWEATHERMAP WITH RE REQUIRED PARAMETERS AND RETURN THE DATA
                        method: 'GET',
                        url : 'http://api.openweathermap.org/data/2.5/forecast/daily',
                        params: {
                            mode: 'xml',
                            q: placeName+','+placeShortName,
                            units: 'metric',
                            cnt: '6',
                            appid: 'a8173d37f9e003cc58ffb419874c23fb'
                        },
                        // CONVERT FROM XML TO JSON
                        transformResponse: function (cnv) {
                            var x2js = new X2JS();
                            var aftCnv = x2js.xml_str2json(cnv);
                            return aftCnv;
                        }
                    })
        }
    }
});
/*** END OF FACTORIES ***/