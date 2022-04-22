window.addEventListener("load", function () {
  let buttons = document.querySelectorAll(".oTVIqe");
  //buttons[0].click(); //turns off microhphone, comment to disable
  buttons[2].click(); //turns off camera, comment to disable
  contains("div", "Join now")[15].style.display = "none";

  chrome.runtime.sendMessage({message: "Content Loaded"}, function (response) {
    console.log(response);
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
      setTimeout(checkClass, 3000);
    }
  });
});

var meetingType = 'internal';

function checkClass() {
  if (document.getElementsByClassName("XCoPyb").length) {
    var main = document.getElementsByClassName("XCoPyb")[0];

    if(contains("div", "Ask to join")[15])
      meetingType = 'external';

    console.log(meetingType);

    main.prepend(createJoinNowButton(meetingType));

    var joinKey = document.getElementById("meet-slack-join");

    if (joinKey) {
      joinKey.addEventListener("click", function(){
        setJoinKey(meetingType);
      });
    }
  } else {
    console.log("Class does not exist");
  }
}

function createJoinNowButton(meetingType) {
  console.log("createJoinNowButton");
  var button = document.createElement("div");
  var span1 = document.createElement("span");
  var span2 = document.createElement("span");

  // Add attribites to button
  button.className = "VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ VfPpkd-LgbsSe-OWXEXe-dgl2Hf nCP5yc AjY5Oe DuMIQc qfvgSe jEvJdc QJgqC";
  button.setAttribute("role", "button");
  button.setAttribute("tabindex", "0");
  button.id = "meet-slack-join";

  // Add attribites to span1
  span1.className = "l4V7wb Fxmcue";
  span2.className = "NPEfkd RveJvd snByac";

  if(meetingType == 'external')
    span2.innerText = "Ask to Join";
  else
    span2.innerText = "Join Now";
  span1.append(span2);
  button.append(span1);

  return button;
}

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "v") {
    setJoinKey(meetingType);
  }
});

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "q") {
    contains("i", "call_end")[0].parentElement.click();
    // clearSlackStatus
    chrome.runtime.sendMessage({message: "Clear Slack status"}, function (response) {
      console.log(response);
    });
  }
});

function setJoinKey(meetingType) {
  console.log("Join key pressed");
  if (meetingType == 'external')
    contains("div", "Ask to join")[15].firstChild.click();
  else
    contains("div", "Join now")[15].firstChild.click();

  // https://stackoverflow.com/a/53269990
  // Waiting until the host lets you in
  checkElement('.MQKmmc, .SudKRc, .Q4etDd, .wYNW7d').then((selector) => {
    // setSlackStatus
    chrome.runtime.sendMessage({message: "Set Slack status"}, function (response) {
      console.log(response);
    });
    setTimeout(function () {
      contains("i", "call_end")[0].parentElement.onclick = function () {
        // clearSlackStatus
        chrome.runtime.sendMessage({message: "Clear Slack status"}, function (response) {
          console.log(response);
        });
      };
    }, 300);
  });
}

function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent);
  });
}

// https://stackoverflow.com/a/53269990
const checkElement = async selector => {
  while ( document.querySelector(selector) === null) {
    await new Promise( resolve =>  requestAnimationFrame(resolve) )
  }
  return document.querySelector(selector); 
};