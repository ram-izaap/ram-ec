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
              
              
},{"./app-main":1,"./constants":8,"./controllers":9,"./directives":10,"./router":11,"./services":12}],3:[function(require,module,exports){
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


module.exports = ['$http', '$state', '$rootScope', '$urlRouter', 'EC', 'apiUrl', function($http, $state, $rootScope, $urlRouter, EC, apiUrl ){

    
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

    


    /*
        Base Feed class
    */
    
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

        
    /*
        FacebookFeed class
    */

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
            type: GET,
            url: 'feed/fbConversions',
            data: data
        };

        EC.server.request( request, function ( response )
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

            if ( obj.code == FAIL)
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
            type: GET,
            url: 'feed/fbHiddenGroups',
            data: data
        };

        EC.server.request( request, function ( response )
        {
            var obj = response;

            if ( obj.paging !== undefined ) self.next = obj.paging.next;

            if ( obj.code == FAIL)
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
                    type: GET,
                    url: "feed/fbGroup",
                    data: data
                };

                EC.server.request( request, function ( resp )
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

                if ( obj.defaultGroupId !== undefined && obj.defaultGroupId[0] !== undefined && !$.isEmptyObject( obj.defaultGroupId[0] ) )
                    self.default_element = obj.defaultGroupId[0];    

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

        if ( this.id == 'hidden_groups' && !this.options.favorite ) this.items.push( new DropdownFeedItem( data, this ) );

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

    return Social;
}];



},{}],8:[function(require,module,exports){
module.exports = angular.module('ionicApp.constants',[])  
  .constant('apiUrl', 'https://eclincher.com/service/')
  .constant('AUTH_EVENTS', {  notAuthenticated: 'auth-not-authenticated' });
},{}],9:[function(require,module,exports){
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
    
    
    var next_page_index = 0,
        prev_page_index = 0,
        no_of_pages = $rootScope.social.feeds_in_order.length;

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

    $scope.next_page_id = $rootScope.social.feeds_in_order[next_page_index].page_id;
    $scope.prev_page_id = $rootScope.social.feeds_in_order[prev_page_index].page_id;

    console.log(index);
    console.log($scope.feed);
    
    $scope.test_name = [];
    $scope.test_name.push({'name':'Ram'});
    $scope.getScrollPosition = function() {
        //console.log( $ionicScrollDelegate.$getByHandle('mainScroll').getScrollPosition()  );
        /*$rootScope.$apply(function () {
            $rootScope.social.feeds_in_order[index].items[0].profile.username = 'JJJJJJJJJJJJJJJ';
            //$scope.feed.items[0].profile.username = 'JJJJJJJJJJJJJJJ';
            console.log($scope.feed);
        });*/
        //$scope.test_name[0].name = 'KKKKKKKKK';
        //$scope.feed.items[0].data.fromName = 'JJJJJJJJJJJJJJJ';

        //$rootScope.$digest();
        

        //console.log('watchersWithoutDuplicates.length:::'+watchersWithoutDuplicates.length);
    
        
    };
    
    $scope.feed.dd = { 'count':0, 'data':[], 'placeholder': ''};
    $scope.selected_dd = {};

    $scope.$watch('feed.dropdown_feed', function() {

        if( $scope.feed.dropdown_feed )
        {
            console.log('MMMMMMMMMMMMMMMMM');
            console.log($scope.feed.dropdown_obj);
            $scope.feed.dd = $scope.feed.dropdown_obj.get_dropdown();
            $scope.$broadcast('scroll.infiniteScrollComplete');
            $scope.moredata = true;
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

        if ( ! $scope.feed.items.length && ! $scope.counter )
        {
            $scope.feed.last_loaded_time = (new Date()).getTime();
            $scope.feed.get_data();
        }
        else
        {
            $scope.feed.more();
        }

        $scope.counter++;        
        
    };
    
    $scope.processDD = function()
    {
        console.log($scope.selected_dd);
        $scope.feed.dropdown_obj.set_default_group_id( $scope.selected_dd );
        $scope.feed.dropdown_obj.get_data( $scope.selected_dd );
            
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
},{}],10:[function(require,module,exports){
module.exports = angular.module('ionicApp.directives', [])

.directive('positionBarsAndContent', function($timeout) {

 return {
    
    restrict: 'AC',

    link: function(scope, element, attrs) {
      
      var offsetTop = 0;
      
      
      

      // Get the parent node of the ion-content
      var parent = angular.element(element[0].parentNode);

      var m_header =  parent[0].getElementsByClassName('bar-header');

      // Get all the headers in this parent
      var s_headers = parent[0].getElementsByClassName('bar-subheader');

      if( m_header.length )
      {
        offsetTop = m_header[0].offsetHeight;
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
      element[0].style.top = offsetTop + 'px';
      
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

},{}],11:[function(require,module,exports){

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

		    $ionicConfigProvider.views.maxCache(20);
		    $ionicConfigProvider.views.transition('none');
		    $ionicConfigProvider.views.forwardCache(true);
		    
		    $stateProviderRef = $stateProvider;
      		$urlRouterProviderRef = $urlRouterProvider;
		}
];
},{}],12:[function(require,module,exports){
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

},{"./app/account":4,"./app/account-manager":3,"./app/profile":5,"./app/settings-manager":6,"./app/social-manager":7}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3cvanMvYXBwLW1haW4uanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL2FwcC9hY2NvdW50LW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL2FjY291bnQuanMiLCJ3d3cvanMvYXBwL3Byb2ZpbGUuanMiLCJ3d3cvanMvYXBwL3NldHRpbmdzLW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL2NvbnN0YW50cy5qcyIsInd3dy9qcy9jb250cm9sbGVycy5qcyIsInd3dy9qcy9kaXJlY3RpdmVzLmpzIiwid3d3L2pzL3JvdXRlci5qcyIsInd3dy9qcy9zZXJ2aWNlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVuREE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHRmdW5jdGlvbiBBcHBNYWluKCRpb25pY1BsYXRmb3JtLCAkcm9vdFNjb3BlLCAkc2NvcGUpIFxyXG5cdHtcclxuXHQgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uKCkge1xyXG5cdCAgICAvLyBIaWRlIHRoZSBhY2Nlc3NvcnkgYmFyIGJ5IGRlZmF1bHQgKHJlbW92ZSB0aGlzIHRvIHNob3cgdGhlIGFjY2Vzc29yeSBiYXIgYWJvdmUgdGhlIGtleWJvYXJkXHJcblx0ICAgIC8vIGZvciBmb3JtIGlucHV0cylcclxuXHQgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZCkge1xyXG5cdCAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XHJcblx0ICAgIH1cclxuXHQgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcclxuXHQgICAgICAvLyBvcmcuYXBhY2hlLmNvcmRvdmEuc3RhdHVzYmFyIHJlcXVpcmVkXHJcblx0ICAgICAgLy9TdGF0dXNCYXIuc3R5bGVMaWdodENvbnRlbnQoKTtcclxuXHQgICAgfVxyXG4gIFx0ICB9KTtcclxuXHJcblx0ICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChldmVudCl7XHJcblx0ICBcdCRyb290U2NvcGUuY3VycmVudFNjb3BlID0gJHNjb3BlO1xyXG5cdCAgfSk7XHJcblxyXG4gIFx0ICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMsIGVycm9yKSB7XHJcblx0ICAgaWYgKHRvU3RhdGUubmFtZSA9PSAndGFicy5tYW5hZ2VfYWNjb3VudHMnKSB7XHJcblx0ICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzPXRydWU7XHJcblx0ICAgfSBlbHNlIHtcclxuXHQgICAgICRyb290U2NvcGUuaGlkZVRhYnM9ZmFsc2U7XHJcblx0ICAgfVxyXG5cdCAgfSk7XHJcbiAgXHR9XHJcblxyXG4gIFx0bW9kdWxlLmV4cG9ydHMgPSBbJyRpb25pY1BsYXRmb3JtJywgJyRyb290U2NvcGUnLCBBcHBNYWluXTsiLCJyZXF1aXJlKCcuL2NvbnN0YW50cycpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcycpO1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzJyk7XG5cbnZhciAkc3RhdGVQcm92aWRlclJlZiA9IG51bGw7XG52YXIgJHVybFJvdXRlclByb3ZpZGVyUmVmID0gbnVsbDtcblxuYW5ndWxhci5tb2R1bGUoJ2lvbmljQXBwJywgW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lvbmljJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW9uaWNBcHAuY29uc3RhbnRzJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW9uaWNBcHAuY29udHJvbGxlcnMnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpb25pY0FwcC5zZXJ2aWNlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW9uaWNBcHAuZGlyZWN0aXZlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdTdG9yYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd1aS5yb3V0ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25nQ29yZG92YScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzY29yZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pXG5cbi5jb25maWcocmVxdWlyZSgnLi9yb3V0ZXInKSlcblxuLnJ1bihyZXF1aXJlKCcuL2FwcC1tYWluJykpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnQWNjb3VudCcsICdVc2VyU2V0dGluZ3MnLCAnJGNvcmRvdmFJbkFwcEJyb3dzZXInLCBmdW5jdGlvbigkaHR0cCwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgQWNjb3VudCwgVXNlclNldHRpbmdzLCAkY29yZG92YUluQXBwQnJvd3NlciApeyAgXHJcblxyXG4gICAgdmFyIGluaXRpYWxpemVkID0gZmFsc2UsXHJcbiAgICAgICAgZGF0YSA9IHt9LFxyXG4gICAgICAgIGFjY291bnRzID0gW10sXHJcbiAgICAgICAgYWNjb3VudHNfb3JkZXIgPSBbXSxcclxuICAgICAgICBhY2NvdW50c19ieV9pZCA9IHt9LFxyXG4gICAgICAgIGZhdm9yaXRlc19hY2NvdW50LFxyXG4gICAgICAgIHNlYXJjaF9hY2NvdW50LFxyXG4gICAgICAgIHJzc19hY2NvdW50LFxyXG4gICAgICAgIG91dHJlYWNoX2FjY291bnQsXHJcbiAgICAgICAgY2luYm94X2FjY291bnQsXHJcbiAgICAgICAgbGFzdF9hZGRlZF9wcm9maWxlLFxyXG4gICAgICAgIHJlZnJlc2hfb25fY2xvc2UgPSBmYWxzZSxcclxuICAgICAgICB0ZW1wbGF0ZV9zZWxlY3RvciA9ICcjYWNjb3VudC1tYW5hZ2VyLXRlbXBsYXRlJztcclxuXHJcbiAgICAgICAgbW9kdWxlLnJlbmRlcmVkID0gZmFsc2U7XHJcbiAgICAgICAgbW9kdWxlLmdvX2JhY2tfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgbW9kdWxlLmZhdm9yaXRlX3JlbmRlcmVkID0gZmFsc2U7XHJcbiAgICAgICAgbW9kdWxlLnNlYXJjaF9yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5yc3NfcmVuZGVyZWQgPSBmYWxzZTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdhY2NvdW50TWFuYWdlciBpbml0Jyk7XHJcblxyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCRodHRwKTtcclxuICAgICAgICAvL3JldHVybiB0ZW1wbGF0ZV9zZWxlY3RvcjtcclxuICAgICAgICBcclxuICAgICAgICAvL2dldCBhY2NvdW50cyBhbmQgc3RvcmUgaXRcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiBhcGlVcmwgKyAnYWNjb3VudC9hY2NvdW50cycsXHJcbiAgICAgICAgICAgIGRhdGE6eyduYW1lJzoncmFtJ31cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oc3RvcmVfYWNjb3VudHMsIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHN0b3JlX2FjY291bnRzICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3Jlc3BvbnNlOjo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coVXNlclNldHRpbmdzKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UgfHwgW10sXHJcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGRhdGEuYWNjb3VudCB8fCBbXSxcclxuICAgICAgICAgICAgICAgIGZhdl9sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHNyY2hfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICByc3NfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBvdXRyZWFjaF9sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGFjY19vcmRlciA9IGRhdGEuYWNjb3VudF9vcmRlciB8fCBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBkYXRhLnNldHRpbmdzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVc2VyU2V0dGluZ3MuaGFuZGxlX3NldHRpbmdzKCBkYXRhLnNldHRpbmdzLCB1bmRlZmluZWQsIHRydWUgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgVXNlclNldHRpbmdzLmFuYWx5dGljc19ncm91cHMgPSBbXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKCBkYXRhLmFuYWx5dGljc0dyb3VwcyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICBVc2VyU2V0dGluZ3MuYW5hbHl0aWNzX2dyb3VwcyA9IGRhdGEuYW5hbHl0aWNzR3JvdXBzLmFuYWx5dGljc0dyb3VwO1xyXG4gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KCBpdGVtcyApICkgaXRlbXMgPSBbIGl0ZW1zIF07XHJcblxyXG4gICAgICAgICAgICBhY2NvdW50cyA9IFtdO1xyXG4gICAgICAgICAgICBhY2NvdW50c19ieV9pZCA9IHt9O1xyXG4gICAgICAgICAgICBhY2NvdW50c19vcmRlciA9IGFjY19vcmRlcjtcclxuXHJcbiAgICAgICAgICAgIC8vQ3JlYXRlIGFjY291bnQtb2JqZWN0IGZvciBlYWNoIGFjY291bnRzIGFuZCBzdG9yZSBieSBpZCAuXHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IGl0ZW1zLmxlbmd0aDsgaSA8IHA7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2FjY291bnQgPSBuZXcgQWNjb3VudCggaXRlbXNbIGkgXSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gYWNjb3VudHMucHVzaCggbmV3X2FjY291bnQgKTsgLy8gaXRlcmFibGVcclxuXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50c19ieV9pZFsgbmV3X2FjY291bnQuaWQgXSA9IGFjY291bnRzWyBsZW5ndGggLSAxIF07IC8vIGluZGV4ZWQgYnkgYWNjb3VudCBJRCwgcmVmZXJlbmNlcyBhY2NvdW50IGJ5IGluZGV4XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhY2NvdW50czo6OicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhY2NvdW50cyk7XHJcbiAgICAgICAgICAgIC8vaWYgY2FsbGJhY2sgaXMgdmFsaWQgZnVuY3Rpb24sIHRoZW4gY2FsbCBpdFxyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKVxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9IFxyXG4gICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfZmF2b3JpdGVfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUuZmF2b3JpdGVfcmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X2Zhdm9yaXRlX3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZmF2b3JpdGVfcmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3NlYXJjaF9yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5zZWFyY2hfcmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X3NlYXJjaF9yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLnNlYXJjaF9yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfcnNzX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnJzc19yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfcnNzX3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUucnNzX3JlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRfZ29fYmFja19mbGFnID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLmdvX2JhY2tfZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfZ29fYmFja19mbGFnID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZ29fYmFja19mbGFnID0gZmxhZztcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuZmluZCA9IGZ1bmN0aW9uICggYWNjb3VudF9pZCApXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGFjY291bnRzX2J5X2lkWyBhY2NvdW50X2lkIF07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X3Byb2ZpbGUgPSBmdW5jdGlvbiAoIHByb2ZpbGVfaWQgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnZmF2b3JpdGVzJykgcmV0dXJuICggZmF2b3JpdGVzX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IGZhdm9yaXRlc19hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ3NlYXJjaCcpIHJldHVybiAoIHNlYXJjaF9hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBzZWFyY2hfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdyc3MnKSByZXR1cm4gKCByc3NfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gcnNzX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnb3V0cmVhY2gnKSByZXR1cm4gKCBvdXRyZWFjaF9hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBvdXRyZWFjaF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ2NpbmJveCcpIHJldHVybiAoIGNpbmJveF9hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBjaW5ib3hfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBhID0gYWNjb3VudHMubGVuZ3RoOyBpIDwgYTsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgcCA9IGFjY291bnRzWyBpIF0ucHJvZmlsZXMubGVuZ3RoOyBqIDwgcDsgaisrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfcHJvZmlsZSA9IGFjY291bnRzWyBpIF0ucHJvZmlsZXNbIGogXTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX3Byb2ZpbGUuaWQgPT0gcHJvZmlsZV9pZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNfcHJvZmlsZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hY2NvdW50cyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKSBcclxuICAgIHsgXHJcbiAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGFjY291bnRzICk7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGFjY291bnRzOyBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5saXN0X2FjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRlbXAgPSBbXSxcclxuICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgIGEgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChhY2NvdW50c19vcmRlci5sZW5ndGggPiAwICl7XHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwLCBhID0gYWNjb3VudHNfb3JkZXIubGVuZ3RoOyBpIDwgYTsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIGFjID0gYWNjb3VudHMubGVuZ3RoOyBqIDwgYWM7IGorKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoYWNjb3VudHNfb3JkZXJbaV0gPT0gYWNjb3VudHNbIGogXS50eXBlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGFjY291bnRzWyBqIF0uaGFzX3VuZXhwaXJlZF9wcm9maWxlcygpICkgdGVtcC5wdXNoKCBhY2NvdW50c1sgaiBdICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwLCBhID0gYWNjb3VudHMubGVuZ3RoOyBpIDwgYTsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBhY2NvdW50c1sgaSBdLmhhc191bmV4cGlyZWRfcHJvZmlsZXMoKSApIHRlbXAucHVzaCggYWNjb3VudHNbIGkgXSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0ZW1wLnNvcnQoZnVuY3Rpb24gKCBhLCBiIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBhIDwgYiApIHJldHVybiAtMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIGEgPiBiICkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHRlbXAgKTtcclxuICAgICAgICBcclxuICAgICAgICBlbHNlIHJldHVybiB0ZW1wO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZF9hY2NvdW50ID0gZnVuY3Rpb24oIHR5cGUgKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhKTtcclxuICAgICAgICB2YXIgY3VzdG9tX2hlYWRlcnMgPSAkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YSB8fCB7fSxcclxuICAgICAgICAgICAgcGF0aCA9ICdhY2NvdW50L2FjY291bnQ/dHlwZT0nICt0eXBlKyAnJmxmPWZhbHNlJztcclxuXHJcbiAgICAgICAgY3VzdG9tX2hlYWRlcnMgPSBKU09OLnBhcnNlKCBjdXN0b21faGVhZGVycyApO1xyXG5cclxuICAgICAgICB2YXIgY2tleSA9IChjdXN0b21faGVhZGVycy5jbGllbnRfa2V5ICE9PSB1bmRlZmluZWQpID8gSlNPTi5zdHJpbmdpZnkoY3VzdG9tX2hlYWRlcnMuY2xpZW50X2tleSk6ICcnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHBhdGggKz0gJyZ1c2VyX25hbWU9JytjdXN0b21faGVhZGVycy51c2VyX25hbWUrJyZ1c2VyX3Bhc3M9JytjdXN0b21faGVhZGVycy51c2VyX3Bhc3MrJyZjbGllbnRfa2V5PScrY2tleSsnJmRldmljZT1pb3MnO1xyXG4gICAgICAgIC8vYWxlcnQoZW5jb2RlVVJJKGFwaVVybCtwYXRoKSk7XHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICBsb2NhdGlvbjogJ3llcycsXHJcbiAgICAgICAgICBjbGVhcmNhY2hlOiAneWVzJyxcclxuICAgICAgICAgIGNsZWFyc2Vzc2lvbmNhY2hlOiAneWVzJyxcclxuICAgICAgICAgIHRvb2xiYXJwb3NpdGlvbjogJ3RvcCdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkY29yZG92YUluQXBwQnJvd3Nlci5vcGVuKCBlbmNvZGVVUkkoYXBpVXJsK3BhdGgpLCAnX2JsYW5rJywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckY29yZG92YUluQXBwQnJvd3NlcjpleGl0JywgZnVuY3Rpb24oZSwgZXZlbnQpe1xyXG4gICAgICAgICAgICBhY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIGZhbHNlICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywnRUMnLCAnYXBpVXJsJywgJ1Byb2ZpbGUnLCBmdW5jdGlvbigkaHR0cCwgRUMsIGFwaVVybCwgUHJvZmlsZSl7XHJcblxyXG4gICAgZnVuY3Rpb24gQWNjb3VudCAoIGFjY291bnRfZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gYWNjb3VudF9kYXRhLmFjY291bnRJZDtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnR5cGUgPSBhY2NvdW50X2RhdGEudHlwZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNhbl9wb3N0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy50eXBlID09ICdGYWNlYm9vaycgfHwgdGhpcy50eXBlID09ICdMaW5rZWRpbicgfHwgdGhpcy50eXBlID09ICdUd2l0dGVyJyB8fCB0aGlzLnR5cGUgPT0gJ0Jsb2dnZXInIHx8IHRoaXMudHlwZSA9PSAnUGludGVyZXN0JyApIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy50eXBlID09ICdHb29nbGVQbHVzJykgdGhpcy5jYW5fcG9zdCA9IHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT0gJ1BpbnRlcmVzdCcgJiYgYWNjb3VudF9kYXRhLmVtYWlsICE9PSB1bmRlZmluZWQgJiYgYWNjb3VudF9kYXRhLnBhc3N3b3JkICE9PSB1bmRlZmluZWQgJiYgISAkLmlzRW1wdHlPYmplY3QoIGFjY291bnRfZGF0YS5wYXNzd29yZCApICkgdGhpcy5jYW5fcG9zdCA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMuY2hhcmFjdGVyX2xpbWl0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy50eXBlID09ICdMaW5rZWRpbicpIHRoaXMuY2hhcmFjdGVyX2xpbWl0ID0gNzAwO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy50eXBlID09ICdUd2l0dGVyJykgdGhpcy5jaGFyYWN0ZXJfbGltaXQgPSAxNDA7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YSA9IGFjY291bnRfZGF0YSB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb25maWcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggdGhpcy5kYXRhLmNvbmZpZyApICkgdGhpcy5wcm9maWxlcy5wdXNoKCBuZXcgUHJvZmlsZSggdGhpcy5kYXRhLmNvbmZpZywgdGhpcyApICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmNvbmZpZy5mb3JFYWNoKGZ1bmN0aW9uICggaXRlbSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19wcm9maWxlID0gbmV3IFByb2ZpbGUoIGl0ZW0sIHNlbGYgKTtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZXMucHVzaCggbmV3X3Byb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5leHBpcmVkID0gKCBhY2NvdW50X2RhdGEubW9uaXRvcmVkID09ICdleHBpcmVkJyA/IHRydWUgOiBmYWxzZSApO1xyXG4gICAgICAgIC8vIHRoaXMuZXhwaXJlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmhhc19tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5tb25pdG9yZWRfcHJvZmlsZXMoKS5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5oYXNfZXZlbnRzX21vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmV2ZW50c19tb25pdG9yZWRfcHJvZmlsZXMoKS5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuaGFzX3VuZXhwaXJlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLnVuZXhwaXJlZF9wcm9maWxlcygpLmxlbmd0aCA+IDAgKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSB0aGlzLnByb2ZpbGVzLmxlbmd0aDsgaSA8IHA7IGkrKyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGVzWyBpIF0ubW9uaXRvcmVkID09ICdvbicpIHByb2ZpbGVzLnB1c2goIHRoaXMucHJvZmlsZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2ZpbGVzO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5ldmVudHNfbW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gdGhpcy5wcm9maWxlcy5sZW5ndGg7IGkgPCBwOyBpKysgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlc1sgaSBdLmV2ZW50c01vbml0b3JlZCA9PSAnb24nKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcbiAgICBcclxuICAgIEFjY291bnQucHJvdG90eXBlLnVuZXhwaXJlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IHRoaXMucHJvZmlsZXMubGVuZ3RoOyBpIDwgcDsgaSsrICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZXNbIGkgXS5tb25pdG9yZWQgIT0gJ29mZicpIHByb2ZpbGVzLnB1c2goIHRoaXMucHJvZmlsZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2ZpbGVzO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICdbb2JqZWN0ICcgK3RoaXMudHlwZSsgJyBBY2NvdW50XSc7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHN3aXRjaCAoIHRoaXMudHlwZS50b0xvd2VyQ2FzZSgpIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhY2Vib29rJzogcmV0dXJuIDE7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3aXR0ZXInOiByZXR1cm4gMjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ29vZ2xlYW5hbHl0aWNzJzogcmV0dXJuIDM7XHJcbiAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnbGlua2VkaW4nOiByZXR1cm4gNDtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnaW5zdGFncmFtJzogcmV0dXJuIDU7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3lvdXR1YmUnOiByZXR1cm4gNjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAncGludGVyZXN0JzogcmV0dXJuIDc7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dvb2dsZXBsdXMnOiByZXR1cm4gODtcclxuICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdibG9nZ2VyJzogcmV0dXJuIDk7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R1bWJscic6IHJldHVybiAxMDtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnd29yZHByZXNzJzogcmV0dXJuIDExO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd2ayc6IHJldHVybiAxMjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIDEzO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUucmVmcmVzaEFjY291bnQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogXCJhY2NvdW50L3JlZnJlc2hcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcInJlZnJlc2hBY2NvdW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYuaWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc2VsZi50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWN0aW9uID0gJ3VwZGF0ZVBJQm9hcmRzJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApIGNhbGxiYWNrKGZsYWcpO1xyXG5cclxuICAgICAgICB9LCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuZGVsZXRlQWNjb3VudCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBcImFjY291bnQvZGVsZXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCJkZWxldGVBY2NvdW50QnlJRFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLmlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblxyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKSBjYWxsYmFjayhmbGFnKTtcclxuXHJcbiAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBBY2NvdW50O1xyXG4gICAgXHJcbn1dO1xyXG5cclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsJ0VDJywgJ2FwaVVybCcsICdzb2NpYWxNYW5hZ2VyJywgZnVuY3Rpb24oJGh0dHAsIEVDLCBhcGlVcmwsIHNvY2lhbE1hbmFnZXIpe1xyXG5cclxuXHRmdW5jdGlvbiBQcm9maWxlICggcHJvZmlsZV9kYXRhLCBhY2NvdW50IClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSBwcm9maWxlX2RhdGEgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuYWNjb3VudCA9IGFjY291bnQgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBkYXRhLnNhbXBsZUlkO1xyXG5cclxuICAgICAgICB0aGlzLnBpY3R1cmUgPSAoIGRhdGEucHJvZmlsZVBpY3R1cmUgPyBkZWNvZGVVUklDb21wb25lbnQoIGRhdGEucHJvZmlsZVBpY3R1cmUgKSA6ICdzc3Nzc3NzcycgKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpICE9PSAncGludGVyZXN0JyApIHRoaXMucGljdHVyZSA9IHRoaXMucGljdHVyZS5yZXBsYWNlKCdodHRwOi8vJywnLy8nKTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLm1vbml0b3JlZCA9PSAnb24nIHx8IGRhdGEuc29jaWFsTW9uaXRvcmVkID09ICdvbicpIHRoaXMubW9uaXRvcmVkID0gJ29uJztcclxuICAgICAgICBcclxuICAgICAgICBlbHNlIGlmICggZGF0YS5tb25pdG9yZWQgPT0gJ2V4cGlyZWQnIHx8IGRhdGEuc29jaWFsTW9uaXRvcmVkID09ICdleHBpcmVkJykgdGhpcy5tb25pdG9yZWQgPSAnZXhwaXJlZCc7XHJcblxyXG4gICAgICAgIGVsc2UgdGhpcy5tb25pdG9yZWQgPSAnb2ZmJztcclxuXHJcbiAgICAgICAgdGhpcy5wcm9maWxlX2NoZWNrZWQgPSB0aGlzLm1vbml0b3JlZCA9PSAnb24nID8gdHJ1ZTpmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5ldmVudHNNb25pdG9yZWQgPSBkYXRhLmV2ZW50c01vbml0b3JlZDtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5tb25pdG9yZWQgPSAoICggZGF0YS5tb25pdG9yZWQgPT0gJ29uJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnb24nKSA/ICdvbicgOiAnb2ZmJyk7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIGRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtICkgKSB0aGlzLnN0cmVhbXMgPSBkYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCApIHRoaXMuc3RyZWFtcyA9IFsgZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gXTtcclxuICAgICAgICBcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gKSApIHRoaXMuc3RyZWFtcyA9IHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgKSB0aGlzLnN0cmVhbXMgPSBbIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSBdO1xyXG5cclxuICAgICAgICBlbHNlIHRoaXMuc3RyZWFtcyA9IFtdO1xyXG5cclxuICAgICAgICAvLyB0aGlzLnNvY2lhbCA9IG5ldyBTb2NpYWwoIHNlbGYgKTtcclxuICAgICAgICB0aGlzLnNvY2lhbCA9IG5ldyBzb2NpYWxNYW5hZ2VyKCBzZWxmICk7XHJcblxyXG4gICAgICAgIC8vIHRoaXMuYW5hbHl0aWNzID0gbmV3IEFuYWx5dGljcyggc2VsZiApO1xyXG4gICAgICAgIC8vdGhpcy5hbmFseXRpY3MgPSBuZXcgYW5hbHl0aWNzTWFuYWdlciggc2VsZiApO1xyXG5cclxuICAgICAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmV0d29yayA9IHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIHRoaXMudXNlcm5hbWUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5tb25pdG9yZWQgPT09ICdvbicgJiYgdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnbGlua2VkaW4nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLyp2YXIgcmVxX2RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRMTkdyb3VwcycsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5pZFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vZ3JvdXBzJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHJlcV9kYXRhXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iaiAhPT0gdW5kZWZpbmVkICYmIG9iai5kYXRhICE9PSB1bmRlZmluZWQgKSBzZWxmLmdyb3VwcyA9ICggQXJyYXkuaXNBcnJheSggb2JqLmRhdGEgKSA/IG9iai5kYXRhLnNvcnQoZnVuY3Rpb24oYSxiKXtpZihhLm5hbWUgPCBiLm5hbWUpIHJldHVybiAtMTtpZihhLm5hbWUgPiBiLm5hbWUpIHJldHVybiAxO3JldHVybiAwO30pIDogWyBvYmouZGF0YSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pOyovXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdmYWNlYm9vaycgJiYgZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIgKVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm1vbml0b3JlZCA9PT0gJ29uJyAmJiB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdmYWNlYm9vaycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvKnZhciByZXFfZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkhpZGRlbl9Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwcycsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHRfcG9zdHM6ICcnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybDonZmVlZC9mYkhpZGRlbkdyb3VwcycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogcmVxX2RhdGFcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIG9iaiAhPSB1bmRlZmluZWQgJiYgb2JqLmRhdGEgIT0gdW5kZWZpbmVkICYmIG9iai5kYXRhLmxlbmd0aCA+IDAgKSBzZWxmLmdyb3VwcyA9ICggQXJyYXkuaXNBcnJheSggb2JqLmRhdGEgKSA/IG9iai5kYXRhLnNvcnQoZnVuY3Rpb24oYSxiKXtpZihhLm5hbWUgPCBiLm5hbWUpIHJldHVybiAtMTtpZihhLm5hbWUgPiBiLm5hbWUpIHJldHVybiAxO3JldHVybiAwO30pIDogWyBvYmouZGF0YSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSk7Ki9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3R3aXR0ZXInKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0cyA9IHtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRfZWxlbWVudDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogW11cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy8gZ2V0IHByb2ZpbGUgTGlzdHNcclxuICAgICAgICAgICAgLy9tb2R1bGUuZ2V0X3R3X3Byb2ZpbGVfbGlzdHModGhpcy8qLCBmdW5jdGlvbigpe30qLyk7IFxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLnBvd2VyVXNlcnMgKSB0aGlzLnBvd2VyX3VzZXJzID0gZGF0YS5wb3dlclVzZXJzO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB0aGlzLnBvd2VyX3VzZXJzID0ge1xyXG4gICAgICAgICAgICAgICAgc3RhdGU6ICdvbicsXHJcbiAgICAgICAgICAgICAgICBtZWRpdW1Mb3c6ICcyMDAwJyxcclxuICAgICAgICAgICAgICAgIG1lZGl1bUhpZ2g6ICc3NTAwJyxcclxuICAgICAgICAgICAgICAgIGhpZ2g6ICc3NTAwJ1xyXG4gICAgICAgICAgICB9OyAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2luc3RhZ3JhbScpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICd5b3V0dWJlJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2dvb2dsZXBsdXMnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYoIHByb2ZpbGVfZGF0YS5vYmplY3RUeXBlID09ICdwYWdlJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zdGluZ19vbmx5ID0gdHJ1ZTsgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lID0gcHJvZmlsZV9kYXRhLmZ1bGxOYW1lICsgJyAoUGFnZSknO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSAnZnVsbE5hbWUnOyAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IChwcm9maWxlX2RhdGEuZnVsbE5hbWUgIT09IHVuZGVmaW5lZCAmJiBwcm9maWxlX2RhdGEuZnVsbE5hbWUgIT09XCJcIik/cHJvZmlsZV9kYXRhLmZ1bGxOYW1lLnNwbGl0KFwiKFwiKVswXSArICcgKFVzZXIpJzogJyhVc2VyKSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9ICdmdWxsTmFtZSc7ICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSBwcm9maWxlX2RhdGEuZnVsbE5hbWU7XHJcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gJ2Z1bGxOYW1lJztcclxuXHJcbiAgICAgICAgICAgIGlmKCBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSAhPT0gdW5kZWZpbmVkICYmIHByb2ZpbGVfZGF0YS5vYmplY3RUeXBlID09ICd1c2VyJyApIHRoaXMudXNlcm5hbWUgKz0gJyAoVXNlciknO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3N0aW5nX29ubHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSArPSAnIChCb2FyZCknO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEucGFnZU5hbWUgKSAvLyBGQiBcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnRpdGxlICkgLy8gR0FcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnByb2ZpbGVOYW1lICkgLy8gTE5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnVzZXJOYW1lICkgLy8gSUdcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnNwZWNpZmllZEhhbmRsZU9ySGFzaFRhZyApIC8vIFRXXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5mdWxsTmFtZSApIC8vIEcrXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS51c2VyRmlyc3ROYW1lICkgLy8gWVRcclxuXHJcbiAgICAgICAgWydwYWdlTmFtZScsICd0aXRsZScsICdwcm9maWxlTmFtZScsICd1c2VyRmlyc3ROYW1lJywgJ3VzZXJOYW1lJywgJ3NwZWNpZmllZEhhbmRsZU9ySGFzaFRhZycsICdmdWxsTmFtZSddLmZvckVhY2goZnVuY3Rpb24gKCBpdGVtIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggZGF0YVsgaXRlbSBdICE9PSB1bmRlZmluZWQgJiYgc2VsZi51c2VybmFtZSA9PT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi51c2VybmFtZSA9IGRhdGFbIGl0ZW0gXSArICcgJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi51c2VybmFtZV9rZXkgPSBpdGVtO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAnW29iamVjdCAnICt0aGlzLmFjY291bnQudHlwZSsgJyBQcm9maWxlXSc7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXJuYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS5pc19kaXNwbGF5X3Byb2ZpbGUgPSBmdW5jdGlvbiggYWxsX2ZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICB2YXIgZGlzcGxheV9wcm9maWxlID0gdHJ1ZSxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggYWxsX2ZsYWcgPT09IHVuZGVmaW5lZCAmJiBzZWxmLm1vbml0b3JlZCA9PT0gJ29uJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vJGFjY291bnQuZWxlbWVudC5maW5kKCcuZnVuY3Rpb25zJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoICggc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZ29vZ2xlcGx1cycgJiYgIXNlbGYucG9zdGluZ19vbmx5ICkgfHwgc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JyApIFxyXG4gICAgICAgICAgICB7IGRpc3BsYXlfcHJvZmlsZSA9IGZhbHNlOyB9IC8vaGlkZSBpbiBwb3N0IG1hbmFnZXJcclxuICAgICAgICB9IFxyXG5cclxuICAgICAgICBlbHNlIGlmICggYWxsX2ZsYWcgPT09IHRydWUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAoIHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcpICYmIHNlbGYucG9zdGluZ19vbmx5ICkgXHJcbiAgICAgICAgICAgIHsgZGlzcGxheV9wcm9maWxlID0gZmFsc2U7IH0gLy9oaWRlICAgXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGlzcGxheV9wcm9maWxlID0gc2VsZi5wb3N0aW5nX29ubHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGRpc3BsYXlfcHJvZmlsZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICByZXR1cm4gZGlzcGxheV9wcm9maWxlO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS5nZXRVc2VyTmFtZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lID0gdGhpcy51c2VybmFtZTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmRhdGEudGl0bGUgIT09IHVuZGVmaW5lZCApIC8vIGZvcm1hdCBuYW1lIGZvciBHQVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRlbXAgPSB1c2VybmFtZS5zcGxpdCgnKCcpWzBdIHx8IHNlbGYudXNlcm5hbWUrICcgJztcclxuXHJcbiAgICAgICAgICAgIHVzZXJuYW1lID0gdGVtcC5zdWJzdHJpbmcoMCwgdGVtcC5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB1c2VybmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUudXBkYXRlX21vbml0b3IgPSBmdW5jdGlvbiggZmxhZyApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGZsYWcgPSAoZmxhZyAhPT0gdW5kZWZpbmVkKT9mbGFnOmZhbHNlO1xyXG5cclxuICAgICAgICBpZiggc2VsZi5hY2NvdW50LnR5cGUgPT0gJ0dvb2dsZUFuYWx5dGljcycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYWxlcnQoJ2dvb2dsZSBhbmFseXRpY3MuLi4uLi4uLi4uLi4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2VsZi5tb25pdG9yZWQgPSBmbGFnID8gJ29uJzonb2ZmJztcclxuXHJcbiAgICAgICAgICAgIHNhdmVfcHJvZmlsZV9zZWxlY3Rpb24oZnVuY3Rpb24oIHN0YXR1cyApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXR1cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzYXZlX3Byb2ZpbGVfc2VsZWN0aW9uKCBjYWxsYmFjayApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6J1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOlwiYWNjb3VudC9zaW5nbGVwcm9maWxlbW9uaXRvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTp7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0U2luZ2xlUHJvZmlsZU1vbml0b3JlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBhY2NvdW50SUQ6IHNlbGYuYWNjb3VudC5pZCwgcHJvZmlsZUlEOiBzZWxmLmlkLCBjaGVja2VkOiBmbGFnIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICkgY2FsbGJhY2soZmxhZyk7XHJcblxyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFxyXG5cclxuXHJcblxyXG4gICAgcmV0dXJuIFByb2ZpbGU7XHJcblxyXG59XTsiLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdBY2NvdW50JywgJyRjb3Jkb3ZhSW5BcHBCcm93c2VyJywnXycsIGZ1bmN0aW9uKCRodHRwLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBBY2NvdW50LCAkY29yZG92YUluQXBwQnJvd3NlciwgXyApeyAgXHJcblxyXG4gICAgdmFyIGxpY2Vuc2VPcHRpb25zLFxyXG4gICAgICAgIHNldHRpbmdzLFxyXG4gICAgICAgIGlzX2V0c3lfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3dlZWJseV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfd2l4X3VzZXI9IGZhbHNlLFxyXG4gICAgICAgIGlzX2xleGl0eV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfc2hvcGlmeV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfYmlnY29tbWVyY2VfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGV4dGVybmFsQXBwcyA9IFtdLFxyXG4gICAgICAgIGZhdm9yaXRlcyA9IFtdLFxyXG4gICAgICAgIHNlYXJjaGVzID0gW10sXHJcbiAgICAgICAgdXNlcl9pbmJveF9maWx0ZXJzID0gW10sXHJcbiAgICAgICAgZ290X3NmID0gZmFsc2UsXHJcbiAgICAgICAgZ290X3NlYXJjaGVzID0gZmFsc2UsXHJcbiAgICAgICAgbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSAwLFxyXG4gICAgICAgIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSB0cnVlLFxyXG4gICAgICAgIGhpZGVFdmVudHNDb3VudGVyID0gZmFsc2UsXHJcbiAgICAgICAgZGlzcGxheUluYm94U2V0dGluZ3MgPSB0cnVlLFxyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZhbHNlLFxyXG4gICAgICAgIGFnZW5jeUNvbmZpZ3VyYXRpb24gPSB7fSxcclxuICAgICAgICBtYXhFdmVudFRpbWU7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmdldERpc3BsYXlJbmJveFNldHRpbmdzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZGlzcGxheUluYm94U2V0dGluZ3M7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0RGlzcGxheUluYm94U2V0dGluZ3MgPSBmdW5jdGlvbiAoIGRpc3BsYXkgKVxyXG4gICAge1xyXG4gICAgICAgIGRpc3BsYXlJbmJveFNldHRpbmdzID0gZGlzcGxheTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAoIG1heEV2ZW50VGltZSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKS5nZXRUaW1lKCkgOiBtYXhFdmVudFRpbWUgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoIHRpbWUgKVxyXG4gICAge1xyXG4gICAgICAgIG1heEV2ZW50VGltZSA9IHRpbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGhpZGU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0SGlkZUV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBoaWRlRXZlbnRzQ291bnRlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRIaWRlRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgaGlkZUV2ZW50c0NvdW50ZXIgPSBoaWRlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldE51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0TnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoIGNvbXBsZXRlZF9ldmVudHMgKVxyXG4gICAge1xyXG4gICAgICAgIG51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gY29tcGxldGVkX2V2ZW50cztcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJDb21wbGV0ZWRFdmVudHNDb3VudGVyKCk7IFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmdW5jdGlvbiAoIGZsYWcgKVxyXG4gICAge1xyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVuZGVyQ29tcGxldGVkRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICAvKnZhciAkaW5kaWNhdG9yID0gJCgnYm9keScpLmZpbmQoJy5uZXctZXZlbnRzLWluZGljYXRvcicpO1xyXG5cclxuICAgICAgICBpZiAoICRpbmRpY2F0b3IubGVuZ3RoID4gMCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICFoaWRlRXZlbnRzQ291bnRlciAmJiBhbGxfc2V0dGluZ3MubGljZW5zZVR5cGUgIT0gJ0ZyZWUnICYmIGFsbF9zZXR0aW5ncy5saWNlbnNlVHlwZSAhPSAnSW5kaXZpZHVhbCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICRpbmRpY2F0b3IuaGFzQ2xhc3MoJ3plcm8nKSApICRpbmRpY2F0b3IucmVtb3ZlQ2xhc3MoJ3plcm8nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkaW5kaWNhdG9yLnRleHQoIG51bWJlck9mQ29tcGxldGVkRXZlbnRzICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAhJGluZGljYXRvci5oYXNDbGFzcygnemVybycpICkgJGluZGljYXRvci50ZXh0KCcnKS5hZGRDbGFzcygnemVybycpOyAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0qL1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhZ2VuY3lDb25maWd1cmF0aW9uO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoIGFjIClcclxuICAgIHtcclxuICAgICAgICBhZ2VuY3lDb25maWd1cmF0aW9uID0gYWM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWdlbmN5QnJhbmRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYoIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50ID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcblxyXG4gICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KCBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudCApIClcclxuICAgICAgICAgICAgcmV0dXJuIFsgYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRVc2VyUGVybWlzc2lvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIHZhciBicmFuZHMgPSBtb2R1bGUuZ2V0QWdlbmN5QnJhbmRzKCksXHJcbiAgICAgICAgICAgIHBlcm1pc3Npb24gPSAnZWRpdCc7XHJcblxyXG4gICAgICAgIGlmKCAhYnJhbmRzLmxlbmd0aCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPGJyYW5kcy5sZW5ndGg7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggYnJhbmRzW2ldLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgYnJhbmRzW2ldLnNlbGVjdGVkID09ICcxJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBlcm1pc3Npb24gPSBicmFuZHNbaV0ucGVybWlzc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBlcm1pc3Npb247XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFuYWx5dGljc0FjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFBPU1QsXHJcbiAgICAgICAgICAgIHVybDogJ2FqYXgucGhwJyxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QW5hbHl0aWNzQWNjb3VudHMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZSggcmVzcG9uc2UgKTsgXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUFjY291bnRzID0gZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDpcImFqYXgucGhwXCIsXHJcbiAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOid1cGRhdGVBY2NvdW50cycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOmRhdGFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCByZXNwb25zZSA9PSBTVUNDRVNTKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoKTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlU2V0dGluZ3MgPSBmdW5jdGlvbiggZGF0YSwgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NhdmVTZXR0aW5ncycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggcmVzcG9uc2UucmV0dXJuQ29kZSA9PSBcIlNVQ0NFU1NcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmhhbmRsZV9zZXR0aW5ncyggcmVzcG9uc2Uuc2V0dGluZ3MsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCByZXNwb25zZSApO1xyXG4gICAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFNlYXJjaFN0cmVhbXMgPSBmdW5jdGlvbiggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KHsgdHlwZTpHRVQsIHVybDonZmVlZC9zZWFyY2hTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0U2VhcmNoU3RyZWFtcyd9fSwgZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGdvdF9zZiA9IHRydWU7XHJcbiAgICAgICAgICAgIHNlYXJjaGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmVkaXRTZWFyY2hTdHJlYW0gPSBmdW5jdGlvbiggc3RyZWFtLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBzdHJlYW0ucHJvZmlsZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICAgICAgdXJsOidmZWVkL3NlYXJjaFN0cmVhbXMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2VkaXRTZWFyY2hTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJlYW0uaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzdHJlYW0ucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc3RyZWFtLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogc3RyZWFtLnBhcmFtZXRlcnNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgIT09IHVuZGVmaW5lZCApIHJlcXVlc3QuZGF0YS5uYW1lID0gJ1NlYXJjaDogJyArIGRlY29kZVVSSUNvbXBvbmVudCggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgKTtcclxuXHJcbiAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRGYXZvcml0ZVN0cmVhbXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCh7IHR5cGU6R0VULCB1cmw6J2ZlZWQvZmF2b3JpdGVTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0RmF2b3JpdGVTdHJlYW1zJ319LCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgZmF2b3JpdGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGdvdF9mYXZlcyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZmF2b3JpdGVzICk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0RmF2b3JpdGVTdHJlYW1zIHJlc3BvbnNlOicpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mYXZvcml0ZXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIGdvdF9mYXZlcyApIHJldHVybiBmYXZvcml0ZXM7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNlYXJjaF9mZWVkcyA9IGZ1bmN0aW9uICggKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggZ290X3NmICkgcmV0dXJuIHNlYXJjaGVzO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTsgICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXR0aW5ncyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKSBcclxuICAgIHtcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggc2V0dGluZ3MgKTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldFNldHRpbmdzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpHRVQsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycgICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBoYW5kbGUgKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtb2R1bGUuaGFuZGxlX3NldHRpbmdzKHJlc3BvbnNlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGhhbmRsZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmhhbmRsZV9zZXR0aW5ncyA9IGZ1bmN0aW9uKCByZXNwb25zZSwgY2FsbGJhY2ssIGZsYWdfbm9fYWdlbmN5X3VwZGF0ZSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2hhbmRsZV9zZXR0aW5ncy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICBmbGFnX25vX2FnZW5jeV91cGRhdGUgPSBmbGFnX25vX2FnZW5jeV91cGRhdGUgPyBmbGFnX25vX2FnZW5jeV91cGRhdGU6ZmFsc2U7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gc2V0IG1vZHVsZSB2YXJpYWJsZVxyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGRhdGE7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MuYXBpVXNlciA9PT0gdW5kZWZpbmVkIHx8IF8uaXNFbXB0eSggc2V0dGluZ3MuYXBpVXNlciApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmFwaVVzZXIgPSBzZXR0aW5ncy5lbWFpbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9zZXQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICAgICAgICBpc193aXhfdXNlciA9IHNldHRpbmdzLndpeFVzZXI7XHJcbiAgICAgICAgICAgIG1heF9hbGxvd2VkX2dhX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZBY3RpdmVHb29nbGVBbmFseXRpY3NBY2NvdW50cztcclxuICAgICAgICAgICAgbWF4X2FsbG93ZWRfc29jaWFsX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZTb2NpYWxzT247XHJcbiAgICAgICAgICAgIHJlbV9kYXlzID0gc2V0dGluZ3MuZGF5c0xlZnQ7XHJcblxyXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4gICAgICAgICAgICAvL0VDLnNlc3Npb25EYXRhLnNldCgnYWxsX3NldHRpbmdzJywgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0IHNldHRpbmdzRGVmZXJyZWQgYXMgcmVzb2x2ZWQgb25seSBpZiBzZXR0aW5ncyBhdmFpbGFibGVcclxuICAgICAgICAgICAgLy9zZXR0aW5nc0RlZmVycmVkLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxpY2Vuc2VPcHRpb25zID0gZGF0YS5saWNlbnNlT3B0aW9ucztcclxuXHJcbiAgICAgICAgICAgIC8qaWYgKCBkYXRhLnVzZXJTb3VyY2UgPT0gXCJiaWdjb21tZXJjZVwiIHx8IGRhdGEubG9naW5UeXBlICE9ICd1c2VyUGFzc3dvcmQnKXtcclxuICAgICAgICAgICAgICAgICQoJy5jaGFuZ2VfcGFzcycpLmFkZENsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0qL1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM/ICggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzLnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEhpZGVFdmVudHNDb3VudGVyKCBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciA/ICggZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIikgOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXREaXNwbGF5SW5ib3hTZXR0aW5ncyggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA/ICggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKSA6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLm51bWJlck9mTmV3RXZlbnRzID09ICdzdHJpbmcnKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXROdW1iZXJPZkNvbXBsZXRlZEV2ZW50cyggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3coIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID8gKCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKTogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiA9PSAnb2JqZWN0Jyl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QWdlbmN5Q29uZmlndXJhdGlvbiggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5leHRlcm5hbEFwcHMhPT11bmRlZmluZWQgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gZXh0ZXJuYWxBcHBzID0gZGF0YS5leHRlcm5hbEFwcHM7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5leHRlcm5hbEFwcHMgKSApIGV4dGVybmFsQXBwcyA9IFsgZGF0YS5leHRlcm5hbEFwcHMgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGV4dGVybmFsQXBwcyA9IGRhdGEuZXh0ZXJuYWxBcHBzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnZXh0ZXJuYWxBcHBzJyApXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZXh0ZXJuYWxBcHBzIClcclxuXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEFwcHMuZm9yRWFjaChmdW5jdGlvbiAoIGV4dGVybmFsQXBwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBleHRlcm5hbEFwcC5leHRlcm5hbEFwcCApICkgZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHAgPSBbIGV4dGVybmFsQXBwLmV4dGVybmFsQXBwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcHAgPSBleHRlcm5hbEFwcC5leHRlcm5hbEFwcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdhcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggYXBwIClcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBhcHAuZm9yRWFjaChmdW5jdGlvbiAoIHRoaXNfYXBwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAndGhpc19hcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIHRoaXNfYXBwIClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2xleGl0eScpIGlzX2xleGl0eV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ3dlZWJseScpIGlzX3dlZWJseV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2V0c3knKSBpc19ldHN5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnc2hvcGlmeScpIGlzX3Nob3BpZnlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdiaWdjb21tZXJjZScpIGlzX2JpZ2NvbW1lcmNlX3VzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gIFxyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVfc2V0dGluZ3Nfd2luZG93ID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzV2luZG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHJlc3AuYWdlbmN5TnVtYmVyT2ZDbGllbnRzICE9PSB1bmRlZmluZWQgKSAkKCcucGxhbi11c2FnZSAuYnJhbmQtdXNhZ2UgLnZhbHVlJykudGV4dCggcmVzcC5hZ2VuY3lOdW1iZXJPZkFjdGl2ZUNsaWVudHMrICcvJyArcmVzcC5hZ2VuY3lOdW1iZXJPZkNsaWVudHMgKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0dGluZ3NXaW5kb3dOdW1iZXJzKCByZXNwICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldExpY2Vuc2VPcHRpb25zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbGljZW5zZU9wdGlvbnM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfZXRzeV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfZXRzeV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3dlZWJseV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfd2VlYmx5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfbGV4aXR5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19sZXhpdHlfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19zaG9waWZ5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19zaG9waWZ5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfYmlnY29tbWVyY2VfdXNlcj0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfYmlnY29tbWVyY2VfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRFeHRlcm5hbEFwcHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBleHRlcm5hbEFwcHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY2hlY2tMaWNlbnNlVmlldyA9IGZ1bmN0aW9uICggaWQsIGlzX3dpeCwgbWl4cGFuZWxfdHlwZSApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gaWYoIGxpY2Vuc2VPcHRpb25zLnZpZXcgIT0gdW5kZWZpbmVkICYmIGxpY2Vuc2VPcHRpb25zLnZpZXcgPT0gJzdELU9ubHknICYmIGlkICE9ICc3RCcpXHJcbiAgICAgICAgaWYgKCBmYWxzZSApIC8vIGVuYWJsZSBhbGwgdGltZWZyYW1lc1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8kKHdpbmRvdykudHJpZ2dlcigndXBncmFkZS1wb3B1cCcsIG1peHBhbmVsX3R5cGUpO1xyXG4gICAgICAgICAgICBzaG93VXBncmFkZVdpbmRvdyhpc193aXgpO1xyXG4gICAgICAgICAgICByZXR1cm4gRkFJTDsgICAgXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlIHJldHVybiBTVUNDRVNTOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X3VzZXJfaW5ib3hfdGFncyA9IGZ1bmN0aW9uKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFVzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBzdGFydFRpbWU6ICcwJyxcclxuICAgICAgICAgICAgZW5kVGltZTogJzAnLFxyXG4gICAgICAgICAgICByZXF1ZXN0X2FjdGlvbjogJ2dldFVzZXJUYWdzJyxcclxuICAgICAgICAgICAgbWF4RXZlbnRzOiAnMSdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogR0VULFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3VzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoudGFncyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIG9iai50YWdzICkgKSB1c2VyX2luYm94X3RhZ3MgPSBvYmoudGFncztcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTtcclxuICAgICAgICB9KTsgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmluYm94X3RhZ3MgPSBmdW5jdGlvbiAoIClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdXNlcl9pbmJveF90YWdzOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlX2luYm94X3RhZ3MgPSBmdW5jdGlvbiggdGFncywgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHRhZ3MgPSBBcnJheS5pc0FycmF5KCB0YWdzICkgP3RhZ3M6W107XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBQT1NULFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICd1c2VyL2V2ZW50cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6eyB0YWdzOiB0YWdzIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIG9iaiApe1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vSWYgc3VjY2VzcywgdXBkYXRlIHRhZ3MgYXJyYXlcclxuICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT0gJ1NVQ0NFU1MnIClcclxuICAgICAgICAgICAgICAgIHVzZXJfaW5ib3hfdGFncyA9IHRhZ3M7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJHVybFJvdXRlcicsICdFQycsICdhcGlVcmwnLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkdXJsUm91dGVyLCBFQywgYXBpVXJsICl7XHJcblxyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBTb2NpYWwoIHByb2ZpbGUgKVxyXG4gICAge1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlIHx8IHt9O1xyXG5cclxuICAgICAgICAvLyB0aGlzLmZlZWRzID0ge307XHJcbiAgICAgICAgdGhpcy5mZWVkc19pbl9vcmRlciA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJ2YWwgPSAwO1xyXG5cclxuICAgICAgICAvL0luYm94IGZpbHRlcnNcclxuICAgICAgICB0aGlzLnVzZXJfaW5ib3hfZmlsdGVycyA9IFtdOy8vZ2V0X3VzZXJfaW5ib3hfZmlsdGVycygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7IFxyXG4gICAgICAgIHRoaXMuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPSB0cnVlOyBcclxuICAgIH1cclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLnBhZ2VzID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMucGFnZXM7XHJcbiAgICB9O1xyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUubG9nID0gZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgY29uc29sZS5kaXIoIHRoaXMgKTtcclxuICAgIH07XHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCBjb250YWluZXIgKXtcclxuXHJcbiAgICAgICAgdmFyICRjb250YWluZXIgPSBjb250YWluZXIgfHwgJCgnI3NvY2lhbCcpO1xyXG5cclxuICAgICAgICAkY29udGFpbmVyLmh0bWwoJycpO1xyXG4gICAgfTtcclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCApXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9Bc3NpZ24gaXQgdG8gZ2xvYmFsIG9iamVjdCBcclxuICAgICAgICAvL3dpbmRvdy5nbG9iYWxzLnNvY2lhbCA9IHRoaXM7IFxyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHByZXZpb3VzX2ZlZWRzID0gW10sXHJcbiAgICAgICAgICAgIG5ld19zdHJlYW1zX29yZGVyID0gW10sXHJcbiAgICAgICAgICAgIHByZXZfZmVlZHNfaW5fb3JkZXIgPSBzZWxmLmZlZWRzX2luX29yZGVyO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLnNvY2lhbCA9IHNlbGY7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkc19pbl9vcmRlciA9IFtdO1xyXG5cclxuICAgICAgICAvL2dldCBuZXcgc3RyZWFtcyBvcmRlclxyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCggc2VsZi5wcm9maWxlLnN0cmVhbXMsIGZ1bmN0aW9uKCB0aGlzX3N0cmVhbSApe1xyXG4gICAgICAgICAgICB2YXIgaWQgPSAoIFsncnNzJywgJ3NlYXJjaCcsICdvdXRyZWFjaCddLmluZGV4T2YoIHRoaXNfc3RyZWFtLnN0cmVhbUlkICkgPiAtMSApID8gdGhpc19zdHJlYW0uaWQgOiB0aGlzX3N0cmVhbS5zdHJlYW1JZDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKCBzZWxmLnByb2ZpbGUuaWQuaW5kZXhPZignZmF2b3JpdGUnKSAhPT0gLTEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZCArPSAnXycgKyAgdGhpc19zdHJlYW0ucHJvZmlsZS5pZCArICdfJyArIHRoaXNfc3RyZWFtLm5ldHdvcms7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmV3X3N0cmVhbXNfb3JkZXIucHVzaCggaWQgKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhuZXdfc3RyZWFtc19vcmRlcik7XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IHNlbGYucHJvZmlsZS5zdHJlYW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGhpc19zdHJlYW0gPSBzZWxmLnByb2ZpbGUuc3RyZWFtc1sgaSBdLFxyXG4gICAgICAgICAgICAgICAgaWQgPSAoIFsncnNzJywgJ3NlYXJjaCcsICdvdXRyZWFjaCddLmluZGV4T2YoIHRoaXNfc3RyZWFtLnN0cmVhbUlkICkgPiAtMSApID8gdGhpc19zdHJlYW0uaWQgOiB0aGlzX3N0cmVhbS5zdHJlYW1JZCxcclxuICAgICAgICAgICAgICAgIG5ldHdvcmsgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCksXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpc19zdHJlYW0udmFsdWUgPT0gJ3RydWUnICApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBQUE6OicrbmV0d29yayk7XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKCBuZXR3b3JrIClcclxuICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZmFjZWJvb2snOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZCIHRlc3Q6OjonKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgRmFjZWJvb2tGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGdldEV4aXN0aW5nU3RhdGUgPSAkc3RhdGUuZ2V0KG5ld19mZWVkLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggbmV3X2ZlZWQgJiYgJHN0YXRlLmdldChuZXdfZmVlZC5wYWdlX2lkKSA9PT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIucHVzaCggbmV3X2ZlZWQgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmV3X2ZlZWQucmVuZGVyID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZC5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy92YXIgJG5ld19mZWVkID0gbmV3X2ZlZWQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vJGNvbnRhaW5lci5hcHBlbmQoICRuZXdfZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBuZXdfZmVlZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHByZXZfZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IG5ld19mZWVkLnBhZ2VfaWR9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiggaW5kZXggPj0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyLnB1c2gocHJldl9mZWVkc19pbl9vcmRlcltpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB1cGRhdGVkX3N0cmVhbXNfb3JkZXIgPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5mZWVkc19pbl9vcmRlciwgZnVuY3Rpb24odGhpc19mZWVkKXtcclxuICAgICAgICAgICAgdXBkYXRlZF9zdHJlYW1zX29yZGVyLnB1c2godGhpc19mZWVkLnBhZ2VfaWQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgICAgIC8vRGVjaWRlIHRoZSBmZWVkIHBhZ2UgdG8gc2hvdyBieSBkZWZhdWx0XHJcbiAgICAgICAgdmFyIGZlZWRfcGFnZV90b19zaG93ID0gJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy90byBtYWludGFpbiBsYXN0IGZlZWQtc2VsZWN0b3IgcG9zaXRpb25cclxuICAgICAgICBpZiggc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciAmJiBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgPT09IDAgKSBcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlcltzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3JdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKCBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yXTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPT09IGZhbHNlICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlclt1cGRhdGVkX3N0cmVhbXNfb3JkZXIubGVuZ3RoLTFdO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vYXNzaWduIHVwZGF0ZWQgc3RyZWFtcyB0byBjdXJyZW50IG9iamVjdFxyXG4gICAgICAgIHNlbGYudXBkYXRlZF9zdHJlYW1zX29yZGVyID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyO1xyXG5cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0T2JqKGlkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHNlbGYuZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IGlkfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qY29uc29sZS5sb2coJ3VwZGF0ZWRfc3RyZWFtc19vcmRlcicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVwZGF0ZWRfc3RyZWFtc19vcmRlcik7XHJcbiAgICAgICAgY29uc29sZS5sb2coZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGdldE9iaihmZWVkX3BhZ2VfdG9fc2hvdykpOyovXHJcbiAgICAgICAgdmFyIGN1cnJlbnRfb2JqID0geyduYW1lJzoncmFtJ307Ly9nZXRPYmooZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG5cclxuICAgICAgICAkc3RhdGUuZ28oZmVlZF9wYWdlX3RvX3Nob3csIHtvYmo6Y3VycmVudF9vYmp9LCB7Y2FjaGU6IHRydWV9KTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ3RoaXMuZmVlZHNfaW5fb3JkZXInKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmZlZWRzX2luX29yZGVyKTtcclxuICAgICAgICByZXR1cm4gdGhpczsgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcblxyXG4gICAgLypcclxuICAgICAgICBCYXNlIEZlZWQgY2xhc3NcclxuICAgICovXHJcbiAgICBcclxuICAgICAgICBmdW5jdGlvbiBGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgICAgIGZlZWQgPSAnJzsvL25ldyBFbGVtZW50KCcjZmVlZC10ZW1wbGF0ZScpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGZlZWQuZWxlbWVudDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMucHJvZmlsZSA9IHByb2ZpbGU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLm5ldHdvcmsgPSAoIHByb2ZpbGUgPT09IHVuZGVmaW5lZCA/IHN0cmVhbS5uZXR3b3JrIDogcHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBzdHJlYW0ubmFtZSB8fCBzdHJlYW0uaWQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmlkID0gc3RyZWFtLnN0cmVhbUlkO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaXplID0gc3RyZWFtLnNpemU7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZhdm9yaXRlZCA9IHN0cmVhbS5mYXZvcml0ZWQgfHwgZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHN0cmVhbS52YWx1ZTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMubmV4dCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyA8LS0gWyBGZWVkSXRlbSBdXHJcblxyXG4gICAgICAgICAgICB0aGlzLmxhc3RfbG9hZGVkX3RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5sb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uID0gMDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG51bGw7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvKiBwcmVwYXJlIHBhZ2VfaWQgKi9cclxuICAgICAgICAgICAgdGhpcy5wYWdlX2lkID0gJ3RhYnMuJyArIHRoaXMuZ2V0X3BhZ2VfaWQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEZlZWQucHJvdG90eXBlLmdldF9wYWdlX2lkID0gZnVuY3Rpb24oKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAgICAgaWQgPSBzZWxmLmlkLFxyXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJyc7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkID0gc2VsZi5pZCArICdfJyArIHNlbGYucHJvZmlsZS5pZCArICdfJysgc2VsZi5uZXR3b3JrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIHNlbGYuaWQgPT0gJ3NlYXJjaCcgfHwgc2VsZi5pZCA9PSAncnNzJyB8fCBzZWxmLmlkID09ICdvdXRyZWFjaCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZCA9IHNlbGYubmFtZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnZmF2b3JpdGUnOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnNlYXJjaCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByZWZpeCA9ICdzZWFyY2gnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMucnNzIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJ3Jzcyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiggdGhpcy5uZXR3b3JrID09ICdjaW5ib3gnIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSAnY2luYm94JztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYoIHNlbGYucHJvZmlsZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBwcmVmaXggPSBzZWxmLnByb2ZpbGUuaWQ7XHJcbiAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gKHByZWZpeCArICctJyArIGlkKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEZlZWQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBmZWVkX3RpdGxlID0gJyc7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgZmVlZF9uYW1lID0gc2VsZi5uYW1lO1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIHNlbGYubmV0d29yayApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZmFjZWJvb2snOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEucGFnZU5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLnNwZWNpZmllZEhhbmRsZU9ySGFzaFRhZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2UgJ2xpbmtlZGluJzogcGFnZSA9IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xpbmtlZGluJzogcGFnZSA9IHNlbGYucHJvZmlsZS51c2VybmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3lvdXR1YmUnOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEudXNlckZpcnN0TmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09ICd5dF9teUNoYW5uZWxIb21lJyApIGZlZWRfbmFtZSA9ICdIb21lIC0gQWN0aXZpdGllcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdnb29nbGVwbHVzJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLmZ1bGxOYW1lLnNwbGl0KFwiKFwiKVswXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiBwYWdlID0gdGhpcy5wcm9maWxlLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmZWVkX3RpdGxlID0gcGFnZSsgJyAtICcgK2ZlZWRfbmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnNlYXJjaCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnQ3VzdG9tIFNlYXJjaCBGZWVkJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnJzcyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnUlNTIEZlZWQnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmVlZF90aXRsZSA9ICh0aGlzLm5hbWUpLmluZGV4T2YoJ0ZlZWQnKSA+PSAwID8gdGhpcy5uYW1lOih0aGlzLm5hbWUgKyAnIEZlZWQnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5wYWdlX3RpdGxlID0gZmVlZF90aXRsZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNlbGYucGFnZV9pZCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZ2V0RXhpc3RpbmdTdGF0ZSA9ICRzdGF0ZS5nZXQoc2VsZi5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgICAgIGlmKGdldEV4aXN0aW5nU3RhdGUgPT09IG51bGwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwYWdlX2lkOjo6JytzZWxmLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgXCJ1cmxcIjogJy8nICsgc2VsZi5wYWdlX2lkICsgJzpvYmonLFxyXG4gICAgICAgICAgICAgICAgICBjYWNoZTp0cnVlLFxyXG4gICAgICAgICAgICAgICAgICBcInZpZXdzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAnaG9tZS10YWInOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcmFtLmh0bWxcIixcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiRmVlZHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczoge29iajogc2VsZn1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgJHN0YXRlUHJvdmlkZXJSZWYuc3RhdGUoc2VsZi5wYWdlX2lkLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICAgICAgICAgICAgICAkdXJsUm91dGVyLmxpc3RlbigpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwYWdlX2lkOjo6MDAwMDAnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApIC8vIDwtLSBvdmVycmlkZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSA9IG5ldyBGZWVkSXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKSAvLyA8LS0gb3ZlcnJpZGVcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0gPSBuZXcgRmVlZEl0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBGZWVkLnByb3RvdHlwZS5hcHBlbmRfaXRlbXMgPSBmdW5jdGlvbiAoIGFkZF9hZnRlcl9pbmRleCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICAgICBuID0gcGFyc2VJbnQoIGFkZF9hZnRlcl9pbmRleCApLFxyXG4gICAgICAgICAgICAgICAgLy8kY29udGFpbmVyID0gdGhpcy5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJyksXHJcbiAgICAgICAgICAgICAgICBjb3VudCA9IDA7XHJcbiAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBGZWVkLnByb3RvdHlwZS5zaG93X2l0ZW1zID0gZnVuY3Rpb24gKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZpbmFsOjo6Ojo6Ojo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHNlbGYuaXRlbXMpO1xyXG5cclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRmVlZC5wcm90b3R5cGUuY2xlYXJGZWVkTm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKCByZW1vdmVfbWVzc2FnZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBGZWVkLnByb3RvdHlwZS5oaWRlX3B1bGx1cCA9IGZ1bmN0aW9uICgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBcclxuICAgIC8qXHJcbiAgICAgICAgRmFjZWJvb2tGZWVkIGNsYXNzXHJcbiAgICAqL1xyXG5cclxuICAgIGZ1bmN0aW9uIEZhY2Vib29rRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBwcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ICE9PSAnVXNlcicgJiYgWyd3YWxsUG9zdHMnLCdmYl9ub3RpZmljYXRpb25zJ10uaW5kZXhPZiggc3RyZWFtLnN0cmVhbUlkICkgIT09IC0xIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmVlZCA9IHRydWU7ICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmFjZWJvb2tGZWVkO1xyXG5cclxuICAgIC8qRmFjZWJvb2tGZWVkLnByb3RvdHlwZS51cGRhdGVGZWVkTm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMgXHJcbiAgICAgICAgICAgICxjdXJyZW50SUQgPSBzZWxmLnVwZGF0ZUludGVydmFsSUQ7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXROZXdzRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiAnL2FqYXgucGhwJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoIHNlbGYuaWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnd2FsbFBvc3RzJzogcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICd3YWxsUG9zdHMnOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLndhbGwgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEubGltaXQgPSAxMDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYl9ub3RpZmljYXRpb25zJzogcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdub3RpZmljYXRpb25zJzsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5saW1pdCA9IDEwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2luQm94JzogcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdpbkJveCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjdGlvbiA9ICdnZXRGYkNvbnZlcnNpb25zJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoIHNlbGYucHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSA9PT0gXCJVc2VyXCIpIHJlcXVlc3QuZGF0YS5uZXh0ID0gXCIvaW5ib3hcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBlbHNlIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5uZXh0ID0gXCIvY29udmVyc2F0aW9uc1wiO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnJWN1cGRhdGVGZWVkTm90aWZpY2F0aW9uKCcgKyBzZWxmLmlkICsgJykgcmVzcG9uc2U6JywgJ2NvbG9yOm9yYW5nZXJlZCcpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBjdXJyZW50SUQgPT09IHNlbGYudXBkYXRlSW50ZXJ2YWxJRCApIC8vIGRpZG4ndCByZWZyZXNoIGR1cmluZyByZXF1ZXN0XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdElEID0gJyMjIyc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5maXJzdEl0ZW1JRCApIGZpcnN0SUQgPSBzZWxmLmZpcnN0SXRlbUlEO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdmaXJzdElEIDo6ICcgKyBmaXJzdElEKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtaW5jb21pbmcgPSBbXTsgLy8gaW5jb21pbmcgbWVzc2FnZXMgYXJyYXlcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ2luQm94JyAmJiBmaXJzdElEICE9PSAnIyMjJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1c2VySWQgPSBzZWxmLnByb2ZpbGUuZGF0YS5wYWdlSWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb21tZW50cyA9IGRhdGEuZGF0YVsgaSBdLmNvbW1lbnRzLmNvbW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggY29tbWVudHMgKSApIGNvbW1lbnRzID0gWyBjb21tZW50cyBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBrID0gMCwgbGwgPSBjb21tZW50cy5sZW5ndGg7IGsgPCBsbDsgaysrIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19jb21tZW50ID0gY29tbWVudHNbIGsgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2NvbW1lbnQuZnJvbUlkICE9PSBjdXNlcklkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmNvbWluZy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXNfY29tbWVudCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggdGhpc19jb21tZW50LmNyZWF0ZWRUaW1lLnNwbGl0KCcrJylbIDAgXSApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzX2NvbW1lbnQubWVzc2FnZUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBtaW5jb21pbmcgKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gbWluY29taW5nLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gKCBpdGVtLnRpbWUgPiBmaXJzdElEID8gMSA6IDAgKTt9KS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSArIGI7IH0sIDApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ2luQm94IGluZGV4ID0gJyArIGluZGV4ICk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAgbWluY29taW5nLmxlbmd0aCApIHNlbGYuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuIGl0ZW0uaWQ7fSkuaW5kZXhPZiggZmlyc3RJRCApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gLTEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBmaXJzdElEID09PSAnIyMjJyApIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnaW5kZXggOjogJyArIGluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRoZWFkZXIgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaGVhZGVyJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLCRmYm9keSA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkdXBkYXRlX25vdGlmID0gJGZib2R5LmZpbmQoJy51cGRhdGUtbm90aWZpY2F0aW9uJyk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICR1cGRhdGVfbm90aWYubGVuZ3RoID09PSAwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYgPSAkKCc8ZGl2IGNsYXNzPVwidXBkYXRlLW5vdGlmaWNhdGlvblwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmLm9uKCdjbGljaycsIGZ1bmN0aW9uICggZSApeyAkaGVhZGVyLmZpbmQoJy5yZWZyZXNoLWZlZWQnKS50cmlnZ2VyKCdjbGljaycpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGZib2R5LmZpbmQoJy5mZWVkLWl0ZW0nKS5maXJzdCgpLmJlZm9yZSggJHVwZGF0ZV9ub3RpZiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ2luQm94JyApICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gbWluY29taW5nLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IE1lc3NhZ2UnICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5pZCA9PT0gJ3dhbGxQb3N0cycgKSAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IGRhdGEuZGF0YS5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBQb3N0JyArICggaW5kZXggPT0gMSA/ICcnIDogJ3MnICkgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBkYXRhLmRhdGEubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgTm90aWZpY2F0aW9uJyArICggaW5kZXggPT0gMSA/ICcnIDogJ3MnICkgKTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgY29uc29sZS5lcnJvcignISEhIGN1cnJlbnRJRCAhISEnKTtcclxuICAgICAgICB9KTtcclxuICAgIH07Ki8gIFxyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICduZXdzRmVlZCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJuZXdzRmVlZFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3dhbGxQb3N0cyc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJ3YWxsUG9zdHNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwYWdlc0ZlZWQnOiB0aGlzLmdldE5ld3NGZWVkKFwicGFnZXNGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaW5Cb3gnOiB0aGlzLmdldEZiQ29udmVyc2lvbnMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hpZGRlbl9ncm91cHMnOiB0aGlzLmZpbGxGQkhpZGRlbl9Hcm91cHMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3RpbWVsaW5lJzogdGhpcy5nZXROZXdzRmVlZChcInRpbWVsaW5lXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzogdGhpcy5nZXROZXdzRmVlZChcInNlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ291dHJlYWNoJzogdGhpcy5nZXROZXdzRmVlZChcInNlYXJjaFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZiX25vdGlmaWNhdGlvbnMnOiB0aGlzLmdldE5ld3NGZWVkKFwibm90aWZpY2F0aW9uc1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZiX2xpa2VzJzogdGhpcy5nZXROZXdzRmVlZChcImZiX2xpa2VzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2ZiX2xpa2VzJyB8fCB0aGlzLmlkID09ICdvdXRyZWFjaCcgfHwgKCB0aGlzLmlkID09ICduZXdzRmVlZCcgJiYgIXRoaXMubmV4dCApIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7IFxyXG4gICAgICAgICAgICAvL3RoaXMuaGlkZV9wdWxsdXAoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZG9GYlJlcXVlc3QnLFxyXG4gICAgICAgICAgICAgICAgd2FsbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0cmVhbTogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ25ld3NGZWVkJzpcclxuICAgICAgICAgICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzZWFyY2gnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7IFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBjYXNlICd3YWxsUG9zdHMnOlxyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ3BhZ2VzRmVlZCc6XHJcbiAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAnaW5Cb3gnOlxyXG4gICAgICAgICAgICAvLyAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIpIGRhdGEubmV4dCA9ICcvaW5ib3gnO1xyXG5cclxuICAgICAgICAgICAgLy8gICAgIGVsc2UgZGF0YS5uZXh0ID0gJy9jb252ZXJzYXRpb25zJztcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdoaWRkZW5fZ3JvdXBzJzpcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogc2VsZi5zdHJlYW0uc2VsZWN0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogc2VsZi5uZXh0XHJcbiAgICAgICAgICAgICAgICAgICAgfTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmJfbm90aWZpY2F0aW9ucyc6XHJcbiAgICAgICAgICAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGRhdGEuc3RyZWFtID0gJ25vdGlmaWNhdGlvbnMnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9mYk1vcmUnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkX21vcmVfZmxhZyA9IGZhbHNlOyAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLm5leHQgPT0gZGF0YS5wYWdpbmcubmV4dCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldE5ld3NGZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbSxcclxuICAgICAgICAgICAgbGltaXQ6IDEwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggc3RyZWFtID09ICd3YWxsUG9zdHMnIHx8IHN0cmVhbSA9PSAnZmJfaW5mbHVlbmNlcycgfHwgc3RyZWFtID09ICd0aW1lbGluZScgKSBkYXRhLndhbGwgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbmV3cycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHN0cmVhbSA9PSAnc2VhcmNoJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZSA9PT0gdW5kZWZpbmVkICkgLy9lbXB0eSBzZWFyY2ggZmVlZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnkgIT09IHVuZGVmaW5lZCAmJiBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeS5sZW5ndGggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNlYXJjaF9yZXF1ZXN0KCBzZWxmLCBmdW5jdGlvbiggZGF0YSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL2lmKCBFQy5xdWV1ZV9saXN0WyBCYXNlNjQuZW5jb2RlKCBKU09OLnN0cmluZ2lmeSggcmVxdWVzdCApICkgXSAhPT0gdW5kZWZpbmVkICkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXF1ZXN0KTtcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzdHJlYW0gPT0gJ25vdGlmaWNhdGlvbnMnICYmIG9iai5tZXNzYWdlLmluZGV4T2YoJ3lvdSBkbyBub3QgaGF2ZSBzdWZmaWNpZW50IHBlcm1pc3Npb24nKSAhPSAtMSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGRpdiBjbGFzcz1cImZlZWQtaXRlbVwiPjxkaXYgY2xhc3M9XCJmZWVkLWFsZXJ0XCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQ2xpY2sgXCJPS1wiIHRvIGFkZCBGYWNlYm9vayBOb3RpZmljYXRpb24gRmVlZC4nICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInJlZnJlc2hcIj5PSzwvZGl2PicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PicpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50Lm9uKCdjbGljaycsICcucmVmcmVzaCcsIGZ1bmN0aW9uICggZXZlbnQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IHNlbGYucHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZWZyZXNoICcsIGlkIClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW5ld1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkFkZEFjY291bnRQb3B1cCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93TmFtZTogJ0Nvbm5lY3RXaXRoT0F1dGgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd09wdGlvbnM6ICdkaXJlY3Rvcmllcz0wLGxvY2F0aW9uPTAsc3RhdHVzPTAsbWVudWJhcj0wJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAnYWNjb3VudC9hY2NvdW50P2FjdGlvbj1zZXRFeHBpcmVkS2V5QnlJRCZpZD0nICtpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogNjAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogNjUwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldEZiQ29udmVyc2lvbnMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEZiQ29udmVyc2lvbnMnLFxyXG4gICAgICAgICAgICBzdHJlYW06ICdpbkJveCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5uZXh0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiKSBkYXRhLm5leHQgPSBcIi9pbmJveFwiO1xyXG5cclxuICAgICAgICAgICAgZWxzZSBkYXRhLm5leHQgPSBcIi9jb252ZXJzYXRpb25zXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGRhdGEubmV4dCA9IHRoaXMubmV4dDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IEdFVCxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9mYkNvbnZlcnNpb25zJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdXIgaW5ib3ggaXMgZW1wdHkuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5jb2RlID09IEZBSUwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZmlsbEZCSGlkZGVuX0dyb3VwcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7ICAgXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgbCA9IDA7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRGQkhpZGRlbl9Hcm91cHMnLFxyXG4gICAgICAgICAgICBzdHJlYW06ICdncm91cHMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggIXRoaXMubmV4dCApIGRhdGEubmV4dF9wb3N0cyA9IFwiXCI7XHJcblxyXG4gICAgICAgIGVsc2UgZGF0YS5uZXh0X3Bvc3RzID0gdGhpcy5uZXh0O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogR0VULFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiSGlkZGVuR3JvdXBzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSBGQUlMKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZF9pZCxcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9uYW1lID0gJyc7XHJcbiAgICAgICAgICAgICAgICAvL2dldCBmaXJzdCBncm91cCBpZiBubyBzZWxlY3RlZFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCA9PSAnX2RlZmF1bHRfJyApLy8kLmlzRW1wdHlPYmplY3QoIHNlbGYuc3RyZWFtLnNlbGVjdGVkICkgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9pZCA9IG9iai5kYXRhWyAwIF0uaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9IG9iai5kYXRhWyAwIF0ubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHJlYW0uc2VsZWN0ZWQgPSBvYmouZGF0YVsgMCBdLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfaWQgPSBzZWxmLnN0cmVhbS5zZWxlY3RlZDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbCA9IG9iai5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGVjdGVkX2lkID09IG9iai5kYXRhWyBpIF0uaWQgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9IG9iai5kYXRhWyBpIF0ubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC10eXBlJykudGV4dCggJ0dyb3VwOiAnICsgc2VsZWN0ZWRfbmFtZSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogc2VsZWN0ZWRfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ6ICcnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IEdFVCxcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiZmVlZC9mYkdyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5kYXRhICkgKSBpdGVtcyA9IFsgZGF0YS5kYXRhIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGl0ZW1zID0gZGF0YS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBpdGVtcyApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+VGhpcyBncm91cFxcJ3MgZGF0YSBpcyB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyBcclxuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbCA9IG9iai5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIHNlbGYuc3RyZWFtLnNlbGVjdGVkLnNwbGl0KCcsJykuaW5kZXhPZiggb2JqLmRhdGFbIGkgXS5pZCApICE9IC0xICkgb2JqLmRhdGFbIGkgXS5zZWxlY3RlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugb2JqLmRhdGFbIGkgXS5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBzZWxmLnN0cmVhbS5zZWxlY3RlZC5zcGxpdCgnLCcpLmluZGV4T2YoICdfZGVmYXVsdF8nICkgIT0gLTEgKSBvYmouZGF0YVsgMCBdLnNlbGVjdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0R3JvdXBJZFswXSAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIG9iai5kZWZhdWx0R3JvdXBJZFswXSApIClcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0R3JvdXBJZFswXTsgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9KTsgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBsZW5ndGggPT09IDAgKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHZhciBwcmV2X2l0ZW0gPSB0aGlzLml0ZW1zWyBsZW5ndGggLSAxIF0uZGF0YTtcclxuXHJcbiAgICAgICAgaWYgKCBwcmV2X2l0ZW0gPT09IHVuZGVmaW5lZCB8fCBwcmV2X2l0ZW0ubWVkaWEgPT09IHVuZGVmaW5lZCB8fCBkYXRhLm1lZGlhID09PSB1bmRlZmluZWQgKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggcHJldl9pdGVtLm1lZGlhLnR5cGUgPT0gZGF0YS5tZWRpYS50eXBlICYmIHByZXZfaXRlbS5tZWRpYS5ocmVmICE9PSB1bmRlZmluZWQgJiYgZGF0YS5tZWRpYS5ocmVmICE9PSB1bmRlZmluZWQgJiYgcHJldl9pdGVtLm1lZGlhLmhyZWYgPT0gZGF0YS5tZWRpYS5ocmVmICkgXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnU0FNRSBNRURJQScpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuZGlyKCBwcmV2X2l0ZW0gKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnICYmICF0aGlzLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLml0ZW1zWyAwIF0gIT09IHVuZGVmaW5lZCApIGRhdGEgPSBkYXRhLmNvbmNhdCggdGhpcy5pdGVtc1sgMCBdLmRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnaW5Cb3gnKSBuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0oIGRhdGFbIGkgXSkgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJyAmJiAhdGhpcy5vcHRpb25zLmZhdm9yaXRlICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdmYl9saWtlcycgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ3NlYXJjaF9yZXF1ZXN0JyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ291dHJlYWNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLy0tLSBmb3IgbGl2ZSB1cGRhdGVcclxuICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdLCBjdXNlcklkID0gdGhpcy5wcm9maWxlLmRhdGEucGFnZUlkO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZGF0YTo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2luQm94JylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKmZvciAoIHZhciBrID0gMCwgbGwgPSBuZXdfZmVlZF9pdGVtLmRhdGEuY29tbWVudHMuY29tbWVudC5sZW5ndGg7IGsgPCBsbDsgaysrIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2NvbW1lbnQgPSBuZXdfZmVlZF9pdGVtLmRhdGEuY29tbWVudHMuY29tbWVudFsgayBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfY29tbWVudC5mcm9tSWQgIT09IGN1c2VySWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpc19jb21tZW50LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggdGhpc19jb21tZW50LmNyZWF0ZWRUaW1lLnNwbGl0KCcrJylbIDAgXSApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19jb21tZW50Lm1lc3NhZ2VJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0oIGRhdGFbIGkgXSkgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbWluY29taW5nLnNvcnQoIGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYS50aW1lID4gYi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA8IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pOyAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBmaW5kIGxhdGVzdCBpbmNvbWluZ1xyXG4gICAgICAgICAgICBpZiAoIG1pbmNvbWluZy5sZW5ndGggPiAwICkgdGhpcy5maXJzdEl0ZW1JRCA9IG1pbmNvbWluZ1sgMCBdLnRpbWU7XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuZmlyc3RJdGVtSUQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIEZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGZlZWRfaXRlbSA9ICcnO1xyXG5cclxuICAgICAgICBzZWxmLmRhdGEgPSBpdGVtX2RhdGE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkID0gZmVlZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLnByb2ZpbGUgPSBmZWVkLnByb2ZpbGU7XHJcblxyXG4gICAgICAgIHNlbGYuZWxlbWVudCA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIEZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIFRpbWVsaW5lRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubGlrZXMgPT09IHVuZGVmaW5lZCApIHRoaXMuZGF0YS5saWtlcyA9IHtjb3VudDogMH07XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhICE9PSB1bmRlZmluZWQgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uID0gdGhpcy5kYXRhLnJhd19kYXRhLmNvbnZlcnNhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29udmVyc2F0aW9uICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb252ZXJzYXRpb24udHdlZXRzICkgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uLnR3ZWV0cyA9IFsgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbi50d2VldHMgXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWFfY29udGVudCA9PT0gdW5kZWZpbmVkICkgdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpbWVsaW5lRmVlZEl0ZW07XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0TmFtZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBzZWxmLmRhdGEuZnJvbU5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXAgPSBwYXJzZUludCggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSxcclxuICAgICAgICAgICAgdGltZSA9ICcnO1xyXG5cclxuICAgICAgICB2YXIgbmV3X2RhdGUgPSBuZXcgRGF0ZSggdGltZXN0YW1wICogMTAwMCApLFxyXG4gICAgICAgICAgICBkYXRlID0gbmV3X2RhdGU7Ly8uZm9ybWF0KCdtbW0gZGQsIHl5eXksIGg6TU10dCcpO1xyXG5cclxuICAgICAgICBpZiAoICFpc05hTiggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ1RXRm9sbG93ZXJzJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gJ0AnICt0aGlzLmRhdGEudXNlcm5hbWU7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRpbWUgPSBkYXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayAhPT0gJ2ZhY2Vib29rJyB8fCAoIHRoaXMuZmVlZC5pZCAhPSAnc2VhcmNoJyAmJiB0aGlzLmZlZWQuaWQgIT09ICdvdXRyZWFjaCcgKSB8fCAoIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT09IHVuZGVmaW5lZCApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpbWUgPSAnQCcgK3RoaXMuZGF0YS51c2VybmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwYWdlJyB8fCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT0gJ3BsYWNlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gdGhpcy5kYXRhLmNhdGVnb3J5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGltZTtcclxuICAgIH07ICAgIFxyXG4gICAgXHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIERyb3Bkb3duRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0ID0gJyc7XHJcbiAgICAgICAgdGhpcy5kZWZhdWx0X2VsZW1lbnQgPSBmZWVkLmRlZmF1bHRfZWxlbWVudCB8fCAnJztcclxuICAgIH1cclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERyb3Bkb3duRmVlZEl0ZW07XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHM7XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXM7XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuZ2V0X2Ryb3Bkb3duID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRyb3Bkb3duID0gW10sXHJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5kYXRhLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2VsZi5kYXRhID0gc2VsZi5kYXRhLnNvcnQoZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lQSA9ICggdHlwZW9mIGEubmFtZSA9PT0gJ3N0cmluZycgPyBhLm5hbWUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZUIgPSAoIHR5cGVvZiBiLm5hbWUgPT09ICdzdHJpbmcnID8gYi5uYW1lLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggbmFtZUEgPiBuYW1lQiApIHJldHVybiAxO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuYW1lQSA8IG5hbWVCICkgcmV0dXJuIC0xO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmRhdGEgPSBzZWxmLmRhdGEuc29ydChmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZUEgPSAoIHR5cGVvZiBhLmNoYW5uZWxUaXRsZSA9PT0gJ3N0cmluZycgPyBhLmNoYW5uZWxUaXRsZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZUIgPSAoIHR5cGVvZiBiLmNoYW5uZWxUaXRsZSA9PT0gJ3N0cmluZycgPyBiLmNoYW5uZWxUaXRsZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBuYW1lQSA+IG5hbWVCICkgcmV0dXJuIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuYW1lQSA8IG5hbWVCICkgcmV0dXJuIC0xO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IHNlbGYuZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19ncm91cCA9IHNlbGYuZGF0YVsgaSBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwX2lkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzX2dyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19ncm91cC5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXNfZ3JvdXAuY2hhbm5lbFRpdGxlXHJcbiAgICAgICAgICAgICAgICAgICAgfTsgIFxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQgPSB0aGlzX2dyb3VwLmlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKSBncm91cF9pZCA9IHRoaXNfZ3JvdXAuaWRfc3RyO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkcm9wZG93bi5wdXNoKHsnaWQnOmdyb3VwX2lkLCAnbmFtZSc6dGhpc19ncm91cC5uYW1lLCAnZGF0YSc6dGhpc19ncm91cH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoKCB0aGlzLmZlZWQuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaXN0cyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfYm9hcmQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPSAnWW91IGRvIG5vdCBoYXZlIGJvYXJkcyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlcyc6XHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlc19vbmx5JzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9J1lvdSBkbyBub3QgaGF2ZSBwYWdlcyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbl9jb21wYW5pZXMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBkbyBub3QgZm9sbG93IGFueSBjb21wYW55IHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlTdWJzY3JpcHRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBoYXZlblxcJ3QgYWRkZWQgYW55IHN1YnNjcmlwdGlvbnMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYl9saWtlcyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAoJ1lvdSBoYXZlblxcJ3QgbGlrZWQgYW55IHBhZ2VzIHlldC4nKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGFyZSBub3QgYSBtZW1iZXIgb2YgYW55IGdyb3Vwcy4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyAnY291bnQnOmRyb3Bkb3duLmxlbmd0aCwgJ2RhdGEnOmRyb3Bkb3duLCAncGxhY2Vob2xkZXInOiBwbGFjZWhvbGRlcn07XHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNldF9kZWZhdWx0X2dyb3VwX2lkID0gZnVuY3Rpb24gKCBzZWxfb2JqIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICRfdGhpcyA9IHNlbF9vYmo7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJF90aGlzLmRhdGEuaWQ7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkZWxtLmRhdGEoJ2RhdGEnKS5pZF9zdHI7XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLmlkID09ICdsaXN0cycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZS5saXN0cy5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDsgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dGluZyBvZiBkZWZhdWx0IGdyb3VwIGlkXHJcbiAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLnVwZGF0ZUZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCB0cnVlICk7XHJcblxyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC51cGRhdGVJbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoIHVwZGF0ZUZlZWROb3RpZmljYXRpb24sIDUqNjAqMTAwMCwgc2VsZi5mZWVkICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Ugc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ3NldERlZmF1bHRHcm91cElkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIC8vZGVmYXVsdEdyb3VwSWQ6ICQoIHRoaXMgKS5kYXRhKCdkYXRhJykuaWQsXHJcbiAgICAgICAgICAgIGRlZmF1bHRHcm91cElkOiBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCxcclxuICAgICAgICAgICAgbmV0d29yazogc2VsZi5mZWVkLm5ldHdvcmtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6IFwiZmVlZC9kZWZhdWx0R3JvdXBJZFwiLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCAnc2V0dGluZyBzZXREZWZhdWx0R3JvdXBJZDogJyArIGdyb3VwX2lkIClcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qdmFyIGRhdGEgPSBKU09OLnBhcnNlKCByZXNwICk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCAnc2V0IHJlc3BvbnNlOicgKVxyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggZGF0YSApKi9cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBzZWxfb2JqIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICRfdGhpcyA9IHNlbF9vYmo7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJF90aGlzLmRhdGEuaWQ7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkZWxtLmRhdGEoJ2RhdGEnKS5pZF9zdHI7XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLmlkID09ICdsaXN0cycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZS5saXN0cy5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDsgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dGluZyBvZiBkZWZhdWx0IGdyb3VwIGlkXHJcbiAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLnVwZGF0ZUZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCB0cnVlICk7XHJcblxyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC51cGRhdGVJbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoIHVwZGF0ZUZlZWROb3RpZmljYXRpb24sIDUqNjAqMTAwMCwgc2VsZi5mZWVkICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Ugc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7IHR5cGU6ICdHRVQnIH0sXHJcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cElkOiAkX3RoaXMuZGF0YS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dDogc2VsZi5uZXh0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXF1ZXN0LnVybCA9ICdmZWVkL2ZiR3JvdXAnO1xyXG5cclxuICAgICAgICByZXF1ZXN0LmRhdGEgPSBkYXRhO1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcCxcclxuICAgICAgICAgICAgICAgIGl0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdsaW5rZWRpbicgKSBzZWxmLm5leHQgPSAyNTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS52YWx1ZXMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdsaW5rZWRpbicpIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGRhdGEudmFsdWVzWyAwIF0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBtID0gZGF0YS52YWx1ZXMubGVuZ3RoOyBqIDwgbTsgaisrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc192YWwgPSBkYXRhLnZhbHVlc1sgaiBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VtbWFyeSA9IHRoaXNfdmFsLnN1bW1hcnkgfHwgJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZV9zdW1tYXJ5ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpc192YWwudXBkYXRlQ29udGVudCAhPT0gdW5kZWZpbmVkICYmIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZSAhPT0gdW5kZWZpbmVkICYmIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZS5jb250ZW50ICE9PSB1bmRlZmluZWQpIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gdGhpc192YWwudXBkYXRlQ29udGVudC5jdXJyZW50VXBkYXRlLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGNvbnRlbnQudGl0bGUgIT09IHVuZGVmaW5lZCAmJiBjb250ZW50LnN1Ym1pdHRlZFVybCAhPT0gdW5kZWZpbmVkICYmICEoL1xcLihqcGd8anBlZ3xwbmd8Ym1wfHRpZmZ8YXZpfG1wZWd8bWt2fG9nZ3xtb3Z8bXBlZ3xtcGd8bXBlfGZsdnwzZ3B8Z2lmKSQvaSkudGVzdChjb250ZW50LnRpdGxlKSApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeSA9ICc8YSBocmVmPVwiamF2YXNjcmlwdDo7XCIgb25DbGljaz1cIkVDLlVJLklBQihcXCcnICsgY29udGVudC5zdWJtaXR0ZWRVcmwgKyAnXFwnKTtcIj4nICsgY29udGVudC50aXRsZSArICc8L2E+ICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZGF0YVsgaiBdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc192YWwuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnPHA+PHNwYW4gY2xhc3M9XCJsbi1ncm91cC10aXRsZVwiPicgKyB0aGlzX3ZhbC50aXRsZSArICc6PC9zcGFuPjwvcD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeTogcHJlX3N1bW1hcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHN1bW1hcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21OYW1lOiAoIHRoaXNfdmFsLmNyZWF0b3IuZmlyc3ROYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3ByaXZhdGUnID8gdGhpc192YWwuY3JlYXRvci5maXJzdE5hbWUgOiB0aGlzX3ZhbC5jcmVhdG9yLmZpcnN0TmFtZSArICcgJyArIHRoaXNfdmFsLmNyZWF0b3IubGFzdE5hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpYzogdGhpc192YWwuY3JlYXRvci5waWN0dXJlVXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVUaW1lOiBwYXJzZUludCggdGhpc192YWwuY3JlYXRpb25UaW1lc3RhbXAgKSAvIDEwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21JZDogdGhpc192YWwuY3JlYXRvci5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiB0aGlzX3ZhbC5jb21tZW50cy5fdG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50OiB0aGlzX3ZhbC5jb21tZW50cy52YWx1ZXMgfHwgW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlrZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiB0aGlzX3ZhbC5saWtlcy5fdG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaWtlOiAoIHRoaXNfdmFsLmxpa2VzLnZhbHVlcyA9PT0gdW5kZWZpbmVkID8gW10gOiB0aGlzX3ZhbC5saWtlcy52YWx1ZXMuY3JlYXRvciApIHx8IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc2hpcDogdGhpc192YWwucmVsYXRpb25Ub1ZpZXdlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcl9saWtlczogdGhpc192YWwucmVsYXRpb25Ub1ZpZXdlci5pc0xpa2VkIHx8IFwiZmFsc2VcIlxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gMjU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YS5uZXh0VG9rZW47XHJcbiAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBkYXRhLmRhdGEuaXRlbXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKSBzZWxmLm5leHQgPSBkYXRhLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdwaW50ZXJlc3QnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT09ICdGQUlMJyB8fCAoIGRhdGEuZGF0YS5zdGF0dXMgJiYgZGF0YS5kYXRhLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnICkgKSBkYXRhLmRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSBkYXRhLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHBhZ2UgJiYgcGFnZS5jdXJzb3IgKSBzZWxmLm5leHQgPSBwYWdlLmN1cnNvcjtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBkYXRhLmRhdGEuZGF0YTsgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IGRhdGEucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5kYXRhICkgKSBpdGVtcyA9IFsgZGF0YS5kYXRhIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpdGVtcyA9IGRhdGEuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zLmxlbmd0aCA+IDAgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJykgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gaXRlbXNbIDAgXS5pZF9zdHI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ2xpbmtlZGluJyApIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ2dvb2dsZXBsdXMnICkgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gaXRlbXNbIDAgXS5wb3N0SUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3X2dyb3VwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGl0ZW1zWyBpIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogaXRlbXNbIGkgXS51c2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGl0ZW1zWyBpIF0uY3JlYXRlZF9hdCApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYXZvcml0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGl0ZW1zWyBpIF0uZmF2b3JpdGVfY291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5X21lOiBpdGVtc1sgaSBdLmZhdm9yaXRlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0d2VldHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGl0ZW1zWyBpIF0ucmV0d2VldF9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnlfbWU6IGl0ZW1zWyBpIF0ucmV0d2VldGVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogKCAoIGl0ZW1zWyBpIF0ucmV0d2VldGVkX3N0YXR1cyAhPT0gdW5kZWZpbmVkICkgPyBpdGVtc1sgaSBdLnJldHdlZXRlZF9zdGF0dXMuaWRfc3RyIDogaXRlbXNbIGkgXS5pZF9zdHIgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogaXRlbXNbIGkgXS50ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21OYW1lOiAoIGl0ZW1zWyBpIF0ubmFtZSB8fCBpdGVtc1sgaSBdLnVzZXIubmFtZSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiAoIGl0ZW1zWyBpIF0uc2NyZWVuX25hbWUgfHwgaXRlbXNbIGkgXS51c2VyLnNjcmVlbl9uYW1lICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpYzogKCBpdGVtc1sgaSBdLnByb2ZpbGVfaW1hZ2VfdXJsIHx8IGl0ZW1zWyBpIF0udXNlci5wcm9maWxlX2ltYWdlX3VybCApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RJRDogaXRlbXNbIGkgXS5pZF9zdHIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGl0ZW1zWyBpIF0uaWRfc3RyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd19kYXRhOiBpdGVtc1sgaSBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggaXRlbXNbIGkgXS5lbnRpdGllcyAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zWyBpIF0uZW50aXRpZXMubWVkaWEgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBpdGVtc1sgaSBdLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCApIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0gc2VsZi5nZXRfbWVkaWFfZGF0YSggaXRlbXNbIGkgXS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLmlkID09ICdsbl9jb21wYW5pZXMnICkgbmV3X2dyb3VwID0gbmV3IExpbmtlZGluRmVlZEl0ZW0oIGl0ZW1zWyBpIF0sIHNlbGYuZmVlZCApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0gc2VsZi5mZWVkLmZvcm1hdF9pdGVtKCBpdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHNlbGYuZmVlZC5mb3JtYXRfaXRlbSggaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAncGludGVyZXN0JyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSBzZWxmLmZlZWQuZm9ybWF0X2l0ZW0oIGl0ZW1zWyBpIF0gKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggaXRlbXNbIGkgXSwgc2VsZi5mZWVkICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWQuaXRlbXMucHVzaCggbmV3X2dyb3VwICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9tZWRpYV9kYXRhID0gZnVuY3Rpb24gKCBtZWRpYV91cmxzIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IFtdO1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtZWRpYV91cmxzLCBmdW5jdGlvbihtZWRpYV91cmwpe1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgIHNyYzogbWVkaWFfdXJsXHJcbiAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIFNvY2lhbDtcclxufV07XHJcblxyXG5cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnaW9uaWNBcHAuY29uc3RhbnRzJyxbXSkgIFxyXG4gIC5jb25zdGFudCgnYXBpVXJsJywgJ2h0dHBzOi8vZWNsaW5jaGVyLmNvbS9zZXJ2aWNlLycpXHJcbiAgLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHsgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyB9KTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdpb25pY0FwcC5jb250cm9sbGVycycsIFtdKVxyXG5cclxuLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkaW9uaWNMb2FkaW5nLCBBdXRoU2VydmljZSkge1xyXG5cclxuICAgICRzY29wZS5kYXRhID0ge307XHJcbiAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgLy8kc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG5cclxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coe1xyXG4gICAgICAgICAgICBub0JhY2tkcm9wOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICB2YXIgYSA9IEF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS5kYXRhLnVzZXJuYW1lLCAkc2NvcGUuZGF0YS5wYXNzd29yZCwgZnVuY3Rpb24ocmVzcCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnWlpaOicgKyByZXNwKTtcclxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbn0pXHJcblxyXG5cclxuLmNvbnRyb2xsZXIoJ0hvbWVUYWJDdHJsJywgZnVuY3Rpb24oJHN0YXRlLCAkc2NvcGUsICRyb290U2NvcGUsIEVDLCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJHVybFJvdXRlciwgXykge1xyXG5cclxuXHJcbiAgICBjb25zb2xlLmxvZygnQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBISEhISEjIyMjIycpO1xyXG4gICAgXHJcbiAgICBpZiggJHJvb3RTY29wZS5zb2NpYWwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgY29uc29sZS5sb2coJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIpO1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmVudGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdob21lJykpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuXHJcbiAgICAkc2NvcGUuZ3JvdXBzID0gW107XHJcbiAgICAkc2NvcGUuYWNjX3R5cGVzID0gW107XHJcblxyXG4gICAgaWYoIGFjY291bnRNYW5hZ2VyLmlzX3JlbmRlcmVkKCApIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnb29vb29vb29vb29vJyk7XHJcbiAgICAgICAgcHJlcGFyZUFjY291bnRzKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ25ubm5ubm5ubm5ubicpO1xyXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7bm9CYWNrZHJvcDogdHJ1ZX0pO1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmluaXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICBwcmVwYXJlQWNjb3VudHMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwcmVwYXJlQWNjb3VudHMoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBBQ0NTID0gYWNjb3VudE1hbmFnZXIubGlzdF9hY2NvdW50cygpO1xyXG5cclxuICAgICAgICB2YXIgdGVtcCA9IFtdLFxyXG4gICAgICAgICAgICBhY2NfdHlwZXMgPSBbXTtcclxuXHJcbiAgICAgICAgQUNDUy5mb3JFYWNoKGZ1bmN0aW9uKGFjY291bnQsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGVtcFt0eXBlXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdID0gW107XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdLnByb2ZpbGVzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9lbHNlXHJcbiAgICAgICAgICAgIC8ve1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjY291bnQucHJvZmlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChhY2NvdW50LnByb2ZpbGVzW2ldLm1vbml0b3JlZCA9PSAnb2ZmJykgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXS5wcm9maWxlcy5wdXNoKGFjY291bnQucHJvZmlsZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgdGVtcFt0eXBlXS50eXBlID0gdHlwZTtcclxuICAgICAgICAgICAgaWYgKGFjY190eXBlcy5pbmRleE9mKHR5cGUpID09PSAtMSkgYWNjX3R5cGVzLnB1c2godHlwZSk7XHJcblxyXG4gICAgICAgICAgICAvL3RlbXBbdHlwZV0ucHVzaCggeyd0eXBlJzp0eXBlLCAncHJvZmlsZXMnOmFjY291bnQucHJvZmlsZXN9ICk7XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZW1wKTtcclxuICAgICAgICAkc2NvcGUuZ3JvdXBzID0gdGVtcDtcclxuICAgICAgICAkc2NvcGUuYWNjX3R5cGVzID0gYWNjX3R5cGVzO1xyXG5cclxuICAgICAgICBhY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIHRydWUgKTtcclxuXHJcbiAgICAgICAgJHNjb3BlLm9wZW5GZWVkcyA9IGZ1bmN0aW9uKCBwcm9maWxlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2ZpbGUpO1xyXG4gICAgICAgICAgICBwcm9maWxlLnNvY2lhbC5yZW5kZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAkc2NvcGUuZ25zID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldCgndGFicy5yYW0tbmV3Jyk7XHJcblxyXG4gICAgICAgICAgaWYoZ2V0RXhpc3RpbmdTdGF0ZSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybjsgXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgIFwidXJsXCI6ICcvcmFtLW5ldycsXHJcbiAgICAgICAgICAgICAgXCJ2aWV3c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAnaG9tZS10YWInOiB7XHJcbiAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9yYW0uaHRtbFwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICRzdGF0ZVByb3ZpZGVyUmVmLnN0YXRlKCd0YWJzLnJhbS1uZXcnLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICAgICAgICAkdXJsUm91dGVyLmxpc3RlbigpO1xyXG5cclxuICAgICAgICAgICRzdGF0ZS5nbygndGFicy5yYW0tbmV3Jyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhnZXRFeGlzdGluZ1N0YXRlKTtcclxuICAgICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ01hbmFnZUFjY291bnRzJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsIEVDLCAkcm9vdFNjb3BlLCAkaW9uaWNIaXN0b3J5LCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJGxvY2FsU3RvcmFnZSkge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCJyk7XHJcbiAgICBjb25zb2xlLmxvZygnJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MnKTtcclxuICAgIGNvbnNvbGUubG9nKCRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzKTtcclxuICAgIC8vY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIudGVzdCgpKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ2hvbWUnKSk7XHJcblxyXG4gICAgJHNjb3BlLmFjY291bnRzID0gYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyggJHNjb3BlLmFjY291bnRzICk7XHJcblxyXG4gICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgIHZpZXdEYXRhLmhhc0hlYWRlckJhciA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLmFkZF9hY2NvdW50ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmFkZF9hY2NvdW50KHR5cGUpO1xyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuY3N0ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5hY2NvdW50cyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKSk7XHJcbiAgICAgICAgLy9hY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIGZhbHNlICk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ0ZlZWRzJywgZnVuY3Rpb24oJHNjb3BlLCAgJGlvbmljU2Nyb2xsRGVsZWdhdGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCBFQywgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQyEhISEhIyMjIyMnKTtcclxuICAgIC8vY29uc29sZS5sb2coJyRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzJyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyKTtcclxuICAgIC8vY29uc29sZS5sb2coJHN0YXRlLmN1cnJlbnQubmFtZSk7XHJcbiAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlRGF0YUNhbkJlTG9hZGVkID0gZmFsc2U7XHJcbiAgICAkc2NvcGUuY291bnRlciA9IDA7XHJcblxyXG4gICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiAkc3RhdGUuY3VycmVudC5uYW1lfSk7XHJcbiAgICAkc2NvcGUuZmVlZCA9ICRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB2YXIgbmV4dF9wYWdlX2luZGV4ID0gMCxcclxuICAgICAgICBwcmV2X3BhZ2VfaW5kZXggPSAwLFxyXG4gICAgICAgIG5vX29mX3BhZ2VzID0gJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIubGVuZ3RoO1xyXG5cclxuICAgIGlmKCBpbmRleCA9PT0gMCApXHJcbiAgICB7XHJcbiAgICAgICAgbmV4dF9wYWdlX2luZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYoIGluZGV4ID09IChub19vZl9wYWdlcyAtIDEpIClcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSAwO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMjtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gaW5kZXggLSAxO1xyXG4gICAgfVxyXG5cclxuICAgICRzY29wZS5uZXh0X3BhZ2VfaWQgPSAkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcltuZXh0X3BhZ2VfaW5kZXhdLnBhZ2VfaWQ7XHJcbiAgICAkc2NvcGUucHJldl9wYWdlX2lkID0gJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXJbcHJldl9wYWdlX2luZGV4XS5wYWdlX2lkO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGluZGV4KTtcclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLnRlc3RfbmFtZSA9IFtdO1xyXG4gICAgJHNjb3BlLnRlc3RfbmFtZS5wdXNoKHsnbmFtZSc6J1JhbSd9KTtcclxuICAgICRzY29wZS5nZXRTY3JvbGxQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgnbWFpblNjcm9sbCcpLmdldFNjcm9sbFBvc2l0aW9uKCkgICk7XHJcbiAgICAgICAgLyokcm9vdFNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW2luZGV4XS5pdGVtc1swXS5wcm9maWxlLnVzZXJuYW1lID0gJ0pKSkpKSkpKSkpKSkpKSic7XHJcbiAgICAgICAgICAgIC8vJHNjb3BlLmZlZWQuaXRlbXNbMF0ucHJvZmlsZS51c2VybmFtZSA9ICdKSkpKSkpKSkpKSkpKSkonO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuZmVlZCk7XHJcbiAgICAgICAgfSk7Ki9cclxuICAgICAgICAvLyRzY29wZS50ZXN0X25hbWVbMF0ubmFtZSA9ICdLS0tLS0tLS0snO1xyXG4gICAgICAgIC8vJHNjb3BlLmZlZWQuaXRlbXNbMF0uZGF0YS5mcm9tTmFtZSA9ICdKSkpKSkpKSkpKSkpKSkonO1xyXG5cclxuICAgICAgICAvLyRyb290U2NvcGUuJGRpZ2VzdCgpO1xyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCd3YXRjaGVyc1dpdGhvdXREdXBsaWNhdGVzLmxlbmd0aDo6Oicrd2F0Y2hlcnNXaXRob3V0RHVwbGljYXRlcy5sZW5ndGgpO1xyXG4gICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAkc2NvcGUuZmVlZC5kZCA9IHsgJ2NvdW50JzowLCAnZGF0YSc6W10sICdwbGFjZWhvbGRlcic6ICcnfTtcclxuICAgICRzY29wZS5zZWxlY3RlZF9kZCA9IHt9O1xyXG5cclxuICAgICRzY29wZS4kd2F0Y2goJ2ZlZWQuZHJvcGRvd25fZmVlZCcsIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICBpZiggJHNjb3BlLmZlZWQuZHJvcGRvd25fZmVlZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTU1NTU1NTU1NTU1NTU1NTU0nKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqKTtcclxuICAgICAgICAgICAgJHNjb3BlLmZlZWQuZGQgPSAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouZ2V0X2Ryb3Bkb3duKCk7XHJcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAkc2NvcGUubW9yZWRhdGEgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZmVlZC5pdGVtcycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5pdGVtcy5sZW5ndGggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0pKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKJyk7XHJcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoKCdmZWVkLmxvYWRfbW9yZV9mbGFnJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoICEkc2NvcGUuZmVlZC5sb2FkX21vcmVfZmxhZyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAkc2NvcGUubW9yZWRhdGEgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlZGF0YSA9IGZhbHNlO1xyXG5cclxuICAgICRzY29wZS5sb2FkTW9yZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYgKCAhICRzY29wZS5mZWVkLml0ZW1zLmxlbmd0aCAmJiAhICRzY29wZS5jb3VudGVyIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgICRzY29wZS5mZWVkLmxhc3RfbG9hZGVkX3RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAkc2NvcGUuZmVlZC5nZXRfZGF0YSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAkc2NvcGUuZmVlZC5tb3JlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkc2NvcGUuY291bnRlcisrOyAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAkc2NvcGUucHJvY2Vzc0REID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5zZWxlY3RlZF9kZCk7XHJcbiAgICAgICAgJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLnNldF9kZWZhdWx0X2dyb3VwX2lkKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouZ2V0X2RhdGEoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLiRvbihcIiRpb25pY1ZpZXcuZW50ZXJcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGRlbGVnYXRlID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCdtYWluU2Nyb2xsJyk7XHJcbiAgICAgICAgLy9kZWxlZ2F0ZS5zY3JvbGxUbyggMCwgJHNjb3BlLmZlZWQubGFzdF9zY3JvbGxfcG9zaXRpb24gKTtcclxuICAgICAgICAkc2NvcGUuJHBhcmVudC4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdmZWVkJykpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJHNjb3BlLiRvbihcIiRpb25pY1ZpZXcuYmVmb3JlTGVhdmVcIiwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gJGlvbmljU2Nyb2xsRGVsZWdhdGUuJGdldEJ5SGFuZGxlKCdtYWluU2Nyb2xsJykuZ2V0U2Nyb2xsUG9zaXRpb24oKTtcclxuICAgICAgICAkc2NvcGUuZmVlZC5sYXN0X3Njcm9sbF9wb3NpdGlvbiA9IHBvc2l0aW9uLnRvcDtcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG5cclxuICAgIFxyXG5cclxuICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlRW50ZXInLCBmdW5jdGlvbihldmVudCwgdmlld0RhdGEpIHtcclxuICAgICAgICB2aWV3RGF0YS5lbmFibGVCYWNrID0gdHJ1ZTtcclxuICAgICAgICB2aWV3RGF0YS5oYXNIZWFkZXJCYXIgPSB0cnVlO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHZpZXdEYXRhKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBidiA9ICRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKTtcclxuXHJcbiAgICAkc2NvcGUuJGlvbmljR29CYWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0tLS0tLJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYnYpO1xyXG5cclxuICAgICAgICBpZiAoYnYpIHtcclxuICAgICAgICAgICAgJGlvbmljSGlzdG9yeS5nb0JhY2soKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIFxyXG5cclxuXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ1B1Ymxpc2hpbmcnLCBmdW5jdGlvbigkc2NvcGUsIEVDLCBhY2NvdW50TWFuYWdlcikge1xyXG5cclxuICAgIFxyXG5cclxuICAgJHNjb3BlLiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ3B1Ymxpc2hpbmcnKSk7XHJcblxyXG4gICAgXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ1Bvc3RTZXR0aW5ncycsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkaW9uaWNIaXN0b3J5LCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlcikge1xyXG5cclxuICAgICAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUVudGVyJywgZnVuY3Rpb24oZXZlbnQsIHZpZXdEYXRhKSB7XHJcbiAgICAgICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyh2aWV3RGF0YSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBidiA9ICRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKTtcclxuXHJcbiAgICAgICAgJHNjb3BlLiRpb25pY0dvQmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYnYpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGJ2KSB7XHJcbiAgICAgICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLmxpc3QnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgIH0pXHJcbiAgICAuY29udHJvbGxlcignQnV0dG9uc1RhYkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwpIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLnNob3dQb3B1cCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkaW9uaWNQb3B1cC5hbGVydCh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ1BvcHVwJyxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdUaGlzIGlzIGlvbmljIHBvcHVwIGFsZXJ0ISdcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICAkc2NvcGUuc2hvd0FjdGlvbnNoZWV0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY0FjdGlvblNoZWV0LnNob3coe1xyXG4gICAgICAgICAgICAgICAgdGl0bGVUZXh0OiAnSW9uaWMgQWN0aW9uU2hlZXQnLFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uczogW3tcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnRmFjZWJvb2snXHJcbiAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1R3aXR0ZXInXHJcbiAgICAgICAgICAgICAgICB9LCBdLFxyXG4gICAgICAgICAgICAgICAgZGVzdHJ1Y3RpdmVUZXh0OiAnRGVsZXRlJyxcclxuICAgICAgICAgICAgICAgIGNhbmNlbFRleHQ6ICdDYW5jZWwnLFxyXG4gICAgICAgICAgICAgICAgY2FuY2VsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQ0FOQ0VMTEVEJyk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYnV0dG9uQ2xpY2tlZDogZnVuY3Rpb24oaW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQlVUVE9OIENMSUNLRUQnLCBpbmRleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZGVzdHJ1Y3RpdmVCdXR0b25DbGlja2VkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnREVTVFJVQ1QnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgIH0pXHJcblxyXG4uY29udHJvbGxlcignU2xpZGVib3hDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkaW9uaWNTbGlkZUJveERlbGVnYXRlKSB7XHJcbiAgICAkc2NvcGUubmV4dFNsaWRlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgJGlvbmljU2xpZGVCb3hEZWxlZ2F0ZS5uZXh0KCk7XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ01lbnVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkcm9vdFNjb3BlLCAkaW9uaWNTaWRlTWVudURlbGVnYXRlLCAkaW9uaWNNb2RhbCkge1xyXG5cclxuXHJcbiAgICAkc2NvcGUudXBkYXRlU2lkZU1lbnUgPSBmdW5jdGlvbihtZW51KSB7XHJcbiAgICAgICAgY29uc29sZS5sb2cobWVudSk7XHJcbiAgICAgICAgJHNjb3BlLm1lbnVJdGVtcyA9IG1lbnU7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgJGlvbmljTW9kYWwuZnJvbVRlbXBsYXRlVXJsKCd0ZW1wbGF0ZXMvbW9kYWwuaHRtbCcsIGZ1bmN0aW9uKG1vZGFsKSB7XHJcbiAgICAgICAgJHNjb3BlLm1vZGFsID0gbW9kYWw7XHJcbiAgICB9LCB7XHJcbiAgICAgICAgYW5pbWF0aW9uOiAnc2xpZGUtaW4tdXAnXHJcbiAgICB9KTtcclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdBcHBDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRyb290U2NvcGUpIHtcclxuXHJcbiAgICAkcm9vdFNjb3BlLm1lbnVJdGVtcyA9IFtdO1xyXG5cclxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnaW9uaWNBcHAuZGlyZWN0aXZlcycsIFtdKVxyXG5cclxuLmRpcmVjdGl2ZSgncG9zaXRpb25CYXJzQW5kQ29udGVudCcsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XHJcblxyXG4gcmV0dXJuIHtcclxuICAgIFxyXG4gICAgcmVzdHJpY3Q6ICdBQycsXHJcblxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgb2Zmc2V0VG9wID0gMDtcclxuICAgICAgXHJcbiAgICAgIFxyXG4gICAgICBcclxuXHJcbiAgICAgIC8vIEdldCB0aGUgcGFyZW50IG5vZGUgb2YgdGhlIGlvbi1jb250ZW50XHJcbiAgICAgIHZhciBwYXJlbnQgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudFswXS5wYXJlbnROb2RlKTtcclxuXHJcbiAgICAgIHZhciBtX2hlYWRlciA9ICBwYXJlbnRbMF0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYmFyLWhlYWRlcicpO1xyXG5cclxuICAgICAgLy8gR2V0IGFsbCB0aGUgaGVhZGVycyBpbiB0aGlzIHBhcmVudFxyXG4gICAgICB2YXIgc19oZWFkZXJzID0gcGFyZW50WzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2Jhci1zdWJoZWFkZXInKTtcclxuXHJcbiAgICAgIGlmKCBtX2hlYWRlci5sZW5ndGggKVxyXG4gICAgICB7XHJcbiAgICAgICAgb2Zmc2V0VG9wID0gbV9oZWFkZXJbMF0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIHRoZSBoZWFkZXJzXHJcbiAgICAgIGZvcih4PTA7eDxzX2hlYWRlcnMubGVuZ3RoO3grKylcclxuICAgICAge1xyXG4gICAgICAgIC8vIElmIHRoaXMgaXMgbm90IHRoZSBtYWluIGhlYWRlciBvciBuYXYtYmFyLCBhZGp1c3QgaXRzIHBvc2l0aW9uIHRvIGJlIGJlbG93IHRoZSBwcmV2aW91cyBoZWFkZXJcclxuICAgICAgICBpZih4ID49IDApIHtcclxuICAgICAgICAgIHNfaGVhZGVyc1t4XS5zdHlsZS50b3AgPSBvZmZzZXRUb3AgKyAncHgnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgdXAgdGhlIGhlaWdodHMgb2YgYWxsIHRoZSBoZWFkZXIgYmFyc1xyXG4gICAgICAgIG9mZnNldFRvcCA9IG9mZnNldFRvcCArIHNfaGVhZGVyc1t4XS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgIH0gICAgICBcclxuICAgICAgXHJcbiAgICAgIC8vIFBvc2l0aW9uIHRoZSBpb24tY29udGVudCBlbGVtZW50IGRpcmVjdGx5IGJlbG93IGFsbCB0aGUgaGVhZGVyc1xyXG4gICAgICBlbGVtZW50WzBdLnN0eWxlLnRvcCA9IG9mZnNldFRvcCArICdweCc7XHJcbiAgICAgIFxyXG4gICAgfVxyXG4gIH07ICBcclxufSlcclxuXHJcbi5kaXJlY3RpdmUoJ2hpZGVUYWJzJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSwgJGVsKSB7XHJcbiAgICAgICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzID0gJ3RhYnMtaXRlbS1oaWRlJztcclxuICAgICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgJHJvb3RTY29wZS5oaWRlVGFicyA9ICcnO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlQWNjb3VudCcsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGFjY291bnQ6ICc9YWNjb3VudCdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtYWNjb3VudC5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUuY3YgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgICAgICBhbGVydCg1NSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgb2JqLnJlZnJlc2hBY2NvdW50KCk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLmRlbGV0ZUFjY291bnQgPSBmdW5jdGlvbiggb2JqICl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9iaik7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlUHJvZmlsZScsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIHByb2ZpbGU6ICc9cHJvZmlsZSdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtcHJvZmlsZS5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUudmFsaWRhdGVDaGVjayA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIC8vb2JqLm5ld19rZXkgPSAnZnJvbSBkaXJlY3RpdmUnO1xyXG4gICAgICAgICAgICAvL2FsZXJ0KG9iai5nZXRVc2VyTmFtZSgpKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgICAgb2JqLnVwZGF0ZV9tb25pdG9yKG9iai5wcm9maWxlX2NoZWNrZWQpO1xyXG4gICAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnZmVlZEl0ZW0nLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBpdGVtOiAnPWl0ZW0nXHJcbiAgICAgIH0sXHJcbiAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvZmVlZC1pdGVtLmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS5jdiA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIGFsZXJ0KDU1KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5kZWxldGVBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJHN0YXRlUHJvdmlkZXInLCAnJHVybFJvdXRlclByb3ZpZGVyJywnJGlvbmljQ29uZmlnUHJvdmlkZXInLCBcclxuXHRmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGlvbmljQ29uZmlnUHJvdmlkZXIpIHtcclxuXHJcblx0XHQgICRzdGF0ZVByb3ZpZGVyXHJcblx0XHQgICAgICAuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9sb2dpbi5odG1sXCIsXHJcblx0XHQgICAgICAgIGNvbnRyb2xsZXI6IFwiTG9naW5DdHJsXCJcclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvbWVudVwiLFxyXG5cdFx0ICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdCAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21lbnUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICBjb250cm9sbGVyOiAnTWVudUN0cmwnXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaG9tZScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9ob21lXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2hvbWUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ0hvbWVUYWJDdHJsJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5tYW5hZ2VfYWNjb3VudHMnLCB7XHJcblx0XHQgICAgICBcdHVybDogXCIvbWFuYWdlX2FjY291bnRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21hbmFnZV9hY2NvdW50cy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnTWFuYWdlQWNjb3VudHMnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLnB1Ymxpc2hpbmcnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvcHVibGlzaGluZ1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdwdWJsaXNoaW5nLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9wdWJsaXNoLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQdWJsaXNoaW5nJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5wb3N0X3NldHRpbmdzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3Bvc3Rfc2V0dGluZ3NcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAncHVibGlzaGluZy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcG9zdF9zZXR0aW5ncy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnUG9zdFNldHRpbmdzJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pbmJveCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9pbmJveFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdpbmJveC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaW5ib3guaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmZlZWRzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2ZlZWRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2ZlZWRzLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9mZWVkcy5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICBcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pdGVtJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2l0ZW1cIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbGlzdC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaXRlbS5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuZm9ybScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9mb3JtXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2Zvcm0tdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Zvcm0uaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmtleWJvYXJkJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2tleWJvYXJkXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2tleWJvYXJkLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC8qLnN0YXRlKCdtZW51LmxvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2xvZ2luLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSkqL1xyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LnNsaWRlYm94Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3NsaWRlYm94XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3NsaWRlYm94Lmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTbGlkZWJveEN0cmwnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmFib3V0Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2Fib3V0XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Fib3V0Lmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSk7XHJcblxyXG5cdFx0ICAgIC8vJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcIm1lbnUvdGFiL2J1dHRvbnNcIik7XHJcblx0XHQgICAgLyppZiggJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEgKVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCIvaG9tZVwiKTtcclxuXHRcdCAgICB9XHJcblx0XHQgICAgZWxzZVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJsb2dpblwiKTtcclxuXHRcdCAgICB9Ki9cclxuXHRcdCAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwibG9naW5cIik7XHJcblxyXG5cclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci50YWJzLnBvc2l0aW9uKFwiYm90dG9tXCIpOyAvL1BsYWNlcyB0aGVtIGF0IHRoZSBib3R0b20gZm9yIGFsbCBPU1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLm5hdkJhci5hbGlnblRpdGxlKFwiY2VudGVyXCIpO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnRhYnMuc3R5bGUoXCJzdGFuZGFyZFwiKTtcclxuXHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MubWF4Q2FjaGUoMjApO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnZpZXdzLnRyYW5zaXRpb24oJ25vbmUnKTtcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci52aWV3cy5mb3J3YXJkQ2FjaGUodHJ1ZSk7XHJcblx0XHQgICAgXHJcblx0XHQgICAgJHN0YXRlUHJvdmlkZXJSZWYgPSAkc3RhdGVQcm92aWRlcjtcclxuICAgICAgXHRcdCR1cmxSb3V0ZXJQcm92aWRlclJlZiA9ICR1cmxSb3V0ZXJQcm92aWRlcjtcclxuXHRcdH1cclxuXTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdpb25pY0FwcC5zZXJ2aWNlcycsIFtdKVxyXG5cclxuLmZhY3RvcnkoJ0VDJywgRUNsaWIpXHJcblxyXG4vL3NlcnZpY2UgZm9yIGF1dGhlbnRpY2F0aW9uXHJcbi5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uKCRxLCAkaHR0cCwgYXBpVXJsLCBFQykge1xyXG5cclxuICAgIHZhciBpc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xyXG4gICAgdmFyIExPQ0FMX1RPS0VOX0tFWSA9ICd1c2VyX2NyZWRlbnRpYWxzJztcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFVzZXJDcmVkZW50aWFscygpIHtcclxuICAgICAgICB2YXIgdWMgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oTE9DQUxfVE9LRU5fS0VZKTtcclxuICAgICAgICBpZiAodWMpIHtcclxuICAgICAgICAgICAgdXNlQ3JlZGVudGlhbHModWMpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHN0b3JlVXNlckNyZWRlbnRpYWxzKHVjKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMX1RPS0VOX0tFWSwgdWMpO1xyXG4gICAgICAgIHVzZUNyZWRlbnRpYWxzKHVjKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1c2VDcmVkZW50aWFscyh1Yykge1xyXG4gICAgICAgIGlzQXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codWMpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSB1YyBhcyBoZWFkZXIgZm9yIHlvdXIgcmVxdWVzdHMhXHJcbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24udWlkID0gdWMudWlkO1xyXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLmF1dGhvcml6YXRpb25Ub2tlbiA9IHVjLmF1dGhvcml6YXRpb25Ub2tlbjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZXN0cm95VXNlckNyZWRlbnRpYWxzKCkge1xyXG4gICAgICAgIGlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24udWlkID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIC8vJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24uYXV0aG9yaXphdGlvblRva2VuID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShMT0NBTF9UT0tFTl9LRVkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsb2dpbiA9IGZ1bmN0aW9uKG5hbWUsIHBhc3N3b3JkLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICB2YXIgcmVxID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiBhcGlVcmwgKyAndXNlci9sb2dpbicsXHJcbiAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgICAgICdlbWFpbCc6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3Bhc3N3b3JkJzogcGFzc3dvcmRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdChyZXEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soJzIyMjInKTtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1lZWVlZWVlZWScpO1xyXG4gICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIC8vJGlvbmljSGlzdG9yeS5jdXJyZW50VmlldygkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCkpOy8vJGlvbmljSGlzdG9yeS5jdXJyZW50VmlldyhudWxsKTtcclxuICAgICAgICAgICAgICAgIC8vJHN0YXRlLmdvKCdhcHAuc2FmZXR5TGVzc29ucycpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbihlcnJfbXNnKSB7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdaWlpaWlpaWlonKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCczMzMzJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGxvZ291dCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGRlc3Ryb3lVc2VyQ3JlZGVudGlhbHMoKTtcclxuICAgIH07XHJcblxyXG4gICAgbG9hZFVzZXJDcmVkZW50aWFscygpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbG9naW46IGxvZ2luLFxyXG4gICAgICAgIGxvZ291dDogbG9nb3V0LFxyXG4gICAgICAgIGlzQXV0aGVudGljYXRlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0F1dGhlbnRpY2F0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0pXHJcblxyXG4uZmFjdG9yeSgnVXNlclNldHRpbmdzJywgcmVxdWlyZSgnLi9hcHAvc2V0dGluZ3MtbWFuYWdlcicpKSBcclxuXHJcbi5mYWN0b3J5KCdBY2NvdW50JywgcmVxdWlyZSgnLi9hcHAvYWNjb3VudCcpKSBcclxuXHJcbi5mYWN0b3J5KCdQcm9maWxlJywgcmVxdWlyZSgnLi9hcHAvcHJvZmlsZScpKSBcclxuXHJcbi5mYWN0b3J5KCdhY2NvdW50TWFuYWdlcicsIHJlcXVpcmUoJy4vYXBwL2FjY291bnQtbWFuYWdlcicpKSBcclxuXHJcbi5mYWN0b3J5KCdzb2NpYWxNYW5hZ2VyJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsLW1hbmFnZXInKSkgXHJcblxyXG4uZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCh7XHJcbiAgICAgICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWRcclxuICAgICAgICAgICAgfVtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbigkaHR0cFByb3ZpZGVyKSB7XHJcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdBdXRoSW50ZXJjZXB0b3InKTtcclxufSk7XHJcbiJdfQ==
