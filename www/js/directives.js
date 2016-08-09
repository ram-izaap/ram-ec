module.exports = angular.module('ionicApp.directives', [])

.directive('positionBarsAndContent', function($timeout) {

 return {
    
    restrict: 'AC',

    link: function(scope, element, attrs) {
      
      var offsetTop = 0;
      
      
      

      // Get the parent node of the ion-content
      var parent = angular.element(element[0].parentNode);

      var m_header =  parent[0].getElementsByClassName('bar-header');

      // Get all the headers in this parent
      var s_headers = parent[0].getElementsByClassName('bar-subheader');

      if( m_header.length )
      {
        offsetTop = m_header[0].offsetHeight;
      }
      
      // Iterate through all the headers
      for(x=0;x<s_headers.length;x++)
      {
        // If this is not the main header or nav-bar, adjust its position to be below the previous header
        if(x >= 0) {
          s_headers[x].style.top = offsetTop + 'px';
        }
        
        // Add up the heights of all the header bars
        offsetTop = offsetTop + s_headers[x].offsetHeight;
      }      
      
      // Position the ion-content element directly below all the headers
      element[0].style.top = offsetTop + 'px';
      
    }
  };  
})

.directive('hideTabs', function($rootScope) {
  return {
      restrict: 'A',
      link: function($scope, $el) {
          $rootScope.hideTabs = 'tabs-item-hide';
          $scope.$on('$destroy', function() {
              $rootScope.hideTabs = '';
          });
      }
  };
})

.directive('manageAccount', function(){
    return {
      restrict: 'E',
      scope: {
        account: '=account'
      },
      templateUrl: 'templates/directives/manage-account.html',
      link:function(scope, element, attrs){
          scope.cv = function(obj){
            alert(55);
            
          };

          scope.refreshAccount = function( obj ){
            obj.refreshAccount();
          };

          scope.deleteAccount = function( obj ){
            console.log(obj);
          };
      }
    };
})

.directive('manageProfile', function(){
    return {
      restrict: 'E',
      scope: {
        profile: '=profile'
      },
      templateUrl: 'templates/directives/manage-profile.html',
      link:function(scope, element, attrs){
          scope.validateCheck = function(obj){
            //obj.new_key = 'from directive';
            //alert(obj.getUserName());
            console.log(obj);
            obj.update_monitor(obj.profile_checked);
          };


      }
    };
})

.directive('feedItem', function(){
    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      templateUrl: 'templates/directives/feed-item.html',
      link:function(scope, element, attrs){
          scope.cv = function(obj){
            alert(55);
            
          };

          scope.refreshAccount = function( obj ){
            console.log(obj);
          };

          scope.deleteAccount = function( obj ){
            console.log(obj);
          };
      }
    };
});
