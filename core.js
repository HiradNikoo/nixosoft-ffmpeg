
var core = {
    guid: function(){
        function S4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
        }
        return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
    },
    type: function (obj) {
        return Object.prototype.toString.call(obj).replace(new RegExp(/\[object (\w+)\]/), '$1').toLowerCase();
    },
    isFunction: function (obj) {
        return core.type(obj) === 'function';
    },
    isWindow: function (obj) {
        return obj != null && obj == obj.window;
    },
    isArray: function (obj) {
        return core.type(obj) === 'array';
    },
    isNumeric: function (obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj);
    },
    isNull: function (obj) {
        return obj == null;
    },
    isEmpty: function (str) {
        return str === "";
    },
    isNullOrEmpty: function (str) {
        return core.isNull(str) || core.isEmpty(str);
    },
    isNullOrUndefined: function (str) {
        return core.isNull(str) || str == undefined;
    },
    isEmptyObject: function (obj) {
        var name;
        for (name in obj) {
            return false;
        }
        return true;
    },
    extend: function () {
        // Courtesy of JQuery

        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if (typeof target !== "object" && !core.isFunction(target)) {
            target = {};
        }

        // extend itself if only one argument is passed
        if (length === i) {
            target = this;
            --i;
        }

        for (; i < length; i++) {
            // Only deal with non-null/undefined values
            if ((options = arguments[i]) != null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target === copy) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if (deep && copy && (core.isPlainObject(copy) || (copyIsArray = core.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && core.isArray(src) ? src : [];

                        } else {
                            clone = src && core.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[name] = core.extend(deep, clone, copy);

                        // Don't bring in undefined values
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        // Return the modified object
        return target;
    },
    httpGet: function (options) {
        let URL = require('url');
        let urlInfo = URL.parse(options.url);

        let defaultOptions = core.extend(urlInfo, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            data: function () { },
            error: function () { }
        });

        options = core.extend(defaultOptions, options);

        let HTTP = require('http');
        var req = HTTP.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', options.data);
        });
        req.on('error', options.error);
        req.end();
    },
    httpArrayBuffer: function (options) {
        options = options || {};
        options.headers = { 'Content-Type': 'arraybuffer' };
        core.httpGet(options);
    },
    httpHead: function (options) {
        let URL = require('url');
        let urlInfo = URL.parse(options.url);

        let defaultOptions = core.extend(urlInfo, {
            method: 'HEAD',
            success: function () { },
            error: function () { }
        });

        options = core.extend(defaultOptions, options);
        let HTTP = require('http');
        let req = HTTP.request(options, function (r) {
            options.success(r, r.headers, r.headers['content-length']);
        });
        req.on('error', options.error);
        req.end();
    },
    httpBinaryGet: function (options) {
        options = core.extend({
            url: '',
            chunk: true,
            data: function () { },
            error: function () { },
            finish: function () { }
        }, options);

        let http = require('http');
        let URL = require('url');
        let httpOptions = URL.parse(options.url);
        httpOptions.headers = httpOptions.headers || {};
        httpOptions.headers['content-type'] = options.contentType || 'arraybuffer';
        http.get(httpOptions, function (res) {
            if (options.chunk) {
                res.on('data', function (buffer) {
                    options.data(buffer, res);
                })
                    .on('error', options.error)
                    .on('end', options.finish);
            } else {
                let data = [];
                res.on('data', function (buffer) {
                    data = data.concat(buffer);;
                })
                    .on('error', options.error)
                    .on('end', function () {
                        options.data(data);
                        options.finish();
                    });
            }
        });
    },
};


module.exports = core;