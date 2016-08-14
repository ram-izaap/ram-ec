/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, $injector ){  

    var self = this;

    var FeedItem =  FeedItem || $injector.get('FeedItem');
    var TimelineFeedItem =  TimelineFeedItem || $injector.get('TimelineFeedItem');

    function InstagramFeedItem ( item_data, feed )
    {
        FeedItem.apply( this, [ item_data, feed ]);
    }

    InstagramFeedItem.prototype = Object.create( FeedItem.prototype );
   
    InstagramFeedItem.prototype.constructor = InstagramFeedItem;
   
    InstagramFeedItem.prototype.show_comments = TimelineFeedItem.prototype.show_comments;

    InstagramFeedItem.prototype.renderComment = TimelineFeedItem.prototype.renderComment;
   
    InstagramFeedItem.prototype.show_likes = TimelineFeedItem.prototype.show_likes;

    InstagramFeedItem.prototype.add_comment = function ( message )
    {
        var ht_exp = /\B#(\w*[a-zA-Z]+\w*)/ig,
            links_exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

        
    };

    return InstagramFeedItem;

}];






