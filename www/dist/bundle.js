(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	function AppMain($ionicPlatform, $rootScope, $scope) 
	{
	  $ionicPlatform.ready(function() {
	    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
	    // for form inputs)
	    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
	      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	    }
	    if (window.StatusBar) {
	      // org.apache.cordova.statusbar required
	      //StatusBar.styleLightContent();
	    }
  	  });

	  $rootScope.$on('$stateChangeSuccess', function (event){
	  	$rootScope.currentScope = $scope;
	  });

  	  $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, error) {
	   if (toState.name == 'tabs.manage_accounts') {
	     $rootScope.hideTabs=true;
	   } else {
	     $rootScope.hideTabs=false;
	   }
	  });
  	}

  	module.exports = ['$ionicPlatform', '$rootScope', AppMain];
},{}],2:[function(require,module,exports){
require('./constants');
require('./controllers');
require('./services');
require('./directives');

var $stateProviderRef = null;
var $urlRouterProviderRef = null;

angular.module('ionicApp', [
                              'ionic', 
                              'ionicApp.constants', 
                              'ionicApp.controllers', 
                              'ionicApp.services',
                              'ionicApp.directives',
                              'ngStorage',
                              'ui.router',
                              'ngCordova',
                              'underscore'
                              ])

.config(require('./router'))

.run(require('./app-main'));
              
              
},{"./app-main":1,"./constants":25,"./controllers":26,"./directives":27,"./router":28,"./services":29}],3:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Account', 'UserSettings', '$cordovaInAppBrowser', function($http, $rootScope, $localStorage, EC, apiUrl, Account, UserSettings, $cordovaInAppBrowser ){  

    var initialized = false,
        data = {},
        accounts = [],
        accounts_order = [],
        accounts_by_id = {},
        favorites_account,
        search_account,
        rss_account,
        outreach_account,
        cinbox_account,
        last_added_profile,
        refresh_on_close = false,
        template_selector = '#account-manager-template';

        module.rendered = false;
        module.go_back_flag = true;
        module.favorite_rendered = false;
        module.search_rendered = false;
        module.rss_rendered = false;

    
    this.init = function ( callback )
    {
        console.log('accountManager init');


        //console.log($http);
        //return template_selector;
        
        //get accounts and store it
        var request = {
            method: 'GET',
            url: apiUrl + 'account/accounts',
            data:{'name':'ram'}
            };

        EC.request( request ).then(store_accounts, function(){});

        function store_accounts ( response )
        {
            console.log('response:::');
            console.log(response);
            console.log(UserSettings);

            var data = response || [],
                items = data.account || [],
                fav_loaded = false,
                srch_loaded = false,
                rss_loaded = false,
                outreach_loaded = false,
                acc_order = data.account_order || [];

            if( data.settings !== undefined )
            {
                UserSettings.handle_settings( data.settings, undefined, true );
            }

            UserSettings.analytics_groups = [];
            
            if( data.analyticsGroups !== undefined )
              UserSettings.analytics_groups = data.analyticsGroups.analyticsGroup;
            

            if ( ! Array.isArray( items ) ) items = [ items ];

            accounts = [];
            accounts_by_id = {};
            accounts_order = acc_order;

            //Create account-object for each accounts and store by id .
            for ( var i = 0, p = items.length; i < p; i++ )
            {

                var new_account = new Account( items[ i ] );
                
                var length = accounts.push( new_account ); // iterable

                accounts_by_id[ new_account.id ] = accounts[ length - 1 ]; // indexed by account ID, references account by index
                
                
            }
            console.log('accounts:::');
            console.log(accounts);
            //if callback is valid function, then call it
            if( typeof callback == 'function' )
                callback(response);
            
        } 
        

    };

    this.is_rendered = function() 
    {
        return module.rendered;
    };

    this.set_rendered = function( flag ) 
    {
        module.rendered = flag;
    };

    this.is_favorite_rendered = function() 
    {
        return module.favorite_rendered;
    };

    this.set_favorite_rendered = function( flag ) 
    {
        module.favorite_rendered = flag;
    };

    this.is_search_rendered = function() 
    {
        return module.search_rendered;
    };

    this.set_search_rendered = function( flag ) 
    {
        module.search_rendered = flag;
    };

    this.is_rss_rendered = function() 
    {
        return module.rss_rendered;
    };

    this.set_rss_rendered = function( flag ) 
    {
        module.rss_rendered = flag;
    };

    this.get_go_back_flag = function() 
    {
        return module.go_back_flag;
    };

    this.set_go_back_flag = function( flag ) 
    {
        module.go_back_flag = flag;
    };
    
    this.find = function ( account_id )
    {
        return accounts_by_id[ account_id ];
    };

    this.get_profile = function ( profile_id )
    {
        if ( profile_id == 'favorites') return ( favorites_account !== undefined ? favorites_account.profiles[ 0 ] : false );

        if ( profile_id == 'search') return ( search_account !== undefined ? search_account.profiles[ 0 ] : false );

        if ( profile_id == 'rss') return ( rss_account !== undefined ? rss_account.profiles[ 0 ] : false );

        if ( profile_id == 'outreach') return ( outreach_account !== undefined ? outreach_account.profiles[ 0 ] : false );

        if ( profile_id == 'cinbox') return ( cinbox_account !== undefined ? cinbox_account.profiles[ 0 ] : false );

        for ( var i = 0, a = accounts.length; i < a; i++ )
        {
            for ( var j = 0, p = accounts[ i ].profiles.length; j < p; j++ )
            {
                var this_profile = accounts[ i ].profiles[ j ];
                
                if ( this_profile.id == profile_id )
                {
                    return this_profile;
                }
            }
        }

        return undefined;
    };

    this.accounts = function ( callback ) 
    { 
        if ( typeof callback == 'function') callback( accounts );

        else return accounts; 
    };

    this.list_accounts = function ( callback )
    {
        var temp = [],
            i = 0,
            a = 0;
        
        if (accounts_order.length > 0 ){
            for ( i = 0, a = accounts_order.length; i < a; i++ )
            {
                
                for ( var j = 0, ac = accounts.length; j < ac; j++ )
                {
                    if(accounts_order[i] == accounts[ j ].type ) {
                        if ( accounts[ j ].has_unexpired_profiles() ) temp.push( accounts[ j ] );
                    }
                }
            }
        }
        else
        {
            for ( i = 0, a = accounts.length; i < a; i++ )
            {
                if ( accounts[ i ].has_unexpired_profiles() ) temp.push( accounts[ i ] );
            }
            
            temp.sort(function ( a, b )
            {
                if ( a < b ) return -1;
            
                if ( a > b ) return 1;
            
                return 0;
            });
        }

        
        if ( typeof callback == 'function') callback( temp );
        
        else return temp;
    };

    this.add_account = function( type )
    {
        console.log($localStorage.user_data);
        var custom_headers = $localStorage.user_data || {},
            path = 'account/account?type=' +type+ '&lf=false';

        custom_headers = JSON.parse( custom_headers );

        var ckey = (custom_headers.client_key !== undefined) ? JSON.stringify(custom_headers.client_key): '';
        
        path += '&user_name='+custom_headers.user_name+'&user_pass='+custom_headers.user_pass+'&client_key='+ckey+'&device=ios';
        //alert(encodeURI(apiUrl+path));
        var options = {
          location: 'yes',
          clearcache: 'yes',
          clearsessioncache: 'yes',
          toolbarposition: 'top'
        };

        $cordovaInAppBrowser.open( encodeURI(apiUrl+path), '_blank', options);

        $rootScope.$on('$cordovaInAppBrowser:exit', function(e, event){
            accountManager.set_rendered( false );
        });
    };

    

    return this;

}];







},{}],4:[function(require,module,exports){


module.exports = ['$http','EC', 'apiUrl', 'Profile', function($http, EC, apiUrl, Profile){

    function Account ( account_data )
    {
        var self = this;

        this.id = account_data.accountId;
        
        this.type = account_data.type;
        
        this.can_post = false;

        if ( this.type == 'Facebook' || this.type == 'Linkedin' || this.type == 'Twitter' || this.type == 'Blogger' || this.type == 'Pinterest' ) this.can_post = true;

        else if ( this.type == 'GooglePlus') this.can_post = true;

        else if ( this.type == 'Pinterest' && account_data.email !== undefined && account_data.password !== undefined && ! $.isEmptyObject( account_data.password ) ) this.can_post = true;

        this.character_limit = false;

        if ( this.type == 'Linkedin') this.character_limit = 700;

        else if ( this.type == 'Twitter') this.character_limit = 140;

        this.data = account_data || {};

        this.profiles = [];

        if ( this.data.config )
        {
            if ( !Array.isArray( this.data.config ) ) this.profiles.push( new Profile( this.data.config, this ) );

            else {
                
                this.data.config.forEach(function ( item )
                {
                    var new_profile = new Profile( item, self );
    
                    self.profiles.push( new_profile );
                });
            }    
        }

        this.expired = ( account_data.monitored == 'expired' ? true : false );
        // this.expired = false;
    }

    Account.prototype.has_monitored_profiles = function ()
    {
        if ( this.monitored_profiles().length > 0 ) return true;

        else return false;
    };

    Account.prototype.has_events_monitored_profiles = function ()
    {
        if ( this.events_monitored_profiles().length > 0 ) return true;

        else return false;
    };
    
    Account.prototype.has_unexpired_profiles = function ()
    {
        if ( this.unexpired_profiles().length > 0 ) return true;

        else return false;
    };
    
    Account.prototype.monitored_profiles = function ()
    {
        var profiles = [];

        for ( var i = 0, p = this.profiles.length; i < p; i++ ) 
        {
            if ( this.profiles[ i ].monitored == 'on') profiles.push( this.profiles[ i ] );
        }

        return profiles;
    };

    Account.prototype.events_monitored_profiles = function ()
    {
        var profiles = [];

        for ( var i = 0, p = this.profiles.length; i < p; i++ ) 
        {
            if ( this.profiles[ i ].eventsMonitored == 'on') profiles.push( this.profiles[ i ] );
        }

        return profiles;
    };
    
    Account.prototype.unexpired_profiles = function ()
    {
        var profiles = [];

        for ( var i = 0, p = this.profiles.length; i < p; i++ ) 
        {
            if ( this.profiles[ i ].monitored != 'off') profiles.push( this.profiles[ i ] );
        }

        return profiles;
    };

    Account.prototype.toString = function ()
    {
        return '[object ' +this.type+ ' Account]';
    };

    Account.prototype.valueOf = function ()
    {
        switch ( this.type.toLowerCase() )
        {
            case 'facebook': return 1;
                

            case 'twitter': return 2;
                

            case 'googleanalytics': return 3;
               

            case 'linkedin': return 4;
                

            case 'instagram': return 5;
                

            case 'youtube': return 6;
                

            case 'pinterest': return 7;
                

            case 'googleplus': return 8;
               

            case 'blogger': return 9;
                

            case 'tumblr': return 10;
                

            case 'wordpress': return 11;
                

            case 'vk': return 12;
                

            default: return 13;
        }
    };

    Account.prototype.refreshAccount = function()
    {
        var self = this;

        var request = {
                        type: "POST",
                        url: "account/refresh",
                        data: {
                            action: "refreshAccount",
                            accountID: self.id
                        }
                    };

        if ( self.type.toLowerCase() == 'pinterest')
        {
            request.data.action = 'updatePIBoards';
        }

        EC.request( request ).then(function(resp){
            console.log(resp);

            if( typeof callback == 'function' ) callback(flag);

        }, function(){});

    };

    Account.prototype.deleteAccount = function()
    {
        var self = this;

        var request = {
                        type: "POST",
                        url: "account/delete",
                        data: {
                            action: "deleteAccountByID",
                            accountID: self.id
                        }
                    };

        EC.request( request ).then(function(resp){
            console.log(resp);

            if( typeof callback == 'function' ) callback(flag);

        }, function(){});

    };

    return Account;
    
}];



},{}],5:[function(require,module,exports){
module.exports = ['$http','EC', 'apiUrl', 'socialManager', function($http, EC, apiUrl, socialManager){

	function Profile ( profile_data, account )
    {
        var self = this,
            data = profile_data || {};

        this.account = account || {};

        this.id = data.sampleId;

        this.picture = ( data.profilePicture ? decodeURIComponent( data.profilePicture ) : 'ssssssss' );

        if ( this.account.type.toLowerCase() !== 'pinterest' ) this.picture = this.picture.replace('http://','//');

        if ( data.monitored == 'on' || data.socialMonitored == 'on') this.monitored = 'on';
        
        else if ( data.monitored == 'expired' || data.socialMonitored == 'expired') this.monitored = 'expired';

        else this.monitored = 'off';

        this.profile_checked = this.monitored == 'on' ? true:false;

        this.eventsMonitored = data.eventsMonitored;

        // this.monitored = ( ( data.monitored == 'on' || data.socialMonitored == 'on') ? 'on' : 'off');

        if ( data.accountStreams !== undefined && Array.isArray( data.accountStreams.stream ) ) this.streams = data.accountStreams.stream;

        else if ( data.accountStreams !== undefined ) this.streams = [ data.accountStreams.stream ];
        
        else if ( this.account.data.accountStreams !== undefined && Array.isArray( this.account.data.accountStreams.stream ) ) this.streams = this.account.data.accountStreams.stream;

        else if ( this.account.data.accountStreams !== undefined ) this.streams = [ this.account.data.accountStreams.stream ];

        else this.streams = [];

        // this.social = new Social( self );
        this.social = new socialManager( self );

        // this.analytics = new Analytics( self );
        //this.analytics = new analyticsManager( self );

        this.groups = [];
        
        this.network = this.account.type.toLowerCase();

        this.username = undefined;
        this.username_key = undefined;

        if ( this.monitored === 'on' && this.account.type.toLowerCase() == 'linkedin')
        {
            /*var req_data = {
                action: 'getLNGroups',
                accountID: this.account.id,
                profileID: this.id
            };

            var request = {
                type: 'GET',
                url: 'feed/linkedIn/groups',
                data: req_data
            };

            EC.server.request( request, function ( response )
            {
                var obj = response;

                if ( obj !== undefined && obj.data !== undefined ) self.groups = ( Array.isArray( obj.data ) ? obj.data.sort(function(a,b){if(a.name < b.name) return -1;if(a.name > b.name) return 1;return 0;}) : [ obj.data ] );

                
            });*/
        }
        
        // else if ( this.account.type.toLowerCase() == 'facebook' && data.pageCategory == "User" )
        else if ( this.monitored === 'on' && this.account.type.toLowerCase() == 'facebook')
        {
            if ( data.pageCategory == "User")
            {
                /*var req_data = {
                    action: 'getFBHidden_Groups',
                    stream: 'groups',
                    accountID: this.account.id,
                    profileID: this.id,
                    next_posts: ''
                };

                var request = {
                    type: 'GET',
                    url:'feed/fbHiddenGroups',
                    data: req_data
                };

                EC.server.request( request, function ( response )
                {
                    var obj = response;
                    
                    if ( obj != undefined && obj.data != undefined && obj.data.length > 0 ) self.groups = ( Array.isArray( obj.data ) ? obj.data.sort(function(a,b){if(a.name < b.name) return -1;if(a.name > b.name) return 1;return 0;}) : [ obj.data ] );

                    
                });*/
            }
        }

        else if ( this.account.type.toLowerCase() == 'twitter')
        {
            this.lists = {
                default_element: undefined,
                data: []
            };
            // get profile Lists
            //module.get_tw_profile_lists(this/*, function(){}*/); 

            if ( data.powerUsers ) this.power_users = data.powerUsers;

            else this.power_users = {
                state: 'on',
                mediumLow: '2000',
                mediumHigh: '7500',
                high: '7500'
            };   
        }

        else if ( this.account.type.toLowerCase() == 'instagram')
        {

        }

        else if ( this.account.type.toLowerCase() == 'youtube')
        {
            
        }

        else if ( this.account.type.toLowerCase() == 'googleplus')
        {
            if( profile_data.objectType == 'page' )
            {
                this.posting_only = true; 
                this.username = profile_data.fullName + ' (Page)';
                this.username_key = 'fullName';   
            }
            else
            {
                this.username = (profile_data.fullName !== undefined && profile_data.fullName !=="")?profile_data.fullName.split("(")[0] + ' (User)': '(User)';
                this.username_key = 'fullName';   
            } 
        }

        else if ( this.account.type.toLowerCase() == 'pinterest')
        {
            this.username = profile_data.fullName;
            this.username_key = 'fullName';

            if( profile_data.objectType !== undefined && profile_data.objectType == 'user' ) this.username += ' (User)';
            
            else 
            {
                this.posting_only = true;
                this.username += ' (Board)';
            }
        }

        else
        {
            
        }

        // console.log( profile_data.pageName ) // FB 
        // console.log( profile_data.title ) // GA
        // console.log( profile_data.profileName ) // LN
        // console.log( profile_data.userName ) // IG
        // console.log( profile_data.specifiedHandleOrHashTag ) // TW
        // console.log( profile_data.fullName ) // G+
        // console.log( profile_data.userFirstName ) // YT

        ['pageName', 'title', 'profileName', 'userFirstName', 'userName', 'specifiedHandleOrHashTag', 'fullName'].forEach(function ( item )
        {
            if ( data[ item ] !== undefined && self.username === undefined )
            {
                self.username = data[ item ] + ' ';
                
                self.username_key = item;
            }
        });

        this.data = data;
    }

    Profile.prototype.toString = function ()
    {
        return '[object ' +this.account.type+ ' Profile]';
    };

    Profile.prototype.valueOf = function ()
    {
        return this.username;
    };

    Profile.prototype.is_display_profile = function( all_flag ) 
    {
        var display_profile = true,
            self = this;

        
        if ( all_flag === undefined && self.monitored === 'on')
        {
            //$account.element.find('.functions').remove();

            if ( ( self.account.type.toLowerCase() == 'googleplus' && !self.posting_only ) || self.account.type.toLowerCase() == 'pinterest' ) 
            { display_profile = false; } //hide in post manager
        } 

        else if ( all_flag === true )
        {
            if ( ( self.account.type.toLowerCase() == 'pinterest') && self.posting_only ) 
            { display_profile = false; } //hide   
        }
    
        else if ( self.account.type.toLowerCase() == 'pinterest' )
        {
            display_profile = self.posting_only;
        }

        else display_profile = false;

        return display_profile;
    };

    Profile.prototype.getUserName = function()
    {
        var self = this,
            username = this.username;

        if ( self.data.title !== undefined ) // format name for GA
        {
            var temp = username.split('(')[0] || self.username+ ' ';

            username = temp.substring(0, temp.length - 1);
        }

        return username;
    };

    Profile.prototype.update_monitor = function( flag )
    {
        var self = this;
        flag = (flag !== undefined)?flag:false;

        if( self.account.type == 'GoogleAnalytics' )
        {
            alert('google analytics............');
        }
        else
        {
            self.monitored = flag ? 'on':'off';

            save_profile_selection(function( status ){
                return status;
            });
        }

        function save_profile_selection( callback )
        {
            var request = {
                            type:'POST',
                            url:"account/singleprofilemonitor",
                            data:{
                                action: 'setSingleProfileMonitored',
                                data: { accountID: self.account.id, profileID: self.id, checked: flag }
                            }
                        };
            
            EC.request( request ).then(function(resp){
                console.log(resp);

                if( typeof callback == 'function' ) callback(flag);

            }, function(){});

        }
    };

    



    return Profile;

}];
},{}],6:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Account', '$cordovaInAppBrowser','_', function($http, $rootScope, $localStorage, EC, apiUrl, Account, $cordovaInAppBrowser, _ ){  

    var licenseOptions,
        settings,
        is_etsy_user = false,
        is_weebly_user = false,
        is_wix_user= false,
        is_lexity_user = false,
        is_shopify_user = false,
        is_bigcommerce_user = false,
        externalApps = [],
        favorites = [],
        searches = [],
        user_inbox_filters = [],
        got_sf = false,
        got_searches = false,
        numberOfCompletedEvents = 0,
        alwaysHideCompletedEvents = true,
        hideEventsCounter = false,
        displayInboxSettings = true,
        autoMarkAsCompletedTWFollow = false,
        agencyConfiguration = {},
        maxEventTime;

    
    this.getDisplayInboxSettings = function ()
    {
        return displayInboxSettings;
    };

    this.setDisplayInboxSettings = function ( display )
    {
        displayInboxSettings = display;
    };

    this.getMaxEventTime = function ()
    {
        return ( maxEventTime === undefined ? new Date().getTime() : maxEventTime );
    };

    this.setMaxEventTime = function ( time )
    {
        maxEventTime = time;
    };

    this.getAlwaysHideCompletedEvents = function ()
    {
        return alwaysHideCompletedEvents;
    };

    this.setAlwaysHideCompletedEvents = function ( hide )
    {
        alwaysHideCompletedEvents = hide;
    };

    this.getHideEventsCounter = function ()
    {
        return hideEventsCounter;
    };

    this.setHideEventsCounter = function ( hide )
    {
        hideEventsCounter = hide;
    };

    this.getNumberOfCompletedEvents = function ()
    {
        return numberOfCompletedEvents;
    };

    this.setNumberOfCompletedEvents = function ( completed_events )
    {
        numberOfCompletedEvents = completed_events;

        this.renderCompletedEventsCounter(); 
    };

    this.getAutoMarkAsCompletedTWFollow = function ()
    {
        return autoMarkAsCompletedTWFollow;
    };

    this.setAutoMarkAsCompletedTWFollow = function ( flag )
    {
        autoMarkAsCompletedTWFollow = flag;
    };

    this.renderCompletedEventsCounter = function()
    {
        /*var $indicator = $('body').find('.new-events-indicator');

        if ( $indicator.length > 0 )
        {
            if ( !hideEventsCounter && all_settings.licenseType != 'Free' && all_settings.licenseType != 'Individual' )
            {
                if ( $indicator.hasClass('zero') ) $indicator.removeClass('zero');

                $indicator.text( numberOfCompletedEvents );
            }

            else
            {
                if ( !$indicator.hasClass('zero') ) $indicator.text('').addClass('zero');    
            }
        }*/
    };

    this.getAgencyConfiguration = function ()
    {
        return agencyConfiguration;
    };

    this.setAgencyConfiguration = function ( ac )
    {
        agencyConfiguration = ac;
    };

    this.getAgencyBrands = function ()
    {

        if( agencyConfiguration.client === undefined )
            return [];

        if ( ! Array.isArray( agencyConfiguration.client ) )
            return [ agencyConfiguration.client ];

        return agencyConfiguration.client;

    };

    this.getUserPermission = function ()
    {

        var brands = module.getAgencyBrands(),
            permission = 'edit';

        if( !brands.length ) return false;

        for( var i=0; i<brands.length; i++ )
        {
            if( brands[i].selected !== undefined && brands[i].selected == '1' )
            {
                permission = brands[i].permission;
            }
        }

        return permission;

    };

    this.getAnalyticsAccounts = function ( callback )
    {
        var request = {
            type: POST,
            url: 'ajax.php',
            data: {
                action: 'getAnalyticsAccounts'
            }
        };

        EC.server.request( request, function ( response )
        {
            var obj = JSON.parse( response ); 

            console.log( obj );

            if ( typeof callback === 'function') callback( obj );
        });
    };

    this.updateAccounts = function (data, callback)
    {
        var request = {
            type:POST,
            url:"ajax.php",
            data:{
                action:'updateAccounts',
                data:data
            }
        };

        EC.server.request( request, function( response )
        {
            if ( response == SUCCESS)
            {
                module.getSettings();    
            }

            if ( typeof callback === 'function') callback( response );
        });
    };

    this.saveSettings = function( data, callback )
    {
        var request = {
            type:POST,
            url:'user/settings',
            data: {
                action: 'saveSettings',
                data: data
            }
        };

        EC.server.request( request, function( response )
        {
            if ( response.returnCode == "SUCCESS")
            {
                module.handle_settings( response.settings, function(){
                    if ( typeof callback === 'function') callback( response );
                } );
                
            }
            
            else 
            {
                if ( typeof callback === 'function') callback( response );
            }
        });
    };

    this.getSearchStreams = function( callback )
    {
        EC.server.request({ type:GET, url:'feed/searchStreams', data:{ action:'getSearchStreams'}}, function ( resp )
        {
            var data = resp;

            got_sf = true;
            searches = data;

            if ( typeof callback === 'function') callback( data );
        });
    };

    this.editSearchStream = function( stream, callback )
    {
        if ( stream.profile !== undefined )
        {
            var request = {
                type:POST,
                url:'feed/searchStreams',
                data: {
                    action: 'editSearchStream',
                    id: stream.id,
                    accountID: stream.profile.account.id,
                    profileID: stream.profile.id,
                    parameters: stream.parameters
                }
            };

            if ( stream.parameters.query !== undefined ) request.data.name = 'Search: ' + decodeURIComponent( stream.parameters.query );

            EC.server.request( request, function( response ) {

                var data = response;//JSON.parse( response );

                if ( typeof callback === 'function') callback( data );
            });
        }
    };

    this.getFavoriteStreams = function ( callback )
    {
        EC.server.request({ type:GET, url:'feed/favoriteStreams', data:{ action:'getFavoriteStreams'}}, function ( resp )
        {
            var data = resp;

            favorites = data;

            got_faves = true;

            if ( typeof callback == 'function') callback( favorites );

            // console.log('getFavoriteStreams response:')
            // console.dir( data )
        });
    };

    this.favorites = function ( callback )
    {
        if ( got_faves ) return favorites;

        else return false;
    };

    this.search_feeds = function ( )
    {
        if ( got_sf ) return searches;

        else return false;   
    };

    this.settings = function ( callback ) 
    {
        if ( typeof callback == 'function') callback( settings );

        else return settings;
    };
    
    this.getSettings = function ( callback )
    {
        var self = this;

        var request = {
            type:GET,
            url:'user/settings'            
        };

        function handle ( response )
        {
            module.handle_settings(response, callback);
            
        }

        EC.server.request( request, handle );
    };

    this.handle_settings = function( response, callback, flag_no_agency_update )
    {
        console.log('handle_settings........................');
        var self = this,
            data = response;

        flag_no_agency_update = flag_no_agency_update ? flag_no_agency_update:false;


            // set module variable
            settings = data;
            if ( settings.apiUser === undefined || _.isEmpty( settings.apiUser ) ) 
            {
                settings.apiUser = settings.email;
            }

            //set global variables
            is_wix_user = settings.wixUser;
            max_allowed_ga_accounts = settings.numberOfActiveGoogleAnalyticsAccounts;
            max_allowed_social_accounts = settings.numberOfSocialsOn;
            rem_days = settings.daysLeft;

            $localStorage.all_settings = settings;
            //EC.sessionData.set('all_settings', JSON.stringify(settings));

            //set settingsDeferred as resolved only if settings available
            //settingsDeferred.resolve();
            
            licenseOptions = data.licenseOptions;

            /*if ( data.userSource == "bigcommerce" || data.loginType != 'userPassword'){
                $('.change_pass').addClass('hide');
            }*/

            if ( data.alwaysHideCompletedEvents !== undefined && typeof data.alwaysHideCompletedEvents == 'string')
            { 
                self.setAlwaysHideCompletedEvents( data.alwaysHideCompletedEvents? ( data.alwaysHideCompletedEvents.toLowerCase() == "true"): false );
            }

            if ( data.hideInboxEventCounter !== undefined && typeof data.hideInboxEventCounter == 'string')
            {
                self.setHideEventsCounter( data.hideInboxEventCounter ? ( data.hideInboxEventCounter.toLowerCase() == "true") : false );
            }

            if ( data.displayInboxSettings !== undefined && typeof data.displayInboxSettings == 'string')
            {
                self.setDisplayInboxSettings( data.displayInboxSettings ? ( data.displayInboxSettings.toLowerCase() == "true") : false );
            }

            if ( data.numberOfNewEvents !== undefined && typeof data.numberOfNewEvents == 'string'){
                
                self.setNumberOfCompletedEvents( data.numberOfNewEvents );
            }

            if ( data.autoMarkAsCompletedTWFollow !== undefined && typeof data.autoMarkAsCompletedTWFollow == 'string')
            { 
                self.setAutoMarkAsCompletedTWFollow( data.autoMarkAsCompletedTWFollow ? ( data.autoMarkAsCompletedTWFollow.toLowerCase() == "true"): false );
            }


            if ( data.agencyConfiguration !== undefined && typeof data.agencyConfiguration == 'object'){
                
                self.setAgencyConfiguration( data.agencyConfiguration );
            }

            if ( data.externalApps!==undefined ) 
            {
                // externalApps = data.externalApps;

                if ( !Array.isArray( data.externalApps ) ) externalApps = [ data.externalApps ];

                else externalApps = data.externalApps;

                // console.log( 'externalApps' )
                // console.dir( externalApps )

                externalApps.forEach(function ( externalApp )
                {
                    if ( !Array.isArray( externalApp.externalApp ) ) externalApp.externalApp = [ externalApp.externalApp ];

                    var app = externalApp.externalApp;

                    // console.log( 'app' )
                    // console.dir( app )
                    
                    app.forEach(function ( this_app )
                    {
                        // console.log( 'this_app' )
                        // console.dir( this_app )

                        if ( this_app.accountCode == 'lexity') is_lexity_user = true;

                        if ( this_app.accountCode == 'weebly') is_weebly_user = true;

                        if ( this_app.accountCode == 'etsy') is_etsy_user = true;

                        if ( this_app.accountCode == 'shopify') is_shopify_user = true;

                        if ( this_app.accountCode == 'bigcommerce') is_bigcommerce_user = true;
                    });
                });
            }  

            if ( typeof callback == 'function') callback( data );
    };

    this.update_settings_window = function ()
    {
        module.getSettings(function ( resp )
        {
            settingsWindow();

            if ( resp.agencyNumberOfClients !== undefined ) $('.plan-usage .brand-usage .value').text( resp.agencyNumberOfActiveClients+ '/' +resp.agencyNumberOfClients );

            //settingsWindowNumbers( resp );
        });
    };
    
    this.getLicenseOptions = function ()
    {
        return licenseOptions;
    };

    this.is_etsy_user = function ()
    {
        return is_etsy_user;
    };

    this.is_weebly_user = function ()
    {
        return is_weebly_user;
    };

    this.is_lexity_user = function ()
    {
        return is_lexity_user;
    };

    this.is_shopify_user = function ()
    {
        return is_shopify_user;
    };

    this.is_bigcommerce_user= function ()
    {
        return is_bigcommerce_user;
    };

    this.getExternalApps = function ()
    {
        return externalApps;
    };

    this.checkLicenseView = function ( id, is_wix, mixpanel_type )
    {
        // if( licenseOptions.view != undefined && licenseOptions.view == '7D-Only' && id != '7D')
        if ( false ) // enable all timeframes
        {
            //$(window).trigger('upgrade-popup', mixpanel_type);
            showUpgradeWindow(is_wix);
            return FAIL;    
        } 
        else return SUCCESS;  
    };

    this.get_user_inbox_tags = function( callback )
    {
        var data = {
            action: 'getUserEvents',
            startTime: '0',
            endTime: '0',
            request_action: 'getUserTags',
            maxEvents: '1'
        };

        var request = {
            type: GET,
            url: 'feed/userEvents',
            data: data
        };

        EC.server.request( request, function ( response )
        {
            var obj = response;

            if ( obj.tags !== undefined && Array.isArray( obj.tags ) ) user_inbox_tags = obj.tags;

            if ( typeof callback == 'function') callback( obj );
        });     
    };

    this.inbox_tags = function ( )
    {
        return user_inbox_tags;  
    };

    this.update_inbox_tags = function( tags, callback )
    {
        tags = Array.isArray( tags ) ?tags:[];

        var request = {
                        type: POST,
                        url: 'user/events',
                        data:{ tags: tags }
                    };
        EC.server.request( request, function ( obj ){
            var data = obj || {};
            
            //If success, update tags array
            if ( data.returnCode == 'SUCCESS' )
                user_inbox_tags = tags;

            if ( typeof callback == 'function') callback( data );
        });



    };
    
    return this;

}];







},{}],7:[function(require,module,exports){


module.exports = [
                    '$http', 
                    '$state', 
                    '$rootScope', 
                    '$urlRouter', 
                    'EC', 
                    'apiUrl', 
                    'FacebookFeed',
                    'LinkedinFeed',
                    'TwitterFeed', 
                    'BloggerFeed', 
                    'GooglePlusFeed',
                    'YouTubeFeed',
                    'PinterestFeed',
                    'InstagramFeed',
                    '$injector', 
                    function(
                        $http, 
                        $state, 
                        $rootScope, 
                        $urlRouter, 
                        EC, 
                        apiUrl, 
                        FacebookFeed, 
                        LinkedinFeed,
                        TwitterFeed, 
                        BloggerFeed, 
                        GooglePlusFeed, 
                        YouTubeFeed, 
                        PinterestFeed, 
                        InstagramFeed, 
                        $injector )
{

    function Social( profile )
    {

        var self = this;

        this.initialized = false;
        
        this.profile = profile || {};

        // this.feeds = {};
        this.feeds_in_order = [];

        this.refresh_interval = 0;

        //Inbox filters
        this.user_inbox_filters = [];//get_user_inbox_filters();
        
        this.last_active_feed_selector = 0; 
        this.feed_selector_initial_trigger = true; 
    }

    Social.prototype.pages = function(){

        return this.pages;
    };

    Social.prototype.log = function(){

        console.dir( this );
    };

    Social.prototype.clear = function( container ){

        var $container = container || $('#social');

        $container.html('');
    };

    Social.prototype.render = function( )
    {
        
        //Assign it to global object 
        //window.globals.social = this; 

        var self = this,
            previous_feeds = [],
            new_streams_order = [],
            prev_feeds_in_order = self.feeds_in_order;

        $rootScope.social = self;
        
        self.feeds_in_order = [];

        //get new streams order
        angular.forEach( self.profile.streams, function( this_stream ){
            var id = ( ['rss', 'search', 'outreach'].indexOf( this_stream.streamId ) > -1 ) ? this_stream.id : this_stream.streamId;
            
            if( self.profile.id.indexOf('favorite') !== -1 )
            {
                id += '_' +  this_stream.profile.id + '_' + this_stream.network;
            }
            new_streams_order.push( id );
        });

        //console.log(new_streams_order);

        for ( var i = 0, l = self.profile.streams.length; i < l; i++ )
        {
            var this_stream = self.profile.streams[ i ],
                id = ( ['rss', 'search', 'outreach'].indexOf( this_stream.streamId ) > -1 ) ? this_stream.id : this_stream.streamId,
                network = self.profile.account.type.toLowerCase(),
                new_feed = undefined;

            if ( this_stream.value == 'true'  )
            {
                console.log('AAA::'+network);
                switch ( network )
                {

                    case 'facebook': 
                        console.log('FB test:::');
                        new_feed = new FacebookFeed( this_stream, this.profile );
                    break;

                    case 'linkedin':
                        new_feed = new LinkedinFeed( this_stream, this.profile );
                    break;

                    case 'twitter': 
                        new_feed = new TwitterFeed( this_stream, this.profile );
                    break;

                    case 'blogger': 
                        new_feed = new BloggerFeed( this_stream, this.profile );
                    break;

                    case 'googleplus': 
                        new_feed = new GooglePlusFeed( this_stream, this.profile );
                    break;

                    case 'youtube': 
                        new_feed = new YouTubeFeed( this_stream, this.profile );
                    break;

                    case 'pinterest': 
                        new_feed = new PinterestFeed( this_stream, this.profile );
                    break;

                    case 'instagram': 
                        new_feed = new InstagramFeed( this_stream, this.profile );
                    break;
                    
                }

                var getExistingState = $state.get(new_feed.page_id);

                if ( new_feed && $state.get(new_feed.page_id) === null )
                {

                    self.feeds_in_order.push( new_feed );

                    if ( typeof new_feed.render == 'function')
                    {
                        new_feed.render();
                        //var $new_feed = new_feed.render();
                        //$container.append( $new_feed );
                        
                    }
                }
                else if( new_feed )
                {
                    var index = _.findLastIndex(prev_feeds_in_order, {  page_id: new_feed.page_id});
                    
                    if( index >= 0 )
                    {
                        self.feeds_in_order.push(prev_feeds_in_order[index]);
                    }
                }
            }

        }

        var updated_streams_order = [];
        angular.forEach(self.feeds_in_order, function(this_feed){
            updated_streams_order.push(this_feed.page_id);
        });



        //Decide the feed page to show by default
        var feed_page_to_show = '';
        
        //to maintain last feed-selector position
        if( self.feed_selector_initial_trigger && self.last_active_feed_selector === 0 ) 
        {

            feed_page_to_show = updated_streams_order[self.last_active_feed_selector];
        }
        else if( self.last_active_feed_selector )
        {
            feed_page_to_show = updated_streams_order[self.last_active_feed_selector];

            self.last_active_feed_selector = 0;                                            
        }
        else if ( self.feed_selector_initial_trigger === false ) 
        {
            feed_page_to_show = updated_streams_order[updated_streams_order.length-1];

            self.feed_selector_initial_trigger = true;
        }
        
        //assign updated streams to current object
        self.updated_streams_order = updated_streams_order;


        function getObj(id)
        {
            var index = _.findLastIndex(self.feeds_in_order, {  page_id: id});
            return self.feeds_in_order[index];
        }

        /*console.log('updated_streams_order');
        console.log(updated_streams_order);
        console.log(feed_page_to_show);
        console.log(getObj(feed_page_to_show));*/
        var current_obj = {'name':'ram'};//getObj(feed_page_to_show);

        $state.go(feed_page_to_show, {obj:current_obj}, {cache: true});

        console.log('this.feeds_in_order');
        console.log(this.feeds_in_order);
        return this;       

    };

    

    


    


    return Social;
}];



},{}],8:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', function($http, $state, $rootScope, $localStorage, EC, apiUrl ){  

    var self = this;

    function FeedItem ( item_data, feed )
    {
        var self = this,
            feed_item = '';

        self.data = item_data;
        
        self.feed = feed;
        
        self.profile = feed.profile;

        self.element = '';
    }

    FeedItem.prototype.render = function ()
    {
        return this.element;
    };
    

    return FeedItem;

}];







},{}],9:[function(require,module,exports){
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







},{}],10:[function(require,module,exports){
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







},{}],11:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'TimelineFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, TimelineFeedItem ){  

    var self = this;

    function BloggerFeed ( stream, profile, options )
    {
        Feed.apply( this, [ stream, profile, options ]);
    }

    BloggerFeed.prototype = Object.create( Feed.prototype );

    BloggerFeed.prototype.constructor = BloggerFeed;

    BloggerFeed.prototype.get_data = function ( callback )
    {
        if ( !this.initialized ) 
        {
            switch ( this.id )
            {
                case 'bl_all': this.getBlogPosts();
                break;

                default: break;
            }
        }

        else
        {
            this.save_items();
        }
    };

    BloggerFeed.prototype.getBlogPosts = function ()
    {
        var self = this;

        var data = {
            action: 'getBloggerPosts',
            accountID: this.profile.account.id,
            profileID: this.profile.id
            //next: this.next
        };

        var request = {
            type: 'GET',
            url: 'feed/blogger',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            console.log('%c****************  getBloggerPosts','color: crimson');
            console.dir( obj );

            if ( obj.next !== undefined ) self.next = obj.next;

            if ( obj.returnCode === 'FAIL')
            {
                self.element.find('.feed-items')
                    .html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');

                //self.element.find('.feed-body').find('.more').remove();
                //self.element.find('.feed-body').iscrollview("refresh");
                return;
            }

            self.save_items( obj.data );

            self.initialized = true;
        });
    };

    BloggerFeed.prototype.more = function ()
    {
        var self = this;

        if ( this.next === undefined || !this.next ) {
            self.element.find('.more').remove();
            self.hide_pullup(); 
            return;    
        }

        var data = {
            action: 'getBloggerPosts',
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            next: this.next
        };

        var request = {
            type: 'GET',
            url: 'feed/blogger',
            data: data
        };
        
        load_more_flag = true;
        EC.request( request ).then( function ( response )
        {
            load_more_flag = false;

            var obj = response;

            console.log('%c****************  getBloggerPosts NEXT ','color: crimson');
            console.dir( obj );

            if ( obj.next !== undefined ) self.next = obj.next;

            else 
            {
                self.element.find('.more').remove();
                self.hide_pullup(); 
            }

            self.add_items( obj.data );
        });
    };

    BloggerFeed.prototype.save_items = function ( data )
    {
        this.items = []; // reset

        if ( data !== undefined )
        {
            for ( var i = 0, l = data.length; i < l; i++ )
            {
                var new_feed_item;

                var this_datum = this.format_item( data[ i ] );

                var pp = this_datum.profilePic?this_datum.profilePic:'';
                
                if( pp.indexOf('//') === 0 )
                    this_datum.profilePic = this_datum.profilePic.replace('//', 'https://');
                
                new_feed_item = new TimelineFeedItem( this_datum, this );

                this.items.push( new_feed_item );
            }
        }
        
        this.show_items();
    };

    BloggerFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length;

        if ( data !== undefined )
        {
            for ( var i = 0, l = data.length; i < l; i++ )
            {
                var new_feed_item;

                var this_datum = this.format_item( data[ i ] );

                new_feed_item = new TimelineFeedItem( this_datum, this );

                this.items.push( new_feed_item );
            }
        }

        this.append_items( add_after_index );
    };

    BloggerFeed.prototype.format_item = function ( data )
    {
        var this_datum = data;

        if ( _.isEmpty( data.name ) ) data.name = undefined;

        if( typeof data.message == 'string' )
        {
        this_datum.message = /*'<a class="rss-item-title" href="' +data.permalink+ '" target="_blank">' +data.name+ '</a>' + */
            data.message
            .replace(/<h\d/gi,'<div')
            .replace(/<\/h\d>/gi,'</div>')
            .replace(/class="\w*"/gi,'')
            .replace(/style=/gi, 'data-s=')
            .replace(/width=/gi, 'data-w=')
            .replace(/height=/gi, 'data-h=')
            .replace(/a href/gi, 'a target="_blank" href')
            .replace(/<br\s*[\/]?>/gi, '<span></span>');
        }
        else
        {
            this_datum.message = data.message;
        }

        return this_datum;  
    };

    return BloggerFeed;

}];







},{}],12:[function(require,module,exports){
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







},{}],13:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, $injector ){  

    var self = this;

    var FeedItem =  FeedItem || $injector.get('FeedItem');
    var TimelineFeedItem =  TimelineFeedItem || $injector.get('TimelineFeedItem');
    

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







},{}],14:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'TimelineFeedItem', 'DropdownFeedItem', 'CollapsibleFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, TimelineFeedItem, DropdownFeedItem, CollapsibleFeedItem ){  

    var self = this;

    function FacebookFeed ( stream, profile, options )
    {
        if ( profile.data.pageCategory !== 'User' && ['wallPosts','fb_notifications'].indexOf( stream.streamId ) !== -1 )
        {
            this.updateFeed = true;    
        }
        Feed.apply( this, [ stream, profile, options ]);
    }

    FacebookFeed.prototype = Object.create( Feed.prototype );

    FacebookFeed.prototype.constructor = FacebookFeed;

    /*FacebookFeed.prototype.updateFeedNotification = function ()
    {
        var self = this 
            ,currentID = self.updateIntervalID;

        var data = {
            action: 'getNewsFeed',
            accountID: self.profile.account.id,
            profileID: self.profile.id
        };

        var request = {
            type: 'POST',
            url: '/ajax.php',
            data: data
        };

        switch ( self.id )
        {
            case 'wallPosts': request.data.stream = 'wallPosts'; 
                              request.data.wall = true;
                              request.data.limit = 10;
            break;

            case 'fb_notifications': request.data.stream = 'notifications'; 
                              request.data.wall = false;
                              request.data.limit = 10;
            break;

            case 'inBox': request.data.stream = 'inBox';
                          request.data.action = 'getFbConversions';
                          // if ( self.profile.data.pageCategory === "User") request.data.next = "/inbox";
                          // else 
                          request.data.next = "/conversations";

            default: break;
        }

        EC.server.request( request, function ( response )
        {
            var data = JSON.parse( response );

            // console.log('%cupdateFeedNotification(' + self.id + ') response:', 'color:orangered');
            // console.dir( data );

            if ( currentID === self.updateIntervalID ) // didn't refresh during request
            {
                var firstID = '###';
                
                if ( self.firstItemID ) firstID = self.firstItemID;

                // console.log('firstID :: ' + firstID);

                var index = 0;

                var mincoming = []; // incoming messages array
                if ( self.id === 'inBox' && firstID !== '###' )
                {
                    var cuserId = self.profile.data.pageId;

                    if ( data.data != undefined )
                    {
                        for ( var i = 0, l = data.data.length; i < l; i++ )
                        { 
                            var comments = data.data[ i ].comments.comment;

                            if ( !Array.isArray( comments ) ) comments = [ comments ];

                            for ( var k = 0, ll = comments.length; k < ll; k++ )
                            {
                                var this_comment = comments[ k ];

                                if ( this_comment.fromId !== cuserId )
                                {
                                    mincoming.push({
                                        data: this_comment, 
                                        time: new Date( this_comment.createdTime.split('+')[ 0 ] ).getTime(),
                                        id: this_comment.messageId
                                    });
                                }
                            }    
                        }   
                    }

                    // console.dir( mincoming ); 

                    index = mincoming.map(function(item){return ( item.time > firstID ? 1 : 0 );}).reduce(function(a, b) { return a + b; }, 0);

                    // console.log( 'inBox index = ' + index ); 

                    if ( index ===  mincoming.length ) self.clearFeedNotification();
                }

                else
                {
                    if ( data.data != undefined )
                    {
                        index = data.data.map(function(item){return item.id;}).indexOf( firstID );
                    }

                    if ( index === -1 )
                    {
                        index = data.data.length;
                        self.clearFeedNotification();
                    }    
                }

                if ( firstID === '###' ) index = 0;

                // console.log('index :: ' + index);

                if ( index > 0 )
                {
                    var $header = self.element.find('.feed-header')
                        ,$fbody = self.element.find('.feed-body');

                    var $update_notif = $fbody.find('.update-notification'); 

                    if ( $update_notif.length === 0 )
                    {
                        $update_notif = $('<div class="update-notification"></div>');
                        $update_notif.on('click', function ( e ){ $header.find('.refresh-feed').trigger('click'); });
                        $fbody.find('.feed-item').first().before( $update_notif );
                    } 

                    if ( self.id === 'inBox' ) $update_notif.text('View ' + ( index === mincoming.length ? index + '+' : index ) + ' new Message' + ( index == 1 ? '' : 's' ) );

                    else if ( self.id === 'wallPosts' ) $update_notif.text('View ' + ( index === data.data.length ? index + '+' : index ) + ' new Post' + ( index == 1 ? '' : 's' ) );
                
                    else $update_notif.text('View ' + ( index === data.data.length ? index + '+' : index ) + ' new Notification' + ( index == 1 ? '' : 's' ) );    
                }
            }

            else console.error('!!! currentID !!!');
        });
    };*/  

    FacebookFeed.prototype.get_data = function ( callback )
    {
        // requests data and then calls this.save_items
        if ( !this.initialized ) 
        {
            switch ( this.id )
            {
                case 'newsFeed': this.getNewsFeed("newsFeed");
                break;

                case 'wallPosts': this.getNewsFeed("wallPosts");
                break;

                case 'pagesFeed': this.getNewsFeed("pagesFeed");
                break;

                case 'inBox': this.getFbConversions();
                break;

                case 'hidden_groups': this.fillFBHidden_Groups();
                break;

                case 'timeline': this.getNewsFeed("timeline");
                break;

                case 'search': this.getNewsFeed("search");
                break;

                case 'outreach': this.getNewsFeed("search");
                break;

                case 'fb_notifications': this.getNewsFeed("notifications");
                break;

                case 'fb_likes': this.getNewsFeed("fb_likes");
                break;

                default: break;
            }
        }

        else
        {
            this.save_items();
        }
    };

    FacebookFeed.prototype.more = function ()
    {
        if ( this.id == 'fb_likes' || this.id == 'outreach' || ( this.id == 'newsFeed' && !this.next ) )
        {
            //this.element.find('.more').remove(); 
            //this.hide_pullup();
            return;
        }

        var self = this,
            data = {
                action: 'doFbRequest',
                wall: true,
                stream: this.id,
                accountID: this.profile.account.id,
                profileID: this.profile.id,
                next: this.next
            };

        switch ( this.id )
        {
            case 'newsFeed':
                data.wall = false;
                break;

            case 'search':
                this.element.find('.more').remove(); 
                return;
                

            // case 'wallPosts':
            // break;

            // case 'pagesFeed':
            // break;

            // case 'inBox':
            //     if ( this.profile.data.pageCategory == "User") data.next = '/inbox';

            //     else data.next = '/conversations';
            // break;

            case 'hidden_groups':

                if ( self.options.favorite ) {

                    data = {
                        groupId: self.stream.selected,
                        accountID: self.profile.account.id,
                        profileID: self.profile.id,
                        action: 'getFBGroup',
                        stream: 'groupFeed',
                        next: self.next
                    };    
                }
  
            break;

            case 'fb_notifications':
                data.wall = false;
                data.stream = 'notifications';
                break;

            default: break;
        }

        var request = {
            type: 'GET',
            url: 'feed/fbMore',
            data: data
        };

        load_more_flag = true;
        EC.request( request ).then( function ( resp )
        {
            load_more_flag = false;
            var data = resp;

            if ( data.data !== undefined && data.data.length < 1 ) 
            {
                //self.element.find('.more').remove();
                //self.hide_pullup(); 
                self.load_more_flag = false;               
            }

            else
            {
                if ( data.paging !== undefined )
                {
                    if ( self.next == data.paging.next )
                    {
                        self.next = false;
                        //self.element.find('.more').remove();
                        //self.hide_pullup(); 
                        self.load_more_flag = false;
                    } 

                    else self.next = data.paging.next;

                    self.add_items( data.data );
                }
                
                else
                {
                    //self.element.find('.more').remove();
                    //self.hide_pullup(); 
                    self.load_more_flag = false;
                    self.add_items( data.data );
                }   
            } 
        });
    };

    FacebookFeed.prototype.getNewsFeed = function ( stream )
    {
        var self = this;

        var data = {
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            stream: stream,
            limit: 10
        };

        data.wall = false;

        if ( stream == 'wallPosts' || stream == 'fb_influences' || stream == 'timeline' ) data.wall = true;

        var request = {
            type: 'GET',
            url: 'feed/news',
            data: data
        };

        if ( stream == 'search' )
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
                    });
                }

                else
                {
                    self.save_items( [] );

                    self.initialized = true;    
                }
            }
        }

        else {
            
            //if( EC.queue_list[ Base64.encode( JSON.stringify( request ) ) ] !== undefined ) return;
            console.log(request);
            EC.request( request ).then( function ( response )
            {
                var obj = response;

                if ( obj.paging !== undefined ) self.next = obj.paging.next;

                if ( obj.code == 'FAIL')
                {
                    if ( stream == 'notifications' && obj.message.indexOf('you do not have sufficient permission') != -1 )
                    {
                        self.element.find('.feed-items')
                        .html('<div class="feed-item"><div class="feed-alert">' +
                            'Click "OK" to add Facebook Notification Feed.' + 
                            '<div class="refresh">OK</div>' +
                            '</div></div>');

                        self.element.on('click', '.refresh', function ( event )
                        {
                            var id = self.profile.account.id;

                            var type = self.profile.account.type.toLowerCase();

                            //console.log('refresh ', id )

                            // renew
                            openAddAccountPopup({
                                windowName: 'ConnectWithOAuth',
                                windowOptions: 'directories=0,location=0,status=0,menubar=0',
                                path: 'account/account?action=setExpiredKeyByID&id=' +id,
                                width: 600,
                                height: 650
                            });
                        });
                    }

                    else 
                    {
                        self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                        self.element.find('.feed-body').find('.more').remove();
                        //refresh iscroll
                        self.element.find('.feed-body').iscrollview("refresh");
                    }
                    

                    return;
                }

                self.save_items( obj.data );

                self.initialized = true;
            });
            
        }
            
        
    };

    FacebookFeed.prototype.getFbConversions = function ()
    {
        var self = this;

        var data = {
            action: 'getFbConversions',
            stream: 'inBox',
            accountID: this.profile.account.id,
            profileID: this.profile.id
        };

        if ( !this.next )
        {
            if ( this.profile.data.pageCategory == "User") data.next = "/inbox";

            else data.next = "/conversations";
        }

        else data.next = this.next;

        var request = {
            type: 'GET',
            url: 'feed/fbConversions',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            if ( obj.data !== undefined && obj.data.length < 1 )
            {
                self.element.find('.feed-items')
                    .html('<center class="center">Your inbox is empty.</center>');
                self.element.find('.feed-body').find('.more').remove();

                //refresh iscroll
                self.element.find('.feed-body').iscrollview("refresh");

                return;
            }

            if ( obj.paging !== undefined ) self.next = obj.paging.next;

            if ( obj.code == 'FAIL')
            {
                self.element.find('.feed-items')
                    .html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').find('.more').remove();
                self.element.find('.feed-body').iscrollview("refresh");
                return;
            }

            self.save_items( obj.data );

            self.initialized = true;
        });
    };

    FacebookFeed.prototype.fillFBHidden_Groups = function ()
    {   
        var self = this,
            i = 0,
            l = 0;

        var data = {
            action: 'getFBHidden_Groups',
            stream: 'groups',
            accountID: this.profile.account.id,
            profileID: this.profile.id
        };

        if ( !this.next ) data.next_posts = "";

        else data.next_posts = this.next;

        var request = {
            type: 'GET',
            url: 'feed/fbHiddenGroups',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            if ( obj.paging !== undefined ) self.next = obj.paging.next;

            if ( obj.code == 'FAIL')
            {
                self.element.find('.feed-items')
                    .html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                self.element.find('.feed-body').find('.more').remove();
                self.element.find('.feed-body').iscrollview("refresh");
                return;
            }

            if ( self.options.favorite ) 
            {
                var selected_id,
                    selected_name = '';
                //get first group if no selected
                if ( self.stream.selected == '_default_' )//$.isEmptyObject( self.stream.selected ) ) 
                {
                    selected_id = obj.data[ 0 ].id;
                    selected_name = obj.data[ 0 ].name;

                    self.stream.selected = obj.data[ 0 ].id;
                }

                else 
                {
                    selected_id = self.stream.selected;
                    for ( i = 0, l = obj.data.length; i < l; i++ )
                    {
                        if ( selected_id == obj.data[ i ].id ) 
                        {
                            selected_name = obj.data[ i ].name;
                            break;
                        }
                    }
                }

                self.element.find('.feed-type').text( 'Group: ' + selected_name );

                data = {
                    groupId: selected_id,
                    accountID: self.profile.account.id,
                    profileID: self.profile.id,
                    action: 'getFBGroup',
                    stream: 'groupFeed',
                    next: ''
                };

                var request = {
                    type: 'GET',
                    url: "feed/fbGroup",
                    data: data
                };

                EC.request( request ).then( function ( resp )
                {
                    var data = resp;

                    if ( data.data !== undefined )
                    {
                        var items = [];

                        if ( data.paging !== undefined ) self.next = data.paging.next;

                        if ( !Array.isArray( data.data ) ) items = [ data.data ];

                        else items = data.data;

                        self.save_items( items );
                    }

                    else 
                    {
                        self.element.find('.feed-items')
                        .html('<center class="center">This group\'s data is unavailable at this time, please try again in a few minutes.</center>');

                        self.element.find('.feed-body').find('.more').remove();

                        self.element.find('.feed-body').iscrollview("refresh");
                    }
                        

                    self.initialized = true; 

                });
            }

            else
            {
                for ( i = 0, l = obj.data.length; i < l; i++ )
                {
                    if ( self.stream.selected !== undefined && self.stream.selected.split(',').indexOf( obj.data[ i ].id ) != -1 ) obj.data[ i ].selected = true;

                    else obj.data[ i ].selected = false;
                }

                if ( self.stream.selected !== undefined && self.stream.selected.split(',').indexOf( '_default_' ) != -1 ) obj.data[ 0 ].selected = true;

                if ( obj.defaultGroupId !== undefined && obj.defaultGroupId[0] !== undefined && ! _.isEmpty( obj.defaultGroupId[0] ) )
                    self.default_element = obj.defaultGroupId[0]; 

                console.log('obj.data:::');   
                console.log(obj.data);
                self.save_items( obj.data );

                self.initialized = true;    
            } 
        });  
        
    };

    FacebookFeed.prototype.same_media_with_prev_item = function ( data )
    {
        var length = this.items.length;

        if ( length === 0 ) return false;

        var prev_item = this.items[ length - 1 ].data;

        if ( prev_item === undefined || prev_item.media === undefined || data.media === undefined ) return false;

        if ( prev_item.media.type == data.media.type && prev_item.media.href !== undefined && data.media.href !== undefined && prev_item.media.href == data.media.href ) 
        {

            //console.log('SAME MEDIA');
            //console.dir( prev_item );
            return true;
        }
    };

    FacebookFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length;

        // if ( this.id == 'hidden_groups') this.items.push( new DropdownFeedItem( data, this ) );
        
        if ( this.id == 'hidden_groups' && !this.options.favorite )
        {
            if ( this.items[ 0 ] !== undefined ) data = data.concat( this.items[ 0 ].data );
            
            this.items = [];

            this.items.push( new DropdownFeedItem( data, this ) );
        }

        else if ( data !== undefined )
        {
            for ( var i = 0, l = data.length; i < l; i++ )
            {
                var new_feed_item;

                if ( this.id == 'inBox') new_feed_item = new CollapsibleFeedItem( data[ i ], this );
                
                //else if ( this.id == 'hidden_groups') return;
                
                else
                {
                    if ( this.same_media_with_prev_item( data[ i ]) ) continue;

                    else new_feed_item = new TimelineFeedItem( data[ i ], this );
                } 

                this.items.push( new_feed_item );
            }
        }

        this.append_items( add_after_index );
    };

    FacebookFeed.prototype.save_items = function ( data )
    {
        this.items = []; // reset

        if ( this.id == 'hidden_groups' && !this.options.favorite )
        {
            this.dropdown_feed = true;
            this.dropdown_obj = new DropdownFeedItem( data, this );
            //this.items.push( new DropdownFeedItem( data, this ) );
        } 

        else if ( this.id == 'fb_likes' ) 
        {
            this.dropdown_feed = true;
            this.dropdown_obj = new DropdownFeedItem( data, this );
            //this.items.push( new DropdownFeedItem( data, this ) );
        }
        else if ( this.id == 'search_request' ) this.items.push( new SearchFeedItem( data, this ) );

        else if ( this.id == 'outreach' ) this.items.push( new SearchFeedItem( data, this ) );

        else if ( data !== undefined )
        {
            //--- for live update
            var mincoming = [], cuserId = this.profile.data.pageId;
            console.log('data::::::::::::');
            console.log(data);
            for ( var i = 0, l = data.length; i < l; i++ )
            {
                var new_feed_item;

                if ( this.id == 'inBox')
                {
                    new_feed_item = new CollapsibleFeedItem( data[ i ], this );

                    /*for ( var k = 0, ll = new_feed_item.data.comments.comment.length; k < ll; k++ )
                    {
                        var this_comment = new_feed_item.data.comments.comment[ k ];
                        if ( this_comment.fromId !== cuserId )
                        {
                            mincoming.push({
                                data: this_comment, 
                                time: new Date( this_comment.createdTime.split('+')[ 0 ] ).getTime(),
                                id: this_comment.messageId
                            });
                        }
                    }*/
                } 
                
                //else if ( this.id == 'hidden_groups') return;
                
                else 
                {
                    if ( this.same_media_with_prev_item( data[ i ]) ) continue;

                    else new_feed_item = new TimelineFeedItem( data[ i ], this );
                } 

                this.items.push( new_feed_item );
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
            if ( mincoming.length > 0 ) this.firstItemID = mincoming[ 0 ].time;

            else this.firstItemID = new Date().getTime();
        }

        this.show_items();
    };
    

    return FacebookFeed;

}];







},{}],15:[function(require,module,exports){
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







},{}],16:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'TimelineFeedItem', 'DropdownFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, TimelineFeedItem, DropdownFeedItem ){  

    var self = this;

    function GooglePlusFeed ( stream, profile, options )
    {
        if ( ['gp_activities','gp_pages_only','gp_pages'].indexOf( stream.streamId ) !== -1 )
        {
            this.updateFeed = true;    
        }
        Feed.apply( this, [ stream, profile, options ]);
    }

    GooglePlusFeed.prototype = Object.create( Feed.prototype );

    GooglePlusFeed.prototype.constructor = GooglePlusFeed;

    GooglePlusFeed.prototype.updateFeedNotification = function ()
    {
        var self = this,
            id_key = 'id', 
            currentID = self.updateIntervalID;

        var data = {
            action: 'getGPStream',
            accountID: self.profile.account.id,
            profileID: self.profile.id
        };

        var request = {
            type: 'GET',
            url: 'feed/googlePlusStream',
            data: data
        };

        switch ( self.id )
        {
            case 'gp_activities':   request.data.stream = 'gp_activities'; break;

            case 'gp_pages_only':   request.data.stream = 'gp_page_only_stream';
                                    request.data.accountID = self.default_element_metric.accountID; 
                                    request.data.profileID = self.default_element_metric.profileID; 
                                    id_key = 'postID'; break;

            case 'gp_pages':        request.data.stream = 'gp_page_stream';      
                                    request.data.accountID = self.default_element_metric.accountID; 
                                    request.data.profileID = self.default_element_metric.profileID; 
                                    id_key = 'postID';   
                                    break;      

            default: break;
        }

        EC.server.request( request, function ( response )
        {
            var data = response;//JSON.parse( response );

            // console.log('%cupdateFeedNotification(' + self.id + ') response:', 'color:orangered');
            // console.dir( data );

            if ( currentID === self.updateIntervalID ) // don't refresh during request
            {
                var firstID = '###';
                
                if ( self.firstItemID ) firstID = self.firstItemID;

                // console.log('firstID :: ' + firstID);

                var index = 0;

                if ( data.data && data.data.length > 0 )
                {
                    index = data.data.map(function(item){return item[ id_key ];}).indexOf( firstID );
                }

                if ( index === -1 )
                {
                    index = data.data.length;
                    self.clearFeedNotification();
                }

                if ( firstID === '###' ) index = 0;

                // console.log('index :: ' + index);

                if ( index > 0 )
                {
                    var $header = self.element.find('.feed-header'),
                        $fbody = self.element.find('.feed-body');

                    var $update_notif = $fbody.find('.update-notification'); 

                    if ( $update_notif.length === 0 )
                    {
                        $update_notif = $('<div class="update-notification"></div>');
                        $update_notif.on('click', function ( e ){ $header.find('.refresh-feed').trigger('click'); });
                        $fbody.find('.feed-item').first().before( $update_notif );
                    }

                    $update_notif.text('View ' + ( index === data.data.length ? index + '+' : index ) + ' new Post' + ( index === 1 ? '' : 's' ) );    
                }
            }

            else console.error('!!! currentID !!!');
        });
    };

    GooglePlusFeed.prototype.get_data = function ( callback )
    {
        if ( !this.initialized ) 
        {
            switch ( this.id )
            {
                case 'gp_activities': this.getGooglePlusStream("gp_activities");
                break;

                case 'gp_pages': this.getPages();
                break;

                /*case 'gp_peopleConnected': this.getGooglePlusStream("gp_peopleConnected");
                break;

                case 'gp_peopleVisible': this.getGooglePlusStream("gp_peopleVisible");
                break;*/

                case 'gp_pages_only': this.getPages( true );
                break;

                default: break;
            }
        }

        else
        {
            this.save_items();
        }
    };

    GooglePlusFeed.prototype.getPages = function ( only_page )
    {
        var data = [];

        if ( this.profile.data.objectType === 'page' )
        {
            var self = this;

            var req_data = {
                action: 'getGPStream',
                accountID: self.profile.account.id,
                profileID: self.profile.id,
                stream: 'gp_page_only_stream'
            };

            var request = {
                type: 'GET',
                url: 'feed/googlePlusStream',
                data: req_data
            };

            if ( self.id === 'gp_pages' ) request.data.stream = 'gp_page_stream';
            
            EC.request( request ).then( function ( response )
            {
                var obj = response;//JSON.parse( response );

                // console.log('****************  G+ '+stream);
                // console.dir( obj );

                if ( obj.next !== undefined ) self.next = obj.next;

                if ( obj.returnCode == 'FAIL')
                {
                    self.element.find('.feed-body')
                        .html('<center>Data is momentarily unavailable, please try again in a few minutes.</center>')
                        .find('.more').remove();
                    //self.element.find('.feed-body').iscrollview("refresh");

                    return;
                }

                self.save_items( obj.data );

                self.initialized = true;
            });
        }

        else
        {
            this.profile.account.profiles.forEach( function( profile )
            {
                if ( profile.data.objectType && profile.data.objectType === 'page' && profile.monitored === 'on' )
                {
                    data.push({
                        id: profile.data.page_id,
                        name: profile.username,
                        accountID: profile.account.id,
                        profileID: profile.id,
                        only_page: only_page
                    });   
                }
            }); 

            if ( this.profile.data.defaultGroupId !== undefined && !_.isEmpty( this.profile.data.defaultGroupId ) )
            {
                if ( this.profile.data.defaultGroupId.indexOf('{') === -1 ) this.default_element = this.profile.data.defaultGroupId;

                else
                {
                    var default_groups = JSON.parse( this.profile.data.defaultGroupId );

                    if ( default_groups[ this.id ] !== undefined ) this.default_element = default_groups[ this.id ];
                }
            }

            this.save_items( data );    
        }
           
    };

    GooglePlusFeed.prototype.getGooglePlusStream = function ( stream )
    {
        var self = this;

        var data = {
            action: 'getGPStream',
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            stream: stream
        };

        var request = {
            type: 'GET',
            url: 'feed/googlePlusStream',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;//JSON.parse( response );

            //console.log('****************  G+ '+stream);
            //console.dir( obj );

            if ( obj.next !== undefined ) self.next = obj.next;

            if ( obj.returnCode == 'FAIL')
            {
                self.element.find('.feed-body')
                    .html('<center>Data is momentarily unavailable, please try again in a few minutes.</center>')
                    .find('.more').remove();
                //self.element.find('.feed-body').iscrollview("refresh");

                return;
            }

            self.save_items( obj.data );

            self.initialized = true;
        });
    };

    GooglePlusFeed.prototype.more = function ()
    {
        var self = this;

        if ( this.next  === undefined || !this.next ) {
            self.element.find('.more').remove();
            return;    
        }

        var data = {
            action: 'getGPStream',
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            stream: this.id,
            next: this.next 
        };

        var request = {
            type: 'GET',
            url: 'feed/googlePlusStream',
            data: data
        };

        if ( self.id === 'gp_pages' ) request.data.stream = 'gp_page_stream';

        else if ( self.id === 'gp_pages_only' ) request.data.stream = 'gp_page_only_stream';
        
        EC.request( request ).then( function ( resp )
        {
            var data = resp;//JSON.parse( resp );

            if ( data.next !== undefined )
                self.next = data.next;
            else {
                self.element.find('.more').remove();
                self.hide_pullup();
            }

            self.add_items( data.data );
        });
    };

    GooglePlusFeed.prototype.save_items = function ( data )
    {
        this.items = []; // reset

        if ( data !== undefined )
        {
            if ( ( this.id == 'gp_pages' || this.id == 'gp_pages_only' ) && this.profile.data.objectType !== 'page' )
            {
                this.dropdown_feed = true;
                this.dropdown_obj = new DropdownFeedItem( data, this );
                //this.items.push( new DropdownFeedItem( data, this ) );
            }

            else
            {
                for ( var i = 0, l = data.length; i < l; i++ )
                {
                    var new_feed_item, this_datum;

                    if ( this.id === 'gp_activities' ) this_datum = this.format_item_old( data[ i ] );

                    else this_datum = this.format_item( data[ i ] );

                    new_feed_item = new TimelineFeedItem( this_datum, this );

                    this.items.push( new_feed_item );
                }
            }
        }
        
        this.show_items();
    };

    GooglePlusFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length;

        if ( data !== undefined )
        {
            for ( var i = 0, l = data.length; i < l; i++ )
            {
                var new_feed_item, this_datum;

                if ( this.id === 'gp_activities' ) this_datum = this.format_item_old( data[ i ] );

                else this_datum = this.format_item( data[ i ] );

                new_feed_item = new TimelineFeedItem( this_datum, this );

                this.items.push( new_feed_item );
            }
        }

        this.append_items( add_after_index );
    };

    GooglePlusFeed.prototype.format_item = function ( data )
    {
        var this_datum = data;

        this_datum.fromId = data.user.fromId;
        this_datum.fromName = data.user.fromName;
        this_datum.profileLink = data.user.profileLink;
        this_datum.profilePic = data.user.profilePic;

        this_datum.updateTime = new Date( this_datum.updateTime ).getTime() / 1000;

        delete this_datum.user;

        // take 1 attachment for now
        if ( data.attachments !== undefined && ! _.isEmpty( data.attachments) )
        {
            if ( Array.isArray(data.attachments.attachment) ) this_datum.media = data.attachments.attachment[ 0 ];

            else this_datum.media = data.attachments.attachment;

            if ( this_datum.media.content )
            {
                if ( (/\w{8}(-\w{4}){3}-\w{12}/i).test(this_datum.media.content) ) this_datum.media.content = '';   
            }

            if ( this_datum.media.type == 'photo' )
            {
                if ( this_datum.media.fullImage !== undefined ) this_datum.media.src = this_datum.media.fullImage.url;

                else if ( this_datum.media.image !== undefined ) this_datum.media.src = this_datum.media.image.url;

                else delete this_datum.media;
            }

            else if ( this_datum.media.type == 'video' && this_datum.media.image !== undefined )
            {
                this_datum.media.src = this_datum.media.image.url;

                if ( this_datum.media.embed !== undefined )
                    this_datum.media.video = { 
                        source_url: this_datum.media.embed.url,
                        display_url: this_datum.media.embed.url 
                    };

                else this_datum.media.video = { 
                        source_url: this_datum.media.url,
                        display_url: this_datum.media.url 
                    }; 
            }
        }

        return this_datum;
    };

    GooglePlusFeed.prototype.format_item_old = function ( data )
    {
        var this_datum = {
            fromId: data.user.id,
            fromName: data.user.full_name,
            profilePic: data.user.profile_picture,
            profileLink: data.user.profile_link,
            selfLink: data.selfLink,
            updateTime: ( new Date( data.created_time ).getTime() / 1000 ),
            message: data.title,

            //activityType: data.activityType || '',
            resharers: data.resharers,
            likes: data.likes, //plusoners
            comments: data.comments,
                    
            //media: data.attachments,
                    
            postID: data.id, //???
            raw_data: data
        };

        if ( this_datum.comments.comment !== undefined && !Array.isArray( this_datum.comments.comment )) 
            this_datum.comments.comment = [ this_datum.comments.comment ];

        if ( this_datum.likes.like !== undefined && !Array.isArray( this_datum.likes.like )) 
            this_datum.likes.like = [ this_datum.likes.like ];

        // take 1 attachment for now
        if ( data.attachments !== undefined )
        {
            if ( Array.isArray(data.attachments.attachment) ) this_datum.media = data.attachments.attachment[ 0 ];

            else this_datum.media = data.attachments.attachment;

            if ( this_datum.media.type == 'photo' && this_datum.media.fullImage !== undefined ) this_datum.media.src = this_datum.media.fullImage.url;

            else if ( this_datum.media.type == 'video' && this_datum.media.image !== undefined )
            {
                this_datum.media.src = this_datum.media.image.url;

                if ( this_datum.media.embed !== undefined )
                    this_datum.media.video = { 
                        source_url: this_datum.media.embed.url,
                        display_url: this_datum.media.embed.url 
                    };

                else this_datum.media.video = { 
                        source_url: this_datum.media.url,
                        display_url: this_datum.media.url 
                    }; 
            }
        }

        return this_datum;   
    };

    return GooglePlusFeed;

}];







},{}],17:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'TimelineFeedItem', 'InstagramFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, TimelineFeedItem, InstagramFeedItem ){  

    var self = this;

    function InstagramFeed ( stream, profile, options )
    {
       Feed.apply( this, [ stream, profile, options ]);
    }

    InstagramFeed.prototype = Object.create( Feed.prototype );

    InstagramFeed.prototype.constructor = InstagramFeed;

    InstagramFeed.prototype.get_data = function ( callback )
   {
       // requests data and then calls this.save_items
       if ( this.value == 'true' && !this.initialized )
       {
           switch ( this.id )
           {
               // In case we are dealing with user feed 
               case 'ig_feed': this.getInstagramFeed("userFeed");
               break;

               // In case we are dealing with my media feed
               // case 'igMyMedia': this.getInstagramFeed("igMyMedia");
               case 'igMyMedia': this.getInstagramFeed("myMedia");
               break;

               default: break;
           }
       }
       else if ( this.value == 'true')
       {
           this.save_items();
       }
    };

    InstagramFeed.prototype.getInstagramFeed = function ( stream )
    {
       var self = this;

       var data = {
           //action: 'getNewsFeed',
           accountID: this.profile.account.id,
           profileID: this.profile.id,
           stream: stream,
           next: '' // ID of last element that was loaded
       };

       data.wall = false;
       if(this.next > 0)
       {
            data.next = this.next;
       }

       var method = '';
       // if (stream == 'igMyMedia') 
       if (stream == 'myMedia') 
       {
            data.action = "getInMyMedia"; // Action for myMedia
            method = 'myMedia';
       }
       else
       {
           data.action = "getInFeed"; // Action for user feed / home feed
           method = 'feed';
       }

       var request = {
           type: 'GET',
           url: 'feed/instagram/'+method,
           data: data
       };

       EC.request( request ).then( function ( response )
       {
           var obj = response;

           if ( obj.pagination !== undefined ) self.next = obj.pagination.next_max_id;

           self.save_items( obj.data );

           self.initialized = true;
       });
    };

    InstagramFeed.prototype.more = function ()
    {
        var self = this,
            data = {
                //action: 'doFbRequest',
                //wall: true,
                action: this.id,
                accountID: this.profile.account.id,
                profileID: this.profile.id,
                next: this.next
            };

        //data.wall = false;
        var method = '';
        if (this.id == 'ig_feed') 
        {
            data.stream = "userFeed";
            data.action = "getInFeed"; // Action for user feed / home feed
            method = 'feed';
        } 
        else
        {
            data.stream = "myMedia";
            data.action = "getInMyMedia"; // Action for myMedia
            method = 'myMedia';
        }        

        // console.log("id="+this.id+" stream="+data.stream+" next="+this.next+" action="+data.action);

        var request = {
            type: 'GET',
            url: 'feed/instagram/'+method,
            data: data
        };

        
        load_more_flag = true;

        //$.mobile.activePage.children("[data-role='footer']").toolbar({ tapToggle: false });
        //$.mobile.activePage.children("[data-role='footer']").fadeOut(300);

        EC.request( request ).then( function ( resp )
        {
            load_more_flag = false;
            //$.mobile.activePage.children("[data-role='footer']").toolbar({ tapToggle: true });
            //$.mobile.activePage.children("[data-role='footer']").fadeIn(300);

            var data = resp;

            if ( data !== undefined && data.data !== undefined && data.data.length < 1 )
            {
                self.element.find('.more').remove();
                //self.hide_pullup(); 
            }

            else
            {
                self.next = data.pagination ? data.pagination.next_max_id : '';

                self.add_items( data.data );
            }
        });
    };

    InstagramFeed.prototype.save_items = function ( data )
    {
       this.items = []; // reset

       if ( data !== undefined ) for ( var i = 0, l = data.length; i < l; i++ )
       {
           var new_feed_item;
            /*
                       if ( this.id == 'userFeed') {new_feed_item = new CollapsibleFeedItem( data[ i ], this );}          
                       // stream = myMedia
                       else new_feed_item = new TimelineFeedItem( data[ i ], this );
            */
           new_feed_item = new InstagramFeedItem( data[ i ], this );

           this.items.push( new_feed_item );
       }

       this.show_items();
    };

    InstagramFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length;

        if ( data ) for ( var i = 0, l = data.length; i < l; i++ )
        {
            var new_feed_item;

            new_feed_item = new InstagramFeedItem( data[ i ], this );

            this.items.push( new_feed_item );
        }

        this.append_items( add_after_index );
    };

    return InstagramFeed;

}];







},{}],18:[function(require,module,exports){
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







},{}],19:[function(require,module,exports){
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







},{}],20:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', '$injector', function($http, $state, $rootScope, $localStorage, EC, apiUrl, $injector ){  

    var self = this;

    var FeedItem =  FeedItem || $injector.get('FeedItem');
    var TimelineFeedItem =  TimelineFeedItem || $injector.get('TimelineFeedItem');

    function LinkedinFeedItem ( item_data, feed )
    {
        FeedItem.apply( this, [ item_data, feed ]);
    }

    LinkedinFeedItem.prototype = Object.create( FeedItem.prototype );
    
    LinkedinFeedItem.prototype.constructor = LinkedinFeedItem;
    
    LinkedinFeedItem.prototype.show_comments = TimelineFeedItem.prototype.show_comments;

    LinkedinFeedItem.prototype.renderComment = TimelineFeedItem.prototype.renderComment;

    LinkedinFeedItem.prototype.show_likes = TimelineFeedItem.prototype.show_likes;

    LinkedinFeedItem.prototype.add_comment = function ( message, direct, share )
    {

    };
    
    return LinkedinFeedItem;

}];







},{}],21:[function(require,module,exports){
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







},{}],22:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'FeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, FeedItem ){  

    var self = this;

    function TimelineFeedItem ( item_data, feed )
    {
        FeedItem.apply( this, [ item_data, feed ]);

        if ( this.data.likes === undefined ) this.data.likes = {count: 0};

        if ( this.data.raw_data !== undefined ) this.data.conversation = this.data.raw_data.conversation;

        if ( this.data.conversation !== undefined && !Array.isArray( this.data.conversation.tweets ) ) this.data.conversation.tweets = [ this.data.conversation.tweets ];

        if ( this.data.media_content === undefined ) this.data.media_content = '';
    }

    TimelineFeedItem.prototype = Object.create( FeedItem.prototype );
    
    TimelineFeedItem.prototype.constructor = TimelineFeedItem;

    TimelineFeedItem.prototype.getName = function()
    {
        var self = this;

        return self.data.fromName;
    };

    TimelineFeedItem.prototype.getTime = function()
    {
        var self = this,
            timestamp = parseInt( this.data.updateTime ),
            time = '';

        var new_date = new Date( timestamp * 1000 ),
            date = new_date;//.format('mmm dd, yyyy, h:MMtt');

        if ( !isNaN( this.data.updateTime ) )
        {
            if ( this.data.eventType == 'TWFollowers' ) 
            {
                time = '@' +this.data.username;                
            }

            else time = date;
        }
        else 
        {
            if ( this.feed.network !== 'facebook' || ( this.feed.id != 'search' && this.feed.id !== 'outreach' ) || ( this.feed.options.parameters !== undefined && this.feed.options.parameters.type === undefined ) ) 
            {
                time = '@' +this.data.username;
            }
            else if ( this.feed.options.parameters.type == 'page' || this.feed.options.parameters.type == 'place' ) 
            {
                time = this.data.category;
            }
        }

        return time;
    }; 
    

    return TimelineFeedItem;

}];







},{}],23:[function(require,module,exports){
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







},{}],24:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$http', '$state', '$rootScope', '$localStorage', 'EC', 'apiUrl', 'Feed', 'TimelineFeedItem', 'DropdownFeedItem', function($http, $state, $rootScope, $localStorage, EC, apiUrl, Feed, TimelineFeedItem, DropdownFeedItem ){  

    var self = this;

    function YouTubeFeed ( stream, profile, options )
    {
        Feed.apply( this, [ stream, profile, options ]);
    }

    YouTubeFeed.prototype = Object.create( Feed.prototype );

    YouTubeFeed.prototype.constructor = YouTubeFeed;

    YouTubeFeed.prototype.get_data = function ( callback )
    {
        // requests data and then calls this.save_items
        if ( !this.initialized ) 
        {
            switch ( this.id )
            {
                case 'yt_myChannelHome': this.getYouTubeFeed("yt_myChannelHome","");
                break;

                case 'yt_myChannelVideos': this.getYouTubeFeed("yt_myChannelVideos");
                break;

                case 'yt_mySubscription': this.getYouTubeFeed("yt_mySubscription");
                break;

                default: break;
            }
        }

        else
        {
            this.save_items();
        }
    };

    YouTubeFeed.prototype.more = function ()
    {
        var self = this;

        if ( this.next === undefined || !this.next ) {
            //self.element.find('.more')[0].remove();
            //self.hide_pullup(); 
            return;    
        }

        var data = {
            action: 'getYouTubeFeed',
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            stream: this.id,
            nextToken: this.next 
        };

        var request = {
            type: 'GET',
            url: 'feed/youTube',
            data: data
        };
        
        load_more_flag = true;
        EC.request( request ).then( function ( resp )
        {
            load_more_flag = false;

            var data = resp;

            if ( data.data.nextToken !== undefined )
                self.next = data.data.nextToken;
            else {
                //self.element.find('.more').remove();
                //self.hide_pullup(); 
            }

            self.add_items( data.data );
            
        });

    };

    YouTubeFeed.prototype.getYouTubeFeed = function ( stream )
    {
        var self = this;

        var data = {
            action: 'getYouTubeFeed',
            accountID: this.profile.account.id,
            profileID: this.profile.id,
            stream: stream
        };

        if ( self.id == 'yt_mySubscription' ) data.channel_id = /*'UC' + */this.profile.data.userId.replace('channel==','');

        var request = {
            type: 'GET',
            url: 'feed/youTube',
            data: data
        };

        EC.request( request ).then( function ( response )
        {
            var obj = response;

            if ( obj.data !== undefined && obj.data.nextToken !== undefined ) self.next = obj.data.nextToken;

            //temporary
            if ( self.id === 'yt_mySubscription' )
            {
                self.next = undefined;

                if ( obj.defaultChannelId !== undefined ) self.default_element = obj.defaultChannelId; 
            } 

            if ( obj.code == 'FAIL')
            {
                self.element.find('.feed-items')
                    .html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                //self.element.find('.feed-body').find('.more').remove();
                //self.element.find('.feed-body').iscrollview("refresh");
                return;
            }

            self.save_items( obj.data );

            self.initialized = true;
        });
    };

    YouTubeFeed.prototype.save_items = function ( data )
    {
        this.items = []; // reset

        if ( this.id == 'yt_mySubscription' )
        {
            this.dropdown_feed = true;
            this.dropdown_obj = new DropdownFeedItem( data, this );
            //this.items.push( new DropdownFeedItem( data.items, this ) );
        }

        else
        {
            if ( data !== undefined && data.items !== undefined )
            {
                for ( var i = 0, l = data.items.length; i < l; i++ )
                {
                    var new_feed_item;

                    var this_datum = this.format_item( data.items[ i ] );

                    new_feed_item = new TimelineFeedItem( this_datum, this );

                    this.items.push( new_feed_item );
                }
            }   
        }
        
        this.show_items();
    };

    YouTubeFeed.prototype.add_items = function ( data )
    {
        var add_after_index = this.items.length;

        if ( data.items !== undefined )
        {
            for ( var i = 0, l = data.items.length; i < l; i++ )
            {
                var new_feed_item;

                var this_datum = this.format_item( data.items[ i ] );

                new_feed_item = new TimelineFeedItem( this_datum, this );

                this.items.push( new_feed_item );
            }
        }

        this.append_items( add_after_index );
    };

    YouTubeFeed.prototype.format_item = function( data ) {

        var media = data.media;

        if ( media.type == "video" ) {
            media.video = {
                display_url: 'http://www.youtube.com/embed/' + media.id + '?autoplay=1',
                source_url: 'http://www.youtube.com/embed/' + media.id + '?autoplay=1'
            };
        }

        var this_datum = {
            fromId: data.fromId,
            fromName: data.fromName,
            profilePic: data.profilePic,
            profileLink: data.profileLink,
            updateTime: ( new Date( data.updateTime ).getTime() / 1000 ),
            message: data.message,

            //metaInfo: ( data.items[ i ].channelId!=undefined && data.items[ i ].channelTitle!=undefined),
            channelId: data.channelId,
            channelLink: 'https://www.youtube.com/channel/' + data.channelId,
            channelTitle: data.channelTitle,
            activityType: data.activityType || '',

            likes: data.likes,
            views: data.views,
            comments: data.comments,

            //user: data[ i ].user,
            //name: data.items[ i ].title,
                    
            media: media,
                    
            postID: data.fromId, //???
            raw_data: data
        };

        if ( data.message.indexOf('uploaded a video') != -1 ) this_datum.message = '';

        return this_datum;
    };

    return YouTubeFeed;

}];







},{}],25:[function(require,module,exports){
module.exports = angular.module('ionicApp.constants',[])  
  .constant('apiUrl', 'https://eclincher.com/service/')
  .constant('AUTH_EVENTS', {  notAuthenticated: 'auth-not-authenticated' });
},{}],26:[function(require,module,exports){
module.exports = angular.module('ionicApp.controllers', [])

.controller('LoginCtrl', function($scope, $state, $ionicLoading, AuthService) {

    $scope.data = {};
    $scope.login = function(data) {
        //$state.go('tabs.home');

        $ionicLoading.show({
            noBackdrop: true
        });


        var a = AuthService.login($scope.data.username, $scope.data.password, function(resp) {
            console.log('ZZZ:' + resp);
            $ionicLoading.hide();
            $state.go('tabs.home');
        });

    };

})


.controller('HomeTabCtrl', function($state, $scope, $rootScope, EC, $ionicPopup, $ionicActionSheet, $ionicModal, $ionicLoading, accountManager, $urlRouter, _) {


    console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA!!!!!#####');
    
    if( $rootScope.social !== undefined )
        console.log($rootScope.social.feeds_in_order);

    $scope.$on("$ionicView.enter", function() {
        $scope.$parent.updateSideMenu(EC.getSideMenu('home'));
    });
    

    $scope.groups = [];
    $scope.acc_types = [];

    if( accountManager.is_rendered( ) )
    {
        console.log('oooooooooooo');
        prepareAccounts();
    }
    else
    {
        console.log('nnnnnnnnnnnn');
        $ionicLoading.show({noBackdrop: true});
        accountManager.init(function() {
            $ionicLoading.hide();
            prepareAccounts();
        });
    }
    


    function prepareAccounts()
    {
        var ACCS = accountManager.list_accounts();

        var temp = [],
            acc_types = [];

        ACCS.forEach(function(account, index) {
            var type = account.type.toLowerCase();

            if (temp[type] === undefined) {
                temp[type] = [];
                temp[type].profiles = [];
            }
            //else
            //{
            for (var i = 0; i < account.profiles.length; i++) {
                if (account.profiles[i].monitored == 'off') continue;

                temp[type].profiles.push(account.profiles[i]);
            }
            //}

            temp[type].type = type;
            if (acc_types.indexOf(type) === -1) acc_types.push(type);

            //temp[type].push( {'type':type, 'profiles':account.profiles} );


        });
        console.log(temp);
        $scope.groups = temp;
        $scope.acc_types = acc_types;

        accountManager.set_rendered( true );

        $scope.openFeeds = function( profile )
        {
            console.log(profile);
            profile.social.render();
        };
    }


    $scope.gns = function() {

        var getExistingState = $state.get('tabs.ram-new');

          if(getExistingState !== null){
            return; 
          }

          var state = {
              "url": '/ram-new',
              "views": {
                'home-tab': {
                  templateUrl: "templates/ram.html"
                }
              }
            };

          $stateProviderRef.state('tabs.ram-new', state);

          $urlRouter.sync();
          $urlRouter.listen();

          $state.go('tabs.ram-new');
          console.log(getExistingState);
          

    };

})

.controller('ManageAccounts', function($scope, $state, EC, $rootScope, $ionicHistory, $ionicPopup, $ionicActionSheet, $ionicModal, $ionicLoading, accountManager, $localStorage) {

    console.log('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
    console.log('$localStorage.all_settings');
    console.log($localStorage.all_settings);
    //console.log(accountManager.test());
    
    $scope.$parent.updateSideMenu(EC.getSideMenu('home'));

    $scope.accounts = accountManager.accounts();

    console.log( $scope.accounts );

    $scope.$on('$ionicView.beforeEnter', function(event, viewData) {
        viewData.enableBack = true;
        viewData.hasHeaderBar = true;
        console.log(viewData);
    });

    var bv = $ionicHistory.backView();

    $scope.$ionicGoBack = function() {
        console.log('KKKKK');
        console.log(bv);

        if (bv) {
            $ionicHistory.goBack();
        } else {
            $state.go('tabs.home');
        }

    };

    $scope.add_account = function(type) {
        accountManager.add_account(type);
    };

    $scope.cst = function()
    {
        console.log($scope.accounts);
        console.log(accountManager.accounts());
        //accountManager.set_rendered( false );
    };



})

.controller('Feeds', function($scope,  $ionicScrollDelegate, $state, $rootScope, $stateParams, EC, $ionicHistory, $ionicPopup, $ionicActionSheet, $ionicModal, $ionicLoading, accountManager, $localStorage) {

    console.log('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC!!!!!#####');
    //console.log('$localStorage.all_settings');
    //console.log($rootScope.social.feeds_in_order);
    //console.log($state.current.name);
   
    
    
    $scope.moreDataCanBeLoaded = false;
    $scope.counter = 0;

    var index = _.findLastIndex($rootScope.social.feeds_in_order, {  page_id: $state.current.name});
    $scope.feed = $rootScope.social.feeds_in_order[index];
    
    console.log($scope.feed);
    var next_page_index = 0,
        prev_page_index = 0,
        no_of_pages = $scope.feed.profile.social.updated_streams_order.length;//$rootScope.social.feeds_in_order.length;

    if( index === 0 )
    {
        next_page_index = index + 1;
        prev_page_index = no_of_pages - 1;
    }
    else if( index == (no_of_pages - 1) )
    {
        next_page_index = 0;
        prev_page_index = no_of_pages - 2;
    }
    else
    {
        next_page_index = index + 1;
        prev_page_index = index - 1;
    }

    $scope.next_page_id = $scope.feed.profile.social.updated_streams_order[next_page_index];//$rootScope.social.feeds_in_order[next_page_index].page_id;
    $scope.prev_page_id = $scope.feed.profile.social.updated_streams_order[prev_page_index];//$rootScope.social.feeds_in_order[prev_page_index].page_id;

    console.log(index);
    console.log($scope.feed);
    
    $scope.test_name = [];
    $scope.test_name.push({'name':'Ram'});
    $scope.getScrollPosition = function() {       
    
        
    };
    
    $scope.feed.dd = { 'count':0, 'data':[], 'placeholder': ''};
    $scope.selected_dd = {};

    $scope.$watch('feed.dropdown_feed', function() {

        if( $scope.feed.dropdown_feed )
        {
            console.log('MMMMMMMMMMMMMMMMM');
            console.log($scope.feed.dropdown_obj);
            $scope.feed.dd = $scope.feed.dropdown_obj.get_dropdown();

            if( !$scope.feed.dd.data.length )
            {
                $scope.$broadcast('scroll.infiniteScrollComplete');
                $scope.moredata = true;
            }
            else
            {
                $scope.selected_dd = $scope.feed.dd.data[0];
                $scope.loadMore();
            }           
            
        }

    });

    $scope.$watchCollection('feed.items', function() {
        
        if( $scope.feed.items.length )
        {
            console.log('JJJJJJJJJJJJJJJJJJJJJJJJJJ');
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }

    });

    $scope.$watch('feed.load_more_flag', function() {
        
        if( !$scope.feed.load_more_flag )
        {
            $scope.moredata = true;
        }

    });

    
    $scope.moredata = false;

    $scope.loadMore = function()
    {

        if( $scope.feed.dropdown_feed )
        {
            if ( ! $scope.feed.items.length && $scope.counter == 1 )
            {
                $scope.feed.last_loaded_time = (new Date()).getTime();
                
                $scope.feed.dropdown_obj.set_default_group_id( $scope.selected_dd );
                $scope.feed.dropdown_obj.get_data( $scope.selected_dd );
            }
            else
            {
                console.log('load more.....................');
            } 
        }
        else
        {
            if ( ! $scope.feed.items.length && ! $scope.counter )
            {
                $scope.feed.last_loaded_time = (new Date()).getTime();
                $scope.feed.get_data();
            }
            else
            {
                $scope.feed.more();
            } 
        }
        

        $scope.counter++;        
        
    };
    
    $scope.loadMore();
    
    $scope.processDD = function()
    {
        console.log($scope.selected_dd);
        $scope.feed.items = [];

        $scope.counter = 1;
        $scope.loadMore();

        //$scope.feed.dropdown_obj.set_default_group_id( $scope.selected_dd );
        //$scope.feed.dropdown_obj.get_data( $scope.selected_dd );
            
    };

    $scope.$on("$ionicView.enter", function() {
        var delegate = $ionicScrollDelegate.$getByHandle('mainScroll');
        //delegate.scrollTo( 0, $scope.feed.last_scroll_position );
        $scope.$parent.$parent.updateSideMenu(EC.getSideMenu('feed'));
    });

    $scope.$on("$ionicView.beforeLeave", function() {
        var position = $ionicScrollDelegate.$getByHandle('mainScroll').getScrollPosition();
        $scope.feed.last_scroll_position = position.top;
    });

    

    

    $scope.$on('$ionicView.beforeEnter', function(event, viewData) {
        viewData.enableBack = true;
        viewData.hasHeaderBar = true;
        console.log(viewData);
    });

    var bv = $ionicHistory.backView();

    $scope.$ionicGoBack = function() {
        console.log('KKKKK');
        console.log(bv);

        if (bv) {
            $ionicHistory.goBack();
        } else {
            $state.go('tabs.home');
        }

    };

    



})

.controller('Publishing', function($scope, EC, accountManager) {

    

   $scope.$parent.updateSideMenu(EC.getSideMenu('publishing'));

    

})

.controller('PostSettings', function($scope, $state, $rootScope, $ionicHistory, $ionicPopup, $ionicActionSheet, $ionicModal, $ionicLoading, accountManager) {

        $scope.$on('$ionicView.beforeEnter', function(event, viewData) {
            viewData.enableBack = true;
            console.log(viewData);
        });

        var bv = $ionicHistory.backView();

        $scope.$ionicGoBack = function() {
            console.log('KKKKK');
            console.log(bv);

            if (bv) {
                $ionicHistory.goBack();
            } else {
                $state.go('tabs.list');
            }

        };

    })
    .controller('ButtonsTabCtrl', function($scope, $ionicPopup, $ionicActionSheet, $ionicModal) {

        $scope.showPopup = function() {
            $ionicPopup.alert({
                title: 'Popup',
                content: 'This is ionic popup alert!'
            });
        };
        $scope.showActionsheet = function() {
            $ionicActionSheet.show({
                titleText: 'Ionic ActionSheet',
                buttons: [{
                    text: 'Facebook'
                }, {
                    text: 'Twitter'
                }, ],
                destructiveText: 'Delete',
                cancelText: 'Cancel',
                cancel: function() {
                    console.log('CANCELLED');
                },
                buttonClicked: function(index) {
                    console.log('BUTTON CLICKED', index);
                    return true;
                },
                destructiveButtonClicked: function() {
                    console.log('DESTRUCT');
                    return true;
                }
            });
        };
    })

.controller('SlideboxCtrl', function($scope, $ionicSlideBoxDelegate) {
    $scope.nextSlide = function() {
        $ionicSlideBoxDelegate.next();
    };
})

.controller('MenuCtrl', function($scope, $rootScope, $ionicSideMenuDelegate, $ionicModal) {


    $scope.updateSideMenu = function(menu) {
        console.log(menu);
        $scope.menuItems = menu;
    };



    $ionicModal.fromTemplateUrl('templates/modal.html', function(modal) {
        $scope.modal = modal;
    }, {
        animation: 'slide-in-up'
    });
})

.controller('AppCtrl', function($scope, $state, $rootScope) {

    $rootScope.menuItems = [];

});
},{}],27:[function(require,module,exports){
module.exports = angular.module('ionicApp.directives', [])

.directive('positionBarsAndContent', function($timeout) {

 return {
    
    restrict: 'E',
    scope: {
        ddFeed: '=ddFeed'
    },

    link: function(scope, element, attrs) {
      

      console.log('KAKAKAKAKKAKAKAK:::::::::::::::::::::');
      console.log(scope.ddFeed);
      doProcess();

      scope.$watch('ddFeed', function(nv){
        console.log('KAKAKAKAKKAKAKAK:::::::::::::::::::::');
        console.log(nv);
        doProcess();
      });

      function doProcess()
      {
          var offsetTop = 0;
          var platform = 'ios';//$cordovaDevice.getPlatform();
          platform = platform.toLowerCase();    


          // Get the parent node of the ion-content
          var parent = angular.element(element[0].parentNode);

          var m_header =  parent[0].getElementsByClassName('bar-header');

          // Get all the headers in this parent
          var s_headers = parent[0].getElementsByClassName('bar-subheader');
          var i_content = parent[0].getElementsByTagName('ion-content');

          if( m_header.length )
          {
            offsetTop = m_header[0].offsetHeight + (platform == 'ios'?20:0);
          }
          
          // Iterate through all the headers
          for(x=0;x<s_headers.length;x++)
          {
            // If this is not the main header or nav-bar, adjust its position to be below the previous header
            if(x >= 0) {
              s_headers[x].style.top = offsetTop + 'px';
            }
            
            // Add up the heights of all the header bars
            offsetTop = offsetTop + s_headers[x].offsetHeight;
          }      
          
          // Position the ion-content element directly below all the headers
          i_content[0].style.top = offsetTop + 'px';
      }
    }
  };  
})

.directive('hideTabs', function($rootScope) {
  return {
      restrict: 'A',
      link: function($scope, $el) {
          $rootScope.hideTabs = 'tabs-item-hide';
          $scope.$on('$destroy', function() {
              $rootScope.hideTabs = '';
          });
      }
  };
})

.directive('manageAccount', function(){
    return {
      restrict: 'E',
      scope: {
        account: '=account'
      },
      templateUrl: 'templates/directives/manage-account.html',
      link:function(scope, element, attrs){
          scope.cv = function(obj){
            alert(55);
            
          };

          scope.refreshAccount = function( obj ){
            obj.refreshAccount();
          };

          scope.deleteAccount = function( obj ){
            console.log(obj);
          };
      }
    };
})

.directive('manageProfile', function(){
    return {
      restrict: 'E',
      scope: {
        profile: '=profile'
      },
      templateUrl: 'templates/directives/manage-profile.html',
      link:function(scope, element, attrs){
          scope.validateCheck = function(obj){
            //obj.new_key = 'from directive';
            //alert(obj.getUserName());
            console.log(obj);
            obj.update_monitor(obj.profile_checked);
          };


      }
    };
})

.directive('feedItem', function(){
    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      templateUrl: 'templates/directives/feed-item.html',
      link:function(scope, element, attrs){
          scope.cv = function(obj){
            alert(55);
            
          };

          scope.refreshAccount = function( obj ){
            console.log(obj);
          };

          scope.deleteAccount = function( obj ){
            console.log(obj);
          };
      }
    };
});

},{}],28:[function(require,module,exports){

module.exports = ['$stateProvider', '$urlRouterProvider','$ionicConfigProvider', 
	function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

		  $stateProvider
		      .state('login', {
		        url: "/login",
		        templateUrl: "templates/login.html",
		        controller: "LoginCtrl"
		      })
		      .state('tabs', {
		        url: "/menu",
		        abstract: true,
		        templateUrl: "templates/menu.html",
		        controller: 'MenuCtrl'
		      })
		      
		      .state('tabs.home', {
		        url: "/home",
		        views: {
		          'home-tab': {
		            templateUrl: "templates/home.html",
		            controller: 'HomeTabCtrl'
		          }
		        }
		      })
		      .state('tabs.manage_accounts', {
		      	url: "/manage_accounts",
		        views: {
		          'home-tab': {
		            templateUrl: "templates/manage_accounts.html",
		            controller: 'ManageAccounts'
		          }
		        }
		      })
		      .state('tabs.publishing', {
		        url: "/publishing",
		        views: {
		          'publishing-tab': {
		            templateUrl: "templates/publish.html",
		            controller: 'Publishing'
		          }
		        }
		      })
		      .state('tabs.post_settings', {
		        url: "/post_settings",
		        views: {
		          'publishing-tab': {
		            templateUrl: "templates/post_settings.html",
		            controller: 'PostSettings'
		          }
		        }
		      })
		      .state('tabs.inbox', {
		        url: "/inbox",
		        views: {
		          'inbox-tab': {
		            templateUrl: "templates/inbox.html"
		          }
		        }
		      })
		      .state('tabs.feeds', {
		        url: "/feeds",
		        views: {
		          'feeds-tab': {
		            templateUrl: "templates/feeds.html"
		          }
		        }
		      })
		      
		      .state('tabs.item', {
		        url: "/item",
		        views: {
		          'list-tab': {
		            templateUrl: "templates/item.html"
		          }
		        }
		      })
		      .state('tabs.form', {
		        url: "/form",
		        views: {
		          'form-tab': {
		            templateUrl: "templates/form.html"
		          }
		        }
		      })
		      .state('menu.keyboard', {
		        url: "/keyboard",
		        views: {
		          'menuContent': {
		            templateUrl: "templates/keyboard.html"
		          }
		        }
		      })
		      /*.state('menu.login', {
		        url: "/login",
		        views: {
		          'menuContent': {
		            templateUrl: "templates/login.html"
		          }
		        }
		      })*/
		      .state('menu.slidebox', {
		        url: "/slidebox",
		        views: {
		          'menuContent': {
		            templateUrl: "templates/slidebox.html",
		            controller: 'SlideboxCtrl'
		          }
		        }
		      })
		      .state('menu.about', {
		        url: "/about",
		        views: {
		          'menuContent': {
		            templateUrl: "templates/about.html"
		          }
		        }
		      });

		    //$urlRouterProvider.otherwise("menu/tab/buttons");
		    /*if( $localStorage.user_data )
		    {
		    	$urlRouterProvider.otherwise("/home");
		    }
		    else
		    {
		    	$urlRouterProvider.otherwise("login");
		    }*/
		    $urlRouterProvider.otherwise("login");


		    $ionicConfigProvider.tabs.position("bottom"); //Places them at the bottom for all OS
		    $ionicConfigProvider.navBar.alignTitle("center");
		    $ionicConfigProvider.tabs.style("standard");

		    $ionicConfigProvider.views.maxCache(0);
		    $ionicConfigProvider.views.transition('none');
		    $ionicConfigProvider.views.forwardCache(true);
		    
		    $stateProviderRef = $stateProvider;
      		$urlRouterProviderRef = $urlRouterProvider;
		}
];
},{}],29:[function(require,module,exports){
module.exports = angular.module('ionicApp.services', [])

.factory('EC', EClib)

//service for authentication
.service('AuthService', function($q, $http, apiUrl, EC) {

    var isAuthenticated = true;
    var LOCAL_TOKEN_KEY = 'user_credentials';


    function loadUserCredentials() {
        var uc = window.localStorage.getItem(LOCAL_TOKEN_KEY);
        if (uc) {
            useCredentials(uc);

        }
    }


    function storeUserCredentials(uc) {
        window.localStorage.setItem(LOCAL_TOKEN_KEY, uc);
        useCredentials(uc);
    }

    function useCredentials(uc) {
        isAuthenticated = true;
        console.log(uc);


        // Set the uc as header for your requests!
        $http.defaults.headers.common.uid = uc.uid;
        $http.defaults.headers.common.authorizationToken = uc.authorizationToken;
    }

    function destroyUserCredentials() {
        isAuthenticated = false;
        //$http.defaults.headers.common.uid = undefined;
        //$http.defaults.headers.common.authorizationToken = undefined;
        window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    }

    var login = function(name, password, callback) {

        var req = {
            method: 'POST',
            url: apiUrl + 'user/login',
            data:{
                    'email': name,
                    'password': password
                }
            };

        EC.request(req).then(function(response) {
            callback('2222');
                //console.log('YYYYYYYYY');
                //$ionicLoading.hide();
                //$ionicHistory.currentView($ionicHistory.backView());//$ionicHistory.currentView(null);
                //$state.go('app.safetyLessons');
            },
            function(err_msg) {
                //console.log('ZZZZZZZZZ');
                callback('3333');
            });

    };

    var logout = function() {
        destroyUserCredentials();
    };

    loadUserCredentials();

    return {
        login: login,
        logout: logout,
        isAuthenticated: function() {
            return isAuthenticated;
        }
    };

})

.factory('UserSettings', require('./app/settings-manager')) 

.factory('Account', require('./app/account')) 

.factory('Profile', require('./app/profile')) 

.factory('accountManager', require('./app/account-manager')) 

.factory('Feed', require('./app/social/feed')) 

.factory('FeedItem', require('./app/social/FeedItem')) 

.factory('TimelineFeedItem', require('./app/social/timelineFeedItem')) 

.factory('LinkedinFeedItem', require('./app/social/linkedinFeedItem')) 

.factory('DropdownFeedItem', require('./app/social/dropdownFeedItem'))

.factory('LinkedinFeedItem', require('./app/social/linkedinFeedItem')) 

.factory('InstagramFeedItem', require('./app/social/InstagramFeedItem'))

.factory('CollapsibleFeedItem', require('./app/social/collapsibleFeedItem'))

.factory('LinkedinCollapsibleFeedItem', require('./app/social/linkedinCollapsibleFeedItem')) 

.factory('TwitterCollapsibleFeedItem', require('./app/social/TwitterCollapsibleFeedItem')) 

.factory('FacebookFeed', require('./app/social/facebook'))

.factory('LinkedinFeed', require('./app/social/linkedinFeed'))

.factory('TwitterFeed', require('./app/social/twitterFeed'))

.factory('BloggerFeed', require('./app/social/bloggerFeed'))

.factory('GooglePlusFeed', require('./app/social/googleplusFeed'))

.factory('PinterestFeed', require('./app/social/pinterestFeed'))

.factory('YouTubeFeed', require('./app/social/youTubeFeed'))

.factory('InstagramFeed', require('./app/social/instagramFeed'))

.factory('socialManager', require('./app/social-manager')) 

.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS) {
    return {
        responseError: function(response) {
            $rootScope.$broadcast({
                401: AUTH_EVENTS.notAuthenticated
            }[response.status], response);
            return $q.reject(response);

        }
    };
})

.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
});

},{"./app/account":4,"./app/account-manager":3,"./app/profile":5,"./app/settings-manager":6,"./app/social-manager":7,"./app/social/FeedItem":8,"./app/social/InstagramFeedItem":9,"./app/social/TwitterCollapsibleFeedItem":10,"./app/social/bloggerFeed":11,"./app/social/collapsibleFeedItem":12,"./app/social/dropdownFeedItem":13,"./app/social/facebook":14,"./app/social/feed":15,"./app/social/googleplusFeed":16,"./app/social/instagramFeed":17,"./app/social/linkedinCollapsibleFeedItem":18,"./app/social/linkedinFeed":19,"./app/social/linkedinFeedItem":20,"./app/social/pinterestFeed":21,"./app/social/timelineFeedItem":22,"./app/social/twitterFeed":23,"./app/social/youTubeFeed":24}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3cvanMvYXBwLW1haW4uanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL2FwcC9hY2NvdW50LW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL2FjY291bnQuanMiLCJ3d3cvanMvYXBwL3Byb2ZpbGUuanMiLCJ3d3cvanMvYXBwL3NldHRpbmdzLW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9JbnN0YWdyYW1GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL1R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvYmxvZ2dlckZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9jb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZhY2Vib29rLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2dvb2dsZXBsdXNGZWVkLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvaW5zdGFncmFtRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9waW50ZXJlc3RGZWVkLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvdGltZWxpbmVGZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3R3aXR0ZXJGZWVkLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwveW91VHViZUZlZWQuanMiLCJ3d3cvanMvY29uc3RhbnRzLmpzIiwid3d3L2pzL2NvbnRyb2xsZXJzLmpzIiwid3d3L2pzL2RpcmVjdGl2ZXMuanMiLCJ3d3cvanMvcm91dGVyLmpzIiwid3d3L2pzL3NlcnZpY2VzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25lQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3p1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcdGZ1bmN0aW9uIEFwcE1haW4oJGlvbmljUGxhdGZvcm0sICRyb290U2NvcGUsICRzY29wZSkgXHJcblx0e1xyXG5cdCAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24oKSB7XHJcblx0ICAgIC8vIEhpZGUgdGhlIGFjY2Vzc29yeSBiYXIgYnkgZGVmYXVsdCAocmVtb3ZlIHRoaXMgdG8gc2hvdyB0aGUgYWNjZXNzb3J5IGJhciBhYm92ZSB0aGUga2V5Ym9hcmRcclxuXHQgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxyXG5cdCAgICBpZiAod2luZG93LmNvcmRvdmEgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucyAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XHJcblx0ICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcclxuXHQgICAgfVxyXG5cdCAgICBpZiAod2luZG93LlN0YXR1c0Jhcikge1xyXG5cdCAgICAgIC8vIG9yZy5hcGFjaGUuY29yZG92YS5zdGF0dXNiYXIgcmVxdWlyZWRcclxuXHQgICAgICAvL1N0YXR1c0Jhci5zdHlsZUxpZ2h0Q29udGVudCgpO1xyXG5cdCAgICB9XHJcbiAgXHQgIH0pO1xyXG5cclxuXHQgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50KXtcclxuXHQgIFx0JHJvb3RTY29wZS5jdXJyZW50U2NvcGUgPSAkc2NvcGU7XHJcblx0ICB9KTtcclxuXHJcbiAgXHQgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcywgZXJyb3IpIHtcclxuXHQgICBpZiAodG9TdGF0ZS5uYW1lID09ICd0YWJzLm1hbmFnZV9hY2NvdW50cycpIHtcclxuXHQgICAgICRyb290U2NvcGUuaGlkZVRhYnM9dHJ1ZTtcclxuXHQgICB9IGVsc2Uge1xyXG5cdCAgICAgJHJvb3RTY29wZS5oaWRlVGFicz1mYWxzZTtcclxuXHQgICB9XHJcblx0ICB9KTtcclxuICBcdH1cclxuXHJcbiAgXHRtb2R1bGUuZXhwb3J0cyA9IFsnJGlvbmljUGxhdGZvcm0nLCAnJHJvb3RTY29wZScsIEFwcE1haW5dOyIsInJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzJyk7XG5yZXF1aXJlKCcuL2RpcmVjdGl2ZXMnKTtcblxudmFyICRzdGF0ZVByb3ZpZGVyUmVmID0gbnVsbDtcbnZhciAkdXJsUm91dGVyUHJvdmlkZXJSZWYgPSBudWxsO1xuXG5hbmd1bGFyLm1vZHVsZSgnaW9uaWNBcHAnLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW9uaWMnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpb25pY0FwcC5jb25zdGFudHMnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpb25pY0FwcC5jb250cm9sbGVycycsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lvbmljQXBwLnNlcnZpY2VzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpb25pY0FwcC5kaXJlY3RpdmVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ1N0b3JhZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3VpLnJvdXRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdDb3Jkb3ZhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd1bmRlcnNjb3JlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSlcblxuLmNvbmZpZyhyZXF1aXJlKCcuL3JvdXRlcicpKVxuXG4ucnVuKHJlcXVpcmUoJy4vYXBwLW1haW4nKSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAiLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdBY2NvdW50JywgJ1VzZXJTZXR0aW5ncycsICckY29yZG92YUluQXBwQnJvd3NlcicsIGZ1bmN0aW9uKCRodHRwLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBBY2NvdW50LCBVc2VyU2V0dGluZ3MsICRjb3Jkb3ZhSW5BcHBCcm93c2VyICl7ICBcclxuXHJcbiAgICB2YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZSxcclxuICAgICAgICBkYXRhID0ge30sXHJcbiAgICAgICAgYWNjb3VudHMgPSBbXSxcclxuICAgICAgICBhY2NvdW50c19vcmRlciA9IFtdLFxyXG4gICAgICAgIGFjY291bnRzX2J5X2lkID0ge30sXHJcbiAgICAgICAgZmF2b3JpdGVzX2FjY291bnQsXHJcbiAgICAgICAgc2VhcmNoX2FjY291bnQsXHJcbiAgICAgICAgcnNzX2FjY291bnQsXHJcbiAgICAgICAgb3V0cmVhY2hfYWNjb3VudCxcclxuICAgICAgICBjaW5ib3hfYWNjb3VudCxcclxuICAgICAgICBsYXN0X2FkZGVkX3Byb2ZpbGUsXHJcbiAgICAgICAgcmVmcmVzaF9vbl9jbG9zZSA9IGZhbHNlLFxyXG4gICAgICAgIHRlbXBsYXRlX3NlbGVjdG9yID0gJyNhY2NvdW50LW1hbmFnZXItdGVtcGxhdGUnO1xyXG5cclxuICAgICAgICBtb2R1bGUucmVuZGVyZWQgPSBmYWxzZTtcclxuICAgICAgICBtb2R1bGUuZ29fYmFja19mbGFnID0gdHJ1ZTtcclxuICAgICAgICBtb2R1bGUuZmF2b3JpdGVfcmVuZGVyZWQgPSBmYWxzZTtcclxuICAgICAgICBtb2R1bGUuc2VhcmNoX3JlbmRlcmVkID0gZmFsc2U7XHJcbiAgICAgICAgbW9kdWxlLnJzc19yZW5kZXJlZCA9IGZhbHNlO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2FjY291bnRNYW5hZ2VyIGluaXQnKTtcclxuXHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJGh0dHApO1xyXG4gICAgICAgIC8vcmV0dXJuIHRlbXBsYXRlX3NlbGVjdG9yO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vZ2V0IGFjY291bnRzIGFuZCBzdG9yZSBpdFxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6IGFwaVVybCArICdhY2NvdW50L2FjY291bnRzJyxcclxuICAgICAgICAgICAgZGF0YTp7J25hbWUnOidyYW0nfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihzdG9yZV9hY2NvdW50cywgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RvcmVfYWNjb3VudHMgKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVzcG9uc2U6OjonKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhVc2VyU2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZSB8fCBbXSxcclxuICAgICAgICAgICAgICAgIGl0ZW1zID0gZGF0YS5hY2NvdW50IHx8IFtdLFxyXG4gICAgICAgICAgICAgICAgZmF2X2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3JjaF9sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJzc19sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG91dHJlYWNoX2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgYWNjX29yZGVyID0gZGF0YS5hY2NvdW50X29yZGVyIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYoIGRhdGEuc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5oYW5kbGVfc2V0dGluZ3MoIGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgdHJ1ZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBVc2VyU2V0dGluZ3MuYW5hbHl0aWNzX2dyb3VwcyA9IFtdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoIGRhdGEuYW5hbHl0aWNzR3JvdXBzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5hbmFseXRpY3NfZ3JvdXBzID0gZGF0YS5hbmFseXRpY3NHcm91cHMuYW5hbHl0aWNzR3JvdXA7XHJcbiAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkoIGl0ZW1zICkgKSBpdGVtcyA9IFsgaXRlbXMgXTtcclxuXHJcbiAgICAgICAgICAgIGFjY291bnRzID0gW107XHJcbiAgICAgICAgICAgIGFjY291bnRzX2J5X2lkID0ge307XHJcbiAgICAgICAgICAgIGFjY291bnRzX29yZGVyID0gYWNjX29yZGVyO1xyXG5cclxuICAgICAgICAgICAgLy9DcmVhdGUgYWNjb3VudC1vYmplY3QgZm9yIGVhY2ggYWNjb3VudHMgYW5kIHN0b3JlIGJ5IGlkIC5cclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gaXRlbXMubGVuZ3RoOyBpIDwgcDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBuZXdfYWNjb3VudCA9IG5ldyBBY2NvdW50KCBpdGVtc1sgaSBdICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBhY2NvdW50cy5wdXNoKCBuZXdfYWNjb3VudCApOyAvLyBpdGVyYWJsZVxyXG5cclxuICAgICAgICAgICAgICAgIGFjY291bnRzX2J5X2lkWyBuZXdfYWNjb3VudC5pZCBdID0gYWNjb3VudHNbIGxlbmd0aCAtIDEgXTsgLy8gaW5kZXhlZCBieSBhY2NvdW50IElELCByZWZlcmVuY2VzIGFjY291bnQgYnkgaW5kZXhcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FjY291bnRzOjo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFjY291bnRzKTtcclxuICAgICAgICAgICAgLy9pZiBjYWxsYmFjayBpcyB2YWxpZCBmdW5jdGlvbiwgdGhlbiBjYWxsIGl0XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnJlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLnJlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19mYXZvcml0ZV9yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfZmF2b3JpdGVfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfc2VhcmNoX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnNlYXJjaF9yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfc2VhcmNoX3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuc2VhcmNoX3JlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19yc3NfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUucnNzX3JlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9yc3NfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5yc3NfcmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldF9nb19iYWNrX2ZsYWcgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUuZ29fYmFja19mbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9nb19iYWNrX2ZsYWcgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5nb19iYWNrX2ZsYWcgPSBmbGFnO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5maW5kID0gZnVuY3Rpb24gKCBhY2NvdW50X2lkIClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYWNjb3VudHNfYnlfaWRbIGFjY291bnRfaWQgXTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRfcHJvZmlsZSA9IGZ1bmN0aW9uICggcHJvZmlsZV9pZCApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdmYXZvcml0ZXMnKSByZXR1cm4gKCBmYXZvcml0ZXNfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gZmF2b3JpdGVzX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnc2VhcmNoJykgcmV0dXJuICggc2VhcmNoX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IHNlYXJjaF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ3JzcycpIHJldHVybiAoIHJzc19hY2NvdW50ICE9PSB1bmRlZmluZWQgPyByc3NfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdvdXRyZWFjaCcpIHJldHVybiAoIG91dHJlYWNoX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IG91dHJlYWNoX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnY2luYm94JykgcmV0dXJuICggY2luYm94X2FjY291bnQgIT09IHVuZGVmaW5lZCA/IGNpbmJveF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGEgPSBhY2NvdW50cy5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBwID0gYWNjb3VudHNbIGkgXS5wcm9maWxlcy5sZW5ndGg7IGogPCBwOyBqKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19wcm9maWxlID0gYWNjb3VudHNbIGkgXS5wcm9maWxlc1sgaiBdO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfcHJvZmlsZS5pZCA9PSBwcm9maWxlX2lkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc19wcm9maWxlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApIFxyXG4gICAgeyBcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggYWNjb3VudHMgKTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gYWNjb3VudHM7IFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxpc3RfYWNjb3VudHMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGVtcCA9IFtdLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgYSA9IDA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGFjY291bnRzX29yZGVyLmxlbmd0aCA+IDAgKXtcclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGEgPSBhY2NvdW50c19vcmRlci5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgYWMgPSBhY2NvdW50cy5sZW5ndGg7IGogPCBhYzsgaisrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihhY2NvdW50c19vcmRlcltpXSA9PSBhY2NvdW50c1sgaiBdLnR5cGUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYWNjb3VudHNbIGogXS5oYXNfdW5leHBpcmVkX3Byb2ZpbGVzKCkgKSB0ZW1wLnB1c2goIGFjY291bnRzWyBqIF0gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGEgPSBhY2NvdW50cy5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGFjY291bnRzWyBpIF0uaGFzX3VuZXhwaXJlZF9wcm9maWxlcygpICkgdGVtcC5wdXNoKCBhY2NvdW50c1sgaSBdICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRlbXAuc29ydChmdW5jdGlvbiAoIGEsIGIgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGEgPCBiICkgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggYSA+IGIgKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggdGVtcCApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgcmV0dXJuIHRlbXA7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWRkX2FjY291bnQgPSBmdW5jdGlvbiggdHlwZSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEpO1xyXG4gICAgICAgIHZhciBjdXN0b21faGVhZGVycyA9ICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhIHx8IHt9LFxyXG4gICAgICAgICAgICBwYXRoID0gJ2FjY291bnQvYWNjb3VudD90eXBlPScgK3R5cGUrICcmbGY9ZmFsc2UnO1xyXG5cclxuICAgICAgICBjdXN0b21faGVhZGVycyA9IEpTT04ucGFyc2UoIGN1c3RvbV9oZWFkZXJzICk7XHJcblxyXG4gICAgICAgIHZhciBja2V5ID0gKGN1c3RvbV9oZWFkZXJzLmNsaWVudF9rZXkgIT09IHVuZGVmaW5lZCkgPyBKU09OLnN0cmluZ2lmeShjdXN0b21faGVhZGVycy5jbGllbnRfa2V5KTogJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcGF0aCArPSAnJnVzZXJfbmFtZT0nK2N1c3RvbV9oZWFkZXJzLnVzZXJfbmFtZSsnJnVzZXJfcGFzcz0nK2N1c3RvbV9oZWFkZXJzLnVzZXJfcGFzcysnJmNsaWVudF9rZXk9Jytja2V5KycmZGV2aWNlPWlvcyc7XHJcbiAgICAgICAgLy9hbGVydChlbmNvZGVVUkkoYXBpVXJsK3BhdGgpKTtcclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgIGxvY2F0aW9uOiAneWVzJyxcclxuICAgICAgICAgIGNsZWFyY2FjaGU6ICd5ZXMnLFxyXG4gICAgICAgICAgY2xlYXJzZXNzaW9uY2FjaGU6ICd5ZXMnLFxyXG4gICAgICAgICAgdG9vbGJhcnBvc2l0aW9uOiAndG9wJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRjb3Jkb3ZhSW5BcHBCcm93c2VyLm9wZW4oIGVuY29kZVVSSShhcGlVcmwrcGF0aCksICdfYmxhbmsnLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRjb3Jkb3ZhSW5BcHBCcm93c2VyOmV4aXQnLCBmdW5jdGlvbihlLCBldmVudCl7XHJcbiAgICAgICAgICAgIGFjY291bnRNYW5hZ2VyLnNldF9yZW5kZXJlZCggZmFsc2UgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCdFQycsICdhcGlVcmwnLCAnUHJvZmlsZScsIGZ1bmN0aW9uKCRodHRwLCBFQywgYXBpVXJsLCBQcm9maWxlKXtcclxuXHJcbiAgICBmdW5jdGlvbiBBY2NvdW50ICggYWNjb3VudF9kYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBhY2NvdW50X2RhdGEuYWNjb3VudElkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudHlwZSA9IGFjY291bnRfZGF0YS50eXBlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2FuX3Bvc3QgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLnR5cGUgPT0gJ0ZhY2Vib29rJyB8fCB0aGlzLnR5cGUgPT0gJ0xpbmtlZGluJyB8fCB0aGlzLnR5cGUgPT0gJ1R3aXR0ZXInIHx8IHRoaXMudHlwZSA9PSAnQmxvZ2dlcicgfHwgdGhpcy50eXBlID09ICdQaW50ZXJlc3QnICkgdGhpcy5jYW5fcG9zdCA9IHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT0gJ0dvb2dsZVBsdXMnKSB0aGlzLmNhbl9wb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnUGludGVyZXN0JyAmJiBhY2NvdW50X2RhdGEuZW1haWwgIT09IHVuZGVmaW5lZCAmJiBhY2NvdW50X2RhdGEucGFzc3dvcmQgIT09IHVuZGVmaW5lZCAmJiAhICQuaXNFbXB0eU9iamVjdCggYWNjb3VudF9kYXRhLnBhc3N3b3JkICkgKSB0aGlzLmNhbl9wb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJfbGltaXQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLnR5cGUgPT0gJ0xpbmtlZGluJykgdGhpcy5jaGFyYWN0ZXJfbGltaXQgPSA3MDA7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT0gJ1R3aXR0ZXInKSB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IDE0MDtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhID0gYWNjb3VudF9kYXRhIHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLnByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLmNvbmZpZyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCB0aGlzLmRhdGEuY29uZmlnICkgKSB0aGlzLnByb2ZpbGVzLnB1c2goIG5ldyBQcm9maWxlKCB0aGlzLmRhdGEuY29uZmlnLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuY29uZmlnLmZvckVhY2goZnVuY3Rpb24gKCBpdGVtIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3X3Byb2ZpbGUgPSBuZXcgUHJvZmlsZSggaXRlbSwgc2VsZiApO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wcm9maWxlcy5wdXNoKCBuZXdfcHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmV4cGlyZWQgPSAoIGFjY291bnRfZGF0YS5tb25pdG9yZWQgPT0gJ2V4cGlyZWQnID8gdHJ1ZSA6IGZhbHNlICk7XHJcbiAgICAgICAgLy8gdGhpcy5leHBpcmVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuaGFzX21vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLm1vbml0b3JlZF9wcm9maWxlcygpLmxlbmd0aCA+IDAgKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmhhc19ldmVudHNfbW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuZXZlbnRzX21vbml0b3JlZF9wcm9maWxlcygpLmxlbmd0aCA+IDAgKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5oYXNfdW5leHBpcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMudW5leHBpcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIEFjY291bnQucHJvdG90eXBlLm1vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IHRoaXMucHJvZmlsZXMubGVuZ3RoOyBpIDwgcDsgaSsrICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZXNbIGkgXS5tb25pdG9yZWQgPT0gJ29uJykgcHJvZmlsZXMucHVzaCggdGhpcy5wcm9maWxlc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZmlsZXM7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmV2ZW50c19tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSB0aGlzLnByb2ZpbGVzLmxlbmd0aDsgaSA8IHA7IGkrKyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGVzWyBpIF0uZXZlbnRzTW9uaXRvcmVkID09ICdvbicpIHByb2ZpbGVzLnB1c2goIHRoaXMucHJvZmlsZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2ZpbGVzO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUudW5leHBpcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gdGhpcy5wcm9maWxlcy5sZW5ndGg7IGkgPCBwOyBpKysgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlc1sgaSBdLm1vbml0b3JlZCAhPSAnb2ZmJykgcHJvZmlsZXMucHVzaCggdGhpcy5wcm9maWxlc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZmlsZXM7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gJ1tvYmplY3QgJyArdGhpcy50eXBlKyAnIEFjY291bnRdJztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgc3dpdGNoICggdGhpcy50eXBlLnRvTG93ZXJDYXNlKCkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnZmFjZWJvb2snOiByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdpdHRlcic6IHJldHVybiAyO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdnb29nbGVhbmFseXRpY3MnOiByZXR1cm4gMztcclxuICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdsaW5rZWRpbic6IHJldHVybiA0O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbnN0YWdyYW0nOiByZXR1cm4gNTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAneW91dHViZSc6IHJldHVybiA2O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdwaW50ZXJlc3QnOiByZXR1cm4gNztcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ29vZ2xlcGx1cyc6IHJldHVybiA4O1xyXG4gICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiByZXR1cm4gOTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAndHVtYmxyJzogcmV0dXJuIDEwO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd3b3JkcHJlc3MnOiByZXR1cm4gMTE7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3ZrJzogcmV0dXJuIDEyO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gMTM7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBcImFjY291bnQvcmVmcmVzaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IFwicmVmcmVzaEFjY291bnRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5hY3Rpb24gPSAndXBkYXRlUElCb2FyZHMnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICkgY2FsbGJhY2soZmxhZyk7XHJcblxyXG4gICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5kZWxldGVBY2NvdW50ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IFwiYWNjb3VudC9kZWxldGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcImRlbGV0ZUFjY291bnRCeUlEXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYuaWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApIGNhbGxiYWNrKGZsYWcpO1xyXG5cclxuICAgICAgICB9LCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEFjY291bnQ7XHJcbiAgICBcclxufV07XHJcblxyXG5cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywnRUMnLCAnYXBpVXJsJywgJ3NvY2lhbE1hbmFnZXInLCBmdW5jdGlvbigkaHR0cCwgRUMsIGFwaVVybCwgc29jaWFsTWFuYWdlcil7XHJcblxyXG5cdGZ1bmN0aW9uIFByb2ZpbGUgKCBwcm9maWxlX2RhdGEsIGFjY291bnQgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHByb2ZpbGVfZGF0YSB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5hY2NvdW50ID0gYWNjb3VudCB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGRhdGEuc2FtcGxlSWQ7XHJcblxyXG4gICAgICAgIHRoaXMucGljdHVyZSA9ICggZGF0YS5wcm9maWxlUGljdHVyZSA/IGRlY29kZVVSSUNvbXBvbmVudCggZGF0YS5wcm9maWxlUGljdHVyZSApIDogJ3Nzc3Nzc3NzJyApO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgIT09ICdwaW50ZXJlc3QnICkgdGhpcy5waWN0dXJlID0gdGhpcy5waWN0dXJlLnJlcGxhY2UoJ2h0dHA6Ly8nLCcvLycpO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEubW9uaXRvcmVkID09ICdvbicgfHwgZGF0YS5zb2NpYWxNb25pdG9yZWQgPT0gJ29uJykgdGhpcy5tb25pdG9yZWQgPSAnb24nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhLm1vbml0b3JlZCA9PSAnZXhwaXJlZCcgfHwgZGF0YS5zb2NpYWxNb25pdG9yZWQgPT0gJ2V4cGlyZWQnKSB0aGlzLm1vbml0b3JlZCA9ICdleHBpcmVkJztcclxuXHJcbiAgICAgICAgZWxzZSB0aGlzLm1vbml0b3JlZCA9ICdvZmYnO1xyXG5cclxuICAgICAgICB0aGlzLnByb2ZpbGVfY2hlY2tlZCA9IHRoaXMubW9uaXRvcmVkID09ICdvbicgPyB0cnVlOmZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLmV2ZW50c01vbml0b3JlZCA9IGRhdGEuZXZlbnRzTW9uaXRvcmVkO1xyXG5cclxuICAgICAgICAvLyB0aGlzLm1vbml0b3JlZCA9ICggKCBkYXRhLm1vbml0b3JlZCA9PSAnb24nIHx8IGRhdGEuc29jaWFsTW9uaXRvcmVkID09ICdvbicpID8gJ29uJyA6ICdvZmYnKTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gKSApIHRoaXMuc3RyZWFtcyA9IGRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICkgdGhpcy5zdHJlYW1zID0gWyBkYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSBdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSApICkgdGhpcy5zdHJlYW1zID0gdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCApIHRoaXMuc3RyZWFtcyA9IFsgdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtIF07XHJcblxyXG4gICAgICAgIGVsc2UgdGhpcy5zdHJlYW1zID0gW107XHJcblxyXG4gICAgICAgIC8vIHRoaXMuc29jaWFsID0gbmV3IFNvY2lhbCggc2VsZiApO1xyXG4gICAgICAgIHRoaXMuc29jaWFsID0gbmV3IHNvY2lhbE1hbmFnZXIoIHNlbGYgKTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5hbmFseXRpY3MgPSBuZXcgQW5hbHl0aWNzKCBzZWxmICk7XHJcbiAgICAgICAgLy90aGlzLmFuYWx5dGljcyA9IG5ldyBhbmFseXRpY3NNYW5hZ2VyKCBzZWxmICk7XHJcblxyXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uZXR3b3JrID0gdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgdGhpcy51c2VybmFtZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLm1vbml0b3JlZCA9PT0gJ29uJyAmJiB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdsaW5rZWRpbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvKnZhciByZXFfZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldExOR3JvdXBzJyxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLmlkXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9ncm91cHMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogcmVxX2RhdGFcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqICE9PSB1bmRlZmluZWQgJiYgb2JqLmRhdGEgIT09IHVuZGVmaW5lZCApIHNlbGYuZ3JvdXBzID0gKCBBcnJheS5pc0FycmF5KCBvYmouZGF0YSApID8gb2JqLmRhdGEuc29ydChmdW5jdGlvbihhLGIpe2lmKGEubmFtZSA8IGIubmFtZSkgcmV0dXJuIC0xO2lmKGEubmFtZSA+IGIubmFtZSkgcmV0dXJuIDE7cmV0dXJuIDA7fSkgOiBbIG9iai5kYXRhIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7Ki9cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2ZhY2Vib29rJyAmJiBkYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIiApXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMubW9uaXRvcmVkID09PSAnb24nICYmIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2ZhY2Vib29rJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8qdmFyIHJlcV9kYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCSGlkZGVuX0dyb3VwcycsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBzJyxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dF9wb3N0czogJydcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOidmZWVkL2ZiSGlkZGVuR3JvdXBzJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiByZXFfZGF0YVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggb2JqICE9IHVuZGVmaW5lZCAmJiBvYmouZGF0YSAhPSB1bmRlZmluZWQgJiYgb2JqLmRhdGEubGVuZ3RoID4gMCApIHNlbGYuZ3JvdXBzID0gKCBBcnJheS5pc0FycmF5KCBvYmouZGF0YSApID8gb2JqLmRhdGEuc29ydChmdW5jdGlvbihhLGIpe2lmKGEubmFtZSA8IGIubmFtZSkgcmV0dXJuIC0xO2lmKGEubmFtZSA+IGIubmFtZSkgcmV0dXJuIDE7cmV0dXJuIDA7fSkgOiBbIG9iai5kYXRhIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9KTsqL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAndHdpdHRlcicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdF9lbGVtZW50OiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBnZXQgcHJvZmlsZSBMaXN0c1xyXG4gICAgICAgICAgICAvL21vZHVsZS5nZXRfdHdfcHJvZmlsZV9saXN0cyh0aGlzLyosIGZ1bmN0aW9uKCl7fSovKTsgXHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEucG93ZXJVc2VycyApIHRoaXMucG93ZXJfdXNlcnMgPSBkYXRhLnBvd2VyVXNlcnM7XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXMucG93ZXJfdXNlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogJ29uJyxcclxuICAgICAgICAgICAgICAgIG1lZGl1bUxvdzogJzIwMDAnLFxyXG4gICAgICAgICAgICAgICAgbWVkaXVtSGlnaDogJzc1MDAnLFxyXG4gICAgICAgICAgICAgICAgaGlnaDogJzc1MDAnXHJcbiAgICAgICAgICAgIH07ICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnaW5zdGFncmFtJylcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3lvdXR1YmUnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggcHJvZmlsZV9kYXRhLm9iamVjdFR5cGUgPT0gJ3BhZ2UnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3N0aW5nX29ubHkgPSB0cnVlOyBcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSBwcm9maWxlX2RhdGEuZnVsbE5hbWUgKyAnIChQYWdlKSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9ICdmdWxsTmFtZSc7ICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lID0gKHByb2ZpbGVfZGF0YS5mdWxsTmFtZSAhPT0gdW5kZWZpbmVkICYmIHByb2ZpbGVfZGF0YS5mdWxsTmFtZSAhPT1cIlwiKT9wcm9maWxlX2RhdGEuZnVsbE5hbWUuc3BsaXQoXCIoXCIpWzBdICsgJyAoVXNlciknOiAnKFVzZXIpJztcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gJ2Z1bGxOYW1lJzsgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IHByb2ZpbGVfZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSAnZnVsbE5hbWUnO1xyXG5cclxuICAgICAgICAgICAgaWYoIHByb2ZpbGVfZGF0YS5vYmplY3RUeXBlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZV9kYXRhLm9iamVjdFR5cGUgPT0gJ3VzZXInICkgdGhpcy51c2VybmFtZSArPSAnIChVc2VyKSc7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvc3Rpbmdfb25seSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lICs9ICcgKEJvYXJkKSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5wYWdlTmFtZSApIC8vIEZCIFxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEudGl0bGUgKSAvLyBHQVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEucHJvZmlsZU5hbWUgKSAvLyBMTlxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEudXNlck5hbWUgKSAvLyBJR1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEuc3BlY2lmaWVkSGFuZGxlT3JIYXNoVGFnICkgLy8gVFdcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLmZ1bGxOYW1lICkgLy8gRytcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnVzZXJGaXJzdE5hbWUgKSAvLyBZVFxyXG5cclxuICAgICAgICBbJ3BhZ2VOYW1lJywgJ3RpdGxlJywgJ3Byb2ZpbGVOYW1lJywgJ3VzZXJGaXJzdE5hbWUnLCAndXNlck5hbWUnLCAnc3BlY2lmaWVkSGFuZGxlT3JIYXNoVGFnJywgJ2Z1bGxOYW1lJ10uZm9yRWFjaChmdW5jdGlvbiAoIGl0ZW0gKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhWyBpdGVtIF0gIT09IHVuZGVmaW5lZCAmJiBzZWxmLnVzZXJuYW1lID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJuYW1lID0gZGF0YVsgaXRlbSBdICsgJyAnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJuYW1lX2tleSA9IGl0ZW07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICdbb2JqZWN0ICcgK3RoaXMuYWNjb3VudC50eXBlKyAnIFByb2ZpbGVdJztcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlcm5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLmlzX2Rpc3BsYXlfcHJvZmlsZSA9IGZ1bmN0aW9uKCBhbGxfZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIHZhciBkaXNwbGF5X3Byb2ZpbGUgPSB0cnVlLFxyXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCBhbGxfZmxhZyA9PT0gdW5kZWZpbmVkICYmIHNlbGYubW9uaXRvcmVkID09PSAnb24nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8kYWNjb3VudC5lbGVtZW50LmZpbmQoJy5mdW5jdGlvbnMnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdnb29nbGVwbHVzJyAmJiAhc2VsZi5wb3N0aW5nX29ubHkgKSB8fCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnICkgXHJcbiAgICAgICAgICAgIHsgZGlzcGxheV9wcm9maWxlID0gZmFsc2U7IH0gLy9oaWRlIGluIHBvc3QgbWFuYWdlclxyXG4gICAgICAgIH0gXHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBhbGxfZmxhZyA9PT0gdHJ1ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICggc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JykgJiYgc2VsZi5wb3N0aW5nX29ubHkgKSBcclxuICAgICAgICAgICAgeyBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTsgfSAvL2hpZGUgICBcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBlbHNlIGlmICggc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkaXNwbGF5X3Byb2ZpbGUgPSBzZWxmLnBvc3Rpbmdfb25seTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgZGlzcGxheV9wcm9maWxlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiBkaXNwbGF5X3Byb2ZpbGU7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLmdldFVzZXJOYW1lID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgdXNlcm5hbWUgPSB0aGlzLnVzZXJuYW1lO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZGF0YS50aXRsZSAhPT0gdW5kZWZpbmVkICkgLy8gZm9ybWF0IG5hbWUgZm9yIEdBXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGVtcCA9IHVzZXJuYW1lLnNwbGl0KCcoJylbMF0gfHwgc2VsZi51c2VybmFtZSsgJyAnO1xyXG5cclxuICAgICAgICAgICAgdXNlcm5hbWUgPSB0ZW1wLnN1YnN0cmluZygwLCB0ZW1wLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVzZXJuYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS51cGRhdGVfbW9uaXRvciA9IGZ1bmN0aW9uKCBmbGFnIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgZmxhZyA9IChmbGFnICE9PSB1bmRlZmluZWQpP2ZsYWc6ZmFsc2U7XHJcblxyXG4gICAgICAgIGlmKCBzZWxmLmFjY291bnQudHlwZSA9PSAnR29vZ2xlQW5hbHl0aWNzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhbGVydCgnZ29vZ2xlIGFuYWx5dGljcy4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZWxmLm1vbml0b3JlZCA9IGZsYWcgPyAnb24nOidvZmYnO1xyXG5cclxuICAgICAgICAgICAgc2F2ZV9wcm9maWxlX3NlbGVjdGlvbihmdW5jdGlvbiggc3RhdHVzICl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdHVzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNhdmVfcHJvZmlsZV9zZWxlY3Rpb24oIGNhbGxiYWNrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTonUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6XCJhY2NvdW50L3NpbmdsZXByb2ZpbGVtb25pdG9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOntcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdzZXRTaW5nbGVQcm9maWxlTW9uaXRvcmVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IGFjY291bnRJRDogc2VsZi5hY2NvdW50LmlkLCBwcm9maWxlSUQ6IHNlbGYuaWQsIGNoZWNrZWQ6IGZsYWcgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKSBjYWxsYmFjayhmbGFnKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG5cclxuXHJcbiAgICByZXR1cm4gUHJvZmlsZTtcclxuXHJcbn1dOyIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0FjY291bnQnLCAnJGNvcmRvdmFJbkFwcEJyb3dzZXInLCdfJywgZnVuY3Rpb24oJGh0dHAsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEFjY291bnQsICRjb3Jkb3ZhSW5BcHBCcm93c2VyLCBfICl7ICBcclxuXHJcbiAgICB2YXIgbGljZW5zZU9wdGlvbnMsXHJcbiAgICAgICAgc2V0dGluZ3MsXHJcbiAgICAgICAgaXNfZXRzeV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfd2VlYmx5X3VzZXIgPSBmYWxzZSxcclxuICAgICAgICBpc193aXhfdXNlcj0gZmFsc2UsXHJcbiAgICAgICAgaXNfbGV4aXR5X3VzZXIgPSBmYWxzZSxcclxuICAgICAgICBpc19zaG9waWZ5X3VzZXIgPSBmYWxzZSxcclxuICAgICAgICBpc19iaWdjb21tZXJjZV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgZXh0ZXJuYWxBcHBzID0gW10sXHJcbiAgICAgICAgZmF2b3JpdGVzID0gW10sXHJcbiAgICAgICAgc2VhcmNoZXMgPSBbXSxcclxuICAgICAgICB1c2VyX2luYm94X2ZpbHRlcnMgPSBbXSxcclxuICAgICAgICBnb3Rfc2YgPSBmYWxzZSxcclxuICAgICAgICBnb3Rfc2VhcmNoZXMgPSBmYWxzZSxcclxuICAgICAgICBudW1iZXJPZkNvbXBsZXRlZEV2ZW50cyA9IDAsXHJcbiAgICAgICAgYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IHRydWUsXHJcbiAgICAgICAgaGlkZUV2ZW50c0NvdW50ZXIgPSBmYWxzZSxcclxuICAgICAgICBkaXNwbGF5SW5ib3hTZXR0aW5ncyA9IHRydWUsXHJcbiAgICAgICAgYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID0gZmFsc2UsXHJcbiAgICAgICAgYWdlbmN5Q29uZmlndXJhdGlvbiA9IHt9LFxyXG4gICAgICAgIG1heEV2ZW50VGltZTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuZ2V0RGlzcGxheUluYm94U2V0dGluZ3MgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBkaXNwbGF5SW5ib3hTZXR0aW5ncztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXREaXNwbGF5SW5ib3hTZXR0aW5ncyA9IGZ1bmN0aW9uICggZGlzcGxheSApXHJcbiAgICB7XHJcbiAgICAgICAgZGlzcGxheUluYm94U2V0dGluZ3MgPSBkaXNwbGF5O1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldE1heEV2ZW50VGltZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICggbWF4RXZlbnRUaW1lID09PSB1bmRlZmluZWQgPyBuZXcgRGF0ZSgpLmdldFRpbWUoKSA6IG1heEV2ZW50VGltZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldE1heEV2ZW50VGltZSA9IGZ1bmN0aW9uICggdGltZSApXHJcbiAgICB7XHJcbiAgICAgICAgbWF4RXZlbnRUaW1lID0gdGltZTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRBbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKCBoaWRlIClcclxuICAgIHtcclxuICAgICAgICBhbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID0gaGlkZTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRIaWRlRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGhpZGVFdmVudHNDb3VudGVyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEhpZGVFdmVudHNDb3VudGVyID0gZnVuY3Rpb24gKCBoaWRlIClcclxuICAgIHtcclxuICAgICAgICBoaWRlRXZlbnRzQ291bnRlciA9IGhpZGU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0TnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBudW1iZXJPZkNvbXBsZXRlZEV2ZW50cztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXROdW1iZXJPZkNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICggY29tcGxldGVkX2V2ZW50cyApXHJcbiAgICB7XHJcbiAgICAgICAgbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSBjb21wbGV0ZWRfZXZlbnRzO1xyXG5cclxuICAgICAgICB0aGlzLnJlbmRlckNvbXBsZXRlZEV2ZW50c0NvdW50ZXIoKTsgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93O1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZ1bmN0aW9uICggZmxhZyApXHJcbiAgICB7XHJcbiAgICAgICAgYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZW5kZXJDb21wbGV0ZWRFdmVudHNDb3VudGVyID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIC8qdmFyICRpbmRpY2F0b3IgPSAkKCdib2R5JykuZmluZCgnLm5ldy1ldmVudHMtaW5kaWNhdG9yJyk7XHJcblxyXG4gICAgICAgIGlmICggJGluZGljYXRvci5sZW5ndGggPiAwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggIWhpZGVFdmVudHNDb3VudGVyICYmIGFsbF9zZXR0aW5ncy5saWNlbnNlVHlwZSAhPSAnRnJlZScgJiYgYWxsX3NldHRpbmdzLmxpY2Vuc2VUeXBlICE9ICdJbmRpdmlkdWFsJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggJGluZGljYXRvci5oYXNDbGFzcygnemVybycpICkgJGluZGljYXRvci5yZW1vdmVDbGFzcygnemVybycpO1xyXG5cclxuICAgICAgICAgICAgICAgICRpbmRpY2F0b3IudGV4dCggbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICEkaW5kaWNhdG9yLmhhc0NsYXNzKCd6ZXJvJykgKSAkaW5kaWNhdG9yLnRleHQoJycpLmFkZENsYXNzKCd6ZXJvJyk7ICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSovXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWdlbmN5Q29uZmlndXJhdGlvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGFnZW5jeUNvbmZpZ3VyYXRpb247XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0QWdlbmN5Q29uZmlndXJhdGlvbiA9IGZ1bmN0aW9uICggYWMgKVxyXG4gICAge1xyXG4gICAgICAgIGFnZW5jeUNvbmZpZ3VyYXRpb24gPSBhYztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBZ2VuY3lCcmFuZHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG5cclxuICAgICAgICBpZiggYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQgPT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHJldHVybiBbXTtcclxuXHJcbiAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkoIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50ICkgKVxyXG4gICAgICAgICAgICByZXR1cm4gWyBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudCBdO1xyXG5cclxuICAgICAgICByZXR1cm4gYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQ7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFVzZXJQZXJtaXNzaW9uID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgdmFyIGJyYW5kcyA9IG1vZHVsZS5nZXRBZ2VuY3lCcmFuZHMoKSxcclxuICAgICAgICAgICAgcGVybWlzc2lvbiA9ICdlZGl0JztcclxuXHJcbiAgICAgICAgaWYoICFicmFuZHMubGVuZ3RoICkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBmb3IoIHZhciBpPTA7IGk8YnJhbmRzLmxlbmd0aDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKCBicmFuZHNbaV0uc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBicmFuZHNbaV0uc2VsZWN0ZWQgPT0gJzEnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGVybWlzc2lvbiA9IGJyYW5kc1tpXS5wZXJtaXNzaW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcGVybWlzc2lvbjtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QW5hbHl0aWNzQWNjb3VudHMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogUE9TVCxcclxuICAgICAgICAgICAgdXJsOiAnYWpheC5waHAnLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRBbmFseXRpY3NBY2NvdW50cydcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKCByZXNwb25zZSApOyBcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggb2JqICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlQWNjb3VudHMgPSBmdW5jdGlvbiAoZGF0YSwgY2FsbGJhY2spXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6UE9TVCxcclxuICAgICAgICAgICAgdXJsOlwiYWpheC5waHBcIixcclxuICAgICAgICAgICAgZGF0YTp7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246J3VwZGF0ZUFjY291bnRzJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6ZGF0YVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHJlc3BvbnNlID09IFNVQ0NFU1MpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1vZHVsZS5nZXRTZXR0aW5ncygpOyAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCByZXNwb25zZSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNhdmVTZXR0aW5ncyA9IGZ1bmN0aW9uKCBkYXRhLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6UE9TVCxcclxuICAgICAgICAgICAgdXJsOid1c2VyL3NldHRpbmdzJyxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnc2F2ZVNldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCByZXNwb25zZS5yZXR1cm5Db2RlID09IFwiU1VDQ0VTU1wiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuaGFuZGxlX3NldHRpbmdzKCByZXNwb25zZS5zZXR0aW5ncywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHJlc3BvbnNlICk7XHJcbiAgICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCByZXNwb25zZSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0U2VhcmNoU3RyZWFtcyA9IGZ1bmN0aW9uKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoeyB0eXBlOkdFVCwgdXJsOidmZWVkL3NlYXJjaFN0cmVhbXMnLCBkYXRhOnsgYWN0aW9uOidnZXRTZWFyY2hTdHJlYW1zJ319LCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgZ290X3NmID0gdHJ1ZTtcclxuICAgICAgICAgICAgc2VhcmNoZXMgPSBkYXRhO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZWRpdFNlYXJjaFN0cmVhbSA9IGZ1bmN0aW9uKCBzdHJlYW0sIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHN0cmVhbS5wcm9maWxlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgICAgICB1cmw6J2ZlZWQvc2VhcmNoU3RyZWFtcycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZWRpdFNlYXJjaFN0cmVhbScsXHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IHN0cmVhbS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHN0cmVhbS5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzdHJlYW0ucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiBzdHJlYW0ucGFyYW1ldGVyc1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzdHJlYW0ucGFyYW1ldGVycy5xdWVyeSAhPT0gdW5kZWZpbmVkICkgcmVxdWVzdC5kYXRhLm5hbWUgPSAnU2VhcmNoOiAnICsgZGVjb2RlVVJJQ29tcG9uZW50KCBzdHJlYW0ucGFyYW1ldGVycy5xdWVyeSApO1xyXG5cclxuICAgICAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uKCByZXNwb25zZSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlOy8vSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEZhdm9yaXRlU3RyZWFtcyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KHsgdHlwZTpHRVQsIHVybDonZmVlZC9mYXZvcml0ZVN0cmVhbXMnLCBkYXRhOnsgYWN0aW9uOidnZXRGYXZvcml0ZVN0cmVhbXMnfX0sIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICBmYXZvcml0ZXMgPSBkYXRhO1xyXG5cclxuICAgICAgICAgICAgZ290X2ZhdmVzID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBmYXZvcml0ZXMgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRGYXZvcml0ZVN0cmVhbXMgcmVzcG9uc2U6JylcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGRhdGEgKVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZhdm9yaXRlcyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggZ290X2ZhdmVzICkgcmV0dXJuIGZhdm9yaXRlcztcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2VhcmNoX2ZlZWRzID0gZnVuY3Rpb24gKCApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBnb3Rfc2YgKSByZXR1cm4gc2VhcmNoZXM7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlOyAgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldHRpbmdzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApIFxyXG4gICAge1xyXG4gICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBzZXR0aW5ncyApO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBzZXR0aW5ncztcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuZ2V0U2V0dGluZ3MgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOkdFVCxcclxuICAgICAgICAgICAgdXJsOid1c2VyL3NldHRpbmdzJyAgICAgICAgICAgIFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZSAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1vZHVsZS5oYW5kbGVfc2V0dGluZ3MocmVzcG9uc2UsIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgaGFuZGxlICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaGFuZGxlX3NldHRpbmdzID0gZnVuY3Rpb24oIHJlc3BvbnNlLCBjYWxsYmFjaywgZmxhZ19ub19hZ2VuY3lfdXBkYXRlIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnaGFuZGxlX3NldHRpbmdzLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uJyk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgIGZsYWdfbm9fYWdlbmN5X3VwZGF0ZSA9IGZsYWdfbm9fYWdlbmN5X3VwZGF0ZSA/IGZsYWdfbm9fYWdlbmN5X3VwZGF0ZTpmYWxzZTtcclxuXHJcblxyXG4gICAgICAgICAgICAvLyBzZXQgbW9kdWxlIHZhcmlhYmxlXHJcbiAgICAgICAgICAgIHNldHRpbmdzID0gZGF0YTtcclxuICAgICAgICAgICAgaWYgKCBzZXR0aW5ncy5hcGlVc2VyID09PSB1bmRlZmluZWQgfHwgXy5pc0VtcHR5KCBzZXR0aW5ncy5hcGlVc2VyICkgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuYXBpVXNlciA9IHNldHRpbmdzLmVtYWlsO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL3NldCBnbG9iYWwgdmFyaWFibGVzXHJcbiAgICAgICAgICAgIGlzX3dpeF91c2VyID0gc2V0dGluZ3Mud2l4VXNlcjtcclxuICAgICAgICAgICAgbWF4X2FsbG93ZWRfZ2FfYWNjb3VudHMgPSBzZXR0aW5ncy5udW1iZXJPZkFjdGl2ZUdvb2dsZUFuYWx5dGljc0FjY291bnRzO1xyXG4gICAgICAgICAgICBtYXhfYWxsb3dlZF9zb2NpYWxfYWNjb3VudHMgPSBzZXR0aW5ncy5udW1iZXJPZlNvY2lhbHNPbjtcclxuICAgICAgICAgICAgcmVtX2RheXMgPSBzZXR0aW5ncy5kYXlzTGVmdDtcclxuXHJcbiAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzID0gc2V0dGluZ3M7XHJcbiAgICAgICAgICAgIC8vRUMuc2Vzc2lvbkRhdGEuc2V0KCdhbGxfc2V0dGluZ3MnLCBKU09OLnN0cmluZ2lmeShzZXR0aW5ncykpO1xyXG5cclxuICAgICAgICAgICAgLy9zZXQgc2V0dGluZ3NEZWZlcnJlZCBhcyByZXNvbHZlZCBvbmx5IGlmIHNldHRpbmdzIGF2YWlsYWJsZVxyXG4gICAgICAgICAgICAvL3NldHRpbmdzRGVmZXJyZWQucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbGljZW5zZU9wdGlvbnMgPSBkYXRhLmxpY2Vuc2VPcHRpb25zO1xyXG5cclxuICAgICAgICAgICAgLyppZiAoIGRhdGEudXNlclNvdXJjZSA9PSBcImJpZ2NvbW1lcmNlXCIgfHwgZGF0YS5sb2dpblR5cGUgIT0gJ3VzZXJQYXNzd29yZCcpe1xyXG4gICAgICAgICAgICAgICAgJCgnLmNoYW5nZV9wYXNzJykuYWRkQ2xhc3MoJ2hpZGUnKTtcclxuICAgICAgICAgICAgfSovXHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMoIGRhdGEuYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cz8gKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIik6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0SGlkZUV2ZW50c0NvdW50ZXIoIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyID8gKCBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlci50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKSA6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmRpc3BsYXlJbmJveFNldHRpbmdzID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldERpc3BsYXlJbmJveFNldHRpbmdzKCBkYXRhLmRpc3BsYXlJbmJveFNldHRpbmdzID8gKCBkYXRhLmRpc3BsYXlJbmJveFNldHRpbmdzLnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpIDogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLm51bWJlck9mTmV3RXZlbnRzICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEubnVtYmVyT2ZOZXdFdmVudHMgPT0gJ3N0cmluZycpe1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldE51bWJlck9mQ29tcGxldGVkRXZlbnRzKCBkYXRhLm51bWJlck9mTmV3RXZlbnRzICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5hdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5hdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyggZGF0YS5hdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPyAoIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93LnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmFnZW5jeUNvbmZpZ3VyYXRpb24gIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uID09ICdvYmplY3QnKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBZ2VuY3lDb25maWd1cmF0aW9uKCBkYXRhLmFnZW5jeUNvbmZpZ3VyYXRpb24gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmV4dGVybmFsQXBwcyE9PXVuZGVmaW5lZCApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBleHRlcm5hbEFwcHMgPSBkYXRhLmV4dGVybmFsQXBwcztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBkYXRhLmV4dGVybmFsQXBwcyApICkgZXh0ZXJuYWxBcHBzID0gWyBkYXRhLmV4dGVybmFsQXBwcyBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgZXh0ZXJuYWxBcHBzID0gZGF0YS5leHRlcm5hbEFwcHM7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdleHRlcm5hbEFwcHMnIClcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBleHRlcm5hbEFwcHMgKVxyXG5cclxuICAgICAgICAgICAgICAgIGV4dGVybmFsQXBwcy5mb3JFYWNoKGZ1bmN0aW9uICggZXh0ZXJuYWxBcHAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGV4dGVybmFsQXBwLmV4dGVybmFsQXBwICkgKSBleHRlcm5hbEFwcC5leHRlcm5hbEFwcCA9IFsgZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFwcCA9IGV4dGVybmFsQXBwLmV4dGVybmFsQXBwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ2FwcCcgKVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBhcHAgKVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGFwcC5mb3JFYWNoKGZ1bmN0aW9uICggdGhpc19hcHAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICd0aGlzX2FwcCcgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggdGhpc19hcHAgKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnbGV4aXR5JykgaXNfbGV4aXR5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnd2VlYmx5JykgaXNfd2VlYmx5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnZXRzeScpIGlzX2V0c3lfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdzaG9waWZ5JykgaXNfc2hvcGlmeV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2JpZ2NvbW1lcmNlJykgaXNfYmlnY29tbWVyY2VfdXNlciA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSAgXHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZV9zZXR0aW5nc193aW5kb3cgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5nZXRTZXR0aW5ncyhmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2V0dGluZ3NXaW5kb3coKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggcmVzcC5hZ2VuY3lOdW1iZXJPZkNsaWVudHMgIT09IHVuZGVmaW5lZCApICQoJy5wbGFuLXVzYWdlIC5icmFuZC11c2FnZSAudmFsdWUnKS50ZXh0KCByZXNwLmFnZW5jeU51bWJlck9mQWN0aXZlQ2xpZW50cysgJy8nICtyZXNwLmFnZW5jeU51bWJlck9mQ2xpZW50cyApO1xyXG5cclxuICAgICAgICAgICAgLy9zZXR0aW5nc1dpbmRvd051bWJlcnMoIHJlc3AgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuZ2V0TGljZW5zZU9wdGlvbnMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBsaWNlbnNlT3B0aW9ucztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19ldHN5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19ldHN5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfd2VlYmx5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc193ZWVibHlfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19sZXhpdHlfdXNlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX2xleGl0eV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3Nob3BpZnlfdXNlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX3Nob3BpZnlfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19iaWdjb21tZXJjZV91c2VyPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19iaWdjb21tZXJjZV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEV4dGVybmFsQXBwcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGV4dGVybmFsQXBwcztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5jaGVja0xpY2Vuc2VWaWV3ID0gZnVuY3Rpb24gKCBpZCwgaXNfd2l4LCBtaXhwYW5lbF90eXBlIClcclxuICAgIHtcclxuICAgICAgICAvLyBpZiggbGljZW5zZU9wdGlvbnMudmlldyAhPSB1bmRlZmluZWQgJiYgbGljZW5zZU9wdGlvbnMudmlldyA9PSAnN0QtT25seScgJiYgaWQgIT0gJzdEJylcclxuICAgICAgICBpZiAoIGZhbHNlICkgLy8gZW5hYmxlIGFsbCB0aW1lZnJhbWVzXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyQod2luZG93KS50cmlnZ2VyKCd1cGdyYWRlLXBvcHVwJywgbWl4cGFuZWxfdHlwZSk7XHJcbiAgICAgICAgICAgIHNob3dVcGdyYWRlV2luZG93KGlzX3dpeCk7XHJcbiAgICAgICAgICAgIHJldHVybiBGQUlMOyAgICBcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2UgcmV0dXJuIFNVQ0NFU1M7ICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRfdXNlcl9pbmJveF90YWdzID0gZnVuY3Rpb24oIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0VXNlckV2ZW50cycsXHJcbiAgICAgICAgICAgIHN0YXJ0VGltZTogJzAnLFxyXG4gICAgICAgICAgICBlbmRUaW1lOiAnMCcsXHJcbiAgICAgICAgICAgIHJlcXVlc3RfYWN0aW9uOiAnZ2V0VXNlclRhZ3MnLFxyXG4gICAgICAgICAgICBtYXhFdmVudHM6ICcxJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBHRVQsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvdXNlckV2ZW50cycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai50YWdzICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggb2JqLnRhZ3MgKSApIHVzZXJfaW5ib3hfdGFncyA9IG9iai50YWdzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApO1xyXG4gICAgICAgIH0pOyAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaW5ib3hfdGFncyA9IGZ1bmN0aW9uICggKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB1c2VyX2luYm94X3RhZ3M7ICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVfaW5ib3hfdGFncyA9IGZ1bmN0aW9uKCB0YWdzLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdGFncyA9IEFycmF5LmlzQXJyYXkoIHRhZ3MgKSA/dGFnczpbXTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFBPU1QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJ3VzZXIvZXZlbnRzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTp7IHRhZ3M6IHRhZ3MgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggb2JqICl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gb2JqIHx8IHt9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9JZiBzdWNjZXNzLCB1cGRhdGUgdGFncyBhcnJheVxyXG4gICAgICAgICAgICBpZiAoIGRhdGEucmV0dXJuQ29kZSA9PSAnU1VDQ0VTUycgKVxyXG4gICAgICAgICAgICAgICAgdXNlcl9pbmJveF90YWdzID0gdGFncztcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gW1xyXG4gICAgICAgICAgICAgICAgICAgICckaHR0cCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICckc3RhdGUnLCBcclxuICAgICAgICAgICAgICAgICAgICAnJHJvb3RTY29wZScsIFxyXG4gICAgICAgICAgICAgICAgICAgICckdXJsUm91dGVyJywgXHJcbiAgICAgICAgICAgICAgICAgICAgJ0VDJywgXHJcbiAgICAgICAgICAgICAgICAgICAgJ2FwaVVybCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdGYWNlYm9va0ZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdMaW5rZWRpbkZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUd2l0dGVyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdCbG9nZ2VyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdHb29nbGVQbHVzRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1lvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAnUGludGVyZXN0RmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ0luc3RhZ3JhbUZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICckaW5qZWN0b3InLCBcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGh0dHAsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVybFJvdXRlciwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVDLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpVXJsLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgRmFjZWJvb2tGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgTGlua2VkaW5GZWVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBUd2l0dGVyRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEJsb2dnZXJGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgR29vZ2xlUGx1c0ZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBZb3VUdWJlRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFBpbnRlcmVzdEZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBJbnN0YWdyYW1GZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGluamVjdG9yIClcclxue1xyXG5cclxuICAgIGZ1bmN0aW9uIFNvY2lhbCggcHJvZmlsZSApXHJcbiAgICB7XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucHJvZmlsZSA9IHByb2ZpbGUgfHwge307XHJcblxyXG4gICAgICAgIC8vIHRoaXMuZmVlZHMgPSB7fTtcclxuICAgICAgICB0aGlzLmZlZWRzX2luX29yZGVyID0gW107XHJcblxyXG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcnZhbCA9IDA7XHJcblxyXG4gICAgICAgIC8vSW5ib3ggZmlsdGVyc1xyXG4gICAgICAgIHRoaXMudXNlcl9pbmJveF9maWx0ZXJzID0gW107Ly9nZXRfdXNlcl9pbmJveF9maWx0ZXJzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yID0gMDsgXHJcbiAgICAgICAgdGhpcy5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciA9IHRydWU7IFxyXG4gICAgfVxyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUucGFnZXMgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5wYWdlcztcclxuICAgIH07XHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICBjb25zb2xlLmRpciggdGhpcyApO1xyXG4gICAgfTtcclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oIGNvbnRhaW5lciApe1xyXG5cclxuICAgICAgICB2YXIgJGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCAkKCcjc29jaWFsJyk7XHJcblxyXG4gICAgICAgICRjb250YWluZXIuaHRtbCgnJyk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgICAgICAvL0Fzc2lnbiBpdCB0byBnbG9iYWwgb2JqZWN0IFxyXG4gICAgICAgIC8vd2luZG93Lmdsb2JhbHMuc29jaWFsID0gdGhpczsgXHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgcHJldmlvdXNfZmVlZHMgPSBbXSxcclxuICAgICAgICAgICAgbmV3X3N0cmVhbXNfb3JkZXIgPSBbXSxcclxuICAgICAgICAgICAgcHJldl9mZWVkc19pbl9vcmRlciA9IHNlbGYuZmVlZHNfaW5fb3JkZXI7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuc29jaWFsID0gc2VsZjtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyID0gW107XHJcblxyXG4gICAgICAgIC8vZ2V0IG5ldyBzdHJlYW1zIG9yZGVyXHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKCBzZWxmLnByb2ZpbGUuc3RyZWFtcywgZnVuY3Rpb24oIHRoaXNfc3RyZWFtICl7XHJcbiAgICAgICAgICAgIHZhciBpZCA9ICggWydyc3MnLCAnc2VhcmNoJywgJ291dHJlYWNoJ10uaW5kZXhPZiggdGhpc19zdHJlYW0uc3RyZWFtSWQgKSA+IC0xICkgPyB0aGlzX3N0cmVhbS5pZCA6IHRoaXNfc3RyZWFtLnN0cmVhbUlkO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoIHNlbGYucHJvZmlsZS5pZC5pbmRleE9mKCdmYXZvcml0ZScpICE9PSAtMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkICs9ICdfJyArICB0aGlzX3N0cmVhbS5wcm9maWxlLmlkICsgJ18nICsgdGhpc19zdHJlYW0ubmV0d29yaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZXdfc3RyZWFtc19vcmRlci5wdXNoKCBpZCApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKG5ld19zdHJlYW1zX29yZGVyKTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gc2VsZi5wcm9maWxlLnN0cmVhbXMubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0aGlzX3N0cmVhbSA9IHNlbGYucHJvZmlsZS5zdHJlYW1zWyBpIF0sXHJcbiAgICAgICAgICAgICAgICBpZCA9ICggWydyc3MnLCAnc2VhcmNoJywgJ291dHJlYWNoJ10uaW5kZXhPZiggdGhpc19zdHJlYW0uc3RyZWFtSWQgKSA+IC0xICkgPyB0aGlzX3N0cmVhbS5pZCA6IHRoaXNfc3RyZWFtLnN0cmVhbUlkLFxyXG4gICAgICAgICAgICAgICAgbmV0d29yayA9IHNlbGYucHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIG5ld19mZWVkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzX3N0cmVhbS52YWx1ZSA9PSAndHJ1ZScgIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FBQTo6JytuZXR3b3JrKTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIG5ldHdvcmsgKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRkIgdGVzdDo6OicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBGYWNlYm9va0ZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbGlua2VkaW4nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBMaW5rZWRpbkZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndHdpdHRlcic6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBUd2l0dGVyRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdibG9nZ2VyJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IEJsb2dnZXJGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dvb2dsZXBsdXMnOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgR29vZ2xlUGx1c0ZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneW91dHViZSc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBZb3VUdWJlRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdwaW50ZXJlc3QnOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgUGludGVyZXN0RmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdpbnN0YWdyYW0nOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgSW5zdGFncmFtRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldChuZXdfZmVlZC5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG5ld19mZWVkICYmICRzdGF0ZS5nZXQobmV3X2ZlZWQucGFnZV9pZCkgPT09IG51bGwgKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyLnB1c2goIG5ld19mZWVkICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG5ld19mZWVkLnJlbmRlciA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdmFyICRuZXdfZmVlZCA9IG5ld19mZWVkLnJlbmRlcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyRjb250YWluZXIuYXBwZW5kKCAkbmV3X2ZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiggbmV3X2ZlZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IF8uZmluZExhc3RJbmRleChwcmV2X2ZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiBuZXdfZmVlZC5wYWdlX2lkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIGluZGV4ID49IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mZWVkc19pbl9vcmRlci5wdXNoKHByZXZfZmVlZHNfaW5fb3JkZXJbaW5kZXhdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdXBkYXRlZF9zdHJlYW1zX29yZGVyID0gW107XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGYuZmVlZHNfaW5fb3JkZXIsIGZ1bmN0aW9uKHRoaXNfZmVlZCl7XHJcbiAgICAgICAgICAgIHVwZGF0ZWRfc3RyZWFtc19vcmRlci5wdXNoKHRoaXNfZmVlZC5wYWdlX2lkKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgICAgICAvL0RlY2lkZSB0aGUgZmVlZCBwYWdlIHRvIHNob3cgYnkgZGVmYXVsdFxyXG4gICAgICAgIHZhciBmZWVkX3BhZ2VfdG9fc2hvdyA9ICcnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vdG8gbWFpbnRhaW4gbGFzdCBmZWVkLXNlbGVjdG9yIHBvc2l0aW9uXHJcbiAgICAgICAgaWYoIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgJiYgc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yID09PSAwICkgXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiggc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfcGFnZV90b19zaG93ID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyW3NlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3Rvcl07XHJcblxyXG4gICAgICAgICAgICBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgPSAwOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWRfc2VsZWN0b3JfaW5pdGlhbF90cmlnZ2VyID09PSBmYWxzZSApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbdXBkYXRlZF9zdHJlYW1zX29yZGVyLmxlbmd0aC0xXTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL2Fzc2lnbiB1cGRhdGVkIHN0cmVhbXMgdG8gY3VycmVudCBvYmplY3RcclxuICAgICAgICBzZWxmLnVwZGF0ZWRfc3RyZWFtc19vcmRlciA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlcjtcclxuXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE9iaihpZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF8uZmluZExhc3RJbmRleChzZWxmLmZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiBpZH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gc2VsZi5mZWVkc19pbl9vcmRlcltpbmRleF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKmNvbnNvbGUubG9nKCd1cGRhdGVkX3N0cmVhbXNfb3JkZXInKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1cGRhdGVkX3N0cmVhbXNfb3JkZXIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGZlZWRfcGFnZV90b19zaG93KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhnZXRPYmooZmVlZF9wYWdlX3RvX3Nob3cpKTsqL1xyXG4gICAgICAgIHZhciBjdXJyZW50X29iaiA9IHsnbmFtZSc6J3JhbSd9Oy8vZ2V0T2JqKGZlZWRfcGFnZV90b19zaG93KTtcclxuXHJcbiAgICAgICAgJHN0YXRlLmdvKGZlZWRfcGFnZV90b19zaG93LCB7b2JqOmN1cnJlbnRfb2JqfSwge2NhY2hlOiB0cnVlfSk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCd0aGlzLmZlZWRzX2luX29yZGVyJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5mZWVkc19pbl9vcmRlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7ICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG4gICAgXHJcblxyXG5cclxuICAgIFxyXG5cclxuXHJcbiAgICByZXR1cm4gU29jaWFsO1xyXG59XTtcclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZmVlZF9pdGVtID0gJyc7XHJcblxyXG4gICAgICAgIHNlbGYuZGF0YSA9IGl0ZW1fZGF0YTtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQgPSBmZWVkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYucHJvZmlsZSA9IGZlZWQucHJvZmlsZTtcclxuXHJcbiAgICAgICAgc2VsZi5lbGVtZW50ID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBGZWVkSXRlbSA9ICBGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgVGltZWxpbmVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdUaW1lbGluZUZlZWRJdGVtJyk7XHJcblxyXG4gICAgZnVuY3Rpb24gSW5zdGFncmFtRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbnN0YWdyYW1GZWVkSXRlbTtcclxuICAgXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHM7XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlckNvbW1lbnQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXJDb21tZW50O1xyXG4gICBcclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcztcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUuYWRkX2NvbW1lbnQgPSBmdW5jdGlvbiAoIG1lc3NhZ2UgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBodF9leHAgPSAvXFxCIyhcXHcqW2EtekEtWl0rXFx3KikvaWcsXHJcbiAgICAgICAgICAgIGxpbmtzX2V4cCA9IC8oXFxiKGh0dHBzP3xmdHB8ZmlsZSk6XFwvXFwvWy1BLVowLTkrJkAjXFwvJT89fl98ITosLjtdKlstQS1aMC05KyZAI1xcLyU9fl98XSkvaWc7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gSW5zdGFncmFtRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBDb2xsYXBzaWJsZUZlZWRJdGVtID0gIENvbGxhcHNpYmxlRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnQ29sbGFwc2libGVGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgVGltZWxpbmVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdUaW1lbGluZUZlZWRJdGVtJyk7XHJcblxyXG4gICAgZnVuY3Rpb24gVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgICBcclxuICAgIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxuICAgIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5hZGRfY29tbWVudCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmFkZF9jb21tZW50O1xyXG5cclxuICAgIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5kZWxldGVfbWVzc2FnZSA9IGZ1bmN0aW9uICggJHR3ZWV0LCBpZCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIHRleHQgPSAnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIGRlbGV0ZSB0aGlzIHBvc3QgPyc7XHJcbiAgICAgICAgXHJcbiBcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5yZXR3ZWV0O1xyXG5cclxuICAgIFxyXG5cclxuICAgIHJldHVybiBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEJsb2dnZXJGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJsb2dnZXJGZWVkO1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdibF9hbGwnOiB0aGlzLmdldEJsb2dQb3N0cygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmdldEJsb2dQb3N0cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QmxvZ2dlclBvc3RzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWRcclxuICAgICAgICAgICAgLy9uZXh0OiB0aGlzLm5leHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvYmxvZ2dlcicsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWMqKioqKioqKioqKioqKioqICBnZXRCbG9nZ2VyUG9zdHMnLCdjb2xvcjogY3JpbXNvbicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5uZXh0ICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubmV4dCA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLm5leHQgKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICByZXR1cm47ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEJsb2dnZXJQb3N0cycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBuZXh0OiB0aGlzLm5leHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvYmxvZ2dlcicsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVjKioqKioqKioqKioqKioqKiAgZ2V0QmxvZ2dlclBvc3RzIE5FWFQgJywnY29sb3I6IGNyaW1zb24nKTtcclxuICAgICAgICAgICAgY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoubmV4dCAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHBwID0gdGhpc19kYXR1bS5wcm9maWxlUGljP3RoaXNfZGF0dW0ucHJvZmlsZVBpYzonJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYoIHBwLmluZGV4T2YoJy8vJykgPT09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ucHJvZmlsZVBpYyA9IHRoaXNfZGF0dW0ucHJvZmlsZVBpYy5yZXBsYWNlKCcvLycsICdodHRwczovLycpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IGRhdGE7XHJcblxyXG4gICAgICAgIGlmICggXy5pc0VtcHR5KCBkYXRhLm5hbWUgKSApIGRhdGEubmFtZSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYoIHR5cGVvZiBkYXRhLm1lc3NhZ2UgPT0gJ3N0cmluZycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgPSAvKic8YSBjbGFzcz1cInJzcy1pdGVtLXRpdGxlXCIgaHJlZj1cIicgK2RhdGEucGVybWFsaW5rKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArZGF0YS5uYW1lKyAnPC9hPicgKyAqL1xyXG4gICAgICAgICAgICBkYXRhLm1lc3NhZ2VcclxuICAgICAgICAgICAgLnJlcGxhY2UoLzxoXFxkL2dpLCc8ZGl2JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoLzxcXC9oXFxkPi9naSwnPC9kaXY+JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL2NsYXNzPVwiXFx3KlwiL2dpLCcnKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvc3R5bGU9L2dpLCAnZGF0YS1zPScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC93aWR0aD0vZ2ksICdkYXRhLXc9JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL2hlaWdodD0vZ2ksICdkYXRhLWg9JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL2EgaHJlZi9naSwgJ2EgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZicpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC88YnJcXHMqW1xcL10/Pi9naSwgJzxzcGFuPjwvc3Bhbj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZXNzYWdlID0gZGF0YS5tZXNzYWdlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07ICBcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEJsb2dnZXJGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBDb2xsYXBzaWJsZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxuICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5yZXR3ZWV0O1xyXG4gICAgXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5mYXZvcml0ZSA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmZhdm9yaXRlO1xyXG5cclxuICAgIHJldHVybiBDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gIFRpbWVsaW5lRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG4gICAgXHJcblxyXG4gICAgZnVuY3Rpb24gRHJvcGRvd25GZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG5cclxuICAgICAgICB0aGlzLm5leHQgPSAnJztcclxuICAgICAgICB0aGlzLmRlZmF1bHRfZWxlbWVudCA9IGZlZWQuZGVmYXVsdF9lbGVtZW50IHx8ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgICBcclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRHJvcGRvd25GZWVkSXRlbTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cztcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcztcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5nZXRfZHJvcGRvd24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZHJvcGRvd24gPSBbXSxcclxuICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmRhdGEubGVuZ3RoID4gMCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZWxmLmRhdGEgPSBzZWxmLmRhdGEuc29ydChmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVBID0gKCB0eXBlb2YgYS5uYW1lID09PSAnc3RyaW5nJyA/IGEubmFtZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lQiA9ICggdHlwZW9mIGIubmFtZSA9PT0gJ3N0cmluZycgPyBiLm5hbWUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBuYW1lQSA+IG5hbWVCICkgcmV0dXJuIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIG5hbWVBIDwgbmFtZUIgKSByZXR1cm4gLTE7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZGF0YSA9IHNlbGYuZGF0YS5zb3J0KGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lQSA9ICggdHlwZW9mIGEuY2hhbm5lbFRpdGxlID09PSAnc3RyaW5nJyA/IGEuY2hhbm5lbFRpdGxlLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lQiA9ICggdHlwZW9mIGIuY2hhbm5lbFRpdGxlID09PSAnc3RyaW5nJyA/IGIuY2hhbm5lbFRpdGxlLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIG5hbWVBID4gbmFtZUIgKSByZXR1cm4gMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIG5hbWVBIDwgbmFtZUIgKSByZXR1cm4gLTE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gc2VsZi5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX2dyb3VwID0gc2VsZi5kYXRhWyBpIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBfaWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNfZ3JvdXAgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzX2dyb3VwLmNoYW5uZWxJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpc19ncm91cC5jaGFubmVsVGl0bGVcclxuICAgICAgICAgICAgICAgICAgICB9OyAgXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBncm91cF9pZCA9IHRoaXNfZ3JvdXAuaWQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJyApIGdyb3VwX2lkID0gdGhpc19ncm91cC5pZF9zdHI7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGRyb3Bkb3duLnB1c2goeydpZCc6Z3JvdXBfaWQsICduYW1lJzp0aGlzX2dyb3VwLm5hbWUsICdkYXRhJzp0aGlzX2dyb3VwfSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2goIHRoaXMuZmVlZC5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xpc3RzJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaV9ib2FyZCc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9ICdZb3UgZG8gbm90IGhhdmUgYm9hcmRzIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzJzpcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzX29ubHknOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0nWW91IGRvIG5vdCBoYXZlIHBhZ2VzIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xuX2NvbXBhbmllcyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGRvIG5vdCBmb2xsb3cgYW55IGNvbXBhbnkgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teVN1YnNjcmlwdGlvbic6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGhhdmVuXFwndCBhZGRlZCBhbnkgc3Vic2NyaXB0aW9ucyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZiX2xpa2VzJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICgnWW91IGhhdmVuXFwndCBsaWtlZCBhbnkgcGFnZXMgeWV0LicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgYXJlIG5vdCBhIG1lbWJlciBvZiBhbnkgZ3JvdXBzLic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7ICdjb3VudCc6ZHJvcGRvd24ubGVuZ3RoLCAnZGF0YSc6ZHJvcGRvd24sICdwbGFjZWhvbGRlcic6IHBsYWNlaG9sZGVyfTtcclxuICAgIH07XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuc2V0X2RlZmF1bHRfZ3JvdXBfaWQgPSBmdW5jdGlvbiAoIHNlbF9vYmogKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgJF90aGlzID0gc2VsX29iajtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkX3RoaXMuZGF0YS5pZDtcclxuXHJcbiAgICAgICAgc2VsZi5uZXh0ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRlbG0uZGF0YSgnZGF0YScpLmlkX3N0cjtcclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQuaWQgPT0gJ2xpc3RzJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5wcm9maWxlLmxpc3RzLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkOyAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXR0aW5nIG9mIGRlZmF1bHQgZ3JvdXAgaWRcclxuICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZC5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQudXBkYXRlRmVlZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLnVwZGF0ZUludGVydmFsSUQgPSBzZXRJbnRlcnZhbCggdXBkYXRlRmVlZE5vdGlmaWNhdGlvbiwgNSo2MCoxMDAwLCBzZWxmLmZlZWQgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnc2V0RGVmYXVsdEdyb3VwSWQnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgLy9kZWZhdWx0R3JvdXBJZDogJCggdGhpcyApLmRhdGEoJ2RhdGEnKS5pZCxcclxuICAgICAgICAgICAgZGVmYXVsdEdyb3VwSWQ6IHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkLFxyXG4gICAgICAgICAgICBuZXR3b3JrOiBzZWxmLmZlZWQubmV0d29ya1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHVybDogXCJmZWVkL2RlZmF1bHRHcm91cElkXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vY29uc29sZS5sb2coICdzZXR0aW5nIHNldERlZmF1bHRHcm91cElkOiAnICsgZ3JvdXBfaWQgKVxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLyp2YXIgZGF0YSA9IEpTT04ucGFyc2UoIHJlc3AgKTtcclxuICAgICAgICAgICAgY29uc29sZS5kaXIoICdzZXQgcmVzcG9uc2U6JyApXHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCBkYXRhICkqL1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIHNlbF9vYmogKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgJF90aGlzID0gc2VsX29iajtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkX3RoaXMuZGF0YS5pZDtcclxuXHJcbiAgICAgICAgc2VsZi5uZXh0ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRlbG0uZGF0YSgnZGF0YScpLmlkX3N0cjtcclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQuaWQgPT0gJ2xpc3RzJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5wcm9maWxlLmxpc3RzLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkOyAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9zZXR0aW5nIG9mIGRlZmF1bHQgZ3JvdXAgaWRcclxuICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZC5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQudXBkYXRlRmVlZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLnVwZGF0ZUludGVydmFsSUQgPSBzZXRJbnRlcnZhbCggdXBkYXRlRmVlZE5vdGlmaWNhdGlvbiwgNSo2MCoxMDAwLCBzZWxmLmZlZWQgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHsgdHlwZTogJ0dFVCcgfSxcclxuICAgICAgICAgICAgZGF0YSA9IHt9O1xyXG5cclxuICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6ICRfdGhpcy5kYXRhLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJHcm91cCcsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0OiBzZWxmLm5leHRcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHJlcXVlc3QudXJsID0gJ2ZlZWQvZmJHcm91cCc7XHJcblxyXG4gICAgICAgIHJlcXVlc3QuZGF0YSA9IGRhdGE7XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwLFxyXG4gICAgICAgICAgICAgICAgaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2xpbmtlZGluJyApIHNlbGYubmV4dCA9IDI1O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLnZhbHVlcyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ2xpbmtlZGluJykgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gZGF0YS52YWx1ZXNbIDAgXS5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIG0gPSBkYXRhLnZhbHVlcy5sZW5ndGg7IGogPCBtOyBqKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX3ZhbCA9IGRhdGEudmFsdWVzWyBqIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdW1tYXJ5ID0gdGhpc192YWwuc3VtbWFyeSB8fCAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlX3N1bW1hcnkgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX3ZhbC51cGRhdGVDb250ZW50ICE9PSB1bmRlZmluZWQgJiYgdGhpc192YWwudXBkYXRlQ29udGVudC5jdXJyZW50VXBkYXRlICE9PSB1bmRlZmluZWQgJiYgdGhpc192YWwudXBkYXRlQ29udGVudC5jdXJyZW50VXBkYXRlLmNvbnRlbnQgIT09IHVuZGVmaW5lZCkgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnQgPSB0aGlzX3ZhbC51cGRhdGVDb250ZW50LmN1cnJlbnRVcGRhdGUuY29udGVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggY29udGVudC50aXRsZSAhPT0gdW5kZWZpbmVkICYmIGNvbnRlbnQuc3VibWl0dGVkVXJsICE9PSB1bmRlZmluZWQgJiYgISgvXFwuKGpwZ3xqcGVnfHBuZ3xibXB8dGlmZnxhdml8bXBlZ3xta3Z8b2dnfG1vdnxtcGVnfG1wZ3xtcGV8Zmx2fDNncHxnaWYpJC9pKS50ZXN0KGNvbnRlbnQudGl0bGUpICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZV9zdW1tYXJ5ID0gJzxhIGhyZWY9XCJqYXZhc2NyaXB0OjtcIiBvbkNsaWNrPVwiRUMuVUkuSUFCKFxcJycgKyBjb250ZW50LnN1Ym1pdHRlZFVybCArICdcXCcpO1wiPicgKyBjb250ZW50LnRpdGxlICsgJzwvYT4gJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5kYXRhWyBqIF0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzX3ZhbC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICc8cD48c3BhbiBjbGFzcz1cImxuLWdyb3VwLXRpdGxlXCI+JyArIHRoaXNfdmFsLnRpdGxlICsgJzo8L3NwYW4+PC9wPicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZV9zdW1tYXJ5OiBwcmVfc3VtbWFyeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogc3VtbWFyeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbU5hbWU6ICggdGhpc192YWwuY3JlYXRvci5maXJzdE5hbWUudG9Mb3dlckNhc2UoKSA9PSAncHJpdmF0ZScgPyB0aGlzX3ZhbC5jcmVhdG9yLmZpcnN0TmFtZSA6IHRoaXNfdmFsLmNyZWF0b3IuZmlyc3ROYW1lICsgJyAnICsgdGhpc192YWwuY3JlYXRvci5sYXN0TmFtZSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlUGljOiB0aGlzX3ZhbC5jcmVhdG9yLnBpY3R1cmVVcmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRpbWU6IHBhcnNlSW50KCB0aGlzX3ZhbC5jcmVhdGlvblRpbWVzdGFtcCApIC8gMTAwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbUlkOiB0aGlzX3ZhbC5jcmVhdG9yLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRoaXNfdmFsLmNvbW1lbnRzLl90b3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnQ6IHRoaXNfdmFsLmNvbW1lbnRzLnZhbHVlcyB8fCBbXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaWtlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRoaXNfdmFsLmxpa2VzLl90b3RhbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpa2U6ICggdGhpc192YWwubGlrZXMudmFsdWVzID09PSB1bmRlZmluZWQgPyBbXSA6IHRoaXNfdmFsLmxpa2VzLnZhbHVlcy5jcmVhdG9yICkgfHwgW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpb25zaGlwOiB0aGlzX3ZhbC5yZWxhdGlvblRvVmlld2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyX2xpa2VzOiB0aGlzX3ZhbC5yZWxhdGlvblRvVmlld2VyLmlzTGlrZWQgfHwgXCJmYWxzZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSAyNTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhLm5leHRUb2tlbjtcclxuICAgICAgICAgICAgICAgIGRhdGEuZGF0YSA9IGRhdGEuZGF0YS5pdGVtcztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApIHNlbGYubmV4dCA9IGRhdGEubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ3BpbnRlcmVzdCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEucmV0dXJuQ29kZSA9PT0gJ0ZBSUwnIHx8ICggZGF0YS5kYXRhLnN0YXR1cyAmJiBkYXRhLmRhdGEuc3RhdHVzID09PSAnZmFpbHVyZScgKSApIGRhdGEuZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IGRhdGEuZGF0YS5wYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcGFnZSAmJiBwYWdlLmN1cnNvciApIHNlbGYubmV4dCA9IHBhZ2UuY3Vyc29yO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZGF0YSA9IGRhdGEuZGF0YS5kYXRhOyAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gZGF0YS5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBkYXRhLmRhdGEgKSApIGl0ZW1zID0gWyBkYXRhLmRhdGEgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGl0ZW1zID0gZGF0YS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaXRlbXMubGVuZ3RoID4gMCApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBpdGVtc1sgMCBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAnbGlua2VkaW4nICkgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gaXRlbXNbIDAgXS5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAnZ29vZ2xlcGx1cycgKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBpdGVtc1sgMCBdLnBvc3RJRDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBuZXdfZ3JvdXAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicpIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gaXRlbXNbIGkgXS5pZF9zdHI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyOiBpdGVtc1sgaSBdLnVzZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlVGltZTogKCBuZXcgRGF0ZSggaXRlbXNbIGkgXS5jcmVhdGVkX2F0ICkuZ2V0VGltZSgpIC8gMTAwMCApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhdm9yaXRlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogaXRlbXNbIGkgXS5mYXZvcml0ZV9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnlfbWU6IGl0ZW1zWyBpIF0uZmF2b3JpdGVkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR3ZWV0czoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogaXRlbXNbIGkgXS5yZXR3ZWV0X2NvdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBieV9tZTogaXRlbXNbIGkgXS5yZXR3ZWV0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAoICggaXRlbXNbIGkgXS5yZXR3ZWV0ZWRfc3RhdHVzICE9PSB1bmRlZmluZWQgKSA/IGl0ZW1zWyBpIF0ucmV0d2VldGVkX3N0YXR1cy5pZF9zdHIgOiBpdGVtc1sgaSBdLmlkX3N0ciApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBpdGVtc1sgaSBdLnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbU5hbWU6ICggaXRlbXNbIGkgXS5uYW1lIHx8IGl0ZW1zWyBpIF0udXNlci5uYW1lICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6ICggaXRlbXNbIGkgXS5zY3JlZW5fbmFtZSB8fCBpdGVtc1sgaSBdLnVzZXIuc2NyZWVuX25hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlUGljOiAoIGl0ZW1zWyBpIF0ucHJvZmlsZV9pbWFnZV91cmwgfHwgaXRlbXNbIGkgXS51c2VyLnByb2ZpbGVfaW1hZ2VfdXJsICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zdElEOiBpdGVtc1sgaSBdLmlkX3N0cixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogaXRlbXNbIGkgXS5pZF9zdHIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3X2RhdGE6IGl0ZW1zWyBpIF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBpdGVtc1sgaSBdLmVudGl0aWVzICE9PSB1bmRlZmluZWQgJiYgaXRlbXNbIGkgXS5lbnRpdGllcy5tZWRpYSAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIGl0ZW1zWyBpIF0uZW50aXRpZXMubWVkaWEubWVkaWFfdXJsICkgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEgPSBzZWxmLmdldF9tZWRpYV9kYXRhKCBpdGVtc1sgaSBdLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQuaWQgPT0gJ2xuX2NvbXBhbmllcycgKSBuZXdfZ3JvdXAgPSBuZXcgTGlua2VkaW5GZWVkSXRlbSggaXRlbXNbIGkgXSwgc2VsZi5mZWVkICk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSBzZWxmLmZlZWQuZm9ybWF0X2l0ZW0oIGl0ZW1zWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0gc2VsZi5mZWVkLmZvcm1hdF9pdGVtKCBpdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApOyAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdwaW50ZXJlc3QnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHNlbGYuZmVlZC5mb3JtYXRfaXRlbSggaXRlbXNbIGkgXSApO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBpdGVtc1sgaSBdLCBzZWxmLmZlZWQgKTsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmVlZC5pdGVtcy5wdXNoKCBuZXdfZ3JvdXAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuZ2V0X21lZGlhX2RhdGEgPSBmdW5jdGlvbiAoIG1lZGlhX3VybHMgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0gW107XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKG1lZGlhX3VybHMsIGZ1bmN0aW9uKG1lZGlhX3VybCl7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAncGhvdG8nLFxyXG4gICAgICAgICAgICAgICAgc3JjOiBtZWRpYV91cmxcclxuICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtO1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBEcm9wZG93bkZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnRHJvcGRvd25GZWVkSXRlbScsICdDb2xsYXBzaWJsZUZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSwgRHJvcGRvd25GZWVkSXRlbSwgQ29sbGFwc2libGVGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEZhY2Vib29rRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBwcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ICE9PSAnVXNlcicgJiYgWyd3YWxsUG9zdHMnLCdmYl9ub3RpZmljYXRpb25zJ10uaW5kZXhPZiggc3RyZWFtLnN0cmVhbUlkICkgIT09IC0xIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmVlZCA9IHRydWU7ICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmFjZWJvb2tGZWVkO1xyXG5cclxuICAgIC8qRmFjZWJvb2tGZWVkLnByb3RvdHlwZS51cGRhdGVGZWVkTm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMgXHJcbiAgICAgICAgICAgICxjdXJyZW50SUQgPSBzZWxmLnVwZGF0ZUludGVydmFsSUQ7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXROZXdzRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiAnL2FqYXgucGhwJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoIHNlbGYuaWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnd2FsbFBvc3RzJzogcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICd3YWxsUG9zdHMnOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLndhbGwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEubGltaXQgPSAxMDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYl9ub3RpZmljYXRpb25zJzogcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdub3RpZmljYXRpb25zJzsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5saW1pdCA9IDEwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2luQm94JzogcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdpbkJveCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjdGlvbiA9ICdnZXRGYkNvbnZlcnNpb25zJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoIHNlbGYucHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSA9PT0gXCJVc2VyXCIpIHJlcXVlc3QuZGF0YS5uZXh0ID0gXCIvaW5ib3hcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5uZXh0ID0gXCIvY29udmVyc2F0aW9uc1wiO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnJWN1cGRhdGVGZWVkTm90aWZpY2F0aW9uKCcgKyBzZWxmLmlkICsgJykgcmVzcG9uc2U6JywgJ2NvbG9yOm9yYW5nZXJlZCcpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBjdXJyZW50SUQgPT09IHNlbGYudXBkYXRlSW50ZXJ2YWxJRCApIC8vIGRpZG4ndCByZWZyZXNoIGR1cmluZyByZXF1ZXN0XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdElEID0gJyMjIyc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5maXJzdEl0ZW1JRCApIGZpcnN0SUQgPSBzZWxmLmZpcnN0SXRlbUlEO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdmaXJzdElEIDo6ICcgKyBmaXJzdElEKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtaW5jb21pbmcgPSBbXTsgLy8gaW5jb21pbmcgbWVzc2FnZXMgYXJyYXlcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ2luQm94JyAmJiBmaXJzdElEICE9PSAnIyMjJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1c2VySWQgPSBzZWxmLnByb2ZpbGUuZGF0YS5wYWdlSWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb21tZW50cyA9IGRhdGEuZGF0YVsgaSBdLmNvbW1lbnRzLmNvbW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggY29tbWVudHMgKSApIGNvbW1lbnRzID0gWyBjb21tZW50cyBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBrID0gMCwgbGwgPSBjb21tZW50cy5sZW5ndGg7IGsgPCBsbDsgaysrIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19jb21tZW50ID0gY29tbWVudHNbIGsgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2NvbW1lbnQuZnJvbUlkICE9PSBjdXNlcklkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmNvbWluZy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXNfY29tbWVudCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggdGhpc19jb21tZW50LmNyZWF0ZWRUaW1lLnNwbGl0KCcrJylbIDAgXSApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzX2NvbW1lbnQubWVzc2FnZUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBtaW5jb21pbmcgKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gbWluY29taW5nLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gKCBpdGVtLnRpbWUgPiBmaXJzdElEID8gMSA6IDAgKTt9KS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSArIGI7IH0sIDApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ2luQm94IGluZGV4ID0gJyArIGluZGV4ICk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAgbWluY29taW5nLmxlbmd0aCApIHNlbGYuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuIGl0ZW0uaWQ7fSkuaW5kZXhPZiggZmlyc3RJRCApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gLTEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBmaXJzdElEID09PSAnIyMjJyApIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnaW5kZXggOjogJyArIGluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRoZWFkZXIgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaGVhZGVyJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLCRmYm9keSA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkdXBkYXRlX25vdGlmID0gJGZib2R5LmZpbmQoJy51cGRhdGUtbm90aWZpY2F0aW9uJyk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICR1cGRhdGVfbm90aWYubGVuZ3RoID09PSAwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYgPSAkKCc8ZGl2IGNsYXNzPVwidXBkYXRlLW5vdGlmaWNhdGlvblwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmLm9uKCdjbGljaycsIGZ1bmN0aW9uICggZSApeyAkaGVhZGVyLmZpbmQoJy5yZWZyZXNoLWZlZWQnKS50cmlnZ2VyKCdjbGljaycpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGZib2R5LmZpbmQoJy5mZWVkLWl0ZW0nKS5maXJzdCgpLmJlZm9yZSggJHVwZGF0ZV9ub3RpZiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ2luQm94JyApICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gbWluY29taW5nLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IE1lc3NhZ2UnICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5pZCA9PT0gJ3dhbGxQb3N0cycgKSAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IGRhdGEuZGF0YS5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBQb3N0JyArICggaW5kZXggPT0gMSA/ICcnIDogJ3MnICkgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBkYXRhLmRhdGEubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgTm90aWZpY2F0aW9uJyArICggaW5kZXggPT0gMSA/ICcnIDogJ3MnICkgKTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgY29uc29sZS5lcnJvcignISEhIGN1cnJlbnRJRCAhISEnKTtcclxuICAgICAgICB9KTtcclxuICAgIH07Ki8gIFxyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICduZXdzRmVlZCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJuZXdzRmVlZFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3dhbGxQb3N0cyc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJ3YWxsUG9zdHNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwYWdlc0ZlZWQnOiB0aGlzLmdldE5ld3NGZWVkKFwicGFnZXNGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaW5Cb3gnOiB0aGlzLmdldEZiQ29udmVyc2lvbnMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hpZGRlbl9ncm91cHMnOiB0aGlzLmZpbGxGQkhpZGRlbl9Hcm91cHMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RpbWVsaW5lJzogdGhpcy5nZXROZXdzRmVlZChcInRpbWVsaW5lXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzogdGhpcy5nZXROZXdzRmVlZChcInNlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ291dHJlYWNoJzogdGhpcy5nZXROZXdzRmVlZChcInNlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZiX25vdGlmaWNhdGlvbnMnOiB0aGlzLmdldE5ld3NGZWVkKFwibm90aWZpY2F0aW9uc1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZiX2xpa2VzJzogdGhpcy5nZXROZXdzRmVlZChcImZiX2xpa2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2ZiX2xpa2VzJyB8fCB0aGlzLmlkID09ICdvdXRyZWFjaCcgfHwgKCB0aGlzLmlkID09ICduZXdzRmVlZCcgJiYgIXRoaXMubmV4dCApIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7IFxyXG4gICAgICAgICAgICAvL3RoaXMuaGlkZV9wdWxsdXAoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZG9GYlJlcXVlc3QnLFxyXG4gICAgICAgICAgICAgICAgd2FsbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0cmVhbTogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ25ld3NGZWVkJzpcclxuICAgICAgICAgICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzZWFyY2gnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7IFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBjYXNlICd3YWxsUG9zdHMnOlxyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ3BhZ2VzRmVlZCc6XHJcbiAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAnaW5Cb3gnOlxyXG4gICAgICAgICAgICAvLyAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIpIGRhdGEubmV4dCA9ICcvaW5ib3gnO1xyXG5cclxuICAgICAgICAgICAgLy8gICAgIGVsc2UgZGF0YS5uZXh0ID0gJy9jb252ZXJzYXRpb25zJztcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdoaWRkZW5fZ3JvdXBzJzpcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogc2VsZi5zdHJlYW0uc2VsZWN0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogc2VsZi5uZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgfTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmJfbm90aWZpY2F0aW9ucyc6XHJcbiAgICAgICAgICAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGRhdGEuc3RyZWFtID0gJ25vdGlmaWNhdGlvbnMnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9mYk1vcmUnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkX21vcmVfZmxhZyA9IGZhbHNlOyAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLm5leHQgPT0gZGF0YS5wYWdpbmcubmV4dCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldE5ld3NGZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbSxcclxuICAgICAgICAgICAgbGltaXQ6IDEwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggc3RyZWFtID09ICd3YWxsUG9zdHMnIHx8IHN0cmVhbSA9PSAnZmJfaW5mbHVlbmNlcycgfHwgc3RyZWFtID09ICd0aW1lbGluZScgKSBkYXRhLndhbGwgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbmV3cycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHN0cmVhbSA9PSAnc2VhcmNoJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZSA9PT0gdW5kZWZpbmVkICkgLy9lbXB0eSBzZWFyY2ggZmVlZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnkgIT09IHVuZGVmaW5lZCAmJiBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeS5sZW5ndGggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNlYXJjaF9yZXF1ZXN0KCBzZWxmLCBmdW5jdGlvbiggZGF0YSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL2lmKCBFQy5xdWV1ZV9saXN0WyBCYXNlNjQuZW5jb2RlKCBKU09OLnN0cmluZ2lmeSggcmVxdWVzdCApICkgXSAhPT0gdW5kZWZpbmVkICkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXF1ZXN0KTtcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzdHJlYW0gPT0gJ25vdGlmaWNhdGlvbnMnICYmIG9iai5tZXNzYWdlLmluZGV4T2YoJ3lvdSBkbyBub3QgaGF2ZSBzdWZmaWNpZW50IHBlcm1pc3Npb24nKSAhPSAtMSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGRpdiBjbGFzcz1cImZlZWQtaXRlbVwiPjxkaXYgY2xhc3M9XCJmZWVkLWFsZXJ0XCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQ2xpY2sgXCJPS1wiIHRvIGFkZCBGYWNlYm9vayBOb3RpZmljYXRpb24gRmVlZC4nICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInJlZnJlc2hcIj5PSzwvZGl2PicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PicpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50Lm9uKCdjbGljaycsICcucmVmcmVzaCcsIGZ1bmN0aW9uICggZXZlbnQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IHNlbGYucHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZWZyZXNoICcsIGlkIClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW5ld1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkFkZEFjY291bnRQb3B1cCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93TmFtZTogJ0Nvbm5lY3RXaXRoT0F1dGgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd09wdGlvbnM6ICdkaXJlY3Rvcmllcz0wLGxvY2F0aW9uPTAsc3RhdHVzPTAsbWVudWJhcj0wJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAnYWNjb3VudC9hY2NvdW50P2FjdGlvbj1zZXRFeHBpcmVkS2V5QnlJRCZpZD0nICtpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogNjAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogNjUwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldEZiQ29udmVyc2lvbnMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEZiQ29udmVyc2lvbnMnLFxyXG4gICAgICAgICAgICBzdHJlYW06ICdpbkJveCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5uZXh0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiKSBkYXRhLm5leHQgPSBcIi9pbmJveFwiO1xyXG5cclxuICAgICAgICAgICAgZWxzZSBkYXRhLm5leHQgPSBcIi9jb252ZXJzYXRpb25zXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGRhdGEubmV4dCA9IHRoaXMubmV4dDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiQ29udmVyc2lvbnMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSAhPT0gdW5kZWZpbmVkICYmIG9iai5kYXRhLmxlbmd0aCA8IDEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91ciBpbmJveCBpcyBlbXB0eS48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmZpbGxGQkhpZGRlbl9Hcm91cHMgPSBmdW5jdGlvbiAoKVxyXG4gICAgeyAgIFxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgIGwgPSAwO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJIaWRkZW5fR3JvdXBzJyxcclxuICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLm5leHQgKSBkYXRhLm5leHRfcG9zdHMgPSBcIlwiO1xyXG5cclxuICAgICAgICBlbHNlIGRhdGEubmV4dF9wb3N0cyA9IHRoaXMubmV4dDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiSGlkZGVuR3JvdXBzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX25hbWUgPSAnJztcclxuICAgICAgICAgICAgICAgIC8vZ2V0IGZpcnN0IGdyb3VwIGlmIG5vIHNlbGVjdGVkXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuc3RyZWFtLnNlbGVjdGVkID09ICdfZGVmYXVsdF8nICkvLyQuaXNFbXB0eU9iamVjdCggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgKSApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX2lkID0gb2JqLmRhdGFbIDAgXS5pZDtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9uYW1lID0gb2JqLmRhdGFbIDAgXS5uYW1lO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnN0cmVhbS5zZWxlY3RlZCA9IG9iai5kYXRhWyAwIF0uaWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9pZCA9IHNlbGYuc3RyZWFtLnNlbGVjdGVkO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsID0gb2JqLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZWN0ZWRfaWQgPT0gb2JqLmRhdGFbIGkgXS5pZCApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9uYW1lID0gb2JqLmRhdGFbIGkgXS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLXR5cGUnKS50ZXh0KCAnR3JvdXA6ICcgKyBzZWxlY3RlZF9uYW1lICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cElkOiBzZWxlY3RlZF9pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dDogJydcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBcImZlZWQvZmJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gZGF0YS5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZGF0YSApICkgaXRlbXMgPSBbIGRhdGEuZGF0YSBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpdGVtcyA9IGRhdGEuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggaXRlbXMgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPlRoaXMgZ3JvdXBcXCdzIGRhdGEgaXMgdW5hdmFpbGFibGUgYXQgdGhpcyB0aW1lLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgXHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGwgPSBvYmouZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBzZWxmLnN0cmVhbS5zZWxlY3RlZC5zcGxpdCgnLCcpLmluZGV4T2YoIG9iai5kYXRhWyBpIF0uaWQgKSAhPSAtMSApIG9iai5kYXRhWyBpIF0uc2VsZWN0ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIG9iai5kYXRhWyBpIF0uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuc3RyZWFtLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgc2VsZi5zdHJlYW0uc2VsZWN0ZWQuc3BsaXQoJywnKS5pbmRleE9mKCAnX2RlZmF1bHRfJyApICE9IC0xICkgb2JqLmRhdGFbIDAgXS5zZWxlY3RlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouZGVmYXVsdEdyb3VwSWQgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVmYXVsdEdyb3VwSWRbMF0gIT09IHVuZGVmaW5lZCAmJiAhIF8uaXNFbXB0eSggb2JqLmRlZmF1bHRHcm91cElkWzBdICkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRHcm91cElkWzBdOyBcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb2JqLmRhdGE6OjonKTsgICBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG9iai5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfSk7ICBcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5zYW1lX21lZGlhX3dpdGhfcHJldl9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggbGVuZ3RoID09PSAwICkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICB2YXIgcHJldl9pdGVtID0gdGhpcy5pdGVtc1sgbGVuZ3RoIC0gMSBdLmRhdGE7XHJcblxyXG4gICAgICAgIGlmICggcHJldl9pdGVtID09PSB1bmRlZmluZWQgfHwgcHJldl9pdGVtLm1lZGlhID09PSB1bmRlZmluZWQgfHwgZGF0YS5tZWRpYSA9PT0gdW5kZWZpbmVkICkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHByZXZfaXRlbS5tZWRpYS50eXBlID09IGRhdGEubWVkaWEudHlwZSAmJiBwcmV2X2l0ZW0ubWVkaWEuaHJlZiAhPT0gdW5kZWZpbmVkICYmIGRhdGEubWVkaWEuaHJlZiAhPT0gdW5kZWZpbmVkICYmIHByZXZfaXRlbS5tZWRpYS5ocmVmID09IGRhdGEubWVkaWEuaHJlZiApIFxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1NBTUUgTUVESUEnKTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmRpciggcHJldl9pdGVtICk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJykgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJyAmJiAhdGhpcy5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pdGVtc1sgMCBdICE9PSB1bmRlZmluZWQgKSBkYXRhID0gZGF0YS5jb25jYXQoIHRoaXMuaXRlbXNbIDAgXS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2luQm94JykgbmV3X2ZlZWRfaXRlbSA9IG5ldyBDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9lbHNlIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5zYW1lX21lZGlhX3dpdGhfcHJldl9pdGVtKCBkYXRhWyBpIF0pICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycgJiYgIXRoaXMub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfSBcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ2ZiX2xpa2VzJyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnc2VhcmNoX3JlcXVlc3QnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnb3V0cmVhY2gnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vLS0tIGZvciBsaXZlIHVwZGF0ZVxyXG4gICAgICAgICAgICB2YXIgbWluY29taW5nID0gW10sIGN1c2VySWQgPSB0aGlzLnByb2ZpbGUuZGF0YS5wYWdlSWQ7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkYXRhOjo6Ojo6Ojo6Ojo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnaW5Cb3gnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qZm9yICggdmFyIGsgPSAwLCBsbCA9IG5ld19mZWVkX2l0ZW0uZGF0YS5jb21tZW50cy5jb21tZW50Lmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfY29tbWVudCA9IG5ld19mZWVkX2l0ZW0uZGF0YS5jb21tZW50cy5jb21tZW50WyBrIF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19jb21tZW50LmZyb21JZCAhPT0gY3VzZXJJZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmNvbWluZy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzX2NvbW1lbnQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCB0aGlzX2NvbW1lbnQuY3JlYXRlZFRpbWUuc3BsaXQoJysnKVsgMCBdICkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzX2NvbW1lbnQubWVzc2FnZUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0qL1xyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9lbHNlIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuc2FtZV9tZWRpYV93aXRoX3ByZXZfaXRlbSggZGF0YVsgaSBdKSApIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtaW5jb21pbmcuc29ydCggZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPiBiLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYS50aW1lIDwgYi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSk7ICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIGZpbmQgbGF0ZXN0IGluY29taW5nXHJcbiAgICAgICAgICAgIGlmICggbWluY29taW5nLmxlbmd0aCA+IDAgKSB0aGlzLmZpcnN0SXRlbUlEID0gbWluY29taW5nWyAwIF0udGltZTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5maXJzdEl0ZW1JRCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIEZhY2Vib29rRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICckdXJsUm91dGVyJywgJ0VDJywgJ2FwaVVybCcsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsICR1cmxSb3V0ZXIsIEVDLCBhcGlVcmwgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGZlZWQgPSAnJzsvL25ldyBFbGVtZW50KCcjZmVlZC10ZW1wbGF0ZScpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZmVlZC5lbGVtZW50O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucHJvZmlsZSA9IHByb2ZpbGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uZXR3b3JrID0gKCBwcm9maWxlID09PSB1bmRlZmluZWQgPyBzdHJlYW0ubmV0d29yayA6IHByb2ZpbGUuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5hbWUgPSBzdHJlYW0ubmFtZSB8fCBzdHJlYW0uaWQ7XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBzdHJlYW0uc3RyZWFtSWQ7XHJcblxyXG4gICAgICAgIHRoaXMuc2l6ZSA9IHN0cmVhbS5zaXplO1xyXG5cclxuICAgICAgICB0aGlzLmZhdm9yaXRlZCA9IHN0cmVhbS5mYXZvcml0ZWQgfHwgZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHN0cmVhbS52YWx1ZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5leHQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gPC0tIFsgRmVlZEl0ZW0gXVxyXG5cclxuICAgICAgICB0aGlzLmxhc3RfbG9hZGVkX3RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0X3Njcm9sbF9wb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbnVsbDtcclxuICAgICAgICBcclxuICAgICAgICAvKiBwcmVwYXJlIHBhZ2VfaWQgKi9cclxuICAgICAgICB0aGlzLnBhZ2VfaWQgPSAndGFicy4nICsgdGhpcy5nZXRfcGFnZV9pZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmdldF9wYWdlX2lkID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgaWQgPSBzZWxmLmlkLFxyXG4gICAgICAgICAgICBwcmVmaXggPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQgPSBzZWxmLmlkICsgJ18nICsgc2VsZi5wcm9maWxlLmlkICsgJ18nKyBzZWxmLm5ldHdvcms7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYoIHNlbGYuaWQgPT0gJ3NlYXJjaCcgfHwgc2VsZi5pZCA9PSAncnNzJyB8fCBzZWxmLmlkID09ICdvdXRyZWFjaCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQgPSBzZWxmLm5hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmVmaXggPSAnZmF2b3JpdGUnOyAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5zZWFyY2ggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJlZml4ID0gJ3NlYXJjaCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMucnNzIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICdyc3MnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggdGhpcy5uZXR3b3JrID09ICdjaW5ib3gnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJ2NpbmJveCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiggc2VsZi5wcm9maWxlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBzZWxmLnByb2ZpbGUuaWQ7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gKHByZWZpeCArICctJyArIGlkKTtcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBwYWdlID0gJycsXHJcbiAgICAgICAgICAgICAgICBmZWVkX25hbWUgPSBzZWxmLm5hbWU7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKCBzZWxmLm5ldHdvcmsgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5wYWdlTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLnNwZWNpZmllZEhhbmRsZU9ySGFzaFRhZztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbnN0YWdyYW0nOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuZnVsbE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnbGlua2VkaW4nOiBwYWdlID0gdGhpcy5wcm9maWxlLmRhdGEucHJvZmlsZU5hbWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaW5rZWRpbic6IHBhZ2UgPSBzZWxmLnByb2ZpbGUudXNlcm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAneW91dHViZSc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS51c2VyRmlyc3ROYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PSAneXRfbXlDaGFubmVsSG9tZScgKSBmZWVkX25hbWUgPSAnSG9tZSAtIEFjdGl2aXRpZXMnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dvb2dsZXBsdXMnOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuZnVsbE5hbWUuc3BsaXQoXCIoXCIpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdibG9nZ2VyJzogcGFnZSA9IHRoaXMucHJvZmlsZS51c2VybmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9IHBhZ2UrICcgLSAnICtmZWVkX25hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMuc2VhcmNoIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnQ3VzdG9tIFNlYXJjaCBGZWVkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5yc3MgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICdSU1MgRmVlZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAodGhpcy5uYW1lKS5pbmRleE9mKCdGZWVkJykgPj0gMCA/IHRoaXMubmFtZToodGhpcy5uYW1lICsgJyBGZWVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxmLnBhZ2VfdGl0bGUgPSBmZWVkX3RpdGxlO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhzZWxmLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICB2YXIgZ2V0RXhpc3RpbmdTdGF0ZSA9ICRzdGF0ZS5nZXQoc2VsZi5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgaWYoZ2V0RXhpc3RpbmdTdGF0ZSA9PT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwYWdlX2lkOjo6JytzZWxmLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgIFwidXJsXCI6ICcvJyArIHNlbGYucGFnZV9pZCArICc6b2JqJyxcclxuICAgICAgICAgICAgICBjYWNoZTp0cnVlLFxyXG4gICAgICAgICAgICAgIFwidmlld3NcIjoge1xyXG4gICAgICAgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG4gICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcmFtLmh0bWxcIixcclxuICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogXCJGZWVkc1wiLFxyXG4gICAgICAgICAgICAgICAgICBwYXJhbXM6IHtvYmo6IHNlbGZ9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgJHN0YXRlUHJvdmlkZXJSZWYuc3RhdGUoc2VsZi5wYWdlX2lkLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAkdXJsUm91dGVyLnN5bmMoKTtcclxuICAgICAgICAgICAgJHVybFJvdXRlci5saXN0ZW4oKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwYWdlX2lkOjo6MDAwMDAnKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApIC8vIDwtLSBvdmVycmlkZVxyXG4gICAge1xyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtID0gbmV3IEZlZWRJdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKSAvLyA8LS0gb3ZlcnJpZGVcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtID0gbmV3IEZlZWRJdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmFwcGVuZF9pdGVtcyA9IGZ1bmN0aW9uICggYWRkX2FmdGVyX2luZGV4IClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCggYWRkX2FmdGVyX2luZGV4ICksXHJcbiAgICAgICAgICAgIC8vJGNvbnRhaW5lciA9IHRoaXMuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLFxyXG4gICAgICAgICAgICBjb3VudCA9IDA7XHJcbiAgICAgICBcclxuXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLnNob3dfaXRlbXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBjb25zb2xlLmxvZygnRmluYWw6Ojo6Ojo6OjonKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhzZWxmLml0ZW1zKTtcclxuXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5jbGVhckZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoIHJlbW92ZV9tZXNzYWdlIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuaGlkZV9wdWxsdXAgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnRHJvcGRvd25GZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIERyb3Bkb3duRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBHb29nbGVQbHVzRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBbJ2dwX2FjdGl2aXRpZXMnLCdncF9wYWdlc19vbmx5JywnZ3BfcGFnZXMnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gR29vZ2xlUGx1c0ZlZWQ7XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgaWRfa2V5ID0gJ2lkJywgXHJcbiAgICAgICAgICAgIGN1cnJlbnRJRCA9IHNlbGYudXBkYXRlSW50ZXJ2YWxJRDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEdQU3RyZWFtJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZ29vZ2xlUGx1c1N0cmVhbScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKCBzZWxmLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dwX2FjdGl2aXRpZXMnOiAgIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfYWN0aXZpdGllcyc7IGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXNfb25seSc6ICAgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX29ubHlfc3RyZWFtJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjY291bnRJRCA9IHNlbGYuZGVmYXVsdF9lbGVtZW50X21ldHJpYy5hY2NvdW50SUQ7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEucHJvZmlsZUlEID0gc2VsZi5kZWZhdWx0X2VsZW1lbnRfbWV0cmljLnByb2ZpbGVJRDsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkX2tleSA9ICdwb3N0SUQnOyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzJzogICAgICAgIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9zdHJlYW0nOyAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWNjb3VudElEID0gc2VsZi5kZWZhdWx0X2VsZW1lbnRfbWV0cmljLmFjY291bnRJRDsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5wcm9maWxlSUQgPSBzZWxmLmRlZmF1bHRfZWxlbWVudF9tZXRyaWMucHJvZmlsZUlEOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRfa2V5ID0gJ3Bvc3RJRCc7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrOyAgICAgIFxyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlOy8vSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY3VwZGF0ZUZlZWROb3RpZmljYXRpb24oJyArIHNlbGYuaWQgKyAnKSByZXNwb25zZTonLCAnY29sb3I6b3JhbmdlcmVkJyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnRJRCA9PT0gc2VsZi51cGRhdGVJbnRlcnZhbElEICkgLy8gZG9uJ3QgcmVmcmVzaCBkdXJpbmcgcmVxdWVzdFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3RJRCA9ICcjIyMnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmlyc3RJdGVtSUQgKSBmaXJzdElEID0gc2VsZi5maXJzdEl0ZW1JRDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZmlyc3RJRCA6OiAnICsgZmlyc3RJRCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiBpdGVtWyBpZF9rZXkgXTt9KS5pbmRleE9mKCBmaXJzdElEICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gLTEgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggZmlyc3RJRCA9PT0gJyMjIycgKSBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2luZGV4IDo6ICcgKyBpbmRleCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpbmRleCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkaGVhZGVyID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWhlYWRlcicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmJvZHkgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgJHVwZGF0ZV9ub3RpZiA9ICRmYm9keS5maW5kKCcudXBkYXRlLW5vdGlmaWNhdGlvbicpOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAkdXBkYXRlX25vdGlmLmxlbmd0aCA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmID0gJCgnPGRpdiBjbGFzcz1cInVwZGF0ZS1ub3RpZmljYXRpb25cIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZi5vbignY2xpY2snLCBmdW5jdGlvbiAoIGUgKXsgJGhlYWRlci5maW5kKCcucmVmcmVzaC1mZWVkJykudHJpZ2dlcignY2xpY2snKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRmYm9keS5maW5kKCcuZmVlZC1pdGVtJykuZmlyc3QoKS5iZWZvcmUoICR1cGRhdGVfbm90aWYgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gZGF0YS5kYXRhLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IFBvc3QnICsgKCBpbmRleCA9PT0gMSA/ICcnIDogJ3MnICkgKTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgY29uc29sZS5lcnJvcignISEhIGN1cnJlbnRJRCAhISEnKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX2FjdGl2aXRpZXMnOiB0aGlzLmdldEdvb2dsZVBsdXNTdHJlYW0oXCJncF9hY3Rpdml0aWVzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXMnOiB0aGlzLmdldFBhZ2VzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAvKmNhc2UgJ2dwX3Blb3BsZUNvbm5lY3RlZCc6IHRoaXMuZ2V0R29vZ2xlUGx1c1N0cmVhbShcImdwX3Blb3BsZUNvbm5lY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX3Blb3BsZVZpc2libGUnOiB0aGlzLmdldEdvb2dsZVBsdXNTdHJlYW0oXCJncF9wZW9wbGVWaXNpYmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7Ki9cclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlc19vbmx5JzogdGhpcy5nZXRQYWdlcyggdHJ1ZSApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmdldFBhZ2VzID0gZnVuY3Rpb24gKCBvbmx5X3BhZ2UgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBkYXRhID0gW107XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEub2JqZWN0VHlwZSA9PT0gJ3BhZ2UnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHZhciByZXFfZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEdQU3RyZWFtJyxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dwX3BhZ2Vfb25seV9zdHJlYW0nXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgdXJsOiAnZmVlZC9nb29nbGVQbHVzU3RyZWFtJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHJlcV9kYXRhXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdncF9wYWdlcycgKSByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfc3RyZWFtJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlOy8vSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnKioqKioqKioqKioqKioqKiAgRysgJytzdHJlYW0pO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLm5leHQgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9maWxlLmFjY291bnQucHJvZmlsZXMuZm9yRWFjaCggZnVuY3Rpb24oIHByb2ZpbGUgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHByb2ZpbGUuZGF0YS5vYmplY3RUeXBlICYmIHByb2ZpbGUuZGF0YS5vYmplY3RUeXBlID09PSAncGFnZScgJiYgcHJvZmlsZS5tb25pdG9yZWQgPT09ICdvbicgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwcm9maWxlLmRhdGEucGFnZV9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvZmlsZS51c2VybmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBwcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogcHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25seV9wYWdlOiBvbmx5X3BhZ2VcclxuICAgICAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7IFxyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmICFfLmlzRW1wdHkoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkLmluZGV4T2YoJ3snKSA9PT0gLTEgKSB0aGlzLmRlZmF1bHRfZWxlbWVudCA9IHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdF9ncm91cHMgPSBKU09OLnBhcnNlKCB0aGlzLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRlZmF1bHRfZ3JvdXBzWyB0aGlzLmlkIF0gIT09IHVuZGVmaW5lZCApIHRoaXMuZGVmYXVsdF9lbGVtZW50ID0gZGVmYXVsdF9ncm91cHNbIHRoaXMuaWQgXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCBkYXRhICk7ICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmdldEdvb2dsZVBsdXNTdHJlYW0gPSBmdW5jdGlvbiAoIHN0cmVhbSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiBzdHJlYW1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZ29vZ2xlUGx1c1N0cmVhbScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnKioqKioqKioqKioqKioqKiAgRysgJytzdHJlYW0pO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLm5leHQgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlcj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+JylcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLm5leHQgID09PSB1bmRlZmluZWQgfHwgIXRoaXMubmV4dCApIHtcclxuICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICBuZXh0OiB0aGlzLm5leHQgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2dvb2dsZVBsdXNTdHJlYW0nLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnZ3BfcGFnZXMnICkgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX3N0cmVhbSc7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmlkID09PSAnZ3BfcGFnZXNfb25seScgKSByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfb25seV9zdHJlYW0nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwOy8vSlNPTi5wYXJzZSggcmVzcCApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLm5leHQgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLm5leHQ7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVfcHVsbHVwKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAoIHRoaXMuaWQgPT0gJ2dwX3BhZ2VzJyB8fCB0aGlzLmlkID09ICdncF9wYWdlc19vbmx5JyApICYmIHRoaXMucHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgIT09ICdwYWdlJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSwgdGhpc19kYXR1bTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09PSAnZ3BfYWN0aXZpdGllcycgKSB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbV9vbGQoIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0sIHRoaXNfZGF0dW07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09PSAnZ3BfYWN0aXZpdGllcycgKSB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbV9vbGQoIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSBkYXRhO1xyXG5cclxuICAgICAgICB0aGlzX2RhdHVtLmZyb21JZCA9IGRhdGEudXNlci5mcm9tSWQ7XHJcbiAgICAgICAgdGhpc19kYXR1bS5mcm9tTmFtZSA9IGRhdGEudXNlci5mcm9tTmFtZTtcclxuICAgICAgICB0aGlzX2RhdHVtLnByb2ZpbGVMaW5rID0gZGF0YS51c2VyLnByb2ZpbGVMaW5rO1xyXG4gICAgICAgIHRoaXNfZGF0dW0ucHJvZmlsZVBpYyA9IGRhdGEudXNlci5wcm9maWxlUGljO1xyXG5cclxuICAgICAgICB0aGlzX2RhdHVtLnVwZGF0ZVRpbWUgPSBuZXcgRGF0ZSggdGhpc19kYXR1bS51cGRhdGVUaW1lICkuZ2V0VGltZSgpIC8gMTAwMDtcclxuXHJcbiAgICAgICAgZGVsZXRlIHRoaXNfZGF0dW0udXNlcjtcclxuXHJcbiAgICAgICAgLy8gdGFrZSAxIGF0dGFjaG1lbnQgZm9yIG5vd1xyXG4gICAgICAgIGlmICggZGF0YS5hdHRhY2htZW50cyAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBkYXRhLmF0dGFjaG1lbnRzKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50KSApIHRoaXNfZGF0dW0ubWVkaWEgPSBkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnRbIDAgXTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bS5tZWRpYSA9IGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudDtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS5jb250ZW50IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAoL1xcd3s4fSgtXFx3ezR9KXszfS1cXHd7MTJ9L2kpLnRlc3QodGhpc19kYXR1bS5tZWRpYS5jb250ZW50KSApIHRoaXNfZGF0dW0ubWVkaWEuY29udGVudCA9ICcnOyAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAncGhvdG8nIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmZ1bGxJbWFnZSAhPT0gdW5kZWZpbmVkICkgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmZ1bGxJbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCApIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5pbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBkZWxldGUgdGhpc19kYXR1bS5tZWRpYTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAndmlkZW8nICYmIHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5pbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEudmlkZW8gPSB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV91cmw6IHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQudXJsIFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtLm1lZGlhLnZpZGVvID0geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlX3VybDogdGhpc19kYXR1bS5tZWRpYS51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLnVybCBcclxuICAgICAgICAgICAgICAgICAgICB9OyBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbV9vbGQgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICBmcm9tSWQ6IGRhdGEudXNlci5pZCxcclxuICAgICAgICAgICAgZnJvbU5hbWU6IGRhdGEudXNlci5mdWxsX25hbWUsXHJcbiAgICAgICAgICAgIHByb2ZpbGVQaWM6IGRhdGEudXNlci5wcm9maWxlX3BpY3R1cmUsXHJcbiAgICAgICAgICAgIHByb2ZpbGVMaW5rOiBkYXRhLnVzZXIucHJvZmlsZV9saW5rLFxyXG4gICAgICAgICAgICBzZWxmTGluazogZGF0YS5zZWxmTGluayxcclxuICAgICAgICAgICAgdXBkYXRlVGltZTogKCBuZXcgRGF0ZSggZGF0YS5jcmVhdGVkX3RpbWUgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEudGl0bGUsXHJcblxyXG4gICAgICAgICAgICAvL2FjdGl2aXR5VHlwZTogZGF0YS5hY3Rpdml0eVR5cGUgfHwgJycsXHJcbiAgICAgICAgICAgIHJlc2hhcmVyczogZGF0YS5yZXNoYXJlcnMsXHJcbiAgICAgICAgICAgIGxpa2VzOiBkYXRhLmxpa2VzLCAvL3BsdXNvbmVyc1xyXG4gICAgICAgICAgICBjb21tZW50czogZGF0YS5jb21tZW50cyxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9tZWRpYTogZGF0YS5hdHRhY2htZW50cyxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgcG9zdElEOiBkYXRhLmlkLCAvLz8/P1xyXG4gICAgICAgICAgICByYXdfZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggdGhpc19kYXR1bS5jb21tZW50cy5jb21tZW50ICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkoIHRoaXNfZGF0dW0uY29tbWVudHMuY29tbWVudCApKSBcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5jb21tZW50cy5jb21tZW50ID0gWyB0aGlzX2RhdHVtLmNvbW1lbnRzLmNvbW1lbnQgXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzX2RhdHVtLmxpa2VzLmxpa2UgIT09IHVuZGVmaW5lZCAmJiAhQXJyYXkuaXNBcnJheSggdGhpc19kYXR1bS5saWtlcy5saWtlICkpIFxyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLmxpa2VzLmxpa2UgPSBbIHRoaXNfZGF0dW0ubGlrZXMubGlrZSBdO1xyXG5cclxuICAgICAgICAvLyB0YWtlIDEgYXR0YWNobWVudCBmb3Igbm93XHJcbiAgICAgICAgaWYgKCBkYXRhLmF0dGFjaG1lbnRzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudCkgKSB0aGlzX2RhdHVtLm1lZGlhID0gZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50WyAwIF07XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0ubWVkaWEgPSBkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAncGhvdG8nICYmIHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlICE9PSB1bmRlZmluZWQgKSB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLnR5cGUgPT0gJ3ZpZGVvJyAmJiB0aGlzX2RhdHVtLm1lZGlhLmltYWdlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UudXJsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS5lbWJlZCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnZpZGVvID0geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlX3VybDogdGhpc19kYXR1bS5tZWRpYS5lbWJlZC51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkLnVybCBcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bS5tZWRpYS52aWRlbyA9IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IHRoaXNfZGF0dW0ubWVkaWEudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X3VybDogdGhpc19kYXR1bS5tZWRpYS51cmwgXHJcbiAgICAgICAgICAgICAgICAgICAgfTsgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtOyAgIFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gR29vZ2xlUGx1c0ZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdJbnN0YWdyYW1GZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIEluc3RhZ3JhbUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gSW5zdGFncmFtRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbnN0YWdyYW1GZWVkO1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgIHtcclxuICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICBpZiAoIHRoaXMudmFsdWUgPT0gJ3RydWUnICYmICF0aGlzLmluaXRpYWxpemVkIClcclxuICAgICAgIHtcclxuICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIC8vIEluIGNhc2Ugd2UgYXJlIGRlYWxpbmcgd2l0aCB1c2VyIGZlZWQgXHJcbiAgICAgICAgICAgICAgIGNhc2UgJ2lnX2ZlZWQnOiB0aGlzLmdldEluc3RhZ3JhbUZlZWQoXCJ1c2VyRmVlZFwiKTtcclxuICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAvLyBJbiBjYXNlIHdlIGFyZSBkZWFsaW5nIHdpdGggbXkgbWVkaWEgZmVlZFxyXG4gICAgICAgICAgICAgICAvLyBjYXNlICdpZ015TWVkaWEnOiB0aGlzLmdldEluc3RhZ3JhbUZlZWQoXCJpZ015TWVkaWFcIik7XHJcbiAgICAgICAgICAgICAgIGNhc2UgJ2lnTXlNZWRpYSc6IHRoaXMuZ2V0SW5zdGFncmFtRmVlZChcIm15TWVkaWFcIik7XHJcbiAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgfVxyXG4gICAgICAgfVxyXG4gICAgICAgZWxzZSBpZiAoIHRoaXMudmFsdWUgPT0gJ3RydWUnKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5nZXRJbnN0YWdyYW1GZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgIC8vYWN0aW9uOiAnZ2V0TmV3c0ZlZWQnLFxyXG4gICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgc3RyZWFtOiBzdHJlYW0sXHJcbiAgICAgICAgICAgbmV4dDogJycgLy8gSUQgb2YgbGFzdCBlbGVtZW50IHRoYXQgd2FzIGxvYWRlZFxyXG4gICAgICAgfTtcclxuXHJcbiAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgIGlmKHRoaXMubmV4dCA+IDApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubmV4dCA9IHRoaXMubmV4dDtcclxuICAgICAgIH1cclxuXHJcbiAgICAgICB2YXIgbWV0aG9kID0gJyc7XHJcbiAgICAgICAvLyBpZiAoc3RyZWFtID09ICdpZ015TWVkaWEnKSBcclxuICAgICAgIGlmIChzdHJlYW0gPT0gJ215TWVkaWEnKSBcclxuICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluTXlNZWRpYVwiOyAvLyBBY3Rpb24gZm9yIG15TWVkaWFcclxuICAgICAgICAgICAgbWV0aG9kID0gJ215TWVkaWEnO1xyXG4gICAgICAgfVxyXG4gICAgICAgZWxzZVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIGRhdGEuYWN0aW9uID0gXCJnZXRJbkZlZWRcIjsgLy8gQWN0aW9uIGZvciB1c2VyIGZlZWQgLyBob21lIGZlZWRcclxuICAgICAgICAgICBtZXRob2QgPSAnZmVlZCc7XHJcbiAgICAgICB9XHJcblxyXG4gICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgdXJsOiAnZmVlZC9pbnN0YWdyYW0vJyttZXRob2QsXHJcbiAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgfTtcclxuXHJcbiAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICBpZiAoIG9iai5wYWdpbmF0aW9uICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5hdGlvbi5uZXh0X21heF9pZDtcclxuXHJcbiAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAvL2FjdGlvbjogJ2RvRmJSZXF1ZXN0JyxcclxuICAgICAgICAgICAgICAgIC8vd2FsbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAvL2RhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBtZXRob2QgPSAnJztcclxuICAgICAgICBpZiAodGhpcy5pZCA9PSAnaWdfZmVlZCcpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5zdHJlYW0gPSBcInVzZXJGZWVkXCI7XHJcbiAgICAgICAgICAgIGRhdGEuYWN0aW9uID0gXCJnZXRJbkZlZWRcIjsgLy8gQWN0aW9uIGZvciB1c2VyIGZlZWQgLyBob21lIGZlZWRcclxuICAgICAgICAgICAgbWV0aG9kID0gJ2ZlZWQnO1xyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5zdHJlYW0gPSBcIm15TWVkaWFcIjtcclxuICAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluTXlNZWRpYVwiOyAvLyBBY3Rpb24gZm9yIG15TWVkaWFcclxuICAgICAgICAgICAgbWV0aG9kID0gJ215TWVkaWEnO1xyXG4gICAgICAgIH0gICAgICAgIFxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlkPVwiK3RoaXMuaWQrXCIgc3RyZWFtPVwiK2RhdGEuc3RyZWFtK1wiIG5leHQ9XCIrdGhpcy5uZXh0K1wiIGFjdGlvbj1cIitkYXRhLmFjdGlvbik7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9pbnN0YWdyYW0vJyttZXRob2QsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBcclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLnRvb2xiYXIoeyB0YXBUb2dnbGU6IGZhbHNlIH0pO1xyXG4gICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLmZhZGVPdXQoMzAwKTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyQubW9iaWxlLmFjdGl2ZVBhZ2UuY2hpbGRyZW4oXCJbZGF0YS1yb2xlPSdmb290ZXInXVwiKS50b29sYmFyKHsgdGFwVG9nZ2xlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAvLyQubW9iaWxlLmFjdGl2ZVBhZ2UuY2hpbGRyZW4oXCJbZGF0YS1yb2xlPSdmb290ZXInXVwiKS5mYWRlSW4oMzAwKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5wYWdpbmF0aW9uID8gZGF0YS5wYWdpbmF0aW9uLm5leHRfbWF4X2lkIDogJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAndXNlckZlZWQnKSB7bmV3X2ZlZWRfaXRlbSA9IG5ldyBDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTt9ICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHN0cmVhbSA9IG15TWVkaWFcclxuICAgICAgICAgICAgICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBJbnN0YWdyYW1GZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgfVxyXG5cclxuICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IEluc3RhZ3JhbUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gSW5zdGFncmFtRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIENvbGxhcHNpYmxlRmVlZEl0ZW0gPSAgQ29sbGFwc2libGVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdDb2xsYXBzaWJsZUZlZWRJdGVtJyk7XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgQ29sbGFwc2libGVGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgICBcclxuICAgIExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG5cclxuICAgIHJldHVybiBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnTGlua2VkaW5GZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgTGlua2VkaW5GZWVkSXRlbSwgRHJvcGRvd25GZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIExpbmtlZGluRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmtlZGluRmVlZDtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHRoaXMuaWQgKVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCB0aGlzLnZhbHVlIClcclxuICAgICAgICBcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdjb250YWN0cyc6IHRoaXMucmV0cmlldmVMaW5rZWRpbkRhdGEoJ2dldExOQ29udGFjdHMnKTsvL2NvbnNvbGUubG9nKCdjb250YWN0cycpOy8vdGhpcy5nZXROZXdzRmVlZChcIm5ld3NGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzogdGhpcy5nZXRMTkNvbXBhbmllcygpOy8vY29uc29sZS5sb2coJ2xuX2NvbXBhbmllcycpOy8vdGhpcy5nZXROZXdzRmVlZChcIndhbGxQb3N0c1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dyb3Vwcyc6IHRoaXMuZ2V0TE5Hcm91cHMoKTsgLy9jb25zb2xlLmxvZygnZ3JvdXBzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwicGFnZXNGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaW5ib3gnOiB0aGlzLmdldExOSW5ib3goKTsvL2NvbnNvbGUubG9nKCdpbmJveCcpOy8vdGhpcy5nZXRMbkluYm94KCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdob21lJzogdGhpcy5nZXRMTkhvbWUoKTsgLy9jb25zb2xlLmxvZygnbG5jX2hvbWVXYWxsJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbmNfaG9tZVdhbGwnOiB0aGlzLnJldHJpZXZlTGlua2VkaW5EYXRhKCdnZXRMTkNtcEhvbWUnKTsvL2NvbnNvbGUubG9nKCdsbmNfaG9tZVdhbGwnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrOyBcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbmNfcHJvZHVjdHMnOiBjb25zb2xlLmxvZygnbG5jX3Byb2R1Y3RzJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7IFxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvLyBpZih0aGlzLm5leHQ+MClcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldExOQ21wSG9tZScsXHJcbiAgICAgICAgICAgICAgICAgICAgLy93YWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVfaWQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBzdGFydDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtZXRob2QgPSAnJztcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRhY3RzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Db250YWN0cyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdjb250YWN0cyc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xuX2NvbXBhbmllcyc6IGRhdGEuYWN0aW9uID0gJ2dldExOQ29tcGFuaWVzJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJylbMF0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdjb21wYW5pZXMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dyb3Vwcyc6IGRhdGEuYWN0aW9uID0gJ2dldExOR3JvdXBzJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2dyb3Vwcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luYm94JzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5JbmJveCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEucHJvZmlsZV9pZCA9IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVfSWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5zdGFydCA9PT0gRkFMU0UgKSBkYXRhLnN0YXJ0ID0gMDsgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSAnaW5ib3gnOyBcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaG9tZSc6IGRhdGEuYWN0aW9uID0gJ2dldExOSG9tZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdob21lJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6IFwiZmVlZC9saW5rZWRJbi9cIittZXRob2QsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0TG5JbmJveCBtb3JlIHJlc3BvbnNlJyk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgKz0gMjU7Ly9kYXRhLnVwZGF0ZUtleTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS50cmlnZ2VyKCdjbGljaycpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIC8vIH0gXHJcbiAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gfSAgXHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUucmV0cmlldmVMaW5rZWRpbkRhdGEgPSBmdW5jdGlvbiAoIGFjdGlvbiApIC8vIGdldExOQ21wSG9tZSA9PiBjb21wYW55IHVwZGF0ZXNcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2VsZi5uZXh0ID0gMDtcclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlX0lkOiB0aGlzLnByb2ZpbGUuZGF0YS5wcm9maWxlX0lkLFxyXG4gICAgICAgICAgICBzdGFydDogc2VsZi5uZXh0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgIHN3aXRjaCggYWN0aW9uIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldExOQ29udGFjdHMnOlxyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gJ2xpbmtlZEluL2NvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRMTkNtcEhvbWUnOlxyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gJ2xpbmtlZEluL2NvbXBhbnlIb21lJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gJyc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkLycrbWV0aG9kLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhhY3Rpb24gKycgcmVzcG9uc2UnKVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApKi8gXHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7Ly9vYmouZGF0YS51cGRhdGVLZXk7Ly9vYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGVsc2VcclxuICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKClcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOQ29tcGFuaWVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2VsZi5uZXh0ID0gMDtcclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5Db21wYW5pZXMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RhcnQ6IDBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vY29tcGFuaWVzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG4gICAgICAgICAgICAvLyBpZiAoIG9iai5kYXRhLmxlbmd0aCA9PSAyNSApXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gb2JqLmRhdGEubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmRlZmF1bHRDb21wYW55SWQgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVmYXVsdENvbXBhbnlJZFswXSAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBvYmouZGVmYXVsdENvbXBhbnlJZFswXSApIClcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0Q29tcGFueUlkWyAwIF07IFxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgIC8vIGVsc2VcclxuICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKClcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIC8vIH0gICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5nZXRMTkdyb3VwcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkdyb3VwcycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9ncm91cHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSA9PT0gdW5kZWZpbmVkIHx8IG9iai5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouZGVmYXVsdEdyb3VwSWQgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVmYXVsdEdyb3VwSWRbMF0gIT09IHVuZGVmaW5lZCAmJiAhIF8uaXNFbXB0eSggb2JqLmRlZmF1bHRHcm91cElkWzBdICkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRHcm91cElkWzBdOyBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH0gICAgIFxyXG4gICAgICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpXHJcblxyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICAvLyB9ICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApOyBcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOSG9tZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWF0YW4gaGVyZSAtIFwiK3RoaXMuaWQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUuZGlyKHNlbGYpO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkhvbWUnLFxyXG4gICAgICAgICAgICAvL3N0cmVhbTogJ2luQm94JyxcclxuICAgICAgICAgICAgLy9wcm9maWxlX2lkOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RhcnQ6IDBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vaG9tZScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0TE5Ib21lIHJlc3BvbnNlJylcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG9iaiApXHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIHNlbGYubmV4dCA9IDI1O1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gb2JqLmRhdGEubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5JbmJveCA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5JbmJveCcsXHJcbiAgICAgICAgICAgIC8vc3RyZWFtOiAnaW5Cb3gnLFxyXG4gICAgICAgICAgICBwcm9maWxlX2lkOiB0aGlzLnByb2ZpbGUuZGF0YS5wcm9maWxlX0lkLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RhcnQ6IDBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vaW5ib3gnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2dldExuSW5ib3ggcmVzcG9uc2UnKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSA9PT0gdW5kZWZpbmVkIHx8IG9iai5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdncm91cHMnIHx8IHRoaXMuaWQgPT0gJ2xuX2NvbXBhbmllcycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLml0ZW1zWyAwIF0gIT09IHVuZGVmaW5lZCApIGRhdGEgPSBkYXRhLmNvbmNhdCggdGhpcy5pdGVtc1sgMCBdLmRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2lmICggdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApIG5ld19mZWVkX2l0ZW0gPSBuZXcgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKmVsc2UqLyBuZXdfZmVlZF9pdGVtID0gbmV3IExpbmtlZGluRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2dyb3VwcycgfHwgdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgLy9pZiAoIHRoaXMuaWQgPT0gJ2xuX2NvbXBhbmllcycgKSBuZXdfZmVlZF9pdGVtID0gbmV3IExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyplbHNlKi8gbmV3X2ZlZWRfaXRlbSA9IG5ldyBMaW5rZWRpbkZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIExpbmtlZGluRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIEZlZWRJdGVtID0gIEZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBMaW5rZWRpbkZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMaW5rZWRpbkZlZWRJdGVtO1xyXG4gICAgXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cztcclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXJDb21tZW50ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyQ29tbWVudDtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcztcclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5hZGRfY29tbWVudCA9IGZ1bmN0aW9uICggbWVzc2FnZSwgZGlyZWN0LCBzaGFyZSApXHJcbiAgICB7XHJcblxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIExpbmtlZGluRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSwgRHJvcGRvd25GZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFBpbnRlcmVzdEZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBpbnRlcmVzdEZlZWQ7XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAncGlfbXlBY3Rpdml0eSc6IHRoaXMuZ2V0TXlBY3Rpdml0eSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfYm9hcmQnOiB0aGlzLmdldEJvYXJkcygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfcGlucyc6IHRoaXMuZ2V0UGludGVyZXN0RmVlZCggdGhpcy5pZCApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfbGlrZXMnOiB0aGlzLmdldFBpbnRlcmVzdEZlZWQoIHRoaXMuaWQgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmdldEJvYXJkcyA9IGZ1bmN0aW9uICggKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcywgZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2lmICggd2luZG93Lmdsb2JhbHMucGlCb2FyZHMgJiYgd2luZG93Lmdsb2JhbHMucGlCb2FyZHMuaWQgPT09IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkICkgZGF0YSA9IHdpbmRvdy5nbG9iYWxzLnBpQm9hcmRzLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9lbHNlIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5wcm9maWxlLmFjY291bnQucHJvZmlsZXMuZm9yRWFjaCggZnVuY3Rpb24oIHByb2ZpbGUgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXByb2ZpbGUuZGF0YS5vYmplY3RUeXBlIHx8IHByb2ZpbGUuZGF0YS5vYmplY3RUeXBlICE9PSAndXNlcicgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwcm9maWxlLmRhdGEudXNlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvZmlsZS51c2VybmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3dpbmRvdy5nbG9iYWxzLnBpQm9hcmRzID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCApIClcclxuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQ7XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGRhdGEgKTtcclxuICAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAoIHN0cmVhbSwgcGFyYW1ldGVycywgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYoIHNlbGYubmV4dCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAga2V5OiAnY3Vyc29yJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBzZWxmLm5leHQgICAgIFxyXG4gICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdsaW1pdCcsXHJcbiAgICAgICAgICAgIHZhbHVlOiAnMjAnICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFBpbnRlcmVzdEZlZWQnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiBzdHJlYW0sXHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnNcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvcGludGVyZXN0JyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggb2JqICk7IFxyXG4gICAgICAgIH0pOyAgICAgICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuZ2V0UGludGVyZXN0RmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMgPSBbXTtcclxuXHJcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAga2V5OiAnZmllbGRzJyxcclxuICAgICAgICAgICAgdmFsdWU6ICdpZCxsaW5rLHVybCxjcmVhdG9yLGJvYXJkLGNyZWF0ZWRfYXQsbm90ZSxjb3VudHMsbWVkaWEsYXR0cmlidXRpb24saW1hZ2UsbWV0YWRhdGEnICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VsZi5yZXF1ZXN0KCBzdHJlYW0sIHBhcmFtZXRlcnMsIGZ1bmN0aW9uICggb2JqIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT09ICdGQUlMJyB8fCAoIG9iai5kYXRhLnN0YXR1cyAmJiBvYmouZGF0YS5zdGF0dXMgPT09ICdmYWlsdXJlJyApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFnZSA9IG9iai5kYXRhLnBhZ2U7XHJcbiAgICAgICAgICAgIGlmICggcGFnZSAmJiBwYWdlLmN1cnNvciApIHNlbGYubmV4dCA9IHBhZ2UuY3Vyc29yO1xyXG4gICAgICAgICAgICBvYmouZGF0YSA9IG9iai5kYXRhLmRhdGE7IFxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7ICBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5uZXh0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgcGFyYW1ldGVycyA9IFtdO1xyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdmaWVsZHMnLFxyXG4gICAgICAgICAgICB2YWx1ZTogJ2lkLGxpbmssdXJsLGNyZWF0b3IsYm9hcmQsY3JlYXRlZF9hdCxub3RlLGNvdW50cyxtZWRpYSxhdHRyaWJ1dGlvbixpbWFnZSxtZXRhZGF0YScgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZWxmLnJlcXVlc3QoIHNlbGYuaWQsIHBhcmFtZXRlcnMsIGZ1bmN0aW9uICggb2JqIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT09ICdGQUlMJyB8fCAoIG9iai5kYXRhLnN0YXR1cyAmJiBvYmouZGF0YS5zdGF0dXMgPT09ICdmYWlsdXJlJyApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSAnJztcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IG9iai5kYXRhLnBhZ2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHBhZ2UgJiYgcGFnZS5jdXJzb3IgKSBzZWxmLm5leHQgPSBwYWdlLmN1cnNvcjtcclxuICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5kYXRhID0gb2JqLmRhdGEuZGF0YTsgXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApICk7XHJcbiAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdwaV9ib2FyZCcgKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubm90ZSwvLyBkYXRhLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIHJhd19kYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmNvdW50cyAmJiBkYXRhLmNvdW50cy5yZXBpbnMgKSB0aGlzX2RhdHVtLnJlcGlucyA9ICcnICsgZGF0YS5jb3VudHMucmVwaW5zO1xyXG5cclxuICAgICAgICBlbHNlIHRoaXNfZGF0dW0ucmVwaW5zID0gJyc7XHJcblxyXG4gICAgICAgIHRoaXNfZGF0dW0ubGluayA9IGRhdGEubGluaztcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmNvdW50cyAmJiBkYXRhLmNvdW50cy5saWtlcyApIHRoaXNfZGF0dW0ubGlrZXMgPSB7IGNvdW50OiBkYXRhLmNvdW50cy5saWtlcyB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuY291bnRzICYmIGRhdGEuY291bnRzLmNvbW1lbnRzICkgdGhpc19kYXR1bS5jb21tZW50cyA9IHsgY291bnQ6IGRhdGEuY291bnRzLmNvbW1lbnRzIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS51cmwgKSB0aGlzX2RhdHVtLnBlcm1hbGluayA9IGRhdGEudXJsO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuaW1hZ2UgJiYgZGF0YS5pbWFnZS5vcmlnaW5hbCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgIHNyYzogZGF0YS5pbWFnZS5vcmlnaW5hbC51cmxcclxuICAgICAgICAgICAgfTsgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5tZXRhZGF0YSAmJiBkYXRhLm1ldGFkYXRhLmxpbmsgJiYgZGF0YS5tZXRhZGF0YS5saW5rLmZhdmljb24gJiYgZGF0YS5tZXRhZGF0YS5saW5rLnNpdGVfbmFtZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gPSAnPGRpdiBjbGFzcz1cInBpLWZyb21cIj48aW1nIHNyYz1cIicgKyBkYXRhLm1ldGFkYXRhLmxpbmsuZmF2aWNvbjsgXHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiArPSAnXCIgLz48L2Rpdj5mcm9tICcgKyBkYXRhLm1ldGFkYXRhLmxpbmsuc2l0ZV9uYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgKCB0aGlzLmlkID09ICdwaV9ib2FyZCcgJiYgdGhpc19kYXR1bS5tZXNzYWdlICkgdGhpc19kYXR1bS5tZXNzYWdlID0gdGhpc19kYXR1bS5tZXNzYWdlLnJlcGxhY2UoJyAgICAgICBNb3JlICAgICAgICcsJycpLnRyaW0oKTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCBkYXRhLmJvYXJkICE9IHVuZGVmaW5lZCAmJiBkYXRhLmJvYXJkLmxlbmd0aCA+IDAgKSBcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIGlmICggdGhpcy5pZCA9PSAncGlfbXlBY3Rpdml0eScpIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiA9ICdQaW5uZWQgb250bzogJyArIGRhdGEuYm9hcmQ7XHJcblxyXG4gICAgICAgIC8vICAgICBlbHNlICB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gPSAnUGlubmVkIGZyb206IDxhIGhyZWY9XCJodHRwOi8vcGludGVyZXN0LmNvbS9zb3VyY2UvJyArIGRhdGEuYm9hcmQgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArIGRhdGEuYm9hcmQgKyAnPC9hPic7XHJcbiAgICAgICAgLy8gfSBcclxuXHJcbiAgICAgICAgLy8gZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyAmJiBkYXRhLnVzZXJfbmFtZSAhPSB1bmRlZmluZWQgJiYgZGF0YS51c2VyX25hbWUgPT0gJ1Bpbm5lZCBieSBwaW5uZXInICkgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uID0gZGF0YS51c2VyX25hbWU7ICAgICAgXHJcblxyXG4gICAgICAgIC8vIGlmICggZGF0YS5pbWcgIT0gdW5kZWZpbmVkICYmIGRhdGEuaW1nWyAwIF0gIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXNfZGF0dW0ubWVkaWEgPSB7XHJcbiAgICAgICAgLy8gICAgICAgICB0eXBlOiAncGhvdG8nLFxyXG4gICAgICAgIC8vICAgICAgICAgc3JjOiBkYXRhLmltZ1sgMCBdXHJcbiAgICAgICAgLy8gICAgIH07ICAgXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTsgXHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmNoYW5nZVBpbkJvYXJkID0gZnVuY3Rpb24oIHByb2ZpbGUsIGFjdGlvbiwgY29tbWFuZCwgcGFyYW1ldGVycywgb2JqZWN0X2lkLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxyXG4gICAgICAgICAgICBjb21tYW5kOiBjb21tYW5kLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBwcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBvYmplY3RfaWQ6IG9iamVjdF9pZCB8fCAnJyxcclxuICAgICAgICAgICAgcGFyYW1ldGVyczogcGFyYW1ldGVycyB8fCBbXVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlrZScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApOyBcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIFBpbnRlcmVzdEZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBUaW1lbGluZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLmxpa2VzID09PSB1bmRlZmluZWQgKSB0aGlzLmRhdGEubGlrZXMgPSB7Y291bnQ6IDB9O1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YSAhPT0gdW5kZWZpbmVkICkgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbiA9IHRoaXMuZGF0YS5yYXdfZGF0YS5jb252ZXJzYXRpb247XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLmNvbnZlcnNhdGlvbiAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KCB0aGlzLmRhdGEuY29udmVyc2F0aW9uLnR3ZWV0cyApICkgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbi50d2VldHMgPSBbIHRoaXMuZGF0YS5jb252ZXJzYXRpb24udHdlZXRzIF07XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPT09IHVuZGVmaW5lZCApIHRoaXMuZGF0YS5tZWRpYV9jb250ZW50ID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUaW1lbGluZUZlZWRJdGVtO1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldE5hbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gc2VsZi5kYXRhLmZyb21OYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgdGltZXN0YW1wID0gcGFyc2VJbnQoIHRoaXMuZGF0YS51cGRhdGVUaW1lICksXHJcbiAgICAgICAgICAgIHRpbWUgPSAnJztcclxuXHJcbiAgICAgICAgdmFyIG5ld19kYXRlID0gbmV3IERhdGUoIHRpbWVzdGFtcCAqIDEwMDAgKSxcclxuICAgICAgICAgICAgZGF0ZSA9IG5ld19kYXRlOy8vLmZvcm1hdCgnbW1tIGRkLCB5eXl5LCBoOk1NdHQnKTtcclxuXHJcbiAgICAgICAgaWYgKCAhaXNOYU4oIHRoaXMuZGF0YS51cGRhdGVUaW1lICkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdUV0ZvbGxvd2VycycgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGltZSA9ICdAJyArdGhpcy5kYXRhLnVzZXJuYW1lOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSB0aW1lID0gZGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgIT09ICdmYWNlYm9vaycgfHwgKCB0aGlzLmZlZWQuaWQgIT0gJ3NlYXJjaCcgJiYgdGhpcy5mZWVkLmlkICE9PSAnb3V0cmVhY2gnICkgfHwgKCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzICE9PSB1bmRlZmluZWQgJiYgdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09PSB1bmRlZmluZWQgKSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gJ0AnICt0aGlzLmRhdGEudXNlcm5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMudHlwZSA9PSAncGFnZScgfHwgdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwbGFjZScgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGltZSA9IHRoaXMuZGF0YS5jYXRlZ29yeTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRpbWU7XHJcbiAgICB9OyBcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBUaW1lbGluZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFR3aXR0ZXJGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIC8qd2luZG93Lmdsb2JhbHMudHdfZmVlZHNfbGl2ZV91cGRhdGUgJiYqLyBbJ2hvbWVGZWVkJywnbGlzdHMnLCdtZW50aW9ucycsJ3R3Rm9sbG93ZXJzJywnZGlyZWN0X21lc3NhZ2UnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFR3aXR0ZXJGZWVkO1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5jbGVhckZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoIHJlbW92ZV9tZXNzYWdlIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdob21lRmVlZCc6IHRoaXMucmVxdWVzdCgnZ2V0VFdIb21lRmVlZCcpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdtZW50aW9ucyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdNZW50aW9ucycpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d0ZvbGxvd2Vycyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdGb2xsb3dlcnMnKTsgLy8gPC0tIHRvdGFsbHkgdW5pcXVlXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d0ZyaWVuZHMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXRnJpZW5kc0xpc3QnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NlbmRUd2VldHMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VuZFR3ZWV0cycpOyAvLyA8LS0gc2ltaWxhci1pc2ggdG8gVGltZWxpbmVGZWVkSXRlbVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbXlUd2VldHNSZXR3ZWV0ZWQnOiB0aGlzLnJlcXVlc3QoJ2dldFRXUmV0d2VldHMnKTsgLy8gPC0tIHNpbWlsYXItaXNoIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3RmF2b3JpdGVzJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0Zhdm9yaXRlcycpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdkaXJlY3RfbWVzc2FnZSc6IHRoaXMucmVxdWVzdCgnZ2V0VFdJbkJveCcpOyAvLyA8LS0gc2ltaWxhciB0byBDb2xsYXBzaWJsZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaXN0cyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdMaXN0cycpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzogdGhpcy5yZXF1ZXN0KCdnZXRUV1NlYXJjaCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnb3V0cmVhY2gnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VhcmNoJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdsaXN0cycgfHwgdGhpcy5pZCA9PSAnc2VhcmNoJyB8fCB0aGlzLmlkID09ICdvdXRyZWFjaCcgfHwgdGhpcy5pZCA9PSAnZGlyZWN0X21lc3NhZ2UnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7IFxyXG4gICAgICAgICAgICAvL3RoaXMuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJycsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBtYXhfaWQ6IHRoaXMubmV4dFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoICggdGhpcy5pZCA9PT0gJ3R3Rm9sbG93ZXJzJyB8fCB0aGlzLmlkID09PSAndHdGcmllbmRzJyApICYmIHNlbGYub3B0aW9ucy51c2VyX2lkX2Zvcl9yZXF1ZXN0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEudXNlcklEID0gc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3Q7ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdob21lRmVlZCc6IGRhdGEuYWN0aW9uID0gJ2dldFRXSG9tZUZlZWQnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ21lbnRpb25zJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdNZW50aW9ucyc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdGb2xsb3dlcnMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV0ZvbGxvd2Vycyc7IFxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3RnJpZW5kcyc6IGRhdGEuYWN0aW9uID0gJ2dldFRXRnJpZW5kc0xpc3QnOyBcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzZW5kVHdlZXRzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdTZW5kVHdlZXRzJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdteVR3ZWV0c1JldHdlZXRlZCc6IGRhdGEuYWN0aW9uID0gJ2dldFRXUmV0d2VldHMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3RmF2b3JpdGVzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdGYXZvcml0ZXMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ2RpcmVjdF9tZXNzYWdlJzogXHJcbiAgICAgICAgICAgIC8vICAgICBkYXRhLmFjdGlvbiA9ICdnZXRUV0luQm94JztcclxuICAgICAgICAgICAgLy8gICAgIGRhdGEuaW5ib3hfbWF4X2lkID0gdGhpcy5uZXh0LmluYm94O1xyXG4gICAgICAgICAgICAvLyAgICAgZGF0YS5vdXRib3hfbWF4X2lkID0gdGhpcy5uZXh0Lm91dGJveDtcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC90d2l0dGVyJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AgfHwge307XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICkgZGF0YS5kYXRhLnNwbGljZSggMCwgMSApOyAvLyBiYWNrZW5kIHJldHVybnMgbGFzdCBpdGVtIGZyb20gcHJldiByZXF1ZXN0IGFzIGZpcnN0IGl0ZW0gaGVyZVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmN1cnNvciAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmN1cnNvclsgMCBdICE9PSAwICkgc2VsZi5uZXh0ID0gZGF0YS5jdXJzb3JbIDAgXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YVsgZGF0YS5kYXRhLmxlbmd0aCAtIDEgXS5pZF9zdHI7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gVFdTZWFyY2hDb250YWluZXI6IHNlbGYgPSB0aGlzOyBwcm9maWxlID0gc2VsZi5kYXRhLnByb2ZpbGVcclxuICAgIC8vIHR5cGUgPSB0d2VldHMgT1IgcGVvcGxlXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5zZWFyY2hfcmVxdWVzdCA9IGZ1bmN0aW9uICggc2VsZiwgY2FsbGJhY2ssIGNsYXNzX25hbWUgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwYXJhbWV0ZXJzID0gW10sIG5leHQsIHF1ZXJ5LCBwcm9maWxlLCByZXN1bHRfdHlwZSwgdHlwZSwgbGFuZywgZ2VvY29kZTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCBzZWxmLmNvbnN0cnVjdG9yLm5hbWUgPT0gJ1R3aXR0ZXJGZWVkJyApXHJcbiAgICAgICAgaWYgKCBjbGFzc19uYW1lID09ICdUd2l0dGVyRmVlZCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZSA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGU7XHJcbiAgICAgICAgICAgIHF1ZXJ5ID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnk7XHJcbiAgICAgICAgICAgIHByb2ZpbGUgPSBzZWxmLnByb2ZpbGU7XHJcbiAgICAgICAgICAgIHJlc3VsdF90eXBlID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucmVzdWx0X3R5cGU7XHJcbiAgICAgICAgICAgIG5leHQgPSBzZWxmLm5leHQ7XHJcbiAgICAgICAgICAgIGxhbmcgPSBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5sYW5nOyBcclxuICAgICAgICAgICAgZ2VvY29kZSA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLmdlb2NvZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggc2VsZi5kYXRhIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGUgPSBzZWxmLmRhdGEudHlwZTtcclxuICAgICAgICAgICAgcXVlcnkgPSBzZWxmLmRhdGEucXVlcnk7XHJcbiAgICAgICAgICAgIHByb2ZpbGUgPSBzZWxmLmRhdGEucHJvZmlsZTtcclxuICAgICAgICAgICAgcmVzdWx0X3R5cGUgPSBzZWxmLmRhdGEucmVzdWx0X3R5cGU7XHJcbiAgICAgICAgICAgIHBhZ2UgPSBzZWxmLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgbmV4dCA9IHNlbGYuZGF0YS5uZXh0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAga2V5OiAncScsXHJcbiAgICAgICAgICAgIHZhbHVlOiBxdWVyeVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIHR5cGUgPT0gJ3R3ZWV0cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGtleTogJ3Jlc3VsdF90eXBlJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXN1bHRfdHlwZVxyXG4gICAgICAgICAgICB9KTsgXHJcblxyXG4gICAgICAgICAgICBpZiAoIGxhbmcgIT09IHVuZGVmaW5lZCAmJiBsYW5nLmxlbmd0aCA+IDAgJiYgbGFuZyAhPSAnYWxsJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBrZXk6ICdsYW5nJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbGFuZ1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGdlb2NvZGUgIT09IHVuZGVmaW5lZCAmJiBnZW9jb2RlLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ2dlb2NvZGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBnZW9jb2RlXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy9wZW9wbGVcclxuICAgICAgICBlbHNlIGlmICggbmV4dCAhPT0gdW5kZWZpbmVkICYmIG5leHQgIT09IGZhbHNlICkgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBrZXk6ICdwYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbmV4dFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiBcImZlZWQvdHdpdHRlclwiLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogcHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldFRXU2VhcmNoJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHR5cGUgPT0gJ3R3ZWV0cycgJiYgcmVzdWx0X3R5cGUgPT0gJ3JlY2VudCcgJiYgbmV4dCAhPT0gdW5kZWZpbmVkICkgcmVxdWVzdC5kYXRhLm1heF9pZCA9IG5leHQ7XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFja19kYXRhID0gJ0ZBSUwnO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT0gJ1NVQ0NFU1MnICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmVycm9ycyAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZXJyb3JzLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvciA9IGRhdGEuZXJyb3JzWyAwIF0uc3RyZWFtRW50cnk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXJyb3IgIT09IHVuZGVmaW5lZCAmJiBlcnJvci5tZXNzYWdlKSB7fS8vRUMuVUkuYWxlcnQoJ1RXIGVycm9yOiAnICsgZXJyb3IubWVzc2FnZSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIEVDLlVJLmFsZXJ0KEVDLmdldE1lc3NhZ2UoJ1VOS05PV05fRVJSJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tfZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLm5leHQgIT09IHVuZGVmaW5lZCApIGNhbGxiYWNrX2RhdGEubmV4dCA9IGRhdGEubmV4dDsgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgRUMuVUkuYWxlcnQoRUMuZ2V0TWVzc2FnZSgnRkFJTF9FUlInKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBjYWxsYmFja19kYXRhICk7XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uICggYWN0aW9uIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC90d2l0dGVyJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggYWN0aW9uID09ICdnZXRUV1NlYXJjaCcgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlID09PSB1bmRlZmluZWQgKSAvL2VtcHR5IHNlYXJjaCBmZWVkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggW10gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeSAhPT0gdW5kZWZpbmVkICYmIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5Lmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2VhcmNoX3JlcXVlc3QoIHNlbGYsIGZ1bmN0aW9uKCBkYXRhIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2lmICggc2VsZi5kYXRhLnJlc3VsdF90eXBlID09ICdwb3B1bGFyJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRwZW9wbGVfc2VjdGlvbi5jc3MoJ2Rpc3BsYXknLCdibG9jaycpOyBcclxuICAgICAgICAgICAgICAgICAgICB9LCAnVHdpdHRlckZlZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBhY3Rpb24gPT0gJ2dldFRXTGlzdHMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0cyA9IHRoaXMucHJvZmlsZS5saXN0cztcclxuXHJcbiAgICAgICAgICAgIGlmICggbGlzdHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggbGlzdHMuZGVmYXVsdF9lbGVtZW50ICE9PSB1bmRlZmluZWQgKSBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IGxpc3RzLmRlZmF1bHRfZWxlbWVudDsgXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBsaXN0cy5kYXRhID09PSB1bmRlZmluZWQgfHwgbGlzdHMuZGF0YS5sZW5ndGggPT09IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHkgLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBsaXN0cy5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keSAuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBzdHJlYW06IHRoaXMuaWRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggKCBhY3Rpb24gPT09ICdnZXRUV0ZvbGxvd2VycycgfHwgYWN0aW9uID09PSAnZ2V0VFdGcmllbmRzTGlzdCcgKSAmJiBzZWxmLm9wdGlvbnMudXNlcl9pZF9mb3JfcmVxdWVzdCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRhdGEudXNlcklEID0gc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3Q7ICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSBkYXRhO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjVFcgJyArIGFjdGlvbiArICdyZXF1ZXN0OicsICdjb2xvcjpvcmFuZ2VyZWQnKVxyXG5cclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY1RXICcgKyBhY3Rpb24gKyAncmVzcG9uc2U6JywgJ2NvbG9yOm9yYW5nZXJlZCcpXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCByZXF1ZXN0LmRhdGEuYWN0aW9uID09ICdnZXRUV1NlbmRUd2VldHMnKSBjb25zb2xlLmVycm9yKCBkYXRhIClcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuY3Vyc29yICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5jdXJzb3JbIDAgXSAhPT0gMCApIHNlbGYubmV4dCA9IGRhdGEuY3Vyc29yWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhWyBkYXRhLmRhdGEubGVuZ3RoIC0gMSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCByZXF1ZXN0LmRhdGEuYWN0aW9uID09ICdnZXRUV0luQm94JyApIHNlbGYuZWxlbWVudC5maW5kKCcuYnRuLnRvZ2dsZScpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ2xpc3RzJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pdGVtc1sgMCBdICE9PSB1bmRlZmluZWQgKSBkYXRhID0gZGF0YS5jb25jYXQoIHRoaXMuaXRlbXNbIDAgXS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnbWVudGlvbnMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggW3RoaXNfZGF0dW1dLCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBpO1xyXG5cclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIC8vIGRpcmVjdCBtZXNzYWdlcyBmZWVkXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdkaXJlY3RfbWVzc2FnZScgJiYgZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBtaW5jb21pbmcgPSBbXSxcclxuICAgICAgICAgICAgICAgIGN1c2VySWQgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC5kYXRhLnVzZXJJZDtcclxuXHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhWyBpIF0uY29udmVyc2F0aW9uID09PSB1bmRlZmluZWQgfHwgZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSA9PT0gdW5kZWZpbmVkICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSApKSBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5ID0gWyBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5IF07XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSwgc2VsZiApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBrID0gMCwgbGwgPSBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5Lmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbWVzc2FnZSA9IGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnlbIGsgXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNtZXNzYWdlLnJlY2lwaWVudC5pZF9zdHIgPT09IGN1c2VySWQgKSAvLyBsYXRlc3QgaW5jb21pbmcgaW4gY29udmVyc2F0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBjbWVzc2FnZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggY21lc3NhZ2UuY3JlYXRlZF9hdCApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBjbWVzc2FnZS5pZF9zdHJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG1pbmNvbWluZy5zb3J0KCBmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA+IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPCBiLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTsgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gZmluZCBsYXRlc3QgaW5jb21pbmdcclxuICAgICAgICAgICAgaWYgKCBtaW5jb21pbmcubGVuZ3RoID4gMCApIHNlbGYuZmlyc3RJdGVtSUQgPSBtaW5jb21pbmdbIDAgXS50aW1lO1xyXG5cclxuICAgICAgICAgICAgZWxzZSAgc2VsZi5maXJzdEl0ZW1JRCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnc2VhcmNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ291dHJlYWNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApIGZvciAoIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnbWVudGlvbnMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggW3RoaXNfZGF0dW1dLCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgdXNlcjogZGF0YS51c2VyLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLmNyZWF0ZWRfYXQgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIGZhdm9yaXRlczoge1xyXG4gICAgICAgICAgICAgICAgY291bnQ6IGRhdGEuZmF2b3JpdGVfY291bnQsXHJcbiAgICAgICAgICAgICAgICBieV9tZTogZGF0YS5mYXZvcml0ZWRcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmV0d2VldHM6IHtcclxuICAgICAgICAgICAgICAgIGNvdW50OiBkYXRhLnJldHdlZXRfY291bnQsXHJcbiAgICAgICAgICAgICAgICBieV9tZTogZGF0YS5yZXR3ZWV0ZWQsXHJcbiAgICAgICAgICAgICAgICBpZDogKCAoIGRhdGEucmV0d2VldGVkX3N0YXR1cyAhPT0gdW5kZWZpbmVkICkgPyBkYXRhLnJldHdlZXRlZF9zdGF0dXMuaWRfc3RyIDogZGF0YS5pZF9zdHIgKSxcclxuICAgICAgICAgICAgICAgIHJldHdlZXRJZDogKCAoIGRhdGEucmV0d2VldElkICE9PSB1bmRlZmluZWQgKSA/IGRhdGEucmV0d2VldElkIDogZmFsc2UgKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBkYXRhLnRleHQsXHJcbiAgICAgICAgICAgIGZyb21OYW1lOiAoIGRhdGEubmFtZSB8fCBkYXRhLnVzZXIubmFtZSApLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogKCBkYXRhLnNjcmVlbl9uYW1lIHx8IGRhdGEudXNlci5zY3JlZW5fbmFtZSApLFxyXG4gICAgICAgICAgICBwcm9maWxlUGljOiAoIGRhdGEucHJvZmlsZV9pbWFnZV91cmwgfHwgZGF0YS51c2VyLnByb2ZpbGVfaW1hZ2VfdXJsICksXHJcbiAgICAgICAgICAgIHBvc3RJRDogZGF0YS5pZF9zdHIsXHJcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkX3N0cixcclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuZW50aXRpZXMgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0gW107XHJcbiAgICAgICAgICAgIGRhdGEuZW50aXRpZXMubWVkaWEubWVkaWFfdXJsLmZvckVhY2goZnVuY3Rpb24obWVkaWFfdXJsKXtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgICAgICBzcmM6IG1lZGlhX3VybFxyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9KTsgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHVybHMgPSBbXTtcclxuICAgICAgICBpZiAoIGRhdGEuZW50aXRpZXMgJiYgZGF0YS5lbnRpdGllcy51cmxzICYmICEgXy5pc0VtcHR5KCBkYXRhLmVudGl0aWVzLnVybHMgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxzID0gZGF0YS5lbnRpdGllcy51cmxzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggdXJscyApICkgdXJscyA9IFsgdXJscyBdOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZvciBzaGFyZWQgWVQgbGlua1xyXG4gICAgICAgIGlmICggdXJscy5sZW5ndGggJiYgKCFkYXRhLmVudGl0aWVzLm1lZGlhIHx8IFxyXG4gICAgICAgICAgICAoICFBcnJheS5pc0FycmF5KCBkYXRhLmVudGl0aWVzLm1lZGlhICkgJiYgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgJiYgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwuaW5kZXhPZignaHR0cHM6Ly9pLnl0aW1nLmNvbS8nKSAhPT0gLTEgKSkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdmlkZW9faWQ7XHJcbiAgICAgICAgICAgIGlmICggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZigneW91dHViZS5jb20nKSAhPT0gLTEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFzaGVzID0gdXJsc1swXS5leHBhbmRlZF91cmwuc2xpY2UoIHVybHNbMF0uZXhwYW5kZWRfdXJsLmluZGV4T2YoJz8nKSArIDEgKS5zcGxpdCgnJicpO1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBoYXNoZXNbaV0uc3BsaXQoJz0nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBoYXNoWzBdID09ICd2JyApIHZpZGVvX2lkID0gaGFzaFsxXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZignLy95b3V0dS5iZS8nKSAhPT0gLTEgKSB2aWRlb19pZCA9IHVybHNbMF0uZXhwYW5kZWRfdXJsLnJlcGxhY2UoJ2h0dHBzOi8veW91dHUuYmUvJywnJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIHZpZGVvX2lkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5lbnRpdGllcy5tZWRpYSA9IHsgbWVkaWFfdXJsOidodHRwczovL2ltZy55b3V0dWJlLmNvbS92aS8nICt2aWRlb19pZCsgJy9ocWRlZmF1bHQuanBnJyB9O1xyXG4gICAgICAgICAgICAgICAgZGF0YS5lbnRpdGllcy52aWRlb19pZCA9IHZpZGVvX2lkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVzc2FnZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIGxpbmtzXHJcbiAgICAgICAgICAgIHZhciBleHAgPSAvKFxcYigoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC98Yml0Lmx5XFwvfGdvby5nbFxcL3x0LmNvXFwvKVstQS1aMC05KyZAI1xcLyU/PX5ffCE6LC47XSpbLUEtWjAtOSsmQCNcXC8lPX5ffF0pL2lnO1xyXG5cclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZXNzYWdlID0gdGhpc19kYXR1bS5tZXNzYWdlLnJlcGxhY2UoZXhwLCcnKS50cmltKCk7XHJcblxyXG4gICAgICAgICAgICB1cmxzLmZvckVhY2goZnVuY3Rpb24odXJsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgKz0gJyAnICsgdXJsLnVybDsgICBcclxuICAgICAgICAgICAgfSk7ICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X3Bvc3RfbWVkaWFfZWxlbWVudCA9IGZ1bmN0aW9uICggcmF3X2RhdGEsICRtZWRpYSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGV4dF9lbGVtZW50LFxyXG4gICAgICAgICAgICBzbGlkZXJfaXRlbXMgPSBbXTtcclxuICAgICAgICBpZiAoIHJhd19kYXRhICYmIHJhd19kYXRhLmVudGl0aWVzICYmIHJhd19kYXRhLmVudGl0aWVzLm1lZGlhIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBleHRfbWVkaWFfZGF0YSA9IHJhd19kYXRhLmVudGl0aWVzLmV4dF9tZWRpYSxcclxuICAgICAgICAgICAgICAgIGV4dF9tZWRpYSxcclxuICAgICAgICAgICAgICAgIHZhcmlhbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiggZXh0X21lZGlhX2RhdGEgJiYgZXh0X21lZGlhX2RhdGEubWVkaWEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGV4dF9tZWRpYV9kYXRhLm1lZGlhICkgKSBleHRfbWVkaWEgPSBleHRfbWVkaWFfZGF0YS5tZWRpYVsgMCBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgZXh0X21lZGlhID0gZXh0X21lZGlhX2RhdGEubWVkaWE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZXh0X21lZGlhICYmICggZXh0X21lZGlhLnR5cGUgPT09ICdhbmltYXRlZF9naWYnIHx8IGV4dF9tZWRpYS50eXBlID09PSAndmlkZW8nICkgJiYgZXh0X21lZGlhLnZpZGVvX2luZm8gJiYgZXh0X21lZGlhLnZpZGVvX2luZm8udmFyaWFudHMgJiYgZXh0X21lZGlhLnZpZGVvX2luZm8udmFyaWFudHMudmFyaWFudCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YXJpYW50X2RhdGEgPSBleHRfbWVkaWEudmlkZW9faW5mby52YXJpYW50cy52YXJpYW50O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggdmFyaWFudF9kYXRhICkgKSB2YXJpYW50ID0gdmFyaWFudF9kYXRhWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB2YXJpYW50ID0gdmFyaWFudF9kYXRhOyAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB2YXJpYW50IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJG1lZGlhLmFkZENsYXNzKCdjZW50ZXInKTtcclxuICAgICAgICAgICAgICAgIC8vZXh0X2VsZW1lbnQgPSAkKCc8dmlkZW8gbG9vcCBjbGFzcz1cImFuaW1hdGVkLWdpZlwiIHBvc3Rlcj1cIicgKyBleHRfbWVkaWEubWVkaWFfdXJsX2h0dHBzICsgJ1wiIHNyYz1cIicgKyB2YXJpYW50LnVybCArICdcIj48L3ZpZGVvPicpO1xyXG4gICAgICAgICAgICAgICAgLyppZiAoIGV4dF9tZWRpYS50eXBlID09PSAnYW5pbWF0ZWRfZ2lmJyApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJCgnPHZpZGVvIGF1dG9wbGF5IGxvb3AgY2xhc3M9XCJhbmltYXRlZC1naWZcIiBwb3N0ZXI9XCInICsgZXh0X21lZGlhLm1lZGlhX3VybF9odHRwcyArICdcIiBzcmM9XCInICsgdmFyaWFudC51cmwgKyAnXCI+PC92aWRlbz4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHsqL1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd1aS1ncmlkLXNvbG8gbF9tZXNzYWdlJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0naW1nX2JveCB2aWRlbyB1aS1ncmlkLXNvbG8gcG9zaXRpb24tcmVsYXRpdmUnPjxpbWcgY2xhc3M9XFxcInZpZGVvLWJ1dHRvblxcXCIgc3JjPVxcXCJpbWcvcGxheS1idXR0b24ucG5nXFxcIj48aW1nIGNsYXNzPVxcXCJpbWctcmVzcG9uc2l2ZVxcXCIgc3JjPSdcIiArIGV4dF9tZWRpYS5tZWRpYV91cmxfaHR0cHMgKyBcIic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsZnVuY3Rpb24gKClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVDLlVJLklBQiggZW5jb2RlVVJJKHZhcmlhbnQudXJsICksJycsJ19zeXN0ZW0nKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggcmF3X2RhdGEucHJldmlld19jb250ZW50IClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlld19jb250ZW50ID0gSlNPTi5wYXJzZSggcmF3X2RhdGEucHJldmlld19jb250ZW50ICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0dWZmID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcHJldmlld19jb250ZW50LnRpdGxlICkgdGl0bGUgPSBwcmV2aWV3X2NvbnRlbnQudGl0bGU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcmF3X2RhdGEucGljdHVyZV90ZXh0ICkgc3R1ZmYgPSByYXdfZGF0YS5waWN0dXJlX3RleHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94Jz48aW1nIHNyYz0nXCIgKyByYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKyBcIic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGEgY2xhc3M9J3BoX2xpbmsnIGhyZWY9J1wiICsgcHJldmlld19jb250ZW50LnVybCArIFwiJyB0YXJnZXQ9J19ibGFuayc+XCIgKyB0aXRsZSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgbWVkaWEnPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzpyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwsIHc6OTY0LCBoOjEwMjR9KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJCgnPGltZyBjbGFzcz1cInR3aXR0ZXItaW1hZ2VcIiBzcmM9XCInICtyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwrICdcIiA+Jyk7IFxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzpyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwsIHc6OTY0LCBoOjEwMjR9KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHZpZGVvX2lkID0gcmF3X2RhdGEuZW50aXRpZXMudmlkZW9faWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB2aWRlb19pZCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGNsaWNrYWJsZSA9ICQoJzxkaXY+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXh0X2VsZW1lbnQuZmluZCgnLmltZ19ib3gnKS5sZW5ndGggKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRjbGlja2FibGUgPSBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpLmFkZENsYXNzKCd2aWRlbycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZSA9ICRtZWRpYTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJG1lZGlhLmFkZENsYXNzKCd2aWRlbycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZS5vbignY2xpY2snLCBmdW5jdGlvbiggZSApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBFQy5VSS5JQUIoIGVuY29kZVVSSSggJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLycrdmlkZW9faWQrJz9hdXRvcGxheT0xJyApLCcnLCdfc3lzdGVtJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qdmFyIG1lZGlhT2JqZWN0ID0gJzxpZnJhbWUgc3JjPVwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJysgdmlkZW9faWQgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICc/YXV0b3BsYXk9MVwiIHdpZHRoPVwiMTI4MFwiIGhlaWdodD1cIjcyMFwiIGZyYW1lYm9yZGVyPVwiMFwiPjwvaWZyYW1lPic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RfbWFuYWdlci53YXRjaFBpY3R1cmVWaWRlbyggbWVkaWFPYmplY3QsIHRydWUgKTsgKi8gICBcclxuICAgICAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW2V4dF9lbGVtZW50LCBzbGlkZXJfaXRlbXNdO1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBUd2l0dGVyRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gWW91VHViZUZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gWW91VHViZUZlZWQ7XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gcmVxdWVzdHMgZGF0YSBhbmQgdGhlbiBjYWxscyB0aGlzLnNhdmVfaXRlbXNcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlDaGFubmVsSG9tZSc6IHRoaXMuZ2V0WW91VHViZUZlZWQoXCJ5dF9teUNoYW5uZWxIb21lXCIsXCJcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teUNoYW5uZWxWaWRlb3MnOiB0aGlzLmdldFlvdVR1YmVGZWVkKFwieXRfbXlDaGFubmVsVmlkZW9zXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlTdWJzY3JpcHRpb24nOiB0aGlzLmdldFlvdVR1YmVGZWVkKFwieXRfbXlTdWJzY3JpcHRpb25cIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubmV4dCA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLm5leHQgKSB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJylbMF0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRZb3VUdWJlRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIG5leHRUb2tlbjogdGhpcy5uZXh0IFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC95b3VUdWJlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhLm5leHRUb2tlbiAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YS5uZXh0VG9rZW47XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5nZXRZb3VUdWJlRmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRZb3VUdWJlRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5pZCA9PSAneXRfbXlTdWJzY3JpcHRpb24nICkgZGF0YS5jaGFubmVsX2lkID0gLyonVUMnICsgKi90aGlzLnByb2ZpbGUuZGF0YS51c2VySWQucmVwbGFjZSgnY2hhbm5lbD09JywnJyk7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC95b3VUdWJlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5uZXh0VG9rZW4gIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5kYXRhLm5leHRUb2tlbjtcclxuXHJcbiAgICAgICAgICAgIC8vdGVtcG9yYXJ5XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ3l0X215U3Vic2NyaXB0aW9uJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0Q2hhbm5lbElkICE9PSB1bmRlZmluZWQgKSBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0Q2hhbm5lbElkOyBcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICd5dF9teVN1YnNjcmlwdGlvbicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEuaXRlbXMsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5pdGVtcyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5pdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGEuaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLml0ZW1zICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5pdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGEuaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uKCBkYXRhICkge1xyXG5cclxuICAgICAgICB2YXIgbWVkaWEgPSBkYXRhLm1lZGlhO1xyXG5cclxuICAgICAgICBpZiAoIG1lZGlhLnR5cGUgPT0gXCJ2aWRlb1wiICkge1xyXG4gICAgICAgICAgICBtZWRpYS52aWRlbyA9IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiAnaHR0cDovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgbWVkaWEuaWQgKyAnP2F1dG9wbGF5PTEnLFxyXG4gICAgICAgICAgICAgICAgc291cmNlX3VybDogJ2h0dHA6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJyArIG1lZGlhLmlkICsgJz9hdXRvcGxheT0xJ1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgIGZyb21JZDogZGF0YS5mcm9tSWQsXHJcbiAgICAgICAgICAgIGZyb21OYW1lOiBkYXRhLmZyb21OYW1lLFxyXG4gICAgICAgICAgICBwcm9maWxlUGljOiBkYXRhLnByb2ZpbGVQaWMsXHJcbiAgICAgICAgICAgIHByb2ZpbGVMaW5rOiBkYXRhLnByb2ZpbGVMaW5rLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLnVwZGF0ZVRpbWUgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSxcclxuXHJcbiAgICAgICAgICAgIC8vbWV0YUluZm86ICggZGF0YS5pdGVtc1sgaSBdLmNoYW5uZWxJZCE9dW5kZWZpbmVkICYmIGRhdGEuaXRlbXNbIGkgXS5jaGFubmVsVGl0bGUhPXVuZGVmaW5lZCksXHJcbiAgICAgICAgICAgIGNoYW5uZWxJZDogZGF0YS5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgIGNoYW5uZWxMaW5rOiAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vY2hhbm5lbC8nICsgZGF0YS5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogZGF0YS5jaGFubmVsVGl0bGUsXHJcbiAgICAgICAgICAgIGFjdGl2aXR5VHlwZTogZGF0YS5hY3Rpdml0eVR5cGUgfHwgJycsXHJcblxyXG4gICAgICAgICAgICBsaWtlczogZGF0YS5saWtlcyxcclxuICAgICAgICAgICAgdmlld3M6IGRhdGEudmlld3MsXHJcbiAgICAgICAgICAgIGNvbW1lbnRzOiBkYXRhLmNvbW1lbnRzLFxyXG5cclxuICAgICAgICAgICAgLy91c2VyOiBkYXRhWyBpIF0udXNlcixcclxuICAgICAgICAgICAgLy9uYW1lOiBkYXRhLml0ZW1zWyBpIF0udGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG1lZGlhOiBtZWRpYSxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgcG9zdElEOiBkYXRhLmZyb21JZCwgLy8/Pz9cclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEubWVzc2FnZS5pbmRleE9mKCd1cGxvYWRlZCBhIHZpZGVvJykgIT0gLTEgKSB0aGlzX2RhdHVtLm1lc3NhZ2UgPSAnJztcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBZb3VUdWJlRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdpb25pY0FwcC5jb25zdGFudHMnLFtdKSAgXHJcbiAgLmNvbnN0YW50KCdhcGlVcmwnLCAnaHR0cHM6Ly9lY2xpbmNoZXIuY29tL3NlcnZpY2UvJylcclxuICAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywgeyAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnIH0pOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2lvbmljQXBwLmNvbnRyb2xsZXJzJywgW10pXHJcblxyXG4uY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRpb25pY0xvYWRpbmcsIEF1dGhTZXJ2aWNlKSB7XHJcblxyXG4gICAgJHNjb3BlLmRhdGEgPSB7fTtcclxuICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAvLyRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcblxyXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7XHJcbiAgICAgICAgICAgIG5vQmFja2Ryb3A6IHRydWVcclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIHZhciBhID0gQXV0aFNlcnZpY2UubG9naW4oJHNjb3BlLmRhdGEudXNlcm5hbWUsICRzY29wZS5kYXRhLnBhc3N3b3JkLCBmdW5jdGlvbihyZXNwKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdaWlo6JyArIHJlc3ApO1xyXG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLmhvbWUnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxufSlcclxuXHJcblxyXG4uY29udHJvbGxlcignSG9tZVRhYkN0cmwnLCBmdW5jdGlvbigkc3RhdGUsICRzY29wZSwgJHJvb3RTY29wZSwgRUMsICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwsICRpb25pY0xvYWRpbmcsIGFjY291bnRNYW5hZ2VyLCAkdXJsUm91dGVyLCBfKSB7XHJcblxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUEhISEhISMjIyMjJyk7XHJcbiAgICBcclxuICAgIGlmKCAkcm9vdFNjb3BlLnNvY2lhbCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICBjb25zb2xlLmxvZygkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcik7XHJcblxyXG4gICAgJHNjb3BlLiRvbihcIiRpb25pY1ZpZXcuZW50ZXJcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJHNjb3BlLiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ2hvbWUnKSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG5cclxuICAgICRzY29wZS5ncm91cHMgPSBbXTtcclxuICAgICRzY29wZS5hY2NfdHlwZXMgPSBbXTtcclxuXHJcbiAgICBpZiggYWNjb3VudE1hbmFnZXIuaXNfcmVuZGVyZWQoICkgKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdvb29vb29vb29vb28nKTtcclxuICAgICAgICBwcmVwYXJlQWNjb3VudHMoKTtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnbm5ubm5ubm5ubm5uJyk7XHJcbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KHtub0JhY2tkcm9wOiB0cnVlfSk7XHJcbiAgICAgICAgYWNjb3VudE1hbmFnZXIuaW5pdChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgIHByZXBhcmVBY2NvdW50cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHByZXBhcmVBY2NvdW50cygpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIEFDQ1MgPSBhY2NvdW50TWFuYWdlci5saXN0X2FjY291bnRzKCk7XHJcblxyXG4gICAgICAgIHZhciB0ZW1wID0gW10sXHJcbiAgICAgICAgICAgIGFjY190eXBlcyA9IFtdO1xyXG5cclxuICAgICAgICBBQ0NTLmZvckVhY2goZnVuY3Rpb24oYWNjb3VudCwgaW5kZXgpIHtcclxuICAgICAgICAgICAgdmFyIHR5cGUgPSBhY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0ZW1wW3R5cGVdID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHRlbXBbdHlwZV0gPSBbXTtcclxuICAgICAgICAgICAgICAgIHRlbXBbdHlwZV0ucHJvZmlsZXMgPSBbXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL2Vsc2VcclxuICAgICAgICAgICAgLy97XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWNjb3VudC5wcm9maWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGFjY291bnQucHJvZmlsZXNbaV0ubW9uaXRvcmVkID09ICdvZmYnKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdLnByb2ZpbGVzLnB1c2goYWNjb3VudC5wcm9maWxlc1tpXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy99XHJcblxyXG4gICAgICAgICAgICB0ZW1wW3R5cGVdLnR5cGUgPSB0eXBlO1xyXG4gICAgICAgICAgICBpZiAoYWNjX3R5cGVzLmluZGV4T2YodHlwZSkgPT09IC0xKSBhY2NfdHlwZXMucHVzaCh0eXBlKTtcclxuXHJcbiAgICAgICAgICAgIC8vdGVtcFt0eXBlXS5wdXNoKCB7J3R5cGUnOnR5cGUsICdwcm9maWxlcyc6YWNjb3VudC5wcm9maWxlc30gKTtcclxuXHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRlbXApO1xyXG4gICAgICAgICRzY29wZS5ncm91cHMgPSB0ZW1wO1xyXG4gICAgICAgICRzY29wZS5hY2NfdHlwZXMgPSBhY2NfdHlwZXM7XHJcblxyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLnNldF9yZW5kZXJlZCggdHJ1ZSApO1xyXG5cclxuICAgICAgICAkc2NvcGUub3BlbkZlZWRzID0gZnVuY3Rpb24oIHByb2ZpbGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZmlsZSk7XHJcbiAgICAgICAgICAgIHByb2ZpbGUuc29jaWFsLnJlbmRlcigpO1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG5cclxuICAgICRzY29wZS5nbnMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyIGdldEV4aXN0aW5nU3RhdGUgPSAkc3RhdGUuZ2V0KCd0YWJzLnJhbS1uZXcnKTtcclxuXHJcbiAgICAgICAgICBpZihnZXRFeGlzdGluZ1N0YXRlICE9PSBudWxsKXtcclxuICAgICAgICAgICAgcmV0dXJuOyBcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgc3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgXCJ1cmxcIjogJy9yYW0tbmV3JyxcclxuICAgICAgICAgICAgICBcInZpZXdzXCI6IHtcclxuICAgICAgICAgICAgICAgICdob21lLXRhYic6IHtcclxuICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3JhbS5odG1sXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgJHN0YXRlUHJvdmlkZXJSZWYuc3RhdGUoJ3RhYnMucmFtLW5ldycsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAkdXJsUm91dGVyLnN5bmMoKTtcclxuICAgICAgICAgICR1cmxSb3V0ZXIubGlzdGVuKCk7XHJcblxyXG4gICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLnJhbS1uZXcnKTtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGdldEV4aXN0aW5nU3RhdGUpO1xyXG4gICAgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignTWFuYWdlQWNjb3VudHMnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgRUMsICRyb290U2NvcGUsICRpb25pY0hpc3RvcnksICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwsICRpb25pY0xvYWRpbmcsIGFjY291bnRNYW5hZ2VyLCAkbG9jYWxTdG9yYWdlKSB7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ0JCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkInKTtcclxuICAgIGNvbnNvbGUubG9nKCckbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncycpO1xyXG4gICAgY29uc29sZS5sb2coJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MpO1xyXG4gICAgLy9jb25zb2xlLmxvZyhhY2NvdW50TWFuYWdlci50ZXN0KCkpO1xyXG4gICAgXHJcbiAgICAkc2NvcGUuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgnaG9tZScpKTtcclxuXHJcbiAgICAkc2NvcGUuYWNjb3VudHMgPSBhY2NvdW50TWFuYWdlci5hY2NvdW50cygpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCAkc2NvcGUuYWNjb3VudHMgKTtcclxuXHJcbiAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUVudGVyJywgZnVuY3Rpb24oZXZlbnQsIHZpZXdEYXRhKSB7XHJcbiAgICAgICAgdmlld0RhdGEuZW5hYmxlQmFjayA9IHRydWU7XHJcbiAgICAgICAgdmlld0RhdGEuaGFzSGVhZGVyQmFyID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyh2aWV3RGF0YSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgYnYgPSAkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCk7XHJcblxyXG4gICAgJHNjb3BlLiRpb25pY0dvQmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLS0tLSycpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGJ2KTtcclxuXHJcbiAgICAgICAgaWYgKGJ2KSB7XHJcbiAgICAgICAgICAgICRpb25pY0hpc3RvcnkuZ29CYWNrKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLmhvbWUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuYWRkX2FjY291bnQgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgICAgYWNjb3VudE1hbmFnZXIuYWRkX2FjY291bnQodHlwZSk7XHJcbiAgICB9O1xyXG5cclxuICAgICRzY29wZS5jc3QgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLmFjY291bnRzKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhhY2NvdW50TWFuYWdlci5hY2NvdW50cygpKTtcclxuICAgICAgICAvL2FjY291bnRNYW5hZ2VyLnNldF9yZW5kZXJlZCggZmFsc2UgKTtcclxuICAgIH07XHJcblxyXG5cclxuXHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignRmVlZHMnLCBmdW5jdGlvbigkc2NvcGUsICAkaW9uaWNTY3JvbGxEZWxlZ2F0ZSwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsIEVDLCAkaW9uaWNIaXN0b3J5LCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJGxvY2FsU3RvcmFnZSkge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDISEhISEjIyMjIycpO1xyXG4gICAgLy9jb25zb2xlLmxvZygnJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MnKTtcclxuICAgIC8vY29uc29sZS5sb2coJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIpO1xyXG4gICAgLy9jb25zb2xlLmxvZygkc3RhdGUuY3VycmVudC5uYW1lKTtcclxuICAgXHJcbiAgICBcclxuICAgIFxyXG4gICAgJHNjb3BlLm1vcmVEYXRhQ2FuQmVMb2FkZWQgPSBmYWxzZTtcclxuICAgICRzY29wZS5jb3VudGVyID0gMDtcclxuXHJcbiAgICB2YXIgaW5kZXggPSBfLmZpbmRMYXN0SW5kZXgoJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6ICRzdGF0ZS5jdXJyZW50Lm5hbWV9KTtcclxuICAgICRzY29wZS5mZWVkID0gJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXJbaW5kZXhdO1xyXG4gICAgXHJcbiAgICBjb25zb2xlLmxvZygkc2NvcGUuZmVlZCk7XHJcbiAgICB2YXIgbmV4dF9wYWdlX2luZGV4ID0gMCxcclxuICAgICAgICBwcmV2X3BhZ2VfaW5kZXggPSAwLFxyXG4gICAgICAgIG5vX29mX3BhZ2VzID0gJHNjb3BlLmZlZWQucHJvZmlsZS5zb2NpYWwudXBkYXRlZF9zdHJlYW1zX29yZGVyLmxlbmd0aDsvLyRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyLmxlbmd0aDtcclxuXHJcbiAgICBpZiggaW5kZXggPT09IDAgKVxyXG4gICAge1xyXG4gICAgICAgIG5leHRfcGFnZV9pbmRleCA9IGluZGV4ICsgMTtcclxuICAgICAgICBwcmV2X3BhZ2VfaW5kZXggPSBub19vZl9wYWdlcyAtIDE7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKCBpbmRleCA9PSAobm9fb2ZfcGFnZXMgLSAxKSApXHJcbiAgICB7XHJcbiAgICAgICAgbmV4dF9wYWdlX2luZGV4ID0gMDtcclxuICAgICAgICBwcmV2X3BhZ2VfaW5kZXggPSBub19vZl9wYWdlcyAtIDI7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgbmV4dF9wYWdlX2luZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IGluZGV4IC0gMTtcclxuICAgIH1cclxuXHJcbiAgICAkc2NvcGUubmV4dF9wYWdlX2lkID0gJHNjb3BlLmZlZWQucHJvZmlsZS5zb2NpYWwudXBkYXRlZF9zdHJlYW1zX29yZGVyW25leHRfcGFnZV9pbmRleF07Ly8kcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcltuZXh0X3BhZ2VfaW5kZXhdLnBhZ2VfaWQ7XHJcbiAgICAkc2NvcGUucHJldl9wYWdlX2lkID0gJHNjb3BlLmZlZWQucHJvZmlsZS5zb2NpYWwudXBkYXRlZF9zdHJlYW1zX29yZGVyW3ByZXZfcGFnZV9pbmRleF07Ly8kcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcltwcmV2X3BhZ2VfaW5kZXhdLnBhZ2VfaWQ7XHJcblxyXG4gICAgY29uc29sZS5sb2coaW5kZXgpO1xyXG4gICAgY29uc29sZS5sb2coJHNjb3BlLmZlZWQpO1xyXG4gICAgXHJcbiAgICAkc2NvcGUudGVzdF9uYW1lID0gW107XHJcbiAgICAkc2NvcGUudGVzdF9uYW1lLnB1c2goeyduYW1lJzonUmFtJ30pO1xyXG4gICAgJHNjb3BlLmdldFNjcm9sbFBvc2l0aW9uID0gZnVuY3Rpb24oKSB7ICAgICAgIFxyXG4gICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAkc2NvcGUuZmVlZC5kZCA9IHsgJ2NvdW50JzowLCAnZGF0YSc6W10sICdwbGFjZWhvbGRlcic6ICcnfTtcclxuICAgICRzY29wZS5zZWxlY3RlZF9kZCA9IHt9O1xyXG5cclxuICAgICRzY29wZS4kd2F0Y2goJ2ZlZWQuZHJvcGRvd25fZmVlZCcsIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICBpZiggJHNjb3BlLmZlZWQuZHJvcGRvd25fZmVlZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTU1NTU1NTU1NTU1NTU1NTU0nKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqKTtcclxuICAgICAgICAgICAgJHNjb3BlLmZlZWQuZGQgPSAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouZ2V0X2Ryb3Bkb3duKCk7XHJcblxyXG4gICAgICAgICAgICBpZiggISRzY29wZS5mZWVkLmRkLmRhdGEubGVuZ3RoIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ3Njcm9sbC5pbmZpbml0ZVNjcm9sbENvbXBsZXRlJyk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUubW9yZWRhdGEgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkX2RkID0gJHNjb3BlLmZlZWQuZGQuZGF0YVswXTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5sb2FkTW9yZSgpO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICBcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgICRzY29wZS4kd2F0Y2hDb2xsZWN0aW9uKCdmZWVkLml0ZW1zJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoICRzY29wZS5mZWVkLml0ZW1zLmxlbmd0aCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkonKTtcclxuICAgICAgICAgICAgJHNjb3BlLiRicm9hZGNhc3QoJ3Njcm9sbC5pbmZpbml0ZVNjcm9sbENvbXBsZXRlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgICRzY29wZS4kd2F0Y2goJ2ZlZWQubG9hZF9tb3JlX2ZsYWcnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiggISRzY29wZS5mZWVkLmxvYWRfbW9yZV9mbGFnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgICRzY29wZS5tb3JlZGF0YSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgJHNjb3BlLm1vcmVkYXRhID0gZmFsc2U7XHJcblxyXG4gICAgJHNjb3BlLmxvYWRNb3JlID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG5cclxuICAgICAgICBpZiggJHNjb3BlLmZlZWQuZHJvcGRvd25fZmVlZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICEgJHNjb3BlLmZlZWQuaXRlbXMubGVuZ3RoICYmICRzY29wZS5jb3VudGVyID09IDEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5sYXN0X2xvYWRlZF90aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLnNldF9kZWZhdWx0X2dyb3VwX2lkKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5nZXRfZGF0YSggJHNjb3BlLnNlbGVjdGVkX2RkICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbG9hZCBtb3JlLi4uLi4uLi4uLi4uLi4uLi4uLi4uJyk7XHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggISAkc2NvcGUuZmVlZC5pdGVtcy5sZW5ndGggJiYgISAkc2NvcGUuY291bnRlciApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmxhc3RfbG9hZGVkX3RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQuZ2V0X2RhdGEoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLm1vcmUoKTtcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgICRzY29wZS5jb3VudGVyKys7ICAgICAgICBcclxuICAgICAgICBcclxuICAgIH07XHJcbiAgICBcclxuICAgICRzY29wZS5sb2FkTW9yZSgpO1xyXG4gICAgXHJcbiAgICAkc2NvcGUucHJvY2Vzc0REID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5zZWxlY3RlZF9kZCk7XHJcbiAgICAgICAgJHNjb3BlLmZlZWQuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgJHNjb3BlLmNvdW50ZXIgPSAxO1xyXG4gICAgICAgICRzY29wZS5sb2FkTW9yZSgpO1xyXG5cclxuICAgICAgICAvLyRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5zZXRfZGVmYXVsdF9ncm91cF9pZCggJHNjb3BlLnNlbGVjdGVkX2RkICk7XHJcbiAgICAgICAgLy8kc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouZ2V0X2RhdGEoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLiRvbihcIiRpb25pY1ZpZXcuZW50ZXJcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGRlbGVnYXRlID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCdtYWluU2Nyb2xsJyk7XHJcbiAgICAgICAgLy9kZWxlZ2F0ZS5zY3JvbGxUbyggMCwgJHNjb3BlLmZlZWQubGFzdF9zY3JvbGxfcG9zaXRpb24gKTtcclxuICAgICAgICAkc2NvcGUuJHBhcmVudC4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdmZWVkJykpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJHNjb3BlLiRvbihcIiRpb25pY1ZpZXcuYmVmb3JlTGVhdmVcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCdtYWluU2Nyb2xsJykuZ2V0U2Nyb2xsUG9zaXRpb24oKTtcclxuICAgICAgICAkc2NvcGUuZmVlZC5sYXN0X3Njcm9sbF9wb3NpdGlvbiA9IHBvc2l0aW9uLnRvcDtcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG5cclxuICAgIFxyXG5cclxuICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlRW50ZXInLCBmdW5jdGlvbihldmVudCwgdmlld0RhdGEpIHtcclxuICAgICAgICB2aWV3RGF0YS5lbmFibGVCYWNrID0gdHJ1ZTtcclxuICAgICAgICB2aWV3RGF0YS5oYXNIZWFkZXJCYXIgPSB0cnVlO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHZpZXdEYXRhKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBidiA9ICRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKTtcclxuXHJcbiAgICAkc2NvcGUuJGlvbmljR29CYWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0tLS0tLJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYnYpO1xyXG5cclxuICAgICAgICBpZiAoYnYpIHtcclxuICAgICAgICAgICAgJGlvbmljSGlzdG9yeS5nb0JhY2soKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIFxyXG5cclxuXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ1B1Ymxpc2hpbmcnLCBmdW5jdGlvbigkc2NvcGUsIEVDLCBhY2NvdW50TWFuYWdlcikge1xyXG5cclxuICAgIFxyXG5cclxuICAgJHNjb3BlLiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ3B1Ymxpc2hpbmcnKSk7XHJcblxyXG4gICAgXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ1Bvc3RTZXR0aW5ncycsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkaW9uaWNIaXN0b3J5LCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlcikge1xyXG5cclxuICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUVudGVyJywgZnVuY3Rpb24oZXZlbnQsIHZpZXdEYXRhKSB7XHJcbiAgICAgICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh2aWV3RGF0YSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBidiA9ICRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKTtcclxuXHJcbiAgICAgICAgJHNjb3BlLiRpb25pY0dvQmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYnYpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGJ2KSB7XHJcbiAgICAgICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLmxpc3QnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgIH0pXHJcbiAgICAuY29udHJvbGxlcignQnV0dG9uc1RhYkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwpIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLnNob3dQb3B1cCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkaW9uaWNQb3B1cC5hbGVydCh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ1BvcHVwJyxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdUaGlzIGlzIGlvbmljIHBvcHVwIGFsZXJ0ISdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUuc2hvd0FjdGlvbnNoZWV0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY0FjdGlvblNoZWV0LnNob3coe1xyXG4gICAgICAgICAgICAgICAgdGl0bGVUZXh0OiAnSW9uaWMgQWN0aW9uU2hlZXQnLFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uczogW3tcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnRmFjZWJvb2snXHJcbiAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1R3aXR0ZXInXHJcbiAgICAgICAgICAgICAgICB9LCBdLFxyXG4gICAgICAgICAgICAgICAgZGVzdHJ1Y3RpdmVUZXh0OiAnRGVsZXRlJyxcclxuICAgICAgICAgICAgICAgIGNhbmNlbFRleHQ6ICdDYW5jZWwnLFxyXG4gICAgICAgICAgICAgICAgY2FuY2VsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ0FOQ0VMTEVEJyk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uQ2xpY2tlZDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQlVUVE9OIENMSUNLRUQnLCBpbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZGVzdHJ1Y3RpdmVCdXR0b25DbGlja2VkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnREVTVFJVQ1QnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgIH0pXHJcblxyXG4uY29udHJvbGxlcignU2xpZGVib3hDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkaW9uaWNTbGlkZUJveERlbGVnYXRlKSB7XHJcbiAgICAkc2NvcGUubmV4dFNsaWRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJGlvbmljU2xpZGVCb3hEZWxlZ2F0ZS5uZXh0KCk7XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ01lbnVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkaW9uaWNTaWRlTWVudURlbGVnYXRlLCAkaW9uaWNNb2RhbCkge1xyXG5cclxuXHJcbiAgICAkc2NvcGUudXBkYXRlU2lkZU1lbnUgPSBmdW5jdGlvbihtZW51KSB7XHJcbiAgICAgICAgY29uc29sZS5sb2cobWVudSk7XHJcbiAgICAgICAgJHNjb3BlLm1lbnVJdGVtcyA9IG1lbnU7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgJGlvbmljTW9kYWwuZnJvbVRlbXBsYXRlVXJsKCd0ZW1wbGF0ZXMvbW9kYWwuaHRtbCcsIGZ1bmN0aW9uKG1vZGFsKSB7XHJcbiAgICAgICAgJHNjb3BlLm1vZGFsID0gbW9kYWw7XHJcbiAgICB9LCB7XHJcbiAgICAgICAgYW5pbWF0aW9uOiAnc2xpZGUtaW4tdXAnXHJcbiAgICB9KTtcclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdBcHBDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRyb290U2NvcGUpIHtcclxuXHJcbiAgICAkcm9vdFNjb3BlLm1lbnVJdGVtcyA9IFtdO1xyXG5cclxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnaW9uaWNBcHAuZGlyZWN0aXZlcycsIFtdKVxyXG5cclxuLmRpcmVjdGl2ZSgncG9zaXRpb25CYXJzQW5kQ29udGVudCcsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XHJcblxyXG4gcmV0dXJuIHtcclxuICAgIFxyXG4gICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgIHNjb3BlOiB7XHJcbiAgICAgICAgZGRGZWVkOiAnPWRkRmVlZCdcclxuICAgIH0sXHJcblxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIFxyXG5cclxuICAgICAgY29uc29sZS5sb2coJ0tBS0FLQUtBS0tBS0FLQUs6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OjonKTtcclxuICAgICAgY29uc29sZS5sb2coc2NvcGUuZGRGZWVkKTtcclxuICAgICAgZG9Qcm9jZXNzKCk7XHJcblxyXG4gICAgICBzY29wZS4kd2F0Y2goJ2RkRmVlZCcsIGZ1bmN0aW9uKG52KXtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0FLQUtBS0FLS0FLQUtBSzo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG52KTtcclxuICAgICAgICBkb1Byb2Nlc3MoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBkb1Byb2Nlc3MoKVxyXG4gICAgICB7XHJcbiAgICAgICAgICB2YXIgb2Zmc2V0VG9wID0gMDtcclxuICAgICAgICAgIHZhciBwbGF0Zm9ybSA9ICdpb3MnOy8vJGNvcmRvdmFEZXZpY2UuZ2V0UGxhdGZvcm0oKTtcclxuICAgICAgICAgIHBsYXRmb3JtID0gcGxhdGZvcm0udG9Mb3dlckNhc2UoKTsgICAgXHJcblxyXG5cclxuICAgICAgICAgIC8vIEdldCB0aGUgcGFyZW50IG5vZGUgb2YgdGhlIGlvbi1jb250ZW50XHJcbiAgICAgICAgICB2YXIgcGFyZW50ID0gYW5ndWxhci5lbGVtZW50KGVsZW1lbnRbMF0ucGFyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgdmFyIG1faGVhZGVyID0gIHBhcmVudFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdiYXItaGVhZGVyJyk7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IGFsbCB0aGUgaGVhZGVycyBpbiB0aGlzIHBhcmVudFxyXG4gICAgICAgICAgdmFyIHNfaGVhZGVycyA9IHBhcmVudFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdiYXItc3ViaGVhZGVyJyk7XHJcbiAgICAgICAgICB2YXIgaV9jb250ZW50ID0gcGFyZW50WzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpb24tY29udGVudCcpO1xyXG5cclxuICAgICAgICAgIGlmKCBtX2hlYWRlci5sZW5ndGggKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBvZmZzZXRUb3AgPSBtX2hlYWRlclswXS5vZmZzZXRIZWlnaHQgKyAocGxhdGZvcm0gPT0gJ2lvcyc/MjA6MCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgdGhlIGhlYWRlcnNcclxuICAgICAgICAgIGZvcih4PTA7eDxzX2hlYWRlcnMubGVuZ3RoO3grKylcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgdGhlIG1haW4gaGVhZGVyIG9yIG5hdi1iYXIsIGFkanVzdCBpdHMgcG9zaXRpb24gdG8gYmUgYmVsb3cgdGhlIHByZXZpb3VzIGhlYWRlclxyXG4gICAgICAgICAgICBpZih4ID49IDApIHtcclxuICAgICAgICAgICAgICBzX2hlYWRlcnNbeF0uc3R5bGUudG9wID0gb2Zmc2V0VG9wICsgJ3B4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQWRkIHVwIHRoZSBoZWlnaHRzIG9mIGFsbCB0aGUgaGVhZGVyIGJhcnNcclxuICAgICAgICAgICAgb2Zmc2V0VG9wID0gb2Zmc2V0VG9wICsgc19oZWFkZXJzW3hdLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgIH0gICAgICBcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUG9zaXRpb24gdGhlIGlvbi1jb250ZW50IGVsZW1lbnQgZGlyZWN0bHkgYmVsb3cgYWxsIHRoZSBoZWFkZXJzXHJcbiAgICAgICAgICBpX2NvbnRlbnRbMF0uc3R5bGUudG9wID0gb2Zmc2V0VG9wICsgJ3B4JztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07ICBcclxufSlcclxuXHJcbi5kaXJlY3RpdmUoJ2hpZGVUYWJzJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSwgJGVsKSB7XHJcbiAgICAgICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzID0gJ3RhYnMtaXRlbS1oaWRlJztcclxuICAgICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgJHJvb3RTY29wZS5oaWRlVGFicyA9ICcnO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlQWNjb3VudCcsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGFjY291bnQ6ICc9YWNjb3VudCdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtYWNjb3VudC5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUuY3YgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgICAgICBhbGVydCg1NSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgb2JqLnJlZnJlc2hBY2NvdW50KCk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLmRlbGV0ZUFjY291bnQgPSBmdW5jdGlvbiggb2JqICl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9iaik7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlUHJvZmlsZScsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIHByb2ZpbGU6ICc9cHJvZmlsZSdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtcHJvZmlsZS5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUudmFsaWRhdGVDaGVjayA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIC8vb2JqLm5ld19rZXkgPSAnZnJvbSBkaXJlY3RpdmUnO1xyXG4gICAgICAgICAgICAvL2FsZXJ0KG9iai5nZXRVc2VyTmFtZSgpKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgICAgb2JqLnVwZGF0ZV9tb25pdG9yKG9iai5wcm9maWxlX2NoZWNrZWQpO1xyXG4gICAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnZmVlZEl0ZW0nLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBpdGVtOiAnPWl0ZW0nXHJcbiAgICAgIH0sXHJcbiAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvZmVlZC1pdGVtLmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS5jdiA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIGFsZXJ0KDU1KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5kZWxldGVBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJHN0YXRlUHJvdmlkZXInLCAnJHVybFJvdXRlclByb3ZpZGVyJywnJGlvbmljQ29uZmlnUHJvdmlkZXInLCBcclxuXHRmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGlvbmljQ29uZmlnUHJvdmlkZXIpIHtcclxuXHJcblx0XHQgICRzdGF0ZVByb3ZpZGVyXHJcblx0XHQgICAgICAuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9sb2dpbi5odG1sXCIsXHJcblx0XHQgICAgICAgIGNvbnRyb2xsZXI6IFwiTG9naW5DdHJsXCJcclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvbWVudVwiLFxyXG5cdFx0ICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdCAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21lbnUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICBjb250cm9sbGVyOiAnTWVudUN0cmwnXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaG9tZScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9ob21lXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2hvbWUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ0hvbWVUYWJDdHJsJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5tYW5hZ2VfYWNjb3VudHMnLCB7XHJcblx0XHQgICAgICBcdHVybDogXCIvbWFuYWdlX2FjY291bnRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21hbmFnZV9hY2NvdW50cy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnTWFuYWdlQWNjb3VudHMnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLnB1Ymxpc2hpbmcnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvcHVibGlzaGluZ1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdwdWJsaXNoaW5nLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9wdWJsaXNoLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQdWJsaXNoaW5nJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5wb3N0X3NldHRpbmdzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3Bvc3Rfc2V0dGluZ3NcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAncHVibGlzaGluZy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcG9zdF9zZXR0aW5ncy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnUG9zdFNldHRpbmdzJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pbmJveCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9pbmJveFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdpbmJveC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaW5ib3guaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmZlZWRzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2ZlZWRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2ZlZWRzLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9mZWVkcy5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICBcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pdGVtJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2l0ZW1cIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbGlzdC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaXRlbS5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuZm9ybScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9mb3JtXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2Zvcm0tdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Zvcm0uaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmtleWJvYXJkJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2tleWJvYXJkXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2tleWJvYXJkLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC8qLnN0YXRlKCdtZW51LmxvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2xvZ2luLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSkqL1xyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LnNsaWRlYm94Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3NsaWRlYm94XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3NsaWRlYm94Lmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTbGlkZWJveEN0cmwnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmFib3V0Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2Fib3V0XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Fib3V0Lmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSk7XHJcblxyXG5cdFx0ICAgIC8vJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcIm1lbnUvdGFiL2J1dHRvbnNcIik7XHJcblx0XHQgICAgLyppZiggJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEgKVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCIvaG9tZVwiKTtcclxuXHRcdCAgICB9XHJcblx0XHQgICAgZWxzZVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJsb2dpblwiKTtcclxuXHRcdCAgICB9Ki9cclxuXHRcdCAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwibG9naW5cIik7XHJcblxyXG5cclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci50YWJzLnBvc2l0aW9uKFwiYm90dG9tXCIpOyAvL1BsYWNlcyB0aGVtIGF0IHRoZSBib3R0b20gZm9yIGFsbCBPU1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLm5hdkJhci5hbGlnblRpdGxlKFwiY2VudGVyXCIpO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnRhYnMuc3R5bGUoXCJzdGFuZGFyZFwiKTtcclxuXHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MubWF4Q2FjaGUoMCk7XHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MudHJhbnNpdGlvbignbm9uZScpO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnZpZXdzLmZvcndhcmRDYWNoZSh0cnVlKTtcclxuXHRcdCAgICBcclxuXHRcdCAgICAkc3RhdGVQcm92aWRlclJlZiA9ICRzdGF0ZVByb3ZpZGVyO1xyXG4gICAgICBcdFx0JHVybFJvdXRlclByb3ZpZGVyUmVmID0gJHVybFJvdXRlclByb3ZpZGVyO1xyXG5cdFx0fVxyXG5dOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2lvbmljQXBwLnNlcnZpY2VzJywgW10pXHJcblxyXG4uZmFjdG9yeSgnRUMnLCBFQ2xpYilcclxuXHJcbi8vc2VydmljZSBmb3IgYXV0aGVudGljYXRpb25cclxuLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24oJHEsICRodHRwLCBhcGlVcmwsIEVDKSB7XHJcblxyXG4gICAgdmFyIGlzQXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICB2YXIgTE9DQUxfVE9LRU5fS0VZID0gJ3VzZXJfY3JlZGVudGlhbHMnO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkVXNlckNyZWRlbnRpYWxzKCkge1xyXG4gICAgICAgIHZhciB1YyA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTF9UT0tFTl9LRVkpO1xyXG4gICAgICAgIGlmICh1Yykge1xyXG4gICAgICAgICAgICB1c2VDcmVkZW50aWFscyh1Yyk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcmVVc2VyQ3JlZGVudGlhbHModWMpIHtcclxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxfVE9LRU5fS0VZLCB1Yyk7XHJcbiAgICAgICAgdXNlQ3JlZGVudGlhbHModWMpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVzZUNyZWRlbnRpYWxzKHVjKSB7XHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1Yyk7XHJcblxyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHVjIGFzIGhlYWRlciBmb3IgeW91ciByZXF1ZXN0cyFcclxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51aWQgPSB1Yy51aWQ7XHJcbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24uYXV0aG9yaXphdGlvblRva2VuID0gdWMuYXV0aG9yaXphdGlvblRva2VuO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlc3Ryb3lVc2VyQ3JlZGVudGlhbHMoKSB7XHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgLy8kaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51aWQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgLy8kaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5hdXRob3JpemF0aW9uVG9rZW4gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKExPQ0FMX1RPS0VOX0tFWSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxvZ2luID0gZnVuY3Rpb24obmFtZSwgcGFzc3dvcmQsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgIHZhciByZXEgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6IGFwaVVybCArICd1c2VyL2xvZ2luJyxcclxuICAgICAgICAgICAgZGF0YTp7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2VtYWlsJzogbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAncGFzc3dvcmQnOiBwYXNzd29yZFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KHJlcSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygnMjIyMicpO1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnWVlZWVlZWVlZJyk7XHJcbiAgICAgICAgICAgICAgICAvLyRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8kaW9uaWNIaXN0b3J5LmN1cnJlbnRWaWV3KCRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKSk7Ly8kaW9uaWNIaXN0b3J5LmN1cnJlbnRWaWV3KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgLy8kc3RhdGUuZ28oJ2FwcC5zYWZldHlMZXNzb25zJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVycl9tc2cpIHtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1paWlpaWlpaWicpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soJzMzMzMnKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbG9nb3V0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgZGVzdHJveVVzZXJDcmVkZW50aWFscygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBsb2FkVXNlckNyZWRlbnRpYWxzKCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsb2dpbjogbG9naW4sXHJcbiAgICAgICAgbG9nb3V0OiBsb2dvdXQsXHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzQXV0aGVudGljYXRlZDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSlcclxuXHJcbi5mYWN0b3J5KCdVc2VyU2V0dGluZ3MnLCByZXF1aXJlKCcuL2FwcC9zZXR0aW5ncy1tYW5hZ2VyJykpIFxyXG5cclxuLmZhY3RvcnkoJ0FjY291bnQnLCByZXF1aXJlKCcuL2FwcC9hY2NvdW50JykpIFxyXG5cclxuLmZhY3RvcnkoJ1Byb2ZpbGUnLCByZXF1aXJlKCcuL2FwcC9wcm9maWxlJykpIFxyXG5cclxuLmZhY3RvcnkoJ2FjY291bnRNYW5hZ2VyJywgcmVxdWlyZSgnLi9hcHAvYWNjb3VudC1tYW5hZ2VyJykpIFxyXG5cclxuLmZhY3RvcnkoJ0ZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZmVlZCcpKSBcclxuXHJcbi5mYWN0b3J5KCdGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9GZWVkSXRlbScpKSBcclxuXHJcbi5mYWN0b3J5KCdUaW1lbGluZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3RpbWVsaW5lRmVlZEl0ZW0nKSkgXHJcblxyXG4uZmFjdG9yeSgnTGlua2VkaW5GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkZlZWRJdGVtJykpIFxyXG5cclxuLmZhY3RvcnkoJ0Ryb3Bkb3duRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbScpKVxyXG5cclxuLmZhY3RvcnkoJ0xpbmtlZGluRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvbGlua2VkaW5GZWVkSXRlbScpKSBcclxuXHJcbi5mYWN0b3J5KCdJbnN0YWdyYW1GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9JbnN0YWdyYW1GZWVkSXRlbScpKVxyXG5cclxuLmZhY3RvcnkoJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvY29sbGFwc2libGVGZWVkSXRlbScpKVxyXG5cclxuLmZhY3RvcnkoJ0xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0nKSkgXHJcblxyXG4uZmFjdG9yeSgnVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nKSkgXHJcblxyXG4uZmFjdG9yeSgnRmFjZWJvb2tGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2ZhY2Vib29rJykpXHJcblxyXG4uZmFjdG9yeSgnTGlua2VkaW5GZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2xpbmtlZGluRmVlZCcpKVxyXG5cclxuLmZhY3RvcnkoJ1R3aXR0ZXJGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3R3aXR0ZXJGZWVkJykpXHJcblxyXG4uZmFjdG9yeSgnQmxvZ2dlckZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvYmxvZ2dlckZlZWQnKSlcclxuXHJcbi5mYWN0b3J5KCdHb29nbGVQbHVzRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9nb29nbGVwbHVzRmVlZCcpKVxyXG5cclxuLmZhY3RvcnkoJ1BpbnRlcmVzdEZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvcGludGVyZXN0RmVlZCcpKVxyXG5cclxuLmZhY3RvcnkoJ1lvdVR1YmVGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3lvdVR1YmVGZWVkJykpXHJcblxyXG4uZmFjdG9yeSgnSW5zdGFncmFtRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9pbnN0YWdyYW1GZWVkJykpXHJcblxyXG4uZmFjdG9yeSgnc29jaWFsTWFuYWdlcicsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC1tYW5hZ2VyJykpIFxyXG5cclxuLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoe1xyXG4gICAgICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkXHJcbiAgICAgICAgICAgIH1bcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSlcclxuXHJcbi5jb25maWcoZnVuY3Rpb24oJGh0dHBQcm92aWRlcikge1xyXG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnQXV0aEludGVyY2VwdG9yJyk7XHJcbn0pO1xyXG4iXX0=
