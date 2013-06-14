# foxneod.js

### Overview
The `foxneod` javascript library is a globally referenced object that contains all aspects of the Fox digital video player within. It can be referenced globally through `foxneod` or `$f`. You can see more in the examples below.

Most questions you'll have about code can be found in the files as code comments. This doc serves to outline architecture decisions, setting up a dev environment, style guide, business rules, etc.

## API
The foxneod library is assigned to the window object as `foxneod` as well as `$f` (for shortcut purposes). For examples below, we'll use `foxneod` as the reference, but you'll see `$f` used here and there (primarily for tests), and it's a supported alias so you can use it yourself if you'd prefer.

__Note__: Some aspects of the library make use of [Promises](http://wiki.commonjs.org/wiki/Promises/A). We're using jQuery's Deferred object for this, and you can read more about promises on jQuery's site or just about anywhere where people are dealing with asynchronous javascript :)

## API: Core
The "core" module are really just the elements surfaced directly on `foxneod` such as the version, build date, etc.

### foxneod.buildDate

This is a property that will tell you the latest build date.

```javascript
console.log(foxneod.buildDate); //"2013-06-12 07:06:58"
```

### foxneod.packageName

This is a property that will tell you the name of the package, which is foxneod. I don't really know why'd you ever use this unless you were using the $f alias, but it's there if you need it :)

```javascript
console.log(foxneod.packageName); //"foxneod"
console.log($f.packageName); //"foxneod"
```

### foxneod.version

This is a property that will tell you the version of the library that you're working with.

```javascript
console.log(foxneod.version	); //"0.4.0"
```

### foxneod.dispatch()

With this method you can dispatch events over the core module of the library. Everything dispatches over `foxneod`, so you can listen for the events on it as well.

```javascript
foxneod.addEventListener('test', function (event) {
	console.dir(event);
});

foxneod.dispatch('test');
```

The dispatch method takes an optional second parameter, which is a boolean to specify if you want to dispatch the event over the window or not. It defaults to false, but if you specify true, you just need to adjust the event listener as well. When dispatching over the window, to namespace things properly we automatically prepend "foxneod:" to the name that you pass in. If you want to play it safe, you should namespace your event names with whatever you want just to prevent any potential collisions with other code on the page or in plugins.

```javascript
window.addEventListener('foxneod:test', function (event) {
	console.dir(event);
});

foxneod.dispatch('test', true);
```

### foxneod.addEventListener()

See examples in **dispatch()** to see it in use.

### foxneod.getEventListeners()

This is a helpful way to see what event listeners are currently being used. If you want to see all of them, just pass in nothing and you'll get an array of all the event listeners.

### foxneod.hasEventListener()

If an event listener already exists for the event name that you pass in, it will return true. Otherwise it will return false.

```javascript

```

### foxneod.removeEventListener()

To remove an event listener, just pass in the name of the event that you want to remove. Ideally you'll have named them well in the first place (see **addEventListener()**), but please be careful to not remove event listeners that might be used by other parts of the code.

### foxneod.Debug()

The Debug module returns a function, which means you can create new instances of it. This is what's used internally for the debug tools (see **Debugging/Troubleshooting** below). Whatever you name your instance of Debug is what it will show up under in the console (and is the same name you'd specify in a query paramater to isolate the log statements). What gets logged out is an object containing the message and data, if populated.

To simply log a message:

```javascript
var debug = new foxneod.Debug('myTest');

debug.log('Just testing');
```

To log a message with some data:

```javascript
var debug = new foxneod.Debug('myTest');

debug.log('Testing with data', { 
	name: 'test', 
	data: []
});
```

You can also send out warnings. These are primarily used to warn anyone who might be looking at the debug logs (support teams troubleshooting, developers, etc). They're prefixed with "!!!WARNING!!!:" and can be used just like calling log (and also supports an optional second parameter to populate the data object).

```javascript
var debug = new foxneod.Debug('myTest');

debug.warn("Don't do that!");
```

## API: Query

The query module is intended for getting data easily from feeds.

### foxneod.query.getFeedDetails()

