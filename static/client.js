var name, Connected_User;
var peer_nick_name;
var connection = new WebSocket('ws://engineeringsemester.com');
var filelist;
var m_user_sucess = false;

/************************************************************
 *	Description : HTML page querySelector variables
 *	DocumentOwner  : vinay kp
 *************************************************************/
var m_LoginPage = document.querySelector('#login-page'),
    m_UsernameInput = document.querySelector('#username'),
    m_LoginButton = document.querySelector('#loginbt'),
    m_CallPage = document.querySelector('#video-page'),
    m_OnlineUser = document.querySelector(".chat-sidebar"),
	m_NewOnlineUser = document.querySelector(".member_list"),
    m_PeerUsernameInput = document.querySelector('#their-username'),
    m_CallButton = document.querySelector('#call'),
    m_HangUpButton = document.querySelector('#hang-up'),
    m_NoofUser = document.querySelector('#usercount');

m_CallPage.style.display = "none";
m_OnlineUser.style.display = "none";
m_LoginPage.style.display = "block";

/************************************************************
 *	Description : webRTCDataChannel global variables
 *	DocumentOwner  : vinay kp
 *************************************************************/
var m_Send_button = document.querySelector('#send'),
    m_Send_message = document.querySelector('#message'),
    m_receive = document.querySelector('.chat_area'),
    m_OnlineUserName = document.querySelector(".member_list"),
    m_upload_send = document.querySelector('#upload-send'),
    m_upload_status_text = document.querySelector('#upload-status'),
    dataChannel;

/************************************************************
 *	Description : webRTCPeerConnection global variables
 *	DocumentOwner  : vinay kp
 *************************************************************/
var m_my_Connection, theirConnection, stream, Connected_User,
    m_client_Video = document.querySelector('#yours'),
    m_PeerVideo = document.querySelector('#theirs');

/*Time out events starts when refresh/leave the browser tab */

function user_quitting() {

    // user quit , send request to server
    if (m_user_sucess) {

        send({
            type: "quit",
            name: name
        });
    }
}

function warning() {

    user_quitting();
    return null;
}

window.onbeforeunload = warning;

/*Time out events end*/


/************************************************************
 *	Function 	: onopen
 *	Description : og function
 *	DocumentOwner  : vinay kp
 *************************************************************/
connection.onopen = function() {
    console.log("Connected");
};

/**************************************************************
 *	Function 	: connection.onmessage
 *	Description : Check the stages of WebRTC Connections .
 *	DocumentOwner  : vinay kp
 ***************************************************************/
// Handle all messages through this callback
connection.onmessage = function(message) {
    console.log("Got message", message.data);
    var data = JSON.parse(message.data);

    switch (data.type) {
        case "login":
            console.log("user validation sucess");
			Login_User(data.success);
            break;
        case "offer":
            Client_Offer(data.offer, data.name);
            break;

        case "answer":
            Client_Answer(data.answer);
            break;

        case "candidate":
            Client_Candidate(data.candidate);
            break;

        case "leave":
            Client_Leave();
            break;

        case "nouser":
            client_invalid(data.success);
            break;

        case "busyuser":
            client_busy();
            break;

        case "userlist":
            user_list_add(data.name);
            break;

        default:
            break;
    }
};

