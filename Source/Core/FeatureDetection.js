define([
        './defaultValue',
        './defined',
        './Fullscreen',
        '../ThirdParty/when'
    ], function(
        defaultValue,
        defined,
        Fullscreen,
        when) {
    'use strict';
    /*global CanvasPixelArray*/

    var theNavigator;
    if (typeof navigator !== 'undefined') {
        theNavigator = navigator;
    } else {
        theNavigator = {};
    }

    function extractVersion(versionString) {
        var parts = versionString.split('.');
        for (var i = 0, len = parts.length; i < len; ++i) {
            parts[i] = parseInt(parts[i], 10);
        }
        return parts;
    }

    var isChromeResult;
    var chromeVersionResult;
    function isChrome() {
        if (!defined(isChromeResult)) {
            isChromeResult = false;
            // Edge contains Chrome in the user agent too
            if (!isEdge()) {
                var fields = (/ Chrome\/([\.0-9]+)/).exec(theNavigator.userAgent);
                if (fields !== null) {
                    isChromeResult = true;
                    chromeVersionResult = extractVersion(fields[1]);
                }
            }
        }

        return isChromeResult;
    }

    function chromeVersion() {
        return isChrome() && chromeVersionResult;
    }

    var isSafariResult;
    var safariVersionResult;
    function isSafari() {
        if (!defined(isSafariResult)) {
            isSafariResult = false;

            // Chrome and Edge contain Safari in the user agent too
            if (!isChrome() && !isEdge() && (/ Safari\/[\.0-9]+/).test(theNavigator.userAgent)) {
                var fields = (/ Version\/([\.0-9]+)/).exec(theNavigator.userAgent);
                if (fields !== null) {
                    isSafariResult = true;
                    safariVersionResult = extractVersion(fields[1]);
                }
            }
        }

        return isSafariResult;
    }

    function safariVersion() {
        return isSafari() && safariVersionResult;
    }

    var isWebkitResult;
    var webkitVersionResult;
    function isWebkit() {
        if (!defined(isWebkitResult)) {
            isWebkitResult = false;

            var fields = (/ AppleWebKit\/([\.0-9]+)(\+?)/).exec(theNavigator.userAgent);
            if (fields !== null) {
                isWebkitResult = true;
                webkitVersionResult = extractVersion(fields[1]);
                webkitVersionResult.isNightly = !!fields[2];
            }
        }

        return isWebkitResult;
    }

    function webkitVersion() {
        return isWebkit() && webkitVersionResult;
    }

    var isInternetExplorerResult;
    var internetExplorerVersionResult;
    function isInternetExplorer() {
        if (!defined(isInternetExplorerResult)) {
            isInternetExplorerResult = false;

            var fields;
            if (theNavigator.appName === 'Microsoft Internet Explorer') {
                fields = /MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(theNavigator.userAgent);
                if (fields !== null) {
                    isInternetExplorerResult = true;
                    internetExplorerVersionResult = extractVersion(fields[1]);
                }
            } else if (theNavigator.appName === 'Netscape') {
                fields = /Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(theNavigator.userAgent);
                if (fields !== null) {
                    isInternetExplorerResult = true;
                    internetExplorerVersionResult = extractVersion(fields[1]);
                }
            }
        }
        return isInternetExplorerResult;
    }

    function internetExplorerVersion() {
        return isInternetExplorer() && internetExplorerVersionResult;
    }

    var isEdgeResult;
    var edgeVersionResult;
    function isEdge() {
        if (!defined(isEdgeResult)) {
            isEdgeResult = false;
            var fields = (/ Edge\/([\.0-9]+)/).exec(theNavigator.userAgent);
            if (fields !== null) {
                isEdgeResult = true;
                edgeVersionResult = extractVersion(fields[1]);
            }
        }
        return isEdgeResult;
    }

    function edgeVersion() {
        return isEdge() && edgeVersionResult;
    }

    var isFirefoxResult;
    var firefoxVersionResult;
    function isFirefox() {
        if (!defined(isFirefoxResult)) {
            isFirefoxResult = false;

            var fields = /Firefox\/([\.0-9]+)/.exec(theNavigator.userAgent);
            if (fields !== null) {
                isFirefoxResult = true;
                firefoxVersionResult = extractVersion(fields[1]);
            }
        }
        return isFirefoxResult;
    }

    var isWindowsResult;
    function isWindows() {
        if (!defined(isWindowsResult)) {
            isWindowsResult = /Windows/i.test(theNavigator.appVersion);
        }
        return isWindowsResult;
    }

    function firefoxVersion() {
        return isFirefox() && firefoxVersionResult;
    }

    var hasPointerEvents;
    function supportsPointerEvents() {
        if (!defined(hasPointerEvents)) {
            //While navigator.pointerEnabled is deprecated in the W3C specification
            //we still need to use it if it exists in order to support browsers
            //that rely on it, such as the Windows WebBrowser control which defines
            //PointerEvent but sets navigator.pointerEnabled to false.

            //Firefox disabled because of https://github.com/AnalyticalGraphicsInc/cesium/issues/6372
            hasPointerEvents = !isFirefox() && typeof PointerEvent !== 'undefined' && (!defined(theNavigator.pointerEnabled) || theNavigator.pointerEnabled);
        }
        return hasPointerEvents;
    }

    var imageRenderingValueResult;
    var supportsImageRenderingPixelatedResult;
    function supportsImageRenderingPixelated() {
        if (!defined(supportsImageRenderingPixelatedResult)) {
            var canvas = document.createElement('canvas');
            canvas.setAttribute('style',
                                'image-rendering: -moz-crisp-edges;' +
                                'image-rendering: pixelated;');
            //canvas.style.imageRendering will be undefined, null or an empty string on unsupported browsers.
            var tmp = canvas.style.imageRendering;
            supportsImageRenderingPixelatedResult = defined(tmp) && tmp !== '';
            if (supportsImageRenderingPixelatedResult) {
                imageRenderingValueResult = tmp;
            }
        }
        return supportsImageRenderingPixelatedResult;
    }

    function imageRenderingValue() {
        return supportsImageRenderingPixelated() ? imageRenderingValueResult : undefined;
    }

    var supportsWebPResult;
    var supportsWebPPromise;
    function supportsWebP() {
        // From https://developers.google.com/speed/webp/faq#how_can_i_detect_browser_support_for_webp
        if (defined(supportsWebPPromise)) {
            return supportsWebPPromise.promise;
        }

        supportsWebPPromise = when.defer();
        if (isEdge()) {
            // Edge's WebP support with WebGL is incomplete.
            // See bug report: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/19221241/
            supportsWebPResult = false;
            supportsWebPPromise.resolve(supportsWebPResult);
        }

        var image = new Image();
        image.onload = function () {
            supportsWebPResult = (image.width > 0) && (image.height > 0);
            supportsWebPPromise.resolve(supportsWebPResult);
        };

        image.onerror = function () {
            supportsWebPResult = false;
            supportsWebPPromise.resolve(supportsWebPResult);
        };

        image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

        return supportsWebPPromise.promise;
    }

    function supportsWebPSync() {
        if (!defined(supportsWebPPromise)) {
            supportsWebP();
        }
        return supportsWebPResult;
    }

    var typedArrayTypes = [];
    if (typeof ArrayBuffer !== 'undefined') {
        typedArrayTypes.push(Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array);

        if (typeof Uint8ClampedArray !== 'undefined') {
            typedArrayTypes.push(Uint8ClampedArray);
        }

        if (typeof CanvasPixelArray !== 'undefined') {
            typedArrayTypes.push(CanvasPixelArray);
        }
    }

    var supportsCreateImageBitmapResult;
    function supportsCreateImageBitmap() {
        if (!defined(supportsCreateImageBitmapResult)) {
            supportsCreateImageBitmapResult = defined(window.createImageBitmap);
        }

        return supportsCreateImageBitmapResult;
    }

    var supportsImageBitmapOptionsResult;
    var supportsImageBitmapOptionsPromise;
    function supportsImageBitmapOptions() {
        // Until the HTML folks figure out what to do about this, we need to actually try loading an image to
        // know if this browser supports passing options to the createImageBitmap function.
        // https://github.com/whatwg/html/pull/4248
        if (defined(supportsImageBitmapOptionsPromise)) {
            return supportsImageBitmapOptionsPromise.promise;
        }

        supportsImageBitmapOptionsPromise = when.defer();

        if (!supportsCreateImageBitmap()) {
            supportsImageBitmapOptionsResult = false;
            supportsImageBitmapOptionsPromise.resolve(supportsImageBitmapOptionsResult);
            return supportsImageBitmapOptionsPromise.promise;
        }

        var imageDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWP4////fwAJ+wP9CNHoHgAAAABJRU5ErkJggg==';
        // Use the fetch API here to avoid a circular dependency from including Resource here.
        // `fetch` is supported everywhere createImageBitmap is.
        fetch(imageDataUri)
            .then(function(response) {
                return response.blob();
            })
            .then(function(blob) {
                return createImageBitmap(blob, {
                    imageOrientation: 'flipY'
                });
            })
            .then(function(imageBitmap) {
                supportsImageBitmapOptionsResult = true;
                supportsImageBitmapOptionsPromise.resolve(supportsImageBitmapOptionsResult);
            })
            .catch(function() {
                supportsImageBitmapOptionsResult = false;
                supportsImageBitmapOptionsPromise.resolve(supportsImageBitmapOptionsResult);
            });

        return supportsImageBitmapOptionsPromise.promise;
    }

    function supportsImageBitmapOptionsSync() {
        if (!defined(supportsImageBitmapOptionsPromise)) {
            supportsImageBitmapOptions();
        }

        return supportsImageBitmapOptionsResult;
    }

    /**
     * A set of functions to detect whether the current browser supports
     * various features.
     *
     * @exports FeatureDetection
     */
    var FeatureDetection = {
        isChrome : isChrome,
        chromeVersion : chromeVersion,
        isSafari : isSafari,
        safariVersion : safariVersion,
        isWebkit : isWebkit,
        webkitVersion : webkitVersion,
        isInternetExplorer : isInternetExplorer,
        internetExplorerVersion : internetExplorerVersion,
        isEdge : isEdge,
        edgeVersion : edgeVersion,
        isFirefox : isFirefox,
        firefoxVersion : firefoxVersion,
        isWindows : isWindows,
        hardwareConcurrency : defaultValue(theNavigator.hardwareConcurrency, 3),
        supportsPointerEvents : supportsPointerEvents,
        supportsImageRenderingPixelated: supportsImageRenderingPixelated,
        supportsWebP: supportsWebP,
        supportsWebPSync: supportsWebPSync,
        supportsCreateImageBitmap: supportsCreateImageBitmap,
        supportsImageBitmapOptions: supportsImageBitmapOptions,
        supportsImageBitmapOptionsSync: supportsImageBitmapOptionsSync,
        imageRenderingValue: imageRenderingValue,
        typedArrayTypes: typedArrayTypes
    };

    /**
     * Detects whether the current browser supports the full screen standard.
     *
     * @returns {Boolean} true if the browser supports the full screen standard, false if not.
     *
     * @see Fullscreen
     * @see {@link http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html|W3C Fullscreen Living Specification}
     */
    FeatureDetection.supportsFullscreen = function() {
        return Fullscreen.supportsFullscreen();
    };

    /**
     * Detects whether the current browser supports typed arrays.
     *
     * @returns {Boolean} true if the browser supports typed arrays, false if not.
     *
     * @see {@link http://www.khronos.org/registry/typedarray/specs/latest/|Typed Array Specification}
     */
    FeatureDetection.supportsTypedArrays = function() {
        return typeof ArrayBuffer !== 'undefined';
    };

    /**
     * Detects whether the current browser supports Web Workers.
     *
     * @returns {Boolean} true if the browsers supports Web Workers, false if not.
     *
     * @see {@link http://www.w3.org/TR/workers/}
     */
    FeatureDetection.supportsWebWorkers = function() {
        return typeof Worker !== 'undefined';
    };

    /**
     * Detects whether the current browser supports Web Assembly.
     *
     * @returns {Boolean} true if the browsers supports Web Assembly, false if not.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/WebAssembly}
     */
    FeatureDetection.supportsWebAssembly = function() {
        return typeof WebAssembly !== 'undefined' && !FeatureDetection.isEdge();
    };

    return FeatureDetection;
});
