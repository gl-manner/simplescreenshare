// client-side js
// run by the browser each time your view template is loaded

(function () {
  /* UI */

  const formLogin = document.getElementById("form-login");
  const fieldUsername = document.getElementById("username");
  const usersListElement = document.getElementById("users-list");
  const localVideo1 = document.getElementById("local-video1");
  const localVideo2 = document.getElementById("local-video2");
  const localVideo3 = document.getElementById("local-video3");
  const remoteVideo = document.getElementById("remote-video");
  // const remoteAudio = document.getElementById('remoteAudio');

  /* Globals */
  var createOfferflag = 0;

  let socket;
  let caller;
  let receiver;
  let peerConnection;
  const mediaConstraints = {
    audio: false,
    video: { width: 1320, height: 820 },
  };
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
  function getScreenStream() {
    return new Promise((resolve) => {
      if (navigator.getDisplayMedia) {
        console.log("-------------------------- 00000000000000000000");
        navigator
          .getDisplayMedia({
            video: true,
          })
          .then((screenStream) => {
            console.log("---------------------");
            resolve(screenStream);
          })
          .catch((error) => console.log(error));
      } else if (navigator.mediaDevices.getDisplayMedia) {
        console.log("-------------------------- 00000000000000000000 el");
        navigator.mediaDevices
          .getDisplayMedia({
            video: true,
          })
          .then((screenStream) => {
            console.log("found screen", screenStream);
            resolve(screenStream);
          })
          .catch((error) => console.error(error));
      } else {
        console.log("-------------------------- 00000000000000000000 else0");
        getScreenId(function (error, sourceId, screen_constraints) {
          navigator.mediaDevices
            .getUserMedia(screen_constraints)
            .then(function (screenStream) {
              resolve(screenStream);
            });
        });
      }
    });
  }

  async function getLocalMedia(peerConnection) {
    try {
      console.log("hkdjlfkjslkdjflskj;dfklsjdljflsdffffffffffff");

      var devices = await navigator.mediaDevices.enumerateDevices();
      console.log("Devices", devices);
      var realV = [];
      var realAin = [];
      var realAout = [];
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
        }
        // else if(device.kind === 'audiooutput' && device.deviceId == "default"){
        //   realAout.push(device);
        // }
      }
      console.log("realV", realV);
      // console.log("realAin", realAin);
      // console.log("realAout", realAout);
      if (realV.length < 3) {
        alert("more devices");
        //    return;
      }
      //1320, 820

      console.log("default audio", realAin);
      const mediaConstraints1 = {
        audio: false,
        video: {
          width: 1600,
          height: 900,
          deviceId: realV[0].deviceId,
        },
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(
        mediaConstraints1
      );
      console.log("first:", mediaStream);
      // const mediaConstraints2 = {
      //   audio: false,
      //   video: { width: 1600, height: 900, deviceId: realV[2].deviceId },
      // };
      // const mediaStream2 = await navigator.mediaDevices.getUserMedia(
      //   mediaConstraints2
      // ); //await getScreenStream();
      // console.log("second:", mediaStream2);
      // const mediaConstraints3 = {
      //   audio: true,
      //   video: { width: 1600, height: 900, deviceId: realV[3].deviceId },
      // };
      // const mediaStream3 = await navigator.mediaDevices.getUserMedia(
      //   mediaConstraints3
      // );
      // console.log("third:", mediaStream3);
      // const mediaConstraints4 = { audio: { deviceId: realAin[0].deviceId }, video: true };
      // const mediaStream4 = await navigator.mediaDevices.getUserMedia(mediaConstraints4);
      // console.log("fourth-audio:", mediaStream4);
      // const mediaConstraints5 = { audio: { deviceId: realAout[0].deviceId } };
      // const mediaStream5 = await navigator.mediaDevices.getUserMedia(mediaConstraints5);
      // console.log("third:", mediaStream5);

      mediaStream.getTracks().forEach((track) => {
        log("track", track);
        peerConnection.addTrack(track, mediaStream);
      });
      // mediaStream2.getTracks().forEach((track) => {
      //   log("track2", track);
      //   peerConnection.addTrack(track, mediaStream2);
      // });
      // mediaStream3.getTracks().forEach((track) => {
      //   log("track3", track);
      //   peerConnection.addTrack(track, mediaStream3);
      // });
      // mediaStream4.getTracks().forEach(track => {
      //   log('track4', track)
      //   peerConnection.addTrack(track, mediaStream4);
      // });

      // mediaStream5.getTracks().forEach(track => {
      //   log('track5', track)
      //   peerConnection.addTrack(track, mediaStream5);
      // });

      localVideo1.srcObject = mediaStream;
      // localVideo2.srcObject = mediaStream2;
      // localVideo3.srcObject = mediaStream3;
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
      console.log("updatelist", msgJSON.users);
      updateListElement(msgJSON.users, usersListElement);
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
  }

  async function inviteToVideoCall(event) {
    // Check if we have an open connection already
    if (peerConnection) {
      console.log("You already have a call open.");
    } else {
      receiver = event.target.getAttribute("data-target");

      if (receiver === caller) {
        alert("You can't call yourself.");
        return;
      }

      peerConnection = createPeerConnection();

      // Requesting webcam access...
      console.log("invite to call-----------------");
      await getLocalMedia(peerConnection);
    }
  }

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
        console.log("received Video!!!");
        remoteVideo.srcObject = event.streams[0];
      }
      // else if (event.transceiver.mid == 1) {
      //   console.log('received Audio!!!');
      //   remoteAudio.srcObject = event.streams[0];
      // }
    };
    return peerConnection;
  }

  async function createOffer() {
    if (createOfferflag == 1) return;
    else createOfferflag = 1;

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
      log(`Error when creating the offer: ${error}`);
      console.trace("error");
    }
  }

  async function answerOffer(msg) {
    // We save the reference of the people sending the offer
    const receiver = msg.name;

    console.log(`${caller} is creating an answer for ${receiver}`);

    // Start the PeerConnection
    peerConnection = createPeerConnection();

    // 4. The recipient receives the offer and record it as the remote description
    try {
      await peerConnection.setRemoteDescription(msg.sdp);
      // 5. The recipient includes its stream to the connection
      console.log("answerOffer--------------------------");
      await getLocalMedia(peerConnection);
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
  // $('#btn_addCamera').click(async () => {
  //   if (peerConnection == null) {
  //     alert("Not connected peer")
  //     return;
  //   }
  //   // const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

  //   // mediaStream.getTracks().forEach(track => {
  //   //   log('track', track)
  //   //   peerConnection.addTrack(track, mediaStream);
  //   // });
  //   const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  //   var videoTrack = mediaStream.getVideoTracks()[0];

  //   peerConnection.addTrack(videoTrack, mediaStream);
  // })
})();
