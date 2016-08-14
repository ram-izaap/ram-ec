/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'TimelineFeedItem', 'TwitterCollapsibleFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, TimelineFeedItem, TwitterCollapsibleFeedItem ){  

    var self = this;

    function TwitterFeed ( stream, profile, options )
    {
        if ( /*window.globals.tw_feeds_live_update &&*/ ['homeFeed','lists','mentions','twFollowers','direct_message'].indexOf( stream.streamId ) !== -1 )
        {
            this.updateFeed = true;    
        }

        Feed.apply( this, [ stream, profile, options ]);
    }

    TwitterFeed.prototype = Object.create( Feed.prototype );

    TwitterFeed.prototype.constructor = TwitterFeed;

    TwitterFeed.prototype.clearFeedNotification = function ( remove_message )
    {
        
    };

    TwitterFeed.prototype.updateFeedNotification = function ()
    {
        
    };

    TwitterFeed.prototype.get_data = function ( callback )
    {
        // requests data and then calls this.save_items
        if ( !this.initialized ) 
        {
            switch ( this.id )
            {
                case 'homeFeed': this.request('getTWHomeFeed'); // <-- similar to TimelineFeedItem
                break;

                case 'mentions': this.request('getTWMentions'); // <-- similar to TimelineFeedItem
                break;

                case 'twFollowers': this.request('getTWFollowers'); // <-- totally unique
                break;

                case 'twFriends': this.request('getTWFriendsList');
                break;

                case 'sendTweets': this.request('getTWSendTweets'); // <-- similar-ish to TimelineFeedItem
                break;

                case 'myTweetsRetweeted': this.request('getTWRetweets'); // <-- similar-ish to TimelineFeedItem
                break;

                case 'twFavorites': this.request('getTWFavorites'); // <-- similar to TimelineFeedItem
                break;

                case 'direct_message': this.request('getTWInBox'); // <-- similar to CollapsibleFeedItem
                break;

                case 'lists': this.request('getTWLists');
                break;

                case 'search': this.request('getTWSearch');
                break;

                case 'outreach': this.request('getTWSearch');
                break;

                default: break;
            }
        }

        else
        {
            this.save_items();
        }
    };

    TwitterFeed.prototype.more = function ()
    {
        if ( this.id == 'lists' || this.id == 'search' || this.id == 'outreach' || this.id == 'direct_message' )
        {
            //this.element.find('.more').remove(); 
            //this.hide_pullup(); 
            return;
        }

        var self = this,
            data = {
                action: '',
                accountID: this.profile.account.id,
                profileID: this.profile.id,
                max_id: this.next
            };

        if ( ( this.id === 'twFollowers' || this.id === 'twFriends' ) && self.options.user_id_for_request )
        {
            data.userID = self.options.user_id_for_request;    
        }

        switch ( this.id )
        {
            case 'homeFeed': data.action = 'getTWHomeFeed';
            break;

            case 'mentions': data.action = 'getTWMentions';
            break;

            case 'twFollowers': data.action = 'getTWFollowers'; 
            break;

            case 'twFriends': data.action = 'getTWFriendsList'; 
            break;

            case 'sendTweets': data.action = 'getTWSendTweets';
            break;

            case 'myTweetsRetweeted': data.action = 'getTWRetweets';
            break;

            case 'twFavorites': data.action = 'getTWFavorites';
            break;

            // case 'direct_message': 
            //     data.action = 'getTWInBox';
            //     data.inbox_max_id = this.next.inbox;
            //     data.outbox_max_id = this.next.outbox;
            // break;

            default: break;
        }

        var request = {
            type: 'GET',
            url: 'feed/twitter',
            data: data
        };

        load_more_flag = true;
        EC.request( request ).then( function ( resp )
        {
            load_more_flag = false;

            var data = resp || {};

            if ( data.data !== undefined ) data.data.splice( 0, 1 ); // backend returns last item from prev request as first item here

            if ( data.data !== undefined && data.data.length < 1 )
            {
                //self.element.find('.more').remove();
                //self.hide_pullup(); 
            }

            else if ( data.cursor !== undefined && data.data !== undefined )
            {
                if ( data.cursor[ 0 ] !== 0 ) self.next = data.cursor[ 0 ];
            
                self.add_items( data.data );
            }

            else if ( data.data !== undefined )
            {
                self.next = data.data[ data.data.length - 1 ].id_str;

                self.add_items( data.data );
            }
        });
    };

    // ---------------------------------------------
    // TWSearchContainer: self = this; profile = self.data.profile
    // type = tweets OR people
    // ---------------------------------------------
    TwitterFeed.prototype.search_request = function ( self, callback, class_name )
    {
        var parameters = [], next, query, profile, result_type, type, lang, geocode;

        // if ( self.constructor.name == 'TwitterFeed' )
        if ( class_name == 'TwitterFeed' )
        {
            type = self.options.parameters.type;
            query = self.options.parameters.query;
            profile = self.profile;
            result_type = self.options.parameters.result_type;
            next = self.next;
            lang = self.options.parameters.lang; 
            geocode = self.options.parameters.geocode;
        }

        else if ( self.data )
        {
            type = self.data.type;
            query = self.data.query;
            profile = self.data.profile;
            result_type = self.data.result_type;
            page = self.data.page;
            next = self.data.next;
        }

        parameters.push({
            key: 'q',
            value: query
        });

        if ( type == 'tweets' )
        {
            parameters.push({
                key: 'result_type',
                value: result_type
            }); 

            if ( lang !== undefined && lang.length > 0 && lang != 'all')
            {
                parameters.push({
                    key: 'lang',
                    value: lang
                });    
            }

            if ( geocode !== undefined && geocode.length > 0 )
            {
                parameters.push({
                    key: 'geocode',
                    value: geocode
                });    
            }
        }
        //people
        else if ( next !== undefined && next !== false ) parameters.push({
                    key: 'page',
                    value: next
                });

        var request = {
            type: 'GET',
            url: "feed/twitter",
            data: {
                accountID: profile.account.id,
                profileID: profile.id,
                action: 'getTWSearch',
                type: type,
                parameters: parameters
            }
        };

        if ( type == 'tweets' && result_type == 'recent' && next !== undefined ) request.data.max_id = next;

        EC.server.request( request, function ( response )
        {
            var data = response,
                callback_data = 'FAIL';

            if ( data.returnCode == 'SUCCESS' ) {
                if ( data.errors !== undefined && data.errors.length > 0 )
                {
                    var error = data.errors[ 0 ].streamEntry;

                    if ( error !== undefined && error.message) {}//EC.UI.alert('TW error: ' + error.message );

                    else EC.UI.alert(EC.getMessage('UNKNOWN_ERR'));
                }

                else 
                {
                    callback_data = data;
                    if ( data.next !== undefined ) callback_data.next = data.next; 
                }
            }

            else
            {
                EC.UI.alert(EC.getMessage('FAIL_ERR'));
            }

            if ( typeof callback == 'function') callback( callback_data );

        });
    };

    TwitterFeed.prototype.request = function ( action )
    {
        var self = this;

        var request = {
            type: 'GET',
            url: 'feed/twitter'
        };

        if ( action == 'getTWSearch' ) 
        {
            if ( this.profile === undefined ) //empty search feed
            {
                self.save_items( [] );

                self.initialized = true;
            } 

            else
            {
                if ( self.options.parameters.query !== undefined && self.options.parameters.query.length > 0 )
                {
                    self.search_request( self, function( data )
                    {
                        self.save_items( data );

                        self.initialized = true;

                        //if ( self.data.result_type == 'popular' )
                            //$people_section.css('display','block'); 
                    }, 'TwitterFeed');
                }

                else
                {
                    self.save_items( [] );

                    self.initialized = true;    
                }
            }
        }

        else if ( action == 'getTWLists' )
        {
            var lists = this.profile.lists;

            if ( lists !== undefined )
            {
                if ( lists.default_element !== undefined ) self.default_element = lists.default_element; 

                if ( lists.data === undefined || lists.data.length === 0 )
                {
                    //self.element.find('.feed-items').html('<center class="center">You aren\'t following any lists yet.</center>');
                    //refresh iscroll
                    //self.element.find('.feed-body').iscrollview("refresh"); 
                    //self.element.find('.feed-body .feed-items').html('<center class="center">You aren\'t following any lists yet.</center>');
                    return;
                } 

                self.save_items( lists.data );

                self.initialized = true;   
            }

            else
            {
                //self.element.find('.feed-items').html('<center class="center">You aren\'t following any lists yet.</center>');
                //refresh iscroll
                //self.element.find('.feed-body').iscrollview("refresh");

                //self.element.find('.feed-body .feed-items').html('<center class="center">You aren\'t following any lists yet.</center>');
                return;
            }
        }

        else
        {
            var data = {
                action: action,
                accountID: this.profile.account.id,
                profileID: this.profile.id,
                stream: this.id
            };

            if ( ( action === 'getTWFollowers' || action === 'getTWFriendsList' ) && self.options.user_id_for_request )
            {
                data.userID = self.options.user_id_for_request;    
            }
            
            request.data = data;

            // console.log('%cTW ' + action + 'request:', 'color:orangered')

            EC.request( request ).then( function ( response )
            {
                var data = response;

                // console.log('%cTW ' + action + 'response:', 'color:orangered')
                // console.dir( data )

                // if ( request.data.action == 'getTWSendTweets') console.error( data )
                
                if ( data.data !== undefined && data.data.length < 1 )
                {
                    self.clearFeedNotification( true );
                    //self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                    //refresh iscroll
                    //self.element.find('.feed-body').iscrollview("refresh");

                    //self.element.find('.feed-body').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>')

                    return;
                }

                else if ( data.cursor !== undefined && data.data !== undefined )
                {
                    if ( data.cursor[ 0 ] !== 0 ) self.next = data.cursor[ 0 ];

                    self.save_items( data.data );
                }
                
                else if ( data.data !== undefined )
                {
                    self.next = data.data[ data.data.length - 1 ].id_str;

                    self.save_items( data.data );
                }

                else
                {
                    self.clearFeedNotification( true );
                    //self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                    //refresh iscroll
                    //self.element.find('.feed-body').iscrollview("refresh");

                    //self.element.find('.feed-body').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                } 

                self.initialized = true;

                // if ( request.data.action == 'getTWInBox' ) self.element.find('.btn.toggle').first().trigger('click');
            });   
        }
    };

    TwitterFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length,
            self = this,
            new_feed_item;

        // if ( this.id == 'lists' ) this.items.push( new DropdownFeedItem( data, this ) );
        
        if ( this.id == 'lists' )
        {
            if ( this.items[ 0 ] !== undefined ) data = data.concat( this.items[ 0 ].data );
            
            this.items = [];

            this.items.push( new DropdownFeedItem( data, this ) );
        }

        else for ( var i = 0, l = data.length; i < l; i++ )
        {
            var this_datum = this.format_item( data[ i ] );

            if ( this.id == 'mentions' ) new_feed_item = new TwitterCollapsibleFeedItem( [this_datum], self );

            else new_feed_item = new TimelineFeedItem( this_datum, this );

            this.items.push( new_feed_item );
        }

        this.append_items( add_after_index );
    };

    TwitterFeed.prototype.save_items = function ( data )
    {
        var new_feed_item,
            self = this;

        var i;

        this.items = []; // reset

        // direct messages feed
        if ( this.id == 'direct_message' && data !== undefined )
        {
            var mincoming = [],
                cuserId = self.profile.account.data.userId;

            for ( i = 0, l = data.length; i < l; i++ )
            { 
                if ( data[ i ].conversation === undefined || data[ i ].conversation.streamEntry === undefined ) continue;

                if ( !Array.isArray( data[ i ].conversation.streamEntry )) data[ i ].conversation.streamEntry = [ data[ i ].conversation.streamEntry ];

                new_feed_item = new TwitterCollapsibleFeedItem( data[ i ].conversation.streamEntry, self );

                self.items.push( new_feed_item );

                for ( var k = 0, ll = data[ i ].conversation.streamEntry.length; k < ll; k++ )
                {
                    var cmessage = data[ i ].conversation.streamEntry[ k ];
                    if ( cmessage.recipient.id_str === cuserId ) // latest incoming in conversation
                    {
                        mincoming.push({
                            data: cmessage, 
                            time: new Date( cmessage.created_at ).getTime(),
                            id: cmessage.id_str
                        });
                        break;
                    }
                }    
            }

            mincoming.sort( function ( a, b ) 
            {
                if (a.time > b.time) {
                    return -1;
                }
                if (a.time < b.time) {
                    return 1;
                }
                return 0;
            });        

            // find latest incoming
            if ( mincoming.length > 0 ) self.firstItemID = mincoming[ 0 ].time;

            else  self.firstItemID = new Date().getTime();
        }
        
        else if ( this.id == 'lists' ) 
        {
            this.dropdown_feed = true;
            this.dropdown_obj = new DropdownFeedItem( data, this );
            //this.items.push( new DropdownFeedItem( data, this ) );
        }

        else if ( this.id == 'search' ) this.items.push( new SearchFeedItem( data, this ) );

        else if ( this.id == 'outreach' ) this.items.push( new SearchFeedItem( data, this ) );

        else if ( data !== undefined ) for ( i = 0, l = data.length; i < l; i++ )
        {
            var this_datum = this.format_item( data[ i ] );

            if ( this.id == 'mentions' ) new_feed_item = new TwitterCollapsibleFeedItem( [this_datum], self );

            else new_feed_item = new TimelineFeedItem( this_datum, this );

            this.items.push( new_feed_item );
        }

        this.show_items();
    };

    TwitterFeed.prototype.format_item = function ( data )
    {
        var this_datum = {
            user: data.user,
            updateTime: ( new Date( data.created_at ).getTime() / 1000 ),
            favorites: {
                count: data.favorite_count,
                by_me: data.favorited
            },
            retweets: {
                count: data.retweet_count,
                by_me: data.retweeted,
                id: ( ( data.retweeted_status !== undefined ) ? data.retweeted_status.id_str : data.id_str ),
                retweetId: ( ( data.retweetId !== undefined ) ? data.retweetId : false )
            },
            message: data.text,
            fromName: ( data.name || data.user.name ),
            username: ( data.screen_name || data.user.screen_name ),
            profilePic: ( data.profile_image_url || data.user.profile_image_url ),
            postID: data.id_str,
            id: data.id_str,
            raw_data: data
        };

        if ( data.entities !== undefined && data.entities.media !== undefined && Array.isArray( data.entities.media.media_url ) )
        {
            this_datum.media = [];
            data.entities.media.media_url.forEach(function(media_url){
                this_datum.media.push({
                    type: 'photo',
                    src: media_url
                });    
            });   
        }
        
        var urls = [];
        if ( data.entities && data.entities.urls && ! _.isEmpty( data.entities.urls ) )
        {
            urls = data.entities.urls;

            if ( !Array.isArray( urls ) ) urls = [ urls ];    
        }

        // for shared YT link
        if ( urls.length && (!data.entities.media || 
            ( !Array.isArray( data.entities.media ) && data.entities.media.media_url && data.entities.media.media_url.indexOf('https://i.ytimg.com/') !== -1 )))
        {
            var video_id;
            if ( urls[0].expanded_url.indexOf('youtube.com') !== -1 )
            {
                var hashes = urls[0].expanded_url.slice( urls[0].expanded_url.indexOf('?') + 1 ).split('&');
                for ( var i = 0; i < hashes.length; i++ ) 
                {
                    var hash = hashes[i].split('=');

                    if ( hash[0] == 'v' ) video_id = hash[1];
                }
            }
            else if ( urls[0].expanded_url.indexOf('//youtu.be/') !== -1 ) video_id = urls[0].expanded_url.replace('https://youtu.be/','');
            
            if ( video_id )
            {
                data.entities.media = { media_url:'https://img.youtube.com/vi/' +video_id+ '/hqdefault.jpg' };
                data.entities.video_id = video_id;
            }
        }

        if ( this_datum.message !== undefined )
        {
            //delete links
            var exp = /(\b((https?|ftp|file):\/\/|bit.ly\/|goo.gl\/|t.co\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

            this_datum.message = this_datum.message.replace(exp,'').trim();

            urls.forEach(function(url)
            {
                this_datum.message += ' ' + url.url;   
            });  
        }
        

        return this_datum;
    };

    TwitterFeed.prototype.get_post_media_element = function ( raw_data, $media )
    {
        var ext_element,
            slider_items = [];
        if ( raw_data && raw_data.entities && raw_data.entities.media )
        {
            var ext_media_data = raw_data.entities.ext_media,
                ext_media,
                variant;

            if( ext_media_data && ext_media_data.media )
            {
                if ( Array.isArray( ext_media_data.media ) ) ext_media = ext_media_data.media[ 0 ];

                else ext_media = ext_media_data.media;
            }

            if ( ext_media && ( ext_media.type === 'animated_gif' || ext_media.type === 'video' ) && ext_media.video_info && ext_media.video_info.variants && ext_media.video_info.variants.variant )
            {
                var variant_data = ext_media.video_info.variants.variant;

                if ( Array.isArray( variant_data ) ) variant = variant_data[ 0 ];

                else variant = variant_data;    
            }

            if ( variant )
            {
                $media.addClass('center');
                //ext_element = $('<video loop class="animated-gif" poster="' + ext_media.media_url_https + '" src="' + variant.url + '"></video>');
                /*if ( ext_media.type === 'animated_gif' ) 
                {
                    ext_element = $('<video autoplay loop class="animated-gif" poster="' + ext_media.media_url_https + '" src="' + variant.url + '"></video>');
                }
                else
                {*/
                    ext_element = $(
                        "<div class='ui-grid-solo l_message'>" +
                        "<div class='img_box video ui-grid-solo position-relative'><img class=\"video-button\" src=\"img/play-button.png\"><img class=\"img-responsive\" src='" + ext_media.media_url_https + "'></div>" +
                        "<div class='clear'></div>");

                    ext_element.on('click',function ()
                    {
                        EC.UI.IAB( encodeURI(variant.url ),'','_system');
                    });
                //}
            }

            else
            {
                if ( raw_data.preview_content )
                {
                    var preview_content = JSON.parse( raw_data.preview_content ),
                        title = '',
                        stuff = '';

                    if ( preview_content.title ) title = preview_content.title;

                    if ( raw_data.picture_text ) stuff = raw_data.picture_text;

                    ext_element = $(
                        "<div class='l_message'>" +
                        "<div class='img_box'><img src='" + raw_data.entities.media.media_url + "'></div>" +
                        "<div class='clear'></div>" +
                        "<a class='ph_link' href='" + preview_content.url + "' target='_blank'>" + title + "</a>" +
                        "<div class='gray_text media'>" + stuff + "</div>" +
                        "</div>"
                    );

                    slider_items.push({'src':raw_data.entities.media.media_url, w:964, h:1024}); 
                }

                else
                {
                    ext_element = $('<img class="twitter-image" src="' +raw_data.entities.media.media_url+ '" >'); 
                    slider_items.push({'src':raw_data.entities.media.media_url, w:964, h:1024}); 
                }

                var video_id = raw_data.entities.video_id;

                if ( video_id !== undefined )
                {
                    var $clickable = $('<div>');

                    if ( ext_element.find('.img_box').length ) 
                    {
                        $clickable = ext_element.find('.img_box');
                        ext_element.find('.img_box').addClass('video');
                    }

                    else
                    {
                        $clickable = $media;
                        $media.addClass('video');
                    }

                    $clickable.on('click', function( e ){
                        e.stopPropagation();
                        EC.UI.IAB( encodeURI( 'https://www.youtube.com/embed/'+video_id+'?autoplay=1' ),'','_system');
                        /*var mediaObject = '<iframe src="https://www.youtube.com/embed/'+ video_id 
                            + '?autoplay=1" width="1280" height="720" frameborder="0"></iframe>';
                        post_manager.watchPictureVideo( mediaObject, true ); */   
                    });   
                }  
            }
        }

        return [ext_element, slider_items];
    };
    

    return TwitterFeed;

}];






