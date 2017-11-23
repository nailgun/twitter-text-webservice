var express = require('express'),
    request = require('request'),
    emoji = require('emoji-aware'),
    twitter = require('twitter-text'),
    bodyParser = require('body-parser');

var app = express(),
    config = {
        short_url_length: 23,
        short_url_length_https: 23
    },
    MAX_TWEET_LENGTH = 280,
    CONFIG_UPDATE_INTERVAL = 1 * 24 * 60 * 60 * 1000;     // 1 day

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.json({
        'service': 'Twitter text API',
        'endpoints': {
            '/configuration': {
                'method': 'GET',
                'info': 'Get twitter configuration (same as https://api.twitter.com/1.1/help/configuration.json)'
            },
            '/tweet/length': {
                'method': 'POST',
                'info': 'Get tweet length (twitter.getTweetLength)',
                'params': {
                    'text': '(string) Tweet text',
                    'media': '(boolean) Reserve characters for media',
                    'reserve': '(integer) Number of extra characters to reserve'
                }
            },
            '/tweet/truncate': {
                'method': 'POST',
                'info': 'Truncate tweet to maximum length',
                'params': {
                    'text': '(string) Tweet text',
                    'ellipsis': '(ellipsis) Append this string when text truncated',
                    'media': '(boolean) Reserve characters for media',
                    'reserve': '(integer) Number of extra characters to reserve'
                }
            }
        }
    });
});

app.get('/configuration', function (req, res) {
    res.json(config);
});

app.post('/tweet/length', function (req, res) {
    var text = req.body.text;
    if (typeof text != 'string') {
        res.status(400);
        return res.json('text required');
    }

    var reserve = req.body.reserve || 0;
    var length = tweetLength(text) + reserve;
    var remaining = MAX_TWEET_LENGTH - length;

    res.json({
        length: length,
        remaining: remaining
    });
});

app.post('/tweet/truncate', function (req, res) {
    var text = req.body.text;
    if (typeof text != 'string') {
        res.status(400);
        return res.json('text required');
    }

    var ellipsis = req.body.ellipsis || '',
        reserve = req.body.reserve || 0,
        maxTweetLength = MAX_TWEET_LENGTH - reserve;

    text = text.trim();

    var words = text.split(/(\s+)/g),
        tweetLen = 0,
        tweet = '';

    words.every(function (word) {
        var wordLen = tweetLength(word);
        if (tweetLen + wordLen + ellipsis.length > maxTweetLength) {
            var cleanedWord = cleanTweetEnding(word);
            wordLen -= word.length - cleanedWord.length;
            word = cleanedWord;

            if (tweetLen + wordLen + ellipsis.length <= maxTweetLength) {
                tweet += word;
                tweetLen += wordLen;
            }

            return false;
        }

        tweet += word;
        tweetLen += wordLen;

        return true;
    });

    if (tweetLen > 0) {
        tweet = cleanTweetEnding(tweet) + ellipsis;
    } else {
        // fallback
        if (text.length > maxTweetLength) {
            tweet = text.substring(0, maxTweetLength - ellipsis.length) + ellipsis;
        } else {
            tweet = text;
        }
    }

    res.json(tweet);
});

var server = app.listen(process.env.BIND_PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Twitter text webservice listening at http://%s:%s', host, port);
});

if (process.env.API_KEY && process.env.API_SECRET) {
    setInterval(updateConfig, CONFIG_UPDATE_INTERVAL);
    updateConfig();
} else {
    console.log('Using default Twitter configuration');
    console.log('Set API_KEY and API_SECRET environment variables to use latest configuration')
    console.log('See https://dev.twitter.com/rest/reference/get/help/configuration for details')
}

function tweetLength (text) {
    var emojiReplacement = '??',
        textEmojiReplaced = Array(emoji.onlyEmoji(text).length + 1).join(emojiReplacement),
        textNoEmoji = emoji.withoutEmoji(text).join('');
    return twitter.getTweetLength(textNoEmoji + textEmojiReplaced, config);
}

function cleanTweetEnding (text) {
    return text.replace(/[.,:;!\s]+$/, '');
}

function updateConfig () {
    request({
        url: 'https://api.twitter.com/1.1/help/configuration.json',
        json: true,
        oauth: {
            consumer_key: process.env.API_KEY,
            consumer_secret: process.env.API_SECRET
        }
    }, function (err, response, body) {
        if (err || response.statusCode !== 200) {
            console.log('Failed to get Twitter configuration:');

            if (err) {
                console.log(err);
            } else {
                console.log(response.statusCode, body);
            }

            console.log('Using default configuration');
            return;
        }

        console.log('Twitter configuration updated')
        config = body;
    });
}
