# Collaborative Virtual Browser

Example of using PhantomJS with Node, Angular and Socket.io to create a Virtual Browser which may be used by multiple devices collaboratively.

This is an extract from my Master Thesis at ETHZ (GlobIS): **An infrastructure for cross-device mashups**

## Installation

Install PhantomJS and add the runnable to the PATH env. variable (i.e. typing `phantomjs` in a terminal should start PhantomJS).

Use `package.json` (the usual `npm install` in the main folder) to install the Node modules. 

Go into the `public` folder and use `bower.json` (the usual `bower install`) to install the client dependencies.

## How does it work?

Pages are open inside a virtual browser (PhantomJS) which simply put is like a real browser, but running on the server (no need for a GUI).

Once open, the page DOM is extracted, modified and sent to the interested clients. Since we are using Socket.io for communication, users interested in a page join the Socket Room called `pageId`.

Events on the client (click, change, submit) are sent to the server, which replays them inside the virtual browser and then sends the result back.

You can see it as a remote desktop kind of application, but with js and html pages.


##Note
Disable logging if it gets slow. I am printing a shitload of stuff. Each time a page changes or it finishes loading resources, the whole page is sent to the registered clients.

A batter way to do this would be to use MutationObserver (or some other trick) and only send updates instead of the whole document.


## Tools
Server:
* Node.js
* Express
* Jade
* Socket.io
* phantomjs-node
* Cheerio

Client:
* AngularJS
* Socket.io
* angular-socket-io
* Bootstrap 3.0
* jQuery
