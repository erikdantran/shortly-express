const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(Auth.createSession);
app.use(cookieParser);
// app.use(Auth.createSession);



app.get('/', Auth.verifySession,
  (req, res) => {
    // console.log('req.session in "/"', req.session);
    res.render('index');
  });

app.get('/create', Auth.verifySession,
  (req, res) => {
    res.render('index');
  });

app.get('/links', Auth.verifySession,
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  models.Users.create(req.body)
    .then((newUser) => {
      models.Sessions.update({ hash: req.session.hash }, { userId: newUser.insertId })
        .then(() => {
          // console.log('USERID: ', newUser.insertId);
          res.redirect(300, '/');
        })
        .catch(() => {
          res.redirect(300, '/');
        });
    })
    .catch((err) => {
      res.redirect(300, '/signup');
    });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  models.Users.get({ username: req.body.username })
    .then(result => {
      if (models.Users.compare(req.body.password, result.password, result.salt)) {
        // TODO: store session
        // update dbSession with userId
        models.Sessions.update({ hash: req.session.hash }, { userId: result.id })
          .then(() => {
            res.redirect(300, '/');
          })
          .catch(() => {
            res.redirect(300, '/');
          });
      } else {
        res.redirect(300, '/login');
      }
    })
    .catch(err => {
      res.redirect(300, '/login');
    });
});

app.get('/logout', (req, res) => {
  console.log('request.cookies app side:', req.cookies);
  models.Sessions.delete( { hash: req.cookies.shortlyid } )
    .then(() => {
      // res.clearCookie('shortlyid');
      res.cookie('shortlyid', '');
      res.sendStatus(200);
    })
    .catch(err => {
      console.log(err);
    });
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      console.log('req. session in app', req.session);
      console.log('req.cookies in bad link: ', req.cookies);
      console.log('res.cookies in bad link: ', res.cookies);
      res.redirect('/');
    });
});

module.exports = app;
