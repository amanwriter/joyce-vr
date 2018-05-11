navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

var localVideoElem = null,
    localVideoStream = null,
    videoCallButton = null;

var peerConn = null,
    wsc = new WebSocket('wss://' + location.host + "/"),
    peerConnCfg = {
        'iceServers': []
    };

function pageReady() {
    // check browser WebRTC availability
    startStreaming = document.getElementById("startStreaming");
    localVideo = document.getElementById('localVideo');
    startStreaming.addEventListener("click", initiateCall);
};

function prepareCall() {
    peerConn = new RTCPeerConnection(peerConnCfg);
    // send any ice candidates to the other peer
    peerConn.onicecandidate = onIceCandidateHandler;
    // once remote stream arrives, show it in the remote video element
    peerConn.onaddstream = onAddStreamHandler;
};

// run start(true) to initiate a call
function initiateCall() {
    prepareCall();
    navigator.getUserMedia({
        "audio": false,
        "video": {
            mediaSource: "screen",
            width: 800,
            height: 600
        }
    }, function(stream) {
        localVideoStream = stream;
        peerConn.addStream(localVideoStream);
        createAndSendOffer();
    }, function(error) {
        console.log(error);
    });
};

wsc.onopen = function() {
    wsc.send("webcam");
}

wsc.onmessage = function(evt) {
    var signal = null;
    if (!peerConn) answerCall();
    signal = JSON.parse(evt.data);
    if (signal.sdp) {
        peerConn.setRemoteDescription(new RTCSessionDescription(signal.sdp));
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
    videoCallButton.setAttribute("disabled", true);
    endCallButton.removeAttribute("disabled");
};

function endCall() {
    peerConn.close();
    peerConn = null;
    videoCallButton.removeAttribute("disabled");
    endCallButton.setAttribute("disabled", true);
    if (localVideoStream) {
        localVideoStream.getTracks().forEach(function(track) {
            track.stop();
        });
        localVideo.src = "";
    }
};