function user_list_add(username) {
    console.log("receiving user list = "+username);
    m_OnlineUserName.innerHTML = "";
    if (username.length > 1) { //more than 1 user

        m_NoofUser.innerHTML = "";
        m_NoofUser.innerHTML += (username.length - 1) + " participants";
    } else //single user
    {
        m_NoofUser.innerHTML = "";
        m_NoofUser.innerHTML += "0 participants";
    }
    for (i = 0; i < username.length; i++) { //update the user list tab
        if (name != username[i]) {
			var peername = username[i];
			m_OnlineUserName.innerHTML +="<ul class='list-unstyled'><li class='left clearfix'><span class='chat-img pull-left'>"
			+"<img src='https://lh6.googleusercontent.com/-y-MY2satK-E/AAAAAAAAAAI/AAAAAAAAAJU/ER_hFddBheQ/photo.jpg' alt='User Avatar' class='img-circle'></span>"
			+"<div class='chat-body clearfix'><div class='header_sec'><div class='header_sec'><strong class='primary-font'>" + username[i] + "</strong>"
			+"<a href='#' onclick='javascript:calluser(\""+peername+"\");' class='btn btn-info btn-sm'><span class='glyphicon glyphicon-facetime-video'></span></a>"
			+"</div></div> </li></ul>";

        }
    }
}

/************************************************************
 *	Function 	: onerror
 *	Description : error handling
 *	DocumentOwner  : vinay kp
 *************************************************************/
connection.onerror = function(err) {
	$('#myModal').modal('show');
    console.log("Got error", err);
};

/************************************************************
 *	Function 	: Login_User
 *	Description : Check the user login is sucess or not .
 *	DocumentOwner  : vinay kp
 *************************************************************/
function Login_User(success) {

    if (success == false) {
		bootbox.alert("Login unsuccessful, please try a different name");
       // alert("Login unsuccessful, please try a different name.");
    } else {
		//alert("Login successful");
        m_user_sucess = true;
        //block user page
        m_LoginPage.style.display = "none";
        //enable call page
        m_CallPage.style.display = "block";
        //enable user list page
        m_OnlineUser.style.display = "block";
        //ready for a call
        startConnection();
    }
};

//calling a invalid client .

function client_invalid(success) {
    if (success == false) {
        bootbox.alert("No such user present !! .. please try differnt user");
        console.log("Invalid user .. no user present");
        reset_candidate();
    }
};

//client response => i am not internesting to answer your call .

function client_busy() {
    console.log("client is busy");
    bootbox.alert("user is not interested in your call !!");
    //block all user list
    m_OnlineUser.style.display = "block";

    reset_candidate();
}

//reset my  all objects and create a new connecion .

function reset_candidate() {
    Connected_User = null;
    m_PeerVideo.src = null;
    m_my_Connection.onicecandidate = null;
    m_my_Connection.onaddstream = null;
    m_my_Connection.close();
    My_setup_Peer_Connection(stream);

}

/************************************************************
 *	Function 	: Client_Offer
 *	Description :
 *	DocumentOwner  : vinay kp
 *************************************************************/

function Client_Offer(offer, name) {
    ////when somebody wants to call us
    var audio = document.querySelector('#bflat');
    audio.play();
	var Message = name + ' is calling you ... Accept Video call Now ? ';
	bootbox.confirm({
        message: Message,
        buttons: {
            "confirm": {
                label: "<i class='glyphicon glyphicon-facetime-video'></i> Accept",
                className: "btn-success btn btn-info btn-lg"
            },
            "cancel": {
                label: "<i class='glyphicon glyphicon-ban-circle'></i> Cancel",
                className: "btn-danger btn btn-info btn-lg"
            },
        },
        callback:function(result) {
			if (result) {
				console.log("User confirmed dialog");
				console.log("connection accepted");
				//block all user list
				m_OnlineUser.style.display = "none";
				audio.currentTime = 0;
				audio.pause();
				Connected_User = name;
				m_my_Connection.setRemoteDescription(new RTCSessionDescription(offer));

        m_my_Connection.createAnswer(function(answer) {
            console.log("creating answer request");
					     m_my_Connection.setLocalDescription(answer);
					     send({
						      type: "answer",
						      answer: answer
					     });
				    }, failure_Client_Offer);

			} else {
				console.log("User declined dialog");
				console.log("connection not accepted");
				audio.currentTime = 0;
				audio.pause();
				send({
					type: "busy",
					name: name
				});
			}
		}
    });
}

