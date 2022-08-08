checkExtensionStatus().then((extensionStatus) => {
  console.log("Extension status " + extensionStatus);

  chrome.runtime.sendMessage({ message: `Extension status ${extensionStatus}` }, function (response) {
    console.log(response);
  });


  if (extensionStatus == 200) {

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

        if (!result.meetSlackKey) {
          var obj = document.createElement("div");
          obj.style.cssText =
            "z-index:99999;color: red; text-align: center; padding: 0.5rem;border: 1px solid red; background: #ff000026;font-size: 1.2em;font-weight: 400;position: fixed;width: 95%;margin:auto;left:0;right:0;border-radius: 8px;margin-top:1rem;";
          obj.innerText =
            "Slack API key not set. Open Google Meet ⇔ Slack extension to set the key.";
          block.prepend(obj);
        } else {
          var obj = document.createElement("div");
          obj.style.cssText =
            "z-index:99999;color: green; text-align: center; padding: 0.5rem;border: 1px solid green; background: rgb(0 255 8 / 15%);font-size: 1.2em;font-weight: 400;position: fixed;width: 95%;margin:auto;left:0;right:0;border-radius: 8px;margin-top:1rem;";
          obj.innerText =
            "Google Meet ⇔ Slack is running. Use Ctrl + V to join meeting, Ctrl + Q to exit meeting.";
          block.prepend(obj);
        }
      });
    });
  }

  else {
    let block = document.querySelectorAll(".vgJExf")[0];
    var obj = document.createElement("div");
    var message = document.createElement("p");
    var link = document.createElement("a");

    message.innerHTML = "Google Meet ⇔ Slack is disabled for temporary maintainence. You can continue to use Google Meet normally until we automatically update the extension. Check status ";

    link.setAttribute("href", "https://github.com/yakshaG/google-meet-slack-integration")
    link.setAttribute("target", "_blank");
    link.innerHTML = "here.";

    message.appendChild(link);

    obj.style.cssText =
      "z-index:99999;color: red; text-align: center;border: 1px solid red; background: #ff000026;font-size: 1.2em;font-weight: 400;position: fixed;width: 95%;margin:auto;left:0;right:0;border-radius: 8px;margin-top:1rem;";

    obj.appendChild(message);
    block.prepend(obj);
    return;
  }
})


chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === "Slack status read scope missing") {
      if (confirm("New feature added to meeting extension! \n\n Do you want to regenerate Slack API key now?")) {
        window.open("https://slack.com/oauth/v2/authorize?client_id=3243307866673.3224053662614&scope=&user_scope=users.profile:read,users.profile:write", '_blank').focus();
      }
      sendResponse({ message: "Alerted the user to generate slack API key again" });
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
  let status = 200;

  // https://stackoverflow.com/a/42518434
  await fetch("https://yakshag.github.io/gmeet-slack-integration-status/", { cache: "no-store" })
    .then(response => response.text())
    .then(result => {
      const parser = new DOMParser();
      let rawHTML = parser.parseFromString(result, 'text/html');
      status = parseInt(rawHTML.querySelector('p').textContent);
    })
    .catch(error => console.log('error', error));

  return status;
}