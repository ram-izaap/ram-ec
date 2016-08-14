/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, $injector ){  

    var self = this;

    var CollapsibleFeedItem =  CollapsibleFeedItem || $injector.get('CollapsibleFeedItem');
    var TimelineFeedItem =  TimelineFeedItem || $injector.get('TimelineFeedItem');

    function TwitterCollapsibleFeedItem ( item_data, feed )
    {
        CollapsibleFeedItem.apply( this, [ item_data, feed ]);
    }

    TwitterCollapsibleFeedItem.prototype = Object.create( CollapsibleFeedItem.prototype );
    
    TwitterCollapsibleFeedItem.prototype.constructor = TwitterCollapsibleFeedItem;

    TwitterCollapsibleFeedItem.prototype.add_comment = TimelineFeedItem.prototype.add_comment;

    TwitterCollapsibleFeedItem.prototype.delete_message = function ( $tweet, id )
    {
        var self = this;


        var text = 'Are you sure you want to delete this post ?';
        
 
    };

    TwitterCollapsibleFeedItem.prototype.retweet = TimelineFeedItem.prototype.retweet;

    

    return TwitterCollapsibleFeedItem;

}];






