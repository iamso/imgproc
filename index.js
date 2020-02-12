const express = require('express');
const path = require('path');
const fs = require('fs');
const {promisify} = require('util')
const request = promisify(require('request'));
const sharp = require('sharp');
const FileType = require('file-type');
const objectHash = require('object-hash');
const {dirSync} = require('tmp');

const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const responseTime = require('response-time');
const serveFavicon = require('serve-favicon');
const serveStatic = require('serve-static');
const helmet = require('helmet');
const cache = require('apicache').middleware;
const useragent = require('express-useragent');

const app = express();
const port = process.env.PORT || 8000;
const noImage = fs.readFileSync(path.join(__dirname, 'public', 'no-image.jpg'));
const tmpDir = dirSync();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(serveFavicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'public')));
app.use(morgan('tiny'));
app.use(responseTime());
app.use(useragent.express());

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

  const optionsHash = objectHash(options);
  const tmpFile = path.join(tmpDir.name, optionsHash);
  let buffer;

  if (fs.existsSync(tmpFile)) {
    buffer = fs.readFileSync(tmpFile);
  }
  else {
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
      next(new Error('no image provided'));
      return;
    }

    let image = sharp(response.body);

    const imageMeta = await image.metadata().catch(error => false);

    if (imageMeta) {
      if (options.width && options.height) {
        const originalRatio = imageMeta.height / imageMeta.width;
        const newRatio = options.height / options.width;

        if (newRatio < originalRatio) {
          options.width = Math.min(options.width, imageMeta.width);
          options.height = options.width * newRatio;
        }
        else {
          options.height = Math.min(options.height, imageMeta.height);
          options.width = options.height / newRatio;
        }
      }
      else if (options.width) {
        options.width = Math.min(options.width, imageMeta.width);
      }
      else if (options.height) {
        options.height = Math.min(options.height, imageMeta.height);
      }
    }

    image = image
      .resize({
        width: parseInt(options.width || 0) || null,
        height: parseInt(options.height || 0) || null,
        fit: options.fit,
        background: options.background ? `#${options.background}` : null,
        withoutEnlargement: true,
      })
      .flip(options.hasOwnProperty('flip'))
      .flop(options.hasOwnProperty('flop'))
      .rotate(parseInt(options.rotate || 0), {
        background: options.background ? `#${options.background}` : null,
      })
      .greyscale(options.hasOwnProperty('greyscale') || options.hasOwnProperty('grayscale'))
      .negate(options.hasOwnProperty('negate'))
      .normalize(options.hasOwnProperty('normalize') || options.hasOwnProperty('normalise'))
    ;

    if (options.format) {
      image = image.toFormat(options.format);
    }

    buffer = await image.toBuffer();

    fs.writeFile(tmpFile, buffer, (err) => {
      if (err) {
        fs.unlink(tmpFile, (err) => {});
      }
    });
  }

  let {ext, mime} = await FileType.fromBuffer(buffer);

  res.type(mime);
  res.send(buffer);
});

app.use((err, req, res, next) => {
  res.type('image/jpeg');
  res.send(noImage);
});

const server = app.listen(port, (...args) => {
  console.log('listening on port %s', server.address().port);
});

process.on ('exit', code => {
  tmpDir.removeCallback();
});
