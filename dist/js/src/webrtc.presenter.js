// client-side js
// run by the browser each time your view template is loaded

(function () {
  /* UI */

  const fieldUsername = document.getElementById("username");
  const usersListElement = document.getElementById("users-list");
  const localVideo = document.getElementById("local-video");
  const remoteVideo = document.getElementById("remote-video1");
  const remoteVideo2 = document.getElementById("remote-video2");
  const remoteVideo3 = document.getElementById("remote-video3");

  /* Globals */

  let socket;
  let caller;
  let receiver;
  let peerConnection;

  const servers = {
    iceServers: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  };

  /* Functions */

  function sendToServer(msg) {
    socket.emit("message", JSON.stringify(msg));
  }

  function updateListElement(usersArray, listElement) {
    const updatedList = usersArray
      .map((user) => {
        if (user.name == fieldUsername.value)
          return `
        <li class="user-item">
          ${user.name}
        </li>`;
        else
          return `
        <li class="user-item">
          ${user.name} <button class="call" data-target="${user.name}">Call</button>
        </li>`;
      })
      .join("");

    // Re-render user list
    listElement.innerHTML = updatedList;

    // Add event listeners to call button next to the user
    const callButtons = document.getElementsByClassName("call");
    Object.keys(callButtons).forEach((key) =>
      callButtons[key].addEventListener("click", inviteToVideoCall)
    );
  }

  async function getLocalMedia(peerConnection) {
    try {
      var devices = await navigator.mediaDevices.enumerateDevices();
      var realV = [];
      var realAin = [];
      var count = 0;
      for (var i = 0; i < devices.length; i++) {
        var device = devices[i];
        console.log("device type:", device.kind);
        if (device.kind === "videoinput") {
          realV.push(device);
          count++;
        } else if (
          device.kind === "audioinput" &&
          device.deviceId == "default"
        ) {
          realAin.push(device);
          console.log("get device.");
        }
        if (device.kind === "audioinput") {
          console.log("audioDevice:", device);
        }
      }
      if (realV.length < 1) {
        alert("no device!");
        return;
      }
      //1680, 1050
      console.log("count:dffffffff", count);
      const mediaConstraints = {
        audio: true,
        video: {
          width: 1600,
          height: 900,
          deviceId: realV[0].deviceId,
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints
      );

      await mediaStream.getTracks().forEach((track) => {
        log("track4", track);
        peerConnection.addTrack(track, mediaStream);
      });

      return mediaStream;
    } catch (error) {
      console.error(error);
    }
  }

  function connect(event) {
    // event.preventDefault();

    // Hide form overlay
    // event.target.parentNode.classList.add('hidden');

    caller = fieldUsername.value;

    console.info(`Connecting ${caller}...`);

    // Connect to signaling server
    socket = io(
      "https://ec2-54-176-212-246.us-west-1.compute.amazonaws.com:443"
    );

    // We tell the server who we are
    sendToServer({
      name: caller,
      date: Date.now(),
      type: "username",
    });

    // When we receive the updated list of users we render them in the UI
    socket.on("users", (msg) => {
      const msgJSON = JSON.parse(msg);
      //     updateListElement(msgJSON.users, usersListElement)
    });

    // Listen to messages coming from signaling server
    socket.on("message", (msg) => {
      switch (msg.type) {
        case "offer":
          answerOffer(msg);
          break;

        case "answer":
          receiveAnswer(msg);
          break;

        case "ice-candidate":
          addICECandidate(msg);
          break;
      }
    });

    socket.on("connect", (msg) => {
      console.error("Connected");
    });
  }

  async function inviteToVideoCall(event) {
    // Check if we have an open connection already
    if (peerConnection) {
      console.warn("You already have a call open.");
    } else {
      receiver = event.target.getAttribute("data-target");

      if (receiver === caller) {
        alert("You can't call yourself.");
        return;
      }

      log("invite");
      peerConnection = createPeerConnection();

      // Requesting webcam access...
      localVideo.srcObject = await getLocalMedia(peerConnection);
    }
  }
  var videoIndex = 0;
  function createPeerConnection() {
    console.log(`${caller} inviting ${receiver} to video call...`);

    // Starts the peer connection
    const peerConnection = new RTCPeerConnection(servers);

    // Sends out our ICE candidate through our signaling server
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        sendToServer({
          type: "ice-candidate",
          target: receiver, // on the receiver side this is undefined.
          candidate: candidate,
        });
      }
    };

    // Creates an offer and sends it out through the signaling server
    peerConnection.onnegotiationneeded = createOffer;

    // When we get a track we add it to our remote video element

    peerConnection.ontrack = (event) => {
      console.error("-------------------------");
      console.log(event.transceiver.mid);
      console.log(event.streams);
      console.error("-------------------------");
      if (event.transceiver.mid == 0) {
        remoteVideo.srcObject = event.streams[0];
      }
      //  else if (event.transceiver.mid == 1) {
      //   remoteVideo2.srcObject = event.streams[0];
      // } else if (event.transceiver.mid == 2) {
      //   remoteVideo3.srcObject = event.streams[0];
      // }
    };

    return peerConnection;
  }

  async function createOffer() {
    console.log(`${caller} is creating an offer for ${receiver}`);

    try {
      // 1. Create an offer
      const offer = await peerConnection.createOffer();
      // 2. set the offer as local description
      await peerConnection.setLocalDescription(offer);
      // Send offer to remote peer
      sendToServer({
        name: caller,
        target: receiver,
        type: "offer",
        sdp: peerConnection.localDescription,
      });
    } catch (error) {
      console.error(`Error when creating the offer: ${error}`);
    }
  }

  async function answerOffer(msg) {
    // We save the reference of the people sending the offer
    const receiver = msg.name;

    console.log(`${caller} is creating an answer for ${receiver}`);

    // Start the PeerConnection
    log("answer");
    peerConnection = createPeerConnection();

    // 4. The recipient receives the offer and record it as the remote description
    try {
      await peerConnection.setRemoteDescription(msg.sdp);
      // 5. The recipient includes its stream to the connection
      localVideo.srcObject = await getLocalMedia(peerConnection);
      // 6. The recipient creates an answer
      const answer = await peerConnection.createAnswer();
      // 7. The recipient set the answer as its local description.
      await peerConnection.setLocalDescription(answer);
      // 8. The recipient uses the signaling server to send the answer to the caller.
      sendToServer({
        name: caller,
        target: receiver,
        type: "answer",
        sdp: peerConnection.localDescription,
      });
    } catch (error) {
      console.error(`Error when creating the answer: ${error}`);
    }
  }

  // This function i scalled when the caller receives an answer from the recipient about
  // the video call offer we sent
  async function receiveAnswer(msg) {
    console.log("handling answer ", msg);

    // 9. The caller receives the answer.
    // 10. The caller set the answer as the remote description. It know knows the
    // configuration of both peers. Media begins to flow as configured
    await peerConnection.setRemoteDescription(msg.sdp);
  }

  async function addICECandidate(msg) {
    const candidate = new RTCIceCandidate(msg.candidate);

    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error(error);
    }
  }

  /* DOM event listeners */

  // formLogin.addEventListener('submit', connect);
  connect();
  $(".form-overlay").hide();

  $(document).ready(() => {
    function fullScreen(element) {
      element.addEventListener("click", function () {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen();
        }
      });
    }

    fullScreen(document.getElementById("remote-video1"));
    fullScreen(document.getElementById("remote-video2"));
    fullScreen(document.getElementById("remote-video3"));
  });
})();
