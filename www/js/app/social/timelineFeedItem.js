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






