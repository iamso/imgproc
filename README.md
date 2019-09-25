# imgproc

Simple image processing service.

## Install

```bash
git clone git@github.com:iamso/imgproc.git
cd imgproc
npm install
```

## Usage 

Run normally:

```bash
npm start
```

Run in dev mode:

```bash
npm run dev
```

Default port is 8000, but can be set via environment variable:

```
PORT=1234 npm start
// or
PORT=1234 npm run dev
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| url | String | The url to the image to process. **Must be url encoded.**|
| width | Number | **Optional**. The width of the output image.|
| height | Number | **Optional**. The height of the output image. |
| fit | String | **Optional**. The fit of the output image. Can be `cover`, `contain`, `fill`, `inside` or `outside`. Default is `cover`. |
| background | String | **Optional**. The background color of the output image, visible i.e. if fit is `contain`. Expects a hex color, without the `#`, i.e. `ff0000`. |
| flip | - | **Optional**. If present, the output image is flipped on the Y axis. |
| flop | - | **Optional**. If present, the output image is flipped on the X axis. |
| rotate | Number | **Optional**. The angle for the rotation of the output image. |
| greyscale | - | **Optional**. If present, the output image is converted to greyscale. |
| negate | - | **Optional**. If present, the output image is converted to negative. |
| normalize | - | **Optional**. If present, the output image is normalized. |

Here is a url using all the options:

```url
https://imgproc.your.tld/?url=https%3A%2F%2Fplaceimg.com%2F1000%2F1000%2Fany&width=300&height=200&fit=contain&background=ff0000&flip&flop&rotate=45&greyscale&negate&normalize
```

The image url can also be passed as a route parameter.

```url
https://imgproc.your.tld/https%3A%2F%2Fplaceimg.com%2F1000%2F1000%2Fany?width=300&height=200&fit=contain&background=ff0000&flip&flop&rotate=45&greyscale&negate&normalize
```

If no options are passed, it just acts as a proxy.

## Caveats

This service uses [sharp](https://github.com/lovell/sharp) for image processing and currently there is an issue running this on now.sh.

## License

[ISC License](LICENSE)



