/*global _ */
(function () {
"use strict";

var STATUS_NO_INSTALL = 0,
	STATUS_IS_INSTALLED = 1,
	STATUS_CAN_INSTALL = 2;

function loadData (id, callback) {
	if (!(/^[a-z0-9\-]+$/i.test(id))) {
		callback();
		return;
	}

	var xhr = new XMLHttpRequest();
	xhr.open('GET', './' + id + '/install/install.json', true);
	if (xhr.overrideMimeType) {
		xhr.overrideMimeType('application/json');
	}
	xhr.onreadystatechange = function () {
		var response;
		if (xhr.readyState === 4) {
			if (xhr.status === 200 || xhr.status === 0) {
				response = xhr.response;
				if (typeof response === 'string') {
					try {
						response = JSON.parse(response);
					} catch (e) {
						response = null;
					}
				}
				callback(response);
			} else {
				callback();
			}
		}
	};
	xhr.onerror = function () {
		callback();
	};
	xhr.ontimeout = function () {
		callback();
	};

	try {
		xhr.send(null);
	} catch (e) {
		callback();
	}
}

function checkInstallStatus (url, callback) {
	var request;
	if (!navigator.mozApps || !navigator.mozApps.installPackage) {
		callback(STATUS_NO_INSTALL);
		return;
	}
	if (navigator.mozApps.checkInstalled) {
		request = navigator.mozApps.checkInstalled(url);
		request.onerror = function () {
			callback(STATUS_NO_INSTALL);
		};
		request.onsuccess = function () {
			if (request.result) {
				callback(STATUS_IS_INSTALLED);
			}
		};
	}
	callback(STATUS_CAN_INSTALL);
}

function getTitle (data) {
	var lang = _('langcode');
	return data.title[lang] || data.title.en;
}

function getIcon (id, data) {
	return id + '/' + data.icon;
}

function getScreenshots (id, data) {
	return data.screenshots.map(function (url) {
		return '<img src="' + id + '/install/' + url + '">';
	}).join('');
}

function getDescription (data) {
	var lang = _('langcode');
	return (data.desc[lang] || data.desc.en).map(function (desc) {
		return '<p>' + desc + '</p>';
	}).join('');
}

function getHasServiceWorker (data) {
	return data.serviceworker;
}

function getOnlineUrl (id) {
	return id + '/index.html';
}

function getCodeUrl (id) {
	return 'https://github.com/Schnark/' + id;
}

function getManifestUrl (id) {
	return 'https://schnark.github.io/' + id  + '/github.manifest.webapp';
}

function updateInstallButton (button, status, url) {
	if (status === STATUS_CAN_INSTALL) {
		button.onclick = function () {
			var request = navigator.mozApps.installPackage(url);
			request.onsuccess = function () {
				updateInstallButton(button, STATUS_IS_INSTALLED, url);
			};
		};
		return;
	}
	button.disabled = true;
	button.innerHTML = status === STATUS_NO_INSTALL ?
		_('no-install') :
		_('already-installed') + '&nbsp;<span style="color: green;">✔</span>';
	button.onclick = undefined;
}

function showError (id) {
	document.getElementById('error-head').innerHTML = _('error-head');
	document.getElementById('error-body').innerHTML = '<p>' + (id ?
		_('error-body', {id: id.replace(/</g, '&lt;')}) :
		_('error-body-no-id')
	) + '</p>';
}

function showInstall (id, data) {
	var button, title, url;
	title = getTitle(data);
	document.getElementById('title1').textContent = title;
	document.getElementById('title2').innerHTML = title;
	document.getElementById('icon').src = getIcon(id, data);
	document.getElementById('gallery-container').innerHTML = getScreenshots(id, data);
	document.getElementById('desc-container').innerHTML = getDescription(data);
	if (getHasServiceWorker(data)) {
		document.getElementById('inst-1').textContent += ' ' + _('inst-1-sw');
	}
	document.getElementById('online-button').href = getOnlineUrl(id);
	document.getElementById('code-url').href = getCodeUrl(id);

	button = document.getElementById('install-button');
	url = getManifestUrl(id);
	checkInstallStatus(url, function (result) {
		updateInstallButton(button, result, url);
	});
	document.getElementById('section-error').hidden = true;
	document.getElementById('section-install').hidden = false;
}

function init () {
	var search = (location.search || '?'), id = '';
	if (search.indexOf('?id=') === 0) {
		id = search.slice(4);
	}
	loadData(id, function (data) {
		window.addEventListener('localized', function () {
			document.documentElement.lang = document.webL10n.getLanguage();
			document.documentElement.dir = document.webL10n.getDirection();
			if (!data) {
				showError(id);
			} else {
				showInstall(id, data);
			}
		}, false);
	});
}

init();

})();
