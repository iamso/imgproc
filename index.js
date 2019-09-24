const express = require('express');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util')
const request = promisify(require('request'));
const sharp = require('sharp');
const fileType = require('file-type');

const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const responseTime = require('response-time');
const serveFavicon = require('serve-favicon');
const serveStatic = require('serve-static');
const helmet = require('helmet');
const cache = require('apicache').middleware;

const app = express();
const port = process.env.PORT || 8000;
const noImage = fs.readFileSync(path.join(__dirname, 'public', 'no-image.jpg'))

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'public')));
app.use(morgan('tiny'));
app.use(responseTime());

app.get('/:url?', cache('90 days'), async (req, res, next) => {
  const options = {
    ...req.params,
    ...req.body,
    ...req.query,
  };

  if (!options.url) {
    next(new Error('no image provided'));
    return;
  }

  const requestSettings = {
      url: options.url,
      method: 'GET',
      encoding: null
  };

  const response = await request(requestSettings).catch(err => err);

  if (!response.body || response.statusCode !== 200) {
    next(response);
    return;
  }

  if (!/^image\//.test(response.headers['content-type'])) {
    next(new Error('no image provided'))
  }

  let image = sharp(response.body);

  image = image
    .resize({
      width: parseInt(options.width || 0),
      height: parseInt(options.height || 0),
      fit: options.fit,
      background: options.background,
    })
    .flip(options.hasOwnProperty('flip'))
    .flop(options.hasOwnProperty('flop'))
    .rotate(parseInt(options.rotate || 0), {
      background: options.background,
    })
    .greyscale(options.hasOwnProperty('greyscale') || options.hasOwnProperty('grayscale'))
    .negate(options.hasOwnProperty('negate'))
    .normalize(options.hasOwnProperty('normalize') || options.hasOwnProperty('normalise'))
  ;
  
  if (options.format) {
    image = image.toFormat(options.format);
  }

  let buffer = await image.toBuffer();

  let {mime} = fileType(buffer);

  res.type(mime);
  res.send(buffer);
});

app.use((err, req, res, next) => {
  res.type('image/jpeg');
  res.send(noImage);
})

const server = app.listen(port, (...args) => {
  console.log('listening on port %s', server.address().port);
});
