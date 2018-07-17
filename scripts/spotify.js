var access_token;
var pause = true;

$(document).ready(function () {
    $.ajax({
        url: '/refresh_token'
    }).done(function (data) {
        console.log(data);
        access_token = data.access_token;
        console.log(data.access_token);
        $.get({
                url: 'https://api.spotify.com/v1/me/player',
                type: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                success: function (response) {
                    console.log("Success");
                },
                error: function (response) {
                    console.log(response);
                }

            }
        );

    });
    $("#play").click(function (e) {
        if (pause) {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/pause',
                type: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                success: function (response) {
                    console.log("PAUSE");
                    pause = false;
                },
                error: function (response) {
                    console.log(response);
                }
            });
        }
        else {
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/play',
                type: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                success: function (response) {
                    console.log("PLAY");
                    pause = true;
                },
                error: function (response) {
                    console.log(response);
                }
            });
        }
    });

    $("#back").click(function (e) {
        $.post({
            url: 'https://api.spotify.com/v1/me/player/previous',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function () {
                console.log("Back");
            }
        });
    });

    $("#skip").click(function (e) {
        $.post({
            url: 'https://api.spotify.com/v1/me/player/next',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function () {
                console.log("Skip");
            }
        });
    });
})
console.log("spotify.js");
