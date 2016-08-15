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
          
          var template = '' ;
          switch( scope.item.constructor.name )
          {
            case 'TimelineFeedItem':
              template = '<timeline-feed-item item="item"></timeline-feed-item>';
              break;
            case 'LinkedinFeedItem':
              template = '<linkedin-feed-item item="item"></linkedin-feed-item>';
              break;
            case 'InstagramFeedItem':
              template = '<instagram-feed-item item="item"></instagram-feed-item>';
              break;
            case 'CollapsibleFeedItem':
              template = '<collapsible-feed-item item="item"></collapsible-feed-item>';
              break;
            case 'LinkedinCollapsibleFeedItem':
              template = '<linkedin-collapsible-feed-item item="item"></linkedin-collapsible-feed-item>';
              break;
            case 'TwitterCollapsibleFeedItem':
              template = '<twitter-collapsible-feed-item item="item"></twitter-collapsible-feed-item>';
              break;

            default:
              template = '<timeline-feed-item item="item"></timeline-feed-item>';

          }

          //template.find('.test').append(scope.data.itemTest);             
          element.append( $compile(template)(scope) );
                        
          
      }
    };

}];