/************************************************************
 *	Function 	: Client_Answer
 *	Description :
 *	DocumentOwner  : vinay kp
 *************************************************************/
function Client_Answer(answer) {
    //when another user answers to our offer
    console.log("Client_Answer function");
    m_my_Connection.setRemoteDescription(new RTCSessionDescription(answer));
}

/************************************************************
 *	Function 	: Client_Candidate
 *	Description :
 *	DocumentOwner  : vinay kp
 *************************************************************/
function Client_Candidate(candidate) {
    //when we got ice candidate from another user
    m_my_Connection.addIceCandidate(new RTCIceCandidate(candidate));
}

/************************************************************
 *	Function 	: Client_Leave
 *	Description :
 *	DocumentOwner  : vinay kp
 *************************************************************/
function Client_Leave() {
    console.log("Client left call");
    Connected_User = null;
    m_PeerVideo.src = null;
    m_my_Connection.onicecandidate = null;
    m_my_Connection.onaddstream = null;
    m_my_Connection.close();
    My_setup_Peer_Connection(stream);
}

/************************************************************
 *	Function 	: send
 *	Description : Send messages between server and client .
 *	DocumentOwner  : vinay kp
 *************************************************************/
// Alias for sending messages in JSON format
function send(message) {

    if (Connected_User) {
        message.name = Connected_User;
    }

    connection.send(JSON.stringify(message));
};
/************************************************************
 *	Function 	: addEventListener
 *	Description : Login button event handler .
 *	DocumentOwner  : vinay kp
 *************************************************************/
// Login when the user clicks the button
m_LoginButton.addEventListener("click", function(event) {

    name = m_UsernameInput.value;
    if (name.length > 0) {
        send({
            type: "login",
            name: name
        });
    }
});


/************************************************************
 *	Function 	: addEventListener
 *	Description : call button event handler
 *	DocumentOwner  : vinay kp
 *************************************************************/

function calluser(user) {
	console.log("call user function called");
    //var peer_UserName = user.text;
	var peer_UserName = user;
	console.log("user trying to call peer = "+peer_UserName);
    if (peer_UserName.length > 0) {
        //disbale user list page
        m_OnlineUser.style.display = "none";
        My_Start_Peer_Connection(peer_UserName);
    }
}


/*m_CallButton.addEventListener("click", function() {
    var peer_UserName = m_PeerUsernameInput.value;

    if (peer_UserName.length > 0) {
        My_Start_Peer_Connection(peer_UserName);
    }
});
*/
/************************************************************
 *	Function 	: addEventListener
 *	Description : HangUpButton event handler
 *	DocumentOwner  : vinay kp
 *************************************************************/
m_HangUpButton.addEventListener("click", function() {
    //enable user list page
    m_OnlineUser.style.display = "block";

    send({
        type: "leave"
    });
    m_receive.innerHTML = '';
    Client_Leave();
});

/************************************************************
 *	Function 	: send button click
 *	Description : EventListener for send text
 *	DocumentOwner  : vinay kp
 *************************************************************/

// Bind our text input and received area
m_Send_button.addEventListener("click", function(event) {

    var val = m_Send_message.value;

    if ((m_Send_message.defaultValue != val) && (val != '')) {
        m_Send_message.value = "";
        m_receive.innerHTML += "You : " + val + "<br />";
        m_receive.scrollTop = m_receive.scrollHeight;
        dataChannelSend({
            type: "message",
            data: val
        });
        //dataChannel.send(val);
    }
});


/****************************************************************************
*	Function 	: hasUserMedia
*	Description : check whether browser is compatible with webRTC user
				  media.
*	DocumentOwner  : vinay kp
*****************************************************************************/
function hasUserMedia() {
    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    return !!navigator.getUserMedia;
};

/*****************************************************************************
*	Function 	: hasRTCPeerConnection
*	Description : check whether browser is compatible with RTCPeerConnection
				  API .
*	DocumentOwner  : vinay kp
******************************************************************************/
function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;

    return !!window.RTCPeerConnection;
};

