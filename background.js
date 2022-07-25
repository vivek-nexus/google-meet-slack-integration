chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if ((request.message == "Extension status 200") && (chrome.webRequest.onCompleted.hasListeners())) {
    console.log("Some weRequest event listeners are active. Removing them.")
    chrome.webRequest.onCompleted.removeListener(joinMeetingCallback);
    chrome.webRequest.onCompleted.removeListener(exitMeetingCallback);
  }
  if (request.message == "Stay awake") {
    sendResponse("Staying awake");
    console.log("Staying awake");
  }

  if (request.message == "Watch for meeting join") {
    setTimeout(() => {
      sendResponse("Watching for meeting join after 1s");
      console.log("Registering meeting join listener after 1s")
      // Registering event listener for meeting join
      chrome.webRequest.onCompleted.addListener(joinMeetingCallback, { urls: ["https://meet.google.com/hangouts/v1_meetings/media_streams/add?key=*"] })
    }, 1000);
  }


  if (request.message == "Watch for meeting exit") {
    setTimeout(() => {
      sendResponse("Watching for meeting exit after 1s");
      console.log("Registering query tabs listener")
      // Registering event listener for tabs join
      queryTabsInWindow();
      console.log("Registering meeting exit listener after 1s")
      // Registering event listener for meeting exit
      chrome.webRequest.onCompleted.addListener(exitMeetingCallback, { urls: ["https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingDeviceService/UpdateMeetingDevice", "https://meet.google.com/v1/spaces/*/devices:close?key=*"] })
    }, 1000);
  }


  if (request.message == "Extension status 400") {
    sendResponse("Noted extension is under maintainence");
    console.log("Doing nothing as extension status is 400")
    return;
  }

});



function queryTabsInWindow() {
  chrome.tabs.query({ url: "https://meet.google.com/*" }, function (tabs) {
    tabs.forEach(function (tab) {
      let tabId = tab.id;
      // https://stackoverflow.com/a/3107221
      chrome.tabs.onRemoved.addListener(function tabsListenerCallback(tabid, removed) {
        if (tabId === tabid)
          clearSlackStatus();
        console.log("Removing tabs event listener.")
        chrome.tabs.onRemoved.removeListener(tabsListenerCallback);
      });
    });
  });
}

function joinMeetingCallback() {
  setTimeout(() => {
    console.log("Successfully intercepted network request. Setting slack status after 1s.")
    setSlackStatus();
    console.log("Removing meeting join listener")
    chrome.webRequest.onCompleted.removeListener(joinMeetingCallback);
  }, 1000);
  // https://stackoverflow.com/q/23001428


  // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  //   chrome.tabs.sendMessage(tabs[0].id, { message: "Slack status set" }, function (response) {
  //     console.log(response);
  //   });
  // });
}

function exitMeetingCallback() {
  console.log("Successfully intercepted network request. Clearing slack status")
  clearSlackStatus();
  console.log("Removing meeting exit listener")
  chrome.webRequest.onCompleted.removeListener(exitMeetingCallback);
  setTimeout(() => {
    console.log("Adding back meeting exit listener after 1s")
    // Registering event listener for meeting exit
    chrome.webRequest.onCompleted.addListener(exitMeetingCallback, { urls: ["https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingDeviceService/UpdateMeetingDevice", "https://meet.google.com/v1/spaces/*/devices:close?key=*"] })
  }, 1000);
}


function setSlackStatus() {
  let emoji = "📞";
  let text = "On a meet call • Reply may be delayed";
  chrome.storage.sync.get(["emojiText", "statusText"], function (result) {
    if (result.emojiText) {
      // https://stackoverflow.com/questions/18862256/how-to-detect-emoji-using-javascript
      if (/\p{Emoji}/u.test(result.emojiText)) {
        emoji = result.emojiText;
        console.log('One char emoji')
      }
      else if (/^\:.*\:$/.test(result.emojiText)) {
        emoji = result.emojiText;
        console.log('Custom emoji with both colons')
      }
      else {
        emoji = ":" + result.emojiText + ":";
        console.log('Custom emoji without both colons')
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
  var raw = JSON.stringify({
    profile: {
      status_text: "",
      status_emoji: "",
      status_expiration: 0,
    },
  });

  makeSlackAPICall(raw, "clear");
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
        .then((result) => console.log("Slack status altered"))
        .catch((error) => console.log("error", error));
    }
  });
}