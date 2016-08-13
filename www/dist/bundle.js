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
              
              
},{"./app-main":1,"./constants":14,"./controllers":15,"./directives":16,"./router":17,"./services":18}],3:[function(require,module,exports){
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


module.exports = ['$http', '$state', '$rootScope', '$urlRouter', 'EC', 'apiUrl', 'FacebookFeed', '$injector', function($http, $state, $rootScope, $urlRouter, EC, apiUrl, FacebookFeed, $injector ){

    //var Feed = $injector.get('Feed');
    //var FeedItem = $injector.get('FeedItem');
    //var TimelineFeedItem = $injector.get('TimelineFeedItem');

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







},{}],10:[function(require,module,exports){
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







},{}],11:[function(require,module,exports){
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







},{}],12:[function(require,module,exports){
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







},{}],13:[function(require,module,exports){
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







},{}],14:[function(require,module,exports){
module.exports = angular.module('ionicApp.constants',[])  
  .constant('apiUrl', 'https://eclincher.com/service/')
  .constant('AUTH_EVENTS', {  notAuthenticated: 'auth-not-authenticated' });
},{}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){

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
},{}],18:[function(require,module,exports){
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

.factory('DropdownFeedItem', require('./app/social/dropdownFeedItem'))

.factory('CollapsibleFeedItem', require('./app/social/collapsibleFeedItem'))

.factory('FacebookFeed', require('./app/social/facebook'))

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

},{"./app/account":4,"./app/account-manager":3,"./app/profile":5,"./app/settings-manager":6,"./app/social-manager":7,"./app/social/FeedItem":8,"./app/social/collapsibleFeedItem":9,"./app/social/dropdownFeedItem":10,"./app/social/facebook":11,"./app/social/feed":12,"./app/social/timelineFeedItem":13}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3cvanMvYXBwLW1haW4uanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL2FwcC9hY2NvdW50LW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL2FjY291bnQuanMiLCJ3d3cvanMvYXBwL3Byb2ZpbGUuanMiLCJ3d3cvanMvYXBwL3NldHRpbmdzLW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9jb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZhY2Vib29rLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3RpbWVsaW5lRmVlZEl0ZW0uanMiLCJ3d3cvanMvY29uc3RhbnRzLmpzIiwid3d3L2pzL2NvbnRyb2xsZXJzLmpzIiwid3d3L2pzL2RpcmVjdGl2ZXMuanMiLCJ3d3cvanMvcm91dGVyLmpzIiwid3d3L2pzL3NlcnZpY2VzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4d0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0ZnVuY3Rpb24gQXBwTWFpbigkaW9uaWNQbGF0Zm9ybSwgJHJvb3RTY29wZSwgJHNjb3BlKSBcclxuXHR7XHJcblx0ICAkaW9uaWNQbGF0Zm9ybS5yZWFkeShmdW5jdGlvbigpIHtcclxuXHQgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxyXG5cdCAgICAvLyBmb3IgZm9ybSBpbnB1dHMpXHJcblx0ICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcclxuXHQgICAgICBjb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuaGlkZUtleWJvYXJkQWNjZXNzb3J5QmFyKHRydWUpO1xyXG5cdCAgICB9XHJcblx0ICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XHJcblx0ICAgICAgLy8gb3JnLmFwYWNoZS5jb3Jkb3ZhLnN0YXR1c2JhciByZXF1aXJlZFxyXG5cdCAgICAgIC8vU3RhdHVzQmFyLnN0eWxlTGlnaHRDb250ZW50KCk7XHJcblx0ICAgIH1cclxuICBcdCAgfSk7XHJcblxyXG5cdCAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQpe1xyXG5cdCAgXHQkcm9vdFNjb3BlLmN1cnJlbnRTY29wZSA9ICRzY29wZTtcclxuXHQgIH0pO1xyXG5cclxuICBcdCAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zLCBlcnJvcikge1xyXG5cdCAgIGlmICh0b1N0YXRlLm5hbWUgPT0gJ3RhYnMubWFuYWdlX2FjY291bnRzJykge1xyXG5cdCAgICAgJHJvb3RTY29wZS5oaWRlVGFicz10cnVlO1xyXG5cdCAgIH0gZWxzZSB7XHJcblx0ICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzPWZhbHNlO1xyXG5cdCAgIH1cclxuXHQgIH0pO1xyXG4gIFx0fVxyXG5cclxuICBcdG1vZHVsZS5leHBvcnRzID0gWyckaW9uaWNQbGF0Zm9ybScsICckcm9vdFNjb3BlJywgQXBwTWFpbl07IiwicmVxdWlyZSgnLi9jb25zdGFudHMnKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMnKTtcbnJlcXVpcmUoJy4vc2VydmljZXMnKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcycpO1xuXG52YXIgJHN0YXRlUHJvdmlkZXJSZWYgPSBudWxsO1xudmFyICR1cmxSb3V0ZXJQcm92aWRlclJlZiA9IG51bGw7XG5cbmFuZ3VsYXIubW9kdWxlKCdpb25pY0FwcCcsIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpb25pYycsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lvbmljQXBwLmNvbnN0YW50cycsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lvbmljQXBwLmNvbnRyb2xsZXJzJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW9uaWNBcHAuc2VydmljZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lvbmljQXBwLmRpcmVjdGl2ZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25nU3RvcmFnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndWkucm91dGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ0NvcmRvdmEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3VuZGVyc2NvcmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKVxuXG4uY29uZmlnKHJlcXVpcmUoJy4vcm91dGVyJykpXG5cbi5ydW4ocmVxdWlyZSgnLi9hcHAtbWFpbicpKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0FjY291bnQnLCAnVXNlclNldHRpbmdzJywgJyRjb3Jkb3ZhSW5BcHBCcm93c2VyJywgZnVuY3Rpb24oJGh0dHAsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEFjY291bnQsIFVzZXJTZXR0aW5ncywgJGNvcmRvdmFJbkFwcEJyb3dzZXIgKXsgIFxyXG5cclxuICAgIHZhciBpbml0aWFsaXplZCA9IGZhbHNlLFxyXG4gICAgICAgIGRhdGEgPSB7fSxcclxuICAgICAgICBhY2NvdW50cyA9IFtdLFxyXG4gICAgICAgIGFjY291bnRzX29yZGVyID0gW10sXHJcbiAgICAgICAgYWNjb3VudHNfYnlfaWQgPSB7fSxcclxuICAgICAgICBmYXZvcml0ZXNfYWNjb3VudCxcclxuICAgICAgICBzZWFyY2hfYWNjb3VudCxcclxuICAgICAgICByc3NfYWNjb3VudCxcclxuICAgICAgICBvdXRyZWFjaF9hY2NvdW50LFxyXG4gICAgICAgIGNpbmJveF9hY2NvdW50LFxyXG4gICAgICAgIGxhc3RfYWRkZWRfcHJvZmlsZSxcclxuICAgICAgICByZWZyZXNoX29uX2Nsb3NlID0gZmFsc2UsXHJcbiAgICAgICAgdGVtcGxhdGVfc2VsZWN0b3IgPSAnI2FjY291bnQtbWFuYWdlci10ZW1wbGF0ZSc7XHJcblxyXG4gICAgICAgIG1vZHVsZS5yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5nb19iYWNrX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5zZWFyY2hfcmVuZGVyZWQgPSBmYWxzZTtcclxuICAgICAgICBtb2R1bGUucnNzX3JlbmRlcmVkID0gZmFsc2U7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnYWNjb3VudE1hbmFnZXIgaW5pdCcpO1xyXG5cclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygkaHR0cCk7XHJcbiAgICAgICAgLy9yZXR1cm4gdGVtcGxhdGVfc2VsZWN0b3I7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9nZXQgYWNjb3VudHMgYW5kIHN0b3JlIGl0XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogYXBpVXJsICsgJ2FjY291bnQvYWNjb3VudHMnLFxyXG4gICAgICAgICAgICBkYXRhOnsnbmFtZSc6J3JhbSd9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKHN0b3JlX2FjY291bnRzLCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBzdG9yZV9hY2NvdW50cyAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZXNwb25zZTo6OicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFVzZXJTZXR0aW5ncyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlIHx8IFtdLFxyXG4gICAgICAgICAgICAgICAgaXRlbXMgPSBkYXRhLmFjY291bnQgfHwgW10sXHJcbiAgICAgICAgICAgICAgICBmYXZfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzcmNoX2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcnNzX2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgb3V0cmVhY2hfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBhY2Nfb3JkZXIgPSBkYXRhLmFjY291bnRfb3JkZXIgfHwgW107XHJcblxyXG4gICAgICAgICAgICBpZiggZGF0YS5zZXR0aW5ncyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgVXNlclNldHRpbmdzLmhhbmRsZV9zZXR0aW5ncyggZGF0YS5zZXR0aW5ncywgdW5kZWZpbmVkLCB0cnVlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5hbmFseXRpY3NfZ3JvdXBzID0gW107XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiggZGF0YS5hbmFseXRpY3NHcm91cHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgVXNlclNldHRpbmdzLmFuYWx5dGljc19ncm91cHMgPSBkYXRhLmFuYWx5dGljc0dyb3Vwcy5hbmFseXRpY3NHcm91cDtcclxuICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheSggaXRlbXMgKSApIGl0ZW1zID0gWyBpdGVtcyBdO1xyXG5cclxuICAgICAgICAgICAgYWNjb3VudHMgPSBbXTtcclxuICAgICAgICAgICAgYWNjb3VudHNfYnlfaWQgPSB7fTtcclxuICAgICAgICAgICAgYWNjb3VudHNfb3JkZXIgPSBhY2Nfb3JkZXI7XHJcblxyXG4gICAgICAgICAgICAvL0NyZWF0ZSBhY2NvdW50LW9iamVjdCBmb3IgZWFjaCBhY2NvdW50cyBhbmQgc3RvcmUgYnkgaWQgLlxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSBpdGVtcy5sZW5ndGg7IGkgPCBwOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19hY2NvdW50ID0gbmV3IEFjY291bnQoIGl0ZW1zWyBpIF0gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGFjY291bnRzLnB1c2goIG5ld19hY2NvdW50ICk7IC8vIGl0ZXJhYmxlXHJcblxyXG4gICAgICAgICAgICAgICAgYWNjb3VudHNfYnlfaWRbIG5ld19hY2NvdW50LmlkIF0gPSBhY2NvdW50c1sgbGVuZ3RoIC0gMSBdOyAvLyBpbmRleGVkIGJ5IGFjY291bnQgSUQsIHJlZmVyZW5jZXMgYWNjb3VudCBieSBpbmRleFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYWNjb3VudHM6OjonKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYWNjb3VudHMpO1xyXG4gICAgICAgICAgICAvL2lmIGNhbGxiYWNrIGlzIHZhbGlkIGZ1bmN0aW9uLCB0aGVuIGNhbGwgaXRcclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nIClcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSBcclxuICAgICAgICBcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUucmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUucmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2Zhdm9yaXRlX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLmZhdm9yaXRlX3JlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9mYXZvcml0ZV9yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLmZhdm9yaXRlX3JlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19zZWFyY2hfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUuc2VhcmNoX3JlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9zZWFyY2hfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5zZWFyY2hfcmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3Jzc19yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5yc3NfcmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X3Jzc19yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLnJzc19yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X2dvX2JhY2tfZmxhZyA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5nb19iYWNrX2ZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X2dvX2JhY2tfZmxhZyA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLmdvX2JhY2tfZmxhZyA9IGZsYWc7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmZpbmQgPSBmdW5jdGlvbiAoIGFjY291bnRfaWQgKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhY2NvdW50c19ieV9pZFsgYWNjb3VudF9pZCBdO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldF9wcm9maWxlID0gZnVuY3Rpb24gKCBwcm9maWxlX2lkIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ2Zhdm9yaXRlcycpIHJldHVybiAoIGZhdm9yaXRlc19hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBmYXZvcml0ZXNfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdzZWFyY2gnKSByZXR1cm4gKCBzZWFyY2hfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gc2VhcmNoX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAncnNzJykgcmV0dXJuICggcnNzX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IHJzc19hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ291dHJlYWNoJykgcmV0dXJuICggb3V0cmVhY2hfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gb3V0cmVhY2hfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdjaW5ib3gnKSByZXR1cm4gKCBjaW5ib3hfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gY2luYm94X2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgYSA9IGFjY291bnRzLmxlbmd0aDsgaSA8IGE7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIHAgPSBhY2NvdW50c1sgaSBdLnByb2ZpbGVzLmxlbmd0aDsgaiA8IHA7IGorKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX3Byb2ZpbGUgPSBhY2NvdW50c1sgaSBdLnByb2ZpbGVzWyBqIF07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggdGhpc19wcm9maWxlLmlkID09IHByb2ZpbGVfaWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzX3Byb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWNjb3VudHMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrICkgXHJcbiAgICB7IFxyXG4gICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBhY2NvdW50cyApO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBhY2NvdW50czsgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubGlzdF9hY2NvdW50cyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0ZW1wID0gW10sXHJcbiAgICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgICBhID0gMDtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoYWNjb3VudHNfb3JkZXIubGVuZ3RoID4gMCApe1xyXG4gICAgICAgICAgICBmb3IgKCBpID0gMCwgYSA9IGFjY291bnRzX29yZGVyLmxlbmd0aDsgaSA8IGE7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBhYyA9IGFjY291bnRzLmxlbmd0aDsgaiA8IGFjOyBqKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGFjY291bnRzX29yZGVyW2ldID09IGFjY291bnRzWyBqIF0udHlwZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBhY2NvdW50c1sgaiBdLmhhc191bmV4cGlyZWRfcHJvZmlsZXMoKSApIHRlbXAucHVzaCggYWNjb3VudHNbIGogXSApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCBpID0gMCwgYSA9IGFjY291bnRzLmxlbmd0aDsgaSA8IGE7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggYWNjb3VudHNbIGkgXS5oYXNfdW5leHBpcmVkX3Byb2ZpbGVzKCkgKSB0ZW1wLnB1c2goIGFjY291bnRzWyBpIF0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGVtcC5zb3J0KGZ1bmN0aW9uICggYSwgYiApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggYSA8IGIgKSByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBhID4gYiApIHJldHVybiAxO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCB0ZW1wICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSByZXR1cm4gdGVtcDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hZGRfYWNjb3VudCA9IGZ1bmN0aW9uKCB0eXBlIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YSk7XHJcbiAgICAgICAgdmFyIGN1c3RvbV9oZWFkZXJzID0gJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEgfHwge30sXHJcbiAgICAgICAgICAgIHBhdGggPSAnYWNjb3VudC9hY2NvdW50P3R5cGU9JyArdHlwZSsgJyZsZj1mYWxzZSc7XHJcblxyXG4gICAgICAgIGN1c3RvbV9oZWFkZXJzID0gSlNPTi5wYXJzZSggY3VzdG9tX2hlYWRlcnMgKTtcclxuXHJcbiAgICAgICAgdmFyIGNrZXkgPSAoY3VzdG9tX2hlYWRlcnMuY2xpZW50X2tleSAhPT0gdW5kZWZpbmVkKSA/IEpTT04uc3RyaW5naWZ5KGN1c3RvbV9oZWFkZXJzLmNsaWVudF9rZXkpOiAnJztcclxuICAgICAgICBcclxuICAgICAgICBwYXRoICs9ICcmdXNlcl9uYW1lPScrY3VzdG9tX2hlYWRlcnMudXNlcl9uYW1lKycmdXNlcl9wYXNzPScrY3VzdG9tX2hlYWRlcnMudXNlcl9wYXNzKycmY2xpZW50X2tleT0nK2NrZXkrJyZkZXZpY2U9aW9zJztcclxuICAgICAgICAvL2FsZXJ0KGVuY29kZVVSSShhcGlVcmwrcGF0aCkpO1xyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgbG9jYXRpb246ICd5ZXMnLFxyXG4gICAgICAgICAgY2xlYXJjYWNoZTogJ3llcycsXHJcbiAgICAgICAgICBjbGVhcnNlc3Npb25jYWNoZTogJ3llcycsXHJcbiAgICAgICAgICB0b29sYmFycG9zaXRpb246ICd0b3AnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJGNvcmRvdmFJbkFwcEJyb3dzZXIub3BlbiggZW5jb2RlVVJJKGFwaVVybCtwYXRoKSwgJ19ibGFuaycsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJGNvcmRvdmFJbkFwcEJyb3dzZXI6ZXhpdCcsIGZ1bmN0aW9uKGUsIGV2ZW50KXtcclxuICAgICAgICAgICAgYWNjb3VudE1hbmFnZXIuc2V0X3JlbmRlcmVkKCBmYWxzZSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsJ0VDJywgJ2FwaVVybCcsICdQcm9maWxlJywgZnVuY3Rpb24oJGh0dHAsIEVDLCBhcGlVcmwsIFByb2ZpbGUpe1xyXG5cclxuICAgIGZ1bmN0aW9uIEFjY291bnQgKCBhY2NvdW50X2RhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGFjY291bnRfZGF0YS5hY2NvdW50SWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy50eXBlID0gYWNjb3VudF9kYXRhLnR5cGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jYW5fcG9zdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMudHlwZSA9PSAnRmFjZWJvb2snIHx8IHRoaXMudHlwZSA9PSAnTGlua2VkaW4nIHx8IHRoaXMudHlwZSA9PSAnVHdpdHRlcicgfHwgdGhpcy50eXBlID09ICdCbG9nZ2VyJyB8fCB0aGlzLnR5cGUgPT0gJ1BpbnRlcmVzdCcgKSB0aGlzLmNhbl9wb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnR29vZ2xlUGx1cycpIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy50eXBlID09ICdQaW50ZXJlc3QnICYmIGFjY291bnRfZGF0YS5lbWFpbCAhPT0gdW5kZWZpbmVkICYmIGFjY291bnRfZGF0YS5wYXNzd29yZCAhPT0gdW5kZWZpbmVkICYmICEgJC5pc0VtcHR5T2JqZWN0KCBhY2NvdW50X2RhdGEucGFzc3dvcmQgKSApIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMudHlwZSA9PSAnTGlua2VkaW4nKSB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IDcwMDtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnVHdpdHRlcicpIHRoaXMuY2hhcmFjdGVyX2xpbWl0ID0gMTQwO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEgPSBhY2NvdW50X2RhdGEgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMucHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29uZmlnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb25maWcgKSApIHRoaXMucHJvZmlsZXMucHVzaCggbmV3IFByb2ZpbGUoIHRoaXMuZGF0YS5jb25maWcsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5jb25maWcuZm9yRWFjaChmdW5jdGlvbiAoIGl0ZW0gKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfcHJvZmlsZSA9IG5ldyBQcm9maWxlKCBpdGVtLCBzZWxmICk7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGVzLnB1c2goIG5ld19wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZXhwaXJlZCA9ICggYWNjb3VudF9kYXRhLm1vbml0b3JlZCA9PSAnZXhwaXJlZCcgPyB0cnVlIDogZmFsc2UgKTtcclxuICAgICAgICAvLyB0aGlzLmV4cGlyZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5oYXNfbW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMubW9uaXRvcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuaGFzX2V2ZW50c19tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5ldmVudHNfbW9uaXRvcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIEFjY291bnQucHJvdG90eXBlLmhhc191bmV4cGlyZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy51bmV4cGlyZWRfcHJvZmlsZXMoKS5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUubW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gdGhpcy5wcm9maWxlcy5sZW5ndGg7IGkgPCBwOyBpKysgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlc1sgaSBdLm1vbml0b3JlZCA9PSAnb24nKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuZXZlbnRzX21vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IHRoaXMucHJvZmlsZXMubGVuZ3RoOyBpIDwgcDsgaSsrICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZXNbIGkgXS5ldmVudHNNb25pdG9yZWQgPT0gJ29uJykgcHJvZmlsZXMucHVzaCggdGhpcy5wcm9maWxlc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZmlsZXM7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS51bmV4cGlyZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSB0aGlzLnByb2ZpbGVzLmxlbmd0aDsgaSA8IHA7IGkrKyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGVzWyBpIF0ubW9uaXRvcmVkICE9ICdvZmYnKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAnW29iamVjdCAnICt0aGlzLnR5cGUrICcgQWNjb3VudF0nO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBzd2l0Y2ggKCB0aGlzLnR5cGUudG9Mb3dlckNhc2UoKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogcmV0dXJuIDI7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dvb2dsZWFuYWx5dGljcyc6IHJldHVybiAzO1xyXG4gICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2xpbmtlZGluJzogcmV0dXJuIDQ7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IHJldHVybiA1O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogcmV0dXJuIDY7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IHJldHVybiA3O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdnb29nbGVwbHVzJzogcmV0dXJuIDg7XHJcbiAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnYmxvZ2dlcic6IHJldHVybiA5O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd0dW1ibHInOiByZXR1cm4gMTA7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3dvcmRwcmVzcyc6IHJldHVybiAxMTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAndmsnOiByZXR1cm4gMTI7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiAxMztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IFwiYWNjb3VudC9yZWZyZXNoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCJyZWZyZXNoQWNjb3VudFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLmlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjdGlvbiA9ICd1cGRhdGVQSUJvYXJkcyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblxyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKSBjYWxsYmFjayhmbGFnKTtcclxuXHJcbiAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmRlbGV0ZUFjY291bnQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogXCJhY2NvdW50L2RlbGV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IFwiZGVsZXRlQWNjb3VudEJ5SURcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICkgY2FsbGJhY2soZmxhZyk7XHJcblxyXG4gICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQWNjb3VudDtcclxuICAgIFxyXG59XTtcclxuXHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCdFQycsICdhcGlVcmwnLCAnc29jaWFsTWFuYWdlcicsIGZ1bmN0aW9uKCRodHRwLCBFQywgYXBpVXJsLCBzb2NpYWxNYW5hZ2VyKXtcclxuXHJcblx0ZnVuY3Rpb24gUHJvZmlsZSAoIHByb2ZpbGVfZGF0YSwgYWNjb3VudCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0gcHJvZmlsZV9kYXRhIHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmFjY291bnQgPSBhY2NvdW50IHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gZGF0YS5zYW1wbGVJZDtcclxuXHJcbiAgICAgICAgdGhpcy5waWN0dXJlID0gKCBkYXRhLnByb2ZpbGVQaWN0dXJlID8gZGVjb2RlVVJJQ29tcG9uZW50KCBkYXRhLnByb2ZpbGVQaWN0dXJlICkgOiAnc3Nzc3Nzc3MnICk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSAhPT0gJ3BpbnRlcmVzdCcgKSB0aGlzLnBpY3R1cmUgPSB0aGlzLnBpY3R1cmUucmVwbGFjZSgnaHR0cDovLycsJy8vJyk7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5tb25pdG9yZWQgPT0gJ29uJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnb24nKSB0aGlzLm1vbml0b3JlZCA9ICdvbic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEubW9uaXRvcmVkID09ICdleHBpcmVkJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnZXhwaXJlZCcpIHRoaXMubW9uaXRvcmVkID0gJ2V4cGlyZWQnO1xyXG5cclxuICAgICAgICBlbHNlIHRoaXMubW9uaXRvcmVkID0gJ29mZic7XHJcblxyXG4gICAgICAgIHRoaXMucHJvZmlsZV9jaGVja2VkID0gdGhpcy5tb25pdG9yZWQgPT0gJ29uJyA/IHRydWU6ZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuZXZlbnRzTW9uaXRvcmVkID0gZGF0YS5ldmVudHNNb25pdG9yZWQ7XHJcblxyXG4gICAgICAgIC8vIHRoaXMubW9uaXRvcmVkID0gKCAoIGRhdGEubW9uaXRvcmVkID09ICdvbicgfHwgZGF0YS5zb2NpYWxNb25pdG9yZWQgPT0gJ29uJykgPyAnb24nIDogJ29mZicpO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBkYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSApICkgdGhpcy5zdHJlYW1zID0gZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW07XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgKSB0aGlzLnN0cmVhbXMgPSBbIGRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtICkgKSB0aGlzLnN0cmVhbXMgPSB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW07XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICkgdGhpcy5zdHJlYW1zID0gWyB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gXTtcclxuXHJcbiAgICAgICAgZWxzZSB0aGlzLnN0cmVhbXMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5zb2NpYWwgPSBuZXcgU29jaWFsKCBzZWxmICk7XHJcbiAgICAgICAgdGhpcy5zb2NpYWwgPSBuZXcgc29jaWFsTWFuYWdlciggc2VsZiApO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmFuYWx5dGljcyA9IG5ldyBBbmFseXRpY3MoIHNlbGYgKTtcclxuICAgICAgICAvL3RoaXMuYW5hbHl0aWNzID0gbmV3IGFuYWx5dGljc01hbmFnZXIoIHNlbGYgKTtcclxuXHJcbiAgICAgICAgdGhpcy5ncm91cHMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5ldHdvcmsgPSB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnVzZXJuYW1lID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubW9uaXRvcmVkID09PSAnb24nICYmIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2xpbmtlZGluJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qdmFyIHJlcV9kYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMuaWRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6ICdmZWVkL2xpbmtlZEluL2dyb3VwcycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiByZXFfZGF0YVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmogIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YSAhPT0gdW5kZWZpbmVkICkgc2VsZi5ncm91cHMgPSAoIEFycmF5LmlzQXJyYXkoIG9iai5kYXRhICkgPyBvYmouZGF0YS5zb3J0KGZ1bmN0aW9uKGEsYil7aWYoYS5uYW1lIDwgYi5uYW1lKSByZXR1cm4gLTE7aWYoYS5uYW1lID4gYi5uYW1lKSByZXR1cm4gMTtyZXR1cm4gMDt9KSA6IFsgb2JqLmRhdGEgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9KTsqL1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZmFjZWJvb2snICYmIGRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiIClcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5tb25pdG9yZWQgPT09ICdvbicgJiYgdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZmFjZWJvb2snKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLyp2YXIgcmVxX2RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJIaWRkZW5fR3JvdXBzJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0X3Bvc3RzOiAnJ1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgICAgICB1cmw6J2ZlZWQvZmJIaWRkZW5Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHJlcV9kYXRhXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBvYmogIT0gdW5kZWZpbmVkICYmIG9iai5kYXRhICE9IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5sZW5ndGggPiAwICkgc2VsZi5ncm91cHMgPSAoIEFycmF5LmlzQXJyYXkoIG9iai5kYXRhICkgPyBvYmouZGF0YS5zb3J0KGZ1bmN0aW9uKGEsYil7aWYoYS5uYW1lIDwgYi5uYW1lKSByZXR1cm4gLTE7aWYoYS5uYW1lID4gYi5uYW1lKSByZXR1cm4gMTtyZXR1cm4gMDt9KSA6IFsgb2JqLmRhdGEgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH0pOyovXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICd0d2l0dGVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0X2VsZW1lbnQ6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIGdldCBwcm9maWxlIExpc3RzXHJcbiAgICAgICAgICAgIC8vbW9kdWxlLmdldF90d19wcm9maWxlX2xpc3RzKHRoaXMvKiwgZnVuY3Rpb24oKXt9Ki8pOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5wb3dlclVzZXJzICkgdGhpcy5wb3dlcl91c2VycyA9IGRhdGEucG93ZXJVc2VycztcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5wb3dlcl91c2VycyA9IHtcclxuICAgICAgICAgICAgICAgIHN0YXRlOiAnb24nLFxyXG4gICAgICAgICAgICAgICAgbWVkaXVtTG93OiAnMjAwMCcsXHJcbiAgICAgICAgICAgICAgICBtZWRpdW1IaWdoOiAnNzUwMCcsXHJcbiAgICAgICAgICAgICAgICBoaWdoOiAnNzUwMCdcclxuICAgICAgICAgICAgfTsgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdpbnN0YWdyYW0nKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAneW91dHViZScpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdnb29nbGVwbHVzJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKCBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSA9PSAncGFnZScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvc3Rpbmdfb25seSA9IHRydWU7IFxyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IHByb2ZpbGVfZGF0YS5mdWxsTmFtZSArICcgKFBhZ2UpJztcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gJ2Z1bGxOYW1lJzsgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSAocHJvZmlsZV9kYXRhLmZ1bGxOYW1lICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZV9kYXRhLmZ1bGxOYW1lICE9PVwiXCIpP3Byb2ZpbGVfZGF0YS5mdWxsTmFtZS5zcGxpdChcIihcIilbMF0gKyAnIChVc2VyKSc6ICcoVXNlciknO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSAnZnVsbE5hbWUnOyAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lID0gcHJvZmlsZV9kYXRhLmZ1bGxOYW1lO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9ICdmdWxsTmFtZSc7XHJcblxyXG4gICAgICAgICAgICBpZiggcHJvZmlsZV9kYXRhLm9iamVjdFR5cGUgIT09IHVuZGVmaW5lZCAmJiBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSA9PSAndXNlcicgKSB0aGlzLnVzZXJuYW1lICs9ICcgKFVzZXIpJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zdGluZ19vbmx5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgKz0gJyAoQm9hcmQpJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnBhZ2VOYW1lICkgLy8gRkIgXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS50aXRsZSApIC8vIEdBXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5wcm9maWxlTmFtZSApIC8vIExOXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS51c2VyTmFtZSApIC8vIElHXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5zcGVjaWZpZWRIYW5kbGVPckhhc2hUYWcgKSAvLyBUV1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEuZnVsbE5hbWUgKSAvLyBHK1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEudXNlckZpcnN0TmFtZSApIC8vIFlUXHJcblxyXG4gICAgICAgIFsncGFnZU5hbWUnLCAndGl0bGUnLCAncHJvZmlsZU5hbWUnLCAndXNlckZpcnN0TmFtZScsICd1c2VyTmFtZScsICdzcGVjaWZpZWRIYW5kbGVPckhhc2hUYWcnLCAnZnVsbE5hbWUnXS5mb3JFYWNoKGZ1bmN0aW9uICggaXRlbSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGFbIGl0ZW0gXSAhPT0gdW5kZWZpbmVkICYmIHNlbGYudXNlcm5hbWUgPT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudXNlcm5hbWUgPSBkYXRhWyBpdGVtIF0gKyAnICc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYudXNlcm5hbWVfa2V5ID0gaXRlbTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gJ1tvYmplY3QgJyArdGhpcy5hY2NvdW50LnR5cGUrICcgUHJvZmlsZV0nO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VybmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUuaXNfZGlzcGxheV9wcm9maWxlID0gZnVuY3Rpb24oIGFsbF9mbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRpc3BsYXlfcHJvZmlsZSA9IHRydWUsXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIGFsbF9mbGFnID09PSB1bmRlZmluZWQgJiYgc2VsZi5tb25pdG9yZWQgPT09ICdvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyRhY2NvdW50LmVsZW1lbnQuZmluZCgnLmZ1bmN0aW9ucycpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAoIHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2dvb2dsZXBsdXMnICYmICFzZWxmLnBvc3Rpbmdfb25seSApIHx8IHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcgKSBcclxuICAgICAgICAgICAgeyBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTsgfSAvL2hpZGUgaW4gcG9zdCBtYW5hZ2VyXHJcbiAgICAgICAgfSBcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGFsbF9mbGFnID09PSB0cnVlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKSAmJiBzZWxmLnBvc3Rpbmdfb25seSApIFxyXG4gICAgICAgICAgICB7IGRpc3BsYXlfcHJvZmlsZSA9IGZhbHNlOyB9IC8vaGlkZSAgIFxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRpc3BsYXlfcHJvZmlsZSA9IHNlbGYucG9zdGluZ19vbmx5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRpc3BsYXlfcHJvZmlsZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUuZ2V0VXNlck5hbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IHRoaXMudXNlcm5hbWU7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5kYXRhLnRpdGxlICE9PSB1bmRlZmluZWQgKSAvLyBmb3JtYXQgbmFtZSBmb3IgR0FcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wID0gdXNlcm5hbWUuc3BsaXQoJygnKVswXSB8fCBzZWxmLnVzZXJuYW1lKyAnICc7XHJcblxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IHRlbXAuc3Vic3RyaW5nKDAsIHRlbXAubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdXNlcm5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnVwZGF0ZV9tb25pdG9yID0gZnVuY3Rpb24oIGZsYWcgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBmbGFnID0gKGZsYWcgIT09IHVuZGVmaW5lZCk/ZmxhZzpmYWxzZTtcclxuXHJcbiAgICAgICAgaWYoIHNlbGYuYWNjb3VudC50eXBlID09ICdHb29nbGVBbmFseXRpY3MnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFsZXJ0KCdnb29nbGUgYW5hbHl0aWNzLi4uLi4uLi4uLi4uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGYubW9uaXRvcmVkID0gZmxhZyA/ICdvbic6J29mZic7XHJcblxyXG4gICAgICAgICAgICBzYXZlX3Byb2ZpbGVfc2VsZWN0aW9uKGZ1bmN0aW9uKCBzdGF0dXMgKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0dXM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2F2ZV9wcm9maWxlX3NlbGVjdGlvbiggY2FsbGJhY2sgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOidQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDpcImFjY291bnQvc2luZ2xlcHJvZmlsZW1vbml0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NldFNpbmdsZVByb2ZpbGVNb25pdG9yZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgYWNjb3VudElEOiBzZWxmLmFjY291bnQuaWQsIHByb2ZpbGVJRDogc2VsZi5pZCwgY2hlY2tlZDogZmxhZyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApIGNhbGxiYWNrKGZsYWcpO1xyXG5cclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcblxyXG5cclxuICAgIHJldHVybiBQcm9maWxlO1xyXG5cclxufV07IiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnQWNjb3VudCcsICckY29yZG92YUluQXBwQnJvd3NlcicsJ18nLCBmdW5jdGlvbigkaHR0cCwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgQWNjb3VudCwgJGNvcmRvdmFJbkFwcEJyb3dzZXIsIF8gKXsgIFxyXG5cclxuICAgIHZhciBsaWNlbnNlT3B0aW9ucyxcclxuICAgICAgICBzZXR0aW5ncyxcclxuICAgICAgICBpc19ldHN5X3VzZXIgPSBmYWxzZSxcclxuICAgICAgICBpc193ZWVibHlfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3dpeF91c2VyPSBmYWxzZSxcclxuICAgICAgICBpc19sZXhpdHlfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3Nob3BpZnlfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX2JpZ2NvbW1lcmNlX3VzZXIgPSBmYWxzZSxcclxuICAgICAgICBleHRlcm5hbEFwcHMgPSBbXSxcclxuICAgICAgICBmYXZvcml0ZXMgPSBbXSxcclxuICAgICAgICBzZWFyY2hlcyA9IFtdLFxyXG4gICAgICAgIHVzZXJfaW5ib3hfZmlsdGVycyA9IFtdLFxyXG4gICAgICAgIGdvdF9zZiA9IGZhbHNlLFxyXG4gICAgICAgIGdvdF9zZWFyY2hlcyA9IGZhbHNlLFxyXG4gICAgICAgIG51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gMCxcclxuICAgICAgICBhbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID0gdHJ1ZSxcclxuICAgICAgICBoaWRlRXZlbnRzQ291bnRlciA9IGZhbHNlLFxyXG4gICAgICAgIGRpc3BsYXlJbmJveFNldHRpbmdzID0gdHJ1ZSxcclxuICAgICAgICBhdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmYWxzZSxcclxuICAgICAgICBhZ2VuY3lDb25maWd1cmF0aW9uID0ge30sXHJcbiAgICAgICAgbWF4RXZlbnRUaW1lO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5nZXREaXNwbGF5SW5ib3hTZXR0aW5ncyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BsYXlJbmJveFNldHRpbmdzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldERpc3BsYXlJbmJveFNldHRpbmdzID0gZnVuY3Rpb24gKCBkaXNwbGF5IClcclxuICAgIHtcclxuICAgICAgICBkaXNwbGF5SW5ib3hTZXR0aW5ncyA9IGRpc3BsYXk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0TWF4RXZlbnRUaW1lID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gKCBtYXhFdmVudFRpbWUgPT09IHVuZGVmaW5lZCA/IG5ldyBEYXRlKCkuZ2V0VGltZSgpIDogbWF4RXZlbnRUaW1lICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0TWF4RXZlbnRUaW1lID0gZnVuY3Rpb24gKCB0aW1lIClcclxuICAgIHtcclxuICAgICAgICBtYXhFdmVudFRpbWUgPSB0aW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoIGhpZGUgKVxyXG4gICAge1xyXG4gICAgICAgIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSBoaWRlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEhpZGVFdmVudHNDb3VudGVyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaGlkZUV2ZW50c0NvdW50ZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0SGlkZUV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbiAoIGhpZGUgKVxyXG4gICAge1xyXG4gICAgICAgIGhpZGVFdmVudHNDb3VudGVyID0gaGlkZTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXROdW1iZXJPZkNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG51bWJlck9mQ29tcGxldGVkRXZlbnRzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldE51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKCBjb21wbGV0ZWRfZXZlbnRzIClcclxuICAgIHtcclxuICAgICAgICBudW1iZXJPZkNvbXBsZXRlZEV2ZW50cyA9IGNvbXBsZXRlZF9ldmVudHM7XHJcblxyXG4gICAgICAgIHRoaXMucmVuZGVyQ29tcGxldGVkRXZlbnRzQ291bnRlcigpOyBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3c7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0QXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID0gZnVuY3Rpb24gKCBmbGFnIClcclxuICAgIHtcclxuICAgICAgICBhdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbmRlckNvbXBsZXRlZEV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgLyp2YXIgJGluZGljYXRvciA9ICQoJ2JvZHknKS5maW5kKCcubmV3LWV2ZW50cy1pbmRpY2F0b3InKTtcclxuXHJcbiAgICAgICAgaWYgKCAkaW5kaWNhdG9yLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhaGlkZUV2ZW50c0NvdW50ZXIgJiYgYWxsX3NldHRpbmdzLmxpY2Vuc2VUeXBlICE9ICdGcmVlJyAmJiBhbGxfc2V0dGluZ3MubGljZW5zZVR5cGUgIT0gJ0luZGl2aWR1YWwnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAkaW5kaWNhdG9yLmhhc0NsYXNzKCd6ZXJvJykgKSAkaW5kaWNhdG9yLnJlbW92ZUNsYXNzKCd6ZXJvJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGluZGljYXRvci50ZXh0KCBudW1iZXJPZkNvbXBsZXRlZEV2ZW50cyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggISRpbmRpY2F0b3IuaGFzQ2xhc3MoJ3plcm8nKSApICRpbmRpY2F0b3IudGV4dCgnJykuYWRkQ2xhc3MoJ3plcm8nKTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9Ki9cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBZ2VuY3lDb25maWd1cmF0aW9uID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYWdlbmN5Q29uZmlndXJhdGlvbjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRBZ2VuY3lDb25maWd1cmF0aW9uID0gZnVuY3Rpb24gKCBhYyApXHJcbiAgICB7XHJcbiAgICAgICAgYWdlbmN5Q29uZmlndXJhdGlvbiA9IGFjO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFnZW5jeUJyYW5kcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIGlmKCBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudCA9PT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG5cclxuICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheSggYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQgKSApXHJcbiAgICAgICAgICAgIHJldHVybiBbIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50IF07XHJcblxyXG4gICAgICAgIHJldHVybiBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudDtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0VXNlclBlcm1pc3Npb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG5cclxuICAgICAgICB2YXIgYnJhbmRzID0gbW9kdWxlLmdldEFnZW5jeUJyYW5kcygpLFxyXG4gICAgICAgICAgICBwZXJtaXNzaW9uID0gJ2VkaXQnO1xyXG5cclxuICAgICAgICBpZiggIWJyYW5kcy5sZW5ndGggKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGZvciggdmFyIGk9MDsgaTxicmFuZHMubGVuZ3RoOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYoIGJyYW5kc1tpXS5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIGJyYW5kc1tpXS5zZWxlY3RlZCA9PSAnMScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwZXJtaXNzaW9uID0gYnJhbmRzW2ldLnBlcm1pc3Npb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwZXJtaXNzaW9uO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBbmFseXRpY3NBY2NvdW50cyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBQT1NULFxyXG4gICAgICAgICAgICB1cmw6ICdhamF4LnBocCcsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEFuYWx5dGljc0FjY291bnRzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2UoIHJlc3BvbnNlICk7IFxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVBY2NvdW50cyA9IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaylcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICB1cmw6XCJhamF4LnBocFwiLFxyXG4gICAgICAgICAgICBkYXRhOntcclxuICAgICAgICAgICAgICAgIGFjdGlvbjondXBkYXRlQWNjb3VudHMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YTpkYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggcmVzcG9uc2UgPT0gU1VDQ0VTUylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmdldFNldHRpbmdzKCk7ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHJlc3BvbnNlICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2F2ZVNldHRpbmdzID0gZnVuY3Rpb24oIGRhdGEsIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICB1cmw6J3VzZXIvc2V0dGluZ3MnLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdzYXZlU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHJlc3BvbnNlLnJldHVybkNvZGUgPT0gXCJTVUNDRVNTXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1vZHVsZS5oYW5kbGVfc2V0dGluZ3MoIHJlc3BvbnNlLnNldHRpbmdzLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHJlc3BvbnNlICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRTZWFyY2hTdHJlYW1zID0gZnVuY3Rpb24oIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCh7IHR5cGU6R0VULCB1cmw6J2ZlZWQvc2VhcmNoU3RyZWFtcycsIGRhdGE6eyBhY3Rpb246J2dldFNlYXJjaFN0cmVhbXMnfX0sIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICBnb3Rfc2YgPSB0cnVlO1xyXG4gICAgICAgICAgICBzZWFyY2hlcyA9IGRhdGE7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5lZGl0U2VhcmNoU3RyZWFtID0gZnVuY3Rpb24oIHN0cmVhbSwgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggc3RyZWFtLnByb2ZpbGUgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6UE9TVCxcclxuICAgICAgICAgICAgICAgIHVybDonZmVlZC9zZWFyY2hTdHJlYW1zJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdlZGl0U2VhcmNoU3RyZWFtJyxcclxuICAgICAgICAgICAgICAgICAgICBpZDogc3RyZWFtLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc3RyZWFtLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHN0cmVhbS5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHN0cmVhbS5wYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoIHN0cmVhbS5wYXJhbWV0ZXJzLnF1ZXJ5ICE9PSB1bmRlZmluZWQgKSByZXF1ZXN0LmRhdGEubmFtZSA9ICdTZWFyY2g6ICcgKyBkZWNvZGVVUklDb21wb25lbnQoIHN0cmVhbS5wYXJhbWV0ZXJzLnF1ZXJ5ICk7XHJcblxyXG4gICAgICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0RmF2b3JpdGVTdHJlYW1zID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoeyB0eXBlOkdFVCwgdXJsOidmZWVkL2Zhdm9yaXRlU3RyZWFtcycsIGRhdGE6eyBhY3Rpb246J2dldEZhdm9yaXRlU3RyZWFtcyd9fSwgZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGZhdm9yaXRlcyA9IGRhdGE7XHJcblxyXG4gICAgICAgICAgICBnb3RfZmF2ZXMgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGZhdm9yaXRlcyApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2dldEZhdm9yaXRlU3RyZWFtcyByZXNwb25zZTonKVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZmF2b3JpdGVzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBnb3RfZmF2ZXMgKSByZXR1cm4gZmF2b3JpdGVzO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZWFyY2hfZmVlZHMgPSBmdW5jdGlvbiAoIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIGdvdF9zZiApIHJldHVybiBzZWFyY2hlcztcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7ICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0dGluZ3MgPSBmdW5jdGlvbiAoIGNhbGxiYWNrICkgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHNldHRpbmdzICk7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIHNldHRpbmdzO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5nZXRTZXR0aW5ncyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6R0VULFxyXG4gICAgICAgICAgICB1cmw6J3VzZXIvc2V0dGluZ3MnICAgICAgICAgICAgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbW9kdWxlLmhhbmRsZV9zZXR0aW5ncyhyZXNwb25zZSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBoYW5kbGUgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5oYW5kbGVfc2V0dGluZ3MgPSBmdW5jdGlvbiggcmVzcG9uc2UsIGNhbGxiYWNrLCBmbGFnX25vX2FnZW5jeV91cGRhdGUgKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdoYW5kbGVfc2V0dGluZ3MuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4nKTtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgZmxhZ19ub19hZ2VuY3lfdXBkYXRlID0gZmxhZ19ub19hZ2VuY3lfdXBkYXRlID8gZmxhZ19ub19hZ2VuY3lfdXBkYXRlOmZhbHNlO1xyXG5cclxuXHJcbiAgICAgICAgICAgIC8vIHNldCBtb2R1bGUgdmFyaWFibGVcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSBkYXRhO1xyXG4gICAgICAgICAgICBpZiAoIHNldHRpbmdzLmFwaVVzZXIgPT09IHVuZGVmaW5lZCB8fCBfLmlzRW1wdHkoIHNldHRpbmdzLmFwaVVzZXIgKSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5hcGlVc2VyID0gc2V0dGluZ3MuZW1haWw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vc2V0IGdsb2JhbCB2YXJpYWJsZXNcclxuICAgICAgICAgICAgaXNfd2l4X3VzZXIgPSBzZXR0aW5ncy53aXhVc2VyO1xyXG4gICAgICAgICAgICBtYXhfYWxsb3dlZF9nYV9hY2NvdW50cyA9IHNldHRpbmdzLm51bWJlck9mQWN0aXZlR29vZ2xlQW5hbHl0aWNzQWNjb3VudHM7XHJcbiAgICAgICAgICAgIG1heF9hbGxvd2VkX3NvY2lhbF9hY2NvdW50cyA9IHNldHRpbmdzLm51bWJlck9mU29jaWFsc09uO1xyXG4gICAgICAgICAgICByZW1fZGF5cyA9IHNldHRpbmdzLmRheXNMZWZ0O1xyXG5cclxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MgPSBzZXR0aW5ncztcclxuICAgICAgICAgICAgLy9FQy5zZXNzaW9uRGF0YS5zZXQoJ2FsbF9zZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKSk7XHJcblxyXG4gICAgICAgICAgICAvL3NldCBzZXR0aW5nc0RlZmVycmVkIGFzIHJlc29sdmVkIG9ubHkgaWYgc2V0dGluZ3MgYXZhaWxhYmxlXHJcbiAgICAgICAgICAgIC8vc2V0dGluZ3NEZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsaWNlbnNlT3B0aW9ucyA9IGRhdGEubGljZW5zZU9wdGlvbnM7XHJcblxyXG4gICAgICAgICAgICAvKmlmICggZGF0YS51c2VyU291cmNlID09IFwiYmlnY29tbWVyY2VcIiB8fCBkYXRhLmxvZ2luVHlwZSAhPSAndXNlclBhc3N3b3JkJyl7XHJcbiAgICAgICAgICAgICAgICAkKCcuY2hhbmdlX3Bhc3MnKS5hZGRDbGFzcygnaGlkZScpO1xyXG4gICAgICAgICAgICB9Ki9cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzPyAoIGRhdGEuYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKTogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRIaWRlRXZlbnRzQ291bnRlciggZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIgPyAoIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyLnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpIDogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRpc3BsYXlJbmJveFNldHRpbmdzICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0RGlzcGxheUluYm94U2V0dGluZ3MoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgPyAoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIikgOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEubnVtYmVyT2ZOZXdFdmVudHMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5udW1iZXJPZk5ld0V2ZW50cyA9PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0TnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMoIGRhdGEubnVtYmVyT2ZOZXdFdmVudHMgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93KCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA/ICggZGF0YS5hdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIik6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmFnZW5jeUNvbmZpZ3VyYXRpb24gPT0gJ29iamVjdCcpe1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEFnZW5jeUNvbmZpZ3VyYXRpb24oIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZXh0ZXJuYWxBcHBzIT09dW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGV4dGVybmFsQXBwcyA9IGRhdGEuZXh0ZXJuYWxBcHBzO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZXh0ZXJuYWxBcHBzICkgKSBleHRlcm5hbEFwcHMgPSBbIGRhdGEuZXh0ZXJuYWxBcHBzIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBleHRlcm5hbEFwcHMgPSBkYXRhLmV4dGVybmFsQXBwcztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ2V4dGVybmFsQXBwcycgKVxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGV4dGVybmFsQXBwcyApXHJcblxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxBcHBzLmZvckVhY2goZnVuY3Rpb24gKCBleHRlcm5hbEFwcCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHAgKSApIGV4dGVybmFsQXBwLmV4dGVybmFsQXBwID0gWyBleHRlcm5hbEFwcC5leHRlcm5hbEFwcCBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXBwID0gZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnYXBwJyApXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGFwcCApXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgYXBwLmZvckVhY2goZnVuY3Rpb24gKCB0aGlzX2FwcCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ3RoaXNfYXBwJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCB0aGlzX2FwcCApXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdsZXhpdHknKSBpc19sZXhpdHlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICd3ZWVibHknKSBpc193ZWVibHlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdldHN5JykgaXNfZXRzeV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ3Nob3BpZnknKSBpc19zaG9waWZ5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnYmlnY29tbWVyY2UnKSBpc19iaWdjb21tZXJjZV91c2VyID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9ICBcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlX3NldHRpbmdzX3dpbmRvdyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLmdldFNldHRpbmdzKGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXR0aW5nc1dpbmRvdygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCByZXNwLmFnZW5jeU51bWJlck9mQ2xpZW50cyAhPT0gdW5kZWZpbmVkICkgJCgnLnBsYW4tdXNhZ2UgLmJyYW5kLXVzYWdlIC52YWx1ZScpLnRleHQoIHJlc3AuYWdlbmN5TnVtYmVyT2ZBY3RpdmVDbGllbnRzKyAnLycgK3Jlc3AuYWdlbmN5TnVtYmVyT2ZDbGllbnRzICk7XHJcblxyXG4gICAgICAgICAgICAvL3NldHRpbmdzV2luZG93TnVtYmVycyggcmVzcCApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5nZXRMaWNlbnNlT3B0aW9ucyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGxpY2Vuc2VPcHRpb25zO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2V0c3lfdXNlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX2V0c3lfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc193ZWVibHlfdXNlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX3dlZWJseV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2xleGl0eV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfbGV4aXR5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfc2hvcGlmeV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfc2hvcGlmeV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2JpZ2NvbW1lcmNlX3VzZXI9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX2JpZ2NvbW1lcmNlX3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0RXh0ZXJuYWxBcHBzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZXh0ZXJuYWxBcHBzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmNoZWNrTGljZW5zZVZpZXcgPSBmdW5jdGlvbiAoIGlkLCBpc193aXgsIG1peHBhbmVsX3R5cGUgKVxyXG4gICAge1xyXG4gICAgICAgIC8vIGlmKCBsaWNlbnNlT3B0aW9ucy52aWV3ICE9IHVuZGVmaW5lZCAmJiBsaWNlbnNlT3B0aW9ucy52aWV3ID09ICc3RC1Pbmx5JyAmJiBpZCAhPSAnN0QnKVxyXG4gICAgICAgIGlmICggZmFsc2UgKSAvLyBlbmFibGUgYWxsIHRpbWVmcmFtZXNcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vJCh3aW5kb3cpLnRyaWdnZXIoJ3VwZ3JhZGUtcG9wdXAnLCBtaXhwYW5lbF90eXBlKTtcclxuICAgICAgICAgICAgc2hvd1VwZ3JhZGVXaW5kb3coaXNfd2l4KTtcclxuICAgICAgICAgICAgcmV0dXJuIEZBSUw7ICAgIFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZSByZXR1cm4gU1VDQ0VTUzsgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldF91c2VyX2luYm94X3RhZ3MgPSBmdW5jdGlvbiggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRVc2VyRXZlbnRzJyxcclxuICAgICAgICAgICAgc3RhcnRUaW1lOiAnMCcsXHJcbiAgICAgICAgICAgIGVuZFRpbWU6ICcwJyxcclxuICAgICAgICAgICAgcmVxdWVzdF9hY3Rpb246ICdnZXRVc2VyVGFncycsXHJcbiAgICAgICAgICAgIG1heEV2ZW50czogJzEnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IEdFVCxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC91c2VyRXZlbnRzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnRhZ3MgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBvYmoudGFncyApICkgdXNlcl9pbmJveF90YWdzID0gb2JqLnRhZ3M7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggb2JqICk7XHJcbiAgICAgICAgfSk7ICAgICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pbmJveF90YWdzID0gZnVuY3Rpb24gKCApXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXJfaW5ib3hfdGFnczsgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZV9pbmJveF90YWdzID0gZnVuY3Rpb24oIHRhZ3MsIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB0YWdzID0gQXJyYXkuaXNBcnJheSggdGFncyApID90YWdzOltdO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogUE9TVCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiAndXNlci9ldmVudHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOnsgdGFnczogdGFncyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCBvYmogKXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBvYmogfHwge307XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL0lmIHN1Y2Nlc3MsIHVwZGF0ZSB0YWdzIGFycmF5XHJcbiAgICAgICAgICAgIGlmICggZGF0YS5yZXR1cm5Db2RlID09ICdTVUNDRVNTJyApXHJcbiAgICAgICAgICAgICAgICB1c2VyX2luYm94X3RhZ3MgPSB0YWdzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyR1cmxSb3V0ZXInLCAnRUMnLCAnYXBpVXJsJywgJ0ZhY2Vib29rRmVlZCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkdXJsUm91dGVyLCBFQywgYXBpVXJsLCBGYWNlYm9va0ZlZWQsICRpbmplY3RvciApe1xyXG5cclxuICAgIC8vdmFyIEZlZWQgPSAkaW5qZWN0b3IuZ2V0KCdGZWVkJyk7XHJcbiAgICAvL3ZhciBGZWVkSXRlbSA9ICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICAvL3ZhciBUaW1lbGluZUZlZWRJdGVtID0gJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG5cclxuICAgIGZ1bmN0aW9uIFNvY2lhbCggcHJvZmlsZSApXHJcbiAgICB7XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucHJvZmlsZSA9IHByb2ZpbGUgfHwge307XHJcblxyXG4gICAgICAgIC8vIHRoaXMuZmVlZHMgPSB7fTtcclxuICAgICAgICB0aGlzLmZlZWRzX2luX29yZGVyID0gW107XHJcblxyXG4gICAgICAgIHRoaXMucmVmcmVzaF9pbnRlcnZhbCA9IDA7XHJcblxyXG4gICAgICAgIC8vSW5ib3ggZmlsdGVyc1xyXG4gICAgICAgIHRoaXMudXNlcl9pbmJveF9maWx0ZXJzID0gW107Ly9nZXRfdXNlcl9pbmJveF9maWx0ZXJzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yID0gMDsgXHJcbiAgICAgICAgdGhpcy5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciA9IHRydWU7IFxyXG4gICAgfVxyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUucGFnZXMgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5wYWdlcztcclxuICAgIH07XHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICBjb25zb2xlLmRpciggdGhpcyApO1xyXG4gICAgfTtcclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oIGNvbnRhaW5lciApe1xyXG5cclxuICAgICAgICB2YXIgJGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCAkKCcjc29jaWFsJyk7XHJcblxyXG4gICAgICAgICRjb250YWluZXIuaHRtbCgnJyk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgICAgICAvL0Fzc2lnbiBpdCB0byBnbG9iYWwgb2JqZWN0IFxyXG4gICAgICAgIC8vd2luZG93Lmdsb2JhbHMuc29jaWFsID0gdGhpczsgXHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgcHJldmlvdXNfZmVlZHMgPSBbXSxcclxuICAgICAgICAgICAgbmV3X3N0cmVhbXNfb3JkZXIgPSBbXSxcclxuICAgICAgICAgICAgcHJldl9mZWVkc19pbl9vcmRlciA9IHNlbGYuZmVlZHNfaW5fb3JkZXI7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuc29jaWFsID0gc2VsZjtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyID0gW107XHJcblxyXG4gICAgICAgIC8vZ2V0IG5ldyBzdHJlYW1zIG9yZGVyXHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKCBzZWxmLnByb2ZpbGUuc3RyZWFtcywgZnVuY3Rpb24oIHRoaXNfc3RyZWFtICl7XHJcbiAgICAgICAgICAgIHZhciBpZCA9ICggWydyc3MnLCAnc2VhcmNoJywgJ291dHJlYWNoJ10uaW5kZXhPZiggdGhpc19zdHJlYW0uc3RyZWFtSWQgKSA+IC0xICkgPyB0aGlzX3N0cmVhbS5pZCA6IHRoaXNfc3RyZWFtLnN0cmVhbUlkO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoIHNlbGYucHJvZmlsZS5pZC5pbmRleE9mKCdmYXZvcml0ZScpICE9PSAtMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkICs9ICdfJyArICB0aGlzX3N0cmVhbS5wcm9maWxlLmlkICsgJ18nICsgdGhpc19zdHJlYW0ubmV0d29yaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZXdfc3RyZWFtc19vcmRlci5wdXNoKCBpZCApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKG5ld19zdHJlYW1zX29yZGVyKTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gc2VsZi5wcm9maWxlLnN0cmVhbXMubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0aGlzX3N0cmVhbSA9IHNlbGYucHJvZmlsZS5zdHJlYW1zWyBpIF0sXHJcbiAgICAgICAgICAgICAgICBpZCA9ICggWydyc3MnLCAnc2VhcmNoJywgJ291dHJlYWNoJ10uaW5kZXhPZiggdGhpc19zdHJlYW0uc3RyZWFtSWQgKSA+IC0xICkgPyB0aGlzX3N0cmVhbS5pZCA6IHRoaXNfc3RyZWFtLnN0cmVhbUlkLFxyXG4gICAgICAgICAgICAgICAgbmV0d29yayA9IHNlbGYucHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIG5ld19mZWVkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzX3N0cmVhbS52YWx1ZSA9PSAndHJ1ZScgIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FBQTo6JytuZXR3b3JrKTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIG5ldHdvcmsgKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRkIgdGVzdDo6OicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBGYWNlYm9va0ZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZ2V0RXhpc3RpbmdTdGF0ZSA9ICRzdGF0ZS5nZXQobmV3X2ZlZWQucGFnZV9pZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBuZXdfZmVlZCAmJiAkc3RhdGUuZ2V0KG5ld19mZWVkLnBhZ2VfaWQpID09PSBudWxsIClcclxuICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5mZWVkc19pbl9vcmRlci5wdXNoKCBuZXdfZmVlZCApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBuZXdfZmVlZC5yZW5kZXIgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkLnJlbmRlcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3ZhciAkbmV3X2ZlZWQgPSBuZXdfZmVlZC5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8kY29udGFpbmVyLmFwcGVuZCggJG5ld19mZWVkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYoIG5ld19mZWVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBfLmZpbmRMYXN0SW5kZXgocHJldl9mZWVkc19pbl9vcmRlciwgeyAgcGFnZV9pZDogbmV3X2ZlZWQucGFnZV9pZH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCBpbmRleCA+PSAwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIucHVzaChwcmV2X2ZlZWRzX2luX29yZGVyW2luZGV4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHVwZGF0ZWRfc3RyZWFtc19vcmRlciA9IFtdO1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmZlZWRzX2luX29yZGVyLCBmdW5jdGlvbih0aGlzX2ZlZWQpe1xyXG4gICAgICAgICAgICB1cGRhdGVkX3N0cmVhbXNfb3JkZXIucHVzaCh0aGlzX2ZlZWQucGFnZV9pZCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuXHJcbiAgICAgICAgLy9EZWNpZGUgdGhlIGZlZWQgcGFnZSB0byBzaG93IGJ5IGRlZmF1bHRcclxuICAgICAgICB2YXIgZmVlZF9wYWdlX3RvX3Nob3cgPSAnJztcclxuICAgICAgICBcclxuICAgICAgICAvL3RvIG1haW50YWluIGxhc3QgZmVlZC1zZWxlY3RvciBwb3NpdGlvblxyXG4gICAgICAgIGlmKCBzZWxmLmZlZWRfc2VsZWN0b3JfaW5pdGlhbF90cmlnZ2VyICYmIHNlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9PT0gMCApIFxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIGZlZWRfcGFnZV90b19zaG93ID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyW3NlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3Rvcl07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYoIHNlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlcltzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3JdO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciA9PT0gZmFsc2UgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfcGFnZV90b19zaG93ID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyW3VwZGF0ZWRfc3RyZWFtc19vcmRlci5sZW5ndGgtMV07XHJcblxyXG4gICAgICAgICAgICBzZWxmLmZlZWRfc2VsZWN0b3JfaW5pdGlhbF90cmlnZ2VyID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hc3NpZ24gdXBkYXRlZCBzdHJlYW1zIHRvIGN1cnJlbnQgb2JqZWN0XHJcbiAgICAgICAgc2VsZi51cGRhdGVkX3N0cmVhbXNfb3JkZXIgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXI7XHJcblxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRPYmooaWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgaW5kZXggPSBfLmZpbmRMYXN0SW5kZXgoc2VsZi5mZWVkc19pbl9vcmRlciwgeyAgcGFnZV9pZDogaWR9KTtcclxuICAgICAgICAgICAgcmV0dXJuIHNlbGYuZmVlZHNfaW5fb3JkZXJbaW5kZXhdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLypjb25zb2xlLmxvZygndXBkYXRlZF9zdHJlYW1zX29yZGVyJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2codXBkYXRlZF9zdHJlYW1zX29yZGVyKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhmZWVkX3BhZ2VfdG9fc2hvdyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2V0T2JqKGZlZWRfcGFnZV90b19zaG93KSk7Ki9cclxuICAgICAgICB2YXIgY3VycmVudF9vYmogPSB7J25hbWUnOidyYW0nfTsvL2dldE9iaihmZWVkX3BhZ2VfdG9fc2hvdyk7XHJcblxyXG4gICAgICAgICRzdGF0ZS5nbyhmZWVkX3BhZ2VfdG9fc2hvdywge29iajpjdXJyZW50X29ian0sIHtjYWNoZTogdHJ1ZX0pO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygndGhpcy5mZWVkc19pbl9vcmRlcicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZmVlZHNfaW5fb3JkZXIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzOyAgICAgICBcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIFxyXG5cclxuICAgIFxyXG5cclxuXHJcbiAgICBcclxuXHJcblxyXG4gICAgcmV0dXJuIFNvY2lhbDtcclxufV07XHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGZlZWRfaXRlbSA9ICcnO1xyXG5cclxuICAgICAgICBzZWxmLmRhdGEgPSBpdGVtX2RhdGE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkID0gZmVlZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLnByb2ZpbGUgPSBmZWVkLnByb2ZpbGU7XHJcblxyXG4gICAgICAgIHNlbGYuZWxlbWVudCA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIEZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQ7XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIEZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBDb2xsYXBzaWJsZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxuICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5yZXR3ZWV0O1xyXG4gICAgXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5mYXZvcml0ZSA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmZhdm9yaXRlO1xyXG5cclxuICAgIHJldHVybiBDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuICAgIFxyXG5cclxuICAgIGZ1bmN0aW9uIERyb3Bkb3duRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0ID0gJyc7XHJcbiAgICAgICAgdGhpcy5kZWZhdWx0X2VsZW1lbnQgPSBmZWVkLmRlZmF1bHRfZWxlbWVudCB8fCAnJztcclxuICAgIH1cclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERyb3Bkb3duRmVlZEl0ZW07XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHM7XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXM7XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuZ2V0X2Ryb3Bkb3duID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRyb3Bkb3duID0gW10sXHJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5kYXRhLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2VsZi5kYXRhID0gc2VsZi5kYXRhLnNvcnQoZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lQSA9ICggdHlwZW9mIGEubmFtZSA9PT0gJ3N0cmluZycgPyBhLm5hbWUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZUIgPSAoIHR5cGVvZiBiLm5hbWUgPT09ICdzdHJpbmcnID8gYi5uYW1lLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggbmFtZUEgPiBuYW1lQiApIHJldHVybiAxO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuYW1lQSA8IG5hbWVCICkgcmV0dXJuIC0xO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmRhdGEgPSBzZWxmLmRhdGEuc29ydChmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZUEgPSAoIHR5cGVvZiBhLmNoYW5uZWxUaXRsZSA9PT0gJ3N0cmluZycgPyBhLmNoYW5uZWxUaXRsZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZUIgPSAoIHR5cGVvZiBiLmNoYW5uZWxUaXRsZSA9PT0gJ3N0cmluZycgPyBiLmNoYW5uZWxUaXRsZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBuYW1lQSA+IG5hbWVCICkgcmV0dXJuIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuYW1lQSA8IG5hbWVCICkgcmV0dXJuIC0xO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IHNlbGYuZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19ncm91cCA9IHNlbGYuZGF0YVsgaSBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwX2lkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzX2dyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19ncm91cC5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXNfZ3JvdXAuY2hhbm5lbFRpdGxlXHJcbiAgICAgICAgICAgICAgICAgICAgfTsgIFxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQgPSB0aGlzX2dyb3VwLmlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKSBncm91cF9pZCA9IHRoaXNfZ3JvdXAuaWRfc3RyO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkcm9wZG93bi5wdXNoKHsnaWQnOmdyb3VwX2lkLCAnbmFtZSc6dGhpc19ncm91cC5uYW1lLCAnZGF0YSc6dGhpc19ncm91cH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoKCB0aGlzLmZlZWQuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaXN0cyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfYm9hcmQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPSAnWW91IGRvIG5vdCBoYXZlIGJvYXJkcyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlcyc6XHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlc19vbmx5JzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9J1lvdSBkbyBub3QgaGF2ZSBwYWdlcyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbl9jb21wYW5pZXMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBkbyBub3QgZm9sbG93IGFueSBjb21wYW55IHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlTdWJzY3JpcHRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBoYXZlblxcJ3QgYWRkZWQgYW55IHN1YnNjcmlwdGlvbnMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYl9saWtlcyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAoJ1lvdSBoYXZlblxcJ3QgbGlrZWQgYW55IHBhZ2VzIHlldC4nKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGFyZSBub3QgYSBtZW1iZXIgb2YgYW55IGdyb3Vwcy4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyAnY291bnQnOmRyb3Bkb3duLmxlbmd0aCwgJ2RhdGEnOmRyb3Bkb3duLCAncGxhY2Vob2xkZXInOiBwbGFjZWhvbGRlcn07XHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNldF9kZWZhdWx0X2dyb3VwX2lkID0gZnVuY3Rpb24gKCBzZWxfb2JqIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICRfdGhpcyA9IHNlbF9vYmo7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJF90aGlzLmRhdGEuaWQ7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkZWxtLmRhdGEoJ2RhdGEnKS5pZF9zdHI7XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLmlkID09ICdsaXN0cycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZS5saXN0cy5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDsgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dGluZyBvZiBkZWZhdWx0IGdyb3VwIGlkXHJcbiAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLnVwZGF0ZUZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCB0cnVlICk7XHJcblxyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC51cGRhdGVJbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoIHVwZGF0ZUZlZWROb3RpZmljYXRpb24sIDUqNjAqMTAwMCwgc2VsZi5mZWVkICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Ugc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ3NldERlZmF1bHRHcm91cElkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIC8vZGVmYXVsdEdyb3VwSWQ6ICQoIHRoaXMgKS5kYXRhKCdkYXRhJykuaWQsXHJcbiAgICAgICAgICAgIGRlZmF1bHRHcm91cElkOiBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCxcclxuICAgICAgICAgICAgbmV0d29yazogc2VsZi5mZWVkLm5ldHdvcmtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6IFwiZmVlZC9kZWZhdWx0R3JvdXBJZFwiLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCAnc2V0dGluZyBzZXREZWZhdWx0R3JvdXBJZDogJyArIGdyb3VwX2lkIClcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qdmFyIGRhdGEgPSBKU09OLnBhcnNlKCByZXNwICk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCAnc2V0IHJlc3BvbnNlOicgKVxyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggZGF0YSApKi9cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBzZWxfb2JqIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICRfdGhpcyA9IHNlbF9vYmo7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJF90aGlzLmRhdGEuaWQ7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkZWxtLmRhdGEoJ2RhdGEnKS5pZF9zdHI7XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLmlkID09ICdsaXN0cycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZS5saXN0cy5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDsgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dGluZyBvZiBkZWZhdWx0IGdyb3VwIGlkXHJcbiAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLnVwZGF0ZUZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCB0cnVlICk7XHJcblxyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC51cGRhdGVJbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoIHVwZGF0ZUZlZWROb3RpZmljYXRpb24sIDUqNjAqMTAwMCwgc2VsZi5mZWVkICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Ugc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7IHR5cGU6ICdHRVQnIH0sXHJcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cElkOiAkX3RoaXMuZGF0YS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dDogc2VsZi5uZXh0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXF1ZXN0LnVybCA9ICdmZWVkL2ZiR3JvdXAnO1xyXG5cclxuICAgICAgICByZXF1ZXN0LmRhdGEgPSBkYXRhO1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcCxcclxuICAgICAgICAgICAgICAgIGl0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdsaW5rZWRpbicgKSBzZWxmLm5leHQgPSAyNTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS52YWx1ZXMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdsaW5rZWRpbicpIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGRhdGEudmFsdWVzWyAwIF0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBtID0gZGF0YS52YWx1ZXMubGVuZ3RoOyBqIDwgbTsgaisrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc192YWwgPSBkYXRhLnZhbHVlc1sgaiBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VtbWFyeSA9IHRoaXNfdmFsLnN1bW1hcnkgfHwgJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZV9zdW1tYXJ5ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpc192YWwudXBkYXRlQ29udGVudCAhPT0gdW5kZWZpbmVkICYmIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZSAhPT0gdW5kZWZpbmVkICYmIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZS5jb250ZW50ICE9PSB1bmRlZmluZWQpIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gdGhpc192YWwudXBkYXRlQ29udGVudC5jdXJyZW50VXBkYXRlLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGNvbnRlbnQudGl0bGUgIT09IHVuZGVmaW5lZCAmJiBjb250ZW50LnN1Ym1pdHRlZFVybCAhPT0gdW5kZWZpbmVkICYmICEoL1xcLihqcGd8anBlZ3xwbmd8Ym1wfHRpZmZ8YXZpfG1wZWd8bWt2fG9nZ3xtb3Z8bXBlZ3xtcGd8bXBlfGZsdnwzZ3B8Z2lmKSQvaSkudGVzdChjb250ZW50LnRpdGxlKSApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeSA9ICc8YSBocmVmPVwiamF2YXNjcmlwdDo7XCIgb25DbGljaz1cIkVDLlVJLklBQihcXCcnICsgY29udGVudC5zdWJtaXR0ZWRVcmwgKyAnXFwnKTtcIj4nICsgY29udGVudC50aXRsZSArICc8L2E+ICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZGF0YVsgaiBdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc192YWwuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnPHA+PHNwYW4gY2xhc3M9XCJsbi1ncm91cC10aXRsZVwiPicgKyB0aGlzX3ZhbC50aXRsZSArICc6PC9zcGFuPjwvcD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeTogcHJlX3N1bW1hcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHN1bW1hcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21OYW1lOiAoIHRoaXNfdmFsLmNyZWF0b3IuZmlyc3ROYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3ByaXZhdGUnID8gdGhpc192YWwuY3JlYXRvci5maXJzdE5hbWUgOiB0aGlzX3ZhbC5jcmVhdG9yLmZpcnN0TmFtZSArICcgJyArIHRoaXNfdmFsLmNyZWF0b3IubGFzdE5hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpYzogdGhpc192YWwuY3JlYXRvci5waWN0dXJlVXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVUaW1lOiBwYXJzZUludCggdGhpc192YWwuY3JlYXRpb25UaW1lc3RhbXAgKSAvIDEwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21JZDogdGhpc192YWwuY3JlYXRvci5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiB0aGlzX3ZhbC5jb21tZW50cy5fdG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50OiB0aGlzX3ZhbC5jb21tZW50cy52YWx1ZXMgfHwgW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlrZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiB0aGlzX3ZhbC5saWtlcy5fdG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaWtlOiAoIHRoaXNfdmFsLmxpa2VzLnZhbHVlcyA9PT0gdW5kZWZpbmVkID8gW10gOiB0aGlzX3ZhbC5saWtlcy52YWx1ZXMuY3JlYXRvciApIHx8IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc2hpcDogdGhpc192YWwucmVsYXRpb25Ub1ZpZXdlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcl9saWtlczogdGhpc192YWwucmVsYXRpb25Ub1ZpZXdlci5pc0xpa2VkIHx8IFwiZmFsc2VcIlxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gMjU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YS5uZXh0VG9rZW47XHJcbiAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBkYXRhLmRhdGEuaXRlbXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKSBzZWxmLm5leHQgPSBkYXRhLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdwaW50ZXJlc3QnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT09ICdGQUlMJyB8fCAoIGRhdGEuZGF0YS5zdGF0dXMgJiYgZGF0YS5kYXRhLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnICkgKSBkYXRhLmRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSBkYXRhLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHBhZ2UgJiYgcGFnZS5jdXJzb3IgKSBzZWxmLm5leHQgPSBwYWdlLmN1cnNvcjtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBkYXRhLmRhdGEuZGF0YTsgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IGRhdGEucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5kYXRhICkgKSBpdGVtcyA9IFsgZGF0YS5kYXRhIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpdGVtcyA9IGRhdGEuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zLmxlbmd0aCA+IDAgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJykgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gaXRlbXNbIDAgXS5pZF9zdHI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ2xpbmtlZGluJyApIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ2dvb2dsZXBsdXMnICkgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gaXRlbXNbIDAgXS5wb3N0SUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3X2dyb3VwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGl0ZW1zWyBpIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogaXRlbXNbIGkgXS51c2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGl0ZW1zWyBpIF0uY3JlYXRlZF9hdCApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYXZvcml0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGl0ZW1zWyBpIF0uZmF2b3JpdGVfY291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5X21lOiBpdGVtc1sgaSBdLmZhdm9yaXRlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0d2VldHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGl0ZW1zWyBpIF0ucmV0d2VldF9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnlfbWU6IGl0ZW1zWyBpIF0ucmV0d2VldGVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogKCAoIGl0ZW1zWyBpIF0ucmV0d2VldGVkX3N0YXR1cyAhPT0gdW5kZWZpbmVkICkgPyBpdGVtc1sgaSBdLnJldHdlZXRlZF9zdGF0dXMuaWRfc3RyIDogaXRlbXNbIGkgXS5pZF9zdHIgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogaXRlbXNbIGkgXS50ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21OYW1lOiAoIGl0ZW1zWyBpIF0ubmFtZSB8fCBpdGVtc1sgaSBdLnVzZXIubmFtZSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiAoIGl0ZW1zWyBpIF0uc2NyZWVuX25hbWUgfHwgaXRlbXNbIGkgXS51c2VyLnNjcmVlbl9uYW1lICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpYzogKCBpdGVtc1sgaSBdLnByb2ZpbGVfaW1hZ2VfdXJsIHx8IGl0ZW1zWyBpIF0udXNlci5wcm9maWxlX2ltYWdlX3VybCApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RJRDogaXRlbXNbIGkgXS5pZF9zdHIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGl0ZW1zWyBpIF0uaWRfc3RyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd19kYXRhOiBpdGVtc1sgaSBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggaXRlbXNbIGkgXS5lbnRpdGllcyAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zWyBpIF0uZW50aXRpZXMubWVkaWEgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBpdGVtc1sgaSBdLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCApIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0gc2VsZi5nZXRfbWVkaWFfZGF0YSggaXRlbXNbIGkgXS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLmlkID09ICdsbl9jb21wYW5pZXMnICkgbmV3X2dyb3VwID0gbmV3IExpbmtlZGluRmVlZEl0ZW0oIGl0ZW1zWyBpIF0sIHNlbGYuZmVlZCApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0gc2VsZi5mZWVkLmZvcm1hdF9pdGVtKCBpdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHNlbGYuZmVlZC5mb3JtYXRfaXRlbSggaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAncGludGVyZXN0JyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSBzZWxmLmZlZWQuZm9ybWF0X2l0ZW0oIGl0ZW1zWyBpIF0gKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggaXRlbXNbIGkgXSwgc2VsZi5mZWVkICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWQuaXRlbXMucHVzaCggbmV3X2dyb3VwICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9tZWRpYV9kYXRhID0gZnVuY3Rpb24gKCBtZWRpYV91cmxzIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IFtdO1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtZWRpYV91cmxzLCBmdW5jdGlvbihtZWRpYV91cmwpe1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgIHNyYzogbWVkaWFfdXJsXHJcbiAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRHJvcGRvd25GZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCAnQ29sbGFwc2libGVGZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIERyb3Bkb3duRmVlZEl0ZW0sIENvbGxhcHNpYmxlRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBGYWNlYm9va0ZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggcHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSAhPT0gJ1VzZXInICYmIFsnd2FsbFBvc3RzJywnZmJfbm90aWZpY2F0aW9ucyddLmluZGV4T2YoIHN0cmVhbS5zdHJlYW1JZCApICE9PSAtMSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZlZWQgPSB0cnVlOyAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZhY2Vib29rRmVlZDtcclxuXHJcbiAgICAvKkZhY2Vib29rRmVlZC5wcm90b3R5cGUudXBkYXRlRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzIFxyXG4gICAgICAgICAgICAsY3VycmVudElEID0gc2VsZi51cGRhdGVJbnRlcnZhbElEO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TmV3c0ZlZWQnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHVybDogJy9hamF4LnBocCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKCBzZWxmLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3dhbGxQb3N0cyc6IHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnd2FsbFBvc3RzJzsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS53YWxsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmxpbWl0ID0gMTA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmJfbm90aWZpY2F0aW9ucyc6IHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnbm90aWZpY2F0aW9ucyc7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEubGltaXQgPSAxMDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbkJveCc6IHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnaW5Cb3gnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5hY3Rpb24gPSAnZ2V0RmJDb252ZXJzaW9ucyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCBzZWxmLnByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgPT09IFwiVXNlclwiKSByZXF1ZXN0LmRhdGEubmV4dCA9IFwiL2luYm94XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEubmV4dCA9IFwiL2NvbnZlcnNhdGlvbnNcIjtcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjdXBkYXRlRmVlZE5vdGlmaWNhdGlvbignICsgc2VsZi5pZCArICcpIHJlc3BvbnNlOicsICdjb2xvcjpvcmFuZ2VyZWQnKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggY3VycmVudElEID09PSBzZWxmLnVwZGF0ZUludGVydmFsSUQgKSAvLyBkaWRuJ3QgcmVmcmVzaCBkdXJpbmcgcmVxdWVzdFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3RJRCA9ICcjIyMnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmlyc3RJdGVtSUQgKSBmaXJzdElEID0gc2VsZi5maXJzdEl0ZW1JRDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZmlyc3RJRCA6OiAnICsgZmlyc3RJRCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbWluY29taW5nID0gW107IC8vIGluY29taW5nIG1lc3NhZ2VzIGFycmF5XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdpbkJveCcgJiYgZmlyc3RJRCAhPT0gJyMjIycgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXNlcklkID0gc2VsZi5wcm9maWxlLmRhdGEucGFnZUlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWVudHMgPSBkYXRhLmRhdGFbIGkgXS5jb21tZW50cy5jb21tZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGNvbW1lbnRzICkgKSBjb21tZW50cyA9IFsgY29tbWVudHMgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgayA9IDAsIGxsID0gY29tbWVudHMubGVuZ3RoOyBrIDwgbGw7IGsrKyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfY29tbWVudCA9IGNvbW1lbnRzWyBrIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19jb21tZW50LmZyb21JZCAhPT0gY3VzZXJJZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzX2NvbW1lbnQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogbmV3IERhdGUoIHRoaXNfY29tbWVudC5jcmVhdGVkVGltZS5zcGxpdCgnKycpWyAwIF0gKS5nZXRUaW1lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19jb21tZW50Lm1lc3NhZ2VJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggbWluY29taW5nICk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IG1pbmNvbWluZy5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuICggaXRlbS50aW1lID4gZmlyc3RJRCA/IDEgOiAwICk7fSkucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgKyBiOyB9LCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdpbkJveCBpbmRleCA9ICcgKyBpbmRleCApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gIG1pbmNvbWluZy5sZW5ndGggKSBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiBpdGVtLmlkO30pLmluZGV4T2YoIGZpcnN0SUQgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09IC0xIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggZmlyc3RJRCA9PT0gJyMjIycgKSBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2luZGV4IDo6ICcgKyBpbmRleCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpbmRleCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkaGVhZGVyID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWhlYWRlcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICwkZmJvZHkgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgJHVwZGF0ZV9ub3RpZiA9ICRmYm9keS5maW5kKCcudXBkYXRlLW5vdGlmaWNhdGlvbicpOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAkdXBkYXRlX25vdGlmLmxlbmd0aCA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmID0gJCgnPGRpdiBjbGFzcz1cInVwZGF0ZS1ub3RpZmljYXRpb25cIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZi5vbignY2xpY2snLCBmdW5jdGlvbiAoIGUgKXsgJGhlYWRlci5maW5kKCcucmVmcmVzaC1mZWVkJykudHJpZ2dlcignY2xpY2snKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRmYm9keS5maW5kKCcuZmVlZC1pdGVtJykuZmlyc3QoKS5iZWZvcmUoICR1cGRhdGVfbm90aWYgKTtcclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdpbkJveCcgKSAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IG1pbmNvbWluZy5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBNZXNzYWdlJyArICggaW5kZXggPT0gMSA/ICcnIDogJ3MnICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuaWQgPT09ICd3YWxsUG9zdHMnICkgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBkYXRhLmRhdGEubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgUG9zdCcgKyAoIGluZGV4ID09IDEgPyAnJyA6ICdzJyApICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBlbHNlICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gZGF0YS5kYXRhLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IE5vdGlmaWNhdGlvbicgKyAoIGluZGV4ID09IDEgPyAnJyA6ICdzJyApICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGNvbnNvbGUuZXJyb3IoJyEhISBjdXJyZW50SUQgISEhJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9OyovICBcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gcmVxdWVzdHMgZGF0YSBhbmQgdGhlbiBjYWxscyB0aGlzLnNhdmVfaXRlbXNcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbmV3c0ZlZWQnOiB0aGlzLmdldE5ld3NGZWVkKFwibmV3c0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd3YWxsUG9zdHMnOiB0aGlzLmdldE5ld3NGZWVkKFwid2FsbFBvc3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGFnZXNGZWVkJzogdGhpcy5nZXROZXdzRmVlZChcInBhZ2VzRmVlZFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2luQm94JzogdGhpcy5nZXRGYkNvbnZlcnNpb25zKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdoaWRkZW5fZ3JvdXBzJzogdGhpcy5maWxsRkJIaWRkZW5fR3JvdXBzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0aW1lbGluZSc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJ0aW1lbGluZVwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NlYXJjaCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJzZWFyY2hcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdvdXRyZWFjaCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJzZWFyY2hcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYl9ub3RpZmljYXRpb25zJzogdGhpcy5nZXROZXdzRmVlZChcIm5vdGlmaWNhdGlvbnNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYl9saWtlcyc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJmYl9saWtlc1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdmYl9saWtlcycgfHwgdGhpcy5pZCA9PSAnb3V0cmVhY2gnIHx8ICggdGhpcy5pZCA9PSAnbmV3c0ZlZWQnICYmICF0aGlzLm5leHQgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL3RoaXMuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpOyBcclxuICAgICAgICAgICAgLy90aGlzLmhpZGVfcHVsbHVwKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2RvRmJSZXF1ZXN0JyxcclxuICAgICAgICAgICAgICAgIHdhbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHJlYW06IHRoaXMuaWQsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBuZXh0OiB0aGlzLm5leHRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICduZXdzRmVlZCc6XHJcbiAgICAgICAgICAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzpcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpOyBcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAnd2FsbFBvc3RzJzpcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAvLyBjYXNlICdwYWdlc0ZlZWQnOlxyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ2luQm94JzpcclxuICAgICAgICAgICAgLy8gICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiKSBkYXRhLm5leHQgPSAnL2luYm94JztcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBlbHNlIGRhdGEubmV4dCA9ICcvY29udmVyc2F0aW9ucyc7XHJcbiAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaGlkZGVuX2dyb3Vwcyc6XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IHNlbGYuc3RyZWFtLnNlbGVjdGVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJHcm91cCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IHNlbGYubmV4dFxyXG4gICAgICAgICAgICAgICAgICAgIH07ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gIFxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZiX25vdGlmaWNhdGlvbnMnOlxyXG4gICAgICAgICAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnN0cmVhbSA9ICdub3RpZmljYXRpb25zJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZmJNb3JlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTsgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5uZXh0ID09IGRhdGEucGFnaW5nLm5leHQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugc2VsZi5uZXh0ID0gZGF0YS5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5nZXROZXdzRmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiBzdHJlYW0sXHJcbiAgICAgICAgICAgIGxpbWl0OiAxMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHN0cmVhbSA9PSAnd2FsbFBvc3RzJyB8fCBzdHJlYW0gPT0gJ2ZiX2luZmx1ZW5jZXMnIHx8IHN0cmVhbSA9PSAndGltZWxpbmUnICkgZGF0YS53YWxsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL25ld3MnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzdHJlYW0gPT0gJ3NlYXJjaCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUgPT09IHVuZGVmaW5lZCApIC8vZW1wdHkgc2VhcmNoIGZlZWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5ICE9PSB1bmRlZmluZWQgJiYgc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnkubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZWFyY2hfcmVxdWVzdCggc2VsZiwgZnVuY3Rpb24oIGRhdGEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9pZiggRUMucXVldWVfbGlzdFsgQmFzZTY0LmVuY29kZSggSlNPTi5zdHJpbmdpZnkoIHJlcXVlc3QgKSApIF0gIT09IHVuZGVmaW5lZCApIHJldHVybjtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVxdWVzdCk7XHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc3RyZWFtID09ICdub3RpZmljYXRpb25zJyAmJiBvYmoubWVzc2FnZS5pbmRleE9mKCd5b3UgZG8gbm90IGhhdmUgc3VmZmljaWVudCBwZXJtaXNzaW9uJykgIT0gLTEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxkaXYgY2xhc3M9XCJmZWVkLWl0ZW1cIj48ZGl2IGNsYXNzPVwiZmVlZC1hbGVydFwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0NsaWNrIFwiT0tcIiB0byBhZGQgRmFjZWJvb2sgTm90aWZpY2F0aW9uIEZlZWQuJyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJyZWZyZXNoXCI+T0s8L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5vbignY2xpY2snLCAnLnJlZnJlc2gnLCBmdW5jdGlvbiAoIGV2ZW50IClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkID0gc2VsZi5wcm9maWxlLmFjY291bnQuaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncmVmcmVzaCAnLCBpZCApXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVuZXdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5BZGRBY2NvdW50UG9wdXAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd05hbWU6ICdDb25uZWN0V2l0aE9BdXRoJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dPcHRpb25zOiAnZGlyZWN0b3JpZXM9MCxsb2NhdGlvbj0wLHN0YXR1cz0wLG1lbnViYXI9MCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJ2FjY291bnQvYWNjb3VudD9hY3Rpb249c2V0RXhwaXJlZEtleUJ5SUQmaWQ9JyAraWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDYwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDY1MFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5nZXRGYkNvbnZlcnNpb25zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRGYkNvbnZlcnNpb25zJyxcclxuICAgICAgICAgICAgc3RyZWFtOiAnaW5Cb3gnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggIXRoaXMubmV4dCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIikgZGF0YS5uZXh0ID0gXCIvaW5ib3hcIjtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgZGF0YS5uZXh0ID0gXCIvY29udmVyc2F0aW9uc1wiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBkYXRhLm5leHQgPSB0aGlzLm5leHQ7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9mYkNvbnZlcnNpb25zJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdXIgaW5ib3ggaXMgZW1wdHkuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5jb2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5maWxsRkJIaWRkZW5fR3JvdXBzID0gZnVuY3Rpb24gKClcclxuICAgIHsgICBcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgICBsID0gMDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCSGlkZGVuX0dyb3VwcycsXHJcbiAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwcycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5uZXh0ICkgZGF0YS5uZXh0X3Bvc3RzID0gXCJcIjtcclxuXHJcbiAgICAgICAgZWxzZSBkYXRhLm5leHRfcG9zdHMgPSB0aGlzLm5leHQ7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9mYkhpZGRlbkdyb3VwcycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZF9pZCxcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9uYW1lID0gJyc7XHJcbiAgICAgICAgICAgICAgICAvL2dldCBmaXJzdCBncm91cCBpZiBubyBzZWxlY3RlZFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCA9PSAnX2RlZmF1bHRfJyApLy8kLmlzRW1wdHlPYmplY3QoIHNlbGYuc3RyZWFtLnNlbGVjdGVkICkgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9pZCA9IG9iai5kYXRhWyAwIF0uaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9IG9iai5kYXRhWyAwIF0ubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHJlYW0uc2VsZWN0ZWQgPSBvYmouZGF0YVsgMCBdLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfaWQgPSBzZWxmLnN0cmVhbS5zZWxlY3RlZDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbCA9IG9iai5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGVjdGVkX2lkID09IG9iai5kYXRhWyBpIF0uaWQgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9IG9iai5kYXRhWyBpIF0ubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC10eXBlJykudGV4dCggJ0dyb3VwOiAnICsgc2VsZWN0ZWRfbmFtZSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogc2VsZWN0ZWRfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ6ICcnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybDogXCJmZWVkL2ZiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IGRhdGEucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBkYXRhLmRhdGEgKSApIGl0ZW1zID0gWyBkYXRhLmRhdGEgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaXRlbXMgPSBkYXRhLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGl0ZW1zICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5UaGlzIGdyb3VwXFwncyBkYXRhIGlzIHVuYXZhaWxhYmxlIGF0IHRoaXMgdGltZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7IFxyXG5cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsID0gb2JqLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuc3RyZWFtLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgc2VsZi5zdHJlYW0uc2VsZWN0ZWQuc3BsaXQoJywnKS5pbmRleE9mKCBvYmouZGF0YVsgaSBdLmlkICkgIT0gLTEgKSBvYmouZGF0YVsgaSBdLnNlbGVjdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBvYmouZGF0YVsgaSBdLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIHNlbGYuc3RyZWFtLnNlbGVjdGVkLnNwbGl0KCcsJykuaW5kZXhPZiggJ19kZWZhdWx0XycgKSAhPSAtMSApIG9iai5kYXRhWyAwIF0uc2VsZWN0ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmRlZmF1bHRHcm91cElkICE9PSB1bmRlZmluZWQgJiYgb2JqLmRlZmF1bHRHcm91cElkWzBdICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIG9iai5kZWZhdWx0R3JvdXBJZFswXSApIClcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0R3JvdXBJZFswXTsgXHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29iai5kYXRhOjo6Jyk7ICAgXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhvYmouZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7ICAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH0pOyAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuc2FtZV9tZWRpYV93aXRoX3ByZXZfaXRlbSA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGxlbmd0aCA9PT0gMCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgdmFyIHByZXZfaXRlbSA9IHRoaXMuaXRlbXNbIGxlbmd0aCAtIDEgXS5kYXRhO1xyXG5cclxuICAgICAgICBpZiAoIHByZXZfaXRlbSA9PT0gdW5kZWZpbmVkIHx8IHByZXZfaXRlbS5tZWRpYSA9PT0gdW5kZWZpbmVkIHx8IGRhdGEubWVkaWEgPT09IHVuZGVmaW5lZCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCBwcmV2X2l0ZW0ubWVkaWEudHlwZSA9PSBkYXRhLm1lZGlhLnR5cGUgJiYgcHJldl9pdGVtLm1lZGlhLmhyZWYgIT09IHVuZGVmaW5lZCAmJiBkYXRhLm1lZGlhLmhyZWYgIT09IHVuZGVmaW5lZCAmJiBwcmV2X2l0ZW0ubWVkaWEuaHJlZiA9PSBkYXRhLm1lZGlhLmhyZWYgKSBcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdTQU1FIE1FRElBJyk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5kaXIoIHByZXZfaXRlbSApO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycpIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycgJiYgIXRoaXMub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaXRlbXNbIDAgXSAhPT0gdW5kZWZpbmVkICkgZGF0YSA9IGRhdGEuY29uY2F0KCB0aGlzLml0ZW1zWyAwIF0uZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdpbkJveCcpIG5ld19mZWVkX2l0ZW0gPSBuZXcgQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuc2FtZV9tZWRpYV93aXRoX3ByZXZfaXRlbSggZGF0YVsgaSBdKSApIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnICYmICF0aGlzLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH0gXHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdmYl9saWtlcycgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ3NlYXJjaF9yZXF1ZXN0JyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ291dHJlYWNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLy0tLSBmb3IgbGl2ZSB1cGRhdGVcclxuICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdLCBjdXNlcklkID0gdGhpcy5wcm9maWxlLmRhdGEucGFnZUlkO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZGF0YTo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2luQm94JylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKmZvciAoIHZhciBrID0gMCwgbGwgPSBuZXdfZmVlZF9pdGVtLmRhdGEuY29tbWVudHMuY29tbWVudC5sZW5ndGg7IGsgPCBsbDsgaysrIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2NvbW1lbnQgPSBuZXdfZmVlZF9pdGVtLmRhdGEuY29tbWVudHMuY29tbWVudFsgayBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfY29tbWVudC5mcm9tSWQgIT09IGN1c2VySWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpc19jb21tZW50LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggdGhpc19jb21tZW50LmNyZWF0ZWRUaW1lLnNwbGl0KCcrJylbIDAgXSApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19jb21tZW50Lm1lc3NhZ2VJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0oIGRhdGFbIGkgXSkgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbWluY29taW5nLnNvcnQoIGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYS50aW1lID4gYi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA8IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pOyAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBmaW5kIGxhdGVzdCBpbmNvbWluZ1xyXG4gICAgICAgICAgICBpZiAoIG1pbmNvbWluZy5sZW5ndGggPiAwICkgdGhpcy5maXJzdEl0ZW1JRCA9IG1pbmNvbWluZ1sgMCBdLnRpbWU7XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuZmlyc3RJdGVtSUQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBGYWNlYm9va0ZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnJHVybFJvdXRlcicsICdFQycsICdhcGlVcmwnLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCAkdXJsUm91dGVyLCBFQywgYXBpVXJsICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBmZWVkID0gJyc7Ly9uZXcgRWxlbWVudCgnI2ZlZWQtdGVtcGxhdGUnKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGZlZWQuZWxlbWVudDtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmV0d29yayA9ICggcHJvZmlsZSA9PT0gdW5kZWZpbmVkID8gc3RyZWFtLm5ldHdvcmsgOiBwcm9maWxlLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uYW1lID0gc3RyZWFtLm5hbWUgfHwgc3RyZWFtLmlkO1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gc3RyZWFtLnN0cmVhbUlkO1xyXG5cclxuICAgICAgICB0aGlzLnNpemUgPSBzdHJlYW0uc2l6ZTtcclxuXHJcbiAgICAgICAgdGhpcy5mYXZvcml0ZWQgPSBzdHJlYW0uZmF2b3JpdGVkIHx8IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudmFsdWUgPSBzdHJlYW0udmFsdWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uZXh0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIDwtLSBbIEZlZWRJdGVtIF1cclxuXHJcbiAgICAgICAgdGhpcy5sYXN0X2xvYWRlZF90aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMubGFzdF9zY3JvbGxfcG9zaXRpb24gPSAwO1xyXG5cclxuICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG51bGw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyogcHJlcGFyZSBwYWdlX2lkICovXHJcbiAgICAgICAgdGhpcy5wYWdlX2lkID0gJ3RhYnMuJyArIHRoaXMuZ2V0X3BhZ2VfaWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5nZXRfcGFnZV9pZCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGlkID0gc2VsZi5pZCxcclxuICAgICAgICAgICAgcHJlZml4ID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkID0gc2VsZi5pZCArICdfJyArIHNlbGYucHJvZmlsZS5pZCArICdfJysgc2VsZi5uZXR3b3JrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKCBzZWxmLmlkID09ICdzZWFyY2gnIHx8IHNlbGYuaWQgPT0gJ3JzcycgfHwgc2VsZi5pZCA9PSAnb3V0cmVhY2gnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkID0gc2VsZi5uYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJlZml4ID0gJ2Zhdm9yaXRlJzsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMuc2VhcmNoIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICdzZWFyY2gnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnJzcyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmVmaXggPSAncnNzJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYoIHRoaXMubmV0d29yayA9PSAnY2luYm94JyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByZWZpeCA9ICdjaW5ib3gnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIHNlbGYucHJvZmlsZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gc2VsZi5wcm9maWxlLmlkO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIChwcmVmaXggKyAnLScgKyBpZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcGFnZSA9ICcnLFxyXG4gICAgICAgICAgICAgICAgZmVlZF9uYW1lID0gc2VsZi5uYW1lO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoICggc2VsZi5uZXR3b3JrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFjZWJvb2snOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEucGFnZU5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAndHdpdHRlcic6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5zcGVjaWZpZWRIYW5kbGVPckhhc2hUYWc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaW5zdGFncmFtJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLmZ1bGxOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ2xpbmtlZGluJzogcGFnZSA9IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbGlua2VkaW4nOiBwYWdlID0gc2VsZi5wcm9maWxlLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3lvdXR1YmUnOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEudXNlckZpcnN0TmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT0gJ3l0X215Q2hhbm5lbEhvbWUnICkgZmVlZF9uYW1lID0gJ0hvbWUgLSBBY3Rpdml0aWVzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdnb29nbGVwbHVzJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLmZ1bGxOYW1lLnNwbGl0KFwiKFwiKVswXTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaW50ZXJlc3QnOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuZnVsbE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnYmxvZ2dlcic6IHBhZ2UgPSB0aGlzLnByb2ZpbGUudXNlcm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSBwYWdlKyAnIC0gJyArZmVlZF9uYW1lO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnNlYXJjaCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gJ0N1c3RvbSBTZWFyY2ggRmVlZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMucnNzIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnUlNTIEZlZWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gKHRoaXMubmFtZSkuaW5kZXhPZignRmVlZCcpID49IDAgPyB0aGlzLm5hbWU6KHRoaXMubmFtZSArICcgRmVlZCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZi5wYWdlX3RpdGxlID0gZmVlZF90aXRsZTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coc2VsZi5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgdmFyIGdldEV4aXN0aW5nU3RhdGUgPSAkc3RhdGUuZ2V0KHNlbGYucGFnZV9pZCk7XHJcblxyXG4gICAgICAgIGlmKGdldEV4aXN0aW5nU3RhdGUgPT09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncGFnZV9pZDo6Oicrc2VsZi5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IHtcclxuICAgICAgICAgICAgICBcInVybFwiOiAnLycgKyBzZWxmLnBhZ2VfaWQgKyAnOm9iaicsXHJcbiAgICAgICAgICAgICAgY2FjaGU6dHJ1ZSxcclxuICAgICAgICAgICAgICBcInZpZXdzXCI6IHtcclxuICAgICAgICAgICAgICAgICdob21lLXRhYic6IHtcclxuICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3JhbS5odG1sXCIsXHJcbiAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiRmVlZHNcIixcclxuICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7b2JqOiBzZWxmfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICRzdGF0ZVByb3ZpZGVyUmVmLnN0YXRlKHNlbGYucGFnZV9pZCwgc3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICAgICAgICAgICR1cmxSb3V0ZXIubGlzdGVuKCk7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncGFnZV9pZDo6OjAwMDAwJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKSAvLyA8LS0gb3ZlcnJpZGVcclxuICAgIHtcclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSA9IG5ldyBGZWVkSXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhICkgLy8gPC0tIG92ZXJyaWRlXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSA9IG5ldyBGZWVkSXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5hcHBlbmRfaXRlbXMgPSBmdW5jdGlvbiAoIGFkZF9hZnRlcl9pbmRleCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQoIGFkZF9hZnRlcl9pbmRleCApLFxyXG4gICAgICAgICAgICAvLyRjb250YWluZXIgPSB0aGlzLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKSxcclxuICAgICAgICAgICAgY291bnQgPSAwO1xyXG4gICAgICAgXHJcblxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5zaG93X2l0ZW1zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZpbmFsOjo6Ojo6Ojo6Jyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2VsZi5pdGVtcyk7XHJcblxyXG5cclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuY2xlYXJGZWVkTm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKCByZW1vdmVfbWVzc2FnZSApXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmhpZGVfcHVsbHVwID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFRpbWVsaW5lRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubGlrZXMgPT09IHVuZGVmaW5lZCApIHRoaXMuZGF0YS5saWtlcyA9IHtjb3VudDogMH07XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhICE9PSB1bmRlZmluZWQgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uID0gdGhpcy5kYXRhLnJhd19kYXRhLmNvbnZlcnNhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29udmVyc2F0aW9uICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb252ZXJzYXRpb24udHdlZXRzICkgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uLnR3ZWV0cyA9IFsgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbi50d2VldHMgXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWFfY29udGVudCA9PT0gdW5kZWZpbmVkICkgdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpbWVsaW5lRmVlZEl0ZW07XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0TmFtZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBzZWxmLmRhdGEuZnJvbU5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXAgPSBwYXJzZUludCggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSxcclxuICAgICAgICAgICAgdGltZSA9ICcnO1xyXG5cclxuICAgICAgICB2YXIgbmV3X2RhdGUgPSBuZXcgRGF0ZSggdGltZXN0YW1wICogMTAwMCApLFxyXG4gICAgICAgICAgICBkYXRlID0gbmV3X2RhdGU7Ly8uZm9ybWF0KCdtbW0gZGQsIHl5eXksIGg6TU10dCcpO1xyXG5cclxuICAgICAgICBpZiAoICFpc05hTiggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ1RXRm9sbG93ZXJzJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gJ0AnICt0aGlzLmRhdGEudXNlcm5hbWU7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRpbWUgPSBkYXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayAhPT0gJ2ZhY2Vib29rJyB8fCAoIHRoaXMuZmVlZC5pZCAhPSAnc2VhcmNoJyAmJiB0aGlzLmZlZWQuaWQgIT09ICdvdXRyZWFjaCcgKSB8fCAoIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT09IHVuZGVmaW5lZCApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpbWUgPSAnQCcgK3RoaXMuZGF0YS51c2VybmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwYWdlJyB8fCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT0gJ3BsYWNlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gdGhpcy5kYXRhLmNhdGVnb3J5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGltZTtcclxuICAgIH07IFxyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIFRpbWVsaW5lRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnaW9uaWNBcHAuY29uc3RhbnRzJyxbXSkgIFxyXG4gIC5jb25zdGFudCgnYXBpVXJsJywgJ2h0dHBzOi8vZWNsaW5jaGVyLmNvbS9zZXJ2aWNlLycpXHJcbiAgLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHsgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyB9KTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdpb25pY0FwcC5jb250cm9sbGVycycsIFtdKVxyXG5cclxuLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkaW9uaWNMb2FkaW5nLCBBdXRoU2VydmljZSkge1xyXG5cclxuICAgICRzY29wZS5kYXRhID0ge307XHJcbiAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgLy8kc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG5cclxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coe1xyXG4gICAgICAgICAgICBub0JhY2tkcm9wOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICB2YXIgYSA9IEF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS5kYXRhLnVzZXJuYW1lLCAkc2NvcGUuZGF0YS5wYXNzd29yZCwgZnVuY3Rpb24ocmVzcCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnWlpaOicgKyByZXNwKTtcclxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbn0pXHJcblxyXG5cclxuLmNvbnRyb2xsZXIoJ0hvbWVUYWJDdHJsJywgZnVuY3Rpb24oJHN0YXRlLCAkc2NvcGUsICRyb290U2NvcGUsIEVDLCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJHVybFJvdXRlciwgXykge1xyXG5cclxuXHJcbiAgICBjb25zb2xlLmxvZygnQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBISEhISEjIyMjIycpO1xyXG4gICAgXHJcbiAgICBpZiggJHJvb3RTY29wZS5zb2NpYWwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgY29uc29sZS5sb2coJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIpO1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmVudGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdob21lJykpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuXHJcbiAgICAkc2NvcGUuZ3JvdXBzID0gW107XHJcbiAgICAkc2NvcGUuYWNjX3R5cGVzID0gW107XHJcblxyXG4gICAgaWYoIGFjY291bnRNYW5hZ2VyLmlzX3JlbmRlcmVkKCApIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnb29vb29vb29vb29vJyk7XHJcbiAgICAgICAgcHJlcGFyZUFjY291bnRzKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ25ubm5ubm5ubm5ubicpO1xyXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7bm9CYWNrZHJvcDogdHJ1ZX0pO1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmluaXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICBwcmVwYXJlQWNjb3VudHMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwcmVwYXJlQWNjb3VudHMoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBBQ0NTID0gYWNjb3VudE1hbmFnZXIubGlzdF9hY2NvdW50cygpO1xyXG5cclxuICAgICAgICB2YXIgdGVtcCA9IFtdLFxyXG4gICAgICAgICAgICBhY2NfdHlwZXMgPSBbXTtcclxuXHJcbiAgICAgICAgQUNDUy5mb3JFYWNoKGZ1bmN0aW9uKGFjY291bnQsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGVtcFt0eXBlXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdID0gW107XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdLnByb2ZpbGVzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9lbHNlXHJcbiAgICAgICAgICAgIC8ve1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjY291bnQucHJvZmlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChhY2NvdW50LnByb2ZpbGVzW2ldLm1vbml0b3JlZCA9PSAnb2ZmJykgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXS5wcm9maWxlcy5wdXNoKGFjY291bnQucHJvZmlsZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgdGVtcFt0eXBlXS50eXBlID0gdHlwZTtcclxuICAgICAgICAgICAgaWYgKGFjY190eXBlcy5pbmRleE9mKHR5cGUpID09PSAtMSkgYWNjX3R5cGVzLnB1c2godHlwZSk7XHJcblxyXG4gICAgICAgICAgICAvL3RlbXBbdHlwZV0ucHVzaCggeyd0eXBlJzp0eXBlLCAncHJvZmlsZXMnOmFjY291bnQucHJvZmlsZXN9ICk7XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZW1wKTtcclxuICAgICAgICAkc2NvcGUuZ3JvdXBzID0gdGVtcDtcclxuICAgICAgICAkc2NvcGUuYWNjX3R5cGVzID0gYWNjX3R5cGVzO1xyXG5cclxuICAgICAgICBhY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIHRydWUgKTtcclxuXHJcbiAgICAgICAgJHNjb3BlLm9wZW5GZWVkcyA9IGZ1bmN0aW9uKCBwcm9maWxlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2ZpbGUpO1xyXG4gICAgICAgICAgICBwcm9maWxlLnNvY2lhbC5yZW5kZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAkc2NvcGUuZ25zID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldCgndGFicy5yYW0tbmV3Jyk7XHJcblxyXG4gICAgICAgICAgaWYoZ2V0RXhpc3RpbmdTdGF0ZSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybjsgXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgIFwidXJsXCI6ICcvcmFtLW5ldycsXHJcbiAgICAgICAgICAgICAgXCJ2aWV3c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAnaG9tZS10YWInOiB7XHJcbiAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9yYW0uaHRtbFwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICRzdGF0ZVByb3ZpZGVyUmVmLnN0YXRlKCd0YWJzLnJhbS1uZXcnLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICAgICAgICAkdXJsUm91dGVyLmxpc3RlbigpO1xyXG5cclxuICAgICAgICAgICRzdGF0ZS5nbygndGFicy5yYW0tbmV3Jyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhnZXRFeGlzdGluZ1N0YXRlKTtcclxuICAgICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ01hbmFnZUFjY291bnRzJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsIEVDLCAkcm9vdFNjb3BlLCAkaW9uaWNIaXN0b3J5LCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJGxvY2FsU3RvcmFnZSkge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCJyk7XHJcbiAgICBjb25zb2xlLmxvZygnJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MnKTtcclxuICAgIGNvbnNvbGUubG9nKCRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzKTtcclxuICAgIC8vY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIudGVzdCgpKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ2hvbWUnKSk7XHJcblxyXG4gICAgJHNjb3BlLmFjY291bnRzID0gYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyggJHNjb3BlLmFjY291bnRzICk7XHJcblxyXG4gICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgIHZpZXdEYXRhLmhhc0hlYWRlckJhciA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLmFkZF9hY2NvdW50ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmFkZF9hY2NvdW50KHR5cGUpO1xyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuY3N0ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5hY2NvdW50cyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKSk7XHJcbiAgICAgICAgLy9hY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIGZhbHNlICk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ0ZlZWRzJywgZnVuY3Rpb24oJHNjb3BlLCAgJGlvbmljU2Nyb2xsRGVsZWdhdGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCBFQywgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQyEhISEhIyMjIyMnKTtcclxuICAgIC8vY29uc29sZS5sb2coJyRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzJyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyKTtcclxuICAgIC8vY29uc29sZS5sb2coJHN0YXRlLmN1cnJlbnQubmFtZSk7XHJcbiAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlRGF0YUNhbkJlTG9hZGVkID0gZmFsc2U7XHJcbiAgICAkc2NvcGUuY291bnRlciA9IDA7XHJcblxyXG4gICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiAkc3RhdGUuY3VycmVudC5uYW1lfSk7XHJcbiAgICAkc2NvcGUuZmVlZCA9ICRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgIFxyXG4gICAgXHJcbiAgICB2YXIgbmV4dF9wYWdlX2luZGV4ID0gMCxcclxuICAgICAgICBwcmV2X3BhZ2VfaW5kZXggPSAwLFxyXG4gICAgICAgIG5vX29mX3BhZ2VzID0gJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIubGVuZ3RoO1xyXG5cclxuICAgIGlmKCBpbmRleCA9PT0gMCApXHJcbiAgICB7XHJcbiAgICAgICAgbmV4dF9wYWdlX2luZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYoIGluZGV4ID09IChub19vZl9wYWdlcyAtIDEpIClcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSAwO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMjtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gaW5kZXggLSAxO1xyXG4gICAgfVxyXG5cclxuICAgICRzY29wZS5uZXh0X3BhZ2VfaWQgPSAkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcltuZXh0X3BhZ2VfaW5kZXhdLnBhZ2VfaWQ7XHJcbiAgICAkc2NvcGUucHJldl9wYWdlX2lkID0gJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXJbcHJldl9wYWdlX2luZGV4XS5wYWdlX2lkO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGluZGV4KTtcclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLnRlc3RfbmFtZSA9IFtdO1xyXG4gICAgJHNjb3BlLnRlc3RfbmFtZS5wdXNoKHsnbmFtZSc6J1JhbSd9KTtcclxuICAgICRzY29wZS5nZXRTY3JvbGxQb3NpdGlvbiA9IGZ1bmN0aW9uKCkgeyAgICAgICBcclxuICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgJHNjb3BlLmZlZWQuZGQgPSB7ICdjb3VudCc6MCwgJ2RhdGEnOltdLCAncGxhY2Vob2xkZXInOiAnJ307XHJcbiAgICAkc2NvcGUuc2VsZWN0ZWRfZGQgPSB7fTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoKCdmZWVkLmRyb3Bkb3duX2ZlZWQnLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYoICRzY29wZS5mZWVkLmRyb3Bkb3duX2ZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ01NTU1NTU1NTU1NTU1NTU1NJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkLmRyb3Bkb3duX29iaik7XHJcbiAgICAgICAgICAgICRzY29wZS5mZWVkLmRkID0gJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kcm9wZG93bigpO1xyXG5cclxuICAgICAgICAgICAgaWYoICEkc2NvcGUuZmVlZC5kZC5kYXRhLmxlbmd0aCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm1vcmVkYXRhID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZF9kZCA9ICRzY29wZS5mZWVkLmRkLmRhdGFbMF07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZmVlZC5pdGVtcycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5pdGVtcy5sZW5ndGggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0pKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKJyk7XHJcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoKCdmZWVkLmxvYWRfbW9yZV9mbGFnJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoICEkc2NvcGUuZmVlZC5sb2FkX21vcmVfZmxhZyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAkc2NvcGUubW9yZWRhdGEgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlZGF0YSA9IGZhbHNlO1xyXG5cclxuICAgICRzY29wZS5sb2FkTW9yZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYoICRzY29wZS5mZWVkLmRyb3Bkb3duX2ZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhICRzY29wZS5mZWVkLml0ZW1zLmxlbmd0aCAmJiAkc2NvcGUuY291bnRlciA9PSAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9sb2FkZWRfdGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5zZXRfZGVmYXVsdF9ncm91cF9pZCggJHNjb3BlLnNlbGVjdGVkX2RkICk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouZ2V0X2RhdGEoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xvYWQgbW9yZS4uLi4uLi4uLi4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICEgJHNjb3BlLmZlZWQuaXRlbXMubGVuZ3RoICYmICEgJHNjb3BlLmNvdW50ZXIgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5sYXN0X2xvYWRlZF90aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmdldF9kYXRhKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5tb3JlKCk7XHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAkc2NvcGUuY291bnRlcisrOyAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLnByb2Nlc3NERCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRfZGQpO1xyXG4gICAgICAgICRzY29wZS5mZWVkLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICRzY29wZS5jb3VudGVyID0gMTtcclxuICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuXHJcbiAgICAgICAgLy8kc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouc2V0X2RlZmF1bHRfZ3JvdXBfaWQoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgIC8vJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kYXRhKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmVudGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBkZWxlZ2F0ZSA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgnbWFpblNjcm9sbCcpO1xyXG4gICAgICAgIC8vZGVsZWdhdGUuc2Nyb2xsVG8oIDAsICRzY29wZS5mZWVkLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uICk7XHJcbiAgICAgICAgJHNjb3BlLiRwYXJlbnQuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgnZmVlZCcpKTtcclxuICAgIH0pO1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmJlZm9yZUxlYXZlXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgnbWFpblNjcm9sbCcpLmdldFNjcm9sbFBvc2l0aW9uKCk7XHJcbiAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9zY3JvbGxfcG9zaXRpb24gPSBwb3NpdGlvbi50b3A7XHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuXHJcbiAgICBcclxuXHJcbiAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUVudGVyJywgZnVuY3Rpb24oZXZlbnQsIHZpZXdEYXRhKSB7XHJcbiAgICAgICAgdmlld0RhdGEuZW5hYmxlQmFjayA9IHRydWU7XHJcbiAgICAgICAgdmlld0RhdGEuaGFzSGVhZGVyQmFyID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyh2aWV3RGF0YSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgYnYgPSAkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCk7XHJcblxyXG4gICAgJHNjb3BlLiRpb25pY0dvQmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLS0tLSycpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGJ2KTtcclxuXHJcbiAgICAgICAgaWYgKGJ2KSB7XHJcbiAgICAgICAgICAgICRpb25pY0hpc3RvcnkuZ29CYWNrKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLmhvbWUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcblxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdQdWJsaXNoaW5nJywgZnVuY3Rpb24oJHNjb3BlLCBFQywgYWNjb3VudE1hbmFnZXIpIHtcclxuXHJcbiAgICBcclxuXHJcbiAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdwdWJsaXNoaW5nJykpO1xyXG5cclxuICAgIFxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdQb3N0U2V0dGluZ3MnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIpIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgICAgICB2aWV3RGF0YS5lbmFibGVCYWNrID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgYnYgPSAkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCk7XHJcblxyXG4gICAgICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0tLS0tLJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGJ2KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAgICAgJGlvbmljSGlzdG9yeS5nb0JhY2soKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5saXN0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KVxyXG4gICAgLmNvbnRyb2xsZXIoJ0J1dHRvbnNUYWJDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsKSB7XHJcblxyXG4gICAgICAgICRzY29wZS5zaG93UG9wdXAgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJGlvbmljUG9wdXAuYWxlcnQoe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdQb3B1cCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnVGhpcyBpcyBpb25pYyBwb3B1cCBhbGVydCEnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnNob3dBY3Rpb25zaGVldCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkaW9uaWNBY3Rpb25TaGVldC5zaG93KHtcclxuICAgICAgICAgICAgICAgIHRpdGxlVGV4dDogJ0lvbmljIEFjdGlvblNoZWV0JyxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0ZhY2Vib29rJ1xyXG4gICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdUd2l0dGVyJ1xyXG4gICAgICAgICAgICAgICAgfSwgXSxcclxuICAgICAgICAgICAgICAgIGRlc3RydWN0aXZlVGV4dDogJ0RlbGV0ZScsXHJcbiAgICAgICAgICAgICAgICBjYW5jZWxUZXh0OiAnQ2FuY2VsJyxcclxuICAgICAgICAgICAgICAgIGNhbmNlbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NBTkNFTExFRCcpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0JVVFRPTiBDTElDS0VEJywgaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGRlc3RydWN0aXZlQnV0dG9uQ2xpY2tlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RFU1RSVUNUJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICB9KVxyXG5cclxuLmNvbnRyb2xsZXIoJ1NsaWRlYm94Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGlvbmljU2xpZGVCb3hEZWxlZ2F0ZSkge1xyXG4gICAgJHNjb3BlLm5leHRTbGlkZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRpb25pY1NsaWRlQm94RGVsZWdhdGUubmV4dCgpO1xyXG4gICAgfTtcclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdNZW51Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGlvbmljU2lkZU1lbnVEZWxlZ2F0ZSwgJGlvbmljTW9kYWwpIHtcclxuXHJcblxyXG4gICAgJHNjb3BlLnVwZGF0ZVNpZGVNZW51ID0gZnVuY3Rpb24obWVudSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG1lbnUpO1xyXG4gICAgICAgICRzY29wZS5tZW51SXRlbXMgPSBtZW51O1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgICRpb25pY01vZGFsLmZyb21UZW1wbGF0ZVVybCgndGVtcGxhdGVzL21vZGFsLmh0bWwnLCBmdW5jdGlvbihtb2RhbCkge1xyXG4gICAgICAgICRzY29wZS5tb2RhbCA9IG1vZGFsO1xyXG4gICAgfSwge1xyXG4gICAgICAgIGFuaW1hdGlvbjogJ3NsaWRlLWluLXVwJ1xyXG4gICAgfSk7XHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignQXBwQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS5tZW51SXRlbXMgPSBbXTtcclxuXHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2lvbmljQXBwLmRpcmVjdGl2ZXMnLCBbXSlcclxuXHJcbi5kaXJlY3RpdmUoJ3Bvc2l0aW9uQmFyc0FuZENvbnRlbnQnLCBmdW5jdGlvbigkdGltZW91dCkge1xyXG5cclxuIHJldHVybiB7XHJcbiAgICBcclxuICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICBzY29wZToge1xyXG4gICAgICAgIGRkRmVlZDogJz1kZEZlZWQnXHJcbiAgICB9LFxyXG5cclxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xyXG4gICAgICBcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKCdLQUtBS0FLQUtLQUtBS0FLOjo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Jyk7XHJcbiAgICAgIGNvbnNvbGUubG9nKHNjb3BlLmRkRmVlZCk7XHJcbiAgICAgIGRvUHJvY2VzcygpO1xyXG5cclxuICAgICAgc2NvcGUuJHdhdGNoKCdkZEZlZWQnLCBmdW5jdGlvbihudil7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0tBS0FLQUtBS0tBS0FLQUs6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OjonKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhudik7XHJcbiAgICAgICAgZG9Qcm9jZXNzKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgZnVuY3Rpb24gZG9Qcm9jZXNzKClcclxuICAgICAge1xyXG4gICAgICAgICAgdmFyIG9mZnNldFRvcCA9IDA7XHJcbiAgICAgICAgICB2YXIgcGxhdGZvcm0gPSAnaW9zJzsvLyRjb3Jkb3ZhRGV2aWNlLmdldFBsYXRmb3JtKCk7XHJcbiAgICAgICAgICBwbGF0Zm9ybSA9IHBsYXRmb3JtLnRvTG93ZXJDYXNlKCk7ICAgIFxyXG5cclxuXHJcbiAgICAgICAgICAvLyBHZXQgdGhlIHBhcmVudCBub2RlIG9mIHRoZSBpb24tY29udGVudFxyXG4gICAgICAgICAgdmFyIHBhcmVudCA9IGFuZ3VsYXIuZWxlbWVudChlbGVtZW50WzBdLnBhcmVudE5vZGUpO1xyXG5cclxuICAgICAgICAgIHZhciBtX2hlYWRlciA9ICBwYXJlbnRbMF0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYmFyLWhlYWRlcicpO1xyXG5cclxuICAgICAgICAgIC8vIEdldCBhbGwgdGhlIGhlYWRlcnMgaW4gdGhpcyBwYXJlbnRcclxuICAgICAgICAgIHZhciBzX2hlYWRlcnMgPSBwYXJlbnRbMF0uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYmFyLXN1YmhlYWRlcicpO1xyXG4gICAgICAgICAgdmFyIGlfY29udGVudCA9IHBhcmVudFswXS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW9uLWNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICBpZiggbV9oZWFkZXIubGVuZ3RoIClcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgb2Zmc2V0VG9wID0gbV9oZWFkZXJbMF0ub2Zmc2V0SGVpZ2h0ICsgKHBsYXRmb3JtID09ICdpb3MnPzIwOjApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggYWxsIHRoZSBoZWFkZXJzXHJcbiAgICAgICAgICBmb3IoeD0wO3g8c19oZWFkZXJzLmxlbmd0aDt4KyspXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgbm90IHRoZSBtYWluIGhlYWRlciBvciBuYXYtYmFyLCBhZGp1c3QgaXRzIHBvc2l0aW9uIHRvIGJlIGJlbG93IHRoZSBwcmV2aW91cyBoZWFkZXJcclxuICAgICAgICAgICAgaWYoeCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgc19oZWFkZXJzW3hdLnN0eWxlLnRvcCA9IG9mZnNldFRvcCArICdweCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIEFkZCB1cCB0aGUgaGVpZ2h0cyBvZiBhbGwgdGhlIGhlYWRlciBiYXJzXHJcbiAgICAgICAgICAgIG9mZnNldFRvcCA9IG9mZnNldFRvcCArIHNfaGVhZGVyc1t4XS5vZmZzZXRIZWlnaHQ7XHJcbiAgICAgICAgICB9ICAgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFBvc2l0aW9uIHRoZSBpb24tY29udGVudCBlbGVtZW50IGRpcmVjdGx5IGJlbG93IGFsbCB0aGUgaGVhZGVyc1xyXG4gICAgICAgICAgaV9jb250ZW50WzBdLnN0eWxlLnRvcCA9IG9mZnNldFRvcCArICdweCc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9OyAgXHJcbn0pXHJcblxyXG4uZGlyZWN0aXZlKCdoaWRlVGFicycsIGZ1bmN0aW9uKCRyb290U2NvcGUpIHtcclxuICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0EnLFxyXG4gICAgICBsaW5rOiBmdW5jdGlvbigkc2NvcGUsICRlbCkge1xyXG4gICAgICAgICAgJHJvb3RTY29wZS5oaWRlVGFicyA9ICd0YWJzLWl0ZW0taGlkZSc7XHJcbiAgICAgICAgICAkc2NvcGUuJG9uKCckZGVzdHJveScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICRyb290U2NvcGUuaGlkZVRhYnMgPSAnJztcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgfTtcclxufSlcclxuXHJcbi5kaXJlY3RpdmUoJ21hbmFnZUFjY291bnQnLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBhY2NvdW50OiAnPWFjY291bnQnXHJcbiAgICAgIH0sXHJcbiAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvbWFuYWdlLWFjY291bnQuaHRtbCcsXHJcbiAgICAgIGxpbms6ZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHNjb3BlLmN2ID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAgICAgYWxlcnQoNTUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUucmVmcmVzaEFjY291bnQgPSBmdW5jdGlvbiggb2JqICl7XHJcbiAgICAgICAgICAgIG9iai5yZWZyZXNoQWNjb3VudCgpO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5kZWxldGVBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxufSlcclxuXHJcbi5kaXJlY3RpdmUoJ21hbmFnZVByb2ZpbGUnLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBwcm9maWxlOiAnPXByb2ZpbGUnXHJcbiAgICAgIH0sXHJcbiAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvbWFuYWdlLXByb2ZpbGUuaHRtbCcsXHJcbiAgICAgIGxpbms6ZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHNjb3BlLnZhbGlkYXRlQ2hlY2sgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgICAgICAvL29iai5uZXdfa2V5ID0gJ2Zyb20gZGlyZWN0aXZlJztcclxuICAgICAgICAgICAgLy9hbGVydChvYmouZ2V0VXNlck5hbWUoKSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9iaik7XHJcbiAgICAgICAgICAgIG9iai51cGRhdGVfbW9uaXRvcihvYmoucHJvZmlsZV9jaGVja2VkKTtcclxuICAgICAgICAgIH07XHJcblxyXG5cclxuICAgICAgfVxyXG4gICAgfTtcclxufSlcclxuXHJcbi5kaXJlY3RpdmUoJ2ZlZWRJdGVtJywgZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgaXRlbTogJz1pdGVtJ1xyXG4gICAgICB9LFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXJlY3RpdmVzL2ZlZWQtaXRlbS5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUuY3YgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgICAgICBhbGVydCg1NSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuZGVsZXRlQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH07XHJcbn0pO1xyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPSBbJyRzdGF0ZVByb3ZpZGVyJywgJyR1cmxSb3V0ZXJQcm92aWRlcicsJyRpb25pY0NvbmZpZ1Byb3ZpZGVyJywgXHJcblx0ZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRpb25pY0NvbmZpZ1Byb3ZpZGVyKSB7XHJcblxyXG5cdFx0ICAkc3RhdGVQcm92aWRlclxyXG5cdFx0ICAgICAgLnN0YXRlKCdsb2dpbicsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxyXG5cdFx0ICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvbG9naW4uaHRtbFwiLFxyXG5cdFx0ICAgICAgICBjb250cm9sbGVyOiBcIkxvZ2luQ3RybFwiXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL21lbnVcIixcclxuXHRcdCAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcblx0XHQgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9tZW51Lmh0bWxcIixcclxuXHRcdCAgICAgICAgY29udHJvbGxlcjogJ01lbnVDdHJsJ1xyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIFxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmhvbWUnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvaG9tZVwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdob21lLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9ob21lLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdIb21lVGFiQ3RybCdcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMubWFuYWdlX2FjY291bnRzJywge1xyXG5cdFx0ICAgICAgXHR1cmw6IFwiL21hbmFnZV9hY2NvdW50c1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdob21lLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9tYW5hZ2VfYWNjb3VudHMuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ01hbmFnZUFjY291bnRzJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5wdWJsaXNoaW5nJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3B1Ymxpc2hpbmdcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAncHVibGlzaGluZy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcHVibGlzaC5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnUHVibGlzaGluZydcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMucG9zdF9zZXR0aW5ncycsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9wb3N0X3NldHRpbmdzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ3B1Ymxpc2hpbmctdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3Bvc3Rfc2V0dGluZ3MuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ1Bvc3RTZXR0aW5ncydcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaW5ib3gnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvaW5ib3hcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnaW5ib3gtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2luYm94Lmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5mZWVkcycsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9mZWVkc1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdmZWVkcy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvZmVlZHMuaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaXRlbScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9pdGVtXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2xpc3QtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2l0ZW0uaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmZvcm0nLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvZm9ybVwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdmb3JtLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9mb3JtLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgnbWVudS5rZXlib2FyZCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9rZXlib2FyZFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9rZXlib2FyZC5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAvKi5zdGF0ZSgnbWVudS5sb2dpbicsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9sb2dpbi5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pKi9cclxuXHRcdCAgICAgIC5zdGF0ZSgnbWVudS5zbGlkZWJveCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9zbGlkZWJveFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9zbGlkZWJveC5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnU2xpZGVib3hDdHJsJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgnbWVudS5hYm91dCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9hYm91dFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9hYm91dC5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pO1xyXG5cclxuXHRcdCAgICAvLyR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJtZW51L3RhYi9idXR0b25zXCIpO1xyXG5cdFx0ICAgIC8qaWYoICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhIClcclxuXHRcdCAgICB7XHJcblx0XHQgICAgXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwiL2hvbWVcIik7XHJcblx0XHQgICAgfVxyXG5cdFx0ICAgIGVsc2VcclxuXHRcdCAgICB7XHJcblx0XHQgICAgXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwibG9naW5cIik7XHJcblx0XHQgICAgfSovXHJcblx0XHQgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcImxvZ2luXCIpO1xyXG5cclxuXHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudGFicy5wb3NpdGlvbihcImJvdHRvbVwiKTsgLy9QbGFjZXMgdGhlbSBhdCB0aGUgYm90dG9tIGZvciBhbGwgT1NcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci5uYXZCYXIuYWxpZ25UaXRsZShcImNlbnRlclwiKTtcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci50YWJzLnN0eWxlKFwic3RhbmRhcmRcIik7XHJcblxyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnZpZXdzLm1heENhY2hlKDIwKTtcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci52aWV3cy50cmFuc2l0aW9uKCdub25lJyk7XHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MuZm9yd2FyZENhY2hlKHRydWUpO1xyXG5cdFx0ICAgIFxyXG5cdFx0ICAgICRzdGF0ZVByb3ZpZGVyUmVmID0gJHN0YXRlUHJvdmlkZXI7XHJcbiAgICAgIFx0XHQkdXJsUm91dGVyUHJvdmlkZXJSZWYgPSAkdXJsUm91dGVyUHJvdmlkZXI7XHJcblx0XHR9XHJcbl07IiwibW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnaW9uaWNBcHAuc2VydmljZXMnLCBbXSlcclxuXHJcbi5mYWN0b3J5KCdFQycsIEVDbGliKVxyXG5cclxuLy9zZXJ2aWNlIGZvciBhdXRoZW50aWNhdGlvblxyXG4uc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbigkcSwgJGh0dHAsIGFwaVVybCwgRUMpIHtcclxuXHJcbiAgICB2YXIgaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgIHZhciBMT0NBTF9UT0tFTl9LRVkgPSAndXNlcl9jcmVkZW50aWFscyc7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGxvYWRVc2VyQ3JlZGVudGlhbHMoKSB7XHJcbiAgICAgICAgdmFyIHVjID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKExPQ0FMX1RPS0VOX0tFWSk7XHJcbiAgICAgICAgaWYgKHVjKSB7XHJcbiAgICAgICAgICAgIHVzZUNyZWRlbnRpYWxzKHVjKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZVVzZXJDcmVkZW50aWFscyh1Yykge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTF9UT0tFTl9LRVksIHVjKTtcclxuICAgICAgICB1c2VDcmVkZW50aWFscyh1Yyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXNlQ3JlZGVudGlhbHModWMpIHtcclxuICAgICAgICBpc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVjKTtcclxuXHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgdWMgYXMgaGVhZGVyIGZvciB5b3VyIHJlcXVlc3RzIVxyXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLnVpZCA9IHVjLnVpZDtcclxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5hdXRob3JpemF0aW9uVG9rZW4gPSB1Yy5hdXRob3JpemF0aW9uVG9rZW47XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVzdHJveVVzZXJDcmVkZW50aWFscygpIHtcclxuICAgICAgICBpc0F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcclxuICAgICAgICAvLyRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLnVpZCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAvLyRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLmF1dGhvcml6YXRpb25Ub2tlbiA9IHVuZGVmaW5lZDtcclxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oTE9DQUxfVE9LRU5fS0VZKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbG9naW4gPSBmdW5jdGlvbihuYW1lLCBwYXNzd29yZCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgdmFyIHJlcSA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHVybDogYXBpVXJsICsgJ3VzZXIvbG9naW4nLFxyXG4gICAgICAgICAgICBkYXRhOntcclxuICAgICAgICAgICAgICAgICAgICAnZW1haWwnOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICdwYXNzd29yZCc6IHBhc3N3b3JkXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QocmVxKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCcyMjIyJyk7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdZWVlZWVlZWVknKTtcclxuICAgICAgICAgICAgICAgIC8vJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAvLyRpb25pY0hpc3RvcnkuY3VycmVudFZpZXcoJGlvbmljSGlzdG9yeS5iYWNrVmlldygpKTsvLyRpb25pY0hpc3RvcnkuY3VycmVudFZpZXcobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAvLyRzdGF0ZS5nbygnYXBwLnNhZmV0eUxlc3NvbnMnKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyX21zZykge1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnWlpaWlpaWlpaJyk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygnMzMzMycpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBsb2dvdXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBkZXN0cm95VXNlckNyZWRlbnRpYWxzKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGxvYWRVc2VyQ3JlZGVudGlhbHMoKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxvZ2luOiBsb2dpbixcclxuICAgICAgICBsb2dvdXQ6IGxvZ291dCxcclxuICAgICAgICBpc0F1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNBdXRoZW50aWNhdGVkO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuLmZhY3RvcnkoJ1VzZXJTZXR0aW5ncycsIHJlcXVpcmUoJy4vYXBwL3NldHRpbmdzLW1hbmFnZXInKSkgXHJcblxyXG4uZmFjdG9yeSgnQWNjb3VudCcsIHJlcXVpcmUoJy4vYXBwL2FjY291bnQnKSkgXHJcblxyXG4uZmFjdG9yeSgnUHJvZmlsZScsIHJlcXVpcmUoJy4vYXBwL3Byb2ZpbGUnKSkgXHJcblxyXG4uZmFjdG9yeSgnYWNjb3VudE1hbmFnZXInLCByZXF1aXJlKCcuL2FwcC9hY2NvdW50LW1hbmFnZXInKSkgXHJcblxyXG4uZmFjdG9yeSgnRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9mZWVkJykpIFxyXG5cclxuLmZhY3RvcnkoJ0ZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL0ZlZWRJdGVtJykpIFxyXG5cclxuLmZhY3RvcnkoJ1RpbWVsaW5lRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvdGltZWxpbmVGZWVkSXRlbScpKSBcclxuXHJcbi5mYWN0b3J5KCdEcm9wZG93bkZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2Ryb3Bkb3duRmVlZEl0ZW0nKSlcclxuXHJcbi5mYWN0b3J5KCdDb2xsYXBzaWJsZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2NvbGxhcHNpYmxlRmVlZEl0ZW0nKSlcclxuXHJcbi5mYWN0b3J5KCdGYWNlYm9va0ZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZmFjZWJvb2snKSlcclxuXHJcbi5mYWN0b3J5KCdzb2NpYWxNYW5hZ2VyJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsLW1hbmFnZXInKSkgXHJcblxyXG4uZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCh7XHJcbiAgICAgICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWRcclxuICAgICAgICAgICAgfVtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbigkaHR0cFByb3ZpZGVyKSB7XHJcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdBdXRoSW50ZXJjZXB0b3InKTtcclxufSk7XHJcbiJdfQ==
