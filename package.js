Package.describe({
  name: 'nilz:change-stream',
  version: '0.0.1',
  summary: 'To use mongo change stream server to publish meteor data ',
  git: 'https://github.com/nilooy/nilz-change-stream',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('2.2');
  api.use(['ecmascript', 'check', 'mongo']);
  api.mainModule('change-stream.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('nilz:change-stream');
  api.mainModule('change-stream-tests.js');
});