/************************************************************
 *	Function 	: startConnection
 *	Description :
 *	DocumentOwner  : vinay kp
 *************************************************************/
function startConnection() {

    if (hasUserMedia()) {

        navigator.getUserMedia({
            video: true,
            audio: false
        }, function(my_stream) {
            //store the stream
            stream = my_stream;
            m_client_Video.src = window.URL.createObjectURL(stream);

            var mediaStreamTrack = stream.getVideoTracks()[0];

            if (typeof mediaStreamTrack != "undefined") {

                mediaStreamTrack.onended = function() {
                    //for Chrome.
                    errorMessage('Your webcam is busy!')
                }
            } else errorMessage('Permission denied!');

            if (hasRTCPeerConnection()) {
                console.log("calling My_setup_Peer_Connection()");
                My_setup_Peer_Connection(stream);
            } else {
                alert("Sorry, your browser does not support WebRTC");
            }

        }, function(e) {

            var message;
            //cases for handling camera errors
            switch (e.name) {
                case 'NotFoundError':
                case 'DevicesNotFoundError':
                    message = 'No webcam Found ! Please setup your webcam first.';
                    break;
                case 'SourceUnavailableError':
                    message = 'Your webcam is busy ! Close or restart your webcam first ';
                    break;
                case 'PermissionDeniedError':
                case 'SecurityError':
                    message = 'Your camera Permission denied ! Please Enable your webcam ';
                    break;
                default:
                    errorMessage('Rejected your camera acess !', e);
                    return;
            }
            errorMessage(message);
        });


    } else errorMessage('Sorry, your browser does not support WebRTC ! please update your Browser ');
}

/**************************************************************************
*	Function 	: My_setup_Peer_Connection
*	Description : setting up the peer connection will be transferring
				  the ICE candidates between the peers so that they can
				  connect to each other .
*	DocumentOwner  : vinay kp
****************************************************************************/
function My_setup_Peer_Connection(stream) {
	 console.log("My_setup_Peer_Connection called");
    //ICE server
    var configuration = {
        "iceServers": [
          {
            "url": "stun:stun.1.google.com:19302"
          },
          {
            url: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
          }
      ]
    };
    //RTCPeerConnection
    m_my_Connection = new RTCPeerConnection(configuration, {
        optional: []
    });
    // Setup stream listening

    /* if (m_CallButton.disabled == true) {
        m_CallButton.disabled = false;
    } */

    m_my_Connection.addStream(stream);
    m_my_Connection.onaddstream = remoteStreamAdded;
    m_my_Connection.onicecandidate = icecandidateAdded;

    openDataChannel();
}

/********************************************************

**********************************************************/
function icecandidateAdded(ev) {
    if (ev.candidate) {
        send({
            type: "candidate",
            candidate: ev.candidate
        });
    }
};

/********************************************************

**********************************************************/
function remoteStreamAdded(ev) {
    m_PeerVideo.src = window.URL.createObjectURL(ev.stream);
    //m_CallButton.disabled = true;
}

/*********************************************************************
*	Function    : My_Start_Peer_Connection
*	Description : Intialiting offer setup of webRTC and Creating the
				  SDP offer and response answer . other user has to
				  accept the incoming call before a connection is
				  established between the two users.
*	DocumentOwner  : vinay kp
**********************************************************************/
function My_Start_Peer_Connection(user) {
    Connected_User = user;
    console.log("My_Start_Peer_Connection started");
    console.log("connection =" + m_my_Connection);
    // Begin the offer
    m_my_Connection.createOffer(function(offer) {
        console.log("offer started");
        send({
            type: "offer",
            offer: offer
        });
        m_my_Connection.setLocalDescription(offer, success2, failure_offer);
        //m_CallButton.disabled = true ;


    }, failure_My_Start_Peer_Connection);
}
/************************************************************
 *	Function 	: openDataChannel
 *	Description : webRTCDataChannel API implementations
 *	DocumentOwner  : vinay kp
 *************************************************************/
