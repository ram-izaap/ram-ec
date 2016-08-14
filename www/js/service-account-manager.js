/*
	Account Manager Services
*/

module.exports = angular.module('eclincher.services.accountManager', [])

		.factory('accountManager', require('./app/account/account-manager'))

		.factory('Account', require('./app/account/account')) 

		.factory('Profile', require('./app/account/profile'));