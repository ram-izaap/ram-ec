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

          
          //likes , comments
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3d3cvanMvYXBwLW1haW4uanMiLCJ3d3cvanMvYXBwLmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L2FjY291bnQtbWFuYWdlci5qcyIsInd3dy9qcy9hcHAvYWNjb3VudC9hY2NvdW50LmpzIiwid3d3L2pzL2FwcC9hY2NvdW50L3Byb2ZpbGUuanMiLCJ3d3cvanMvYXBwL2VjLXV0aWxpdHkuanMiLCJ3d3cvanMvYXBwL3NldHRpbmdzLW1hbmFnZXIuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC1tYW5hZ2VyLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9ibG9nZ2VyRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2NvbGxhcHNpYmxlRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9kaXJlY3RpdmVzL2NvbGxhcHNpYmxlRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9kaXJlY3RpdmVzL2ZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy90aW1lbGluZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvZHJvcGRvd25GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZhY2Vib29rRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2ZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9nb29nbGVwbHVzRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2luc3RhZ3JhbUZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9pbnN0YWdyYW1GZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluRmVlZC5qcyIsInd3dy9qcy9hcHAvc29jaWFsL2xpbmtlZGluRmVlZEl0ZW0uanMiLCJ3d3cvanMvYXBwL3NvY2lhbC9waW50ZXJlc3RGZWVkLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvdGltZWxpbmVGZWVkSXRlbS5qcyIsInd3dy9qcy9hcHAvc29jaWFsL3R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtLmpzIiwid3d3L2pzL2FwcC9zb2NpYWwvdHdpdHRlckZlZWQuanMiLCJ3d3cvanMvYXBwL3NvY2lhbC95b3VUdWJlRmVlZC5qcyIsInd3dy9qcy9jb25zdGFudHMuanMiLCJ3d3cvanMvY29udHJvbGxlcnMuanMiLCJ3d3cvanMvZGlyZWN0aXZlcy5qcyIsInd3dy9qcy9yb3V0ZXIuanMiLCJ3d3cvanMvc2VydmljZS1hY2NvdW50LW1hbmFnZXIuanMiLCJ3d3cvanMvc2VydmljZS1zb2NpYWwtbWFuYWdlci5qcyIsInd3dy9qcy9zZXJ2aWNlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3h3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGpDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6dUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvT0E7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcdGZ1bmN0aW9uIEFwcE1haW4oJGlvbmljUGxhdGZvcm0sICRyb290U2NvcGUsICRzY29wZSkgXHJcblx0e1xyXG5cdCAgJGlvbmljUGxhdGZvcm0ucmVhZHkoZnVuY3Rpb24oKSB7XHJcblx0ICAgIC8vIEhpZGUgdGhlIGFjY2Vzc29yeSBiYXIgYnkgZGVmYXVsdCAocmVtb3ZlIHRoaXMgdG8gc2hvdyB0aGUgYWNjZXNzb3J5IGJhciBhYm92ZSB0aGUga2V5Ym9hcmRcclxuXHQgICAgLy8gZm9yIGZvcm0gaW5wdXRzKVxyXG5cdCAgICBpZiAod2luZG93LmNvcmRvdmEgJiYgd2luZG93LmNvcmRvdmEucGx1Z2lucyAmJiB3aW5kb3cuY29yZG92YS5wbHVnaW5zLktleWJvYXJkKSB7XHJcblx0ICAgICAgY29yZG92YS5wbHVnaW5zLktleWJvYXJkLmhpZGVLZXlib2FyZEFjY2Vzc29yeUJhcih0cnVlKTtcclxuXHQgICAgfVxyXG5cdCAgICBpZiAod2luZG93LlN0YXR1c0Jhcikge1xyXG5cdCAgICAgIC8vIG9yZy5hcGFjaGUuY29yZG92YS5zdGF0dXNiYXIgcmVxdWlyZWRcclxuXHQgICAgICAvL1N0YXR1c0Jhci5zdHlsZUxpZ2h0Q29udGVudCgpO1xyXG5cdCAgICB9XHJcbiAgXHQgIH0pO1xyXG5cclxuXHQgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50KXtcclxuXHQgIFx0JHJvb3RTY29wZS5jdXJyZW50U2NvcGUgPSAkc2NvcGU7XHJcblx0ICB9KTtcclxuXHJcbiAgXHQgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcywgZXJyb3IpIHtcclxuXHQgICBpZiAodG9TdGF0ZS5uYW1lID09ICd0YWJzLm1hbmFnZV9hY2NvdW50cycpIHtcclxuXHQgICAgICRyb290U2NvcGUuaGlkZVRhYnM9dHJ1ZTtcclxuXHQgICB9IGVsc2Uge1xyXG5cdCAgICAgJHJvb3RTY29wZS5oaWRlVGFicz1mYWxzZTtcclxuXHQgICB9XHJcblx0ICB9KTtcclxuICBcdH1cclxuXHJcbiAgXHRtb2R1bGUuZXhwb3J0cyA9IFsnJGlvbmljUGxhdGZvcm0nLCAnJHJvb3RTY29wZScsIEFwcE1haW5dOyIsInJlcXVpcmUoJy4vY29uc3RhbnRzJyk7XG5yZXF1aXJlKCcuL2NvbnRyb2xsZXJzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2UtYWNjb3VudC1tYW5hZ2VyJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2Utc29jaWFsLW1hbmFnZXInKTtcbnJlcXVpcmUoJy4vZGlyZWN0aXZlcycpO1xuXG52YXIgJHN0YXRlUHJvdmlkZXJSZWYgPSBudWxsO1xudmFyICR1cmxSb3V0ZXJQcm92aWRlclJlZiA9IG51bGw7XG5cbmFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXInLCBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaW9uaWMnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuY29uc3RhbnRzJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLmNvbnRyb2xsZXJzJywgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZWNsaW5jaGVyLnNlcnZpY2VzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuc2VydmljZXMuYWNjb3VudE1hbmFnZXInLCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdlY2xpbmNoZXIuc2VydmljZXMuc29jaWFsTWFuYWdlcicsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2VjbGluY2hlci5kaXJlY3RpdmVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduZ1N0b3JhZ2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3VpLnJvdXRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbmdDb3Jkb3ZhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd1bmRlcnNjb3JlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSlcblxuLmNvbmZpZyhyZXF1aXJlKCcuL3JvdXRlcicpKVxuXG4ucnVuKHJlcXVpcmUoJy4vYXBwLW1haW4nKSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAiLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdBY2NvdW50JywgJ1VzZXJTZXR0aW5ncycsICckY29yZG92YUluQXBwQnJvd3NlcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEFjY291bnQsIFVzZXJTZXR0aW5ncywgJGNvcmRvdmFJbkFwcEJyb3dzZXIgKXsgIFxyXG5cclxuICAgIHZhciBpbml0aWFsaXplZCA9IGZhbHNlLFxyXG4gICAgICAgIGRhdGEgPSB7fSxcclxuICAgICAgICBhY2NvdW50cyA9IFtdLFxyXG4gICAgICAgIGFjY291bnRzX29yZGVyID0gW10sXHJcbiAgICAgICAgYWNjb3VudHNfYnlfaWQgPSB7fSxcclxuICAgICAgICBmYXZvcml0ZXNfYWNjb3VudCxcclxuICAgICAgICBzZWFyY2hfYWNjb3VudCxcclxuICAgICAgICByc3NfYWNjb3VudCxcclxuICAgICAgICBvdXRyZWFjaF9hY2NvdW50LFxyXG4gICAgICAgIGNpbmJveF9hY2NvdW50LFxyXG4gICAgICAgIGxhc3RfYWRkZWRfcHJvZmlsZSxcclxuICAgICAgICByZWZyZXNoX29uX2Nsb3NlID0gZmFsc2UsXHJcbiAgICAgICAgdGVtcGxhdGVfc2VsZWN0b3IgPSAnI2FjY291bnQtbWFuYWdlci10ZW1wbGF0ZSc7XHJcblxyXG4gICAgICAgIG1vZHVsZS5yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5nb19iYWNrX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZCA9IGZhbHNlO1xyXG4gICAgICAgIG1vZHVsZS5zZWFyY2hfcmVuZGVyZWQgPSBmYWxzZTtcclxuICAgICAgICBtb2R1bGUucnNzX3JlbmRlcmVkID0gZmFsc2U7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnYWNjb3VudE1hbmFnZXIgaW5pdCcpO1xyXG5cclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygkaHR0cCk7XHJcbiAgICAgICAgLy9yZXR1cm4gdGVtcGxhdGVfc2VsZWN0b3I7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9nZXQgYWNjb3VudHMgYW5kIHN0b3JlIGl0XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogICdhY2NvdW50L2FjY291bnRzJyxcclxuICAgICAgICAgICAgZGF0YTp7J25hbWUnOidyYW0nfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihzdG9yZV9hY2NvdW50cywgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc3RvcmVfYWNjb3VudHMgKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncmVzcG9uc2U6OjonKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhVc2VyU2V0dGluZ3MpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZSB8fCBbXSxcclxuICAgICAgICAgICAgICAgIGl0ZW1zID0gZGF0YS5hY2NvdW50IHx8IFtdLFxyXG4gICAgICAgICAgICAgICAgZmF2X2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3JjaF9sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJzc19sb2FkZWQgPSBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG91dHJlYWNoX2xvYWRlZCA9IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgYWNjX29yZGVyID0gZGF0YS5hY2NvdW50X29yZGVyIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgaWYoIGRhdGEuc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5oYW5kbGVfc2V0dGluZ3MoIGRhdGEuc2V0dGluZ3MsIHVuZGVmaW5lZCwgdHJ1ZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBVc2VyU2V0dGluZ3MuYW5hbHl0aWNzX2dyb3VwcyA9IFtdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoIGRhdGEuYW5hbHl0aWNzR3JvdXBzICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgIFVzZXJTZXR0aW5ncy5hbmFseXRpY3NfZ3JvdXBzID0gZGF0YS5hbmFseXRpY3NHcm91cHMuYW5hbHl0aWNzR3JvdXA7XHJcbiAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgaWYgKCAhIEFycmF5LmlzQXJyYXkoIGl0ZW1zICkgKSBpdGVtcyA9IFsgaXRlbXMgXTtcclxuXHJcbiAgICAgICAgICAgIGFjY291bnRzID0gW107XHJcbiAgICAgICAgICAgIGFjY291bnRzX2J5X2lkID0ge307XHJcbiAgICAgICAgICAgIGFjY291bnRzX29yZGVyID0gYWNjX29yZGVyO1xyXG5cclxuICAgICAgICAgICAgLy9DcmVhdGUgYWNjb3VudC1vYmplY3QgZm9yIGVhY2ggYWNjb3VudHMgYW5kIHN0b3JlIGJ5IGlkIC5cclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gaXRlbXMubGVuZ3RoOyBpIDwgcDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBuZXdfYWNjb3VudCA9IG5ldyBBY2NvdW50KCBpdGVtc1sgaSBdICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBhY2NvdW50cy5wdXNoKCBuZXdfYWNjb3VudCApOyAvLyBpdGVyYWJsZVxyXG5cclxuICAgICAgICAgICAgICAgIGFjY291bnRzX2J5X2lkWyBuZXdfYWNjb3VudC5pZCBdID0gYWNjb3VudHNbIGxlbmd0aCAtIDEgXTsgLy8gaW5kZXhlZCBieSBhY2NvdW50IElELCByZWZlcmVuY2VzIGFjY291bnQgYnkgaW5kZXhcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2FjY291bnRzOjo6Jyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGFjY291bnRzKTtcclxuICAgICAgICAgICAgLy9pZiBjYWxsYmFjayBpcyB2YWxpZCBmdW5jdGlvbiwgdGhlbiBjYWxsIGl0XHJcbiAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgXHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnJlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9yZW5kZXJlZCA9IGZ1bmN0aW9uKCBmbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLnJlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19mYXZvcml0ZV9yZW5kZXJlZCA9IGZ1bmN0aW9uKCkgXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfZmF2b3JpdGVfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5mYXZvcml0ZV9yZW5kZXJlZCA9IGZsYWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfc2VhcmNoX3JlbmRlcmVkID0gZnVuY3Rpb24oKSBcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbW9kdWxlLnNlYXJjaF9yZW5kZXJlZDtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRfc2VhcmNoX3JlbmRlcmVkID0gZnVuY3Rpb24oIGZsYWcgKSBcclxuICAgIHtcclxuICAgICAgICBtb2R1bGUuc2VhcmNoX3JlbmRlcmVkID0gZmxhZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc19yc3NfcmVuZGVyZWQgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUucnNzX3JlbmRlcmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9yc3NfcmVuZGVyZWQgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5yc3NfcmVuZGVyZWQgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldF9nb19iYWNrX2ZsYWcgPSBmdW5jdGlvbigpIFxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGUuZ29fYmFja19mbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldF9nb19iYWNrX2ZsYWcgPSBmdW5jdGlvbiggZmxhZyApIFxyXG4gICAge1xyXG4gICAgICAgIG1vZHVsZS5nb19iYWNrX2ZsYWcgPSBmbGFnO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5maW5kID0gZnVuY3Rpb24gKCBhY2NvdW50X2lkIClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYWNjb3VudHNfYnlfaWRbIGFjY291bnRfaWQgXTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRfcHJvZmlsZSA9IGZ1bmN0aW9uICggcHJvZmlsZV9pZCApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdmYXZvcml0ZXMnKSByZXR1cm4gKCBmYXZvcml0ZXNfYWNjb3VudCAhPT0gdW5kZWZpbmVkID8gZmF2b3JpdGVzX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnc2VhcmNoJykgcmV0dXJuICggc2VhcmNoX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IHNlYXJjaF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBpZiAoIHByb2ZpbGVfaWQgPT0gJ3JzcycpIHJldHVybiAoIHJzc19hY2NvdW50ICE9PSB1bmRlZmluZWQgPyByc3NfYWNjb3VudC5wcm9maWxlc1sgMCBdIDogZmFsc2UgKTtcclxuXHJcbiAgICAgICAgaWYgKCBwcm9maWxlX2lkID09ICdvdXRyZWFjaCcpIHJldHVybiAoIG91dHJlYWNoX2FjY291bnQgIT09IHVuZGVmaW5lZCA/IG91dHJlYWNoX2FjY291bnQucHJvZmlsZXNbIDAgXSA6IGZhbHNlICk7XHJcblxyXG4gICAgICAgIGlmICggcHJvZmlsZV9pZCA9PSAnY2luYm94JykgcmV0dXJuICggY2luYm94X2FjY291bnQgIT09IHVuZGVmaW5lZCA/IGNpbmJveF9hY2NvdW50LnByb2ZpbGVzWyAwIF0gOiBmYWxzZSApO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGEgPSBhY2NvdW50cy5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBwID0gYWNjb3VudHNbIGkgXS5wcm9maWxlcy5sZW5ndGg7IGogPCBwOyBqKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19wcm9maWxlID0gYWNjb3VudHNbIGkgXS5wcm9maWxlc1sgaiBdO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfcHJvZmlsZS5pZCA9PSBwcm9maWxlX2lkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc19wcm9maWxlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFjY291bnRzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApIFxyXG4gICAgeyBcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggYWNjb3VudHMgKTtcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gYWNjb3VudHM7IFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmxpc3RfYWNjb3VudHMgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGVtcCA9IFtdLFxyXG4gICAgICAgICAgICBpID0gMCxcclxuICAgICAgICAgICAgYSA9IDA7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGFjY291bnRzX29yZGVyLmxlbmd0aCA+IDAgKXtcclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGEgPSBhY2NvdW50c19vcmRlci5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBqID0gMCwgYWMgPSBhY2NvdW50cy5sZW5ndGg7IGogPCBhYzsgaisrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZihhY2NvdW50c19vcmRlcltpXSA9PSBhY2NvdW50c1sgaiBdLnR5cGUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggYWNjb3VudHNbIGogXS5oYXNfdW5leHBpcmVkX3Byb2ZpbGVzKCkgKSB0ZW1wLnB1c2goIGFjY291bnRzWyBqIF0gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggaSA9IDAsIGEgPSBhY2NvdW50cy5sZW5ndGg7IGkgPCBhOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGFjY291bnRzWyBpIF0uaGFzX3VuZXhwaXJlZF9wcm9maWxlcygpICkgdGVtcC5wdXNoKCBhY2NvdW50c1sgaSBdICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRlbXAuc29ydChmdW5jdGlvbiAoIGEsIGIgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGEgPCBiICkgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggYSA+IGIgKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggdGVtcCApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgcmV0dXJuIHRlbXA7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWRkX2FjY291bnQgPSBmdW5jdGlvbiggdHlwZSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEpO1xyXG4gICAgICAgIHZhciBjdXN0b21faGVhZGVycyA9ICRsb2NhbFN0b3JhZ2UudXNlcl9kYXRhIHx8IHt9LFxyXG4gICAgICAgICAgICBwYXRoID0gJ2FjY291bnQvYWNjb3VudD90eXBlPScgK3R5cGUrICcmbGY9ZmFsc2UnO1xyXG5cclxuICAgICAgICBjdXN0b21faGVhZGVycyA9IEpTT04ucGFyc2UoIGN1c3RvbV9oZWFkZXJzICk7XHJcblxyXG4gICAgICAgIHZhciBja2V5ID0gKGN1c3RvbV9oZWFkZXJzLmNsaWVudF9rZXkgIT09IHVuZGVmaW5lZCkgPyBKU09OLnN0cmluZ2lmeShjdXN0b21faGVhZGVycy5jbGllbnRfa2V5KTogJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcGF0aCArPSAnJnVzZXJfbmFtZT0nK2N1c3RvbV9oZWFkZXJzLnVzZXJfbmFtZSsnJnVzZXJfcGFzcz0nK2N1c3RvbV9oZWFkZXJzLnVzZXJfcGFzcysnJmNsaWVudF9rZXk9Jytja2V5KycmZGV2aWNlPWlvcyc7XHJcbiAgICAgICAgLy9hbGVydChlbmNvZGVVUkkoYXBpVXJsK3BhdGgpKTtcclxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgICAgIGxvY2F0aW9uOiAneWVzJyxcclxuICAgICAgICAgIGNsZWFyY2FjaGU6ICd5ZXMnLFxyXG4gICAgICAgICAgY2xlYXJzZXNzaW9uY2FjaGU6ICd5ZXMnLFxyXG4gICAgICAgICAgdG9vbGJhcnBvc2l0aW9uOiAndG9wJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgICRjb3Jkb3ZhSW5BcHBCcm93c2VyLm9wZW4oIGVuY29kZVVSSShFQy5nZXRBcGlVcmwoKStwYXRoKSwgJ19ibGFuaycsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAkcm9vdFNjb3BlLiRvbignJGNvcmRvdmFJbkFwcEJyb3dzZXI6ZXhpdCcsIGZ1bmN0aW9uKGUsIGV2ZW50KXtcclxuICAgICAgICAgICAgYWNjb3VudE1hbmFnZXIuc2V0X3JlbmRlcmVkKCBmYWxzZSApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWydFQycsICdQcm9maWxlJywgZnVuY3Rpb24oRUMsIFByb2ZpbGUpe1xyXG5cclxuICAgIGZ1bmN0aW9uIEFjY291bnQgKCBhY2NvdW50X2RhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5pZCA9IGFjY291bnRfZGF0YS5hY2NvdW50SWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy50eXBlID0gYWNjb3VudF9kYXRhLnR5cGU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5jYW5fcG9zdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMudHlwZSA9PSAnRmFjZWJvb2snIHx8IHRoaXMudHlwZSA9PSAnTGlua2VkaW4nIHx8IHRoaXMudHlwZSA9PSAnVHdpdHRlcicgfHwgdGhpcy50eXBlID09ICdCbG9nZ2VyJyB8fCB0aGlzLnR5cGUgPT0gJ1BpbnRlcmVzdCcgKSB0aGlzLmNhbl9wb3N0ID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnR29vZ2xlUGx1cycpIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy50eXBlID09ICdQaW50ZXJlc3QnICYmIGFjY291bnRfZGF0YS5lbWFpbCAhPT0gdW5kZWZpbmVkICYmIGFjY291bnRfZGF0YS5wYXNzd29yZCAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBhY2NvdW50X2RhdGEucGFzc3dvcmQgKSApIHRoaXMuY2FuX3Bvc3QgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMudHlwZSA9PSAnTGlua2VkaW4nKSB0aGlzLmNoYXJhY3Rlcl9saW1pdCA9IDcwMDtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMudHlwZSA9PSAnVHdpdHRlcicpIHRoaXMuY2hhcmFjdGVyX2xpbWl0ID0gMTQwO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEgPSBhY2NvdW50X2RhdGEgfHwge307XHJcblxyXG4gICAgICAgIHRoaXMucHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29uZmlnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIHRoaXMuZGF0YS5jb25maWcgKSApIHRoaXMucHJvZmlsZXMucHVzaCggbmV3IFByb2ZpbGUoIHRoaXMuZGF0YS5jb25maWcsIHRoaXMgKSApO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5jb25maWcuZm9yRWFjaChmdW5jdGlvbiAoIGl0ZW0gKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfcHJvZmlsZSA9IG5ldyBQcm9maWxlKCBpdGVtLCBzZWxmICk7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnByb2ZpbGVzLnB1c2goIG5ld19wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZXhwaXJlZCA9ICggYWNjb3VudF9kYXRhLm1vbml0b3JlZCA9PSAnZXhwaXJlZCcgPyB0cnVlIDogZmFsc2UgKTtcclxuICAgICAgICAvLyB0aGlzLmV4cGlyZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS5oYXNfbW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIHRoaXMubW9uaXRvcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuaGFzX2V2ZW50c19tb25pdG9yZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5ldmVudHNfbW9uaXRvcmVkX3Byb2ZpbGVzKCkubGVuZ3RoID4gMCApIHJldHVybiB0cnVlO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIEFjY291bnQucHJvdG90eXBlLmhhc191bmV4cGlyZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy51bmV4cGlyZWRfcHJvZmlsZXMoKS5sZW5ndGggPiAwICkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUubW9uaXRvcmVkX3Byb2ZpbGVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcHJvZmlsZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBwID0gdGhpcy5wcm9maWxlcy5sZW5ndGg7IGkgPCBwOyBpKysgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlc1sgaSBdLm1vbml0b3JlZCA9PSAnb24nKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUuZXZlbnRzX21vbml0b3JlZF9wcm9maWxlcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHByb2ZpbGVzID0gW107XHJcblxyXG4gICAgICAgIGZvciAoIHZhciBpID0gMCwgcCA9IHRoaXMucHJvZmlsZXMubGVuZ3RoOyBpIDwgcDsgaSsrICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZXNbIGkgXS5ldmVudHNNb25pdG9yZWQgPT0gJ29uJykgcHJvZmlsZXMucHVzaCggdGhpcy5wcm9maWxlc1sgaSBdICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcHJvZmlsZXM7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS51bmV4cGlyZWRfcHJvZmlsZXMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwcm9maWxlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIHAgPSB0aGlzLnByb2ZpbGVzLmxlbmd0aDsgaSA8IHA7IGkrKyApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGVzWyBpIF0ubW9uaXRvcmVkICE9ICdvZmYnKSBwcm9maWxlcy5wdXNoKCB0aGlzLnByb2ZpbGVzWyBpIF0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwcm9maWxlcztcclxuICAgIH07XHJcblxyXG4gICAgQWNjb3VudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiAnW29iamVjdCAnICt0aGlzLnR5cGUrICcgQWNjb3VudF0nO1xyXG4gICAgfTtcclxuXHJcbiAgICBBY2NvdW50LnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBzd2l0Y2ggKCB0aGlzLnR5cGUudG9Mb3dlckNhc2UoKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd0d2l0dGVyJzogcmV0dXJuIDI7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dvb2dsZWFuYWx5dGljcyc6IHJldHVybiAzO1xyXG4gICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2xpbmtlZGluJzogcmV0dXJuIDQ7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2luc3RhZ3JhbSc6IHJldHVybiA1O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd5b3V0dWJlJzogcmV0dXJuIDY7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3BpbnRlcmVzdCc6IHJldHVybiA3O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICdnb29nbGVwbHVzJzogcmV0dXJuIDg7XHJcbiAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAnYmxvZ2dlcic6IHJldHVybiA5O1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICBjYXNlICd0dW1ibHInOiByZXR1cm4gMTA7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3dvcmRwcmVzcyc6IHJldHVybiAxMTtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgY2FzZSAndmsnOiByZXR1cm4gMTI7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiAxMztcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLnJlZnJlc2hBY2NvdW50ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IFwiYWNjb3VudC9yZWZyZXNoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogXCJyZWZyZXNoQWNjb3VudFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLmlkXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjdGlvbiA9ICd1cGRhdGVQSUJvYXJkcyc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XHJcblxyXG4gICAgICAgICAgICBpZiggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicgKSBjYWxsYmFjayhmbGFnKTtcclxuXHJcbiAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIEFjY291bnQucHJvdG90eXBlLmRlbGV0ZUFjY291bnQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogXCJhY2NvdW50L2RlbGV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IFwiZGVsZXRlQWNjb3VudEJ5SURcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5pZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oZnVuY3Rpb24ocmVzcCl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgaWYoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nICkgY2FsbGJhY2soZmxhZyk7XHJcblxyXG4gICAgICAgIH0sIGZ1bmN0aW9uKCl7fSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gQWNjb3VudDtcclxuICAgIFxyXG59XTtcclxuXHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsnRUMnLCAnc29jaWFsTWFuYWdlcicsIGZ1bmN0aW9uKEVDLCBzb2NpYWxNYW5hZ2VyKXtcclxuXHJcblx0ZnVuY3Rpb24gUHJvZmlsZSAoIHByb2ZpbGVfZGF0YSwgYWNjb3VudCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0gcHJvZmlsZV9kYXRhIHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmFjY291bnQgPSBhY2NvdW50IHx8IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gZGF0YS5zYW1wbGVJZDtcclxuXHJcbiAgICAgICAgdGhpcy5waWN0dXJlID0gKCBkYXRhLnByb2ZpbGVQaWN0dXJlID8gZGVjb2RlVVJJQ29tcG9uZW50KCBkYXRhLnByb2ZpbGVQaWN0dXJlICkgOiAnc3Nzc3Nzc3MnICk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSAhPT0gJ3BpbnRlcmVzdCcgKSB0aGlzLnBpY3R1cmUgPSB0aGlzLnBpY3R1cmUucmVwbGFjZSgnaHR0cDovLycsJy8vJyk7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5tb25pdG9yZWQgPT0gJ29uJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnb24nKSB0aGlzLm1vbml0b3JlZCA9ICdvbic7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEubW9uaXRvcmVkID09ICdleHBpcmVkJyB8fCBkYXRhLnNvY2lhbE1vbml0b3JlZCA9PSAnZXhwaXJlZCcpIHRoaXMubW9uaXRvcmVkID0gJ2V4cGlyZWQnO1xyXG5cclxuICAgICAgICBlbHNlIHRoaXMubW9uaXRvcmVkID0gJ29mZic7XHJcblxyXG4gICAgICAgIHRoaXMucHJvZmlsZV9jaGVja2VkID0gdGhpcy5tb25pdG9yZWQgPT0gJ29uJyA/IHRydWU6ZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuZXZlbnRzTW9uaXRvcmVkID0gZGF0YS5ldmVudHNNb25pdG9yZWQ7XHJcblxyXG4gICAgICAgIC8vIHRoaXMubW9uaXRvcmVkID0gKCAoIGRhdGEubW9uaXRvcmVkID09ICdvbicgfHwgZGF0YS5zb2NpYWxNb25pdG9yZWQgPT0gJ29uJykgPyAnb24nIDogJ29mZicpO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuYWNjb3VudFN0cmVhbXMgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBkYXRhLmFjY291bnRTdHJlYW1zLnN0cmVhbSApICkgdGhpcy5zdHJlYW1zID0gZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW07XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBkYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgKSB0aGlzLnN0cmVhbXMgPSBbIGRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtIF07XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC5kYXRhLmFjY291bnRTdHJlYW1zICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggdGhpcy5hY2NvdW50LmRhdGEuYWNjb3VudFN0cmVhbXMuc3RyZWFtICkgKSB0aGlzLnN0cmVhbXMgPSB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW07XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcyAhPT0gdW5kZWZpbmVkICkgdGhpcy5zdHJlYW1zID0gWyB0aGlzLmFjY291bnQuZGF0YS5hY2NvdW50U3RyZWFtcy5zdHJlYW0gXTtcclxuXHJcbiAgICAgICAgZWxzZSB0aGlzLnN0cmVhbXMgPSBbXTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5zb2NpYWwgPSBuZXcgU29jaWFsKCBzZWxmICk7XHJcbiAgICAgICAgdGhpcy5zb2NpYWwgPSBuZXcgc29jaWFsTWFuYWdlciggc2VsZiApO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmFuYWx5dGljcyA9IG5ldyBBbmFseXRpY3MoIHNlbGYgKTtcclxuICAgICAgICAvL3RoaXMuYW5hbHl0aWNzID0gbmV3IGFuYWx5dGljc01hbmFnZXIoIHNlbGYgKTtcclxuXHJcbiAgICAgICAgdGhpcy5ncm91cHMgPSBbXTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLm5ldHdvcmsgPSB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnVzZXJuYW1lID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubW9uaXRvcmVkID09PSAnb24nICYmIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2xpbmtlZGluJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qdmFyIHJlcV9kYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMuaWRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6ICdmZWVkL2xpbmtlZEluL2dyb3VwcycsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiByZXFfZGF0YVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmogIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YSAhPT0gdW5kZWZpbmVkICkgc2VsZi5ncm91cHMgPSAoIEFycmF5LmlzQXJyYXkoIG9iai5kYXRhICkgPyBvYmouZGF0YS5zb3J0KGZ1bmN0aW9uKGEsYil7aWYoYS5uYW1lIDwgYi5uYW1lKSByZXR1cm4gLTE7aWYoYS5uYW1lID4gYi5uYW1lKSByZXR1cm4gMTtyZXR1cm4gMDt9KSA6IFsgb2JqLmRhdGEgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9KTsqL1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZmFjZWJvb2snICYmIGRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiIClcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5tb25pdG9yZWQgPT09ICdvbicgJiYgdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAnZmFjZWJvb2snKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLyp2YXIgcmVxX2RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJIaWRkZW5fR3JvdXBzJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5pZCxcclxuICAgICAgICAgICAgICAgICAgICBuZXh0X3Bvc3RzOiAnJ1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgICAgICB1cmw6J2ZlZWQvZmJIaWRkZW5Hcm91cHMnLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHJlcV9kYXRhXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBvYmogIT0gdW5kZWZpbmVkICYmIG9iai5kYXRhICE9IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5sZW5ndGggPiAwICkgc2VsZi5ncm91cHMgPSAoIEFycmF5LmlzQXJyYXkoIG9iai5kYXRhICkgPyBvYmouZGF0YS5zb3J0KGZ1bmN0aW9uKGEsYil7aWYoYS5uYW1lIDwgYi5uYW1lKSByZXR1cm4gLTE7aWYoYS5uYW1lID4gYi5uYW1lKSByZXR1cm4gMTtyZXR1cm4gMDt9KSA6IFsgb2JqLmRhdGEgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH0pOyovXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICd0d2l0dGVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdHMgPSB7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0X2VsZW1lbnQ6IHVuZGVmaW5lZCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IFtdXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIC8vIGdldCBwcm9maWxlIExpc3RzXHJcbiAgICAgICAgICAgIC8vbW9kdWxlLmdldF90d19wcm9maWxlX2xpc3RzKHRoaXMvKiwgZnVuY3Rpb24oKXt9Ki8pOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5wb3dlclVzZXJzICkgdGhpcy5wb3dlcl91c2VycyA9IGRhdGEucG93ZXJVc2VycztcclxuXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5wb3dlcl91c2VycyA9IHtcclxuICAgICAgICAgICAgICAgIHN0YXRlOiAnb24nLFxyXG4gICAgICAgICAgICAgICAgbWVkaXVtTG93OiAnMjAwMCcsXHJcbiAgICAgICAgICAgICAgICBtZWRpdW1IaWdoOiAnNzUwMCcsXHJcbiAgICAgICAgICAgICAgICBoaWdoOiAnNzUwMCdcclxuICAgICAgICAgICAgfTsgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdpbnN0YWdyYW0nKVxyXG4gICAgICAgIHtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSA9PSAneW91dHViZScpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdnb29nbGVwbHVzJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKCBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSA9PSAncGFnZScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvc3Rpbmdfb25seSA9IHRydWU7IFxyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZSA9IHByb2ZpbGVfZGF0YS5mdWxsTmFtZSArICcgKFBhZ2UpJztcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWVfa2V5ID0gJ2Z1bGxOYW1lJzsgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgPSAocHJvZmlsZV9kYXRhLmZ1bGxOYW1lICE9PSB1bmRlZmluZWQgJiYgcHJvZmlsZV9kYXRhLmZ1bGxOYW1lICE9PVwiXCIpP3Byb2ZpbGVfZGF0YS5mdWxsTmFtZS5zcGxpdChcIihcIilbMF0gKyAnIChVc2VyKSc6ICcoVXNlciknO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51c2VybmFtZV9rZXkgPSAnZnVsbE5hbWUnOyAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lID0gcHJvZmlsZV9kYXRhLmZ1bGxOYW1lO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJuYW1lX2tleSA9ICdmdWxsTmFtZSc7XHJcblxyXG4gICAgICAgICAgICBpZiggcHJvZmlsZV9kYXRhLm9iamVjdFR5cGUgIT09IHVuZGVmaW5lZCAmJiBwcm9maWxlX2RhdGEub2JqZWN0VHlwZSA9PSAndXNlcicgKSB0aGlzLnVzZXJuYW1lICs9ICcgKFVzZXIpJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9zdGluZ19vbmx5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMudXNlcm5hbWUgKz0gJyAoQm9hcmQpJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyggcHJvZmlsZV9kYXRhLnBhZ2VOYW1lICkgLy8gRkIgXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS50aXRsZSApIC8vIEdBXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5wcm9maWxlTmFtZSApIC8vIExOXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS51c2VyTmFtZSApIC8vIElHXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHByb2ZpbGVfZGF0YS5zcGVjaWZpZWRIYW5kbGVPckhhc2hUYWcgKSAvLyBUV1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEuZnVsbE5hbWUgKSAvLyBHK1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCBwcm9maWxlX2RhdGEudXNlckZpcnN0TmFtZSApIC8vIFlUXHJcblxyXG4gICAgICAgIFsncGFnZU5hbWUnLCAndGl0bGUnLCAncHJvZmlsZU5hbWUnLCAndXNlckZpcnN0TmFtZScsICd1c2VyTmFtZScsICdzcGVjaWZpZWRIYW5kbGVPckhhc2hUYWcnLCAnZnVsbE5hbWUnXS5mb3JFYWNoKGZ1bmN0aW9uICggaXRlbSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIGRhdGFbIGl0ZW0gXSAhPT0gdW5kZWZpbmVkICYmIHNlbGYudXNlcm5hbWUgPT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYudXNlcm5hbWUgPSBkYXRhWyBpdGVtIF0gKyAnICc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYudXNlcm5hbWVfa2V5ID0gaXRlbTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gJ1tvYmplY3QgJyArdGhpcy5hY2NvdW50LnR5cGUrICcgUHJvZmlsZV0nO1xyXG4gICAgfTtcclxuXHJcbiAgICBQcm9maWxlLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51c2VybmFtZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUuaXNfZGlzcGxheV9wcm9maWxlID0gZnVuY3Rpb24oIGFsbF9mbGFnICkgXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGRpc3BsYXlfcHJvZmlsZSA9IHRydWUsXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBcclxuICAgICAgICBpZiAoIGFsbF9mbGFnID09PSB1bmRlZmluZWQgJiYgc2VsZi5tb25pdG9yZWQgPT09ICdvbicpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyRhY2NvdW50LmVsZW1lbnQuZmluZCgnLmZ1bmN0aW9ucycpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAoIHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ2dvb2dsZXBsdXMnICYmICFzZWxmLnBvc3Rpbmdfb25seSApIHx8IHNlbGYuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gJ3BpbnRlcmVzdCcgKSBcclxuICAgICAgICAgICAgeyBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTsgfSAvL2hpZGUgaW4gcG9zdCBtYW5hZ2VyXHJcbiAgICAgICAgfSBcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGFsbF9mbGFnID09PSB0cnVlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnKSAmJiBzZWxmLnBvc3Rpbmdfb25seSApIFxyXG4gICAgICAgICAgICB7IGRpc3BsYXlfcHJvZmlsZSA9IGZhbHNlOyB9IC8vaGlkZSAgIFxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpID09ICdwaW50ZXJlc3QnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRpc3BsYXlfcHJvZmlsZSA9IHNlbGYucG9zdGluZ19vbmx5O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBkaXNwbGF5X3Byb2ZpbGUgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRpc3BsYXlfcHJvZmlsZTtcclxuICAgIH07XHJcblxyXG4gICAgUHJvZmlsZS5wcm90b3R5cGUuZ2V0VXNlck5hbWUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IHRoaXMudXNlcm5hbWU7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5kYXRhLnRpdGxlICE9PSB1bmRlZmluZWQgKSAvLyBmb3JtYXQgbmFtZSBmb3IgR0FcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wID0gdXNlcm5hbWUuc3BsaXQoJygnKVswXSB8fCBzZWxmLnVzZXJuYW1lKyAnICc7XHJcblxyXG4gICAgICAgICAgICB1c2VybmFtZSA9IHRlbXAuc3Vic3RyaW5nKDAsIHRlbXAubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdXNlcm5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFByb2ZpbGUucHJvdG90eXBlLnVwZGF0ZV9tb25pdG9yID0gZnVuY3Rpb24oIGZsYWcgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICBmbGFnID0gKGZsYWcgIT09IHVuZGVmaW5lZCk/ZmxhZzpmYWxzZTtcclxuXHJcbiAgICAgICAgaWYoIHNlbGYuYWNjb3VudC50eXBlID09ICdHb29nbGVBbmFseXRpY3MnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGFsZXJ0KCdnb29nbGUgYW5hbHl0aWNzLi4uLi4uLi4uLi4uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNlbGYubW9uaXRvcmVkID0gZmxhZyA/ICdvbic6J29mZic7XHJcblxyXG4gICAgICAgICAgICBzYXZlX3Byb2ZpbGVfc2VsZWN0aW9uKGZ1bmN0aW9uKCBzdGF0dXMgKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0dXM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gc2F2ZV9wcm9maWxlX3NlbGVjdGlvbiggY2FsbGJhY2sgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOidQT1NUJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDpcImFjY291bnQvc2luZ2xlcHJvZmlsZW1vbml0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3NldFNpbmdsZVByb2ZpbGVNb25pdG9yZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgYWNjb3VudElEOiBzZWxmLmFjY291bnQuaWQsIHByb2ZpbGVJRDogc2VsZi5pZCwgY2hlY2tlZDogZmxhZyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbihmdW5jdGlvbihyZXNwKXtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3ApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJyApIGNhbGxiYWNrKGZsYWcpO1xyXG5cclxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oKXt9KTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBcclxuXHJcblxyXG5cclxuICAgIHJldHVybiBQcm9maWxlO1xyXG5cclxufV07IiwibW9kdWxlLmV4cG9ydHMgPSBbXHJcbiAgICAnJHEnLFxyXG4gICAgJyRodHRwJyxcclxuICAgICdhcGlVcmwnLFxyXG4gICAgJyRsb2NhbFN0b3JhZ2UnLFxyXG4gICAgJyRpb25pY0xvYWRpbmcnLFxyXG4gICAgZnVuY3Rpb24oXHJcbiAgICAgICAgJHEsXHJcbiAgICAgICAgJGh0dHAsXHJcbiAgICAgICAgYXBpVXJsLFxyXG4gICAgICAgICRsb2NhbFN0b3JhZ2UsXHJcbiAgICAgICAgJGlvbmljTG9hZGluZykge1xyXG5cclxuICAgICAgICB2YXIgZmF2b3JpdGVzID0gW10sXHJcbiAgICAgICAgICAgIHNlYXJjaGVzID0gW107XHJcbiAgICAgICAgdGhpcy5yZXF1ZXN0ID0gZnVuY3Rpb24ocmVxdWVzdCkge1xyXG4gICAgICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51c2VyX2RhdGEgPSAkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YTtcclxuICAgICAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24uaXNfbW9iaWxlX2FwcCA9ICcxJztcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0tLS0snKTtcclxuICAgICAgICAgICAgcmV0dXJuICRxKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vSWYgdGhlIHJlcXVlc3QgdXJsIGlzIG5vdCBmdWxsLWZvcm1hdCAsIGp1c3QgYXBwZW5kIGFwaS11cmxcclxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LnVybC5pbmRleE9mKGFwaVVybCkgIT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LnVybCA9IGFwaVVybCArIHJlcXVlc3QudXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3QubWV0aG9kID0gcmVxdWVzdC50eXBlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vJGlvbmljTG9hZGluZy5zaG93KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3QubWV0aG9kID09ICdHRVQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5wYXJhbXMgPSByZXF1ZXN0LmRhdGE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJGh0dHAocmVxdWVzdClcclxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8kaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXNlcl9kYXRhID0gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlLmhlYWRlcnMoJ2VjX2RhdGEnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbG9jYWxTdG9yYWdlLnVzZXJfZGF0YSA9IHJlc3BvbnNlLmhlYWRlcnMoJ2VjX2RhdGEnKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZS5kYXRhKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vJGlvbmljTG9hZGluZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoJ1RoZXJlIGlzIHNvbWUgY29ubmVjdGl2aXR5IGlzc3VlIC5QbGVhc2UgdHJ5IGFnYWluIGxhdGVyLicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldEFwaVVybCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gYXBpVXJsO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaXNFbXB0eU9iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnJlcGxhY2VfdHlwZV9pbl91c2VybmFtZSA9IGZ1bmN0aW9uKHVzZXJuYW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkLnRyaW0odXNlcm5hbWUpLnJlcGxhY2UoLyggXFwoVXNlclxcKSR8IFxcKFByb2ZpbGVcXCkkfCBcXChQYWdlXFwpJHwgXFwoQ29tcGFueSBQYWdlXFwpJCkvLCAnJyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5mb3JfZWFjaCA9IGZ1bmN0aW9uKGFycmF5LCBmbikge1xyXG4gICAgICAgICAgICBhcnJheSA9IEFycmF5LmlzQXJyYXkoYXJyYXkpID8gYXJyYXkgOiBbYXJyYXldO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaW5kZXggPSAwLCBsZW5ndGggPSBhcnJheS5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyArK2luZGV4KSBmbihhcnJheVtpbmRleF0sIGluZGV4LCBsZW5ndGgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudHdfZGVlcF9saW5rX3RvX2h0bWwgPSBmdW5jdGlvbih0ZXh0LCByYXdfZGF0YSkge1xyXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dCB8fCAnJztcclxuXHJcbiAgICAgICAgICAgIHZhciBkZWVwX2xpbmsgPSAnaHR0cHM6Ly90d2l0dGVyLmNvbS9tZXNzYWdlcy9jb21wb3NlP3JlY2lwaWVudF9pZD0nO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJhd19kYXRhLmVudGl0aWVzICYmIHJhd19kYXRhLmVudGl0aWVzLnVybHMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9yX2VhY2gocmF3X2RhdGEuZW50aXRpZXMudXJscywgZnVuY3Rpb24odXJsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVybC51cmwgJiYgdXJsLmV4cGFuZGVkX3VybCAmJiB1cmwuZXhwYW5kZWRfdXJsLmluZGV4T2YoZGVlcF9saW5rKSAhPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4cGFuZGVkX3VybCA9IHVybC5leHBhbmRlZF91cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNpcGllbnRfaWQgPSBleHBhbmRlZF91cmwucmVwbGFjZShkZWVwX2xpbmssICcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZXNzYWdlX21lID0gJzxkaXYgY2xhc3M9XCJtZXNzYWdlLW1lXCIgZGF0YS1yZWNpcGllbnQ9XCInICsgcmVjaXBpZW50X2lkICsgJ1wiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxzdmcgY2xhc3M9XCJtZXNzYWdlLW1lLWljb25cIiB2aWV3Qm94PVwiMCAwIDU2IDU0XCIgdmVyc2lvbj1cIjEuMVwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj48L3N2Zz4nICtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJtZXNzYWdlLW1lLXRleHRcIj5TZW5kIGEgcHJpdmF0ZSBtZXNzYWdlPC9zcGFuPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2Pic7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHVybC51cmwsIG1lc3NhZ2VfbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKHVybC5leHBhbmRlZF91cmwsIG1lc3NhZ2VfbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnVybF90b19saW5rID0gZnVuY3Rpb24odGV4dCwgdGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHZhciBleHAgPSAvKFxcYigoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC98Yml0Lmx5XFwvfGdvby5nbFxcL3x0LmNvXFwvKVstQS1aMC05KyZAI1xcLyU/PX5ffCE6LC47XSpbLUEtWjAtOSsmQCNcXC8lPX5ffF0pL2lnO1xyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gcmVwbGFjZXIobWF0Y2gpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcIjxhIGhyZWY9J1wiICsgKG1hdGNoLmluZGV4T2YoJy8vJykgPT0gLTEgPyAnLy8nICsgbWF0Y2ggOiBtYXRjaCkgKyBcIicgXCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YgdGFyZ2V0ID09ICd1bmRlZmluZWQnID8gJ3RhcmdldD1cIl9ibGFua1wiJyA6ICd0YXJnZXQ9XCInICsgdGFyZ2V0ICsgJ1wiJykgKyBcIj5cIiArIG1hdGNoICsgXCI8L2E+XCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGV4dCA9PSAnc3RyaW5nJykgcmV0dXJuIHRleHQucmVwbGFjZShleHAsIHJlcGxhY2VyKTtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgcmV0dXJuICcnO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudHdfdXNlcl9tZW50aW9uc190b19saW5rcyA9IGZ1bmN0aW9uKHRleHQsIHJhd19kYXRhKSB7XHJcbiAgICAgICAgICAgIHRleHQgPSB0ZXh0IHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgdmFyIHVzZXJfbWVudGlvbnM7XHJcblxyXG4gICAgICAgICAgICBpZiAocmF3X2RhdGEuZW50aXRpZXMgIT09IHVuZGVmaW5lZCAmJiByYXdfZGF0YS5lbnRpdGllcy51c2VyX21lbnRpb25zICE9PSB1bmRlZmluZWQgJiYgcmF3X2RhdGEuZW50aXRpZXMudXNlcl9tZW50aW9ucy5zY3JlZW5fbmFtZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICB1c2VyX21lbnRpb25zID0gcmF3X2RhdGEuZW50aXRpZXMudXNlcl9tZW50aW9ucy5zY3JlZW5fbmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkodXNlcl9tZW50aW9ucykpIHVzZXJfbWVudGlvbnMgPSBbdXNlcl9tZW50aW9uc107XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHVzZXJfbWVudGlvbnMgPSB1c2VyX21lbnRpb25zIHx8IFtdO1xyXG5cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB1c2VyX21lbnRpb25zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNjcmVlbl9uYW1lID0gdXNlcl9tZW50aW9uc1tpXTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgZXhwID0gbmV3IFJlZ0V4cCgnQCcgKyBzY3JlZW5fbmFtZSwgJ2lnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShleHAsICc8YSBjbGFzcz1cInR3LXVzZXJcIiBocmVmPVwiaHR0cHM6Ly90d2l0dGVyLmNvbS8nICsgc2NyZWVuX25hbWUgK1xyXG4gICAgICAgICAgICAgICAgICAgICdcIiB0YXJnZXQ9XCJfYmxhbmtcIiAgZGF0YS11c2VyPVwiQCcgKyBzY3JlZW5fbmFtZSArICdcIj5AJyArIHNjcmVlbl9uYW1lICsgJzwvYT4nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XHJcblxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaGFzaHRhZ190b19saW5rID0gZnVuY3Rpb24odGV4dCwgbmV0d29yaykge1xyXG4gICAgICAgICAgICB2YXIgZXhwID0gL1xcQiMoXFx3KlthLXpBLVpdK1xcdyopL2lnLFxyXG4gICAgICAgICAgICAgICAgbGlua2VkID0gJyc7XHJcblxyXG4gICAgICAgICAgICBpZiAoJC5pc0FycmF5KHRleHQpKSB0ZXh0ID0gdGV4dFswXTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGV4dCAhPT0gJ3VuZGVmaW5lZCcpIC8vIG1heWJlIGlmIHRleHQgIT0gdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICBpZiAobmV0d29yayA9PT0gJ3R3aXR0ZXInKVxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtlZCA9IHRleHQucmVwbGFjZShleHAsIFwiPGEgY2xhc3M9J3R3LWhhc2h0YWcnIGhyZWY9J2h0dHBzOi8vdHdpdHRlci5jb20vc2VhcmNoP3E9JTIzJDEnIHRhcmdldD0nX2JsYW5rJyBkYXRhLXF1ZXJ5PSclMjMkMSc+IyQxPC9hPlwiKTtcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKG5ldHdvcmsgPT09ICdmYWNlYm9vaycpXHJcbiAgICAgICAgICAgICAgICBsaW5rZWQgPSB0ZXh0LnJlcGxhY2UoZXhwLCBcIjxhIGhyZWY9J2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9oYXNodGFnLyQxJyB0YXJnZXQ9J19ibGFuayc+IyQxPC9hPlwiKTsgLy8gaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2hhc2h0YWcvbmJhP2hjX2xvY2F0aW9uPXVmaVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBsaW5rZWQgPSB0ZXh0LnJlcGxhY2UoZXhwLCBcIjxhIGhyZWY9J2h0dHBzOi8vdHdpdHRlci5jb20vc2VhcmNoP3E9JTIzJDEnIHRhcmdldD0nX2JsYW5rJz4jJDE8L2E+XCIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGxpbmtlZDtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZiX3RhZ3NfdG9fbGlua3MgPSBmdW5jdGlvbih0ZXh0LCB0YWdzLCB0eXBlKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0YWdzKSkgdGFncyA9IFt0YWdzXTtcclxuXHJcbiAgICAgICAgICAgIHRhZ3Muc29ydChmdW5jdGlvbihhLCBiKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoYS5vZmZzZXQpIC0gcGFyc2VJbnQoYi5vZmZzZXQpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBbXSxcclxuICAgICAgICAgICAgICAgIGN1cl9vZmZzZXQgPSAwLFxyXG4gICAgICAgICAgICAgICAgcmVzdWx0X3N0ciA9ICcnLFxyXG4gICAgICAgICAgICAgICAgdGFnLCBsZW5ndGgsIG9mZnNldCwgbXVsdGl0YWdzID0ge307XHJcblxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRhZ3MubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0YWcgPSB0YWdzW2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIG9mZnNldCA9IHBhcnNlSW50KHRhZy5vZmZzZXQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxlbmd0aCA9IHBhcnNlSW50KHRhZy5sZW5ndGgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjdXJfb2Zmc2V0IDw9IG9mZnNldCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRleHQuc3Vic3RyaW5nKGN1cl9vZmZzZXQsIG9mZnNldCkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjdXJfb2Zmc2V0ID0gb2Zmc2V0ICsgbGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL3Jlc3VsdC5wdXNoKCB0YWcubGluayApO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IHRhZy5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogKHRhZy5uYW1lID09IHVuZGVmaW5lZCB8fCAkLmlzRW1wdHlPYmplY3QodGFnLm5hbWUpID8gdGV4dC5zdWJzdHIob2Zmc2V0LCBsZW5ndGgpIDogdGFnLm5hbWUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0YWcudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGluazogdGFnLmxpbmtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSAvL211bHRpdGFnc1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtdWx0aXRhZ3NbdGFnLm9mZnNldF0gPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2X2xpbmsgPSByZXN1bHQucG9wKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXRhZ3NbdGFnLm9mZnNldF0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxlbmd0aDogbGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGV4dC5zdWJzdHIob2Zmc2V0LCBsZW5ndGgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0YWdzW2kgLSAxXS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IHByZXZfbGlua1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRhZy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IHRhZy5saW5rXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goJ18kbXQkXycgKyBvZmZzZXQgKyB0ZXh0LnN1YnN0cihvZmZzZXQsIGxlbmd0aCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSAvL2FkZCBtdWx0aXRhZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXRhZ3NbdGFnLm9mZnNldF0udGFncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFnLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IHRhZy5saW5rXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVzdWx0LnB1c2godGV4dC5zdWJzdHJpbmcoY3VyX29mZnNldCkpO1xyXG5cclxuICAgICAgICAgICAgLy9yZXN1bHRfc3RyID0gdXJsX3RvX2xpbmsoIHJlc3VsdC5qb2luKCcnKSApO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHJlc3VsdC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gcmVzdWx0W2ldO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PSAnb2JqZWN0JykgLy90YWdcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHRfc3RyICs9ICc8YSBjbGFzcz1cImZiLScgKyBpdGVtLnR5cGUgKyAnXCIgaHJlZj1cIicgKyBpdGVtLmxpbmsgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCIgZGF0YS11c2VyPVwiJyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uaWQgKyAnXCI+JyArIGl0ZW0ubmFtZSArICc8L2E+JztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSByZXN1bHRfc3RyICs9IHNlbGYudXJsX3RvX2xpbmsoaXRlbSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qZm9yICggdmFyIGkgPSAwLCBsID0gdGFncy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIG11bHRpdGFnc1sgdGFnc1sgaSBdLm9mZnNldCBdID09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0X3N0ciA9IHJlc3VsdF9zdHIucmVwbGFjZSggJz4nICsgdGFnc1sgaSBdLmxpbmsgKyAnPCcsICc+JyArIHRhZ3NbIGkgXS5uYW1lICsgJzwnICk7ICBcclxuICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICB9Ki9cclxuXHJcbiAgICAgICAgICAgIGZvciAodmFyIG9mZnNldCBpbiBtdWx0aXRhZ3MpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtdWx0aXRhZyA9IG11bHRpdGFnc1tvZmZzZXRdO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciB0dCA9ICcnO1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDAsIGwgPSBtdWx0aXRhZy50YWdzLmxlbmd0aDsgayA8IGw7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChrIDwgMykgdHQgPSB0dCArICh0dC5sZW5ndGggPT0gMCA/ICcnIDogJywgJykgKyBtdWx0aXRhZy50YWdzW2tdLm5hbWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobXVsdGl0YWcudGFncy5sZW5ndGggPiAzKSB0dCA9IHR0ICsgJywgLi4uJztcclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHRfc3RyID0gcmVzdWx0X3N0ci5yZXBsYWNlKCdfJG10JF8nICsgbXVsdGl0YWcub2Zmc2V0ICsgbXVsdGl0YWcubmFtZSwgJzxzcGFuIGNsYXNzPVwibXVsdGl0YWdcIiBkYXRhLXRvb2x0aXA9XCInICtcclxuICAgICAgICAgICAgICAgICAgICB0dCArICdcIiBkYXRhLW9mZnNldD1cIicgKyB0eXBlICsgJ18nICsgbXVsdGl0YWcub2Zmc2V0ICsgJ1wiPicgKyBtdWx0aXRhZy5uYW1lICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdF9zdHI7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5GQl90aHVtYm5haWxfdG9fZnVsbF9zaXplID0gZnVuY3Rpb24odXJsKSB7XHJcbiAgICAgICAgICAgIHZhciB1cmxfbiA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZihcIj9cIikgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGlmICh1cmwuaW5kZXhPZihcIl9zLmpwZ1wiKSAhPSAtMSkgdXJsX24gPSB1cmwucmVwbGFjZShcIl9zLmpwZ1wiLCBcIl9uLmpwZ1wiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodXJsLmluZGV4T2YoXCJfcy5qcGVnXCIpICE9IC0xKSB1cmxfbiA9IHVybC5yZXBsYWNlKFwiX3MuanBlZ1wiLCBcIl9uLmpwZWdcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgdXJsX24gPSB1cmwucmVwbGFjZShcIl9zLnBuZ1wiLCBcIl9uLnBuZ1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHVybF9uO1xyXG4gICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICB0aGlzLnJlcGxhY2VVUkxXaXRoSFRNTExpbmtzID0gZnVuY3Rpb24odGV4dCwgbmV3V2luZG93KSB7XHJcbiAgICAgICAgICAgIHZhciBleHAgPSAvKFxcYihodHRwcz98ZnRwfGZpbGUpOlxcL1xcL1stQS1aMC05KyZAI1xcLyU/PX5ffCE6LC47XSpbLUEtWjAtOSsmQCNcXC8lPX5ffF0pL2lnO1xyXG4gICAgICAgICAgICB2YXIgZXhwX3d3dyA9IC9eKFxcYig/IShodHRwcz98ZnRwfGZpbGUpKSh3d3dbLl0pWy1BLVowLTkrJkAjXFwvJT89fl98ITosLjtdKlstQS1aMC05KyZAI1xcLyU9fl98XSkvaWc7XHJcbiAgICAgICAgICAgIGlmIChuZXdXaW5kb3cpIHtcclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoZXhwLCBcIjxhIGhyZWY9JyQxJyB0YXJnZXQ9J19ibGFuayc+JDE8L2E+XCIpO1xyXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQucmVwbGFjZShleHBfd3d3LCBcIjxhIGhyZWY9J2h0dHA6Ly8kMScgdGFyZ2V0PSdfYmxhbmsnPiQxPC9hPlwiKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoZXhwLCBcIjxhIGhyZWY9JyQxJz4kMTwvYT5cIik7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGV4cF93d3csIFwiPGEgaHJlZj0naHR0cDovLyQxJz4kMTwvYT5cIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3N0X2xpa2VzX3RleHQgPSBmdW5jdGlvbiAoIGNvdW50LCBsaWtlZCwgZGlzbGlrZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBlbmRpbmcgPSAncycsXHJcbiAgICAgICAgICAgICAgICB5b3UgPSAnJyxcclxuICAgICAgICAgICAgICAgIGxpa2UgPSBkaXNsaWtlID8gJyBkaXNsaWtlJyA6ICcgbGlrZSc7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGxpa2VkICkge1xyXG4gICAgICAgICAgICAgICAgY291bnQtLTtcclxuICAgICAgICAgICAgICAgIHlvdSA9IFwiWW91ICsgXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggY291bnQgPT0gMSApIGVuZGluZyA9ICcnO1xyXG5cclxuICAgICAgICAgICAgLy9qdXN0IGluIGNhc2VcclxuICAgICAgICAgICAgaWYgKCBjb3VudCA8IDAgKSBjb3VudCA9IDA7IFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiB5b3UgKyBzZWxmLm51bWJlcldpdGhDb21tYXMoIGNvdW50ICkgKyBsaWtlICsgZW5kaW5nO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMubnVtYmVyV2l0aENvbW1hcyA9IGZ1bmN0aW9uICh4KSB7XHJcbiAgICAgICAgICAgIGlmKHg9PXVuZGVmaW5lZClyZXR1cm4gJyc7XHJcbiAgICAgICAgICAgIHZhciBwYXJ0cyA9IHgudG9TdHJpbmcoKS5zcGxpdChcIi5cIik7XHJcbiAgICAgICAgICAgIHBhcnRzWzBdID0gcGFydHNbMF0ucmVwbGFjZSgvXFxCKD89KFxcZHszfSkrKD8hXFxkKSkvZywgXCIsXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gcGFydHMuam9pbihcIi5cIik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRTaWRlTWVudSA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICAgICAgdmFyIHNpZGVNZW51ID0gW107XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hvbWUnOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICBzaWRlTWVudSA9IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQWRkICYgTWFuYWdlIEFjY291bnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLm1hbmFnZV9hY2NvdW50cydcclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQWNjb3VudCBTZXR0aW5ncycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ3RhYnMubWFuYWdlX2FjY291bnRzJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdGQVEnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0xvZ291dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICB9XTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncHVibGlzaGluZyc6XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNpZGVNZW51ID0gW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBY2NvdW50IFNldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5tYW5hZ2VfYWNjb3VudHMnXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1Bvc3QgU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICd0YWJzLnBvc3Rfc2V0dGluZ3MnXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0ZBUScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnTG9nb3V0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1dO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdmZWVkJzpcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2lkZU1lbnUgPSBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1NldHRpbmdzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5mZWVkX3NldHRpbmdzJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBZGQgdG8gRmF2b3JpdGVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAndGFicy5mZWVkX3NldHRpbmdzJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdGQVEnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0xvZ291dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJydcclxuICAgICAgICAgICAgICAgICAgICB9XTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHNpZGVNZW51O1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0V2F0Y2hDb3VudCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB2YXIgcm9vdCA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaHRtbCcpKTtcclxuXHJcbiAgICAgICAgICAgIHZhciB3YXRjaGVycyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdmFyIGYgPSBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goWyckc2NvcGUnLCAnJGlzb2xhdGVTY29wZSddLCBmdW5jdGlvbihzY29wZVByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuZGF0YSgpICYmIGVsZW1lbnQuZGF0YSgpLmhhc093blByb3BlcnR5KHNjb3BlUHJvcGVydHkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChlbGVtZW50LmRhdGEoKVtzY29wZVByb3BlcnR5XS4kJHdhdGNoZXJzLCBmdW5jdGlvbih3YXRjaGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YXRjaGVycy5wdXNoKHdhdGNoZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goZWxlbWVudC5jaGlsZHJlbigpLCBmdW5jdGlvbihjaGlsZEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBmKGFuZ3VsYXIuZWxlbWVudChjaGlsZEVsZW1lbnQpKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgZihyb290KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGUgd2F0Y2hlcnNcclxuICAgICAgICAgICAgdmFyIHdhdGNoZXJzV2l0aG91dER1cGxpY2F0ZXMgPSBbXTtcclxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHdhdGNoZXJzLCBmdW5jdGlvbihpdGVtKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAod2F0Y2hlcnNXaXRob3V0RHVwbGljYXRlcy5pbmRleE9mKGl0ZW0pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHdhdGNoZXJzV2l0aG91dER1cGxpY2F0ZXMucHVzaChpdGVtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gd2F0Y2hlcnNXaXRob3V0RHVwbGljYXRlcy5sZW5ndGg7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcblxyXG5cclxuXHJcbiAgICB9XHJcbl07IiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnQWNjb3VudCcsICckY29yZG92YUluQXBwQnJvd3NlcicsJ18nLCBmdW5jdGlvbigkaHR0cCwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgQWNjb3VudCwgJGNvcmRvdmFJbkFwcEJyb3dzZXIsIF8gKXsgIFxyXG5cclxuICAgIHZhciBsaWNlbnNlT3B0aW9ucyxcclxuICAgICAgICBzZXR0aW5ncyxcclxuICAgICAgICBpc19ldHN5X3VzZXIgPSBmYWxzZSxcclxuICAgICAgICBpc193ZWVibHlfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3dpeF91c2VyPSBmYWxzZSxcclxuICAgICAgICBpc19sZXhpdHlfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX3Nob3BpZnlfdXNlciA9IGZhbHNlLFxyXG4gICAgICAgIGlzX2JpZ2NvbW1lcmNlX3VzZXIgPSBmYWxzZSxcclxuICAgICAgICBleHRlcm5hbEFwcHMgPSBbXSxcclxuICAgICAgICBmYXZvcml0ZXMgPSBbXSxcclxuICAgICAgICBzZWFyY2hlcyA9IFtdLFxyXG4gICAgICAgIHVzZXJfaW5ib3hfZmlsdGVycyA9IFtdLFxyXG4gICAgICAgIGdvdF9zZiA9IGZhbHNlLFxyXG4gICAgICAgIGdvdF9zZWFyY2hlcyA9IGZhbHNlLFxyXG4gICAgICAgIG51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gMCxcclxuICAgICAgICBhbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzID0gdHJ1ZSxcclxuICAgICAgICBoaWRlRXZlbnRzQ291bnRlciA9IGZhbHNlLFxyXG4gICAgICAgIGRpc3BsYXlJbmJveFNldHRpbmdzID0gdHJ1ZSxcclxuICAgICAgICBhdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmYWxzZSxcclxuICAgICAgICBhZ2VuY3lDb25maWd1cmF0aW9uID0ge30sXHJcbiAgICAgICAgbWF4RXZlbnRUaW1lO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5nZXREaXNwbGF5SW5ib3hTZXR0aW5ncyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3BsYXlJbmJveFNldHRpbmdzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldERpc3BsYXlJbmJveFNldHRpbmdzID0gZnVuY3Rpb24gKCBkaXNwbGF5IClcclxuICAgIHtcclxuICAgICAgICBkaXNwbGF5SW5ib3hTZXR0aW5ncyA9IGRpc3BsYXk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0TWF4RXZlbnRUaW1lID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gKCBtYXhFdmVudFRpbWUgPT09IHVuZGVmaW5lZCA/IG5ldyBEYXRlKCkuZ2V0VGltZSgpIDogbWF4RXZlbnRUaW1lICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0TWF4RXZlbnRUaW1lID0gZnVuY3Rpb24gKCB0aW1lIClcclxuICAgIHtcclxuICAgICAgICBtYXhFdmVudFRpbWUgPSB0aW1lO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldEFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSBmdW5jdGlvbiAoIGhpZGUgKVxyXG4gICAge1xyXG4gICAgICAgIGFsd2F5c0hpZGVDb21wbGV0ZWRFdmVudHMgPSBoaWRlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEhpZGVFdmVudHNDb3VudGVyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaGlkZUV2ZW50c0NvdW50ZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0SGlkZUV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbiAoIGhpZGUgKVxyXG4gICAge1xyXG4gICAgICAgIGhpZGVFdmVudHNDb3VudGVyID0gaGlkZTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXROdW1iZXJPZkNvbXBsZXRlZEV2ZW50cyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG51bWJlck9mQ29tcGxldGVkRXZlbnRzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNldE51bWJlck9mQ29tcGxldGVkRXZlbnRzID0gZnVuY3Rpb24gKCBjb21wbGV0ZWRfZXZlbnRzIClcclxuICAgIHtcclxuICAgICAgICBudW1iZXJPZkNvbXBsZXRlZEV2ZW50cyA9IGNvbXBsZXRlZF9ldmVudHM7XHJcblxyXG4gICAgICAgIHRoaXMucmVuZGVyQ29tcGxldGVkRXZlbnRzQ291bnRlcigpOyBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBhdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3c7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0QXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93ID0gZnVuY3Rpb24gKCBmbGFnIClcclxuICAgIHtcclxuICAgICAgICBhdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cgPSBmbGFnO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbmRlckNvbXBsZXRlZEV2ZW50c0NvdW50ZXIgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgLyp2YXIgJGluZGljYXRvciA9ICQoJ2JvZHknKS5maW5kKCcubmV3LWV2ZW50cy1pbmRpY2F0b3InKTtcclxuXHJcbiAgICAgICAgaWYgKCAkaW5kaWNhdG9yLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhaGlkZUV2ZW50c0NvdW50ZXIgJiYgYWxsX3NldHRpbmdzLmxpY2Vuc2VUeXBlICE9ICdGcmVlJyAmJiBhbGxfc2V0dGluZ3MubGljZW5zZVR5cGUgIT0gJ0luZGl2aWR1YWwnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCAkaW5kaWNhdG9yLmhhc0NsYXNzKCd6ZXJvJykgKSAkaW5kaWNhdG9yLnJlbW92ZUNsYXNzKCd6ZXJvJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGluZGljYXRvci50ZXh0KCBudW1iZXJPZkNvbXBsZXRlZEV2ZW50cyApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggISRpbmRpY2F0b3IuaGFzQ2xhc3MoJ3plcm8nKSApICRpbmRpY2F0b3IudGV4dCgnJykuYWRkQ2xhc3MoJ3plcm8nKTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9Ki9cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBZ2VuY3lDb25maWd1cmF0aW9uID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gYWdlbmN5Q29uZmlndXJhdGlvbjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZXRBZ2VuY3lDb25maWd1cmF0aW9uID0gZnVuY3Rpb24gKCBhYyApXHJcbiAgICB7XHJcbiAgICAgICAgYWdlbmN5Q29uZmlndXJhdGlvbiA9IGFjO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFnZW5jeUJyYW5kcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIGlmKCBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudCA9PT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgcmV0dXJuIFtdO1xyXG5cclxuICAgICAgICBpZiAoICEgQXJyYXkuaXNBcnJheSggYWdlbmN5Q29uZmlndXJhdGlvbi5jbGllbnQgKSApXHJcbiAgICAgICAgICAgIHJldHVybiBbIGFnZW5jeUNvbmZpZ3VyYXRpb24uY2xpZW50IF07XHJcblxyXG4gICAgICAgIHJldHVybiBhZ2VuY3lDb25maWd1cmF0aW9uLmNsaWVudDtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0VXNlclBlcm1pc3Npb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG5cclxuICAgICAgICB2YXIgYnJhbmRzID0gbW9kdWxlLmdldEFnZW5jeUJyYW5kcygpLFxyXG4gICAgICAgICAgICBwZXJtaXNzaW9uID0gJ2VkaXQnO1xyXG5cclxuICAgICAgICBpZiggIWJyYW5kcy5sZW5ndGggKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGZvciggdmFyIGk9MDsgaTxicmFuZHMubGVuZ3RoOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYoIGJyYW5kc1tpXS5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIGJyYW5kc1tpXS5zZWxlY3RlZCA9PSAnMScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwZXJtaXNzaW9uID0gYnJhbmRzW2ldLnBlcm1pc3Npb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBwZXJtaXNzaW9uO1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBbmFseXRpY3NBY2NvdW50cyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBQT1NULFxyXG4gICAgICAgICAgICB1cmw6ICdhamF4LnBocCcsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEFuYWx5dGljc0FjY291bnRzJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2UoIHJlc3BvbnNlICk7IFxyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVBY2NvdW50cyA9IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaylcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICB1cmw6XCJhamF4LnBocFwiLFxyXG4gICAgICAgICAgICBkYXRhOntcclxuICAgICAgICAgICAgICAgIGFjdGlvbjondXBkYXRlQWNjb3VudHMnLFxyXG4gICAgICAgICAgICAgICAgZGF0YTpkYXRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggcmVzcG9uc2UgPT0gU1VDQ0VTUylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmdldFNldHRpbmdzKCk7ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHJlc3BvbnNlICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2F2ZVNldHRpbmdzID0gZnVuY3Rpb24oIGRhdGEsIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTpQT1NULFxyXG4gICAgICAgICAgICB1cmw6J3VzZXIvc2V0dGluZ3MnLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdzYXZlU2V0dGluZ3MnLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHJlc3BvbnNlLnJldHVybkNvZGUgPT0gXCJTVUNDRVNTXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1vZHVsZS5oYW5kbGVfc2V0dGluZ3MoIHJlc3BvbnNlLnNldHRpbmdzLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggcmVzcG9uc2UgKTtcclxuICAgICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHJlc3BvbnNlICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRTZWFyY2hTdHJlYW1zID0gZnVuY3Rpb24oIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCh7IHR5cGU6R0VULCB1cmw6J2ZlZWQvc2VhcmNoU3RyZWFtcycsIGRhdGE6eyBhY3Rpb246J2dldFNlYXJjaFN0cmVhbXMnfX0sIGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICBnb3Rfc2YgPSB0cnVlO1xyXG4gICAgICAgICAgICBzZWFyY2hlcyA9IGRhdGE7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5lZGl0U2VhcmNoU3RyZWFtID0gZnVuY3Rpb24oIHN0cmVhbSwgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggc3RyZWFtLnByb2ZpbGUgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6UE9TVCxcclxuICAgICAgICAgICAgICAgIHVybDonZmVlZC9zZWFyY2hTdHJlYW1zJyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdlZGl0U2VhcmNoU3RyZWFtJyxcclxuICAgICAgICAgICAgICAgICAgICBpZDogc3RyZWFtLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogc3RyZWFtLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHN0cmVhbS5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHN0cmVhbS5wYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBpZiAoIHN0cmVhbS5wYXJhbWV0ZXJzLnF1ZXJ5ICE9PSB1bmRlZmluZWQgKSByZXF1ZXN0LmRhdGEubmFtZSA9ICdTZWFyY2g6ICcgKyBkZWNvZGVVUklDb21wb25lbnQoIHN0cmVhbS5wYXJhbWV0ZXJzLnF1ZXJ5ICk7XHJcblxyXG4gICAgICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24oIHJlc3BvbnNlICkge1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2U7Ly9KU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggZGF0YSApO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0RmF2b3JpdGVTdHJlYW1zID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoeyB0eXBlOkdFVCwgdXJsOidmZWVkL2Zhdm9yaXRlU3RyZWFtcycsIGRhdGE6eyBhY3Rpb246J2dldEZhdm9yaXRlU3RyZWFtcyd9fSwgZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGZhdm9yaXRlcyA9IGRhdGE7XHJcblxyXG4gICAgICAgICAgICBnb3RfZmF2ZXMgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGZhdm9yaXRlcyApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2dldEZhdm9yaXRlU3RyZWFtcyByZXNwb25zZTonKVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZmF2b3JpdGVzID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCBnb3RfZmF2ZXMgKSByZXR1cm4gZmF2b3JpdGVzO1xyXG5cclxuICAgICAgICBlbHNlIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zZWFyY2hfZmVlZHMgPSBmdW5jdGlvbiAoIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIGdvdF9zZiApIHJldHVybiBzZWFyY2hlcztcclxuXHJcbiAgICAgICAgZWxzZSByZXR1cm4gZmFsc2U7ICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc2V0dGluZ3MgPSBmdW5jdGlvbiAoIGNhbGxiYWNrICkgXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIHNldHRpbmdzICk7XHJcblxyXG4gICAgICAgIGVsc2UgcmV0dXJuIHNldHRpbmdzO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5nZXRTZXR0aW5ncyA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6R0VULFxyXG4gICAgICAgICAgICB1cmw6J3VzZXIvc2V0dGluZ3MnICAgICAgICAgICAgXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbW9kdWxlLmhhbmRsZV9zZXR0aW5ncyhyZXNwb25zZSwgY2FsbGJhY2spO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBoYW5kbGUgKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5oYW5kbGVfc2V0dGluZ3MgPSBmdW5jdGlvbiggcmVzcG9uc2UsIGNhbGxiYWNrLCBmbGFnX25vX2FnZW5jeV91cGRhdGUgKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdoYW5kbGVfc2V0dGluZ3MuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4nKTtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRhdGEgPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgZmxhZ19ub19hZ2VuY3lfdXBkYXRlID0gZmxhZ19ub19hZ2VuY3lfdXBkYXRlID8gZmxhZ19ub19hZ2VuY3lfdXBkYXRlOmZhbHNlO1xyXG5cclxuXHJcbiAgICAgICAgICAgIC8vIHNldCBtb2R1bGUgdmFyaWFibGVcclxuICAgICAgICAgICAgc2V0dGluZ3MgPSBkYXRhO1xyXG4gICAgICAgICAgICBpZiAoIHNldHRpbmdzLmFwaVVzZXIgPT09IHVuZGVmaW5lZCB8fCBfLmlzRW1wdHkoIHNldHRpbmdzLmFwaVVzZXIgKSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5hcGlVc2VyID0gc2V0dGluZ3MuZW1haWw7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vc2V0IGdsb2JhbCB2YXJpYWJsZXNcclxuICAgICAgICAgICAgaXNfd2l4X3VzZXIgPSBzZXR0aW5ncy53aXhVc2VyO1xyXG4gICAgICAgICAgICBtYXhfYWxsb3dlZF9nYV9hY2NvdW50cyA9IHNldHRpbmdzLm51bWJlck9mQWN0aXZlR29vZ2xlQW5hbHl0aWNzQWNjb3VudHM7XHJcbiAgICAgICAgICAgIG1heF9hbGxvd2VkX3NvY2lhbF9hY2NvdW50cyA9IHNldHRpbmdzLm51bWJlck9mU29jaWFsc09uO1xyXG4gICAgICAgICAgICByZW1fZGF5cyA9IHNldHRpbmdzLmRheXNMZWZ0O1xyXG5cclxuICAgICAgICAgICAgJGxvY2FsU3RvcmFnZS5hbGxfc2V0dGluZ3MgPSBzZXR0aW5ncztcclxuICAgICAgICAgICAgLy9FQy5zZXNzaW9uRGF0YS5zZXQoJ2FsbF9zZXR0aW5ncycsIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzKSk7XHJcblxyXG4gICAgICAgICAgICAvL3NldCBzZXR0aW5nc0RlZmVycmVkIGFzIHJlc29sdmVkIG9ubHkgaWYgc2V0dGluZ3MgYXZhaWxhYmxlXHJcbiAgICAgICAgICAgIC8vc2V0dGluZ3NEZWZlcnJlZC5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsaWNlbnNlT3B0aW9ucyA9IGRhdGEubGljZW5zZU9wdGlvbnM7XHJcblxyXG4gICAgICAgICAgICAvKmlmICggZGF0YS51c2VyU291cmNlID09IFwiYmlnY29tbWVyY2VcIiB8fCBkYXRhLmxvZ2luVHlwZSAhPSAndXNlclBhc3N3b3JkJyl7XHJcbiAgICAgICAgICAgICAgICAkKCcuY2hhbmdlX3Bhc3MnKS5hZGRDbGFzcygnaGlkZScpO1xyXG4gICAgICAgICAgICB9Ki9cclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cyggZGF0YS5hbHdheXNIaWRlQ29tcGxldGVkRXZlbnRzPyAoIGRhdGEuYWx3YXlzSGlkZUNvbXBsZXRlZEV2ZW50cy50b0xvd2VyQ2FzZSgpID09IFwidHJ1ZVwiKTogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmhpZGVJbmJveEV2ZW50Q291bnRlciA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zZXRIaWRlRXZlbnRzQ291bnRlciggZGF0YS5oaWRlSW5ib3hFdmVudENvdW50ZXIgPyAoIGRhdGEuaGlkZUluYm94RXZlbnRDb3VudGVyLnRvTG93ZXJDYXNlKCkgPT0gXCJ0cnVlXCIpIDogZmFsc2UgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRpc3BsYXlJbmJveFNldHRpbmdzICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0RGlzcGxheUluYm94U2V0dGluZ3MoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MgPyAoIGRhdGEuZGlzcGxheUluYm94U2V0dGluZ3MudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIikgOiBmYWxzZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEubnVtYmVyT2ZOZXdFdmVudHMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZGF0YS5udW1iZXJPZk5ld0V2ZW50cyA9PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0TnVtYmVyT2ZDb21wbGV0ZWRFdmVudHMoIGRhdGEubnVtYmVyT2ZOZXdFdmVudHMgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgeyBcclxuICAgICAgICAgICAgICAgIHNlbGYuc2V0QXV0b01hcmtBc0NvbXBsZXRlZFRXRm9sbG93KCBkYXRhLmF1dG9NYXJrQXNDb21wbGV0ZWRUV0ZvbGxvdyA/ICggZGF0YS5hdXRvTWFya0FzQ29tcGxldGVkVFdGb2xsb3cudG9Mb3dlckNhc2UoKSA9PSBcInRydWVcIik6IGZhbHNlICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBkYXRhLmFnZW5jeUNvbmZpZ3VyYXRpb24gPT0gJ29iamVjdCcpe1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNldEFnZW5jeUNvbmZpZ3VyYXRpb24oIGRhdGEuYWdlbmN5Q29uZmlndXJhdGlvbiApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZXh0ZXJuYWxBcHBzIT09dW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGV4dGVybmFsQXBwcyA9IGRhdGEuZXh0ZXJuYWxBcHBzO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGRhdGEuZXh0ZXJuYWxBcHBzICkgKSBleHRlcm5hbEFwcHMgPSBbIGRhdGEuZXh0ZXJuYWxBcHBzIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBleHRlcm5hbEFwcHMgPSBkYXRhLmV4dGVybmFsQXBwcztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ2V4dGVybmFsQXBwcycgKVxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGV4dGVybmFsQXBwcyApXHJcblxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxBcHBzLmZvckVhY2goZnVuY3Rpb24gKCBleHRlcm5hbEFwcCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHAgKSApIGV4dGVybmFsQXBwLmV4dGVybmFsQXBwID0gWyBleHRlcm5hbEFwcC5leHRlcm5hbEFwcCBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXBwID0gZXh0ZXJuYWxBcHAuZXh0ZXJuYWxBcHA7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCAnYXBwJyApXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGFwcCApXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgYXBwLmZvckVhY2goZnVuY3Rpb24gKCB0aGlzX2FwcCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyggJ3RoaXNfYXBwJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCB0aGlzX2FwcCApXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdsZXhpdHknKSBpc19sZXhpdHlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICd3ZWVibHknKSBpc193ZWVibHlfdXNlciA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfYXBwLmFjY291bnRDb2RlID09ICdldHN5JykgaXNfZXRzeV91c2VyID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19hcHAuYWNjb3VudENvZGUgPT0gJ3Nob3BpZnknKSBpc19zaG9waWZ5X3VzZXIgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzX2FwcC5hY2NvdW50Q29kZSA9PSAnYmlnY29tbWVyY2UnKSBpc19iaWdjb21tZXJjZV91c2VyID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9ICBcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBkYXRhICk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlX3NldHRpbmdzX3dpbmRvdyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgbW9kdWxlLmdldFNldHRpbmdzKGZ1bmN0aW9uICggcmVzcCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXR0aW5nc1dpbmRvdygpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCByZXNwLmFnZW5jeU51bWJlck9mQ2xpZW50cyAhPT0gdW5kZWZpbmVkICkgJCgnLnBsYW4tdXNhZ2UgLmJyYW5kLXVzYWdlIC52YWx1ZScpLnRleHQoIHJlc3AuYWdlbmN5TnVtYmVyT2ZBY3RpdmVDbGllbnRzKyAnLycgK3Jlc3AuYWdlbmN5TnVtYmVyT2ZDbGllbnRzICk7XHJcblxyXG4gICAgICAgICAgICAvL3NldHRpbmdzV2luZG93TnVtYmVycyggcmVzcCApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdGhpcy5nZXRMaWNlbnNlT3B0aW9ucyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGxpY2Vuc2VPcHRpb25zO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2V0c3lfdXNlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX2V0c3lfdXNlcjtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pc193ZWVibHlfdXNlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX3dlZWJseV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2xleGl0eV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfbGV4aXR5X3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaXNfc2hvcGlmeV91c2VyID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXNfc2hvcGlmeV91c2VyO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmlzX2JpZ2NvbW1lcmNlX3VzZXI9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGlzX2JpZ2NvbW1lcmNlX3VzZXI7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0RXh0ZXJuYWxBcHBzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZXh0ZXJuYWxBcHBzO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmNoZWNrTGljZW5zZVZpZXcgPSBmdW5jdGlvbiAoIGlkLCBpc193aXgsIG1peHBhbmVsX3R5cGUgKVxyXG4gICAge1xyXG4gICAgICAgIC8vIGlmKCBsaWNlbnNlT3B0aW9ucy52aWV3ICE9IHVuZGVmaW5lZCAmJiBsaWNlbnNlT3B0aW9ucy52aWV3ID09ICc3RC1Pbmx5JyAmJiBpZCAhPSAnN0QnKVxyXG4gICAgICAgIGlmICggZmFsc2UgKSAvLyBlbmFibGUgYWxsIHRpbWVmcmFtZXNcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vJCh3aW5kb3cpLnRyaWdnZXIoJ3VwZ3JhZGUtcG9wdXAnLCBtaXhwYW5lbF90eXBlKTtcclxuICAgICAgICAgICAgc2hvd1VwZ3JhZGVXaW5kb3coaXNfd2l4KTtcclxuICAgICAgICAgICAgcmV0dXJuIEZBSUw7ICAgIFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZSByZXR1cm4gU1VDQ0VTUzsgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldF91c2VyX2luYm94X3RhZ3MgPSBmdW5jdGlvbiggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRVc2VyRXZlbnRzJyxcclxuICAgICAgICAgICAgc3RhcnRUaW1lOiAnMCcsXHJcbiAgICAgICAgICAgIGVuZFRpbWU6ICcwJyxcclxuICAgICAgICAgICAgcmVxdWVzdF9hY3Rpb246ICdnZXRVc2VyVGFncycsXHJcbiAgICAgICAgICAgIG1heEV2ZW50czogJzEnXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IEdFVCxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC91c2VyRXZlbnRzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnRhZ3MgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBvYmoudGFncyApICkgdXNlcl9pbmJveF90YWdzID0gb2JqLnRhZ3M7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PSAnZnVuY3Rpb24nKSBjYWxsYmFjayggb2JqICk7XHJcbiAgICAgICAgfSk7ICAgICBcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pbmJveF90YWdzID0gZnVuY3Rpb24gKCApXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXJfaW5ib3hfdGFnczsgIFxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZV9pbmJveF90YWdzID0gZnVuY3Rpb24oIHRhZ3MsIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB0YWdzID0gQXJyYXkuaXNBcnJheSggdGFncyApID90YWdzOltdO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogUE9TVCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiAndXNlci9ldmVudHMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOnsgdGFnczogdGFncyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICBFQy5zZXJ2ZXIucmVxdWVzdCggcmVxdWVzdCwgZnVuY3Rpb24gKCBvYmogKXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBvYmogfHwge307XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvL0lmIHN1Y2Nlc3MsIHVwZGF0ZSB0YWdzIGFycmF5XHJcbiAgICAgICAgICAgIGlmICggZGF0YS5yZXR1cm5Db2RlID09ICdTVUNDRVNTJyApXHJcbiAgICAgICAgICAgICAgICB1c2VyX2luYm94X3RhZ3MgPSB0YWdzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIGRhdGEgKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiB0aGlzO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIlxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbXHJcbiAgICAgICAgICAgICAgICAgICAgJyRzdGF0ZScsIFxyXG4gICAgICAgICAgICAgICAgICAgICckcm9vdFNjb3BlJywgXHJcbiAgICAgICAgICAgICAgICAgICAgJyR1cmxSb3V0ZXInLCBcclxuICAgICAgICAgICAgICAgICAgICAnRUMnLCBcclxuICAgICAgICAgICAgICAgICAgICAnRmFjZWJvb2tGZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAnTGlua2VkaW5GZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAnVHdpdHRlckZlZWQnLCBcclxuICAgICAgICAgICAgICAgICAgICAnQmxvZ2dlckZlZWQnLCBcclxuICAgICAgICAgICAgICAgICAgICAnR29vZ2xlUGx1c0ZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdZb3VUdWJlRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ1BpbnRlcmVzdEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgICdJbnN0YWdyYW1GZWVkJyxcclxuICAgICAgICAgICAgICAgICAgICAnJGluamVjdG9yJywgXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXJsUm91dGVyLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgRUMsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBGYWNlYm9va0ZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBMaW5rZWRpbkZlZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFR3aXR0ZXJGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgQmxvZ2dlckZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBHb29nbGVQbHVzRmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFlvdVR1YmVGZWVkLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgUGludGVyZXN0RmVlZCwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEluc3RhZ3JhbUZlZWQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkaW5qZWN0b3IgKVxyXG57XHJcblxyXG4gICAgZnVuY3Rpb24gU29jaWFsKCBwcm9maWxlIClcclxuICAgIHtcclxuXHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5wcm9maWxlID0gcHJvZmlsZSB8fCB7fTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5mZWVkcyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZmVlZHNfaW5fb3JkZXIgPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoX2ludGVydmFsID0gMDtcclxuXHJcbiAgICAgICAgLy9JbmJveCBmaWx0ZXJzXHJcbiAgICAgICAgdGhpcy51c2VyX2luYm94X2ZpbHRlcnMgPSBbXTsvL2dldF91c2VyX2luYm94X2ZpbHRlcnMoKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgPSAwOyBcclxuICAgICAgICB0aGlzLmZlZWRfc2VsZWN0b3JfaW5pdGlhbF90cmlnZ2VyID0gdHJ1ZTsgXHJcbiAgICB9IFxyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUucGFnZXMgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5wYWdlcztcclxuICAgIH07XHJcblxyXG4gICAgU29jaWFsLnByb3RvdHlwZS5sb2cgPSBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICBjb25zb2xlLmRpciggdGhpcyApO1xyXG4gICAgfTtcclxuXHJcbiAgICBTb2NpYWwucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oIGNvbnRhaW5lciApe1xyXG5cclxuICAgICAgICB2YXIgJGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCAkKCcjc29jaWFsJyk7XHJcblxyXG4gICAgICAgICRjb250YWluZXIuaHRtbCgnJyk7XHJcbiAgICB9O1xyXG5cclxuICAgIFNvY2lhbC5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgICAgICAvL0Fzc2lnbiBpdCB0byBnbG9iYWwgb2JqZWN0IFxyXG4gICAgICAgIC8vd2luZG93Lmdsb2JhbHMuc29jaWFsID0gdGhpczsgXHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgcHJldmlvdXNfZmVlZHMgPSBbXSxcclxuICAgICAgICAgICAgbmV3X3N0cmVhbXNfb3JkZXIgPSBbXSxcclxuICAgICAgICAgICAgcHJldl9mZWVkc19pbl9vcmRlciA9IHNlbGYuZmVlZHNfaW5fb3JkZXI7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuc29jaWFsID0gc2VsZjtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyID0gW107XHJcblxyXG4gICAgICAgIC8vZ2V0IG5ldyBzdHJlYW1zIG9yZGVyXHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKCBzZWxmLnByb2ZpbGUuc3RyZWFtcywgZnVuY3Rpb24oIHRoaXNfc3RyZWFtICl7XHJcbiAgICAgICAgICAgIHZhciBpZCA9ICggWydyc3MnLCAnc2VhcmNoJywgJ291dHJlYWNoJ10uaW5kZXhPZiggdGhpc19zdHJlYW0uc3RyZWFtSWQgKSA+IC0xICkgPyB0aGlzX3N0cmVhbS5pZCA6IHRoaXNfc3RyZWFtLnN0cmVhbUlkO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoIHNlbGYucHJvZmlsZS5pZC5pbmRleE9mKCdmYXZvcml0ZScpICE9PSAtMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkICs9ICdfJyArICB0aGlzX3N0cmVhbS5wcm9maWxlLmlkICsgJ18nICsgdGhpc19zdHJlYW0ubmV0d29yaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZXdfc3RyZWFtc19vcmRlci5wdXNoKCBpZCApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL2NvbnNvbGUubG9nKG5ld19zdHJlYW1zX29yZGVyKTtcclxuXHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gc2VsZi5wcm9maWxlLnN0cmVhbXMubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0aGlzX3N0cmVhbSA9IHNlbGYucHJvZmlsZS5zdHJlYW1zWyBpIF0sXHJcbiAgICAgICAgICAgICAgICBpZCA9ICggWydyc3MnLCAnc2VhcmNoJywgJ291dHJlYWNoJ10uaW5kZXhPZiggdGhpc19zdHJlYW0uc3RyZWFtSWQgKSA+IC0xICkgPyB0aGlzX3N0cmVhbS5pZCA6IHRoaXNfc3RyZWFtLnN0cmVhbUlkLFxyXG4gICAgICAgICAgICAgICAgbmV0d29yayA9IHNlbGYucHJvZmlsZS5hY2NvdW50LnR5cGUudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICAgICAgICAgIG5ld19mZWVkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzX3N0cmVhbS52YWx1ZSA9PSAndHJ1ZScgIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FBQTo6JytuZXR3b3JrKTtcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIG5ldHdvcmsgKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdmYWNlYm9vayc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRkIgdGVzdDo6OicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBGYWNlYm9va0ZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbGlua2VkaW4nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBMaW5rZWRpbkZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndHdpdHRlcic6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBUd2l0dGVyRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdibG9nZ2VyJzogXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld19mZWVkID0gbmV3IEJsb2dnZXJGZWVkKCB0aGlzX3N0cmVhbSwgdGhpcy5wcm9maWxlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dvb2dsZXBsdXMnOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgR29vZ2xlUGx1c0ZlZWQoIHRoaXNfc3RyZWFtLCB0aGlzLnByb2ZpbGUgKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAneW91dHViZSc6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZCA9IG5ldyBZb3VUdWJlRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdwaW50ZXJlc3QnOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgUGludGVyZXN0RmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdpbnN0YWdyYW0nOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQgPSBuZXcgSW5zdGFncmFtRmVlZCggdGhpc19zdHJlYW0sIHRoaXMucHJvZmlsZSApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBnZXRFeGlzdGluZ1N0YXRlID0gJHN0YXRlLmdldChuZXdfZmVlZC5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG5ld19mZWVkICYmICRzdGF0ZS5nZXQobmV3X2ZlZWQucGFnZV9pZCkgPT09IG51bGwgKVxyXG4gICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWRzX2luX29yZGVyLnB1c2goIG5ld19mZWVkICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIG5ld19mZWVkLnJlbmRlciA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2ZlZWQucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vdmFyICRuZXdfZmVlZCA9IG5ld19mZWVkLnJlbmRlcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyRjb250YWluZXIuYXBwZW5kKCAkbmV3X2ZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiggbmV3X2ZlZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IF8uZmluZExhc3RJbmRleChwcmV2X2ZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiBuZXdfZmVlZC5wYWdlX2lkfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIGluZGV4ID49IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mZWVkc19pbl9vcmRlci5wdXNoKHByZXZfZmVlZHNfaW5fb3JkZXJbaW5kZXhdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgdXBkYXRlZF9zdHJlYW1zX29yZGVyID0gW107XHJcbiAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGYuZmVlZHNfaW5fb3JkZXIsIGZ1bmN0aW9uKHRoaXNfZmVlZCl7XHJcbiAgICAgICAgICAgIHVwZGF0ZWRfc3RyZWFtc19vcmRlci5wdXNoKHRoaXNfZmVlZC5wYWdlX2lkKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgICAgICAvL0RlY2lkZSB0aGUgZmVlZCBwYWdlIHRvIHNob3cgYnkgZGVmYXVsdFxyXG4gICAgICAgIHZhciBmZWVkX3BhZ2VfdG9fc2hvdyA9ICcnO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vdG8gbWFpbnRhaW4gbGFzdCBmZWVkLXNlbGVjdG9yIHBvc2l0aW9uXHJcbiAgICAgICAgaWYoIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgJiYgc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yID09PSAwICkgXHJcbiAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiggc2VsZi5sYXN0X2FjdGl2ZV9mZWVkX3NlbGVjdG9yIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfcGFnZV90b19zaG93ID0gdXBkYXRlZF9zdHJlYW1zX29yZGVyW3NlbGYubGFzdF9hY3RpdmVfZmVlZF9zZWxlY3Rvcl07XHJcblxyXG4gICAgICAgICAgICBzZWxmLmxhc3RfYWN0aXZlX2ZlZWRfc2VsZWN0b3IgPSAwOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWRfc2VsZWN0b3JfaW5pdGlhbF90cmlnZ2VyID09PSBmYWxzZSApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmVlZF9wYWdlX3RvX3Nob3cgPSB1cGRhdGVkX3N0cmVhbXNfb3JkZXJbdXBkYXRlZF9zdHJlYW1zX29yZGVyLmxlbmd0aC0xXTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuZmVlZF9zZWxlY3Rvcl9pbml0aWFsX3RyaWdnZXIgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvL2Fzc2lnbiB1cGRhdGVkIHN0cmVhbXMgdG8gY3VycmVudCBvYmplY3RcclxuICAgICAgICBzZWxmLnVwZGF0ZWRfc3RyZWFtc19vcmRlciA9IHVwZGF0ZWRfc3RyZWFtc19vcmRlcjtcclxuXHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE9iaihpZClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IF8uZmluZExhc3RJbmRleChzZWxmLmZlZWRzX2luX29yZGVyLCB7ICBwYWdlX2lkOiBpZH0pO1xyXG4gICAgICAgICAgICByZXR1cm4gc2VsZi5mZWVkc19pbl9vcmRlcltpbmRleF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKmNvbnNvbGUubG9nKCd1cGRhdGVkX3N0cmVhbXNfb3JkZXInKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1cGRhdGVkX3N0cmVhbXNfb3JkZXIpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGZlZWRfcGFnZV90b19zaG93KTtcclxuICAgICAgICBjb25zb2xlLmxvZyhnZXRPYmooZmVlZF9wYWdlX3RvX3Nob3cpKTsqL1xyXG4gICAgICAgIHZhciBjdXJyZW50X29iaiA9IHsnbmFtZSc6J3JhbSd9Oy8vZ2V0T2JqKGZlZWRfcGFnZV90b19zaG93KTtcclxuXHJcbiAgICAgICAgJHN0YXRlLmdvKGZlZWRfcGFnZV90b19zaG93LCB7b2JqOmN1cnJlbnRfb2JqfSwge2NhY2hlOiB0cnVlfSk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCd0aGlzLmZlZWRzX2luX29yZGVyJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5mZWVkc19pbl9vcmRlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7ICAgICAgIFxyXG5cclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG4gICAgXHJcblxyXG5cclxuICAgIFxyXG5cclxuXHJcbiAgICByZXR1cm4gU29jaWFsO1xyXG59XTtcclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZmVlZF9pdGVtID0gJyc7XHJcblxyXG4gICAgICAgIHNlbGYuZGF0YSA9IGl0ZW1fZGF0YTtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQgPSBmZWVkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHNlbGYucHJvZmlsZSA9IGZlZWQucHJvZmlsZTtcclxuXHJcbiAgICAgICAgc2VsZi5lbGVtZW50ID0gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudDtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnVGltZWxpbmVGZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBCbG9nZ2VyRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZC5wcm90b3R5cGUgKTtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCbG9nZ2VyRmVlZDtcclxuXHJcbiAgICBCbG9nZ2VyRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYmxfYWxsJzogdGhpcy5nZXRCbG9nUG9zdHMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5nZXRCbG9nUG9zdHMgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEJsb2dnZXJQb3N0cycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkXHJcbiAgICAgICAgICAgIC8vbmV4dDogdGhpcy5uZXh0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2Jsb2dnZXInLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJyVjKioqKioqKioqKioqKioqKiAgZ2V0QmxvZ2dlclBvc3RzJywnY29sb3I6IGNyaW1zb24nKTtcclxuICAgICAgICAgICAgY29uc29sZS5kaXIoIG9iaiApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoubmV4dCAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5yZXR1cm5Db2RlID09PSAnRkFJTCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLm5leHQgPT09IHVuZGVmaW5lZCB8fCAhdGhpcy5uZXh0ICkge1xyXG4gICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRCbG9nZ2VyUG9zdHMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgbmV4dDogdGhpcy5uZXh0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2Jsb2dnZXInLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCclYyoqKioqKioqKioqKioqKiogIGdldEJsb2dnZXJQb3N0cyBORVhUICcsJ2NvbG9yOiBjcmltc29uJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLm5leHQgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5uZXh0O1xyXG5cclxuICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgQmxvZ2dlckZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwcCA9IHRoaXNfZGF0dW0ucHJvZmlsZVBpYz90aGlzX2RhdHVtLnByb2ZpbGVQaWM6Jyc7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmKCBwcC5pbmRleE9mKCcvLycpID09PSAwIClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLnByb2ZpbGVQaWMgPSB0aGlzX2RhdHVtLnByb2ZpbGVQaWMucmVwbGFjZSgnLy8nLCAnaHR0cHM6Ly8nKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGFbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIEJsb2dnZXJGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSBkYXRhO1xyXG5cclxuICAgICAgICBpZiAoIF8uaXNFbXB0eSggZGF0YS5uYW1lICkgKSBkYXRhLm5hbWUgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmKCB0eXBlb2YgZGF0YS5tZXNzYWdlID09ICdzdHJpbmcnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgdGhpc19kYXR1bS5tZXNzYWdlID0gLyonPGEgY2xhc3M9XCJyc3MtaXRlbS10aXRsZVwiIGhyZWY9XCInICtkYXRhLnBlcm1hbGluaysgJ1wiIHRhcmdldD1cIl9ibGFua1wiPicgK2RhdGEubmFtZSsgJzwvYT4nICsgKi9cclxuICAgICAgICAgICAgZGF0YS5tZXNzYWdlXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC88aFxcZC9naSwnPGRpdicpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC88XFwvaFxcZD4vZ2ksJzwvZGl2PicpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9jbGFzcz1cIlxcdypcIi9naSwnJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL3N0eWxlPS9naSwgJ2RhdGEtcz0nKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvd2lkdGg9L2dpLCAnZGF0YS13PScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9oZWlnaHQ9L2dpLCAnZGF0YS1oPScpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9hIGhyZWYvZ2ksICdhIHRhcmdldD1cIl9ibGFua1wiIGhyZWYnKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvPGJyXFxzKltcXC9dPz4vZ2ksICc8c3Bhbj48L3NwYW4+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVzc2FnZSA9IGRhdGEubWVzc2FnZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBCbG9nZ2VyRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIEZlZWRJdGVtID0gICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICAkaW5qZWN0b3IuZ2V0KCdUaW1lbGluZUZlZWRJdGVtJyk7XHJcblxyXG4gICAgZnVuY3Rpb24gQ29sbGFwc2libGVGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgICBcclxuICAgIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcbiAgICBDb2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZS5yZXR3ZWV0ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUucmV0d2VldDtcclxuICAgIFxyXG4gICAgQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuZmF2b3JpdGUgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5mYXZvcml0ZTtcclxuXHJcbiAgICByZXR1cm4gQ29sbGFwc2libGVGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGNvbXBpbGUnLCBmdW5jdGlvbiggJGNvbXBpbGUgKXsgIFxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgaXRlbTogJz1pdGVtJ1xyXG4gICAgICB9LFxyXG4gICAgICAvL3RlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvZmVlZC1pdGVtLmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBzY29wZS5jdiA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIGFsZXJ0KDU1KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBzY29wZS5kYXRhID0gc2NvcGUuaXRlbS5nZXRVSURhdGEoKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdmFyIHRlbXBsYXRlID0gJzxkaXYgY2xhc3M9XCJjYXJkXCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIml0ZW0gaXRlbS1hdmF0YXJcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxpbWcgc3JjPVwie3s6OmRhdGEucHJvZmlsZUltZ319XCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8aDI+e3s6OmRhdGEucHJvZmlsZU5hbWV9fTwvaDI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8cD57ezo6ZGF0YS50aW1lfX08L3A+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIml0ZW0gaXRlbS1ib2R5XCIgbmctY2xpY2s9XCJyZWZyZXNoQWNjb3VudChpdGVtKVwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPHAgY2xhc3M9XCJ0ZXN0XCI+UkFNQU1NQU1BTUFNQU1BTS4uLjwvcD4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxwIG5nLWJpbmQtaHRtbD1cImRhdGEuaXRlbVRleHRcIj48L3A+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8cCBuZy1iaW5kLWh0bWw9XCJkYXRhLml0ZW1NZWRpYVwiPjwvcD4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxwPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwic3ViZHVlZFwiPjEgTGlrZTwvYT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPGEgaHJlZj1cIiNcIiBjbGFzcz1cInN1YmR1ZWRcIj41IENvbW1lbnRzPC9hPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9wPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPG1hbmFnZS10ZXN0PjwvbWFuYWdlLXRlc3Q+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nO1xyXG5cclxuICAgICAgICAgIHRlbXBsYXRlID0gJCh0ZW1wbGF0ZSk7IFxyXG5cclxuICAgICAgICAgIC8vdGVtcGxhdGUuZmluZCgnLnRlc3QnKS5hcHBlbmQoc2NvcGUuZGF0YS5pdGVtVGVzdCk7ICAgICAgICAgICAgIFxyXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmQoICRjb21waWxlKHRlbXBsYXRlKShzY29wZSkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGNvbXBpbGUnLCBmdW5jdGlvbiggJGNvbXBpbGUgKXsgIFxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgaXRlbTogJz1pdGVtJ1xyXG4gICAgICB9LFxyXG4gICAgICAvL3RlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvZmVlZC1pdGVtLmh0bWwnLFxyXG4gICAgICBsaW5rOmZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycyl7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICcnIDtcclxuICAgICAgICAgIHN3aXRjaCggc2NvcGUuaXRlbS5jb25zdHJ1Y3Rvci5uYW1lIClcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgY2FzZSAnVGltZWxpbmVGZWVkSXRlbSc6XHJcbiAgICAgICAgICAgICAgdGVtcGxhdGUgPSAnPHRpbWVsaW5lLWZlZWQtaXRlbSBpdGVtPVwiaXRlbVwiPjwvdGltZWxpbmUtZmVlZC1pdGVtPic7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xpbmtlZGluRmVlZEl0ZW0nOlxyXG4gICAgICAgICAgICAgIHRlbXBsYXRlID0gJzxsaW5rZWRpbi1mZWVkLWl0ZW0gaXRlbT1cIml0ZW1cIj48L2xpbmtlZGluLWZlZWQtaXRlbT4nO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdJbnN0YWdyYW1GZWVkSXRlbSc6XHJcbiAgICAgICAgICAgICAgdGVtcGxhdGUgPSAnPGluc3RhZ3JhbS1mZWVkLWl0ZW0gaXRlbT1cIml0ZW1cIj48L2luc3RhZ3JhbS1mZWVkLWl0ZW0+JztcclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSAnQ29sbGFwc2libGVGZWVkSXRlbSc6XHJcbiAgICAgICAgICAgICAgdGVtcGxhdGUgPSAnPGNvbGxhcHNpYmxlLWZlZWQtaXRlbSBpdGVtPVwiaXRlbVwiPjwvY29sbGFwc2libGUtZmVlZC1pdGVtPic7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbSc6XHJcbiAgICAgICAgICAgICAgdGVtcGxhdGUgPSAnPGxpbmtlZGluLWNvbGxhcHNpYmxlLWZlZWQtaXRlbSBpdGVtPVwiaXRlbVwiPjwvbGlua2VkaW4tY29sbGFwc2libGUtZmVlZC1pdGVtPic7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgJ1R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtJzpcclxuICAgICAgICAgICAgICB0ZW1wbGF0ZSA9ICc8dHdpdHRlci1jb2xsYXBzaWJsZS1mZWVkLWl0ZW0gaXRlbT1cIml0ZW1cIj48L3R3aXR0ZXItY29sbGFwc2libGUtZmVlZC1pdGVtPic7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgIHRlbXBsYXRlID0gJzx0aW1lbGluZS1mZWVkLWl0ZW0gaXRlbT1cIml0ZW1cIj48L3RpbWVsaW5lLWZlZWQtaXRlbT4nO1xyXG5cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvL3RlbXBsYXRlLmZpbmQoJy50ZXN0JykuYXBwZW5kKHNjb3BlLmRhdGEuaXRlbVRlc3QpOyAgICAgICAgICAgICBcclxuICAgICAgICAgIGVsZW1lbnQuYXBwZW5kKCAkY29tcGlsZSh0ZW1wbGF0ZSkoc2NvcGUpICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRjb21waWxlJywgZnVuY3Rpb24oICRjb21waWxlICl7ICBcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGl0ZW06ICc9aXRlbSdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9mZWVkLWl0ZW0uaHRtbCcsXHJcbiAgICAgIGxpbms6ZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHNjb3BlLmFhYSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGFsZXJ0KDQ0NCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgc2NvcGUuZGF0YSA9IHNjb3BlLml0ZW0uZ2V0VUlEYXRhKCk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHZhciAkdGhpcyA9ICQoZWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL2xpa2VzICwgY29tbWVudHNcclxuICAgICAgICAgIGlmKCBzY29wZS5kYXRhLmxjX2Rpc3AgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGlmKCAhICQuaXNFbXB0eU9iamVjdChzY29wZS5kYXRhLmxpa2VzICkgKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgdmFyICRsaWtlcyA9ICc8c3BhbiBuZy1jbGljaz1cImFhYSgpXCI+JytzY29wZS5kYXRhLmxpa2VzLnRleHQrJzwvc3Bhbj4nO1xyXG4gICAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmZpbmQoJy5pdGVtLWxpa2VzLWNvbW1lbnRzJykuYXBwZW5kKCAkY29tcGlsZSgkbGlrZXMpKHNjb3BlKSApO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgaWYoICEgJC5pc0VtcHR5T2JqZWN0KHNjb3BlLmRhdGEuY29tbWVudHMgKSApXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgJGNvbW1lbnRzID0gJzxzcGFuID4nK3Njb3BlLmRhdGEuY29tbWVudHMudGV4dCsnPC9zcGFuPic7XHJcbiAgICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZmluZCgnLml0ZW0tbGlrZXMtY29tbWVudHMnKS5hcHBlbmQoICRjb21waWxlKCRjb21tZW50cykoc2NvcGUpICk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiggISAkLmlzRW1wdHlPYmplY3Qoc2NvcGUuZGF0YS5zaGFyZXMgKSApXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICB2YXIgJHNoYXJlcyA9ICc8c3BhbiA+JytzY29wZS5kYXRhLnNoYXJlcy50ZXh0Kyc8L3NwYW4+JztcclxuICAgICAgICAgICAgICAgICAgJChlbGVtZW50KS5maW5kKCcuaXRlbS1saWtlcy1jb21tZW50cycpLmFwcGVuZCggJGNvbXBpbGUoJHNoYXJlcykoc2NvcGUpICk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvL3RlbXBsYXRlLmZpbmQoJy50ZXN0JykuYXBwZW5kKHNjb3BlLmRhdGEuaXRlbVRlc3QpOyAgICAgICAgICAgICBcclxuICAgICAgICAgIC8vZWxlbWVudC5hcHBlbmQoICRjb21waWxlKHRlbXBsYXRlKShzY29wZSkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIEZlZWRJdGVtID0gIEZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuICAgIFxyXG5cclxuICAgIGZ1bmN0aW9uIERyb3Bkb3duRmVlZEl0ZW0gKCBpdGVtX2RhdGEsIGZlZWQgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWRJdGVtLmFwcGx5KCB0aGlzLCBbIGl0ZW1fZGF0YSwgZmVlZCBdKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXh0ID0gJyc7XHJcbiAgICAgICAgdGhpcy5kZWZhdWx0X2VsZW1lbnQgPSBmZWVkLmRlZmF1bHRfZWxlbWVudCB8fCAnJztcclxuICAgIH1cclxuXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICAgXHJcbiAgICBEcm9wZG93bkZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERyb3Bkb3duRmVlZEl0ZW07XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHM7XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXM7XHJcblxyXG4gICAgRHJvcGRvd25GZWVkSXRlbS5wcm90b3R5cGUuZ2V0X2Ryb3Bkb3duID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGRyb3Bkb3duID0gW10sXHJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5kYXRhLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2VsZi5kYXRhID0gc2VsZi5kYXRhLnNvcnQoZnVuY3Rpb24gKCBhLCBiICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuYW1lQSA9ICggdHlwZW9mIGEubmFtZSA9PT0gJ3N0cmluZycgPyBhLm5hbWUudG9Mb3dlckNhc2UoKSA6ICcnICk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmFtZUIgPSAoIHR5cGVvZiBiLm5hbWUgPT09ICdzdHJpbmcnID8gYi5uYW1lLnRvTG93ZXJDYXNlKCkgOiAnJyApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggbmFtZUEgPiBuYW1lQiApIHJldHVybiAxO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuYW1lQSA8IG5hbWVCICkgcmV0dXJuIC0xO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmRhdGEgPSBzZWxmLmRhdGEuc29ydChmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZUEgPSAoIHR5cGVvZiBhLmNoYW5uZWxUaXRsZSA9PT0gJ3N0cmluZycgPyBhLmNoYW5uZWxUaXRsZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZUIgPSAoIHR5cGVvZiBiLmNoYW5uZWxUaXRsZSA9PT0gJ3N0cmluZycgPyBiLmNoYW5uZWxUaXRsZS50b0xvd2VyQ2FzZSgpIDogJycgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBuYW1lQSA+IG5hbWVCICkgcmV0dXJuIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuYW1lQSA8IG5hbWVCICkgcmV0dXJuIC0xO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIHJldHVybiAwO1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IHNlbGYuZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19ncm91cCA9IHNlbGYuZGF0YVsgaSBdLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwX2lkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzX2dyb3VwID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19ncm91cC5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoaXNfZ3JvdXAuY2hhbm5lbFRpdGxlXHJcbiAgICAgICAgICAgICAgICAgICAgfTsgIFxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgZ3JvdXBfaWQgPSB0aGlzX2dyb3VwLmlkO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKSBncm91cF9pZCA9IHRoaXNfZ3JvdXAuaWRfc3RyO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBkcm9wZG93bi5wdXNoKHsnaWQnOmdyb3VwX2lkLCAnbmFtZSc6dGhpc19ncm91cC5uYW1lLCAnZGF0YSc6dGhpc19ncm91cH0pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoKCB0aGlzLmZlZWQuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaXN0cyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGlfYm9hcmQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPSAnWW91IGRvIG5vdCBoYXZlIGJvYXJkcyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlcyc6XHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wYWdlc19vbmx5JzpcclxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlciA9J1lvdSBkbyBub3QgaGF2ZSBwYWdlcyB5ZXQuJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbl9jb21wYW5pZXMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBkbyBub3QgZm9sbG93IGFueSBjb21wYW55IHlldC4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlTdWJzY3JpcHRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyID0gJ1lvdSBoYXZlblxcJ3QgYWRkZWQgYW55IHN1YnNjcmlwdGlvbnMgeWV0Lic7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYl9saWtlcyc6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAoJ1lvdSBoYXZlblxcJ3QgbGlrZWQgYW55IHBhZ2VzIHlldC4nKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXIgPSAnWW91IGFyZSBub3QgYSBtZW1iZXIgb2YgYW55IGdyb3Vwcy4nO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geyAnY291bnQnOmRyb3Bkb3duLmxlbmd0aCwgJ2RhdGEnOmRyb3Bkb3duLCAncGxhY2Vob2xkZXInOiBwbGFjZWhvbGRlcn07XHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLnNldF9kZWZhdWx0X2dyb3VwX2lkID0gZnVuY3Rpb24gKCBzZWxfb2JqIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICRfdGhpcyA9IHNlbF9vYmo7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJF90aGlzLmRhdGEuaWQ7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkZWxtLmRhdGEoJ2RhdGEnKS5pZF9zdHI7XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLmlkID09ICdsaXN0cycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZS5saXN0cy5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDsgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dGluZyBvZiBkZWZhdWx0IGdyb3VwIGlkXHJcbiAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLnVwZGF0ZUZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCB0cnVlICk7XHJcblxyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC51cGRhdGVJbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoIHVwZGF0ZUZlZWROb3RpZmljYXRpb24sIDUqNjAqMTAwMCwgc2VsZi5mZWVkICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Ugc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ3NldERlZmF1bHRHcm91cElkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIC8vZGVmYXVsdEdyb3VwSWQ6ICQoIHRoaXMgKS5kYXRhKCdkYXRhJykuaWQsXHJcbiAgICAgICAgICAgIGRlZmF1bHRHcm91cElkOiBzZWxmLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCxcclxuICAgICAgICAgICAgbmV0d29yazogc2VsZi5mZWVkLm5ldHdvcmtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6IFwiZmVlZC9kZWZhdWx0R3JvdXBJZFwiLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCAnc2V0dGluZyBzZXREZWZhdWx0R3JvdXBJZDogJyArIGdyb3VwX2lkIClcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8qdmFyIGRhdGEgPSBKU09OLnBhcnNlKCByZXNwICk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCAnc2V0IHJlc3BvbnNlOicgKVxyXG4gICAgICAgICAgICBjb25zb2xlLmRpciggZGF0YSApKi9cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBzZWxfb2JqIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgICRfdGhpcyA9IHNlbF9vYmo7XHJcbiAgICAgICAgICAgIGdyb3VwX2lkID0gJF90aGlzLmRhdGEuaWQ7XHJcblxyXG4gICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JvdXBfaWQgPSAkZWxtLmRhdGEoJ2RhdGEnKS5pZF9zdHI7XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLmlkID09ICdsaXN0cycpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZS5saXN0cy5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDsgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vc2V0dGluZyBvZiBkZWZhdWx0IGdyb3VwIGlkXHJcbiAgICAgICAgc2VsZi5kZWZhdWx0X2VsZW1lbnQgPSBncm91cF9pZDtcclxuICAgICAgICBcclxuICAgICAgICBzZWxmLmZlZWQuZGVmYXVsdF9lbGVtZW50ID0gZ3JvdXBfaWQ7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLnVwZGF0ZUZlZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9zZWxmLmZlZWQuY2xlYXJGZWVkTm90aWZpY2F0aW9uKCB0cnVlICk7XHJcblxyXG4gICAgICAgICAgICAvL3NlbGYuZmVlZC51cGRhdGVJbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoIHVwZGF0ZUZlZWROb3RpZmljYXRpb24sIDUqNjAqMTAwMCwgc2VsZi5mZWVkICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmZlZWQuZmlyc3RJdGVtSUQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdnb29nbGVwbHVzJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Ugc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgPSBncm91cF9pZDtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7IHR5cGU6ICdHRVQnIH0sXHJcbiAgICAgICAgICAgIGRhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBncm91cElkOiAkX3RoaXMuZGF0YS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCR3JvdXAnLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dDogc2VsZi5uZXh0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICByZXF1ZXN0LnVybCA9ICdmZWVkL2ZiR3JvdXAnO1xyXG5cclxuICAgICAgICByZXF1ZXN0LmRhdGEgPSBkYXRhO1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcCxcclxuICAgICAgICAgICAgICAgIGl0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICdsaW5rZWRpbicgKSBzZWxmLm5leHQgPSAyNTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS52YWx1ZXMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRhdGEuZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdsaW5rZWRpbicpIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGRhdGEudmFsdWVzWyAwIF0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGogPSAwLCBtID0gZGF0YS52YWx1ZXMubGVuZ3RoOyBqIDwgbTsgaisrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc192YWwgPSBkYXRhLnZhbHVlc1sgaiBdO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3VtbWFyeSA9IHRoaXNfdmFsLnN1bW1hcnkgfHwgJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZV9zdW1tYXJ5ID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpc192YWwudXBkYXRlQ29udGVudCAhPT0gdW5kZWZpbmVkICYmIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZSAhPT0gdW5kZWZpbmVkICYmIHRoaXNfdmFsLnVwZGF0ZUNvbnRlbnQuY3VycmVudFVwZGF0ZS5jb250ZW50ICE9PSB1bmRlZmluZWQpIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gdGhpc192YWwudXBkYXRlQ29udGVudC5jdXJyZW50VXBkYXRlLmNvbnRlbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGNvbnRlbnQudGl0bGUgIT09IHVuZGVmaW5lZCAmJiBjb250ZW50LnN1Ym1pdHRlZFVybCAhPT0gdW5kZWZpbmVkICYmICEoL1xcLihqcGd8anBlZ3xwbmd8Ym1wfHRpZmZ8YXZpfG1wZWd8bWt2fG9nZ3xtb3Z8bXBlZ3xtcGd8bXBlfGZsdnwzZ3B8Z2lmKSQvaSkudGVzdChjb250ZW50LnRpdGxlKSApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeSA9ICc8YSBocmVmPVwiamF2YXNjcmlwdDo7XCIgb25DbGljaz1cIkVDLlVJLklBQihcXCcnICsgY29udGVudC5zdWJtaXR0ZWRVcmwgKyAnXFwnKTtcIj4nICsgY29udGVudC50aXRsZSArICc8L2E+ICc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZGF0YVsgaiBdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc192YWwuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnPHA+PHNwYW4gY2xhc3M9XCJsbi1ncm91cC10aXRsZVwiPicgKyB0aGlzX3ZhbC50aXRsZSArICc6PC9zcGFuPjwvcD4nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVfc3VtbWFyeTogcHJlX3N1bW1hcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHN1bW1hcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21OYW1lOiAoIHRoaXNfdmFsLmNyZWF0b3IuZmlyc3ROYW1lLnRvTG93ZXJDYXNlKCkgPT0gJ3ByaXZhdGUnID8gdGhpc192YWwuY3JlYXRvci5maXJzdE5hbWUgOiB0aGlzX3ZhbC5jcmVhdG9yLmZpcnN0TmFtZSArICcgJyArIHRoaXNfdmFsLmNyZWF0b3IubGFzdE5hbWUgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpYzogdGhpc192YWwuY3JlYXRvci5waWN0dXJlVXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVUaW1lOiBwYXJzZUludCggdGhpc192YWwuY3JlYXRpb25UaW1lc3RhbXAgKSAvIDEwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb21JZDogdGhpc192YWwuY3JlYXRvci5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWVudHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiB0aGlzX3ZhbC5jb21tZW50cy5fdG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tZW50OiB0aGlzX3ZhbC5jb21tZW50cy52YWx1ZXMgfHwgW11cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGlrZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiB0aGlzX3ZhbC5saWtlcy5fdG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaWtlOiAoIHRoaXNfdmFsLmxpa2VzLnZhbHVlcyA9PT0gdW5kZWZpbmVkID8gW10gOiB0aGlzX3ZhbC5saWtlcy52YWx1ZXMuY3JlYXRvciApIHx8IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc2hpcDogdGhpc192YWwucmVsYXRpb25Ub1ZpZXdlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlcl9saWtlczogdGhpc192YWwucmVsYXRpb25Ub1ZpZXdlci5pc0xpa2VkIHx8IFwiZmFsc2VcIlxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gMjU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YS5uZXh0VG9rZW47XHJcbiAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBkYXRhLmRhdGEuaXRlbXM7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgKSBzZWxmLm5leHQgPSBkYXRhLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT09ICdwaW50ZXJlc3QnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT09ICdGQUlMJyB8fCAoIGRhdGEuZGF0YS5zdGF0dXMgJiYgZGF0YS5kYXRhLnN0YXR1cyA9PT0gJ2ZhaWx1cmUnICkgKSBkYXRhLmRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSBkYXRhLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHBhZ2UgJiYgcGFnZS5jdXJzb3IgKSBzZWxmLm5leHQgPSBwYWdlLmN1cnNvcjtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLmRhdGEgPSBkYXRhLmRhdGEuZGF0YTsgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IGRhdGEucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YS5kYXRhICkgKSBpdGVtcyA9IFsgZGF0YS5kYXRhIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpdGVtcyA9IGRhdGEuZGF0YTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGl0ZW1zLmxlbmd0aCA+IDAgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJykgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gaXRlbXNbIDAgXS5pZF9zdHI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ2xpbmtlZGluJyApIHNlbGYuZmVlZC5maXJzdEl0ZW1JRCA9IGl0ZW1zWyAwIF0uaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PT0gJ2dvb2dsZXBsdXMnICkgc2VsZi5mZWVkLmZpcnN0SXRlbUlEID0gaXRlbXNbIDAgXS5wb3N0SUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGl0ZW1zLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3X2dyb3VwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGl0ZW1zWyBpIF0uaWRfc3RyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjogaXRlbXNbIGkgXS51c2VyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGl0ZW1zWyBpIF0uY3JlYXRlZF9hdCApLmdldFRpbWUoKSAvIDEwMDAgKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYXZvcml0ZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGl0ZW1zWyBpIF0uZmF2b3JpdGVfY291bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5X21lOiBpdGVtc1sgaSBdLmZhdm9yaXRlZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0d2VldHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGl0ZW1zWyBpIF0ucmV0d2VldF9jb3VudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnlfbWU6IGl0ZW1zWyBpIF0ucmV0d2VldGVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogKCAoIGl0ZW1zWyBpIF0ucmV0d2VldGVkX3N0YXR1cyAhPT0gdW5kZWZpbmVkICkgPyBpdGVtc1sgaSBdLnJldHdlZXRlZF9zdGF0dXMuaWRfc3RyIDogaXRlbXNbIGkgXS5pZF9zdHIgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogaXRlbXNbIGkgXS50ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb21OYW1lOiAoIGl0ZW1zWyBpIF0ubmFtZSB8fCBpdGVtc1sgaSBdLnVzZXIubmFtZSApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiAoIGl0ZW1zWyBpIF0uc2NyZWVuX25hbWUgfHwgaXRlbXNbIGkgXS51c2VyLnNjcmVlbl9uYW1lICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZVBpYzogKCBpdGVtc1sgaSBdLnByb2ZpbGVfaW1hZ2VfdXJsIHx8IGl0ZW1zWyBpIF0udXNlci5wcm9maWxlX2ltYWdlX3VybCApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RJRDogaXRlbXNbIGkgXS5pZF9zdHIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGl0ZW1zWyBpIF0uaWRfc3RyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhd19kYXRhOiBpdGVtc1sgaSBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggaXRlbXNbIGkgXS5lbnRpdGllcyAhPT0gdW5kZWZpbmVkICYmIGl0ZW1zWyBpIF0uZW50aXRpZXMubWVkaWEgIT09IHVuZGVmaW5lZCAmJiBBcnJheS5pc0FycmF5KCBpdGVtc1sgaSBdLmVudGl0aWVzLm1lZGlhLm1lZGlhX3VybCApIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0gc2VsZi5nZXRfbWVkaWFfZGF0YSggaXRlbXNbIGkgXS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgc2VsZi5mZWVkICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLmlkID09ICdsbl9jb21wYW5pZXMnICkgbmV3X2dyb3VwID0gbmV3IExpbmtlZGluRmVlZEl0ZW0oIGl0ZW1zWyBpIF0sIHNlbGYuZmVlZCApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBzZWxmLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtID0gc2VsZi5mZWVkLmZvcm1hdF9pdGVtKCBpdGVtc1sgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3X2dyb3VwID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHNlbGYuZmVlZCApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bSA9IHNlbGYuZmVlZC5mb3JtYXRfaXRlbSggaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09PSAncGludGVyZXN0JyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0gPSBzZWxmLmZlZWQuZm9ybWF0X2l0ZW0oIGl0ZW1zWyBpIF0gKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld19ncm91cCA9IG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCBzZWxmLmZlZWQgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdfZ3JvdXAgPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggaXRlbXNbIGkgXSwgc2VsZi5mZWVkICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZlZWQuaXRlbXMucHVzaCggbmV3X2dyb3VwICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIERyb3Bkb3duRmVlZEl0ZW0ucHJvdG90eXBlLmdldF9tZWRpYV9kYXRhID0gZnVuY3Rpb24gKCBtZWRpYV91cmxzIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IFtdO1xyXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtZWRpYV91cmxzLCBmdW5jdGlvbihtZWRpYV91cmwpe1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgIHNyYzogbWVkaWFfdXJsXHJcbiAgICAgICAgICAgIH0pOyAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTtcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRHJvcGRvd25GZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCAnQ29sbGFwc2libGVGZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIERyb3Bkb3duRmVlZEl0ZW0sIENvbGxhcHNpYmxlRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBGYWNlYm9va0ZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggcHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSAhPT0gJ1VzZXInICYmIFsnd2FsbFBvc3RzJywnZmJfbm90aWZpY2F0aW9ucyddLmluZGV4T2YoIHN0cmVhbS5zdHJlYW1JZCApICE9PSAtMSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUZlZWQgPSB0cnVlOyAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZhY2Vib29rRmVlZDtcclxuXHJcbiAgICAvKkZhY2Vib29rRmVlZC5wcm90b3R5cGUudXBkYXRlRmVlZE5vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzIFxyXG4gICAgICAgICAgICAsY3VycmVudElEID0gc2VsZi51cGRhdGVJbnRlcnZhbElEO1xyXG5cclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TmV3c0ZlZWQnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIHVybDogJy9hamF4LnBocCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBzd2l0Y2ggKCBzZWxmLmlkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ3dhbGxQb3N0cyc6IHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnd2FsbFBvc3RzJzsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS53YWxsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmxpbWl0ID0gMTA7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmJfbm90aWZpY2F0aW9ucyc6IHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnbm90aWZpY2F0aW9ucyc7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEud2FsbCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEubGltaXQgPSAxMDtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbkJveCc6IHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnaW5Cb3gnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5hY3Rpb24gPSAnZ2V0RmJDb252ZXJzaW9ucyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCBzZWxmLnByb2ZpbGUuZGF0YS5wYWdlQ2F0ZWdvcnkgPT09IFwiVXNlclwiKSByZXF1ZXN0LmRhdGEubmV4dCA9IFwiL2luYm94XCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEubmV4dCA9IFwiL2NvbnZlcnNhdGlvbnNcIjtcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKCByZXNwb25zZSApO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjdXBkYXRlRmVlZE5vdGlmaWNhdGlvbignICsgc2VsZi5pZCArICcpIHJlc3BvbnNlOicsICdjb2xvcjpvcmFuZ2VyZWQnKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIGRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggY3VycmVudElEID09PSBzZWxmLnVwZGF0ZUludGVydmFsSUQgKSAvLyBkaWRuJ3QgcmVmcmVzaCBkdXJpbmcgcmVxdWVzdFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZmlyc3RJRCA9ICcjIyMnO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuZmlyc3RJdGVtSUQgKSBmaXJzdElEID0gc2VsZi5maXJzdEl0ZW1JRDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZmlyc3RJRCA6OiAnICsgZmlyc3RJRCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbWluY29taW5nID0gW107IC8vIGluY29taW5nIG1lc3NhZ2VzIGFycmF5XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdpbkJveCcgJiYgZmlyc3RJRCAhPT0gJyMjIycgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXNlcklkID0gc2VsZi5wcm9maWxlLmRhdGEucGFnZUlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tbWVudHMgPSBkYXRhLmRhdGFbIGkgXS5jb21tZW50cy5jb21tZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIGNvbW1lbnRzICkgKSBjb21tZW50cyA9IFsgY29tbWVudHMgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgayA9IDAsIGxsID0gY29tbWVudHMubGVuZ3RoOyBrIDwgbGw7IGsrKyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRoaXNfY29tbWVudCA9IGNvbW1lbnRzWyBrIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpc19jb21tZW50LmZyb21JZCAhPT0gY3VzZXJJZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzX2NvbW1lbnQsIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZTogbmV3IERhdGUoIHRoaXNfY29tbWVudC5jcmVhdGVkVGltZS5zcGxpdCgnKycpWyAwIF0gKS5nZXRUaW1lKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19jb21tZW50Lm1lc3NhZ2VJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggbWluY29taW5nICk7IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IG1pbmNvbWluZy5tYXAoZnVuY3Rpb24oaXRlbSl7cmV0dXJuICggaXRlbS50aW1lID4gZmlyc3RJRCA/IDEgOiAwICk7fSkucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgKyBiOyB9LCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coICdpbkJveCBpbmRleCA9ICcgKyBpbmRleCApOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gIG1pbmNvbWluZy5sZW5ndGggKSBzZWxmLmNsZWFyRmVlZE5vdGlmaWNhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBkYXRhLmRhdGEubWFwKGZ1bmN0aW9uKGl0ZW0pe3JldHVybiBpdGVtLmlkO30pLmluZGV4T2YoIGZpcnN0SUQgKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09IC0xIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggZmlyc3RJRCA9PT0gJyMjIycgKSBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2luZGV4IDo6ICcgKyBpbmRleCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpbmRleCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciAkaGVhZGVyID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWhlYWRlcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICwkZmJvZHkgPSBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgJHVwZGF0ZV9ub3RpZiA9ICRmYm9keS5maW5kKCcudXBkYXRlLW5vdGlmaWNhdGlvbicpOyBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAkdXBkYXRlX25vdGlmLmxlbmd0aCA9PT0gMCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmID0gJCgnPGRpdiBjbGFzcz1cInVwZGF0ZS1ub3RpZmljYXRpb25cIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZi5vbignY2xpY2snLCBmdW5jdGlvbiAoIGUgKXsgJGhlYWRlci5maW5kKCcucmVmcmVzaC1mZWVkJykudHJpZ2dlcignY2xpY2snKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRmYm9keS5maW5kKCcuZmVlZC1pdGVtJykuZmlyc3QoKS5iZWZvcmUoICR1cGRhdGVfbm90aWYgKTtcclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT09ICdpbkJveCcgKSAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IG1pbmNvbWluZy5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBNZXNzYWdlJyArICggaW5kZXggPT0gMSA/ICcnIDogJ3MnICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHNlbGYuaWQgPT09ICd3YWxsUG9zdHMnICkgJHVwZGF0ZV9ub3RpZi50ZXh0KCdWaWV3ICcgKyAoIGluZGV4ID09PSBkYXRhLmRhdGEubGVuZ3RoID8gaW5kZXggKyAnKycgOiBpbmRleCApICsgJyBuZXcgUG9zdCcgKyAoIGluZGV4ID09IDEgPyAnJyA6ICdzJyApICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBlbHNlICR1cGRhdGVfbm90aWYudGV4dCgnVmlldyAnICsgKCBpbmRleCA9PT0gZGF0YS5kYXRhLmxlbmd0aCA/IGluZGV4ICsgJysnIDogaW5kZXggKSArICcgbmV3IE5vdGlmaWNhdGlvbicgKyAoIGluZGV4ID09IDEgPyAnJyA6ICdzJyApICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGNvbnNvbGUuZXJyb3IoJyEhISBjdXJyZW50SUQgISEhJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9OyovICBcclxuXHJcbiAgICBGYWNlYm9va0ZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gcmVxdWVzdHMgZGF0YSBhbmQgdGhlbiBjYWxscyB0aGlzLnNhdmVfaXRlbXNcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbmV3c0ZlZWQnOiB0aGlzLmdldE5ld3NGZWVkKFwibmV3c0ZlZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd3YWxsUG9zdHMnOiB0aGlzLmdldE5ld3NGZWVkKFwid2FsbFBvc3RzXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncGFnZXNGZWVkJzogdGhpcy5nZXROZXdzRmVlZChcInBhZ2VzRmVlZFwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2luQm94JzogdGhpcy5nZXRGYkNvbnZlcnNpb25zKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdoaWRkZW5fZ3JvdXBzJzogdGhpcy5maWxsRkJIaWRkZW5fR3JvdXBzKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0aW1lbGluZSc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJ0aW1lbGluZVwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NlYXJjaCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJzZWFyY2hcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdvdXRyZWFjaCc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJzZWFyY2hcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYl9ub3RpZmljYXRpb25zJzogdGhpcy5nZXROZXdzRmVlZChcIm5vdGlmaWNhdGlvbnNcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYl9saWtlcyc6IHRoaXMuZ2V0TmV3c0ZlZWQoXCJmYl9saWtlc1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdmYl9saWtlcycgfHwgdGhpcy5pZCA9PSAnb3V0cmVhY2gnIHx8ICggdGhpcy5pZCA9PSAnbmV3c0ZlZWQnICYmICF0aGlzLm5leHQgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvL3RoaXMuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpOyBcclxuICAgICAgICAgICAgLy90aGlzLmhpZGVfcHVsbHVwKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2RvRmJSZXF1ZXN0JyxcclxuICAgICAgICAgICAgICAgIHdhbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHJlYW06IHRoaXMuaWQsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBuZXh0OiB0aGlzLm5leHRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICduZXdzRmVlZCc6XHJcbiAgICAgICAgICAgICAgICBkYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzpcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpOyBcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gY2FzZSAnd2FsbFBvc3RzJzpcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAvLyBjYXNlICdwYWdlc0ZlZWQnOlxyXG4gICAgICAgICAgICAvLyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ2luQm94JzpcclxuICAgICAgICAgICAgLy8gICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEucGFnZUNhdGVnb3J5ID09IFwiVXNlclwiKSBkYXRhLm5leHQgPSAnL2luYm94JztcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBlbHNlIGRhdGEubmV4dCA9ICcvY29udmVyc2F0aW9ucyc7XHJcbiAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaGlkZGVuX2dyb3Vwcyc6XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IHNlbGYuc3RyZWFtLnNlbGVjdGVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnZ2V0RkJHcm91cCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwRmVlZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IHNlbGYubmV4dFxyXG4gICAgICAgICAgICAgICAgICAgIH07ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gIFxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZiX25vdGlmaWNhdGlvbnMnOlxyXG4gICAgICAgICAgICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnN0cmVhbSA9ICdub3RpZmljYXRpb25zJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvZmJNb3JlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgICAgIHNlbGYubG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTsgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRhdGEucGFnaW5nICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi5uZXh0ID09IGRhdGEucGFnaW5nLm5leHQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2Ugc2VsZi5uZXh0ID0gZGF0YS5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5nZXROZXdzRmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RyZWFtOiBzdHJlYW0sXHJcbiAgICAgICAgICAgIGxpbWl0OiAxMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGRhdGEud2FsbCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoIHN0cmVhbSA9PSAnd2FsbFBvc3RzJyB8fCBzdHJlYW0gPT0gJ2ZiX2luZmx1ZW5jZXMnIHx8IHN0cmVhbSA9PSAndGltZWxpbmUnICkgZGF0YS53YWxsID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL25ld3MnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCBzdHJlYW0gPT0gJ3NlYXJjaCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUgPT09IHVuZGVmaW5lZCApIC8vZW1wdHkgc2VhcmNoIGZlZWRcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5ICE9PSB1bmRlZmluZWQgJiYgc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnkubGVuZ3RoID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZWFyY2hfcmVxdWVzdCggc2VsZiwgZnVuY3Rpb24oIGRhdGEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy9pZiggRUMucXVldWVfbGlzdFsgQmFzZTY0LmVuY29kZSggSlNPTi5zdHJpbmdpZnkoIHJlcXVlc3QgKSApIF0gIT09IHVuZGVmaW5lZCApIHJldHVybjtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVxdWVzdCk7XHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLnBhZ2luZyAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggc3RyZWFtID09ICdub3RpZmljYXRpb25zJyAmJiBvYmoubWVzc2FnZS5pbmRleE9mKCd5b3UgZG8gbm90IGhhdmUgc3VmZmljaWVudCBwZXJtaXNzaW9uJykgIT0gLTEgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxkaXYgY2xhc3M9XCJmZWVkLWl0ZW1cIj48ZGl2IGNsYXNzPVwiZmVlZC1hbGVydFwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0NsaWNrIFwiT0tcIiB0byBhZGQgRmFjZWJvb2sgTm90aWZpY2F0aW9uIEZlZWQuJyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJyZWZyZXNoXCI+T0s8L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8L2Rpdj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5vbignY2xpY2snLCAnLnJlZnJlc2gnLCBmdW5jdGlvbiAoIGV2ZW50IClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlkID0gc2VsZi5wcm9maWxlLmFjY291bnQuaWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC50eXBlLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygncmVmcmVzaCAnLCBpZCApXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVuZXdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZW5BZGRBY2NvdW50UG9wdXAoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvd05hbWU6ICdDb25uZWN0V2l0aE9BdXRoJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dPcHRpb25zOiAnZGlyZWN0b3JpZXM9MCxsb2NhdGlvbj0wLHN0YXR1cz0wLG1lbnViYXI9MCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJ2FjY291bnQvYWNjb3VudD9hY3Rpb249c2V0RXhwaXJlZEtleUJ5SUQmaWQ9JyAraWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDYwMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IDY1MFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5nZXRGYkNvbnZlcnNpb25zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRGYkNvbnZlcnNpb25zJyxcclxuICAgICAgICAgICAgc3RyZWFtOiAnaW5Cb3gnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggIXRoaXMubmV4dCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLnBhZ2VDYXRlZ29yeSA9PSBcIlVzZXJcIikgZGF0YS5uZXh0ID0gXCIvaW5ib3hcIjtcclxuXHJcbiAgICAgICAgICAgIGVsc2UgZGF0YS5uZXh0ID0gXCIvY29udmVyc2F0aW9uc1wiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBkYXRhLm5leHQgPSB0aGlzLm5leHQ7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9mYkNvbnZlcnNpb25zJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5sZW5ndGggPCAxIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdXIgaW5ib3ggaXMgZW1wdHkuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmoucGFnaW5nICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5jb2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgRmFjZWJvb2tGZWVkLnByb3RvdHlwZS5maWxsRkJIaWRkZW5fR3JvdXBzID0gZnVuY3Rpb24gKClcclxuICAgIHsgICBcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGkgPSAwLFxyXG4gICAgICAgICAgICBsID0gMDtcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEZCSGlkZGVuX0dyb3VwcycsXHJcbiAgICAgICAgICAgIHN0cmVhbTogJ2dyb3VwcycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5uZXh0ICkgZGF0YS5uZXh0X3Bvc3RzID0gXCJcIjtcclxuXHJcbiAgICAgICAgZWxzZSBkYXRhLm5leHRfcG9zdHMgPSB0aGlzLm5leHQ7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9mYkhpZGRlbkdyb3VwcycsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5wYWdpbmcubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBzZWxlY3RlZF9pZCxcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9uYW1lID0gJyc7XHJcbiAgICAgICAgICAgICAgICAvL2dldCBmaXJzdCBncm91cCBpZiBubyBzZWxlY3RlZFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCA9PSAnX2RlZmF1bHRfJyApLy8kLmlzRW1wdHlPYmplY3QoIHNlbGYuc3RyZWFtLnNlbGVjdGVkICkgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZF9pZCA9IG9iai5kYXRhWyAwIF0uaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9IG9iai5kYXRhWyAwIF0ubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdHJlYW0uc2VsZWN0ZWQgPSBvYmouZGF0YVsgMCBdLmlkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfaWQgPSBzZWxmLnN0cmVhbS5zZWxlY3RlZDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBpID0gMCwgbCA9IG9iai5kYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGVjdGVkX2lkID09IG9iai5kYXRhWyBpIF0uaWQgKSBcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRfbmFtZSA9IG9iai5kYXRhWyBpIF0ubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC10eXBlJykudGV4dCggJ0dyb3VwOiAnICsgc2VsZWN0ZWRfbmFtZSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGRhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBJZDogc2VsZWN0ZWRfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHNlbGYucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRGQkdyb3VwJyxcclxuICAgICAgICAgICAgICAgICAgICBzdHJlYW06ICdncm91cEZlZWQnLFxyXG4gICAgICAgICAgICAgICAgICAgIG5leHQ6ICcnXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHVybDogXCJmZWVkL2ZiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbXMgPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5wYWdpbmcgIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IGRhdGEucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBkYXRhLmRhdGEgKSApIGl0ZW1zID0gWyBkYXRhLmRhdGEgXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaXRlbXMgPSBkYXRhLmRhdGE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIGl0ZW1zICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5UaGlzIGdyb3VwXFwncyBkYXRhIGlzIHVuYXZhaWxhYmxlIGF0IHRoaXMgdGltZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7IFxyXG5cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsID0gb2JqLmRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuc3RyZWFtLnNlbGVjdGVkICE9PSB1bmRlZmluZWQgJiYgc2VsZi5zdHJlYW0uc2VsZWN0ZWQuc3BsaXQoJywnKS5pbmRleE9mKCBvYmouZGF0YVsgaSBdLmlkICkgIT0gLTEgKSBvYmouZGF0YVsgaSBdLnNlbGVjdGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBvYmouZGF0YVsgaSBdLnNlbGVjdGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLnN0cmVhbS5zZWxlY3RlZCAhPT0gdW5kZWZpbmVkICYmIHNlbGYuc3RyZWFtLnNlbGVjdGVkLnNwbGl0KCcsJykuaW5kZXhPZiggJ19kZWZhdWx0XycgKSAhPSAtMSApIG9iai5kYXRhWyAwIF0uc2VsZWN0ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmRlZmF1bHRHcm91cElkICE9PSB1bmRlZmluZWQgJiYgb2JqLmRlZmF1bHRHcm91cElkWzBdICE9PSB1bmRlZmluZWQgJiYgISBfLmlzRW1wdHkoIG9iai5kZWZhdWx0R3JvdXBJZFswXSApIClcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0R3JvdXBJZFswXTsgXHJcblxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29iai5kYXRhOjo6Jyk7ICAgXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhvYmouZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7ICAgIFxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH0pOyAgXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuc2FtZV9tZWRpYV93aXRoX3ByZXZfaXRlbSA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGxlbmd0aCA9PT0gMCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgdmFyIHByZXZfaXRlbSA9IHRoaXMuaXRlbXNbIGxlbmd0aCAtIDEgXS5kYXRhO1xyXG5cclxuICAgICAgICBpZiAoIHByZXZfaXRlbSA9PT0gdW5kZWZpbmVkIHx8IHByZXZfaXRlbS5tZWRpYSA9PT0gdW5kZWZpbmVkIHx8IGRhdGEubWVkaWEgPT09IHVuZGVmaW5lZCApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCBwcmV2X2l0ZW0ubWVkaWEudHlwZSA9PSBkYXRhLm1lZGlhLnR5cGUgJiYgcHJldl9pdGVtLm1lZGlhLmhyZWYgIT09IHVuZGVmaW5lZCAmJiBkYXRhLm1lZGlhLmhyZWYgIT09IHVuZGVmaW5lZCAmJiBwcmV2X2l0ZW0ubWVkaWEuaHJlZiA9PSBkYXRhLm1lZGlhLmhyZWYgKSBcclxuICAgICAgICB7XHJcblxyXG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdTQU1FIE1FRElBJyk7XHJcbiAgICAgICAgICAgIC8vY29uc29sZS5kaXIoIHByZXZfaXRlbSApO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIC8vIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycpIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnaGlkZGVuX2dyb3VwcycgJiYgIXRoaXMub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaXRlbXNbIDAgXSAhPT0gdW5kZWZpbmVkICkgZGF0YSA9IGRhdGEuY29uY2F0KCB0aGlzLml0ZW1zWyAwIF0uZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdpbkJveCcpIG5ld19mZWVkX2l0ZW0gPSBuZXcgQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuc2FtZV9tZWRpYV93aXRoX3ByZXZfaXRlbSggZGF0YVsgaSBdKSApIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICAgICB9IFxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZhY2Vib29rRmVlZC5wcm90b3R5cGUuc2F2ZV9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnICYmICF0aGlzLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH0gXHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmlkID09ICdmYl9saWtlcycgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fZmVlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ3NlYXJjaF9yZXF1ZXN0JyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ291dHJlYWNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLy0tLSBmb3IgbGl2ZSB1cGRhdGVcclxuICAgICAgICAgICAgdmFyIG1pbmNvbWluZyA9IFtdLCBjdXNlcklkID0gdGhpcy5wcm9maWxlLmRhdGEucGFnZUlkO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZGF0YTo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuaWQgPT0gJ2luQm94JylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IENvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvKmZvciAoIHZhciBrID0gMCwgbGwgPSBuZXdfZmVlZF9pdGVtLmRhdGEuY29tbWVudHMuY29tbWVudC5sZW5ndGg7IGsgPCBsbDsgaysrIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2NvbW1lbnQgPSBuZXdfZmVlZF9pdGVtLmRhdGEuY29tbWVudHMuY29tbWVudFsgayBdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXNfY29tbWVudC5mcm9tSWQgIT09IGN1c2VySWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogdGhpc19jb21tZW50LCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggdGhpc19jb21tZW50LmNyZWF0ZWRUaW1lLnNwbGl0KCcrJylbIDAgXSApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhpc19jb21tZW50Lm1lc3NhZ2VJZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ2hpZGRlbl9ncm91cHMnKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLnNhbWVfbWVkaWFfd2l0aF9wcmV2X2l0ZW0oIGRhdGFbIGkgXSkgKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbWluY29taW5nLnNvcnQoIGZ1bmN0aW9uICggYSwgYiApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYS50aW1lID4gYi50aW1lKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA8IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgICAgIH0pOyAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBmaW5kIGxhdGVzdCBpbmNvbWluZ1xyXG4gICAgICAgICAgICBpZiAoIG1pbmNvbWluZy5sZW5ndGggPiAwICkgdGhpcy5maXJzdEl0ZW1JRCA9IG1pbmNvbWluZ1sgMCBdLnRpbWU7XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuZmlyc3RJdGVtSUQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBGYWNlYm9va0ZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnJHVybFJvdXRlcicsICdFQycsICdhcGlVcmwnLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCAkdXJsUm91dGVyLCBFQywgYXBpVXJsICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBmZWVkID0gJyc7Ly9uZXcgRWxlbWVudCgnI2ZlZWQtdGVtcGxhdGUnKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGZlZWQuZWxlbWVudDtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnByb2ZpbGUgPSBwcm9maWxlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMubmV0d29yayA9ICggcHJvZmlsZSA9PT0gdW5kZWZpbmVkID8gc3RyZWFtLm5ldHdvcmsgOiBwcm9maWxlLmFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uYW1lID0gc3RyZWFtLm5hbWUgfHwgc3RyZWFtLmlkO1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gc3RyZWFtLnN0cmVhbUlkO1xyXG5cclxuICAgICAgICB0aGlzLnNpemUgPSBzdHJlYW0uc2l6ZTtcclxuXHJcbiAgICAgICAgdGhpcy5mYXZvcml0ZWQgPSBzdHJlYW0uZmF2b3JpdGVkIHx8IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMudmFsdWUgPSBzdHJlYW0udmFsdWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5uZXh0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIDwtLSBbIEZlZWRJdGVtIF1cclxuXHJcbiAgICAgICAgdGhpcy5sYXN0X2xvYWRlZF90aW1lID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5sb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMubGFzdF9zY3JvbGxfcG9zaXRpb24gPSAwO1xyXG5cclxuICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG51bGw7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyogcHJlcGFyZSBwYWdlX2lkICovXHJcbiAgICAgICAgdGhpcy5wYWdlX2lkID0gJ3RhYnMuJyArIHRoaXMuZ2V0X3BhZ2VfaWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5nZXRfcGFnZV9pZCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGlkID0gc2VsZi5pZCxcclxuICAgICAgICAgICAgcHJlZml4ID0gJyc7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5vcHRpb25zLmZhdm9yaXRlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkID0gc2VsZi5pZCArICdfJyArIHNlbGYucHJvZmlsZS5pZCArICdfJysgc2VsZi5uZXR3b3JrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKCBzZWxmLmlkID09ICdzZWFyY2gnIHx8IHNlbGYuaWQgPT0gJ3JzcycgfHwgc2VsZi5pZCA9PSAnb3V0cmVhY2gnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkID0gc2VsZi5uYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMuZmF2b3JpdGUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcHJlZml4ID0gJ2Zhdm9yaXRlJzsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMuc2VhcmNoIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHByZWZpeCA9ICdzZWFyY2gnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnJzcyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBwcmVmaXggPSAncnNzJztcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYoIHRoaXMubmV0d29yayA9PSAnY2luYm94JyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHByZWZpeCA9ICdjaW5ib3gnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYoIHNlbGYucHJvZmlsZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcHJlZml4ID0gc2VsZi5wcm9maWxlLmlkO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIChwcmVmaXggKyAnLScgKyBpZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZmVlZF90aXRsZSA9ICcnO1xyXG5cclxuICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5mYXZvcml0ZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgcGFnZSA9ICcnLFxyXG4gICAgICAgICAgICAgICAgZmVlZF9uYW1lID0gc2VsZi5uYW1lO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoICggc2VsZi5uZXR3b3JrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFjZWJvb2snOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEucGFnZU5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAndHdpdHRlcic6IHBhZ2UgPSBzZWxmLnByb2ZpbGUuZGF0YS5zcGVjaWZpZWRIYW5kbGVPckhhc2hUYWc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaW5zdGFncmFtJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLmZ1bGxOYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ2xpbmtlZGluJzogcGFnZSA9IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbGlua2VkaW4nOiBwYWdlID0gc2VsZi5wcm9maWxlLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3lvdXR1YmUnOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEudXNlckZpcnN0TmFtZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuaWQgPT0gJ3l0X215Q2hhbm5lbEhvbWUnICkgZmVlZF9uYW1lID0gJ0hvbWUgLSBBY3Rpdml0aWVzJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdnb29nbGVwbHVzJzogcGFnZSA9IHNlbGYucHJvZmlsZS5kYXRhLmZ1bGxOYW1lLnNwbGl0KFwiKFwiKVswXTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdwaW50ZXJlc3QnOiBwYWdlID0gc2VsZi5wcm9maWxlLmRhdGEuZnVsbE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnYmxvZ2dlcic6IHBhZ2UgPSB0aGlzLnByb2ZpbGUudXNlcm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSBwYWdlKyAnIC0gJyArZmVlZF9uYW1lO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5vcHRpb25zLnNlYXJjaCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gJ0N1c3RvbSBTZWFyY2ggRmVlZCc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLm9wdGlvbnMucnNzIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZlZWRfdGl0bGUgPSAnUlNTIEZlZWQnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmZWVkX3RpdGxlID0gKHRoaXMubmFtZSkuaW5kZXhPZignRmVlZCcpID49IDAgPyB0aGlzLm5hbWU6KHRoaXMubmFtZSArICcgRmVlZCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2VsZi5wYWdlX3RpdGxlID0gZmVlZF90aXRsZTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coc2VsZi5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgdmFyIGdldEV4aXN0aW5nU3RhdGUgPSAkc3RhdGUuZ2V0KHNlbGYucGFnZV9pZCk7XHJcblxyXG4gICAgICAgIGlmKGdldEV4aXN0aW5nU3RhdGUgPT09IG51bGwpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncGFnZV9pZDo6Oicrc2VsZi5wYWdlX2lkKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBzdGF0ZSA9IHtcclxuICAgICAgICAgICAgICBcInVybFwiOiAnLycgKyBzZWxmLnBhZ2VfaWQgKyAnOm9iaicsXHJcbiAgICAgICAgICAgICAgY2FjaGU6dHJ1ZSxcclxuICAgICAgICAgICAgICBcInZpZXdzXCI6IHtcclxuICAgICAgICAgICAgICAgICdob21lLXRhYic6IHtcclxuICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3JhbS5odG1sXCIsXHJcbiAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiRmVlZHNcIixcclxuICAgICAgICAgICAgICAgICAgcGFyYW1zOiB7b2JqOiBzZWxmfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICRzdGF0ZVByb3ZpZGVyUmVmLnN0YXRlKHNlbGYucGFnZV9pZCwgc3RhdGUpO1xyXG5cclxuICAgICAgICAgICAgJHVybFJvdXRlci5zeW5jKCk7XHJcbiAgICAgICAgICAgICR1cmxSb3V0ZXIubGlzdGVuKCk7XHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygncGFnZV9pZDo6OjAwMDAwJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKSAvLyA8LS0gb3ZlcnJpZGVcclxuICAgIHtcclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSA9IG5ldyBGZWVkSXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhICkgLy8gPC0tIG92ZXJyaWRlXHJcbiAgICB7XHJcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSA9IG5ldyBGZWVkSXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5hcHBlbmRfaXRlbXMgPSBmdW5jdGlvbiAoIGFkZF9hZnRlcl9pbmRleCApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQoIGFkZF9hZnRlcl9pbmRleCApLFxyXG4gICAgICAgICAgICAvLyRjb250YWluZXIgPSB0aGlzLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKSxcclxuICAgICAgICAgICAgY291bnQgPSAwO1xyXG4gICAgICAgXHJcblxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBGZWVkLnByb3RvdHlwZS5zaG93X2l0ZW1zID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZpbmFsOjo6Ojo6Ojo6Jyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2VsZi5pdGVtcyk7XHJcblxyXG5cclxuICAgIH07XHJcblxyXG4gICAgRmVlZC5wcm90b3R5cGUuY2xlYXJGZWVkTm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKCByZW1vdmVfbWVzc2FnZSApXHJcbiAgICB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEZlZWQucHJvdG90eXBlLmhpZGVfcHVsbHVwID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH07XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4gRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gR29vZ2xlUGx1c0ZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggWydncF9hY3Rpdml0aWVzJywnZ3BfcGFnZXNfb25seScsJ2dwX3BhZ2VzJ10uaW5kZXhPZiggc3RyZWFtLnN0cmVhbUlkICkgIT09IC0xIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRmVlZCA9IHRydWU7ICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEdvb2dsZVBsdXNGZWVkO1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS51cGRhdGVGZWVkTm90aWZpY2F0aW9uID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIGlkX2tleSA9ICdpZCcsIFxyXG4gICAgICAgICAgICBjdXJyZW50SUQgPSBzZWxmLnVwZGF0ZUludGVydmFsSUQ7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRHUFN0cmVhbScsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogc2VsZi5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogc2VsZi5wcm9maWxlLmlkXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2dvb2dsZVBsdXNTdHJlYW0nLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgc3dpdGNoICggc2VsZi5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdncF9hY3Rpdml0aWVzJzogICByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX2FjdGl2aXRpZXMnOyBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzX29ubHknOiAgIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9vbmx5X3N0cmVhbSc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QuZGF0YS5hY2NvdW50SUQgPSBzZWxmLmRlZmF1bHRfZWxlbWVudF9tZXRyaWMuYWNjb3VudElEOyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLnByb2ZpbGVJRCA9IHNlbGYuZGVmYXVsdF9lbGVtZW50X21ldHJpYy5wcm9maWxlSUQ7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZF9rZXkgPSAncG9zdElEJzsgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdncF9wYWdlcyc6ICAgICAgICByZXF1ZXN0LmRhdGEuc3RyZWFtID0gJ2dwX3BhZ2Vfc3RyZWFtJzsgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5kYXRhLmFjY291bnRJRCA9IHNlbGYuZGVmYXVsdF9lbGVtZW50X21ldHJpYy5hY2NvdW50SUQ7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmRhdGEucHJvZmlsZUlEID0gc2VsZi5kZWZhdWx0X2VsZW1lbnRfbWV0cmljLnByb2ZpbGVJRDsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkX2tleSA9ICdwb3N0SUQnOyAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhazsgICAgICBcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnJWN1cGRhdGVGZWVkTm90aWZpY2F0aW9uKCcgKyBzZWxmLmlkICsgJykgcmVzcG9uc2U6JywgJ2NvbG9yOm9yYW5nZXJlZCcpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBjdXJyZW50SUQgPT09IHNlbGYudXBkYXRlSW50ZXJ2YWxJRCApIC8vIGRvbid0IHJlZnJlc2ggZHVyaW5nIHJlcXVlc3RcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZpcnN0SUQgPSAnIyMjJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmZpcnN0SXRlbUlEICkgZmlyc3RJRCA9IHNlbGYuZmlyc3RJdGVtSUQ7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZpcnN0SUQgOjogJyArIGZpcnN0SUQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgJiYgZGF0YS5kYXRhLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gZGF0YS5kYXRhLm1hcChmdW5jdGlvbihpdGVtKXtyZXR1cm4gaXRlbVsgaWRfa2V5IF07fSkuaW5kZXhPZiggZmlyc3RJRCApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09IC0xIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGRhdGEuZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGZpcnN0SUQgPT09ICcjIyMnICkgaW5kZXggPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdpbmRleCA6OiAnICsgaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaW5kZXggPiAwIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGhlYWRlciA9IHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1oZWFkZXInKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGZib2R5ID0gc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICR1cGRhdGVfbm90aWYgPSAkZmJvZHkuZmluZCgnLnVwZGF0ZS1ub3RpZmljYXRpb24nKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHVwZGF0ZV9ub3RpZi5sZW5ndGggPT09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHVwZGF0ZV9ub3RpZiA9ICQoJzxkaXYgY2xhc3M9XCJ1cGRhdGUtbm90aWZpY2F0aW9uXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR1cGRhdGVfbm90aWYub24oJ2NsaWNrJywgZnVuY3Rpb24gKCBlICl7ICRoZWFkZXIuZmluZCgnLnJlZnJlc2gtZmVlZCcpLnRyaWdnZXIoJ2NsaWNrJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZmJvZHkuZmluZCgnLmZlZWQtaXRlbScpLmZpcnN0KCkuYmVmb3JlKCAkdXBkYXRlX25vdGlmICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAkdXBkYXRlX25vdGlmLnRleHQoJ1ZpZXcgJyArICggaW5kZXggPT09IGRhdGEuZGF0YS5sZW5ndGggPyBpbmRleCArICcrJyA6IGluZGV4ICkgKyAnIG5ldyBQb3N0JyArICggaW5kZXggPT09IDEgPyAnJyA6ICdzJyApICk7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGNvbnNvbGUuZXJyb3IoJyEhISBjdXJyZW50SUQgISEhJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9hY3Rpdml0aWVzJzogdGhpcy5nZXRHb29nbGVQbHVzU3RyZWFtKFwiZ3BfYWN0aXZpdGllc1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dwX3BhZ2VzJzogdGhpcy5nZXRQYWdlcygpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgLypjYXNlICdncF9wZW9wbGVDb25uZWN0ZWQnOiB0aGlzLmdldEdvb2dsZVBsdXNTdHJlYW0oXCJncF9wZW9wbGVDb25uZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdncF9wZW9wbGVWaXNpYmxlJzogdGhpcy5nZXRHb29nbGVQbHVzU3RyZWFtKFwiZ3BfcGVvcGxlVmlzaWJsZVwiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrOyovXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ3BfcGFnZXNfb25seSc6IHRoaXMuZ2V0UGFnZXMoIHRydWUgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5nZXRQYWdlcyA9IGZ1bmN0aW9uICggb25seV9wYWdlIClcclxuICAgIHtcclxuICAgICAgICB2YXIgZGF0YSA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMucHJvZmlsZS5kYXRhLm9iamVjdFR5cGUgPT09ICdwYWdlJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVxX2RhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdnZXRHUFN0cmVhbScsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHNlbGYucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBzdHJlYW06ICdncF9wYWdlX29ubHlfc3RyZWFtJ1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIHVybDogJ2ZlZWQvZ29vZ2xlUGx1c1N0cmVhbScsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiByZXFfZGF0YVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmlkID09PSAnZ3BfcGFnZXMnICkgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX3N0cmVhbSc7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTsvL0pTT04ucGFyc2UoIHJlc3BvbnNlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyoqKioqKioqKioqKioqKiogIEcrICcrc3RyZWFtKTtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5uZXh0ICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoubmV4dDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5yZXR1cm5Db2RlID09ICdGQUlMJylcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvZmlsZS5hY2NvdW50LnByb2ZpbGVzLmZvckVhY2goIGZ1bmN0aW9uKCBwcm9maWxlIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBwcm9maWxlLmRhdGEub2JqZWN0VHlwZSAmJiBwcm9maWxlLmRhdGEub2JqZWN0VHlwZSA9PT0gJ3BhZ2UnICYmIHByb2ZpbGUubW9uaXRvcmVkID09PSAnb24nIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZmlsZS5kYXRhLnBhZ2VfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb2ZpbGUudXNlcm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnRJRDogcHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9ubHlfcGFnZTogb25seV9wYWdlXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgIT09IHVuZGVmaW5lZCAmJiAhXy5pc0VtcHR5KCB0aGlzLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZCApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZC5pbmRleE9mKCd7JykgPT09IC0xICkgdGhpcy5kZWZhdWx0X2VsZW1lbnQgPSB0aGlzLnByb2ZpbGUuZGF0YS5kZWZhdWx0R3JvdXBJZDtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRfZ3JvdXBzID0gSlNPTi5wYXJzZSggdGhpcy5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkZWZhdWx0X2dyb3Vwc1sgdGhpcy5pZCBdICE9PSB1bmRlZmluZWQgKSB0aGlzLmRlZmF1bHRfZWxlbWVudCA9IGRlZmF1bHRfZ3JvdXBzWyB0aGlzLmlkIF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZV9pdGVtcyggZGF0YSApOyAgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5nZXRHb29nbGVQbHVzU3RyZWFtID0gZnVuY3Rpb24gKCBzdHJlYW0gKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEdQU3RyZWFtJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogc3RyZWFtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2dvb2dsZVBsdXNTdHJlYW0nLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlOy8vSlNPTi5wYXJzZSggcmVzcG9uc2UgKTtcclxuXHJcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJyoqKioqKioqKioqKioqKiogIEcrICcrc3RyZWFtKTtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5uZXh0ICE9PSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoubmV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLnJldHVybkNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5tb3JlID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5uZXh0ICA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLm5leHQgKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICByZXR1cm47ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldEdQU3RyZWFtJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogdGhpcy5pZCxcclxuICAgICAgICAgICAgbmV4dDogdGhpcy5uZXh0IFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9nb29nbGVQbHVzU3RyZWFtJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ2dwX3BhZ2VzJyApIHJlcXVlc3QuZGF0YS5zdHJlYW0gPSAnZ3BfcGFnZV9zdHJlYW0nO1xyXG5cclxuICAgICAgICBlbHNlIGlmICggc2VsZi5pZCA9PT0gJ2dwX3BhZ2VzX29ubHknICkgcmVxdWVzdC5kYXRhLnN0cmVhbSA9ICdncF9wYWdlX29ubHlfc3RyZWFtJztcclxuICAgICAgICBcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDsvL0pTT04ucGFyc2UoIHJlc3AgKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5uZXh0ICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5uZXh0O1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlX3B1bGx1cCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEdvb2dsZVBsdXNGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggKCB0aGlzLmlkID09ICdncF9wYWdlcycgfHwgdGhpcy5pZCA9PSAnZ3BfcGFnZXNfb25seScgKSAmJiB0aGlzLnByb2ZpbGUuZGF0YS5vYmplY3RUeXBlICE9PSAncGFnZScgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAgICAgLy90aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW0sIHRoaXNfZGF0dW07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PT0gJ2dwX2FjdGl2aXRpZXMnICkgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW1fb2xkKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgR29vZ2xlUGx1c0ZlZWQucHJvdG90eXBlLmFkZF9pdGVtcyA9IGZ1bmN0aW9uICggZGF0YSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGFkZF9hZnRlcl9pbmRleCA9IHRoaXMuaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtLCB0aGlzX2RhdHVtO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PT0gJ2dwX2FjdGl2aXRpZXMnICkgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW1fb2xkKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZm9ybWF0X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0gZGF0YTtcclxuXHJcbiAgICAgICAgdGhpc19kYXR1bS5mcm9tSWQgPSBkYXRhLnVzZXIuZnJvbUlkO1xyXG4gICAgICAgIHRoaXNfZGF0dW0uZnJvbU5hbWUgPSBkYXRhLnVzZXIuZnJvbU5hbWU7XHJcbiAgICAgICAgdGhpc19kYXR1bS5wcm9maWxlTGluayA9IGRhdGEudXNlci5wcm9maWxlTGluaztcclxuICAgICAgICB0aGlzX2RhdHVtLnByb2ZpbGVQaWMgPSBkYXRhLnVzZXIucHJvZmlsZVBpYztcclxuXHJcbiAgICAgICAgdGhpc19kYXR1bS51cGRhdGVUaW1lID0gbmV3IERhdGUoIHRoaXNfZGF0dW0udXBkYXRlVGltZSApLmdldFRpbWUoKSAvIDEwMDA7XHJcblxyXG4gICAgICAgIGRlbGV0ZSB0aGlzX2RhdHVtLnVzZXI7XHJcblxyXG4gICAgICAgIC8vIHRha2UgMSBhdHRhY2htZW50IGZvciBub3dcclxuICAgICAgICBpZiAoIGRhdGEuYXR0YWNobWVudHMgIT09IHVuZGVmaW5lZCAmJiAhIF8uaXNFbXB0eSggZGF0YS5hdHRhY2htZW50cykgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudCkgKSB0aGlzX2RhdHVtLm1lZGlhID0gZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50WyAwIF07XHJcblxyXG4gICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0ubWVkaWEgPSBkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuY29udGVudCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggKC9cXHd7OH0oLVxcd3s0fSl7M30tXFx3ezEyfS9pKS50ZXN0KHRoaXNfZGF0dW0ubWVkaWEuY29udGVudCkgKSB0aGlzX2RhdHVtLm1lZGlhLmNvbnRlbnQgPSAnJzsgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLnR5cGUgPT0gJ3Bob3RvJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS5mdWxsSW1hZ2UgIT09IHVuZGVmaW5lZCApIHRoaXNfZGF0dW0ubWVkaWEuc3JjID0gdGhpc19kYXR1bS5tZWRpYS5mdWxsSW1hZ2UudXJsO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLmltYWdlICE9PSB1bmRlZmluZWQgKSB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UudXJsO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgZGVsZXRlIHRoaXNfZGF0dW0ubWVkaWE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLnR5cGUgPT0gJ3ZpZGVvJyAmJiB0aGlzX2RhdHVtLm1lZGlhLmltYWdlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnNyYyA9IHRoaXNfZGF0dW0ubWVkaWEuaW1hZ2UudXJsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpc19kYXR1bS5tZWRpYS5lbWJlZCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhLnZpZGVvID0geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlX3VybDogdGhpc19kYXR1bS5tZWRpYS5lbWJlZC51cmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLmVtYmVkLnVybCBcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpc19kYXR1bS5tZWRpYS52aWRlbyA9IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IHRoaXNfZGF0dW0ubWVkaWEudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X3VybDogdGhpc19kYXR1bS5tZWRpYS51cmwgXHJcbiAgICAgICAgICAgICAgICAgICAgfTsgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtO1xyXG4gICAgfTtcclxuXHJcbiAgICBHb29nbGVQbHVzRmVlZC5wcm90b3R5cGUuZm9ybWF0X2l0ZW1fb2xkID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgZnJvbUlkOiBkYXRhLnVzZXIuaWQsXHJcbiAgICAgICAgICAgIGZyb21OYW1lOiBkYXRhLnVzZXIuZnVsbF9uYW1lLFxyXG4gICAgICAgICAgICBwcm9maWxlUGljOiBkYXRhLnVzZXIucHJvZmlsZV9waWN0dXJlLFxyXG4gICAgICAgICAgICBwcm9maWxlTGluazogZGF0YS51c2VyLnByb2ZpbGVfbGluayxcclxuICAgICAgICAgICAgc2VsZkxpbms6IGRhdGEuc2VsZkxpbmssXHJcbiAgICAgICAgICAgIHVwZGF0ZVRpbWU6ICggbmV3IERhdGUoIGRhdGEuY3JlYXRlZF90aW1lICkuZ2V0VGltZSgpIC8gMTAwMCApLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBkYXRhLnRpdGxlLFxyXG5cclxuICAgICAgICAgICAgLy9hY3Rpdml0eVR5cGU6IGRhdGEuYWN0aXZpdHlUeXBlIHx8ICcnLFxyXG4gICAgICAgICAgICByZXNoYXJlcnM6IGRhdGEucmVzaGFyZXJzLFxyXG4gICAgICAgICAgICBsaWtlczogZGF0YS5saWtlcywgLy9wbHVzb25lcnNcclxuICAgICAgICAgICAgY29tbWVudHM6IGRhdGEuY29tbWVudHMsXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vbWVkaWE6IGRhdGEuYXR0YWNobWVudHMsXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHBvc3RJRDogZGF0YS5pZCwgLy8/Pz9cclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHRoaXNfZGF0dW0uY29tbWVudHMuY29tbWVudCAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KCB0aGlzX2RhdHVtLmNvbW1lbnRzLmNvbW1lbnQgKSkgXHJcbiAgICAgICAgICAgIHRoaXNfZGF0dW0uY29tbWVudHMuY29tbWVudCA9IFsgdGhpc19kYXR1bS5jb21tZW50cy5jb21tZW50IF07XHJcblxyXG4gICAgICAgIGlmICggdGhpc19kYXR1bS5saWtlcy5saWtlICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkoIHRoaXNfZGF0dW0ubGlrZXMubGlrZSApKSBcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5saWtlcy5saWtlID0gWyB0aGlzX2RhdHVtLmxpa2VzLmxpa2UgXTtcclxuXHJcbiAgICAgICAgLy8gdGFrZSAxIGF0dGFjaG1lbnQgZm9yIG5vd1xyXG4gICAgICAgIGlmICggZGF0YS5hdHRhY2htZW50cyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheShkYXRhLmF0dGFjaG1lbnRzLmF0dGFjaG1lbnQpICkgdGhpc19kYXR1bS5tZWRpYSA9IGRhdGEuYXR0YWNobWVudHMuYXR0YWNobWVudFsgMCBdO1xyXG5cclxuICAgICAgICAgICAgZWxzZSB0aGlzX2RhdHVtLm1lZGlhID0gZGF0YS5hdHRhY2htZW50cy5hdHRhY2htZW50O1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzX2RhdHVtLm1lZGlhLnR5cGUgPT0gJ3Bob3RvJyAmJiB0aGlzX2RhdHVtLm1lZGlhLmZ1bGxJbWFnZSAhPT0gdW5kZWZpbmVkICkgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmZ1bGxJbWFnZS51cmw7XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpc19kYXR1bS5tZWRpYS50eXBlID09ICd2aWRlbycgJiYgdGhpc19kYXR1bS5tZWRpYS5pbWFnZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS5zcmMgPSB0aGlzX2RhdHVtLm1lZGlhLmltYWdlLnVybDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYS52aWRlbyA9IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZV91cmw6IHRoaXNfZGF0dW0ubWVkaWEuZW1iZWQudXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X3VybDogdGhpc19kYXR1bS5tZWRpYS5lbWJlZC51cmwgXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIHRoaXNfZGF0dW0ubWVkaWEudmlkZW8gPSB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VfdXJsOiB0aGlzX2RhdHVtLm1lZGlhLnVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheV91cmw6IHRoaXNfZGF0dW0ubWVkaWEudXJsIFxyXG4gICAgICAgICAgICAgICAgICAgIH07IFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpc19kYXR1bTsgICBcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIEdvb2dsZVBsdXNGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnSW5zdGFncmFtRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBJbnN0YWdyYW1GZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIEluc3RhZ3JhbUZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gSW5zdGFncmFtRmVlZDtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5nZXRfZGF0YSA9IGZ1bmN0aW9uICggY2FsbGJhY2sgKVxyXG4gICB7XHJcbiAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgaWYgKCB0aGlzLnZhbHVlID09ICd0cnVlJyAmJiAhdGhpcy5pbml0aWFsaXplZCApXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAvLyBJbiBjYXNlIHdlIGFyZSBkZWFsaW5nIHdpdGggdXNlciBmZWVkIFxyXG4gICAgICAgICAgICAgICBjYXNlICdpZ19mZWVkJzogdGhpcy5nZXRJbnN0YWdyYW1GZWVkKFwidXNlckZlZWRcIik7XHJcbiAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgLy8gSW4gY2FzZSB3ZSBhcmUgZGVhbGluZyB3aXRoIG15IG1lZGlhIGZlZWRcclxuICAgICAgICAgICAgICAgLy8gY2FzZSAnaWdNeU1lZGlhJzogdGhpcy5nZXRJbnN0YWdyYW1GZWVkKFwiaWdNeU1lZGlhXCIpO1xyXG4gICAgICAgICAgICAgICBjYXNlICdpZ015TWVkaWEnOiB0aGlzLmdldEluc3RhZ3JhbUZlZWQoXCJteU1lZGlhXCIpO1xyXG4gICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrO1xyXG4gICAgICAgICAgIH1cclxuICAgICAgIH1cclxuICAgICAgIGVsc2UgaWYgKCB0aGlzLnZhbHVlID09ICd0cnVlJylcclxuICAgICAgIHtcclxuICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUuZ2V0SW5zdGFncmFtRmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAvL2FjdGlvbjogJ2dldE5ld3NGZWVkJyxcclxuICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgIHN0cmVhbTogc3RyZWFtLFxyXG4gICAgICAgICAgIG5leHQ6ICcnIC8vIElEIG9mIGxhc3QgZWxlbWVudCB0aGF0IHdhcyBsb2FkZWRcclxuICAgICAgIH07XHJcblxyXG4gICAgICAgZGF0YS53YWxsID0gZmFsc2U7XHJcbiAgICAgICBpZih0aGlzLm5leHQgPiAwKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgICBkYXRhLm5leHQgPSB0aGlzLm5leHQ7XHJcbiAgICAgICB9XHJcblxyXG4gICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgLy8gaWYgKHN0cmVhbSA9PSAnaWdNeU1lZGlhJykgXHJcbiAgICAgICBpZiAoc3RyZWFtID09ICdteU1lZGlhJykgXHJcbiAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuYWN0aW9uID0gXCJnZXRJbk15TWVkaWFcIjsgLy8gQWN0aW9uIGZvciBteU1lZGlhXHJcbiAgICAgICAgICAgIG1ldGhvZCA9ICdteU1lZGlhJztcclxuICAgICAgIH1cclxuICAgICAgIGVsc2VcclxuICAgICAgIHtcclxuICAgICAgICAgICBkYXRhLmFjdGlvbiA9IFwiZ2V0SW5GZWVkXCI7IC8vIEFjdGlvbiBmb3IgdXNlciBmZWVkIC8gaG9tZSBmZWVkXHJcbiAgICAgICAgICAgbWV0aG9kID0gJ2ZlZWQnO1xyXG4gICAgICAgfVxyXG5cclxuICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgIHVybDogJ2ZlZWQvaW5zdGFncmFtLycrbWV0aG9kLFxyXG4gICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgIH07XHJcblxyXG4gICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgaWYgKCBvYmoucGFnaW5hdGlvbiAhPT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luYXRpb24ubmV4dF9tYXhfaWQ7XHJcblxyXG4gICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgSW5zdGFncmFtRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgLy9hY3Rpb246ICdkb0ZiUmVxdWVzdCcsXHJcbiAgICAgICAgICAgICAgICAvL3dhbGw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IHRoaXMuaWQsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBuZXh0OiB0aGlzLm5leHRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy9kYXRhLndhbGwgPSBmYWxzZTtcclxuICAgICAgICB2YXIgbWV0aG9kID0gJyc7XHJcbiAgICAgICAgaWYgKHRoaXMuaWQgPT0gJ2lnX2ZlZWQnKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuc3RyZWFtID0gXCJ1c2VyRmVlZFwiO1xyXG4gICAgICAgICAgICBkYXRhLmFjdGlvbiA9IFwiZ2V0SW5GZWVkXCI7IC8vIEFjdGlvbiBmb3IgdXNlciBmZWVkIC8gaG9tZSBmZWVkXHJcbiAgICAgICAgICAgIG1ldGhvZCA9ICdmZWVkJztcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEuc3RyZWFtID0gXCJteU1lZGlhXCI7XHJcbiAgICAgICAgICAgIGRhdGEuYWN0aW9uID0gXCJnZXRJbk15TWVkaWFcIjsgLy8gQWN0aW9uIGZvciBteU1lZGlhXHJcbiAgICAgICAgICAgIG1ldGhvZCA9ICdteU1lZGlhJztcclxuICAgICAgICB9ICAgICAgICBcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJpZD1cIit0aGlzLmlkK1wiIHN0cmVhbT1cIitkYXRhLnN0cmVhbStcIiBuZXh0PVwiK3RoaXMubmV4dCtcIiBhY3Rpb249XCIrZGF0YS5hY3Rpb24pO1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvaW5zdGFncmFtLycrbWV0aG9kLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyQubW9iaWxlLmFjdGl2ZVBhZ2UuY2hpbGRyZW4oXCJbZGF0YS1yb2xlPSdmb290ZXInXVwiKS50b29sYmFyKHsgdGFwVG9nZ2xlOiBmYWxzZSB9KTtcclxuICAgICAgICAvLyQubW9iaWxlLmFjdGl2ZVBhZ2UuY2hpbGRyZW4oXCJbZGF0YS1yb2xlPSdmb290ZXInXVwiKS5mYWRlT3V0KDMwMCk7XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8kLm1vYmlsZS5hY3RpdmVQYWdlLmNoaWxkcmVuKFwiW2RhdGEtcm9sZT0nZm9vdGVyJ11cIikudG9vbGJhcih7IHRhcFRvZ2dsZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgLy8kLm1vYmlsZS5hY3RpdmVQYWdlLmNoaWxkcmVuKFwiW2RhdGEtcm9sZT0nZm9vdGVyJ11cIikuZmFkZUluKDMwMCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3A7XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5wYWdpbmF0aW9uID8gZGF0YS5wYWdpbmF0aW9uLm5leHRfbWF4X2lkIDogJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgdGhpcy5pdGVtcyA9IFtdOyAvLyByZXNldFxyXG5cclxuICAgICAgIGlmICggZGF0YSAhPT0gdW5kZWZpbmVkICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAge1xyXG4gICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG4gICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAndXNlckZlZWQnKSB7bmV3X2ZlZWRfaXRlbSA9IG5ldyBDb2xsYXBzaWJsZUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTt9ICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHN0cmVhbSA9IG15TWVkaWFcclxuICAgICAgICAgICAgICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcbiAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBJbnN0YWdyYW1GZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgfVxyXG5cclxuICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICkgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IEluc3RhZ3JhbUZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gSW5zdGFncmFtRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIEZlZWRJdGVtID0gIEZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ0ZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBJbnN0YWdyYW1GZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWRJdGVtLnByb3RvdHlwZSApO1xyXG4gICBcclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEluc3RhZ3JhbUZlZWRJdGVtO1xyXG4gICBcclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2NvbW1lbnRzID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cztcclxuXHJcbiAgICBJbnN0YWdyYW1GZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyQ29tbWVudCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlckNvbW1lbnQ7XHJcbiAgIFxyXG4gICAgSW5zdGFncmFtRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXMgPSBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5zaG93X2xpa2VzO1xyXG5cclxuICAgIEluc3RhZ3JhbUZlZWRJdGVtLnByb3RvdHlwZS5hZGRfY29tbWVudCA9IGZ1bmN0aW9uICggbWVzc2FnZSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGh0X2V4cCA9IC9cXEIjKFxcdypbYS16QS1aXStcXHcqKS9pZyxcclxuICAgICAgICAgICAgbGlua3NfZXhwID0gLyhcXGIoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC9bLUEtWjAtOSsmQCNcXC8lPz1+X3whOiwuO10qWy1BLVowLTkrJkAjXFwvJT1+X3xdKS9pZztcclxuXHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBJbnN0YWdyYW1GZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIENvbGxhcHNpYmxlRmVlZEl0ZW0gPSAgQ29sbGFwc2libGVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdDb2xsYXBzaWJsZUZlZWRJdGVtJyk7XHJcbiAgICBcclxuICAgIGZ1bmN0aW9uIExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgQ29sbGFwc2libGVGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgTGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIENvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgICBcclxuICAgIExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG5cclxuICAgIHJldHVybiBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJ0ZlZWQnLCAnTGlua2VkaW5GZWVkSXRlbScsICdEcm9wZG93bkZlZWRJdGVtJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgRmVlZCwgTGlua2VkaW5GZWVkSXRlbSwgRHJvcGRvd25GZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIExpbmtlZGluRmVlZCAoIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZC5hcHBseSggdGhpcywgWyBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IExpbmtlZGluRmVlZDtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coIHRoaXMuaWQgKVxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCB0aGlzLnZhbHVlIClcclxuICAgICAgICBcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdjb250YWN0cyc6IHRoaXMucmV0cmlldmVMaW5rZWRpbkRhdGEoJ2dldExOQ29udGFjdHMnKTsvL2NvbnNvbGUubG9nKCdjb250YWN0cycpOy8vdGhpcy5nZXROZXdzRmVlZChcIm5ld3NGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbG5fY29tcGFuaWVzJzogdGhpcy5nZXRMTkNvbXBhbmllcygpOy8vY29uc29sZS5sb2coJ2xuX2NvbXBhbmllcycpOy8vdGhpcy5nZXROZXdzRmVlZChcIndhbGxQb3N0c1wiKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2dyb3Vwcyc6IHRoaXMuZ2V0TE5Hcm91cHMoKTsgLy9jb25zb2xlLmxvZygnZ3JvdXBzJyk7Ly90aGlzLmdldE5ld3NGZWVkKFwicGFnZXNGZWVkXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaW5ib3gnOiB0aGlzLmdldExOSW5ib3goKTsvL2NvbnNvbGUubG9nKCdpbmJveCcpOy8vdGhpcy5nZXRMbkluYm94KCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdob21lJzogdGhpcy5nZXRMTkhvbWUoKTsgLy9jb25zb2xlLmxvZygnbG5jX2hvbWVXYWxsJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbmNfaG9tZVdhbGwnOiB0aGlzLnJldHJpZXZlTGlua2VkaW5EYXRhKCdnZXRMTkNtcEhvbWUnKTsvL2NvbnNvbGUubG9nKCdsbmNfaG9tZVdhbGwnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrOyBcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsbmNfcHJvZHVjdHMnOiBjb25zb2xlLmxvZygnbG5jX3Byb2R1Y3RzJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLnNhdmVfaXRlbXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7IFxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgICAgICAvLyBpZih0aGlzLm5leHQ+MClcclxuICAgICAgICAvLyB7XHJcbiAgICAgICAgICAgICAgICBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldExOQ21wSG9tZScsXHJcbiAgICAgICAgICAgICAgICAgICAgLy93YWxsOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb2ZpbGVfaWQ6IHRoaXMuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICBzdGFydDogdGhpcy5uZXh0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtZXRob2QgPSAnJztcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRhY3RzJzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5Db250YWN0cyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdjb250YWN0cyc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2xuX2NvbXBhbmllcyc6IGRhdGEuYWN0aW9uID0gJ2dldExOQ29tcGFuaWVzJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJylbMF0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdjb21wYW5pZXMnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dyb3Vwcyc6IGRhdGEuYWN0aW9uID0gJ2dldExOR3JvdXBzJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kID0gJ2dyb3Vwcyc7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luYm94JzogZGF0YS5hY3Rpb24gPSAnZ2V0TE5JbmJveCc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEucHJvZmlsZV9pZCA9IHRoaXMucHJvZmlsZS5kYXRhLnByb2ZpbGVfSWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5zdGFydCA9PT0gRkFMU0UgKSBkYXRhLnN0YXJ0ID0gMDsgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSAnaW5ib3gnOyBcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaG9tZSc6IGRhdGEuYWN0aW9uID0gJ2dldExOSG9tZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICdob21lJztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICB1cmw6IFwiZmVlZC9saW5rZWRJbi9cIittZXRob2QsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsb2FkX21vcmVfZmxhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0TG5JbmJveCBtb3JlIHJlc3BvbnNlJyk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgKz0gMjU7Ly9kYXRhLnVwZGF0ZUtleTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS50cmlnZ2VyKCdjbGljaycpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIC8vIH0gXHJcbiAgICAgICAgLy8gZWxzZVxyXG4gICAgICAgIC8vIHtcclxuICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gfSAgXHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUucmV0cmlldmVMaW5rZWRpbkRhdGEgPSBmdW5jdGlvbiAoIGFjdGlvbiApIC8vIGdldExOQ21wSG9tZSA9PiBjb21wYW55IHVwZGF0ZXNcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2VsZi5uZXh0ID0gMDtcclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlX0lkOiB0aGlzLnByb2ZpbGUuZGF0YS5wcm9maWxlX0lkLFxyXG4gICAgICAgICAgICBzdGFydDogc2VsZi5uZXh0XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1ldGhvZCA9ICcnO1xyXG4gICAgICAgIHN3aXRjaCggYWN0aW9uIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2dldExOQ29udGFjdHMnOlxyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gJ2xpbmtlZEluL2NvbnRhY3RzJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlICdnZXRMTkNtcEhvbWUnOlxyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gJ2xpbmtlZEluL2NvbXBhbnlIb21lJztcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgbWV0aG9kID0gJyc7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkLycrbWV0aG9kLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhhY3Rpb24gKycgcmVzcG9uc2UnKVxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmRpciggb2JqICk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8qaWYgKCBvYmoucGFnaW5nICE9IHVuZGVmaW5lZCApKi8gXHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7Ly9vYmouZGF0YS51cGRhdGVLZXk7Ly9vYmoucGFnaW5nLm5leHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGVsc2VcclxuICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKClcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOQ29tcGFuaWVzID0gZnVuY3Rpb24gKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgc2VsZi5uZXh0ID0gMDtcclxuICAgICAgICB2YXIgZGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2V0TE5Db21wYW5pZXMnLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RhcnQ6IDBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vY29tcGFuaWVzJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG4gICAgICAgICAgICAvLyBpZiAoIG9iai5kYXRhLmxlbmd0aCA9PSAyNSApXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gb2JqLmRhdGEubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggb2JqLmRlZmF1bHRDb21wYW55SWQgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVmYXVsdENvbXBhbnlJZFswXSAhPT0gdW5kZWZpbmVkICYmICEgXy5pc0VtcHR5KCBvYmouZGVmYXVsdENvbXBhbnlJZFswXSApIClcclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0Q29tcGFueUlkWyAwIF07IFxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgIC8vIGVsc2VcclxuICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKClcclxuXHJcbiAgICAgICAgICAgIC8vICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIC8vIH0gICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAvLyBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgTGlua2VkaW5GZWVkLnByb3RvdHlwZS5nZXRMTkdyb3VwcyA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBzZWxmLm5leHQgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkdyb3VwcycsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdGFydDogMFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC9saW5rZWRJbi9ncm91cHMnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBvYmouZGF0YSA9PT0gdW5kZWZpbmVkIHx8IG9iai5kYXRhLmxlbmd0aCA8IDEgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSBvYmouZGF0YS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBvYmouZGVmYXVsdEdyb3VwSWQgIT09IHVuZGVmaW5lZCAmJiBvYmouZGVmYXVsdEdyb3VwSWRbMF0gIT09IHVuZGVmaW5lZCAmJiAhIF8uaXNFbXB0eSggb2JqLmRlZmF1bHRHcm91cElkWzBdICkgKVxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGVmYXVsdF9lbGVtZW50ID0gb2JqLmRlZmF1bHRHcm91cElkWzBdOyBcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH0gICAgIFxyXG4gICAgICAgICAgICAvLyBlbHNlXHJcbiAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgLy8gICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpXHJcblxyXG4gICAgICAgICAgICAvLyAgICAgc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICAvLyB9ICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApOyBcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOSG9tZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwibWF0YW4gaGVyZSAtIFwiK3RoaXMuaWQpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUuZGlyKHNlbGYpO1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRMTkhvbWUnLFxyXG4gICAgICAgICAgICAvL3N0cmVhbTogJ2luQm94JyxcclxuICAgICAgICAgICAgLy9wcm9maWxlX2lkOiB0aGlzLmlkLFxyXG4gICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICBwcm9maWxlSUQ6IHRoaXMucHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgc3RhcnQ6IDBcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgIHVybDogJ2ZlZWQvbGlua2VkSW4vaG9tZScsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZ2V0TE5Ib21lIHJlc3BvbnNlJylcclxuICAgICAgICAgICAgLy8gY29uc29sZS5kaXIoIG9iaiApXHJcblxyXG4gICAgICAgICAgICBpZiAoIG9iai5kYXRhID09PSB1bmRlZmluZWQgfHwgb2JqLmRhdGEubGVuZ3RoIDwgMSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2lmICggb2JqLnBhZ2luZyAhPSB1bmRlZmluZWQgKSBzZWxmLm5leHQgPSBvYmoucGFnaW5nLm5leHQ7XHJcbiAgICAgICAgICAgIC8vIGlmICggb2JqLmRhdGEubGVuZ3RoID09IDI1IClcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBzZWxmLm5leHQgPSAyNTtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IG9iai5kYXRhLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIC8vIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLmdldExOSW5ib3ggPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgdmFyIGRhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dldExOSW5ib3gnLFxyXG4gICAgICAgICAgICAvL3N0cmVhbTogJ2luQm94JyxcclxuICAgICAgICAgICAgcHJvZmlsZV9pZDogdGhpcy5wcm9maWxlLmRhdGEucHJvZmlsZV9JZCxcclxuICAgICAgICAgICAgYWNjb3VudElEOiB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0YXJ0OiAwXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2xpbmtlZEluL2luYm94JyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdnZXRMbkluYm94IHJlc3BvbnNlJyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBvYmogKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgPT09IHVuZGVmaW5lZCB8fCBvYmouZGF0YS5sZW5ndGggPCAxICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9pZiAoIG9iai5wYWdpbmcgIT0gdW5kZWZpbmVkICkgc2VsZi5uZXh0ID0gb2JqLnBhZ2luZy5uZXh0O1xyXG4gICAgICAgICAgICAvLyBpZiAoIG9iai5kYXRhLmxlbmd0aCA9PSAyNSApXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gb2JqLmRhdGEubGVuZ3RoO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuICAgICAgICAgICAgfSAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gc2VsZi5zYXZlX2l0ZW1zKCBvYmouZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIExpbmtlZGluRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnZ3JvdXBzJyB8fCB0aGlzLmlkID09ICdsbl9jb21wYW5pZXMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pdGVtc1sgMCBdICE9PSB1bmRlZmluZWQgKSBkYXRhID0gZGF0YS5jb25jYXQoIHRoaXMuaXRlbXNbIDAgXS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld19mZWVkX2l0ZW07XHJcblxyXG4gICAgICAgICAgICAgICAgLy9pZiAoIHRoaXMuaWQgPT0gJ2xuX2NvbXBhbmllcycgKSBuZXdfZmVlZF9pdGVtID0gbmV3IExpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLyplbHNlKi8gbmV3X2ZlZWRfaXRlbSA9IG5ldyBMaW5rZWRpbkZlZWRJdGVtKCBkYXRhWyBpIF0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ld19mZWVkX2l0ZW0gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hcHBlbmRfaXRlbXMoIGFkZF9hZnRlcl9pbmRleCApO1xyXG4gICAgfTtcclxuXHJcbiAgICBMaW5rZWRpbkZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdncm91cHMnIHx8IHRoaXMuaWQgPT0gJ2xuX2NvbXBhbmllcycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKSBmb3IgKCB2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vaWYgKCB0aGlzLmlkID09ICdsbl9jb21wYW5pZXMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBMaW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0oIGRhdGFbIGkgXSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8qZWxzZSovIG5ld19mZWVkX2l0ZW0gPSBuZXcgTGlua2VkaW5GZWVkSXRlbSggZGF0YVsgaSBdLCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBMaW5rZWRpbkZlZWQ7XHJcblxyXG59XTtcclxuXHJcblxyXG5cclxuXHJcblxyXG5cclxuIiwiLypcclxuICAgIGFjY291bnRNYW5hZ2VyIG1vZHVsZVxyXG4qL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBbJyRodHRwJywgJyRzdGF0ZScsICckcm9vdFNjb3BlJywgJyRsb2NhbFN0b3JhZ2UnLCAnRUMnLCAnYXBpVXJsJywgJyRpbmplY3RvcicsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsICRpbmplY3RvciApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHZhciBGZWVkSXRlbSA9ICBGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdGZWVkSXRlbScpO1xyXG4gICAgdmFyIFRpbWVsaW5lRmVlZEl0ZW0gPSAgVGltZWxpbmVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdUaW1lbGluZUZlZWRJdGVtJyk7XHJcblxyXG4gICAgZnVuY3Rpb24gTGlua2VkaW5GZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgICBcclxuICAgIExpbmtlZGluRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTGlua2VkaW5GZWVkSXRlbTtcclxuICAgIFxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19jb21tZW50cyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfY29tbWVudHM7XHJcblxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUucmVuZGVyQ29tbWVudCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJlbmRlckNvbW1lbnQ7XHJcblxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUuc2hvd19saWtlcyA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnNob3dfbGlrZXM7XHJcblxyXG4gICAgTGlua2VkaW5GZWVkSXRlbS5wcm90b3R5cGUuYWRkX2NvbW1lbnQgPSBmdW5jdGlvbiAoIG1lc3NhZ2UsIGRpcmVjdCwgc2hhcmUgKVxyXG4gICAge1xyXG5cclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBMaW5rZWRpbkZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnRHJvcGRvd25GZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWQsIFRpbWVsaW5lRmVlZEl0ZW0sIERyb3Bkb3duRmVlZEl0ZW0gKXsgIFxyXG5cclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICBmdW5jdGlvbiBQaW50ZXJlc3RGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQaW50ZXJlc3RGZWVkO1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCAhdGhpcy5pbml0aWFsaXplZCApIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3BpX215QWN0aXZpdHknOiB0aGlzLmdldE15QWN0aXZpdHkoKTtcclxuICAgICAgICAgICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpX2JvYXJkJzogdGhpcy5nZXRCb2FyZHMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpX3BpbnMnOiB0aGlzLmdldFBpbnRlcmVzdEZlZWQoIHRoaXMuaWQgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3BpX2xpa2VzJzogdGhpcy5nZXRQaW50ZXJlc3RGZWVkKCB0aGlzLmlkICk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5nZXRCb2FyZHMgPSBmdW5jdGlvbiAoIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsIGRhdGEgPSBbXTtcclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9pZiAoIHdpbmRvdy5nbG9iYWxzLnBpQm9hcmRzICYmIHdpbmRvdy5nbG9iYWxzLnBpQm9hcmRzLmlkID09PSB0aGlzLnByb2ZpbGUuYWNjb3VudC5pZCApIGRhdGEgPSB3aW5kb3cuZ2xvYmFscy5waUJvYXJkcy5kYXRhO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vZWxzZSBcclxuICAgICAgICAgICAgICAgIHNlbGYucHJvZmlsZS5hY2NvdW50LnByb2ZpbGVzLmZvckVhY2goIGZ1bmN0aW9uKCBwcm9maWxlIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFwcm9maWxlLmRhdGEub2JqZWN0VHlwZSB8fCBwcm9maWxlLmRhdGEub2JqZWN0VHlwZSAhPT0gJ3VzZXInIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogcHJvZmlsZS5kYXRhLnVzZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHByb2ZpbGUudXNlcm5hbWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy93aW5kb3cuZ2xvYmFscy5waUJvYXJkcyA9IHVuZGVmaW5lZDtcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgIT09IHVuZGVmaW5lZCAmJiAhIF8uaXNFbXB0eSggc2VsZi5wcm9maWxlLmRhdGEuZGVmYXVsdEdyb3VwSWQgKSApXHJcbiAgICAgICAgICAgICAgICBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IHNlbGYucHJvZmlsZS5kYXRhLmRlZmF1bHRHcm91cElkO1xyXG5cclxuICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhICk7XHJcbiAgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5yZXF1ZXN0ID0gZnVuY3Rpb24gKCBzdHJlYW0sIHBhcmFtZXRlcnMsIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmKCBzZWxmLm5leHQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGtleTogJ2N1cnNvcicsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogc2VsZi5uZXh0ICAgICBcclxuICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAga2V5OiAnbGltaXQnLFxyXG4gICAgICAgICAgICB2YWx1ZTogJzIwJyAgICAgXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRQaW50ZXJlc3RGZWVkJyxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBzZWxmLnByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgcHJvZmlsZUlEOiBzZWxmLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgIHN0cmVhbTogc3RyZWFtLFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzOiBwYXJhbWV0ZXJzXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL3BpbnRlcmVzdCcsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwb25zZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgb2JqID0gcmVzcG9uc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykgY2FsbGJhY2soIG9iaiApOyBcclxuICAgICAgICB9KTsgICAgICAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLmdldFBpbnRlcmVzdEZlZWQgPSBmdW5jdGlvbiAoIHN0cmVhbSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzID0gW107XHJcblxyXG4gICAgICAgIHBhcmFtZXRlcnMucHVzaCh7XHJcbiAgICAgICAgICAgIGtleTogJ2ZpZWxkcycsXHJcbiAgICAgICAgICAgIHZhbHVlOiAnaWQsbGluayx1cmwsY3JlYXRvcixib2FyZCxjcmVhdGVkX2F0LG5vdGUsY291bnRzLG1lZGlhLGF0dHJpYnV0aW9uLGltYWdlLG1ldGFkYXRhJyAgICAgXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNlbGYucmVxdWVzdCggc3RyZWFtLCBwYXJhbWV0ZXJzLCBmdW5jdGlvbiAoIG9iaiApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIG9iai5yZXR1cm5Db2RlID09PSAnRkFJTCcgfHwgKCBvYmouZGF0YS5zdGF0dXMgJiYgb2JqLmRhdGEuc3RhdHVzID09PSAnZmFpbHVyZScgKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmlzY3JvbGx2aWV3KFwicmVmcmVzaFwiKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBhZ2UgPSBvYmouZGF0YS5wYWdlO1xyXG4gICAgICAgICAgICBpZiAoIHBhZ2UgJiYgcGFnZS5jdXJzb3IgKSBzZWxmLm5leHQgPSBwYWdlLmN1cnNvcjtcclxuICAgICAgICAgICAgb2JqLmRhdGEgPSBvYmouZGF0YS5kYXRhOyBcclxuXHJcbiAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggb2JqLmRhdGEgKTtcclxuXHJcbiAgICAgICAgICAgIHNlbGYuaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG4gICAgICAgIH0pOyAgXHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLm1vcmUgPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggIXRoaXMubmV4dCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgLy9zZWxmLmhpZGVfcHVsbHVwKCk7IFxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMgPSBbXTtcclxuXHJcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAga2V5OiAnZmllbGRzJyxcclxuICAgICAgICAgICAgdmFsdWU6ICdpZCxsaW5rLHVybCxjcmVhdG9yLGJvYXJkLGNyZWF0ZWRfYXQsbm90ZSxjb3VudHMsbWVkaWEsYXR0cmlidXRpb24saW1hZ2UsbWV0YWRhdGEnICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2VsZi5yZXF1ZXN0KCBzZWxmLmlkLCBwYXJhbWV0ZXJzLCBmdW5jdGlvbiAoIG9iaiApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIG9iai5yZXR1cm5Db2RlID09PSAnRkFJTCcgfHwgKCBvYmouZGF0YS5zdGF0dXMgJiYgb2JqLmRhdGEuc3RhdHVzID09PSAnZmFpbHVyZScgKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudC5maW5kKCcubW9yZScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gJyc7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhZ2UgPSBvYmouZGF0YS5wYWdlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBwYWdlICYmIHBhZ2UuY3Vyc29yICkgc2VsZi5uZXh0ID0gcGFnZS5jdXJzb3I7XHJcbiAgICAgICAgICAgICAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm5leHQgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICBvYmouZGF0YSA9IG9iai5kYXRhLmRhdGE7IFxyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuYWRkX2l0ZW1zKCBvYmouZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIFBpbnRlcmVzdEZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmlkID09ICdwaV9ib2FyZCcgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJvcGRvd25fb2JqID0gbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKTtcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKSApO1xyXG4gICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc2hvd19pdGVtcygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAncGlfYm9hcmQnICkgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGg7XHJcblxyXG4gICAgICAgIGlmICggZGF0YSApIGZvciAoIHZhciBpID0gMCwgbCA9IGRhdGEubGVuZ3RoOyBpIDwgbDsgaSsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0aGlzX2RhdHVtID0gdGhpcy5mb3JtYXRfaXRlbSggZGF0YVsgaSBdICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBUaW1lbGluZUZlZWRJdGVtKCB0aGlzX2RhdHVtLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYXBwZW5kX2l0ZW1zKCBhZGRfYWZ0ZXJfaW5kZXggKTtcclxuICAgIH07XHJcblxyXG4gICAgUGludGVyZXN0RmVlZC5wcm90b3R5cGUuZm9ybWF0X2l0ZW0gPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciB0aGlzX2RhdHVtID0ge1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBkYXRhLm5vdGUsLy8gZGF0YS5tZXNzYWdlLFxyXG4gICAgICAgICAgICByYXdfZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5jb3VudHMgJiYgZGF0YS5jb3VudHMucmVwaW5zICkgdGhpc19kYXR1bS5yZXBpbnMgPSAnJyArIGRhdGEuY291bnRzLnJlcGlucztcclxuXHJcbiAgICAgICAgZWxzZSB0aGlzX2RhdHVtLnJlcGlucyA9ICcnO1xyXG5cclxuICAgICAgICB0aGlzX2RhdHVtLmxpbmsgPSBkYXRhLmxpbms7XHJcblxyXG4gICAgICAgIGlmICggZGF0YS5jb3VudHMgJiYgZGF0YS5jb3VudHMubGlrZXMgKSB0aGlzX2RhdHVtLmxpa2VzID0geyBjb3VudDogZGF0YS5jb3VudHMubGlrZXMgfTtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmNvdW50cyAmJiBkYXRhLmNvdW50cy5jb21tZW50cyApIHRoaXNfZGF0dW0uY29tbWVudHMgPSB7IGNvdW50OiBkYXRhLmNvdW50cy5jb21tZW50cyB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEudXJsICkgdGhpc19kYXR1bS5wZXJtYWxpbmsgPSBkYXRhLnVybDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLmltYWdlICYmIGRhdGEuaW1hZ2Uub3JpZ2luYWwgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYSA9IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdwaG90bycsXHJcbiAgICAgICAgICAgICAgICBzcmM6IGRhdGEuaW1hZ2Uub3JpZ2luYWwudXJsXHJcbiAgICAgICAgICAgIH07ICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIGRhdGEubWV0YWRhdGEgJiYgZGF0YS5tZXRhZGF0YS5saW5rICYmIGRhdGEubWV0YWRhdGEubGluay5mYXZpY29uICYmIGRhdGEubWV0YWRhdGEubGluay5zaXRlX25hbWUgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uID0gJzxkaXYgY2xhc3M9XCJwaS1mcm9tXCI+PGltZyBzcmM9XCInICsgZGF0YS5tZXRhZGF0YS5saW5rLmZhdmljb247IFxyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gKz0gJ1wiIC8+PC9kaXY+ZnJvbSAnICsgZGF0YS5tZXRhZGF0YS5saW5rLnNpdGVfbmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmICggdGhpcy5pZCA9PSAncGlfYm9hcmQnICYmIHRoaXNfZGF0dW0ubWVzc2FnZSApIHRoaXNfZGF0dW0ubWVzc2FnZSA9IHRoaXNfZGF0dW0ubWVzc2FnZS5yZXBsYWNlKCcgICAgICAgTW9yZSAgICAgICAnLCcnKS50cmltKCk7XHJcblxyXG4gICAgICAgIC8vIGlmICggZGF0YS5ib2FyZCAhPSB1bmRlZmluZWQgJiYgZGF0YS5ib2FyZC5sZW5ndGggPiAwICkgXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICBpZiAoIHRoaXMuaWQgPT0gJ3BpX215QWN0aXZpdHknKSB0aGlzX2RhdHVtLm1lZGlhRGVzY3JpcHRpb24gPSAnUGlubmVkIG9udG86ICcgKyBkYXRhLmJvYXJkO1xyXG5cclxuICAgICAgICAvLyAgICAgZWxzZSAgdGhpc19kYXR1bS5tZWRpYURlc2NyaXB0aW9uID0gJ1Bpbm5lZCBmcm9tOiA8YSBocmVmPVwiaHR0cDovL3BpbnRlcmVzdC5jb20vc291cmNlLycgKyBkYXRhLmJvYXJkICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiPicgKyBkYXRhLmJvYXJkICsgJzwvYT4nO1xyXG4gICAgICAgIC8vIH0gXHJcblxyXG4gICAgICAgIC8vIGVsc2UgaWYgKCB0aGlzLmlkID09ICdwaV9ib2FyZCcgJiYgZGF0YS51c2VyX25hbWUgIT0gdW5kZWZpbmVkICYmIGRhdGEudXNlcl9uYW1lID09ICdQaW5uZWQgYnkgcGlubmVyJyApIHRoaXNfZGF0dW0ubWVkaWFEZXNjcmlwdGlvbiA9IGRhdGEudXNlcl9uYW1lOyAgICAgIFxyXG5cclxuICAgICAgICAvLyBpZiAoIGRhdGEuaW1nICE9IHVuZGVmaW5lZCAmJiBkYXRhLmltZ1sgMCBdICE9IHVuZGVmaW5lZCApXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgICB0aGlzX2RhdHVtLm1lZGlhID0ge1xyXG4gICAgICAgIC8vICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAvLyAgICAgICAgIHNyYzogZGF0YS5pbWdbIDAgXVxyXG4gICAgICAgIC8vICAgICB9OyAgIFxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07IFxyXG4gICAgfTtcclxuXHJcbiAgICBQaW50ZXJlc3RGZWVkLnByb3RvdHlwZS5jaGFuZ2VQaW5Cb2FyZCA9IGZ1bmN0aW9uKCBwcm9maWxlLCBhY3Rpb24sIGNvbW1hbmQsIHBhcmFtZXRlcnMsIG9iamVjdF9pZCwgY2FsbGJhY2sgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgY29tbWFuZDogY29tbWFuZCxcclxuICAgICAgICAgICAgYWNjb3VudElEOiBwcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogcHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgb2JqZWN0X2lkOiBvYmplY3RfaWQgfHwgJycsXHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnMgfHwgW11cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6ICdmZWVkL2xpa2UnLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgRUMuc2VydmVyLnJlcXVlc3QoIHJlcXVlc3QsIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIG9iaiA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBvYmogKTsgXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBQaW50ZXJlc3RGZWVkO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkSXRlbScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICRyb290U2NvcGUsICRsb2NhbFN0b3JhZ2UsIEVDLCBhcGlVcmwsIEZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gVGltZWxpbmVGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgRmVlZEl0ZW0uYXBwbHkoIHRoaXMsIFsgaXRlbV9kYXRhLCBmZWVkIF0pO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZGF0YS5saWtlcyA9PT0gdW5kZWZpbmVkICkgdGhpcy5kYXRhLmxpa2VzID0ge2NvdW50OiAwfTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEgIT09IHVuZGVmaW5lZCApIHRoaXMuZGF0YS5jb252ZXJzYXRpb24gPSB0aGlzLmRhdGEucmF3X2RhdGEuY29udmVyc2F0aW9uO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb252ZXJzYXRpb24gIT09IHVuZGVmaW5lZCAmJiAhQXJyYXkuaXNBcnJheSggdGhpcy5kYXRhLmNvbnZlcnNhdGlvbi50d2VldHMgKSApIHRoaXMuZGF0YS5jb252ZXJzYXRpb24udHdlZXRzID0gWyB0aGlzLmRhdGEuY29udmVyc2F0aW9uLnR3ZWV0cyBdO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYV9jb250ZW50ID09PSB1bmRlZmluZWQgKSB0aGlzLmRhdGEubWVkaWFfY29udGVudCA9ICcnO1xyXG4gICAgfVxyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVlZEl0ZW0ucHJvdG90eXBlICk7XHJcbiAgICBcclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVGltZWxpbmVGZWVkSXRlbTtcclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5nZXRJdGVtTmFtZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHJldHVybiBzZWxmLmRhdGEuZnJvbU5hbWU7XHJcbiAgICB9O1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldEl0ZW1UaW1lID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgdGltZXN0YW1wID0gcGFyc2VJbnQoIHRoaXMuZGF0YS51cGRhdGVUaW1lICksXHJcbiAgICAgICAgICAgIHRpbWUgPSAnJztcclxuXHJcbiAgICAgICAgdmFyIG5ld19kYXRlID0gbmV3IERhdGUoIHRpbWVzdGFtcCAqIDEwMDAgKSxcclxuICAgICAgICAgICAgZGF0ZSA9IG5ld19kYXRlOy8vLmZvcm1hdCgnbW1tIGRkLCB5eXl5LCBoOk1NdHQnKTtcclxuXHJcbiAgICAgICAgaWYgKCAhaXNOYU4oIHRoaXMuZGF0YS51cGRhdGVUaW1lICkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdUV0ZvbGxvd2VycycgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGltZSA9ICdAJyArdGhpcy5kYXRhLnVzZXJuYW1lOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSB0aW1lID0gZGF0ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgIT09ICdmYWNlYm9vaycgfHwgKCB0aGlzLmZlZWQuaWQgIT0gJ3NlYXJjaCcgJiYgdGhpcy5mZWVkLmlkICE9PSAnb3V0cmVhY2gnICkgfHwgKCB0aGlzLmZlZWQub3B0aW9ucy5wYXJhbWV0ZXJzICE9PSB1bmRlZmluZWQgJiYgdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09PSB1bmRlZmluZWQgKSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aW1lID0gJ0AnICt0aGlzLmRhdGEudXNlcm5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMudHlwZSA9PSAncGFnZScgfHwgdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwbGFjZScgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGltZSA9IHRoaXMuZGF0YS5jYXRlZ29yeTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRpbWU7XHJcbiAgICB9OyBcclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5nZXRJdGVtVGV4dCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBtZXNzYWdlX2h0bWwsXHJcbiAgICAgICAgICAgICR0ZW1wX21lc3NhZ2U7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3JzcycpIFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gJzxhIGhyZWY9XCInICt0aGlzLmRhdGEubGluaysgJ1wiIGNsYXNzPVwidGl0bGVcIiB0YXJnZXQ9XCJfYmxhbmtcIj4nICsoIHRoaXMuZGF0YS50aXRsZSB8fCAnJykrICc8L2E+JztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBkYXRhX21lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5tZXNzYWdlO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgZGF0YV9tZXNzYWdlX2h0bWwgPT09ICdzdHJpbmcnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHRlbXBfbWVzc2FnZSA9ICQoJzxkaXY+JykuaHRtbCggZGF0YV9tZXNzYWdlX2h0bWwgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgJHRlbXBfbWVzc2FnZS5maW5kKCdhJykuYXR0cigndGFyZ2V0JywnX2JsYW5rJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyICRpbWFnZXMgPSAkdGVtcF9tZXNzYWdlLmZpbmQoJ2ltZycpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCAkaW1hZ2VzLmxlbmd0aCApICRpbWFnZXMuZWFjaChmdW5jdGlvbigpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICR3cmFwcGVyID0gJCgnPGRpdj4nLCB7IGNsYXNzOiAncnNzLWltZy1jZW50ZXInIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR3cmFwcGVyLmFwcGVuZCggJCggdGhpcyApLmNsb25lKCkgKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCB0aGlzICkucmVwbGFjZVdpdGgoICR3cmFwcGVyICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBkYXRhX21lc3NhZ2VfaHRtbCA9ICR0ZW1wX21lc3NhZ2UuaHRtbCgpO1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sICs9IGRhdGFfbWVzc2FnZV9odG1sO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgLy8gKyggdGhpcy5kYXRhLm1lc3NhZ2UgfHwgJycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09PSAnZ29vZ2xlcGx1cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gdGhpcy5kYXRhLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBtZXNzYWdlX2h0bWwgPT09ICdzdHJpbmcnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHRlbXBfbWVzc2FnZSA9ICQoJzxkaXY+JykuaHRtbCggbWVzc2FnZV9odG1sICk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UuZmluZCgnYScpLmF0dHIoJ3RhcmdldCcsJ19ibGFuaycpO1xyXG5cclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9ICR0ZW1wX21lc3NhZ2UuaHRtbCgpOyAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5mZWVkLmlkID09ICdmYl9ub3RpZmljYXRpb25zJyB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQkNvbW1lbnRzJyB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQlNoYXJlcycgfHwgdGhpcy5kYXRhLmV2ZW50VHlwZSA9PSAnRkJPdGhlcnMnIHx8IHRoaXMuZGF0YS5ldmVudFR5cGUgPT0gJ0ZCTGlrZXMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vdXNlcl9saWtlcyA9PSB1bnJlYWRcclxuICAgICAgICAgICAgLy9tZXNzYWdlX2h0bWwgPSAnPGEgaHJlZj1cIicgK3RoaXMuZGF0YS5saW5rKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArKCB0aGlzLmRhdGEubWVzc2FnZSB8fCAnJykrICc8L2E+JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSB0aGlzLmRhdGEubWVzc2FnZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmV2ZW50VHlwZSA9PT0gJ0ZCQ29tbWVudHMnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvc3RfbWVzc2FnZSA9ICggdHlwZW9mIHRoaXMuZGF0YS5uYW1lID09PSAnc3RyaW5nJyAmJiB0aGlzLmRhdGEubmFtZS5sZW5ndGggPyB0aGlzLmRhdGEubmFtZSA6ICcnICksXHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdF9jb21tZW50ID0geyBtZXNzYWdlOicnIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy9pZiAoIHBvc3RfbWVzc2FnZS5sZW5ndGggPiAxNTAgKSBwb3N0X21lc3NhZ2UgPSBwb3N0X21lc3NhZ2Uuc2xpY2UoMCwxNTApICsgJy4uLic7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb21tZW50cyAmJiB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudC5sZW5ndGggKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQuc29ydChmdW5jdGlvbihhLGIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLmNyZWF0ZWRUaW1lIC0gYi5jcmVhdGVkVGltZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RfY29tbWVudCA9IHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50W3RoaXMuZGF0YS5jb21tZW50cy5jb21tZW50Lmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGxhc3RfY29tbWVudCA9IHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9ICc8c3BhbiBjbGFzcz1cImNvbW1lbnQtc3VidGl0bGVcIj4nICsgRUMucmVwbGFjZV90eXBlX2luX3VzZXJuYW1lKHRoaXMucHJvZmlsZS51c2VybmFtZSkgKyAnXFwncyBQb3N0Ojwvc3Bhbj4gJyArIFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc3RfbWVzc2FnZSArICc8YnI+PGJyPjxzcGFuIGNsYXNzPVwiY29tbWVudC1zdWJ0aXRsZVwiPicgKyB0aGlzLmRhdGEuZnJvbU5hbWUgKyAnXFwncyBDb21tZW50Ojwvc3Bhbj4gJyArIGxhc3RfY29tbWVudC5tZXNzYWdlOyBcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge30gLy8gb2xkIHN0eWxlXHJcbiAgICAgICAgICAgIH0gIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdibG9nZ2VyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB0aXRsZSA9ICcnO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubmFtZSAhPT0gdW5kZWZpbmVkICkgdGl0bGUgPSAnPGEgaHJlZj1cIicgK3RoaXMuZGF0YS5wZXJtYWxpbmsrICdcIiBjbGFzcz1cInRpdGxlXCIgdGFyZ2V0PVwiX2JsYW5rXCI+JyArKCB0aGlzLmRhdGEubmFtZSB8fCAnJykrICc8L2E+JztcclxuXHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRpdGxlICsgKCB0aGlzLmRhdGEubWVzc2FnZSB8fCAnJyk7IFxyXG4gICAgICAgICAgICAvL21lc3NhZ2VfaHRtbCA9IHRpdGxlICsgKCB1cmxfdG9fbGluayggdGhpcy5kYXRhLm1lc3NhZ2UgKSB8fCAnJyk7ICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3R3aXR0ZXInIHx8IHRoaXMuZGF0YS5ldmVudE5ldHdvcmsgPT0gJ3R3aXR0ZXInIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhLnJldHdlZXRlZF9zdGF0dXMgPT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0ICE9PSB1bmRlZmluZWQgXHJcbiAgICAgICAgICAgICAgICAmJiB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0LnN0cmVhbUVudHJ5ICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldC5zdHJlYW1FbnRyeSApIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscyAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy51cmxzICkgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB1cmxzID0gdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLnVybHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgLGZpcnN0X3VybDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KHVybHMpICkgZmlyc3RfdXJsID0gdXJsc1sgMCBdLnVybDtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGZpcnN0X3VybCA9IHVybHMudXJsO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSB0aGlzLmRhdGEubWVzc2FnZS5yZXBsYWNlKGZpcnN0X3VybCwgJycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5tZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gRUMudHdfZGVlcF9saW5rX3RvX2h0bWwoIHRoaXMuZGF0YS5tZXNzYWdlLCB0aGlzLmRhdGEucmF3X2RhdGEgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZXNzYWdlICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldFBvc2l0aW9uKHN0ciwgbSwgaSkgXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyLnNwbGl0KG0sIGkpLmpvaW4obSkubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIHJlc3VsdCA9IGdldFBvc2l0aW9uKHRoaXMuZGF0YS5tZXNzYWdlLCAnaHR0cCcsIDIpIDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gZ2V0UG9zaXRpb24obWVzc2FnZV9odG1sLCAnaHR0cCcsIDIpIDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gbWVzc2FnZV9odG1sLnN1YnN0cmluZygwLCByZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzICYmIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy51cmxzICE9PSB1bmRlZmluZWQgJiYgISQuaXNFbXB0eU9iamVjdCggdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLnVybHMgKSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybHMgPSB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscztcclxuICAgICAgICAgICAgICAgICAgICBFQy5mb3JfZWFjaCh1cmxzLCBmdW5jdGlvbiAoIHVybCApIFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB1cmwudXJsICYmIHVybC5leHBhbmRlZF91cmwgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBtZXNzYWdlX2h0bWwucmVwbGFjZSh1cmwudXJsLCB1cmwuZXhwYW5kZWRfdXJsKTsgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH0pOyAgXHJcbiAgICAgICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YS5kZXNjcmlwdGlvbiAmJiAoIHNlbGYuZmVlZC5pZCA9PSAndHdGcmllbmRzJyB8fCBzZWxmLmZlZWQuaWQgPT0gJ3R3Rm9sbG93ZXJzJyB8fCBzZWxmLmRhdGEuZXZlbnRUeXBlID09ICdUV0ZvbGxvd2VycydcclxuICAgICAgICAgICAgICAgICAgICB8fCAoICggc2VsZi5mZWVkLmlkID09ICdzZWFyY2gnIHx8IHNlbGYuZmVlZC5pZCA9PSAnb3V0cmVhY2gnICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIHNlbGYuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMudHlwZSA9PSAndXNlcnMnICkgKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS5yYXdfZGF0YS5kZXNjcmlwdGlvbjtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEuZXZlbnRUeXBlID09ICdUV0ZvbGxvd2VycycgKSBtZXNzYWdlX2h0bWwgKz0gJyA8c3BhbiBjbGFzcz1cInZpZXctZm9sbG93ZXJcIj5WaWV3ICcgKyBzZWxmLmRhdGEuZnJvbU5hbWUgKyAnIHByb2ZpbGU8L3NwYW4+JzsgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy51cmxfdG9fbGluayggbWVzc2FnZV9odG1sICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIG1lc3NhZ2VfaHRtbCA9IEVDLnVybF90b19saW5rKCB0aGlzLmRhdGEubWVzc2FnZSApO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09ICdyc3MnICYmIHR5cGVvZiBtZXNzYWdlX2h0bWwgPT0gJ3N0cmluZycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBtZXNzYWdlX2h0bWxcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC93aWR0aD0vZ2ksICdkYXRhLXc9JylcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9oZWlnaHQ9L2dpLCAnZGF0YS1oPScpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvbWFyZ2luL2dpLCAnZGF0YS1tJylcclxuICAgICAgICAgICAgICAgIC8vIC5yZXBsYWNlKC9tYXJnaW4tbGVmdD0vZ2ksICdkYXRhLW0tbD0nKVxyXG4gICAgICAgICAgICAgICAgLy8gLnJlcGxhY2UoL21hcmdpbi1yaWdodD0vZ2ksICdkYXRhLW0tcj0nKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL2EgaHJlZi9naSwgJ2EgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZicpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvPGJyXFxzKltcXC9dPz4vZ2ksICc8c3Bhbj48L3NwYW4+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAndHdpdHRlcicgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAndHdpdHRlcicgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9IEVDLnR3X3VzZXJfbWVudGlvbnNfdG9fbGlua3MoIG1lc3NhZ2VfaHRtbCwgdGhpcy5kYXRhLnJhd19kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy5oYXNodGFnX3RvX2xpbmsoIG1lc3NhZ2VfaHRtbCwgJ3R3aXR0ZXInICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2xpbmtlZGluJyApIG1lc3NhZ2VfaHRtbCA9IHRoaXMuZGF0YS50aXRsZSArIHRoaXMuZGF0YS5wcmVfc3VtbWFyeSArIG1lc3NhZ2VfaHRtbDtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAodGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2ZhY2Vib29rJyAmJiB0aGlzLmZlZWQuaWQgIT09ICdmYl9ub3RpZmljYXRpb25zJykgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgc3RvcnlfaHRtbDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9ICQoXCI8ZGl2IC8+XCIpLmh0bWwoIHRoaXMuZGF0YS5tZXNzYWdlICkudGV4dCgpOyBcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnN0b3J5ICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLnN0b3J5Lmxlbmd0aCA+IDAgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCB0aGlzLmRhdGEuc3RvcnkuaW5kZXhPZignWW91IGFkZGVkICcpID09IC0xIClcclxuICAgICAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgICAgICAgICBzdG9yeV9odG1sID0gJChcIjxkaXYgLz5cIikuaHRtbCggdGhpcy5kYXRhLnN0b3J5ICkudGV4dCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5zdG9yeVRhZ3MgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEuc3RvcnlUYWdzLnN0b3J5VGFnICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdG9yeV9odG1sID0gRUMuZmJfdGFnc190b19saW5rcyggc3RvcnlfaHRtbCwgdGhpcy5kYXRhLnN0b3J5VGFncy5zdG9yeVRhZywgJ3N0b3J5JyApO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcnlfaHRtbCA9IEVDLnVybF90b19saW5rKCBzdG9yeV9odG1sICk7XHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lc3NhZ2VUYWdzICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lc3NhZ2VUYWdzLm1lc3NhZ2VUYWcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgPSBFQy5mYl90YWdzX3RvX2xpbmtzKCBtZXNzYWdlX2h0bWwsIHRoaXMuZGF0YS5tZXNzYWdlVGFncy5tZXNzYWdlVGFnLCAnbWVzc2FnZScgKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gRUMudXJsX3RvX2xpbmsoIG1lc3NhZ2VfaHRtbCApO1xyXG5cclxuICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gRUMuaGFzaHRhZ190b19saW5rKCBtZXNzYWdlX2h0bWwsICdmYWNlYm9vaycpO1xyXG5cclxuICAgICAgICAgICAgaWYoIHN0b3J5X2h0bWwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKCBtZXNzYWdlX2h0bWwubGVuZ3RoID4gMCApIHN0b3J5X2h0bWwgPSAnPHA+JyArIHN0b3J5X2h0bWwgKyAnPC9wPic7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gc3RvcnlfaHRtbCArIG1lc3NhZ2VfaHRtbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5pZCA9PSAnY2luYm94JyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG1sID0gJ1lvdSBoYXZlIGEgY29tbWVudCBoZXJlJztcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jb21tZW50cyAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50ICE9PSB1bmRlZmluZWQgKSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudCApICkgdGhpcy5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgPSBbIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50IF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKCB0aGlzLmRhdGEuY29tbWVudHMuY29tbWVudC5sZW5ndGggPiAwIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UgPSAkKCc8ZGl2PicpLmh0bWwoIHRoaXMuZGF0YS5jb21tZW50cy5jb21tZW50WyAwIF0ubWVzc2FnZSApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGVtcF9tZXNzYWdlLmZpbmQoJ2EnKS5hdHRyKCd0YXJnZXQnLCdfYmxhbmsnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvcmlnX21lc3NhZ2UgPSB0aGlzLmRhdGEubWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0eXBlb2Ygb3JpZ19tZXNzYWdlID09PSAnc3RyaW5nJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkdGVtcF9tZXNzYWdlMiA9ICQoJzxkaXY+JykuaHRtbCggb3JpZ19tZXNzYWdlICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0ZW1wX21lc3NhZ2UyLmZpbmQoJ2EnKS5hdHRyKCd0YXJnZXQnLCdfYmxhbmsnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnX21lc3NhZ2UgPSAkdGVtcF9tZXNzYWdlMi5odG1sKCk7ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VfaHRtbCA9ICAgJzxzcGFuIGNsYXNzPVwiY29tbWVudC1zdWJ0aXRsZVwiPicgKyBFQy5yZXBsYWNlX3R5cGVfaW5fdXNlcm5hbWUodGhpcy5wcm9maWxlLnVzZXJuYW1lKSArICdcXCdzIFBvc3Q6PC9zcGFuPiAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bWwgKz0gIG9yaWdfbWVzc2FnZSArICc8YnI+PGJyPjxzcGFuIGNsYXNzPVwiY29tbWVudC1zdWJ0aXRsZVwiPicgKyB0aGlzLmRhdGEuZnJvbU5hbWUgKyAnXFwncyBDb21tZW50Ojwvc3Bhbj4gJyArICR0ZW1wX21lc3NhZ2UuaHRtbCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAvL3JlbmRlcl90YWdfaXRfYnV0dG9uKCBzZWxmLmRhdGEsICR0aGlzLCAkdGhpcy5maW5kKCcuaXRlbS10ZXh0JyksIHNlbGYuZGF0YS5ldmVudFRpbWUgKTsgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lc3NhZ2VfaHRtbCA9IG1lc3NhZ2VfaHRtbC5yZXBsYWNlKC9eXFxzXFxzKi8sICcnKS5yZXBsYWNlKC9cXHNcXHMqJC8sICcnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG1lc3NhZ2VfaHRtbDtcclxuICAgICAgICBcclxuICAgICAgICAvL3RoZW4gcmVuZGVyX3RhZ19pdF9idXR0b25cclxuICAgIH07XHJcbiAgICBcclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldEl0ZW1NZWRpYSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGV4dF9lbGVtZW50LCBpdGVtTWVkaWE7XHJcbiAgICAgICAgdmFyIHNsaWRlcl9pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIHNlbGYuZGF0YS5tZWRpYSApICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IHNlbGYuZmVlZC5pZDtcclxuICAgICAgICAgICAgdmFyIGl0ZW1faWQgPSAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJyA/IHNlbGYuZGF0YS5wb3N0SUQgOiBzZWxmLmRhdGEuaWQgKTtcclxuICAgICAgICAgICAgdmFyIGFsdCA9ICQuaXNFbXB0eU9iamVjdCggc2VsZi5kYXRhLm1lZGlhWyAwIF0uYWx0ICkgPyBcIlwiIDogc2VsZi5kYXRhLm1lZGlhWyAwIF0uYWx0O1xyXG4gICAgICAgICAgICB2YXIgaW1hZ2VBcnJheSA9ICcnO1xyXG4gICAgICAgICAgICB2YXIgbmF2RG90cyA9IFwiXCI7XHJcbiAgICAgICAgICAgIHZhciBidG5OYW1lID0gXCJidG4tXCIgKyB0eXBlICsgXCJfXCIgKyBpdGVtX2lkO1xyXG5cclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5kYXRhLm1lZGlhLmxlbmd0aDsgaSsrIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlRWwgPSB0aGlzLmRhdGEubWVkaWFbIGkgXTtcclxuICAgICAgICAgICAgICAgIHZhciB1cmxfbiA9IEVDLkZCX3RodW1ibmFpbF90b19mdWxsX3NpemUoIGltYWdlRWwuc3JjICk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycklkID0gXCJpbWctXCIgKyB0eXBlICsgXCJfXCIgKyBpdGVtX2lkICsgXCJfXCIgKyBpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJEb3RJZCA9IFwiaW1nLWRvdC1cIiArIGk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJldklkID0gXCJpbWctXCIgKyB0eXBlICsgXCJfXCIgKyBpdGVtX2lkICsgXCJfXCIgKyAoIGkgPT0gMCA/IHRoaXMuZGF0YS5tZWRpYS5sZW5ndGggLSAxIDogaSAtIDEgKTtcclxuICAgICAgICAgICAgICAgIHZhciBuZXh0SWQgPSBcImltZy1cIiArIHR5cGUgKyBcIl9cIiArIGl0ZW1faWQgKyBcIl9cIiArICggaSA9PSAoIHRoaXMuZGF0YS5tZWRpYS5sZW5ndGggLSAxICkgPyAwIDogaSArIDEgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOnVybF9uLCB3Ojk2NCwgaDoxMDI0fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZmFjZWJvb2snICYmIGkgPT0gKHRoaXMuZGF0YS5tZWRpYS5sZW5ndGggLSAxKSApXHJcbiAgICAgICAgICAgICAgICAgICAgaW1hZ2VBcnJheSA9IFwiPGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIHVybF9uICsgXCInID5cIjtcclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKCBpID09IDAgKVxyXG4gICAgICAgICAgICAgICAgICAgIGltYWdlQXJyYXkgPSBcIjxpbWcgY2xhc3M9XFxcImZ1bGwtaW1hZ2VcXFwiIHNyYz0nXCIgKyB1cmxfbiArIFwiJyA+XCI7XHJcblxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2ZhY2Vib29rJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5yZXZlcnNlKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGltYWdlQXJyYXkgPSAnPHNwYW4gY2xhc3M9XCJwcmV2XCI+PC9zcGFuPicraW1hZ2VBcnJheSsnPHNwYW4gY2xhc3M9XCJuZXh0XCI+PC9zcGFuPic7XHJcblxyXG4gICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoaW1hZ2VBcnJheSk7XHJcbiAgICAgICAgICAgIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7b3BlblBob3RvU3dpcGUoIHNsaWRlcl9pdGVtcyApO30gKTsgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgdGhpcy5kYXRhLm1lZGlhID09ICdvYmplY3QnICYmIHRoaXMuZGF0YS5tZWRpYS50eXBlICE9ICd1bmF2YWlsYWJsZScgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGFsdCA9IHRoaXMuZGF0YS5tZWRpYS5hbHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5uZXR3b3JrID09PSAnZmFjZWJvb2snICYmIHR5cGVvZiB0aGlzLmRhdGEucGljdHVyZSA9PT0gJ3N0cmluZycgKSB0aGlzLmRhdGEubWVkaWEuc3JjID0gdGhpcy5kYXRhLnBpY3R1cmU7XHJcblxyXG4gICAgICAgICAgICBpZih0aGlzLmRhdGEubWVkaWEudHlwZT09XCJwaG90b1wiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdXJsX24gPSBFQy5GQl90aHVtYm5haWxfdG9fZnVsbF9zaXplKCB0aGlzLmRhdGEubWVkaWEuc3JjICksXHJcbiAgICAgICAgICAgICAgICAgICAgc3R1ZmYgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uICkgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEuY2FwdGlvbiAhPT0gdW5kZWZpbmVkICkgc3R1ZmYgPSB0aGlzLmRhdGEuY2FwdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuZGF0YS5tZWRpYS5hbHQgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuYWx0ICE9IHRoaXMuZGF0YS5tZXNzYWdlICkgc3R1ZmYgPSB0aGlzLmRhdGEubWVkaWEuYWx0O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggLyp0aGlzLmZlZWQuaWQgIT0gJ3BpX2JvYXJkJyovdGhpcy5mZWVkLm5ldHdvcmsgIT0gJ3BpbnRlcmVzdCcgKSBzdHVmZiA9IEVDLnJlcGxhY2VVUkxXaXRoSFRNTExpbmtzKCBzdHVmZiApO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBtZXRhX2luZm8gPSAnJztcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnICkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyA9IFwiPGEgY2xhc3M9J3BoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGluaycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgdGhpcy5kYXRhLmNoYW5uZWxMaW5rICsgXCInKTtcXFwiID5cIiArIHRoaXMuZGF0YS5jaGFubmVsVGl0bGUgKyBcIjwvYT5cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3BpbnRlcmVzdCcgJiYgdGhpcy5kYXRhLmxpbmsgJiYgdGhpcy5kYXRhLnJhd19kYXRhLm1ldGFkYXRhLmxpbmsgJiYgdGhpcy5kYXRhLnJhd19kYXRhLm1ldGFkYXRhLmxpbmsudGl0bGUgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyA9IFwiPGEgY2xhc3M9J3BoX2xpbmsnIGhyZWY9J2phdmFzY3JpcHQ6OycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgdGhpcy5kYXRhLmxpbmsgKyBcIicpO1xcXCI+XCIgKyB0aGlzLmRhdGEucmF3X2RhdGEubWV0YWRhdGEubGluay50aXRsZSArIFwiPC9hPlwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIHx8IHRoaXMuZGF0YS5ldmVudE5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdwX2ltZztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhLmZ1bGxJbWFnZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UudXJsICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncF9pbWcgPSB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybDsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEubWVkaWEuaW1hZ2UgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuaW1hZ2UudXJsICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncF9pbWcgPSB0aGlzLmRhdGEubWVkaWEuaW1hZ2UudXJsOyAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuY29udGVudCAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICkgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBncF9pbWcgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZiX2ltYWdlJz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgZ3BfaW1nICsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCInID48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vXCI8YSBjbGFzcz0ncGhfbGluaycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgZ3BfaW1nICsgXCInKTtcXFwiID5cIiArICggdGhpcy5kYXRhLm1lZGlhLmRpc3BsYXlOYW1lIHx8ICcnICkgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApOyAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOmdwX2ltZywgdzo5NjQsIGg6MTAyNH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9ICQoXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmYl9pbWFnZSc+PGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIHVybF9uICsgXCInID48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+PGRpdiBjbGFzcz0ncGFkbHIxMCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFfaW5mbyArXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PjwvZGl2PlwiLy8rXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPlwiICsgdGhpcy5kYXRhLm1lc3NhZ2UgKyBcIjwvZGl2PlwiLy8rXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgcGhvdG8nPjxkaXYgY2xhc3M9J2ZsYXNoJz5cIisoIHVybF90b19saW5rKCB0aGlzLmRhdGEubWVzc2FnZSApLmxlbmd0aCArJyA6IDogJysgc3R1ZmYubGVuZ3RoICkrXCI8L2Rpdj48L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzp1cmxfbiwgdzo5NjQsIGg6MTAyNH0pOyBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLmNzcyh7XCJmb250LXNpemVcIjpcIjEwcHhcIn0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYodGhpcy5kYXRhLm1lZGlhLnR5cGU9PVwidmlkZW9cIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0dWZmID0gKCBFQy5yZXBsYWNlVVJMV2l0aEhUTUxMaW5rcyggdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gPT09IHVuZGVmaW5lZCA/ICh0aGlzLmRhdGEuY2FwdGlvbiA9PT0gdW5kZWZpbmVkID8gKHRoaXMuZGF0YS5tZWRpYS5hbHQgPT0gdGhpcy5kYXRhLm1lc3NhZ2UgPyAnJyA6IHRoaXMuZGF0YS5tZWRpYS5hbHQpIDogdGhpcy5kYXRhLmNhcHRpb24gKSA6IHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uICkgfHwgJycpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBsaW5rX3RleHQgPSAnV2F0Y2ggdmlkZW8nO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1ldGFfaW5mbyA9ICcnO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtfdGV4dCA9IHRoaXMuZGF0YS5tZWRpYS50aXRsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJ5X2NoYW5uZWwgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5jaGFubmVsSWQgIT0gdGhpcy5kYXRhLmZyb21JZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnlfY2hhbm5lbCA9ICc8bGk+YnkgPGEgY2xhc3M9XCJ5dC11c2VyLW5hbWVcIiBocmFmPVwiamF2YXNjcmlwdDo7XCIgb25DbGljaz1cIkVDLlVJLklBQihcXCcnICsgdGhpcy5kYXRhLmNoYW5uZWxMaW5rICsgJ1xcJyk7XCIgPicgKyB0aGlzLmRhdGEuY2hhbm5lbFRpdGxlICsgJzwvYT48L2xpPic7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZXRhX2luZm8gPSAnPGEgY2xhc3M9XCJwaF9saW5rIGZvbnQtd2VpZ2h0IG1hci00IHVpLWxpbmtcIiBocmVmPVwiamF2YXNjcmlwdDpyYW07XCI+JyArIGxpbmtfdGV4dCArICc8L2E+PHVsIGNsYXNzPVwieXQtbWV0YS1pbmZvIHVpLWdyaWQtc29sb1wiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBieV9jaGFubmVsICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT4nICsgIG5ldyBEYXRlKCB0aGlzLmRhdGEubWVkaWEudXBsb2FkRGF0ZSApLmZvcm1hdCgnbW1tIGRkLCB5eXl5JykgKyAnPC9saT4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJzxsaT4mbmJzcDsmbmJzcDsnICsgdGhpcy5kYXRhLnZpZXdzLmNvdW50ICsgJyB2aWV3czwvbGk+JyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC91bD4nO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuY29udGVudCAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICkgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYS5jb250ZW50OyAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZXRhX2luZm8gPSAnPGEgY2xhc3M9XCJwaF9saW5rIGZvbnQtd2VpZ2h0IG1hci00IHVpLWxpbmtcIiBocmVmPVwiI1wiPicgKyAoIHRoaXMuZGF0YS5tZWRpYS5kaXNwbGF5TmFtZSB8fCAnV2F0Y2ggdmlkZW8nICkgKyAnPC9hPic7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEudmlkZW8gIT09IHVuZGVmaW5lZCApIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3VpLWdyaWQtc29sbyBsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ltZ19ib3ggdmlkZW8gdWktZ3JpZC1zb2xvIHBvc2l0aW9uLXJlbGF0aXZlJz48aW1nIGNsYXNzPVxcXCJ2aWRlby1idXR0b25cXFwiIHNyYz1cXFwiaW1nL3BsYXktYnV0dG9uLnBuZ1xcXCI+PGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIHRoaXMuZGF0YS5tZWRpYS5zcmMucmVwbGFjZSgnRmRlZmF1bHQnLCAnRmhxZGVmYXVsdCcpLnJlcGxhY2UoJy9kZWZhdWx0JywgJy9ocWRlZmF1bHQnKSArIFwiJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+PGRpdiBjbGFzcz0ncGFkbHIxMCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIC8vXCI8YSBjbGFzcz0ncGhfbGluaycgaHJlZj0nIyc+XCIgKyBsaW5rX3RleHQgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YV9pbmZvICsgXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgdmlkZW8nPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjxhIGNsYXNzPSd2aWRlb19saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uY2xpY2s9XFxcIkVDLlVJLklBQignXCIrdGhpcy5kYXRhLm1lZGlhLnZpZGVvLmRpc3BsYXlfdXJsK1wiJyk7XFxcIj5WaWRlbyBsaW5rPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLm1lZGlhICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lZGlhLnZpZGVvICE9PSB1bmRlZmluZWQgKSBleHRfZWxlbWVudC5vbignY2xpY2snLGZ1bmN0aW9uICggZXZlbnQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuZGlyKCBzZWxmIClcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICBFQy5VSS5JQUIoZW5jb2RlVVJJKHNlbGYuZGF0YS5tZWRpYS52aWRlby5kaXNwbGF5X3VybCsnP2F1dG9wbGF5PTEnKSwgJycsICdfc3lzdGVtJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy93aW5kb3cub3BlbiggZW5jb2RlVVJJKHNlbGYuZGF0YS5tZWRpYS52aWRlby5zb3VyY2VfdXJsLnJlcGxhY2UoJ2h0dHA6Ly8nLCdodHRwczovLycpICksJ19zeXN0ZW0nLCdsb2NhdGlvbj15ZXMnKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3ZhciBtZWRpYU9iamVjdCA9ICc8aWZyYW1lIHNyYz1cIicrc2VsZi5kYXRhLm1lZGlhLnZpZGVvLnNvdXJjZV91cmwucmVwbGFjZSgnaHR0cDovLycsJ2h0dHBzOi8vJykrJ1wiIHdpZHRoPVwiMTI4MFwiIGhlaWdodD1cIjcyMFwiIGZyYW1lYm9yZGVyPVwiMFwiPjwvaWZyYW1lPic7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9wb3N0X21hbmFnZXIud2F0Y2hQaWN0dXJlVmlkZW8obWVkaWFPYmplY3QsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEudmlkZW8gIT09IHVuZGVmaW5lZCApIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsICcueXQtdXNlci1uYW1lJyAsZnVuY3Rpb24gKCBldmVudCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZih0aGlzLmRhdGEubWVkaWEudHlwZT09XCJhcnRpY2xlXCImJih0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3R1ZmYgPSAnJywgdXJsX247XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuY29udGVudCAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICkgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmxfbiA9IHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UudXJsOyAgICBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXRhLm1lZGlhLmltYWdlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLm1lZGlhLmltYWdlLnVybCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmxfbiA9IHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmw7ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdXJsX24gIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3VpLWdyaWQtc29sbyBsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94IHVpLWdyaWQtc29sbyBwb3NpdGlvbi1yZWxhdGl2ZSc+PGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIHVybF9uICsgXCInID48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nY2xlYXInPjwvZGl2PjxkaXYgY2xhc3M9J3BhZGxyMTAnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8YSBjbGFzcz0ncGhfbGluayBmb250LXdlaWdodCBtYXItNCB1aS1saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyB0aGlzLmRhdGEubWVkaWEudXJsICsgXCInKTtcXFwiID5cIiArICggdGhpcy5kYXRhLm1lZGlhLmRpc3BsYXlOYW1lIHx8ICcnICkgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZ3JheV90ZXh0IG1lZGlhJz5cIiArIHN0dWZmICsgXCI8L2Rpdj48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzp1cmxfbiwgdzo5NjQsIGg6MTAyNH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHRoaXMuZGF0YS5tZWRpYS50eXBlPT09J2FuaW1hdGVkX2ltYWdlX3NoYXJlJyAmJiB0aGlzLmZlZWQubmV0d29yayA9PT0gJ2ZhY2Vib29rJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIHVybF9uID0gdGhpcy5kYXRhLmxpbmtcclxuICAgICAgICAgICAgICAgICAgICAsc3R1ZmYgPSAnJ1xyXG4gICAgICAgICAgICAgICAgICAgICxtO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHJlID0gL3VybD1bXiYjXSovaVxyXG4gICAgICAgICAgICAgICAgLy8gICx1cmxfbiA9IHRoaXMuZGF0YS5tZWRpYS5zcmNcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpZiAoIChtID0gcmUuZXhlYyggdXJsX24gKSkgIT09IG51bGwgKVxyXG4gICAgICAgICAgICAgICAgLy8ge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIHVybF9uID0gZGVjb2RlVVJJQ29tcG9uZW50KCBtWyAwIF0ucmVwbGFjZSgndXJsPScsJycpICk7XHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmJfaW1hZ2UnPjxpbWcgc3JjPSdcIiArIHVybF9uICsgXCInID48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZ3JheV90ZXh0IHBob3RvJz5cIiArIHN0dWZmICsgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgKTsgIFxyXG5cclxuICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzp1cmxfbiwgdzo5NjQsIGg6MTAyNH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgaWYoJC5pc0VtcHR5T2JqZWN0KHRoaXMuZGF0YS5tZWRpYS5zcmMpKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHVmZiA9ICggRUMucmVwbGFjZVVSTFdpdGhIVE1MTGlua3MoIHRoaXMuZGF0YS5tZWRpYURlc2NyaXB0aW9uID09PSB1bmRlZmluZWQgPyAodGhpcy5kYXRhLmNhcHRpb24gPT09IHVuZGVmaW5lZCA/ICh0aGlzLmRhdGEubWVkaWEuYWx0ICE9IHRoaXMuZGF0YS5tZXNzYWdlID8gJycgOiB0aGlzLmRhdGEubWVkaWEuYWx0KSA6IHRoaXMuZGF0YS5jYXB0aW9uICkgOiB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiApIHx8ICcnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGdwX2ltZztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5tZWRpYS5mdWxsSW1hZ2UgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncF9pbWcgPSB0aGlzLmRhdGEubWVkaWEuZnVsbEltYWdlLnVybDsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGF0YS5tZWRpYS5pbWFnZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZGF0YS5tZWRpYS5pbWFnZS51cmwgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3BfaW1nID0gdGhpcy5kYXRhLm1lZGlhLmltYWdlLnVybDsgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEubWVkaWEuY29udGVudCAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5tZWRpYS5jb250ZW50ICkgKSBzdHVmZiA9IHRoaXMuZGF0YS5tZWRpYS5jb250ZW50O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZ3BfaW1nICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmYl9pbWFnZSc+PGltZyBjbGFzcz1cXFwiZnVsbC1pbWFnZVxcXCIgc3JjPSdcIiArIGdwX2ltZyArIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIicgPjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdjbGVhcic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1wiPGEgY2xhc3M9J3BoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGluaycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgZ3BfaW1nICsgXCInKTtcXFwiID5cIiArICggdGhpcy5kYXRhLm1lZGlhLmRpc3BsYXlOYW1lIHx8ICcnICkgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZ3JheV90ZXh0IHBob3RvJz5cIiArIHN0dWZmICsgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7ICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zLnB1c2goeydzcmMnOmdwX2ltZywgdzo5NjQsIGg6MTAyNH0pOyAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nbF9tZXNzYWdlIHVpLWdyaWQtc29sbyc+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdwYWRscjEwJz48YSBjbGFzcz0ncGhfbGluayBmb250LXdlaWdodCBtYXItNCB1aS1saW5rJyBocmVmPSdqYXZhc2NyaXB0OjsnIG9uQ2xpY2s9XFxcIkVDLlVJLklBQignXCIgKyB0aGlzLmRhdGEubWVkaWEuaHJlZiArIFwiJyk7XFxcIj5cIiArIHRoaXMuZGF0YS5tZWRpYS5ocmVmICsgXCI8L2E+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQnPlwiICsgc3R1ZmYgKyBcIjwvZGl2PjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKTsgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRUMuVUkuSUFCKCBlbmNvZGVVUkkoIHRoaXMuZGF0YS5tZWRpYS5ocmVmICksJycsJ19zeXN0ZW0nKTsgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgc3R1ZmYgPSAoIEVDLnJlcGxhY2VVUkxXaXRoSFRNTExpbmtzKCB0aGlzLmRhdGEubWVkaWFEZXNjcmlwdGlvbiA9PT0gdW5kZWZpbmVkID8gKHRoaXMuZGF0YS5jYXB0aW9uID09PSB1bmRlZmluZWQgPyAodGhpcy5kYXRhLm1lZGlhLmFsdCAhPSB0aGlzLmRhdGEubWVzc2FnZSA/ICcnIDogdGhpcy5kYXRhLm1lZGlhLmFsdCkgOiB0aGlzLmRhdGEuY2FwdGlvbiApIDogdGhpcy5kYXRhLm1lZGlhRGVzY3JpcHRpb24gKSB8fCAnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSAkKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2xfbWVzc2FnZSB1aS1ncmlkLXNvbG8nPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94Jz48aW1nIGNsYXNzPVxcXCJmdWxsLWltYWdlXFxcIiBzcmM9J1wiICsgdGhpcy5kYXRhLm1lZGlhLnNyYyArIFwiJyA+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj48ZGl2IGNsYXNzPSdwYWRscjEwJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGEgY2xhc3M9J3BoX2xpbmsgZm9udC13ZWlnaHQgbWFyLTQgdWktbGluaycgaHJlZj0namF2YXNjcmlwdDo7JyBvbkNsaWNrPVxcXCJFQy5VSS5JQUIoJ1wiICsgdGhpcy5kYXRhLm1lZGlhLmhyZWYgKyBcIicpO1xcXCI+XCIgKyAoIHRoaXMuZGF0YS5uYW1lIHx8ICcnICkgKyBcIjwvYT5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZ3JheV90ZXh0IG1lZGlhJz5cIiArIHN0dWZmICsgXCI8L2Rpdj48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzbGlkZXJfaXRlbXMucHVzaCh7J3NyYyc6dGhpcy5kYXRhLm1lZGlhLnNyYywgdzo5NjQsIGg6MTAyNH0pOyBcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gdmFyIHNyYyA9IEZCX3RodW1ibmFpbF90b19mdWxsX3NpemUoIHRoaXMuZGF0YS5tZWRpYS5zcmMgKTtcclxuXHJcbiAgICAgICAgICAgIC8vICR0aGlzLmZpbmQoJy5pdGVtLW1lZGlhJykuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiaW1nXCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJyArc3JjKyAnKTtcIj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgICAgIC8vJHRoaXMuYWRkQ2xhc3MoJ2hhc19tZWRpYScpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhdGEucmF3X2RhdGEgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEucmF3X2RhdGEuZW50aXRpZXMgIT09IHVuZGVmaW5lZCAvKiYmIHRoaXMuZGF0YS5yYXdfZGF0YS5lbnRpdGllcy5tZWRpYSAhPSB1bmRlZmluZWQqLyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZGF0YS5yYXdfZGF0YS5yZXR3ZWV0ZWRfc3RhdHVzID09PSB1bmRlZmluZWQgJiYgdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldCAhPT0gdW5kZWZpbmVkIFxyXG4gICAgICAgICAgICAgICAgJiYgdGhpcy5kYXRhLnJhd19kYXRhLnF1b3RlZF90d2VldC5zdHJlYW1FbnRyeSAhPT0gdW5kZWZpbmVkICYmICEkLmlzRW1wdHlPYmplY3QoIHRoaXMuZGF0YS5yYXdfZGF0YS5xdW90ZWRfdHdlZXQuc3RyZWFtRW50cnkgKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciBxdW90ZWRfdHdlZXQgPSB0aGlzLmRhdGEucmF3X2RhdGEucXVvdGVkX3R3ZWV0LnN0cmVhbUVudHJ5XHJcbiAgICAgICAgICAgICAgICAgICAgLCRxdW90ZWRfdHdlZXRfY29udGFpbmVyID0gJCgnPGRpdj4nLCB7IGNsYXNzOiAncXVvdGVkLXR3ZWV0LWNvbnRhaW5lcicgfSlcclxuICAgICAgICAgICAgICAgICAgICAsJHF1b3RlZF90d2VldF9hdXRvciA9ICQoJzxkaXY+JywgeyBjbGFzczogJ3F1b3RlZC10d2VldC1hdXRvcicgfSlcclxuICAgICAgICAgICAgICAgICAgICAsJHF1b3RlZF90d2VldF90ZXh0ID0gJCgnPGRpdj4nLCB7IGNsYXNzOiAncXVvdGVkLXR3ZWV0LXRleHQnIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLCRxdW90ZWRfdHdlZXRfbWVkaWEgPSAkKCc8ZGl2PicsIHsgY2xhc3M6ICdxdW90ZWQtdHdlZXQtbWVkaWEnIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLGZpcnN0X3VybCA9ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLnJhd19kYXRhLmVudGl0aWVzLnVybHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybHMgPSBzZWxmLmRhdGEucmF3X2RhdGEuZW50aXRpZXMudXJscztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBBcnJheS5pc0FycmF5KHVybHMpICkgZmlyc3RfdXJsID0gdXJsc1sgMCBdLnVybDtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGZpcnN0X3VybCA9IHVybHMudXJsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHZhciBuYW1lX2h0bWwgPSAkKCc8YiBjbGFzcz1cInF1b3RlZC10d2VldC1hdXRvci1uYW1lXCI+JyArIHF1b3RlZF90d2VldC51c2VyLm5hbWUgKyBcclxuICAgICAgICAgICAgICAgICAgICAnPC9iPjxzcGFuIGNsYXNzPVwicXVvdGVkLXR3ZWV0LWF1dG9yLXNjcmVlbm5hbWVcIj5AJyArIHF1b3RlZF90d2VldC51c2VyLnNjcmVlbl9uYW1lICsgJzwvc3Bhbj4nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkcXVvdGVkX3R3ZWV0X2F1dG9yLmh0bWwoIG5hbWVfaHRtbCApLmF0dHIoJ2RhdGEtdG9vbHRpcCcsIHF1b3RlZF90d2VldC51c2VyLm5hbWUgKVxyXG4gICAgICAgICAgICAgICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaG93X3VzZXJfaW5mbyggcXVvdGVkX3R3ZWV0LnVzZXIuaWRfc3RyICk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZV9odG0gPSBxdW90ZWRfdHdlZXQudGV4dC5yZXBsYWNlKC/igJwvZywgJycpLnJlcGxhY2UoL+KAnS9nLCAnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZV9odG0gPSB1cmxfdG9fbGluayggbWVzc2FnZV9odG0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bSA9IGhhc2h0YWdfdG9fbGluayggbWVzc2FnZV9odG0sICd0d2l0dGVyJyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciByZWdleCAgID0gLyhefFteQFxcd10pQChcXHd7MSwxNX0pXFxiL2dcclxuICAgICAgICAgICAgICAgICAgICAscmVwbGFjZSA9ICckMTxhIGNsYXNzPVwidHctdXNlclwiIGhyZWY9XCJqYXZhc2NyaXB0OjtcIiBvbmNsaWNrPVwiRUMuVUkuSUFCKFxcJ2h0dHBzOi8vdHdpdHRlci5jb20vJDJcXCcpO1wiIGRhdGEtdXNlcj1cIkAkMlwiPkAkMjwvYT4nOyBcclxuXHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlX2h0bSA9IG1lc3NhZ2VfaHRtLnJlcGxhY2UoIHJlZ2V4LCByZXBsYWNlICk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHF1b3RlZF90d2VldF90ZXh0Lmh0bWwoIG1lc3NhZ2VfaHRtLnJlcGxhY2UoL15cXHNcXHMqLywgJycpLnJlcGxhY2UoL1xcc1xccyokLywgJycpICk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHF1b3RlZF90d2VldF90ZXh0Lm9uKCdjbGljaycsJ2EudHctdXNlcicsZnVuY3Rpb24oIGUgKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLnNob3dfdXNlcl9pbmZvKCAkKCB0aGlzICkuYXR0cignZGF0YS11c2VyJykgKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICRxdW90ZWRfdHdlZXRfdGV4dC5vbignY2xpY2snLCdhLnR3LWhhc2h0YWcnLGZ1bmN0aW9uKCBlICl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRoYXQgPSAkKCB0aGlzICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0d19zZWFyY2ggPSBuZXcgVFdTZWFyY2hDb250YWluZXIoIFtdLCB7IHByb2ZpbGU6IHNlbGYucHJvZmlsZSwgbmV4dDonJywgcmVzdWx0X3R5cGU6ICdyZWNlbnQnIH0gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBwID0gbmV3IGVjUG9wdXAoIHR3X3NlYXJjaC52aWV3KCkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcHAuZWxlbWVudC5hZGRDbGFzcygndHdpdHRlci1zZWFyY2gnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcHAuZWxlbWVudC5maW5kKCcuaGVhZGVyJykuaHRtbCggJ1NFQVJDSCcgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZCggcHAucmVuZGVyKCkuaGlkZSgpLmZhZGVJbiggNTAwICkgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcudHdpdHRlci1zZWFyY2gnKS5maW5kKCcjc2VhcmNoLXRleHQnKS52YWwoIGRlY29kZVVSSUNvbXBvbmVudCh0aGF0LmF0dHIoJ2RhdGEtcXVlcnknKSkgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLnR3aXR0ZXItc2VhcmNoJykuZmluZCgnLmdvLWJ1dHRvbicpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHF1b3RlZF90d2VldC5lbnRpdGllcyAhPT0gdW5kZWZpbmVkICYmIHF1b3RlZF90d2VldC5lbnRpdGllcy5tZWRpYSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAkcXVvdGVkX3R3ZWV0X21lZGlhLmh0bWwoICc8aW1nIGNsYXNzPVwidHdpdHRlci1pbWFnZSBmdWxsLWltYWdlXCIgc3JjPVwiJyArIHF1b3RlZF90d2VldC5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKyAnXCI+JylcclxuICAgICAgICAgICAgICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZmlyc3RfdXJsLmxlbmd0aCA+IDAgKSBFQy5VSS5JQUIoIGZpcnN0X3VybCApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pOyBcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAkcXVvdGVkX3R3ZWV0X2NvbnRhaW5lci5hcHBlbmQoJHF1b3RlZF90d2VldF9hdXRvciwgJHF1b3RlZF90d2VldF90ZXh0LCAkcXVvdGVkX3R3ZWV0X21lZGlhKVxyXG4gICAgICAgICAgICAgICAgLmhvdmVyKGZ1bmN0aW9uICgpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCggdGhpcyApLmNzcygnYm9yZGVyJywgJzFweCBzb2xpZCAjOTk5Jyk7XHJcbiAgICAgICAgICAgICAgICB9LCBcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCggdGhpcyApLmNzcygnYm9yZGVyJywgJzFweCBzb2xpZCAjY2NjJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBleHRfZWxlbWVudCA9ICRxdW90ZWRfdHdlZXRfY29udGFpbmVyO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXRhLnJhd19kYXRhLmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvKnZhciBwb3N0X21lZGlhX2VsZW1lbnQgPSBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X3Bvc3RfbWVkaWFfZWxlbWVudC5jYWxsKCB1bmRlZmluZWQsIHRoaXMuZGF0YS5yYXdfZGF0YSwgJHRoaXMuZmluZCgnLml0ZW0tbWVkaWEnKSApO1xyXG4gICAgICAgICAgICAgICAgZXh0X2VsZW1lbnQgPSBwb3N0X21lZGlhX2VsZW1lbnRbMF07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoIG9iamVjdF9sZW5ndGgoIHBvc3RfbWVkaWFfZWxlbWVudFsxXSApID4gMCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2xpZGVyX2l0ZW1zID0gcG9zdF9tZWRpYV9lbGVtZW50WzFdO1xyXG4gICAgICAgICAgICAgICAgfSovXHJcblxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5kYXRhLm1lZGlhX2NvbnRlbnQgPSBleHRfZWxlbWVudDtcclxuXHJcbiAgICAgICAgaXRlbU1lZGlhID0gJyc7XHJcbiAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAnZ29vZ2xlcGx1cycgfHwgdGhpcy5kYXRhLmV2ZW50TmV0d29yayA9PSAnZ29vZ2xlcGx1cycpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuZmVlZC5pZCAhPSAnY2luYm94JyApIGl0ZW1NZWRpYSA9IGV4dF9lbGVtZW50OyAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpdGVtTWVkaWEgPSBleHRfZWxlbWVudFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICQudHlwZShpdGVtTWVkaWEpID09ICdvYmplY3QnID8gaXRlbU1lZGlhLmh0bWwoKTogaXRlbU1lZGlhO1xyXG4gICAgfTtcclxuXHJcbiAgICBUaW1lbGluZUZlZWRJdGVtLnByb3RvdHlwZS5nZXRMaWtlc0NvbW1lbnRzID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgbGlrZXMgPSB7fSxcclxuICAgICAgICAgICAgZGlzbGlrZXMgPSB7fSxcclxuICAgICAgICAgICAgY29tbWVudHMgPSB7fSxcclxuICAgICAgICAgICAgc2hhcmVzID0ge307XHJcblxyXG4gICAgICAgIHNlbGYubGlrZXNfY29tbWVudHNfZmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5mZWVkLm5ldHdvcmsgPT0gJ2ZhY2Vib29rJyApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBsaWtlc1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5saWtlcyA9PT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlrZXMuY291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgbGlrZXMudGV4dCA9ICcwIGxpa2VzJztcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggIUFycmF5LmlzQXJyYXkoIHNlbGYuZGF0YS5saWtlcy5saWtlICkpIHNlbGYuZGF0YS5saWtlcy5saWtlID0gWyBzZWxmLmRhdGEubGlrZXMubGlrZSBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGxpa2VzLmNvdW50ID0gc2VsZi5kYXRhLmxpa2VzLmNvdW50O1xyXG4gICAgICAgICAgICAgICAgbGlrZXMudGV4dCA9IEVDLnBvc3RfbGlrZXNfdGV4dCggcGFyc2VJbnQoIHNlbGYuZGF0YS5saWtlcy5jb3VudCApLCBzZWxmLmRhdGEudXNlcl9saWtlcyA9PSAgJ3RydWUnKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGNvbW1lbnRzXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLmNvbW1lbnRzID09PSB1bmRlZmluZWQgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMuY291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMudGV4dCA9ICcwIGNvbW1lbnRzJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmICggcGFyc2VJbnQoIHNlbGYuZGF0YS5jb21tZW50cy5jb3VudCApID09IDEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICFBcnJheS5pc0FycmF5KCBzZWxmLmRhdGEuY29tbWVudHMuY29tbWVudCApICkgc2VsZi5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgPSBbIHNlbGYuZGF0YS5jb21tZW50cy5jb21tZW50IF07XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IDE7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ID0gJzEgY29tbWVudCc7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBlbHNlIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IHNlbGYuZGF0YS5jb21tZW50cy5jb3VudDtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgPSBzZWxmLmRhdGEuY29tbWVudHMuY291bnQgKyAnIGNvbW1lbnRzJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEuc2hhcmVkQ291bmQgIT09IHVuZGVmaW5lZCApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzaGFyZXMuY291bnQgICAgPSBzZWxmLmRhdGEuc2hhcmVkQ291bmQ7XHJcbiAgICAgICAgICAgICAgICBzaGFyZXMudGV4dCAgICAgPSBzZWxmLmRhdGEuc2hhcmVkQ291bmQrJyBTaGFyZScrKHNlbGYuZGF0YS5zaGFyZWRDb3VuZD09JzEnPycnOidzJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggKCBzZWxmLmRhdGEuaXNBY3Rpdml0eSAhPT0gdW5kZWZpbmVkICYmIHNlbGYuZGF0YS5pc0FjdGl2aXR5ID09ICd0cnVlJyApXHJcbiAgICAgICAgICAgICAgICB8fCAoICggc2VsZi5mZWVkLmlkID09ICdzZWFyY2gnIHx8IHNlbGYuZmVlZC5pZCA9PSAnb3V0cmVhY2gnICkgJiYgdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICd1c2VyJyApIHx8IHRoaXMuZmVlZC5pZCA9PSAnZmJfbm90aWZpY2F0aW9ucycgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmxpa2VzX2NvbW1lbnRzX2ZsYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9kaXNwbGF5IG5vbi1jbGlja2FibGUgbGlrZXMgZm9yIEZCIHBhZ2VzXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCAoIHRoaXMuZmVlZC5pZCA9PSAnc2VhcmNoJyB8fCB0aGlzLmZlZWQuaWQgPT0gJ291dHJlYWNoJyApXHJcbiAgICAgICAgICAgICAgICAmJiAoIHRoaXMuZmVlZC5vcHRpb25zLnBhcmFtZXRlcnMudHlwZSA9PSAncGFnZScgfHwgdGhpcy5mZWVkLm9wdGlvbnMucGFyYW1ldGVycy50eXBlID09ICdwbGFjZScpIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9yZXNldCBsaWtlcyAmIGNvbW1lbnRzXHJcbiAgICAgICAgICAgICAgICBsaWtlcyA9IHt9O1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMgPSB7fTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiB0aGlzLmRhdGEubGlrZXMgIT09ICdzdHJpbmcnICkgdGhpcy5kYXRhLmxpa2VzID0gJzAnO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLmxpa2VzID09PSAnMCcgKSB7fVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGVtcF9saWtlcyA9IEpTT04ucGFyc2UodGhpcy5kYXRhLmxpa2VzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGVtcF9saWtlcy5kYXRhICYmIHRlbXBfbGlrZXMuZGF0YS5sZW5ndGggKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGF0YS5saWtlcyA9ICggdGVtcF9saWtlcy5kYXRhLmxlbmd0aCA9PT0gMjUgPyAnMjUrJyA6IHRlbXBfbGlrZXMuZGF0YS5sZW5ndGggKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5kYXRhLmxpa2VzID0gJzAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoKCBlIClcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhLmxpa2VzID0gJzAnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzaGFyZXMuY291bnQgICAgPSBzZWxmLmRhdGEubGlrZXM7XHJcbiAgICAgICAgICAgICAgICBzaGFyZXMudGV4dCAgICAgPSBzZWxmLmRhdGEubGlrZXMrJyBTaGFyZScrKHNlbGYuZGF0YS5saWtlcz09JzEnPycnOidzJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHNlbGYuZmVlZC5uZXR3b3JrID09ICd0d2l0dGVyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIHJldHdlZXRzXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5kYXRhLnJldHdlZXRzLmNvdW50ICE9IHVuZGVmaW5lZCApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy5jb3VudCA9IHNlbGYuZGF0YS5yZXR3ZWV0cy5jb3VudDtcclxuICAgICAgICAgICAgICAgIGxpa2VzLnRleHQgPSBFQy5udW1iZXJXaXRoQ29tbWFzKCB0aGlzLmRhdGEucmV0d2VldHMuY291bnQgKSsgJyByZXR3ZWV0JyArICggdGhpcy5kYXRhLnJldHdlZXRzLmNvdW50ID09ICcxJyA/ICcnIDogJ3MnICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ICA9IHNlbGYuZGF0YS5mYXZvcml0ZXMuY291bnQ7XHJcbiAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgICA9IEVDLm51bWJlcldpdGhDb21tYXMoIHNlbGYuZGF0YS5mYXZvcml0ZXMuY291bnQgKSArICcgbGlrZScgKyAoIHNlbGYuZGF0YS5mYXZvcml0ZXMuY291bnQgPT0gJzEnID8gJycgOiAncycgKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2xpbmtlZGluJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIGxpa2VzXHJcbiAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLmxpa2VzID09IHVuZGVmaW5lZCApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy5jb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy50ZXh0ICA9ICdPIGxpa2VzJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHBhcnNlSW50KCBzZWxmLmRhdGEubGlrZXMuY291bnQgKSA9PSAxICkgc2VsZi5kYXRhLmxpa2VzLmxpa2UgPSBbIHNlbGYuZGF0YS5saWtlcy5saWtlIF07XHJcblxyXG4gICAgICAgICAgICAgICAgbGlrZXMuY291bnQgPSBzZWxmLmRhdGEubGlrZXMuY291bnQ7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy50ZXh0ID0gRUMucG9zdF9saWtlc190ZXh0KCBwYXJzZUludCggc2VsZi5kYXRhLmxpa2VzLmNvdW50ICksIHNlbGYuZGF0YS51c2VyX2xpa2VzID09ICAndHJ1ZScpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gY29tbWVudHNcclxuICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEuY29tbWVudHMgPT0gdW5kZWZpbmVkICkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ICA9IDA7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ICAgPSAnMCBjb21tZW50cyc7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggcGFyc2VJbnQoIHNlbGYuZGF0YS5jb21tZW50cy5jb3VudCApID09IDEgKSBzZWxmLmRhdGEuY29tbWVudHMuY29tbWVudCA9IFsgc2VsZi5kYXRhLmNvbW1lbnRzLmNvbW1lbnQgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCAgPSBzZWxmLmRhdGEuY29tbWVudHMuY291bnQ7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ICAgPSBFQy5udW1iZXJXaXRoQ29tbWFzKCBzZWxmLmRhdGEuY29tbWVudHMuY291bnQgKSArICcgY29tbWVudCcgKyAoIHNlbGYuZGF0YS5jb21tZW50cy5jb3VudCA9PSAnMScgPyAnJyA6ICdzJyApO1xyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3lvdXR1YmUnIHx8IHRoaXMuZmVlZC5uZXR3b3JrID09ICdibG9nZ2VyJylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vbGlrZXMvZGlzbGlrZXNcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmZlZWQubmV0d29yayA9PSAneW91dHViZScgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlrZXMuY291bnQgPSBzZWxmLmRhdGEubGlrZXMuY291bnQ7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy50ZXh0ICA9IEVDLnBvc3RfbGlrZXNfdGV4dCggc2VsZi5kYXRhLmxpa2VzLmNvdW50LCBzZWxmLmRhdGEubWVkaWEucmF0aW5nID09ICdsaWtlJyApO1xyXG5cclxuICAgICAgICAgICAgICAgIGRpc2xpa2VzLmNvdW50ID0gc2VsZi5kYXRhLmxpa2VzLmRpc2xpa2VzO1xyXG4gICAgICAgICAgICAgICAgZGlzbGlrZXMudGV4dCA9IEVDLnBvc3RfbGlrZXNfdGV4dCggc2VsZi5kYXRhLmxpa2VzLmRpc2xpa2VzLCBzZWxmLmRhdGEubWVkaWEucmF0aW5nID09ICdkaXNsaWtlJywgdHJ1ZSApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL2NvbW1lbnRzXHJcbiAgICAgICAgICAgIHZhciBjb21tZW50c190ZXh0O1xyXG5cclxuICAgICAgICAgICAgaWYgKCAkLmlzRW1wdHlPYmplY3Qoc2VsZi5kYXRhLmNvbW1lbnRzKSApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IDA7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ID0gJzAgY29tbWVudHMnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ID0gc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50O1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMudGV4dCA9IEVDLm51bWJlcldpdGhDb21tYXMoIHNlbGYuZGF0YS5jb21tZW50cy5jb3VudCApICsgJyBjb21tZW50JyArICggc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ID09IDEgKSA/Jyc6J3MnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoICQuaXNFbXB0eU9iamVjdChzZWxmLmRhdGEubGlrZXMpICYmICQuaXNFbXB0eU9iamVjdChzZWxmLmRhdGEuY29tbWVudHMpIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZi5saWtlc19jb21tZW50c19mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnIHx8IHRoaXMuZGF0YS5ldmVudE5ldHdvcmsgPT0gJ2dvb2dsZXBsdXMnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLy9wbHVzb25lc1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5saWtlcyA9PSB1bmRlZmluZWQgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbGlrZXMuY291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgbGlrZXMudGV4dCA9ICcwIGxpa2VzJztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgeW91ID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgY291bnQgPSBwYXJzZUludCggc2VsZi5kYXRhLmxpa2VzLmNvdW50ICk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEubGlrZXMuaXNfcGx1c29uZWQgPT0gJ3RydWUnICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY291bnQtLTtcclxuICAgICAgICAgICAgICAgICAgICB5b3UgPSBcIllvdSArIFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB5b3UgPSAnKyAnO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vanVzdCBpbiBjYXNlXHJcbiAgICAgICAgICAgICAgICBpZiAoIGNvdW50IDwgMCApIGNvdW50ID0gMDsgXHJcblxyXG4gICAgICAgICAgICAgICAgbGlrZXMuY291bnQgPSBzZWxmLmRhdGEubGlrZXMuY291bnQ7XHJcbiAgICAgICAgICAgICAgICBsaWtlcy50ZXh0ID0gRUMubnVtYmVyV2l0aENvbW1hcyggY291bnQgKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9jb21tZW50c1xyXG4gICAgICAgICAgICB2YXIgY29tbWVudHNfdGV4dDtcclxuXHJcbiAgICAgICAgICAgIGlmICggJC5pc0VtcHR5T2JqZWN0KHNlbGYuZGF0YS5jb21tZW50cykgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMuY291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgY29tbWVudHMudGV4dCA9ICcwIGNvbW1lbnRzJzsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZW5kaW5nID0gJ3MnO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ID09IDEgKSBlbmRpbmcgPSAnJztcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29tbWVudHNfdGV4dCA9IEVDLm51bWJlcldpdGhDb21tYXMoIHNlbGYuZGF0YS5jb21tZW50cy5jb3VudCApICsgJyBjb21tZW50JyArIGVuZGluZztcclxuXHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IHNlbGYuZGF0YS5jb21tZW50cy5jb3VudDtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLnRleHQgPSBjb21tZW50c190ZXh0O1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy9yZXNoYXJlcnNcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEucmVzaGFyZXJzICE9IHVuZGVmaW5lZCAmJiB0aGlzLmRhdGEucmVzaGFyZXJzLmNvdW50ICE9ICcwJyApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzaGFyZXMuY291bnQgPSB0aGlzLmRhdGEucmVzaGFyZXJzLmNvdW50O1xyXG4gICAgICAgICAgICAgICAgc2hhcmVzLnRleHQgPSB0aGlzLmRhdGEucmVzaGFyZXJzLmNvdW50KycgU2hhcmUnKyh0aGlzLmRhdGEucmVzaGFyZXJzLmNvdW50PT0nMSc/Jyc6J3MnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCAkLmlzRW1wdHlPYmplY3Qoc2VsZi5kYXRhLmxpa2VzKSAmJiAkLmlzRW1wdHlPYmplY3Qoc2VsZi5kYXRhLmNvbW1lbnRzKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubGlrZXNfY29tbWVudHNfZmxhZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5mZWVkLm5ldHdvcmsgPT0gJ3BpbnRlcmVzdCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5yZXBpbnMgIT0gJycpIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IHNlbGYuZGF0YS5yZXBpbnM7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ID0gRUMubnVtYmVyV2l0aENvbW1hcyggc2VsZi5kYXRhLnJlcGlucyApICsgJyBSZXBpbicgKyAoc2VsZi5kYXRhLnJlcGlucz09JzEnPycnOidzJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbW1lbnRzLmNvdW50ICA9IDA7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy50ZXh0ICAgPSAnMCBSZXBpbnMnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHNlbGYuZGF0YS5saWtlcyAmJiBzZWxmLmRhdGEubGlrZXMuY291bnQgIT0gMCkgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxpa2VzLmNvdW50ID0gc2VsZi5kYXRhLmxpa2VzLmNvdW50OyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBsaWtlcy5jb3VudCA9IDA7XHJcblxyXG4gICAgICAgICAgICBsaWtlcy50ZXh0ID0gRUMubnVtYmVyV2l0aENvbW1hcyggbGlrZXMuY291bnQgKSArICcgTGlrZScgKyAobGlrZXMuY291bnQ9PTE/Jyc6J3MnKVxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZWxmLmRhdGEuY29tbWVudHMgJiYgc2VsZi5kYXRhLmNvbW1lbnRzLmNvdW50ICE9IDApIFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50cy5jb3VudCA9IHNlbGYuZGF0YS5jb21tZW50cy5jb3VudDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBjb21tZW50cy5jb3VudCA9IDA7XHJcblxyXG4gICAgICAgICAgICBjb21tZW50cy50ZXh0ID0gRUMubnVtYmVyV2l0aENvbW1hcyggY29tbWVudHMuY291bnQgKSArICcgQ29tbWVudCcgKyAoY29tbWVudHMuY291bnQgPT0gMT8nJzoncycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCB0aGlzLmZlZWQuaWQgPT0gJ2NpbmJveCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQkNvbW1lbnRzJyB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQlNoYXJlcycgXHJcbiAgICAgICAgICAgICAgICB8fCB0aGlzLmRhdGEuZXZlbnRUeXBlID09ICdGQk90aGVycycgfHwgdGhpcy5kYXRhLmV2ZW50VHlwZSA9PSAnRkJMaWtlcycgfHwgdGhpcy5kYXRhLmV2ZW50VHlwZSA9PSAnRkJXYWxsUG9zdHMnICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5saWtlc19jb21tZW50c19mbGFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4geydsaWtlcyc6bGlrZXMsJ2Rpc2xpa2VzJzpkaXNsaWtlcywnY29tbWVudHMnOmNvbW1lbnRzLCdzaGFyZXMnOnNoYXJlcywnbGNfZmxhZyc6c2VsZi5saWtlc19jb21tZW50c19mbGFnfTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLmdldFVJRGF0YSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnZ2V0VUlEYXRhJyk7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBVSURhdGEgPSB7fTtcclxuXHJcbiAgICAgICAgLy9uYW1lLCBwcm9maWxlSW1nIGFuZCBkYXRlXHJcbiAgICAgICAgVUlEYXRhLnByb2ZpbGVOYW1lICA9IHNlbGYuZGF0YS5mcm9tTmFtZTtcclxuICAgICAgICBVSURhdGEucHJvZmlsZUltZyAgID0gc2VsZi5kYXRhLnByb2ZpbGVQaWMgfHwgc2VsZi5kYXRhLmljb247XHJcbiAgICAgICAgVUlEYXRhLnRpbWUgICAgICAgICA9IHNlbGYuZ2V0SXRlbVRpbWUoKTtcclxuXHJcbiAgICAgICAgLy9pdGVtIHRleHQgXHJcbiAgICAgICAgVUlEYXRhLml0ZW1UZXh0ICAgICA9IHNlbGYuZ2V0SXRlbVRleHQoKTtcclxuICAgICAgICBVSURhdGEuaXRlbU1lZGlhICAgID0gc2VsZi5nZXRJdGVtTWVkaWEoKTtcclxuXHJcbiAgICAgICAgLy9saWtlcyBhbmQgY29tbWVudHNcclxuICAgICAgICB2YXIgbGMgICAgICAgICAgPSBzZWxmLmdldExpa2VzQ29tbWVudHMoKTtcclxuICAgICAgICBVSURhdGEubGlrZXMgICAgPSBsYy5saWtlcztcclxuICAgICAgICBVSURhdGEuZGlzbGlrZXMgPSBsYy5kaXNsaWtlcztcclxuICAgICAgICBVSURhdGEuY29tbWVudHMgPSBsYy5jb21tZW50cztcclxuICAgICAgICBVSURhdGEuc2hhcmVzICAgPSBsYy5zaGFyZXM7XHJcbiAgICAgICAgVUlEYXRhLmxjX2Rpc3AgID0gbGMubGNfZmxhZztcclxuXHJcblxyXG4gICAgICAgIHJldHVybiBVSURhdGE7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gVGltZWxpbmVGZWVkSXRlbTtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHJvb3RTY29wZSwgJGxvY2FsU3RvcmFnZSwgRUMsIGFwaVVybCwgJGluamVjdG9yICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgdmFyIENvbGxhcHNpYmxlRmVlZEl0ZW0gPSAgQ29sbGFwc2libGVGZWVkSXRlbSB8fCAkaW5qZWN0b3IuZ2V0KCdDb2xsYXBzaWJsZUZlZWRJdGVtJyk7XHJcbiAgICB2YXIgVGltZWxpbmVGZWVkSXRlbSA9ICBUaW1lbGluZUZlZWRJdGVtIHx8ICRpbmplY3Rvci5nZXQoJ1RpbWVsaW5lRmVlZEl0ZW0nKTtcclxuXHJcbiAgICBmdW5jdGlvbiBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSAoIGl0ZW1fZGF0YSwgZmVlZCApXHJcbiAgICB7XHJcbiAgICAgICAgQ29sbGFwc2libGVGZWVkSXRlbS5hcHBseSggdGhpcywgWyBpdGVtX2RhdGEsIGZlZWQgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUgKTtcclxuICAgIFxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW07XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmFkZF9jb21tZW50ID0gVGltZWxpbmVGZWVkSXRlbS5wcm90b3R5cGUuYWRkX2NvbW1lbnQ7XHJcblxyXG4gICAgVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0ucHJvdG90eXBlLmRlbGV0ZV9tZXNzYWdlID0gZnVuY3Rpb24gKCAkdHdlZXQsIGlkIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG5cclxuICAgICAgICB2YXIgdGV4dCA9ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoaXMgcG9zdCA/JztcclxuICAgICAgICBcclxuIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbS5wcm90b3R5cGUucmV0d2VldCA9IFRpbWVsaW5lRmVlZEl0ZW0ucHJvdG90eXBlLnJldHdlZXQ7XHJcblxyXG4gICAgXHJcblxyXG4gICAgcmV0dXJuIFR3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtO1xyXG5cclxufV07XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiIsIi8qXHJcbiAgICBhY2NvdW50TWFuYWdlciBtb2R1bGVcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gWyckaHR0cCcsICckc3RhdGUnLCAnJHJvb3RTY29wZScsICckbG9jYWxTdG9yYWdlJywgJ0VDJywgJ2FwaVVybCcsICdGZWVkJywgJ1RpbWVsaW5lRmVlZEl0ZW0nLCAnVHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSApeyAgXHJcblxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGZ1bmN0aW9uIFR3aXR0ZXJGZWVkICggc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIClcclxuICAgIHtcclxuICAgICAgICBpZiAoIC8qd2luZG93Lmdsb2JhbHMudHdfZmVlZHNfbGl2ZV91cGRhdGUgJiYqLyBbJ2hvbWVGZWVkJywnbGlzdHMnLCdtZW50aW9ucycsJ3R3Rm9sbG93ZXJzJywnZGlyZWN0X21lc3NhZ2UnXS5pbmRleE9mKCBzdHJlYW0uc3RyZWFtSWQgKSAhPT0gLTEgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVGZWVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBGZWVkLmFwcGx5KCB0aGlzLCBbIHN0cmVhbSwgcHJvZmlsZSwgb3B0aW9ucyBdKTtcclxuICAgIH1cclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKCBGZWVkLnByb3RvdHlwZSApO1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFR3aXR0ZXJGZWVkO1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5jbGVhckZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoIHJlbW92ZV9tZXNzYWdlIClcclxuICAgIHtcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLnVwZGF0ZUZlZWROb3RpZmljYXRpb24gPSBmdW5jdGlvbiAoKVxyXG4gICAge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X2RhdGEgPSBmdW5jdGlvbiAoIGNhbGxiYWNrIClcclxuICAgIHtcclxuICAgICAgICAvLyByZXF1ZXN0cyBkYXRhIGFuZCB0aGVuIGNhbGxzIHRoaXMuc2F2ZV9pdGVtc1xyXG4gICAgICAgIGlmICggIXRoaXMuaW5pdGlhbGl6ZWQgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoIHRoaXMuaWQgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdob21lRmVlZCc6IHRoaXMucmVxdWVzdCgnZ2V0VFdIb21lRmVlZCcpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdtZW50aW9ucyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdNZW50aW9ucycpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d0ZvbGxvd2Vycyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdGb2xsb3dlcnMnKTsgLy8gPC0tIHRvdGFsbHkgdW5pcXVlXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd0d0ZyaWVuZHMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXRnJpZW5kc0xpc3QnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3NlbmRUd2VldHMnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VuZFR3ZWV0cycpOyAvLyA8LS0gc2ltaWxhci1pc2ggdG8gVGltZWxpbmVGZWVkSXRlbVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnbXlUd2VldHNSZXR3ZWV0ZWQnOiB0aGlzLnJlcXVlc3QoJ2dldFRXUmV0d2VldHMnKTsgLy8gPC0tIHNpbWlsYXItaXNoIHRvIFRpbWVsaW5lRmVlZEl0ZW1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ3R3RmF2b3JpdGVzJzogdGhpcy5yZXF1ZXN0KCdnZXRUV0Zhdm9yaXRlcycpOyAvLyA8LS0gc2ltaWxhciB0byBUaW1lbGluZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdkaXJlY3RfbWVzc2FnZSc6IHRoaXMucmVxdWVzdCgnZ2V0VFdJbkJveCcpOyAvLyA8LS0gc2ltaWxhciB0byBDb2xsYXBzaWJsZUZlZWRJdGVtXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdsaXN0cyc6IHRoaXMucmVxdWVzdCgnZ2V0VFdMaXN0cycpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnc2VhcmNoJzogdGhpcy5yZXF1ZXN0KCdnZXRUV1NlYXJjaCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnb3V0cmVhY2gnOiB0aGlzLnJlcXVlc3QoJ2dldFRXU2VhcmNoJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdsaXN0cycgfHwgdGhpcy5pZCA9PSAnc2VhcmNoJyB8fCB0aGlzLmlkID09ICdvdXRyZWFjaCcgfHwgdGhpcy5pZCA9PSAnZGlyZWN0X21lc3NhZ2UnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vdGhpcy5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7IFxyXG4gICAgICAgICAgICAvL3RoaXMuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICAgICAgZGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJycsXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBtYXhfaWQ6IHRoaXMubmV4dFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoICggdGhpcy5pZCA9PT0gJ3R3Rm9sbG93ZXJzJyB8fCB0aGlzLmlkID09PSAndHdGcmllbmRzJyApICYmIHNlbGYub3B0aW9ucy51c2VyX2lkX2Zvcl9yZXF1ZXN0IClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGRhdGEudXNlcklEID0gc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3Q7ICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3dpdGNoICggdGhpcy5pZCApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYXNlICdob21lRmVlZCc6IGRhdGEuYWN0aW9uID0gJ2dldFRXSG9tZUZlZWQnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ21lbnRpb25zJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdNZW50aW9ucyc7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndHdGb2xsb3dlcnMnOiBkYXRhLmFjdGlvbiA9ICdnZXRUV0ZvbGxvd2Vycyc7IFxyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3RnJpZW5kcyc6IGRhdGEuYWN0aW9uID0gJ2dldFRXRnJpZW5kc0xpc3QnOyBcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzZW5kVHdlZXRzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdTZW5kVHdlZXRzJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdteVR3ZWV0c1JldHdlZXRlZCc6IGRhdGEuYWN0aW9uID0gJ2dldFRXUmV0d2VldHMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3R3RmF2b3JpdGVzJzogZGF0YS5hY3Rpb24gPSAnZ2V0VFdGYXZvcml0ZXMnO1xyXG4gICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIC8vIGNhc2UgJ2RpcmVjdF9tZXNzYWdlJzogXHJcbiAgICAgICAgICAgIC8vICAgICBkYXRhLmFjdGlvbiA9ICdnZXRUV0luQm94JztcclxuICAgICAgICAgICAgLy8gICAgIGRhdGEuaW5ib3hfbWF4X2lkID0gdGhpcy5uZXh0LmluYm94O1xyXG4gICAgICAgICAgICAvLyAgICAgZGF0YS5vdXRib3hfbWF4X2lkID0gdGhpcy5uZXh0Lm91dGJveDtcclxuICAgICAgICAgICAgLy8gYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC90d2l0dGVyJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxvYWRfbW9yZV9mbGFnID0gdHJ1ZTtcclxuICAgICAgICBFQy5yZXF1ZXN0KCByZXF1ZXN0ICkudGhlbiggZnVuY3Rpb24gKCByZXNwIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGxvYWRfbW9yZV9mbGFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3AgfHwge307XHJcblxyXG4gICAgICAgICAgICBpZiAoIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkICkgZGF0YS5kYXRhLnNwbGljZSggMCwgMSApOyAvLyBiYWNrZW5kIHJldHVybnMgbGFzdCBpdGVtIGZyb20gcHJldiByZXF1ZXN0IGFzIGZpcnN0IGl0ZW0gaGVyZVxyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuaGlkZV9wdWxsdXAoKTsgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmN1cnNvciAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmN1cnNvclsgMCBdICE9PSAwICkgc2VsZi5uZXh0ID0gZGF0YS5jdXJzb3JbIDAgXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YVsgZGF0YS5kYXRhLmxlbmd0aCAtIDEgXS5pZF9zdHI7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gVFdTZWFyY2hDb250YWluZXI6IHNlbGYgPSB0aGlzOyBwcm9maWxlID0gc2VsZi5kYXRhLnByb2ZpbGVcclxuICAgIC8vIHR5cGUgPSB0d2VldHMgT1IgcGVvcGxlXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5zZWFyY2hfcmVxdWVzdCA9IGZ1bmN0aW9uICggc2VsZiwgY2FsbGJhY2ssIGNsYXNzX25hbWUgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBwYXJhbWV0ZXJzID0gW10sIG5leHQsIHF1ZXJ5LCBwcm9maWxlLCByZXN1bHRfdHlwZSwgdHlwZSwgbGFuZywgZ2VvY29kZTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCBzZWxmLmNvbnN0cnVjdG9yLm5hbWUgPT0gJ1R3aXR0ZXJGZWVkJyApXHJcbiAgICAgICAgaWYgKCBjbGFzc19uYW1lID09ICdUd2l0dGVyRmVlZCcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdHlwZSA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnR5cGU7XHJcbiAgICAgICAgICAgIHF1ZXJ5ID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucXVlcnk7XHJcbiAgICAgICAgICAgIHByb2ZpbGUgPSBzZWxmLnByb2ZpbGU7XHJcbiAgICAgICAgICAgIHJlc3VsdF90eXBlID0gc2VsZi5vcHRpb25zLnBhcmFtZXRlcnMucmVzdWx0X3R5cGU7XHJcbiAgICAgICAgICAgIG5leHQgPSBzZWxmLm5leHQ7XHJcbiAgICAgICAgICAgIGxhbmcgPSBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5sYW5nOyBcclxuICAgICAgICAgICAgZ2VvY29kZSA9IHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLmdlb2NvZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggc2VsZi5kYXRhIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHR5cGUgPSBzZWxmLmRhdGEudHlwZTtcclxuICAgICAgICAgICAgcXVlcnkgPSBzZWxmLmRhdGEucXVlcnk7XHJcbiAgICAgICAgICAgIHByb2ZpbGUgPSBzZWxmLmRhdGEucHJvZmlsZTtcclxuICAgICAgICAgICAgcmVzdWx0X3R5cGUgPSBzZWxmLmRhdGEucmVzdWx0X3R5cGU7XHJcbiAgICAgICAgICAgIHBhZ2UgPSBzZWxmLmRhdGEucGFnZTtcclxuICAgICAgICAgICAgbmV4dCA9IHNlbGYuZGF0YS5uZXh0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAga2V5OiAncScsXHJcbiAgICAgICAgICAgIHZhbHVlOiBxdWVyeVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoIHR5cGUgPT0gJ3R3ZWV0cycgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGtleTogJ3Jlc3VsdF90eXBlJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXN1bHRfdHlwZVxyXG4gICAgICAgICAgICB9KTsgXHJcblxyXG4gICAgICAgICAgICBpZiAoIGxhbmcgIT09IHVuZGVmaW5lZCAmJiBsYW5nLmxlbmd0aCA+IDAgJiYgbGFuZyAhPSAnYWxsJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBrZXk6ICdsYW5nJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbGFuZ1xyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIGdlb2NvZGUgIT09IHVuZGVmaW5lZCAmJiBnZW9jb2RlLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGtleTogJ2dlb2NvZGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBnZW9jb2RlXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy9wZW9wbGVcclxuICAgICAgICBlbHNlIGlmICggbmV4dCAhPT0gdW5kZWZpbmVkICYmIG5leHQgIT09IGZhbHNlICkgcGFyYW1ldGVycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBrZXk6ICdwYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbmV4dFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiBcImZlZWQvdHdpdHRlclwiLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHByb2ZpbGUuYWNjb3VudC5pZCxcclxuICAgICAgICAgICAgICAgIHByb2ZpbGVJRDogcHJvZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2dldFRXU2VhcmNoJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiBwYXJhbWV0ZXJzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIHR5cGUgPT0gJ3R3ZWV0cycgJiYgcmVzdWx0X3R5cGUgPT0gJ3JlY2VudCcgJiYgbmV4dCAhPT0gdW5kZWZpbmVkICkgcmVxdWVzdC5kYXRhLm1heF9pZCA9IG5leHQ7XHJcblxyXG4gICAgICAgIEVDLnNlcnZlci5yZXF1ZXN0KCByZXF1ZXN0LCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFja19kYXRhID0gJ0ZBSUwnO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBkYXRhLnJldHVybkNvZGUgPT0gJ1NVQ0NFU1MnICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmVycm9ycyAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZXJyb3JzLmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnJvciA9IGRhdGEuZXJyb3JzWyAwIF0uc3RyZWFtRW50cnk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXJyb3IgIT09IHVuZGVmaW5lZCAmJiBlcnJvci5tZXNzYWdlKSB7fS8vRUMuVUkuYWxlcnQoJ1RXIGVycm9yOiAnICsgZXJyb3IubWVzc2FnZSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIEVDLlVJLmFsZXJ0KEVDLmdldE1lc3NhZ2UoJ1VOS05PV05fRVJSJykpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tfZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBkYXRhLm5leHQgIT09IHVuZGVmaW5lZCApIGNhbGxiYWNrX2RhdGEubmV4dCA9IGRhdGEubmV4dDsgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgRUMuVUkuYWxlcnQoRUMuZ2V0TWVzc2FnZSgnRkFJTF9FUlInKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIGNhbGxiYWNrID09ICdmdW5jdGlvbicpIGNhbGxiYWNrKCBjYWxsYmFja19kYXRhICk7XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uICggYWN0aW9uIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC90d2l0dGVyJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggYWN0aW9uID09ICdnZXRUV1NlYXJjaCcgKSBcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wcm9maWxlID09PSB1bmRlZmluZWQgKSAvL2VtcHR5IHNlYXJjaCBmZWVkXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggW10gKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1ldGVycy5xdWVyeSAhPT0gdW5kZWZpbmVkICYmIHNlbGYub3B0aW9ucy5wYXJhbWV0ZXJzLnF1ZXJ5Lmxlbmd0aCA+IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2VhcmNoX3JlcXVlc3QoIHNlbGYsIGZ1bmN0aW9uKCBkYXRhIClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL2lmICggc2VsZi5kYXRhLnJlc3VsdF90eXBlID09ICdwb3B1bGFyJyApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRwZW9wbGVfc2VjdGlvbi5jc3MoJ2Rpc3BsYXknLCdibG9jaycpOyBcclxuICAgICAgICAgICAgICAgICAgICB9LCAnVHdpdHRlckZlZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBbXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTsgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYgKCBhY3Rpb24gPT0gJ2dldFRXTGlzdHMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBsaXN0cyA9IHRoaXMucHJvZmlsZS5saXN0cztcclxuXHJcbiAgICAgICAgICAgIGlmICggbGlzdHMgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggbGlzdHMuZGVmYXVsdF9lbGVtZW50ICE9PSB1bmRlZmluZWQgKSBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IGxpc3RzLmRlZmF1bHRfZWxlbWVudDsgXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBsaXN0cy5kYXRhID09PSB1bmRlZmluZWQgfHwgbGlzdHMuZGF0YS5sZW5ndGggPT09IDAgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWl0ZW1zJykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPllvdSBhcmVuXFwndCBmb2xsb3dpbmcgYW55IGxpc3RzIHlldC48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlZnJlc2ggaXNjcm9sbFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHkgLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBsaXN0cy5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7ICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKS5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+WW91IGFyZW5cXCd0IGZvbGxvd2luZyBhbnkgbGlzdHMgeWV0LjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5mZWVkLWJvZHknKS5pc2Nyb2xsdmlldyhcInJlZnJlc2hcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keSAuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5Zb3UgYXJlblxcJ3QgZm9sbG93aW5nIGFueSBsaXN0cyB5ZXQuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBhY2NvdW50SUQ6IHRoaXMucHJvZmlsZS5hY2NvdW50LmlkLFxyXG4gICAgICAgICAgICAgICAgcHJvZmlsZUlEOiB0aGlzLnByb2ZpbGUuaWQsXHJcbiAgICAgICAgICAgICAgICBzdHJlYW06IHRoaXMuaWRcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGlmICggKCBhY3Rpb24gPT09ICdnZXRUV0ZvbGxvd2VycycgfHwgYWN0aW9uID09PSAnZ2V0VFdGcmllbmRzTGlzdCcgKSAmJiBzZWxmLm9wdGlvbnMudXNlcl9pZF9mb3JfcmVxdWVzdCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRhdGEudXNlcklEID0gc2VsZi5vcHRpb25zLnVzZXJfaWRfZm9yX3JlcXVlc3Q7ICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICByZXF1ZXN0LmRhdGEgPSBkYXRhO1xyXG5cclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJyVjVFcgJyArIGFjdGlvbiArICdyZXF1ZXN0OicsICdjb2xvcjpvcmFuZ2VyZWQnKVxyXG5cclxuICAgICAgICAgICAgRUMucmVxdWVzdCggcmVxdWVzdCApLnRoZW4oIGZ1bmN0aW9uICggcmVzcG9uc2UgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCclY1RXICcgKyBhY3Rpb24gKyAncmVzcG9uc2U6JywgJ2NvbG9yOm9yYW5nZXJlZCcpXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmRpciggZGF0YSApXHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCByZXF1ZXN0LmRhdGEuYWN0aW9uID09ICdnZXRUV1NlbmRUd2VldHMnKSBjb25zb2xlLmVycm9yKCBkYXRhIClcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRhdGEubGVuZ3RoIDwgMSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKVxyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIGRhdGEuY3Vyc29yICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kYXRhICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZGF0YS5jdXJzb3JbIDAgXSAhPT0gMCApIHNlbGYubmV4dCA9IGRhdGEuY3Vyc29yWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2F2ZV9pdGVtcyggZGF0YS5kYXRhICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBkYXRhLmRhdGEgIT09IHVuZGVmaW5lZCApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5uZXh0ID0gZGF0YS5kYXRhWyBkYXRhLmRhdGEubGVuZ3RoIC0gMSBdLmlkX3N0cjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zYXZlX2l0ZW1zKCBkYXRhLmRhdGEgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhckZlZWROb3RpZmljYXRpb24oIHRydWUgKTtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1pdGVtcycpLmh0bWwoJzxjZW50ZXIgY2xhc3M9XCJjZW50ZXJcIj5EYXRhIGlzIG1vbWVudGFyaWx5IHVuYXZhaWxhYmxlLCBwbGVhc2UgdHJ5IGFnYWluIGluIGEgZmV3IG1pbnV0ZXMuPC9jZW50ZXI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9yZWZyZXNoIGlzY3JvbGxcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaHRtbCgnPGNlbnRlciBjbGFzcz1cImNlbnRlclwiPkRhdGEgaXMgbW9tZW50YXJpbHkgdW5hdmFpbGFibGUsIHBsZWFzZSB0cnkgYWdhaW4gaW4gYSBmZXcgbWludXRlcy48L2NlbnRlcj4nKTtcclxuICAgICAgICAgICAgICAgIH0gXHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZi5pbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKCByZXF1ZXN0LmRhdGEuYWN0aW9uID09ICdnZXRUV0luQm94JyApIHNlbGYuZWxlbWVudC5maW5kKCcuYnRuLnRvZ2dsZScpLmZpcnN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgfSk7ICAgXHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuYWRkX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgYWRkX2FmdGVyX2luZGV4ID0gdGhpcy5pdGVtcy5sZW5ndGgsXHJcbiAgICAgICAgICAgIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICAgICBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAvLyBpZiAoIHRoaXMuaWQgPT0gJ2xpc3RzJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEsIHRoaXMgKSApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pdGVtc1sgMCBdICE9PSB1bmRlZmluZWQgKSBkYXRhID0gZGF0YS5jb25jYXQoIHRoaXMuaXRlbXNbIDAgXS5kYXRhICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLml0ZW1zLnB1c2goIG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnbWVudGlvbnMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggW3RoaXNfZGF0dW1dLCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFR3aXR0ZXJGZWVkLnByb3RvdHlwZS5zYXZlX2l0ZW1zID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbSxcclxuICAgICAgICAgICAgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBpO1xyXG5cclxuICAgICAgICB0aGlzLml0ZW1zID0gW107IC8vIHJlc2V0XHJcblxyXG4gICAgICAgIC8vIGRpcmVjdCBtZXNzYWdlcyBmZWVkXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICdkaXJlY3RfbWVzc2FnZScgJiYgZGF0YSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBtaW5jb21pbmcgPSBbXSxcclxuICAgICAgICAgICAgICAgIGN1c2VySWQgPSBzZWxmLnByb2ZpbGUuYWNjb3VudC5kYXRhLnVzZXJJZDtcclxuXHJcbiAgICAgICAgICAgIGZvciAoIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgaWYgKCBkYXRhWyBpIF0uY29udmVyc2F0aW9uID09PSB1bmRlZmluZWQgfHwgZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSA9PT0gdW5kZWZpbmVkICkgY29udGludWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSApKSBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5ID0gWyBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5IF07XHJcblxyXG4gICAgICAgICAgICAgICAgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggZGF0YVsgaSBdLmNvbnZlcnNhdGlvbi5zdHJlYW1FbnRyeSwgc2VsZiApO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGYuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBrID0gMCwgbGwgPSBkYXRhWyBpIF0uY29udmVyc2F0aW9uLnN0cmVhbUVudHJ5Lmxlbmd0aDsgayA8IGxsOyBrKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbWVzc2FnZSA9IGRhdGFbIGkgXS5jb252ZXJzYXRpb24uc3RyZWFtRW50cnlbIGsgXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGNtZXNzYWdlLnJlY2lwaWVudC5pZF9zdHIgPT09IGN1c2VySWQgKSAvLyBsYXRlc3QgaW5jb21pbmcgaW4gY29udmVyc2F0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5jb21pbmcucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBjbWVzc2FnZSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSggY21lc3NhZ2UuY3JlYXRlZF9hdCApLmdldFRpbWUoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBjbWVzc2FnZS5pZF9zdHJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG1pbmNvbWluZy5zb3J0KCBmdW5jdGlvbiAoIGEsIGIgKSBcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKGEudGltZSA+IGIudGltZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChhLnRpbWUgPCBiLnRpbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9KTsgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgLy8gZmluZCBsYXRlc3QgaW5jb21pbmdcclxuICAgICAgICAgICAgaWYgKCBtaW5jb21pbmcubGVuZ3RoID4gMCApIHNlbGYuZmlyc3RJdGVtSUQgPSBtaW5jb21pbmdbIDAgXS50aW1lO1xyXG5cclxuICAgICAgICAgICAgZWxzZSAgc2VsZi5maXJzdEl0ZW1JRCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnbGlzdHMnICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX2ZlZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyb3Bkb3duX29iaiA9IG5ldyBEcm9wZG93bkZlZWRJdGVtKCBkYXRhLCB0aGlzICk7XHJcbiAgICAgICAgICAgIC8vdGhpcy5pdGVtcy5wdXNoKCBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmICggdGhpcy5pZCA9PSAnc2VhcmNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIHRoaXMuaWQgPT0gJ291dHJlYWNoJyApIHRoaXMuaXRlbXMucHVzaCggbmV3IFNlYXJjaEZlZWRJdGVtKCBkYXRhLCB0aGlzICkgKTtcclxuXHJcbiAgICAgICAgZWxzZSBpZiAoIGRhdGEgIT09IHVuZGVmaW5lZCApIGZvciAoIGkgPSAwLCBsID0gZGF0YS5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB0aGlzLmZvcm1hdF9pdGVtKCBkYXRhWyBpIF0gKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5pZCA9PSAnbWVudGlvbnMnICkgbmV3X2ZlZWRfaXRlbSA9IG5ldyBUd2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbSggW3RoaXNfZGF0dW1dLCBzZWxmICk7XHJcblxyXG4gICAgICAgICAgICBlbHNlIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNob3dfaXRlbXMoKTtcclxuICAgIH07XHJcblxyXG4gICAgVHdpdHRlckZlZWQucHJvdG90eXBlLmZvcm1hdF9pdGVtID0gZnVuY3Rpb24gKCBkYXRhIClcclxuICAgIHtcclxuICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHtcclxuICAgICAgICAgICAgdXNlcjogZGF0YS51c2VyLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLmNyZWF0ZWRfYXQgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIGZhdm9yaXRlczoge1xyXG4gICAgICAgICAgICAgICAgY291bnQ6IGRhdGEuZmF2b3JpdGVfY291bnQsXHJcbiAgICAgICAgICAgICAgICBieV9tZTogZGF0YS5mYXZvcml0ZWRcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmV0d2VldHM6IHtcclxuICAgICAgICAgICAgICAgIGNvdW50OiBkYXRhLnJldHdlZXRfY291bnQsXHJcbiAgICAgICAgICAgICAgICBieV9tZTogZGF0YS5yZXR3ZWV0ZWQsXHJcbiAgICAgICAgICAgICAgICBpZDogKCAoIGRhdGEucmV0d2VldGVkX3N0YXR1cyAhPT0gdW5kZWZpbmVkICkgPyBkYXRhLnJldHdlZXRlZF9zdGF0dXMuaWRfc3RyIDogZGF0YS5pZF9zdHIgKSxcclxuICAgICAgICAgICAgICAgIHJldHdlZXRJZDogKCAoIGRhdGEucmV0d2VldElkICE9PSB1bmRlZmluZWQgKSA/IGRhdGEucmV0d2VldElkIDogZmFsc2UgKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBkYXRhLnRleHQsXHJcbiAgICAgICAgICAgIGZyb21OYW1lOiAoIGRhdGEubmFtZSB8fCBkYXRhLnVzZXIubmFtZSApLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogKCBkYXRhLnNjcmVlbl9uYW1lIHx8IGRhdGEudXNlci5zY3JlZW5fbmFtZSApLFxyXG4gICAgICAgICAgICBwcm9maWxlUGljOiAoIGRhdGEucHJvZmlsZV9pbWFnZV91cmwgfHwgZGF0YS51c2VyLnByb2ZpbGVfaW1hZ2VfdXJsICksXHJcbiAgICAgICAgICAgIHBvc3RJRDogZGF0YS5pZF9zdHIsXHJcbiAgICAgICAgICAgIGlkOiBkYXRhLmlkX3N0cixcclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEuZW50aXRpZXMgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmVudGl0aWVzLm1lZGlhICE9PSB1bmRlZmluZWQgJiYgQXJyYXkuaXNBcnJheSggZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aGlzX2RhdHVtLm1lZGlhID0gW107XHJcbiAgICAgICAgICAgIGRhdGEuZW50aXRpZXMubWVkaWEubWVkaWFfdXJsLmZvckVhY2goZnVuY3Rpb24obWVkaWFfdXJsKXtcclxuICAgICAgICAgICAgICAgIHRoaXNfZGF0dW0ubWVkaWEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3Bob3RvJyxcclxuICAgICAgICAgICAgICAgICAgICBzcmM6IG1lZGlhX3VybFxyXG4gICAgICAgICAgICAgICAgfSk7ICAgIFxyXG4gICAgICAgICAgICB9KTsgICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHVybHMgPSBbXTtcclxuICAgICAgICBpZiAoIGRhdGEuZW50aXRpZXMgJiYgZGF0YS5lbnRpdGllcy51cmxzICYmICEgXy5pc0VtcHR5KCBkYXRhLmVudGl0aWVzLnVybHMgKSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmxzID0gZGF0YS5lbnRpdGllcy51cmxzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhQXJyYXkuaXNBcnJheSggdXJscyApICkgdXJscyA9IFsgdXJscyBdOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZvciBzaGFyZWQgWVQgbGlua1xyXG4gICAgICAgIGlmICggdXJscy5sZW5ndGggJiYgKCFkYXRhLmVudGl0aWVzLm1lZGlhIHx8IFxyXG4gICAgICAgICAgICAoICFBcnJheS5pc0FycmF5KCBkYXRhLmVudGl0aWVzLm1lZGlhICkgJiYgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgJiYgZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwuaW5kZXhPZignaHR0cHM6Ly9pLnl0aW1nLmNvbS8nKSAhPT0gLTEgKSkpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdmlkZW9faWQ7XHJcbiAgICAgICAgICAgIGlmICggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZigneW91dHViZS5jb20nKSAhPT0gLTEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaGFzaGVzID0gdXJsc1swXS5leHBhbmRlZF91cmwuc2xpY2UoIHVybHNbMF0uZXhwYW5kZWRfdXJsLmluZGV4T2YoJz8nKSArIDEgKS5zcGxpdCgnJicpO1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgaGFzaGVzLmxlbmd0aDsgaSsrICkgXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhhc2ggPSBoYXNoZXNbaV0uc3BsaXQoJz0nKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBoYXNoWzBdID09ICd2JyApIHZpZGVvX2lkID0gaGFzaFsxXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggdXJsc1swXS5leHBhbmRlZF91cmwuaW5kZXhPZignLy95b3V0dS5iZS8nKSAhPT0gLTEgKSB2aWRlb19pZCA9IHVybHNbMF0uZXhwYW5kZWRfdXJsLnJlcGxhY2UoJ2h0dHBzOi8veW91dHUuYmUvJywnJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIHZpZGVvX2lkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5lbnRpdGllcy5tZWRpYSA9IHsgbWVkaWFfdXJsOidodHRwczovL2ltZy55b3V0dWJlLmNvbS92aS8nICt2aWRlb19pZCsgJy9ocWRlZmF1bHQuanBnJyB9O1xyXG4gICAgICAgICAgICAgICAgZGF0YS5lbnRpdGllcy52aWRlb19pZCA9IHZpZGVvX2lkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIHRoaXNfZGF0dW0ubWVzc2FnZSAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIGxpbmtzXHJcbiAgICAgICAgICAgIHZhciBleHAgPSAvKFxcYigoaHR0cHM/fGZ0cHxmaWxlKTpcXC9cXC98Yml0Lmx5XFwvfGdvby5nbFxcL3x0LmNvXFwvKVstQS1aMC05KyZAI1xcLyU/PX5ffCE6LC47XSpbLUEtWjAtOSsmQCNcXC8lPX5ffF0pL2lnO1xyXG5cclxuICAgICAgICAgICAgdGhpc19kYXR1bS5tZXNzYWdlID0gdGhpc19kYXR1bS5tZXNzYWdlLnJlcGxhY2UoZXhwLCcnKS50cmltKCk7XHJcblxyXG4gICAgICAgICAgICB1cmxzLmZvckVhY2goZnVuY3Rpb24odXJsKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aGlzX2RhdHVtLm1lc3NhZ2UgKz0gJyAnICsgdXJsLnVybDsgICBcclxuICAgICAgICAgICAgfSk7ICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzX2RhdHVtO1xyXG4gICAgfTtcclxuXHJcbiAgICBUd2l0dGVyRmVlZC5wcm90b3R5cGUuZ2V0X3Bvc3RfbWVkaWFfZWxlbWVudCA9IGZ1bmN0aW9uICggcmF3X2RhdGEsICRtZWRpYSApXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGV4dF9lbGVtZW50LFxyXG4gICAgICAgICAgICBzbGlkZXJfaXRlbXMgPSBbXTtcclxuICAgICAgICBpZiAoIHJhd19kYXRhICYmIHJhd19kYXRhLmVudGl0aWVzICYmIHJhd19kYXRhLmVudGl0aWVzLm1lZGlhIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBleHRfbWVkaWFfZGF0YSA9IHJhd19kYXRhLmVudGl0aWVzLmV4dF9tZWRpYSxcclxuICAgICAgICAgICAgICAgIGV4dF9tZWRpYSxcclxuICAgICAgICAgICAgICAgIHZhcmlhbnQ7XHJcblxyXG4gICAgICAgICAgICBpZiggZXh0X21lZGlhX2RhdGEgJiYgZXh0X21lZGlhX2RhdGEubWVkaWEgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIEFycmF5LmlzQXJyYXkoIGV4dF9tZWRpYV9kYXRhLm1lZGlhICkgKSBleHRfbWVkaWEgPSBleHRfbWVkaWFfZGF0YS5tZWRpYVsgMCBdO1xyXG5cclxuICAgICAgICAgICAgICAgIGVsc2UgZXh0X21lZGlhID0gZXh0X21lZGlhX2RhdGEubWVkaWE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICggZXh0X21lZGlhICYmICggZXh0X21lZGlhLnR5cGUgPT09ICdhbmltYXRlZF9naWYnIHx8IGV4dF9tZWRpYS50eXBlID09PSAndmlkZW8nICkgJiYgZXh0X21lZGlhLnZpZGVvX2luZm8gJiYgZXh0X21lZGlhLnZpZGVvX2luZm8udmFyaWFudHMgJiYgZXh0X21lZGlhLnZpZGVvX2luZm8udmFyaWFudHMudmFyaWFudCApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZhciB2YXJpYW50X2RhdGEgPSBleHRfbWVkaWEudmlkZW9faW5mby52YXJpYW50cy52YXJpYW50O1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggQXJyYXkuaXNBcnJheSggdmFyaWFudF9kYXRhICkgKSB2YXJpYW50ID0gdmFyaWFudF9kYXRhWyAwIF07XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZSB2YXJpYW50ID0gdmFyaWFudF9kYXRhOyAgICBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB2YXJpYW50IClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJG1lZGlhLmFkZENsYXNzKCdjZW50ZXInKTtcclxuICAgICAgICAgICAgICAgIC8vZXh0X2VsZW1lbnQgPSAkKCc8dmlkZW8gbG9vcCBjbGFzcz1cImFuaW1hdGVkLWdpZlwiIHBvc3Rlcj1cIicgKyBleHRfbWVkaWEubWVkaWFfdXJsX2h0dHBzICsgJ1wiIHNyYz1cIicgKyB2YXJpYW50LnVybCArICdcIj48L3ZpZGVvPicpO1xyXG4gICAgICAgICAgICAgICAgLyppZiAoIGV4dF9tZWRpYS50eXBlID09PSAnYW5pbWF0ZWRfZ2lmJyApIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJCgnPHZpZGVvIGF1dG9wbGF5IGxvb3AgY2xhc3M9XCJhbmltYXRlZC1naWZcIiBwb3N0ZXI9XCInICsgZXh0X21lZGlhLm1lZGlhX3VybF9odHRwcyArICdcIiBzcmM9XCInICsgdmFyaWFudC51cmwgKyAnXCI+PC92aWRlbz4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIHsqL1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd1aS1ncmlkLXNvbG8gbF9tZXNzYWdlJz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0naW1nX2JveCB2aWRlbyB1aS1ncmlkLXNvbG8gcG9zaXRpb24tcmVsYXRpdmUnPjxpbWcgY2xhc3M9XFxcInZpZGVvLWJ1dHRvblxcXCIgc3JjPVxcXCJpbWcvcGxheS1idXR0b24ucG5nXFxcIj48aW1nIGNsYXNzPVxcXCJpbWctcmVzcG9uc2l2ZVxcXCIgc3JjPSdcIiArIGV4dF9tZWRpYS5tZWRpYV91cmxfaHR0cHMgKyBcIic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50Lm9uKCdjbGljaycsZnVuY3Rpb24gKClcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEVDLlVJLklBQiggZW5jb2RlVVJJKHZhcmlhbnQudXJsICksJycsJ19zeXN0ZW0nKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIC8vfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggcmF3X2RhdGEucHJldmlld19jb250ZW50IClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlld19jb250ZW50ID0gSlNPTi5wYXJzZSggcmF3X2RhdGEucHJldmlld19jb250ZW50ICksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlID0gJycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0dWZmID0gJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcHJldmlld19jb250ZW50LnRpdGxlICkgdGl0bGUgPSBwcmV2aWV3X2NvbnRlbnQudGl0bGU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcmF3X2RhdGEucGljdHVyZV90ZXh0ICkgc3R1ZmYgPSByYXdfZGF0YS5waWN0dXJlX3RleHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJChcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdsX21lc3NhZ2UnPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdpbWdfYm94Jz48aW1nIHNyYz0nXCIgKyByYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwgKyBcIic+PC9kaXY+XCIgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2NsZWFyJz48L2Rpdj5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiPGEgY2xhc3M9J3BoX2xpbmsnIGhyZWY9J1wiICsgcHJldmlld19jb250ZW50LnVybCArIFwiJyB0YXJnZXQ9J19ibGFuayc+XCIgKyB0aXRsZSArIFwiPC9hPlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdncmF5X3RleHQgbWVkaWEnPlwiICsgc3R1ZmYgKyBcIjwvZGl2PlwiICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzpyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwsIHc6OTY0LCBoOjEwMjR9KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGV4dF9lbGVtZW50ID0gJCgnPGltZyBjbGFzcz1cInR3aXR0ZXItaW1hZ2VcIiBzcmM9XCInICtyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwrICdcIiA+Jyk7IFxyXG4gICAgICAgICAgICAgICAgICAgIHNsaWRlcl9pdGVtcy5wdXNoKHsnc3JjJzpyYXdfZGF0YS5lbnRpdGllcy5tZWRpYS5tZWRpYV91cmwsIHc6OTY0LCBoOjEwMjR9KTsgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIHZpZGVvX2lkID0gcmF3X2RhdGEuZW50aXRpZXMudmlkZW9faWQ7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB2aWRlb19pZCAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJGNsaWNrYWJsZSA9ICQoJzxkaXY+Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggZXh0X2VsZW1lbnQuZmluZCgnLmltZ19ib3gnKS5sZW5ndGggKSBcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRjbGlja2FibGUgPSBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRfZWxlbWVudC5maW5kKCcuaW1nX2JveCcpLmFkZENsYXNzKCd2aWRlbycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZSA9ICRtZWRpYTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJG1lZGlhLmFkZENsYXNzKCd2aWRlbycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJGNsaWNrYWJsZS5vbignY2xpY2snLCBmdW5jdGlvbiggZSApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBFQy5VSS5JQUIoIGVuY29kZVVSSSggJ2h0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkLycrdmlkZW9faWQrJz9hdXRvcGxheT0xJyApLCcnLCdfc3lzdGVtJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qdmFyIG1lZGlhT2JqZWN0ID0gJzxpZnJhbWUgc3JjPVwiaHR0cHM6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJysgdmlkZW9faWQgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICArICc/YXV0b3BsYXk9MVwiIHdpZHRoPVwiMTI4MFwiIGhlaWdodD1cIjcyMFwiIGZyYW1lYm9yZGVyPVwiMFwiPjwvaWZyYW1lPic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc3RfbWFuYWdlci53YXRjaFBpY3R1cmVWaWRlbyggbWVkaWFPYmplY3QsIHRydWUgKTsgKi8gICBcclxuICAgICAgICAgICAgICAgICAgICB9KTsgICBcclxuICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gW2V4dF9lbGVtZW50LCBzbGlkZXJfaXRlbXNdO1xyXG4gICAgfTtcclxuICAgIFxyXG5cclxuICAgIHJldHVybiBUd2l0dGVyRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCIvKlxyXG4gICAgYWNjb3VudE1hbmFnZXIgbW9kdWxlXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJGh0dHAnLCAnJHN0YXRlJywgJyRyb290U2NvcGUnLCAnJGxvY2FsU3RvcmFnZScsICdFQycsICdhcGlVcmwnLCAnRmVlZCcsICdUaW1lbGluZUZlZWRJdGVtJywgJ0Ryb3Bkb3duRmVlZEl0ZW0nLCBmdW5jdGlvbigkaHR0cCwgJHN0YXRlLCAkcm9vdFNjb3BlLCAkbG9jYWxTdG9yYWdlLCBFQywgYXBpVXJsLCBGZWVkLCBUaW1lbGluZUZlZWRJdGVtLCBEcm9wZG93bkZlZWRJdGVtICl7ICBcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gWW91VHViZUZlZWQgKCBzdHJlYW0sIHByb2ZpbGUsIG9wdGlvbnMgKVxyXG4gICAge1xyXG4gICAgICAgIEZlZWQuYXBwbHkoIHRoaXMsIFsgc3RyZWFtLCBwcm9maWxlLCBvcHRpb25zIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZWQucHJvdG90eXBlICk7XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gWW91VHViZUZlZWQ7XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLmdldF9kYXRhID0gZnVuY3Rpb24gKCBjYWxsYmFjayApXHJcbiAgICB7XHJcbiAgICAgICAgLy8gcmVxdWVzdHMgZGF0YSBhbmQgdGhlbiBjYWxscyB0aGlzLnNhdmVfaXRlbXNcclxuICAgICAgICBpZiAoICF0aGlzLmluaXRpYWxpemVkICkgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKCB0aGlzLmlkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlDaGFubmVsSG9tZSc6IHRoaXMuZ2V0WW91VHViZUZlZWQoXCJ5dF9teUNoYW5uZWxIb21lXCIsXCJcIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICd5dF9teUNoYW5uZWxWaWRlb3MnOiB0aGlzLmdldFlvdVR1YmVGZWVkKFwieXRfbXlDaGFubmVsVmlkZW9zXCIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAneXRfbXlTdWJzY3JpcHRpb24nOiB0aGlzLmdldFlvdVR1YmVGZWVkKFwieXRfbXlTdWJzY3JpcHRpb25cIik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5zYXZlX2l0ZW1zKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBZb3VUdWJlRmVlZC5wcm90b3R5cGUubW9yZSA9IGZ1bmN0aW9uICgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMubmV4dCA9PT0gdW5kZWZpbmVkIHx8ICF0aGlzLm5leHQgKSB7XHJcbiAgICAgICAgICAgIC8vc2VsZi5lbGVtZW50LmZpbmQoJy5tb3JlJylbMF0ucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgcmV0dXJuOyAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRZb3VUdWJlRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHRoaXMuaWQsXHJcbiAgICAgICAgICAgIG5leHRUb2tlbjogdGhpcy5uZXh0IFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC95b3VUdWJlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSB0cnVlO1xyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3AgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZF9tb3JlX2ZsYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcDtcclxuXHJcbiAgICAgICAgICAgIGlmICggZGF0YS5kYXRhLm5leHRUb2tlbiAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IGRhdGEuZGF0YS5uZXh0VG9rZW47XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLm1vcmUnKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIC8vc2VsZi5oaWRlX3B1bGx1cCgpOyBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc2VsZi5hZGRfaXRlbXMoIGRhdGEuZGF0YSApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5nZXRZb3VUdWJlRmVlZCA9IGZ1bmN0aW9uICggc3RyZWFtIClcclxuICAgIHtcclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgIHZhciBkYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZXRZb3VUdWJlRmVlZCcsXHJcbiAgICAgICAgICAgIGFjY291bnRJRDogdGhpcy5wcm9maWxlLmFjY291bnQuaWQsXHJcbiAgICAgICAgICAgIHByb2ZpbGVJRDogdGhpcy5wcm9maWxlLmlkLFxyXG4gICAgICAgICAgICBzdHJlYW06IHN0cmVhbVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGlmICggc2VsZi5pZCA9PSAneXRfbXlTdWJzY3JpcHRpb24nICkgZGF0YS5jaGFubmVsX2lkID0gLyonVUMnICsgKi90aGlzLnByb2ZpbGUuZGF0YS51c2VySWQucmVwbGFjZSgnY2hhbm5lbD09JywnJyk7XHJcblxyXG4gICAgICAgIHZhciByZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgdXJsOiAnZmVlZC95b3VUdWJlJyxcclxuICAgICAgICAgICAgZGF0YTogZGF0YVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIEVDLnJlcXVlc3QoIHJlcXVlc3QgKS50aGVuKCBmdW5jdGlvbiAoIHJlc3BvbnNlIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBvYmogPSByZXNwb25zZTtcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmRhdGEgIT09IHVuZGVmaW5lZCAmJiBvYmouZGF0YS5uZXh0VG9rZW4gIT09IHVuZGVmaW5lZCApIHNlbGYubmV4dCA9IG9iai5kYXRhLm5leHRUb2tlbjtcclxuXHJcbiAgICAgICAgICAgIC8vdGVtcG9yYXJ5XHJcbiAgICAgICAgICAgIGlmICggc2VsZi5pZCA9PT0gJ3l0X215U3Vic2NyaXB0aW9uJyApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGYubmV4dCA9IHVuZGVmaW5lZDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIG9iai5kZWZhdWx0Q2hhbm5lbElkICE9PSB1bmRlZmluZWQgKSBzZWxmLmRlZmF1bHRfZWxlbWVudCA9IG9iai5kZWZhdWx0Q2hhbm5lbElkOyBcclxuICAgICAgICAgICAgfSBcclxuXHJcbiAgICAgICAgICAgIGlmICggb2JqLmNvZGUgPT0gJ0ZBSUwnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtaXRlbXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5odG1sKCc8Y2VudGVyIGNsYXNzPVwiY2VudGVyXCI+RGF0YSBpcyBtb21lbnRhcmlseSB1bmF2YWlsYWJsZSwgcGxlYXNlIHRyeSBhZ2FpbiBpbiBhIGZldyBtaW51dGVzLjwvY2VudGVyPicpO1xyXG4gICAgICAgICAgICAgICAgLy9zZWxmLmVsZW1lbnQuZmluZCgnLmZlZWQtYm9keScpLmZpbmQoJy5tb3JlJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3NlbGYuZWxlbWVudC5maW5kKCcuZmVlZC1ib2R5JykuaXNjcm9sbHZpZXcoXCJyZWZyZXNoXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzZWxmLnNhdmVfaXRlbXMoIG9iai5kYXRhICk7XHJcblxyXG4gICAgICAgICAgICBzZWxmLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgWW91VHViZUZlZWQucHJvdG90eXBlLnNhdmVfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTsgLy8gcmVzZXRcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLmlkID09ICd5dF9teVN1YnNjcmlwdGlvbicgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9mZWVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5kcm9wZG93bl9vYmogPSBuZXcgRHJvcGRvd25GZWVkSXRlbSggZGF0YSwgdGhpcyApO1xyXG4gICAgICAgICAgICAvL3RoaXMuaXRlbXMucHVzaCggbmV3IERyb3Bkb3duRmVlZEl0ZW0oIGRhdGEuaXRlbXMsIHRoaXMgKSApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCBkYXRhICE9PSB1bmRlZmluZWQgJiYgZGF0YS5pdGVtcyAhPT0gdW5kZWZpbmVkIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5pdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdfZmVlZF9pdGVtO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGEuaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBuZXdfZmVlZF9pdGVtID0gbmV3IFRpbWVsaW5lRmVlZEl0ZW0oIHRoaXNfZGF0dW0sIHRoaXMgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pdGVtcy5wdXNoKCBuZXdfZmVlZF9pdGVtICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zaG93X2l0ZW1zKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5hZGRfaXRlbXMgPSBmdW5jdGlvbiAoIGRhdGEgKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBhZGRfYWZ0ZXJfaW5kZXggPSB0aGlzLml0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYgKCBkYXRhLml0ZW1zICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwLCBsID0gZGF0YS5pdGVtcy5sZW5ndGg7IGkgPCBsOyBpKysgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3X2ZlZWRfaXRlbTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgdGhpc19kYXR1bSA9IHRoaXMuZm9ybWF0X2l0ZW0oIGRhdGEuaXRlbXNbIGkgXSApO1xyXG5cclxuICAgICAgICAgICAgICAgIG5ld19mZWVkX2l0ZW0gPSBuZXcgVGltZWxpbmVGZWVkSXRlbSggdGhpc19kYXR1bSwgdGhpcyApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXMucHVzaCggbmV3X2ZlZWRfaXRlbSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmFwcGVuZF9pdGVtcyggYWRkX2FmdGVyX2luZGV4ICk7XHJcbiAgICB9O1xyXG5cclxuICAgIFlvdVR1YmVGZWVkLnByb3RvdHlwZS5mb3JtYXRfaXRlbSA9IGZ1bmN0aW9uKCBkYXRhICkge1xyXG5cclxuICAgICAgICB2YXIgbWVkaWEgPSBkYXRhLm1lZGlhO1xyXG5cclxuICAgICAgICBpZiAoIG1lZGlhLnR5cGUgPT0gXCJ2aWRlb1wiICkge1xyXG4gICAgICAgICAgICBtZWRpYS52aWRlbyA9IHtcclxuICAgICAgICAgICAgICAgIGRpc3BsYXlfdXJsOiAnaHR0cDovL3d3dy55b3V0dWJlLmNvbS9lbWJlZC8nICsgbWVkaWEuaWQgKyAnP2F1dG9wbGF5PTEnLFxyXG4gICAgICAgICAgICAgICAgc291cmNlX3VybDogJ2h0dHA6Ly93d3cueW91dHViZS5jb20vZW1iZWQvJyArIG1lZGlhLmlkICsgJz9hdXRvcGxheT0xJ1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRoaXNfZGF0dW0gPSB7XHJcbiAgICAgICAgICAgIGZyb21JZDogZGF0YS5mcm9tSWQsXHJcbiAgICAgICAgICAgIGZyb21OYW1lOiBkYXRhLmZyb21OYW1lLFxyXG4gICAgICAgICAgICBwcm9maWxlUGljOiBkYXRhLnByb2ZpbGVQaWMsXHJcbiAgICAgICAgICAgIHByb2ZpbGVMaW5rOiBkYXRhLnByb2ZpbGVMaW5rLFxyXG4gICAgICAgICAgICB1cGRhdGVUaW1lOiAoIG5ldyBEYXRlKCBkYXRhLnVwZGF0ZVRpbWUgKS5nZXRUaW1lKCkgLyAxMDAwICksXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGRhdGEubWVzc2FnZSxcclxuXHJcbiAgICAgICAgICAgIC8vbWV0YUluZm86ICggZGF0YS5pdGVtc1sgaSBdLmNoYW5uZWxJZCE9dW5kZWZpbmVkICYmIGRhdGEuaXRlbXNbIGkgXS5jaGFubmVsVGl0bGUhPXVuZGVmaW5lZCksXHJcbiAgICAgICAgICAgIGNoYW5uZWxJZDogZGF0YS5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgIGNoYW5uZWxMaW5rOiAnaHR0cHM6Ly93d3cueW91dHViZS5jb20vY2hhbm5lbC8nICsgZGF0YS5jaGFubmVsSWQsXHJcbiAgICAgICAgICAgIGNoYW5uZWxUaXRsZTogZGF0YS5jaGFubmVsVGl0bGUsXHJcbiAgICAgICAgICAgIGFjdGl2aXR5VHlwZTogZGF0YS5hY3Rpdml0eVR5cGUgfHwgJycsXHJcblxyXG4gICAgICAgICAgICBsaWtlczogZGF0YS5saWtlcyxcclxuICAgICAgICAgICAgdmlld3M6IGRhdGEudmlld3MsXHJcbiAgICAgICAgICAgIGNvbW1lbnRzOiBkYXRhLmNvbW1lbnRzLFxyXG5cclxuICAgICAgICAgICAgLy91c2VyOiBkYXRhWyBpIF0udXNlcixcclxuICAgICAgICAgICAgLy9uYW1lOiBkYXRhLml0ZW1zWyBpIF0udGl0bGUsXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIG1lZGlhOiBtZWRpYSxcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgcG9zdElEOiBkYXRhLmZyb21JZCwgLy8/Pz9cclxuICAgICAgICAgICAgcmF3X2RhdGE6IGRhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoIGRhdGEubWVzc2FnZS5pbmRleE9mKCd1cGxvYWRlZCBhIHZpZGVvJykgIT0gLTEgKSB0aGlzX2RhdHVtLm1lc3NhZ2UgPSAnJztcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXNfZGF0dW07XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBZb3VUdWJlRmVlZDtcclxuXHJcbn1dO1xyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuY29uc3RhbnRzJyxbXSkgIFxyXG4gIC5jb25zdGFudCgnYXBpVXJsJywgJ2h0dHBzOi8vZWNsaW5jaGVyLmNvbS9zZXJ2aWNlLycpXHJcbiAgLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHsgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyB9KTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuY29udHJvbGxlcnMnLCBbXSlcclxuXHJcbi5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGlvbmljTG9hZGluZywgQXV0aFNlcnZpY2UpIHtcclxuXHJcbiAgICAkc2NvcGUuZGF0YSA9IHt9O1xyXG4gICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgIC8vJHN0YXRlLmdvKCd0YWJzLmhvbWUnKTtcclxuXHJcbiAgICAgICAgJGlvbmljTG9hZGluZy5zaG93KHtcclxuICAgICAgICAgICAgbm9CYWNrZHJvcDogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgdmFyIGEgPSBBdXRoU2VydmljZS5sb2dpbigkc2NvcGUuZGF0YS51c2VybmFtZSwgJHNjb3BlLmRhdGEucGFzc3dvcmQsIGZ1bmN0aW9uKHJlc3ApIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1paWjonICsgcmVzcCk7XHJcbiAgICAgICAgICAgICRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG59KVxyXG5cclxuXHJcbi5jb250cm9sbGVyKCdIb21lVGFiQ3RybCcsIGZ1bmN0aW9uKCRzdGF0ZSwgJHNjb3BlLCAkcm9vdFNjb3BlLCBFQywgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICR1cmxSb3V0ZXIsIF8pIHtcclxuXHJcblxyXG4gICAgY29uc29sZS5sb2coJ0FBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQSEhISEhIyMjIyMnKTtcclxuICAgIFxyXG4gICAgaWYoICRyb290U2NvcGUuc29jaWFsICE9PSB1bmRlZmluZWQgKVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyKTtcclxuXHJcbiAgICAkc2NvcGUuJG9uKFwiJGlvbmljVmlldy5lbnRlclwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAkc2NvcGUuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgnaG9tZScpKTtcclxuICAgIH0pO1xyXG4gICAgXHJcblxyXG4gICAgJHNjb3BlLmdyb3VwcyA9IFtdO1xyXG4gICAgJHNjb3BlLmFjY190eXBlcyA9IFtdO1xyXG5cclxuICAgIGlmKCBhY2NvdW50TWFuYWdlci5pc19yZW5kZXJlZCggKSApXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ29vb29vb29vb29vbycpO1xyXG4gICAgICAgIHByZXBhcmVBY2NvdW50cygpO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdubm5ubm5ubm5ubm4nKTtcclxuICAgICAgICAkaW9uaWNMb2FkaW5nLnNob3coe25vQmFja2Ryb3A6IHRydWV9KTtcclxuICAgICAgICBhY2NvdW50TWFuYWdlci5pbml0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAkaW9uaWNMb2FkaW5nLmhpZGUoKTtcclxuICAgICAgICAgICAgcHJlcGFyZUFjY291bnRzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuXHJcblxyXG4gICAgZnVuY3Rpb24gcHJlcGFyZUFjY291bnRzKClcclxuICAgIHtcclxuICAgICAgICB2YXIgQUNDUyA9IGFjY291bnRNYW5hZ2VyLmxpc3RfYWNjb3VudHMoKTtcclxuXHJcbiAgICAgICAgdmFyIHRlbXAgPSBbXSxcclxuICAgICAgICAgICAgYWNjX3R5cGVzID0gW107XHJcblxyXG4gICAgICAgIEFDQ1MuZm9yRWFjaChmdW5jdGlvbihhY2NvdW50LCBpbmRleCkge1xyXG4gICAgICAgICAgICB2YXIgdHlwZSA9IGFjY291bnQudHlwZS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRlbXBbdHlwZV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGVtcFt0eXBlXS5wcm9maWxlcyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vZWxzZVxyXG4gICAgICAgICAgICAvL3tcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhY2NvdW50LnByb2ZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWNjb3VudC5wcm9maWxlc1tpXS5tb25pdG9yZWQgPT0gJ29mZicpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHRlbXBbdHlwZV0ucHJvZmlsZXMucHVzaChhY2NvdW50LnByb2ZpbGVzW2ldKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL31cclxuXHJcbiAgICAgICAgICAgIHRlbXBbdHlwZV0udHlwZSA9IHR5cGU7XHJcbiAgICAgICAgICAgIGlmIChhY2NfdHlwZXMuaW5kZXhPZih0eXBlKSA9PT0gLTEpIGFjY190eXBlcy5wdXNoKHR5cGUpO1xyXG5cclxuICAgICAgICAgICAgLy90ZW1wW3R5cGVdLnB1c2goIHsndHlwZSc6dHlwZSwgJ3Byb2ZpbGVzJzphY2NvdW50LnByb2ZpbGVzfSApO1xyXG5cclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2codGVtcCk7XHJcbiAgICAgICAgJHNjb3BlLmdyb3VwcyA9IHRlbXA7XHJcbiAgICAgICAgJHNjb3BlLmFjY190eXBlcyA9IGFjY190eXBlcztcclxuXHJcbiAgICAgICAgYWNjb3VudE1hbmFnZXIuc2V0X3JlbmRlcmVkKCB0cnVlICk7XHJcblxyXG4gICAgICAgICRzY29wZS5vcGVuRmVlZHMgPSBmdW5jdGlvbiggcHJvZmlsZSApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9maWxlKTtcclxuICAgICAgICAgICAgcHJvZmlsZS5zb2NpYWwucmVuZGVyKCk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgJHNjb3BlLmducyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgICB2YXIgZ2V0RXhpc3RpbmdTdGF0ZSA9ICRzdGF0ZS5nZXQoJ3RhYnMucmFtLW5ldycpO1xyXG5cclxuICAgICAgICAgIGlmKGdldEV4aXN0aW5nU3RhdGUgIT09IG51bGwpe1xyXG4gICAgICAgICAgICByZXR1cm47IFxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBzdGF0ZSA9IHtcclxuICAgICAgICAgICAgICBcInVybFwiOiAnL3JhbS1uZXcnLFxyXG4gICAgICAgICAgICAgIFwidmlld3NcIjoge1xyXG4gICAgICAgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG4gICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcmFtLmh0bWxcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAkc3RhdGVQcm92aWRlclJlZi5zdGF0ZSgndGFicy5yYW0tbmV3Jywgc3RhdGUpO1xyXG5cclxuICAgICAgICAgICR1cmxSb3V0ZXIuc3luYygpO1xyXG4gICAgICAgICAgJHVybFJvdXRlci5saXN0ZW4oKTtcclxuXHJcbiAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMucmFtLW5ldycpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coZ2V0RXhpc3RpbmdTdGF0ZSk7XHJcbiAgICAgICAgICBcclxuXHJcbiAgICB9O1xyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdNYW5hZ2VBY2NvdW50cycsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCBFQywgJHJvb3RTY29wZSwgJGlvbmljSGlzdG9yeSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCwgJGlvbmljTG9hZGluZywgYWNjb3VudE1hbmFnZXIsICRsb2NhbFN0b3JhZ2UpIHtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQicpO1xyXG4gICAgY29uc29sZS5sb2coJyRsb2NhbFN0b3JhZ2UuYWxsX3NldHRpbmdzJyk7XHJcbiAgICBjb25zb2xlLmxvZygkbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKGFjY291bnRNYW5hZ2VyLnRlc3QoKSk7XHJcbiAgICBcclxuICAgICRzY29wZS4kcGFyZW50LnVwZGF0ZVNpZGVNZW51KEVDLmdldFNpZGVNZW51KCdob21lJykpO1xyXG5cclxuICAgICRzY29wZS5hY2NvdW50cyA9IGFjY291bnRNYW5hZ2VyLmFjY291bnRzKCk7XHJcblxyXG4gICAgY29uc29sZS5sb2coICRzY29wZS5hY2NvdW50cyApO1xyXG5cclxuICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlRW50ZXInLCBmdW5jdGlvbihldmVudCwgdmlld0RhdGEpIHtcclxuICAgICAgICB2aWV3RGF0YS5lbmFibGVCYWNrID0gdHJ1ZTtcclxuICAgICAgICB2aWV3RGF0YS5oYXNIZWFkZXJCYXIgPSB0cnVlO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHZpZXdEYXRhKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBidiA9ICRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKTtcclxuXHJcbiAgICAkc2NvcGUuJGlvbmljR29CYWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0tLS0tLJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coYnYpO1xyXG5cclxuICAgICAgICBpZiAoYnYpIHtcclxuICAgICAgICAgICAgJGlvbmljSGlzdG9yeS5nb0JhY2soKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMuaG9tZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgICRzY29wZS5hZGRfYWNjb3VudCA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgICBhY2NvdW50TWFuYWdlci5hZGRfYWNjb3VudCh0eXBlKTtcclxuICAgIH07XHJcblxyXG4gICAgJHNjb3BlLmNzdCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuYWNjb3VudHMpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGFjY291bnRNYW5hZ2VyLmFjY291bnRzKCkpO1xyXG4gICAgICAgIC8vYWNjb3VudE1hbmFnZXIuc2V0X3JlbmRlcmVkKCBmYWxzZSApO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxufSlcclxuXHJcbi5jb250cm9sbGVyKCdGZWVkcycsIGZ1bmN0aW9uKCRzY29wZSwgICRpb25pY1Njcm9sbERlbGVnYXRlLCAkc3RhdGUsICRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgRUMsICRpb25pY0hpc3RvcnksICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwsICRpb25pY0xvYWRpbmcsIGFjY291bnRNYW5hZ2VyLCAkbG9jYWxTdG9yYWdlKSB7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0MhISEhISMjIyMjJyk7XHJcbiAgICAvL2NvbnNvbGUubG9nKCckbG9jYWxTdG9yYWdlLmFsbF9zZXR0aW5ncycpO1xyXG4gICAgLy9jb25zb2xlLmxvZygkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcik7XHJcbiAgICAvL2NvbnNvbGUubG9nKCRzdGF0ZS5jdXJyZW50Lm5hbWUpO1xyXG4gICBcclxuICAgIFxyXG4gICAgXHJcbiAgICAkc2NvcGUubW9yZURhdGFDYW5CZUxvYWRlZCA9IGZhbHNlO1xyXG4gICAgJHNjb3BlLmNvdW50ZXIgPSAwO1xyXG5cclxuICAgIHZhciBpbmRleCA9IF8uZmluZExhc3RJbmRleCgkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlciwgeyAgcGFnZV9pZDogJHN0YXRlLmN1cnJlbnQubmFtZX0pO1xyXG4gICAgJHNjb3BlLmZlZWQgPSAkcm9vdFNjb3BlLnNvY2lhbC5mZWVkc19pbl9vcmRlcltpbmRleF07XHJcbiAgICBcclxuICAgIGNvbnNvbGUubG9nKCRzY29wZS5mZWVkKTtcclxuICAgIHZhciBuZXh0X3BhZ2VfaW5kZXggPSAwLFxyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IDAsXHJcbiAgICAgICAgbm9fb2ZfcGFnZXMgPSAkc2NvcGUuZmVlZC5wcm9maWxlLnNvY2lhbC51cGRhdGVkX3N0cmVhbXNfb3JkZXIubGVuZ3RoOy8vJHJvb3RTY29wZS5zb2NpYWwuZmVlZHNfaW5fb3JkZXIubGVuZ3RoO1xyXG5cclxuICAgIGlmKCBpbmRleCA9PT0gMCApXHJcbiAgICB7XHJcbiAgICAgICAgbmV4dF9wYWdlX2luZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYoIGluZGV4ID09IChub19vZl9wYWdlcyAtIDEpIClcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSAwO1xyXG4gICAgICAgIHByZXZfcGFnZV9pbmRleCA9IG5vX29mX3BhZ2VzIC0gMjtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgIHtcclxuICAgICAgICBuZXh0X3BhZ2VfaW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgcHJldl9wYWdlX2luZGV4ID0gaW5kZXggLSAxO1xyXG4gICAgfVxyXG5cclxuICAgICRzY29wZS5uZXh0X3BhZ2VfaWQgPSAkc2NvcGUuZmVlZC5wcm9maWxlLnNvY2lhbC51cGRhdGVkX3N0cmVhbXNfb3JkZXJbbmV4dF9wYWdlX2luZGV4XTsvLyRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW25leHRfcGFnZV9pbmRleF0ucGFnZV9pZDtcclxuICAgICRzY29wZS5wcmV2X3BhZ2VfaWQgPSAkc2NvcGUuZmVlZC5wcm9maWxlLnNvY2lhbC51cGRhdGVkX3N0cmVhbXNfb3JkZXJbcHJldl9wYWdlX2luZGV4XTsvLyRyb290U2NvcGUuc29jaWFsLmZlZWRzX2luX29yZGVyW3ByZXZfcGFnZV9pbmRleF0ucGFnZV9pZDtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhpbmRleCk7XHJcbiAgICBjb25zb2xlLmxvZygkc2NvcGUuZmVlZCk7XHJcbiAgICBcclxuICAgICRzY29wZS50ZXN0X25hbWUgPSBbXTtcclxuICAgICRzY29wZS50ZXN0X25hbWUucHVzaCh7J25hbWUnOidSYW0nfSk7XHJcbiAgICAkc2NvcGUuZ2V0U2Nyb2xsUG9zaXRpb24gPSBmdW5jdGlvbigpIHsgICAgICAgXHJcbiAgICBcclxuICAgICAgICBcclxuICAgIH07XHJcbiAgICBcclxuICAgICRzY29wZS5mZWVkLmRkID0geyAnY291bnQnOjAsICdkYXRhJzpbXSwgJ3BsYWNlaG9sZGVyJzogJyd9O1xyXG4gICAgJHNjb3BlLnNlbGVjdGVkX2RkID0ge307XHJcblxyXG4gICAgJHNjb3BlLiR3YXRjaCgnZmVlZC5kcm9wZG93bl9mZWVkJywgZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5kcm9wZG93bl9mZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdNTU1NTU1NTU1NTU1NTU1NTScpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmopO1xyXG4gICAgICAgICAgICAkc2NvcGUuZmVlZC5kZCA9ICRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5nZXRfZHJvcGRvd24oKTtcclxuXHJcbiAgICAgICAgICAgIGlmKCAhJHNjb3BlLmZlZWQuZGQuZGF0YS5sZW5ndGggKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnc2Nyb2xsLmluZmluaXRlU2Nyb2xsQ29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgICRzY29wZS5tb3JlZGF0YSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc2VsZWN0ZWRfZGQgPSAkc2NvcGUuZmVlZC5kZC5kYXRhWzBdO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmxvYWRNb3JlKCk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgIFxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgJHNjb3BlLiR3YXRjaENvbGxlY3Rpb24oJ2ZlZWQuaXRlbXMnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBcclxuICAgICAgICBpZiggJHNjb3BlLmZlZWQuaXRlbXMubGVuZ3RoIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSicpO1xyXG4gICAgICAgICAgICAkc2NvcGUuJGJyb2FkY2FzdCgnc2Nyb2xsLmluZmluaXRlU2Nyb2xsQ29tcGxldGUnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgJHNjb3BlLiR3YXRjaCgnZmVlZC5sb2FkX21vcmVfZmxhZycsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCAhJHNjb3BlLmZlZWQubG9hZF9tb3JlX2ZsYWcgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgJHNjb3BlLm1vcmVkYXRhID0gdHJ1ZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICAkc2NvcGUubW9yZWRhdGEgPSBmYWxzZTtcclxuXHJcbiAgICAkc2NvcGUubG9hZE1vcmUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcblxyXG4gICAgICAgIGlmKCAkc2NvcGUuZmVlZC5kcm9wZG93bl9mZWVkIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICggISAkc2NvcGUuZmVlZC5pdGVtcy5sZW5ndGggJiYgJHNjb3BlLmNvdW50ZXIgPT0gMSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICRzY29wZS5mZWVkLmxhc3RfbG9hZGVkX3RpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5kcm9wZG93bl9vYmouc2V0X2RlZmF1bHRfZ3JvdXBfaWQoICRzY29wZS5zZWxlY3RlZF9kZCApO1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLmdldF9kYXRhKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdsb2FkIG1vcmUuLi4uLi4uLi4uLi4uLi4uLi4uLi4nKTtcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKCAhICRzY29wZS5mZWVkLml0ZW1zLmxlbmd0aCAmJiAhICRzY29wZS5jb3VudGVyIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQubGFzdF9sb2FkZWRfdGltZSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuZmVlZC5nZXRfZGF0YSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZlZWQubW9yZSgpO1xyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuXHJcbiAgICAgICAgJHNjb3BlLmNvdW50ZXIrKzsgICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgJHNjb3BlLmxvYWRNb3JlKCk7XHJcbiAgICBcclxuICAgICRzY29wZS5wcm9jZXNzREQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnNlbGVjdGVkX2RkKTtcclxuICAgICAgICAkc2NvcGUuZmVlZC5pdGVtcyA9IFtdO1xyXG5cclxuICAgICAgICAkc2NvcGUuY291bnRlciA9IDE7XHJcbiAgICAgICAgJHNjb3BlLmxvYWRNb3JlKCk7XHJcblxyXG4gICAgICAgIC8vJHNjb3BlLmZlZWQuZHJvcGRvd25fb2JqLnNldF9kZWZhdWx0X2dyb3VwX2lkKCAkc2NvcGUuc2VsZWN0ZWRfZGQgKTtcclxuICAgICAgICAvLyRzY29wZS5mZWVkLmRyb3Bkb3duX29iai5nZXRfZGF0YSggJHNjb3BlLnNlbGVjdGVkX2RkICk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICAkc2NvcGUuJG9uKFwiJGlvbmljVmlldy5lbnRlclwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZGVsZWdhdGUgPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZS4kZ2V0QnlIYW5kbGUoJ21haW5TY3JvbGwnKTtcclxuICAgICAgICAvL2RlbGVnYXRlLnNjcm9sbFRvKCAwLCAkc2NvcGUuZmVlZC5sYXN0X3Njcm9sbF9wb3NpdGlvbiApO1xyXG4gICAgICAgICRzY29wZS4kcGFyZW50LiRwYXJlbnQudXBkYXRlU2lkZU1lbnUoRUMuZ2V0U2lkZU1lbnUoJ2ZlZWQnKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkc2NvcGUuJG9uKFwiJGlvbmljVmlldy5iZWZvcmVMZWF2ZVwiLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb24gPSAkaW9uaWNTY3JvbGxEZWxlZ2F0ZS4kZ2V0QnlIYW5kbGUoJ21haW5TY3JvbGwnKS5nZXRTY3JvbGxQb3NpdGlvbigpO1xyXG4gICAgICAgICRzY29wZS5mZWVkLmxhc3Rfc2Nyb2xsX3Bvc2l0aW9uID0gcG9zaXRpb24udG9wO1xyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcblxyXG4gICAgXHJcblxyXG4gICAgJHNjb3BlLiRvbignJGlvbmljVmlldy5iZWZvcmVFbnRlcicsIGZ1bmN0aW9uKGV2ZW50LCB2aWV3RGF0YSkge1xyXG4gICAgICAgIHZpZXdEYXRhLmVuYWJsZUJhY2sgPSB0cnVlO1xyXG4gICAgICAgIHZpZXdEYXRhLmhhc0hlYWRlckJhciA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2codmlld0RhdGEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICRzY29wZS4kaW9uaWNHb0JhY2sgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0tLS0snKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgIGlmIChidikge1xyXG4gICAgICAgICAgICAkaW9uaWNIaXN0b3J5LmdvQmFjaygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRzdGF0ZS5nbygndGFicy5ob21lJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG4gICAgXHJcblxyXG5cclxuXHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignUHVibGlzaGluZycsIGZ1bmN0aW9uKCRzY29wZSwgRUMsIGFjY291bnRNYW5hZ2VyKSB7XHJcblxyXG4gICAgXHJcblxyXG4gICAkc2NvcGUuJHBhcmVudC51cGRhdGVTaWRlTWVudShFQy5nZXRTaWRlTWVudSgncHVibGlzaGluZycpKTtcclxuXHJcbiAgICBcclxuXHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignUG9zdFNldHRpbmdzJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRyb290U2NvcGUsICRpb25pY0hpc3RvcnksICRpb25pY1BvcHVwLCAkaW9uaWNBY3Rpb25TaGVldCwgJGlvbmljTW9kYWwsICRpb25pY0xvYWRpbmcsIGFjY291bnRNYW5hZ2VyKSB7XHJcblxyXG4gICAgICAgICRzY29wZS4kb24oJyRpb25pY1ZpZXcuYmVmb3JlRW50ZXInLCBmdW5jdGlvbihldmVudCwgdmlld0RhdGEpIHtcclxuICAgICAgICAgICAgdmlld0RhdGEuZW5hYmxlQmFjayA9IHRydWU7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHZpZXdEYXRhKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyIGJ2ID0gJGlvbmljSGlzdG9yeS5iYWNrVmlldygpO1xyXG5cclxuICAgICAgICAkc2NvcGUuJGlvbmljR29CYWNrID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdLS0tLSycpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhidik7XHJcblxyXG4gICAgICAgICAgICBpZiAoYnYpIHtcclxuICAgICAgICAgICAgICAgICRpb25pY0hpc3RvcnkuZ29CYWNrKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3RhYnMubGlzdCcpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSlcclxuICAgIC5jb250cm9sbGVyKCdCdXR0b25zVGFiQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJGlvbmljUG9wdXAsICRpb25pY0FjdGlvblNoZWV0LCAkaW9uaWNNb2RhbCkge1xyXG5cclxuICAgICAgICAkc2NvcGUuc2hvd1BvcHVwID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICRpb25pY1BvcHVwLmFsZXJ0KHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnUG9wdXAnLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogJ1RoaXMgaXMgaW9uaWMgcG9wdXAgYWxlcnQhJ1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgICAgICRzY29wZS5zaG93QWN0aW9uc2hlZXQgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgJGlvbmljQWN0aW9uU2hlZXQuc2hvdyh7XHJcbiAgICAgICAgICAgICAgICB0aXRsZVRleHQ6ICdJb25pYyBBY3Rpb25TaGVldCcsXHJcbiAgICAgICAgICAgICAgICBidXR0b25zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdGYWNlYm9vaydcclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnVHdpdHRlcidcclxuICAgICAgICAgICAgICAgIH0sIF0sXHJcbiAgICAgICAgICAgICAgICBkZXN0cnVjdGl2ZVRleHQ6ICdEZWxldGUnLFxyXG4gICAgICAgICAgICAgICAgY2FuY2VsVGV4dDogJ0NhbmNlbCcsXHJcbiAgICAgICAgICAgICAgICBjYW5jZWw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdDQU5DRUxMRUQnKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBidXR0b25DbGlja2VkOiBmdW5jdGlvbihpbmRleCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCVVRUT04gQ0xJQ0tFRCcsIGluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBkZXN0cnVjdGl2ZUJ1dHRvbkNsaWNrZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdERVNUUlVDVCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG4gICAgfSlcclxuXHJcbi5jb250cm9sbGVyKCdTbGlkZWJveEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRpb25pY1NsaWRlQm94RGVsZWdhdGUpIHtcclxuICAgICRzY29wZS5uZXh0U2xpZGUgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAkaW9uaWNTbGlkZUJveERlbGVnYXRlLm5leHQoKTtcclxuICAgIH07XHJcbn0pXHJcblxyXG4uY29udHJvbGxlcignTWVudUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRyb290U2NvcGUsICRpb25pY1NpZGVNZW51RGVsZWdhdGUsICRpb25pY01vZGFsKSB7XHJcblxyXG5cclxuICAgICRzY29wZS51cGRhdGVTaWRlTWVudSA9IGZ1bmN0aW9uKG1lbnUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhtZW51KTtcclxuICAgICAgICAkc2NvcGUubWVudUl0ZW1zID0gbWVudTtcclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICAkaW9uaWNNb2RhbC5mcm9tVGVtcGxhdGVVcmwoJ3RlbXBsYXRlcy9tb2RhbC5odG1sJywgZnVuY3Rpb24obW9kYWwpIHtcclxuICAgICAgICAkc2NvcGUubW9kYWwgPSBtb2RhbDtcclxuICAgIH0sIHtcclxuICAgICAgICBhbmltYXRpb246ICdzbGlkZS1pbi11cCdcclxuICAgIH0pO1xyXG59KVxyXG5cclxuLmNvbnRyb2xsZXIoJ0FwcEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJHJvb3RTY29wZSkge1xyXG5cclxuICAgICRyb290U2NvcGUubWVudUl0ZW1zID0gW107XHJcblxyXG59KTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuZGlyZWN0aXZlcycsIFtdKVxyXG5cclxuLmRpcmVjdGl2ZSgncG9zaXRpb25CYXJzQW5kQ29udGVudCcsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XHJcblxyXG4gcmV0dXJuIHtcclxuICAgIFxyXG4gICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgIHNjb3BlOiB7XHJcbiAgICAgICAgZGRGZWVkOiAnPWRkRmVlZCdcclxuICAgIH0sXHJcblxyXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XHJcbiAgICAgIFxyXG5cclxuICAgICAgY29uc29sZS5sb2coJ0tBS0FLQUtBS0tBS0FLQUs6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OjonKTtcclxuICAgICAgY29uc29sZS5sb2coc2NvcGUuZGRGZWVkKTtcclxuICAgICAgZG9Qcm9jZXNzKCk7XHJcblxyXG4gICAgICBzY29wZS4kd2F0Y2goJ2RkRmVlZCcsIGZ1bmN0aW9uKG52KXtcclxuICAgICAgICBjb25zb2xlLmxvZygnS0FLQUtBS0FLS0FLQUtBSzo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6OicpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG52KTtcclxuICAgICAgICBkb1Byb2Nlc3MoKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBkb1Byb2Nlc3MoKVxyXG4gICAgICB7XHJcbiAgICAgICAgICB2YXIgb2Zmc2V0VG9wID0gMDtcclxuICAgICAgICAgIHZhciBwbGF0Zm9ybSA9ICdpb3MnOy8vJGNvcmRvdmFEZXZpY2UuZ2V0UGxhdGZvcm0oKTtcclxuICAgICAgICAgIHBsYXRmb3JtID0gcGxhdGZvcm0udG9Mb3dlckNhc2UoKTsgICAgXHJcblxyXG5cclxuICAgICAgICAgIC8vIEdldCB0aGUgcGFyZW50IG5vZGUgb2YgdGhlIGlvbi1jb250ZW50XHJcbiAgICAgICAgICB2YXIgcGFyZW50ID0gYW5ndWxhci5lbGVtZW50KGVsZW1lbnRbMF0ucGFyZW50Tm9kZSk7XHJcblxyXG4gICAgICAgICAgdmFyIG1faGVhZGVyID0gIHBhcmVudFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdiYXItaGVhZGVyJyk7XHJcblxyXG4gICAgICAgICAgLy8gR2V0IGFsbCB0aGUgaGVhZGVycyBpbiB0aGlzIHBhcmVudFxyXG4gICAgICAgICAgdmFyIHNfaGVhZGVycyA9IHBhcmVudFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdiYXItc3ViaGVhZGVyJyk7XHJcbiAgICAgICAgICB2YXIgaV9jb250ZW50ID0gcGFyZW50WzBdLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpb24tY29udGVudCcpO1xyXG5cclxuICAgICAgICAgIGlmKCBtX2hlYWRlci5sZW5ndGggKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBvZmZzZXRUb3AgPSBtX2hlYWRlclswXS5vZmZzZXRIZWlnaHQgKyAocGxhdGZvcm0gPT0gJ2lvcyc/MjA6MCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBhbGwgdGhlIGhlYWRlcnNcclxuICAgICAgICAgIGZvcih4PTA7eDxzX2hlYWRlcnMubGVuZ3RoO3grKylcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgdGhlIG1haW4gaGVhZGVyIG9yIG5hdi1iYXIsIGFkanVzdCBpdHMgcG9zaXRpb24gdG8gYmUgYmVsb3cgdGhlIHByZXZpb3VzIGhlYWRlclxyXG4gICAgICAgICAgICBpZih4ID49IDApIHtcclxuICAgICAgICAgICAgICBzX2hlYWRlcnNbeF0uc3R5bGUudG9wID0gb2Zmc2V0VG9wICsgJ3B4JztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQWRkIHVwIHRoZSBoZWlnaHRzIG9mIGFsbCB0aGUgaGVhZGVyIGJhcnNcclxuICAgICAgICAgICAgb2Zmc2V0VG9wID0gb2Zmc2V0VG9wICsgc19oZWFkZXJzW3hdLm9mZnNldEhlaWdodDtcclxuICAgICAgICAgIH0gICAgICBcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gUG9zaXRpb24gdGhlIGlvbi1jb250ZW50IGVsZW1lbnQgZGlyZWN0bHkgYmVsb3cgYWxsIHRoZSBoZWFkZXJzXHJcbiAgICAgICAgICBpX2NvbnRlbnRbMF0uc3R5bGUudG9wID0gb2Zmc2V0VG9wICsgJ3B4JztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07ICBcclxufSlcclxuXHJcbi5kaXJlY3RpdmUoJ2hpZGVUYWJzJywgZnVuY3Rpb24oJHJvb3RTY29wZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnQScsXHJcbiAgICAgIGxpbms6IGZ1bmN0aW9uKCRzY29wZSwgJGVsKSB7XHJcbiAgICAgICAgICAkcm9vdFNjb3BlLmhpZGVUYWJzID0gJ3RhYnMtaXRlbS1oaWRlJztcclxuICAgICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgJHJvb3RTY29wZS5oaWRlVGFicyA9ICcnO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlQWNjb3VudCcsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIGFjY291bnQ6ICc9YWNjb3VudCdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtYWNjb3VudC5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUuY3YgPSBmdW5jdGlvbihvYmope1xyXG4gICAgICAgICAgICBhbGVydCg1NSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICBzY29wZS5yZWZyZXNoQWNjb3VudCA9IGZ1bmN0aW9uKCBvYmogKXtcclxuICAgICAgICAgICAgb2JqLnJlZnJlc2hBY2NvdW50KCk7XHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHNjb3BlLmRlbGV0ZUFjY291bnQgPSBmdW5jdGlvbiggb2JqICl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG9iaik7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlUHJvZmlsZScsIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICBzY29wZToge1xyXG4gICAgICAgIHByb2ZpbGU6ICc9cHJvZmlsZSdcclxuICAgICAgfSxcclxuICAgICAgdGVtcGxhdGVVcmw6ICd0ZW1wbGF0ZXMvZGlyZWN0aXZlcy9tYW5hZ2UtcHJvZmlsZS5odG1sJyxcclxuICAgICAgbGluazpmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpe1xyXG4gICAgICAgICAgc2NvcGUudmFsaWRhdGVDaGVjayA9IGZ1bmN0aW9uKG9iail7XHJcbiAgICAgICAgICAgIC8vb2JqLm5ld19rZXkgPSAnZnJvbSBkaXJlY3RpdmUnO1xyXG4gICAgICAgICAgICAvL2FsZXJ0KG9iai5nZXRVc2VyTmFtZSgpKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cob2JqKTtcclxuICAgICAgICAgICAgb2JqLnVwZGF0ZV9tb25pdG9yKG9iai5wcm9maWxlX2NoZWNrZWQpO1xyXG4gICAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICB9XHJcbiAgICB9O1xyXG59KVxyXG5cclxuLmRpcmVjdGl2ZSgnbWFuYWdlVGVzdCcsIGZ1bmN0aW9uKCRjb21waWxlKXtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgIHNjb3BlOiB7XHJcbiAgICAgICAgaXRlbTogJz1pdGVtJ1xyXG4gICAgICB9LFxyXG4gICAgICAvL3RlbXBsYXRlVXJsOiAndGVtcGxhdGVzL2RpcmVjdGl2ZXMvbWFuYWdlLXByb2ZpbGUuaHRtbCcsXHJcbiAgICAgIGxpbms6ZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKXtcclxuICAgICAgICAgIHZhciB0ZW1wbGF0ZSA9ICc8cD5NTU1NTU1NTU1NTU1NTU1NTU1NTU1NTU08L3A+JztcclxuXHJcbiAgICAgICAgICB0ZW1wbGF0ZSA9ICQodGVtcGxhdGUpOyBcclxuICAgICAgICAgIC8vdGVtcGxhdGUuZmluZCgnLnRlc3QnKS5hcHBlbmQoc2NvcGUuZGF0YS5pdGVtVGVzdCk7ICAgICAgICAgICAgIFxyXG4gICAgICAgICAgZWxlbWVudC5hcHBlbmQoICRjb21waWxlKHRlbXBsYXRlKShzY29wZSkgKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxufSk7XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IFsnJHN0YXRlUHJvdmlkZXInLCAnJHVybFJvdXRlclByb3ZpZGVyJywnJGlvbmljQ29uZmlnUHJvdmlkZXInLCBcclxuXHRmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlciwgJGlvbmljQ29uZmlnUHJvdmlkZXIpIHtcclxuXHJcblx0XHQgICRzdGF0ZVByb3ZpZGVyXHJcblx0XHQgICAgICAuc3RhdGUoJ2xvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9sb2dpbi5odG1sXCIsXHJcblx0XHQgICAgICAgIGNvbnRyb2xsZXI6IFwiTG9naW5DdHJsXCJcclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvbWVudVwiLFxyXG5cdFx0ICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcclxuXHRcdCAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21lbnUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICBjb250cm9sbGVyOiAnTWVudUN0cmwnXHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuaG9tZScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9ob21lXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2hvbWUuaHRtbFwiLFxyXG5cdFx0ICAgICAgICAgICAgY29udHJvbGxlcjogJ0hvbWVUYWJDdHJsJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5tYW5hZ2VfYWNjb3VudHMnLCB7XHJcblx0XHQgICAgICBcdHVybDogXCIvbWFuYWdlX2FjY291bnRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2hvbWUtdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL21hbmFnZV9hY2NvdW50cy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnTWFuYWdlQWNjb3VudHMnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLnB1Ymxpc2hpbmcnLCB7XHJcblx0XHQgICAgICAgIHVybDogXCIvcHVibGlzaGluZ1wiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdwdWJsaXNoaW5nLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9wdWJsaXNoLmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQdWJsaXNoaW5nJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5wb3N0X3NldHRpbmdzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3Bvc3Rfc2V0dGluZ3NcIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAncHVibGlzaGluZy10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvcG9zdF9zZXR0aW5ncy5odG1sXCIsXHJcblx0XHQgICAgICAgICAgICBjb250cm9sbGVyOiAnUG9zdFNldHRpbmdzJ1xyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pbmJveCcsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9pbmJveFwiLFxyXG5cdFx0ICAgICAgICB2aWV3czoge1xyXG5cdFx0ICAgICAgICAgICdpbmJveC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaW5ib3guaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCd0YWJzLmZlZWRzJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2ZlZWRzXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2ZlZWRzLXRhYic6IHtcclxuXHRcdCAgICAgICAgICAgIHRlbXBsYXRlVXJsOiBcInRlbXBsYXRlcy9mZWVkcy5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICBcclxuXHRcdCAgICAgIC5zdGF0ZSgndGFicy5pdGVtJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2l0ZW1cIixcclxuXHRcdCAgICAgICAgdmlld3M6IHtcclxuXHRcdCAgICAgICAgICAnbGlzdC10YWInOiB7XHJcblx0XHQgICAgICAgICAgICB0ZW1wbGF0ZVVybDogXCJ0ZW1wbGF0ZXMvaXRlbS5odG1sXCJcclxuXHRcdCAgICAgICAgICB9XHJcblx0XHQgICAgICAgIH1cclxuXHRcdCAgICAgIH0pXHJcblx0XHQgICAgICAuc3RhdGUoJ3RhYnMuZm9ybScsIHtcclxuXHRcdCAgICAgICAgdXJsOiBcIi9mb3JtXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ2Zvcm0tdGFiJzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Zvcm0uaHRtbFwiXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmtleWJvYXJkJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2tleWJvYXJkXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2tleWJvYXJkLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSlcclxuXHRcdCAgICAgIC8qLnN0YXRlKCdtZW51LmxvZ2luJywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2xvZ2luXCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2xvZ2luLmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSkqL1xyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LnNsaWRlYm94Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL3NsaWRlYm94XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL3NsaWRlYm94Lmh0bWxcIixcclxuXHRcdCAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTbGlkZWJveEN0cmwnXHJcblx0XHQgICAgICAgICAgfVxyXG5cdFx0ICAgICAgICB9XHJcblx0XHQgICAgICB9KVxyXG5cdFx0ICAgICAgLnN0YXRlKCdtZW51LmFib3V0Jywge1xyXG5cdFx0ICAgICAgICB1cmw6IFwiL2Fib3V0XCIsXHJcblx0XHQgICAgICAgIHZpZXdzOiB7XHJcblx0XHQgICAgICAgICAgJ21lbnVDb250ZW50Jzoge1xyXG5cdFx0ICAgICAgICAgICAgdGVtcGxhdGVVcmw6IFwidGVtcGxhdGVzL2Fib3V0Lmh0bWxcIlxyXG5cdFx0ICAgICAgICAgIH1cclxuXHRcdCAgICAgICAgfVxyXG5cdFx0ICAgICAgfSk7XHJcblxyXG5cdFx0ICAgIC8vJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcIm1lbnUvdGFiL2J1dHRvbnNcIik7XHJcblx0XHQgICAgLyppZiggJGxvY2FsU3RvcmFnZS51c2VyX2RhdGEgKVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCIvaG9tZVwiKTtcclxuXHRcdCAgICB9XHJcblx0XHQgICAgZWxzZVxyXG5cdFx0ICAgIHtcclxuXHRcdCAgICBcdCR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCJsb2dpblwiKTtcclxuXHRcdCAgICB9Ki9cclxuXHRcdCAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwibG9naW5cIik7XHJcblxyXG5cclxuXHRcdCAgICAkaW9uaWNDb25maWdQcm92aWRlci50YWJzLnBvc2l0aW9uKFwiYm90dG9tXCIpOyAvL1BsYWNlcyB0aGVtIGF0IHRoZSBib3R0b20gZm9yIGFsbCBPU1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLm5hdkJhci5hbGlnblRpdGxlKFwiY2VudGVyXCIpO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnRhYnMuc3R5bGUoXCJzdGFuZGFyZFwiKTtcclxuXHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MubWF4Q2FjaGUoMCk7XHJcblx0XHQgICAgJGlvbmljQ29uZmlnUHJvdmlkZXIudmlld3MudHJhbnNpdGlvbignbm9uZScpO1xyXG5cdFx0ICAgICRpb25pY0NvbmZpZ1Byb3ZpZGVyLnZpZXdzLmZvcndhcmRDYWNoZSh0cnVlKTtcclxuXHRcdCAgICBcclxuXHRcdCAgICAkc3RhdGVQcm92aWRlclJlZiA9ICRzdGF0ZVByb3ZpZGVyO1xyXG4gICAgICBcdFx0JHVybFJvdXRlclByb3ZpZGVyUmVmID0gJHVybFJvdXRlclByb3ZpZGVyO1xyXG5cdFx0fVxyXG5dOyIsIi8qXHJcblx0QWNjb3VudCBNYW5hZ2VyIFNlcnZpY2VzXHJcbiovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuc2VydmljZXMuYWNjb3VudE1hbmFnZXInLCBbXSlcclxuXHJcblx0XHQuZmFjdG9yeSgnYWNjb3VudE1hbmFnZXInLCByZXF1aXJlKCcuL2FwcC9hY2NvdW50L2FjY291bnQtbWFuYWdlcicpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdBY2NvdW50JywgcmVxdWlyZSgnLi9hcHAvYWNjb3VudC9hY2NvdW50JykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdQcm9maWxlJywgcmVxdWlyZSgnLi9hcHAvYWNjb3VudC9wcm9maWxlJykpOyIsIi8qXHJcblx0U29jaWFsIE1hbmFnZXIgU2VydmljZXNcclxuKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ2VjbGluY2hlci5zZXJ2aWNlcy5zb2NpYWxNYW5hZ2VyJywgW10pXHJcblxyXG5cdFx0LmZhY3RvcnkoJ3NvY2lhbE1hbmFnZXInLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwtbWFuYWdlcicpKVxyXG5cclxuXHRcdC5mYWN0b3J5KCdGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2ZlZWQnKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0ZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL0ZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdUaW1lbGluZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3RpbWVsaW5lRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvbGlua2VkaW5GZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnRHJvcGRvd25GZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9kcm9wZG93bkZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvbGlua2VkaW5GZWVkSXRlbScpKSBcclxuXHJcblx0XHQuZmFjdG9yeSgnSW5zdGFncmFtRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvaW5zdGFncmFtRmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnQ29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9jb2xsYXBzaWJsZUZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluQ29sbGFwc2libGVGZWVkSXRlbScsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkNvbGxhcHNpYmxlRmVlZEl0ZW0nKSkgXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3R3aXR0ZXJDb2xsYXBzaWJsZUZlZWRJdGVtJykpIFxyXG5cclxuXHRcdC5mYWN0b3J5KCdGYWNlYm9va0ZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZmFjZWJvb2tGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0xpbmtlZGluRmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9saW5rZWRpbkZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnVHdpdHRlckZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvdHdpdHRlckZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnQmxvZ2dlckZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvYmxvZ2dlckZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnR29vZ2xlUGx1c0ZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZ29vZ2xlcGx1c0ZlZWQnKSlcclxuXHJcblx0XHQuZmFjdG9yeSgnUGludGVyZXN0RmVlZCcsIHJlcXVpcmUoJy4vYXBwL3NvY2lhbC9waW50ZXJlc3RGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ1lvdVR1YmVGZWVkJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL3lvdVR1YmVGZWVkJykpXHJcblxyXG5cdFx0LmZhY3RvcnkoJ0luc3RhZ3JhbUZlZWQnLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvaW5zdGFncmFtRmVlZCcpKVxyXG5cclxuXHRcdC5kaXJlY3RpdmUoJ2ZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2RpcmVjdGl2ZXMvZmVlZEl0ZW0nKSlcclxuXHJcblx0XHQuZGlyZWN0aXZlKCd0aW1lbGluZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2RpcmVjdGl2ZXMvdGltZWxpbmVGZWVkSXRlbScpKVxyXG5cclxuXHRcdC5kaXJlY3RpdmUoJ2xpbmtlZGluRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy9saW5rZWRpbkZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmRpcmVjdGl2ZSgnaW5zdGFncmFtRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy9pbnN0YWdyYW1GZWVkSXRlbScpKVxyXG5cclxuXHRcdC5kaXJlY3RpdmUoJ2NvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy9jb2xsYXBzaWJsZUZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmRpcmVjdGl2ZSgnbGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtJywgcmVxdWlyZSgnLi9hcHAvc29jaWFsL2RpcmVjdGl2ZXMvbGlua2VkaW5Db2xsYXBzaWJsZUZlZWRJdGVtJykpXHJcblxyXG5cdFx0LmRpcmVjdGl2ZSgndHdpdHRlckNvbGxhcHNpYmxlRmVlZEl0ZW0nLCByZXF1aXJlKCcuL2FwcC9zb2NpYWwvZGlyZWN0aXZlcy90d2l0dGVyQ29sbGFwc2libGVGZWVkSXRlbScpKTsiLCJtb2R1bGUuZXhwb3J0cyA9IGFuZ3VsYXIubW9kdWxlKCdlY2xpbmNoZXIuc2VydmljZXMnLCBbXSlcclxuXHJcbi5mYWN0b3J5KCdFQycsIHJlcXVpcmUoJy4vYXBwL2VjLXV0aWxpdHknKSlcclxuXHJcbi8vc2VydmljZSBmb3IgYXV0aGVudGljYXRpb25cclxuLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24oJHEsICRodHRwLCBhcGlVcmwsIEVDKSB7XHJcblxyXG4gICAgdmFyIGlzQXV0aGVudGljYXRlZCA9IHRydWU7XHJcbiAgICB2YXIgTE9DQUxfVE9LRU5fS0VZID0gJ3VzZXJfY3JlZGVudGlhbHMnO1xyXG5cclxuXHJcbiAgICBmdW5jdGlvbiBsb2FkVXNlckNyZWRlbnRpYWxzKCkge1xyXG4gICAgICAgIHZhciB1YyA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTF9UT0tFTl9LRVkpO1xyXG4gICAgICAgIGlmICh1Yykge1xyXG4gICAgICAgICAgICB1c2VDcmVkZW50aWFscyh1Yyk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcmVVc2VyQ3JlZGVudGlhbHModWMpIHtcclxuICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxfVE9LRU5fS0VZLCB1Yyk7XHJcbiAgICAgICAgdXNlQ3JlZGVudGlhbHModWMpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVzZUNyZWRlbnRpYWxzKHVjKSB7XHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcclxuICAgICAgICBjb25zb2xlLmxvZyh1Yyk7XHJcblxyXG5cclxuICAgICAgICAvLyBTZXQgdGhlIHVjIGFzIGhlYWRlciBmb3IgeW91ciByZXF1ZXN0cyFcclxuICAgICAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51aWQgPSB1Yy51aWQ7XHJcbiAgICAgICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb24uYXV0aG9yaXphdGlvblRva2VuID0gdWMuYXV0aG9yaXphdGlvblRva2VuO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlc3Ryb3lVc2VyQ3JlZGVudGlhbHMoKSB7XHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgLy8kaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi51aWQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgLy8kaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vbi5hdXRob3JpemF0aW9uVG9rZW4gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgd2luZG93LmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKExPQ0FMX1RPS0VOX0tFWSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGxvZ2luID0gZnVuY3Rpb24obmFtZSwgcGFzc3dvcmQsIGNhbGxiYWNrKSB7XHJcblxyXG4gICAgICAgIHZhciByZXEgPSB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxyXG4gICAgICAgICAgICB1cmw6IGFwaVVybCArICd1c2VyL2xvZ2luJyxcclxuICAgICAgICAgICAgZGF0YTp7XHJcbiAgICAgICAgICAgICAgICAgICAgJ2VtYWlsJzogbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAncGFzc3dvcmQnOiBwYXNzd29yZFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICBFQy5yZXF1ZXN0KHJlcSkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjaygnMjIyMicpO1xyXG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnWVlZWVlZWVlZJyk7XHJcbiAgICAgICAgICAgICAgICAvLyRpb25pY0xvYWRpbmcuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgLy8kaW9uaWNIaXN0b3J5LmN1cnJlbnRWaWV3KCRpb25pY0hpc3RvcnkuYmFja1ZpZXcoKSk7Ly8kaW9uaWNIaXN0b3J5LmN1cnJlbnRWaWV3KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgLy8kc3RhdGUuZ28oJ2FwcC5zYWZldHlMZXNzb25zJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVycl9tc2cpIHtcclxuICAgICAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ1paWlpaWlpaWicpO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soJzMzMzMnKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbG9nb3V0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgZGVzdHJveVVzZXJDcmVkZW50aWFscygpO1xyXG4gICAgfTtcclxuXHJcbiAgICBsb2FkVXNlckNyZWRlbnRpYWxzKCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBsb2dpbjogbG9naW4sXHJcbiAgICAgICAgbG9nb3V0OiBsb2dvdXQsXHJcbiAgICAgICAgaXNBdXRoZW50aWNhdGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGlzQXV0aGVudGljYXRlZDtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxufSlcclxuXHJcbi5mYWN0b3J5KCdVc2VyU2V0dGluZ3MnLCByZXF1aXJlKCcuL2FwcC9zZXR0aW5ncy1tYW5hZ2VyJykpIFxyXG4gXHJcbiBcclxuXHJcbi5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHtcclxuICAgICAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZFxyXG4gICAgICAgICAgICB9W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0pXHJcblxyXG4uY29uZmlnKGZ1bmN0aW9uKCRodHRwUHJvdmlkZXIpIHtcclxuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ0F1dGhJbnRlcmNlcHRvcicpO1xyXG59KTtcclxuIl19
