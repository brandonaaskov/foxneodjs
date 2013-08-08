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

/*!
 * jQuery JavaScript Library v1.5.1
 * http://jquery.com/
 *
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2011, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Wed Feb 23 13:55:29 2011 -0500
 */
(function(a,b){function cg(a){return d.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}function cd(a){if(!bZ[a]){var b=d("<"+a+">").appendTo("body"),c=b.css("display");b.remove();if(c==="none"||c==="")c="block";bZ[a]=c}return bZ[a]}function cc(a,b){var c={};d.each(cb.concat.apply([],cb.slice(0,b)),function(){c[this]=a});return c}function bY(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function bX(){try{return new a.XMLHttpRequest}catch(b){}}function bW(){d(a).unload(function(){for(var a in bU)bU[a](0,1)})}function bQ(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var e=a.dataTypes,f={},g,h,i=e.length,j,k=e[0],l,m,n,o,p;for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h==="string"&&(f[h.toLowerCase()]=a.converters[h]);l=k,k=e[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=f[m]||f["* "+k];if(!n){p=b;for(o in f){j=o.split(" ");if(j[0]===l||j[0]==="*"){p=f[j[1]+" "+k];if(p){o=f[o],o===!0?n=p:p===!0&&(n=o);break}}}}!n&&!p&&d.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function bP(a,c,d){var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function bO(a,b,c,e){if(d.isArray(b)&&b.length)d.each(b,function(b,f){c||bq.test(a)?e(a,f):bO(a+"["+(typeof f==="object"||d.isArray(f)?b:"")+"]",f,c,e)});else if(c||b==null||typeof b!=="object")e(a,b);else if(d.isArray(b)||d.isEmptyObject(b))e(a,"");else for(var f in b)bO(a+"["+f+"]",b[f],c,e)}function bN(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bH,l;for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l==="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=bN(a,c,d,e,l,g)));(k||!l)&&!g["*"]&&(l=bN(a,c,d,e,"*",g));return l}function bM(a){return function(b,c){typeof b!=="string"&&(c=b,b="*");if(d.isFunction(c)){var e=b.toLowerCase().split(bB),f=0,g=e.length,h,i,j;for(;f<g;f++)h=e[f],j=/^\+/.test(h),j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bo(a,b,c){var e=b==="width"?bi:bj,f=b==="width"?a.offsetWidth:a.offsetHeight;if(c==="border")return f;d.each(e,function(){c||(f-=parseFloat(d.css(a,"padding"+this))||0),c==="margin"?f+=parseFloat(d.css(a,"margin"+this))||0:f-=parseFloat(d.css(a,"border"+this+"Width"))||0});return f}function ba(a,b){b.src?d.ajax({url:b.src,async:!1,dataType:"script"}):d.globalEval(b.text||b.textContent||b.innerHTML||""),b.parentNode&&b.parentNode.removeChild(b)}function _(a){return"getElementsByTagName"in a?a.getElementsByTagName("*"):"querySelectorAll"in a?a.querySelectorAll("*"):[]}function $(a,b){if(b.nodeType===1){var c=b.nodeName.toLowerCase();b.clearAttributes(),b.mergeAttributes(a);if(c==="object")b.outerHTML=a.outerHTML;else if(c!=="input"||a.type!=="checkbox"&&a.type!=="radio"){if(c==="option")b.selected=a.defaultSelected;else if(c==="input"||c==="textarea")b.defaultValue=a.defaultValue}else a.checked&&(b.defaultChecked=b.checked=a.checked),b.value!==a.value&&(b.value=a.value);b.removeAttribute(d.expando)}}function Z(a,b){if(b.nodeType===1&&d.hasData(a)){var c=d.expando,e=d.data(a),f=d.data(b,e);if(e=e[c]){var g=e.events;f=f[c]=d.extend({},e);if(g){delete f.handle,f.events={};for(var h in g)for(var i=0,j=g[h].length;i<j;i++)d.event.add(b,h+(g[h][i].namespace?".":"")+g[h][i].namespace,g[h][i],g[h][i].data)}}}}function Y(a,b){return d.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function O(a,b,c){if(d.isFunction(b))return d.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return d.grep(a,function(a,d){return a===b===c});if(typeof b==="string"){var e=d.grep(a,function(a){return a.nodeType===1});if(J.test(b))return d.filter(b,e,!c);b=d.filter(b,e)}return d.grep(a,function(a,e){return d.inArray(a,b)>=0===c})}function N(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function F(a,b){return(a&&a!=="*"?a+".":"")+b.replace(r,"`").replace(s,"&")}function E(a){var b,c,e,f,g,h,i,j,k,l,m,n,o,q=[],r=[],s=d._data(this,"events");if(a.liveFired!==this&&s&&s.live&&!a.target.disabled&&(!a.button||a.type!=="click")){a.namespace&&(n=new RegExp("(^|\\.)"+a.namespace.split(".").join("\\.(?:.*\\.)?")+"(\\.|$)")),a.liveFired=this;var t=s.live.slice(0);for(i=0;i<t.length;i++)g=t[i],g.origType.replace(p,"")===a.type?r.push(g.selector):t.splice(i--,1);f=d(a.target).closest(r,a.currentTarget);for(j=0,k=f.length;j<k;j++){m=f[j];for(i=0;i<t.length;i++){g=t[i];if(m.selector===g.selector&&(!n||n.test(g.namespace))&&!m.elem.disabled){h=m.elem,e=null;if(g.preType==="mouseenter"||g.preType==="mouseleave")a.type=g.preType,e=d(a.relatedTarget).closest(g.selector)[0];(!e||e!==h)&&q.push({elem:h,handleObj:g,level:m.level})}}}for(j=0,k=q.length;j<k;j++){f=q[j];if(c&&f.level>c)break;a.currentTarget=f.elem,a.data=f.handleObj.data,a.handleObj=f.handleObj,o=f.handleObj.origHandler.apply(f.elem,arguments);if(o===!1||a.isPropagationStopped()){c=f.level,o===!1&&(b=!1);if(a.isImmediatePropagationStopped())break}}return b}}function C(a,c,e){var f=d.extend({},e[0]);f.type=a,f.originalEvent={},f.liveFired=b,d.event.handle.call(c,f),f.isDefaultPrevented()&&e[0].preventDefault()}function w(){return!0}function v(){return!1}function g(a){for(var b in a)if(b!=="toJSON")return!1;return!0}function f(a,c,f){if(f===b&&a.nodeType===1){f=a.getAttribute("data-"+c);if(typeof f==="string"){try{f=f==="true"?!0:f==="false"?!1:f==="null"?null:d.isNaN(f)?e.test(f)?d.parseJSON(f):f:parseFloat(f)}catch(g){}d.data(a,c,f)}else f=b}return f}var c=a.document,d=function(){function I(){if(!d.isReady){try{c.documentElement.doScroll("left")}catch(a){setTimeout(I,1);return}d.ready()}}var d=function(a,b){return new d.fn.init(a,b,g)},e=a.jQuery,f=a.$,g,h=/^(?:[^<]*(<[\w\W]+>)[^>]*$|#([\w\-]+)$)/,i=/\S/,j=/^\s+/,k=/\s+$/,l=/\d/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=navigator.userAgent,w,x=!1,y,z="then done fail isResolved isRejected promise".split(" "),A,B=Object.prototype.toString,C=Object.prototype.hasOwnProperty,D=Array.prototype.push,E=Array.prototype.slice,F=String.prototype.trim,G=Array.prototype.indexOf,H={};d.fn=d.prototype={constructor:d,init:function(a,e,f){var g,i,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,this.length=1;return this}if(a==="body"&&!e&&c.body){this.context=c,this[0]=c.body,this.selector="body",this.length=1;return this}if(typeof a==="string"){g=h.exec(a);if(!g||!g[1]&&e)return!e||e.jquery?(e||f).find(a):this.constructor(e).find(a);if(g[1]){e=e instanceof d?e[0]:e,k=e?e.ownerDocument||e:c,j=m.exec(a),j?d.isPlainObject(e)?(a=[c.createElement(j[1])],d.fn.attr.call(a,e,!0)):a=[k.createElement(j[1])]:(j=d.buildFragment([g[1]],[k]),a=(j.cacheable?d.clone(j.fragment):j.fragment).childNodes);return d.merge(this,a)}i=c.getElementById(g[2]);if(i&&i.parentNode){if(i.id!==g[2])return f.find(a);this.length=1,this[0]=i}this.context=c,this.selector=a;return this}if(d.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);return d.makeArray(a,this)},selector:"",jquery:"1.5.1",length:0,size:function(){return this.length},toArray:function(){return E.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var e=this.constructor();d.isArray(a)?D.apply(e,a):d.merge(e,a),e.prevObject=this,e.context=this.context,b==="find"?e.selector=this.selector+(this.selector?" ":"")+c:b&&(e.selector=this.selector+"."+b+"("+c+")");return e},each:function(a,b){return d.each(this,a,b)},ready:function(a){d.bindReady(),y.done(a);return this},eq:function(a){return a===-1?this.slice(a):this.slice(a,+a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(E.apply(this,arguments),"slice",E.call(arguments).join(","))},map:function(a){return this.pushStack(d.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:D,sort:[].sort,splice:[].splice},d.fn.init.prototype=d.fn,d.extend=d.fn.extend=function(){var a,c,e,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i==="boolean"&&(l=i,i=arguments[1]||{},j=2),typeof i!=="object"&&!d.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){e=i[c],f=a[c];if(i===f)continue;l&&f&&(d.isPlainObject(f)||(g=d.isArray(f)))?(g?(g=!1,h=e&&d.isArray(e)?e:[]):h=e&&d.isPlainObject(e)?e:{},i[c]=d.extend(l,h,f)):f!==b&&(i[c]=f)}return i},d.extend({noConflict:function(b){a.$=f,b&&(a.jQuery=e);return d},isReady:!1,readyWait:1,ready:function(a){a===!0&&d.readyWait--;if(!d.readyWait||a!==!0&&!d.isReady){if(!c.body)return setTimeout(d.ready,1);d.isReady=!0;if(a!==!0&&--d.readyWait>0)return;y.resolveWith(c,[d]),d.fn.trigger&&d(c).trigger("ready").unbind("ready")}},bindReady:function(){if(!x){x=!0;if(c.readyState==="complete")return setTimeout(d.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",A,!1),a.addEventListener("load",d.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",A),a.attachEvent("onload",d.ready);var b=!1;try{b=a.frameElement==null}catch(e){}c.documentElement.doScroll&&b&&I()}}},isFunction:function(a){return d.type(a)==="function"},isArray:Array.isArray||function(a){return d.type(a)==="array"},isWindow:function(a){return a&&typeof a==="object"&&"setInterval"in a},isNaN:function(a){return a==null||!l.test(a)||isNaN(a)},type:function(a){return a==null?String(a):H[B.call(a)]||"object"},isPlainObject:function(a){if(!a||d.type(a)!=="object"||a.nodeType||d.isWindow(a))return!1;if(a.constructor&&!C.call(a,"constructor")&&!C.call(a.constructor.prototype,"isPrototypeOf"))return!1;var c;for(c in a){}return c===b||C.call(a,c)},isEmptyObject:function(a){for(var b in a)return!1;return!0},error:function(a){throw a},parseJSON:function(b){if(typeof b!=="string"||!b)return null;b=d.trim(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return a.JSON&&a.JSON.parse?a.JSON.parse(b):(new Function("return "+b))();d.error("Invalid JSON: "+b)},parseXML:function(b,c,e){a.DOMParser?(e=new DOMParser,c=e.parseFromString(b,"text/xml")):(c=new ActiveXObject("Microsoft.XMLDOM"),c.async="false",c.loadXML(b)),e=c.documentElement,(!e||!e.nodeName||e.nodeName==="parsererror")&&d.error("Invalid XML: "+b);return c},noop:function(){},globalEval:function(a){if(a&&i.test(a)){var b=c.head||c.getElementsByTagName("head")[0]||c.documentElement,e=c.createElement("script");d.support.scriptEval()?e.appendChild(c.createTextNode(a)):e.text=a,b.insertBefore(e,b.firstChild),b.removeChild(e)}},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,c,e){var f,g=0,h=a.length,i=h===b||d.isFunction(a);if(e){if(i){for(f in a)if(c.apply(a[f],e)===!1)break}else for(;g<h;)if(c.apply(a[g++],e)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break}else for(var j=a[0];g<h&&c.call(j,g,j)!==!1;j=a[++g]){}return a},trim:F?function(a){return a==null?"":F.call(a)}:function(a){return a==null?"":(a+"").replace(j,"").replace(k,"")},makeArray:function(a,b){var c=b||[];if(a!=null){var e=d.type(a);a.length==null||e==="string"||e==="function"||e==="regexp"||d.isWindow(a)?D.call(c,a):d.merge(c,a)}return c},inArray:function(a,b){if(b.indexOf)return b.indexOf(a);for(var c=0,d=b.length;c<d;c++)if(b[c]===a)return c;return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length==="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),c!==e&&d.push(a[f]);return d},map:function(a,b,c){var d=[],e;for(var f=0,g=a.length;f<g;f++)e=b(a[f],f,c),e!=null&&(d[d.length]=e);return d.concat.apply([],d)},guid:1,proxy:function(a,c,e){arguments.length===2&&(typeof c==="string"?(e=a,a=e[c],c=b):c&&!d.isFunction(c)&&(e=c,c=b)),!c&&a&&(c=function(){return a.apply(e||this,arguments)}),a&&(c.guid=a.guid=a.guid||c.guid||d.guid++);return c},access:function(a,c,e,f,g,h){var i=a.length;if(typeof c==="object"){for(var j in c)d.access(a,j,c[j],f,g,e);return a}if(e!==b){f=!h&&f&&d.isFunction(e);for(var k=0;k<i;k++)g(a[k],c,f?e.call(a[k],k,g(a[k],c)):e,h);return a}return i?g(a[0],c):b},now:function(){return(new Date).getTime()},_Deferred:function(){var a=[],b,c,e,f={done:function(){if(!e){var c=arguments,g,h,i,j,k;b&&(k=b,b=0);for(g=0,h=c.length;g<h;g++)i=c[g],j=d.type(i),j==="array"?f.done.apply(f,i):j==="function"&&a.push(i);k&&f.resolveWith(k[0],k[1])}return this},resolveWith:function(d,f){if(!e&&!b&&!c){c=1;try{while(a[0])a.shift().apply(d,f)}catch(g){throw g}finally{b=[d,f],c=0}}return this},resolve:function(){f.resolveWith(d.isFunction(this.promise)?this.promise():this,arguments);return this},isResolved:function(){return c||b},cancel:function(){e=1,a=[];return this}};return f},Deferred:function(a){var b=d._Deferred(),c=d._Deferred(),e;d.extend(b,{then:function(a,c){b.done(a).fail(c);return this},fail:c.done,rejectWith:c.resolveWith,reject:c.resolve,isRejected:c.isResolved,promise:function(a){if(a==null){if(e)return e;e=a={}}var c=z.length;while(c--)a[z[c]]=b[z[c]];return a}}),b.done(c.cancel).fail(b.cancel),delete b.cancel,a&&a.call(b,b);return b},when:function(a){var b=arguments.length,c=b<=1&&a&&d.isFunction(a.promise)?a:d.Deferred(),e=c.promise();if(b>1){var f=E.call(arguments,0),g=b,h=function(a){return function(b){f[a]=arguments.length>1?E.call(arguments,0):b,--g||c.resolveWith(e,f)}};while(b--)a=f[b],a&&d.isFunction(a.promise)?a.promise().then(h(b),c.reject):--g;g||c.resolveWith(e,f)}else c!==a&&c.resolve(a);return e},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}d.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.subclass=this.subclass,a.fn.init=function b(b,c){c&&c instanceof d&&!(c instanceof a)&&(c=a(c));return d.fn.init.call(this,b,c,e)},a.fn.init.prototype=a.fn;var e=a(c);return a},browser:{}}),y=d._Deferred(),d.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){H["[object "+b+"]"]=b.toLowerCase()}),w=d.uaMatch(v),w.browser&&(d.browser[w.browser]=!0,d.browser.version=w.version),d.browser.webkit&&(d.browser.safari=!0),G&&(d.inArray=function(a,b){return G.call(b,a)}),i.test(" ")&&(j=/^[\s\xA0]+/,k=/[\s\xA0]+$/),g=d(c),c.addEventListener?A=function(){c.removeEventListener("DOMContentLoaded",A,!1),d.ready()}:c.attachEvent&&(A=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",A),d.ready())});return d}();(function(){d.support={};var b=c.createElement("div");b.style.display="none",b.innerHTML="   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;'>a</a><input type='checkbox'/>";var e=b.getElementsByTagName("*"),f=b.getElementsByTagName("a")[0],g=c.createElement("select"),h=g.appendChild(c.createElement("option")),i=b.getElementsByTagName("input")[0];if(e&&e.length&&f){d.support={leadingWhitespace:b.firstChild.nodeType===3,tbody:!b.getElementsByTagName("tbody").length,htmlSerialize:!!b.getElementsByTagName("link").length,style:/red/.test(f.getAttribute("style")),hrefNormalized:f.getAttribute("href")==="/a",opacity:/^0.55$/.test(f.style.opacity),cssFloat:!!f.style.cssFloat,checkOn:i.value==="on",optSelected:h.selected,deleteExpando:!0,optDisabled:!1,checkClone:!1,noCloneEvent:!0,noCloneChecked:!0,boxModel:null,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableHiddenOffsets:!0},i.checked=!0,d.support.noCloneChecked=i.cloneNode(!0).checked,g.disabled=!0,d.support.optDisabled=!h.disabled;var j=null;d.support.scriptEval=function(){if(j===null){var b=c.documentElement,e=c.createElement("script"),f="script"+d.now();try{e.appendChild(c.createTextNode("window."+f+"=1;"))}catch(g){}b.insertBefore(e,b.firstChild),a[f]?(j=!0,delete a[f]):j=!1,b.removeChild(e),b=e=f=null}return j};try{delete b.test}catch(k){d.support.deleteExpando=!1}!b.addEventListener&&b.attachEvent&&b.fireEvent&&(b.attachEvent("onclick",function l(){d.support.noCloneEvent=!1,b.detachEvent("onclick",l)}),b.cloneNode(!0).fireEvent("onclick")),b=c.createElement("div"),b.innerHTML="<input type='radio' name='radiotest' checked='checked'/>";var m=c.createDocumentFragment();m.appendChild(b.firstChild),d.support.checkClone=m.cloneNode(!0).cloneNode(!0).lastChild.checked,d(function(){var a=c.createElement("div"),b=c.getElementsByTagName("body")[0];if(b){a.style.width=a.style.paddingLeft="1px",b.appendChild(a),d.boxModel=d.support.boxModel=a.offsetWidth===2,"zoom"in a.style&&(a.style.display="inline",a.style.zoom=1,d.support.inlineBlockNeedsLayout=a.offsetWidth===2,a.style.display="",a.innerHTML="<div style='width:4px;'></div>",d.support.shrinkWrapBlocks=a.offsetWidth!==2),a.innerHTML="<table><tr><td style='padding:0;border:0;display:none'></td><td>t</td></tr></table>";var e=a.getElementsByTagName("td");d.support.reliableHiddenOffsets=e[0].offsetHeight===0,e[0].style.display="",e[1].style.display="none",d.support.reliableHiddenOffsets=d.support.reliableHiddenOffsets&&e[0].offsetHeight===0,a.innerHTML="",b.removeChild(a).style.display="none",a=e=null}});var n=function(a){var b=c.createElement("div");a="on"+a;if(!b.attachEvent)return!0;var d=a in b;d||(b.setAttribute(a,"return;"),d=typeof b[a]==="function"),b=null;return d};d.support.submitBubbles=n("submit"),d.support.changeBubbles=n("change"),b=e=f=null}})();var e=/^(?:\{.*\}|\[.*\])$/;d.extend({cache:{},uuid:0,expando:"jQuery"+(d.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?d.cache[a[d.expando]]:a[d.expando];return!!a&&!g(a)},data:function(a,c,e,f){if(d.acceptData(a)){var g=d.expando,h=typeof c==="string",i,j=a.nodeType,k=j?d.cache:a,l=j?a[d.expando]:a[d.expando]&&d.expando;if((!l||f&&l&&!k[l][g])&&h&&e===b)return;l||(j?a[d.expando]=l=++d.uuid:l=d.expando),k[l]||(k[l]={},j||(k[l].toJSON=d.noop));if(typeof c==="object"||typeof c==="function")f?k[l][g]=d.extend(k[l][g],c):k[l]=d.extend(k[l],c);i=k[l],f&&(i[g]||(i[g]={}),i=i[g]),e!==b&&(i[c]=e);if(c==="events"&&!i[c])return i[g]&&i[g].events;return h?i[c]:i}},removeData:function(b,c,e){if(d.acceptData(b)){var f=d.expando,h=b.nodeType,i=h?d.cache:b,j=h?b[d.expando]:d.expando;if(!i[j])return;if(c){var k=e?i[j][f]:i[j];if(k){delete k[c];if(!g(k))return}}if(e){delete i[j][f];if(!g(i[j]))return}var l=i[j][f];d.support.deleteExpando||i!=a?delete i[j]:i[j]=null,l?(i[j]={},h||(i[j].toJSON=d.noop),i[j][f]=l):h&&(d.support.deleteExpando?delete b[d.expando]:b.removeAttribute?b.removeAttribute(d.expando):b[d.expando]=null)}},_data:function(a,b,c){return d.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=d.noData[a.nodeName.toLowerCase()];if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),d.fn.extend({data:function(a,c){var e=null;if(typeof a==="undefined"){if(this.length){e=d.data(this[0]);if(this[0].nodeType===1){var g=this[0].attributes,h;for(var i=0,j=g.length;i<j;i++)h=g[i].name,h.indexOf("data-")===0&&(h=h.substr(5),f(this[0],h,e[h]))}}return e}if(typeof a==="object")return this.each(function(){d.data(this,a)});var k=a.split(".");k[1]=k[1]?"."+k[1]:"";if(c===b){e=this.triggerHandler("getData"+k[1]+"!",[k[0]]),e===b&&this.length&&(e=d.data(this[0],a),e=f(this[0],a,e));return e===b&&k[1]?this.data(k[0]):e}return this.each(function(){var b=d(this),e=[k[0],c];b.triggerHandler("setData"+k[1]+"!",e),d.data(this,a,c),b.triggerHandler("changeData"+k[1]+"!",e)})},removeData:function(a){return this.each(function(){d.removeData(this,a)})}}),d.extend({queue:function(a,b,c){if(a){b=(b||"fx")+"queue";var e=d._data(a,b);if(!c)return e||[];!e||d.isArray(c)?e=d._data(a,b,d.makeArray(c)):e.push(c);return e}},dequeue:function(a,b){b=b||"fx";var c=d.queue(a,b),e=c.shift();e==="inprogress"&&(e=c.shift()),e&&(b==="fx"&&c.unshift("inprogress"),e.call(a,function(){d.dequeue(a,b)})),c.length||d.removeData(a,b+"queue",!0)}}),d.fn.extend({queue:function(a,c){typeof a!=="string"&&(c=a,a="fx");if(c===b)return d.queue(this[0],a);return this.each(function(b){var e=d.queue(this,a,c);a==="fx"&&e[0]!=="inprogress"&&d.dequeue(this,a)})},dequeue:function(a){return this.each(function(){d.dequeue(this,a)})},delay:function(a,b){a=d.fx?d.fx.speeds[a]||a:a,b=b||"fx";return this.queue(b,function(){var c=this;setTimeout(function(){d.dequeue(c,b)},a)})},clearQueue:function(a){return this.queue(a||"fx",[])}});var h=/[\n\t\r]/g,i=/\s+/,j=/\r/g,k=/^(?:href|src|style)$/,l=/^(?:button|input)$/i,m=/^(?:button|input|object|select|textarea)$/i,n=/^a(?:rea)?$/i,o=/^(?:radio|checkbox)$/i;d.props={"for":"htmlFor","class":"className",readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",colspan:"colSpan",tabindex:"tabIndex",usemap:"useMap",frameborder:"frameBorder"},d.fn.extend({attr:function(a,b){return d.access(this,a,b,!0,d.attr)},removeAttr:function(a,b){return this.each(function(){d.attr(this,a,""),this.nodeType===1&&this.removeAttribute(a)})},addClass:function(a){if(d.isFunction(a))return this.each(function(b){var c=d(this);c.addClass(a.call(this,b,c.attr("class")))});if(a&&typeof a==="string"){var b=(a||"").split(i);for(var c=0,e=this.length;c<e;c++){var f=this[c];if(f.nodeType===1)if(f.className){var g=" "+f.className+" ",h=f.className;for(var j=0,k=b.length;j<k;j++)g.indexOf(" "+b[j]+" ")<0&&(h+=" "+b[j]);f.className=d.trim(h)}else f.className=a}}return this},removeClass:function(a){if(d.isFunction(a))return this.each(function(b){var c=d(this);c.removeClass(a.call(this,b,c.attr("class")))});if(a&&typeof a==="string"||a===b){var c=(a||"").split(i);for(var e=0,f=this.length;e<f;e++){var g=this[e];if(g.nodeType===1&&g.className)if(a){var j=(" "+g.className+" ").replace(h," ");for(var k=0,l=c.length;k<l;k++)j=j.replace(" "+c[k]+" "," ");g.className=d.trim(j)}else g.className=""}}return this},toggleClass:function(a,b){var c=typeof a,e=typeof b==="boolean";if(d.isFunction(a))return this.each(function(c){var e=d(this);e.toggleClass(a.call(this,c,e.attr("class"),b),b)});return this.each(function(){if(c==="string"){var f,g=0,h=d(this),j=b,k=a.split(i);while(f=k[g++])j=e?j:!h.hasClass(f),h[j?"addClass":"removeClass"](f)}else if(c==="undefined"||c==="boolean")this.className&&d._data(this,"__className__",this.className),this.className=this.className||a===!1?"":d._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ";for(var c=0,d=this.length;c<d;c++)if((" "+this[c].className+" ").replace(h," ").indexOf(b)>-1)return!0;return!1},val:function(a){if(!arguments.length){var c=this[0];if(c){if(d.nodeName(c,"option")){var e=c.attributes.value;return!e||e.specified?c.value:c.text}if(d.nodeName(c,"select")){var f=c.selectedIndex,g=[],h=c.options,i=c.type==="select-one";if(f<0)return null;for(var k=i?f:0,l=i?f+1:h.length;k<l;k++){var m=h[k];if(m.selected&&(d.support.optDisabled?!m.disabled:m.getAttribute("disabled")===null)&&(!m.parentNode.disabled||!d.nodeName(m.parentNode,"optgroup"))){a=d(m).val();if(i)return a;g.push(a)}}if(i&&!g.length&&h.length)return d(h[f]).val();return g}if(o.test(c.type)&&!d.support.checkOn)return c.getAttribute("value")===null?"on":c.value;return(c.value||"").replace(j,"")}return b}var n=d.isFunction(a);return this.each(function(b){var c=d(this),e=a;if(this.nodeType===1){n&&(e=a.call(this,b,c.val())),e==null?e="":typeof e==="number"?e+="":d.isArray(e)&&(e=d.map(e,function(a){return a==null?"":a+""}));if(d.isArray(e)&&o.test(this.type))this.checked=d.inArray(c.val(),e)>=0;else if(d.nodeName(this,"select")){var f=d.makeArray(e);d("option",this).each(function(){this.selected=d.inArray(d(this).val(),f)>=0}),f.length||(this.selectedIndex=-1)}else this.value=e}})}}),d.extend({attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0},attr:function(a,c,e,f){if(!a||a.nodeType===3||a.nodeType===8||a.nodeType===2)return b;if(f&&c in d.attrFn)return d(a)[c](e);var g=a.nodeType!==1||!d.isXMLDoc(a),h=e!==b;c=g&&d.props[c]||c;if(a.nodeType===1){var i=k.test(c);if(c==="selected"&&!d.support.optSelected){var j=a.parentNode;j&&(j.selectedIndex,j.parentNode&&j.parentNode.selectedIndex)}if((c in a||a[c]!==b)&&g&&!i){h&&(c==="type"&&l.test(a.nodeName)&&a.parentNode&&d.error("type property can't be changed"),e===null?a.nodeType===1&&a.removeAttribute(c):a[c]=e);if(d.nodeName(a,"form")&&a.getAttributeNode(c))return a.getAttributeNode(c).nodeValue;if(c==="tabIndex"){var o=a.getAttributeNode("tabIndex");return o&&o.specified?o.value:m.test(a.nodeName)||n.test(a.nodeName)&&a.href?0:b}return a[c]}if(!d.support.style&&g&&c==="style"){h&&(a.style.cssText=""+e);return a.style.cssText}h&&a.setAttribute(c,""+e);if(!a.attributes[c]&&(a.hasAttribute&&!a.hasAttribute(c)))return b;var p=!d.support.hrefNormalized&&g&&i?a.getAttribute(c,2):a.getAttribute(c);return p===null?b:p}h&&(a[c]=e);return a[c]}});var p=/\.(.*)$/,q=/^(?:textarea|input|select)$/i,r=/\./g,s=/ /g,t=/[^\w\s.|`]/g,u=function(a){return a.replace(t,"\\$&")};d.event={add:function(c,e,f,g){if(c.nodeType!==3&&c.nodeType!==8){try{d.isWindow(c)&&(c!==a&&!c.frameElement)&&(c=a)}catch(h){}if(f===!1)f=v;else if(!f)return;var i,j;f.handler&&(i=f,f=i.handler),f.guid||(f.guid=d.guid++);var k=d._data(c);if(!k)return;var l=k.events,m=k.handle;l||(k.events=l={}),m||(k.handle=m=function(){return typeof d!=="undefined"&&!d.event.triggered?d.event.handle.apply(m.elem,arguments):b}),m.elem=c,e=e.split(" ");var n,o=0,p;while(n=e[o++]){j=i?d.extend({},i):{handler:f,data:g},n.indexOf(".")>-1?(p=n.split("."),n=p.shift(),j.namespace=p.slice(0).sort().join(".")):(p=[],j.namespace=""),j.type=n,j.guid||(j.guid=f.guid);var q=l[n],r=d.event.special[n]||{};if(!q){q=l[n]=[];if(!r.setup||r.setup.call(c,g,p,m)===!1)c.addEventListener?c.addEventListener(n,m,!1):c.attachEvent&&c.attachEvent("on"+n,m)}r.add&&(r.add.call(c,j),j.handler.guid||(j.handler.guid=f.guid)),q.push(j),d.event.global[n]=!0}c=null}},global:{},remove:function(a,c,e,f){if(a.nodeType!==3&&a.nodeType!==8){e===!1&&(e=v);var g,h,i,j,k=0,l,m,n,o,p,q,r,s=d.hasData(a)&&d._data(a),t=s&&s.events;if(!s||!t)return;c&&c.type&&(e=c.handler,c=c.type);if(!c||typeof c==="string"&&c.charAt(0)==="."){c=c||"";for(h in t)d.event.remove(a,h+c);return}c=c.split(" ");while(h=c[k++]){r=h,q=null,l=h.indexOf(".")<0,m=[],l||(m=h.split("."),h=m.shift(),n=new RegExp("(^|\\.)"+d.map(m.slice(0).sort(),u).join("\\.(?:.*\\.)?")+"(\\.|$)")),p=t[h];if(!p)continue;if(!e){for(j=0;j<p.length;j++){q=p[j];if(l||n.test(q.namespace))d.event.remove(a,r,q.handler,j),p.splice(j--,1)}continue}o=d.event.special[h]||{};for(j=f||0;j<p.length;j++){q=p[j];if(e.guid===q.guid){if(l||n.test(q.namespace))f==null&&p.splice(j--,1),o.remove&&o.remove.call(a,q);if(f!=null)break}}if(p.length===0||f!=null&&p.length===1)(!o.teardown||o.teardown.call(a,m)===!1)&&d.removeEvent(a,h,s.handle),g=null,delete t[h]}if(d.isEmptyObject(t)){var w=s.handle;w&&(w.elem=null),delete s.events,delete s.handle,d.isEmptyObject(s)&&d.removeData(a,b,!0)}}},trigger:function(a,c,e){var f=a.type||a,g=arguments[3];if(!g){a=typeof a==="object"?a[d.expando]?a:d.extend(d.Event(f),a):d.Event(f),f.indexOf("!")>=0&&(a.type=f=f.slice(0,-1),a.exclusive=!0),e||(a.stopPropagation(),d.event.global[f]&&d.each(d.cache,function(){var b=d.expando,e=this[b];e&&e.events&&e.events[f]&&d.event.trigger(a,c,e.handle.elem)}));if(!e||e.nodeType===3||e.nodeType===8)return b;a.result=b,a.target=e,c=d.makeArray(c),c.unshift(a)}a.currentTarget=e;var h=d._data(e,"handle");h&&h.apply(e,c);var i=e.parentNode||e.ownerDocument;try{e&&e.nodeName&&d.noData[e.nodeName.toLowerCase()]||e["on"+f]&&e["on"+f].apply(e,c)===!1&&(a.result=!1,a.preventDefault())}catch(j){}if(!a.isPropagationStopped()&&i)d.event.trigger(a,c,i,!0);else if(!a.isDefaultPrevented()){var k,l=a.target,m=f.replace(p,""),n=d.nodeName(l,"a")&&m==="click",o=d.event.special[m]||{};if((!o._default||o._default.call(e,a)===!1)&&!n&&!(l&&l.nodeName&&d.noData[l.nodeName.toLowerCase()])){try{l[m]&&(k=l["on"+m],k&&(l["on"+m]=null),d.event.triggered=!0,l[m]())}catch(q){}k&&(l["on"+m]=k),d.event.triggered=!1}}},handle:function(c){var e,f,g,h,i,j=[],k=d.makeArray(arguments);c=k[0]=d.event.fix(c||a.event),c.currentTarget=this,e=c.type.indexOf(".")<0&&!c.exclusive,e||(g=c.type.split("."),c.type=g.shift(),j=g.slice(0).sort(),h=new RegExp("(^|\\.)"+j.join("\\.(?:.*\\.)?")+"(\\.|$)")),c.namespace=c.namespace||j.join("."),i=d._data(this,"events"),f=(i||{})[c.type];if(i&&f){f=f.slice(0);for(var l=0,m=f.length;l<m;l++){var n=f[l];if(e||h.test(n.namespace)){c.handler=n.handler,c.data=n.data,c.handleObj=n;var o=n.handler.apply(this,k);o!==b&&(c.result=o,o===!1&&(c.preventDefault(),c.stopPropagation()));if(c.isImmediatePropagationStopped())break}}}return c.result},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),fix:function(a){if(a[d.expando])return a;var e=a;a=d.Event(e);for(var f=this.props.length,g;f;)g=this.props[--f],a[g]=e[g];a.target||(a.target=a.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),!a.relatedTarget&&a.fromElement&&(a.relatedTarget=a.fromElement===a.target?a.toElement:a.fromElement);if(a.pageX==null&&a.clientX!=null){var h=c.documentElement,i=c.body;a.pageX=a.clientX+(h&&h.scrollLeft||i&&i.scrollLeft||0)-(h&&h.clientLeft||i&&i.clientLeft||0),a.pageY=a.clientY+(h&&h.scrollTop||i&&i.scrollTop||0)-(h&&h.clientTop||i&&i.clientTop||0)}a.which==null&&(a.charCode!=null||a.keyCode!=null)&&(a.which=a.charCode!=null?a.charCode:a.keyCode),!a.metaKey&&a.ctrlKey&&(a.metaKey=a.ctrlKey),!a.which&&a.button!==b&&(a.which=a.button&1?1:a.button&2?3:a.button&4?2:0);return a},guid:1e8,proxy:d.proxy,special:{ready:{setup:d.bindReady,teardown:d.noop},live:{add:function(a){d.event.add(this,F(a.origType,a.selector),d.extend({},a,{handler:E,guid:a.handler.guid}))},remove:function(a){d.event.remove(this,F(a.origType,a.selector),a)}},beforeunload:{setup:function(a,b,c){d.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}}},d.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},d.Event=function(a){if(!this.preventDefault)return new d.Event(a);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?w:v):this.type=a,this.timeStamp=d.now(),this[d.expando]=!0},d.Event.prototype={preventDefault:function(){this.isDefaultPrevented=w;var a=this.originalEvent;a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){this.isPropagationStopped=w;var a=this.originalEvent;a&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=w,this.stopPropagation()},isDefaultPrevented:v,isPropagationStopped:v,isImmediatePropagationStopped:v};var x=function(a){var b=a.relatedTarget;try{if(b!==c&&!b.parentNode)return;while(b&&b!==this)b=b.parentNode;b!==this&&(a.type=a.data,d.event.handle.apply(this,arguments))}catch(e){}},y=function(a){a.type=a.data,d.event.handle.apply(this,arguments)};d.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){d.event.special[a]={setup:function(c){d.event.add(this,b,c&&c.selector?y:x,a)},teardown:function(a){d.event.remove(this,b,a&&a.selector?y:x)}}}),d.support.submitBubbles||(d.event.special.submit={setup:function(a,b){if(this.nodeName&&this.nodeName.toLowerCase()!=="form")d.event.add(this,"click.specialSubmit",function(a){var b=a.target,c=b.type;(c==="submit"||c==="image")&&d(b).closest("form").length&&C("submit",this,arguments)}),d.event.add(this,"keypress.specialSubmit",function(a){var b=a.target,c=b.type;(c==="text"||c==="password")&&d(b).closest("form").length&&a.keyCode===13&&C("submit",this,arguments)});else return!1},teardown:function(a){d.event.remove(this,".specialSubmit")}});if(!d.support.changeBubbles){var z,A=function(a){var b=a.type,c=a.value;b==="radio"||b==="checkbox"?c=a.checked:b==="select-multiple"?c=a.selectedIndex>-1?d.map(a.options,function(a){return a.selected}).join("-"):"":a.nodeName.toLowerCase()==="select"&&(c=a.selectedIndex);return c},B=function B(a){var c=a.target,e,f;if(q.test(c.nodeName)&&!c.readOnly){e=d._data(c,"_change_data"),f=A(c),(a.type!=="focusout"||c.type!=="radio")&&d._data(c,"_change_data",f);if(e===b||f===e)return;if(e!=null||f)a.type="change",a.liveFired=b,d.event.trigger(a,arguments[1],c)}};d.event.special.change={filters:{focusout:B,beforedeactivate:B,click:function(a){var b=a.target,c=b.type;(c==="radio"||c==="checkbox"||b.nodeName.toLowerCase()==="select")&&B.call(this,a)},keydown:function(a){var b=a.target,c=b.type;(a.keyCode===13&&b.nodeName.toLowerCase()!=="textarea"||a.keyCode===32&&(c==="checkbox"||c==="radio")||c==="select-multiple")&&B.call(this,a)},beforeactivate:function(a){var b=a.target;d._data(b,"_change_data",A(b))}},setup:function(a,b){if(this.type==="file")return!1;for(var c in z)d.event.add(this,c+".specialChange",z[c]);return q.test(this.nodeName)},teardown:function(a){d.event.remove(this,".specialChange");return q.test(this.nodeName)}},z=d.event.special.change.filters,z.focus=z.beforeactivate}c.addEventListener&&d.each({focus:"focusin",blur:"focusout"},function(a,b){function c(a){a=d.event.fix(a),a.type=b;return d.event.handle.call(this,a)}d.event.special[b]={setup:function(){this.addEventListener(a,c,!0)},teardown:function(){this.removeEventListener(a,c,!0)}}}),d.each(["bind","one"],function(a,c){d.fn[c]=function(a,e,f){if(typeof a==="object"){for(var g in a)this[c](g,e,a[g],f);return this}if(d.isFunction(e)||e===!1)f=e,e=b;var h=c==="one"?d.proxy(f,function(a){d(this).unbind(a,h);return f.apply(this,arguments)}):f;if(a==="unload"&&c!=="one")this.one(a,e,f);else for(var i=0,j=this.length;i<j;i++)d.event.add(this[i],a,h,e);return this}}),d.fn.extend({unbind:function(a,b){if(typeof a!=="object"||a.preventDefault)for(var e=0,f=this.length;e<f;e++)d.event.remove(this[e],a,b);else for(var c in a)this.unbind(c,a[c]);return this},delegate:function(a,b,c,d){return this.live(b,c,d,a)},undelegate:function(a,b,c){return arguments.length===0?this.unbind("live"):this.die(b,null,c,a)},trigger:function(a,b){return this.each(function(){d.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0]){var c=d.Event(a);c.preventDefault(),c.stopPropagation(),d.event.trigger(c,b,this[0]);return c.result}},toggle:function(a){var b=arguments,c=1;while(c<b.length)d.proxy(a,b[c++]);return this.click(d.proxy(a,function(e){var f=(d._data(this,"lastToggle"+a.guid)||0)%c;d._data(this,"lastToggle"+a.guid,f+1),e.preventDefault();return b[f].apply(this,arguments)||!1}))},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var D={focus:"focusin",blur:"focusout",mouseenter:"mouseover",mouseleave:"mouseout"};d.each(["live","die"],function(a,c){d.fn[c]=function(a,e,f,g){var h,i=0,j,k,l,m=g||this.selector,n=g?this:d(this.context);if(typeof a==="object"&&!a.preventDefault){for(var o in a)n[c](o,e,a[o],m);return this}d.isFunction(e)&&(f=e,e=b),a=(a||"").split(" ");while((h=a[i++])!=null){j=p.exec(h),k="",j&&(k=j[0],h=h.replace(p,""));if(h==="hover"){a.push("mouseenter"+k,"mouseleave"+k);continue}l=h,h==="focus"||h==="blur"?(a.push(D[h]+k),h=h+k):h=(D[h]||h)+k;if(c==="live")for(var q=0,r=n.length;q<r;q++)d.event.add(n[q],"live."+F(h,m),{data:e,selector:m,handler:f,origType:h,origHandler:f,preType:l});else n.unbind("live."+F(h,m),f)}return this}}),d.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error".split(" "),function(a,b){d.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.bind(b,a,c):this.trigger(b)},d.attrFn&&(d.attrFn[b]=!0)}),function(){function u(a,b,c,d,e,f){for(var g=0,h=d.length;g<h;g++){var i=d[g];if(i){var j=!1;i=i[a];while(i){if(i.sizcache===c){j=d[i.sizset];break}if(i.nodeType===1){f||(i.sizcache=c,i.sizset=g);if(typeof b!=="string"){if(i===b){j=!0;break}}else if(k.filter(b,[i]).length>0){j=i;break}}i=i[a]}d[g]=j}}}function t(a,b,c,d,e,f){for(var g=0,h=d.length;g<h;g++){var i=d[g];if(i){var j=!1;i=i[a];while(i){if(i.sizcache===c){j=d[i.sizset];break}i.nodeType===1&&!f&&(i.sizcache=c,i.sizset=g);if(i.nodeName.toLowerCase()===b){j=i;break}i=i[a]}d[g]=j}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,e=0,f=Object.prototype.toString,g=!1,h=!0,i=/\\/g,j=/\W/;[0,0].sort(function(){h=!1;return 0});var k=function(b,d,e,g){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];if(!b||typeof b!=="string")return e;var i,j,n,o,q,r,s,t,u=!0,w=k.isXML(d),x=[],y=b;do{a.exec(""),i=a.exec(y);if(i){y=i[3],x.push(i[1]);if(i[2]){o=i[3];break}}}while(i);if(x.length>1&&m.exec(b))if(x.length===2&&l.relative[x[0]])j=v(x[0]+x[1],d);else{j=l.relative[x[0]]?[d]:k(x.shift(),d);while(x.length)b=x.shift(),l.relative[b]&&(b+=x.shift()),j=v(b,j)}else{!g&&x.length>1&&d.nodeType===9&&!w&&l.match.ID.test(x[0])&&!l.match.ID.test(x[x.length-1])&&(q=k.find(x.shift(),d,w),d=q.expr?k.filter(q.expr,q.set)[0]:q.set[0]);if(d){q=g?{expr:x.pop(),set:p(g)}:k.find(x.pop(),x.length===1&&(x[0]==="~"||x[0]==="+")&&d.parentNode?d.parentNode:d,w),j=q.expr?k.filter(q.expr,q.set):q.set,x.length>0?n=p(j):u=!1;while(x.length)r=x.pop(),s=r,l.relative[r]?s=x.pop():r="",s==null&&(s=d),l.relative[r](n,s,w)}else n=x=[]}n||(n=j),n||k.error(r||b);if(f.call(n)==="[object Array]")if(u)if(d&&d.nodeType===1)for(t=0;n[t]!=null;t++)n[t]&&(n[t]===!0||n[t].nodeType===1&&k.contains(d,n[t]))&&e.push(j[t]);else for(t=0;n[t]!=null;t++)n[t]&&n[t].nodeType===1&&e.push(j[t]);else e.push.apply(e,n);else p(n,e);o&&(k(o,h,e,g),k.uniqueSort(e));return e};k.uniqueSort=function(a){if(r){g=h,a.sort(r);if(g)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a},k.matches=function(a,b){return k(a,null,null,b)},k.matchesSelector=function(a,b){return k(b,null,null,[a]).length>0},k.find=function(a,b,c){var d;if(!a)return[];for(var e=0,f=l.order.length;e<f;e++){var g,h=l.order[e];if(g=l.leftMatch[h].exec(a)){var j=g[1];g.splice(1,1);if(j.substr(j.length-1)!=="\\"){g[1]=(g[1]||"").replace(i,""),d=l.find[h](g,b,c);if(d!=null){a=a.replace(l.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!=="undefined"?b.getElementsByTagName("*"):[]);return{set:d,expr:a}},k.filter=function(a,c,d,e){var f,g,h=a,i=[],j=c,m=c&&c[0]&&k.isXML(c[0]);while(a&&c.length){for(var n in l.filter)if((f=l.leftMatch[n].exec(a))!=null&&f[2]){var o,p,q=l.filter[n],r=f[1];g=!1,f.splice(1,1);if(r.substr(r.length-1)==="\\")continue;j===i&&(i=[]);if(l.preFilter[n]){f=l.preFilter[n](f,j,d,i,e,m);if(f){if(f===!0)continue}else g=o=!0}if(f)for(var s=0;(p=j[s])!=null;s++)if(p){o=q(p,f,s,j);var t=e^!!o;d&&o!=null?t?g=!0:j[s]=!1:t&&(i.push(p),g=!0)}if(o!==b){d||(j=i),a=a.replace(l.match[n],"");if(!g)return[];break}}if(a===h)if(g==null)k.error(a);else break;h=a}return j},k.error=function(a){throw"Syntax error, unrecognized expression: "+a};var l=k.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b==="string",d=c&&!j.test(b),e=c&&!d;d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1){}a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&k.filter(b,a,!0)},">":function(a,b){var c,d=typeof b==="string",e=0,f=a.length;if(d&&!j.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&k.filter(b,a,!0)}},"":function(a,b,c){var d,f=e++,g=u;typeof b==="string"&&!j.test(b)&&(b=b.toLowerCase(),d=b,g=t),g("parentNode",b,f,a,d,c)},"~":function(a,b,c){var d,f=e++,g=u;typeof b==="string"&&!j.test(b)&&(b=b.toLowerCase(),d=b,g=t),g("previousSibling",b,f,a,d,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!=="undefined"&&!c){var d=b.getElementById(a[1]);return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!=="undefined"){var c=[],d=b.getElementsByName(a[1]);for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c}},TAG:function(a,b){if(typeof b.getElementsByTagName!=="undefined")return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(i,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));return!1},ID:function(a){return a[1].replace(i,"")},TAG:function(a,b){return a[1].replace(i,"").toLowerCase()},CHILD:function(a){if(a[1]==="nth"){a[2]||k.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&k.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){var g=a[1]=a[1].replace(i,"");!f&&l.attrMap[g]&&(a[1]=l.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(i,""),a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=k(b[3],null,null,c);else{var g=k.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(l.match.POS.test(b[0])||l.match.CHILD.test(b[0]))return!0;return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden"},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!k(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){return"text"===a.getAttribute("type")},radio:function(a){return"radio"===a.type},checkbox:function(a){return"checkbox"===a.type},file:function(a){return"file"===a.type},password:function(a){return"password"===a.type},submit:function(a){return"submit"===a.type},image:function(a){return"image"===a.type},reset:function(a){return"reset"===a.type},button:function(a){return"button"===a.type||a.nodeName.toLowerCase()==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=l.filters[e];if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||k.getText([a])||"").indexOf(b[3])>=0;if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}k.error(e)},CHILD:function(a,b){var c=b[1],d=a;switch(c){case"only":case"first":while(d=d.previousSibling)if(d.nodeType===1)return!1;if(c==="first")return!0;d=a;case"last":while(d=d.nextSibling)if(d.nodeType===1)return!1;return!0;case"nth":var e=b[2],f=b[3];if(e===1&&f===0)return!0;var g=b[0],h=a.parentNode;if(h&&(h.sizcache!==g||!a.nodeIndex)){var i=0;for(d=h.firstChild;d;d=d.nextSibling)d.nodeType===1&&(d.nodeIndex=++i);h.sizcache=g}var j=a.nodeIndex-f;return e===0?j===0:j%e===0&&j/e>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||a.nodeName.toLowerCase()===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=l.attrHandle[c]?l.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];return d==null?f==="!=":f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1},POS:function(a,b,c,d){var e=b[2],f=l.setFilters[e];if(f)return f(a,c,b,d)}}},m=l.match.POS,n=function(a,b){return"\\"+(b-0+1)};for(var o in l.match)l.match[o]=new RegExp(l.match[o].source+/(?![^\[]*\])(?![^\(]*\))/.source),l.leftMatch[o]=new RegExp(/(^(?:.|\r|\n)*?)/.source+l.match[o].source.replace(/\\(\d+)/g,n));var p=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(q){p=function(a,b){var c=0,d=b||[];if(f.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length==="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);return d}}var r,s;c.documentElement.compareDocumentPosition?r=function(a,b){if(a===b){g=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;return a.compareDocumentPosition(b)&4?-1:1}:(r=function(a,b){var c,d,e=[],f=[],h=a.parentNode,i=b.parentNode,j=h;if(a===b){g=!0;return 0}if(h===i)return s(a,b);if(!h)return-1;if(!i)return 1;while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return s(e[k],f[k]);return k===c?s(a,f[k],-1):s(e[k],b,1)},s=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}),k.getText=function(a){var b="",c;for(var d=0;a[d];d++)c=a[d],c.nodeType===3||c.nodeType===4?b+=c.nodeValue:c.nodeType!==8&&(b+=k.getText(c.childNodes));return b},function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(l.find.ID=function(a,c,d){if(typeof c.getElementById!=="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!=="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[]}},l.filter.ID=function(a,b){var c=typeof a.getAttributeNode!=="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),a.getElementsByTagName("*").length>0&&(l.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!=="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(l.attrHandle.href=function(a){return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=k,b=c.createElement("div"),d="__sizzle__";b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){k=function(b,e,f,g){e=e||c;if(!g&&!k.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){if(h[1])return p(e.getElementsByTagName(b),f);if(h[2]&&l.find.CLASS&&e.getElementsByClassName)return p(e.getElementsByClassName(h[2]),f)}if(e.nodeType===9){if(b==="body"&&e.body)return p([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);if(!i||!i.parentNode)return p([],f);if(i.id===h[3])return p([i],f)}try{return p(e.querySelectorAll(b),f)}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var m=e,n=e.getAttribute("id"),o=n||d,q=e.parentNode,r=/^\s*[+~]/.test(b);n?o=o.replace(/'/g,"\\$&"):e.setAttribute("id",o),r&&q&&(e=e.parentNode);try{if(!r||q)return p(e.querySelectorAll("[id='"+o+"'] "+b),f)}catch(s){}finally{n||m.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)k[e]=a[e];b=null}}(),function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector,d=!1;try{b.call(c.documentElement,"[test!='']:sizzle")}catch(e){d=!0}b&&(k.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!k.isXML(a))try{if(d||!l.match.PSEUDO.test(c)&&!/!=/.test(c))return b.call(a,c)}catch(e){}return k(c,null,null,[a]).length>0})}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;l.order.splice(1,0,"CLASS"),l.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!=="undefined"&&!c)return b.getElementsByClassName(a[1])},a=null}}(),c.documentElement.contains?k.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0)}:c.documentElement.compareDocumentPosition?k.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16)}:k.contains=function(){return!1},k.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1};var v=function(a,b){var c,d=[],e="",f=b.nodeType?[b]:b;while(c=l.match.PSEUDO.exec(a))e+=c[0],a=a.replace(l.match.PSEUDO,"");a=l.relative[a]?a+"*":a;for(var g=0,h=f.length;g<h;g++)k(a,f[g],d);return k.filter(e,d)};d.find=k,d.expr=k.selectors,d.expr[":"]=d.expr.filters,d.unique=k.uniqueSort,d.text=k.getText,d.isXMLDoc=k.isXML,d.contains=k.contains}();var G=/Until$/,H=/^(?:parents|prevUntil|prevAll)/,I=/,/,J=/^.[^:#\[\.,]*$/,K=Array.prototype.slice,L=d.expr.match.POS,M={children:!0,contents:!0,next:!0,prev:!0};d.fn.extend({find:function(a){var b=this.pushStack("","find",a),c=0;for(var e=0,f=this.length;e<f;e++){c=b.length,d.find(a,this[e],b);if(e>0)for(var g=c;g<b.length;g++)for(var h=0;h<c;h++)if(b[h]===b[g]){b.splice(g--,1);break}}return b},has:function(a){var b=d(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(d.contains(this,b[a]))return!0})},not:function(a){return this.pushStack(O(this,a,!1),"not",a)},filter:function(a){return this.pushStack(O(this,a,!0),"filter",a)},is:function(a){return!!a&&d.filter(a,this).length>0},closest:function(a,b){var c=[],e,f,g=this[0];if(d.isArray(a)){var h,i,j={},k=1;if(g&&a.length){for(e=0,f=a.length;e<f;e++)i=a[e],j[i]||(j[i]=d.expr.match.POS.test(i)?d(i,b||this.context):i);while(g&&g.ownerDocument&&g!==b){for(i in j)h=j[i],(h.jquery?h.index(g)>-1:d(g).is(h))&&c.push({selector:i,elem:g,level:k});g=g.parentNode,k++}}return c}var l=L.test(a)?d(a,b||this.context):null;for(e=0,f=this.length;e<f;e++){g=this[e];while(g){if(l?l.index(g)>-1:d.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b)break}}c=c.length>1?d.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a||typeof a==="string")return d.inArray(this[0],a?d(a):this.parent().children());return d.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var c=typeof a==="string"?d(a,b):d.makeArray(a),e=d.merge(this.get(),c);return this.pushStack(N(c[0])||N(e[0])?e:d.unique(e))},andSelf:function(){return this.add(this.prevObject)}}),d.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return d.dir(a,"parentNode")},parentsUntil:function(a,b,c){return d.dir(a,"parentNode",c)},next:function(a){return d.nth(a,2,"nextSibling")},prev:function(a){return d.nth(a,2,"previousSibling")},nextAll:function(a){return d.dir(a,"nextSibling")},prevAll:function(a){return d.dir(a,"previousSibling")},nextUntil:function(a,b,c){return d.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return d.dir(a,"previousSibling",c)},siblings:function(a){return d.sibling(a.parentNode.firstChild,a)},children:function(a){return d.sibling(a.firstChild)},contents:function(a){return d.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:d.makeArray(a.childNodes)}},function(a,b){d.fn[a]=function(c,e){var f=d.map(this,b,c),g=K.call(arguments);G.test(a)||(e=c),e&&typeof e==="string"&&(f=d.filter(e,f)),f=this.length>1&&!M[a]?d.unique(f):f,(this.length>1||I.test(e))&&H.test(a)&&(f=f.reverse());return this.pushStack(f,a,g.join(","))}}),d.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?d.find.matchesSelector(b[0],a)?[b[0]]:[]:d.find.matches(a,b)},dir:function(a,c,e){var f=[],g=a[c];while(g&&g.nodeType!==9&&(e===b||g.nodeType!==1||!d(g).is(e)))g.nodeType===1&&f.push(g),g=g[c];return f},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var P=/ jQuery\d+="(?:\d+|null)"/g,Q=/^\s+/,R=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,S=/<([\w:]+)/,T=/<tbody/i,U=/<|&#?\w+;/,V=/<(?:script|object|embed|option|style)/i,W=/checked\s*(?:[^=]|=\s*.checked.)/i,X={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]};X.optgroup=X.option,X.tbody=X.tfoot=X.colgroup=X.caption=X.thead,X.th=X.td,d.support.htmlSerialize||(X._default=[1,"div<div>","</div>"]),d.fn.extend({text:function(a){if(d.isFunction(a))return this.each(function(b){var c=d(this);c.text(a.call(this,b,c.text()))});if(typeof a!=="object"&&a!==b)return this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a));return d.text(this)},wrapAll:function(a){if(d.isFunction(a))return this.each(function(b){d(this).wrapAll(a.call(this,b))});if(this[0]){var b=d(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){if(d.isFunction(a))return this.each(function(b){d(this).wrapInner(a.call(this,b))});return this.each(function(){var b=d(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){return this.each(function(){d(this).wrapAll(a)})},unwrap:function(){return this.parent().each(function(){d.nodeName(this,"body")||d(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=d(arguments[0]);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,d(arguments[0]).toArray());return a}},remove:function(a,b){for(var c=0,e;(e=this[c])!=null;c++)if(!a||d.filter(a,[e]).length)!b&&e.nodeType===1&&(d.cleanData(e.getElementsByTagName("*")),d.cleanData([e])),e.parentNode&&e.parentNode.removeChild(e);return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++){b.nodeType===1&&d.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild)}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return d.clone(this,a,b)})},html:function(a){if(a===b)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(P,""):null;if(typeof a!=="string"||V.test(a)||!d.support.leadingWhitespace&&Q.test(a)||X[(S.exec(a)||["",""])[1].toLowerCase()])d.isFunction(a)?this.each(function(b){var c=d(this);c.html(a.call(this,b,c.html()))}):this.empty().append(a);else{a=a.replace(R,"<$1></$2>");try{for(var c=0,e=this.length;c<e;c++)this[c].nodeType===1&&(d.cleanData(this[c].getElementsByTagName("*")),this[c].innerHTML=a)}catch(f){this.empty().append(a)}}return this},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(d.isFunction(a))return this.each(function(b){var c=d(this),e=c.html();c.replaceWith(a.call(this,b,e))});typeof a!=="string"&&(a=d(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;d(this).remove(),b?d(b).before(a):d(c).append(a)})}return this.pushStack(d(d.isFunction(a)?a():a),"replaceWith",a)},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,e){var f,g,h,i,j=a[0],k=[];if(!d.support.checkClone&&arguments.length===3&&typeof j==="string"&&W.test(j))return this.each(function(){d(this).domManip(a,c,e,!0)});if(d.isFunction(j))return this.each(function(f){var g=d(this);a[0]=j.call(this,f,c?g.html():b),g.domManip(a,c,e)});if(this[0]){i=j&&j.parentNode,d.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?f={fragment:i}:f=d.buildFragment(a,this,k),h=f.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;if(g){c=c&&d.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)e.call(c?Y(this[l],g):this[l],f.cacheable||m>1&&l<n?d.clone(h,!0,!0):h)}k.length&&d.each(k,ba)}return this}}),d.buildFragment=function(a,b,e){var f,g,h,i=b&&b[0]?b[0].ownerDocument||b[0]:c;a.length===1&&typeof a[0]==="string"&&a[0].length<512&&i===c&&a[0].charAt(0)==="<"&&!V.test(a[0])&&(d.support.checkClone||!W.test(a[0]))&&(g=!0,h=d.fragments[a[0]],h&&(h!==1&&(f=h))),f||(f=i.createDocumentFragment(),d.clean(a,i,f,e)),g&&(d.fragments[a[0]]=h?f:1);return{fragment:f,cacheable:g}},d.fragments={},d.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){d.fn[a]=function(c){var e=[],f=d(c),g=this.length===1&&this[0].parentNode;if(g&&g.nodeType===11&&g.childNodes.length===1&&f.length===1){f[b](this[0]);return this}for(var h=0,i=f.length;h<i;h++){var j=(h>0?this.clone(!0):this).get();d(f[h])[b](j),e=e.concat(j)}return this.pushStack(e,a,f.selector)}}),d.extend({clone:function(a,b,c){var e=a.cloneNode(!0),f,g,h;if((!d.support.noCloneEvent||!d.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!d.isXMLDoc(a)){$(a,e),f=_(a),g=_(e);for(h=0;f[h];++h)$(f[h],g[h])}if(b){Z(a,e);if(c){f=_(a),g=_(e);for(h=0;f[h];++h)Z(f[h],g[h])}}return e},clean:function(a,b,e,f){b=b||c,typeof b.createElement==="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);var g=[];for(var h=0,i;(i=a[h])!=null;h++){typeof i==="number"&&(i+="");if(!i)continue;if(typeof i!=="string"||U.test(i)){if(typeof i==="string"){i=i.replace(R,"<$1></$2>");var j=(S.exec(i)||["",""])[1].toLowerCase(),k=X[j]||X._default,l=k[0],m=b.createElement("div");m.innerHTML=k[1]+i+k[2];while(l--)m=m.lastChild;if(!d.support.tbody){var n=T.test(i),o=j==="table"&&!n?m.firstChild&&m.firstChild.childNodes:k[1]==="<table>"&&!n?m.childNodes:[];for(var p=o.length-1;p>=0;--p)d.nodeName(o[p],"tbody")&&!o[p].childNodes.length&&o[p].parentNode.removeChild(o[p])}!d.support.leadingWhitespace&&Q.test(i)&&m.insertBefore(b.createTextNode(Q.exec(i)[0]),m.firstChild),i=m.childNodes}}else i=b.createTextNode(i);i.nodeType?g.push(i):g=d.merge(g,i)}if(e)for(h=0;g[h];h++)!f||!d.nodeName(g[h],"script")||g[h].type&&g[h].type.toLowerCase()!=="text/javascript"?(g[h].nodeType===1&&g.splice.apply(g,[h+1,0].concat(d.makeArray(g[h].getElementsByTagName("script")))),e.appendChild(g[h])):f.push(g[h].parentNode?g[h].parentNode.removeChild(g[h]):g[h]);return g},cleanData:function(a){var b,c,e=d.cache,f=d.expando,g=d.event.special,h=d.support.deleteExpando;for(var i=0,j;(j=a[i])!=null;i++){if(j.nodeName&&d.noData[j.nodeName.toLowerCase()])continue;c=j[d.expando];if(c){b=e[c]&&e[c][f];if(b&&b.events){for(var k in b.events)g[k]?d.event.remove(j,k):d.removeEvent(j,k,b.handle);b.handle&&(b.handle.elem=null)}h?delete j[d.expando]:j.removeAttribute&&j.removeAttribute(d.expando),delete e[c]}}}});var bb=/alpha\([^)]*\)/i,bc=/opacity=([^)]*)/,bd=/-([a-z])/ig,be=/([A-Z])/g,bf=/^-?\d+(?:px)?$/i,bg=/^-?\d/,bh={position:"absolute",visibility:"hidden",display:"block"},bi=["Left","Right"],bj=["Top","Bottom"],bk,bl,bm,bn=function(a,b){return b.toUpperCase()};d.fn.css=function(a,c){if(arguments.length===2&&c===b)return this;return d.access(this,a,c,!0,function(a,c,e){return e!==b?d.style(a,c,e):d.css(a,c)})},d.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=bk(a,"opacity","opacity");return c===""?"1":c}return a.style.opacity}}},cssNumber:{zIndex:!0,fontWeight:!0,opacity:!0,zoom:!0,lineHeight:!0},cssProps:{"float":d.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,e,f){if(a&&a.nodeType!==3&&a.nodeType!==8&&a.style){var g,h=d.camelCase(c),i=a.style,j=d.cssHooks[h];c=d.cssProps[h]||h;if(e===b){if(j&&"get"in j&&(g=j.get(a,!1,f))!==b)return g;return i[c]}if(typeof e==="number"&&isNaN(e)||e==null)return;typeof e==="number"&&!d.cssNumber[h]&&(e+="px");if(!j||!("set"in j)||(e=j.set(a,e))!==b)try{i[c]=e}catch(k){}}},css:function(a,c,e){var f,g=d.camelCase(c),h=d.cssHooks[g];c=d.cssProps[g]||g;if(h&&"get"in h&&(f=h.get(a,!0,e))!==b)return f;if(bk)return bk(a,c,g)},swap:function(a,b,c){var d={};for(var e in b)d[e]=a.style[e],a.style[e]=b[e];c.call(a);for(e in b)a.style[e]=d[e]},camelCase:function(a){return a.replace(bd,bn)}}),d.curCSS=d.css,d.each(["height","width"],function(a,b){d.cssHooks[b]={get:function(a,c,e){var f;if(c){a.offsetWidth!==0?f=bo(a,b,e):d.swap(a,bh,function(){f=bo(a,b,e)});if(f<=0){f=bk(a,b,b),f==="0px"&&bm&&(f=bm(a,b,b));if(f!=null)return f===""||f==="auto"?"0px":f}if(f<0||f==null){f=a.style[b];return f===""||f==="auto"?"0px":f}return typeof f==="string"?f:f+"px"}},set:function(a,b){if(!bf.test(b))return b;b=parseFloat(b);if(b>=0)return b+"px"}}}),d.support.opacity||(d.cssHooks.opacity={get:function(a,b){return bc.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var c=a.style;c.zoom=1;var e=d.isNaN(b)?"":"alpha(opacity="+b*100+")",f=c.filter||"";c.filter=bb.test(f)?f.replace(bb,e):c.filter+" "+e}}),c.defaultView&&c.defaultView.getComputedStyle&&(bl=function(a,c,e){var f,g,h;e=e.replace(be,"-$1").toLowerCase();if(!(g=a.ownerDocument.defaultView))return b;if(h=g.getComputedStyle(a,null))f=h.getPropertyValue(e),f===""&&!d.contains(a.ownerDocument.documentElement,a)&&(f=d.style(a,e));return f}),c.documentElement.currentStyle&&(bm=function(a,b){var c,d=a.currentStyle&&a.currentStyle[b],e=a.runtimeStyle&&a.runtimeStyle[b],f=a.style;!bf.test(d)&&bg.test(d)&&(c=f.left,e&&(a.runtimeStyle.left=a.currentStyle.left),f.left=b==="fontSize"?"1em":d||0,d=f.pixelLeft+"px",f.left=c,e&&(a.runtimeStyle.left=e));return d===""?"auto":d}),bk=bl||bm,d.expr&&d.expr.filters&&(d.expr.filters.hidden=function(a){var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!d.support.reliableHiddenOffsets&&(a.style.display||d.css(a,"display"))==="none"},d.expr.filters.visible=function(a){return!d.expr.filters.hidden(a)});var bp=/%20/g,bq=/\[\]$/,br=/\r?\n/g,bs=/#.*$/,bt=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bu=/^(?:color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bv=/(?:^file|^widget|\-extension):$/,bw=/^(?:GET|HEAD)$/,bx=/^\/\//,by=/\?/,bz=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bA=/^(?:select|textarea)/i,bB=/\s+/,bC=/([?&])_=[^&]*/,bD=/(^|\-)([a-z])/g,bE=function(a,b,c){return b+c.toUpperCase()},bF=/^([\w\+\.\-]+:)\/\/([^\/?#:]*)(?::(\d+))?/,bG=d.fn.load,bH={},bI={},bJ,bK;try{bJ=c.location.href}catch(bL){bJ=c.createElement("a"),bJ.href="",bJ=bJ.href}bK=bF.exec(bJ.toLowerCase()),d.fn.extend({load:function(a,c,e){if(typeof a!=="string"&&bG)return bG.apply(this,arguments);if(!this.length)return this;var f=a.indexOf(" ");if(f>=0){var g=a.slice(f,a.length);a=a.slice(0,f)}var h="GET";c&&(d.isFunction(c)?(e=c,c=b):typeof c==="object"&&(c=d.param(c,d.ajaxSettings.traditional),h="POST"));var i=this;d.ajax({url:a,type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){c=a}),i.html(g?d("<div>").append(c.replace(bz,"")).find(g):c)),e&&i.each(e,[c,b,a])}});return this},serialize:function(){return d.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?d.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||bA.test(this.nodeName)||bu.test(this.type))}).map(function(a,b){var c=d(this).val();return c==null?null:d.isArray(c)?d.map(c,function(a,c){return{name:b.name,value:a.replace(br,"\r\n")}}):{name:b.name,value:c.replace(br,"\r\n")}}).get()}}),d.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){d.fn[b]=function(a){return this.bind(b,a)}}),d.each(["get","post"],function(a,c){d[c]=function(a,e,f,g){d.isFunction(e)&&(g=g||f,f=e,e=b);return d.ajax({type:c,url:a,data:e,success:f,dataType:g})}}),d.extend({getScript:function(a,c){return d.get(a,b,c,"script")},getJSON:function(a,b,c){return d.get(a,b,c,"json")},ajaxSetup:function(a,b){b?d.extend(!0,a,d.ajaxSettings,b):(b=a,a=d.extend(!0,d.ajaxSettings,b));for(var c in {context:1,url:1})c in b?a[c]=b[c]:c in d.ajaxSettings&&(a[c]=d.ajaxSettings[c]);return a},ajaxSettings:{url:bJ,isLocal:bv.test(bK[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":"*/*"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":d.parseJSON,"text xml":d.parseXML}},ajaxPrefilter:bM(bH),ajaxTransport:bM(bI),ajax:function(a,c){function v(a,c,l,n){if(r!==2){r=2,p&&clearTimeout(p),o=b,m=n||"",u.readyState=a?4:0;var q,t,v,w=l?bP(e,u,l):b,x,y;if(a>=200&&a<300||a===304){if(e.ifModified){if(x=u.getResponseHeader("Last-Modified"))d.lastModified[k]=x;if(y=u.getResponseHeader("Etag"))d.etag[k]=y}if(a===304)c="notmodified",q=!0;else try{t=bQ(e,w),c="success",q=!0}catch(z){c="parsererror",v=z}}else{v=c;if(!c||a)c="error",a<0&&(a=0)}u.status=a,u.statusText=c,q?h.resolveWith(f,[t,c,u]):h.rejectWith(f,[u,c,v]),u.statusCode(j),j=b,s&&g.trigger("ajax"+(q?"Success":"Error"),[u,e,q?t:v]),i.resolveWith(f,[u,c]),s&&(g.trigger("ajaxComplete",[u,e]),--d.active||d.event.trigger("ajaxStop"))}}typeof a==="object"&&(c=a,a=b),c=c||{};var e=d.ajaxSetup({},c),f=e.context||e,g=f!==e&&(f.nodeType||f instanceof d)?d(f):d.event,h=d.Deferred(),i=d._Deferred(),j=e.statusCode||{},k,l={},m,n,o,p,q,r=0,s,t,u={readyState:0,setRequestHeader:function(a,b){r||(l[a.toLowerCase().replace(bD,bE)]=b);return this},getAllResponseHeaders:function(){return r===2?m:null},getResponseHeader:function(a){var c;if(r===2){if(!n){n={};while(c=bt.exec(m))n[c[1].toLowerCase()]=c[2]}c=n[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){r||(e.mimeType=a);return this},abort:function(a){a=a||"abort",o&&o.abort(a),v(0,a);return this}};h.promise(u),u.success=u.done,u.error=u.fail,u.complete=i.done,u.statusCode=function(a){if(a){var b;if(r<2)for(b in a)j[b]=[j[b],a[b]];else b=a[u.status],u.then(b,b)}return this},e.url=((a||e.url)+"").replace(bs,"").replace(bx,bK[1]+"//"),e.dataTypes=d.trim(e.dataType||"*").toLowerCase().split(bB),e.crossDomain||(q=bF.exec(e.url.toLowerCase()),e.crossDomain=q&&(q[1]!=bK[1]||q[2]!=bK[2]||(q[3]||(q[1]==="http:"?80:443))!=(bK[3]||(bK[1]==="http:"?80:443)))),e.data&&e.processData&&typeof e.data!=="string"&&(e.data=d.param(e.data,e.traditional)),bN(bH,e,c,u);if(r===2)return!1;s=e.global,e.type=e.type.toUpperCase(),e.hasContent=!bw.test(e.type),s&&d.active++===0&&d.event.trigger("ajaxStart");if(!e.hasContent){e.data&&(e.url+=(by.test(e.url)?"&":"?")+e.data),k=e.url;if(e.cache===!1){var w=d.now(),x=e.url.replace(bC,"$1_="+w);e.url=x+(x===e.url?(by.test(e.url)?"&":"?")+"_="+w:"")}}if(e.data&&e.hasContent&&e.contentType!==!1||c.contentType)l["Content-Type"]=e.contentType;e.ifModified&&(k=k||e.url,d.lastModified[k]&&(l["If-Modified-Since"]=d.lastModified[k]),d.etag[k]&&(l["If-None-Match"]=d.etag[k])),l.Accept=e.dataTypes[0]&&e.accepts[e.dataTypes[0]]?e.accepts[e.dataTypes[0]]+(e.dataTypes[0]!=="*"?", */*; q=0.01":""):e.accepts["*"];for(t in e.headers)u.setRequestHeader(t,e.headers[t]);if(e.beforeSend&&(e.beforeSend.call(f,u,e)===!1||r===2)){u.abort();return!1}for(t in {success:1,error:1,complete:1})u[t](e[t]);o=bN(bI,e,c,u);if(o){u.readyState=1,s&&g.trigger("ajaxSend",[u,e]),e.async&&e.timeout>0&&(p=setTimeout(function(){u.abort("timeout")},e.timeout));try{r=1,o.send(l,v)}catch(y){status<2?v(-1,y):d.error(y)}}else v(-1,"No Transport");return u},param:function(a,c){var e=[],f=function(a,b){b=d.isFunction(b)?b():b,e[e.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=d.ajaxSettings.traditional);if(d.isArray(a)||a.jquery&&!d.isPlainObject(a))d.each(a,function(){f(this.name,this.value)});else for(var g in a)bO(g,a[g],c,f);return e.join("&").replace(bp,"+")}}),d.extend({active:0,lastModified:{},etag:{}});var bR=d.now(),bS=/(\=)\?(&|$)|()\?\?()/i;d.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return d.expando+"_"+bR++}}),d.ajaxPrefilter("json jsonp",function(b,c,e){var f=typeof b.data==="string";if(b.dataTypes[0]==="jsonp"||c.jsonpCallback||c.jsonp!=null||b.jsonp!==!1&&(bS.test(b.url)||f&&bS.test(b.data))){var g,h=b.jsonpCallback=d.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2",m=function(){a[h]=i,g&&d.isFunction(i)&&a[h](g[0])};b.jsonp!==!1&&(j=j.replace(bS,l),b.url===j&&(f&&(k=k.replace(bS,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),b.url=j,b.data=k,a[h]=function(a){g=[a]},e.then(m,m),b.converters["script json"]=function(){g||d.error(h+" was not called");return g[0]},b.dataTypes[0]="json";return"script"}}),d.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){d.globalEval(a);return a}}}),d.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),d.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){d&&d.onload(0,1)}}}});var bT=d.now(),bU,bV;d.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&bX()||bY()}:bX,bV=d.ajaxSettings.xhr(),d.support.ajax=!!bV,d.support.cors=bV&&"withCredentials"in bV,bV=b,d.support.ajax&&d.ajaxTransport(function(a){if(!a.crossDomain||d.support.cors){var c;return{send:function(e,f){var g=a.xhr(),h,i;a.username?g.open(a.type,a.url,a.async,a.username,a.password):g.open(a.type,a.url,a.async);if(a.xhrFields)for(i in a.xhrFields)g[i]=a.xhrFields[i];a.mimeType&&g.overrideMimeType&&g.overrideMimeType(a.mimeType),(!a.crossDomain||a.hasContent)&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(i in e)g.setRequestHeader(i,e[i])}catch(j){}g.send(a.hasContent&&a.data||null),c=function(e,i){var j,k,l,m,n;try{if(c&&(i||g.readyState===4)){c=b,h&&(g.onreadystatechange=d.noop,delete bU[h]);if(i)g.readyState!==4&&g.abort();else{j=g.status,l=g.getAllResponseHeaders(),m={},n=g.responseXML,n&&n.documentElement&&(m.xml=n),m.text=g.responseText;try{k=g.statusText}catch(o){k=""}j||!a.isLocal||a.crossDomain?j===1223&&(j=204):j=m.text?200:404}}}catch(p){i||f(-1,p)}m&&f(j,k,m,l)},a.async&&g.readyState!==4?(bU||(bU={},bW()),h=bT++,g.onreadystatechange=bU[h]=c):c()},abort:function(){c&&c(0,1)}}}});var bZ={},b$=/^(?:toggle|show|hide)$/,b_=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,ca,cb=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];d.fn.extend({show:function(a,b,c){var e,f;if(a||a===0)return this.animate(cc("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)e=this[g],f=e.style.display,!d._data(e,"olddisplay")&&f==="none"&&(f=e.style.display=""),f===""&&d.css(e,"display")==="none"&&d._data(e,"olddisplay",cd(e.nodeName));for(g=0;g<h;g++){e=this[g],f=e.style.display;if(f===""||f==="none")e.style.display=d._data(e,"olddisplay")||""}return this},hide:function(a,b,c){if(a||a===0)return this.animate(cc("hide",3),a,b,c);for(var e=0,f=this.length;e<f;e++){var g=d.css(this[e],"display");g!=="none"&&!d._data(this[e],"olddisplay")&&d._data(this[e],"olddisplay",g)}for(e=0;e<f;e++)this[e].style.display="none";return this},_toggle:d.fn.toggle,toggle:function(a,b,c){var e=typeof a==="boolean";d.isFunction(a)&&d.isFunction(b)?this._toggle.apply(this,arguments):a==null||e?this.each(function(){var b=e?a:d(this).is(":hidden");d(this)[b?"show":"hide"]()}):this.animate(cc("toggle",3),a,b,c);return this},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,e){var f=d.speed(b,c,e);if(d.isEmptyObject(a))return this.each(f.complete);return this[f.queue===!1?"each":"queue"](function(){var b=d.extend({},f),c,e=this.nodeType===1,g=e&&d(this).is(":hidden"),h=this;for(c in a){var i=d.camelCase(c);c!==i&&(a[i]=a[c],delete a[c],c=i);if(a[c]==="hide"&&g||a[c]==="show"&&!g)return b.complete.call(this);if(e&&(c==="height"||c==="width")){b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY];if(d.css(this,"display")==="inline"&&d.css(this,"float")==="none")if(d.support.inlineBlockNeedsLayout){var j=cd(this.nodeName);j==="inline"?this.style.display="inline-block":(this.style.display="inline",this.style.zoom=1)}else this.style.display="inline-block"}d.isArray(a[c])&&((b.specialEasing=b.specialEasing||{})[c]=a[c][1],a[c]=a[c][0])}b.overflow!=null&&(this.style.overflow="hidden"),b.curAnim=d.extend({},a),d.each(a,function(c,e){var f=new d.fx(h,b,c);if(b$.test(e))f[e==="toggle"?g?"show":"hide":e](a);else{var i=b_.exec(e),j=f.cur();if(i){var k=parseFloat(i[2]),l=i[3]||(d.cssNumber[c]?"":"px");l!=="px"&&(d.style(h,c,(k||1)+l),j=(k||1)/f.cur()*j,d.style(h,c,j+l)),i[1]&&(k=(i[1]==="-="?-1:1)*k+j),f.custom(j,k,l)}else f.custom(j,e,"")}});return!0})},stop:function(a,b){var c=d.timers;a&&this.queue([]),this.each(function(){for(var a=c.length-1;a>=0;a--)c[a].elem===this&&(b&&c[a](!0),c.splice(a,1))}),b||this.dequeue();return this}}),d.each({slideDown:cc("show",1),slideUp:cc("hide",1),slideToggle:cc("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){d.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),d.extend({speed:function(a,b,c){var e=a&&typeof a==="object"?d.extend({},a):{complete:c||!c&&b||d.isFunction(a)&&a,duration:a,easing:c&&b||b&&!d.isFunction(b)&&b};e.duration=d.fx.off?0:typeof e.duration==="number"?e.duration:e.duration in d.fx.speeds?d.fx.speeds[e.duration]:d.fx.speeds._default,e.old=e.complete,e.complete=function(){e.queue!==!1&&d(this).dequeue(),d.isFunction(e.old)&&e.old.call(this)};return e},easing:{linear:function(a,b,c,d){return c+d*a},swing:function(a,b,c,d){return(-Math.cos(a*Math.PI)/2+.5)*d+c}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,this.prop=c,b.orig||(b.orig={})}}),d.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(d.fx.step[this.prop]||d.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=d.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,b,c){function g(a){return e.step(a)}var e=this,f=d.fx;this.startTime=d.now(),this.start=a,this.end=b,this.unit=c||this.unit||(d.cssNumber[this.prop]?"":"px"),this.now=this.start,this.pos=this.state=0,g.elem=this.elem,g()&&d.timers.push(g)&&!ca&&(ca=setInterval(f.tick,f.interval))},show:function(){this.options.orig[this.prop]=d.style(this.elem,this.prop),this.options.show=!0,this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),d(this.elem).show()},hide:function(){this.options.orig[this.prop]=d.style(this.elem,this.prop),this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b=d.now(),c=!0;if(a||b>=this.options.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),this.options.curAnim[this.prop]=!0;for(var e in this.options.curAnim)this.options.curAnim[e]!==!0&&(c=!1);if(c){if(this.options.overflow!=null&&!d.support.shrinkWrapBlocks){var f=this.elem,g=this.options;d.each(["","X","Y"],function(a,b){f.style["overflow"+b]=g.overflow[a]})}this.options.hide&&d(this.elem).hide();if(this.options.hide||this.options.show)for(var h in this.options.curAnim)d.style(this.elem,h,this.options.orig[h]);this.options.complete.call(this.elem)}return!1}var i=b-this.startTime;this.state=i/this.options.duration;var j=this.options.specialEasing&&this.options.specialEasing[this.prop],k=this.options.easing||(d.easing.swing?"swing":"linear");this.pos=d.easing[j||k](this.state,i,0,1,this.options.duration),this.now=this.start+(this.end-this.start)*this.pos,this.update();return!0}},d.extend(d.fx,{tick:function(){var a=d.timers;for(var b=0;b<a.length;b++)a[b]()||a.splice(b--,1);a.length||d.fx.stop()},interval:13,stop:function(){clearInterval(ca),ca=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){d.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=(a.prop==="width"||a.prop==="height"?Math.max(0,a.now):a.now)+a.unit:a.elem[a.prop]=a.now}}}),d.expr&&d.expr.filters&&(d.expr.filters.animated=function(a){return d.grep(d.timers,function(b){return a===b.elem}).length});var ce=/^t(?:able|d|h)$/i,cf=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?d.fn.offset=function(a){var b=this[0],c;if(a)return this.each(function(b){d.offset.setOffset(this,a,b)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return d.offset.bodyOffset(b);try{c=b.getBoundingClientRect()}catch(e){}var f=b.ownerDocument,g=f.documentElement;if(!c||!d.contains(g,b))return c?{top:c.top,left:c.left}:{top:0,left:0};var h=f.body,i=cg(f),j=g.clientTop||h.clientTop||0,k=g.clientLeft||h.clientLeft||0,l=i.pageYOffset||d.support.boxModel&&g.scrollTop||h.scrollTop,m=i.pageXOffset||d.support.boxModel&&g.scrollLeft||h.scrollLeft,n=c.top+l-j,o=c.left+m-k;return{top:n,left:o}}:d.fn.offset=function(a){var b=this[0];if(a)return this.each(function(b){d.offset.setOffset(this,a,b)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return d.offset.bodyOffset(b);d.offset.initialize();var c,e=b.offsetParent,f=b,g=b.ownerDocument,h=g.documentElement,i=g.body,j=g.defaultView,k=j?j.getComputedStyle(b,null):b.currentStyle,l=b.offsetTop,m=b.offsetLeft;while((b=b.parentNode)&&b!==i&&b!==h){if(d.offset.supportsFixedPosition&&k.position==="fixed")break;c=j?j.getComputedStyle(b,null):b.currentStyle,l-=b.scrollTop,m-=b.scrollLeft,b===e&&(l+=b.offsetTop,m+=b.offsetLeft,d.offset.doesNotAddBorder&&(!d.offset.doesAddBorderForTableAndCells||!ce.test(b.nodeName))&&(l+=parseFloat(c.borderTopWidth)||0,m+=parseFloat(c.borderLeftWidth)||0),f=e,e=b.offsetParent),d.offset.subtractsBorderForOverflowNotVisible&&c.overflow!=="visible"&&(l+=parseFloat(c.borderTopWidth)||0,m+=parseFloat(c.borderLeftWidth)||0),k=c}if(k.position==="relative"||k.position==="static")l+=i.offsetTop,m+=i.offsetLeft;d.offset.supportsFixedPosition&&k.position==="fixed"&&(l+=Math.max(h.scrollTop,i.scrollTop),m+=Math.max(h.scrollLeft,i.scrollLeft));return{top:l,left:m}},d.offset={initialize:function(){var a=c.body,b=c.createElement("div"),e,f,g,h,i=parseFloat(d.css(a,"marginTop"))||0,j="<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";d.extend(b.style,{position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"}),b.innerHTML=j,a.insertBefore(b,a.firstChild),e=b.firstChild,f=e.firstChild,h=e.nextSibling.firstChild.firstChild,this.doesNotAddBorder=f.offsetTop!==5,this.doesAddBorderForTableAndCells=h.offsetTop===5,f.style.position="fixed",f.style.top="20px",this.supportsFixedPosition=f.offsetTop===20||f.offsetTop===15,f.style.position=f.style.top="",e.style.overflow="hidden",e.style.position="relative",this.subtractsBorderForOverflowNotVisible=f.offsetTop===-5,this.doesNotIncludeMarginInBodyOffset=a.offsetTop!==i,a.removeChild(b),a=b=e=f=g=h=null,d.offset.initialize=d.noop},bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;d.offset.initialize(),d.offset.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(d.css(a,"marginTop"))||0,c+=parseFloat(d.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var e=d.css(a,"position");e==="static"&&(a.style.position="relative");var f=d(a),g=f.offset(),h=d.css(a,"top"),i=d.css(a,"left"),j=e==="absolute"&&d.inArray("auto",[h,i])>-1,k={},l={},m,n;j&&(l=f.position()),m=j?l.top:parseInt(h,10)||0,n=j?l.left:parseInt(i,10)||0,d.isFunction(b)&&(b=b.call(a,c,g)),b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):f.css(k)}},d.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),e=cf.test(b[0].nodeName)?{top:0,left:0}:b.offset();c.top-=parseFloat(d.css(a,"marginTop"))||0,c.left-=parseFloat(d.css(a,"marginLeft"))||0,e.top+=parseFloat(d.css(b[0],"borderTopWidth"))||0,e.left+=parseFloat(d.css(b[0],"borderLeftWidth"))||0;return{top:c.top-e.top,left:c.left-e.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;while(a&&(!cf.test(a.nodeName)&&d.css(a,"position")==="static"))a=a.offsetParent;return a})}}),d.each(["Left","Top"],function(a,c){var e="scroll"+c;d.fn[e]=function(c){var f=this[0],g;if(!f)return null;if(c!==b)return this.each(function(){g=cg(this),g?g.scrollTo(a?d(g).scrollLeft():c,a?c:d(g).scrollTop()):this[e]=c});g=cg(f);return g?"pageXOffset"in g?g[a?"pageYOffset":"pageXOffset"]:d.support.boxModel&&g.document.documentElement[e]||g.document.body[e]:f[e]}}),d.each(["Height","Width"],function(a,c){var e=c.toLowerCase();d.fn["inner"+c]=function(){return this[0]?parseFloat(d.css(this[0],e,"padding")):null},d.fn["outer"+c]=function(a){return this[0]?parseFloat(d.css(this[0],e,a?"margin":"border")):null},d.fn[e]=function(a){var f=this[0];if(!f)return a==null?null:this;if(d.isFunction(a))return this.each(function(b){var c=d(this);c[e](a.call(this,b,c[e]()))});if(d.isWindow(f)){var g=f.document.documentElement["client"+c];return f.document.compatMode==="CSS1Compat"&&g||f.document.body["client"+c]||g}if(f.nodeType===9)return Math.max(f.documentElement["client"+c],f.body["scroll"+c],f.documentElement["scroll"+c],f.body["offset"+c],f.documentElement["offset"+c]);if(a===b){var h=d.css(f,e),i=parseFloat(h);return d.isNaN(i)?h:i}return this.css(e,typeof a==="string"?a:a+"px")}}),a.jQuery=a.$=d})(window);
define("lib/jquery/jquery-1.5.1.min", function(){});

/*global define, _ */

define('jqueryloader',['lib/jquery/jquery-1.5.1.min'], function (jquery) {
    

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


        var prefix = 'foxneod-0.7.6:';
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
    var buildTimestamp = '2013-08-08 01:08:38';
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
        debug.log('ready (build date: 2013-08-08 01:08:38)');

        _messageUnsupportedUsers();
    };
    ////////////////////////////////////////////////


    // Public API
    return {
        _init: init,
        buildDate: '2013-08-08 01:08:38',
        packageName: 'foxneod',
        version: '0.7.6',
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
            if (_.isUndefined(window.jQuery))
            {
                debug.log("jQuery didn't exist, so we're assigning it");
                window.jQuery = jquery;
            }

            window._ = _;
            debug.log('jQuery (internal) version after noConflict is', jquery().jquery);
            debug.log('jQuery (page) version after noConflict is', window.jQuery().jquery);
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