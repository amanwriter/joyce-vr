navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

var localVideoElem = null,
    remoteVideoElem = null,
    localVideoStream = null,
    videoCallButton = null,
    endCallButton = null;

// Variable for orientation variables
var rx = 0,
    ry = 0;
var px = 0,
    py = 0;
var mx = 0,
    my = 0;

var not_ready = true;

var peerConn = null,
    wsc = new WebSocket('wss://' + location.host + "/"),
    peerConnCfg = {
        'iceServers': []
    };



function pageReady() {
    button = document.getElementById("full");

    remoteVideoL = document.getElementById('remoteVideoL');
    remoteVideoR = document.getElementById('remoteVideoR');
};

function prepareCall() {
    peerConn = new RTCPeerConnection(peerConnCfg);
    peerConn.onicecandidate = onIceCandidateHandler;
    peerConn.onaddstream = onAddStreamHandler;
};

function answerCall() {
    prepareCall();
};

wsc.onopen = function() {
    wsc.send("mobile");
    not_ready = false;
}

wsc.onmessage = function(evt) {
    var signal = null;
    if (!peerConn) answerCall();
    signal = JSON.parse(evt.data);
    if (signal.sdp) {
        peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        createAndSendAnswer();
    } else if (signal.candidate) {
        peerConn.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } else if (signal.closeConnection) {
        endCall();
    }
};

function createAndSendOffer() {
    peerConn.createOffer(
        function(offer) {
            var off = new RTCSessionDescription(offer);
            peerConn.setLocalDescription(new RTCSessionDescription(off),
                function() {
                    wsc.send(JSON.stringify({
                        "sdp": off
                    }));
                },
                function(error) {
                    console.log(error);
                }
            );
        },
        function(error) {
            console.log(error);
        }
    );
};

function createAndSendAnswer() {
    peerConn.createAnswer(
        function(answer) {
            var ans = new RTCSessionDescription(answer);
            peerConn.setLocalDescription(ans, function() {
                    wsc.send(JSON.stringify({
                        "sdp": ans
                    }));
                },
                function(error) {
                    console.log(error);
                }
            );
        },
        function(error) {
            console.log(error);
        }
    );
};

function onIceCandidateHandler(evt) {
    if (!evt || !evt.candidate) return;
    wsc.send(JSON.stringify({
        "candidate": evt.candidate
    }));
};

function onAddStreamHandler(evt) {
    remoteVideoL.src = URL.createObjectURL(evt.stream);
    remoteVideoR.src = URL.createObjectURL(evt.stream);
};

// Generate orientation and move screen accordingly based on delta of movement
var milliseconds = (new Date).getTime();
sensorAbs = new AbsoluteOrientationSensor({
    frequency: 20
});
sensorAbs.start();
sensorAbs.onreading = function() {
    if (not_ready) {
        return 0;
    }

    var rotMat = new DOMMatrix();
    sensorAbs.populateMatrix(rotMat);
    var rad = 180 / Math.PI;

    alpha = Math.atan2(-rotMat.m12, rotMat.m22) * rad;
    beta = Math.atan2(-rotMat.m31, rotMat.m33) * rad;

    rx = alpha;
    ry = beta;

    if (Math.abs(rx - px) >= 40) {
        mx = 0;
    } else {
        mx = Math.round(10 * (rx - px));
    }

    if (Math.abs(ry - py) >= 40) {
        my = 0;
    } else {
        my = Math.round(10 * (ry - py));
    }

    px = rx;
    py = ry;

    wsc.send("_move_" + (-mx) + " " + (my));

}