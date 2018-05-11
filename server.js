const WebSocketServer = require('ws').Server,
    express = require('express'),
    https = require('https'),
    app = express(),
    fs = require('fs');

const pkey = fs.readFileSync('./ssl/key.pem'),
    pcert = fs.readFileSync('./ssl/cert.pem'),
    options = {
        key: pkey,
        cert: pcert,
        passphrase: '123456789'
    };

var wss = null,
    sslSrv = null;

app.use(express.static('.'));

sslSrv = https.createServer(options, app).listen(8000);
console.log("HTTPS server is up.");

// create the WebSocket server
wss = new WebSocketServer({
    server: sslSrv
});

/** successful connection */
var webcam, mobile;
var spawn = require('child_process').spawn,
    child = spawn('java', ['MouseMover']);

wss.on('connection', function(ws) {
    console.log("A new WebSocket client was connected.");
    ws.on('message', function(message) {
        if (ws === mobile) {
            if (message.startsWith("_move_")) {
                message = message.replace("_move_", "");
                child.stdin.write(message + "\n");
            } else if (webcam && webcam.readyState === webcam.OPEN) {
                webcam.send(message);
            }
        } else if (ws === webcam) {
            if (mobile && mobile.readyState === mobile.OPEN) {
                mobile.send(message);
                console.log("webcam message received");
            }
        } else if (message === "webcam") {
            webcam = ws;
            console.log("Webcam connected");
        } else if (message === "mobile") {
            mobile = ws;
            console.log("mobile connected");
        }

    });

});
