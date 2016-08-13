/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, $injector ){  

    var self = this;

    var FeedItem =  $injector.get('FeedItem');
    var TimelineFeedItem =  $injector.get('TimelineFeedItem');
    

    function DropdownFeedItem ( item_data, feed )
    {
        FeedItem.apply( this, [ item_data, feed ]);

        this.next = '';
        this.default_element = feed.default_element || '';
    }

    DropdownFeedItem.prototype = Object.create( FeedItem.prototype );
    
    DropdownFeedItem.prototype.constructor = DropdownFeedItem;

    DropdownFeedItem.prototype.show_comments = TimelineFeedItem.prototype.show_comments;

    DropdownFeedItem.prototype.show_likes = TimelineFeedItem.prototype.show_likes;

    DropdownFeedItem.prototype.get_dropdown = function ()
    {
        var self = this,
            dropdown = [],
            placeholder = '';

        if ( self.data.length > 0 )
        {
            self.data = self.data.sort(function ( a, b ) 
            {
                var nameA = ( typeof a.name === 'string' ? a.name.toLowerCase() : '' );
                var nameB = ( typeof b.name === 'string' ? b.name.toLowerCase() : '' );

                if ( nameA > nameB ) return 1;

                else if ( nameA < nameB ) return -1;

                else return 0;
            });

            if ( self.feed.network == 'youtube' )
            {
                self.data = self.data.sort(function ( a, b ) 
                {
                    var nameA = ( typeof a.channelTitle === 'string' ? a.channelTitle.toLowerCase() : '' );
                    var nameB = ( typeof b.channelTitle === 'string' ? b.channelTitle.toLowerCase() : '' );

                    if ( nameA > nameB ) return 1;

                    else if ( nameA < nameB ) return -1;

                    else return 0;
                });   
            }

            for ( var i = 0, l = self.data.length; i < l; i++ )
            {
                var this_group = self.data[ i ],
                    group_id = undefined;

                if ( self.feed.network == 'youtube' )
                {
                    this_group = {
                        id: this_group.channelId,
                        name: this_group.channelTitle
                    };  
                } 
                
                group_id = this_group.id;
                if ( self.feed.network == 'twitter' ) group_id = this_group.id_str;
                
                dropdown.push({'id':group_id, 'name':this_group.name, 'data':this_group});
                
            }
        }
        else
        {
            switch( this.feed.id )
            {
                case 'lists':
                    placeholder = 'You aren\'t following any lists yet.';
                    break;

                case 'pi_board':
                    placeholder= 'You do not have boards yet.';
                    break;

                case 'gp_pages':
                case 'gp_pages_only':
                    placeholder ='You do not have pages yet.';
                    break;

                case 'ln_companies':
                    placeholder = 'You do not follow any company yet.';
                    break;
                case 'yt_mySubscription':
                    placeholder = 'You haven\'t added any subscriptions yet.';
                    break;
                case 'fb_likes':
                    placeholder = ('You haven\'t liked any pages yet.');
                    break;
                default:
                    placeholder = 'You are not a member of any groups.';
                    break;
            }            
        }

        return { 'count':dropdown.length, 'data':dropdown, 'placeholder': placeholder};
    };

    DropdownFeedItem.prototype.set_default_group_id = function ( sel_obj )
    {
        var self = this,
            $_this = sel_obj;
            group_id = $_this.data.id;

        self.next = undefined;

        if ( self.feed.network == 'twitter' )
        {
            group_id = $elm.data('data').id_str;
            if ( self.feed.id == 'lists')
            {
                self.profile.lists.default_element = group_id;                     
            } 
        }

        //setting of default group id
        self.default_element = group_id;
        
        self.feed.default_element = group_id;

        if ( self.feed.updateFeed )
        {
            //self.feed.clearFeedNotification( true );

            //self.feed.updateIntervalID = setInterval( updateFeedNotification, 5*60*1000, self.feed );

            self.feed.firstItemID = undefined;
        }

        if ( self.feed.network == 'googleplus' )
        {
               
        }

        else self.profile.data.defaultGroupId = group_id;

        var data = {
            action: 'setDefaultGroupId',
            accountID: self.profile.account.id,
            profileID: self.profile.id,
            //defaultGroupId: $( this ).data('data').id,
            defaultGroupId: self.profile.data.defaultGroupId,
            network: self.feed.network
        };

        var request = {
            type: 'POST',
            url: "feed/defaultGroupId",
            data: data
        };
        
        //console.log( 'setting setDefaultGroupId: ' + group_id )
        EC.request( request ).then( function ( resp )
        {
            /*var data = JSON.parse( resp );
            console.dir( 'set response:' )
            console.dir( data )*/
        });

    };

    DropdownFeedItem.prototype.get_data = function ( sel_obj )
    {
        var self = this,
            $_this = sel_obj;
            group_id = $_this.data.id;

        self.next = undefined;

        if ( self.feed.network == 'twitter' )
        {
            group_id = $elm.data('data').id_str;
            if ( self.feed.id == 'lists')
            {
                self.profile.lists.default_element = group_id;                     
            } 
        }

        //setting of default group id
        self.default_element = group_id;
        
        self.feed.default_element = group_id;

        if ( self.feed.updateFeed )
        {
            //self.feed.clearFeedNotification( true );

            //self.feed.updateIntervalID = setInterval( updateFeedNotification, 5*60*1000, self.feed );

            self.feed.firstItemID = undefined;
        }

        if ( self.feed.network == 'googleplus' )
        {
               
        }

        else self.profile.data.defaultGroupId = group_id;

        var request = { type: 'GET' },
            data = {};

        data = {
                    groupId: $_this.data.id,
                    accountID: self.profile.account.id,
                    profileID: self.profile.id,
                    action: 'getFBGroup',
                    stream: 'groupFeed',
                    next: self.next
                };

        request.url = 'feed/fbGroup';

        request.data = data;

        EC.request( request ).then( function ( resp )
        {
            var data = resp,
                items = [];

            if ( self.feed.network == 'linkedin' ) self.next = 25;

            if ( data.values !== undefined )
            {
                data.data = [];

                if ( self.feed.network === 'linkedin') self.feed.firstItemID = data.values[ 0 ].id;

                for ( var j = 0, m = data.values.length; j < m; j++ )
                {
                    var this_val = data.values[ j ];

                    var summary = this_val.summary || '',
                        pre_summary = '';

                    if ( this_val.updateContent !== undefined && this_val.updateContent.currentUpdate !== undefined && this_val.updateContent.currentUpdate.content !== undefined) 
                    {

                        var content = this_val.updateContent.currentUpdate.content;

                        if ( content.title !== undefined && content.submittedUrl !== undefined && !(/\.(jpg|jpeg|png|bmp|tiff|avi|mpeg|mkv|ogg|mov|mpeg|mpg|mpe|flv|3gp|gif)$/i).test(content.title) ) 
                        {
                            pre_summary = '<a href="javascript:;" onClick="EC.UI.IAB(\'' + content.submittedUrl + '\');">' + content.title + '</a> ';
                        }
                    }

                    data.data[ j ] = {
                        id: this_val.id,
                        title: '<p><span class="ln-group-title">' + this_val.title + ':</span></p>',
                        pre_summary: pre_summary,
                        message: summary,
                        fromName: ( this_val.creator.firstName.toLowerCase() == 'private' ? this_val.creator.firstName : this_val.creator.firstName + ' ' + this_val.creator.lastName ),
                        profilePic: this_val.creator.pictureUrl,
                        updateTime: parseInt( this_val.creationTimestamp ) / 1000,
                        fromId: this_val.creator.id,
                        comments: {
                            count: this_val.comments._total,
                            comment: this_val.comments.values || []
                        },
                        likes: {
                            count: this_val.likes._total,
                            like: ( this_val.likes.values === undefined ? [] : this_val.likes.values.creator ) || []
                        },
                        relationship: this_val.relationToViewer,
                        user_likes: this_val.relationToViewer.isLiked || "false"
                    };
                }

                self.next = 25;
            }

            if ( self.feed.network == 'youtube' ) 
            {
                self.next = data.data.nextToken;
                data.data = data.data.items;
            }

            else if ( self.feed.network == 'googleplus' ) self.next = data.next;

            else if ( self.feed.network === 'pinterest' )
            {
                if ( data.returnCode === 'FAIL' || ( data.data.status && data.data.status === 'failure' ) ) data.data = [];

                else
                {
                    var page = data.data.page;
                    if ( page && page.cursor ) self.next = page.cursor;
                    data.data = data.data.data;   
                }
            }

            if ( data.data !== undefined )
            {
                if ( data.paging !== undefined ) self.next = data.paging.next;

                if ( !Array.isArray( data.data ) ) items = [ data.data ];

                else items = data.data;

                if ( items.length > 0 ) 
                {
                    if ( self.feed.network == 'twitter') self.feed.firstItemID = items[ 0 ].id_str;

                    else if ( self.feed.network === 'linkedin' ) self.feed.firstItemID = items[ 0 ].id;

                    else if ( self.feed.network === 'googleplus' ) self.feed.firstItemID = items[ 0 ].postID;

                    for ( var i = 0, l = items.length; i < l; i++ )
                    {
                        var new_group,
                            this_datum;

                        if ( self.feed.network == 'twitter') 
                        {

                            self.next = items[ i ].id_str;

                            this_datum = {
                                user: items[ i ].user,
                                updateTime: ( new Date( items[ i ].created_at ).getTime() / 1000 ),
                                favorites: {
                                    count: items[ i ].favorite_count,
                                    by_me: items[ i ].favorited
                                },
                                retweets: {
                                    count: items[ i ].retweet_count,
                                    by_me: items[ i ].retweeted,
                                    id: ( ( items[ i ].retweeted_status !== undefined ) ? items[ i ].retweeted_status.id_str : items[ i ].id_str )
                                },
                                message: items[ i ].text,
                                fromName: ( items[ i ].name || items[ i ].user.name ),
                                username: ( items[ i ].screen_name || items[ i ].user.screen_name ),
                                profilePic: ( items[ i ].profile_image_url || items[ i ].user.profile_image_url ),
                                postID: items[ i ].id_str,
                                id: items[ i ].id_str,
                                raw_data: items[ i ]
                            };

                            if ( items[ i ].entities !== undefined && items[ i ].entities.media !== undefined && Array.isArray( items[ i ].entities.media.media_url ) )
                            {
                                this_datum.media = self.get_media_data( items[ i ].entities.media.media_url );
                            }

                            new_group = new TimelineFeedItem( this_datum, self.feed );    
                        }

                        else if ( self.feed.id == 'ln_companies' ) new_group = new LinkedinFeedItem( items[ i ], self.feed ); 

                        else if ( self.feed.network == 'youtube' )
                        {
                            this_datum = self.feed.format_item( items[ i ] );

                            new_group = new TimelineFeedItem( this_datum, self.feed );
                        }

                        else if ( self.feed.network == 'googleplus' )
                        {
                            this_datum = self.feed.format_item( items[ i ] );

                            new_group = new TimelineFeedItem( this_datum, self.feed );   
                        }

                        else if ( self.feed.network === 'pinterest' )
                        {
                            this_datum = self.feed.format_item( items[ i ] );
                    
                            new_group = new TimelineFeedItem( this_datum, self.feed );
                        }
                        
                        else {
                            new_group = new TimelineFeedItem( items[ i ], self.feed );    
                        }   

                        self.feed.items.push( new_group );
                        
                    }

                }

            }


        });

    };

    DropdownFeedItem.prototype.get_media_data = function ( media_urls )
    {
        var this_datum = [];
        angular.forEach(media_urls, function(media_url){
            this_datum.media.push({
                type: 'photo',
                src: media_url
            });    
        });
        return this_datum;
    };
    

    return DropdownFeedItem;

}];






