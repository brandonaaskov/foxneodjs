(function () {
/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

/*! jQuery v2.0.0 | (c) 2005, 2013 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery.min.map
*/
(function(e,undefined){var t,n,r=typeof undefined,i=e.location,o=e.document,s=o.documentElement,a=e.jQuery,u=e.$,l={},c=[],f="2.0.0",p=c.concat,h=c.push,d=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=f.trim,x=function(e,n){return new x.fn.init(e,n,t)},b=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^-ms-/,N=/-([\da-z])/gi,E=function(e,t){return t.toUpperCase()},S=function(){o.removeEventListener("DOMContentLoaded",S,!1),e.removeEventListener("load",S,!1),x.ready()};x.fn=x.prototype={jquery:f,constructor:x,init:function(e,t,n){var r,i;if(!e)return this;if("string"==typeof e){if(r="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:T.exec(e),!r||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof x?t[0]:t,x.merge(this,x.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:o,!0)),C.test(r[1])&&x.isPlainObject(t))for(r in t)x.isFunction(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return i=o.getElementById(r[2]),i&&i.parentNode&&(this.length=1,this[0]=i),this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):x.isFunction(e)?n.ready(e):(e.selector!==undefined&&(this.selector=e.selector,this.context=e.context),x.makeArray(e,this))},selector:"",length:0,toArray:function(){return d.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=x.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return x.each(this,e,t)},ready:function(e){return x.ready.promise().done(e),this},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(x.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:h,sort:[].sort,splice:[].splice},x.fn.init.prototype=x.fn,x.extend=x.fn.extend=function(){var e,t,n,r,i,o,s=arguments[0]||{},a=1,u=arguments.length,l=!1;for("boolean"==typeof s&&(l=s,s=arguments[1]||{},a=2),"object"==typeof s||x.isFunction(s)||(s={}),u===a&&(s=this,--a);u>a;a++)if(null!=(e=arguments[a]))for(t in e)n=s[t],r=e[t],s!==r&&(l&&r&&(x.isPlainObject(r)||(i=x.isArray(r)))?(i?(i=!1,o=n&&x.isArray(n)?n:[]):o=n&&x.isPlainObject(n)?n:{},s[t]=x.extend(l,o,r)):r!==undefined&&(s[t]=r));return s},x.extend({expando:"jQuery"+(f+Math.random()).replace(/\D/g,""),noConflict:function(t){return e.$===x&&(e.$=u),t&&e.jQuery===x&&(e.jQuery=a),x},isReady:!1,readyWait:1,holdReady:function(e){e?x.readyWait++:x.ready(!0)},ready:function(e){(e===!0?--x.readyWait:x.isReady)||(x.isReady=!0,e!==!0&&--x.readyWait>0||(n.resolveWith(o,[x]),x.fn.trigger&&x(o).trigger("ready").off("ready")))},isFunction:function(e){return"function"===x.type(e)},isArray:Array.isArray,isWindow:function(e){return null!=e&&e===e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if("object"!==x.type(e)||e.nodeType||x.isWindow(e))return!1;try{if(e.constructor&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(t){return!1}return!0},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=x.buildFragment([e],t,i),i&&x(i).remove(),x.merge([],r.childNodes))},parseJSON:JSON.parse,parseXML:function(e){var t,n;if(!e||"string"!=typeof e)return null;try{n=new DOMParser,t=n.parseFromString(e,"text/xml")}catch(r){t=undefined}return(!t||t.getElementsByTagName("parsererror").length)&&x.error("Invalid XML: "+e),t},noop:function(){},globalEval:function(e){var t,n=eval;e=x.trim(e),e&&(1===e.indexOf("use strict")?(t=o.createElement("script"),t.text=e,o.head.appendChild(t).parentNode.removeChild(t)):n(e))},camelCase:function(e){return e.replace(k,"ms-").replace(N,E)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,s=j(e);if(n){if(s){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(s){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:function(e){return null==e?"":v.call(e)},makeArray:function(e,t){var n=t||[];return null!=e&&(j(Object(e))?x.merge(n,"string"==typeof e?[e]:e):h.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:g.call(t,e,n)},merge:function(e,t){var n=t.length,r=e.length,i=0;if("number"==typeof n)for(;n>i;i++)e[r++]=t[i];else while(t[i]!==undefined)e[r++]=t[i++];return e.length=r,e},grep:function(e,t,n){var r,i=[],o=0,s=e.length;for(n=!!n;s>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,s=j(e),a=[];if(s)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(a[a.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(a[a.length]=r);return p.apply([],a)},guid:1,proxy:function(e,t){var n,r,i;return"string"==typeof t&&(n=e[t],t=e,e=n),x.isFunction(e)?(r=d.call(arguments,2),i=function(){return e.apply(t||this,r.concat(d.call(arguments)))},i.guid=e.guid=e.guid||x.guid++,i):undefined},access:function(e,t,n,r,i,o,s){var a=0,u=e.length,l=null==n;if("object"===x.type(n)){i=!0;for(a in n)x.access(e,t,a,n[a],!0,o,s)}else if(r!==undefined&&(i=!0,x.isFunction(r)||(s=!0),l&&(s?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(x(e),n)})),t))for(;u>a;a++)t(e[a],n,s?r:r.call(e[a],a,t(e[a],n)));return i?e:l?t.call(e):u?t(e[0],n):o},now:Date.now,swap:function(e,t,n,r){var i,o,s={};for(o in t)s[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=s[o];return i}}),x.ready.promise=function(t){return n||(n=x.Deferred(),"complete"===o.readyState?setTimeout(x.ready):(o.addEventListener("DOMContentLoaded",S,!1),e.addEventListener("load",S,!1))),n.promise(t)},x.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function j(e){var t=e.length,n=x.type(e);return x.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}t=x(o),function(e,undefined){var t,n,r,i,o,s,a,u,l,c,f,p,h,d,g,m,y="sizzle"+-new Date,v=e.document,b={},w=0,T=0,C=ot(),k=ot(),N=ot(),E=!1,S=function(){return 0},j=typeof undefined,D=1<<31,A=[],L=A.pop,q=A.push,H=A.push,O=A.slice,F=A.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},P="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",R="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",W=M.replace("w","w#"),$="\\["+R+"*("+M+")"+R+"*(?:([*^$|!~]?=)"+R+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+W+")|)|)"+R+"*\\]",B=":("+M+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+$.replace(3,8)+")*)|.*)\\)|)",I=RegExp("^"+R+"+|((?:^|[^\\\\])(?:\\\\.)*)"+R+"+$","g"),z=RegExp("^"+R+"*,"+R+"*"),_=RegExp("^"+R+"*([>+~]|"+R+")"+R+"*"),X=RegExp(R+"*[+~]"),U=RegExp("="+R+"*([^\\]'\"]*)"+R+"*\\]","g"),Y=RegExp(B),V=RegExp("^"+W+"$"),G={ID:RegExp("^#("+M+")"),CLASS:RegExp("^\\.("+M+")"),TAG:RegExp("^("+M.replace("w","w*")+")"),ATTR:RegExp("^"+$),PSEUDO:RegExp("^"+B),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+R+"*(even|odd|(([+-]|)(\\d*)n|)"+R+"*(?:([+-]|)"+R+"*(\\d+)|))"+R+"*\\)|)","i"),"boolean":RegExp("^(?:"+P+")$","i"),needsContext:RegExp("^"+R+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+R+"*((?:-\\d)?\\d*)"+R+"*\\)|)(?=[^-]|$)","i")},J=/^[^{]+\{\s*\[native \w/,Q=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,K=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,et=/'|\\/g,tt=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,nt=function(e,t){var n="0x"+t-65536;return n!==n?t:0>n?String.fromCharCode(n+65536):String.fromCharCode(55296|n>>10,56320|1023&n)};try{H.apply(A=O.call(v.childNodes),v.childNodes),A[v.childNodes.length].nodeType}catch(rt){H={apply:A.length?function(e,t){q.apply(e,O.call(t))}:function(e,t){var n=e.length,r=0;while(e[n++]=t[r++]);e.length=n-1}}}function it(e){return J.test(e+"")}function ot(){var e,t=[];return e=function(n,i){return t.push(n+=" ")>r.cacheLength&&delete e[t.shift()],e[n]=i}}function st(e){return e[y]=!0,e}function at(e){var t=c.createElement("div");try{return!!e(t)}catch(n){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function ut(e,t,n,r){var i,o,s,a,u,f,d,g,x,w;if((t?t.ownerDocument||t:v)!==c&&l(t),t=t||c,n=n||[],!e||"string"!=typeof e)return n;if(1!==(a=t.nodeType)&&9!==a)return[];if(p&&!r){if(i=Q.exec(e))if(s=i[1]){if(9===a){if(o=t.getElementById(s),!o||!o.parentNode)return n;if(o.id===s)return n.push(o),n}else if(t.ownerDocument&&(o=t.ownerDocument.getElementById(s))&&m(t,o)&&o.id===s)return n.push(o),n}else{if(i[2])return H.apply(n,t.getElementsByTagName(e)),n;if((s=i[3])&&b.getElementsByClassName&&t.getElementsByClassName)return H.apply(n,t.getElementsByClassName(s)),n}if(b.qsa&&(!h||!h.test(e))){if(g=d=y,x=t,w=9===a&&e,1===a&&"object"!==t.nodeName.toLowerCase()){f=gt(e),(d=t.getAttribute("id"))?g=d.replace(et,"\\$&"):t.setAttribute("id",g),g="[id='"+g+"'] ",u=f.length;while(u--)f[u]=g+mt(f[u]);x=X.test(e)&&t.parentNode||t,w=f.join(",")}if(w)try{return H.apply(n,x.querySelectorAll(w)),n}catch(T){}finally{d||t.removeAttribute("id")}}}return kt(e.replace(I,"$1"),t,n,r)}o=ut.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},l=ut.setDocument=function(e){var t=e?e.ownerDocument||e:v;return t!==c&&9===t.nodeType&&t.documentElement?(c=t,f=t.documentElement,p=!o(t),b.getElementsByTagName=at(function(e){return e.appendChild(t.createComment("")),!e.getElementsByTagName("*").length}),b.attributes=at(function(e){return e.className="i",!e.getAttribute("className")}),b.getElementsByClassName=at(function(e){return e.innerHTML="<div class='a'></div><div class='a i'></div>",e.firstChild.className="i",2===e.getElementsByClassName("i").length}),b.sortDetached=at(function(e){return 1&e.compareDocumentPosition(c.createElement("div"))}),b.getById=at(function(e){return f.appendChild(e).id=y,!t.getElementsByName||!t.getElementsByName(y).length}),b.getById?(r.find.ID=function(e,t){if(typeof t.getElementById!==j&&p){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},r.filter.ID=function(e){var t=e.replace(tt,nt);return function(e){return e.getAttribute("id")===t}}):(r.find.ID=function(e,t){if(typeof t.getElementById!==j&&p){var n=t.getElementById(e);return n?n.id===e||typeof n.getAttributeNode!==j&&n.getAttributeNode("id").value===e?[n]:undefined:[]}},r.filter.ID=function(e){var t=e.replace(tt,nt);return function(e){var n=typeof e.getAttributeNode!==j&&e.getAttributeNode("id");return n&&n.value===t}}),r.find.TAG=b.getElementsByTagName?function(e,t){return typeof t.getElementsByTagName!==j?t.getElementsByTagName(e):undefined}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},r.find.CLASS=b.getElementsByClassName&&function(e,t){return typeof t.getElementsByClassName!==j&&p?t.getElementsByClassName(e):undefined},d=[],h=[],(b.qsa=it(t.querySelectorAll))&&(at(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||h.push("\\["+R+"*(?:value|"+P+")"),e.querySelectorAll(":checked").length||h.push(":checked")}),at(function(e){var t=c.createElement("input");t.setAttribute("type","hidden"),e.appendChild(t).setAttribute("t",""),e.querySelectorAll("[t^='']").length&&h.push("[*^$]="+R+"*(?:''|\"\")"),e.querySelectorAll(":enabled").length||h.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),h.push(",.*:")})),(b.matchesSelector=it(g=f.webkitMatchesSelector||f.mozMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&at(function(e){b.disconnectedMatch=g.call(e,"div"),g.call(e,"[s!='']:x"),d.push("!=",B)}),h=h.length&&RegExp(h.join("|")),d=d.length&&RegExp(d.join("|")),m=it(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},S=f.compareDocumentPosition?function(e,n){if(e===n)return E=!0,0;var r=n.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(n);return r?1&r||!b.sortDetached&&n.compareDocumentPosition(e)===r?e===t||m(v,e)?-1:n===t||m(v,n)?1:u?F.call(u,e)-F.call(u,n):0:4&r?-1:1:e.compareDocumentPosition?-1:1}:function(e,n){var r,i=0,o=e.parentNode,s=n.parentNode,a=[e],l=[n];if(e===n)return E=!0,0;if(!o||!s)return e===t?-1:n===t?1:o?-1:s?1:u?F.call(u,e)-F.call(u,n):0;if(o===s)return lt(e,n);r=e;while(r=r.parentNode)a.unshift(r);r=n;while(r=r.parentNode)l.unshift(r);while(a[i]===l[i])i++;return i?lt(a[i],l[i]):a[i]===v?-1:l[i]===v?1:0},c):c},ut.matches=function(e,t){return ut(e,null,null,t)},ut.matchesSelector=function(e,t){if((e.ownerDocument||e)!==c&&l(e),t=t.replace(U,"='$1']"),!(!b.matchesSelector||!p||d&&d.test(t)||h&&h.test(t)))try{var n=g.call(e,t);if(n||b.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(r){}return ut(t,c,null,[e]).length>0},ut.contains=function(e,t){return(e.ownerDocument||e)!==c&&l(e),m(e,t)},ut.attr=function(e,t){(e.ownerDocument||e)!==c&&l(e);var n=r.attrHandle[t.toLowerCase()],i=n&&n(e,t,!p);return i===undefined?b.attributes||!p?e.getAttribute(t):(i=e.getAttributeNode(t))&&i.specified?i.value:null:i},ut.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},ut.uniqueSort=function(e){var t,n=[],r=0,i=0;if(E=!b.detectDuplicates,u=!b.sortStable&&e.slice(0),e.sort(S),E){while(t=e[i++])t===e[i]&&(r=n.push(i));while(r--)e.splice(n[r],1)}return e};function lt(e,t){var n=t&&e,r=n&&(~t.sourceIndex||D)-(~e.sourceIndex||D);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function ct(e,t,n){var r;return n?undefined:(r=e.getAttributeNode(t))&&r.specified?r.value:e[t]===!0?t.toLowerCase():null}function ft(e,t,n){var r;return n?undefined:r=e.getAttribute(t,"type"===t.toLowerCase()?1:2)}function pt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ht(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function dt(e){return st(function(t){return t=+t,st(function(n,r){var i,o=e([],n.length,t),s=o.length;while(s--)n[i=o[s]]&&(n[i]=!(r[i]=n[i]))})})}i=ut.getText=function(e){var t,n="",r=0,o=e.nodeType;if(o){if(1===o||9===o||11===o){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=i(e)}else if(3===o||4===o)return e.nodeValue}else for(;t=e[r];r++)n+=i(t);return n},r=ut.selectors={cacheLength:50,createPseudo:st,match:G,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(tt,nt),e[3]=(e[4]||e[5]||"").replace(tt,nt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||ut.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&ut.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return G.CHILD.test(e[0])?null:(e[4]?e[2]=e[4]:n&&Y.test(n)&&(t=gt(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(tt,nt).toLowerCase();return"*"===e?function(){return!0}:function(e){return e.nodeName&&e.nodeName.toLowerCase()===t}},CLASS:function(e){var t=C[e+" "];return t||(t=RegExp("(^|"+R+")"+e+"("+R+"|$)"))&&C(e,function(e){return t.test("string"==typeof e.className&&e.className||typeof e.getAttribute!==j&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=ut.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),s="last"!==e.slice(-4),a="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,f,p,h,d,g=o!==s?"nextSibling":"previousSibling",m=t.parentNode,v=a&&t.nodeName.toLowerCase(),x=!u&&!a;if(m){if(o){while(g){f=t;while(f=f[g])if(a?f.nodeName.toLowerCase()===v:1===f.nodeType)return!1;d=g="only"===e&&!d&&"nextSibling"}return!0}if(d=[s?m.firstChild:m.lastChild],s&&x){c=m[y]||(m[y]={}),l=c[e]||[],h=l[0]===w&&l[1],p=l[0]===w&&l[2],f=h&&m.childNodes[h];while(f=++h&&f&&f[g]||(p=h=0)||d.pop())if(1===f.nodeType&&++p&&f===t){c[e]=[w,h,p];break}}else if(x&&(l=(t[y]||(t[y]={}))[e])&&l[0]===w)p=l[1];else while(f=++h&&f&&f[g]||(p=h=0)||d.pop())if((a?f.nodeName.toLowerCase()===v:1===f.nodeType)&&++p&&(x&&((f[y]||(f[y]={}))[e]=[w,p]),f===t))break;return p-=i,p===r||0===p%r&&p/r>=0}}},PSEUDO:function(e,t){var n,i=r.pseudos[e]||r.setFilters[e.toLowerCase()]||ut.error("unsupported pseudo: "+e);return i[y]?i(t):i.length>1?(n=[e,e,"",t],r.setFilters.hasOwnProperty(e.toLowerCase())?st(function(e,n){var r,o=i(e,t),s=o.length;while(s--)r=F.call(e,o[s]),e[r]=!(n[r]=o[s])}):function(e){return i(e,0,n)}):i}},pseudos:{not:st(function(e){var t=[],n=[],r=s(e.replace(I,"$1"));return r[y]?st(function(e,t,n,i){var o,s=r(e,null,i,[]),a=e.length;while(a--)(o=s[a])&&(e[a]=!(t[a]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:st(function(e){return function(t){return ut(e,t).length>0}}),contains:st(function(e){return function(t){return(t.textContent||t.innerText||i(t)).indexOf(e)>-1}}),lang:st(function(e){return V.test(e||"")||ut.error("unsupported lang: "+e),e=e.replace(tt,nt).toLowerCase(),function(t){var n;do if(n=p?t.lang:t.getAttribute("xml:lang")||t.getAttribute("lang"))return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===c.activeElement&&(!c.hasFocus||c.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!r.pseudos.empty(e)},header:function(e){return Z.test(e.nodeName)},input:function(e){return K.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:dt(function(){return[0]}),last:dt(function(e,t){return[t-1]}),eq:dt(function(e,t,n){return[0>n?n+t:n]}),even:dt(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:dt(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:dt(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:dt(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}};for(t in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})r.pseudos[t]=pt(t);for(t in{submit:!0,reset:!0})r.pseudos[t]=ht(t);function gt(e,t){var n,i,o,s,a,u,l,c=k[e+" "];if(c)return t?0:c.slice(0);a=e,u=[],l=r.preFilter;while(a){(!n||(i=z.exec(a)))&&(i&&(a=a.slice(i[0].length)||a),u.push(o=[])),n=!1,(i=_.exec(a))&&(n=i.shift(),o.push({value:n,type:i[0].replace(I," ")}),a=a.slice(n.length));for(s in r.filter)!(i=G[s].exec(a))||l[s]&&!(i=l[s](i))||(n=i.shift(),o.push({value:n,type:s,matches:i}),a=a.slice(n.length));if(!n)break}return t?a.length:a?ut.error(e):k(e,u).slice(0)}function mt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function yt(e,t,r){var i=t.dir,o=r&&"parentNode"===i,s=T++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,r,a){var u,l,c,f=w+" "+s;if(a){while(t=t[i])if((1===t.nodeType||o)&&e(t,r,a))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[y]||(t[y]={}),(l=c[i])&&l[0]===f){if((u=l[1])===!0||u===n)return u===!0}else if(l=c[i]=[f],l[1]=e(t,r,a)||n,l[1]===!0)return!0}}function vt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function xt(e,t,n,r,i){var o,s=[],a=0,u=e.length,l=null!=t;for(;u>a;a++)(o=e[a])&&(!n||n(o,r,i))&&(s.push(o),l&&t.push(a));return s}function bt(e,t,n,r,i,o){return r&&!r[y]&&(r=bt(r)),i&&!i[y]&&(i=bt(i,o)),st(function(o,s,a,u){var l,c,f,p=[],h=[],d=s.length,g=o||Ct(t||"*",a.nodeType?[a]:a,[]),m=!e||!o&&t?g:xt(g,p,e,a,u),y=n?i||(o?e:d||r)?[]:s:m;if(n&&n(m,y,a,u),r){l=xt(y,h),r(l,[],a,u),c=l.length;while(c--)(f=l[c])&&(y[h[c]]=!(m[h[c]]=f))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(f=y[c])&&l.push(m[c]=f);i(null,y=[],l,u)}c=y.length;while(c--)(f=y[c])&&(l=i?F.call(o,f):p[c])>-1&&(o[l]=!(s[l]=f))}}else y=xt(y===s?y.splice(d,y.length):y),i?i(null,s,y,u):H.apply(s,y)})}function wt(e){var t,n,i,o=e.length,s=r.relative[e[0].type],u=s||r.relative[" "],l=s?1:0,c=yt(function(e){return e===t},u,!0),f=yt(function(e){return F.call(t,e)>-1},u,!0),p=[function(e,n,r){return!s&&(r||n!==a)||((t=n).nodeType?c(e,n,r):f(e,n,r))}];for(;o>l;l++)if(n=r.relative[e[l].type])p=[yt(vt(p),n)];else{if(n=r.filter[e[l].type].apply(null,e[l].matches),n[y]){for(i=++l;o>i;i++)if(r.relative[e[i].type])break;return bt(l>1&&vt(p),l>1&&mt(e.slice(0,l-1)).replace(I,"$1"),n,i>l&&wt(e.slice(l,i)),o>i&&wt(e=e.slice(i)),o>i&&mt(e))}p.push(n)}return vt(p)}function Tt(e,t){var i=0,o=t.length>0,s=e.length>0,u=function(u,l,f,p,h){var d,g,m,y=[],v=0,x="0",b=u&&[],T=null!=h,C=a,k=u||s&&r.find.TAG("*",h&&l.parentNode||l),N=w+=null==C?1:Math.random()||.1;for(T&&(a=l!==c&&l,n=i);null!=(d=k[x]);x++){if(s&&d){g=0;while(m=e[g++])if(m(d,l,f)){p.push(d);break}T&&(w=N,n=++i)}o&&((d=!m&&d)&&v--,u&&b.push(d))}if(v+=x,o&&x!==v){g=0;while(m=t[g++])m(b,y,l,f);if(u){if(v>0)while(x--)b[x]||y[x]||(y[x]=L.call(p));y=xt(y)}H.apply(p,y),T&&!u&&y.length>0&&v+t.length>1&&ut.uniqueSort(p)}return T&&(w=N,a=C),b};return o?st(u):u}s=ut.compile=function(e,t){var n,r=[],i=[],o=N[e+" "];if(!o){t||(t=gt(e)),n=t.length;while(n--)o=wt(t[n]),o[y]?r.push(o):i.push(o);o=N(e,Tt(i,r))}return o};function Ct(e,t,n){var r=0,i=t.length;for(;i>r;r++)ut(e,t[r],n);return n}function kt(e,t,n,i){var o,a,u,l,c,f=gt(e);if(!i&&1===f.length){if(a=f[0]=f[0].slice(0),a.length>2&&"ID"===(u=a[0]).type&&9===t.nodeType&&p&&r.relative[a[1].type]){if(t=(r.find.ID(u.matches[0].replace(tt,nt),t)||[])[0],!t)return n;e=e.slice(a.shift().value.length)}o=G.needsContext.test(e)?0:a.length;while(o--){if(u=a[o],r.relative[l=u.type])break;if((c=r.find[l])&&(i=c(u.matches[0].replace(tt,nt),X.test(a[0].type)&&t.parentNode||t))){if(a.splice(o,1),e=i.length&&mt(a),!e)return H.apply(n,i),n;break}}}return s(e,f)(i,t,!p,n,X.test(e)),n}r.pseudos.nth=r.pseudos.eq;function Nt(){}Nt.prototype=r.filters=r.pseudos,r.setFilters=new Nt,b.sortStable=y.split("").sort(S).join("")===y,l(),[0,0].sort(S),b.detectDuplicates=E,at(function(e){if(e.innerHTML="<a href='#'></a>","#"!==e.firstChild.getAttribute("href")){var t="type|href|height|width".split("|"),n=t.length;while(n--)r.attrHandle[t[n]]=ft}}),at(function(e){if(null!=e.getAttribute("disabled")){var t=P.split("|"),n=t.length;while(n--)r.attrHandle[t[n]]=ct}}),x.find=ut,x.expr=ut.selectors,x.expr[":"]=x.expr.pseudos,x.unique=ut.uniqueSort,x.text=ut.getText,x.isXMLDoc=ut.isXML,x.contains=ut.contains}(e);var D={};function A(e){var t=D[e]={};return x.each(e.match(w)||[],function(e,n){t[n]=!0}),t}x.Callbacks=function(e){e="string"==typeof e?D[e]||A(e):x.extend({},e);var t,n,r,i,o,s,a=[],u=!e.once&&[],l=function(f){for(t=e.memory&&f,n=!0,s=i||0,i=0,o=a.length,r=!0;a&&o>s;s++)if(a[s].apply(f[0],f[1])===!1&&e.stopOnFalse){t=!1;break}r=!1,a&&(u?u.length&&l(u.shift()):t?a=[]:c.disable())},c={add:function(){if(a){var n=a.length;(function s(t){x.each(t,function(t,n){var r=x.type(n);"function"===r?e.unique&&c.has(n)||a.push(n):n&&n.length&&"string"!==r&&s(n)})})(arguments),r?o=a.length:t&&(i=n,l(t))}return this},remove:function(){return a&&x.each(arguments,function(e,t){var n;while((n=x.inArray(t,a,n))>-1)a.splice(n,1),r&&(o>=n&&o--,s>=n&&s--)}),this},has:function(e){return e?x.inArray(e,a)>-1:!(!a||!a.length)},empty:function(){return a=[],o=0,this},disable:function(){return a=u=t=undefined,this},disabled:function(){return!a},lock:function(){return u=undefined,t||c.disable(),this},locked:function(){return!u},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!a||n&&!u||(r?u.push(t):l(t)),this},fire:function(){return c.fireWith(this,arguments),this},fired:function(){return!!n}};return c},x.extend({Deferred:function(e){var t=[["resolve","done",x.Callbacks("once memory"),"resolved"],["reject","fail",x.Callbacks("once memory"),"rejected"],["notify","progress",x.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return x.Deferred(function(n){x.each(t,function(t,o){var s=o[0],a=x.isFunction(e[t])&&e[t];i[o[1]](function(){var e=a&&a.apply(this,arguments);e&&x.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[s+"With"](this===r?n.promise():this,a?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?x.extend(e,r):r}},i={};return r.pipe=r.then,x.each(t,function(e,o){var s=o[2],a=o[3];r[o[1]]=s.add,a&&s.add(function(){n=a},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=s.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=d.call(arguments),r=n.length,i=1!==r||e&&x.isFunction(e.promise)?r:0,o=1===i?e:x.Deferred(),s=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?d.call(arguments):r,n===a?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},a,u,l;if(r>1)for(a=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&x.isFunction(n[t].promise)?n[t].promise().done(s(t,l,n)).fail(o.reject).progress(s(t,u,a)):--i;return i||o.resolveWith(l,n),o.promise()}}),x.support=function(t){var n=o.createElement("input"),r=o.createDocumentFragment(),i=o.createElement("div"),s=o.createElement("select"),a=s.appendChild(o.createElement("option"));return n.type?(n.type="checkbox",t.checkOn=""!==n.value,t.optSelected=a.selected,t.reliableMarginRight=!0,t.boxSizingReliable=!0,t.pixelPosition=!1,n.checked=!0,t.noCloneChecked=n.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!a.disabled,n=o.createElement("input"),n.value="t",n.type="radio",t.radioValue="t"===n.value,n.setAttribute("checked","t"),n.setAttribute("name","t"),r.appendChild(n),t.checkClone=r.cloneNode(!0).cloneNode(!0).lastChild.checked,t.focusinBubbles="onfocusin"in e,i.style.backgroundClip="content-box",i.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===i.style.backgroundClip,x(function(){var n,r,s="padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",a=o.getElementsByTagName("body")[0];a&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",a.appendChild(n).appendChild(i),i.innerHTML="",i.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%",x.swap(a,null!=a.style.zoom?{zoom:1}:{},function(){t.boxSizing=4===i.offsetWidth}),e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(i,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(i,null)||{width:"4px"}).width,r=i.appendChild(o.createElement("div")),r.style.cssText=i.style.cssText=s,r.style.marginRight=r.style.width="0",i.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),a.removeChild(n))}),t):t}({});var L,q,H=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,O=/([A-Z])/g;function F(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=x.expando+Math.random()}F.uid=1,F.accepts=function(e){return e.nodeType?1===e.nodeType||9===e.nodeType:!0},F.prototype={key:function(e){if(!F.accepts(e))return 0;var t={},n=e[this.expando];if(!n){n=F.uid++;try{t[this.expando]={value:n},Object.defineProperties(e,t)}catch(r){t[this.expando]=n,x.extend(e,t)}}return this.cache[n]||(this.cache[n]={}),n},set:function(e,t,n){var r,i=this.key(e),o=this.cache[i];if("string"==typeof t)o[t]=n;else if(x.isEmptyObject(o))this.cache[i]=t;else for(r in t)o[r]=t[r]},get:function(e,t){var n=this.cache[this.key(e)];return t===undefined?n:n[t]},access:function(e,t,n){return t===undefined||t&&"string"==typeof t&&n===undefined?this.get(e,t):(this.set(e,t,n),n!==undefined?n:t)},remove:function(e,t){var n,r,i=this.key(e),o=this.cache[i];if(t===undefined)this.cache[i]={};else{x.isArray(t)?r=t.concat(t.map(x.camelCase)):t in o?r=[t]:(r=x.camelCase(t),r=r in o?[r]:r.match(w)||[]),n=r.length;while(n--)delete o[r[n]]}},hasData:function(e){return!x.isEmptyObject(this.cache[e[this.expando]]||{})},discard:function(e){delete this.cache[this.key(e)]}},L=new F,q=new F,x.extend({acceptData:F.accepts,hasData:function(e){return L.hasData(e)||q.hasData(e)},data:function(e,t,n){return L.access(e,t,n)},removeData:function(e,t){L.remove(e,t)},_data:function(e,t,n){return q.access(e,t,n)},_removeData:function(e,t){q.remove(e,t)}}),x.fn.extend({data:function(e,t){var n,r,i=this[0],o=0,s=null;if(e===undefined){if(this.length&&(s=L.get(i),1===i.nodeType&&!q.get(i,"hasDataAttrs"))){for(n=i.attributes;n.length>o;o++)r=n[o].name,0===r.indexOf("data-")&&(r=x.camelCase(r.substring(5)),P(i,r,s[r]));q.set(i,"hasDataAttrs",!0)}return s}return"object"==typeof e?this.each(function(){L.set(this,e)}):x.access(this,function(t){var n,r=x.camelCase(e);if(i&&t===undefined){if(n=L.get(i,e),n!==undefined)return n;if(n=L.get(i,r),n!==undefined)return n;if(n=P(i,r,undefined),n!==undefined)return n}else this.each(function(){var n=L.get(this,r);L.set(this,r,t),-1!==e.indexOf("-")&&n!==undefined&&L.set(this,e,t)})},null,t,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){L.remove(this,e)})}});function P(e,t,n){var r;if(n===undefined&&1===e.nodeType)if(r="data-"+t.replace(O,"-$1").toLowerCase(),n=e.getAttribute(r),"string"==typeof n){try{n="true"===n?!0:"false"===n?!1:"null"===n?null:+n+""===n?+n:H.test(n)?JSON.parse(n):n}catch(i){}L.set(e,t,n)}else n=undefined;return n}x.extend({queue:function(e,t,n){var r;return e?(t=(t||"fx")+"queue",r=q.get(e,t),n&&(!r||x.isArray(n)?r=q.access(e,t,x.makeArray(n)):r.push(n)),r||[]):undefined},dequeue:function(e,t){t=t||"fx";var n=x.queue(e,t),r=n.length,i=n.shift(),o=x._queueHooks(e,t),s=function(){x.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),o.cur=i,i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,s,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return q.get(e,n)||q.access(e,n,{empty:x.Callbacks("once memory").add(function(){q.remove(e,[t+"queue",n])})})}}),x.fn.extend({queue:function(e,t){var n=2;return"string"!=typeof e&&(t=e,e="fx",n--),n>arguments.length?x.queue(this[0],e):t===undefined?this:this.each(function(){var n=x.queue(this,e,t);
x._queueHooks(this,e),"fx"===e&&"inprogress"!==n[0]&&x.dequeue(this,e)})},dequeue:function(e){return this.each(function(){x.dequeue(this,e)})},delay:function(e,t){return e=x.fx?x.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=x.Deferred(),o=this,s=this.length,a=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=undefined),e=e||"fx";while(s--)n=q.get(o[s],e+"queueHooks"),n&&n.empty&&(r++,n.empty.add(a));return a(),i.promise(t)}});var R,M,W=/[\t\r\n]/g,$=/\r/g,B=/^(?:input|select|textarea|button)$/i;x.fn.extend({attr:function(e,t){return x.access(this,x.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){x.removeAttr(this,e)})},prop:function(e,t){return x.access(this,x.prop,e,t,arguments.length>1)},removeProp:function(e){return this.each(function(){delete this[x.propFix[e]||e]})},addClass:function(e){var t,n,r,i,o,s=0,a=this.length,u="string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=x.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,s=0,a=this.length,u=0===arguments.length||"string"==typeof e&&e;if(x.isFunction(e))return this.each(function(t){x(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];a>s;s++)if(n=this[s],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(W," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?x.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e,i="boolean"==typeof t;return x.isFunction(e)?this.each(function(n){x(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var o,s=0,a=x(this),u=t,l=e.match(w)||[];while(o=l[s++])u=i?u:!a.hasClass(o),a[u?"addClass":"removeClass"](o)}else(n===r||"boolean"===n)&&(this.className&&q.set(this,"__className__",this.className),this.className=this.className||e===!1?"":q.get(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(W," ").indexOf(t)>=0)return!0;return!1},val:function(e){var t,n,r,i=this[0];{if(arguments.length)return r=x.isFunction(e),this.each(function(n){var i,o=x(this);1===this.nodeType&&(i=r?e.call(this,n,o.val()):e,null==i?i="":"number"==typeof i?i+="":x.isArray(i)&&(i=x.map(i,function(e){return null==e?"":e+""})),t=x.valHooks[this.type]||x.valHooks[this.nodeName.toLowerCase()],t&&"set"in t&&t.set(this,i,"value")!==undefined||(this.value=i))});if(i)return t=x.valHooks[i.type]||x.valHooks[i.nodeName.toLowerCase()],t&&"get"in t&&(n=t.get(i,"value"))!==undefined?n:(n=i.value,"string"==typeof n?n.replace($,""):null==n?"":n)}}}),x.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,s=o?null:[],a=o?i+1:r.length,u=0>i?a:o?i:0;for(;a>u;u++)if(n=r[u],!(!n.selected&&u!==i||(x.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&x.nodeName(n.parentNode,"optgroup"))){if(t=x(n).val(),o)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=x.makeArray(t),s=i.length;while(s--)r=i[s],(r.selected=x.inArray(x(r).val(),o)>=0)&&(n=!0);return n||(e.selectedIndex=-1),o}}},attr:function(e,t,n){var i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return typeof e.getAttribute===r?x.prop(e,t,n):(1===s&&x.isXMLDoc(e)||(t=t.toLowerCase(),i=x.attrHooks[t]||(x.expr.match.boolean.test(t)?M:R)),n===undefined?i&&"get"in i&&null!==(o=i.get(e,t))?o:(o=x.find.attr(e,t),null==o?undefined:o):null!==n?i&&"set"in i&&(o=i.set(e,n,t))!==undefined?o:(e.setAttribute(t,n+""),n):(x.removeAttr(e,t),undefined))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=x.propFix[n]||n,x.expr.match.boolean.test(n)&&(e[r]=!1),e.removeAttribute(n)},attrHooks:{type:{set:function(e,t){if(!x.support.radioValue&&"radio"===t&&x.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{"for":"htmlFor","class":"className"},prop:function(e,t,n){var r,i,o,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return o=1!==s||!x.isXMLDoc(e),o&&(t=x.propFix[t]||t,i=x.propHooks[t]),n!==undefined?i&&"set"in i&&(r=i.set(e,n,t))!==undefined?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){return e.hasAttribute("tabindex")||B.test(e.nodeName)||e.href?e.tabIndex:-1}}}}),M={set:function(e,t,n){return t===!1?x.removeAttr(e,n):e.setAttribute(n,n),n}},x.each(x.expr.match.boolean.source.match(/\w+/g),function(e,t){var n=x.expr.attrHandle[t]||x.find.attr;x.expr.attrHandle[t]=function(e,t,r){var i=x.expr.attrHandle[t],o=r?undefined:(x.expr.attrHandle[t]=undefined)!=n(e,t,r)?t.toLowerCase():null;return x.expr.attrHandle[t]=i,o}}),x.support.optSelected||(x.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null}}),x.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){x.propFix[this.toLowerCase()]=this}),x.each(["radio","checkbox"],function(){x.valHooks[this]={set:function(e,t){return x.isArray(t)?e.checked=x.inArray(x(e).val(),t)>=0:undefined}},x.support.checkOn||(x.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var I=/^key/,z=/^(?:mouse|contextmenu)|click/,_=/^(?:focusinfocus|focusoutblur)$/,X=/^([^.]*)(?:\.(.+)|)$/;function U(){return!0}function Y(){return!1}function V(){try{return o.activeElement}catch(e){}}x.event={global:{},add:function(e,t,n,i,o){var s,a,u,l,c,f,p,h,d,g,m,y=q.get(e);if(y){n.handler&&(s=n,n=s.handler,o=s.selector),n.guid||(n.guid=x.guid++),(l=y.events)||(l=y.events={}),(a=y.handle)||(a=y.handle=function(e){return typeof x===r||e&&x.event.triggered===e.type?undefined:x.event.dispatch.apply(a.elem,arguments)},a.elem=e),t=(t||"").match(w)||[""],c=t.length;while(c--)u=X.exec(t[c])||[],d=m=u[1],g=(u[2]||"").split(".").sort(),d&&(p=x.event.special[d]||{},d=(o?p.delegateType:p.bindType)||d,p=x.event.special[d]||{},f=x.extend({type:d,origType:m,data:i,handler:n,guid:n.guid,selector:o,needsContext:o&&x.expr.match.needsContext.test(o),namespace:g.join(".")},s),(h=l[d])||(h=l[d]=[],h.delegateCount=0,p.setup&&p.setup.call(e,i,g,a)!==!1||e.addEventListener&&e.addEventListener(d,a,!1)),p.add&&(p.add.call(e,f),f.handler.guid||(f.handler.guid=n.guid)),o?h.splice(h.delegateCount++,0,f):h.push(f),x.event.global[d]=!0);e=null}},remove:function(e,t,n,r,i){var o,s,a,u,l,c,f,p,h,d,g,m=q.hasData(e)&&q.get(e);if(m&&(u=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(a=X.exec(t[l])||[],h=g=a[1],d=(a[2]||"").split(".").sort(),h){f=x.event.special[h]||{},h=(r?f.delegateType:f.bindType)||h,p=u[h]||[],a=a[2]&&RegExp("(^|\\.)"+d.join("\\.(?:.*\\.|)")+"(\\.|$)"),s=o=p.length;while(o--)c=p[o],!i&&g!==c.origType||n&&n.guid!==c.guid||a&&!a.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(p.splice(o,1),c.selector&&p.delegateCount--,f.remove&&f.remove.call(e,c));s&&!p.length&&(f.teardown&&f.teardown.call(e,d,m.handle)!==!1||x.removeEvent(e,h,m.handle),delete u[h])}else for(h in u)x.event.remove(e,h+t[l],n,r,!0);x.isEmptyObject(u)&&(delete m.handle,q.remove(e,"events"))}},trigger:function(t,n,r,i){var s,a,u,l,c,f,p,h=[r||o],d=y.call(t,"type")?t.type:t,g=y.call(t,"namespace")?t.namespace.split("."):[];if(a=u=r=r||o,3!==r.nodeType&&8!==r.nodeType&&!_.test(d+x.event.triggered)&&(d.indexOf(".")>=0&&(g=d.split("."),d=g.shift(),g.sort()),c=0>d.indexOf(":")&&"on"+d,t=t[x.expando]?t:new x.Event(d,"object"==typeof t&&t),t.isTrigger=i?2:3,t.namespace=g.join("."),t.namespace_re=t.namespace?RegExp("(^|\\.)"+g.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,t.result=undefined,t.target||(t.target=r),n=null==n?[t]:x.makeArray(n,[t]),p=x.event.special[d]||{},i||!p.trigger||p.trigger.apply(r,n)!==!1)){if(!i&&!p.noBubble&&!x.isWindow(r)){for(l=p.delegateType||d,_.test(l+d)||(a=a.parentNode);a;a=a.parentNode)h.push(a),u=a;u===(r.ownerDocument||o)&&h.push(u.defaultView||u.parentWindow||e)}s=0;while((a=h[s++])&&!t.isPropagationStopped())t.type=s>1?l:p.bindType||d,f=(q.get(a,"events")||{})[t.type]&&q.get(a,"handle"),f&&f.apply(a,n),f=c&&a[c],f&&x.acceptData(a)&&f.apply&&f.apply(a,n)===!1&&t.preventDefault();return t.type=d,i||t.isDefaultPrevented()||p._default&&p._default.apply(h.pop(),n)!==!1||!x.acceptData(r)||c&&x.isFunction(r[d])&&!x.isWindow(r)&&(u=r[c],u&&(r[c]=null),x.event.triggered=d,r[d](),x.event.triggered=undefined,u&&(r[c]=u)),t.result}},dispatch:function(e){e=x.event.fix(e);var t,n,r,i,o,s=[],a=d.call(arguments),u=(q.get(this,"events")||{})[e.type]||[],l=x.event.special[e.type]||{};if(a[0]=e,e.delegateTarget=this,!l.preDispatch||l.preDispatch.call(this,e)!==!1){s=x.event.handlers.call(this,e,u),t=0;while((i=s[t++])&&!e.isPropagationStopped()){e.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(o.namespace))&&(e.handleObj=o,e.data=o.data,r=((x.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,a),r!==undefined&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return l.postDispatch&&l.postDispatch.call(this,e),e.result}},handlers:function(e,t){var n,r,i,o,s=[],a=t.delegateCount,u=e.target;if(a&&u.nodeType&&(!e.button||"click"!==e.type))for(;u!==this;u=u.parentNode||this)if(u.disabled!==!0||"click"!==e.type){for(r=[],n=0;a>n;n++)o=t[n],i=o.selector+" ",r[i]===undefined&&(r[i]=o.needsContext?x(i,this).index(u)>=0:x.find(i,this,null,[u]).length),r[i]&&r.push(o);r.length&&s.push({elem:u,handlers:r})}return t.length>a&&s.push({elem:this,handlers:t.slice(a)}),s},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,t){var n,r,i,s=t.button;return null==e.pageX&&null!=t.clientX&&(n=e.target.ownerDocument||o,r=n.documentElement,i=n.body,e.pageX=t.clientX+(r&&r.scrollLeft||i&&i.scrollLeft||0)-(r&&r.clientLeft||i&&i.clientLeft||0),e.pageY=t.clientY+(r&&r.scrollTop||i&&i.scrollTop||0)-(r&&r.clientTop||i&&i.clientTop||0)),e.which||s===undefined||(e.which=1&s?1:2&s?3:4&s?2:0),e}},fix:function(e){if(e[x.expando])return e;var t,n,r,i=e.type,o=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=z.test(i)?this.mouseHooks:I.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new x.Event(o),t=r.length;while(t--)n=r[t],e[n]=o[n];return 3===e.target.nodeType&&(e.target=e.target.parentNode),s.filter?s.filter(e,o):e},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==V()&&this.focus?(this.focus(),!1):undefined},delegateType:"focusin"},blur:{trigger:function(){return this===V()&&this.blur?(this.blur(),!1):undefined},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&x.nodeName(this,"input")?(this.click(),!1):undefined},_default:function(e){return x.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){e.result!==undefined&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=x.extend(new x.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?x.event.trigger(i,null,t):x.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},x.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)},x.Event=function(e,t){return this instanceof x.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.getPreventDefault&&e.getPreventDefault()?U:Y):this.type=e,t&&x.extend(this,t),this.timeStamp=e&&e.timeStamp||x.now(),this[x.expando]=!0,undefined):new x.Event(e,t)},x.Event.prototype={isDefaultPrevented:Y,isPropagationStopped:Y,isImmediatePropagationStopped:Y,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=U,e&&e.preventDefault&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=U,e&&e.stopPropagation&&e.stopPropagation()},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=U,this.stopPropagation()}},x.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){x.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;return(!i||i!==r&&!x.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),x.support.focusinBubbles||x.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){x.event.simulate(t,e.target,x.event.fix(e),!0)};x.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),x.fn.extend({on:function(e,t,n,r,i){var o,s;if("object"==typeof e){"string"!=typeof t&&(n=n||t,t=undefined);for(s in e)this.on(s,t,n,e[s],i);return this}if(null==n&&null==r?(r=t,n=t=undefined):null==r&&("string"==typeof t?(r=n,n=undefined):(r=n,n=t,t=undefined)),r===!1)r=Y;else if(!r)return this;return 1===i&&(o=r,r=function(e){return x().off(e),o.apply(this,arguments)},r.guid=o.guid||(o.guid=x.guid++)),this.each(function(){x.event.add(this,e,r,n,t)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,x(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return(t===!1||"function"==typeof t)&&(n=t,t=undefined),n===!1&&(n=Y),this.each(function(){x.event.remove(this,e,n,t)})},trigger:function(e,t){return this.each(function(){x.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];return n?x.event.trigger(e,t,n,!0):undefined}});var G=/^.[^:#\[\.,]*$/,J=x.expr.match.needsContext,Q={children:!0,contents:!0,next:!0,prev:!0};x.fn.extend({find:function(e){var t,n,r,i=this.length;if("string"!=typeof e)return t=this,this.pushStack(x(e).filter(function(){for(r=0;i>r;r++)if(x.contains(t[r],this))return!0}));for(n=[],r=0;i>r;r++)x.find(e,this[r],n);return n=this.pushStack(i>1?x.unique(n):n),n.selector=(this.selector?this.selector+" ":"")+e,n},has:function(e){var t=x(e,this),n=t.length;return this.filter(function(){var e=0;for(;n>e;e++)if(x.contains(this,t[e]))return!0})},not:function(e){return this.pushStack(Z(this,e||[],!0))},filter:function(e){return this.pushStack(Z(this,e||[],!1))},is:function(e){return!!e&&("string"==typeof e?J.test(e)?x(e,this.context).index(this[0])>=0:x.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,o=[],s=J.test(e)||"string"!=typeof e?x(e,t||this.context):0;for(;i>r;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(11>n.nodeType&&(s?s.index(n)>-1:1===n.nodeType&&x.find.matchesSelector(n,e))){n=o.push(n);break}return this.pushStack(o.length>1?x.unique(o):o)},index:function(e){return e?"string"==typeof e?g.call(x(e),this[0]):g.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?x(e,t):x.makeArray(e&&e.nodeType?[e]:e),r=x.merge(this.get(),n);return this.pushStack(x.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}});function K(e,t){while((e=e[t])&&1!==e.nodeType);return e}x.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return x.dir(e,"parentNode")},parentsUntil:function(e,t,n){return x.dir(e,"parentNode",n)},next:function(e){return K(e,"nextSibling")},prev:function(e){return K(e,"previousSibling")},nextAll:function(e){return x.dir(e,"nextSibling")},prevAll:function(e){return x.dir(e,"previousSibling")},nextUntil:function(e,t,n){return x.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return x.dir(e,"previousSibling",n)},siblings:function(e){return x.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return x.sibling(e.firstChild)},contents:function(e){return x.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:x.merge([],e.childNodes)}},function(e,t){x.fn[e]=function(n,r){var i=x.map(this,t,n);return"Until"!==e.slice(-5)&&(r=n),r&&"string"==typeof r&&(i=x.filter(r,i)),this.length>1&&(Q[e]||x.unique(i),"p"===e[0]&&i.reverse()),this.pushStack(i)}}),x.extend({filter:function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?x.find.matchesSelector(r,e)?[r]:[]:x.find.matches(e,x.grep(t,function(e){return 1===e.nodeType}))},dir:function(e,t,n){var r=[],i=n!==undefined;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&x(e).is(n))break;r.push(e)}return r},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function Z(e,t,n){if(x.isFunction(t))return x.grep(e,function(e,r){return!!t.call(e,r,e)!==n});if(t.nodeType)return x.grep(e,function(e){return e===t!==n});if("string"==typeof t){if(G.test(t))return x.filter(t,e,n);t=x.filter(t,e)}return x.grep(e,function(e){return g.call(t,e)>=0!==n})}var et=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,tt=/<([\w:]+)/,nt=/<|&#?\w+;/,rt=/<(?:script|style|link)/i,it=/^(?:checkbox|radio)$/i,ot=/checked\s*(?:[^=]|=\s*.checked.)/i,st=/^$|\/(?:java|ecma)script/i,at=/^true\/(.*)/,ut=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,lt={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};lt.optgroup=lt.option,lt.tbody=lt.tfoot=lt.colgroup=lt.caption=lt.col=lt.thead,lt.th=lt.td,x.fn.extend({text:function(e){return x.access(this,function(e){return e===undefined?x.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=ct(this,e);t.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=ct(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=e?x.filter(e,this):this,i=0;for(;null!=(n=r[i]);i++)t||1!==n.nodeType||x.cleanData(gt(n)),n.parentNode&&(t&&x.contains(n.ownerDocument,n)&&ht(gt(n,"script")),n.parentNode.removeChild(n));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++)1===e.nodeType&&(x.cleanData(gt(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return x.clone(this,e,t)})},html:function(e){return x.access(this,function(e){var t=this[0]||{},n=0,r=this.length;if(e===undefined&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!rt.test(e)&&!lt[(tt.exec(e)||["",""])[1].toLowerCase()]){e=e.replace(et,"<$1></$2>");try{for(;r>n;n++)t=this[n]||{},1===t.nodeType&&(x.cleanData(gt(t,!1)),t.innerHTML=e);t=0}catch(i){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var e=x.map(this,function(e){return[e.nextSibling,e.parentNode]}),t=0;return this.domManip(arguments,function(n){var r=e[t++],i=e[t++];i&&(x(this).remove(),i.insertBefore(n,r))},!0),t?this:this.remove()},detach:function(e){return this.remove(e,!0)},domManip:function(e,t,n){e=p.apply([],e);var r,i,o,s,a,u,l=0,c=this.length,f=this,h=c-1,d=e[0],g=x.isFunction(d);if(g||!(1>=c||"string"!=typeof d||x.support.checkClone)&&ot.test(d))return this.each(function(r){var i=f.eq(r);g&&(e[0]=d.call(this,r,i.html())),i.domManip(e,t,n)});if(c&&(r=x.buildFragment(e,this[0].ownerDocument,!1,!n&&this),i=r.firstChild,1===r.childNodes.length&&(r=i),i)){for(o=x.map(gt(r,"script"),ft),s=o.length;c>l;l++)a=r,l!==h&&(a=x.clone(a,!0,!0),s&&x.merge(o,gt(a,"script"))),t.call(this[l],a,l);if(s)for(u=o[o.length-1].ownerDocument,x.map(o,pt),l=0;s>l;l++)a=o[l],st.test(a.type||"")&&!q.access(a,"globalEval")&&x.contains(u,a)&&(a.src?x._evalUrl(a.src):x.globalEval(a.textContent.replace(ut,"")))}return this}}),x.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){x.fn[e]=function(e){var n,r=[],i=x(e),o=i.length-1,s=0;for(;o>=s;s++)n=s===o?this:this.clone(!0),x(i[s])[t](n),h.apply(r,n.get());return this.pushStack(r)}}),x.extend({clone:function(e,t,n){var r,i,o,s,a=e.cloneNode(!0),u=x.contains(e.ownerDocument,e);if(!(x.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||x.isXMLDoc(e)))for(s=gt(a),o=gt(e),r=0,i=o.length;i>r;r++)mt(o[r],s[r]);if(t)if(n)for(o=o||gt(e),s=s||gt(a),r=0,i=o.length;i>r;r++)dt(o[r],s[r]);else dt(e,a);return s=gt(a,"script"),s.length>0&&ht(s,!u&&gt(e,"script")),a},buildFragment:function(e,t,n,r){var i,o,s,a,u,l,c=0,f=e.length,p=t.createDocumentFragment(),h=[];for(;f>c;c++)if(i=e[c],i||0===i)if("object"===x.type(i))x.merge(h,i.nodeType?[i]:i);else if(nt.test(i)){o=o||p.appendChild(t.createElement("div")),s=(tt.exec(i)||["",""])[1].toLowerCase(),a=lt[s]||lt._default,o.innerHTML=a[1]+i.replace(et,"<$1></$2>")+a[2],l=a[0];while(l--)o=o.firstChild;x.merge(h,o.childNodes),o=p.firstChild,o.textContent=""}else h.push(t.createTextNode(i));p.textContent="",c=0;while(i=h[c++])if((!r||-1===x.inArray(i,r))&&(u=x.contains(i.ownerDocument,i),o=gt(p.appendChild(i),"script"),u&&ht(o),n)){l=0;while(i=o[l++])st.test(i.type||"")&&n.push(i)}return p},cleanData:function(e){var t,n,r,i=e.length,o=0,s=x.event.special;for(;i>o;o++){if(n=e[o],x.acceptData(n)&&(t=q.access(n)))for(r in t.events)s[r]?x.event.remove(n,r):x.removeEvent(n,r,t.handle);L.discard(n),q.discard(n)}},_evalUrl:function(e){return x.ajax({url:e,type:"GET",dataType:"text",async:!1,global:!1,success:x.globalEval})}});function ct(e,t){return x.nodeName(e,"table")&&x.nodeName(1===t.nodeType?t:t.firstChild,"tr")?e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody")):e}function ft(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function pt(e){var t=at.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function ht(e,t){var n=e.length,r=0;for(;n>r;r++)q.set(e[r],"globalEval",!t||q.get(t[r],"globalEval"))}function dt(e,t){var n,r,i,o,s,a,u,l;if(1===t.nodeType){if(q.hasData(e)&&(o=q.access(e),s=x.extend({},o),l=o.events,q.set(t,s),l)){delete s.handle,s.events={};for(i in l)for(n=0,r=l[i].length;r>n;n++)x.event.add(t,i,l[i][n])}L.hasData(e)&&(a=L.access(e),u=x.extend({},a),L.set(t,u))}}function gt(e,t){var n=e.getElementsByTagName?e.getElementsByTagName(t||"*"):e.querySelectorAll?e.querySelectorAll(t||"*"):[];return t===undefined||t&&x.nodeName(e,t)?x.merge([e],n):n}function mt(e,t){var n=t.nodeName.toLowerCase();"input"===n&&it.test(e.type)?t.checked=e.checked:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}x.fn.extend({wrapAll:function(e){var t;return x.isFunction(e)?this.each(function(t){x(this).wrapAll(e.call(this,t))}):(this[0]&&(t=x(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this)},wrapInner:function(e){return x.isFunction(e)?this.each(function(t){x(this).wrapInner(e.call(this,t))}):this.each(function(){var t=x(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=x.isFunction(e);return this.each(function(n){x(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){x.nodeName(this,"body")||x(this).replaceWith(this.childNodes)}).end()}});var yt,vt,xt=/^(none|table(?!-c[ea]).+)/,bt=/^margin/,wt=RegExp("^("+b+")(.*)$","i"),Tt=RegExp("^("+b+")(?!px)[a-z%]+$","i"),Ct=RegExp("^([+-])=("+b+")","i"),kt={BODY:"block"},Nt={position:"absolute",visibility:"hidden",display:"block"},Et={letterSpacing:0,fontWeight:400},St=["Top","Right","Bottom","Left"],jt=["Webkit","O","Moz","ms"];function Dt(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=jt.length;while(i--)if(t=jt[i]+n,t in e)return t;return r}function At(e,t){return e=t||e,"none"===x.css(e,"display")||!x.contains(e.ownerDocument,e)}function Lt(t){return e.getComputedStyle(t,null)}function qt(e,t){var n,r,i,o=[],s=0,a=e.length;for(;a>s;s++)r=e[s],r.style&&(o[s]=q.get(r,"olddisplay"),n=r.style.display,t?(o[s]||"none"!==n||(r.style.display=""),""===r.style.display&&At(r)&&(o[s]=q.access(r,"olddisplay",Pt(r.nodeName)))):o[s]||(i=At(r),(n&&"none"!==n||!i)&&q.set(r,"olddisplay",i?n:x.css(r,"display"))));for(s=0;a>s;s++)r=e[s],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[s]||"":"none"));return e}x.fn.extend({css:function(e,t){return x.access(this,function(e,t,n){var r,i,o={},s=0;if(x.isArray(t)){for(r=Lt(e),i=t.length;i>s;s++)o[t[s]]=x.css(e,t[s],!1,r);return o}return n!==undefined?x.style(e,t,n):x.css(e,t)},e,t,arguments.length>1)},show:function(){return qt(this,!0)},hide:function(){return qt(this)},toggle:function(e){var t="boolean"==typeof e;return this.each(function(){(t?e:At(this))?x(this).show():x(this).hide()})}}),x.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=yt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,s,a=x.camelCase(t),u=e.style;return t=x.cssProps[a]||(x.cssProps[a]=Dt(u,a)),s=x.cssHooks[t]||x.cssHooks[a],n===undefined?s&&"get"in s&&(i=s.get(e,!1,r))!==undefined?i:u[t]:(o=typeof n,"string"===o&&(i=Ct.exec(n))&&(n=(i[1]+1)*i[2]+parseFloat(x.css(e,t)),o="number"),null==n||"number"===o&&isNaN(n)||("number"!==o||x.cssNumber[a]||(n+="px"),x.support.clearCloneStyle||""!==n||0!==t.indexOf("background")||(u[t]="inherit"),s&&"set"in s&&(n=s.set(e,n,r))===undefined||(u[t]=n)),undefined)}},css:function(e,t,n,r){var i,o,s,a=x.camelCase(t);return t=x.cssProps[a]||(x.cssProps[a]=Dt(e.style,a)),s=x.cssHooks[t]||x.cssHooks[a],s&&"get"in s&&(i=s.get(e,!0,n)),i===undefined&&(i=yt(e,t,r)),"normal"===i&&t in Et&&(i=Et[t]),""===n||n?(o=parseFloat(i),n===!0||x.isNumeric(o)?o||0:i):i}}),yt=function(e,t,n){var r,i,o,s=n||Lt(e),a=s?s.getPropertyValue(t)||s[t]:undefined,u=e.style;return s&&(""!==a||x.contains(e.ownerDocument,e)||(a=x.style(e,t)),Tt.test(a)&&bt.test(t)&&(r=u.width,i=u.minWidth,o=u.maxWidth,u.minWidth=u.maxWidth=u.width=a,a=s.width,u.width=r,u.minWidth=i,u.maxWidth=o)),a};function Ht(e,t,n){var r=wt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function Ot(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,s=0;for(;4>o;o+=2)"margin"===n&&(s+=x.css(e,n+St[o],!0,i)),r?("content"===n&&(s-=x.css(e,"padding"+St[o],!0,i)),"margin"!==n&&(s-=x.css(e,"border"+St[o]+"Width",!0,i))):(s+=x.css(e,"padding"+St[o],!0,i),"padding"!==n&&(s+=x.css(e,"border"+St[o]+"Width",!0,i)));return s}function Ft(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Lt(e),s=x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=yt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Tt.test(i))return i;r=s&&(x.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+Ot(e,t,n||(s?"border":"content"),r,o)+"px"}function Pt(e){var t=o,n=kt[e];return n||(n=Rt(e,t),"none"!==n&&n||(vt=(vt||x("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(vt[0].contentWindow||vt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=Rt(e,t),vt.detach()),kt[e]=n),n}function Rt(e,t){var n=x(t.createElement(e)).appendTo(t.body),r=x.css(n[0],"display");return n.remove(),r}x.each(["height","width"],function(e,t){x.cssHooks[t]={get:function(e,n,r){return n?0===e.offsetWidth&&xt.test(x.css(e,"display"))?x.swap(e,Nt,function(){return Ft(e,t,r)}):Ft(e,t,r):undefined},set:function(e,n,r){var i=r&&Lt(e);return Ht(e,n,r?Ot(e,t,r,x.support.boxSizing&&"border-box"===x.css(e,"boxSizing",!1,i),i):0)}}}),x(function(){x.support.reliableMarginRight||(x.cssHooks.marginRight={get:function(e,t){return t?x.swap(e,{display:"inline-block"},yt,[e,"marginRight"]):undefined}}),!x.support.pixelPosition&&x.fn.position&&x.each(["top","left"],function(e,t){x.cssHooks[t]={get:function(e,n){return n?(n=yt(e,t),Tt.test(n)?x(e).position()[t]+"px":n):undefined}}})}),x.expr&&x.expr.filters&&(x.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight},x.expr.filters.visible=function(e){return!x.expr.filters.hidden(e)}),x.each({margin:"",padding:"",border:"Width"},function(e,t){x.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+St[r]+t]=o[r]||o[r-2]||o[0];return i}},bt.test(e)||(x.cssHooks[e+t].set=Ht)});var Mt=/%20/g,Wt=/\[\]$/,$t=/\r?\n/g,Bt=/^(?:submit|button|image|reset|file)$/i,It=/^(?:input|select|textarea|keygen)/i;x.fn.extend({serialize:function(){return x.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=x.prop(this,"elements");return e?x.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!x(this).is(":disabled")&&It.test(this.nodeName)&&!Bt.test(e)&&(this.checked||!it.test(e))}).map(function(e,t){var n=x(this).val();return null==n?null:x.isArray(n)?x.map(n,function(e){return{name:t.name,value:e.replace($t,"\r\n")}}):{name:t.name,value:n.replace($t,"\r\n")}}).get()}}),x.param=function(e,t){var n,r=[],i=function(e,t){t=x.isFunction(t)?t():null==t?"":t,r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(t===undefined&&(t=x.ajaxSettings&&x.ajaxSettings.traditional),x.isArray(e)||e.jquery&&!x.isPlainObject(e))x.each(e,function(){i(this.name,this.value)});else for(n in e)zt(n,e[n],t,i);return r.join("&").replace(Mt,"+")};function zt(e,t,n,r){var i;if(x.isArray(t))x.each(t,function(t,i){n||Wt.test(e)?r(e,i):zt(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==x.type(t))r(e,t);else for(i in t)zt(e+"["+i+"]",t[i],n,r)}x.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){x.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),x.fn.extend({hover:function(e,t){return this.mouseenter(e).mouseleave(t||e)},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)}});var _t,Xt,Ut=x.now(),Yt=/\?/,Vt=/#.*$/,Gt=/([?&])_=[^&]*/,Jt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Qt=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Kt=/^(?:GET|HEAD)$/,Zt=/^\/\//,en=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,tn=x.fn.load,nn={},rn={},on="*/".concat("*");try{Xt=i.href}catch(sn){Xt=o.createElement("a"),Xt.href="",Xt=Xt.href}_t=en.exec(Xt.toLowerCase())||[];function an(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];
if(x.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function un(e,t,n,r){var i={},o=e===rn;function s(a){var u;return i[a]=!0,x.each(e[a]||[],function(e,a){var l=a(t,n,r);return"string"!=typeof l||o||i[l]?o?!(u=l):undefined:(t.dataTypes.unshift(l),s(l),!1)}),u}return s(t.dataTypes[0])||!i["*"]&&s("*")}function ln(e,t){var n,r,i=x.ajaxSettings.flatOptions||{};for(n in t)t[n]!==undefined&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&x.extend(!0,e,r),e}x.fn.load=function(e,t,n){if("string"!=typeof e&&tn)return tn.apply(this,arguments);var r,i,o,s=this,a=e.indexOf(" ");return a>=0&&(r=e.slice(a),e=e.slice(0,a)),x.isFunction(t)?(n=t,t=undefined):t&&"object"==typeof t&&(i="POST"),s.length>0&&x.ajax({url:e,type:i,dataType:"html",data:t}).done(function(e){o=arguments,s.html(r?x("<div>").append(x.parseHTML(e)).find(r):e)}).complete(n&&function(e,t){s.each(n,o||[e.responseText,t,e])}),this},x.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){x.fn[t]=function(e){return this.on(t,e)}}),x.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Xt,type:"GET",isLocal:Qt.test(_t[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":on,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":x.parseJSON,"text xml":x.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?ln(ln(e,x.ajaxSettings),t):ln(x.ajaxSettings,e)},ajaxPrefilter:an(nn),ajaxTransport:an(rn),ajax:function(e,t){"object"==typeof e&&(t=e,e=undefined),t=t||{};var n,r,i,o,s,a,u,l,c=x.ajaxSetup({},t),f=c.context||c,p=c.context&&(f.nodeType||f.jquery)?x(f):x.event,h=x.Deferred(),d=x.Callbacks("once memory"),g=c.statusCode||{},m={},y={},v=0,b="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(2===v){if(!o){o={};while(t=Jt.exec(i))o[t[1].toLowerCase()]=t[2]}t=o[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===v?i:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return v||(e=y[n]=y[n]||e,m[e]=t),this},overrideMimeType:function(e){return v||(c.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>v)for(t in e)g[t]=[g[t],e[t]];else T.always(e[T.status]);return this},abort:function(e){var t=e||b;return n&&n.abort(t),k(0,t),this}};if(h.promise(T).complete=d.add,T.success=T.done,T.error=T.fail,c.url=((e||c.url||Xt)+"").replace(Vt,"").replace(Zt,_t[1]+"//"),c.type=t.method||t.type||c.method||c.type,c.dataTypes=x.trim(c.dataType||"*").toLowerCase().match(w)||[""],null==c.crossDomain&&(a=en.exec(c.url.toLowerCase()),c.crossDomain=!(!a||a[1]===_t[1]&&a[2]===_t[2]&&(a[3]||("http:"===a[1]?"80":"443"))===(_t[3]||("http:"===_t[1]?"80":"443")))),c.data&&c.processData&&"string"!=typeof c.data&&(c.data=x.param(c.data,c.traditional)),un(nn,c,t,T),2===v)return T;u=c.global,u&&0===x.active++&&x.event.trigger("ajaxStart"),c.type=c.type.toUpperCase(),c.hasContent=!Kt.test(c.type),r=c.url,c.hasContent||(c.data&&(r=c.url+=(Yt.test(r)?"&":"?")+c.data,delete c.data),c.cache===!1&&(c.url=Gt.test(r)?r.replace(Gt,"$1_="+Ut++):r+(Yt.test(r)?"&":"?")+"_="+Ut++)),c.ifModified&&(x.lastModified[r]&&T.setRequestHeader("If-Modified-Since",x.lastModified[r]),x.etag[r]&&T.setRequestHeader("If-None-Match",x.etag[r])),(c.data&&c.hasContent&&c.contentType!==!1||t.contentType)&&T.setRequestHeader("Content-Type",c.contentType),T.setRequestHeader("Accept",c.dataTypes[0]&&c.accepts[c.dataTypes[0]]?c.accepts[c.dataTypes[0]]+("*"!==c.dataTypes[0]?", "+on+"; q=0.01":""):c.accepts["*"]);for(l in c.headers)T.setRequestHeader(l,c.headers[l]);if(c.beforeSend&&(c.beforeSend.call(f,T,c)===!1||2===v))return T.abort();b="abort";for(l in{success:1,error:1,complete:1})T[l](c[l]);if(n=un(rn,c,t,T)){T.readyState=1,u&&p.trigger("ajaxSend",[T,c]),c.async&&c.timeout>0&&(s=setTimeout(function(){T.abort("timeout")},c.timeout));try{v=1,n.send(m,k)}catch(C){if(!(2>v))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,t,o,a){var l,m,y,b,w,C=t;2!==v&&(v=2,s&&clearTimeout(s),n=undefined,i=a||"",T.readyState=e>0?4:0,l=e>=200&&300>e||304===e,o&&(b=cn(c,T,o)),b=fn(c,b,T,l),l?(c.ifModified&&(w=T.getResponseHeader("Last-Modified"),w&&(x.lastModified[r]=w),w=T.getResponseHeader("etag"),w&&(x.etag[r]=w)),204===e?C="nocontent":304===e?C="notmodified":(C=b.state,m=b.data,y=b.error,l=!y)):(y=C,(e||!C)&&(C="error",0>e&&(e=0))),T.status=e,T.statusText=(t||C)+"",l?h.resolveWith(f,[m,C,T]):h.rejectWith(f,[T,C,y]),T.statusCode(g),g=undefined,u&&p.trigger(l?"ajaxSuccess":"ajaxError",[T,c,l?m:y]),d.fireWith(f,[T,C]),u&&(p.trigger("ajaxComplete",[T,c]),--x.active||x.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return x.get(e,t,n,"json")},getScript:function(e,t){return x.get(e,undefined,t,"script")}}),x.each(["get","post"],function(e,t){x[t]=function(e,n,r,i){return x.isFunction(n)&&(i=i||r,r=n,n=undefined),x.ajax({url:e,type:t,dataType:i,data:n,success:r})}});function cn(e,t,n){var r,i,o,s,a=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),r===undefined&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in a)if(a[i]&&a[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}s||(s=i)}o=o||s}return o?(o!==u[0]&&u.unshift(o),n[o]):undefined}function fn(e,t,n,r){var i,o,s,a,u,l={},c=e.dataTypes.slice();if(c[1])for(s in e.converters)l[s.toLowerCase()]=e.converters[s];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(s=l[u+" "+o]||l["* "+o],!s)for(i in l)if(a=i.split(" "),a[1]===o&&(s=l[u+" "+a[0]]||l["* "+a[0]])){s===!0?s=l[i]:l[i]!==!0&&(o=a[0],c.unshift(a[1]));break}if(s!==!0)if(s&&e["throws"])t=s(t);else try{t=s(t)}catch(f){return{state:"parsererror",error:s?f:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}x.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return x.globalEval(e),e}}}),x.ajaxPrefilter("script",function(e){e.cache===undefined&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),x.ajaxTransport("script",function(e){if(e.crossDomain){var t,n;return{send:function(r,i){t=x("<script>").prop({async:!0,charset:e.scriptCharset,src:e.url}).on("load error",n=function(e){t.remove(),n=null,e&&i("error"===e.type?404:200,e.type)}),o.head.appendChild(t[0])},abort:function(){n&&n()}}}});var pn=[],hn=/(=)\?(?=&|$)|\?\?/;x.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=pn.pop()||x.expando+"_"+Ut++;return this[e]=!0,e}}),x.ajaxPrefilter("json jsonp",function(t,n,r){var i,o,s,a=t.jsonp!==!1&&(hn.test(t.url)?"url":"string"==typeof t.data&&!(t.contentType||"").indexOf("application/x-www-form-urlencoded")&&hn.test(t.data)&&"data");return a||"jsonp"===t.dataTypes[0]?(i=t.jsonpCallback=x.isFunction(t.jsonpCallback)?t.jsonpCallback():t.jsonpCallback,a?t[a]=t[a].replace(hn,"$1"+i):t.jsonp!==!1&&(t.url+=(Yt.test(t.url)?"&":"?")+t.jsonp+"="+i),t.converters["script json"]=function(){return s||x.error(i+" was not called"),s[0]},t.dataTypes[0]="json",o=e[i],e[i]=function(){s=arguments},r.always(function(){e[i]=o,t[i]&&(t.jsonpCallback=n.jsonpCallback,pn.push(i)),s&&x.isFunction(o)&&o(s[0]),s=o=undefined}),"script"):undefined}),x.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(e){}};var dn=x.ajaxSettings.xhr(),gn={0:200,1223:204},mn=0,yn={};e.ActiveXObject&&x(e).on("unload",function(){for(var e in yn)yn[e]();yn=undefined}),x.support.cors=!!dn&&"withCredentials"in dn,x.support.ajax=dn=!!dn,x.ajaxTransport(function(e){var t;return x.support.cors||dn&&!e.crossDomain?{send:function(n,r){var i,o,s=e.xhr();if(s.open(e.type,e.url,e.async,e.username,e.password),e.xhrFields)for(i in e.xhrFields)s[i]=e.xhrFields[i];e.mimeType&&s.overrideMimeType&&s.overrideMimeType(e.mimeType),e.crossDomain||n["X-Requested-With"]||(n["X-Requested-With"]="XMLHttpRequest");for(i in n)s.setRequestHeader(i,n[i]);t=function(e){return function(){t&&(delete yn[o],t=s.onload=s.onerror=null,"abort"===e?s.abort():"error"===e?r(s.status||404,s.statusText):r(gn[s.status]||s.status,s.statusText,"string"==typeof s.responseText?{text:s.responseText}:undefined,s.getAllResponseHeaders()))}},s.onload=t(),s.onerror=t("error"),t=yn[o=mn++]=t("abort"),s.send(e.hasContent&&e.data||null)},abort:function(){t&&t()}}:undefined});var vn,xn,bn=/^(?:toggle|show|hide)$/,wn=RegExp("^(?:([+-])=|)("+b+")([a-z%]*)$","i"),Tn=/queueHooks$/,Cn=[Dn],kn={"*":[function(e,t){var n,r,i=this.createTween(e,t),o=wn.exec(t),s=i.cur(),a=+s||0,u=1,l=20;if(o){if(n=+o[2],r=o[3]||(x.cssNumber[e]?"":"px"),"px"!==r&&a){a=x.css(i.elem,e,!0)||n||1;do u=u||".5",a/=u,x.style(i.elem,e,a+r);while(u!==(u=i.cur()/s)&&1!==u&&--l)}i.unit=r,i.start=a,i.end=o[1]?a+(o[1]+1)*n:n}return i}]};function Nn(){return setTimeout(function(){vn=undefined}),vn=x.now()}function En(e,t){x.each(t,function(t,n){var r=(kn[t]||[]).concat(kn["*"]),i=0,o=r.length;for(;o>i;i++)if(r[i].call(e,t,n))return})}function Sn(e,t,n){var r,i,o=0,s=Cn.length,a=x.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=vn||Nn(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,s=0,u=l.tweens.length;for(;u>s;s++)l.tweens[s].run(o);return a.notifyWith(e,[l,o,n]),1>o&&u?n:(a.resolveWith(e,[l]),!1)},l=a.promise({elem:e,props:x.extend({},t),opts:x.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:vn||Nn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=x.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?a.resolveWith(e,[l,t]):a.rejectWith(e,[l,t]),this}}),c=l.props;for(jn(c,l.opts.specialEasing);s>o;o++)if(r=Cn[o].call(l,e,c,l.opts))return r;return En(l,c),x.isFunction(l.opts.start)&&l.opts.start.call(e,l),x.fx.timer(x.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function jn(e,t){var n,r,i,o,s;for(n in e)if(r=x.camelCase(n),i=t[r],o=e[n],x.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),s=x.cssHooks[r],s&&"expand"in s){o=s.expand(o),delete e[r];for(n in o)n in e||(e[n]=o[n],t[n]=i)}else t[r]=i}x.Animation=x.extend(Sn,{tweener:function(e,t){x.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],kn[n]=kn[n]||[],kn[n].unshift(t)},prefilter:function(e,t){t?Cn.unshift(e):Cn.push(e)}});function Dn(e,t,n){var r,i,o,s,a,u,l,c,f,p=this,h=e.style,d={},g=[],m=e.nodeType&&At(e);n.queue||(c=x._queueHooks(e,"fx"),null==c.unqueued&&(c.unqueued=0,f=c.empty.fire,c.empty.fire=function(){c.unqueued||f()}),c.unqueued++,p.always(function(){p.always(function(){c.unqueued--,x.queue(e,"fx").length||c.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[h.overflow,h.overflowX,h.overflowY],"inline"===x.css(e,"display")&&"none"===x.css(e,"float")&&(h.display="inline-block")),n.overflow&&(h.overflow="hidden",p.always(function(){h.overflow=n.overflow[0],h.overflowX=n.overflow[1],h.overflowY=n.overflow[2]})),a=q.get(e,"fxshow");for(r in t)if(o=t[r],bn.exec(o)){if(delete t[r],u=u||"toggle"===o,o===(m?"hide":"show")){if("show"!==o||a===undefined||a[r]===undefined)continue;m=!0}g.push(r)}if(s=g.length){a=q.get(e,"fxshow")||q.access(e,"fxshow",{}),"hidden"in a&&(m=a.hidden),u&&(a.hidden=!m),m?x(e).show():p.done(function(){x(e).hide()}),p.done(function(){var t;q.remove(e,"fxshow");for(t in d)x.style(e,t,d[t])});for(r=0;s>r;r++)i=g[r],l=p.createTween(i,m?a[i]:0),d[i]=a[i]||x.style(e,i),i in a||(a[i]=l.start,m&&(l.end=l.start,l.start="width"===i||"height"===i?1:0))}}function An(e,t,n,r,i){return new An.prototype.init(e,t,n,r,i)}x.Tween=An,An.prototype={constructor:An,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(x.cssNumber[n]?"":"px")},cur:function(){var e=An.propHooks[this.prop];return e&&e.get?e.get(this):An.propHooks._default.get(this)},run:function(e){var t,n=An.propHooks[this.prop];return this.pos=t=this.options.duration?x.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):An.propHooks._default.set(this),this}},An.prototype.init.prototype=An.prototype,An.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=x.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){x.fx.step[e.prop]?x.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[x.cssProps[e.prop]]||x.cssHooks[e.prop])?x.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},An.propHooks.scrollTop=An.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},x.each(["toggle","show","hide"],function(e,t){var n=x.fn[t];x.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(Ln(t,!0),e,r,i)}}),x.fn.extend({fadeTo:function(e,t,n,r){return this.filter(At).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=x.isEmptyObject(e),o=x.speed(t,n,r),s=function(){var t=Sn(this,x.extend({},e),o);s.finish=function(){t.stop(!0)},(i||q.get(this,"finish"))&&t.stop(!0)};return s.finish=s,i||o.queue===!1?this.each(s):this.queue(o.queue,s)},stop:function(e,t,n){var r=function(e){var t=e.stop;delete e.stop,t(n)};return"string"!=typeof e&&(n=t,t=e,e=undefined),t&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,i=null!=e&&e+"queueHooks",o=x.timers,s=q.get(this);if(i)s[i]&&s[i].stop&&r(s[i]);else for(i in s)s[i]&&s[i].stop&&Tn.test(i)&&r(s[i]);for(i=o.length;i--;)o[i].elem!==this||null!=e&&o[i].queue!==e||(o[i].anim.stop(n),t=!1,o.splice(i,1));(t||!n)&&x.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=q.get(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=x.timers,s=r?r.length:0;for(n.finish=!0,x.queue(this,e,[]),i&&i.cur&&i.cur.finish&&i.cur.finish.call(this),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;s>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function Ln(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=St[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}x.each({slideDown:Ln("show"),slideUp:Ln("hide"),slideToggle:Ln("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){x.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),x.speed=function(e,t,n){var r=e&&"object"==typeof e?x.extend({},e):{complete:n||!n&&t||x.isFunction(e)&&e,duration:e,easing:n&&t||t&&!x.isFunction(t)&&t};return r.duration=x.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in x.fx.speeds?x.fx.speeds[r.duration]:x.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){x.isFunction(r.old)&&r.old.call(this),r.queue&&x.dequeue(this,r.queue)},r},x.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},x.timers=[],x.fx=An.prototype.init,x.fx.tick=function(){var e,t=x.timers,n=0;for(vn=x.now();t.length>n;n++)e=t[n],e()||t[n]!==e||t.splice(n--,1);t.length||x.fx.stop(),vn=undefined},x.fx.timer=function(e){e()&&x.timers.push(e)&&x.fx.start()},x.fx.interval=13,x.fx.start=function(){xn||(xn=setInterval(x.fx.tick,x.fx.interval))},x.fx.stop=function(){clearInterval(xn),xn=null},x.fx.speeds={slow:600,fast:200,_default:400},x.fx.step={},x.expr&&x.expr.filters&&(x.expr.filters.animated=function(e){return x.grep(x.timers,function(t){return e===t.elem}).length}),x.fn.offset=function(e){if(arguments.length)return e===undefined?this:this.each(function(t){x.offset.setOffset(this,e,t)});var t,n,i=this[0],o={top:0,left:0},s=i&&i.ownerDocument;if(s)return t=s.documentElement,x.contains(t,i)?(typeof i.getBoundingClientRect!==r&&(o=i.getBoundingClientRect()),n=qn(s),{top:o.top+n.pageYOffset-t.clientTop,left:o.left+n.pageXOffset-t.clientLeft}):o},x.offset={setOffset:function(e,t,n){var r,i,o,s,a,u,l,c=x.css(e,"position"),f=x(e),p={};"static"===c&&(e.style.position="relative"),a=f.offset(),o=x.css(e,"top"),u=x.css(e,"left"),l=("absolute"===c||"fixed"===c)&&(o+u).indexOf("auto")>-1,l?(r=f.position(),s=r.top,i=r.left):(s=parseFloat(o)||0,i=parseFloat(u)||0),x.isFunction(t)&&(t=t.call(e,n,a)),null!=t.top&&(p.top=t.top-a.top+s),null!=t.left&&(p.left=t.left-a.left+i),"using"in t?t.using.call(e,p):f.css(p)}},x.fn.extend({position:function(){if(this[0]){var e,t,n=this[0],r={top:0,left:0};return"fixed"===x.css(n,"position")?t=n.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),x.nodeName(e[0],"html")||(r=e.offset()),r.top+=x.css(e[0],"borderTopWidth",!0),r.left+=x.css(e[0],"borderLeftWidth",!0)),{top:t.top-r.top-x.css(n,"marginTop",!0),left:t.left-r.left-x.css(n,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||s;while(e&&!x.nodeName(e,"html")&&"static"===x.css(e,"position"))e=e.offsetParent;return e||s})}}),x.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,n){var r="pageYOffset"===n;x.fn[t]=function(i){return x.access(this,function(t,i,o){var s=qn(t);return o===undefined?s?s[n]:t[i]:(s?s.scrollTo(r?e.pageXOffset:o,r?o:e.pageYOffset):t[i]=o,undefined)},t,i,arguments.length,null)}});function qn(e){return x.isWindow(e)?e:9===e.nodeType&&e.defaultView}x.each({Height:"height",Width:"width"},function(e,t){x.each({padding:"inner"+e,content:t,"":"outer"+e},function(n,r){x.fn[r]=function(r,i){var o=arguments.length&&(n||"boolean"!=typeof r),s=n||(r===!0||i===!0?"margin":"border");return x.access(this,function(t,n,r){var i;return x.isWindow(t)?t.document.documentElement["client"+e]:9===t.nodeType?(i=t.documentElement,Math.max(t.body["scroll"+e],i["scroll"+e],t.body["offset"+e],i["offset"+e],i["client"+e])):r===undefined?x.css(t,n,s):x.style(t,n,r,s)},t,o?r:undefined,o,null)}})}),x.fn.size=function(){return this.length},x.fn.andSelf=x.fn.addBack,"object"==typeof module&&"object"==typeof module.exports?module.exports=x:"function"==typeof define&&define.amd&&define("jquery",[],function(){return x}),"object"==typeof e&&"object"==typeof e.document&&(e.jQuery=e.$=x)})(window);
define("lib/jquery/jquery-2.0.0.min", function(){});

/*global define, _ */

define('jqueryloader',['lib/jquery/jquery-2.0.0.min'], function (jquery) {
    

    if (jquery)
    {
        return jquery.noConflict(true);
    }
    else if (window.jQuery)
    {
        return jQuery.noConflict(true);
    }
    else
    {
        throw new Error("jQuery couldn't be loaded");
    }
});
/**
 * @license
 * Lo-Dash 1.3.1 <http://lodash.com/>
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.4.4 <http://underscorejs.org/>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * Available under MIT license <http://lodash.com/license>
 */
;(function(window) {

    /** Used as a safe reference for `undefined` in pre ES5 environments */
    var undefined;

    /** Used to pool arrays and objects used internally */
    var arrayPool = [],
        objectPool = [];

    /** Used to generate unique IDs */
    var idCounter = 0;

    /** Used internally to indicate various things */
    var indicatorObject = {};

    /** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
    var keyPrefix = +new Date + '';

    /** Used as the size when optimizations are enabled for large arrays */
    var largeArraySize = 75;

    /** Used as the max size of the `arrayPool` and `objectPool` */
    var maxPoolSize = 40;

    /** Used to match empty string literals in compiled template source */
    var reEmptyStringLeading = /\b__p \+= '';/g,
        reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
        reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

    /** Used to match HTML entities */
    var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g;

    /**
     * Used to match ES6 template delimiters
     * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-7.8.6
     */
    var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

    /** Used to match regexp flags from their coerced string values */
    var reFlags = /\w*$/;

    /** Used to match "interpolate" template delimiters */
    var reInterpolate = /<%=([\s\S]+?)%>/g;

    /** Used to detect functions containing a `this` reference */
    var reThis = (reThis = /\bthis\b/) && reThis.test(runInContext) && reThis;

    /** Used to detect and test whitespace */
    var whitespace = (
        // whitespace
        ' \t\x0B\f\xA0\ufeff' +

            // line terminators
            '\n\r\u2028\u2029' +

            // unicode category "Zs" space separators
            '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'
        );

    /** Used to match leading whitespace and zeros to be removed */
    var reLeadingSpacesAndZeros = RegExp('^[' + whitespace + ']*0+(?=.$)');

    /** Used to ensure capturing order of template delimiters */
    var reNoMatch = /($^)/;

    /** Used to match HTML characters */
    var reUnescapedHtml = /[&<>"']/g;

    /** Used to match unescaped characters in compiled string literals */
    var reUnescapedString = /['\n\r\t\u2028\u2029\\]/g;

    /** Used to assign default `context` object properties */
    var contextProps = [
        'Array', 'Boolean', 'Date', 'Error', 'Function', 'Math', 'Number', 'Object',
        'RegExp', 'String', '_', 'attachEvent', 'clearTimeout', 'isFinite', 'isNaN',
        'parseInt', 'setImmediate', 'setTimeout'
    ];

    /** Used to fix the JScript [[DontEnum]] bug */
    var shadowedProps = [
        'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
        'toLocaleString', 'toString', 'valueOf'
    ];

    /** Used to make template sourceURLs easier to identify */
    var templateCounter = 0;

    /** `Object#toString` result shortcuts */
    var argsClass = '[object Arguments]',
        arrayClass = '[object Array]',
        boolClass = '[object Boolean]',
        dateClass = '[object Date]',
        errorClass = '[object Error]',
        funcClass = '[object Function]',
        numberClass = '[object Number]',
        objectClass = '[object Object]',
        regexpClass = '[object RegExp]',
        stringClass = '[object String]';

    /** Used to identify object classifications that `_.clone` supports */
    var cloneableClasses = {};
    cloneableClasses[funcClass] = false;
    cloneableClasses[argsClass] = cloneableClasses[arrayClass] =
        cloneableClasses[boolClass] = cloneableClasses[dateClass] =
            cloneableClasses[numberClass] = cloneableClasses[objectClass] =
                cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;

    /** Used to determine if values are of the language type Object */
    var objectTypes = {
        'boolean': false,
        'function': true,
        'object': true,
        'number': false,
        'string': false,
        'undefined': false
    };

    /** Used to escape characters for inclusion in compiled string literals */
    var stringEscapes = {
        '\\': '\\',
        "'": "'",
        '\n': 'n',
        '\r': 'r',
        '\t': 't',
        '\u2028': 'u2028',
        '\u2029': 'u2029'
    };

    /** Detect free variable `exports` */
    var freeExports = objectTypes[typeof exports] && exports;

    /** Detect free variable `module` */
    var freeModule = objectTypes[typeof module] && module && module.exports == freeExports && module;

    /** Detect free variable `global`, from Node.js or Browserified code, and use it as `window` */
    var freeGlobal = objectTypes[typeof global] && global;
    if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal)) {
        window = freeGlobal;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * A basic implementation of `_.indexOf` without support for binary searches
     * or `fromIndex` constraints.
     *
     * @private
     * @param {Array} array The array to search.
     * @param {Mixed} value The value to search for.
     * @param {Number} [fromIndex=0] The index to search from.
     * @returns {Number} Returns the index of the matched value or `-1`.
     */
    function basicIndexOf(array, value, fromIndex) {
        var index = (fromIndex || 0) - 1,
            length = array.length;

        while (++index < length) {
            if (array[index] === value) {
                return index;
            }
        }
        return -1;
    }

    /**
     * An implementation of `_.contains` for cache objects that mimics the return
     * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
     *
     * @private
     * @param {Object} cache The cache object to inspect.
     * @param {Mixed} value The value to search for.
     * @returns {Number} Returns `0` if `value` is found, else `-1`.
     */
    function cacheIndexOf(cache, value) {
        var type = typeof value;
        cache = cache.cache;

        if (type == 'boolean' || value == null) {
            return cache[value];
        }
        if (type != 'number' && type != 'string') {
            type = 'object';
        }
        var key = type == 'number' ? value : keyPrefix + value;
        cache = cache[type] || (cache[type] = {});

        return type == 'object'
            ? (cache[key] && basicIndexOf(cache[key], value) > -1 ? 0 : -1)
            : (cache[key] ? 0 : -1);
    }

    /**
     * Adds a given `value` to the corresponding cache object.
     *
     * @private
     * @param {Mixed} value The value to add to the cache.
     */
    function cachePush(value) {
        var cache = this.cache,
            type = typeof value;

        if (type == 'boolean' || value == null) {
            cache[value] = true;
        } else {
            if (type != 'number' && type != 'string') {
                type = 'object';
            }
            var key = type == 'number' ? value : keyPrefix + value,
                typeCache = cache[type] || (cache[type] = {});

            if (type == 'object') {
                if ((typeCache[key] || (typeCache[key] = [])).push(value) == this.array.length) {
                    cache[type] = false;
                }
            } else {
                typeCache[key] = true;
            }
        }
    }

    /**
     * Used by `_.max` and `_.min` as the default `callback` when a given
     * `collection` is a string value.
     *
     * @private
     * @param {String} value The character to inspect.
     * @returns {Number} Returns the code unit of given character.
     */
    function charAtCallback(value) {
        return value.charCodeAt(0);
    }

    /**
     * Used by `sortBy` to compare transformed `collection` values, stable sorting
     * them in ascending order.
     *
     * @private
     * @param {Object} a The object to compare to `b`.
     * @param {Object} b The object to compare to `a`.
     * @returns {Number} Returns the sort order indicator of `1` or `-1`.
     */
    function compareAscending(a, b) {
        var ai = a.index,
            bi = b.index;

        a = a.criteria;
        b = b.criteria;

        // ensure a stable sort in V8 and other engines
        // http://code.google.com/p/v8/issues/detail?id=90
        if (a !== b) {
            if (a > b || typeof a == 'undefined') {
                return 1;
            }
            if (a < b || typeof b == 'undefined') {
                return -1;
            }
        }
        return ai < bi ? -1 : 1;
    }

    /**
     * Creates a cache object to optimize linear searches of large arrays.
     *
     * @private
     * @param {Array} [array=[]] The array to search.
     * @returns {Null|Object} Returns the cache object or `null` if caching should not be used.
     */
    function createCache(array) {
        var index = -1,
            length = array.length;

        var cache = getObject();
        cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

        var result = getObject();
        result.array = array;
        result.cache = cache;
        result.push = cachePush;

        while (++index < length) {
            result.push(array[index]);
        }
        return cache.object === false
            ? (releaseObject(result), null)
            : result;
    }

    /**
     * Used by `template` to escape characters for inclusion in compiled
     * string literals.
     *
     * @private
     * @param {String} match The matched character to escape.
     * @returns {String} Returns the escaped character.
     */
    function escapeStringChar(match) {
        return '\\' + stringEscapes[match];
    }

    /**
     * Gets an array from the array pool or creates a new one if the pool is empty.
     *
     * @private
     * @returns {Array} The array from the pool.
     */
    function getArray() {
        return arrayPool.pop() || [];
    }

    /**
     * Gets an object from the object pool or creates a new one if the pool is empty.
     *
     * @private
     * @returns {Object} The object from the pool.
     */
    function getObject() {
        return objectPool.pop() || {
            'args': '',
            'array': null,
            'bottom': '',
            'cache': null,
            'criteria': null,
            'false': false,
            'firstArg': '',
            'index': 0,
            'init': '',
            'leading': false,
            'loop': '',
            'maxWait': 0,
            'null': false,
            'number': null,
            'object': null,
            'push': null,
            'shadowedProps': null,
            'string': null,
            'support': null,
            'top': '',
            'trailing': false,
            'true': false,
            'undefined': false,
            'useHas': false,
            'useKeys': false,
            'value': null
        };
    }

    /**
     * Checks if `value` is a DOM node in IE < 9.
     *
     * @private
     * @param {Mixed} value The value to check.
     * @returns {Boolean} Returns `true` if the `value` is a DOM node, else `false`.
     */
    function isNode(value) {
        // IE < 9 presents DOM nodes as `Object` objects except they have `toString`
        // methods that are `typeof` "string" and still can coerce nodes to strings
        return typeof value.toString != 'function' && typeof (value + '') == 'string';
    }

    /**
     * A no-operation function.
     *
     * @private
     */
    function noop() {
        // no operation performed
    }

    /**
     * Releases the given `array` back to the array pool.
     *
     * @private
     * @param {Array} [array] The array to release.
     */
    function releaseArray(array) {
        array.length = 0;
        if (arrayPool.length < maxPoolSize) {
            arrayPool.push(array);
        }
    }

    /**
     * Releases the given `object` back to the object pool.
     *
     * @private
     * @param {Object} [object] The object to release.
     */
    function releaseObject(object) {
        var cache = object.cache;
        if (cache) {
            releaseObject(cache);
        }
        object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
        if (objectPool.length < maxPoolSize) {
            objectPool.push(object);
        }
    }

    /**
     * Slices the `collection` from the `start` index up to, but not including,
     * the `end` index.
     *
     * Note: This function is used, instead of `Array#slice`, to support node lists
     * in IE < 9 and to ensure dense arrays are returned.
     *
     * @private
     * @param {Array|Object|String} collection The collection to slice.
     * @param {Number} start The start index.
     * @param {Number} end The end index.
     * @returns {Array} Returns the new array.
     */
    function slice(array, start, end) {
        start || (start = 0);
        if (typeof end == 'undefined') {
            end = array ? array.length : 0;
        }
        var index = -1,
            length = end - start || 0,
            result = Array(length < 0 ? 0 : length);

        while (++index < length) {
            result[index] = array[start + index];
        }
        return result;
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Create a new `lodash` function using the given `context` object.
     *
     * @static
     * @memberOf _
     * @category Utilities
     * @param {Object} [context=window] The context object.
     * @returns {Function} Returns the `lodash` function.
     */
    function runInContext(context) {
        // Avoid issues with some ES3 environments that attempt to use values, named
        // after built-in constructors like `Object`, for the creation of literals.
        // ES5 clears this up by stating that literals must use built-in constructors.
        // See http://es5.github.com/#x11.1.5.
        context = context ? _.defaults(window.Object(), context, _.pick(window, contextProps)) : window;

        /** Native constructor references */
        var Array = context.Array,
            Boolean = context.Boolean,
            Date = context.Date,
            Error = context.Error,
            Function = context.Function,
            Math = context.Math,
            Number = context.Number,
            Object = context.Object,
            RegExp = context.RegExp,
            String = context.String,
            TypeError = context.TypeError;

        /**
         * Used for `Array` method references.
         *
         * Normally `Array.prototype` would suffice, however, using an array literal
         * avoids issues in Narwhal.
         */
        var arrayRef = [];

        /** Used for native method references */
        var errorProto = Error.prototype,
            objectProto = Object.prototype,
            stringProto = String.prototype;

        /** Used to restore the original `_` reference in `noConflict` */
        var oldDash = context._;

        /** Used to detect if a method is native */
        var reNative = RegExp('^' +
            String(objectProto.valueOf)
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/valueOf|for [^\]]+/g, '.+?') + '$'
        );

        /** Native method shortcuts */
        var ceil = Math.ceil,
            clearTimeout = context.clearTimeout,
            concat = arrayRef.concat,
            floor = Math.floor,
            fnToString = Function.prototype.toString,
            getPrototypeOf = reNative.test(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,
            hasOwnProperty = objectProto.hasOwnProperty,
            push = arrayRef.push,
            propertyIsEnumerable = objectProto.propertyIsEnumerable,
            setImmediate = context.setImmediate,
            setTimeout = context.setTimeout,
            toString = objectProto.toString;

        /* Native method shortcuts for methods with the same name as other `lodash` methods */
        var nativeBind = reNative.test(nativeBind = toString.bind) && nativeBind,
            nativeCreate = reNative.test(nativeCreate =  Object.create) && nativeCreate,
            nativeIsArray = reNative.test(nativeIsArray = Array.isArray) && nativeIsArray,
            nativeIsFinite = context.isFinite,
            nativeIsNaN = context.isNaN,
            nativeKeys = reNative.test(nativeKeys = Object.keys) && nativeKeys,
            nativeMax = Math.max,
            nativeMin = Math.min,
            nativeParseInt = context.parseInt,
            nativeRandom = Math.random,
            nativeSlice = arrayRef.slice;

        /** Detect various environments */
        var isIeOpera = reNative.test(context.attachEvent),
            isV8 = nativeBind && !/\n|true/.test(nativeBind + isIeOpera);

        /** Used to lookup a built-in constructor by [[Class]] */
        var ctorByClass = {};
        ctorByClass[arrayClass] = Array;
        ctorByClass[boolClass] = Boolean;
        ctorByClass[dateClass] = Date;
        ctorByClass[funcClass] = Function;
        ctorByClass[objectClass] = Object;
        ctorByClass[numberClass] = Number;
        ctorByClass[regexpClass] = RegExp;
        ctorByClass[stringClass] = String;

        /** Used to avoid iterating non-enumerable properties in IE < 9 */
        var nonEnumProps = {};
        nonEnumProps[arrayClass] = nonEnumProps[dateClass] = nonEnumProps[numberClass] = { 'constructor': true, 'toLocaleString': true, 'toString': true, 'valueOf': true };
        nonEnumProps[boolClass] = nonEnumProps[stringClass] = { 'constructor': true, 'toString': true, 'valueOf': true };
        nonEnumProps[errorClass] = nonEnumProps[funcClass] = nonEnumProps[regexpClass] = { 'constructor': true, 'toString': true };
        nonEnumProps[objectClass] = { 'constructor': true };

        (function() {
            var length = shadowedProps.length;
            while (length--) {
                var prop = shadowedProps[length];
                for (var className in nonEnumProps) {
                    if (hasOwnProperty.call(nonEnumProps, className) && !hasOwnProperty.call(nonEnumProps[className], prop)) {
                        nonEnumProps[className][prop] = false;
                    }
                }
            }
        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a `lodash` object, which wraps the given `value`, to enable method
         * chaining.
         *
         * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:
         * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,
         * and `unshift`
         *
         * Chaining is supported in custom builds as long as the `value` method is
         * implicitly or explicitly included in the build.
         *
         * The chainable wrapper functions are:
         * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,
         * `compose`, `concat`, `countBy`, `createCallback`, `debounce`, `defaults`,
         * `defer`, `delay`, `difference`, `filter`, `flatten`, `forEach`, `forIn`,
         * `forOwn`, `functions`, `groupBy`, `initial`, `intersection`, `invert`,
         * `invoke`, `keys`, `map`, `max`, `memoize`, `merge`, `min`, `object`, `omit`,
         * `once`, `pairs`, `partial`, `partialRight`, `pick`, `pluck`, `push`, `range`,
         * `reject`, `rest`, `reverse`, `shuffle`, `slice`, `sort`, `sortBy`, `splice`,
         * `tap`, `throttle`, `times`, `toArray`, `transform`, `union`, `uniq`, `unshift`,
         * `unzip`, `values`, `where`, `without`, `wrap`, and `zip`
         *
         * The non-chainable wrapper functions are:
         * `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`, `has`,
         * `identity`, `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`,
         * `isElement`, `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`,
         * `isNull`, `isNumber`, `isObject`, `isPlainObject`, `isRegExp`, `isString`,
         * `isUndefined`, `join`, `lastIndexOf`, `mixin`, `noConflict`, `parseInt`,
         * `pop`, `random`, `reduce`, `reduceRight`, `result`, `shift`, `size`, `some`,
         * `sortedIndex`, `runInContext`, `template`, `unescape`, `uniqueId`, and `value`
         *
         * The wrapper functions `first` and `last` return wrapped values when `n` is
         * passed, otherwise they return unwrapped values.
         *
         * @name _
         * @constructor
         * @alias chain
         * @category Chaining
         * @param {Mixed} value The value to wrap in a `lodash` instance.
         * @returns {Object} Returns a `lodash` instance.
         * @example
         *
         * var wrapped = _([1, 2, 3]);
         *
         * // returns an unwrapped value
         * wrapped.reduce(function(sum, num) {
     *   return sum + num;
     * });
         * // => 6
         *
         * // returns a wrapped value
         * var squares = wrapped.map(function(num) {
     *   return num * num;
     * });
         *
         * _.isArray(squares);
         * // => false
         *
         * _.isArray(squares.value());
         * // => true
         */
        function lodash(value) {
            // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor
            return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))
                ? value
                : new lodashWrapper(value);
        }

        /**
         * A fast path for creating `lodash` wrapper objects.
         *
         * @private
         * @param {Mixed} value The value to wrap in a `lodash` instance.
         * @returns {Object} Returns a `lodash` instance.
         */
        function lodashWrapper(value) {
            this.__wrapped__ = value;
        }
        // ensure `new lodashWrapper` is an instance of `lodash`
        lodashWrapper.prototype = lodash.prototype;

        /**
         * An object used to flag environments features.
         *
         * @static
         * @memberOf _
         * @type Object
         */
        var support = lodash.support = {};

        (function() {
            var ctor = function() { this.x = 1; },
                object = { '0': 1, 'length': 1 },
                props = [];

            ctor.prototype = { 'valueOf': 1, 'y': 1 };
            for (var prop in new ctor) { props.push(prop); }
            for (prop in arguments) { }

            /**
             * Detect if `arguments` objects are `Object` objects (all but Narwhal and Opera < 10.5).
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.argsObject = arguments.constructor == Object && !(arguments instanceof Array);

            /**
             * Detect if an `arguments` object's [[Class]] is resolvable (all but Firefox < 4, IE < 9).
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.argsClass = isArguments(arguments);

            /**
             * Detect if `name` or `message` properties of `Error.prototype` are
             * enumerable by default. (IE < 9, Safari < 5.1)
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.enumErrorProps = propertyIsEnumerable.call(errorProto, 'message') || propertyIsEnumerable.call(errorProto, 'name');

            /**
             * Detect if `prototype` properties are enumerable by default.
             *
             * Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1
             * (if the prototype or a property on the prototype has been set)
             * incorrectly sets a function's `prototype` property [[Enumerable]]
             * value to `true`.
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.enumPrototypes = propertyIsEnumerable.call(ctor, 'prototype');

            /**
             * Detect if `Function#bind` exists and is inferred to be fast (all but V8).
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.fastBind = nativeBind && !isV8;

            /**
             * Detect if own properties are iterated after inherited properties (all but IE < 9).
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.ownLast = props[0] != 'x';

            /**
             * Detect if `arguments` object indexes are non-enumerable
             * (Firefox < 4, IE < 9, PhantomJS, Safari < 5.1).
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.nonEnumArgs = prop != 0;

            /**
             * Detect if properties shadowing those on `Object.prototype` are non-enumerable.
             *
             * In IE < 9 an objects own properties, shadowing non-enumerable ones, are
             * made non-enumerable as well (a.k.a the JScript [[DontEnum]] bug).
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.nonEnumShadows = !/valueOf/.test(props);

            /**
             * Detect if `Array#shift` and `Array#splice` augment array-like objects correctly.
             *
             * Firefox < 10, IE compatibility mode, and IE < 9 have buggy Array `shift()`
             * and `splice()` functions that fail to remove the last element, `value[0]`,
             * of array-like objects even though the `length` property is set to `0`.
             * The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`
             * is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.spliceObjects = (arrayRef.splice.call(object, 0, 1), !object[0]);

            /**
             * Detect lack of support for accessing string characters by index.
             *
             * IE < 8 can't access characters by index and IE 8 can only access
             * characters by index on string literals.
             *
             * @memberOf _.support
             * @type Boolean
             */
            support.unindexedChars = ('x'[0] + Object('x')[0]) != 'xx';

            /**
             * Detect if a DOM node's [[Class]] is resolvable (all but IE < 9)
             * and that the JS engine errors when attempting to coerce an object to
             * a string without a `toString` function.
             *
             * @memberOf _.support
             * @type Boolean
             */
            try {
                support.nodeClass = !(toString.call(document) == objectClass && !({ 'toString': 0 } + ''));
            } catch(e) {
                support.nodeClass = true;
            }
        }(1));

        /**
         * By default, the template delimiters used by Lo-Dash are similar to those in
         * embedded Ruby (ERB). Change the following template settings to use alternative
         * delimiters.
         *
         * @static
         * @memberOf _
         * @type Object
         */
        lodash.templateSettings = {

            /**
             * Used to detect `data` property values to be HTML-escaped.
             *
             * @memberOf _.templateSettings
             * @type RegExp
             */
            'escape': /<%-([\s\S]+?)%>/g,

            /**
             * Used to detect code to be evaluated.
             *
             * @memberOf _.templateSettings
             * @type RegExp
             */
            'evaluate': /<%([\s\S]+?)%>/g,

            /**
             * Used to detect `data` property values to inject.
             *
             * @memberOf _.templateSettings
             * @type RegExp
             */
            'interpolate': reInterpolate,

            /**
             * Used to reference the data object in the template text.
             *
             * @memberOf _.templateSettings
             * @type String
             */
            'variable': '',

            /**
             * Used to import variables into the compiled template.
             *
             * @memberOf _.templateSettings
             * @type Object
             */
            'imports': {

                /**
                 * A reference to the `lodash` function.
                 *
                 * @memberOf _.templateSettings.imports
                 * @type Function
                 */
                '_': lodash
            }
        };

        /*--------------------------------------------------------------------------*/

        /**
         * The template used to create iterator functions.
         *
         * @private
         * @param {Object} data The data object used to populate the text.
         * @returns {String} Returns the interpolated text.
         */
        var iteratorTemplate = template(
            // the `iterable` may be reassigned by the `top` snippet
            'var index, iterable = <%= firstArg %>, ' +
                // assign the `result` variable an initial value
                'result = <%= init %>;\n' +
                // exit early if the first argument is falsey
                'if (!iterable) return result;\n' +
                // add code before the iteration branches
                '<%= top %>;' +

                // array-like iteration:
                '<% if (array) { %>\n' +
                'var length = iterable.length; index = -1;\n' +
                'if (<%= array %>) {' +

                // add support for accessing string characters by index if needed
                '  <% if (support.unindexedChars) { %>\n' +
                '  if (isString(iterable)) {\n' +
                "    iterable = iterable.split('')\n" +
                '  }' +
                '  <% } %>\n' +

                // iterate over the array-like value
                '  while (++index < length) {\n' +
                '    <%= loop %>;\n' +
                '  }\n' +
                '}\n' +
                'else {' +

                // object iteration:
                // add support for iterating over `arguments` objects if needed
                '  <% } else if (support.nonEnumArgs) { %>\n' +
                '  var length = iterable.length; index = -1;\n' +
                '  if (length && isArguments(iterable)) {\n' +
                '    while (++index < length) {\n' +
                "      index += '';\n" +
                '      <%= loop %>;\n' +
                '    }\n' +
                '  } else {' +
                '  <% } %>' +

                // avoid iterating over `prototype` properties in older Firefox, Opera, and Safari
                '  <% if (support.enumPrototypes) { %>\n' +
                "  var skipProto = typeof iterable == 'function';\n" +
                '  <% } %>' +

                // avoid iterating over `Error.prototype` properties in older IE and Safari
                '  <% if (support.enumErrorProps) { %>\n' +
                '  var skipErrorProps = iterable === errorProto || iterable instanceof Error;\n' +
                '  <% } %>' +

                // define conditions used in the loop
                '  <%' +
                '    var conditions = [];' +
                '    if (support.enumPrototypes) { conditions.push(\'!(skipProto && index == "prototype")\'); }' +
                '    if (support.enumErrorProps)  { conditions.push(\'!(skipErrorProps && (index == "message" || index == "name"))\'); }' +
                '  %>' +

                // iterate own properties using `Object.keys`
                '  <% if (useHas && useKeys) { %>\n' +
                '  var ownIndex = -1,\n' +
                '      ownProps = objectTypes[typeof iterable] && keys(iterable),\n' +
                '      length = ownProps ? ownProps.length : 0;\n\n' +
                '  while (++ownIndex < length) {\n' +
                '    index = ownProps[ownIndex];\n<%' +
                "    if (conditions.length) { %>    if (<%= conditions.join(' && ') %>) {\n  <% } %>" +
                '    <%= loop %>;' +
                '    <% if (conditions.length) { %>\n    }<% } %>\n' +
                '  }' +

                // else using a for-in loop
                '  <% } else { %>\n' +
                '  for (index in iterable) {\n<%' +
                '    if (useHas) { conditions.push("hasOwnProperty.call(iterable, index)"); }' +
                "    if (conditions.length) { %>    if (<%= conditions.join(' && ') %>) {\n  <% } %>" +
                '    <%= loop %>;' +
                '    <% if (conditions.length) { %>\n    }<% } %>\n' +
                '  }' +

                // Because IE < 9 can't set the `[[Enumerable]]` attribute of an
                // existing property and the `constructor` property of a prototype
                // defaults to non-enumerable, Lo-Dash skips the `constructor`
                // property when it infers it's iterating over a `prototype` object.
                '    <% if (support.nonEnumShadows) { %>\n\n' +
                '  if (iterable !== objectProto) {\n' +
                "    var ctor = iterable.constructor,\n" +
                '        isProto = iterable === (ctor && ctor.prototype),\n' +
                '        className = iterable === stringProto ? stringClass : iterable === errorProto ? errorClass : toString.call(iterable),\n' +
                '        nonEnum = nonEnumProps[className];\n' +
                '      <% for (k = 0; k < 7; k++) { %>\n' +
                "    index = '<%= shadowedProps[k] %>';\n" +
                '    if ((!(isProto && nonEnum[index]) && hasOwnProperty.call(iterable, index))<%' +
                '        if (!useHas) { %> || (!nonEnum[index] && iterable[index] !== objectProto[index])<% }' +
                '      %>) {\n' +
                '      <%= loop %>;\n' +
                '    }' +
                '      <% } %>\n' +
                '  }' +
                '    <% } %>' +
                '  <% } %>' +
                '  <% if (array || support.nonEnumArgs) { %>\n}<% } %>\n' +

                // add code to the bottom of the iteration function
                '<%= bottom %>;\n' +
                // finally, return the `result`
                'return result'
        );

        /** Reusable iterator options for `assign` and `defaults` */
        var defaultsIteratorOptions = {
            'args': 'object, source, guard',
            'top':
                'var args = arguments,\n' +
                    '    argsIndex = 0,\n' +
                    "    argsLength = typeof guard == 'number' ? 2 : args.length;\n" +
                    'while (++argsIndex < argsLength) {\n' +
                    '  iterable = args[argsIndex];\n' +
                    '  if (iterable && objectTypes[typeof iterable]) {',
            'loop': "if (typeof result[index] == 'undefined') result[index] = iterable[index]",
            'bottom': '  }\n}'
        };

        /** Reusable iterator options shared by `each`, `forIn`, and `forOwn` */
        var eachIteratorOptions = {
            'args': 'collection, callback, thisArg',
            'top': "callback = callback && typeof thisArg == 'undefined' ? callback : lodash.createCallback(callback, thisArg)",
            'array': "typeof length == 'number'",
            'loop': 'if (callback(iterable[index], index, collection) === false) return result'
        };

        /** Reusable iterator options for `forIn` and `forOwn` */
        var forOwnIteratorOptions = {
            'top': 'if (!objectTypes[typeof iterable]) return result;\n' + eachIteratorOptions.top,
            'array': false
        };

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a function that, when called, invokes `func` with the `this` binding
         * of `thisArg` and prepends any `partialArgs` to the arguments passed to the
         * bound function.
         *
         * @private
         * @param {Function|String} func The function to bind or the method name.
         * @param {Mixed} [thisArg] The `this` binding of `func`.
         * @param {Array} partialArgs An array of arguments to be partially applied.
         * @param {Object} [idicator] Used to indicate binding by key or partially
         *  applying arguments from the right.
         * @returns {Function} Returns the new bound function.
         */
        function createBound(func, thisArg, partialArgs, indicator) {
            var isFunc = isFunction(func),
                isPartial = !partialArgs,
                key = thisArg;

            // juggle arguments
            if (isPartial) {
                var rightIndicator = indicator;
                partialArgs = thisArg;
            }
            else if (!isFunc) {
                if (!indicator) {
                    throw new TypeError;
                }
                thisArg = func;
            }

            function bound() {
                // `Function#bind` spec
                // http://es5.github.com/#x15.3.4.5
                var args = arguments,
                    thisBinding = isPartial ? this : thisArg;

                if (!isFunc) {
                    func = thisArg[key];
                }
                if (partialArgs.length) {
                    args = args.length
                        ? (args = nativeSlice.call(args), rightIndicator ? args.concat(partialArgs) : partialArgs.concat(args))
                        : partialArgs;
                }
                if (this instanceof bound) {
                    // ensure `new bound` is an instance of `func`
                    thisBinding = createObject(func.prototype);

                    // mimic the constructor's `return` behavior
                    // http://es5.github.com/#x13.2.2
                    var result = func.apply(thisBinding, args);
                    return isObject(result) ? result : thisBinding;
                }
                return func.apply(thisBinding, args);
            }
            return bound;
        }

        /**
         * Creates compiled iteration functions.
         *
         * @private
         * @param {Object} [options1, options2, ...] The compile options object(s).
         *  array - A string of code to determine if the iterable is an array or array-like.
         *  useHas - A boolean to specify using `hasOwnProperty` checks in the object loop.
         *  useKeys - A boolean to specify using `_.keys` for own property iteration.
         *  args - A string of comma separated arguments the iteration function will accept.
         *  top - A string of code to execute before the iteration branches.
         *  loop - A string of code to execute in the object loop.
         *  bottom - A string of code to execute after the iteration branches.
         * @returns {Function} Returns the compiled function.
         */
        function createIterator() {
            var data = getObject();

            // data properties
            data.shadowedProps = shadowedProps;
            data.support = support;

            // iterator options
            data.array = data.bottom = data.loop = data.top = '';
            data.init = 'iterable';
            data.useHas = true;
            data.useKeys = !!keys;

            // merge options into a template data object
            for (var object, index = 0; object = arguments[index]; index++) {
                for (var key in object) {
                    data[key] = object[key];
                }
            }
            var args = data.args;
            data.firstArg = /^[^,]+/.exec(args)[0];

            // create the function factory
            var factory = Function(
                'errorClass, errorProto, hasOwnProperty, isArguments, isArray, ' +
                    'isString, keys, lodash, objectProto, objectTypes, nonEnumProps, ' +
                    'stringClass, stringProto, toString',
                'return function(' + args + ') {\n' + iteratorTemplate(data) + '\n}'
            );

            releaseObject(data);

            // return the compiled function
            return factory(
                errorClass, errorProto, hasOwnProperty, isArguments, isArray,
                isString, keys, lodash, objectProto, objectTypes, nonEnumProps,
                stringClass, stringProto, toString
            );
        }

        /**
         * Creates a new object with the specified `prototype`.
         *
         * @private
         * @param {Object} prototype The prototype object.
         * @returns {Object} Returns the new object.
         */
        function createObject(prototype) {
            return isObject(prototype) ? nativeCreate(prototype) : {};
        }
        // fallback for browsers without `Object.create`
        if  (!nativeCreate) {
            var createObject = function(prototype) {
                if (isObject(prototype)) {
                    noop.prototype = prototype;
                    var result = new noop;
                    noop.prototype = null;
                }
                return result || {};
            };
        }

        /**
         * Used by `escape` to convert characters to HTML entities.
         *
         * @private
         * @param {String} match The matched character to escape.
         * @returns {String} Returns the escaped character.
         */
        function escapeHtmlChar(match) {
            return htmlEscapes[match];
        }

        /**
         * Gets the appropriate "indexOf" function. If the `_.indexOf` method is
         * customized, this method returns the custom method, otherwise it returns
         * the `basicIndexOf` function.
         *
         * @private
         * @returns {Function} Returns the "indexOf" function.
         */
        function getIndexOf(array, value, fromIndex) {
            var result = (result = lodash.indexOf) === indexOf ? basicIndexOf : result;
            return result;
        }

        /**
         * Creates a function that juggles arguments, allowing argument overloading
         * for `_.flatten` and `_.uniq`, before passing them to the given `func`.
         *
         * @private
         * @param {Function} func The function to wrap.
         * @returns {Function} Returns the new function.
         */
        function overloadWrapper(func) {
            return function(array, flag, callback, thisArg) {
                // juggle arguments
                if (typeof flag != 'boolean' && flag != null) {
                    thisArg = callback;
                    callback = !(thisArg && thisArg[flag] === array) ? flag : undefined;
                    flag = false;
                }
                if (callback != null) {
                    callback = lodash.createCallback(callback, thisArg);
                }
                return func(array, flag, callback, thisArg);
            };
        }

        /**
         * A fallback implementation of `isPlainObject` which checks if a given `value`
         * is an object created by the `Object` constructor, assuming objects created
         * by the `Object` constructor have no inherited enumerable properties and that
         * there are no `Object.prototype` extensions.
         *
         * @private
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if `value` is a plain object, else `false`.
         */
        function shimIsPlainObject(value) {
            var ctor,
                result;

            // avoid non Object objects, `arguments` objects, and DOM elements
            if (!(value && toString.call(value) == objectClass) ||
                (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor)) ||
                (!support.argsClass && isArguments(value)) ||
                (!support.nodeClass && isNode(value))) {
                return false;
            }
            // IE < 9 iterates inherited properties before own properties. If the first
            // iterated property is an object's own property then there are no inherited
            // enumerable properties.
            if (support.ownLast) {
                forIn(value, function(value, key, object) {
                    result = hasOwnProperty.call(object, key);
                    return false;
                });
                return result !== false;
            }
            // In most environments an object's own properties are iterated before
            // its inherited properties. If the last iterated property is an object's
            // own property then there are no inherited enumerable properties.
            forIn(value, function(value, key) {
                result = key;
            });
            return result === undefined || hasOwnProperty.call(value, result);
        }

        /**
         * Used by `unescape` to convert HTML entities to characters.
         *
         * @private
         * @param {String} match The matched character to unescape.
         * @returns {String} Returns the unescaped character.
         */
        function unescapeHtmlChar(match) {
            return htmlUnescapes[match];
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Checks if `value` is an `arguments` object.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is an `arguments` object, else `false`.
         * @example
         *
         * (function() { return _.isArguments(arguments); })(1, 2, 3);
         * // => true
         *
         * _.isArguments([1, 2, 3]);
         * // => false
         */
        function isArguments(value) {
            return toString.call(value) == argsClass;
        }
        // fallback for browsers that can't detect `arguments` objects by [[Class]]
        if (!support.argsClass) {
            isArguments = function(value) {
                return value ? hasOwnProperty.call(value, 'callee') : false;
            };
        }

        /**
         * Checks if `value` is an array.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is an array, else `false`.
         * @example
         *
         * (function() { return _.isArray(arguments); })();
         * // => false
         *
         * _.isArray([1, 2, 3]);
         * // => true
         */
        var isArray = nativeIsArray || function(value) {
            return value ? (typeof value == 'object' && toString.call(value) == arrayClass) : false;
        };

        /**
         * A fallback implementation of `Object.keys` which produces an array of the
         * given object's own enumerable property names.
         *
         * @private
         * @type Function
         * @param {Object} object The object to inspect.
         * @returns {Array} Returns a new array of property names.
         */
        var shimKeys = createIterator({
            'args': 'object',
            'init': '[]',
            'top': 'if (!(objectTypes[typeof object])) return result',
            'loop': 'result.push(index)'
        });

        /**
         * Creates an array composed of the own enumerable property names of `object`.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The object to inspect.
         * @returns {Array} Returns a new array of property names.
         * @example
         *
         * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
         * // => ['one', 'two', 'three'] (order is not guaranteed)
         */
        var keys = !nativeKeys ? shimKeys : function(object) {
            if (!isObject(object)) {
                return [];
            }
            if ((support.enumPrototypes && typeof object == 'function') ||
                (support.nonEnumArgs && object.length && isArguments(object))) {
                return shimKeys(object);
            }
            return nativeKeys(object);
        };

        /**
         * A function compiled to iterate `arguments` objects, arrays, objects, and
         * strings consistenly across environments, executing the `callback` for each
         * element in the `collection`. The `callback` is bound to `thisArg` and invoked
         * with three arguments; (value, index|key, collection). Callbacks may exit
         * iteration early by explicitly returning `false`.
         *
         * @private
         * @type Function
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function} [callback=identity] The function called per iteration.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array|Object|String} Returns `collection`.
         */
        var basicEach = createIterator(eachIteratorOptions);

        /**
         * Used to convert characters to HTML entities:
         *
         * Though the `>` character is escaped for symmetry, characters like `>` and `/`
         * don't require escaping in HTML and have no special meaning unless they're part
         * of a tag or an unquoted attribute value.
         * http://mathiasbynens.be/notes/ambiguous-ampersands (under "semi-related fun fact")
         */
        var htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        /** Used to convert HTML entities to characters */
        var htmlUnescapes = invert(htmlEscapes);

        /*--------------------------------------------------------------------------*/

        /**
         * Assigns own enumerable properties of source object(s) to the destination
         * object. Subsequent sources will overwrite property assignments of previous
         * sources. If a `callback` function is passed, it will be executed to produce
         * the assigned values. The `callback` is bound to `thisArg` and invoked with
         * two arguments; (objectValue, sourceValue).
         *
         * @static
         * @memberOf _
         * @type Function
         * @alias extend
         * @category Objects
         * @param {Object} object The destination object.
         * @param {Object} [source1, source2, ...] The source objects.
         * @param {Function} [callback] The function to customize assigning values.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Object} Returns the destination object.
         * @example
         *
         * _.assign({ 'name': 'moe' }, { 'age': 40 });
         * // => { 'name': 'moe', 'age': 40 }
         *
         * var defaults = _.partialRight(_.assign, function(a, b) {
     *   return typeof a == 'undefined' ? b : a;
     * });
         *
         * var food = { 'name': 'apple' };
         * defaults(food, { 'name': 'banana', 'type': 'fruit' });
         * // => { 'name': 'apple', 'type': 'fruit' }
         */
        var assign = createIterator(defaultsIteratorOptions, {
            'top':
                defaultsIteratorOptions.top.replace(';',
                    ';\n' +
                        "if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {\n" +
                        '  var callback = lodash.createCallback(args[--argsLength - 1], args[argsLength--], 2);\n' +
                        "} else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {\n" +
                        '  callback = args[--argsLength];\n' +
                        '}'
                ),
            'loop': 'result[index] = callback ? callback(result[index], iterable[index]) : iterable[index]'
        });

        /**
         * Creates a clone of `value`. If `deep` is `true`, nested objects will also
         * be cloned, otherwise they will be assigned by reference. If a `callback`
         * function is passed, it will be executed to produce the cloned values. If
         * `callback` returns `undefined`, cloning will be handled by the method instead.
         * The `callback` is bound to `thisArg` and invoked with one argument; (value).
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to clone.
         * @param {Boolean} [deep=false] A flag to indicate a deep clone.
         * @param {Function} [callback] The function to customize cloning values.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @param- {Array} [stackA=[]] Tracks traversed source objects.
         * @param- {Array} [stackB=[]] Associates clones with source counterparts.
         * @returns {Mixed} Returns the cloned `value`.
         * @example
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * var shallow = _.clone(stooges);
         * shallow[0] === stooges[0];
         * // => true
         *
         * var deep = _.clone(stooges, true);
         * deep[0] === stooges[0];
         * // => false
         *
         * _.mixin({
     *   'clone': _.partialRight(_.clone, function(value) {
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;
     *   })
     * });
         *
         * var clone = _.clone(document.body);
         * clone.childNodes.length;
         * // => 0
         */
        function clone(value, deep, callback, thisArg, stackA, stackB) {
            var result = value;

            // allows working with "Collections" methods without using their `callback`
            // argument, `index|key`, for this method's `callback`
            if (typeof deep != 'boolean' && deep != null) {
                thisArg = callback;
                callback = deep;
                deep = false;
            }
            if (typeof callback == 'function') {
                callback = (typeof thisArg == 'undefined')
                    ? callback
                    : lodash.createCallback(callback, thisArg, 1);

                result = callback(result);
                if (typeof result != 'undefined') {
                    return result;
                }
                result = value;
            }
            // inspect [[Class]]
            var isObj = isObject(result);
            if (isObj) {
                var className = toString.call(result);
                if (!cloneableClasses[className] || (!support.nodeClass && isNode(result))) {
                    return result;
                }
                var isArr = isArray(result);
            }
            // shallow clone
            if (!isObj || !deep) {
                return isObj
                    ? (isArr ? slice(result) : assign({}, result))
                    : result;
            }
            var ctor = ctorByClass[className];
            switch (className) {
                case boolClass:
                case dateClass:
                    return new ctor(+result);

                case numberClass:
                case stringClass:
                    return new ctor(result);

                case regexpClass:
                    return ctor(result.source, reFlags.exec(result));
            }
            // check for circular references and return corresponding clone
            var initedStack = !stackA;
            stackA || (stackA = getArray());
            stackB || (stackB = getArray());

            var length = stackA.length;
            while (length--) {
                if (stackA[length] == value) {
                    return stackB[length];
                }
            }
            // init cloned object
            result = isArr ? ctor(result.length) : {};

            // add array properties assigned by `RegExp#exec`
            if (isArr) {
                if (hasOwnProperty.call(value, 'index')) {
                    result.index = value.index;
                }
                if (hasOwnProperty.call(value, 'input')) {
                    result.input = value.input;
                }
            }
            // add the source value to the stack of traversed objects
            // and associate it with its clone
            stackA.push(value);
            stackB.push(result);

            // recursively populate clone (susceptible to call stack limits)
            (isArr ? basicEach : forOwn)(value, function(objValue, key) {
                result[key] = clone(objValue, deep, callback, undefined, stackA, stackB);
            });

            if (initedStack) {
                releaseArray(stackA);
                releaseArray(stackB);
            }
            return result;
        }

        /**
         * Creates a deep clone of `value`. If a `callback` function is passed,
         * it will be executed to produce the cloned values. If `callback` returns
         * `undefined`, cloning will be handled by the method instead. The `callback`
         * is bound to `thisArg` and invoked with one argument; (value).
         *
         * Note: This method is loosely based on the structured clone algorithm. Functions
         * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and
         * objects created by constructors other than `Object` are cloned to plain `Object` objects.
         * See http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to deep clone.
         * @param {Function} [callback] The function to customize cloning values.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the deep cloned `value`.
         * @example
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * var deep = _.cloneDeep(stooges);
         * deep[0] === stooges[0];
         * // => false
         *
         * var view = {
     *   'label': 'docs',
     *   'node': element
     * };
         *
         * var clone = _.cloneDeep(view, function(value) {
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;
     * });
         *
         * clone.node == view.node;
         * // => false
         */
        function cloneDeep(value, callback, thisArg) {
            return clone(value, true, callback, thisArg);
        }

        /**
         * Assigns own enumerable properties of source object(s) to the destination
         * object for all destination properties that resolve to `undefined`. Once a
         * property is set, additional defaults of the same property will be ignored.
         *
         * @static
         * @memberOf _
         * @type Function
         * @category Objects
         * @param {Object} object The destination object.
         * @param {Object} [source1, source2, ...] The source objects.
         * @param- {Object} [guard] Allows working with `_.reduce` without using its
         *  callback's `key` and `object` arguments as sources.
         * @returns {Object} Returns the destination object.
         * @example
         *
         * var food = { 'name': 'apple' };
         * _.defaults(food, { 'name': 'banana', 'type': 'fruit' });
         * // => { 'name': 'apple', 'type': 'fruit' }
         */
        var defaults = createIterator(defaultsIteratorOptions);

        /**
         * This method is similar to `_.find`, except that it returns the key of the
         * element that passes the callback check, instead of the element itself.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The object to search.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the key of the found element, else `undefined`.
         * @example
         *
         * _.findKey({ 'a': 1, 'b': 2, 'c': 3, 'd': 4 }, function(num) {
     *   return num % 2 == 0;
     * });
         * // => 'b'
         */
        function findKey(object, callback, thisArg) {
            var result;
            callback = lodash.createCallback(callback, thisArg);
            forOwn(object, function(value, key, object) {
                if (callback(value, key, object)) {
                    result = key;
                    return false;
                }
            });
            return result;
        }

        /**
         * Iterates over `object`'s own and inherited enumerable properties, executing
         * the `callback` for each property. The `callback` is bound to `thisArg` and
         * invoked with three arguments; (value, key, object). Callbacks may exit iteration
         * early by explicitly returning `false`.
         *
         * @static
         * @memberOf _
         * @type Function
         * @category Objects
         * @param {Object} object The object to iterate over.
         * @param {Function} [callback=identity] The function called per iteration.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Object} Returns `object`.
         * @example
         *
         * function Dog(name) {
     *   this.name = name;
     * }
         *
         * Dog.prototype.bark = function() {
     *   alert('Woof, woof!');
     * };
         *
         * _.forIn(new Dog('Dagny'), function(value, key) {
     *   alert(key);
     * });
         * // => alerts 'name' and 'bark' (order is not guaranteed)
         */
        var forIn = createIterator(eachIteratorOptions, forOwnIteratorOptions, {
            'useHas': false
        });

        /**
         * Iterates over an object's own enumerable properties, executing the `callback`
         * for each property. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, key, object). Callbacks may exit iteration early by explicitly
         * returning `false`.
         *
         * @static
         * @memberOf _
         * @type Function
         * @category Objects
         * @param {Object} object The object to iterate over.
         * @param {Function} [callback=identity] The function called per iteration.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Object} Returns `object`.
         * @example
         *
         * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {
     *   alert(key);
     * });
         * // => alerts '0', '1', and 'length' (order is not guaranteed)
         */
        var forOwn = createIterator(eachIteratorOptions, forOwnIteratorOptions);

        /**
         * Creates a sorted array of all enumerable properties, own and inherited,
         * of `object` that have function values.
         *
         * @static
         * @memberOf _
         * @alias methods
         * @category Objects
         * @param {Object} object The object to inspect.
         * @returns {Array} Returns a new array of property names that have function values.
         * @example
         *
         * _.functions(_);
         * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]
         */
        function functions(object) {
            var result = [];
            forIn(object, function(value, key) {
                if (isFunction(value)) {
                    result.push(key);
                }
            });
            return result.sort();
        }

        /**
         * Checks if the specified object `property` exists and is a direct property,
         * instead of an inherited property.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The object to check.
         * @param {String} property The property to check for.
         * @returns {Boolean} Returns `true` if key is a direct property, else `false`.
         * @example
         *
         * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');
         * // => true
         */
        function has(object, property) {
            return object ? hasOwnProperty.call(object, property) : false;
        }

        /**
         * Creates an object composed of the inverted keys and values of the given `object`.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The object to invert.
         * @returns {Object} Returns the created inverted object.
         * @example
         *
         *  _.invert({ 'first': 'moe', 'second': 'larry' });
         * // => { 'moe': 'first', 'larry': 'second' }
         */
        function invert(object) {
            var index = -1,
                props = keys(object),
                length = props.length,
                result = {};

            while (++index < length) {
                var key = props[index];
                result[object[key]] = key;
            }
            return result;
        }

        /**
         * Checks if `value` is a boolean value.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is a boolean value, else `false`.
         * @example
         *
         * _.isBoolean(null);
         * // => false
         */
        function isBoolean(value) {
            return value === true || value === false || toString.call(value) == boolClass;
        }

        /**
         * Checks if `value` is a date.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is a date, else `false`.
         * @example
         *
         * _.isDate(new Date);
         * // => true
         */
        function isDate(value) {
            return value ? (typeof value == 'object' && toString.call(value) == dateClass) : false;
        }

        /**
         * Checks if `value` is a DOM element.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is a DOM element, else `false`.
         * @example
         *
         * _.isElement(document.body);
         * // => true
         */
        function isElement(value) {
            return value ? value.nodeType === 1 : false;
        }

        /**
         * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a
         * length of `0` and objects with no own enumerable properties are considered
         * "empty".
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Array|Object|String} value The value to inspect.
         * @returns {Boolean} Returns `true`, if the `value` is empty, else `false`.
         * @example
         *
         * _.isEmpty([1, 2, 3]);
         * // => false
         *
         * _.isEmpty({});
         * // => true
         *
         * _.isEmpty('');
         * // => true
         */
        function isEmpty(value) {
            var result = true;
            if (!value) {
                return result;
            }
            var className = toString.call(value),
                length = value.length;

            if ((className == arrayClass || className == stringClass ||
                (support.argsClass ? className == argsClass : isArguments(value))) ||
                (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {
                return !length;
            }
            forOwn(value, function() {
                return (result = false);
            });
            return result;
        }

        /**
         * Performs a deep comparison between two values to determine if they are
         * equivalent to each other. If `callback` is passed, it will be executed to
         * compare values. If `callback` returns `undefined`, comparisons will be handled
         * by the method instead. The `callback` is bound to `thisArg` and invoked with
         * two arguments; (a, b).
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} a The value to compare.
         * @param {Mixed} b The other value to compare.
         * @param {Function} [callback] The function to customize comparing values.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @param- {Array} [stackA=[]] Tracks traversed `a` objects.
         * @param- {Array} [stackB=[]] Tracks traversed `b` objects.
         * @returns {Boolean} Returns `true`, if the values are equivalent, else `false`.
         * @example
         *
         * var moe = { 'name': 'moe', 'age': 40 };
         * var copy = { 'name': 'moe', 'age': 40 };
         *
         * moe == copy;
         * // => false
         *
         * _.isEqual(moe, copy);
         * // => true
         *
         * var words = ['hello', 'goodbye'];
         * var otherWords = ['hi', 'goodbye'];
         *
         * _.isEqual(words, otherWords, function(a, b) {
     *   var reGreet = /^(?:hello|hi)$/i,
     *       aGreet = _.isString(a) && reGreet.test(a),
     *       bGreet = _.isString(b) && reGreet.test(b);
     *
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;
     * });
         * // => true
         */
        function isEqual(a, b, callback, thisArg, stackA, stackB) {
            // used to indicate that when comparing objects, `a` has at least the properties of `b`
            var whereIndicator = callback === indicatorObject;
            if (typeof callback == 'function' && !whereIndicator) {
                callback = lodash.createCallback(callback, thisArg, 2);
                var result = callback(a, b);
                if (typeof result != 'undefined') {
                    return !!result;
                }
            }
            // exit early for identical values
            if (a === b) {
                // treat `+0` vs. `-0` as not equal
                return a !== 0 || (1 / a == 1 / b);
            }
            var type = typeof a,
                otherType = typeof b;

            // exit early for unlike primitive values
            if (a === a &&
                (!a || (type != 'function' && type != 'object')) &&
                (!b || (otherType != 'function' && otherType != 'object'))) {
                return false;
            }
            // exit early for `null` and `undefined`, avoiding ES3's Function#call behavior
            // http://es5.github.com/#x15.3.4.4
            if (a == null || b == null) {
                return a === b;
            }
            // compare [[Class]] names
            var className = toString.call(a),
                otherClass = toString.call(b);

            if (className == argsClass) {
                className = objectClass;
            }
            if (otherClass == argsClass) {
                otherClass = objectClass;
            }
            if (className != otherClass) {
                return false;
            }
            switch (className) {
                case boolClass:
                case dateClass:
                    // coerce dates and booleans to numbers, dates to milliseconds and booleans
                    // to `1` or `0`, treating invalid dates coerced to `NaN` as not equal
                    return +a == +b;

                case numberClass:
                    // treat `NaN` vs. `NaN` as equal
                    return (a != +a)
                        ? b != +b
                        // but treat `+0` vs. `-0` as not equal
                        : (a == 0 ? (1 / a == 1 / b) : a == +b);

                case regexpClass:
                case stringClass:
                    // coerce regexes to strings (http://es5.github.com/#x15.10.6.4)
                    // treat string primitives and their corresponding object instances as equal
                    return a == String(b);
            }
            var isArr = className == arrayClass;
            if (!isArr) {
                // unwrap any `lodash` wrapped values
                if (hasOwnProperty.call(a, '__wrapped__ ') || hasOwnProperty.call(b, '__wrapped__')) {
                    return isEqual(a.__wrapped__ || a, b.__wrapped__ || b, callback, thisArg, stackA, stackB);
                }
                // exit for functions and DOM nodes
                if (className != objectClass || (!support.nodeClass && (isNode(a) || isNode(b)))) {
                    return false;
                }
                // in older versions of Opera, `arguments` objects have `Array` constructors
                var ctorA = !support.argsObject && isArguments(a) ? Object : a.constructor,
                    ctorB = !support.argsObject && isArguments(b) ? Object : b.constructor;

                // non `Object` object instances with different constructors are not equal
                if (ctorA != ctorB && !(
                    isFunction(ctorA) && ctorA instanceof ctorA &&
                        isFunction(ctorB) && ctorB instanceof ctorB
                    )) {
                    return false;
                }
            }
            // assume cyclic structures are equal
            // the algorithm for detecting cyclic structures is adapted from ES 5.1
            // section 15.12.3, abstract operation `JO` (http://es5.github.com/#x15.12.3)
            var initedStack = !stackA;
            stackA || (stackA = getArray());
            stackB || (stackB = getArray());

            var length = stackA.length;
            while (length--) {
                if (stackA[length] == a) {
                    return stackB[length] == b;
                }
            }
            var size = 0;
            result = true;

            // add `a` and `b` to the stack of traversed objects
            stackA.push(a);
            stackB.push(b);

            // recursively compare objects and arrays (susceptible to call stack limits)
            if (isArr) {
                length = a.length;
                size = b.length;

                // compare lengths to determine if a deep comparison is necessary
                result = size == a.length;
                if (!result && !whereIndicator) {
                    return result;
                }
                // deep compare the contents, ignoring non-numeric properties
                while (size--) {
                    var index = length,
                        value = b[size];

                    if (whereIndicator) {
                        while (index--) {
                            if ((result = isEqual(a[index], value, callback, thisArg, stackA, stackB))) {
                                break;
                            }
                        }
                    } else if (!(result = isEqual(a[size], value, callback, thisArg, stackA, stackB))) {
                        break;
                    }
                }
                return result;
            }
            // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`
            // which, in this case, is more costly
            forIn(b, function(value, key, b) {
                if (hasOwnProperty.call(b, key)) {
                    // count the number of properties.
                    size++;
                    // deep compare each property value.
                    return (result = hasOwnProperty.call(a, key) && isEqual(a[key], value, callback, thisArg, stackA, stackB));
                }
            });

            if (result && !whereIndicator) {
                // ensure both objects have the same number of properties
                forIn(a, function(value, key, a) {
                    if (hasOwnProperty.call(a, key)) {
                        // `size` will be `-1` if `a` has more properties than `b`
                        return (result = --size > -1);
                    }
                });
            }
            if (initedStack) {
                releaseArray(stackA);
                releaseArray(stackB);
            }
            return result;
        }

        /**
         * Checks if `value` is, or can be coerced to, a finite number.
         *
         * Note: This is not the same as native `isFinite`, which will return true for
         * booleans and empty strings. See http://es5.github.com/#x15.1.2.5.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is finite, else `false`.
         * @example
         *
         * _.isFinite(-101);
         * // => true
         *
         * _.isFinite('10');
         * // => true
         *
         * _.isFinite(true);
         * // => false
         *
         * _.isFinite('');
         * // => false
         *
         * _.isFinite(Infinity);
         * // => false
         */
        function isFinite(value) {
            return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));
        }

        /**
         * Checks if `value` is a function.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is a function, else `false`.
         * @example
         *
         * _.isFunction(_);
         * // => true
         */
        function isFunction(value) {
            return typeof value == 'function';
        }
        // fallback for older versions of Chrome and Safari
        if (isFunction(/x/)) {
            isFunction = function(value) {
                return typeof value == 'function' && toString.call(value) == funcClass;
            };
        }

        /**
         * Checks if `value` is the language type of Object.
         * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is an object, else `false`.
         * @example
         *
         * _.isObject({});
         * // => true
         *
         * _.isObject([1, 2, 3]);
         * // => true
         *
         * _.isObject(1);
         * // => false
         */
        function isObject(value) {
            // check if the value is the ECMAScript language type of Object
            // http://es5.github.com/#x8
            // and avoid a V8 bug
            // http://code.google.com/p/v8/issues/detail?id=2291
            return !!(value && objectTypes[typeof value]);
        }

        /**
         * Checks if `value` is `NaN`.
         *
         * Note: This is not the same as native `isNaN`, which will return `true` for
         * `undefined` and other values. See http://es5.github.com/#x15.1.2.4.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is `NaN`, else `false`.
         * @example
         *
         * _.isNaN(NaN);
         * // => true
         *
         * _.isNaN(new Number(NaN));
         * // => true
         *
         * isNaN(undefined);
         * // => true
         *
         * _.isNaN(undefined);
         * // => false
         */
        function isNaN(value) {
            // `NaN` as a primitive is the only value that is not equal to itself
            // (perform the [[Class]] check first to avoid errors with some host objects in IE)
            return isNumber(value) && value != +value
        }

        /**
         * Checks if `value` is `null`.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is `null`, else `false`.
         * @example
         *
         * _.isNull(null);
         * // => true
         *
         * _.isNull(undefined);
         * // => false
         */
        function isNull(value) {
            return value === null;
        }

        /**
         * Checks if `value` is a number.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is a number, else `false`.
         * @example
         *
         * _.isNumber(8.4 * 5);
         * // => true
         */
        function isNumber(value) {
            return typeof value == 'number' || toString.call(value) == numberClass;
        }

        /**
         * Checks if a given `value` is an object created by the `Object` constructor.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if `value` is a plain object, else `false`.
         * @example
         *
         * function Stooge(name, age) {
     *   this.name = name;
     *   this.age = age;
     * }
         *
         * _.isPlainObject(new Stooge('moe', 40));
         * // => false
         *
         * _.isPlainObject([1, 2, 3]);
         * // => false
         *
         * _.isPlainObject({ 'name': 'moe', 'age': 40 });
         * // => true
         */
        var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {
            if (!(value && toString.call(value) == objectClass) || (!support.argsClass && isArguments(value))) {
                return false;
            }
            var valueOf = value.valueOf,
                objProto = typeof valueOf == 'function' && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);

            return objProto
                ? (value == objProto || getPrototypeOf(value) == objProto)
                : shimIsPlainObject(value);
        };

        /**
         * Checks if `value` is a regular expression.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is a regular expression, else `false`.
         * @example
         *
         * _.isRegExp(/moe/);
         * // => true
         */
        function isRegExp(value) {
            return !!(value && objectTypes[typeof value]) && toString.call(value) == regexpClass;
        }

        /**
         * Checks if `value` is a string.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is a string, else `false`.
         * @example
         *
         * _.isString('moe');
         * // => true
         */
        function isString(value) {
            return typeof value == 'string' || toString.call(value) == stringClass;
        }

        /**
         * Checks if `value` is `undefined`.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Mixed} value The value to check.
         * @returns {Boolean} Returns `true`, if the `value` is `undefined`, else `false`.
         * @example
         *
         * _.isUndefined(void 0);
         * // => true
         */
        function isUndefined(value) {
            return typeof value == 'undefined';
        }

        /**
         * Recursively merges own enumerable properties of the source object(s), that
         * don't resolve to `undefined`, into the destination object. Subsequent sources
         * will overwrite property assignments of previous sources. If a `callback` function
         * is passed, it will be executed to produce the merged values of the destination
         * and source properties. If `callback` returns `undefined`, merging will be
         * handled by the method instead. The `callback` is bound to `thisArg` and
         * invoked with two arguments; (objectValue, sourceValue).
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The destination object.
         * @param {Object} [source1, source2, ...] The source objects.
         * @param {Function} [callback] The function to customize merging properties.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @param- {Object} [deepIndicator] Indicates that `stackA` and `stackB` are
         *  arrays of traversed objects, instead of source objects.
         * @param- {Array} [stackA=[]] Tracks traversed source objects.
         * @param- {Array} [stackB=[]] Associates values with source counterparts.
         * @returns {Object} Returns the destination object.
         * @example
         *
         * var names = {
     *   'stooges': [
     *     { 'name': 'moe' },
     *     { 'name': 'larry' }
     *   ]
     * };
         *
         * var ages = {
     *   'stooges': [
     *     { 'age': 40 },
     *     { 'age': 50 }
     *   ]
     * };
         *
         * _.merge(names, ages);
         * // => { 'stooges': [{ 'name': 'moe', 'age': 40 }, { 'name': 'larry', 'age': 50 }] }
         *
         * var food = {
     *   'fruits': ['apple'],
     *   'vegetables': ['beet']
     * };
         *
         * var otherFood = {
     *   'fruits': ['banana'],
     *   'vegetables': ['carrot']
     * };
         *
         * _.merge(food, otherFood, function(a, b) {
     *   return _.isArray(a) ? a.concat(b) : undefined;
     * });
         * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }
         */
        function merge(object, source, deepIndicator) {
            var args = arguments,
                index = 0,
                length = 2;

            if (!isObject(object)) {
                return object;
            }
            if (deepIndicator === indicatorObject) {
                var callback = args[3],
                    stackA = args[4],
                    stackB = args[5];
            } else {
                var initedStack = true;
                stackA = getArray();
                stackB = getArray();

                // allows working with `_.reduce` and `_.reduceRight` without
                // using their `callback` arguments, `index|key` and `collection`
                if (typeof deepIndicator != 'number') {
                    length = args.length;
                }
                if (length > 3 && typeof args[length - 2] == 'function') {
                    callback = lodash.createCallback(args[--length - 1], args[length--], 2);
                } else if (length > 2 && typeof args[length - 1] == 'function') {
                    callback = args[--length];
                }
            }
            while (++index < length) {
                (isArray(args[index]) ? forEach : forOwn)(args[index], function(source, key) {
                    var found,
                        isArr,
                        result = source,
                        value = object[key];

                    if (source && ((isArr = isArray(source)) || isPlainObject(source))) {
                        // avoid merging previously merged cyclic sources
                        var stackLength = stackA.length;
                        while (stackLength--) {
                            if ((found = stackA[stackLength] == source)) {
                                value = stackB[stackLength];
                                break;
                            }
                        }
                        if (!found) {
                            var isShallow;
                            if (callback) {
                                result = callback(value, source);
                                if ((isShallow = typeof result != 'undefined')) {
                                    value = result;
                                }
                            }
                            if (!isShallow) {
                                value = isArr
                                    ? (isArray(value) ? value : [])
                                    : (isPlainObject(value) ? value : {});
                            }
                            // add `source` and associated `value` to the stack of traversed objects
                            stackA.push(source);
                            stackB.push(value);

                            // recursively merge objects and arrays (susceptible to call stack limits)
                            if (!isShallow) {
                                value = merge(value, source, indicatorObject, callback, stackA, stackB);
                            }
                        }
                    }
                    else {
                        if (callback) {
                            result = callback(value, source);
                            if (typeof result == 'undefined') {
                                result = source;
                            }
                        }
                        if (typeof result != 'undefined') {
                            value = result;
                        }
                    }
                    object[key] = value;
                });
            }

            if (initedStack) {
                releaseArray(stackA);
                releaseArray(stackB);
            }
            return object;
        }

        /**
         * Creates a shallow clone of `object` excluding the specified properties.
         * Property names may be specified as individual arguments or as arrays of
         * property names. If a `callback` function is passed, it will be executed
         * for each property in the `object`, omitting the properties `callback`
         * returns truthy for. The `callback` is bound to `thisArg` and invoked
         * with three arguments; (value, key, object).
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The source object.
         * @param {Function|String} callback|[prop1, prop2, ...] The properties to omit
         *  or the function called per iteration.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Object} Returns an object without the omitted properties.
         * @example
         *
         * _.omit({ 'name': 'moe', 'age': 40 }, 'age');
         * // => { 'name': 'moe' }
         *
         * _.omit({ 'name': 'moe', 'age': 40 }, function(value) {
     *   return typeof value == 'number';
     * });
         * // => { 'name': 'moe' }
         */
        function omit(object, callback, thisArg) {
            var indexOf = getIndexOf(),
                isFunc = typeof callback == 'function',
                result = {};

            if (isFunc) {
                callback = lodash.createCallback(callback, thisArg);
            } else {
                var props = concat.apply(arrayRef, nativeSlice.call(arguments, 1));
            }
            forIn(object, function(value, key, object) {
                if (isFunc
                    ? !callback(value, key, object)
                    : indexOf(props, key) < 0
                    ) {
                    result[key] = value;
                }
            });
            return result;
        }

        /**
         * Creates a two dimensional array of the given object's key-value pairs,
         * i.e. `[[key1, value1], [key2, value2]]`.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The object to inspect.
         * @returns {Array} Returns new array of key-value pairs.
         * @example
         *
         * _.pairs({ 'moe': 30, 'larry': 40 });
         * // => [['moe', 30], ['larry', 40]] (order is not guaranteed)
         */
        function pairs(object) {
            var index = -1,
                props = keys(object),
                length = props.length,
                result = Array(length);

            while (++index < length) {
                var key = props[index];
                result[index] = [key, object[key]];
            }
            return result;
        }

        /**
         * Creates a shallow clone of `object` composed of the specified properties.
         * Property names may be specified as individual arguments or as arrays of property
         * names. If `callback` is passed, it will be executed for each property in the
         * `object`, picking the properties `callback` returns truthy for. The `callback`
         * is bound to `thisArg` and invoked with three arguments; (value, key, object).
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The source object.
         * @param {Array|Function|String} callback|[prop1, prop2, ...] The function called
         *  per iteration or properties to pick, either as individual arguments or arrays.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Object} Returns an object composed of the picked properties.
         * @example
         *
         * _.pick({ 'name': 'moe', '_userid': 'moe1' }, 'name');
         * // => { 'name': 'moe' }
         *
         * _.pick({ 'name': 'moe', '_userid': 'moe1' }, function(value, key) {
     *   return key.charAt(0) != '_';
     * });
         * // => { 'name': 'moe' }
         */
        function pick(object, callback, thisArg) {
            var result = {};
            if (typeof callback != 'function') {
                var index = -1,
                    props = concat.apply(arrayRef, nativeSlice.call(arguments, 1)),
                    length = isObject(object) ? props.length : 0;

                while (++index < length) {
                    var key = props[index];
                    if (key in object) {
                        result[key] = object[key];
                    }
                }
            } else {
                callback = lodash.createCallback(callback, thisArg);
                forIn(object, function(value, key, object) {
                    if (callback(value, key, object)) {
                        result[key] = value;
                    }
                });
            }
            return result;
        }

        /**
         * An alternative to `_.reduce`, this method transforms an `object` to a new
         * `accumulator` object which is the result of running each of its elements
         * through the `callback`, with each `callback` execution potentially mutating
         * the `accumulator` object. The `callback` is bound to `thisArg` and invoked
         * with four arguments; (accumulator, value, key, object). Callbacks may exit
         * iteration early by explicitly returning `false`.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Array|Object} collection The collection to iterate over.
         * @param {Function} [callback=identity] The function called per iteration.
         * @param {Mixed} [accumulator] The custom accumulator value.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the accumulated value.
         * @example
         *
         * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function(result, num) {
     *   num *= num;
     *   if (num % 2) {
     *     return result.push(num) < 3;
     *   }
     * });
         * // => [1, 9, 25]
         *
         * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     * });
         * // => { 'a': 3, 'b': 6, 'c': 9 }
         */
        function transform(object, callback, accumulator, thisArg) {
            var isArr = isArray(object);
            callback = lodash.createCallback(callback, thisArg, 4);

            if (accumulator == null) {
                if (isArr) {
                    accumulator = [];
                } else {
                    var ctor = object && object.constructor,
                        proto = ctor && ctor.prototype;

                    accumulator = createObject(proto);
                }
            }
            (isArr ? basicEach : forOwn)(object, function(value, index, object) {
                return callback(accumulator, value, index, object);
            });
            return accumulator;
        }

        /**
         * Creates an array composed of the own enumerable property values of `object`.
         *
         * @static
         * @memberOf _
         * @category Objects
         * @param {Object} object The object to inspect.
         * @returns {Array} Returns a new array of property values.
         * @example
         *
         * _.values({ 'one': 1, 'two': 2, 'three': 3 });
         * // => [1, 2, 3] (order is not guaranteed)
         */
        function values(object) {
            var index = -1,
                props = keys(object),
                length = props.length,
                result = Array(length);

            while (++index < length) {
                result[index] = object[props[index]];
            }
            return result;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Creates an array of elements from the specified indexes, or keys, of the
         * `collection`. Indexes may be specified as individual arguments or as arrays
         * of indexes.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Array|Number|String} [index1, index2, ...] The indexes of
         *  `collection` to retrieve, either as individual arguments or arrays.
         * @returns {Array} Returns a new array of elements corresponding to the
         *  provided indexes.
         * @example
         *
         * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);
         * // => ['a', 'c', 'e']
         *
         * _.at(['moe', 'larry', 'curly'], 0, 2);
         * // => ['moe', 'curly']
         */
        function at(collection) {
            var index = -1,
                props = concat.apply(arrayRef, nativeSlice.call(arguments, 1)),
                length = props.length,
                result = Array(length);

            if (support.unindexedChars && isString(collection)) {
                collection = collection.split('');
            }
            while(++index < length) {
                result[index] = collection[props[index]];
            }
            return result;
        }

        /**
         * Checks if a given `target` element is present in a `collection` using strict
         * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
         * as the offset from the end of the collection.
         *
         * @static
         * @memberOf _
         * @alias include
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Mixed} target The value to check for.
         * @param {Number} [fromIndex=0] The index to search from.
         * @returns {Boolean} Returns `true` if the `target` element is found, else `false`.
         * @example
         *
         * _.contains([1, 2, 3], 1);
         * // => true
         *
         * _.contains([1, 2, 3], 1, 2);
         * // => false
         *
         * _.contains({ 'name': 'moe', 'age': 40 }, 'moe');
         * // => true
         *
         * _.contains('curly', 'ur');
         * // => true
         */
        function contains(collection, target, fromIndex) {
            var index = -1,
                indexOf = getIndexOf(),
                length = collection ? collection.length : 0,
                result = false;

            fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;
            if (length && typeof length == 'number') {
                result = (isString(collection)
                    ? collection.indexOf(target, fromIndex)
                    : indexOf(collection, target, fromIndex)
                    ) > -1;
            } else {
                basicEach(collection, function(value) {
                    if (++index >= fromIndex) {
                        return !(result = value === target);
                    }
                });
            }
            return result;
        }

        /**
         * Creates an object composed of keys returned from running each element of the
         * `collection` through the given `callback`. The corresponding value of each key
         * is the number of times the key was returned by the `callback`. The `callback`
         * is bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Object} Returns the composed aggregate object.
         * @example
         *
         * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });
         * // => { '4': 1, '6': 2 }
         *
         * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
         * // => { '4': 1, '6': 2 }
         *
         * _.countBy(['one', 'two', 'three'], 'length');
         * // => { '3': 2, '5': 1 }
         */
        function countBy(collection, callback, thisArg) {
            var result = {};
            callback = lodash.createCallback(callback, thisArg);

            forEach(collection, function(value, key, collection) {
                key = String(callback(value, key, collection));
                (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);
            });
            return result;
        }

        /**
         * Checks if the `callback` returns a truthy value for **all** elements of a
         * `collection`. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias all
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Boolean} Returns `true` if all elements pass the callback check,
         *  else `false`.
         * @example
         *
         * _.every([true, 1, null, 'yes'], Boolean);
         * // => false
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.every(stooges, 'age');
         * // => true
         *
         * // using "_.where" callback shorthand
         * _.every(stooges, { 'age': 50 });
         * // => false
         */
        function every(collection, callback, thisArg) {
            var result = true;
            callback = lodash.createCallback(callback, thisArg);

            if (isArray(collection)) {
                var index = -1,
                    length = collection.length;

                while (++index < length) {
                    if (!(result = !!callback(collection[index], index, collection))) {
                        break;
                    }
                }
            } else {
                basicEach(collection, function(value, index, collection) {
                    return (result = !!callback(value, index, collection));
                });
            }
            return result;
        }

        /**
         * Examines each element in a `collection`, returning an array of all elements
         * the `callback` returns truthy for. The `callback` is bound to `thisArg` and
         * invoked with three arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias select
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a new array of elements that passed the callback check.
         * @example
         *
         * var evens = _.filter([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
         * // => [2, 4, 6]
         *
         * var food = [
         *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
         *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.filter(food, 'organic');
         * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
         *
         * // using "_.where" callback shorthand
         * _.filter(food, { 'type': 'fruit' });
         * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
         */
        function filter(collection, callback, thisArg) {
            var result = [];
            callback = lodash.createCallback(callback, thisArg);

            if (isArray(collection)) {
                var index = -1,
                    length = collection.length;

                while (++index < length) {
                    var value = collection[index];
                    if (callback(value, index, collection)) {
                        result.push(value);
                    }
                }
            } else {
                basicEach(collection, function(value, index, collection) {
                    if (callback(value, index, collection)) {
                        result.push(value);
                    }
                });
            }
            return result;
        }

        /**
         * Examines each element in a `collection`, returning the first that the `callback`
         * returns truthy for. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias detect, findWhere
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the found element, else `undefined`.
         * @example
         *
         * _.find([1, 2, 3, 4], function(num) {
     *   return num % 2 == 0;
     * });
         * // => 2
         *
         * var food = [
         *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
         *   { 'name': 'banana', 'organic': true,  'type': 'fruit' },
         *   { 'name': 'beet',   'organic': false, 'type': 'vegetable' }
         * ];
         *
         * // using "_.where" callback shorthand
         * _.find(food, { 'type': 'vegetable' });
         * // => { 'name': 'beet', 'organic': false, 'type': 'vegetable' }
         *
         * // using "_.pluck" callback shorthand
         * _.find(food, 'organic');
         * // => { 'name': 'banana', 'organic': true, 'type': 'fruit' }
         */
        function find(collection, callback, thisArg) {
            callback = lodash.createCallback(callback, thisArg);

            if (isArray(collection)) {
                var index = -1,
                    length = collection.length;

                while (++index < length) {
                    var value = collection[index];
                    if (callback(value, index, collection)) {
                        return value;
                    }
                }
            } else {
                var result;
                basicEach(collection, function(value, index, collection) {
                    if (callback(value, index, collection)) {
                        result = value;
                        return false;
                    }
                });
                return result;
            }
        }

        /**
         * Iterates over a `collection`, executing the `callback` for each element in
         * the `collection`. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, index|key, collection). Callbacks may exit iteration early
         * by explicitly returning `false`.
         *
         * @static
         * @memberOf _
         * @alias each
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function} [callback=identity] The function called per iteration.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array|Object|String} Returns `collection`.
         * @example
         *
         * _([1, 2, 3]).forEach(alert).join(',');
         * // => alerts each number and returns '1,2,3'
         *
         * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, alert);
         * // => alerts each number value (order is not guaranteed)
         */
        function forEach(collection, callback, thisArg) {
            if (callback && typeof thisArg == 'undefined' && isArray(collection)) {
                var index = -1,
                    length = collection.length;

                while (++index < length) {
                    if (callback(collection[index], index, collection) === false) {
                        break;
                    }
                }
            } else {
                basicEach(collection, callback, thisArg);
            }
            return collection;
        }

        /**
         * Creates an object composed of keys returned from running each element of the
         * `collection` through the `callback`. The corresponding value of each key is
         * an array of elements passed to `callback` that returned the key. The `callback`
         * is bound to `thisArg` and invoked with three arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Object} Returns the composed aggregate object.
         * @example
         *
         * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });
         * // => { '4': [4.2], '6': [6.1, 6.4] }
         *
         * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);
         * // => { '4': [4.2], '6': [6.1, 6.4] }
         *
         * // using "_.pluck" callback shorthand
         * _.groupBy(['one', 'two', 'three'], 'length');
         * // => { '3': ['one', 'two'], '5': ['three'] }
         */
        function groupBy(collection, callback, thisArg) {
            var result = {};
            callback = lodash.createCallback(callback, thisArg);

            forEach(collection, function(value, key, collection) {
                key = String(callback(value, key, collection));
                (hasOwnProperty.call(result, key) ? result[key] : result[key] = []).push(value);
            });
            return result;
        }

        /**
         * Invokes the method named by `methodName` on each element in the `collection`,
         * returning an array of the results of each invoked method. Additional arguments
         * will be passed to each invoked method. If `methodName` is a function, it will
         * be invoked for, and `this` bound to, each element in the `collection`.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|String} methodName The name of the method to invoke or
         *  the function invoked per iteration.
         * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the method with.
         * @returns {Array} Returns a new array of the results of each invoked method.
         * @example
         *
         * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');
         * // => [[1, 5, 7], [1, 2, 3]]
         *
         * _.invoke([123, 456], String.prototype.split, '');
         * // => [['1', '2', '3'], ['4', '5', '6']]
         */
        function invoke(collection, methodName) {
            var args = nativeSlice.call(arguments, 2),
                index = -1,
                isFunc = typeof methodName == 'function',
                length = collection ? collection.length : 0,
                result = Array(typeof length == 'number' ? length : 0);

            forEach(collection, function(value) {
                result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);
            });
            return result;
        }

        /**
         * Creates an array of values by running each element in the `collection`
         * through the `callback`. The `callback` is bound to `thisArg` and invoked with
         * three arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias collect
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a new array of the results of each `callback` execution.
         * @example
         *
         * _.map([1, 2, 3], function(num) { return num * 3; });
         * // => [3, 6, 9]
         *
         * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });
         * // => [3, 6, 9] (order is not guaranteed)
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.map(stooges, 'name');
         * // => ['moe', 'larry']
         */
        function map(collection, callback, thisArg) {
            var index = -1,
                length = collection ? collection.length : 0,
                result = Array(typeof length == 'number' ? length : 0);

            callback = lodash.createCallback(callback, thisArg);
            if (isArray(collection)) {
                while (++index < length) {
                    result[index] = callback(collection[index], index, collection);
                }
            } else {
                basicEach(collection, function(value, key, collection) {
                    result[++index] = callback(value, key, collection);
                });
            }
            return result;
        }

        /**
         * Retrieves the maximum value of an `array`. If `callback` is passed,
         * it will be executed for each value in the `array` to generate the
         * criterion by which the value is ranked. The `callback` is bound to
         * `thisArg` and invoked with three arguments; (value, index, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the maximum value.
         * @example
         *
         * _.max([4, 2, 8, 6]);
         * // => 8
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * _.max(stooges, function(stooge) { return stooge.age; });
         * // => { 'name': 'larry', 'age': 50 };
         *
         * // using "_.pluck" callback shorthand
         * _.max(stooges, 'age');
         * // => { 'name': 'larry', 'age': 50 };
         */
        function max(collection, callback, thisArg) {
            var computed = -Infinity,
                result = computed;

            if (!callback && isArray(collection)) {
                var index = -1,
                    length = collection.length;

                while (++index < length) {
                    var value = collection[index];
                    if (value > result) {
                        result = value;
                    }
                }
            } else {
                callback = (!callback && isString(collection))
                    ? charAtCallback
                    : lodash.createCallback(callback, thisArg);

                basicEach(collection, function(value, index, collection) {
                    var current = callback(value, index, collection);
                    if (current > computed) {
                        computed = current;
                        result = value;
                    }
                });
            }
            return result;
        }

        /**
         * Retrieves the minimum value of an `array`. If `callback` is passed,
         * it will be executed for each value in the `array` to generate the
         * criterion by which the value is ranked. The `callback` is bound to `thisArg`
         * and invoked with three arguments; (value, index, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the minimum value.
         * @example
         *
         * _.min([4, 2, 8, 6]);
         * // => 2
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * _.min(stooges, function(stooge) { return stooge.age; });
         * // => { 'name': 'moe', 'age': 40 };
         *
         * // using "_.pluck" callback shorthand
         * _.min(stooges, 'age');
         * // => { 'name': 'moe', 'age': 40 };
         */
        function min(collection, callback, thisArg) {
            var computed = Infinity,
                result = computed;

            if (!callback && isArray(collection)) {
                var index = -1,
                    length = collection.length;

                while (++index < length) {
                    var value = collection[index];
                    if (value < result) {
                        result = value;
                    }
                }
            } else {
                callback = (!callback && isString(collection))
                    ? charAtCallback
                    : lodash.createCallback(callback, thisArg);

                basicEach(collection, function(value, index, collection) {
                    var current = callback(value, index, collection);
                    if (current < computed) {
                        computed = current;
                        result = value;
                    }
                });
            }
            return result;
        }

        /**
         * Retrieves the value of a specified property from all elements in the `collection`.
         *
         * @static
         * @memberOf _
         * @type Function
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {String} property The property to pluck.
         * @returns {Array} Returns a new array of property values.
         * @example
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * _.pluck(stooges, 'name');
         * // => ['moe', 'larry']
         */
        var pluck = map;

        /**
         * Reduces a `collection` to a value which is the accumulated result of running
         * each element in the `collection` through the `callback`, where each successive
         * `callback` execution consumes the return value of the previous execution.
         * If `accumulator` is not passed, the first element of the `collection` will be
         * used as the initial `accumulator` value. The `callback` is bound to `thisArg`
         * and invoked with four arguments; (accumulator, value, index|key, collection).
         *
         * @static
         * @memberOf _
         * @alias foldl, inject
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function} [callback=identity] The function called per iteration.
         * @param {Mixed} [accumulator] Initial value of the accumulator.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the accumulated value.
         * @example
         *
         * var sum = _.reduce([1, 2, 3], function(sum, num) {
     *   return sum + num;
     * });
         * // => 6
         *
         * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {
     *   result[key] = num * 3;
     *   return result;
     * }, {});
         * // => { 'a': 3, 'b': 6, 'c': 9 }
         */
        function reduce(collection, callback, accumulator, thisArg) {
            var noaccum = arguments.length < 3;
            callback = lodash.createCallback(callback, thisArg, 4);

            if (isArray(collection)) {
                var index = -1,
                    length = collection.length;

                if (noaccum) {
                    accumulator = collection[++index];
                }
                while (++index < length) {
                    accumulator = callback(accumulator, collection[index], index, collection);
                }
            } else {
                basicEach(collection, function(value, index, collection) {
                    accumulator = noaccum
                        ? (noaccum = false, value)
                        : callback(accumulator, value, index, collection)
                });
            }
            return accumulator;
        }

        /**
         * This method is similar to `_.reduce`, except that it iterates over a
         * `collection` from right to left.
         *
         * @static
         * @memberOf _
         * @alias foldr
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function} [callback=identity] The function called per iteration.
         * @param {Mixed} [accumulator] Initial value of the accumulator.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the accumulated value.
         * @example
         *
         * var list = [[0, 1], [2, 3], [4, 5]];
         * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
         * // => [4, 5, 2, 3, 0, 1]
         */
        function reduceRight(collection, callback, accumulator, thisArg) {
            var iterable = collection,
                length = collection ? collection.length : 0,
                noaccum = arguments.length < 3;

            if (typeof length != 'number') {
                var props = keys(collection);
                length = props.length;
            } else if (support.unindexedChars && isString(collection)) {
                iterable = collection.split('');
            }
            callback = lodash.createCallback(callback, thisArg, 4);
            forEach(collection, function(value, index, collection) {
                index = props ? props[--length] : --length;
                accumulator = noaccum
                    ? (noaccum = false, iterable[index])
                    : callback(accumulator, iterable[index], index, collection);
            });
            return accumulator;
        }

        /**
         * The opposite of `_.filter`, this method returns the elements of a
         * `collection` that `callback` does **not** return truthy for.
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a new array of elements that did **not** pass the
         *  callback check.
         * @example
         *
         * var odds = _.reject([1, 2, 3, 4, 5, 6], function(num) { return num % 2 == 0; });
         * // => [1, 3, 5]
         *
         * var food = [
         *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
         *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.reject(food, 'organic');
         * // => [{ 'name': 'apple', 'organic': false, 'type': 'fruit' }]
         *
         * // using "_.where" callback shorthand
         * _.reject(food, { 'type': 'fruit' });
         * // => [{ 'name': 'carrot', 'organic': true, 'type': 'vegetable' }]
         */
        function reject(collection, callback, thisArg) {
            callback = lodash.createCallback(callback, thisArg);
            return filter(collection, function(value, index, collection) {
                return !callback(value, index, collection);
            });
        }

        /**
         * Creates an array of shuffled `array` values, using a version of the
         * Fisher-Yates shuffle. See http://en.wikipedia.org/wiki/Fisher-Yates_shuffle.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to shuffle.
         * @returns {Array} Returns a new shuffled collection.
         * @example
         *
         * _.shuffle([1, 2, 3, 4, 5, 6]);
         * // => [4, 1, 6, 3, 5, 2]
         */
        function shuffle(collection) {
            var index = -1,
                length = collection ? collection.length : 0,
                result = Array(typeof length == 'number' ? length : 0);

            forEach(collection, function(value) {
                var rand = floor(nativeRandom() * (++index + 1));
                result[index] = result[rand];
                result[rand] = value;
            });
            return result;
        }

        /**
         * Gets the size of the `collection` by returning `collection.length` for arrays
         * and array-like objects or the number of own enumerable properties for objects.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to inspect.
         * @returns {Number} Returns `collection.length` or number of own enumerable properties.
         * @example
         *
         * _.size([1, 2]);
         * // => 2
         *
         * _.size({ 'one': 1, 'two': 2, 'three': 3 });
         * // => 3
         *
         * _.size('curly');
         * // => 5
         */
        function size(collection) {
            var length = collection ? collection.length : 0;
            return typeof length == 'number' ? length : keys(collection).length;
        }

        /**
         * Checks if the `callback` returns a truthy value for **any** element of a
         * `collection`. The function returns as soon as it finds passing value, and
         * does not iterate over the entire `collection`. The `callback` is bound to
         * `thisArg` and invoked with three arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias any
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Boolean} Returns `true` if any element passes the callback check,
         *  else `false`.
         * @example
         *
         * _.some([null, 0, 'yes', false], Boolean);
         * // => true
         *
         * var food = [
         *   { 'name': 'apple',  'organic': false, 'type': 'fruit' },
         *   { 'name': 'carrot', 'organic': true,  'type': 'vegetable' }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.some(food, 'organic');
         * // => true
         *
         * // using "_.where" callback shorthand
         * _.some(food, { 'type': 'meat' });
         * // => false
         */
        function some(collection, callback, thisArg) {
            var result;
            callback = lodash.createCallback(callback, thisArg);

            if (isArray(collection)) {
                var index = -1,
                    length = collection.length;

                while (++index < length) {
                    if ((result = callback(collection[index], index, collection))) {
                        break;
                    }
                }
            } else {
                basicEach(collection, function(value, index, collection) {
                    return !(result = callback(value, index, collection));
                });
            }
            return !!result;
        }

        /**
         * Creates an array of elements, sorted in ascending order by the results of
         * running each element in the `collection` through the `callback`. This method
         * performs a stable sort, that is, it will preserve the original sort order of
         * equal elements. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, index|key, collection).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a new array of sorted elements.
         * @example
         *
         * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });
         * // => [3, 1, 2]
         *
         * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);
         * // => [3, 1, 2]
         *
         * // using "_.pluck" callback shorthand
         * _.sortBy(['banana', 'strawberry', 'apple'], 'length');
         * // => ['apple', 'banana', 'strawberry']
         */
        function sortBy(collection, callback, thisArg) {
            var index = -1,
                length = collection ? collection.length : 0,
                result = Array(typeof length == 'number' ? length : 0);

            callback = lodash.createCallback(callback, thisArg);
            forEach(collection, function(value, key, collection) {
                var object = result[++index] = getObject();
                object.criteria = callback(value, key, collection);
                object.index = index;
                object.value = value;
            });

            length = result.length;
            result.sort(compareAscending);
            while (length--) {
                var object = result[length];
                result[length] = object.value;
                releaseObject(object);
            }
            return result;
        }

        /**
         * Converts the `collection` to an array.
         *
         * @static
         * @memberOf _
         * @category Collections
         * @param {Array|Object|String} collection The collection to convert.
         * @returns {Array} Returns the new converted array.
         * @example
         *
         * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
         * // => [2, 3, 4]
         */
        function toArray(collection) {
            if (collection && typeof collection.length == 'number') {
                return (support.unindexedChars && isString(collection))
                    ? collection.split('')
                    : slice(collection);
            }
            return values(collection);
        }

        /**
         * Examines each element in a `collection`, returning an array of all elements
         * that have the given `properties`. When checking `properties`, this method
         * performs a deep comparison between values to determine if they are equivalent
         * to each other.
         *
         * @static
         * @memberOf _
         * @type Function
         * @category Collections
         * @param {Array|Object|String} collection The collection to iterate over.
         * @param {Object} properties The object of property values to filter by.
         * @returns {Array} Returns a new array of elements that have the given `properties`.
         * @example
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * _.where(stooges, { 'age': 40 });
         * // => [{ 'name': 'moe', 'age': 40 }]
         */
        var where = filter;

        /*--------------------------------------------------------------------------*/

        /**
         * Creates an array with all falsey values of `array` removed. The values
         * `false`, `null`, `0`, `""`, `undefined` and `NaN` are all falsey.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to compact.
         * @returns {Array} Returns a new filtered array.
         * @example
         *
         * _.compact([0, 1, false, 2, '', 3]);
         * // => [1, 2, 3]
         */
        function compact(array) {
            var index = -1,
                length = array ? array.length : 0,
                result = [];

            while (++index < length) {
                var value = array[index];
                if (value) {
                    result.push(value);
                }
            }
            return result;
        }

        /**
         * Creates an array of `array` elements not present in the other arrays
         * using strict equality for comparisons, i.e. `===`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to process.
         * @param {Array} [array1, array2, ...] Arrays to check.
         * @returns {Array} Returns a new array of `array` elements not present in the
         *  other arrays.
         * @example
         *
         * _.difference([1, 2, 3, 4, 5], [5, 2, 10]);
         * // => [1, 3, 4]
         */
        function difference(array) {
            var index = -1,
                indexOf = getIndexOf(),
                length = array ? array.length : 0,
                seen = concat.apply(arrayRef, nativeSlice.call(arguments, 1)),
                result = [];

            var isLarge = length >= largeArraySize && indexOf === basicIndexOf;

            if (isLarge) {
                var cache = createCache(seen);
                if (cache) {
                    indexOf = cacheIndexOf;
                    seen = cache;
                } else {
                    isLarge = false;
                }
            }
            while (++index < length) {
                var value = array[index];
                if (indexOf(seen, value) < 0) {
                    result.push(value);
                }
            }
            if (isLarge) {
                releaseObject(seen);
            }
            return result;
        }

        /**
         * This method is similar to `_.find`, except that it returns the index of
         * the element that passes the callback check, instead of the element itself.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to search.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the index of the found element, else `-1`.
         * @example
         *
         * _.findIndex(['apple', 'banana', 'beet'], function(food) {
     *   return /^b/.test(food);
     * });
         * // => 1
         */
        function findIndex(array, callback, thisArg) {
            var index = -1,
                length = array ? array.length : 0;

            callback = lodash.createCallback(callback, thisArg);
            while (++index < length) {
                if (callback(array[index], index, array)) {
                    return index;
                }
            }
            return -1;
        }

        /**
         * Gets the first element of the `array`. If a number `n` is passed, the first
         * `n` elements of the `array` are returned. If a `callback` function is passed,
         * elements at the beginning of the array are returned as long as the `callback`
         * returns truthy. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, index, array).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias head, take
         * @category Arrays
         * @param {Array} array The array to query.
         * @param {Function|Object|Number|String} [callback|n] The function called
         *  per element or the number of elements to return. If a property name or
         *  object is passed, it will be used to create a "_.pluck" or "_.where"
         *  style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the first element(s) of `array`.
         * @example
         *
         * _.first([1, 2, 3]);
         * // => 1
         *
         * _.first([1, 2, 3], 2);
         * // => [1, 2]
         *
         * _.first([1, 2, 3], function(num) {
     *   return num < 3;
     * });
         * // => [1, 2]
         *
         * var food = [
         *   { 'name': 'banana', 'organic': true },
         *   { 'name': 'beet',   'organic': false },
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.first(food, 'organic');
         * // => [{ 'name': 'banana', 'organic': true }]
         *
         * var food = [
         *   { 'name': 'apple',  'type': 'fruit' },
         *   { 'name': 'banana', 'type': 'fruit' },
         *   { 'name': 'beet',   'type': 'vegetable' }
         * ];
         *
         * // using "_.where" callback shorthand
         * _.first(food, { 'type': 'fruit' });
         * // => [{ 'name': 'apple', 'type': 'fruit' }, { 'name': 'banana', 'type': 'fruit' }]
         */
        function first(array, callback, thisArg) {
            if (array) {
                var n = 0,
                    length = array.length;

                if (typeof callback != 'number' && callback != null) {
                    var index = -1;
                    callback = lodash.createCallback(callback, thisArg);
                    while (++index < length && callback(array[index], index, array)) {
                        n++;
                    }
                } else {
                    n = callback;
                    if (n == null || thisArg) {
                        return array[0];
                    }
                }
                return slice(array, 0, nativeMin(nativeMax(0, n), length));
            }
        }

        /**
         * Flattens a nested array (the nesting can be to any depth). If `isShallow`
         * is truthy, `array` will only be flattened a single level. If `callback`
         * is passed, each element of `array` is passed through a `callback` before
         * flattening. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, index, array).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to flatten.
         * @param {Boolean} [isShallow=false] A flag to indicate only flattening a single level.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a new flattened array.
         * @example
         *
         * _.flatten([1, [2], [3, [[4]]]]);
         * // => [1, 2, 3, 4];
         *
         * _.flatten([1, [2], [3, [[4]]]], true);
         * // => [1, 2, 3, [[4]]];
         *
         * var stooges = [
         *   { 'name': 'curly', 'quotes': ['Oh, a wise guy, eh?', 'Poifect!'] },
         *   { 'name': 'moe', 'quotes': ['Spread out!', 'You knucklehead!'] }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.flatten(stooges, 'quotes');
         * // => ['Oh, a wise guy, eh?', 'Poifect!', 'Spread out!', 'You knucklehead!']
         */
        var flatten = overloadWrapper(function flatten(array, isShallow, callback) {
            var index = -1,
                length = array ? array.length : 0,
                result = [];

            while (++index < length) {
                var value = array[index];
                if (callback) {
                    value = callback(value, index, array);
                }
                // recursively flatten arrays (susceptible to call stack limits)
                if (isArray(value)) {
                    push.apply(result, isShallow ? value : flatten(value));
                } else {
                    result.push(value);
                }
            }
            return result;
        });

        /**
         * Gets the index at which the first occurrence of `value` is found using
         * strict equality for comparisons, i.e. `===`. If the `array` is already
         * sorted, passing `true` for `fromIndex` will run a faster binary search.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to search.
         * @param {Mixed} value The value to search for.
         * @param {Boolean|Number} [fromIndex=0] The index to search from or `true` to
         *  perform a binary search on a sorted `array`.
         * @returns {Number} Returns the index of the matched value or `-1`.
         * @example
         *
         * _.indexOf([1, 2, 3, 1, 2, 3], 2);
         * // => 1
         *
         * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);
         * // => 4
         *
         * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);
         * // => 2
         */
        function indexOf(array, value, fromIndex) {
            if (typeof fromIndex == 'number') {
                var length = array ? array.length : 0;
                fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);
            } else if (fromIndex) {
                var index = sortedIndex(array, value);
                return array[index] === value ? index : -1;
            }
            return array ? basicIndexOf(array, value, fromIndex) : -1;
        }

        /**
         * Gets all but the last element of `array`. If a number `n` is passed, the
         * last `n` elements are excluded from the result. If a `callback` function
         * is passed, elements at the end of the array are excluded from the result
         * as long as the `callback` returns truthy. The `callback` is bound to
         * `thisArg` and invoked with three arguments; (value, index, array).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to query.
         * @param {Function|Object|Number|String} [callback|n=1] The function called
         *  per element or the number of elements to exclude. If a property name or
         *  object is passed, it will be used to create a "_.pluck" or "_.where"
         *  style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a slice of `array`.
         * @example
         *
         * _.initial([1, 2, 3]);
         * // => [1, 2]
         *
         * _.initial([1, 2, 3], 2);
         * // => [1]
         *
         * _.initial([1, 2, 3], function(num) {
     *   return num > 1;
     * });
         * // => [1]
         *
         * var food = [
         *   { 'name': 'beet',   'organic': false },
         *   { 'name': 'carrot', 'organic': true }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.initial(food, 'organic');
         * // => [{ 'name': 'beet',   'organic': false }]
         *
         * var food = [
         *   { 'name': 'banana', 'type': 'fruit' },
         *   { 'name': 'beet',   'type': 'vegetable' },
         *   { 'name': 'carrot', 'type': 'vegetable' }
         * ];
         *
         * // using "_.where" callback shorthand
         * _.initial(food, { 'type': 'vegetable' });
         * // => [{ 'name': 'banana', 'type': 'fruit' }]
         */
        function initial(array, callback, thisArg) {
            if (!array) {
                return [];
            }
            var n = 0,
                length = array.length;

            if (typeof callback != 'number' && callback != null) {
                var index = length;
                callback = lodash.createCallback(callback, thisArg);
                while (index-- && callback(array[index], index, array)) {
                    n++;
                }
            } else {
                n = (callback == null || thisArg) ? 1 : callback || n;
            }
            return slice(array, 0, nativeMin(nativeMax(0, length - n), length));
        }

        /**
         * Computes the intersection of all the passed-in arrays using strict equality
         * for comparisons, i.e. `===`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} [array1, array2, ...] Arrays to process.
         * @returns {Array} Returns a new array of unique elements that are present
         *  in **all** of the arrays.
         * @example
         *
         * _.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
         * // => [1, 2]
         */
        function intersection(array) {
            var args = arguments,
                argsLength = args.length,
                argsIndex = -1,
                caches = getArray(),
                index = -1,
                indexOf = getIndexOf(),
                length = array ? array.length : 0,
                result = [],
                seen = getArray();

            while (++argsIndex < argsLength) {
                var value = args[argsIndex];
                caches[argsIndex] = indexOf === basicIndexOf &&
                    (value ? value.length : 0) >= largeArraySize &&
                    createCache(argsIndex ? args[argsIndex] : seen);
            }
            outer:
                while (++index < length) {
                    var cache = caches[0];
                    value = array[index];

                    if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {
                        argsIndex = argsLength;
                        (cache || seen).push(value);
                        while (--argsIndex) {
                            cache = caches[argsIndex];
                            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {
                                continue outer;
                            }
                        }
                        result.push(value);
                    }
                }
            while (argsLength--) {
                cache = caches[argsLength];
                if (cache) {
                    releaseObject(cache);
                }
            }
            releaseArray(caches);
            releaseArray(seen);
            return result;
        }

        /**
         * Gets the last element of the `array`. If a number `n` is passed, the
         * last `n` elements of the `array` are returned. If a `callback` function
         * is passed, elements at the end of the array are returned as long as the
         * `callback` returns truthy. The `callback` is bound to `thisArg` and
         * invoked with three arguments;(value, index, array).
         *
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to query.
         * @param {Function|Object|Number|String} [callback|n] The function called
         *  per element or the number of elements to return. If a property name or
         *  object is passed, it will be used to create a "_.pluck" or "_.where"
         *  style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Mixed} Returns the last element(s) of `array`.
         * @example
         *
         * _.last([1, 2, 3]);
         * // => 3
         *
         * _.last([1, 2, 3], 2);
         * // => [2, 3]
         *
         * _.last([1, 2, 3], function(num) {
     *   return num > 1;
     * });
         * // => [2, 3]
         *
         * var food = [
         *   { 'name': 'beet',   'organic': false },
         *   { 'name': 'carrot', 'organic': true }
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.last(food, 'organic');
         * // => [{ 'name': 'carrot', 'organic': true }]
         *
         * var food = [
         *   { 'name': 'banana', 'type': 'fruit' },
         *   { 'name': 'beet',   'type': 'vegetable' },
         *   { 'name': 'carrot', 'type': 'vegetable' }
         * ];
         *
         * // using "_.where" callback shorthand
         * _.last(food, { 'type': 'vegetable' });
         * // => [{ 'name': 'beet', 'type': 'vegetable' }, { 'name': 'carrot', 'type': 'vegetable' }]
         */
        function last(array, callback, thisArg) {
            if (array) {
                var n = 0,
                    length = array.length;

                if (typeof callback != 'number' && callback != null) {
                    var index = length;
                    callback = lodash.createCallback(callback, thisArg);
                    while (index-- && callback(array[index], index, array)) {
                        n++;
                    }
                } else {
                    n = callback;
                    if (n == null || thisArg) {
                        return array[length - 1];
                    }
                }
                return slice(array, nativeMax(0, length - n));
            }
        }

        /**
         * Gets the index at which the last occurrence of `value` is found using strict
         * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used
         * as the offset from the end of the collection.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to search.
         * @param {Mixed} value The value to search for.
         * @param {Number} [fromIndex=array.length-1] The index to search from.
         * @returns {Number} Returns the index of the matched value or `-1`.
         * @example
         *
         * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
         * // => 4
         *
         * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);
         * // => 1
         */
        function lastIndexOf(array, value, fromIndex) {
            var index = array ? array.length : 0;
            if (typeof fromIndex == 'number') {
                index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;
            }
            while (index--) {
                if (array[index] === value) {
                    return index;
                }
            }
            return -1;
        }

        /**
         * Creates an array of numbers (positive and/or negative) progressing from
         * `start` up to but not including `end`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Number} [start=0] The start of the range.
         * @param {Number} end The end of the range.
         * @param {Number} [step=1] The value to increment or decrement by.
         * @returns {Array} Returns a new range array.
         * @example
         *
         * _.range(10);
         * // => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
         *
         * _.range(1, 11);
         * // => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
         *
         * _.range(0, 30, 5);
         * // => [0, 5, 10, 15, 20, 25]
         *
         * _.range(0, -10, -1);
         * // => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
         *
         * _.range(0);
         * // => []
         */
        function range(start, end, step) {
            start = +start || 0;
            step = +step || 1;

            if (end == null) {
                end = start;
                start = 0;
            }
            // use `Array(length)` so V8 will avoid the slower "dictionary" mode
            // http://youtu.be/XAqIpGU8ZZk#t=17m25s
            var index = -1,
                length = nativeMax(0, ceil((end - start) / step)),
                result = Array(length);

            while (++index < length) {
                result[index] = start;
                start += step;
            }
            return result;
        }

        /**
         * The opposite of `_.initial`, this method gets all but the first value of
         * `array`. If a number `n` is passed, the first `n` values are excluded from
         * the result. If a `callback` function is passed, elements at the beginning
         * of the array are excluded from the result as long as the `callback` returns
         * truthy. The `callback` is bound to `thisArg` and invoked with three
         * arguments; (value, index, array).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias drop, tail
         * @category Arrays
         * @param {Array} array The array to query.
         * @param {Function|Object|Number|String} [callback|n=1] The function called
         *  per element or the number of elements to exclude. If a property name or
         *  object is passed, it will be used to create a "_.pluck" or "_.where"
         *  style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a slice of `array`.
         * @example
         *
         * _.rest([1, 2, 3]);
         * // => [2, 3]
         *
         * _.rest([1, 2, 3], 2);
         * // => [3]
         *
         * _.rest([1, 2, 3], function(num) {
     *   return num < 3;
     * });
         * // => [3]
         *
         * var food = [
         *   { 'name': 'banana', 'organic': true },
         *   { 'name': 'beet',   'organic': false },
         * ];
         *
         * // using "_.pluck" callback shorthand
         * _.rest(food, 'organic');
         * // => [{ 'name': 'beet', 'organic': false }]
         *
         * var food = [
         *   { 'name': 'apple',  'type': 'fruit' },
         *   { 'name': 'banana', 'type': 'fruit' },
         *   { 'name': 'beet',   'type': 'vegetable' }
         * ];
         *
         * // using "_.where" callback shorthand
         * _.rest(food, { 'type': 'fruit' });
         * // => [{ 'name': 'beet', 'type': 'vegetable' }]
         */
        function rest(array, callback, thisArg) {
            if (typeof callback != 'number' && callback != null) {
                var n = 0,
                    index = -1,
                    length = array ? array.length : 0;

                callback = lodash.createCallback(callback, thisArg);
                while (++index < length && callback(array[index], index, array)) {
                    n++;
                }
            } else {
                n = (callback == null || thisArg) ? 1 : nativeMax(0, callback);
            }
            return slice(array, n);
        }

        /**
         * Uses a binary search to determine the smallest index at which the `value`
         * should be inserted into `array` in order to maintain the sort order of the
         * sorted `array`. If `callback` is passed, it will be executed for `value` and
         * each element in `array` to compute their sort ranking. The `callback` is
         * bound to `thisArg` and invoked with one argument; (value).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to inspect.
         * @param {Mixed} value The value to evaluate.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Number} Returns the index at which the value should be inserted
         *  into `array`.
         * @example
         *
         * _.sortedIndex([20, 30, 50], 40);
         * // => 2
         *
         * // using "_.pluck" callback shorthand
         * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');
         * // => 2
         *
         * var dict = {
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }
     * };
         *
         * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return dict.wordToNumber[word];
     * });
         * // => 2
         *
         * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {
     *   return this.wordToNumber[word];
     * }, dict);
         * // => 2
         */
        function sortedIndex(array, value, callback, thisArg) {
            var low = 0,
                high = array ? array.length : low;

            // explicitly reference `identity` for better inlining in Firefox
            callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;
            value = callback(value);

            while (low < high) {
                var mid = (low + high) >>> 1;
                (callback(array[mid]) < value)
                    ? low = mid + 1
                    : high = mid;
            }
            return low;
        }

        /**
         * Computes the union of the passed-in arrays using strict equality for
         * comparisons, i.e. `===`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} [array1, array2, ...] Arrays to process.
         * @returns {Array} Returns a new array of unique values, in order, that are
         *  present in one or more of the arrays.
         * @example
         *
         * _.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
         * // => [1, 2, 3, 101, 10]
         */
        function union(array) {
            if (!isArray(array)) {
                arguments[0] = array ? nativeSlice.call(array) : arrayRef;
            }
            return uniq(concat.apply(arrayRef, arguments));
        }

        /**
         * Creates a duplicate-value-free version of the `array` using strict equality
         * for comparisons, i.e. `===`. If the `array` is already sorted, passing `true`
         * for `isSorted` will run a faster algorithm. If `callback` is passed, each
         * element of `array` is passed through the `callback` before uniqueness is computed.
         * The `callback` is bound to `thisArg` and invoked with three arguments; (value, index, array).
         *
         * If a property name is passed for `callback`, the created "_.pluck" style
         * callback will return the property value of the given element.
         *
         * If an object is passed for `callback`, the created "_.where" style callback
         * will return `true` for elements that have the properties of the given object,
         * else `false`.
         *
         * @static
         * @memberOf _
         * @alias unique
         * @category Arrays
         * @param {Array} array The array to process.
         * @param {Boolean} [isSorted=false] A flag to indicate that the `array` is already sorted.
         * @param {Function|Object|String} [callback=identity] The function called per
         *  iteration. If a property name or object is passed, it will be used to create
         *  a "_.pluck" or "_.where" style callback, respectively.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a duplicate-value-free array.
         * @example
         *
         * _.uniq([1, 2, 1, 3, 1]);
         * // => [1, 2, 3]
         *
         * _.uniq([1, 1, 2, 2, 3], true);
         * // => [1, 2, 3]
         *
         * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });
         * // => ['A', 'b', 'C']
         *
         * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);
         * // => [1, 2.5, 3]
         *
         * // using "_.pluck" callback shorthand
         * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
         * // => [{ 'x': 1 }, { 'x': 2 }]
         */
        var uniq = overloadWrapper(function(array, isSorted, callback) {
            var index = -1,
                indexOf = getIndexOf(),
                length = array ? array.length : 0,
                result = [];

            var isLarge = !isSorted && length >= largeArraySize && indexOf === basicIndexOf,
                seen = (callback || isLarge) ? getArray() : result;

            if (isLarge) {
                var cache = createCache(seen);
                if (cache) {
                    indexOf = cacheIndexOf;
                    seen = cache;
                } else {
                    isLarge = false;
                    seen = callback ? seen : (releaseArray(seen), result);
                }
            }
            while (++index < length) {
                var value = array[index],
                    computed = callback ? callback(value, index, array) : value;

                if (isSorted
                    ? !index || seen[seen.length - 1] !== computed
                    : indexOf(seen, computed) < 0
                    ) {
                    if (callback || isLarge) {
                        seen.push(computed);
                    }
                    result.push(value);
                }
            }
            if (isLarge) {
                releaseArray(seen.array);
                releaseObject(seen);
            } else if (callback) {
                releaseArray(seen);
            }
            return result;
        });

        /**
         * The inverse of `_.zip`, this method splits groups of elements into arrays
         * composed of elements from each group at their corresponding indexes.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to process.
         * @returns {Array} Returns a new array of the composed arrays.
         * @example
         *
         * _.unzip([['moe', 30, true], ['larry', 40, false]]);
         * // => [['moe', 'larry'], [30, 40], [true, false]];
         */
        function unzip(array) {
            var index = -1,
                length = array ? max(pluck(array, 'length')) : 0,
                result = Array(length < 0 ? 0 : length);

            while (++index < length) {
                result[index] = pluck(array, index);
            }
            return result;
        }

        /**
         * Creates an array with all occurrences of the passed values removed using
         * strict equality for comparisons, i.e. `===`.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} array The array to filter.
         * @param {Mixed} [value1, value2, ...] Values to remove.
         * @returns {Array} Returns a new filtered array.
         * @example
         *
         * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
         * // => [2, 3, 4]
         */
        function without(array) {
            return difference(array, nativeSlice.call(arguments, 1));
        }

        /**
         * Groups the elements of each array at their corresponding indexes. Useful for
         * separate data sources that are coordinated through matching array indexes.
         * For a matrix of nested arrays, `_.zip.apply(...)` can transpose the matrix
         * in a similar fashion.
         *
         * @static
         * @memberOf _
         * @category Arrays
         * @param {Array} [array1, array2, ...] Arrays to process.
         * @returns {Array} Returns a new array of grouped elements.
         * @example
         *
         * _.zip(['moe', 'larry'], [30, 40], [true, false]);
         * // => [['moe', 30, true], ['larry', 40, false]]
         */
        function zip(array) {
            return array ? unzip(arguments) : [];
        }

        /**
         * Creates an object composed from arrays of `keys` and `values`. Pass either
         * a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`, or
         * two arrays, one of `keys` and one of corresponding `values`.
         *
         * @static
         * @memberOf _
         * @alias object
         * @category Arrays
         * @param {Array} keys The array of keys.
         * @param {Array} [values=[]] The array of values.
         * @returns {Object} Returns an object composed of the given keys and
         *  corresponding values.
         * @example
         *
         * _.zipObject(['moe', 'larry'], [30, 40]);
         * // => { 'moe': 30, 'larry': 40 }
         */
        function zipObject(keys, values) {
            var index = -1,
                length = keys ? keys.length : 0,
                result = {};

            while (++index < length) {
                var key = keys[index];
                if (values) {
                    result[key] = values[index];
                } else {
                    result[key[0]] = key[1];
                }
            }
            return result;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * If `n` is greater than `0`, a function is created that is restricted to
         * executing `func`, with the `this` binding and arguments of the created
         * function, only after it is called `n` times. If `n` is less than `1`,
         * `func` is executed immediately, without a `this` binding or additional
         * arguments, and its result is returned.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Number} n The number of times the function must be called before
         * it is executed.
         * @param {Function} func The function to restrict.
         * @returns {Function} Returns the new restricted function.
         * @example
         *
         * var renderNotes = _.after(notes.length, render);
         * _.forEach(notes, function(note) {
     *   note.asyncSave({ 'success': renderNotes });
     * });
         * // `renderNotes` is run once, after all notes have saved
         */
        function after(n, func) {
            if (n < 1) {
                return func();
            }
            return function() {
                if (--n < 1) {
                    return func.apply(this, arguments);
                }
            };
        }

        /**
         * Creates a function that, when called, invokes `func` with the `this`
         * binding of `thisArg` and prepends any additional `bind` arguments to those
         * passed to the bound function.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to bind.
         * @param {Mixed} [thisArg] The `this` binding of `func`.
         * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
         * @returns {Function} Returns the new bound function.
         * @example
         *
         * var func = function(greeting) {
     *   return greeting + ' ' + this.name;
     * };
         *
         * func = _.bind(func, { 'name': 'moe' }, 'hi');
         * func();
         * // => 'hi moe'
         */
        function bind(func, thisArg) {
            // use `Function#bind` if it exists and is fast
            // (in V8 `Function#bind` is slower except when partially applied)
            return support.fastBind || (nativeBind && arguments.length > 2)
                ? nativeBind.call.apply(nativeBind, arguments)
                : createBound(func, thisArg, nativeSlice.call(arguments, 2));
        }

        /**
         * Binds methods on `object` to `object`, overwriting the existing method.
         * Method names may be specified as individual arguments or as arrays of method
         * names. If no method names are provided, all the function properties of `object`
         * will be bound.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Object} object The object to bind and assign the bound methods to.
         * @param {String} [methodName1, methodName2, ...] Method names on the object to bind.
         * @returns {Object} Returns `object`.
         * @example
         *
         * var view = {
     *  'label': 'docs',
     *  'onClick': function() { alert('clicked ' + this.label); }
     * };
         *
         * _.bindAll(view);
         * jQuery('#docs').on('click', view.onClick);
         * // => alerts 'clicked docs', when the button is clicked
         */
        function bindAll(object) {
            var funcs = arguments.length > 1 ? concat.apply(arrayRef, nativeSlice.call(arguments, 1)) : functions(object),
                index = -1,
                length = funcs.length;

            while (++index < length) {
                var key = funcs[index];
                object[key] = bind(object[key], object);
            }
            return object;
        }

        /**
         * Creates a function that, when called, invokes the method at `object[key]`
         * and prepends any additional `bindKey` arguments to those passed to the bound
         * function. This method differs from `_.bind` by allowing bound functions to
         * reference methods that will be redefined or don't yet exist.
         * See http://michaux.ca/articles/lazy-function-definition-pattern.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Object} object The object the method belongs to.
         * @param {String} key The key of the method.
         * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
         * @returns {Function} Returns the new bound function.
         * @example
         *
         * var object = {
     *   'name': 'moe',
     *   'greet': function(greeting) {
     *     return greeting + ' ' + this.name;
     *   }
     * };
         *
         * var func = _.bindKey(object, 'greet', 'hi');
         * func();
         * // => 'hi moe'
         *
         * object.greet = function(greeting) {
     *   return greeting + ', ' + this.name + '!';
     * };
         *
         * func();
         * // => 'hi, moe!'
         */
        function bindKey(object, key) {
            return createBound(object, key, nativeSlice.call(arguments, 2), indicatorObject);
        }

        /**
         * Creates a function that is the composition of the passed functions,
         * where each function consumes the return value of the function that follows.
         * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.
         * Each function is executed with the `this` binding of the composed function.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} [func1, func2, ...] Functions to compose.
         * @returns {Function} Returns the new composed function.
         * @example
         *
         * var greet = function(name) { return 'hi ' + name; };
         * var exclaim = function(statement) { return statement + '!'; };
         * var welcome = _.compose(exclaim, greet);
         * welcome('moe');
         * // => 'hi moe!'
         */
        function compose() {
            var funcs = arguments;
            return function() {
                var args = arguments,
                    length = funcs.length;

                while (length--) {
                    args = [funcs[length].apply(this, args)];
                }
                return args[0];
            };
        }

        /**
         * Produces a callback bound to an optional `thisArg`. If `func` is a property
         * name, the created callback will return the property value for a given element.
         * If `func` is an object, the created callback will return `true` for elements
         * that contain the equivalent object properties, otherwise it will return `false`.
         *
         * Note: All Lo-Dash methods, that accept a `callback` argument, use `_.createCallback`.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Mixed} [func=identity] The value to convert to a callback.
         * @param {Mixed} [thisArg] The `this` binding of the created callback.
         * @param {Number} [argCount=3] The number of arguments the callback accepts.
         * @returns {Function} Returns a callback function.
         * @example
         *
         * var stooges = [
         *   { 'name': 'moe', 'age': 40 },
         *   { 'name': 'larry', 'age': 50 }
         * ];
         *
         * // wrap to create custom callback shorthands
         * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);
     *   return !match ? func(callback, thisArg) : function(object) {
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];
     *   };
     * });
         *
         * _.filter(stooges, 'age__gt45');
         * // => [{ 'name': 'larry', 'age': 50 }]
         *
         * // create mixins with support for "_.pluck" and "_.where" callback shorthands
         * _.mixin({
     *   'toLookup': function(collection, callback, thisArg) {
     *     callback = _.createCallback(callback, thisArg);
     *     return _.reduce(collection, function(result, value, index, collection) {
     *       return (result[callback(value, index, collection)] = value, result);
     *     }, {});
     *   }
     * });
         *
         * _.toLookup(stooges, 'name');
         * // => { 'moe': { 'name': 'moe', 'age': 40 }, 'larry': { 'name': 'larry', 'age': 50 } }
         */
        function createCallback(func, thisArg, argCount) {
            if (func == null) {
                return identity;
            }
            var type = typeof func;
            if (type != 'function') {
                if (type != 'object') {
                    return function(object) {
                        return object[func];
                    };
                }
                var props = keys(func);
                return function(object) {
                    var length = props.length,
                        result = false;
                    while (length--) {
                        if (!(result = isEqual(object[props[length]], func[props[length]], indicatorObject))) {
                            break;
                        }
                    }
                    return result;
                };
            }
            if (typeof thisArg == 'undefined' || (reThis && !reThis.test(fnToString.call(func)))) {
                return func;
            }
            if (argCount === 1) {
                return function(value) {
                    return func.call(thisArg, value);
                };
            }
            if (argCount === 2) {
                return function(a, b) {
                    return func.call(thisArg, a, b);
                };
            }
            if (argCount === 4) {
                return function(accumulator, value, index, collection) {
                    return func.call(thisArg, accumulator, value, index, collection);
                };
            }
            return function(value, index, collection) {
                return func.call(thisArg, value, index, collection);
            };
        }

        /**
         * Creates a function that will delay the execution of `func` until after
         * `wait` milliseconds have elapsed since the last time it was invoked. Pass
         * an `options` object to indicate that `func` should be invoked on the leading
         * and/or trailing edge of the `wait` timeout. Subsequent calls to the debounced
         * function will return the result of the last `func` call.
         *
         * Note: If `leading` and `trailing` options are `true`, `func` will be called
         * on the trailing edge of the timeout only if the the debounced function is
         * invoked more than once during the `wait` timeout.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to debounce.
         * @param {Number} wait The number of milliseconds to delay.
         * @param {Object} options The options object.
         *  [leading=false] A boolean to specify execution on the leading edge of the timeout.
         *  [maxWait] The maximum time `func` is allowed to be delayed before it's called.
         *  [trailing=true] A boolean to specify execution on the trailing edge of the timeout.
         * @returns {Function} Returns the new debounced function.
         * @example
         *
         * var lazyLayout = _.debounce(calculateLayout, 300);
         * jQuery(window).on('resize', lazyLayout);
         *
         * jQuery('#postbox').on('click', _.debounce(sendMail, 200, {
     *   'leading': true,
     *   'trailing': false
     * });
         */
        function debounce(func, wait, options) {
            var args,
                result,
                thisArg,
                callCount = 0,
                lastCalled = 0,
                maxWait = false,
                maxTimeoutId = null,
                timeoutId = null,
                trailing = true;

            function clear() {
                clearTimeout(maxTimeoutId);
                clearTimeout(timeoutId);
                callCount = 0;
                maxTimeoutId = timeoutId = null;
            }

            function delayed() {
                var isCalled = trailing && (!leading || callCount > 1);
                clear();
                if (isCalled) {
                    if (maxWait !== false) {
                        lastCalled = new Date;
                    }
                    result = func.apply(thisArg, args);
                }
            }

            function maxDelayed() {
                clear();
                if (trailing || (maxWait !== wait)) {
                    lastCalled = new Date;
                    result = func.apply(thisArg, args);
                }
            }

            wait = nativeMax(0, wait || 0);
            if (options === true) {
                var leading = true;
                trailing = false;
            } else if (isObject(options)) {
                leading = options.leading;
                maxWait = 'maxWait' in options && nativeMax(wait, options.maxWait || 0);
                trailing = 'trailing' in options ? options.trailing : trailing;
            }
            return function() {
                args = arguments;
                thisArg = this;
                callCount++;

                // avoid issues with Titanium and `undefined` timeout ids
                // https://github.com/appcelerator/titanium_mobile/blob/3_1_0_GA/android/titanium/src/java/ti/modules/titanium/TitaniumModule.java#L185-L192
                clearTimeout(timeoutId);

                if (maxWait === false) {
                    if (leading && callCount < 2) {
                        result = func.apply(thisArg, args);
                    }
                } else {
                    var now = new Date;
                    if (!maxTimeoutId && !leading) {
                        lastCalled = now;
                    }
                    var remaining = maxWait - (now - lastCalled);
                    if (remaining <= 0) {
                        clearTimeout(maxTimeoutId);
                        maxTimeoutId = null;
                        lastCalled = now;
                        result = func.apply(thisArg, args);
                    }
                    else if (!maxTimeoutId) {
                        maxTimeoutId = setTimeout(maxDelayed, remaining);
                    }
                }
                if (wait !== maxWait) {
                    timeoutId = setTimeout(delayed, wait);
                }
                return result;
            };
        }

        /**
         * Defers executing the `func` function until the current call stack has cleared.
         * Additional arguments will be passed to `func` when it is invoked.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to defer.
         * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
         * @returns {Number} Returns the timer id.
         * @example
         *
         * _.defer(function() { alert('deferred'); });
         * // returns from the function before `alert` is called
         */
        function defer(func) {
            var args = nativeSlice.call(arguments, 1);
            return setTimeout(function() { func.apply(undefined, args); }, 1);
        }
        // use `setImmediate` if it's available in Node.js
        if (isV8 && freeModule && typeof setImmediate == 'function') {
            defer = bind(setImmediate, context);
        }

        /**
         * Executes the `func` function after `wait` milliseconds. Additional arguments
         * will be passed to `func` when it is invoked.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to delay.
         * @param {Number} wait The number of milliseconds to delay execution.
         * @param {Mixed} [arg1, arg2, ...] Arguments to invoke the function with.
         * @returns {Number} Returns the timer id.
         * @example
         *
         * var log = _.bind(console.log, console);
         * _.delay(log, 1000, 'logged later');
         * // => 'logged later' (Appears after one second.)
         */
        function delay(func, wait) {
            var args = nativeSlice.call(arguments, 2);
            return setTimeout(function() { func.apply(undefined, args); }, wait);
        }

        /**
         * Creates a function that memoizes the result of `func`. If `resolver` is
         * passed, it will be used to determine the cache key for storing the result
         * based on the arguments passed to the memoized function. By default, the first
         * argument passed to the memoized function is used as the cache key. The `func`
         * is executed with the `this` binding of the memoized function. The result
         * cache is exposed as the `cache` property on the memoized function.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to have its output memoized.
         * @param {Function} [resolver] A function used to resolve the cache key.
         * @returns {Function} Returns the new memoizing function.
         * @example
         *
         * var fibonacci = _.memoize(function(n) {
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
     * });
         */
        function memoize(func, resolver) {
            function memoized() {
                var cache = memoized.cache,
                    key = keyPrefix + (resolver ? resolver.apply(this, arguments) : arguments[0]);

                return hasOwnProperty.call(cache, key)
                    ? cache[key]
                    : (cache[key] = func.apply(this, arguments));
            }
            memoized.cache = {};
            return memoized;
        }

        /**
         * Creates a function that is restricted to execute `func` once. Repeat calls to
         * the function will return the value of the first call. The `func` is executed
         * with the `this` binding of the created function.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to restrict.
         * @returns {Function} Returns the new restricted function.
         * @example
         *
         * var initialize = _.once(createApplication);
         * initialize();
         * initialize();
         * // `initialize` executes `createApplication` once
         */
        function once(func) {
            var ran,
                result;

            return function() {
                if (ran) {
                    return result;
                }
                ran = true;
                result = func.apply(this, arguments);

                // clear the `func` variable so the function may be garbage collected
                func = null;
                return result;
            };
        }

        /**
         * Creates a function that, when called, invokes `func` with any additional
         * `partial` arguments prepended to those passed to the new function. This
         * method is similar to `_.bind`, except it does **not** alter the `this` binding.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to partially apply arguments to.
         * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
         * @returns {Function} Returns the new partially applied function.
         * @example
         *
         * var greet = function(greeting, name) { return greeting + ' ' + name; };
         * var hi = _.partial(greet, 'hi');
         * hi('moe');
         * // => 'hi moe'
         */
        function partial(func) {
            return createBound(func, nativeSlice.call(arguments, 1));
        }

        /**
         * This method is similar to `_.partial`, except that `partial` arguments are
         * appended to those passed to the new function.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to partially apply arguments to.
         * @param {Mixed} [arg1, arg2, ...] Arguments to be partially applied.
         * @returns {Function} Returns the new partially applied function.
         * @example
         *
         * var defaultsDeep = _.partialRight(_.merge, _.defaults);
         *
         * var options = {
     *   'variable': 'data',
     *   'imports': { 'jq': $ }
     * };
         *
         * defaultsDeep(options, _.templateSettings);
         *
         * options.variable
         * // => 'data'
         *
         * options.imports
         * // => { '_': _, 'jq': $ }
         */
        function partialRight(func) {
            return createBound(func, nativeSlice.call(arguments, 1), null, indicatorObject);
        }

        /**
         * Creates a function that, when executed, will only call the `func` function
         * at most once per every `wait` milliseconds. Pass an `options` object to
         * indicate that `func` should be invoked on the leading and/or trailing edge
         * of the `wait` timeout. Subsequent calls to the throttled function will
         * return the result of the last `func` call.
         *
         * Note: If `leading` and `trailing` options are `true`, `func` will be called
         * on the trailing edge of the timeout only if the the throttled function is
         * invoked more than once during the `wait` timeout.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Function} func The function to throttle.
         * @param {Number} wait The number of milliseconds to throttle executions to.
         * @param {Object} options The options object.
         *  [leading=true] A boolean to specify execution on the leading edge of the timeout.
         *  [trailing=true] A boolean to specify execution on the trailing edge of the timeout.
         * @returns {Function} Returns the new throttled function.
         * @example
         *
         * var throttled = _.throttle(updatePosition, 100);
         * jQuery(window).on('scroll', throttled);
         *
         * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {
     *   'trailing': false
     * }));
         */
        function throttle(func, wait, options) {
            var leading = true,
                trailing = true;

            if (options === false) {
                leading = false;
            } else if (isObject(options)) {
                leading = 'leading' in options ? options.leading : leading;
                trailing = 'trailing' in options ? options.trailing : trailing;
            }
            options = getObject();
            options.leading = leading;
            options.maxWait = wait;
            options.trailing = trailing;

            var result = debounce(func, wait, options);
            releaseObject(options);
            return result;
        }

        /**
         * Creates a function that passes `value` to the `wrapper` function as its
         * first argument. Additional arguments passed to the function are appended
         * to those passed to the `wrapper` function. The `wrapper` is executed with
         * the `this` binding of the created function.
         *
         * @static
         * @memberOf _
         * @category Functions
         * @param {Mixed} value The value to wrap.
         * @param {Function} wrapper The wrapper function.
         * @returns {Function} Returns the new function.
         * @example
         *
         * var hello = function(name) { return 'hello ' + name; };
         * hello = _.wrap(hello, function(func) {
     *   return 'before, ' + func('moe') + ', after';
     * });
         * hello();
         * // => 'before, hello moe, after'
         */
        function wrap(value, wrapper) {
            return function() {
                var args = [value];
                push.apply(args, arguments);
                return wrapper.apply(this, args);
            };
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Converts the characters `&`, `<`, `>`, `"`, and `'` in `string` to their
         * corresponding HTML entities.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {String} string The string to escape.
         * @returns {String} Returns the escaped string.
         * @example
         *
         * _.escape('Moe, Larry & Curly');
         * // => 'Moe, Larry &amp; Curly'
         */
        function escape(string) {
            return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);
        }

        /**
         * This method returns the first argument passed to it.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {Mixed} value Any value.
         * @returns {Mixed} Returns `value`.
         * @example
         *
         * var moe = { 'name': 'moe' };
         * moe === _.identity(moe);
         * // => true
         */
        function identity(value) {
            return value;
        }

        /**
         * Adds functions properties of `object` to the `lodash` function and chainable
         * wrapper.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {Object} object The object of function properties to add to `lodash`.
         * @example
         *
         * _.mixin({
     *   'capitalize': function(string) {
     *     return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
     *   }
     * });
         *
         * _.capitalize('moe');
         * // => 'Moe'
         *
         * _('moe').capitalize();
         * // => 'Moe'
         */
        function mixin(object) {
            forEach(functions(object), function(methodName) {
                var func = lodash[methodName] = object[methodName];

                lodash.prototype[methodName] = function() {
                    var value = this.__wrapped__,
                        args = [value];

                    push.apply(args, arguments);
                    var result = func.apply(lodash, args);
                    return (value && typeof value == 'object' && value === result)
                        ? this
                        : new lodashWrapper(result);
                };
            });
        }

        /**
         * Reverts the '_' variable to its previous value and returns a reference to
         * the `lodash` function.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @returns {Function} Returns the `lodash` function.
         * @example
         *
         * var lodash = _.noConflict();
         */
        function noConflict() {
            context._ = oldDash;
            return this;
        }

        /**
         * Converts the given `value` into an integer of the specified `radix`.
         * If `radix` is `undefined` or `0`, a `radix` of `10` is used unless the
         * `value` is a hexadecimal, in which case a `radix` of `16` is used.
         *
         * Note: This method avoids differences in native ES3 and ES5 `parseInt`
         * implementations. See http://es5.github.com/#E.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {String} value The value to parse.
         * @param {Number} [radix] The radix used to interpret the value to parse.
         * @returns {Number} Returns the new integer value.
         * @example
         *
         * _.parseInt('08');
         * // => 8
         */
        var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {
            // Firefox and Opera still follow the ES3 specified implementation of `parseInt`
            return nativeParseInt(isString(value) ? value.replace(reLeadingSpacesAndZeros, '') : value, radix || 0);
        };

        /**
         * Produces a random number between `min` and `max` (inclusive). If only one
         * argument is passed, a number between `0` and the given number will be returned.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {Number} [min=0] The minimum possible value.
         * @param {Number} [max=1] The maximum possible value.
         * @returns {Number} Returns a random number.
         * @example
         *
         * _.random(0, 5);
         * // => a number between 0 and 5
         *
         * _.random(5);
         * // => also a number between 0 and 5
         */
        function random(min, max) {
            if (min == null && max == null) {
                max = 1;
            }
            min = +min || 0;
            if (max == null) {
                max = min;
                min = 0;
            } else {
                max = +max || 0;
            }
            var rand = nativeRandom();
            return (min % 1 || max % 1)
                ? min + nativeMin(rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1))), max)
                : min + floor(rand * (max - min + 1));
        }

        /**
         * Resolves the value of `property` on `object`. If `property` is a function,
         * it will be invoked with the `this` binding of `object` and its result returned,
         * else the property value is returned. If `object` is falsey, then `undefined`
         * is returned.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {Object} object The object to inspect.
         * @param {String} property The property to get the value of.
         * @returns {Mixed} Returns the resolved value.
         * @example
         *
         * var object = {
     *   'cheese': 'crumpets',
     *   'stuff': function() {
     *     return 'nonsense';
     *   }
     * };
         *
         * _.result(object, 'cheese');
         * // => 'crumpets'
         *
         * _.result(object, 'stuff');
         * // => 'nonsense'
         */
        function result(object, property) {
            var value = object ? object[property] : undefined;
            return isFunction(value) ? object[property]() : value;
        }

        /**
         * A micro-templating method that handles arbitrary delimiters, preserves
         * whitespace, and correctly escapes quotes within interpolated code.
         *
         * Note: In the development build, `_.template` utilizes sourceURLs for easier
         * debugging. See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
         *
         * For more information on precompiling templates see:
         * http://lodash.com/#custom-builds
         *
         * For more information on Chrome extension sandboxes see:
         * http://developer.chrome.com/stable/extensions/sandboxingEval.html
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {String} text The template text.
         * @param {Object} data The data object used to populate the text.
         * @param {Object} options The options object.
         *  escape - The "escape" delimiter regexp.
         *  evaluate - The "evaluate" delimiter regexp.
         *  interpolate - The "interpolate" delimiter regexp.
         *  sourceURL - The sourceURL of the template's compiled source.
         *  variable - The data object variable name.
         * @returns {Function|String} Returns a compiled function when no `data` object
         *  is given, else it returns the interpolated text.
         * @example
         *
         * // using a compiled template
         * var compiled = _.template('hello <%= name %>');
         * compiled({ 'name': 'moe' });
         * // => 'hello moe'
         *
         * var list = '<% _.forEach(people, function(name) { %><li><%= name %></li><% }); %>';
         * _.template(list, { 'people': ['moe', 'larry'] });
         * // => '<li>moe</li><li>larry</li>'
         *
         * // using the "escape" delimiter to escape HTML in data property values
         * _.template('<b><%- value %></b>', { 'value': '<script>' });
         * // => '<b>&lt;script&gt;</b>'
         *
         * // using the ES6 delimiter as an alternative to the default "interpolate" delimiter
         * _.template('hello ${ name }', { 'name': 'curly' });
         * // => 'hello curly'
         *
         * // using the internal `print` function in "evaluate" delimiters
         * _.template('<% print("hello " + epithet); %>!', { 'epithet': 'stooge' });
         * // => 'hello stooge!'
         *
         * // using custom template delimiters
         * _.templateSettings = {
     *   'interpolate': /{{([\s\S]+?)}}/g
     * };
         *
         * _.template('hello {{ name }}!', { 'name': 'mustache' });
         * // => 'hello mustache!'
         *
         * // using the `sourceURL` option to specify a custom sourceURL for the template
         * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });
         * compiled(data);
         * // => find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector
         *
         * // using the `variable` option to ensure a with-statement isn't used in the compiled template
         * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });
         * compiled.source;
         * // => function(data) {
     *   var __t, __p = '', __e = _.escape;
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';
     *   return __p;
     * }
         *
         * // using the `source` property to inline compiled templates for meaningful
         * // line numbers in error messages and a stack trace
         * fs.writeFileSync(path.join(cwd, 'jst.js'), '\
         *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
         * ');
         */
        function template(text, data, options) {
            // based on John Resig's `tmpl` implementation
            // http://ejohn.org/blog/javascript-micro-templating/
            // and Laura Doktorova's doT.js
            // https://github.com/olado/doT
            var settings = lodash.templateSettings;
            text || (text = '');

            // avoid missing dependencies when `iteratorTemplate` is not defined
            options = iteratorTemplate ? defaults({}, options, settings) : settings;

            var imports = iteratorTemplate && defaults({}, options.imports, settings.imports),
                importsKeys = iteratorTemplate ? keys(imports) : ['_'],
                importsValues = iteratorTemplate ? values(imports) : [lodash];

            var isEvaluating,
                index = 0,
                interpolate = options.interpolate || reNoMatch,
                source = "__p += '";

            // compile the regexp to match each delimiter
            var reDelimiters = RegExp(
                (options.escape || reNoMatch).source + '|' +
                    interpolate.source + '|' +
                    (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
                    (options.evaluate || reNoMatch).source + '|$'
                , 'g');

            text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
                interpolateValue || (interpolateValue = esTemplateValue);

                // escape characters that cannot be included in string literals
                source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);

                // replace delimiters with snippets
                if (escapeValue) {
                    source += "' +\n__e(" + escapeValue + ") +\n'";
                }
                if (evaluateValue) {
                    isEvaluating = true;
                    source += "';\n" + evaluateValue + ";\n__p += '";
                }
                if (interpolateValue) {
                    source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
                }
                index = offset + match.length;

                // the JS engine embedded in Adobe products requires returning the `match`
                // string in order to produce the correct `offset` value
                return match;
            });

            source += "';\n";

            // if `variable` is not specified, wrap a with-statement around the generated
            // code to add the data object to the top of the scope chain
            var variable = options.variable,
                hasVariable = variable;

            if (!hasVariable) {
                variable = 'obj';
                source = 'with (' + variable + ') {\n' + source + '\n}\n';
            }
            // cleanup code by stripping empty strings
            source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
                .replace(reEmptyStringMiddle, '$1')
                .replace(reEmptyStringTrailing, '$1;');

            // frame code as the function body
            source = 'function(' + variable + ') {\n' +
                (hasVariable ? '' : variable + ' || (' + variable + ' = {});\n') +
                "var __t, __p = '', __e = _.escape" +
                (isEvaluating
                    ? ', __j = Array.prototype.join;\n' +
                    "function print() { __p += __j.call(arguments, '') }\n"
                    : ';\n'
                    ) +
                source +
                'return __p\n}';

            // Use a sourceURL for easier debugging and wrap in a multi-line comment to
            // avoid issues with Narwhal, IE conditional compilation, and the JS engine
            // embedded in Adobe products.
            // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl
            var sourceURL = '\n/*\n//@ sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\n*/';

            try {
                var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);
            } catch(e) {
                e.source = source;
                throw e;
            }
            if (data) {
                return result(data);
            }
            // provide the compiled function's source via its `toString` method, in
            // supported environments, or the `source` property as a convenience for
            // inlining compiled templates during the build process
            result.source = source;
            return result;
        }

        /**
         * Executes the `callback` function `n` times, returning an array of the results
         * of each `callback` execution. The `callback` is bound to `thisArg` and invoked
         * with one argument; (index).
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {Number} n The number of times to execute the callback.
         * @param {Function} callback The function called per iteration.
         * @param {Mixed} [thisArg] The `this` binding of `callback`.
         * @returns {Array} Returns a new array of the results of each `callback` execution.
         * @example
         *
         * var diceRolls = _.times(3, _.partial(_.random, 1, 6));
         * // => [3, 6, 4]
         *
         * _.times(3, function(n) { mage.castSpell(n); });
         * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively
         *
         * _.times(3, function(n) { this.cast(n); }, mage);
         * // => also calls `mage.castSpell(n)` three times
         */
        function times(n, callback, thisArg) {
            n = (n = +n) > -1 ? n : 0;
            var index = -1,
                result = Array(n);

            callback = lodash.createCallback(callback, thisArg, 1);
            while (++index < n) {
                result[index] = callback(index);
            }
            return result;
        }

        /**
         * The inverse of `_.escape`, this method converts the HTML entities
         * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their
         * corresponding characters.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {String} string The string to unescape.
         * @returns {String} Returns the unescaped string.
         * @example
         *
         * _.unescape('Moe, Larry &amp; Curly');
         * // => 'Moe, Larry & Curly'
         */
        function unescape(string) {
            return string == null ? '' : String(string).replace(reEscapedHtml, unescapeHtmlChar);
        }

        /**
         * Generates a unique ID. If `prefix` is passed, the ID will be appended to it.
         *
         * @static
         * @memberOf _
         * @category Utilities
         * @param {String} [prefix] The value to prefix the ID with.
         * @returns {String} Returns the unique ID.
         * @example
         *
         * _.uniqueId('contact_');
         * // => 'contact_104'
         *
         * _.uniqueId();
         * // => '105'
         */
        function uniqueId(prefix) {
            var id = ++idCounter;
            return String(prefix == null ? '' : prefix) + id;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Invokes `interceptor` with the `value` as the first argument, and then
         * returns `value`. The purpose of this method is to "tap into" a method chain,
         * in order to perform operations on intermediate results within the chain.
         *
         * @static
         * @memberOf _
         * @category Chaining
         * @param {Mixed} value The value to pass to `interceptor`.
         * @param {Function} interceptor The function to invoke.
         * @returns {Mixed} Returns `value`.
         * @example
         *
         * _([1, 2, 3, 4])
         *  .filter(function(num) { return num % 2 == 0; })
         *  .tap(alert)
         *  .map(function(num) { return num * num; })
         *  .value();
         * // => // [2, 4] (alerted)
         * // => [4, 16]
         */
        function tap(value, interceptor) {
            interceptor(value);
            return value;
        }

        /**
         * Produces the `toString` result of the wrapped value.
         *
         * @name toString
         * @memberOf _
         * @category Chaining
         * @returns {String} Returns the string result.
         * @example
         *
         * _([1, 2, 3]).toString();
         * // => '1,2,3'
         */
        function wrapperToString() {
            return String(this.__wrapped__);
        }

        /**
         * Extracts the wrapped value.
         *
         * @name valueOf
         * @memberOf _
         * @alias value
         * @category Chaining
         * @returns {Mixed} Returns the wrapped value.
         * @example
         *
         * _([1, 2, 3]).valueOf();
         * // => [1, 2, 3]
         */
        function wrapperValueOf() {
            return this.__wrapped__;
        }

        /*--------------------------------------------------------------------------*/

        // add functions that return wrapped values when chaining
        lodash.after = after;
        lodash.assign = assign;
        lodash.at = at;
        lodash.bind = bind;
        lodash.bindAll = bindAll;
        lodash.bindKey = bindKey;
        lodash.compact = compact;
        lodash.compose = compose;
        lodash.countBy = countBy;
        lodash.createCallback = createCallback;
        lodash.debounce = debounce;
        lodash.defaults = defaults;
        lodash.defer = defer;
        lodash.delay = delay;
        lodash.difference = difference;
        lodash.filter = filter;
        lodash.flatten = flatten;
        lodash.forEach = forEach;
        lodash.forIn = forIn;
        lodash.forOwn = forOwn;
        lodash.functions = functions;
        lodash.groupBy = groupBy;
        lodash.initial = initial;
        lodash.intersection = intersection;
        lodash.invert = invert;
        lodash.invoke = invoke;
        lodash.keys = keys;
        lodash.map = map;
        lodash.max = max;
        lodash.memoize = memoize;
        lodash.merge = merge;
        lodash.min = min;
        lodash.omit = omit;
        lodash.once = once;
        lodash.pairs = pairs;
        lodash.partial = partial;
        lodash.partialRight = partialRight;
        lodash.pick = pick;
        lodash.pluck = pluck;
        lodash.range = range;
        lodash.reject = reject;
        lodash.rest = rest;
        lodash.shuffle = shuffle;
        lodash.sortBy = sortBy;
        lodash.tap = tap;
        lodash.throttle = throttle;
        lodash.times = times;
        lodash.toArray = toArray;
        lodash.transform = transform;
        lodash.union = union;
        lodash.uniq = uniq;
        lodash.unzip = unzip;
        lodash.values = values;
        lodash.where = where;
        lodash.without = without;
        lodash.wrap = wrap;
        lodash.zip = zip;
        lodash.zipObject = zipObject;

        // add aliases
        lodash.collect = map;
        lodash.drop = rest;
        lodash.each = forEach;
        lodash.extend = assign;
        lodash.methods = functions;
        lodash.object = zipObject;
        lodash.select = filter;
        lodash.tail = rest;
        lodash.unique = uniq;

        // add functions to `lodash.prototype`
        mixin(lodash);

        // add Underscore compat
        lodash.chain = lodash;
        lodash.prototype.chain = function() { return this; };

        /*--------------------------------------------------------------------------*/

        // add functions that return unwrapped values when chaining
        lodash.clone = clone;
        lodash.cloneDeep = cloneDeep;
        lodash.contains = contains;
        lodash.escape = escape;
        lodash.every = every;
        lodash.find = find;
        lodash.findIndex = findIndex;
        lodash.findKey = findKey;
        lodash.has = has;
        lodash.identity = identity;
        lodash.indexOf = indexOf;
        lodash.isArguments = isArguments;
        lodash.isArray = isArray;
        lodash.isBoolean = isBoolean;
        lodash.isDate = isDate;
        lodash.isElement = isElement;
        lodash.isEmpty = isEmpty;
        lodash.isEqual = isEqual;
        lodash.isFinite = isFinite;
        lodash.isFunction = isFunction;
        lodash.isNaN = isNaN;
        lodash.isNull = isNull;
        lodash.isNumber = isNumber;
        lodash.isObject = isObject;
        lodash.isPlainObject = isPlainObject;
        lodash.isRegExp = isRegExp;
        lodash.isString = isString;
        lodash.isUndefined = isUndefined;
        lodash.lastIndexOf = lastIndexOf;
        lodash.mixin = mixin;
        lodash.noConflict = noConflict;
        lodash.parseInt = parseInt;
        lodash.random = random;
        lodash.reduce = reduce;
        lodash.reduceRight = reduceRight;
        lodash.result = result;
        lodash.runInContext = runInContext;
        lodash.size = size;
        lodash.some = some;
        lodash.sortedIndex = sortedIndex;
        lodash.template = template;
        lodash.unescape = unescape;
        lodash.uniqueId = uniqueId;

        // add aliases
        lodash.all = every;
        lodash.any = some;
        lodash.detect = find;
        lodash.findWhere = find;
        lodash.foldl = reduce;
        lodash.foldr = reduceRight;
        lodash.include = contains;
        lodash.inject = reduce;

        forOwn(lodash, function(func, methodName) {
            if (!lodash.prototype[methodName]) {
                lodash.prototype[methodName] = function() {
                    var args = [this.__wrapped__];
                    push.apply(args, arguments);
                    return func.apply(lodash, args);
                };
            }
        });

        /*--------------------------------------------------------------------------*/

        // add functions capable of returning wrapped and unwrapped values when chaining
        lodash.first = first;
        lodash.last = last;

        // add aliases
        lodash.take = first;
        lodash.head = first;

        forOwn(lodash, function(func, methodName) {
            if (!lodash.prototype[methodName]) {
                lodash.prototype[methodName]= function(callback, thisArg) {
                    var result = func(this.__wrapped__, callback, thisArg);
                    return callback == null || (thisArg && typeof callback != 'function')
                        ? result
                        : new lodashWrapper(result);
                };
            }
        });

        /*--------------------------------------------------------------------------*/

        /**
         * The semantic version number.
         *
         * @static
         * @memberOf _
         * @type String
         */
        lodash.VERSION = '1.3.1';

        // add "Chaining" functions to the wrapper
        lodash.prototype.toString = wrapperToString;
        lodash.prototype.value = wrapperValueOf;
        lodash.prototype.valueOf = wrapperValueOf;

        // add `Array` functions that return unwrapped values
        basicEach(['join', 'pop', 'shift'], function(methodName) {
            var func = arrayRef[methodName];
            lodash.prototype[methodName] = function() {
                return func.apply(this.__wrapped__, arguments);
            };
        });

        // add `Array` functions that return the wrapped value
        basicEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {
            var func = arrayRef[methodName];
            lodash.prototype[methodName] = function() {
                func.apply(this.__wrapped__, arguments);
                return this;
            };
        });

        // add `Array` functions that return new wrapped values
        basicEach(['concat', 'slice', 'splice'], function(methodName) {
            var func = arrayRef[methodName];
            lodash.prototype[methodName] = function() {
                return new lodashWrapper(func.apply(this.__wrapped__, arguments));
            };
        });

        // avoid array-like object bugs with `Array#shift` and `Array#splice`
        // in Firefox < 10 and IE < 9
        if (!support.spliceObjects) {
            basicEach(['pop', 'shift', 'splice'], function(methodName) {
                var func = arrayRef[methodName],
                    isSplice = methodName == 'splice';

                lodash.prototype[methodName] = function() {
                    var value = this.__wrapped__,
                        result = func.apply(value, arguments);

                    if (value.length === 0) {
                        delete value[0];
                    }
                    return isSplice ? new lodashWrapper(result) : result;
                };
            });
        }

        // add pseudo private property to be used and removed during the build process
        lodash._basicEach = basicEach;
        lodash._iteratorTemplate = iteratorTemplate;
        lodash._shimKeys = shimKeys;

        return lodash;
    }

    /*--------------------------------------------------------------------------*/

    // expose Lo-Dash
    var _ = runInContext();

    // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        // Expose Lo-Dash to the global object even when an AMD loader is present in
        // case Lo-Dash was injected by a third-party script and not intended to be
        // loaded as a module. The global assignment can be reverted in the Lo-Dash
        // module via its `noConflict()` method.
        window._ = _;

        // define as an anonymous module so, through path mapping, it can be
        // referenced as the "underscore" module
        define('lib/underscore/lodash',[],function() {
            return _;
        });
    }
    // check for `exports` after `define` in case a build optimizer adds an `exports` object
    else if (freeExports && !freeExports.nodeType) {
        // in Node.js or RingoJS v0.8.0+
        if (freeModule) {
            (freeModule.exports = _)._ = _;
        }
        // in Narwhal or RingoJS v0.7.0-
        else {
            freeExports._ = _;
        }
    }
    else {
        // in a browser or Rhino
        window._ = _;
    }
}(this));
/*global define, _ */

define('underscoreloader',['lib/underscore/lodash'], function () {
    

    return _.noConflict();
});
/*global define, _ */

define('Dispatcher',['underscoreloader'], function (_) {
    

    return function () {
        var _listeners = [];

        var addListener = function (eventName, callback) {
            if (_.isEmpty(eventName) || !_.isString(eventName))
            {
                return false;
            }

            if (!_.isFunction(callback))
            {
                throw new Error("You can't create an event listener without supplying a callback function");
            }

            _listeners.push({
                name: eventName,
                callback: callback
            });

            return true;
        };

        var dispatch = function (eventName, data, dispatchOverWindow) {
            if (_.isEmpty(eventName) || !_.isString(eventName))
            {
                throw new Error("You can't dispatch an event without supplying an event name (as a string)");
            }

            var event = document.createEvent('Event');
            var name = 'foxneod:' + eventName;
            event.initEvent(name, true, true);
            event.data = data || {};

            if (!dispatchOverWindow)
            {
                var listeners = _.where(listeners, {name: eventName});
                _.each(_listeners, function (listener) {
                    listener.callback(event);
                });
            }
            else
            {
                window.dispatchEvent(event);
            }

            return true;
        };

        var getEventListeners = function (eventName) {

            if (_.isUndefined(eventName))
            {
                return _listeners;
            }

            var found = [];

            _.each(_listeners, function (listener) {
                if (listener.name === eventName)
                {
                    found.push(listener);
                }
            });

            return found;
        };

        var hasListener = function (eventName) {
            var found = false;

            if (!_.isEmpty(eventName) && _.isString(eventName))
            {
                _.each(_listeners, function (listener) {
                    if (listener.name === eventName)
                    {
                        found = true;
                    }
                });
            }

            return found;
        };

        var removeListener = function (eventName) {
            var updated = [],
                removed = false;

            _.each(_listeners, function (listener) {
                if (listener.name !== eventName)
                {
                    updated.push(listener);
                }
                else
                {
                    removed = true;
                }
            });

            _listeners = updated;

            return removed;
        };

        var removeAllListeners = function () {
            _listeners = [];

            return _listeners;
        };

        return {
            addEventListener: addListener,
            on: addListener,
            dispatch: dispatch,
            getEventListeners: getEventListeners,
            hasEventListener: hasListener,
            removeEventListener: removeListener,
            removeAllEventListeners: removeAllListeners
        };
    };
});
/*global define */

define('utils',['Dispatcher', 'underscoreloader', 'jqueryloader'], function (Dispatcher, _, jquery) {
    

    var dispatcher = new Dispatcher();

    var arrayToObject = function (arr) {
        var obj = {};

        for (var i = 0, n = arr.length; i < n; i++)
        {
            var item = arr[i];
            if (item.indexOf('=') !== -1)
            {
                var itemPieces = item.split('=');

                obj[itemPieces[0]] = itemPieces[1];
            }
            else
            {
                obj[i] = item;
            }
        }

        return obj;
    };

    //only supports shallow objects right now
    var objectToArray = function (obj) {
        var outputArray = [];

        _.each(obj, function (value, key) {
            if (!_.isObject(value))
            {
                outputArray.push(key +'='+ value);
            }
            else
            {
                throw new Error("The value you supplied to objectToArray() was not a basic (numbers and strings) " +
                    "shallow object");
            }
        });

        return outputArray;
    };

    var booleanToString = function (flag) {
        if (_.isUndefined(flag))
        {
//            debug.warn("Whatever you passed to booleanToString() was undefined, so we returned false to play it safe.");
            return 'false';
        }
        else if (!_.isBoolean(flag)) //if we don't get a boolean, just return false
        {
            if (_.isString(flag))
            {
//                debug.warn("You passed a string ("+ flag +") to the booleanToString() method. Don't do that.");
                flag = booleanToString(flag);
            }

            return 'false';
        }

        var boolString = String(flag).toLowerCase();

        return boolString || 'false';
    };

    var stringToBoolean = function (flag) {
        return (flag === 'true') ? true : false;
    };

    var isDefined = function (obj, checkEmpty) {

        if (_.isUndefined(obj))
        {
            return false;
        }

        if (_.isNull(obj))
        {
            return false;
        }

        if (checkEmpty)
        {
            if (_.isEmpty(obj))
            {
                return false;
            }
        }

        return true;
    };

    var isLooseEqual = function (itemA, itemB) {
        if (_.isUndefined(itemA) || _.isUndefined(itemB))
        {
            return false;
        }

        var normalizedA = !_.isFinite(itemA) ? String(itemA).toLowerCase() : +itemA,
            normalizedB = !_.isFinite(itemB) ? String(itemB).toLowerCase() : +itemB;

        //despite how odd it is that i use strict equal in a function called isLooseEqual, it's because of JSHint
        // and I've already cast the objects to strings anyway
        if (normalizedA === normalizedB)
        {
            return true;
        }

        return false;
    };

    var isShallowObject = function (obj) {
        if (_.isUndefined(obj))
        {
            return false;
        }

        if (!_.isTrueObject(obj))
        {
            return false;
        }

        if (_.isTrueObject(obj) && _.isEmpty(obj))
        {
            return false;
        }

        var shallow = true;

        _.each(obj, function (index, item) {
            var value = obj[item];

            if (_.isTrueObject(value))
            {
                shallow = false;
            }
        });

        return shallow;
    };

    var isTrueObject = function (obj) {
        if (_.isUndefined(obj))
        {
            return false;
        }

        if (_.isObject(obj) && !_.isFunction(obj) && !_.isArray(obj))
        {
            return true;
        }

        return false;
    };

    var isURL = function (url) {
        if (_.isUndefined(url) || _.isEmpty(url))
        {
            return false;
        }

        if (!_.isString(url))
        {
            return false;
        }

        var urlRegex = /^(https?:\/\/)?(www)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?[^?]+(?:\?([^&]+).*)?$/;

        return urlRegex.test(url);
    };

    /**
     * Loops through the provided object (shallow) and when value matches, the key is returned.
     * @param obj
     * @param value
     * @returns {String}
     */
    var getKeyFromValue = function (obj, value) {
        for (var prop in obj)
        {
            if (_.has(obj, prop))
            {
                //we want this to be flexible, so we check the string versions (want to keep strict equal)
                // (see /tests/qunit/tests.js)
                if (String(obj[prop]) === String(value))
                {
                    return prop;
                }
            }
        }

        return '';
    };

    var pipeStringToObject = function (pipeString) {
        var obj = {};

        var kvPairs = pipeString.split('|');

        for (var i = 0, n = kvPairs.length; i < n; i++)
        {
            var pair = kvPairs[i].split(/=(.+)?/, 2); //makes sure we only split on the first = found
            var value = pair[1] || null; //i prefer null in this case
            obj[pair[0]] = value; //sets the key value pair on our return object
        }

        return obj;
    };

    var objectToPipeString = function (obj, delimiter) {
        var properties = [];

        if (isShallowObject(obj))
        {
            _.each(obj, function (value, key) {
                properties.push(key + '=' + value);
            });
        }
        else
        {
            throw new Error("The first argument you supplied to objectToPipeString() was not a " +
                "valid object. The objectToPipeString() method only supports a shallow object of strings and numbers.");
        }

        return properties.join(delimiter || '|');
    };

    var lowerCasePropertyNames = function (obj) { //only does a shallow lookup
        var output = {};

//        for (var prop in obj)
//        {
//            output[prop.toLowerCase()] = obj[prop];
//        }
//
        _.each(obj, function (value, key) {

            //it's just a true object (i.e. {})
            if (_.isObject(value) && !_.isFunction(value) && !_.isArray(value))
            {
//                throw new Error("lowerCasePropertyNames() only supports a shallow object.");
                value = lowerCasePropertyNames(value);
            }

            output[key.toLowerCase()] = value;
        });

        return output;
    };

//    var getRandomColor = function () {
//        var letters = '0123456789ABCDEF'.split('');
//        var color = '#';
//
//        for (var i = 0; i < 6; i++)
//        {
//            color += letters[Math.round(Math.random() * 15)];
//        }
//
//        return color;
//    };

    var getColorFromString = function (color) {
        if (!_.isUndefined(color))
        {
            if (!_.isString(color))
            {
                throw new Error('The value supplied to getColorFromString() should be a string, not whatever you passed in.');
            }

            /**
             * We want to make sure that the color supplied is the right length (6 characters without a hash
             * and 7 with). Then, if no hash exists, we add it ourselves.
             */
            var correctLength = (color.length === 6 || color.length === 7);
            if (correctLength)
            {
                if (color.length === 6 && color.indexOf('#') === -1)
                {
                    color = '#' + color;
                }

                return color.toLowerCase();
            }
//            else
//            {
//                debug.warn('Whatever you supplied to getColorFromString() was either not a string, not a number ' +
//                    'and/or not the right length (should be 6 characters with no hash and 7 with).');
//            }
        }

        return null;
    };

    var addPixelSuffix = function (text) {
        var size = String(text);
        var index = String(size).indexOf('px');

        if (index === -1)
        {
            size = size + 'px';
        }
//        else if (index < (text.length-1))
//        {
              //hmmmm - should I strip the px out of the string if it's mid string, add the px and return that but warn anyway?
//            debug.log({
//                type: 'utils',
//                message: "Whatever you supplied to addPixelSuffix() already had px in it, but it wasn't at the end of " +
//                    "the string, which is probably a bad thing.",
//                warn: true
//            });
//        }

        return size;
    };

    var removePixelSuffix = function (text) {
        text = String(text);
        var index = text.indexOf('px');

        if (index !== -1)
        {
            if (index === (text.length-2))
            {
                return text.substr(0, index);
            }
//            else
//            {
//                debug.log({
//                    type: 'utils',
//                    message: "Whatever you supplied to removePixelSuffix() already had px in it, but it wasn't at the " +
//                        "end of the string, which is probably a bad thing.",
//                    warn: true
//                });
//            }
        }

        return text;
    };

    /**
     * Adds a tag to the head of the page by specifying the tag name to use and an object of any
     * attributes you want to use.
     * @param tagName Name of the tag. E.g. 'script', 'meta', 'style'
     * @param attributes Object of attributes to use (e.g. { src: '//domain.com/js/script.js' })
     * @returns {jQuery Deferred}
     */
    var addToHead = function (tagName, attributes) {
        if (_.isEmpty(tagName) || !_.isString(tagName))
        {
            throw new Error("You have to provide a tag name when calling addToHead()");
        }

        tagName = tagName.toLowerCase(); //lowercasing

        if (_.isEmpty(attributes) || !_.isTrueObject(attributes))
        {
            throw new Error("You have to provide at least one attribute and it needs to be passed as an object");
        }

        var deferred = jquery.Deferred();

        if (!tagInHead(tagName, attributes))
        {
            var elem = document.createElement(tagName);

            _.each(attributes, function (value, key) {
                key = key.toLowerCase().replace(/\W/g, '');

                if (/^[a-z0-9-]+$/.test(key))
                {
                    elem.setAttribute(key, value);
                }
            });

            if (tagName === 'style' || tagName === 'script')
            {
                elem.onload = function () {
                    deferred.resolve();
                };
                document.getElementsByTagName('head')[0].appendChild(elem);
            }
            else
            {
                document.getElementsByTagName('head')[0].appendChild(elem);
                deferred.resolve(elem);
            }
        }
        else
        {
            //we should probably let people know if the tag was already there since that might be a sign of
            //another problem
//            debug.warn("You called addToHead(), but the tag already existed in the head", {
//                tagName: tagName,
//                attributes: attributes
//            });
            deferred.resolve(); //the tag is already there, so resolve right away
        }

        return deferred;
    };

    var tagInHead = function (tagName, attributes) {
        if (_.isEmpty(tagName) || !_.isString(tagName))
        {
            throw new Error("You have to provide a tag name when calling tagInHead()");
        }

        if (_.isEmpty(attributes) || !_.isShallowObject(attributes))
        {
            throw new Error("You called tagInHead() with no attributes to match against");
        }

        var attrSelector = tagName;

        _.map(attributes, function (value, key) {
            attrSelector += '['+ key +'="'+ value +'"]';
        });

        var $tag = jquery('head ' + attrSelector);

        return ($tag.length > 0) ? true : false;
    };

    var override = function (startWith, overrideWith, overlay) {
        overlay = overlay || false;

        if (_.isEmpty(startWith) || _.isEmpty(overrideWith) || !_.isTrueObject(startWith) || !_.isTrueObject(overrideWith))
        {
            throw new Error("Both arguments supplied should be non-empty objects");
        }

        var cleaned = _.defaults(startWith, overrideWith);

        _.each(startWith, function (value, key) {
            _.each(overrideWith, function (overrideItemValue, overrideItemKey) {
                if (key === overrideItemKey)
                {
//                    if (overlay && (_.isTrueObject(overrideItemValue) || _.isArray(overrideItemValue)) && !_.isEmpty(overrideItemValue))
//                    {
//                        if (_.isArray(overrideItemValue))
//                        {
//                            _.each(overrideItemValue, function (arrayItem) {
//                                if (_.isEqual(ov, arrayItem))
//                                {
//
//                                }
//                            });
//                        }
//                    }

                    //whether the overlay flag is true or not, it would behave the same way here
                    cleaned[key] = overrideItemValue;
                }
            });
        });

        /**
         * when overlay is true, it should crawl through each key of the overrideWith object and check for a match
         * when one is found, the new value is applied
         */

        return cleaned;
    };

    /**
     * Trims both leading and trailing whitespace off of a supplied string
     * @param {String} text
     * @returns {String} String with whitespace stripped from beginning and end of string
     */
    var trim = function (text)
    {
        if (!_.isString(text) || _.isEmpty(text))
        {
            throw new Error("Whatever you passed to trim() was either not a string or was an empty string", text);
        }

        //if there's a leading space, slice it and try again
        if (text.charAt(0) === ' ')
        {
            text = trim(text.slice(1));
        }

        //if there's a trailing space, slice it and try again
        if (text.charAt(text.length-1) === ' ')
        {
            text = trim(text.slice(0, -1));
        }

        return text;
    };



    //---------------------------------------------- url stuff
    var urlString = window.location.href;

    var getQueryParams = function (url) {
        var queryParamsObject = {}; //this is what we're storing and returning
        url = url || urlString;

        var urlSplit = url.split(/\?(.+)?/)[1];

        if (_.isString(urlSplit) && !_.isEmpty(urlSplit))
        {
            var queryParams = decodeURIComponent(urlSplit).split('&');

            queryParamsObject = arrayToObject(queryParams);

            /**
             * final data will look like so:
             * {
                     *     playerParams: {
                     *         id: "player",
                     *         width: 640,
                     *         ...
                     *     }
                     * }
             */

            //this is for query params that would be separated by a |
//            for (var i = 0, n = queryParams.length; i < n; i++)
//            {
//                var queryParam = queryParams[i];
//                var firstEqIndex = queryParam.indexOf('=');
//                if (firstEqIndex !== -1)
//                {
//                    window.console.log('2');
//                    var keyValuePairsString = queryParam;
//                    var collectionKey = queryParam.substr(0, firstEqIndex); //equates to playerParams in the example above
//                    queryParamsObject[collectionKey] = {};
//                    var keyValuePairsArray = keyValuePairsString.split('|');
//
//                    for (var j = 0, kvpLength = keyValuePairsArray.length; j < kvpLength; j++)
//                    {
//                        window.console.log('3');
//                        var keyValuePair = keyValuePairsArray[j].split('=');
//                        var key = keyValuePair[0];
//                        var value = keyValuePair[1];
//
//                        if (urlSplit[1].indexOf('&') !== -1)
//                        {
//                            window.console.log('4');
//                            keyValuePairsString = queryParam.substr(firstEqIndex+1);
//                            //if we have an ampersand, it's not just a basic pipe string, so we need to make a
//                            // more complex object
//                            queryParamsObject[collectionKey][key] = value;
//                        }
//                        else
//                        {
//                            window.console.log('5');
//                            //just a pipe string, no other key-value pairs so we can make a basic object
//                            queryParamsObject[key] = value;
//                        }
//                    }
//                }
//            }
        }
//
        if (!_.isEmpty(queryParamsObject))
        {
//            window.console.log('queryParamsObject', queryParamsObject);
            return queryParamsObject;
        }
//
        return false;
    };

    var removeQueryParams = function (url) {
        var cleanedURL = '';

        if (_.isDefined(url) && _.isURL(url))
        {
            cleanedURL = url;

            if (url.indexOf('?') !== -1)
            {
                cleanedURL = url.split('?')[0];
            }
            else
            {
                cleanedURL = url;
            }
        }

//        if (_.isEmpty(cleanedURL))
//        {
//            debug.warn("For whatever reason, the URL supplied to removeQueryParams() ended up returning an empty string.");
//        }

        return cleanedURL;
    };

    var getParamValue = function (key, url) {
        var queryParams = getQueryParams(url);

        if (_.isObject(queryParams)) //it should always be an object, but just in case
        {
            for (var prop in queryParams)
            {
                if (prop === key)
                {
                    return queryParams[prop];
                }
            }
        }

        return;
    };

    //second and third params optional
    var paramExists = function (key, value, url) {
        var queryParams = getQueryParams(url);

        for (var prop in queryParams)
        {
            if (queryParams.hasOwnProperty(prop))
            {
                if (prop === key)
                {
                    if (value)
                    {
                        if (queryParams[prop] === value)
                        {
                            return true;
                        }
                        else
                        {
                            return false;
                        }
                    }

                    return true;
                }
            }
        }

        return false;
    };

    /**
     * This is mostly for testing purposes so we can spoof URLs easily, but it's public since I'm big on the "eat your
     * own dog food" thing.
     * @param url
     */
    var setURL = function (url) {
        urlString = url;

        return urlString;
    };

    var getURL = function () {
        return urlString;
    };

    var objectToQueryString = function (object) {
        if (!_.isTrueObject(object) || _.isEmpty(object))
        {
            throw new Error("The single argument you should be providing should be an object");
        }

        var keyValuePairs = [];

        _.each(object, function (value, key) {
            if (_.isTrueObject(value) && !_.isEmpty(value))
            {
                keyValuePairs.push(key + '=' + objectToQueryString(value)); //recursion
            }

            if (_.isArray(value) && !_.isEmpty(value))
            {
                keyValuePairs.push(key + '=' + value.join('&'));
            }

            keyValuePairs.push(key + '=' + value);
        });

        return (!_.isEmpty(keyValuePairs)) ? keyValuePairs.join('&') : false;
    };
    //---------------------------------------------- /url stuff


    //adds our helper methods to Underscore
    (function () {
        _.mixin({
            arrayToObject: arrayToObject,
            objectToArray: objectToArray,
            getKeyFromValue: getKeyFromValue,
            pipeStringToObject: pipeStringToObject,
            objectToPipeString: objectToPipeString,
            lowerCasePropertyNames: lowerCasePropertyNames,
            getColorFromString: getColorFromString,
            addPixelSuffix: addPixelSuffix,
            removePixelSuffix: removePixelSuffix,
            stringToBoolean: stringToBoolean,
            booleanToString: booleanToString,
            override: override,
            trim: trim,
            getParamValue: getParamValue,
            getQueryParams: getQueryParams,
            removeQueryParams: removeQueryParams,
            paramExists: paramExists,
            objectToQueryString: objectToQueryString,
            isDefined: isDefined,
            isLooseEqual: isLooseEqual,
            isShallowObject: isShallowObject,
            isTrueObject: isTrueObject,
            isURL: isURL
        });
    })();

    // Public API
    return {
        arrayToObject: arrayToObject,
        objectToArray: objectToArray,
        getKeyFromValue: getKeyFromValue,
        pipeStringToObject: pipeStringToObject,
        objectToPipeString: objectToPipeString,
        lowerCasePropertyNames: lowerCasePropertyNames,
        getColorFromString: getColorFromString,
        addPixelSuffix: addPixelSuffix,
        removePixelSuffix: removePixelSuffix,
        stringToBoolean: stringToBoolean,
        booleanToString: booleanToString,
        addToHead: addToHead,
        tagInHead: tagInHead,
        override: override,
        trim: trim,
        getParamValue: getParamValue,
        getQueryParams: getQueryParams,
        removeQueryParams: removeQueryParams,
        paramExists: paramExists,
        objectToQueryString: objectToQueryString,
        isDefined: isDefined,
        isLooseEqual: isLooseEqual,
        isShallowObject: isShallowObject,
        isTrueObject: isTrueObject,
        isURL: isURL,

        setURL: setURL,
        getURL: getURL,
        dispatch: dispatcher.dispatch,
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});
/*global define */

/**
 * This class just provides some convenient ways to handle debugging so that it can always be built in and turned on at
 * any point.
 *
 * When you want to provide a debugging level for a module, ask for the debug module as a dependency as you normally
 * would. As a convention, name the argument passed to your module Debug instead of debug. Having a capital letter
 * indicates that you can create new instances using the new keyword and it also allows for better syntax later (you'll
 * see what I mean).
 *
 * Example:
 * define(['debug'], function (Debug) {
 *  var debug = new Debug('modulename');
 *
 * The name that we pass when we instantiate a Debug instance is really important. Aesthetically, it just adds some
 * more context to a console message, but you can also filter debug statements on the page using that same module name.
 * For instance, if you wanted to see debug messages for an advertising module, you would use the query param
 * ?debug=advertising, assuming the string passed to debug was 'advertising' (Note: we actually lowercase everything
 * internally, so it doesn't matter what the case is of the string you supply). That will only show debug messages for
 * that module while you're testing. The default in dev is 'all', which allows you to see every debug message. In prod,
 * there is no default, so debugging can only be enabled by explicitly asking for it via a query param.
 *
 * If you want to see debug messages for many modules at once, just comma separate the items in the query param's value.
 * Example: ?debug=utils,player,base64
 *
 */
define('Debug',['utils', 'underscoreloader'], function (utils, _) {
    

    var console = window.console,
        _debugModes = [];

    return function (moduleName) {
        //-------------------------------------- validation
        if (_.isUndefined(moduleName))
        {
            throw new Error("You didn't supply a category string when you instantiated a Debug instance. " +
                "That's required. Sorry kiddo!");
        }
        else if (_.isString(moduleName))
        {
            // It's my personal belief that no descriptive word can be less than 3 characters, so I'm throwing errors
            // at lazy developers ;)
            if (moduleName.length < 3)
            {
                throw new Error("Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");
            }
        }
        else
        {
            throw new Error("When instantiating the Debug class, it expects a string for the category name as the " +
                "only argument.");
        }
        //-------------------------------------- /validation


        var prefix = 'foxneod-0.7.7:';
        var lastUsedOptions = {};
        var category = moduleName.toLowerCase();

        var log = function (message, data) {
            var options = {
                message: message,
                data: data
            };

            _log('log', options);

            return options;
        };

        var warn = function (message, data) {
            //we add the !!!WARNING!!! since most consoles don't have a native way to display console.warn() differently
            var options = {
                message: '!!!WARNING!!!: ' + message,
                data: data
            };

            _log('warn', options);

            return options;
        };

        var error = function (message, data) {
            var options = {
                message: message,
                data: data
            };

            _log('error', options);

            return options;
        };

        var _log = function (logLevel, options) {
            var debugModes = getDebugModes();

            _.each(getDebugModes(), function (mode) {
                mode = mode.toLowerCase();

                if (_.isEqual(mode, category.toLocaleLowerCase()) || _.isEqual(mode, 'all'))
                {
                    console[logLevel](prefix + ': ' + category + ': ' + options.message, options.data || '');
                    lastUsedOptions = _.clone(options);
                }
            });
        };

        var getDebugModes = function () {
            return _debugModes;
        };

        (function init () {
            var queryParam = utils.getParamValue('debug');

            var splitThatShit = function (queryParams) {
                return queryParam.split(',');
            };

            var lowerCaseThatShit = function (params) {
                return _.each(params, function (param) {
                    param.toLowerCase();
                });
            };

            var processQueryParams = _.compose(splitThatShit, lowerCaseThatShit);

            _debugModes = (queryParam && _.isString(queryParam)) ? processQueryParams() : ['none'];
        })();

        // Surfaced for testing purposes
        var test = {
            getLastUsedOptions: function () {
                console.log('getLastUsedOptions', lastUsedOptions);
                return lastUsedOptions;
            },
            getCategory: function () {
                return category;
            }
        };

        // Public API
        return {
            getDebugModes: getDebugModes,
            log: log,
            warn: warn,
            error: error,
            __test__: test
        };
    };
});
/*global define, _ */

define('polyfills',['Debug', 'Dispatcher', 'underscoreloader'], function (Debug, Dispatcher, _) {

    

    var debug = new Debug('polyfills'),
        dispatcher = new Dispatcher(),
        _polyfillsAdded = [];

    var fixBrokenFeatures = function ()
    {
        if (_.isArray(arguments[0])) //we expect an array of string options here
        {
            var polyfillList = arguments[0];
            for (var i = 0, n = polyfillList.length; i < n; i++)
            {
                if (typeof polyfillList[i] === 'string')
                {
                    var polyfillName = polyfillList[i].toLowerCase();

                    switch (polyfillName)
                    {
                        case 'watch':
                            polyfillWatch();
                            _polyfillsAdded.push(polyfillName);
                            debug.log(polyfillName + " added");
                            dispatcher.dispatch(polyfillName + 'Ready');
                            break;
                    }
                }
            }
        }
    };

    /**
     * Does a little bit extra than the Dispatcher class
     */
    var addEventListener = function (eventName, callback) {
        //instead of requiring a dev to check if it already fired AND listen as a backup, we can take care of that here
        if (added(eventName.split('Ready')[0]))
        {
            debug.log('polyfill already added, just dispatching', eventName);
            dispatcher.addEventListener(eventName, callback);
            dispatcher.dispatch(eventName);
        }
        else
        {
            debug.log('polyfill not already added');
            dispatcher.addEventListener(eventName, callback);
        }
    };

    var added = function (polyfillName)
    {
        var polyfillNameFound = (_polyfillsAdded[_.indexOf(_polyfillsAdded, polyfillName)]) ? true : false;
        var eventNameFound = (_polyfillsAdded[_.indexOf(_polyfillsAdded, polyfillName + 'Ready')]) ? true : false;

        return (polyfillNameFound || eventNameFound);
    };

    //---------------------------------------------- custom polyfills
    /**
     * This allows us to monitor property changes on objects and run callbacks when that happens.
     */
    function polyfillWatch () {
        /*
         * object.watch polyfill
         *
         * 2012-04-03
         *
         * By Eli Grey, http://eligrey.com
         * Public Domain.
         * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
         */

        // object.watch
        if (!Object.prototype.watch) {
            Object.defineProperty(Object.prototype, "watch", {
                enumerable: false
                , configurable: true
                , writable: false
                , value: function (prop, handler) {
                    var
                        oldval = this[prop]
                        , newval = oldval
                        , getter = function () {
                            return newval;
                        }
                        , setter = function (val) {
                            oldval = newval;
                            newval = handler.call(this, prop, oldval, val);
                            return newval;
                        };

                    if (delete this[prop]) { // can't watch constants
                        Object.defineProperty(this, prop, {
                            get: getter
                            , set: setter
                            , enumerable: true
                            , configurable: true
                        });
                    }
                }
            });
        }

        // object.unwatch
        if (!Object.prototype.unwatch) {
            Object.defineProperty(Object.prototype, "unwatch", {
                enumerable: false
                , configurable: true
                , writable: false
                , value: function (prop) {
                    var val = this[prop];
                    delete this[prop]; // remove accessors
                    this[prop] = val;
                }
            });
        }
    }
    //---------------------------------------------- /custom polyfills

    (function init () {
        fixBrokenFeatures(['watch', 'addEventListener']);
    })();

    // Public API
    return {
        added: added,
        dispatch: dispatcher.dispatch,
        addEventListener: addEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});
/*global define */

define('ovp/theplatform',[
    'underscoreloader',
    'utils',
    'Debug'
], function (_, utils, Debug) {
    

    var debug = new Debug('ovp: theplatform'),
        _eventsMap = {
            videoLoad: 'OnLoadReleaseUrl',
            videoBuffer: 'OnMediaBuffer',
            videoEnd: 'OnMediaComplete',
            videoChapterEnd: 'OnMediaEnd',
            videoError: 'OnMediaError',
            videoReady: 'OnMediaLoadStart',
            videoPause: 'OnMediaPause',
            videoPlay: 'OnMediaPlay',
            videoProgress: 'OnMediaPlaying',
            videoSeek: 'OnMediaSeek',
            videoStart: 'OnMediaStart',
            videoResume: 'OnMediaUnpause',
            videoMute: 'OnMute',
            playerLoad: 'OnPlayerLoaded'
        };

    //////////////////////////////////////////////// public functions...
    var getEventsMap = function () {
        return _eventsMap;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api
    return {
        getEventsMap: getEventsMap
    };
    ////////////////////////////////////////////////
});
/*global define, _ */

define('player/pdkwatcher',['Debug', 'jqueryloader', 'underscoreloader'], function (Debug, jquery, _) {
    

    var debug = new Debug('pdkwatcher'),
    _deferred = jquery.Deferred();

    //yuck... so ghetto (the PDK should dispatch an event when it's ready)
    var interval = setInterval(function () {
        if (window.$pdk && _.has(window.$pdk, 'controller'))
        {
            clearInterval(interval);
            debug.log('PDK: Fully Loaded (sequel to Herbie: Fully Loaded)', window.$pdk);
            _deferred.resolve(window.$pdk);
        }
    }, 150);

    return _deferred;
});
/*global define */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define('ovp',[
    'ovp/theplatform',
    'Debug',
    'Dispatcher',
    'player/pdkwatcher',
    'underscoreloader',
    'jqueryloader',
    'utils',
    'polyfills'
], function (thePlatform, Debug, Dispatcher, pdkwatcher, _, jquery, utils, polyfills) {
    

    var _pdk,
        debug = new Debug('ovp'),
        dispatcher = new Dispatcher(),
        ready = false;


    //////////////////////////////////////////////// public methods
    var getController = function () {
        if (ready)
        {
            if (_.isFunction(_pdk.controller))
            {
                return _pdk.controller().controller;
            }
            else if (_.isTrueObject(_pdk.controller))
            {
                return _pdk.controller;
            }
            else
            {
                throw new Error("The controller couldn't be found on the PDK object");
            }
        }

        else
        {
            throw new Error("The expected controller doesn't exist or wasn't available at the time this was called.");
        }
    };

    var getEventsMap = function () {
        //since we only support one ovp right now, this is fine for the time being
        return thePlatform.getEventsMap();
    };

    var mapEvents = function (player) {
        var eventsMap = thePlatform.getEventsMap();

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            player.addEventListener(ovpEventName, function (event) {
                dispatcher.dispatch(normalizedEventName, event);
            });
        });
    };
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// init
    function constructor () {
        pdkwatcher.done(function (pdk) {
            _pdk = pdk;
            ready = true;

            debug.log('PDK is now available inside of ovp.js', pdk);
            dispatcher.dispatch('ready', pdk);
        });
    }

    (function () {
        constructor();
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// Public API
    return {
        version: '5.2.7',
        addEventListener: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,
        isReady: function () {
            return ready;
        },
        controller: function () {
            return getController();
        },
        pdk: function () {
            return _pdk;
        },
        getEventsMap: getEventsMap,
        mapEvents: mapEvents
    };
    ////////////////////////////////////////////////
});
/*global define, _ */

define('player/Iframe',['utils', 'underscoreloader', 'jqueryloader', 'Debug', 'Dispatcher'], function (utils, _, jquery, Debug, Dispatcher) {
    

    return function (selector, iframeURL, suppliedAttributes) {
        //-------------------------------------------------------------------------------- instance variables
        var debug = new Debug('iframe'),
            dispatcher = new Dispatcher(),
            _playerAttributes = {}, //these get passed down from player.js
            _processedAttributes = {},
            _playerToCreate,
            _deferred = new jquery.Deferred(),
            _onloadFired = false;
        //-------------------------------------------------------------------------------- /instance variables



        //-------------------------------------------------------------------------------- private methods
        /**
         * Adds some attributes on top of the ones created at the player.js level.
         *
         * @param attributes
         * @param declaredAttributes
         * @returns {*}
         * @private
         */
        function _processAttributes(selector, attributes) {
            if (_.isUndefined(attributes) || _.isEmpty(attributes))
            {
                throw new Error("_processAttributes expects a populated attributes object. Please contact the " +
                    "Fox NEOD team.");
            }

            attributes.iframePlayerId = 'js-player-' + attributes.playerIndex;
            attributes.iframeHeight = (_.has(attributes, 'iframeheight')) ? attributes.iframeheight : attributes.height;
            attributes.iframeWidth = (_.has(attributes, 'iframewidth')) ? attributes.iframewidth : attributes.width;

            return attributes;
        }

        function _getIframeHTML (iframeURL, attributes) {
            var attributesString = utils.objectToQueryString(attributes);
            attributes = utils.lowerCasePropertyNames(attributes);

            return '<iframe ' +
                'id="'+ attributes.iframeplayerid +'"' +
                'src="'+ iframeURL + '?' + attributesString + '"' +
                'scrolling="no" ' +
                'frameborder="0" ' +
                'width="' + attributes.iframewidth + '"' +
                'height="'+ attributes.iframeheight + '" webkitallowfullscreen mozallowfullscreen msallowfullscreen allowfullscreen></iframe>';
        }

        function _onLoad (event) {
            debug.log('#2) onload fired');
            _onloadFired = true;
            _updateDeferred();
        }

        function _onMetaTagExists () {
//            debug.log('_onMetaTagExists fired');
//            _metaTagExists = true;
//            _updateDeferred();
        }

        function _updateDeferred () {

//            if (_metaTagExists && _onloadFired)
            debug.log('#3) meta tag exists');
            //TODO: this assumes the meta tag in the iframe page, which we obviously can't actually guarantee
            if (_onloadFired)
            {
                debug.log('resolving the iframe', _playerToCreate);
                _deferred.resolve(_playerToCreate);
            }
        }
        //-------------------------------------------------------------------------------- /private methods



        //-------------------------------------------------------------------------------- public methods
        var create = function () {
            var elements = [];
            _playerAttributes = suppliedAttributes;

            if (!_.isString(selector) || _.isEmpty(selector))
            {
                _deferred.reject("The first argument supplied to create() should be a selector");
            }

            var query = document.querySelectorAll(selector),
                atLeastOneElementFound = false;

            _.each(query, function (queryItem, index) {
                if (_.isElement(queryItem))
                {
                    debug.log('element found', queryItem);
                    _processedAttributes = _processAttributes(selector, suppliedAttributes);

                    if (!_.isEmpty(_processedAttributes))
                    {
                        elements.push({
                            controller: null,
                            element: queryItem,
                            attributes: _processedAttributes
                        });
                    }
                }
            });

            if (_.isEmpty(elements))
            {
                _deferred.reject("No players could be created from the selector you provided");
            }

            _playerToCreate = elements[0];

            _playerToCreate.element.innerHTML = _getIframeHTML(iframeURL, _playerToCreate.attributes);
            _playerToCreate.iframe = jquery(_playerToCreate.element).find('iframe')[0];

            document.getElementById(_playerToCreate.attributes.iframePlayerId).onload = function (event) {
                if (!_onloadFired)
                {
                    _onLoad(event);
                }
            };

            debug.log('#1) html injected', _playerToCreate);

            return getReady();
        };

        var getReady = function () {
            return _deferred;
        };
        //-------------------------------------------------------------------------------- public methods


        //-------------------------------------------------------------------------------- init
        (function () {
            //no initialization at the moment
        })();
        //-------------------------------------------------------------------------------- /init


        // This API is only Public to player.js, so we should surface everything so we can unit test it
        return {
            create: create,
            getReady: getReady,
            addEventListener: dispatcher.addEventListener,
            getEventListeners: dispatcher.getEventListeners,
            hasEventListener: dispatcher.hasEventListener,
            removeEventListener: dispatcher.removeEventListener
        };
    };
});
/*global define, _ */

define('player/playback',['Debug', 'ovp'], function (Debug, ovp) {
    

    var debug = new Debug('playback'),
        _controller; //TODO: refactor how this is set and used

    var _setController = function (controller) {
        _controller = controller;
    };

    /**
     * Takes the time to seek to in seconds, rounds it and seeks to that position. If the pdk isn't available, it
     * will return false
     * @param timeInSeconds
     * @returns {boolean}
     */
    var seekTo = function (timeInSeconds) {
        if (_.isUndefined(ovp))
        {
            throw new Error("The OVP object was undefined.");
        }

        if (_.isNaN(+timeInSeconds))
        {
            throw new Error("The value supplied was not a valid number.");
        }


        if (timeInSeconds >= 0)
        {
            var seekTime = Math.round(timeInSeconds * 1000);
            debug.log("Seeking to (in seconds)...", seekTime/1000);
            _controller.seekToPosition(seekTime);
        }
        else
        {
            debug.warn("The time you provided was less than 0, so no seeking occurred.", timeInSeconds);
        }

        return this;
    };

    var play = function () {
        _controller.pause(false);
        return this;
    };

    var pause = function () {
        _controller.pause(true);
        return this;
    };

    //public api
    return {
        _setController: _setController,
        seekTo: seekTo,
        play: play,
        pause: pause
    };
});
/*global define, _ */

define('css',['utils', 'Debug'], function (utils, Debug) {
    

    var getStyles = function (allOptions) {
        /**
         * This for loop is concerned with display elements. We're iterating over the options now that the overrides
         * have been applied, and creating some styles based on those.
         */
        var styles = '';
        var options = utils.lowerCasePropertyNames(allOptions);

        for (var option in options)
        {
            switch (option)
            {
                case 'display':
                    styles += 'display: ' + options.display + ';';
                    //TODO: check for possible values here
                    break;
                case 'position':
                    styles += 'position: ' + options.position + ';';
                    //TODO: add in more checking here?
                    break;

                case 'top':
                    styles += 'top: ' + utils.addPixelSuffix(options.top) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'left':
                    styles += 'left: ' + utils.addPixelSuffix(options.left) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'right':
                    styles += 'right: ' + utils.addPixelSuffix(options.right) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'bottom':
                    styles += 'bottom: ' + utils.addPixelSuffix(options.bottom) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'margin':
                    styles += 'margin: ' + utils.addPixelSuffix(options.margin) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'margintop':
                    styles += 'margin-top: ' + utils.addPixelSuffix(options.margintop) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'marginright':
                    styles += 'margin-right: ' + utils.addPixelSuffix(options.marginright) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'marginbottom':
                    styles += 'margin-bottom: ' + utils.addPixelSuffix(options.marginbottom) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'marginleft':
                    styles += 'margin-left: ' + utils.addPixelSuffix(options.marginleft) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'padding':
                    styles += 'padding: ' + utils.addPixelSuffix(options.padding) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingtop':
                    styles += 'padding-top: ' + utils.addPixelSuffix(options.paddingtop) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingright':
                    styles += 'padding-right: ' + utils.addPixelSuffix(options.paddingright) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingbottom':
                    styles += 'padding-bottom: ' + utils.addPixelSuffix(options.paddingbottom) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingleft':
                    styles += 'padding-left: ' + utils.addPixelSuffix(options.paddingleft) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'textalign':
                    styles += 'text-align: ' + options.textalign+ ';';
                    //TODO: add in more checking here?
                    break;

                case 'width':
                    styles += 'width: ' + utils.addPixelSuffix(options.width) + ';';
                    break;

                case 'height':
                    styles += 'height: ' + utils.addPixelSuffix(options.height) + ';';
                    break;

                case 'bgcolor':
                    styles += 'background-color: ' + utils.getColorFromString(options.bgcolor) + ';';
                    break;

                case 'color':
                    styles += 'color: ' + utils.getColorFromString(options.color) + ';';
                    break;

                case 'fontsize':
                    var size = options.fontsize;
                    styles += 'font-size: ' + utils.addPixelSuffix(size) + ';';
                    break;

                case 'fontfamily':
                    styles += 'font-family: ' + options.fontfamily + ';';
                    //TODO: add in more checking here?
                    break;

                case 'fontweight':
                    styles += 'font-weight: ' + options.fontweight + ';';
                    //TODO: add in more checking here?
                    break;

                case 'lineheight':
                    styles += 'line-height: ' + utils.addPixelSuffix(options.lineheight) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'zindex':
                    if (_.isNumber(options.zindex))
                    {
                        styles += 'z-index: ' + options.zindex + ';';
                    }
                    break;

                case 'opacity':
                    styles += 'filter: alpha(opacity='+ options.opacity * 100 +');';
                    styles += 'opacity: ' + options.opacity + ';';
                    break;

                case 'buttons':
                    break;
            }
        }

        return styles;
    };

    var updateStyles = function (selectorOrElement, style, value) {
        var element = (!_.isString(arguments[0])) ? selectorOrElement : document.querySelector(selectorOrElement);
        var styles = element.getAttribute('style');
//        debug.log('styles', styles);

        if (styles.indexOf(style) !== -1) //style already exists, so we should update it
        {
            styles = styles.replace(/style/g, value);
        }
        else
        {
            styles += style +': '+ value +';';
        }

        element.setAttribute('style', styles);
    };

    // Public API
    return {
        getStyles: getStyles,
        updateStyles: updateStyles
    };
});
/*global define, _, FDM_Player_vars, $pdk, console */

define('modal',['css', 'utils', 'Debug'], function (css, utils, Debug) {
    

    //-------------------------------------------------------------------------------- private properties
    var debug = new Debug('modal'),
        modalClearingListenerAdded = false;
    //-------------------------------------------------------------------------------- /private properties



    //-------------------------------------------------------------------------------- public methods
    var displayModal = function (options) {
        var modalOptions = {
            message: '',
            resetPlayer: false,
            clearAfter: 0 //time in seconds: 0 means it will stay on screen indefinitely
        };

        for (var prop in options)
        {
            modalOptions[prop] = options[prop];
        }

        try
        {
            if (FDM_Player_vars.isFlash && _.isObject($pdk))
            {
                $pdk.controller.resetPlayer();
                $pdk.controller.setPlayerMessage(modalOptions.message, modalOptions.clearAfter);
            }
            else if (FDM_Player_vars.isIOS)
            {
                var tpPlayers = document.querySelectorAll('.tpPlayer');

                for (var i = 0, n = tpPlayers.length; i < n; i++)
                {
                    var tpPlayer = tpPlayers[i];
                    injectModal(tpPlayer, modalOptions);
                }
            }
        }
        catch (exception)
        {
//            throw new Error(exception);
            debug.log('The try/catch for the modal stuff failed');
            // TODO: handle this, or get to a point where i don't have to use a try/catch
        }
    };

    var injectModal = function (player, options) {
        var modal = getModalOverlay({
            width: player.offsetWidth,
            height: player.offsetHeight,
            text: options.message
        });

        if (_.isElement(player) && _.isElement(modal))
        {
            player.insertBefore(modal, player.firstChild);
            verticallyCenter('.js-modal-container');
            removeModals(options.clearAfter*1000);
        }

        if (options.resetPlayer)
        {
            var playerDiv = player.querySelector('.player'); //TODO: fix this hardcoded string?
            $pdk.controller.pause(true);

            //TODO: this is probably bad and will need to be externalized to a config
            $pdk.controller.setReleaseURL('http://link.theplatform.com/s/fxnetworks/p9xHQIEhwoBi', true);
            registerEventListener();
        }
    };

    var registerEventListener = function () {
        if (!modalClearingListenerAdded)
        {
            $pdk.controller.addEventListener('OnMediaLoadStart', function () {
                removeModals(1);
            });

            modalClearingListenerAdded = true;
        }
    };

    var removeModals = function (clearAfter) { //here, clearAfter is in milliseconds
        var modalOverlays = document.querySelectorAll('.js-modal-overlay');

        var iterateAndRemove = function () {
            for (var i = 0, n = modalOverlays.length; i < n; i++)
            {
                var modal = modalOverlays[i];

                modal.parentNode.removeChild(modal);
            }
        };

        if (clearAfter > 0)
        {
            setTimeout(iterateAndRemove, clearAfter);
        }
    };
    //-------------------------------------------------------------------------------- /public methods



    //-------------------------------------------------------------------------------- private methods
    var overrideDefaultOptions = function (defaults, overrides, skip) {
        var itemsToSkip = skip || [];

        /**
         * This loops through the provided options object and overrides the defaults in the standardOptions object
         * above. We can also do some type-checking here to make sure values are in the right format.
         */

        if (overrides && _.isObject(overrides))
        {
            for (var prop in overrides)
            {
                var propLowercase = prop.toLowerCase();
                var value = overrides[prop];

                if (defaults.hasOwnProperty(propLowercase)) //only override defaults
                {
                    var skipThisIteration = false;

                    /**
                     * Loops over the items in the third arg (array) and let's the next block know to skip over
                     * them so that we can preserve defaults
                     */
                    for (var i = 0, n = itemsToSkip.length; i < n; i++)
                    {
                        if (propLowercase === itemsToSkip[i])
                        {
                            skipThisIteration = true;
                        }
                    }

                    if (!skipThisIteration)
                    {
                        if (propLowercase === 'buttons' && !_.isArray(value))
                        {
                            overrides[propLowercase] = []; //if we didn't get an array, let's fix that
                            //TODO: let the developer know they're screwing up
                        }

                        if (propLowercase === 'opacity' && _.isNumber(value))
                        {
                            if (value >= 1 && value <= 100) //supplied opacity is on the wrong scale (should be based on 1)
                            {
                                overrides[prop] = value/100;
                            }
                        }

                        defaults[propLowercase] = value;
                    }
                }
            }
        }

        return defaults || {};
    };

    /**
     * Takes a single argument, an object of options, and creates an div tag for displaying a modal overlay.
     * @param optionOverrides
     * @returns {string}
     */
    var getModalOverlay = function (optionOverrides) {
        var defaults = {
            text: '',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 640,
            height: 360,
            bgcolor: '#000000',
            opacity: 1, //on a scale of 0 to 1
            zindex: 10,
            textalign: 'center',
            padding: 0,
            buttons: [] //this would be a list of button objects, but by default there are none
        };

        var titleOptions = {
            color: '#FFFFFF',
            fontsize: 18,
            fontweight: 'normal',
            margin: 0,
            padding: 25,
            lineheight: 27
        };

        var options = overrideDefaultOptions(defaults, optionOverrides);
        var buttons = '';

        if (_.isArray(options.buttons))
        {
            for (var i = 0, n = options.buttons.length; i < n; i++)
            {
                var button = options.buttons[i];
                var modalButton = getModalButtonMarkup(button);

                buttons += getModalButtonMarkup(button);
            }
        }

        var modalContainerOptions = {
            margin: '0px auto',
            position: 'relative'
        };

        var element = '<div class="js-modal-container" style="'+ css.getStyles(modalContainerOptions) +'">\n        <h4 style="'+ css.getStyles(titleOptions) +'">'+options.text+'</h4>\n        <div class="js-modal-buttons">\n            '+ getButtons(options.buttons) +'\n        </div>\n    </div>';

        var wrappingDiv = document.createElement('div');
        wrappingDiv.setAttribute('class', 'js-modal-overlay');
        wrappingDiv.setAttribute('style', css.getStyles(options));
        wrappingDiv.innerHTML = element;

        return wrappingDiv;
    };

    var getButtons = function (buttons) {
        var buttonsMarkup = '';

        if (_.isArray(buttons))
        {
            for (var i = 0, n = buttons.length; i < n; i++)
            {
                var button = buttons[i];
                buttonsMarkup += getModalButtonMarkup(button);
            }
        }

        return buttonsMarkup;
    };

    var getModalButtonMarkup = function (buttonOptions) {
        var defaults = {
            width: 100,
            height: 40,
            text: 'Okay',
            color: '#000000'
        };

        var options = overrideDefaultOptions(defaults, buttonOptions);
        var element = '<button class="modalButton" style="'+ css.getStyles(options) +'">'+ options.text +'</button>';

        return element;
    };

    var verticallyCenter = function (selector) {
        try {
            var element = document.querySelector(selector);
            var parent = element.parentNode;
            var parentHeight = parent.offsetHeight;
            var elementHeight = element.offsetHeight;
            var middle = Math.round(parent.offsetHeight/2 - element.offsetHeight/2);

            css.updateStyles(element, 'top', utils.addPixelSuffix(middle));
        }
        catch (error)
        {

        }
    };
    //-------------------------------------------------------------------------------- /private methods

    // Public API
    return {
        displayModal: displayModal,
        remove: removeModals
    };
});










/*global define */

define('query',['utils', 'underscoreloader', 'Debug', 'jqueryloader'], function (utils, _, Debug, jquery) {
    

    var debug = new Debug('query'),
        _defaultConfig = {
            feedURL: null,
            fields: [
                'id',
                'title',
                'expirationDate',
                'content',
                'thumbnails'
            ]
        },
        _config = {};

    function _makeRequest (requestURL) {
        var deferred = new jquery.Deferred();
        debug.log('_makeRequest', requestURL);

        if (!_.isURL(requestURL))
        {
            var errorResponse = {
                type: 'error',
                description: "You didn't supply a URL"
            };

            deferred.reject(errorResponse);
        }
        else
        {
            var jqxhr = jquery.get(requestURL)
                .done(function (jsonString) {
                    try {
                        var json = JSON.parse(jsonString);
                        deferred.resolve(json);
                    }
                    catch (error)
                    {
                        deferred.reject(error);
                    }
                })
                .fail(function (error) {
                    debug.log('failed', arguments);
                    deferred.reject(JSON.parse(error));
                })
                .always(function () {
                    debug.log('always logged', arguments);
                });
        }

        return deferred;
    }

    var getFeedDetails = function (feedURL, callback) { //callback is optional since we return a Promise
        var deferred = new jquery.Deferred();
        var errorResponse = {
            type: 'error',
            description: "You didn't supply a URL to getFeedDetails()"
        };

        if (_.isUndefined(feedURL))
        {
            errorResponse.description = "Whatever was passed to getFeedDetails() was undefined";
            return deferred.reject(errorResponse);
        }
        else if (!isFeedURL(feedURL))
        {
            errorResponse.description = "You didn't supply a valid feed URL to getFeedDetails()";
            return deferred.reject(errorResponse);
        }

        feedURL = _.removeQueryParams(feedURL);
        feedURL += '?form=json&range=1-1';

        _makeRequest(feedURL).always(function (response) {
            //with every error response coming from _makeRequest, there's a type property, so we know this is an error
            // if it's defined
            if (_.isUndefined(response.type))
            {
                var shallowified = {};

                _.each(response, function (value, key) {
                    if (!_.isObject(value))
                    {
                        shallowified[key] = value;
                    }
                });

                deferred.resolve(shallowified);
            }
            else
            {
                deferred.reject(response);
            }

            //if a callback was passed in (optional), then we can call it back here with the foxneod scope
            if (_.isFunction(callback))
            {
                callback.apply(window['foxneod'], response);
            }
        });

        return deferred;
    };

    var getVideo = function (obj, callback) {
        var video = {},
            deferred = new jquery.Deferred(),
            feedURL = _.removeQueryParams(obj) || _defaultConfig.feedURL,
            errorResponse = {
                type: 'error',
                description: ""
            };

        if (!_.isDefined(obj) || _.isEmpty(obj) || _.isArray(obj) && !feedURL)
        {
            errorResponse.description = "You need to supply SOMETHING to getVideo()";
            deferred.reject(false);

            //DRY this up (it's used below too)
            if (_.isFunction(callback))
            {
                callback(errorResponse);
            }
        }

        if (isFeedURL(obj)) //feed url
        {
            feedURL += '?form=json&range=1-1'; //we just want to grab the first video, so let's make the request lighter
        }
//        else if (isReleaseURL(obj)) //release url
//        {
//            var releaseURL = _.removeQueryParams(obj);
//        }
        else if (isGuid(obj)) //true guid
        {
            debug.log("byGuid=" + obj);
            feedURL += "?form=json&range=1-1&byGuid=" + obj;
        }
        else //start making assumptions and trying stuff
        {
//            if (_.isFinite(obj)) //id
//            {
//                jquery.noop();
//            }

            feedURL += "?form=json&range=1-1&byGuid=" + obj; //try guid
//            feedURL += "?form=json&range=1-1&byReleaseId=" + obj; //try release id
//            feedURL += "?form=json&range=1-1&byReleaseGuid=" + obj; //try release guid
//            feedURL += "?form=json&range=1-1&byPid=" + obj; //try pid
        }

        if (isFeedURL(feedURL))
        {
            debug.log("Making request for getVideo()", feedURL);

            _makeRequest(feedURL)
                .done(function (response) {
                    deferred.resolve(response);
                })
                .fail(function (response) {
                    deferred.fail(response);
                })
                .always(function (response) {
                    // if we've been given a callback, we should call it no matter what
                    if (_.isFunction(callback))
                    {
                        callback.apply(response);
                    }
                });
        }
        else
        {
            errorResponse.description = "If you'd like to get a video just from its GUID, please set a default feed first using setDefaultFeedURL()";
            deferred.reject(errorResponse);

            if (_.isFunction(callback))
            {
                callback(errorResponse);
            }
        }

        return deferred;
    };

    var isFeedURL = function (url) {
        if (_.isString(url) && _.isURL(url) && url.indexOf('feed.theplatform.com') !== -1)
        {
            return true;
        }

        return false;
    };

    var isGuid = function (guid) {
        var regex = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;

        return regex.test(guid);
    };

    var isReleaseURL = function (url) {
        if (_.isString(url) && _.isURL(url) && url.indexOf('link.theplatform.com') !== -1)
        {
            return true;
        }

        return false;
    };

    var setDefaultFeedURL  = function (feedURL) {
        if (!isFeedURL(feedURL))
        {
            throw new Error("The feed URL you provided to setDefaultFeedURL() is not a valid feed");
        }
        else
        {
            _defaultConfig.feedURL = _.removeQueryParams(feedURL);
        }

        return true;
    };



    function init (config) {
        if (_.isDefined(config))
        {
            _config = _.defaults(config, _defaultConfig); //apply defaults to any null/undefined values
        }
    }

    return {
        getFeedDetails: getFeedDetails,
        getVideo: getVideo,
        isFeedURL: isFeedURL,
        isGuid: isGuid,
        isReleaseURL: isReleaseURL,
        setDefaultFeedURL: setDefaultFeedURL
    };
});
/*global define, FDM_Player */

define('player',['ovp',
    'player/Iframe',
    'player/playback',
    'modal',
    'Debug',
    'jqueryloader',
    'underscoreloader',
    'Dispatcher',
    'query',
    'utils'
], function (ovp, Iframe, playback, modal, Debug, jquery, _, Dispatcher, query, utils) {
    

    var debug = new Debug('player'),
        dispatcher = new Dispatcher(),
        _currentVideo = {},
        _mostRecentAd = {},
        _unboundPlayers = [], //players wait in this queue for OVP to be ready
        _players = [],
        _currentPosition,
        _currentPlayer,
        _promisesQueue = [],
        _playerIndex = 0,
        _insideIframe = false;

    //////////////////////////////////////////////// private methods...
    function _addExternalControllerMetaTag () {
        var attributes = {
            name: "tp:EnableExternalController",
            content: "true"
        };

        //returns a Promise
        return utils.addToHead('meta', attributes);
    }

    function _addExternalControllerScriptTag () {
        var attributes = {
            type: 'text/javascript',
            src: 'http://player.foxfdm.com/shared/1.4.527/' + 'pdk/tpPdkController.js'
        };

        var deferred = utils.addToHead('script', attributes);
        deferred.done(function () {
            debug.log('#4) external script controller added');
        });

        //returns a Promise
        return deferred;
    }

    function _processAttributes (selector, suppliedAttributes, declaredAttributes) {
        var attributes = suppliedAttributes || {};

        if (_.isDefined(declaredAttributes))
        {
            if (_.isTrueObject(attributes) && !_.isEmpty(attributes))
            {
                attributes = utils.override(declaredAttributes || {}, attributes);
            }
            else
            {
                attributes = declaredAttributes;
            }
        }

        /*
         * All of this just makes sure that we get a proper height/width to set on the iframe itself, which is
         * not always the same as the height and width of the player.
         */

        var defaults = {
            width: (_.has(attributes, 'width')) ? attributes.width : 640,
            height: (_.has(attributes, 'height')) ? attributes.height : 360,
            suppliedId: (_.has(attributes, 'suppliedId')) ? attributes.suppliedId : jquery(selector).attr('id'),
            debug: utils.getParamValue('debug')
        };

        attributes.width = defaults.width;
        attributes.height = defaults.height;
        attributes.playerIndex = _playerIndex++;
        attributes.debug = attributes.debug || defaults.debug;
        attributes.suppliedId = defaults.suppliedId;

        return attributes;
    }

    function _getUnboundPlayers () {
        return _unboundPlayers;
    }

    function _onLoadReleaseURL (event) {
        debug.log('OnLoadReleaseURL fired', event);
        _currentPlayer.controller.removeEventListener('OnLoadReleaseURL', _onLoadReleaseURL);

        _.each(_promisesQueue, function (promiseDeets) {
            debug.log('promiseDeets', promiseDeets);

            debugger;
            promiseDeets.deferred.resolve(event);

            if (_.isFunction(promiseDeets.callback))
            {
                promiseDeets.callback(promiseDeets.deferred);
            }
        });
    }

    function _addEventListeners () {
        dispatcher.addEventListener('videoStart', function (event) {
            debug.log('start', event);
        });

        dispatcher.addEventListener('videoProgress', function (event) {
            debug.log('progress', event);

            if (!(event && event.data && _.isDefined(event.data.id) && _.isDefined(event.data.baseClip)))
            {
                return;
            }

            if (_currentVideo.id === event.data.id)
            {
                _currentVideo = event.data.baseClip;
            }
        });

        dispatcher.addEventListener('videoEnd', function (event) {
            debug.log('end');
        });
    }

    function _attachEventListeners (player) {
        var eventsMap = ovp.getEventsMap();

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            player.addEventListener(ovpEventName, function (event) {
                debug.log(ovpEventName + ' fired - dispatching ' + normalizedEventName + ' internally');
                dispatcher.dispatch(normalizedEventName, event);
            });
        });
    }
    ////////////////////////////////////////////////



    ////////////////////////////////////////////////  ovp initialize...
    /**
     * Once ovp is ready, we want to make sure that we bind each of the remaining players in our _unboundPlayers array
     * @returns {Promise}
     */
    function _bindRemainingPlayers () {
        var unboundPlayers = _getUnboundPlayers(),
            deferred = new jquery.Deferred(),
            _atLeastOneRemaining = false;

        if (!_.isArray(unboundPlayers) || _.isEmpty(unboundPlayers))
        {
            deferred.reject("There were no players left to bind");
        }

        debug.log('_bindRemainingPlayers', unboundPlayers);

        _.each(unboundPlayers, function (player, index) {
            if (_.isUndefined(player.controller) || _.isEmpty(player.controller)) //check for unbound controllers
            {
                _atLeastOneRemaining = true;
                debug.log('#5) sending player to _bindPlayer()', player);
                _bindPlayer(player);
                debug.log('manually dispatching onload for the iframe', player);
                document.getElementById(player.attributes.iframePlayerId).onload();
                playback._setController(player.controller);
            }
        });

        if (_atLeastOneRemaining)
        {
            deferred.resolve(_players);
        }
        else
        {
            deferred.reject("All remaining players already had controllers");
        }

        var logMessage = (!_.isEmpty(_unboundPlayers)) ? 'not all players were able to be bound' : 'all unbound players are now bound';
        debug.log(logMessage, _unboundPlayers);

        return deferred;
    }

    /**
     * Right now since we're still using the FDM_Wrapper, the _bindPlayer() method is really only used for iframe players
     *
     * @param player
     * @private
     */
    function _bindPlayer(player)
    {
        var deferred = new jquery.Deferred();

        if (ovp.isReady())
        {
            var attributes = player.attributes;

            debug.log('#6) binding player', player);
            //if ovp is already good to go, we can bind now, otherwise we'll bind when ovp:ready fires
            player.controller = ovp.pdk().bind(attributes.iframePlayerId);
            _attachEventListeners(player.controller);
            _players.push(player);
            _unboundPlayers.splice(player.attributes.playerIndex, 1);

            debug.log('#7) players array updated', _players);
            dispatcher.dispatch('playerCreated', player);
        }
        else
        {
            _unboundPlayers.push(player);
            debug.log('adding unbound player to list', _unboundPlayers);
        }

        _currentPlayer = player;
        deferred.resolve(player);

        return deferred;
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var setPlayerMessage = function (options) {
        if (_.isObject(options))
        {
            modal.displayModal(options);
        }
        else
        {
            debug.log('setPlayerMessage expected 1 argument: an object of options.', options);
        }
    };

    var clearPlayerMessage = function () {
        modal.remove();
    };

    var getCurrentVideo = function () {
        return _currentVideo;
    };

    var getMostRecentAd = function () {
        return _mostRecentAd;
    };

    var control = function (playerIdSelector) {
        var controllerToUse = getController(playerIdSelector);

        debug.log('setting controller', controllerToUse);
        playback._setController(controllerToUse);

        return playback;
    };

    var getController = function (selector) {
        var elements = jquery(selector),
            controllerToUse = null;

        _.each(elements, function (element) {
            var id = jquery(element).attr('id');

            if (!_.isUndefined(id))
            {
                 _.each(_players, function (player) {
                    debug.log("searching for player controller...");
                    if (player.attributes.suppliedId === id || player.attributes.iframePlayerId === id)
                    {
                        controllerToUse = player.controller;
                    }
                });
            }
        });

        if (_.isUndefined(controllerToUse) && (_.isObject(_currentPlayer) && !_.isEmpty(_currentPlayer)))
        {
            debug.log("using the default player's controller");
            controllerToUse = _currentPlayer.controller;
        }

        if (!_.isUndefined(controllerToUse) && !_.isEmpty(controllerToUse))
        {
            debug.log('controller to use', controllerToUse);
            return controllerToUse().controller;
        }
        else
        {
            debug.warn("The selector you provided doesn't point to a player on the page");
        }

        debug.log('getController() returning false');
        return false;
    };

    var loadVideo = function (releaseURLOrId, callback) {
        //////////////////////////////////////////////// fail fast...
        var deferred = new jquery.Deferred(),
            errorMessage = '';

        if (!query.isReleaseURL(releaseURLOrId))
        {
            errorMessage = "The loadVideo() method expects one argument: a release URL";
            deferred.reject(errorMessage);
            throw new Error(errorMessage);
        }

        if (_.isUndefined(_currentPlayer))
        {
            errorMessage = "There was no default player set to load the video into";
            deferred.reject(errorMessage);
            throw new Error(errorMessage);
        }
        ////////////////////////////////////////////////

        _promisesQueue.push({
            id: _.removeQueryParams(releaseURLOrId),
            deferred: deferred,
            callback: callback
        });

        //////////////////////////////////////////////// load...
        _currentPlayer.controller.addEventListener('OnLoadReleaseUrl', _onLoadReleaseURL);

        debug.log('calling loadReleaseURL()', releaseURLOrId);
        _currentPlayer.controller.loadReleaseURL(releaseURLOrId, true);
        ////////////////////////////////////////////////

        return deferred;
    };

    var getCurrentPosition = function () {
        var details = {
            position: null,
            duration: null,
            percentComplete: null
        };

        if (_.isTrueObject(_currentPosition) && !_.isEmpty(_currentPosition))
        {
            details.position = _currentPosition.currentTime;
            details.duration = _currentPosition.duration;
            details.percentComplete = _currentPosition.percentComplete;
        }

        return details;
    };

    /**
     * Creates a player in the page at the given selector.
     *
     * @param selector {String} Selector string to the HTML element where the player should get created
     * @param config {String|Object} String that points to a default configuration or an object providing
     * the config to use
     * @returns {Object} Returns the final config object
     */
    var createPlayer = function (selector, config) {
        //validate selector argument
        if (_.isUndefined(selector) || !_.isString(selector) || _.isEmpty(selector))
        {
            throw new Error("The first argument supplied to create() should be a selector string");
        }

        //validate config argument
        if (_.isEmpty(config) || (!_.isString(config) && !_.isTrueObject(config)))
        {
            throw new Error("The second argument supplied to create() should be either a network acronym or a non-empty object");
        }

        try {
            var player = window.player = {},
                pdkDebug = _.find(debug.getDebugModes(), function (debugMode) {
                    if (_.isEqual(debugMode, 'pdk'))
                    {
                        return true;
                    }
                });

            config = _processAttributes(selector, config);

            window['player'] = config;
            var fdmPlayer = new FDM_Player('player', config.width, config.height);
            player.logLevel= (_.isEqual(pdkDebug, 'pdk')) ? 'debug' : 'none';

            _.each(config, function (prop, key) {
                if (_.isEqual(key, 'iframePlayerId'))
                {
                    _addExternalControllerMetaTag().done(function (event) {
                        debug.log('external controller meta tag added');
                    });

                    _insideIframe = true;
                }
            });

            debug.log('PDK logLevel', player.logLevel);
            debug.log('creating player with config', config);
            //TODO: fix the coupling so that you can pass a selector to FDM_Player (or just finally replace the thing)
        }
        catch (error) {
            throw new Error(error);
        }

        return config;
    };

    /**
     * Get an array of all the current players being used
     *
     * @returns {Array} Returns an array of players that have been asked to be created, whether
     * they've been created or not yet
     */
    var getPlayers = function () {
        return _players;
    };

    var getPlayerByAttribute = function (key, value) {
        if (_.isUndefined(key) || _.isUndefined(value))
        {
            throw new Error("getPlayerByAttribute() expects two arguments: a key and a value");
        }

        if (!_.isString(key) || _.isEmpty(key))
        {
            throw new Error("The first argument for getPlayerByAttribute() should be a non-empty string");
        }

        if ((!_.isString(value) && !_.isNumber(value)) || _.isEmpty(value))
        {
            throw new Error("The second argument for getPlayerByAttribute() should be a non-empty string or a number");
        }

        var players = (!_.isEmpty(_players)) ? _players : _unboundPlayers;

        if (_.isEmpty(players)) //this could be _unboundPlayers, and it could be empty
        {

            _.each(players, function (player) {
                _.each(player, function (playerValue, playerKey) {
                    if (playerKey.toLowerCase() === key.toLowerCase() && playerValue.toLowerCase() === value.toLowerCase())
                    {
                        return player;
                    }
                });
            });
        }

        return false;
    };

    /**
     * Get's any declarative player attributes (data-player).
     *
     * @param element The element to check for a data-player attribute
     * @returns {{}}
     */
    var getPlayerAttributes = function (selector) {
        var playerAttributes = {},
            elementId;

        var element = document.querySelectorAll(selector);

        //if there are multiple elements from the selector, just use the first one we found
        if (_.isObject(element))
        {
            element = element[0];
        }

        if (_.isDefined(element))
        {
            if (!_.isElement(element))
            {
                throw new Error("What you passed to getPlayerAttributes() wasn't an element. It was likely something " +
                    "like a jQuery object, but try using document.querySelector() or document.querySelectorAll() to get " +
                    "the element that you need. We try to not to depend on jQuery where we don't have to.");
            }

            var allAttributes = element.attributes;

            for (var i = 0, n = allAttributes.length; i < n; i++)
            {
                var attr = allAttributes[i],
                    attrName = attr.nodeName;

                if (attrName === 'data-player')
                {
                    playerAttributes = utils.pipeStringToObject(attr.nodeValue);
                }

                if (attrName === 'id')
                {
                    elementId = attr.nodeValue;
                }
            }

            //if the element supplied has an ID, just use that since it's unique (or at least it should be!)
            if (elementId)
            {
                playerAttributes.id = elementId;
            }
        }
        else
        {
            debug.warn("You called getPlayerAttributes() and whatever you passed (or didn't pass to it) was " +
                "undefined. Thought you should know since it's probably giving you a headache by now :)");
        }

        return playerAttributes;
    };

    /**
     *
     * @param selector
     * @param iframeURL
     * @param suppliedAttributes
     */
    var injectIframePlayer = function (selector, iframeURL, suppliedAttributes) {
        var declaredAttributes = getPlayerAttributes(selector);
        debug.log('declaredAttributes', declaredAttributes);

        var attributes = _processAttributes(selector, suppliedAttributes, declaredAttributes);
        var iframe = new Iframe(selector, iframeURL, attributes);

        var iframePlayer =
        iframe.create()
            .then(function (player) {
                iframePlayer = player;
                return _addExternalControllerScriptTag(); //returns a Promise
            })
            .then(function () {
                _bindPlayer(iframePlayer);
            });
    };

    var hide = function () {
        this.pause();
        jquery(_currentPlayer.element).hide();

        return true;
    };

    var show = function () {
        jquery(_currentPlayer.element).show();

        return true;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// init...
    (function init () {
        if (ovp.isReady())
        {
            _bindRemainingPlayers();
            _addEventListeners();
        }
        {
            ovp.addEventListener('ready', function () {
                _bindRemainingPlayers();
                _addEventListeners();
            });
        }
    })();
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api...
    /**
     * Most of the player's functionality is broken off into submodules, but surfaced here through this one API
     * entry point
     */
    return {
        //public api
        setPlayerMessage: setPlayerMessage,
        clearPlayerMessage: clearPlayerMessage,
        createIframe: injectIframePlayer,
        injectIframePlayer: injectIframePlayer, //old alias (will deprecate eventually)
        hide: hide,
        show: show,
        getCurrentVideo: getCurrentVideo,
        getMostRecentAd: getMostRecentAd,
        loadVideo: loadVideo,
        getPosition: getCurrentPosition,
        create: createPlayer,
        getPlayers: getPlayers,

        //control methods
        control: control,
        getController: getController,
        seekTo: playback.seekTo,
        play: playback.play,
        pause: playback.pause,

        //event listening
        addEventListener: dispatcher.addEventListener,
        on: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,

        //testing-only api (still public, but please DO NOT USE unless unit testing)
        __test__: {
            _processAttributes: _processAttributes,
            ovp: ovp
        }
    };
    ////////////////////////////////////////////////
});
/*global define, _ */

define('UAParser',[], function () {

    // UAParser.js v0.6.1
    // Lightweight JavaScript-based User-Agent string parser
    // https://github.com/faisalman/ua-parser-js
    //
    // Copyright © 2012-2013 Faisalman <fyzlman@gmail.com>
    // Dual licensed under GPLv2 & MIT

    

    //////////////
    // Constants
    /////////////


    var EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        MAJOR       = 'major',
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet';


    ///////////
    // Helper
    //////////


    var util = {
        has : function (str1, str2) {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
        },
        lowerize : function (str) {
            return str.toLowerCase();
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function () {

            // loop through all regexes maps
            for (var result, i = 0, j, k, p, q, matches, match, args = arguments; i < args.length; i += 2) {

                var regex = args[i],       // even sequence (0,2,4,..)
                    props = args[i + 1];   // odd sequence (1,3,5,..)

                // construct object barebones
                if (typeof(result) === UNDEF_TYPE) {
                    result = {};
                    for (p in props) {
                        q = props[p];
                        if (typeof(q) === OBJ_TYPE) {
                            result[q[0]] = undefined;
                        } else {
                            result[q] = undefined;
                        }
                    }
                }

                // try matching uastring with regexes
                for (j = k = 0; j < regex.length; j++) {
                    matches = regex[j].exec(this.getUA());
                    if (!!matches) {
                        for (p in props) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof(q) === OBJ_TYPE && q.length > 0) {
                                if (q.length === 2) {
                                    if (typeof(q[1]) === FUNC_TYPE) {
                                        // assign modified match
                                        result[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        result[q[0]] = q[1];
                                    }
                                } else if (q.length === 3) {
                                    // check whether function or regex
                                    if (typeof(q[1]) === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length === 4) {
                                    result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                result[q] = match ? match : undefined;
                            }
                        }
                        break;
                    }
                }

                if(!!matches)
                {
                    break; // break the loop immediately if match found
                }
            }
            return result;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof(map[i]) === OBJ_TYPE && map[i].length > 0) {
                    for (var j in map[i]) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                major : {
                    '1' : ['/8', '/1', '/3'],
                    '2' : '/4',
                    '?' : '/'
                },
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/((\d+)?[\w\.-]+)/i,                                 // Opera Mini
            /(opera\s[mobiletab]+).+version\/((\d+)?[\w\.-]+)/i,                // Opera Mobi/Tablet
            /(opera).+version\/((\d+)?[\w\.]+)/i,                               // Opera > 9.80
            /(opera)[\/\s]+((\d+)?[\w\.]+)/i                                    // Opera < 9.80

        ], [NAME, VERSION, MAJOR], [

            /\s(opr)\/((\d+)?[\w\.]+)/i                                         // Opera Webkit
        ], [[NAME, 'Opera'], VERSION, MAJOR], [

            // Mixed
            /(kindle)\/((\d+)?[\w\.]+)/i,                                       // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?((\d+)?[\w\.]+)*/i,
            // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?((\d+)?[\w\.]*)/i,
            // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s((\d+)?[\w\.]+)/i,                                  // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)((?:\/)[\w\.]+)*/i,                                        // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt)\/((\d+)?[\w\.-]+)/i
            // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt
        ], [NAME, VERSION, MAJOR], [

            /(yabrowser)\/((\d+)?[\w\.]+)/i                                     // Yandex
        ], [[NAME, 'Yandex'], VERSION, MAJOR], [

            /(comodo_dragon)\/((\d+)?[\w\.]+)/i                                 // Comodo Dragon
        ], [[NAME, /_/g, ' '], VERSION, MAJOR], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?((\d+)?[\w\.]+)/i
            // Chrome/OmniWeb/Arora/Tizen/Nokia
        ], [NAME, VERSION, MAJOR], [

            /(dolfin)\/((\d+)?[\w\.]+)/i                                        // Dolphin
        ], [[NAME, 'Dolphin'], VERSION, MAJOR], [

            /((?:android.+)crmo|crios)\/((\d+)?[\w\.]+)/i                       // Chrome for Android/iOS
        ], [[NAME, 'Chrome'], VERSION, MAJOR], [

            /version\/((\d+)?[\w\.]+).+?mobile\/\w+\s(safari)/i                 // Mobile Safari
        ], [VERSION, MAJOR, [NAME, 'Mobile Safari']], [

            /version\/((\d+)?[\w\.]+).+?(mobile\s?safari|safari)/i              // Safari & Safari Mobile
        ], [VERSION, MAJOR, NAME], [

            /webkit.+?(mobile\s?safari|safari)((\/[\w\.]+))/i                   // Safari < 3.0
        ], [NAME, [MAJOR, mapper.str, maps.browser.oldsafari.major], [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/((\d+)?[\w\.]+)/i,                                    // Konqueror
            /(webkit|khtml)\/((\d+)?[\w\.]+)/i
        ], [NAME, VERSION, MAJOR], [

            // Gecko based
            /(navigator|netscape)\/((\d+)?[\w\.-]+)/i                           // Netscape
        ], [[NAME, 'Netscape'], VERSION, MAJOR], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?((\d+)?[\w\.\+]+)/i,
            // Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/((\d+)?[\w\.-]+)/i,
            // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/((\d+)?[\w\.]+).+rv\:.+gecko\/\d+/i,                    // Mozilla

            // Other
            /(uc\s?browser|polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf)[\/\s]?((\d+)?[\w\.]+)/i,
            // UCBrowser/Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf
            /(links)\s\(((\d+)?[\w\.]+)/i,                                      // Links
            /(gobrowser)\/?((\d+)?[\w\.]+)*/i,                                  // GoBrowser
            /(ice\s?browser)\/v?((\d+)?[\w\._]+)/i,                             // ICE Browser
            /(mosaic)[\/\s]((\d+)?[\w\.]+)/i                                    // Mosaic
        ], [NAME, VERSION, MAJOR]
        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
        ], [[ARCHITECTURE, 'amd64']], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
        ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
        ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
        ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
        ], [[ARCHITECTURE, 'sparc']], [

            /(ia64(?=;)|68k(?=\))|arm(?=v\d+;)|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
            // IA64, 68K, ARM, IRIX, MIPS, SPARC, PA-RISC
        ], [ARCHITECTURE, util.lowerize]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
        ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
        ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\((ip[honed]+);.+(apple)/i                                         // iPod/iPhone
        ], [MODEL, VENDOR, [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|huawei|meizu|motorola)[\s_-]?([\w-]+)*/i,
            // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Huawei/Meizu/Motorola
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
        ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\((bb10);\s(\w+)/i                                                 // BlackBerry 10
        ], [[VENDOR, 'BlackBerry'], MODEL, [TYPE, MOBILE]], [

            /android.+((transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+))/i       // Asus Tablets
        ], [[VENDOR, 'Asus'], MODEL, [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])/i                                           // Sony Tablets
        ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
        ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /((playstation)\s[3portablevi]+)/i                                  // Playstation
        ], [[VENDOR, 'Sony'], MODEL, [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
        ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|huawei|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
            // Alcatel/GeeksPhone/Huawei/Lenovo/Nexian/Panasonic/Sony
        ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /\s((milestone|droid[2x]?))[globa\s]*\sbuild\//i,                   // Motorola
            /(mot)[\s-]?(\w+)*/i
        ], [[VENDOR, 'Motorola'], MODEL, [TYPE, MOBILE]], [
            /android.+\s((mz60\d|xoom[\s2]{0,2}))\sbuild\//i
        ], [[VENDOR, 'Motorola'], MODEL, [TYPE, TABLET]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n8000|sgh-t8[56]9))/i
        ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
        ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [
            /(sie)-(\w+)*/i                                                     // Siemens
        ], [[VENDOR, 'Siemens'], MODEL, [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
        ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w-;]{10}((a\d{3}))/i                               // Acer
        ], [[VENDOR, 'Acer'], MODEL, [TYPE, TABLET]], [

            /android\s3\.[\s\w-;]{10}(lg?)-([06cv9]{3,4})/i                     // LG
        ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /((nexus\s4))/i,
            /(lg)[e;\s-\/]+(\w+)*/i
        ], [[VENDOR, 'LG'], MODEL, [TYPE, MOBILE]], [

            /(mobile|tablet);.+rv\:.+gecko\//i                                  // Unidentifiable
        ], [TYPE, VENDOR, MODEL]
        ],

        engine : [[

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
        ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
        ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*|windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
        ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
        ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
        ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)\/([\w\.]+)/i,                                              // Tizen
            /(android|webos|palm\os|qnx|bada|rim\stablet\sos|meego)[\/\s-]?([\w\.]+)*/i
            // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo
        ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
        ], [[NAME, 'Symbian'], VERSION],[
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
        ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids3portablevu]+)/i,                    // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk)[\/\s-]?([\w\.-]+)*/i,
            // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
            // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
        ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
        ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
        ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
        ], [NAME, VERSION],[

            /(ip[honead]+)(?:.*os\s*([\w]+)*\slike\smac|;\sopera)/i             // iOS
        ], [[NAME, 'iOS'], [VERSION, /_/g, '.']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i                                    // Mac OS
        ], [NAME, [VERSION, /_/g, '.']], [

            // Other
            /(haiku)\s(\w+)/i,                                                  // Haiku
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(macintosh|mac(?=_powerpc)|plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos)/i,
            // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
        ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////


    var UAParser = function (uastring) {

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring).getResult();
        }
        this.getBrowser = function () {
            return mapper.rgx.apply(this, regexes.browser);
        };
        this.getCPU = function () {
            return mapper.rgx.apply(this, regexes.cpu);
        };
        this.getDevice = function () {
            return mapper.rgx.apply(this, regexes.device);
        };
        this.getEngine = function () {
            return mapper.rgx.apply(this, regexes.engine);
        };
        this.getOS = function () {
            return mapper.rgx.apply(this, regexes.os);
        };
        this.getResult = function() {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        this.setUA(ua);
    };

    return UAParser;


    ///////////
    // Export
    //////////


//    // check js environment
//    if (typeof(exports) !== UNDEF_TYPE) {
//        // nodejs env
//        if (typeof(module) !== UNDEF_TYPE && module.exports) {
//            exports = module.exports = UAParser;
//        }
//        exports.UAParser = UAParser;
//    } else {
//        // browser env
//        window.UAParser = UAParser;
//        // requirejs env (optional)
//        if (typeof(define) === FUNC_TYPE && define.amd) {
//            define(function () {
//                return UAParser;
//            });
//        }
//        // jQuery specific (optional)
//        if (typeof(window.jQuery) !== UNDEF_TYPE) {
//            var $ = window.jQuery;
//            var parser = new UAParser();
//            $.ua = parser.getResult();
//            $.ua.get = function() {
//                return parser.getUA();
//            };
//            $.ua.set = function (uastring) {
//                parser.setUA(uastring);
//                var result = parser.getResult();
//                for (var prop in result) {
//                    $.ua[prop] = result[prop];
//                }
//            };
//        }
//    }
});
/*global define */

define('system',['UAParser', 'Debug', 'underscoreloader'], function (UAParser, Debug, _) {
    

    var uaparser = new UAParser();
    var debug = new Debug('system');

    var browser = uaparser.getBrowser();
    var device = uaparser.getDevice();
    var engine = uaparser.getEngine();
    var os = uaparser.getOS();
    var userAgentString = uaparser.getUA();

    //-------------------------------------------------------------------------------- checkers
    var isBrowser = function (name, version) {
        return _match(system.browser, name, version);
    };

    var isOS = function (name, version) {
        return _match(system.os, name, version);
    };

    var isEngine = function (name, version) {
        return _match(system.engine, name, version);
    };

    /**
     * Iterates over the provided list and when the value to match is loosely equal, we return true that we found
     * a match
     * @param list
     * @param valueToMatch
     * @returns {boolean}
     */
    var checkMatch = function (list, valueToMatch) {
        var matched = false;

        _.find(list, function (itemValue) {
//            debug.log(itemValue +' vs. '+ valueToMatch);

            if (_.isDefined(valueToMatch) && _.isDefined(itemValue) && _.isLooseEqual(valueToMatch, itemValue))
            {
                matched = true;
            }
        });

//        debug.log("returning " + _.booleanToString(matched));
        return matched;
    };

    var _match = function (list, name, version) {
        if (_.isUndefined(name))
        {
            debug.error("The name you provided to search through was undefined.");
            return false;
        }

        var nameMatch = checkMatch(list, name);
        var versionMatch = checkMatch(list, version);

//        debug.log(name + ' matched?', _.booleanToString(nameMatch));
//        debug.log(version + ' matched?', _.booleanToString(versionMatch));

        //if name and version were passed in, we need to match on both to return true
        if (!_.isUndefined(version))
        {
            if (nameMatch && versionMatch)
            {
                return true;
            }
        }
        else if (nameMatch)
        {
            return true;
        }

        return false;
    };
    //-------------------------------------------------------------------------------- /checkers

    var system = {
        isBrowser: isBrowser,
        isOS: isOS,
        isEngine: isEngine,
        browser: {
            major: browser.major,
            name: browser.name,
            version: browser.version
        },
        device: {
            model: device.model,
            type: device.type,
            vendor: device.vendor
        },
        engine: {
            name: engine.name,
            version: engine.version
        },
        os: {
            name: os.name,
            version: os.version
        },
        ua: userAgentString,
        __test__: {
            checkMatch: checkMatch
        }
    };

    //no sense logging this stuff if the object is empty
    if (_.has(browser, 'name'))
    {
        debug.log('(browser)', [browser.name, browser.version].join(' '));
    }

    if (_.has(device, 'name'))
    {
        debug.log('(device)', [device.vendor, device.model, device.type].join(' '));
    }

    if (_.has(engine, 'name'))
    {
        debug.log('(engine)', [engine.name, engine.version].join(' '));
    }

    if (_.has(os, 'name'))
    {
        debug.log('(os)', [os.name, os.version].join(' '));
    }

    return system;
});
/*global define */

define('base64',[], function () {
    

    var jsonToBase64 = function (objectToEncode) {
        var jsonString = JSON.stringify(objectToEncode);
        var base64String = btoa(jsonString);

        return base64String;
    };

    var base64ToJSON = function (base64String) {
        var jsonString = atob(base64String);
        var json = JSON.parse(jsonString);

        return json;
    };

    // Public API
    return  {
        jsonToBase64: jsonToBase64,
        base64ToJSON: base64ToJSON
    };
});
/*global define */

define('cookies',[
    'underscoreloader',
    'Debug'
], function (_, Debug) {
    

    var debug = new Debug('cookies');

    /**
     * Gets the cookie for this domain as an Object
     * @returns {Object}
     */
    var getCookie = function () {
        return _.arrayToObject(document.cookie.split(';'));
    };

    /**
     * This is a way to grab the value for a given cookie.
     * @param key Case-insensitive key to search for in the cookie
     */
    var grab = function (keyToFind, skipDecoding) {
        if (!_.isString(keyToFind) || _.isEmpty(keyToFind))
        {
            throw new Error("The key you provided to cookies.grab() was either not a string or was empty", keyToFind);
        }

        var cookie = getCookie();
        var foundValue =  _.find(cookie, function (value, key) {
            //need to trim the cookie names since there are trailing/leading spaces sometimes
            if (_.trim(key.toLowerCase()) === _.trim(keyToFind.toLowerCase()))
            {
                return value;
            }
        });

        var cleanedValue = (!skipDecoding && foundValue) ? decodeURIComponent(foundValue) : foundValue;

        return (cleanedValue) ? cleanedValue : false;
    };

    return {
        getCookie: getCookie,
        grab: grab
    };
});

/*global define */

define('mvpd',[
    'underscoreloader',
    'Debug',
    'Dispatcher',
    'cookies'
], function (_, Debug, Dispatcher, cookies) {
    

    var debug = new Debug('mvpd'),
        dispatcher = new Dispatcher();

    var getFreewheelKeyValues = function () {
        var cookie = cookies.grab('aam_freewheel');
        var keyValues = (_.isString(cookie) && !_.isEmpty(cookie)) ? cookie : '';

        return keyValues;
    };

    return {
        getFreewheelKeyValues: getFreewheelKeyValues
    };
});

/*global define */

define('analytics/audience-manager',[
    'underscoreloader',
    'Debug',
    'cookies'
], function (_, Debug, cookies) {
    

    var _freewheelKeyValues = cookies.grab('aam_freewheel'),
        debug = new Debug('audience manager');

    var getUserId = function () {
        return cookies.grab('aam_uuid');
    };

    return {
        getUserId: getUserId
    };
});
/*global define */

define('analytics/akamai-media-analytics',[
    'underscoreloader',
    'Debug',
    'cookies'
], function (_, Debug, cookies) {
    

    var debug = new Debug('akamai media analytics');

    var getUserId = function () {
        return cookies.grab('Akamai_AnalyticsMetrics_clientId');
    };

    return {
        getUserId: getUserId
    };
});
/*global define */

define('analytics/omniture',['player/playback'], function (playback) {
    
});
/*global define */

define('analytics',[
    'underscoreloader',
    'Debug',
    'analytics/audience-manager',
    'analytics/akamai-media-analytics',
    'analytics/omniture'
], function (_, Debug, audienceManager, ama, omniture) {
    

    var debug = new Debug('analytics');

    var getAkamaiMediaAnalytics = function () {
        return {
            userId: ama.getUserId()
        };
    };

    var getAudienceManager = function () {
        return {
            userId: audienceManager.getUserId()
        };
    };

    // Public API
    return {
        getAkamaiMediaAnalytics: getAkamaiMediaAnalytics,
        getAudienceManager: getAudienceManager
    };
});

/*global define, _ */

define('omnitureloader',['utils', 'Dispatcher', 'jqueryloader', 'underscoreloader'], function (utils, Dispatcher, jquery, _) {
    

    var dispatcher = new Dispatcher(),
        deferred = jquery.Deferred();

    var getOmnitureLibrary = function () {
        var attributes = {
            'src': 'http://player.foxfdm.com/shared/1.4.526/js/s_code.js'
        };

        if (!_.has(window, 's_analytics') && !utils.tagInHead('srcript', attributes))
        {
            utils.addToHead('script', attributes)
                .done(function (response) {
                    deferred.resolve('loaded');
                })
                .fail(function (error) {
                    deferred.reject('error');
                });
        }
        else
        {
            deferred.resolve(true);
        }

        return deferred;
    };

    //Public API
    return {
        getOmnitureLibrary: getOmnitureLibrary
    };
});
/*global define */

define('foxneod',[
    'Dispatcher',
    'Debug',
    'polyfills',
    'utils',
    'player',
    'query',
    'system',
    'base64',
    'cookies',
    'mvpd',
    'analytics',
    'underscoreloader',
    'jqueryloader',
    'omnitureloader'], function (Dispatcher, Debug, polyfills, utils, player, query, system, base64, cookies, mvpd, analytics, _, jquery, omnitureloader) {
    

    //////////////////////////////////////////////// instance variables
    var buildTimestamp = '2013-08-08 02:08:27';
    var debug = new Debug('core'),
        dispatcher = new Dispatcher();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public methods
    var getOmnitureLibraryReady = function () {
        return omnitureloader.getOmnitureLibrary();
    };
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// private methods
    function _messageUnsupportedUsers () {
        var title = "Unsupported Browser",
            message = '';

        if (system.isBrowser('ie', 7))
        {
            if (system.isEngine('trident', 6))
            {
                message = "You're currently using Internet Explorer 10 in \"Compatibility\" mode, which has been " +
                    "known to freeze the video. Please switch your browser into \"Standards\" mode to get a better " +
                    "experience.";
            }
            else
            {
                message = "You're currently using Internet Explorer 7, which is an unsupported browser for video " +
                    "playback. We recommend switching to a more modern browser or upgrading IE to get a better " +
                    "experience.";
            }
        }

        //show site modal
        if (_.has(window, 'VideoAuth') && _.has(window.VideoAuth, 'Modal') && (!_.isEmpty(title) && !_.isEmpty(message)))
        {
            var $htmlFragment = jquery('<div id="foxneod-error">\n    <h1>Warning</h1>\n    <p class="error-message">' + message + '</p>\n</div>');

            window.VideoAuth.Modal.open(null, title);
            window.VideoAuth.Modal.content.set($htmlFragment);
        }
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialization
    var init = function () {
        debug.log('ready (build date: 2013-08-08 02:08:27)');

        _messageUnsupportedUsers();
    };
    ////////////////////////////////////////////////


    // Public API
    return {
        _init: init,
        buildDate: '2013-08-08 02:08:27',
        packageName: 'foxneod',
        version: '0.7.7',
        getOmnitureLibraryReady: getOmnitureLibraryReady,
        dispatch: dispatcher.dispatch,
        addEventListener: dispatcher.addEventListener,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,
        analytics: analytics,
        cookies: cookies,
        Debug: Debug,
        mvpd: mvpd,
        player: player,
        query: query,
        system: system,
        utils: utils,
        __test__: {
            jQuery: jquery,
            base64: base64,
            removeAllEventListeners: dispatcher.removeAllEventListeners
        }
    };
});
/*global require, requirejs, console */

require([
    'almond',
    'jqueryloader',
    'underscoreloader',
    'Dispatcher',
    'Debug',
    'foxneod'
], function (almond, jquery, _, Dispatcher, Debug, foxneod) {
    

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    (function () {
        if (_.isUndefined(window['foxneod'])) //protects against the file being loaded multiple times
        {
            window._ = _;
            debug.log('jQuery (internal) version after noConflict is', jquery().jquery);

            if(window.jQuery)
            {
                debug.log('jQuery (page) version after noConflict is', window.jQuery().jquery);
            }

            debug.log('Underscore version after noConflict is', _.VERSION);

            window['foxneod'] = window.$f = foxneod;
            window['foxneod']._init();
            dispatcher.dispatch('ready', {}, true);
            debug.log('foxneod assigned to window.foxneod and window.$f');
        }
        else
        {
            debug.error('The foxneod library has already been loaded into the page. Fix this!!!');
        }
    })();
});
define("main", function(){});
}());