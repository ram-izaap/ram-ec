
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


