import {Mongo} from "meteor/mongo";
import {check, Match} from "meteor/check";

/******
* TODO:
 * 1. Need to implement changes stream resume feature, Follow https://docs.mongodb.com/manual/changeStreams/#resumeafter-for-change-streams
 * 2. Check the possible cases where the connection should be closed
 * 3. Add validation to check the pipeline array
 * 4. Add integration test
 * 5. Add validation middleware
* ****/

const ACTIONS = {
  INSERT: 'insert', // Covered
  DELETE: 'delete', // Covered
  REPLACE: 'replace', // TODO
  UPDATE: 'update', // Covered
  DROP: 'drop', // TODO
  RENAME: 'rename', // TODO
  DROPDATABASE: 'dropDatabase', // TODO
  INVALIDATE: 'invalidate', // TODO
}

/**
 * Open a mongo change stream and publish via meteor publish, mongo aggregation framework should be used here
 * while writing query, before each field name, need to include 'fullDocument' eg: { $match: { 'fullDocument.username': 'alice' } }
 * @param {String} name - The name of the the publish
 * @param {Object} collection - The mongo collection object
 * @param {Array} pipleline - The aggregation query/pipleline array object
 * @param {Function} run - The function that returns the aggregation query array of object (** if query param is not passed)
 * @param {String} minimongoName - The name of the collection used for minimongo, can be changed by passing a different name
 */

export const publishChangeStream = ({ name, collection, run, pipleline = [], minimongoName, options = {} }) => {
  // Params Validation starts =======>
  if (!name || !collection)
    throw new Meteor.Error(
      "publish-change-stream",
      `${name ? 'name' : 'collection'}  are missing`
    );

  import { check, Match } from 'meteor/check';
  import { Mongo } from "meteor/mongo";

  check(name, String);

  // Check if the object is a valid mongo collection
  if(!collection instanceof Mongo.Collection)
    throw new Meteor.Error(
        "publish-change-stream",
        `collection is not a valid mongo collection`
    );

  Match.Optional(run, Function)
  Match.Optional(pipleline, Array)
  Match.Optional(minimongoName, String)
  Match.Optional(options, Object)

  // Params Validation ends =======>

  const {log} = options
  Match.Optional(log, Boolean)

  // eslint-disable-next-line no-console
  const logHere = (title, content) => log && console.log({
    title: `@=> ${title} =>`,
    content
  })

  const getIdInString = (id) =>
     typeof id === 'string' ? id : id.toString();

  import stream from "stream"

  return Meteor.publish(name, function (args) {
    const sub = this;

    // Get the raw collection object from meteor mongo
    const rawCollection = collection.rawCollection();

    // if pipeline is not passed, only then it will use run method, that should return the query
    const aggregateQuery = pipleline?.length ? pipleline : run?.(args, rawCollection, sub) || [];
    logHere('Pipeline', aggregateQuery)

    // Minimongo Collection name can be different than the one declared in api, the custom name can be passed via { minimongoName: String }
    const collectionName = minimongoName || collection._name

    // Do initial query and return the data to client and start processing the event after that
    rawCollection.aggregate(aggregateQuery).toArray((err, data) => {
      if (err) {
        changeStream.close();
        throw new Meteor.Error("mongo-aggregate-error", err);
      } // In case of any error in query, need to stop execution here.

      if (data?.length) // Push all the initial data to sub
        data.forEach((item, index) => {
          const docId = getIdInString(item._id)
          sub.added(collectionName, docId, item);

          if(index === (data.length -1)){
            // Start watching the data with the pipeline
            const changeStream = rawCollection.watch(aggregateQuery, { fullDocument: 'updateLookup' });

            sub.ready();
            // open the change stream pipe with node stream api
            changeStream.stream().pipe(
                new stream.Writable({
                  objectMode: true,
                  write: function (doc, _, cb) {
                    logHere(`change stream: ${collection._name}`,doc)
                    // for the external data conatining id in objectId format
                    const docId = getIdInString(doc?.documentKey?._id)

                    switch (doc?.operationType) {
                      case ACTIONS.INSERT: // Add the document to the list
                        sub.added(collectionName, docId, doc.fullDocument);
                        break;
                      case ACTIONS.UPDATE: // Update the document by id
                        sub.changed(collectionName, docId, doc.fullDocument);
                        break;
                      case ACTIONS.DELETE: // Remove the document from list
                        sub.removed(collectionName, docId)
                        break;

                      default: cb();
                    }
                    cb();
                  },
                })
            );

            sub.onStop(() => {
              // TODO: Need to check possible cases, where we might need to close the connection earlier.
              logHere(`change stream stopped for pub: ${name}`)
              changeStream.close(); // close the connection when publishing is done
            });
          }
        });
    });



  });
};



// backwards compatibility
Meteor.publishChangeStream = publishChangeStream;
