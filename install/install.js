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
		//We use alt="". If the image is not available, it's not really
		//missing. On limited connections it is omitted on purpose, so
		//omitting it on other occassions, too, is acceptable.
		return '<img' + cls + ' src="' + data.id + '/install/' + url +
			'" alt="" itemprop="screenshot">';
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

function getRestrictions (data) {
	var lang = _('langcode'),
		restrictions = data.restrictions,
		msg = '', key = 'restrictions';
	if (restrictions) {
		msg = (restrictions[lang] || restrictions.en) + ' ';
		key += '-yes';
	} else {
		key += '-no';
	}
	if (data.serviceworker) {
		if (navigator.serviceWorker) {
			key += '-sw';
		} else {
			key += '-swunsupported';
		}
	} else {
		key += '-nosw';
	}
	return msg + _(key);
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
				updateInstallButton(button, STATUS_NO_INSTALL, url);
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

function makeTitle (element, title) {
	var sep = title.indexOf(' – ');
	if (sep === -1) {
		element.textContent = title;
		element.setAttribute('itemprop', 'name');
		element.setAttribute('class', 'main');
	} else {
		element.innerHTML = '<span itemprop="name" class="main">' + escapeHtml(title.slice(0, sep)) + '</span>' +
			escapeHtml(title.slice(sep));
	}
}

function escapeHtml (str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function limitedConnection () {
	return navigator && navigator.connection && navigator.connection.type === 'cellular';
}

function showError (id) {
	document.getElementById('error-head').innerHTML = _('error-head');
	document.getElementById('error-body').innerHTML = '<p>' + (id ?
		_('error-body', {id: escapeHtml(id)}) :
		_('error-body-no-id')
	) + '</p>';
}

function showInstall (data) {
	var element, button, title, screenshots, url;
	element = document.getElementsByTagName('body')[0];
	element.setAttribute('itemscope', '');
	element.setAttribute('itemtype', 'http://schema.org/WebApplication');

	title = getTitle(data);
	document.getElementById('title1').textContent = title;
	makeTitle(document.getElementById('title2'), title);

	element = document.getElementById('icon');
	element.src = getIcon(data);
	element.setAttribute('itemprop', 'image');

	element = document.getElementById('gallery-container');
	screenshots = getScreenshots(data);
	if (limitedConnection()) {
		element.dataset.html = screenshots;
		element.innerHTML = '<button id="show-screenshots">' + _('show-screenshots') + '</button>';
		document.getElementById('show-screenshots').addEventListener('click', showScreenshots);
	} else {
		element.innerHTML = screenshots;
	}

	element = document.getElementById('desc-container');
	element.innerHTML = getDescription(data);
	element.setAttribute('itemprop', 'description');

	document.getElementById('inst-1').textContent += ' ' + getRestrictions(data);

	element = document.getElementById('online-button');
	element.href = getOnlineUrl(data);
	element.setAttribute('itemprop', 'url');

	element = document.getElementById('code-url');
	element.href = getCodeUrl(data);
	element.setAttribute('itemprop', 'downloadUrl');

	button = document.getElementById('install-button');
	url = getManifestUrl(data);
	checkInstallStatus(url, function (result) {
		updateInstallButton(button, result, url);
	});
	document.getElementById('section-error').hidden = true;
	document.getElementById('section-install').hidden = false;
}

function showScreenshots () {
	var container = document.getElementById('gallery-container');
	container.innerHTML = container.dataset.html;
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
