/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'TimelineFeedItem', 'DropdownFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, TimelineFeedItem, DropdownFeedItem ){  

    var self = this;

    function PinterestFeed ( stream, profile, options )
    {
        Feed.apply( this, [ stream, profile, options ]);
    }

    PinterestFeed.prototype = Object.create( Feed.prototype );

    PinterestFeed.prototype.constructor = PinterestFeed;

    PinterestFeed.prototype.get_data = function ( callback )
    {
        if ( !this.initialized ) 
        {
            switch ( this.id )
            {
                // case 'pi_myActivity': this.getMyActivity();
                // break;

                case 'pi_board': this.getBoards();
                break;

                case 'pi_pins': this.getPinterestFeed( this.id );
                break;

                case 'pi_likes': this.getPinterestFeed( this.id );
                break;

                default: break;
            }
        }

        else
        {
            this.save_items();
        }
    };

    PinterestFeed.prototype.getBoards = function ( )
    {
        var self = this, data = [];

            
                //if ( window.globals.piBoards && window.globals.piBoards.id === this.profile.account.id ) data = window.globals.piBoards.data;

                //else 
                self.profile.account.profiles.forEach( function( profile )
                {
                    if ( !profile.data.objectType || profile.data.objectType !== 'user' )
                    {
                        data.push({
                            id: profile.data.userId,
                            name: profile.username
                        });   
                    }
                });

                //window.globals.piBoards = undefined;
        

            if ( self.profile.data.defaultGroupId !== undefined && ! _.isEmpty( self.profile.data.defaultGroupId ) )
                self.default_element = self.profile.data.defaultGroupId;

            self.save_items( data );
         
    };

    PinterestFeed.prototype.request = function ( stream, parameters, callback )
    {
        var self = this;

        if( self.next )
        {
            parameters.push({
                key: 'cursor',
                value: self.next     
            });    
        }

        parameters.push({
            key: 'limit',
            value: '20'     
        });

        var data = {
            action: 'getPinterestFeed',
            accountID: self.profile.account.id,
            profileID: self.profile.id,
            stream: stream,
            parameters: parameters
        };

        var request = {
            type: 'GET',
            url: 'feed/pinterest',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            if ( typeof callback === 'function') callback( obj ); 
        });             
    };

    PinterestFeed.prototype.getPinterestFeed = function ( stream )
    {
        var self = this,
            parameters = [];

        parameters.push({
            key: 'fields',
            value: 'id,link,url,creator,board,created_at,note,counts,media,attribution,image,metadata'     
        });

        self.request( stream, parameters, function ( obj )
        {
            if ( obj.returnCode === 'FAIL' || ( obj.data.status && obj.data.status === 'failure' ) )
            {
                self.element.find('.feed-items')
                    .html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').find('.more').remove();
                self.element.find('.feed-body').iscrollview("refresh");
                return;
            }

            var page = obj.data.page;
            if ( page && page.cursor ) self.next = page.cursor;
            obj.data = obj.data.data; 

            self.save_items( obj.data );

            self.initialized = true;
        });  
    };

    PinterestFeed.prototype.more = function ()
    {
        if ( !this.next )
        {
            this.element.find('.more').remove();
            //self.hide_pullup(); 
            return;
        }

        var self = this,
            parameters = [];

        parameters.push({
            key: 'fields',
            value: 'id,link,url,creator,board,created_at,note,counts,media,attribution,image,metadata'     
        });

        self.request( self.id, parameters, function ( obj )
        {
            if ( obj.returnCode === 'FAIL' || ( obj.data.status && obj.data.status === 'failure' ) )
            {
                self.element.find('.more').remove();
                self.next = '';
                //self.hide_pullup(); 
            }

            else
            {
                var page = obj.data.page;
                if ( page && page.cursor ) self.next = page.cursor;
                else                       self.next = '';

                obj.data = obj.data.data; 

                self.add_items( obj.data );
            }
        });
    };

    PinterestFeed.prototype.save_items = function ( data )
    {
        this.items = []; // reset

        if ( data !== undefined )
        {
            if ( this.id == 'pi_board' ) 
            {
                this.dropdown_feed = true;
                this.dropdown_obj = new DropdownFeedItem( data, this );
                //this.items.push( new DropdownFeedItem( data, this ) );
            }

            else
            {
                for ( var i = 0, l = data.length; i < l; i++ )
                {
                    var this_datum = this.format_item( data[ i ] );

                    this.items.push( new TimelineFeedItem( this_datum, this ) );
                }   
            }
        }
        
        this.show_items();
    };

    PinterestFeed.prototype.add_items = function ( data )
    {
        if ( this.id == 'pi_board' ) return;

        var add_after_index = this.items.length;

        if ( data ) for ( var i = 0, l = data.length; i < l; i++ )
        {
            var this_datum = this.format_item( data[ i ] );

            this.items.push( new TimelineFeedItem( this_datum, this ) );
        }

        this.append_items( add_after_index );
    };

    PinterestFeed.prototype.format_item = function ( data )
    {
        var this_datum = {
            message: data.note,// data.message,
            raw_data: data
        };

        if ( data.counts && data.counts.repins ) this_datum.repins = '' + data.counts.repins;

        else this_datum.repins = '';

        this_datum.link = data.link;

        if ( data.counts && data.counts.likes ) this_datum.likes = { count: data.counts.likes };

        if ( data.counts && data.counts.comments ) this_datum.comments = { count: data.counts.comments };

        if ( data.url ) this_datum.permalink = data.url;

        if ( data.image && data.image.original )
        {
            this_datum.media = {
                type: 'photo',
                src: data.image.original.url
            };   
        }

        if ( data.metadata && data.metadata.link && data.metadata.link.favicon && data.metadata.link.site_name )
        {
            this_datum.mediaDescription = '<div class="pi-from"><img src="' + data.metadata.link.favicon; 
            this_datum.mediaDescription += '" /></div>from ' + data.metadata.link.site_name;
        }

        // if ( this.id == 'pi_board' && this_datum.message ) this_datum.message = this_datum.message.replace('       More       ','').trim();

        // if ( data.board != undefined && data.board.length > 0 ) 
        // {
        //     if ( this.id == 'pi_myActivity') this_datum.mediaDescription = 'Pinned onto: ' + data.board;

        //     else  this_datum.mediaDescription = 'Pinned from: <a href="http://pinterest.com/source/' + data.board + '" target="_blank">' + data.board + '</a>';
        // } 

        // else if ( this.id == 'pi_board' && data.user_name != undefined && data.user_name == 'Pinned by pinner' ) this_datum.mediaDescription = data.user_name;      

        // if ( data.img != undefined && data.img[ 0 ] != undefined )
        // {
        //     this_datum.media = {
        //         type: 'photo',
        //         src: data.img[ 0 ]
        //     };   
        // }

        return this_datum; 
    };

    PinterestFeed.prototype.changePinBoard = function( profile, action, command, parameters, object_id, callback )
    {
        var data = {
            action: action,
            command: command,
            accountID: profile.account.id,
            profileID: profile.id,
            object_id: object_id || '',
            parameters: parameters || []
        };

        var request = {
            type: 'POST',
            url: 'feed/like',
            data: data
        };

        EC.server.request( request, function ( response )
        {
            var obj = response;

            if ( typeof callback === 'function') callback( obj ); 
        });
    };

    return PinterestFeed;

}];






