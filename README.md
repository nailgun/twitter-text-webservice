# twitter-text-webservice

REST API to the [twitter-text module](https://github.com/twitter/twitter-text/tree/master/js).
Based on [Express](http://expressjs.com/).

## Installation

```
$ npm install twitter-text-webservice
$ export API_KEY='YOUR_TWITTER_API_KEY`        # optional
$ export API_SECRET='YOUR_TWITTER_API_SECRET`  # optional
$ export BIND_PORT=3000                        # optional
$ npm start twitter-text-webservice
```

## Usage

```json
{
  "service": "Twitter text API",
  "endpoints": {
    "/configuration": {
      "method": "GET",
      "info": "Get twitter configuration (same as https://api.twitter.com/1.1/help/configuration.json)"
    },
    "/tweet/length": {
      "method": "POST",
      "info": "Get tweet length (twitter.getTweetLength)",
      "params": {
        "text": "(string) Tweet text"
      }
    },
    "/tweet/truncate": {
      "method": "POST",
      "info": "Truncate tweet to maximum length",
      "params": {
        "text": "(string) Tweet text",
        "ellipsis": "(ellipsis) Append this string when text truncated",
        "media": "(boolean) Reserve characters for media",
        "reserve": "(integer) Number of extra characters to reserve"
      }
    }
  }
}
```

## Contributing

I've implemented functionality requied only for one project. But you can extend it easily. PRs are welcome. 
