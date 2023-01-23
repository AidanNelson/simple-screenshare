const peers = {};
const socket = io();
const videoElement = document.getElementById("localVideo");

let currentStream = null;

socket.on("connect", () => {
  console.log("Socket connected!");
});

socket.on("doneDisplayingStream", (data) => {
  if (data.id === socket.id && currentStream) {
    console.log("screen is done displaying stream (maybe someone took over).");
    let tracks = videoElement.srcObject.getTracks();

    tracks.forEach((track) => track.stop());
    videoElement.srcObject = null;

    currentStream = null;
  }
});

socket.on("signal", (to, from, data) => {
  // console.log("Got a signal from the server: ", to, from, data);

  // to should be us
  if (to !== socket.id) {
    console.log("Socket IDs don't match");
    return;
  }

  // Look for the right simplepeer in our array
  const peerConnection = peers[from];
  if (peerConnection) {
    // console.log("signaling to ", peerConnection);
    peerConnection.signal(data);
  } else {
    console.log("Never found right simplepeer object");
    // // Let's create it then, we won't be the "initiator"
    // // let theirSocketId = from;
    // let peerConnection = createPeerConnection(from, false);

    // peers[from].peerConnection = peerConnection;

    // // Tell the new simplepeer that signal
    // peerConnection.signal(data);
  }
});

socket.on("intro", (otherSocketId) => {
  // console.log("intro to ", otherSocketId);
  if (otherSocketId === socket.id) return;
  // console.log("SimplePeer connecting to peer with ID", otherSocketId);
  const isInitiator = true;
  // console.log("initiating?", isInitiator);

  const sdpTransformFunc = (sdp) => {
    console.log(sdp);
    return sdp;
  };

  const peerConnection = new SimplePeer({
    initiator: isInitiator,
    sdpTransform: sdpTransformFunc,
  });
  // simplepeer generates signals which need to be sent across socket
  peerConnection.on("signal", (data) => {
    socket.emit("signal", otherSocketId, socket.id, data);
  });

  // When we have a connection, send our stream
  peerConnection.on("connect", () => {
    console.log("Peer Connection Established!");
  });

  // Stream coming in to us
  peerConnection.on("stream", (stream) => {
    console.log("Got Stream!", stream);
  });

  peerConnection.on("close", () => {
    console.log("Got close event");
    delete peers[otherSocketId];
    // Should probably remove from the array of simplepeers
  });

  peerConnection.on("error", (err) => {
    console.log(err);
  });

  peers[otherSocketId] = peerConnection;
});

function gotStream(stream) {
  currentStream = stream; // make stream available to console
  console.log(stream);

  const videoTrack = currentStream.getVideoTracks()[0];
  // const audioTrack = currentStream.getAudioTracks()[0];
  // console.log(audioTrack);
  // console.log("adding video track end listener");

  videoTrack.addEventListener("ended", () => {
    console.log("video track ended!");
    socket.emit("streamEnded"); // we'll use this for video and audio together
  });

  // let videoStream = new MediaStream([videoTrack]);
  if ("srcObject" in videoElement) {
    videoElement.srcObject = currentStream;
  } else {
    videoElement.src = window.URL.createObjectURL(currentStream);
  }

  videoElement.play();

  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
// user media

document.getElementById("startBroadcast").addEventListener(
  "click",
  () => {
    startBroadcast();
  },
  false
);

async function startBroadcast() {
  console.log("broadcasting!");
  let stream = await navigator.mediaDevices.getDisplayMedia();
  gotStream(stream);

  // eslint-disable-next-line prefer-const
  for (let id in peers) {
    if (peers[id]) {
      peers[id].addStream(stream);
    }
  }
}
