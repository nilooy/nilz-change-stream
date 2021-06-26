# Meteor Change Stream | nilz:change-stream
> ## Not ready yet! :)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub](https://img.shields.io/github/license/Meteor-Community-Packages/meteor-collection2)

#### To use mongo change stream server to publish meteor data 

> #### Install instruction
```shell script
meteor add nilz:change-stream
```

> #### Usage instruction
```js
// simple usage to publish data with change stream without any query
// same as `SomeCollection.find() in meteor publish`
Meteor.publishChangeStream({
  name: 'get1',
  collection: House
})
```
For querying the data, here aggregation framework have been used
> For more details https://docs.mongodb.com/manual/changeStreams/#modify-change-stream-output
```js
// simple usage to publish data with change stream
Meteor.publishChangeStream({
  name: 'get1',
  collection: House,
  pipleline: [ // aggregation pipeline
        { $match: { 'fullDocument.username': 'alice' } }
  ]
})
```

# !important: add `fullDocument` before each fields in pipeline as example above

### Support only transformation, so no `$lookup` for now :(
```javascript
$addFields
$match
$project
$replaceRoot
$replaceWith (Available starting in MongoDB 4.2)
$redact
$set (Available starting in MongoDB 4.2)
$unset (Available starting in MongoDB 4.2)
```

> ### Performance
- Try to use less



> ### Need to implement:

- Resume a Change Stream | https://docs.mongodb.com/manual/changeStreams/#resume-a-change-stream
- Add tests.
- Option to rerun query on change stream event trigger. Might be able to implement rerun with proper aggregation pipeline

> ### Guides:
- https://severalnines.com/database-blog/real-time-data-streaming-mongodb-change-streams
- https://docs.mongodb.com/manual/changeStreams/#change-streams
- https://developer.mongodb.com/quickstart/nodejs-change-streams-triggers
