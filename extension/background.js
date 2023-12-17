chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.storage.local.get(["extensionStatusJSON"], function (result) {
    let extensionStatusJSON = result.extensionStatusJSON;
    if (extensionStatusJSON.status == 200) {
      if (request.message == "New meeting starting") {
        console.log("-------------NEW MEETING-------------")
        readPreMeetingSlackStatus()
        chrome.storage.local.get(["inMeeting", "attendeeUUID"], function (result) {
          console.log(`Saved inMeeting: ${result.inMeeting}`)
          console.log(`Saved attendee UUID: ${result.attendeeUUID}`)
        })
      }
      if (request.message == "Page unloaded") {
        console.log("Successfully intercepted page unload")
        chrome.storage.local.set({ inMeeting: false, attendeeUUID: null }, function () {
          console.log("inMeeting set to false")
          console.log(`Attendee UUID set to null`)
          console.log("Clearing slack status")
          clearSlackStatus();
        })
      }
    }
    else {
      console.log("Not doing any page load actions as extension status is 400")
    }
  })
  return true
})

chrome.webRequest.onBeforeRequest.addListener((details) => {
  console.log("Successfully intercepted UpdateMeetingDevice network request")
  // https://stackoverflow.com/a/56521708
  const extractedBody = extractInfoFromString(decodeURIComponent(String.fromCharCode.apply(null, new Uint8Array(details.requestBody.raw[0].bytes))))
  if (extractedBody != null) {
    chrome.storage.local.get(["extensionStatusJSON"], function (result) {
      let extensionStatusJSON = result.extensionStatusJSON;
      if (extensionStatusJSON.status == 200)
        webRequestCallback(extractedBody.eventType, extractedBody.uuid)
      else
        console.log("Not doing any page load actions as extension status is 400")
    })
  }
},
  { urls: ["https://meet.google.com/$rpc/google.rtc.meetings.v1.MeetingDeviceService/UpdateMeetingDevice"] }, ["requestBody"])





function webRequestCallback(eventType, uuid) {
  chrome.storage.local.get(["inMeeting", "attendeeUUID"], function (result) {
    console.log(`Saved inMeeting: ${result.inMeeting}`)
    console.log(`Saved attendee UUID: ${result.attendeeUUID}`)

    if ((eventType == "g") && (result.inMeeting == false) && (result.attendeeUUID == null)) {
      chrome.storage.local.set({ inMeeting: true, attendeeUUID: uuid }, function () {
        console.log(`Correct event of type "${eventType}", with ${uuid}`)
        console.log(`inMeeting set to true. Attendee UUID set to ${uuid}.`)
        console.log("Setting slack status")
        setSlackStatus();
      })
    }
    else if ((eventType == "D") && (result.inMeeting == true) && (result.attendeeUUID == uuid)) {
      chrome.storage.local.set({ inMeeting: false, attendeeUUID: null }, function () {
        console.log(`Correct event of type "${eventType}", with ${uuid}`)
        console.log(`inMeeting set to false. Attendee UUID set to null.`)
        console.log("Clearing slack status")
        clearSlackStatus();
      })
    }
    else {
      console.log(`False event of type "${eventType}", with ${uuid}`)
    }
  })
}



function readPreMeetingSlackStatus() {
  let key;
  chrome.storage.sync.get(["meetSlackKey", "statusText"], function (data) {
    if (data.meetSlackKey) {
      key = data.meetSlackKey;

      const myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        `Bearer ${key}`
      );
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

      const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch("https://slack.com/api/users.profile.get", requestOptions)
        .then((response) => response.json())
        .then((result) => {
          // Save Pre meeting slack status, if status read was successful
          if (result.ok === true) {
            console.log(data.statusText + " | " + result.profile.status_emoji + " | " + result.profile.status_text + " | " + result.profile.status_expiration)

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
            chrome.storage.local.set({ preMeetingSlackStatus: preMeetingSlackStatus }, function () {
              console.log("Pre meeting emoji saved")
            })
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

    const raw = JSON.stringify({
      profile: {
        status_text: text,
        status_emoji: emoji,
        status_expiration: 0,
      },
    });

    makeSlackAPICall(raw);
  });
}

function clearSlackStatus() {
  chrome.storage.local.get(["preMeetingSlackStatus"], function (result) {
    let raw;
    if (result.preMeetingSlackStatus) {
      let preMeetingSlackStatus = JSON.parse(result.preMeetingSlackStatus)
      const statusExpiryDelta = (preMeetingSlackStatus.status_expiration - parseInt(Date.now() / 1000))
      console.log(`Status expiry diff ${statusExpiryDelta}`)
      if (preMeetingSlackStatus.status_expiration == 0) {
        console.log("Status validity is indefinite. Setting that status blindly.")
        raw = JSON.stringify({
          profile: {
            status_text: preMeetingSlackStatus.status_text,
            status_emoji: preMeetingSlackStatus.status_emoji,
            status_expiration: preMeetingSlackStatus.status_expiration,
          },
        });
      }
      else if (statusExpiryDelta > 0) {
        console.log("Found pre meeting slack status. Putting it back. " + result.preMeetingSlackStatus)
        raw = JSON.stringify({
          profile: {
            status_text: preMeetingSlackStatus.status_text,
            status_emoji: preMeetingSlackStatus.status_emoji,
            status_expiration: preMeetingSlackStatus.status_expiration,
          },
        });
      }
      else {
        console.log("Status validity has expired. Setting empty status.")
        raw = JSON.stringify({
          profile: {
            status_text: "",
            status_emoji: "",
            status_expiration: 0,
          },
        });
      }
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

    makeSlackAPICall(raw);
  })
}


function makeSlackAPICall(raw) {
  let key;
  chrome.storage.sync.get(["meetSlackKey"], function (result) {

    if (result.meetSlackKey) {
      key = result.meetSlackKey;

      const myHeaders = new Headers();
      myHeaders.append(
        "Authorization",
        `Bearer ${key}`
      );
      myHeaders.append("Content-Type", "application/json");

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch("https://slack.com/api/users.profile.set", requestOptions)
        .then((response) => response.text())
        .then((result) => {
          console.log(`Slack status altered ${JSON.parse(result).ok}`)
        })
        .catch((error) => console.log("error", error));
    }
  });
}

function extractInfoFromString(str) {
  const regex = /\n[gD]\n@spaces\/[^\/]+\/devices\/([a-fA-F0-9-]+)\b/;
  const match = str.match(regex);

  if (match) {
    const eventType = match[0][1];
    const uuid = match[1];
    return { eventType, uuid };
  }

  return null;
}