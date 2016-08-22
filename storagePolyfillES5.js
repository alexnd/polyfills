// part of https://github.com/alexnd/polyfills
// implements missing webstorage features in window.localStorage, window.sessionStorage (iOS Safary private mode issue)
// Refer to https://gist.github.com/remy/350433

var storagePolyfill = {
	verbose: false,
	inMemory: false,
	applied: false,
	init: function() {
		var params = arguments.length ? arguments[0] : {};
		for(var k in params) {
			if(params.hasOwnProperty(k)) storagePolyfill[k] = params[k];
		}
		try {
			if (storagePolyfill.verbose) console.log('#storagePolyfill.try');
			// Test webstorage existence.
			if (!window.localStorage || !window.sessionStorage) throw "exception";
			// Test webstorage accessibility - Needed for Safari private browsing.
			localStorage.setItem('storagePolyfill_test', 1);
			localStorage.removeItem('storagePolyfill_test');
		} catch(e) {
			if (storagePolyfill.verbose) console.log('#storagePolyfill.catch');
			(function () {
				var MemoryStorage = function () {
					this._data = {};
					this.length = 0;
				};
				MemoryStorage.prototype.setItem = function(key, value) {
					if(this._data[key]===undefined) this.length++;
					this._data[key] = String(value);
					return this._data[key];
				};
				MemoryStorage.prototype.getItem = function(key) {
					return this._data.hasOwnProperty(key) ? this._data[key] : undefined;
				};
				MemoryStorage.prototype.removeItem = function(key) {
					if(this._data[key]!==undefined && this.length) this.length--;
					return delete this._data[key];
				};
				MemoryStorage.prototype.clear = function() {
					this._data = {};
					this.length = 0;
					return this._data;
				};
				MemoryStorage.prototype.key = function (i) {
					// not perfect, but works
					var ctr = 0;
					for (var k in this._data) {
						if(!this._data.hasOwnProperty(k)) continue;
						if (ctr == i) return k;
						else ctr++;
					}
					return null;
				};

				var Storage = function (type) {
					function createCookie(name, value, days) {
						var date, expires;
						if (days) {
							date = new Date();
							date.setTime(date.getTime()+(days*24*60*60*1000));
							expires = "; expires="+date.toGMTString();
						} else {
							expires = "";
						}
						document.cookie = name+"="+value+expires+"; path=/";
					}

					function readCookie(name) {
						var nameEQ = name + "=",
							ca = document.cookie.split(';'),
							i, c;
						for (i=0; i < ca.length; i++) {
							c = ca[i];
							while (c.charAt(0)==' ') {
								c = c.substring(1,c.length); 2480
							}
							if (c.indexOf(nameEQ) == 0) {
								return c.substring(nameEQ.length,c.length);
							}
						}
						return null;
					}

					function setData(data) {
						// Convert data into JSON and encode to accommodate for special characters.
						data = encodeURIComponent(JSON.stringify(data));
						// Create cookie.
						if (type == 'session') {
							createCookie(getSessionName(), data, 365);
						} else {
							createCookie('localStorage', data, 365);
						}
					}

					function clearData() {
						if (type == 'session') {
							createCookie(getSessionName(), '', 365);
						} else {
							createCookie('localStorage', '', 365);
						}
					}

					function getData() {
						// Get cookie data.
						var data = type == 'session' ? readCookie(getSessionName()) : readCookie('localStorage');
						// If we have some data decode, parse and return it.
						return data ? JSON.parse(decodeURIComponent(data)) : {};
					}

					function getSessionName() {
						// If there is no name for this window, set one.
						// To ensure it's unquie use the current timestamp.
						if(!window.name) {
							window.name = new Date().getTime();
						}
						return 'sessionStorage' + window.name;
					}

					// Initialise if there's already data.
					var data = getData();

					return {
						length: 0,
						clear: function () {
							data = {};
							this.length = 0;
							clearData();
						},
						getItem: function (key) {
							return data[key] === undefined ? null : data[key];
						},
						key: function (i) {
							// not perfect, but works
							var ctr = 0;
							for (var k in data) {
								if(!data.hasOwnProperty(k)) continue;
								if (ctr == i) return k;
								else ctr++;
							}
							return null;
						},
						removeItem: function (key) {
							delete data[key];
							this.length--;
							setData(data);
						},
						setItem: function (key, value) {
							data[key] = value+''; // forces the value to a string
							this.length++;
							setData(data);
						}
					};
				};

				// Replace window.localStorage and window.sessionStorage with our custom implementation.
				var localStorage, sessionStorage;
				if (storagePolyfill.inMemory) {
					if (storagePolyfill.verbose) console.log('#storagePolyfill.apply MemoryStorage');
					localStorage = new MemoryStorage();
					sessionStorage = new MemoryStorage();
				} else {
					if (storagePolyfill.verbose) console.log('#storagePolyfill.apply Storage');
					localStorage = new Storage('local');
					sessionStorage = new Storage('session');
				}
				try {
					window.localStorage = localStorage;
					window.sessionStorage = sessionStorage;
					// For Safari private browsing need to also set the proto value.
					window.localStorage.__proto__ = localStorage;
					window.sessionStorage.__proto__ = sessionStorage;
					storagePolyfill.applied = true;
					if (storagePolyfill.verbose) console.log('#storagePolyfill.applied');
				} catch (e) {
					if (storagePolyfill.verbose) console.error('#storagePolyfill.error', e);
				}
			})();
		}
	}
};
storagePolyfill.init();