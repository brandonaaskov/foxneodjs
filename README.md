# FoxNEO JS

### Overview
The FoxNEO javascript library is a globally referenced object that contains all aspects of the Fox digital video player within. It can be referenced globally through `FoxNEO` or `$Fox`. You can see more in the examples below.

### Architecture
* requirejs
* libraries
* polyfills

###### Overview
Creating a library consisting of modules was a clear choice. By modularizing code (whether it be javascript or otherwise), we can create dependencies that are only included when/where needed, make the code portable, as well as make it testable. [Addy Osmani has much to say on the matter](http://addyosmani.com/writing-modular-js/), and he also explains it in a very good way.

In short, there are two main camps for module loaders out there: CommonJS and AMD. CommonJS is what you see with stuff like node, where your public functions are part of an export object. AMD, on the other hand, wraps all modules with a `define()` function that allows the user to clearly express what dependencies are needed for that particular module.

Along with many others out there, I prefer AMD because it feels more mature, the documentation for RequireJS (arguably the post popular library for implementing AMD modules), and it makes the code so modular that it lends itself well for feature development. If a vendor need to use a certain utility we've built, they can pull it in as needed in their own modules, which can then later also be re-used. 

###### RequireJS
* why requirejs


### Build Process
* requirejs optimization
* grunt
* watch
* 