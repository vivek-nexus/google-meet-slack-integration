chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if (chrome.webRequest.onCompleted.hasListeners()) {
    console.log("Some weRequest event listeners are active. Removing them.")
    chrome.webRequest.onCompleted.removeListener(joinMeetingCallback);
    chrome.webRequest.onCompleted.removeListener(exitMeetingCallback);
  }

  if (chrome.tabs.onRemoved.hasListeners()) {
    console.log("Some tab event listeners are active. Removing them.")
    chrome.tabs.onRemoved.removeListener(joinMeetingCallback);
  }

  if (request.message == "Extension status 200") {
    sendResponse("Noted extension is operational!");

    console.log("Registering meeting join listener")
    // Registering event listener for meeting join
    chrome.webRequest.onCompleted.addListener(joinMeetingCallback, { urls: ["https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingDeviceService/UpdateMeetingDevice"] })

    console.log("Registering query tabs listener")
    // Registering event listener for tabs join
    queryTabsInWindow();
  }
  else if (request.message == "Extension status 400") {
    sendResponse("Noted extension is under maintainence!");
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
  console.log("Successfully intercepted network request. Setting slack status")
  setSlackStatus();
  // https://stackoverflow.com/q/23001428
  console.log("Removing meeting join listener")
  chrome.webRequest.onCompleted.removeListener(joinMeetingCallback);

  console.log("Registering meeting exit listener")
  // Registering event listener for meeting exit
  chrome.webRequest.onCompleted.addListener(exitMeetingCallback, { urls: ["https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingDeviceService/UpdateMeetingDevice", "https://meet.google.com/v1/spaces/*/devices:close?key=*"] })
}

function exitMeetingCallback() {
  console.log("Successfully intercepted network request. Clearing slack status")
  clearSlackStatus();
  console.log("Removing meeting exit listener")
  chrome.webRequest.onCompleted.removeListener(exitMeetingCallback);
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