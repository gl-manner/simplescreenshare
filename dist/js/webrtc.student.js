function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// client-side js
// run by the browser each time your view template is loaded
(function () {
  /* UI */
  var formLogin = document.getElementById('form-login');
  var fieldUsername = document.getElementById('username');
  var usersListElement = document.getElementById('users-list');
  var localVideo1 = document.getElementById('local-video1');
  var localVideo2 = document.getElementById('local-video2');
  var localVideo3 = document.getElementById('local-video3');
  var remoteVideo = document.getElementById('remote-video');
  /* Globals */

  var createOfferflag = 0;
  var socket;
  var caller;
  var receiver;
  var peerConnection;
  var mediaConstraints = {
    audio: false,
    video: {
      width: 1320,
      height: 820
    }
  };
  var servers = {
    'iceServers': [{
      'urls': 'stun:stun.stunprotocol.org:3478'
    }, {
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };
  /* Functions */

  function sendToServer(msg) {
    socket.emit('message', JSON.stringify(msg));
  }

  function updateListElement(usersArray, listElement) {
    var updatedList = usersArray.map(function (user) {
      if (user.name == fieldUsername.value) return "\n        <li class=\"user-item\">\n          " + user.name + "\n        </li>";else return "\n        <li class=\"user-item\">\n          " + user.name + " <button class=\"call\" data-target=\"" + user.name + "\">Call</button>\n        </li>";
    }).join(''); // Re-render user list

    listElement.innerHTML = updatedList; // Add event listeners to call button next to the user

    var callButtons = document.getElementsByClassName('call');
    Object.keys(callButtons).forEach(function (key) {
      return callButtons[key].addEventListener('click', inviteToVideoCall);
    });
  }

  function getScreenStream() {
    return new Promise(function (resolve) {
      if (navigator.getDisplayMedia) {
        console.log('-------------------------- 00000000000000000000');
        navigator.getDisplayMedia({
          video: true
        }).then(function (screenStream) {
          console.log('---------------------');
          resolve(screenStream);
        }).catch(function (error) {
          return console.log(error);
        });
      } else if (navigator.mediaDevices.getDisplayMedia) {
        console.log('-------------------------- 00000000000000000000 el');
        navigator.mediaDevices.getDisplayMedia({
          video: true
        }).then(function (screenStream) {
          console.log('found screen', screenStream);
          resolve(screenStream);
        }).catch(function (error) {
          return console.error(error);
        });
      } else {
        console.log('-------------------------- 00000000000000000000 else0');
        getScreenId(function (error, sourceId, screen_constraints) {
          navigator.mediaDevices.getUserMedia(screen_constraints).then(function (screenStream) {
            resolve(screenStream);
          });
        });
      }
    });
  }

  function getLocalMedia(_x) {
    return _getLocalMedia.apply(this, arguments);
  }

  function _getLocalMedia() {
    _getLocalMedia = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(peerConnection) {
      var devices, realV, i, device, mediaConstraints1, mediaStream, mediaConstraints2, mediaStream2, mediaConstraints3, mediaStream3;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              console.log("hkdjlfkjslkdjflskj;dfklsjdljflsdffffffffffff");
              _context.next = 4;
              return navigator.mediaDevices.enumerateDevices();

            case 4:
              devices = _context.sent;
              ;
              console.log("Devices", devices);
              realV = [];

              for (i = 0; i < devices.length; i++) {
                device = devices[i];

                if (device.kind === 'videoinput') {
                  realV.push(device);
                }
              }

              console.log("realV", realV);

              if (realV.length < 3) {
                alert("more devices"); //    return;
              } //1320, 820


              mediaConstraints1 = {
                audio: false,
                video: {
                  width: 400,
                  height: 300,
                  deviceId: realV[0].deviceId
                }
              };
              _context.next = 14;
              return navigator.mediaDevices.getUserMedia(mediaConstraints1);

            case 14:
              mediaStream = _context.sent;
              console.log("first:", mediaStream);
              mediaConstraints2 = {
                audio: false,
                video: {
                  width: 400,
                  height: 300,
                  deviceId: realV[0].deviceId
                }
              };
              _context.next = 19;
              return navigator.mediaDevices.getUserMedia(mediaConstraints2);

            case 19:
              mediaStream2 = _context.sent;
              //await getScreenStream();
              console.log("second:", mediaStream2);
              mediaConstraints3 = {
                audio: false,
                video: {
                  width: 400,
                  height: 300,
                  deviceId: realV[0].deviceId
                }
              };
              _context.next = 24;
              return navigator.mediaDevices.getUserMedia(mediaConstraints3);

            case 24:
              mediaStream3 = _context.sent;
              console.log("third:", mediaStream3);
              mediaStream.getTracks().forEach(function (track) {
                log('track', track);
                peerConnection.addTrack(track, mediaStream);
              });
              mediaStream2.getTracks().forEach(function (track) {
                log('track2', track);
                peerConnection.addTrack(track, mediaStream2);
              });
              mediaStream3.getTracks().forEach(function (track) {
                log('track3', track);
                peerConnection.addTrack(track, mediaStream3);
              });
              localVideo1.srcObject = mediaStream;
              localVideo2.srcObject = mediaStream2;
              localVideo3.srcObject = mediaStream3;
              _context.next = 37;
              break;

            case 34:
              _context.prev = 34;
              _context.t0 = _context["catch"](0);
              console.error(_context.t0);

            case 37:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 34]]);
    }));
    return _getLocalMedia.apply(this, arguments);
  }

  function connect(event) {
    // event.preventDefault();
    // Hide form overlay
    // event.target.parentNode.classList.add('hidden');
    caller = fieldUsername.value;
    console.info("Connecting " + caller + "..."); // Connect to signaling server

    socket = io('https://localhost:433'); // We tell the server who we are

    sendToServer({
      name: caller,
      date: Date.now(),
      type: 'username'
    }); // When we receive the updated list of users we render them in the UI

    socket.on('users', function (msg) {
      var msgJSON = JSON.parse(msg);
      console.log("updatelist", msgJSON.users);
      updateListElement(msgJSON.users, usersListElement);
    }); // Listen to messages coming from signaling server

    socket.on('message', function (msg) {
      switch (msg.type) {
        case 'offer':
          answerOffer(msg);
          break;

        case 'answer':
          receiveAnswer(msg);
          break;

        case 'ice-candidate':
          addICECandidate(msg);
          break;
      }
    });
  }

  function inviteToVideoCall(_x2) {
    return _inviteToVideoCall.apply(this, arguments);
  }

  function _inviteToVideoCall() {
    _inviteToVideoCall = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(event) {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!peerConnection) {
                _context2.next = 4;
                break;
              }

              console.log('You already have a call open.');
              _context2.next = 12;
              break;

            case 4:
              receiver = event.target.getAttribute('data-target');

              if (!(receiver === caller)) {
                _context2.next = 8;
                break;
              }

              alert("You can't call yourself.");
              return _context2.abrupt("return");

            case 8:
              peerConnection = createPeerConnection(); // Requesting webcam access...

              console.log("invite to call-----------------");
              _context2.next = 12;
              return getLocalMedia(peerConnection);

            case 12:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));
    return _inviteToVideoCall.apply(this, arguments);
  }

  function createPeerConnection() {
    console.log(caller + " inviting " + receiver + " to video call..."); // Starts the peer connection

    var peerConnection = new RTCPeerConnection(servers); // Sends out our ICE candidate through our signaling server

    peerConnection.onicecandidate = function (_ref) {
      var candidate = _ref.candidate;

      if (candidate) {
        sendToServer({
          type: 'ice-candidate',
          target: receiver,
          // on the receiver side this is undefined.
          candidate: candidate
        });
      }
    }; // Creates an offer and sends it out through the signaling server


    peerConnection.onnegotiationneeded = createOffer; // When we get a track we add it to our remote video element

    peerConnection.ontrack = function (event) {
      remoteVideo.srcObject = event.streams[0];
      log('event.streams: ' + event.streams.length);
    };

    return peerConnection;
  }

  function createOffer() {
    return _createOffer.apply(this, arguments);
  }

  function _createOffer() {
    _createOffer = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee3() {
      var offer;
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              if (!(createOfferflag == 1)) {
                _context3.next = 4;
                break;
              }

              return _context3.abrupt("return");

            case 4:
              createOfferflag = 1;

            case 5:
              console.log(caller + " is creating an offer for " + receiver);
              _context3.prev = 6;
              _context3.next = 9;
              return peerConnection.createOffer();

            case 9:
              offer = _context3.sent;
              _context3.next = 12;
              return peerConnection.setLocalDescription(offer);

            case 12:
              // Send offer to remote peer
              sendToServer({
                name: caller,
                target: receiver,
                type: 'offer',
                sdp: peerConnection.localDescription
              });
              _context3.next = 20;
              break;

            case 15:
              _context3.prev = 15;
              _context3.t0 = _context3["catch"](6);
              console.error("Error when creating the offer: " + _context3.t0);
              log("Error when creating the offer: " + _context3.t0);
              console.trace('error');

            case 20:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[6, 15]]);
    }));
    return _createOffer.apply(this, arguments);
  }

  function answerOffer(_x3) {
    return _answerOffer.apply(this, arguments);
  } // This function i scalled when the caller receives an answer from the recipient about
  // the video call offer we sent


  function _answerOffer() {
    _answerOffer = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee4(msg) {
      var receiver, answer;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              // We save the reference of the people sending the offer
              receiver = msg.name;
              console.log(caller + " is creating an answer for " + receiver); // Start the PeerConnection

              peerConnection = createPeerConnection(); // 4. The recipient receives the offer and record it as the remote description

              _context4.prev = 3;
              _context4.next = 6;
              return peerConnection.setRemoteDescription(msg.sdp);

            case 6:
              // 5. The recipient includes its stream to the connection
              console.log("answerOffer--------------------------");
              _context4.next = 9;
              return getLocalMedia(peerConnection);

            case 9:
              _context4.next = 11;
              return peerConnection.createAnswer();

            case 11:
              answer = _context4.sent;
              _context4.next = 14;
              return peerConnection.setLocalDescription(answer);

            case 14:
              // 8. The recipient uses the signaling server to send the answer to the caller.
              sendToServer({
                name: caller,
                target: receiver,
                type: 'answer',
                sdp: peerConnection.localDescription
              });
              _context4.next = 20;
              break;

            case 17:
              _context4.prev = 17;
              _context4.t0 = _context4["catch"](3);
              console.error("Error when creating the answer: " + _context4.t0);

            case 20:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, null, [[3, 17]]);
    }));
    return _answerOffer.apply(this, arguments);
  }

  function receiveAnswer(_x4) {
    return _receiveAnswer.apply(this, arguments);
  }

  function _receiveAnswer() {
    _receiveAnswer = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee5(msg) {
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              console.log('handling answer ', msg); // 9. The caller receives the answer.
              // 10. The caller set the answer as the remote description. It know knows the
              // configuration of both peers. Media begins to flow as configured

              _context5.next = 3;
              return peerConnection.setRemoteDescription(msg.sdp);

            case 3:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    }));
    return _receiveAnswer.apply(this, arguments);
  }

  function addICECandidate(_x5) {
    return _addICECandidate.apply(this, arguments);
  }
  /* DOM event listeners */
  // formLogin.addEventListener('submit', connect);


  function _addICECandidate() {
    _addICECandidate = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee6(msg) {
      var candidate;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              candidate = new RTCIceCandidate(msg.candidate);
              _context6.prev = 1;
              _context6.next = 4;
              return peerConnection.addIceCandidate(candidate);

            case 4:
              _context6.next = 9;
              break;

            case 6:
              _context6.prev = 6;
              _context6.t0 = _context6["catch"](1);
              console.error(_context6.t0);

            case 9:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6, null, [[1, 6]]);
    }));
    return _addICECandidate.apply(this, arguments);
  }

  connect();
  $('.form-overlay').hide(); // $('#btn_addCamera').click(async () => {
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
//# sourceMappingURL=webrtc.student.js.map