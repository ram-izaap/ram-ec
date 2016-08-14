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