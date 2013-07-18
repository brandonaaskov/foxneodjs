# foxneod.js

### Overview
The `foxneod` javascript library is a globally referenced object that contains all aspects of the Fox digital video player within. It can be referenced globally through `foxneod` or `$f`. You can see more in the examples below.

Most questions you'll have about code can be found in the files as code comments. This doc serves to outline architecture decisions, setting up a dev environment, style guide, business rules, etc.

### Table of Contents

* [API](https://github.com/foxneod/foxneod.js/wiki/API)
* [Debugging/Troubleshooting](https://github.com/foxneod/foxneod.js/wiki/Debugging-Troubleshooting)
* [Style Guide](https://github.com/foxneod/foxneod.js/wiki/%22Style-Guide%22)
* [Setting Up Locally](#settinguplocally)
* [Building](#building)


## Setting Up Locally

If you want to set up the project on your local machine, make sure you first have Node and npm installed. Then, from the command line just get to the directory where the project is and `npm install` (you might need `sudo` depending on your privileges). That will install the project's dependencies.

## Building

To run a development build (no minification), simply run `grunt` from the command line at the root of the project. If you want to do a production build, run `grunt prod`. If you're in development mode and don't want to have to build over and over, running `grunt watch` will watch for changes to the javascript files and automatically build as necessary, so you can just refresh the page and get the latest.