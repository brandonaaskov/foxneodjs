(function () {
/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
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

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

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

/**
 * @license
 * Lo-Dash 1.3.1 (Custom Build) lodash.com/license
 * Build: `lodash -o ./dist/lodash.compat.js`
 * Underscore.js 1.4.4 underscorejs.org/LICENSE
 */
;!function(n){function t(n,t,r){r=(r||0)-1;for(var e=n.length;++r<e;)if(n[r]===t)return r;return-1}function r(n,r){var e=typeof r;if(n=n.k,"boolean"==e||r==d)return n[r];"number"!=e&&"string"!=e&&(e="object");var u="number"==e?r:x+r;return n=n[e]||(n[e]={}),"object"==e?n[u]&&-1<t(n[u],r)?0:-1:n[u]?0:-1}function e(n){var t=this.k,r=typeof n;if("boolean"==r||n==d)t[n]=y;else{"number"!=r&&"string"!=r&&(r="object");var e="number"==r?n:x+n,u=t[r]||(t[r]={});"object"==r?(u[e]||(u[e]=[])).push(n)==this.b.length&&(t[r]=b):u[e]=y
}}function u(n){return n.charCodeAt(0)}function a(n,t){var r=n.m,e=t.m;if(n=n.l,t=t.l,n!==t){if(n>t||typeof n=="undefined")return 1;if(n<t||typeof t=="undefined")return-1}return r<e?-1:1}function o(n){var t=-1,r=n.length,u=c();u["false"]=u["null"]=u["true"]=u.undefined=b;var a=c();for(a.b=n,a.k=u,a.push=e;++t<r;)a.push(n[t]);return u.object===false?(g(a),d):a}function i(n){return"\\"+tt[n]}function l(){return _.pop()||[]}function c(){return C.pop()||{a:"",b:d,c:"",k:d,l:d,"false":b,d:"",m:0,e:"",leading:b,f:"",maxWait:0,"null":b,number:d,object:d,push:d,g:d,string:d,h:"",trailing:b,"true":b,undefined:b,i:b,j:b,n:d}
}function f(n){return typeof n.toString!="function"&&typeof(n+"")=="string"}function p(){}function s(n){n.length=0,_.length<E&&_.push(n)}function g(n){var t=n.k;t&&g(t),n.b=n.k=n.l=n.object=n.number=n.string=n.n=d,C.length<E&&C.push(n)}function v(n,t,r){t||(t=0),typeof r=="undefined"&&(r=n?n.length:0);var e=-1;r=r-t||0;for(var u=Array(0>r?0:r);++e<r;)u[e]=n[t+e];return u}function h(e){function _(n){return n&&typeof n=="object"&&!qr(n)&&sr.call(n,"__wrapped__")?n:new C(n)}function C(n){this.__wrapped__=n
}function E(n,t,r,e){function u(){var e=arguments,c=o?this:t;return a||(n=t[i]),r.length&&(e=e.length?(e=Sr.call(e),l?e.concat(r):r.concat(e)):r),this instanceof u?(c=rt(n.prototype),e=n.apply(c,e),mt(e)?e:c):n.apply(c,e)}var a=ht(n),o=!r,i=t;if(o){var l=e;r=t}else if(!a){if(!e)throw new Zt;t=n}return u}function tt(){var n=c();n.g=L,n.b=n.c=n.f=n.h="",n.e="r",n.i=y,n.j=!!Rr;for(var t,r=0;t=arguments[r];r++)for(var e in t)n[e]=t[e];r=n.a,n.d=/^[^,]+/.exec(r)[0],t=Mt,r="return function("+r+"){",e="var m,r="+n.d+",C="+n.e+";if(!r)return C;"+n.h+";",n.b?(e+="var s=r.length;m=-1;if("+n.b+"){",Pr.unindexedChars&&(e+="if(q(r)){r=r.split('')}"),e+="while(++m<s){"+n.f+";}}else{"):Pr.nonEnumArgs&&(e+="var s=r.length;m=-1;if(s&&n(r)){while(++m<s){m+='';"+n.f+";}}else{"),Pr.enumPrototypes&&(e+="var E=typeof r=='function';"),Pr.enumErrorProps&&(e+="var D=r===j||r instanceof Error;");
var u=[];if(Pr.enumPrototypes&&u.push('!(E&&m=="prototype")'),Pr.enumErrorProps&&u.push('!(D&&(m=="message"||m=="name"))'),n.i&&n.j)e+="var A=-1,B=z[typeof r]&&t(r),s=B?B.length:0;while(++A<s){m=B[A];",u.length&&(e+="if("+u.join("&&")+"){"),e+=n.f+";",u.length&&(e+="}"),e+="}";else if(e+="for(m in r){",n.i&&u.push("l.call(r, m)"),u.length&&(e+="if("+u.join("&&")+"){"),e+=n.f+";",u.length&&(e+="}"),e+="}",Pr.nonEnumShadows){for(e+="if(r!==y){var h=r.constructor,p=r===(h&&h.prototype),e=r===H?G:r===j?i:J.call(r),v=w[e];",k=0;7>k;k++)e+="m='"+n.g[k]+"';if((!(p&&v[m])&&l.call(r,m))",n.i||(e+="||(!v[m]&&r[m]!==y[m])"),e+="){"+n.f+"}";
e+="}"}return(n.b||Pr.nonEnumArgs)&&(e+="}"),e+=n.c+";return C",t=t("i,j,l,n,o,q,t,u,y,z,w,G,H,J",r+e+"}"),g(n),t(M,tr,sr,ft,qr,dt,Rr,_,rr,nt,Nr,Y,er,yr)}function rt(n){return mt(n)?br(n):{}}function ut(n){return Wr[n]}function ot(){var n=(n=_.indexOf)===Pt?t:n;return n}function it(n){return function(t,r,e,u){return typeof r!="boolean"&&r!=d&&(u=e,e=u&&u[r]===t?m:r,r=b),e!=d&&(e=_.createCallback(e,u)),n(t,r,e,u)}}function lt(n){var t,r;return!n||yr.call(n)!=Q||(t=n.constructor,ht(t)&&!(t instanceof t))||!Pr.argsClass&&ft(n)||!Pr.nodeClass&&f(n)?b:Pr.ownLast?(Jr(n,function(n,t,e){return r=sr.call(e,t),b
}),r!==false):(Jr(n,function(n,t){r=t}),r===m||sr.call(n,r))}function ct(n){return Lr[n]}function ft(n){return yr.call(n)==G}function pt(n,t,r,e,u,a){var o=n;if(typeof t!="boolean"&&t!=d&&(e=r,r=t,t=b),typeof r=="function"){if(r=typeof e=="undefined"?r:_.createCallback(r,e,1),o=r(o),typeof o!="undefined")return o;o=n}if(e=mt(o)){var i=yr.call(o);if(!Z[i]||!Pr.nodeClass&&f(o))return o;var c=qr(o)}if(!e||!t)return e?c?v(o):Gr({},o):o;switch(e=Br[i],i){case J:case K:return new e(+o);case V:case Y:return new e(o);
case X:return e(o.source,P.exec(o))}i=!u,u||(u=l()),a||(a=l());for(var p=u.length;p--;)if(u[p]==n)return a[p];return o=c?e(o.length):{},c&&(sr.call(n,"index")&&(o.index=n.index),sr.call(n,"input")&&(o.input=n.input)),u.push(n),a.push(o),(c?Tr:Kr)(n,function(n,e){o[e]=pt(n,t,r,m,u,a)}),i&&(s(u),s(a)),o}function st(n){var t=[];return Jr(n,function(n,r){ht(n)&&t.push(r)}),t.sort()}function gt(n){for(var t=-1,r=Rr(n),e=r.length,u={};++t<e;){var a=r[t];u[n[a]]=a}return u}function vt(n,t,r,e,u,a){var o=r===w;
if(typeof r=="function"&&!o){r=_.createCallback(r,e,2);var i=r(n,t);if(typeof i!="undefined")return!!i}if(n===t)return 0!==n||1/n==1/t;var c=typeof n,p=typeof t;if(n===n&&(!n||"function"!=c&&"object"!=c)&&(!t||"function"!=p&&"object"!=p))return b;if(n==d||t==d)return n===t;if(p=yr.call(n),c=yr.call(t),p==G&&(p=Q),c==G&&(c=Q),p!=c)return b;switch(p){case J:case K:return+n==+t;case V:return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case X:case Y:return n==Yt(t)}if(c=p==H,!c){if(sr.call(n,"__wrapped__")||sr.call(t,"__wrapped__"))return vt(n.__wrapped__||n,t.__wrapped__||t,r,e,u,a);
if(p!=Q||!Pr.nodeClass&&(f(n)||f(t)))return b;var p=!Pr.argsObject&&ft(n)?Qt:n.constructor,g=!Pr.argsObject&&ft(t)?Qt:t.constructor;if(p!=g&&(!ht(p)||!(p instanceof p&&ht(g)&&g instanceof g)))return b}for(g=!u,u||(u=l()),a||(a=l()),p=u.length;p--;)if(u[p]==n)return a[p]==t;var v=0,i=y;if(u.push(n),a.push(t),c){if(p=n.length,v=t.length,i=v==n.length,!i&&!o)return i;for(;v--;)if(c=p,g=t[v],o)for(;c--&&!(i=vt(n[c],g,r,e,u,a)););else if(!(i=vt(n[v],g,r,e,u,a)))break;return i}return Jr(t,function(t,o,l){return sr.call(l,o)?(v++,i=sr.call(n,o)&&vt(n[o],t,r,e,u,a)):void 0
}),i&&!o&&Jr(n,function(n,t,r){return sr.call(r,t)?i=-1<--v:void 0}),g&&(s(u),s(a)),i}function ht(n){return typeof n=="function"}function mt(n){return!(!n||!nt[typeof n])}function yt(n){return typeof n=="number"||yr.call(n)==V}function dt(n){return typeof n=="string"||yr.call(n)==Y}function bt(n,t,r){var e=arguments,u=0,a=2;if(!mt(n))return n;if(r===w)var o=e[3],i=e[4],c=e[5];else{var f=y,i=l(),c=l();typeof r!="number"&&(a=e.length),3<a&&"function"==typeof e[a-2]?o=_.createCallback(e[--a-1],e[a--],2):2<a&&"function"==typeof e[a-1]&&(o=e[--a])
}for(;++u<a;)(qr(e[u])?xt:Kr)(e[u],function(t,r){var e,u,a=t,l=n[r];if(t&&((u=qr(t))||Mr(t))){for(a=i.length;a--;)if(e=i[a]==t){l=c[a];break}if(!e){var f;o&&(a=o(l,t),f=typeof a!="undefined")&&(l=a),f||(l=u?qr(l)?l:[]:Mr(l)?l:{}),i.push(t),c.push(l),f||(l=bt(l,t,w,o,i,c))}}else o&&(a=o(l,t),typeof a=="undefined"&&(a=t)),typeof a!="undefined"&&(l=a);n[r]=l});return f&&(s(i),s(c)),n}function _t(n){for(var t=-1,r=Rr(n),e=r.length,u=Ht(e);++t<e;)u[t]=n[r[t]];return u}function Ct(n,t,r){var e=-1,u=ot(),a=n?n.length:0,o=b;
return r=(0>r?kr(0,a+r):r)||0,a&&typeof a=="number"?o=-1<(dt(n)?n.indexOf(t,r):u(n,t,r)):Tr(n,function(n){return++e<r?void 0:!(o=n===t)}),o}function jt(n,t,r){var e=y;if(t=_.createCallback(t,r),qr(n)){r=-1;for(var u=n.length;++r<u&&(e=!!t(n[r],r,n)););}else Tr(n,function(n,r,u){return e=!!t(n,r,u)});return e}function wt(n,t,r){var e=[];if(t=_.createCallback(t,r),qr(n)){r=-1;for(var u=n.length;++r<u;){var a=n[r];t(a,r,n)&&e.push(a)}}else Tr(n,function(n,r,u){t(n,r,u)&&e.push(n)});return e}function kt(n,t,r){if(t=_.createCallback(t,r),!qr(n)){var e;
return Tr(n,function(n,r,u){return t(n,r,u)?(e=n,b):void 0}),e}r=-1;for(var u=n.length;++r<u;){var a=n[r];if(t(a,r,n))return a}}function xt(n,t,r){if(t&&typeof r=="undefined"&&qr(n)){r=-1;for(var e=n.length;++r<e&&t(n[r],r,n)!==false;);}else Tr(n,t,r);return n}function Ot(n,t,r){var e=-1,u=n?n.length:0,a=Ht(typeof u=="number"?u:0);if(t=_.createCallback(t,r),qr(n))for(;++e<u;)a[e]=t(n[e],e,n);else Tr(n,function(n,r,u){a[++e]=t(n,r,u)});return a}function Et(n,t,r){var e=-1/0,a=e;if(!t&&qr(n)){r=-1;for(var o=n.length;++r<o;){var i=n[r];
i>a&&(a=i)}}else t=!t&&dt(n)?u:_.createCallback(t,r),Tr(n,function(n,r,u){r=t(n,r,u),r>e&&(e=r,a=n)});return a}function St(n,t,r,e){var u=3>arguments.length;if(t=_.createCallback(t,e,4),qr(n)){var a=-1,o=n.length;for(u&&(r=n[++a]);++a<o;)r=t(r,n[a],a,n)}else Tr(n,function(n,e,a){r=u?(u=b,n):t(r,n,e,a)});return r}function At(n,t,r,e){var u=n,a=n?n.length:0,o=3>arguments.length;if(typeof a!="number")var i=Rr(n),a=i.length;else Pr.unindexedChars&&dt(n)&&(u=n.split(""));return t=_.createCallback(t,e,4),xt(n,function(n,e,l){e=i?i[--a]:--a,r=o?(o=b,u[e]):t(r,u[e],e,l)
}),r}function It(n,t,r){var e;if(t=_.createCallback(t,r),qr(n)){r=-1;for(var u=n.length;++r<u&&!(e=t(n[r],r,n)););}else Tr(n,function(n,r,u){return!(e=t(n,r,u))});return!!e}function Bt(n){var e=-1,u=ot(),a=n?n.length:0,i=lr.apply(nr,Sr.call(arguments,1)),l=[],c=a>=O&&u===t;if(c){var f=o(i);f?(u=r,i=f):c=b}for(;++e<a;)f=n[e],0>u(i,f)&&l.push(f);return c&&g(i),l}function Nt(n,t,r){if(n){var e=0,u=n.length;if(typeof t!="number"&&t!=d){var a=-1;for(t=_.createCallback(t,r);++a<u&&t(n[a],a,n);)e++}else if(e=t,e==d||r)return n[0];
return v(n,0,xr(kr(0,e),u))}}function Pt(n,r,e){if(typeof e=="number"){var u=n?n.length:0;e=0>e?kr(0,u+e):e||0}else if(e)return e=Ft(n,r),n[e]===r?e:-1;return n?t(n,r,e):-1}function zt(n,t,r){if(typeof t!="number"&&t!=d){var e=0,u=-1,a=n?n.length:0;for(t=_.createCallback(t,r);++u<a&&t(n[u],u,n);)e++}else e=t==d||r?1:kr(0,t);return v(n,e)}function Ft(n,t,r,e){var u=0,a=n?n.length:u;for(r=r?_.createCallback(r,e,1):Wt,t=r(t);u<a;)e=u+a>>>1,r(n[e])<t?u=e+1:a=e;return u}function $t(n){for(var t=-1,r=n?Et(Ur(n,"length")):0,e=Ht(0>r?0:r);++t<r;)e[t]=Ur(n,t);
return e}function qt(n,t){for(var r=-1,e=n?n.length:0,u={};++r<e;){var a=n[r];t?u[a]=t[r]:u[a[0]]=a[1]}return u}function Dt(n,t){return Pr.fastBind||dr&&2<arguments.length?dr.call.apply(dr,arguments):E(n,t,Sr.call(arguments,2))}function Rt(n,t,r){function e(){ir(s),ir(g),c=0,s=g=d}function u(){var t=v&&(!h||1<c);e(),t&&(p!==false&&(f=new Kt),i=n.apply(l,o))}function a(){e(),(v||p!==t)&&(f=new Kt,i=n.apply(l,o))}var o,i,l,c=0,f=0,p=b,s=d,g=d,v=y;if(t=kr(0,t||0),r===y)var h=y,v=b;else mt(r)&&(h=r.leading,p="maxWait"in r&&kr(t,r.maxWait||0),v="trailing"in r?r.trailing:v);
return function(){if(o=arguments,l=this,c++,ir(g),p===false)h&&2>c&&(i=n.apply(l,o));else{var r=new Kt;!s&&!h&&(f=r);var e=p-(r-f);0<e?s||(s=mr(a,e)):(ir(s),s=d,f=r,i=n.apply(l,o))}return t!==p&&(g=mr(u,t)),i}}function Tt(n){var t=Sr.call(arguments,1);return mr(function(){n.apply(m,t)},1)}function Wt(n){return n}function Lt(n){xt(st(n),function(t){var r=_[t]=n[t];_.prototype[t]=function(){var n=this.__wrapped__,t=[n];return gr.apply(t,arguments),t=r.apply(_,t),n&&typeof n=="object"&&n===t?this:new C(t)
}})}function Gt(){return this.__wrapped__}e=e?at.defaults(n.Object(),e,at.pick(n,W)):n;var Ht=e.Array,Jt=e.Boolean,Kt=e.Date,Mt=e.Function,Ut=e.Math,Vt=e.Number,Qt=e.Object,Xt=e.RegExp,Yt=e.String,Zt=e.TypeError,nr=[],tr=e.Error.prototype,rr=Qt.prototype,er=Yt.prototype,ur=e._,ar=Xt("^"+Yt(rr.valueOf).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/valueOf|for [^\]]+/g,".+?")+"$"),or=Ut.ceil,ir=e.clearTimeout,lr=nr.concat,cr=Ut.floor,fr=Mt.prototype.toString,pr=ar.test(pr=Qt.getPrototypeOf)&&pr,sr=rr.hasOwnProperty,gr=nr.push,vr=rr.propertyIsEnumerable,hr=e.setImmediate,mr=e.setTimeout,yr=rr.toString,dr=ar.test(dr=yr.bind)&&dr,br=ar.test(br=Qt.create)&&br,_r=ar.test(_r=Ht.isArray)&&_r,Cr=e.isFinite,jr=e.isNaN,wr=ar.test(wr=Qt.keys)&&wr,kr=Ut.max,xr=Ut.min,Or=e.parseInt,Er=Ut.random,Sr=nr.slice,Ar=ar.test(e.attachEvent),Ir=dr&&!/\n|true/.test(dr+Ar),Br={};
Br[H]=Ht,Br[J]=Jt,Br[K]=Kt,Br[U]=Mt,Br[Q]=Qt,Br[V]=Vt,Br[X]=Xt,Br[Y]=Yt;var Nr={};Nr[H]=Nr[K]=Nr[V]={constructor:y,toLocaleString:y,toString:y,valueOf:y},Nr[J]=Nr[Y]={constructor:y,toString:y,valueOf:y},Nr[M]=Nr[U]=Nr[X]={constructor:y,toString:y},Nr[Q]={constructor:y},function(){for(var n=L.length;n--;){var t,r=L[n];for(t in Nr)sr.call(Nr,t)&&!sr.call(Nr[t],r)&&(Nr[t][r]=b)}}(),C.prototype=_.prototype;var Pr=_.support={};!function(){function n(){this.x=1}var t={0:1,length:1},r=[];n.prototype={valueOf:1};
for(var e in new n)r.push(e);for(e in arguments);Pr.argsObject=arguments.constructor==Qt&&!(arguments instanceof Ht),Pr.argsClass=ft(arguments),Pr.enumErrorProps=vr.call(tr,"message")||vr.call(tr,"name"),Pr.enumPrototypes=vr.call(n,"prototype"),Pr.fastBind=dr&&!Ir,Pr.ownLast="x"!=r[0],Pr.nonEnumArgs=0!=e,Pr.nonEnumShadows=!/valueOf/.test(r),Pr.spliceObjects=(nr.splice.call(t,0,1),!t[0]),Pr.unindexedChars="xx"!="x"[0]+Qt("x")[0];try{Pr.nodeClass=!(yr.call(document)==Q&&!({toString:0}+""))}catch(u){Pr.nodeClass=y
}}(1),_.templateSettings={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:z,variable:"",imports:{_:_}};var zr={a:"x,F,k",h:"var a=arguments,b=0,c=typeof k=='number'?2:a.length;while(++b<c){r=a[b];if(r&&z[typeof r]){",f:"if(typeof C[m]=='undefined')C[m]=r[m]",c:"}}"},Fr={a:"f,d,I",h:"d=d&&typeof I=='undefined'?d:u.createCallback(d,I)",b:"typeof s=='number'",f:"if(d(r[m],m,f)===false)return C"},$r={h:"if(!z[typeof r])return C;"+Fr.h,b:b};br||(rt=function(n){if(mt(n)){p.prototype=n;
var t=new p;p.prototype=d}return t||{}}),Pr.argsClass||(ft=function(n){return n?sr.call(n,"callee"):b});var qr=_r||function(n){return n?typeof n=="object"&&yr.call(n)==H:b},Dr=tt({a:"x",e:"[]",h:"if(!(z[typeof x]))return C",f:"C.push(m)"}),Rr=wr?function(n){return mt(n)?Pr.enumPrototypes&&typeof n=="function"||Pr.nonEnumArgs&&n.length&&ft(n)?Dr(n):wr(n):[]}:Dr,Tr=tt(Fr),Wr={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},Lr=gt(Wr),Gr=tt(zr,{h:zr.h.replace(";",";if(c>3&&typeof a[c-2]=='function'){var d=u.createCallback(a[--c-1],a[c--],2)}else if(c>2&&typeof a[c-1]=='function'){d=a[--c]}"),f:"C[m]=d?d(C[m],r[m]):r[m]"}),Hr=tt(zr),Jr=tt(Fr,$r,{i:b}),Kr=tt(Fr,$r);
ht(/x/)&&(ht=function(n){return typeof n=="function"&&yr.call(n)==U});var Mr=pr?function(n){if(!n||yr.call(n)!=Q||!Pr.argsClass&&ft(n))return b;var t=n.valueOf,r=typeof t=="function"&&(r=pr(t))&&pr(r);return r?n==r||pr(n)==r:lt(n)}:lt,Ur=Ot,Vr=it(function Yr(n,t,r){for(var e=-1,u=n?n.length:0,a=[];++e<u;){var o=n[e];r&&(o=r(o,e,n)),qr(o)?gr.apply(a,t?o:Yr(o)):a.push(o)}return a}),Qr=it(function(n,e,u){var a=-1,i=ot(),c=n?n.length:0,f=[],p=!e&&c>=O&&i===t,v=u||p?l():f;if(p){var h=o(v);h?(i=r,v=h):(p=b,v=u?v:(s(v),f))
}for(;++a<c;){var h=n[a],m=u?u(h,a,n):h;(e?!a||v[v.length-1]!==m:0>i(v,m))&&((u||p)&&v.push(m),f.push(h))}return p?(s(v.b),g(v)):u&&s(v),f});Ir&&et&&typeof hr=="function"&&(Tt=Dt(hr,e));var Xr=8==Or($+"08")?Or:function(n,t){return Or(dt(n)?n.replace(q,""):n,t||0)};return _.after=function(n,t){return 1>n?t():function(){return 1>--n?t.apply(this,arguments):void 0}},_.assign=Gr,_.at=function(n){var t=-1,r=lr.apply(nr,Sr.call(arguments,1)),e=r.length,u=Ht(e);for(Pr.unindexedChars&&dt(n)&&(n=n.split(""));++t<e;)u[t]=n[r[t]];
return u},_.bind=Dt,_.bindAll=function(n){for(var t=1<arguments.length?lr.apply(nr,Sr.call(arguments,1)):st(n),r=-1,e=t.length;++r<e;){var u=t[r];n[u]=Dt(n[u],n)}return n},_.bindKey=function(n,t){return E(n,t,Sr.call(arguments,2),w)},_.compact=function(n){for(var t=-1,r=n?n.length:0,e=[];++t<r;){var u=n[t];u&&e.push(u)}return e},_.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length;r--;)t=[n[r].apply(this,t)];return t[0]}},_.countBy=function(n,t,r){var e={};return t=_.createCallback(t,r),xt(n,function(n,r,u){r=Yt(t(n,r,u)),sr.call(e,r)?e[r]++:e[r]=1
}),e},_.createCallback=function(n,t,r){if(n==d)return Wt;var e=typeof n;if("function"!=e){if("object"!=e)return function(t){return t[n]};var u=Rr(n);return function(t){for(var r=u.length,e=b;r--&&(e=vt(t[u[r]],n[u[r]],w)););return e}}return typeof t=="undefined"||F&&!F.test(fr.call(n))?n:1===r?function(r){return n.call(t,r)}:2===r?function(r,e){return n.call(t,r,e)}:4===r?function(r,e,u,a){return n.call(t,r,e,u,a)}:function(r,e,u){return n.call(t,r,e,u)}},_.debounce=Rt,_.defaults=Hr,_.defer=Tt,_.delay=function(n,t){var r=Sr.call(arguments,2);
return mr(function(){n.apply(m,r)},t)},_.difference=Bt,_.filter=wt,_.flatten=Vr,_.forEach=xt,_.forIn=Jr,_.forOwn=Kr,_.functions=st,_.groupBy=function(n,t,r){var e={};return t=_.createCallback(t,r),xt(n,function(n,r,u){r=Yt(t(n,r,u)),(sr.call(e,r)?e[r]:e[r]=[]).push(n)}),e},_.initial=function(n,t,r){if(!n)return[];var e=0,u=n.length;if(typeof t!="number"&&t!=d){var a=u;for(t=_.createCallback(t,r);a--&&t(n[a],a,n);)e++}else e=t==d||r?1:t||e;return v(n,0,xr(kr(0,u-e),u))},_.intersection=function(n){for(var e=arguments,u=e.length,a=-1,i=l(),c=-1,f=ot(),p=n?n.length:0,v=[],h=l();++a<u;){var m=e[a];
i[a]=f===t&&(m?m.length:0)>=O&&o(a?e[a]:h)}n:for(;++c<p;){var y=i[0],m=n[c];if(0>(y?r(y,m):f(h,m))){for(a=u,(y||h).push(m);--a;)if(y=i[a],0>(y?r(y,m):f(e[a],m)))continue n;v.push(m)}}for(;u--;)(y=i[u])&&g(y);return s(i),s(h),v},_.invert=gt,_.invoke=function(n,t){var r=Sr.call(arguments,2),e=-1,u=typeof t=="function",a=n?n.length:0,o=Ht(typeof a=="number"?a:0);return xt(n,function(n){o[++e]=(u?t:n[t]).apply(n,r)}),o},_.keys=Rr,_.map=Ot,_.max=Et,_.memoize=function(n,t){function r(){var e=r.cache,u=x+(t?t.apply(this,arguments):arguments[0]);
return sr.call(e,u)?e[u]:e[u]=n.apply(this,arguments)}return r.cache={},r},_.merge=bt,_.min=function(n,t,r){var e=1/0,a=e;if(!t&&qr(n)){r=-1;for(var o=n.length;++r<o;){var i=n[r];i<a&&(a=i)}}else t=!t&&dt(n)?u:_.createCallback(t,r),Tr(n,function(n,r,u){r=t(n,r,u),r<e&&(e=r,a=n)});return a},_.omit=function(n,t,r){var e=ot(),u=typeof t=="function",a={};if(u)t=_.createCallback(t,r);else var o=lr.apply(nr,Sr.call(arguments,1));return Jr(n,function(n,r,i){(u?!t(n,r,i):0>e(o,r))&&(a[r]=n)}),a},_.once=function(n){var t,r;
return function(){return t?r:(t=y,r=n.apply(this,arguments),n=d,r)}},_.pairs=function(n){for(var t=-1,r=Rr(n),e=r.length,u=Ht(e);++t<e;){var a=r[t];u[t]=[a,n[a]]}return u},_.partial=function(n){return E(n,Sr.call(arguments,1))},_.partialRight=function(n){return E(n,Sr.call(arguments,1),d,w)},_.pick=function(n,t,r){var e={};if(typeof t!="function")for(var u=-1,a=lr.apply(nr,Sr.call(arguments,1)),o=mt(n)?a.length:0;++u<o;){var i=a[u];i in n&&(e[i]=n[i])}else t=_.createCallback(t,r),Jr(n,function(n,r,u){t(n,r,u)&&(e[r]=n)
});return e},_.pluck=Ur,_.range=function(n,t,r){n=+n||0,r=+r||1,t==d&&(t=n,n=0);var e=-1;t=kr(0,or((t-n)/r));for(var u=Ht(t);++e<t;)u[e]=n,n+=r;return u},_.reject=function(n,t,r){return t=_.createCallback(t,r),wt(n,function(n,r,e){return!t(n,r,e)})},_.rest=zt,_.shuffle=function(n){var t=-1,r=n?n.length:0,e=Ht(typeof r=="number"?r:0);return xt(n,function(n){var r=cr(Er()*(++t+1));e[t]=e[r],e[r]=n}),e},_.sortBy=function(n,t,r){var e=-1,u=n?n.length:0,o=Ht(typeof u=="number"?u:0);for(t=_.createCallback(t,r),xt(n,function(n,r,u){var a=o[++e]=c();
a.l=t(n,r,u),a.m=e,a.n=n}),u=o.length,o.sort(a);u--;)n=o[u],o[u]=n.n,g(n);return o},_.tap=function(n,t){return t(n),n},_.throttle=function(n,t,r){var e=y,u=y;return r===false?e=b:mt(r)&&(e="leading"in r?r.leading:e,u="trailing"in r?r.trailing:u),r=c(),r.leading=e,r.maxWait=t,r.trailing=u,n=Rt(n,t,r),g(r),n},_.times=function(n,t,r){n=-1<(n=+n)?n:0;var e=-1,u=Ht(n);for(t=_.createCallback(t,r,1);++e<n;)u[e]=t(e);return u},_.toArray=function(n){return n&&typeof n.length=="number"?Pr.unindexedChars&&dt(n)?n.split(""):v(n):_t(n)
},_.transform=function(n,t,r,e){var u=qr(n);return t=_.createCallback(t,e,4),r==d&&(u?r=[]:(e=n&&n.constructor,r=rt(e&&e.prototype))),(u?Tr:Kr)(n,function(n,e,u){return t(r,n,e,u)}),r},_.union=function(n){return qr(n)||(arguments[0]=n?Sr.call(n):nr),Qr(lr.apply(nr,arguments))},_.uniq=Qr,_.unzip=$t,_.values=_t,_.where=wt,_.without=function(n){return Bt(n,Sr.call(arguments,1))},_.wrap=function(n,t){return function(){var r=[n];return gr.apply(r,arguments),t.apply(this,r)}},_.zip=function(n){return n?$t(arguments):[]
},_.zipObject=qt,_.collect=Ot,_.drop=zt,_.each=xt,_.extend=Gr,_.methods=st,_.object=qt,_.select=wt,_.tail=zt,_.unique=Qr,Lt(_),_.chain=_,_.prototype.chain=function(){return this},_.clone=pt,_.cloneDeep=function(n,t,r){return pt(n,y,t,r)},_.contains=Ct,_.escape=function(n){return n==d?"":Yt(n).replace(R,ut)},_.every=jt,_.find=kt,_.findIndex=function(n,t,r){var e=-1,u=n?n.length:0;for(t=_.createCallback(t,r);++e<u;)if(t(n[e],e,n))return e;return-1},_.findKey=function(n,t,r){var e;return t=_.createCallback(t,r),Kr(n,function(n,r,u){return t(n,r,u)?(e=r,b):void 0
}),e},_.has=function(n,t){return n?sr.call(n,t):b},_.identity=Wt,_.indexOf=Pt,_.isArguments=ft,_.isArray=qr,_.isBoolean=function(n){return n===y||n===false||yr.call(n)==J},_.isDate=function(n){return n?typeof n=="object"&&yr.call(n)==K:b},_.isElement=function(n){return n?1===n.nodeType:b},_.isEmpty=function(n){var t=y;if(!n)return t;var r=yr.call(n),e=n.length;return r==H||r==Y||(Pr.argsClass?r==G:ft(n))||r==Q&&typeof e=="number"&&ht(n.splice)?!e:(Kr(n,function(){return t=b}),t)},_.isEqual=vt,_.isFinite=function(n){return Cr(n)&&!jr(parseFloat(n))
},_.isFunction=ht,_.isNaN=function(n){return yt(n)&&n!=+n},_.isNull=function(n){return n===d},_.isNumber=yt,_.isObject=mt,_.isPlainObject=Mr,_.isRegExp=function(n){return!(!n||!nt[typeof n])&&yr.call(n)==X},_.isString=dt,_.isUndefined=function(n){return typeof n=="undefined"},_.lastIndexOf=function(n,t,r){var e=n?n.length:0;for(typeof r=="number"&&(e=(0>r?kr(0,e+r):xr(r,e-1))+1);e--;)if(n[e]===t)return e;return-1},_.mixin=Lt,_.noConflict=function(){return e._=ur,this},_.parseInt=Xr,_.random=function(n,t){n==d&&t==d&&(t=1),n=+n||0,t==d?(t=n,n=0):t=+t||0;
var r=Er();return n%1||t%1?n+xr(r*(t-n+parseFloat("1e-"+((r+"").length-1))),t):n+cr(r*(t-n+1))},_.reduce=St,_.reduceRight=At,_.result=function(n,t){var r=n?n[t]:m;return ht(r)?n[t]():r},_.runInContext=h,_.size=function(n){var t=n?n.length:0;return typeof t=="number"?t:Rr(n).length},_.some=It,_.sortedIndex=Ft,_.template=function(n,t,r){var e=_.templateSettings;n||(n=""),r=Hr({},r,e);var u,a=Hr({},r.imports,e.imports),e=Rr(a),a=_t(a),o=0,l=r.interpolate||D,c="__p+='",l=Xt((r.escape||D).source+"|"+l.source+"|"+(l===z?N:D).source+"|"+(r.evaluate||D).source+"|$","g");
n.replace(l,function(t,r,e,a,l,f){return e||(e=a),c+=n.slice(o,f).replace(T,i),r&&(c+="'+__e("+r+")+'"),l&&(u=y,c+="';"+l+";__p+='"),e&&(c+="'+((__t=("+e+"))==null?'':__t)+'"),o=f+t.length,t}),c+="';\n",l=r=r.variable,l||(r="obj",c="with("+r+"){"+c+"}"),c=(u?c.replace(S,""):c).replace(A,"$1").replace(I,"$1;"),c="function("+r+"){"+(l?"":r+"||("+r+"={});")+"var __t,__p='',__e=_.escape"+(u?",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}":";")+c+"return __p}";try{var f=Mt(e,"return "+c).apply(m,a)
}catch(p){throw p.source=c,p}return t?f(t):(f.source=c,f)},_.unescape=function(n){return n==d?"":Yt(n).replace(B,ct)},_.uniqueId=function(n){var t=++j;return Yt(n==d?"":n)+t},_.all=jt,_.any=It,_.detect=kt,_.findWhere=kt,_.foldl=St,_.foldr=At,_.include=Ct,_.inject=St,Kr(_,function(n,t){_.prototype[t]||(_.prototype[t]=function(){var t=[this.__wrapped__];return gr.apply(t,arguments),n.apply(_,t)})}),_.first=Nt,_.last=function(n,t,r){if(n){var e=0,u=n.length;if(typeof t!="number"&&t!=d){var a=u;for(t=_.createCallback(t,r);a--&&t(n[a],a,n);)e++
}else if(e=t,e==d||r)return n[u-1];return v(n,kr(0,u-e))}},_.take=Nt,_.head=Nt,Kr(_,function(n,t){_.prototype[t]||(_.prototype[t]=function(t,r){var e=n(this.__wrapped__,t,r);return t==d||r&&typeof t!="function"?e:new C(e)})}),_.VERSION="1.3.1",_.prototype.toString=function(){return Yt(this.__wrapped__)},_.prototype.value=Gt,_.prototype.valueOf=Gt,Tr(["join","pop","shift"],function(n){var t=nr[n];_.prototype[n]=function(){return t.apply(this.__wrapped__,arguments)}}),Tr(["push","reverse","sort","unshift"],function(n){var t=nr[n];
_.prototype[n]=function(){return t.apply(this.__wrapped__,arguments),this}}),Tr(["concat","slice","splice"],function(n){var t=nr[n];_.prototype[n]=function(){return new C(t.apply(this.__wrapped__,arguments))}}),Pr.spliceObjects||Tr(["pop","shift","splice"],function(n){var t=nr[n],r="splice"==n;_.prototype[n]=function(){var n=this.__wrapped__,e=t.apply(n,arguments);return 0===n.length&&delete n[0],r?new C(e):e}}),_}var m,y=!0,d=null,b=!1,_=[],C=[],j=0,w={},x=+new Date+"",O=75,E=40,S=/\b__p\+='';/g,A=/\b(__p\+=)''\+/g,I=/(__e\(.*?\)|\b__t\))\+'';/g,B=/&(?:amp|lt|gt|quot|#39);/g,N=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,P=/\w*$/,z=/<%=([\s\S]+?)%>/g,F=(F=/\bthis\b/)&&F.test(h)&&F,$=" \t\x0B\f\xa0\ufeff\n\r\u2028\u2029\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000",q=RegExp("^["+$+"]*0+(?=.$)"),D=/($^)/,R=/[&<>"']/g,T=/['\n\r\t\u2028\u2029\\]/g,W="Array Boolean Date Error Function Math Number Object RegExp String _ attachEvent clearTimeout isFinite isNaN parseInt setImmediate setTimeout".split(" "),L="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),G="[object Arguments]",H="[object Array]",J="[object Boolean]",K="[object Date]",M="[object Error]",U="[object Function]",V="[object Number]",Q="[object Object]",X="[object RegExp]",Y="[object String]",Z={};
Z[U]=b,Z[G]=Z[H]=Z[J]=Z[K]=Z[V]=Z[Q]=Z[X]=Z[Y]=y;var nt={"boolean":b,"function":y,object:y,number:b,string:b,undefined:b},tt={"\\":"\\","'":"'","\n":"n","\r":"r","\t":"t","\u2028":"u2028","\u2029":"u2029"},rt=nt[typeof exports]&&exports,et=nt[typeof module]&&module&&module.exports==rt&&module,ut=nt[typeof global]&&global;!ut||ut.global!==ut&&ut.window!==ut||(n=ut);var at=h();typeof define=="function"&&typeof define.amd=="object"&&define.amd?(n._=at, define('lodash',[],function(){return at})):rt&&!rt.nodeType?et?(et.exports=at)._=at:rt._=at:n._=at
}(this);
/*! jQuery v1.9.1 | (c) 2005, 2012 jQuery Foundation, Inc. | jquery.org/license
//@ sourceMappingURL=jquery.min.map
*/(function(e,t){var n,r,i=typeof t,o=e.document,a=e.location,s=e.jQuery,u=e.$,l={},c=[],p="1.9.1",f=c.concat,d=c.push,h=c.slice,g=c.indexOf,m=l.toString,y=l.hasOwnProperty,v=p.trim,b=function(e,t){return new b.fn.init(e,t,r)},x=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,w=/\S+/g,T=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,N=/^(?:(<[\w\W]+>)[^>]*|#([\w-]*))$/,C=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,k=/^[\],:{}\s]*$/,E=/(?:^|:|,)(?:\s*\[)+/g,S=/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,A=/"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,j=/^-ms-/,D=/-([\da-z])/gi,L=function(e,t){return t.toUpperCase()},H=function(e){(o.addEventListener||"load"===e.type||"complete"===o.readyState)&&(q(),b.ready())},q=function(){o.addEventListener?(o.removeEventListener("DOMContentLoaded",H,!1),e.removeEventListener("load",H,!1)):(o.detachEvent("onreadystatechange",H),e.detachEvent("onload",H))};b.fn=b.prototype={jquery:p,constructor:b,init:function(e,n,r){var i,a;if(!e)return this;if("string"==typeof e){if(i="<"===e.charAt(0)&&">"===e.charAt(e.length-1)&&e.length>=3?[null,e,null]:N.exec(e),!i||!i[1]&&n)return!n||n.jquery?(n||r).find(e):this.constructor(n).find(e);if(i[1]){if(n=n instanceof b?n[0]:n,b.merge(this,b.parseHTML(i[1],n&&n.nodeType?n.ownerDocument||n:o,!0)),C.test(i[1])&&b.isPlainObject(n))for(i in n)b.isFunction(this[i])?this[i](n[i]):this.attr(i,n[i]);return this}if(a=o.getElementById(i[2]),a&&a.parentNode){if(a.id!==i[2])return r.find(e);this.length=1,this[0]=a}return this.context=o,this.selector=e,this}return e.nodeType?(this.context=this[0]=e,this.length=1,this):b.isFunction(e)?r.ready(e):(e.selector!==t&&(this.selector=e.selector,this.context=e.context),b.makeArray(e,this))},selector:"",length:0,size:function(){return this.length},toArray:function(){return h.call(this)},get:function(e){return null==e?this.toArray():0>e?this[this.length+e]:this[e]},pushStack:function(e){var t=b.merge(this.constructor(),e);return t.prevObject=this,t.context=this.context,t},each:function(e,t){return b.each(this,e,t)},ready:function(e){return b.ready.promise().done(e),this},slice:function(){return this.pushStack(h.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(e){var t=this.length,n=+e+(0>e?t:0);return this.pushStack(n>=0&&t>n?[this[n]]:[])},map:function(e){return this.pushStack(b.map(this,function(t,n){return e.call(t,n,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:d,sort:[].sort,splice:[].splice},b.fn.init.prototype=b.fn,b.extend=b.fn.extend=function(){var e,n,r,i,o,a,s=arguments[0]||{},u=1,l=arguments.length,c=!1;for("boolean"==typeof s&&(c=s,s=arguments[1]||{},u=2),"object"==typeof s||b.isFunction(s)||(s={}),l===u&&(s=this,--u);l>u;u++)if(null!=(o=arguments[u]))for(i in o)e=s[i],r=o[i],s!==r&&(c&&r&&(b.isPlainObject(r)||(n=b.isArray(r)))?(n?(n=!1,a=e&&b.isArray(e)?e:[]):a=e&&b.isPlainObject(e)?e:{},s[i]=b.extend(c,a,r)):r!==t&&(s[i]=r));return s},b.extend({noConflict:function(t){return e.$===b&&(e.$=u),t&&e.jQuery===b&&(e.jQuery=s),b},isReady:!1,readyWait:1,holdReady:function(e){e?b.readyWait++:b.ready(!0)},ready:function(e){if(e===!0?!--b.readyWait:!b.isReady){if(!o.body)return setTimeout(b.ready);b.isReady=!0,e!==!0&&--b.readyWait>0||(n.resolveWith(o,[b]),b.fn.trigger&&b(o).trigger("ready").off("ready"))}},isFunction:function(e){return"function"===b.type(e)},isArray:Array.isArray||function(e){return"array"===b.type(e)},isWindow:function(e){return null!=e&&e==e.window},isNumeric:function(e){return!isNaN(parseFloat(e))&&isFinite(e)},type:function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?l[m.call(e)]||"object":typeof e},isPlainObject:function(e){if(!e||"object"!==b.type(e)||e.nodeType||b.isWindow(e))return!1;try{if(e.constructor&&!y.call(e,"constructor")&&!y.call(e.constructor.prototype,"isPrototypeOf"))return!1}catch(n){return!1}var r;for(r in e);return r===t||y.call(e,r)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},error:function(e){throw Error(e)},parseHTML:function(e,t,n){if(!e||"string"!=typeof e)return null;"boolean"==typeof t&&(n=t,t=!1),t=t||o;var r=C.exec(e),i=!n&&[];return r?[t.createElement(r[1])]:(r=b.buildFragment([e],t,i),i&&b(i).remove(),b.merge([],r.childNodes))},parseJSON:function(n){return e.JSON&&e.JSON.parse?e.JSON.parse(n):null===n?n:"string"==typeof n&&(n=b.trim(n),n&&k.test(n.replace(S,"@").replace(A,"]").replace(E,"")))?Function("return "+n)():(b.error("Invalid JSON: "+n),t)},parseXML:function(n){var r,i;if(!n||"string"!=typeof n)return null;try{e.DOMParser?(i=new DOMParser,r=i.parseFromString(n,"text/xml")):(r=new ActiveXObject("Microsoft.XMLDOM"),r.async="false",r.loadXML(n))}catch(o){r=t}return r&&r.documentElement&&!r.getElementsByTagName("parsererror").length||b.error("Invalid XML: "+n),r},noop:function(){},globalEval:function(t){t&&b.trim(t)&&(e.execScript||function(t){e.eval.call(e,t)})(t)},camelCase:function(e){return e.replace(j,"ms-").replace(D,L)},nodeName:function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},each:function(e,t,n){var r,i=0,o=e.length,a=M(e);if(n){if(a){for(;o>i;i++)if(r=t.apply(e[i],n),r===!1)break}else for(i in e)if(r=t.apply(e[i],n),r===!1)break}else if(a){for(;o>i;i++)if(r=t.call(e[i],i,e[i]),r===!1)break}else for(i in e)if(r=t.call(e[i],i,e[i]),r===!1)break;return e},trim:v&&!v.call("\ufeff\u00a0")?function(e){return null==e?"":v.call(e)}:function(e){return null==e?"":(e+"").replace(T,"")},makeArray:function(e,t){var n=t||[];return null!=e&&(M(Object(e))?b.merge(n,"string"==typeof e?[e]:e):d.call(n,e)),n},inArray:function(e,t,n){var r;if(t){if(g)return g.call(t,e,n);for(r=t.length,n=n?0>n?Math.max(0,r+n):n:0;r>n;n++)if(n in t&&t[n]===e)return n}return-1},merge:function(e,n){var r=n.length,i=e.length,o=0;if("number"==typeof r)for(;r>o;o++)e[i++]=n[o];else while(n[o]!==t)e[i++]=n[o++];return e.length=i,e},grep:function(e,t,n){var r,i=[],o=0,a=e.length;for(n=!!n;a>o;o++)r=!!t(e[o],o),n!==r&&i.push(e[o]);return i},map:function(e,t,n){var r,i=0,o=e.length,a=M(e),s=[];if(a)for(;o>i;i++)r=t(e[i],i,n),null!=r&&(s[s.length]=r);else for(i in e)r=t(e[i],i,n),null!=r&&(s[s.length]=r);return f.apply([],s)},guid:1,proxy:function(e,n){var r,i,o;return"string"==typeof n&&(o=e[n],n=e,e=o),b.isFunction(e)?(r=h.call(arguments,2),i=function(){return e.apply(n||this,r.concat(h.call(arguments)))},i.guid=e.guid=e.guid||b.guid++,i):t},access:function(e,n,r,i,o,a,s){var u=0,l=e.length,c=null==r;if("object"===b.type(r)){o=!0;for(u in r)b.access(e,n,u,r[u],!0,a,s)}else if(i!==t&&(o=!0,b.isFunction(i)||(s=!0),c&&(s?(n.call(e,i),n=null):(c=n,n=function(e,t,n){return c.call(b(e),n)})),n))for(;l>u;u++)n(e[u],r,s?i:i.call(e[u],u,n(e[u],r)));return o?e:c?n.call(e):l?n(e[0],r):a},now:function(){return(new Date).getTime()}}),b.ready.promise=function(t){if(!n)if(n=b.Deferred(),"complete"===o.readyState)setTimeout(b.ready);else if(o.addEventListener)o.addEventListener("DOMContentLoaded",H,!1),e.addEventListener("load",H,!1);else{o.attachEvent("onreadystatechange",H),e.attachEvent("onload",H);var r=!1;try{r=null==e.frameElement&&o.documentElement}catch(i){}r&&r.doScroll&&function a(){if(!b.isReady){try{r.doScroll("left")}catch(e){return setTimeout(a,50)}q(),b.ready()}}()}return n.promise(t)},b.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(e,t){l["[object "+t+"]"]=t.toLowerCase()});function M(e){var t=e.length,n=b.type(e);return b.isWindow(e)?!1:1===e.nodeType&&t?!0:"array"===n||"function"!==n&&(0===t||"number"==typeof t&&t>0&&t-1 in e)}r=b(o);var _={};function F(e){var t=_[e]={};return b.each(e.match(w)||[],function(e,n){t[n]=!0}),t}b.Callbacks=function(e){e="string"==typeof e?_[e]||F(e):b.extend({},e);var n,r,i,o,a,s,u=[],l=!e.once&&[],c=function(t){for(r=e.memory&&t,i=!0,a=s||0,s=0,o=u.length,n=!0;u&&o>a;a++)if(u[a].apply(t[0],t[1])===!1&&e.stopOnFalse){r=!1;break}n=!1,u&&(l?l.length&&c(l.shift()):r?u=[]:p.disable())},p={add:function(){if(u){var t=u.length;(function i(t){b.each(t,function(t,n){var r=b.type(n);"function"===r?e.unique&&p.has(n)||u.push(n):n&&n.length&&"string"!==r&&i(n)})})(arguments),n?o=u.length:r&&(s=t,c(r))}return this},remove:function(){return u&&b.each(arguments,function(e,t){var r;while((r=b.inArray(t,u,r))>-1)u.splice(r,1),n&&(o>=r&&o--,a>=r&&a--)}),this},has:function(e){return e?b.inArray(e,u)>-1:!(!u||!u.length)},empty:function(){return u=[],this},disable:function(){return u=l=r=t,this},disabled:function(){return!u},lock:function(){return l=t,r||p.disable(),this},locked:function(){return!l},fireWith:function(e,t){return t=t||[],t=[e,t.slice?t.slice():t],!u||i&&!l||(n?l.push(t):c(t)),this},fire:function(){return p.fireWith(this,arguments),this},fired:function(){return!!i}};return p},b.extend({Deferred:function(e){var t=[["resolve","done",b.Callbacks("once memory"),"resolved"],["reject","fail",b.Callbacks("once memory"),"rejected"],["notify","progress",b.Callbacks("memory")]],n="pending",r={state:function(){return n},always:function(){return i.done(arguments).fail(arguments),this},then:function(){var e=arguments;return b.Deferred(function(n){b.each(t,function(t,o){var a=o[0],s=b.isFunction(e[t])&&e[t];i[o[1]](function(){var e=s&&s.apply(this,arguments);e&&b.isFunction(e.promise)?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[a+"With"](this===r?n.promise():this,s?[e]:arguments)})}),e=null}).promise()},promise:function(e){return null!=e?b.extend(e,r):r}},i={};return r.pipe=r.then,b.each(t,function(e,o){var a=o[2],s=o[3];r[o[1]]=a.add,s&&a.add(function(){n=s},t[1^e][2].disable,t[2][2].lock),i[o[0]]=function(){return i[o[0]+"With"](this===i?r:this,arguments),this},i[o[0]+"With"]=a.fireWith}),r.promise(i),e&&e.call(i,i),i},when:function(e){var t=0,n=h.call(arguments),r=n.length,i=1!==r||e&&b.isFunction(e.promise)?r:0,o=1===i?e:b.Deferred(),a=function(e,t,n){return function(r){t[e]=this,n[e]=arguments.length>1?h.call(arguments):r,n===s?o.notifyWith(t,n):--i||o.resolveWith(t,n)}},s,u,l;if(r>1)for(s=Array(r),u=Array(r),l=Array(r);r>t;t++)n[t]&&b.isFunction(n[t].promise)?n[t].promise().done(a(t,l,n)).fail(o.reject).progress(a(t,u,s)):--i;return i||o.resolveWith(l,n),o.promise()}}),b.support=function(){var t,n,r,a,s,u,l,c,p,f,d=o.createElement("div");if(d.setAttribute("className","t"),d.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",n=d.getElementsByTagName("*"),r=d.getElementsByTagName("a")[0],!n||!r||!n.length)return{};s=o.createElement("select"),l=s.appendChild(o.createElement("option")),a=d.getElementsByTagName("input")[0],r.style.cssText="top:1px;float:left;opacity:.5",t={getSetAttribute:"t"!==d.className,leadingWhitespace:3===d.firstChild.nodeType,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/top/.test(r.getAttribute("style")),hrefNormalized:"/a"===r.getAttribute("href"),opacity:/^0.5/.test(r.style.opacity),cssFloat:!!r.style.cssFloat,checkOn:!!a.value,optSelected:l.selected,enctype:!!o.createElement("form").enctype,html5Clone:"<:nav></:nav>"!==o.createElement("nav").cloneNode(!0).outerHTML,boxModel:"CSS1Compat"===o.compatMode,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,boxSizingReliable:!0,pixelPosition:!1},a.checked=!0,t.noCloneChecked=a.cloneNode(!0).checked,s.disabled=!0,t.optDisabled=!l.disabled;try{delete d.test}catch(h){t.deleteExpando=!1}a=o.createElement("input"),a.setAttribute("value",""),t.input=""===a.getAttribute("value"),a.value="t",a.setAttribute("type","radio"),t.radioValue="t"===a.value,a.setAttribute("checked","t"),a.setAttribute("name","t"),u=o.createDocumentFragment(),u.appendChild(a),t.appendChecked=a.checked,t.checkClone=u.cloneNode(!0).cloneNode(!0).lastChild.checked,d.attachEvent&&(d.attachEvent("onclick",function(){t.noCloneEvent=!1}),d.cloneNode(!0).click());for(f in{submit:!0,change:!0,focusin:!0})d.setAttribute(c="on"+f,"t"),t[f+"Bubbles"]=c in e||d.attributes[c].expando===!1;return d.style.backgroundClip="content-box",d.cloneNode(!0).style.backgroundClip="",t.clearCloneStyle="content-box"===d.style.backgroundClip,b(function(){var n,r,a,s="padding:0;margin:0;border:0;display:block;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;",u=o.getElementsByTagName("body")[0];u&&(n=o.createElement("div"),n.style.cssText="border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px",u.appendChild(n).appendChild(d),d.innerHTML="<table><tr><td></td><td>t</td></tr></table>",a=d.getElementsByTagName("td"),a[0].style.cssText="padding:0;margin:0;border:0;display:none",p=0===a[0].offsetHeight,a[0].style.display="",a[1].style.display="none",t.reliableHiddenOffsets=p&&0===a[0].offsetHeight,d.innerHTML="",d.style.cssText="box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;",t.boxSizing=4===d.offsetWidth,t.doesNotIncludeMarginInBodyOffset=1!==u.offsetTop,e.getComputedStyle&&(t.pixelPosition="1%"!==(e.getComputedStyle(d,null)||{}).top,t.boxSizingReliable="4px"===(e.getComputedStyle(d,null)||{width:"4px"}).width,r=d.appendChild(o.createElement("div")),r.style.cssText=d.style.cssText=s,r.style.marginRight=r.style.width="0",d.style.width="1px",t.reliableMarginRight=!parseFloat((e.getComputedStyle(r,null)||{}).marginRight)),typeof d.style.zoom!==i&&(d.innerHTML="",d.style.cssText=s+"width:1px;padding:1px;display:inline;zoom:1",t.inlineBlockNeedsLayout=3===d.offsetWidth,d.style.display="block",d.innerHTML="<div></div>",d.firstChild.style.width="5px",t.shrinkWrapBlocks=3!==d.offsetWidth,t.inlineBlockNeedsLayout&&(u.style.zoom=1)),u.removeChild(n),n=d=a=r=null)}),n=s=u=l=r=a=null,t}();var O=/(?:\{[\s\S]*\}|\[[\s\S]*\])$/,B=/([A-Z])/g;function P(e,n,r,i){if(b.acceptData(e)){var o,a,s=b.expando,u="string"==typeof n,l=e.nodeType,p=l?b.cache:e,f=l?e[s]:e[s]&&s;if(f&&p[f]&&(i||p[f].data)||!u||r!==t)return f||(l?e[s]=f=c.pop()||b.guid++:f=s),p[f]||(p[f]={},l||(p[f].toJSON=b.noop)),("object"==typeof n||"function"==typeof n)&&(i?p[f]=b.extend(p[f],n):p[f].data=b.extend(p[f].data,n)),o=p[f],i||(o.data||(o.data={}),o=o.data),r!==t&&(o[b.camelCase(n)]=r),u?(a=o[n],null==a&&(a=o[b.camelCase(n)])):a=o,a}}function R(e,t,n){if(b.acceptData(e)){var r,i,o,a=e.nodeType,s=a?b.cache:e,u=a?e[b.expando]:b.expando;if(s[u]){if(t&&(o=n?s[u]:s[u].data)){b.isArray(t)?t=t.concat(b.map(t,b.camelCase)):t in o?t=[t]:(t=b.camelCase(t),t=t in o?[t]:t.split(" "));for(r=0,i=t.length;i>r;r++)delete o[t[r]];if(!(n?$:b.isEmptyObject)(o))return}(n||(delete s[u].data,$(s[u])))&&(a?b.cleanData([e],!0):b.support.deleteExpando||s!=s.window?delete s[u]:s[u]=null)}}}b.extend({cache:{},expando:"jQuery"+(p+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(e){return e=e.nodeType?b.cache[e[b.expando]]:e[b.expando],!!e&&!$(e)},data:function(e,t,n){return P(e,t,n)},removeData:function(e,t){return R(e,t)},_data:function(e,t,n){return P(e,t,n,!0)},_removeData:function(e,t){return R(e,t,!0)},acceptData:function(e){if(e.nodeType&&1!==e.nodeType&&9!==e.nodeType)return!1;var t=e.nodeName&&b.noData[e.nodeName.toLowerCase()];return!t||t!==!0&&e.getAttribute("classid")===t}}),b.fn.extend({data:function(e,n){var r,i,o=this[0],a=0,s=null;if(e===t){if(this.length&&(s=b.data(o),1===o.nodeType&&!b._data(o,"parsedAttrs"))){for(r=o.attributes;r.length>a;a++)i=r[a].name,i.indexOf("data-")||(i=b.camelCase(i.slice(5)),W(o,i,s[i]));b._data(o,"parsedAttrs",!0)}return s}return"object"==typeof e?this.each(function(){b.data(this,e)}):b.access(this,function(n){return n===t?o?W(o,e,b.data(o,e)):null:(this.each(function(){b.data(this,e,n)}),t)},null,n,arguments.length>1,null,!0)},removeData:function(e){return this.each(function(){b.removeData(this,e)})}});function W(e,n,r){if(r===t&&1===e.nodeType){var i="data-"+n.replace(B,"-$1").toLowerCase();if(r=e.getAttribute(i),"string"==typeof r){try{r="true"===r?!0:"false"===r?!1:"null"===r?null:+r+""===r?+r:O.test(r)?b.parseJSON(r):r}catch(o){}b.data(e,n,r)}else r=t}return r}function $(e){var t;for(t in e)if(("data"!==t||!b.isEmptyObject(e[t]))&&"toJSON"!==t)return!1;return!0}b.extend({queue:function(e,n,r){var i;return e?(n=(n||"fx")+"queue",i=b._data(e,n),r&&(!i||b.isArray(r)?i=b._data(e,n,b.makeArray(r)):i.push(r)),i||[]):t},dequeue:function(e,t){t=t||"fx";var n=b.queue(e,t),r=n.length,i=n.shift(),o=b._queueHooks(e,t),a=function(){b.dequeue(e,t)};"inprogress"===i&&(i=n.shift(),r--),o.cur=i,i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,a,o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return b._data(e,n)||b._data(e,n,{empty:b.Callbacks("once memory").add(function(){b._removeData(e,t+"queue"),b._removeData(e,n)})})}}),b.fn.extend({queue:function(e,n){var r=2;return"string"!=typeof e&&(n=e,e="fx",r--),r>arguments.length?b.queue(this[0],e):n===t?this:this.each(function(){var t=b.queue(this,e,n);b._queueHooks(this,e),"fx"===e&&"inprogress"!==t[0]&&b.dequeue(this,e)})},dequeue:function(e){return this.each(function(){b.dequeue(this,e)})},delay:function(e,t){return e=b.fx?b.fx.speeds[e]||e:e,t=t||"fx",this.queue(t,function(t,n){var r=setTimeout(t,e);n.stop=function(){clearTimeout(r)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,n){var r,i=1,o=b.Deferred(),a=this,s=this.length,u=function(){--i||o.resolveWith(a,[a])};"string"!=typeof e&&(n=e,e=t),e=e||"fx";while(s--)r=b._data(a[s],e+"queueHooks"),r&&r.empty&&(i++,r.empty.add(u));return u(),o.promise(n)}});var I,z,X=/[\t\r\n]/g,U=/\r/g,V=/^(?:input|select|textarea|button|object)$/i,Y=/^(?:a|area)$/i,J=/^(?:checked|selected|autofocus|autoplay|async|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped)$/i,G=/^(?:checked|selected)$/i,Q=b.support.getSetAttribute,K=b.support.input;b.fn.extend({attr:function(e,t){return b.access(this,b.attr,e,t,arguments.length>1)},removeAttr:function(e){return this.each(function(){b.removeAttr(this,e)})},prop:function(e,t){return b.access(this,b.prop,e,t,arguments.length>1)},removeProp:function(e){return e=b.propFix[e]||e,this.each(function(){try{this[e]=t,delete this[e]}catch(n){}})},addClass:function(e){var t,n,r,i,o,a=0,s=this.length,u="string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).addClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):" ")){o=0;while(i=t[o++])0>r.indexOf(" "+i+" ")&&(r+=i+" ");n.className=b.trim(r)}return this},removeClass:function(e){var t,n,r,i,o,a=0,s=this.length,u=0===arguments.length||"string"==typeof e&&e;if(b.isFunction(e))return this.each(function(t){b(this).removeClass(e.call(this,t,this.className))});if(u)for(t=(e||"").match(w)||[];s>a;a++)if(n=this[a],r=1===n.nodeType&&(n.className?(" "+n.className+" ").replace(X," "):"")){o=0;while(i=t[o++])while(r.indexOf(" "+i+" ")>=0)r=r.replace(" "+i+" "," ");n.className=e?b.trim(r):""}return this},toggleClass:function(e,t){var n=typeof e,r="boolean"==typeof t;return b.isFunction(e)?this.each(function(n){b(this).toggleClass(e.call(this,n,this.className,t),t)}):this.each(function(){if("string"===n){var o,a=0,s=b(this),u=t,l=e.match(w)||[];while(o=l[a++])u=r?u:!s.hasClass(o),s[u?"addClass":"removeClass"](o)}else(n===i||"boolean"===n)&&(this.className&&b._data(this,"__className__",this.className),this.className=this.className||e===!1?"":b._data(this,"__className__")||"")})},hasClass:function(e){var t=" "+e+" ",n=0,r=this.length;for(;r>n;n++)if(1===this[n].nodeType&&(" "+this[n].className+" ").replace(X," ").indexOf(t)>=0)return!0;return!1},val:function(e){var n,r,i,o=this[0];{if(arguments.length)return i=b.isFunction(e),this.each(function(n){var o,a=b(this);1===this.nodeType&&(o=i?e.call(this,n,a.val()):e,null==o?o="":"number"==typeof o?o+="":b.isArray(o)&&(o=b.map(o,function(e){return null==e?"":e+""})),r=b.valHooks[this.type]||b.valHooks[this.nodeName.toLowerCase()],r&&"set"in r&&r.set(this,o,"value")!==t||(this.value=o))});if(o)return r=b.valHooks[o.type]||b.valHooks[o.nodeName.toLowerCase()],r&&"get"in r&&(n=r.get(o,"value"))!==t?n:(n=o.value,"string"==typeof n?n.replace(U,""):null==n?"":n)}}}),b.extend({valHooks:{option:{get:function(e){var t=e.attributes.value;return!t||t.specified?e.value:e.text}},select:{get:function(e){var t,n,r=e.options,i=e.selectedIndex,o="select-one"===e.type||0>i,a=o?null:[],s=o?i+1:r.length,u=0>i?s:o?i:0;for(;s>u;u++)if(n=r[u],!(!n.selected&&u!==i||(b.support.optDisabled?n.disabled:null!==n.getAttribute("disabled"))||n.parentNode.disabled&&b.nodeName(n.parentNode,"optgroup"))){if(t=b(n).val(),o)return t;a.push(t)}return a},set:function(e,t){var n=b.makeArray(t);return b(e).find("option").each(function(){this.selected=b.inArray(b(this).val(),n)>=0}),n.length||(e.selectedIndex=-1),n}}},attr:function(e,n,r){var o,a,s,u=e.nodeType;if(e&&3!==u&&8!==u&&2!==u)return typeof e.getAttribute===i?b.prop(e,n,r):(a=1!==u||!b.isXMLDoc(e),a&&(n=n.toLowerCase(),o=b.attrHooks[n]||(J.test(n)?z:I)),r===t?o&&a&&"get"in o&&null!==(s=o.get(e,n))?s:(typeof e.getAttribute!==i&&(s=e.getAttribute(n)),null==s?t:s):null!==r?o&&a&&"set"in o&&(s=o.set(e,r,n))!==t?s:(e.setAttribute(n,r+""),r):(b.removeAttr(e,n),t))},removeAttr:function(e,t){var n,r,i=0,o=t&&t.match(w);if(o&&1===e.nodeType)while(n=o[i++])r=b.propFix[n]||n,J.test(n)?!Q&&G.test(n)?e[b.camelCase("default-"+n)]=e[r]=!1:e[r]=!1:b.attr(e,n,""),e.removeAttribute(Q?n:r)},attrHooks:{type:{set:function(e,t){if(!b.support.radioValue&&"radio"===t&&b.nodeName(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(e,n,r){var i,o,a,s=e.nodeType;if(e&&3!==s&&8!==s&&2!==s)return a=1!==s||!b.isXMLDoc(e),a&&(n=b.propFix[n]||n,o=b.propHooks[n]),r!==t?o&&"set"in o&&(i=o.set(e,r,n))!==t?i:e[n]=r:o&&"get"in o&&null!==(i=o.get(e,n))?i:e[n]},propHooks:{tabIndex:{get:function(e){var n=e.getAttributeNode("tabindex");return n&&n.specified?parseInt(n.value,10):V.test(e.nodeName)||Y.test(e.nodeName)&&e.href?0:t}}}}),z={get:function(e,n){var r=b.prop(e,n),i="boolean"==typeof r&&e.getAttribute(n),o="boolean"==typeof r?K&&Q?null!=i:G.test(n)?e[b.camelCase("default-"+n)]:!!i:e.getAttributeNode(n);return o&&o.value!==!1?n.toLowerCase():t},set:function(e,t,n){return t===!1?b.removeAttr(e,n):K&&Q||!G.test(n)?e.setAttribute(!Q&&b.propFix[n]||n,n):e[b.camelCase("default-"+n)]=e[n]=!0,n}},K&&Q||(b.attrHooks.value={get:function(e,n){var r=e.getAttributeNode(n);return b.nodeName(e,"input")?e.defaultValue:r&&r.specified?r.value:t},set:function(e,n,r){return b.nodeName(e,"input")?(e.defaultValue=n,t):I&&I.set(e,n,r)}}),Q||(I=b.valHooks.button={get:function(e,n){var r=e.getAttributeNode(n);return r&&("id"===n||"name"===n||"coords"===n?""!==r.value:r.specified)?r.value:t},set:function(e,n,r){var i=e.getAttributeNode(r);return i||e.setAttributeNode(i=e.ownerDocument.createAttribute(r)),i.value=n+="","value"===r||n===e.getAttribute(r)?n:t}},b.attrHooks.contenteditable={get:I.get,set:function(e,t,n){I.set(e,""===t?!1:t,n)}},b.each(["width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{set:function(e,r){return""===r?(e.setAttribute(n,"auto"),r):t}})})),b.support.hrefNormalized||(b.each(["href","src","width","height"],function(e,n){b.attrHooks[n]=b.extend(b.attrHooks[n],{get:function(e){var r=e.getAttribute(n,2);return null==r?t:r}})}),b.each(["href","src"],function(e,t){b.propHooks[t]={get:function(e){return e.getAttribute(t,4)}}})),b.support.style||(b.attrHooks.style={get:function(e){return e.style.cssText||t},set:function(e,t){return e.style.cssText=t+""}}),b.support.optSelected||(b.propHooks.selected=b.extend(b.propHooks.selected,{get:function(e){var t=e.parentNode;return t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex),null}})),b.support.enctype||(b.propFix.enctype="encoding"),b.support.checkOn||b.each(["radio","checkbox"],function(){b.valHooks[this]={get:function(e){return null===e.getAttribute("value")?"on":e.value}}}),b.each(["radio","checkbox"],function(){b.valHooks[this]=b.extend(b.valHooks[this],{set:function(e,n){return b.isArray(n)?e.checked=b.inArray(b(e).val(),n)>=0:t}})});var Z=/^(?:input|select|textarea)$/i,et=/^key/,tt=/^(?:mouse|contextmenu)|click/,nt=/^(?:focusinfocus|focusoutblur)$/,rt=/^([^.]*)(?:\.(.+)|)$/;function it(){return!0}function ot(){return!1}b.event={global:{},add:function(e,n,r,o,a){var s,u,l,c,p,f,d,h,g,m,y,v=b._data(e);if(v){r.handler&&(c=r,r=c.handler,a=c.selector),r.guid||(r.guid=b.guid++),(u=v.events)||(u=v.events={}),(f=v.handle)||(f=v.handle=function(e){return typeof b===i||e&&b.event.triggered===e.type?t:b.event.dispatch.apply(f.elem,arguments)},f.elem=e),n=(n||"").match(w)||[""],l=n.length;while(l--)s=rt.exec(n[l])||[],g=y=s[1],m=(s[2]||"").split(".").sort(),p=b.event.special[g]||{},g=(a?p.delegateType:p.bindType)||g,p=b.event.special[g]||{},d=b.extend({type:g,origType:y,data:o,handler:r,guid:r.guid,selector:a,needsContext:a&&b.expr.match.needsContext.test(a),namespace:m.join(".")},c),(h=u[g])||(h=u[g]=[],h.delegateCount=0,p.setup&&p.setup.call(e,o,m,f)!==!1||(e.addEventListener?e.addEventListener(g,f,!1):e.attachEvent&&e.attachEvent("on"+g,f))),p.add&&(p.add.call(e,d),d.handler.guid||(d.handler.guid=r.guid)),a?h.splice(h.delegateCount++,0,d):h.push(d),b.event.global[g]=!0;e=null}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,p,f,d,h,g,m=b.hasData(e)&&b._data(e);if(m&&(c=m.events)){t=(t||"").match(w)||[""],l=t.length;while(l--)if(s=rt.exec(t[l])||[],d=g=s[1],h=(s[2]||"").split(".").sort(),d){p=b.event.special[d]||{},d=(r?p.delegateType:p.bindType)||d,f=c[d]||[],s=s[2]&&RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),u=o=f.length;while(o--)a=f[o],!i&&g!==a.origType||n&&n.guid!==a.guid||s&&!s.test(a.namespace)||r&&r!==a.selector&&("**"!==r||!a.selector)||(f.splice(o,1),a.selector&&f.delegateCount--,p.remove&&p.remove.call(e,a));u&&!f.length&&(p.teardown&&p.teardown.call(e,h,m.handle)!==!1||b.removeEvent(e,d,m.handle),delete c[d])}else for(d in c)b.event.remove(e,d+t[l],n,r,!0);b.isEmptyObject(c)&&(delete m.handle,b._removeData(e,"events"))}},trigger:function(n,r,i,a){var s,u,l,c,p,f,d,h=[i||o],g=y.call(n,"type")?n.type:n,m=y.call(n,"namespace")?n.namespace.split("."):[];if(l=f=i=i||o,3!==i.nodeType&&8!==i.nodeType&&!nt.test(g+b.event.triggered)&&(g.indexOf(".")>=0&&(m=g.split("."),g=m.shift(),m.sort()),u=0>g.indexOf(":")&&"on"+g,n=n[b.expando]?n:new b.Event(g,"object"==typeof n&&n),n.isTrigger=!0,n.namespace=m.join("."),n.namespace_re=n.namespace?RegExp("(^|\\.)"+m.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,n.result=t,n.target||(n.target=i),r=null==r?[n]:b.makeArray(r,[n]),p=b.event.special[g]||{},a||!p.trigger||p.trigger.apply(i,r)!==!1)){if(!a&&!p.noBubble&&!b.isWindow(i)){for(c=p.delegateType||g,nt.test(c+g)||(l=l.parentNode);l;l=l.parentNode)h.push(l),f=l;f===(i.ownerDocument||o)&&h.push(f.defaultView||f.parentWindow||e)}d=0;while((l=h[d++])&&!n.isPropagationStopped())n.type=d>1?c:p.bindType||g,s=(b._data(l,"events")||{})[n.type]&&b._data(l,"handle"),s&&s.apply(l,r),s=u&&l[u],s&&b.acceptData(l)&&s.apply&&s.apply(l,r)===!1&&n.preventDefault();if(n.type=g,!(a||n.isDefaultPrevented()||p._default&&p._default.apply(i.ownerDocument,r)!==!1||"click"===g&&b.nodeName(i,"a")||!b.acceptData(i)||!u||!i[g]||b.isWindow(i))){f=i[u],f&&(i[u]=null),b.event.triggered=g;try{i[g]()}catch(v){}b.event.triggered=t,f&&(i[u]=f)}return n.result}},dispatch:function(e){e=b.event.fix(e);var n,r,i,o,a,s=[],u=h.call(arguments),l=(b._data(this,"events")||{})[e.type]||[],c=b.event.special[e.type]||{};if(u[0]=e,e.delegateTarget=this,!c.preDispatch||c.preDispatch.call(this,e)!==!1){s=b.event.handlers.call(this,e,l),n=0;while((o=s[n++])&&!e.isPropagationStopped()){e.currentTarget=o.elem,a=0;while((i=o.handlers[a++])&&!e.isImmediatePropagationStopped())(!e.namespace_re||e.namespace_re.test(i.namespace))&&(e.handleObj=i,e.data=i.data,r=((b.event.special[i.origType]||{}).handle||i.handler).apply(o.elem,u),r!==t&&(e.result=r)===!1&&(e.preventDefault(),e.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,e),e.result}},handlers:function(e,n){var r,i,o,a,s=[],u=n.delegateCount,l=e.target;if(u&&l.nodeType&&(!e.button||"click"!==e.type))for(;l!=this;l=l.parentNode||this)if(1===l.nodeType&&(l.disabled!==!0||"click"!==e.type)){for(o=[],a=0;u>a;a++)i=n[a],r=i.selector+" ",o[r]===t&&(o[r]=i.needsContext?b(r,this).index(l)>=0:b.find(r,this,null,[l]).length),o[r]&&o.push(i);o.length&&s.push({elem:l,handlers:o})}return n.length>u&&s.push({elem:this,handlers:n.slice(u)}),s},fix:function(e){if(e[b.expando])return e;var t,n,r,i=e.type,a=e,s=this.fixHooks[i];s||(this.fixHooks[i]=s=tt.test(i)?this.mouseHooks:et.test(i)?this.keyHooks:{}),r=s.props?this.props.concat(s.props):this.props,e=new b.Event(a),t=r.length;while(t--)n=r[t],e[n]=a[n];return e.target||(e.target=a.srcElement||o),3===e.target.nodeType&&(e.target=e.target.parentNode),e.metaKey=!!e.metaKey,s.filter?s.filter(e,a):e},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(e,t){return null==e.which&&(e.which=null!=t.charCode?t.charCode:t.keyCode),e}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(e,n){var r,i,a,s=n.button,u=n.fromElement;return null==e.pageX&&null!=n.clientX&&(i=e.target.ownerDocument||o,a=i.documentElement,r=i.body,e.pageX=n.clientX+(a&&a.scrollLeft||r&&r.scrollLeft||0)-(a&&a.clientLeft||r&&r.clientLeft||0),e.pageY=n.clientY+(a&&a.scrollTop||r&&r.scrollTop||0)-(a&&a.clientTop||r&&r.clientTop||0)),!e.relatedTarget&&u&&(e.relatedTarget=u===e.target?n.toElement:u),e.which||s===t||(e.which=1&s?1:2&s?3:4&s?2:0),e}},special:{load:{noBubble:!0},click:{trigger:function(){return b.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):t}},focus:{trigger:function(){if(this!==o.activeElement&&this.focus)try{return this.focus(),!1}catch(e){}},delegateType:"focusin"},blur:{trigger:function(){return this===o.activeElement&&this.blur?(this.blur(),!1):t},delegateType:"focusout"},beforeunload:{postDispatch:function(e){e.result!==t&&(e.originalEvent.returnValue=e.result)}}},simulate:function(e,t,n,r){var i=b.extend(new b.Event,n,{type:e,isSimulated:!0,originalEvent:{}});r?b.event.trigger(i,null,t):b.event.dispatch.call(t,i),i.isDefaultPrevented()&&n.preventDefault()}},b.removeEvent=o.removeEventListener?function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n,!1)}:function(e,t,n){var r="on"+t;e.detachEvent&&(typeof e[r]===i&&(e[r]=null),e.detachEvent(r,n))},b.Event=function(e,n){return this instanceof b.Event?(e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||e.returnValue===!1||e.getPreventDefault&&e.getPreventDefault()?it:ot):this.type=e,n&&b.extend(this,n),this.timeStamp=e&&e.timeStamp||b.now(),this[b.expando]=!0,t):new b.Event(e,n)},b.Event.prototype={isDefaultPrevented:ot,isPropagationStopped:ot,isImmediatePropagationStopped:ot,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=it,e&&(e.preventDefault?e.preventDefault():e.returnValue=!1)},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=it,e&&(e.stopPropagation&&e.stopPropagation(),e.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=it,this.stopPropagation()}},b.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(e,t){b.event.special[e]={delegateType:t,bindType:t,handle:function(e){var n,r=this,i=e.relatedTarget,o=e.handleObj;
return(!i||i!==r&&!b.contains(r,i))&&(e.type=o.origType,n=o.handler.apply(this,arguments),e.type=t),n}}}),b.support.submitBubbles||(b.event.special.submit={setup:function(){return b.nodeName(this,"form")?!1:(b.event.add(this,"click._submit keypress._submit",function(e){var n=e.target,r=b.nodeName(n,"input")||b.nodeName(n,"button")?n.form:t;r&&!b._data(r,"submitBubbles")&&(b.event.add(r,"submit._submit",function(e){e._submit_bubble=!0}),b._data(r,"submitBubbles",!0))}),t)},postDispatch:function(e){e._submit_bubble&&(delete e._submit_bubble,this.parentNode&&!e.isTrigger&&b.event.simulate("submit",this.parentNode,e,!0))},teardown:function(){return b.nodeName(this,"form")?!1:(b.event.remove(this,"._submit"),t)}}),b.support.changeBubbles||(b.event.special.change={setup:function(){return Z.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(b.event.add(this,"propertychange._change",function(e){"checked"===e.originalEvent.propertyName&&(this._just_changed=!0)}),b.event.add(this,"click._change",function(e){this._just_changed&&!e.isTrigger&&(this._just_changed=!1),b.event.simulate("change",this,e,!0)})),!1):(b.event.add(this,"beforeactivate._change",function(e){var t=e.target;Z.test(t.nodeName)&&!b._data(t,"changeBubbles")&&(b.event.add(t,"change._change",function(e){!this.parentNode||e.isSimulated||e.isTrigger||b.event.simulate("change",this.parentNode,e,!0)}),b._data(t,"changeBubbles",!0))}),t)},handle:function(e){var n=e.target;return this!==n||e.isSimulated||e.isTrigger||"radio"!==n.type&&"checkbox"!==n.type?e.handleObj.handler.apply(this,arguments):t},teardown:function(){return b.event.remove(this,"._change"),!Z.test(this.nodeName)}}),b.support.focusinBubbles||b.each({focus:"focusin",blur:"focusout"},function(e,t){var n=0,r=function(e){b.event.simulate(t,e.target,b.event.fix(e),!0)};b.event.special[t]={setup:function(){0===n++&&o.addEventListener(e,r,!0)},teardown:function(){0===--n&&o.removeEventListener(e,r,!0)}}}),b.fn.extend({on:function(e,n,r,i,o){var a,s;if("object"==typeof e){"string"!=typeof n&&(r=r||n,n=t);for(a in e)this.on(a,n,r,e[a],o);return this}if(null==r&&null==i?(i=n,r=n=t):null==i&&("string"==typeof n?(i=r,r=t):(i=r,r=n,n=t)),i===!1)i=ot;else if(!i)return this;return 1===o&&(s=i,i=function(e){return b().off(e),s.apply(this,arguments)},i.guid=s.guid||(s.guid=b.guid++)),this.each(function(){b.event.add(this,e,i,r,n)})},one:function(e,t,n,r){return this.on(e,t,n,r,1)},off:function(e,n,r){var i,o;if(e&&e.preventDefault&&e.handleObj)return i=e.handleObj,b(e.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler),this;if("object"==typeof e){for(o in e)this.off(o,n,e[o]);return this}return(n===!1||"function"==typeof n)&&(r=n,n=t),r===!1&&(r=ot),this.each(function(){b.event.remove(this,e,r,n)})},bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},trigger:function(e,t){return this.each(function(){b.event.trigger(e,t,this)})},triggerHandler:function(e,n){var r=this[0];return r?b.event.trigger(e,n,r,!0):t}}),function(e,t){var n,r,i,o,a,s,u,l,c,p,f,d,h,g,m,y,v,x="sizzle"+-new Date,w=e.document,T={},N=0,C=0,k=it(),E=it(),S=it(),A=typeof t,j=1<<31,D=[],L=D.pop,H=D.push,q=D.slice,M=D.indexOf||function(e){var t=0,n=this.length;for(;n>t;t++)if(this[t]===e)return t;return-1},_="[\\x20\\t\\r\\n\\f]",F="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",O=F.replace("w","w#"),B="([*^$|!~]?=)",P="\\["+_+"*("+F+")"+_+"*(?:"+B+_+"*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|("+O+")|)|)"+_+"*\\]",R=":("+F+")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|"+P.replace(3,8)+")*)|.*)\\)|)",W=RegExp("^"+_+"+|((?:^|[^\\\\])(?:\\\\.)*)"+_+"+$","g"),$=RegExp("^"+_+"*,"+_+"*"),I=RegExp("^"+_+"*([\\x20\\t\\r\\n\\f>+~])"+_+"*"),z=RegExp(R),X=RegExp("^"+O+"$"),U={ID:RegExp("^#("+F+")"),CLASS:RegExp("^\\.("+F+")"),NAME:RegExp("^\\[name=['\"]?("+F+")['\"]?\\]"),TAG:RegExp("^("+F.replace("w","w*")+")"),ATTR:RegExp("^"+P),PSEUDO:RegExp("^"+R),CHILD:RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+_+"*(even|odd|(([+-]|)(\\d*)n|)"+_+"*(?:([+-]|)"+_+"*(\\d+)|))"+_+"*\\)|)","i"),needsContext:RegExp("^"+_+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+_+"*((?:-\\d)?\\d*)"+_+"*\\)|)(?=[^-]|$)","i")},V=/[\x20\t\r\n\f]*[+~]/,Y=/^[^{]+\{\s*\[native code/,J=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,G=/^(?:input|select|textarea|button)$/i,Q=/^h\d$/i,K=/'|\\/g,Z=/\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,et=/\\([\da-fA-F]{1,6}[\x20\t\r\n\f]?|.)/g,tt=function(e,t){var n="0x"+t-65536;return n!==n?t:0>n?String.fromCharCode(n+65536):String.fromCharCode(55296|n>>10,56320|1023&n)};try{q.call(w.documentElement.childNodes,0)[0].nodeType}catch(nt){q=function(e){var t,n=[];while(t=this[e++])n.push(t);return n}}function rt(e){return Y.test(e+"")}function it(){var e,t=[];return e=function(n,r){return t.push(n+=" ")>i.cacheLength&&delete e[t.shift()],e[n]=r}}function ot(e){return e[x]=!0,e}function at(e){var t=p.createElement("div");try{return e(t)}catch(n){return!1}finally{t=null}}function st(e,t,n,r){var i,o,a,s,u,l,f,g,m,v;if((t?t.ownerDocument||t:w)!==p&&c(t),t=t||p,n=n||[],!e||"string"!=typeof e)return n;if(1!==(s=t.nodeType)&&9!==s)return[];if(!d&&!r){if(i=J.exec(e))if(a=i[1]){if(9===s){if(o=t.getElementById(a),!o||!o.parentNode)return n;if(o.id===a)return n.push(o),n}else if(t.ownerDocument&&(o=t.ownerDocument.getElementById(a))&&y(t,o)&&o.id===a)return n.push(o),n}else{if(i[2])return H.apply(n,q.call(t.getElementsByTagName(e),0)),n;if((a=i[3])&&T.getByClassName&&t.getElementsByClassName)return H.apply(n,q.call(t.getElementsByClassName(a),0)),n}if(T.qsa&&!h.test(e)){if(f=!0,g=x,m=t,v=9===s&&e,1===s&&"object"!==t.nodeName.toLowerCase()){l=ft(e),(f=t.getAttribute("id"))?g=f.replace(K,"\\$&"):t.setAttribute("id",g),g="[id='"+g+"'] ",u=l.length;while(u--)l[u]=g+dt(l[u]);m=V.test(e)&&t.parentNode||t,v=l.join(",")}if(v)try{return H.apply(n,q.call(m.querySelectorAll(v),0)),n}catch(b){}finally{f||t.removeAttribute("id")}}}return wt(e.replace(W,"$1"),t,n,r)}a=st.isXML=function(e){var t=e&&(e.ownerDocument||e).documentElement;return t?"HTML"!==t.nodeName:!1},c=st.setDocument=function(e){var n=e?e.ownerDocument||e:w;return n!==p&&9===n.nodeType&&n.documentElement?(p=n,f=n.documentElement,d=a(n),T.tagNameNoComments=at(function(e){return e.appendChild(n.createComment("")),!e.getElementsByTagName("*").length}),T.attributes=at(function(e){e.innerHTML="<select></select>";var t=typeof e.lastChild.getAttribute("multiple");return"boolean"!==t&&"string"!==t}),T.getByClassName=at(function(e){return e.innerHTML="<div class='hidden e'></div><div class='hidden'></div>",e.getElementsByClassName&&e.getElementsByClassName("e").length?(e.lastChild.className="e",2===e.getElementsByClassName("e").length):!1}),T.getByName=at(function(e){e.id=x+0,e.innerHTML="<a name='"+x+"'></a><div name='"+x+"'></div>",f.insertBefore(e,f.firstChild);var t=n.getElementsByName&&n.getElementsByName(x).length===2+n.getElementsByName(x+0).length;return T.getIdNotName=!n.getElementById(x),f.removeChild(e),t}),i.attrHandle=at(function(e){return e.innerHTML="<a href='#'></a>",e.firstChild&&typeof e.firstChild.getAttribute!==A&&"#"===e.firstChild.getAttribute("href")})?{}:{href:function(e){return e.getAttribute("href",2)},type:function(e){return e.getAttribute("type")}},T.getIdNotName?(i.find.ID=function(e,t){if(typeof t.getElementById!==A&&!d){var n=t.getElementById(e);return n&&n.parentNode?[n]:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){return e.getAttribute("id")===t}}):(i.find.ID=function(e,n){if(typeof n.getElementById!==A&&!d){var r=n.getElementById(e);return r?r.id===e||typeof r.getAttributeNode!==A&&r.getAttributeNode("id").value===e?[r]:t:[]}},i.filter.ID=function(e){var t=e.replace(et,tt);return function(e){var n=typeof e.getAttributeNode!==A&&e.getAttributeNode("id");return n&&n.value===t}}),i.find.TAG=T.tagNameNoComments?function(e,n){return typeof n.getElementsByTagName!==A?n.getElementsByTagName(e):t}:function(e,t){var n,r=[],i=0,o=t.getElementsByTagName(e);if("*"===e){while(n=o[i++])1===n.nodeType&&r.push(n);return r}return o},i.find.NAME=T.getByName&&function(e,n){return typeof n.getElementsByName!==A?n.getElementsByName(name):t},i.find.CLASS=T.getByClassName&&function(e,n){return typeof n.getElementsByClassName===A||d?t:n.getElementsByClassName(e)},g=[],h=[":focus"],(T.qsa=rt(n.querySelectorAll))&&(at(function(e){e.innerHTML="<select><option selected=''></option></select>",e.querySelectorAll("[selected]").length||h.push("\\["+_+"*(?:checked|disabled|ismap|multiple|readonly|selected|value)"),e.querySelectorAll(":checked").length||h.push(":checked")}),at(function(e){e.innerHTML="<input type='hidden' i=''/>",e.querySelectorAll("[i^='']").length&&h.push("[*^$]="+_+"*(?:\"\"|'')"),e.querySelectorAll(":enabled").length||h.push(":enabled",":disabled"),e.querySelectorAll("*,:x"),h.push(",.*:")})),(T.matchesSelector=rt(m=f.matchesSelector||f.mozMatchesSelector||f.webkitMatchesSelector||f.oMatchesSelector||f.msMatchesSelector))&&at(function(e){T.disconnectedMatch=m.call(e,"div"),m.call(e,"[s!='']:x"),g.push("!=",R)}),h=RegExp(h.join("|")),g=RegExp(g.join("|")),y=rt(f.contains)||f.compareDocumentPosition?function(e,t){var n=9===e.nodeType?e.documentElement:e,r=t&&t.parentNode;return e===r||!(!r||1!==r.nodeType||!(n.contains?n.contains(r):e.compareDocumentPosition&&16&e.compareDocumentPosition(r)))}:function(e,t){if(t)while(t=t.parentNode)if(t===e)return!0;return!1},v=f.compareDocumentPosition?function(e,t){var r;return e===t?(u=!0,0):(r=t.compareDocumentPosition&&e.compareDocumentPosition&&e.compareDocumentPosition(t))?1&r||e.parentNode&&11===e.parentNode.nodeType?e===n||y(w,e)?-1:t===n||y(w,t)?1:0:4&r?-1:1:e.compareDocumentPosition?-1:1}:function(e,t){var r,i=0,o=e.parentNode,a=t.parentNode,s=[e],l=[t];if(e===t)return u=!0,0;if(!o||!a)return e===n?-1:t===n?1:o?-1:a?1:0;if(o===a)return ut(e,t);r=e;while(r=r.parentNode)s.unshift(r);r=t;while(r=r.parentNode)l.unshift(r);while(s[i]===l[i])i++;return i?ut(s[i],l[i]):s[i]===w?-1:l[i]===w?1:0},u=!1,[0,0].sort(v),T.detectDuplicates=u,p):p},st.matches=function(e,t){return st(e,null,null,t)},st.matchesSelector=function(e,t){if((e.ownerDocument||e)!==p&&c(e),t=t.replace(Z,"='$1']"),!(!T.matchesSelector||d||g&&g.test(t)||h.test(t)))try{var n=m.call(e,t);if(n||T.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(r){}return st(t,p,null,[e]).length>0},st.contains=function(e,t){return(e.ownerDocument||e)!==p&&c(e),y(e,t)},st.attr=function(e,t){var n;return(e.ownerDocument||e)!==p&&c(e),d||(t=t.toLowerCase()),(n=i.attrHandle[t])?n(e):d||T.attributes?e.getAttribute(t):((n=e.getAttributeNode(t))||e.getAttribute(t))&&e[t]===!0?t:n&&n.specified?n.value:null},st.error=function(e){throw Error("Syntax error, unrecognized expression: "+e)},st.uniqueSort=function(e){var t,n=[],r=1,i=0;if(u=!T.detectDuplicates,e.sort(v),u){for(;t=e[r];r++)t===e[r-1]&&(i=n.push(r));while(i--)e.splice(n[i],1)}return e};function ut(e,t){var n=t&&e,r=n&&(~t.sourceIndex||j)-(~e.sourceIndex||j);if(r)return r;if(n)while(n=n.nextSibling)if(n===t)return-1;return e?1:-1}function lt(e){return function(t){var n=t.nodeName.toLowerCase();return"input"===n&&t.type===e}}function ct(e){return function(t){var n=t.nodeName.toLowerCase();return("input"===n||"button"===n)&&t.type===e}}function pt(e){return ot(function(t){return t=+t,ot(function(n,r){var i,o=e([],n.length,t),a=o.length;while(a--)n[i=o[a]]&&(n[i]=!(r[i]=n[i]))})})}o=st.getText=function(e){var t,n="",r=0,i=e.nodeType;if(i){if(1===i||9===i||11===i){if("string"==typeof e.textContent)return e.textContent;for(e=e.firstChild;e;e=e.nextSibling)n+=o(e)}else if(3===i||4===i)return e.nodeValue}else for(;t=e[r];r++)n+=o(t);return n},i=st.selectors={cacheLength:50,createPseudo:ot,match:U,find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(et,tt),e[3]=(e[4]||e[5]||"").replace(et,tt),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||st.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&st.error(e[0]),e},PSEUDO:function(e){var t,n=!e[5]&&e[2];return U.CHILD.test(e[0])?null:(e[4]?e[2]=e[4]:n&&z.test(n)&&(t=ft(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){return"*"===e?function(){return!0}:(e=e.replace(et,tt).toLowerCase(),function(t){return t.nodeName&&t.nodeName.toLowerCase()===e})},CLASS:function(e){var t=k[e+" "];return t||(t=RegExp("(^|"+_+")"+e+"("+_+"|$)"))&&k(e,function(e){return t.test(e.className||typeof e.getAttribute!==A&&e.getAttribute("class")||"")})},ATTR:function(e,t,n){return function(r){var i=st.attr(r,e);return null==i?"!="===t:t?(i+="","="===t?i===n:"!="===t?i!==n:"^="===t?n&&0===i.indexOf(n):"*="===t?n&&i.indexOf(n)>-1:"$="===t?n&&i.slice(-n.length)===n:"~="===t?(" "+i+" ").indexOf(n)>-1:"|="===t?i===n||i.slice(0,n.length+1)===n+"-":!1):!0}},CHILD:function(e,t,n,r,i){var o="nth"!==e.slice(0,3),a="last"!==e.slice(-4),s="of-type"===t;return 1===r&&0===i?function(e){return!!e.parentNode}:function(t,n,u){var l,c,p,f,d,h,g=o!==a?"nextSibling":"previousSibling",m=t.parentNode,y=s&&t.nodeName.toLowerCase(),v=!u&&!s;if(m){if(o){while(g){p=t;while(p=p[g])if(s?p.nodeName.toLowerCase()===y:1===p.nodeType)return!1;h=g="only"===e&&!h&&"nextSibling"}return!0}if(h=[a?m.firstChild:m.lastChild],a&&v){c=m[x]||(m[x]={}),l=c[e]||[],d=l[0]===N&&l[1],f=l[0]===N&&l[2],p=d&&m.childNodes[d];while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if(1===p.nodeType&&++f&&p===t){c[e]=[N,d,f];break}}else if(v&&(l=(t[x]||(t[x]={}))[e])&&l[0]===N)f=l[1];else while(p=++d&&p&&p[g]||(f=d=0)||h.pop())if((s?p.nodeName.toLowerCase()===y:1===p.nodeType)&&++f&&(v&&((p[x]||(p[x]={}))[e]=[N,f]),p===t))break;return f-=i,f===r||0===f%r&&f/r>=0}}},PSEUDO:function(e,t){var n,r=i.pseudos[e]||i.setFilters[e.toLowerCase()]||st.error("unsupported pseudo: "+e);return r[x]?r(t):r.length>1?(n=[e,e,"",t],i.setFilters.hasOwnProperty(e.toLowerCase())?ot(function(e,n){var i,o=r(e,t),a=o.length;while(a--)i=M.call(e,o[a]),e[i]=!(n[i]=o[a])}):function(e){return r(e,0,n)}):r}},pseudos:{not:ot(function(e){var t=[],n=[],r=s(e.replace(W,"$1"));return r[x]?ot(function(e,t,n,i){var o,a=r(e,null,i,[]),s=e.length;while(s--)(o=a[s])&&(e[s]=!(t[s]=o))}):function(e,i,o){return t[0]=e,r(t,null,o,n),!n.pop()}}),has:ot(function(e){return function(t){return st(e,t).length>0}}),contains:ot(function(e){return function(t){return(t.textContent||t.innerText||o(t)).indexOf(e)>-1}}),lang:ot(function(e){return X.test(e||"")||st.error("unsupported lang: "+e),e=e.replace(et,tt).toLowerCase(),function(t){var n;do if(n=d?t.getAttribute("xml:lang")||t.getAttribute("lang"):t.lang)return n=n.toLowerCase(),n===e||0===n.indexOf(e+"-");while((t=t.parentNode)&&1===t.nodeType);return!1}}),target:function(t){var n=e.location&&e.location.hash;return n&&n.slice(1)===t.id},root:function(e){return e===f},focus:function(e){return e===p.activeElement&&(!p.hasFocus||p.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===!1},disabled:function(e){return e.disabled===!0},checked:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&!!e.checked||"option"===t&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,e.selected===!0},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeName>"@"||3===e.nodeType||4===e.nodeType)return!1;return!0},parent:function(e){return!i.pseudos.empty(e)},header:function(e){return Q.test(e.nodeName)},input:function(e){return G.test(e.nodeName)},button:function(e){var t=e.nodeName.toLowerCase();return"input"===t&&"button"===e.type||"button"===t},text:function(e){var t;return"input"===e.nodeName.toLowerCase()&&"text"===e.type&&(null==(t=e.getAttribute("type"))||t.toLowerCase()===e.type)},first:pt(function(){return[0]}),last:pt(function(e,t){return[t-1]}),eq:pt(function(e,t,n){return[0>n?n+t:n]}),even:pt(function(e,t){var n=0;for(;t>n;n+=2)e.push(n);return e}),odd:pt(function(e,t){var n=1;for(;t>n;n+=2)e.push(n);return e}),lt:pt(function(e,t,n){var r=0>n?n+t:n;for(;--r>=0;)e.push(r);return e}),gt:pt(function(e,t,n){var r=0>n?n+t:n;for(;t>++r;)e.push(r);return e})}};for(n in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})i.pseudos[n]=lt(n);for(n in{submit:!0,reset:!0})i.pseudos[n]=ct(n);function ft(e,t){var n,r,o,a,s,u,l,c=E[e+" "];if(c)return t?0:c.slice(0);s=e,u=[],l=i.preFilter;while(s){(!n||(r=$.exec(s)))&&(r&&(s=s.slice(r[0].length)||s),u.push(o=[])),n=!1,(r=I.exec(s))&&(n=r.shift(),o.push({value:n,type:r[0].replace(W," ")}),s=s.slice(n.length));for(a in i.filter)!(r=U[a].exec(s))||l[a]&&!(r=l[a](r))||(n=r.shift(),o.push({value:n,type:a,matches:r}),s=s.slice(n.length));if(!n)break}return t?s.length:s?st.error(e):E(e,u).slice(0)}function dt(e){var t=0,n=e.length,r="";for(;n>t;t++)r+=e[t].value;return r}function ht(e,t,n){var i=t.dir,o=n&&"parentNode"===i,a=C++;return t.first?function(t,n,r){while(t=t[i])if(1===t.nodeType||o)return e(t,n,r)}:function(t,n,s){var u,l,c,p=N+" "+a;if(s){while(t=t[i])if((1===t.nodeType||o)&&e(t,n,s))return!0}else while(t=t[i])if(1===t.nodeType||o)if(c=t[x]||(t[x]={}),(l=c[i])&&l[0]===p){if((u=l[1])===!0||u===r)return u===!0}else if(l=c[i]=[p],l[1]=e(t,n,s)||r,l[1]===!0)return!0}}function gt(e){return e.length>1?function(t,n,r){var i=e.length;while(i--)if(!e[i](t,n,r))return!1;return!0}:e[0]}function mt(e,t,n,r,i){var o,a=[],s=0,u=e.length,l=null!=t;for(;u>s;s++)(o=e[s])&&(!n||n(o,r,i))&&(a.push(o),l&&t.push(s));return a}function yt(e,t,n,r,i,o){return r&&!r[x]&&(r=yt(r)),i&&!i[x]&&(i=yt(i,o)),ot(function(o,a,s,u){var l,c,p,f=[],d=[],h=a.length,g=o||xt(t||"*",s.nodeType?[s]:s,[]),m=!e||!o&&t?g:mt(g,f,e,s,u),y=n?i||(o?e:h||r)?[]:a:m;if(n&&n(m,y,s,u),r){l=mt(y,d),r(l,[],s,u),c=l.length;while(c--)(p=l[c])&&(y[d[c]]=!(m[d[c]]=p))}if(o){if(i||e){if(i){l=[],c=y.length;while(c--)(p=y[c])&&l.push(m[c]=p);i(null,y=[],l,u)}c=y.length;while(c--)(p=y[c])&&(l=i?M.call(o,p):f[c])>-1&&(o[l]=!(a[l]=p))}}else y=mt(y===a?y.splice(h,y.length):y),i?i(null,a,y,u):H.apply(a,y)})}function vt(e){var t,n,r,o=e.length,a=i.relative[e[0].type],s=a||i.relative[" "],u=a?1:0,c=ht(function(e){return e===t},s,!0),p=ht(function(e){return M.call(t,e)>-1},s,!0),f=[function(e,n,r){return!a&&(r||n!==l)||((t=n).nodeType?c(e,n,r):p(e,n,r))}];for(;o>u;u++)if(n=i.relative[e[u].type])f=[ht(gt(f),n)];else{if(n=i.filter[e[u].type].apply(null,e[u].matches),n[x]){for(r=++u;o>r;r++)if(i.relative[e[r].type])break;return yt(u>1&&gt(f),u>1&&dt(e.slice(0,u-1)).replace(W,"$1"),n,r>u&&vt(e.slice(u,r)),o>r&&vt(e=e.slice(r)),o>r&&dt(e))}f.push(n)}return gt(f)}function bt(e,t){var n=0,o=t.length>0,a=e.length>0,s=function(s,u,c,f,d){var h,g,m,y=[],v=0,b="0",x=s&&[],w=null!=d,T=l,C=s||a&&i.find.TAG("*",d&&u.parentNode||u),k=N+=null==T?1:Math.random()||.1;for(w&&(l=u!==p&&u,r=n);null!=(h=C[b]);b++){if(a&&h){g=0;while(m=e[g++])if(m(h,u,c)){f.push(h);break}w&&(N=k,r=++n)}o&&((h=!m&&h)&&v--,s&&x.push(h))}if(v+=b,o&&b!==v){g=0;while(m=t[g++])m(x,y,u,c);if(s){if(v>0)while(b--)x[b]||y[b]||(y[b]=L.call(f));y=mt(y)}H.apply(f,y),w&&!s&&y.length>0&&v+t.length>1&&st.uniqueSort(f)}return w&&(N=k,l=T),x};return o?ot(s):s}s=st.compile=function(e,t){var n,r=[],i=[],o=S[e+" "];if(!o){t||(t=ft(e)),n=t.length;while(n--)o=vt(t[n]),o[x]?r.push(o):i.push(o);o=S(e,bt(i,r))}return o};function xt(e,t,n){var r=0,i=t.length;for(;i>r;r++)st(e,t[r],n);return n}function wt(e,t,n,r){var o,a,u,l,c,p=ft(e);if(!r&&1===p.length){if(a=p[0]=p[0].slice(0),a.length>2&&"ID"===(u=a[0]).type&&9===t.nodeType&&!d&&i.relative[a[1].type]){if(t=i.find.ID(u.matches[0].replace(et,tt),t)[0],!t)return n;e=e.slice(a.shift().value.length)}o=U.needsContext.test(e)?0:a.length;while(o--){if(u=a[o],i.relative[l=u.type])break;if((c=i.find[l])&&(r=c(u.matches[0].replace(et,tt),V.test(a[0].type)&&t.parentNode||t))){if(a.splice(o,1),e=r.length&&dt(a),!e)return H.apply(n,q.call(r,0)),n;break}}}return s(e,p)(r,t,d,n,V.test(e)),n}i.pseudos.nth=i.pseudos.eq;function Tt(){}i.filters=Tt.prototype=i.pseudos,i.setFilters=new Tt,c(),st.attr=b.attr,b.find=st,b.expr=st.selectors,b.expr[":"]=b.expr.pseudos,b.unique=st.uniqueSort,b.text=st.getText,b.isXMLDoc=st.isXML,b.contains=st.contains}(e);var at=/Until$/,st=/^(?:parents|prev(?:Until|All))/,ut=/^.[^:#\[\.,]*$/,lt=b.expr.match.needsContext,ct={children:!0,contents:!0,next:!0,prev:!0};b.fn.extend({find:function(e){var t,n,r,i=this.length;if("string"!=typeof e)return r=this,this.pushStack(b(e).filter(function(){for(t=0;i>t;t++)if(b.contains(r[t],this))return!0}));for(n=[],t=0;i>t;t++)b.find(e,this[t],n);return n=this.pushStack(i>1?b.unique(n):n),n.selector=(this.selector?this.selector+" ":"")+e,n},has:function(e){var t,n=b(e,this),r=n.length;return this.filter(function(){for(t=0;r>t;t++)if(b.contains(this,n[t]))return!0})},not:function(e){return this.pushStack(ft(this,e,!1))},filter:function(e){return this.pushStack(ft(this,e,!0))},is:function(e){return!!e&&("string"==typeof e?lt.test(e)?b(e,this.context).index(this[0])>=0:b.filter(e,this).length>0:this.filter(e).length>0)},closest:function(e,t){var n,r=0,i=this.length,o=[],a=lt.test(e)||"string"!=typeof e?b(e,t||this.context):0;for(;i>r;r++){n=this[r];while(n&&n.ownerDocument&&n!==t&&11!==n.nodeType){if(a?a.index(n)>-1:b.find.matchesSelector(n,e)){o.push(n);break}n=n.parentNode}}return this.pushStack(o.length>1?b.unique(o):o)},index:function(e){return e?"string"==typeof e?b.inArray(this[0],b(e)):b.inArray(e.jquery?e[0]:e,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){var n="string"==typeof e?b(e,t):b.makeArray(e&&e.nodeType?[e]:e),r=b.merge(this.get(),n);return this.pushStack(b.unique(r))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),b.fn.andSelf=b.fn.addBack;function pt(e,t){do e=e[t];while(e&&1!==e.nodeType);return e}b.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return b.dir(e,"parentNode")},parentsUntil:function(e,t,n){return b.dir(e,"parentNode",n)},next:function(e){return pt(e,"nextSibling")},prev:function(e){return pt(e,"previousSibling")},nextAll:function(e){return b.dir(e,"nextSibling")},prevAll:function(e){return b.dir(e,"previousSibling")},nextUntil:function(e,t,n){return b.dir(e,"nextSibling",n)},prevUntil:function(e,t,n){return b.dir(e,"previousSibling",n)},siblings:function(e){return b.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return b.sibling(e.firstChild)},contents:function(e){return b.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:b.merge([],e.childNodes)}},function(e,t){b.fn[e]=function(n,r){var i=b.map(this,t,n);return at.test(e)||(r=n),r&&"string"==typeof r&&(i=b.filter(r,i)),i=this.length>1&&!ct[e]?b.unique(i):i,this.length>1&&st.test(e)&&(i=i.reverse()),this.pushStack(i)}}),b.extend({filter:function(e,t,n){return n&&(e=":not("+e+")"),1===t.length?b.find.matchesSelector(t[0],e)?[t[0]]:[]:b.find.matches(e,t)},dir:function(e,n,r){var i=[],o=e[n];while(o&&9!==o.nodeType&&(r===t||1!==o.nodeType||!b(o).is(r)))1===o.nodeType&&i.push(o),o=o[n];return i},sibling:function(e,t){var n=[];for(;e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n}});function ft(e,t,n){if(t=t||0,b.isFunction(t))return b.grep(e,function(e,r){var i=!!t.call(e,r,e);return i===n});if(t.nodeType)return b.grep(e,function(e){return e===t===n});if("string"==typeof t){var r=b.grep(e,function(e){return 1===e.nodeType});if(ut.test(t))return b.filter(t,r,!n);t=b.filter(t,r)}return b.grep(e,function(e){return b.inArray(e,t)>=0===n})}function dt(e){var t=ht.split("|"),n=e.createDocumentFragment();if(n.createElement)while(t.length)n.createElement(t.pop());return n}var ht="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",gt=/ jQuery\d+="(?:null|\d+)"/g,mt=RegExp("<(?:"+ht+")[\\s/>]","i"),yt=/^\s+/,vt=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bt=/<([\w:]+)/,xt=/<tbody/i,wt=/<|&#?\w+;/,Tt=/<(?:script|style|link)/i,Nt=/^(?:checkbox|radio)$/i,Ct=/checked\s*(?:[^=]|=\s*.checked.)/i,kt=/^$|\/(?:java|ecma)script/i,Et=/^true\/(.*)/,St=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,At={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:b.support.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},jt=dt(o),Dt=jt.appendChild(o.createElement("div"));At.optgroup=At.option,At.tbody=At.tfoot=At.colgroup=At.caption=At.thead,At.th=At.td,b.fn.extend({text:function(e){return b.access(this,function(e){return e===t?b.text(this):this.empty().append((this[0]&&this[0].ownerDocument||o).createTextNode(e))},null,e,arguments.length)},wrapAll:function(e){if(b.isFunction(e))return this.each(function(t){b(this).wrapAll(e.call(this,t))});if(this[0]){var t=b(e,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstChild&&1===e.firstChild.nodeType)e=e.firstChild;return e}).append(this)}return this},wrapInner:function(e){return b.isFunction(e)?this.each(function(t){b(this).wrapInner(e.call(this,t))}):this.each(function(){var t=b(this),n=t.contents();n.length?n.wrapAll(e):t.append(e)})},wrap:function(e){var t=b.isFunction(e);return this.each(function(n){b(this).wrapAll(t?e.call(this,n):e)})},unwrap:function(){return this.parent().each(function(){b.nodeName(this,"body")||b(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.appendChild(e)})},prepend:function(){return this.domManip(arguments,!0,function(e){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&this.insertBefore(e,this.firstChild)})},before:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return this.domManip(arguments,!1,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},remove:function(e,t){var n,r=0;for(;null!=(n=this[r]);r++)(!e||b.filter(e,[n]).length>0)&&(t||1!==n.nodeType||b.cleanData(Ot(n)),n.parentNode&&(t&&b.contains(n.ownerDocument,n)&&Mt(Ot(n,"script")),n.parentNode.removeChild(n)));return this},empty:function(){var e,t=0;for(;null!=(e=this[t]);t++){1===e.nodeType&&b.cleanData(Ot(e,!1));while(e.firstChild)e.removeChild(e.firstChild);e.options&&b.nodeName(e,"select")&&(e.options.length=0)}return this},clone:function(e,t){return e=null==e?!1:e,t=null==t?e:t,this.map(function(){return b.clone(this,e,t)})},html:function(e){return b.access(this,function(e){var n=this[0]||{},r=0,i=this.length;if(e===t)return 1===n.nodeType?n.innerHTML.replace(gt,""):t;if(!("string"!=typeof e||Tt.test(e)||!b.support.htmlSerialize&&mt.test(e)||!b.support.leadingWhitespace&&yt.test(e)||At[(bt.exec(e)||["",""])[1].toLowerCase()])){e=e.replace(vt,"<$1></$2>");try{for(;i>r;r++)n=this[r]||{},1===n.nodeType&&(b.cleanData(Ot(n,!1)),n.innerHTML=e);n=0}catch(o){}}n&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(e){var t=b.isFunction(e);return t||"string"==typeof e||(e=b(e).not(this).detach()),this.domManip([e],!0,function(e){var t=this.nextSibling,n=this.parentNode;n&&(b(this).remove(),n.insertBefore(e,t))})},detach:function(e){return this.remove(e,!0)},domManip:function(e,n,r){e=f.apply([],e);var i,o,a,s,u,l,c=0,p=this.length,d=this,h=p-1,g=e[0],m=b.isFunction(g);if(m||!(1>=p||"string"!=typeof g||b.support.checkClone)&&Ct.test(g))return this.each(function(i){var o=d.eq(i);m&&(e[0]=g.call(this,i,n?o.html():t)),o.domManip(e,n,r)});if(p&&(l=b.buildFragment(e,this[0].ownerDocument,!1,this),i=l.firstChild,1===l.childNodes.length&&(l=i),i)){for(n=n&&b.nodeName(i,"tr"),s=b.map(Ot(l,"script"),Ht),a=s.length;p>c;c++)o=l,c!==h&&(o=b.clone(o,!0,!0),a&&b.merge(s,Ot(o,"script"))),r.call(n&&b.nodeName(this[c],"table")?Lt(this[c],"tbody"):this[c],o,c);if(a)for(u=s[s.length-1].ownerDocument,b.map(s,qt),c=0;a>c;c++)o=s[c],kt.test(o.type||"")&&!b._data(o,"globalEval")&&b.contains(u,o)&&(o.src?b.ajax({url:o.src,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0}):b.globalEval((o.text||o.textContent||o.innerHTML||"").replace(St,"")));l=i=null}return this}});function Lt(e,t){return e.getElementsByTagName(t)[0]||e.appendChild(e.ownerDocument.createElement(t))}function Ht(e){var t=e.getAttributeNode("type");return e.type=(t&&t.specified)+"/"+e.type,e}function qt(e){var t=Et.exec(e.type);return t?e.type=t[1]:e.removeAttribute("type"),e}function Mt(e,t){var n,r=0;for(;null!=(n=e[r]);r++)b._data(n,"globalEval",!t||b._data(t[r],"globalEval"))}function _t(e,t){if(1===t.nodeType&&b.hasData(e)){var n,r,i,o=b._data(e),a=b._data(t,o),s=o.events;if(s){delete a.handle,a.events={};for(n in s)for(r=0,i=s[n].length;i>r;r++)b.event.add(t,n,s[n][r])}a.data&&(a.data=b.extend({},a.data))}}function Ft(e,t){var n,r,i;if(1===t.nodeType){if(n=t.nodeName.toLowerCase(),!b.support.noCloneEvent&&t[b.expando]){i=b._data(t);for(r in i.events)b.removeEvent(t,r,i.handle);t.removeAttribute(b.expando)}"script"===n&&t.text!==e.text?(Ht(t).text=e.text,qt(t)):"object"===n?(t.parentNode&&(t.outerHTML=e.outerHTML),b.support.html5Clone&&e.innerHTML&&!b.trim(t.innerHTML)&&(t.innerHTML=e.innerHTML)):"input"===n&&Nt.test(e.type)?(t.defaultChecked=t.checked=e.checked,t.value!==e.value&&(t.value=e.value)):"option"===n?t.defaultSelected=t.selected=e.defaultSelected:("input"===n||"textarea"===n)&&(t.defaultValue=e.defaultValue)}}b.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,t){b.fn[e]=function(e){var n,r=0,i=[],o=b(e),a=o.length-1;for(;a>=r;r++)n=r===a?this:this.clone(!0),b(o[r])[t](n),d.apply(i,n.get());return this.pushStack(i)}});function Ot(e,n){var r,o,a=0,s=typeof e.getElementsByTagName!==i?e.getElementsByTagName(n||"*"):typeof e.querySelectorAll!==i?e.querySelectorAll(n||"*"):t;if(!s)for(s=[],r=e.childNodes||e;null!=(o=r[a]);a++)!n||b.nodeName(o,n)?s.push(o):b.merge(s,Ot(o,n));return n===t||n&&b.nodeName(e,n)?b.merge([e],s):s}function Bt(e){Nt.test(e.type)&&(e.defaultChecked=e.checked)}b.extend({clone:function(e,t,n){var r,i,o,a,s,u=b.contains(e.ownerDocument,e);if(b.support.html5Clone||b.isXMLDoc(e)||!mt.test("<"+e.nodeName+">")?o=e.cloneNode(!0):(Dt.innerHTML=e.outerHTML,Dt.removeChild(o=Dt.firstChild)),!(b.support.noCloneEvent&&b.support.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||b.isXMLDoc(e)))for(r=Ot(o),s=Ot(e),a=0;null!=(i=s[a]);++a)r[a]&&Ft(i,r[a]);if(t)if(n)for(s=s||Ot(e),r=r||Ot(o),a=0;null!=(i=s[a]);a++)_t(i,r[a]);else _t(e,o);return r=Ot(o,"script"),r.length>0&&Mt(r,!u&&Ot(e,"script")),r=s=i=null,o},buildFragment:function(e,t,n,r){var i,o,a,s,u,l,c,p=e.length,f=dt(t),d=[],h=0;for(;p>h;h++)if(o=e[h],o||0===o)if("object"===b.type(o))b.merge(d,o.nodeType?[o]:o);else if(wt.test(o)){s=s||f.appendChild(t.createElement("div")),u=(bt.exec(o)||["",""])[1].toLowerCase(),c=At[u]||At._default,s.innerHTML=c[1]+o.replace(vt,"<$1></$2>")+c[2],i=c[0];while(i--)s=s.lastChild;if(!b.support.leadingWhitespace&&yt.test(o)&&d.push(t.createTextNode(yt.exec(o)[0])),!b.support.tbody){o="table"!==u||xt.test(o)?"<table>"!==c[1]||xt.test(o)?0:s:s.firstChild,i=o&&o.childNodes.length;while(i--)b.nodeName(l=o.childNodes[i],"tbody")&&!l.childNodes.length&&o.removeChild(l)
}b.merge(d,s.childNodes),s.textContent="";while(s.firstChild)s.removeChild(s.firstChild);s=f.lastChild}else d.push(t.createTextNode(o));s&&f.removeChild(s),b.support.appendChecked||b.grep(Ot(d,"input"),Bt),h=0;while(o=d[h++])if((!r||-1===b.inArray(o,r))&&(a=b.contains(o.ownerDocument,o),s=Ot(f.appendChild(o),"script"),a&&Mt(s),n)){i=0;while(o=s[i++])kt.test(o.type||"")&&n.push(o)}return s=null,f},cleanData:function(e,t){var n,r,o,a,s=0,u=b.expando,l=b.cache,p=b.support.deleteExpando,f=b.event.special;for(;null!=(n=e[s]);s++)if((t||b.acceptData(n))&&(o=n[u],a=o&&l[o])){if(a.events)for(r in a.events)f[r]?b.event.remove(n,r):b.removeEvent(n,r,a.handle);l[o]&&(delete l[o],p?delete n[u]:typeof n.removeAttribute!==i?n.removeAttribute(u):n[u]=null,c.push(o))}}});var Pt,Rt,Wt,$t=/alpha\([^)]*\)/i,It=/opacity\s*=\s*([^)]*)/,zt=/^(top|right|bottom|left)$/,Xt=/^(none|table(?!-c[ea]).+)/,Ut=/^margin/,Vt=RegExp("^("+x+")(.*)$","i"),Yt=RegExp("^("+x+")(?!px)[a-z%]+$","i"),Jt=RegExp("^([+-])=("+x+")","i"),Gt={BODY:"block"},Qt={position:"absolute",visibility:"hidden",display:"block"},Kt={letterSpacing:0,fontWeight:400},Zt=["Top","Right","Bottom","Left"],en=["Webkit","O","Moz","ms"];function tn(e,t){if(t in e)return t;var n=t.charAt(0).toUpperCase()+t.slice(1),r=t,i=en.length;while(i--)if(t=en[i]+n,t in e)return t;return r}function nn(e,t){return e=t||e,"none"===b.css(e,"display")||!b.contains(e.ownerDocument,e)}function rn(e,t){var n,r,i,o=[],a=0,s=e.length;for(;s>a;a++)r=e[a],r.style&&(o[a]=b._data(r,"olddisplay"),n=r.style.display,t?(o[a]||"none"!==n||(r.style.display=""),""===r.style.display&&nn(r)&&(o[a]=b._data(r,"olddisplay",un(r.nodeName)))):o[a]||(i=nn(r),(n&&"none"!==n||!i)&&b._data(r,"olddisplay",i?n:b.css(r,"display"))));for(a=0;s>a;a++)r=e[a],r.style&&(t&&"none"!==r.style.display&&""!==r.style.display||(r.style.display=t?o[a]||"":"none"));return e}b.fn.extend({css:function(e,n){return b.access(this,function(e,n,r){var i,o,a={},s=0;if(b.isArray(n)){for(o=Rt(e),i=n.length;i>s;s++)a[n[s]]=b.css(e,n[s],!1,o);return a}return r!==t?b.style(e,n,r):b.css(e,n)},e,n,arguments.length>1)},show:function(){return rn(this,!0)},hide:function(){return rn(this)},toggle:function(e){var t="boolean"==typeof e;return this.each(function(){(t?e:nn(this))?b(this).show():b(this).hide()})}}),b.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Wt(e,"opacity");return""===n?"1":n}}}},cssNumber:{columnCount:!0,fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":b.support.cssFloat?"cssFloat":"styleFloat"},style:function(e,n,r,i){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var o,a,s,u=b.camelCase(n),l=e.style;if(n=b.cssProps[u]||(b.cssProps[u]=tn(l,u)),s=b.cssHooks[n]||b.cssHooks[u],r===t)return s&&"get"in s&&(o=s.get(e,!1,i))!==t?o:l[n];if(a=typeof r,"string"===a&&(o=Jt.exec(r))&&(r=(o[1]+1)*o[2]+parseFloat(b.css(e,n)),a="number"),!(null==r||"number"===a&&isNaN(r)||("number"!==a||b.cssNumber[u]||(r+="px"),b.support.clearCloneStyle||""!==r||0!==n.indexOf("background")||(l[n]="inherit"),s&&"set"in s&&(r=s.set(e,r,i))===t)))try{l[n]=r}catch(c){}}},css:function(e,n,r,i){var o,a,s,u=b.camelCase(n);return n=b.cssProps[u]||(b.cssProps[u]=tn(e.style,u)),s=b.cssHooks[n]||b.cssHooks[u],s&&"get"in s&&(a=s.get(e,!0,r)),a===t&&(a=Wt(e,n,i)),"normal"===a&&n in Kt&&(a=Kt[n]),""===r||r?(o=parseFloat(a),r===!0||b.isNumeric(o)?o||0:a):a},swap:function(e,t,n,r){var i,o,a={};for(o in t)a[o]=e.style[o],e.style[o]=t[o];i=n.apply(e,r||[]);for(o in t)e.style[o]=a[o];return i}}),e.getComputedStyle?(Rt=function(t){return e.getComputedStyle(t,null)},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s.getPropertyValue(n)||s[n]:t,l=e.style;return s&&(""!==u||b.contains(e.ownerDocument,e)||(u=b.style(e,n)),Yt.test(u)&&Ut.test(n)&&(i=l.width,o=l.minWidth,a=l.maxWidth,l.minWidth=l.maxWidth=l.width=u,u=s.width,l.width=i,l.minWidth=o,l.maxWidth=a)),u}):o.documentElement.currentStyle&&(Rt=function(e){return e.currentStyle},Wt=function(e,n,r){var i,o,a,s=r||Rt(e),u=s?s[n]:t,l=e.style;return null==u&&l&&l[n]&&(u=l[n]),Yt.test(u)&&!zt.test(n)&&(i=l.left,o=e.runtimeStyle,a=o&&o.left,a&&(o.left=e.currentStyle.left),l.left="fontSize"===n?"1em":u,u=l.pixelLeft+"px",l.left=i,a&&(o.left=a)),""===u?"auto":u});function on(e,t,n){var r=Vt.exec(t);return r?Math.max(0,r[1]-(n||0))+(r[2]||"px"):t}function an(e,t,n,r,i){var o=n===(r?"border":"content")?4:"width"===t?1:0,a=0;for(;4>o;o+=2)"margin"===n&&(a+=b.css(e,n+Zt[o],!0,i)),r?("content"===n&&(a-=b.css(e,"padding"+Zt[o],!0,i)),"margin"!==n&&(a-=b.css(e,"border"+Zt[o]+"Width",!0,i))):(a+=b.css(e,"padding"+Zt[o],!0,i),"padding"!==n&&(a+=b.css(e,"border"+Zt[o]+"Width",!0,i)));return a}function sn(e,t,n){var r=!0,i="width"===t?e.offsetWidth:e.offsetHeight,o=Rt(e),a=b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,o);if(0>=i||null==i){if(i=Wt(e,t,o),(0>i||null==i)&&(i=e.style[t]),Yt.test(i))return i;r=a&&(b.support.boxSizingReliable||i===e.style[t]),i=parseFloat(i)||0}return i+an(e,t,n||(a?"border":"content"),r,o)+"px"}function un(e){var t=o,n=Gt[e];return n||(n=ln(e,t),"none"!==n&&n||(Pt=(Pt||b("<iframe frameborder='0' width='0' height='0'/>").css("cssText","display:block !important")).appendTo(t.documentElement),t=(Pt[0].contentWindow||Pt[0].contentDocument).document,t.write("<!doctype html><html><body>"),t.close(),n=ln(e,t),Pt.detach()),Gt[e]=n),n}function ln(e,t){var n=b(t.createElement(e)).appendTo(t.body),r=b.css(n[0],"display");return n.remove(),r}b.each(["height","width"],function(e,n){b.cssHooks[n]={get:function(e,r,i){return r?0===e.offsetWidth&&Xt.test(b.css(e,"display"))?b.swap(e,Qt,function(){return sn(e,n,i)}):sn(e,n,i):t},set:function(e,t,r){var i=r&&Rt(e);return on(e,t,r?an(e,n,r,b.support.boxSizing&&"border-box"===b.css(e,"boxSizing",!1,i),i):0)}}}),b.support.opacity||(b.cssHooks.opacity={get:function(e,t){return It.test((t&&e.currentStyle?e.currentStyle.filter:e.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":t?"1":""},set:function(e,t){var n=e.style,r=e.currentStyle,i=b.isNumeric(t)?"alpha(opacity="+100*t+")":"",o=r&&r.filter||n.filter||"";n.zoom=1,(t>=1||""===t)&&""===b.trim(o.replace($t,""))&&n.removeAttribute&&(n.removeAttribute("filter"),""===t||r&&!r.filter)||(n.filter=$t.test(o)?o.replace($t,i):o+" "+i)}}),b(function(){b.support.reliableMarginRight||(b.cssHooks.marginRight={get:function(e,n){return n?b.swap(e,{display:"inline-block"},Wt,[e,"marginRight"]):t}}),!b.support.pixelPosition&&b.fn.position&&b.each(["top","left"],function(e,n){b.cssHooks[n]={get:function(e,r){return r?(r=Wt(e,n),Yt.test(r)?b(e).position()[n]+"px":r):t}}})}),b.expr&&b.expr.filters&&(b.expr.filters.hidden=function(e){return 0>=e.offsetWidth&&0>=e.offsetHeight||!b.support.reliableHiddenOffsets&&"none"===(e.style&&e.style.display||b.css(e,"display"))},b.expr.filters.visible=function(e){return!b.expr.filters.hidden(e)}),b.each({margin:"",padding:"",border:"Width"},function(e,t){b.cssHooks[e+t]={expand:function(n){var r=0,i={},o="string"==typeof n?n.split(" "):[n];for(;4>r;r++)i[e+Zt[r]+t]=o[r]||o[r-2]||o[0];return i}},Ut.test(e)||(b.cssHooks[e+t].set=on)});var cn=/%20/g,pn=/\[\]$/,fn=/\r?\n/g,dn=/^(?:submit|button|image|reset|file)$/i,hn=/^(?:input|select|textarea|keygen)/i;b.fn.extend({serialize:function(){return b.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=b.prop(this,"elements");return e?b.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!b(this).is(":disabled")&&hn.test(this.nodeName)&&!dn.test(e)&&(this.checked||!Nt.test(e))}).map(function(e,t){var n=b(this).val();return null==n?null:b.isArray(n)?b.map(n,function(e){return{name:t.name,value:e.replace(fn,"\r\n")}}):{name:t.name,value:n.replace(fn,"\r\n")}}).get()}}),b.param=function(e,n){var r,i=[],o=function(e,t){t=b.isFunction(t)?t():null==t?"":t,i[i.length]=encodeURIComponent(e)+"="+encodeURIComponent(t)};if(n===t&&(n=b.ajaxSettings&&b.ajaxSettings.traditional),b.isArray(e)||e.jquery&&!b.isPlainObject(e))b.each(e,function(){o(this.name,this.value)});else for(r in e)gn(r,e[r],n,o);return i.join("&").replace(cn,"+")};function gn(e,t,n,r){var i;if(b.isArray(t))b.each(t,function(t,i){n||pn.test(e)?r(e,i):gn(e+"["+("object"==typeof i?t:"")+"]",i,n,r)});else if(n||"object"!==b.type(t))r(e,t);else for(i in t)gn(e+"["+i+"]",t[i],n,r)}b.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(e,t){b.fn[t]=function(e,n){return arguments.length>0?this.on(t,null,e,n):this.trigger(t)}}),b.fn.hover=function(e,t){return this.mouseenter(e).mouseleave(t||e)};var mn,yn,vn=b.now(),bn=/\?/,xn=/#.*$/,wn=/([?&])_=[^&]*/,Tn=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Nn=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Cn=/^(?:GET|HEAD)$/,kn=/^\/\//,En=/^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,Sn=b.fn.load,An={},jn={},Dn="*/".concat("*");try{yn=a.href}catch(Ln){yn=o.createElement("a"),yn.href="",yn=yn.href}mn=En.exec(yn.toLowerCase())||[];function Hn(e){return function(t,n){"string"!=typeof t&&(n=t,t="*");var r,i=0,o=t.toLowerCase().match(w)||[];if(b.isFunction(n))while(r=o[i++])"+"===r[0]?(r=r.slice(1)||"*",(e[r]=e[r]||[]).unshift(n)):(e[r]=e[r]||[]).push(n)}}function qn(e,n,r,i){var o={},a=e===jn;function s(u){var l;return o[u]=!0,b.each(e[u]||[],function(e,u){var c=u(n,r,i);return"string"!=typeof c||a||o[c]?a?!(l=c):t:(n.dataTypes.unshift(c),s(c),!1)}),l}return s(n.dataTypes[0])||!o["*"]&&s("*")}function Mn(e,n){var r,i,o=b.ajaxSettings.flatOptions||{};for(i in n)n[i]!==t&&((o[i]?e:r||(r={}))[i]=n[i]);return r&&b.extend(!0,e,r),e}b.fn.load=function(e,n,r){if("string"!=typeof e&&Sn)return Sn.apply(this,arguments);var i,o,a,s=this,u=e.indexOf(" ");return u>=0&&(i=e.slice(u,e.length),e=e.slice(0,u)),b.isFunction(n)?(r=n,n=t):n&&"object"==typeof n&&(a="POST"),s.length>0&&b.ajax({url:e,type:a,dataType:"html",data:n}).done(function(e){o=arguments,s.html(i?b("<div>").append(b.parseHTML(e)).find(i):e)}).complete(r&&function(e,t){s.each(r,o||[e.responseText,t,e])}),this},b.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){b.fn[t]=function(e){return this.on(t,e)}}),b.each(["get","post"],function(e,n){b[n]=function(e,r,i,o){return b.isFunction(r)&&(o=o||i,i=r,r=t),b.ajax({url:e,type:n,dataType:o,data:r,success:i})}}),b.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:yn,type:"GET",isLocal:Nn.test(mn[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Dn,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":e.String,"text html":!0,"text json":b.parseJSON,"text xml":b.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?Mn(Mn(e,b.ajaxSettings),t):Mn(b.ajaxSettings,e)},ajaxPrefilter:Hn(An),ajaxTransport:Hn(jn),ajax:function(e,n){"object"==typeof e&&(n=e,e=t),n=n||{};var r,i,o,a,s,u,l,c,p=b.ajaxSetup({},n),f=p.context||p,d=p.context&&(f.nodeType||f.jquery)?b(f):b.event,h=b.Deferred(),g=b.Callbacks("once memory"),m=p.statusCode||{},y={},v={},x=0,T="canceled",N={readyState:0,getResponseHeader:function(e){var t;if(2===x){if(!c){c={};while(t=Tn.exec(a))c[t[1].toLowerCase()]=t[2]}t=c[e.toLowerCase()]}return null==t?null:t},getAllResponseHeaders:function(){return 2===x?a:null},setRequestHeader:function(e,t){var n=e.toLowerCase();return x||(e=v[n]=v[n]||e,y[e]=t),this},overrideMimeType:function(e){return x||(p.mimeType=e),this},statusCode:function(e){var t;if(e)if(2>x)for(t in e)m[t]=[m[t],e[t]];else N.always(e[N.status]);return this},abort:function(e){var t=e||T;return l&&l.abort(t),k(0,t),this}};if(h.promise(N).complete=g.add,N.success=N.done,N.error=N.fail,p.url=((e||p.url||yn)+"").replace(xn,"").replace(kn,mn[1]+"//"),p.type=n.method||n.type||p.method||p.type,p.dataTypes=b.trim(p.dataType||"*").toLowerCase().match(w)||[""],null==p.crossDomain&&(r=En.exec(p.url.toLowerCase()),p.crossDomain=!(!r||r[1]===mn[1]&&r[2]===mn[2]&&(r[3]||("http:"===r[1]?80:443))==(mn[3]||("http:"===mn[1]?80:443)))),p.data&&p.processData&&"string"!=typeof p.data&&(p.data=b.param(p.data,p.traditional)),qn(An,p,n,N),2===x)return N;u=p.global,u&&0===b.active++&&b.event.trigger("ajaxStart"),p.type=p.type.toUpperCase(),p.hasContent=!Cn.test(p.type),o=p.url,p.hasContent||(p.data&&(o=p.url+=(bn.test(o)?"&":"?")+p.data,delete p.data),p.cache===!1&&(p.url=wn.test(o)?o.replace(wn,"$1_="+vn++):o+(bn.test(o)?"&":"?")+"_="+vn++)),p.ifModified&&(b.lastModified[o]&&N.setRequestHeader("If-Modified-Since",b.lastModified[o]),b.etag[o]&&N.setRequestHeader("If-None-Match",b.etag[o])),(p.data&&p.hasContent&&p.contentType!==!1||n.contentType)&&N.setRequestHeader("Content-Type",p.contentType),N.setRequestHeader("Accept",p.dataTypes[0]&&p.accepts[p.dataTypes[0]]?p.accepts[p.dataTypes[0]]+("*"!==p.dataTypes[0]?", "+Dn+"; q=0.01":""):p.accepts["*"]);for(i in p.headers)N.setRequestHeader(i,p.headers[i]);if(p.beforeSend&&(p.beforeSend.call(f,N,p)===!1||2===x))return N.abort();T="abort";for(i in{success:1,error:1,complete:1})N[i](p[i]);if(l=qn(jn,p,n,N)){N.readyState=1,u&&d.trigger("ajaxSend",[N,p]),p.async&&p.timeout>0&&(s=setTimeout(function(){N.abort("timeout")},p.timeout));try{x=1,l.send(y,k)}catch(C){if(!(2>x))throw C;k(-1,C)}}else k(-1,"No Transport");function k(e,n,r,i){var c,y,v,w,T,C=n;2!==x&&(x=2,s&&clearTimeout(s),l=t,a=i||"",N.readyState=e>0?4:0,r&&(w=_n(p,N,r)),e>=200&&300>e||304===e?(p.ifModified&&(T=N.getResponseHeader("Last-Modified"),T&&(b.lastModified[o]=T),T=N.getResponseHeader("etag"),T&&(b.etag[o]=T)),204===e?(c=!0,C="nocontent"):304===e?(c=!0,C="notmodified"):(c=Fn(p,w),C=c.state,y=c.data,v=c.error,c=!v)):(v=C,(e||!C)&&(C="error",0>e&&(e=0))),N.status=e,N.statusText=(n||C)+"",c?h.resolveWith(f,[y,C,N]):h.rejectWith(f,[N,C,v]),N.statusCode(m),m=t,u&&d.trigger(c?"ajaxSuccess":"ajaxError",[N,p,c?y:v]),g.fireWith(f,[N,C]),u&&(d.trigger("ajaxComplete",[N,p]),--b.active||b.event.trigger("ajaxStop")))}return N},getScript:function(e,n){return b.get(e,t,n,"script")},getJSON:function(e,t,n){return b.get(e,t,n,"json")}});function _n(e,n,r){var i,o,a,s,u=e.contents,l=e.dataTypes,c=e.responseFields;for(s in c)s in r&&(n[c[s]]=r[s]);while("*"===l[0])l.shift(),o===t&&(o=e.mimeType||n.getResponseHeader("Content-Type"));if(o)for(s in u)if(u[s]&&u[s].test(o)){l.unshift(s);break}if(l[0]in r)a=l[0];else{for(s in r){if(!l[0]||e.converters[s+" "+l[0]]){a=s;break}i||(i=s)}a=a||i}return a?(a!==l[0]&&l.unshift(a),r[a]):t}function Fn(e,t){var n,r,i,o,a={},s=0,u=e.dataTypes.slice(),l=u[0];if(e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u[1])for(i in e.converters)a[i.toLowerCase()]=e.converters[i];for(;r=u[++s];)if("*"!==r){if("*"!==l&&l!==r){if(i=a[l+" "+r]||a["* "+r],!i)for(n in a)if(o=n.split(" "),o[1]===r&&(i=a[l+" "+o[0]]||a["* "+o[0]])){i===!0?i=a[n]:a[n]!==!0&&(r=o[0],u.splice(s--,0,r));break}if(i!==!0)if(i&&e["throws"])t=i(t);else try{t=i(t)}catch(c){return{state:"parsererror",error:i?c:"No conversion from "+l+" to "+r}}}l=r}return{state:"success",data:t}}b.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){return b.globalEval(e),e}}}),b.ajaxPrefilter("script",function(e){e.cache===t&&(e.cache=!1),e.crossDomain&&(e.type="GET",e.global=!1)}),b.ajaxTransport("script",function(e){if(e.crossDomain){var n,r=o.head||b("head")[0]||o.documentElement;return{send:function(t,i){n=o.createElement("script"),n.async=!0,e.scriptCharset&&(n.charset=e.scriptCharset),n.src=e.url,n.onload=n.onreadystatechange=function(e,t){(t||!n.readyState||/loaded|complete/.test(n.readyState))&&(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),n=null,t||i(200,"success"))},r.insertBefore(n,r.firstChild)},abort:function(){n&&n.onload(t,!0)}}}});var On=[],Bn=/(=)\?(?=&|$)|\?\?/;b.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=On.pop()||b.expando+"_"+vn++;return this[e]=!0,e}}),b.ajaxPrefilter("json jsonp",function(n,r,i){var o,a,s,u=n.jsonp!==!1&&(Bn.test(n.url)?"url":"string"==typeof n.data&&!(n.contentType||"").indexOf("application/x-www-form-urlencoded")&&Bn.test(n.data)&&"data");return u||"jsonp"===n.dataTypes[0]?(o=n.jsonpCallback=b.isFunction(n.jsonpCallback)?n.jsonpCallback():n.jsonpCallback,u?n[u]=n[u].replace(Bn,"$1"+o):n.jsonp!==!1&&(n.url+=(bn.test(n.url)?"&":"?")+n.jsonp+"="+o),n.converters["script json"]=function(){return s||b.error(o+" was not called"),s[0]},n.dataTypes[0]="json",a=e[o],e[o]=function(){s=arguments},i.always(function(){e[o]=a,n[o]&&(n.jsonpCallback=r.jsonpCallback,On.push(o)),s&&b.isFunction(a)&&a(s[0]),s=a=t}),"script"):t});var Pn,Rn,Wn=0,$n=e.ActiveXObject&&function(){var e;for(e in Pn)Pn[e](t,!0)};function In(){try{return new e.XMLHttpRequest}catch(t){}}function zn(){try{return new e.ActiveXObject("Microsoft.XMLHTTP")}catch(t){}}b.ajaxSettings.xhr=e.ActiveXObject?function(){return!this.isLocal&&In()||zn()}:In,Rn=b.ajaxSettings.xhr(),b.support.cors=!!Rn&&"withCredentials"in Rn,Rn=b.support.ajax=!!Rn,Rn&&b.ajaxTransport(function(n){if(!n.crossDomain||b.support.cors){var r;return{send:function(i,o){var a,s,u=n.xhr();if(n.username?u.open(n.type,n.url,n.async,n.username,n.password):u.open(n.type,n.url,n.async),n.xhrFields)for(s in n.xhrFields)u[s]=n.xhrFields[s];n.mimeType&&u.overrideMimeType&&u.overrideMimeType(n.mimeType),n.crossDomain||i["X-Requested-With"]||(i["X-Requested-With"]="XMLHttpRequest");try{for(s in i)u.setRequestHeader(s,i[s])}catch(l){}u.send(n.hasContent&&n.data||null),r=function(e,i){var s,l,c,p;try{if(r&&(i||4===u.readyState))if(r=t,a&&(u.onreadystatechange=b.noop,$n&&delete Pn[a]),i)4!==u.readyState&&u.abort();else{p={},s=u.status,l=u.getAllResponseHeaders(),"string"==typeof u.responseText&&(p.text=u.responseText);try{c=u.statusText}catch(f){c=""}s||!n.isLocal||n.crossDomain?1223===s&&(s=204):s=p.text?200:404}}catch(d){i||o(-1,d)}p&&o(s,c,p,l)},n.async?4===u.readyState?setTimeout(r):(a=++Wn,$n&&(Pn||(Pn={},b(e).unload($n)),Pn[a]=r),u.onreadystatechange=r):r()},abort:function(){r&&r(t,!0)}}}});var Xn,Un,Vn=/^(?:toggle|show|hide)$/,Yn=RegExp("^(?:([+-])=|)("+x+")([a-z%]*)$","i"),Jn=/queueHooks$/,Gn=[nr],Qn={"*":[function(e,t){var n,r,i=this.createTween(e,t),o=Yn.exec(t),a=i.cur(),s=+a||0,u=1,l=20;if(o){if(n=+o[2],r=o[3]||(b.cssNumber[e]?"":"px"),"px"!==r&&s){s=b.css(i.elem,e,!0)||n||1;do u=u||".5",s/=u,b.style(i.elem,e,s+r);while(u!==(u=i.cur()/a)&&1!==u&&--l)}i.unit=r,i.start=s,i.end=o[1]?s+(o[1]+1)*n:n}return i}]};function Kn(){return setTimeout(function(){Xn=t}),Xn=b.now()}function Zn(e,t){b.each(t,function(t,n){var r=(Qn[t]||[]).concat(Qn["*"]),i=0,o=r.length;for(;o>i;i++)if(r[i].call(e,t,n))return})}function er(e,t,n){var r,i,o=0,a=Gn.length,s=b.Deferred().always(function(){delete u.elem}),u=function(){if(i)return!1;var t=Xn||Kn(),n=Math.max(0,l.startTime+l.duration-t),r=n/l.duration||0,o=1-r,a=0,u=l.tweens.length;for(;u>a;a++)l.tweens[a].run(o);return s.notifyWith(e,[l,o,n]),1>o&&u?n:(s.resolveWith(e,[l]),!1)},l=s.promise({elem:e,props:b.extend({},t),opts:b.extend(!0,{specialEasing:{}},n),originalProperties:t,originalOptions:n,startTime:Xn||Kn(),duration:n.duration,tweens:[],createTween:function(t,n){var r=b.Tween(e,l.opts,t,n,l.opts.specialEasing[t]||l.opts.easing);return l.tweens.push(r),r},stop:function(t){var n=0,r=t?l.tweens.length:0;if(i)return this;for(i=!0;r>n;n++)l.tweens[n].run(1);return t?s.resolveWith(e,[l,t]):s.rejectWith(e,[l,t]),this}}),c=l.props;for(tr(c,l.opts.specialEasing);a>o;o++)if(r=Gn[o].call(l,e,c,l.opts))return r;return Zn(l,c),b.isFunction(l.opts.start)&&l.opts.start.call(e,l),b.fx.timer(b.extend(u,{elem:e,anim:l,queue:l.opts.queue})),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always)}function tr(e,t){var n,r,i,o,a;for(i in e)if(r=b.camelCase(i),o=t[r],n=e[i],b.isArray(n)&&(o=n[1],n=e[i]=n[0]),i!==r&&(e[r]=n,delete e[i]),a=b.cssHooks[r],a&&"expand"in a){n=a.expand(n),delete e[r];for(i in n)i in e||(e[i]=n[i],t[i]=o)}else t[r]=o}b.Animation=b.extend(er,{tweener:function(e,t){b.isFunction(e)?(t=e,e=["*"]):e=e.split(" ");var n,r=0,i=e.length;for(;i>r;r++)n=e[r],Qn[n]=Qn[n]||[],Qn[n].unshift(t)},prefilter:function(e,t){t?Gn.unshift(e):Gn.push(e)}});function nr(e,t,n){var r,i,o,a,s,u,l,c,p,f=this,d=e.style,h={},g=[],m=e.nodeType&&nn(e);n.queue||(c=b._queueHooks(e,"fx"),null==c.unqueued&&(c.unqueued=0,p=c.empty.fire,c.empty.fire=function(){c.unqueued||p()}),c.unqueued++,f.always(function(){f.always(function(){c.unqueued--,b.queue(e,"fx").length||c.empty.fire()})})),1===e.nodeType&&("height"in t||"width"in t)&&(n.overflow=[d.overflow,d.overflowX,d.overflowY],"inline"===b.css(e,"display")&&"none"===b.css(e,"float")&&(b.support.inlineBlockNeedsLayout&&"inline"!==un(e.nodeName)?d.zoom=1:d.display="inline-block")),n.overflow&&(d.overflow="hidden",b.support.shrinkWrapBlocks||f.always(function(){d.overflow=n.overflow[0],d.overflowX=n.overflow[1],d.overflowY=n.overflow[2]}));for(i in t)if(a=t[i],Vn.exec(a)){if(delete t[i],u=u||"toggle"===a,a===(m?"hide":"show"))continue;g.push(i)}if(o=g.length){s=b._data(e,"fxshow")||b._data(e,"fxshow",{}),"hidden"in s&&(m=s.hidden),u&&(s.hidden=!m),m?b(e).show():f.done(function(){b(e).hide()}),f.done(function(){var t;b._removeData(e,"fxshow");for(t in h)b.style(e,t,h[t])});for(i=0;o>i;i++)r=g[i],l=f.createTween(r,m?s[r]:0),h[r]=s[r]||b.style(e,r),r in s||(s[r]=l.start,m&&(l.end=l.start,l.start="width"===r||"height"===r?1:0))}}function rr(e,t,n,r,i){return new rr.prototype.init(e,t,n,r,i)}b.Tween=rr,rr.prototype={constructor:rr,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||"swing",this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(b.cssNumber[n]?"":"px")},cur:function(){var e=rr.propHooks[this.prop];return e&&e.get?e.get(this):rr.propHooks._default.get(this)},run:function(e){var t,n=rr.propHooks[this.prop];return this.pos=t=this.options.duration?b.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):rr.propHooks._default.set(this),this}},rr.prototype.init.prototype=rr.prototype,rr.propHooks={_default:{get:function(e){var t;return null==e.elem[e.prop]||e.elem.style&&null!=e.elem.style[e.prop]?(t=b.css(e.elem,e.prop,""),t&&"auto"!==t?t:0):e.elem[e.prop]},set:function(e){b.fx.step[e.prop]?b.fx.step[e.prop](e):e.elem.style&&(null!=e.elem.style[b.cssProps[e.prop]]||b.cssHooks[e.prop])?b.style(e.elem,e.prop,e.now+e.unit):e.elem[e.prop]=e.now}}},rr.propHooks.scrollTop=rr.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},b.each(["toggle","show","hide"],function(e,t){var n=b.fn[t];b.fn[t]=function(e,r,i){return null==e||"boolean"==typeof e?n.apply(this,arguments):this.animate(ir(t,!0),e,r,i)}}),b.fn.extend({fadeTo:function(e,t,n,r){return this.filter(nn).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(e,t,n,r){var i=b.isEmptyObject(e),o=b.speed(t,n,r),a=function(){var t=er(this,b.extend({},e),o);a.finish=function(){t.stop(!0)},(i||b._data(this,"finish"))&&t.stop(!0)};return a.finish=a,i||o.queue===!1?this.each(a):this.queue(o.queue,a)},stop:function(e,n,r){var i=function(e){var t=e.stop;delete e.stop,t(r)};return"string"!=typeof e&&(r=n,n=e,e=t),n&&e!==!1&&this.queue(e||"fx",[]),this.each(function(){var t=!0,n=null!=e&&e+"queueHooks",o=b.timers,a=b._data(this);if(n)a[n]&&a[n].stop&&i(a[n]);else for(n in a)a[n]&&a[n].stop&&Jn.test(n)&&i(a[n]);for(n=o.length;n--;)o[n].elem!==this||null!=e&&o[n].queue!==e||(o[n].anim.stop(r),t=!1,o.splice(n,1));(t||!r)&&b.dequeue(this,e)})},finish:function(e){return e!==!1&&(e=e||"fx"),this.each(function(){var t,n=b._data(this),r=n[e+"queue"],i=n[e+"queueHooks"],o=b.timers,a=r?r.length:0;for(n.finish=!0,b.queue(this,e,[]),i&&i.cur&&i.cur.finish&&i.cur.finish.call(this),t=o.length;t--;)o[t].elem===this&&o[t].queue===e&&(o[t].anim.stop(!0),o.splice(t,1));for(t=0;a>t;t++)r[t]&&r[t].finish&&r[t].finish.call(this);delete n.finish})}});function ir(e,t){var n,r={height:e},i=0;for(t=t?1:0;4>i;i+=2-t)n=Zt[i],r["margin"+n]=r["padding"+n]=e;return t&&(r.opacity=r.width=e),r}b.each({slideDown:ir("show"),slideUp:ir("hide"),slideToggle:ir("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,t){b.fn[e]=function(e,n,r){return this.animate(t,e,n,r)}}),b.speed=function(e,t,n){var r=e&&"object"==typeof e?b.extend({},e):{complete:n||!n&&t||b.isFunction(e)&&e,duration:e,easing:n&&t||t&&!b.isFunction(t)&&t};return r.duration=b.fx.off?0:"number"==typeof r.duration?r.duration:r.duration in b.fx.speeds?b.fx.speeds[r.duration]:b.fx.speeds._default,(null==r.queue||r.queue===!0)&&(r.queue="fx"),r.old=r.complete,r.complete=function(){b.isFunction(r.old)&&r.old.call(this),r.queue&&b.dequeue(this,r.queue)},r},b.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2}},b.timers=[],b.fx=rr.prototype.init,b.fx.tick=function(){var e,n=b.timers,r=0;for(Xn=b.now();n.length>r;r++)e=n[r],e()||n[r]!==e||n.splice(r--,1);n.length||b.fx.stop(),Xn=t},b.fx.timer=function(e){e()&&b.timers.push(e)&&b.fx.start()},b.fx.interval=13,b.fx.start=function(){Un||(Un=setInterval(b.fx.tick,b.fx.interval))},b.fx.stop=function(){clearInterval(Un),Un=null},b.fx.speeds={slow:600,fast:200,_default:400},b.fx.step={},b.expr&&b.expr.filters&&(b.expr.filters.animated=function(e){return b.grep(b.timers,function(t){return e===t.elem}).length}),b.fn.offset=function(e){if(arguments.length)return e===t?this:this.each(function(t){b.offset.setOffset(this,e,t)});var n,r,o={top:0,left:0},a=this[0],s=a&&a.ownerDocument;if(s)return n=s.documentElement,b.contains(n,a)?(typeof a.getBoundingClientRect!==i&&(o=a.getBoundingClientRect()),r=or(s),{top:o.top+(r.pageYOffset||n.scrollTop)-(n.clientTop||0),left:o.left+(r.pageXOffset||n.scrollLeft)-(n.clientLeft||0)}):o},b.offset={setOffset:function(e,t,n){var r=b.css(e,"position");"static"===r&&(e.style.position="relative");var i=b(e),o=i.offset(),a=b.css(e,"top"),s=b.css(e,"left"),u=("absolute"===r||"fixed"===r)&&b.inArray("auto",[a,s])>-1,l={},c={},p,f;u?(c=i.position(),p=c.top,f=c.left):(p=parseFloat(a)||0,f=parseFloat(s)||0),b.isFunction(t)&&(t=t.call(e,n,o)),null!=t.top&&(l.top=t.top-o.top+p),null!=t.left&&(l.left=t.left-o.left+f),"using"in t?t.using.call(e,l):i.css(l)}},b.fn.extend({position:function(){if(this[0]){var e,t,n={top:0,left:0},r=this[0];return"fixed"===b.css(r,"position")?t=r.getBoundingClientRect():(e=this.offsetParent(),t=this.offset(),b.nodeName(e[0],"html")||(n=e.offset()),n.top+=b.css(e[0],"borderTopWidth",!0),n.left+=b.css(e[0],"borderLeftWidth",!0)),{top:t.top-n.top-b.css(r,"marginTop",!0),left:t.left-n.left-b.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||o.documentElement;while(e&&!b.nodeName(e,"html")&&"static"===b.css(e,"position"))e=e.offsetParent;return e||o.documentElement})}}),b.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(e,n){var r=/Y/.test(n);b.fn[e]=function(i){return b.access(this,function(e,i,o){var a=or(e);return o===t?a?n in a?a[n]:a.document.documentElement[i]:e[i]:(a?a.scrollTo(r?b(a).scrollLeft():o,r?o:b(a).scrollTop()):e[i]=o,t)},e,i,arguments.length,null)}});function or(e){return b.isWindow(e)?e:9===e.nodeType?e.defaultView||e.parentWindow:!1}b.each({Height:"height",Width:"width"},function(e,n){b.each({padding:"inner"+e,content:n,"":"outer"+e},function(r,i){b.fn[i]=function(i,o){var a=arguments.length&&(r||"boolean"!=typeof i),s=r||(i===!0||o===!0?"margin":"border");return b.access(this,function(n,r,i){var o;return b.isWindow(n)?n.document.documentElement["client"+e]:9===n.nodeType?(o=n.documentElement,Math.max(n.body["scroll"+e],o["scroll"+e],n.body["offset"+e],o["offset"+e],o["client"+e])):i===t?b.css(n,r,s):b.style(n,r,i,s)},n,a?i:t,a,null)}})}),e.jQuery=e.$=b,"function"==typeof define&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return b})})(window);
/*global define, require */

