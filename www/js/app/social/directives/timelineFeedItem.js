/*
    accountManager module
*/

module.exports = ['$compile', function( $compile ){  

    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      templateUrl: 'templates/directives/feed-item.html',
      link:function(scope, element, attrs){
          scope.aaa = function(){
            alert(444);
            
          };
          
          scope.data = scope.item.getUIData();
          
          var $this = $(element);

          
          //likes , comments and shares
          if( scope.data.lc_disp )
          {
              if( ! $.isEmptyObject(scope.data.likes ) )
              {
                  var $likes = '<span ng-click="aaa()">'+scope.data.likes.text+'</span>';
                  $(element).find('.item-likes-comments').append( $compile($likes)(scope) );
              }

              if( ! $.isEmptyObject(scope.data.comments ) )
              {
                  var $comments = '<span >'+scope.data.comments.text+'</span>';
                  $(element).find('.item-likes-comments').append( $compile($comments)(scope) );
              }

              if( ! $.isEmptyObject(scope.data.shares ) )
              {
                  var $shares = '<span >'+scope.data.shares.text+'</span>';
                  $(element).find('.item-likes-comments').append( $compile($shares)(scope) );
              }
          }
          
          //template.find('.test').append(scope.data.itemTest);             
          //element.append( $compile(template)(scope) );
                        
          
      }
    };

}];






