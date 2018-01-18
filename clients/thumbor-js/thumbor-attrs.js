'use strict';
/**
 * default behaviour:
 * ------------------
 * thumbor attribute tries to take the element size if one was not provided
 * elements won't get loaded twice thanks to thumbor-done attribute
 * 
 * avaliable attributes:
 * ---------------------
 * thumbor="{{ url }}"
 * thumbor-smart
 * thumbor-filter="{{ filter }},{{ filter2 }}" // https://github.com/thumbor/thumbor/wiki/Filters
 * thumbor-resize / thumbor-fit="100px/vw/vh,50px/vw/vh"
 * thumbor-fit="100px" // applies for both
 * thumbor-square="100px/vw/vh" or thumbor-square just to enfore square
 * thumbor-fliph
 * thumbor-flipv
 * thumbor-halign="left\center\right"
 * thumbor-valign="top\middle\bottom"
 * thumbor-format="jpeg\gif\png\webp"
 * 
 * events:
 * -------
 * window.dispatchEvent(new CustomEvent('thumbor-refresh')); // runs only on new elements
 * window.dispatchEvent(new CustomEvent('thumbor-refresh-hard')); // runs on all elements again
 */
(function() {
	var pixelRatio;
	var sizeIncraments = 25;
	var loaderUrl = 'https://s3.us-east-2.amazonaws.com/mixin-images/loader.svg';
	var emptyOptions = baseOptions();

	function baseOptions() {
		return {
			imgUrl: '',
			smartCrop: false,
			filters: [], // quality(80),grayscale() https://github.com/thumbor/thumbor/wiki/Filters
			squareSize: 0, // value (supports px, vh, vw)
			shouldSquare: false,
			resize: null, // width,height (supports px, vh, vw)
			fit: null, // width,height (supports px, vh, vw)
			fliph: false,
			flipv: false,
			halign: '', // 'left', 'center', 'right'
			valign: '', // 'top', 'middle', 'bottom'
			format: '' // 'webp', 'jpeg', 'gif', 'png'
		};
	}

	function init(addEvents) {
		var elements = document.querySelectorAll('[thumbor]');
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			if (!element.hasAttribute('thumbor-done')) {
				addLoader(element);
				var options = readOptions(element, baseOptions());
				var thumborUrl = generateLink(options, element);
				replaceLoaderWithImage(element, thumborUrl);
			}
		}

		if (addEvents) {
			window.addEventListener('thumbor-refresh', function () {
				init(false);
			}, false);
	
			window.addEventListener('thumbor-refresh-hard', function () {
				var elements = document.querySelectorAll('[thumbor]');
				for (var i = 0; i < elements.length; i++) {
					var element = elements[i];
					element.removeAttribute('thumbor-done');
				}
				init(false);
			}, false);
		}
	}

	function addLoader(element) {
		if (element.nodeName == 'IMG') {
			element.src = loaderUrl;
			element.style.objectFit = 'none';
			element.style.objectPosition = 'center';
			element.setAttribute('thumbor-done', '');
		} else {
			element.style.backgroundImage = 'url(' + loaderUrl + ')';
			element.style.backgroundPosition = '50% 50%';
			element.style.backgroundRepeat = 'no-repeat';
			element.setAttribute('thumbor-done', '');
		}
	}

	function replaceLoaderWithImage(element, thumborUrl) {
		if (element.nodeName == 'IMG') {
			var img = new Image();
			img.onload = function () { 
				element.src = thumborUrl;
				element.style.objectFit = '';
				element.style.objectPosition = '';
			};
			img.src = thumborUrl;
		} else {
			var img1 = new Image();
			img1.onload = function () { 
				element.style.backgroundImage = 'url(' + thumborUrl + ')';
				element.style.backgroundPosition = '';
				element.style.backgroundRepeat = '';
			};
			img1.src = thumborUrl;
		}
	}

	function readOptions(element, options) {
		options.imgUrl = element.getAttribute('thumbor');
		if (!options.imgUrl) {
			throw new Error('thumbor must have a url value!! thumbor="http://img.com/img.jpg"');
		}

		options.smartCrop = element.hasAttribute('thumbor-smart');
		
		var filter = element.getAttribute('thumbor-filter');
		if (filter) {
			if (filter.indexOf(',') > -1) {
				var allFilters = filter.split(',');
				for (var i = 0; i < allFilters.length; i++) {
					options.filters.push(allFilters[i].trim());
				}
			} else {
				options.filters.push(filter.trim());
			}
			filter.split(',');
		}

		var square = element.getAttribute('thumbor-square');
		if (square) {
			options.squareSize = normalizeSize(getSizeInPixels(square.trim()));
			options.shouldSquare = true;
		} else if (element.hasAttribute('thumbor-square')) {
			options.shouldSquare = true;
		}

		var resize = element.getAttribute('thumbor-resize');
		if (resize) {
			var values = resize.toString().split(',');
			if (!values || values.length != 2) {
				throw new Error('for resize you must provide width,height in this format');
			}
			options.resize = {
				width: normalizeSize(getSizeInPixels(values[0].trim())),
				height: normalizeSize(getSizeInPixels(values[1].trim()))
			};
		}

		var fit = element.getAttribute('thumbor-fit');
		if (fit) {
			var width, height;
			if (fit.indexOf(',') > -1) {
				var values1 = fit.split(',');
				if (!values1 || values1.length != 2) {
					throw new Error('for fit you must provide width,height in this format');
				}
				width = values1[0].trim();
				height = values1[1].trim();
			} else {
				width = fit.trim();
				height = width;
			}

			options.fit = {
				width: normalizeSize(getSizeInPixels(width)),
				height: normalizeSize(getSizeInPixels(height))
			};
		}

		options.fliph = element.hasAttribute('thumbor-fliph');
		options.flipv = element.hasAttribute('thumbor-flipv');
		
		var halign = element.getAttribute('thumbor-halign');
		if (halign && halign != 'left' && halign != 'center' && halign != 'right') {
			throw new Error('halign must be one of the following values \'left\', \'center\', \'right\'');
		}
		options.halign = halign || options.halign;
		
		var valign = element.getAttribute('thumbor-valign');
		if (valign && valign != 'top' && valign != 'middle' && valign != 'bottom') {
			throw new Error('valign must be one of the following values \'top\', \'middle\', \'bottom\'');
		}
		options.valign = valign || options.valign;
		
		var format = element.getAttribute('thumbor-format');
		if (format && format != 'webp' && format != 'jpeg' && format != 'gif' && format != 'png') {
			throw new Error('format must be one of the following values \'webp\', \'jpeg\', \'gif\', \'png\'');
		}
		options.format = format || options.format;
		return options;
	}
	
	function getSizeInPixels(value) {
		var viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

		if (value.endsWith('px')) {
			return parseInt(value.replace('px', ''));
		} else if (value.endsWith('vh')) {
			return viewHeight * parseFloat(value.replace('vh', '')) / 100;
		} else if (value.endsWith('vw')) {
			return viewWidth * parseFloat(value.replace('vw', '')) / 100;
		} else {
			throw new Error('size must be one of the following formats \'px\', \'vh\', \'vw\'');
		}
	}

	function generateLink(options, element) {
		var thumbor = new ThumborUrlBuilder(ThumborConfig.THUMBOR_KEY, ThumborConfig.THUMBOR_URL).setImagePath(getAbsoluteUrl(options.imgUrl));
		if (emptyOptions.resize !== options.resize) {
			// resize
			thumbor.resize(options.resize.width, options.resize.height);
		} else if (emptyOptions.fit !== options.fit) {
			// fit in
			thumbor.fitIn(options.fit.width, options.fit.height);
		} else if (emptyOptions.squareSize !== options.squareSize) {
			thumbor.resize(options.squareSize, options.squareSize);
		} else {
			// fit in by DOM params
			var width = getNormalizedDomWidth(element);
			var height = getNormalizedDomHeight(element);

			if (options.shouldSquare) {
				if (width) {
					thumbor.resize(width, width);
				} else if (height) {
					thumbor.resize(height, height);
				}
			} else {
				if (width && height) {
					thumbor.fitIn(width, height);
				} else if (width) {
					thumbor.fitIn(width, width);
				} else if (height) {
					thumbor.fitIn(height, height);
				}
			}
		}

		if (options.smartCrop) {
			thumbor.smartCrop(true);
		}

		if (options.filters) {
			for (var i = 0; i < options.filters.length; i++) {
				thumbor.filter(options.filters[i]);	
			}
		}

		if (options.fliph) {
			thumbor.flipHorizontally();
		}

		if (options.flipv) {
			thumbor.flipVertically();
		}
		
		if (options.halign) {
			thumbor.halign(options.halign);
		}

		if (options.valign) {
			thumbor.valign(options.valign);
		}
			
		if (options.format) {
			thumbor.filter('format(' + options.format + ')');
		}

		return thumbor.buildUrl();
	}

	function getNormalizedDomWidth(element) {
		var newWidth = 0;
		if (element.style.width && element.style.width > 0) {
			newWidth = Math.round(parseInt(element.style.width, 10));
		} else if (element.offsetWidth) {
			newWidth = Math.round(element.offsetWidth);
		} else if (element.parentElement.offsetWidth) {
			newWidth = Math.round(element.parentElement.offsetWidth);
		}
		return normalizeSize(newWidth);
	}

	function getNormalizedDomHeight(element) {
		var newHeight = 0;
		if (element.style.height) {
			newHeight = Math.round(parseInt(element.style.height));
		} else if (element.offsetHeight) {
			newHeight = Math.round(element.offsetHeight);
		} else if (element.parentElement.offsetHeight) {
			newHeight = Math.round(element.parentElement.offsetHeight);
		}
		return normalizeSize(newHeight);
	}

	function normalizeSize(size) {
		var deviceSize = size * getDevicePixelRatio();
		if(deviceSize > 0)
			return Math.ceil(deviceSize/sizeIncraments) * sizeIncraments;
		else if(size < 0)
			return Math.floor(deviceSize/sizeIncraments) * sizeIncraments;
		else
			return 0;
	}

	function getAbsoluteUrl(url) {
		if (url.startsWith('http') || url.startsWith('ftp') || url.startsWith('cdvfile')) {
			return url;
		}

		var base = window.location.origin;
		var stack = base.split('/'),
			parts = url.split('/');
		stack.pop(); // remove current file name (or empty string), (omit if "base" is the current folder without trailing slash)

		for (var i=0; i<parts.length; i++) {
			if (parts[i] == '.')
				continue;
			if (parts[i] == '..')
				stack.pop();
			else
				stack.push(parts[i]);
		}
		return stack.join('/');
	}

	function getDevicePixelRatio() {
		if (!pixelRatio) {
			var ratio = 1;
			// To account for zoom, change to use deviceXDPI instead of systemXDPI
			if (window.screen.systemXDPI !== undefined && window.screen.logicalXDPI !== undefined && window.screen.systemXDPI > window.screen.logicalXDPI) {
				// Only allow for values > 1
				ratio = window.screen.systemXDPI / window.screen.logicalXDPI;
			}
			else if (window.devicePixelRatio !== undefined) {
				ratio = window.devicePixelRatio;
			}
			pixelRatio = ratio;
		}
		return pixelRatio;
	}

	init(true);
})();