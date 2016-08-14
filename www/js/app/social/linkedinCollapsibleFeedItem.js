/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, $injector ){  

    var self = this;

    var CollapsibleFeedItem =  CollapsibleFeedItem || $injector.get('CollapsibleFeedItem');
    
    function LinkedinCollapsibleFeedItem ( item_data, feed )
    {
        CollapsibleFeedItem.apply( this, [ item_data, feed ]);
    }

    LinkedinCollapsibleFeedItem.prototype = Object.create( CollapsibleFeedItem.prototype );
    
    LinkedinCollapsibleFeedItem.prototype.constructor = LinkedinCollapsibleFeedItem;


    return LinkedinCollapsibleFeedItem;

}];






