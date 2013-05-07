# iFrame Players

## Overview

Occasionally, you'll need to support multiple players on the page and one of the easiest/cleanest ways to achieve that is by using iframes. The examples below and included in this directory will help show you how to do that.

## Setup

First, to get a player setup on the page, you need to setup your HTML. Previously, Marc had been using data attributes, which isn't bad practice but the problem is that most browsers lowercase all of those attributes, which is a problem when trying to give those values to the PDK since the PDK expects some of them to be camelcase.

##### HTML
So, your HTML would look something like this:
```html
<div class='btn_video_player' data-player='autoplay=true|width=460|height=240|fb=true|releaseURL=http://link.theplatform.com/s/fxnetworks/oDwAThTJ95NP?mbr=true|siteSection=myFWSiteSection'></div>
```

As you can see, the `data-player` attribute is the key here. Any values you want to pass to the player (size, release URL, etc) should be specified as that `data-player` attribute's value. To separate key-value pairs, use the pipe symbol (shift + backslash). Any property that the PDK expects will get picked up and used for the player, though keep in mind that the spelling and casing of these keys must match what the PDK supports. For instance, `releaseurl` is not the same as `releaseURL`, and the latter is what the PDK is expecting.

##### The Library
We've created a concise library that will grow over time in the `btn_player.js` file. Once that library loads, it dispatches an event over the `window` object called `foxneod:ready`. That's key, since you'll have to wait for that event to fire before you can swap out the players, which brings us nicely to our next section.
```javascript
window.addEventListener('foxneod:ready', function () {
});
```

##### Javascript

The HTML alone isn't going to do anything, so we need a bit of javascript to let the page know those HTML elements should be players instead. We've already added the event listener, but now let's make it do something. Here's the one line of code you'll need: 
```javascript
window.addEventListener('foxneod:ready', function () {
    FoxNEOD.player.injectIframePlayers('.btn_video_player', 'iframe-player.html');
});
```

You can see that we're calling `injectIframePlayers()` and passing it two arguments. The first argument is the CSS selector to use to find the player(s) on the page. Here, you can see we've passed in the class `.btn_video_player` so that any HTML element with that class will attempt to swap its contents for an iframe. If you're familiar with jQuery, you're familiar with what these CSS selector strings look like. Having this allows some flexibility in that you can decide when and what players will get switched to an iframe.

You can even put that in a script tag right inside the div you created, like so:
```html
<div class='btn_video_player' data-player='autoplay=true|width=460|height=240|fb=true|releaseURL=http://link.theplatform.com/s/fxnetworks/oDwAThTJ95NP?mbr=true|siteSection=myFWSiteSection'>
	<script type="text/javascript">
	window.addEventListener('foxneod:ready', function () {
    	FoxNEOD.player.injectIframePlayers('.btn_video_player', 'iframe-player.html');
	});
	</script>
</div>
```

It's entirely up to you and the style that you prefer. That's it for your web page, but there's still one more element you might be curious to know about.

##### Iframe

You'll notice in the examples above that the _second_ parameter passed to the `injectIframePlayers()` method is a URL to where your iframe lives. This should be an absolute or relative URL, but it has to live on the same domain as the website, otherwise the browser will block the iframe because it's coming from a different origin than the site. There are ways around this, but they're not trivial - if you hit issues with this restriction, please let us know.

However, if you'd like to customize the player experience (maybe you want to add a title and description or space for a 300x250 ad that will be tied to a video ad), you can create your own HTML page and use that as the iframe URL instead, thus giving you the ability to still have iframe players but use them however you'd see fit. The `single-player-custom.html` example shows this.