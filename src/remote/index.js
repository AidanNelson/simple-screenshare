const peers = {};
const socket = io();

socket.on("connect", () => {
  console.log("Socket connected!");
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

  const peerConnection = new SimplePeer({ initiator: isInitiator });
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
  // console.log("peers:", peers);
});

// function gotDevices(deviceInfos) {
//   // Handles being called several times to update labels. Preserve values.
//   const values = selectors.map((select) => select.value);
//   selectors.forEach((select) => {
//     while (select.firstChild) {
//       select.removeChild(select.firstChild);
//     }
//   });
//   for (let i = 0; i !== deviceInfos.length; ++i) {
//     const deviceInfo = deviceInfos[i];
//     const option = document.createElement('option');
//     option.value = deviceInfo.deviceId;
//     if (deviceInfo.kind === 'audioinput') {
//       option.text =
//         deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
//       audioInputSelect.appendChild(option);
//     } else if (deviceInfo.kind === 'audiooutput') {
//       option.text =
//         deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
//       audioOutputSelect.appendChild(option);
//     } else if (deviceInfo.kind === 'videoinput') {
//       option.text = deviceInfo.label || `camera ${videoInputSelect.length + 1}`;
//       videoInputSelect.appendChild(option);
//     } else {
//       console.log('Some other kind of source/device: ', deviceInfo);
//     }
//   }
//   selectors.forEach((select, selectorIndex) => {
//     if (
//       Array.prototype.slice
//         .call(select.childNodes)
//         .some((n) => n.value === values[selectorIndex])
//     ) {
//       select.value = values[selectorIndex];
//     }
//   });
// }

function gotStream(stream) {
  localCam = stream; // make stream available to console
  console.log(stream);

  const videoTrack = localCam.getVideoTracks()[0];
  const audioTrack = localCam.getAudioTracks()[0];
  console.log(audioTrack);
  console.log(videoTrack);

  let videoStream = new MediaStream([videoTrack]);
  if ("srcObject" in videoElement) {
    videoElement.srcObject = videoStream;
  } else {
    videoElement.src = window.URL.createObjectURL(videoStream);
  }

  videoElement.play();

  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
// user media
let localCam;
const videoElement = document.getElementById("local_video");

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
