# featurama.js

A framework to group and run feature detection tests, then cache the results in a single location for use.

## Getting Started
Download the [production version][min] or the [development version][max] and ensure that [modernizr.js][modernizr] and [rsvp.js][rsvp] are referenced prior to featurama.js.


alternatively, you can use [bower][bower] to install this using the following:

```
	bower install featurama.js
```

[min]: https://raw.github.com/nicdacosta/featurama.js/master/dist/featurama.min.js
[max]: https://raw.github.com/nicdacosta/featurama.js/master/dist/featurama.js
[modernizr]: http://modernizr.com/
[rsvp]: https://github.com/tildeio/rsvp.js/
[bower]: http://bower.io/

In your web page:

```html
<script src="modernizr.js"></script>
<script src="rsvp.min.js"></script>
<script src="dist/featurama.min.js"></script>
<script>
	// create necessary test for HTML5 Audio
	var testAudio = {
                  key : 'audio',
                  Modernizr : [ 'audio' ],
                  custom : function() {
                    if ( window.Audio ) {
                      var audio  = new Audio(),
                        rejectTimeout,
                        promise = new window.RSVP.Promise( function( resolve ) {

                          // runs in try catch, should any error occur, promise is then immediatly resolved and returns false;
                          try {

                            /*
                            ** handles async call should only one sound play. Resolves the promise to return false as opposed to rejecting. 
                            */
                            rejectTimeout = window.setTimeout( function() { resolve( false ); } , 2000 );

                              audio.addEventListener( 'loadedmetadata' , function() {
                                audio.volume = 0;
                                audio.play();
                              } , false );

                              audio.addEventListener( 'playing' , function() {

                                  window.clearTimeout( rejectTimeout );
                                  resolve( true );

                              }, false );

                            // load the necessary audio file
                            audio.src = 'dependencies/AudioTest.mp3';

                          } catch( err ) {

                            resolve( false );

                          }

                        } );

                      return promise;

                  } else {

                    return false;
                  
                  }
                }
               };

    // run the test
    window.featurama.run( testAudio );

</script>
```

## Documentation

---

Featurama was designed and developed to handle the vast number of devices when developing for the mobile web. To be able to have all your feature detection tests available in one central location, run when required and the results cached for use anywhere without having to rerun the test. This also gives the developer the ability to override any of the results on any particular device should the device performance for the given feature be poor or should the feature pass all the required tests but it has not been fully implemented on that given device.

This project is still in alpha as i am uncertain of some of the methods on whether they are required. Will also need to be refactored once Modernizr v3 is released due to the new api changes. I am currently investigating removing the dependency of RSVP and looking at using native Promises.

Any and all ideas or feedback is welcome.

###API Available

####run:
This is the main entry point where all tests are run. This method requires a test object to be passed as a parameter. Multiple tests can be run successively by passing in more than one test object ( *each test object would be passed in as a parameter* ). All tests are stored in localStorage ( *unless explicitly stated by setting ```cacheTest : false```* ) to be used in the rerun method. Should a test object be passed through for a test that has already been run ( *based on the key and version of the test* ), the test will not be rerun, but instead the previous result will be returned. This is to prevent unecessary code from running when a result is available. To obtain a new result, the rerun method should be used.

This method returns a promise.

#####Properties Available for Test Object

*   Modernizr { *array* } - An array of strings of Modernizr property names ( eg: ```[ 'csstransform' , 'webworkers' ]``` )
*   custom { *function / array* } -	This can be either a function or an array of functions. This is for custom tests that need to be runned. These functions should either return a boolean of the result or else a promise that will be resolved with either true or false depending on the outcome of the test.
*   key { *string* } - A string of the key that will be used in the results object to identify the current test
*   keepExisting { *boolean* } - A boolean on whether to overwrite the result should one already exist
*   cacheTest { *boolean* } - A boolean on whether to cache the test to localStorage. This is used in the rerun method.
*   version { *int* } - A int to determine the current version of the test object. This is used for caching purposes ( needsUpdate method )


####rerun:
This allows to rerun an existing test without having to recreate the test object / conditions as is based on the given key for the test. The purpose of this method is should a test be run and the result is false, a shim can be loaded and then the test rerun allowing for the results to be re-evaluated based on the original tests.

This returns a Promise. Should the key not exist, the promise is rejected with an error as the result.

*   parameter { *string* } - key of the test to be re-run

####remove:
This method removes all instances of a given test. it will remove the test from cache ( localStorage ), the config and the results. This method does not return anything.

*   parameter { *string* } - key of the test to be removed

####clear:
This method is used to clear all instances of all tests. This resets all the results, the config and removes all tests from cache ( localStorage ). This method does not return anything

####exists:
This method is used to determine if a test has been cached. This returns a Boolean.

*   parameter { *string* } - key of the test to check if it has been cached

####keys:
This method returns a list of all available keys in the cache ( localStorage ). This returns an Array.

###Override Results
One of the core features of featurama.js is the ability to override any given test, regardless of the outcome. This is done so by setting up the config. A RegEx is tested against the userAgent, and should a match be found, the required result is returned. This is useful in certain situations where a certain device does not cope with the require featurset, yet it passes all the tests. Allowing the developer to *"force"* the fallback to be used. 

The key that is used for a test, will become the property name in the config. The regex property can be either a regex or an array of regex should more than one be required.

*Example:*

```
    window.featurama.config.audio = { regex : '/(aA-zZ)/i' , result : false };
```

###Access results
All results are stored in the global namespace under the given key for a test. Once a test has been run, this result is then set and stored for later use. This allows tests to be run once and used multiple times.

*Example*

```
    window.featurama.results.audio; // false
```

For more detailed examples, i would suggest reviewing the unit tests as these test all the various methods and use cases. Alternativly, review featurama.js, the "API" is commented for each method with the available properties, expectations and output. 

## Example Tests
_View the unit tests for further examples_

## Release History
v 0.8.0 - initial release. 28/06/2013
