checkExtensionStatus().then(() => {
  // Read the status JSON
  chrome.storage.sync.get(["extensionStatusJSON"], function (result) {
    let extensionStatusJSON = result.extensionStatusJSON;
    console.log("Extension status " + extensionStatusJSON.status);

    chrome.runtime.sendMessage(
      { message: "New meeting starting" },
      function (response) {
        console.log(response);
      }
    );

    if (extensionStatusJSON.status == 200) {
      // https://stackoverflow.com/a/66618269
      let port;
      function connect() {
        port = chrome.runtime.connect({ name: "foo" });
        port.onDisconnect.addListener(connect);
        port.onMessage.addListener((msg) => {
          console.log("received", msg, "from bg");
        });
      }
      connect();

      window.addEventListener("load", function () {
        checkElement(".oTVIqe").then((selector) => {
          console.log("Camera button is active");
          let buttons = document.querySelectorAll(".oTVIqe");
          //buttons[0].click(); //turns off microhphone, comment to disable
          buttons[2].click(); //turns off camera, comment to disable
        });

        showNotification(200, extensionStatusJSON);

        joinKeyBoardShortcutListener();
        exitKeyBoardShortcutListener();
      });
    } else {
      window.addEventListener("load", function () {
        showNotification(400, extensionStatusJSON);
        return;
      });
    }
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "Slack status read scope missing") {
    if (
      confirm(
        "Oops! Insufficient permissions to update your slack status! \n\n Do you want to regenerate Slack API key now?"
      )
    ) {
      window
        .open(
          "https://slack.com/oauth/v2/authorize?client_id=3243307866673.3224053662614&scope=&user_scope=users.profile:read,users.profile:write",
          "_blank"
        )
        .focus();
    }
    sendResponse({ message: "Alerted the user to regenerate slack API key" });
  }
});

function joinKeyBoardShortcutListener() {
  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "v") {
      chrome.storage.sync.get(["extensionStatusJSON"], function (result) {
        let extensionStatusJSON = result.extensionStatusJSON;
        if (extensionStatusJSON.status == 200) {
          if (contains("div", "Ask to join")[15])
            contains("div", "Ask to join")[15].firstChild.click();
          else contains("div", "Join now")[15].firstChild.click();
        }
      });
    }
  });
}

function exitKeyBoardShortcutListener() {
  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "q") {
      chrome.storage.sync.get(["extensionStatusJSON"], function (result) {
        let extensionStatusJSON = result.extensionStatusJSON;
        if (extensionStatusJSON.status == 200)
          contains("i", "call_end")[0].parentElement.click();
      });
    }
  });
}

function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
}

const checkElement = async (selector) => {
  while (document.querySelector(selector) === null) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
  return document.querySelector(selector);
};

function showNotification(type, extensionStatusJSON) {
  // Banner CSS
  let block = document.querySelectorAll(".vgJExf")[0];
  let obj = document.createElement("div");
  let logo = document.createElement("img");
  let text = document.createElement("p");

  logo.setAttribute(
    "src",
    "https://yakshag.github.io/gmeet-slack-integration-status/icon.png"
  );
  logo.setAttribute("height", "32px");
  logo.setAttribute("width", "32px");
  logo.style.cssText = "border-radius: 4px";

  // Remove banner after 5s
  setTimeout(() => {
    obj.style.display = "none";
  }, 5000);

  if (type == 200) {
    chrome.storage.sync.get(["meetSlackKey"], function (result) {
      if (!result.meetSlackKey) {
        obj.style.cssText = `color: red; ${commonCSS}`;
        text.innerHTML =
          "Slack API key not set. Open Google Meet ⇔ Slack extension to set the API key.";
      } else {
        obj.style.cssText = `color: green; ${commonCSS}`;
        text.innerHTML = extensionStatusJSON.message;
      }
    });
  } else {
    obj.style.cssText = `color: grey; ${commonCSS}`;
    text.innerHTML = extensionStatusJSON.message;
  }
  obj.prepend(text);
  obj.prepend(logo);
  block.prepend(obj);
}

const commonCSS = `background: rgb(255 255 255 / 75%); 
    backdrop-filter: blur(16px); 
    position: absolute; 
    left: 0; 
    right: 0; 
    margin-left: auto; 
    margin-right: auto;
    max-width: 780px;  
    z-index: 1000; 
    padding: 0rem 1rem;
    border-radius: 8px; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    gap: 16px;  
    font-size: 1rem; 
    line-height: 1.5; 
    font-family: 'Google Sans',Roboto,Arial,sans-serif; 
    box-shadow: rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;`;

async function checkExtensionStatus() {
  // Set default value as 200
  chrome.storage.sync.set({
    extensionStatusJSON: { status: 200, message: "" },
  });

  // https://stackoverflow.com/a/42518434
  await fetch(
    "https://yakshag.github.io/gmeet-slack-integration-status/status-prod.json",
    { cache: "no-store" }
  )
    .then((response) => response.json())
    .then((result) => {
      // Write status to chrome local storage
      chrome.storage.sync.set(
        {
          extensionStatusJSON: result,
        },
        function () {
          console.log("Extension status fetched and saved");
        }
      );
    })
    .catch((err) => {
      console.log(err);
    });
}
