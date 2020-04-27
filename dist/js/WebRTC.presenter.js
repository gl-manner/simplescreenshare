function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// client-side js
// run by the browser each time your view template is loaded
(function () {
  /* UI */
  var fieldUsername = document.getElementById('username');
  var usersListElement = document.getElementById('users-list');
  var localVideo = document.getElementById('local-video');
  var remoteVideo = document.getElementById('remote-video1');
  var remoteVideo2 = document.getElementById('remote-video2');
  var remoteVideo3 = document.getElementById('remote-video3');
  /* Globals */

  var socket;
  var caller;
  var receiver;
  var peerConnection;
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

  function getLocalMedia(_x) {
    return _getLocalMedia.apply(this, arguments);
  }

  function _getLocalMedia() {
    _getLocalMedia = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee(peerConnection) {
      var devices, realV, i, device, mediaConstraints, mediaStream;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return navigator.mediaDevices.enumerateDevices();

            case 3:
              devices = _context.sent;
              realV = [];

              for (i = 0; i < devices.length; i++) {
                device = devices[i];

                if (device.kind === 'videoinput') {
                  realV.push(device);
                }
              }

              if (!(realV.length < 1)) {
                _context.next = 9;
                break;
              }

              alert("no device!");
              return _context.abrupt("return");

            case 9:
              mediaConstraints = {
                audio: false,
                video: {
                  width: 1680,
                  height: 1050,
                  deviceId: realV[0].deviceId
                }
              };
              _context.next = 12;
              return navigator.mediaDevices.getUserMedia(mediaConstraints);

            case 12:
              mediaStream = _context.sent;
              mediaStream.getTracks().forEach(function (track) {
                peerConnection.addTrack(track, mediaStream);
              });
              return _context.abrupt("return", mediaStream);

            case 17:
              _context.prev = 17;
              _context.t0 = _context["catch"](0);
              console.error(_context.t0);

            case 20:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 17]]);
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
    socket.on('connect', function (msg) {
      console.error('Connected');
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

              console.warn('You already have a call open.');
              _context2.next = 13;
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
              log('invite');
              peerConnection = createPeerConnection(); // Requesting webcam access...

              _context2.next = 12;
              return getLocalMedia(peerConnection);

            case 12:
              localVideo.srcObject = _context2.sent;

            case 13:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));
    return _inviteToVideoCall.apply(this, arguments);
  }

  var videoIndex = 0;

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
      console.error('-------------------------');
      console.log(event.transceiver.mid);
      console.log(event.streams);
      console.error('-------------------------');

      if (event.transceiver.mid == 0) {
        remoteVideo.srcObject = event.streams[0];
      }

      if (event.transceiver.mid == 1) {
        remoteVideo2.srcObject = event.streams[0];
      }

      if (event.transceiver.mid == 2) {
        remoteVideo3.srcObject = event.streams[0];
      }
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
              console.log(caller + " is creating an offer for " + receiver);
              _context3.prev = 1;
              _context3.next = 4;
              return peerConnection.createOffer();

            case 4:
              offer = _context3.sent;
              _context3.next = 7;
              return peerConnection.setLocalDescription(offer);

            case 7:
              // Send offer to remote peer
              sendToServer({
                name: caller,
                target: receiver,
                type: 'offer',
                sdp: peerConnection.localDescription
              });
              _context3.next = 13;
              break;

            case 10:
              _context3.prev = 10;
              _context3.t0 = _context3["catch"](1);
              console.error("Error when creating the offer: " + _context3.t0);

            case 13:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[1, 10]]);
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

              log('answer');
              peerConnection = createPeerConnection(); // 4. The recipient receives the offer and record it as the remote description

              _context4.prev = 4;
              _context4.next = 7;
              return peerConnection.setRemoteDescription(msg.sdp);

            case 7:
              _context4.next = 9;
              return getLocalMedia(peerConnection);

            case 9:
              localVideo.srcObject = _context4.sent;
              _context4.next = 12;
              return peerConnection.createAnswer();

            case 12:
              answer = _context4.sent;
              _context4.next = 15;
              return peerConnection.setLocalDescription(answer);

            case 15:
              // 8. The recipient uses the signaling server to send the answer to the caller.
              sendToServer({
                name: caller,
                target: receiver,
                type: 'answer',
                sdp: peerConnection.localDescription
              });
              _context4.next = 21;
              break;

            case 18:
              _context4.prev = 18;
              _context4.t0 = _context4["catch"](4);
              console.error("Error when creating the answer: " + _context4.t0);

            case 21:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, null, [[4, 18]]);
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
  $('.form-overlay').hide();
  $(document).ready(function () {
    function fullScreen(element) {
      element.addEventListener('click', function () {
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

    fullScreen(document.getElementById('remote-video1'));
    fullScreen(document.getElementById('remote-video2'));
    fullScreen(document.getElementById('remote-video3'));
  });
})();
//# sourceMappingURL=webrtc.presenter.js.map