/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'GooglePlusFeed', 'TimelineFeedItem', 'TwitterCollapsibleFeedItem', 'CollapsibleFeedItem', 'LinkedinFeedItem', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, GooglePlusFeed, TimelineFeedItem, TwitterCollapsibleFeedItem, CollapsibleFeedItem, LinkedinFeedItem, $injector ){  

    var self = this;

    var UserSettings =  UserSettings || $injector.get('UserSettings');
    console.log('accountManager???????????????????????????????');
    console.log(EC.aManager);
    //var accountManager =  $rootScope.accountManager;

    function InboxFeed ( stream, options )
    {
        Feed.apply( this, [ stream, undefined, options ]);
    }
    InboxFeed.prototype = Object.create( Feed.prototype );

    InboxFeed.prototype.constructor = InboxFeed;

    InboxFeed.prototype.getUserEvents = function( callback )
    {
        var data = {
            action: 'getUserEvents',
            startTime: '0',
            endTime: this.next || '0',
            request_action: '',
            maxEvents: '25'
        };

        if ( this.options.profileIds !== undefined && this.options.profileIds[0] != 'all' ) data.profileIds = this.options.profileIds;

        if ( this.options.tags !== undefined ) data.tags = this.options.tags;

        if ( this.options.types !== undefined && this.options.types[0] != 'all' ) data.types = this.options.types;

        //if ( this.options.only_completed != undefined && this.options.only_completed ) data.only_completed = true;

        //if ( this.options.ecRead != undefined && !this.options.ecRead ) data.ecRead = false;

        if ( UserSettings.getAlwaysHideCompletedEvents() ) data.only_completed = false;

        if ( this.options.searchText !== undefined && this.options.searchText.length > 0 ) data.searchText = this.options.searchText;

        if ( this.stream.isSentItem )
        {
            data.isSentItem = this.stream.isSentItem;
            if ( this.stream.isSentItem === 'true' ) delete data.only_completed;
        }

        var request = {
            type: 'GET',
            url: 'feed/userEvents',
            data: data
        };
        //alert(JSON.stringify(request));
        EC.request( request ).then( function ( response )
        {
            var obj = response;

            if ( obj.numberOfNewEvents != undefined && obj.numberOfNewEvents.length > 0 ) UserSettings.setNumberOfCompletedEvents( obj.numberOfNewEvents );
            else EC.getUncompletedEventsNumber();
            
            if ( typeof callback == 'function') callback( obj );
        });         
    };

    InboxFeed.prototype.get_data = function ( callback )
    {
        var self = this;

        console.log('InboxFeed get_data');
        console.dir(self);

        UserSettings.renderCompletedEventsCounter();

        if ( !this.initialized ) 
        {
            var user_inbox_filters = EC.get_user_inbox_filters();

            self.options.profileIds = user_inbox_filters.profileIds;

            self.options.tags = user_inbox_filters.tags;

            self.options.types = user_inbox_filters.types;

            //self.options.only_completed = user_inbox_filters.only_completed;

            //self.options.ecRead = user_inbox_filters.ecRead;

            self.options.searchText = user_inbox_filters.searchText;

            load_more_flag = true;
            this.getUserEvents( function( obj )
            {
                load_more_flag = false;
                //console.log(' FIRST getUserEvents obj:');
                //console.dir( obj );

                if ( obj.returnCode == 'FAIL')
                {
                    /*self.element.find('.feed-items')
                        .html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                    self.element.find('.feed-body').find('.more').remove();
                    self.element.find('.feed-body').iscrollview("refresh");*/
                    return;
                }

                UserSettings.setMaxEventTime( new Date().getTime() );

                self.next = obj.data.startTime;

                self.save_items( obj.data.events );

                self.initialized = true;
            });       
        }

        else
        {
            this.save_items();
        }
    };

    InboxFeed.prototype.more = function ()
    {
        var self = this;

        console.log('%c MORE','color: green');
        console.log('next = '+this.next);

        if ( this.next == undefined || !this.next || this.next == '9223372036854776000' ) {
            //self.element.find('.more').remove();
            //self.hide_pullup(); 
            self.load_more_flag = false;
            return;    
        }


        load_more_flag = true;
        this.getUserEvents( function( obj )
        {
            console.log(' MORE getUserEvents obj:');
            console.dir( obj );
            load_more_flag = false;

            if ( obj.returnCode == 'FAIL')
            {
                self.next = undefined;

                //self.element.find('.more').remove();
                //self.hide_pullup(); 

                self.load_more_flag = false;
                return;
            }

            if ( obj.data !== undefined && obj.data.startTime == '9223372036854776000' ) {
                //self.element.find('.more').remove();
                //self.hide_pullup();
                console.log('ppppppppppppppppppppp'); 
                console.log(self); 
                self.load_more_flag = false;
                return;    
            }

            self.next = obj.data.startTime;

            // when ??? self.element.find('.more').remove();
            // obj.data.endTime ???

            self.add_items( obj.data.events );
        }); 
    };

    InboxFeed.prototype.format_tw_entry = function ( data_i )
    {
        var this_datum = {
            eventNetwork: data_i.eventNetwork,
            eventType: data_i.eventType,
            eventTime: data_i.eventTime,
            eventUserName: data_i.eventUserName,
            ecCompleted: data_i.ecCompleted,
            ecDeleted: data_i.ecDeleted,
            ecRead: data_i.ecRead,
            ecFollow: data_i.ecFollow,
            ecRetweet: data_i.ecRetweet,
            ecFavorite: data_i.ecFavorite,
            ecDM: data_i.ecDM,
            ecReply: data_i.ecReply,
            roles: data_i.roles,
            tags: data_i.tags,
            user: data_i.user,
            updateTime: ( data_i.eventType == 'TWFollowers' ? data_i.eventTime.substr(0, 10) : new Date( data_i.created_at ).getTime() / 1000 ),
            favorites: {
                count: data_i.favorite_count,
                by_me: data_i.favorited
            },
            retweets: {
                count: data_i.retweet_count,
                by_me: data_i.retweeted,
                id: ( ( data_i.retweeted_status != undefined ) ? data_i.retweeted_status.id_str : data_i.id_str )
            },
            message: data_i.text,
            fromName: ( data_i.name || data_i.user.name ),
            username: ( data_i.screen_name || data_i.user.screen_name ),
            profilePic: ( data_i.profile_image_url || data_i.user.profile_image_url ),
            postID: data_i.id_str,
            raw_data: data_i
        };

        if ( data_i.entities != undefined &&data_i.entities.media != undefined && Array.isArray( data_i.entities.media.media_url ) )
        {
            this_datum.media = [];
            data_i.entities.media.media_url.forEach(function(media_url){
                this_datum.media.push({
                    type: 'photo',
                    src: media_url
                });    
            });   
        } 

        if ( data_i.eventType == 'TWFollowers' )
        {
            //this_datum.message = this_datum.fromName + ' @' + this_datum.username + ' now following you.';
            this_datum.message = '<span class="day-following">' + moment( parseInt( data_i.eventTime ) ).format('LL') + '</span>' +
                ' ' + this_datum.fromName + ' is now following you. <span class="view-follower">View ' + 
                this_datum.fromName + ' profile</span>';
            //this_datum.raw_data.entities = { user_mentions: { screen_name: this_datum.username } };
        }

        return this_datum;
    };

    InboxFeed.prototype.format_gp_entry = GooglePlusFeed.prototype.format_item;

    InboxFeed.prototype.data_to_items = function ( data )
    {
        if ( data == undefined ) return;

        var maxEventTime = new Date().getTime();

        // TW DM prepare
        var tw_dm_conversations = {};

        for ( var i = 0, l = data.length; i < l; i++ )
        {
            var parent = data[ i ]
                ,streamEntry;

            if ( parent.eventType == 'TWDirectMessage' )
            {
                var item_profile = EC.accountManager.get_profile( parent.sampleId );
                if ( item_profile == undefined ) continue;

                //var user_name = item_profile.account.data.nickName
                var user_name = item_profile.username.trim()
                    ,companion;

                if ( tw_dm_conversations[ user_name ] == undefined ) tw_dm_conversations[ user_name ] = {};

                streamEntry = parent.streamEntry;

                if ( !streamEntry.conversation )
                {
                    if ( streamEntry.sender != undefined && streamEntry.recipient != undefined )
                    {
                        if ( streamEntry.sender.screen_name.toLowerCase() == user_name ) companion = streamEntry.recipient.screen_name.toLowerCase();
                        
                        else companion = streamEntry.sender.screen_name.toLowerCase();

                        if ( tw_dm_conversations[ user_name ][ companion ] == undefined ) tw_dm_conversations[ user_name ][ companion ] = [];

                        tw_dm_conversations[ user_name ][ companion ].push( streamEntry );
                    } 
                } 
            }
        }

        for ( var i = 0, l = data.length; i < l; i++ )
        {
            var new_feed_item;

            //console.log('??? InboxFeed.save_items ???');
            //console.dir( data[ i ] );

            var item_profile = EC.accountManager.get_profile( data[ i ].sampleId );
            if ( item_profile == undefined ) continue;
            this.profile = item_profile;

            var streamEntry = data[ i ].streamEntry
                ,parent = data[ i ];

            if ( parent.eventType == 'GPComments' ) streamEntry = JSON.parse( data[ i ].streamEntry[ 0 ] );

            if ( Number(parent.date) > maxEventTime ) maxEventTime = Number(parent.date);

            streamEntry.eventNetwork = item_profile.network;
            streamEntry.eventType = parent.eventType;
            streamEntry.eventTime = parent.date;
            streamEntry.ecCompleted = parent.ecCompleted;
            streamEntry.ecDeleted = parent.ecDeleted;
            streamEntry.ecRead = parent.ecRead;
            streamEntry.ecFollow = parent.ecFollow;
            streamEntry.ecRetweet = parent.ecRetweet;
            streamEntry.ecFavorite = parent.ecFavorite;
            streamEntry.ecDM = parent.ecDM;
            streamEntry.ecReply = parent.ecReply;
            streamEntry.ecLike = parent.ecLike;
            streamEntry.eventUserName = parent.userName;

            streamEntry.roles = parent.roles;
            streamEntry.tags = parent.tags;

            if ( parent.eventType == 'FBComments' || parent.eventType == 'FBShares' 
                || parent.eventType == 'FBOthers' || parent.eventType == 'FBLikes' 
                || parent.eventType == 'FBWallPosts' )
            {
                if ( parent.eventType === 'FBWallPosts' )
                {
                    if ( parent.ecLike ) streamEntry.user_likes = parent.ecLike;

                    else streamEntry.ecLike = streamEntry.user_likes;
                }

                new_feed_item = new TimelineFeedItem( streamEntry, this );
            }

            else if ( parent.eventType == 'FBDirectMessage' )
            {
                if ( streamEntry.participants ) new_feed_item = new CollapsibleFeedItem( streamEntry, this );

                else continue;
            } 

            else if ( parent.eventType == 'TWMentions' )
            {
                var this_datum = this.format_tw_entry( streamEntry );

                new_feed_item = new TwitterCollapsibleFeedItem( [ this_datum ], this );   
            }

            else if ( parent.eventType == 'TWDirectMessage' )
            {
                var user_name = item_profile.username.trim()
                    ,companion;

                if ( !streamEntry.conversation )
                {
                    if ( streamEntry.sender != undefined && streamEntry.recipient != undefined )
                    {
                        if ( streamEntry.sender.screen_name.toLowerCase() == user_name ) companion = streamEntry.recipient.screen_name.toLowerCase();
                        
                        else companion = streamEntry.sender.screen_name.toLowerCase();

                        var thread = tw_dm_conversations[ user_name ][ companion ];

                        var conversation = [ streamEntry ];

                        thread.forEach(function( item )
                        {
                            var itemTime = new Date( item.created_at ).getTime()
                                ,entryTime = new Date( streamEntry.created_at ).getTime();

                            if ( itemTime < entryTime ) conversation.push( item );
                        });

                        new_feed_item = new TwitterCollapsibleFeedItem( conversation, this );
                    }
                }

                else
                {
                    var first_item = streamEntry.conversation.streamEntry;

                    if ( Array.isArray( streamEntry.conversation.streamEntry ) ) first_item = streamEntry.conversation.streamEntry[0];
                    
                    Object.keys( first_item ).forEach(function( key )
                    {
                        streamEntry[ key ] = first_item[ key ];   
                    });

                    var conversation = [ streamEntry ];

                    for ( var j = 0, ll = streamEntry.conversation.streamEntry.length; j < ll; j++ )
                    {
                        if ( streamEntry.conversation.streamEntry[ j ].id_str !== streamEntry.id_str ) conversation.push( streamEntry.conversation.streamEntry[ j ] );    
                    }
                    // for ( var j = 1, ll = streamEntry.conversation.streamEntry.length; j < ll; j++ )
                    // {
                    //     conversation.push( streamEntry.conversation.streamEntry[ j ] );    
                    // }

                    new_feed_item = new TwitterCollapsibleFeedItem( conversation, this );    
                }    
            }

            else if ( parent.eventType == 'LNLikesComments' )  
            {
                new_feed_item = new LinkedinFeedItem( streamEntry, this );
            }

            else if ( parent.eventType == 'LNCompanyUpdates' )  
            {
                new_feed_item = new LinkedinFeedItem( streamEntry, this );
            }

            else if ( parent.eventType == 'TWFollowers' )
            {
                var this_datum = this.format_tw_entry( streamEntry );

                new_feed_item = new TimelineFeedItem( this_datum, this ); 
            }

            else if ( parent.eventType == 'GPComments' )
            {
                var orig_date = streamEntry.updateTime;

                var this_datum = this.format_gp_entry( streamEntry );

                if ( this_datum.comments && this_datum.comments.comment ) 
                {
                    if ( !Array.isArray( this_datum.comments.comment ) ) this_datum.comments.comment = [ this_datum.comments.comment ];

                    if( this_datum.comments.comment.length > 0 )
                    {
                        var this_comment = this_datum.comments.comment[ 0 ];
                        this_datum.fromName = this_comment.fromName;
                        this_datum.fromId = this_comment.fromId;
                        this_datum.updateTime = new Date( this_comment.createdTime ).getTime().toString().slice(0,10);
                        this_datum.profileLink = this_comment.fromProfileLink;
                        this_datum.profilePic = this_comment.fromPicture;
                        this_datum.createdTime = orig_date;
                        // this_datum.message = this_comment.message;
                    }
                }

                new_feed_item = new TimelineFeedItem( this_datum, this ); 
            }

            else continue;

            this.items.push( new_feed_item );
        }

        UserSettings.setMaxEventTime( maxEventTime );
    };

    InboxFeed.prototype.save_items = function ( data )
    {
        this.items = []; // reset

        this.data_to_items( data );

        this.show_items();      
    };

    InboxFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length;

        this.data_to_items( data );

        this.append_items( add_after_index );
    };

    return InboxFeed;

}];






