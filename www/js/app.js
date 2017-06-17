require('./constants');
require('./controllers');
require('./services');
require('./service-account-manager');
require('./service-social-manager');
require('./directives');

var $stateProviderRef = null;
var $urlRouterProviderRef = null;

window.nrequest = require('request').defaults({ encoding: null });

angular.module('eclincher', [
                              'ionic', 
                              'eclincher.constants', 
                              'eclincher.controllers', 
                              'eclincher.services',
                              'eclincher.services.accountManager', 
                              'eclincher.services.socialManager', 
                              'eclincher.directives',
                              'ngStorage',
                              'ui.router',
                              'ngCordova',
                              'underscore'
                              ])

.config(require('./router'))

.directive("scrollableTab",function($compile) {
    function link($scope, element, attrs) {
        //debugger;
        console.log('QQQQQQQQQQQQQQQQQQQQQ:::::::::::');
        $(element).find(".tab-nav.tabs a").wrapAll("<div class='allLinks'></div>");

        var myScroll = $compile("<ion-scroll class='myScroll' dir='ltr' zooming='true' direction='y' style='width: 100%; height: 100%'></ion-scroll>")($scope);

        $(element).find('.allLinks').append(myScroll);
        $(element).find(myScroll).find('.scroll').append($('.allLinks a'));
        $(element).find(myScroll).find("a")
            .wrapAll("<div class='links' style='min-width: 100%'></div>");

        $(element).on("ready",function(){
            //debugger;
        });
        $(element).on('$destroy', function() {
        });

    }

    return {
        restrict: 'A',
        link:link
    }

})

.run(require('./app-main'));
              
              