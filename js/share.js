/*global define, tpController, $pdk, FDM_Player_vars */
define([
  'lodash',
  'jquery',
  'utils',
  'Debug',
  'Dispatcher',
  'storage',
  'ovp'
  ], function (_, jquery, utils, Debug, Dispatcher, storage, ovp) {
    'use strict';

    var presenter = {
      show: function(state) {
        var share_instance = storage.now.get('share');
        if (typeof(share_instance) === 'undefined') {
          state.share_config = storage.now.get('playerConfig').share;
          share_instance = new Share(state);
          storage.now.set('share', share_instance);
        }
        share_instance.showShareCard();
      },
      hide: function() {
        //silence.. ah...
      }
    };

    //////////////////////////////////////////////// Constants...
    var NETWORK_FOX = 'fox',
        NETWORK_FUEL = 'fuel',
        NETWORK_FX = 'fx',
        NETWORK_BTN = 'btn',
        DEFAULT_SHARE_TARGETS = [
          {
            name: "Facebook",
            image: '@@ovpAssetsFilePath' + "images/facebook-100.png",
            share: {
              url: "http://www.facebook.com/sharer.php?u=_?_",
              items: [
                'url'
              ]
              //This old url populates the data, but it also stops the page from trying to find a video
              //to embed.
              //url: "http://www.facebook.com/sharer.php?s=100&p[title]=_?_&p[images][0]=_?_&p[url]=_?_&p[summary]=_?_",
              //items: [
              //  'title',
              //  'image',
              //  'url',
              //  'description'
              //]
            }
          },
          {
            name: "Twitter",
            image: '@@ovpAssetsFilePath' + "images/twitter-71.png",
            share: {
              url: "http://twitter.com/home?status=_?_",
              items: [
                'url'
              ]
            }
          },
          {
            name: "Google+",
            image: '@@ovpAssetsFilePath' + "images/google-71.png",
            share: {
              url: "http://plus.google.com/share?url=_?_",
              items: [
                'url'
              ]
            }
          },
          {
            name: "Tumblr",
            image: '@@ovpAssetsFilePath' + "images/tumblr-71.png",
            share: {
              url: "http://tumblr.com/share?s=&v=3&u=_?_&t=_?_",
              items: [
                'url',
                'title'
              ]
            }
          },
          {
            name: "StumbleUpon",
            image: '@@ovpAssetsFilePath' + "images/stumbleupon-71.png",
            share: {
              url: "http://www.stumbleupon.com/submit?url=_?_&title=_?_",
              items: [
                'url',
                'title'
              ]
            }
          },
          {
            name: "Delicious",
            image: '@@ovpAssetsFilePath' + "images/delicious-71.png",
            share: {
              url: "http://del.icio.us/post?url=_?_&title=_?_",
              items: [
                'url',
                'title'
              ]
            }
          },
          {
            name: "Digg",
            image: '@@ovpAssetsFilePath' + "images/digg-71.png",
            share: {
              url: "http://digg.com/submit?url=_?_",
              items: [
                'url'
              ]
            }
          }
        ];

    //////////////////////////////////////////////// private properties...
    var debug = new Debug('share'),
        dispatcher = new Dispatcher('share');

    var Analytics = {
      dispatch: function(key, data) {
        $pdk.controller.dispatchEvent('analytics:' + key, data);
      }
    };
    //////////////////////////////////////////////// private methods...
    var isFullscreen = function() {
      return document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullscreenElement;
    };

    var selectText = function(domElem) {
      var range;
      if (document.selection) {
        range = document.body.createTextRange();
        range.moveToElementText(domElem);
        range.select();
      } else if (window.getSelection()) {
        range = document.createRange();
        range.selectNode(domElem);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    };

    var setNetwork = function(network) {
      if (network.indexOf(NETWORK_FUEL) > -1) {
        return NETWORK_FUEL;
      } else if (network.indexOf(NETWORK_FX) > -1) {
        return NETWORK_FX;
      } else if (network.indexOf(NETWORK_BTN) > -1) {
        return NETWORK_BTN;
      } else {
        return NETWORK_FOX;
      }
    };

    var Tmpls = {};
    var addCards = function() {
      debug.log('Adding Share Cards to "forms"');
      Tmpls.share = _.template('<div class="share share-toplevel">' +
        '<div class="share-close"></div>' +
          '<div class="share-container">' +
            '<div class="share-top">' +
              '<div class="share-cardTitle">Share</div>' +
              '<div class="share-releaseInfo">' +
              '<div class="title"><%= clip.title %></div>' +
              '<div class="runtime"><%= humanLength %></div>' +
              '<div class="rating"><%= rating %></div>' +
            '</div>' +
          '</div>' +
        '<div class="share-slider">' +
          '<div class="heading">Share On</div>' +
          '<div class="slider"><%= slider %></div>' +
        '</div>' +
          '<%= shareLink %>' +
          '<%= shareEmbed %>' +
        '</div>' +
      '</div>');

      Tmpls.email = _.template('<div class="share share-email">' +
        '<div class="share-close"></div>' +
        '<div class="share-container">' +
          '<div class="share-top">' +
            '<div class="share-cardTitle">Email</div>' +
            '<div class="share-releaseInfo">' +
              '<div class="title"><%= clip.title %></div>' +
              '<div class="runtime"><%= humanLength %></div>' +
              '<div class="rating"><%= rating %></div>' +
            '</div>' +
          '</div>' +
          '<iframe id="submitter" style="display: none"></iframe>' +
          '<form action="http://vod.fxnetworks.com/FXEmailer.php" method="POST" target="submitter">' +
            '<input type="hidden" name="cmp" value="email_post" />' +
            '<input type="hidden" name="Subject" value="" />' +
            '<div class="email-to">' +
              '<div class="heading">To Email Address</div>' +
              '<input type="text" name="ToEmails" />' +
            '</div>' +
            '<div class="email-from">' +
              '<div class="heading">From Email Address</div>' +
              '<input type="text" name="FromEmail" />' +
            '</div>' +
            '<div class="email-message">' +
              '<div class="heading">Your Message</div>' +
              '<textarea name="Message"></textarea>' +
            '</div>' +
            '<div class="buttons">' +
              '<div data-action="cancel">Cancel</div>' +
              '<div data-action="submit">Send</div>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>');

      Tmpls.emailConfirm = _.template('<div class="share share-emailConfirm">' +
        '<div class="share-close"></div>' +
        '<div class="share-container">' +
          '<div class="share-top">' +
            '<div class="share-cardTitle">Email</div>' +
            '<div class="share-releaseInfo">' +
              '<div class="title"><%= clip.title %></div>' +
              '<div class="runtime"><%= humanLength %></div>' +
              '<div class="rating"><%= rating %></div>' +
            '</div>' +
          '</div>' +
          '<div class="response">' +
            '<div>' +
              '<div class="message"><%= message %></div>' +
              '<div class="button">Done</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>');

      $pdk.controller.addPlayerCard("forms", "share", '<div class="share"></div>', null, null, presenter);
    };

    (function init() {
      ovp.ready().done(function (pdk) {
        debug.log('PDK is now available inside of share.js', pdk);
        addCards();
        dispatcher.dispatch('ready', pdk);
      });
    })();

    ovp.on("OnPlayerLoaded", function(e) {
      //This event should be return data concerning DOM nodes on which player just loaded according to PDK docs.
      //From that information we would be able to determine the specific player, and we could add the overlay then more specifically.
      var share_overlay = jquery('<div>')
        .addClass('share-overlay')
        .html('Share')
        .appendTo('.tpPlayer .player');

      var isAd = true;

      share_overlay.one('click touchstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        //By showing the player card, we initialized the share code below, it has this code internally
        //so we can tear down this setup and let it take over
        share_overlay.parent().off('mouseover touchstart touchmove');
        $pdk.controller.removeEventListener('OnMediaStart', onMediaStart);
        $pdk.controller.showPlayerCard("forms", "share");
      });

      var onMediaStart = function(e) {
        if (e.data.baseClip.isAd === true) {
          isAd = true;
          return;
        }
        isAd = false;
      };
      $pdk.controller.addEventListener("OnMediaStart", onMediaStart);

      var timer;
      share_overlay.parent().on('mouseover touchstart touchmove', function() {
        if (!isAd) {
          share_overlay.show();
          if (typeof(timer) !== 'undefined') {
            clearTimeout(timer);
          }
          timer = setTimeout(function() {
            share_overlay.fadeOut();
          }, 3000);
        }
      });
    });

    var Share = function(options) {
      this._network = setNetwork(FDM_Player_vars.layouts.defaultLayoutUrl);

      this.loadVars(options);
      this.controller = options.controller;


      this.video = this.controller.component.video; //firstchild will give you <video>
      this.cardsContainer = document.getElementById(this.controller.component.id + '.cards');
      this.cardsContainerWidth = this.cardsContainer.clientWidth;
      this.bindDOMEvents();
      this.bindPDKEvents();

      //Sniff URL for analytics
      this.sniffURL();

      this.overlay = jquery('.share-overlay', this.controller.component.container);
    };

    Share.prototype = {
      loadVars: function(options) {
        debug.log('Share card variables loading...');
        window.console.dir(options);

        var self = this;
        _.each(options.share_config, function(value, key) {
          switch (key.toLowerCase()) {
            case 'sharetargets':
              try {
                self.shareTargets = JSON.parse(value);
              } catch(e) {
                self.shareTargets = DEFAULT_SHARE_TARGETS;
                debug.error('Share target could not be JSON parsed. Defaults remain set.');
              }
              break;
            case 'embed':
              if (value === true) {
                self.enableEmbed = true;
                self.enableEmbedDefault = true;
              } else {
                self.enableEmbed = false;
                self.enableEmbedDfeault = false;
              }
              break;
            case 'emailscript':
              self.emailScript = value;
              self.enableEmail = true;
              break;
            case 'deeplink':
              self.deeplink = value;
              break;
            case 'deeplinkfunc':
              eval('self.deeplinkfunc = ' + value);
              break;
          }
        });

        if (!this.deeplink) {
          debug.log('Deeplink remains unset, URL sniffing to determine');
          var paths = window.location.pathname.split('/');
          this.deeplink = encodeURIComponent(window.location.hostname);
          for (var i = 0; i < paths.length; i++) {
            if (-1 === paths[i].indexOf('.')) {
              this.deeplink += encodeURIComponent(paths[i]) + '/';
            } else {
              break;
            }
          }
        }
        this.deeplink = (this.deeplink.charAt(this.deeplink.length - 1) === '/') ?
          this.deeplink.slice(0, this.deeplink.length - 1) : this.deeplink;

        this.baseClip = options.clip.baseClip;
        this.release = options.release;

        this.release.humanLength = this._humanizeDuration(this.release.chapters.aggregateLength);
        if (this.release.ratings.length === 0) {
          this.release.rating = 'Unrated';
        } else {
          this.release.rating = this.release.ratings[0].rating.toUpperCase();
        }

        if ('undefined' === typeof(this.shareTargets)) {
          this.shareTargets = DEFAULT_SHARE_TARGETS;
        }

        this.cards = [];
        if (this.baseClip.isAd === false) {
          this.enabled = true;
          this.showOverlay(3000);
        } else {
          this.enabled = false;
        }

        this.currentSlide = 1;
        this.overlayTimer = undefined;
        this.wasFullscreen = false;
      },

      bindPDKEvents: function() {
        var self = this;
        this.controller.addEventListener('fng:endcard:display', function(e) {
          self.endcardOpen = e.data.display;
        });

        this.controller.addEventListener("OnSetReleaseUrl", function(e) {
          if ('undefined' !== typeof e.data) {
            if (e.data.indexOf('http') !== -1) {
              var url = e.data;
              url = url.substr(0, url.indexOf('?'));
              self.releaseUrl = url + '?mbr=true';
            }
          }
        });

        this.controller.addEventListener("OnLoadReleaseUrl", function(e) {
          //Save Image source for facebook share.
          self.shareImage = e.data.defaultThumbnailUrl;
        });

        this.controller.addEventListener("OnMediaStart", function(e) {
          //When a release starts, we should ensure video player is regular size.
          jquery(self.video).removeClass('videoPlayerMiniMode');
        });

        this.controller.addEventListener("OnReleaseStart", function(e) {
          self.release = e.data;
          self.release.humanLength = self._humanizeDuration(self.release.chapters.aggregateLength);
          if (self.release.release.ratings.length === 0) {
            self.release.rating = 'Unrated';
          } else {
            self.release.rating = self.release.release.ratings[0].rating.toUpperCase();
          }
        });

        this.controller.addEventListener("OnMediaStart", function(e) {
          if (e.data.baseClip.isAd === true) {
            self.baseClip = undefined;
            self.enabled = false; //Hide overlay on ads.
            return;
          }
          self.enabled = true;

          //sanity check that we aren't going to set a useless variable
          if ('undefined' !== typeof e.data.baseClip) {
            self.baseClip = e.data.baseClip;
          } else {
            self.baseClip = undefined;
          }

          //Let us show that overlay.
          self.showOverlay(3000);
        });
      },

      bindDOMEvents: function() {
        this.bindOverlay();
        this.bindCards();
      },

      bindOverlay: function() {
        var self = this;
        var $container = jquery(this.controller.component.container);
        $container.bind('mouseover touchstart touchmove', function() {
          self.showOverlay(3000);
        });

        $container.delegate('.share-overlay', 'click touchstart', function(e) {
          e.preventDefault(); //stop mouse event from firing from click event
          var data = 'playback';
          if (self.endcardOpen) {
            data = 'endcard';
            self.controller.dispatchEvent('fng:endcard:timer', {pause: "true"});
          }

          Analytics.dispatch('select:open', data);
          //debugger;
          self.show();
        });
      },

      bindCards: function() {
        var $cardContainer = jquery(this.cardsContainer);
        var self = this;

        $cardContainer.delegate('.share-close', 'click touchstart', function(e) {
          e.preventDefault(); //stop mouse event from firing from click events
          self.previousCard();
        });

        $cardContainer.delegate('.share-toplevel a.copy', 'click', function(e) {
          var which = jquery(this).data('type');
          selectText(this);
          Analytics.dispatch('select:copyurl', which);
        });

        $cardContainer.delegate('.share-toplevel textarea.copy', 'click', function(e) {
          var which = jquery(this).data('type');
          this.select();
          Analytics.dispatch('select:copyurl', which);
        });

        $cardContainer.delegate('.slider [data-target]', 'click touchstart', function(e) {
          e.preventDefault(); //stop mouse event from firing from click event
          var socialService = jquery(this).data('name');
          Analytics.dispatch('share:socialSite', socialService);
          window.open(jquery(this).data('target'), "_blank");
        });

        $cardContainer.delegate('.slider-control', 'click touchstart', function(e) {
          e.preventDefault(); //stop mouse event from firing from click event
          var $this = jquery(this);
          if ($this.hasClass('disabled')) {
            return;
          }

          jquery('.slider-control', self.cardsContainer).removeClass('disabled');

          var move = self.targetWidth * self.targetsPerSlide;


          if ($this.hasClass('left')) {
            //move left - positive px
            if (self.currentLeft + move > 0) {
              move = Math.abs(self.currentLeft);
            }

            self.currentSlide--;
            if (self.currentSlide === 1) {
              $this.addClass('disabled');
            }
          } else if ($this.hasClass('right')) {
            //move right - negative px

            self.currentSlide++;
            if (self.currentSlide === self.maxSlides) {
              $this.addClass('disabled');
              move = self.targetWidth * (self.totalTargets % self.targetsPerSlide);
            }

            move *= -1;
          }

          self.currentLeft += move;
          jquery('.slider ul', $cardContainer).animate({
            left: '+=' + move
          }, 1000);
        });

        if (this.enableEmail) {
          $cardContainer.delegate('.slider .email', 'click touchstart', function(e) {
            e.preventDefault(); //stop mouse event from firing from click event
            Analytics.dispatch('select:email', true);
            self.showEmailCard();
          });

          $cardContainer.delegate('.buttons div', 'click touchstart', function(e) {
            e.preventDefault(); //stop mouse event from firing from click event
            var $this = jquery(this);

            switch ($this.data('action')) {
            case 'submit':
              self.sendEmail();
              break;
            case 'cancel':
              self.previousCard();
              break;
            }
          });

          $cardContainer.delegate('.response .button', 'click touchstart', function(e) {
            e.preventDefault(); //stop mouse event from firing from click event
            self.previousCard();
          });
        }
      },

      //= User Interface Bits
      showOverlay: function(fadeTimer) {
        if (this.enabled) {
          jquery(this.overlay).show();

          this._clearTimer(this.overlayTimer);
          var self = this;
          this.overlayTimer = setTimeout(function() {
            self.hideOverlay();
          }, fadeTimer);
        } else {
          this.hideOverlay(true);
        }
      },

      hideOverlay: function(instant) {
        if (!instant) {
          jquery(this.overlay).fadeOut();
        } else {
          jquery(this.overlay).hide();
        }
        this._clearTimer(this.overlayTimer);
      },

      show: function() {
        this.controller.showPlayerCard('forms', 'share'); // calls showShareCard
      },

      showShareCard: function() {
        var self = this;
        var $video = jquery(this.video);

        var exitShare = function(e) {
          $video.unbind('click touchstart', exitShare);
          e.preventDefault();
          self.hideShareCard();
        };

        var evt = function(e) {
          self.generateLinks();
          var data = {
            humanLength: 'Runtime: ' + self.release.humanLength,
            rating: 'Rating ' + self.release.rating,
            clip: self.baseClip,
            slider: self.createSlider(),
            shareLink: self.createLinkView(),
            shareEmbed: ''
          };

          if (self.enableEmbed) {
            data.shareEmbed = self.createEmbedView();
          }

          var setup = function() {
            self._setScreen('share', data, false);
            self._calculateSliderVars();
            $video.addClass('videoPlayerMiniMode');
            $video.bind('click touchstart', exitShare);
          };

          if (e) {
            var exitingFS = setInterval(function() {
              if (self.cardsContainer.clientWidth === self.cardsContainerWidth) {
                clearInterval(exitingFS);
                setTimeout(setup, 400);
              }
            }, 20);
          } else {
            setup();
          }

          self.controller.removeEventListener('OnShowFullScreen', evt);
        };

        if (isFullscreen()) {
          this.wasFullscreen = true;
          this.controller.addEventListener('OnShowFullScreen', evt);
          this.controller.showFullScreen(false);
        } else {
          this.wasFullscreen = false;
          evt(false);
        }
      },

      hideShareCard: function() {
        jquery(this.video).removeClass('videoPlayerMiniMode');
        this.controller.hidePlayerCard();

        //Reset
        this.currentSlide = 1;
        this.currentLeft = 0;
        this.currentScreen = null;

        if (this.wasFullscreen) {
          this.controller.showFullScreen(true);
        }
      },

      showEmailCard: function() {
        this._setScreen('email', {
          clip: this.baseClip,
          humanLength: 'Runtime: ' + this.release.humanLength,
          rating: 'Rating ' + this.release.ratings[0].rating.toUpperCase()
        });
      },

      previousCard: function() {
        var obj = this.cards.pop();
        if (obj) {
          this._setScreen(obj.screen, obj.data, false);
        } else {
          this.hideShareCard();
        }
      },

      createSlider: function() {
        if ('undefined' === typeof this.sliderHTML) {
          var str = '<ul>';
          if (this.enableEmail) {
            str += '<li class="email target"></li>';
          }
          for (var i = 0; i < this.shareTargets.length; i++) {
            str += '<li class="target" data-name="' + this.shareTargets[i].name + '" data-target="' + this._populateURL(this.shareTargets[i].name, this.shareTargets[i].share) + '">';
            str += '<img src="' + this.shareTargets[i].image + '" />';
            str += '</li>';
          }
          str += '</ul>';
          str += '<div class="left disabled slider-control"></div>';
          str += '<div class="right slider-control"></div>';
          this.sliderHTML = str;
        }

        this.currentLeft = 0;
        this.totalTargets = this.shareTargets.length;
        if (this.enableEmail) {
          this.totalTargets++;
        }

        return this.sliderHTML;
      },

      _calculateSliderVars: function() {
        var viewportWidth = jquery('.slider', this.cardsContainer).width();
        this.targetWidth = jquery('.target', this.cardsContainer).outerWidth(true); //include margin
        this.targetsPerSlide = Math.floor(viewportWidth / this.targetWidth);
        this.maxSlides = Math.ceil(this.totalTargets / this.targetsPerSlide);
      },

      createEmbedView: function() {
        return '<div class="share-embed">' +
          '<div class="heading">Embed Video</div>' +
          '<textarea data-type="embed" class="copy">'+this.embed+'</textarea>' +
        '</div>';
      },

      createLinkView: function() {
        return '<div class="share-link">' +
          '<div class="heading">Link Video</div>' +
          '<a href="'+_.escape(this.sharelink)+'" onclick="return false;" data-type="link" class="copy">' + this.sharelink + '</a>' +
        '</div>';
      },

      //= The Work
      sendEmail: function() {
        var cardContainer = this.cardsContainer;
        var $from = jquery ('.email-from input', cardContainer);
        var $to = jquery('.email-to input', cardContainer);
        var from = $from.val();
        var to = $to.val();
        var message = jquery('.email-message textarea').val();

        var self = this;
        if (this.validForm($from, $to) === true) {
          Analytics.dispatch('email:sent', true);

          //Form submission
          jquery('.email-message textarea').val(message + '\n\n' + this.sharelink);
          $from.closest('form').submit();
          self._setScreen('emailConfirm', {
            clip: self.baseClip,
            humanLength: 'Runtime: ' + self.release.humanLength,
            rating: 'Rating ' + self.release.rating,
            message: 'This video was sent to ' + to
          }, false);

          //XHR
          /*jQuery.post(this.emailScript, {
            cmp: "email_post"
            ToEmails: to,
            FromEmail: from,
            Subject: "",
            Message: message + '\n\n' + this.sharelink
          })
          .done(function() {
            self._setScreen('emailConfirm', {
              message: 'Success!'
            });
          })
          .fail(function() {
            self._setScreen('emailConfirm', {
              message: 'Failure!'
            });
          })*/
        }
      },

      generateLinks: function() {
        var embed = '';
        embed = '<iframe width="640" height="360" ' +
          'src="http://player.foxfdm.com/' + this._network + '/embed-iframe.html?videourl=' +
          this.releaseUrl + '" ' +
          'frameborder="0" ' +
          'scrolling="no" ' +
          'allowfullscreen>' +
        '</iframe>';
        this.embed = _.escape(embed);
        this.makeDeeplink();
      },

      makeDeeplink: function() {
        var series = '';
        var clipType = '';
        var mediaId = '';
        var title = '';

        if ('undefined' !== typeof this.baseClip) {
          title = this._slugize(this.baseClip.title);
          this.shareTitle = this.baseClip.title;
          this.shareDescription = this.baseClip.description;

          if (this.baseClip.categories && this.baseClip.categories[0]) {
            series = this.baseClip.categories[0].name;
          } else if (this.baseClip.contentCustomData && this.baseClip.contentCustomData.series) {
            series = this.baseClip.contentCustomData.series;
          }
          if (series.indexOf('/') > 0) {
            series = series.split('/')[1];
          }
          this.seriesTitle = series;
          series = this._slugize(series);

          mediaId = (this.baseClip.contentCustomData.freewheelId) ?
            this.baseClip.contentCustomData.freewheelId :
            this.baseClip.contentID;

          if (this.baseClip.contentCustomData) {
            clipType = (this.baseClip.contentCustomData.fullEpisode !== "false") ?
             'full-episodes' :
             'videos';
          }

          if (clipType === 'full-episodes') {
            this.enableEmbed = false;
          } else if (this.enableEmbedDefault === true) {
            this.enableEmbed = true;
          }
        }

        if (this.deeplinkfunc && 'function' === typeof this.deeplinkfunc) {
          try {
            this.sharelink = this.deeplinkfunc(mediaId);
          } catch(err) {
            this.log('error from deeplinkfunc: ' + err, 'error');
          }
        } else {
          if (this.deeplink.indexOf(mediaId) > -1) {
            this.sharelink = this.deeplink;
          } else if (this._network === this.NETWORK_FX) {
            this.sharelink = this.deeplink + '/' + mediaId + '/' + title;
          } else if (series === '') {
            this.sharelink = this.deeplink + '/' + clipType + '/' + mediaId + '/' + title;
          } else {
            this.sharelink = this.deeplink + '/' + series + '/' + clipType + '/' + mediaId + '/' + title;
          }
        }
      },

      sniffURL: function() {
        var obj = {};
        window.location.search.replace(/([^?=&]+)=([^&]*)/g, function(m, key, value) {
          obj[decodeURIComponent(key)] = decodeURIComponent(value);
        });

        if (obj.ss) {
          Analytics.dispatch('social:play', obj.ss);
        }
      },

      validForm: function($from, $to) {
        var from = $from.val();
        var to = $to.val();

        //Fresh start..
        $from.removeClass('error');
        $to.removeClass('error');

        var goodToGo = true;
        if (!this._isEmail(from)) {
          goodToGo = false;
          $from.addClass('error');
        }

        if (!this._isEmail(to)) {
          goodToGo = false;
          $to.addClass('error');
        }

        return goodToGo;
      },

      //= Utilies
      _openCard: function() {
        this.controller.showPlayerCard('forms', 'share');
        this._setScreen.apply(this, arguments);
      },

      _setScreen: function(screen, data, record) {
        data = data || {};
        record = (typeof record === 'undefined') ? true : false;

        if (record && this.currentScreen) {
          this.cards.push(this.currentScreen);
        }
        this.currentScreen = {screen: screen, data: data};
        jquery('.share', this.cardsContainer).html(Tmpls[screen](data));
      },

      _populateURL: function(name, shareObj) {
        var url = shareObj.url;
        var items = shareObj.items;

        var length = items.length;
        for (var i = 0; i < length; i++) {
          url = url.replace('_?_', this._getItem(items.shift()));
        }
        //Give back URL with a extra present for tracking which social service gave us a play.
        return url + encodeURIComponent('&ss=' + name);
      },

      _slugize: function(str) {
        if ('string' !== typeof str) {
          throw new Error('Only works with strings');
        }
        if (str === '') {
          return '';
        }

        str = str.toLowerCase();
        //Replace spaces with -
        var regexp = / /g;
        str = str.replace(regexp, '-');
        //Remove non-alphanumeric characters
        regexp = /[^a-zA-Z0-9_-]/g;
        str = str.replace(regexp, '');
        return str;
      },

      _isEmail: function(email) {
        //Final part of regex is 2,6 for .museum type TLDs
        var emailRegex = /\b[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}\b/;
        return emailRegex.test(email);
      },

      _clearTimer: function(timer) {
        if ('undefined' !== typeof timer) {
          clearTimeout(timer);
        }
      },

      _humanizeDuration: function(milliseconds) {
        var hours;
        var minutes;
        var seconds = milliseconds / 1000;
        if (seconds >= 60) {
          minutes = seconds / 60;
          seconds = seconds % 60;
          if (minutes >= 60) {
            hours = minutes / 60;
            minutes = minutes % 60;
          }
        }

        seconds = Math.floor(seconds);

        if ('undefined' !== typeof minutes) {
          minutes = Math.floor(minutes);
        }

        if ('undefined' !== typeof hours) {
          hours = Math.floor(hours);
        }

        if (seconds < 10) {
          seconds = "0" + seconds;
        }

        if (minutes < 10) {
          minutes = "0" + minutes;
        }

        if ('undefined' !== typeof hours) {
          return hours + ':' + minutes + ':' + seconds;
        } else if ('undefined' !== typeof minutes) {
          return minutes + ':' + seconds;
        } else {
          return seconds + ' seconds';
        }
      },

      _getItem: function(item) {
        var str = '';
        switch (item.toLowerCase()) {
        case 'title':
          str = this.baseClip.title;
          break;
        case 'url':
          str = this.sharelink;
          break;
        case 'description':
          str = this.baseClip.description;
          break;
        case 'image':
          str = this.shareImage;
          break;
        }
        return encodeURIComponent(str);
      }
    };

    return Share;
  });