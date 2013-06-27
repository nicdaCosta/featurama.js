describe( "featurama" , function() {

  'use strict';

  // declare necessary variables used as tests for featurama
  var testLocalStorage,
      testTouch,
      testAudio,
      testOverride,
      noTestsSpecified;

  // necessary setup to be run prior to every test. Creates various tests that will be run and config
  beforeEach( function() {

    testLocalStorage = {
                  key: 'localstorage',
                  Modernizr: [ 'localstorage' ]
                };

    testTouch = {
                  key: 'touch',
                  Modernizr: [ 'touch' ],
                  custom : function() {
                      return false;
                  }
                };

    testAudio = {
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
                            ** Not sure how testSuite will handle rejected promise. Would need to cater for rejects in RSVP.all().then
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
                            audio.src = 'spec/dependencies/AudioTest.mp3';

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

    testOverride = {
                key : 'override'
              };

    noTestsSpecified = {
                key : 'hasNoTests'
              };

    // setup config for the overide test to ensure that the result is updated accordingly
    window.featurama.config = { override: { regex: /([aA-zZ])/i , result: false } };

  } );

  // necessary tear down after each test
  afterEach( function() {

    // clear all tests, config and results in order to test again
    window.featurama.clear();

  } );

  // setup test grouping for "run" method
  describe( 'run' , function() {

    // this is to test the default behaviour of featurama. Run a test pulling from a result Modernizr then update featurama.results
    it( "Straight Forward Test [ localStorage ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.localstorage ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testLocalStorage ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect result from localStorage test to yield a Boolean result. Result is dependant on device
      expect( typeof window.featurama.results.localstorage ).toEqual( 'boolean' );

     } );

    } ); // ends Test "Straight Forward Test [ localStorage ]"

    // this is to test thet custom function is called and the correct result is returned
    it( "Custom Function [ touch ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.touch ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testTouch ).then( function(){

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect result from the touch test to be false due to custom function returning false.
      expect( window.featurama.results.touch ).toEqual( false );

     } );

    } ); // ends Test "Custom Function [ touch ]"

    // this test is to ensure that custom function can be an async function which returns a promise.
    it( "Custom Function Async [ audio ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running
      expect( window.featurama.results.audio ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testAudio ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect result to be of type boolean indicating the test has completed as expected. The result is dependent per device
      expect( typeof window.featurama.results.audio ).toEqual('boolean');

     } );

    } ); // ends Test "Custom Function Async [ audio ]"

    // this test is to ensure that a test is cached to localStorage after running
    it( "Cached Test [ localStorage ]" , function() {

      // used to handle async call
      var hasRun = false;

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testLocalStorage ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect that the locaStorage test has been cached in localStorage
      expect( window.localStorage[ 'featurama-localstorage' ] ).not.toBeUndefined();

     } );

    } ); // ends Test "Cached Test [ localStorage ]"

    // this test is used to determine that a resutl can be overwritten with the config
    it( "Override Result" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running
      expect( window.featurama.results.override ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testOverride ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect the result to be false as no tests were passed in, thus resulting in true. Config will overwrite this and use determined result.
      expect( window.featurama.results.override ).toEqual( false );

     } ); // end runs

    } ); // ends Test "Override Result"

    // this is to test that should an object with no properties other than a key be passed in that there isn't an error
    it( "Has No Tests - Key only" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running
      expect( window.featurama.results.noTestsSpecified ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( noTestsSpecified ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect the result of the test to be true as no test properties were set
      expect( window.featurama.results.hasNoTests ).toEqual( true );

     } ); // end runs

    } ); // ends Test "Has No Tests - Key only"

    // this is to test if an empty Object is passed through that no errors occur
    it( "Empty Object" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running
      expect( window.featurama.results.key ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( {} ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect the key to be "key" and the result to be true
      expect( window.featurama.results.key ).toEqual( true );

     } );

    } ); // ends Test "Has No Tests - Key only"

    // this is to ensure that if anything other than an Object is passed through, that there are no errors
    it( "Use An Array As Opposed To An Object" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.key ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( [ ' featurama' ] ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect result to be true as no object was passed through, thus key is set to "key" and result true
      expect( window.featurama.results.key ).toEqual( true );

     } );

    }); // ends Test "Use An Array As Opposed To An Object"

    // this is to test running multiple tests in one call. That each test is then individually run
    it( "Run Multiple Tests With One Call [ localStorage , touch , audio , override ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.localstorage ).toBeUndefined();
      expect( window.featurama.results.touch ).toBeUndefined();
      expect( window.featurama.results.audio ).toBeUndefined();
      expect( window.featurama.results.override ).toBeUndefined();

      runs( function() {

        // run tests. on completion, update hasRun to indicate async tests have finished
        window.featurama.run( testLocalStorage , testTouch , testAudio , testOverride ).then( function() {

                    hasRun = true;

                  } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

     runs( function() {

      // expect that each result is of type Boolean except for those that can be determine ( such as touch, due to custom function and the override )
      expect( typeof window.featurama.results.localstorage ).toEqual( 'boolean' );
      expect( typeof window.featurama.results.audio ).toEqual( 'boolean' );

      expect( window.featurama.results.touch ).toEqual( false );
      expect( window.featurama.results.override ).toEqual( false );

     } );

    }); // ends Test "Run Multiple Tests With One Call [ localStorage , touch , audio , override ]"

  } ); // ends Section "run"

  // setup test grouping for "rerun" method
  describe( "rerun" , function() {

    // this is to test the re-running of a test and compare the results
    it( "ReRun Existig Test [ touch ]" , function() {

      // used to handle async calls and comparing of results
      var hasRun = false,
          hasRunAgain = false,
          cachedResult;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.touch ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished and cache the result
        window.featurama.run( testTouch ).then( function( result ) {

          // set cachedResult = first result
          cachedResult = result[ 0 ];
          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // expect the cahced touch result to be false ( due to custom function returning false )
        expect( cachedResult ).toEqual( false );

        // rerun the test passing through "touch" as the key. Then set hasRunAgain = true to indicate async test has completed
        window.featurama.rerun( 'touch' ).then( function() {

          hasRunAgain = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRunAgain;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // expect the result of the rerun to equal the cached result
        expect( window.featurama.results.touch ).toEqual( cachedResult );

      } );


    }); // ends Test "ReRun Existig Test [ touch ]"

    // this is to test the re-running of a test after a change that could impact the result has been made
    it( "ReRun Existig Test With Change [ override ]" , function() {

      // used to handle async call
      var hasRun = false,
          hasRunAgain = false,
          cachedResult;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.override ).toBeUndefined();

      runs( function() {

        // run the test. on completion update hasRun to indicate async test has finished and cache result
        window.featurama.run( testOverride ).then( function( result ) {

          // set cachedResult = first result
          cachedResult = result[ 0 ];
          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // expect the cahced result to equal false and that the cached result is equal to the value in the results object, due to config
        expect( window.featurama.results.override ).toEqual( cachedResult );
        expect( cachedResult ).toEqual( false );

        // update config to ensure test result is true, then rerun test
        window.featurama.config.override.result = true;

        // rerun test, passing through necessary key. Then update hasRunAgain to indicate async test has finished
        window.featurama.rerun( 'override' ).then( function() {

          hasRunAgain = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRunAgain;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // expect result to be true ( due to updated config ) and that it does not match the previous result
        expect( window.featurama.results.override ).not.toEqual( cachedResult );
        expect( window.featurama.results.override ).toEqual( true );

      } );


    }); // end Test "ReRun Existig Test With Change [ override ]"

    // this is to test that the promise is rejected and an error created should a key not exist in cache
    it( "ReRun Non Existant Test" , function() {

      // used to handle async call
      var hasRun = false,
          cachedResult;

      runs( function() {

        // rerun a non existing test key. Update hasRun to indicate that the async test has finished. Cache the result of post successful and rejected promoise
        window.featurama.rerun( 'nonexistant' ).then( function( result ) {

          // this should not get hit. Setup incase is an error in logic and test thus fails
          cachedResult = result;
          hasRun = true;

        } , function( result ) {

          cachedResult = result;
          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );


      runs( function() {

        // expect the result to be of type Error. This is due to the key not existing in the cache, thus an Error is created.
        expect( cachedResult ).toEqual( jasmine.any( Error ) );

      });

    }); // end Test "ReRun Non Existant Test"

    // this is to test if an Object is passed through to the rerun method as opposed to a valid key ( String )
    it( "Use An Object As Opposed To String" , function() {

      // used to handle async call
      var hasRun = false,
          cachedResult;

      runs( function() {

        // rerun a test but passing an Object as opposed to a valid key. The update hasRun to indicate async test has completed.
        window.featurama.rerun( { featurama : [] } ).then( function( result ) {

            // this should not get hit. Setup incase is an error in logic and test thus fails
            cachedResult = result;
            hasRun = true;

          } , function( result ) {

            cachedResult = result;
            hasRun = true;

          } );


      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );


      runs( function() {

        // expect the result to be of type Error. This is due to the key not existing in cache, thus an Error is created.
        expect( cachedResult ).toEqual( jasmine.any( Error ) );

      });

    }); // end Test "Use An Object As Opposed To String"

  }); // end Section "rerun"

  // setup test grouping for "remove" method
  describe( "remove" , function() {

    // this is to test the removing of a given test and it's results
    it( "Remove Existig Test [ localStorage ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.localstorage ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished and the config for the given test to ensure the config is not undefined
        window.featurama.run( testLocalStorage , testTouch ).then( function() {

          window.featurama.config.localstorage = {};
          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // expect the results of the tests to be successful that a boolean value has been set, that the config is not undefined and the test has been cached.
        expect( typeof window.featurama.results.localstorage ).toEqual( 'boolean' );
        expect( window.featurama.config.localstorage ).toEqual( jasmine.any( Object ) );
        expect( window.localStorage[ 'featurama-localstorage' ] ).toEqual( jasmine.any( String ) );

        // expect that touch has run successfully and resulted in false, as well as that the cache has tested
        expect( window.featurama.results.touch ).toEqual( false );
        expect( window.localStorage[ 'featurama-touch' ] ).toEqual( jasmine.any( String ) );

        // run the remove test. Thus removing all instances of a given key
        window.featurama.remove( 'localstorage' );

        // expect that all instances of the given key has been removed. The result, cache and config are all undefined
        expect( window.featurama.results.localstorage ).toBeUndefined();
        expect( window.featurama.config.localstorage ).toBeUndefined();
        expect( window.localStorage[ 'featurama-localstorage' ] ).toBeUndefined();

        // expect that touch results and values are still existant after localStorage tests have been removed
        expect( window.featurama.results.touch ).toEqual( false );
        expect( window.localStorage[ 'featurama-touch' ] ).toEqual( jasmine.any( String ) );

      } );

    } ); // end Test "Remove Existig Test [ localStorage ]"

    // this is to test that removing a test that doesn't exist doesn't throw any errors and does not remove any existing results
    it( "Remove Non Existig Test" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.localstorage ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testLocalStorage ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // remove a non existant test based on a fictitious key
        window.featurama.remove( 'noneExistant' );

        // expect all the existing localStorage results and values to not be effected
        expect( typeof window.featurama.results.localstorage ).toEqual( 'boolean' );
        expect( window.localStorage[ 'featurama-localstorage' ] ).toEqual( jasmine.any( String ) );

        // expect all the existing config results for override not to be effected
        expect( window.featurama.config.override ).toEqual( jasmine.any( Object ) );
        expect( window.featurama.config.override.regex ).not.toBeUndefined();

      } );

    } ); // end Test "Remove Non Existig Test"

  } ); // end Section "remove"

  // setup test grouping for "clear" method
  describe( "clear" , function() {

    // this is to test that all tests' properties and results are cleared
    it( "Clear All Tests" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.localstorage ).toBeUndefined();
      expect( window.featurama.results.touch ).toBeUndefined();
      expect( window.featurama.results.audio ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished and update the config for necessary tests to ensure it is not undefined
        window.featurama.run( testLocalStorage , testTouch , testOverride ).then( function() {

          window.featurama.config.localstorage = {};
          window.featurama.config.touch = {};
          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // expect all the results for the tests to be correct and for tests to be cached
        expect( typeof window.featurama.results.localstorage ).toEqual( 'boolean' );
        expect( window.featurama.config.localstorage ).toEqual( jasmine.any( Object ) );
        expect( window.localStorage[ 'featurama-localstorage' ] ).toEqual( jasmine.any( String ) );

        expect( window.featurama.results.touch ).toEqual( false );
        expect( window.featurama.config.touch ).toEqual( jasmine.any( Object ) );
        expect( window.localStorage[ 'featurama-touch' ] ).toEqual( jasmine.any( String ) );

        expect( window.featurama.results.override ).toEqual( false );
        expect( window.featurama.config.override ).toEqual( jasmine.any( Object ) );
        expect( window.featurama.config.override.regex ).not.toBeUndefined();
        expect( window.localStorage[ 'featurama-override' ] ).toEqual( jasmine.any( String ) );

        // run clear to remove all tests and results
        window.featurama.clear();

        // check all test results and cache to ensure that all tests have been removed
        expect( window.featurama.results.localstorage ).toBeUndefined();
        expect( window.featurama.config.localstorage ).toBeUndefined();
        expect( window.localStorage[ 'featurama-localstorage' ] ).toBeUndefined();

        expect( window.featurama.results.touch ).toBeUndefined();
        expect( window.featurama.config.touch ).toBeUndefined();
        expect( window.localStorage[ 'featurama-touch' ] ).toBeUndefined();

        expect( window.featurama.results.override ).toBeUndefined();
        expect( window.featurama.config.override ).toBeUndefined();
        expect( window.localStorage[ 'featurama-override' ] ).toBeUndefined();

      } );

    } ); // end Test "Clear All Tests"

  } ); // end Section "clear"

  // setup test grouping for "exists" method
  describe( "exists" , function() {

    // this is to test if an existing test is cached and returns true
    it( "Check If Test Exists in localStorage [ localStorage ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect( window.featurama.results.localstorage ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-localstorage' ] ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testLocalStorage ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // ensure that the test has completed and that the necessary result has been set. As well as that exists returns true as has been cached
        expect( typeof window.featurama.results.localstorage ).toEqual( 'boolean' );
        expect( window.featurama.exists( 'localstorage' ) ).toEqual( true );

      } );

    } ); // end Test "Check If Test Exists in localStorage [ localStorage ]"

    // this is to test if a test that has not been cached is reflected as non existant
    it( "Check If Test Doesnt Exists in localStorage [ localStorage ]" , function() {

      // ensures that the results for the given test is undefined prior to running
      expect( window.featurama.results.localstorage ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-localstorage' ] ).toBeUndefined();

      // run test to ensure that test does not exist in cache
      expect( window.featurama.exists( 'localstorage' ) ).toEqual( false );

    } ); // end Test "Check If Test Doesnt Exists in localStorage [ localStorage ]"

  } ); // end Section "exists"

  // setup test grouping for "keys" method
  describe( "keys" , function() {

    // this is to test if a all cached keys are returned
    it( "Check If All Keys Are Returned From localStorage [ localStorage , touch , audio , override ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensures that the results for the given test is undefined prior to running 
      expect(  window.localStorage[ 'featurama-localstorage' ] ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-touch' ] ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-audio' ] ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-override' ] ).toBeUndefined();

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testLocalStorage , testTouch , testAudio , testOverride ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // get keys for all cached tests
        var keys = window.featurama.keys();

        // expect that an array has returned and that the array contains all 4 test keys
        expect( keys ).toEqual( jasmine.any( Array ) );
        expect( keys.length ).toEqual( 4 );

      } );

    } ); // end Test "Check If All Keys Are Returned From localStorage [ localStorage , touch , audio , override ]"

    // this is a test to ensure that only tests that are cached are returned
    it( "Check Only Cached Keys Are Returned From localStorage [ localStorage , touch ]" , function() {

      // used to handle async call
      var hasRun = false;

      // ensure that no tests have been cached prior to tests running
      expect(  window.localStorage[ 'featurama-localstorage' ] ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-touch' ] ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-audio' ] ).toBeUndefined();
      expect(  window.localStorage[ 'featurama-override' ] ).toBeUndefined();

      // prevent the following tests from Caching
      testAudio.cacheTest = false;
      testOverride.cacheTest = false;

      runs( function() {

        // run test. on completion, update hasRun to indicate async test has finished
        window.featurama.run( testLocalStorage , testTouch , testAudio , testOverride ).then( function() {

          hasRun = true;

        } );

      } );

      // setup the signal to indicate when the async test has completed.
      waitsFor( function() {

        return hasRun;

      } , 'featurama test should have completed to resolve promises' , 5000 );

      runs( function() {

        // get all keys of tests that have been cached
        var keys = window.featurama.keys();

        // expect that an array is returned and that only the two tests that have been cached are returned
        expect( keys ).toEqual( jasmine.any( Array ) );
        expect( keys.length ).toEqual( 2 );

      } );

    } ); // end Test "Check Only Cached Keys Are Returned From localStorage [ localStorage , touch ]"

    // this is to ensure that should there be no cached tests, that no keys are returned
    it( "Check No Keys Are Returned From localStorage" , function() {

      // get all keys of tests that have been cached
      var keys = window.featurama.keys();

      // expect an array to be returned and that no keys are present as there are currently no cached tests
      expect( keys ).toEqual( jasmine.any( Array ) );
      expect( keys.length ).toEqual( 0 );

    } ); // end Test "Check No Keys Are Returned From localStorage"

  } ); // end Section "exists"

} ); // end Section "featurama"