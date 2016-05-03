repeatone-webtask
==================

Get the number of times a lastfm user has currently listened to a track on repeat.

[![Build Status](https://travis-ci.org/lukekarrys/repeatone-webtask.png?branch=master)](https://travis-ci.org/lukekarrys/repeatone-webtask)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)


## Why?

I've always been a fan of Repeat One. Whether it was working, driving, studying, etc. sometimes I just enjoyed listening to a song 30+ times in a row. This is a webtask that will report whether I (or any lastfm user) is listening to a song on repeat.


## Create Your Own

```sh
npm run init -- YOUR@EMAIL.COM # Only needed the first time
npm run create -- --secret API_KEY=LASTFM_KEY
# Your container name will be shown after you create the webtask
curl -s https://webtask.it.auth0.com/api/run/{CONTAINER_NAME}/repeatone?user=USER
```


## Contributing

Only the [whitelisted webtask.io](https://tehsis.github.io/webtaskio-canirequire/) modules can be used.


## Tests

`npm run test`


## License

MIT
