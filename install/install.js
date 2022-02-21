/*global unescape*/
(function () {
"use strict";

var base = 'https://schnark.github.io/';

/*
var fakeMozApps = {
	checkInstalled: function (manifest) {
		var isCorrectUrl = /^https?:\/\/.*\.webapp$/.test(manifest),
			installed = {
				'https://schnark.github.io/partial-firefox-marketplace-backup/backup/webserver.webapp': true
			};
		return fakeMozApps._makeRequest(function () {
			return [isCorrectUrl, manifest in installed];
		});
	},
	install: function (manifest) {
		var isCorrectUrl = /^https?:\/\/.*\.webapp$/.test(manifest);
		return fakeMozApps._makeRequest(function () {
			return [isCorrectUrl];
		});
	},
	installPackage: function (manifest) {
		var isCorrectUrl =
			/^https:\/\/schnark.github.io\/partial-firefox-marketplace-backup\/backup\/.*\.webapp$/.test(manifest);
		return fakeMozApps._makeRequest(function () {
			return [isCorrectUrl];
		});
	},
	_makeRequest: function (async, time) {
		var request = {};
		setTimeout(function () {
			var result = async();
			request.result = result[1];
			if (result[0]) {
				if (request.onsuccess) {
					request.onsuccess();
				}
			} else {
				if (request.onerror) {
					request.onerror();
				}
			}
		}, time || 1000);
		return request;
	}
}

navigator.mozApps = fakeMozApps;
*/

function makeAbsolute (url) {
	if (url.indexOf('/') === -1) {
		url = base + 'partial-firefox-marketplace-backup/backup/' + url;
	}
	return url;
}

/*keep this in sync with the simulator code*/
function uToA (u) {
	return btoa(
		unescape(encodeURIComponent(u.replace(/\0+$/, '')))
	).replace(/\s+/g, '')
	.replace(/\+/g, '-').replace(/\//g, '_')
	.replace(/\=+/g, '');
}

function makeSimulatorId (url) {
	return 'url@' + uToA(url);
}

function checkInstalled (manifest, callback) {
	var request;
	if (manifest.slice(0, base.length) === base) {
		request = navigator.mozApps.checkInstalled(manifest);
		request.onsuccess = function () {
			callback(request.result);
		};
	} else {
		callback();
	}
}

function updateButtons () {
	var buttons, i, mozApps, serviceWorker;
	mozApps = navigator.mozApps && navigator.mozApps.checkInstalled;
	serviceWorker = !mozApps && navigator.serviceWorker;
	if (!mozApps && !serviceWorker) {
		return;
	}
	buttons = document.getElementsByTagName('button');
	for (i = 0; i < buttons.length; i++) {
		if (buttons[i].dataset.manifest) {
			if (mozApps) {
				updateButton(buttons[i]);
			} else if (/*serviceWorker && */!buttons[i].dataset.web) {
				updateButtonSimulator(buttons[i]);
			}
		}
	}
}

function updateButton (button) {
	var method = button.dataset.web ? 'install' : 'installPackage',
		manifest = makeAbsolute(button.dataset.manifest);
	if (!navigator.mozApps[method]) {
		return;
	}
	checkInstalled(manifest, function (installed) {
		var request;
		if (installed) {
			button.innerHTML = 'Already installed!&nbsp;<span style="color: green;">✔</span>';
		} else {
			button.addEventListener('click', function () {
				button.disabled = true;
				button.innerHTML = 'Installing …';
				request = navigator.mozApps[method](manifest);
				request.onerror = function () {
					button.innerHTML = 'An error occured';
				};
				request.onsuccess = function () {
					button.innerHTML = 'Successfully installed!&nbsp;<span style="color: green;">✔</span>';
				};
			});
			button.innerHTML = 'Install';
			button.disabled = false;
		}
	});
}

function updateButtonSimulator (button) {
	var manifest = makeAbsolute(button.dataset.manifest), id = makeSimulatorId(manifest);
	button.addEventListener('click', function () {
		location.href = base + 'ffos-simulator/index.html?mode=app&app=' + id;
	});
	button.innerHTML = 'Run in FFOS simulator';
	button.disabled = false;
}

updateButtons();
if (location.search === '?debug') {
	document.getElementsByTagName('body')[0].className = 'debug';
}

})();