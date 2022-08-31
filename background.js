


// https://stackoverflow.com/a/66618269
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'foo') return;
  port.onMessage.addListener(onMessage);
  port.onDisconnect.addListener(deleteTimer);
  port._timer = setTimeout(forceReconnect, 5000, port);
});

function onMessage(msg, port) {
  console.log('received', msg, 'from', port.sender);
}
function forceReconnect(port) {
  deleteTimer(port);
  port.disconnect();
}
function deleteTimer(port) {
  if (port._timer) {
    clearTimeout(port._timer);
    delete port._timer;
  }
}


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message == "New meeting starting") {
    chrome.storage.sync.get(["extensionStatusJSON"], function (result) {
      let extensionStatusJSON = result.extensionStatusJSON;
      if (extensionStatusJSON.status == 200) {
        // Registering tabs listener on meeting page first load
        queryTabsInWindow();
        readPreMeetingSlackStatus();
        // sendResponse("Service worker up and running");
      }
      else {
        console.log("Not doing any page load actions as extension status is 400")
      }
    })
  }
})




chrome.webRequest.onCompleted.addListener(joinMeetingCallback, { urls: ["https://www.gstatic.com/meet/sounds/join_call_*", "https://meet.google.com/hangouts/v1_meetings/media_streams/add?key=*"] })

chrome.webRequest.onCompleted.addListener(exitMeetingCallback, { urls: ["https://www.gstatic.com/meet/sounds/leave_call_*", "https://meet.google.com/v1/spaces/*/devices:close?key=*"] })







function joinMeetingCallback() {
  chrome.storage.sync.get(["extensionStatusJSON"], function (result) {
    let extensionStatusJSON = result.extensionStatusJSON;
    if (extensionStatusJSON.status == 200) {
      console.log("Successfully intercepted network request. Setting slack status.")
      setSlackStatus();
    }
    else {
      console.log("Not setting slack status as extension status is 400")
    }
  })
}

function exitMeetingCallback() {
  chrome.storage.sync.get(["extensionStatusJSON"], function (result) {
    let extensionStatusJSON = result.extensionStatusJSON;
    if (extensionStatusJSON.status == 200) {
      console.log("Successfully intercepted network request. Clearing slack status.")
      clearSlackStatus();
    }
    else {
      console.log("Not clearing slack status as extension status is 400")
    }
  })
}


function queryTabsInWindow() {
  chrome.tabs.query({ url: "https://meet.google.com/*" }, function (tabs) {
    tabs.forEach(function (tab) {
      let tabId = tab.id;
      // https://stackoverflow.com/a/3107221
      chrome.tabs.onRemoved.addListener(function tabsListenerCallback(tabid, removed) {
        if (tabId === tabid) {
          console.log("Successfully intercepted tab close. Clearing slack status")
          clearSlackStatus();
        }
      });
    });
  });
}





function readPreMeetingSlackStatus() {
  var key;
  chrome.storage.sync.get(["meetSlackKey", "statusText"], function (data) {
    if (data.meetSlackKey) {
      key = data.meetSlackKey;

      var myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        `Bearer ${key}`
      );
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

      var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch("https://slack.com/api/users.profile.get", requestOptions)
        .then((response) => response.json())
        .then((result) => {
          // Save Pre meeting slack status, if status read was successful
          if (result.ok === true) {
            console.log(result.profile.status_emoji + " | " + result.profile.status_text + " | " + data.statusText + " | " + result.profile.status_expiration)

            let preMeetingSlackStatusJSON;
            if (data.statusText == result.profile.status_text) {
              console.log("Oh no! Status from previous meeting is stuck. Time to reset")
              preMeetingSlackStatusJSON = {
                status_text: "",
                status_emoji: "",
                status_expiration: 0
              }
            }

            else {
              preMeetingSlackStatusJSON = {
                status_text: result.profile.status_text,
                status_emoji: result.profile.status_emoji,
                status_expiration: result.profile.status_expiration
              }
            }

            let preMeetingSlackStatus = JSON.stringify(preMeetingSlackStatusJSON);
            chrome.storage.sync.set(
              {
                preMeetingSlackStatus: preMeetingSlackStatus
              }, function () {
                console.log("Pre meeting emoji saved")
              }
            )
          }
          else {
            console.log("Cannot read pre meeting slack status. Please generate a fresh API key and paste in the extension.");
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
              chrome.tabs.sendMessage(tabs[0].id, { message: "Slack status read scope missing" });
            });
          }
        })
        .catch((error) => console.log("error", error));
    }
  });
}


function setSlackStatus() {
  let emoji = "📞";
  let text = "On a meet call • Reply may be delayed";
  chrome.storage.sync.get(["emojiText", "statusText"], function (result) {
    if (result.emojiText) {
      // https://stackoverflow.com/questions/18862256/how-to-detect-emoji-using-javascript
      if (/\p{Emoji}/u.test(result.emojiText)) {
        emoji = result.emojiText;
        // console.log('One char emoji')
      }
      else if (/^\:.*\:$/.test(result.emojiText)) {
        emoji = result.emojiText;
        // console.log('Custom emoji with both colons')
      }
      else {
        emoji = ":" + result.emojiText + ":";
        // console.log('Custom emoji without both colons')
      }
    }
    if (result.statusText) {
      text = result.statusText;
    }

    var raw = JSON.stringify({
      profile: {
        status_text: text,
        status_emoji: emoji,
        status_expiration: 0,
      },
    });

    makeSlackAPICall(raw, "set");
  });
}

function clearSlackStatus() {
  chrome.storage.sync.get(["preMeetingSlackStatus"], function (result) {
    let raw;
    if (result.preMeetingSlackStatus) {
      console.log("Found pre meeting slack status. Putting it back. " + result.preMeetingSlackStatus)
      let preMeetingSlackStatus = JSON.parse(result.preMeetingSlackStatus)
      raw = JSON.stringify({
        profile: {
          status_text: preMeetingSlackStatus.status_text,
          status_emoji: preMeetingSlackStatus.status_emoji,
          status_expiration: preMeetingSlackStatus.status_expiration,
        },
      });
    }
    else {
      console.log("Did not find pre meeting slack status. Setting empty status.")
      raw = JSON.stringify({
        profile: {
          status_text: "",
          status_emoji: "",
          status_expiration: 0,
        },
      });
    }

    makeSlackAPICall(raw, "clear");
  })
}


function makeSlackAPICall(raw, type) {
  var key;
  chrome.storage.sync.get(["meetSlackKey"], function (result) {

    if (result.meetSlackKey) {
      key = result.meetSlackKey;

      var myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        `Bearer ${key}`
      );
      myHeaders.append("Content-Type", "application/json");

      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch("https://slack.com/api/users.profile.set", requestOptions)
        .then((response) => response.text())
        .then((result) => {
          // console.log("Slack status altered")
        })
        .catch((error) => console.log("error", error));
    }
  });
}