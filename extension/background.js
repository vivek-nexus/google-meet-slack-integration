chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message == "New meeting starting") {
    console.log("-------------NEW MEETING-------------")
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var tabId = tabs[0].id
      chrome.storage.local.set({ meetingTabId: tabId }, function () {
        console.log("Meeting tab id saved")
      })
    })
    readPreMeetingSlackStatus()
  }
  if (request.message == "Set status") {
    console.log("Setting slack status")
    setSlackStatus()
  }
  if (request.message == "Clear status") {
    // Invalidate tab id since Slack status is cleared, prevents double clearing of Slack status from tab closed event listener
    chrome.storage.local.set({ meetingTabId: null }, function () {
      console.log("Meeting tab id cleared")
    })
    console.log("Clearing slack status")
    clearSlackStatus()
  }
  return true
})


chrome.tabs.onRemoved.addListener(function (tabid) {
  chrome.storage.local.get(["meetingTabId"], function (data) {
    console.log(tabid)
    console.log(data.meetingTabId)
    if (tabid == data.meetingTabId) {
      console.log("Successfully intercepted tab close")
      clearSlackStatus()
    }
  })
})


function readPreMeetingSlackStatus() {
  chrome.storage.sync.get(["meetSlackKey", "statusText"], function (data) {
    if (data.meetSlackKey) {
      const key = data.meetSlackKey;
      const statusText = data.statusText + " (realtime via Glack)"

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
            console.log(statusText + " | " + result.profile.status_emoji + " | " + result.profile.status_text + " | " + result.profile.status_expiration)

            let preMeetingSlackStatusJSON;
            if (statusText == result.profile.status_text) {
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
              console.log("Pre meeting status saved")
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
  let text = "On a meet call • Reply may be delayed (realtime via Glack)";
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
      text = result.statusText + " (realtime via Glack)";
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