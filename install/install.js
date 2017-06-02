/*global _ */
(function () {
"use strict";

var STATUS_NO_INSTALL = 0,
	STATUS_IS_INSTALLED = 1,
	STATUS_CAN_INSTALL = 2,
	STATUS_IS_INSTALLING = 3;

function loadData (id, callback) {
	if (!(/^[a-z0-9\-]+$/i.test(id))) {
		callback();
		return;
	}

	var xhr = new XMLHttpRequest();
	xhr.open('GET', id + '/install/install.json');
	xhr.responseType = 'json';
	xhr.onload = function () {
		var response = xhr.response;
		if (typeof response === 'string') {
		//just in case the browser doesn't understand responseType = 'json'
			try {
				response = JSON.parse(response);
			} catch (e) {
				response = null;
			}
		}
		callback(response);
	};
	xhr.onerror = function () {
		callback();
	};

	xhr.send();
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

function getIcon (data) {
	return data.id + '/' + data.icon;
}

function getScreenshots (data) {
	return data.screenshots.map(function (url) {
		var index = url.indexOf('#landscape'), cls = '';
		if (index > -1) {
			url = url.slice(0, index);
			cls = ' class="landscape"';
		}
		return '<img' + cls + ' src="' + data.id + '/install/' + url + '" itemprop="screenshot">';
	}).join('');
}

function getDescription (data) {
	var lang = _('langcode'), desc;
	desc = data.desc[lang] || data.desc.en;
	if (Array.isArray(desc)) {
		desc = desc.map(function (d) {
			return '<p>' + d + '</p>';
		}).join('');
	}
	return desc;
}

function getHasServiceWorker (data) {
	return data.serviceworker;
}

function getOnlineUrl (data) {
	return data.id + '/index.html';
}

function getCodeUrl (data) {
	return 'https://github.com/Schnark/' + data.id;
}

function getManifestUrl (data) {
	return 'https://schnark.github.io/' + data.id  + '/github.manifest.webapp';
}

function updateInstallButton (button, status, url) {
	var label;
	if (status === STATUS_CAN_INSTALL) {
		button.onclick = function () {
			var request = navigator.mozApps.installPackage(url);
			request.onsuccess = function () {
				updateInstallButton(button, STATUS_IS_INSTALLED, url);
			};
			request.onerror = function () {
				updateInstallButton(button, STATUS_CAN_INSTALL, url);
			};
			updateInstallButton(button, STATUS_IS_INSTALLING, url);
		};
		return;
	}
	button.disabled = true;
	button.onclick = undefined;
	switch (status) {
	case STATUS_IS_INSTALLED:
		label = _('already-installed') + '&nbsp;<span style="color: green;">✔</span>';
		break;
	case STATUS_IS_INSTALLING:
		label = _('is-installing');
		break;
	default:
		label = _('no-install');
	}
	button.innerHTML = label;
}

function escapeHtml (str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function addToList (list, value) {
	if (list.add) {
		list.add(value);
	}
}

function showError (id) {
	document.getElementById('error-head').innerHTML = _('error-head');
	document.getElementById('error-body').innerHTML = '<p>' + (id ?
		_('error-body', {id: escapeHtml(id)}) :
		_('error-body-no-id')
	) + '</p>';
}

function showInstall (data) {
	var element, button, title, url;
	element = document.getElementsByTagName('body')[0];
	element.itemScope = true;
	addToList(element.itemType, 'http://schema.org/WebApplication');

	title = getTitle(data);
	document.getElementById('title1').textContent = title;
	element = document.getElementById('title2');
	element.textContent = title;
	addToList(element.itemProp, 'name');

	element = document.getElementById('icon');
	element.src = getIcon(data);
	addToList(element.itemProp, 'image');

	document.getElementById('gallery-container').innerHTML = getScreenshots(data);

	element = document.getElementById('desc-container');
	element.innerHTML = getDescription(data);
	addToList(element.itemProp, 'description');

	if (getHasServiceWorker(data)) {
		document.getElementById('inst-1').textContent += ' ' + _('inst-1-sw');
	}

	element = document.getElementById('online-button');
	element.href = getOnlineUrl(data);
	addToList(element.itemProp, 'url');

	element = document.getElementById('code-url');
	element.href = getCodeUrl(data);
	addToList(element.itemProp, 'downloadUrl');

	button = document.getElementById('install-button');
	url = getManifestUrl(data);
	checkInstallStatus(url, function (result) {
		updateInstallButton(button, result, url);
	});
	document.getElementById('section-error').hidden = true;
	document.getElementById('section-install').hidden = false;
}

function init () {
	var id = /.*[&?]id=([^&]*)/.exec(location.search || '');
	id = id ? decodeURIComponent(id[1]) : '';
	loadData(id, function (data) {
		if (!data) {
			showError(id);
		} else {
			data.id = id;
			showInstall(data);
		}
	});
}

window.addEventListener('localized', function () {
	document.documentElement.lang = document.webL10n.getLanguage();
	document.documentElement.dir = document.webL10n.getDirection();
	init();
}, false);

})();
