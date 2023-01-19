const peers = {};
const socket = io("https://localhost:3000");
let ipAddress = "127.0.0.1";

socket.on("connect", () => {
  // eslint-disable-next-line no-console
  console.log("Socket Connected.");
});

socket.on("ip", (data) => {
  ipAddress = data;
  console.log("ipAddress: ", ipAddress);
  document.getElementById(
    "instructions"
  ).innerText = `To share your screen point your browser window to \n https://${ipAddress}:3000`;
});

socket.on("signal", (to, from, data) => {
  //   console.log("Got a signal from the server: ", to, from, data);

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
  }
});

socket.on("intro", (otherSocketId) => {
  if (otherSocketId === socket.id) return;
  console.log("Connecting to peer with ID", otherSocketId);
  const isInitiator = false;
  //   console.log("initiating?", isInitiator);

  const peerConnection = new SimplePeer({ initiator: isInitiator });
  //   console.log(peerConnection);
  // simplepeer generates signals which need to be sent across socket
  peerConnection.on("signal", (data) => {
    // console.log('signal');
    socket.emit("signal", otherSocketId, socket.id, data);
  });

  // When we have a connection, send our stream
  peerConnection.on("connect", () => {
    // Let's give them our stream
    // peerConnection.addStream(localMediaStream);
    console.log("Peer Connection Established!");
  });

  // Stream coming in to us
  peerConnection.on("stream", (stream) => {
    console.log("Got Stream!", stream);

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    console.log(audioTrack);
    console.log(videoTrack);

    const videoStream = new MediaStream([videoTrack]);

    const videoElement = document.createElement("video");
    videoElement.id = "videoEl";

    if ("srcObject" in videoElement) {
      videoElement.srcObject = videoStream;
    } else {
      videoElement.src = window.URL.createObjectURL(videoStream);
    }

    videoElement.play();
    document.getElementById("videoContainer").appendChild(videoElement);
  });

  peerConnection.on("close", () => {
    console.log("Got close event");

    // const videoElement = document.getElementById("videoEl");

    // if (videoElement) {
    //   document.getElementById("videoContainer").removeChild(videoElement);
    // }
  });

  peerConnection.on("error", (err) => {
    console.log(err);
  });

  // const { name, value } = e.target;
  peers[otherSocketId] = peerConnection;
});
