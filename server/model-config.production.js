module.exports = {
  '_meta': {
    'sources': [
      'loopback/common/models',
      'loopback/server/models',
      'digitopia-admin/common/models',
      '../common/models',
      './models'
    ],
    'mixins': [
      'loopback/common/mixins',
      'loopback/server/mixins',
      '../node_modules/loopback-ds-timestamp-mixin',
      '../common/mixins',
      './mixins'
    ]
  },
  'Upload': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'User': {
    'dataSource': 'db',
    'public': false
  },
  'AccessToken': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'ACL': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'RoleMapping': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'Role': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'MyUser': {
    'dataSource': 'db',
    'public': true
  },
  'UserIdentity': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'ImageSet': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'TypeTest': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'TypeTestLookup': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'TestThrough': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'I18n': {
    'dataSource': 'db',
    'public': process.env.ADMIN ? true : false
  },
  'OgTag': {
    'dataSource': 'db',
    'public': true
  }
};
