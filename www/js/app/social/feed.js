/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', '$urlRouter', 'EC', 'apiUrl', function($http, $state, $rootScope, $localStorage, $urlRouter, EC, apiUrl ){  

    var self = this;

    function Feed ( stream, profile, options )
    {
        var self = this,
            feed = '';//new Element('#feed-template');


        this.element = feed.element;
        
        this.profile = profile;
        
        this.network = ( profile === undefined ? stream.network : profile.account.type.toLowerCase() );
        
        this.stream = stream;
        
        this.name = stream.name || stream.id;

        this.id = stream.streamId;

        this.size = stream.size;

        this.favorited = stream.favorited || false;

        this.options = options || {};
        
        this.value = stream.value;
        
        this.next = false;

        this.initialized = false;
        
        this.items = []; // <-- [ FeedItem ]

        this.last_loaded_time = (new Date()).getTime();

        this.load_more_flag = true;

        this.last_scroll_position = 0;

        this.dropdown_feed = false;
        this.dropdown_obj = null;
        
        /* prepare page_id */
        this.page_id = 'tabs.' + this.get_page_id();
    }

    Feed.prototype.get_page_id = function()
    {
        var self = this,
            id = self.id,
            prefix = '';

        if ( self.options.favorite )
        {
            id = self.id + '_' + self.profile.id + '_'+ self.network;
        }
        else if( self.id == 'search' || self.id == 'rss' || self.id == 'outreach' )
        {
            id = self.name;
        }

        if ( self.options.favorite )
        {
            prefix = 'favorite';                
        }
        else if ( this.options.search )
        {
            prefix = 'search';
        }
        else if ( this.options.rss )
        {
            prefix = 'rss';
        }
        else
        {
            if( this.network == 'cinbox' )
            {
                prefix = 'cinbox';
            }
            else if( self.profile !== undefined )
            {
                prefix = self.profile.id;
            }                
        }

        return (prefix + '-' + id);
    };

    Feed.prototype.get_data = function ()
    {
       
    };

    Feed.prototype.render = function ()
    {
        var self = this,
            feed_title = '';

        if ( self.options.favorite )
        {
            var page = '',
                feed_name = self.name;

            switch ( self.network )
            {
                case 'facebook': page = self.profile.data.pageName;
                    break;

                case 'twitter': page = self.profile.data.specifiedHandleOrHashTag;
                    break;

                case 'instagram': page = self.profile.data.fullName;
                    break;

                // case 'linkedin': page = this.profile.data.profileName;
                case 'linkedin': page = self.profile.username;
                    break;

                case 'youtube': page = self.profile.data.userFirstName;
                    if ( self.id == 'yt_myChannelHome' ) feed_name = 'Home - Activities';
                    break;

                case 'googleplus': page = self.profile.data.fullName.split("(")[0];
                    break;

                case 'pinterest': page = self.profile.data.fullName;
                    break;

                case 'blogger': page = this.profile.username;
                    break;
            }

            feed_title = page+ ' - ' +feed_name;
        }
        else if ( this.options.search )
        {
            feed_title = 'Custom Search Feed';
        }
        else if ( this.options.rss )
        {
            feed_title = 'RSS Feed';
        }
        else
        {
            feed_title = (this.name).indexOf('Feed') >= 0 ? this.name:(this.name + ' Feed');
        }

        self.page_title = feed_title;

        console.log(self.page_id);

        var getExistingState = $state.get(self.page_id);

        if(getExistingState === null)
        {
            console.log('page_id:::'+self.page_id);

            var state = {
              "url": '/' + self.page_id + ':obj',
              cache:true,
              "views": {
                'home-tab': {
                  templateUrl: "templates/ram.html",
                  controller: "Feeds",
                  params: {obj: self}
                }
              }
            };

            $stateProviderRef.state(self.page_id, state);

            $urlRouter.sync();
            $urlRouter.listen();

        }
        else
        {
            console.log('page_id:::00000');
        }
    };

    Feed.prototype.add_items = function ( data ) // <-- override
    {
        for ( var i = 0, l = data.length; i < l; i++ )
        {
            var new_feed_item = new FeedItem( data[ i ] );

            this.items.push( new_feed_item );
        }

        this.show_items();
    };

    Feed.prototype.save_items = function ( data ) // <-- override
    {
        this.items = []; // reset

        for ( var i = 0, l = data.length; i < l; i++ )
        {
            var new_feed_item = new FeedItem( data[ i ] );

            this.items.push( new_feed_item );
        }

        this.show_items();
    };

    Feed.prototype.append_items = function ( add_after_index )
    {
        var self = this,
            n = parseInt( add_after_index ),
            //$container = this.element.find('.feed-items'),
            count = 0;
       

        
    };

    Feed.prototype.show_items = function ()
    {
        var self = this;
        console.log('Final:::::::::');
        console.log(self.items);


    };

    Feed.prototype.clearFeedNotification = function ( remove_message )
    {
        
    };

    Feed.prototype.hide_pullup = function ()
    {
        
    };
    

    return Feed;

}];






