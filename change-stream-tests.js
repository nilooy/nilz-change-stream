// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by change-stream.js.
import { name as packageName } from "meteor/nilz:change-stream";

// Write your tests here!
// Here is an example.
Tinytest.add('change-stream - example', function (test) {
  test.equal(packageName, "change-stream");
});
