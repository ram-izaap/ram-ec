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
require('./service-account-manager');
require('./service-social-manager');
require('./directives');

var $stateProviderRef = null;
var $urlRouterProviderRef = null;

angular.module('eclincher', [
                              'ionic', 
                              'eclincher.constants', 
                              'eclincher.controllers', 
                              'eclincher.services',
                              'eclincher.services.accountManager', 
                              'eclincher.services.socialManager', 
                              'eclincher.directives',
                              'ngStorage',
                              'ui.router',
                              'ngCordova',
                              'underscore'
                              ])

.config(require('./router'))

.run(require('./app-main'));
              
              
},{"./app-main":1,"./constants":26,"./controllers":27,"./directives":28,"./router":29,"./service-account-manager":30,"./service-social-manager":31,"./services":32}],3:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$rootScope', '$localStorage', 'EC', 'apiUrl', 'Account', 'UserSettings', '$cordovaInAppBrowser', function($rootScope, $localStorage, EC, apiUrl, Account, UserSettings, $cordovaInAppBrowser ){  

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
            url:  'account/accounts',
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

        $cordovaInAppBrowser.open( encodeURI(EC.getApiUrl()+path), '_blank', options);

        $rootScope.$on('$cordovaInAppBrowser:exit', function(e, event){
            accountManager.set_rendered( false );
        });
    };

    

    return this;

}];







},{}],4:[function(require,module,exports){


module.exports = ['EC', 'Profile', function(EC, Profile){

    function Account ( account_data )
    {
        var self = this;

        this.id = account_data.accountId;
        
        this.type = account_data.type;
        
        this.can_post = false;

        if ( this.type == 'Facebook' || this.type == 'Linkedin' || this.type == 'Twitter' || this.type == 'Blogger' || this.type == 'Pinterest' ) this.can_post = true;

        else if ( this.type == 'GooglePlus') this.can_post = true;

        else if ( this.type == 'Pinterest' && account_data.email !== undefined && account_data.password !== undefined && ! _.isEmpty( account_data.password ) ) this.can_post = true;

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
module.exports = ['EC', 'socialManager', function(EC, socialManager){

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

module.exports = [
                '$q',
                '$http',
                'apiUrl',
                '$localStorage',
                '$ionicLoading',
                function(
                  $q, 
                  $http, 
                  apiUrl, 
                  $localStorage, 
                  $ionicLoading )
  {

      var favorites = [],
            searches = [];
      this.request = function ( request )
      {
        $http.defaults.headers.common.user_data = $localStorage.user_data;
        $http.defaults.headers.common.is_mobile_app = '1';
        console.log('KKKK');
        return $q(function(resolve, reject) {

                //If the request url is not full-format , just append api-url
                if( request.url.indexOf(apiUrl) !== 0 )
                {
                    request.url = apiUrl+request.url;
                }

                if( request.method === undefined )
                  request.method = request.type;

                //$ionicLoading.show();

                if( request.method == 'GET' )
                {
                    request.params = request.data;
                }
                
                $http( request )
                    .then(function(response) 
                        {
                          //$ionicLoading.hide();
                          
                          var user_data = response.data;
                          console.log( response );
                          console.log( response.headers('ec_data') );
                          $localStorage.user_data = response.headers('ec_data');
                          

                          resolve(response.data);

                          
                        },
                        function() 
                        {
                          //$ionicLoading.hide();
                          reject( 'There is some connectivity issue .Please try again later.' );
                        }
                    );


            });
      };

      this.getApiUrl = function()
      {
        return apiUrl;
      };

      this.isEmptyObject = function( obj )
      { 
          for(var key in obj) 
          {
            if(obj.hasOwnProperty(key))
              return false;
          }
          
          return true;
      };

      this.getSideMenu = function( type )
      {
         var sideMenu = [];

         switch( type )
         {
            case 'home':
              
              sideMenu = [
                            {
                              label: 'Add & Manage Account',
                              action: 'tabs.manage_accounts'
                            },
                            {
                              label: 'Account Settings',
                              action: 'tabs.manage_accounts'
                            },
                            {
                              label: 'FAQ',
                              action: ''
                            },
                            {
                              label: 'Logout',
                              action: ''
                            }
                        ];

              break;

            case 'publishing':

              sideMenu = [
                            {
                              label: 'Account Settings',
                              action: 'tabs.manage_accounts'
                            },
                            {
                              label: 'Post Settings',
                              action: 'tabs.post_settings'
                            },
                            {
                              label: 'FAQ',
                              action: ''
                            },
                            {
                              label: 'Logout',
                              action: ''
                            }
                        ];

              break; 

            case 'feed':

              sideMenu = [
                            {
                              label: 'Settings',
                              action: 'tabs.feed_settings'
                            },
                            {
                              label: 'Add to Favorites',
                              action: 'tabs.feed_settings'
                            },
                            {
                              label: 'FAQ',
                              action: ''
                            },
                            {
                              label: 'Logout',
                              action: ''
                            }
                        ];

              break; 


         }

         return sideMenu;
      };

      this.getWatchCount = function()
      {
            var root = angular.element(document.getElementsByTagName('html'));

            var watchers = [];

            var f = function (element) {
                angular.forEach(['$scope', '$isolateScope'], function (scopeProperty) { 
                    if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
                        angular.forEach(element.data()[scopeProperty].$$watchers, function (watcher) {
                            watchers.push(watcher);
                        });
                    }
                });

                angular.forEach(element.children(), function (childElement) {
                    f(angular.element(childElement));
                });
            };

            f(root);

            // Remove duplicate watchers
            var watchersWithoutDuplicates = [];
            angular.forEach(watchers, function(item) {
                if(watchersWithoutDuplicates.indexOf(item) < 0) {
                     watchersWithoutDuplicates.push(item);
                }
            });

            return watchersWithoutDuplicates.length;
      };

      return this;              



  }];



},{}],7:[function(require,module,exports){
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







},{}],8:[function(require,module,exports){


module.exports = [
                    '$state', 
                    '$rootScope', 
                    '$urlRouter', 
                    'EC', 
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
                        $state, 
                        $rootScope, 
                        $urlRouter, 
                        EC, 
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



},{}],9:[function(require,module,exports){
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







},{}],10:[function(require,module,exports){
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







},{}],11:[function(require,module,exports){
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







},{}],12:[function(require,module,exports){
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







},{}],13:[function(require,module,exports){
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







},{}],14:[function(require,module,exports){
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







},{}],15:[function(require,module,exports){
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







},{}],16:[function(require,module,exports){
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







},{}],17:[function(require,module,exports){
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







},{}],18:[function(require,module,exports){
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







},{}],19:[function(require,module,exports){
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







},{}],20:[function(require,module,exports){
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







},{}],21:[function(require,module,exports){
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







},{}],22:[function(require,module,exports){
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







},{}],23:[function(require,module,exports){
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







},{}],24:[function(require,module,exports){
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







},{}],25:[function(require,module,exports){
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







},{}],26:[function(require,module,exports){
module.exports = angular.module('eclincher.constants',[])  
  .constant('apiUrl', 'https://eclincher.com/service/')
  .constant('AUTH_EVENTS', {  notAuthenticated: 'auth-not-authenticated' });
},{}],27:[function(require,module,exports){
module.exports = angular.module('eclincher.controllers', [])

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
},{}],28:[function(require,module,exports){
module.exports = angular.module('eclincher.directives', [])

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

          scope.fname = 'Rama!!!!!....';
          
          scope.refreshAccount = function( obj ){
            console.log(obj);
          };

          scope.deleteAccount = function( obj ){
            console.log(obj);
          };
      }
    };
});

},{}],29:[function(require,module,exports){

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
},{}],30:[function(require,module,exports){
/*
	Account Manager Services
*/

module.exports = angular.module('eclincher.services.accountManager', [])

		.factory('accountManager', require('./app/account/account-manager'))

		.factory('Account', require('./app/account/account')) 

		.factory('Profile', require('./app/account/profile'));
},{"./app/account/account":4,"./app/account/account-manager":3,"./app/account/profile":5}],31:[function(require,module,exports){
/*
	Social Manager Services
*/

module.exports = angular.module('eclincher.services.socialManager', [])

		.factory('socialManager', require('./app/social-manager'))

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

		.factory('FacebookFeed', require('./app/social/facebookFeed'))

		.factory('LinkedinFeed', require('./app/social/linkedinFeed'))

		.factory('TwitterFeed', require('./app/social/twitterFeed'))

		.factory('BloggerFeed', require('./app/social/bloggerFeed'))

		.factory('GooglePlusFeed', require('./app/social/googleplusFeed'))

		.factory('PinterestFeed', require('./app/social/pinterestFeed'))

		.factory('YouTubeFeed', require('./app/social/youTubeFeed'))

		.factory('InstagramFeed', require('./app/social/instagramFeed'));
},{"./app/social-manager":8,"./app/social/FeedItem":9,"./app/social/InstagramFeedItem":10,"./app/social/TwitterCollapsibleFeedItem":11,"./app/social/bloggerFeed":12,"./app/social/collapsibleFeedItem":13,"./app/social/dropdownFeedItem":14,"./app/social/facebookFeed":15,"./app/social/feed":16,"./app/social/googleplusFeed":17,"./app/social/instagramFeed":18,"./app/social/linkedinCollapsibleFeedItem":19,"./app/social/linkedinFeed":20,"./app/social/linkedinFeedItem":21,"./app/social/pinterestFeed":22,"./app/social/timelineFeedItem":23,"./app/social/twitterFeed":24,"./app/social/youTubeFeed":25}],32:[function(require,module,exports){
module.exports = angular.module('eclincher.services', [])

.factory('EC', require('./app/ec-utility'))

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

},{"./app/ec-utility":6,"./app/settings-manager":7}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3cvanMvYXBwLW1haW4uanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L2FjY291bnQtbWFuYWdlci5qcyIsInd3dy9qcy9hcHAvYWNjb3VudC9hY2NvdW50LmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L3Byb2ZpbGUuanMiLCJ3d3cvanMvYXBwL2VjLXV0aWxpdHkuanMiLCJ3d3cvanMvYXBwL3NldHRpbmdzLW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9JbnN0YWdyYW1GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL1R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvYmxvZ2dlckZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9jb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZhY2Vib29rRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9nb29nbGVwbHVzRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2luc3RhZ3JhbUZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9saW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9saW5rZWRpbkZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9saW5rZWRpbkZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvcGludGVyZXN0RmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3RpbWVsaW5lRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC90d2l0dGVyRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3lvdVR1YmVGZWVkLmpzIiwid3d3L2pzL2NvbnN0YW50cy5qcyIsInd3dy9qcy9jb250cm9sbGVycy5qcyIsInd3dy9qcy9kaXJlY3RpdmVzLmpzIiwid3d3L2pzL3JvdXRlci5qcyIsInd3dy9qcy9zZXJ2aWNlLWFjY291bnQtbWFuYWdlci5qcyIsInd3dy9qcy9zZXJ2aWNlLXNvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL3NlcnZpY2VzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4d0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDenVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL09BO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcdGZ1bmN0aW9uIEFwcE1haW4oJGlvbmljUGxhdGZvcm0sICRyb290U2NvcGUsICRzY29wZSkgXHJcblx0e1xyXG5cdCAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24oKSB7XHJcblx0ICAgIC8vIEhpZGUgdGhlIGFjY2Vzc29yeSBiYXIgYnkgZGVmYXVsdCAocmVtb3ZlIHRoaXMgdG8gc2hvdyB0aGUgYWNjZXNzb3J5IGJhciBhYm92ZSB0aGUga2V5Ym9hcmRcclxuXHQgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxyXG5cdCAgICBpZiAod2luZG93LmNvcmRvdmEgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucyAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XHJcblx0ICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcclxuXHQgICAgfVxyXG5cdCAgICBpZiAod2luZG93LlN0YXR1c0Jhcikge1xyXG5cdCAgICAgIC8vIG9yZy5hcGFjaGUuY29yZG92YS5zdGF0dXNiYXIgcmVxdWlyZWRcclxuXHQgICAgICAvL1N0YXR1c0Jhci5zdHlsZUxpZ2h0Q29udGVudCgpO1xyXG5cdCAgICB9XHJcbiAgXHQgIH0pO1xyXG5cclxuXHQgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50KXtcclxuXHQgIFx0JHJvb3RTY29wZS5jdXJyZW50U2NvcGUgPSAkc2NvcGU7XHJcblx0ICB9KTtcclxuXHJcbiAgXHQgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcywgZXJyb3IpIHtcclxuXHQgICBpZiAodG9TdGF0ZS5uYW1lID09ICd0YWJzLm1hbmFnZV9hY2NvdW50cycpIHtcclxuXHQgICAgICRyb290U2NvcGUuaGlkZVRhYnM9dHJ1ZTtcclxuXHQgICB9IGVsc2Uge1xyXG5cdCAgICAgJHJvb3RTY29wZS5oaWRlVGFicz1mYWxzZTtcclxuXHQgICB9XHJcblx0ICB9KTtcclxuICBcdH1cclxuXHJcbiAgXHRtb2R1bGUuZXhwb3J0cyA9IFsnJGlvbmljUGxhdGZvcm0nLCAnJHJvb3RTY29wZScsIEFwcE1haW5dOyIsInJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2UtYWNjb3VudC1tYW5hZ2VyJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2Utc29jaWFsLW1hbmFnZXInKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcycpO1xuXG52YXIgJHN0YXRlUHJvdmlkZXJSZWYgPSBudWxsO1xudmFyICR1cmxSb3V0ZXJQcm92aWRlclJlZiA9IG51bGw7XG5cbmFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXInLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW9uaWMnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuY29uc3RhbnRzJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLmNvbnRyb2xsZXJzJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLnNlcnZpY2VzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuc2VydmljZXMuYWNjb3VudE1hbmFnZXInLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuc2VydmljZXMuc29jaWFsTWFuYWdlcicsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2VjbGluY2hlci5kaXJlY3RpdmVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ1N0b3JhZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3VpLnJvdXRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdDb3Jkb3ZhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd1bmRlcnNjb3JlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSlcblxuLmNvbmZpZyhyZXF1aXJlKCcuL3JvdXRlcicpKVxuXG4ucnVuKHJlcXVpcmUoJy4vYXBwLW1haW4nKSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAiLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdBY2NvdW50JywgJ1VzZXJTZXR0aW5ncycsICckY29yZG92YUluQXBwQnJvd3NlcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEFjY291bnQsIFVzZXJTZXR0aW5ncywgJGNvcmRvdmFJbkFwcEJyb3dzZXIgKXsgIFxyXG5cclxuICAgIHZhciBpbml0aWFsaXplZCA9IGZhbHNlLFxyXG4gICAgICAgIGRhdGEgPSB7fSxcclxuICAgICAgICBhY2NvdW50cyA9IFtdLFxyXG4gICAgICAgIGFjY291bnRzX29yZGVyID0gW10sXHJcbiAgICAgICAgYWNjb3VudHNfYnlfaWQgPSB7fSxcclxuICAgICAgICBmYXZvcml0ZXNfYWNjb3VudCxcclxuICAgICAgICBzZWFyY2hfYWNjb3VudCxcclxuICAgICAgICByc3NfYWNjb3VudCxcclxuICAgICAgICBvdXRyZWFjaF9hY2NvdW50LFxyXG4gICAgICAgIGNpbmJveF9hY2NvdW50LFxyXG4gICAgICAgIGxhc3RfYWRkZWRfcHJvZmlsZSxcclxuICAgICAgICByZWZyZXNoX29uX2Nsb3NlID0gZmFsc2UsXHJcbiAgICAgICAgdGVtcGxhdGVfc2VsZWN0b3IgPSAnI2FjY291bnQtbWFuYWdlci10ZW1wbGF0ZSc7XHJcblxyXG4gICAgICAgIG1vZHVsZS5yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5nb19iYWNrX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5zZWFyY2hfcmVuZGVyZWQgPSBmYWxzZTtcclxuICAgICAgICBtb2R1bGUucnNzX3JlbmRlcmVkID0gZmFsc2U7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnYWNjb3VudE1hbmFnZXIgaW5pdCcpO1xyXG5cclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygkaHR0cCk7XHJcbiAgICAgICAgLy9yZXR1cm4gdGVtcGxhdGVfc2VsZWN0b3I7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9nZXQgYWNjb3VudHMgYW5kIHN0b3JlIGl0XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogICdhY2NvdW50L2FjY291bnRzJyxcclxuICAgICAgICAgICAgZGF0YTp7J25hbWUnOidyYW0nfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihzdG9yZV9hY2NvdW50cywgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RvcmVfYWNjb3VudHMgKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVzcG9uc2U6OjonKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhVc2VyU2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZSB8fCBbXSxcclxuICAgICAgICAgICAgICAgIGl0ZW1zID0gZGF0YS5hY2NvdW50IHx8IFtdLFxyXG4gICAgICAgICAgICAgICAgZmF2X2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3JjaF9sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJzc19sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG91dHJlYWNoX2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgYWNjX29yZGVyID0gZGF0YS5hY2NvdW50X29yZGVyIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYoIGRhdGEuc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5oYW5kbGVfc2V0dGluZ3MoIGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgdHJ1ZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBVc2VyU2V0dGluZ3MuYW5hbHl0aWNzX2dyb3VwcyA9IFtdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoIGRhdGEuYW5hbHl0aWNzR3JvdXBzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5hbmFseXRpY3NfZ3JvdXBzID0gZGF0YS5hbmFseXRpY3NHcm91cHMuYW5hbHl0aWNzR3JvdXA7XHJcbiAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkoIGl0ZW1zICkgKSBpdGVtcyA9IFsgaXRlbXMgXTtcclxuXHJcbiAgICAgICAgICAgIGFjY291bnRzID0gW107XHJcbiAgICAgICAgICAgIGFjY291bnRzX2J5X2lkID0ge307XHJcbiAgICAgICAgICAgIGFjY291bnRzX29yZGVyID0gYWNjX29yZGVyO1xyXG5cclxuICAgICAgICAgICAgLy9DcmVhdGUgYWNjb3VudC1vYmplY3QgZm9yIGVhY2ggYWNjb3VudHMgYW5kIHN0b3JlIGJ5IGlkIC5cclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gaXRlbXMubGVuZ3RoOyBpIDwgcDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBuZXdfYWNjb3VudCA9IG5ldyBBY2NvdW50KCBpdGVtc1sgaSBdICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBhY2NvdW50cy5wdXNoKCBuZXdfYWNjb3VudCApOyAvLyBpdGVyYWJsZVxyXG5cclxuICAgICAgICAgICAgICAgIGFjY291bnRzX2J5X2lkWyBuZXdfYWNjb3VudC5pZCBdID0gYWNjb3VudHNbIGxlbmd0aCAtIDEgXTsgLy8gaW5kZXhlZCBieSBhY2NvdW50IElELCByZWZlcmVuY2VzIGFjY291bnQgYnkgaW5kZXhcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FjY291bnRzOjo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFjY291bnRzKTtcclxuICAgICAgICAgICAgLy9pZiBjYWxsYmFjayBpcyB2YWxpZCBmdW5jdGlvbiwgdGhlbiBjYWxsIGl0XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnJlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLnJlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19mYXZvcml0ZV9yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfZmF2b3JpdGVfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfc2VhcmNoX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnNlYXJjaF9yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfc2VhcmNoX3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuc2VhcmNoX3JlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19yc3NfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUucnNzX3JlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9yc3NfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5yc3NfcmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldF9nb19iYWNrX2ZsYWcgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUuZ29fYmFja19mbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9nb19iYWNrX2ZsYWcgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5nb19iYWNrX2ZsYWcgPSBmbGFnO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5maW5kID0gZnVuY3Rpb24gKCBhY2NvdW50X2lkIClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYWNjb3VudHNfYnlfaWRbIGFjY291bnRfaWQgXTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRfcHJvZmlsZSA9IGZ1bmN0aW9uICggcHJvZmlsZV9pZCApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdmYXZvcml0ZXMnKSByZXR1cm4gKCBmYXZvcml0ZXNfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gZmF2b3JpdGVzX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnc2VhcmNoJykgcmV0dXJuICggc2VhcmNoX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IHNlYXJjaF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ3JzcycpIHJldHVybiAoIHJzc19hY2NvdW50ICE9PSB1bmRlZmluZWQgPyByc3NfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdvdXRyZWFjaCcpIHJldHVybiAoIG91dHJlYWNoX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IG91dHJlYWNoX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnY2luYm94JykgcmV0dXJuICggY2luYm94X2FjY291bnQgIT09IHVuZGVmaW5lZCA/IGNpbmJveF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGEgPSBhY2NvdW50cy5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBwID0gYWNjb3VudHNbIGkgXS5wcm9maWxlcy5sZW5ndGg7IGogPCBwOyBqKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19wcm9maWxlID0gYWNjb3VudHNbIGkgXS5wcm9maWxlc1sgaiBdO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfcHJvZmlsZS5pZCA9PSBwcm9maWxlX2lkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc19wcm9maWxlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApIFxyXG4gICAgeyBcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggYWNjb3VudHMgKTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gYWNjb3VudHM7IFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxpc3RfYWNjb3VudHMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGVtcCA9IFtdLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgYSA9IDA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGFjY291bnRzX29yZGVyLmxlbmd0aCA+IDAgKXtcclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGEgPSBhY2NvdW50c19vcmRlci5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgYWMgPSBhY2NvdW50cy5sZW5ndGg7IGogPCBhYzsgaisrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihhY2NvdW50c19vcmRlcltpXSA9PSBhY2NvdW50c1sgaiBdLnR5cGUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYWNjb3VudHNbIGogXS5oYXNfdW5leHBpcmVkX3Byb2ZpbGVzKCkgKSB0ZW1wLnB1c2goIGFjY291bnRzWyBqIF0gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGEgPSBhY2NvdW50cy5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGFjY291bnRzWyBpIF0uaGFzX3VuZXhwaXJlZF9wcm9maWxlcygpICkgdGVtcC5wdXNoKCBhY2NvdW50c1sgaSBdICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRlbXAuc29ydChmdW5jdGlvbiAoIGEsIGIgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGEgPCBiICkgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggYSA+IGIgKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggdGVtcCApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgcmV0dXJuIHRlbXA7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWRkX2FjY291bnQgPSBmdW5jdGlvbiggdHlwZSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEpO1xyXG4gICAgICAgIHZhciBjdXN0b21faGVhZGVycyA9ICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhIHx8IHt9LFxyXG4gICAgICAgICAgICBwYXRoID0gJ2FjY291bnQvYWNjb3VudD90eXBlPScgK3R5cGUrICcmbGY9ZmFsc2UnO1xyXG5cclxuICAgICAgICBjdXN0b21faGVhZGVycyA9IEpTT04ucGFyc2UoIGN1c3RvbV9oZWFkZXJzICk7XHJcblxyXG4gICAgICAgIHZhciBja2V5ID0gKGN1c3RvbV9oZWFkZXJzLmNsaWVudF9rZXkgIT09IHVuZGVmaW5lZCkgPyBKU09OLnN0cmluZ2lmeShjdXN0b21faGVhZGVycy5jbGllbnRfa2V5KTogJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcGF0aCArPSAnJnVzZXJfbmFtZT0nK2N1c3RvbV9oZWFkZXJzLnVzZXJfbmFtZSsnJnVzZXJfcGFzcz0nK2N1c3RvbV9oZWFkZXJzLnVzZXJfcGFzcysnJmNsaWVudF9rZXk9Jytja2V5KycmZGV2aWNlPWlvcyc7XHJcbiAgICAgICAgLy9hbGVydChlbmNvZGVVUkkoYXBpVXJsK3BhdGgpKTtcclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgIGxvY2F0aW9uOiAneWVzJyxcclxuICAgICAgICAgIGNsZWFyY2FjaGU6ICd5ZXMnLFxyXG4gICAgICAgICAgY2xlYXJzZXNzaW9uY2FjaGU6ICd5ZXMnLFxyXG4gICAgICAgICAgdG9vbGJhcnBvc2l0aW9uOiAndG9wJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRjb3Jkb3ZhSW5BcHBCcm93c2VyLm9wZW4oIGVuY29kZVVSSShFQy5nZXRBcGlVcmwoKStwYXRoKSwgJ19ibGFuaycsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJGNvcmRvdmFJbkFwcEJyb3dzZXI6ZXhpdCcsIGZ1bmN0aW9uKGUsIGV2ZW50KXtcclxuICAgICAgICAgICAgYWNjb3VudE1hbmFnZXIuc2V0X3JlbmRlcmVkKCBmYWxzZSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWydFQycsICdQcm9maWxlJywgZnVuY3Rpb24oRUMsIFByb2ZpbGUpe1xyXG5cclxuICAgIGZ1bmN0aW9uIEFjY291bnQgKCBhY2NvdW50X2RhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGFjY291bnRfZGF0YS5hY2NvdW50SWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy50eXBlID0gYWNjb3VudF9kYXRhLnR5cGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jYW5fcG9zdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMudHlwZSA9PSAnRmFjZWJvb2snIHx8IHRoaXMudHlwZSA9PSAnTGlua2VkaW4nIHx8IHRoaXMudHlwZSA9PSAnVHdpdHRlcicgfHwgdGhpcy50eXBlID09ICdCbG9nZ2VyJyB8fCB0aGlzLnR5cGUgPT0gJ1BpbnRlcmVzdCcgKSB0aGlzLmNhbl9wb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnR29vZ2xlUGx1cycpIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy50eXBlID09ICdQaW50ZXJlc3QnICYmIGFjY291bnRfZGF0YS5lbWFpbCAhPT0gdW5kZWZpbmVkICYmIGFjY291bnRfZGF0YS5wYXNzd29yZCAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBhY2NvdW50X2RhdGEucGFzc3dvcmQgKSApIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMudHlwZSA9PSAnTGlua2VkaW4nKSB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IDcwMDtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnVHdpdHRlcicpIHRoaXMuY2hhcmFjdGVyX2xpbWl0ID0gMTQwO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEgPSBhY2NvdW50X2RhdGEgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMucHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29uZmlnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb25maWcgKSApIHRoaXMucHJvZmlsZXMucHVzaCggbmV3IFByb2ZpbGUoIHRoaXMuZGF0YS5jb25maWcsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5jb25maWcuZm9yRWFjaChmdW5jdGlvbiAoIGl0ZW0gKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfcHJvZmlsZSA9IG5ldyBQcm9maWxlKCBpdGVtLCBzZWxmICk7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGVzLnB1c2goIG5ld19wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZXhwaXJlZCA9ICggYWNjb3VudF9kYXRhLm1vbml0b3JlZCA9PSAnZXhwaXJlZCcgPyB0cnVlIDogZmFsc2UgKTtcclxuICAgICAgICAvLyB0aGlzLmV4cGlyZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5oYXNfbW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMubW9uaXRvcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuaGFzX2V2ZW50c19tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5ldmVudHNfbW9uaXRvcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIEFjY291bnQucHJvdG90eXBlLmhhc191bmV4cGlyZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy51bmV4cGlyZWRfcHJvZmlsZXMoKS5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUubW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gdGhpcy5wcm9maWxlcy5sZW5ndGg7IGkgPCBwOyBpKysgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlc1sgaSBdLm1vbml0b3JlZCA9PSAnb24nKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuZXZlbnRzX21vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IHRoaXMucHJvZmlsZXMubGVuZ3RoOyBpIDwgcDsgaSsrICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZXNbIGkgXS5ldmVudHNNb25pdG9yZWQgPT0gJ29uJykgcHJvZmlsZXMucHVzaCggdGhpcy5wcm9maWxlc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZmlsZXM7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS51bmV4cGlyZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSB0aGlzLnByb2ZpbGVzLmxlbmd0aDsgaSA8IHA7IGkrKyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGVzWyBpIF0ubW9uaXRvcmVkICE9ICdvZmYnKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAnW29iamVjdCAnICt0aGlzLnR5cGUrICcgQWNjb3VudF0nO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBzd2l0Y2ggKCB0aGlzLnR5cGUudG9Mb3dlckNhc2UoKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogcmV0dXJuIDI7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dvb2dsZWFuYWx5dGljcyc6IHJldHVybiAzO1xyXG4gICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2xpbmtlZGluJzogcmV0dXJuIDQ7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IHJldHVybiA1O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogcmV0dXJuIDY7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IHJldHVybiA3O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdnb29nbGVwbHVzJzogcmV0dXJuIDg7XHJcbiAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnYmxvZ2dlcic6IHJldHVybiA5O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd0dW1ibHInOiByZXR1cm4gMTA7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3dvcmRwcmVzcyc6IHJldHVybiAxMTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAndmsnOiByZXR1cm4gMTI7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiAxMztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IFwiYWNjb3VudC9yZWZyZXNoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCJyZWZyZXNoQWNjb3VudFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLmlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjdGlvbiA9ICd1cGRhdGVQSUJvYXJkcyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblxyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKSBjYWxsYmFjayhmbGFnKTtcclxuXHJcbiAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmRlbGV0ZUFjY291bnQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogXCJhY2NvdW50L2RlbGV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IFwiZGVsZXRlQWNjb3VudEJ5SURcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICkgY2FsbGJhY2soZmxhZyk7XHJcblxyXG4gICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQWNjb3VudDtcclxuICAgIFxyXG59XTtcclxuXHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsnRUMnLCAnc29jaWFsTWFuYWdlcicsIGZ1bmN0aW9uKEVDLCBzb2NpYWxNYW5hZ2VyKXtcclxuXHJcblx0ZnVuY3Rpb24gUHJvZmlsZSAoIHByb2ZpbGVfZGF0YSwgYWNjb3VudCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0gcHJvZmlsZV9kYXRhIHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmFjY291bnQgPSBhY2NvdW50IHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gZGF0YS5zYW1wbGVJZDtcclxuXHJcbiAgICAgICAgdGhpcy5waWN0dXJlID0gKCBkYXRhLnByb2ZpbGVQaWN0dXJlID8gZGVjb2RlVVJJQ29tcG9uZW50KCBkYXRhLnByb2ZpbGVQaWN0dXJlICkgOiAnc3Nzc3Nzc3MnICk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSAhPT0gJ3BpbnRlcmVzdCcgKSB0aGlzLnBpY3R1cmUgPSB0aGlzLnBpY3R1cmUucmVwbGFjZSgnaHR0cDovLycsJy8vJyk7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5tb25pdG9yZWQgPT0gJ29uJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnb24nKSB0aGlzLm1vbml0b3JlZCA9ICdvbic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEubW9uaXRvcmVkID09ICdleHBpcmVkJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnZXhwaXJlZCcpIHRoaXMubW9uaXRvcmVkID0gJ2V4cGlyZWQnO1xyXG5cclxuICAgICAgICBlbHNlIHRoaXMubW9uaXRvcmVkID0gJ29mZic7XHJcblxyXG4gICAgICAgIHRoaXMucHJvZmlsZV9jaGVja2VkID0gdGhpcy5tb25pdG9yZWQgPT0gJ29uJyA/IHRydWU6ZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuZXZlbnRzTW9uaXRvcmVkID0gZGF0YS5ldmVudHNNb25pdG9yZWQ7XHJcblxyXG4gICAgICAgIC8vIHRoaXMubW9uaXRvcmVkID0gKCAoIGRhdGEubW9uaXRvcmVkID09ICdvbicgfHwgZGF0YS5zb2NpYWxNb25pdG9yZWQgPT0gJ29uJykgPyAnb24nIDogJ29mZicpO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBkYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSApICkgdGhpcy5zdHJlYW1zID0gZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW07XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgKSB0aGlzLnN0cmVhbXMgPSBbIGRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtICkgKSB0aGlzLnN0cmVhbXMgPSB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW07XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICkgdGhpcy5zdHJlYW1zID0gWyB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gXTtcclxuXHJcbiAgICAgICAgZWxzZSB0aGlzLnN0cmVhbXMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5zb2NpYWwgPSBuZXcgU29jaWFsKCBzZWxmICk7XHJcbiAgICAgICAgdGhpcy5zb2NpYWwgPSBuZXcgc29jaWFsTWFuYWdlciggc2VsZiApO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmFuYWx5dGljcyA9IG5ldyBBbmFseXRpY3MoIHNlbGYgKTtcclxuICAgICAgICAvL3RoaXMuYW5hbHl0aWNzID0gbmV3IGFuYWx5dGljc01hbmFnZXIoIHNlbGYgKTtcclxuXHJcbiAgICAgICAgdGhpcy5ncm91cHMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5ldHdvcmsgPSB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnVzZXJuYW1lID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubW9uaXRvcmVkID09PSAnb24nICYmIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2xpbmtlZGluJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qdmFyIHJlcV9kYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMuaWRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6ICdmZWVkL2xpbmtlZEluL2dyb3VwcycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiByZXFfZGF0YVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmogIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YSAhPT0gdW5kZWZpbmVkICkgc2VsZi5ncm91cHMgPSAoIEFycmF5LmlzQXJyYXkoIG9iai5kYXRhICkgPyBvYmouZGF0YS5zb3J0KGZ1bmN0aW9uKGEsYil7aWYoYS5uYW1lIDwgYi5uYW1lKSByZXR1cm4gLTE7aWYoYS5uYW1lID4gYi5uYW1lKSByZXR1cm4gMTtyZXR1cm4gMDt9KSA6IFsgb2JqLmRhdGEgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9KTsqL1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZmFjZWJvb2snICYmIGRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiIClcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5tb25pdG9yZWQgPT09ICdvbicgJiYgdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZmFjZWJvb2snKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLyp2YXIgcmVxX2RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJIaWRkZW5fR3JvdXBzJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0X3Bvc3RzOiAnJ1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgICAgICB1cmw6J2ZlZWQvZmJIaWRkZW5Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHJlcV9kYXRhXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBvYmogIT0gdW5kZWZpbmVkICYmIG9iai5kYXRhICE9IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5sZW5ndGggPiAwICkgc2VsZi5ncm91cHMgPSAoIEFycmF5LmlzQXJyYXkoIG9iai5kYXRhICkgPyBvYmouZGF0YS5zb3J0KGZ1bmN0aW9uKGEsYil7aWYoYS5uYW1lIDwgYi5uYW1lKSByZXR1cm4gLTE7aWYoYS5uYW1lID4gYi5uYW1lKSByZXR1cm4gMTtyZXR1cm4gMDt9KSA6IFsgb2JqLmRhdGEgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH0pOyovXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICd0d2l0dGVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0X2VsZW1lbnQ6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIGdldCBwcm9maWxlIExpc3RzXHJcbiAgICAgICAgICAgIC8vbW9kdWxlLmdldF90d19wcm9maWxlX2xpc3RzKHRoaXMvKiwgZnVuY3Rpb24oKXt9Ki8pOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5wb3dlclVzZXJzICkgdGhpcy5wb3dlcl91c2VycyA9IGRhdGEucG93ZXJVc2VycztcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5wb3dlcl91c2VycyA9IHtcclxuICAgICAgICAgICAgICAgIHN0YXRlOiAnb24nLFxyXG4gICAgICAgICAgICAgICAgbWVkaXVtTG93OiAnMjAwMCcsXHJcbiAgICAgICAgICAgICAgICBtZWRpdW1IaWdoOiAnNzUwMCcsXHJcbiAgICAgICAgICAgICAgICBoaWdoOiAnNzUwMCdcclxuICAgICAgICAgICAgfTsgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdpbnN0YWdyYW0nKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAneW91dHViZScpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdnb29nbGVwbHVzJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKCBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSA9PSAncGFnZScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvc3Rpbmdfb25seSA9IHRydWU7IFxyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IHByb2ZpbGVfZGF0YS5mdWxsTmFtZSArICcgKFBhZ2UpJztcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gJ2Z1bGxOYW1lJzsgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSAocHJvZmlsZV9kYXRhLmZ1bGxOYW1lICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZV9kYXRhLmZ1bGxOYW1lICE9PVwiXCIpP3Byb2ZpbGVfZGF0YS5mdWxsTmFtZS5zcGxpdChcIihcIilbMF0gKyAnIChVc2VyKSc6ICcoVXNlciknO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSAnZnVsbE5hbWUnOyAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lID0gcHJvZmlsZV9kYXRhLmZ1bGxOYW1lO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9ICdmdWxsTmFtZSc7XHJcblxyXG4gICAgICAgICAgICBpZiggcHJvZmlsZV9kYXRhLm9iamVjdFR5cGUgIT09IHVuZGVmaW5lZCAmJiBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSA9PSAndXNlcicgKSB0aGlzLnVzZXJuYW1lICs9ICcgKFVzZXIpJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zdGluZ19vbmx5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgKz0gJyAoQm9hcmQpJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnBhZ2VOYW1lICkgLy8gRkIgXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS50aXRsZSApIC8vIEdBXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5wcm9maWxlTmFtZSApIC8vIExOXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS51c2VyTmFtZSApIC8vIElHXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5zcGVjaWZpZWRIYW5kbGVPckhhc2hUYWcgKSAvLyBUV1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEuZnVsbE5hbWUgKSAvLyBHK1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEudXNlckZpcnN0TmFtZSApIC8vIFlUXHJcblxyXG4gICAgICAgIFsncGFnZU5hbWUnLCAndGl0bGUnLCAncHJvZmlsZU5hbWUnLCAndXNlckZpcnN0TmFtZScsICd1c2VyTmFtZScsICdzcGVjaWZpZWRIYW5kbGVPckhhc2hUYWcnLCAnZnVsbE5hbWUnXS5mb3JFYWNoKGZ1bmN0aW9uICggaXRlbSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGFbIGl0ZW0gXSAhPT0gdW5kZWZpbmVkICYmIHNlbGYudXNlcm5hbWUgPT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudXNlcm5hbWUgPSBkYXRhWyBpdGVtIF0gKyAnICc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYudXNlcm5hbWVfa2V5ID0gaXRlbTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gJ1tvYmplY3QgJyArdGhpcy5hY2NvdW50LnR5cGUrICcgUHJvZmlsZV0nO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VybmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUuaXNfZGlzcGxheV9wcm9maWxlID0gZnVuY3Rpb24oIGFsbF9mbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRpc3BsYXlfcHJvZmlsZSA9IHRydWUsXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIGFsbF9mbGFnID09PSB1bmRlZmluZWQgJiYgc2VsZi5tb25pdG9yZWQgPT09ICdvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyRhY2NvdW50LmVsZW1lbnQuZmluZCgnLmZ1bmN0aW9ucycpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAoIHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2dvb2dsZXBsdXMnICYmICFzZWxmLnBvc3Rpbmdfb25seSApIHx8IHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcgKSBcclxuICAgICAgICAgICAgeyBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTsgfSAvL2hpZGUgaW4gcG9zdCBtYW5hZ2VyXHJcbiAgICAgICAgfSBcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGFsbF9mbGFnID09PSB0cnVlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKSAmJiBzZWxmLnBvc3Rpbmdfb25seSApIFxyXG4gICAgICAgICAgICB7IGRpc3BsYXlfcHJvZmlsZSA9IGZhbHNlOyB9IC8vaGlkZSAgIFxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRpc3BsYXlfcHJvZmlsZSA9IHNlbGYucG9zdGluZ19vbmx5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRpc3BsYXlfcHJvZmlsZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUuZ2V0VXNlck5hbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IHRoaXMudXNlcm5hbWU7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5kYXRhLnRpdGxlICE9PSB1bmRlZmluZWQgKSAvLyBmb3JtYXQgbmFtZSBmb3IgR0FcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wID0gdXNlcm5hbWUuc3BsaXQoJygnKVswXSB8fCBzZWxmLnVzZXJuYW1lKyAnICc7XHJcblxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IHRlbXAuc3Vic3RyaW5nKDAsIHRlbXAubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdXNlcm5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnVwZGF0ZV9tb25pdG9yID0gZnVuY3Rpb24oIGZsYWcgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBmbGFnID0gKGZsYWcgIT09IHVuZGVmaW5lZCk/ZmxhZzpmYWxzZTtcclxuXHJcbiAgICAgICAgaWYoIHNlbGYuYWNjb3VudC50eXBlID09ICdHb29nbGVBbmFseXRpY3MnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFsZXJ0KCdnb29nbGUgYW5hbHl0aWNzLi4uLi4uLi4uLi4uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGYubW9uaXRvcmVkID0gZmxhZyA/ICdvbic6J29mZic7XHJcblxyXG4gICAgICAgICAgICBzYXZlX3Byb2ZpbGVfc2VsZWN0aW9uKGZ1bmN0aW9uKCBzdGF0dXMgKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0dXM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2F2ZV9wcm9maWxlX3NlbGVjdGlvbiggY2FsbGJhY2sgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOidQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDpcImFjY291bnQvc2luZ2xlcHJvZmlsZW1vbml0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NldFNpbmdsZVByb2ZpbGVNb25pdG9yZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgYWNjb3VudElEOiBzZWxmLmFjY291bnQuaWQsIHByb2ZpbGVJRDogc2VsZi5pZCwgY2hlY2tlZDogZmxhZyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApIGNhbGxiYWNrKGZsYWcpO1xyXG5cclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcblxyXG5cclxuICAgIHJldHVybiBQcm9maWxlO1xyXG5cclxufV07IiwiXHJcbm1vZHVsZS5leHBvcnRzID0gW1xyXG4gICAgICAgICAgICAgICAgJyRxJyxcclxuICAgICAgICAgICAgICAgICckaHR0cCcsXHJcbiAgICAgICAgICAgICAgICAnYXBpVXJsJyxcclxuICAgICAgICAgICAgICAgICckbG9jYWxTdG9yYWdlJyxcclxuICAgICAgICAgICAgICAgICckaW9uaWNMb2FkaW5nJyxcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAkcSwgXHJcbiAgICAgICAgICAgICAgICAgICRodHRwLCBcclxuICAgICAgICAgICAgICAgICAgYXBpVXJsLCBcclxuICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZSwgXHJcbiAgICAgICAgICAgICAgICAgICRpb25pY0xvYWRpbmcgKVxyXG4gIHtcclxuXHJcbiAgICAgIHZhciBmYXZvcml0ZXMgPSBbXSxcclxuICAgICAgICAgICAgc2VhcmNoZXMgPSBbXTtcclxuICAgICAgdGhpcy5yZXF1ZXN0ID0gZnVuY3Rpb24gKCByZXF1ZXN0IClcclxuICAgICAge1xyXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLnVzZXJfZGF0YSA9ICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhO1xyXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLmlzX21vYmlsZV9hcHAgPSAnMSc7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0tLS0snKTtcclxuICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgcmVxdWVzdCB1cmwgaXMgbm90IGZ1bGwtZm9ybWF0ICwganVzdCBhcHBlbmQgYXBpLXVybFxyXG4gICAgICAgICAgICAgICAgaWYoIHJlcXVlc3QudXJsLmluZGV4T2YoYXBpVXJsKSAhPT0gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC51cmwgPSBhcGlVcmwrcmVxdWVzdC51cmw7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoIHJlcXVlc3QubWV0aG9kID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICByZXF1ZXN0Lm1ldGhvZCA9IHJlcXVlc3QudHlwZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyRpb25pY0xvYWRpbmcuc2hvdygpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKCByZXF1ZXN0Lm1ldGhvZCA9PSAnR0VUJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5wYXJhbXMgPSByZXF1ZXN0LmRhdGE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICRodHRwKCByZXF1ZXN0IClcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1c2VyX2RhdGEgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCByZXNwb25zZSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCByZXNwb25zZS5oZWFkZXJzKCdlY19kYXRhJykgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YSA9IHJlc3BvbnNlLmhlYWRlcnMoJ2VjX2RhdGEnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCggJ1RoZXJlIGlzIHNvbWUgY29ubmVjdGl2aXR5IGlzc3VlIC5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmdldEFwaVVybCA9IGZ1bmN0aW9uKClcclxuICAgICAge1xyXG4gICAgICAgIHJldHVybiBhcGlVcmw7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmlzRW1wdHlPYmplY3QgPSBmdW5jdGlvbiggb2JqIClcclxuICAgICAgeyBcclxuICAgICAgICAgIGZvcih2YXIga2V5IGluIG9iaikgXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKVxyXG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmdldFNpZGVNZW51ID0gZnVuY3Rpb24oIHR5cGUgKVxyXG4gICAgICB7XHJcbiAgICAgICAgIHZhciBzaWRlTWVudSA9IFtdO1xyXG5cclxuICAgICAgICAgc3dpdGNoKCB0eXBlIClcclxuICAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdob21lJzpcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICBzaWRlTWVudSA9IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBZGQgJiBNYW5hZ2UgQWNjb3VudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3RhYnMubWFuYWdlX2FjY291bnRzJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBY2NvdW50IFNldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5tYW5hZ2VfYWNjb3VudHMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3B1Ymxpc2hpbmcnOlxyXG5cclxuICAgICAgICAgICAgICBzaWRlTWVudSA9IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBY2NvdW50IFNldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5tYW5hZ2VfYWNjb3VudHMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1Bvc3QgU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLnBvc3Rfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBicmVhazsgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdmZWVkJzpcclxuXHJcbiAgICAgICAgICAgICAgc2lkZU1lbnUgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLmZlZWRfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0FkZCB0byBGYXZvcml0ZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLmZlZWRfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBicmVhazsgXHJcblxyXG5cclxuICAgICAgICAgfVxyXG5cclxuICAgICAgICAgcmV0dXJuIHNpZGVNZW51O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5nZXRXYXRjaENvdW50ID0gZnVuY3Rpb24oKVxyXG4gICAgICB7XHJcbiAgICAgICAgICAgIHZhciByb290ID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdodG1sJykpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHdhdGNoZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goWyckc2NvcGUnLCAnJGlzb2xhdGVTY29wZSddLCBmdW5jdGlvbiAoc2NvcGVQcm9wZXJ0eSkgeyBcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5kYXRhKCkgJiYgZWxlbWVudC5kYXRhKCkuaGFzT3duUHJvcGVydHkoc2NvcGVQcm9wZXJ0eSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnQuZGF0YSgpW3Njb3BlUHJvcGVydHldLiQkd2F0Y2hlcnMsIGZ1bmN0aW9uICh3YXRjaGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXRjaGVycy5wdXNoKHdhdGNoZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudC5jaGlsZHJlbigpLCBmdW5jdGlvbiAoY2hpbGRFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZihhbmd1bGFyLmVsZW1lbnQoY2hpbGRFbGVtZW50KSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGYocm9vdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlIHdhdGNoZXJzXHJcbiAgICAgICAgICAgIHZhciB3YXRjaGVyc1dpdGhvdXREdXBsaWNhdGVzID0gW107XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3YXRjaGVycywgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaWYod2F0Y2hlcnNXaXRob3V0RHVwbGljYXRlcy5pbmRleE9mKGl0ZW0pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICB3YXRjaGVyc1dpdGhvdXREdXBsaWNhdGVzLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHdhdGNoZXJzV2l0aG91dER1cGxpY2F0ZXMubGVuZ3RoO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7ICAgICAgICAgICAgICBcclxuXHJcblxyXG5cclxuICB9XTtcclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdBY2NvdW50JywgJyRjb3Jkb3ZhSW5BcHBCcm93c2VyJywnXycsIGZ1bmN0aW9uKCRodHRwLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBBY2NvdW50LCAkY29yZG92YUluQXBwQnJvd3NlciwgXyApeyAgXHJcblxyXG4gICAgdmFyIGxpY2Vuc2VPcHRpb25zLFxyXG4gICAgICAgIHNldHRpbmdzLFxyXG4gICAgICAgIGlzX2V0c3lfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3dlZWJseV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfd2l4X3VzZXI9IGZhbHNlLFxyXG4gICAgICAgIGlzX2xleGl0eV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfc2hvcGlmeV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfYmlnY29tbWVyY2VfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGV4dGVybmFsQXBwcyA9IFtdLFxyXG4gICAgICAgIGZhdm9yaXRlcyA9IFtdLFxyXG4gICAgICAgIHNlYXJjaGVzID0gW10sXHJcbiAgICAgICAgdXNlcl9pbmJveF9maWx0ZXJzID0gW10sXHJcbiAgICAgICAgZ290X3NmID0gZmFsc2UsXHJcbiAgICAgICAgZ290X3NlYXJjaGVzID0gZmFsc2UsXHJcbiAgICAgICAgbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSAwLFxyXG4gICAgICAgIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSB0cnVlLFxyXG4gICAgICAgIGhpZGVFdmVudHNDb3VudGVyID0gZmFsc2UsXHJcbiAgICAgICAgZGlzcGxheUluYm94U2V0dGluZ3MgPSB0cnVlLFxyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZhbHNlLFxyXG4gICAgICAgIGFnZW5jeUNvbmZpZ3VyYXRpb24gPSB7fSxcclxuICAgICAgICBtYXhFdmVudFRpbWU7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmdldERpc3BsYXlJbmJveFNldHRpbmdzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZGlzcGxheUluYm94U2V0dGluZ3M7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0RGlzcGxheUluYm94U2V0dGluZ3MgPSBmdW5jdGlvbiAoIGRpc3BsYXkgKVxyXG4gICAge1xyXG4gICAgICAgIGRpc3BsYXlJbmJveFNldHRpbmdzID0gZGlzcGxheTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAoIG1heEV2ZW50VGltZSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKS5nZXRUaW1lKCkgOiBtYXhFdmVudFRpbWUgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoIHRpbWUgKVxyXG4gICAge1xyXG4gICAgICAgIG1heEV2ZW50VGltZSA9IHRpbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGhpZGU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0SGlkZUV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBoaWRlRXZlbnRzQ291bnRlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRIaWRlRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgaGlkZUV2ZW50c0NvdW50ZXIgPSBoaWRlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldE51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0TnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoIGNvbXBsZXRlZF9ldmVudHMgKVxyXG4gICAge1xyXG4gICAgICAgIG51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gY29tcGxldGVkX2V2ZW50cztcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJDb21wbGV0ZWRFdmVudHNDb3VudGVyKCk7IFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmdW5jdGlvbiAoIGZsYWcgKVxyXG4gICAge1xyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVuZGVyQ29tcGxldGVkRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICAvKnZhciAkaW5kaWNhdG9yID0gJCgnYm9keScpLmZpbmQoJy5uZXctZXZlbnRzLWluZGljYXRvcicpO1xyXG5cclxuICAgICAgICBpZiAoICRpbmRpY2F0b3IubGVuZ3RoID4gMCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICFoaWRlRXZlbnRzQ291bnRlciAmJiBhbGxfc2V0dGluZ3MubGljZW5zZVR5cGUgIT0gJ0ZyZWUnICYmIGFsbF9zZXR0aW5ncy5saWNlbnNlVHlwZSAhPSAnSW5kaXZpZHVhbCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICRpbmRpY2F0b3IuaGFzQ2xhc3MoJ3plcm8nKSApICRpbmRpY2F0b3IucmVtb3ZlQ2xhc3MoJ3plcm8nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkaW5kaWNhdG9yLnRleHQoIG51bWJlck9mQ29tcGxldGVkRXZlbnRzICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAhJGluZGljYXRvci5oYXNDbGFzcygnemVybycpICkgJGluZGljYXRvci50ZXh0KCcnKS5hZGRDbGFzcygnemVybycpOyAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0qL1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhZ2VuY3lDb25maWd1cmF0aW9uO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoIGFjIClcclxuICAgIHtcclxuICAgICAgICBhZ2VuY3lDb25maWd1cmF0aW9uID0gYWM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWdlbmN5QnJhbmRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYoIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50ID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcblxyXG4gICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KCBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudCApIClcclxuICAgICAgICAgICAgcmV0dXJuIFsgYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRVc2VyUGVybWlzc2lvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIHZhciBicmFuZHMgPSBtb2R1bGUuZ2V0QWdlbmN5QnJhbmRzKCksXHJcbiAgICAgICAgICAgIHBlcm1pc3Npb24gPSAnZWRpdCc7XHJcblxyXG4gICAgICAgIGlmKCAhYnJhbmRzLmxlbmd0aCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPGJyYW5kcy5sZW5ndGg7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggYnJhbmRzW2ldLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgYnJhbmRzW2ldLnNlbGVjdGVkID09ICcxJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBlcm1pc3Npb24gPSBicmFuZHNbaV0ucGVybWlzc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBlcm1pc3Npb247XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFuYWx5dGljc0FjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFBPU1QsXHJcbiAgICAgICAgICAgIHVybDogJ2FqYXgucGhwJyxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QW5hbHl0aWNzQWNjb3VudHMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZSggcmVzcG9uc2UgKTsgXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUFjY291bnRzID0gZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDpcImFqYXgucGhwXCIsXHJcbiAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOid1cGRhdGVBY2NvdW50cycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOmRhdGFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCByZXNwb25zZSA9PSBTVUNDRVNTKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoKTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlU2V0dGluZ3MgPSBmdW5jdGlvbiggZGF0YSwgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NhdmVTZXR0aW5ncycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggcmVzcG9uc2UucmV0dXJuQ29kZSA9PSBcIlNVQ0NFU1NcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmhhbmRsZV9zZXR0aW5ncyggcmVzcG9uc2Uuc2V0dGluZ3MsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCByZXNwb25zZSApO1xyXG4gICAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFNlYXJjaFN0cmVhbXMgPSBmdW5jdGlvbiggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KHsgdHlwZTpHRVQsIHVybDonZmVlZC9zZWFyY2hTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0U2VhcmNoU3RyZWFtcyd9fSwgZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGdvdF9zZiA9IHRydWU7XHJcbiAgICAgICAgICAgIHNlYXJjaGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmVkaXRTZWFyY2hTdHJlYW0gPSBmdW5jdGlvbiggc3RyZWFtLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBzdHJlYW0ucHJvZmlsZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICAgICAgdXJsOidmZWVkL3NlYXJjaFN0cmVhbXMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2VkaXRTZWFyY2hTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJlYW0uaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzdHJlYW0ucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc3RyZWFtLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogc3RyZWFtLnBhcmFtZXRlcnNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgIT09IHVuZGVmaW5lZCApIHJlcXVlc3QuZGF0YS5uYW1lID0gJ1NlYXJjaDogJyArIGRlY29kZVVSSUNvbXBvbmVudCggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgKTtcclxuXHJcbiAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRGYXZvcml0ZVN0cmVhbXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCh7IHR5cGU6R0VULCB1cmw6J2ZlZWQvZmF2b3JpdGVTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0RmF2b3JpdGVTdHJlYW1zJ319LCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgZmF2b3JpdGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGdvdF9mYXZlcyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZmF2b3JpdGVzICk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0RmF2b3JpdGVTdHJlYW1zIHJlc3BvbnNlOicpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mYXZvcml0ZXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIGdvdF9mYXZlcyApIHJldHVybiBmYXZvcml0ZXM7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNlYXJjaF9mZWVkcyA9IGZ1bmN0aW9uICggKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggZ290X3NmICkgcmV0dXJuIHNlYXJjaGVzO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTsgICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXR0aW5ncyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKSBcclxuICAgIHtcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggc2V0dGluZ3MgKTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldFNldHRpbmdzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpHRVQsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycgICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBoYW5kbGUgKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtb2R1bGUuaGFuZGxlX3NldHRpbmdzKHJlc3BvbnNlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGhhbmRsZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmhhbmRsZV9zZXR0aW5ncyA9IGZ1bmN0aW9uKCByZXNwb25zZSwgY2FsbGJhY2ssIGZsYWdfbm9fYWdlbmN5X3VwZGF0ZSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2hhbmRsZV9zZXR0aW5ncy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICBmbGFnX25vX2FnZW5jeV91cGRhdGUgPSBmbGFnX25vX2FnZW5jeV91cGRhdGUgPyBmbGFnX25vX2FnZW5jeV91cGRhdGU6ZmFsc2U7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gc2V0IG1vZHVsZSB2YXJpYWJsZVxyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGRhdGE7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MuYXBpVXNlciA9PT0gdW5kZWZpbmVkIHx8IF8uaXNFbXB0eSggc2V0dGluZ3MuYXBpVXNlciApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmFwaVVzZXIgPSBzZXR0aW5ncy5lbWFpbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9zZXQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICAgICAgICBpc193aXhfdXNlciA9IHNldHRpbmdzLndpeFVzZXI7XHJcbiAgICAgICAgICAgIG1heF9hbGxvd2VkX2dhX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZBY3RpdmVHb29nbGVBbmFseXRpY3NBY2NvdW50cztcclxuICAgICAgICAgICAgbWF4X2FsbG93ZWRfc29jaWFsX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZTb2NpYWxzT247XHJcbiAgICAgICAgICAgIHJlbV9kYXlzID0gc2V0dGluZ3MuZGF5c0xlZnQ7XHJcblxyXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4gICAgICAgICAgICAvL0VDLnNlc3Npb25EYXRhLnNldCgnYWxsX3NldHRpbmdzJywgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0IHNldHRpbmdzRGVmZXJyZWQgYXMgcmVzb2x2ZWQgb25seSBpZiBzZXR0aW5ncyBhdmFpbGFibGVcclxuICAgICAgICAgICAgLy9zZXR0aW5nc0RlZmVycmVkLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxpY2Vuc2VPcHRpb25zID0gZGF0YS5saWNlbnNlT3B0aW9ucztcclxuXHJcbiAgICAgICAgICAgIC8qaWYgKCBkYXRhLnVzZXJTb3VyY2UgPT0gXCJiaWdjb21tZXJjZVwiIHx8IGRhdGEubG9naW5UeXBlICE9ICd1c2VyUGFzc3dvcmQnKXtcclxuICAgICAgICAgICAgICAgICQoJy5jaGFuZ2VfcGFzcycpLmFkZENsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0qL1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM/ICggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzLnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEhpZGVFdmVudHNDb3VudGVyKCBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciA/ICggZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIikgOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXREaXNwbGF5SW5ib3hTZXR0aW5ncyggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA/ICggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKSA6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLm51bWJlck9mTmV3RXZlbnRzID09ICdzdHJpbmcnKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXROdW1iZXJPZkNvbXBsZXRlZEV2ZW50cyggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3coIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID8gKCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKTogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiA9PSAnb2JqZWN0Jyl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QWdlbmN5Q29uZmlndXJhdGlvbiggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5leHRlcm5hbEFwcHMhPT11bmRlZmluZWQgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gZXh0ZXJuYWxBcHBzID0gZGF0YS5leHRlcm5hbEFwcHM7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5leHRlcm5hbEFwcHMgKSApIGV4dGVybmFsQXBwcyA9IFsgZGF0YS5leHRlcm5hbEFwcHMgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGV4dGVybmFsQXBwcyA9IGRhdGEuZXh0ZXJuYWxBcHBzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnZXh0ZXJuYWxBcHBzJyApXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZXh0ZXJuYWxBcHBzIClcclxuXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEFwcHMuZm9yRWFjaChmdW5jdGlvbiAoIGV4dGVybmFsQXBwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBleHRlcm5hbEFwcC5leHRlcm5hbEFwcCApICkgZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHAgPSBbIGV4dGVybmFsQXBwLmV4dGVybmFsQXBwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcHAgPSBleHRlcm5hbEFwcC5leHRlcm5hbEFwcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdhcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggYXBwIClcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBhcHAuZm9yRWFjaChmdW5jdGlvbiAoIHRoaXNfYXBwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAndGhpc19hcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIHRoaXNfYXBwIClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2xleGl0eScpIGlzX2xleGl0eV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ3dlZWJseScpIGlzX3dlZWJseV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2V0c3knKSBpc19ldHN5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnc2hvcGlmeScpIGlzX3Nob3BpZnlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdiaWdjb21tZXJjZScpIGlzX2JpZ2NvbW1lcmNlX3VzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gIFxyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVfc2V0dGluZ3Nfd2luZG93ID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzV2luZG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHJlc3AuYWdlbmN5TnVtYmVyT2ZDbGllbnRzICE9PSB1bmRlZmluZWQgKSAkKCcucGxhbi11c2FnZSAuYnJhbmQtdXNhZ2UgLnZhbHVlJykudGV4dCggcmVzcC5hZ2VuY3lOdW1iZXJPZkFjdGl2ZUNsaWVudHMrICcvJyArcmVzcC5hZ2VuY3lOdW1iZXJPZkNsaWVudHMgKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0dGluZ3NXaW5kb3dOdW1iZXJzKCByZXNwICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldExpY2Vuc2VPcHRpb25zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbGljZW5zZU9wdGlvbnM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfZXRzeV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfZXRzeV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3dlZWJseV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfd2VlYmx5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfbGV4aXR5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19sZXhpdHlfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19zaG9waWZ5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19zaG9waWZ5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfYmlnY29tbWVyY2VfdXNlcj0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfYmlnY29tbWVyY2VfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRFeHRlcm5hbEFwcHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBleHRlcm5hbEFwcHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY2hlY2tMaWNlbnNlVmlldyA9IGZ1bmN0aW9uICggaWQsIGlzX3dpeCwgbWl4cGFuZWxfdHlwZSApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gaWYoIGxpY2Vuc2VPcHRpb25zLnZpZXcgIT0gdW5kZWZpbmVkICYmIGxpY2Vuc2VPcHRpb25zLnZpZXcgPT0gJzdELU9ubHknICYmIGlkICE9ICc3RCcpXHJcbiAgICAgICAgaWYgKCBmYWxzZSApIC8vIGVuYWJsZSBhbGwgdGltZWZyYW1lc1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8kKHdpbmRvdykudHJpZ2dlcigndXBncmFkZS1wb3B1cCcsIG1peHBhbmVsX3R5cGUpO1xyXG4gICAgICAgICAgICBzaG93VXBncmFkZVdpbmRvdyhpc193aXgpO1xyXG4gICAgICAgICAgICByZXR1cm4gRkFJTDsgICAgXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlIHJldHVybiBTVUNDRVNTOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X3VzZXJfaW5ib3hfdGFncyA9IGZ1bmN0aW9uKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFVzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBzdGFydFRpbWU6ICcwJyxcclxuICAgICAgICAgICAgZW5kVGltZTogJzAnLFxyXG4gICAgICAgICAgICByZXF1ZXN0X2FjdGlvbjogJ2dldFVzZXJUYWdzJyxcclxuICAgICAgICAgICAgbWF4RXZlbnRzOiAnMSdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogR0VULFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3VzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoudGFncyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIG9iai50YWdzICkgKSB1c2VyX2luYm94X3RhZ3MgPSBvYmoudGFncztcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTtcclxuICAgICAgICB9KTsgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmluYm94X3RhZ3MgPSBmdW5jdGlvbiAoIClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdXNlcl9pbmJveF90YWdzOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlX2luYm94X3RhZ3MgPSBmdW5jdGlvbiggdGFncywgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHRhZ3MgPSBBcnJheS5pc0FycmF5KCB0YWdzICkgP3RhZ3M6W107XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBQT1NULFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICd1c2VyL2V2ZW50cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6eyB0YWdzOiB0YWdzIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIG9iaiApe1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vSWYgc3VjY2VzcywgdXBkYXRlIHRhZ3MgYXJyYXlcclxuICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT0gJ1NVQ0NFU1MnIClcclxuICAgICAgICAgICAgICAgIHVzZXJfaW5ib3hfdGFncyA9IHRhZ3M7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFtcclxuICAgICAgICAgICAgICAgICAgICAnJHN0YXRlJywgXHJcbiAgICAgICAgICAgICAgICAgICAgJyRyb290U2NvcGUnLCBcclxuICAgICAgICAgICAgICAgICAgICAnJHVybFJvdXRlcicsIFxyXG4gICAgICAgICAgICAgICAgICAgICdFQycsIFxyXG4gICAgICAgICAgICAgICAgICAgICdGYWNlYm9va0ZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdMaW5rZWRpbkZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUd2l0dGVyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdCbG9nZ2VyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdHb29nbGVQbHVzRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1lvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAnUGludGVyZXN0RmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ0luc3RhZ3JhbUZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICckaW5qZWN0b3InLCBcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cmxSb3V0ZXIsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBFQywgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZhY2Vib29rRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIExpbmtlZGluRmVlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgVHdpdHRlckZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBCbG9nZ2VyRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdvb2dsZVBsdXNGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgWW91VHViZUZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBQaW50ZXJlc3RGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgSW5zdGFncmFtRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbmplY3RvciApXHJcbntcclxuXHJcbiAgICBmdW5jdGlvbiBTb2NpYWwoIHByb2ZpbGUgKVxyXG4gICAge1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlIHx8IHt9O1xyXG5cclxuICAgICAgICAvLyB0aGlzLmZlZWRzID0ge307XHJcbiAgICAgICAgdGhpcy5mZWVkc19pbl9vcmRlciA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJ2YWwgPSAwO1xyXG5cclxuICAgICAgICAvL0luYm94IGZpbHRlcnNcclxuICAgICAgICB0aGlzLnVzZXJfaW5ib3hfZmlsdGVycyA9IFtdOy8vZ2V0X3VzZXJfaW5ib3hfZmlsdGVycygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7IFxyXG4gICAgICAgIHRoaXMuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPSB0cnVlOyBcclxuICAgIH0gXHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5wYWdlcyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnBhZ2VzO1xyXG4gICAgfTtcclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZGlyKCB0aGlzICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiggY29udGFpbmVyICl7XHJcblxyXG4gICAgICAgIHZhciAkY29udGFpbmVyID0gY29udGFpbmVyIHx8ICQoJyNzb2NpYWwnKTtcclxuXHJcbiAgICAgICAgJGNvbnRhaW5lci5odG1sKCcnKTtcclxuICAgIH07XHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiggKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vQXNzaWduIGl0IHRvIGdsb2JhbCBvYmplY3QgXHJcbiAgICAgICAgLy93aW5kb3cuZ2xvYmFscy5zb2NpYWwgPSB0aGlzOyBcclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBwcmV2aW91c19mZWVkcyA9IFtdLFxyXG4gICAgICAgICAgICBuZXdfc3RyZWFtc19vcmRlciA9IFtdLFxyXG4gICAgICAgICAgICBwcmV2X2ZlZWRzX2luX29yZGVyID0gc2VsZi5mZWVkc19pbl9vcmRlcjtcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS5zb2NpYWwgPSBzZWxmO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIgPSBbXTtcclxuXHJcbiAgICAgICAgLy9nZXQgbmV3IHN0cmVhbXMgb3JkZXJcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goIHNlbGYucHJvZmlsZS5zdHJlYW1zLCBmdW5jdGlvbiggdGhpc19zdHJlYW0gKXtcclxuICAgICAgICAgICAgdmFyIGlkID0gKCBbJ3JzcycsICdzZWFyY2gnLCAnb3V0cmVhY2gnXS5pbmRleE9mKCB0aGlzX3N0cmVhbS5zdHJlYW1JZCApID4gLTEgKSA/IHRoaXNfc3RyZWFtLmlkIDogdGhpc19zdHJlYW0uc3RyZWFtSWQ7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiggc2VsZi5wcm9maWxlLmlkLmluZGV4T2YoJ2Zhdm9yaXRlJykgIT09IC0xIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQgKz0gJ18nICsgIHRoaXNfc3RyZWFtLnByb2ZpbGUuaWQgKyAnXycgKyB0aGlzX3N0cmVhbS5uZXR3b3JrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5ld19zdHJlYW1zX29yZGVyLnB1c2goIGlkICk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2cobmV3X3N0cmVhbXNfb3JkZXIpO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBzZWxmLnByb2ZpbGUuc3RyZWFtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfc3RyZWFtID0gc2VsZi5wcm9maWxlLnN0cmVhbXNbIGkgXSxcclxuICAgICAgICAgICAgICAgIGlkID0gKCBbJ3JzcycsICdzZWFyY2gnLCAnb3V0cmVhY2gnXS5pbmRleE9mKCB0aGlzX3N0cmVhbS5zdHJlYW1JZCApID4gLTEgKSA/IHRoaXNfc3RyZWFtLmlkIDogdGhpc19zdHJlYW0uc3RyZWFtSWQsXHJcbiAgICAgICAgICAgICAgICBuZXR3b3JrID0gc2VsZi5wcm9maWxlLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfc3RyZWFtLnZhbHVlID09ICd0cnVlJyAgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQUFBOjonK25ldHdvcmspO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICggbmV0d29yayApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZhY2Vib29rJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGQiB0ZXN0Ojo6Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IEZhY2Vib29rRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdsaW5rZWRpbic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IExpbmtlZGluRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IFR3aXR0ZXJGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgQmxvZ2dlckZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ29vZ2xlcGx1cyc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBHb29nbGVQbHVzRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IFlvdVR1YmVGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBQaW50ZXJlc3RGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBJbnN0YWdyYW1GZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGdldEV4aXN0aW5nU3RhdGUgPSAkc3RhdGUuZ2V0KG5ld19mZWVkLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggbmV3X2ZlZWQgJiYgJHN0YXRlLmdldChuZXdfZmVlZC5wYWdlX2lkKSA9PT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIucHVzaCggbmV3X2ZlZWQgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmV3X2ZlZWQucmVuZGVyID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZC5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy92YXIgJG5ld19mZWVkID0gbmV3X2ZlZWQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vJGNvbnRhaW5lci5hcHBlbmQoICRuZXdfZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBuZXdfZmVlZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHByZXZfZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IG5ld19mZWVkLnBhZ2VfaWR9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiggaW5kZXggPj0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyLnB1c2gocHJldl9mZWVkc19pbl9vcmRlcltpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB1cGRhdGVkX3N0cmVhbXNfb3JkZXIgPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5mZWVkc19pbl9vcmRlciwgZnVuY3Rpb24odGhpc19mZWVkKXtcclxuICAgICAgICAgICAgdXBkYXRlZF9zdHJlYW1zX29yZGVyLnB1c2godGhpc19mZWVkLnBhZ2VfaWQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgICAgIC8vRGVjaWRlIHRoZSBmZWVkIHBhZ2UgdG8gc2hvdyBieSBkZWZhdWx0XHJcbiAgICAgICAgdmFyIGZlZWRfcGFnZV90b19zaG93ID0gJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy90byBtYWludGFpbiBsYXN0IGZlZWQtc2VsZWN0b3IgcG9zaXRpb25cclxuICAgICAgICBpZiggc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciAmJiBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgPT09IDAgKSBcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlcltzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3JdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKCBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yXTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPT09IGZhbHNlICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlclt1cGRhdGVkX3N0cmVhbXNfb3JkZXIubGVuZ3RoLTFdO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vYXNzaWduIHVwZGF0ZWQgc3RyZWFtcyB0byBjdXJyZW50IG9iamVjdFxyXG4gICAgICAgIHNlbGYudXBkYXRlZF9zdHJlYW1zX29yZGVyID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyO1xyXG5cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0T2JqKGlkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHNlbGYuZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IGlkfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qY29uc29sZS5sb2coJ3VwZGF0ZWRfc3RyZWFtc19vcmRlcicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVwZGF0ZWRfc3RyZWFtc19vcmRlcik7XHJcbiAgICAgICAgY29uc29sZS5sb2coZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGdldE9iaihmZWVkX3BhZ2VfdG9fc2hvdykpOyovXHJcbiAgICAgICAgdmFyIGN1cnJlbnRfb2JqID0geyduYW1lJzoncmFtJ307Ly9nZXRPYmooZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG5cclxuICAgICAgICAkc3RhdGUuZ28oZmVlZF9wYWdlX3RvX3Nob3csIHtvYmo6Y3VycmVudF9vYmp9LCB7Y2FjaGU6IHRydWV9KTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ3RoaXMuZmVlZHNfaW5fb3JkZXInKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmZlZWRzX2luX29yZGVyKTtcclxuICAgICAgICByZXR1cm4gdGhpczsgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcbiAgICBcclxuXHJcblxyXG4gICAgXHJcblxyXG5cclxuICAgIHJldHVybiBTb2NpYWw7XHJcbn1dO1xyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBmZWVkX2l0ZW0gPSAnJztcclxuXHJcbiAgICAgICAgc2VsZi5kYXRhID0gaXRlbV9kYXRhO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZCA9IGZlZWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5wcm9maWxlID0gZmVlZC5wcm9maWxlO1xyXG5cclxuICAgICAgICBzZWxmLmVsZW1lbnQgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBGZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIEZlZWRJdGVtID0gIEZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBJbnN0YWdyYW1GZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICBcclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEluc3RhZ3JhbUZlZWRJdGVtO1xyXG4gICBcclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cztcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyQ29tbWVudCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlckNvbW1lbnQ7XHJcbiAgIFxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5hZGRfY29tbWVudCA9IGZ1bmN0aW9uICggbWVzc2FnZSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGh0X2V4cCA9IC9cXEIjKFxcdypbYS16QS1aXStcXHcqKS9pZyxcclxuICAgICAgICAgICAgbGlua3NfZXhwID0gLyhcXGIoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC9bLUEtWjAtOSsmQCNcXC8lPz1+X3whOiwuO10qWy1BLVowLTkrJkAjXFwvJT1+X3xdKS9pZztcclxuXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBJbnN0YWdyYW1GZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIENvbGxhcHNpYmxlRmVlZEl0ZW0gPSAgQ29sbGFwc2libGVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdDb2xsYXBzaWJsZUZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgQ29sbGFwc2libGVGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmFkZF9jb21tZW50ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuYWRkX2NvbW1lbnQ7XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmRlbGV0ZV9tZXNzYWdlID0gZnVuY3Rpb24gKCAkdHdlZXQsIGlkIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cclxuICAgICAgICB2YXIgdGV4dCA9ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgcG9zdCA/JztcclxuICAgICAgICBcclxuIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUucmV0d2VldCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQ7XHJcblxyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gQmxvZ2dlckZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQmxvZ2dlckZlZWQ7XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2JsX2FsbCc6IHRoaXMuZ2V0QmxvZ1Bvc3RzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuZ2V0QmxvZ1Bvc3RzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRCbG9nZ2VyUG9zdHMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZFxyXG4gICAgICAgICAgICAvL25leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9ibG9nZ2VyJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclYyoqKioqKioqKioqKioqKiogIGdldEJsb2dnZXJQb3N0cycsJ2NvbG9yOiBjcmltc29uJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLm5leHQgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5uZXh0ID09PSB1bmRlZmluZWQgfHwgIXRoaXMubmV4dCApIHtcclxuICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIHJldHVybjsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QmxvZ2dlclBvc3RzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9ibG9nZ2VyJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWMqKioqKioqKioqKioqKioqICBnZXRCbG9nZ2VyUG9zdHMgTkVYVCAnLCdjb2xvcjogY3JpbXNvbicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5uZXh0ICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcHAgPSB0aGlzX2RhdHVtLnByb2ZpbGVQaWM/dGhpc19kYXR1bS5wcm9maWxlUGljOicnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiggcHAuaW5kZXhPZignLy8nKSA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5wcm9maWxlUGljID0gdGhpc19kYXR1bS5wcm9maWxlUGljLnJlcGxhY2UoJy8vJywgJ2h0dHBzOi8vJyk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuZm9ybWF0X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0gZGF0YTtcclxuXHJcbiAgICAgICAgaWYgKCBfLmlzRW1wdHkoIGRhdGEubmFtZSApICkgZGF0YS5uYW1lID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBpZiggdHlwZW9mIGRhdGEubWVzc2FnZSA9PSAnc3RyaW5nJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgIHRoaXNfZGF0dW0ubWVzc2FnZSA9IC8qJzxhIGNsYXNzPVwicnNzLWl0ZW0tdGl0bGVcIiBocmVmPVwiJyArZGF0YS5wZXJtYWxpbmsrICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICtkYXRhLm5hbWUrICc8L2E+JyArICovXHJcbiAgICAgICAgICAgIGRhdGEubWVzc2FnZVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvPGhcXGQvZ2ksJzxkaXYnKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvPFxcL2hcXGQ+L2dpLCc8L2Rpdj4nKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvY2xhc3M9XCJcXHcqXCIvZ2ksJycpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9zdHlsZT0vZ2ksICdkYXRhLXM9JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL3dpZHRoPS9naSwgJ2RhdGEtdz0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvaGVpZ2h0PS9naSwgJ2RhdGEtaD0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvYSBocmVmL2dpLCAnYSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoLzxiclxccypbXFwvXT8+L2dpLCAnPHNwYW4+PC9zcGFuPicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTsgIFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQmxvZ2dlckZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBGZWVkSXRlbSA9ICAkaW5qZWN0b3IuZ2V0KCdGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG5cclxuICAgIGZ1bmN0aW9uIENvbGxhcHNpYmxlRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUucmV0d2VldCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQ7XHJcbiAgICBcclxuICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmZhdm9yaXRlID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZmF2b3JpdGU7XHJcblxyXG4gICAgcmV0dXJuIENvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBGZWVkSXRlbSA9ICBGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgVGltZWxpbmVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdUaW1lbGluZUZlZWRJdGVtJyk7XHJcbiAgICBcclxuXHJcbiAgICBmdW5jdGlvbiBEcm9wZG93bkZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dCA9ICcnO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdF9lbGVtZW50ID0gZmVlZC5kZWZhdWx0X2VsZW1lbnQgfHwgJyc7XHJcbiAgICB9XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEcm9wZG93bkZlZWRJdGVtO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9kcm9wZG93biA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkcm9wZG93biA9IFtdLFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlciA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZGF0YS5sZW5ndGggPiAwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGYuZGF0YSA9IHNlbGYuZGF0YS5zb3J0KGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZUEgPSAoIHR5cGVvZiBhLm5hbWUgPT09ICdzdHJpbmcnID8gYS5uYW1lLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVCID0gKCB0eXBlb2YgYi5uYW1lID09PSAnc3RyaW5nJyA/IGIubmFtZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG5hbWVBID4gbmFtZUIgKSByZXR1cm4gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggbmFtZUEgPCBuYW1lQiApIHJldHVybiAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5kYXRhID0gc2VsZi5kYXRhLnNvcnQoZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVBID0gKCB0eXBlb2YgYS5jaGFubmVsVGl0bGUgPT09ICdzdHJpbmcnID8gYS5jaGFubmVsVGl0bGUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVCID0gKCB0eXBlb2YgYi5jaGFubmVsVGl0bGUgPT09ICdzdHJpbmcnID8gYi5jaGFubmVsVGl0bGUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggbmFtZUEgPiBuYW1lQiApIHJldHVybiAxO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggbmFtZUEgPCBuYW1lQiApIHJldHVybiAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBzZWxmLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfZ3JvdXAgPSBzZWxmLmRhdGFbIGkgXSxcclxuICAgICAgICAgICAgICAgICAgICBncm91cF9pZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19ncm91cCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfZ3JvdXAuY2hhbm5lbElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzX2dyb3VwLmNoYW5uZWxUaXRsZVxyXG4gICAgICAgICAgICAgICAgICAgIH07ICBcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGdyb3VwX2lkID0gdGhpc19ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInICkgZ3JvdXBfaWQgPSB0aGlzX2dyb3VwLmlkX3N0cjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZHJvcGRvd24ucHVzaCh7J2lkJzpncm91cF9pZCwgJ25hbWUnOnRoaXNfZ3JvdXAubmFtZSwgJ2RhdGEnOnRoaXNfZ3JvdXB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCggdGhpcy5mZWVkLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbGlzdHMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpX2JvYXJkJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj0gJ1lvdSBkbyBub3QgaGF2ZSBib2FyZHMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXMnOlxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXNfb25seSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSdZb3UgZG8gbm90IGhhdmUgcGFnZXMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgZG8gbm90IGZvbGxvdyBhbnkgY29tcGFueSB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3l0X215U3Vic2NyaXB0aW9uJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgaGF2ZW5cXCd0IGFkZGVkIGFueSBzdWJzY3JpcHRpb25zIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbGlrZXMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gKCdZb3UgaGF2ZW5cXCd0IGxpa2VkIGFueSBwYWdlcyB5ZXQuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBhcmUgbm90IGEgbWVtYmVyIG9mIGFueSBncm91cHMuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgJ2NvdW50Jzpkcm9wZG93bi5sZW5ndGgsICdkYXRhJzpkcm9wZG93biwgJ3BsYWNlaG9sZGVyJzogcGxhY2Vob2xkZXJ9O1xyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5zZXRfZGVmYXVsdF9ncm91cF9pZCA9IGZ1bmN0aW9uICggc2VsX29iaiApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAkX3RoaXMgPSBzZWxfb2JqO1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRfdGhpcy5kYXRhLmlkO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJGVsbS5kYXRhKCdkYXRhJykuaWRfc3RyO1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbGlzdHMnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUubGlzdHMuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7ICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHRpbmcgb2YgZGVmYXVsdCBncm91cCBpZFxyXG4gICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC51cGRhdGVGZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG5cclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQudXBkYXRlSW50ZXJ2YWxJRCA9IHNldEludGVydmFsKCB1cGRhdGVGZWVkTm90aWZpY2F0aW9uLCA1KjYwKjEwMDAsIHNlbGYuZmVlZCApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdzZXREZWZhdWx0R3JvdXBJZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAvL2RlZmF1bHRHcm91cElkOiAkKCB0aGlzICkuZGF0YSgnZGF0YScpLmlkLFxyXG4gICAgICAgICAgICBkZWZhdWx0R3JvdXBJZDogc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQsXHJcbiAgICAgICAgICAgIG5ldHdvcms6IHNlbGYuZmVlZC5uZXR3b3JrXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiBcImZlZWQvZGVmYXVsdEdyb3VwSWRcIixcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyggJ3NldHRpbmcgc2V0RGVmYXVsdEdyb3VwSWQ6ICcgKyBncm91cF9pZCApXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvKnZhciBkYXRhID0gSlNPTi5wYXJzZSggcmVzcCApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggJ3NldCByZXNwb25zZTonIClcclxuICAgICAgICAgICAgY29uc29sZS5kaXIoIGRhdGEgKSovXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggc2VsX29iaiApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAkX3RoaXMgPSBzZWxfb2JqO1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRfdGhpcy5kYXRhLmlkO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJGVsbS5kYXRhKCdkYXRhJykuaWRfc3RyO1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbGlzdHMnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUubGlzdHMuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7ICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHRpbmcgb2YgZGVmYXVsdCBncm91cCBpZFxyXG4gICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC51cGRhdGVGZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG5cclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQudXBkYXRlSW50ZXJ2YWxJRCA9IHNldEludGVydmFsKCB1cGRhdGVGZWVkTm90aWZpY2F0aW9uLCA1KjYwKjEwMDAsIHNlbGYuZmVlZCApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0geyB0eXBlOiAnR0VUJyB9LFxyXG4gICAgICAgICAgICBkYXRhID0ge307XHJcblxyXG4gICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogJF90aGlzLmRhdGEuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ6IHNlbGYubmV4dFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmVxdWVzdC51cmwgPSAnZmVlZC9mYkdyb3VwJztcclxuXHJcbiAgICAgICAgcmVxdWVzdC5kYXRhID0gZGF0YTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AsXHJcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnbGlua2VkaW4nICkgc2VsZi5uZXh0ID0gMjU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEudmFsdWVzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAnbGlua2VkaW4nKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBkYXRhLnZhbHVlc1sgMCBdLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgbSA9IGRhdGEudmFsdWVzLmxlbmd0aDsgaiA8IG07IGorKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfdmFsID0gZGF0YS52YWx1ZXNbIGogXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1bW1hcnkgPSB0aGlzX3ZhbC5zdW1tYXJ5IHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQgIT09IHVuZGVmaW5lZCAmJiB0aGlzX3ZhbC51cGRhdGVDb250ZW50LmN1cnJlbnRVcGRhdGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzX3ZhbC51cGRhdGVDb250ZW50LmN1cnJlbnRVcGRhdGUuY29udGVudCAhPT0gdW5kZWZpbmVkKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBjb250ZW50LnRpdGxlICE9PSB1bmRlZmluZWQgJiYgY29udGVudC5zdWJtaXR0ZWRVcmwgIT09IHVuZGVmaW5lZCAmJiAhKC9cXC4oanBnfGpwZWd8cG5nfGJtcHx0aWZmfGF2aXxtcGVnfG1rdnxvZ2d8bW92fG1wZWd8bXBnfG1wZXxmbHZ8M2dwfGdpZikkL2kpLnRlc3QoY29udGVudC50aXRsZSkgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlX3N1bW1hcnkgPSAnPGEgaHJlZj1cImphdmFzY3JpcHQ6O1wiIG9uQ2xpY2s9XCJFQy5VSS5JQUIoXFwnJyArIGNvbnRlbnQuc3VibWl0dGVkVXJsICsgJ1xcJyk7XCI+JyArIGNvbnRlbnQudGl0bGUgKyAnPC9hPiAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGFbIGogXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfdmFsLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzxwPjxzcGFuIGNsYXNzPVwibG4tZ3JvdXAtdGl0bGVcIj4nICsgdGhpc192YWwudGl0bGUgKyAnOjwvc3Bhbj48L3A+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlX3N1bW1hcnk6IHByZV9zdW1tYXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBzdW1tYXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tTmFtZTogKCB0aGlzX3ZhbC5jcmVhdG9yLmZpcnN0TmFtZS50b0xvd2VyQ2FzZSgpID09ICdwcml2YXRlJyA/IHRoaXNfdmFsLmNyZWF0b3IuZmlyc3ROYW1lIDogdGhpc192YWwuY3JlYXRvci5maXJzdE5hbWUgKyAnICcgKyB0aGlzX3ZhbC5jcmVhdG9yLmxhc3ROYW1lICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWM6IHRoaXNfdmFsLmNyZWF0b3IucGljdHVyZVVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlVGltZTogcGFyc2VJbnQoIHRoaXNfdmFsLmNyZWF0aW9uVGltZXN0YW1wICkgLyAxMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tSWQ6IHRoaXNfdmFsLmNyZWF0b3IuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdGhpc192YWwuY29tbWVudHMuX3RvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudDogdGhpc192YWwuY29tbWVudHMudmFsdWVzIHx8IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpa2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdGhpc192YWwubGlrZXMuX3RvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlrZTogKCB0aGlzX3ZhbC5saWtlcy52YWx1ZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogdGhpc192YWwubGlrZXMudmFsdWVzLmNyZWF0b3IgKSB8fCBbXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXNfdmFsLnJlbGF0aW9uVG9WaWV3ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJfbGlrZXM6IHRoaXNfdmFsLnJlbGF0aW9uVG9WaWV3ZXIuaXNMaWtlZCB8fCBcImZhbHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IDI1O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLmRhdGEubmV4dFRva2VuO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gZGF0YS5kYXRhLml0ZW1zO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnICkgc2VsZi5uZXh0ID0gZGF0YS5uZXh0O1xyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAncGludGVyZXN0JyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5yZXR1cm5Db2RlID09PSAnRkFJTCcgfHwgKCBkYXRhLmRhdGEuc3RhdHVzICYmIGRhdGEuZGF0YS5zdGF0dXMgPT09ICdmYWlsdXJlJyApICkgZGF0YS5kYXRhID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWdlID0gZGF0YS5kYXRhLnBhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBwYWdlICYmIHBhZ2UuY3Vyc29yICkgc2VsZi5uZXh0ID0gcGFnZS5jdXJzb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gZGF0YS5kYXRhLmRhdGE7ICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZGF0YSApICkgaXRlbXMgPSBbIGRhdGEuZGF0YSBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaXRlbXMgPSBkYXRhLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpdGVtcy5sZW5ndGggPiAwICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicpIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdsaW5rZWRpbicgKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBpdGVtc1sgMCBdLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdnb29nbGVwbHVzJyApIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0ucG9zdElEO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19ncm91cCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJykgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBpdGVtc1sgaSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IGl0ZW1zWyBpIF0udXNlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBpdGVtc1sgaSBdLmNyZWF0ZWRfYXQgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmF2b3JpdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBpdGVtc1sgaSBdLmZhdm9yaXRlX2NvdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBieV9tZTogaXRlbXNbIGkgXS5mYXZvcml0ZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHdlZXRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBpdGVtc1sgaSBdLnJldHdlZXRfY291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5X21lOiBpdGVtc1sgaSBdLnJldHdlZXRlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICggKCBpdGVtc1sgaSBdLnJldHdlZXRlZF9zdGF0dXMgIT09IHVuZGVmaW5lZCApID8gaXRlbXNbIGkgXS5yZXR3ZWV0ZWRfc3RhdHVzLmlkX3N0ciA6IGl0ZW1zWyBpIF0uaWRfc3RyIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGl0ZW1zWyBpIF0udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tTmFtZTogKCBpdGVtc1sgaSBdLm5hbWUgfHwgaXRlbXNbIGkgXS51c2VyLm5hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogKCBpdGVtc1sgaSBdLnNjcmVlbl9uYW1lIHx8IGl0ZW1zWyBpIF0udXNlci5zY3JlZW5fbmFtZSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWM6ICggaXRlbXNbIGkgXS5wcm9maWxlX2ltYWdlX3VybCB8fCBpdGVtc1sgaSBdLnVzZXIucHJvZmlsZV9pbWFnZV91cmwgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0SUQ6IGl0ZW1zWyBpIF0uaWRfc3RyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBpdGVtc1sgaSBdLmlkX3N0cixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdfZGF0YTogaXRlbXNbIGkgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zWyBpIF0uZW50aXRpZXMgIT09IHVuZGVmaW5lZCAmJiBpdGVtc1sgaSBdLmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggaXRlbXNbIGkgXS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKSApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYSA9IHNlbGYuZ2V0X21lZGlhX2RhdGEoIGl0ZW1zWyBpIF0uZW50aXRpZXMubWVkaWEubWVkaWFfdXJsICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbG5fY29tcGFuaWVzJyApIG5ld19ncm91cCA9IG5ldyBMaW5rZWRpbkZlZWRJdGVtKCBpdGVtc1sgaSBdLCBzZWxmLmZlZWQgKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHNlbGYuZmVlZC5mb3JtYXRfaXRlbSggaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSBzZWxmLmZlZWQuZm9ybWF0X2l0ZW0oIGl0ZW1zWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ3BpbnRlcmVzdCcgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0gc2VsZi5mZWVkLmZvcm1hdF9pdGVtKCBpdGVtc1sgaSBdICk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGl0ZW1zWyBpIF0sIHNlbGYuZmVlZCApOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mZWVkLml0ZW1zLnB1c2goIG5ld19ncm91cCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5nZXRfbWVkaWFfZGF0YSA9IGZ1bmN0aW9uICggbWVkaWFfdXJscyApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2gobWVkaWFfdXJscywgZnVuY3Rpb24obWVkaWFfdXJsKXtcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdwaG90bycsXHJcbiAgICAgICAgICAgICAgICBzcmM6IG1lZGlhX3VybFxyXG4gICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIERyb3Bkb3duRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtLCBDb2xsYXBzaWJsZUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gRmFjZWJvb2tGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgIT09ICdVc2VyJyAmJiBbJ3dhbGxQb3N0cycsJ2ZiX25vdGlmaWNhdGlvbnMnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGYWNlYm9va0ZlZWQ7XHJcblxyXG4gICAgLypGYWNlYm9va0ZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyBcclxuICAgICAgICAgICAgLGN1cnJlbnRJRCA9IHNlbGYudXBkYXRlSW50ZXJ2YWxJRDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldE5ld3NGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6ICcvYWpheC5waHAnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoICggc2VsZi5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICd3YWxsUG9zdHMnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ3dhbGxQb3N0cyc7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEud2FsbCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5saW1pdCA9IDEwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZiX25vdGlmaWNhdGlvbnMnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ25vdGlmaWNhdGlvbnMnOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmxpbWl0ID0gMTA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaW5Cb3gnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2luQm94JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWN0aW9uID0gJ2dldEZiQ29udmVyc2lvbnMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmICggc2VsZi5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09PSBcIlVzZXJcIikgcmVxdWVzdC5kYXRhLm5leHQgPSBcIi9pbmJveFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLm5leHQgPSBcIi9jb252ZXJzYXRpb25zXCI7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY3VwZGF0ZUZlZWROb3RpZmljYXRpb24oJyArIHNlbGYuaWQgKyAnKSByZXNwb25zZTonLCAnY29sb3I6b3JhbmdlcmVkJyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnRJRCA9PT0gc2VsZi51cGRhdGVJbnRlcnZhbElEICkgLy8gZGlkbid0IHJlZnJlc2ggZHVyaW5nIHJlcXVlc3RcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0SUQgPSAnIyMjJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZpcnN0SXRlbUlEICkgZmlyc3RJRCA9IHNlbGYuZmlyc3RJdGVtSUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZpcnN0SUQgOjogJyArIGZpcnN0SUQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdOyAvLyBpbmNvbWluZyBtZXNzYWdlcyBhcnJheVxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnaW5Cb3gnICYmIGZpcnN0SUQgIT09ICcjIyMnIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VzZXJJZCA9IHNlbGYucHJvZmlsZS5kYXRhLnBhZ2VJZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEuZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1lbnRzID0gZGF0YS5kYXRhWyBpIF0uY29tbWVudHMuY29tbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBjb21tZW50cyApICkgY29tbWVudHMgPSBbIGNvbW1lbnRzIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGsgPSAwLCBsbCA9IGNvbW1lbnRzLmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2NvbW1lbnQgPSBjb21tZW50c1sgayBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfY29tbWVudC5mcm9tSWQgIT09IGN1c2VySWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluY29taW5nLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpc19jb21tZW50LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCB0aGlzX2NvbW1lbnQuY3JlYXRlZFRpbWUuc3BsaXQoJysnKVsgMCBdICkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfY29tbWVudC5tZXNzYWdlSWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG1pbmNvbWluZyApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBtaW5jb21pbmcubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiAoIGl0ZW0udGltZSA+IGZpcnN0SUQgPyAxIDogMCApO30pLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICsgYjsgfSwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnaW5Cb3ggaW5kZXggPSAnICsgaW5kZXggKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09ICBtaW5jb21pbmcubGVuZ3RoICkgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gaXRlbS5pZDt9KS5pbmRleE9mKCBmaXJzdElEICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAtMSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGZpcnN0SUQgPT09ICcjIyMnICkgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdpbmRleCA6OiAnICsgaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaW5kZXggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGhlYWRlciA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1oZWFkZXInKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAsJGZib2R5ID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICR1cGRhdGVfbm90aWYgPSAkZmJvZHkuZmluZCgnLnVwZGF0ZS1ub3RpZmljYXRpb24nKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHVwZGF0ZV9ub3RpZi5sZW5ndGggPT09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZiA9ICQoJzxkaXYgY2xhc3M9XCJ1cGRhdGUtbm90aWZpY2F0aW9uXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYub24oJ2NsaWNrJywgZnVuY3Rpb24gKCBlICl7ICRoZWFkZXIuZmluZCgnLnJlZnJlc2gtZmVlZCcpLnRyaWdnZXIoJ2NsaWNrJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmJvZHkuZmluZCgnLmZlZWQtaXRlbScpLmZpcnN0KCkuYmVmb3JlKCAkdXBkYXRlX25vdGlmICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnaW5Cb3gnICkgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBtaW5jb21pbmcubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgTWVzc2FnZScgKyAoIGluZGV4ID09IDEgPyAnJyA6ICdzJyApICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmlkID09PSAnd2FsbFBvc3RzJyApICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gZGF0YS5kYXRhLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IFBvc3QnICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IGRhdGEuZGF0YS5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBOb3RpZmljYXRpb24nICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBjb25zb2xlLmVycm9yKCchISEgY3VycmVudElEICEhIScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTsqLyAgXHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ25ld3NGZWVkJzogdGhpcy5nZXROZXdzRmVlZChcIm5ld3NGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnd2FsbFBvc3RzJzogdGhpcy5nZXROZXdzRmVlZChcIndhbGxQb3N0c1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BhZ2VzRmVlZCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJwYWdlc0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbkJveCc6IHRoaXMuZ2V0RmJDb252ZXJzaW9ucygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGlkZGVuX2dyb3Vwcyc6IHRoaXMuZmlsbEZCSGlkZGVuX0dyb3VwcygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAndGltZWxpbmUnOiB0aGlzLmdldE5ld3NGZWVkKFwidGltZWxpbmVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdzZWFyY2gnOiB0aGlzLmdldE5ld3NGZWVkKFwic2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnb3V0cmVhY2gnOiB0aGlzLmdldE5ld3NGZWVkKFwic2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbm90aWZpY2F0aW9ucyc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJub3RpZmljYXRpb25zXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbGlrZXMnOiB0aGlzLmdldE5ld3NGZWVkKFwiZmJfbGlrZXNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnZmJfbGlrZXMnIHx8IHRoaXMuaWQgPT0gJ291dHJlYWNoJyB8fCAoIHRoaXMuaWQgPT0gJ25ld3NGZWVkJyAmJiAhdGhpcy5uZXh0ICkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy90aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTsgXHJcbiAgICAgICAgICAgIC8vdGhpcy5oaWRlX3B1bGx1cCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdkb0ZiUmVxdWVzdCcsXHJcbiAgICAgICAgICAgICAgICB3YWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RyZWFtOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgbmV4dDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnbmV3c0ZlZWQnOlxyXG4gICAgICAgICAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3NlYXJjaCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTsgXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ3dhbGxQb3N0cyc6XHJcbiAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAncGFnZXNGZWVkJzpcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAvLyBjYXNlICdpbkJveCc6XHJcbiAgICAgICAgICAgIC8vICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIikgZGF0YS5uZXh0ID0gJy9pbmJveCc7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgZWxzZSBkYXRhLm5leHQgPSAnL2NvbnZlcnNhdGlvbnMnO1xyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2hpZGRlbl9ncm91cHMnOlxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiBzZWxmLnN0cmVhbS5zZWxlY3RlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBzZWxmLm5leHRcclxuICAgICAgICAgICAgICAgICAgICB9OyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICBcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYl9ub3RpZmljYXRpb25zJzpcclxuICAgICAgICAgICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5zdHJlYW0gPSAnbm90aWZpY2F0aW9ucyc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiTW9yZScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7ICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2luZyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYubmV4dCA9PSBkYXRhLnBhZ2luZy5uZXh0IClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNlbGYubmV4dCA9IGRhdGEucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZ2V0TmV3c0ZlZWQgPSBmdW5jdGlvbiAoIHN0cmVhbSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogc3RyZWFtLFxyXG4gICAgICAgICAgICBsaW1pdDogMTBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCBzdHJlYW0gPT0gJ3dhbGxQb3N0cycgfHwgc3RyZWFtID09ICdmYl9pbmZsdWVuY2VzJyB8fCBzdHJlYW0gPT0gJ3RpbWVsaW5lJyApIGRhdGEud2FsbCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9uZXdzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc3RyZWFtID09ICdzZWFyY2gnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlID09PSB1bmRlZmluZWQgKSAvL2VtcHR5IHNlYXJjaCBmZWVkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggW10gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeSAhPT0gdW5kZWZpbmVkICYmIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5Lmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2VhcmNoX3JlcXVlc3QoIHNlbGYsIGZ1bmN0aW9uKCBkYXRhIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggW10gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vaWYoIEVDLnF1ZXVlX2xpc3RbIEJhc2U2NC5lbmNvZGUoIEpTT04uc3RyaW5naWZ5KCByZXF1ZXN0ICkgKSBdICE9PSB1bmRlZmluZWQgKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcXVlc3QpO1xyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5jb2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN0cmVhbSA9PSAnbm90aWZpY2F0aW9ucycgJiYgb2JqLm1lc3NhZ2UuaW5kZXhPZigneW91IGRvIG5vdCBoYXZlIHN1ZmZpY2llbnQgcGVybWlzc2lvbicpICE9IC0xIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKCc8ZGl2IGNsYXNzPVwiZmVlZC1pdGVtXCI+PGRpdiBjbGFzcz1cImZlZWQtYWxlcnRcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdDbGljayBcIk9LXCIgdG8gYWRkIEZhY2Vib29rIE5vdGlmaWNhdGlvbiBGZWVkLicgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicmVmcmVzaFwiPk9LPC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQub24oJ2NsaWNrJywgJy5yZWZyZXNoJywgZnVuY3Rpb24gKCBldmVudCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gc2VsZi5wcm9maWxlLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3JlZnJlc2ggJywgaWQgKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbmV3XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuQWRkQWNjb3VudFBvcHVwKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dOYW1lOiAnQ29ubmVjdFdpdGhPQXV0aCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93T3B0aW9uczogJ2RpcmVjdG9yaWVzPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICdhY2NvdW50L2FjY291bnQ/YWN0aW9uPXNldEV4cGlyZWRLZXlCeUlEJmlkPScgK2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiA2MDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA2NTBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVmcmVzaCBpc2Nyb2xsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZ2V0RmJDb252ZXJzaW9ucyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RmJDb252ZXJzaW9ucycsXHJcbiAgICAgICAgICAgIHN0cmVhbTogJ2luQm94JyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLm5leHQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIpIGRhdGEubmV4dCA9IFwiL2luYm94XCI7XHJcblxyXG4gICAgICAgICAgICBlbHNlIGRhdGEubmV4dCA9IFwiL2NvbnZlcnNhdGlvbnNcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgZGF0YS5uZXh0ID0gdGhpcy5uZXh0O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZmJDb252ZXJzaW9ucycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhICE9PSB1bmRlZmluZWQgJiYgb2JqLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3VyIGluYm94IGlzIGVtcHR5LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vcmVmcmVzaCBpc2Nyb2xsXHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZmlsbEZCSGlkZGVuX0dyb3VwcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7ICAgXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgbCA9IDA7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRGQkhpZGRlbl9Hcm91cHMnLFxyXG4gICAgICAgICAgICBzdHJlYW06ICdncm91cHMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggIXRoaXMubmV4dCApIGRhdGEubmV4dF9wb3N0cyA9IFwiXCI7XHJcblxyXG4gICAgICAgIGVsc2UgZGF0YS5uZXh0X3Bvc3RzID0gdGhpcy5uZXh0O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZmJIaWRkZW5Hcm91cHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5jb2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgLy9nZXQgZmlyc3QgZ3JvdXAgaWYgbm8gc2VsZWN0ZWRcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgPT0gJ19kZWZhdWx0XycgKS8vJC5pc0VtcHR5T2JqZWN0KCBzZWxmLnN0cmVhbS5zZWxlY3RlZCApICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfaWQgPSBvYmouZGF0YVsgMCBdLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX25hbWUgPSBvYmouZGF0YVsgMCBdLm5hbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3RyZWFtLnNlbGVjdGVkID0gb2JqLmRhdGFbIDAgXS5pZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX2lkID0gc2VsZi5zdHJlYW0uc2VsZWN0ZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGwgPSBvYmouZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxlY3RlZF9pZCA9PSBvYmouZGF0YVsgaSBdLmlkICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX25hbWUgPSBvYmouZGF0YVsgaSBdLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtdHlwZScpLnRleHQoICdHcm91cDogJyArIHNlbGVjdGVkX25hbWUgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IHNlbGVjdGVkX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJHcm91cCcsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0OiAnJ1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiZmVlZC9mYkdyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5kYXRhICkgKSBpdGVtcyA9IFsgZGF0YS5kYXRhIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGl0ZW1zID0gZGF0YS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBpdGVtcyApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+VGhpcyBncm91cFxcJ3MgZGF0YSBpcyB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyBcclxuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbCA9IG9iai5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIHNlbGYuc3RyZWFtLnNlbGVjdGVkLnNwbGl0KCcsJykuaW5kZXhPZiggb2JqLmRhdGFbIGkgXS5pZCApICE9IC0xICkgb2JqLmRhdGFbIGkgXS5zZWxlY3RlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugb2JqLmRhdGFbIGkgXS5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBzZWxmLnN0cmVhbS5zZWxlY3RlZC5zcGxpdCgnLCcpLmluZGV4T2YoICdfZGVmYXVsdF8nICkgIT0gLTEgKSBvYmouZGF0YVsgMCBdLnNlbGVjdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0R3JvdXBJZFswXSAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBvYmouZGVmYXVsdEdyb3VwSWRbMF0gKSApXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBvYmouZGVmYXVsdEdyb3VwSWRbMF07IFxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvYmouZGF0YTo6OicpOyAgIFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cob2JqLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9KTsgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBsZW5ndGggPT09IDAgKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHZhciBwcmV2X2l0ZW0gPSB0aGlzLml0ZW1zWyBsZW5ndGggLSAxIF0uZGF0YTtcclxuXHJcbiAgICAgICAgaWYgKCBwcmV2X2l0ZW0gPT09IHVuZGVmaW5lZCB8fCBwcmV2X2l0ZW0ubWVkaWEgPT09IHVuZGVmaW5lZCB8fCBkYXRhLm1lZGlhID09PSB1bmRlZmluZWQgKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggcHJldl9pdGVtLm1lZGlhLnR5cGUgPT0gZGF0YS5tZWRpYS50eXBlICYmIHByZXZfaXRlbS5tZWRpYS5ocmVmICE9PSB1bmRlZmluZWQgJiYgZGF0YS5tZWRpYS5ocmVmICE9PSB1bmRlZmluZWQgJiYgcHJldl9pdGVtLm1lZGlhLmhyZWYgPT0gZGF0YS5tZWRpYS5ocmVmICkgXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnU0FNRSBNRURJQScpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuZGlyKCBwcmV2X2l0ZW0gKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnICYmICF0aGlzLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLml0ZW1zWyAwIF0gIT09IHVuZGVmaW5lZCApIGRhdGEgPSBkYXRhLmNvbmNhdCggdGhpcy5pdGVtc1sgMCBdLmRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnaW5Cb3gnKSBuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0oIGRhdGFbIGkgXSkgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJyAmJiAhdGhpcy5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9IFxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnZmJfbGlrZXMnICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdzZWFyY2hfcmVxdWVzdCcgKSB0aGlzLml0ZW1zLnB1c2goIG5ldyBTZWFyY2hGZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdvdXRyZWFjaCcgKSB0aGlzLml0ZW1zLnB1c2goIG5ldyBTZWFyY2hGZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8tLS0gZm9yIGxpdmUgdXBkYXRlXHJcbiAgICAgICAgICAgIHZhciBtaW5jb21pbmcgPSBbXSwgY3VzZXJJZCA9IHRoaXMucHJvZmlsZS5kYXRhLnBhZ2VJZDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2RhdGE6Ojo6Ojo6Ojo6OjonKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdpbkJveCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLypmb3IgKCB2YXIgayA9IDAsIGxsID0gbmV3X2ZlZWRfaXRlbS5kYXRhLmNvbW1lbnRzLmNvbW1lbnQubGVuZ3RoOyBrIDwgbGw7IGsrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19jb21tZW50ID0gbmV3X2ZlZWRfaXRlbS5kYXRhLmNvbW1lbnRzLmNvbW1lbnRbIGsgXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2NvbW1lbnQuZnJvbUlkICE9PSBjdXNlcklkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluY29taW5nLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXNfY29tbWVudCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogbmV3IERhdGUoIHRoaXNfY29tbWVudC5jcmVhdGVkVGltZS5zcGxpdCgnKycpWyAwIF0gKS5nZXRUaW1lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfY29tbWVudC5tZXNzYWdlSWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5zYW1lX21lZGlhX3dpdGhfcHJldl9pdGVtKCBkYXRhWyBpIF0pICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG1pbmNvbWluZy5zb3J0KCBmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA+IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPCBiLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTsgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gZmluZCBsYXRlc3QgaW5jb21pbmdcclxuICAgICAgICAgICAgaWYgKCBtaW5jb21pbmcubGVuZ3RoID4gMCApIHRoaXMuZmlyc3RJdGVtSUQgPSBtaW5jb21pbmdbIDAgXS50aW1lO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB0aGlzLmZpcnN0SXRlbUlEID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRmFjZWJvb2tGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJyR1cmxSb3V0ZXInLCAnRUMnLCAnYXBpVXJsJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgJHVybFJvdXRlciwgRUMsIGFwaVVybCApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZmVlZCA9ICcnOy8vbmV3IEVsZW1lbnQoJyNmZWVkLXRlbXBsYXRlJyk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBmZWVkLmVsZW1lbnQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5wcm9maWxlID0gcHJvZmlsZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5ldHdvcmsgPSAoIHByb2ZpbGUgPT09IHVuZGVmaW5lZCA/IHN0cmVhbS5uZXR3b3JrIDogcHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc3RyZWFtID0gc3RyZWFtO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmFtZSA9IHN0cmVhbS5uYW1lIHx8IHN0cmVhbS5pZDtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IHN0cmVhbS5zdHJlYW1JZDtcclxuXHJcbiAgICAgICAgdGhpcy5zaXplID0gc3RyZWFtLnNpemU7XHJcblxyXG4gICAgICAgIHRoaXMuZmF2b3JpdGVkID0gc3RyZWFtLmZhdm9yaXRlZCB8fCBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnZhbHVlID0gc3RyZWFtLnZhbHVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmV4dCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyA8LS0gWyBGZWVkSXRlbSBdXHJcblxyXG4gICAgICAgIHRoaXMubGFzdF9sb2FkZWRfdGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBudWxsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIHByZXBhcmUgcGFnZV9pZCAqL1xyXG4gICAgICAgIHRoaXMucGFnZV9pZCA9ICd0YWJzLicgKyB0aGlzLmdldF9wYWdlX2lkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuZ2V0X3BhZ2VfaWQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpZCA9IHNlbGYuaWQsXHJcbiAgICAgICAgICAgIHByZWZpeCA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZCA9IHNlbGYuaWQgKyAnXycgKyBzZWxmLnByb2ZpbGUuaWQgKyAnXycrIHNlbGYubmV0d29yaztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiggc2VsZi5pZCA9PSAnc2VhcmNoJyB8fCBzZWxmLmlkID09ICdyc3MnIHx8IHNlbGYuaWQgPT0gJ291dHJlYWNoJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZCA9IHNlbGYubmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICdmYXZvcml0ZSc7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnNlYXJjaCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmVmaXggPSAnc2VhcmNoJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5yc3MgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJlZml4ID0gJ3Jzcyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKCB0aGlzLm5ldHdvcmsgPT0gJ2NpbmJveCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnY2luYm94JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKCBzZWxmLnByb2ZpbGUgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByZWZpeCA9IHNlbGYucHJvZmlsZS5pZDtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAocHJlZml4ICsgJy0nICsgaWQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHBhZ2UgPSAnJyxcclxuICAgICAgICAgICAgICAgIGZlZWRfbmFtZSA9IHNlbGYubmFtZTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHNlbGYubmV0d29yayApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhY2Vib29rJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLnBhZ2VOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3aXR0ZXInOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuc3BlY2lmaWVkSGFuZGxlT3JIYXNoVGFnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdsaW5rZWRpbic6IHBhZ2UgPSB0aGlzLnByb2ZpbGUuZGF0YS5wcm9maWxlTmFtZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xpbmtlZGluJzogcGFnZSA9IHNlbGYucHJvZmlsZS51c2VybmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLnVzZXJGaXJzdE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09ICd5dF9teUNoYW5uZWxIb21lJyApIGZlZWRfbmFtZSA9ICdIb21lIC0gQWN0aXZpdGllcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ29vZ2xlcGx1cyc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZS5zcGxpdChcIihcIilbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGludGVyZXN0JzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLmZ1bGxOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiBwYWdlID0gdGhpcy5wcm9maWxlLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gcGFnZSsgJyAtICcgK2ZlZWRfbmFtZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5zZWFyY2ggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICdDdXN0b20gU2VhcmNoIEZlZWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnJzcyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gJ1JTUyBGZWVkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICh0aGlzLm5hbWUpLmluZGV4T2YoJ0ZlZWQnKSA+PSAwID8gdGhpcy5uYW1lOih0aGlzLm5hbWUgKyAnIEZlZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYucGFnZV90aXRsZSA9IGZlZWRfdGl0bGU7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKHNlbGYucGFnZV9pZCk7XHJcblxyXG4gICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldChzZWxmLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICBpZihnZXRFeGlzdGluZ1N0YXRlID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3BhZ2VfaWQ6OjonK3NlbGYucGFnZV9pZCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgXCJ1cmxcIjogJy8nICsgc2VsZi5wYWdlX2lkICsgJzpvYmonLFxyXG4gICAgICAgICAgICAgIGNhY2hlOnRydWUsXHJcbiAgICAgICAgICAgICAgXCJ2aWV3c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAnaG9tZS10YWInOiB7XHJcbiAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9yYW0uaHRtbFwiLFxyXG4gICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIkZlZWRzXCIsXHJcbiAgICAgICAgICAgICAgICAgIHBhcmFtczoge29iajogc2VsZn1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAkc3RhdGVQcm92aWRlclJlZi5zdGF0ZShzZWxmLnBhZ2VfaWQsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgICR1cmxSb3V0ZXIuc3luYygpO1xyXG4gICAgICAgICAgICAkdXJsUm91dGVyLmxpc3RlbigpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3BhZ2VfaWQ6OjowMDAwMCcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhICkgLy8gPC0tIG92ZXJyaWRlXHJcbiAgICB7XHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0gPSBuZXcgRmVlZEl0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApIC8vIDwtLSBvdmVycmlkZVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0gPSBuZXcgRmVlZEl0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuYXBwZW5kX2l0ZW1zID0gZnVuY3Rpb24gKCBhZGRfYWZ0ZXJfaW5kZXggKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgbiA9IHBhcnNlSW50KCBhZGRfYWZ0ZXJfaW5kZXggKSxcclxuICAgICAgICAgICAgLy8kY29udGFpbmVyID0gdGhpcy5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJyksXHJcbiAgICAgICAgICAgIGNvdW50ID0gMDtcclxuICAgICAgIFxyXG5cclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuc2hvd19pdGVtcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdGaW5hbDo6Ojo6Ojo6OicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNlbGYuaXRlbXMpO1xyXG5cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICggcmVtb3ZlX21lc3NhZ2UgKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5oaWRlX3B1bGx1cCA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIEZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSwgRHJvcGRvd25GZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEdvb2dsZVBsdXNGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIFsnZ3BfYWN0aXZpdGllcycsJ2dwX3BhZ2VzX29ubHknLCdncF9wYWdlcyddLmluZGV4T2YoIHN0cmVhbS5zdHJlYW1JZCApICE9PSAtMSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZlZWQgPSB0cnVlOyAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBHb29nbGVQbHVzRmVlZDtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUudXBkYXRlRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpZF9rZXkgPSAnaWQnLCBcclxuICAgICAgICAgICAgY3VycmVudElEID0gc2VsZi51cGRhdGVJbnRlcnZhbElEO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9nb29nbGVQbHVzU3RyZWFtJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoIHNlbGYuaWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnZ3BfYWN0aXZpdGllcyc6ICAgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9hY3Rpdml0aWVzJzsgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdncF9wYWdlc19vbmx5JzogICByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfb25seV9zdHJlYW0nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWNjb3VudElEID0gc2VsZi5kZWZhdWx0X2VsZW1lbnRfbWV0cmljLmFjY291bnRJRDsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5wcm9maWxlSUQgPSBzZWxmLmRlZmF1bHRfZWxlbWVudF9tZXRyaWMucHJvZmlsZUlEOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRfa2V5ID0gJ3Bvc3RJRCc7IGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXMnOiAgICAgICAgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX3N0cmVhbSc7ICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5hY2NvdW50SUQgPSBzZWxmLmRlZmF1bHRfZWxlbWVudF9tZXRyaWMuYWNjb3VudElEOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnByb2ZpbGVJRCA9IHNlbGYuZGVmYXVsdF9lbGVtZW50X21ldHJpYy5wcm9maWxlSUQ7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZF9rZXkgPSAncG9zdElEJzsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7ICAgICAgXHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjdXBkYXRlRmVlZE5vdGlmaWNhdGlvbignICsgc2VsZi5pZCArICcpIHJlc3BvbnNlOicsICdjb2xvcjpvcmFuZ2VyZWQnKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggY3VycmVudElEID09PSBzZWxmLnVwZGF0ZUludGVydmFsSUQgKSAvLyBkb24ndCByZWZyZXNoIGR1cmluZyByZXF1ZXN0XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdElEID0gJyMjIyc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5maXJzdEl0ZW1JRCApIGZpcnN0SUQgPSBzZWxmLmZpcnN0SXRlbUlEO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdmaXJzdElEIDo6ICcgKyBmaXJzdElEKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICYmIGRhdGEuZGF0YS5sZW5ndGggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuIGl0ZW1bIGlkX2tleSBdO30pLmluZGV4T2YoIGZpcnN0SUQgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAtMSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBmaXJzdElEID09PSAnIyMjJyApIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnaW5kZXggOjogJyArIGluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRoZWFkZXIgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaGVhZGVyJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRmYm9keSA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkdXBkYXRlX25vdGlmID0gJGZib2R5LmZpbmQoJy51cGRhdGUtbm90aWZpY2F0aW9uJyk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICR1cGRhdGVfbm90aWYubGVuZ3RoID09PSAwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYgPSAkKCc8ZGl2IGNsYXNzPVwidXBkYXRlLW5vdGlmaWNhdGlvblwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmLm9uKCdjbGljaycsIGZ1bmN0aW9uICggZSApeyAkaGVhZGVyLmZpbmQoJy5yZWZyZXNoLWZlZWQnKS50cmlnZ2VyKCdjbGljaycpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGZib2R5LmZpbmQoJy5mZWVkLWl0ZW0nKS5maXJzdCgpLmJlZm9yZSggJHVwZGF0ZV9ub3RpZiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBkYXRhLmRhdGEubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgUG9zdCcgKyAoIGluZGV4ID09PSAxID8gJycgOiAncycgKSApOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBjb25zb2xlLmVycm9yKCchISEgY3VycmVudElEICEhIScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfYWN0aXZpdGllcyc6IHRoaXMuZ2V0R29vZ2xlUGx1c1N0cmVhbShcImdwX2FjdGl2aXRpZXNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlcyc6IHRoaXMuZ2V0UGFnZXMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qY2FzZSAnZ3BfcGVvcGxlQ29ubmVjdGVkJzogdGhpcy5nZXRHb29nbGVQbHVzU3RyZWFtKFwiZ3BfcGVvcGxlQ29ubmVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGVvcGxlVmlzaWJsZSc6IHRoaXMuZ2V0R29vZ2xlUGx1c1N0cmVhbShcImdwX3Blb3BsZVZpc2libGVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhazsqL1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzX29ubHknOiB0aGlzLmdldFBhZ2VzKCB0cnVlICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZ2V0UGFnZXMgPSBmdW5jdGlvbiAoIG9ubHlfcGFnZSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5vYmplY3RUeXBlID09PSAncGFnZScgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcV9kYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3BfcGFnZV9vbmx5X3N0cmVhbSdcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6ICdmZWVkL2dvb2dsZVBsdXNTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogcmVxX2RhdGFcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ2dwX3BhZ2VzJyApIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9zdHJlYW0nO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCcqKioqKioqKioqKioqKioqICBHKyAnK3N0cmVhbSk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmoubmV4dCAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlcj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnByb2ZpbGUuYWNjb3VudC5wcm9maWxlcy5mb3JFYWNoKCBmdW5jdGlvbiggcHJvZmlsZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgJiYgcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgPT09ICdwYWdlJyAmJiBwcm9maWxlLm1vbml0b3JlZCA9PT0gJ29uJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2ZpbGUuZGF0YS5wYWdlX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9maWxlLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBwcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmx5X3BhZ2U6IG9ubHlfcGFnZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTsgXHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICE9PSB1bmRlZmluZWQgJiYgIV8uaXNFbXB0eSggdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQuaW5kZXhPZigneycpID09PSAtMSApIHRoaXMuZGVmYXVsdF9lbGVtZW50ID0gdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0X2dyb3VwcyA9IEpTT04ucGFyc2UoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGVmYXVsdF9ncm91cHNbIHRoaXMuaWQgXSAhPT0gdW5kZWZpbmVkICkgdGhpcy5kZWZhdWx0X2VsZW1lbnQgPSBkZWZhdWx0X2dyb3Vwc1sgdGhpcy5pZCBdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoIGRhdGEgKTsgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZ2V0R29vZ2xlUGx1c1N0cmVhbSA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRHUFN0cmVhbScsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9nb29nbGVQbHVzU3RyZWFtJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcqKioqKioqKioqKioqKioqICBHKyAnK3N0cmVhbSk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoubmV4dCAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5yZXR1cm5Db2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubmV4dCAgPT09IHVuZGVmaW5lZCB8fCAhdGhpcy5uZXh0ICkge1xyXG4gICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgcmV0dXJuOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRHUFN0cmVhbScsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dCBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZ29vZ2xlUGx1c1N0cmVhbScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdncF9wYWdlcycgKSByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfc3RyZWFtJztcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuaWQgPT09ICdncF9wYWdlc19vbmx5JyApIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9vbmx5X3N0cmVhbSc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7Ly9KU09OLnBhcnNlKCByZXNwICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEubmV4dCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEubmV4dDtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuaGlkZV9wdWxsdXAoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICggdGhpcy5pZCA9PSAnZ3BfcGFnZXMnIHx8IHRoaXMuaWQgPT0gJ2dwX3BhZ2VzX29ubHknICkgJiYgdGhpcy5wcm9maWxlLmRhdGEub2JqZWN0VHlwZSAhPT0gJ3BhZ2UnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtLCB0aGlzX2RhdHVtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT09ICdncF9hY3Rpdml0aWVzJyApIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtX29sZCggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSwgdGhpc19kYXR1bTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT09ICdncF9hY3Rpdml0aWVzJyApIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtX29sZCggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IGRhdGE7XHJcblxyXG4gICAgICAgIHRoaXNfZGF0dW0uZnJvbUlkID0gZGF0YS51c2VyLmZyb21JZDtcclxuICAgICAgICB0aGlzX2RhdHVtLmZyb21OYW1lID0gZGF0YS51c2VyLmZyb21OYW1lO1xyXG4gICAgICAgIHRoaXNfZGF0dW0ucHJvZmlsZUxpbmsgPSBkYXRhLnVzZXIucHJvZmlsZUxpbms7XHJcbiAgICAgICAgdGhpc19kYXR1bS5wcm9maWxlUGljID0gZGF0YS51c2VyLnByb2ZpbGVQaWM7XHJcblxyXG4gICAgICAgIHRoaXNfZGF0dW0udXBkYXRlVGltZSA9IG5ldyBEYXRlKCB0aGlzX2RhdHVtLnVwZGF0ZVRpbWUgKS5nZXRUaW1lKCkgLyAxMDAwO1xyXG5cclxuICAgICAgICBkZWxldGUgdGhpc19kYXR1bS51c2VyO1xyXG5cclxuICAgICAgICAvLyB0YWtlIDEgYXR0YWNobWVudCBmb3Igbm93XHJcbiAgICAgICAgaWYgKCBkYXRhLmF0dGFjaG1lbnRzICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIGRhdGEuYXR0YWNobWVudHMpIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheShkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnQpICkgdGhpc19kYXR1bS5tZWRpYSA9IGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudFsgMCBdO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtLm1lZGlhID0gZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmNvbnRlbnQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICgvXFx3ezh9KC1cXHd7NH0pezN9LVxcd3sxMn0vaSkudGVzdCh0aGlzX2RhdHVtLm1lZGlhLmNvbnRlbnQpICkgdGhpc19kYXR1bS5tZWRpYS5jb250ZW50ID0gJyc7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS50eXBlID09ICdwaG90bycgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlICE9PSB1bmRlZmluZWQgKSB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpc19kYXR1bS5tZWRpYS5pbWFnZSAhPT0gdW5kZWZpbmVkICkgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGRlbGV0ZSB0aGlzX2RhdHVtLm1lZGlhO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpc19kYXR1bS5tZWRpYS50eXBlID09ICd2aWRlbycgJiYgdGhpc19kYXR1bS5tZWRpYS5pbWFnZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS52aWRlbyA9IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X3VybDogdGhpc19kYXR1bS5tZWRpYS5lbWJlZC51cmwgXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0ubWVkaWEudmlkZW8gPSB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV91cmw6IHRoaXNfZGF0dW0ubWVkaWEudXJsIFxyXG4gICAgICAgICAgICAgICAgICAgIH07IFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtX29sZCA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgIGZyb21JZDogZGF0YS51c2VyLmlkLFxyXG4gICAgICAgICAgICBmcm9tTmFtZTogZGF0YS51c2VyLmZ1bGxfbmFtZSxcclxuICAgICAgICAgICAgcHJvZmlsZVBpYzogZGF0YS51c2VyLnByb2ZpbGVfcGljdHVyZSxcclxuICAgICAgICAgICAgcHJvZmlsZUxpbms6IGRhdGEudXNlci5wcm9maWxlX2xpbmssXHJcbiAgICAgICAgICAgIHNlbGZMaW5rOiBkYXRhLnNlbGZMaW5rLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLmNyZWF0ZWRfdGltZSApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS50aXRsZSxcclxuXHJcbiAgICAgICAgICAgIC8vYWN0aXZpdHlUeXBlOiBkYXRhLmFjdGl2aXR5VHlwZSB8fCAnJyxcclxuICAgICAgICAgICAgcmVzaGFyZXJzOiBkYXRhLnJlc2hhcmVycyxcclxuICAgICAgICAgICAgbGlrZXM6IGRhdGEubGlrZXMsIC8vcGx1c29uZXJzXHJcbiAgICAgICAgICAgIGNvbW1lbnRzOiBkYXRhLmNvbW1lbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL21lZGlhOiBkYXRhLmF0dGFjaG1lbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBwb3N0SUQ6IGRhdGEuaWQsIC8vPz8/XHJcbiAgICAgICAgICAgIHJhd19kYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzX2RhdHVtLmNvbW1lbnRzLmNvbW1lbnQgIT09IHVuZGVmaW5lZCAmJiAhQXJyYXkuaXNBcnJheSggdGhpc19kYXR1bS5jb21tZW50cy5jb21tZW50ICkpIFxyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLmNvbW1lbnRzLmNvbW1lbnQgPSBbIHRoaXNfZGF0dW0uY29tbWVudHMuY29tbWVudCBdO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubGlrZXMubGlrZSAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KCB0aGlzX2RhdHVtLmxpa2VzLmxpa2UgKSkgXHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubGlrZXMubGlrZSA9IFsgdGhpc19kYXR1bS5saWtlcy5saWtlIF07XHJcblxyXG4gICAgICAgIC8vIHRha2UgMSBhdHRhY2htZW50IGZvciBub3dcclxuICAgICAgICBpZiAoIGRhdGEuYXR0YWNobWVudHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50KSApIHRoaXNfZGF0dW0ubWVkaWEgPSBkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnRbIDAgXTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bS5tZWRpYSA9IGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudDtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS50eXBlID09ICdwaG90bycgJiYgdGhpc19kYXR1bS5tZWRpYS5mdWxsSW1hZ2UgIT09IHVuZGVmaW5lZCApIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5mdWxsSW1hZ2UudXJsO1xyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAndmlkZW8nICYmIHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5pbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEudmlkZW8gPSB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV91cmw6IHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQudXJsIFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtLm1lZGlhLnZpZGVvID0geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlX3VybDogdGhpc19kYXR1bS5tZWRpYS51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLnVybCBcclxuICAgICAgICAgICAgICAgICAgICB9OyBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07ICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBHb29nbGVQbHVzRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0luc3RhZ3JhbUZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSwgSW5zdGFncmFtRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBJbnN0YWdyYW1GZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEluc3RhZ3JhbUZlZWQ7XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAge1xyXG4gICAgICAgLy8gcmVxdWVzdHMgZGF0YSBhbmQgdGhlbiBjYWxscyB0aGlzLnNhdmVfaXRlbXNcclxuICAgICAgIGlmICggdGhpcy52YWx1ZSA9PSAndHJ1ZScgJiYgIXRoaXMuaW5pdGlhbGl6ZWQgKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB3ZSBhcmUgZGVhbGluZyB3aXRoIHVzZXIgZmVlZCBcclxuICAgICAgICAgICAgICAgY2FzZSAnaWdfZmVlZCc6IHRoaXMuZ2V0SW5zdGFncmFtRmVlZChcInVzZXJGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgIC8vIEluIGNhc2Ugd2UgYXJlIGRlYWxpbmcgd2l0aCBteSBtZWRpYSBmZWVkXHJcbiAgICAgICAgICAgICAgIC8vIGNhc2UgJ2lnTXlNZWRpYSc6IHRoaXMuZ2V0SW5zdGFncmFtRmVlZChcImlnTXlNZWRpYVwiKTtcclxuICAgICAgICAgICAgICAgY2FzZSAnaWdNeU1lZGlhJzogdGhpcy5nZXRJbnN0YWdyYW1GZWVkKFwibXlNZWRpYVwiKTtcclxuICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICB9XHJcbiAgICAgICB9XHJcbiAgICAgICBlbHNlIGlmICggdGhpcy52YWx1ZSA9PSAndHJ1ZScpXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmdldEluc3RhZ3JhbUZlZWQgPSBmdW5jdGlvbiAoIHN0cmVhbSApXHJcbiAgICB7XHJcbiAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgLy9hY3Rpb246ICdnZXROZXdzRmVlZCcsXHJcbiAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICBzdHJlYW06IHN0cmVhbSxcclxuICAgICAgICAgICBuZXh0OiAnJyAvLyBJRCBvZiBsYXN0IGVsZW1lbnQgdGhhdCB3YXMgbG9hZGVkXHJcbiAgICAgICB9O1xyXG5cclxuICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgaWYodGhpcy5uZXh0ID4gMClcclxuICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5uZXh0ID0gdGhpcy5uZXh0O1xyXG4gICAgICAgfVxyXG5cclxuICAgICAgIHZhciBtZXRob2QgPSAnJztcclxuICAgICAgIC8vIGlmIChzdHJlYW0gPT0gJ2lnTXlNZWRpYScpIFxyXG4gICAgICAgaWYgKHN0cmVhbSA9PSAnbXlNZWRpYScpIFxyXG4gICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmFjdGlvbiA9IFwiZ2V0SW5NeU1lZGlhXCI7IC8vIEFjdGlvbiBmb3IgbXlNZWRpYVxyXG4gICAgICAgICAgICBtZXRob2QgPSAnbXlNZWRpYSc7XHJcbiAgICAgICB9XHJcbiAgICAgICBlbHNlXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluRmVlZFwiOyAvLyBBY3Rpb24gZm9yIHVzZXIgZmVlZCAvIGhvbWUgZmVlZFxyXG4gICAgICAgICAgIG1ldGhvZCA9ICdmZWVkJztcclxuICAgICAgIH1cclxuXHJcbiAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICB1cmw6ICdmZWVkL2luc3RhZ3JhbS8nK21ldGhvZCxcclxuICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICB9O1xyXG5cclxuICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgIHtcclxuICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgIGlmICggb2JqLnBhZ2luYXRpb24gIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmF0aW9uLm5leHRfbWF4X2lkO1xyXG5cclxuICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIC8vYWN0aW9uOiAnZG9GYlJlcXVlc3QnLFxyXG4gICAgICAgICAgICAgICAgLy93YWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgbmV4dDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgIGlmICh0aGlzLmlkID09ICdpZ19mZWVkJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLnN0cmVhbSA9IFwidXNlckZlZWRcIjtcclxuICAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluRmVlZFwiOyAvLyBBY3Rpb24gZm9yIHVzZXIgZmVlZCAvIGhvbWUgZmVlZFxyXG4gICAgICAgICAgICBtZXRob2QgPSAnZmVlZCc7XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLnN0cmVhbSA9IFwibXlNZWRpYVwiO1xyXG4gICAgICAgICAgICBkYXRhLmFjdGlvbiA9IFwiZ2V0SW5NeU1lZGlhXCI7IC8vIEFjdGlvbiBmb3IgbXlNZWRpYVxyXG4gICAgICAgICAgICBtZXRob2QgPSAnbXlNZWRpYSc7XHJcbiAgICAgICAgfSAgICAgICAgXHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaWQ9XCIrdGhpcy5pZCtcIiBzdHJlYW09XCIrZGF0YS5zdHJlYW0rXCIgbmV4dD1cIit0aGlzLm5leHQrXCIgYWN0aW9uPVwiK2RhdGEuYWN0aW9uKTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2luc3RhZ3JhbS8nK21ldGhvZCxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8kLm1vYmlsZS5hY3RpdmVQYWdlLmNoaWxkcmVuKFwiW2RhdGEtcm9sZT0nZm9vdGVyJ11cIikudG9vbGJhcih7IHRhcFRvZ2dsZTogZmFsc2UgfSk7XHJcbiAgICAgICAgLy8kLm1vYmlsZS5hY3RpdmVQYWdlLmNoaWxkcmVuKFwiW2RhdGEtcm9sZT0nZm9vdGVyJ11cIikuZmFkZU91dCgzMDApO1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLnRvb2xiYXIoeyB0YXBUb2dnbGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLmZhZGVJbigzMDApO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhLmxlbmd0aCA8IDEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLnBhZ2luYXRpb24gPyBkYXRhLnBhZ2luYXRpb24ubmV4dF9tYXhfaWQgOiAnJztcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcbiAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICd1c2VyRmVlZCcpIHtuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO30gICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RyZWFtID0gbXlNZWRpYVxyXG4gICAgICAgICAgICAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgKi9cclxuICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IEluc3RhZ3JhbUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICB9XHJcblxyXG4gICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgSW5zdGFncmFtRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBJbnN0YWdyYW1GZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgQ29sbGFwc2libGVGZWVkSXRlbSA9ICBDb2xsYXBzaWJsZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nKTtcclxuICAgIFxyXG4gICAgZnVuY3Rpb24gTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcblxyXG4gICAgcmV0dXJuIExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdMaW5rZWRpbkZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBMaW5rZWRpbkZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gTGlua2VkaW5GZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGlua2VkaW5GZWVkO1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggdGhpcy5pZCApXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHRoaXMudmFsdWUgKVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRhY3RzJzogdGhpcy5yZXRyaWV2ZUxpbmtlZGluRGF0YSgnZ2V0TE5Db250YWN0cycpOy8vY29uc29sZS5sb2coJ2NvbnRhY3RzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwibmV3c0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbl9jb21wYW5pZXMnOiB0aGlzLmdldExOQ29tcGFuaWVzKCk7Ly9jb25zb2xlLmxvZygnbG5fY29tcGFuaWVzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwid2FsbFBvc3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3JvdXBzJzogdGhpcy5nZXRMTkdyb3VwcygpOyAvL2NvbnNvbGUubG9nKCdncm91cHMnKTsvL3RoaXMuZ2V0TmV3c0ZlZWQoXCJwYWdlc0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbmJveCc6IHRoaXMuZ2V0TE5JbmJveCgpOy8vY29uc29sZS5sb2coJ2luYm94Jyk7Ly90aGlzLmdldExuSW5ib3goKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hvbWUnOiB0aGlzLmdldExOSG9tZSgpOyAvL2NvbnNvbGUubG9nKCdsbmNfaG9tZVdhbGwnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xuY19ob21lV2FsbCc6IHRoaXMucmV0cmlldmVMaW5rZWRpbkRhdGEoJ2dldExOQ21wSG9tZScpOy8vY29uc29sZS5sb2coJ2xuY19ob21lV2FsbCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7IFxyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xuY19wcm9kdWN0cyc6IGNvbnNvbGUubG9nKCdsbmNfcHJvZHVjdHMnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHsgXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8vIGlmKHRoaXMubmV4dD4wKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5DbXBIb21lJyxcclxuICAgICAgICAgICAgICAgICAgICAvL3dhbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZV9pZDogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB0aGlzLm5leHRcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29udGFjdHMnOiBkYXRhLmFjdGlvbiA9ICdnZXRMTkNvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2NvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Db21wYW5pZXMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKVswXS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2NvbXBhbmllcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ3JvdXBzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Hcm91cHMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSAnZ3JvdXBzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW5ib3gnOiBkYXRhLmFjdGlvbiA9ICdnZXRMTkluYm94JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wcm9maWxlX2lkID0gdGhpcy5wcm9maWxlLmRhdGEucHJvZmlsZV9JZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLnN0YXJ0ID09PSBGQUxTRSApIGRhdGEuc3RhcnQgPSAwOyAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdpbmJveCc7IFxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdob21lJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Ib21lJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2hvbWUnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIHVybDogXCJmZWVkL2xpbmtlZEluL1wiK21ldGhvZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRMbkluYm94IG1vcmUgcmVzcG9uc2UnKTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCArPSAyNTsvL2RhdGEudXBkYXRlS2V5O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnRyaWdnZXIoJ2NsaWNrJylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gfSBcclxuICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyB9ICBcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5yZXRyaWV2ZUxpbmtlZGluRGF0YSA9IGZ1bmN0aW9uICggYWN0aW9uICkgLy8gZ2V0TE5DbXBIb21lID0+IGNvbXBhbnkgdXBkYXRlc1xyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVfSWQ6IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVfSWQsXHJcbiAgICAgICAgICAgIHN0YXJ0OiBzZWxmLm5leHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBcclxuICAgICAgICB2YXIgbWV0aG9kID0gJyc7XHJcbiAgICAgICAgc3dpdGNoKCBhY3Rpb24gKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0TE5Db250YWN0cyc6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnbGlua2VkSW4vY29udGFjdHMnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldExOQ21wSG9tZSc6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnbGlua2VkSW4vY29tcGFueUhvbWUnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvJyttZXRob2QsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGFjdGlvbiArJyByZXNwb25zZScpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyppZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkqLyBcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDsvL29iai5kYXRhLnVwZGF0ZUtleTsvL29iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKVxyXG5cclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5Db21wYW5pZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkNvbXBhbmllcycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9jb21wYW5pZXMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSA9PT0gdW5kZWZpbmVkIHx8IG9iai5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouZGVmYXVsdENvbXBhbnlJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0Q29tcGFueUlkWzBdICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIG9iai5kZWZhdWx0Q29tcGFueUlkWzBdICkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRDb21wYW55SWRbIDAgXTsgXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKVxyXG5cclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgLy8gfSAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOR3JvdXBzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IDA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldExOR3JvdXBzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0YXJ0OiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2xpbmtlZEluL2dyb3VwcycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0R3JvdXBJZFswXSAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBvYmouZGVmYXVsdEdyb3VwSWRbMF0gKSApXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBvYmouZGVmYXVsdEdyb3VwSWRbMF07IFxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgICAgXHJcbiAgICAgICAgICAgIC8vIGVsc2VcclxuICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKClcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIC8vIH0gICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7IFxyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5Ib21lID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJtYXRhbiBoZXJlIC0gXCIrdGhpcy5pZCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5kaXIoc2VsZik7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldExOSG9tZScsXHJcbiAgICAgICAgICAgIC8vc3RyZWFtOiAnaW5Cb3gnLFxyXG4gICAgICAgICAgICAvL3Byb2ZpbGVfaWQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9ob21lJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRMTkhvbWUgcmVzcG9uc2UnKVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqIClcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG4gICAgICAgICAgICAvLyBpZiAoIG9iai5kYXRhLmxlbmd0aCA9PSAyNSApXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gc2VsZi5uZXh0ID0gMjU7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5nZXRMTkluYm94ID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkluYm94JyxcclxuICAgICAgICAgICAgLy9zdHJlYW06ICdpbkJveCcsXHJcbiAgICAgICAgICAgIHByb2ZpbGVfaWQ6IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVfSWQsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9pbmJveCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0TG5JbmJveCByZXNwb25zZScpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2dyb3VwcycgfHwgdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaXRlbXNbIDAgXSAhPT0gdW5kZWZpbmVkICkgZGF0YSA9IGRhdGEuY29uY2F0KCB0aGlzLml0ZW1zWyAwIF0uZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vaWYgKCB0aGlzLmlkID09ICdsbl9jb21wYW5pZXMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qZWxzZSovIG5ld19mZWVkX2l0ZW0gPSBuZXcgTGlua2VkaW5GZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnZ3JvdXBzJyB8fCB0aGlzLmlkID09ICdsbl9jb21wYW5pZXMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2lmICggdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApIG5ld19mZWVkX2l0ZW0gPSBuZXcgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKmVsc2UqLyBuZXdfZmVlZF9pdGVtID0gbmV3IExpbmtlZGluRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gTGlua2VkaW5GZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gIFRpbWVsaW5lRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG5cclxuICAgIGZ1bmN0aW9uIExpbmtlZGluRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmtlZGluRmVlZEl0ZW07XHJcbiAgICBcclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzO1xyXG5cclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlckNvbW1lbnQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXJDb21tZW50O1xyXG5cclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLmFkZF9jb21tZW50ID0gZnVuY3Rpb24gKCBtZXNzYWdlLCBkaXJlY3QsIHNoYXJlIClcclxuICAgIHtcclxuXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gTGlua2VkaW5GZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gUGludGVyZXN0RmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGludGVyZXN0RmVlZDtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdwaV9teUFjdGl2aXR5JzogdGhpcy5nZXRNeUFjdGl2aXR5KCk7XHJcbiAgICAgICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaV9ib2FyZCc6IHRoaXMuZ2V0Qm9hcmRzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaV9waW5zJzogdGhpcy5nZXRQaW50ZXJlc3RGZWVkKCB0aGlzLmlkICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaV9saWtlcyc6IHRoaXMuZ2V0UGludGVyZXN0RmVlZCggdGhpcy5pZCApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuZ2V0Qm9hcmRzID0gZnVuY3Rpb24gKCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLCBkYXRhID0gW107XHJcblxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vaWYgKCB3aW5kb3cuZ2xvYmFscy5waUJvYXJkcyAmJiB3aW5kb3cuZ2xvYmFscy5waUJvYXJkcy5pZCA9PT0gdGhpcy5wcm9maWxlLmFjY291bnQuaWQgKSBkYXRhID0gd2luZG93Lmdsb2JhbHMucGlCb2FyZHMuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUuYWNjb3VudC5wcm9maWxlcy5mb3JFYWNoKCBmdW5jdGlvbiggcHJvZmlsZSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgfHwgcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgIT09ICd1c2VyJyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2ZpbGUuZGF0YS51c2VySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9maWxlLnVzZXJuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vd2luZG93Lmdsb2JhbHMucGlCb2FyZHMgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICkgKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZDtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YSApO1xyXG4gICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uICggc3RyZWFtLCBwYXJhbWV0ZXJzLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiggc2VsZi5uZXh0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBrZXk6ICdjdXJzb3InLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHNlbGYubmV4dCAgICAgXHJcbiAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgIGtleTogJ2xpbWl0JyxcclxuICAgICAgICAgICAgdmFsdWU6ICcyMCcgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0UGludGVyZXN0RmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbSxcclxuICAgICAgICAgICAgcGFyYW1ldGVyczogcGFyYW1ldGVyc1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9waW50ZXJlc3QnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTsgXHJcbiAgICAgICAgfSk7ICAgICAgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5nZXRQaW50ZXJlc3RGZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgcGFyYW1ldGVycyA9IFtdO1xyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdmaWVsZHMnLFxyXG4gICAgICAgICAgICB2YWx1ZTogJ2lkLGxpbmssdXJsLGNyZWF0b3IsYm9hcmQsY3JlYXRlZF9hdCxub3RlLGNvdW50cyxtZWRpYSxhdHRyaWJ1dGlvbixpbWFnZSxtZXRhZGF0YScgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZWxmLnJlcXVlc3QoIHN0cmVhbSwgcGFyYW1ldGVycywgZnVuY3Rpb24gKCBvYmogKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PT0gJ0ZBSUwnIHx8ICggb2JqLmRhdGEuc3RhdHVzICYmIG9iai5kYXRhLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYWdlID0gb2JqLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgaWYgKCBwYWdlICYmIHBhZ2UuY3Vyc29yICkgc2VsZi5uZXh0ID0gcGFnZS5jdXJzb3I7XHJcbiAgICAgICAgICAgIG9iai5kYXRhID0gb2JqLmRhdGEuZGF0YTsgXHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTsgIFxyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoICF0aGlzLm5leHQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzID0gW107XHJcblxyXG4gICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgIGtleTogJ2ZpZWxkcycsXHJcbiAgICAgICAgICAgIHZhbHVlOiAnaWQsbGluayx1cmwsY3JlYXRvcixib2FyZCxjcmVhdGVkX2F0LG5vdGUsY291bnRzLG1lZGlhLGF0dHJpYnV0aW9uLGltYWdlLG1ldGFkYXRhJyAgICAgXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlbGYucmVxdWVzdCggc2VsZi5pZCwgcGFyYW1ldGVycywgZnVuY3Rpb24gKCBvYmogKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PT0gJ0ZBSUwnIHx8ICggb2JqLmRhdGEuc3RhdHVzICYmIG9iai5kYXRhLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlID0gb2JqLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgICAgIGlmICggcGFnZSAmJiBwYWdlLmN1cnNvciApIHNlbGYubmV4dCA9IHBhZ2UuY3Vyc29yO1xyXG4gICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgb2JqLmRhdGEgPSBvYmouZGF0YS5kYXRhOyBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAncGlfYm9hcmQnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICkgKTtcclxuICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyApIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS5ub3RlLC8vIGRhdGEubWVzc2FnZSxcclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuY291bnRzICYmIGRhdGEuY291bnRzLnJlcGlucyApIHRoaXNfZGF0dW0ucmVwaW5zID0gJycgKyBkYXRhLmNvdW50cy5yZXBpbnM7XHJcblxyXG4gICAgICAgIGVsc2UgdGhpc19kYXR1bS5yZXBpbnMgPSAnJztcclxuXHJcbiAgICAgICAgdGhpc19kYXR1bS5saW5rID0gZGF0YS5saW5rO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuY291bnRzICYmIGRhdGEuY291bnRzLmxpa2VzICkgdGhpc19kYXR1bS5saWtlcyA9IHsgY291bnQ6IGRhdGEuY291bnRzLmxpa2VzIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5jb3VudHMgJiYgZGF0YS5jb3VudHMuY29tbWVudHMgKSB0aGlzX2RhdHVtLmNvbW1lbnRzID0geyBjb3VudDogZGF0YS5jb3VudHMuY29tbWVudHMgfTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLnVybCApIHRoaXNfZGF0dW0ucGVybWFsaW5rID0gZGF0YS51cmw7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5pbWFnZSAmJiBkYXRhLmltYWdlLm9yaWdpbmFsIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAncGhvdG8nLFxyXG4gICAgICAgICAgICAgICAgc3JjOiBkYXRhLmltYWdlLm9yaWdpbmFsLnVybFxyXG4gICAgICAgICAgICB9OyAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLm1ldGFkYXRhICYmIGRhdGEubWV0YWRhdGEubGluayAmJiBkYXRhLm1ldGFkYXRhLmxpbmsuZmF2aWNvbiAmJiBkYXRhLm1ldGFkYXRhLmxpbmsuc2l0ZV9uYW1lIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiA9ICc8ZGl2IGNsYXNzPVwicGktZnJvbVwiPjxpbWcgc3JjPVwiJyArIGRhdGEubWV0YWRhdGEubGluay5mYXZpY29uOyBcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uICs9ICdcIiAvPjwvZGl2PmZyb20gJyArIGRhdGEubWV0YWRhdGEubGluay5zaXRlX25hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyAmJiB0aGlzX2RhdHVtLm1lc3NhZ2UgKSB0aGlzX2RhdHVtLm1lc3NhZ2UgPSB0aGlzX2RhdHVtLm1lc3NhZ2UucmVwbGFjZSgnICAgICAgIE1vcmUgICAgICAgJywnJykudHJpbSgpO1xyXG5cclxuICAgICAgICAvLyBpZiAoIGRhdGEuYm9hcmQgIT0gdW5kZWZpbmVkICYmIGRhdGEuYm9hcmQubGVuZ3RoID4gMCApIFxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgaWYgKCB0aGlzLmlkID09ICdwaV9teUFjdGl2aXR5JykgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uID0gJ1Bpbm5lZCBvbnRvOiAnICsgZGF0YS5ib2FyZDtcclxuXHJcbiAgICAgICAgLy8gICAgIGVsc2UgIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiA9ICdQaW5uZWQgZnJvbTogPGEgaHJlZj1cImh0dHA6Ly9waW50ZXJlc3QuY29tL3NvdXJjZS8nICsgZGF0YS5ib2FyZCArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICsgZGF0YS5ib2FyZCArICc8L2E+JztcclxuICAgICAgICAvLyB9IFxyXG5cclxuICAgICAgICAvLyBlbHNlIGlmICggdGhpcy5pZCA9PSAncGlfYm9hcmQnICYmIGRhdGEudXNlcl9uYW1lICE9IHVuZGVmaW5lZCAmJiBkYXRhLnVzZXJfbmFtZSA9PSAnUGlubmVkIGJ5IHBpbm5lcicgKSB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gPSBkYXRhLnVzZXJfbmFtZTsgICAgICBcclxuXHJcbiAgICAgICAgLy8gaWYgKCBkYXRhLmltZyAhPSB1bmRlZmluZWQgJiYgZGF0YS5pbWdbIDAgXSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgdGhpc19kYXR1bS5tZWRpYSA9IHtcclxuICAgICAgICAvLyAgICAgICAgIHR5cGU6ICdwaG90bycsXHJcbiAgICAgICAgLy8gICAgICAgICBzcmM6IGRhdGEuaW1nWyAwIF1cclxuICAgICAgICAvLyAgICAgfTsgICBcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtOyBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuY2hhbmdlUGluQm9hcmQgPSBmdW5jdGlvbiggcHJvZmlsZSwgYWN0aW9uLCBjb21tYW5kLCBwYXJhbWV0ZXJzLCBvYmplY3RfaWQsIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgIGNvbW1hbmQ6IGNvbW1hbmQsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogcHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIG9iamVjdF9pZDogb2JqZWN0X2lkIHx8ICcnLFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiBwYXJhbWV0ZXJzIHx8IFtdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saWtlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggb2JqICk7IFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gUGludGVyZXN0RmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFRpbWVsaW5lRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubGlrZXMgPT09IHVuZGVmaW5lZCApIHRoaXMuZGF0YS5saWtlcyA9IHtjb3VudDogMH07XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhICE9PSB1bmRlZmluZWQgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uID0gdGhpcy5kYXRhLnJhd19kYXRhLmNvbnZlcnNhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29udmVyc2F0aW9uICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb252ZXJzYXRpb24udHdlZXRzICkgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uLnR3ZWV0cyA9IFsgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbi50d2VldHMgXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWFfY29udGVudCA9PT0gdW5kZWZpbmVkICkgdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpbWVsaW5lRmVlZEl0ZW07XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0TmFtZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBzZWxmLmRhdGEuZnJvbU5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldFRpbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXAgPSBwYXJzZUludCggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSxcclxuICAgICAgICAgICAgdGltZSA9ICcnO1xyXG5cclxuICAgICAgICB2YXIgbmV3X2RhdGUgPSBuZXcgRGF0ZSggdGltZXN0YW1wICogMTAwMCApLFxyXG4gICAgICAgICAgICBkYXRlID0gbmV3X2RhdGU7Ly8uZm9ybWF0KCdtbW0gZGQsIHl5eXksIGg6TU10dCcpO1xyXG5cclxuICAgICAgICBpZiAoICFpc05hTiggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ1RXRm9sbG93ZXJzJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gJ0AnICt0aGlzLmRhdGEudXNlcm5hbWU7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRpbWUgPSBkYXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayAhPT0gJ2ZhY2Vib29rJyB8fCAoIHRoaXMuZmVlZC5pZCAhPSAnc2VhcmNoJyAmJiB0aGlzLmZlZWQuaWQgIT09ICdvdXRyZWFjaCcgKSB8fCAoIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT09IHVuZGVmaW5lZCApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpbWUgPSAnQCcgK3RoaXMuZGF0YS51c2VybmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwYWdlJyB8fCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT0gJ3BsYWNlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gdGhpcy5kYXRhLmNhdGVnb3J5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGltZTtcclxuICAgIH07IFxyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIFRpbWVsaW5lRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gVHdpdHRlckZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggLyp3aW5kb3cuZ2xvYmFscy50d19mZWVkc19saXZlX3VwZGF0ZSAmJiovIFsnaG9tZUZlZWQnLCdsaXN0cycsJ21lbnRpb25zJywndHdGb2xsb3dlcnMnLCdkaXJlY3RfbWVzc2FnZSddLmluZGV4T2YoIHN0cmVhbS5zdHJlYW1JZCApICE9PSAtMSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZlZWQgPSB0cnVlOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHdpdHRlckZlZWQ7XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICggcmVtb3ZlX21lc3NhZ2UgKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUudXBkYXRlRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hvbWVGZWVkJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0hvbWVGZWVkJyk7IC8vIDwtLSBzaW1pbGFyIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ21lbnRpb25zJzogdGhpcy5yZXF1ZXN0KCdnZXRUV01lbnRpb25zJyk7IC8vIDwtLSBzaW1pbGFyIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3Rm9sbG93ZXJzJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0ZvbGxvd2VycycpOyAvLyA8LS0gdG90YWxseSB1bmlxdWVcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3RnJpZW5kcyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdGcmllbmRzTGlzdCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2VuZFR3ZWV0cyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdTZW5kVHdlZXRzJyk7IC8vIDwtLSBzaW1pbGFyLWlzaCB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdteVR3ZWV0c1JldHdlZXRlZCc6IHRoaXMucmVxdWVzdCgnZ2V0VFdSZXR3ZWV0cycpOyAvLyA8LS0gc2ltaWxhci1pc2ggdG8gVGltZWxpbmVGZWVkSXRlbVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAndHdGYXZvcml0ZXMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXRmF2b3JpdGVzJyk7IC8vIDwtLSBzaW1pbGFyIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2RpcmVjdF9tZXNzYWdlJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0luQm94Jyk7IC8vIDwtLSBzaW1pbGFyIHRvIENvbGxhcHNpYmxlRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xpc3RzJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0xpc3RzJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdzZWFyY2gnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VhcmNoJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdvdXRyZWFjaCc6IHRoaXMucmVxdWVzdCgnZ2V0VFdTZWFyY2gnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2xpc3RzJyB8fCB0aGlzLmlkID09ICdzZWFyY2gnIHx8IHRoaXMuaWQgPT0gJ291dHJlYWNoJyB8fCB0aGlzLmlkID09ICdkaXJlY3RfbWVzc2FnZScgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy90aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTsgXHJcbiAgICAgICAgICAgIC8vdGhpcy5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnJyxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIG1heF9pZDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggKCB0aGlzLmlkID09PSAndHdGb2xsb3dlcnMnIHx8IHRoaXMuaWQgPT09ICd0d0ZyaWVuZHMnICkgJiYgc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3QgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS51c2VySUQgPSBzZWxmLm9wdGlvbnMudXNlcl9pZF9mb3JfcmVxdWVzdDsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2hvbWVGZWVkJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdIb21lRmVlZCc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnbWVudGlvbnMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV01lbnRpb25zJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICd0d0ZvbGxvd2Vycyc6IGRhdGEuYWN0aW9uID0gJ2dldFRXRm9sbG93ZXJzJzsgXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdGcmllbmRzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdGcmllbmRzTGlzdCc7IFxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3NlbmRUd2VldHMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV1NlbmRUd2VldHMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ215VHdlZXRzUmV0d2VldGVkJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdSZXR3ZWV0cyc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdGYXZvcml0ZXMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV0Zhdm9yaXRlcyc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAnZGlyZWN0X21lc3NhZ2UnOiBcclxuICAgICAgICAgICAgLy8gICAgIGRhdGEuYWN0aW9uID0gJ2dldFRXSW5Cb3gnO1xyXG4gICAgICAgICAgICAvLyAgICAgZGF0YS5pbmJveF9tYXhfaWQgPSB0aGlzLm5leHQuaW5ib3g7XHJcbiAgICAgICAgICAgIC8vICAgICBkYXRhLm91dGJveF9tYXhfaWQgPSB0aGlzLm5leHQub3V0Ym94O1xyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3R3aXR0ZXInLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcCB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKSBkYXRhLmRhdGEuc3BsaWNlKCAwLCAxICk7IC8vIGJhY2tlbmQgcmV0dXJucyBsYXN0IGl0ZW0gZnJvbSBwcmV2IHJlcXVlc3QgYXMgZmlyc3QgaXRlbSBoZXJlXHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuY3Vyc29yICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuY3Vyc29yWyAwIF0gIT09IDAgKSBzZWxmLm5leHQgPSBkYXRhLmN1cnNvclsgMCBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhWyBkYXRhLmRhdGEubGVuZ3RoIC0gMSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBUV1NlYXJjaENvbnRhaW5lcjogc2VsZiA9IHRoaXM7IHByb2ZpbGUgPSBzZWxmLmRhdGEucHJvZmlsZVxyXG4gICAgLy8gdHlwZSA9IHR3ZWV0cyBPUiBwZW9wbGVcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLnNlYXJjaF9yZXF1ZXN0ID0gZnVuY3Rpb24gKCBzZWxmLCBjYWxsYmFjaywgY2xhc3NfbmFtZSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHBhcmFtZXRlcnMgPSBbXSwgbmV4dCwgcXVlcnksIHByb2ZpbGUsIHJlc3VsdF90eXBlLCB0eXBlLCBsYW5nLCBnZW9jb2RlO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHNlbGYuY29uc3RydWN0b3IubmFtZSA9PSAnVHdpdHRlckZlZWQnIClcclxuICAgICAgICBpZiAoIGNsYXNzX25hbWUgPT0gJ1R3aXR0ZXJGZWVkJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMudHlwZTtcclxuICAgICAgICAgICAgcXVlcnkgPSBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeTtcclxuICAgICAgICAgICAgcHJvZmlsZSA9IHNlbGYucHJvZmlsZTtcclxuICAgICAgICAgICAgcmVzdWx0X3R5cGUgPSBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5yZXN1bHRfdHlwZTtcclxuICAgICAgICAgICAgbmV4dCA9IHNlbGYubmV4dDtcclxuICAgICAgICAgICAgbGFuZyA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLmxhbmc7IFxyXG4gICAgICAgICAgICBnZW9jb2RlID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMuZ2VvY29kZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmRhdGEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZSA9IHNlbGYuZGF0YS50eXBlO1xyXG4gICAgICAgICAgICBxdWVyeSA9IHNlbGYuZGF0YS5xdWVyeTtcclxuICAgICAgICAgICAgcHJvZmlsZSA9IHNlbGYuZGF0YS5wcm9maWxlO1xyXG4gICAgICAgICAgICByZXN1bHRfdHlwZSA9IHNlbGYuZGF0YS5yZXN1bHRfdHlwZTtcclxuICAgICAgICAgICAgcGFnZSA9IHNlbGYuZGF0YS5wYWdlO1xyXG4gICAgICAgICAgICBuZXh0ID0gc2VsZi5kYXRhLm5leHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdxJyxcclxuICAgICAgICAgICAgdmFsdWU6IHF1ZXJ5XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICggdHlwZSA9PSAndHdlZXRzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAga2V5OiAncmVzdWx0X3R5cGUnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlc3VsdF90eXBlXHJcbiAgICAgICAgICAgIH0pOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggbGFuZyAhPT0gdW5kZWZpbmVkICYmIGxhbmcubGVuZ3RoID4gMCAmJiBsYW5nICE9ICdhbGwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ2xhbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBsYW5nXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZ2VvY29kZSAhPT0gdW5kZWZpbmVkICYmIGdlb2NvZGUubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAga2V5OiAnZ2VvY29kZScsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGdlb2NvZGVcclxuICAgICAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL3Blb3BsZVxyXG4gICAgICAgIGVsc2UgaWYgKCBuZXh0ICE9PSB1bmRlZmluZWQgJiYgbmV4dCAhPT0gZmFsc2UgKSBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ3BhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBuZXh0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6IFwiZmVlZC90d2l0dGVyXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogcHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBwcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0VFdTZWFyY2gnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggdHlwZSA9PSAndHdlZXRzJyAmJiByZXN1bHRfdHlwZSA9PSAncmVjZW50JyAmJiBuZXh0ICE9PSB1bmRlZmluZWQgKSByZXF1ZXN0LmRhdGEubWF4X2lkID0gbmV4dDtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrX2RhdGEgPSAnRkFJTCc7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEucmV0dXJuQ29kZSA9PSAnU1VDQ0VTUycgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZXJyb3JzICE9PSB1bmRlZmluZWQgJiYgZGF0YS5lcnJvcnMubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yID0gZGF0YS5lcnJvcnNbIDAgXS5zdHJlYW1FbnRyeTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlcnJvciAhPT0gdW5kZWZpbmVkICYmIGVycm9yLm1lc3NhZ2UpIHt9Ly9FQy5VSS5hbGVydCgnVFcgZXJyb3I6ICcgKyBlcnJvci5tZXNzYWdlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgRUMuVUkuYWxlcnQoRUMuZ2V0TWVzc2FnZSgnVU5LTk9XTl9FUlInKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja19kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEubmV4dCAhPT0gdW5kZWZpbmVkICkgY2FsbGJhY2tfZGF0YS5uZXh0ID0gZGF0YS5uZXh0OyBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBFQy5VSS5hbGVydChFQy5nZXRNZXNzYWdlKCdGQUlMX0VSUicpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGNhbGxiYWNrX2RhdGEgKTtcclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gKCBhY3Rpb24gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3R3aXR0ZXInXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBhY3Rpb24gPT0gJ2dldFRXU2VhcmNoJyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUgPT09IHVuZGVmaW5lZCApIC8vZW1wdHkgc2VhcmNoIGZlZWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5ICE9PSB1bmRlZmluZWQgJiYgc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnkubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZWFyY2hfcmVxdWVzdCggc2VsZiwgZnVuY3Rpb24oIGRhdGEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYgKCBzZWxmLmRhdGEucmVzdWx0X3R5cGUgPT0gJ3BvcHVsYXInIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vJHBlb3BsZV9zZWN0aW9uLmNzcygnZGlzcGxheScsJ2Jsb2NrJyk7IFxyXG4gICAgICAgICAgICAgICAgICAgIH0sICdUd2l0dGVyRmVlZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGFjdGlvbiA9PSAnZ2V0VFdMaXN0cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGxpc3RzID0gdGhpcy5wcm9maWxlLmxpc3RzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBsaXN0cyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBsaXN0cy5kZWZhdWx0X2VsZW1lbnQgIT09IHVuZGVmaW5lZCApIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gbGlzdHMuZGVmYXVsdF9lbGVtZW50OyBcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGxpc3RzLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBsaXN0cy5kYXRhLmxlbmd0aCA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcmVmcmVzaCBpc2Nyb2xsXHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keSAuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGxpc3RzLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5IC5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIHN0cmVhbTogdGhpcy5pZFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKCAoIGFjdGlvbiA9PT0gJ2dldFRXRm9sbG93ZXJzJyB8fCBhY3Rpb24gPT09ICdnZXRUV0ZyaWVuZHNMaXN0JyApICYmIHNlbGYub3B0aW9ucy51c2VyX2lkX2Zvcl9yZXF1ZXN0IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGF0YS51c2VySUQgPSBzZWxmLm9wdGlvbnMudXNlcl9pZF9mb3JfcmVxdWVzdDsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IGRhdGE7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnJWNUVyAnICsgYWN0aW9uICsgJ3JlcXVlc3Q6JywgJ2NvbG9yOm9yYW5nZXJlZCcpXHJcblxyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjVFcgJyArIGFjdGlvbiArICdyZXNwb25zZTonLCAnY29sb3I6b3JhbmdlcmVkJylcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpZiAoIHJlcXVlc3QuZGF0YS5hY3Rpb24gPT0gJ2dldFRXU2VuZFR3ZWV0cycpIGNvbnNvbGUuZXJyb3IoIGRhdGEgKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggZGF0YS5jdXJzb3IgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmN1cnNvclsgMCBdICE9PSAwICkgc2VsZi5uZXh0ID0gZGF0YS5jdXJzb3JbIDAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLmRhdGFbIGRhdGEuZGF0YS5sZW5ndGggLSAxIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpZiAoIHJlcXVlc3QuZGF0YS5hY3Rpb24gPT0gJ2dldFRXSW5Cb3gnICkgc2VsZi5lbGVtZW50LmZpbmQoJy5idG4udG9nZ2xlJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICB9KTsgICBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgIC8vIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdsaXN0cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLml0ZW1zWyAwIF0gIT09IHVuZGVmaW5lZCApIGRhdGEgPSBkYXRhLmNvbmNhdCggdGhpcy5pdGVtc1sgMCBdLmRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdtZW50aW9ucycgKSBuZXdfZmVlZF9pdGVtID0gbmV3IFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtKCBbdGhpc19kYXR1bV0sIHNlbGYgKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBuZXdfZmVlZF9pdGVtLFxyXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGk7XHJcblxyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgLy8gZGlyZWN0IG1lc3NhZ2VzIGZlZWRcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2RpcmVjdF9tZXNzYWdlJyAmJiBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgY3VzZXJJZCA9IHNlbGYucHJvZmlsZS5hY2NvdW50LmRhdGEudXNlcklkO1xyXG5cclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGFbIGkgXS5jb252ZXJzYXRpb24gPT09IHVuZGVmaW5lZCB8fCBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5ID09PSB1bmRlZmluZWQgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5ICkpIGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnkgPSBbIGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnkgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5LCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGsgPSAwLCBsbCA9IGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnkubGVuZ3RoOyBrIDwgbGw7IGsrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNtZXNzYWdlID0gZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeVsgayBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggY21lc3NhZ2UucmVjaXBpZW50LmlkX3N0ciA9PT0gY3VzZXJJZCApIC8vIGxhdGVzdCBpbmNvbWluZyBpbiBjb252ZXJzYXRpb25cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbmNvbWluZy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGNtZXNzYWdlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCBjbWVzc2FnZS5jcmVhdGVkX2F0ICkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGNtZXNzYWdlLmlkX3N0clxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbWluY29taW5nLnNvcnQoIGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYS50aW1lID4gYi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA8IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pOyAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBmaW5kIGxhdGVzdCBpbmNvbWluZ1xyXG4gICAgICAgICAgICBpZiAoIG1pbmNvbWluZy5sZW5ndGggPiAwICkgc2VsZi5maXJzdEl0ZW1JRCA9IG1pbmNvbWluZ1sgMCBdLnRpbWU7XHJcblxyXG4gICAgICAgICAgICBlbHNlICBzZWxmLmZpcnN0SXRlbUlEID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdsaXN0cycgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdzZWFyY2gnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnb3V0cmVhY2gnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICkgZm9yICggaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdtZW50aW9ucycgKSBuZXdfZmVlZF9pdGVtID0gbmV3IFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtKCBbdGhpc19kYXR1bV0sIHNlbGYgKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZm9ybWF0X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICB1c2VyOiBkYXRhLnVzZXIsXHJcbiAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGRhdGEuY3JlYXRlZF9hdCApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgZmF2b3JpdGVzOiB7XHJcbiAgICAgICAgICAgICAgICBjb3VudDogZGF0YS5mYXZvcml0ZV9jb3VudCxcclxuICAgICAgICAgICAgICAgIGJ5X21lOiBkYXRhLmZhdm9yaXRlZFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXR3ZWV0czoge1xyXG4gICAgICAgICAgICAgICAgY291bnQ6IGRhdGEucmV0d2VldF9jb3VudCxcclxuICAgICAgICAgICAgICAgIGJ5X21lOiBkYXRhLnJldHdlZXRlZCxcclxuICAgICAgICAgICAgICAgIGlkOiAoICggZGF0YS5yZXR3ZWV0ZWRfc3RhdHVzICE9PSB1bmRlZmluZWQgKSA/IGRhdGEucmV0d2VldGVkX3N0YXR1cy5pZF9zdHIgOiBkYXRhLmlkX3N0ciApLFxyXG4gICAgICAgICAgICAgICAgcmV0d2VldElkOiAoICggZGF0YS5yZXR3ZWV0SWQgIT09IHVuZGVmaW5lZCApID8gZGF0YS5yZXR3ZWV0SWQgOiBmYWxzZSApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEudGV4dCxcclxuICAgICAgICAgICAgZnJvbU5hbWU6ICggZGF0YS5uYW1lIHx8IGRhdGEudXNlci5uYW1lICksXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiAoIGRhdGEuc2NyZWVuX25hbWUgfHwgZGF0YS51c2VyLnNjcmVlbl9uYW1lICksXHJcbiAgICAgICAgICAgIHByb2ZpbGVQaWM6ICggZGF0YS5wcm9maWxlX2ltYWdlX3VybCB8fCBkYXRhLnVzZXIucHJvZmlsZV9pbWFnZV91cmwgKSxcclxuICAgICAgICAgICAgcG9zdElEOiBkYXRhLmlkX3N0cixcclxuICAgICAgICAgICAgaWQ6IGRhdGEuaWRfc3RyLFxyXG4gICAgICAgICAgICByYXdfZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5lbnRpdGllcyAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZW50aXRpZXMubWVkaWEgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBkYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCApIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEgPSBbXTtcclxuICAgICAgICAgICAgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwuZm9yRWFjaChmdW5jdGlvbihtZWRpYV91cmwpe1xyXG4gICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncGhvdG8nLFxyXG4gICAgICAgICAgICAgICAgICAgIHNyYzogbWVkaWFfdXJsXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgdXJscyA9IFtdO1xyXG4gICAgICAgIGlmICggZGF0YS5lbnRpdGllcyAmJiBkYXRhLmVudGl0aWVzLnVybHMgJiYgISBfLmlzRW1wdHkoIGRhdGEuZW50aXRpZXMudXJscyApIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybHMgPSBkYXRhLmVudGl0aWVzLnVybHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCB1cmxzICkgKSB1cmxzID0gWyB1cmxzIF07ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZm9yIHNoYXJlZCBZVCBsaW5rXHJcbiAgICAgICAgaWYgKCB1cmxzLmxlbmd0aCAmJiAoIWRhdGEuZW50aXRpZXMubWVkaWEgfHwgXHJcbiAgICAgICAgICAgICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZW50aXRpZXMubWVkaWEgKSAmJiBkYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCAmJiBkYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybC5pbmRleE9mKCdodHRwczovL2kueXRpbWcuY29tLycpICE9PSAtMSApKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB2aWRlb19pZDtcclxuICAgICAgICAgICAgaWYgKCB1cmxzWzBdLmV4cGFuZGVkX3VybC5pbmRleE9mKCd5b3V0dWJlLmNvbScpICE9PSAtMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYXNoZXMgPSB1cmxzWzBdLmV4cGFuZGVkX3VybC5zbGljZSggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZignPycpICsgMSApLnNwbGl0KCcmJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBoYXNoZXMubGVuZ3RoOyBpKysgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hlc1tpXS5zcGxpdCgnPScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGhhc2hbMF0gPT0gJ3YnICkgdmlkZW9faWQgPSBoYXNoWzFdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB1cmxzWzBdLmV4cGFuZGVkX3VybC5pbmRleE9mKCcvL3lvdXR1LmJlLycpICE9PSAtMSApIHZpZGVvX2lkID0gdXJsc1swXS5leHBhbmRlZF91cmwucmVwbGFjZSgnaHR0cHM6Ly95b3V0dS5iZS8nLCcnKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICggdmlkZW9faWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmVudGl0aWVzLm1lZGlhID0geyBtZWRpYV91cmw6J2h0dHBzOi8vaW1nLnlvdXR1YmUuY29tL3ZpLycgK3ZpZGVvX2lkKyAnL2hxZGVmYXVsdC5qcGcnIH07XHJcbiAgICAgICAgICAgICAgICBkYXRhLmVudGl0aWVzLnZpZGVvX2lkID0gdmlkZW9faWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggdGhpc19kYXR1bS5tZXNzYWdlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9kZWxldGUgbGlua3NcclxuICAgICAgICAgICAgdmFyIGV4cCA9IC8oXFxiKChodHRwcz98ZnRwfGZpbGUpOlxcL1xcL3xiaXQubHlcXC98Z29vLmdsXFwvfHQuY29cXC8pWy1BLVowLTkrJkAjXFwvJT89fl98ITosLjtdKlstQS1aMC05KyZAI1xcLyU9fl98XSkvaWc7XHJcblxyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgPSB0aGlzX2RhdHVtLm1lc3NhZ2UucmVwbGFjZShleHAsJycpLnRyaW0oKTtcclxuXHJcbiAgICAgICAgICAgIHVybHMuZm9yRWFjaChmdW5jdGlvbih1cmwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVzc2FnZSArPSAnICcgKyB1cmwudXJsOyAgIFxyXG4gICAgICAgICAgICB9KTsgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5nZXRfcG9zdF9tZWRpYV9lbGVtZW50ID0gZnVuY3Rpb24gKCByYXdfZGF0YSwgJG1lZGlhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgZXh0X2VsZW1lbnQsXHJcbiAgICAgICAgICAgIHNsaWRlcl9pdGVtcyA9IFtdO1xyXG4gICAgICAgIGlmICggcmF3X2RhdGEgJiYgcmF3X2RhdGEuZW50aXRpZXMgJiYgcmF3X2RhdGEuZW50aXRpZXMubWVkaWEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGV4dF9tZWRpYV9kYXRhID0gcmF3X2RhdGEuZW50aXRpZXMuZXh0X21lZGlhLFxyXG4gICAgICAgICAgICAgICAgZXh0X21lZGlhLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDtcclxuXHJcbiAgICAgICAgICAgIGlmKCBleHRfbWVkaWFfZGF0YSAmJiBleHRfbWVkaWFfZGF0YS5tZWRpYSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZXh0X21lZGlhX2RhdGEubWVkaWEgKSApIGV4dF9tZWRpYSA9IGV4dF9tZWRpYV9kYXRhLm1lZGlhWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBleHRfbWVkaWEgPSBleHRfbWVkaWFfZGF0YS5tZWRpYTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBleHRfbWVkaWEgJiYgKCBleHRfbWVkaWEudHlwZSA9PT0gJ2FuaW1hdGVkX2dpZicgfHwgZXh0X21lZGlhLnR5cGUgPT09ICd2aWRlbycgKSAmJiBleHRfbWVkaWEudmlkZW9faW5mbyAmJiBleHRfbWVkaWEudmlkZW9faW5mby52YXJpYW50cyAmJiBleHRfbWVkaWEudmlkZW9faW5mby52YXJpYW50cy52YXJpYW50IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhcmlhbnRfZGF0YSA9IGV4dF9tZWRpYS52aWRlb19pbmZvLnZhcmlhbnRzLnZhcmlhbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCB2YXJpYW50X2RhdGEgKSApIHZhcmlhbnQgPSB2YXJpYW50X2RhdGFbIDAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHZhcmlhbnQgPSB2YXJpYW50X2RhdGE7ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHZhcmlhbnQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkbWVkaWEuYWRkQ2xhc3MoJ2NlbnRlcicpO1xyXG4gICAgICAgICAgICAgICAgLy9leHRfZWxlbWVudCA9ICQoJzx2aWRlbyBsb29wIGNsYXNzPVwiYW5pbWF0ZWQtZ2lmXCIgcG9zdGVyPVwiJyArIGV4dF9tZWRpYS5tZWRpYV91cmxfaHR0cHMgKyAnXCIgc3JjPVwiJyArIHZhcmlhbnQudXJsICsgJ1wiPjwvdmlkZW8+Jyk7XHJcbiAgICAgICAgICAgICAgICAvKmlmICggZXh0X21lZGlhLnR5cGUgPT09ICdhbmltYXRlZF9naWYnICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKCc8dmlkZW8gYXV0b3BsYXkgbG9vcCBjbGFzcz1cImFuaW1hdGVkLWdpZlwiIHBvc3Rlcj1cIicgKyBleHRfbWVkaWEubWVkaWFfdXJsX2h0dHBzICsgJ1wiIHNyYz1cIicgKyB2YXJpYW50LnVybCArICdcIj48L3ZpZGVvPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgeyovXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3VpLWdyaWQtc29sbyBsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94IHZpZGVvIHVpLWdyaWQtc29sbyBwb3NpdGlvbi1yZWxhdGl2ZSc+PGltZyBjbGFzcz1cXFwidmlkZW8tYnV0dG9uXFxcIiBzcmM9XFxcImltZy9wbGF5LWJ1dHRvbi5wbmdcXFwiPjxpbWcgY2xhc3M9XFxcImltZy1yZXNwb25zaXZlXFxcIiBzcmM9J1wiICsgZXh0X21lZGlhLm1lZGlhX3VybF9odHRwcyArIFwiJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nY2xlYXInPjwvZGl2PlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQub24oJ2NsaWNrJyxmdW5jdGlvbiAoKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgRUMuVUkuSUFCKCBlbmNvZGVVUkkodmFyaWFudC51cmwgKSwnJywnX3N5c3RlbScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCByYXdfZGF0YS5wcmV2aWV3X2NvbnRlbnQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aWV3X2NvbnRlbnQgPSBKU09OLnBhcnNlKCByYXdfZGF0YS5wcmV2aWV3X2NvbnRlbnQgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGUgPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R1ZmYgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBwcmV2aWV3X2NvbnRlbnQudGl0bGUgKSB0aXRsZSA9IHByZXZpZXdfY29udGVudC50aXRsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCByYXdfZGF0YS5waWN0dXJlX3RleHQgKSBzdHVmZiA9IHJhd19kYXRhLnBpY3R1cmVfdGV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2xfbWVzc2FnZSc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltZ19ib3gnPjxpbWcgc3JjPSdcIiArIHJhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCArIFwiJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nY2xlYXInPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8YSBjbGFzcz0ncGhfbGluaycgaHJlZj0nXCIgKyBwcmV2aWV3X2NvbnRlbnQudXJsICsgXCInIHRhcmdldD0nX2JsYW5rJz5cIiArIHRpdGxlICsgXCI8L2E+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBtZWRpYSc+XCIgKyBzdHVmZiArIFwiPC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnJhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCwgdzo5NjQsIGg6MTAyNH0pOyBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKCc8aW1nIGNsYXNzPVwidHdpdHRlci1pbWFnZVwiIHNyYz1cIicgK3Jhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCsgJ1wiID4nKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnJhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCwgdzo5NjQsIGg6MTAyNH0pOyBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdmlkZW9faWQgPSByYXdfZGF0YS5lbnRpdGllcy52aWRlb19pZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHZpZGVvX2lkICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkY2xpY2thYmxlID0gJCgnPGRpdj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpLmxlbmd0aCApIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZSA9IGV4dF9lbGVtZW50LmZpbmQoJy5pbWdfYm94Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50LmZpbmQoJy5pbWdfYm94JykuYWRkQ2xhc3MoJ3ZpZGVvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkY2xpY2thYmxlID0gJG1lZGlhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkbWVkaWEuYWRkQ2xhc3MoJ3ZpZGVvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkY2xpY2thYmxlLm9uKCdjbGljaycsIGZ1bmN0aW9uKCBlICl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVDLlVJLklBQiggZW5jb2RlVVJJKCAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJyt2aWRlb19pZCsnP2F1dG9wbGF5PTEnICksJycsJ19zeXN0ZW0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyp2YXIgbWVkaWFPYmplY3QgPSAnPGlmcmFtZSBzcmM9XCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nKyB2aWRlb19pZCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJz9hdXRvcGxheT0xXCIgd2lkdGg9XCIxMjgwXCIgaGVpZ2h0PVwiNzIwXCIgZnJhbWVib3JkZXI9XCIwXCI+PC9pZnJhbWU+JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdF9tYW5hZ2VyLndhdGNoUGljdHVyZVZpZGVvKCBtZWRpYU9iamVjdCwgdHJ1ZSApOyAqLyAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBbZXh0X2VsZW1lbnQsIHNsaWRlcl9pdGVtc107XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIFR3aXR0ZXJGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnRHJvcGRvd25GZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIERyb3Bkb3duRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBZb3VUdWJlRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBZb3VUdWJlRmVlZDtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teUNoYW5uZWxIb21lJzogdGhpcy5nZXRZb3VUdWJlRmVlZChcInl0X215Q2hhbm5lbEhvbWVcIixcIlwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3l0X215Q2hhbm5lbFZpZGVvcyc6IHRoaXMuZ2V0WW91VHViZUZlZWQoXCJ5dF9teUNoYW5uZWxWaWRlb3NcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teVN1YnNjcmlwdGlvbic6IHRoaXMuZ2V0WW91VHViZUZlZWQoXCJ5dF9teVN1YnNjcmlwdGlvblwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5uZXh0ID09PSB1bmRlZmluZWQgfHwgIXRoaXMubmV4dCApIHtcclxuICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKVswXS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICByZXR1cm47ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFlvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogdGhpcy5pZCxcclxuICAgICAgICAgICAgbmV4dFRva2VuOiB0aGlzLm5leHQgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3lvdVR1YmUnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEubmV4dFRva2VuICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhLm5leHRUb2tlbjtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmdldFlvdVR1YmVGZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFlvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogc3RyZWFtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmlkID09ICd5dF9teVN1YnNjcmlwdGlvbicgKSBkYXRhLmNoYW5uZWxfaWQgPSAvKidVQycgKyAqL3RoaXMucHJvZmlsZS5kYXRhLnVzZXJJZC5yZXBsYWNlKCdjaGFubmVsPT0nLCcnKTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3lvdVR1YmUnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSAhPT0gdW5kZWZpbmVkICYmIG9iai5kYXRhLm5leHRUb2tlbiAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLmRhdGEubmV4dFRva2VuO1xyXG5cclxuICAgICAgICAgICAgLy90ZW1wb3JhcnlcclxuICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAneXRfbXlTdWJzY3JpcHRpb24nIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmRlZmF1bHRDaGFubmVsSWQgIT09IHVuZGVmaW5lZCApIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRDaGFubmVsSWQ7IFxyXG4gICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ3l0X215U3Vic2NyaXB0aW9uJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YS5pdGVtcywgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLml0ZW1zICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLml0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YS5pdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuaXRlbXMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLml0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YS5pdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24oIGRhdGEgKSB7XHJcblxyXG4gICAgICAgIHZhciBtZWRpYSA9IGRhdGEubWVkaWE7XHJcblxyXG4gICAgICAgIGlmICggbWVkaWEudHlwZSA9PSBcInZpZGVvXCIgKSB7XHJcbiAgICAgICAgICAgIG1lZGlhLnZpZGVvID0ge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheV91cmw6ICdodHRwOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLycgKyBtZWRpYS5pZCArICc/YXV0b3BsYXk9MScsXHJcbiAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiAnaHR0cDovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgbWVkaWEuaWQgKyAnP2F1dG9wbGF5PTEnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgZnJvbUlkOiBkYXRhLmZyb21JZCxcclxuICAgICAgICAgICAgZnJvbU5hbWU6IGRhdGEuZnJvbU5hbWUsXHJcbiAgICAgICAgICAgIHByb2ZpbGVQaWM6IGRhdGEucHJvZmlsZVBpYyxcclxuICAgICAgICAgICAgcHJvZmlsZUxpbms6IGRhdGEucHJvZmlsZUxpbmssXHJcbiAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGRhdGEudXBkYXRlVGltZSApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS5tZXNzYWdlLFxyXG5cclxuICAgICAgICAgICAgLy9tZXRhSW5mbzogKCBkYXRhLml0ZW1zWyBpIF0uY2hhbm5lbElkIT11bmRlZmluZWQgJiYgZGF0YS5pdGVtc1sgaSBdLmNoYW5uZWxUaXRsZSE9dW5kZWZpbmVkKSxcclxuICAgICAgICAgICAgY2hhbm5lbElkOiBkYXRhLmNoYW5uZWxJZCxcclxuICAgICAgICAgICAgY2hhbm5lbExpbms6ICdodHRwczovL3d3dy55b3V0dWJlLmNvbS9jaGFubmVsLycgKyBkYXRhLmNoYW5uZWxJZCxcclxuICAgICAgICAgICAgY2hhbm5lbFRpdGxlOiBkYXRhLmNoYW5uZWxUaXRsZSxcclxuICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBkYXRhLmFjdGl2aXR5VHlwZSB8fCAnJyxcclxuXHJcbiAgICAgICAgICAgIGxpa2VzOiBkYXRhLmxpa2VzLFxyXG4gICAgICAgICAgICB2aWV3czogZGF0YS52aWV3cyxcclxuICAgICAgICAgICAgY29tbWVudHM6IGRhdGEuY29tbWVudHMsXHJcblxyXG4gICAgICAgICAgICAvL3VzZXI6IGRhdGFbIGkgXS51c2VyLFxyXG4gICAgICAgICAgICAvL25hbWU6IGRhdGEuaXRlbXNbIGkgXS50aXRsZSxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgbWVkaWE6IG1lZGlhLFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBwb3N0SUQ6IGRhdGEuZnJvbUlkLCAvLz8/P1xyXG4gICAgICAgICAgICByYXdfZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5tZXNzYWdlLmluZGV4T2YoJ3VwbG9hZGVkIGEgdmlkZW8nKSAhPSAtMSApIHRoaXNfZGF0dW0ubWVzc2FnZSA9ICcnO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIFlvdVR1YmVGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5jb25zdGFudHMnLFtdKSAgXHJcbiAgLmNvbnN0YW50KCdhcGlVcmwnLCAnaHR0cHM6Ly9lY2xpbmNoZXIuY29tL3NlcnZpY2UvJylcclxuICAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywgeyAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnIH0pOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5jb250cm9sbGVycycsIFtdKVxyXG5cclxuLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkaW9uaWNMb2FkaW5nLCBBdXRoU2VydmljZSkge1xyXG5cclxuICAgICRzY29wZS5kYXRhID0ge307XHJcbiAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgLy8kc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG5cclxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coe1xyXG4gICAgICAgICAgICBub0JhY2tkcm9wOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICB2YXIgYSA9IEF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS5kYXRhLnVzZXJuYW1lLCAkc2NvcGUuZGF0YS5wYXNzd29yZCwgZnVuY3Rpb24ocmVzcCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnWlpaOicgKyByZXNwKTtcclxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbn0pXHJcblxyXG5cclxuLmNvbnRyb2xsZXIoJ0hvbWVUYWJDdHJsJywgZnVuY3Rpb24oJHN0YXRlLCAkc2NvcGUsICRyb290U2NvcGUsIEVDLCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJHVybFJvdXRlciwgXykge1xyXG5cclxuXHJcbiAgICBjb25zb2xlLmxvZygnQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBISEhISEjIyMjIycpO1xyXG4gICAgXHJcbiAgICBpZiggJHJvb3RTY29wZS5zb2NpYWwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgY29uc29sZS5sb2coJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIpO1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmVudGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdob21lJykpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuXHJcbiAgICAkc2NvcGUuZ3JvdXBzID0gW107XHJcbiAgICAkc2NvcGUuYWNjX3R5cGVzID0gW107XHJcblxyXG4gICAgaWYoIGFjY291bnRNYW5hZ2VyLmlzX3JlbmRlcmVkKCApIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnb29vb29vb29vb29vJyk7XHJcbiAgICAgICAgcHJlcGFyZUFjY291bnRzKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ25ubm5ubm5ubm5ubicpO1xyXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7bm9CYWNrZHJvcDogdHJ1ZX0pO1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmluaXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICBwcmVwYXJlQWNjb3VudHMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwcmVwYXJlQWNjb3VudHMoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBBQ0NTID0gYWNjb3VudE1hbmFnZXIubGlzdF9hY2NvdW50cygpO1xyXG5cclxuICAgICAgICB2YXIgdGVtcCA9IFtdLFxyXG4gICAgICAgICAgICBhY2NfdHlwZXMgPSBbXTtcclxuXHJcbiAgICAgICAgQUNDUy5mb3JFYWNoKGZ1bmN0aW9uKGFjY291bnQsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGVtcFt0eXBlXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdID0gW107XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdLnByb2ZpbGVzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9lbHNlXHJcbiAgICAgICAgICAgIC8ve1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjY291bnQucHJvZmlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChhY2NvdW50LnByb2ZpbGVzW2ldLm1vbml0b3JlZCA9PSAnb2ZmJykgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXS5wcm9maWxlcy5wdXNoKGFjY291bnQucHJvZmlsZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgdGVtcFt0eXBlXS50eXBlID0gdHlwZTtcclxuICAgICAgICAgICAgaWYgKGFjY190eXBlcy5pbmRleE9mKHR5cGUpID09PSAtMSkgYWNjX3R5cGVzLnB1c2godHlwZSk7XHJcblxyXG4gICAgICAgICAgICAvL3RlbXBbdHlwZV0ucHVzaCggeyd0eXBlJzp0eXBlLCAncHJvZmlsZXMnOmFjY291bnQucHJvZmlsZXN9ICk7XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZW1wKTtcclxuICAgICAgICAkc2NvcGUuZ3JvdXBzID0gdGVtcDtcclxuICAgICAgICAkc2NvcGUuYWNjX3R5cGVzID0gYWNjX3R5cGVzO1xyXG5cclxuICAgICAgICBhY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIHRydWUgKTtcclxuXHJcbiAgICAgICAgJHNjb3BlLm9wZW5GZWVkcyA9IGZ1bmN0aW9uKCBwcm9maWxlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2ZpbGUpO1xyXG4gICAgICAgICAgICBwcm9maWxlLnNvY2lhbC5yZW5kZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAkc2NvcGUuZ25zID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldCgndGFicy5yYW0tbmV3Jyk7XHJcblxyXG4gICAgICAgICAgaWYoZ2V0RXhpc3RpbmdTdGF0ZSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybjsgXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgIFwidXJsXCI6ICcvcmFtLW5ldycsXHJcbiAgICAgICAgICAgICAgXCJ2aWV3c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAnaG9tZS10YWInOiB7XHJcbiAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9yYW0uaHRtbFwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICRzdGF0ZVByb3ZpZGVyUmVmLnN0YXRlKCd0YWJzLnJhbS1uZXcnLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICAgICAgICAkdXJsUm91dGVyLmxpc3RlbigpO1xyXG5cclxuICAgICAgICAgICRzdGF0ZS5nbygndGFicy5yYW0tbmV3Jyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhnZXRFeGlzdGluZ1N0YXRlKTtcclxuICAgICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ01hbmFnZUFjY291bnRzJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsIEVDLCAkcm9vdFNjb3BlLCAkaW9uaWNIaXN0b3J5LCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJGxvY2FsU3RvcmFnZSkge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCJyk7XHJcbiAgICBjb25zb2xlLmxvZygnJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MnKTtcclxuICAgIGNvbnNvbGUubG9nKCRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzKTtcclxuICAgIC8vY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIudGVzdCgpKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ2hvbWUnKSk7XHJcblxyXG4gICAgJHNjb3BlLmFjY291bnRzID0gYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyggJHNjb3BlLmFjY291bnRzICk7XHJcblxyXG4gICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgIHZpZXdEYXRhLmhhc0hlYWRlckJhciA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLmFkZF9hY2NvdW50ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmFkZF9hY2NvdW50KHR5cGUpO1xyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuY3N0ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5hY2NvdW50cyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKSk7XHJcbiAgICAgICAgLy9hY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIGZhbHNlICk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ0ZlZWRzJywgZnVuY3Rpb24oJHNjb3BlLCAgJGlvbmljU2Nyb2xsRGVsZWdhdGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCBFQywgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQyEhISEhIyMjIyMnKTtcclxuICAgIC8vY29uc29sZS5sb2coJyRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzJyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyKTtcclxuICAgIC8vY29uc29sZS5sb2coJHN0YXRlLmN1cnJlbnQubmFtZSk7XHJcbiAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlRGF0YUNhbkJlTG9hZGVkID0gZmFsc2U7XHJcbiAgICAkc2NvcGUuY291bnRlciA9IDA7XHJcblxyXG4gICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiAkc3RhdGUuY3VycmVudC5uYW1lfSk7XHJcbiAgICAkc2NvcGUuZmVlZCA9ICRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJHNjb3BlLmZlZWQpO1xyXG4gICAgdmFyIG5leHRfcGFnZV9pbmRleCA9IDAsXHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gMCxcclxuICAgICAgICBub19vZl9wYWdlcyA9ICRzY29wZS5mZWVkLnByb2ZpbGUuc29jaWFsLnVwZGF0ZWRfc3RyZWFtc19vcmRlci5sZW5ndGg7Ly8kcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlci5sZW5ndGg7XHJcblxyXG4gICAgaWYoIGluZGV4ID09PSAwIClcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gbm9fb2ZfcGFnZXMgLSAxO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiggaW5kZXggPT0gKG5vX29mX3BhZ2VzIC0gMSkgKVxyXG4gICAge1xyXG4gICAgICAgIG5leHRfcGFnZV9pbmRleCA9IDA7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gbm9fb2ZfcGFnZXMgLSAyO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICAgIG5leHRfcGFnZV9pbmRleCA9IGluZGV4ICsgMTtcclxuICAgICAgICBwcmV2X3BhZ2VfaW5kZXggPSBpbmRleCAtIDE7XHJcbiAgICB9XHJcblxyXG4gICAgJHNjb3BlLm5leHRfcGFnZV9pZCA9ICRzY29wZS5mZWVkLnByb2ZpbGUuc29jaWFsLnVwZGF0ZWRfc3RyZWFtc19vcmRlcltuZXh0X3BhZ2VfaW5kZXhdOy8vJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXJbbmV4dF9wYWdlX2luZGV4XS5wYWdlX2lkO1xyXG4gICAgJHNjb3BlLnByZXZfcGFnZV9pZCA9ICRzY29wZS5mZWVkLnByb2ZpbGUuc29jaWFsLnVwZGF0ZWRfc3RyZWFtc19vcmRlcltwcmV2X3BhZ2VfaW5kZXhdOy8vJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXJbcHJldl9wYWdlX2luZGV4XS5wYWdlX2lkO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGluZGV4KTtcclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLnRlc3RfbmFtZSA9IFtdO1xyXG4gICAgJHNjb3BlLnRlc3RfbmFtZS5wdXNoKHsnbmFtZSc6J1JhbSd9KTtcclxuICAgICRzY29wZS5nZXRTY3JvbGxQb3NpdGlvbiA9IGZ1bmN0aW9uKCkgeyAgICAgICBcclxuICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgJHNjb3BlLmZlZWQuZGQgPSB7ICdjb3VudCc6MCwgJ2RhdGEnOltdLCAncGxhY2Vob2xkZXInOiAnJ307XHJcbiAgICAkc2NvcGUuc2VsZWN0ZWRfZGQgPSB7fTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoKCdmZWVkLmRyb3Bkb3duX2ZlZWQnLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYoICRzY29wZS5mZWVkLmRyb3Bkb3duX2ZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ01NTU1NTU1NTU1NTU1NTU1NJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkLmRyb3Bkb3duX29iaik7XHJcbiAgICAgICAgICAgICRzY29wZS5mZWVkLmRkID0gJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kcm9wZG93bigpO1xyXG5cclxuICAgICAgICAgICAgaWYoICEkc2NvcGUuZmVlZC5kZC5kYXRhLmxlbmd0aCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm1vcmVkYXRhID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZF9kZCA9ICRzY29wZS5mZWVkLmRkLmRhdGFbMF07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZmVlZC5pdGVtcycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5pdGVtcy5sZW5ndGggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0pKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKJyk7XHJcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoKCdmZWVkLmxvYWRfbW9yZV9mbGFnJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoICEkc2NvcGUuZmVlZC5sb2FkX21vcmVfZmxhZyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAkc2NvcGUubW9yZWRhdGEgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlZGF0YSA9IGZhbHNlO1xyXG5cclxuICAgICRzY29wZS5sb2FkTW9yZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYoICRzY29wZS5mZWVkLmRyb3Bkb3duX2ZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhICRzY29wZS5mZWVkLml0ZW1zLmxlbmd0aCAmJiAkc2NvcGUuY291bnRlciA9PSAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9sb2FkZWRfdGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5zZXRfZGVmYXVsdF9ncm91cF9pZCggJHNjb3BlLnNlbGVjdGVkX2RkICk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouZ2V0X2RhdGEoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xvYWQgbW9yZS4uLi4uLi4uLi4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICEgJHNjb3BlLmZlZWQuaXRlbXMubGVuZ3RoICYmICEgJHNjb3BlLmNvdW50ZXIgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5sYXN0X2xvYWRlZF90aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmdldF9kYXRhKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5tb3JlKCk7XHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAkc2NvcGUuY291bnRlcisrOyAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLnByb2Nlc3NERCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRfZGQpO1xyXG4gICAgICAgICRzY29wZS5mZWVkLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICRzY29wZS5jb3VudGVyID0gMTtcclxuICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuXHJcbiAgICAgICAgLy8kc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouc2V0X2RlZmF1bHRfZ3JvdXBfaWQoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgIC8vJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kYXRhKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmVudGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBkZWxlZ2F0ZSA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgnbWFpblNjcm9sbCcpO1xyXG4gICAgICAgIC8vZGVsZWdhdGUuc2Nyb2xsVG8oIDAsICRzY29wZS5mZWVkLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uICk7XHJcbiAgICAgICAgJHNjb3BlLiRwYXJlbnQuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgnZmVlZCcpKTtcclxuICAgIH0pO1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmJlZm9yZUxlYXZlXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgnbWFpblNjcm9sbCcpLmdldFNjcm9sbFBvc2l0aW9uKCk7XHJcbiAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9zY3JvbGxfcG9zaXRpb24gPSBwb3NpdGlvbi50b3A7XHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuXHJcbiAgICBcclxuXHJcbiAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUVudGVyJywgZnVuY3Rpb24oZXZlbnQsIHZpZXdEYXRhKSB7XHJcbiAgICAgICAgdmlld0RhdGEuZW5hYmxlQmFjayA9IHRydWU7XHJcbiAgICAgICAgdmlld0RhdGEuaGFzSGVhZGVyQmFyID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyh2aWV3RGF0YSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgYnYgPSAkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCk7XHJcblxyXG4gICAgJHNjb3BlLiRpb25pY0dvQmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLS0tLSycpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGJ2KTtcclxuXHJcbiAgICAgICAgaWYgKGJ2KSB7XHJcbiAgICAgICAgICAgICRpb25pY0hpc3RvcnkuZ29CYWNrKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLmhvbWUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcblxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdQdWJsaXNoaW5nJywgZnVuY3Rpb24oJHNjb3BlLCBFQywgYWNjb3VudE1hbmFnZXIpIHtcclxuXHJcbiAgICBcclxuXHJcbiAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdwdWJsaXNoaW5nJykpO1xyXG5cclxuICAgIFxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdQb3N0U2V0dGluZ3MnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIpIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgICAgICB2aWV3RGF0YS5lbmFibGVCYWNrID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgYnYgPSAkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCk7XHJcblxyXG4gICAgICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0tLS0tLJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGJ2KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAgICAgJGlvbmljSGlzdG9yeS5nb0JhY2soKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5saXN0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KVxyXG4gICAgLmNvbnRyb2xsZXIoJ0J1dHRvbnNUYWJDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsKSB7XHJcblxyXG4gICAgICAgICRzY29wZS5zaG93UG9wdXAgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJGlvbmljUG9wdXAuYWxlcnQoe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdQb3B1cCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnVGhpcyBpcyBpb25pYyBwb3B1cCBhbGVydCEnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnNob3dBY3Rpb25zaGVldCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkaW9uaWNBY3Rpb25TaGVldC5zaG93KHtcclxuICAgICAgICAgICAgICAgIHRpdGxlVGV4dDogJ0lvbmljIEFjdGlvblNoZWV0JyxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0ZhY2Vib29rJ1xyXG4gICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdUd2l0dGVyJ1xyXG4gICAgICAgICAgICAgICAgfSwgXSxcclxuICAgICAgICAgICAgICAgIGRlc3RydWN0aXZlVGV4dDogJ0RlbGV0ZScsXHJcbiAgICAgICAgICAgICAgICBjYW5jZWxUZXh0OiAnQ2FuY2VsJyxcclxuICAgICAgICAgICAgICAgIGNhbmNlbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NBTkNFTExFRCcpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0JVVFRPTiBDTElDS0VEJywgaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGRlc3RydWN0aXZlQnV0dG9uQ2xpY2tlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RFU1RSVUNUJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICB9KVxyXG5cclxuLmNvbnRyb2xsZXIoJ1NsaWRlYm94Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGlvbmljU2xpZGVCb3hEZWxlZ2F0ZSkge1xyXG4gICAgJHNjb3BlLm5leHRTbGlkZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRpb25pY1NsaWRlQm94RGVsZWdhdGUubmV4dCgpO1xyXG4gICAgfTtcclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdNZW51Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGlvbmljU2lkZU1lbnVEZWxlZ2F0ZSwgJGlvbmljTW9kYWwpIHtcclxuXHJcblxyXG4gICAgJHNjb3BlLnVwZGF0ZVNpZGVNZW51ID0gZnVuY3Rpb24obWVudSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG1lbnUpO1xyXG4gICAgICAgICRzY29wZS5tZW51SXRlbXMgPSBtZW51O1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgICRpb25pY01vZGFsLmZyb21UZW1wbGF0ZVVybCgndGVtcGxhdGVzL21vZGFsLmh0bWwnLCBmdW5jdGlvbihtb2RhbCkge1xyXG4gICAgICAgICRzY29wZS5tb2RhbCA9IG1vZGFsO1xyXG4gICAgfSwge1xyXG4gICAgICAgIGFuaW1hdGlvbjogJ3NsaWRlLWluLXVwJ1xyXG4gICAgfSk7XHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignQXBwQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS5tZW51SXRlbXMgPSBbXTtcclxuXHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5kaXJlY3RpdmVzJywgW10pXHJcblxyXG4uZGlyZWN0aXZlKCdwb3NpdGlvbkJhcnNBbmRDb250ZW50JywgZnVuY3Rpb24oJHRpbWVvdXQpIHtcclxuXHJcbiByZXR1cm4ge1xyXG4gICAgXHJcbiAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgICBkZEZlZWQ6ICc9ZGRGZWVkJ1xyXG4gICAgfSxcclxuXHJcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgXHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnS0FLQUtBS0FLS0FLQUtBSzo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICBjb25zb2xlLmxvZyhzY29wZS5kZEZlZWQpO1xyXG4gICAgICBkb1Byb2Nlc3MoKTtcclxuXHJcbiAgICAgIHNjb3BlLiR3YXRjaCgnZGRGZWVkJywgZnVuY3Rpb24obnYpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLQUtBS0FLQUtLQUtBS0FLOjo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Jyk7XHJcbiAgICAgICAgY29uc29sZS5sb2cobnYpO1xyXG4gICAgICAgIGRvUHJvY2VzcygpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGRvUHJvY2VzcygpXHJcbiAgICAgIHtcclxuICAgICAgICAgIHZhciBvZmZzZXRUb3AgPSAwO1xyXG4gICAgICAgICAgdmFyIHBsYXRmb3JtID0gJ2lvcyc7Ly8kY29yZG92YURldmljZS5nZXRQbGF0Zm9ybSgpO1xyXG4gICAgICAgICAgcGxhdGZvcm0gPSBwbGF0Zm9ybS50b0xvd2VyQ2FzZSgpOyAgICBcclxuXHJcblxyXG4gICAgICAgICAgLy8gR2V0IHRoZSBwYXJlbnQgbm9kZSBvZiB0aGUgaW9uLWNvbnRlbnRcclxuICAgICAgICAgIHZhciBwYXJlbnQgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudFswXS5wYXJlbnROb2RlKTtcclxuXHJcbiAgICAgICAgICB2YXIgbV9oZWFkZXIgPSAgcGFyZW50WzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2Jhci1oZWFkZXInKTtcclxuXHJcbiAgICAgICAgICAvLyBHZXQgYWxsIHRoZSBoZWFkZXJzIGluIHRoaXMgcGFyZW50XHJcbiAgICAgICAgICB2YXIgc19oZWFkZXJzID0gcGFyZW50WzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2Jhci1zdWJoZWFkZXInKTtcclxuICAgICAgICAgIHZhciBpX2NvbnRlbnQgPSBwYXJlbnRbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lvbi1jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAgaWYoIG1faGVhZGVyLmxlbmd0aCApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG9mZnNldFRvcCA9IG1faGVhZGVyWzBdLm9mZnNldEhlaWdodCArIChwbGF0Zm9ybSA9PSAnaW9zJz8yMDowKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCB0aGUgaGVhZGVyc1xyXG4gICAgICAgICAgZm9yKHg9MDt4PHNfaGVhZGVycy5sZW5ndGg7eCsrKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCB0aGUgbWFpbiBoZWFkZXIgb3IgbmF2LWJhciwgYWRqdXN0IGl0cyBwb3NpdGlvbiB0byBiZSBiZWxvdyB0aGUgcHJldmlvdXMgaGVhZGVyXHJcbiAgICAgICAgICAgIGlmKHggPj0gMCkge1xyXG4gICAgICAgICAgICAgIHNfaGVhZGVyc1t4XS5zdHlsZS50b3AgPSBvZmZzZXRUb3AgKyAncHgnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBBZGQgdXAgdGhlIGhlaWdodHMgb2YgYWxsIHRoZSBoZWFkZXIgYmFyc1xyXG4gICAgICAgICAgICBvZmZzZXRUb3AgPSBvZmZzZXRUb3AgKyBzX2hlYWRlcnNbeF0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgfSAgICAgIFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBQb3NpdGlvbiB0aGUgaW9uLWNvbnRlbnQgZWxlbWVudCBkaXJlY3RseSBiZWxvdyBhbGwgdGhlIGhlYWRlcnNcclxuICAgICAgICAgIGlfY29udGVudFswXS5zdHlsZS50b3AgPSBvZmZzZXRUb3AgKyAncHgnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTsgIFxyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnaGlkZVRhYnMnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlLCAkZWwpIHtcclxuICAgICAgICAgICRyb290U2NvcGUuaGlkZVRhYnMgPSAndGFicy1pdGVtLWhpZGUnO1xyXG4gICAgICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzID0gJyc7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gIH07XHJcbn0pXHJcblxyXG4uZGlyZWN0aXZlKCdtYW5hZ2VBY2NvdW50JywgZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgYWNjb3VudDogJz1hY2NvdW50J1xyXG4gICAgICB9LFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXJlY3RpdmVzL21hbmFnZS1hY2NvdW50Lmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS5jdiA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIGFsZXJ0KDU1KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBvYmoucmVmcmVzaEFjY291bnQoKTtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuZGVsZXRlQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH07XHJcbn0pXHJcblxyXG4uZGlyZWN0aXZlKCdtYW5hZ2VQcm9maWxlJywgZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgcHJvZmlsZTogJz1wcm9maWxlJ1xyXG4gICAgICB9LFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXJlY3RpdmVzL21hbmFnZS1wcm9maWxlLmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS52YWxpZGF0ZUNoZWNrID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAgICAgLy9vYmoubmV3X2tleSA9ICdmcm9tIGRpcmVjdGl2ZSc7XHJcbiAgICAgICAgICAgIC8vYWxlcnQob2JqLmdldFVzZXJOYW1lKCkpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgICBvYmoudXBkYXRlX21vbml0b3Iob2JqLnByb2ZpbGVfY2hlY2tlZCk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgIH1cclxuICAgIH07XHJcbn0pXHJcblxyXG4uZGlyZWN0aXZlKCdmZWVkSXRlbScsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGl0ZW06ICc9aXRlbSdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9mZWVkLWl0ZW0uaHRtbCcsXHJcbiAgICAgIGxpbms6ZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHNjb3BlLmN2ID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAgICAgYWxlcnQoNTUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuZm5hbWUgPSAnUmFtYSEhISEhLi4uLic7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHNjb3BlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5kZWxldGVBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJHN0YXRlUHJvdmlkZXInLCAnJHVybFJvdXRlclByb3ZpZGVyJywnJGlvbmljQ29uZmlnUHJvdmlkZXInLCBcclxuXHRmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGlvbmljQ29uZmlnUHJvdmlkZXIpIHtcclxuXHJcblx0XHQgICRzdGF0ZVByb3ZpZGVyXHJcblx0XHQgICAgICAuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9sb2dpbi5odG1sXCIsXHJcblx0XHQgICAgICAgIGNvbnRyb2xsZXI6IFwiTG9naW5DdHJsXCJcclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvbWVudVwiLFxyXG5cdFx0ICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdCAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21lbnUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICBjb250cm9sbGVyOiAnTWVudUN0cmwnXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaG9tZScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9ob21lXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2hvbWUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ0hvbWVUYWJDdHJsJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5tYW5hZ2VfYWNjb3VudHMnLCB7XHJcblx0XHQgICAgICBcdHVybDogXCIvbWFuYWdlX2FjY291bnRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21hbmFnZV9hY2NvdW50cy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnTWFuYWdlQWNjb3VudHMnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLnB1Ymxpc2hpbmcnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvcHVibGlzaGluZ1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdwdWJsaXNoaW5nLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9wdWJsaXNoLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQdWJsaXNoaW5nJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5wb3N0X3NldHRpbmdzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3Bvc3Rfc2V0dGluZ3NcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAncHVibGlzaGluZy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcG9zdF9zZXR0aW5ncy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnUG9zdFNldHRpbmdzJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pbmJveCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9pbmJveFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdpbmJveC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaW5ib3guaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmZlZWRzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2ZlZWRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2ZlZWRzLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9mZWVkcy5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICBcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pdGVtJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2l0ZW1cIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbGlzdC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaXRlbS5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuZm9ybScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9mb3JtXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2Zvcm0tdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Zvcm0uaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmtleWJvYXJkJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2tleWJvYXJkXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2tleWJvYXJkLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC8qLnN0YXRlKCdtZW51LmxvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2xvZ2luLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSkqL1xyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LnNsaWRlYm94Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3NsaWRlYm94XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3NsaWRlYm94Lmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTbGlkZWJveEN0cmwnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmFib3V0Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2Fib3V0XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Fib3V0Lmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSk7XHJcblxyXG5cdFx0ICAgIC8vJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcIm1lbnUvdGFiL2J1dHRvbnNcIik7XHJcblx0XHQgICAgLyppZiggJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEgKVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCIvaG9tZVwiKTtcclxuXHRcdCAgICB9XHJcblx0XHQgICAgZWxzZVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJsb2dpblwiKTtcclxuXHRcdCAgICB9Ki9cclxuXHRcdCAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwibG9naW5cIik7XHJcblxyXG5cclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci50YWJzLnBvc2l0aW9uKFwiYm90dG9tXCIpOyAvL1BsYWNlcyB0aGVtIGF0IHRoZSBib3R0b20gZm9yIGFsbCBPU1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLm5hdkJhci5hbGlnblRpdGxlKFwiY2VudGVyXCIpO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnRhYnMuc3R5bGUoXCJzdGFuZGFyZFwiKTtcclxuXHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MubWF4Q2FjaGUoMCk7XHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MudHJhbnNpdGlvbignbm9uZScpO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnZpZXdzLmZvcndhcmRDYWNoZSh0cnVlKTtcclxuXHRcdCAgICBcclxuXHRcdCAgICAkc3RhdGVQcm92aWRlclJlZiA9ICRzdGF0ZVByb3ZpZGVyO1xyXG4gICAgICBcdFx0JHVybFJvdXRlclByb3ZpZGVyUmVmID0gJHVybFJvdXRlclByb3ZpZGVyO1xyXG5cdFx0fVxyXG5dOyIsIi8qXHJcblx0QWNjb3VudCBNYW5hZ2VyIFNlcnZpY2VzXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuc2VydmljZXMuYWNjb3VudE1hbmFnZXInLCBbXSlcclxuXHJcblx0XHQuZmFjdG9yeSgnYWNjb3VudE1hbmFnZXInLCByZXF1aXJlKCcuL2FwcC9hY2NvdW50L2FjY291bnQtbWFuYWdlcicpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdBY2NvdW50JywgcmVxdWlyZSgnLi9hcHAvYWNjb3VudC9hY2NvdW50JykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdQcm9maWxlJywgcmVxdWlyZSgnLi9hcHAvYWNjb3VudC9wcm9maWxlJykpOyIsIi8qXHJcblx0U29jaWFsIE1hbmFnZXIgU2VydmljZXNcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5zZXJ2aWNlcy5zb2NpYWxNYW5hZ2VyJywgW10pXHJcblxyXG5cdFx0LmZhY3RvcnkoJ3NvY2lhbE1hbmFnZXInLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwtbWFuYWdlcicpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2ZlZWQnKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0ZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL0ZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdUaW1lbGluZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3RpbWVsaW5lRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvbGlua2VkaW5GZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnRHJvcGRvd25GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9kcm9wZG93bkZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvbGlua2VkaW5GZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnSW5zdGFncmFtRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvSW5zdGFncmFtRmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnQ29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9jb2xsYXBzaWJsZUZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL1R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdGYWNlYm9va0ZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZmFjZWJvb2tGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnVHdpdHRlckZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvdHdpdHRlckZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnQmxvZ2dlckZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvYmxvZ2dlckZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnR29vZ2xlUGx1c0ZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZ29vZ2xlcGx1c0ZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnUGludGVyZXN0RmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9waW50ZXJlc3RGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1lvdVR1YmVGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3lvdVR1YmVGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0luc3RhZ3JhbUZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvaW5zdGFncmFtRmVlZCcpKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuc2VydmljZXMnLCBbXSlcclxuXHJcbi5mYWN0b3J5KCdFQycsIHJlcXVpcmUoJy4vYXBwL2VjLXV0aWxpdHknKSlcclxuXHJcbi8vc2VydmljZSBmb3IgYXV0aGVudGljYXRpb25cclxuLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24oJHEsICRodHRwLCBhcGlVcmwsIEVDKSB7XHJcblxyXG4gICAgdmFyIGlzQXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICB2YXIgTE9DQUxfVE9LRU5fS0VZID0gJ3VzZXJfY3JlZGVudGlhbHMnO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkVXNlckNyZWRlbnRpYWxzKCkge1xyXG4gICAgICAgIHZhciB1YyA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTF9UT0tFTl9LRVkpO1xyXG4gICAgICAgIGlmICh1Yykge1xyXG4gICAgICAgICAgICB1c2VDcmVkZW50aWFscyh1Yyk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcmVVc2VyQ3JlZGVudGlhbHModWMpIHtcclxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxfVE9LRU5fS0VZLCB1Yyk7XHJcbiAgICAgICAgdXNlQ3JlZGVudGlhbHModWMpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVzZUNyZWRlbnRpYWxzKHVjKSB7XHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1Yyk7XHJcblxyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHVjIGFzIGhlYWRlciBmb3IgeW91ciByZXF1ZXN0cyFcclxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51aWQgPSB1Yy51aWQ7XHJcbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24uYXV0aG9yaXphdGlvblRva2VuID0gdWMuYXV0aG9yaXphdGlvblRva2VuO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlc3Ryb3lVc2VyQ3JlZGVudGlhbHMoKSB7XHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgLy8kaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51aWQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgLy8kaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5hdXRob3JpemF0aW9uVG9rZW4gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKExPQ0FMX1RPS0VOX0tFWSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxvZ2luID0gZnVuY3Rpb24obmFtZSwgcGFzc3dvcmQsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgIHZhciByZXEgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6IGFwaVVybCArICd1c2VyL2xvZ2luJyxcclxuICAgICAgICAgICAgZGF0YTp7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2VtYWlsJzogbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAncGFzc3dvcmQnOiBwYXNzd29yZFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KHJlcSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygnMjIyMicpO1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnWVlZWVlZWVlZJyk7XHJcbiAgICAgICAgICAgICAgICAvLyRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8kaW9uaWNIaXN0b3J5LmN1cnJlbnRWaWV3KCRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKSk7Ly8kaW9uaWNIaXN0b3J5LmN1cnJlbnRWaWV3KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgLy8kc3RhdGUuZ28oJ2FwcC5zYWZldHlMZXNzb25zJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVycl9tc2cpIHtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1paWlpaWlpaWicpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soJzMzMzMnKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbG9nb3V0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgZGVzdHJveVVzZXJDcmVkZW50aWFscygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBsb2FkVXNlckNyZWRlbnRpYWxzKCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsb2dpbjogbG9naW4sXHJcbiAgICAgICAgbG9nb3V0OiBsb2dvdXQsXHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzQXV0aGVudGljYXRlZDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSlcclxuXHJcbi5mYWN0b3J5KCdVc2VyU2V0dGluZ3MnLCByZXF1aXJlKCcuL2FwcC9zZXR0aW5ncy1tYW5hZ2VyJykpIFxyXG4gXHJcbiBcclxuXHJcbi5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHtcclxuICAgICAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZFxyXG4gICAgICAgICAgICB9W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pXHJcblxyXG4uY29uZmlnKGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpIHtcclxuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ0F1dGhJbnRlcmNlcHRvcicpO1xyXG59KTtcclxuIl19
