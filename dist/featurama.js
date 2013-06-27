/*! featurama.js - v0.0.8 - 2013-06-27
* https://github.com/nicdacosta/featurama.js
* Copyright (c) 2013 Nic da Costa; Licensed MIT */
window.featurama = ( function( window , document , undefined ) {

	'use strict';

	var head = document.head || document.getElementsByTagName('head')[0],
		storagePrefix = 'featurama-',
		RSVP = window.RSVP;

	/* Private Method getURL
	** parameter { string } - URL of required dependancy
	** about - used to get content of an external dependancy. Returns a promise so that we can detect when load has been completed along with status
	**/
	var getURL = function( url ) {

		var promise = new RSVP.Promise( function( resolve , reject ) {

				var xhr = new XMLHttpRequest();

				xhr.open( 'GET' , url );

				xhr.onreadystatechange = function() {

					if ( xhr.readyState === 4 ) {

						if ( xhr.status === 200 ) {

							// request was successful , resolve promise and return text
							return resolve( xhr.responseText );

						} else {

							// request failed , reject promise and return status text as new Error()
							return reject( new Error( xhr.statusText ) );

						}

					}

				};

			});

		return promise;

	};

	/* Private Method injectScript
	** parameter { string } - source/content of script that needs to be injected
	** about - used to insert content of an external dependancy into a script tag and append script to the head.
	**/
	var injectScript = function( source ) {

		var script = document.createElement('script');
		script.defer = true;
		// Have to use .text, since we support Android,
		// Need to look into append or textContent
		script.text = source;
		head.appendChild( script );

	};

	/* Private Method addToLocalStorage
	** parameter { string } - key of the test that needs to be cached
	** parameter { object } - the test object that needs to be stored in localStorage
	** about - used to add a test case to localStorage. This is then used for re-running the test so user does not need to recreate the test.
	**/
	var addToLocalStorage = function( key , storeObj ) {

		key = key || 'key';

		//var cachedFunction = storeObj.custom.toString();

		var cachedObj = extendObject ( {} , storeObj ),
			customType = typeof cachedObj.custom;

		cachedObj.custom = ( customType === 'function' ) ? '(' + cachedObj.custom.toString() + ')' : ( Array.isArray( cachedObj.custom ) ) ? '[' + cachedObj.custom.toString() + ']' : cachedObj.custom;

		//hello.custom = cachedFunction; = need to clone object

		// TODO: Add handler to try add to localstorage and catch exception. Exception could be added if quote is full ( exceeded 5mb limit ) or if localstorage is read only.
		// add a prefix to the keys so not to be overridden should localstorage be used elsewhere. storagePrefix is defined at the top of the IIFE.
		window.localStorage.setItem( storagePrefix + key , JSON.stringify( cachedObj ) );

	};

	/* Private Method getFromLocalStorage
	** parameter { string } - key of the test that needs to be fetched form cache / localStorage
	** about - used to fetch any given test from storage. If no test is found, returns false
	**/
	var getFromLocalStorage = function( key ) {

		key = key || 'key';

		var obj;

		try	{

			var item = window.localStorage.getItem( storagePrefix + key );

			obj = JSON.parse( item || 'false' );

			obj.custom = ( obj.custom ) ? eval( obj.custom ) : obj.custom;

		} catch( e ) {

			obj = false;

		}

			return obj;

	};

	/* Private Method removeFromLocalStorage
	** parameter { string } - key of the test that needs to be removed from cache / localStorage.
	** about - used to remove a test from cache.
	**/
	var removeFromLocalStorage = function( key ) {

		key = key || 'key';

		// remove given test from storage based on key
		window.localStorage.removeItem( storagePrefix + key );

	};

	/* Private Method getAllFromLocalStorage
	** about - used to get all test keys from localStorage
	** Not sure if necessary. Included just in case
	**/
	var getAllFromLocalStorage = function() {

		var item,
			key,
			localStorage = window.localStorage,
			results = [];

		for( item in localStorage ) {

			key = item.split( storagePrefix )[ 1 ];

			if ( key ) {

				results.push( key );

			}

		}

		return results;
	};

	/* Private Method needsUpdate
	** parameter { object } - object test to be run and added to cached / localStorage 
	** about - used to determine if there is a cached version for a given key and if the version of the cached version differs from that of the test to be added. Returns Boolean
	**/
	var needsUpdate = function( obj ) {

		var key = obj.key || 'key' ,
			version = obj.version || 0 ,
			item = getFromLocalStorage( key ),
			result = true;

			if ( item ) {

				result = ( version !== item.version ) ? true : false ;

			}

			return result;

	};

	var extendObject = function( objToExtend , objToInherit , overrite ) {

		objToExtend = ( typeof objToExtend === 'object') ? objToExtend : {};
		objToInherit = ( typeof objToInherit === 'object') ? objToInherit : {};
		overrite = ( typeof overrite === 'boolean') ? overrite : true;
		
		var keys = Object.getOwnPropertyNames( objToInherit );

		keys.forEach( function( currentKey ) {

			currentKey = currentKey;

			if( currentKey && objToInherit.hasOwnProperty( currentKey ) && typeof objToInherit[ currentKey ] !== 'undefined' ) {

				if( typeof objToExtend[ currentKey ] === 'undefined' || overrite ) {

					objToExtend[ currentKey ] = objToInherit[ currentKey ];

				}

			}

		} );

		return objToExtend;

	};

	/* Private Method getConfigResult
	** parameter { string } - key for test that is used to check the config for an override
	** about - used to check the config ( featurama.config ) object to see if the given test has any overrides.
	**/
	var getConfigResult = function( key ) {

		key = key || 'key';

		var	featuramaConfig = _featurama.config,
			featuramaProperty,
			result;

		// check config file to see if there is an override, if so use override
		if ( typeof featuramaConfig !== 'undefined' ) {

			if ( featuramaConfig.hasOwnProperty( key ) && typeof featuramaConfig[ key ] !== 'undefined' ) {

					// cache the property for the given key
					featuramaProperty = featuramaConfig[ key ];

					// override result with matching regex result defined in config. Chrecks if is RegEx, if so eval against userAgent else check if array and loop through each
					if ( featuramaProperty.regex instanceof RegExp ) {

						// set lastIndex = 0, this starts the regex.test to check from the beginning of the string. This is incase the regex has the global flagged as true.
						// http://blog.thatscaptaintoyou.com/strange-behavior-of-the-global-regex-flag/ for more info
						featuramaProperty.regex.lastIndex = 0;

						result = ( featuramaProperty.regex.test( window.navigator.userAgent ) ) ? featuramaProperty.result : undefined;

					} else if ( featuramaProperty.regex instanceof Array ) {

						// is Array, loop through each instance in array and check if is a RegEx, if so, test against UserAgent and set result based on override
						featuramaProperty.regex.forEach( function( currentRegEx ) {

							if ( currentRegEx instanceof RegExp ) {

								// set lastIndex = 0, this starts the regex.test to check from the beginning of the string. This is incase the regex has the global flagged as true.
								// http://blog.thatscaptaintoyou.com/strange-behavior-of-the-global-regex-flag/ for more info
								currentRegEx.lastIndex = 0;
								// checks if current instance in Array is Regex, if so test against
								result = ( featuramaProperty.regex.test( window.navigator.userAgent ) ) ? featuramaProperty.result : undefined;

							}

						} );

					}

			}

		}

		return result;

	};

	/* Private Method removeConfigResult
	** parameter { string } - key of the property that is to be removed.
	** about - used to remove a given key from the config object.
	** Not sure if necessary. Included just in case
	**/
	var removeConfigResult = function( key ) {

		key = key || 'key';

		var featuramaConfig = _featurama.config || {};

		if ( featuramaConfig.hasOwnProperty( key ) ) {

			featuramaConfig[ key ] = undefined;

		}

	};

	/* Private Method removeResult
	** parameter { string } - key of the property that is to be removed.
	** about - used to remove a given key with the results from the results object.
	** Not sure if necessary. Included just in case
	**/
	var removeResult = function( key ) {

		key = key || 'key';

		var featuramaResults = _featurama.results || {};

		if ( featuramaResults.hasOwnProperty( key ) ) {

			featuramaResults[ key ] = undefined;

		}

	};

	/* Private Method getProperty
	** parameter { string } - the name of the property that is requied
	** about - used to obtain the value of a property of Modernizr. It checks if modernizr is defined, if not, it fetches it and then runs through getProperty again to return the correct result
	** TODO: allow custom dependancies sot hat you can specify which object you want the property from. Setup a default fetch URL for given dependancy
	**/
	var getProperty = function( propertyName ) {

		propertyName = propertyName || '';

		var promise = new RSVP.Promise( function( resolve ) {

			if ( typeof window.Modernizr !== 'undefined' ) {

				// check if property exists and return result
				resolve( ( window.Modernizr.hasOwnProperty( propertyName ) ) ? window.Modernizr[ propertyName ] : false );

			} else {
				// get the required URL of library / dependancy
				resolve( getURL( '' ).then( function( source ) {
					// injcet dependancy into head and recall getProperty to get the required property value. Return the resultant promise
					injectScript( source );

					return getProperty( propertyName );

				}));

			}


		});

		return promise;

	};

	/* Private Method handleTests
	** parameter { object } - the object of the test to run.
	**						Can have multiple properties, each one will be an object of a test to run.
	** about - this is the main entry point for tests. Acts as a feeder function for runTest. Itterates through all tests. Checks if test key has already been run, 
	**			if so creates a new promise and resolves this with the cached value for the test, else runs the test. Should the test need to be re-run for a new output, use rerun method. 
	**			Should a new test be required for the given key, use te removeItem method to clear the test and then run the test with the new test object.
	**/
	var handleTests = function() {

		var key,
			promises = [],
			i = 0,
			argsLength = arguments.length,
			results = _featurama.results;

			for ( ; i < argsLength ; i++) {

				// cache key for current Test
				key = arguments[ i ].key || 'key';

				// check if key already exists on result object and value is not undefined. If so, create Promise and resolve with cached value. Else run test for current test object
				promises.push( ( results.hasOwnProperty( key ) && typeof results[ key ] !== 'undefined' ) ? new RSVP.Promise( function( resolve ){ resolve( results[ key ] ); } ) : runTest( arguments[ i ] ) );

			}

		return RSVP.all( promises );

	};

	/* Private Method runTest
	** parameter { object } - the object of the test to run
	**		parameter.prop: Modernizr { array } - An array of strings of Modernizr property names ( eg: [ 'csstransform' , 'webworkers' ] )
	**		parameter.prop: custom { function / array } -	This can be either a function or an array of functions. This is for custom tests that need to be runned. 
	**														These functions should either return a boolean of the result or else a promise that will be resolved with either true or false depending on the outcome of the test.
	**		parameter.prop: key { string } - A string of the key that will be used in the results object to identify the current test
	**		parameter.prop: keepExisting { boolean } - A boolean on whether to overwrite the result should one already exist
	**		parameter.prop: cacheTest { boolean } - A boolean on whether to cache the test to localStorage. This is used in the rerun method.
	**		parameter.prop: version { int } - A int to determine the current version of the test object. This is used for caching purposes ( needsUpdate method )
	** about - this is the main method that runs the tests. It builds an array of promises and results that is returned by the various methods and then sets the results once all the promises have been resolved
	**			this recieves the test object from the feeder function ( handleTests )
	**/
	var runTest = function( obj ) {

		// setup necessary varibales and cahe properties from obj. Check if obj.property exists, if not, setup default value. TODO: refactor!!! 50% of this method can be stripped into one seperate method.
		var ModernizrDependencies = obj.Modernizr || [],
			additionalTest = obj.custom || [],
			additionalTestType = typeof additionalTest,
			key = obj.key || ModernizrDependencies[0] || 'key',
			keepExisting = ( typeof obj.keepExisting !== 'undefined' ) ? obj.keepExisting : true,
			cacheTest = ( typeof obj.cacheTest !== 'undefined' ) ? obj.cacheTest : true,
			result = getConfigResult( key ), // check the config based on key, check of there is an override
			promises = [],
			results = [],
			returned;

		// check if test needs to be cached, if so, cache current test to localStorage for later use ( rerun method as run still runs the object that is passed through ).
		if ( cacheTest && needsUpdate( obj ) ) {

			addToLocalStorage( key , obj );

		}

		// checks result from conifig, if undefined, run tests else return config result and prevent tests from being run
		if ( typeof result !== 'undefined' ) {

			// push config result to results array to then be passed to setResults method
			results.push( result );

		} else {

			// Loop through all Modernizr properties and get their value. Returns as a promise that gets added to promises array in order to use RSVP.all()
			ModernizrDependencies.forEach( function( propertyName ) {

				// build result
				promises.push( getProperty( propertyName ) );

			} );

			/* checks if the additional test in obj.custom is a function, if is then execute and set result. 
			** If not, loop through array ( at the moment it trusts that the additional test is an array, should build in a check to prevent  errors ) and check if is fuinction, if so, execute 
			** TODO: refactor function check, running and result checking as is currently being duplicated. 
			*/
			if ( additionalTestType === 'function' ) {

				result = additionalTest();

				// check if result is a promise, if so, add to promises array else add to results array. Uses hasOwnProperty to ensure that isn't a random object but instead is a promise
				if ( typeof result === 'object' && result.hasOwnProperty( '_promiseCallbacks' ) ) {

					promises.push( result );

				} else {

					results.push( result );

				}

			} else {

				// loop through array and check if current instance in array is a function. If so execute and assign to result, then handle accordingly
				additionalTest.forEach( function( currentTest ) {

					if ( typeof currentTest === 'function' ) {

						result = currentTest();

						// check if result is a promise, if so, add to promises array else add result to results Array
						if ( typeof result === 'object' && result.hasOwnProperty( '_promiseCallbacks' ) ) {

							promises.push( result );

						} else {

							results.push( result );

						}

					}

				} );

			}

		}

		// checks if there are promises, if all tests resulted in values, then return setResults. Current method feels dirty, will need to refactor this to return correct instance
		if ( promises.length ) {

			returned = RSVP.all( promises ).then( function( promiseResults ) {
						// concat results and promise results into one array that is passed through for ease of reference
						results = results.concat( promiseResults );

						return setResults( { key: key , results: results , keepExisting: keepExisting } );

					} );

		} else {

			returned = setResults( { key: key , results: results , keepExisting: keepExisting } );

		}

		return returned;

	};

	/* Private Method rerunTest
	** parameter { string } - the key of the test to run
	** about - this is the method that is used to rerun a given test based on the key. It expects the given key of the test to be cached in localStorage. The test is obtained, then rerun and overrides existing results.
	**			this ise useful should a given test fail then a shim is loaded, allowing the developer to rerun any given test. Should the key for the test not exist in localStorage, a new promise is created and rejected with an Error
	**			stating that the key does not Exist.
	**/
	var rerunTest = function( key ) {

		var objToRun,
			promise;

		key	= ( typeof key !== 'undefined' ) ? key : 'key' ;

		objToRun = getFromLocalStorage( key );

		// reliant on truthy where an object is considered true as if getFromLocalStorage failed, retuns false. If true, change some properties and run test
		if ( objToRun ) {

			// set to not cache test as test already exists as well as to overwrite the results
			objToRun.cacheTest = false;
			objToRun.keepExisting = false;

			promise = runTest.call( null , objToRun );

		} else {

			// test doesn't exist, create a new promise and reject, throw an error stating the test does not exist in storage.
			promise = new RSVP.Promise( function( resolve , reject ) {

				reject( new Error( 'Test Does Not Exist' ) );

			} );

		}

		return promise;

	};

	/* Private Method runTest
	** parameter { object } - the object of the results to set the necessary property in global results object
	**		parameter.prop: key { string } - A string of the key that will be used in the results object to identify the current test
	**		parameter.prop: results { array } - An array of all the results that need to be assigned
	**		parameter.prop: keepExisting { boolean } - A boolean on whether to overwrite the result should one already exist
	** about - this is the main method that updates the results object with the test results. Iterates through all results and concatenates. Checks if property must be overwritten. If so, overwrites else keeps existing result
	**/
	var setResults = function( obj ) {

		var	featuramaResults = _featurama.results,
			key = obj.key || 'key',
			keepExisting = obj.keepExisting,
			results = obj.results || [],
			result = true,
			promise;

			promise = new RSVP.Promise( function( resolve , reject ) {

				results.forEach( function( currentResult) {
					// loop through results and set result = outcome of currentResult ( current itteration in array ) && the existing combined result
					result = ( result && currentResult );

				} );

				// check if gloabl result Object already exists
				if ( typeof featuramaResults !== 'object' ) {

					featuramaResults = {};

				}

				// set the value for the given key. Checks if key already exists and if the value is not undefined as well as if keepExisting is true. This is useful for rerun
				featuramaResults[ key ] = ( featuramaResults.hasOwnProperty( key ) && typeof featuramaResults[ key ] !== 'undefined' && keepExisting ) ? featuramaResults[ key ] : result ;

				// thought: Return an object as opposed to the result. The object would contain the key and the result so at any time you can check what the result is for any given key
				resolve( featuramaResults[ key ] );

			});

		return promise;

	};

	// all external methods should return a promise. so when tests run, allows for .then() etc
	var _featurama = {

		/* Public Method run
		** parameter { object } - the object of the results to set the necessary property in global results object
		**		parameter.prop: Modernizr { array } - An array of strings of Modernizr property names ( eg: [ 'csstransform' , 'webworkers' ] )
		**		parameter.prop: custom { function / array } -	This can be either a function or an array of functions. This is for custom tests that need to be runned. 
		**														These functions should either return a boolean of the result or else a promise that will be resolved with either true or false depending on the outcome of the test.
		**		parameter.prop: key { string } - A string of the key that will be used in the results object to identify the current test
		**		parameter.prop: keepExisting { boolean } - A boolean on whether to overwrite the result should one already exist
		**		parameter.prop: cacheTest { boolean } - A boolean on whether to cache the test in localStorage
		** about - this is the main externally facing method which allows to add various tests and returns a Promise
		** TODO: Handle RSVP.reject. Refactor private method. Handle Versioning of tests for localStorage interface. Allow to pass in an array of objects
		**/
		run: function() {
			// adds a specified test to the featurama ( test suite )
			var promise;

			try{

				// usses apply to pass through arguments and handle. "binds" null as in in strict mode, thus "this" is not propogated to window object ( prevents another global instance being declared )
				promise = handleTests.apply( null , arguments );

			} catch( err ) {

				//window.caughtError = err;

			}

			return promise;

		},

		/* Public Method rerun
		** parameter { string } - key of the test to be re-run
		** about - this allows to rerun an existing test without having to recreate the test object / conditions and returns a Promise
		**/
		rerun: function( key ) {

			// reruns a specified test again based on the test key
			var promise = rerunTest( key );

			return promise;
		},


		/* Public Method remove
		** parameter { string } - key of the test to be removed from cache / localStorage
		** about - this removes a given test, based on the given key to be removed from cache as well as clear results and config for given test.
		**/
		remove: function( key ) {

			// clears any given test results of tests and test from cache
			removeFromLocalStorage( key );
			// remove given test result
			removeResult( key );
			// remove given test from config
			removeConfigResult( key );

		},

		/* Public Method clear
		** about - this removes all tests in cache, as well as clears / resets the results and config objects.
		**/
		clear: function() {

			// gets all test from localStorage
			var results = getAllFromLocalStorage();

			// loops through all keys and removes each one
			results.forEach( function( key ) {

				removeFromLocalStorage( key );

			} );

			// reset config and results objects
			_featurama.results = {};
			_featurama.config = {};

		},

		/* Public Method exists
		** parameter { string } - key of the test to check in the cache / localStorage
		** about - this checks if the given test exists in cache / localStorage based on the key and returns a Boolean
		**/
		exists: function( key ) {

			return ( getFromLocalStorage( key ) ) ? true : false ;

		},

		/* Public Method keys
		** about - this returns an Array of all keys currently cached / in localStorage
		**/
		keys: function() {

			return getAllFromLocalStorage();

		},

		results: {},

		config: {}

	};

	return _featurama;

} )( window , document );
