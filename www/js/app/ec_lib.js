var EClib = function ( $q, $http, apiUrl, $localStorage, $ionicLoading )
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

            $ionicLoading.show();

            if( request.method == 'GET' )
            {
                request.params = request.data;
            }
            
            $http( request )
                .then(function(response) 
                    {
                      $ionicLoading.hide();
                      
                      var user_data = response.data;
                      console.log( response );
                      console.log( response.headers('ec_data') );
                      $localStorage.user_data = response.headers('ec_data');
                      

                      resolve(response.data);

                      
                    },
                    function() 
                    {
                      $ionicLoading.hide();
                      reject( 'There is some connectivity issue .Please try again later.' );
                    }
                );


        });
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

	return this;
};

