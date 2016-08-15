/*
    accountManager module
*/

module.exports = ['$compile', function( $compile ){  

    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      //templateUrl: 'templates/directives/feed-item.html',
      link:function(scope, element, attrs){
          scope.cv = function(obj){
            alert(55);
            
          };
          
          scope.data = scope.item.getUIData();
          
          var template = '<div class="card">' +
                            '<div class="item item-avatar">' +
                              '<img src="{{::data.profileImg}}">' +
                              '<h2>{{::data.profileName}}</h2>' +
                              '<p>{{::data.time}}</p>' +
                            '</div>' +
                            '<div class="item item-body" ng-click="refreshAccount(item)">' +
                              '<p class="test">RAMAMMAMAMAMAMAM...</p>' +
                              '<p ng-bind-html="data.itemText"></p>' +
                              '<p ng-bind-html="data.itemMedia"></p>' +
                              '<p>' +
                                '<a href="#" class="subdued">1 Like</a>' +
                                '<a href="#" class="subdued">5 Comments</a>' +
                              '</p>' +
                              '<manage-test></manage-test>' +
                            '</div>' +
                        '</div>';

          template = $(template); 

          //template.find('.test').append(scope.data.itemTest);             
          element.append( $compile(template)(scope) );
                        
          
      }
    };

}];






