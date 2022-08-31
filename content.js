checkExtensionStatus().then(() => {
  // Read the status JSON
  chrome.storage.sync.get(["extensionStatusJSON"], function (result) {
    let extensionStatusJSON = result.extensionStatusJSON;
    console.log("Extension status " + extensionStatusJSON.status);

    chrome.runtime.sendMessage({ message: "New meeting starting" }, function (response) {
      console.log(response);
    });


    if (extensionStatusJSON.status == 200) {

      // https://stackoverflow.com/a/66618269
      let port;
      function connect() {
        port = chrome.runtime.connect({ name: 'foo' });
        port.onDisconnect.addListener(connect);
        port.onMessage.addListener(msg => {
          console.log('received', msg, 'from bg');
        });
      }
      connect();




      window.addEventListener("load", function () {

        checkElement('.oTVIqe').then((selector) => {
          console.log("Camera button is active");
          let buttons = document.querySelectorAll(".oTVIqe");
          //buttons[0].click(); //turns off microhphone, comment to disable
          buttons[2].click(); //turns off camera, comment to disable
        });

        chrome.storage.sync.get(["meetSlackKey"], function (result) {
          let block = document.querySelectorAll(".vgJExf")[0];
          var obj = document.createElement("div");
          var logo = document.createElement("img");
          var text = document.createElement("p");
          logo.setAttribute("src", "https://github.com/yakshaG/google-meet-slack-integration/raw/main/icon.png")
          logo.setAttribute("height", "32px")
          logo.setAttribute("width", "32px");
          logo.style.cssText = "border-radius: 4px";
          text.innerHTML = extensionStatusJSON.message;

          if (!result.meetSlackKey) {
            obj.style.cssText =
              "border: 1px solid red; color: red; background: #ff000026; display: flex; justify-content: center; align-items: center; gap: 16px;  font-size: 1.2em;  padding: 0.25rem;  margin-top:1rem;  line-height: 1.75; font-family: 'Google Sans',Roboto,Arial,sans-serif;";
            text.innerHTML =
              "Slack API key not set. Open Google Meet ⇔ Slack extension to set the API key.";
          }
          else {
            obj.style.cssText =
              "border: 1px solid green; color: green; background: rgb(0 255 8 / 15%); display: flex; justify-content: center; align-items: center; gap: 16px;  font-size: 1.2em;  padding: 0.25rem;  margin-top:1rem; line-height: 1.5; font-family: 'Google Sans',Roboto,Arial,sans-serif;"
            text.innerHTML =
              "<strong>Google Meet ⇔ Slack is running. Use Ctrl + V to join meeting, Ctrl + Q to exit meeting.</strong><br />Status updates sometimes may not work for back-to-back, super short meetings (<1min).";
          }

          obj.prepend(text);
          obj.prepend(logo);
          block.prepend(obj);
        });
      });
    }

    else {
      let block = document.querySelectorAll(".vgJExf")[0];
      var obj = document.createElement("div");
      var logo = document.createElement("img");
      var text = document.createElement("p");
      logo.setAttribute("src", "https://github.com/yakshaG/google-meet-slack-integration/raw/main/icon.png")
      logo.setAttribute("height", "32px")
      logo.setAttribute("width", "32px");
      logo.style.cssText = "border-radius: 4px";
      text.innerHTML = extensionStatusJSON.message;

      obj.style.cssText =
        "border: 1px solid red; color: red; background: #ff000026; display: flex; justify-content: center; align-items: center; gap: 16px;  font-size: 1.2em;  padding: 0.25rem;  margin-top:1rem;  line-height: 1.75; font-family: 'Google Sans',Roboto,Arial,sans-serif;";

      obj.prepend(text);
      obj.prepend(logo);
      block.prepend(obj);
      return;
    }
  })
})


chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === "Slack status read scope missing") {
      if (confirm("Oops! Insufficient permissions to update your slack status! \n\n Do you want to regenerate Slack API key now?")) {
        window.open("https://slack.com/oauth/v2/authorize?client_id=3243307866673.3224053662614&scope=&user_scope=users.profile:read,users.profile:write", '_blank').focus();
      }
      sendResponse({ message: "Alerted the user to regenerate slack API key" });
    }
  }
);


document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "v") {
    checkExtensionStatus().then(extensionStatus => {
      if (extensionStatus == 200) {
        if (contains("div", "Ask to join")[15])
          contains("div", "Ask to join")[15].firstChild.click();
        else
          contains("div", "Join now")[15].firstChild.click();
      }
    })
  }
});

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "q") {
    checkExtensionStatus().then(extensionStatus => {
      if (extensionStatus == 200)
        contains("i", "call_end")[0].parentElement.click();
    })
  }
});


function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
}

const checkElement = async selector => {
  while (document.querySelector(selector) === null) {
    await new Promise(resolve => requestAnimationFrame(resolve))
  }
  return document.querySelector(selector);
};




async function checkExtensionStatus() {
  // Set default value as 200
  chrome.storage.sync.set({
    extensionStatusJSON: { "status": 200, "message": "" }
  })

  // https://stackoverflow.com/a/42518434
  await fetch("https://raw.githubusercontent.com/yakshaG/gmeet-slack-integration-status/main/status-prod.json", { cache: "no-store" }).then((response) => response.json()).then((result) => {
    // Write status to chrome local storage
    chrome.storage.sync.set({
      extensionStatusJSON: result
    }, function () {
      console.log("Extension status fetched and saved")
    })
  })
}