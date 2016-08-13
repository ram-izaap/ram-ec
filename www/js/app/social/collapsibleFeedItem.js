/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, $injector ){  

    var self = this;

    var FeedItem =  $injector.get('FeedItem');
    var TimelineFeedItem =  $injector.get('TimelineFeedItem');

    function CollapsibleFeedItem ( item_data, feed )
    {
        FeedItem.apply( this, [ item_data, feed ]);
    }

    CollapsibleFeedItem.prototype = Object.create( FeedItem.prototype );
    
    CollapsibleFeedItem.prototype.constructor = CollapsibleFeedItem;

    CollapsibleFeedItem.prototype.retweet = TimelineFeedItem.prototype.retweet;
    
    CollapsibleFeedItem.prototype.favorite = TimelineFeedItem.prototype.favorite;

    return CollapsibleFeedItem;

}];






