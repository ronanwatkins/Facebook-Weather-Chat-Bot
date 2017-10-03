'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const http = require('http')

const counties = {
        antrim: "uk/ballymena",
        armagh: "uk/craigavon",
        carlow: "ireland/carlow",
        cavan: "ireland/cavan",
        clare: "ireland/ennis",
        cork: "ireland/cork",
        derry: "uk/coleraine",
        donegal: "ireland/letterkenny",
        down: "uk/downpatrick",
        dublin: "ireland/dublin",
        fermanagh: "uk/enniskillen",
        galway: "ireland/galway",
        kerry: "ireland/tralee",
        kildare: "ireland/naas",
        kilkenny: "ireland/kilkenny",
        laois: "ireland/portlaoise",
        leitrim: "ireland/carrick-on-shannon",
        limerick: "ireland/adare",
        longford: "ireland/longford",
        louth: "ireland/dundalk",
        mayo: "ireland/castlebar",
        meath: "ireland/navan",
        monaghan: "ireland/monaghan",
        offaly: "ireland/birr",
        roscommon: "ireland/roscommon",
        sligo: "ireland/sligo",
        tipperary: "ireland/tipperary",
        tyrone: "uk/omagh",
        waterford: "ireland/lismore",
        westmeath: "ireland/kinnegad",
        wexford: "ireland/wexford",
        wicklow: "ireland/wicklow",
}
var keys = Object.keys(counties)

var stuff = '';

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
        res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
        if (req.query['hub.verify_token'] === ''){
                res.send(req.query['hub.challenge'])
        }
        res.send('Error, wrong token')
})

var sender
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
            let event = req.body.entry[0].messaging[i]
            sender = event.sender.id
            if (event.message && event.message.text) {
                    let text = event.message.text
                    text = text.trim().toLowerCase()
                    let result = isMatching(text)
                    if (result) {
                        var county = '';
                        keys.forEach(function(key) {
                            if(text.includes(key)) {
                                county = key
                            }
                        });

                        let town = counties[county]
                        apiRequest(getResponse, town)
                    } else {
                        sendTextMessage(sender, "Please enter the name of a county")
					}
			}
    }
    res.sendStatus(200)
})

// Spin up the server
app.listen(app.get('port'), function() {
        console.log('running on port', app.get('port'))
})

function isMatching(text) {
    var state = false;
    keys.forEach(function(key) { //loop through keys array
       if(text.includes(key)) {
          state = true;
       }
    });
    return state;
}

var makeResponse = function(obj) {
    let weather = obj.current_observation.weather
    weather = weather.toLowerCase()
    if(weather == 'rain')
        weather = 'raining'
    if(weather == 'snow')
        weather = 'snowing'
    let temp = obj.current_observation.temp_c
    let windDirection = obj.current_observation.wind_dir
    windDirection = windDirection.toLowerCase()
    if(windDirection == 'sse' || windDirection == 'se' || windDirection == 'ese'){
       windDirection = 'south east'
    }
    if(windDirection == 'nnw' || windDirection == 'nw' || windDirection == 'wnw'){
       windDirection = 'north west'
    }
    if(windDirection == 'nne' || windDirection == 'ne' || windDirection == 'ene'){
       windDirection = 'north east'
    }
    if(windDirection == 'ssw' || windDirection == 'sw' || windDirection == 'wsw'){
       windDirection = 'south west'
    }

    let windSpeed = obj.current_observation.wind_kph

    let message = "It is "+weather+" with a temperature of "+temp+"C. The wind is coming from the "+windDirection+" at a speed of "+windSpeed+"kph";
    return message;
}

var apiRequest = function(cb, county) {
        let httpRequestParams = {
                host: "api.wunderground.com",
                port: 80,
                path: "/api/58f71e3757f75d4c/conditions/q/"+county+".json"
        };
        let req = http.get(httpRequestParams, function(res)
        {
                let data = '';
                res.on('data', function(chunk) {
                        data += chunk.toString();
                });
                res.on('end', function() {
                        cb(data);
                });
        }).end();
}

function getResponse(data) {
        stuff = ''
        stuff = data;
        console.log(stuff)
                        let obj = JSON.parse(stuff)
                        let message = makeResponse(obj)
                        sendTextMessage(sender, message)

}

const token = ""
function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token:token},
            method: 'POST',
                json: {
                    recipient: {id:sender},
                        message: messageData,
                }
        }, function(error, response, body) {
                if (error) {
                    console.log('Error sending messages: ', error)
                } else if (response.body.error) {
                    console.log('Error: ', response.body.error)
            }
    })
}
