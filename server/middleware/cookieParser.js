// name=value; name=value; ... name=value
// str = str.replace(/\s/g, '');
// cookiesString.split(';')
// ['name=value',' name=value',' name=value']
// cookiesString.split('=')
// fistSplit.forEach(pair => {split -> assign req.cookies})
// [name, value]

const parseCookies = (req, res, next) => {
  let cookiesString = req.headers.cookie;
  if (cookiesString === undefined) {
    next();
    return;
  }
  req.cookies = {};
  cookiesString = cookiesString.replace(/\s/g, '');
  let firstSplit = cookiesString.split(';');
  firstSplit.forEach(pair => {
    var secondSplit = pair.split('=');
    req.cookies[secondSplit[0]] = secondSplit[1];
  });

  next();
};

module.exports = parseCookies;