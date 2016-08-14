/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'LinkedinFeedItem', 'DropdownFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, LinkedinFeedItem, DropdownFeedItem ){  

    var self = this;

    function LinkedinFeed ( stream, profile, options )
    {
        Feed.apply( this, [ stream, profile, options ]);
    }

    LinkedinFeed.prototype = Object.create( Feed.prototype );

    LinkedinFeed.prototype.constructor = LinkedinFeed;

    LinkedinFeed.prototype.get_data = function ( callback )
    {
        // console.log( this.id )
        // console.log( this.value )
        
        // requests data and then calls this.save_items
        if ( !this.initialized ) 
        {
            switch ( this.id )
            {
                case 'contacts': this.retrieveLinkedinData('getLNContacts');//console.log('contacts');//this.getNewsFeed("newsFeed");
                break;

                case 'ln_companies': this.getLNCompanies();//console.log('ln_companies');//this.getNewsFeed("wallPosts");
                break;

                case 'groups': this.getLNGroups(); //console.log('groups');//this.getNewsFeed("pagesFeed");
                break;

                case 'inbox': this.getLNInbox();//console.log('inbox');//this.getLnInbox();
                break;

                case 'home': this.getLNHome(); //console.log('lnc_homeWall');
                break;

                case 'lnc_homeWall': this.retrieveLinkedinData('getLNCmpHome');//console.log('lnc_homeWall');
                break; 

                case 'lnc_products': console.log('lnc_products');
                break;

                default: break;
            }
        }
        else
        {
            this.save_items();
        }
    };

    LinkedinFeed.prototype.more = function ()
    { 
        var self = this;
        // if(this.next>0)
        // {
                data = {
                    action: 'getLNCmpHome',
                    //wall: true,
                    profile_id: this.id,
                    accountID: this.profile.account.id,
                    profileID: this.profile.id,
                    start: this.next
                };

                var method = '';
                switch ( this.id )
                {
                    case 'contacts': data.action = 'getLNContacts';
                        method = 'contacts';
                    break;

                    case 'ln_companies': data.action = 'getLNCompanies';
                        self.element.find('.more')[0].remove();
                        method = 'companies';
                        return;
                    

                    case 'groups': data.action = 'getLNGroups';
                        method = 'groups';
                    break;

                    case 'inbox': data.action = 'getLNInbox';
                        data.profile_id = this.profile.data.profile_Id;
                        if ( data.start === FALSE ) data.start = 0;  
                        method = 'inbox'; 
                    break;

                    case 'home': data.action = 'getLNHome';
                        method = 'home';
                    break;

                    default: break;
                }

            
            
            var request = {
                type: 'GET',
                url: "feed/linkedIn/"+method,
                data: data
            };

            load_more_flag = true;
            EC.request( request ).then( function ( resp )
            {
                load_more_flag = false;

                var data = resp;

                // console.log('getLnInbox more response');
                // console.dir( data )

                if ( data.data.length < 1 )
                {
                    self.element.find('.more').remove();
                    //self.hide_pullup(); 
                }

                else
                {
                    self.next += 25;//data.updateKey;

                    self.add_items( data.data );

                    // self.element.find('.more').trigger('click')
                }
            });
        // } 
        // else
        // {
        //     self.element.find('.more').remove();
        // }  
    };

    LinkedinFeed.prototype.retrieveLinkedinData = function ( action ) // getLNCmpHome => company updates
    {
        var self = this;
        self.next = 0;
        var data = {
            action: action,
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            profile_Id: this.profile.data.profile_Id,
            start: self.next
        };

        
        var method = '';
        switch( action )
        {
            case 'getLNContacts':
                method = 'linkedIn/contacts';
                break;
            case 'getLNCmpHome':
                method = 'linkedIn/companyHome';
                break;
            default:
                method = '';
                break;
        }
        var request = {
            type: 'GET',
            url: 'feed/'+method,
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            //console.log(action +' response')
            // console.dir( obj );

            if ( obj.data === undefined || obj.data.length < 1 ) 
            {
                self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').iscrollview("refresh");
            }

            /*if ( obj.paging != undefined )*/ 
            // if ( obj.data.length == 25 )
            else
            {
                self.next = obj.data.length;//obj.data.updateKey;//obj.paging.next;

                self.save_items( obj.data );
            }
            // else
            // {
            //     self.element.find('.more').remove()

            //     self.save_items( obj.data );
            // }

            // self.save_items( obj.data );

            self.initialized = true;
        });
    };

    LinkedinFeed.prototype.getLNCompanies = function ()
    {
        var self = this;
        self.next = 0;
        var data = {
            action: 'getLNCompanies',
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            start: 0
        };

        var request = {
            type: 'GET',
            url: 'feed/linkedIn/companies',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            if ( obj.data === undefined || obj.data.length < 1 ) 
            {
                self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').iscrollview("refresh");
            }

            //if ( obj.paging != undefined ) self.next = obj.paging.next;
            // if ( obj.data.length == 25 )
            else
            {
                self.next = obj.data.length;

                if ( obj.defaultCompanyId !== undefined && obj.defaultCompanyId[0] !== undefined && ! _.isEmpty( obj.defaultCompanyId[0] ) )
                    self.default_element = obj.defaultCompanyId[ 0 ]; 

                self.save_items( obj.data );
            }  
            // else
            // {
            //     self.element.find('.more').remove()

            //     self.save_items( obj.data );
            // }          

            // self.save_items( obj.data );

            self.initialized = true;
        });
    };

    LinkedinFeed.prototype.getLNGroups = function ()
    {
        var self = this;

        self.next = 0;
        
        var data = {
            action: 'getLNGroups',
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            start: 0
        };

        var request = {
            type: 'GET',
            url: 'feed/linkedIn/groups',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            if ( obj.data === undefined || obj.data.length < 1 ) 
            {
                self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').iscrollview("refresh");
            }

            //if ( obj.paging != undefined ) self.next = obj.paging.next;
            // if ( obj.data.length == 25 )
            else
            {
                self.next = obj.data.length;

                if ( obj.defaultGroupId !== undefined && obj.defaultGroupId[0] !== undefined && ! _.isEmpty( obj.defaultGroupId[0] ) )
                    self.default_element = obj.defaultGroupId[0]; 

                self.save_items( obj.data );
            }     
            // else
            // {
            //     self.element.find('.more').remove()

            //     self.save_items( obj.data );
            // }          

            // self.save_items( obj.data ); 

            self.initialized = true;
        });
    };

    LinkedinFeed.prototype.getLNHome = function ()
    {
        var self = this;
        // console.log("matan here - "+this.id);
        // console.dir(self);
        var data = {
            action: 'getLNHome',
            //stream: 'inBox',
            //profile_id: this.id,
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            start: 0
        };

        var request = {
            type: 'GET',
            url: 'feed/linkedIn/home',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            // console.log('getLNHome response')
            // console.dir( obj )

            if ( obj.data === undefined || obj.data.length < 1 ) 
            {
                self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').iscrollview("refresh");
            }

            //if ( obj.paging != undefined ) self.next = obj.paging.next;
            // if ( obj.data.length == 25 )
            else
            {
                // self.next = 25;
                self.next = obj.data.length;

                self.save_items( obj.data );
            }            

            // self.save_items( obj.data );

            self.initialized = true;
        });
    };

    LinkedinFeed.prototype.getLNInbox = function ()
    {
        var self = this;

        var data = {
            action: 'getLNInbox',
            //stream: 'inBox',
            profile_id: this.profile.data.profile_Id,
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            start: 0
        };

        var request = {
            type: 'GET',
            url: 'feed/linkedIn/inbox',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            // console.log('getLnInbox response');
            // console.dir( obj );

            if ( obj.data === undefined || obj.data.length < 1 ) 
            {
                self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').iscrollview("refresh");
            }

            //if ( obj.paging != undefined ) self.next = obj.paging.next;
            // if ( obj.data.length == 25 )
            else
            {
                self.next = obj.data.length;

                self.save_items( obj.data );
            }            

            // self.save_items( obj.data );

            self.initialized = true;
        });
    };

    LinkedinFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length;

        if ( this.id == 'groups' || this.id == 'ln_companies' )
        {
            if ( this.items[ 0 ] !== undefined ) data = data.concat( this.items[ 0 ].data );
            
            this.items = [];

            this.items.push( new DropdownFeedItem( data, this ) );
        }

        else
        {
            for ( var i = 0, l = data.length; i < l; i++ )
            {
                var new_feed_item;

                //if ( this.id == 'ln_companies' ) new_feed_item = new LinkedinCollapsibleFeedItem( data[ i ], this );

                /*else*/ new_feed_item = new LinkedinFeedItem( data[ i ], this );

                this.items.push( new_feed_item );
            }
        }

        this.append_items( add_after_index );
    };

    LinkedinFeed.prototype.save_items = function ( data )
    {
        this.items = []; // reset

        if ( this.id == 'groups' || this.id == 'ln_companies' )
        {
            this.dropdown_feed = true;
            this.dropdown_obj = new DropdownFeedItem( data, this );
            //this.items.push( new DropdownFeedItem( data, this ) );
        }

        else
        {
            if ( data !== undefined ) for ( var i = 0, l = data.length; i < l; i++ )
            {
                var new_feed_item;

                //if ( this.id == 'ln_companies' ) new_feed_item = new LinkedinCollapsibleFeedItem( data[ i ], this );

                /*else*/ new_feed_item = new LinkedinFeedItem( data[ i ], this );

                this.items.push( new_feed_item );
            }
        }

        this.show_items();
    };
    

    return LinkedinFeed;

}];