If you pass this method a valid feed url (including the http://), it will return to you a shallow object containing only details about the feed itself. Since this is an asynchronous method, it returns a promise. More detail about Promises is mentioned in **getVideo()**, and the same methods apply here (`done()`, `fail()`, `always()` and `then()`).

### foxneod.query.getVideo()

The getVideo() method is simply a convenience method. For example, if you supply getVideo() with a valid feed URL, it will return to you the first video in that feed. Currently, the getVideo() method supports taking a valid feed URL, or a guid (currently, the guid must be in the traditional guid format to work properly). A Promise is returned, and you can use the `done()`, `fail()`, `always()` and `then()` methods as you see fit (damn, I love Promises). If you're still confused about that, please read an article or two (like [this one](http://blog.parse.com/2013/01/29/whats-so-great-about-javascript-promises/)) - it's very worth it. 

```javascript
foxneod.query.getVideo('http://feed.theplatform.com/f/fox.com/myfeedid')
    .done(function (response) {
        console.dir(response);
        //let's interact with the video
    })
    .fail(function (error) {
        console.dir(error);
    }); 
```

If the video you're trying to get has a guid associated with it in the [traditional guid format](http://en.wikipedia.org/wiki/Globally_unique_identifier#Uses), you can just pass that in. However, since we have no way to know what feed to refer to, you'll have to first set a default feed URL.

```javascript
foxneod.query.setDefaultFeedURL('http://feed.theplatform.com/f/fox.com/myfeedid');

foxneod.query.getVideo('37058D8F-5BF6-6D1B-51D3-30C0F76B93A7')
    .done(function (response) {
        console.dir(response);
        //let's interact with the video
    })
    .fail(function (error) {
        console.dir(error);
    });
```

You can also optionally pass in a callback as a second parameter, which will either get a success or error response.

```javascript
foxneod.query.getVideo('http://feed.theplatform.com/f/fox.com/myfeedid'), function (response) {
	//this could be a video or an error
}); 
```

You can also use getVideo() without passing in anything, but you _have_ to call setDefaultFeedURL() first, otherwise the Promise will fail with an error describing just that.

```javascript
foxneod.query.setDefaultFeedURL('http://feed.theplatform.com/f/fox.com/myfeedid');

foxneod.query.getVideo('37058D8F-5BF6-6D1B-51D3-30B0F76C93A7')
    .done(function (response) {
        console.dir(response);
        //let's interact with the video
    })
    .fail(function (error) {
        console.dir(error);
    }); 
```

### foxneod.query.isFeedURL()

This method will return true or false depending on what you pass in. If it's a valid feed URL (requires the http://), it will return true. Just about anything else will return false. If the feed URL includes query params, that's fine - that's still a valid feed URL.

### foxneod.query.isGuid()

Checks to see if what's passed in is a traditional guid (e.g. bd324bca-f2b9-407c-b6e9-f1d650b10e86): 8 characters-4 characters-4 characters-12 characters

It's not a requirement that a guid assigned to a video follow the traditional format. Technically a guid is anything unique (in a really loose sense), so not every video will have a traditional guid. This is best used when you _know_ that the input is likely to be in the traditional format.

### foxneod.query.isReleaseURL()

Same exact rules as `isFeedURL()` but… you know… with release URLs. 

### foxneod.query.setDefaultFeedURL()

This method is used in conjuction with `getVideo()`. By setting it, you can get videos from the feed by passing in things like a guid. I say that because right now that's the only one that's supported. In the near future we'll have support for guids in the non-traditional format, release IDs, release URLs and thePlatform IDs. 

```javascript
foxneod.query.setDefaultFeedURL('http://feed.theplatform.com/f/fox.com/myfeedid');
```



## Debugging/Troubleshooting
Each module that has a debugger configured for it can have it exposed in the console for the browser, but by default those debug messages aren't logged. To enable them for the entire project, pass in `debug=all` as a query param to the page. If you'd like to isolate one of the modules (e.g. `core`) and ignore other debug messages, just specify `debug=core`. You can view multiple modules' debug statements at once without having to view everything by passing in a comma separated list: `http://mydomain.com/?debug=core,player,system`