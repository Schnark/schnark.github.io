/*global caches*/
(function () {
"use strict";

var OLD_SW_CACHES = [
	'docviewer',
	'rss',
	'stundenbuch',
	'timezone-converter',
	'world-map-skiller'
];

function getOldSWCaches () {
	return caches.keys().then(function (keys) {
		return keys.filter(function (key) {
			if (/^v\d+\.\d+$/.test(key)) {
				return true;
			}
			key = key.split(':');
			if (key.length !== 2 || !(/^\d+\.\d+$/.test(key[1]))) {
				return false;
			}
			key = key[0];
			return OLD_SW_CACHES.indexOf(key) > -1;
		});
	});
}

function removeOldSWCaches () {
	getOldSWCaches().then(function (keys) {
		keys.forEach(function (key) {
			caches.delete(key);
		});
	});
}

if (window.caches) {
	removeOldSWCaches();
}
})();