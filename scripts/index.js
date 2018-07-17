var request = require('request'); // "Request" library
var express = require('express');
var querystring = require('querystring');
var fs = require('fs');
var requirejs = require('requirejs');

requirejs.config({})


var client_id = process.env.jukebox_client_id; // Your client id
var client_secret = process.env.jukebox_client_secret; // Your secret
var redirect_uri = 'http://localhost:8000/callback'; // Your redirect uri
var refresh_token = process.env.jukebox_refresh_token;
var access_token;

var app = express();

var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))},
    form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
    },
    json: true
};

request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log(body.access_token);
        access_token = body.access_token;

        authOptions = {
            url: 'https://api.spotify.com/v1/me/player',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
        };
        request.get(authOptions, function (error, reponse, body) {
            if (!error && reponse.statusCode === 200) {
                console.log("Success");
            }
            else {
                console.log(response.statusCode);
                console.log(body);
            }
        });

    }

    else {
        console.log('Error:' + error);
    }
});

app.use(express.static(__dirname + '/../'));

app.get('/', function (req, res) {
    if (req.url.indexOf('.css') != -1) {
        fs.readFile(__dirname + '/../styles/main.css', function (err, data) {
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.write(data);
            res.end();
        });
    }
    else if (req.url.indexOf('spotify') != -1) {
        fs.readFile(__dirname + '/spotify.js', function (err, data) {
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.write(data);
            res.end();
        });
    }
    else {
        fs.readFile(__dirname + '/../index.html', function (err, data) {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data);
            res.end();
        });
    }

});
app.get('/refresh_token', function (req, res) {
    console.log("/refreshtoken");
    res.send({
        'access_token': access_token
    });
});

var stateKey = 'spotify_auth_state';
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

app.all('/login', function (req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email user-modify-playback-state';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function (error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: {'Authorization': 'Bearer ' + access_token},
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});
app.listen(8000);