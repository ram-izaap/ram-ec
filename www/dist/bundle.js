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

      this.replace_type_in_username = function( username )
      {
          return $.trim(username).replace(/( \(User\)$| \(Profile\)$| \(Page\)$| \(Company Page\)$)/,'');
      };

      this.for_each = function( array, fn )
      {
          array = Array.isArray( array ) ? array : [ array ];

          for ( var index = 0, length = array.length; index < length; ++index ) fn( array[ index ], index, length );
      };

      this.tw_deep_link_to_html = function( text, raw_data )
      {
          text = text || '';

          var deep_link = 'https://twitter.com/messages/compose?recipient_id=';

          if ( raw_data.entities && raw_data.entities.urls )
          {
              this.for_each( raw_data.entities.urls, function( url )
              {
                  if ( url.url && url.expanded_url && url.expanded_url.indexOf( deep_link ) !== -1 )
                  {
                      var expanded_url = url.expanded_url,
                          recipient_id = expanded_url.replace(deep_link,'');

                      var message_me = '<div class="message-me" data-recipient="' + recipient_id + '">'+
                              '<svg class="message-me-icon" viewBox="0 0 56 54" version="1.1" fill="currentColor"></svg>' +
                                  
                              '<span class="message-me-text">Send a private message</span>'+
                          '</div>';

                      text = text.replace( url.url , message_me);
                      text = text.replace( url.expanded_url , message_me);
                  }
              });

          }
          return text;
      };

      this.url_to_link = function( text, target )
      {
          var exp = /(\b((https?|ftp|file):\/\/|bit.ly\/|goo.gl\/|t.co\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

          function replacer( match )
          {
              return "<a href='" + ( match.indexOf('//') == -1 ? '//'+match : match) + "' " +
                   ( typeof target == 'undefined' ? 'target="_blank"' : 'target="' + target + '"' ) + ">" + match + "</a>";
          }

          if ( typeof text == 'string') return text.replace(exp, replacer); 

          else return '';
      };

      this.tw_user_mentions_to_links = function( text, raw_data )
      {
          text = text || '';

          var user_mentions;

          if ( raw_data.entities !== undefined && raw_data.entities.user_mentions !== undefined && raw_data.entities.user_mentions.screen_name !== undefined )
          {
              user_mentions = raw_data.entities.user_mentions.screen_name;

              if ( !Array.isArray(user_mentions) ) user_mentions = [ user_mentions ];
          }

          user_mentions = user_mentions || [];

          for ( var i = 0, l = user_mentions.length; i < l; i++ )
          {
              var screen_name = user_mentions[ i ];

              var exp = new RegExp('@' + screen_name, 'ig');
              
              text = text.replace( exp, '<a class="tw-user" href="https://twitter.com/' + screen_name + 
                  '" target="_blank"  data-user="@' + screen_name + '">@' + screen_name + '</a>' );
          }

          return text;

      };

      this.hashtag_to_link = function( text, network )
      {
        var exp = /\B#(\w*[a-zA-Z]+\w*)/ig,
            linked = '';

        if ( $.isArray( text ) ) text = text[0];

        if ( typeof text !== 'undefined') // maybe if text != undefined
            if ( network === 'twitter')
                linked = text.replace( exp, "<a class='tw-hashtag' href='https://twitter.com/search?q=%23$1' target='_blank' data-query='%23$1'>#$1</a>");
            else if ( network === 'facebook')
                linked = text.replace( exp, "<a href='https://www.facebook.com/hashtag/$1' target='_blank'>#$1</a>"); // https://www.facebook.com/hashtag/nba?hc_location=ufi
            else
                linked = text.replace( exp, "<a href='https://twitter.com/search?q=%23$1' target='_blank'>#$1</a>");
        
        return linked;
      };

      this.fb_tags_to_links = function( text, tags, type )
      {
          var self = this;

          if ( !Array.isArray(tags) ) tags = [ tags ];
    
          tags.sort(function(a,b){
              return parseInt( a.offset ) - parseInt( b.offset );
          });

          var result = []
              ,cur_offset = 0
              ,result_str = ''
              ,tag
              ,length
              ,offset
              ,multitags = {};

          for ( var i = 0, l = tags.length; i < l; i++ )
          {
              tag = tags[ i ];

              offset = parseInt( tag.offset );

              length = parseInt( tag.length );

              if ( cur_offset <= offset )
              {
                  result.push( text.substring( cur_offset, offset ) );

                  cur_offset = offset + length;

                  //result.push( tag.link );
                  result.push({
                      id: tag.id,
                      name: ( tag.name == undefined || $.isEmptyObject( tag.name ) ?  text.substr( offset, length ) : tag.name ),
                      type: tag.type,
                      link: tag.link
                  });
              }

              else  //multitags
              {
                  if ( multitags[ tag.offset ] == undefined ) 
                  {
                      var prev_link = result.pop();

                      multitags[ tag.offset ] = {
                          offset: offset,
                          length: length,
                          name: text.substr( offset, length ),
                          tags: [{ name: tags[ i - 1 ].name, link: prev_link },
                              { name: tag.name, link: tag.link }]
                      };

                      result.push( '_$mt$_' + offset + text.substr( offset, length ) );
                  }

                  else //add multitag
                      multitags[ tag.offset ].tags.push( { name: tag.name, link: tag.link } );    
              }
          }
          result.push( text.substring( cur_offset ) );

          //result_str = url_to_link( result.join('') );
          for ( var i = 0, l = result.length; i < l; i++ )
          {
              var item = result[ i ];

              if ( typeof item == 'object') //tag
              {
                  result_str += '<a class="fb-' + item.type + '" href="' + item.link +'" target="_blank" data-user="' + 
                      item.id + '">' + item.name + '</a>';   
              }
              else result_str += self.url_to_link( item );
          }

          /*for ( var i = 0, l = tags.length; i < l; i++ )
          {
              if ( multitags[ tags[ i ].offset ] == undefined )
              {
                  result_str = result_str.replace( '>' + tags[ i ].link + '<', '>' + tags[ i ].name + '<' );  
              }  
          }*/

          for ( var offset in multitags )
          {
              var multitag = multitags[ offset ];

              var tt = '';
              for ( var k = 0, l = multitag.tags.length; k < l; k++ )
              {
                  if(k<3) tt = tt + (tt.length==0 ? '' : ', ') + multitag.tags[ k ].name;
              }
              if( multitag.tags.length > 3 ) tt = tt + ', ...';
               
              result_str = result_str.replace( '_$mt$_' + multitag.offset + multitag.name,  '<span class="multitag" data-tooltip="' + 
                  tt +'" data-offset="' + type + '_' +multitag.offset + '">' + multitag.name + '</span>');
          }

          return result_str;
      };

      this.FB_thumbnail_to_full_size = function( url )
      {
          var url_n = url;

          if ( url.indexOf("?") == -1 )
          {
              if ( url.indexOf("_s.jpg") != -1 ) url_n = url.replace("_s.jpg", "_n.jpg");

              else
              {
                  if ( url.indexOf("_s.jpeg") != -1 ) url_n = url.replace("_s.jpeg", "_n.jpeg");

                  else url_n = url.replace("_s.png", "_n.png");
              }
          }

          return url_n;
      };

      
      this.replaceURLWithHTMLLinks = function( text, newWindow )
      {
          var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
          var exp_www = /^(\b(?!(https?|ftp|file))(www[.])[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
          if(newWindow) {
            text = text.replace(exp, "<a href='$1' target='_blank'>$1</a>"); 
            text = text.replace(exp_www, "<a href='http://$1' target='_blank'>$1</a>"); 
          } else {
            text = text.replace(exp, "<a href='$1'>$1</a>"); 
            text = text.replace(exp_www, "<a href='http://$1'>$1</a>"); 
          }
        return text;
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

    TimelineFeedItem.prototype.getItemName = function()
    {
        var self = this;

        return self.data.fromName;
    };

    TimelineFeedItem.prototype.getItemTime = function()
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

    TimelineFeedItem.prototype.getItemText = function()
    {
        var self = this;

        var message_html,
            $temp_message;

        if ( this.feed.network == 'rss') 
        {
            message_html = '<a href="' +this.data.link+ '" class="title" target="_blank">' +( this.data.title || '')+ '</a>';
            
            var data_message_html = this.data.message;
            
            if ( typeof data_message_html === 'string' )
            {
                $temp_message = $('<div>').html( data_message_html );
                
                $temp_message.find('a').attr('target','_blank');

                var $images = $temp_message.find('img');
                if ( $images.length ) $images.each(function()
                {
                    var $wrapper = $('<div>', { class: 'rss-img-center' });
                    $wrapper.append( $( this ).clone() );
                    $( this ).replaceWith( $wrapper );
                });

                data_message_html = $temp_message.html();
                message_html += data_message_html;
            }
           // +( this.data.message || '');
        }

        else if ( this.feed.network === 'googleplus' )
        {
            message_html = this.data.message;
            
            if ( typeof message_html === 'string' )
            {
                $temp_message = $('<div>').html( message_html );
                
                $temp_message.find('a').attr('target','_blank');

                message_html = $temp_message.html();    
            }
        }

        else if (this.feed.id == 'fb_notifications' || this.data.eventType == 'FBComments' || this.data.eventType == 'FBShares' || this.data.eventType == 'FBOthers' || this.data.eventType == 'FBLikes' )
        {
            //user_likes == unread
            //message_html = '<a href="' +this.data.link+ '" target="_blank">' +( this.data.message || '')+ '</a>';
                                              
            message_html = this.data.message;

            if ( this.data.eventType === 'FBComments' )
            {
                var post_message = ( typeof this.data.name === 'string' && this.data.name.length ? this.data.name : '' ),
                    last_comment = { message:'' };

                //if ( post_message.length > 150 ) post_message = post_message.slice(0,150) + '...';
                if ( this.data.comments && this.data.comments.comment )
                {
                    if ( this.data.comments.comment.length )
                    {
                        this.data.comments.comment.sort(function(a,b)
                        {
                            return a.createdTime - b.createdTime;
                        });
                        last_comment = this.data.comments.comment[this.data.comments.comment.length - 1];
                    }
                    else last_comment = this.data.comments.comment;
                    
                    message_html = '<span class="comment-subtitle">' + EC.replace_type_in_username(this.profile.username) + '\'s Post:</span> ' + 
                    post_message + '<br><br><span class="comment-subtitle">' + this.data.fromName + '\'s Comment:</span> ' + last_comment.message; 
                    
                }
                else {} // old style
            }  
        }

        else if ( this.feed.network == 'blogger')
        {
            var title = '';

            if ( this.data.name != undefined ) title = '<a href="' +this.data.permalink+ '" class="title" target="_blank">' +( this.data.name || '')+ '</a>';

            message_html = title + ( this.data.message || ''); 
            //message_html = title + ( url_to_link( this.data.message ) || '');   
        }

        else if ( this.feed.network == 'twitter' || this.data.eventNetwork == 'twitter' )
        {
            if ( this.data.raw_data.retweeted_status == undefined && this.data.raw_data.quoted_tweet != undefined 
                && this.data.raw_data.quoted_tweet.streamEntry != undefined && !$.isEmptyObject( this.data.raw_data.quoted_tweet.streamEntry ) )
            {
                if ( this.data.raw_data.entities.urls != undefined && !$.isEmptyObject( this.data.raw_data.entities.urls ) )
                {
                    var urls = this.data.raw_data.entities.urls
                        ,first_url;

                    if ( Array.isArray(urls) ) first_url = urls[ 0 ].url;
                    else first_url = urls.url;

                    message_html = this.data.message.replace(first_url, '');
                }
            }

            else
            {
                // message_html = this.data.message;
                message_html = EC.tw_deep_link_to_html( this.data.message, this.data.raw_data );

                if ( this.data.message != undefined )
                {
                    function getPosition(str, m, i) 
                    {
                        return str.split(m, i).join(m).length;
                    }

                    // var result = getPosition(this.data.message, 'http', 2) ;
                    var result = getPosition(message_html, 'http', 2) ;

                    message_html = message_html.substring(0, result);
                }

                if ( this.data.raw_data.entities && this.data.raw_data.entities.urls != undefined && !$.isEmptyObject( this.data.raw_data.entities.urls ) )
                {
                    var urls = this.data.raw_data.entities.urls;
                    EC.for_each(urls, function ( url ) 
                    {
                        if ( url.url && url.expanded_url )
                        {
                            message_html = message_html.replace(url.url, url.expanded_url);   
                        }      
                    });  
                }    
            }

            if ( this.data.raw_data.description && ( self.feed.id == 'twFriends' || self.feed.id == 'twFollowers' || self.data.eventType == 'TWFollowers'
                    || ( ( self.feed.id == 'search' || self.feed.id == 'outreach' ) 
                        && self.feed.options.parameters.type == 'users' ) ) )
            {
                message_html = this.data.raw_data.description;
                
                if ( self.data.eventType == 'TWFollowers' ) message_html += ' <span class="view-follower">View ' + self.data.fromName + ' profile</span>';  
            }

            message_html = EC.url_to_link( message_html );
        }

        else message_html = EC.url_to_link( this.data.message );

        if ( this.feed.network == 'rss' && typeof message_html == 'string')
        {
            message_html = message_html
                .replace(/width=/gi, 'data-w=')
                .replace(/height=/gi, 'data-h=')
                .replace(/margin/gi, 'data-m')
                // .replace(/margin-left=/gi, 'data-m-l=')
                // .replace(/margin-right=/gi, 'data-m-r=')
                .replace(/a href/gi, 'a target="_blank" href')
                .replace(/<br\s*[\/]?>/gi, '<span></span>');
        }
        
        else if ( this.feed.network == 'twitter' || this.data.eventNetwork == 'twitter' ) 
        {
            message_html = EC.tw_user_mentions_to_links( message_html, this.data.raw_data );
            
            message_html = EC.hashtag_to_link( message_html, 'twitter' );
        }

        else if ( this.feed.network == 'linkedin' ) message_html = this.data.title + this.data.pre_summary + message_html;

        else if (this.feed.network == 'facebook' && this.feed.id !== 'fb_notifications') 
        {
            var story_html;
            
            message_html = $("<div />").html( this.data.message ).text(); 

            if ( this.data.story !== undefined && this.data.story.length > 0 ) 
            {
                // if ( this.data.story.indexOf('You added ') == -1 )
                // {
                    story_html = $("<div />").html( this.data.story ).text();

                    if ( this.data.storyTags !== undefined && this.data.storyTags.storyTag !== undefined )
                        story_html = EC.fb_tags_to_links( story_html, this.data.storyTags.storyTag, 'story' );
                    else
                        story_html = EC.url_to_link( story_html );
                // }
            }

            if ( this.data.messageTags !== undefined && this.data.messageTags.messageTag !== undefined )
                message_html = EC.fb_tags_to_links( message_html, this.data.messageTags.messageTag, 'message' );
            else
                message_html = EC.url_to_link( message_html );

            message_html = EC.hashtag_to_link( message_html, 'facebook');

            if( story_html !== undefined )
            {
                if( message_html.length > 0 ) story_html = '<p>' + story_html + '</p>';

                message_html = story_html + message_html;
            }
        }

        if ( this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus')
        {
            if ( this.feed.id == 'cinbox' )
            {
                
                message_html = 'You have a comment here';

                if ( this.data.comments !== undefined && this.data.comments.comment !== undefined ) 
                {
                    if ( !Array.isArray( this.data.comments.comment ) ) this.data.comments.comment = [ this.data.comments.comment ];

                    if( this.data.comments.comment.length > 0 )
                    {
                        $temp_message = $('<div>').html( this.data.comments.comment[ 0 ].message );
                        $temp_message.find('a').attr('target','_blank');

                        var orig_message = this.data.message;
                        if ( typeof orig_message === 'string' )
                        {
                            var $temp_message2 = $('<div>').html( orig_message );
                            
                            $temp_message2.find('a').attr('target','_blank');

                            orig_message = $temp_message2.html();   
                        }
                        
                        message_html =   '<span class="comment-subtitle">' + EC.replace_type_in_username(this.profile.username) + '\'s Post:</span> ';
                        message_html +=  orig_message + '<br><br><span class="comment-subtitle">' + this.data.fromName + '\'s Comment:</span> ' + $temp_message.html();

                    }
                }               
                

                //render_tag_it_button( self.data, $this, $this.find('.item-text'), self.data.eventTime ); 
            }
        }

        message_html = message_html.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

        return message_html;
        
        //then render_tag_it_button
    };
    
    TimelineFeedItem.prototype.getItemMedia = function()
    {
        var self = this;
        var ext_element, itemMedia;
        var slider_items = [];

        if ( Array.isArray( self.data.media ) ) 
        {
            var type = self.feed.id;
            var item_id = ( self.feed.network == 'twitter' ? self.data.postID : self.data.id );
            var alt = $.isEmptyObject( self.data.media[ 0 ].alt ) ? "" : self.data.media[ 0 ].alt;
            var imageArray = '';
            var navDots = "";
            var btnName = "btn-" + type + "_" + item_id;

            for ( var i = 0; i < this.data.media.length; i++ )
            {
                var imageEl = this.data.media[ i ];
                var url_n = EC.FB_thumbnail_to_full_size( imageEl.src );
                var currId = "img-" + type + "_" + item_id + "_" + i;
                var currDotId = "img-dot-" + i;
                var prevId = "img-" + type + "_" + item_id + "_" + ( i == 0 ? this.data.media.length - 1 : i - 1 );
                var nextId = "img-" + type + "_" + item_id + "_" + ( i == ( this.data.media.length - 1 ) ? 0 : i + 1 );
                
                slider_items.push({'src':url_n, w:964, h:1024});

                if ( this.feed.network == 'facebook' && i == (this.data.media.length - 1) )
                    imageArray = "<img class=\"full-image\" src='" + url_n + "' >";

                else if( i == 0 )
                    imageArray = "<img class=\"full-image\" src='" + url_n + "' >";

                
            }
            
            if ( this.feed.network == 'facebook' )
            {
                slider_items.reverse();
            }

            imageArray = '<span class="prev"></span>'+imageArray+'<span class="next"></span>';

            ext_element = $(imageArray);
            ext_element.on('click', function(){openPhotoSwipe( slider_items );} );            
        }

        else if ( typeof this.data.media == 'object' && this.data.media.type != 'unavailable' )
        {
            var alt = this.data.media.alt;

            if ( this.feed.network === 'facebook' && typeof this.data.picture === 'string' ) this.data.media.src = this.data.picture;

            if(this.data.media.type=="photo")
            {
                var url_n = EC.FB_thumbnail_to_full_size( this.data.media.src ),
                    stuff = '';

                // console.dir( this.data.mediaDescription );
                
                if ( this.data.mediaDescription != undefined && !$.isEmptyObject( this.data.mediaDescription ) ) stuff = this.data.mediaDescription;

                else if ( this.data.caption != undefined ) stuff = this.data.caption;

                     else if (this.data.media.alt != undefined && this.data.media.alt != this.data.message ) stuff = this.data.media.alt;

                if ( /*this.feed.id != 'pi_board'*/this.feed.network != 'pinterest' ) stuff = EC.replaceURLWithHTMLLinks( stuff );

                var meta_info = '';
                if ( this.feed.network == 'youtube' ) {
                    meta_info = "<a class='ph_link font-weight mar-4 ui-link' href='javascript:;' onClick=\"EC.UI.IAB('" + this.data.channelLink + "');\" >" + this.data.channelTitle + "</a>";
                }

                else if ( this.feed.network == 'pinterest' && this.data.link && this.data.raw_data.metadata.link && this.data.raw_data.metadata.link.title )
                {
                    meta_info = "<a class='ph_link' href='javascript:;' href='javascript:;' onClick=\"EC.UI.IAB('" + this.data.link + "');\">" + this.data.raw_data.metadata.link.title + "</a>";
                }

                if ( this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus')
                {
                    if ( this.data.media != undefined )
                    {
                        var gp_img;

                        if ( this.data.media.fullImage != undefined && this.data.media.fullImage.url != undefined )
                        {
                            gp_img = this.data.media.fullImage.url;    
                        }

                        else if ( this.data.media.image != undefined && this.data.media.image.url != undefined )
                        {
                            gp_img = this.data.media.image.url;    
                        }

                        if ( this.data.media.content != undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;

                        if ( gp_img != undefined )
                        {
                            ext_element = $(
                                "<div class='fb_image'><img class=\"full-image\" src='" + gp_img + 
                                "' ></div>" +
                                "<div class='clear'></div>" +
                                //"<a class='ph_link' href='javascript:;' onClick=\"EC.UI.IAB('" + gp_img + "');\" >" + ( this.data.media.displayName || '' ) + "</a>" +
                                "<div class='gray_text photo'>" + stuff + "</div>"
                            );  

                            slider_items.push({'src':gp_img, w:964, h:1024});   
                        }
                    }  
                }

                else 
                {
                    ext_element = $(
                    "<div class='fb_image'><img class=\"full-image\" src='" + url_n + "' ></div>" +
                    "<div class='clear'></div><div class='padlr10'>" +
                    meta_info +
                    "<div class='gray_text photo'>" + stuff + "</div></div>"//+
                    // "<div class='gray_text photo'>" + this.data.message + "</div>"//+
                    // "<div class='gray_text photo'><div class='flash'>"+( url_to_link( this.data.message ).length +' : : '+ stuff.length )+"</div></div>"
                    );

                    slider_items.push({'src':url_n, w:964, h:1024}); 
                }
                    
                //.css({"font-size":"10px"});
            }
            else if(this.data.media.type=="video")
            {
                var stuff = ( EC.replaceURLWithHTMLLinks( this.data.mediaDescription == undefined ? (this.data.caption == undefined ? (this.data.media.alt == this.data.message ? '' : this.data.media.alt) : this.data.caption ) : this.data.mediaDescription ) || '');

                var link_text = 'Watch video';
                var meta_info = '';
                if ( this.feed.network == 'youtube' ) {

                    link_text = this.data.media.title;

                    var by_channel = '';
                    if ( this.data.channelId != this.data.fromId ) {
                        by_channel = '<li>by <a class="yt-user-name" hraf="javascript:;" onClick="EC.UI.IAB(\'' + this.data.channelLink + '\');" >' + this.data.channelTitle + '</a></li>';
                    }

                    meta_info = '<a class="ph_link font-weight mar-4 ui-link" href="javascript:ram;">' + link_text + '</a><ul class="yt-meta-info ui-grid-solo">' +
                        by_channel +
                        '<li>' +  new Date( this.data.media.uploadDate ).format('mmm dd, yyyy') + '</li>' +
                        '<li>&nbsp;&nbsp;' + this.data.views.count + ' views</li>' + 
                        '</ul>';
                }

                else if ( this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus')
                {
                    if ( this.data.media.content != undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;   

                    meta_info = '<a class="ph_link font-weight mar-4 ui-link" href="#">' + ( this.data.media.displayName || 'Watch video' ) + '</a>';
                }

                if ( this.data.media != undefined && this.data.media.video != undefined ) ext_element = $(
                    "<div class='ui-grid-solo l_message'>" +
                    "<div class='img_box video ui-grid-solo position-relative'><img class=\"video-button\" src=\"img/play-button.png\"><img class=\"full-image\" src='" + this.data.media.src.replace('Fdefault', 'Fhqdefault').replace('/default', '/hqdefault') + "'></div>" +
                    "<div class='clear'></div><div class='padlr10'>" +
                    //"<a class='ph_link' href='#'>" + link_text + "</a>" +
                    meta_info + 
                    "<div class='gray_text video'>" + stuff + "</div>" +
                    "<a class='video_link' href='javascript:;' onclick=\"EC.UI.IAB('"+this.data.media.video.display_url+"');\">Video link</a>" +
                    "</div>"
                );

                if ( this.data.media != undefined && this.data.media.video != undefined ) ext_element.on('click',function ( event )
                {
                    // console.dir( self )
                    event.stopPropagation();
                    EC.UI.IAB(encodeURI(self.data.media.video.display_url+'?autoplay=1'), '', '_system');
                    //window.open( encodeURI(self.data.media.video.source_url.replace('http://','https://') ),'_system','location=yes');
                    //var mediaObject = '<iframe src="'+self.data.media.video.source_url.replace('http://','https://')+'" width="1280" height="720" frameborder="0"></iframe>';
                    //post_manager.watchPictureVideo(mediaObject, true);
                });

                if ( this.data.media != undefined && this.data.media.video != undefined ) ext_element.on('click', '.yt-user-name' ,function ( event )
                {
                    event.stopPropagation();
                });

            }
            else if(this.data.media.type=="article"&&(this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus'))
            {
                var stuff = '', url_n;

                if ( this.data.media.content != undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;

                 if ( this.data.media.fullImage != undefined && this.data.media.fullImage.url != undefined )
                {
                    url_n = this.data.media.fullImage.url;    
                }

                else if ( this.data.media.image != undefined && this.data.media.image.url != undefined )
                {
                    url_n = this.data.media.image.url;    
                }

                if ( url_n != undefined )
                {
                    ext_element = $(
                        "<div class='ui-grid-solo l_message'>" +
                        "<div class='img_box ui-grid-solo position-relative'><img class=\"full-image\" src='" + url_n + "' ></div>" +
                        "<div class='clear'></div><div class='padlr10'>" +
                        "<a class='ph_link font-weight mar-4 ui-link' href='javascript:;' onClick=\"EC.UI.IAB('" + this.data.media.url + "');\" >" + ( this.data.media.displayName || '' ) + "</a>" +
                        "<div class='gray_text media'>" + stuff + "</div></div>" +
                        "</div>"
                    );
                    
                    slider_items.push({'src':url_n, w:964, h:1024});
                }
            
            }
            else if(this.data.media.type==='animated_image_share' && this.feed.network === 'facebook')
            {
                var url_n = this.data.link
                    ,stuff = ''
                    ,m;

                // re = /url=[^&#]*/i
                //  ,url_n = this.data.media.src

                // if ( (m = re.exec( url_n )) !== null )
                // {
                //     url_n = decodeURIComponent( m[ 0 ].replace('url=','') );
                // }

                ext_element = $(
                    "<div class='fb_image'><img src='" + url_n + "' ></div>" +
                    "<div class='clear'></div>" +
                    "<div class='gray_text photo'>" + stuff + "</div>"
                );  

                slider_items.push({'src':url_n, w:964, h:1024});
            
            }
            else{
                if($.isEmptyObject(this.data.media.src))
                {
                    var stuff = ( EC.replaceURLWithHTMLLinks( this.data.mediaDescription == undefined ? (this.data.caption == undefined ? (this.data.media.alt != this.data.message ? '' : this.data.media.alt) : this.data.caption ) : this.data.mediaDescription ) || '');

                    if ( this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus')
                    {
                        if ( this.data.media != undefined )
                        {
                            var gp_img;

                            if ( this.data.media.fullImage != undefined && this.data.media.fullImage.url != undefined )
                            {
                                gp_img = this.data.media.fullImage.url;    
                            }

                            else if ( this.data.media.image != undefined && this.data.media.image.url != undefined )
                            {
                                gp_img = this.data.media.image.url;    
                            }

                            if ( this.data.media.content != undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;

                            if ( gp_img != undefined )
                            {
                                ext_element = $(
                                    "<div class='fb_image'><img class=\"full-image\" src='" + gp_img + 
                                    "' ></div>" +
                                    "<div class='clear'></div>" +
                                    //"<a class='ph_link font-weight mar-4 ui-link' href='javascript:;' onClick=\"EC.UI.IAB('" + gp_img + "');\" >" + ( this.data.media.displayName || '' ) + "</a>" +
                                    "<div class='gray_text photo'>" + stuff + "</div>"
                                );  

                                slider_items.push({'src':gp_img, w:964, h:1024});   
                            }
                        }  
                    }

                    else
                    {
                        ext_element = $(
                            "<div class='l_message ui-grid-solo'>" +
                            "<div class='padlr10'><a class='ph_link font-weight mar-4 ui-link' href='javascript:;' onClick=\"EC.UI.IAB('" + this.data.media.href + "');\">" + this.data.media.href + "</a>" +
                            "<div class='gray_text'>" + stuff + "</div></div>" +
                            "</div>"
                        ); 

                        ext_element.on('click', function(){
                            EC.UI.IAB( encodeURI( this.data.media.href ),'','_system');  
                        });
                    } 
                }

                else
                {
                    var stuff = ( EC.replaceURLWithHTMLLinks( this.data.mediaDescription == undefined ? (this.data.caption == undefined ? (this.data.media.alt != this.data.message ? '' : this.data.media.alt) : this.data.caption ) : this.data.mediaDescription ) || '');
                    ext_element = $(
                        "<div class='l_message ui-grid-solo'>" +
                        "<div class='img_box'><img class=\"full-image\" src='" + this.data.media.src + "' ></div>" +
                        "<div class='clear'></div><div class='padlr10'>" +
                        "<a class='ph_link font-weight mar-4 ui-link' href='javascript:;' onClick=\"EC.UI.IAB('" + this.data.media.href + "');\">" + ( this.data.name || '' ) + "</a>" +
                        "<div class='gray_text media'>" + stuff + "</div></div>" +
                        "</div>"
                    );

                    slider_items.push({'src':this.data.media.src, w:964, h:1024}); 

                }
            }
            // var src = FB_thumbnail_to_full_size( this.data.media.src );

            // $this.find('.item-media').append('<div class="img" style="background-image: url(' +src+ ');"></div>');

            //$this.addClass('has_media')
        }
        else if ( this.data.raw_data != undefined && this.data.raw_data.entities != undefined /*&& this.data.raw_data.entities.media != undefined*/ )
        {
            if ( this.data.raw_data.retweeted_status == undefined && this.data.raw_data.quoted_tweet != undefined 
                && this.data.raw_data.quoted_tweet.streamEntry != undefined && !$.isEmptyObject( this.data.raw_data.quoted_tweet.streamEntry ) )
            {
                var quoted_tweet = this.data.raw_data.quoted_tweet.streamEntry
                    ,$quoted_tweet_container = $('<div>', { class: 'quoted-tweet-container' })
                    ,$quoted_tweet_autor = $('<div>', { class: 'quoted-tweet-autor' })
                    ,$quoted_tweet_text = $('<div>', { class: 'quoted-tweet-text' })
                    ,$quoted_tweet_media = $('<div>', { class: 'quoted-tweet-media' })
                    ,first_url = ''
                    ;

                if ( self.data.raw_data.entities.urls != undefined )
                {
                    var urls = self.data.raw_data.entities.urls;

                    if ( Array.isArray(urls) ) first_url = urls[ 0 ].url;
                    else first_url = urls.url;
                }

                var name_html = $('<b class="quoted-tweet-autor-name">' + quoted_tweet.user.name + 
                    '</b><span class="quoted-tweet-autor-screenname">@' + quoted_tweet.user.screen_name + '</span>');

                $quoted_tweet_autor.html( name_html ).attr('data-tooltip', quoted_tweet.user.name )
                .on('click', function ()
                {
                    self.show_user_info( quoted_tweet.user.id_str );
                });

                var message_htm = quoted_tweet.text.replace(/“/g, '').replace(/”/g, '');

                message_htm = url_to_link( message_htm );

                message_htm = hashtag_to_link( message_htm, 'twitter' );

                var regex   = /(^|[^@\w])@(\w{1,15})\b/g
                    ,replace = '$1<a class="tw-user" href="javascript:;" onclick="EC.UI.IAB(\'https://twitter.com/$2\');" data-user="@$2">@$2</a>'; 

                message_htm = message_htm.replace( regex, replace );

                $quoted_tweet_text.html( message_htm.replace(/^\s\s*/, '').replace(/\s\s*$/, '') );

                $quoted_tweet_text.on('click','a.tw-user',function( e ){

                    e.preventDefault();

                    self.show_user_info( $( this ).attr('data-user') );
                });

                $quoted_tweet_text.on('click','a.tw-hashtag',function( e ){

                    e.preventDefault();

                    var that = $( this );

                    var tw_search = new TWSearchContainer( [], { profile: self.profile, next:'', result_type: 'recent' } );

                    var pp = new ecPopup( tw_search.view() );

                    pp.element.addClass('twitter-search');

                    pp.element.find('.header').html( 'SEARCH' );

                    $('body').append( pp.render().hide().fadeIn( 500 ) );

                    setTimeout(function(){
                        $('.twitter-search').find('#search-text').val( decodeURIComponent(that.attr('data-query')) );
                        $('.twitter-search').find('.go-button').trigger('click');
                    }, 1);
                });

                if ( quoted_tweet.entities != undefined && quoted_tweet.entities.media != undefined )
                {
                    $quoted_tweet_media.html( '<img class="twitter-image full-image" src="' + quoted_tweet.entities.media.media_url + '">')
                    .on('click', function ()
                    {
                        if ( first_url.length > 0 ) EC.UI.IAB( first_url );
                    }); 
                }

                $quoted_tweet_container.append($quoted_tweet_autor, $quoted_tweet_text, $quoted_tweet_media)
                .hover(function ()
                {
                    $( this ).css('border', '1px solid #999');
                }, 
                function ()
                {
                    $( this ).css('border', '1px solid #ccc');
                });

                ext_element = $quoted_tweet_container;
            }

            else if ( this.data.raw_data.entities.media != undefined )
            {
                /*var post_media_element = TwitterFeed.prototype.get_post_media_element.call( undefined, this.data.raw_data, $this.find('.item-media') );
                ext_element = post_media_element[0];

                if( object_length( post_media_element[1] ) > 0 )
                {
                    slider_items = post_media_element[1];
                }*/

            } 
        }

        this.data.media_content = ext_element;

        itemMedia = '';
        if ( this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus')
        {
            if ( this.feed.id != 'cinbox' ) itemMedia = ext_element;            
        }
        else
        {
            itemMedia = ext_element
        }

        return $.type(itemMedia) == 'object' ? itemMedia.html(): itemMedia;
    };

    TimelineFeedItem.prototype.getUIData = function()
    {
        console.log('getUIData');
        var self = this,
            UIData = {};

        //name, profileImg and date
        UIData.profileName  = self.data.fromName;
        UIData.profileImg   = self.data.profilePic || self.data.icon;
        UIData.time         = self.getItemTime();

        //item text 
        UIData.itemText     = self.getItemText();
        UIData.itemMedia    = self.getItemMedia();
        return UIData;

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

          scope.data = scope.item.getUIData();
          
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3cvanMvYXBwLW1haW4uanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L2FjY291bnQtbWFuYWdlci5qcyIsInd3dy9qcy9hcHAvYWNjb3VudC9hY2NvdW50LmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L3Byb2ZpbGUuanMiLCJ3d3cvanMvYXBwL2VjLXV0aWxpdHkuanMiLCJ3d3cvanMvYXBwL3NldHRpbmdzLW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9JbnN0YWdyYW1GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL1R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvYmxvZ2dlckZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9jb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZhY2Vib29rRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9nb29nbGVwbHVzRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2luc3RhZ3JhbUZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9saW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9saW5rZWRpbkZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9saW5rZWRpbkZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvcGludGVyZXN0RmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3RpbWVsaW5lRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC90d2l0dGVyRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3lvdVR1YmVGZWVkLmpzIiwid3d3L2pzL2NvbnN0YW50cy5qcyIsInd3dy9qcy9jb250cm9sbGVycy5qcyIsInd3dy9qcy9kaXJlY3RpdmVzLmpzIiwid3d3L2pzL3JvdXRlci5qcyIsInd3dy9qcy9zZXJ2aWNlLWFjY291bnQtbWFuYWdlci5qcyIsInd3dy9qcy9zZXJ2aWNlLXNvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL3NlcnZpY2VzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNWJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwaUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3h3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeHdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3p1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHRmdW5jdGlvbiBBcHBNYWluKCRpb25pY1BsYXRmb3JtLCAkcm9vdFNjb3BlLCAkc2NvcGUpIFxyXG5cdHtcclxuXHQgICRpb25pY1BsYXRmb3JtLnJlYWR5KGZ1bmN0aW9uKCkge1xyXG5cdCAgICAvLyBIaWRlIHRoZSBhY2Nlc3NvcnkgYmFyIGJ5IGRlZmF1bHQgKHJlbW92ZSB0aGlzIHRvIHNob3cgdGhlIGFjY2Vzc29yeSBiYXIgYWJvdmUgdGhlIGtleWJvYXJkXHJcblx0ICAgIC8vIGZvciBmb3JtIGlucHV0cylcclxuXHQgICAgaWYgKHdpbmRvdy5jb3Jkb3ZhICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucy5LZXlib2FyZCkge1xyXG5cdCAgICAgIGNvcmRvdmEucGx1Z2lucy5LZXlib2FyZC5oaWRlS2V5Ym9hcmRBY2Nlc3NvcnlCYXIodHJ1ZSk7XHJcblx0ICAgIH1cclxuXHQgICAgaWYgKHdpbmRvdy5TdGF0dXNCYXIpIHtcclxuXHQgICAgICAvLyBvcmcuYXBhY2hlLmNvcmRvdmEuc3RhdHVzYmFyIHJlcXVpcmVkXHJcblx0ICAgICAgLy9TdGF0dXNCYXIuc3R5bGVMaWdodENvbnRlbnQoKTtcclxuXHQgICAgfVxyXG4gIFx0ICB9KTtcclxuXHJcblx0ICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uIChldmVudCl7XHJcblx0ICBcdCRyb290U2NvcGUuY3VycmVudFNjb3BlID0gJHNjb3BlO1xyXG5cdCAgfSk7XHJcblxyXG4gIFx0ICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMsIGVycm9yKSB7XHJcblx0ICAgaWYgKHRvU3RhdGUubmFtZSA9PSAndGFicy5tYW5hZ2VfYWNjb3VudHMnKSB7XHJcblx0ICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzPXRydWU7XHJcblx0ICAgfSBlbHNlIHtcclxuXHQgICAgICRyb290U2NvcGUuaGlkZVRhYnM9ZmFsc2U7XHJcblx0ICAgfVxyXG5cdCAgfSk7XHJcbiAgXHR9XHJcblxyXG4gIFx0bW9kdWxlLmV4cG9ydHMgPSBbJyRpb25pY1BsYXRmb3JtJywgJyRyb290U2NvcGUnLCBBcHBNYWluXTsiLCJyZXF1aXJlKCcuL2NvbnN0YW50cycpO1xucmVxdWlyZSgnLi9jb250cm9sbGVycycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlLWFjY291bnQtbWFuYWdlcicpO1xucmVxdWlyZSgnLi9zZXJ2aWNlLXNvY2lhbC1tYW5hZ2VyJyk7XG5yZXF1aXJlKCcuL2RpcmVjdGl2ZXMnKTtcblxudmFyICRzdGF0ZVByb3ZpZGVyUmVmID0gbnVsbDtcbnZhciAkdXJsUm91dGVyUHJvdmlkZXJSZWYgPSBudWxsO1xuXG5hbmd1bGFyLm1vZHVsZSgnZWNsaW5jaGVyJywgW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lvbmljJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLmNvbnN0YW50cycsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2VjbGluY2hlci5jb250cm9sbGVycycsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2VjbGluY2hlci5zZXJ2aWNlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLnNlcnZpY2VzLmFjY291bnRNYW5hZ2VyJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLnNlcnZpY2VzLnNvY2lhbE1hbmFnZXInLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuZGlyZWN0aXZlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdTdG9yYWdlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd1aS5yb3V0ZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25nQ29yZG92YScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndW5kZXJzY29yZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pXG5cbi5jb25maWcocmVxdWlyZSgnLi9yb3V0ZXInKSlcblxuLnJ1bihyZXF1aXJlKCcuL2FwcC1tYWluJykpO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnQWNjb3VudCcsICdVc2VyU2V0dGluZ3MnLCAnJGNvcmRvdmFJbkFwcEJyb3dzZXInLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBBY2NvdW50LCBVc2VyU2V0dGluZ3MsICRjb3Jkb3ZhSW5BcHBCcm93c2VyICl7ICBcclxuXHJcbiAgICB2YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZSxcclxuICAgICAgICBkYXRhID0ge30sXHJcbiAgICAgICAgYWNjb3VudHMgPSBbXSxcclxuICAgICAgICBhY2NvdW50c19vcmRlciA9IFtdLFxyXG4gICAgICAgIGFjY291bnRzX2J5X2lkID0ge30sXHJcbiAgICAgICAgZmF2b3JpdGVzX2FjY291bnQsXHJcbiAgICAgICAgc2VhcmNoX2FjY291bnQsXHJcbiAgICAgICAgcnNzX2FjY291bnQsXHJcbiAgICAgICAgb3V0cmVhY2hfYWNjb3VudCxcclxuICAgICAgICBjaW5ib3hfYWNjb3VudCxcclxuICAgICAgICBsYXN0X2FkZGVkX3Byb2ZpbGUsXHJcbiAgICAgICAgcmVmcmVzaF9vbl9jbG9zZSA9IGZhbHNlLFxyXG4gICAgICAgIHRlbXBsYXRlX3NlbGVjdG9yID0gJyNhY2NvdW50LW1hbmFnZXItdGVtcGxhdGUnO1xyXG5cclxuICAgICAgICBtb2R1bGUucmVuZGVyZWQgPSBmYWxzZTtcclxuICAgICAgICBtb2R1bGUuZ29fYmFja19mbGFnID0gdHJ1ZTtcclxuICAgICAgICBtb2R1bGUuZmF2b3JpdGVfcmVuZGVyZWQgPSBmYWxzZTtcclxuICAgICAgICBtb2R1bGUuc2VhcmNoX3JlbmRlcmVkID0gZmFsc2U7XHJcbiAgICAgICAgbW9kdWxlLnJzc19yZW5kZXJlZCA9IGZhbHNlO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2FjY291bnRNYW5hZ2VyIGluaXQnKTtcclxuXHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJGh0dHApO1xyXG4gICAgICAgIC8vcmV0dXJuIHRlbXBsYXRlX3NlbGVjdG9yO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vZ2V0IGFjY291bnRzIGFuZCBzdG9yZSBpdFxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICAnYWNjb3VudC9hY2NvdW50cycsXHJcbiAgICAgICAgICAgIGRhdGE6eyduYW1lJzoncmFtJ31cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oc3RvcmVfYWNjb3VudHMsIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHN0b3JlX2FjY291bnRzICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3Jlc3BvbnNlOjo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coVXNlclNldHRpbmdzKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UgfHwgW10sXHJcbiAgICAgICAgICAgICAgICBpdGVtcyA9IGRhdGEuYWNjb3VudCB8fCBbXSxcclxuICAgICAgICAgICAgICAgIGZhdl9sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHNyY2hfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICByc3NfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBvdXRyZWFjaF9sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGFjY19vcmRlciA9IGRhdGEuYWNjb3VudF9vcmRlciB8fCBbXTtcclxuXHJcbiAgICAgICAgICAgIGlmKCBkYXRhLnNldHRpbmdzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBVc2VyU2V0dGluZ3MuaGFuZGxlX3NldHRpbmdzKCBkYXRhLnNldHRpbmdzLCB1bmRlZmluZWQsIHRydWUgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgVXNlclNldHRpbmdzLmFuYWx5dGljc19ncm91cHMgPSBbXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKCBkYXRhLmFuYWx5dGljc0dyb3VwcyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICBVc2VyU2V0dGluZ3MuYW5hbHl0aWNzX2dyb3VwcyA9IGRhdGEuYW5hbHl0aWNzR3JvdXBzLmFuYWx5dGljc0dyb3VwO1xyXG4gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KCBpdGVtcyApICkgaXRlbXMgPSBbIGl0ZW1zIF07XHJcblxyXG4gICAgICAgICAgICBhY2NvdW50cyA9IFtdO1xyXG4gICAgICAgICAgICBhY2NvdW50c19ieV9pZCA9IHt9O1xyXG4gICAgICAgICAgICBhY2NvdW50c19vcmRlciA9IGFjY19vcmRlcjtcclxuXHJcbiAgICAgICAgICAgIC8vQ3JlYXRlIGFjY291bnQtb2JqZWN0IGZvciBlYWNoIGFjY291bnRzIGFuZCBzdG9yZSBieSBpZCAuXHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IGl0ZW1zLmxlbmd0aDsgaSA8IHA7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2FjY291bnQgPSBuZXcgQWNjb3VudCggaXRlbXNbIGkgXSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gYWNjb3VudHMucHVzaCggbmV3X2FjY291bnQgKTsgLy8gaXRlcmFibGVcclxuXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50c19ieV9pZFsgbmV3X2FjY291bnQuaWQgXSA9IGFjY291bnRzWyBsZW5ndGggLSAxIF07IC8vIGluZGV4ZWQgYnkgYWNjb3VudCBJRCwgcmVmZXJlbmNlcyBhY2NvdW50IGJ5IGluZGV4XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhY2NvdW50czo6OicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhY2NvdW50cyk7XHJcbiAgICAgICAgICAgIC8vaWYgY2FsbGJhY2sgaXMgdmFsaWQgZnVuY3Rpb24sIHRoZW4gY2FsbCBpdFxyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKVxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9IFxyXG4gICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfZmF2b3JpdGVfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUuZmF2b3JpdGVfcmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X2Zhdm9yaXRlX3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZmF2b3JpdGVfcmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3NlYXJjaF9yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5zZWFyY2hfcmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X3NlYXJjaF9yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLnNlYXJjaF9yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfcnNzX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnJzc19yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfcnNzX3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUucnNzX3JlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRfZ29fYmFja19mbGFnID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLmdvX2JhY2tfZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfZ29fYmFja19mbGFnID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZ29fYmFja19mbGFnID0gZmxhZztcclxuICAgIH07XHJcbiAgICBcclxuICAgIHRoaXMuZmluZCA9IGZ1bmN0aW9uICggYWNjb3VudF9pZCApXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGFjY291bnRzX2J5X2lkWyBhY2NvdW50X2lkIF07XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X3Byb2ZpbGUgPSBmdW5jdGlvbiAoIHByb2ZpbGVfaWQgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnZmF2b3JpdGVzJykgcmV0dXJuICggZmF2b3JpdGVzX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IGZhdm9yaXRlc19hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ3NlYXJjaCcpIHJldHVybiAoIHNlYXJjaF9hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBzZWFyY2hfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdyc3MnKSByZXR1cm4gKCByc3NfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gcnNzX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnb3V0cmVhY2gnKSByZXR1cm4gKCBvdXRyZWFjaF9hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBvdXRyZWFjaF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ2NpbmJveCcpIHJldHVybiAoIGNpbmJveF9hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBjaW5ib3hfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBhID0gYWNjb3VudHMubGVuZ3RoOyBpIDwgYTsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgcCA9IGFjY291bnRzWyBpIF0ucHJvZmlsZXMubGVuZ3RoOyBqIDwgcDsgaisrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfcHJvZmlsZSA9IGFjY291bnRzWyBpIF0ucHJvZmlsZXNbIGogXTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX3Byb2ZpbGUuaWQgPT0gcHJvZmlsZV9pZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXNfcHJvZmlsZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hY2NvdW50cyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKSBcclxuICAgIHsgXHJcbiAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGFjY291bnRzICk7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGFjY291bnRzOyBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5saXN0X2FjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRlbXAgPSBbXSxcclxuICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgIGEgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChhY2NvdW50c19vcmRlci5sZW5ndGggPiAwICl7XHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwLCBhID0gYWNjb3VudHNfb3JkZXIubGVuZ3RoOyBpIDwgYTsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIGFjID0gYWNjb3VudHMubGVuZ3RoOyBqIDwgYWM7IGorKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoYWNjb3VudHNfb3JkZXJbaV0gPT0gYWNjb3VudHNbIGogXS50eXBlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGFjY291bnRzWyBqIF0uaGFzX3VuZXhwaXJlZF9wcm9maWxlcygpICkgdGVtcC5wdXNoKCBhY2NvdW50c1sgaiBdICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwLCBhID0gYWNjb3VudHMubGVuZ3RoOyBpIDwgYTsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBhY2NvdW50c1sgaSBdLmhhc191bmV4cGlyZWRfcHJvZmlsZXMoKSApIHRlbXAucHVzaCggYWNjb3VudHNbIGkgXSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0ZW1wLnNvcnQoZnVuY3Rpb24gKCBhLCBiIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBhIDwgYiApIHJldHVybiAtMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIGEgPiBiICkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHRlbXAgKTtcclxuICAgICAgICBcclxuICAgICAgICBlbHNlIHJldHVybiB0ZW1wO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZF9hY2NvdW50ID0gZnVuY3Rpb24oIHR5cGUgKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhKTtcclxuICAgICAgICB2YXIgY3VzdG9tX2hlYWRlcnMgPSAkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YSB8fCB7fSxcclxuICAgICAgICAgICAgcGF0aCA9ICdhY2NvdW50L2FjY291bnQ/dHlwZT0nICt0eXBlKyAnJmxmPWZhbHNlJztcclxuXHJcbiAgICAgICAgY3VzdG9tX2hlYWRlcnMgPSBKU09OLnBhcnNlKCBjdXN0b21faGVhZGVycyApO1xyXG5cclxuICAgICAgICB2YXIgY2tleSA9IChjdXN0b21faGVhZGVycy5jbGllbnRfa2V5ICE9PSB1bmRlZmluZWQpID8gSlNPTi5zdHJpbmdpZnkoY3VzdG9tX2hlYWRlcnMuY2xpZW50X2tleSk6ICcnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHBhdGggKz0gJyZ1c2VyX25hbWU9JytjdXN0b21faGVhZGVycy51c2VyX25hbWUrJyZ1c2VyX3Bhc3M9JytjdXN0b21faGVhZGVycy51c2VyX3Bhc3MrJyZjbGllbnRfa2V5PScrY2tleSsnJmRldmljZT1pb3MnO1xyXG4gICAgICAgIC8vYWxlcnQoZW5jb2RlVVJJKGFwaVVybCtwYXRoKSk7XHJcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XHJcbiAgICAgICAgICBsb2NhdGlvbjogJ3llcycsXHJcbiAgICAgICAgICBjbGVhcmNhY2hlOiAneWVzJyxcclxuICAgICAgICAgIGNsZWFyc2Vzc2lvbmNhY2hlOiAneWVzJyxcclxuICAgICAgICAgIHRvb2xiYXJwb3NpdGlvbjogJ3RvcCdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAkY29yZG92YUluQXBwQnJvd3Nlci5vcGVuKCBlbmNvZGVVUkkoRUMuZ2V0QXBpVXJsKCkrcGF0aCksICdfYmxhbmsnLCBvcHRpb25zKTtcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRjb3Jkb3ZhSW5BcHBCcm93c2VyOmV4aXQnLCBmdW5jdGlvbihlLCBldmVudCl7XHJcbiAgICAgICAgICAgIGFjY291bnRNYW5hZ2VyLnNldF9yZW5kZXJlZCggZmFsc2UgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnRUMnLCAnUHJvZmlsZScsIGZ1bmN0aW9uKEVDLCBQcm9maWxlKXtcclxuXHJcbiAgICBmdW5jdGlvbiBBY2NvdW50ICggYWNjb3VudF9kYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBhY2NvdW50X2RhdGEuYWNjb3VudElkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudHlwZSA9IGFjY291bnRfZGF0YS50eXBlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuY2FuX3Bvc3QgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLnR5cGUgPT0gJ0ZhY2Vib29rJyB8fCB0aGlzLnR5cGUgPT0gJ0xpbmtlZGluJyB8fCB0aGlzLnR5cGUgPT0gJ1R3aXR0ZXInIHx8IHRoaXMudHlwZSA9PSAnQmxvZ2dlcicgfHwgdGhpcy50eXBlID09ICdQaW50ZXJlc3QnICkgdGhpcy5jYW5fcG9zdCA9IHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT0gJ0dvb2dsZVBsdXMnKSB0aGlzLmNhbl9wb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnUGludGVyZXN0JyAmJiBhY2NvdW50X2RhdGEuZW1haWwgIT09IHVuZGVmaW5lZCAmJiBhY2NvdW50X2RhdGEucGFzc3dvcmQgIT09IHVuZGVmaW5lZCAmJiAhIF8uaXNFbXB0eSggYWNjb3VudF9kYXRhLnBhc3N3b3JkICkgKSB0aGlzLmNhbl9wb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGFyYWN0ZXJfbGltaXQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLnR5cGUgPT0gJ0xpbmtlZGluJykgdGhpcy5jaGFyYWN0ZXJfbGltaXQgPSA3MDA7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT0gJ1R3aXR0ZXInKSB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IDE0MDtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhID0gYWNjb3VudF9kYXRhIHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLnByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLmNvbmZpZyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCB0aGlzLmRhdGEuY29uZmlnICkgKSB0aGlzLnByb2ZpbGVzLnB1c2goIG5ldyBQcm9maWxlKCB0aGlzLmRhdGEuY29uZmlnLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRhdGEuY29uZmlnLmZvckVhY2goZnVuY3Rpb24gKCBpdGVtIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3X3Byb2ZpbGUgPSBuZXcgUHJvZmlsZSggaXRlbSwgc2VsZiApO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wcm9maWxlcy5wdXNoKCBuZXdfcHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmV4cGlyZWQgPSAoIGFjY291bnRfZGF0YS5tb25pdG9yZWQgPT0gJ2V4cGlyZWQnID8gdHJ1ZSA6IGZhbHNlICk7XHJcbiAgICAgICAgLy8gdGhpcy5leHBpcmVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuaGFzX21vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLm1vbml0b3JlZF9wcm9maWxlcygpLmxlbmd0aCA+IDAgKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmhhc19ldmVudHNfbW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuZXZlbnRzX21vbml0b3JlZF9wcm9maWxlcygpLmxlbmd0aCA+IDAgKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5oYXNfdW5leHBpcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMudW5leHBpcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIEFjY291bnQucHJvdG90eXBlLm1vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IHRoaXMucHJvZmlsZXMubGVuZ3RoOyBpIDwgcDsgaSsrICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZXNbIGkgXS5tb25pdG9yZWQgPT0gJ29uJykgcHJvZmlsZXMucHVzaCggdGhpcy5wcm9maWxlc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZmlsZXM7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmV2ZW50c19tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSB0aGlzLnByb2ZpbGVzLmxlbmd0aDsgaSA8IHA7IGkrKyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGVzWyBpIF0uZXZlbnRzTW9uaXRvcmVkID09ICdvbicpIHByb2ZpbGVzLnB1c2goIHRoaXMucHJvZmlsZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2ZpbGVzO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUudW5leHBpcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gdGhpcy5wcm9maWxlcy5sZW5ndGg7IGkgPCBwOyBpKysgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlc1sgaSBdLm1vbml0b3JlZCAhPSAnb2ZmJykgcHJvZmlsZXMucHVzaCggdGhpcy5wcm9maWxlc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZmlsZXM7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gJ1tvYmplY3QgJyArdGhpcy50eXBlKyAnIEFjY291bnRdJztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgc3dpdGNoICggdGhpcy50eXBlLnRvTG93ZXJDYXNlKCkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnZmFjZWJvb2snOiByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdpdHRlcic6IHJldHVybiAyO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdnb29nbGVhbmFseXRpY3MnOiByZXR1cm4gMztcclxuICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdsaW5rZWRpbic6IHJldHVybiA0O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbnN0YWdyYW0nOiByZXR1cm4gNTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAneW91dHViZSc6IHJldHVybiA2O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdwaW50ZXJlc3QnOiByZXR1cm4gNztcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ29vZ2xlcGx1cyc6IHJldHVybiA4O1xyXG4gICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiByZXR1cm4gOTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAndHVtYmxyJzogcmV0dXJuIDEwO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd3b3JkcHJlc3MnOiByZXR1cm4gMTE7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3ZrJzogcmV0dXJuIDEyO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gMTM7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBcImFjY291bnQvcmVmcmVzaFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IFwicmVmcmVzaEFjY291bnRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5hY3Rpb24gPSAndXBkYXRlUElCb2FyZHMnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICkgY2FsbGJhY2soZmxhZyk7XHJcblxyXG4gICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5kZWxldGVBY2NvdW50ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IFwiYWNjb3VudC9kZWxldGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcImRlbGV0ZUFjY291bnRCeUlEXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYuaWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApIGNhbGxiYWNrKGZsYWcpO1xyXG5cclxuICAgICAgICB9LCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEFjY291bnQ7XHJcbiAgICBcclxufV07XHJcblxyXG5cclxuIiwibW9kdWxlLmV4cG9ydHMgPSBbJ0VDJywgJ3NvY2lhbE1hbmFnZXInLCBmdW5jdGlvbihFQywgc29jaWFsTWFuYWdlcil7XHJcblxyXG5cdGZ1bmN0aW9uIFByb2ZpbGUgKCBwcm9maWxlX2RhdGEsIGFjY291bnQgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHByb2ZpbGVfZGF0YSB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5hY2NvdW50ID0gYWNjb3VudCB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGRhdGEuc2FtcGxlSWQ7XHJcblxyXG4gICAgICAgIHRoaXMucGljdHVyZSA9ICggZGF0YS5wcm9maWxlUGljdHVyZSA/IGRlY29kZVVSSUNvbXBvbmVudCggZGF0YS5wcm9maWxlUGljdHVyZSApIDogJ3Nzc3Nzc3NzJyApO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgIT09ICdwaW50ZXJlc3QnICkgdGhpcy5waWN0dXJlID0gdGhpcy5waWN0dXJlLnJlcGxhY2UoJ2h0dHA6Ly8nLCcvLycpO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEubW9uaXRvcmVkID09ICdvbicgfHwgZGF0YS5zb2NpYWxNb25pdG9yZWQgPT0gJ29uJykgdGhpcy5tb25pdG9yZWQgPSAnb24nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhLm1vbml0b3JlZCA9PSAnZXhwaXJlZCcgfHwgZGF0YS5zb2NpYWxNb25pdG9yZWQgPT0gJ2V4cGlyZWQnKSB0aGlzLm1vbml0b3JlZCA9ICdleHBpcmVkJztcclxuXHJcbiAgICAgICAgZWxzZSB0aGlzLm1vbml0b3JlZCA9ICdvZmYnO1xyXG5cclxuICAgICAgICB0aGlzLnByb2ZpbGVfY2hlY2tlZCA9IHRoaXMubW9uaXRvcmVkID09ICdvbicgPyB0cnVlOmZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLmV2ZW50c01vbml0b3JlZCA9IGRhdGEuZXZlbnRzTW9uaXRvcmVkO1xyXG5cclxuICAgICAgICAvLyB0aGlzLm1vbml0b3JlZCA9ICggKCBkYXRhLm1vbml0b3JlZCA9PSAnb24nIHx8IGRhdGEuc29jaWFsTW9uaXRvcmVkID09ICdvbicpID8gJ29uJyA6ICdvZmYnKTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gKSApIHRoaXMuc3RyZWFtcyA9IGRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICkgdGhpcy5zdHJlYW1zID0gWyBkYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSBdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSApICkgdGhpcy5zdHJlYW1zID0gdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCApIHRoaXMuc3RyZWFtcyA9IFsgdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtIF07XHJcblxyXG4gICAgICAgIGVsc2UgdGhpcy5zdHJlYW1zID0gW107XHJcblxyXG4gICAgICAgIC8vIHRoaXMuc29jaWFsID0gbmV3IFNvY2lhbCggc2VsZiApO1xyXG4gICAgICAgIHRoaXMuc29jaWFsID0gbmV3IHNvY2lhbE1hbmFnZXIoIHNlbGYgKTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5hbmFseXRpY3MgPSBuZXcgQW5hbHl0aWNzKCBzZWxmICk7XHJcbiAgICAgICAgLy90aGlzLmFuYWx5dGljcyA9IG5ldyBhbmFseXRpY3NNYW5hZ2VyKCBzZWxmICk7XHJcblxyXG4gICAgICAgIHRoaXMuZ3JvdXBzID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uZXR3b3JrID0gdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgdGhpcy51c2VybmFtZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLm1vbml0b3JlZCA9PT0gJ29uJyAmJiB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdsaW5rZWRpbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvKnZhciByZXFfZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldExOR3JvdXBzJyxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLmlkXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9ncm91cHMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogcmVxX2RhdGFcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqICE9PSB1bmRlZmluZWQgJiYgb2JqLmRhdGEgIT09IHVuZGVmaW5lZCApIHNlbGYuZ3JvdXBzID0gKCBBcnJheS5pc0FycmF5KCBvYmouZGF0YSApID8gb2JqLmRhdGEuc29ydChmdW5jdGlvbihhLGIpe2lmKGEubmFtZSA8IGIubmFtZSkgcmV0dXJuIC0xO2lmKGEubmFtZSA+IGIubmFtZSkgcmV0dXJuIDE7cmV0dXJuIDA7fSkgOiBbIG9iai5kYXRhIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7Ki9cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2ZhY2Vib29rJyAmJiBkYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIiApXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMubW9uaXRvcmVkID09PSAnb24nICYmIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2ZhY2Vib29rJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8qdmFyIHJlcV9kYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCSGlkZGVuX0dyb3VwcycsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBzJyxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dF9wb3N0czogJydcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOidmZWVkL2ZiSGlkZGVuR3JvdXBzJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiByZXFfZGF0YVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggb2JqICE9IHVuZGVmaW5lZCAmJiBvYmouZGF0YSAhPSB1bmRlZmluZWQgJiYgb2JqLmRhdGEubGVuZ3RoID4gMCApIHNlbGYuZ3JvdXBzID0gKCBBcnJheS5pc0FycmF5KCBvYmouZGF0YSApID8gb2JqLmRhdGEuc29ydChmdW5jdGlvbihhLGIpe2lmKGEubmFtZSA8IGIubmFtZSkgcmV0dXJuIC0xO2lmKGEubmFtZSA+IGIubmFtZSkgcmV0dXJuIDE7cmV0dXJuIDA7fSkgOiBbIG9iai5kYXRhIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9KTsqL1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAndHdpdHRlcicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RzID0ge1xyXG4gICAgICAgICAgICAgICAgZGVmYXVsdF9lbGVtZW50OiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAvLyBnZXQgcHJvZmlsZSBMaXN0c1xyXG4gICAgICAgICAgICAvL21vZHVsZS5nZXRfdHdfcHJvZmlsZV9saXN0cyh0aGlzLyosIGZ1bmN0aW9uKCl7fSovKTsgXHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEucG93ZXJVc2VycyApIHRoaXMucG93ZXJfdXNlcnMgPSBkYXRhLnBvd2VyVXNlcnM7XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXMucG93ZXJfdXNlcnMgPSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogJ29uJyxcclxuICAgICAgICAgICAgICAgIG1lZGl1bUxvdzogJzIwMDAnLFxyXG4gICAgICAgICAgICAgICAgbWVkaXVtSGlnaDogJzc1MDAnLFxyXG4gICAgICAgICAgICAgICAgaGlnaDogJzc1MDAnXHJcbiAgICAgICAgICAgIH07ICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnaW5zdGFncmFtJylcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3lvdXR1YmUnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggcHJvZmlsZV9kYXRhLm9iamVjdFR5cGUgPT0gJ3BhZ2UnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3N0aW5nX29ubHkgPSB0cnVlOyBcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSBwcm9maWxlX2RhdGEuZnVsbE5hbWUgKyAnIChQYWdlKSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9ICdmdWxsTmFtZSc7ICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lID0gKHByb2ZpbGVfZGF0YS5mdWxsTmFtZSAhPT0gdW5kZWZpbmVkICYmIHByb2ZpbGVfZGF0YS5mdWxsTmFtZSAhPT1cIlwiKT9wcm9maWxlX2RhdGEuZnVsbE5hbWUuc3BsaXQoXCIoXCIpWzBdICsgJyAoVXNlciknOiAnKFVzZXIpJztcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gJ2Z1bGxOYW1lJzsgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IHByb2ZpbGVfZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSAnZnVsbE5hbWUnO1xyXG5cclxuICAgICAgICAgICAgaWYoIHByb2ZpbGVfZGF0YS5vYmplY3RUeXBlICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZV9kYXRhLm9iamVjdFR5cGUgPT0gJ3VzZXInICkgdGhpcy51c2VybmFtZSArPSAnIChVc2VyKSc7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvc3Rpbmdfb25seSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lICs9ICcgKEJvYXJkKSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5wYWdlTmFtZSApIC8vIEZCIFxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEudGl0bGUgKSAvLyBHQVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEucHJvZmlsZU5hbWUgKSAvLyBMTlxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEudXNlck5hbWUgKSAvLyBJR1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEuc3BlY2lmaWVkSGFuZGxlT3JIYXNoVGFnICkgLy8gVFdcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLmZ1bGxOYW1lICkgLy8gRytcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnVzZXJGaXJzdE5hbWUgKSAvLyBZVFxyXG5cclxuICAgICAgICBbJ3BhZ2VOYW1lJywgJ3RpdGxlJywgJ3Byb2ZpbGVOYW1lJywgJ3VzZXJGaXJzdE5hbWUnLCAndXNlck5hbWUnLCAnc3BlY2lmaWVkSGFuZGxlT3JIYXNoVGFnJywgJ2Z1bGxOYW1lJ10uZm9yRWFjaChmdW5jdGlvbiAoIGl0ZW0gKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhWyBpdGVtIF0gIT09IHVuZGVmaW5lZCAmJiBzZWxmLnVzZXJuYW1lID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJuYW1lID0gZGF0YVsgaXRlbSBdICsgJyAnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJuYW1lX2tleSA9IGl0ZW07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICdbb2JqZWN0ICcgK3RoaXMuYWNjb3VudC50eXBlKyAnIFByb2ZpbGVdJztcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlcm5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLmlzX2Rpc3BsYXlfcHJvZmlsZSA9IGZ1bmN0aW9uKCBhbGxfZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIHZhciBkaXNwbGF5X3Byb2ZpbGUgPSB0cnVlLFxyXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCBhbGxfZmxhZyA9PT0gdW5kZWZpbmVkICYmIHNlbGYubW9uaXRvcmVkID09PSAnb24nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8kYWNjb3VudC5lbGVtZW50LmZpbmQoJy5mdW5jdGlvbnMnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdnb29nbGVwbHVzJyAmJiAhc2VsZi5wb3N0aW5nX29ubHkgKSB8fCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnICkgXHJcbiAgICAgICAgICAgIHsgZGlzcGxheV9wcm9maWxlID0gZmFsc2U7IH0gLy9oaWRlIGluIHBvc3QgbWFuYWdlclxyXG4gICAgICAgIH0gXHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBhbGxfZmxhZyA9PT0gdHJ1ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICggc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JykgJiYgc2VsZi5wb3N0aW5nX29ubHkgKSBcclxuICAgICAgICAgICAgeyBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTsgfSAvL2hpZGUgICBcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBlbHNlIGlmICggc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkaXNwbGF5X3Byb2ZpbGUgPSBzZWxmLnBvc3Rpbmdfb25seTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgZGlzcGxheV9wcm9maWxlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiBkaXNwbGF5X3Byb2ZpbGU7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLmdldFVzZXJOYW1lID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgdXNlcm5hbWUgPSB0aGlzLnVzZXJuYW1lO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZGF0YS50aXRsZSAhPT0gdW5kZWZpbmVkICkgLy8gZm9ybWF0IG5hbWUgZm9yIEdBXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGVtcCA9IHVzZXJuYW1lLnNwbGl0KCcoJylbMF0gfHwgc2VsZi51c2VybmFtZSsgJyAnO1xyXG5cclxuICAgICAgICAgICAgdXNlcm5hbWUgPSB0ZW1wLnN1YnN0cmluZygwLCB0ZW1wLmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHVzZXJuYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS51cGRhdGVfbW9uaXRvciA9IGZ1bmN0aW9uKCBmbGFnIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgZmxhZyA9IChmbGFnICE9PSB1bmRlZmluZWQpP2ZsYWc6ZmFsc2U7XHJcblxyXG4gICAgICAgIGlmKCBzZWxmLmFjY291bnQudHlwZSA9PSAnR29vZ2xlQW5hbHl0aWNzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBhbGVydCgnZ29vZ2xlIGFuYWx5dGljcy4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZWxmLm1vbml0b3JlZCA9IGZsYWcgPyAnb24nOidvZmYnO1xyXG5cclxuICAgICAgICAgICAgc2F2ZV9wcm9maWxlX3NlbGVjdGlvbihmdW5jdGlvbiggc3RhdHVzICl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdHVzO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHNhdmVfcHJvZmlsZV9zZWxlY3Rpb24oIGNhbGxiYWNrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTonUE9TVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6XCJhY2NvdW50L3NpbmdsZXByb2ZpbGVtb25pdG9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOntcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdzZXRTaW5nbGVQcm9maWxlTW9uaXRvcmVkJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IGFjY291bnRJRDogc2VsZi5hY2NvdW50LmlkLCBwcm9maWxlSUQ6IHNlbGYuaWQsIGNoZWNrZWQ6IGZsYWcgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKSBjYWxsYmFjayhmbGFnKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG5cclxuXHJcbiAgICByZXR1cm4gUHJvZmlsZTtcclxuXHJcbn1dOyIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IFtcclxuICAgICAgICAgICAgICAgICckcScsXHJcbiAgICAgICAgICAgICAgICAnJGh0dHAnLFxyXG4gICAgICAgICAgICAgICAgJ2FwaVVybCcsXHJcbiAgICAgICAgICAgICAgICAnJGxvY2FsU3RvcmFnZScsXHJcbiAgICAgICAgICAgICAgICAnJGlvbmljTG9hZGluZycsXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihcclxuICAgICAgICAgICAgICAgICAgJHEsIFxyXG4gICAgICAgICAgICAgICAgICAkaHR0cCwgXHJcbiAgICAgICAgICAgICAgICAgIGFwaVVybCwgXHJcbiAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UsIFxyXG4gICAgICAgICAgICAgICAgICAkaW9uaWNMb2FkaW5nIClcclxuICB7XHJcblxyXG4gICAgICB2YXIgZmF2b3JpdGVzID0gW10sXHJcbiAgICAgICAgICAgIHNlYXJjaGVzID0gW107XHJcbiAgICAgIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uICggcmVxdWVzdCApXHJcbiAgICAgIHtcclxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51c2VyX2RhdGEgPSAkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YTtcclxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5pc19tb2JpbGVfYXBwID0gJzEnO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLS0tLJyk7XHJcbiAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlcXVlc3QgdXJsIGlzIG5vdCBmdWxsLWZvcm1hdCAsIGp1c3QgYXBwZW5kIGFwaS11cmxcclxuICAgICAgICAgICAgICAgIGlmKCByZXF1ZXN0LnVybC5pbmRleE9mKGFwaVVybCkgIT09IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QudXJsID0gYXBpVXJsK3JlcXVlc3QudXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmKCByZXF1ZXN0Lm1ldGhvZCA9PT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSByZXF1ZXN0LnR5cGU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLnNob3coKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiggcmVxdWVzdC5tZXRob2QgPT0gJ0dFVCcgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QucGFyYW1zID0gcmVxdWVzdC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkaHR0cCggcmVxdWVzdCApXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXNlcl9kYXRhID0gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggcmVzcG9uc2UgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggcmVzcG9uc2UuaGVhZGVycygnZWNfZGF0YScpICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEgPSByZXNwb25zZS5oZWFkZXJzKCdlY19kYXRhJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UuZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoICdUaGVyZSBpcyBzb21lIGNvbm5lY3Rpdml0eSBpc3N1ZSAuUGxlYXNlIHRyeSBhZ2FpbiBsYXRlci4nICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5nZXRBcGlVcmwgPSBmdW5jdGlvbigpXHJcbiAgICAgIHtcclxuICAgICAgICByZXR1cm4gYXBpVXJsO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5pc0VtcHR5T2JqZWN0ID0gZnVuY3Rpb24oIG9iaiApXHJcbiAgICAgIHsgXHJcbiAgICAgICAgICBmb3IodmFyIGtleSBpbiBvYmopIFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBpZihvYmouaGFzT3duUHJvcGVydHkoa2V5KSlcclxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5yZXBsYWNlX3R5cGVfaW5fdXNlcm5hbWUgPSBmdW5jdGlvbiggdXNlcm5hbWUgKVxyXG4gICAgICB7XHJcbiAgICAgICAgICByZXR1cm4gJC50cmltKHVzZXJuYW1lKS5yZXBsYWNlKC8oIFxcKFVzZXJcXCkkfCBcXChQcm9maWxlXFwpJHwgXFwoUGFnZVxcKSR8IFxcKENvbXBhbnkgUGFnZVxcKSQpLywnJyk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmZvcl9lYWNoID0gZnVuY3Rpb24oIGFycmF5LCBmbiApXHJcbiAgICAgIHtcclxuICAgICAgICAgIGFycmF5ID0gQXJyYXkuaXNBcnJheSggYXJyYXkgKSA/IGFycmF5IDogWyBhcnJheSBdO1xyXG5cclxuICAgICAgICAgIGZvciAoIHZhciBpbmRleCA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7ICsraW5kZXggKSBmbiggYXJyYXlbIGluZGV4IF0sIGluZGV4LCBsZW5ndGggKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMudHdfZGVlcF9saW5rX3RvX2h0bWwgPSBmdW5jdGlvbiggdGV4dCwgcmF3X2RhdGEgKVxyXG4gICAgICB7XHJcbiAgICAgICAgICB0ZXh0ID0gdGV4dCB8fCAnJztcclxuXHJcbiAgICAgICAgICB2YXIgZGVlcF9saW5rID0gJ2h0dHBzOi8vdHdpdHRlci5jb20vbWVzc2FnZXMvY29tcG9zZT9yZWNpcGllbnRfaWQ9JztcclxuXHJcbiAgICAgICAgICBpZiAoIHJhd19kYXRhLmVudGl0aWVzICYmIHJhd19kYXRhLmVudGl0aWVzLnVybHMgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHRoaXMuZm9yX2VhY2goIHJhd19kYXRhLmVudGl0aWVzLnVybHMsIGZ1bmN0aW9uKCB1cmwgKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCB1cmwudXJsICYmIHVybC5leHBhbmRlZF91cmwgJiYgdXJsLmV4cGFuZGVkX3VybC5pbmRleE9mKCBkZWVwX2xpbmsgKSAhPT0gLTEgKVxyXG4gICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwYW5kZWRfdXJsID0gdXJsLmV4cGFuZGVkX3VybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZWNpcGllbnRfaWQgPSBleHBhbmRlZF91cmwucmVwbGFjZShkZWVwX2xpbmssJycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlX21lID0gJzxkaXYgY2xhc3M9XCJtZXNzYWdlLW1lXCIgZGF0YS1yZWNpcGllbnQ9XCInICsgcmVjaXBpZW50X2lkICsgJ1wiPicrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8c3ZnIGNsYXNzPVwibWVzc2FnZS1tZS1pY29uXCIgdmlld0JveD1cIjAgMCA1NiA1NFwiIHZlcnNpb249XCIxLjFcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+PC9zdmc+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibWVzc2FnZS1tZS10ZXh0XCI+U2VuZCBhIHByaXZhdGUgbWVzc2FnZTwvc3Bhbj4nK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoIHVybC51cmwgLCBtZXNzYWdlX21lKTtcclxuICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoIHVybC5leHBhbmRlZF91cmwgLCBtZXNzYWdlX21lKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy51cmxfdG9fbGluayA9IGZ1bmN0aW9uKCB0ZXh0LCB0YXJnZXQgKVxyXG4gICAgICB7XHJcbiAgICAgICAgICB2YXIgZXhwID0gLyhcXGIoKGh0dHBzP3xmdHB8ZmlsZSk6XFwvXFwvfGJpdC5seVxcL3xnb28uZ2xcXC98dC5jb1xcLylbLUEtWjAtOSsmQCNcXC8lPz1+X3whOiwuO10qWy1BLVowLTkrJkAjXFwvJT1+X3xdKS9pZztcclxuXHJcbiAgICAgICAgICBmdW5jdGlvbiByZXBsYWNlciggbWF0Y2ggKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHJldHVybiBcIjxhIGhyZWY9J1wiICsgKCBtYXRjaC5pbmRleE9mKCcvLycpID09IC0xID8gJy8vJyttYXRjaCA6IG1hdGNoKSArIFwiJyBcIiArXHJcbiAgICAgICAgICAgICAgICAgICAoIHR5cGVvZiB0YXJnZXQgPT0gJ3VuZGVmaW5lZCcgPyAndGFyZ2V0PVwiX2JsYW5rXCInIDogJ3RhcmdldD1cIicgKyB0YXJnZXQgKyAnXCInICkgKyBcIj5cIiArIG1hdGNoICsgXCI8L2E+XCI7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKCB0eXBlb2YgdGV4dCA9PSAnc3RyaW5nJykgcmV0dXJuIHRleHQucmVwbGFjZShleHAsIHJlcGxhY2VyKTsgXHJcblxyXG4gICAgICAgICAgZWxzZSByZXR1cm4gJyc7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLnR3X3VzZXJfbWVudGlvbnNfdG9fbGlua3MgPSBmdW5jdGlvbiggdGV4dCwgcmF3X2RhdGEgKVxyXG4gICAgICB7XHJcbiAgICAgICAgICB0ZXh0ID0gdGV4dCB8fCAnJztcclxuXHJcbiAgICAgICAgICB2YXIgdXNlcl9tZW50aW9ucztcclxuXHJcbiAgICAgICAgICBpZiAoIHJhd19kYXRhLmVudGl0aWVzICE9PSB1bmRlZmluZWQgJiYgcmF3X2RhdGEuZW50aXRpZXMudXNlcl9tZW50aW9ucyAhPT0gdW5kZWZpbmVkICYmIHJhd19kYXRhLmVudGl0aWVzLnVzZXJfbWVudGlvbnMuc2NyZWVuX25hbWUgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXNlcl9tZW50aW9ucyA9IHJhd19kYXRhLmVudGl0aWVzLnVzZXJfbWVudGlvbnMuc2NyZWVuX25hbWU7XHJcblxyXG4gICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkodXNlcl9tZW50aW9ucykgKSB1c2VyX21lbnRpb25zID0gWyB1c2VyX21lbnRpb25zIF07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdXNlcl9tZW50aW9ucyA9IHVzZXJfbWVudGlvbnMgfHwgW107XHJcblxyXG4gICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gdXNlcl9tZW50aW9ucy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHZhciBzY3JlZW5fbmFtZSA9IHVzZXJfbWVudGlvbnNbIGkgXTtcclxuXHJcbiAgICAgICAgICAgICAgdmFyIGV4cCA9IG5ldyBSZWdFeHAoJ0AnICsgc2NyZWVuX25hbWUsICdpZycpO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoIGV4cCwgJzxhIGNsYXNzPVwidHctdXNlclwiIGhyZWY9XCJodHRwczovL3R3aXR0ZXIuY29tLycgKyBzY3JlZW5fbmFtZSArIFxyXG4gICAgICAgICAgICAgICAgICAnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgIGRhdGEtdXNlcj1cIkAnICsgc2NyZWVuX25hbWUgKyAnXCI+QCcgKyBzY3JlZW5fbmFtZSArICc8L2E+JyApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiB0ZXh0O1xyXG5cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMuaGFzaHRhZ190b19saW5rID0gZnVuY3Rpb24oIHRleHQsIG5ldHdvcmsgKVxyXG4gICAgICB7XHJcbiAgICAgICAgdmFyIGV4cCA9IC9cXEIjKFxcdypbYS16QS1aXStcXHcqKS9pZyxcclxuICAgICAgICAgICAgbGlua2VkID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggJC5pc0FycmF5KCB0ZXh0ICkgKSB0ZXh0ID0gdGV4dFswXTtcclxuXHJcbiAgICAgICAgaWYgKCB0eXBlb2YgdGV4dCAhPT0gJ3VuZGVmaW5lZCcpIC8vIG1heWJlIGlmIHRleHQgIT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgIGlmICggbmV0d29yayA9PT0gJ3R3aXR0ZXInKVxyXG4gICAgICAgICAgICAgICAgbGlua2VkID0gdGV4dC5yZXBsYWNlKCBleHAsIFwiPGEgY2xhc3M9J3R3LWhhc2h0YWcnIGhyZWY9J2h0dHBzOi8vdHdpdHRlci5jb20vc2VhcmNoP3E9JTIzJDEnIHRhcmdldD0nX2JsYW5rJyBkYXRhLXF1ZXJ5PSclMjMkMSc+IyQxPC9hPlwiKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoIG5ldHdvcmsgPT09ICdmYWNlYm9vaycpXHJcbiAgICAgICAgICAgICAgICBsaW5rZWQgPSB0ZXh0LnJlcGxhY2UoIGV4cCwgXCI8YSBocmVmPSdodHRwczovL3d3dy5mYWNlYm9vay5jb20vaGFzaHRhZy8kMScgdGFyZ2V0PSdfYmxhbmsnPiMkMTwvYT5cIik7IC8vIGh0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9oYXNodGFnL25iYT9oY19sb2NhdGlvbj11ZmlcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgbGlua2VkID0gdGV4dC5yZXBsYWNlKCBleHAsIFwiPGEgaHJlZj0naHR0cHM6Ly90d2l0dGVyLmNvbS9zZWFyY2g/cT0lMjMkMScgdGFyZ2V0PSdfYmxhbmsnPiMkMTwvYT5cIik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGxpbmtlZDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHRoaXMuZmJfdGFnc190b19saW5rcyA9IGZ1bmN0aW9uKCB0ZXh0LCB0YWdzLCB0eXBlIClcclxuICAgICAge1xyXG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkodGFncykgKSB0YWdzID0gWyB0YWdzIF07XHJcbiAgICBcclxuICAgICAgICAgIHRhZ3Muc29ydChmdW5jdGlvbihhLGIpe1xyXG4gICAgICAgICAgICAgIHJldHVybiBwYXJzZUludCggYS5vZmZzZXQgKSAtIHBhcnNlSW50KCBiLm9mZnNldCApO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdmFyIHJlc3VsdCA9IFtdXHJcbiAgICAgICAgICAgICAgLGN1cl9vZmZzZXQgPSAwXHJcbiAgICAgICAgICAgICAgLHJlc3VsdF9zdHIgPSAnJ1xyXG4gICAgICAgICAgICAgICx0YWdcclxuICAgICAgICAgICAgICAsbGVuZ3RoXHJcbiAgICAgICAgICAgICAgLG9mZnNldFxyXG4gICAgICAgICAgICAgICxtdWx0aXRhZ3MgPSB7fTtcclxuXHJcbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSB0YWdzLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdGFnID0gdGFnc1sgaSBdO1xyXG5cclxuICAgICAgICAgICAgICBvZmZzZXQgPSBwYXJzZUludCggdGFnLm9mZnNldCApO1xyXG5cclxuICAgICAgICAgICAgICBsZW5ndGggPSBwYXJzZUludCggdGFnLmxlbmd0aCApO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoIGN1cl9vZmZzZXQgPD0gb2Zmc2V0IClcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKCB0ZXh0LnN1YnN0cmluZyggY3VyX29mZnNldCwgb2Zmc2V0ICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIGN1cl9vZmZzZXQgPSBvZmZzZXQgKyBsZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvL3Jlc3VsdC5wdXNoKCB0YWcubGluayApO1xyXG4gICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZDogdGFnLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgbmFtZTogKCB0YWcubmFtZSA9PSB1bmRlZmluZWQgfHwgJC5pc0VtcHR5T2JqZWN0KCB0YWcubmFtZSApID8gIHRleHQuc3Vic3RyKCBvZmZzZXQsIGxlbmd0aCApIDogdGFnLm5hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHRhZy50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgbGluazogdGFnLmxpbmtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBlbHNlICAvL211bHRpdGFnc1xyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCBtdWx0aXRhZ3NbIHRhZy5vZmZzZXQgXSA9PSB1bmRlZmluZWQgKSBcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZfbGluayA9IHJlc3VsdC5wb3AoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICBtdWx0aXRhZ3NbIHRhZy5vZmZzZXQgXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IGxlbmd0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0ZXh0LnN1YnN0ciggb2Zmc2V0LCBsZW5ndGggKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdzOiBbeyBuYW1lOiB0YWdzWyBpIC0gMSBdLm5hbWUsIGxpbms6IHByZXZfbGluayB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IG5hbWU6IHRhZy5uYW1lLCBsaW5rOiB0YWcubGluayB9XVxyXG4gICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCggJ18kbXQkXycgKyBvZmZzZXQgKyB0ZXh0LnN1YnN0ciggb2Zmc2V0LCBsZW5ndGggKSApO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICBlbHNlIC8vYWRkIG11bHRpdGFnXHJcbiAgICAgICAgICAgICAgICAgICAgICBtdWx0aXRhZ3NbIHRhZy5vZmZzZXQgXS50YWdzLnB1c2goIHsgbmFtZTogdGFnLm5hbWUsIGxpbms6IHRhZy5saW5rIH0gKTsgICAgXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVzdWx0LnB1c2goIHRleHQuc3Vic3RyaW5nKCBjdXJfb2Zmc2V0ICkgKTtcclxuXHJcbiAgICAgICAgICAvL3Jlc3VsdF9zdHIgPSB1cmxfdG9fbGluayggcmVzdWx0LmpvaW4oJycpICk7XHJcbiAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSByZXN1bHQubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB2YXIgaXRlbSA9IHJlc3VsdFsgaSBdO1xyXG5cclxuICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBpdGVtID09ICdvYmplY3QnKSAvL3RhZ1xyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgcmVzdWx0X3N0ciArPSAnPGEgY2xhc3M9XCJmYi0nICsgaXRlbS50eXBlICsgJ1wiIGhyZWY9XCInICsgaXRlbS5saW5rICsnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgZGF0YS11c2VyPVwiJyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgaXRlbS5pZCArICdcIj4nICsgaXRlbS5uYW1lICsgJzwvYT4nOyAgIFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIHJlc3VsdF9zdHIgKz0gc2VsZi51cmxfdG9fbGluayggaXRlbSApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8qZm9yICggdmFyIGkgPSAwLCBsID0gdGFncy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGlmICggbXVsdGl0YWdzWyB0YWdzWyBpIF0ub2Zmc2V0IF0gPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdF9zdHIgPSByZXN1bHRfc3RyLnJlcGxhY2UoICc+JyArIHRhZ3NbIGkgXS5saW5rICsgJzwnLCAnPicgKyB0YWdzWyBpIF0ubmFtZSArICc8JyApOyAgXHJcbiAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICB9Ki9cclxuXHJcbiAgICAgICAgICBmb3IgKCB2YXIgb2Zmc2V0IGluIG11bHRpdGFncyApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdmFyIG11bHRpdGFnID0gbXVsdGl0YWdzWyBvZmZzZXQgXTtcclxuXHJcbiAgICAgICAgICAgICAgdmFyIHR0ID0gJyc7XHJcbiAgICAgICAgICAgICAgZm9yICggdmFyIGsgPSAwLCBsID0gbXVsdGl0YWcudGFncy5sZW5ndGg7IGsgPCBsOyBrKysgKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgaWYoazwzKSB0dCA9IHR0ICsgKHR0Lmxlbmd0aD09MCA/ICcnIDogJywgJykgKyBtdWx0aXRhZy50YWdzWyBrIF0ubmFtZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYoIG11bHRpdGFnLnRhZ3MubGVuZ3RoID4gMyApIHR0ID0gdHQgKyAnLCAuLi4nO1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICByZXN1bHRfc3RyID0gcmVzdWx0X3N0ci5yZXBsYWNlKCAnXyRtdCRfJyArIG11bHRpdGFnLm9mZnNldCArIG11bHRpdGFnLm5hbWUsICAnPHNwYW4gY2xhc3M9XCJtdWx0aXRhZ1wiIGRhdGEtdG9vbHRpcD1cIicgKyBcclxuICAgICAgICAgICAgICAgICAgdHQgKydcIiBkYXRhLW9mZnNldD1cIicgKyB0eXBlICsgJ18nICttdWx0aXRhZy5vZmZzZXQgKyAnXCI+JyArIG11bHRpdGFnLm5hbWUgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHJldHVybiByZXN1bHRfc3RyO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5GQl90aHVtYm5haWxfdG9fZnVsbF9zaXplID0gZnVuY3Rpb24oIHVybCApXHJcbiAgICAgIHtcclxuICAgICAgICAgIHZhciB1cmxfbiA9IHVybDtcclxuXHJcbiAgICAgICAgICBpZiAoIHVybC5pbmRleE9mKFwiP1wiKSA9PSAtMSApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWYgKCB1cmwuaW5kZXhPZihcIl9zLmpwZ1wiKSAhPSAtMSApIHVybF9uID0gdXJsLnJlcGxhY2UoXCJfcy5qcGdcIiwgXCJfbi5qcGdcIik7XHJcblxyXG4gICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIGlmICggdXJsLmluZGV4T2YoXCJfcy5qcGVnXCIpICE9IC0xICkgdXJsX24gPSB1cmwucmVwbGFjZShcIl9zLmpwZWdcIiwgXCJfbi5qcGVnXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgZWxzZSB1cmxfbiA9IHVybC5yZXBsYWNlKFwiX3MucG5nXCIsIFwiX24ucG5nXCIpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm4gdXJsX247XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBcclxuICAgICAgdGhpcy5yZXBsYWNlVVJMV2l0aEhUTUxMaW5rcyA9IGZ1bmN0aW9uKCB0ZXh0LCBuZXdXaW5kb3cgKVxyXG4gICAgICB7XHJcbiAgICAgICAgICB2YXIgZXhwID0gLyhcXGIoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC9bLUEtWjAtOSsmQCNcXC8lPz1+X3whOiwuO10qWy1BLVowLTkrJkAjXFwvJT1+X3xdKS9pZztcclxuICAgICAgICAgIHZhciBleHBfd3d3ID0gL14oXFxiKD8hKGh0dHBzP3xmdHB8ZmlsZSkpKHd3d1suXSlbLUEtWjAtOSsmQCNcXC8lPz1+X3whOiwuO10qWy1BLVowLTkrJkAjXFwvJT1+X3xdKS9pZztcclxuICAgICAgICAgIGlmKG5ld1dpbmRvdykge1xyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGV4cCwgXCI8YSBocmVmPSckMScgdGFyZ2V0PSdfYmxhbmsnPiQxPC9hPlwiKTsgXHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoZXhwX3d3dywgXCI8YSBocmVmPSdodHRwOi8vJDEnIHRhcmdldD0nX2JsYW5rJz4kMTwvYT5cIik7IFxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShleHAsIFwiPGEgaHJlZj0nJDEnPiQxPC9hPlwiKTsgXHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoZXhwX3d3dywgXCI8YSBocmVmPSdodHRwOi8vJDEnPiQxPC9hPlwiKTsgXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB0aGlzLmdldFNpZGVNZW51ID0gZnVuY3Rpb24oIHR5cGUgKVxyXG4gICAgICB7XHJcbiAgICAgICAgIHZhciBzaWRlTWVudSA9IFtdO1xyXG5cclxuICAgICAgICAgc3dpdGNoKCB0eXBlIClcclxuICAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdob21lJzpcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICBzaWRlTWVudSA9IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBZGQgJiBNYW5hZ2UgQWNjb3VudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3RhYnMubWFuYWdlX2FjY291bnRzJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBY2NvdW50IFNldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5tYW5hZ2VfYWNjb3VudHMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3B1Ymxpc2hpbmcnOlxyXG5cclxuICAgICAgICAgICAgICBzaWRlTWVudSA9IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBY2NvdW50IFNldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5tYW5hZ2VfYWNjb3VudHMnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1Bvc3QgU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLnBvc3Rfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBicmVhazsgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdmZWVkJzpcclxuXHJcbiAgICAgICAgICAgICAgc2lkZU1lbnUgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLmZlZWRfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0FkZCB0byBGYXZvcml0ZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLmZlZWRfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgICBicmVhazsgXHJcblxyXG5cclxuICAgICAgICAgfVxyXG5cclxuICAgICAgICAgcmV0dXJuIHNpZGVNZW51O1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgdGhpcy5nZXRXYXRjaENvdW50ID0gZnVuY3Rpb24oKVxyXG4gICAgICB7XHJcbiAgICAgICAgICAgIHZhciByb290ID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdodG1sJykpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHdhdGNoZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goWyckc2NvcGUnLCAnJGlzb2xhdGVTY29wZSddLCBmdW5jdGlvbiAoc2NvcGVQcm9wZXJ0eSkgeyBcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5kYXRhKCkgJiYgZWxlbWVudC5kYXRhKCkuaGFzT3duUHJvcGVydHkoc2NvcGVQcm9wZXJ0eSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnQuZGF0YSgpW3Njb3BlUHJvcGVydHldLiQkd2F0Y2hlcnMsIGZ1bmN0aW9uICh3YXRjaGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXRjaGVycy5wdXNoKHdhdGNoZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudC5jaGlsZHJlbigpLCBmdW5jdGlvbiAoY2hpbGRFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZihhbmd1bGFyLmVsZW1lbnQoY2hpbGRFbGVtZW50KSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGYocm9vdCk7XHJcblxyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZHVwbGljYXRlIHdhdGNoZXJzXHJcbiAgICAgICAgICAgIHZhciB3YXRjaGVyc1dpdGhvdXREdXBsaWNhdGVzID0gW107XHJcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaCh3YXRjaGVycywgZnVuY3Rpb24oaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgaWYod2F0Y2hlcnNXaXRob3V0RHVwbGljYXRlcy5pbmRleE9mKGl0ZW0pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICB3YXRjaGVyc1dpdGhvdXREdXBsaWNhdGVzLnB1c2goaXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHdhdGNoZXJzV2l0aG91dER1cGxpY2F0ZXMubGVuZ3RoO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXM7ICAgICAgICAgICAgICBcclxuXHJcblxyXG5cclxuICB9XTtcclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdBY2NvdW50JywgJyRjb3Jkb3ZhSW5BcHBCcm93c2VyJywnXycsIGZ1bmN0aW9uKCRodHRwLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBBY2NvdW50LCAkY29yZG92YUluQXBwQnJvd3NlciwgXyApeyAgXHJcblxyXG4gICAgdmFyIGxpY2Vuc2VPcHRpb25zLFxyXG4gICAgICAgIHNldHRpbmdzLFxyXG4gICAgICAgIGlzX2V0c3lfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3dlZWJseV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfd2l4X3VzZXI9IGZhbHNlLFxyXG4gICAgICAgIGlzX2xleGl0eV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfc2hvcGlmeV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfYmlnY29tbWVyY2VfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGV4dGVybmFsQXBwcyA9IFtdLFxyXG4gICAgICAgIGZhdm9yaXRlcyA9IFtdLFxyXG4gICAgICAgIHNlYXJjaGVzID0gW10sXHJcbiAgICAgICAgdXNlcl9pbmJveF9maWx0ZXJzID0gW10sXHJcbiAgICAgICAgZ290X3NmID0gZmFsc2UsXHJcbiAgICAgICAgZ290X3NlYXJjaGVzID0gZmFsc2UsXHJcbiAgICAgICAgbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSAwLFxyXG4gICAgICAgIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSB0cnVlLFxyXG4gICAgICAgIGhpZGVFdmVudHNDb3VudGVyID0gZmFsc2UsXHJcbiAgICAgICAgZGlzcGxheUluYm94U2V0dGluZ3MgPSB0cnVlLFxyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZhbHNlLFxyXG4gICAgICAgIGFnZW5jeUNvbmZpZ3VyYXRpb24gPSB7fSxcclxuICAgICAgICBtYXhFdmVudFRpbWU7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmdldERpc3BsYXlJbmJveFNldHRpbmdzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZGlzcGxheUluYm94U2V0dGluZ3M7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0RGlzcGxheUluYm94U2V0dGluZ3MgPSBmdW5jdGlvbiAoIGRpc3BsYXkgKVxyXG4gICAge1xyXG4gICAgICAgIGRpc3BsYXlJbmJveFNldHRpbmdzID0gZGlzcGxheTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAoIG1heEV2ZW50VGltZSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKS5nZXRUaW1lKCkgOiBtYXhFdmVudFRpbWUgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoIHRpbWUgKVxyXG4gICAge1xyXG4gICAgICAgIG1heEV2ZW50VGltZSA9IHRpbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGhpZGU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0SGlkZUV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBoaWRlRXZlbnRzQ291bnRlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRIaWRlRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgaGlkZUV2ZW50c0NvdW50ZXIgPSBoaWRlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldE51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0TnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoIGNvbXBsZXRlZF9ldmVudHMgKVxyXG4gICAge1xyXG4gICAgICAgIG51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gY29tcGxldGVkX2V2ZW50cztcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJDb21wbGV0ZWRFdmVudHNDb3VudGVyKCk7IFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmdW5jdGlvbiAoIGZsYWcgKVxyXG4gICAge1xyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVuZGVyQ29tcGxldGVkRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICAvKnZhciAkaW5kaWNhdG9yID0gJCgnYm9keScpLmZpbmQoJy5uZXctZXZlbnRzLWluZGljYXRvcicpO1xyXG5cclxuICAgICAgICBpZiAoICRpbmRpY2F0b3IubGVuZ3RoID4gMCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICFoaWRlRXZlbnRzQ291bnRlciAmJiBhbGxfc2V0dGluZ3MubGljZW5zZVR5cGUgIT0gJ0ZyZWUnICYmIGFsbF9zZXR0aW5ncy5saWNlbnNlVHlwZSAhPSAnSW5kaXZpZHVhbCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICRpbmRpY2F0b3IuaGFzQ2xhc3MoJ3plcm8nKSApICRpbmRpY2F0b3IucmVtb3ZlQ2xhc3MoJ3plcm8nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkaW5kaWNhdG9yLnRleHQoIG51bWJlck9mQ29tcGxldGVkRXZlbnRzICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAhJGluZGljYXRvci5oYXNDbGFzcygnemVybycpICkgJGluZGljYXRvci50ZXh0KCcnKS5hZGRDbGFzcygnemVybycpOyAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0qL1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhZ2VuY3lDb25maWd1cmF0aW9uO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoIGFjIClcclxuICAgIHtcclxuICAgICAgICBhZ2VuY3lDb25maWd1cmF0aW9uID0gYWM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWdlbmN5QnJhbmRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYoIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50ID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcblxyXG4gICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KCBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudCApIClcclxuICAgICAgICAgICAgcmV0dXJuIFsgYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRVc2VyUGVybWlzc2lvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIHZhciBicmFuZHMgPSBtb2R1bGUuZ2V0QWdlbmN5QnJhbmRzKCksXHJcbiAgICAgICAgICAgIHBlcm1pc3Npb24gPSAnZWRpdCc7XHJcblxyXG4gICAgICAgIGlmKCAhYnJhbmRzLmxlbmd0aCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPGJyYW5kcy5sZW5ndGg7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggYnJhbmRzW2ldLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgYnJhbmRzW2ldLnNlbGVjdGVkID09ICcxJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBlcm1pc3Npb24gPSBicmFuZHNbaV0ucGVybWlzc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBlcm1pc3Npb247XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFuYWx5dGljc0FjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFBPU1QsXHJcbiAgICAgICAgICAgIHVybDogJ2FqYXgucGhwJyxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QW5hbHl0aWNzQWNjb3VudHMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZSggcmVzcG9uc2UgKTsgXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUFjY291bnRzID0gZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDpcImFqYXgucGhwXCIsXHJcbiAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOid1cGRhdGVBY2NvdW50cycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOmRhdGFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCByZXNwb25zZSA9PSBTVUNDRVNTKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoKTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlU2V0dGluZ3MgPSBmdW5jdGlvbiggZGF0YSwgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NhdmVTZXR0aW5ncycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggcmVzcG9uc2UucmV0dXJuQ29kZSA9PSBcIlNVQ0NFU1NcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmhhbmRsZV9zZXR0aW5ncyggcmVzcG9uc2Uuc2V0dGluZ3MsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCByZXNwb25zZSApO1xyXG4gICAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFNlYXJjaFN0cmVhbXMgPSBmdW5jdGlvbiggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KHsgdHlwZTpHRVQsIHVybDonZmVlZC9zZWFyY2hTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0U2VhcmNoU3RyZWFtcyd9fSwgZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGdvdF9zZiA9IHRydWU7XHJcbiAgICAgICAgICAgIHNlYXJjaGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmVkaXRTZWFyY2hTdHJlYW0gPSBmdW5jdGlvbiggc3RyZWFtLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBzdHJlYW0ucHJvZmlsZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICAgICAgdXJsOidmZWVkL3NlYXJjaFN0cmVhbXMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2VkaXRTZWFyY2hTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJlYW0uaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzdHJlYW0ucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc3RyZWFtLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogc3RyZWFtLnBhcmFtZXRlcnNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgIT09IHVuZGVmaW5lZCApIHJlcXVlc3QuZGF0YS5uYW1lID0gJ1NlYXJjaDogJyArIGRlY29kZVVSSUNvbXBvbmVudCggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgKTtcclxuXHJcbiAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRGYXZvcml0ZVN0cmVhbXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCh7IHR5cGU6R0VULCB1cmw6J2ZlZWQvZmF2b3JpdGVTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0RmF2b3JpdGVTdHJlYW1zJ319LCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgZmF2b3JpdGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGdvdF9mYXZlcyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZmF2b3JpdGVzICk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0RmF2b3JpdGVTdHJlYW1zIHJlc3BvbnNlOicpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mYXZvcml0ZXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIGdvdF9mYXZlcyApIHJldHVybiBmYXZvcml0ZXM7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNlYXJjaF9mZWVkcyA9IGZ1bmN0aW9uICggKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggZ290X3NmICkgcmV0dXJuIHNlYXJjaGVzO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTsgICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXR0aW5ncyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKSBcclxuICAgIHtcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggc2V0dGluZ3MgKTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldFNldHRpbmdzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpHRVQsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycgICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBoYW5kbGUgKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtb2R1bGUuaGFuZGxlX3NldHRpbmdzKHJlc3BvbnNlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGhhbmRsZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmhhbmRsZV9zZXR0aW5ncyA9IGZ1bmN0aW9uKCByZXNwb25zZSwgY2FsbGJhY2ssIGZsYWdfbm9fYWdlbmN5X3VwZGF0ZSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2hhbmRsZV9zZXR0aW5ncy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICBmbGFnX25vX2FnZW5jeV91cGRhdGUgPSBmbGFnX25vX2FnZW5jeV91cGRhdGUgPyBmbGFnX25vX2FnZW5jeV91cGRhdGU6ZmFsc2U7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gc2V0IG1vZHVsZSB2YXJpYWJsZVxyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGRhdGE7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MuYXBpVXNlciA9PT0gdW5kZWZpbmVkIHx8IF8uaXNFbXB0eSggc2V0dGluZ3MuYXBpVXNlciApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmFwaVVzZXIgPSBzZXR0aW5ncy5lbWFpbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9zZXQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICAgICAgICBpc193aXhfdXNlciA9IHNldHRpbmdzLndpeFVzZXI7XHJcbiAgICAgICAgICAgIG1heF9hbGxvd2VkX2dhX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZBY3RpdmVHb29nbGVBbmFseXRpY3NBY2NvdW50cztcclxuICAgICAgICAgICAgbWF4X2FsbG93ZWRfc29jaWFsX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZTb2NpYWxzT247XHJcbiAgICAgICAgICAgIHJlbV9kYXlzID0gc2V0dGluZ3MuZGF5c0xlZnQ7XHJcblxyXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4gICAgICAgICAgICAvL0VDLnNlc3Npb25EYXRhLnNldCgnYWxsX3NldHRpbmdzJywgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0IHNldHRpbmdzRGVmZXJyZWQgYXMgcmVzb2x2ZWQgb25seSBpZiBzZXR0aW5ncyBhdmFpbGFibGVcclxuICAgICAgICAgICAgLy9zZXR0aW5nc0RlZmVycmVkLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxpY2Vuc2VPcHRpb25zID0gZGF0YS5saWNlbnNlT3B0aW9ucztcclxuXHJcbiAgICAgICAgICAgIC8qaWYgKCBkYXRhLnVzZXJTb3VyY2UgPT0gXCJiaWdjb21tZXJjZVwiIHx8IGRhdGEubG9naW5UeXBlICE9ICd1c2VyUGFzc3dvcmQnKXtcclxuICAgICAgICAgICAgICAgICQoJy5jaGFuZ2VfcGFzcycpLmFkZENsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0qL1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM/ICggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzLnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEhpZGVFdmVudHNDb3VudGVyKCBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciA/ICggZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIikgOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXREaXNwbGF5SW5ib3hTZXR0aW5ncyggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA/ICggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKSA6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLm51bWJlck9mTmV3RXZlbnRzID09ICdzdHJpbmcnKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXROdW1iZXJPZkNvbXBsZXRlZEV2ZW50cyggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3coIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID8gKCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKTogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiA9PSAnb2JqZWN0Jyl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QWdlbmN5Q29uZmlndXJhdGlvbiggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5leHRlcm5hbEFwcHMhPT11bmRlZmluZWQgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gZXh0ZXJuYWxBcHBzID0gZGF0YS5leHRlcm5hbEFwcHM7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5leHRlcm5hbEFwcHMgKSApIGV4dGVybmFsQXBwcyA9IFsgZGF0YS5leHRlcm5hbEFwcHMgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGV4dGVybmFsQXBwcyA9IGRhdGEuZXh0ZXJuYWxBcHBzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnZXh0ZXJuYWxBcHBzJyApXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZXh0ZXJuYWxBcHBzIClcclxuXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEFwcHMuZm9yRWFjaChmdW5jdGlvbiAoIGV4dGVybmFsQXBwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBleHRlcm5hbEFwcC5leHRlcm5hbEFwcCApICkgZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHAgPSBbIGV4dGVybmFsQXBwLmV4dGVybmFsQXBwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcHAgPSBleHRlcm5hbEFwcC5leHRlcm5hbEFwcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdhcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggYXBwIClcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBhcHAuZm9yRWFjaChmdW5jdGlvbiAoIHRoaXNfYXBwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAndGhpc19hcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIHRoaXNfYXBwIClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2xleGl0eScpIGlzX2xleGl0eV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ3dlZWJseScpIGlzX3dlZWJseV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2V0c3knKSBpc19ldHN5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnc2hvcGlmeScpIGlzX3Nob3BpZnlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdiaWdjb21tZXJjZScpIGlzX2JpZ2NvbW1lcmNlX3VzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gIFxyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVfc2V0dGluZ3Nfd2luZG93ID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzV2luZG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHJlc3AuYWdlbmN5TnVtYmVyT2ZDbGllbnRzICE9PSB1bmRlZmluZWQgKSAkKCcucGxhbi11c2FnZSAuYnJhbmQtdXNhZ2UgLnZhbHVlJykudGV4dCggcmVzcC5hZ2VuY3lOdW1iZXJPZkFjdGl2ZUNsaWVudHMrICcvJyArcmVzcC5hZ2VuY3lOdW1iZXJPZkNsaWVudHMgKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0dGluZ3NXaW5kb3dOdW1iZXJzKCByZXNwICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldExpY2Vuc2VPcHRpb25zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbGljZW5zZU9wdGlvbnM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfZXRzeV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfZXRzeV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3dlZWJseV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfd2VlYmx5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfbGV4aXR5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19sZXhpdHlfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19zaG9waWZ5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19zaG9waWZ5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfYmlnY29tbWVyY2VfdXNlcj0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfYmlnY29tbWVyY2VfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRFeHRlcm5hbEFwcHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBleHRlcm5hbEFwcHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY2hlY2tMaWNlbnNlVmlldyA9IGZ1bmN0aW9uICggaWQsIGlzX3dpeCwgbWl4cGFuZWxfdHlwZSApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gaWYoIGxpY2Vuc2VPcHRpb25zLnZpZXcgIT0gdW5kZWZpbmVkICYmIGxpY2Vuc2VPcHRpb25zLnZpZXcgPT0gJzdELU9ubHknICYmIGlkICE9ICc3RCcpXHJcbiAgICAgICAgaWYgKCBmYWxzZSApIC8vIGVuYWJsZSBhbGwgdGltZWZyYW1lc1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8kKHdpbmRvdykudHJpZ2dlcigndXBncmFkZS1wb3B1cCcsIG1peHBhbmVsX3R5cGUpO1xyXG4gICAgICAgICAgICBzaG93VXBncmFkZVdpbmRvdyhpc193aXgpO1xyXG4gICAgICAgICAgICByZXR1cm4gRkFJTDsgICAgXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlIHJldHVybiBTVUNDRVNTOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X3VzZXJfaW5ib3hfdGFncyA9IGZ1bmN0aW9uKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFVzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBzdGFydFRpbWU6ICcwJyxcclxuICAgICAgICAgICAgZW5kVGltZTogJzAnLFxyXG4gICAgICAgICAgICByZXF1ZXN0X2FjdGlvbjogJ2dldFVzZXJUYWdzJyxcclxuICAgICAgICAgICAgbWF4RXZlbnRzOiAnMSdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogR0VULFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3VzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoudGFncyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIG9iai50YWdzICkgKSB1c2VyX2luYm94X3RhZ3MgPSBvYmoudGFncztcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTtcclxuICAgICAgICB9KTsgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmluYm94X3RhZ3MgPSBmdW5jdGlvbiAoIClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdXNlcl9pbmJveF90YWdzOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlX2luYm94X3RhZ3MgPSBmdW5jdGlvbiggdGFncywgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHRhZ3MgPSBBcnJheS5pc0FycmF5KCB0YWdzICkgP3RhZ3M6W107XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBQT1NULFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICd1c2VyL2V2ZW50cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6eyB0YWdzOiB0YWdzIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIG9iaiApe1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vSWYgc3VjY2VzcywgdXBkYXRlIHRhZ3MgYXJyYXlcclxuICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT0gJ1NVQ0NFU1MnIClcclxuICAgICAgICAgICAgICAgIHVzZXJfaW5ib3hfdGFncyA9IHRhZ3M7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFtcclxuICAgICAgICAgICAgICAgICAgICAnJHN0YXRlJywgXHJcbiAgICAgICAgICAgICAgICAgICAgJyRyb290U2NvcGUnLCBcclxuICAgICAgICAgICAgICAgICAgICAnJHVybFJvdXRlcicsIFxyXG4gICAgICAgICAgICAgICAgICAgICdFQycsIFxyXG4gICAgICAgICAgICAgICAgICAgICdGYWNlYm9va0ZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdMaW5rZWRpbkZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUd2l0dGVyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdCbG9nZ2VyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdHb29nbGVQbHVzRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1lvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAnUGludGVyZXN0RmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ0luc3RhZ3JhbUZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICckaW5qZWN0b3InLCBcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cmxSb3V0ZXIsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBFQywgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZhY2Vib29rRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIExpbmtlZGluRmVlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgVHdpdHRlckZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBCbG9nZ2VyRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdvb2dsZVBsdXNGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgWW91VHViZUZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBQaW50ZXJlc3RGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgSW5zdGFncmFtRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbmplY3RvciApXHJcbntcclxuXHJcbiAgICBmdW5jdGlvbiBTb2NpYWwoIHByb2ZpbGUgKVxyXG4gICAge1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlIHx8IHt9O1xyXG5cclxuICAgICAgICAvLyB0aGlzLmZlZWRzID0ge307XHJcbiAgICAgICAgdGhpcy5mZWVkc19pbl9vcmRlciA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJ2YWwgPSAwO1xyXG5cclxuICAgICAgICAvL0luYm94IGZpbHRlcnNcclxuICAgICAgICB0aGlzLnVzZXJfaW5ib3hfZmlsdGVycyA9IFtdOy8vZ2V0X3VzZXJfaW5ib3hfZmlsdGVycygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7IFxyXG4gICAgICAgIHRoaXMuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPSB0cnVlOyBcclxuICAgIH0gXHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5wYWdlcyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnBhZ2VzO1xyXG4gICAgfTtcclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZGlyKCB0aGlzICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiggY29udGFpbmVyICl7XHJcblxyXG4gICAgICAgIHZhciAkY29udGFpbmVyID0gY29udGFpbmVyIHx8ICQoJyNzb2NpYWwnKTtcclxuXHJcbiAgICAgICAgJGNvbnRhaW5lci5odG1sKCcnKTtcclxuICAgIH07XHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiggKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vQXNzaWduIGl0IHRvIGdsb2JhbCBvYmplY3QgXHJcbiAgICAgICAgLy93aW5kb3cuZ2xvYmFscy5zb2NpYWwgPSB0aGlzOyBcclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBwcmV2aW91c19mZWVkcyA9IFtdLFxyXG4gICAgICAgICAgICBuZXdfc3RyZWFtc19vcmRlciA9IFtdLFxyXG4gICAgICAgICAgICBwcmV2X2ZlZWRzX2luX29yZGVyID0gc2VsZi5mZWVkc19pbl9vcmRlcjtcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS5zb2NpYWwgPSBzZWxmO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIgPSBbXTtcclxuXHJcbiAgICAgICAgLy9nZXQgbmV3IHN0cmVhbXMgb3JkZXJcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goIHNlbGYucHJvZmlsZS5zdHJlYW1zLCBmdW5jdGlvbiggdGhpc19zdHJlYW0gKXtcclxuICAgICAgICAgICAgdmFyIGlkID0gKCBbJ3JzcycsICdzZWFyY2gnLCAnb3V0cmVhY2gnXS5pbmRleE9mKCB0aGlzX3N0cmVhbS5zdHJlYW1JZCApID4gLTEgKSA/IHRoaXNfc3RyZWFtLmlkIDogdGhpc19zdHJlYW0uc3RyZWFtSWQ7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiggc2VsZi5wcm9maWxlLmlkLmluZGV4T2YoJ2Zhdm9yaXRlJykgIT09IC0xIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQgKz0gJ18nICsgIHRoaXNfc3RyZWFtLnByb2ZpbGUuaWQgKyAnXycgKyB0aGlzX3N0cmVhbS5uZXR3b3JrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5ld19zdHJlYW1zX29yZGVyLnB1c2goIGlkICk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2cobmV3X3N0cmVhbXNfb3JkZXIpO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBzZWxmLnByb2ZpbGUuc3RyZWFtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfc3RyZWFtID0gc2VsZi5wcm9maWxlLnN0cmVhbXNbIGkgXSxcclxuICAgICAgICAgICAgICAgIGlkID0gKCBbJ3JzcycsICdzZWFyY2gnLCAnb3V0cmVhY2gnXS5pbmRleE9mKCB0aGlzX3N0cmVhbS5zdHJlYW1JZCApID4gLTEgKSA/IHRoaXNfc3RyZWFtLmlkIDogdGhpc19zdHJlYW0uc3RyZWFtSWQsXHJcbiAgICAgICAgICAgICAgICBuZXR3b3JrID0gc2VsZi5wcm9maWxlLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfc3RyZWFtLnZhbHVlID09ICd0cnVlJyAgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQUFBOjonK25ldHdvcmspO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICggbmV0d29yayApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZhY2Vib29rJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGQiB0ZXN0Ojo6Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IEZhY2Vib29rRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdsaW5rZWRpbic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IExpbmtlZGluRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IFR3aXR0ZXJGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgQmxvZ2dlckZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ29vZ2xlcGx1cyc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBHb29nbGVQbHVzRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IFlvdVR1YmVGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBQaW50ZXJlc3RGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBJbnN0YWdyYW1GZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGdldEV4aXN0aW5nU3RhdGUgPSAkc3RhdGUuZ2V0KG5ld19mZWVkLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggbmV3X2ZlZWQgJiYgJHN0YXRlLmdldChuZXdfZmVlZC5wYWdlX2lkKSA9PT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIucHVzaCggbmV3X2ZlZWQgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmV3X2ZlZWQucmVuZGVyID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZC5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy92YXIgJG5ld19mZWVkID0gbmV3X2ZlZWQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vJGNvbnRhaW5lci5hcHBlbmQoICRuZXdfZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBuZXdfZmVlZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHByZXZfZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IG5ld19mZWVkLnBhZ2VfaWR9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiggaW5kZXggPj0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyLnB1c2gocHJldl9mZWVkc19pbl9vcmRlcltpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB1cGRhdGVkX3N0cmVhbXNfb3JkZXIgPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5mZWVkc19pbl9vcmRlciwgZnVuY3Rpb24odGhpc19mZWVkKXtcclxuICAgICAgICAgICAgdXBkYXRlZF9zdHJlYW1zX29yZGVyLnB1c2godGhpc19mZWVkLnBhZ2VfaWQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgICAgIC8vRGVjaWRlIHRoZSBmZWVkIHBhZ2UgdG8gc2hvdyBieSBkZWZhdWx0XHJcbiAgICAgICAgdmFyIGZlZWRfcGFnZV90b19zaG93ID0gJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy90byBtYWludGFpbiBsYXN0IGZlZWQtc2VsZWN0b3IgcG9zaXRpb25cclxuICAgICAgICBpZiggc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciAmJiBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgPT09IDAgKSBcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlcltzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3JdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKCBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yXTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPT09IGZhbHNlICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlclt1cGRhdGVkX3N0cmVhbXNfb3JkZXIubGVuZ3RoLTFdO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vYXNzaWduIHVwZGF0ZWQgc3RyZWFtcyB0byBjdXJyZW50IG9iamVjdFxyXG4gICAgICAgIHNlbGYudXBkYXRlZF9zdHJlYW1zX29yZGVyID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyO1xyXG5cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0T2JqKGlkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHNlbGYuZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IGlkfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qY29uc29sZS5sb2coJ3VwZGF0ZWRfc3RyZWFtc19vcmRlcicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVwZGF0ZWRfc3RyZWFtc19vcmRlcik7XHJcbiAgICAgICAgY29uc29sZS5sb2coZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGdldE9iaihmZWVkX3BhZ2VfdG9fc2hvdykpOyovXHJcbiAgICAgICAgdmFyIGN1cnJlbnRfb2JqID0geyduYW1lJzoncmFtJ307Ly9nZXRPYmooZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG5cclxuICAgICAgICAkc3RhdGUuZ28oZmVlZF9wYWdlX3RvX3Nob3csIHtvYmo6Y3VycmVudF9vYmp9LCB7Y2FjaGU6IHRydWV9KTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ3RoaXMuZmVlZHNfaW5fb3JkZXInKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmZlZWRzX2luX29yZGVyKTtcclxuICAgICAgICByZXR1cm4gdGhpczsgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcbiAgICBcclxuXHJcblxyXG4gICAgXHJcblxyXG5cclxuICAgIHJldHVybiBTb2NpYWw7XHJcbn1dO1xyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBmZWVkX2l0ZW0gPSAnJztcclxuXHJcbiAgICAgICAgc2VsZi5kYXRhID0gaXRlbV9kYXRhO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZCA9IGZlZWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5wcm9maWxlID0gZmVlZC5wcm9maWxlO1xyXG5cclxuICAgICAgICBzZWxmLmVsZW1lbnQgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBGZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIEZlZWRJdGVtID0gIEZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBJbnN0YWdyYW1GZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICBcclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEluc3RhZ3JhbUZlZWRJdGVtO1xyXG4gICBcclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cztcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyQ29tbWVudCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlckNvbW1lbnQ7XHJcbiAgIFxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5hZGRfY29tbWVudCA9IGZ1bmN0aW9uICggbWVzc2FnZSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGh0X2V4cCA9IC9cXEIjKFxcdypbYS16QS1aXStcXHcqKS9pZyxcclxuICAgICAgICAgICAgbGlua3NfZXhwID0gLyhcXGIoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC9bLUEtWjAtOSsmQCNcXC8lPz1+X3whOiwuO10qWy1BLVowLTkrJkAjXFwvJT1+X3xdKS9pZztcclxuXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBJbnN0YWdyYW1GZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIENvbGxhcHNpYmxlRmVlZEl0ZW0gPSAgQ29sbGFwc2libGVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdDb2xsYXBzaWJsZUZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgQ29sbGFwc2libGVGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmFkZF9jb21tZW50ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuYWRkX2NvbW1lbnQ7XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmRlbGV0ZV9tZXNzYWdlID0gZnVuY3Rpb24gKCAkdHdlZXQsIGlkIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cclxuICAgICAgICB2YXIgdGV4dCA9ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgcG9zdCA/JztcclxuICAgICAgICBcclxuIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUucmV0d2VldCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQ7XHJcblxyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gQmxvZ2dlckZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQmxvZ2dlckZlZWQ7XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2JsX2FsbCc6IHRoaXMuZ2V0QmxvZ1Bvc3RzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuZ2V0QmxvZ1Bvc3RzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRCbG9nZ2VyUG9zdHMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZFxyXG4gICAgICAgICAgICAvL25leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9ibG9nZ2VyJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclYyoqKioqKioqKioqKioqKiogIGdldEJsb2dnZXJQb3N0cycsJ2NvbG9yOiBjcmltc29uJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLm5leHQgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5uZXh0ID09PSB1bmRlZmluZWQgfHwgIXRoaXMubmV4dCApIHtcclxuICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHNlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIHJldHVybjsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QmxvZ2dlclBvc3RzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9ibG9nZ2VyJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWMqKioqKioqKioqKioqKioqICBnZXRCbG9nZ2VyUG9zdHMgTkVYVCAnLCdjb2xvcjogY3JpbXNvbicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5uZXh0ICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcHAgPSB0aGlzX2RhdHVtLnByb2ZpbGVQaWM/dGhpc19kYXR1bS5wcm9maWxlUGljOicnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiggcHAuaW5kZXhPZignLy8nKSA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5wcm9maWxlUGljID0gdGhpc19kYXR1bS5wcm9maWxlUGljLnJlcGxhY2UoJy8vJywgJ2h0dHBzOi8vJyk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuZm9ybWF0X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0gZGF0YTtcclxuXHJcbiAgICAgICAgaWYgKCBfLmlzRW1wdHkoIGRhdGEubmFtZSApICkgZGF0YS5uYW1lID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBpZiggdHlwZW9mIGRhdGEubWVzc2FnZSA9PSAnc3RyaW5nJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgIHRoaXNfZGF0dW0ubWVzc2FnZSA9IC8qJzxhIGNsYXNzPVwicnNzLWl0ZW0tdGl0bGVcIiBocmVmPVwiJyArZGF0YS5wZXJtYWxpbmsrICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICtkYXRhLm5hbWUrICc8L2E+JyArICovXHJcbiAgICAgICAgICAgIGRhdGEubWVzc2FnZVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvPGhcXGQvZ2ksJzxkaXYnKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvPFxcL2hcXGQ+L2dpLCc8L2Rpdj4nKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvY2xhc3M9XCJcXHcqXCIvZ2ksJycpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9zdHlsZT0vZ2ksICdkYXRhLXM9JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL3dpZHRoPS9naSwgJ2RhdGEtdz0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvaGVpZ2h0PS9naSwgJ2RhdGEtaD0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvYSBocmVmL2dpLCAnYSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoLzxiclxccypbXFwvXT8+L2dpLCAnPHNwYW4+PC9zcGFuPicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTsgIFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQmxvZ2dlckZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBGZWVkSXRlbSA9ICAkaW5qZWN0b3IuZ2V0KCdGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG5cclxuICAgIGZ1bmN0aW9uIENvbGxhcHNpYmxlRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUucmV0d2VldCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQ7XHJcbiAgICBcclxuICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmZhdm9yaXRlID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZmF2b3JpdGU7XHJcblxyXG4gICAgcmV0dXJuIENvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBGZWVkSXRlbSA9ICBGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgVGltZWxpbmVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdUaW1lbGluZUZlZWRJdGVtJyk7XHJcbiAgICBcclxuXHJcbiAgICBmdW5jdGlvbiBEcm9wZG93bkZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dCA9ICcnO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdF9lbGVtZW50ID0gZmVlZC5kZWZhdWx0X2VsZW1lbnQgfHwgJyc7XHJcbiAgICB9XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEcm9wZG93bkZlZWRJdGVtO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9kcm9wZG93biA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkcm9wZG93biA9IFtdLFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlciA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZGF0YS5sZW5ndGggPiAwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGYuZGF0YSA9IHNlbGYuZGF0YS5zb3J0KGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZUEgPSAoIHR5cGVvZiBhLm5hbWUgPT09ICdzdHJpbmcnID8gYS5uYW1lLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVCID0gKCB0eXBlb2YgYi5uYW1lID09PSAnc3RyaW5nJyA/IGIubmFtZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG5hbWVBID4gbmFtZUIgKSByZXR1cm4gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggbmFtZUEgPCBuYW1lQiApIHJldHVybiAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5kYXRhID0gc2VsZi5kYXRhLnNvcnQoZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVBID0gKCB0eXBlb2YgYS5jaGFubmVsVGl0bGUgPT09ICdzdHJpbmcnID8gYS5jaGFubmVsVGl0bGUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVCID0gKCB0eXBlb2YgYi5jaGFubmVsVGl0bGUgPT09ICdzdHJpbmcnID8gYi5jaGFubmVsVGl0bGUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggbmFtZUEgPiBuYW1lQiApIHJldHVybiAxO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggbmFtZUEgPCBuYW1lQiApIHJldHVybiAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBzZWxmLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfZ3JvdXAgPSBzZWxmLmRhdGFbIGkgXSxcclxuICAgICAgICAgICAgICAgICAgICBncm91cF9pZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19ncm91cCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfZ3JvdXAuY2hhbm5lbElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzX2dyb3VwLmNoYW5uZWxUaXRsZVxyXG4gICAgICAgICAgICAgICAgICAgIH07ICBcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGdyb3VwX2lkID0gdGhpc19ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInICkgZ3JvdXBfaWQgPSB0aGlzX2dyb3VwLmlkX3N0cjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZHJvcGRvd24ucHVzaCh7J2lkJzpncm91cF9pZCwgJ25hbWUnOnRoaXNfZ3JvdXAubmFtZSwgJ2RhdGEnOnRoaXNfZ3JvdXB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCggdGhpcy5mZWVkLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbGlzdHMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpX2JvYXJkJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj0gJ1lvdSBkbyBub3QgaGF2ZSBib2FyZHMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXMnOlxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXNfb25seSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSdZb3UgZG8gbm90IGhhdmUgcGFnZXMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgZG8gbm90IGZvbGxvdyBhbnkgY29tcGFueSB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3l0X215U3Vic2NyaXB0aW9uJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgaGF2ZW5cXCd0IGFkZGVkIGFueSBzdWJzY3JpcHRpb25zIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbGlrZXMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gKCdZb3UgaGF2ZW5cXCd0IGxpa2VkIGFueSBwYWdlcyB5ZXQuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBhcmUgbm90IGEgbWVtYmVyIG9mIGFueSBncm91cHMuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgJ2NvdW50Jzpkcm9wZG93bi5sZW5ndGgsICdkYXRhJzpkcm9wZG93biwgJ3BsYWNlaG9sZGVyJzogcGxhY2Vob2xkZXJ9O1xyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5zZXRfZGVmYXVsdF9ncm91cF9pZCA9IGZ1bmN0aW9uICggc2VsX29iaiApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAkX3RoaXMgPSBzZWxfb2JqO1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRfdGhpcy5kYXRhLmlkO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJGVsbS5kYXRhKCdkYXRhJykuaWRfc3RyO1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbGlzdHMnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUubGlzdHMuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7ICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHRpbmcgb2YgZGVmYXVsdCBncm91cCBpZFxyXG4gICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC51cGRhdGVGZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG5cclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQudXBkYXRlSW50ZXJ2YWxJRCA9IHNldEludGVydmFsKCB1cGRhdGVGZWVkTm90aWZpY2F0aW9uLCA1KjYwKjEwMDAsIHNlbGYuZmVlZCApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdzZXREZWZhdWx0R3JvdXBJZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAvL2RlZmF1bHRHcm91cElkOiAkKCB0aGlzICkuZGF0YSgnZGF0YScpLmlkLFxyXG4gICAgICAgICAgICBkZWZhdWx0R3JvdXBJZDogc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQsXHJcbiAgICAgICAgICAgIG5ldHdvcms6IHNlbGYuZmVlZC5uZXR3b3JrXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiBcImZlZWQvZGVmYXVsdEdyb3VwSWRcIixcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyggJ3NldHRpbmcgc2V0RGVmYXVsdEdyb3VwSWQ6ICcgKyBncm91cF9pZCApXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvKnZhciBkYXRhID0gSlNPTi5wYXJzZSggcmVzcCApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggJ3NldCByZXNwb25zZTonIClcclxuICAgICAgICAgICAgY29uc29sZS5kaXIoIGRhdGEgKSovXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggc2VsX29iaiApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAkX3RoaXMgPSBzZWxfb2JqO1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRfdGhpcy5kYXRhLmlkO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJGVsbS5kYXRhKCdkYXRhJykuaWRfc3RyO1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbGlzdHMnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUubGlzdHMuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7ICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHRpbmcgb2YgZGVmYXVsdCBncm91cCBpZFxyXG4gICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC51cGRhdGVGZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG5cclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQudXBkYXRlSW50ZXJ2YWxJRCA9IHNldEludGVydmFsKCB1cGRhdGVGZWVkTm90aWZpY2F0aW9uLCA1KjYwKjEwMDAsIHNlbGYuZmVlZCApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0geyB0eXBlOiAnR0VUJyB9LFxyXG4gICAgICAgICAgICBkYXRhID0ge307XHJcblxyXG4gICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogJF90aGlzLmRhdGEuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ6IHNlbGYubmV4dFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmVxdWVzdC51cmwgPSAnZmVlZC9mYkdyb3VwJztcclxuXHJcbiAgICAgICAgcmVxdWVzdC5kYXRhID0gZGF0YTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AsXHJcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnbGlua2VkaW4nICkgc2VsZi5uZXh0ID0gMjU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEudmFsdWVzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAnbGlua2VkaW4nKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBkYXRhLnZhbHVlc1sgMCBdLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgbSA9IGRhdGEudmFsdWVzLmxlbmd0aDsgaiA8IG07IGorKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfdmFsID0gZGF0YS52YWx1ZXNbIGogXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1bW1hcnkgPSB0aGlzX3ZhbC5zdW1tYXJ5IHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQgIT09IHVuZGVmaW5lZCAmJiB0aGlzX3ZhbC51cGRhdGVDb250ZW50LmN1cnJlbnRVcGRhdGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzX3ZhbC51cGRhdGVDb250ZW50LmN1cnJlbnRVcGRhdGUuY29udGVudCAhPT0gdW5kZWZpbmVkKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBjb250ZW50LnRpdGxlICE9PSB1bmRlZmluZWQgJiYgY29udGVudC5zdWJtaXR0ZWRVcmwgIT09IHVuZGVmaW5lZCAmJiAhKC9cXC4oanBnfGpwZWd8cG5nfGJtcHx0aWZmfGF2aXxtcGVnfG1rdnxvZ2d8bW92fG1wZWd8bXBnfG1wZXxmbHZ8M2dwfGdpZikkL2kpLnRlc3QoY29udGVudC50aXRsZSkgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlX3N1bW1hcnkgPSAnPGEgaHJlZj1cImphdmFzY3JpcHQ6O1wiIG9uQ2xpY2s9XCJFQy5VSS5JQUIoXFwnJyArIGNvbnRlbnQuc3VibWl0dGVkVXJsICsgJ1xcJyk7XCI+JyArIGNvbnRlbnQudGl0bGUgKyAnPC9hPiAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGFbIGogXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfdmFsLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzxwPjxzcGFuIGNsYXNzPVwibG4tZ3JvdXAtdGl0bGVcIj4nICsgdGhpc192YWwudGl0bGUgKyAnOjwvc3Bhbj48L3A+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlX3N1bW1hcnk6IHByZV9zdW1tYXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBzdW1tYXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tTmFtZTogKCB0aGlzX3ZhbC5jcmVhdG9yLmZpcnN0TmFtZS50b0xvd2VyQ2FzZSgpID09ICdwcml2YXRlJyA/IHRoaXNfdmFsLmNyZWF0b3IuZmlyc3ROYW1lIDogdGhpc192YWwuY3JlYXRvci5maXJzdE5hbWUgKyAnICcgKyB0aGlzX3ZhbC5jcmVhdG9yLmxhc3ROYW1lICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWM6IHRoaXNfdmFsLmNyZWF0b3IucGljdHVyZVVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlVGltZTogcGFyc2VJbnQoIHRoaXNfdmFsLmNyZWF0aW9uVGltZXN0YW1wICkgLyAxMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tSWQ6IHRoaXNfdmFsLmNyZWF0b3IuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdGhpc192YWwuY29tbWVudHMuX3RvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudDogdGhpc192YWwuY29tbWVudHMudmFsdWVzIHx8IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpa2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdGhpc192YWwubGlrZXMuX3RvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlrZTogKCB0aGlzX3ZhbC5saWtlcy52YWx1ZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogdGhpc192YWwubGlrZXMudmFsdWVzLmNyZWF0b3IgKSB8fCBbXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXNfdmFsLnJlbGF0aW9uVG9WaWV3ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJfbGlrZXM6IHRoaXNfdmFsLnJlbGF0aW9uVG9WaWV3ZXIuaXNMaWtlZCB8fCBcImZhbHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IDI1O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLmRhdGEubmV4dFRva2VuO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gZGF0YS5kYXRhLml0ZW1zO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnICkgc2VsZi5uZXh0ID0gZGF0YS5uZXh0O1xyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAncGludGVyZXN0JyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5yZXR1cm5Db2RlID09PSAnRkFJTCcgfHwgKCBkYXRhLmRhdGEuc3RhdHVzICYmIGRhdGEuZGF0YS5zdGF0dXMgPT09ICdmYWlsdXJlJyApICkgZGF0YS5kYXRhID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWdlID0gZGF0YS5kYXRhLnBhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBwYWdlICYmIHBhZ2UuY3Vyc29yICkgc2VsZi5uZXh0ID0gcGFnZS5jdXJzb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gZGF0YS5kYXRhLmRhdGE7ICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZGF0YSApICkgaXRlbXMgPSBbIGRhdGEuZGF0YSBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaXRlbXMgPSBkYXRhLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpdGVtcy5sZW5ndGggPiAwICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicpIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdsaW5rZWRpbicgKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBpdGVtc1sgMCBdLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdnb29nbGVwbHVzJyApIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0ucG9zdElEO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19ncm91cCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJykgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBpdGVtc1sgaSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IGl0ZW1zWyBpIF0udXNlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBpdGVtc1sgaSBdLmNyZWF0ZWRfYXQgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmF2b3JpdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBpdGVtc1sgaSBdLmZhdm9yaXRlX2NvdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBieV9tZTogaXRlbXNbIGkgXS5mYXZvcml0ZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHdlZXRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBpdGVtc1sgaSBdLnJldHdlZXRfY291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5X21lOiBpdGVtc1sgaSBdLnJldHdlZXRlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICggKCBpdGVtc1sgaSBdLnJldHdlZXRlZF9zdGF0dXMgIT09IHVuZGVmaW5lZCApID8gaXRlbXNbIGkgXS5yZXR3ZWV0ZWRfc3RhdHVzLmlkX3N0ciA6IGl0ZW1zWyBpIF0uaWRfc3RyIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGl0ZW1zWyBpIF0udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tTmFtZTogKCBpdGVtc1sgaSBdLm5hbWUgfHwgaXRlbXNbIGkgXS51c2VyLm5hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogKCBpdGVtc1sgaSBdLnNjcmVlbl9uYW1lIHx8IGl0ZW1zWyBpIF0udXNlci5zY3JlZW5fbmFtZSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWM6ICggaXRlbXNbIGkgXS5wcm9maWxlX2ltYWdlX3VybCB8fCBpdGVtc1sgaSBdLnVzZXIucHJvZmlsZV9pbWFnZV91cmwgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0SUQ6IGl0ZW1zWyBpIF0uaWRfc3RyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBpdGVtc1sgaSBdLmlkX3N0cixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdfZGF0YTogaXRlbXNbIGkgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zWyBpIF0uZW50aXRpZXMgIT09IHVuZGVmaW5lZCAmJiBpdGVtc1sgaSBdLmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggaXRlbXNbIGkgXS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKSApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYSA9IHNlbGYuZ2V0X21lZGlhX2RhdGEoIGl0ZW1zWyBpIF0uZW50aXRpZXMubWVkaWEubWVkaWFfdXJsICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbG5fY29tcGFuaWVzJyApIG5ld19ncm91cCA9IG5ldyBMaW5rZWRpbkZlZWRJdGVtKCBpdGVtc1sgaSBdLCBzZWxmLmZlZWQgKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHNlbGYuZmVlZC5mb3JtYXRfaXRlbSggaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSBzZWxmLmZlZWQuZm9ybWF0X2l0ZW0oIGl0ZW1zWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ3BpbnRlcmVzdCcgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0gc2VsZi5mZWVkLmZvcm1hdF9pdGVtKCBpdGVtc1sgaSBdICk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGl0ZW1zWyBpIF0sIHNlbGYuZmVlZCApOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mZWVkLml0ZW1zLnB1c2goIG5ld19ncm91cCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5nZXRfbWVkaWFfZGF0YSA9IGZ1bmN0aW9uICggbWVkaWFfdXJscyApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2gobWVkaWFfdXJscywgZnVuY3Rpb24obWVkaWFfdXJsKXtcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdwaG90bycsXHJcbiAgICAgICAgICAgICAgICBzcmM6IG1lZGlhX3VybFxyXG4gICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIERyb3Bkb3duRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtLCBDb2xsYXBzaWJsZUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gRmFjZWJvb2tGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgIT09ICdVc2VyJyAmJiBbJ3dhbGxQb3N0cycsJ2ZiX25vdGlmaWNhdGlvbnMnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGYWNlYm9va0ZlZWQ7XHJcblxyXG4gICAgLypGYWNlYm9va0ZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyBcclxuICAgICAgICAgICAgLGN1cnJlbnRJRCA9IHNlbGYudXBkYXRlSW50ZXJ2YWxJRDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldE5ld3NGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6ICcvYWpheC5waHAnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoICggc2VsZi5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICd3YWxsUG9zdHMnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ3dhbGxQb3N0cyc7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEud2FsbCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5saW1pdCA9IDEwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZiX25vdGlmaWNhdGlvbnMnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ25vdGlmaWNhdGlvbnMnOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmxpbWl0ID0gMTA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaW5Cb3gnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2luQm94JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWN0aW9uID0gJ2dldEZiQ29udmVyc2lvbnMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmICggc2VsZi5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09PSBcIlVzZXJcIikgcmVxdWVzdC5kYXRhLm5leHQgPSBcIi9pbmJveFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLm5leHQgPSBcIi9jb252ZXJzYXRpb25zXCI7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY3VwZGF0ZUZlZWROb3RpZmljYXRpb24oJyArIHNlbGYuaWQgKyAnKSByZXNwb25zZTonLCAnY29sb3I6b3JhbmdlcmVkJyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnRJRCA9PT0gc2VsZi51cGRhdGVJbnRlcnZhbElEICkgLy8gZGlkbid0IHJlZnJlc2ggZHVyaW5nIHJlcXVlc3RcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0SUQgPSAnIyMjJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZpcnN0SXRlbUlEICkgZmlyc3RJRCA9IHNlbGYuZmlyc3RJdGVtSUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZpcnN0SUQgOjogJyArIGZpcnN0SUQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdOyAvLyBpbmNvbWluZyBtZXNzYWdlcyBhcnJheVxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnaW5Cb3gnICYmIGZpcnN0SUQgIT09ICcjIyMnIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VzZXJJZCA9IHNlbGYucHJvZmlsZS5kYXRhLnBhZ2VJZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEuZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1lbnRzID0gZGF0YS5kYXRhWyBpIF0uY29tbWVudHMuY29tbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBjb21tZW50cyApICkgY29tbWVudHMgPSBbIGNvbW1lbnRzIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGsgPSAwLCBsbCA9IGNvbW1lbnRzLmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2NvbW1lbnQgPSBjb21tZW50c1sgayBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfY29tbWVudC5mcm9tSWQgIT09IGN1c2VySWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluY29taW5nLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpc19jb21tZW50LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCB0aGlzX2NvbW1lbnQuY3JlYXRlZFRpbWUuc3BsaXQoJysnKVsgMCBdICkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfY29tbWVudC5tZXNzYWdlSWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG1pbmNvbWluZyApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBtaW5jb21pbmcubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiAoIGl0ZW0udGltZSA+IGZpcnN0SUQgPyAxIDogMCApO30pLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICsgYjsgfSwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnaW5Cb3ggaW5kZXggPSAnICsgaW5kZXggKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09ICBtaW5jb21pbmcubGVuZ3RoICkgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gaXRlbS5pZDt9KS5pbmRleE9mKCBmaXJzdElEICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAtMSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGZpcnN0SUQgPT09ICcjIyMnICkgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdpbmRleCA6OiAnICsgaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaW5kZXggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGhlYWRlciA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1oZWFkZXInKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAsJGZib2R5ID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICR1cGRhdGVfbm90aWYgPSAkZmJvZHkuZmluZCgnLnVwZGF0ZS1ub3RpZmljYXRpb24nKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHVwZGF0ZV9ub3RpZi5sZW5ndGggPT09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZiA9ICQoJzxkaXYgY2xhc3M9XCJ1cGRhdGUtbm90aWZpY2F0aW9uXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYub24oJ2NsaWNrJywgZnVuY3Rpb24gKCBlICl7ICRoZWFkZXIuZmluZCgnLnJlZnJlc2gtZmVlZCcpLnRyaWdnZXIoJ2NsaWNrJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmJvZHkuZmluZCgnLmZlZWQtaXRlbScpLmZpcnN0KCkuYmVmb3JlKCAkdXBkYXRlX25vdGlmICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnaW5Cb3gnICkgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBtaW5jb21pbmcubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgTWVzc2FnZScgKyAoIGluZGV4ID09IDEgPyAnJyA6ICdzJyApICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmlkID09PSAnd2FsbFBvc3RzJyApICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gZGF0YS5kYXRhLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IFBvc3QnICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IGRhdGEuZGF0YS5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBOb3RpZmljYXRpb24nICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBjb25zb2xlLmVycm9yKCchISEgY3VycmVudElEICEhIScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTsqLyAgXHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ25ld3NGZWVkJzogdGhpcy5nZXROZXdzRmVlZChcIm5ld3NGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnd2FsbFBvc3RzJzogdGhpcy5nZXROZXdzRmVlZChcIndhbGxQb3N0c1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BhZ2VzRmVlZCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJwYWdlc0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbkJveCc6IHRoaXMuZ2V0RmJDb252ZXJzaW9ucygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGlkZGVuX2dyb3Vwcyc6IHRoaXMuZmlsbEZCSGlkZGVuX0dyb3VwcygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAndGltZWxpbmUnOiB0aGlzLmdldE5ld3NGZWVkKFwidGltZWxpbmVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdzZWFyY2gnOiB0aGlzLmdldE5ld3NGZWVkKFwic2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnb3V0cmVhY2gnOiB0aGlzLmdldE5ld3NGZWVkKFwic2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbm90aWZpY2F0aW9ucyc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJub3RpZmljYXRpb25zXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbGlrZXMnOiB0aGlzLmdldE5ld3NGZWVkKFwiZmJfbGlrZXNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnZmJfbGlrZXMnIHx8IHRoaXMuaWQgPT0gJ291dHJlYWNoJyB8fCAoIHRoaXMuaWQgPT0gJ25ld3NGZWVkJyAmJiAhdGhpcy5uZXh0ICkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy90aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTsgXHJcbiAgICAgICAgICAgIC8vdGhpcy5oaWRlX3B1bGx1cCgpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdkb0ZiUmVxdWVzdCcsXHJcbiAgICAgICAgICAgICAgICB3YWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RyZWFtOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgbmV4dDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnbmV3c0ZlZWQnOlxyXG4gICAgICAgICAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3NlYXJjaCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTsgXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ3dhbGxQb3N0cyc6XHJcbiAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAncGFnZXNGZWVkJzpcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAvLyBjYXNlICdpbkJveCc6XHJcbiAgICAgICAgICAgIC8vICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIikgZGF0YS5uZXh0ID0gJy9pbmJveCc7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgZWxzZSBkYXRhLm5leHQgPSAnL2NvbnZlcnNhdGlvbnMnO1xyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2hpZGRlbl9ncm91cHMnOlxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiBzZWxmLnN0cmVhbS5zZWxlY3RlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBzZWxmLm5leHRcclxuICAgICAgICAgICAgICAgICAgICB9OyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICBcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYl9ub3RpZmljYXRpb25zJzpcclxuICAgICAgICAgICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5zdHJlYW0gPSAnbm90aWZpY2F0aW9ucyc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiTW9yZScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7ICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2luZyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYubmV4dCA9PSBkYXRhLnBhZ2luZy5uZXh0IClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHNlbGYubmV4dCA9IGRhdGEucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZ2V0TmV3c0ZlZWQgPSBmdW5jdGlvbiAoIHN0cmVhbSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogc3RyZWFtLFxyXG4gICAgICAgICAgICBsaW1pdDogMTBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCBzdHJlYW0gPT0gJ3dhbGxQb3N0cycgfHwgc3RyZWFtID09ICdmYl9pbmZsdWVuY2VzJyB8fCBzdHJlYW0gPT0gJ3RpbWVsaW5lJyApIGRhdGEud2FsbCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9uZXdzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc3RyZWFtID09ICdzZWFyY2gnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlID09PSB1bmRlZmluZWQgKSAvL2VtcHR5IHNlYXJjaCBmZWVkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggW10gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeSAhPT0gdW5kZWZpbmVkICYmIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5Lmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2VhcmNoX3JlcXVlc3QoIHNlbGYsIGZ1bmN0aW9uKCBkYXRhIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggW10gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vaWYoIEVDLnF1ZXVlX2xpc3RbIEJhc2U2NC5lbmNvZGUoIEpTT04uc3RyaW5naWZ5KCByZXF1ZXN0ICkgKSBdICE9PSB1bmRlZmluZWQgKSByZXR1cm47XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcXVlc3QpO1xyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5jb2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHN0cmVhbSA9PSAnbm90aWZpY2F0aW9ucycgJiYgb2JqLm1lc3NhZ2UuaW5kZXhPZigneW91IGRvIG5vdCBoYXZlIHN1ZmZpY2llbnQgcGVybWlzc2lvbicpICE9IC0xIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKCc8ZGl2IGNsYXNzPVwiZmVlZC1pdGVtXCI+PGRpdiBjbGFzcz1cImZlZWQtYWxlcnRcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdDbGljayBcIk9LXCIgdG8gYWRkIEZhY2Vib29rIE5vdGlmaWNhdGlvbiBGZWVkLicgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicmVmcmVzaFwiPk9LPC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+PC9kaXY+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQub24oJ2NsaWNrJywgJy5yZWZyZXNoJywgZnVuY3Rpb24gKCBldmVudCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpZCA9IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0eXBlID0gc2VsZi5wcm9maWxlLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3JlZnJlc2ggJywgaWQgKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbmV3XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuQWRkQWNjb3VudFBvcHVwKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dOYW1lOiAnQ29ubmVjdFdpdGhPQXV0aCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93T3B0aW9uczogJ2RpcmVjdG9yaWVzPTAsbG9jYXRpb249MCxzdGF0dXM9MCxtZW51YmFyPTAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6ICdhY2NvdW50L2FjY291bnQ/YWN0aW9uPXNldEV4cGlyZWRLZXlCeUlEJmlkPScgK2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiA2MDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA2NTBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vcmVmcmVzaCBpc2Nyb2xsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZ2V0RmJDb252ZXJzaW9ucyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RmJDb252ZXJzaW9ucycsXHJcbiAgICAgICAgICAgIHN0cmVhbTogJ2luQm94JyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLm5leHQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIpIGRhdGEubmV4dCA9IFwiL2luYm94XCI7XHJcblxyXG4gICAgICAgICAgICBlbHNlIGRhdGEubmV4dCA9IFwiL2NvbnZlcnNhdGlvbnNcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgZGF0YS5uZXh0ID0gdGhpcy5uZXh0O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZmJDb252ZXJzaW9ucycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhICE9PSB1bmRlZmluZWQgJiYgb2JqLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3VyIGluYm94IGlzIGVtcHR5LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vcmVmcmVzaCBpc2Nyb2xsXHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuZmlsbEZCSGlkZGVuX0dyb3VwcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7ICAgXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgbCA9IDA7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRGQkhpZGRlbl9Hcm91cHMnLFxyXG4gICAgICAgICAgICBzdHJlYW06ICdncm91cHMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggIXRoaXMubmV4dCApIGRhdGEubmV4dF9wb3N0cyA9IFwiXCI7XHJcblxyXG4gICAgICAgIGVsc2UgZGF0YS5uZXh0X3Bvc3RzID0gdGhpcy5uZXh0O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZmJIaWRkZW5Hcm91cHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5jb2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgLy9nZXQgZmlyc3QgZ3JvdXAgaWYgbm8gc2VsZWN0ZWRcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgPT0gJ19kZWZhdWx0XycgKS8vJC5pc0VtcHR5T2JqZWN0KCBzZWxmLnN0cmVhbS5zZWxlY3RlZCApICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfaWQgPSBvYmouZGF0YVsgMCBdLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX25hbWUgPSBvYmouZGF0YVsgMCBdLm5hbWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3RyZWFtLnNlbGVjdGVkID0gb2JqLmRhdGFbIDAgXS5pZDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX2lkID0gc2VsZi5zdHJlYW0uc2VsZWN0ZWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGwgPSBvYmouZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxlY3RlZF9pZCA9PSBvYmouZGF0YVsgaSBdLmlkICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX25hbWUgPSBvYmouZGF0YVsgaSBdLm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtdHlwZScpLnRleHQoICdHcm91cDogJyArIHNlbGVjdGVkX25hbWUgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IHNlbGVjdGVkX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJHcm91cCcsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0OiAnJ1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IFwiZmVlZC9mYkdyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5kYXRhICkgKSBpdGVtcyA9IFsgZGF0YS5kYXRhIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGl0ZW1zID0gZGF0YS5kYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBpdGVtcyApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+VGhpcyBncm91cFxcJ3MgZGF0YSBpcyB1bmF2YWlsYWJsZSBhdCB0aGlzIHRpbWUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyBcclxuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbCA9IG9iai5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIHNlbGYuc3RyZWFtLnNlbGVjdGVkLnNwbGl0KCcsJykuaW5kZXhPZiggb2JqLmRhdGFbIGkgXS5pZCApICE9IC0xICkgb2JqLmRhdGFbIGkgXS5zZWxlY3RlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugb2JqLmRhdGFbIGkgXS5zZWxlY3RlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBzZWxmLnN0cmVhbS5zZWxlY3RlZC5zcGxpdCgnLCcpLmluZGV4T2YoICdfZGVmYXVsdF8nICkgIT0gLTEgKSBvYmouZGF0YVsgMCBdLnNlbGVjdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0R3JvdXBJZFswXSAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBvYmouZGVmYXVsdEdyb3VwSWRbMF0gKSApXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBvYmouZGVmYXVsdEdyb3VwSWRbMF07IFxyXG5cclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvYmouZGF0YTo6OicpOyAgIFxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cob2JqLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9KTsgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBsZW5ndGggPT09IDAgKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHZhciBwcmV2X2l0ZW0gPSB0aGlzLml0ZW1zWyBsZW5ndGggLSAxIF0uZGF0YTtcclxuXHJcbiAgICAgICAgaWYgKCBwcmV2X2l0ZW0gPT09IHVuZGVmaW5lZCB8fCBwcmV2X2l0ZW0ubWVkaWEgPT09IHVuZGVmaW5lZCB8fCBkYXRhLm1lZGlhID09PSB1bmRlZmluZWQgKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggcHJldl9pdGVtLm1lZGlhLnR5cGUgPT0gZGF0YS5tZWRpYS50eXBlICYmIHByZXZfaXRlbS5tZWRpYS5ocmVmICE9PSB1bmRlZmluZWQgJiYgZGF0YS5tZWRpYS5ocmVmICE9PSB1bmRlZmluZWQgJiYgcHJldl9pdGVtLm1lZGlhLmhyZWYgPT0gZGF0YS5tZWRpYS5ocmVmICkgXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnU0FNRSBNRURJQScpO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuZGlyKCBwcmV2X2l0ZW0gKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnICYmICF0aGlzLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLml0ZW1zWyAwIF0gIT09IHVuZGVmaW5lZCApIGRhdGEgPSBkYXRhLmNvbmNhdCggdGhpcy5pdGVtc1sgMCBdLmRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnaW5Cb3gnKSBuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0oIGRhdGFbIGkgXSkgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJyAmJiAhdGhpcy5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9IFxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnZmJfbGlrZXMnICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdzZWFyY2hfcmVxdWVzdCcgKSB0aGlzLml0ZW1zLnB1c2goIG5ldyBTZWFyY2hGZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdvdXRyZWFjaCcgKSB0aGlzLml0ZW1zLnB1c2goIG5ldyBTZWFyY2hGZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8tLS0gZm9yIGxpdmUgdXBkYXRlXHJcbiAgICAgICAgICAgIHZhciBtaW5jb21pbmcgPSBbXSwgY3VzZXJJZCA9IHRoaXMucHJvZmlsZS5kYXRhLnBhZ2VJZDtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2RhdGE6Ojo6Ojo6Ojo6OjonKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdpbkJveCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLypmb3IgKCB2YXIgayA9IDAsIGxsID0gbmV3X2ZlZWRfaXRlbS5kYXRhLmNvbW1lbnRzLmNvbW1lbnQubGVuZ3RoOyBrIDwgbGw7IGsrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19jb21tZW50ID0gbmV3X2ZlZWRfaXRlbS5kYXRhLmNvbW1lbnRzLmNvbW1lbnRbIGsgXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2NvbW1lbnQuZnJvbUlkICE9PSBjdXNlcklkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluY29taW5nLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRoaXNfY29tbWVudCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogbmV3IERhdGUoIHRoaXNfY29tbWVudC5jcmVhdGVkVGltZS5zcGxpdCgnKycpWyAwIF0gKS5nZXRUaW1lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfY29tbWVudC5tZXNzYWdlSWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJykgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5zYW1lX21lZGlhX3dpdGhfcHJldl9pdGVtKCBkYXRhWyBpIF0pICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG1pbmNvbWluZy5zb3J0KCBmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA+IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPCBiLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTsgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gZmluZCBsYXRlc3QgaW5jb21pbmdcclxuICAgICAgICAgICAgaWYgKCBtaW5jb21pbmcubGVuZ3RoID4gMCApIHRoaXMuZmlyc3RJdGVtSUQgPSBtaW5jb21pbmdbIDAgXS50aW1lO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB0aGlzLmZpcnN0SXRlbUlEID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRmFjZWJvb2tGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJyR1cmxSb3V0ZXInLCAnRUMnLCAnYXBpVXJsJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgJHVybFJvdXRlciwgRUMsIGFwaVVybCApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZmVlZCA9ICcnOy8vbmV3IEVsZW1lbnQoJyNmZWVkLXRlbXBsYXRlJyk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmVsZW1lbnQgPSBmZWVkLmVsZW1lbnQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5wcm9maWxlID0gcHJvZmlsZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5ldHdvcmsgPSAoIHByb2ZpbGUgPT09IHVuZGVmaW5lZCA/IHN0cmVhbS5uZXR3b3JrIDogcHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc3RyZWFtID0gc3RyZWFtO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmFtZSA9IHN0cmVhbS5uYW1lIHx8IHN0cmVhbS5pZDtcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IHN0cmVhbS5zdHJlYW1JZDtcclxuXHJcbiAgICAgICAgdGhpcy5zaXplID0gc3RyZWFtLnNpemU7XHJcblxyXG4gICAgICAgIHRoaXMuZmF2b3JpdGVkID0gc3RyZWFtLmZhdm9yaXRlZCB8fCBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnZhbHVlID0gc3RyZWFtLnZhbHVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmV4dCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyA8LS0gWyBGZWVkSXRlbSBdXHJcblxyXG4gICAgICAgIHRoaXMubGFzdF9sb2FkZWRfdGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBudWxsO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8qIHByZXBhcmUgcGFnZV9pZCAqL1xyXG4gICAgICAgIHRoaXMucGFnZV9pZCA9ICd0YWJzLicgKyB0aGlzLmdldF9wYWdlX2lkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuZ2V0X3BhZ2VfaWQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpZCA9IHNlbGYuaWQsXHJcbiAgICAgICAgICAgIHByZWZpeCA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZCA9IHNlbGYuaWQgKyAnXycgKyBzZWxmLnByb2ZpbGUuaWQgKyAnXycrIHNlbGYubmV0d29yaztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiggc2VsZi5pZCA9PSAnc2VhcmNoJyB8fCBzZWxmLmlkID09ICdyc3MnIHx8IHNlbGYuaWQgPT0gJ291dHJlYWNoJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZCA9IHNlbGYubmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICdmYXZvcml0ZSc7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnNlYXJjaCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmVmaXggPSAnc2VhcmNoJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5yc3MgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJlZml4ID0gJ3Jzcyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKCB0aGlzLm5ldHdvcmsgPT0gJ2NpbmJveCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSAnY2luYm94JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKCBzZWxmLnByb2ZpbGUgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByZWZpeCA9IHNlbGYucHJvZmlsZS5pZDtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiAocHJlZml4ICsgJy0nICsgaWQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHBhZ2UgPSAnJyxcclxuICAgICAgICAgICAgICAgIGZlZWRfbmFtZSA9IHNlbGYubmFtZTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHNlbGYubmV0d29yayApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhY2Vib29rJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLnBhZ2VOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3aXR0ZXInOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuc3BlY2lmaWVkSGFuZGxlT3JIYXNoVGFnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdsaW5rZWRpbic6IHBhZ2UgPSB0aGlzLnByb2ZpbGUuZGF0YS5wcm9maWxlTmFtZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xpbmtlZGluJzogcGFnZSA9IHNlbGYucHJvZmlsZS51c2VybmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLnVzZXJGaXJzdE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09ICd5dF9teUNoYW5uZWxIb21lJyApIGZlZWRfbmFtZSA9ICdIb21lIC0gQWN0aXZpdGllcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ29vZ2xlcGx1cyc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZS5zcGxpdChcIihcIilbMF07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGludGVyZXN0JzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLmZ1bGxOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiBwYWdlID0gdGhpcy5wcm9maWxlLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gcGFnZSsgJyAtICcgK2ZlZWRfbmFtZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5zZWFyY2ggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICdDdXN0b20gU2VhcmNoIEZlZWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnJzcyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gJ1JTUyBGZWVkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICh0aGlzLm5hbWUpLmluZGV4T2YoJ0ZlZWQnKSA+PSAwID8gdGhpcy5uYW1lOih0aGlzLm5hbWUgKyAnIEZlZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNlbGYucGFnZV90aXRsZSA9IGZlZWRfdGl0bGU7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKHNlbGYucGFnZV9pZCk7XHJcblxyXG4gICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldChzZWxmLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICBpZihnZXRFeGlzdGluZ1N0YXRlID09PSBudWxsKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3BhZ2VfaWQ6OjonK3NlbGYucGFnZV9pZCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgc3RhdGUgPSB7XHJcbiAgICAgICAgICAgICAgXCJ1cmxcIjogJy8nICsgc2VsZi5wYWdlX2lkICsgJzpvYmonLFxyXG4gICAgICAgICAgICAgIGNhY2hlOnRydWUsXHJcbiAgICAgICAgICAgICAgXCJ2aWV3c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAnaG9tZS10YWInOiB7XHJcbiAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9yYW0uaHRtbFwiLFxyXG4gICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIkZlZWRzXCIsXHJcbiAgICAgICAgICAgICAgICAgIHBhcmFtczoge29iajogc2VsZn1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAkc3RhdGVQcm92aWRlclJlZi5zdGF0ZShzZWxmLnBhZ2VfaWQsIHN0YXRlKTtcclxuXHJcbiAgICAgICAgICAgICR1cmxSb3V0ZXIuc3luYygpO1xyXG4gICAgICAgICAgICAkdXJsUm91dGVyLmxpc3RlbigpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3BhZ2VfaWQ6OjowMDAwMCcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhICkgLy8gPC0tIG92ZXJyaWRlXHJcbiAgICB7XHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0gPSBuZXcgRmVlZEl0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApIC8vIDwtLSBvdmVycmlkZVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0gPSBuZXcgRmVlZEl0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuYXBwZW5kX2l0ZW1zID0gZnVuY3Rpb24gKCBhZGRfYWZ0ZXJfaW5kZXggKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgbiA9IHBhcnNlSW50KCBhZGRfYWZ0ZXJfaW5kZXggKSxcclxuICAgICAgICAgICAgLy8kY29udGFpbmVyID0gdGhpcy5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJyksXHJcbiAgICAgICAgICAgIGNvdW50ID0gMDtcclxuICAgICAgIFxyXG5cclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuc2hvd19pdGVtcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdGaW5hbDo6Ojo6Ojo6OicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNlbGYuaXRlbXMpO1xyXG5cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICggcmVtb3ZlX21lc3NhZ2UgKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5oaWRlX3B1bGx1cCA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIEZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSwgRHJvcGRvd25GZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEdvb2dsZVBsdXNGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIFsnZ3BfYWN0aXZpdGllcycsJ2dwX3BhZ2VzX29ubHknLCdncF9wYWdlcyddLmluZGV4T2YoIHN0cmVhbS5zdHJlYW1JZCApICE9PSAtMSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZlZWQgPSB0cnVlOyAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBHb29nbGVQbHVzRmVlZDtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUudXBkYXRlRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBpZF9rZXkgPSAnaWQnLCBcclxuICAgICAgICAgICAgY3VycmVudElEID0gc2VsZi51cGRhdGVJbnRlcnZhbElEO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9nb29nbGVQbHVzU3RyZWFtJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoIHNlbGYuaWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnZ3BfYWN0aXZpdGllcyc6ICAgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9hY3Rpdml0aWVzJzsgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdncF9wYWdlc19vbmx5JzogICByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfb25seV9zdHJlYW0nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWNjb3VudElEID0gc2VsZi5kZWZhdWx0X2VsZW1lbnRfbWV0cmljLmFjY291bnRJRDsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5wcm9maWxlSUQgPSBzZWxmLmRlZmF1bHRfZWxlbWVudF9tZXRyaWMucHJvZmlsZUlEOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRfa2V5ID0gJ3Bvc3RJRCc7IGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXMnOiAgICAgICAgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX3N0cmVhbSc7ICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5hY2NvdW50SUQgPSBzZWxmLmRlZmF1bHRfZWxlbWVudF9tZXRyaWMuYWNjb3VudElEOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnByb2ZpbGVJRCA9IHNlbGYuZGVmYXVsdF9lbGVtZW50X21ldHJpYy5wcm9maWxlSUQ7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZF9rZXkgPSAncG9zdElEJzsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7ICAgICAgXHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjdXBkYXRlRmVlZE5vdGlmaWNhdGlvbignICsgc2VsZi5pZCArICcpIHJlc3BvbnNlOicsICdjb2xvcjpvcmFuZ2VyZWQnKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggY3VycmVudElEID09PSBzZWxmLnVwZGF0ZUludGVydmFsSUQgKSAvLyBkb24ndCByZWZyZXNoIGR1cmluZyByZXF1ZXN0XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBmaXJzdElEID0gJyMjIyc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5maXJzdEl0ZW1JRCApIGZpcnN0SUQgPSBzZWxmLmZpcnN0SXRlbUlEO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdmaXJzdElEIDo6ICcgKyBmaXJzdElEKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICYmIGRhdGEuZGF0YS5sZW5ndGggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuIGl0ZW1bIGlkX2tleSBdO30pLmluZGV4T2YoIGZpcnN0SUQgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAtMSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBmaXJzdElEID09PSAnIyMjJyApIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnaW5kZXggOjogJyArIGluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICRoZWFkZXIgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaGVhZGVyJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRmYm9keSA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkdXBkYXRlX25vdGlmID0gJGZib2R5LmZpbmQoJy51cGRhdGUtbm90aWZpY2F0aW9uJyk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICR1cGRhdGVfbm90aWYubGVuZ3RoID09PSAwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYgPSAkKCc8ZGl2IGNsYXNzPVwidXBkYXRlLW5vdGlmaWNhdGlvblwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmLm9uKCdjbGljaycsIGZ1bmN0aW9uICggZSApeyAkaGVhZGVyLmZpbmQoJy5yZWZyZXNoLWZlZWQnKS50cmlnZ2VyKCdjbGljaycpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGZib2R5LmZpbmQoJy5mZWVkLWl0ZW0nKS5maXJzdCgpLmJlZm9yZSggJHVwZGF0ZV9ub3RpZiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBkYXRhLmRhdGEubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgUG9zdCcgKyAoIGluZGV4ID09PSAxID8gJycgOiAncycgKSApOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBjb25zb2xlLmVycm9yKCchISEgY3VycmVudElEICEhIScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfYWN0aXZpdGllcyc6IHRoaXMuZ2V0R29vZ2xlUGx1c1N0cmVhbShcImdwX2FjdGl2aXRpZXNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlcyc6IHRoaXMuZ2V0UGFnZXMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qY2FzZSAnZ3BfcGVvcGxlQ29ubmVjdGVkJzogdGhpcy5nZXRHb29nbGVQbHVzU3RyZWFtKFwiZ3BfcGVvcGxlQ29ubmVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGVvcGxlVmlzaWJsZSc6IHRoaXMuZ2V0R29vZ2xlUGx1c1N0cmVhbShcImdwX3Blb3BsZVZpc2libGVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhazsqL1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzX29ubHknOiB0aGlzLmdldFBhZ2VzKCB0cnVlICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZ2V0UGFnZXMgPSBmdW5jdGlvbiAoIG9ubHlfcGFnZSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5vYmplY3RUeXBlID09PSAncGFnZScgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcV9kYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgc3RyZWFtOiAnZ3BfcGFnZV9vbmx5X3N0cmVhbSdcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6ICdmZWVkL2dvb2dsZVBsdXNTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogcmVxX2RhdGFcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ2dwX3BhZ2VzJyApIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9zdHJlYW0nO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCcqKioqKioqKioqKioqKioqICBHKyAnK3N0cmVhbSk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmoubmV4dCAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlcj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnByb2ZpbGUuYWNjb3VudC5wcm9maWxlcy5mb3JFYWNoKCBmdW5jdGlvbiggcHJvZmlsZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgJiYgcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgPT09ICdwYWdlJyAmJiBwcm9maWxlLm1vbml0b3JlZCA9PT0gJ29uJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2ZpbGUuZGF0YS5wYWdlX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9maWxlLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBwcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmx5X3BhZ2U6IG9ubHlfcGFnZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTsgXHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICE9PSB1bmRlZmluZWQgJiYgIV8uaXNFbXB0eSggdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQuaW5kZXhPZigneycpID09PSAtMSApIHRoaXMuZGVmYXVsdF9lbGVtZW50ID0gdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0X2dyb3VwcyA9IEpTT04ucGFyc2UoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGVmYXVsdF9ncm91cHNbIHRoaXMuaWQgXSAhPT0gdW5kZWZpbmVkICkgdGhpcy5kZWZhdWx0X2VsZW1lbnQgPSBkZWZhdWx0X2dyb3Vwc1sgdGhpcy5pZCBdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoIGRhdGEgKTsgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZ2V0R29vZ2xlUGx1c1N0cmVhbSA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRHUFN0cmVhbScsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9nb29nbGVQbHVzU3RyZWFtJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCcqKioqKioqKioqKioqKioqICBHKyAnK3N0cmVhbSk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoubmV4dCAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5yZXR1cm5Db2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubmV4dCAgPT09IHVuZGVmaW5lZCB8fCAhdGhpcy5uZXh0ICkge1xyXG4gICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgcmV0dXJuOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRHUFN0cmVhbScsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dCBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZ29vZ2xlUGx1c1N0cmVhbScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdncF9wYWdlcycgKSByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfc3RyZWFtJztcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuaWQgPT09ICdncF9wYWdlc19vbmx5JyApIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9vbmx5X3N0cmVhbSc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7Ly9KU09OLnBhcnNlKCByZXNwICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEubmV4dCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEubmV4dDtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuaGlkZV9wdWxsdXAoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICggdGhpcy5pZCA9PSAnZ3BfcGFnZXMnIHx8IHRoaXMuaWQgPT0gJ2dwX3BhZ2VzX29ubHknICkgJiYgdGhpcy5wcm9maWxlLmRhdGEub2JqZWN0VHlwZSAhPT0gJ3BhZ2UnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtLCB0aGlzX2RhdHVtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT09ICdncF9hY3Rpdml0aWVzJyApIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtX29sZCggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSwgdGhpc19kYXR1bTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT09ICdncF9hY3Rpdml0aWVzJyApIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtX29sZCggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IGRhdGE7XHJcblxyXG4gICAgICAgIHRoaXNfZGF0dW0uZnJvbUlkID0gZGF0YS51c2VyLmZyb21JZDtcclxuICAgICAgICB0aGlzX2RhdHVtLmZyb21OYW1lID0gZGF0YS51c2VyLmZyb21OYW1lO1xyXG4gICAgICAgIHRoaXNfZGF0dW0ucHJvZmlsZUxpbmsgPSBkYXRhLnVzZXIucHJvZmlsZUxpbms7XHJcbiAgICAgICAgdGhpc19kYXR1bS5wcm9maWxlUGljID0gZGF0YS51c2VyLnByb2ZpbGVQaWM7XHJcblxyXG4gICAgICAgIHRoaXNfZGF0dW0udXBkYXRlVGltZSA9IG5ldyBEYXRlKCB0aGlzX2RhdHVtLnVwZGF0ZVRpbWUgKS5nZXRUaW1lKCkgLyAxMDAwO1xyXG5cclxuICAgICAgICBkZWxldGUgdGhpc19kYXR1bS51c2VyO1xyXG5cclxuICAgICAgICAvLyB0YWtlIDEgYXR0YWNobWVudCBmb3Igbm93XHJcbiAgICAgICAgaWYgKCBkYXRhLmF0dGFjaG1lbnRzICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIGRhdGEuYXR0YWNobWVudHMpIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheShkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnQpICkgdGhpc19kYXR1bS5tZWRpYSA9IGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudFsgMCBdO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtLm1lZGlhID0gZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmNvbnRlbnQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICgvXFx3ezh9KC1cXHd7NH0pezN9LVxcd3sxMn0vaSkudGVzdCh0aGlzX2RhdHVtLm1lZGlhLmNvbnRlbnQpICkgdGhpc19kYXR1bS5tZWRpYS5jb250ZW50ID0gJyc7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS50eXBlID09ICdwaG90bycgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlICE9PSB1bmRlZmluZWQgKSB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpc19kYXR1bS5tZWRpYS5pbWFnZSAhPT0gdW5kZWZpbmVkICkgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGRlbGV0ZSB0aGlzX2RhdHVtLm1lZGlhO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpc19kYXR1bS5tZWRpYS50eXBlID09ICd2aWRlbycgJiYgdGhpc19kYXR1bS5tZWRpYS5pbWFnZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS52aWRlbyA9IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X3VybDogdGhpc19kYXR1bS5tZWRpYS5lbWJlZC51cmwgXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0ubWVkaWEudmlkZW8gPSB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV91cmw6IHRoaXNfZGF0dW0ubWVkaWEudXJsIFxyXG4gICAgICAgICAgICAgICAgICAgIH07IFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtX29sZCA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgIGZyb21JZDogZGF0YS51c2VyLmlkLFxyXG4gICAgICAgICAgICBmcm9tTmFtZTogZGF0YS51c2VyLmZ1bGxfbmFtZSxcclxuICAgICAgICAgICAgcHJvZmlsZVBpYzogZGF0YS51c2VyLnByb2ZpbGVfcGljdHVyZSxcclxuICAgICAgICAgICAgcHJvZmlsZUxpbms6IGRhdGEudXNlci5wcm9maWxlX2xpbmssXHJcbiAgICAgICAgICAgIHNlbGZMaW5rOiBkYXRhLnNlbGZMaW5rLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLmNyZWF0ZWRfdGltZSApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS50aXRsZSxcclxuXHJcbiAgICAgICAgICAgIC8vYWN0aXZpdHlUeXBlOiBkYXRhLmFjdGl2aXR5VHlwZSB8fCAnJyxcclxuICAgICAgICAgICAgcmVzaGFyZXJzOiBkYXRhLnJlc2hhcmVycyxcclxuICAgICAgICAgICAgbGlrZXM6IGRhdGEubGlrZXMsIC8vcGx1c29uZXJzXHJcbiAgICAgICAgICAgIGNvbW1lbnRzOiBkYXRhLmNvbW1lbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL21lZGlhOiBkYXRhLmF0dGFjaG1lbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBwb3N0SUQ6IGRhdGEuaWQsIC8vPz8/XHJcbiAgICAgICAgICAgIHJhd19kYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzX2RhdHVtLmNvbW1lbnRzLmNvbW1lbnQgIT09IHVuZGVmaW5lZCAmJiAhQXJyYXkuaXNBcnJheSggdGhpc19kYXR1bS5jb21tZW50cy5jb21tZW50ICkpIFxyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLmNvbW1lbnRzLmNvbW1lbnQgPSBbIHRoaXNfZGF0dW0uY29tbWVudHMuY29tbWVudCBdO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubGlrZXMubGlrZSAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KCB0aGlzX2RhdHVtLmxpa2VzLmxpa2UgKSkgXHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubGlrZXMubGlrZSA9IFsgdGhpc19kYXR1bS5saWtlcy5saWtlIF07XHJcblxyXG4gICAgICAgIC8vIHRha2UgMSBhdHRhY2htZW50IGZvciBub3dcclxuICAgICAgICBpZiAoIGRhdGEuYXR0YWNobWVudHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50KSApIHRoaXNfZGF0dW0ubWVkaWEgPSBkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnRbIDAgXTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bS5tZWRpYSA9IGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudDtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS50eXBlID09ICdwaG90bycgJiYgdGhpc19kYXR1bS5tZWRpYS5mdWxsSW1hZ2UgIT09IHVuZGVmaW5lZCApIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5mdWxsSW1hZ2UudXJsO1xyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAndmlkZW8nICYmIHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5pbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEudmlkZW8gPSB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV91cmw6IHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQudXJsIFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtLm1lZGlhLnZpZGVvID0geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlX3VybDogdGhpc19kYXR1bS5tZWRpYS51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLnVybCBcclxuICAgICAgICAgICAgICAgICAgICB9OyBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07ICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBHb29nbGVQbHVzRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0luc3RhZ3JhbUZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSwgSW5zdGFncmFtRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBJbnN0YWdyYW1GZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEluc3RhZ3JhbUZlZWQ7XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAge1xyXG4gICAgICAgLy8gcmVxdWVzdHMgZGF0YSBhbmQgdGhlbiBjYWxscyB0aGlzLnNhdmVfaXRlbXNcclxuICAgICAgIGlmICggdGhpcy52YWx1ZSA9PSAndHJ1ZScgJiYgIXRoaXMuaW5pdGlhbGl6ZWQgKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB3ZSBhcmUgZGVhbGluZyB3aXRoIHVzZXIgZmVlZCBcclxuICAgICAgICAgICAgICAgY2FzZSAnaWdfZmVlZCc6IHRoaXMuZ2V0SW5zdGFncmFtRmVlZChcInVzZXJGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgIC8vIEluIGNhc2Ugd2UgYXJlIGRlYWxpbmcgd2l0aCBteSBtZWRpYSBmZWVkXHJcbiAgICAgICAgICAgICAgIC8vIGNhc2UgJ2lnTXlNZWRpYSc6IHRoaXMuZ2V0SW5zdGFncmFtRmVlZChcImlnTXlNZWRpYVwiKTtcclxuICAgICAgICAgICAgICAgY2FzZSAnaWdNeU1lZGlhJzogdGhpcy5nZXRJbnN0YWdyYW1GZWVkKFwibXlNZWRpYVwiKTtcclxuICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICB9XHJcbiAgICAgICB9XHJcbiAgICAgICBlbHNlIGlmICggdGhpcy52YWx1ZSA9PSAndHJ1ZScpXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmdldEluc3RhZ3JhbUZlZWQgPSBmdW5jdGlvbiAoIHN0cmVhbSApXHJcbiAgICB7XHJcbiAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgLy9hY3Rpb246ICdnZXROZXdzRmVlZCcsXHJcbiAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICBzdHJlYW06IHN0cmVhbSxcclxuICAgICAgICAgICBuZXh0OiAnJyAvLyBJRCBvZiBsYXN0IGVsZW1lbnQgdGhhdCB3YXMgbG9hZGVkXHJcbiAgICAgICB9O1xyXG5cclxuICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgaWYodGhpcy5uZXh0ID4gMClcclxuICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5uZXh0ID0gdGhpcy5uZXh0O1xyXG4gICAgICAgfVxyXG5cclxuICAgICAgIHZhciBtZXRob2QgPSAnJztcclxuICAgICAgIC8vIGlmIChzdHJlYW0gPT0gJ2lnTXlNZWRpYScpIFxyXG4gICAgICAgaWYgKHN0cmVhbSA9PSAnbXlNZWRpYScpIFxyXG4gICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLmFjdGlvbiA9IFwiZ2V0SW5NeU1lZGlhXCI7IC8vIEFjdGlvbiBmb3IgbXlNZWRpYVxyXG4gICAgICAgICAgICBtZXRob2QgPSAnbXlNZWRpYSc7XHJcbiAgICAgICB9XHJcbiAgICAgICBlbHNlXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluRmVlZFwiOyAvLyBBY3Rpb24gZm9yIHVzZXIgZmVlZCAvIGhvbWUgZmVlZFxyXG4gICAgICAgICAgIG1ldGhvZCA9ICdmZWVkJztcclxuICAgICAgIH1cclxuXHJcbiAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICB1cmw6ICdmZWVkL2luc3RhZ3JhbS8nK21ldGhvZCxcclxuICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICB9O1xyXG5cclxuICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgIHtcclxuICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgIGlmICggb2JqLnBhZ2luYXRpb24gIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmF0aW9uLm5leHRfbWF4X2lkO1xyXG5cclxuICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIC8vYWN0aW9uOiAnZG9GYlJlcXVlc3QnLFxyXG4gICAgICAgICAgICAgICAgLy93YWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgbmV4dDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgIGlmICh0aGlzLmlkID09ICdpZ19mZWVkJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLnN0cmVhbSA9IFwidXNlckZlZWRcIjtcclxuICAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluRmVlZFwiOyAvLyBBY3Rpb24gZm9yIHVzZXIgZmVlZCAvIGhvbWUgZmVlZFxyXG4gICAgICAgICAgICBtZXRob2QgPSAnZmVlZCc7XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLnN0cmVhbSA9IFwibXlNZWRpYVwiO1xyXG4gICAgICAgICAgICBkYXRhLmFjdGlvbiA9IFwiZ2V0SW5NeU1lZGlhXCI7IC8vIEFjdGlvbiBmb3IgbXlNZWRpYVxyXG4gICAgICAgICAgICBtZXRob2QgPSAnbXlNZWRpYSc7XHJcbiAgICAgICAgfSAgICAgICAgXHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiaWQ9XCIrdGhpcy5pZCtcIiBzdHJlYW09XCIrZGF0YS5zdHJlYW0rXCIgbmV4dD1cIit0aGlzLm5leHQrXCIgYWN0aW9uPVwiK2RhdGEuYWN0aW9uKTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2luc3RhZ3JhbS8nK21ldGhvZCxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8kLm1vYmlsZS5hY3RpdmVQYWdlLmNoaWxkcmVuKFwiW2RhdGEtcm9sZT0nZm9vdGVyJ11cIikudG9vbGJhcih7IHRhcFRvZ2dsZTogZmFsc2UgfSk7XHJcbiAgICAgICAgLy8kLm1vYmlsZS5hY3RpdmVQYWdlLmNoaWxkcmVuKFwiW2RhdGEtcm9sZT0nZm9vdGVyJ11cIikuZmFkZU91dCgzMDApO1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLnRvb2xiYXIoeyB0YXBUb2dnbGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLmZhZGVJbigzMDApO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhLmxlbmd0aCA8IDEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLnBhZ2luYXRpb24gPyBkYXRhLnBhZ2luYXRpb24ubmV4dF9tYXhfaWQgOiAnJztcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcbiAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICd1c2VyRmVlZCcpIHtuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO30gICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RyZWFtID0gbXlNZWRpYVxyXG4gICAgICAgICAgICAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgKi9cclxuICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IEluc3RhZ3JhbUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICB9XHJcblxyXG4gICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgSW5zdGFncmFtRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBJbnN0YWdyYW1GZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgQ29sbGFwc2libGVGZWVkSXRlbSA9ICBDb2xsYXBzaWJsZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nKTtcclxuICAgIFxyXG4gICAgZnVuY3Rpb24gTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcblxyXG4gICAgcmV0dXJuIExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdMaW5rZWRpbkZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBMaW5rZWRpbkZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gTGlua2VkaW5GZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGlua2VkaW5GZWVkO1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggdGhpcy5pZCApXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHRoaXMudmFsdWUgKVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRhY3RzJzogdGhpcy5yZXRyaWV2ZUxpbmtlZGluRGF0YSgnZ2V0TE5Db250YWN0cycpOy8vY29uc29sZS5sb2coJ2NvbnRhY3RzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwibmV3c0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbl9jb21wYW5pZXMnOiB0aGlzLmdldExOQ29tcGFuaWVzKCk7Ly9jb25zb2xlLmxvZygnbG5fY29tcGFuaWVzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwid2FsbFBvc3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3JvdXBzJzogdGhpcy5nZXRMTkdyb3VwcygpOyAvL2NvbnNvbGUubG9nKCdncm91cHMnKTsvL3RoaXMuZ2V0TmV3c0ZlZWQoXCJwYWdlc0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbmJveCc6IHRoaXMuZ2V0TE5JbmJveCgpOy8vY29uc29sZS5sb2coJ2luYm94Jyk7Ly90aGlzLmdldExuSW5ib3goKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hvbWUnOiB0aGlzLmdldExOSG9tZSgpOyAvL2NvbnNvbGUubG9nKCdsbmNfaG9tZVdhbGwnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xuY19ob21lV2FsbCc6IHRoaXMucmV0cmlldmVMaW5rZWRpbkRhdGEoJ2dldExOQ21wSG9tZScpOy8vY29uc29sZS5sb2coJ2xuY19ob21lV2FsbCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7IFxyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xuY19wcm9kdWN0cyc6IGNvbnNvbGUubG9nKCdsbmNfcHJvZHVjdHMnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHsgXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8vIGlmKHRoaXMubmV4dD4wKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5DbXBIb21lJyxcclxuICAgICAgICAgICAgICAgICAgICAvL3dhbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZV9pZDogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB0aGlzLm5leHRcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29udGFjdHMnOiBkYXRhLmFjdGlvbiA9ICdnZXRMTkNvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2NvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Db21wYW5pZXMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKVswXS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2NvbXBhbmllcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ3JvdXBzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Hcm91cHMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSAnZ3JvdXBzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW5ib3gnOiBkYXRhLmFjdGlvbiA9ICdnZXRMTkluYm94JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wcm9maWxlX2lkID0gdGhpcy5wcm9maWxlLmRhdGEucHJvZmlsZV9JZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLnN0YXJ0ID09PSBGQUxTRSApIGRhdGEuc3RhcnQgPSAwOyAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdpbmJveCc7IFxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdob21lJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Ib21lJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2hvbWUnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIHVybDogXCJmZWVkL2xpbmtlZEluL1wiK21ldGhvZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRMbkluYm94IG1vcmUgcmVzcG9uc2UnKTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCArPSAyNTsvL2RhdGEudXBkYXRlS2V5O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnRyaWdnZXIoJ2NsaWNrJylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gfSBcclxuICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyB9ICBcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5yZXRyaWV2ZUxpbmtlZGluRGF0YSA9IGZ1bmN0aW9uICggYWN0aW9uICkgLy8gZ2V0TE5DbXBIb21lID0+IGNvbXBhbnkgdXBkYXRlc1xyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVfSWQ6IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVfSWQsXHJcbiAgICAgICAgICAgIHN0YXJ0OiBzZWxmLm5leHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBcclxuICAgICAgICB2YXIgbWV0aG9kID0gJyc7XHJcbiAgICAgICAgc3dpdGNoKCBhY3Rpb24gKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0TE5Db250YWN0cyc6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnbGlua2VkSW4vY29udGFjdHMnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldExOQ21wSG9tZSc6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnbGlua2VkSW4vY29tcGFueUhvbWUnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvJyttZXRob2QsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGFjdGlvbiArJyByZXNwb25zZScpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyppZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkqLyBcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDsvL29iai5kYXRhLnVwZGF0ZUtleTsvL29iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKVxyXG5cclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5Db21wYW5pZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkNvbXBhbmllcycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9jb21wYW5pZXMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSA9PT0gdW5kZWZpbmVkIHx8IG9iai5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouZGVmYXVsdENvbXBhbnlJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0Q29tcGFueUlkWzBdICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIG9iai5kZWZhdWx0Q29tcGFueUlkWzBdICkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRDb21wYW55SWRbIDAgXTsgXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKVxyXG5cclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgLy8gfSAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOR3JvdXBzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IDA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldExOR3JvdXBzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0YXJ0OiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2xpbmtlZEluL2dyb3VwcycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0R3JvdXBJZFswXSAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBvYmouZGVmYXVsdEdyb3VwSWRbMF0gKSApXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBvYmouZGVmYXVsdEdyb3VwSWRbMF07IFxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgICAgXHJcbiAgICAgICAgICAgIC8vIGVsc2VcclxuICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKClcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIC8vIH0gICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7IFxyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5Ib21lID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJtYXRhbiBoZXJlIC0gXCIrdGhpcy5pZCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5kaXIoc2VsZik7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldExOSG9tZScsXHJcbiAgICAgICAgICAgIC8vc3RyZWFtOiAnaW5Cb3gnLFxyXG4gICAgICAgICAgICAvL3Byb2ZpbGVfaWQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9ob21lJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRMTkhvbWUgcmVzcG9uc2UnKVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqIClcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG4gICAgICAgICAgICAvLyBpZiAoIG9iai5kYXRhLmxlbmd0aCA9PSAyNSApXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gc2VsZi5uZXh0ID0gMjU7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5nZXRMTkluYm94ID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkluYm94JyxcclxuICAgICAgICAgICAgLy9zdHJlYW06ICdpbkJveCcsXHJcbiAgICAgICAgICAgIHByb2ZpbGVfaWQ6IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVfSWQsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9pbmJveCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0TG5JbmJveCByZXNwb25zZScpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2dyb3VwcycgfHwgdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaXRlbXNbIDAgXSAhPT0gdW5kZWZpbmVkICkgZGF0YSA9IGRhdGEuY29uY2F0KCB0aGlzLml0ZW1zWyAwIF0uZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vaWYgKCB0aGlzLmlkID09ICdsbl9jb21wYW5pZXMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qZWxzZSovIG5ld19mZWVkX2l0ZW0gPSBuZXcgTGlua2VkaW5GZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnZ3JvdXBzJyB8fCB0aGlzLmlkID09ICdsbl9jb21wYW5pZXMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2lmICggdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApIG5ld19mZWVkX2l0ZW0gPSBuZXcgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKmVsc2UqLyBuZXdfZmVlZF9pdGVtID0gbmV3IExpbmtlZGluRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gTGlua2VkaW5GZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gIFRpbWVsaW5lRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG5cclxuICAgIGZ1bmN0aW9uIExpbmtlZGluRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmtlZGluRmVlZEl0ZW07XHJcbiAgICBcclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzO1xyXG5cclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlckNvbW1lbnQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXJDb21tZW50O1xyXG5cclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLmFkZF9jb21tZW50ID0gZnVuY3Rpb24gKCBtZXNzYWdlLCBkaXJlY3QsIHNoYXJlIClcclxuICAgIHtcclxuXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICByZXR1cm4gTGlua2VkaW5GZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gUGludGVyZXN0RmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGludGVyZXN0RmVlZDtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdwaV9teUFjdGl2aXR5JzogdGhpcy5nZXRNeUFjdGl2aXR5KCk7XHJcbiAgICAgICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaV9ib2FyZCc6IHRoaXMuZ2V0Qm9hcmRzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaV9waW5zJzogdGhpcy5nZXRQaW50ZXJlc3RGZWVkKCB0aGlzLmlkICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaV9saWtlcyc6IHRoaXMuZ2V0UGludGVyZXN0RmVlZCggdGhpcy5pZCApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuZ2V0Qm9hcmRzID0gZnVuY3Rpb24gKCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLCBkYXRhID0gW107XHJcblxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vaWYgKCB3aW5kb3cuZ2xvYmFscy5waUJvYXJkcyAmJiB3aW5kb3cuZ2xvYmFscy5waUJvYXJkcy5pZCA9PT0gdGhpcy5wcm9maWxlLmFjY291bnQuaWQgKSBkYXRhID0gd2luZG93Lmdsb2JhbHMucGlCb2FyZHMuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2Vsc2UgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUuYWNjb3VudC5wcm9maWxlcy5mb3JFYWNoKCBmdW5jdGlvbiggcHJvZmlsZSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgfHwgcHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgIT09ICd1c2VyJyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHByb2ZpbGUuZGF0YS51c2VySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBwcm9maWxlLnVzZXJuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vd2luZG93Lmdsb2JhbHMucGlCb2FyZHMgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICkgKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZDtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YSApO1xyXG4gICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uICggc3RyZWFtLCBwYXJhbWV0ZXJzLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiggc2VsZi5uZXh0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBrZXk6ICdjdXJzb3InLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHNlbGYubmV4dCAgICAgXHJcbiAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgIGtleTogJ2xpbWl0JyxcclxuICAgICAgICAgICAgdmFsdWU6ICcyMCcgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0UGludGVyZXN0RmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbSxcclxuICAgICAgICAgICAgcGFyYW1ldGVyczogcGFyYW1ldGVyc1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9waW50ZXJlc3QnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTsgXHJcbiAgICAgICAgfSk7ICAgICAgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5nZXRQaW50ZXJlc3RGZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgcGFyYW1ldGVycyA9IFtdO1xyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdmaWVsZHMnLFxyXG4gICAgICAgICAgICB2YWx1ZTogJ2lkLGxpbmssdXJsLGNyZWF0b3IsYm9hcmQsY3JlYXRlZF9hdCxub3RlLGNvdW50cyxtZWRpYSxhdHRyaWJ1dGlvbixpbWFnZSxtZXRhZGF0YScgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZWxmLnJlcXVlc3QoIHN0cmVhbSwgcGFyYW1ldGVycywgZnVuY3Rpb24gKCBvYmogKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PT0gJ0ZBSUwnIHx8ICggb2JqLmRhdGEuc3RhdHVzICYmIG9iai5kYXRhLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBwYWdlID0gb2JqLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgaWYgKCBwYWdlICYmIHBhZ2UuY3Vyc29yICkgc2VsZi5uZXh0ID0gcGFnZS5jdXJzb3I7XHJcbiAgICAgICAgICAgIG9iai5kYXRhID0gb2JqLmRhdGEuZGF0YTsgXHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTsgIFxyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoICF0aGlzLm5leHQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzID0gW107XHJcblxyXG4gICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgIGtleTogJ2ZpZWxkcycsXHJcbiAgICAgICAgICAgIHZhbHVlOiAnaWQsbGluayx1cmwsY3JlYXRvcixib2FyZCxjcmVhdGVkX2F0LG5vdGUsY291bnRzLG1lZGlhLGF0dHJpYnV0aW9uLGltYWdlLG1ldGFkYXRhJyAgICAgXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlbGYucmVxdWVzdCggc2VsZi5pZCwgcGFyYW1ldGVycywgZnVuY3Rpb24gKCBvYmogKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PT0gJ0ZBSUwnIHx8ICggb2JqLmRhdGEuc3RhdHVzICYmIG9iai5kYXRhLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYWdlID0gb2JqLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgICAgIGlmICggcGFnZSAmJiBwYWdlLmN1cnNvciApIHNlbGYubmV4dCA9IHBhZ2UuY3Vyc29yO1xyXG4gICAgICAgICAgICAgICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgb2JqLmRhdGEgPSBvYmouZGF0YS5kYXRhOyBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAncGlfYm9hcmQnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICkgKTtcclxuICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyApIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS5ub3RlLC8vIGRhdGEubWVzc2FnZSxcclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuY291bnRzICYmIGRhdGEuY291bnRzLnJlcGlucyApIHRoaXNfZGF0dW0ucmVwaW5zID0gJycgKyBkYXRhLmNvdW50cy5yZXBpbnM7XHJcblxyXG4gICAgICAgIGVsc2UgdGhpc19kYXR1bS5yZXBpbnMgPSAnJztcclxuXHJcbiAgICAgICAgdGhpc19kYXR1bS5saW5rID0gZGF0YS5saW5rO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuY291bnRzICYmIGRhdGEuY291bnRzLmxpa2VzICkgdGhpc19kYXR1bS5saWtlcyA9IHsgY291bnQ6IGRhdGEuY291bnRzLmxpa2VzIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5jb3VudHMgJiYgZGF0YS5jb3VudHMuY29tbWVudHMgKSB0aGlzX2RhdHVtLmNvbW1lbnRzID0geyBjb3VudDogZGF0YS5jb3VudHMuY29tbWVudHMgfTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLnVybCApIHRoaXNfZGF0dW0ucGVybWFsaW5rID0gZGF0YS51cmw7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5pbWFnZSAmJiBkYXRhLmltYWdlLm9yaWdpbmFsIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAncGhvdG8nLFxyXG4gICAgICAgICAgICAgICAgc3JjOiBkYXRhLmltYWdlLm9yaWdpbmFsLnVybFxyXG4gICAgICAgICAgICB9OyAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLm1ldGFkYXRhICYmIGRhdGEubWV0YWRhdGEubGluayAmJiBkYXRhLm1ldGFkYXRhLmxpbmsuZmF2aWNvbiAmJiBkYXRhLm1ldGFkYXRhLmxpbmsuc2l0ZV9uYW1lIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiA9ICc8ZGl2IGNsYXNzPVwicGktZnJvbVwiPjxpbWcgc3JjPVwiJyArIGRhdGEubWV0YWRhdGEubGluay5mYXZpY29uOyBcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uICs9ICdcIiAvPjwvZGl2PmZyb20gJyArIGRhdGEubWV0YWRhdGEubGluay5zaXRlX25hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyAmJiB0aGlzX2RhdHVtLm1lc3NhZ2UgKSB0aGlzX2RhdHVtLm1lc3NhZ2UgPSB0aGlzX2RhdHVtLm1lc3NhZ2UucmVwbGFjZSgnICAgICAgIE1vcmUgICAgICAgJywnJykudHJpbSgpO1xyXG5cclxuICAgICAgICAvLyBpZiAoIGRhdGEuYm9hcmQgIT0gdW5kZWZpbmVkICYmIGRhdGEuYm9hcmQubGVuZ3RoID4gMCApIFxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgaWYgKCB0aGlzLmlkID09ICdwaV9teUFjdGl2aXR5JykgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uID0gJ1Bpbm5lZCBvbnRvOiAnICsgZGF0YS5ib2FyZDtcclxuXHJcbiAgICAgICAgLy8gICAgIGVsc2UgIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiA9ICdQaW5uZWQgZnJvbTogPGEgaHJlZj1cImh0dHA6Ly9waW50ZXJlc3QuY29tL3NvdXJjZS8nICsgZGF0YS5ib2FyZCArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICsgZGF0YS5ib2FyZCArICc8L2E+JztcclxuICAgICAgICAvLyB9IFxyXG5cclxuICAgICAgICAvLyBlbHNlIGlmICggdGhpcy5pZCA9PSAncGlfYm9hcmQnICYmIGRhdGEudXNlcl9uYW1lICE9IHVuZGVmaW5lZCAmJiBkYXRhLnVzZXJfbmFtZSA9PSAnUGlubmVkIGJ5IHBpbm5lcicgKSB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gPSBkYXRhLnVzZXJfbmFtZTsgICAgICBcclxuXHJcbiAgICAgICAgLy8gaWYgKCBkYXRhLmltZyAhPSB1bmRlZmluZWQgJiYgZGF0YS5pbWdbIDAgXSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgdGhpc19kYXR1bS5tZWRpYSA9IHtcclxuICAgICAgICAvLyAgICAgICAgIHR5cGU6ICdwaG90bycsXHJcbiAgICAgICAgLy8gICAgICAgICBzcmM6IGRhdGEuaW1nWyAwIF1cclxuICAgICAgICAvLyAgICAgfTsgICBcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtOyBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuY2hhbmdlUGluQm9hcmQgPSBmdW5jdGlvbiggcHJvZmlsZSwgYWN0aW9uLCBjb21tYW5kLCBwYXJhbWV0ZXJzLCBvYmplY3RfaWQsIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgIGNvbW1hbmQ6IGNvbW1hbmQsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogcHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIG9iamVjdF9pZDogb2JqZWN0X2lkIHx8ICcnLFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiBwYXJhbWV0ZXJzIHx8IFtdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saWtlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggb2JqICk7IFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gUGludGVyZXN0RmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFRpbWVsaW5lRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubGlrZXMgPT09IHVuZGVmaW5lZCApIHRoaXMuZGF0YS5saWtlcyA9IHtjb3VudDogMH07XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhICE9PSB1bmRlZmluZWQgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uID0gdGhpcy5kYXRhLnJhd19kYXRhLmNvbnZlcnNhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29udmVyc2F0aW9uICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb252ZXJzYXRpb24udHdlZXRzICkgKSB0aGlzLmRhdGEuY29udmVyc2F0aW9uLnR3ZWV0cyA9IFsgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbi50d2VldHMgXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWFfY29udGVudCA9PT0gdW5kZWZpbmVkICkgdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRpbWVsaW5lRmVlZEl0ZW07XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0SXRlbU5hbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICByZXR1cm4gc2VsZi5kYXRhLmZyb21OYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5nZXRJdGVtVGltZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHRpbWVzdGFtcCA9IHBhcnNlSW50KCB0aGlzLmRhdGEudXBkYXRlVGltZSApLFxyXG4gICAgICAgICAgICB0aW1lID0gJyc7XHJcblxyXG4gICAgICAgIHZhciBuZXdfZGF0ZSA9IG5ldyBEYXRlKCB0aW1lc3RhbXAgKiAxMDAwICksXHJcbiAgICAgICAgICAgIGRhdGUgPSBuZXdfZGF0ZTsvLy5mb3JtYXQoJ21tbSBkZCwgeXl5eSwgaDpNTXR0Jyk7XHJcblxyXG4gICAgICAgIGlmICggIWlzTmFOKCB0aGlzLmRhdGEudXBkYXRlVGltZSApIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmV2ZW50VHlwZSA9PSAnVFdGb2xsb3dlcnMnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpbWUgPSAnQCcgK3RoaXMuZGF0YS51c2VybmFtZTsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGltZSA9IGRhdGU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrICE9PSAnZmFjZWJvb2snIHx8ICggdGhpcy5mZWVkLmlkICE9ICdzZWFyY2gnICYmIHRoaXMuZmVlZC5pZCAhPT0gJ291dHJlYWNoJyApIHx8ICggdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycyAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMudHlwZSA9PT0gdW5kZWZpbmVkICkgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGltZSA9ICdAJyArdGhpcy5kYXRhLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT0gJ3BhZ2UnIHx8IHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMudHlwZSA9PSAncGxhY2UnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpbWUgPSB0aGlzLmRhdGEuY2F0ZWdvcnk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aW1lO1xyXG4gICAgfTsgXHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0SXRlbVRleHQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgbWVzc2FnZV9odG1sLFxyXG4gICAgICAgICAgICAkdGVtcF9tZXNzYWdlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdyc3MnKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9ICc8YSBocmVmPVwiJyArdGhpcy5kYXRhLmxpbmsrICdcIiBjbGFzcz1cInRpdGxlXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArKCB0aGlzLmRhdGEudGl0bGUgfHwgJycpKyAnPC9hPic7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgZGF0YV9tZXNzYWdlX2h0bWwgPSB0aGlzLmRhdGEubWVzc2FnZTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGRhdGFfbWVzc2FnZV9odG1sID09PSAnc3RyaW5nJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UgPSAkKCc8ZGl2PicpLmh0bWwoIGRhdGFfbWVzc2FnZV9odG1sICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UuZmluZCgnYScpLmF0dHIoJ3RhcmdldCcsJ19ibGFuaycpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciAkaW1hZ2VzID0gJHRlbXBfbWVzc2FnZS5maW5kKCdpbWcnKTtcclxuICAgICAgICAgICAgICAgIGlmICggJGltYWdlcy5sZW5ndGggKSAkaW1hZ2VzLmVhY2goZnVuY3Rpb24oKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkd3JhcHBlciA9ICQoJzxkaXY+JywgeyBjbGFzczogJ3Jzcy1pbWctY2VudGVyJyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkd3JhcHBlci5hcHBlbmQoICQoIHRoaXMgKS5jbG9uZSgpICk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCggdGhpcyApLnJlcGxhY2VXaXRoKCAkd3JhcHBlciApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGF0YV9tZXNzYWdlX2h0bWwgPSAkdGVtcF9tZXNzYWdlLmh0bWwoKTtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCArPSBkYXRhX21lc3NhZ2VfaHRtbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIC8vICsoIHRoaXMuZGF0YS5tZXNzYWdlIHx8ICcnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PT0gJ2dvb2dsZXBsdXMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5tZXNzYWdlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgbWVzc2FnZV9odG1sID09PSAnc3RyaW5nJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UgPSAkKCc8ZGl2PicpLmh0bWwoIG1lc3NhZ2VfaHRtbCApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkdGVtcF9tZXNzYWdlLmZpbmQoJ2EnKS5hdHRyKCd0YXJnZXQnLCdfYmxhbmsnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSAkdGVtcF9tZXNzYWdlLmh0bWwoKTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKHRoaXMuZmVlZC5pZCA9PSAnZmJfbm90aWZpY2F0aW9ucycgfHwgdGhpcy5kYXRhLmV2ZW50VHlwZSA9PSAnRkJDb21tZW50cycgfHwgdGhpcy5kYXRhLmV2ZW50VHlwZSA9PSAnRkJTaGFyZXMnIHx8IHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ0ZCT3RoZXJzJyB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQkxpa2VzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL3VzZXJfbGlrZXMgPT0gdW5yZWFkXHJcbiAgICAgICAgICAgIC8vbWVzc2FnZV9odG1sID0gJzxhIGhyZWY9XCInICt0aGlzLmRhdGEubGluaysgJ1wiIHRhcmdldD1cIl9ibGFua1wiPicgKyggdGhpcy5kYXRhLm1lc3NhZ2UgfHwgJycpKyAnPC9hPic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gdGhpcy5kYXRhLm1lc3NhZ2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5ldmVudFR5cGUgPT09ICdGQkNvbW1lbnRzJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBwb3N0X21lc3NhZ2UgPSAoIHR5cGVvZiB0aGlzLmRhdGEubmFtZSA9PT0gJ3N0cmluZycgJiYgdGhpcy5kYXRhLm5hbWUubGVuZ3RoID8gdGhpcy5kYXRhLm5hbWUgOiAnJyApLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RfY29tbWVudCA9IHsgbWVzc2FnZTonJyB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vaWYgKCBwb3N0X21lc3NhZ2UubGVuZ3RoID4gMTUwICkgcG9zdF9tZXNzYWdlID0gcG9zdF9tZXNzYWdlLnNsaWNlKDAsMTUwKSArICcuLi4nO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29tbWVudHMgJiYgdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQubGVuZ3RoIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50LnNvcnQoZnVuY3Rpb24oYSxiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYS5jcmVhdGVkVGltZSAtIGIuY3JlYXRlZFRpbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0X2NvbW1lbnQgPSB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudFt0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudC5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBsYXN0X2NvbW1lbnQgPSB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudDtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSAnPHNwYW4gY2xhc3M9XCJjb21tZW50LXN1YnRpdGxlXCI+JyArIEVDLnJlcGxhY2VfdHlwZV9pbl91c2VybmFtZSh0aGlzLnByb2ZpbGUudXNlcm5hbWUpICsgJ1xcJ3MgUG9zdDo8L3NwYW4+ICcgKyBcclxuICAgICAgICAgICAgICAgICAgICBwb3N0X21lc3NhZ2UgKyAnPGJyPjxicj48c3BhbiBjbGFzcz1cImNvbW1lbnQtc3VidGl0bGVcIj4nICsgdGhpcy5kYXRhLmZyb21OYW1lICsgJ1xcJ3MgQ29tbWVudDo8L3NwYW4+ICcgKyBsYXN0X2NvbW1lbnQubWVzc2FnZTsgXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHt9IC8vIG9sZCBzdHlsZVxyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnYmxvZ2dlcicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGl0bGUgPSAnJztcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm5hbWUgIT0gdW5kZWZpbmVkICkgdGl0bGUgPSAnPGEgaHJlZj1cIicgK3RoaXMuZGF0YS5wZXJtYWxpbmsrICdcIiBjbGFzcz1cInRpdGxlXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArKCB0aGlzLmRhdGEubmFtZSB8fCAnJykrICc8L2E+JztcclxuXHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRpdGxlICsgKCB0aGlzLmRhdGEubWVzc2FnZSB8fCAnJyk7IFxyXG4gICAgICAgICAgICAvL21lc3NhZ2VfaHRtbCA9IHRpdGxlICsgKCB1cmxfdG9fbGluayggdGhpcy5kYXRhLm1lc3NhZ2UgKSB8fCAnJyk7ICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIHx8IHRoaXMuZGF0YS5ldmVudE5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhLnJldHdlZXRlZF9zdGF0dXMgPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5yYXdfZGF0YS5xdW90ZWRfdHdlZXQgIT0gdW5kZWZpbmVkIFxyXG4gICAgICAgICAgICAgICAgJiYgdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldC5zdHJlYW1FbnRyeSAhPSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldC5zdHJlYW1FbnRyeSApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscyAhPSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLnVybHMgKSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybHMgPSB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJsc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAsZmlyc3RfdXJsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkodXJscykgKSBmaXJzdF91cmwgPSB1cmxzWyAwIF0udXJsO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZmlyc3RfdXJsID0gdXJscy51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5tZXNzYWdlLnJlcGxhY2UoZmlyc3RfdXJsLCAnJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gbWVzc2FnZV9odG1sID0gdGhpcy5kYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy50d19kZWVwX2xpbmtfdG9faHRtbCggdGhpcy5kYXRhLm1lc3NhZ2UsIHRoaXMuZGF0YS5yYXdfZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lc3NhZ2UgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRQb3NpdGlvbihzdHIsIG0sIGkpIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0ci5zcGxpdChtLCBpKS5qb2luKG0pLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHZhciByZXN1bHQgPSBnZXRQb3NpdGlvbih0aGlzLmRhdGEubWVzc2FnZSwgJ2h0dHAnLCAyKSA7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGdldFBvc2l0aW9uKG1lc3NhZ2VfaHRtbCwgJ2h0dHAnLCAyKSA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IG1lc3NhZ2VfaHRtbC5zdWJzdHJpbmcoMCwgcmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcyAmJiB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscyAhPSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLnVybHMgKSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybHMgPSB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscztcclxuICAgICAgICAgICAgICAgICAgICBFQy5mb3JfZWFjaCh1cmxzLCBmdW5jdGlvbiAoIHVybCApIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB1cmwudXJsICYmIHVybC5leHBhbmRlZF91cmwgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBtZXNzYWdlX2h0bWwucmVwbGFjZSh1cmwudXJsLCB1cmwuZXhwYW5kZWRfdXJsKTsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH0pOyAgXHJcbiAgICAgICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YS5kZXNjcmlwdGlvbiAmJiAoIHNlbGYuZmVlZC5pZCA9PSAndHdGcmllbmRzJyB8fCBzZWxmLmZlZWQuaWQgPT0gJ3R3Rm9sbG93ZXJzJyB8fCBzZWxmLmRhdGEuZXZlbnRUeXBlID09ICdUV0ZvbGxvd2VycydcclxuICAgICAgICAgICAgICAgICAgICB8fCAoICggc2VsZi5mZWVkLmlkID09ICdzZWFyY2gnIHx8IHNlbGYuZmVlZC5pZCA9PSAnb3V0cmVhY2gnICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIHNlbGYuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMudHlwZSA9PSAndXNlcnMnICkgKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5yYXdfZGF0YS5kZXNjcmlwdGlvbjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEuZXZlbnRUeXBlID09ICdUV0ZvbGxvd2VycycgKSBtZXNzYWdlX2h0bWwgKz0gJyA8c3BhbiBjbGFzcz1cInZpZXctZm9sbG93ZXJcIj5WaWV3ICcgKyBzZWxmLmRhdGEuZnJvbU5hbWUgKyAnIHByb2ZpbGU8L3NwYW4+JzsgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy51cmxfdG9fbGluayggbWVzc2FnZV9odG1sICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIG1lc3NhZ2VfaHRtbCA9IEVDLnVybF90b19saW5rKCB0aGlzLmRhdGEubWVzc2FnZSApO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdyc3MnICYmIHR5cGVvZiBtZXNzYWdlX2h0bWwgPT0gJ3N0cmluZycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBtZXNzYWdlX2h0bWxcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC93aWR0aD0vZ2ksICdkYXRhLXc9JylcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9oZWlnaHQ9L2dpLCAnZGF0YS1oPScpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvbWFyZ2luL2dpLCAnZGF0YS1tJylcclxuICAgICAgICAgICAgICAgIC8vIC5yZXBsYWNlKC9tYXJnaW4tbGVmdD0vZ2ksICdkYXRhLW0tbD0nKVxyXG4gICAgICAgICAgICAgICAgLy8gLnJlcGxhY2UoL21hcmdpbi1yaWdodD0vZ2ksICdkYXRhLW0tcj0nKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL2EgaHJlZi9naSwgJ2EgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZicpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvPGJyXFxzKltcXC9dPz4vZ2ksICc8c3Bhbj48L3NwYW4+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAndHdpdHRlcicgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IEVDLnR3X3VzZXJfbWVudGlvbnNfdG9fbGlua3MoIG1lc3NhZ2VfaHRtbCwgdGhpcy5kYXRhLnJhd19kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy5oYXNodGFnX3RvX2xpbmsoIG1lc3NhZ2VfaHRtbCwgJ3R3aXR0ZXInICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2xpbmtlZGluJyApIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS50aXRsZSArIHRoaXMuZGF0YS5wcmVfc3VtbWFyeSArIG1lc3NhZ2VfaHRtbDtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2ZhY2Vib29rJyAmJiB0aGlzLmZlZWQuaWQgIT09ICdmYl9ub3RpZmljYXRpb25zJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgc3RvcnlfaHRtbDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9ICQoXCI8ZGl2IC8+XCIpLmh0bWwoIHRoaXMuZGF0YS5tZXNzYWdlICkudGV4dCgpOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnN0b3J5ICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLnN0b3J5Lmxlbmd0aCA+IDAgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCB0aGlzLmRhdGEuc3RvcnkuaW5kZXhPZignWW91IGFkZGVkICcpID09IC0xIClcclxuICAgICAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9yeV9odG1sID0gJChcIjxkaXYgLz5cIikuaHRtbCggdGhpcy5kYXRhLnN0b3J5ICkudGV4dCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5zdG9yeVRhZ3MgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEuc3RvcnlUYWdzLnN0b3J5VGFnICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yeV9odG1sID0gRUMuZmJfdGFnc190b19saW5rcyggc3RvcnlfaHRtbCwgdGhpcy5kYXRhLnN0b3J5VGFncy5zdG9yeVRhZywgJ3N0b3J5JyApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcnlfaHRtbCA9IEVDLnVybF90b19saW5rKCBzdG9yeV9odG1sICk7XHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lc3NhZ2VUYWdzICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lc3NhZ2VUYWdzLm1lc3NhZ2VUYWcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy5mYl90YWdzX3RvX2xpbmtzKCBtZXNzYWdlX2h0bWwsIHRoaXMuZGF0YS5tZXNzYWdlVGFncy5tZXNzYWdlVGFnLCAnbWVzc2FnZScgKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gRUMudXJsX3RvX2xpbmsoIG1lc3NhZ2VfaHRtbCApO1xyXG5cclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gRUMuaGFzaHRhZ190b19saW5rKCBtZXNzYWdlX2h0bWwsICdmYWNlYm9vaycpO1xyXG5cclxuICAgICAgICAgICAgaWYoIHN0b3J5X2h0bWwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKCBtZXNzYWdlX2h0bWwubGVuZ3RoID4gMCApIHN0b3J5X2h0bWwgPSAnPHA+JyArIHN0b3J5X2h0bWwgKyAnPC9wPic7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gc3RvcnlfaHRtbCArIG1lc3NhZ2VfaHRtbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5pZCA9PSAnY2luYm94JyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gJ1lvdSBoYXZlIGEgY29tbWVudCBoZXJlJztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb21tZW50cyAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50ICE9PSB1bmRlZmluZWQgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudCApICkgdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgPSBbIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50IF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudC5sZW5ndGggPiAwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UgPSAkKCc8ZGl2PicpLmh0bWwoIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50WyAwIF0ubWVzc2FnZSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGVtcF9tZXNzYWdlLmZpbmQoJ2EnKS5hdHRyKCd0YXJnZXQnLCdfYmxhbmsnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvcmlnX21lc3NhZ2UgPSB0aGlzLmRhdGEubWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2Ygb3JpZ19tZXNzYWdlID09PSAnc3RyaW5nJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkdGVtcF9tZXNzYWdlMiA9ICQoJzxkaXY+JykuaHRtbCggb3JpZ19tZXNzYWdlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UyLmZpbmQoJ2EnKS5hdHRyKCd0YXJnZXQnLCdfYmxhbmsnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnX21lc3NhZ2UgPSAkdGVtcF9tZXNzYWdlMi5odG1sKCk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9ICAgJzxzcGFuIGNsYXNzPVwiY29tbWVudC1zdWJ0aXRsZVwiPicgKyBFQy5yZXBsYWNlX3R5cGVfaW5fdXNlcm5hbWUodGhpcy5wcm9maWxlLnVzZXJuYW1lKSArICdcXCdzIFBvc3Q6PC9zcGFuPiAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgKz0gIG9yaWdfbWVzc2FnZSArICc8YnI+PGJyPjxzcGFuIGNsYXNzPVwiY29tbWVudC1zdWJ0aXRsZVwiPicgKyB0aGlzLmRhdGEuZnJvbU5hbWUgKyAnXFwncyBDb21tZW50Ojwvc3Bhbj4gJyArICR0ZW1wX21lc3NhZ2UuaHRtbCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAvL3JlbmRlcl90YWdfaXRfYnV0dG9uKCBzZWxmLmRhdGEsICR0aGlzLCAkdGhpcy5maW5kKCcuaXRlbS10ZXh0JyksIHNlbGYuZGF0YS5ldmVudFRpbWUgKTsgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lc3NhZ2VfaHRtbCA9IG1lc3NhZ2VfaHRtbC5yZXBsYWNlKC9eXFxzXFxzKi8sICcnKS5yZXBsYWNlKC9cXHNcXHMqJC8sICcnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2VfaHRtbDtcclxuICAgICAgICBcclxuICAgICAgICAvL3RoZW4gcmVuZGVyX3RhZ19pdF9idXR0b25cclxuICAgIH07XHJcbiAgICBcclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldEl0ZW1NZWRpYSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGV4dF9lbGVtZW50LCBpdGVtTWVkaWE7XHJcbiAgICAgICAgdmFyIHNsaWRlcl9pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIHNlbGYuZGF0YS5tZWRpYSApICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IHNlbGYuZmVlZC5pZDtcclxuICAgICAgICAgICAgdmFyIGl0ZW1faWQgPSAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJyA/IHNlbGYuZGF0YS5wb3N0SUQgOiBzZWxmLmRhdGEuaWQgKTtcclxuICAgICAgICAgICAgdmFyIGFsdCA9ICQuaXNFbXB0eU9iamVjdCggc2VsZi5kYXRhLm1lZGlhWyAwIF0uYWx0ICkgPyBcIlwiIDogc2VsZi5kYXRhLm1lZGlhWyAwIF0uYWx0O1xyXG4gICAgICAgICAgICB2YXIgaW1hZ2VBcnJheSA9ICcnO1xyXG4gICAgICAgICAgICB2YXIgbmF2RG90cyA9IFwiXCI7XHJcbiAgICAgICAgICAgIHZhciBidG5OYW1lID0gXCJidG4tXCIgKyB0eXBlICsgXCJfXCIgKyBpdGVtX2lkO1xyXG5cclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLm1lZGlhLmxlbmd0aDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlRWwgPSB0aGlzLmRhdGEubWVkaWFbIGkgXTtcclxuICAgICAgICAgICAgICAgIHZhciB1cmxfbiA9IEVDLkZCX3RodW1ibmFpbF90b19mdWxsX3NpemUoIGltYWdlRWwuc3JjICk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycklkID0gXCJpbWctXCIgKyB0eXBlICsgXCJfXCIgKyBpdGVtX2lkICsgXCJfXCIgKyBpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJEb3RJZCA9IFwiaW1nLWRvdC1cIiArIGk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJldklkID0gXCJpbWctXCIgKyB0eXBlICsgXCJfXCIgKyBpdGVtX2lkICsgXCJfXCIgKyAoIGkgPT0gMCA/IHRoaXMuZGF0YS5tZWRpYS5sZW5ndGggLSAxIDogaSAtIDEgKTtcclxuICAgICAgICAgICAgICAgIHZhciBuZXh0SWQgPSBcImltZy1cIiArIHR5cGUgKyBcIl9cIiArIGl0ZW1faWQgKyBcIl9cIiArICggaSA9PSAoIHRoaXMuZGF0YS5tZWRpYS5sZW5ndGggLSAxICkgPyAwIDogaSArIDEgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZmFjZWJvb2snICYmIGkgPT0gKHRoaXMuZGF0YS5tZWRpYS5sZW5ndGggLSAxKSApXHJcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VBcnJheSA9IFwiPGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIHVybF9uICsgXCInID5cIjtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBpID09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlQXJyYXkgPSBcIjxpbWcgY2xhc3M9XFxcImZ1bGwtaW1hZ2VcXFwiIHNyYz0nXCIgKyB1cmxfbiArIFwiJyA+XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2ZhY2Vib29rJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGltYWdlQXJyYXkgPSAnPHNwYW4gY2xhc3M9XCJwcmV2XCI+PC9zcGFuPicraW1hZ2VBcnJheSsnPHNwYW4gY2xhc3M9XCJuZXh0XCI+PC9zcGFuPic7XHJcblxyXG4gICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoaW1hZ2VBcnJheSk7XHJcbiAgICAgICAgICAgIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7b3BlblBob3RvU3dpcGUoIHNsaWRlcl9pdGVtcyApO30gKTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgdGhpcy5kYXRhLm1lZGlhID09ICdvYmplY3QnICYmIHRoaXMuZGF0YS5tZWRpYS50eXBlICE9ICd1bmF2YWlsYWJsZScgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGFsdCA9IHRoaXMuZGF0YS5tZWRpYS5hbHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09PSAnZmFjZWJvb2snICYmIHR5cGVvZiB0aGlzLmRhdGEucGljdHVyZSA9PT0gJ3N0cmluZycgKSB0aGlzLmRhdGEubWVkaWEuc3JjID0gdGhpcy5kYXRhLnBpY3R1cmU7XHJcblxyXG4gICAgICAgICAgICBpZih0aGlzLmRhdGEubWVkaWEudHlwZT09XCJwaG90b1wiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXJsX24gPSBFQy5GQl90aHVtYm5haWxfdG9fZnVsbF9zaXplKCB0aGlzLmRhdGEubWVkaWEuc3JjICksXHJcbiAgICAgICAgICAgICAgICAgICAgc3R1ZmYgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiAhPSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gKSApIHN0dWZmID0gdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGF0YS5jYXB0aW9uICE9IHVuZGVmaW5lZCApIHN0dWZmID0gdGhpcy5kYXRhLmNhcHRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmRhdGEubWVkaWEuYWx0ICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuYWx0ICE9IHRoaXMuZGF0YS5tZXNzYWdlICkgc3R1ZmYgPSB0aGlzLmRhdGEubWVkaWEuYWx0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggLyp0aGlzLmZlZWQuaWQgIT0gJ3BpX2JvYXJkJyovdGhpcy5mZWVkLm5ldHdvcmsgIT0gJ3BpbnRlcmVzdCcgKSBzdHVmZiA9IEVDLnJlcGxhY2VVUkxXaXRoSFRNTExpbmtzKCBzdHVmZiApO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtZXRhX2luZm8gPSAnJztcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnICkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyA9IFwiPGEgY2xhc3M9J3BoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGluaycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgdGhpcy5kYXRhLmNoYW5uZWxMaW5rICsgXCInKTtcXFwiID5cIiArIHRoaXMuZGF0YS5jaGFubmVsVGl0bGUgKyBcIjwvYT5cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3BpbnRlcmVzdCcgJiYgdGhpcy5kYXRhLmxpbmsgJiYgdGhpcy5kYXRhLnJhd19kYXRhLm1ldGFkYXRhLmxpbmsgJiYgdGhpcy5kYXRhLnJhd19kYXRhLm1ldGFkYXRhLmxpbmsudGl0bGUgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyA9IFwiPGEgY2xhc3M9J3BoX2xpbmsnIGhyZWY9J2phdmFzY3JpcHQ6OycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgdGhpcy5kYXRhLmxpbmsgKyBcIicpO1xcXCI+XCIgKyB0aGlzLmRhdGEucmF3X2RhdGEubWV0YWRhdGEubGluay50aXRsZSArIFwiPC9hPlwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIHx8IHRoaXMuZGF0YS5ldmVudE5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3BfaW1nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybCAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncF9pbWcgPSB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybDsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEubWVkaWEuaW1hZ2UgIT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmwgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3BfaW1nID0gdGhpcy5kYXRhLm1lZGlhLmltYWdlLnVybDsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQgIT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICkgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBncF9pbWcgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmJfaW1hZ2UnPjxpbWcgY2xhc3M9XFxcImZ1bGwtaW1hZ2VcXFwiIHNyYz0nXCIgKyBncF9pbWcgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cIjxhIGNsYXNzPSdwaF9saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyBncF9pbWcgKyBcIicpO1xcXCIgPlwiICsgKCB0aGlzLmRhdGEubWVkaWEuZGlzcGxheU5hbWUgfHwgJycgKSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+XCIgKyBzdHVmZiArIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7ICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMucHVzaCh7J3NyYyc6Z3BfaW1nLCB3Ojk2NCwgaDoxMDI0fSk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZiX2ltYWdlJz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdXJsX24gKyBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj48ZGl2IGNsYXNzPSdwYWRscjEwJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YV9pbmZvICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+XCIgKyBzdHVmZiArIFwiPC9kaXY+PC9kaXY+XCIvLytcclxuICAgICAgICAgICAgICAgICAgICAvLyBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+XCIgKyB0aGlzLmRhdGEubWVzc2FnZSArIFwiPC9kaXY+XCIvLytcclxuICAgICAgICAgICAgICAgICAgICAvLyBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+PGRpdiBjbGFzcz0nZmxhc2gnPlwiKyggdXJsX3RvX2xpbmsoIHRoaXMuZGF0YS5tZXNzYWdlICkubGVuZ3RoICsnIDogOiAnKyBzdHVmZi5sZW5ndGggKStcIjwvZGl2PjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7IFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8uY3NzKHtcImZvbnQtc2l6ZVwiOlwiMTBweFwifSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZih0aGlzLmRhdGEubWVkaWEudHlwZT09XCJ2aWRlb1wiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3R1ZmYgPSAoIEVDLnJlcGxhY2VVUkxXaXRoSFRNTExpbmtzKCB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiA9PSB1bmRlZmluZWQgPyAodGhpcy5kYXRhLmNhcHRpb24gPT0gdW5kZWZpbmVkID8gKHRoaXMuZGF0YS5tZWRpYS5hbHQgPT0gdGhpcy5kYXRhLm1lc3NhZ2UgPyAnJyA6IHRoaXMuZGF0YS5tZWRpYS5hbHQpIDogdGhpcy5kYXRhLmNhcHRpb24gKSA6IHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uICkgfHwgJycpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBsaW5rX3RleHQgPSAnV2F0Y2ggdmlkZW8nO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1ldGFfaW5mbyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtfdGV4dCA9IHRoaXMuZGF0YS5tZWRpYS50aXRsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJ5X2NoYW5uZWwgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jaGFubmVsSWQgIT0gdGhpcy5kYXRhLmZyb21JZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnlfY2hhbm5lbCA9ICc8bGk+YnkgPGEgY2xhc3M9XCJ5dC11c2VyLW5hbWVcIiBocmFmPVwiamF2YXNjcmlwdDo7XCIgb25DbGljaz1cIkVDLlVJLklBQihcXCcnICsgdGhpcy5kYXRhLmNoYW5uZWxMaW5rICsgJ1xcJyk7XCIgPicgKyB0aGlzLmRhdGEuY2hhbm5lbFRpdGxlICsgJzwvYT48L2xpPic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZXRhX2luZm8gPSAnPGEgY2xhc3M9XCJwaF9saW5rIGZvbnQtd2VpZ2h0IG1hci00IHVpLWxpbmtcIiBocmVmPVwiamF2YXNjcmlwdDpyYW07XCI+JyArIGxpbmtfdGV4dCArICc8L2E+PHVsIGNsYXNzPVwieXQtbWV0YS1pbmZvIHVpLWdyaWQtc29sb1wiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBieV9jaGFubmVsICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT4nICsgIG5ldyBEYXRlKCB0aGlzLmRhdGEubWVkaWEudXBsb2FkRGF0ZSApLmZvcm1hdCgnbW1tIGRkLCB5eXl5JykgKyAnPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT4mbmJzcDsmbmJzcDsnICsgdGhpcy5kYXRhLnZpZXdzLmNvdW50ICsgJyB2aWV3czwvbGk+JyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC91bD4nO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuY29udGVudCAhPSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQgKSApIHN0dWZmID0gdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQ7ICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyA9ICc8YSBjbGFzcz1cInBoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGlua1wiIGhyZWY9XCIjXCI+JyArICggdGhpcy5kYXRhLm1lZGlhLmRpc3BsYXlOYW1lIHx8ICdXYXRjaCB2aWRlbycgKSArICc8L2E+JztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYSAhPSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lZGlhLnZpZGVvICE9IHVuZGVmaW5lZCApIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3VpLWdyaWQtc29sbyBsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltZ19ib3ggdmlkZW8gdWktZ3JpZC1zb2xvIHBvc2l0aW9uLXJlbGF0aXZlJz48aW1nIGNsYXNzPVxcXCJ2aWRlby1idXR0b25cXFwiIHNyYz1cXFwiaW1nL3BsYXktYnV0dG9uLnBuZ1xcXCI+PGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIHRoaXMuZGF0YS5tZWRpYS5zcmMucmVwbGFjZSgnRmRlZmF1bHQnLCAnRmhxZGVmYXVsdCcpLnJlcGxhY2UoJy9kZWZhdWx0JywgJy9ocWRlZmF1bHQnKSArIFwiJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+PGRpdiBjbGFzcz0ncGFkbHIxMCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIC8vXCI8YSBjbGFzcz0ncGhfbGluaycgaHJlZj0nIyc+XCIgKyBsaW5rX3RleHQgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YV9pbmZvICsgXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgdmlkZW8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxhIGNsYXNzPSd2aWRlb19saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uY2xpY2s9XFxcIkVDLlVJLklBQignXCIrdGhpcy5kYXRhLm1lZGlhLnZpZGVvLmRpc3BsYXlfdXJsK1wiJyk7XFxcIj5WaWRlbyBsaW5rPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEudmlkZW8gIT0gdW5kZWZpbmVkICkgZXh0X2VsZW1lbnQub24oJ2NsaWNrJyxmdW5jdGlvbiAoIGV2ZW50IClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggc2VsZiApXHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgRUMuVUkuSUFCKGVuY29kZVVSSShzZWxmLmRhdGEubWVkaWEudmlkZW8uZGlzcGxheV91cmwrJz9hdXRvcGxheT0xJyksICcnLCAnX3N5c3RlbScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vd2luZG93Lm9wZW4oIGVuY29kZVVSSShzZWxmLmRhdGEubWVkaWEudmlkZW8uc291cmNlX3VybC5yZXBsYWNlKCdodHRwOi8vJywnaHR0cHM6Ly8nKSApLCdfc3lzdGVtJywnbG9jYXRpb249eWVzJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy92YXIgbWVkaWFPYmplY3QgPSAnPGlmcmFtZSBzcmM9XCInK3NlbGYuZGF0YS5tZWRpYS52aWRlby5zb3VyY2VfdXJsLnJlcGxhY2UoJ2h0dHA6Ly8nLCdodHRwczovLycpKydcIiB3aWR0aD1cIjEyODBcIiBoZWlnaHQ9XCI3MjBcIiBmcmFtZWJvcmRlcj1cIjBcIj48L2lmcmFtZT4nO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcG9zdF9tYW5hZ2VyLndhdGNoUGljdHVyZVZpZGVvKG1lZGlhT2JqZWN0LCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEudmlkZW8gIT0gdW5kZWZpbmVkICkgZXh0X2VsZW1lbnQub24oJ2NsaWNrJywgJy55dC11c2VyLW5hbWUnICxmdW5jdGlvbiAoIGV2ZW50IClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHRoaXMuZGF0YS5tZWRpYS50eXBlPT1cImFydGljbGVcIiYmKHRoaXMuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyB8fCB0aGlzLmRhdGEuZXZlbnROZXR3b3JrID09ICdnb29nbGVwbHVzJykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdHVmZiA9ICcnLCB1cmxfbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICE9IHVuZGVmaW5lZCAmJiAhJC5pc0VtcHR5T2JqZWN0KCB0aGlzLmRhdGEubWVkaWEuY29udGVudCApICkgc3R1ZmYgPSB0aGlzLmRhdGEubWVkaWEuY29udGVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybCAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybF9uID0gdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZS51cmw7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEubWVkaWEuaW1hZ2UgIT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmwgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmxfbiA9IHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmw7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdXJsX24gIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndWktZ3JpZC1zb2xvIGxfbWVzc2FnZSc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltZ19ib3ggdWktZ3JpZC1zb2xvIHBvc2l0aW9uLXJlbGF0aXZlJz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdXJsX24gKyBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+PGRpdiBjbGFzcz0ncGFkbHIxMCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxhIGNsYXNzPSdwaF9saW5rIGZvbnQtd2VpZ2h0IG1hci00IHVpLWxpbmsnIGhyZWY9J2phdmFzY3JpcHQ6Oycgb25DbGljaz1cXFwiRUMuVUkuSUFCKCdcIiArIHRoaXMuZGF0YS5tZWRpYS51cmwgKyBcIicpO1xcXCIgPlwiICsgKCB0aGlzLmRhdGEubWVkaWEuZGlzcGxheU5hbWUgfHwgJycgKSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgbWVkaWEnPlwiICsgc3R1ZmYgKyBcIjwvZGl2PjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYodGhpcy5kYXRhLm1lZGlhLnR5cGU9PT0nYW5pbWF0ZWRfaW1hZ2Vfc2hhcmUnICYmIHRoaXMuZmVlZC5uZXR3b3JrID09PSAnZmFjZWJvb2snKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXJsX24gPSB0aGlzLmRhdGEubGlua1xyXG4gICAgICAgICAgICAgICAgICAgICxzdHVmZiA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgLG07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmUgPSAvdXJsPVteJiNdKi9pXHJcbiAgICAgICAgICAgICAgICAvLyAgLHVybF9uID0gdGhpcy5kYXRhLm1lZGlhLnNyY1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmICggKG0gPSByZS5leGVjKCB1cmxfbiApKSAhPT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdXJsX24gPSBkZWNvZGVVUklDb21wb25lbnQoIG1bIDAgXS5yZXBsYWNlKCd1cmw9JywnJykgKTtcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmYl9pbWFnZSc+PGltZyBzcmM9J1wiICsgdXJsX24gKyBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICApOyAgXHJcblxyXG4gICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICBpZigkLmlzRW1wdHlPYmplY3QodGhpcy5kYXRhLm1lZGlhLnNyYykpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0dWZmID0gKCBFQy5yZXBsYWNlVVJMV2l0aEhUTUxMaW5rcyggdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gPT0gdW5kZWZpbmVkID8gKHRoaXMuZGF0YS5jYXB0aW9uID09IHVuZGVmaW5lZCA/ICh0aGlzLmRhdGEubWVkaWEuYWx0ICE9IHRoaXMuZGF0YS5tZXNzYWdlID8gJycgOiB0aGlzLmRhdGEubWVkaWEuYWx0KSA6IHRoaXMuZGF0YS5jYXB0aW9uICkgOiB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiApIHx8ICcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3BfaW1nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZSAhPSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZS51cmwgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncF9pbWcgPSB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybDsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGF0YS5tZWRpYS5pbWFnZSAhPSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lZGlhLmltYWdlLnVybCAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwX2ltZyA9IHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmw7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQgIT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICkgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZ3BfaW1nICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZiX2ltYWdlJz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgZ3BfaW1nICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiJyA+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXCI8YSBjbGFzcz0ncGhfbGluayBmb250LXdlaWdodCBtYXItNCB1aS1saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyBncF9pbWcgKyBcIicpO1xcXCIgPlwiICsgKCB0aGlzLmRhdGEubWVkaWEuZGlzcGxheU5hbWUgfHwgJycgKSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTsgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMucHVzaCh7J3NyYyc6Z3BfaW1nLCB3Ojk2NCwgaDoxMDI0fSk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdsX21lc3NhZ2UgdWktZ3JpZC1zb2xvJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3BhZGxyMTAnPjxhIGNsYXNzPSdwaF9saW5rIGZvbnQtd2VpZ2h0IG1hci00IHVpLWxpbmsnIGhyZWY9J2phdmFzY3JpcHQ6Oycgb25DbGljaz1cXFwiRUMuVUkuSUFCKCdcIiArIHRoaXMuZGF0YS5tZWRpYS5ocmVmICsgXCInKTtcXFwiPlwiICsgdGhpcy5kYXRhLm1lZGlhLmhyZWYgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCc+XCIgKyBzdHVmZiArIFwiPC9kaXY+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFQy5VSS5JQUIoIGVuY29kZVVSSSggdGhpcy5kYXRhLm1lZGlhLmhyZWYgKSwnJywnX3N5c3RlbScpOyAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHVmZiA9ICggRUMucmVwbGFjZVVSTFdpdGhIVE1MTGlua3MoIHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uID09IHVuZGVmaW5lZCA/ICh0aGlzLmRhdGEuY2FwdGlvbiA9PSB1bmRlZmluZWQgPyAodGhpcy5kYXRhLm1lZGlhLmFsdCAhPSB0aGlzLmRhdGEubWVzc2FnZSA/ICcnIDogdGhpcy5kYXRhLm1lZGlhLmFsdCkgOiB0aGlzLmRhdGEuY2FwdGlvbiApIDogdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gKSB8fCAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2xfbWVzc2FnZSB1aS1ncmlkLXNvbG8nPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94Jz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdGhpcy5kYXRhLm1lZGlhLnNyYyArIFwiJyA+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj48ZGl2IGNsYXNzPSdwYWRscjEwJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGEgY2xhc3M9J3BoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGluaycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgdGhpcy5kYXRhLm1lZGlhLmhyZWYgKyBcIicpO1xcXCI+XCIgKyAoIHRoaXMuZGF0YS5uYW1lIHx8ICcnICkgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZ3JheV90ZXh0IG1lZGlhJz5cIiArIHN0dWZmICsgXCI8L2Rpdj48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMucHVzaCh7J3NyYyc6dGhpcy5kYXRhLm1lZGlhLnNyYywgdzo5NjQsIGg6MTAyNH0pOyBcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gdmFyIHNyYyA9IEZCX3RodW1ibmFpbF90b19mdWxsX3NpemUoIHRoaXMuZGF0YS5tZWRpYS5zcmMgKTtcclxuXHJcbiAgICAgICAgICAgIC8vICR0aGlzLmZpbmQoJy5pdGVtLW1lZGlhJykuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiaW1nXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArc3JjKyAnKTtcIj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgICAgIC8vJHRoaXMuYWRkQ2xhc3MoJ2hhc19tZWRpYScpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEgIT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcyAhPSB1bmRlZmluZWQgLyomJiB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMubWVkaWEgIT0gdW5kZWZpbmVkKi8gKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEucmV0d2VldGVkX3N0YXR1cyA9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldCAhPSB1bmRlZmluZWQgXHJcbiAgICAgICAgICAgICAgICAmJiB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0LnN0cmVhbUVudHJ5ICE9IHVuZGVmaW5lZCAmJiAhJC5pc0VtcHR5T2JqZWN0KCB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0LnN0cmVhbUVudHJ5ICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcXVvdGVkX3R3ZWV0ID0gdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldC5zdHJlYW1FbnRyeVxyXG4gICAgICAgICAgICAgICAgICAgICwkcXVvdGVkX3R3ZWV0X2NvbnRhaW5lciA9ICQoJzxkaXY+JywgeyBjbGFzczogJ3F1b3RlZC10d2VldC1jb250YWluZXInIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLCRxdW90ZWRfdHdlZXRfYXV0b3IgPSAkKCc8ZGl2PicsIHsgY2xhc3M6ICdxdW90ZWQtdHdlZXQtYXV0b3InIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLCRxdW90ZWRfdHdlZXRfdGV4dCA9ICQoJzxkaXY+JywgeyBjbGFzczogJ3F1b3RlZC10d2VldC10ZXh0JyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICwkcXVvdGVkX3R3ZWV0X21lZGlhID0gJCgnPGRpdj4nLCB7IGNsYXNzOiAncXVvdGVkLXR3ZWV0LW1lZGlhJyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICxmaXJzdF91cmwgPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy51cmxzICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybHMgPSBzZWxmLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KHVybHMpICkgZmlyc3RfdXJsID0gdXJsc1sgMCBdLnVybDtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGZpcnN0X3VybCA9IHVybHMudXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBuYW1lX2h0bWwgPSAkKCc8YiBjbGFzcz1cInF1b3RlZC10d2VldC1hdXRvci1uYW1lXCI+JyArIHF1b3RlZF90d2VldC51c2VyLm5hbWUgKyBcclxuICAgICAgICAgICAgICAgICAgICAnPC9iPjxzcGFuIGNsYXNzPVwicXVvdGVkLXR3ZWV0LWF1dG9yLXNjcmVlbm5hbWVcIj5AJyArIHF1b3RlZF90d2VldC51c2VyLnNjcmVlbl9uYW1lICsgJzwvc3Bhbj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkcXVvdGVkX3R3ZWV0X2F1dG9yLmh0bWwoIG5hbWVfaHRtbCApLmF0dHIoJ2RhdGEtdG9vbHRpcCcsIHF1b3RlZF90d2VldC51c2VyLm5hbWUgKVxyXG4gICAgICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaG93X3VzZXJfaW5mbyggcXVvdGVkX3R3ZWV0LnVzZXIuaWRfc3RyICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZV9odG0gPSBxdW90ZWRfdHdlZXQudGV4dC5yZXBsYWNlKC/igJwvZywgJycpLnJlcGxhY2UoL+KAnS9nLCAnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG0gPSB1cmxfdG9fbGluayggbWVzc2FnZV9odG0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bSA9IGhhc2h0YWdfdG9fbGluayggbWVzc2FnZV9odG0sICd0d2l0dGVyJyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZWdleCAgID0gLyhefFteQFxcd10pQChcXHd7MSwxNX0pXFxiL2dcclxuICAgICAgICAgICAgICAgICAgICAscmVwbGFjZSA9ICckMTxhIGNsYXNzPVwidHctdXNlclwiIGhyZWY9XCJqYXZhc2NyaXB0OjtcIiBvbmNsaWNrPVwiRUMuVUkuSUFCKFxcJ2h0dHBzOi8vdHdpdHRlci5jb20vJDJcXCcpO1wiIGRhdGEtdXNlcj1cIkAkMlwiPkAkMjwvYT4nOyBcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bSA9IG1lc3NhZ2VfaHRtLnJlcGxhY2UoIHJlZ2V4LCByZXBsYWNlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHF1b3RlZF90d2VldF90ZXh0Lmh0bWwoIG1lc3NhZ2VfaHRtLnJlcGxhY2UoL15cXHNcXHMqLywgJycpLnJlcGxhY2UoL1xcc1xccyokLywgJycpICk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHF1b3RlZF90d2VldF90ZXh0Lm9uKCdjbGljaycsJ2EudHctdXNlcicsZnVuY3Rpb24oIGUgKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNob3dfdXNlcl9pbmZvKCAkKCB0aGlzICkuYXR0cignZGF0YS11c2VyJykgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICRxdW90ZWRfdHdlZXRfdGV4dC5vbignY2xpY2snLCdhLnR3LWhhc2h0YWcnLGZ1bmN0aW9uKCBlICl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSAkKCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0d19zZWFyY2ggPSBuZXcgVFdTZWFyY2hDb250YWluZXIoIFtdLCB7IHByb2ZpbGU6IHNlbGYucHJvZmlsZSwgbmV4dDonJywgcmVzdWx0X3R5cGU6ICdyZWNlbnQnIH0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBwID0gbmV3IGVjUG9wdXAoIHR3X3NlYXJjaC52aWV3KCkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcHAuZWxlbWVudC5hZGRDbGFzcygndHdpdHRlci1zZWFyY2gnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcHAuZWxlbWVudC5maW5kKCcuaGVhZGVyJykuaHRtbCggJ1NFQVJDSCcgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZCggcHAucmVuZGVyKCkuaGlkZSgpLmZhZGVJbiggNTAwICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcudHdpdHRlci1zZWFyY2gnKS5maW5kKCcjc2VhcmNoLXRleHQnKS52YWwoIGRlY29kZVVSSUNvbXBvbmVudCh0aGF0LmF0dHIoJ2RhdGEtcXVlcnknKSkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLnR3aXR0ZXItc2VhcmNoJykuZmluZCgnLmdvLWJ1dHRvbicpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHF1b3RlZF90d2VldC5lbnRpdGllcyAhPSB1bmRlZmluZWQgJiYgcXVvdGVkX3R3ZWV0LmVudGl0aWVzLm1lZGlhICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHF1b3RlZF90d2VldF9tZWRpYS5odG1sKCAnPGltZyBjbGFzcz1cInR3aXR0ZXItaW1hZ2UgZnVsbC1pbWFnZVwiIHNyYz1cIicgKyBxdW90ZWRfdHdlZXQuZW50aXRpZXMubWVkaWEubWVkaWFfdXJsICsgJ1wiPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGZpcnN0X3VybC5sZW5ndGggPiAwICkgRUMuVUkuSUFCKCBmaXJzdF91cmwgKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJHF1b3RlZF90d2VldF9jb250YWluZXIuYXBwZW5kKCRxdW90ZWRfdHdlZXRfYXV0b3IsICRxdW90ZWRfdHdlZXRfdGV4dCwgJHF1b3RlZF90d2VldF9tZWRpYSlcclxuICAgICAgICAgICAgICAgIC5ob3ZlcihmdW5jdGlvbiAoKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICQoIHRoaXMgKS5jc3MoJ2JvcmRlcicsICcxcHggc29saWQgIzk5OScpO1xyXG4gICAgICAgICAgICAgICAgfSwgXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICQoIHRoaXMgKS5jc3MoJ2JvcmRlcicsICcxcHggc29saWQgI2NjYycpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkcXVvdGVkX3R3ZWV0X2NvbnRhaW5lcjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy5tZWRpYSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvKnZhciBwb3N0X21lZGlhX2VsZW1lbnQgPSBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X3Bvc3RfbWVkaWFfZWxlbWVudC5jYWxsKCB1bmRlZmluZWQsIHRoaXMuZGF0YS5yYXdfZGF0YSwgJHRoaXMuZmluZCgnLml0ZW0tbWVkaWEnKSApO1xyXG4gICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSBwb3N0X21lZGlhX2VsZW1lbnRbMF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoIG9iamVjdF9sZW5ndGgoIHBvc3RfbWVkaWFfZWxlbWVudFsxXSApID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zID0gcG9zdF9tZWRpYV9lbGVtZW50WzFdO1xyXG4gICAgICAgICAgICAgICAgfSovXHJcblxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPSBleHRfZWxlbWVudDtcclxuXHJcbiAgICAgICAgaXRlbU1lZGlhID0gJyc7XHJcbiAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5pZCAhPSAnY2luYm94JyApIGl0ZW1NZWRpYSA9IGV4dF9lbGVtZW50OyAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpdGVtTWVkaWEgPSBleHRfZWxlbWVudFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICQudHlwZShpdGVtTWVkaWEpID09ICdvYmplY3QnID8gaXRlbU1lZGlhLmh0bWwoKTogaXRlbU1lZGlhO1xyXG4gICAgfTtcclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5nZXRVSURhdGEgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2dldFVJRGF0YScpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgVUlEYXRhID0ge307XHJcblxyXG4gICAgICAgIC8vbmFtZSwgcHJvZmlsZUltZyBhbmQgZGF0ZVxyXG4gICAgICAgIFVJRGF0YS5wcm9maWxlTmFtZSAgPSBzZWxmLmRhdGEuZnJvbU5hbWU7XHJcbiAgICAgICAgVUlEYXRhLnByb2ZpbGVJbWcgICA9IHNlbGYuZGF0YS5wcm9maWxlUGljIHx8IHNlbGYuZGF0YS5pY29uO1xyXG4gICAgICAgIFVJRGF0YS50aW1lICAgICAgICAgPSBzZWxmLmdldEl0ZW1UaW1lKCk7XHJcblxyXG4gICAgICAgIC8vaXRlbSB0ZXh0IFxyXG4gICAgICAgIFVJRGF0YS5pdGVtVGV4dCAgICAgPSBzZWxmLmdldEl0ZW1UZXh0KCk7XHJcbiAgICAgICAgVUlEYXRhLml0ZW1NZWRpYSAgICA9IHNlbGYuZ2V0SXRlbU1lZGlhKCk7XHJcbiAgICAgICAgcmV0dXJuIFVJRGF0YTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBUaW1lbGluZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFR3aXR0ZXJGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIC8qd2luZG93Lmdsb2JhbHMudHdfZmVlZHNfbGl2ZV91cGRhdGUgJiYqLyBbJ2hvbWVGZWVkJywnbGlzdHMnLCdtZW50aW9ucycsJ3R3Rm9sbG93ZXJzJywnZGlyZWN0X21lc3NhZ2UnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFR3aXR0ZXJGZWVkO1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5jbGVhckZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoIHJlbW92ZV9tZXNzYWdlIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdob21lRmVlZCc6IHRoaXMucmVxdWVzdCgnZ2V0VFdIb21lRmVlZCcpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdtZW50aW9ucyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdNZW50aW9ucycpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d0ZvbGxvd2Vycyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdGb2xsb3dlcnMnKTsgLy8gPC0tIHRvdGFsbHkgdW5pcXVlXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d0ZyaWVuZHMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXRnJpZW5kc0xpc3QnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NlbmRUd2VldHMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VuZFR3ZWV0cycpOyAvLyA8LS0gc2ltaWxhci1pc2ggdG8gVGltZWxpbmVGZWVkSXRlbVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbXlUd2VldHNSZXR3ZWV0ZWQnOiB0aGlzLnJlcXVlc3QoJ2dldFRXUmV0d2VldHMnKTsgLy8gPC0tIHNpbWlsYXItaXNoIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3RmF2b3JpdGVzJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0Zhdm9yaXRlcycpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdkaXJlY3RfbWVzc2FnZSc6IHRoaXMucmVxdWVzdCgnZ2V0VFdJbkJveCcpOyAvLyA8LS0gc2ltaWxhciB0byBDb2xsYXBzaWJsZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaXN0cyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdMaXN0cycpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzogdGhpcy5yZXF1ZXN0KCdnZXRUV1NlYXJjaCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnb3V0cmVhY2gnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VhcmNoJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdsaXN0cycgfHwgdGhpcy5pZCA9PSAnc2VhcmNoJyB8fCB0aGlzLmlkID09ICdvdXRyZWFjaCcgfHwgdGhpcy5pZCA9PSAnZGlyZWN0X21lc3NhZ2UnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7IFxyXG4gICAgICAgICAgICAvL3RoaXMuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJycsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBtYXhfaWQ6IHRoaXMubmV4dFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoICggdGhpcy5pZCA9PT0gJ3R3Rm9sbG93ZXJzJyB8fCB0aGlzLmlkID09PSAndHdGcmllbmRzJyApICYmIHNlbGYub3B0aW9ucy51c2VyX2lkX2Zvcl9yZXF1ZXN0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEudXNlcklEID0gc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3Q7ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdob21lRmVlZCc6IGRhdGEuYWN0aW9uID0gJ2dldFRXSG9tZUZlZWQnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ21lbnRpb25zJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdNZW50aW9ucyc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdGb2xsb3dlcnMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV0ZvbGxvd2Vycyc7IFxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3RnJpZW5kcyc6IGRhdGEuYWN0aW9uID0gJ2dldFRXRnJpZW5kc0xpc3QnOyBcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzZW5kVHdlZXRzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdTZW5kVHdlZXRzJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdteVR3ZWV0c1JldHdlZXRlZCc6IGRhdGEuYWN0aW9uID0gJ2dldFRXUmV0d2VldHMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3RmF2b3JpdGVzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdGYXZvcml0ZXMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ2RpcmVjdF9tZXNzYWdlJzogXHJcbiAgICAgICAgICAgIC8vICAgICBkYXRhLmFjdGlvbiA9ICdnZXRUV0luQm94JztcclxuICAgICAgICAgICAgLy8gICAgIGRhdGEuaW5ib3hfbWF4X2lkID0gdGhpcy5uZXh0LmluYm94O1xyXG4gICAgICAgICAgICAvLyAgICAgZGF0YS5vdXRib3hfbWF4X2lkID0gdGhpcy5uZXh0Lm91dGJveDtcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC90d2l0dGVyJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AgfHwge307XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICkgZGF0YS5kYXRhLnNwbGljZSggMCwgMSApOyAvLyBiYWNrZW5kIHJldHVybnMgbGFzdCBpdGVtIGZyb20gcHJldiByZXF1ZXN0IGFzIGZpcnN0IGl0ZW0gaGVyZVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmN1cnNvciAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmN1cnNvclsgMCBdICE9PSAwICkgc2VsZi5uZXh0ID0gZGF0YS5jdXJzb3JbIDAgXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YVsgZGF0YS5kYXRhLmxlbmd0aCAtIDEgXS5pZF9zdHI7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gVFdTZWFyY2hDb250YWluZXI6IHNlbGYgPSB0aGlzOyBwcm9maWxlID0gc2VsZi5kYXRhLnByb2ZpbGVcclxuICAgIC8vIHR5cGUgPSB0d2VldHMgT1IgcGVvcGxlXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5zZWFyY2hfcmVxdWVzdCA9IGZ1bmN0aW9uICggc2VsZiwgY2FsbGJhY2ssIGNsYXNzX25hbWUgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwYXJhbWV0ZXJzID0gW10sIG5leHQsIHF1ZXJ5LCBwcm9maWxlLCByZXN1bHRfdHlwZSwgdHlwZSwgbGFuZywgZ2VvY29kZTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCBzZWxmLmNvbnN0cnVjdG9yLm5hbWUgPT0gJ1R3aXR0ZXJGZWVkJyApXHJcbiAgICAgICAgaWYgKCBjbGFzc19uYW1lID09ICdUd2l0dGVyRmVlZCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZSA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGU7XHJcbiAgICAgICAgICAgIHF1ZXJ5ID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnk7XHJcbiAgICAgICAgICAgIHByb2ZpbGUgPSBzZWxmLnByb2ZpbGU7XHJcbiAgICAgICAgICAgIHJlc3VsdF90eXBlID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucmVzdWx0X3R5cGU7XHJcbiAgICAgICAgICAgIG5leHQgPSBzZWxmLm5leHQ7XHJcbiAgICAgICAgICAgIGxhbmcgPSBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5sYW5nOyBcclxuICAgICAgICAgICAgZ2VvY29kZSA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLmdlb2NvZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggc2VsZi5kYXRhIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGUgPSBzZWxmLmRhdGEudHlwZTtcclxuICAgICAgICAgICAgcXVlcnkgPSBzZWxmLmRhdGEucXVlcnk7XHJcbiAgICAgICAgICAgIHByb2ZpbGUgPSBzZWxmLmRhdGEucHJvZmlsZTtcclxuICAgICAgICAgICAgcmVzdWx0X3R5cGUgPSBzZWxmLmRhdGEucmVzdWx0X3R5cGU7XHJcbiAgICAgICAgICAgIHBhZ2UgPSBzZWxmLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgbmV4dCA9IHNlbGYuZGF0YS5uZXh0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAga2V5OiAncScsXHJcbiAgICAgICAgICAgIHZhbHVlOiBxdWVyeVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIHR5cGUgPT0gJ3R3ZWV0cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGtleTogJ3Jlc3VsdF90eXBlJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXN1bHRfdHlwZVxyXG4gICAgICAgICAgICB9KTsgXHJcblxyXG4gICAgICAgICAgICBpZiAoIGxhbmcgIT09IHVuZGVmaW5lZCAmJiBsYW5nLmxlbmd0aCA+IDAgJiYgbGFuZyAhPSAnYWxsJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBrZXk6ICdsYW5nJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbGFuZ1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGdlb2NvZGUgIT09IHVuZGVmaW5lZCAmJiBnZW9jb2RlLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ2dlb2NvZGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBnZW9jb2RlXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy9wZW9wbGVcclxuICAgICAgICBlbHNlIGlmICggbmV4dCAhPT0gdW5kZWZpbmVkICYmIG5leHQgIT09IGZhbHNlICkgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBrZXk6ICdwYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbmV4dFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiBcImZlZWQvdHdpdHRlclwiLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogcHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldFRXU2VhcmNoJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHR5cGUgPT0gJ3R3ZWV0cycgJiYgcmVzdWx0X3R5cGUgPT0gJ3JlY2VudCcgJiYgbmV4dCAhPT0gdW5kZWZpbmVkICkgcmVxdWVzdC5kYXRhLm1heF9pZCA9IG5leHQ7XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFja19kYXRhID0gJ0ZBSUwnO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT0gJ1NVQ0NFU1MnICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmVycm9ycyAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZXJyb3JzLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvciA9IGRhdGEuZXJyb3JzWyAwIF0uc3RyZWFtRW50cnk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXJyb3IgIT09IHVuZGVmaW5lZCAmJiBlcnJvci5tZXNzYWdlKSB7fS8vRUMuVUkuYWxlcnQoJ1RXIGVycm9yOiAnICsgZXJyb3IubWVzc2FnZSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIEVDLlVJLmFsZXJ0KEVDLmdldE1lc3NhZ2UoJ1VOS05PV05fRVJSJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tfZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLm5leHQgIT09IHVuZGVmaW5lZCApIGNhbGxiYWNrX2RhdGEubmV4dCA9IGRhdGEubmV4dDsgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgRUMuVUkuYWxlcnQoRUMuZ2V0TWVzc2FnZSgnRkFJTF9FUlInKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBjYWxsYmFja19kYXRhICk7XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uICggYWN0aW9uIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC90d2l0dGVyJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggYWN0aW9uID09ICdnZXRUV1NlYXJjaCcgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlID09PSB1bmRlZmluZWQgKSAvL2VtcHR5IHNlYXJjaCBmZWVkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggW10gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeSAhPT0gdW5kZWZpbmVkICYmIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5Lmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2VhcmNoX3JlcXVlc3QoIHNlbGYsIGZ1bmN0aW9uKCBkYXRhIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2lmICggc2VsZi5kYXRhLnJlc3VsdF90eXBlID09ICdwb3B1bGFyJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRwZW9wbGVfc2VjdGlvbi5jc3MoJ2Rpc3BsYXknLCdibG9jaycpOyBcclxuICAgICAgICAgICAgICAgICAgICB9LCAnVHdpdHRlckZlZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBhY3Rpb24gPT0gJ2dldFRXTGlzdHMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0cyA9IHRoaXMucHJvZmlsZS5saXN0cztcclxuXHJcbiAgICAgICAgICAgIGlmICggbGlzdHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggbGlzdHMuZGVmYXVsdF9lbGVtZW50ICE9PSB1bmRlZmluZWQgKSBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IGxpc3RzLmRlZmF1bHRfZWxlbWVudDsgXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBsaXN0cy5kYXRhID09PSB1bmRlZmluZWQgfHwgbGlzdHMuZGF0YS5sZW5ndGggPT09IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHkgLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBsaXN0cy5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keSAuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBzdHJlYW06IHRoaXMuaWRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggKCBhY3Rpb24gPT09ICdnZXRUV0ZvbGxvd2VycycgfHwgYWN0aW9uID09PSAnZ2V0VFdGcmllbmRzTGlzdCcgKSAmJiBzZWxmLm9wdGlvbnMudXNlcl9pZF9mb3JfcmVxdWVzdCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRhdGEudXNlcklEID0gc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3Q7ICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSBkYXRhO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjVFcgJyArIGFjdGlvbiArICdyZXF1ZXN0OicsICdjb2xvcjpvcmFuZ2VyZWQnKVxyXG5cclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY1RXICcgKyBhY3Rpb24gKyAncmVzcG9uc2U6JywgJ2NvbG9yOm9yYW5nZXJlZCcpXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCByZXF1ZXN0LmRhdGEuYWN0aW9uID09ICdnZXRUV1NlbmRUd2VldHMnKSBjb25zb2xlLmVycm9yKCBkYXRhIClcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuY3Vyc29yICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5jdXJzb3JbIDAgXSAhPT0gMCApIHNlbGYubmV4dCA9IGRhdGEuY3Vyc29yWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhWyBkYXRhLmRhdGEubGVuZ3RoIC0gMSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCByZXF1ZXN0LmRhdGEuYWN0aW9uID09ICdnZXRUV0luQm94JyApIHNlbGYuZWxlbWVudC5maW5kKCcuYnRuLnRvZ2dsZScpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ2xpc3RzJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pdGVtc1sgMCBdICE9PSB1bmRlZmluZWQgKSBkYXRhID0gZGF0YS5jb25jYXQoIHRoaXMuaXRlbXNbIDAgXS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnbWVudGlvbnMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggW3RoaXNfZGF0dW1dLCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBpO1xyXG5cclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIC8vIGRpcmVjdCBtZXNzYWdlcyBmZWVkXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdkaXJlY3RfbWVzc2FnZScgJiYgZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBtaW5jb21pbmcgPSBbXSxcclxuICAgICAgICAgICAgICAgIGN1c2VySWQgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC5kYXRhLnVzZXJJZDtcclxuXHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhWyBpIF0uY29udmVyc2F0aW9uID09PSB1bmRlZmluZWQgfHwgZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSA9PT0gdW5kZWZpbmVkICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSApKSBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5ID0gWyBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5IF07XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSwgc2VsZiApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBrID0gMCwgbGwgPSBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5Lmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbWVzc2FnZSA9IGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnlbIGsgXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNtZXNzYWdlLnJlY2lwaWVudC5pZF9zdHIgPT09IGN1c2VySWQgKSAvLyBsYXRlc3QgaW5jb21pbmcgaW4gY29udmVyc2F0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBjbWVzc2FnZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggY21lc3NhZ2UuY3JlYXRlZF9hdCApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBjbWVzc2FnZS5pZF9zdHJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG1pbmNvbWluZy5zb3J0KCBmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA+IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPCBiLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTsgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gZmluZCBsYXRlc3QgaW5jb21pbmdcclxuICAgICAgICAgICAgaWYgKCBtaW5jb21pbmcubGVuZ3RoID4gMCApIHNlbGYuZmlyc3RJdGVtSUQgPSBtaW5jb21pbmdbIDAgXS50aW1lO1xyXG5cclxuICAgICAgICAgICAgZWxzZSAgc2VsZi5maXJzdEl0ZW1JRCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnc2VhcmNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ291dHJlYWNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApIGZvciAoIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnbWVudGlvbnMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggW3RoaXNfZGF0dW1dLCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgdXNlcjogZGF0YS51c2VyLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLmNyZWF0ZWRfYXQgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIGZhdm9yaXRlczoge1xyXG4gICAgICAgICAgICAgICAgY291bnQ6IGRhdGEuZmF2b3JpdGVfY291bnQsXHJcbiAgICAgICAgICAgICAgICBieV9tZTogZGF0YS5mYXZvcml0ZWRcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmV0d2VldHM6IHtcclxuICAgICAgICAgICAgICAgIGNvdW50OiBkYXRhLnJldHdlZXRfY291bnQsXHJcbiAgICAgICAgICAgICAgICBieV9tZTogZGF0YS5yZXR3ZWV0ZWQsXHJcbiAgICAgICAgICAgICAgICBpZDogKCAoIGRhdGEucmV0d2VldGVkX3N0YXR1cyAhPT0gdW5kZWZpbmVkICkgPyBkYXRhLnJldHdlZXRlZF9zdGF0dXMuaWRfc3RyIDogZGF0YS5pZF9zdHIgKSxcclxuICAgICAgICAgICAgICAgIHJldHdlZXRJZDogKCAoIGRhdGEucmV0d2VldElkICE9PSB1bmRlZmluZWQgKSA/IGRhdGEucmV0d2VldElkIDogZmFsc2UgKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBkYXRhLnRleHQsXHJcbiAgICAgICAgICAgIGZyb21OYW1lOiAoIGRhdGEubmFtZSB8fCBkYXRhLnVzZXIubmFtZSApLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogKCBkYXRhLnNjcmVlbl9uYW1lIHx8IGRhdGEudXNlci5zY3JlZW5fbmFtZSApLFxyXG4gICAgICAgICAgICBwcm9maWxlUGljOiAoIGRhdGEucHJvZmlsZV9pbWFnZV91cmwgfHwgZGF0YS51c2VyLnByb2ZpbGVfaW1hZ2VfdXJsICksXHJcbiAgICAgICAgICAgIHBvc3RJRDogZGF0YS5pZF9zdHIsXHJcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkX3N0cixcclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuZW50aXRpZXMgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0gW107XHJcbiAgICAgICAgICAgIGRhdGEuZW50aXRpZXMubWVkaWEubWVkaWFfdXJsLmZvckVhY2goZnVuY3Rpb24obWVkaWFfdXJsKXtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgICAgICBzcmM6IG1lZGlhX3VybFxyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9KTsgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHVybHMgPSBbXTtcclxuICAgICAgICBpZiAoIGRhdGEuZW50aXRpZXMgJiYgZGF0YS5lbnRpdGllcy51cmxzICYmICEgXy5pc0VtcHR5KCBkYXRhLmVudGl0aWVzLnVybHMgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxzID0gZGF0YS5lbnRpdGllcy51cmxzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggdXJscyApICkgdXJscyA9IFsgdXJscyBdOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZvciBzaGFyZWQgWVQgbGlua1xyXG4gICAgICAgIGlmICggdXJscy5sZW5ndGggJiYgKCFkYXRhLmVudGl0aWVzLm1lZGlhIHx8IFxyXG4gICAgICAgICAgICAoICFBcnJheS5pc0FycmF5KCBkYXRhLmVudGl0aWVzLm1lZGlhICkgJiYgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgJiYgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwuaW5kZXhPZignaHR0cHM6Ly9pLnl0aW1nLmNvbS8nKSAhPT0gLTEgKSkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdmlkZW9faWQ7XHJcbiAgICAgICAgICAgIGlmICggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZigneW91dHViZS5jb20nKSAhPT0gLTEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFzaGVzID0gdXJsc1swXS5leHBhbmRlZF91cmwuc2xpY2UoIHVybHNbMF0uZXhwYW5kZWRfdXJsLmluZGV4T2YoJz8nKSArIDEgKS5zcGxpdCgnJicpO1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBoYXNoZXNbaV0uc3BsaXQoJz0nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBoYXNoWzBdID09ICd2JyApIHZpZGVvX2lkID0gaGFzaFsxXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZignLy95b3V0dS5iZS8nKSAhPT0gLTEgKSB2aWRlb19pZCA9IHVybHNbMF0uZXhwYW5kZWRfdXJsLnJlcGxhY2UoJ2h0dHBzOi8veW91dHUuYmUvJywnJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIHZpZGVvX2lkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5lbnRpdGllcy5tZWRpYSA9IHsgbWVkaWFfdXJsOidodHRwczovL2ltZy55b3V0dWJlLmNvbS92aS8nICt2aWRlb19pZCsgJy9ocWRlZmF1bHQuanBnJyB9O1xyXG4gICAgICAgICAgICAgICAgZGF0YS5lbnRpdGllcy52aWRlb19pZCA9IHZpZGVvX2lkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVzc2FnZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIGxpbmtzXHJcbiAgICAgICAgICAgIHZhciBleHAgPSAvKFxcYigoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC98Yml0Lmx5XFwvfGdvby5nbFxcL3x0LmNvXFwvKVstQS1aMC05KyZAI1xcLyU/PX5ffCE6LC47XSpbLUEtWjAtOSsmQCNcXC8lPX5ffF0pL2lnO1xyXG5cclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZXNzYWdlID0gdGhpc19kYXR1bS5tZXNzYWdlLnJlcGxhY2UoZXhwLCcnKS50cmltKCk7XHJcblxyXG4gICAgICAgICAgICB1cmxzLmZvckVhY2goZnVuY3Rpb24odXJsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgKz0gJyAnICsgdXJsLnVybDsgICBcclxuICAgICAgICAgICAgfSk7ICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X3Bvc3RfbWVkaWFfZWxlbWVudCA9IGZ1bmN0aW9uICggcmF3X2RhdGEsICRtZWRpYSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGV4dF9lbGVtZW50LFxyXG4gICAgICAgICAgICBzbGlkZXJfaXRlbXMgPSBbXTtcclxuICAgICAgICBpZiAoIHJhd19kYXRhICYmIHJhd19kYXRhLmVudGl0aWVzICYmIHJhd19kYXRhLmVudGl0aWVzLm1lZGlhIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBleHRfbWVkaWFfZGF0YSA9IHJhd19kYXRhLmVudGl0aWVzLmV4dF9tZWRpYSxcclxuICAgICAgICAgICAgICAgIGV4dF9tZWRpYSxcclxuICAgICAgICAgICAgICAgIHZhcmlhbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiggZXh0X21lZGlhX2RhdGEgJiYgZXh0X21lZGlhX2RhdGEubWVkaWEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGV4dF9tZWRpYV9kYXRhLm1lZGlhICkgKSBleHRfbWVkaWEgPSBleHRfbWVkaWFfZGF0YS5tZWRpYVsgMCBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgZXh0X21lZGlhID0gZXh0X21lZGlhX2RhdGEubWVkaWE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZXh0X21lZGlhICYmICggZXh0X21lZGlhLnR5cGUgPT09ICdhbmltYXRlZF9naWYnIHx8IGV4dF9tZWRpYS50eXBlID09PSAndmlkZW8nICkgJiYgZXh0X21lZGlhLnZpZGVvX2luZm8gJiYgZXh0X21lZGlhLnZpZGVvX2luZm8udmFyaWFudHMgJiYgZXh0X21lZGlhLnZpZGVvX2luZm8udmFyaWFudHMudmFyaWFudCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YXJpYW50X2RhdGEgPSBleHRfbWVkaWEudmlkZW9faW5mby52YXJpYW50cy52YXJpYW50O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggdmFyaWFudF9kYXRhICkgKSB2YXJpYW50ID0gdmFyaWFudF9kYXRhWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB2YXJpYW50ID0gdmFyaWFudF9kYXRhOyAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB2YXJpYW50IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJG1lZGlhLmFkZENsYXNzKCdjZW50ZXInKTtcclxuICAgICAgICAgICAgICAgIC8vZXh0X2VsZW1lbnQgPSAkKCc8dmlkZW8gbG9vcCBjbGFzcz1cImFuaW1hdGVkLWdpZlwiIHBvc3Rlcj1cIicgKyBleHRfbWVkaWEubWVkaWFfdXJsX2h0dHBzICsgJ1wiIHNyYz1cIicgKyB2YXJpYW50LnVybCArICdcIj48L3ZpZGVvPicpO1xyXG4gICAgICAgICAgICAgICAgLyppZiAoIGV4dF9tZWRpYS50eXBlID09PSAnYW5pbWF0ZWRfZ2lmJyApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJCgnPHZpZGVvIGF1dG9wbGF5IGxvb3AgY2xhc3M9XCJhbmltYXRlZC1naWZcIiBwb3N0ZXI9XCInICsgZXh0X21lZGlhLm1lZGlhX3VybF9odHRwcyArICdcIiBzcmM9XCInICsgdmFyaWFudC51cmwgKyAnXCI+PC92aWRlbz4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHsqL1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd1aS1ncmlkLXNvbG8gbF9tZXNzYWdlJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0naW1nX2JveCB2aWRlbyB1aS1ncmlkLXNvbG8gcG9zaXRpb24tcmVsYXRpdmUnPjxpbWcgY2xhc3M9XFxcInZpZGVvLWJ1dHRvblxcXCIgc3JjPVxcXCJpbWcvcGxheS1idXR0b24ucG5nXFxcIj48aW1nIGNsYXNzPVxcXCJpbWctcmVzcG9uc2l2ZVxcXCIgc3JjPSdcIiArIGV4dF9tZWRpYS5tZWRpYV91cmxfaHR0cHMgKyBcIic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsZnVuY3Rpb24gKClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVDLlVJLklBQiggZW5jb2RlVVJJKHZhcmlhbnQudXJsICksJycsJ19zeXN0ZW0nKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggcmF3X2RhdGEucHJldmlld19jb250ZW50IClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlld19jb250ZW50ID0gSlNPTi5wYXJzZSggcmF3X2RhdGEucHJldmlld19jb250ZW50ICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0dWZmID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcHJldmlld19jb250ZW50LnRpdGxlICkgdGl0bGUgPSBwcmV2aWV3X2NvbnRlbnQudGl0bGU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcmF3X2RhdGEucGljdHVyZV90ZXh0ICkgc3R1ZmYgPSByYXdfZGF0YS5waWN0dXJlX3RleHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94Jz48aW1nIHNyYz0nXCIgKyByYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKyBcIic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGEgY2xhc3M9J3BoX2xpbmsnIGhyZWY9J1wiICsgcHJldmlld19jb250ZW50LnVybCArIFwiJyB0YXJnZXQ9J19ibGFuayc+XCIgKyB0aXRsZSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgbWVkaWEnPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzpyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwsIHc6OTY0LCBoOjEwMjR9KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJCgnPGltZyBjbGFzcz1cInR3aXR0ZXItaW1hZ2VcIiBzcmM9XCInICtyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwrICdcIiA+Jyk7IFxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzpyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwsIHc6OTY0LCBoOjEwMjR9KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHZpZGVvX2lkID0gcmF3X2RhdGEuZW50aXRpZXMudmlkZW9faWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB2aWRlb19pZCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGNsaWNrYWJsZSA9ICQoJzxkaXY+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXh0X2VsZW1lbnQuZmluZCgnLmltZ19ib3gnKS5sZW5ndGggKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRjbGlja2FibGUgPSBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpLmFkZENsYXNzKCd2aWRlbycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZSA9ICRtZWRpYTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJG1lZGlhLmFkZENsYXNzKCd2aWRlbycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZS5vbignY2xpY2snLCBmdW5jdGlvbiggZSApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBFQy5VSS5JQUIoIGVuY29kZVVSSSggJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLycrdmlkZW9faWQrJz9hdXRvcGxheT0xJyApLCcnLCdfc3lzdGVtJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qdmFyIG1lZGlhT2JqZWN0ID0gJzxpZnJhbWUgc3JjPVwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJysgdmlkZW9faWQgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICc/YXV0b3BsYXk9MVwiIHdpZHRoPVwiMTI4MFwiIGhlaWdodD1cIjcyMFwiIGZyYW1lYm9yZGVyPVwiMFwiPjwvaWZyYW1lPic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RfbWFuYWdlci53YXRjaFBpY3R1cmVWaWRlbyggbWVkaWFPYmplY3QsIHRydWUgKTsgKi8gICBcclxuICAgICAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW2V4dF9lbGVtZW50LCBzbGlkZXJfaXRlbXNdO1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBUd2l0dGVyRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gWW91VHViZUZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gWW91VHViZUZlZWQ7XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gcmVxdWVzdHMgZGF0YSBhbmQgdGhlbiBjYWxscyB0aGlzLnNhdmVfaXRlbXNcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlDaGFubmVsSG9tZSc6IHRoaXMuZ2V0WW91VHViZUZlZWQoXCJ5dF9teUNoYW5uZWxIb21lXCIsXCJcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teUNoYW5uZWxWaWRlb3MnOiB0aGlzLmdldFlvdVR1YmVGZWVkKFwieXRfbXlDaGFubmVsVmlkZW9zXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlTdWJzY3JpcHRpb24nOiB0aGlzLmdldFlvdVR1YmVGZWVkKFwieXRfbXlTdWJzY3JpcHRpb25cIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubmV4dCA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLm5leHQgKSB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJylbMF0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRZb3VUdWJlRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIG5leHRUb2tlbjogdGhpcy5uZXh0IFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC95b3VUdWJlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhLm5leHRUb2tlbiAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YS5uZXh0VG9rZW47XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5nZXRZb3VUdWJlRmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRZb3VUdWJlRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5pZCA9PSAneXRfbXlTdWJzY3JpcHRpb24nICkgZGF0YS5jaGFubmVsX2lkID0gLyonVUMnICsgKi90aGlzLnByb2ZpbGUuZGF0YS51c2VySWQucmVwbGFjZSgnY2hhbm5lbD09JywnJyk7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC95b3VUdWJlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5uZXh0VG9rZW4gIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5kYXRhLm5leHRUb2tlbjtcclxuXHJcbiAgICAgICAgICAgIC8vdGVtcG9yYXJ5XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ3l0X215U3Vic2NyaXB0aW9uJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0Q2hhbm5lbElkICE9PSB1bmRlZmluZWQgKSBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0Q2hhbm5lbElkOyBcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICd5dF9teVN1YnNjcmlwdGlvbicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEuaXRlbXMsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5pdGVtcyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5pdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGEuaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLml0ZW1zICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5pdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGEuaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uKCBkYXRhICkge1xyXG5cclxuICAgICAgICB2YXIgbWVkaWEgPSBkYXRhLm1lZGlhO1xyXG5cclxuICAgICAgICBpZiAoIG1lZGlhLnR5cGUgPT0gXCJ2aWRlb1wiICkge1xyXG4gICAgICAgICAgICBtZWRpYS52aWRlbyA9IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiAnaHR0cDovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgbWVkaWEuaWQgKyAnP2F1dG9wbGF5PTEnLFxyXG4gICAgICAgICAgICAgICAgc291cmNlX3VybDogJ2h0dHA6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJyArIG1lZGlhLmlkICsgJz9hdXRvcGxheT0xJ1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgIGZyb21JZDogZGF0YS5mcm9tSWQsXHJcbiAgICAgICAgICAgIGZyb21OYW1lOiBkYXRhLmZyb21OYW1lLFxyXG4gICAgICAgICAgICBwcm9maWxlUGljOiBkYXRhLnByb2ZpbGVQaWMsXHJcbiAgICAgICAgICAgIHByb2ZpbGVMaW5rOiBkYXRhLnByb2ZpbGVMaW5rLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLnVwZGF0ZVRpbWUgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSxcclxuXHJcbiAgICAgICAgICAgIC8vbWV0YUluZm86ICggZGF0YS5pdGVtc1sgaSBdLmNoYW5uZWxJZCE9dW5kZWZpbmVkICYmIGRhdGEuaXRlbXNbIGkgXS5jaGFubmVsVGl0bGUhPXVuZGVmaW5lZCksXHJcbiAgICAgICAgICAgIGNoYW5uZWxJZDogZGF0YS5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgIGNoYW5uZWxMaW5rOiAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vY2hhbm5lbC8nICsgZGF0YS5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogZGF0YS5jaGFubmVsVGl0bGUsXHJcbiAgICAgICAgICAgIGFjdGl2aXR5VHlwZTogZGF0YS5hY3Rpdml0eVR5cGUgfHwgJycsXHJcblxyXG4gICAgICAgICAgICBsaWtlczogZGF0YS5saWtlcyxcclxuICAgICAgICAgICAgdmlld3M6IGRhdGEudmlld3MsXHJcbiAgICAgICAgICAgIGNvbW1lbnRzOiBkYXRhLmNvbW1lbnRzLFxyXG5cclxuICAgICAgICAgICAgLy91c2VyOiBkYXRhWyBpIF0udXNlcixcclxuICAgICAgICAgICAgLy9uYW1lOiBkYXRhLml0ZW1zWyBpIF0udGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG1lZGlhOiBtZWRpYSxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgcG9zdElEOiBkYXRhLmZyb21JZCwgLy8/Pz9cclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEubWVzc2FnZS5pbmRleE9mKCd1cGxvYWRlZCBhIHZpZGVvJykgIT0gLTEgKSB0aGlzX2RhdHVtLm1lc3NhZ2UgPSAnJztcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBZb3VUdWJlRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuY29uc3RhbnRzJyxbXSkgIFxyXG4gIC5jb25zdGFudCgnYXBpVXJsJywgJ2h0dHBzOi8vZWNsaW5jaGVyLmNvbS9zZXJ2aWNlLycpXHJcbiAgLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHsgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyB9KTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuY29udHJvbGxlcnMnLCBbXSlcclxuXHJcbi5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGlvbmljTG9hZGluZywgQXV0aFNlcnZpY2UpIHtcclxuXHJcbiAgICAkc2NvcGUuZGF0YSA9IHt9O1xyXG4gICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIC8vJHN0YXRlLmdvKCd0YWJzLmhvbWUnKTtcclxuXHJcbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KHtcclxuICAgICAgICAgICAgbm9CYWNrZHJvcDogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIGEgPSBBdXRoU2VydmljZS5sb2dpbigkc2NvcGUuZGF0YS51c2VybmFtZSwgJHNjb3BlLmRhdGEucGFzc3dvcmQsIGZ1bmN0aW9uKHJlc3ApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1paWjonICsgcmVzcCk7XHJcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuXHJcbi5jb250cm9sbGVyKCdIb21lVGFiQ3RybCcsIGZ1bmN0aW9uKCRzdGF0ZSwgJHNjb3BlLCAkcm9vdFNjb3BlLCBFQywgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICR1cmxSb3V0ZXIsIF8pIHtcclxuXHJcblxyXG4gICAgY29uc29sZS5sb2coJ0FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQSEhISEhIyMjIyMnKTtcclxuICAgIFxyXG4gICAgaWYoICRyb290U2NvcGUuc29jaWFsICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyKTtcclxuXHJcbiAgICAkc2NvcGUuJG9uKFwiJGlvbmljVmlldy5lbnRlclwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAkc2NvcGUuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgnaG9tZScpKTtcclxuICAgIH0pO1xyXG4gICAgXHJcblxyXG4gICAgJHNjb3BlLmdyb3VwcyA9IFtdO1xyXG4gICAgJHNjb3BlLmFjY190eXBlcyA9IFtdO1xyXG5cclxuICAgIGlmKCBhY2NvdW50TWFuYWdlci5pc19yZW5kZXJlZCggKSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ29vb29vb29vb29vbycpO1xyXG4gICAgICAgIHByZXBhcmVBY2NvdW50cygpO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdubm5ubm5ubm5ubm4nKTtcclxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coe25vQmFja2Ryb3A6IHRydWV9KTtcclxuICAgICAgICBhY2NvdW50TWFuYWdlci5pbml0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgcHJlcGFyZUFjY291bnRzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gcHJlcGFyZUFjY291bnRzKClcclxuICAgIHtcclxuICAgICAgICB2YXIgQUNDUyA9IGFjY291bnRNYW5hZ2VyLmxpc3RfYWNjb3VudHMoKTtcclxuXHJcbiAgICAgICAgdmFyIHRlbXAgPSBbXSxcclxuICAgICAgICAgICAgYWNjX3R5cGVzID0gW107XHJcblxyXG4gICAgICAgIEFDQ1MuZm9yRWFjaChmdW5jdGlvbihhY2NvdW50LCBpbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IGFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRlbXBbdHlwZV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXS5wcm9maWxlcyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vZWxzZVxyXG4gICAgICAgICAgICAvL3tcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY2NvdW50LnByb2ZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWNjb3VudC5wcm9maWxlc1tpXS5tb25pdG9yZWQgPT0gJ29mZicpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHRlbXBbdHlwZV0ucHJvZmlsZXMucHVzaChhY2NvdW50LnByb2ZpbGVzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL31cclxuXHJcbiAgICAgICAgICAgIHRlbXBbdHlwZV0udHlwZSA9IHR5cGU7XHJcbiAgICAgICAgICAgIGlmIChhY2NfdHlwZXMuaW5kZXhPZih0eXBlKSA9PT0gLTEpIGFjY190eXBlcy5wdXNoKHR5cGUpO1xyXG5cclxuICAgICAgICAgICAgLy90ZW1wW3R5cGVdLnB1c2goIHsndHlwZSc6dHlwZSwgJ3Byb2ZpbGVzJzphY2NvdW50LnByb2ZpbGVzfSApO1xyXG5cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2codGVtcCk7XHJcbiAgICAgICAgJHNjb3BlLmdyb3VwcyA9IHRlbXA7XHJcbiAgICAgICAgJHNjb3BlLmFjY190eXBlcyA9IGFjY190eXBlcztcclxuXHJcbiAgICAgICAgYWNjb3VudE1hbmFnZXIuc2V0X3JlbmRlcmVkKCB0cnVlICk7XHJcblxyXG4gICAgICAgICRzY29wZS5vcGVuRmVlZHMgPSBmdW5jdGlvbiggcHJvZmlsZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9maWxlKTtcclxuICAgICAgICAgICAgcHJvZmlsZS5zb2NpYWwucmVuZGVyKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgJHNjb3BlLmducyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZ2V0RXhpc3RpbmdTdGF0ZSA9ICRzdGF0ZS5nZXQoJ3RhYnMucmFtLW5ldycpO1xyXG5cclxuICAgICAgICAgIGlmKGdldEV4aXN0aW5nU3RhdGUgIT09IG51bGwpe1xyXG4gICAgICAgICAgICByZXR1cm47IFxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBzdGF0ZSA9IHtcclxuICAgICAgICAgICAgICBcInVybFwiOiAnL3JhbS1uZXcnLFxyXG4gICAgICAgICAgICAgIFwidmlld3NcIjoge1xyXG4gICAgICAgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG4gICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcmFtLmh0bWxcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAkc3RhdGVQcm92aWRlclJlZi5zdGF0ZSgndGFicy5yYW0tbmV3Jywgc3RhdGUpO1xyXG5cclxuICAgICAgICAgICR1cmxSb3V0ZXIuc3luYygpO1xyXG4gICAgICAgICAgJHVybFJvdXRlci5saXN0ZW4oKTtcclxuXHJcbiAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMucmFtLW5ldycpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coZ2V0RXhpc3RpbmdTdGF0ZSk7XHJcbiAgICAgICAgICBcclxuXHJcbiAgICB9O1xyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdNYW5hZ2VBY2NvdW50cycsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCBFQywgJHJvb3RTY29wZSwgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQicpO1xyXG4gICAgY29uc29sZS5sb2coJyRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzJyk7XHJcbiAgICBjb25zb2xlLmxvZygkbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKGFjY291bnRNYW5hZ2VyLnRlc3QoKSk7XHJcbiAgICBcclxuICAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdob21lJykpO1xyXG5cclxuICAgICRzY29wZS5hY2NvdW50cyA9IGFjY291bnRNYW5hZ2VyLmFjY291bnRzKCk7XHJcblxyXG4gICAgY29uc29sZS5sb2coICRzY29wZS5hY2NvdW50cyApO1xyXG5cclxuICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlRW50ZXInLCBmdW5jdGlvbihldmVudCwgdmlld0RhdGEpIHtcclxuICAgICAgICB2aWV3RGF0YS5lbmFibGVCYWNrID0gdHJ1ZTtcclxuICAgICAgICB2aWV3RGF0YS5oYXNIZWFkZXJCYXIgPSB0cnVlO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHZpZXdEYXRhKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBidiA9ICRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKTtcclxuXHJcbiAgICAkc2NvcGUuJGlvbmljR29CYWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0tLS0tLJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYnYpO1xyXG5cclxuICAgICAgICBpZiAoYnYpIHtcclxuICAgICAgICAgICAgJGlvbmljSGlzdG9yeS5nb0JhY2soKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgICRzY29wZS5hZGRfYWNjb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICBhY2NvdW50TWFuYWdlci5hZGRfYWNjb3VudCh0eXBlKTtcclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLmNzdCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuYWNjb3VudHMpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGFjY291bnRNYW5hZ2VyLmFjY291bnRzKCkpO1xyXG4gICAgICAgIC8vYWNjb3VudE1hbmFnZXIuc2V0X3JlbmRlcmVkKCBmYWxzZSApO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdGZWVkcycsIGZ1bmN0aW9uKCRzY29wZSwgICRpb25pY1Njcm9sbERlbGVnYXRlLCAkc3RhdGUsICRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgRUMsICRpb25pY0hpc3RvcnksICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwsICRpb25pY0xvYWRpbmcsIGFjY291bnRNYW5hZ2VyLCAkbG9jYWxTdG9yYWdlKSB7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0MhISEhISMjIyMjJyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCckbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncycpO1xyXG4gICAgLy9jb25zb2xlLmxvZygkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcik7XHJcbiAgICAvL2NvbnNvbGUubG9nKCRzdGF0ZS5jdXJyZW50Lm5hbWUpO1xyXG4gICBcclxuICAgIFxyXG4gICAgXHJcbiAgICAkc2NvcGUubW9yZURhdGFDYW5CZUxvYWRlZCA9IGZhbHNlO1xyXG4gICAgJHNjb3BlLmNvdW50ZXIgPSAwO1xyXG5cclxuICAgIHZhciBpbmRleCA9IF8uZmluZExhc3RJbmRleCgkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlciwgeyAgcGFnZV9pZDogJHN0YXRlLmN1cnJlbnQubmFtZX0pO1xyXG4gICAgJHNjb3BlLmZlZWQgPSAkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcltpbmRleF07XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkKTtcclxuICAgIHZhciBuZXh0X3BhZ2VfaW5kZXggPSAwLFxyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IDAsXHJcbiAgICAgICAgbm9fb2ZfcGFnZXMgPSAkc2NvcGUuZmVlZC5wcm9maWxlLnNvY2lhbC51cGRhdGVkX3N0cmVhbXNfb3JkZXIubGVuZ3RoOy8vJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIubGVuZ3RoO1xyXG5cclxuICAgIGlmKCBpbmRleCA9PT0gMCApXHJcbiAgICB7XHJcbiAgICAgICAgbmV4dF9wYWdlX2luZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYoIGluZGV4ID09IChub19vZl9wYWdlcyAtIDEpIClcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSAwO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMjtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gaW5kZXggLSAxO1xyXG4gICAgfVxyXG5cclxuICAgICRzY29wZS5uZXh0X3BhZ2VfaWQgPSAkc2NvcGUuZmVlZC5wcm9maWxlLnNvY2lhbC51cGRhdGVkX3N0cmVhbXNfb3JkZXJbbmV4dF9wYWdlX2luZGV4XTsvLyRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW25leHRfcGFnZV9pbmRleF0ucGFnZV9pZDtcclxuICAgICRzY29wZS5wcmV2X3BhZ2VfaWQgPSAkc2NvcGUuZmVlZC5wcm9maWxlLnNvY2lhbC51cGRhdGVkX3N0cmVhbXNfb3JkZXJbcHJldl9wYWdlX2luZGV4XTsvLyRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW3ByZXZfcGFnZV9pbmRleF0ucGFnZV9pZDtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhpbmRleCk7XHJcbiAgICBjb25zb2xlLmxvZygkc2NvcGUuZmVlZCk7XHJcbiAgICBcclxuICAgICRzY29wZS50ZXN0X25hbWUgPSBbXTtcclxuICAgICRzY29wZS50ZXN0X25hbWUucHVzaCh7J25hbWUnOidSYW0nfSk7XHJcbiAgICAkc2NvcGUuZ2V0U2Nyb2xsUG9zaXRpb24gPSBmdW5jdGlvbigpIHsgICAgICAgXHJcbiAgICBcclxuICAgICAgICBcclxuICAgIH07XHJcbiAgICBcclxuICAgICRzY29wZS5mZWVkLmRkID0geyAnY291bnQnOjAsICdkYXRhJzpbXSwgJ3BsYWNlaG9sZGVyJzogJyd9O1xyXG4gICAgJHNjb3BlLnNlbGVjdGVkX2RkID0ge307XHJcblxyXG4gICAgJHNjb3BlLiR3YXRjaCgnZmVlZC5kcm9wZG93bl9mZWVkJywgZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5kcm9wZG93bl9mZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNTU1NTU1NTU1NTU1NTU1NTScpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmopO1xyXG4gICAgICAgICAgICAkc2NvcGUuZmVlZC5kZCA9ICRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5nZXRfZHJvcGRvd24oKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCAhJHNjb3BlLmZlZWQuZGQuZGF0YS5sZW5ndGggKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnc2Nyb2xsLmluZmluaXRlU2Nyb2xsQ29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5tb3JlZGF0YSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRfZGQgPSAkc2NvcGUuZmVlZC5kZC5kYXRhWzBdO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmxvYWRNb3JlKCk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ2ZlZWQuaXRlbXMnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiggJHNjb3BlLmZlZWQuaXRlbXMubGVuZ3RoIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSicpO1xyXG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnc2Nyb2xsLmluZmluaXRlU2Nyb2xsQ29tcGxldGUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgJHNjb3BlLiR3YXRjaCgnZmVlZC5sb2FkX21vcmVfZmxhZycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCAhJHNjb3BlLmZlZWQubG9hZF9tb3JlX2ZsYWcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgJHNjb3BlLm1vcmVkYXRhID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICAkc2NvcGUubW9yZWRhdGEgPSBmYWxzZTtcclxuXHJcbiAgICAkc2NvcGUubG9hZE1vcmUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5kcm9wZG93bl9mZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggISAkc2NvcGUuZmVlZC5pdGVtcy5sZW5ndGggJiYgJHNjb3BlLmNvdW50ZXIgPT0gMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmxhc3RfbG9hZGVkX3RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouc2V0X2RlZmF1bHRfZ3JvdXBfaWQoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kYXRhKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdsb2FkIG1vcmUuLi4uLi4uLi4uLi4uLi4uLi4uLi4nKTtcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhICRzY29wZS5mZWVkLml0ZW1zLmxlbmd0aCAmJiAhICRzY29wZS5jb3VudGVyIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9sb2FkZWRfdGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5nZXRfZGF0YSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQubW9yZSgpO1xyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuXHJcbiAgICAgICAgJHNjb3BlLmNvdW50ZXIrKzsgICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgJHNjb3BlLmxvYWRNb3JlKCk7XHJcbiAgICBcclxuICAgICRzY29wZS5wcm9jZXNzREQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnNlbGVjdGVkX2RkKTtcclxuICAgICAgICAkc2NvcGUuZmVlZC5pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAkc2NvcGUuY291bnRlciA9IDE7XHJcbiAgICAgICAgJHNjb3BlLmxvYWRNb3JlKCk7XHJcblxyXG4gICAgICAgIC8vJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLnNldF9kZWZhdWx0X2dyb3VwX2lkKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAvLyRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5nZXRfZGF0YSggJHNjb3BlLnNlbGVjdGVkX2RkICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuJG9uKFwiJGlvbmljVmlldy5lbnRlclwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZGVsZWdhdGUgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZS4kZ2V0QnlIYW5kbGUoJ21haW5TY3JvbGwnKTtcclxuICAgICAgICAvL2RlbGVnYXRlLnNjcm9sbFRvKCAwLCAkc2NvcGUuZmVlZC5sYXN0X3Njcm9sbF9wb3NpdGlvbiApO1xyXG4gICAgICAgICRzY29wZS4kcGFyZW50LiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ2ZlZWQnKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJG9uKFwiJGlvbmljVmlldy5iZWZvcmVMZWF2ZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb24gPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZS4kZ2V0QnlIYW5kbGUoJ21haW5TY3JvbGwnKS5nZXRTY3JvbGxQb3NpdGlvbigpO1xyXG4gICAgICAgICRzY29wZS5mZWVkLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uID0gcG9zaXRpb24udG9wO1xyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcblxyXG4gICAgXHJcblxyXG4gICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgIHZpZXdEYXRhLmhhc0hlYWRlckJhciA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG5cclxuXHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignUHVibGlzaGluZycsIGZ1bmN0aW9uKCRzY29wZSwgRUMsIGFjY291bnRNYW5hZ2VyKSB7XHJcblxyXG4gICAgXHJcblxyXG4gICAkc2NvcGUuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgncHVibGlzaGluZycpKTtcclxuXHJcbiAgICBcclxuXHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignUG9zdFNldHRpbmdzJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRyb290U2NvcGUsICRpb25pY0hpc3RvcnksICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwsICRpb25pY0xvYWRpbmcsIGFjY291bnRNYW5hZ2VyKSB7XHJcblxyXG4gICAgICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlRW50ZXInLCBmdW5jdGlvbihldmVudCwgdmlld0RhdGEpIHtcclxuICAgICAgICAgICAgdmlld0RhdGEuZW5hYmxlQmFjayA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHZpZXdEYXRhKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICAgICAkc2NvcGUuJGlvbmljR29CYWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdLS0tLSycpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgICAgICBpZiAoYnYpIHtcclxuICAgICAgICAgICAgICAgICRpb25pY0hpc3RvcnkuZ29CYWNrKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMubGlzdCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSlcclxuICAgIC5jb250cm9sbGVyKCdCdXR0b25zVGFiQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCkge1xyXG5cclxuICAgICAgICAkc2NvcGUuc2hvd1BvcHVwID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY1BvcHVwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnUG9wdXAnLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1RoaXMgaXMgaW9uaWMgcG9wdXAgYWxlcnQhJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5zaG93QWN0aW9uc2hlZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJGlvbmljQWN0aW9uU2hlZXQuc2hvdyh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZVRleHQ6ICdJb25pYyBBY3Rpb25TaGVldCcsXHJcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdGYWNlYm9vaydcclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnVHdpdHRlcidcclxuICAgICAgICAgICAgICAgIH0sIF0sXHJcbiAgICAgICAgICAgICAgICBkZXN0cnVjdGl2ZVRleHQ6ICdEZWxldGUnLFxyXG4gICAgICAgICAgICAgICAgY2FuY2VsVGV4dDogJ0NhbmNlbCcsXHJcbiAgICAgICAgICAgICAgICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDQU5DRUxMRUQnKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBidXR0b25DbGlja2VkOiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCVVRUT04gQ0xJQ0tFRCcsIGluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBkZXN0cnVjdGl2ZUJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdERVNUUlVDVCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfSlcclxuXHJcbi5jb250cm9sbGVyKCdTbGlkZWJveEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRpb25pY1NsaWRlQm94RGVsZWdhdGUpIHtcclxuICAgICRzY29wZS5uZXh0U2xpZGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAkaW9uaWNTbGlkZUJveERlbGVnYXRlLm5leHQoKTtcclxuICAgIH07XHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignTWVudUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRpb25pY1NpZGVNZW51RGVsZWdhdGUsICRpb25pY01vZGFsKSB7XHJcblxyXG5cclxuICAgICRzY29wZS51cGRhdGVTaWRlTWVudSA9IGZ1bmN0aW9uKG1lbnUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhtZW51KTtcclxuICAgICAgICAkc2NvcGUubWVudUl0ZW1zID0gbWVudTtcclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICAkaW9uaWNNb2RhbC5mcm9tVGVtcGxhdGVVcmwoJ3RlbXBsYXRlcy9tb2RhbC5odG1sJywgZnVuY3Rpb24obW9kYWwpIHtcclxuICAgICAgICAkc2NvcGUubW9kYWwgPSBtb2RhbDtcclxuICAgIH0sIHtcclxuICAgICAgICBhbmltYXRpb246ICdzbGlkZS1pbi11cCdcclxuICAgIH0pO1xyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ0FwcEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJHJvb3RTY29wZSkge1xyXG5cclxuICAgICRyb290U2NvcGUubWVudUl0ZW1zID0gW107XHJcblxyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuZGlyZWN0aXZlcycsIFtdKVxyXG5cclxuLmRpcmVjdGl2ZSgncG9zaXRpb25CYXJzQW5kQ29udGVudCcsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XHJcblxyXG4gcmV0dXJuIHtcclxuICAgIFxyXG4gICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgIHNjb3BlOiB7XHJcbiAgICAgICAgZGRGZWVkOiAnPWRkRmVlZCdcclxuICAgIH0sXHJcblxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIFxyXG5cclxuICAgICAgY29uc29sZS5sb2coJ0tBS0FLQUtBS0tBS0FLQUs6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OjonKTtcclxuICAgICAgY29uc29sZS5sb2coc2NvcGUuZGRGZWVkKTtcclxuICAgICAgZG9Qcm9jZXNzKCk7XHJcblxyXG4gICAgICBzY29wZS4kd2F0Y2goJ2RkRmVlZCcsIGZ1bmN0aW9uKG52KXtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0FLQUtBS0FLS0FLQUtBSzo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG52KTtcclxuICAgICAgICBkb1Byb2Nlc3MoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBkb1Byb2Nlc3MoKVxyXG4gICAgICB7XHJcbiAgICAgICAgICB2YXIgb2Zmc2V0VG9wID0gMDtcclxuICAgICAgICAgIHZhciBwbGF0Zm9ybSA9ICdpb3MnOy8vJGNvcmRvdmFEZXZpY2UuZ2V0UGxhdGZvcm0oKTtcclxuICAgICAgICAgIHBsYXRmb3JtID0gcGxhdGZvcm0udG9Mb3dlckNhc2UoKTsgICAgXHJcblxyXG5cclxuICAgICAgICAgIC8vIEdldCB0aGUgcGFyZW50IG5vZGUgb2YgdGhlIGlvbi1jb250ZW50XHJcbiAgICAgICAgICB2YXIgcGFyZW50ID0gYW5ndWxhci5lbGVtZW50KGVsZW1lbnRbMF0ucGFyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgdmFyIG1faGVhZGVyID0gIHBhcmVudFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdiYXItaGVhZGVyJyk7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IGFsbCB0aGUgaGVhZGVycyBpbiB0aGlzIHBhcmVudFxyXG4gICAgICAgICAgdmFyIHNfaGVhZGVycyA9IHBhcmVudFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdiYXItc3ViaGVhZGVyJyk7XHJcbiAgICAgICAgICB2YXIgaV9jb250ZW50ID0gcGFyZW50WzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpb24tY29udGVudCcpO1xyXG5cclxuICAgICAgICAgIGlmKCBtX2hlYWRlci5sZW5ndGggKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBvZmZzZXRUb3AgPSBtX2hlYWRlclswXS5vZmZzZXRIZWlnaHQgKyAocGxhdGZvcm0gPT0gJ2lvcyc/MjA6MCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgdGhlIGhlYWRlcnNcclxuICAgICAgICAgIGZvcih4PTA7eDxzX2hlYWRlcnMubGVuZ3RoO3grKylcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgdGhlIG1haW4gaGVhZGVyIG9yIG5hdi1iYXIsIGFkanVzdCBpdHMgcG9zaXRpb24gdG8gYmUgYmVsb3cgdGhlIHByZXZpb3VzIGhlYWRlclxyXG4gICAgICAgICAgICBpZih4ID49IDApIHtcclxuICAgICAgICAgICAgICBzX2hlYWRlcnNbeF0uc3R5bGUudG9wID0gb2Zmc2V0VG9wICsgJ3B4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQWRkIHVwIHRoZSBoZWlnaHRzIG9mIGFsbCB0aGUgaGVhZGVyIGJhcnNcclxuICAgICAgICAgICAgb2Zmc2V0VG9wID0gb2Zmc2V0VG9wICsgc19oZWFkZXJzW3hdLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgIH0gICAgICBcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUG9zaXRpb24gdGhlIGlvbi1jb250ZW50IGVsZW1lbnQgZGlyZWN0bHkgYmVsb3cgYWxsIHRoZSBoZWFkZXJzXHJcbiAgICAgICAgICBpX2NvbnRlbnRbMF0uc3R5bGUudG9wID0gb2Zmc2V0VG9wICsgJ3B4JztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07ICBcclxufSlcclxuXHJcbi5kaXJlY3RpdmUoJ2hpZGVUYWJzJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSwgJGVsKSB7XHJcbiAgICAgICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzID0gJ3RhYnMtaXRlbS1oaWRlJztcclxuICAgICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgJHJvb3RTY29wZS5oaWRlVGFicyA9ICcnO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlQWNjb3VudCcsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGFjY291bnQ6ICc9YWNjb3VudCdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtYWNjb3VudC5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUuY3YgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgICAgICBhbGVydCg1NSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgb2JqLnJlZnJlc2hBY2NvdW50KCk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLmRlbGV0ZUFjY291bnQgPSBmdW5jdGlvbiggb2JqICl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9iaik7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlUHJvZmlsZScsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIHByb2ZpbGU6ICc9cHJvZmlsZSdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtcHJvZmlsZS5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUudmFsaWRhdGVDaGVjayA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIC8vb2JqLm5ld19rZXkgPSAnZnJvbSBkaXJlY3RpdmUnO1xyXG4gICAgICAgICAgICAvL2FsZXJ0KG9iai5nZXRVc2VyTmFtZSgpKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgICAgb2JqLnVwZGF0ZV9tb25pdG9yKG9iai5wcm9maWxlX2NoZWNrZWQpO1xyXG4gICAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnZmVlZEl0ZW0nLCBmdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBpdGVtOiAnPWl0ZW0nXHJcbiAgICAgIH0sXHJcbiAgICAgIHRlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvZmVlZC1pdGVtLmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS5jdiA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIGFsZXJ0KDU1KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLmRhdGEgPSBzY29wZS5pdGVtLmdldFVJRGF0YSgpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBzY29wZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuZGVsZXRlQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH07XHJcbn0pO1xyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPSBbJyRzdGF0ZVByb3ZpZGVyJywgJyR1cmxSb3V0ZXJQcm92aWRlcicsJyRpb25pY0NvbmZpZ1Byb3ZpZGVyJywgXHJcblx0ZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRpb25pY0NvbmZpZ1Byb3ZpZGVyKSB7XHJcblxyXG5cdFx0ICAkc3RhdGVQcm92aWRlclxyXG5cdFx0ICAgICAgLnN0YXRlKCdsb2dpbicsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxyXG5cdFx0ICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvbG9naW4uaHRtbFwiLFxyXG5cdFx0ICAgICAgICBjb250cm9sbGVyOiBcIkxvZ2luQ3RybFwiXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL21lbnVcIixcclxuXHRcdCAgICAgICAgYWJzdHJhY3Q6IHRydWUsXHJcblx0XHQgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9tZW51Lmh0bWxcIixcclxuXHRcdCAgICAgICAgY29udHJvbGxlcjogJ01lbnVDdHJsJ1xyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIFxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmhvbWUnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvaG9tZVwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdob21lLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9ob21lLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdIb21lVGFiQ3RybCdcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMubWFuYWdlX2FjY291bnRzJywge1xyXG5cdFx0ICAgICAgXHR1cmw6IFwiL21hbmFnZV9hY2NvdW50c1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdob21lLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9tYW5hZ2VfYWNjb3VudHMuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ01hbmFnZUFjY291bnRzJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5wdWJsaXNoaW5nJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3B1Ymxpc2hpbmdcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAncHVibGlzaGluZy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcHVibGlzaC5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnUHVibGlzaGluZydcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMucG9zdF9zZXR0aW5ncycsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9wb3N0X3NldHRpbmdzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ3B1Ymxpc2hpbmctdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3Bvc3Rfc2V0dGluZ3MuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ1Bvc3RTZXR0aW5ncydcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaW5ib3gnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvaW5ib3hcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnaW5ib3gtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2luYm94Lmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5mZWVkcycsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9mZWVkc1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdmZWVkcy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvZmVlZHMuaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaXRlbScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9pdGVtXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2xpc3QtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2l0ZW0uaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmZvcm0nLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvZm9ybVwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdmb3JtLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9mb3JtLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgnbWVudS5rZXlib2FyZCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9rZXlib2FyZFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9rZXlib2FyZC5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAvKi5zdGF0ZSgnbWVudS5sb2dpbicsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9sb2dpblwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9sb2dpbi5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pKi9cclxuXHRcdCAgICAgIC5zdGF0ZSgnbWVudS5zbGlkZWJveCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9zbGlkZWJveFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9zbGlkZWJveC5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnU2xpZGVib3hDdHJsJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgnbWVudS5hYm91dCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9hYm91dFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdtZW51Q29udGVudCc6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9hYm91dC5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pO1xyXG5cclxuXHRcdCAgICAvLyR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJtZW51L3RhYi9idXR0b25zXCIpO1xyXG5cdFx0ICAgIC8qaWYoICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhIClcclxuXHRcdCAgICB7XHJcblx0XHQgICAgXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwiL2hvbWVcIik7XHJcblx0XHQgICAgfVxyXG5cdFx0ICAgIGVsc2VcclxuXHRcdCAgICB7XHJcblx0XHQgICAgXHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwibG9naW5cIik7XHJcblx0XHQgICAgfSovXHJcblx0XHQgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcImxvZ2luXCIpO1xyXG5cclxuXHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudGFicy5wb3NpdGlvbihcImJvdHRvbVwiKTsgLy9QbGFjZXMgdGhlbSBhdCB0aGUgYm90dG9tIGZvciBhbGwgT1NcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci5uYXZCYXIuYWxpZ25UaXRsZShcImNlbnRlclwiKTtcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci50YWJzLnN0eWxlKFwic3RhbmRhcmRcIik7XHJcblxyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnZpZXdzLm1heENhY2hlKDApO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnZpZXdzLnRyYW5zaXRpb24oJ25vbmUnKTtcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci52aWV3cy5mb3J3YXJkQ2FjaGUodHJ1ZSk7XHJcblx0XHQgICAgXHJcblx0XHQgICAgJHN0YXRlUHJvdmlkZXJSZWYgPSAkc3RhdGVQcm92aWRlcjtcclxuICAgICAgXHRcdCR1cmxSb3V0ZXJQcm92aWRlclJlZiA9ICR1cmxSb3V0ZXJQcm92aWRlcjtcclxuXHRcdH1cclxuXTsiLCIvKlxyXG5cdEFjY291bnQgTWFuYWdlciBTZXJ2aWNlc1xyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnZWNsaW5jaGVyLnNlcnZpY2VzLmFjY291bnRNYW5hZ2VyJywgW10pXHJcblxyXG5cdFx0LmZhY3RvcnkoJ2FjY291bnRNYW5hZ2VyJywgcmVxdWlyZSgnLi9hcHAvYWNjb3VudC9hY2NvdW50LW1hbmFnZXInKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnQWNjb3VudCcsIHJlcXVpcmUoJy4vYXBwL2FjY291bnQvYWNjb3VudCcpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnUHJvZmlsZScsIHJlcXVpcmUoJy4vYXBwL2FjY291bnQvcHJvZmlsZScpKTsiLCIvKlxyXG5cdFNvY2lhbCBNYW5hZ2VyIFNlcnZpY2VzXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuc2VydmljZXMuc29jaWFsTWFuYWdlcicsIFtdKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdzb2NpYWxNYW5hZ2VyJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsLW1hbmFnZXInKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9mZWVkJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9GZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnVGltZWxpbmVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC90aW1lbGluZUZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdMaW5rZWRpbkZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2xpbmtlZGluRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0Ryb3Bkb3duRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbScpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdMaW5rZWRpbkZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2xpbmtlZGluRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0luc3RhZ3JhbUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL0luc3RhZ3JhbUZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvY29sbGFwc2libGVGZWVkSXRlbScpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvbGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9Ud2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnRmFjZWJvb2tGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2ZhY2Vib29rRmVlZCcpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdMaW5rZWRpbkZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvbGlua2VkaW5GZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1R3aXR0ZXJGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3R3aXR0ZXJGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0Jsb2dnZXJGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2Jsb2dnZXJGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0dvb2dsZVBsdXNGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2dvb2dsZXBsdXNGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1BpbnRlcmVzdEZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvcGludGVyZXN0RmVlZCcpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdZb3VUdWJlRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC95b3VUdWJlRmVlZCcpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdJbnN0YWdyYW1GZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2luc3RhZ3JhbUZlZWQnKSk7IiwibW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnZWNsaW5jaGVyLnNlcnZpY2VzJywgW10pXHJcblxyXG4uZmFjdG9yeSgnRUMnLCByZXF1aXJlKCcuL2FwcC9lYy11dGlsaXR5JykpXHJcblxyXG4vL3NlcnZpY2UgZm9yIGF1dGhlbnRpY2F0aW9uXHJcbi5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uKCRxLCAkaHR0cCwgYXBpVXJsLCBFQykge1xyXG5cclxuICAgIHZhciBpc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xyXG4gICAgdmFyIExPQ0FMX1RPS0VOX0tFWSA9ICd1c2VyX2NyZWRlbnRpYWxzJztcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZFVzZXJDcmVkZW50aWFscygpIHtcclxuICAgICAgICB2YXIgdWMgPSB3aW5kb3cubG9jYWxTdG9yYWdlLmdldEl0ZW0oTE9DQUxfVE9LRU5fS0VZKTtcclxuICAgICAgICBpZiAodWMpIHtcclxuICAgICAgICAgICAgdXNlQ3JlZGVudGlhbHModWMpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIHN0b3JlVXNlckNyZWRlbnRpYWxzKHVjKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5zZXRJdGVtKExPQ0FMX1RPS0VOX0tFWSwgdWMpO1xyXG4gICAgICAgIHVzZUNyZWRlbnRpYWxzKHVjKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1c2VDcmVkZW50aWFscyh1Yykge1xyXG4gICAgICAgIGlzQXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codWMpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gU2V0IHRoZSB1YyBhcyBoZWFkZXIgZm9yIHlvdXIgcmVxdWVzdHMhXHJcbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24udWlkID0gdWMudWlkO1xyXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLmF1dGhvcml6YXRpb25Ub2tlbiA9IHVjLmF1dGhvcml6YXRpb25Ub2tlbjtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZXN0cm95VXNlckNyZWRlbnRpYWxzKCkge1xyXG4gICAgICAgIGlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xyXG4gICAgICAgIC8vJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24udWlkID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIC8vJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24uYXV0aG9yaXphdGlvblRva2VuID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbShMT0NBTF9UT0tFTl9LRVkpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBsb2dpbiA9IGZ1bmN0aW9uKG5hbWUsIHBhc3N3b3JkLCBjYWxsYmFjaykge1xyXG5cclxuICAgICAgICB2YXIgcmVxID0ge1xyXG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiBhcGlVcmwgKyAndXNlci9sb2dpbicsXHJcbiAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgICAgICdlbWFpbCc6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3Bhc3N3b3JkJzogcGFzc3dvcmRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdChyZXEpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soJzIyMjInKTtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1lZWVlZWVlZWScpO1xyXG4gICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIC8vJGlvbmljSGlzdG9yeS5jdXJyZW50VmlldygkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCkpOy8vJGlvbmljSGlzdG9yeS5jdXJyZW50VmlldyhudWxsKTtcclxuICAgICAgICAgICAgICAgIC8vJHN0YXRlLmdvKCdhcHAuc2FmZXR5TGVzc29ucycpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmdW5jdGlvbihlcnJfbXNnKSB7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdaWlpaWlpaWlonKTtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCczMzMzJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGxvZ291dCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGRlc3Ryb3lVc2VyQ3JlZGVudGlhbHMoKTtcclxuICAgIH07XHJcblxyXG4gICAgbG9hZFVzZXJDcmVkZW50aWFscygpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgbG9naW46IGxvZ2luLFxyXG4gICAgICAgIGxvZ291dDogbG9nb3V0LFxyXG4gICAgICAgIGlzQXV0aGVudGljYXRlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpc0F1dGhlbnRpY2F0ZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0pXHJcblxyXG4uZmFjdG9yeSgnVXNlclNldHRpbmdzJywgcmVxdWlyZSgnLi9hcHAvc2V0dGluZ3MtbWFuYWdlcicpKSBcclxuIFxyXG4gXHJcblxyXG4uZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCh7XHJcbiAgICAgICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWRcclxuICAgICAgICAgICAgfVtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmNvbmZpZyhmdW5jdGlvbigkaHR0cFByb3ZpZGVyKSB7XHJcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKCdBdXRoSW50ZXJjZXB0b3InKTtcclxufSk7XHJcbiJdfQ==