function openDataChannel() {
	console.log("Data Channel openDataChannel()");
    var dataChannelOptions = {
        ordered: true,
        reliable: true,
        negotiated: true,
        id: "myChannel"
    };

    dataChannel = m_my_Connection.createDataChannel("myLabel", dataChannelOptions);

    dataChannel.onerror = function(error) {
        console.log("Data Channel Error:", error);
    };

    dataChannel.onmessage = function(event) {
        //file messages
        try {

            var msg = JSON.parse(event.data);

            if (msg.type === 'file') {
                //handle file send/receive request
                //didn't handle file request in signaling setActive
                //if you want , you can add on signaling server and that request should handle in client side.
            } else {

                switch (msg.type) {

                    case "initial":
                        Enable_all_buttons();
                        console.log("Got Data Channel Message type:", msg.type);
                        //m_receive.innerHTML += msg.data + "  is connected" + "<br />";
						            m_receive.innerHTML += "<li class='left clearfix'><div class='chat-body1 clearfix'>"
						                  +"<p>"+msg.data+":is connected</p>"
						                  +"<div class='chat_time pull-right'>09:40PM</div></div></li>";
                        peer_nick_name = msg.data;
                        m_receive.scrollTop = m_receive.scrollHeight;

                        break;

                    case "message":

                        console.log("Got Data Channel Message type:", msg.type);
                        m_receive.innerHTML += peer_nick_name + " : " + msg.data + "<br />";
                        m_receive.scrollTop = m_receive.scrollHeight;

                        break;

                }
            }
        } catch (e) {}

    };

    dataChannel.onopen = function() {
        dataChannelSend({
            type: "initial",
            data: name
        });
        //dataChannel.send(name + " has connected.");
    };
    dataChannel.onclose = function() {
        Disable_all_buttons();
        m_receive.innerHTML = '';
        bootbox.alert("Peer Connection Lost!!");
        //disbale user list page
        m_OnlineUser.style.display = "block";
        console.log("The Data Channel is Closed");
    };
}

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/

//when upload file button click
/*m_upload_send.addEventListener("click", function(event) {

    for (var i = 0, f; f = filelist[i]; i++) {
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(evt) {
                var msg = JSON.stringify({
                    "type": "file",
                    "name": theFile.name,
                    "size": theFile.size,
                    "data": evt.target.result
                });
                dataChannel.send(msg);
            };
        })(f);
        reader.readAsDataURL(f);
    }
});*/

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/

function dataChannelSend(message) {
    dataChannel.send(JSON.stringify(message));
}


/************************************************************
 *	Function 	: failure , sucess
 *	Description : WebRTC Error handling
 *	DocumentOwner  : vinay kp
 *************************************************************/
function failure(e) {
    console.log("failure hasUserMedia ");
    console.log(e);
};

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/

function success2() {};

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/
function failure_Client_Offer(e) {
    console.log("failure_Client_Offer");
    console.log(e);
};

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/

function failure_My_Start_Peer_Connection(e) {
    console.log("ailure_My_Start_Peer_Connection");
    bootbox.alert("Peer User is not availble or Connection lost !!");
    console.log(e);
};

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/

function failure_offer(e) {
    console.log("failure creating a offer");
    console.log(e);
};

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/

function Enable_all_buttons() {
    m_Send_button.disabled = false;
};

/********************************************************
 *	DocumentOwner  : vinay kp
 **********************************************************/

function Disable_all_buttons() {
    m_Send_button.disabled = true;
    m_upload_send.disabled = true;
};


function errorMessage(message, e) {
    console.error(message, typeof e == 'undefined' ? '' : e);
    bootbox.alert(message);
}
