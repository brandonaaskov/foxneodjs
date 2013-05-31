# foxneod.js

### Overview
The `foxneod` javascript library is a globally referenced object that contains all aspects of the Fox digital video player within. It can be referenced globally through `foxneod` or `$f`. You can see more in the examples below.

Most questions you'll have about code can be found in the files as code comments. This doc serves to outline architecture decisions, setting up a dev environment, style guide, business rules, etc.

### Cardinal "Rules"
* If JSHint complains, fix the problem, don't try and change .jshintrc
* If you're going to use an iterator, use Underscore's `_.each()` method to loop through objects and lists alike (you don't have to use only `_.each()` as Underscore has [several fantastic collections functions](http://underscorejs.org/#collections))
* If you're only using jQuery to _find_ an element (and not modify it or manipulate it), please use [`document.querySelector()`](https://developer.mozilla.org/en-US/docs/Web/API/Document.querySelector) or [`document.querySelectorAll()`](https://developer.mozilla.org/en-US/docs/Web/API/Document.querySelectorAll) instead
* Do not add any global definitions to the head of a module other than the standard: 
```javascript
/*global define, _ */
```
If you find that you need to access a global, please access it through a reference to `window` (e.g. `window.myGlobalVariable`)
* No sensitive information in code (e.g. API tokens, API secrets, passwords, etc.)
* Strict mode required: `'use strict';`
* Check to see if functionality exists before writing it yourself (example: don't write a user agent parser since we already have one with `system.js` and `UAParser.js`)
* If you're writing a constructor function (meaning the intent is to create new instances using the `new` keyword), name the module with a capital letter and make sure that it actually returns a function
* If your module isn't a constructor function, to expose the methods you want other modules to be able to use, just return them in an object (see any existing module as an example)
	* If there are functions that you don't want to expose, but need to be tested for unit testing, please expose them in a `__test__` object:
```javascript
//Public API
return {
	play: player.play,
	something: myFunctionName,
	__test__: {
		secretThing: secretFunction
	}	
};
```
* Use an underscore before any variable or method names if you want to make it clear to another developer to not modify the contents
* No single variable names - if you use a single variable name, I'm going to assume you either work for Omniture or hate the concept of find/replace.
	* Furthermore, don't be afraid of descriptive names. We're compressing all of this javascript, so keep readability for developers in mind and don't be concerned over bits


 


### Architecture
* requirejs
* libraries
* polyfills
* modularized

###### Overview
Creating a library consisting of modules was a clear choice. By modularizing code (whether it be javascript or otherwise), we can create dependencies that are only included when/where needed, make the code portable, as well as make it testable. [Addy Osmani has much to say on the matter](http://addyosmani.com/writing-modular-js/), and he also explains it in a very good way.

In short, there are two main camps for module loaders out there: CommonJS and AMD. CommonJS is what you see with stuff like node, where your public functions are part of an export object. AMD, on the other hand, wraps all modules with a `define()` function that allows the user to clearly express what dependencies are needed for that particular module.

Along with many others out there, I prefer AMD because it feels more mature, the documentation for RequireJS (arguably the post popular library for implementing AMD modules), and it makes the code so modular that it lends itself well for feature development. If a vendor need to use a certain utility we've built, they can pull it in as needed in their own modules, which can then later also be re-used. 


###### RequireJS
When doing javascript development, to avoid having several files, functions, and objects populating the global space, care has to be taken. The bigger the project, the more spaghetti-like the code can get. Using module loaders can help overcome that. Module loaders like yepnope, LabJS, and even jQuery's plugin architecture help take us one step closer to clean code. The problem with script loaders is that logic is still required on the page to load all of the necessary files, and that also incurs more http requests.

 

###### Neat Features
* watch
*


### Build Process
* requirejs optimization
* grunt (and grunt tasks and grunt-cli) 
* gruntfile
* package.json
* npm-install
* .jshintrc
* 