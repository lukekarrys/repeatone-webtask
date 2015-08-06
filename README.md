repeatone-webtask
==================

Get the number of times a lastfm user has currently listened to a track on repeat.


## Why?

I've always been a fan of Repeat One. Whether it was working, driving, studying, etc. sometimes I just enjoyed listening to a song 30+ times in a row. This is a webtask that will report whether I (or any lastfm user) is listening to a song on repeat.


## Usage

```sh
curl -s https://webtask.it.auth0.com/api/run/wt-lukekarrys-gmail_com-0/repeatone?user=LASTFM_USER
```


## Create Your Own

```sh
npm run init -- YOUR@EMAI.COM
npm run create -- --secret API_KEY=LASTFM_KEY
# Your container name will be shown after you create the webtask
curl -s https://webtask.it.auth0.com/api/run/{CONTAINER_NAME}/repeatone
```


## Contributing

Only the [whitelisted webtask.io](https://tehsis.github.io/webtaskio-canirequire/) modules can be used.


## Tests

`npm run test`


## License

MIT
