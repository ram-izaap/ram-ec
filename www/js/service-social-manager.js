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

		.factory('InboxFeed', require('./app/social/inboxFeed'))

		.directive('feedItem', require('./app/social/directives/feedItem'))

		.directive('timelineFeedItem', require('./app/social/directives/timelineFeedItem'))

		.directive('linkedinFeedItem', require('./app/social/directives/linkedinFeedItem'))

		.directive('instagramFeedItem', require('./app/social/directives/instagramFeedItem'))

		.directive('collapsibleFeedItem', require('./app/social/directives/collapsibleFeedItem'))

		.directive('linkedinCollapsibleFeedItem', require('./app/social/directives/linkedinCollapsibleFeedItem'))

		.directive('twitterCollapsibleFeedItem', require('./app/social/directives/twitterCollapsibleFeedItem'));