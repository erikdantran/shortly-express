const models = require('../models');
const Promise = require('bluebird');

let createToken = function (req, res) {
  return models.Sessions.create()
    .then(hashObject => {
      return models.Sessions.get({ id: hashObject.insertId });
    })
    .then((hashObject) => {
      req.session.hash = hashObject.hash;
      // res.cookies = {};
      // res.cookies.shortlyid = {};
      // res.cookies['shortlyid'].value = hashObject.hash;
      res.cookie('shortlyid', hashObject.hash);
    })
    .catch(err => {
      throw err;
    });
};

module.exports.createSession = (req, res, next) => {
  req.session = {};
  // create a session token with a hash

  if (req.cookies && req.cookies.shortlyid) {
    createToken(req, res)
      .then(() => {
        return models.Sessions.get({ hash: req.cookies.shortlyid });
      })
      .then((preExistingSession) => {
        if (preExistingSession.userId) {
          return models.Sessions.update({ hash: res.cookies.shortlyid.value }, { userId: preExistingSession.userId });
        }
        return;
      })
      .then(() => {
        return models.Sessions.get({ hash: res.cookies.shortlyid.value });
      })
      .then(session => {
        if (!session.userId) {
          return Promise.reject('no userId');
        }
        req.session.userId = session.userId;
        return models.Users.get({ id: session.userId });
      })
      .then(user => {
        req.session.user = {};
        req.session.user = user;
        return;
      })
      .then(() => {
        next();
      })
      .catch((err) => {
        console.log('ERROR: ', err);
        next();
      });
  } else {
    createToken(req, res)
      .then(() => {
        next();
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
module.exports.verifySession = (req, res, next) => {
  console.log('REQ.SESSION from VERIFY SESSION: ', req.session);
  models.Sessions.get({ id: 1 })
    .then((session) => {
      console.log('DB Session from verify Session: ', session);
      if (session.userId === null) {
        console.log('redirecting from ', req.originalUrl);
        res.redirect(300, '/login');
      } else {
        next();
      }
    });
};