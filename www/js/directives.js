module.exports = angular.module('eclincher.directives', [])

.directive('positionBarsAndContent', function($timeout) {

 return {
    
    restrict: 'E',
    scope: {
        ddFeed: '=ddFeed'
    },

    link: function(scope, element, attrs) {
      

      console.log('KAKAKAKAKKAKAKAK:::::::::::::::::::::');
      console.log(scope.ddFeed);
      doProcess();

      scope.$watch('ddFeed', function(nv){
        console.log('KAKAKAKAKKAKAKAK:::::::::::::::::::::');
        console.log(nv);
        doProcess();
      });

      function doProcess()
      {
          var offsetTop = 0;
          var platform = 'ios';//$cordovaDevice.getPlatform();
          platform = platform.toLowerCase();    


          // Get the parent node of the ion-content
          var parent = angular.element(element[0].parentNode);

          var m_header =  parent[0].getElementsByClassName('bar-header');

          // Get all the headers in this parent
          var s_headers = parent[0].getElementsByClassName('bar-subheader');
          var i_content = parent[0].getElementsByTagName('ion-content');

          if( m_header.length )
          {
            offsetTop = m_header[0].offsetHeight + (platform == 'ios'?20:0);
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
          i_content[0].style.top = offsetTop + 'px';
      }
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

.directive('manageTest', function($compile){
    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      //templateUrl: 'templates/directives/manage-profile.html',
      link:function(scope, element, attrs){
          var template = '<p>MMMMMMMMMMMMMMMMMMMMMMMM</p>';

          template = $(template); 
          //template.find('.test').append(scope.data.itemTest);             
          element.append( $compile(template)(scope) );
      }
    };
});
