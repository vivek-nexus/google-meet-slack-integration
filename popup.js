import EmojiPicker from "./vanillaEmojiPicker.js";

new EmojiPicker({
  trigger: [
      {
          selector: '#emoji-picker',
          insertInto: '#slack-emoji' // If there is only one '.selector', than it can be used without array
      },
      {
          selector: '.second-btn',
          insertInto: '.two'
      }
  ],
  closeButton: true,
  specialButtons: '#1a73e8' // #008000, rgba(0, 128, 0);
});

window.onload = function () {
  var slackKey = document.querySelector('#slack-key');
  var slackStatus = document.querySelector('#slack-status');
  var slackEmoji = document.querySelector('#slack-emoji');
  var saveButton = document.querySelector('#save-button');
  var revokeButton = document.querySelector('#revoke-button');
  var revokeMessage = document.querySelector('#revoke-message');


  chrome.storage.sync.get(["meetSlackKey", "statusText", "emojiText"], function (result) {
    if(result.meetSlackKey)
      slackKey.value = "Saved successfully";
    if(result.statusText)
      slackStatus.value = result.statusText;
    if(result.emojiText)
      slackEmoji.value = result.emojiText
  })

  saveButton.addEventListener('click', function () {

    if(slackKey.value == 'Saved successfully'){
      chrome.storage.sync.set(
        {
          emojiText: slackEmoji.value,
          statusText: slackStatus.value
        }, function(){
            console.log("Storage data set")
            window.close();
            chrome.tabs.reload(function () {});
        }
      )
    }

    else{
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
    }
  })

  revokeButton.addEventListener('click', function () {
    var keyToReset;
    chrome.storage.sync.get(["meetSlackKey"], function (result) {
      if (result.meetSlackKey)
        keyToReset = result.meetSlackKey;
      else{
        revokeMessage.innerHTML = 'Slack key not found';
        setTimeout(() => {
          revokeMessage.innerHTML = ''
        }, 3000);
        return
      }
      
      var myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${keyToReset}`);

      var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };

      fetch("https://slack.com/api/auth.revoke", requestOptions)
        .then(response => response.text())
        .then((result) => {
          console.log(result);

          let parsedBody = JSON.parse(result);
          console.log(parsedBody.ok)
          if (parsedBody.ok === true) {
            chrome.storage.sync.remove('meetSlackKey');
            revokeMessage.innerHTML = 'Successfully revoked!';
            slackKey.value = "";
            setTimeout(() => {
              revokeMessage.innerHTML = ''
            }, 3000);
          }
          else{
            revokeMessage.innerHTML = 'Invalid key!';
            setTimeout(() => {
              revokeMessage.innerHTML = ''
            }, 3000);
          }

        })
        .catch(error => console.log('error', error));
    })
  })
}