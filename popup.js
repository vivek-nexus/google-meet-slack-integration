// var actual_JSON = {};

window.onload = function () {
  var slackKey = document.querySelector('#slack-key');
  var slackStatus = document.querySelector('#slack-status');
  var slackEmoji = document.querySelector('#slack-emoji');
  var saveButton = document.querySelector('#save-button');

  chrome.storage.sync.get(["meetSlackKey", "statusText", "emojiText"], function (result) {
    if(result.meetSlackKey)
      slackKey.value = result.meetSlackKey;
    if(result.statusText)
      slackStatus.value = result.statusText;
    if(result.emojiText)
      slackEmoji.value = result.emojiText
  })

  saveButton.addEventListener('click', function () {
    // console.log(slackKey.value)
    // console.log(slackStatus.value)
    // console.log(slackEmoji.value)

    chrome.storage.sync.set(
      {
        meetSlackKey: slackKey.value,
        emojiText: slackEmoji.value,
        statusText: slackStatus.value
      }, function(){
          console.log("Storage data set")
          window.close();
          chrome.tabs.reload(function () {});
      }
    )
  })
}




// document.addEventListener("DOMContentLoaded", function () {
//   loadJSON(function (response) {
//     // Parse JSON string into object
//     actual_JSON = JSON.parse(response);
//     var ul = document.getElementById("emojiList");
//     Object.keys(actual_JSON).map((emoji) => {
//       var li = document.createElement("li");
//       var img = document.createElement("img");
//       img.src = actual_JSON[emoji];
//       li.innerText = emoji;
//       li.append(img);
//       ul.append(li);
//     });
//   });

  

//   chrome.storage.sync.get(["meetSlackKey"], function (result) {
//     if (result.meetSlackKey) {
//       console.log("Meet-Slack key present");
//       var edit = document.getElementById("editKey");
//       var set = document.getElementById("setKey");
//       edit.style.display = "block";
//       set.style.display = "none";
//     }
//   });

//   chrome.storage.sync.get(["emojiText", "emojiUrl"], function (result) {
//     if (result.emojiText) {
//       console.log("Slack emoji present");
//       var edit = document.getElementById("editEmoji");
//       var set = document.getElementById("setEmoji");
//       var emoji = document.getElementById("emoji");
//       emoji.innerHTML =
//         "<p>" +
//         result.emojiText +
//         "</p>" +
//         '<img src="' +
//         result.emojiUrl +
//         '" />';
//       edit.style.display = "block";
//       set.style.display = "none";
//     }
//   });

//   var setKey = document.getElementById("setSlackKey");
//   var editKey = document.getElementById("editSlackKey");
//   var emojiInput = document.getElementById("emojiInput");
//   var emojiList = document.getElementById("emojiList");
//   var editEmoji = document.getElementById("editSlackEmoji");
  
//   if (setKey) {
//     setKey.addEventListener("click", setSlackKey, false);
//   }
//   if (editKey) {
//     editKey.addEventListener("click", editSlackKey, false);
//   }
//   if (emojiInput) {
//     emojiInput.addEventListener("keyup", searchEmoji, false);
//   }
//   if (emojiList) {
//     emojiList.addEventListener("click", setSlackEmoji, false);
//   }
//   if (editEmoji) {
//     editEmoji.addEventListener("click", editSlackEmoji, false);
//   }
// });

function loadJSON(callback) {
  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", "emojis.json", true);
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText);
    }
  };
  xobj.send(null);
}

function searchEmoji() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById("emojiInput");
  filter = input.value.toUpperCase();
  ul = document.getElementById("emojiList");
  if (filter.length > 1) {
    ul.style.display = "block";
  } else {
    ul.style.display = "none";
  }
  li = ul.getElementsByTagName("li");
  for (i = 0; i < li.length; i++) {
    a = li[i];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

function setSlackEmoji(e) {
  chrome.storage.sync.set(
    {
      emojiText: e.target.innerText,
      emojiUrl: actual_JSON[e.target.innerText],
    },
    function () {
      var edit = document.getElementById("editEmoji");
      var set = document.getElementById("setEmoji");
      var emoji = document.getElementById("emoji");
      emoji.innerHTML =
        "<p>" +
        e.target.innerText +
        "</p>" +
        '<img src="' +
        actual_JSON[e.target.innerText] +
        '" />';
      edit.style.display = "block";
      set.style.display = "none";
    }
  );
}

function editSlackEmoji() {
  var edit = document.getElementById("editEmoji");
  var set = document.getElementById("setEmoji");
  edit.style.display = "none";
  set.style.display = "block";
}

function setSlackKey() {
  var input = document.getElementById("slackKey").value;
  if (input.length > 0) {
    chrome.storage.sync.set({ meetSlackKey: input }, function () {
      console.log("Meet-Slack API key set");
      var edit = document.getElementById("editKey");
      var set = document.getElementById("setKey");
      edit.style.display = "block";
      set.style.display = "none";
      chrome.tabs.reload(function () {});
    });
  }
}

function editSlackKey() {
  var edit = document.getElementById("editKey");
  var set = document.getElementById("setKey");
  edit.style.display = "none";
  set.style.display = "block";
}