define('jquery-loader',['jquery'], function(jquery) {
    

    var importedJQuery = jquery.noConflict();
    window.jQuery = window.$;
    if (window.jQuery) {
        var jQueryVersion = window.jQuery.fn.jquery;
        var mainVersion = parseInt(jQueryVersion.substr(0, 1), 10);
        var releaseVersion = parseInt(jQueryVersion.substr(2, 1), 10);
        var isRightVersionForIE = mainVersion === 1 && releaseVersion === 8;
        var isIE = !window.addEventListener;

        if (isIE && !isRightVersionForIE) {
            // IE8 requires jquery 1.8
            throw new Error('Foxneod.js requires jQuery 1.8 to run properly in IE 8');
        }

        if (mainVersion === 1 && releaseVersion < 8) {
            // jQuery 1.7 makes ovp events fail
            // jQuery 1.8-1.9 and 2.02 seem to work fine in Chrome
            return importedJQuery;
        }

        return window.jQuery;
    }
    return importedJQuery;
});

/*global define */

define('base64',[
    'lodash'
], function (_) {
    

    var encode = function (objectToEncode) {
        if (_.isUndefined(objectToEncode) || !_.isTrueObject(objectToEncode))
        {
            throw new Error("The encode() method expects an object for an argument");
        }

        var jsonString = JSON.stringify(objectToEncode);
        var base64String = btoa(jsonString);

        return base64String;
    };

    var decode = function (base64String) {
        if (!_.isString(base64String) && !_.isEmpty(base64String))
        {
            throw new Error("The decode() method expects a string for an argument");
        }

        var jsonString = atob(base64String);
        var json = JSON.parse(jsonString);

        return json;
    };

    // Public API
    return  {
        encode: encode,
        decode: decode
    };
});
/*global define, _ */

