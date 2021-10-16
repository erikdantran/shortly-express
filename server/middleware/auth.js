const models = require('../models');
const Promise = require('bluebird');

let createToken = function(req, res) {
  return models.Sessions.create()
    .then(hashObject => {
      return models.Sessions.get({ id: hashObject.insertId});
    })
    .then((hashObject) => {
      req.session.hash = hashObject.hash;
      // res.cookies = {};
      // res.cookies.shortlyid = {};
      // res.cookies['shortlyid'].value = hashObject.hash;
      res.cookie('shortlyid', hashObject.hash );
    })
    .catch(err => {
      // console.log(err);
    });
};

module.exports.createSession = (req, res, next) => {
  req.session = {};
  // create a session token with a hash

  if (req.cookies && req.cookies.shortlyid) {
    createToken(req, res)
      .then(() => {
        return models.Sessions.get( {hash: req.cookies.shortlyid} );
      })
      .then(session => {
        if (!session.userId) {
          return Promise.reject();
        }
        req.session.userId = session.userId;
        return models.Users.get( { id: session.userId });
      })
      .then(user => {
        // console.log(user);
        req.session.user = {};
        req.session.user = user;
        return;
      })
      .then(() => {
        next();
      })
      .catch(() => {
        next();
      });
  } else {
    createToken(req, res)
      .then(() => {
        next();
      });
  }


  // models.Sessions.create()
  //   .then(hashObject => {
  //     return models.Sessions.get({ id: hashObject.insertId});
  //   })
  //   .then((hashObject) => {
  //     req.session.hash = hashObject.hash;
  //     res.cookies = {};
  //     res.cookies.shortlyid = {};
  //     res.cookies['shortlyid'].value = hashObject.hash;
  //     next();
  //   })
  //   .catch(err => {
  //     console.log(err);
  //     next();
  //   });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
