window.__tp_pdk_set_versions = function() {
	$pdk.expectedVersions = {};
	$pdk.version = new $pdk.PdkVersion("5", "2", "7", "306332", "2013-07-01 11:57 AM");
$pdk.expectedVersions.bootloaderVersion = new $pdk.PdkVersion("5", "2", "7", "306332", "2013-07-01 11:33 AM");
$pdk.expectedVersions.gwtVersion = new $pdk.PdkVersion("5", "2", "7", "306332", "2013-07-01 11:33 AM");

$pdk.expectedVersions.flexVersion = new $pdk.PdkVersion("5", "2", "7", "306332", "2013-07-01 11:49 AM");
};
(function(){var v='',F='.',x='/',A='[object Array]',D='boolean',G='js.com.theplatform.pdk',z='js/app',C='number',y='object',w='script',B='string',E='undefined';var j=navigator.userAgent.toLowerCase(),k=function(a){return a.test(j)},l=k(/opera/),m=!l&&k(/msie/),n=m&&k(/trident\/5.0/),o=m&&k(/msie 6/),p=k(/webkit/),q=k(/chrome/),r=k(/android/),s=k(/windows|win32/),t,u=v;try{t=document.getElementsByTagName(w);u=t[t.length-1].src.substr(0,t[t.length-1].src.lastIndexOf(x))}catch(a){u=v}window.$pdk={bootloader_version:1};$pdk.apply=function(a,b,c){if(c){$pdk.apply(a,c)}if(a&&(b&&typeof b==y)){for(var d in b){a[d]=b[d]}}return a};$pdk.apply($pdk,{isOpera:l,isIE:m,isIE9:n,isIE6:o,isWebKit:p,isChrome:q,isAndroid:r,isWindows:s,scriptRoot:u,defaultAppJsRoot:z,isArray:function(a){return Object.prototype.toString.apply(a)===A},isEmpty:function(a,b){return a===null||(a===undefined||($pdk.isArray(a)&&!a.length||(!b?a===v:false)))},isPrimitive:function(a){var b=typeof a;return b==B||(b==C||b==D)},isObject:function(a){return a&&typeof a==y},tupleComp:function(a,b,c){var d=-1,e,f=a.length;for(e=0;e<f;e++){d=c(a[e],b[e]);if(d!==0){break}}return d},each:function(a,b,c){if($pdk.isEmpty(a,true)){return}if(typeof a.length==E||$pdk.isPrimitive(a)){a=[a]}for(var d=0,e=a.length;d<e;d++){if(b.call(c||a[d],a[d],d,a)===false){return d}}},ns:function(){var c,d,e=window;try{e=$wnd!==null&&typeof $wnd===y?$wnd:window}catch(a){e=window}$pdk.each(arguments,function(b){d=b.split(F);c=e[d[0]]=e[d[0]]||{};$pdk.each(d.slice(1),function(a){c=c[a]=c[a]||{}})});return c},override:function(a,b){if(b){var c=a.prototype;$pdk.apply(c,b);if($pdk.isIE&&b.toString!=a.toString){c.toString=b.toString}}},extend:function(){var h=function(a){for(var b in a){this[b]=a[b]}};var i=Object.prototype.constructor;return function(b,c,d){if($pdk.isObject(c)){d=c;c=b;b=d.constructor!=i?d.constructor:function(){c.apply(this,arguments)}}var e=function(){},f,g=c.prototype;e.prototype=g;f=b.prototype=new e;f.constructor=b;b.superclass=g;if(g.constructor==i){g.constructor=c}b.override=function(a){$pdk.override(b,a)};f.superclass=f.supr=function(){return g};f.override=h;$pdk.override(b,d);b.extend=function(a){$pdk.extend(b,a)};return b}}()});$pdk.ns(G);js.com.theplatform.pdk=$pdk}());function PDK(){var _='',Zd='\n-',xb='" for "gwt:onLoadErrorFn"',vb='" for "gwt:onPropertyErrorFn"',Md='"<script src=\\"',ib='"><\/script>',Z='#',Yd=');',Qd='-\n',$d='-><\/scr',de='.cache.js',Nd='.cache.js\\"><\/scr" + "ipt>"',P='/',lb='//',mc='01E096B5677BA63D89CEC3647519AC43',oc='0288734D037DB8DED107E1FF2A6A0F03',pc='04261CFF691BC3CC8FB2B51FD1091D1E',qc='05FBB33805B764728F39E84D9D3EA23B',rc='0863FFB4292A88B1A3F0B84BADF09E45',sc='0A3EE6CF20005F329578686E524FE820',tc='0E7A45C4CFF080675C071A1F405ABC7C',uc='135962BFE33D071945CC37534302DC12',vc='13B96773646A3A1C4352CB28A0591AD0',wc='18384946FB35BAB3031544467B3109CF',xc='18B56A764AFC90E63ABEA86F18B9C6CD',yc='1D008E58FF760B1A20DBE1013F39975F',zc='1E2BB222A4CBF167A5F0482C8E6E1046',Ac='1FA88DF6C1C2097963FC81FEDF223BBE',Bc='295D4513739CCE8922F96A1CEACA6D62',Cc='2C3FDCC71AADF6970962E930D8EFB79E',Dc='2CD156C17E3AA787DDE6964C3E1FBAF4',Ec='2D13CD53CB9755A0A83CF47942FD68FF',Fc='3209381CB54FB346B394FEA3C82CB7DE',Gc='3414F59FC5316D28A964E097D689AF02',Hc='346E572BCA75559AD3170316E40706EB',Ic='34BC92BAECDC911220B880FA3AB3FB05',Jc='3B1FDACAB7DA1432460D1ED825E2718E',Kc='4561949C033950D78C90E658FBFE86FA',Lc='464CB1DF84659D21FD6CED359065B292',Mc='4A6BFD6EE6900AF10856FCCD9041B03C',Nc='4B51921B078F25BFDADC7C151A314C04',Oc='4F400C719A8FD7BAEE8802C55EF4651E',Pc='5100302A9E768FEA31E0B35F7D668832',Qc='5900FDDD5F97C509FCA4964BEB56F7A5',Rc='5998C2F5B49B5F4AD87F5A14AA2AA27A',Sc='5D1DCCB2586467779379ABE6E1146BC1',Tc='5EC9986223B76E94A4D5E943959154B4',Uc='5ECB831B827A4B7CC6732AE7E53CC8A1',Vc='5F82E30D0A2E8EB1175CB750F95ADBA7',Wc='63A448AAE335BF78137682B46B02FEA3',Xc='63FDDAB89E848C4B2A7CE26751D27781',Yc='6BB60631E680A7CF0755FD5BEC644FE7',Zc='77991A91DC5E0289C3D56D5ECDB3672C',$c='7A8D80AE2E4E815DD700C989584D2A6C',_c='7AFC39F59B876A948E5344C147FB0D77',ad='81C8EC93F57C58C4D70B4EBD2AB00F9B',bd='85DA8BB3923B353E398E29F79C86DDD9',cd='875C06CADD37864442A88F261D0CC5F1',dd='88B58E6C48823BB20CFBEBEDDEF7A5BE',ed='8AE1F6D463D59ABC4ADC785130AE283F',fd='8CE405A7EAF92E780E64BC8ADF159D84',gd='8FD35D914BBB341A2949142E7716EB65',hd='94F3787EB918A7CA3B007688A987CD5E',id='96FE02E0B28A69DF199158A95EFACFE5',jd='98D9E10F533263FC296434AB76109AAA',kd='9A7A45697E2351AB5539A0AC9B595F9C',ld='9E5166BE192588F631BF4F79F5195C12',Jd=':',nc=':1',pb='::',Od='<scr',hb='<script id="',sb='=',$='?',md='A1B51648E257E068103388E4B8BB4DE5',nd='A38B9585B40E5F423BD10CC1E4522B96',od='A580F0B021EBA195DD359DC2327E49CD',pd='AB635A16167E244F74C023015678E410',qd='ACAD4B7406A75C01F3676E34EBEEBC43',rd='B6FE47B2466B5997F654B3D0E982902B',ub='Bad handler "',sd='C818D82B81E20555DD155B928CD65492',jc='Cross-site hosted mode not yet implemented. See issue ',td='D2EF74233EFE802F889FF0F5F1FABDC1',ud='D6F6A676542024036AC3E5D333558160',vd='D74BB62F04CA13668BAA0BBC93BBC94D',wd='DEB4C01DA71A2DDE1982A4AF2E0E42F8',xd='DF41D6CA3D65911E7085B4718E4C855B',yd='DF76017064F1B927700C47AE29383500',Kd='DOMContentLoaded',zd='E0EEC2AD41895DEA09E35931CF707A46',Ad='E176D74DB581909A8A2CBE503F5BEC8C',Bd='E858C0FD9EF1B8C3D75479DF50F0D7E3',Cd='EE8569F6002AEA04D368EE25097857BC',Dd='F10577F00EC1134F0EC55D2769484530',Ed='F20E0F70EB78E661E648D7C8410D6BA6',Fd='F60E3DB62B67DBD83D4524A2314AAB65',Gd='F70F0014A6462799B2AFFD1AA95D5FF6',Hd='F7275174082EEDB87CACD2355A0F4355',Id='FC8BA7B57AF1EE0C40ECE12398363F73',Q='PDK',eb='PDK.nocache.js',ob='PDK::',jb='SCRIPT',gb='__gwt_marker_PDK',Gb='android',Jb='android 2',Kb='android 3.0',kb='base',cb='baseUrl',T='begin',S='bootstrap',Hb='chrome',Ib='chrome_android',Yb='chrome_mac',Zb='chrome_windows',bb='clear.cache.gif',rb='content',Xd='document.write(',Y='end',Td='evtGroup: "loadExternalRefs", millis:(new Date()).getTime(),',Vd='evtGroup: "moduleStartup", millis:(new Date()).getTime(),',Eb='false',fc='gecko',ic='gecko1_8',hc='gecko1_8_mac',gc='gecko1_8_windows',U='gwt.codesvr=',V='gwt.hosted=',W='gwt.hybrid',wb='gwt:onLoadErrorFn',tb='gwt:onPropertyErrorFn',qb='gwt:property',yb='hasFlash',zb='hasJquery',be='head',Cb='html5',kc='http://code.google.com/p/google-web-toolkit/issues/detail?id=2079',bc='ie10',ac='ie10_app',ec='ie6',dc='ie8',cc='ie9',ab='img',Pb='ipad',Rb='iphone',_d='ipt>',Pd='ipt><!-',Ld='loadExternalRefs',Tb='macintosh',mb='meta',Sd='moduleName:"PDK", sessionId:window.__gwtStatsSessionId, subSystem:"startup",',ce='moduleRequested',X='moduleStartup',_b='msapphost',$b='msie',nb='name',Ob='opera',Bb='preferredruntimes',Ab='requiresPhase1',Ub='safari',Nb='safari_android',Mb='safari_android_legacy',Qb='safari_ipad',Sb='safari_iphone',Vb='safari_mac',Xb='safari_windows',db='script',lc='selectingPermutation',Lb='silk',R='startup',ae='text/javascript',Db='true',Ud='type: "end"});',Wd='type: "moduleRequested"});',fb='undefined',Fb='user.agent',Rd='window.__gwtStatsEvent && window.__gwtStatsEvent({',Wb='windows';var m=window,n=document,o=m.__gwtStatsEvent?function(a){return m.__gwtStatsEvent(a)}:null,p=m.__gwtStatsSessionId?m.__gwtStatsSessionId:null,q,r,s=$pdk.env.Detect.getInstance().baseDir()+P+$pdk.defaultAppJsRoot+P,t={},u=[],v=[],w=[],x=0,y,z;o&&o({moduleName:Q,sessionId:p,subSystem:R,evtGroup:S,millis:(new Date).getTime(),type:T});if(!m.__gwt_stylesLoaded){m.__gwt_stylesLoaded={}}if(!m.__gwt_scriptsLoaded){m.__gwt_scriptsLoaded={}}function A(){var b=false;try{var c=m.location.search;return (c.indexOf(U)!=-1||(c.indexOf(V)!=-1||m.external&&m.external.gwtOnLoad))&&c.indexOf(W)==-1}catch(a){}A=function(){return b};return b}
function B(){if(q&&r){var a=$pdk.env.Detect.getInstance().baseDir()+P+$pdk.defaultAppJsRoot+P;q(y,Q,a,x);o&&o({moduleName:Q,sessionId:p,subSystem:R,evtGroup:X,millis:(new Date).getTime(),type:Y})}}
function C(){function e(a){var b=a.lastIndexOf(Z);if(b==-1){b=a.length}var c=a.indexOf($);if(c==-1){c=a.length}var d=a.lastIndexOf(P,Math.min(c,b));return d>=0?a.substring(0,d+1):_}
function f(a){if(a.match(/^\w+:\/\//)){}else{var b=n.createElement(ab);b.src=a+bb;a=e(b.src)}return a}
function g(){var a=E(cb);if(a!=null){return a}return _}
function h(){var a=n.getElementsByTagName(db);for(var b=0;b<a.length;++b){if(a[b].src.indexOf(eb)!=-1){return e(a[b].src)}}return _}
function i(){var a;if(typeof isBodyLoaded==fb||!isBodyLoaded()){var b=gb;var c;n.write(hb+b+ib);c=n.getElementById(b);a=c&&c.previousSibling;while(a&&a.tagName!=jb){a=a.previousSibling}if(c){c.parentNode.removeChild(c)}if(a&&a.src){return e(a.src)}}return _}
function j(){var a=n.getElementsByTagName(kb);if(a.length>0){return a[a.length-1].href}return _}
function k(){var a=n.location;return a.href==a.protocol+lb+a.host+a.pathname+a.search+a.hash}
var l=g();if(l==_){l=h()}if(l==_){l=i()}if(l==_){l=j()}if(l==_&&k()){l=e(n.location.href)}l=f(l);s=l;return l}
function D(){var b=document.getElementsByTagName(mb);for(var c=0,d=b.length;c<d;++c){var e=b[c],f=e.getAttribute(nb),g;if(f){f=f.replace(ob,_);if(f.indexOf(pb)>=0){continue}if(f==qb){g=e.getAttribute(rb);if(g){var h,i=g.indexOf(sb);if(i>=0){f=g.substring(0,i);h=g.substring(i+1)}else{f=g;h=_}t[f]=h}}else if(f==tb){g=e.getAttribute(rb);if(g){try{z=eval(g)}catch(a){alert(ub+g+vb)}}}else if(f==wb){g=e.getAttribute(rb);if(g){try{y=eval(g)}catch(a){alert(ub+g+xb)}}}}}}
function E(a){var b=t[a];return b==null?null:b}
function F(a,b){var c=w;for(var d=0,e=a.length-1;d<e;++d){c=c[a[d]]||(c[a[d]]=[])}c[a[e]]=b}
function G(a){var b=v[a](),c=u[a];if(b in c){return b}var d=[];for(var e in c){d[c[e]]=e}if(z){z(a,d,b)}throw null}
v[yb]=function(){return String($pdk.env.Detect.getInstance().hasFlash())};u[yb]={'false':0,'true':1};v[zb]=function(){return String($pdk.env.Detect.getInstance().hasJquery())};u[zb]={'false':0,'true':1};v[Ab]=function(){var a=$pdk.env.Detect.getInstance().getConfigSet(Bb);return a&&a.contains(Cb)?Db:Eb};u[Ab]={'false':0,'true':1};v[Fb]=function(){var b=navigator.userAgent.toLowerCase();var c=function(a){return parseInt(a[1])*1000+parseInt(a[2])};if(function(){return b.indexOf(Gb)!=-1&&b.indexOf(Hb)!=-1}())return Ib;if(function(){return b.indexOf(Jb)!=-1||(b.indexOf(Kb)!=-1||b.indexOf(Lb)!=-1)}())return Mb;if(function(){return b.indexOf(Gb)!=-1&&(b.indexOf(Jb)==-1&&(b.indexOf(Kb)==-1&&b.indexOf(Lb)==-1))}())return Nb;if(function(){return b.indexOf(Ob)!=-1}())return Ob;if(function(){return b.indexOf(Pb)!=-1}())return Qb;if(function(){return b.indexOf(Rb)!=-1}())return Sb;if(function(){return b.indexOf(Hb)==-1&&(b.indexOf(Lb)==-1&&(b.indexOf(Tb)!=-1&&b.indexOf(Ub)!=-1))}())return Vb;if(function(){return b.indexOf(Hb)==-1&&(b.indexOf(Lb)==-1&&(b.indexOf(Wb)!=-1&&b.indexOf(Ub)!=-1))}())return Xb;if(function(){return b.indexOf(Lb)==-1&&(b.indexOf(Tb)!=-1&&b.indexOf(Hb)!=-1)}())return Yb;if(function(){return b.indexOf(Lb)==-1&&(b.indexOf(Wb)!=-1&&b.indexOf(Hb)!=-1)}())return Zb;if(function(){return b.indexOf($b)!=-1&&(b.indexOf(_b)!=-1&&n.documentMode>=10)}())return ac;if(function(){return b.indexOf($b)!=-1&&n.documentMode>=10}())return bc;if(function(){return b.indexOf($b)!=-1&&n.documentMode>=9}())return cc;if(function(){return b.indexOf($b)!=-1&&n.documentMode>=8}())return dc;if(function(){var a=/msie ([0-9]+)\.([0-9]+)/.exec(b);if(a&&a.length==3)return c(a)>=6000}())return ec;if(function(){return b.indexOf(fc)!=-1&&b.indexOf(Wb)!=-1}())return gc;if(function(){return b.indexOf(fc)!=-1&&b.indexOf(Tb)!=-1}())return hc;if(function(){return b.indexOf(fc)!=-1}())return ic;return Yb};u[Fb]={chrome_android:0,chrome_mac:1,chrome_windows:2,gecko1_8:3,gecko1_8_mac:4,gecko1_8_windows:5,ie10:6,ie10_app:7,ie6:8,ie8:9,ie9:10,opera:11,safari:12,safari_android:13,safari_android_legacy:14,safari_ipad:15,safari_iphone:16,safari_mac:17,safari_windows:18};PDK.onScriptLoad=function(a){PDK.onScriptLoad=null;q=a;B()};if(A()){alert(jc+kc);return}D();C();o&&o({moduleName:Q,sessionId:p,subSystem:R,evtGroup:S,millis:(new Date).getTime(),type:lc});var H;try{F([Eb,Eb,Eb,Sb],mc);F([Eb,Eb,Db,Sb],mc);F([Eb,Eb,Eb,Sb],mc+nc);F([Eb,Eb,Db,Sb],mc+nc);F([Db,Eb,Eb,Qb],oc);F([Db,Eb,Db,Qb],oc);F([Db,Eb,Eb,Qb],oc+nc);F([Db,Eb,Db,Qb],oc+nc);F([Eb,Eb,Eb,Ub],pc);F([Eb,Eb,Db,Ub],pc);F([Eb,Eb,Eb,Ub],pc+nc);F([Eb,Eb,Db,Ub],pc+nc);F([Db,Eb,Eb,Ib],qc);F([Db,Eb,Db,Ib],qc);F([Db,Eb,Eb,Ib],qc+nc);F([Db,Eb,Db,Ib],qc+nc);F([Eb,Db,Eb,Zb],rc);F([Eb,Db,Db,Zb],rc);F([Eb,Db,Eb,Zb],rc+nc);F([Eb,Db,Db,Zb],rc+nc);F([Db,Eb,Eb,ic],sc);F([Db,Eb,Db,ic],sc);F([Db,Eb,Eb,ic],sc+nc);F([Db,Eb,Db,ic],sc+nc);F([Db,Db,Eb,Vb],tc);F([Db,Db,Db,Vb],tc);F([Db,Db,Eb,Vb],tc+nc);F([Db,Db,Db,Vb],tc+nc);F([Eb,Eb,Eb,Qb],uc);F([Eb,Eb,Db,Qb],uc);F([Eb,Eb,Eb,Qb],uc+nc);F([Eb,Eb,Db,Qb],uc+nc);F([Db,Eb,Eb,Ob],vc);F([Db,Eb,Db,Ob],vc);F([Db,Eb,Eb,Ob],vc+nc);F([Db,Eb,Db,Ob],vc+nc);F([Eb,Db,Eb,cc],wc);F([Eb,Db,Db,cc],wc);F([Eb,Db,Eb,cc],wc+nc);F([Eb,Db,Db,cc],wc+nc);F([Eb,Eb,Eb,Ib],xc);F([Eb,Eb,Db,Ib],xc);F([Eb,Eb,Eb,Ib],xc+nc);F([Eb,Eb,Db,Ib],xc+nc);F([Eb,Db,Eb,Xb],yc);F([Eb,Db,Db,Xb],yc);F([Eb,Db,Eb,Xb],yc+nc);F([Eb,Db,Db,Xb],yc+nc);F([Eb,Eb,Eb,cc],zc);F([Eb,Eb,Db,cc],zc);F([Eb,Eb,Eb,cc],zc+nc);F([Eb,Eb,Db,cc],zc+nc);F([Db,Db,Eb,Sb],Ac);F([Db,Db,Db,Sb],Ac);F([Db,Db,Eb,Sb],Ac+nc);F([Db,Db,Db,Sb],Ac+nc);F([Eb,Db,Eb,Nb],Bc);F([Eb,Db,Db,Nb],Bc);F([Eb,Db,Eb,Nb],Bc+nc);F([Eb,Db,Db,Nb],Bc+nc);F([Db,Db,Eb,Xb],Cc);F([Db,Db,Db,Xb],Cc);F([Db,Db,Eb,Xb],Cc+nc);F([Db,Db,Db,Xb],Cc+nc);F([Db,Db,Eb,Mb],Dc);F([Db,Db,Db,Mb],Dc);F([Db,Db,Eb,Mb],Dc+nc);F([Db,Db,Db,Mb],Dc+nc);F([Eb,Eb,Eb,gc],Ec);F([Eb,Eb,Db,gc],Ec);F([Eb,Eb,Eb,gc],Ec+nc);F([Eb,Eb,Db,gc],Ec+nc);F([Db,Db,Eb,Ub],Fc);F([Db,Db,Db,Ub],Fc);F([Db,Db,Eb,Ub],Fc+nc);F([Db,Db,Db,Ub],Fc+nc);F([Eb,Eb,Eb,Yb],Gc);F([Eb,Eb,Db,Yb],Gc);F([Eb,Eb,Eb,Yb],Gc+nc);F([Eb,Eb,Db,Yb],Gc+nc);F([Db,Eb,Eb,dc],Hc);F([Db,Eb,Db,dc],Hc);F([Db,Eb,Eb,dc],Hc+nc);F([Db,Eb,Db,dc],Hc+nc);F([Db,Eb,Eb,Nb],Ic);F([Db,Eb,Db,Nb],Ic);F([Db,Eb,Eb,Nb],Ic+nc);F([Db,Eb,Db,Nb],Ic+nc);F([Db,Eb,Eb,bc],Jc);F([Db,Eb,Db,bc],Jc);F([Db,Eb,Eb,bc],Jc+nc);F([Db,Eb,Db,bc],Jc+nc);F([Eb,Eb,Eb,Xb],Kc);F([Eb,Eb,Db,Xb],Kc);F([Eb,Eb,Eb,Xb],Kc+nc);F([Eb,Eb,Db,Xb],Kc+nc);F([Db,Db,Eb,cc],Lc);F([Db,Db,Db,cc],Lc);F([Db,Db,Eb,cc],Lc+nc);F([Db,Db,Db,cc],Lc+nc);F([Eb,Db,Eb,ic],Mc);F([Eb,Db,Db,ic],Mc);F([Eb,Db,Eb,ic],Mc+nc);F([Eb,Db,Db,ic],Mc+nc);F([Db,Eb,Eb,hc],Nc);F([Db,Eb,Db,hc],Nc);F([Db,Eb,Eb,hc],Nc+nc);F([Db,Eb,Db,hc],Nc+nc);F([Db,Eb,Eb,Mb],Oc);F([Db,Eb,Db,Mb],Oc);F([Db,Eb,Eb,Mb],Oc+nc);F([Db,Eb,Db,Mb],Oc+nc);F([Eb,Eb,Eb,dc],Pc);F([Eb,Eb,Db,dc],Pc);F([Eb,Eb,Eb,dc],Pc+nc);F([Eb,Eb,Db,dc],Pc+nc);F([Db,Db,Eb,ec],Qc);F([Db,Db,Db,ec],Qc);F([Db,Db,Eb,ec],Qc+nc);F([Db,Db,Db,ec],Qc+nc);F([Eb,Eb,Eb,ec],Rc);F([Eb,Eb,Db,ec],Rc);F([Eb,Eb,Eb,ec],Rc+nc);F([Eb,Eb,Db,ec],Rc+nc);F([Db,Db,Eb,Ob],Sc);F([Db,Db,Db,Ob],Sc);F([Db,Db,Eb,Ob],Sc+nc);F([Db,Db,Db,Ob],Sc+nc);F([Eb,Eb,Eb,Mb],Tc);F([Eb,Eb,Db,Mb],Tc);F([Eb,Eb,Eb,Mb],Tc+nc);F([Eb,Eb,Db,Mb],Tc+nc);F([Eb,Eb,Eb,Zb],Uc);F([Eb,Eb,Db,Zb],Uc);F([Eb,Eb,Eb,Zb],Uc+nc);F([Eb,Eb,Db,Zb],Uc+nc);F([Eb,Db,Eb,bc],Vc);F([Eb,Db,Db,bc],Vc);F([Eb,Db,Eb,bc],Vc+nc);F([Eb,Db,Db,bc],Vc+nc);F([Eb,Eb,Eb,hc],Wc);F([Eb,Eb,Db,hc],Wc);F([Eb,Eb,Eb,hc],Wc+nc);F([Eb,Eb,Db,hc],Wc+nc);F([Db,Eb,Eb,Ub],Xc);F([Db,Eb,Db,Ub],Xc);F([Db,Eb,Eb,Ub],Xc+nc);F([Db,Eb,Db,Ub],Xc+nc);F([Eb,Db,Eb,dc],Yc);F([Eb,Db,Db,dc],Yc);F([Eb,Db,Eb,dc],Yc+nc);F([Eb,Db,Db,dc],Yc+nc);F([Eb,Db,Eb,Vb],Zc);F([Eb,Db,Db,Vb],Zc);F([Eb,Db,Eb,Vb],Zc+nc);F([Eb,Db,Db,Vb],Zc+nc);F([Db,Db,Eb,Ib],$c);F([Db,Db,Db,Ib],$c);F([Db,Db,Eb,Ib],$c+nc);F([Db,Db,Db,Ib],$c+nc);F([Db,Eb,Eb,Xb],_c);F([Db,Eb,Db,Xb],_c);F([Db,Eb,Eb,Xb],_c+nc);F([Db,Eb,Db,Xb],_c+nc);F([Eb,Db,Eb,gc],ad);F([Eb,Db,Db,gc],ad);F([Eb,Db,Eb,gc],ad+nc);F([Eb,Db,Db,gc],ad+nc);F([Eb,Db,Eb,ac],bd);F([Eb,Db,Db,ac],bd);F([Eb,Db,Eb,ac],bd+nc);F([Eb,Db,Db,ac],bd+nc);F([Db,Eb,Eb,ec],cd);F([Db,Eb,Db,ec],cd);F([Db,Eb,Eb,ec],cd+nc);F([Db,Eb,Db,ec],cd+nc);F([Db,Db,Eb,dc],dd);F([Db,Db,Db,dc],dd);F([Db,Db,Eb,dc],dd+nc);F([Db,Db,Db,dc],dd+nc);F([Eb,Eb,Eb,Vb],ed);F([Eb,Eb,Db,Vb],ed);F([Eb,Eb,Eb,Vb],ed+nc);F([Eb,Eb,Db,Vb],ed+nc);F([Db,Eb,Eb,Zb],fd);F([Db,Eb,Db,Zb],fd);F([Db,Eb,Eb,Zb],fd+nc);F([Db,Eb,Db,Zb],fd+nc);F([Eb,Db,Eb,Sb],gd);F([Eb,Db,Db,Sb],gd);F([Eb,Db,Eb,Sb],gd+nc);F([Eb,Db,Db,Sb],gd+nc);F([Eb,Db,Eb,Ib],hd);F([Eb,Db,Db,Ib],hd);F([Eb,Db,Eb,Ib],hd+nc);F([Eb,Db,Db,Ib],hd+nc);F([Db,Db,Eb,ic],id);F([Db,Db,Db,ic],id);F([Db,Db,Eb,ic],id+nc);F([Db,Db,Db,ic],id+nc);F([Db,Eb,Eb,Vb],jd);F([Db,Eb,Db,Vb],jd);F([Db,Eb,Eb,Vb],jd+nc);F([Db,Eb,Db,Vb],jd+nc);F([Eb,Db,Eb,hc],kd);F([Eb,Db,Db,hc],kd);F([Eb,Db,Eb,hc],kd+nc);F([Eb,Db,Db,hc],kd+nc);F([Db,Db,Eb,Yb],ld);F([Db,Db,Db,Yb],ld);F([Db,Db,Eb,Yb],ld+nc);F([Db,Db,Db,Yb],ld+nc);F([Db,Eb,Eb,ac],md);F([Db,Eb,Db,ac],md);F([Db,Eb,Eb,ac],md+nc);F([Db,Eb,Db,ac],md+nc);F([Db,Db,Eb,gc],nd);F([Db,Db,Db,gc],nd);F([Db,Db,Eb,gc],nd+nc);F([Db,Db,Db,gc],nd+nc);F([Db,Db,Eb,bc],od);F([Db,Db,Db,bc],od);F([Db,Db,Eb,bc],od+nc);F([Db,Db,Db,bc],od+nc);F([Eb,Db,Eb,Ob],pd);F([Eb,Db,Db,Ob],pd);F([Eb,Db,Eb,Ob],pd+nc);F([Eb,Db,Db,Ob],pd+nc);F([Eb,Db,Eb,ec],qd);F([Eb,Db,Db,ec],qd);F([Eb,Db,Eb,ec],qd+nc);F([Eb,Db,Db,ec],qd+nc);F([Db,Db,Eb,hc],rd);F([Db,Db,Db,hc],rd);F([Db,Db,Eb,hc],rd+nc);F([Db,Db,Db,hc],rd+nc);F([Db,Db,Eb,Qb],sd);F([Db,Db,Db,Qb],sd);F([Db,Db,Eb,Qb],sd+nc);F([Db,Db,Db,Qb],sd+nc);F([Eb,Db,Eb,Ub],td);F([Eb,Db,Db,Ub],td);F([Eb,Db,Eb,Ub],td+nc);F([Eb,Db,Db,Ub],td+nc);F([Eb,Db,Eb,Mb],ud);F([Eb,Db,Db,Mb],ud);F([Eb,Db,Eb,Mb],ud+nc);F([Eb,Db,Db,Mb],ud+nc);F([Eb,Eb,Eb,ac],vd);F([Eb,Eb,Db,ac],vd);F([Eb,Eb,Eb,ac],vd+nc);F([Eb,Eb,Db,ac],vd+nc);F([Db,Db,Eb,Nb],wd);F([Db,Db,Db,Nb],wd);F([Db,Db,Eb,Nb],wd+nc);F([Db,Db,Db,Nb],wd+nc);F([Eb,Db,Eb,Yb],xd);F([Eb,Db,Db,Yb],xd);F([Eb,Db,Eb,Yb],xd+nc);F([Eb,Db,Db,Yb],xd+nc);F([Db,Db,Eb,Zb],yd);F([Db,Db,Db,Zb],yd);F([Db,Db,Eb,Zb],yd+nc);F([Db,Db,Db,Zb],yd+nc);F([Eb,Db,Eb,Qb],zd);F([Eb,Db,Db,Qb],zd);F([Eb,Db,Eb,Qb],zd+nc);F([Eb,Db,Db,Qb],zd+nc);F([Eb,Eb,Eb,Ob],Ad);F([Eb,Eb,Db,Ob],Ad);F([Eb,Eb,Eb,Ob],Ad+nc);F([Eb,Eb,Db,Ob],Ad+nc);F([Eb,Eb,Eb,Nb],Bd);F([Eb,Eb,Db,Nb],Bd);F([Eb,Eb,Eb,Nb],Bd+nc);F([Eb,Eb,Db,Nb],Bd+nc);F([Db,Db,Eb,ac],Cd);F([Db,Db,Db,ac],Cd);F([Db,Db,Eb,ac],Cd+nc);F([Db,Db,Db,ac],Cd+nc);F([Db,Eb,Eb,Yb],Dd);F([Db,Eb,Db,Yb],Dd);F([Db,Eb,Eb,Yb],Dd+nc);F([Db,Eb,Db,Yb],Dd+nc);F([Eb,Eb,Eb,bc],Ed);F([Eb,Eb,Db,bc],Ed);F([Eb,Eb,Eb,bc],Ed+nc);F([Eb,Eb,Db,bc],Ed+nc);F([Db,Eb,Eb,gc],Fd);F([Db,Eb,Db,gc],Fd);F([Db,Eb,Eb,gc],Fd+nc);F([Db,Eb,Db,gc],Fd+nc);F([Eb,Eb,Eb,ic],Gd);F([Eb,Eb,Db,ic],Gd);F([Eb,Eb,Eb,ic],Gd+nc);F([Eb,Eb,Db,ic],Gd+nc);F([Db,Eb,Eb,cc],Hd);F([Db,Eb,Db,cc],Hd);F([Db,Eb,Eb,cc],Hd+nc);F([Db,Eb,Db,cc],Hd+nc);F([Db,Eb,Eb,Sb],Id);F([Db,Eb,Db,Sb],Id);F([Db,Eb,Eb,Sb],Id+nc);F([Db,Eb,Db,Sb],Id+nc);H=w[G(yb)][G(zb)][G(Ab)][G(Fb)];var I=H.indexOf(Jd);if(I!=-1){x=Number(H.substring(I+1));H=H.substring(0,I)}}catch(a){return}var J;function K(){if(!r){r=true;B();if(n.removeEventListener){n.removeEventListener(Kd,K,false)}if(J){clearInterval(J)}}}
if(n.addEventListener){n.addEventListener(Kd,function(){K()},false)}var J=setInterval(function(){if(/loaded|complete/.test(n.readyState)){K()}},50);o&&o({moduleName:Q,sessionId:p,subSystem:R,evtGroup:S,millis:(new Date).getTime(),type:Y});o&&o({moduleName:Q,sessionId:p,subSystem:R,evtGroup:Ld,millis:(new Date).getTime(),type:T});var L=$pdk.env.Detect.getInstance().baseDir()+P+$pdk.defaultAppJsRoot+P;if(/loaded|complete|interactive/.test(document.readyState)===false){var M=Md+L+H+Nd;n.write(Od+Pd+Qd+Rd+Sd+Td+Ud+Rd+Sd+Vd+Wd+Xd+M+Yd+Zd+$d+_d)}else{var N=document.createElement(db);N.type=ae;var O=document.getElementsByTagName(be)[0];if(!O)O=document.body;window.__gwtStatsEvent&&window.__gwtStatsEvent({moduleName:Q,sessionId:window.__gwtStatsSessionId,subSystem:R,evtGroup:Ld,millis:(new Date).getTime(),type:Y});window.__gwtStatsEvent&&window.__gwtStatsEvent({moduleName:Q,sessionId:window.__gwtStatsSessionId,subSystem:R,evtGroup:X,millis:(new Date).getTime(),type:ce});N.src=L+H+de;O.appendChild(N)}}
$pdk.gwtBootloader=function(a){PDK()};$pdk.ns("$pdk.entrypoint");
$pdk.entrypoint.Entrypoint=$pdk.extend(function(){},{constructor:function(){this._complete=false;
this._registry=null;
this._env=null;
this._callBacks=[];
this._postOnLoad=function(){}
},configure:function(a,b){this._registry=a;
this._env=b
},_loaded:false,addCallback:function(a){this._callBacks.push(a);
if(this._loaded){a.apply()
}},initialize:function(){},onLoad:function(){var c=0,a=this._callBacks.length,d=this;
this._loaded=true;
for(;
c<a;
c++){this._callBacks[c].apply()
}var b=typeof(window._PDK_SUPRESS_INITIALIZE)==="boolean"?window._PDK_SUPRESS_INITIALIZE:false;
if((this._env===null||this._env.getAutoInitialize())&&!b){this.initialize()
}this._postOnLoad()
}});
$pdk.ns("$pdk.env.Detect");
$pdk.env.Detect._class=$pdk.extend(function(){},{constructor:function(){$pdk.env.Detect._class.superclass.constructor.call(this);
this._config_sets={};
this._has_jquery=window.jQuery!==null&&typeof(window.jQuery)==="function";
this._flash_version=null;
this._model_urls=this._parseRSS();
this._nonie_flash_test_str=null;
this._nonie_silverlight_test_str=null;
this._has_video=this._detectVideo();
this._has_silverlight=null;
this._default_runtimes=["flash","html5"];
this._preferred_formats=null;
this._default_formats=["mpeg4","f4m","m3u","webm","ogg","flv"];
this._media_factory=null;
this._playback_format=null;
this._playback_runtime=null;
this._playback_formats=null;
this._supported_runtimes=null;
this._preferred_formats_unfiltered=null;
this._preload_stylesheets={};
this._cookies=this._parseCookies(document.cookie)
},getCookies:function(){return this._cookies
},removePreloadStylesheet:function(a){var b=document.getElementById(a+"Loading");
if(!$pdk.isEmpty(b)&&!$pdk.isEmpty(b.parentNode)){b.parentNode.removeChild(b)
}},config:function(b,a){this._nonie_flash_test_str=b;
this._nonie_silverlight_test_str=a
},getPlaybackFormat:function(){return this._playback_format
},setPlaybackFormat:function(a){this._playback_format=a
},getPlaybackRuntime:function(){return this._playback_runtime
},setPlaybackRuntime:function(a){this._playback_runtime=a
},_parseCookies:function(f){var e={},d,b=f.split(";"),c=b.length,a;
for(d=0;
d<c;
d++){a=b[d].split("=");
e[a[0].replace(/\s/g,"")]=a[1]
}return e
},_detectFlash:function(){var a=[],d=null,b=[0,0,0],f=null;
try{d=this._nonie_flash_test_str===null?navigator.plugins["Shockwave Flash"].description:this._nonie_flash_test_str
}catch(j){d=null
}if(typeof(d)==="string"&&d.length>0){try{f=navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin
}catch(h){f=null
}if(f!==null){d=d.replace(/^.*\s+(\S+\s+\S+$)/,"$1");
b[0]=parseInt(d.replace(/^(.*)\..*$/,"$1"),10);
b[1]=parseInt(d.replace(/^.*\.(.*)\s.*$/,"$1"),10);
b[2]=/[a-zA-Z]/.test(d)?parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0
}}else{try{var c=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
d=c.GetVariable("$version")
}catch(g){a=null
}if(typeof(d)==="string"){a=d.split(" ")[1].split(",");
b=[parseInt(a[0],10),parseInt(a[1],10),parseInt(a[2],10)]
}}return b
},_detectVideo:function(){var c='video/mp4; codecs="avc1.42E01E',d=document.createElement("video"),e=typeof(d.canPlayType)==="function",b={hasVideo:e,codecs:{ogg:false,h264:false,webm:false,m3u:false,mp3:false,aac:false}},a={ogg:['video/ogg; codecs="theora"'],h264:[c+'"',c+', mp4a.40.2"'],webm:['video/webm; codecs="vp8, vorbis"','video/x-webm; codecs="vp8, vorbis"'],m3u:["application/vnd.apple.mpegurl",'audio/x-mpegurl; codecs="mp4a.40.2"','vnd.apple.mpegURL; codecs="mp4a.40.2"','application/x-mpegURL; codecs="mp4a.40.2"'],mp3:["audio/mpeg;"],aac:['audio/mp4; codecs="mp4a.40.5"']};
if(e){b.codecs={ogg:this._detectVidFormat(d,a.ogg),h264:this._detectVidFormat(d,a.h264),webm:this._detectVidFormat(d,a.webm),m3u:this._detectVidFormat(d,a.m3u),mp3:this._detectVidFormat(d,a.mp3),aac:this._detectVidFormat(d,a.aac)}
}return b
},_detectVidFormat:function(d,a){var e=a.length,c=false;
for(var b=0;
b<e;
b++){c=!($pdk.isEmpty(d.canPlayType(a[b]))||d.canPlayType(a[b]).toLowerCase()==="no")||(a[b]=='vnd.apple.mpegURL; codecs="mp4a.40.2"'&&$pdk.isChrome&&$pdk.isAndroid);
if(c){break
}}return c
},_detectSilverlight:function(){var j=null,d,a,f,l=false,c,b,k=[4,0,0,0];
if(typeof(window.ActiveXObject)==="function"){try{j=new ActiveXObject("AgControl.AgControl");
l=j.IsVersionSupported(k.join("."))
}catch(g){l=false
}}else{try{f=navigator.plugins["Silverlight Plug-In"];
c=this._nonie_silverlight_test_str!==null?this._nonie_silverlight_test_str:String(f.description);
c=c==="1.0.30226.2"?"2.0.30226.2":c;
b=c.split(".");
for(d=0;
d<4;
d++){a=b[d];
a=typeof(a)==="string"?parseInt(a,10):0;
b[d]=a
}l=$pdk.tupleComp(k,b,function(m,e){var n=e>m?1:0;
return e<m?-1:n
})>=0
}catch(h){l=false
}}return l
},_parseRSS:function(){var k=document.getElementsByTagName("link"),h=k.length,f=false,c=false,a,b,j={releaseurl:null,releasemodel:null,categorymodel:null,rssurl:null},d;
for(d=0;
d<h;
d++){if(!f&&k[d].type=="application/rss+xml"&&k[d].rel=="alternate"&&k[d].href.length>0){a=k[d].href;
j.rssurl=a;
try{b=a.split("?")
}catch(g){b=[]
}if(b.length>0){j.releasemodelbase=b[0];
j.releasemodel=b[0];
j.categorymodelbase=[b[0],"/categories"].join("");
j.categorymodel=[b[0],"/categories/?form=json&fields=fullTitle,id,label,order,title"].join("");
f=true
}}else{if(!c&&(k[d].type=="application/smil+xml"||k[d].type=="application/smil"||k[d].className==="tpRelease")){a=k[d].href;
if(typeof(a)==="string"&&a.length>0&&a!==document.URL){j.releaseurl=a;
c=true
}}}}return j
},_filterSupportedMedia:function(g){var e,b=[],d,c=g.length,f,a=false;
for(d=0;
d<c;
d++){e=g[d].toLowerCase();
switch(e){case"flash":if(this.hasFlash()){b.push("flash:3gpp");
b.push("flash:3gpp2");
b.push("flash:aac");
b.push("flash:actionscript");
b.push("flash:f4m");
b.push("flash:flv");
b.push("flash:mp3");
b.push("flash:mpeg");
b.push("flash:mpeg4");
b.push("flash:qt")
}break;
case"html5":f=this.hasVideo();
if(f.hasVideo){codecs=f.codecs;
if(codecs.ogg){b.push("html5:ogg")
}if(codecs.h264){b.push("html5:mpeg4")
}if(codecs.webm){b.push("html5:webm")
}if(codecs.m3u){b.push("html5:m3u")
}if(codecs.mp3){b.push("html5:mp3")
}if(codecs.aac){b.push("html5:aac")
}}b.push("html5:javascript");
break;
case"silverlight":if(this.hasFlash()){b.push("silverlight:asx");
b.push("silverlight:ism");
b.push("silverlight:mpeg4");
b.push("silverlight:wm")
}break;
case"windowsmedia":break;
case"move":break;
default:break
}}return b
},canPlayTypeAugmentation:function(){var a=0,c=$pdk.canPlayTypeAugmentation,b=this.getConfigSet("canplaytypeaugmentation");
c=typeof(c)==="boolean"?c:true;
if(c&&!$pdk.isEmpty(b)){b=b.toArray();
for(;
a<b.length;
a++){if(b[a].toLowerCase()==="false"){c=false;
break
}}}return c
},sortM3uArray:function(b){var a=[];
for(i=b.length-1;
i>=0;
i--){if(b[i]==="m3u"){a.push(b[i])
}else{a.unshift(b[i])
}}return a
},getPreferredFormats:function(){if(this._preferred_formats===null){try{this._preferred_formats=this._filterPreferredFormats(this.getConfigSet("preferredformats").toArray())
}catch(a){this._preferred_formats=[]
}if(this._preferred_formats.length<1){this._preferred_formats=this._filterPreferredFormats(this._default_formats)
}if($pdk.isAndroid&&this.canPlayTypeAugmentation()){tpDebug("resorting preferred formats for Android","bootloader","$pdk.env.Detect",tpConsts.DEBUG);
this._preferred_formats=this.sortM3uArray(this._preferred_formats)
}}return this._preferred_formats
},getPreferredFormatsUnfiltered:function(){if(this._preferred_formats_unfiltered===null){try{this._preferred_formats_unfiltered=this.getConfigSet("preferredformats").toArray()
}catch(a){this._preferred_formats_unfiltered=[]
}if(this._preferred_formats_unfiltered.length<1){this._preferred_formats_unfiltered=this._default_formats
}if($pdk.isAndroid&&this.canPlayTypeAugmentation()){this._preferred_formats_unfiltered=this.sortM3uArray(this._preferred_formats_unfiltered)
}}return this._preferred_formats_unfiltered
},_filterPreferredFormats:function(d){var e=d.length,f,a=[],h,b,g=false,c;
h=this.hasVideo();
b=h.codecs;
for(c=0;
c<e;
c++){f=d[c].toLowerCase();
g=false;
switch(f){case"mpeg":case"mpeg4":if(b.h264||this.hasFlash()){g=true
}break;
case"m3u":if(b.m3u||this.hasFlash()){g=true
}break;
case"ogg":if(b.ogg){g=true
}break;
case"webm":if(b.webm){g=true
}break;
case"ism":case"asx":case"wm":case"move":case"flv":case"f4m":if(this.hasFlash()){g=true
}break;
default:break
}if(g){a.push(d[c])
}}return a
},getPlayerFormats:function(a){if(this._playback_formats===null){this._playback_formats=[];
if(this.getPlaybackRuntime()!==null){this._playback_formats=this._filterPlayerFormats(this.getPlaybackRuntime())
}if(this._playback_formats.length<1){if(a===undefined){a="flash"
}this._playback_formats=this._filterPlayerFormats(a)
}}return this._playback_formats
},_filterPlayerFormats:function(g){var e=this.getPreferredFormats(),d=e.length,a=[],f,h,b,c;
h=this.hasVideo();
b=h.codecs;
g=g.toLowerCase();
for(c=0;
c<d;
c++){f=e[c].toLowerCase();
switch(f){case"mpeg":case"mpeg4":if((g==="html5"&&b.h264)||((g==="flash"||g==="silverlight")&&this.hasFlash())){a.push(e[c])
}break;
case"m3u":if(g==="html5"&&b.m3u){a.push(e[c])
}break;
case"ogg":if(g==="html5"&&b.ogg){a.push(e[c])
}break;
case"webm":if(g==="html5"&&b.webm){a.push(e[c])
}break;
case"ism":if((g==="flash"||g==="silverlight")&&this.hasFlash()){a.push(e[c])
}break;
case"asx":case"wm":if((g==="flash"||g==="silverlight"||g==="windowsmedia")&&this.hasFlash()){a.push(e[c])
}break;
case"flv":case"f4m":if((g==="flash")&&this.hasFlash()){a.push(e[c])
}break;
case"move":if((g==="flash"||g==="move")&&this.hasFlash()){a.push(e[c])
}break;
default:break
}}return a
},getModelUrls:function(){return this._model_urls
},getFlashVersion:function(){if(this._flash_version===null){this._flash_version=this._detectFlash()
}return this._flash_version
},hasVideo:function(){return this._has_video
},hasFlash:function(){return $pdk.tupleComp([9,0,115],this.getFlashVersion(),function(d,c){var e=c>d?1:0;
return c<d?-1:e
})>=0
},hasSilverlight:function(){if(this._has_silverlight===null){this._has_silverlight=this._detectSilverlight()
}return this._has_silverlight
},hasJquery:function(){return this._has_jquery
},getAutoInitialize:function(){var a=true;
try{a=this.getConfigSet("initialize").toArray()[0].toLowerCase()!=="false"
}catch(b){a=true
}return a
},GWTReady:function(){return this._gwt_ready
},setGWTReady:function(a){this._gwt_ready=a
},addToConfigSet:function(a,b){var c=this._config_sets[a];
if($pdk.isEmpty(c)){c=new $pdk.util.ArraySet();
this._config_sets[a]=c
}c.add(b)
},getConfigSet:function(a){return this._config_sets[a]
},baseDir:function(){var a=$pdk.scriptRoot;
try{a=this.getConfigSet("baseurl").toArray()[0]
}catch(b){a=$pdk.scriptRoot
}return a
},cachePath:function(){return this.baseDir()+"/js"
},getMediaFactory:function(){if(this._media_factory===null){this._media_factory=new $pdk.env.media.Factory(this.getSupportedRuntimes(),this._filterSupportedMedia(["flash","html5","silverlight","windowsmedia","move"]),new $pdk.env.media.FactoryLoggerTpTraceMainImpl())
}return this._media_factory
},getSupportedRuntimes:function(){if(this._supported_runtimes===null){try{this._supported_runtimes=this._filterSupportedMedia(this.getConfigSet("preferredruntimes").toArray())
}catch(a){this._supported_runtimes=[]
}if(this._supported_runtimes.length<1){this._supported_runtimes=this._filterSupportedMedia(this._default_runtimes)
}}return this._supported_runtimes
},_detectPhase1:function(){var f=false;
var e=false;
var b=document.getElementsByTagName("script");
var d;
var a=b.length;
for(d=0;
d<a;
d++){var c=b[d].innerHTML;
if(!f&&(c.indexOf("tpRegisterID(")>=0)){f=true
}if(!e&&(c.indexOf("Player(")>=0||c.indexOf("ReleaseList(")>=0||c.indexOf("ReleaseModel(")>=0)){e=true
}if(f&&e){return true
}}return false
},isPhase1:function(){if(this._is_phase1===undefined){this._is_phase1=this._detectPhase1()
}return this._is_phase1
}});
$pdk.env.Detect._singleton=null;
$pdk.env.Detect.getInstance=function(){if($pdk.env.Detect._singleton===null){$pdk.env.Detect._singleton=new $pdk.env.Detect._class()
}return $pdk.env.Detect._singleton
};
$pdk.ns("$pdk.env.HttpHead");
$pdk.env.HttpHead.Processor=$pdk.extend(function(){},{constructor:function(a){this._env=a
},process:function(f){var e,a,b,g=this._collectTpMetaTags(f),d=g.length,c;
for(c=0;
c<d;
c++){e=g[c];
if(!$pdk.isEmpty(e.value)){a=e.value.replace(/\s/g,"").toLowerCase().split(",");
b=e.name.replace(/^tp:/,"").toLowerCase();
while(a.length>0){this._env.addToConfigSet(b,a.shift())
}}}},_collectTpMetaTags:function(g){var f,a=[],b,e,h=g.getElementsByTagName("meta"),d=h.length,c;
for(c=0;
c<d;
c++){f=h[c];
b=f.getAttribute("name");
if(typeof(b)==="string"&&b.match(/^tp:/)){e=f.getAttribute("content");
a.push({name:b,value:e})
}}return a
}});
$pdk.ns("$pdk.env.media");
$pdk.env.media.MediaBase=$pdk.extend(function(){},{_eligibleRuntimes:[],constructor:function(){this._satisfiedRuntimes={}
},satisfyRuntime:function(a){this._satisfiedRuntimes[a]=true
},isSatisfied:function(){var b,a=this._eligibleRuntimes.length,c=false;
for(b=0;
b<a&&!c;
b++){c=this._satisfiedRuntimes[this._eligibleRuntimes[b]];
c=typeof(c)==="boolean"?c:false
}return c
},getRuntimes:function(){var b=[],c,a=this._eligibleRuntimes.length;
for(c=0;
c<a;
c++){name=this._eligibleRuntimes[c];
found=this._satisfiedRuntimes[name];
if(typeof(found)==="boolean"?found:false){b.push(name)
}}return b
},getName:function(){return this._name
}});
$pdk.env.media.AacMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"aac",_eligibleRuntimes:["flash:aac","html5:aac"],constructor:function(){$pdk.env.media.AacMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.ActionScriptMedia=$pdk.extend($pdk.env.media.MediaBase,{_eligibleRuntimes:["flash:actionscript"],_name:"actionscript",constructor:function(){$pdk.env.media.ActionScriptMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.AsxMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"asx",_eligibleRuntimes:["silverlight:asx"],constructor:function(){$pdk.env.media.AsxMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.AviMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"avi",_eligibleRuntimes:["flash:avi"],constructor:function(){$pdk.env.media.AviMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.F4mMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"f4m",_eligibleRuntimes:["flash:f4m"],constructor:function(){$pdk.env.media.F4mMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.Factory=$pdk.extend(function(){},{constructor:function(b,a,c){this._runtimes=b;
this._runtimes_any_supported=a;
this._logger=c
},getBestRuntime:function(a,c,d){var b=new $pdk.env.media.strategy.Context(d,this._logger,this,c,this._runtimes,this._runtimes_any_supported),e;
if(a==="Player"){e=new $pdk.env.media.strategy.CodecComponentStrategy()
}else{e=new $pdk.env.media.strategy.GeneralComponentStrategy()
}return e.getBestRuntime(b)
},createMedia:function(d,c){c=typeof(c)==="boolean"?c:false;
var e,b=c?this._runtimes_any_supported:this._runtimes,a=b.length,f=null;
switch(d){case"actionscript":f=new $pdk.env.media.ActionScriptMedia();
break;
case"flv":f=new $pdk.env.media.FlvMedia();
break;
case"javascript":f=new $pdk.env.media.JavaScriptMedia();
break;
case"mpeg4":f=new $pdk.env.media.Mpeg4Media();
break;
case"mpeg":f=new $pdk.env.media.MpegMedia();
break;
case"ogg":f=new $pdk.env.media.OggMedia();
break;
case"webm":f=new $pdk.env.media.WebMMedia();
break;
case"m3u":f=new $pdk.env.media.M3uMedia();
break;
case"3gpp":f=new $pdk.env.media.ThreeGppMedia();
break;
case"3gpp2":f=new $pdk.env.media.ThreeGpp2Media();
break;
case"aac":f=new $pdk.env.media.AacMedia();
break;
case"asx":f=new $pdk.env.media.AsxMedia();
break;
case"avi":f=new $pdk.env.media.AviMedia();
break;
case"f4m":f=new $pdk.env.media.F4mMedia();
break;
case"m3u":f=new $pdk.env.media.M3uMedia();
break;
case"move":f=new $pdk.env.media.MoveMedia();
break;
case"mp3":f=new $pdk.env.media.Mp3Media();
break;
case"qt":f=new $pdk.env.media.QtMedia();
break;
case"ism":f=new $pdk.env.media.IsmMedia();
break;
case"wm":f=new $pdk.env.media.WmMedia();
break;
default:f=new $pdk.env.media.NoOpMedia();
break
}for(e=0;
e<a;
e++){f.satisfyRuntime(b[e])
}return f
}});
$pdk.env.media.FactoryLoggerConsoleImpl=$pdk.extend(function(){},{constructor:function(){},log:function(a,b){console.log(a)
}});
$pdk.env.media.FactoryLoggerTpTraceMainImpl=$pdk.extend(function(){},{constructor:function(){},log:function(a,b){tpDebug(a,"bootloader","$pdk.env.media.Factory",b)
}});
$pdk.env.media.FlvMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"flv",_eligibleRuntimes:["flash:flv"],constructor:function(){$pdk.env.media.FlvMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.IsmMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"ism",_eligibleRuntimes:["silverlight:ism"],constructor:function(){$pdk.env.media.IsmMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.JavaScriptMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"javascript",_eligibleRuntimes:["html5:javascript"],constructor:function(){$pdk.env.media.JavaScriptMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.M3uMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"m3u",_eligibleRuntimes:["html5:m3u"],constructor:function(){$pdk.env.media.M3uMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.MoveMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"move",_eligibleRuntimes:["flash:move"],constructor:function(){$pdk.env.media.MoveMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.Mp3Media=$pdk.extend($pdk.env.media.MediaBase,{_name:"mp3",_eligibleRuntimes:["flash:mp3","html5:mp3"],constructor:function(){$pdk.env.media.Mp3Media.superclass.constructor.apply(this)
}});
$pdk.env.media.Mpeg4Media=$pdk.extend($pdk.env.media.MediaBase,{_name:"mpeg4",_eligibleRuntimes:["flash:mpeg4","html5:mpeg4","silverlight:mpeg4"],constructor:function(){$pdk.env.media.Mpeg4Media.superclass.constructor.apply(this)
}});
$pdk.env.media.MpegMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"mpeg",_eligibleRuntimes:["flash:mpeg"],constructor:function(){$pdk.env.media.Mpeg4Media.superclass.constructor.apply(this)
}});
$pdk.env.media.NoOpMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"noop"});
$pdk.env.media.OggMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"ogg",_eligibleRuntimes:["html5:ogg"],constructor:function(){$pdk.env.media.OggMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.QtMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"qt",_eligibleRuntimes:["flash:qt"],constructor:function(){$pdk.env.media.QtMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.ThreeGpp2Media=$pdk.extend($pdk.env.media.MediaBase,{_name:"3gpp2",_eligibleRuntimes:["flash:3gpp2"],constructor:function(){$pdk.env.media.ThreeGpp2Media.superclass.constructor.apply(this)
}});
$pdk.env.media.ThreeGppMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"3gpp",_eligibleRuntimes:["flash:3gpp"],constructor:function(){$pdk.env.media.ThreeGppMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.WebMMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"webm",_eligibleRuntimes:["html5:webm"],constructor:function(){$pdk.env.media.WebMMedia.superclass.constructor.apply(this)
}});
$pdk.env.media.WmMedia=$pdk.extend($pdk.env.media.MediaBase,{_name:"wm",_eligibleRuntimes:["silverlight:wm"],constructor:function(){$pdk.env.media.WmMedia.superclass.constructor.apply(this)
}});
$pdk.ns("$pdk.env.media.strategy");
$pdk.env.media.strategy.AbstractStrategy=$pdk.extend(function(){},{_getPossibleFormats:function(f,e){var d,k=f.length,g,c,b=[],j,a=e.length,h;
for(g=0;
g<a;
g++){j=e[g].toLowerCase();
for(c=0;
c<k;
c++){d=f[c].toLowerCase();
if(j===d){b.push(d)
}}}return b
},_searchByFormatThenRuntime:function(o,p,k,a){var r=false,g,b,d,l,q=k.length,f,c=p.length,e,j,m,h;
for(g=0;
g<q&&!r;
g++){l=k[g];
b=o.createMedia(l,a);
j=b.getRuntimes();
m=j.length;
for(h=0;
h<c&&!r;
h++){f=p[h];
for(d=0;
d<m&&!r;
d++){e=j[d];
r=e===f
}}}return{runtime:r?f.replace(/(.*):.*/,"$1"):"none",medium:r?b.getName():"none"}
},_searchByRuntimeThenFormat:function(o,p,k,a){var r=false,g,b,d,l,q=k.length,f,c=p.length,e,j,m,h;
for(h=0;
h<c&&!r;
h++){f=p[h];
for(g=0;
g<q&&!r;
g++){l=k[g];
b=o.createMedia(l,a);
j=b.getRuntimes();
m=j.length;
for(d=0;
d<m&&!r;
d++){e=j[d];
r=e===f
}}}return{runtime:r?f.replace(/(.*):.*/,"$1"):"none",medium:r?b.getName():"none"}
}});
$pdk.env.media.strategy.CodecComponentStrategy=$pdk.extend($pdk.env.media.strategy.AbstractStrategy,{getBestRuntime:function(a){var d,e=a.getComponentSupportedFormats(),j=a.getLogger(),h=a.getMediaFactory(),b=[],f,c=a.getPreferredFormats(),g=a.getRuntimes();
runtimes_any_supported=a.getRuntimesAnySupported();
j.log("searching for best runtime for preferred formats ("+c.join(", ")+") from list of supported formats ("+e.join(", ")+")",tpConsts.INFO);
b=this._getPossibleFormats(e,c);
f=b.length;
j.log("possible formats narrowed to: "+(f>0?b.join(", "):"[none]"),tpConsts.INFO);
d=this._searchByFormatThenRuntime(h,g,b,false);
if(d.medium==="none"){j.log("falling back to any supported runtime",tpConsts.INFO);
d=this._searchByFormatThenRuntime(h,runtimes_any_supported,b,true)
}if(d.runtime==="none"){j.log("no viable runtime found",tpConsts.INFO)
}else{j.log("picked best format/runtime : "+d.medium+"/"+d.runtime,tpConsts.INFO)
}return d
}});
$pdk.env.media.strategy.Context=$pdk.extend(function(){},{constructor:function(f,c,d,e,b,a){this._component_supported_formats=f;
this._logger=c;
this._media_factory=d;
this._preferred_formats=e;
this._runtimes=b;
this._runtimes_any_supported=a
},getComponentSupportedFormats:function(){return this._component_supported_formats
},getLogger:function(){return this._logger
},getMediaFactory:function(){return this._media_factory
},getPreferredFormats:function(){return this._preferred_formats
},getRuntimes:function(){return this._runtimes
},getRuntimesAnySupported:function(){return this._runtimes_any_supported
}});
$pdk.env.media.strategy.GeneralComponentStrategy=$pdk.extend($pdk.env.media.strategy.AbstractStrategy,{getBestRuntime:function(a){var d,e=a.getComponentSupportedFormats(),j=a.getLogger(),h=a.getMediaFactory(),b=[],f,c=a.getPreferredFormats(),g=a.getRuntimes();
runtimes_any_supported=a.getRuntimesAnySupported();
b=this._getPossibleFormats(e,c);
f=b.length;
d=this._searchByFormatThenRuntime(h,g,b,false);
if(d.medium==="none"){d=this._searchByRuntimeThenFormat(h,g,e,false)
}if(d.medium==="none"){d=this._searchByFormatThenRuntime(h,runtimes_any_supported,b,true)
}if(d.medium==="none"){d=this._searchByFormatThenRuntime(h,runtimes_any_supported,e,true)
}if(d.runtime==="none"){j.log("no viable runtime found",tpConsts.INFO)
}else{j.log("picked best format/runtime : "+d.medium+"/"+d.runtime,tpConsts.INFO)
}return d
}});
$pdk.ns("$pdk.util");
$pdk.util.ArraySet=$pdk.extend(function(){},{constructor:function(){this._members=[]
},add:function(a){var b=!this.contains(a);
if(b){this._members.push(a)
}return b
},remove:function(b){var c=this._find(b),a=false;
if(c>-1){a=delete this._members[c]
}return a
},contains:function(a){return this._find(a)>-1
},toArray:function(){return this._members
},_find:function(c){var b=0,a=this._members.length,d=-1;
for(;
b<a&&d<0;
b++){d=c===this._members[b]?b:-1
}return d
}});
$pdk.util.Strings=$pdk.apply(function(){},{encodeXmlAttribute:function(a){return typeof(a)!=="string"?null:a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&apos").replace(/"/g,"&quot;")
}});
$pdk.Entrypoint=$pdk.apply({},{_class:$pdk.extend($pdk.entrypoint.Entrypoint,{constructor:function(){$pdk.Entrypoint._class.superclass.constructor.call(this);
this._loadingStyleInjected=false
},configure:function(a,b){$pdk.Entrypoint._class.superclass.configure.call(this,a,b);
this._insertDefaultStylesheet()
},_insertDefaultStylesheet:function(){var a=document.createElement("link");
a.type="text/css";
a.rel="stylesheet";
a.href=this._env.baseDir()+"/style/default.css";
a.media="screen";
document.getElementsByTagName("head")[0].insertBefore(a,document.getElementsByTagName("head")[0].firstChild)
},injectLoadingStyle:function(c){var b,a;
if(!this._loadingStyleInjected){for(class_name in $pdk.shell.Factory.CLASS_TABLE){b=[".",class_name,class_name==="tpPlayer"?" ":" > * ","{ display: none !important; }"].join("");
if(c){a=document.createElement("style");
a.setAttribute("type","text/css");
a.setAttribute("id",class_name+"Loading");
if(a.styleSheet){a.styleSheet.cssText=b
}else{a.innerHTML=b
}document.getElementsByTagName("head")[0].appendChild(a)
}else{document.write(['<style id="',class_name,'Loading" ',">",b,"</style>"].join(""))
}}this._loadingStyleInjected=true
}},_injectPhase1JS:function(){var e=this;
if(this._loaded){var c=this._env.baseDir();
var b=document.getElementsByTagName("head")[0];
if(typeof(window.tpPhase1Debug)!=="string"){com.theplatform.pdk.ExternalScriptLoader.loadScript("tpPDK.js",function(){})
}else{var d=document.createElement("script");
d.type="text/javascript";
d.src=tpPhase1Debug.indexOf("http://")===0?tpPhase1Debug:this._env.baseDir()+tpPhase1Debug;
b.appendChild(d)
}}else{var a=this._postOnLoad;
this._postOnLoad=function(){a();
e._injectPhase1JS()
}
}},_connectShellsToGwt:function(b){var c=this;
if(this._loaded){this._registry.satisfyShellDeps();
this._registry.connectShellsToGwt();
this._env.setGWTReady(true);
this._complete=true;
tpDoInitGwtCommManager();
var d=this._registry.getShells().toArray();
for(i=0;
i<d.length;
i++){if(d[i].getRuntime()==="flash"){tpRegisterID(d[i].getSwfObjectId())
}}tpController.callFunction("htmlPageLoaded",[tpGetRegisteredIDs()])
}else{var a=this._postOnLoad;
this._postOnLoad=function(){a();
c._connectShellsToGwt(b)
}
}},initialize:function(){this.injectLoadingStyle(true);
$pdk.Entrypoint._class.superclass.initialize.call(this);
var c=this;
$pdk.shell.Factory.generate($pdk.shell.Factory.getNamesFromDomElements($pdk.dom.Helper.findByClass(/^tp/)),this._registry,this._env);
var a=$pdk.env.Detect.getInstance().getConfigSet("preferredruntimes");
var b=(!$pdk.env.Detect.getInstance().hasFlash()||a&&a.contains("html5"))?true:false;
if(!b){var d=c._registry.getShells().toArray();
for(i=0;
i<d.length;
i++){if(d[i].getRuntime()==="html5"||d[i].getRuntime()==="HTML5"){b=true;
break
}}}if(b){window.tpPhase1PDKLoaded=function(){c._connectShellsToGwt(b)
};
this._injectPhase1JS()
}else{this._connectShellsToGwt(b)
}}}),_singleton:null,getInstance:function(){if($pdk.Entrypoint._singleton===null){$pdk.Entrypoint._singleton=new $pdk.Entrypoint._class()
}return $pdk.Entrypoint._singleton
},onLoad:function(){$pdk.Entrypoint.getInstance().onLoad()
}});
$pdk.PdkVersion=$pdk.extend(function(){},{constructor:function(a,d,c,e,b){this.major=a;
this.minor=d;
this.revision=c;
this.build=e;
this.date=b
},toString:function(){return this.major+"."+this.minor+"."+this.revision+"."+this.build+" ("+this.date+")"
},equals:function(a){return this.major===a.major&&this.minor===a.minor&&this.revision===a.revision&&this.build===a.build
}});
$pdk.ns("$pdk.dom");
$pdk.dom.Helper=$pdk.apply({},{findByClass:function(f,e){var d,c,h,a,g=[],b;
if($pdk.isEmpty(f)){f=null
}if($pdk.isEmpty(e)){e=document
}h=e.getElementsByTagName("*");
a=h.length;
for(d=0;
d<a;
d++){c=h[d];
if(c.nodeType===1){if(f===null){g.push(c)
}else{b=c.className;
if(typeof(b)==="string"&&b.match(f)!==null){g.push(c)
}}}}return g
}});
$pdk.ns("$pdk.queue");
$pdk.ns("$pdk.queue");
$pdk.queue.Controller=$pdk.extend(function(){},{constructor:function(a){var b=this;
this._env=a;
this._events={};
this._functions={};
this._objects={};
this._isLoading=true;
this._canMessage=false;
this._messageQueue=[];
this._priorityQueue=[];
this._sendQueue=[];
this._isSending=false;
this._isShutDown=false;
this._runtimes=null;
this._blankString="__blank_string__";
this._defaultScope={globalDataType:this._getDataTypeName("ScopeInfo"),controlId:"javascript",isGlobal:true,isAny:false,isEmpty:false,scopeIds:["javascript","default"]}
},ready:function(){this.isHTML5Loading=false;
this._checkMessageQueue();
this._checkPriorityQueue()
},sendMessage:function(a,d,b){if(d.name==="controllerComplete"){this.onControllerComplete()
}var c={message:d,destination:a};
if(this._isLoading&&!b){this._messageQueue.push(c)
}else{if(!this._canMessage){this._priorityQueue.push(c)
}else{this._doSendMessage(c)
}}},_isSafariWin:(navigator.userAgent.indexOf("Windows")>-1&&navigator.userAgent.indexOf("AppleWebKit")>-1),onControllerComplete:function(){},_doSendMessage:function(a){var b=tpThisMovie(a.destination);
if(a.message.name==="callFunction"&&a.message.payload.name==="showFullScreen"&&a.message.payload.args[0]===true&&b.tagName&&(b.tagName.toLowerCase()==="object"||b.tagName.toLowerCase()==="embed")){tpDebug("Switching to full screen from Javascript is not supported by the Flash run-time. Flash only allows you to go to full screen mode via a click in the player itself.","tpController","Controller","error");
return
}if(this._isShutDown){return
}if($pdk.isWebKit&&$pdk.isWindows){setTimeout(function(){b.executeMessage(a.message)
},1)
}else{b.executeMessage(a.message)
}},_checkMessageQueue:function(){var a=this._messageQueue.length;
while(this._messageQueue.length>0){this._doSendMessage(this._messageQueue.shift())
}},_checkPriorityQueue:function(){var a;
while(this._priorityQueue.length>0){a=this._priorityQueue.shift();
if(a.destination==="unknown"){a.destination=tpBridgeID
}this._doSendMessage(a)
}},_wrapMessage:function(a,d){var b={globalDataType:this._getDataTypeName("CommInfo"),id:"javascript"},c={globalDataType:this._getDataTypeName("MessageInfo"),name:a,payload:d,comm:b};
return c
},_getDataTypeName:function(a){var b=null;
switch(a){case"AdPattern":b="com.theplatform.pdk.data::AdPattern";
break;
case"Banner":b="com.theplatform.pdk.data::Banner";
break;
case"BaseClip":b="com.theplatform.pdk.data::BaseClip";
break;
case"CallInfo":b="com.theplatform.pdk.communication::CallInfo";
break;
case"CategoryInfo":b="com.theplatform.pdk.data::CategoryInfo";
break;
case"Clip":b="com.theplatform.pdk.data::Clip";
break;
case"CommInfo":b="com.theplatform.pdk.communication::CommInfo";
break;
case"CustomData":b="com.theplatform.pdk.data::CustomData";
break;
case"CustomValue":b="com.theplatform.pdk.data::CustomValue";
break;
case"DispatchInfo":b="com.theplatform.pdk.communication::DispatchInfo";
break;
case"FunctionInfo":b="com.theplatform.pdk.communication::FunctionInfo";
break;
case"HandlerInfo":b="com.theplatform.pdk.communication::HandlerInfo";
break;
case"HyperLink":b="com.theplatform.pdk.data::HyperLink";
break;
case"MediaClick":b="com.theplatform.pdk.data::MediaClick";
break;
case"MediaFile":b="com.theplatform.pdk.data::MediaFile";
break;
case"MessageInfo":b="com.theplatform.pdk.communication::MessageInfo";
break;
case"MetricInfo":b="com.theplatform.pdk.data::MetricInfo";
break;
case"Overlay":b="com.theplatform.pdk.data::Overlay";
break;
case"PdkEvent":b="com.theplatform.pdk.events::PdkEvent";
break;
case"ProviderInfo":b="com.theplatform.pdk.data::ProviderInfo";
break;
case"Range":b="com.theplatform.pdk.data::Range";
break;
case"Rating":b="com.theplatform.pdk.data::Rating";
break;
case"Release":b="com.theplatform.pdk.data::Release";
break;
case"ReleaseInfo":b="com.theplatform.pdk.data::ReleaseInfo";
break;
case"ScopeInfo":b="com.theplatform.pdk.communication::ScopeInfo";
break;
case"Sort":b="com.theplatform.pdk.data::Sort";
break;
case"Subtitles":b="com.theplatform.pdk.data::Subtitles";
break;
case"TrackingUrl":b="com.theplatform.pdk.data::TrackingUrl";
break;
case"BandwidthPreferences":b="com.theplatform.pdk.data::BandwidthPreferences";
break;
case"Annotation":b="com.theplatform.pdk.data::Annotation";
break;
default:b=null;
break
}return b
},_createScope:function(a){if(a&&a.globalDataType){return a
}var b=this._defaultScope;
if(!$pdk.isEmpty(a)){if(a.length===0){a.push("javascript")
}b={globalDataType:this._getDataTypeName("ScopeInfo"),controlId:"javascript",isGlobal:true,isAny:false,isEmpty:false,scopeIds:a}
}return b
},_checkForExternalPlayers:function(){var f=tpGetPlayerFormats(),e,d,a,c,b;
if(f){f=f.split("|");
e=f.length;
a=this._isWMLoaded();
for(b=0;
b<e;
b++){d=f[b].toLowerCase();
switch(d){case"mpeg":case"mpeg4":if(!a&&this._checkRuntimePreferred(["silverlight","flash"])=="silverlight"){tpLoadScript(this._env.baseDir()+"/js/tpExternal_SMF.js");
a=true
}break;
case"ism":if(!a){tpLoadScript(this._env.baseDir()+"/js/tpExternal_SMF.js");
a=true
}break;
case"asx":case"wm":if(!a){c=this._checkRuntimePreferred(["silverlight","windowsmedia"]);
if(c==="windowsmedia"){tpLoadScript(this._env.baseDir()+"/js/tpExternal_WMP.js");
a=true
}else{tpLoadScript(this._env.baseDir()+"/js/tpExternal_SMF.js");
a=true
}}break;
case"move":break;
default:break
}}}},_isWMLoaded:function(){var b,a;
if(typeof(tpExternalJS)!=="undefined"){for(b=0;
b<tpExternalJS.length;
b++){a=tpExternalJS[b];
if(a.indexOf("/tpExternal_SMF.js")>=0||a.indexOf("/tpExternal_WMP.js")){return true
}}}return false
},_checkRuntimePreferred:function(d){if(this._runtimes===null){this._runtimes=this._env.getSupportedRuntimes()
}var a=d.length,c=this._runtimes.length,f,g,e,b;
for(e=0;
e<c;
e++){f=this._runtimes[e];
for(b=0;
b<a;
b++){g=d[b];
if(f.indexOf(g)===0){return g
}}}return null
},getProperty:function(a){return this.component[a.toLowerCase()]
},registerFunction:function(g,h,j,c){var d=this._createScope(j);
var b=c===undefined?false:c;
var e,l,a,k,f=false;
if($pdk.isEmpty(this._functions[g])){this._functions[g]={};
b=true
}for(e=0;
e<d.scopeIds.length&&!f;
e++){l=d.scopeIds[e];
if(l==="*"){f=true
}else{this._functions[g][l]=h;
b=true
}}if(!f&&b){a={globalDataType:this._getDataTypeName("FunctionInfo"),name:g,scope:d};
k=this._wrapMessage("registerFunction",a);
this.sendMessage(tpBridgeID,k,true)
}},unregisterFunction:function(g,h){var c=this._createScope(scopes),d,k,f,b,a,e=false,j;
if(!$pdk.isEmpty(this._functions[g])){a=this._functions[g];
for(d=0;
d<c.scopeIds.length;
d++){k=c.scopeIds[d];
if(k=="*"){delete this._functions[g];
break
}if(!$pdk.isEmpty(a[k])){delete a[k]
}}e=false;
if(!$pdk.isEmpty(a)){for(f in a){e=true;
break
}if(!e){delete this._functions[g]
}}}if(!$pdk.isEmpty(e)){b={globalDataType:this._getDataTypeName("FunctionInfo"),name:g,scope:c};
j=this._wrapMessage("unregisterFunction",b);
this.sendMessage(tpBridgeID,j,true)
}},addEventListener:function(e,f,g){var d=this._createScope(g),h={globalDataType:this._getDataTypeName("HandlerInfo"),name:e,handler:f,scope:d},b=false,j,a,c,k;
if($pdk.isEmpty(this._events[e])){this._events[e]=[];
b=true
}j=this._events[e];
a=false;
for(c=0;
c<j.length;
c++){if(j[c].handler==f){j[c]=h;
a=true;
break
}}if(!a){j.push(h)
}if(b){k=this._wrapMessage("addEventListener",h);
this.sendMessage(tpBridgeID,k,true)
}},removeEventListener:function(e,f,g){if($pdk.isEmpty(this._events[e])){return
}var b=this._createScope(g),j={globalDataType:this._getDataTypeName("HandlerInfo"),name:e,handler:f,scope:b},a=this._events[e],c,d,k;
for(c=0;
c<a.length;
c++){d=a[c];
if(d.handler==j.handler){a=a.splice(c,1);
break
}}if(a.length===0){delete this._events[e];
k=this._wrapMessage("removeEventListener",j);
this.sendMessage(tpBridgeID,k,true)
}},dispatchEvent:function(b,g,e){var d=this._createScope(e),a={globalDataType:this._getDataTypeName("PdkEvent"),type:b,data:g},c={globalDataType:this._getDataTypeName("DispatchInfo"),evt:a,scope:d};
this._doDispatchEvent(c);
var f=this._wrapMessage("dispatchEvent",c);
this.sendMessage(tpBridgeID,f,true)
},callFunction:function(g,b,e){var d=this._createScope(e),c={globalDataType:this._getDataTypeName("CallInfo"),name:g,args:b,scope:d},f;
var a=this._doCallFunction(c);
f=this._wrapMessage("callFunction",c);
this.sendMessage(tpBridgeID,f,true);
return a
},_doDispatchEvent:function(dispatch){if($pdk.isEmpty(this._events[dispatch.evt.type])){return
}var handlers=this._events[dispatch.evt.type].slice(0),i,j,s,k,fired,handler;
if(dispatch.evt&&dispatch.evt.data){this._parseCustomData(dispatch.evt.data)
}for(i=0;
i<handlers.length;
i++){handler=handlers[i];
if(dispatch.scope.isAny){if(typeof handler.handler==="string"){eval(handler.handler)(dispatch.evt)
}else{if(typeof handler.handler==="function"){handler.handler(dispatch.evt)
}}continue
}for(j=0;
j<handler.scope.scopeIds.length;
j++){s=handler.scope.scopeIds[j];
fired=false;
if(s=="*"){if(typeof handler.handler==="string"){eval(handler.handler)(dispatch.evt)
}else{if(typeof handler.handler==="function"){handler.handler(dispatch.evt)
}}break
}for(k=0;
k<dispatch.scope.scopeIds.length;
k++){if(s==dispatch.scope.scopeIds[k]){fired=true;
if(typeof handler.handler==="string"){eval(handler.handler)(dispatch.evt)
}else{if(typeof handler.handler==="function"){handler.handler(dispatch.evt)
}}break
}}if(fired){break
}}}},_parseCustomData:function(a){for(var e in a){var c=a[e];
if(c&&(c.globalDataType||$pdk.isArray(c))){if(c.globalDataType=="com.theplatform.pdk.data::CustomData"){for(var d in c){var b=d;
if(!b){continue
}if(b.indexOf("__PERIOD__")!=-1){b=b.replace("__PERIOD__",".")
}if(b.indexOf("__DASH__")!=-1){b=b.replace("__DASH__","-")
}if(b.indexOf("__COLON__")!=-1){b=b.replace("__COLON__",":")
}if(b.indexOf("__SPACE__")!=-1){b=b.replace("__SPACE__"," ")
}if(b.indexOf("__LEFT_BRACKET__")!=-1){b=b.replace("__LEFT_BRACKET__","[")
}if(b.indexOf("__RIGHT_BRACKET__")!=-1){b=b.replace("__RIGHT_BRACKET__","]")
}if(b!=d){c[b]=c[d];
delete c[d]
}}}else{this._parseCustomData(c)
}}}},_doCallFunction:function(e){if($pdk.isEmpty(this._functions[e.name])){return
}var a={},c,d,h;
var b;
for(c=0;
c<e.scope.scopeIds.length;
c++){d=e.scope.scopeIds[c];
if(!$pdk.isEmpty(this._functions[e.name][d])){a[this._functions[e.name][d]]=this._functions[e.name][d]
}}for(h in a){var g=a[h];
b=g.apply(this._objects[e.name],e.args)
}return b
},receiveMessage:function(a,b){if(a=="javascript"){switch(b.name){case"commReady":tpBridgeID=tpCommID;
this._canMessage=true;
this._checkPriorityQueue();
break;
case"bridgeReady":tpBridgeID=b.comm.id;
this._canMessage=true;
this._checkPriorityQueue();
break;
case"dispatchEvent":this.receiveEvent(b.payload);
break;
case"callFunction":this._doCallFunction(b.payload);
break;
default:break
}}else{this.sendMessage(a,b,true)
}},receiveEvent:function(a){if(a.evt.type=="OnPlayerLoaded"){this._isLoading=false;
this._checkMessageQueue();
this._checkForExternalPlayers()
}this._doDispatchEvent(a)
},modRelease:function(a){var b;
if(!$pdk.isEmpty(a)){a.globalDataType=this._getDataTypeName("Release");
if(a.categories){a.categories=this.modCategories(a.categories)
}if(a.thumbnails){for(b=0;
b<a.thumbnails.length;
b++){a.thumbnails[b].globalDataType=this._getDataTypeName("MediaFile");
if(a.thumbnails[b].customValues){a.thumbnails[b].customValues=this.modCustomValues(a.thumbnails[b].customValues)
}}}if(a.customValues){a.customValues=this.modCustomValues(a.customValues)
}if(a.metrics){for(b=0;
b<a.metrics.length;
b++){a.metrics[b].globalDataType=this._getDataTypeName("MetricInfo")
}}if(a.provider){a.provider.globalDataType=this._getDataTypeName("ProviderInfo");
if(a.provider.customValues){a.provider.customValues=this.modCustomValues(a.provider.customValues)
}}if(a.ratings){for(b=0;
b<a.ratings.length;
b++){a.ratings[b].globalDataType=this._getDataTypeName("Rating")
}}if(a.URL){a.url=a.URL
}}return a
},modCustomValues:function(a){var b;
for(b=0;
b<a.length;
b++){a[b].globalDataType=this._getDataTypeName("CustomValue")
}return a
},modCategories:function(a){var b;
for(b=0;
b<a.length;
b++){a[b].globalDataType=this._getDataTypeName("CategoryInfo")
}return a
},modClip:function(a){var b;
if(!$pdk.isEmpty(a)){a.globalDataType=this._getDataTypeName("Clip");
b=a.baseClip;
if($pdk.isEmpty(b)){b={}
}if(!$pdk.isEmpty(a.banners)){b.banners=a.banners
}if(!$pdk.isEmpty(a.overlays)){b.overlays=a.overlays
}a.baseClip=this.modBaseClip(b);
if(!$pdk.isEmpty(a.chapter)){a.chapter.globalDataType=this._getDataTypeName("Chapter")
}}return a
},modBaseClip:function(b){var a;
if($pdk.isEmpty(b)){b={}
}b.globalDataType=this._getDataTypeName("BaseClip");
if(!$pdk.isEmpty(b.moreInfo)){b.moreInfo.globalDataType=this._getDataTypeName("HyperLink");
if(!$pdk.isEmpty(b.moreInfo.clickTrackingUrls)){b.moreInfo.clickTrackingUrls=this.modTracking(b.moreInfo.clickTrackingUrls)
}}if(!$pdk.isEmpty(b.banners)){for(a=0;
a<b.banners.length;
a++){b.banners[a].globalDataType=this._getDataTypeName("Banner");
if(!$pdk.isEmpty(b.banners[a].clickTrackingUrls)){b.banners[a].clickTrackingUrls=this.modTracking(b.banners[a].clickTrackingUrls)
}}}if(!$pdk.isEmpty(b.overlays)){for(a=0;
a<b.overlays.length;
a++){b.overlays[a].globalDataType=this._getDataTypeName("Overlay");
if(!$pdk.isEmpty(b.overlays[a].clickTrackingUrls)){b.overlays[a].clickTrackingUrls=this.modTracking(b.overlays[a].clickTrackingUrls)
}}}if(!$pdk.isEmpty(b.availableSubtitles)){for(a=0;
a<b.availableSubtitles;
a++){b.availableSubtitles[a].globalDataType=this._getDataTypeName("Subtitles")
}}if(!$pdk.isEmpty(b.categories)){b.categories=this.modCategories(b.categories)
}if(!$pdk.isEmpty(b.adPattern)){b.adPattern.globalDataType=this._getDataTypeName("AdPattern")
}if(!$pdk.isEmpty(b.trackingURLs)){b.trackingURLs=this.modTracking(b.trackingURLs)
}if(!$pdk.isEmpty(b.contentCustomData)){b.contentCustomData.globalDataType=this._getDataTypeName("CustomData")
}if(!$pdk.isEmpty(b.ownerCustomData)){b.ownerCustomData.globalDataType=this._getDataTypeName("CustomData")
}if(!$pdk.isEmpty(b.outletCustomData)){b.outletCustomData.globalDataType=this._getDataTypeName("CustomData")
}return b
},modTracking:function(a){var b;
for(b=0;
b<a.length;
b++){a.globalDataType=this._getDataTypeName("TrackingUrl")
}return a
},shutDown:function(){this.callFunction("shutDown",[],["*"]);
this._isShutDown=true
},_regFunc:function(a,e,g,d){var b,h,f=$pdk.isEmpty(e)?0:e.length,c;
for(b=0;
b<f;
b++){h=e[b];
c=g[b];
if(!$pdk.isEmpty(g[b])){switch(h){case"com.theplatform.pdk.data.Release":c=tpController.modRelease(c);
break;
case"com.theplatform.pdk.data.Clip":c=tpController.modClip(c);
break;
case"com.theplatform.pdk.data.Range":c.globalDataType=this._getDataTypeName("Range");
break;
case"com.theplatform.pdk.data.Sort":c.globalDataType=this._getDataTypeName("Sort");
break;
case"com.theplatform.pdk.data.Annotation":c.globalDataType=this._getDataTypeName("Annotation");
break;
case"com.theplatform.pdk.data.BandwidthPreferences":c.globalDataType=this._getDataTypeName("BandwidthPreferences");
break;
default:break
}}}this.callFunction(a,g,d)
}});
$pdk.ns("$pdk.queue");
$pdk.queue.IFrameListener=$pdk.extend(function(){},{constructor:function(){var c=this,a=window.location.hash.substring(1).split("&"),d;
this._callbacks={};
this._origin=null;
this._iframeMessageHandler=function(e){c._acceptIFrameMessage(e)
};
for(var b=0;
b<a.length;
b++){d=a[b].split("=");
if(d[0].toLowerCase()=="playerurl"&&d.length==2){$pdk.parentUrl=unescape(d[1])
}}if(window.addEventListener){addEventListener("message",this._iframeMessageHandler,false)
}else{attachEvent("onmessage",this._iframeMessageHandler)
}},_acceptIFrameMessage:function(c){var b=this,d,e;
if(this._origin===null){this._origin=c.origin
}if(c.origin!==this._origin){return
}try{d=JSON.parse(c.data)
}catch(a){d=null
}if(d!==null&&typeof(d)==="object"){switch(d.type){case"initialization":if(d.name.toLowerCase()==="playerurl"){$pdk.parentUrl=d.parameters[0]
}break;
case"method":$pdk.controller[d.name].apply($pdk.controller,d.parameters);
break;
case"addEventListener":if(d.parameters&&d.parameters.length==2){e=function(f){b._dispatchEventToParentIFrame(f,d.parameters[1])
};
this._callbacks[d.parameters[1]]=e;
$pdk.controller.addEventListener(d.name,e,d.parameters[0])
}break;
case"removeEventListener":if(d.parameters&&d.parameters.length==2){e=this._callbacks[d.parameters[1]];
if(typeof(e)==="function"){$pdk.controller.removeEventListener(d.name,e,d.parameters[0])
}}break;
default:break
}}},_dispatchEventToParentIFrame:function(a,c){var b=JSON.stringify({type:"event",name:a.type,parameters:[a,c]});
window.parent.postMessage(b,this._origin)
},destroy:function(){this._callbacks=[];
if(window.removeEventListener){removeEventListener("message",this._iframeMessageHandler,false)
}else{detachEvent("onmessage",this._iframeMessageHandler)
}}});
$pdk.ns("$pdk.queue.deferred");
$pdk.queue.deferred.DeferredController=$pdk.extend($pdk.queue.Controller,{constructor:function(a){$pdk.queue.deferred.DeferredController.superclass.constructor.call(this,a)
},registerFunction:function(b,a,c){$pdk.queue.deferred.DeferredController.superclass.registerFunction.call(this,b,function(){return c.apply(a,arguments)
},null,true)
}});
$pdk.queue.deferred.DeferredShell=$pdk.extend(function(){},{_STATE:{STARTING:"STARTING",LOADING:"LOADING",RESTING:"RESTING"},_INPUT:{FUNCTION:"FUNCTION",EVENT:"EVENT",LOADED:"LOADED",LOAD_CANCELED:"LOAD_CANCELED"},constructor:function(a){this._queue=[];
this._listeners={};
this._currentState=this._STATE.STARTING;
this._controller=a;
this._controllerDeferred=new $pdk.queue.deferred.DeferredController()
},addFunction:function(a){this[a]=function(){this._queueFunction(a,arguments)
};
this._controller.registerFunction(a,this,this[a])
},addListener:function(a,b){var c=this;
this._listeners[a]=function(d){c._queueEvent(a,d.data,b)
};
this._controller.addEventListener(a,this._listeners[a])
},_queueFunction:function(a,b){this._stateInput(this._INPUT.FUNCTION,{type:"function",name:a,parameters:b,triggerLoad:true})
},_queueEvent:function(a,c,b){this._stateInput(this._INPUT.EVENT,{type:"event",name:a,data:c,triggerLoad:b})
},_stateInput:function(a,b){switch(this._currentState){case this._STATE.STARTING:switch(a){case this._INPUT.FUNCTION:case this._INPUT.EVENT:this._queue.push(b);
break;
default:break
}if(b.triggerLoad){this._changeState(this._STATE.LOADING,b)
}break;
case this._STATE.LOADING:switch(a){case this._INPUT.FUNCTION:case this._INPUT.EVENT:this._queue.push(b);
break;
case this._INPUT.LOADED:this._changeState(this._STATE.RESTING,b);
break;
case this._INPUT.LOAD_CANCELED:this._changeState(this._STATE.STARTING,b);
break;
default:break
}break;
case this._STATE.RESTING:switch(a){case this._INPUT.FUNCTION:this._controller.callFunction(b.name,b.parameters);
break;
case this._INPUT.EVENT:this._controller.dispatchEvent(b.name,b.data);
break;
default:break
}break;
default:break
}},_changeState:function(d,c){var b;
switch(d){case this._STATE.STARTING:this._currentState=this._STATE.STARTING;
break;
case this._STATE.LOADING:this._currentState=this._STATE.LOADING;
this._load(c);
break;
case this._STATE.RESTING:for(var a in this._listeners){this._controller.removeEventListener(a,this._listeners[a])
}while(this._queue.length>0){b=this._queue.shift();
switch(b.type){case"function":this._controller.callFunction(b.name,b.parameters);
break;
case"event":this._controllerDeferred.dispatchEvent(b.name,b.data);
break;
default:break
}}this._currentState=this._STATE.RESTING;
break;
default:break
}},_load:function(a){}});
$pdk.queue.deferred.OneWayController=$pdk.extend($pdk.queue.deferred.DeferredController,{constructor:function(a,b){$pdk.queue.deferred.OneWayController.superclass.constructor.call(this,a);
this._globalController=b
},addEventListener:function(){$pdk.queue.deferred.OneWayController.superclass.addEventListener.apply(this,arguments);
this._globalController.addEventListener.apply(this._globalController,arguments)
},removeEventListener:function(){$pdk.queue.deferred.OneWayController.superclass.removeEventListener.apply(this,arguments);
this._globalController.removeEventListener.apply(this._globalController,arguments)
},registerFunction:function(b,a,c){$pdk.queue.deferred.OneWayController.superclass.registerFunction.apply(this,arguments);
this._globalController.registerFunction(b,function(){return c.apply(a,arguments)
},null,true)
}});
$pdk.ns("$pdk.queue.deferred.ShellController.flash");
$pdk.apply($pdk.queue.deferred.ShellController.flash,{_currentContextId:0,_contexts:{},create:function(){var a=new $pdk.queue.deferred.DeferredController();
$pdk.queue.deferred.ShellController.flash._contexts[++$pdk.queue.deferred.ShellController.flash._currentContextId]=a;
return $pdk.queue.deferred.ShellController.flash._currentContextId
},getContext:function(a){return $pdk.queue.deferred.ShellController.flash._contexts[a]
},applyContextFunction:function(a,b,d){var c=$pdk.queue.deferred.ShellController.flash._contexts[a];
if(c!==null&&typeof(c)==="object"&&typeof(c[b])==="function"){c[b].apply(c,d)
}},addEventListener:function(b,d,a,f){var e=$pdk.queue.deferred.ShellController.flash._contexts[b],c=$pdk.shell.Registry.getInstance().getShells().get(d),g=null;
if(e!==null&&typeof(e)==="object"&&c!==null&&typeof(c)==="object"){g=document.getElementById(c.getSwfObjectId());
if(g!==null&&(typeof(g)==="object"||typeof(g)=="function")&&typeof(g[f])==="function"){e.addEventListener(a,function(h){g[f].call(g,h)
})
}}}});
$pdk.ns("$pdk.queue.deferred.loader");
$pdk.queue.deferred.loader.CardsLoader=$pdk.extend($pdk.queue.deferred.DeferredShell,{constructor:function(a,b,c){this._playerId=b;
this._useDefaultCards=c;
$pdk.queue.deferred.loader.CardsLoader.superclass.constructor.call(this,a);
this.addFunction("addPlayerCard");
this.addFunction("showPlayerCard");
this.addFunction("hidePlayerCard");
this.addListener("OnMediaAreaChanged",false);
this.addListener("OnOverlayAreaChanged",false);
this.addListener("OnMediaStart",false);
this.addListener("OnReleaseStart",false);
this.addListener("OnLoadRelease",false);
this.addListener("OnLoadReleaseUrl",false);
this.addListener("OnSetRelease",false);
this.addListener("OnPlayerComponentAreaChanged",false)
},_load:function(){var a=this;
$pdk.Entrypoint.getInstance().addCallback(function(){var b=new com.theplatform.pdk.cards.loader.CardsLoaderExported();
b.load(a._controller,a._controllerDeferred,a._playerId,a._useDefaultCards,{onSuccess:function(){a._stateInput(a._INPUT.LOADED,{})
},onUnavailable:function(c){}})
})
}});
$pdk.queue.deferred.loader.ControlsLoader=$pdk.extend($pdk.queue.deferred.DeferredShell,{constructor:function(a,b,d,c){$pdk.queue.deferred.loader.ControlsLoader.superclass.constructor.call(this,a);
this._playerId=b;
this._onSuccess=d;
this._onFailure=c;
this.addListener("OnMediaPlaying",true);
this.addListener("OnPlayerLoaded",true);
this.addListener("OnGetSubtitleLanguage",false);
this.addListener("OnHideCard",false);
this.addListener("OnLoadRelease",false);
this.addListener("OnLoadReleaseUrl",false);
this.addListener("OnMediaEnd",false);
this.addListener("OnMediaLoadStart",false);
this.addListener("OnMediaLoading",false);
this.addListener("OnMediaPause",false);
this.addListener("OnMediaSeek",false);
this.addListener("OnMediaStart",false);
this.addListener("OnMediaUnpause",false);
this.addListener("OnMute",false);
this.addListener("OnReleaseEnd",false);
this.addListener("OnReleaseStart",false);
this.addListener("OnResize",false);
this.addListener("OnSetReleaseUrl",false);
this.addListener("OnShowCard",false);
this.addListener("OnShowFullScreen",false);
this.addListener("OnShowPlayOverlay",false);
this.addListener("OnVolumeChange",false)
},_load:function(c){var a=this;
var b=new com.theplatform.pdk.controls.loader.ControlsLoaderExported();
b.load(a._controller,a._controllerDeferred,a._playerId,c.name,a._onSuccess,a._onFailure,{onSuccess:function(){tpDebug("success loading com.theplatform.pdk.controls.loader.ControlsLoaderExported","Controls");
a._stateInput(a._INPUT.LOADED,{})
},onUnavailable:function(d){tpDebug("could not load com.theplatform.pdk.controls.loader.ControlsLoaderExported: "+d,"Controls");
a._stateInput(a._INPUT.LOAD_CANCELED,{})
}})
}});
$pdk.queue.deferred.loader.Subtitles=$pdk.extend($pdk.queue.deferred.DeferredShell,{constructor:function(g,e,h,a,f,j,d,c,b){$pdk.queue.deferred.loader.Subtitles.superclass.constructor.call(this,g);
this._initOverlayArea=e;
this._viewElement=h;
this._subtitleSettingsCookieName=a;
this._defaultFontSizePixel=f;
this._defaultStyle=j;
this._defaultMissingRegionStyle=d;
this._showSubtitles=c;
this._enableDynamicSubtitleFonts=b;
this.addFunction("setShowSubtitles");
this.addListener("OnGetSubtitleLanguage",true);
this.addListener("OnOverlayAreaChanged",false);
this.addListener("OnSubtitleCuePoint",true);
this.addListener("OnMediaStart",true)
},_load:function(){var a=this;
$pdk.Entrypoint.getInstance().addCallback(function(){var b=new com.theplatform.pdk.subtitles.loader.SubtitlesLoaderExported();
b.load(a._viewElement,a._defaultFontSizePixel,a._defaultStyle,a._defaultMissingRegionStyle,a._subtitleSettingsCookieName,a._enableDynamicSubtitleFonts,a._showSubtitles,a._controller,a._controllerDeferred,{onSuccess:function(){tpDebug("success loading com.theplatform.pdk.subtitles.webapp.SubtitlesExported","Subtitles");
a._stateInput(a._INPUT.LOADED,{})
},onUnavailable:function(c){tpDebug("could not load com.theplatform.pdk.subtitles.webapp.SubtitlesExported: "+c,"Subtitles",tpConsts.ERROR)
}})
})
}});
$pdk.queue.deferred.loader.SubtitlesSettingsManager=$pdk.extend($pdk.queue.deferred.DeferredShell,{constructor:function(a,b){$pdk.queue.deferred.loader.SubtitlesSettingsManager.superclass.constructor.call(this,a);
this._subtitleSettingsCookieName=b;
this.addFunction("getSubtitleLanguage");
this.addFunction("getSubtitleStyle");
this.addFunction("setSubtitleLanguage");
this.addFunction("setSubtitleStyle")
},_load:function(){var a=this;
$pdk.Entrypoint.getInstance().addCallback(function(){var b=new com.theplatform.pdk.subtitles.loader.SubtitlesSettingsManagerLoaderExported();
b.load(a._subtitleSettingsCookieName,a._controller,a._controllerDeferred,{onSuccess:function(){tpDebug("success loading com.theplatform.pdk.subtitles.loader.SubtitlesSettingsManagerLoaderExported","SubtitlesSettingsManagerLoader");
a._stateInput(a._INPUT.LOADED,{})
},onUnavailable:function(c){tpDebug("could not load com.theplatform.pdk.subtitles.loader.SubtitlesSettingsManagerLoaderExported: "+c,"SubtitlesSettingsManagerLoader",tpConsts.ERROR)
}})
})
}});
$pdk.queue.deferred.loader.SubtitlesSettingsManager.flash={_currentContextId:0,_contexts:{},create:function(c,d){var a=$pdk.queue.deferred.ShellController.flash.getContext(c),b=new $pdk.queue.deferred.loader.SubtitlesSettingsManager(a,d);
$pdk.queue.deferred.loader.SubtitlesSettingsManager.flash._contexts[++$pdk.queue.deferred.loader.SubtitlesSettingsManager.flash._currentContextId]=b;
return $pdk.queue.deferred.loader.SubtitlesSettingsManager.flash._currentContextId
},applyContextFunction:function(a,b,d){var c=$pdk.queue.deferred.loader.SubtitlesSettingsManager.flash._contexts[a];
if(c!==null&&typeof(c)==="object"&&typeof(c[b])==="function"){c[b].apply(c,d)
}}};
$pdk.ns("$pdk.shell");
$pdk.shell.DefaultsAbstractImpl=$pdk.extend(function(){},{decorate:function(b,c,a){b.fp.allowscriptaccess="always";
b.fp.menu=true;
b.fp.salign="tl";
b.fp.scale="noscale";
b.fp.wmode="transparent";
b.fa.wmode="transparent"
},configureRuntime:function(c,d){var b=c.supportedMedia.split(",");
tpDebug("configuring shell "+c.getName(),"bootloader","$pdk.shell.DefaultsAbstractImpl",tpConsts.INFO);
if(!$pdk.isIE6){if($pdk.isAndroid&&d.canPlayTypeAugmentation()){b=d.sortM3uArray(b)
}var a=d.getMediaFactory().getBestRuntime(c.getName(),d.getPreferredFormatsUnfiltered(),b);
c.setRuntime(a.runtime);
tpDebug("best_runtime.runtime: "+a.runtime,"bootloader","$pdk.shell.DefaultsAbstractImpl",tpConsts.DEBUG);
tpDebug("best_runtime.medium: "+a.medium,"bootloader","$pdk.shell.DefaultsAbstractImpl",tpConsts.DEBUG);
c.setMedium(a.medium)
}else{c.setRuntime("flash");
c.setMedium(d.getPreferredFormatsUnfiltered()[0])
}this._is_phase1=$pdk.env.Detect.getInstance().isPhase1()
},isPhase1:function(){return this._is_phase1
}});
$pdk.shell.Base=$pdk.extend(function(){},{constructor:function(d,c,b){var a;
$pdk.shell.Base.superclass.constructor.call(this);
this.fp={};
this.fa={};
this.useBootloader="true";
this._markupId=typeof(d)==="string"?d:String(Math.round(Math.random()*100000000000000));
this._width=typeof(c)==="string"||typeof(c)==="number"?String(c):null;
this._height=typeof(b)==="string"||typeof(b)==="number"?String(b):null;
this._write_was_called=false;
this._attach_was_called=false;
this._gwt_component=null;
this._registry.add(this);
this._runtime=null;
this._medium=null;
this._configureProcessor=function(){};
this._config_decorator.decorate(this,this._env,this._registry)
},getWidth:function(){return this._width!==null?String(this._width):null
},getHeight:function(){return this._height!==null?String(this._height):null
},setWidth:function(a){this._width=a
},setHeight:function(a){this._height=a
},getId:function(){return this._markupId
},getSwfObjectId:function(){return this._markupId===null?null:["_",this._markupId,"PdkSwfObject"].join("")
},getName:function(){return this._name
},getMarkupClass:function(){return this._markupClass
},getRuntime:function(){if(typeof(this.runtime)==="string"){this._runtime=this.runtime;
delete this.runtime
}return this._runtime
},setRuntime:function(a){this._runtime=a
},getMedium:function(){return this._medium
},setMedium:function(a){this._medium=a
},asSwf:function(){return this._asSwf
},jsViewImpl:function(){return this._jsViewImpl
},jsViewCallBackName:function(){return this._jsViewCallBackName
},getPriority:function(){return this._priority
},write:function(){this._write_was_called=true;
var a=document.getElementsByTagName("script");
var b=a[a.length-1];
var c=b.parentNode;
this._registry.remove(this);
this._markupId=c.id;
this._registry.add(this);
this.bind()
},attach:function(){this.bind()
},bind:function(){this._attach_was_called=true;
if(this._env.GWTReady()){this._attachToGWT()
}},resyncAttach:function(){if(this._attach_was_called){this._attachToGWT()
}},_attachToGWT:function(){var a;
if(this._gwt_component===null){a=new com.theplatform.pdk.ComponentFactory(this.getName(),this.getConfig());
this._gwt_component=a.create();
this._gwt_component.bind()
}},getConfig:function(){this._prepareConfigure();
var c={id:this._markupId,skinurl:this._env.baseDir()+"/skins/glass/glass.json"},b;
c=this._normalizeNVP(this,c);
if(this.getName()==="Player"&&c.releaseurl===undefined){c.releaseurl=this._env.getModelUrls().releaseurl
}delete this.fa.height;
delete this.fa.width;
delete this.fp.height;
delete this.fp.width;
delete c.height;
delete c.width;
delete c.engine;
var a=this.jsViewImpl();
if(a&&a!==""&&a.indexOf("@Bundle:")===-1){a=this._env.baseDir()+"/js/"+this.jsViewImpl()
}else{if(a.indexOf("@Bundle:")!==-1){a=a.replace("@Bundle:","")
}}return{as_swf:this._env.baseDir()+"/swf/"+this.asSwf(),js_view_impl:a,markup_class:this.getMarkupClass(),engine:this.getRuntime(),medium:this.getMedium(),markup_id:this.getId(),pdk_swf_object_id:this.getSwfObjectId(),variables:c,width:this.getWidth(),height:this.getHeight(),flash_attributes:this._normalizeNVP(this.fa,{}),flash_parameters:this._normalizeNVP(this.fp,{})}
},setConfigureProcessor:function(a){this._configureProcessor=a
},_prepareConfigure:function(){this._configureProcessor(this)
},_normalizeNVP:function(d,c){var b,a,e;
for(e in d){if(!e.match(/^_/)){b=d[e];
a=typeof(b);
if(a==="number"||a==="boolean"){b=String(b);
a="string"
}if(a==="string"){c[e.toLowerCase()]=b
}}}return c
}});
$pdk.shell.Collection=$pdk.extend(function(){},{constructor:function(){$pdk.shell.Collection.superclass.constructor.call(this);
this._shells={}
},put:function(b,a){this._shells[b]=a
},remove:function(a){delete this._shells[a]
},get:function(a){return this._shells[a]
},keys:function(){var b,a=[];
for(b in this._shells){if(this._shells[b]!==Object.prototype[b]){a.push(b)
}}return a
},toArray:function(){var d=[],c=this.keys(),a=c.length,b;
for(b=0;
b<a;
b++){d.push(this.get(c[b]))
}return d
}});
$pdk.shell.DefaultsCategoryListImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){$pdk.shell.DefaultsCategoryListImpl.superclass.decorate.apply(this,arguments);
b.divId=b.getId();
b.supportedMedia="actionscript";
if(typeof(b.expandedcssclass)!=="string"||b.expandedcssclass.length>0){b.expandedcssclass=b.getMarkupClass()+"Expanded"
}this.configureRuntime(b,c);
if(this.isPhase1()){this.setPhase1Defaults(b)
}},setPhase1Defaults:function(a){a.allchoiceindex=1;
a.allchoicelabel="All Videos";
a.backgroundcolor="0x383838";
a.expandedheight=198;
a.expandedwidth=795;
a.expandercolor="0xBEBEBE";
a.expanderhovercolor="0xBEBEBE";
a.expanderselectedcolor="0x00CCFF";
a.framecolor="0x545759";
a.itembackgroundcolor="0x383838";
a.itemframecolor="0x131313";
a.itemshineselectedcolor="0x00CCFF";
a.mostpopularchoiceindex=2;
a.mostpopularchoicelabel="Most Popular";
a.textcolor="0xBEBEBE";
a.textframecolor="0x242424";
a.textframehovercolor="0xBEBEBE";
a.textframeselectedcolor="0x00CCFF";
a.texthovercolor="0xBEBEBE";
a.textselectedcolor="0x00CCFF"
}});
$pdk.shell.DefaultsCategoryModelImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){$pdk.shell.DefaultsCategoryModelImpl.superclass.decorate.apply(this,arguments);
b.setWidth(1);
b.setHeight(1);
b.supportedMedia="actionscript";
this.configureRuntime(b,c);
b.setConfigureProcessor(function(d){if(typeof(d.feedpid)==="string"&&d.feedpid.length>0){d.setRuntime("flash");
d.setMedium("javascript")
}})
}});
$pdk.shell.DefaultsClipInfoImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(c,e,b){var a=c.getWidth(),d=c.getHeight();
if(typeof(a)!=="string"||a.length<1){c.setWidth("100%")
}if(typeof(d)!=="string"||d.length<1){c.setHeight("100%")
}$pdk.shell.DefaultsClipInfoImpl.superclass.decorate.apply(this,arguments);
c.supportedMedia="actionscript,javascript";
this.configureRuntime(c,e);
if(this.isPhase1()){this.setPhase1Defaults(c)
}},setPhase1Defaults:function(a){a.backgroundcolor="0xFFFFFF";
a.banneralignment="top";
a.bannerregions="";
a.descriptioncolor="0xF2F2F2";
a.framecolor="0xFFFFFF";
a.titlecolor="0xF2F2F2"
}});
$pdk.shell.DefaultsHeaderImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){$pdk.shell.DefaultsHeaderImpl.superclass.decorate.apply(this,arguments);
b.backgroundcolor="0x383838";
b.framecolor="0x545759";
b.supportedMedia="actionscript";
this.configureRuntime(b,c)
}});
$pdk.shell.DefaultsNavigationImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){$pdk.shell.DefaultsNavigationImpl.superclass.decorate.apply(this,arguments);
b.supportedMedia="actionscript,javascript";
this.configureRuntime(b,c);
if(this.isPhase1()){this.setPhase1Defaults(b)
}},setPhase1Defaults:function(a){a.backgroundcolor="0x131313";
a.framecolor="0x000000";
a.itembackgroundcolor="0x383838";
a.itemframecolor="0xFF0000";
a.itemshineselectedcolor="0xFF0000";
a.textbackgroundcolor="0x383838";
a.textcolor="0xDFDFDF";
a.textframecolor="0x383838";
a.texthighlighthovercolor="0x00CCFF";
a.texthighlightselectedcolor="0xFFFFFF";
a.texthovercolor="0xDFDFDF";
a.textselectedcolor="0xDFDFDF";
a.thumbnailbackgroundcolor="0x242424";
a.thumbnailframecolor="0x383838";
a.thumbnailhighlighthovercolor="0x00CCFF";
a.thumbnailhighlightselectedcolor="0xFFFFFF";
a.controlbackgroundcolor="0xFF0000";
a.controlcolor="0xF2F2F2";
a.controlframecolor="0xFF0000";
a.controlframehovercolor="0xFF0000";
a.controlframeselectedcolor="0xFF0000";
a.controlhovercolor="0xFFFFFF";
a.controlselectedcolor="0x00CCFF";
a.infocolor="0x1D1D1D";
a.itemsperpage=4;
a.fa.wmode="transparent";
a.fp.wmode="transparent"
}});
$pdk.shell.DefaultsNoOpImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){}});
$pdk.shell.DefaultsPlayerImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(k,j,b){$pdk.shell.DefaultsPlayerImpl.superclass.decorate.apply(this,arguments);
var c=document.getElementById(k.getId()),a,l=k.getWidth(),f=k.getHeight(),g=j.getConfigSet("usedefaultcards");
if(typeof(l)!=="string"||l.length<1){k.setWidth("100%")
}if(typeof(f)!=="string"||f.length<1){k.setHeight("100%")
}if(c===null){var e=document.getElementsByTagName("script");
var m=e[e.length-1];
var d=m.parentNode;
this._markupId=d.id;
c=d
}if(c.nodeName.toLowerCase()=="video"){a=c.getElementsByTagName("source");
if(a&&a.length&&a[0].src){k.releaseurl=a[0].src.split("?")[0]
}else{if(c.src){k.releaseurl=c.src.split("?")[0]
}}if(c.poster){k.previewimageurl=c.poster
}if(c.autoplay){k.autoplay=c.autoplay
}}if(!j.rssurl&&j.getModelUrls().rssurl){k.rssurl=j.getModelUrls().rssurl
}if(!this.isPhase1()){k.backgroundcolor="0x131313";
k.controlbackgroundcolor="0x131313";
k.controlcolor="0xF2F2F2";
k.controlframecolor="0xE0E0E0";
k.controlhovercolor="0xFFFFFF";
k.controlselectedcolor="0x00CCFF";
k.framecolor="0xE0E0E0";
k.loadprogresscolor="0x7C7C7C";
k.pagebackgroundcolor="0x131313";
k.playprogresscolor="0xE0E0E0";
k.scrubtrackcolor="0x131313";
k.scrubbercolor="0xF2F2F2";
k.scrubberframecolor="0xF2F2F2";
k.textbackgroundcolor="0x383838";
k.textcolor="0xF2F2F2"
}k.allowfullscreen=true;
k.fa.allowfullscreen="true";
k.fp.allowfullscreen="true";
k.fa.wmode="opaque";
k.fp.wmode="opaque";
k.supportedMedia="mpeg4,f4m,flv,m3u,ogg,webm,mpeg,qt,3gpp,ism,wm,3gpp2,aac,asx,avi,move,mp3";
k.releaseUrlFormatResolution=false;
k.useDefaultCards=true;
if(!$pdk.isEmpty(g)){k.useDefaultCards=g.toArray()[0].toLowerCase()!=="false"
}this.configureRuntime(k,j);
j.setPlaybackFormat(k.getMedium());
j.setPlaybackRuntime(k.getRuntime())
}});
$pdk.shell.DefaultsReleaseListImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){$pdk.shell.DefaultsReleaseListImpl.superclass.decorate.apply(this,arguments);
b.supportedMedia="actionscript,javascript";
this.configureRuntime(b,c);
if(this.isPhase1()){this.setPhase1Defaults(b)
}},setPhase1Defaults:function(a){a.allowscrolling="false";
a.animation="slideHorizontal";
a.backgroundcolor="0x131313";
a.columns=2;
a.framecolor="0x383838";
a.itembackgroundcolor="0x383838";
a.itemframecolor="0x383838";
a.itemshineselectedcolor="0x383838";
a.itemsperpage=4;
a.textbackgroundcolor="0x383838";
a.textcolor="0xDFDFDF";
a.textframecolor="0x383838";
a.texthighlighthovercolor="0x00CCFF";
a.texthighlightselectedcolor="0xFFFFFF";
a.texthovercolor="0xDFDFDF";
a.textselectedcolor="0xDFDFDF";
a.thumbnailbackgroundcolor="0x242424";
a.thumbnailframecolor="0x383838";
a.thumbnailheight=75;
a.thumbnailhighlighthovercolor="0x00CCFF";
a.thumbnailhighlightselectedcolor="0xFFFFFF";
a.thumbnailwidth=100;
a.showairdate=false;
a.showauthor=false;
a.showbitrate=false;
a.showdescription=true;
a.showformat=false;
a.showlength=true;
a.showthumbnail=true;
a.showtitle=true
}});
$pdk.shell.DefaultsReleaseModelImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){$pdk.shell.DefaultsReleaseModelImpl.superclass.decorate.apply(this,arguments);
b.setWidth(1);
b.setHeight(1);
b.params=this._createParams(c);
b.supportedMedia="actionscript,javascript";
b._paramsOriginal=b.params;
this.configureRuntime(b,c);
b.setConfigureProcessor(function(d){if(typeof(d.feedpid)==="string"&&d.feedpid.length>0){d.setRuntime("flash");
d.setMedium("javascript")
}})
},_createParams:function(c){tpDebug("looking up best format for player","bootloader","$pdk.shell.DefaultsReleaseModelImpl",tpConsts.INFO);
var d=null,a=c.getMediaFactory().getBestRuntime("Player",c.getPreferredFormatsUnfiltered(),["mpeg4","f4m","flv","m3u","ogg","webm","mpeg","qt","3gpp","ism","wm","3gpp2","aac","asx","avi","move","mp3"]),b=c.getPlayerFormats(a.runtime);
if(b.length>0){tpDebug("using player formats: "+b.join(", "),"bootloader","$pdk.shell.DefaultsReleaseModelImpl",tpConsts.INFO);
d=b.join("|")
}else{b=c.getPreferredFormatsUnfiltered();
if(b.length>0){tpDebug("Release model could not find viable format for player. Choosing first preferred format from ("+b.join(", ")+")","bootloader","$pdk.shell.DefaultsReleaseModelImpl",tpConsts.INFO);
d=b[0]
}else{tpDebug("Could not find a preferred format. Release model will fetch all formats.","bootloader","$pdk.shell.DefaultsReleaseModelImpl",tpConsts.WARN)
}}return d===null?"":"byContent=byFormat%3D"+d
}});
$pdk.shell.DefaultsSearchImpl=$pdk.extend($pdk.shell.DefaultsAbstractImpl,{decorate:function(b,c,a){$pdk.shell.DefaultsSearchImpl.superclass.decorate.apply(this,arguments);
b.backgroundcolor="0x131313";
b.controlbackgroundcolor="0x242424";
b.controlcolor="0xBEBEBE";
b.controlframecolor="0x545759";
b.controlframehovercolor="0xBEBEBE";
b.controlframeselectedcolor="0x00CCFF";
b.controlhovercolor="0xBEBEBE";
b.controlselectedcolor="0x00CCFF";
b.editbackgroundcolor="0x131313";
b.editcolor="0xBEBEBE";
b.framecolor="0x545759";
b.labelcolor="0xBEBEBE";
b.searchhint="Search...";
b.searchlabel="Search";
b.supportedMedia="actionscript,javascript";
this.configureRuntime(b,c)
}});
$pdk.shell.Factory=$pdk.apply({},{generate:function(j,a,f){var e,d,k=j.length,g,h,c,b;
for(e=0;
e<k;
e++){d=j[e];
h=$pdk.shell.Factory.CLASS_TABLE[d.markupClass];
if(d.markupClass=="tpPlayer"){if($pdk.isEmpty(d.tpVars.releaseurl)){c=f.getModelUrls().releaseurl;
if(typeof(c)==="string"&&c.length>0){d.tpVars.releaseurl=c
}}}if(typeof(h)==="function"){g=a.getShells().get(d.markupId);
g=g===null||typeof(g)!=="object"?new h(d.markupId):g;
$pdk.apply(g,d.tpVars);
$pdk.apply(g.fp,d.tpFp);
$pdk.apply(g.fa,d.tpFa);
g.attach()
}}$pdk.shell.Factory._generateMissingModels(a,f)
},_generateMissingModels:function(a,g){var h=a.getShells().toArray(),k=[],e=0,c=0,d,b=h.length,f,j;
for(d=0;
d<b;
d++){f=h[d];
switch(f.getName()){case"ReleaseList":c++;
k.push(parseInt(f.itemsperpage,10));
break;
case"ReleaseModel":c--;
break;
case"CategoryList":e++;
break;
case"CategoryModel":e--;
break;
default:break
}}for(d=0;
d<c;
d++){f=$pdk.shell.Factory._buildModelShell(g,"releasemodel"+String(d),"tpReleaseModel",$pdk.shell.Factory.CLASS_TABLE.tpReleaseModel,[g.getModelUrls().releasemodel,g.getModelUrls().releasemodelbase],1,k[d])
}for(d=0;
d<e;
d++){f=$pdk.shell.Factory._buildModelShell(g,"categorymodel"+String(d),"tpCategoryModel",$pdk.shell.Factory.CLASS_TABLE.tpCategoryModel,[g.getModelUrls().categorymodel,g.getModelUrls().categorymodelbase])
}},_buildModelShell:function(h,c,f,j,k,d,e){var b=document.createElement("div"),g=new j(c,1,1),a;
b.id=c;
b.className=f;
b.setAttribute("style","position:absolute; top:0px; left:0px; width:1px; height:1px;");
document.body.insertBefore(b,document.body.childNodes[0]);
if($pdk.isArray(k)&&k.length>0){a=k[0];
if(typeof(a)==="string"&&a.length>0){g.feedsServiceUrl=a
}a=k[1];
if(typeof(a)==="string"&&a.length>0){g.feedsServiceUrlBase=a
}}if(d){g.startIndex=d
}if(e){g.endIndex=e
}g.attach();
return g
},getNamesFromDomElements:function(h){var q,r,v,k,c,u=h.length,t,p,w,g,x,d,e,l,o,j=[],f={},s={},m={},y,b;
for(t=0;
t<u;
t++){f={};
s={};
m={};
c=h[t];
e=c.attributes;
attributes_l=e.length;
for(w=0;
w<attributes_l;
w++){g=e[w];
d=g.nodeValue;
switch(g.name){case"class":q=d;
break;
case"id":o=d;
break;
default:if(g.name.match(/^tp:/)){x=g.name.replace(/^tp:/,"").toLowerCase();
b=x.match(/^fa\./)!==null?"fa":"var";
b=x.match(/^fp\./)!==null?"fp":b;
switch(b){case"fa":s[x.replace(/^fa\./,"")]=d;
break;
case"fp":m[x.replace(/^fp\./,"")]=d;
break;
case"var":f[x]=d;
break;
default:break
}}break
}}v=typeof(q)==="string"?q.split(" "):[];
k=v.length;
for(p=0;
p<k;
p++){r=v[p];
if(r.match(/^tp/)){j.push({markupClass:r,markupId:o,tpVars:$pdk.apply({},f),tpFp:$pdk.apply({},m),tpFa:$pdk.apply({},s)})
}}}return j
},CLASS_TABLE:{}});
$pdk.ns("$pdk.shell.Registry");
$pdk.shell.Registry._class=$pdk.extend(function(){},{constructor:function(){$pdk.shell.Registry._class.superclass.constructor.call(this);
this._collection=new $pdk.shell.Collection();
this._swfloader=null
},getShells:function(){return this._collection
},bind:function(a){this._swfloader=a
},add:function(a){this._collection.put(a.getId(),a)
},remove:function(a){this._collection.remove(a.getId())
},hasPlayer:function(){var a=this._collection.toArray();
var b=0;
len=a.length;
for(;
b<len;
b++){if(a[b].getName()==="Player"){return true
}}return false
},connectShellsToGwt:function(){var c,b,e=this._collection.toArray().sort(function(g,f){return g.getPriority()>f.getPriority()
}),d=e.length,a;
for(c=0;
c<d;
c++){b=e[c];
if(b.getRuntime()==="flash"){this._swfloader.add(b)
}else{b.resyncAttach()
}}this._swfloader.initializeShells()
},satisfyShellDeps:function(){var w,j,u,m=null,s,E,b,c,d,q,r,f,t,h,a,B,A=false,v,l=this._collection.toArray(),D={},C=l.length,o,k;
for(u=0;
u<C;
u++){v=l[u];
E=v.getName();
if($pdk.isEmpty(D[E])){D[E]=[]
}D[E].push(v)
}try{j=D.ReleaseModel.length;
if(j>0){w=D.Player.length;
for(u=0;
u<w;
u++){D.Player[u].releaseUrlFormatResolution=true
}}var p=D.ReleaseModel;
for(u=0;
u<p.length;
u++){if(p[u].params&&p[u]._paramsOriginal.indexOf("byContent")>=0&&p[u].params.indexOf("byContent")==-1){p[u].params+="&"+p[u]._paramsOriginal
}}}catch(g){}try{B=D.ReleaseList.length;
r=D.Navigation.length;
for(u=0;
u<r;
u++){b=D.Navigation[u];
m=b.itemsPerPage;
m=$pdk.isEmpty(m)?null:m;
m=m===null?b.itemsperpage:m;
m=$pdk.isEmpty(m)?null:m;
if(m===null){delete b.itemsPerPage;
d=typeof(b.scopes)==="string"?b.scopes.split(","):[];
q=d.length;
for(s=0;
s<B&&m===null;
s++){f=D.ReleaseList[s];
h=typeof(f.scopes)==="string"?f.scopes.split(","):[];
a=h.length;
if(q<1&&a<1){A=true
}else{A=false;
for(k=0;
k<q&&A===false;
k++){c=d[k];
for(o=0;
o<a&&A===false;
o++){t=h[o];
A=c===t
}}}if(A){m=f.itemsPerPage;
m=$pdk.isEmpty(m)?null:m;
m=m===null?f.itemsperpage:m;
m=$pdk.isEmpty(m)?null:m
}}if(m!==null){b.itemsperpage=m
}}}}catch(y){}}});
$pdk.shell.Registry._singleton=null;
$pdk.shell.Registry.getInstance=function(){if($pdk.shell.Registry._singleton===null){$pdk.shell.Registry._singleton=new $pdk.shell.Registry._class()
}return $pdk.shell.Registry._singleton
};
$pdk.shell.SwfSerializedLoader=$pdk.extend(function(){},{constructor:function(){this._shells_unattached=[];
this._shells_unattached_batched={};
this._batch_index=[];
this._expected_responses=0;
this._timeouts=[]
},add:function(a){this._shells_unattached.push(a)
},initializeShells:function(){while(this._shells_unattached.length>0){this._batch(this._shells_unattached.shift())
}this._processNextBatch()
},onSwfReady:function(){this._expected_responses--;
if(this._expected_responses<1){this._processNextBatch()
}},_processNextBatch:function(){var d=this._batch_index.shift(),c=this._shells_unattached_batched[d],a=0,b=this;
while(this._timeouts.length){window.clearTimeout(this._timeouts.shift())
}if(!$pdk.isEmpty(c)){while(c.length){shell=c.shift();
shell.resyncAttach();
a++
}}this._expected_responses=a;
if(this._expected_responses>0){this._timeouts.push(window.setTimeout(function(){b._onTimeout(d)
},5000))
}},_onTimeout:function(a){this._expected_responses=0;
this._processNextBatch()
},_batch:function(a){var b=String(a.getPriority());
if($pdk.isEmpty(this._shells_unattached_batched[b])){this._shells_unattached_batched[b]=[];
this._batch_index.push(b)
}this._shells_unattached_batched[b].push(a)
}});
$pdk.bootloaderVersion=new $pdk.PdkVersion("5","2","7","306332","2013-07-01 11:33 AM");
function tpExternalControllerClass(){this.playerTypes=new Object();
this.extPlayers=new Object();
this.registerExternalPlayer=function(type,playerClass){this.playerTypes[type]=playerClass
};
this.routeMessage=function(swfId,controllerId,streamType,funcName,args){var curController=this.extPlayers[controllerId];
if(!curController){curController=this.extPlayers[controllerId]={}
}var curPlayer=curController[streamType];
if(!curPlayer){var playerClass=this.playerTypes[streamType];
if(!playerClass){return
}curPlayer=eval("new "+playerClass+"('"+swfId+"', '"+controllerId+"');");
if(!curPlayer){return
}curController[streamType]=curPlayer
}curPlayer[funcName](args)
};
this.returnMessage=function(swfId,controllerId,funcName,args){var obj=tpThisMovie(swfId);
obj.receiveJSMessage(controllerId,funcName,args)
};
this.cleanup=function(){for(var controllerId in this.extPlayers){var players=this.extPlayers[controllerId];
for(var player in players){players[player].cleanup();
delete players[player]
}delete this.extPlayers[controllerId]
}}
}function tpExternalMessage(b,d,c,e,a){window.tpExternalController.routeMessage(b,d,c,e,a)
}window.tpExternalController=new tpExternalControllerClass();
function tpShowAlert(a){switch(a){case"FULLSCREEN_DISABLED":alert("Full screen is only available with Flash 9 or later");
break
}}tpScriptLoader=new ScriptLoader();
function tpLoadJScript(a,d,c,b){tpScriptLoader.addScript(a,d,c,b)
}function callbackDispatcher(a){tpScriptLoader.callbackDispatcher(a)
}function invokeCallbacks(a){tpScriptLoader.invokeCallbacks()
}function LoadObj(a,d,c,b){this.script=a;
this.callback=d;
this.id=c;
this.atts=b
}function ScriptLoader(){this.scriptQueue=new Array();
this.callbackQueue=new Array()
}ScriptLoader.prototype.addScript=function(a,e,d,c){var b=new LoadObj(a,e,d,c);
this.scriptQueue.push(b);
if(this.scriptQueue.length==1){this.checkScriptQueue()
}};
ScriptLoader.prototype.checkScriptQueue=function(){if(this.scriptQueue.length){var a=this.scriptQueue.shift();
this.loadScript(a)
}else{interval_id=setInterval("invokeCallbacks()",100)
}};
ScriptLoader.prototype.callbackDispatcher=function(b){for(var a in this.callbackQueue){if(this.callbackQueue[a]==b){this.checkScriptQueue();
return
}}this.callbackQueue.push(b);
this.checkScriptQueue()
};
ScriptLoader.prototype.invokeCallbacks=function(){clearInterval(interval_id);
while(this.callbackQueue.length){var loadObj=this.callbackQueue.shift();
eval(loadObj.callback)(loadObj.script)
}};
ScriptLoader.prototype.loadScript=function(h){var e=h.script;
var b=h.callback;
var g=h.id;
var f=h.atts;
var d=window.document.createElement("script");
d.charset="utf-8";
if(g){d.id=g
}d.type="text/javascript";
if(f){for(var c=0;
c<f.length;
c++){d.setAttribute(f[c].att,f[c].value)
}}d.src=e;
if(b){var a=function(k,j){j(k);
this.onreadystatechange=null;
this.onload=null;
this.onerror=null
};
d.onreadystatechange=function(){a(h,callbackDispatcher)
};
d.onload=function(){a(h,callbackDispatcher)
};
d.onerror=function(){a(h,callbackDispatcher)
}
}window.document.getElementsByTagName("head")[0].appendChild(d)
};
function tpLoadScript(f,c,h,g){var e=window.document.createElement("script");
e.charset="utf-8";
if(h){e.id=h
}e.type="text/javascript";
if(g){for(var d=0;
d<g.length;
d++){e.setAttribute(g[d].att,g[d].value)
}}e.src=f;
var b=false;
if(c){var a=function(j,k){j(k);
this.onreadystatechange=null;
this.onload=null;
this.onerror=null
};
e.onreadystatechange=function(){if((this.readyState==="loaded"||this.readyState==="complete"||this.readyState===4)&&!b){a(c,f);
b=true
}};
e.onload=function(){if(!b){b=true;
a(c,f)
}};
e.onerror=function(){if(!b){a(c,f)
}}
}window.document.getElementsByTagName("head")[0].appendChild(e)
}function tpGetScriptPath(){return $pdk.env.Detect.getInstance().baseDir()
}function tpSetCssClass(a,b){try{var f=document.getElementById(a),c=f.className;
c=typeof(c)==="string"?c:"";
if(c.match(new RegExp(b))===null){f.className=b+" "+c
}}catch(d){}}function tpUnsetCssClass(a,c){try{var g=document.getElementById(a),d=g.className,b=new RegExp(c+" ");
d=typeof(d)==="string"?d:"";
g.className=d.replace(b,"","g")
}catch(f){}}function tpResize(b,a,c){}function tpGetTop(a){result=0;
while(a){result+=a.offsetTop;
a=a.offsetParent
}return result
}function tpGetLeft(a){result=0;
while(a){result+=a.offsetLeft;
a=a.offsetParent
}return result
}tpThisJsObject=function(a){return window[a]
};
var tpRegisteredGWTWidgets={};
tpThisMovie=function(b){if(b=="communicationwidget"||window.tpRegisteredGWTWidgets&&tpRegisteredGWTWidgets[b]!=undefined){var c=tpThisJsObject("tpGwtCommManager");
if(c){return c
}}var a;
if(window.frame&&(window.frame.hasOwnProperty("contentWindow")||window.frame.hasOwnProperty("contentDocument"))){a=frame.contentWindow.document||frame.contentDocument.document
}else{a=document
}return a.getElementById(b)
};
function tpDebug(c,b,a,d){if(!b){b="javascript"
}if(!a){a="utils"
}if(!d){d=tpConsts.INFO
}else{if(typeof d=="string"){d=tpGetLevelNumber(d)
}}if(d<tpGetLevelNumber(tpGetLogLevel())){return
}if(tpController!==undefined){tpController.dispatchEvent("OnPdkTrace",{message:c,timestamp:(new Date().valueOf()),controllerId:b,className:a,level:d})
}else{tpTrace(c,(new Date()).valueOf(),b,a,d)
}}function tpOpenNewWindow(d,b,a){var c=window.open(d,b,a)
}var tpTrackingImage=new Image();
function tpCallTrackingUrl(a){a=unescape(a);
tpTrackingImage.src=a;
for(i=0;
((!tpTrackingImage.complete)&&(i<100000));
i++){}}var tpConsts={};
tpConsts.NONE=2000;
tpConsts.FATAL=1000;
tpConsts.ERROR=8;
tpConsts.WARN=6;
tpConsts.INFO=4;
tpConsts.DEBUG=2;
tpConsts.TEST=1;
function tpGetLevel(a){switch(a){case tpConsts.DEBUG:return"DEBUG";
case tpConsts.INFO:return"INFO";
case tpConsts.WARN:return"WARN";
case tpConsts.ERROR:return"ERROR";
case tpConsts.FATAL:return"FATAL";
case tpConsts.TEST:return"TEST";
case tpConsts.NONE:return"NONE"
}return"UNKNOWN"
}function tpGetLevelNumber(a){switch(a.toUpperCase()){case"DEBUG":return tpConsts.DEBUG;
case"INFO":return tpConsts.INFO;
case"WARN":return tpConsts.WARN;
case"ERROR":return tpConsts.ERROR;
case"FATAL":return tpConsts.FATAL;
case"TEST":return tpConsts.TEST;
case"NONE":return tpConsts.NONE
}return 4
}function tpTrace(c,e,d,g,a){if(typeof(window.console)!=="object"){return
}var f=new Date(Number(e));
var b=f.getMilliseconds();
if(b.toString().length==2){b="0"+b
}else{if(b.toString().length==1){b="00"+b
}}var h=f.getHours()+":"+f.getMinutes()+":"+f.getSeconds()+"."+b;
var j=h+" \t"+tpGetLevel(Number(a))+" \t"+d+" \t";
if(g&&g.length){j+=g+" :: "
}j+=c;
switch(Number(a)){case tpConsts.DEBUG:console.log(j);
break;
case tpConsts.INFO:console.info(j);
break;
case tpConsts.WARN:console.warn(j);
break;
case tpConsts.ERROR:case tpConsts.FATAL:console.error(j);
break
}}function tpGetUseJS(){return"true"
}function tpGetCommManagerID(){return tpCommID
}if(!self.tpLogLevel){tpLogLevel="warn"
}function tpSetLogLevel(a){tpLogLevel=a
}function tpGetLogLevel(){return tpLogLevel
}function tpGetProperties(){var a=new Object();
a.commManagerId=tpGetCommManagerID();
a.useJS=tpGetUseJS();
a.registeredComponents=tpGetRegisteredIDs();
a.logLevel=tpGetLogLevel();
return a
}var tpRegisteredIDArr;
function tpRegisterID(b){if(!tpRegisteredIDArr){tpRegisteredIDArr=[]
}for(var a=0;
a<tpRegisteredIDArr.length;
a++){if(tpRegisteredIDArr[a]==b){return
}}tpRegisteredIDArr.push(b)
}function tpGetRegisteredIDs(){return tpRegisteredIDArr
}var tpController;
var tpCommID;
var tpBridgeID;
var tpExternalController;
var tpGwtCommManager;
var useWorkerIfPossible=false;
var gwtWorker;
function tpDoInitGwtCommManager(){try{if(tpCommID=="communicationwidget"&&window.tpGwtCommManager===undefined){tpGwtCommManager=new com.theplatform.pdk.CommManager()
}else{if((window.tryWorker===undefined||!tryWorker)&&window.tpGwtCommManager===undefined){tpGwtCommManager=new com.theplatform.pdk.CommManager(tpCommID)
}}}catch(a){if(window.console!=undefined){console.error("GwtCommManager module failed to load 1!")
}else{}}}function tpInitGwtCommManager(b,a){try{if(useWorkerIfPossible&&Worker!=undefined){gwtWorker=new Worker("js/commManagerWorker.js");
tpGwtCommManager=new Object();
tpGwtCommManager.executeMessage=function(d){gwtWorker.postMessage(d)
};
gwtWorker.onmessage=function(d){console.log(d.data);
if(d.data.destination){tpReceiveMessage(d.data.destination,d.data.message)
}};
gwtWorker.onerror=function(d){if(self.console){console.error(d.message)
}}
}else{tpGwtCommManager=new com.theplatform.pdk.CommManager(tpCommID)
}}catch(c){if(a==true){if(console!=undefined){console.error("GwtCommManager module failed to load! 2")
}else{}}}}function tpSetCommManagerID(c,e,d,a,b){if(b){useWorkerIfPossible=true
}if(c&&e){tpInitGwtCommManager(c)
}tpCommID=c;
tpBridgeID=c?c:"unknown";
if(window.tpTraceListener===undefined){window.tpTraceListener=function(g){var f=g.data;
if(f){tpTrace(f.message,f.timestamp,f.controllerId,f.className,f.level)
}};
tpController.addEventListener("OnPdkTrace",window.tpTraceListener)
}}function tpReceiveMessage(a,b){tpController.receiveMessage(a,b)
}function tpGetPreferredFormats(){if($pdk!==undefined){return $pdk.env.Detect.getInstance().getPreferredFormats()
}else{return[]
}}function tpGetPlayerFormats(){if($pdk!==undefined){var a=$pdk.env.Detect.getInstance().getPlayerFormats(),b="";
if($pdk.isArray(a)){b=a.join("|")
}return b
}else{return[]
}}var tpHolderName="pdkHolder";
var tpExternalJS;
function tpSetPlayerIDForExternal(a){}function tpSetHolderIDForExternal(a){tpHolderName=a
}function tpSetPdkBaseDirectory(a){}function tpLoadExternalMediaJS(){tpExternalJS=tpLoadExternalMediaJS.arguments;
for(var a=0;
a<tpExternalJS.length;
a++){tpLoadScript(tpExternalJS[a])
}}function tpCleanupExternal(){if(tpExternalJS){var a=window.document.getElementsByTagName("head")[0].getElementsByTagName("script");
for(var c=0;
c<a.length;
c++){for(var b=0;
b<tpExternalJS.length;
b++){if(a[c].src==tpExternalJS[b]){window.document.getElementsByTagName("head")[0].removeChild(a[c]);
break
}}}tpExternalJS.length=0
}if(tpExternalController){tpExternalController.cleanup()
}}$pdk.ns("$pdk.interfaces");
$pdk.interfaces.expose=function(b,a){b.CategoryList=$pdk.extend($pdk.shell.Base,{_name:"CategoryList",_markupClass:"tpCategoryList",_runtime:"default",_jsViewImpl:"",_markupClass:"tpCategoryList",_priority:30,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsCategoryListImpl(),_asSwf:"categoryList.swf"});
b.Player=$pdk.extend($pdk.shell.Base,{_name:"Player",_markupClass:"tpPlayer",_runtime:"default",_jsViewImpl:"@Bundle:tpPlayerView.js",_markupClass:"tpPlayer",_priority:10,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsPlayerImpl(),_asSwf:"flvPlayer.swf"});
b.Navigation=$pdk.extend($pdk.shell.Base,{_name:"Navigation",_markupClass:"tpNavigation",_runtime:"default",_jsViewImpl:"@Bundle:tpNavigationView.js",_markupClass:"tpNavigation",_priority:2147483647,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsNavigationImpl(),_asSwf:"nav.swf"});
b.ReleaseList=$pdk.extend($pdk.shell.Base,{_name:"ReleaseList",_markupClass:"tpReleaseList",_runtime:"default",_jsViewImpl:"@Bundle:tpReleaseListView.js",_markupClass:"tpReleaseList",_priority:40,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsReleaseListImpl(),_asSwf:"releaseList.swf"});
b.ReleaseModel=$pdk.extend($pdk.shell.Base,{_name:"ReleaseModel",_markupClass:"tpReleaseModel",_runtime:"default",_jsViewImpl:"@Bundle:tpReleaseModel.js",_markupClass:"tpReleaseModel",_priority:5,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsReleaseModelImpl(),_asSwf:"releaseModel.swf"});
b.ClipInfo=$pdk.extend($pdk.shell.Base,{_name:"ClipInfo",_markupClass:"tpClipInfo",_runtime:"default",_jsViewImpl:"@Bundle:tpClipInfoView.js",_markupClass:"tpClipInfo",_priority:20,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsClipInfoImpl(),_asSwf:"info.swf"});
b.Search=$pdk.extend($pdk.shell.Base,{_name:"Search",_markupClass:"tpSearch",_runtime:"default",_jsViewImpl:"@Bundle:tpSearchView.js",_markupClass:"tpSearch",_priority:2147483647,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsSearchImpl(),_asSwf:"search.swf"});
b.Header=$pdk.extend($pdk.shell.Base,{_name:"Header",_markupClass:"tpHeader",_runtime:"default",_jsViewImpl:"",_markupClass:"tpHeader",_priority:2147483647,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsHeaderImpl(),_asSwf:"header.swf"});
b.CategoryModel=$pdk.extend($pdk.shell.Base,{_name:"CategoryModel",_markupClass:"tpCategoryModel",_runtime:"default",_jsViewImpl:"",_markupClass:"tpCategoryModel",_priority:30,_env:$pdk.env.Detect.getInstance(),_registry:$pdk.shell.Registry.getInstance(),_config_decorator:new $pdk.shell.DefaultsCategoryModelImpl(),_asSwf:"categoryModel.swf"});
$pdk.shell.Factory.CLASS_TABLE={tpCategoryList:b.CategoryList,tpPlayer:b.Player,tpNavigation:b.Navigation,tpReleaseList:b.ReleaseList,tpReleaseModel:b.ReleaseModel,tpClipInfo:b.ClipInfo,tpSearch:b.Search,tpHeader:b.Header,tpCategoryModel:b.CategoryModel};
a.search=function(d,c){d=typeof(d)==="undefined"?"":d;
this._regFunc("search",["java.lang.String"],[d],c)
};
a.getCurrentRange=function(c){this._regFunc("getCurrentRange",[],[],c)
};
a.previousRange=function(d,c){d=typeof(d)==="undefined"?true:d;
this._regFunc("previousRange",["boolean"],[d],c)
};
a.nextRange=function(d,c){d=typeof(d)==="undefined"?true:d;
this._regFunc("nextRange",["boolean"],[d],c)
};
a.firstRange=function(d,c){d=typeof(d)==="undefined"?true:d;
this._regFunc("firstRange",["boolean"],[d],c)
};
a.getDefaultBanners=function(c){this._regFunc("getDefaultBanners",[],[],c)
};
a.getValidRegions=function(c){this._regFunc("getValidRegions",[],[],c)
};
a.setClipInfo=function(d,e,c){this._regFunc("setClipInfo",["com.theplatform.pdk.data.Clip","boolean"],[d,e],c)
};
a.addPlayerCard=function(g,k,d,j,e,c,f,h){this._regFunc("addPlayerCard",["java.lang.String","java.lang.String","java.lang.String","java.lang.String","java.lang.String","java.lang.String","int"],[g,k,d,j,e,c,f],h)
};
a.hidePlayerCard=function(c,e,d){this._regFunc("hidePlayerCard",["java.lang.String","java.lang.String"],[c,e],d)
};
a.showPlayerCard=function(d,g,f,c,e){this._regFunc("showPlayerCard",["java.lang.String","java.lang.String","java.lang.String","java.lang.String"],[d,g,f,c],e)
};
a.loadRelease=function(c,d,e){this._regFunc("loadRelease",["com.theplatform.pdk.data.Release","java.lang.Boolean"],[c,d],e)
};
a.clearCategorySelection=function(c){this._regFunc("clearCategorySelection",[],[],c)
};
a.showFullScreen=function(c,d){this._regFunc("showFullScreen",["java.lang.Boolean"],[c],d)
};
a.getSubtitleStyle=function(c){this._regFunc("getSubtitleStyle",[],[],c)
};
a.mute=function(d,c){this._regFunc("mute",["java.lang.Boolean"],[d],c)
};
a.setCurrentReleaseList=function(d,c){this._regFunc("setCurrentReleaseList",["java.lang.String"],[d],c)
};
a.disablePlayerControls=function(c,d,e){this._regFunc("disablePlayerControls",["java.lang.Boolean","java.lang.String[]"],[c,d],e)
};
a.showEmailForm=function(d,c){this._regFunc("showEmailForm",["java.lang.Boolean"],[d],c)
};
a.resetPlayer=function(c){this._regFunc("resetPlayer",[],[],c)
};
a.playPrevious=function(d,c){this._regFunc("playPrevious",["java.lang.Boolean"],[d],c)
};
a.hidePlayerRegions=function(d,c,e){this._regFunc("hidePlayerRegions",["java.lang.Boolean","java.lang.String[]"],[d,c],e)
};
a.getSubtitleLanguage=function(c,d){this._regFunc("getSubtitleLanguage",["java.lang.String"],[c],d)
};
a.setToken=function(c,e,d){this._regFunc("setToken",["java.lang.String","java.lang.String"],[c,e],d)
};
a.setShowSubtitles=function(c,d){this._regFunc("setShowSubtitles",["java.lang.Boolean"],[c],d)
};
a.addAnnotation=function(c,d){this._regFunc("addAnnotation",["com.theplatform.pdk.data.Annotation"],[c],d)
};
a.clickPlayButton=function(c){this._regFunc("clickPlayButton",[],[],c)
};
a.setExpandVideo=function(d,c){this._regFunc("setExpandVideo",["java.lang.String"],[d],c)
};
a.previewRefreshReleaseModel=function(c,l,e,f,d,j,k,g,h){this._regFunc("previewRefreshReleaseModel",["java.lang.String","java.lang.String","com.theplatform.pdk.data.Sort","com.theplatform.pdk.data.Range","java.lang.String[]","java.lang.String[]","java.lang.String[]","java.lang.String"],[c,l,e,f,d,j,g,h],k)
};
a.useDefaultEmailForm=function(c,d){this._regFunc("useDefaultEmailForm",["java.lang.Boolean"],[c],d)
};
a.useDefaultPlayOverlay=function(c,d){this._regFunc("useDefaultPlayOverlay",["java.lang.Boolean"],[c],d)
};
a.getBandwidthPreferences=function(c){this._regFunc("getBandwidthPreferences",[],[],c)
};
a.loadSmil=function(d,c,e){this._regFunc("loadSmil",["java.lang.String","java.lang.Boolean"],[d,c],e)
};
a.getNextClip=function(c){this._regFunc("getNextClip",[],[],c)
};
a.previousClip=function(c){this._regFunc("previousClip",[],[],c)
};
a.loadReleaseURL=function(c,d,e){this._regFunc("loadReleaseURL",["java.lang.String","java.lang.Boolean"],[c,d],e)
};
a.removeAnnotation=function(c,d){this._regFunc("removeAnnotation",["com.theplatform.pdk.data.Annotation"],[c],d)
};
a.clearAnnotations=function(c){this._regFunc("clearAnnotations",[],[],c)
};
a.clearPlayerMessage=function(c){this._regFunc("clearPlayerMessage",[],[],c)
};
a.refreshCategoryModel=function(d,c,e){this._regFunc("refreshCategoryModel",["java.lang.String","java.lang.String"],[d,e],c)
};
a.pause=function(c,d,e){this._regFunc("pause",["java.lang.Boolean","java.lang.Boolean"],[c,e],d)
};
a.setReleaseURL=function(d,c,e){this._regFunc("setReleaseURL",["java.lang.String","java.lang.Boolean"],[d,c],e)
};
a.getUseDefaultPlayOverlay=function(c){this._regFunc("getUseDefaultPlayOverlay",[],[],c)
};
a.clearAdCookie=function(c){this._regFunc("clearAdCookie",[],[],c)
};
a.setSubtitleLanguage=function(d,c){this._regFunc("setSubtitleLanguage",["java.lang.String"],[d],c)
};
a.setClipInfo=function(d,e,c){this._regFunc("setClipInfo",["com.theplatform.pdk.data.Clip","java.lang.Boolean"],[d,e],c)
};
a.cancelMedia=function(c,d){this._regFunc("cancelMedia",["java.lang.Object"],[c],d)
};
a.refreshReleaseModel=function(c,l,e,f,d,j,k,g,h){this._regFunc("refreshReleaseModel",["java.lang.String","java.lang.String","com.theplatform.pdk.data.Sort","com.theplatform.pdk.data.Range","java.lang.String[]","java.lang.String[]","java.lang.String[]","java.lang.String"],[c,l,e,f,d,j,g,h],k)
};
a.setVolume=function(d,c){this._regFunc("setVolume",["java.lang.Number"],[d],c)
};
a.setSubtitleStyle=function(d,c){this._regFunc("setSubtitleStyle",["com.theplatform.pdk.data.SubtitleStyle"],[d],c)
};
a.getPlayerVariables=function(d,c){this._regFunc("getPlayerVariables",["java.lang.String[]"],[d],c)
};
a.getNextRelease=function(e,c,d){this._regFunc("getNextRelease",["java.lang.Boolean","java.lang.Boolean"],[e,c],d)
};
a.getCurrentRange=function(c){this._regFunc("getCurrentRange",[],[],c)
};
a.nextClip=function(c){this._regFunc("nextClip",[],[],c)
};
a.setProperty=function(f,d,g,c,e){this._regFunc("setProperty",["java.lang.String","java.lang.String","java.lang.String","java.lang.String"],[f,d,g,c],e)
};
a.previewNextRefreshReleaseModel=function(c){this._regFunc("previewNextRefreshReleaseModel",[],[],c)
};
a.seekToPercentage=function(d,c){this._regFunc("seekToPercentage",["java.lang.Number"],[d],c)
};
a.playNext=function(e,c,d){this._regFunc("playNext",["java.lang.Boolean","java.lang.Boolean"],[e,c],d)
};
a.setBandwidthPreferences=function(d,c){this._regFunc("setBandwidthPreferences",["com.theplatform.pdk.data.BandwidthPreferences"],[d],c)
};
a.seekToPosition=function(c,d){this._regFunc("seekToPosition",["java.lang.Number"],[c],d)
};
a.useDefaultLinkForm=function(c,d){this._regFunc("useDefaultLinkForm",["java.lang.Boolean"],[c],d)
};
a.suspendPlayAll=function(d,c){this._regFunc("suspendPlayAll",["java.lang.Boolean"],[d],c)
};
a.setVideoScalingMethod=function(d,c){this._regFunc("setVideoScalingMethod",["java.lang.String"],[d],c)
};
a.setVariable=function(f,d,g,c,e){this._regFunc("setVariable",["java.lang.String","java.lang.String","java.lang.String","java.lang.String"],[f,d,g,c],e)
};
a.setPreviewImageUrl=function(c,d){this._regFunc("setPreviewImageUrl",["java.lang.String"],[c],d)
};
a.setPlayerMessage=function(e,c,d){this._regFunc("setPlayerMessage",["java.lang.String","java.lang.Number"],[e,c],d)
};
a.trace=function(e,d,f,c){this._regFunc("trace",["java.lang.String","java.lang.String","java.lang.Number"],[e,d,f],c)
};
a.setSmil=function(c,d){this._regFunc("setSmil",["java.lang.String"],[c],d)
};
a.getAnnotations=function(c){this._regFunc("getAnnotations",[],[],c)
};
a.setRelease=function(c,d,e){this._regFunc("setRelease",["com.theplatform.pdk.data.Release","java.lang.Boolean"],[c,d],e)
};
a.showLinkForm=function(d,c){this._regFunc("showLinkForm",["java.lang.Boolean"],[d],c)
}
};
(function(h,e){var d,c,b,g,j,a,f,k;
if(typeof(window.__tp_pdk_set_versions)==="function"){window.__tp_pdk_set_versions();
if(typeof(window.console)==="object"){console.log("thePlatform PDK");
console.log($pdk.version.toString())
}}e=typeof(e)==="boolean"?e:false;
if(!e){g=$pdk.env.Detect.getInstance();
j=new $pdk.env.HttpHead.Processor(g);
j.process(document);
if(typeof(g.baseDir())!=="string"||g.baseDir().length<1){alert("No PDK base URL could be detected. Asynchronous load of PDK requies a tp:baseUrl meta tag.")
}if($pdk.isIE){document.createElement("video")
}c=g.getConfigSet("enableexternalcontroller");
c=$pdk.isEmpty(c)?[]:c.toArray();
c=c.length<1?"false":c[0];
c=c.toLowerCase()==="true";
window.tpCommID="communicationwidget";
window.tpBridgeID=typeof(window.tpCommID)==="string"?window.tpCommID:"unknown";
b=$pdk.Entrypoint.getInstance();
a=$pdk.shell.Registry.getInstance();
f=new $pdk.shell.SwfSerializedLoader();
a.bind(f);
h.tpController=new $pdk.queue.Controller(g);
$pdk.interfaces.expose(h,h.tpController);
if(g.getAutoInitialize()){b.injectLoadingStyle(false)
}if(window.tpTraceListener===undefined){window.tpTraceListener=function(m){var l=m.data;
if(l){tpTrace(l.message,l.timestamp,l.controllerId,l.className,l.level)
}};
tpController.addEventListener("OnPdkTrace",window.tpTraceListener)
}h.tpController.onControllerComplete=function(){f.onSwfReady()
};
b.configure(a,g);
$pdk.controller=h.tpController;
$pdk.initialize=function(){b.initialize()
};
$pdk.gwtBootloader(g);
if(c){new $pdk.queue.IFrameListener()
}}}(window,window._PDK_SUPRESS_AUTOINIT));