define('Dispatcher',[
    'lodash',
    'jquery-loader',
    'base64',
    'require'
], function (_, jquery, base64, require) {
    

    var ieEvents = ['onblur', 'onchange', 'onclick', 'oncontextmenu', 'oncopy',
        'oncut', 'ondblclick', 'onerror', 'onfocus', 'onfocusin', 'onfocusout',
        'onhashchange', 'onkeydown', 'onkeypress',' onkeyup', 'onload', 'onmousedown',
        'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover',
        'onmouseup', 'onmousewheel', 'onpaste', 'onreset', 'onresize', 'onscroll',
        'onselect', 'onsubmit', 'onunload'];

    var _listeners = [],
        //gets setup in init
        debug,
        storage;

    return function (owningModuleName) {

        //////////////////////////////////////////////// private methods...
        ////////////////////////////////////////////////



        //////////////////////////////////////////////// public methods...
        var addListener = function (eventName, callback) {
            if (_.isEmpty(eventName) || !_.isString(eventName))
            {
                return false;
            }

//            if (!_.isFunction(callback))
//            {
//                throw new Error("You can't create an event listener without supplying a callback function");
//            }

            var deferred = new jquery.Deferred();
            var listener = {
                name: eventName,
                callback: callback,
                deferred: deferred
            };

            _listeners.push(listener);

            return deferred;
        };

        var dispatch = function (eventName, data, dispatchOverWindow) {
            if (_.isEmpty(eventName) || !_.isString(eventName))
            {
                throw new Error("You can't dispatch an event without supplying an event name (as a string)");
            }

            var name = 'foxneod:' + eventName;
            var evt;

            if (window.dispatchEvent) {
                evt = document.createEvent('Event');
                evt.initEvent(name, true, true);
            } else {
                evt = window.jQuery.Event(name);
            }
            evt.data = data || null;

            if (!dispatchOverWindow)
            {
                var listeners = _.where(_listeners, {name: eventName});

                _.each(listeners, function (listener) {
                    listener.deferred.resolveWith(listener, evt);
                    listener.callback(evt);
                });
            }
            else
            {
                if (window.dispatchEvent) {
                    window.dispatchEvent(evt);
                } else {
                    debug.log('Dispatching ' + name + ' over window with jQuery');
                    window.jQuery(window).trigger(name, evt);
                }
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

        var hasListener = function (eventName, callback) {
            var found = false,
                checkCallbackToo = false;

            if (!_.isEmpty(eventName) && _.isString(eventName))
            {
                if (!_.isUndefined(callback) && _.isFunction(callback))
                {
                    checkCallbackToo = true;
                }

                _.each(_listeners, function (listener) {
                    if (listener.name === eventName)
                    {
                        if (checkCallbackToo)
                        {
                            if (listener.callback.toString() === callback.toString())
                            {
                                found = true;
                            }
                        }
                        else
                        {
                            found = true;
                        }
                    }
                });
            }

            return found;
        };

        var removeListener = function (eventName, callback) {
            if (_.isUndefined(eventName) || !_.isString(eventName))
            {
                throw new Error("The first argument supplied to removeEventListener() should be a string for the event name");
            }

            if (_.isUndefined(callback) || !_.isFunction(callback))
            {
                throw new Error("The second argument supplied to removeEventListener() should be a function for the callback that was used");
            }

            var updated = [],
                removed = false;

            _.each(_listeners, function (listener) {
                if (listener.name !== eventName && _listeners.callback.toString() !== callback.toString())
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

        var up = function (message, data) {
            if (storage.now.get('insideIframe'))
            {
                var payload = {
                    eventName: message,
                    data: (!_.isUndefined(data) && !_.isEmpty(data)) ? data : null,
                    owningModuleName: owningModuleName || null
                };

                var encoded = 'foxneod:' + base64.encode(payload);
                window.parent.postMessage(encoded, '*');
            }
        };
        ////////////////////////////////////////////////

//        var delivered = function (messageName) {
//            var deferred = new jquery.Deferred();
//
//            _.each(_messages, function (message) {
//                if ('foxneod:' + messageName === message.eventName)
//                {
//                    deferred.resolve(message.payload);
//                }
//            });
//
//            return deferred;
//        };

        //////////////////////////////////////////////// initialize...
        (function init () {
            storage = require('storage');
            var Debug = require('Debug');
            var listen = window.addEventListener || window.attachEvent;
            debug = new Debug(owningModuleName + '(dispatcher)');

            listen('message', function (event) {

                if (event.data.indexOf('foxneod:') !== -1)
                {
                    //split the postMessage string
                    var encoded = event.data.split('foxneod:')[1];
                    if (!_.isString(encoded) || _.isEmpty(encoded))
                    {
                        throw new Error("Splitting the encoded postMessage failed: please contact the developer");
                    }

                    //decode the base64 string
                    var decoded = base64.decode(encoded);
                    if (!_.isTrueObject(decoded) || _.isEmpty(decoded))
                    {
                        throw new Error("The decoded postMessage was either not an object or empty: please contact the developer");
                    }

                    if (owningModuleName === decoded.owningModuleName)
                    {
                        dispatch(decoded.eventName, decoded.data);
                    }
                }
            });
        })();
        ////////////////////////////////////////////////



        //////////////////////////////////////////////// public api...
        return {
            on: addListener,
            dispatch: dispatch,
            getEventListeners: getEventListeners,
            hasEventListener: hasListener,
            removeEventListener: removeListener,
            removeAllEventListeners: removeAllListeners,

            //postMessage methods
            up: up
        };
        ////////////////////////////////////////////////
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
define('Debug',[
    'lodash',
    'require'
], function (_, require) {
    

    var utils,
        storage,
        console = window.console,
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


        var prefix = 'foxneod-0.9.4';
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
                    if (storage.now.get('insideIframe') && prefix.indexOf('(iframe)') === -1)
                    {
                        prefix += ' (iframe)';
                    }

                    console[logLevel](prefix + ': ' + category + ': ' + options.message, options.data || '');
                    lastUsedOptions = _.clone(options);
                }
            });
        };

        var getDebugModes = function () {
            return _debugModes;
        };

        (function init () {
            utils = require('utils');
            storage = require('storage');

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

define('polyfills',[
    'lodash',
    'Debug',
    'Dispatcher'
], function (_, Debug, Dispatcher) {

    

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
            dispatcher.on(eventName, callback);
            dispatcher.dispatch(eventName);
        }
        else
        {
            debug.log('polyfill not already added');
            dispatcher.on(eventName, callback);
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
        try {
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
        } catch (err) {
            debug.warn('Unable to watch objects - Object.defineProperty not supported');
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

define('utils',[
    'lodash',
    'jquery-loader'
], function (_, $) {
    

    //////////////////////////////////////////////// lo-dash mixin methods...
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

    var getParamValue = function (key, url) {
        var queryParams = getQueryParams(url),
            returnValue = null;

        if (_.isObject(queryParams)) //it should always be an object, but just in case
        {
            for (var prop in queryParams)
            {
                if (prop === key)
                {
                    returnValue = queryParams[prop];
                }
            }
        }

        return returnValue;
    };

    var getQueryParams = function (url) {
        var queryParamsObject = {}; //this is what we're storing and returning
        url = url || urlString;
        var urlSplit = url.split(/\?/)[1];

        if (_.isString(urlSplit) && !_.isEmpty(urlSplit))
        {
            var queryParams = decodeURIComponent(urlSplit).split('&');

            queryParamsObject = arrayToObject(queryParams);

            if (!_.isEmpty(queryParamsObject))
            {
                return queryParamsObject;
            }
        }
        return false;
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

        var urlRegex = /^(https?:\/\/)?(www)?([\da-z\.-]+)\.([a-z\.]{2,6})?(:[0-9]{1,5})?([\/\w \.-]*)*\/?[^?]+(?:\?([^&]+).*)?$/;
        var localRegex = /^(https?:\/\/)?(localhost|[\da-z\.-]+\.local)(:[\d]{1,5})?([\/\w \.-]*)*\/?[^?]+(?:\?([^&]+).*)?$/;

        return urlRegex.test(url) || localRegex.test(url);
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

    var stringToBoolean = function (flag) {
        return (flag === 'true') ? true : false;
    };

    /**
     * Trims both leading and trailing whitespace off of a supplied string
     * @param {String} text
     * @returns {String} String with whitespace stripped from beginning and end of string
     */
    var trim = function (text) {
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
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
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

    /**
     * Adds a tag to the head of the page by specifying the tag name to use and an object of any
     * attributes you want to use.
     * @param tagName Name of the tag. E.g. 'script', 'meta', 'style'
     * @param attributes Object of attributes to use (e.g. { src: '//domain.com/js/script.js' })
     * @returns {$ Deferred}
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

        var deferred = $.Deferred();

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

    var getURL = function () {
        return urlString;
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
     * This is mostly for testing purposes so we can spoof URLs easily, but it's public since I'm big on the "eat your
     * own dog food" thing.
     * @param url
     */
    var setURL = function (url) {
        urlString = url;

        return urlString;
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

        var $tag = $('head ' + attrSelector);

        return ($tag.length > 0) ? true : false;
    };

    var urlString = window.location.href;
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function () {
        _.mixin({
            arrayToObject: arrayToObject,
            booleanToString: booleanToString,
            getKeyFromValue: getKeyFromValue,
            getParamValue: getParamValue,
            getQueryParams: getQueryParams,
            isDefined: isDefined,
            isLooseEqual: isLooseEqual,
            isShallowObject: isShallowObject,
            isTrueObject: isTrueObject,
            isURL: isURL,
            lowerCasePropertyNames: lowerCasePropertyNames,
            objectToArray: objectToArray,
            objectToPipeString: objectToPipeString,
            objectToQueryString: objectToQueryString,
            override: override,
            paramExists: paramExists,
            pipeStringToObject: pipeStringToObject,
            removeQueryParams: removeQueryParams,
            stringToBoolean: stringToBoolean,
            trim: trim
        });
    })();
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api...
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
        getURL: getURL
    };
    ////////////////////////////////////////////////
});

/*global define */

define('cookies',[
    'lodash',
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

define('storage',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'cookies'
], function (_, jquery, utils, Debug, Dispatcher, cookies) {
    

    var _keyValueStore = {},
        debug = new Debug('storage'),
        dispatcher = new Dispatcher('storage');

    //////////////////////////////////////////////// private methods...
    function isInsideIframe () {
        return now.get('insideIframe') || false;
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var now = {
        get: function (key) {
            if (_.has(_keyValueStore, key))
            {
                return _keyValueStore[key];
            }

            return undefined;
        },
        set: function (key, value) {
            if (isInsideIframe())
            {
                debug.log('stored inside iframe, sending up...', [key, value]);
                dispatcher.up('storage', {
                    key: key,
                    value: value
                });
            }

            _keyValueStore[key] = value;
        },
        getAll: function () {
            return _keyValueStore;
        }
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {
        dispatcher.on('storage', function (event) {
            debug.log('got data from iframe - storing', event);
            now.set(event.data.key, event.data.value);
        });
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        now: now,
        cookies: cookies,

        //event listening
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});
/*global define */

define('ovp/theplatform',[
    'lodash',
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
            videoLoading: 'OnMediaLoadStart',
            videoReady: 'OnLoadRelease',
            videoPause: 'OnMediaPause',
            videoPlay: 'OnMediaPlay',
            videoProgress: 'OnMediaPlaying',
            videoSeek: 'OnMediaSeek',
            videoStart: 'OnMediaStart',
            videoResume: 'OnMediaUnpause',
            videoMute: 'OnMute',
            playerReady: 'OnPlayerLoaded',
            playerOverlayUp: 'OnShowPlayOverlay'
        },
        _cleanedVideo = {
            id: null,
            title: null,
            description: null,
            length: null,
            guid: null,
            series: null,
            fullEpisode: null,
            genre: null
        };

    //////////////////////////////////////////////// private functions...
    ////////////////////////////////////////////////

    //////////////////////////////////////////////// public functions...
    var getEventsMap = function () {
        return _eventsMap;
    };

    var cleanEventData = function (video) {
        //validation happens at the ovp.js level

        return;

//        var cleaned = video;
//
//        if (!video.isAd)
//        {
//            cleaned = {
//                //standard elements
//                id: video.releaseID || null,
//                title: video.title || null,
//                description: video.description || null,
//                length: video.trueLength/1000 || null,
//
//                //ovp-specific elements
//                guid: video.guid,
//                series: video.categories[0].name || null //TODO process this to strip the "Series/" from the string
//            };
//
//            cleaned = _.map(video, 'releaseId');
//        }
//
////        else
////        {
////            //TODO finish this
////        }
//
//        return cleaned;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api
    return {
        getEventsMap: getEventsMap,
        cleanEventData: cleanEventData
    };
    ////////////////////////////////////////////////
});
/*global define, _ */

define('ovp/pdkwatcher',[
    'Debug',
    'jquery',
    'lodash'
], function (Debug, $, _) {
    

    var debug = new Debug('pdkwatcher'),
        _deferred = $.Deferred(),
        _interval;

    //yuck... so ghetto (the PDK should dispatch an event when it's ready)
    (function init () {
        _interval = setInterval(function () {
            if (window.$pdk && _.has(window.$pdk, 'controller'))
            {
                clearInterval(_interval);
                debug.log('PDK: Fully Loaded (sequel to Herbie: Fully Loaded)', window.$pdk);
                _deferred.resolve(window.$pdk);
            }
        }, 150);
    })();

    return _deferred;
});
/*global define */

define('ovp',[
    'lodash',
    'jquery',
    'utils',
    'Debug',
    'Dispatcher',
    'storage',
    'ovp/theplatform',
    'ovp/pdkwatcher'
], function (_, jquery, utils, Debug, Dispatcher, storage, thePlatform, pdkwatcher) {
    

    var debug = new Debug('ovp'),
        dispatcher = new Dispatcher('ovp'),
        _readyDeferred = new jquery.Deferred(),
        _controllerDeferred = new jquery.Deferred();


    //////////////////////////////////////////////// public methods
    var getController = function () {

        _readyDeferred.done(function (pdk) {
            if (_.isUndefined(pdk) || !_.isTrueObject(pdk))
            {
                _controllerDeferred.reject("The controller couldn't be found on the PDK object");
            }

            if (!storage.now.get('iframeExists') || storage.now.get('insideIframe'))
            {
                if (_.isUndefined(pdk) || !_.has(pdk, 'controller'))
                {
                    throw new Error("For some unknown reason, there's no contoller on the pdk or the pdk was undefined");
                }

                _controllerDeferred.resolve(pdk.controller);
            }

            if (storage.now.get('outsideIframe') && storage.now.get('iframeExists'))
            {
                var player = storage.now.get('currentPlayer');
                var iframeId = jquery(player.iframe).attr('id');
                var controller = document.getElementById(iframeId).contentWindow['foxneod']
                    .ovp.getController()
                    .done(function (controller) {
                        _controllerDeferred.resolve(controller);
                    });
            }
        });

        return _controllerDeferred;
    };

    var getEventsMap = function () {
        //since we only support one ovp right now, this is fine for the time being
        return thePlatform.getEventsMap();
    };

    var getReady = function () {
        return _readyDeferred;
    };

    var mapEvents = function (controller) {
        if (_.isUndefined(controller))
        {
            throw new Error("The controller supplied to mapEvents() was either undefined, empty, or not an object");
        }

        _.each(thePlatform.getEventsMap(), function (ovpEventName, normalizedEventName) {
            debug.log('adding listener to controller (dispatching as '+ ovpEventName +')', ovpEventName);

            controller.addEventListener(ovpEventName, function (event) {
                dispatcher.dispatch(ovpEventName, event.data);

                if (storage.now.get('insideIframe'))
                {
                    dispatcher.up(ovpEventName, event.data);
                }
            });
        });

        return controller;
    };

    var cleanEventData = function (event) {
        if (_.isUndefined(event) || !_.has(event.data, 'baseClip'))
        {
            return;
        }

        var video = event.data.baseClip;

        return thePlatform.cleanEventData(video);
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// init
    (function () {
        pdkwatcher.done(function (pdk) {
            _readyDeferred.resolve(pdk);

            debug.log('PDK is now available inside of ovp.js', pdk);
            dispatcher.dispatch('ready', pdk);
        });
    })();
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// Public API
    ////////////////////////////////////////////////
    return {
        version: '5.2.7',
        ready: getReady,
        getController: getController,
        pdk: getReady,
        getEventsMap: getEventsMap,
        mapEvents: mapEvents,
        cleanEventData: cleanEventData,

        //event listening
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
});
/*global define, _ */

define('player/Iframe',[
    'utils',
    'lodash',
    'jquery-loader',
    'Debug',
    'Dispatcher'
], function (utils, _, $, Debug, Dispatcher) {
    

    return function (selector, iframeURL, suppliedAttributes) {
        //-------------------------------------------------------------------------------- instance variables
        var debug = new Debug('iframe'),
            dispatcher = new Dispatcher(),
            _playerAttributes = {}, //these get passed down from player.js
            _processedAttributes = {},
            _playerToCreate,
            _deferred = new $.Deferred(),
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
            var attributesString = utils.objectToQueryString(attributes) + '&insideIframe=true';
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
            debug.log('onload fired');
            _onloadFired = true;
            _updateDeferred();
        }

        function _updateDeferred () {
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
            _playerToCreate.iframe = $(_playerToCreate.element).find('iframe')[0];

            document.getElementById(_playerToCreate.attributes.iframePlayerId).onload = function (event) {
                if (!_onloadFired)
                {
                    _onLoad(event);
                }
            };

            debug.log('html injected', _playerToCreate);

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
            addEventListener: dispatcher.on,
            getEventListeners: dispatcher.getEventListeners,
            hasEventListener: dispatcher.hasEventListener,
            removeEventListener: dispatcher.removeEventListener
        };
    };
});
/*global define */

define('player/playback',[
    'require',
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'ovp',
    'storage'
], function (require, _, jquery, utils, Debug, Dispatcher, ovp, storage) {
    

    var debug = new Debug('playback'),
        dispatcher = new Dispatcher('playback'),
        player, //populates in init
        _insideIframe = false;

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
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

            ovp.getController().then(function (controller) {
                controller.seekToPosition(seekTime);
            });
        }
        else
        {
            debug.warn("The time you provided was less than 0, so no seeking occurred.", timeInSeconds);
        }

        return this;
    };

    var play = function () {
        return ovp.getController().then(function (controller) {
            controller.pause(false);
        });
    };

    var pause = function () {
        var deferred = new jquery.Deferred();

        debug.log('iframeExists', _.booleanToString(storage.now.get('iframeExists')));
        debug.log('insideIframe', _.booleanToString(_insideIframe));

        ovp.getController().then(function (controller) {
            controller.pause(true);
            deferred.resolve();
        });

        return deferred;
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {
        player = require('player');
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        seekTo: seekTo,
        play: play,
        pause: pause,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
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

    var updateStyle = function (selectorOrElement, style, value) {
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
        updateStyle: updateStyle
    };
});
/*global define, _, FDM_Player_vars, $pdk, console */

define('modal',[
    'css',
    'utils',
    'Debug'
], function (css, utils, Debug) {
    

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

define('query',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug'
], function (_, $, utils, Debug) {
    

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
        var deferred = new $.Deferred();
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
            var jqxhr = $.get(requestURL)
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
        var deferred = new $.Deferred();
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
            deferred = new $.Deferred(),
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
//                $.noop();
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
/*global define */

define('advertising',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'player',
    'ovp',
    'storage'
], function (_, jquery, utils, Debug, Dispatcher, player, ovp, storage) {
    

    var debug = new Debug('advertising'),
        dispatcher = new Dispatcher('advertising');

    //////////////////////////////////////////////// private methods...
    function _handlePlayerEvent (event, ovpEventName, normalizedEventName) {
        var deferred = new jquery.Deferred();

        if (_.isUndefined(event) || !_.has(event.data, 'baseClip'))
        {
            deferred.reject(event);
            return deferred;
        }

        var video = event.data.baseClip,
            cleanData = _cleanData(event.data.baseClip);

        switch (ovpEventName)
        {
            case 'OnMediaLoadStart':

                if (isAd(video))
                {
                    normalizedEventName = 'adStart';
                    storage.now.set('mostRecentAd', cleanData);
                }

                break;
        }

        dispatcher.dispatch(normalizedEventName, cleanData);
        dispatcher.up(normalizedEventName, cleanData);
        deferred.resolve(normalizedEventName, cleanData);

        return deferred;
    }

    function _checkForCompanions (normalizedEventName, cleanData) {
        var deferred = new jquery.Deferred();

        //check for companion banners
        if (normalizedEventName === 'adStart' && _.isArray(cleanData.banners) && !_.isEmpty(cleanData.banners))
        {
            _.each(cleanData.banners, function (banner) {
                if (!_.isUndefined(banner))
                {
                    var html = (_.has(banner, 'content')) ? banner.content : null;
                    dispatcher.dispatch('companionAd', {
                        banner: html
                    });
                }
            });
        }
        else
        {
            debug.log('no companion banners');
        }

        deferred.resolve(cleanData);

        return deferred;
    }

    function _cleanData (video) {
        var banners = !_.isEmpty(video.banners) ? video.banners : null;

        var cleanData = {
            title: video.title,
            banners: banners,
            url: video.URL,
            description: video.description,
            type: 'ad',
            id: video.releaseID,
            assetType: video.type,
            duration: video.trueLength
        };

        return cleanData;
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getMostRecentAd = function () {
        return storage.now.get('mostRecentAd');
    };

    var isAd = function (video) {
        return !!(_.has(video, 'isAd') && video.isAd);
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {
        var eventsMap = ovp.getEventsMap(),
            cleanData;

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            ovp.on(ovpEventName, function (event) {
                _handlePlayerEvent(event, ovpEventName, normalizedEventName).then(function (normalizedEventName, cleanData) {
                    _checkForCompanions(normalizedEventName, cleanData);
                });
            });
        });
    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getMostRecentAd: getMostRecentAd,
        isAd: isAd,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
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
        UNKnowN     = '?',
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
                            return (i === UNKnowN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKnowN) ? undefined : i;
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

define('system',[
    'UAParser',
    'Debug',
    'lodash'
], function (UAParser, Debug, _) {
    

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
/*global define, FDM_Player */

define('player',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'ovp',
    'player/Iframe',
    'player/playback',
    'storage',
    'modal',
    'query',
    'advertising',
    'system'
], function (_, jquery, utils, Debug, Dispatcher, ovp, Iframe, playback, storage, modal, query, advertising, system) {
    

    var debug = new Debug('player'),
        dispatcher = new Dispatcher('player'),
        _players = [],
        _currentPosition,
        _loadVideoPromises = [],
        _playerIndex = 0,
        _playerReadyDeferred = new jquery.Deferred(),
        _publicAPI = {},
        _videoStarted = false;

    //////////////////////////////////////////////// private methods...
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
            width: (_.has(attributes, 'width')) ? attributes.width : '',
            height: (_.has(attributes, 'height')) ? attributes.height : '',
            suppliedId: (_.has(attributes, 'suppliedId')) ? attributes.suppliedId : jquery(selector).attr('id'),
            debug: utils.getParamValue('debug')
        };

        attributes.width = defaults.width;
        attributes.height = defaults.height;
        attributes.playerIndex = _playerIndex++;
        attributes.debug = attributes.debug || defaults.debug;
        attributes.suppliedId = defaults.suppliedId;
        attributes.id = null; //this will be the player's element id

        return attributes;
    }

    function _setCurrentPlayer (player) {
        if (_.isUndefined(player) || !_.isTrueObject(player) || _.isUndefined(player.controller) || _.isEmpty(player.controller))
        {
            throw new Error("_setCurrentPlayer() expects a valid player object (with a valid controller property)");
        }

        storage.now.set('currentPlayer', player);
        playback.setController(player.controller);
    }

    function _setupEventTranslator () {
        var eventsMap = ovp.getEventsMap();

        _.each(eventsMap, function (ovpEventName, normalizedEventName) {
            debug.log('adding listener to controller (dispatching as '+ normalizedEventName +')', ovpEventName);

            ///////////////////////// translate event name and dispatch
            ovp.on(ovpEventName, function (event) {
                if (_.isUndefined(event) || !_.has(event.data, 'baseClip'))
                {
                    return;
                }

                var video = event.data.baseClip;
                var cleanData = _cleanEventData(video);

                switch (ovpEventName)
                {
                    case 'OnPlayerLoaded':
                        //do nothing?
                        break;
                    case 'OnMediaLoadStart':
                        if (advertising.isAd(video))
                        {
                            return;
                        }
                        break;
                    case 'OnMediaStart':
                        _videoStarted = true;
                        break;
                    case 'OnMediaComplete':
                        _videoStarted = false;
                        break;
                }

                dispatcher.dispatch(normalizedEventName, cleanData);
                dispatcher.up(normalizedEventName, cleanData);
            });
            /////////////////////////
        });
    }

    function _cleanEventData (video) {
        var cleanData = {
            title: video.title,
            url: video.URL,
            description: video.description,
            type: 'video',
            id: video.releaseID,
            assetType: video.type,
            duration: video.trueLength
        };

        storage.now.set('currentVideo', cleanData);

        return cleanData;
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

        ovp.ready().done(function () {
            var attributes = player.attributes;

            if(!storage.now.get('insideIframe'))
            {
                player.controller = window.pdk.bind(attributes.id);
                ovp.mapEvents(player.controller);

                _players.push(player);
                debug.log('player bound, listeners added, and added to the stack', _players);
                dispatcher.dispatch('playerCreated', player);

                _setCurrentPlayer(player);
                deferred.resolve(player);
            }
        });

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
        return storage.now.get('currentVideo');
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

//    var control = function (playerIdSelector) {
//        var controllerToUse = getController(playerIdSelector);
//
//        ovp.getController().done(function (controller) {
//            return deferred;
//        });
//
//        debug.log('setting controller', controllerToUse);
//
//
//        return deferred;
//    };

//    var getController = function (selector) {
//        var elements = jquery(selector),
//            currentPlayer = storage.now.get('currentPlayer'),
//            controllerToUse = null;
//
//        if (_.isUndefined(selector) && _.has(currentPlayer, 'controller'))
//        {
//            return currentPlayer.controller;
//        }
//        else
//        {
//            _.each(elements, function (element) {
//                var id = jquery(element).attr('id');
//
//                if (!_.isUndefined(id))
//                {
//                    _.each(_players, function (player) {
//                        debug.log("searching for player controller...");
//                        if (player.attributes.suppliedId === id || player.attributes.iframePlayerId === id)
//                        {
//                            controllerToUse = player.controller;
//                        }
//                    });
//                }
//            });
//
//            if (_.isUndefined(controllerToUse) && (_.isObject(currentPlayer) && !_.isEmpty(currentPlayer)))
//            {
//                debug.log("using the default player's controller");
//                controllerToUse = currentPlayer.controller;
//            }
//
//            if (!_.isUndefined(controllerToUse) && !_.isEmpty(controllerToUse))
//            {
//                debug.log('controller to use', controllerToUse);
//                return controllerToUse().controller;
//            }
//            else
//            {
//                debug.warn("The selector you provided doesn't point to a player on the page");
//            }
//        }
//
//        debug.log('getController() returning false');
//        return false;
//    };

    var loadVideo = function (releaseURLOrId, callback, cueVideo) {
        //////////////////////////////////////////////// fail fast...
        var deferred = new jquery.Deferred(),
            errorMessage = '';

        if (!query.isReleaseURL(releaseURLOrId))
        {
            errorMessage = "The loadVideo() method expects one argument: a release URL";
            deferred.reject(errorMessage);
            throw new Error(errorMessage);
        }

        if (_.isUndefined(storage.now.get('currentPlayer')))
        {
            errorMessage = "There was no default player set to load the video into";
            deferred.reject(errorMessage);
            throw new Error(errorMessage);
        }
        ////////////////////////////////////////////////


        //////////////////////////////////////////////// load...
        _loadVideoPromises.push({
            id: _.removeQueryParams(releaseURLOrId),
            deferred: deferred,
            callback: callback,
            loaded: false
        });

        ovp.getController().then(function (controller) {
            //end our current stream

            //this method is a whole bunch of bullshit that doesn't help me much at all here
//            if (_.isFunction(controller.endMedia) && _videoStarted)
//            {
//                debug.log('calling endMedia()', _videoStarted);
//                controller.endMedia();
//            }
//            else
//            {
//                debug.warn("endMedia() didn't exist on the controller", controller);
//
//                if (_videoStarted)
//                {
//                    debug.log('video already started, so we have to pause');
//                    controller.pause(false);
//                }
//            }

            debugger;

            if (_.isFunction(controller.resetPlayer))
            {
                debug.log('calling resetPlayer()');
                controller.resetPlayer();
            }
            else if (_.isFunction(controller.setRelease))
            {
                debug.log('calling setRelease({}, true)');
                controller.setRelease({}, true);
            }

            _videoStarted = false;

            if (!cueVideo)
            {
                //defaults to setReleaseURL for now since it's what everyone wants anyway
                debug.log('calling setReleaseURL', [releaseURLOrId, controller]);
                controller.setReleaseURL(releaseURLOrId, true);
            }
            else
            {
                debug.log('calling loadReleaseURL', [releaseURLOrId, controller]);
                controller.loadReleaseURL(releaseURLOrId, true);
            }
        });
        ////////////////////////////////////////////////

        return deferred;
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
        if (_.isUndefined(_playerReadyDeferred) || _playerReadyDeferred.state() === 'resolved')
        {
            _playerReadyDeferred = new jquery.Deferred();
        }

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
            config.id = 'player'; //we manually set this for the sake of FDM_Player()
            storage.now.set('playerConfig', config);

            window['player'] = config;
            debug.log('creating player with config', config);
            var fdmPlayer = new FDM_Player('player', config.width, config.height);

            player.logLevel= (_.isEqual(pdkDebug, 'pdk')) ? 'debug' : 'none';

            //we need to loop through the config to find out if we're inside the iframe or not
            _.each(config, function (prop, key) {
                if (_.isEqual(key, 'insideIframe'))
                {
                    storage.now.set('iframeExists', true);
                    storage.now.set('insideIframe', true);
                }
            });

            debug.log('PDK logLevel', player.logLevel);
        }
        catch (error) {
            throw new Error(error);
        }

        return _playerReadyDeferred;
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

        if (!_.isEmpty(_players))
        {
            _.each(_players, function (player) {
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
                    "like a jquery object, but try using document.querySelector() or document.querySelectorAll() to get " +
                    "the element that you need. We try to not to depend on jquery where we don't have to.");
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
    var createIframe = function (selector, iframeURL, suppliedAttributes) {
        if (!_.isString(selector) || _.isEmpty(selector))
        {
            throw new Error("You must supply a selector as the first argument when calling createIframe()");
        }

        if (!_.isString(iframeURL) || _.isEmpty(iframeURL))
        {
            throw new Error("You must supply a valid path to your iframe as a string as the second argument when calling createIframe()");
        }

        var declaredAttributes = getPlayerAttributes(selector);
        debug.log('declaredAttributes', declaredAttributes);

        var attributes = _processAttributes(selector, suppliedAttributes, declaredAttributes);
        var iframe = new Iframe(selector, iframeURL, attributes);

        var iframePlayer = iframe.create()
            .then(function (player) {
                storage.now.set('currentPlayer', player);
                storage.now.set('iframeExists', true);
                storage.now.set('outsideIframe', true);
                _bindPlayer(player);
            });
    };

    var hide = function () {
        var config = storage.now.get('playerConfig');
        var playerId = config.id;
        jquery('#' + playerId).hide();
        playback.pause();

        return true;
    };

    var show = function () {
        var config = storage.now.get('playerConfig');
        var playerId = config.id;
        jquery('#' + playerId).show();
        playback.pause();

        return true;
    };
    ////////////////////////////////////////////////

    //////////////////////////////////////////////// init...
    (function init () {
        _publicAPI = {
            //public api
            setPlayerMessage: setPlayerMessage,
            clearPlayerMessage: clearPlayerMessage,
            createIframe: createIframe,
            hide: hide,
            show: show,
            getCurrentVideo: getCurrentVideo,
            getPosition: getCurrentPosition,
            loadVideo: loadVideo,
            cueVideo: function (releaseURL, callback) {
                //third param forces loadReleaseURL instead of setReleaseURL
                loadVideo(releaseURL, callback, true);
            },
            create: createPlayer,
            getPlayers: getPlayers,
            ready: function () {
                return _playerReadyDeferred;
            },

            //playback related
            seekTo: playback.seekTo,
            play: function () {
                if (_videoStarted)
                {
                    debug.log('calling play on the playback module');
                    playback.play();
                }
                else
                {
                    ovp.getController().then(function (controller) {
                        if (_.isFunction(controller.clickPlayButton))
                        {
                            var timeout = 250;

                            //TODO work with thePlatform to change this
                            setTimeout(function () {
                                debug.log('calling clickPlayButton() after a '+ timeout +'ms timeout');
                                controller.clickPlayButton();
                            }, timeout);
                        }
                    });
                }
            },
            pause: playback.pause,

            //event listening
            addEventListener: dispatcher.on,
            on: dispatcher.on,
            getEventListeners: dispatcher.getEventListeners,
            hasEventListener: dispatcher.hasEventListener,
            removeEventListener: dispatcher.removeEventListener
        };

        //initialize player related data that a lot of modules rely on
        storage.now.set('iframeExists', false);
        storage.now.set('insideIframe', false);
        storage.now.set('outsideIframe', false);
        storage.now.set('currentPlayer', null);

        ovp.ready()
            .then(ovp.getController)
            .done(function (controller) {
                debug.log('mapping events to controller', controller);

                ovp.mapEvents(controller);
                _setupEventTranslator();
            });

        ovp.on('OnPlayerLoaded', function (event) {
            ovp.getController().done(function (controller) {
                var currentPlayer = storage.now.get('currentPlayer');

                if (_.isUndefined(currentPlayer) || !_.isTrueObject(currentPlayer))
                {
                    currentPlayer = {};
                }

                currentPlayer.controller = controller;

                storage.now.set('currentPlayer', currentPlayer);
                _playerReadyDeferred.resolve(currentPlayer);
            });
        });

        ovp.on('OnLoadReleaseUrl', function (event) {
            debug.log('OnLoadReleaseURL fired', event);

            _.each(_loadVideoPromises, function (promiseInfo) {
                promiseInfo.loaded = true;
            });
        });

        ovp.on('OnSetReleaseURL', function (event) {
            debug.log('OnSetReleaseURL fired', event);

            _.each(_loadVideoPromises, function (promiseInfo) {
                promiseInfo.loaded = true;
            });
        });

        ovp.on('OnShowPlayOverlay', function (event) {
            debug.log('OnShowPlayOverlay fired', event);

            _.each(_loadVideoPromises, function (promiseInfo) {
                if (promiseInfo.loaded)
                {
                    debug.log('resolving promise', promiseInfo);
                    promiseInfo.deferred.resolveWith(_publicAPI, event);

                    if (_.isFunction(promiseInfo.callback))
                    {
                        promiseInfo.callback(promiseInfo.deferred);
                    }
                }
            });
        });

        ovp.on('OnMediaLoadStart', function (event) {
            debug.log('OnMediaLoadStart fired', event);
        });

        ovp.on('OnMediaError', function (event) {
            debug.warn('OnMediaError fired', event);
        });
    })();
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public api...
    /**
     * Most of the player's functionality is broken off into submodules, but surfaced here through this one API
     * entry point
     */
    return _publicAPI;
    ////////////////////////////////////////////////
});
/*global define */

define('config',[
    'lodash',
    'jquery-loader',
    'Debug',
    'utils',
    'Dispatcher'
], function(_, $, Debug, utils, Dispatcher) {
    

    var debug = new Debug('config');
    var dispatcher = new Dispatcher();

    var timeoutDuration = 3000;
    var configTimeout;

    // To override a property, set it to any non-null, defined value.
    // To accept a default property, don't explicitly override it, or set it to
    // undefined.
    // To remove a property, set it to null
    var defaults = {
        version: '1.4.5.27',        // Optional - Not used
        shortname: 'fox',           // Required - Replaces network in legacy build step
        name: 'Default Player',     // Optional - Not used
        network_name: 'foxcom',     // Required - Used for some of the analytics plugins
        enable_html5: true,         // Optional - Enables HTML5 player on iOS devices
        enable_auth: true,          // Optional - Enables Fox URL signing plugin
        shouldGetNewJS: true,       // Optional - Seems to enable event handling for determining when the foxneod library is ready
        share_emailserver: false,   // Optional
        share_shortenerURL: null,   // Optional
        analytics: {        // Optional
            akamai: {           // Optional
                beaconPath: 'http://ma1-r.analytics.edgesuite.net/config/beacon-4227.xml'   // Required
            },
            comscore: {         // Optional
                c2: '3005183',      // Required
                c4: '8000000',      // Required
                c6Field: '{comscoreShowId}%7CS{season}E{episode}'   // Required
            },
            sitecatalyst: {     // Optional
                host: 'a.fox.com',  // Required
                visitorNamespace: 'foxentertainment',   // Optional (Defaults to 'foxentertainment' if unset)
                account: 'foxcomprod',  // Required
                additionalPropsMethodName: 'player.extraInfo'   // Required
            },
            nielsen: {          // Optional
                clientid: '800251',     // Required
                vcid: 'c01',            // Required
                sid: '2500011627',      // Required
                tfid: '1362',           // Required
                adcategory: 'fw:category',  // Required
                adsubcategory: 'fw:subcategory',    // Required
                displayprefix: 'Season',    // Required
                displayfieldname: 'season'  // Required
            },
            ga: {               // Optional
                account: 'UA-28236326-1',   // Required
                histograms: '10',           // Required
                trackAds: 'true',           // Required
                pattern: 'thePlatform/{playlist.player}/{isAd}/{title}/{histogram}' // Required
            },
            chartbeat: true,    // Optional
            conviva: {          // Optional
                type: 'full',           // Required
                customerId: 'c3.FOX',   // Required
                metadataKeys: 'episode,fullEpisode,genre,repeat,season,showcode',   // Required
                playerTags: '|playerTag.series=|playerTag.playerType='  //  Required
            }
        },
        adserver: {         // Optional
            name: 'freewheel'      // Required
        },
        layouts: {  // Optional (Do not unset)
            swfSkinURL: '/fox/swf/skinFox.swf',     // Optional (Do not unset)
            jsSkinURL: '/fox/config/fox.json',      // Optional (Do not unset)
            defaultLayoutUrl: '/fox/config/foxLayout.xml',      // Optional (Do not unset)
            liveLayoutUrl: '/fox/config/liveLayout.xml',        // Optional (Do not unset)
            dvrLayoutUrl: '/fox/config/dvrLayout.xml',          // Optional (Do not unset)
            dvrLiveLayoutUrl: '/fox/config/dvrLiveLayout.xml',  // Optional (Do not unset)
            html5LayoutUrl: '/fox/config/html5Layout.xml',      // Optional (Do not unset)
            play_overlay_x_offset: '50',        // Optional (Do not unset)
            play_overlay_y_offset: '50'         // Optional (Do not unset)
        },
        colors: {   // Optional (Do not unset)
            backgroundColor: '0x000000',        // Optional (Do not unset)
            controlBackgroundColor: '0x000000', // Optional (Do not unset)
            controlColor: '0xFFFFFF',           // Optional (Do not unset)
            controlHoverColor: '0x00B4FF',      // Optional (Do not unset)
            controlSelectedColor: '0x000000',   // Optional (Do not unset)
            disabledColor: '0x000000',          // Optional (Do not unset)
            fp_bgcolor: '0x000000',             // Optional (Do not unset)
            frameColor: '0x000000',             // Optional (Do not unset)
            playProgressColor: '0x0000FF',      // Optional (Do not unset)
            textColor: '0x0000ff',              // Optional (Do not unset)
            loadProgressColor: '0xBEBEBE',      // Optional (Do not unset)
            controlHighlightColor: '0x00FF00'   // Optional (Do not unset)
        }
    };

    var configData = {};

    var validationRules = {
        required: false,
        defaults: defaults,
        version: {
            required: false
        },
        shortname: {
            required: true
        },
        name: {
            required: true,
            defaults: defaults.name
        },
        network_name: {
            required: true
        },
        enable_html5: {
            required: false,
            defaults: defaults.enable_html5
        },
        enable_auth: {
            required: false,
            defaults: defaults.enable_auth
        },
        shouldGetNewJS: {
            required: false,
            defaults: defaults.shouldGetNewJS
        },
        share_emailserver: {
            required: false
        },
        share_shortenerURL: {
            required: false
        },
        analytics: {
            required: false,
            defaults: {},
            akamai: {
                required: false,
                beaconPath: {
                    required: true
                }
            },
            comscore: {
                required: false,
                c2: {
                    required: true
                },
                c4: {
                    required: true
                },
                c6Field: {
                    required: true
                }
            },
            sitecatalyst: {
                required: false,
                host: {
                    required: true
                },
                visitorNamespace: {
                    required: false,
                    defaults: defaults.analytics.sitecatalyst.visitorNamespace
                },
                account: {
                    required: true
                },
                additionalPropsMethodName: {
                    required: true
                }
            },
            nielsen: {
                required: false,
                clientid: {
                    required: true
                },
                vcid: {
                    required: true
                },
                sid: {
                    required: true
                },
                tfid: {
                    required: true
                },
                adcategory: {
                    required: true
                },
                adsubcategory: {
                    required: true
                },
                displayprefix: {
                    required: true
                },
                displayfieldname: {
                    required: true
                }
            },
            ga: {
                required: false,
                account: {
                    required: true
                },
                histograms: {
                    required: true
                },
                trackAds: {
                    required: true
                },
                pattern: {
                    required: true
                }
            },
            chartbeat: {
                required: false
            },
            conviva: {
                required: false,
                type: {
                    required: true,
                    'enum': ['full', 'lite']
                },
                customerId: {
                    required: true
                },
                metadataKeys: {
                    required: true
                },
                playerTags: {
                    required: true
                }
            }
        },
        adserver: {
            required: false,
            defaults: defaults.adserver,
            name: {
                required: true
            },
            siteSection: {
                required: false
            },
            customVideoAssetIdField: {
                required: false
            },
            videoDescriptionUrl: {
                required: false
            },
            host: {
                required: false
            }
        },
        layouts: {
            required: false,
            defaults: defaults.layouts,
            swfSkinURL: {
                required: false,
                defaults: defaults.layouts.swfSkinURL
            },
            jsSkinURL: {
                required: false,
                defaults: defaults.layouts.jsSkinURL
            },
            defaultLayoutUrl: {
                required: false,
                defaults: defaults.layouts.defaultLayoutUrl
            },
            liveLayoutUrl: {
                required: false,
                defaults: defaults.layouts.liveLayoutUrl
            },
            dvrLayoutUrl: {
                required: false,
                defaults: defaults.layouts.dvrLayoutUrl
            },
            dvrLiveLayoutUrl: {
                required: false,
                defaults: defaults.layouts.dvrLiveLayoutUrl
            },
            html5LayoutUrl: {
                required: false,
                defaults: defaults.layouts.html5LayoutUrl
            },
            play_overlay_x_offset: {
                required: false,
                defaults: defaults.layouts.play_overlay_x_offset
            },
            play_overlay_y_offset: {
                required: false,
                defaults: defaults.layouts.play_overlay_y_offset
            }
        },
        colors: {
            required: false,
            defaults: defaults.colors,
            backgroundColor: {
                required: false,
                defaults: defaults.colors.backgroundColor
            },
            controlBackgroundColor: {
                required: false,
                defaults: defaults.colors.controlBackgroundColor
            },
            controlColor: {
                required: false,
                defaults: defaults.colors.controlColor
            },
            controlHoverColor: {
                required: false,
                defaults: defaults.colors.controlHoverColor
            },
            controlSelectedColor: {
                required: false,
                defaults: defaults.colors.controlSelectedColor
            },
            disabledColor: {
                required: false,
                defaults: defaults.colors.disabledColor
            },
            fp_bgcolor: {
                required: false,
                defaults: defaults.colors.fp_bgcolor
            },
            frameColor: {
                required: false,
                defaults: defaults.colors.frameColor
            },
            playProgressColor: {
                required: false,
                defaults: defaults.colors.playProgressColor
            },
            textColor: {
                required: false,
                defaults: defaults.colors.textColor
            },
            loadProgressColor: {
                required: false,
                defaults: defaults.colors.loadProgressColor
            },
            controlHighlightColor: {
                required: false,
                defaults: defaults.colors.controlHighlightColor
            }
        }
    };

    var presets = {
        test: 'assets/config.json',
        ngc: '/config.json'
    };

    /**
     *  Validates and merges config data.
     *  Validation rules are based on the validationRules above. The validate
     *  function ensures that each field in the config is valid. If a field is
     *  determined to be valid, it will merge the field/value into the config.
     *  If the field is not valid, it will not be merged and a warning will be
     *  issued to the console. If the failOnError flag is set and a field is not
     *  valid, an error will be thrown. If a field is not specified and isn't
     *  required, the default value will be used. Default the default config is
     *  defined in the defaults object above.
     *  @param config The configuration data to be validated. This should be an
     *      object. Nested properties are supported. Pass in null to delete
     *      to remove the property from the config (this overrides defaults).
     *  @param rules The validation rules to be used when validating the config.
     *      the rules should correspond to each property of the config. Nested
     *      properties are supported, but each "node" of the validation tree must
     *      specify a set of rules.
     *      Rules:
     *          required: Boolean - determines whether the config object must
     *              specify a value for this field.
     *          defaults: Any type - if an optional field is not specified by
     *              the config object, it will be set to this value.
     *          enum: Array - specifies that the config value must be a member of
     *              the array. Works best on "leaf" nodes where the value data
     *              type is a String or Number.
     *  @param defaultConfig The configuration properties that will be used if
     *      not overridden or if a specified property is not valid.
     *  @param failOnError Flag to determine whether to throw an error when an
     *      invalid config parameter is provided. If set, a warning will be
     *      issued to the console and an error will be thrown, halting execution.
     *      If not set, a warning will be issued to the console and the default
     *      or existing value will be used.
     *  @return The config properties.
     */
    var validate = function(config, rules, defaultConfig, failOnError) {
        if (_.isUndefined(config)) {
            return rules.defaults;
        }

        _.each(rules, function(rule, key) {
            var message;
            var currentSetting = config[key];
            if (_.isObject(currentSetting)) {
                config[key] = validate(currentSetting, rule, defaultConfig[key], failOnError);
                return;
            }
            if (_.isUndefined(currentSetting)) {
                if (rule.required === true) {
                    message = 'Required configuration setting "' + key + '" is not provided.';
                    debug.warn(message);
                    if (failOnError) {
                        throw new Error(message);
                    }
                    return;
                }
                if (rule.required === false && rule.defaults) {
                    if (rule.defaults) {
                        config[key] = rule.defaults;
                    } else {
                        config[key] = defaultConfig[key];
                    }
                    return;
                }
            }
            if (_.isNull(currentSetting)) {
                if (rule.required === true) {
                    message = 'Cannot unset required configuration setting "' + key + '"';
                    debug.warn(message);
                    if (failOnError) {
                        throw new Error(message);
                    }
                    return;
                }
                delete config[key];
                return;
            }
            if (rule['enum'] && !_.contains(rule['enum'], currentSetting)) {
                message = 'Invalid value specified for "' + key + '": "' + currentSetting + '"';
                debug.warn(message);
                if (failOnError) {
                    throw new Error(message);
                }
                return;
            }
        });
        return config;
    };

    var lookup = function(overrides) {
        var deferred = $.Deferred();
        if (_.isObject(overrides)) {
            deferred.resolve(overrides);
            return deferred.promise();
        }

        debug.log('looking up config "' + overrides + '"');
        if (_.isString(overrides) && !utils.isURL(overrides)) {
            if (_.isUndefined(presets[overrides])) {
                var message = 'Bad network shortname lookup: ' + overrides;
                debug.error(message);
                return deferred.reject(message);
            }
            overrides = presets[overrides];
        }
        debug.log('lookup URL: "' + overrides + '"');
        $.ajax({
            type: 'get',
            url: overrides,
            dataType: 'jsonp'
        }).done(deferred.resolve).fail(deferred.reject);

        return deferred.promise();
    };

    var reset = function() {
        configData = $.extend({}, defaults);
    };

    var config = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var deferred = $.Deferred();

        reset();

        if (configTimeout) {
            window.clearTimeout(configTimeout);
        }

        if (args.length === 0) {
            debug.warn('Configuration settings not provided - Using default config.');
            args = [configData];
        }

        var firstArg = true;
        var setConfig = function() {
            var self = this;
            var args = Array.prototype.slice.call(arguments, 0);
            var data = args.shift();
            lookup(data).done(function(data) {
                configData = validate(data, validationRules, configData, firstArg);
                firstArg = false;
                if (args.length === 0) {
                    debug.log('dispatching config event over window');
                    dispatcher.dispatch('config', true, true);
                    return deferred.resolve(configData);
                }
                setConfig.apply(self, args);
            }).fail(function() {
                deferred.reject.apply(deferred, args);
            });
        };

        setConfig.apply(this, args);

        return deferred.promise();
    };

    config.getConfig = function() {
        return configData;
    };

    $(window).on('foxneod:ready', function() {
        configTimeout = window.setTimeout(function() {
            debug.warn('config not set after ' + timeoutDuration + 'ms. Using default config.');
            config();
        }, timeoutDuration);
    });

    return config;
});

/*global define */

define('mvpd',[
    'lodash',
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

define('analytics/omnitureloader',[
    'lodash',
    'jquery-loader'
], function (_, $, utils, Debug, Dispatcher) {
    

    var deferred = new $.Deferred();

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getOmnitureLibrary = function (account) {
        var attributes = {
            src: 'http://player.foxfdm.com/shared/1.4.527//js/s_code.js?account=' + account
        };

        if (!_.has(window, 's_analytics') && !utils.tagInHead('script', attributes))
        {
            utils.addToHead('script', attributes)
                .done(function (response) {
                    deferred.resolve('s_code.js loaded');
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
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getOmnitureLibrary: getOmnitureLibrary
    };
    ////////////////////////////////////////////////
});
/*global define */

define('analytics/audience-manager',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'storage'
], function (_, jquery, utils, Debug, Dispatcher, storage) {
    

    var debug = new Debug('audience manager'),
        dispatcher = new Dispatcher('audience manager'),
        _freewheelKeyValues = storage.cookies.grab('aam_freewheel');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getUserId = function () {
        return storage.cookies.grab('aam_uuid');
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getUserId: getUserId,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});
/*global define */

define('analytics/akamai-media-analytics',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'storage'
], function (_, jquery, utils, Debug, Dispatcher, storage) {
    

    var debug = new Debug('akamai media analytics'),
        dispatcher = new Dispatcher('akamai media analytics');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getUserId = function () {
        return storage.cookies.grab('Akamai_AnalyticsMetrics_clientId');
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getUserId: getUserId,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});
/*global define */

define('analytics/omniture',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher'
], function (_, jquery, utils, Debug, Dispatcher) {
    

    var debug = new Debug('omniture'),
        dispatcher = new Dispatcher('omniture');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});
/*global define */

define('analytics',[
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'analytics/omnitureloader',
    'analytics/audience-manager',
    'analytics/akamai-media-analytics',
    'analytics/omniture'
], function (_, jquery, utils, Debug, Dispatcher, omnitureLoader, audienceManager, ama, omniture) {
    

    var debug = new Debug('analytics'),
        dispatcher = new Dispatcher('analytics');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getOmnitureLibraryReady = function (account) {
        return omnitureLoader.getOmnitureLibrary(account);
    };

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
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getOmnitureLibraryReady: getOmnitureLibraryReady,
        getAkamaiMediaAnalytics: getAkamaiMediaAnalytics,
        getAudienceManager: getAudienceManager,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});

/*global define */

define('foxneod',[
    'lodash',
    'jquery-loader',
    'Dispatcher',
    'Debug',
    'polyfills',
    'utils',
    'player',
    'config',
    'query',
    'system',
    'base64',
    'mvpd',
    'ovp',
    'advertising',
    'analytics',
    'storage'
], function (_, $, Dispatcher, Debug, polyfills, utils, player, config, query, system, base64, mvpd, ovp, advertising, analytics, storage) {
    

    //////////////////////////////////////////////// instance variables
    var debug = new Debug('core'),
        dispatcher = new Dispatcher();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public methods
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// private methods
    function _patchIE8Problems () {
        if (!_.has(window, 'addEventListener') && _.has(window, 'attachEvent'))
        {
            window.addEventListener = window.attachEvent;
        }
    }

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
            var $htmlFragment = $('<div id="foxneod-error">\n    <h1>Warning</h1>\n    <p class="error-message">' + message + '</p>\n</div>');

            window.VideoAuth.Modal.open(null, title);
            window.VideoAuth.Modal.content.set($htmlFragment);
        }
    }
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialization
    var init = function () {
        debug.log('ready (build date: 2013-08-22 03:08:21)');

        _patchIE8Problems();
        _messageUnsupportedUsers();
    };
    ////////////////////////////////////////////////


    // Public API
    return {
        _init: init,
        buildDate: '2013-08-22 03:08:21',
        packageName: 'foxneod',
        version: '0.9.4',
        dispatcher: dispatcher,
        dispatch: dispatcher.dispatch,
        on: dispatcher.on,
        addEventListener: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener,
        advertising: advertising,
        analytics: analytics,
        Debug: Debug,
        mvpd: mvpd,
        ovp: ovp,
        player: player,
        config: config,
        query: query,
        system: system,
        utils: utils,
        _: _,
        jQuery: $,

        //private/testing
        _storage: storage
    };
});

/*global require, requirejs, console */

require([
    'almond',
    'lodash',
    'jquery-loader',
    'Dispatcher',
    'Debug',
    'foxneod'
], function (almond, jquery, _, Dispatcher, Debug, foxneod) {
    

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    (function () {
        if (_.isUndefined(window['foxneod'])) //protects against the file being loaded multiple times
        {
            debug.log('jQuery (internal)', jquery().jquery);

            if(window.jQuery)
            {
                debug.log('jQuery (page)', window.jQuery().jquery);
            }

            debug.log('Lo-Dash', _.VERSION);

            window['foxneod'] = window.jqueryf = foxneod;
            window['foxneod']._init();
            dispatcher.dispatch('ready', {}, true);
            debug.log('foxneod assigned to window.foxneod and window.jquery');
        }
        else
        {
            debug.error('The foxneod library has already been loaded into the page. Fix this!!!');
        }
    })();
});
define("main", function(){});
}());