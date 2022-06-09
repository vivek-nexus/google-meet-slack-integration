checkExtensionStatus().then((extensionStatus) => {
  console.log("Extension status " + extensionStatus);

  if (extensionStatus == 200) {
    window.addEventListener("load", function () {
      let buttons = document.querySelectorAll(".oTVIqe");
      //buttons[0].click(); //turns off microhphone, comment to disable
      buttons[2].click(); //turns off camera, comment to disable

      chrome.runtime.sendMessage({ message: "Content Loaded. Watch this tab!" }, function (response) {
        console.log(response);
      });

      chrome.runtime.sendMessage({ message: "Clear Slack status" }, function (response) {
        console.log(response);
        console.log("Purging slack status")
      });

      chrome.storage.sync.get(["meetSlackKey"], function (result) {
        let block = document.querySelectorAll(".vgJExf")[0];

        if (!result.meetSlackKey) {
          var obj = document.createElement("div");
          obj.style.cssText =
            "z-index:99999;color: red; text-align: center; padding: 0.5rem;border: 1px solid red; background: #ff000026;font-size: 1.2em;font-weight: 400;position: fixed;width: 95%;margin:auto;left:0;right:0;border-radius: 8px;margin-top:1rem;";
          obj.innerText =
            "Slack API key not set. Open GMeet-Slack extension to set the key.";
          block.prepend(obj);
        } else {
          var obj = document.createElement("div");
          obj.style.cssText =
            "z-index:99999;color: green; text-align: center; padding: 0.5rem;border: 1px solid green; background: rgb(0 255 8 / 15%);font-size: 1.2em;font-weight: 400;position: fixed;width: 95%;margin:auto;left:0;right:0;border-radius: 8px;margin-top:1rem;";
          obj.innerText =
            "GMeet-Slack is running. Use Ctrl + V to join meeting, Ctrl + Q to exit meeting.";
          block.prepend(obj);
        }
      });
    });
  }

  else {
    let block = document.querySelectorAll(".vgJExf")[0];
    var obj = document.createElement("div");
    var link = document.createElement("a");

    link.setAttribute("href", "https://github.com/yakshaG/gmeet-slack-integration")
    link.setAttribute("target", "_blank");
    link.textContent = "here";

    obj.style.cssText =
      "z-index:99999;color: red; text-align: center; padding: 0.5rem;border: 1px solid red; background: #ff000026;font-size: 1.2em;font-weight: 400;position: fixed;width: 95%;margin:auto;left:0;right:0;border-radius: 8px;margin-top:1rem;";
    obj.innerText =
      "GMeet-Slack is disabled for temporary maintainence. You can continue to use GMeet normally until we automatically update the extension. Check status "
    block.prepend(obj);
    return;
  }
})



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


async function checkExtensionStatus() {
  let status = 400;

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