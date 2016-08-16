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
              
              
},{"./app-main":1,"./constants":33,"./controllers":34,"./directives":35,"./router":36,"./service-account-manager":37,"./service-social-manager":38,"./services":39}],3:[function(require,module,exports){
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
        $ionicLoading) {

        var favorites = [],
            searches = [];
        this.request = function(request) {
            $http.defaults.headers.common.user_data = $localStorage.user_data;
            $http.defaults.headers.common.is_mobile_app = '1';
            console.log('KKKK');
            return $q(function(resolve, reject) {

                //If the request url is not full-format , just append api-url
                if (request.url.indexOf(apiUrl) !== 0) {
                    request.url = apiUrl + request.url;
                }

                if (request.method === undefined)
                    request.method = request.type;

                //$ionicLoading.show();

                if (request.method == 'GET') {
                    request.params = request.data;
                }

                $http(request)
                    .then(function(response) {
                            //$ionicLoading.hide();

                            var user_data = response.data;
                            console.log(response);
                            console.log(response.headers('ec_data'));
                            $localStorage.user_data = response.headers('ec_data');


                            resolve(response.data);


                        },
                        function() {
                            //$ionicLoading.hide();
                            reject('There is some connectivity issue .Please try again later.');
                        }
                    );


            });
        };

        this.getApiUrl = function() {
            return apiUrl;
        };

        this.isEmptyObject = function(obj) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key))
                    return false;
            }

            return true;
        };

        this.replace_type_in_username = function(username) {
            return $.trim(username).replace(/( \(User\)$| \(Profile\)$| \(Page\)$| \(Company Page\)$)/, '');
        };

        this.for_each = function(array, fn) {
            array = Array.isArray(array) ? array : [array];

            for (var index = 0, length = array.length; index < length; ++index) fn(array[index], index, length);
        };

        this.tw_deep_link_to_html = function(text, raw_data) {
            text = text || '';

            var deep_link = 'https://twitter.com/messages/compose?recipient_id=';

            if (raw_data.entities && raw_data.entities.urls) {
                this.for_each(raw_data.entities.urls, function(url) {
                    if (url.url && url.expanded_url && url.expanded_url.indexOf(deep_link) !== -1) {
                        var expanded_url = url.expanded_url,
                            recipient_id = expanded_url.replace(deep_link, '');

                        var message_me = '<div class="message-me" data-recipient="' + recipient_id + '">' +
                            '<svg class="message-me-icon" viewBox="0 0 56 54" version="1.1" fill="currentColor"></svg>' +

                            '<span class="message-me-text">Send a private message</span>' +
                            '</div>';

                        text = text.replace(url.url, message_me);
                        text = text.replace(url.expanded_url, message_me);
                    }
                });

            }
            return text;
        };

        this.url_to_link = function(text, target) {
            var exp = /(\b((https?|ftp|file):\/\/|bit.ly\/|goo.gl\/|t.co\/)[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

            function replacer(match) {
                return "<a href='" + (match.indexOf('//') == -1 ? '//' + match : match) + "' " +
                    (typeof target == 'undefined' ? 'target="_blank"' : 'target="' + target + '"') + ">" + match + "</a>";
            }

            if (typeof text == 'string') return text.replace(exp, replacer);

            else return '';
        };

        this.tw_user_mentions_to_links = function(text, raw_data) {
            text = text || '';

            var user_mentions;

            if (raw_data.entities !== undefined && raw_data.entities.user_mentions !== undefined && raw_data.entities.user_mentions.screen_name !== undefined) {
                user_mentions = raw_data.entities.user_mentions.screen_name;

                if (!Array.isArray(user_mentions)) user_mentions = [user_mentions];
            }

            user_mentions = user_mentions || [];

            for (var i = 0, l = user_mentions.length; i < l; i++) {
                var screen_name = user_mentions[i];

                var exp = new RegExp('@' + screen_name, 'ig');

                text = text.replace(exp, '<a class="tw-user" href="https://twitter.com/' + screen_name +
                    '" target="_blank"  data-user="@' + screen_name + '">@' + screen_name + '</a>');
            }

            return text;

        };

        this.hashtag_to_link = function(text, network) {
            var exp = /\B#(\w*[a-zA-Z]+\w*)/ig,
                linked = '';

            if ($.isArray(text)) text = text[0];

            if (typeof text !== 'undefined') // maybe if text != undefined
                if (network === 'twitter')
                    linked = text.replace(exp, "<a class='tw-hashtag' href='https://twitter.com/search?q=%23$1' target='_blank' data-query='%23$1'>#$1</a>");
                else if (network === 'facebook')
                linked = text.replace(exp, "<a href='https://www.facebook.com/hashtag/$1' target='_blank'>#$1</a>"); // https://www.facebook.com/hashtag/nba?hc_location=ufi
            else
                linked = text.replace(exp, "<a href='https://twitter.com/search?q=%23$1' target='_blank'>#$1</a>");

            return linked;
        };

        this.fb_tags_to_links = function(text, tags, type) {
            var self = this;

            if (!Array.isArray(tags)) tags = [tags];

            tags.sort(function(a, b) {
                return parseInt(a.offset) - parseInt(b.offset);
            });

            var result = [],
                cur_offset = 0,
                result_str = '',
                tag, length, offset, multitags = {};

            for (var i = 0, l = tags.length; i < l; i++) {
                tag = tags[i];

                offset = parseInt(tag.offset);

                length = parseInt(tag.length);

                if (cur_offset <= offset) {
                    result.push(text.substring(cur_offset, offset));

                    cur_offset = offset + length;

                    //result.push( tag.link );
                    result.push({
                        id: tag.id,
                        name: (tag.name == undefined || $.isEmptyObject(tag.name) ? text.substr(offset, length) : tag.name),
                        type: tag.type,
                        link: tag.link
                    });
                } else //multitags
                {
                    if (multitags[tag.offset] == undefined) {
                        var prev_link = result.pop();

                        multitags[tag.offset] = {
                            offset: offset,
                            length: length,
                            name: text.substr(offset, length),
                            tags: [{
                                name: tags[i - 1].name,
                                link: prev_link
                            }, {
                                name: tag.name,
                                link: tag.link
                            }]
                        };

                        result.push('_$mt$_' + offset + text.substr(offset, length));
                    } else //add multitag
                        multitags[tag.offset].tags.push({
                        name: tag.name,
                        link: tag.link
                    });
                }
            }
            result.push(text.substring(cur_offset));

            //result_str = url_to_link( result.join('') );
            for (var i = 0, l = result.length; i < l; i++) {
                var item = result[i];

                if (typeof item == 'object') //tag
                {
                    result_str += '<a class="fb-' + item.type + '" href="' + item.link + '" target="_blank" data-user="' +
                        item.id + '">' + item.name + '</a>';
                } else result_str += self.url_to_link(item);
            }

            /*for ( var i = 0, l = tags.length; i < l; i++ )
            {
                if ( multitags[ tags[ i ].offset ] == undefined )
                {
                    result_str = result_str.replace( '>' + tags[ i ].link + '<', '>' + tags[ i ].name + '<' );  
                }  
            }*/

            for (var offset in multitags) {
                var multitag = multitags[offset];

                var tt = '';
                for (var k = 0, l = multitag.tags.length; k < l; k++) {
                    if (k < 3) tt = tt + (tt.length == 0 ? '' : ', ') + multitag.tags[k].name;
                }
                if (multitag.tags.length > 3) tt = tt + ', ...';

                result_str = result_str.replace('_$mt$_' + multitag.offset + multitag.name, '<span class="multitag" data-tooltip="' +
                    tt + '" data-offset="' + type + '_' + multitag.offset + '">' + multitag.name + '</span>');
            }

            return result_str;
        };

        this.FB_thumbnail_to_full_size = function(url) {
            var url_n = url;

            if (url.indexOf("?") == -1) {
                if (url.indexOf("_s.jpg") != -1) url_n = url.replace("_s.jpg", "_n.jpg");

                else {
                    if (url.indexOf("_s.jpeg") != -1) url_n = url.replace("_s.jpeg", "_n.jpeg");

                    else url_n = url.replace("_s.png", "_n.png");
                }
            }

            return url_n;
        };


        this.replaceURLWithHTMLLinks = function(text, newWindow) {
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            var exp_www = /^(\b(?!(https?|ftp|file))(www[.])[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            if (newWindow) {
                text = text.replace(exp, "<a href='$1' target='_blank'>$1</a>");
                text = text.replace(exp_www, "<a href='http://$1' target='_blank'>$1</a>");
            } else {
                text = text.replace(exp, "<a href='$1'>$1</a>");
                text = text.replace(exp_www, "<a href='http://$1'>$1</a>");
            }
            return text;
        };

        this.post_likes_text = function ( count, liked, dislike )
        {
          var self = this;
          
            var ending = 's',
                you = '',
                like = dislike ? ' dislike' : ' like';

            if ( liked ) {
                count--;
                you = "You + ";
            }

            if ( count == 1 ) ending = '';

            //just in case
            if ( count < 0 ) count = 0; 
                
            return you + self.numberWithCommas( count ) + like + ending;
        };

        this.numberWithCommas = function (x) {
            if(x==undefined)return '';
            var parts = x.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        };

        this.getSideMenu = function(type) {
            var sideMenu = [];

            switch (type) {
                case 'home':

                    sideMenu = [{
                        label: 'Add & Manage Account',
                        action: 'tabs.manage_accounts'
                    }, {
                        label: 'Account Settings',
                        action: 'tabs.manage_accounts'
                    }, {
                        label: 'FAQ',
                        action: ''
                    }, {
                        label: 'Logout',
                        action: ''
                    }];

                    break;

                case 'publishing':

                    sideMenu = [{
                        label: 'Account Settings',
                        action: 'tabs.manage_accounts'
                    }, {
                        label: 'Post Settings',
                        action: 'tabs.post_settings'
                    }, {
                        label: 'FAQ',
                        action: ''
                    }, {
                        label: 'Logout',
                        action: ''
                    }];

                    break;

                case 'feed':

                    sideMenu = [{
                        label: 'Settings',
                        action: 'tabs.feed_settings'
                    }, {
                        label: 'Add to Favorites',
                        action: 'tabs.feed_settings'
                    }, {
                        label: 'FAQ',
                        action: ''
                    }, {
                        label: 'Logout',
                        action: ''
                    }];

                    break;


            }

            return sideMenu;
        };

        this.getWatchCount = function() {
            var root = angular.element(document.getElementsByTagName('html'));

            var watchers = [];

            var f = function(element) {
                angular.forEach(['$scope', '$isolateScope'], function(scopeProperty) {
                    if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
                        angular.forEach(element.data()[scopeProperty].$$watchers, function(watcher) {
                            watchers.push(watcher);
                        });
                    }
                });

                angular.forEach(element.children(), function(childElement) {
                    f(angular.element(childElement));
                });
            };

            f(root);

            // Remove duplicate watchers
            var watchersWithoutDuplicates = [];
            angular.forEach(watchers, function(item) {
                if (watchersWithoutDuplicates.indexOf(item) < 0) {
                    watchersWithoutDuplicates.push(item);
                }
            });

            return watchersWithoutDuplicates.length;
        };

        return this;



    }
];
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







},{}],11:[function(require,module,exports){
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







},{}],12:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$compile', function( $compile ){  

    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      //templateUrl: 'templates/directives/feed-item.html',
      link:function(scope, element, attrs){
          scope.cv = function(obj){
            alert(55);
            
          };
          
          scope.data = scope.item.getUIData();
          
          var template = '<div class="card">' +
                            '<div class="item item-avatar">' +
                              '<img src="{{::data.profileImg}}">' +
                              '<h2>{{::data.profileName}}</h2>' +
                              '<p>{{::data.time}}</p>' +
                            '</div>' +
                            '<div class="item item-body" ng-click="refreshAccount(item)">' +
                              '<p class="test">RAMAMMAMAMAMAMAM...</p>' +
                              '<p ng-bind-html="data.itemText"></p>' +
                              '<p ng-bind-html="data.itemMedia"></p>' +
                              '<p>' +
                                '<a href="#" class="subdued">1 Like</a>' +
                                '<a href="#" class="subdued">5 Comments</a>' +
                              '</p>' +
                              '<manage-test></manage-test>' +
                            '</div>' +
                        '</div>';

          template = $(template); 

          //template.find('.test').append(scope.data.itemTest);             
          element.append( $compile(template)(scope) );
                        
          
      }
    };

}];







},{}],13:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$compile', function( $compile ){  

    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      //templateUrl: 'templates/directives/feed-item.html',
      link:function(scope, element, attrs){
          
          var template = '' ;
          switch( scope.item.constructor.name )
          {
            case 'TimelineFeedItem':
              template = '<timeline-feed-item item="item"></timeline-feed-item>';
              break;
            case 'LinkedinFeedItem':
              template = '<linkedin-feed-item item="item"></linkedin-feed-item>';
              break;
            case 'InstagramFeedItem':
              template = '<instagram-feed-item item="item"></instagram-feed-item>';
              break;
            case 'CollapsibleFeedItem':
              template = '<collapsible-feed-item item="item"></collapsible-feed-item>';
              break;
            case 'LinkedinCollapsibleFeedItem':
              template = '<linkedin-collapsible-feed-item item="item"></linkedin-collapsible-feed-item>';
              break;
            case 'TwitterCollapsibleFeedItem':
              template = '<twitter-collapsible-feed-item item="item"></twitter-collapsible-feed-item>';
              break;

            default:
              template = '<timeline-feed-item item="item"></timeline-feed-item>';

          }

          //template.find('.test').append(scope.data.itemTest);             
          element.append( $compile(template)(scope) );
                        
          
      }
    };

}];







},{}],14:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],15:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],16:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],17:[function(require,module,exports){
/*
    accountManager module
*/

module.exports = ['$compile', function( $compile ){  

    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      templateUrl: 'templates/directives/feed-item.html',
      link:function(scope, element, attrs){
          scope.aaa = function(){
            alert(444);
            
          };
          
          scope.data = scope.item.getUIData();
          
          var $this = $(element);

          
          //likes , comments and shares
          if( scope.data.lc_disp )
          {
              if( ! $.isEmptyObject(scope.data.likes ) )
              {
                  var $likes = '<span ng-click="aaa()">'+scope.data.likes.text+'</span>';
                  $(element).find('.item-likes-comments').append( $compile($likes)(scope) );
              }

              if( ! $.isEmptyObject(scope.data.comments ) )
              {
                  var $comments = '<span >'+scope.data.comments.text+'</span>';
                  $(element).find('.item-likes-comments').append( $compile($comments)(scope) );
              }

              if( ! $.isEmptyObject(scope.data.shares ) )
              {
                  var $shares = '<span >'+scope.data.shares.text+'</span>';
                  $(element).find('.item-likes-comments').append( $compile($shares)(scope) );
              }
          }
          
          //template.find('.test').append(scope.data.itemTest);             
          //element.append( $compile(template)(scope) );
                        
          
      }
    };

}];







},{}],18:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],19:[function(require,module,exports){
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







},{}],20:[function(require,module,exports){
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
            //stop lode more 
            this.load_more_flag = false;
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
                //stop lode more  
                self.load_more_flag = false;               
            }

            else
            {
                if ( data.paging !== undefined )
                {
                    if ( self.next == data.paging.next )
                    {
                        self.next = false;
                        
                        //stop lode more  
                        self.load_more_flag = false;
                    } 

                    else self.next = data.paging.next;

                    self.add_items( data.data );
                }
                
                else
                {
                    //stop lode more  
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







},{}],21:[function(require,module,exports){
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







},{}],22:[function(require,module,exports){
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







},{}],23:[function(require,module,exports){
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
                //self.element.find('.more').remove();
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







},{}],24:[function(require,module,exports){
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







},{}],25:[function(require,module,exports){
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







},{}],26:[function(require,module,exports){
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
                //self.element.find('.feed-items').html('<center class="center">Data is momentarily unavailable, please try again in a few minutes.</center>');
                //self.element.find('.feed-body').iscrollview("refresh");
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







},{}],27:[function(require,module,exports){
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







},{}],28:[function(require,module,exports){
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







},{}],29:[function(require,module,exports){
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

            if ( this.data.name !== undefined ) title = '<a href="' +this.data.permalink+ '" class="title" target="_blank">' +( this.data.name || '')+ '</a>';

            message_html = title + ( this.data.message || ''); 
            //message_html = title + ( url_to_link( this.data.message ) || '');   
        }

        else if ( this.feed.network == 'twitter' || this.data.eventNetwork == 'twitter' )
        {
            if ( this.data.raw_data.retweeted_status === undefined && this.data.raw_data.quoted_tweet !== undefined 
                && this.data.raw_data.quoted_tweet.streamEntry !== undefined && !$.isEmptyObject( this.data.raw_data.quoted_tweet.streamEntry ) )
            {
                if ( this.data.raw_data.entities.urls !== undefined && !$.isEmptyObject( this.data.raw_data.entities.urls ) )
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

                if ( this.data.message !== undefined )
                {
                    function getPosition(str, m, i) 
                    {
                        return str.split(m, i).join(m).length;
                    }

                    // var result = getPosition(this.data.message, 'http', 2) ;
                    var result = getPosition(message_html, 'http', 2) ;

                    message_html = message_html.substring(0, result);
                }

                if ( this.data.raw_data.entities && this.data.raw_data.entities.urls !== undefined && !$.isEmptyObject( this.data.raw_data.entities.urls ) )
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
                
                if ( this.data.mediaDescription !== undefined && !$.isEmptyObject( this.data.mediaDescription ) ) stuff = this.data.mediaDescription;

                else if ( this.data.caption !== undefined ) stuff = this.data.caption;

                     else if (this.data.media.alt !== undefined && this.data.media.alt != this.data.message ) stuff = this.data.media.alt;

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
                    if ( this.data.media !== undefined )
                    {
                        var gp_img;

                        if ( this.data.media.fullImage !== undefined && this.data.media.fullImage.url !== undefined )
                        {
                            gp_img = this.data.media.fullImage.url;    
                        }

                        else if ( this.data.media.image !== undefined && this.data.media.image.url !== undefined )
                        {
                            gp_img = this.data.media.image.url;    
                        }

                        if ( this.data.media.content !== undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;

                        if ( gp_img !== undefined )
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
                var stuff = ( EC.replaceURLWithHTMLLinks( this.data.mediaDescription === undefined ? (this.data.caption === undefined ? (this.data.media.alt == this.data.message ? '' : this.data.media.alt) : this.data.caption ) : this.data.mediaDescription ) || '');

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
                    if ( this.data.media.content !== undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;   

                    meta_info = '<a class="ph_link font-weight mar-4 ui-link" href="#">' + ( this.data.media.displayName || 'Watch video' ) + '</a>';
                }

                if ( this.data.media !== undefined && this.data.media.video !== undefined ) ext_element = $(
                    "<div class='ui-grid-solo l_message'>" +
                    "<div class='img_box video ui-grid-solo position-relative'><img class=\"video-button\" src=\"img/play-button.png\"><img class=\"full-image\" src='" + this.data.media.src.replace('Fdefault', 'Fhqdefault').replace('/default', '/hqdefault') + "'></div>" +
                    "<div class='clear'></div><div class='padlr10'>" +
                    //"<a class='ph_link' href='#'>" + link_text + "</a>" +
                    meta_info + 
                    "<div class='gray_text video'>" + stuff + "</div>" +
                    "<a class='video_link' href='javascript:;' onclick=\"EC.UI.IAB('"+this.data.media.video.display_url+"');\">Video link</a>" +
                    "</div>"
                );

                if ( this.data.media !== undefined && this.data.media.video !== undefined ) ext_element.on('click',function ( event )
                {
                    // console.dir( self )
                    event.stopPropagation();
                    EC.UI.IAB(encodeURI(self.data.media.video.display_url+'?autoplay=1'), '', '_system');
                    //window.open( encodeURI(self.data.media.video.source_url.replace('http://','https://') ),'_system','location=yes');
                    //var mediaObject = '<iframe src="'+self.data.media.video.source_url.replace('http://','https://')+'" width="1280" height="720" frameborder="0"></iframe>';
                    //post_manager.watchPictureVideo(mediaObject, true);
                });

                if ( this.data.media !== undefined && this.data.media.video !== undefined ) ext_element.on('click', '.yt-user-name' ,function ( event )
                {
                    event.stopPropagation();
                });

            }
            else if(this.data.media.type=="article"&&(this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus'))
            {
                var stuff = '', url_n;

                if ( this.data.media.content !== undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;

                 if ( this.data.media.fullImage !== undefined && this.data.media.fullImage.url !== undefined )
                {
                    url_n = this.data.media.fullImage.url;    
                }

                else if ( this.data.media.image !== undefined && this.data.media.image.url !== undefined )
                {
                    url_n = this.data.media.image.url;    
                }

                if ( url_n !== undefined )
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
                    var stuff = ( EC.replaceURLWithHTMLLinks( this.data.mediaDescription === undefined ? (this.data.caption === undefined ? (this.data.media.alt != this.data.message ? '' : this.data.media.alt) : this.data.caption ) : this.data.mediaDescription ) || '');

                    if ( this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus')
                    {
                        if ( this.data.media !== undefined )
                        {
                            var gp_img;

                            if ( this.data.media.fullImage !== undefined && this.data.media.fullImage.url !== undefined )
                            {
                                gp_img = this.data.media.fullImage.url;    
                            }

                            else if ( this.data.media.image !== undefined && this.data.media.image.url !== undefined )
                            {
                                gp_img = this.data.media.image.url;    
                            }

                            if ( this.data.media.content !== undefined && !$.isEmptyObject( this.data.media.content ) ) stuff = this.data.media.content;

                            if ( gp_img !== undefined )
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
                    var stuff = ( EC.replaceURLWithHTMLLinks( this.data.mediaDescription === undefined ? (this.data.caption === undefined ? (this.data.media.alt != this.data.message ? '' : this.data.media.alt) : this.data.caption ) : this.data.mediaDescription ) || '');
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
        else if ( this.data.raw_data !== undefined && this.data.raw_data.entities !== undefined /*&& this.data.raw_data.entities.media != undefined*/ )
        {
            if ( this.data.raw_data.retweeted_status === undefined && this.data.raw_data.quoted_tweet !== undefined 
                && this.data.raw_data.quoted_tweet.streamEntry !== undefined && !$.isEmptyObject( this.data.raw_data.quoted_tweet.streamEntry ) )
            {
                var quoted_tweet = this.data.raw_data.quoted_tweet.streamEntry
                    ,$quoted_tweet_container = $('<div>', { class: 'quoted-tweet-container' })
                    ,$quoted_tweet_autor = $('<div>', { class: 'quoted-tweet-autor' })
                    ,$quoted_tweet_text = $('<div>', { class: 'quoted-tweet-text' })
                    ,$quoted_tweet_media = $('<div>', { class: 'quoted-tweet-media' })
                    ,first_url = ''
                    ;

                if ( self.data.raw_data.entities.urls !== undefined )
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

                if ( quoted_tweet.entities !== undefined && quoted_tweet.entities.media !== undefined )
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

            else if ( this.data.raw_data.entities.media !== undefined )
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

    TimelineFeedItem.prototype.getLikesComments = function()
    {
        var self = this,
            likes = {},
            dislikes = {},
            comments = {},
            shares = {};

        self.likes_comments_flag = true;

        if ( self.feed.network == 'facebook' )
        {
            // likes
            if ( self.data.likes === undefined )
            {
                likes.count = 0;
                likes.text = '0 likes';
            } 
            else
            {
                
                if ( !Array.isArray( self.data.likes.like )) self.data.likes.like = [ self.data.likes.like ];

                likes.count = self.data.likes.count;
                likes.text = EC.post_likes_text( parseInt( self.data.likes.count ), self.data.user_likes ==  'true');

            }

            // comments
            if ( self.data.comments === undefined ) 
            {
                comments.count = 0;
                comments.text = '0 comments';
                
            }

            else if ( parseInt( self.data.comments.count ) == 1 )
            {
                if ( !Array.isArray( self.data.comments.comment ) ) self.data.comments.comment = [ self.data.comments.comment ];
                comments.count = 1;
                comments.text = '1 comment';                
            }
            
            else 
            {
                comments.count = self.data.comments.count;
                comments.text = self.data.comments.count + ' comments';
            }

            if ( self.data.sharedCound !== undefined ) 
            {
                shares.count    = self.data.sharedCound;
                shares.text     = self.data.sharedCound+' Share'+(self.data.sharedCound=='1'?'':'s');
            }

            if ( ( self.data.isActivity !== undefined && self.data.isActivity == 'true' )
                || ( ( self.feed.id == 'search' || self.feed.id == 'outreach' ) && this.feed.options.parameters.type == 'user' ) || this.feed.id == 'fb_notifications' )
            {
                self.likes_comments_flag = false;
            }

            //display non-clickable likes for FB pages
            else if ( ( this.feed.id == 'search' || this.feed.id == 'outreach' )
                && ( this.feed.options.parameters.type == 'page' || this.feed.options.parameters.type == 'place') )
            {
                //reset likes & comments
                likes = {};
                comments = {};

                if ( typeof this.data.likes !== 'string' ) this.data.likes = '0';
                else
                {
                    if ( this.data.likes === '0' ) {}
                    else
                    {
                        try
                        {
                            var temp_likes = JSON.parse(this.data.likes);
                            if ( temp_likes.data && temp_likes.data.length )
                            {
                                this.data.likes = ( temp_likes.data.length === 25 ? '25+' : temp_likes.data.length );
                            }
                            else this.data.likes = '0';
                        }
                        catch( e )
                        {
                            this.data.likes = '0';
                        }
                    }
                }
                
                shares.count    = self.data.likes;
                shares.text     = self.data.likes+' Share'+(self.data.likes=='1'?'':'s');

                  
            }      
        }

        else if ( self.feed.network == 'twitter')
        {
            // retweets
            if ( this.data.retweets.count != undefined ) 
            {
                likes.count = self.data.retweets.count;
                likes.text = EC.numberWithCommas( this.data.retweets.count )+ ' retweet' + ( this.data.retweets.count == '1' ? '' : 's' );
            }
            
            comments.count  = self.data.favorites.count;
            comments.text   = EC.numberWithCommas( self.data.favorites.count ) + ' like' + ( self.data.favorites.count == '1' ? '' : 's' );
            
        }

        else if ( this.feed.network == 'linkedin')
        {
            // likes
            if ( self.data.likes == undefined ) 
            {
                likes.count = 0;
                likes.text  = 'O likes';
            }

            else
            {
                if ( parseInt( self.data.likes.count ) == 1 ) self.data.likes.like = [ self.data.likes.like ];

                likes.count = self.data.likes.count;
                likes.text = EC.post_likes_text( parseInt( self.data.likes.count ), self.data.user_likes ==  'true');

            }

            // comments
            if ( self.data.comments == undefined ) 
            {
                comments.count  = 0;
                comments.text   = '0 comments';
            }

            else 
            {
                if ( parseInt( self.data.comments.count ) == 1 ) self.data.comments.comment = [ self.data.comments.comment ];

                comments.count  = self.data.comments.count;
                comments.text   = EC.numberWithCommas( self.data.comments.count ) + ' comment' + ( self.data.comments.count == '1' ? '' : 's' );
            }            
        }

        else if ( this.feed.network == 'youtube' || this.feed.network == 'blogger')
        {
            //likes/dislikes
            if ( this.feed.network == 'youtube' ) 
            {
                likes.count = self.data.likes.count;
                likes.text  = EC.post_likes_text( self.data.likes.count, self.data.media.rating == 'like' );

                dislikes.count = self.data.likes.dislikes;
                dislikes.text = EC.post_likes_text( self.data.likes.dislikes, self.data.media.rating == 'dislike', true );
            }

            //comments
            var comments_text;

            if ( $.isEmptyObject(self.data.comments) ) 
            {
                comments.count = 0;
                comments.text = '0 comments';
            }

            else
            {
                comments.count = self.data.comments.count;
                comments.text = EC.numberWithCommas( self.data.comments.count ) + ' comment' + ( self.data.comments.count == 1 ) ?'':'s';
            }
            
            if ( $.isEmptyObject(self.data.likes) && $.isEmptyObject(self.data.comments) )
            {
                self.likes_comments_flag = false;
            }

        }

        else if ( this.feed.network == 'googleplus' || this.data.eventNetwork == 'googleplus')
        {
            //plusones
            if ( self.data.likes == undefined ) 
            {
                likes.count = 0;
                likes.text = '0 likes';
            }

            else
            {
                var you = '',
                    count = parseInt( self.data.likes.count );

                if ( self.data.likes.is_plusoned == 'true' ) 
                {
                    count--;
                    you = "You + ";
                }
                else you = '+ ';

                //just in case
                if ( count < 0 ) count = 0; 

                likes.count = self.data.likes.count;
                likes.text = EC.numberWithCommas( count );
            }

            //comments
            var comments_text;

            if ( $.isEmptyObject(self.data.comments) ) 
            {
                comments.count = 0;
                comments.text = '0 comments';                
            }

            else
            {
                ending = 's';

                if ( self.data.comments.count == 1 ) ending = '';
                
                comments_text = EC.numberWithCommas( self.data.comments.count ) + ' comment' + ending;

                comments.count = self.data.comments.count;
                comments.text = comments_text;

            }

            //resharers
            if ( this.data.resharers != undefined && this.data.resharers.count != '0' ) 
            {
                shares.count = this.data.resharers.count;
                shares.text = this.data.resharers.count+' Share'+(this.data.resharers.count=='1'?'':'s');
            }

            if ( $.isEmptyObject(self.data.likes) && $.isEmptyObject(self.data.comments) )
            {
                self.likes_comments_flag = false;
            }
        }

        else if ( this.feed.network == 'pinterest')
        {
            if ( self.data.repins != '') 
            {
                comments.count = self.data.repins;
                comments.text = EC.numberWithCommas( self.data.repins ) + ' Repin' + (self.data.repins=='1'?'':'s');
            }

            else 
            {
                comments.count  = 0;
                comments.text   = '0 Repins';
            }

            if ( self.data.likes && self.data.likes.count != 0) 
            {
                likes.count = self.data.likes.count;                
            }

            else likes.count = 0;

            likes.text = EC.numberWithCommas( likes.count ) + ' Like' + (likes.count==1?'':'s')

            if ( self.data.comments && self.data.comments.count != 0) 
            {
                comments.count = self.data.comments.count;
            }

            else comments.count = 0;

            comments.text = EC.numberWithCommas( comments.count ) + ' Comment' + (comments.count == 1?'':'s');
            
        }

        else if ( this.feed.id == 'cinbox' )
        {
            if ( this.data.eventType == 'FBComments' || this.data.eventType == 'FBShares' 
                || this.data.eventType == 'FBOthers' || this.data.eventType == 'FBLikes' || this.data.eventType == 'FBWallPosts' ) 
                {
                    self.likes_comments_flag = false;
                }
        }

        return {'likes':likes,'dislikes':dislikes,'comments':comments,'shares':shares,'lc_flag':self.likes_comments_flag};

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

        //likes and comments
        var lc          = self.getLikesComments();
        UIData.likes    = lc.likes;
        UIData.dislikes = lc.dislikes;
        UIData.comments = lc.comments;
        UIData.shares   = lc.shares;
        UIData.lc_disp  = lc.lc_flag;


        return UIData;

    };

    return TimelineFeedItem;

}];







},{}],30:[function(require,module,exports){
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







},{}],31:[function(require,module,exports){
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







},{}],32:[function(require,module,exports){
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







},{}],33:[function(require,module,exports){
module.exports = angular.module('eclincher.constants',[])  
  .constant('apiUrl', 'https://eclincher.com/service/')
  .constant('AUTH_EVENTS', {  notAuthenticated: 'auth-not-authenticated' });
},{}],34:[function(require,module,exports){
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
},{}],35:[function(require,module,exports){
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

.directive('manageTest', function($compile){
    return {
      restrict: 'E',
      scope: {
        item: '=item'
      },
      //templateUrl: 'templates/directives/manage-profile.html',
      link:function(scope, element, attrs){
          var template = '<p>MMMMMMMMMMMMMMMMMMMMMMMM</p>';

          template = $(template); 
          //template.find('.test').append(scope.data.itemTest);             
          element.append( $compile(template)(scope) );
      }
    };
});

},{}],36:[function(require,module,exports){

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
},{}],37:[function(require,module,exports){
/*
	Account Manager Services
*/

module.exports = angular.module('eclincher.services.accountManager', [])

		.factory('accountManager', require('./app/account/account-manager'))

		.factory('Account', require('./app/account/account')) 

		.factory('Profile', require('./app/account/profile'));
},{"./app/account/account":4,"./app/account/account-manager":3,"./app/account/profile":5}],38:[function(require,module,exports){
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

		.factory('InstagramFeedItem', require('./app/social/instagramFeedItem'))

		.factory('CollapsibleFeedItem', require('./app/social/collapsibleFeedItem'))

		.factory('LinkedinCollapsibleFeedItem', require('./app/social/linkedinCollapsibleFeedItem')) 

		.factory('TwitterCollapsibleFeedItem', require('./app/social/twitterCollapsibleFeedItem')) 

		.factory('FacebookFeed', require('./app/social/facebookFeed'))

		.factory('LinkedinFeed', require('./app/social/linkedinFeed'))

		.factory('TwitterFeed', require('./app/social/twitterFeed'))

		.factory('BloggerFeed', require('./app/social/bloggerFeed'))

		.factory('GooglePlusFeed', require('./app/social/googleplusFeed'))

		.factory('PinterestFeed', require('./app/social/pinterestFeed'))

		.factory('YouTubeFeed', require('./app/social/youTubeFeed'))

		.factory('InstagramFeed', require('./app/social/instagramFeed'))

		.directive('feedItem', require('./app/social/directives/feedItem'))

		.directive('timelineFeedItem', require('./app/social/directives/timelineFeedItem'))

		.directive('linkedinFeedItem', require('./app/social/directives/linkedinFeedItem'))

		.directive('instagramFeedItem', require('./app/social/directives/instagramFeedItem'))

		.directive('collapsibleFeedItem', require('./app/social/directives/collapsibleFeedItem'))

		.directive('linkedinCollapsibleFeedItem', require('./app/social/directives/linkedinCollapsibleFeedItem'))

		.directive('twitterCollapsibleFeedItem', require('./app/social/directives/twitterCollapsibleFeedItem'));
},{"./app/social-manager":8,"./app/social/FeedItem":9,"./app/social/bloggerFeed":10,"./app/social/collapsibleFeedItem":11,"./app/social/directives/collapsibleFeedItem":12,"./app/social/directives/feedItem":13,"./app/social/directives/instagramFeedItem":14,"./app/social/directives/linkedinCollapsibleFeedItem":15,"./app/social/directives/linkedinFeedItem":16,"./app/social/directives/timelineFeedItem":17,"./app/social/directives/twitterCollapsibleFeedItem":18,"./app/social/dropdownFeedItem":19,"./app/social/facebookFeed":20,"./app/social/feed":21,"./app/social/googleplusFeed":22,"./app/social/instagramFeed":23,"./app/social/instagramFeedItem":24,"./app/social/linkedinCollapsibleFeedItem":25,"./app/social/linkedinFeed":26,"./app/social/linkedinFeedItem":27,"./app/social/pinterestFeed":28,"./app/social/timelineFeedItem":29,"./app/social/twitterCollapsibleFeedItem":30,"./app/social/twitterFeed":31,"./app/social/youTubeFeed":32}],39:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3cvanMvYXBwLW1haW4uanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L2FjY291bnQtbWFuYWdlci5qcyIsInd3dy9qcy9hcHAvYWNjb3VudC9hY2NvdW50LmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L3Byb2ZpbGUuanMiLCJ3d3cvanMvYXBwL2VjLXV0aWxpdHkuanMiLCJ3d3cvanMvYXBwL3NldHRpbmdzLW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9ibG9nZ2VyRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2NvbGxhcHNpYmxlRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9kaXJlY3RpdmVzL2NvbGxhcHNpYmxlRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9kaXJlY3RpdmVzL2ZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy90aW1lbGluZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZhY2Vib29rRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9nb29nbGVwbHVzRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2luc3RhZ3JhbUZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9pbnN0YWdyYW1GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9waW50ZXJlc3RGZWVkLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvdGltZWxpbmVGZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvdHdpdHRlckZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC95b3VUdWJlRmVlZC5qcyIsInd3dy9qcy9jb25zdGFudHMuanMiLCJ3d3cvanMvY29udHJvbGxlcnMuanMiLCJ3d3cvanMvZGlyZWN0aXZlcy5qcyIsInd3dy9qcy9yb3V0ZXIuanMiLCJ3d3cvanMvc2VydmljZS1hY2NvdW50LW1hbmFnZXIuanMiLCJ3d3cvanMvc2VydmljZS1zb2NpYWwtbWFuYWdlci5qcyIsInd3dy9qcy9zZXJ2aWNlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdHdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25lQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3p1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0ZnVuY3Rpb24gQXBwTWFpbigkaW9uaWNQbGF0Zm9ybSwgJHJvb3RTY29wZSwgJHNjb3BlKSBcclxuXHR7XHJcblx0ICAkaW9uaWNQbGF0Zm9ybS5yZWFkeShmdW5jdGlvbigpIHtcclxuXHQgICAgLy8gSGlkZSB0aGUgYWNjZXNzb3J5IGJhciBieSBkZWZhdWx0IChyZW1vdmUgdGhpcyB0byBzaG93IHRoZSBhY2Nlc3NvcnkgYmFyIGFib3ZlIHRoZSBrZXlib2FyZFxyXG5cdCAgICAvLyBmb3IgZm9ybSBpbnB1dHMpXHJcblx0ICAgIGlmICh3aW5kb3cuY29yZG92YSAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zICYmIHdpbmRvdy5jb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQpIHtcclxuXHQgICAgICBjb3Jkb3ZhLnBsdWdpbnMuS2V5Ym9hcmQuaGlkZUtleWJvYXJkQWNjZXNzb3J5QmFyKHRydWUpO1xyXG5cdCAgICB9XHJcblx0ICAgIGlmICh3aW5kb3cuU3RhdHVzQmFyKSB7XHJcblx0ICAgICAgLy8gb3JnLmFwYWNoZS5jb3Jkb3ZhLnN0YXR1c2JhciByZXF1aXJlZFxyXG5cdCAgICAgIC8vU3RhdHVzQmFyLnN0eWxlTGlnaHRDb250ZW50KCk7XHJcblx0ICAgIH1cclxuICBcdCAgfSk7XHJcblxyXG5cdCAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQpe1xyXG5cdCAgXHQkcm9vdFNjb3BlLmN1cnJlbnRTY29wZSA9ICRzY29wZTtcclxuXHQgIH0pO1xyXG5cclxuICBcdCAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zLCBlcnJvcikge1xyXG5cdCAgIGlmICh0b1N0YXRlLm5hbWUgPT0gJ3RhYnMubWFuYWdlX2FjY291bnRzJykge1xyXG5cdCAgICAgJHJvb3RTY29wZS5oaWRlVGFicz10cnVlO1xyXG5cdCAgIH0gZWxzZSB7XHJcblx0ICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzPWZhbHNlO1xyXG5cdCAgIH1cclxuXHQgIH0pO1xyXG4gIFx0fVxyXG5cclxuICBcdG1vZHVsZS5leHBvcnRzID0gWyckaW9uaWNQbGF0Zm9ybScsICckcm9vdFNjb3BlJywgQXBwTWFpbl07IiwicmVxdWlyZSgnLi9jb25zdGFudHMnKTtcbnJlcXVpcmUoJy4vY29udHJvbGxlcnMnKTtcbnJlcXVpcmUoJy4vc2VydmljZXMnKTtcbnJlcXVpcmUoJy4vc2VydmljZS1hY2NvdW50LW1hbmFnZXInKTtcbnJlcXVpcmUoJy4vc2VydmljZS1zb2NpYWwtbWFuYWdlcicpO1xucmVxdWlyZSgnLi9kaXJlY3RpdmVzJyk7XG5cbnZhciAkc3RhdGVQcm92aWRlclJlZiA9IG51bGw7XG52YXIgJHVybFJvdXRlclByb3ZpZGVyUmVmID0gbnVsbDtcblxuYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlcicsIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpb25pYycsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2VjbGluY2hlci5jb25zdGFudHMnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuY29udHJvbGxlcnMnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuc2VydmljZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2VjbGluY2hlci5zZXJ2aWNlcy5hY2NvdW50TWFuYWdlcicsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2VjbGluY2hlci5zZXJ2aWNlcy5zb2NpYWxNYW5hZ2VyJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLmRpcmVjdGl2ZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25nU3RvcmFnZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndWkucm91dGVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ0NvcmRvdmEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3VuZGVyc2NvcmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdKVxuXG4uY29uZmlnKHJlcXVpcmUoJy4vcm91dGVyJykpXG5cbi5ydW4ocmVxdWlyZSgnLi9hcHAtbWFpbicpKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0FjY291bnQnLCAnVXNlclNldHRpbmdzJywgJyRjb3Jkb3ZhSW5BcHBCcm93c2VyJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgQWNjb3VudCwgVXNlclNldHRpbmdzLCAkY29yZG92YUluQXBwQnJvd3NlciApeyAgXHJcblxyXG4gICAgdmFyIGluaXRpYWxpemVkID0gZmFsc2UsXHJcbiAgICAgICAgZGF0YSA9IHt9LFxyXG4gICAgICAgIGFjY291bnRzID0gW10sXHJcbiAgICAgICAgYWNjb3VudHNfb3JkZXIgPSBbXSxcclxuICAgICAgICBhY2NvdW50c19ieV9pZCA9IHt9LFxyXG4gICAgICAgIGZhdm9yaXRlc19hY2NvdW50LFxyXG4gICAgICAgIHNlYXJjaF9hY2NvdW50LFxyXG4gICAgICAgIHJzc19hY2NvdW50LFxyXG4gICAgICAgIG91dHJlYWNoX2FjY291bnQsXHJcbiAgICAgICAgY2luYm94X2FjY291bnQsXHJcbiAgICAgICAgbGFzdF9hZGRlZF9wcm9maWxlLFxyXG4gICAgICAgIHJlZnJlc2hfb25fY2xvc2UgPSBmYWxzZSxcclxuICAgICAgICB0ZW1wbGF0ZV9zZWxlY3RvciA9ICcjYWNjb3VudC1tYW5hZ2VyLXRlbXBsYXRlJztcclxuXHJcbiAgICAgICAgbW9kdWxlLnJlbmRlcmVkID0gZmFsc2U7XHJcbiAgICAgICAgbW9kdWxlLmdvX2JhY2tfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgbW9kdWxlLmZhdm9yaXRlX3JlbmRlcmVkID0gZmFsc2U7XHJcbiAgICAgICAgbW9kdWxlLnNlYXJjaF9yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5yc3NfcmVuZGVyZWQgPSBmYWxzZTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdhY2NvdW50TWFuYWdlciBpbml0Jyk7XHJcblxyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCRodHRwKTtcclxuICAgICAgICAvL3JldHVybiB0ZW1wbGF0ZV9zZWxlY3RvcjtcclxuICAgICAgICBcclxuICAgICAgICAvL2dldCBhY2NvdW50cyBhbmQgc3RvcmUgaXRcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAgJ2FjY291bnQvYWNjb3VudHMnLFxyXG4gICAgICAgICAgICBkYXRhOnsnbmFtZSc6J3JhbSd9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKHN0b3JlX2FjY291bnRzLCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBzdG9yZV9hY2NvdW50cyAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdyZXNwb25zZTo6OicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFVzZXJTZXR0aW5ncyk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlIHx8IFtdLFxyXG4gICAgICAgICAgICAgICAgaXRlbXMgPSBkYXRhLmFjY291bnQgfHwgW10sXHJcbiAgICAgICAgICAgICAgICBmYXZfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzcmNoX2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcnNzX2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgb3V0cmVhY2hfbG9hZGVkID0gZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBhY2Nfb3JkZXIgPSBkYXRhLmFjY291bnRfb3JkZXIgfHwgW107XHJcblxyXG4gICAgICAgICAgICBpZiggZGF0YS5zZXR0aW5ncyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgVXNlclNldHRpbmdzLmhhbmRsZV9zZXR0aW5ncyggZGF0YS5zZXR0aW5ncywgdW5kZWZpbmVkLCB0cnVlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5hbmFseXRpY3NfZ3JvdXBzID0gW107XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiggZGF0YS5hbmFseXRpY3NHcm91cHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgVXNlclNldHRpbmdzLmFuYWx5dGljc19ncm91cHMgPSBkYXRhLmFuYWx5dGljc0dyb3Vwcy5hbmFseXRpY3NHcm91cDtcclxuICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheSggaXRlbXMgKSApIGl0ZW1zID0gWyBpdGVtcyBdO1xyXG5cclxuICAgICAgICAgICAgYWNjb3VudHMgPSBbXTtcclxuICAgICAgICAgICAgYWNjb3VudHNfYnlfaWQgPSB7fTtcclxuICAgICAgICAgICAgYWNjb3VudHNfb3JkZXIgPSBhY2Nfb3JkZXI7XHJcblxyXG4gICAgICAgICAgICAvL0NyZWF0ZSBhY2NvdW50LW9iamVjdCBmb3IgZWFjaCBhY2NvdW50cyBhbmQgc3RvcmUgYnkgaWQgLlxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSBpdGVtcy5sZW5ndGg7IGkgPCBwOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19hY2NvdW50ID0gbmV3IEFjY291bnQoIGl0ZW1zWyBpIF0gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGFjY291bnRzLnB1c2goIG5ld19hY2NvdW50ICk7IC8vIGl0ZXJhYmxlXHJcblxyXG4gICAgICAgICAgICAgICAgYWNjb3VudHNfYnlfaWRbIG5ld19hY2NvdW50LmlkIF0gPSBhY2NvdW50c1sgbGVuZ3RoIC0gMSBdOyAvLyBpbmRleGVkIGJ5IGFjY291bnQgSUQsIHJlZmVyZW5jZXMgYWNjb3VudCBieSBpbmRleFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnYWNjb3VudHM6OjonKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYWNjb3VudHMpO1xyXG4gICAgICAgICAgICAvL2lmIGNhbGxiYWNrIGlzIHZhbGlkIGZ1bmN0aW9uLCB0aGVuIGNhbGwgaXRcclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nIClcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSBcclxuICAgICAgICBcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUucmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUucmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2Zhdm9yaXRlX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLmZhdm9yaXRlX3JlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9mYXZvcml0ZV9yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLmZhdm9yaXRlX3JlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19zZWFyY2hfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUuc2VhcmNoX3JlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9zZWFyY2hfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5zZWFyY2hfcmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3Jzc19yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5yc3NfcmVuZGVyZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X3Jzc19yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLnJzc19yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X2dvX2JhY2tfZmxhZyA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5nb19iYWNrX2ZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0X2dvX2JhY2tfZmxhZyA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLmdvX2JhY2tfZmxhZyA9IGZsYWc7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmZpbmQgPSBmdW5jdGlvbiAoIGFjY291bnRfaWQgKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhY2NvdW50c19ieV9pZFsgYWNjb3VudF9pZCBdO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldF9wcm9maWxlID0gZnVuY3Rpb24gKCBwcm9maWxlX2lkIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ2Zhdm9yaXRlcycpIHJldHVybiAoIGZhdm9yaXRlc19hY2NvdW50ICE9PSB1bmRlZmluZWQgPyBmYXZvcml0ZXNfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdzZWFyY2gnKSByZXR1cm4gKCBzZWFyY2hfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gc2VhcmNoX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAncnNzJykgcmV0dXJuICggcnNzX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IHJzc19hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ291dHJlYWNoJykgcmV0dXJuICggb3V0cmVhY2hfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gb3V0cmVhY2hfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdjaW5ib3gnKSByZXR1cm4gKCBjaW5ib3hfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gY2luYm94X2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgYSA9IGFjY291bnRzLmxlbmd0aDsgaSA8IGE7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaiA9IDAsIHAgPSBhY2NvdW50c1sgaSBdLnByb2ZpbGVzLmxlbmd0aDsgaiA8IHA7IGorKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX3Byb2ZpbGUgPSBhY2NvdW50c1sgaSBdLnByb2ZpbGVzWyBqIF07XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggdGhpc19wcm9maWxlLmlkID09IHByb2ZpbGVfaWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzX3Byb2ZpbGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWNjb3VudHMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrICkgXHJcbiAgICB7IFxyXG4gICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBhY2NvdW50cyApO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBhY2NvdW50czsgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMubGlzdF9hY2NvdW50cyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0ZW1wID0gW10sXHJcbiAgICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgICBhID0gMDtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoYWNjb3VudHNfb3JkZXIubGVuZ3RoID4gMCApe1xyXG4gICAgICAgICAgICBmb3IgKCBpID0gMCwgYSA9IGFjY291bnRzX29yZGVyLmxlbmd0aDsgaSA8IGE7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBhYyA9IGFjY291bnRzLmxlbmd0aDsgaiA8IGFjOyBqKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGFjY291bnRzX29yZGVyW2ldID09IGFjY291bnRzWyBqIF0udHlwZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBhY2NvdW50c1sgaiBdLmhhc191bmV4cGlyZWRfcHJvZmlsZXMoKSApIHRlbXAucHVzaCggYWNjb3VudHNbIGogXSApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCBpID0gMCwgYSA9IGFjY291bnRzLmxlbmd0aDsgaSA8IGE7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggYWNjb3VudHNbIGkgXS5oYXNfdW5leHBpcmVkX3Byb2ZpbGVzKCkgKSB0ZW1wLnB1c2goIGFjY291bnRzWyBpIF0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGVtcC5zb3J0KGZ1bmN0aW9uICggYSwgYiApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggYSA8IGIgKSByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBhID4gYiApIHJldHVybiAxO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCB0ZW1wICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSByZXR1cm4gdGVtcDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hZGRfYWNjb3VudCA9IGZ1bmN0aW9uKCB0eXBlIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YSk7XHJcbiAgICAgICAgdmFyIGN1c3RvbV9oZWFkZXJzID0gJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEgfHwge30sXHJcbiAgICAgICAgICAgIHBhdGggPSAnYWNjb3VudC9hY2NvdW50P3R5cGU9JyArdHlwZSsgJyZsZj1mYWxzZSc7XHJcblxyXG4gICAgICAgIGN1c3RvbV9oZWFkZXJzID0gSlNPTi5wYXJzZSggY3VzdG9tX2hlYWRlcnMgKTtcclxuXHJcbiAgICAgICAgdmFyIGNrZXkgPSAoY3VzdG9tX2hlYWRlcnMuY2xpZW50X2tleSAhPT0gdW5kZWZpbmVkKSA/IEpTT04uc3RyaW5naWZ5KGN1c3RvbV9oZWFkZXJzLmNsaWVudF9rZXkpOiAnJztcclxuICAgICAgICBcclxuICAgICAgICBwYXRoICs9ICcmdXNlcl9uYW1lPScrY3VzdG9tX2hlYWRlcnMudXNlcl9uYW1lKycmdXNlcl9wYXNzPScrY3VzdG9tX2hlYWRlcnMudXNlcl9wYXNzKycmY2xpZW50X2tleT0nK2NrZXkrJyZkZXZpY2U9aW9zJztcclxuICAgICAgICAvL2FsZXJ0KGVuY29kZVVSSShhcGlVcmwrcGF0aCkpO1xyXG4gICAgICAgIHZhciBvcHRpb25zID0ge1xyXG4gICAgICAgICAgbG9jYXRpb246ICd5ZXMnLFxyXG4gICAgICAgICAgY2xlYXJjYWNoZTogJ3llcycsXHJcbiAgICAgICAgICBjbGVhcnNlc3Npb25jYWNoZTogJ3llcycsXHJcbiAgICAgICAgICB0b29sYmFycG9zaXRpb246ICd0b3AnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgJGNvcmRvdmFJbkFwcEJyb3dzZXIub3BlbiggZW5jb2RlVVJJKEVDLmdldEFwaVVybCgpK3BhdGgpLCAnX2JsYW5rJywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckY29yZG92YUluQXBwQnJvd3NlcjpleGl0JywgZnVuY3Rpb24oZSwgZXZlbnQpe1xyXG4gICAgICAgICAgICBhY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIGZhbHNlICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJ0VDJywgJ1Byb2ZpbGUnLCBmdW5jdGlvbihFQywgUHJvZmlsZSl7XHJcblxyXG4gICAgZnVuY3Rpb24gQWNjb3VudCAoIGFjY291bnRfZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gYWNjb3VudF9kYXRhLmFjY291bnRJZDtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnR5cGUgPSBhY2NvdW50X2RhdGEudHlwZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmNhbl9wb3N0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy50eXBlID09ICdGYWNlYm9vaycgfHwgdGhpcy50eXBlID09ICdMaW5rZWRpbicgfHwgdGhpcy50eXBlID09ICdUd2l0dGVyJyB8fCB0aGlzLnR5cGUgPT0gJ0Jsb2dnZXInIHx8IHRoaXMudHlwZSA9PSAnUGludGVyZXN0JyApIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy50eXBlID09ICdHb29nbGVQbHVzJykgdGhpcy5jYW5fcG9zdCA9IHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLnR5cGUgPT0gJ1BpbnRlcmVzdCcgJiYgYWNjb3VudF9kYXRhLmVtYWlsICE9PSB1bmRlZmluZWQgJiYgYWNjb3VudF9kYXRhLnBhc3N3b3JkICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIGFjY291bnRfZGF0YS5wYXNzd29yZCApICkgdGhpcy5jYW5fcG9zdCA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMuY2hhcmFjdGVyX2xpbWl0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy50eXBlID09ICdMaW5rZWRpbicpIHRoaXMuY2hhcmFjdGVyX2xpbWl0ID0gNzAwO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy50eXBlID09ICdUd2l0dGVyJykgdGhpcy5jaGFyYWN0ZXJfbGltaXQgPSAxNDA7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YSA9IGFjY291bnRfZGF0YSB8fCB7fTtcclxuXHJcbiAgICAgICAgdGhpcy5wcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb25maWcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggdGhpcy5kYXRhLmNvbmZpZyApICkgdGhpcy5wcm9maWxlcy5wdXNoKCBuZXcgUHJvZmlsZSggdGhpcy5kYXRhLmNvbmZpZywgdGhpcyApICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kYXRhLmNvbmZpZy5mb3JFYWNoKGZ1bmN0aW9uICggaXRlbSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19wcm9maWxlID0gbmV3IFByb2ZpbGUoIGl0ZW0sIHNlbGYgKTtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZXMucHVzaCggbmV3X3Byb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5leHBpcmVkID0gKCBhY2NvdW50X2RhdGEubW9uaXRvcmVkID09ICdleHBpcmVkJyA/IHRydWUgOiBmYWxzZSApO1xyXG4gICAgICAgIC8vIHRoaXMuZXhwaXJlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmhhc19tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5tb25pdG9yZWRfcHJvZmlsZXMoKS5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5oYXNfZXZlbnRzX21vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmV2ZW50c19tb25pdG9yZWRfcHJvZmlsZXMoKS5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuaGFzX3VuZXhwaXJlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLnVuZXhwaXJlZF9wcm9maWxlcygpLmxlbmd0aCA+IDAgKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSB0aGlzLnByb2ZpbGVzLmxlbmd0aDsgaSA8IHA7IGkrKyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGVzWyBpIF0ubW9uaXRvcmVkID09ICdvbicpIHByb2ZpbGVzLnB1c2goIHRoaXMucHJvZmlsZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2ZpbGVzO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5ldmVudHNfbW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gdGhpcy5wcm9maWxlcy5sZW5ndGg7IGkgPCBwOyBpKysgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlc1sgaSBdLmV2ZW50c01vbml0b3JlZCA9PSAnb24nKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcbiAgICBcclxuICAgIEFjY291bnQucHJvdG90eXBlLnVuZXhwaXJlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IHRoaXMucHJvZmlsZXMubGVuZ3RoOyBpIDwgcDsgaSsrICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZXNbIGkgXS5tb25pdG9yZWQgIT0gJ29mZicpIHByb2ZpbGVzLnB1c2goIHRoaXMucHJvZmlsZXNbIGkgXSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHByb2ZpbGVzO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuICdbb2JqZWN0ICcgK3RoaXMudHlwZSsgJyBBY2NvdW50XSc7XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHN3aXRjaCAoIHRoaXMudHlwZS50b0xvd2VyQ2FzZSgpIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhY2Vib29rJzogcmV0dXJuIDE7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3aXR0ZXInOiByZXR1cm4gMjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ29vZ2xlYW5hbHl0aWNzJzogcmV0dXJuIDM7XHJcbiAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnbGlua2VkaW4nOiByZXR1cm4gNDtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnaW5zdGFncmFtJzogcmV0dXJuIDU7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3lvdXR1YmUnOiByZXR1cm4gNjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAncGludGVyZXN0JzogcmV0dXJuIDc7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dvb2dsZXBsdXMnOiByZXR1cm4gODtcclxuICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdibG9nZ2VyJzogcmV0dXJuIDk7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R1bWJscic6IHJldHVybiAxMDtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnd29yZHByZXNzJzogcmV0dXJuIDExO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd2ayc6IHJldHVybiAxMjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIDEzO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUucmVmcmVzaEFjY291bnQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogXCJhY2NvdW50L3JlZnJlc2hcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcInJlZnJlc2hBY2NvdW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYuaWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc2VsZi50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWN0aW9uID0gJ3VwZGF0ZVBJQm9hcmRzJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApIGNhbGxiYWNrKGZsYWcpO1xyXG5cclxuICAgICAgICB9LCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuZGVsZXRlQWNjb3VudCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBcImFjY291bnQvZGVsZXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCJkZWxldGVBY2NvdW50QnlJRFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLmlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblxyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKSBjYWxsYmFjayhmbGFnKTtcclxuXHJcbiAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBBY2NvdW50O1xyXG4gICAgXHJcbn1dO1xyXG5cclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gWydFQycsICdzb2NpYWxNYW5hZ2VyJywgZnVuY3Rpb24oRUMsIHNvY2lhbE1hbmFnZXIpe1xyXG5cclxuXHRmdW5jdGlvbiBQcm9maWxlICggcHJvZmlsZV9kYXRhLCBhY2NvdW50IClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSBwcm9maWxlX2RhdGEgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuYWNjb3VudCA9IGFjY291bnQgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBkYXRhLnNhbXBsZUlkO1xyXG5cclxuICAgICAgICB0aGlzLnBpY3R1cmUgPSAoIGRhdGEucHJvZmlsZVBpY3R1cmUgPyBkZWNvZGVVUklDb21wb25lbnQoIGRhdGEucHJvZmlsZVBpY3R1cmUgKSA6ICdzc3Nzc3NzcycgKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpICE9PSAncGludGVyZXN0JyApIHRoaXMucGljdHVyZSA9IHRoaXMucGljdHVyZS5yZXBsYWNlKCdodHRwOi8vJywnLy8nKTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLm1vbml0b3JlZCA9PSAnb24nIHx8IGRhdGEuc29jaWFsTW9uaXRvcmVkID09ICdvbicpIHRoaXMubW9uaXRvcmVkID0gJ29uJztcclxuICAgICAgICBcclxuICAgICAgICBlbHNlIGlmICggZGF0YS5tb25pdG9yZWQgPT0gJ2V4cGlyZWQnIHx8IGRhdGEuc29jaWFsTW9uaXRvcmVkID09ICdleHBpcmVkJykgdGhpcy5tb25pdG9yZWQgPSAnZXhwaXJlZCc7XHJcblxyXG4gICAgICAgIGVsc2UgdGhpcy5tb25pdG9yZWQgPSAnb2ZmJztcclxuXHJcbiAgICAgICAgdGhpcy5wcm9maWxlX2NoZWNrZWQgPSB0aGlzLm1vbml0b3JlZCA9PSAnb24nID8gdHJ1ZTpmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5ldmVudHNNb25pdG9yZWQgPSBkYXRhLmV2ZW50c01vbml0b3JlZDtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5tb25pdG9yZWQgPSAoICggZGF0YS5tb25pdG9yZWQgPT0gJ29uJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnb24nKSA/ICdvbicgOiAnb2ZmJyk7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIGRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtICkgKSB0aGlzLnN0cmVhbXMgPSBkYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCApIHRoaXMuc3RyZWFtcyA9IFsgZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gXTtcclxuICAgICAgICBcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gKSApIHRoaXMuc3RyZWFtcyA9IHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgKSB0aGlzLnN0cmVhbXMgPSBbIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSBdO1xyXG5cclxuICAgICAgICBlbHNlIHRoaXMuc3RyZWFtcyA9IFtdO1xyXG5cclxuICAgICAgICAvLyB0aGlzLnNvY2lhbCA9IG5ldyBTb2NpYWwoIHNlbGYgKTtcclxuICAgICAgICB0aGlzLnNvY2lhbCA9IG5ldyBzb2NpYWxNYW5hZ2VyKCBzZWxmICk7XHJcblxyXG4gICAgICAgIC8vIHRoaXMuYW5hbHl0aWNzID0gbmV3IEFuYWx5dGljcyggc2VsZiApO1xyXG4gICAgICAgIC8vdGhpcy5hbmFseXRpY3MgPSBuZXcgYW5hbHl0aWNzTWFuYWdlciggc2VsZiApO1xyXG5cclxuICAgICAgICB0aGlzLmdyb3VwcyA9IFtdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmV0d29yayA9IHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgIHRoaXMudXNlcm5hbWUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5tb25pdG9yZWQgPT09ICdvbicgJiYgdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnbGlua2VkaW4nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLyp2YXIgcmVxX2RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRMTkdyb3VwcycsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5pZFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vZ3JvdXBzJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHJlcV9kYXRhXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iaiAhPT0gdW5kZWZpbmVkICYmIG9iai5kYXRhICE9PSB1bmRlZmluZWQgKSBzZWxmLmdyb3VwcyA9ICggQXJyYXkuaXNBcnJheSggb2JqLmRhdGEgKSA/IG9iai5kYXRhLnNvcnQoZnVuY3Rpb24oYSxiKXtpZihhLm5hbWUgPCBiLm5hbWUpIHJldHVybiAtMTtpZihhLm5hbWUgPiBiLm5hbWUpIHJldHVybiAxO3JldHVybiAwO30pIDogWyBvYmouZGF0YSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pOyovXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdmYWNlYm9vaycgJiYgZGF0YS5wYWdlQ2F0ZWdvcnkgPT0gXCJVc2VyXCIgKVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm1vbml0b3JlZCA9PT0gJ29uJyAmJiB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdmYWNlYm9vaycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvKnZhciByZXFfZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkhpZGRlbl9Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwcycsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHRfcG9zdHM6ICcnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybDonZmVlZC9mYkhpZGRlbkdyb3VwcycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogcmVxX2RhdGFcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIG9iaiAhPSB1bmRlZmluZWQgJiYgb2JqLmRhdGEgIT0gdW5kZWZpbmVkICYmIG9iai5kYXRhLmxlbmd0aCA+IDAgKSBzZWxmLmdyb3VwcyA9ICggQXJyYXkuaXNBcnJheSggb2JqLmRhdGEgKSA/IG9iai5kYXRhLnNvcnQoZnVuY3Rpb24oYSxiKXtpZihhLm5hbWUgPCBiLm5hbWUpIHJldHVybiAtMTtpZihhLm5hbWUgPiBiLm5hbWUpIHJldHVybiAxO3JldHVybiAwO30pIDogWyBvYmouZGF0YSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSk7Ki9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3R3aXR0ZXInKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5saXN0cyA9IHtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHRfZWxlbWVudDogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogW11cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgLy8gZ2V0IHByb2ZpbGUgTGlzdHNcclxuICAgICAgICAgICAgLy9tb2R1bGUuZ2V0X3R3X3Byb2ZpbGVfbGlzdHModGhpcy8qLCBmdW5jdGlvbigpe30qLyk7IFxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLnBvd2VyVXNlcnMgKSB0aGlzLnBvd2VyX3VzZXJzID0gZGF0YS5wb3dlclVzZXJzO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB0aGlzLnBvd2VyX3VzZXJzID0ge1xyXG4gICAgICAgICAgICAgICAgc3RhdGU6ICdvbicsXHJcbiAgICAgICAgICAgICAgICBtZWRpdW1Mb3c6ICcyMDAwJyxcclxuICAgICAgICAgICAgICAgIG1lZGl1bUhpZ2g6ICc3NTAwJyxcclxuICAgICAgICAgICAgICAgIGhpZ2g6ICc3NTAwJ1xyXG4gICAgICAgICAgICB9OyAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2luc3RhZ3JhbScpXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICd5b3V0dWJlJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2dvb2dsZXBsdXMnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYoIHByb2ZpbGVfZGF0YS5vYmplY3RUeXBlID09ICdwYWdlJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zdGluZ19vbmx5ID0gdHJ1ZTsgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lID0gcHJvZmlsZV9kYXRhLmZ1bGxOYW1lICsgJyAoUGFnZSknO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSAnZnVsbE5hbWUnOyAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IChwcm9maWxlX2RhdGEuZnVsbE5hbWUgIT09IHVuZGVmaW5lZCAmJiBwcm9maWxlX2RhdGEuZnVsbE5hbWUgIT09XCJcIik/cHJvZmlsZV9kYXRhLmZ1bGxOYW1lLnNwbGl0KFwiKFwiKVswXSArICcgKFVzZXIpJzogJyhVc2VyKSc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9ICdmdWxsTmFtZSc7ICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSBwcm9maWxlX2RhdGEuZnVsbE5hbWU7XHJcbiAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gJ2Z1bGxOYW1lJztcclxuXHJcbiAgICAgICAgICAgIGlmKCBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSAhPT0gdW5kZWZpbmVkICYmIHByb2ZpbGVfZGF0YS5vYmplY3RUeXBlID09ICd1c2VyJyApIHRoaXMudXNlcm5hbWUgKz0gJyAoVXNlciknO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3N0aW5nX29ubHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSArPSAnIChCb2FyZCknO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEucGFnZU5hbWUgKSAvLyBGQiBcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnRpdGxlICkgLy8gR0FcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnByb2ZpbGVOYW1lICkgLy8gTE5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnVzZXJOYW1lICkgLy8gSUdcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnNwZWNpZmllZEhhbmRsZU9ySGFzaFRhZyApIC8vIFRXXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5mdWxsTmFtZSApIC8vIEcrXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS51c2VyRmlyc3ROYW1lICkgLy8gWVRcclxuXHJcbiAgICAgICAgWydwYWdlTmFtZScsICd0aXRsZScsICdwcm9maWxlTmFtZScsICd1c2VyRmlyc3ROYW1lJywgJ3VzZXJOYW1lJywgJ3NwZWNpZmllZEhhbmRsZU9ySGFzaFRhZycsICdmdWxsTmFtZSddLmZvckVhY2goZnVuY3Rpb24gKCBpdGVtIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggZGF0YVsgaXRlbSBdICE9PSB1bmRlZmluZWQgJiYgc2VsZi51c2VybmFtZSA9PT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi51c2VybmFtZSA9IGRhdGFbIGl0ZW0gXSArICcgJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi51c2VybmFtZV9rZXkgPSBpdGVtO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAnW29iamVjdCAnICt0aGlzLmFjY291bnQudHlwZSsgJyBQcm9maWxlXSc7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVzZXJuYW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS5pc19kaXNwbGF5X3Byb2ZpbGUgPSBmdW5jdGlvbiggYWxsX2ZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICB2YXIgZGlzcGxheV9wcm9maWxlID0gdHJ1ZSxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggYWxsX2ZsYWcgPT09IHVuZGVmaW5lZCAmJiBzZWxmLm1vbml0b3JlZCA9PT0gJ29uJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vJGFjY291bnQuZWxlbWVudC5maW5kKCcuZnVuY3Rpb25zJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoICggc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZ29vZ2xlcGx1cycgJiYgIXNlbGYucG9zdGluZ19vbmx5ICkgfHwgc2VsZi5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAncGludGVyZXN0JyApIFxyXG4gICAgICAgICAgICB7IGRpc3BsYXlfcHJvZmlsZSA9IGZhbHNlOyB9IC8vaGlkZSBpbiBwb3N0IG1hbmFnZXJcclxuICAgICAgICB9IFxyXG5cclxuICAgICAgICBlbHNlIGlmICggYWxsX2ZsYWcgPT09IHRydWUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAoIHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcpICYmIHNlbGYucG9zdGluZ19vbmx5ICkgXHJcbiAgICAgICAgICAgIHsgZGlzcGxheV9wcm9maWxlID0gZmFsc2U7IH0gLy9oaWRlICAgXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGlzcGxheV9wcm9maWxlID0gc2VsZi5wb3N0aW5nX29ubHk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGRpc3BsYXlfcHJvZmlsZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICByZXR1cm4gZGlzcGxheV9wcm9maWxlO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS5nZXRVc2VyTmFtZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lID0gdGhpcy51c2VybmFtZTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmRhdGEudGl0bGUgIT09IHVuZGVmaW5lZCApIC8vIGZvcm1hdCBuYW1lIGZvciBHQVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRlbXAgPSB1c2VybmFtZS5zcGxpdCgnKCcpWzBdIHx8IHNlbGYudXNlcm5hbWUrICcgJztcclxuXHJcbiAgICAgICAgICAgIHVzZXJuYW1lID0gdGVtcC5zdWJzdHJpbmcoMCwgdGVtcC5sZW5ndGggLSAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB1c2VybmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUudXBkYXRlX21vbml0b3IgPSBmdW5jdGlvbiggZmxhZyApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIGZsYWcgPSAoZmxhZyAhPT0gdW5kZWZpbmVkKT9mbGFnOmZhbHNlO1xyXG5cclxuICAgICAgICBpZiggc2VsZi5hY2NvdW50LnR5cGUgPT0gJ0dvb2dsZUFuYWx5dGljcycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgYWxlcnQoJ2dvb2dsZSBhbmFseXRpY3MuLi4uLi4uLi4uLi4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2VsZi5tb25pdG9yZWQgPSBmbGFnID8gJ29uJzonb2ZmJztcclxuXHJcbiAgICAgICAgICAgIHNhdmVfcHJvZmlsZV9zZWxlY3Rpb24oZnVuY3Rpb24oIHN0YXR1cyApe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXR1cztcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBzYXZlX3Byb2ZpbGVfc2VsZWN0aW9uKCBjYWxsYmFjayApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6J1BPU1QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOlwiYWNjb3VudC9zaW5nbGVwcm9maWxlbW9uaXRvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTp7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc2V0U2luZ2xlUHJvZmlsZU1vbml0b3JlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBhY2NvdW50SUQ6IHNlbGYuYWNjb3VudC5pZCwgcHJvZmlsZUlEOiBzZWxmLmlkLCBjaGVja2VkOiBmbGFnIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKGZ1bmN0aW9uKHJlc3Ape1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICkgY2FsbGJhY2soZmxhZyk7XHJcblxyXG4gICAgICAgICAgICB9LCBmdW5jdGlvbigpe30pO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFxyXG5cclxuXHJcblxyXG4gICAgcmV0dXJuIFByb2ZpbGU7XHJcblxyXG59XTsiLCJtb2R1bGUuZXhwb3J0cyA9IFtcclxuICAgICckcScsXHJcbiAgICAnJGh0dHAnLFxyXG4gICAgJ2FwaVVybCcsXHJcbiAgICAnJGxvY2FsU3RvcmFnZScsXHJcbiAgICAnJGlvbmljTG9hZGluZycsXHJcbiAgICBmdW5jdGlvbihcclxuICAgICAgICAkcSxcclxuICAgICAgICAkaHR0cCxcclxuICAgICAgICBhcGlVcmwsXHJcbiAgICAgICAgJGxvY2FsU3RvcmFnZSxcclxuICAgICAgICAkaW9uaWNMb2FkaW5nKSB7XHJcblxyXG4gICAgICAgIHZhciBmYXZvcml0ZXMgPSBbXSxcclxuICAgICAgICAgICAgc2VhcmNoZXMgPSBbXTtcclxuICAgICAgICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbihyZXF1ZXN0KSB7XHJcbiAgICAgICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLnVzZXJfZGF0YSA9ICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhO1xyXG4gICAgICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5pc19tb2JpbGVfYXBwID0gJzEnO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnS0tLSycpO1xyXG4gICAgICAgICAgICByZXR1cm4gJHEoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9JZiB0aGUgcmVxdWVzdCB1cmwgaXMgbm90IGZ1bGwtZm9ybWF0ICwganVzdCBhcHBlbmQgYXBpLXVybFxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QudXJsLmluZGV4T2YoYXBpVXJsKSAhPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QudXJsID0gYXBpVXJsICsgcmVxdWVzdC51cmw7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QubWV0aG9kID09PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPSByZXF1ZXN0LnR5cGU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLnNob3coKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC5tZXRob2QgPT0gJ0dFVCcpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LnBhcmFtcyA9IHJlcXVlc3QuZGF0YTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAkaHR0cChyZXF1ZXN0KVxyXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1c2VyX2RhdGEgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UuaGVhZGVycygnZWNfZGF0YScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhID0gcmVzcG9uc2UuaGVhZGVycygnZWNfZGF0YScpO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlLmRhdGEpO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgnVGhlcmUgaXMgc29tZSBjb25uZWN0aXZpdHkgaXNzdWUgLlBsZWFzZSB0cnkgYWdhaW4gbGF0ZXIuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0QXBpVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhcGlVcmw7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pc0VtcHR5T2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucmVwbGFjZV90eXBlX2luX3VzZXJuYW1lID0gZnVuY3Rpb24odXNlcm5hbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuICQudHJpbSh1c2VybmFtZSkucmVwbGFjZSgvKCBcXChVc2VyXFwpJHwgXFwoUHJvZmlsZVxcKSR8IFxcKFBhZ2VcXCkkfCBcXChDb21wYW55IFBhZ2VcXCkkKS8sICcnKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZvcl9lYWNoID0gZnVuY3Rpb24oYXJyYXksIGZuKSB7XHJcbiAgICAgICAgICAgIGFycmF5ID0gQXJyYXkuaXNBcnJheShhcnJheSkgPyBhcnJheSA6IFthcnJheV07XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpbmRleCA9IDAsIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7ICsraW5kZXgpIGZuKGFycmF5W2luZGV4XSwgaW5kZXgsIGxlbmd0aCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy50d19kZWVwX2xpbmtfdG9faHRtbCA9IGZ1bmN0aW9uKHRleHQsIHJhd19kYXRhKSB7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0IHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRlZXBfbGluayA9ICdodHRwczovL3R3aXR0ZXIuY29tL21lc3NhZ2VzL2NvbXBvc2U/cmVjaXBpZW50X2lkPSc7XHJcblxyXG4gICAgICAgICAgICBpZiAocmF3X2RhdGEuZW50aXRpZXMgJiYgcmF3X2RhdGEuZW50aXRpZXMudXJscykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mb3JfZWFjaChyYXdfZGF0YS5lbnRpdGllcy51cmxzLCBmdW5jdGlvbih1cmwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodXJsLnVybCAmJiB1cmwuZXhwYW5kZWRfdXJsICYmIHVybC5leHBhbmRlZF91cmwuaW5kZXhPZihkZWVwX2xpbmspICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXhwYW5kZWRfdXJsID0gdXJsLmV4cGFuZGVkX3VybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2lwaWVudF9pZCA9IGV4cGFuZGVkX3VybC5yZXBsYWNlKGRlZXBfbGluaywgJycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2VfbWUgPSAnPGRpdiBjbGFzcz1cIm1lc3NhZ2UtbWVcIiBkYXRhLXJlY2lwaWVudD1cIicgKyByZWNpcGllbnRfaWQgKyAnXCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHN2ZyBjbGFzcz1cIm1lc3NhZ2UtbWUtaWNvblwiIHZpZXdCb3g9XCIwIDAgNTYgNTRcIiB2ZXJzaW9uPVwiMS4xXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiPjwvc3ZnPicgK1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cIm1lc3NhZ2UtbWUtdGV4dFwiPlNlbmQgYSBwcml2YXRlIG1lc3NhZ2U8L3NwYW4+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UodXJsLnVybCwgbWVzc2FnZV9tZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UodXJsLmV4cGFuZGVkX3VybCwgbWVzc2FnZV9tZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudXJsX3RvX2xpbmsgPSBmdW5jdGlvbih0ZXh0LCB0YXJnZXQpIHtcclxuICAgICAgICAgICAgdmFyIGV4cCA9IC8oXFxiKChodHRwcz98ZnRwfGZpbGUpOlxcL1xcL3xiaXQubHlcXC98Z29vLmdsXFwvfHQuY29cXC8pWy1BLVowLTkrJkAjXFwvJT89fl98ITosLjtdKlstQS1aMC05KyZAI1xcLyU9fl98XSkvaWc7XHJcblxyXG4gICAgICAgICAgICBmdW5jdGlvbiByZXBsYWNlcihtYXRjaCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiPGEgaHJlZj0nXCIgKyAobWF0Y2guaW5kZXhPZignLy8nKSA9PSAtMSA/ICcvLycgKyBtYXRjaCA6IG1hdGNoKSArIFwiJyBcIiArXHJcbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiB0YXJnZXQgPT0gJ3VuZGVmaW5lZCcgPyAndGFyZ2V0PVwiX2JsYW5rXCInIDogJ3RhcmdldD1cIicgKyB0YXJnZXQgKyAnXCInKSArIFwiPlwiICsgbWF0Y2ggKyBcIjwvYT5cIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZXh0ID09ICdzdHJpbmcnKSByZXR1cm4gdGV4dC5yZXBsYWNlKGV4cCwgcmVwbGFjZXIpO1xyXG5cclxuICAgICAgICAgICAgZWxzZSByZXR1cm4gJyc7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy50d191c2VyX21lbnRpb25zX3RvX2xpbmtzID0gZnVuY3Rpb24odGV4dCwgcmF3X2RhdGEpIHtcclxuICAgICAgICAgICAgdGV4dCA9IHRleHQgfHwgJyc7XHJcblxyXG4gICAgICAgICAgICB2YXIgdXNlcl9tZW50aW9ucztcclxuXHJcbiAgICAgICAgICAgIGlmIChyYXdfZGF0YS5lbnRpdGllcyAhPT0gdW5kZWZpbmVkICYmIHJhd19kYXRhLmVudGl0aWVzLnVzZXJfbWVudGlvbnMgIT09IHVuZGVmaW5lZCAmJiByYXdfZGF0YS5lbnRpdGllcy51c2VyX21lbnRpb25zLnNjcmVlbl9uYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIHVzZXJfbWVudGlvbnMgPSByYXdfZGF0YS5lbnRpdGllcy51c2VyX21lbnRpb25zLnNjcmVlbl9uYW1lO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh1c2VyX21lbnRpb25zKSkgdXNlcl9tZW50aW9ucyA9IFt1c2VyX21lbnRpb25zXTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdXNlcl9tZW50aW9ucyA9IHVzZXJfbWVudGlvbnMgfHwgW107XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHVzZXJfbWVudGlvbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2NyZWVuX25hbWUgPSB1c2VyX21lbnRpb25zW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBleHAgPSBuZXcgUmVnRXhwKCdAJyArIHNjcmVlbl9uYW1lLCAnaWcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGV4cCwgJzxhIGNsYXNzPVwidHctdXNlclwiIGhyZWY9XCJodHRwczovL3R3aXR0ZXIuY29tLycgKyBzY3JlZW5fbmFtZSArXHJcbiAgICAgICAgICAgICAgICAgICAgJ1wiIHRhcmdldD1cIl9ibGFua1wiICBkYXRhLXVzZXI9XCJAJyArIHNjcmVlbl9uYW1lICsgJ1wiPkAnICsgc2NyZWVuX25hbWUgKyAnPC9hPicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5oYXNodGFnX3RvX2xpbmsgPSBmdW5jdGlvbih0ZXh0LCBuZXR3b3JrKSB7XHJcbiAgICAgICAgICAgIHZhciBleHAgPSAvXFxCIyhcXHcqW2EtekEtWl0rXFx3KikvaWcsXHJcbiAgICAgICAgICAgICAgICBsaW5rZWQgPSAnJztcclxuXHJcbiAgICAgICAgICAgIGlmICgkLmlzQXJyYXkodGV4dCkpIHRleHQgPSB0ZXh0WzBdO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0ZXh0ICE9PSAndW5kZWZpbmVkJykgLy8gbWF5YmUgaWYgdGV4dCAhPSB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIGlmIChuZXR3b3JrID09PSAndHdpdHRlcicpXHJcbiAgICAgICAgICAgICAgICAgICAgbGlua2VkID0gdGV4dC5yZXBsYWNlKGV4cCwgXCI8YSBjbGFzcz0ndHctaGFzaHRhZycgaHJlZj0naHR0cHM6Ly90d2l0dGVyLmNvbS9zZWFyY2g/cT0lMjMkMScgdGFyZ2V0PSdfYmxhbmsnIGRhdGEtcXVlcnk9JyUyMyQxJz4jJDE8L2E+XCIpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAobmV0d29yayA9PT0gJ2ZhY2Vib29rJylcclxuICAgICAgICAgICAgICAgIGxpbmtlZCA9IHRleHQucmVwbGFjZShleHAsIFwiPGEgaHJlZj0naHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2hhc2h0YWcvJDEnIHRhcmdldD0nX2JsYW5rJz4jJDE8L2E+XCIpOyAvLyBodHRwczovL3d3dy5mYWNlYm9vay5jb20vaGFzaHRhZy9uYmE/aGNfbG9jYXRpb249dWZpXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGxpbmtlZCA9IHRleHQucmVwbGFjZShleHAsIFwiPGEgaHJlZj0naHR0cHM6Ly90d2l0dGVyLmNvbS9zZWFyY2g/cT0lMjMkMScgdGFyZ2V0PSdfYmxhbmsnPiMkMTwvYT5cIik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbGlua2VkO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmJfdGFnc190b19saW5rcyA9IGZ1bmN0aW9uKHRleHQsIHRhZ3MsIHR5cGUpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRhZ3MpKSB0YWdzID0gW3RhZ3NdO1xyXG5cclxuICAgICAgICAgICAgdGFncy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUludChhLm9mZnNldCkgLSBwYXJzZUludChiLm9mZnNldCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLFxyXG4gICAgICAgICAgICAgICAgY3VyX29mZnNldCA9IDAsXHJcbiAgICAgICAgICAgICAgICByZXN1bHRfc3RyID0gJycsXHJcbiAgICAgICAgICAgICAgICB0YWcsIGxlbmd0aCwgb2Zmc2V0LCBtdWx0aXRhZ3MgPSB7fTtcclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGFncy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRhZyA9IHRhZ3NbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gcGFyc2VJbnQodGFnLm9mZnNldCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gcGFyc2VJbnQodGFnLmxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cl9vZmZzZXQgPD0gb2Zmc2V0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godGV4dC5zdWJzdHJpbmcoY3VyX29mZnNldCwgb2Zmc2V0KSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGN1cl9vZmZzZXQgPSBvZmZzZXQgKyBsZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vcmVzdWx0LnB1c2goIHRhZy5saW5rICk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGFnLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAodGFnLm5hbWUgPT0gdW5kZWZpbmVkIHx8ICQuaXNFbXB0eU9iamVjdCh0YWcubmFtZSkgPyB0ZXh0LnN1YnN0cihvZmZzZXQsIGxlbmd0aCkgOiB0YWcubmFtZSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHRhZy50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiB0YWcubGlua1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIC8vbXVsdGl0YWdzXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG11bHRpdGFnc1t0YWcub2Zmc2V0XSA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZfbGluayA9IHJlc3VsdC5wb3AoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpdGFnc1t0YWcub2Zmc2V0XSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiBsZW5ndGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0ZXh0LnN1YnN0cihvZmZzZXQsIGxlbmd0aCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWdzOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRhZ3NbaSAtIDFdLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluazogcHJldl9saW5rXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFnLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluazogdGFnLmxpbmtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQucHVzaCgnXyRtdCRfJyArIG9mZnNldCArIHRleHQuc3Vic3RyKG9mZnNldCwgbGVuZ3RoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIC8vYWRkIG11bHRpdGFnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG11bHRpdGFnc1t0YWcub2Zmc2V0XS50YWdzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0YWcubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGluazogdGFnLmxpbmtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh0ZXh0LnN1YnN0cmluZyhjdXJfb2Zmc2V0KSk7XHJcblxyXG4gICAgICAgICAgICAvL3Jlc3VsdF9zdHIgPSB1cmxfdG9fbGluayggcmVzdWx0LmpvaW4oJycpICk7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gcmVzdWx0Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSByZXN1bHRbaV07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09ICdvYmplY3QnKSAvL3RhZ1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdF9zdHIgKz0gJzxhIGNsYXNzPVwiZmItJyArIGl0ZW0udHlwZSArICdcIiBocmVmPVwiJyArIGl0ZW0ubGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIiBkYXRhLXVzZXI9XCInICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5pZCArICdcIj4nICsgaXRlbS5uYW1lICsgJzwvYT4nO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHJlc3VsdF9zdHIgKz0gc2VsZi51cmxfdG9fbGluayhpdGVtKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLypmb3IgKCB2YXIgaSA9IDAsIGwgPSB0YWdzLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggbXVsdGl0YWdzWyB0YWdzWyBpIF0ub2Zmc2V0IF0gPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRfc3RyID0gcmVzdWx0X3N0ci5yZXBsYWNlKCAnPicgKyB0YWdzWyBpIF0ubGluayArICc8JywgJz4nICsgdGFnc1sgaSBdLm5hbWUgKyAnPCcgKTsgIFxyXG4gICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgIH0qL1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgb2Zmc2V0IGluIG11bHRpdGFncykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG11bHRpdGFnID0gbXVsdGl0YWdzW29mZnNldF07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHR0ID0gJyc7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMCwgbCA9IG11bHRpdGFnLnRhZ3MubGVuZ3RoOyBrIDwgbDsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGsgPCAzKSB0dCA9IHR0ICsgKHR0Lmxlbmd0aCA9PSAwID8gJycgOiAnLCAnKSArIG11bHRpdGFnLnRhZ3Nba10ubmFtZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChtdWx0aXRhZy50YWdzLmxlbmd0aCA+IDMpIHR0ID0gdHQgKyAnLCAuLi4nO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdF9zdHIgPSByZXN1bHRfc3RyLnJlcGxhY2UoJ18kbXQkXycgKyBtdWx0aXRhZy5vZmZzZXQgKyBtdWx0aXRhZy5uYW1lLCAnPHNwYW4gY2xhc3M9XCJtdWx0aXRhZ1wiIGRhdGEtdG9vbHRpcD1cIicgK1xyXG4gICAgICAgICAgICAgICAgICAgIHR0ICsgJ1wiIGRhdGEtb2Zmc2V0PVwiJyArIHR5cGUgKyAnXycgKyBtdWx0aXRhZy5vZmZzZXQgKyAnXCI+JyArIG11bHRpdGFnLm5hbWUgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0X3N0cjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLkZCX3RodW1ibmFpbF90b19mdWxsX3NpemUgPSBmdW5jdGlvbih1cmwpIHtcclxuICAgICAgICAgICAgdmFyIHVybF9uID0gdXJsO1xyXG5cclxuICAgICAgICAgICAgaWYgKHVybC5pbmRleE9mKFwiP1wiKSA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVybC5pbmRleE9mKFwiX3MuanBnXCIpICE9IC0xKSB1cmxfbiA9IHVybC5yZXBsYWNlKFwiX3MuanBnXCIsIFwiX24uanBnXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZihcIl9zLmpwZWdcIikgIT0gLTEpIHVybF9uID0gdXJsLnJlcGxhY2UoXCJfcy5qcGVnXCIsIFwiX24uanBlZ1wiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB1cmxfbiA9IHVybC5yZXBsYWNlKFwiX3MucG5nXCIsIFwiX24ucG5nXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdXJsX247XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMucmVwbGFjZVVSTFdpdGhIVE1MTGlua3MgPSBmdW5jdGlvbih0ZXh0LCBuZXdXaW5kb3cpIHtcclxuICAgICAgICAgICAgdmFyIGV4cCA9IC8oXFxiKGh0dHBzP3xmdHB8ZmlsZSk6XFwvXFwvWy1BLVowLTkrJkAjXFwvJT89fl98ITosLjtdKlstQS1aMC05KyZAI1xcLyU9fl98XSkvaWc7XHJcbiAgICAgICAgICAgIHZhciBleHBfd3d3ID0gL14oXFxiKD8hKGh0dHBzP3xmdHB8ZmlsZSkpKHd3d1suXSlbLUEtWjAtOSsmQCNcXC8lPz1+X3whOiwuO10qWy1BLVowLTkrJkAjXFwvJT1+X3xdKS9pZztcclxuICAgICAgICAgICAgaWYgKG5ld1dpbmRvdykge1xyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShleHAsIFwiPGEgaHJlZj0nJDEnIHRhcmdldD0nX2JsYW5rJz4kMTwvYT5cIik7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGV4cF93d3csIFwiPGEgaHJlZj0naHR0cDovLyQxJyB0YXJnZXQ9J19ibGFuayc+JDE8L2E+XCIpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShleHAsIFwiPGEgaHJlZj0nJDEnPiQxPC9hPlwiKTtcclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoZXhwX3d3dywgXCI8YSBocmVmPSdodHRwOi8vJDEnPiQxPC9hPlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnBvc3RfbGlrZXNfdGV4dCA9IGZ1bmN0aW9uICggY291bnQsIGxpa2VkLCBkaXNsaWtlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGVuZGluZyA9ICdzJyxcclxuICAgICAgICAgICAgICAgIHlvdSA9ICcnLFxyXG4gICAgICAgICAgICAgICAgbGlrZSA9IGRpc2xpa2UgPyAnIGRpc2xpa2UnIDogJyBsaWtlJztcclxuXHJcbiAgICAgICAgICAgIGlmICggbGlrZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBjb3VudC0tO1xyXG4gICAgICAgICAgICAgICAgeW91ID0gXCJZb3UgKyBcIjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBjb3VudCA9PSAxICkgZW5kaW5nID0gJyc7XHJcblxyXG4gICAgICAgICAgICAvL2p1c3QgaW4gY2FzZVxyXG4gICAgICAgICAgICBpZiAoIGNvdW50IDwgMCApIGNvdW50ID0gMDsgXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIHlvdSArIHNlbGYubnVtYmVyV2l0aENvbW1hcyggY291bnQgKSArIGxpa2UgKyBlbmRpbmc7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5udW1iZXJXaXRoQ29tbWFzID0gZnVuY3Rpb24gKHgpIHtcclxuICAgICAgICAgICAgaWYoeD09dW5kZWZpbmVkKXJldHVybiAnJztcclxuICAgICAgICAgICAgdmFyIHBhcnRzID0geC50b1N0cmluZygpLnNwbGl0KFwiLlwiKTtcclxuICAgICAgICAgICAgcGFydHNbMF0gPSBwYXJ0c1swXS5yZXBsYWNlKC9cXEIoPz0oXFxkezN9KSsoPyFcXGQpKS9nLCBcIixcIik7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKFwiLlwiKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFNpZGVNZW51ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgICAgICB2YXIgc2lkZU1lbnUgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaG9tZSc6XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNpZGVNZW51ID0gW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBZGQgJiBNYW5hZ2UgQWNjb3VudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3RhYnMubWFuYWdlX2FjY291bnRzJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBY2NvdW50IFNldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5tYW5hZ2VfYWNjb3VudHMnXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1dO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwdWJsaXNoaW5nJzpcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2lkZU1lbnUgPSBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0FjY291bnQgU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLm1hbmFnZV9hY2NvdW50cydcclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnUG9zdCBTZXR0aW5ncycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3RhYnMucG9zdF9zZXR0aW5ncydcclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRkFRJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdMb2dvdXQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgfV07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZlZWQnOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzaWRlTWVudSA9IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLmZlZWRfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0FkZCB0byBGYXZvcml0ZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLmZlZWRfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1dO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gc2lkZU1lbnU7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRXYXRjaENvdW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHZhciByb290ID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdodG1sJykpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHdhdGNoZXJzID0gW107XHJcblxyXG4gICAgICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChbJyRzY29wZScsICckaXNvbGF0ZVNjb3BlJ10sIGZ1bmN0aW9uKHNjb3BlUHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5kYXRhKCkgJiYgZWxlbWVudC5kYXRhKCkuaGFzT3duUHJvcGVydHkoc2NvcGVQcm9wZXJ0eSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGVsZW1lbnQuZGF0YSgpW3Njb3BlUHJvcGVydHldLiQkd2F0Y2hlcnMsIGZ1bmN0aW9uKHdhdGNoZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdhdGNoZXJzLnB1c2god2F0Y2hlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50LmNoaWxkcmVuKCksIGZ1bmN0aW9uKGNoaWxkRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGYoYW5ndWxhci5lbGVtZW50KGNoaWxkRWxlbWVudCkpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBmKHJvb3QpO1xyXG5cclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZSB3YXRjaGVyc1xyXG4gICAgICAgICAgICB2YXIgd2F0Y2hlcnNXaXRob3V0RHVwbGljYXRlcyA9IFtdO1xyXG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2god2F0Y2hlcnMsIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGlmICh3YXRjaGVyc1dpdGhvdXREdXBsaWNhdGVzLmluZGV4T2YoaXRlbSkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd2F0Y2hlcnNXaXRob3V0RHVwbGljYXRlcy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB3YXRjaGVyc1dpdGhvdXREdXBsaWNhdGVzLmxlbmd0aDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuXHJcblxyXG5cclxuICAgIH1cclxuXTsiLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdBY2NvdW50JywgJyRjb3Jkb3ZhSW5BcHBCcm93c2VyJywnXycsIGZ1bmN0aW9uKCRodHRwLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBBY2NvdW50LCAkY29yZG92YUluQXBwQnJvd3NlciwgXyApeyAgXHJcblxyXG4gICAgdmFyIGxpY2Vuc2VPcHRpb25zLFxyXG4gICAgICAgIHNldHRpbmdzLFxyXG4gICAgICAgIGlzX2V0c3lfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3dlZWJseV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfd2l4X3VzZXI9IGZhbHNlLFxyXG4gICAgICAgIGlzX2xleGl0eV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfc2hvcGlmeV91c2VyID0gZmFsc2UsXHJcbiAgICAgICAgaXNfYmlnY29tbWVyY2VfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGV4dGVybmFsQXBwcyA9IFtdLFxyXG4gICAgICAgIGZhdm9yaXRlcyA9IFtdLFxyXG4gICAgICAgIHNlYXJjaGVzID0gW10sXHJcbiAgICAgICAgdXNlcl9pbmJveF9maWx0ZXJzID0gW10sXHJcbiAgICAgICAgZ290X3NmID0gZmFsc2UsXHJcbiAgICAgICAgZ290X3NlYXJjaGVzID0gZmFsc2UsXHJcbiAgICAgICAgbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSAwLFxyXG4gICAgICAgIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSB0cnVlLFxyXG4gICAgICAgIGhpZGVFdmVudHNDb3VudGVyID0gZmFsc2UsXHJcbiAgICAgICAgZGlzcGxheUluYm94U2V0dGluZ3MgPSB0cnVlLFxyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZhbHNlLFxyXG4gICAgICAgIGFnZW5jeUNvbmZpZ3VyYXRpb24gPSB7fSxcclxuICAgICAgICBtYXhFdmVudFRpbWU7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmdldERpc3BsYXlJbmJveFNldHRpbmdzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZGlzcGxheUluYm94U2V0dGluZ3M7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0RGlzcGxheUluYm94U2V0dGluZ3MgPSBmdW5jdGlvbiAoIGRpc3BsYXkgKVxyXG4gICAge1xyXG4gICAgICAgIGRpc3BsYXlJbmJveFNldHRpbmdzID0gZGlzcGxheTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAoIG1heEV2ZW50VGltZSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKS5nZXRUaW1lKCkgOiBtYXhFdmVudFRpbWUgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRNYXhFdmVudFRpbWUgPSBmdW5jdGlvbiAoIHRpbWUgKVxyXG4gICAge1xyXG4gICAgICAgIG1heEV2ZW50VGltZSA9IHRpbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9IGhpZGU7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0SGlkZUV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBoaWRlRXZlbnRzQ291bnRlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRIaWRlRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uICggaGlkZSApXHJcbiAgICB7XHJcbiAgICAgICAgaGlkZUV2ZW50c0NvdW50ZXIgPSBoaWRlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldE51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbnVtYmVyT2ZDb21wbGV0ZWRFdmVudHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0TnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoIGNvbXBsZXRlZF9ldmVudHMgKVxyXG4gICAge1xyXG4gICAgICAgIG51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gY29tcGxldGVkX2V2ZW50cztcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJDb21wbGV0ZWRFdmVudHNDb3VudGVyKCk7IFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmdW5jdGlvbiAoIGZsYWcgKVxyXG4gICAge1xyXG4gICAgICAgIGF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVuZGVyQ29tcGxldGVkRXZlbnRzQ291bnRlciA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICAvKnZhciAkaW5kaWNhdG9yID0gJCgnYm9keScpLmZpbmQoJy5uZXctZXZlbnRzLWluZGljYXRvcicpO1xyXG5cclxuICAgICAgICBpZiAoICRpbmRpY2F0b3IubGVuZ3RoID4gMCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICFoaWRlRXZlbnRzQ291bnRlciAmJiBhbGxfc2V0dGluZ3MubGljZW5zZVR5cGUgIT0gJ0ZyZWUnICYmIGFsbF9zZXR0aW5ncy5saWNlbnNlVHlwZSAhPSAnSW5kaXZpZHVhbCcgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICRpbmRpY2F0b3IuaGFzQ2xhc3MoJ3plcm8nKSApICRpbmRpY2F0b3IucmVtb3ZlQ2xhc3MoJ3plcm8nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkaW5kaWNhdG9yLnRleHQoIG51bWJlck9mQ29tcGxldGVkRXZlbnRzICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAhJGluZGljYXRvci5oYXNDbGFzcygnemVybycpICkgJGluZGljYXRvci50ZXh0KCcnKS5hZGRDbGFzcygnemVybycpOyAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0qL1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhZ2VuY3lDb25maWd1cmF0aW9uO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEFnZW5jeUNvbmZpZ3VyYXRpb24gPSBmdW5jdGlvbiAoIGFjIClcclxuICAgIHtcclxuICAgICAgICBhZ2VuY3lDb25maWd1cmF0aW9uID0gYWM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWdlbmN5QnJhbmRzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYoIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50ID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICByZXR1cm4gW107XHJcblxyXG4gICAgICAgIGlmICggISBBcnJheS5pc0FycmF5KCBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudCApIClcclxuICAgICAgICAgICAgcmV0dXJuIFsgYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQgXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRVc2VyUGVybWlzc2lvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIHZhciBicmFuZHMgPSBtb2R1bGUuZ2V0QWdlbmN5QnJhbmRzKCksXHJcbiAgICAgICAgICAgIHBlcm1pc3Npb24gPSAnZWRpdCc7XHJcblxyXG4gICAgICAgIGlmKCAhYnJhbmRzLmxlbmd0aCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgZm9yKCB2YXIgaT0wOyBpPGJyYW5kcy5sZW5ndGg7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggYnJhbmRzW2ldLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgYnJhbmRzW2ldLnNlbGVjdGVkID09ICcxJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBlcm1pc3Npb24gPSBicmFuZHNbaV0ucGVybWlzc2lvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHBlcm1pc3Npb247XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFuYWx5dGljc0FjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFBPU1QsXHJcbiAgICAgICAgICAgIHVybDogJ2FqYXgucGhwJyxcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QW5hbHl0aWNzQWNjb3VudHMnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZSggcmVzcG9uc2UgKTsgXHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUFjY291bnRzID0gZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDpcImFqYXgucGhwXCIsXHJcbiAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOid1cGRhdGVBY2NvdW50cycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOmRhdGFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCByZXNwb25zZSA9PSBTVUNDRVNTKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoKTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zYXZlU2V0dGluZ3MgPSBmdW5jdGlvbiggZGF0YSwgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOlBPU1QsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NhdmVTZXR0aW5ncycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggcmVzcG9uc2UucmV0dXJuQ29kZSA9PSBcIlNVQ0NFU1NcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmhhbmRsZV9zZXR0aW5ncyggcmVzcG9uc2Uuc2V0dGluZ3MsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCByZXNwb25zZSApO1xyXG4gICAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFNlYXJjaFN0cmVhbXMgPSBmdW5jdGlvbiggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KHsgdHlwZTpHRVQsIHVybDonZmVlZC9zZWFyY2hTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0U2VhcmNoU3RyZWFtcyd9fSwgZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGdvdF9zZiA9IHRydWU7XHJcbiAgICAgICAgICAgIHNlYXJjaGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmVkaXRTZWFyY2hTdHJlYW0gPSBmdW5jdGlvbiggc3RyZWFtLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBzdHJlYW0ucHJvZmlsZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICAgICAgdXJsOidmZWVkL3NlYXJjaFN0cmVhbXMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2VkaXRTZWFyY2hTdHJlYW0nLFxyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzdHJlYW0uaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzdHJlYW0ucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc3RyZWFtLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogc3RyZWFtLnBhcmFtZXRlcnNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgIT09IHVuZGVmaW5lZCApIHJlcXVlc3QuZGF0YS5uYW1lID0gJ1NlYXJjaDogJyArIGRlY29kZVVSSUNvbXBvbmVudCggc3RyZWFtLnBhcmFtZXRlcnMucXVlcnkgKTtcclxuXHJcbiAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiggcmVzcG9uc2UgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRGYXZvcml0ZVN0cmVhbXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCh7IHR5cGU6R0VULCB1cmw6J2ZlZWQvZmF2b3JpdGVTdHJlYW1zJywgZGF0YTp7IGFjdGlvbjonZ2V0RmF2b3JpdGVTdHJlYW1zJ319LCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgZmF2b3JpdGVzID0gZGF0YTtcclxuXHJcbiAgICAgICAgICAgIGdvdF9mYXZlcyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZmF2b3JpdGVzICk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0RmF2b3JpdGVTdHJlYW1zIHJlc3BvbnNlOicpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5mYXZvcml0ZXMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIGdvdF9mYXZlcyApIHJldHVybiBmYXZvcml0ZXM7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNlYXJjaF9mZWVkcyA9IGZ1bmN0aW9uICggKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggZ290X3NmICkgcmV0dXJuIHNlYXJjaGVzO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTsgICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXR0aW5ncyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKSBcclxuICAgIHtcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggc2V0dGluZ3MgKTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldFNldHRpbmdzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpHRVQsXHJcbiAgICAgICAgICAgIHVybDondXNlci9zZXR0aW5ncycgICAgICAgICAgICBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBoYW5kbGUgKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtb2R1bGUuaGFuZGxlX3NldHRpbmdzKHJlc3BvbnNlLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGhhbmRsZSApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmhhbmRsZV9zZXR0aW5ncyA9IGZ1bmN0aW9uKCByZXNwb25zZSwgY2FsbGJhY2ssIGZsYWdfbm9fYWdlbmN5X3VwZGF0ZSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2hhbmRsZV9zZXR0aW5ncy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICBmbGFnX25vX2FnZW5jeV91cGRhdGUgPSBmbGFnX25vX2FnZW5jeV91cGRhdGUgPyBmbGFnX25vX2FnZW5jeV91cGRhdGU6ZmFsc2U7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gc2V0IG1vZHVsZSB2YXJpYWJsZVxyXG4gICAgICAgICAgICBzZXR0aW5ncyA9IGRhdGE7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MuYXBpVXNlciA9PT0gdW5kZWZpbmVkIHx8IF8uaXNFbXB0eSggc2V0dGluZ3MuYXBpVXNlciApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmFwaVVzZXIgPSBzZXR0aW5ncy5lbWFpbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9zZXQgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgICAgICAgICBpc193aXhfdXNlciA9IHNldHRpbmdzLndpeFVzZXI7XHJcbiAgICAgICAgICAgIG1heF9hbGxvd2VkX2dhX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZBY3RpdmVHb29nbGVBbmFseXRpY3NBY2NvdW50cztcclxuICAgICAgICAgICAgbWF4X2FsbG93ZWRfc29jaWFsX2FjY291bnRzID0gc2V0dGluZ3MubnVtYmVyT2ZTb2NpYWxzT247XHJcbiAgICAgICAgICAgIHJlbV9kYXlzID0gc2V0dGluZ3MuZGF5c0xlZnQ7XHJcblxyXG4gICAgICAgICAgICAkbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4gICAgICAgICAgICAvL0VDLnNlc3Npb25EYXRhLnNldCgnYWxsX3NldHRpbmdzJywgSlNPTi5zdHJpbmdpZnkoc2V0dGluZ3MpKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0IHNldHRpbmdzRGVmZXJyZWQgYXMgcmVzb2x2ZWQgb25seSBpZiBzZXR0aW5ncyBhdmFpbGFibGVcclxuICAgICAgICAgICAgLy9zZXR0aW5nc0RlZmVycmVkLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGxpY2Vuc2VPcHRpb25zID0gZGF0YS5saWNlbnNlT3B0aW9ucztcclxuXHJcbiAgICAgICAgICAgIC8qaWYgKCBkYXRhLnVzZXJTb3VyY2UgPT0gXCJiaWdjb21tZXJjZVwiIHx8IGRhdGEubG9naW5UeXBlICE9ICd1c2VyUGFzc3dvcmQnKXtcclxuICAgICAgICAgICAgICAgICQoJy5jaGFuZ2VfcGFzcycpLmFkZENsYXNzKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0qL1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzKCBkYXRhLmFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHM/ICggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzLnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEhpZGVFdmVudHNDb3VudGVyKCBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciA/ICggZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIikgOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXREaXNwbGF5SW5ib3hTZXR0aW5ncyggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncyA/ICggZGF0YS5kaXNwbGF5SW5ib3hTZXR0aW5ncy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKSA6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLm51bWJlck9mTmV3RXZlbnRzID09ICdzdHJpbmcnKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXROdW1iZXJPZkNvbXBsZXRlZEV2ZW50cyggZGF0YS5udW1iZXJPZk5ld0V2ZW50cyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3coIGRhdGEuYXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID8gKCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKTogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiA9PSAnb2JqZWN0Jyl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QWdlbmN5Q29uZmlndXJhdGlvbiggZGF0YS5hZ2VuY3lDb25maWd1cmF0aW9uICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5leHRlcm5hbEFwcHMhPT11bmRlZmluZWQgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gZXh0ZXJuYWxBcHBzID0gZGF0YS5leHRlcm5hbEFwcHM7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5leHRlcm5hbEFwcHMgKSApIGV4dGVybmFsQXBwcyA9IFsgZGF0YS5leHRlcm5hbEFwcHMgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGV4dGVybmFsQXBwcyA9IGRhdGEuZXh0ZXJuYWxBcHBzO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnZXh0ZXJuYWxBcHBzJyApXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZXh0ZXJuYWxBcHBzIClcclxuXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEFwcHMuZm9yRWFjaChmdW5jdGlvbiAoIGV4dGVybmFsQXBwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBleHRlcm5hbEFwcC5leHRlcm5hbEFwcCApICkgZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHAgPSBbIGV4dGVybmFsQXBwLmV4dGVybmFsQXBwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhcHAgPSBleHRlcm5hbEFwcC5leHRlcm5hbEFwcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdhcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggYXBwIClcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBhcHAuZm9yRWFjaChmdW5jdGlvbiAoIHRoaXNfYXBwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAndGhpc19hcHAnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIHRoaXNfYXBwIClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2xleGl0eScpIGlzX2xleGl0eV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ3dlZWJseScpIGlzX3dlZWJseV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ2V0c3knKSBpc19ldHN5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnc2hvcGlmeScpIGlzX3Nob3BpZnlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdiaWdjb21tZXJjZScpIGlzX2JpZ2NvbW1lcmNlX3VzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gIFxyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVfc2V0dGluZ3Nfd2luZG93ID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuZ2V0U2V0dGluZ3MoZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNldHRpbmdzV2luZG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHJlc3AuYWdlbmN5TnVtYmVyT2ZDbGllbnRzICE9PSB1bmRlZmluZWQgKSAkKCcucGxhbi11c2FnZSAuYnJhbmQtdXNhZ2UgLnZhbHVlJykudGV4dCggcmVzcC5hZ2VuY3lOdW1iZXJPZkFjdGl2ZUNsaWVudHMrICcvJyArcmVzcC5hZ2VuY3lOdW1iZXJPZkNsaWVudHMgKTtcclxuXHJcbiAgICAgICAgICAgIC8vc2V0dGluZ3NXaW5kb3dOdW1iZXJzKCByZXNwICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICB0aGlzLmdldExpY2Vuc2VPcHRpb25zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbGljZW5zZU9wdGlvbnM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfZXRzeV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfZXRzeV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3dlZWJseV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfd2VlYmx5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfbGV4aXR5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19sZXhpdHlfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19zaG9waWZ5X3VzZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpc19zaG9waWZ5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfYmlnY29tbWVyY2VfdXNlcj0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfYmlnY29tbWVyY2VfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRFeHRlcm5hbEFwcHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBleHRlcm5hbEFwcHM7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuY2hlY2tMaWNlbnNlVmlldyA9IGZ1bmN0aW9uICggaWQsIGlzX3dpeCwgbWl4cGFuZWxfdHlwZSApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gaWYoIGxpY2Vuc2VPcHRpb25zLnZpZXcgIT0gdW5kZWZpbmVkICYmIGxpY2Vuc2VPcHRpb25zLnZpZXcgPT0gJzdELU9ubHknICYmIGlkICE9ICc3RCcpXHJcbiAgICAgICAgaWYgKCBmYWxzZSApIC8vIGVuYWJsZSBhbGwgdGltZWZyYW1lc1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8kKHdpbmRvdykudHJpZ2dlcigndXBncmFkZS1wb3B1cCcsIG1peHBhbmVsX3R5cGUpO1xyXG4gICAgICAgICAgICBzaG93VXBncmFkZVdpbmRvdyhpc193aXgpO1xyXG4gICAgICAgICAgICByZXR1cm4gRkFJTDsgICAgXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlIHJldHVybiBTVUNDRVNTOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0X3VzZXJfaW5ib3hfdGFncyA9IGZ1bmN0aW9uKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFVzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBzdGFydFRpbWU6ICcwJyxcclxuICAgICAgICAgICAgZW5kVGltZTogJzAnLFxyXG4gICAgICAgICAgICByZXF1ZXN0X2FjdGlvbjogJ2dldFVzZXJUYWdzJyxcclxuICAgICAgICAgICAgbWF4RXZlbnRzOiAnMSdcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogR0VULFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3VzZXJFdmVudHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoudGFncyAhPT0gdW5kZWZpbmVkICYmIEFycmF5LmlzQXJyYXkoIG9iai50YWdzICkgKSB1c2VyX2luYm94X3RhZ3MgPSBvYmoudGFncztcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTtcclxuICAgICAgICB9KTsgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmluYm94X3RhZ3MgPSBmdW5jdGlvbiAoIClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdXNlcl9pbmJveF90YWdzOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlX2luYm94X3RhZ3MgPSBmdW5jdGlvbiggdGFncywgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHRhZ3MgPSBBcnJheS5pc0FycmF5KCB0YWdzICkgP3RhZ3M6W107XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBQT1NULFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICd1c2VyL2V2ZW50cycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6eyB0YWdzOiB0YWdzIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIG9iaiApe1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vSWYgc3VjY2VzcywgdXBkYXRlIHRhZ3MgYXJyYXlcclxuICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT0gJ1NVQ0NFU1MnIClcclxuICAgICAgICAgICAgICAgIHVzZXJfaW5ib3hfdGFncyA9IHRhZ3M7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIHRoaXM7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFtcclxuICAgICAgICAgICAgICAgICAgICAnJHN0YXRlJywgXHJcbiAgICAgICAgICAgICAgICAgICAgJyRyb290U2NvcGUnLCBcclxuICAgICAgICAgICAgICAgICAgICAnJHVybFJvdXRlcicsIFxyXG4gICAgICAgICAgICAgICAgICAgICdFQycsIFxyXG4gICAgICAgICAgICAgICAgICAgICdGYWNlYm9va0ZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdMaW5rZWRpbkZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdUd2l0dGVyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdCbG9nZ2VyRmVlZCcsIFxyXG4gICAgICAgICAgICAgICAgICAgICdHb29nbGVQbHVzRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1lvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAnUGludGVyZXN0RmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ0luc3RhZ3JhbUZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICckaW5qZWN0b3InLCBcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cmxSb3V0ZXIsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBFQywgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEZhY2Vib29rRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIExpbmtlZGluRmVlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgVHdpdHRlckZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBCbG9nZ2VyRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdvb2dsZVBsdXNGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgWW91VHViZUZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBQaW50ZXJlc3RGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgSW5zdGFncmFtRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRpbmplY3RvciApXHJcbntcclxuXHJcbiAgICBmdW5jdGlvbiBTb2NpYWwoIHByb2ZpbGUgKVxyXG4gICAge1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlIHx8IHt9O1xyXG5cclxuICAgICAgICAvLyB0aGlzLmZlZWRzID0ge307XHJcbiAgICAgICAgdGhpcy5mZWVkc19pbl9vcmRlciA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLnJlZnJlc2hfaW50ZXJ2YWwgPSAwO1xyXG5cclxuICAgICAgICAvL0luYm94IGZpbHRlcnNcclxuICAgICAgICB0aGlzLnVzZXJfaW5ib3hfZmlsdGVycyA9IFtdOy8vZ2V0X3VzZXJfaW5ib3hfZmlsdGVycygpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7IFxyXG4gICAgICAgIHRoaXMuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPSB0cnVlOyBcclxuICAgIH0gXHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5wYWdlcyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLnBhZ2VzO1xyXG4gICAgfTtcclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLmxvZyA9IGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZGlyKCB0aGlzICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiggY29udGFpbmVyICl7XHJcblxyXG4gICAgICAgIHZhciAkY29udGFpbmVyID0gY29udGFpbmVyIHx8ICQoJyNzb2NpYWwnKTtcclxuXHJcbiAgICAgICAgJGNvbnRhaW5lci5odG1sKCcnKTtcclxuICAgIH07XHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiggKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vQXNzaWduIGl0IHRvIGdsb2JhbCBvYmplY3QgXHJcbiAgICAgICAgLy93aW5kb3cuZ2xvYmFscy5zb2NpYWwgPSB0aGlzOyBcclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBwcmV2aW91c19mZWVkcyA9IFtdLFxyXG4gICAgICAgICAgICBuZXdfc3RyZWFtc19vcmRlciA9IFtdLFxyXG4gICAgICAgICAgICBwcmV2X2ZlZWRzX2luX29yZGVyID0gc2VsZi5mZWVkc19pbl9vcmRlcjtcclxuXHJcbiAgICAgICAgJHJvb3RTY29wZS5zb2NpYWwgPSBzZWxmO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIgPSBbXTtcclxuXHJcbiAgICAgICAgLy9nZXQgbmV3IHN0cmVhbXMgb3JkZXJcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goIHNlbGYucHJvZmlsZS5zdHJlYW1zLCBmdW5jdGlvbiggdGhpc19zdHJlYW0gKXtcclxuICAgICAgICAgICAgdmFyIGlkID0gKCBbJ3JzcycsICdzZWFyY2gnLCAnb3V0cmVhY2gnXS5pbmRleE9mKCB0aGlzX3N0cmVhbS5zdHJlYW1JZCApID4gLTEgKSA/IHRoaXNfc3RyZWFtLmlkIDogdGhpc19zdHJlYW0uc3RyZWFtSWQ7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiggc2VsZi5wcm9maWxlLmlkLmluZGV4T2YoJ2Zhdm9yaXRlJykgIT09IC0xIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQgKz0gJ18nICsgIHRoaXNfc3RyZWFtLnByb2ZpbGUuaWQgKyAnXycgKyB0aGlzX3N0cmVhbS5uZXR3b3JrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5ld19zdHJlYW1zX29yZGVyLnB1c2goIGlkICk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2cobmV3X3N0cmVhbXNfb3JkZXIpO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBzZWxmLnByb2ZpbGUuc3RyZWFtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfc3RyZWFtID0gc2VsZi5wcm9maWxlLnN0cmVhbXNbIGkgXSxcclxuICAgICAgICAgICAgICAgIGlkID0gKCBbJ3JzcycsICdzZWFyY2gnLCAnb3V0cmVhY2gnXS5pbmRleE9mKCB0aGlzX3N0cmVhbS5zdHJlYW1JZCApID4gLTEgKSA/IHRoaXNfc3RyZWFtLmlkIDogdGhpc19zdHJlYW0uc3RyZWFtSWQsXHJcbiAgICAgICAgICAgICAgICBuZXR3b3JrID0gc2VsZi5wcm9maWxlLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpLFxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfc3RyZWFtLnZhbHVlID09ICd0cnVlJyAgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQUFBOjonK25ldHdvcmspO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICggbmV0d29yayApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZhY2Vib29rJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGQiB0ZXN0Ojo6Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IEZhY2Vib29rRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdsaW5rZWRpbic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IExpbmtlZGluRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IFR3aXR0ZXJGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Jsb2dnZXInOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgQmxvZ2dlckZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ29vZ2xlcGx1cyc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBHb29nbGVQbHVzRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IFlvdVR1YmVGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBQaW50ZXJlc3RGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBJbnN0YWdyYW1GZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGdldEV4aXN0aW5nU3RhdGUgPSAkc3RhdGUuZ2V0KG5ld19mZWVkLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggbmV3X2ZlZWQgJiYgJHN0YXRlLmdldChuZXdfZmVlZC5wYWdlX2lkKSA9PT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZmVlZHNfaW5fb3JkZXIucHVzaCggbmV3X2ZlZWQgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgbmV3X2ZlZWQucmVuZGVyID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZC5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy92YXIgJG5ld19mZWVkID0gbmV3X2ZlZWQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vJGNvbnRhaW5lci5hcHBlbmQoICRuZXdfZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBuZXdfZmVlZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHByZXZfZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IG5ld19mZWVkLnBhZ2VfaWR9KTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiggaW5kZXggPj0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyLnB1c2gocHJldl9mZWVkc19pbl9vcmRlcltpbmRleF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB1cGRhdGVkX3N0cmVhbXNfb3JkZXIgPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5mZWVkc19pbl9vcmRlciwgZnVuY3Rpb24odGhpc19mZWVkKXtcclxuICAgICAgICAgICAgdXBkYXRlZF9zdHJlYW1zX29yZGVyLnB1c2godGhpc19mZWVkLnBhZ2VfaWQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgICAgIC8vRGVjaWRlIHRoZSBmZWVkIHBhZ2UgdG8gc2hvdyBieSBkZWZhdWx0XHJcbiAgICAgICAgdmFyIGZlZWRfcGFnZV90b19zaG93ID0gJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy90byBtYWludGFpbiBsYXN0IGZlZWQtc2VsZWN0b3IgcG9zaXRpb25cclxuICAgICAgICBpZiggc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciAmJiBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgPT09IDAgKSBcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlcltzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3JdO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKCBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yXTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3RvciA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPT09IGZhbHNlICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3BhZ2VfdG9fc2hvdyA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlclt1cGRhdGVkX3N0cmVhbXNfb3JkZXIubGVuZ3RoLTFdO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkX3NlbGVjdG9yX2luaXRpYWxfdHJpZ2dlciA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vYXNzaWduIHVwZGF0ZWQgc3RyZWFtcyB0byBjdXJyZW50IG9iamVjdFxyXG4gICAgICAgIHNlbGYudXBkYXRlZF9zdHJlYW1zX29yZGVyID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyO1xyXG5cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0T2JqKGlkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KHNlbGYuZmVlZHNfaW5fb3JkZXIsIHsgIHBhZ2VfaWQ6IGlkfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzZWxmLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qY29uc29sZS5sb2coJ3VwZGF0ZWRfc3RyZWFtc19vcmRlcicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVwZGF0ZWRfc3RyZWFtc19vcmRlcik7XHJcbiAgICAgICAgY29uc29sZS5sb2coZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGdldE9iaihmZWVkX3BhZ2VfdG9fc2hvdykpOyovXHJcbiAgICAgICAgdmFyIGN1cnJlbnRfb2JqID0geyduYW1lJzoncmFtJ307Ly9nZXRPYmooZmVlZF9wYWdlX3RvX3Nob3cpO1xyXG5cclxuICAgICAgICAkc3RhdGUuZ28oZmVlZF9wYWdlX3RvX3Nob3csIHtvYmo6Y3VycmVudF9vYmp9LCB7Y2FjaGU6IHRydWV9KTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ3RoaXMuZmVlZHNfaW5fb3JkZXInKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmZlZWRzX2luX29yZGVyKTtcclxuICAgICAgICByZXR1cm4gdGhpczsgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcbiAgICBcclxuXHJcblxyXG4gICAgXHJcblxyXG5cclxuICAgIHJldHVybiBTb2NpYWw7XHJcbn1dO1xyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBmZWVkX2l0ZW0gPSAnJztcclxuXHJcbiAgICAgICAgc2VsZi5kYXRhID0gaXRlbV9kYXRhO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYuZmVlZCA9IGZlZWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5wcm9maWxlID0gZmVlZC5wcm9maWxlO1xyXG5cclxuICAgICAgICBzZWxmLmVsZW1lbnQgPSAnJztcclxuICAgIH1cclxuXHJcbiAgICBGZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50O1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEJsb2dnZXJGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJsb2dnZXJGZWVkO1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdibF9hbGwnOiB0aGlzLmdldEJsb2dQb3N0cygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmdldEJsb2dQb3N0cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0QmxvZ2dlclBvc3RzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWRcclxuICAgICAgICAgICAgLy9uZXh0OiB0aGlzLm5leHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvYmxvZ2dlcicsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnJWMqKioqKioqKioqKioqKioqICBnZXRCbG9nZ2VyUG9zdHMnLCdjb2xvcjogY3JpbXNvbicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5uZXh0ICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubmV4dCA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLm5leHQgKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICBzZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICByZXR1cm47ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEJsb2dnZXJQb3N0cycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBuZXh0OiB0aGlzLm5leHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvYmxvZ2dlcicsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVjKioqKioqKioqKioqKioqKiAgZ2V0QmxvZ2dlclBvc3RzIE5FWFQgJywnY29sb3I6IGNyaW1zb24nKTtcclxuICAgICAgICAgICAgY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoubmV4dCAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHBwID0gdGhpc19kYXR1bS5wcm9maWxlUGljP3RoaXNfZGF0dW0ucHJvZmlsZVBpYzonJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYoIHBwLmluZGV4T2YoJy8vJykgPT09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ucHJvZmlsZVBpYyA9IHRoaXNfZGF0dW0ucHJvZmlsZVBpYy5yZXBsYWNlKCcvLycsICdodHRwczovLycpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IGRhdGE7XHJcblxyXG4gICAgICAgIGlmICggXy5pc0VtcHR5KCBkYXRhLm5hbWUgKSApIGRhdGEubmFtZSA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYoIHR5cGVvZiBkYXRhLm1lc3NhZ2UgPT0gJ3N0cmluZycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgPSAvKic8YSBjbGFzcz1cInJzcy1pdGVtLXRpdGxlXCIgaHJlZj1cIicgK2RhdGEucGVybWFsaW5rKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArZGF0YS5uYW1lKyAnPC9hPicgKyAqL1xyXG4gICAgICAgICAgICBkYXRhLm1lc3NhZ2VcclxuICAgICAgICAgICAgLnJlcGxhY2UoLzxoXFxkL2dpLCc8ZGl2JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoLzxcXC9oXFxkPi9naSwnPC9kaXY+JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL2NsYXNzPVwiXFx3KlwiL2dpLCcnKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvc3R5bGU9L2dpLCAnZGF0YS1zPScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC93aWR0aD0vZ2ksICdkYXRhLXc9JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL2hlaWdodD0vZ2ksICdkYXRhLWg9JylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL2EgaHJlZi9naSwgJ2EgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZicpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC88YnJcXHMqW1xcL10/Pi9naSwgJzxzcGFuPjwvc3Bhbj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZXNzYWdlID0gZGF0YS5tZXNzYWdlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07ICBcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEJsb2dnZXJGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBDb2xsYXBzaWJsZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxuICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5yZXR3ZWV0O1xyXG4gICAgXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5mYXZvcml0ZSA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmZhdm9yaXRlO1xyXG5cclxuICAgIHJldHVybiBDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckY29tcGlsZScsIGZ1bmN0aW9uKCAkY29tcGlsZSApeyAgXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBpdGVtOiAnPWl0ZW0nXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9mZWVkLWl0ZW0uaHRtbCcsXHJcbiAgICAgIGxpbms6ZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHNjb3BlLmN2ID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAgICAgYWxlcnQoNTUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHNjb3BlLmRhdGEgPSBzY29wZS5pdGVtLmdldFVJRGF0YSgpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB2YXIgdGVtcGxhdGUgPSAnPGRpdiBjbGFzcz1cImNhcmRcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaXRlbSBpdGVtLWF2YXRhclwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGltZyBzcmM9XCJ7ezo6ZGF0YS5wcm9maWxlSW1nfX1cIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxoMj57ezo6ZGF0YS5wcm9maWxlTmFtZX19PC9oMj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxwPnt7OjpkYXRhLnRpbWV9fTwvcD4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaXRlbSBpdGVtLWJvZHlcIiBuZy1jbGljaz1cInJlZnJlc2hBY2NvdW50KGl0ZW0pXCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8cCBjbGFzcz1cInRlc3RcIj5SQU1BTU1BTUFNQU1BTUFNLi4uPC9wPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHAgbmctYmluZC1odG1sPVwiZGF0YS5pdGVtVGV4dFwiPjwvcD4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxwIG5nLWJpbmQtaHRtbD1cImRhdGEuaXRlbU1lZGlhXCI+PC9wPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHA+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJzdWJkdWVkXCI+MSBMaWtlPC9hPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwic3ViZHVlZFwiPjUgQ29tbWVudHM8L2E+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L3A+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8bWFuYWdlLXRlc3Q+PC9tYW5hZ2UtdGVzdD4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XHJcblxyXG4gICAgICAgICAgdGVtcGxhdGUgPSAkKHRlbXBsYXRlKTsgXHJcblxyXG4gICAgICAgICAgLy90ZW1wbGF0ZS5maW5kKCcudGVzdCcpLmFwcGVuZChzY29wZS5kYXRhLml0ZW1UZXN0KTsgICAgICAgICAgICAgXHJcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZCggJGNvbXBpbGUodGVtcGxhdGUpKHNjb3BlKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgIFxyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckY29tcGlsZScsIGZ1bmN0aW9uKCAkY29tcGlsZSApeyAgXHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBpdGVtOiAnPWl0ZW0nXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9mZWVkLWl0ZW0uaHRtbCcsXHJcbiAgICAgIGxpbms6ZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdmFyIHRlbXBsYXRlID0gJycgO1xyXG4gICAgICAgICAgc3dpdGNoKCBzY29wZS5pdGVtLmNvbnN0cnVjdG9yLm5hbWUgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdUaW1lbGluZUZlZWRJdGVtJzpcclxuICAgICAgICAgICAgICB0ZW1wbGF0ZSA9ICc8dGltZWxpbmUtZmVlZC1pdGVtIGl0ZW09XCJpdGVtXCI+PC90aW1lbGluZS1mZWVkLWl0ZW0+JztcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnTGlua2VkaW5GZWVkSXRlbSc6XHJcbiAgICAgICAgICAgICAgdGVtcGxhdGUgPSAnPGxpbmtlZGluLWZlZWQtaXRlbSBpdGVtPVwiaXRlbVwiPjwvbGlua2VkaW4tZmVlZC1pdGVtPic7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ0luc3RhZ3JhbUZlZWRJdGVtJzpcclxuICAgICAgICAgICAgICB0ZW1wbGF0ZSA9ICc8aW5zdGFncmFtLWZlZWQtaXRlbSBpdGVtPVwiaXRlbVwiPjwvaW5zdGFncmFtLWZlZWQtaXRlbT4nO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdDb2xsYXBzaWJsZUZlZWRJdGVtJzpcclxuICAgICAgICAgICAgICB0ZW1wbGF0ZSA9ICc8Y29sbGFwc2libGUtZmVlZC1pdGVtIGl0ZW09XCJpdGVtXCI+PC9jb2xsYXBzaWJsZS1mZWVkLWl0ZW0+JztcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtJzpcclxuICAgICAgICAgICAgICB0ZW1wbGF0ZSA9ICc8bGlua2VkaW4tY29sbGFwc2libGUtZmVlZC1pdGVtIGl0ZW09XCJpdGVtXCI+PC9saW5rZWRpbi1jb2xsYXBzaWJsZS1mZWVkLWl0ZW0+JztcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nOlxyXG4gICAgICAgICAgICAgIHRlbXBsYXRlID0gJzx0d2l0dGVyLWNvbGxhcHNpYmxlLWZlZWQtaXRlbSBpdGVtPVwiaXRlbVwiPjwvdHdpdHRlci1jb2xsYXBzaWJsZS1mZWVkLWl0ZW0+JztcclxuICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgdGVtcGxhdGUgPSAnPHRpbWVsaW5lLWZlZWQtaXRlbSBpdGVtPVwiaXRlbVwiPjwvdGltZWxpbmUtZmVlZC1pdGVtPic7XHJcblxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vdGVtcGxhdGUuZmluZCgnLnRlc3QnKS5hcHBlbmQoc2NvcGUuZGF0YS5pdGVtVGVzdCk7ICAgICAgICAgICAgIFxyXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmQoICRjb21waWxlKHRlbXBsYXRlKShzY29wZSkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGNvbXBpbGUnLCBmdW5jdGlvbiggJGNvbXBpbGUgKXsgIFxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgaXRlbTogJz1pdGVtJ1xyXG4gICAgICB9LFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXJlY3RpdmVzL2ZlZWQtaXRlbS5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUuYWFhID0gZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgYWxlcnQoNDQ0KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBzY29wZS5kYXRhID0gc2NvcGUuaXRlbS5nZXRVSURhdGEoKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdmFyICR0aGlzID0gJChlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vbGlrZXMgLCBjb21tZW50cyBhbmQgc2hhcmVzXHJcbiAgICAgICAgICBpZiggc2NvcGUuZGF0YS5sY19kaXNwIClcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBpZiggISAkLmlzRW1wdHlPYmplY3Qoc2NvcGUuZGF0YS5saWtlcyApIClcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHZhciAkbGlrZXMgPSAnPHNwYW4gbmctY2xpY2s9XCJhYWEoKVwiPicrc2NvcGUuZGF0YS5saWtlcy50ZXh0Kyc8L3NwYW4+JztcclxuICAgICAgICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuaXRlbS1saWtlcy1jb21tZW50cycpLmFwcGVuZCggJGNvbXBpbGUoJGxpa2VzKShzY29wZSkgKTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIGlmKCAhICQuaXNFbXB0eU9iamVjdChzY29wZS5kYXRhLmNvbW1lbnRzICkgKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgdmFyICRjb21tZW50cyA9ICc8c3BhbiA+JytzY29wZS5kYXRhLmNvbW1lbnRzLnRleHQrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmZpbmQoJy5pdGVtLWxpa2VzLWNvbW1lbnRzJykuYXBwZW5kKCAkY29tcGlsZSgkY29tbWVudHMpKHNjb3BlKSApO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaWYoICEgJC5pc0VtcHR5T2JqZWN0KHNjb3BlLmRhdGEuc2hhcmVzICkgKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgdmFyICRzaGFyZXMgPSAnPHNwYW4gPicrc2NvcGUuZGF0YS5zaGFyZXMudGV4dCsnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZmluZCgnLml0ZW0tbGlrZXMtY29tbWVudHMnKS5hcHBlbmQoICRjb21waWxlKCRzaGFyZXMpKHNjb3BlKSApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy90ZW1wbGF0ZS5maW5kKCcudGVzdCcpLmFwcGVuZChzY29wZS5kYXRhLml0ZW1UZXN0KTsgICAgICAgICAgICAgXHJcbiAgICAgICAgICAvL2VsZW1lbnQuYXBwZW5kKCAkY29tcGlsZSh0ZW1wbGF0ZSkoc2NvcGUpICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBGZWVkSXRlbSA9ICBGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgVGltZWxpbmVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdUaW1lbGluZUZlZWRJdGVtJyk7XHJcbiAgICBcclxuXHJcbiAgICBmdW5jdGlvbiBEcm9wZG93bkZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcblxyXG4gICAgICAgIHRoaXMubmV4dCA9ICcnO1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdF9lbGVtZW50ID0gZmVlZC5kZWZhdWx0X2VsZW1lbnQgfHwgJyc7XHJcbiAgICB9XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBEcm9wZG93bkZlZWRJdGVtO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9kcm9wZG93biA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkcm9wZG93biA9IFtdLFxyXG4gICAgICAgICAgICBwbGFjZWhvbGRlciA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZGF0YS5sZW5ndGggPiAwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGYuZGF0YSA9IHNlbGYuZGF0YS5zb3J0KGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZUEgPSAoIHR5cGVvZiBhLm5hbWUgPT09ICdzdHJpbmcnID8gYS5uYW1lLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVCID0gKCB0eXBlb2YgYi5uYW1lID09PSAnc3RyaW5nJyA/IGIubmFtZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG5hbWVBID4gbmFtZUIgKSByZXR1cm4gMTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggbmFtZUEgPCBuYW1lQiApIHJldHVybiAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5kYXRhID0gc2VsZi5kYXRhLnNvcnQoZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVBID0gKCB0eXBlb2YgYS5jaGFubmVsVGl0bGUgPT09ICdzdHJpbmcnID8gYS5jaGFubmVsVGl0bGUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVCID0gKCB0eXBlb2YgYi5jaGFubmVsVGl0bGUgPT09ICdzdHJpbmcnID8gYi5jaGFubmVsVGl0bGUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggbmFtZUEgPiBuYW1lQiApIHJldHVybiAxO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggbmFtZUEgPCBuYW1lQiApIHJldHVybiAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSByZXR1cm4gMDtcclxuICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBzZWxmLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoaXNfZ3JvdXAgPSBzZWxmLmRhdGFbIGkgXSxcclxuICAgICAgICAgICAgICAgICAgICBncm91cF9pZCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19ncm91cCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfZ3JvdXAuY2hhbm5lbElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzX2dyb3VwLmNoYW5uZWxUaXRsZVxyXG4gICAgICAgICAgICAgICAgICAgIH07ICBcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGdyb3VwX2lkID0gdGhpc19ncm91cC5pZDtcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInICkgZ3JvdXBfaWQgPSB0aGlzX2dyb3VwLmlkX3N0cjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZHJvcGRvd24ucHVzaCh7J2lkJzpncm91cF9pZCwgJ25hbWUnOnRoaXNfZ3JvdXAubmFtZSwgJ2RhdGEnOnRoaXNfZ3JvdXB9KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCggdGhpcy5mZWVkLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbGlzdHMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpX2JvYXJkJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj0gJ1lvdSBkbyBub3QgaGF2ZSBib2FyZHMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXMnOlxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXNfb25seSc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSdZb3UgZG8gbm90IGhhdmUgcGFnZXMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgZG8gbm90IGZvbGxvdyBhbnkgY29tcGFueSB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ3l0X215U3Vic2NyaXB0aW9uJzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9ICdZb3UgaGF2ZW5cXCd0IGFkZGVkIGFueSBzdWJzY3JpcHRpb25zIHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbGlrZXMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gKCdZb3UgaGF2ZW5cXCd0IGxpa2VkIGFueSBwYWdlcyB5ZXQuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBhcmUgbm90IGEgbWVtYmVyIG9mIGFueSBncm91cHMuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHsgJ2NvdW50Jzpkcm9wZG93bi5sZW5ndGgsICdkYXRhJzpkcm9wZG93biwgJ3BsYWNlaG9sZGVyJzogcGxhY2Vob2xkZXJ9O1xyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5zZXRfZGVmYXVsdF9ncm91cF9pZCA9IGZ1bmN0aW9uICggc2VsX29iaiApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAkX3RoaXMgPSBzZWxfb2JqO1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRfdGhpcy5kYXRhLmlkO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJGVsbS5kYXRhKCdkYXRhJykuaWRfc3RyO1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbGlzdHMnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUubGlzdHMuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7ICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHRpbmcgb2YgZGVmYXVsdCBncm91cCBpZFxyXG4gICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC51cGRhdGVGZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG5cclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQudXBkYXRlSW50ZXJ2YWxJRCA9IHNldEludGVydmFsKCB1cGRhdGVGZWVkTm90aWZpY2F0aW9uLCA1KjYwKjEwMDAsIHNlbGYuZmVlZCApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdzZXREZWZhdWx0R3JvdXBJZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAvL2RlZmF1bHRHcm91cElkOiAkKCB0aGlzICkuZGF0YSgnZGF0YScpLmlkLFxyXG4gICAgICAgICAgICBkZWZhdWx0R3JvdXBJZDogc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQsXHJcbiAgICAgICAgICAgIG5ldHdvcms6IHNlbGYuZmVlZC5uZXR3b3JrXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgdXJsOiBcImZlZWQvZGVmYXVsdEdyb3VwSWRcIixcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyggJ3NldHRpbmcgc2V0RGVmYXVsdEdyb3VwSWQ6ICcgKyBncm91cF9pZCApXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvKnZhciBkYXRhID0gSlNPTi5wYXJzZSggcmVzcCApO1xyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggJ3NldCByZXNwb25zZTonIClcclxuICAgICAgICAgICAgY29uc29sZS5kaXIoIGRhdGEgKSovXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggc2VsX29iaiApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICAkX3RoaXMgPSBzZWxfb2JqO1xyXG4gICAgICAgICAgICBncm91cF9pZCA9ICRfdGhpcy5kYXRhLmlkO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJGVsbS5kYXRhKCdkYXRhJykuaWRfc3RyO1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbGlzdHMnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGUubGlzdHMuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7ICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3NldHRpbmcgb2YgZGVmYXVsdCBncm91cCBpZFxyXG4gICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2VsZi5mZWVkLmRlZmF1bHRfZWxlbWVudCA9IGdyb3VwX2lkO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC51cGRhdGVGZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5mZWVkLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG5cclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQudXBkYXRlSW50ZXJ2YWxJRCA9IHNldEludGVydmFsKCB1cGRhdGVGZWVkTm90aWZpY2F0aW9uLCA1KjYwKjEwMDAsIHNlbGYuZmVlZCApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0geyB0eXBlOiAnR0VUJyB9LFxyXG4gICAgICAgICAgICBkYXRhID0ge307XHJcblxyXG4gICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogJF90aGlzLmRhdGEuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ6IHNlbGYubmV4dFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmVxdWVzdC51cmwgPSAnZmVlZC9mYkdyb3VwJztcclxuXHJcbiAgICAgICAgcmVxdWVzdC5kYXRhID0gZGF0YTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AsXHJcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnbGlua2VkaW4nICkgc2VsZi5uZXh0ID0gMjU7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEudmFsdWVzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAnbGlua2VkaW4nKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBkYXRhLnZhbHVlc1sgMCBdLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgbSA9IGRhdGEudmFsdWVzLmxlbmd0aDsgaiA8IG07IGorKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfdmFsID0gZGF0YS52YWx1ZXNbIGogXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1bW1hcnkgPSB0aGlzX3ZhbC5zdW1tYXJ5IHx8ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQgIT09IHVuZGVmaW5lZCAmJiB0aGlzX3ZhbC51cGRhdGVDb250ZW50LmN1cnJlbnRVcGRhdGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzX3ZhbC51cGRhdGVDb250ZW50LmN1cnJlbnRVcGRhdGUuY29udGVudCAhPT0gdW5kZWZpbmVkKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBjb250ZW50LnRpdGxlICE9PSB1bmRlZmluZWQgJiYgY29udGVudC5zdWJtaXR0ZWRVcmwgIT09IHVuZGVmaW5lZCAmJiAhKC9cXC4oanBnfGpwZWd8cG5nfGJtcHx0aWZmfGF2aXxtcGVnfG1rdnxvZ2d8bW92fG1wZWd8bXBnfG1wZXxmbHZ8M2dwfGdpZikkL2kpLnRlc3QoY29udGVudC50aXRsZSkgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJlX3N1bW1hcnkgPSAnPGEgaHJlZj1cImphdmFzY3JpcHQ6O1wiIG9uQ2xpY2s9XCJFQy5VSS5JQUIoXFwnJyArIGNvbnRlbnQuc3VibWl0dGVkVXJsICsgJ1xcJyk7XCI+JyArIGNvbnRlbnQudGl0bGUgKyAnPC9hPiAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGFbIGogXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfdmFsLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzxwPjxzcGFuIGNsYXNzPVwibG4tZ3JvdXAtdGl0bGVcIj4nICsgdGhpc192YWwudGl0bGUgKyAnOjwvc3Bhbj48L3A+JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJlX3N1bW1hcnk6IHByZV9zdW1tYXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBzdW1tYXJ5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tTmFtZTogKCB0aGlzX3ZhbC5jcmVhdG9yLmZpcnN0TmFtZS50b0xvd2VyQ2FzZSgpID09ICdwcml2YXRlJyA/IHRoaXNfdmFsLmNyZWF0b3IuZmlyc3ROYW1lIDogdGhpc192YWwuY3JlYXRvci5maXJzdE5hbWUgKyAnICcgKyB0aGlzX3ZhbC5jcmVhdG9yLmxhc3ROYW1lICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWM6IHRoaXNfdmFsLmNyZWF0b3IucGljdHVyZVVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlVGltZTogcGFyc2VJbnQoIHRoaXNfdmFsLmNyZWF0aW9uVGltZXN0YW1wICkgLyAxMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tSWQ6IHRoaXNfdmFsLmNyZWF0b3IuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1lbnRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdGhpc192YWwuY29tbWVudHMuX3RvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudDogdGhpc192YWwuY29tbWVudHMudmFsdWVzIHx8IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpa2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdGhpc192YWwubGlrZXMuX3RvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlrZTogKCB0aGlzX3ZhbC5saWtlcy52YWx1ZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogdGhpc192YWwubGlrZXMudmFsdWVzLmNyZWF0b3IgKSB8fCBbXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnNoaXA6IHRoaXNfdmFsLnJlbGF0aW9uVG9WaWV3ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJfbGlrZXM6IHRoaXNfdmFsLnJlbGF0aW9uVG9WaWV3ZXIuaXNMaWtlZCB8fCBcImZhbHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IDI1O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLmRhdGEubmV4dFRva2VuO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gZGF0YS5kYXRhLml0ZW1zO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnICkgc2VsZi5uZXh0ID0gZGF0YS5uZXh0O1xyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAncGludGVyZXN0JyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5yZXR1cm5Db2RlID09PSAnRkFJTCcgfHwgKCBkYXRhLmRhdGEuc3RhdHVzICYmIGRhdGEuZGF0YS5zdGF0dXMgPT09ICdmYWlsdXJlJyApICkgZGF0YS5kYXRhID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYWdlID0gZGF0YS5kYXRhLnBhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBwYWdlICYmIHBhZ2UuY3Vyc29yICkgc2VsZi5uZXh0ID0gcGFnZS5jdXJzb3I7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5kYXRhID0gZGF0YS5kYXRhLmRhdGE7ICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZGF0YSApICkgaXRlbXMgPSBbIGRhdGEuZGF0YSBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaXRlbXMgPSBkYXRhLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpdGVtcy5sZW5ndGggPiAwICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicpIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdsaW5rZWRpbicgKSBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSBpdGVtc1sgMCBdLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdnb29nbGVwbHVzJyApIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0ucG9zdElEO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBpdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19ncm91cCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJykgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBpdGVtc1sgaSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXI6IGl0ZW1zWyBpIF0udXNlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBpdGVtc1sgaSBdLmNyZWF0ZWRfYXQgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmF2b3JpdGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBpdGVtc1sgaSBdLmZhdm9yaXRlX2NvdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBieV9tZTogaXRlbXNbIGkgXS5mYXZvcml0ZWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHdlZXRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBpdGVtc1sgaSBdLnJldHdlZXRfY291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5X21lOiBpdGVtc1sgaSBdLnJldHdlZXRlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICggKCBpdGVtc1sgaSBdLnJldHdlZXRlZF9zdGF0dXMgIT09IHVuZGVmaW5lZCApID8gaXRlbXNbIGkgXS5yZXR3ZWV0ZWRfc3RhdHVzLmlkX3N0ciA6IGl0ZW1zWyBpIF0uaWRfc3RyIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGl0ZW1zWyBpIF0udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tTmFtZTogKCBpdGVtc1sgaSBdLm5hbWUgfHwgaXRlbXNbIGkgXS51c2VyLm5hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VybmFtZTogKCBpdGVtc1sgaSBdLnNjcmVlbl9uYW1lIHx8IGl0ZW1zWyBpIF0udXNlci5zY3JlZW5fbmFtZSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVQaWM6ICggaXRlbXNbIGkgXS5wcm9maWxlX2ltYWdlX3VybCB8fCBpdGVtc1sgaSBdLnVzZXIucHJvZmlsZV9pbWFnZV91cmwgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0SUQ6IGl0ZW1zWyBpIF0uaWRfc3RyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBpdGVtc1sgaSBdLmlkX3N0cixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXdfZGF0YTogaXRlbXNbIGkgXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zWyBpIF0uZW50aXRpZXMgIT09IHVuZGVmaW5lZCAmJiBpdGVtc1sgaSBdLmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggaXRlbXNbIGkgXS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKSApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYSA9IHNlbGYuZ2V0X21lZGlhX2RhdGEoIGl0ZW1zWyBpIF0uZW50aXRpZXMubWVkaWEubWVkaWFfdXJsICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5pZCA9PSAnbG5fY29tcGFuaWVzJyApIG5ld19ncm91cCA9IG5ldyBMaW5rZWRpbkZlZWRJdGVtKCBpdGVtc1sgaSBdLCBzZWxmLmZlZWQgKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHNlbGYuZmVlZC5mb3JtYXRfaXRlbSggaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSBzZWxmLmZlZWQuZm9ybWF0X2l0ZW0oIGl0ZW1zWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ3BpbnRlcmVzdCcgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0gc2VsZi5mZWVkLmZvcm1hdF9pdGVtKCBpdGVtc1sgaSBdICk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGl0ZW1zWyBpIF0sIHNlbGYuZmVlZCApOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mZWVkLml0ZW1zLnB1c2goIG5ld19ncm91cCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5nZXRfbWVkaWFfZGF0YSA9IGZ1bmN0aW9uICggbWVkaWFfdXJscyApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSBbXTtcclxuICAgICAgICBhbmd1bGFyLmZvckVhY2gobWVkaWFfdXJscywgZnVuY3Rpb24obWVkaWFfdXJsKXtcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdwaG90bycsXHJcbiAgICAgICAgICAgICAgICBzcmM6IG1lZGlhX3VybFxyXG4gICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIERyb3Bkb3duRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtLCBDb2xsYXBzaWJsZUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gRmFjZWJvb2tGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgIT09ICdVc2VyJyAmJiBbJ3dhbGxQb3N0cycsJ2ZiX25vdGlmaWNhdGlvbnMnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGYWNlYm9va0ZlZWQ7XHJcblxyXG4gICAgLypGYWNlYm9va0ZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyBcclxuICAgICAgICAgICAgLGN1cnJlbnRJRCA9IHNlbGYudXBkYXRlSW50ZXJ2YWxJRDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldE5ld3NGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6ICcvYWpheC5waHAnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoICggc2VsZi5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICd3YWxsUG9zdHMnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ3dhbGxQb3N0cyc7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEud2FsbCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5saW1pdCA9IDEwO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZiX25vdGlmaWNhdGlvbnMnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ25vdGlmaWNhdGlvbnMnOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmxpbWl0ID0gMTA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaW5Cb3gnOiByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2luQm94JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWN0aW9uID0gJ2dldEZiQ29udmVyc2lvbnMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmICggc2VsZi5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09PSBcIlVzZXJcIikgcmVxdWVzdC5kYXRhLm5leHQgPSBcIi9pbmJveFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLm5leHQgPSBcIi9jb252ZXJzYXRpb25zXCI7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY3VwZGF0ZUZlZWROb3RpZmljYXRpb24oJyArIHNlbGYuaWQgKyAnKSByZXNwb25zZTonLCAnY29sb3I6b3JhbmdlcmVkJyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnRJRCA9PT0gc2VsZi51cGRhdGVJbnRlcnZhbElEICkgLy8gZGlkbid0IHJlZnJlc2ggZHVyaW5nIHJlcXVlc3RcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0SUQgPSAnIyMjJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZpcnN0SXRlbUlEICkgZmlyc3RJRCA9IHNlbGYuZmlyc3RJdGVtSUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZpcnN0SUQgOjogJyArIGZpcnN0SUQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdOyAvLyBpbmNvbWluZyBtZXNzYWdlcyBhcnJheVxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnaW5Cb3gnICYmIGZpcnN0SUQgIT09ICcjIyMnIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VzZXJJZCA9IHNlbGYucHJvZmlsZS5kYXRhLnBhZ2VJZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEuZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbW1lbnRzID0gZGF0YS5kYXRhWyBpIF0uY29tbWVudHMuY29tbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBjb21tZW50cyApICkgY29tbWVudHMgPSBbIGNvbW1lbnRzIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGsgPSAwLCBsbCA9IGNvbW1lbnRzLmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2NvbW1lbnQgPSBjb21tZW50c1sgayBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfY29tbWVudC5mcm9tSWQgIT09IGN1c2VySWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluY29taW5nLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpc19jb21tZW50LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCB0aGlzX2NvbW1lbnQuY3JlYXRlZFRpbWUuc3BsaXQoJysnKVsgMCBdICkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRoaXNfY29tbWVudC5tZXNzYWdlSWRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG1pbmNvbWluZyApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBtaW5jb21pbmcubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiAoIGl0ZW0udGltZSA+IGZpcnN0SUQgPyAxIDogMCApO30pLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICsgYjsgfSwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnaW5Cb3ggaW5kZXggPSAnICsgaW5kZXggKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09ICBtaW5jb21pbmcubGVuZ3RoICkgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gaXRlbS5pZDt9KS5pbmRleE9mKCBmaXJzdElEICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGluZGV4ID09PSAtMSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGZpcnN0SUQgPT09ICcjIyMnICkgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdpbmRleCA6OiAnICsgaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaW5kZXggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGhlYWRlciA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1oZWFkZXInKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAsJGZib2R5ID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICR1cGRhdGVfbm90aWYgPSAkZmJvZHkuZmluZCgnLnVwZGF0ZS1ub3RpZmljYXRpb24nKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHVwZGF0ZV9ub3RpZi5sZW5ndGggPT09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZiA9ICQoJzxkaXYgY2xhc3M9XCJ1cGRhdGUtbm90aWZpY2F0aW9uXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYub24oJ2NsaWNrJywgZnVuY3Rpb24gKCBlICl7ICRoZWFkZXIuZmluZCgnLnJlZnJlc2gtZmVlZCcpLnRyaWdnZXIoJ2NsaWNrJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmJvZHkuZmluZCgnLmZlZWQtaXRlbScpLmZpcnN0KCkuYmVmb3JlKCAkdXBkYXRlX25vdGlmICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnaW5Cb3gnICkgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBtaW5jb21pbmcubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgTWVzc2FnZScgKyAoIGluZGV4ID09IDEgPyAnJyA6ICdzJyApICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmlkID09PSAnd2FsbFBvc3RzJyApICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gZGF0YS5kYXRhLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IFBvc3QnICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IGRhdGEuZGF0YS5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBOb3RpZmljYXRpb24nICsgKCBpbmRleCA9PSAxID8gJycgOiAncycgKSApOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBjb25zb2xlLmVycm9yKCchISEgY3VycmVudElEICEhIScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTsqLyAgXHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ25ld3NGZWVkJzogdGhpcy5nZXROZXdzRmVlZChcIm5ld3NGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnd2FsbFBvc3RzJzogdGhpcy5nZXROZXdzRmVlZChcIndhbGxQb3N0c1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BhZ2VzRmVlZCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJwYWdlc0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbkJveCc6IHRoaXMuZ2V0RmJDb252ZXJzaW9ucygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGlkZGVuX2dyb3Vwcyc6IHRoaXMuZmlsbEZCSGlkZGVuX0dyb3VwcygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAndGltZWxpbmUnOiB0aGlzLmdldE5ld3NGZWVkKFwidGltZWxpbmVcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdzZWFyY2gnOiB0aGlzLmdldE5ld3NGZWVkKFwic2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnb3V0cmVhY2gnOiB0aGlzLmdldE5ld3NGZWVkKFwic2VhcmNoXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbm90aWZpY2F0aW9ucyc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJub3RpZmljYXRpb25zXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmJfbGlrZXMnOiB0aGlzLmdldE5ld3NGZWVkKFwiZmJfbGlrZXNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnZmJfbGlrZXMnIHx8IHRoaXMuaWQgPT0gJ291dHJlYWNoJyB8fCAoIHRoaXMuaWQgPT0gJ25ld3NGZWVkJyAmJiAhdGhpcy5uZXh0ICkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9zdG9wIGxvZGUgbW9yZSBcclxuICAgICAgICAgICAgdGhpcy5sb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdkb0ZiUmVxdWVzdCcsXHJcbiAgICAgICAgICAgICAgICB3YWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RyZWFtOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgbmV4dDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnbmV3c0ZlZWQnOlxyXG4gICAgICAgICAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3NlYXJjaCc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTsgXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ3dhbGxQb3N0cyc6XHJcbiAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAncGFnZXNGZWVkJzpcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAvLyBjYXNlICdpbkJveCc6XHJcbiAgICAgICAgICAgIC8vICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIikgZGF0YS5uZXh0ID0gJy9pbmJveCc7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgZWxzZSBkYXRhLm5leHQgPSAnL2NvbnZlcnNhdGlvbnMnO1xyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2hpZGRlbl9ncm91cHMnOlxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiBzZWxmLnN0cmVhbS5zZWxlY3RlZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBzZWxmLm5leHRcclxuICAgICAgICAgICAgICAgICAgICB9OyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICBcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYl9ub3RpZmljYXRpb25zJzpcclxuICAgICAgICAgICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5zdHJlYW0gPSAnbm90aWZpY2F0aW9ucyc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiTW9yZScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc3RvcCBsb2RlIG1vcmUgIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkX21vcmVfZmxhZyA9IGZhbHNlOyAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLm5leHQgPT0gZGF0YS5wYWdpbmcubmV4dCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc3RvcCBsb2RlIG1vcmUgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBzZWxmLm5leHQgPSBkYXRhLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAvL3N0b3AgbG9kZSBtb3JlICBcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldE5ld3NGZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbSxcclxuICAgICAgICAgICAgbGltaXQ6IDEwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICggc3RyZWFtID09ICd3YWxsUG9zdHMnIHx8IHN0cmVhbSA9PSAnZmJfaW5mbHVlbmNlcycgfHwgc3RyZWFtID09ICd0aW1lbGluZScgKSBkYXRhLndhbGwgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbmV3cycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHN0cmVhbSA9PSAnc2VhcmNoJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZSA9PT0gdW5kZWZpbmVkICkgLy9lbXB0eSBzZWFyY2ggZmVlZFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnkgIT09IHVuZGVmaW5lZCAmJiBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeS5sZW5ndGggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNlYXJjaF9yZXF1ZXN0KCBzZWxmLCBmdW5jdGlvbiggZGF0YSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL2lmKCBFQy5xdWV1ZV9saXN0WyBCYXNlNjQuZW5jb2RlKCBKU09OLnN0cmluZ2lmeSggcmVxdWVzdCApICkgXSAhPT0gdW5kZWZpbmVkICkgcmV0dXJuO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXF1ZXN0KTtcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBzdHJlYW0gPT0gJ25vdGlmaWNhdGlvbnMnICYmIG9iai5tZXNzYWdlLmluZGV4T2YoJ3lvdSBkbyBub3QgaGF2ZSBzdWZmaWNpZW50IHBlcm1pc3Npb24nKSAhPSAtMSApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGRpdiBjbGFzcz1cImZlZWQtaXRlbVwiPjxkaXYgY2xhc3M9XCJmZWVkLWFsZXJ0XCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQ2xpY2sgXCJPS1wiIHRvIGFkZCBGYWNlYm9vayBOb3RpZmljYXRpb24gRmVlZC4nICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInJlZnJlc2hcIj5PSzwvZGl2PicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PjwvZGl2PicpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50Lm9uKCdjbGljaycsICcucmVmcmVzaCcsIGZ1bmN0aW9uICggZXZlbnQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IHNlbGYucHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdyZWZyZXNoICcsIGlkIClcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW5ld1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkFkZEFjY291bnRQb3B1cCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93TmFtZTogJ0Nvbm5lY3RXaXRoT0F1dGgnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd09wdGlvbnM6ICdkaXJlY3Rvcmllcz0wLGxvY2F0aW9uPTAsc3RhdHVzPTAsbWVudWJhcj0wJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiAnYWNjb3VudC9hY2NvdW50P2FjdGlvbj1zZXRFeHBpcmVkS2V5QnlJRCZpZD0nICtpZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogNjAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogNjUwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldEZiQ29udmVyc2lvbnMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEZiQ29udmVyc2lvbnMnLFxyXG4gICAgICAgICAgICBzdHJlYW06ICdpbkJveCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5uZXh0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiKSBkYXRhLm5leHQgPSBcIi9pbmJveFwiO1xyXG5cclxuICAgICAgICAgICAgZWxzZSBkYXRhLm5leHQgPSBcIi9jb252ZXJzYXRpb25zXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGRhdGEubmV4dCA9IHRoaXMubmV4dDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiQ29udmVyc2lvbnMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSAhPT0gdW5kZWZpbmVkICYmIG9iai5kYXRhLmxlbmd0aCA8IDEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91ciBpbmJveCBpcyBlbXB0eS48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmZpbGxGQkhpZGRlbl9Hcm91cHMgPSBmdW5jdGlvbiAoKVxyXG4gICAgeyAgIFxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgaSA9IDAsXHJcbiAgICAgICAgICAgIGwgPSAwO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJIaWRkZW5fR3JvdXBzJyxcclxuICAgICAgICAgICAgc3RyZWFtOiAnZ3JvdXBzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLm5leHQgKSBkYXRhLm5leHRfcG9zdHMgPSBcIlwiO1xyXG5cclxuICAgICAgICBlbHNlIGRhdGEubmV4dF9wb3N0cyA9IHRoaXMubmV4dDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2ZiSGlkZGVuR3JvdXBzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdGVkX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX25hbWUgPSAnJztcclxuICAgICAgICAgICAgICAgIC8vZ2V0IGZpcnN0IGdyb3VwIGlmIG5vIHNlbGVjdGVkXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuc3RyZWFtLnNlbGVjdGVkID09ICdfZGVmYXVsdF8nICkvLyQuaXNFbXB0eU9iamVjdCggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgKSApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkX2lkID0gb2JqLmRhdGFbIDAgXS5pZDtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9uYW1lID0gb2JqLmRhdGFbIDAgXS5uYW1lO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnN0cmVhbS5zZWxlY3RlZCA9IG9iai5kYXRhWyAwIF0uaWQ7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9pZCA9IHNlbGYuc3RyZWFtLnNlbGVjdGVkO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsID0gb2JqLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZWN0ZWRfaWQgPT0gb2JqLmRhdGFbIGkgXS5pZCApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9uYW1lID0gb2JqLmRhdGFbIGkgXS5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLXR5cGUnKS50ZXh0KCAnR3JvdXA6ICcgKyBzZWxlY3RlZF9uYW1lICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cElkOiBzZWxlY3RlZF9pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dDogJydcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBcImZlZWQvZmJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gZGF0YS5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZGF0YSApICkgaXRlbXMgPSBbIGRhdGEuZGF0YSBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpdGVtcyA9IGRhdGEuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggaXRlbXMgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPlRoaXMgZ3JvdXBcXCdzIGRhdGEgaXMgdW5hdmFpbGFibGUgYXQgdGhpcyB0aW1lLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgXHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggaSA9IDAsIGwgPSBvYmouZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5zdHJlYW0uc2VsZWN0ZWQgIT09IHVuZGVmaW5lZCAmJiBzZWxmLnN0cmVhbS5zZWxlY3RlZC5zcGxpdCgnLCcpLmluZGV4T2YoIG9iai5kYXRhWyBpIF0uaWQgKSAhPSAtMSApIG9iai5kYXRhWyBpIF0uc2VsZWN0ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIG9iai5kYXRhWyBpIF0uc2VsZWN0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuc3RyZWFtLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgc2VsZi5zdHJlYW0uc2VsZWN0ZWQuc3BsaXQoJywnKS5pbmRleE9mKCAnX2RlZmF1bHRfJyApICE9IC0xICkgb2JqLmRhdGFbIDAgXS5zZWxlY3RlZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouZGVmYXVsdEdyb3VwSWQgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVmYXVsdEdyb3VwSWRbMF0gIT09IHVuZGVmaW5lZCAmJiAhIF8uaXNFbXB0eSggb2JqLmRlZmF1bHRHcm91cElkWzBdICkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRHcm91cElkWzBdOyBcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb2JqLmRhdGE6OjonKTsgICBcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG9iai5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfSk7ICBcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5zYW1lX21lZGlhX3dpdGhfcHJldl9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggbGVuZ3RoID09PSAwICkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICB2YXIgcHJldl9pdGVtID0gdGhpcy5pdGVtc1sgbGVuZ3RoIC0gMSBdLmRhdGE7XHJcblxyXG4gICAgICAgIGlmICggcHJldl9pdGVtID09PSB1bmRlZmluZWQgfHwgcHJldl9pdGVtLm1lZGlhID09PSB1bmRlZmluZWQgfHwgZGF0YS5tZWRpYSA9PT0gdW5kZWZpbmVkICkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHByZXZfaXRlbS5tZWRpYS50eXBlID09IGRhdGEubWVkaWEudHlwZSAmJiBwcmV2X2l0ZW0ubWVkaWEuaHJlZiAhPT0gdW5kZWZpbmVkICYmIGRhdGEubWVkaWEuaHJlZiAhPT0gdW5kZWZpbmVkICYmIHByZXZfaXRlbS5tZWRpYS5ocmVmID09IGRhdGEubWVkaWEuaHJlZiApIFxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1NBTUUgTUVESUEnKTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmRpciggcHJldl9pdGVtICk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJykgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdoaWRkZW5fZ3JvdXBzJyAmJiAhdGhpcy5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pdGVtc1sgMCBdICE9PSB1bmRlZmluZWQgKSBkYXRhID0gZGF0YS5jb25jYXQoIHRoaXMuaXRlbXNbIDAgXS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2luQm94JykgbmV3X2ZlZWRfaXRlbSA9IG5ldyBDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9lbHNlIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5zYW1lX21lZGlhX3dpdGhfcHJldl9pdGVtKCBkYXRhWyBpIF0pICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycgJiYgIXRoaXMub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfSBcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ2ZiX2xpa2VzJyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnc2VhcmNoX3JlcXVlc3QnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnb3V0cmVhY2gnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vLS0tIGZvciBsaXZlIHVwZGF0ZVxyXG4gICAgICAgICAgICB2YXIgbWluY29taW5nID0gW10sIGN1c2VySWQgPSB0aGlzLnByb2ZpbGUuZGF0YS5wYWdlSWQ7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkYXRhOjo6Ojo6Ojo6Ojo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnaW5Cb3gnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8qZm9yICggdmFyIGsgPSAwLCBsbCA9IG5ld19mZWVkX2l0ZW0uZGF0YS5jb21tZW50cy5jb21tZW50Lmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfY29tbWVudCA9IG5ld19mZWVkX2l0ZW0uZGF0YS5jb21tZW50cy5jb21tZW50WyBrIF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19jb21tZW50LmZyb21JZCAhPT0gY3VzZXJJZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmNvbWluZy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzX2NvbW1lbnQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCB0aGlzX2NvbW1lbnQuY3JlYXRlZFRpbWUuc3BsaXQoJysnKVsgMCBdICkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0aGlzX2NvbW1lbnQubWVzc2FnZUlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0qL1xyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9lbHNlIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuc2FtZV9tZWRpYV93aXRoX3ByZXZfaXRlbSggZGF0YVsgaSBdKSApIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtaW5jb21pbmcuc29ydCggZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPiBiLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoYS50aW1lIDwgYi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSk7ICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIGZpbmQgbGF0ZXN0IGluY29taW5nXHJcbiAgICAgICAgICAgIGlmICggbWluY29taW5nLmxlbmd0aCA+IDAgKSB0aGlzLmZpcnN0SXRlbUlEID0gbWluY29taW5nWyAwIF0udGltZTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5maXJzdEl0ZW1JRCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIEZhY2Vib29rRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICckdXJsUm91dGVyJywgJ0VDJywgJ2FwaVVybCcsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsICR1cmxSb3V0ZXIsIEVDLCBhcGlVcmwgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGZlZWQgPSAnJzsvL25ldyBFbGVtZW50KCcjZmVlZC10ZW1wbGF0ZScpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZmVlZC5lbGVtZW50O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMucHJvZmlsZSA9IHByb2ZpbGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uZXR3b3JrID0gKCBwcm9maWxlID09PSB1bmRlZmluZWQgPyBzdHJlYW0ubmV0d29yayA6IHByb2ZpbGUuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5hbWUgPSBzdHJlYW0ubmFtZSB8fCBzdHJlYW0uaWQ7XHJcblxyXG4gICAgICAgIHRoaXMuaWQgPSBzdHJlYW0uc3RyZWFtSWQ7XHJcblxyXG4gICAgICAgIHRoaXMuc2l6ZSA9IHN0cmVhbS5zaXplO1xyXG5cclxuICAgICAgICB0aGlzLmZhdm9yaXRlZCA9IHN0cmVhbS5mYXZvcml0ZWQgfHwgZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHN0cmVhbS52YWx1ZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5leHQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gPC0tIFsgRmVlZEl0ZW0gXVxyXG5cclxuICAgICAgICB0aGlzLmxhc3RfbG9hZGVkX3RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0X3Njcm9sbF9wb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbnVsbDtcclxuICAgICAgICBcclxuICAgICAgICAvKiBwcmVwYXJlIHBhZ2VfaWQgKi9cclxuICAgICAgICB0aGlzLnBhZ2VfaWQgPSAndGFicy4nICsgdGhpcy5nZXRfcGFnZV9pZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmdldF9wYWdlX2lkID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgaWQgPSBzZWxmLmlkLFxyXG4gICAgICAgICAgICBwcmVmaXggPSAnJztcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQgPSBzZWxmLmlkICsgJ18nICsgc2VsZi5wcm9maWxlLmlkICsgJ18nKyBzZWxmLm5ldHdvcms7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYoIHNlbGYuaWQgPT0gJ3NlYXJjaCcgfHwgc2VsZi5pZCA9PSAncnNzJyB8fCBzZWxmLmlkID09ICdvdXRyZWFjaCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQgPSBzZWxmLm5hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmVmaXggPSAnZmF2b3JpdGUnOyAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5zZWFyY2ggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJlZml4ID0gJ3NlYXJjaCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMucnNzIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICdyc3MnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiggdGhpcy5uZXR3b3JrID09ICdjaW5ib3gnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gJ2NpbmJveCc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiggc2VsZi5wcm9maWxlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwcmVmaXggPSBzZWxmLnByb2ZpbGUuaWQ7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gKHByZWZpeCArICctJyArIGlkKTtcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBwYWdlID0gJycsXHJcbiAgICAgICAgICAgICAgICBmZWVkX25hbWUgPSBzZWxmLm5hbWU7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKCBzZWxmLm5ldHdvcmsgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5wYWdlTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLnNwZWNpZmllZEhhbmRsZU9ySGFzaFRhZztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbnN0YWdyYW0nOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuZnVsbE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnbGlua2VkaW4nOiBwYWdlID0gdGhpcy5wcm9maWxlLmRhdGEucHJvZmlsZU5hbWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaW5rZWRpbic6IHBhZ2UgPSBzZWxmLnByb2ZpbGUudXNlcm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAneW91dHViZSc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS51c2VyRmlyc3ROYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PSAneXRfbXlDaGFubmVsSG9tZScgKSBmZWVkX25hbWUgPSAnSG9tZSAtIEFjdGl2aXRpZXMnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dvb2dsZXBsdXMnOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuZnVsbE5hbWUuc3BsaXQoXCIoXCIpWzBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5mdWxsTmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdibG9nZ2VyJzogcGFnZSA9IHRoaXMucHJvZmlsZS51c2VybmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9IHBhZ2UrICcgLSAnICtmZWVkX25hbWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMuc2VhcmNoIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnQ3VzdG9tIFNlYXJjaCBGZWVkJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMub3B0aW9ucy5yc3MgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICdSU1MgRmVlZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAodGhpcy5uYW1lKS5pbmRleE9mKCdGZWVkJykgPj0gMCA/IHRoaXMubmFtZToodGhpcy5uYW1lICsgJyBGZWVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZWxmLnBhZ2VfdGl0bGUgPSBmZWVkX3RpdGxlO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhzZWxmLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICB2YXIgZ2V0RXhpc3RpbmdTdGF0ZSA9ICRzdGF0ZS5nZXQoc2VsZi5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgaWYoZ2V0RXhpc3RpbmdTdGF0ZSA9PT0gbnVsbClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwYWdlX2lkOjo6JytzZWxmLnBhZ2VfaWQpO1xyXG5cclxuICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgIFwidXJsXCI6ICcvJyArIHNlbGYucGFnZV9pZCArICc6b2JqJyxcclxuICAgICAgICAgICAgICBjYWNoZTp0cnVlLFxyXG4gICAgICAgICAgICAgIFwidmlld3NcIjoge1xyXG4gICAgICAgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG4gICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcmFtLmh0bWxcIixcclxuICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogXCJGZWVkc1wiLFxyXG4gICAgICAgICAgICAgICAgICBwYXJhbXM6IHtvYmo6IHNlbGZ9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgJHN0YXRlUHJvdmlkZXJSZWYuc3RhdGUoc2VsZi5wYWdlX2lkLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgICAkdXJsUm91dGVyLnN5bmMoKTtcclxuICAgICAgICAgICAgJHVybFJvdXRlci5saXN0ZW4oKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdwYWdlX2lkOjo6MDAwMDAnKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApIC8vIDwtLSBvdmVycmlkZVxyXG4gICAge1xyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtID0gbmV3IEZlZWRJdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKSAvLyA8LS0gb3ZlcnJpZGVcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtID0gbmV3IEZlZWRJdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmFwcGVuZF9pdGVtcyA9IGZ1bmN0aW9uICggYWRkX2FmdGVyX2luZGV4IClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCggYWRkX2FmdGVyX2luZGV4ICksXHJcbiAgICAgICAgICAgIC8vJGNvbnRhaW5lciA9IHRoaXMuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLFxyXG4gICAgICAgICAgICBjb3VudCA9IDA7XHJcbiAgICAgICBcclxuXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLnNob3dfaXRlbXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBjb25zb2xlLmxvZygnRmluYWw6Ojo6Ojo6OjonKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhzZWxmLml0ZW1zKTtcclxuXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5jbGVhckZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoIHJlbW92ZV9tZXNzYWdlIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuaGlkZV9wdWxsdXAgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnRHJvcGRvd25GZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIERyb3Bkb3duRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBHb29nbGVQbHVzRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBbJ2dwX2FjdGl2aXRpZXMnLCdncF9wYWdlc19vbmx5JywnZ3BfcGFnZXMnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gR29vZ2xlUGx1c0ZlZWQ7XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgaWRfa2V5ID0gJ2lkJywgXHJcbiAgICAgICAgICAgIGN1cnJlbnRJRCA9IHNlbGYudXBkYXRlSW50ZXJ2YWxJRDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEdQU3RyZWFtJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZ29vZ2xlUGx1c1N0cmVhbScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKCBzZWxmLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dwX2FjdGl2aXRpZXMnOiAgIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfYWN0aXZpdGllcyc7IGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXNfb25seSc6ICAgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX29ubHlfc3RyZWFtJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjY291bnRJRCA9IHNlbGYuZGVmYXVsdF9lbGVtZW50X21ldHJpYy5hY2NvdW50SUQ7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEucHJvZmlsZUlEID0gc2VsZi5kZWZhdWx0X2VsZW1lbnRfbWV0cmljLnByb2ZpbGVJRDsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkX2tleSA9ICdwb3N0SUQnOyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzJzogICAgICAgIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9zdHJlYW0nOyAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEuYWNjb3VudElEID0gc2VsZi5kZWZhdWx0X2VsZW1lbnRfbWV0cmljLmFjY291bnRJRDsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5wcm9maWxlSUQgPSBzZWxmLmRlZmF1bHRfZWxlbWVudF9tZXRyaWMucHJvZmlsZUlEOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRfa2V5ID0gJ3Bvc3RJRCc7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrOyAgICAgIFxyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlOy8vSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY3VwZGF0ZUZlZWROb3RpZmljYXRpb24oJyArIHNlbGYuaWQgKyAnKSByZXNwb25zZTonLCAnY29sb3I6b3JhbmdlcmVkJyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGN1cnJlbnRJRCA9PT0gc2VsZi51cGRhdGVJbnRlcnZhbElEICkgLy8gZG9uJ3QgcmVmcmVzaCBkdXJpbmcgcmVxdWVzdFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3RJRCA9ICcjIyMnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmlyc3RJdGVtSUQgKSBmaXJzdElEID0gc2VsZi5maXJzdEl0ZW1JRDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZmlyc3RJRCA6OiAnICsgZmlyc3RJRCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAmJiBkYXRhLmRhdGEubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiBpdGVtWyBpZF9rZXkgXTt9KS5pbmRleE9mKCBmaXJzdElEICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gLTEgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggZmlyc3RJRCA9PT0gJyMjIycgKSBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2luZGV4IDo6ICcgKyBpbmRleCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpbmRleCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkaGVhZGVyID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWhlYWRlcicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmJvZHkgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgJHVwZGF0ZV9ub3RpZiA9ICRmYm9keS5maW5kKCcudXBkYXRlLW5vdGlmaWNhdGlvbicpOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAkdXBkYXRlX25vdGlmLmxlbmd0aCA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmID0gJCgnPGRpdiBjbGFzcz1cInVwZGF0ZS1ub3RpZmljYXRpb25cIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZi5vbignY2xpY2snLCBmdW5jdGlvbiAoIGUgKXsgJGhlYWRlci5maW5kKCcucmVmcmVzaC1mZWVkJykudHJpZ2dlcignY2xpY2snKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRmYm9keS5maW5kKCcuZmVlZC1pdGVtJykuZmlyc3QoKS5iZWZvcmUoICR1cGRhdGVfbm90aWYgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gZGF0YS5kYXRhLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IFBvc3QnICsgKCBpbmRleCA9PT0gMSA/ICcnIDogJ3MnICkgKTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgY29uc29sZS5lcnJvcignISEhIGN1cnJlbnRJRCAhISEnKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX2FjdGl2aXRpZXMnOiB0aGlzLmdldEdvb2dsZVBsdXNTdHJlYW0oXCJncF9hY3Rpdml0aWVzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXMnOiB0aGlzLmdldFBhZ2VzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAvKmNhc2UgJ2dwX3Blb3BsZUNvbm5lY3RlZCc6IHRoaXMuZ2V0R29vZ2xlUGx1c1N0cmVhbShcImdwX3Blb3BsZUNvbm5lY3RlZFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX3Blb3BsZVZpc2libGUnOiB0aGlzLmdldEdvb2dsZVBsdXNTdHJlYW0oXCJncF9wZW9wbGVWaXNpYmxlXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7Ki9cclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlc19vbmx5JzogdGhpcy5nZXRQYWdlcyggdHJ1ZSApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmdldFBhZ2VzID0gZnVuY3Rpb24gKCBvbmx5X3BhZ2UgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBkYXRhID0gW107XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEub2JqZWN0VHlwZSA9PT0gJ3BhZ2UnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHZhciByZXFfZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEdQU3RyZWFtJyxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dwX3BhZ2Vfb25seV9zdHJlYW0nXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgdXJsOiAnZmVlZC9nb29nbGVQbHVzU3RyZWFtJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHJlcV9kYXRhXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdncF9wYWdlcycgKSByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfc3RyZWFtJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlOy8vSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnKioqKioqKioqKioqKioqKiAgRysgJytzdHJlYW0pO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLm5leHQgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9maWxlLmFjY291bnQucHJvZmlsZXMuZm9yRWFjaCggZnVuY3Rpb24oIHByb2ZpbGUgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHByb2ZpbGUuZGF0YS5vYmplY3RUeXBlICYmIHByb2ZpbGUuZGF0YS5vYmplY3RUeXBlID09PSAncGFnZScgJiYgcHJvZmlsZS5tb25pdG9yZWQgPT09ICdvbicgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwcm9maWxlLmRhdGEucGFnZV9pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvZmlsZS51c2VybmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBwcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogcHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb25seV9wYWdlOiBvbmx5X3BhZ2VcclxuICAgICAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7IFxyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmICFfLmlzRW1wdHkoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkLmluZGV4T2YoJ3snKSA9PT0gLTEgKSB0aGlzLmRlZmF1bHRfZWxlbWVudCA9IHRoaXMucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdF9ncm91cHMgPSBKU09OLnBhcnNlKCB0aGlzLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRlZmF1bHRfZ3JvdXBzWyB0aGlzLmlkIF0gIT09IHVuZGVmaW5lZCApIHRoaXMuZGVmYXVsdF9lbGVtZW50ID0gZGVmYXVsdF9ncm91cHNbIHRoaXMuaWQgXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCBkYXRhICk7ICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmdldEdvb2dsZVBsdXNTdHJlYW0gPSBmdW5jdGlvbiAoIHN0cmVhbSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiBzdHJlYW1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZ29vZ2xlUGx1c1N0cmVhbScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnKioqKioqKioqKioqKioqKiAgRysgJytzdHJlYW0pO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLm5leHQgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5uZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucmV0dXJuQ29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlcj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+JylcclxuICAgICAgICAgICAgICAgICAgICAuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLm5leHQgID09PSB1bmRlZmluZWQgfHwgIXRoaXMubmV4dCApIHtcclxuICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0R1BTdHJlYW0nLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICBuZXh0OiB0aGlzLm5leHQgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2dvb2dsZVBsdXNTdHJlYW0nLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnZ3BfcGFnZXMnICkgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX3N0cmVhbSc7XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmlkID09PSAnZ3BfcGFnZXNfb25seScgKSByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfb25seV9zdHJlYW0nO1xyXG4gICAgICAgIFxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwOy8vSlNPTi5wYXJzZSggcmVzcCApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLm5leHQgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLm5leHQ7XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVfcHVsbHVwKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAoIHRoaXMuaWQgPT0gJ2dwX3BhZ2VzJyB8fCB0aGlzLmlkID09ICdncF9wYWdlc19vbmx5JyApICYmIHRoaXMucHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgIT09ICdwYWdlJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSwgdGhpc19kYXR1bTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09PSAnZ3BfYWN0aXZpdGllcycgKSB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbV9vbGQoIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0sIHRoaXNfZGF0dW07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09PSAnZ3BfYWN0aXZpdGllcycgKSB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbV9vbGQoIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSBkYXRhO1xyXG5cclxuICAgICAgICB0aGlzX2RhdHVtLmZyb21JZCA9IGRhdGEudXNlci5mcm9tSWQ7XHJcbiAgICAgICAgdGhpc19kYXR1bS5mcm9tTmFtZSA9IGRhdGEudXNlci5mcm9tTmFtZTtcclxuICAgICAgICB0aGlzX2RhdHVtLnByb2ZpbGVMaW5rID0gZGF0YS51c2VyLnByb2ZpbGVMaW5rO1xyXG4gICAgICAgIHRoaXNfZGF0dW0ucHJvZmlsZVBpYyA9IGRhdGEudXNlci5wcm9maWxlUGljO1xyXG5cclxuICAgICAgICB0aGlzX2RhdHVtLnVwZGF0ZVRpbWUgPSBuZXcgRGF0ZSggdGhpc19kYXR1bS51cGRhdGVUaW1lICkuZ2V0VGltZSgpIC8gMTAwMDtcclxuXHJcbiAgICAgICAgZGVsZXRlIHRoaXNfZGF0dW0udXNlcjtcclxuXHJcbiAgICAgICAgLy8gdGFrZSAxIGF0dGFjaG1lbnQgZm9yIG5vd1xyXG4gICAgICAgIGlmICggZGF0YS5hdHRhY2htZW50cyAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBkYXRhLmF0dGFjaG1lbnRzKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50KSApIHRoaXNfZGF0dW0ubWVkaWEgPSBkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnRbIDAgXTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bS5tZWRpYSA9IGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudDtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS5jb250ZW50IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAoL1xcd3s4fSgtXFx3ezR9KXszfS1cXHd7MTJ9L2kpLnRlc3QodGhpc19kYXR1bS5tZWRpYS5jb250ZW50KSApIHRoaXNfZGF0dW0ubWVkaWEuY29udGVudCA9ICcnOyAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAncGhvdG8nIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmZ1bGxJbWFnZSAhPT0gdW5kZWZpbmVkICkgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmZ1bGxJbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCApIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5pbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBkZWxldGUgdGhpc19kYXR1bS5tZWRpYTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAndmlkZW8nICYmIHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5pbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEudmlkZW8gPSB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV91cmw6IHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQudXJsIFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtLm1lZGlhLnZpZGVvID0geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlX3VybDogdGhpc19kYXR1bS5tZWRpYS51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLnVybCBcclxuICAgICAgICAgICAgICAgICAgICB9OyBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbV9vbGQgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICBmcm9tSWQ6IGRhdGEudXNlci5pZCxcclxuICAgICAgICAgICAgZnJvbU5hbWU6IGRhdGEudXNlci5mdWxsX25hbWUsXHJcbiAgICAgICAgICAgIHByb2ZpbGVQaWM6IGRhdGEudXNlci5wcm9maWxlX3BpY3R1cmUsXHJcbiAgICAgICAgICAgIHByb2ZpbGVMaW5rOiBkYXRhLnVzZXIucHJvZmlsZV9saW5rLFxyXG4gICAgICAgICAgICBzZWxmTGluazogZGF0YS5zZWxmTGluayxcclxuICAgICAgICAgICAgdXBkYXRlVGltZTogKCBuZXcgRGF0ZSggZGF0YS5jcmVhdGVkX3RpbWUgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEudGl0bGUsXHJcblxyXG4gICAgICAgICAgICAvL2FjdGl2aXR5VHlwZTogZGF0YS5hY3Rpdml0eVR5cGUgfHwgJycsXHJcbiAgICAgICAgICAgIHJlc2hhcmVyczogZGF0YS5yZXNoYXJlcnMsXHJcbiAgICAgICAgICAgIGxpa2VzOiBkYXRhLmxpa2VzLCAvL3BsdXNvbmVyc1xyXG4gICAgICAgICAgICBjb21tZW50czogZGF0YS5jb21tZW50cyxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9tZWRpYTogZGF0YS5hdHRhY2htZW50cyxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgcG9zdElEOiBkYXRhLmlkLCAvLz8/P1xyXG4gICAgICAgICAgICByYXdfZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggdGhpc19kYXR1bS5jb21tZW50cy5jb21tZW50ICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkoIHRoaXNfZGF0dW0uY29tbWVudHMuY29tbWVudCApKSBcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5jb21tZW50cy5jb21tZW50ID0gWyB0aGlzX2RhdHVtLmNvbW1lbnRzLmNvbW1lbnQgXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzX2RhdHVtLmxpa2VzLmxpa2UgIT09IHVuZGVmaW5lZCAmJiAhQXJyYXkuaXNBcnJheSggdGhpc19kYXR1bS5saWtlcy5saWtlICkpIFxyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLmxpa2VzLmxpa2UgPSBbIHRoaXNfZGF0dW0ubGlrZXMubGlrZSBdO1xyXG5cclxuICAgICAgICAvLyB0YWtlIDEgYXR0YWNobWVudCBmb3Igbm93XHJcbiAgICAgICAgaWYgKCBkYXRhLmF0dGFjaG1lbnRzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudCkgKSB0aGlzX2RhdHVtLm1lZGlhID0gZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50WyAwIF07XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0ubWVkaWEgPSBkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEudHlwZSA9PSAncGhvdG8nICYmIHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlICE9PSB1bmRlZmluZWQgKSB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuZnVsbEltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLnR5cGUgPT0gJ3ZpZGVvJyAmJiB0aGlzX2RhdHVtLm1lZGlhLmltYWdlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UudXJsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS5lbWJlZCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnZpZGVvID0geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlX3VybDogdGhpc19kYXR1bS5tZWRpYS5lbWJlZC51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkLnVybCBcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bS5tZWRpYS52aWRlbyA9IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IHRoaXNfZGF0dW0ubWVkaWEudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X3VybDogdGhpc19kYXR1bS5tZWRpYS51cmwgXHJcbiAgICAgICAgICAgICAgICAgICAgfTsgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtOyAgIFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gR29vZ2xlUGx1c0ZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdJbnN0YWdyYW1GZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIEluc3RhZ3JhbUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gSW5zdGFncmFtRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBJbnN0YWdyYW1GZWVkO1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgIHtcclxuICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICBpZiAoIHRoaXMudmFsdWUgPT0gJ3RydWUnICYmICF0aGlzLmluaXRpYWxpemVkIClcclxuICAgICAgIHtcclxuICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIC8vIEluIGNhc2Ugd2UgYXJlIGRlYWxpbmcgd2l0aCB1c2VyIGZlZWQgXHJcbiAgICAgICAgICAgICAgIGNhc2UgJ2lnX2ZlZWQnOiB0aGlzLmdldEluc3RhZ3JhbUZlZWQoXCJ1c2VyRmVlZFwiKTtcclxuICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAvLyBJbiBjYXNlIHdlIGFyZSBkZWFsaW5nIHdpdGggbXkgbWVkaWEgZmVlZFxyXG4gICAgICAgICAgICAgICAvLyBjYXNlICdpZ015TWVkaWEnOiB0aGlzLmdldEluc3RhZ3JhbUZlZWQoXCJpZ015TWVkaWFcIik7XHJcbiAgICAgICAgICAgICAgIGNhc2UgJ2lnTXlNZWRpYSc6IHRoaXMuZ2V0SW5zdGFncmFtRmVlZChcIm15TWVkaWFcIik7XHJcbiAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgfVxyXG4gICAgICAgfVxyXG4gICAgICAgZWxzZSBpZiAoIHRoaXMudmFsdWUgPT0gJ3RydWUnKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5nZXRJbnN0YWdyYW1GZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgIC8vYWN0aW9uOiAnZ2V0TmV3c0ZlZWQnLFxyXG4gICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgc3RyZWFtOiBzdHJlYW0sXHJcbiAgICAgICAgICAgbmV4dDogJycgLy8gSUQgb2YgbGFzdCBlbGVtZW50IHRoYXQgd2FzIGxvYWRlZFxyXG4gICAgICAgfTtcclxuXHJcbiAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgIGlmKHRoaXMubmV4dCA+IDApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEubmV4dCA9IHRoaXMubmV4dDtcclxuICAgICAgIH1cclxuXHJcbiAgICAgICB2YXIgbWV0aG9kID0gJyc7XHJcbiAgICAgICAvLyBpZiAoc3RyZWFtID09ICdpZ015TWVkaWEnKSBcclxuICAgICAgIGlmIChzdHJlYW0gPT0gJ215TWVkaWEnKSBcclxuICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluTXlNZWRpYVwiOyAvLyBBY3Rpb24gZm9yIG15TWVkaWFcclxuICAgICAgICAgICAgbWV0aG9kID0gJ215TWVkaWEnO1xyXG4gICAgICAgfVxyXG4gICAgICAgZWxzZVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIGRhdGEuYWN0aW9uID0gXCJnZXRJbkZlZWRcIjsgLy8gQWN0aW9uIGZvciB1c2VyIGZlZWQgLyBob21lIGZlZWRcclxuICAgICAgICAgICBtZXRob2QgPSAnZmVlZCc7XHJcbiAgICAgICB9XHJcblxyXG4gICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgdXJsOiAnZmVlZC9pbnN0YWdyYW0vJyttZXRob2QsXHJcbiAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgfTtcclxuXHJcbiAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICBpZiAoIG9iai5wYWdpbmF0aW9uICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5hdGlvbi5uZXh0X21heF9pZDtcclxuXHJcbiAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAvL2FjdGlvbjogJ2RvRmJSZXF1ZXN0JyxcclxuICAgICAgICAgICAgICAgIC8vd2FsbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIG5leHQ6IHRoaXMubmV4dFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAvL2RhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBtZXRob2QgPSAnJztcclxuICAgICAgICBpZiAodGhpcy5pZCA9PSAnaWdfZmVlZCcpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5zdHJlYW0gPSBcInVzZXJGZWVkXCI7XHJcbiAgICAgICAgICAgIGRhdGEuYWN0aW9uID0gXCJnZXRJbkZlZWRcIjsgLy8gQWN0aW9uIGZvciB1c2VyIGZlZWQgLyBob21lIGZlZWRcclxuICAgICAgICAgICAgbWV0aG9kID0gJ2ZlZWQnO1xyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS5zdHJlYW0gPSBcIm15TWVkaWFcIjtcclxuICAgICAgICAgICAgZGF0YS5hY3Rpb24gPSBcImdldEluTXlNZWRpYVwiOyAvLyBBY3Rpb24gZm9yIG15TWVkaWFcclxuICAgICAgICAgICAgbWV0aG9kID0gJ215TWVkaWEnO1xyXG4gICAgICAgIH0gICAgICAgIFxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImlkPVwiK3RoaXMuaWQrXCIgc3RyZWFtPVwiK2RhdGEuc3RyZWFtK1wiIG5leHQ9XCIrdGhpcy5uZXh0K1wiIGFjdGlvbj1cIitkYXRhLmFjdGlvbik7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9pbnN0YWdyYW0vJyttZXRob2QsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBcclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLnRvb2xiYXIoeyB0YXBUb2dnbGU6IGZhbHNlIH0pO1xyXG4gICAgICAgIC8vJC5tb2JpbGUuYWN0aXZlUGFnZS5jaGlsZHJlbihcIltkYXRhLXJvbGU9J2Zvb3RlciddXCIpLmZhZGVPdXQoMzAwKTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyQubW9iaWxlLmFjdGl2ZVBhZ2UuY2hpbGRyZW4oXCJbZGF0YS1yb2xlPSdmb290ZXInXVwiKS50b29sYmFyKHsgdGFwVG9nZ2xlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAvLyQubW9iaWxlLmFjdGl2ZVBhZ2UuY2hpbGRyZW4oXCJbZGF0YS1yb2xlPSdmb290ZXInXVwiKS5mYWRlSW4oMzAwKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLnBhZ2luYXRpb24gPyBkYXRhLnBhZ2luYXRpb24ubmV4dF9tYXhfaWQgOiAnJztcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcbiAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICd1c2VyRmVlZCcpIHtuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO30gICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RyZWFtID0gbXlNZWRpYVxyXG4gICAgICAgICAgICAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuICAgICAgICAgICAgKi9cclxuICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IEluc3RhZ3JhbUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICB9XHJcblxyXG4gICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgSW5zdGFncmFtRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBJbnN0YWdyYW1GZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgRmVlZEl0ZW0gPSAgRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gIFRpbWVsaW5lRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG5cclxuICAgIGZ1bmN0aW9uIEluc3RhZ3JhbUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgIFxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSW5zdGFncmFtRmVlZEl0ZW07XHJcbiAgIFxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzO1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXJDb21tZW50ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyQ29tbWVudDtcclxuICAgXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXM7XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlLmFkZF9jb21tZW50ID0gZnVuY3Rpb24gKCBtZXNzYWdlIClcclxuICAgIHtcclxuICAgICAgICB2YXIgaHRfZXhwID0gL1xcQiMoXFx3KlthLXpBLVpdK1xcdyopL2lnLFxyXG4gICAgICAgICAgICBsaW5rc19leHAgPSAvKFxcYihodHRwcz98ZnRwfGZpbGUpOlxcL1xcL1stQS1aMC05KyZAI1xcLyU/PX5ffCE6LC47XSpbLUEtWjAtOSsmQCNcXC8lPX5ffF0pL2lnO1xyXG5cclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEluc3RhZ3JhbUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgQ29sbGFwc2libGVGZWVkSXRlbSA9ICBDb2xsYXBzaWJsZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nKTtcclxuICAgIFxyXG4gICAgZnVuY3Rpb24gTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcblxyXG4gICAgcmV0dXJuIExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdMaW5rZWRpbkZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBMaW5rZWRpbkZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gTGlua2VkaW5GZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGlua2VkaW5GZWVkO1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggdGhpcy5pZCApXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHRoaXMudmFsdWUgKVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRhY3RzJzogdGhpcy5yZXRyaWV2ZUxpbmtlZGluRGF0YSgnZ2V0TE5Db250YWN0cycpOy8vY29uc29sZS5sb2coJ2NvbnRhY3RzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwibmV3c0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbl9jb21wYW5pZXMnOiB0aGlzLmdldExOQ29tcGFuaWVzKCk7Ly9jb25zb2xlLmxvZygnbG5fY29tcGFuaWVzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwid2FsbFBvc3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3JvdXBzJzogdGhpcy5nZXRMTkdyb3VwcygpOyAvL2NvbnNvbGUubG9nKCdncm91cHMnKTsvL3RoaXMuZ2V0TmV3c0ZlZWQoXCJwYWdlc0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdpbmJveCc6IHRoaXMuZ2V0TE5JbmJveCgpOy8vY29uc29sZS5sb2coJ2luYm94Jyk7Ly90aGlzLmdldExuSW5ib3goKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hvbWUnOiB0aGlzLmdldExOSG9tZSgpOyAvL2NvbnNvbGUubG9nKCdsbmNfaG9tZVdhbGwnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xuY19ob21lV2FsbCc6IHRoaXMucmV0cmlldmVMaW5rZWRpbkRhdGEoJ2dldExOQ21wSG9tZScpOy8vY29uc29sZS5sb2coJ2xuY19ob21lV2FsbCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7IFxyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xuY19wcm9kdWN0cyc6IGNvbnNvbGUubG9nKCdsbmNfcHJvZHVjdHMnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcygpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHsgXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8vIGlmKHRoaXMubmV4dD4wKVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5DbXBIb21lJyxcclxuICAgICAgICAgICAgICAgICAgICAvL3dhbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZmlsZV9pZDogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiB0aGlzLm5leHRcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY29udGFjdHMnOiBkYXRhLmFjdGlvbiA9ICdnZXRMTkNvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2NvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Db21wYW5pZXMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKVswXS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2NvbXBhbmllcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ3JvdXBzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Hcm91cHMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSAnZ3JvdXBzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW5ib3gnOiBkYXRhLmFjdGlvbiA9ICdnZXRMTkluYm94JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wcm9maWxlX2lkID0gdGhpcy5wcm9maWxlLmRhdGEucHJvZmlsZV9JZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLnN0YXJ0ID09PSBGQUxTRSApIGRhdGEuc3RhcnQgPSAwOyAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdpbmJveCc7IFxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdob21lJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Ib21lJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2hvbWUnO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIHVybDogXCJmZWVkL2xpbmtlZEluL1wiK21ldGhvZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRMbkluYm94IG1vcmUgcmVzcG9uc2UnKTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCArPSAyNTsvL2RhdGEudXBkYXRlS2V5O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnRyaWdnZXIoJ2NsaWNrJylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gfSBcclxuICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyB9ICBcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5yZXRyaWV2ZUxpbmtlZGluRGF0YSA9IGZ1bmN0aW9uICggYWN0aW9uICkgLy8gZ2V0TE5DbXBIb21lID0+IGNvbXBhbnkgdXBkYXRlc1xyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVfSWQ6IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVfSWQsXHJcbiAgICAgICAgICAgIHN0YXJ0OiBzZWxmLm5leHRcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBcclxuICAgICAgICB2YXIgbWV0aG9kID0gJyc7XHJcbiAgICAgICAgc3dpdGNoKCBhY3Rpb24gKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnZ2V0TE5Db250YWN0cyc6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnbGlua2VkSW4vY29udGFjdHMnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldExOQ21wSG9tZSc6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnbGlua2VkSW4vY29tcGFueUhvbWUnO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBtZXRob2QgPSAnJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvJyttZXRob2QsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKGFjdGlvbiArJyByZXNwb25zZScpXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLyppZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkqLyBcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDsvL29iai5kYXRhLnVwZGF0ZUtleTsvL29iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKVxyXG5cclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5Db21wYW5pZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkNvbXBhbmllcycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9jb21wYW5pZXMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSA9PT0gdW5kZWZpbmVkIHx8IG9iai5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouZGVmYXVsdENvbXBhbnlJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0Q29tcGFueUlkWzBdICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIG9iai5kZWZhdWx0Q29tcGFueUlkWzBdICkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRDb21wYW55SWRbIDAgXTsgXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKVxyXG5cclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgLy8gfSAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOR3JvdXBzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IDA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldExOR3JvdXBzJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0YXJ0OiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2xpbmtlZEluL2dyb3VwcycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmIG9iai5kZWZhdWx0R3JvdXBJZFswXSAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBvYmouZGVmYXVsdEdyb3VwSWRbMF0gKSApXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBvYmouZGVmYXVsdEdyb3VwSWRbMF07IFxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgICAgXHJcbiAgICAgICAgICAgIC8vIGVsc2VcclxuICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKClcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIC8vIH0gICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7IFxyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5Ib21lID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJtYXRhbiBoZXJlIC0gXCIrdGhpcy5pZCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5kaXIoc2VsZik7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldExOSG9tZScsXHJcbiAgICAgICAgICAgIC8vc3RyZWFtOiAnaW5Cb3gnLFxyXG4gICAgICAgICAgICAvL3Byb2ZpbGVfaWQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9ob21lJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRMTkhvbWUgcmVzcG9uc2UnKVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqIClcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuICAgICAgICAgICAgLy8gaWYgKCBvYmouZGF0YS5sZW5ndGggPT0gMjUgKVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIHNlbGYubmV4dCA9IDI1O1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gb2JqLmRhdGEubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuZ2V0TE5JbmJveCA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5JbmJveCcsXHJcbiAgICAgICAgICAgIC8vc3RyZWFtOiAnaW5Cb3gnLFxyXG4gICAgICAgICAgICBwcm9maWxlX2lkOiB0aGlzLnByb2ZpbGUuZGF0YS5wcm9maWxlX0lkLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RhcnQ6IDBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vaW5ib3gnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2dldExuSW5ib3ggcmVzcG9uc2UnKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSA9PT0gdW5kZWZpbmVkIHx8IG9iai5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdncm91cHMnIHx8IHRoaXMuaWQgPT0gJ2xuX2NvbXBhbmllcycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLml0ZW1zWyAwIF0gIT09IHVuZGVmaW5lZCApIGRhdGEgPSBkYXRhLmNvbmNhdCggdGhpcy5pdGVtc1sgMCBdLmRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2lmICggdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApIG5ld19mZWVkX2l0ZW0gPSBuZXcgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvKmVsc2UqLyBuZXdfZmVlZF9pdGVtID0gbmV3IExpbmtlZGluRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2dyb3VwcycgfHwgdGhpcy5pZCA9PSAnbG5fY29tcGFuaWVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgLy9pZiAoIHRoaXMuaWQgPT0gJ2xuX2NvbXBhbmllcycgKSBuZXdfZmVlZF9pdGVtID0gbmV3IExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyplbHNlKi8gbmV3X2ZlZWRfaXRlbSA9IG5ldyBMaW5rZWRpbkZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIExpbmtlZGluRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIEZlZWRJdGVtID0gIEZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBMaW5rZWRpbkZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMaW5rZWRpbkZlZWRJdGVtO1xyXG4gICAgXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cztcclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5yZW5kZXJDb21tZW50ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyQ29tbWVudDtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcztcclxuXHJcbiAgICBMaW5rZWRpbkZlZWRJdGVtLnByb3RvdHlwZS5hZGRfY29tbWVudCA9IGZ1bmN0aW9uICggbWVzc2FnZSwgZGlyZWN0LCBzaGFyZSApXHJcbiAgICB7XHJcblxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIExpbmtlZGluRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgVGltZWxpbmVGZWVkSXRlbSwgRHJvcGRvd25GZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFBpbnRlcmVzdEZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBpbnRlcmVzdEZlZWQ7XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAncGlfbXlBY3Rpdml0eSc6IHRoaXMuZ2V0TXlBY3Rpdml0eSgpO1xyXG4gICAgICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfYm9hcmQnOiB0aGlzLmdldEJvYXJkcygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfcGlucyc6IHRoaXMuZ2V0UGludGVyZXN0RmVlZCggdGhpcy5pZCApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfbGlrZXMnOiB0aGlzLmdldFBpbnRlcmVzdEZlZWQoIHRoaXMuaWQgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmdldEJvYXJkcyA9IGZ1bmN0aW9uICggKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcywgZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2lmICggd2luZG93Lmdsb2JhbHMucGlCb2FyZHMgJiYgd2luZG93Lmdsb2JhbHMucGlCb2FyZHMuaWQgPT09IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkICkgZGF0YSA9IHdpbmRvdy5nbG9iYWxzLnBpQm9hcmRzLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9lbHNlIFxyXG4gICAgICAgICAgICAgICAgc2VsZi5wcm9maWxlLmFjY291bnQucHJvZmlsZXMuZm9yRWFjaCggZnVuY3Rpb24oIHByb2ZpbGUgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIXByb2ZpbGUuZGF0YS5vYmplY3RUeXBlIHx8IHByb2ZpbGUuZGF0YS5vYmplY3RUeXBlICE9PSAndXNlcicgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBwcm9maWxlLmRhdGEudXNlcklkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogcHJvZmlsZS51c2VybmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3dpbmRvdy5nbG9iYWxzLnBpQm9hcmRzID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCApIClcclxuICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQ7XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGRhdGEgKTtcclxuICAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLnJlcXVlc3QgPSBmdW5jdGlvbiAoIHN0cmVhbSwgcGFyYW1ldGVycywgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYoIHNlbGYubmV4dCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAga2V5OiAnY3Vyc29yJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBzZWxmLm5leHQgICAgIFxyXG4gICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdsaW1pdCcsXHJcbiAgICAgICAgICAgIHZhbHVlOiAnMjAnICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFBpbnRlcmVzdEZlZWQnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiBzdHJlYW0sXHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnNcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvcGludGVyZXN0JyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggb2JqICk7IFxyXG4gICAgICAgIH0pOyAgICAgICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuZ2V0UGludGVyZXN0RmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMgPSBbXTtcclxuXHJcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAga2V5OiAnZmllbGRzJyxcclxuICAgICAgICAgICAgdmFsdWU6ICdpZCxsaW5rLHVybCxjcmVhdG9yLGJvYXJkLGNyZWF0ZWRfYXQsbm90ZSxjb3VudHMsbWVkaWEsYXR0cmlidXRpb24saW1hZ2UsbWV0YWRhdGEnICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VsZi5yZXF1ZXN0KCBzdHJlYW0sIHBhcmFtZXRlcnMsIGZ1bmN0aW9uICggb2JqIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT09ICdGQUlMJyB8fCAoIG9iai5kYXRhLnN0YXR1cyAmJiBvYmouZGF0YS5zdGF0dXMgPT09ICdmYWlsdXJlJyApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcGFnZSA9IG9iai5kYXRhLnBhZ2U7XHJcbiAgICAgICAgICAgIGlmICggcGFnZSAmJiBwYWdlLmN1cnNvciApIHNlbGYubmV4dCA9IHBhZ2UuY3Vyc29yO1xyXG4gICAgICAgICAgICBvYmouZGF0YSA9IG9iai5kYXRhLmRhdGE7IFxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7ICBcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5uZXh0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgcGFyYW1ldGVycyA9IFtdO1xyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdmaWVsZHMnLFxyXG4gICAgICAgICAgICB2YWx1ZTogJ2lkLGxpbmssdXJsLGNyZWF0b3IsYm9hcmQsY3JlYXRlZF9hdCxub3RlLGNvdW50cyxtZWRpYSxhdHRyaWJ1dGlvbixpbWFnZSxtZXRhZGF0YScgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzZWxmLnJlcXVlc3QoIHNlbGYuaWQsIHBhcmFtZXRlcnMsIGZ1bmN0aW9uICggb2JqIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT09ICdGQUlMJyB8fCAoIG9iai5kYXRhLnN0YXR1cyAmJiBvYmouZGF0YS5zdGF0dXMgPT09ICdmYWlsdXJlJyApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSAnJztcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFnZSA9IG9iai5kYXRhLnBhZ2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHBhZ2UgJiYgcGFnZS5jdXJzb3IgKSBzZWxmLm5leHQgPSBwYWdlLmN1cnNvcjtcclxuICAgICAgICAgICAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIG9iai5kYXRhID0gb2JqLmRhdGEuZGF0YTsgXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApICk7XHJcbiAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdwaV9ib2FyZCcgKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubm90ZSwvLyBkYXRhLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIHJhd19kYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmNvdW50cyAmJiBkYXRhLmNvdW50cy5yZXBpbnMgKSB0aGlzX2RhdHVtLnJlcGlucyA9ICcnICsgZGF0YS5jb3VudHMucmVwaW5zO1xyXG5cclxuICAgICAgICBlbHNlIHRoaXNfZGF0dW0ucmVwaW5zID0gJyc7XHJcblxyXG4gICAgICAgIHRoaXNfZGF0dW0ubGluayA9IGRhdGEubGluaztcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmNvdW50cyAmJiBkYXRhLmNvdW50cy5saWtlcyApIHRoaXNfZGF0dW0ubGlrZXMgPSB7IGNvdW50OiBkYXRhLmNvdW50cy5saWtlcyB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuY291bnRzICYmIGRhdGEuY291bnRzLmNvbW1lbnRzICkgdGhpc19kYXR1bS5jb21tZW50cyA9IHsgY291bnQ6IGRhdGEuY291bnRzLmNvbW1lbnRzIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS51cmwgKSB0aGlzX2RhdHVtLnBlcm1hbGluayA9IGRhdGEudXJsO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuaW1hZ2UgJiYgZGF0YS5pbWFnZS5vcmlnaW5hbCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgIHNyYzogZGF0YS5pbWFnZS5vcmlnaW5hbC51cmxcclxuICAgICAgICAgICAgfTsgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5tZXRhZGF0YSAmJiBkYXRhLm1ldGFkYXRhLmxpbmsgJiYgZGF0YS5tZXRhZGF0YS5saW5rLmZhdmljb24gJiYgZGF0YS5tZXRhZGF0YS5saW5rLnNpdGVfbmFtZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gPSAnPGRpdiBjbGFzcz1cInBpLWZyb21cIj48aW1nIHNyYz1cIicgKyBkYXRhLm1ldGFkYXRhLmxpbmsuZmF2aWNvbjsgXHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiArPSAnXCIgLz48L2Rpdj5mcm9tICcgKyBkYXRhLm1ldGFkYXRhLmxpbmsuc2l0ZV9uYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgKCB0aGlzLmlkID09ICdwaV9ib2FyZCcgJiYgdGhpc19kYXR1bS5tZXNzYWdlICkgdGhpc19kYXR1bS5tZXNzYWdlID0gdGhpc19kYXR1bS5tZXNzYWdlLnJlcGxhY2UoJyAgICAgICBNb3JlICAgICAgICcsJycpLnRyaW0oKTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCBkYXRhLmJvYXJkICE9IHVuZGVmaW5lZCAmJiBkYXRhLmJvYXJkLmxlbmd0aCA+IDAgKSBcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIGlmICggdGhpcy5pZCA9PSAncGlfbXlBY3Rpdml0eScpIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiA9ICdQaW5uZWQgb250bzogJyArIGRhdGEuYm9hcmQ7XHJcblxyXG4gICAgICAgIC8vICAgICBlbHNlICB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gPSAnUGlubmVkIGZyb206IDxhIGhyZWY9XCJodHRwOi8vcGludGVyZXN0LmNvbS9zb3VyY2UvJyArIGRhdGEuYm9hcmQgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArIGRhdGEuYm9hcmQgKyAnPC9hPic7XHJcbiAgICAgICAgLy8gfSBcclxuXHJcbiAgICAgICAgLy8gZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ3BpX2JvYXJkJyAmJiBkYXRhLnVzZXJfbmFtZSAhPSB1bmRlZmluZWQgJiYgZGF0YS51c2VyX25hbWUgPT0gJ1Bpbm5lZCBieSBwaW5uZXInICkgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uID0gZGF0YS51c2VyX25hbWU7ICAgICAgXHJcblxyXG4gICAgICAgIC8vIGlmICggZGF0YS5pbWcgIT0gdW5kZWZpbmVkICYmIGRhdGEuaW1nWyAwIF0gIT0gdW5kZWZpbmVkIClcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgLy8gICAgIHRoaXNfZGF0dW0ubWVkaWEgPSB7XHJcbiAgICAgICAgLy8gICAgICAgICB0eXBlOiAncGhvdG8nLFxyXG4gICAgICAgIC8vICAgICAgICAgc3JjOiBkYXRhLmltZ1sgMCBdXHJcbiAgICAgICAgLy8gICAgIH07ICAgXHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTsgXHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmNoYW5nZVBpbkJvYXJkID0gZnVuY3Rpb24oIHByb2ZpbGUsIGFjdGlvbiwgY29tbWFuZCwgcGFyYW1ldGVycywgb2JqZWN0X2lkLCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxyXG4gICAgICAgICAgICBjb21tYW5kOiBjb21tYW5kLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBwcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBvYmplY3RfaWQ6IG9iamVjdF9pZCB8fCAnJyxcclxuICAgICAgICAgICAgcGFyYW1ldGVyczogcGFyYW1ldGVycyB8fCBbXVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlrZScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApOyBcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIFBpbnRlcmVzdEZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBUaW1lbGluZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLmxpa2VzID09PSB1bmRlZmluZWQgKSB0aGlzLmRhdGEubGlrZXMgPSB7Y291bnQ6IDB9O1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YSAhPT0gdW5kZWZpbmVkICkgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbiA9IHRoaXMuZGF0YS5yYXdfZGF0YS5jb252ZXJzYXRpb247XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLmNvbnZlcnNhdGlvbiAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KCB0aGlzLmRhdGEuY29udmVyc2F0aW9uLnR3ZWV0cyApICkgdGhpcy5kYXRhLmNvbnZlcnNhdGlvbi50d2VldHMgPSBbIHRoaXMuZGF0YS5jb252ZXJzYXRpb24udHdlZXRzIF07XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPT09IHVuZGVmaW5lZCApIHRoaXMuZGF0YS5tZWRpYV9jb250ZW50ID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUaW1lbGluZUZlZWRJdGVtO1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldEl0ZW1OYW1lID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgcmV0dXJuIHNlbGYuZGF0YS5mcm9tTmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0SXRlbVRpbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXAgPSBwYXJzZUludCggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSxcclxuICAgICAgICAgICAgdGltZSA9ICcnO1xyXG5cclxuICAgICAgICB2YXIgbmV3X2RhdGUgPSBuZXcgRGF0ZSggdGltZXN0YW1wICogMTAwMCApLFxyXG4gICAgICAgICAgICBkYXRlID0gbmV3X2RhdGU7Ly8uZm9ybWF0KCdtbW0gZGQsIHl5eXksIGg6TU10dCcpO1xyXG5cclxuICAgICAgICBpZiAoICFpc05hTiggdGhpcy5kYXRhLnVwZGF0ZVRpbWUgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ1RXRm9sbG93ZXJzJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gJ0AnICt0aGlzLmRhdGEudXNlcm5hbWU7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRpbWUgPSBkYXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayAhPT0gJ2ZhY2Vib29rJyB8fCAoIHRoaXMuZmVlZC5pZCAhPSAnc2VhcmNoJyAmJiB0aGlzLmZlZWQuaWQgIT09ICdvdXRyZWFjaCcgKSB8fCAoIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT09IHVuZGVmaW5lZCApICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpbWUgPSAnQCcgK3RoaXMuZGF0YS51c2VybmFtZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwYWdlJyB8fCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT0gJ3BsYWNlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gdGhpcy5kYXRhLmNhdGVnb3J5O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGltZTtcclxuICAgIH07IFxyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldEl0ZW1UZXh0ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIG1lc3NhZ2VfaHRtbCxcclxuICAgICAgICAgICAgJHRlbXBfbWVzc2FnZTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAncnNzJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSAnPGEgaHJlZj1cIicgK3RoaXMuZGF0YS5saW5rKyAnXCIgY2xhc3M9XCJ0aXRsZVwiIHRhcmdldD1cIl9ibGFua1wiPicgKyggdGhpcy5kYXRhLnRpdGxlIHx8ICcnKSsgJzwvYT4nO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGRhdGFfbWVzc2FnZV9odG1sID0gdGhpcy5kYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBkYXRhX21lc3NhZ2VfaHRtbCA9PT0gJ3N0cmluZycgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkdGVtcF9tZXNzYWdlID0gJCgnPGRpdj4nKS5odG1sKCBkYXRhX21lc3NhZ2VfaHRtbCApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkdGVtcF9tZXNzYWdlLmZpbmQoJ2EnKS5hdHRyKCd0YXJnZXQnLCdfYmxhbmsnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgJGltYWdlcyA9ICR0ZW1wX21lc3NhZ2UuZmluZCgnaW1nJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoICRpbWFnZXMubGVuZ3RoICkgJGltYWdlcy5lYWNoKGZ1bmN0aW9uKClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJHdyYXBwZXIgPSAkKCc8ZGl2PicsIHsgY2xhc3M6ICdyc3MtaW1nLWNlbnRlcicgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHdyYXBwZXIuYXBwZW5kKCAkKCB0aGlzICkuY2xvbmUoKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICQoIHRoaXMgKS5yZXBsYWNlV2l0aCggJHdyYXBwZXIgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGRhdGFfbWVzc2FnZV9odG1sID0gJHRlbXBfbWVzc2FnZS5odG1sKCk7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgKz0gZGF0YV9tZXNzYWdlX2h0bWw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAvLyArKCB0aGlzLmRhdGEubWVzc2FnZSB8fCAnJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSB0aGlzLmRhdGEubWVzc2FnZTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIG1lc3NhZ2VfaHRtbCA9PT0gJ3N0cmluZycgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkdGVtcF9tZXNzYWdlID0gJCgnPGRpdj4nKS5odG1sKCBtZXNzYWdlX2h0bWwgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgJHRlbXBfbWVzc2FnZS5maW5kKCdhJykuYXR0cigndGFyZ2V0JywnX2JsYW5rJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gJHRlbXBfbWVzc2FnZS5odG1sKCk7ICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICh0aGlzLmZlZWQuaWQgPT0gJ2ZiX25vdGlmaWNhdGlvbnMnIHx8IHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ0ZCQ29tbWVudHMnIHx8IHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ0ZCU2hhcmVzJyB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQk90aGVycycgfHwgdGhpcy5kYXRhLmV2ZW50VHlwZSA9PSAnRkJMaWtlcycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy91c2VyX2xpa2VzID09IHVucmVhZFxyXG4gICAgICAgICAgICAvL21lc3NhZ2VfaHRtbCA9ICc8YSBocmVmPVwiJyArdGhpcy5kYXRhLmxpbmsrICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICsoIHRoaXMuZGF0YS5tZXNzYWdlIHx8ICcnKSsgJzwvYT4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5tZXNzYWdlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuZXZlbnRUeXBlID09PSAnRkJDb21tZW50cycgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9zdF9tZXNzYWdlID0gKCB0eXBlb2YgdGhpcy5kYXRhLm5hbWUgPT09ICdzdHJpbmcnICYmIHRoaXMuZGF0YS5uYW1lLmxlbmd0aCA/IHRoaXMuZGF0YS5uYW1lIDogJycgKSxcclxuICAgICAgICAgICAgICAgICAgICBsYXN0X2NvbW1lbnQgPSB7IG1lc3NhZ2U6JycgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL2lmICggcG9zdF9tZXNzYWdlLmxlbmd0aCA+IDE1MCApIHBvc3RfbWVzc2FnZSA9IHBvc3RfbWVzc2FnZS5zbGljZSgwLDE1MCkgKyAnLi4uJztcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNvbW1lbnRzICYmIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50IClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50Lmxlbmd0aCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudC5zb3J0KGZ1bmN0aW9uKGEsYilcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEuY3JlYXRlZFRpbWUgLSBiLmNyZWF0ZWRUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFzdF9jb21tZW50ID0gdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnRbdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgbGFzdF9jb21tZW50ID0gdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gJzxzcGFuIGNsYXNzPVwiY29tbWVudC1zdWJ0aXRsZVwiPicgKyBFQy5yZXBsYWNlX3R5cGVfaW5fdXNlcm5hbWUodGhpcy5wcm9maWxlLnVzZXJuYW1lKSArICdcXCdzIFBvc3Q6PC9zcGFuPiAnICsgXHJcbiAgICAgICAgICAgICAgICAgICAgcG9zdF9tZXNzYWdlICsgJzxicj48YnI+PHNwYW4gY2xhc3M9XCJjb21tZW50LXN1YnRpdGxlXCI+JyArIHRoaXMuZGF0YS5mcm9tTmFtZSArICdcXCdzIENvbW1lbnQ6PC9zcGFuPiAnICsgbGFzdF9jb21tZW50Lm1lc3NhZ2U7IFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7fSAvLyBvbGQgc3R5bGVcclxuICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2Jsb2dnZXInKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRpdGxlID0gJyc7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5uYW1lICE9PSB1bmRlZmluZWQgKSB0aXRsZSA9ICc8YSBocmVmPVwiJyArdGhpcy5kYXRhLnBlcm1hbGluaysgJ1wiIGNsYXNzPVwidGl0bGVcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICsoIHRoaXMuZGF0YS5uYW1lIHx8ICcnKSsgJzwvYT4nO1xyXG5cclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gdGl0bGUgKyAoIHRoaXMuZGF0YS5tZXNzYWdlIHx8ICcnKTsgXHJcbiAgICAgICAgICAgIC8vbWVzc2FnZV9odG1sID0gdGl0bGUgKyAoIHVybF90b19saW5rKCB0aGlzLmRhdGEubWVzc2FnZSApIHx8ICcnKTsgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAndHdpdHRlcicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEucmV0d2VldGVkX3N0YXR1cyA9PT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5yYXdfZGF0YS5xdW90ZWRfdHdlZXQgIT09IHVuZGVmaW5lZCBcclxuICAgICAgICAgICAgICAgICYmIHRoaXMuZGF0YS5yYXdfZGF0YS5xdW90ZWRfdHdlZXQuc3RyZWFtRW50cnkgIT09IHVuZGVmaW5lZCAmJiAhJC5pc0VtcHR5T2JqZWN0KCB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0LnN0cmVhbUVudHJ5ICkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy51cmxzICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLnVybHMgKSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybHMgPSB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJsc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAsZmlyc3RfdXJsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkodXJscykgKSBmaXJzdF91cmwgPSB1cmxzWyAwIF0udXJsO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZmlyc3RfdXJsID0gdXJscy51cmw7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5tZXNzYWdlLnJlcGxhY2UoZmlyc3RfdXJsLCAnJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gbWVzc2FnZV9odG1sID0gdGhpcy5kYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy50d19kZWVwX2xpbmtfdG9faHRtbCggdGhpcy5kYXRhLm1lc3NhZ2UsIHRoaXMuZGF0YS5yYXdfZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lc3NhZ2UgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0UG9zaXRpb24oc3RyLCBtLCBpKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHIuc3BsaXQobSwgaSkuam9pbihtKS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyB2YXIgcmVzdWx0ID0gZ2V0UG9zaXRpb24odGhpcy5kYXRhLm1lc3NhZ2UsICdodHRwJywgMikgO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBnZXRQb3NpdGlvbihtZXNzYWdlX2h0bWwsICdodHRwJywgMikgO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBtZXNzYWdlX2h0bWwuc3Vic3RyaW5nKDAsIHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMgJiYgdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLnVybHMgIT09IHVuZGVmaW5lZCAmJiAhJC5pc0VtcHR5T2JqZWN0KCB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscyApIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXJscyA9IHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy51cmxzO1xyXG4gICAgICAgICAgICAgICAgICAgIEVDLmZvcl9lYWNoKHVybHMsIGZ1bmN0aW9uICggdXJsICkgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHVybC51cmwgJiYgdXJsLmV4cGFuZGVkX3VybCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IG1lc3NhZ2VfaHRtbC5yZXBsYWNlKHVybC51cmwsIHVybC5leHBhbmRlZF91cmwpOyAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7ICBcclxuICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhLmRlc2NyaXB0aW9uICYmICggc2VsZi5mZWVkLmlkID09ICd0d0ZyaWVuZHMnIHx8IHNlbGYuZmVlZC5pZCA9PSAndHdGb2xsb3dlcnMnIHx8IHNlbGYuZGF0YS5ldmVudFR5cGUgPT0gJ1RXRm9sbG93ZXJzJ1xyXG4gICAgICAgICAgICAgICAgICAgIHx8ICggKCBzZWxmLmZlZWQuaWQgPT0gJ3NlYXJjaCcgfHwgc2VsZi5mZWVkLmlkID09ICdvdXRyZWFjaCcgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgc2VsZi5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICd1c2VycycgKSApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gdGhpcy5kYXRhLnJhd19kYXRhLmRlc2NyaXB0aW9uO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5ldmVudFR5cGUgPT0gJ1RXRm9sbG93ZXJzJyApIG1lc3NhZ2VfaHRtbCArPSAnIDxzcGFuIGNsYXNzPVwidmlldy1mb2xsb3dlclwiPlZpZXcgJyArIHNlbGYuZGF0YS5mcm9tTmFtZSArICcgcHJvZmlsZTwvc3Bhbj4nOyAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IEVDLnVybF90b19saW5rKCBtZXNzYWdlX2h0bWwgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgbWVzc2FnZV9odG1sID0gRUMudXJsX3RvX2xpbmsoIHRoaXMuZGF0YS5tZXNzYWdlICk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3JzcycgJiYgdHlwZW9mIG1lc3NhZ2VfaHRtbCA9PSAnc3RyaW5nJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IG1lc3NhZ2VfaHRtbFxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL3dpZHRoPS9naSwgJ2RhdGEtdz0nKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL2hlaWdodD0vZ2ksICdkYXRhLWg9JylcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9tYXJnaW4vZ2ksICdkYXRhLW0nKVxyXG4gICAgICAgICAgICAgICAgLy8gLnJlcGxhY2UoL21hcmdpbi1sZWZ0PS9naSwgJ2RhdGEtbS1sPScpXHJcbiAgICAgICAgICAgICAgICAvLyAucmVwbGFjZSgvbWFyZ2luLXJpZ2h0PS9naSwgJ2RhdGEtbS1yPScpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvYSBocmVmL2dpLCAnYSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmJylcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC88YnJcXHMqW1xcL10/Pi9naSwgJzxzcGFuPjwvc3Bhbj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJyB8fCB0aGlzLmRhdGEuZXZlbnROZXR3b3JrID09ICd0d2l0dGVyJyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gRUMudHdfdXNlcl9tZW50aW9uc190b19saW5rcyggbWVzc2FnZV9odG1sLCB0aGlzLmRhdGEucmF3X2RhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IEVDLmhhc2h0YWdfdG9fbGluayggbWVzc2FnZV9odG1sLCAndHdpdHRlcicgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnbGlua2VkaW4nICkgbWVzc2FnZV9odG1sID0gdGhpcy5kYXRhLnRpdGxlICsgdGhpcy5kYXRhLnByZV9zdW1tYXJ5ICsgbWVzc2FnZV9odG1sO1xyXG5cclxuICAgICAgICBlbHNlIGlmICh0aGlzLmZlZWQubmV0d29yayA9PSAnZmFjZWJvb2snICYmIHRoaXMuZmVlZC5pZCAhPT0gJ2ZiX25vdGlmaWNhdGlvbnMnKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBzdG9yeV9odG1sO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gJChcIjxkaXYgLz5cIikuaHRtbCggdGhpcy5kYXRhLm1lc3NhZ2UgKS50ZXh0KCk7IFxyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuc3RvcnkgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEuc3RvcnkubGVuZ3RoID4gMCApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiAoIHRoaXMuZGF0YS5zdG9yeS5pbmRleE9mKCdZb3UgYWRkZWQgJykgPT0gLTEgKVxyXG4gICAgICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0b3J5X2h0bWwgPSAkKFwiPGRpdiAvPlwiKS5odG1sKCB0aGlzLmRhdGEuc3RvcnkgKS50ZXh0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnN0b3J5VGFncyAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5zdG9yeVRhZ3Muc3RvcnlUYWcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3J5X2h0bWwgPSBFQy5mYl90YWdzX3RvX2xpbmtzKCBzdG9yeV9odG1sLCB0aGlzLmRhdGEuc3RvcnlUYWdzLnN0b3J5VGFnLCAnc3RvcnknICk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yeV9odG1sID0gRUMudXJsX3RvX2xpbmsoIHN0b3J5X2h0bWwgKTtcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVzc2FnZVRhZ3MgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVzc2FnZVRhZ3MubWVzc2FnZVRhZyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IEVDLmZiX3RhZ3NfdG9fbGlua3MoIG1lc3NhZ2VfaHRtbCwgdGhpcy5kYXRhLm1lc3NhZ2VUYWdzLm1lc3NhZ2VUYWcsICdtZXNzYWdlJyApO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy51cmxfdG9fbGluayggbWVzc2FnZV9odG1sICk7XHJcblxyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy5oYXNodGFnX3RvX2xpbmsoIG1lc3NhZ2VfaHRtbCwgJ2ZhY2Vib29rJyk7XHJcblxyXG4gICAgICAgICAgICBpZiggc3RvcnlfaHRtbCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYoIG1lc3NhZ2VfaHRtbC5sZW5ndGggPiAwICkgc3RvcnlfaHRtbCA9ICc8cD4nICsgc3RvcnlfaHRtbCArICc8L3A+JztcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBzdG9yeV9odG1sICsgbWVzc2FnZV9odG1sO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyB8fCB0aGlzLmRhdGEuZXZlbnROZXR3b3JrID09ICdnb29nbGVwbHVzJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLmlkID09ICdjaW5ib3gnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSAnWW91IGhhdmUgYSBjb21tZW50IGhlcmUnO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNvbW1lbnRzICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgIT09IHVuZGVmaW5lZCApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50ICkgKSB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudCA9IFsgdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50Lmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRlbXBfbWVzc2FnZSA9ICQoJzxkaXY+JykuaHRtbCggdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnRbIDAgXS5tZXNzYWdlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UuZmluZCgnYScpLmF0dHIoJ3RhcmdldCcsJ19ibGFuaycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9yaWdfbWVzc2FnZSA9IHRoaXMuZGF0YS5tZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBvcmlnX21lc3NhZ2UgPT09ICdzdHJpbmcnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICR0ZW1wX21lc3NhZ2UyID0gJCgnPGRpdj4nKS5odG1sKCBvcmlnX21lc3NhZ2UgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRlbXBfbWVzc2FnZTIuZmluZCgnYScpLmF0dHIoJ3RhcmdldCcsJ19ibGFuaycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdfbWVzc2FnZSA9ICR0ZW1wX21lc3NhZ2UyLmh0bWwoKTsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gICAnPHNwYW4gY2xhc3M9XCJjb21tZW50LXN1YnRpdGxlXCI+JyArIEVDLnJlcGxhY2VfdHlwZV9pbl91c2VybmFtZSh0aGlzLnByb2ZpbGUudXNlcm5hbWUpICsgJ1xcJ3MgUG9zdDo8L3NwYW4+ICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCArPSAgb3JpZ19tZXNzYWdlICsgJzxicj48YnI+PHNwYW4gY2xhc3M9XCJjb21tZW50LXN1YnRpdGxlXCI+JyArIHRoaXMuZGF0YS5mcm9tTmFtZSArICdcXCdzIENvbW1lbnQ6PC9zcGFuPiAnICsgJHRlbXBfbWVzc2FnZS5odG1sKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgIC8vcmVuZGVyX3RhZ19pdF9idXR0b24oIHNlbGYuZGF0YSwgJHRoaXMsICR0aGlzLmZpbmQoJy5pdGVtLXRleHQnKSwgc2VsZi5kYXRhLmV2ZW50VGltZSApOyBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWVzc2FnZV9odG1sID0gbWVzc2FnZV9odG1sLnJlcGxhY2UoL15cXHNcXHMqLywgJycpLnJlcGxhY2UoL1xcc1xccyokLywgJycpO1xyXG5cclxuICAgICAgICByZXR1cm4gbWVzc2FnZV9odG1sO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vdGhlbiByZW5kZXJfdGFnX2l0X2J1dHRvblxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0SXRlbU1lZGlhID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICB2YXIgZXh0X2VsZW1lbnQsIGl0ZW1NZWRpYTtcclxuICAgICAgICB2YXIgc2xpZGVyX2l0ZW1zID0gW107XHJcblxyXG4gICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggc2VsZi5kYXRhLm1lZGlhICkgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gc2VsZi5mZWVkLmlkO1xyXG4gICAgICAgICAgICB2YXIgaXRlbV9pZCA9ICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInID8gc2VsZi5kYXRhLnBvc3RJRCA6IHNlbGYuZGF0YS5pZCApO1xyXG4gICAgICAgICAgICB2YXIgYWx0ID0gJC5pc0VtcHR5T2JqZWN0KCBzZWxmLmRhdGEubWVkaWFbIDAgXS5hbHQgKSA/IFwiXCIgOiBzZWxmLmRhdGEubWVkaWFbIDAgXS5hbHQ7XHJcbiAgICAgICAgICAgIHZhciBpbWFnZUFycmF5ID0gJyc7XHJcbiAgICAgICAgICAgIHZhciBuYXZEb3RzID0gXCJcIjtcclxuICAgICAgICAgICAgdmFyIGJ0bk5hbWUgPSBcImJ0bi1cIiArIHR5cGUgKyBcIl9cIiArIGl0ZW1faWQ7XHJcblxyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGEubWVkaWEubGVuZ3RoOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2VFbCA9IHRoaXMuZGF0YS5tZWRpYVsgaSBdO1xyXG4gICAgICAgICAgICAgICAgdmFyIHVybF9uID0gRUMuRkJfdGh1bWJuYWlsX3RvX2Z1bGxfc2l6ZSggaW1hZ2VFbC5zcmMgKTtcclxuICAgICAgICAgICAgICAgIHZhciBjdXJySWQgPSBcImltZy1cIiArIHR5cGUgKyBcIl9cIiArIGl0ZW1faWQgKyBcIl9cIiArIGk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VyckRvdElkID0gXCJpbWctZG90LVwiICsgaTtcclxuICAgICAgICAgICAgICAgIHZhciBwcmV2SWQgPSBcImltZy1cIiArIHR5cGUgKyBcIl9cIiArIGl0ZW1faWQgKyBcIl9cIiArICggaSA9PSAwID8gdGhpcy5kYXRhLm1lZGlhLmxlbmd0aCAtIDEgOiBpIC0gMSApO1xyXG4gICAgICAgICAgICAgICAgdmFyIG5leHRJZCA9IFwiaW1nLVwiICsgdHlwZSArIFwiX1wiICsgaXRlbV9pZCArIFwiX1wiICsgKCBpID09ICggdGhpcy5kYXRhLm1lZGlhLmxlbmd0aCAtIDEgKSA/IDAgOiBpICsgMSApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMucHVzaCh7J3NyYyc6dXJsX24sIHc6OTY0LCBoOjEwMjR9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdmYWNlYm9vaycgJiYgaSA9PSAodGhpcy5kYXRhLm1lZGlhLmxlbmd0aCAtIDEpIClcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZUFycmF5ID0gXCI8aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdXJsX24gKyBcIicgPlwiO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYoIGkgPT0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VBcnJheSA9IFwiPGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIHVybF9uICsgXCInID5cIjtcclxuXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZmFjZWJvb2snIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnJldmVyc2UoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaW1hZ2VBcnJheSA9ICc8c3BhbiBjbGFzcz1cInByZXZcIj48L3NwYW4+JytpbWFnZUFycmF5Kyc8c3BhbiBjbGFzcz1cIm5leHRcIj48L3NwYW4+JztcclxuXHJcbiAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChpbWFnZUFycmF5KTtcclxuICAgICAgICAgICAgZXh0X2VsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtvcGVuUGhvdG9Td2lwZSggc2xpZGVyX2l0ZW1zICk7fSApOyAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHR5cGVvZiB0aGlzLmRhdGEubWVkaWEgPT0gJ29iamVjdCcgJiYgdGhpcy5kYXRhLm1lZGlhLnR5cGUgIT0gJ3VuYXZhaWxhYmxlJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgYWx0ID0gdGhpcy5kYXRhLm1lZGlhLmFsdDtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT09ICdmYWNlYm9vaycgJiYgdHlwZW9mIHRoaXMuZGF0YS5waWN0dXJlID09PSAnc3RyaW5nJyApIHRoaXMuZGF0YS5tZWRpYS5zcmMgPSB0aGlzLmRhdGEucGljdHVyZTtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoaXMuZGF0YS5tZWRpYS50eXBlPT1cInBob3RvXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB1cmxfbiA9IEVDLkZCX3RodW1ibmFpbF90b19mdWxsX3NpemUoIHRoaXMuZGF0YS5tZWRpYS5zcmMgKSxcclxuICAgICAgICAgICAgICAgICAgICBzdHVmZiA9ICcnO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiApO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gKSApIHN0dWZmID0gdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb247XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGF0YS5jYXB0aW9uICE9PSB1bmRlZmluZWQgKSBzdHVmZiA9IHRoaXMuZGF0YS5jYXB0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5kYXRhLm1lZGlhLmFsdCAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5hbHQgIT0gdGhpcy5kYXRhLm1lc3NhZ2UgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYS5hbHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAvKnRoaXMuZmVlZC5pZCAhPSAncGlfYm9hcmQnKi90aGlzLmZlZWQubmV0d29yayAhPSAncGludGVyZXN0JyApIHN0dWZmID0gRUMucmVwbGFjZVVSTFdpdGhIVE1MTGlua3MoIHN0dWZmICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1ldGFfaW5mbyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YV9pbmZvID0gXCI8YSBjbGFzcz0ncGhfbGluayBmb250LXdlaWdodCBtYXItNCB1aS1saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyB0aGlzLmRhdGEuY2hhbm5lbExpbmsgKyBcIicpO1xcXCIgPlwiICsgdGhpcy5kYXRhLmNoYW5uZWxUaXRsZSArIFwiPC9hPlwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAncGludGVyZXN0JyAmJiB0aGlzLmRhdGEubGluayAmJiB0aGlzLmRhdGEucmF3X2RhdGEubWV0YWRhdGEubGluayAmJiB0aGlzLmRhdGEucmF3X2RhdGEubWV0YWRhdGEubGluay50aXRsZSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YV9pbmZvID0gXCI8YSBjbGFzcz0ncGhfbGluaycgaHJlZj0namF2YXNjcmlwdDo7JyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyB0aGlzLmRhdGEubGluayArIFwiJyk7XFxcIj5cIiArIHRoaXMuZGF0YS5yYXdfZGF0YS5tZXRhZGF0YS5saW5rLnRpdGxlICsgXCI8L2E+XCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3BfaW1nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZS51cmwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwX2ltZyA9IHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UudXJsOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGF0YS5tZWRpYS5pbWFnZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwX2ltZyA9IHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmw7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQgKSApIHN0dWZmID0gdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGdwX2ltZyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmJfaW1hZ2UnPjxpbWcgY2xhc3M9XFxcImZ1bGwtaW1hZ2VcXFwiIHNyYz0nXCIgKyBncF9pbWcgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9cIjxhIGNsYXNzPSdwaF9saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyBncF9pbWcgKyBcIicpO1xcXCIgPlwiICsgKCB0aGlzLmRhdGEubWVkaWEuZGlzcGxheU5hbWUgfHwgJycgKSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+XCIgKyBzdHVmZiArIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7ICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMucHVzaCh7J3NyYyc6Z3BfaW1nLCB3Ojk2NCwgaDoxMDI0fSk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZiX2ltYWdlJz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdXJsX24gKyBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj48ZGl2IGNsYXNzPSdwYWRscjEwJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YV9pbmZvICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+XCIgKyBzdHVmZiArIFwiPC9kaXY+PC9kaXY+XCIvLytcclxuICAgICAgICAgICAgICAgICAgICAvLyBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+XCIgKyB0aGlzLmRhdGEubWVzc2FnZSArIFwiPC9kaXY+XCIvLytcclxuICAgICAgICAgICAgICAgICAgICAvLyBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBwaG90byc+PGRpdiBjbGFzcz0nZmxhc2gnPlwiKyggdXJsX3RvX2xpbmsoIHRoaXMuZGF0YS5tZXNzYWdlICkubGVuZ3RoICsnIDogOiAnKyBzdHVmZi5sZW5ndGggKStcIjwvZGl2PjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7IFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8uY3NzKHtcImZvbnQtc2l6ZVwiOlwiMTBweFwifSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZih0aGlzLmRhdGEubWVkaWEudHlwZT09XCJ2aWRlb1wiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3R1ZmYgPSAoIEVDLnJlcGxhY2VVUkxXaXRoSFRNTExpbmtzKCB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiA9PT0gdW5kZWZpbmVkID8gKHRoaXMuZGF0YS5jYXB0aW9uID09PSB1bmRlZmluZWQgPyAodGhpcy5kYXRhLm1lZGlhLmFsdCA9PSB0aGlzLmRhdGEubWVzc2FnZSA/ICcnIDogdGhpcy5kYXRhLm1lZGlhLmFsdCkgOiB0aGlzLmRhdGEuY2FwdGlvbiApIDogdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gKSB8fCAnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGxpbmtfdGV4dCA9ICdXYXRjaCB2aWRlbyc7XHJcbiAgICAgICAgICAgICAgICB2YXIgbWV0YV9pbmZvID0gJyc7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGlua190ZXh0ID0gdGhpcy5kYXRhLm1lZGlhLnRpdGxlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYnlfY2hhbm5lbCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmNoYW5uZWxJZCAhPSB0aGlzLmRhdGEuZnJvbUlkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBieV9jaGFubmVsID0gJzxsaT5ieSA8YSBjbGFzcz1cInl0LXVzZXItbmFtZVwiIGhyYWY9XCJqYXZhc2NyaXB0OjtcIiBvbkNsaWNrPVwiRUMuVUkuSUFCKFxcJycgKyB0aGlzLmRhdGEuY2hhbm5lbExpbmsgKyAnXFwnKTtcIiA+JyArIHRoaXMuZGF0YS5jaGFubmVsVGl0bGUgKyAnPC9hPjwvbGk+JztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyA9ICc8YSBjbGFzcz1cInBoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGlua1wiIGhyZWY9XCJqYXZhc2NyaXB0OnJhbTtcIj4nICsgbGlua190ZXh0ICsgJzwvYT48dWwgY2xhc3M9XCJ5dC1tZXRhLWluZm8gdWktZ3JpZC1zb2xvXCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5X2NoYW5uZWwgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxpPicgKyAgbmV3IERhdGUoIHRoaXMuZGF0YS5tZWRpYS51cGxvYWREYXRlICkuZm9ybWF0KCdtbW0gZGQsIHl5eXknKSArICc8L2xpPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxpPiZuYnNwOyZuYnNwOycgKyB0aGlzLmRhdGEudmlld3MuY291bnQgKyAnIHZpZXdzPC9saT4nICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L3VsPic7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyB8fCB0aGlzLmRhdGEuZXZlbnROZXR3b3JrID09ICdnb29nbGVwbHVzJylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQgKSApIHN0dWZmID0gdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQ7ICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyA9ICc8YSBjbGFzcz1cInBoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGlua1wiIGhyZWY9XCIjXCI+JyArICggdGhpcy5kYXRhLm1lZGlhLmRpc3BsYXlOYW1lIHx8ICdXYXRjaCB2aWRlbycgKSArICc8L2E+JztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS52aWRlbyAhPT0gdW5kZWZpbmVkICkgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndWktZ3JpZC1zb2xvIGxfbWVzc2FnZSc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0naW1nX2JveCB2aWRlbyB1aS1ncmlkLXNvbG8gcG9zaXRpb24tcmVsYXRpdmUnPjxpbWcgY2xhc3M9XFxcInZpZGVvLWJ1dHRvblxcXCIgc3JjPVxcXCJpbWcvcGxheS1idXR0b24ucG5nXFxcIj48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdGhpcy5kYXRhLm1lZGlhLnNyYy5yZXBsYWNlKCdGZGVmYXVsdCcsICdGaHFkZWZhdWx0JykucmVwbGFjZSgnL2RlZmF1bHQnLCAnL2hxZGVmYXVsdCcpICsgXCInPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj48ZGl2IGNsYXNzPSdwYWRscjEwJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgLy9cIjxhIGNsYXNzPSdwaF9saW5rJyBocmVmPScjJz5cIiArIGxpbmtfdGV4dCArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICBtZXRhX2luZm8gKyBcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCB2aWRlbyc+XCIgKyBzdHVmZiArIFwiPC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwiPGEgY2xhc3M9J3ZpZGVvX2xpbmsnIGhyZWY9J2phdmFzY3JpcHQ6Oycgb25jbGljaz1cXFwiRUMuVUkuSUFCKCdcIit0aGlzLmRhdGEubWVkaWEudmlkZW8uZGlzcGxheV91cmwrXCInKTtcXFwiPlZpZGVvIGxpbms8L2E+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEudmlkZW8gIT09IHVuZGVmaW5lZCApIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsZnVuY3Rpb24gKCBldmVudCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIHNlbGYgKVxyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIEVDLlVJLklBQihlbmNvZGVVUkkoc2VsZi5kYXRhLm1lZGlhLnZpZGVvLmRpc3BsYXlfdXJsKyc/YXV0b3BsYXk9MScpLCAnJywgJ19zeXN0ZW0nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3dpbmRvdy5vcGVuKCBlbmNvZGVVUkkoc2VsZi5kYXRhLm1lZGlhLnZpZGVvLnNvdXJjZV91cmwucmVwbGFjZSgnaHR0cDovLycsJ2h0dHBzOi8vJykgKSwnX3N5c3RlbScsJ2xvY2F0aW9uPXllcycpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vdmFyIG1lZGlhT2JqZWN0ID0gJzxpZnJhbWUgc3JjPVwiJytzZWxmLmRhdGEubWVkaWEudmlkZW8uc291cmNlX3VybC5yZXBsYWNlKCdodHRwOi8vJywnaHR0cHM6Ly8nKSsnXCIgd2lkdGg9XCIxMjgwXCIgaGVpZ2h0PVwiNzIwXCIgZnJhbWVib3JkZXI9XCIwXCI+PC9pZnJhbWU+JztcclxuICAgICAgICAgICAgICAgICAgICAvL3Bvc3RfbWFuYWdlci53YXRjaFBpY3R1cmVWaWRlbyhtZWRpYU9iamVjdCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS52aWRlbyAhPT0gdW5kZWZpbmVkICkgZXh0X2VsZW1lbnQub24oJ2NsaWNrJywgJy55dC11c2VyLW5hbWUnICxmdW5jdGlvbiAoIGV2ZW50IClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHRoaXMuZGF0YS5tZWRpYS50eXBlPT1cImFydGljbGVcIiYmKHRoaXMuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyB8fCB0aGlzLmRhdGEuZXZlbnROZXR3b3JrID09ICdnb29nbGVwbHVzJykpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdHVmZiA9ICcnLCB1cmxfbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQgKSApIHN0dWZmID0gdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UudXJsICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybF9uID0gdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZS51cmw7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuaW1hZ2UudXJsICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHVybF9uID0gdGhpcy5kYXRhLm1lZGlhLmltYWdlLnVybDsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB1cmxfbiAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndWktZ3JpZC1zb2xvIGxfbWVzc2FnZSc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltZ19ib3ggdWktZ3JpZC1zb2xvIHBvc2l0aW9uLXJlbGF0aXZlJz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdXJsX24gKyBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+PGRpdiBjbGFzcz0ncGFkbHIxMCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxhIGNsYXNzPSdwaF9saW5rIGZvbnQtd2VpZ2h0IG1hci00IHVpLWxpbmsnIGhyZWY9J2phdmFzY3JpcHQ6Oycgb25DbGljaz1cXFwiRUMuVUkuSUFCKCdcIiArIHRoaXMuZGF0YS5tZWRpYS51cmwgKyBcIicpO1xcXCIgPlwiICsgKCB0aGlzLmRhdGEubWVkaWEuZGlzcGxheU5hbWUgfHwgJycgKSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgbWVkaWEnPlwiICsgc3R1ZmYgKyBcIjwvZGl2PjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYodGhpcy5kYXRhLm1lZGlhLnR5cGU9PT0nYW5pbWF0ZWRfaW1hZ2Vfc2hhcmUnICYmIHRoaXMuZmVlZC5uZXR3b3JrID09PSAnZmFjZWJvb2snKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXJsX24gPSB0aGlzLmRhdGEubGlua1xyXG4gICAgICAgICAgICAgICAgICAgICxzdHVmZiA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgLG07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcmUgPSAvdXJsPVteJiNdKi9pXHJcbiAgICAgICAgICAgICAgICAvLyAgLHVybF9uID0gdGhpcy5kYXRhLm1lZGlhLnNyY1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmICggKG0gPSByZS5leGVjKCB1cmxfbiApKSAhPT0gbnVsbCApXHJcbiAgICAgICAgICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdXJsX24gPSBkZWNvZGVVUklDb21wb25lbnQoIG1bIDAgXS5yZXBsYWNlKCd1cmw9JywnJykgKTtcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmYl9pbWFnZSc+PGltZyBzcmM9J1wiICsgdXJsX24gKyBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICApOyAgXHJcblxyXG4gICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICBpZigkLmlzRW1wdHlPYmplY3QodGhpcy5kYXRhLm1lZGlhLnNyYykpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0dWZmID0gKCBFQy5yZXBsYWNlVVJMV2l0aEhUTUxMaW5rcyggdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gPT09IHVuZGVmaW5lZCA/ICh0aGlzLmRhdGEuY2FwdGlvbiA9PT0gdW5kZWZpbmVkID8gKHRoaXMuZGF0YS5tZWRpYS5hbHQgIT0gdGhpcy5kYXRhLm1lc3NhZ2UgPyAnJyA6IHRoaXMuZGF0YS5tZWRpYS5hbHQpIDogdGhpcy5kYXRhLmNhcHRpb24gKSA6IHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uICkgfHwgJycpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyB8fCB0aGlzLmRhdGEuZXZlbnROZXR3b3JrID09ICdnb29nbGVwbHVzJylcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3BfaW1nO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UudXJsICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwX2ltZyA9IHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UudXJsOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXRhLm1lZGlhLmltYWdlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lZGlhLmltYWdlLnVybCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncF9pbWcgPSB0aGlzLmRhdGEubWVkaWEuaW1hZ2UudXJsOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQgKSApIHN0dWZmID0gdGhpcy5kYXRhLm1lZGlhLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBncF9pbWcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZiX2ltYWdlJz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgZ3BfaW1nICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiJyA+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXCI8YSBjbGFzcz0ncGhfbGluayBmb250LXdlaWdodCBtYXItNCB1aS1saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyBncF9pbWcgKyBcIicpO1xcXCIgPlwiICsgKCB0aGlzLmRhdGEubWVkaWEuZGlzcGxheU5hbWUgfHwgJycgKSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTsgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMucHVzaCh7J3NyYyc6Z3BfaW1nLCB3Ojk2NCwgaDoxMDI0fSk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdsX21lc3NhZ2UgdWktZ3JpZC1zb2xvJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3BhZGxyMTAnPjxhIGNsYXNzPSdwaF9saW5rIGZvbnQtd2VpZ2h0IG1hci00IHVpLWxpbmsnIGhyZWY9J2phdmFzY3JpcHQ6Oycgb25DbGljaz1cXFwiRUMuVUkuSUFCKCdcIiArIHRoaXMuZGF0YS5tZWRpYS5ocmVmICsgXCInKTtcXFwiPlwiICsgdGhpcy5kYXRhLm1lZGlhLmhyZWYgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCc+XCIgKyBzdHVmZiArIFwiPC9kaXY+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFQy5VSS5JQUIoIGVuY29kZVVSSSggdGhpcy5kYXRhLm1lZGlhLmhyZWYgKSwnJywnX3N5c3RlbScpOyAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHVmZiA9ICggRUMucmVwbGFjZVVSTFdpdGhIVE1MTGlua3MoIHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uID09PSB1bmRlZmluZWQgPyAodGhpcy5kYXRhLmNhcHRpb24gPT09IHVuZGVmaW5lZCA/ICh0aGlzLmRhdGEubWVkaWEuYWx0ICE9IHRoaXMuZGF0YS5tZXNzYWdlID8gJycgOiB0aGlzLmRhdGEubWVkaWEuYWx0KSA6IHRoaXMuZGF0YS5jYXB0aW9uICkgOiB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiApIHx8ICcnKTtcclxuICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nbF9tZXNzYWdlIHVpLWdyaWQtc29sbyc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltZ19ib3gnPjxpbWcgY2xhc3M9XFxcImZ1bGwtaW1hZ2VcXFwiIHNyYz0nXCIgKyB0aGlzLmRhdGEubWVkaWEuc3JjICsgXCInID48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nY2xlYXInPjwvZGl2PjxkaXYgY2xhc3M9J3BhZGxyMTAnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8YSBjbGFzcz0ncGhfbGluayBmb250LXdlaWdodCBtYXItNCB1aS1saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyB0aGlzLmRhdGEubWVkaWEuaHJlZiArIFwiJyk7XFxcIj5cIiArICggdGhpcy5kYXRhLm5hbWUgfHwgJycgKSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgbWVkaWEnPlwiICsgc3R1ZmYgKyBcIjwvZGl2PjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzp0aGlzLmRhdGEubWVkaWEuc3JjLCB3Ojk2NCwgaDoxMDI0fSk7IFxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyB2YXIgc3JjID0gRkJfdGh1bWJuYWlsX3RvX2Z1bGxfc2l6ZSggdGhpcy5kYXRhLm1lZGlhLnNyYyApO1xyXG5cclxuICAgICAgICAgICAgLy8gJHRoaXMuZmluZCgnLml0ZW0tbWVkaWEnKS5hcHBlbmQoJzxkaXYgY2xhc3M9XCJpbWdcIiBzdHlsZT1cImJhY2tncm91bmQtaW1hZ2U6IHVybCgnICtzcmMrICcpO1wiPjwvZGl2PicpO1xyXG5cclxuICAgICAgICAgICAgLy8kdGhpcy5hZGRDbGFzcygnaGFzX21lZGlhJylcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcyAhPT0gdW5kZWZpbmVkIC8qJiYgdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLm1lZGlhICE9IHVuZGVmaW5lZCovIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhLnJldHdlZXRlZF9zdGF0dXMgPT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0ICE9PSB1bmRlZmluZWQgXHJcbiAgICAgICAgICAgICAgICAmJiB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0LnN0cmVhbUVudHJ5ICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldC5zdHJlYW1FbnRyeSApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHF1b3RlZF90d2VldCA9IHRoaXMuZGF0YS5yYXdfZGF0YS5xdW90ZWRfdHdlZXQuc3RyZWFtRW50cnlcclxuICAgICAgICAgICAgICAgICAgICAsJHF1b3RlZF90d2VldF9jb250YWluZXIgPSAkKCc8ZGl2PicsIHsgY2xhc3M6ICdxdW90ZWQtdHdlZXQtY29udGFpbmVyJyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICwkcXVvdGVkX3R3ZWV0X2F1dG9yID0gJCgnPGRpdj4nLCB7IGNsYXNzOiAncXVvdGVkLXR3ZWV0LWF1dG9yJyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICwkcXVvdGVkX3R3ZWV0X3RleHQgPSAkKCc8ZGl2PicsIHsgY2xhc3M6ICdxdW90ZWQtdHdlZXQtdGV4dCcgfSlcclxuICAgICAgICAgICAgICAgICAgICAsJHF1b3RlZF90d2VldF9tZWRpYSA9ICQoJzxkaXY+JywgeyBjbGFzczogJ3F1b3RlZC10d2VldC1tZWRpYScgfSlcclxuICAgICAgICAgICAgICAgICAgICAsZmlyc3RfdXJsID0gJydcclxuICAgICAgICAgICAgICAgICAgICA7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdXJscyA9IHNlbGYuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy51cmxzO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkodXJscykgKSBmaXJzdF91cmwgPSB1cmxzWyAwIF0udXJsO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZmlyc3RfdXJsID0gdXJscy51cmw7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG5hbWVfaHRtbCA9ICQoJzxiIGNsYXNzPVwicXVvdGVkLXR3ZWV0LWF1dG9yLW5hbWVcIj4nICsgcXVvdGVkX3R3ZWV0LnVzZXIubmFtZSArIFxyXG4gICAgICAgICAgICAgICAgICAgICc8L2I+PHNwYW4gY2xhc3M9XCJxdW90ZWQtdHdlZXQtYXV0b3Itc2NyZWVubmFtZVwiPkAnICsgcXVvdGVkX3R3ZWV0LnVzZXIuc2NyZWVuX25hbWUgKyAnPC9zcGFuPicpO1xyXG5cclxuICAgICAgICAgICAgICAgICRxdW90ZWRfdHdlZXRfYXV0b3IuaHRtbCggbmFtZV9odG1sICkuYXR0cignZGF0YS10b29sdGlwJywgcXVvdGVkX3R3ZWV0LnVzZXIubmFtZSApXHJcbiAgICAgICAgICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNob3dfdXNlcl9pbmZvKCBxdW90ZWRfdHdlZXQudXNlci5pZF9zdHIgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlX2h0bSA9IHF1b3RlZF90d2VldC50ZXh0LnJlcGxhY2UoL+KAnC9nLCAnJykucmVwbGFjZSgv4oCdL2csICcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bSA9IHVybF90b19saW5rKCBtZXNzYWdlX2h0bSApO1xyXG5cclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtID0gaGFzaHRhZ190b19saW5rKCBtZXNzYWdlX2h0bSwgJ3R3aXR0ZXInICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4ICAgPSAvKF58W15AXFx3XSlAKFxcd3sxLDE1fSlcXGIvZ1xyXG4gICAgICAgICAgICAgICAgICAgICxyZXBsYWNlID0gJyQxPGEgY2xhc3M9XCJ0dy11c2VyXCIgaHJlZj1cImphdmFzY3JpcHQ6O1wiIG9uY2xpY2s9XCJFQy5VSS5JQUIoXFwnaHR0cHM6Ly90d2l0dGVyLmNvbS8kMlxcJyk7XCIgZGF0YS11c2VyPVwiQCQyXCI+QCQyPC9hPic7IFxyXG5cclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtID0gbWVzc2FnZV9odG0ucmVwbGFjZSggcmVnZXgsIHJlcGxhY2UgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkcXVvdGVkX3R3ZWV0X3RleHQuaHRtbCggbWVzc2FnZV9odG0ucmVwbGFjZSgvXlxcc1xccyovLCAnJykucmVwbGFjZSgvXFxzXFxzKiQvLCAnJykgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkcXVvdGVkX3R3ZWV0X3RleHQub24oJ2NsaWNrJywnYS50dy11c2VyJyxmdW5jdGlvbiggZSApe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2hvd191c2VyX2luZm8oICQoIHRoaXMgKS5hdHRyKCdkYXRhLXVzZXInKSApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHF1b3RlZF90d2VldF90ZXh0Lm9uKCdjbGljaycsJ2EudHctaGFzaHRhZycsZnVuY3Rpb24oIGUgKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhhdCA9ICQoIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHR3X3NlYXJjaCA9IG5ldyBUV1NlYXJjaENvbnRhaW5lciggW10sIHsgcHJvZmlsZTogc2VsZi5wcm9maWxlLCBuZXh0OicnLCByZXN1bHRfdHlwZTogJ3JlY2VudCcgfSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHAgPSBuZXcgZWNQb3B1cCggdHdfc2VhcmNoLnZpZXcoKSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBwcC5lbGVtZW50LmFkZENsYXNzKCd0d2l0dGVyLXNlYXJjaCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBwcC5lbGVtZW50LmZpbmQoJy5oZWFkZXInKS5odG1sKCAnU0VBUkNIJyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCBwcC5yZW5kZXIoKS5oaWRlKCkuZmFkZUluKCA1MDAgKSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy50d2l0dGVyLXNlYXJjaCcpLmZpbmQoJyNzZWFyY2gtdGV4dCcpLnZhbCggZGVjb2RlVVJJQ29tcG9uZW50KHRoYXQuYXR0cignZGF0YS1xdWVyeScpKSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcudHdpdHRlci1zZWFyY2gnKS5maW5kKCcuZ28tYnV0dG9uJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggcXVvdGVkX3R3ZWV0LmVudGl0aWVzICE9PSB1bmRlZmluZWQgJiYgcXVvdGVkX3R3ZWV0LmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICRxdW90ZWRfdHdlZXRfbWVkaWEuaHRtbCggJzxpbWcgY2xhc3M9XCJ0d2l0dGVyLWltYWdlIGZ1bGwtaW1hZ2VcIiBzcmM9XCInICsgcXVvdGVkX3R3ZWV0LmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCArICdcIj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBmaXJzdF91cmwubGVuZ3RoID4gMCApIEVDLlVJLklBQiggZmlyc3RfdXJsICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7IFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICRxdW90ZWRfdHdlZXRfY29udGFpbmVyLmFwcGVuZCgkcXVvdGVkX3R3ZWV0X2F1dG9yLCAkcXVvdGVkX3R3ZWV0X3RleHQsICRxdW90ZWRfdHdlZXRfbWVkaWEpXHJcbiAgICAgICAgICAgICAgICAuaG92ZXIoZnVuY3Rpb24gKClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCB0aGlzICkuY3NzKCdib3JkZXInLCAnMXB4IHNvbGlkICM5OTknKTtcclxuICAgICAgICAgICAgICAgIH0sIFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCB0aGlzICkuY3NzKCdib3JkZXInLCAnMXB4IHNvbGlkICNjY2MnKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJHF1b3RlZF90d2VldF9jb250YWluZXI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMubWVkaWEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8qdmFyIHBvc3RfbWVkaWFfZWxlbWVudCA9IFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5nZXRfcG9zdF9tZWRpYV9lbGVtZW50LmNhbGwoIHVuZGVmaW5lZCwgdGhpcy5kYXRhLnJhd19kYXRhLCAkdGhpcy5maW5kKCcuaXRlbS1tZWRpYScpICk7XHJcbiAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9IHBvc3RfbWVkaWFfZWxlbWVudFswXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiggb2JqZWN0X2xlbmd0aCggcG9zdF9tZWRpYV9lbGVtZW50WzFdICkgPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMgPSBwb3N0X21lZGlhX2VsZW1lbnRbMV07XHJcbiAgICAgICAgICAgICAgICB9Ki9cclxuXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRhdGEubWVkaWFfY29udGVudCA9IGV4dF9lbGVtZW50O1xyXG5cclxuICAgICAgICBpdGVtTWVkaWEgPSAnJztcclxuICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyB8fCB0aGlzLmRhdGEuZXZlbnROZXR3b3JrID09ICdnb29nbGVwbHVzJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLmlkICE9ICdjaW5ib3gnICkgaXRlbU1lZGlhID0gZXh0X2VsZW1lbnQ7ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGl0ZW1NZWRpYSA9IGV4dF9lbGVtZW50XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gJC50eXBlKGl0ZW1NZWRpYSkgPT0gJ29iamVjdCcgPyBpdGVtTWVkaWEuaHRtbCgpOiBpdGVtTWVkaWE7XHJcbiAgICB9O1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldExpa2VzQ29tbWVudHMgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBsaWtlcyA9IHt9LFxyXG4gICAgICAgICAgICBkaXNsaWtlcyA9IHt9LFxyXG4gICAgICAgICAgICBjb21tZW50cyA9IHt9LFxyXG4gICAgICAgICAgICBzaGFyZXMgPSB7fTtcclxuXHJcbiAgICAgICAgc2VsZi5saWtlc19jb21tZW50c19mbGFnID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZmFjZWJvb2snIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIGxpa2VzXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLmxpa2VzID09PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy5jb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy50ZXh0ID0gJzAgbGlrZXMnO1xyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggc2VsZi5kYXRhLmxpa2VzLmxpa2UgKSkgc2VsZi5kYXRhLmxpa2VzLmxpa2UgPSBbIHNlbGYuZGF0YS5saWtlcy5saWtlIF07XHJcblxyXG4gICAgICAgICAgICAgICAgbGlrZXMuY291bnQgPSBzZWxmLmRhdGEubGlrZXMuY291bnQ7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy50ZXh0ID0gRUMucG9zdF9saWtlc190ZXh0KCBwYXJzZUludCggc2VsZi5kYXRhLmxpa2VzLmNvdW50ICksIHNlbGYuZGF0YS51c2VyX2xpa2VzID09ICAndHJ1ZScpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gY29tbWVudHNcclxuICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEuY29tbWVudHMgPT09IHVuZGVmaW5lZCApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ID0gJzAgY29tbWVudHMnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBwYXJzZUludCggc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ICkgPT0gMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIHNlbGYuZGF0YS5jb21tZW50cy5jb21tZW50ICkgKSBzZWxmLmRhdGEuY29tbWVudHMuY29tbWVudCA9IFsgc2VsZi5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgXTtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ID0gMTtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgPSAnMSBjb21tZW50JzsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ID0gc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50O1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMudGV4dCA9IHNlbGYuZGF0YS5jb21tZW50cy5jb3VudCArICcgY29tbWVudHMnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5zaGFyZWRDb3VuZCAhPT0gdW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNoYXJlcy5jb3VudCAgICA9IHNlbGYuZGF0YS5zaGFyZWRDb3VuZDtcclxuICAgICAgICAgICAgICAgIHNoYXJlcy50ZXh0ICAgICA9IHNlbGYuZGF0YS5zaGFyZWRDb3VuZCsnIFNoYXJlJysoc2VsZi5kYXRhLnNoYXJlZENvdW5kPT0nMSc/Jyc6J3MnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCAoIHNlbGYuZGF0YS5pc0FjdGl2aXR5ICE9PSB1bmRlZmluZWQgJiYgc2VsZi5kYXRhLmlzQWN0aXZpdHkgPT0gJ3RydWUnIClcclxuICAgICAgICAgICAgICAgIHx8ICggKCBzZWxmLmZlZWQuaWQgPT0gJ3NlYXJjaCcgfHwgc2VsZi5mZWVkLmlkID09ICdvdXRyZWFjaCcgKSAmJiB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT0gJ3VzZXInICkgfHwgdGhpcy5mZWVkLmlkID09ICdmYl9ub3RpZmljYXRpb25zJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubGlrZXNfY29tbWVudHNfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2Rpc3BsYXkgbm9uLWNsaWNrYWJsZSBsaWtlcyBmb3IgRkIgcGFnZXNcclxuICAgICAgICAgICAgZWxzZSBpZiAoICggdGhpcy5mZWVkLmlkID09ICdzZWFyY2gnIHx8IHRoaXMuZmVlZC5pZCA9PSAnb3V0cmVhY2gnIClcclxuICAgICAgICAgICAgICAgICYmICggdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwYWdlJyB8fCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGUgPT0gJ3BsYWNlJykgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvL3Jlc2V0IGxpa2VzICYgY29tbWVudHNcclxuICAgICAgICAgICAgICAgIGxpa2VzID0ge307XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cyA9IHt9O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIHRoaXMuZGF0YS5saWtlcyAhPT0gJ3N0cmluZycgKSB0aGlzLmRhdGEubGlrZXMgPSAnMCc7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubGlrZXMgPT09ICcwJyApIHt9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wX2xpa2VzID0gSlNPTi5wYXJzZSh0aGlzLmRhdGEubGlrZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0ZW1wX2xpa2VzLmRhdGEgJiYgdGVtcF9saWtlcy5kYXRhLmxlbmd0aCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLmxpa2VzID0gKCB0ZW1wX2xpa2VzLmRhdGEubGVuZ3RoID09PSAyNSA/ICcyNSsnIDogdGVtcF9saWtlcy5kYXRhLmxlbmd0aCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB0aGlzLmRhdGEubGlrZXMgPSAnMCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2goIGUgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRhdGEubGlrZXMgPSAnMCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNoYXJlcy5jb3VudCAgICA9IHNlbGYuZGF0YS5saWtlcztcclxuICAgICAgICAgICAgICAgIHNoYXJlcy50ZXh0ICAgICA9IHNlbGYuZGF0YS5saWtlcysnIFNoYXJlJysoc2VsZi5kYXRhLmxpa2VzPT0nMSc/Jyc6J3MnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9ICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gcmV0d2VldHNcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEucmV0d2VldHMuY291bnQgIT0gdW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpa2VzLmNvdW50ID0gc2VsZi5kYXRhLnJldHdlZXRzLmNvdW50O1xyXG4gICAgICAgICAgICAgICAgbGlrZXMudGV4dCA9IEVDLm51bWJlcldpdGhDb21tYXMoIHRoaXMuZGF0YS5yZXR3ZWV0cy5jb3VudCApKyAnIHJldHdlZXQnICsgKCB0aGlzLmRhdGEucmV0d2VldHMuY291bnQgPT0gJzEnID8gJycgOiAncycgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29tbWVudHMuY291bnQgID0gc2VsZi5kYXRhLmZhdm9yaXRlcy5jb3VudDtcclxuICAgICAgICAgICAgY29tbWVudHMudGV4dCAgID0gRUMubnVtYmVyV2l0aENvbW1hcyggc2VsZi5kYXRhLmZhdm9yaXRlcy5jb3VudCApICsgJyBsaWtlJyArICggc2VsZi5kYXRhLmZhdm9yaXRlcy5jb3VudCA9PSAnMScgPyAnJyA6ICdzJyApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnbGlua2VkaW4nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy8gbGlrZXNcclxuICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEubGlrZXMgPT0gdW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpa2VzLmNvdW50ID0gMDtcclxuICAgICAgICAgICAgICAgIGxpa2VzLnRleHQgID0gJ08gbGlrZXMnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggcGFyc2VJbnQoIHNlbGYuZGF0YS5saWtlcy5jb3VudCApID09IDEgKSBzZWxmLmRhdGEubGlrZXMubGlrZSA9IFsgc2VsZi5kYXRhLmxpa2VzLmxpa2UgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBsaWtlcy5jb3VudCA9IHNlbGYuZGF0YS5saWtlcy5jb3VudDtcclxuICAgICAgICAgICAgICAgIGxpa2VzLnRleHQgPSBFQy5wb3N0X2xpa2VzX3RleHQoIHBhcnNlSW50KCBzZWxmLmRhdGEubGlrZXMuY291bnQgKSwgc2VsZi5kYXRhLnVzZXJfbGlrZXMgPT0gICd0cnVlJyk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBjb21tZW50c1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5jb21tZW50cyA9PSB1bmRlZmluZWQgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMuY291bnQgID0gMDtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgICA9ICcwIGNvbW1lbnRzJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBwYXJzZUludCggc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ICkgPT0gMSApIHNlbGYuZGF0YS5jb21tZW50cy5jb21tZW50ID0gWyBzZWxmLmRhdGEuY29tbWVudHMuY29tbWVudCBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ICA9IHNlbGYuZGF0YS5jb21tZW50cy5jb3VudDtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgICA9IEVDLm51bWJlcldpdGhDb21tYXMoIHNlbGYuZGF0YS5jb21tZW50cy5jb3VudCApICsgJyBjb21tZW50JyArICggc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ID09ICcxJyA/ICcnIDogJ3MnICk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAneW91dHViZScgfHwgdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2Jsb2dnZXInKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9saWtlcy9kaXNsaWtlc1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICd5b3V0dWJlJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy5jb3VudCA9IHNlbGYuZGF0YS5saWtlcy5jb3VudDtcclxuICAgICAgICAgICAgICAgIGxpa2VzLnRleHQgID0gRUMucG9zdF9saWtlc190ZXh0KCBzZWxmLmRhdGEubGlrZXMuY291bnQsIHNlbGYuZGF0YS5tZWRpYS5yYXRpbmcgPT0gJ2xpa2UnICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZGlzbGlrZXMuY291bnQgPSBzZWxmLmRhdGEubGlrZXMuZGlzbGlrZXM7XHJcbiAgICAgICAgICAgICAgICBkaXNsaWtlcy50ZXh0ID0gRUMucG9zdF9saWtlc190ZXh0KCBzZWxmLmRhdGEubGlrZXMuZGlzbGlrZXMsIHNlbGYuZGF0YS5tZWRpYS5yYXRpbmcgPT0gJ2Rpc2xpa2UnLCB0cnVlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vY29tbWVudHNcclxuICAgICAgICAgICAgdmFyIGNvbW1lbnRzX3RleHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoICQuaXNFbXB0eU9iamVjdChzZWxmLmRhdGEuY29tbWVudHMpICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ID0gMDtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgPSAnMCBjb21tZW50cyc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMuY291bnQgPSBzZWxmLmRhdGEuY29tbWVudHMuY291bnQ7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ID0gRUMubnVtYmVyV2l0aENvbW1hcyggc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ICkgKyAnIGNvbW1lbnQnICsgKCBzZWxmLmRhdGEuY29tbWVudHMuY291bnQgPT0gMSApID8nJzoncyc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICggJC5pc0VtcHR5T2JqZWN0KHNlbGYuZGF0YS5saWtlcykgJiYgJC5pc0VtcHR5T2JqZWN0KHNlbGYuZGF0YS5jb21tZW50cykgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmxpa2VzX2NvbW1lbnRzX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL3BsdXNvbmVzXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLmxpa2VzID09IHVuZGVmaW5lZCApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy5jb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy50ZXh0ID0gJzAgbGlrZXMnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB5b3UgPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICBjb3VudCA9IHBhcnNlSW50KCBzZWxmLmRhdGEubGlrZXMuY291bnQgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5saWtlcy5pc19wbHVzb25lZCA9PSAndHJ1ZScgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb3VudC0tO1xyXG4gICAgICAgICAgICAgICAgICAgIHlvdSA9IFwiWW91ICsgXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHlvdSA9ICcrICc7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9qdXN0IGluIGNhc2VcclxuICAgICAgICAgICAgICAgIGlmICggY291bnQgPCAwICkgY291bnQgPSAwOyBcclxuXHJcbiAgICAgICAgICAgICAgICBsaWtlcy5jb3VudCA9IHNlbGYuZGF0YS5saWtlcy5jb3VudDtcclxuICAgICAgICAgICAgICAgIGxpa2VzLnRleHQgPSBFQy5udW1iZXJXaXRoQ29tbWFzKCBjb3VudCApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2NvbW1lbnRzXHJcbiAgICAgICAgICAgIHZhciBjb21tZW50c190ZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCAkLmlzRW1wdHlPYmplY3Qoc2VsZi5kYXRhLmNvbW1lbnRzKSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ID0gJzAgY29tbWVudHMnOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBlbmRpbmcgPSAncyc7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEuY29tbWVudHMuY291bnQgPT0gMSApIGVuZGluZyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb21tZW50c190ZXh0ID0gRUMubnVtYmVyV2l0aENvbW1hcyggc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ICkgKyAnIGNvbW1lbnQnICsgZW5kaW5nO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ID0gc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50O1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMudGV4dCA9IGNvbW1lbnRzX3RleHQ7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL3Jlc2hhcmVyc1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5yZXNoYXJlcnMgIT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5yZXNoYXJlcnMuY291bnQgIT0gJzAnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNoYXJlcy5jb3VudCA9IHRoaXMuZGF0YS5yZXNoYXJlcnMuY291bnQ7XHJcbiAgICAgICAgICAgICAgICBzaGFyZXMudGV4dCA9IHRoaXMuZGF0YS5yZXNoYXJlcnMuY291bnQrJyBTaGFyZScrKHRoaXMuZGF0YS5yZXNoYXJlcnMuY291bnQ9PScxJz8nJzoncycpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoICQuaXNFbXB0eU9iamVjdChzZWxmLmRhdGEubGlrZXMpICYmICQuaXNFbXB0eU9iamVjdChzZWxmLmRhdGEuY29tbWVudHMpIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5saWtlc19jb21tZW50c19mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAncGludGVyZXN0JylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLnJlcGlucyAhPSAnJykgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ID0gc2VsZi5kYXRhLnJlcGlucztcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgPSBFQy5udW1iZXJXaXRoQ29tbWFzKCBzZWxmLmRhdGEucmVwaW5zICkgKyAnIFJlcGluJyArIChzZWxmLmRhdGEucmVwaW5zPT0nMSc/Jyc6J3MnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMuY291bnQgID0gMDtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgICA9ICcwIFJlcGlucyc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLmxpa2VzICYmIHNlbGYuZGF0YS5saWtlcy5jb3VudCAhPSAwKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlrZXMuY291bnQgPSBzZWxmLmRhdGEubGlrZXMuY291bnQ7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGxpa2VzLmNvdW50ID0gMDtcclxuXHJcbiAgICAgICAgICAgIGxpa2VzLnRleHQgPSBFQy5udW1iZXJXaXRoQ29tbWFzKCBsaWtlcy5jb3VudCApICsgJyBMaWtlJyArIChsaWtlcy5jb3VudD09MT8nJzoncycpXHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5jb21tZW50cyAmJiBzZWxmLmRhdGEuY29tbWVudHMuY291bnQgIT0gMCkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ID0gc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGNvbW1lbnRzLmNvdW50ID0gMDtcclxuXHJcbiAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgPSBFQy5udW1iZXJXaXRoQ29tbWFzKCBjb21tZW50cy5jb3VudCApICsgJyBDb21tZW50JyArIChjb21tZW50cy5jb3VudCA9PSAxPycnOidzJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuZmVlZC5pZCA9PSAnY2luYm94JyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ0ZCQ29tbWVudHMnIHx8IHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ0ZCU2hhcmVzJyBcclxuICAgICAgICAgICAgICAgIHx8IHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ0ZCT3RoZXJzJyB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQkxpa2VzJyB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQldhbGxQb3N0cycgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmxpa2VzX2NvbW1lbnRzX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7J2xpa2VzJzpsaWtlcywnZGlzbGlrZXMnOmRpc2xpa2VzLCdjb21tZW50cyc6Y29tbWVudHMsJ3NoYXJlcyc6c2hhcmVzLCdsY19mbGFnJzpzZWxmLmxpa2VzX2NvbW1lbnRzX2ZsYWd9O1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuZ2V0VUlEYXRhID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdnZXRVSURhdGEnKTtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIFVJRGF0YSA9IHt9O1xyXG5cclxuICAgICAgICAvL25hbWUsIHByb2ZpbGVJbWcgYW5kIGRhdGVcclxuICAgICAgICBVSURhdGEucHJvZmlsZU5hbWUgID0gc2VsZi5kYXRhLmZyb21OYW1lO1xyXG4gICAgICAgIFVJRGF0YS5wcm9maWxlSW1nICAgPSBzZWxmLmRhdGEucHJvZmlsZVBpYyB8fCBzZWxmLmRhdGEuaWNvbjtcclxuICAgICAgICBVSURhdGEudGltZSAgICAgICAgID0gc2VsZi5nZXRJdGVtVGltZSgpO1xyXG5cclxuICAgICAgICAvL2l0ZW0gdGV4dCBcclxuICAgICAgICBVSURhdGEuaXRlbVRleHQgICAgID0gc2VsZi5nZXRJdGVtVGV4dCgpO1xyXG4gICAgICAgIFVJRGF0YS5pdGVtTWVkaWEgICAgPSBzZWxmLmdldEl0ZW1NZWRpYSgpO1xyXG5cclxuICAgICAgICAvL2xpa2VzIGFuZCBjb21tZW50c1xyXG4gICAgICAgIHZhciBsYyAgICAgICAgICA9IHNlbGYuZ2V0TGlrZXNDb21tZW50cygpO1xyXG4gICAgICAgIFVJRGF0YS5saWtlcyAgICA9IGxjLmxpa2VzO1xyXG4gICAgICAgIFVJRGF0YS5kaXNsaWtlcyA9IGxjLmRpc2xpa2VzO1xyXG4gICAgICAgIFVJRGF0YS5jb21tZW50cyA9IGxjLmNvbW1lbnRzO1xyXG4gICAgICAgIFVJRGF0YS5zaGFyZXMgICA9IGxjLnNoYXJlcztcclxuICAgICAgICBVSURhdGEubGNfZGlzcCAgPSBsYy5sY19mbGFnO1xyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIFVJRGF0YTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBUaW1lbGluZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICckaW5qZWN0b3InLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCAkaW5qZWN0b3IgKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICB2YXIgQ29sbGFwc2libGVGZWVkSXRlbSA9ICBDb2xsYXBzaWJsZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0NvbGxhcHNpYmxlRmVlZEl0ZW0nKTtcclxuICAgIHZhciBUaW1lbGluZUZlZWRJdGVtID0gIFRpbWVsaW5lRmVlZEl0ZW0gfHwgJGluamVjdG9yLmdldCgnVGltZWxpbmVGZWVkSXRlbScpO1xyXG5cclxuICAgIGZ1bmN0aW9uIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtICggaXRlbV9kYXRhLCBmZWVkIClcclxuICAgIHtcclxuICAgICAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuICAgIH1cclxuXHJcbiAgICBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcbiAgICBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuYWRkX2NvbW1lbnQgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5hZGRfY29tbWVudDtcclxuXHJcbiAgICBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuZGVsZXRlX21lc3NhZ2UgPSBmdW5jdGlvbiAoICR0d2VldCwgaWQgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcblxyXG4gICAgICAgIHZhciB0ZXh0ID0gJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhpcyBwb3N0ID8nO1xyXG4gICAgICAgIFxyXG4gXHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5yZXR3ZWV0ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUucmV0d2VldDtcclxuXHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsICdUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gVHdpdHRlckZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggLyp3aW5kb3cuZ2xvYmFscy50d19mZWVkc19saXZlX3VwZGF0ZSAmJiovIFsnaG9tZUZlZWQnLCdsaXN0cycsJ21lbnRpb25zJywndHdGb2xsb3dlcnMnLCdkaXJlY3RfbWVzc2FnZSddLmluZGV4T2YoIHN0cmVhbS5zdHJlYW1JZCApICE9PSAtMSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZlZWQgPSB0cnVlOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHdpdHRlckZlZWQ7XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICggcmVtb3ZlX21lc3NhZ2UgKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUudXBkYXRlRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIC8vIHJlcXVlc3RzIGRhdGEgYW5kIHRoZW4gY2FsbHMgdGhpcy5zYXZlX2l0ZW1zXHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hvbWVGZWVkJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0hvbWVGZWVkJyk7IC8vIDwtLSBzaW1pbGFyIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ21lbnRpb25zJzogdGhpcy5yZXF1ZXN0KCdnZXRUV01lbnRpb25zJyk7IC8vIDwtLSBzaW1pbGFyIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3Rm9sbG93ZXJzJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0ZvbGxvd2VycycpOyAvLyA8LS0gdG90YWxseSB1bmlxdWVcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3RnJpZW5kcyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdGcmllbmRzTGlzdCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2VuZFR3ZWV0cyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdTZW5kVHdlZXRzJyk7IC8vIDwtLSBzaW1pbGFyLWlzaCB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdteVR3ZWV0c1JldHdlZXRlZCc6IHRoaXMucmVxdWVzdCgnZ2V0VFdSZXR3ZWV0cycpOyAvLyA8LS0gc2ltaWxhci1pc2ggdG8gVGltZWxpbmVGZWVkSXRlbVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAndHdGYXZvcml0ZXMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXRmF2b3JpdGVzJyk7IC8vIDwtLSBzaW1pbGFyIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2RpcmVjdF9tZXNzYWdlJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0luQm94Jyk7IC8vIDwtLSBzaW1pbGFyIHRvIENvbGxhcHNpYmxlRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xpc3RzJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0xpc3RzJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdzZWFyY2gnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VhcmNoJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdvdXRyZWFjaCc6IHRoaXMucmVxdWVzdCgnZ2V0VFdTZWFyY2gnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2xpc3RzJyB8fCB0aGlzLmlkID09ICdzZWFyY2gnIHx8IHRoaXMuaWQgPT0gJ291dHJlYWNoJyB8fCB0aGlzLmlkID09ICdkaXJlY3RfbWVzc2FnZScgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy90aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTsgXHJcbiAgICAgICAgICAgIC8vdGhpcy5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnJyxcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIG1heF9pZDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggKCB0aGlzLmlkID09PSAndHdGb2xsb3dlcnMnIHx8IHRoaXMuaWQgPT09ICd0d0ZyaWVuZHMnICkgJiYgc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3QgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZGF0YS51c2VySUQgPSBzZWxmLm9wdGlvbnMudXNlcl9pZF9mb3JfcmVxdWVzdDsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2hvbWVGZWVkJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdIb21lRmVlZCc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnbWVudGlvbnMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV01lbnRpb25zJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICd0d0ZvbGxvd2Vycyc6IGRhdGEuYWN0aW9uID0gJ2dldFRXRm9sbG93ZXJzJzsgXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdGcmllbmRzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdGcmllbmRzTGlzdCc7IFxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3NlbmRUd2VldHMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV1NlbmRUd2VldHMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ215VHdlZXRzUmV0d2VldGVkJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdSZXR3ZWV0cyc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdGYXZvcml0ZXMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV0Zhdm9yaXRlcyc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAnZGlyZWN0X21lc3NhZ2UnOiBcclxuICAgICAgICAgICAgLy8gICAgIGRhdGEuYWN0aW9uID0gJ2dldFRXSW5Cb3gnO1xyXG4gICAgICAgICAgICAvLyAgICAgZGF0YS5pbmJveF9tYXhfaWQgPSB0aGlzLm5leHQuaW5ib3g7XHJcbiAgICAgICAgICAgIC8vICAgICBkYXRhLm91dGJveF9tYXhfaWQgPSB0aGlzLm5leHQub3V0Ym94O1xyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3R3aXR0ZXInLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcCB8fCB7fTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKSBkYXRhLmRhdGEuc3BsaWNlKCAwLCAxICk7IC8vIGJhY2tlbmQgcmV0dXJucyBsYXN0IGl0ZW0gZnJvbSBwcmV2IHJlcXVlc3QgYXMgZmlyc3QgaXRlbSBoZXJlXHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuY3Vyc29yICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuY3Vyc29yWyAwIF0gIT09IDAgKSBzZWxmLm5leHQgPSBkYXRhLmN1cnNvclsgMCBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhWyBkYXRhLmRhdGEubGVuZ3RoIC0gMSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBUV1NlYXJjaENvbnRhaW5lcjogc2VsZiA9IHRoaXM7IHByb2ZpbGUgPSBzZWxmLmRhdGEucHJvZmlsZVxyXG4gICAgLy8gdHlwZSA9IHR3ZWV0cyBPUiBwZW9wbGVcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLnNlYXJjaF9yZXF1ZXN0ID0gZnVuY3Rpb24gKCBzZWxmLCBjYWxsYmFjaywgY2xhc3NfbmFtZSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHBhcmFtZXRlcnMgPSBbXSwgbmV4dCwgcXVlcnksIHByb2ZpbGUsIHJlc3VsdF90eXBlLCB0eXBlLCBsYW5nLCBnZW9jb2RlO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHNlbGYuY29uc3RydWN0b3IubmFtZSA9PSAnVHdpdHRlckZlZWQnIClcclxuICAgICAgICBpZiAoIGNsYXNzX25hbWUgPT0gJ1R3aXR0ZXJGZWVkJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0eXBlID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMudHlwZTtcclxuICAgICAgICAgICAgcXVlcnkgPSBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeTtcclxuICAgICAgICAgICAgcHJvZmlsZSA9IHNlbGYucHJvZmlsZTtcclxuICAgICAgICAgICAgcmVzdWx0X3R5cGUgPSBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5yZXN1bHRfdHlwZTtcclxuICAgICAgICAgICAgbmV4dCA9IHNlbGYubmV4dDtcclxuICAgICAgICAgICAgbGFuZyA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLmxhbmc7IFxyXG4gICAgICAgICAgICBnZW9jb2RlID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMuZ2VvY29kZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmRhdGEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZSA9IHNlbGYuZGF0YS50eXBlO1xyXG4gICAgICAgICAgICBxdWVyeSA9IHNlbGYuZGF0YS5xdWVyeTtcclxuICAgICAgICAgICAgcHJvZmlsZSA9IHNlbGYuZGF0YS5wcm9maWxlO1xyXG4gICAgICAgICAgICByZXN1bHRfdHlwZSA9IHNlbGYuZGF0YS5yZXN1bHRfdHlwZTtcclxuICAgICAgICAgICAgcGFnZSA9IHNlbGYuZGF0YS5wYWdlO1xyXG4gICAgICAgICAgICBuZXh0ID0gc2VsZi5kYXRhLm5leHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICBrZXk6ICdxJyxcclxuICAgICAgICAgICAgdmFsdWU6IHF1ZXJ5XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICggdHlwZSA9PSAndHdlZXRzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAga2V5OiAncmVzdWx0X3R5cGUnLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlc3VsdF90eXBlXHJcbiAgICAgICAgICAgIH0pOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggbGFuZyAhPT0gdW5kZWZpbmVkICYmIGxhbmcubGVuZ3RoID4gMCAmJiBsYW5nICE9ICdhbGwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ2xhbmcnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBsYW5nXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZ2VvY29kZSAhPT0gdW5kZWZpbmVkICYmIGdlb2NvZGUubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAga2V5OiAnZ2VvY29kZScsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGdlb2NvZGVcclxuICAgICAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL3Blb3BsZVxyXG4gICAgICAgIGVsc2UgaWYgKCBuZXh0ICE9PSB1bmRlZmluZWQgJiYgbmV4dCAhPT0gZmFsc2UgKSBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ3BhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBuZXh0XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6IFwiZmVlZC90d2l0dGVyXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogcHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBwcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0VFdTZWFyY2gnLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggdHlwZSA9PSAndHdlZXRzJyAmJiByZXN1bHRfdHlwZSA9PSAncmVjZW50JyAmJiBuZXh0ICE9PSB1bmRlZmluZWQgKSByZXF1ZXN0LmRhdGEubWF4X2lkID0gbmV4dDtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZSxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrX2RhdGEgPSAnRkFJTCc7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEucmV0dXJuQ29kZSA9PSAnU1VDQ0VTUycgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZXJyb3JzICE9PSB1bmRlZmluZWQgJiYgZGF0YS5lcnJvcnMubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yID0gZGF0YS5lcnJvcnNbIDAgXS5zdHJlYW1FbnRyeTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBlcnJvciAhPT0gdW5kZWZpbmVkICYmIGVycm9yLm1lc3NhZ2UpIHt9Ly9FQy5VSS5hbGVydCgnVFcgZXJyb3I6ICcgKyBlcnJvci5tZXNzYWdlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgRUMuVUkuYWxlcnQoRUMuZ2V0TWVzc2FnZSgnVU5LTk9XTl9FUlInKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja19kYXRhID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEubmV4dCAhPT0gdW5kZWZpbmVkICkgY2FsbGJhY2tfZGF0YS5uZXh0ID0gZGF0YS5uZXh0OyBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBFQy5VSS5hbGVydChFQy5nZXRNZXNzYWdlKCdGQUlMX0VSUicpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGNhbGxiYWNrX2RhdGEgKTtcclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gKCBhY3Rpb24gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3R3aXR0ZXInXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBhY3Rpb24gPT0gJ2dldFRXU2VhcmNoJyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUgPT09IHVuZGVmaW5lZCApIC8vZW1wdHkgc2VhcmNoIGZlZWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5ICE9PSB1bmRlZmluZWQgJiYgc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnkubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZWFyY2hfcmVxdWVzdCggc2VsZiwgZnVuY3Rpb24oIGRhdGEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vaWYgKCBzZWxmLmRhdGEucmVzdWx0X3R5cGUgPT0gJ3BvcHVsYXInIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vJHBlb3BsZV9zZWN0aW9uLmNzcygnZGlzcGxheScsJ2Jsb2NrJyk7IFxyXG4gICAgICAgICAgICAgICAgICAgIH0sICdUd2l0dGVyRmVlZCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIFtdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGFjdGlvbiA9PSAnZ2V0VFdMaXN0cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGxpc3RzID0gdGhpcy5wcm9maWxlLmxpc3RzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBsaXN0cyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBsaXN0cy5kZWZhdWx0X2VsZW1lbnQgIT09IHVuZGVmaW5lZCApIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gbGlzdHMuZGVmYXVsdF9lbGVtZW50OyBcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGxpc3RzLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBsaXN0cy5kYXRhLmxlbmd0aCA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcmVmcmVzaCBpc2Nyb2xsXHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keSAuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGxpc3RzLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5IC5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIHN0cmVhbTogdGhpcy5pZFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKCAoIGFjdGlvbiA9PT0gJ2dldFRXRm9sbG93ZXJzJyB8fCBhY3Rpb24gPT09ICdnZXRUV0ZyaWVuZHNMaXN0JyApICYmIHNlbGYub3B0aW9ucy51c2VyX2lkX2Zvcl9yZXF1ZXN0IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGF0YS51c2VySUQgPSBzZWxmLm9wdGlvbnMudXNlcl9pZF9mb3JfcmVxdWVzdDsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJlcXVlc3QuZGF0YSA9IGRhdGE7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnJWNUVyAnICsgYWN0aW9uICsgJ3JlcXVlc3Q6JywgJ2NvbG9yOm9yYW5nZXJlZCcpXHJcblxyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjVFcgJyArIGFjdGlvbiArICdyZXNwb25zZTonLCAnY29sb3I6b3JhbmdlcmVkJylcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBkYXRhIClcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpZiAoIHJlcXVlc3QuZGF0YS5hY3Rpb24gPT0gJ2dldFRXU2VuZFR3ZWV0cycpIGNvbnNvbGUuZXJyb3IoIGRhdGEgKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggZGF0YS5jdXJzb3IgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmN1cnNvclsgMCBdICE9PSAwICkgc2VsZi5uZXh0ID0gZGF0YS5jdXJzb3JbIDAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBkYXRhLmRhdGFbIGRhdGEuZGF0YS5sZW5ndGggLSAxIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbiggdHJ1ZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpZiAoIHJlcXVlc3QuZGF0YS5hY3Rpb24gPT0gJ2dldFRXSW5Cb3gnICkgc2VsZi5lbGVtZW50LmZpbmQoJy5idG4udG9nZ2xlJykuZmlyc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICB9KTsgICBcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aCxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgIC8vIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdsaXN0cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLml0ZW1zWyAwIF0gIT09IHVuZGVmaW5lZCApIGRhdGEgPSBkYXRhLmNvbmNhdCggdGhpcy5pdGVtc1sgMCBdLmRhdGEgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdtZW50aW9ucycgKSBuZXdfZmVlZF9pdGVtID0gbmV3IFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtKCBbdGhpc19kYXR1bV0sIHNlbGYgKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBuZXdfZmVlZF9pdGVtLFxyXG4gICAgICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGk7XHJcblxyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgLy8gZGlyZWN0IG1lc3NhZ2VzIGZlZWRcclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2RpcmVjdF9tZXNzYWdlJyAmJiBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdLFxyXG4gICAgICAgICAgICAgICAgY3VzZXJJZCA9IHNlbGYucHJvZmlsZS5hY2NvdW50LmRhdGEudXNlcklkO1xyXG5cclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGFbIGkgXS5jb252ZXJzYXRpb24gPT09IHVuZGVmaW5lZCB8fCBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5ID09PSB1bmRlZmluZWQgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5ICkpIGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnkgPSBbIGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnkgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5LCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGsgPSAwLCBsbCA9IGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnkubGVuZ3RoOyBrIDwgbGw7IGsrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNtZXNzYWdlID0gZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeVsgayBdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggY21lc3NhZ2UucmVjaXBpZW50LmlkX3N0ciA9PT0gY3VzZXJJZCApIC8vIGxhdGVzdCBpbmNvbWluZyBpbiBjb252ZXJzYXRpb25cclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pbmNvbWluZy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGNtZXNzYWdlLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IG5ldyBEYXRlKCBjbWVzc2FnZS5jcmVhdGVkX2F0ICkuZ2V0VGltZSgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGNtZXNzYWdlLmlkX3N0clxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbWluY29taW5nLnNvcnQoIGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYS50aW1lID4gYi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA8IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pOyAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBmaW5kIGxhdGVzdCBpbmNvbWluZ1xyXG4gICAgICAgICAgICBpZiAoIG1pbmNvbWluZy5sZW5ndGggPiAwICkgc2VsZi5maXJzdEl0ZW1JRCA9IG1pbmNvbWluZ1sgMCBdLnRpbWU7XHJcblxyXG4gICAgICAgICAgICBlbHNlICBzZWxmLmZpcnN0SXRlbUlEID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdsaXN0cycgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdzZWFyY2gnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnb3V0cmVhY2gnICkgdGhpcy5pdGVtcy5wdXNoKCBuZXcgU2VhcmNoRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICkgZm9yICggaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdtZW50aW9ucycgKSBuZXdfZmVlZF9pdGVtID0gbmV3IFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtKCBbdGhpc19kYXR1bV0sIHNlbGYgKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZm9ybWF0X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICB1c2VyOiBkYXRhLnVzZXIsXHJcbiAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGRhdGEuY3JlYXRlZF9hdCApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgZmF2b3JpdGVzOiB7XHJcbiAgICAgICAgICAgICAgICBjb3VudDogZGF0YS5mYXZvcml0ZV9jb3VudCxcclxuICAgICAgICAgICAgICAgIGJ5X21lOiBkYXRhLmZhdm9yaXRlZFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXR3ZWV0czoge1xyXG4gICAgICAgICAgICAgICAgY291bnQ6IGRhdGEucmV0d2VldF9jb3VudCxcclxuICAgICAgICAgICAgICAgIGJ5X21lOiBkYXRhLnJldHdlZXRlZCxcclxuICAgICAgICAgICAgICAgIGlkOiAoICggZGF0YS5yZXR3ZWV0ZWRfc3RhdHVzICE9PSB1bmRlZmluZWQgKSA/IGRhdGEucmV0d2VldGVkX3N0YXR1cy5pZF9zdHIgOiBkYXRhLmlkX3N0ciApLFxyXG4gICAgICAgICAgICAgICAgcmV0d2VldElkOiAoICggZGF0YS5yZXR3ZWV0SWQgIT09IHVuZGVmaW5lZCApID8gZGF0YS5yZXR3ZWV0SWQgOiBmYWxzZSApXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEudGV4dCxcclxuICAgICAgICAgICAgZnJvbU5hbWU6ICggZGF0YS5uYW1lIHx8IGRhdGEudXNlci5uYW1lICksXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiAoIGRhdGEuc2NyZWVuX25hbWUgfHwgZGF0YS51c2VyLnNjcmVlbl9uYW1lICksXHJcbiAgICAgICAgICAgIHByb2ZpbGVQaWM6ICggZGF0YS5wcm9maWxlX2ltYWdlX3VybCB8fCBkYXRhLnVzZXIucHJvZmlsZV9pbWFnZV91cmwgKSxcclxuICAgICAgICAgICAgcG9zdElEOiBkYXRhLmlkX3N0cixcclxuICAgICAgICAgICAgaWQ6IGRhdGEuaWRfc3RyLFxyXG4gICAgICAgICAgICByYXdfZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5lbnRpdGllcyAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZW50aXRpZXMubWVkaWEgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBkYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCApIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEgPSBbXTtcclxuICAgICAgICAgICAgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwuZm9yRWFjaChmdW5jdGlvbihtZWRpYV91cmwpe1xyXG4gICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncGhvdG8nLFxyXG4gICAgICAgICAgICAgICAgICAgIHNyYzogbWVkaWFfdXJsXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgdXJscyA9IFtdO1xyXG4gICAgICAgIGlmICggZGF0YS5lbnRpdGllcyAmJiBkYXRhLmVudGl0aWVzLnVybHMgJiYgISBfLmlzRW1wdHkoIGRhdGEuZW50aXRpZXMudXJscyApIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybHMgPSBkYXRhLmVudGl0aWVzLnVybHM7XHJcblxyXG4gICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCB1cmxzICkgKSB1cmxzID0gWyB1cmxzIF07ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZm9yIHNoYXJlZCBZVCBsaW5rXHJcbiAgICAgICAgaWYgKCB1cmxzLmxlbmd0aCAmJiAoIWRhdGEuZW50aXRpZXMubWVkaWEgfHwgXHJcbiAgICAgICAgICAgICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZW50aXRpZXMubWVkaWEgKSAmJiBkYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCAmJiBkYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybC5pbmRleE9mKCdodHRwczovL2kueXRpbWcuY29tLycpICE9PSAtMSApKSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB2aWRlb19pZDtcclxuICAgICAgICAgICAgaWYgKCB1cmxzWzBdLmV4cGFuZGVkX3VybC5pbmRleE9mKCd5b3V0dWJlLmNvbScpICE9PSAtMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBoYXNoZXMgPSB1cmxzWzBdLmV4cGFuZGVkX3VybC5zbGljZSggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZignPycpICsgMSApLnNwbGl0KCcmJyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBoYXNoZXMubGVuZ3RoOyBpKysgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hlc1tpXS5zcGxpdCgnPScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGhhc2hbMF0gPT0gJ3YnICkgdmlkZW9faWQgPSBoYXNoWzFdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB1cmxzWzBdLmV4cGFuZGVkX3VybC5pbmRleE9mKCcvL3lvdXR1LmJlLycpICE9PSAtMSApIHZpZGVvX2lkID0gdXJsc1swXS5leHBhbmRlZF91cmwucmVwbGFjZSgnaHR0cHM6Ly95b3V0dS5iZS8nLCcnKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICggdmlkZW9faWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBkYXRhLmVudGl0aWVzLm1lZGlhID0geyBtZWRpYV91cmw6J2h0dHBzOi8vaW1nLnlvdXR1YmUuY29tL3ZpLycgK3ZpZGVvX2lkKyAnL2hxZGVmYXVsdC5qcGcnIH07XHJcbiAgICAgICAgICAgICAgICBkYXRhLmVudGl0aWVzLnZpZGVvX2lkID0gdmlkZW9faWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICggdGhpc19kYXR1bS5tZXNzYWdlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9kZWxldGUgbGlua3NcclxuICAgICAgICAgICAgdmFyIGV4cCA9IC8oXFxiKChodHRwcz98ZnRwfGZpbGUpOlxcL1xcL3xiaXQubHlcXC98Z29vLmdsXFwvfHQuY29cXC8pWy1BLVowLTkrJkAjXFwvJT89fl98ITosLjtdKlstQS1aMC05KyZAI1xcLyU9fl98XSkvaWc7XHJcblxyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgPSB0aGlzX2RhdHVtLm1lc3NhZ2UucmVwbGFjZShleHAsJycpLnRyaW0oKTtcclxuXHJcbiAgICAgICAgICAgIHVybHMuZm9yRWFjaChmdW5jdGlvbih1cmwpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVzc2FnZSArPSAnICcgKyB1cmwudXJsOyAgIFxyXG4gICAgICAgICAgICB9KTsgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5nZXRfcG9zdF9tZWRpYV9lbGVtZW50ID0gZnVuY3Rpb24gKCByYXdfZGF0YSwgJG1lZGlhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgZXh0X2VsZW1lbnQsXHJcbiAgICAgICAgICAgIHNsaWRlcl9pdGVtcyA9IFtdO1xyXG4gICAgICAgIGlmICggcmF3X2RhdGEgJiYgcmF3X2RhdGEuZW50aXRpZXMgJiYgcmF3X2RhdGEuZW50aXRpZXMubWVkaWEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGV4dF9tZWRpYV9kYXRhID0gcmF3X2RhdGEuZW50aXRpZXMuZXh0X21lZGlhLFxyXG4gICAgICAgICAgICAgICAgZXh0X21lZGlhLFxyXG4gICAgICAgICAgICAgICAgdmFyaWFudDtcclxuXHJcbiAgICAgICAgICAgIGlmKCBleHRfbWVkaWFfZGF0YSAmJiBleHRfbWVkaWFfZGF0YS5tZWRpYSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggZXh0X21lZGlhX2RhdGEubWVkaWEgKSApIGV4dF9tZWRpYSA9IGV4dF9tZWRpYV9kYXRhLm1lZGlhWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBleHRfbWVkaWEgPSBleHRfbWVkaWFfZGF0YS5tZWRpYTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBleHRfbWVkaWEgJiYgKCBleHRfbWVkaWEudHlwZSA9PT0gJ2FuaW1hdGVkX2dpZicgfHwgZXh0X21lZGlhLnR5cGUgPT09ICd2aWRlbycgKSAmJiBleHRfbWVkaWEudmlkZW9faW5mbyAmJiBleHRfbWVkaWEudmlkZW9faW5mby52YXJpYW50cyAmJiBleHRfbWVkaWEudmlkZW9faW5mby52YXJpYW50cy52YXJpYW50IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhcmlhbnRfZGF0YSA9IGV4dF9tZWRpYS52aWRlb19pbmZvLnZhcmlhbnRzLnZhcmlhbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KCB2YXJpYW50X2RhdGEgKSApIHZhcmlhbnQgPSB2YXJpYW50X2RhdGFbIDAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHZhcmlhbnQgPSB2YXJpYW50X2RhdGE7ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHZhcmlhbnQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkbWVkaWEuYWRkQ2xhc3MoJ2NlbnRlcicpO1xyXG4gICAgICAgICAgICAgICAgLy9leHRfZWxlbWVudCA9ICQoJzx2aWRlbyBsb29wIGNsYXNzPVwiYW5pbWF0ZWQtZ2lmXCIgcG9zdGVyPVwiJyArIGV4dF9tZWRpYS5tZWRpYV91cmxfaHR0cHMgKyAnXCIgc3JjPVwiJyArIHZhcmlhbnQudXJsICsgJ1wiPjwvdmlkZW8+Jyk7XHJcbiAgICAgICAgICAgICAgICAvKmlmICggZXh0X21lZGlhLnR5cGUgPT09ICdhbmltYXRlZF9naWYnICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKCc8dmlkZW8gYXV0b3BsYXkgbG9vcCBjbGFzcz1cImFuaW1hdGVkLWdpZlwiIHBvc3Rlcj1cIicgKyBleHRfbWVkaWEubWVkaWFfdXJsX2h0dHBzICsgJ1wiIHNyYz1cIicgKyB2YXJpYW50LnVybCArICdcIj48L3ZpZGVvPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgeyovXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3VpLWdyaWQtc29sbyBsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94IHZpZGVvIHVpLWdyaWQtc29sbyBwb3NpdGlvbi1yZWxhdGl2ZSc+PGltZyBjbGFzcz1cXFwidmlkZW8tYnV0dG9uXFxcIiBzcmM9XFxcImltZy9wbGF5LWJ1dHRvbi5wbmdcXFwiPjxpbWcgY2xhc3M9XFxcImltZy1yZXNwb25zaXZlXFxcIiBzcmM9J1wiICsgZXh0X21lZGlhLm1lZGlhX3VybF9odHRwcyArIFwiJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nY2xlYXInPjwvZGl2PlwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQub24oJ2NsaWNrJyxmdW5jdGlvbiAoKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgRUMuVUkuSUFCKCBlbmNvZGVVUkkodmFyaWFudC51cmwgKSwnJywnX3N5c3RlbScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgLy99XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCByYXdfZGF0YS5wcmV2aWV3X2NvbnRlbnQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aWV3X2NvbnRlbnQgPSBKU09OLnBhcnNlKCByYXdfZGF0YS5wcmV2aWV3X2NvbnRlbnQgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGUgPSAnJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R1ZmYgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBwcmV2aWV3X2NvbnRlbnQudGl0bGUgKSB0aXRsZSA9IHByZXZpZXdfY29udGVudC50aXRsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCByYXdfZGF0YS5waWN0dXJlX3RleHQgKSBzdHVmZiA9IHJhd19kYXRhLnBpY3R1cmVfdGV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2xfbWVzc2FnZSc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltZ19ib3gnPjxpbWcgc3JjPSdcIiArIHJhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCArIFwiJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nY2xlYXInPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8YSBjbGFzcz0ncGhfbGluaycgaHJlZj0nXCIgKyBwcmV2aWV3X2NvbnRlbnQudXJsICsgXCInIHRhcmdldD0nX2JsYW5rJz5cIiArIHRpdGxlICsgXCI8L2E+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2dyYXlfdGV4dCBtZWRpYSc+XCIgKyBzdHVmZiArIFwiPC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnJhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCwgdzo5NjQsIGg6MTAyNH0pOyBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKCc8aW1nIGNsYXNzPVwidHdpdHRlci1pbWFnZVwiIHNyYz1cIicgK3Jhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCsgJ1wiID4nKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnJhd19kYXRhLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCwgdzo5NjQsIGg6MTAyNH0pOyBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdmlkZW9faWQgPSByYXdfZGF0YS5lbnRpdGllcy52aWRlb19pZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHZpZGVvX2lkICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkY2xpY2thYmxlID0gJCgnPGRpdj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpLmxlbmd0aCApIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZSA9IGV4dF9lbGVtZW50LmZpbmQoJy5pbWdfYm94Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50LmZpbmQoJy5pbWdfYm94JykuYWRkQ2xhc3MoJ3ZpZGVvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkY2xpY2thYmxlID0gJG1lZGlhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkbWVkaWEuYWRkQ2xhc3MoJ3ZpZGVvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkY2xpY2thYmxlLm9uKCdjbGljaycsIGZ1bmN0aW9uKCBlICl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVDLlVJLklBQiggZW5jb2RlVVJJKCAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJyt2aWRlb19pZCsnP2F1dG9wbGF5PTEnICksJycsJ19zeXN0ZW0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLyp2YXIgbWVkaWFPYmplY3QgPSAnPGlmcmFtZSBzcmM9XCJodHRwczovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nKyB2aWRlb19pZCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgJz9hdXRvcGxheT0xXCIgd2lkdGg9XCIxMjgwXCIgaGVpZ2h0PVwiNzIwXCIgZnJhbWVib3JkZXI9XCIwXCI+PC9pZnJhbWU+JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdF9tYW5hZ2VyLndhdGNoUGljdHVyZVZpZGVvKCBtZWRpYU9iamVjdCwgdHJ1ZSApOyAqLyAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBbZXh0X2VsZW1lbnQsIHNsaWRlcl9pdGVtc107XHJcbiAgICB9O1xyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIFR3aXR0ZXJGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnRHJvcGRvd25GZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIERyb3Bkb3duRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBZb3VUdWJlRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBZb3VUdWJlRmVlZDtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teUNoYW5uZWxIb21lJzogdGhpcy5nZXRZb3VUdWJlRmVlZChcInl0X215Q2hhbm5lbEhvbWVcIixcIlwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3l0X215Q2hhbm5lbFZpZGVvcyc6IHRoaXMuZ2V0WW91VHViZUZlZWQoXCJ5dF9teUNoYW5uZWxWaWRlb3NcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teVN1YnNjcmlwdGlvbic6IHRoaXMuZ2V0WW91VHViZUZlZWQoXCJ5dF9teVN1YnNjcmlwdGlvblwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5uZXh0ID09PSB1bmRlZmluZWQgfHwgIXRoaXMubmV4dCApIHtcclxuICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKVswXS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICByZXR1cm47ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFlvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogdGhpcy5pZCxcclxuICAgICAgICAgICAgbmV4dFRva2VuOiB0aGlzLm5leHQgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3lvdVR1YmUnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEubmV4dFRva2VuICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhLm5leHRUb2tlbjtcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmdldFlvdVR1YmVGZWVkID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldFlvdVR1YmVGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogc3RyZWFtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmlkID09ICd5dF9teVN1YnNjcmlwdGlvbicgKSBkYXRhLmNoYW5uZWxfaWQgPSAvKidVQycgKyAqL3RoaXMucHJvZmlsZS5kYXRhLnVzZXJJZC5yZXBsYWNlKCdjaGFubmVsPT0nLCcnKTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3lvdVR1YmUnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSAhPT0gdW5kZWZpbmVkICYmIG9iai5kYXRhLm5leHRUb2tlbiAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLmRhdGEubmV4dFRva2VuO1xyXG5cclxuICAgICAgICAgICAgLy90ZW1wb3JhcnlcclxuICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAneXRfbXlTdWJzY3JpcHRpb24nIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmRlZmF1bHRDaGFubmVsSWQgIT09IHVuZGVmaW5lZCApIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRDaGFubmVsSWQ7IFxyXG4gICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouY29kZSA9PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ3l0X215U3Vic2NyaXB0aW9uJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YS5pdGVtcywgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLml0ZW1zICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLml0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YS5pdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuaXRlbXMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLml0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YS5pdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24oIGRhdGEgKSB7XHJcblxyXG4gICAgICAgIHZhciBtZWRpYSA9IGRhdGEubWVkaWE7XHJcblxyXG4gICAgICAgIGlmICggbWVkaWEudHlwZSA9PSBcInZpZGVvXCIgKSB7XHJcbiAgICAgICAgICAgIG1lZGlhLnZpZGVvID0ge1xyXG4gICAgICAgICAgICAgICAgZGlzcGxheV91cmw6ICdodHRwOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLycgKyBtZWRpYS5pZCArICc/YXV0b3BsYXk9MScsXHJcbiAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiAnaHR0cDovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgbWVkaWEuaWQgKyAnP2F1dG9wbGF5PTEnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgZnJvbUlkOiBkYXRhLmZyb21JZCxcclxuICAgICAgICAgICAgZnJvbU5hbWU6IGRhdGEuZnJvbU5hbWUsXHJcbiAgICAgICAgICAgIHByb2ZpbGVQaWM6IGRhdGEucHJvZmlsZVBpYyxcclxuICAgICAgICAgICAgcHJvZmlsZUxpbms6IGRhdGEucHJvZmlsZUxpbmssXHJcbiAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGRhdGEudXBkYXRlVGltZSApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgbWVzc2FnZTogZGF0YS5tZXNzYWdlLFxyXG5cclxuICAgICAgICAgICAgLy9tZXRhSW5mbzogKCBkYXRhLml0ZW1zWyBpIF0uY2hhbm5lbElkIT11bmRlZmluZWQgJiYgZGF0YS5pdGVtc1sgaSBdLmNoYW5uZWxUaXRsZSE9dW5kZWZpbmVkKSxcclxuICAgICAgICAgICAgY2hhbm5lbElkOiBkYXRhLmNoYW5uZWxJZCxcclxuICAgICAgICAgICAgY2hhbm5lbExpbms6ICdodHRwczovL3d3dy55b3V0dWJlLmNvbS9jaGFubmVsLycgKyBkYXRhLmNoYW5uZWxJZCxcclxuICAgICAgICAgICAgY2hhbm5lbFRpdGxlOiBkYXRhLmNoYW5uZWxUaXRsZSxcclxuICAgICAgICAgICAgYWN0aXZpdHlUeXBlOiBkYXRhLmFjdGl2aXR5VHlwZSB8fCAnJyxcclxuXHJcbiAgICAgICAgICAgIGxpa2VzOiBkYXRhLmxpa2VzLFxyXG4gICAgICAgICAgICB2aWV3czogZGF0YS52aWV3cyxcclxuICAgICAgICAgICAgY29tbWVudHM6IGRhdGEuY29tbWVudHMsXHJcblxyXG4gICAgICAgICAgICAvL3VzZXI6IGRhdGFbIGkgXS51c2VyLFxyXG4gICAgICAgICAgICAvL25hbWU6IGRhdGEuaXRlbXNbIGkgXS50aXRsZSxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgbWVkaWE6IG1lZGlhLFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBwb3N0SUQ6IGRhdGEuZnJvbUlkLCAvLz8/P1xyXG4gICAgICAgICAgICByYXdfZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5tZXNzYWdlLmluZGV4T2YoJ3VwbG9hZGVkIGEgdmlkZW8nKSAhPSAtMSApIHRoaXNfZGF0dW0ubWVzc2FnZSA9ICcnO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIFlvdVR1YmVGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5jb25zdGFudHMnLFtdKSAgXHJcbiAgLmNvbnN0YW50KCdhcGlVcmwnLCAnaHR0cHM6Ly9lY2xpbmNoZXIuY29tL3NlcnZpY2UvJylcclxuICAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywgeyAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnIH0pOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5jb250cm9sbGVycycsIFtdKVxyXG5cclxuLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkaW9uaWNMb2FkaW5nLCBBdXRoU2VydmljZSkge1xyXG5cclxuICAgICRzY29wZS5kYXRhID0ge307XHJcbiAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbihkYXRhKSB7XHJcbiAgICAgICAgLy8kc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG5cclxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coe1xyXG4gICAgICAgICAgICBub0JhY2tkcm9wOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICB2YXIgYSA9IEF1dGhTZXJ2aWNlLmxvZ2luKCRzY29wZS5kYXRhLnVzZXJuYW1lLCAkc2NvcGUuZGF0YS5wYXNzd29yZCwgZnVuY3Rpb24ocmVzcCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnWlpaOicgKyByZXNwKTtcclxuICAgICAgICAgICAgJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbn0pXHJcblxyXG5cclxuLmNvbnRyb2xsZXIoJ0hvbWVUYWJDdHJsJywgZnVuY3Rpb24oJHN0YXRlLCAkc2NvcGUsICRyb290U2NvcGUsIEVDLCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJHVybFJvdXRlciwgXykge1xyXG5cclxuXHJcbiAgICBjb25zb2xlLmxvZygnQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBISEhISEjIyMjIycpO1xyXG4gICAgXHJcbiAgICBpZiggJHJvb3RTY29wZS5zb2NpYWwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgY29uc29sZS5sb2coJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIpO1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmVudGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdob21lJykpO1xyXG4gICAgfSk7XHJcbiAgICBcclxuXHJcbiAgICAkc2NvcGUuZ3JvdXBzID0gW107XHJcbiAgICAkc2NvcGUuYWNjX3R5cGVzID0gW107XHJcblxyXG4gICAgaWYoIGFjY291bnRNYW5hZ2VyLmlzX3JlbmRlcmVkKCApIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnb29vb29vb29vb29vJyk7XHJcbiAgICAgICAgcHJlcGFyZUFjY291bnRzKCk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ25ubm5ubm5ubm5ubicpO1xyXG4gICAgICAgICRpb25pY0xvYWRpbmcuc2hvdyh7bm9CYWNrZHJvcDogdHJ1ZX0pO1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmluaXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICBwcmVwYXJlQWNjb3VudHMoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIFxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBwcmVwYXJlQWNjb3VudHMoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBBQ0NTID0gYWNjb3VudE1hbmFnZXIubGlzdF9hY2NvdW50cygpO1xyXG5cclxuICAgICAgICB2YXIgdGVtcCA9IFtdLFxyXG4gICAgICAgICAgICBhY2NfdHlwZXMgPSBbXTtcclxuXHJcbiAgICAgICAgQUNDUy5mb3JFYWNoKGZ1bmN0aW9uKGFjY291bnQsIGluZGV4KSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGVtcFt0eXBlXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdID0gW107XHJcbiAgICAgICAgICAgICAgICB0ZW1wW3R5cGVdLnByb2ZpbGVzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9lbHNlXHJcbiAgICAgICAgICAgIC8ve1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFjY291bnQucHJvZmlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmIChhY2NvdW50LnByb2ZpbGVzW2ldLm1vbml0b3JlZCA9PSAnb2ZmJykgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXS5wcm9maWxlcy5wdXNoKGFjY291bnQucHJvZmlsZXNbaV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vfVxyXG5cclxuICAgICAgICAgICAgdGVtcFt0eXBlXS50eXBlID0gdHlwZTtcclxuICAgICAgICAgICAgaWYgKGFjY190eXBlcy5pbmRleE9mKHR5cGUpID09PSAtMSkgYWNjX3R5cGVzLnB1c2godHlwZSk7XHJcblxyXG4gICAgICAgICAgICAvL3RlbXBbdHlwZV0ucHVzaCggeyd0eXBlJzp0eXBlLCAncHJvZmlsZXMnOmFjY291bnQucHJvZmlsZXN9ICk7XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0ZW1wKTtcclxuICAgICAgICAkc2NvcGUuZ3JvdXBzID0gdGVtcDtcclxuICAgICAgICAkc2NvcGUuYWNjX3R5cGVzID0gYWNjX3R5cGVzO1xyXG5cclxuICAgICAgICBhY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIHRydWUgKTtcclxuXHJcbiAgICAgICAgJHNjb3BlLm9wZW5GZWVkcyA9IGZ1bmN0aW9uKCBwcm9maWxlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2ZpbGUpO1xyXG4gICAgICAgICAgICBwcm9maWxlLnNvY2lhbC5yZW5kZXIoKTtcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAkc2NvcGUuZ25zID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldCgndGFicy5yYW0tbmV3Jyk7XHJcblxyXG4gICAgICAgICAgaWYoZ2V0RXhpc3RpbmdTdGF0ZSAhPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybjsgXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIHN0YXRlID0ge1xyXG4gICAgICAgICAgICAgIFwidXJsXCI6ICcvcmFtLW5ldycsXHJcbiAgICAgICAgICAgICAgXCJ2aWV3c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAnaG9tZS10YWInOiB7XHJcbiAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9yYW0uaHRtbFwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICRzdGF0ZVByb3ZpZGVyUmVmLnN0YXRlKCd0YWJzLnJhbS1uZXcnLCBzdGF0ZSk7XHJcblxyXG4gICAgICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICAgICAgICAkdXJsUm91dGVyLmxpc3RlbigpO1xyXG5cclxuICAgICAgICAgICRzdGF0ZS5nbygndGFicy5yYW0tbmV3Jyk7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhnZXRFeGlzdGluZ1N0YXRlKTtcclxuICAgICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ01hbmFnZUFjY291bnRzJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsIEVDLCAkcm9vdFNjb3BlLCAkaW9uaWNIaXN0b3J5LCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsLCAkaW9uaWNMb2FkaW5nLCBhY2NvdW50TWFuYWdlciwgJGxvY2FsU3RvcmFnZSkge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCJyk7XHJcbiAgICBjb25zb2xlLmxvZygnJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MnKTtcclxuICAgIGNvbnNvbGUubG9nKCRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzKTtcclxuICAgIC8vY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIudGVzdCgpKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ2hvbWUnKSk7XHJcblxyXG4gICAgJHNjb3BlLmFjY291bnRzID0gYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyggJHNjb3BlLmFjY291bnRzICk7XHJcblxyXG4gICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgIHZpZXdEYXRhLmhhc0hlYWRlckJhciA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLmFkZF9hY2NvdW50ID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICAgIGFjY291bnRNYW5hZ2VyLmFkZF9hY2NvdW50KHR5cGUpO1xyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuY3N0ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5hY2NvdW50cyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYWNjb3VudE1hbmFnZXIuYWNjb3VudHMoKSk7XHJcbiAgICAgICAgLy9hY2NvdW50TWFuYWdlci5zZXRfcmVuZGVyZWQoIGZhbHNlICk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ0ZlZWRzJywgZnVuY3Rpb24oJHNjb3BlLCAgJGlvbmljU2Nyb2xsRGVsZWdhdGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCBFQywgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQyEhISEhIyMjIyMnKTtcclxuICAgIC8vY29uc29sZS5sb2coJyRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzJyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyKTtcclxuICAgIC8vY29uc29sZS5sb2coJHN0YXRlLmN1cnJlbnQubmFtZSk7XHJcbiAgIFxyXG4gICAgXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlRGF0YUNhbkJlTG9hZGVkID0gZmFsc2U7XHJcbiAgICAkc2NvcGUuY291bnRlciA9IDA7XHJcblxyXG4gICAgdmFyIGluZGV4ID0gXy5maW5kTGFzdEluZGV4KCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiAkc3RhdGUuY3VycmVudC5uYW1lfSk7XHJcbiAgICAkc2NvcGUuZmVlZCA9ICRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW2luZGV4XTtcclxuICAgIFxyXG4gICAgY29uc29sZS5sb2coJHNjb3BlLmZlZWQpO1xyXG4gICAgdmFyIG5leHRfcGFnZV9pbmRleCA9IDAsXHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gMCxcclxuICAgICAgICBub19vZl9wYWdlcyA9ICRzY29wZS5mZWVkLnByb2ZpbGUuc29jaWFsLnVwZGF0ZWRfc3RyZWFtc19vcmRlci5sZW5ndGg7Ly8kcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlci5sZW5ndGg7XHJcblxyXG4gICAgaWYoIGluZGV4ID09PSAwIClcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gbm9fb2ZfcGFnZXMgLSAxO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiggaW5kZXggPT0gKG5vX29mX3BhZ2VzIC0gMSkgKVxyXG4gICAge1xyXG4gICAgICAgIG5leHRfcGFnZV9pbmRleCA9IDA7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gbm9fb2ZfcGFnZXMgLSAyO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICAgIG5leHRfcGFnZV9pbmRleCA9IGluZGV4ICsgMTtcclxuICAgICAgICBwcmV2X3BhZ2VfaW5kZXggPSBpbmRleCAtIDE7XHJcbiAgICB9XHJcblxyXG4gICAgJHNjb3BlLm5leHRfcGFnZV9pZCA9ICRzY29wZS5mZWVkLnByb2ZpbGUuc29jaWFsLnVwZGF0ZWRfc3RyZWFtc19vcmRlcltuZXh0X3BhZ2VfaW5kZXhdOy8vJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXJbbmV4dF9wYWdlX2luZGV4XS5wYWdlX2lkO1xyXG4gICAgJHNjb3BlLnByZXZfcGFnZV9pZCA9ICRzY29wZS5mZWVkLnByb2ZpbGUuc29jaWFsLnVwZGF0ZWRfc3RyZWFtc19vcmRlcltwcmV2X3BhZ2VfaW5kZXhdOy8vJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXJbcHJldl9wYWdlX2luZGV4XS5wYWdlX2lkO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGluZGV4KTtcclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLnRlc3RfbmFtZSA9IFtdO1xyXG4gICAgJHNjb3BlLnRlc3RfbmFtZS5wdXNoKHsnbmFtZSc6J1JhbSd9KTtcclxuICAgICRzY29wZS5nZXRTY3JvbGxQb3NpdGlvbiA9IGZ1bmN0aW9uKCkgeyAgICAgICBcclxuICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgJHNjb3BlLmZlZWQuZGQgPSB7ICdjb3VudCc6MCwgJ2RhdGEnOltdLCAncGxhY2Vob2xkZXInOiAnJ307XHJcbiAgICAkc2NvcGUuc2VsZWN0ZWRfZGQgPSB7fTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoKCdmZWVkLmRyb3Bkb3duX2ZlZWQnLCBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYoICRzY29wZS5mZWVkLmRyb3Bkb3duX2ZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ01NTU1NTU1NTU1NTU1NTU1NJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkLmRyb3Bkb3duX29iaik7XHJcbiAgICAgICAgICAgICRzY29wZS5mZWVkLmRkID0gJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kcm9wZG93bigpO1xyXG5cclxuICAgICAgICAgICAgaWYoICEkc2NvcGUuZmVlZC5kZC5kYXRhLmxlbmd0aCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLm1vcmVkYXRhID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZF9kZCA9ICRzY29wZS5mZWVkLmRkLmRhdGFbMF07XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoQ29sbGVjdGlvbignZmVlZC5pdGVtcycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5pdGVtcy5sZW5ndGggKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0pKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKJyk7XHJcbiAgICAgICAgICAgICRzY29wZS4kYnJvYWRjYXN0KCdzY3JvbGwuaW5maW5pdGVTY3JvbGxDb21wbGV0ZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJHdhdGNoKCdmZWVkLmxvYWRfbW9yZV9mbGFnJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoICEkc2NvcGUuZmVlZC5sb2FkX21vcmVfZmxhZyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAkc2NvcGUubW9yZWRhdGEgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgICRzY29wZS5tb3JlZGF0YSA9IGZhbHNlO1xyXG5cclxuICAgICRzY29wZS5sb2FkTW9yZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuXHJcbiAgICAgICAgaWYoICRzY29wZS5mZWVkLmRyb3Bkb3duX2ZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhICRzY29wZS5mZWVkLml0ZW1zLmxlbmd0aCAmJiAkc2NvcGUuY291bnRlciA9PSAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9sb2FkZWRfdGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5zZXRfZGVmYXVsdF9ncm91cF9pZCggJHNjb3BlLnNlbGVjdGVkX2RkICk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouZ2V0X2RhdGEoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2xvYWQgbW9yZS4uLi4uLi4uLi4uLi4uLi4uLi4uLicpO1xyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoICEgJHNjb3BlLmZlZWQuaXRlbXMubGVuZ3RoICYmICEgJHNjb3BlLmNvdW50ZXIgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5sYXN0X2xvYWRlZF90aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmdldF9kYXRhKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5tb3JlKCk7XHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAkc2NvcGUuY291bnRlcisrOyAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuICAgIFxyXG4gICAgJHNjb3BlLnByb2Nlc3NERCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRfZGQpO1xyXG4gICAgICAgICRzY29wZS5mZWVkLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICRzY29wZS5jb3VudGVyID0gMTtcclxuICAgICAgICAkc2NvcGUubG9hZE1vcmUoKTtcclxuXHJcbiAgICAgICAgLy8kc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouc2V0X2RlZmF1bHRfZ3JvdXBfaWQoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgIC8vJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kYXRhKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmVudGVyXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBkZWxlZ2F0ZSA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgnbWFpblNjcm9sbCcpO1xyXG4gICAgICAgIC8vZGVsZWdhdGUuc2Nyb2xsVG8oIDAsICRzY29wZS5mZWVkLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uICk7XHJcbiAgICAgICAgJHNjb3BlLiRwYXJlbnQuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgnZmVlZCcpKTtcclxuICAgIH0pO1xyXG5cclxuICAgICRzY29wZS4kb24oXCIkaW9uaWNWaWV3LmJlZm9yZUxlYXZlXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBwb3NpdGlvbiA9ICRpb25pY1Njcm9sbERlbGVnYXRlLiRnZXRCeUhhbmRsZSgnbWFpblNjcm9sbCcpLmdldFNjcm9sbFBvc2l0aW9uKCk7XHJcbiAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9zY3JvbGxfcG9zaXRpb24gPSBwb3NpdGlvbi50b3A7XHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuXHJcbiAgICBcclxuXHJcbiAgICAkc2NvcGUuJG9uKCckaW9uaWNWaWV3LmJlZm9yZUVudGVyJywgZnVuY3Rpb24oZXZlbnQsIHZpZXdEYXRhKSB7XHJcbiAgICAgICAgdmlld0RhdGEuZW5hYmxlQmFjayA9IHRydWU7XHJcbiAgICAgICAgdmlld0RhdGEuaGFzSGVhZGVyQmFyID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyh2aWV3RGF0YSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgYnYgPSAkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCk7XHJcblxyXG4gICAgJHNjb3BlLiRpb25pY0dvQmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLS0tLSycpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGJ2KTtcclxuXHJcbiAgICAgICAgaWYgKGJ2KSB7XHJcbiAgICAgICAgICAgICRpb25pY0hpc3RvcnkuZ29CYWNrKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCd0YWJzLmhvbWUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcblxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdQdWJsaXNoaW5nJywgZnVuY3Rpb24oJHNjb3BlLCBFQywgYWNjb3VudE1hbmFnZXIpIHtcclxuXHJcbiAgICBcclxuXHJcbiAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdwdWJsaXNoaW5nJykpO1xyXG5cclxuICAgIFxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdQb3N0U2V0dGluZ3MnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIpIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgICAgICB2aWV3RGF0YS5lbmFibGVCYWNrID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2YXIgYnYgPSAkaW9uaWNIaXN0b3J5LmJhY2tWaWV3KCk7XHJcblxyXG4gICAgICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0tLS0tLJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGJ2KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAgICAgJGlvbmljSGlzdG9yeS5nb0JhY2soKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5saXN0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KVxyXG4gICAgLmNvbnRyb2xsZXIoJ0J1dHRvbnNUYWJDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkaW9uaWNQb3B1cCwgJGlvbmljQWN0aW9uU2hlZXQsICRpb25pY01vZGFsKSB7XHJcblxyXG4gICAgICAgICRzY29wZS5zaG93UG9wdXAgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJGlvbmljUG9wdXAuYWxlcnQoe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdQb3B1cCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnVGhpcyBpcyBpb25pYyBwb3B1cCBhbGVydCEnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgJHNjb3BlLnNob3dBY3Rpb25zaGVldCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkaW9uaWNBY3Rpb25TaGVldC5zaG93KHtcclxuICAgICAgICAgICAgICAgIHRpdGxlVGV4dDogJ0lvbmljIEFjdGlvblNoZWV0JyxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0ZhY2Vib29rJ1xyXG4gICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdUd2l0dGVyJ1xyXG4gICAgICAgICAgICAgICAgfSwgXSxcclxuICAgICAgICAgICAgICAgIGRlc3RydWN0aXZlVGV4dDogJ0RlbGV0ZScsXHJcbiAgICAgICAgICAgICAgICBjYW5jZWxUZXh0OiAnQ2FuY2VsJyxcclxuICAgICAgICAgICAgICAgIGNhbmNlbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NBTkNFTExFRCcpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKGluZGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0JVVFRPTiBDTElDS0VEJywgaW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGRlc3RydWN0aXZlQnV0dG9uQ2xpY2tlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0RFU1RSVUNUJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICB9KVxyXG5cclxuLmNvbnRyb2xsZXIoJ1NsaWRlYm94Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGlvbmljU2xpZGVCb3hEZWxlZ2F0ZSkge1xyXG4gICAgJHNjb3BlLm5leHRTbGlkZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICRpb25pY1NsaWRlQm94RGVsZWdhdGUubmV4dCgpO1xyXG4gICAgfTtcclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdNZW51Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJGlvbmljU2lkZU1lbnVEZWxlZ2F0ZSwgJGlvbmljTW9kYWwpIHtcclxuXHJcblxyXG4gICAgJHNjb3BlLnVwZGF0ZVNpZGVNZW51ID0gZnVuY3Rpb24obWVudSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG1lbnUpO1xyXG4gICAgICAgICRzY29wZS5tZW51SXRlbXMgPSBtZW51O1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgICRpb25pY01vZGFsLmZyb21UZW1wbGF0ZVVybCgndGVtcGxhdGVzL21vZGFsLmh0bWwnLCBmdW5jdGlvbihtb2RhbCkge1xyXG4gICAgICAgICRzY29wZS5tb2RhbCA9IG1vZGFsO1xyXG4gICAgfSwge1xyXG4gICAgICAgIGFuaW1hdGlvbjogJ3NsaWRlLWluLXVwJ1xyXG4gICAgfSk7XHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignQXBwQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkcm9vdFNjb3BlKSB7XHJcblxyXG4gICAgJHJvb3RTY29wZS5tZW51SXRlbXMgPSBbXTtcclxuXHJcbn0pOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5kaXJlY3RpdmVzJywgW10pXHJcblxyXG4uZGlyZWN0aXZlKCdwb3NpdGlvbkJhcnNBbmRDb250ZW50JywgZnVuY3Rpb24oJHRpbWVvdXQpIHtcclxuXHJcbiByZXR1cm4ge1xyXG4gICAgXHJcbiAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgc2NvcGU6IHtcclxuICAgICAgICBkZEZlZWQ6ICc9ZGRGZWVkJ1xyXG4gICAgfSxcclxuXHJcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcclxuICAgICAgXHJcblxyXG4gICAgICBjb25zb2xlLmxvZygnS0FLQUtBS0FLS0FLQUtBSzo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICBjb25zb2xlLmxvZyhzY29wZS5kZEZlZWQpO1xyXG4gICAgICBkb1Byb2Nlc3MoKTtcclxuXHJcbiAgICAgIHNjb3BlLiR3YXRjaCgnZGRGZWVkJywgZnVuY3Rpb24obnYpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdLQUtBS0FLQUtLQUtBS0FLOjo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Jyk7XHJcbiAgICAgICAgY29uc29sZS5sb2cobnYpO1xyXG4gICAgICAgIGRvUHJvY2VzcygpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIGRvUHJvY2VzcygpXHJcbiAgICAgIHtcclxuICAgICAgICAgIHZhciBvZmZzZXRUb3AgPSAwO1xyXG4gICAgICAgICAgdmFyIHBsYXRmb3JtID0gJ2lvcyc7Ly8kY29yZG92YURldmljZS5nZXRQbGF0Zm9ybSgpO1xyXG4gICAgICAgICAgcGxhdGZvcm0gPSBwbGF0Zm9ybS50b0xvd2VyQ2FzZSgpOyAgICBcclxuXHJcblxyXG4gICAgICAgICAgLy8gR2V0IHRoZSBwYXJlbnQgbm9kZSBvZiB0aGUgaW9uLWNvbnRlbnRcclxuICAgICAgICAgIHZhciBwYXJlbnQgPSBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudFswXS5wYXJlbnROb2RlKTtcclxuXHJcbiAgICAgICAgICB2YXIgbV9oZWFkZXIgPSAgcGFyZW50WzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2Jhci1oZWFkZXInKTtcclxuXHJcbiAgICAgICAgICAvLyBHZXQgYWxsIHRoZSBoZWFkZXJzIGluIHRoaXMgcGFyZW50XHJcbiAgICAgICAgICB2YXIgc19oZWFkZXJzID0gcGFyZW50WzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2Jhci1zdWJoZWFkZXInKTtcclxuICAgICAgICAgIHZhciBpX2NvbnRlbnQgPSBwYXJlbnRbMF0uZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lvbi1jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAgaWYoIG1faGVhZGVyLmxlbmd0aCApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIG9mZnNldFRvcCA9IG1faGVhZGVyWzBdLm9mZnNldEhlaWdodCArIChwbGF0Zm9ybSA9PSAnaW9zJz8yMDowKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGFsbCB0aGUgaGVhZGVyc1xyXG4gICAgICAgICAgZm9yKHg9MDt4PHNfaGVhZGVycy5sZW5ndGg7eCsrKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCB0aGUgbWFpbiBoZWFkZXIgb3IgbmF2LWJhciwgYWRqdXN0IGl0cyBwb3NpdGlvbiB0byBiZSBiZWxvdyB0aGUgcHJldmlvdXMgaGVhZGVyXHJcbiAgICAgICAgICAgIGlmKHggPj0gMCkge1xyXG4gICAgICAgICAgICAgIHNfaGVhZGVyc1t4XS5zdHlsZS50b3AgPSBvZmZzZXRUb3AgKyAncHgnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBBZGQgdXAgdGhlIGhlaWdodHMgb2YgYWxsIHRoZSBoZWFkZXIgYmFyc1xyXG4gICAgICAgICAgICBvZmZzZXRUb3AgPSBvZmZzZXRUb3AgKyBzX2hlYWRlcnNbeF0ub2Zmc2V0SGVpZ2h0O1xyXG4gICAgICAgICAgfSAgICAgIFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBQb3NpdGlvbiB0aGUgaW9uLWNvbnRlbnQgZWxlbWVudCBkaXJlY3RseSBiZWxvdyBhbGwgdGhlIGhlYWRlcnNcclxuICAgICAgICAgIGlfY29udGVudFswXS5zdHlsZS50b3AgPSBvZmZzZXRUb3AgKyAncHgnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTsgIFxyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnaGlkZVRhYnMnLCBmdW5jdGlvbigkcm9vdFNjb3BlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdBJyxcclxuICAgICAgbGluazogZnVuY3Rpb24oJHNjb3BlLCAkZWwpIHtcclxuICAgICAgICAgICRyb290U2NvcGUuaGlkZVRhYnMgPSAndGFicy1pdGVtLWhpZGUnO1xyXG4gICAgICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzID0gJyc7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gIH07XHJcbn0pXHJcblxyXG4uZGlyZWN0aXZlKCdtYW5hZ2VBY2NvdW50JywgZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgYWNjb3VudDogJz1hY2NvdW50J1xyXG4gICAgICB9LFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXJlY3RpdmVzL21hbmFnZS1hY2NvdW50Lmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS5jdiA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIGFsZXJ0KDU1KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oIG9iaiApe1xyXG4gICAgICAgICAgICBvYmoucmVmcmVzaEFjY291bnQoKTtcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgc2NvcGUuZGVsZXRlQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH07XHJcbn0pXHJcblxyXG4uZGlyZWN0aXZlKCdtYW5hZ2VQcm9maWxlJywgZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgcHJvZmlsZTogJz1wcm9maWxlJ1xyXG4gICAgICB9LFxyXG4gICAgICB0ZW1wbGF0ZVVybDogJ3RlbXBsYXRlcy9kaXJlY3RpdmVzL21hbmFnZS1wcm9maWxlLmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS52YWxpZGF0ZUNoZWNrID0gZnVuY3Rpb24ob2JqKXtcclxuICAgICAgICAgICAgLy9vYmoubmV3X2tleSA9ICdmcm9tIGRpcmVjdGl2ZSc7XHJcbiAgICAgICAgICAgIC8vYWxlcnQob2JqLmdldFVzZXJOYW1lKCkpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhvYmopO1xyXG4gICAgICAgICAgICBvYmoudXBkYXRlX21vbml0b3Iob2JqLnByb2ZpbGVfY2hlY2tlZCk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgIH1cclxuICAgIH07XHJcbn0pXHJcblxyXG4uZGlyZWN0aXZlKCdtYW5hZ2VUZXN0JywgZnVuY3Rpb24oJGNvbXBpbGUpe1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgc2NvcGU6IHtcclxuICAgICAgICBpdGVtOiAnPWl0ZW0nXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtcHJvZmlsZS5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgdmFyIHRlbXBsYXRlID0gJzxwPk1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTTwvcD4nO1xyXG5cclxuICAgICAgICAgIHRlbXBsYXRlID0gJCh0ZW1wbGF0ZSk7IFxyXG4gICAgICAgICAgLy90ZW1wbGF0ZS5maW5kKCcudGVzdCcpLmFwcGVuZChzY29wZS5kYXRhLml0ZW1UZXN0KTsgICAgICAgICAgICAgXHJcbiAgICAgICAgICBlbGVtZW50LmFwcGVuZCggJGNvbXBpbGUodGVtcGxhdGUpKHNjb3BlKSApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KTtcclxuIiwiXHJcbm1vZHVsZS5leHBvcnRzID0gWyckc3RhdGVQcm92aWRlcicsICckdXJsUm91dGVyUHJvdmlkZXInLCckaW9uaWNDb25maWdQcm92aWRlcicsIFxyXG5cdGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyLCAkaW9uaWNDb25maWdQcm92aWRlcikge1xyXG5cclxuXHRcdCAgJHN0YXRlUHJvdmlkZXJcclxuXHRcdCAgICAgIC5zdGF0ZSgnbG9naW4nLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvbG9naW5cIixcclxuXHRcdCAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2xvZ2luLmh0bWxcIixcclxuXHRcdCAgICAgICAgY29udHJvbGxlcjogXCJMb2dpbkN0cmxcIlxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicycsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9tZW51XCIsXHJcblx0XHQgICAgICAgIGFic3RyYWN0OiB0cnVlLFxyXG5cdFx0ICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvbWVudS5odG1sXCIsXHJcblx0XHQgICAgICAgIGNvbnRyb2xsZXI6ICdNZW51Q3RybCdcclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICBcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5ob21lJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2hvbWVcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnaG9tZS10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaG9tZS5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnSG9tZVRhYkN0cmwnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLm1hbmFnZV9hY2NvdW50cycsIHtcclxuXHRcdCAgICAgIFx0dXJsOiBcIi9tYW5hZ2VfYWNjb3VudHNcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnaG9tZS10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvbWFuYWdlX2FjY291bnRzLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdNYW5hZ2VBY2NvdW50cydcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMucHVibGlzaGluZycsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9wdWJsaXNoaW5nXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ3B1Ymxpc2hpbmctdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3B1Ymxpc2guaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ1B1Ymxpc2hpbmcnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLnBvc3Rfc2V0dGluZ3MnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvcG9zdF9zZXR0aW5nc1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdwdWJsaXNoaW5nLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9wb3N0X3NldHRpbmdzLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQb3N0U2V0dGluZ3MnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmluYm94Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2luYm94XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2luYm94LXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9pbmJveC5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuZmVlZHMnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvZmVlZHNcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnZmVlZHMtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2ZlZWRzLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIFxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLml0ZW0nLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvaXRlbVwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdsaXN0LXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9pdGVtLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5mb3JtJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2Zvcm1cIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnZm9ybS10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvZm9ybS5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ21lbnUua2V5Ym9hcmQnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIva2V5Ym9hcmRcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMva2V5Ym9hcmQuaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLyouc3RhdGUoJ21lbnUubG9naW4nLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvbG9naW5cIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvbG9naW4uaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KSovXHJcblx0XHQgICAgICAuc3RhdGUoJ21lbnUuc2xpZGVib3gnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvc2xpZGVib3hcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvc2xpZGVib3guaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ1NsaWRlYm94Q3RybCdcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ21lbnUuYWJvdXQnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvYWJvdXRcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbWVudUNvbnRlbnQnOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvYWJvdXQuaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KTtcclxuXHJcblx0XHQgICAgLy8kdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwibWVudS90YWIvYnV0dG9uc1wiKTtcclxuXHRcdCAgICAvKmlmKCAkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YSApXHJcblx0XHQgICAge1xyXG5cdFx0ICAgIFx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcIi9ob21lXCIpO1xyXG5cdFx0ICAgIH1cclxuXHRcdCAgICBlbHNlXHJcblx0XHQgICAge1xyXG5cdFx0ICAgIFx0JHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcImxvZ2luXCIpO1xyXG5cdFx0ICAgIH0qL1xyXG5cdFx0ICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJsb2dpblwiKTtcclxuXHJcblxyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnRhYnMucG9zaXRpb24oXCJib3R0b21cIik7IC8vUGxhY2VzIHRoZW0gYXQgdGhlIGJvdHRvbSBmb3IgYWxsIE9TXHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIubmF2QmFyLmFsaWduVGl0bGUoXCJjZW50ZXJcIik7XHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudGFicy5zdHlsZShcInN0YW5kYXJkXCIpO1xyXG5cclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci52aWV3cy5tYXhDYWNoZSgwKTtcclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci52aWV3cy50cmFuc2l0aW9uKCdub25lJyk7XHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MuZm9yd2FyZENhY2hlKHRydWUpO1xyXG5cdFx0ICAgIFxyXG5cdFx0ICAgICRzdGF0ZVByb3ZpZGVyUmVmID0gJHN0YXRlUHJvdmlkZXI7XHJcbiAgICAgIFx0XHQkdXJsUm91dGVyUHJvdmlkZXJSZWYgPSAkdXJsUm91dGVyUHJvdmlkZXI7XHJcblx0XHR9XHJcbl07IiwiLypcclxuXHRBY2NvdW50IE1hbmFnZXIgU2VydmljZXNcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5zZXJ2aWNlcy5hY2NvdW50TWFuYWdlcicsIFtdKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdhY2NvdW50TWFuYWdlcicsIHJlcXVpcmUoJy4vYXBwL2FjY291bnQvYWNjb3VudC1tYW5hZ2VyJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0FjY291bnQnLCByZXF1aXJlKCcuL2FwcC9hY2NvdW50L2FjY291bnQnKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1Byb2ZpbGUnLCByZXF1aXJlKCcuL2FwcC9hY2NvdW50L3Byb2ZpbGUnKSk7IiwiLypcclxuXHRTb2NpYWwgTWFuYWdlciBTZXJ2aWNlc1xyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhbmd1bGFyLm1vZHVsZSgnZWNsaW5jaGVyLnNlcnZpY2VzLnNvY2lhbE1hbmFnZXInLCBbXSlcclxuXHJcblx0XHQuZmFjdG9yeSgnc29jaWFsTWFuYWdlcicsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC1tYW5hZ2VyJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0ZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZmVlZCcpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1RpbWVsaW5lRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvdGltZWxpbmVGZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnTGlua2VkaW5GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdEcm9wZG93bkZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2Ryb3Bkb3duRmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnTGlua2VkaW5GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdJbnN0YWdyYW1GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9pbnN0YWdyYW1GZWVkSXRlbScpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdDb2xsYXBzaWJsZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2NvbGxhcHNpYmxlRmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvdHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0ZhY2Vib29rRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9mYWNlYm9va0ZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnTGlua2VkaW5GZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2xpbmtlZGluRmVlZCcpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdUd2l0dGVyRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC90d2l0dGVyRmVlZCcpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdCbG9nZ2VyRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9ibG9nZ2VyRmVlZCcpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdHb29nbGVQbHVzRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9nb29nbGVwbHVzRmVlZCcpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdQaW50ZXJlc3RGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3BpbnRlcmVzdEZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnWW91VHViZUZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwveW91VHViZUZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnSW5zdGFncmFtRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9pbnN0YWdyYW1GZWVkJykpXHJcblxyXG5cdFx0LmRpcmVjdGl2ZSgnZmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy9mZWVkSXRlbScpKVxyXG5cclxuXHRcdC5kaXJlY3RpdmUoJ3RpbWVsaW5lRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy90aW1lbGluZUZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmRpcmVjdGl2ZSgnbGlua2VkaW5GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9kaXJlY3RpdmVzL2xpbmtlZGluRmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZGlyZWN0aXZlKCdpbnN0YWdyYW1GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9kaXJlY3RpdmVzL2luc3RhZ3JhbUZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmRpcmVjdGl2ZSgnY29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9kaXJlY3RpdmVzL2NvbGxhcHNpYmxlRmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZGlyZWN0aXZlKCdsaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy9saW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZGlyZWN0aXZlKCd0d2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9kaXJlY3RpdmVzL3R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtJykpOyIsIm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5zZXJ2aWNlcycsIFtdKVxyXG5cclxuLmZhY3RvcnkoJ0VDJywgcmVxdWlyZSgnLi9hcHAvZWMtdXRpbGl0eScpKVxyXG5cclxuLy9zZXJ2aWNlIGZvciBhdXRoZW50aWNhdGlvblxyXG4uc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbigkcSwgJGh0dHAsIGFwaVVybCwgRUMpIHtcclxuXHJcbiAgICB2YXIgaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgIHZhciBMT0NBTF9UT0tFTl9LRVkgPSAndXNlcl9jcmVkZW50aWFscyc7XHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGxvYWRVc2VyQ3JlZGVudGlhbHMoKSB7XHJcbiAgICAgICAgdmFyIHVjID0gd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKExPQ0FMX1RPS0VOX0tFWSk7XHJcbiAgICAgICAgaWYgKHVjKSB7XHJcbiAgICAgICAgICAgIHVzZUNyZWRlbnRpYWxzKHVjKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZVVzZXJDcmVkZW50aWFscyh1Yykge1xyXG4gICAgICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTF9UT0tFTl9LRVksIHVjKTtcclxuICAgICAgICB1c2VDcmVkZW50aWFscyh1Yyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXNlQ3JlZGVudGlhbHModWMpIHtcclxuICAgICAgICBpc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHVjKTtcclxuXHJcblxyXG4gICAgICAgIC8vIFNldCB0aGUgdWMgYXMgaGVhZGVyIGZvciB5b3VyIHJlcXVlc3RzIVxyXG4gICAgICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLnVpZCA9IHVjLnVpZDtcclxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5hdXRob3JpemF0aW9uVG9rZW4gPSB1Yy5hdXRob3JpemF0aW9uVG9rZW47XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVzdHJveVVzZXJDcmVkZW50aWFscygpIHtcclxuICAgICAgICBpc0F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcclxuICAgICAgICAvLyRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLnVpZCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAvLyRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uLmF1dGhvcml6YXRpb25Ub2tlbiA9IHVuZGVmaW5lZDtcclxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oTE9DQUxfVE9LRU5fS0VZKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbG9naW4gPSBmdW5jdGlvbihuYW1lLCBwYXNzd29yZCwgY2FsbGJhY2spIHtcclxuXHJcbiAgICAgICAgdmFyIHJlcSA9IHtcclxuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHVybDogYXBpVXJsICsgJ3VzZXIvbG9naW4nLFxyXG4gICAgICAgICAgICBkYXRhOntcclxuICAgICAgICAgICAgICAgICAgICAnZW1haWwnOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICdwYXNzd29yZCc6IHBhc3N3b3JkXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QocmVxKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCcyMjIyJyk7XHJcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdZWVlZWVlZWVknKTtcclxuICAgICAgICAgICAgICAgIC8vJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAvLyRpb25pY0hpc3RvcnkuY3VycmVudFZpZXcoJGlvbmljSGlzdG9yeS5iYWNrVmlldygpKTsvLyRpb25pY0hpc3RvcnkuY3VycmVudFZpZXcobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAvLyRzdGF0ZS5nbygnYXBwLnNhZmV0eUxlc3NvbnMnKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZnVuY3Rpb24oZXJyX21zZykge1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnWlpaWlpaWlpaJyk7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygnMzMzMycpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBsb2dvdXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBkZXN0cm95VXNlckNyZWRlbnRpYWxzKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGxvYWRVc2VyQ3JlZGVudGlhbHMoKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGxvZ2luOiBsb2dpbixcclxuICAgICAgICBsb2dvdXQ6IGxvZ291dCxcclxuICAgICAgICBpc0F1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gaXNBdXRoZW50aWNhdGVkO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuLmZhY3RvcnkoJ1VzZXJTZXR0aW5ncycsIHJlcXVpcmUoJy4vYXBwL3NldHRpbmdzLW1hbmFnZXInKSkgXHJcbiBcclxuIFxyXG5cclxuLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoe1xyXG4gICAgICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkXHJcbiAgICAgICAgICAgIH1bcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSlcclxuXHJcbi5jb25maWcoZnVuY3Rpb24oJGh0dHBQcm92aWRlcikge1xyXG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaCgnQXV0aEludGVyY2VwdG9yJyk7XHJcbn0pO1xyXG4iXX0=
