# GMeet Slack

> Improve workplace communication with GMeet Slack!

**GMeet Slack automatically updates your slack status, when you join and exit meetings, even for unscheduled meetings or overflowing meetings.**

# Demo
![Demo](/demo.gif)

# Installation
<a href="https://chrome.google.com/webstore/detail/meet-slack-status/kddjlbegfaiogihndmglihcgommbjmkc" target="_blank">Get Chrome extension</a>

## Configure chrome extension
Once installed, open a new tab and type `meet.new` in the address bar, to join a test meeting. Now find and open the extension that has been installed from extensions list (puzzle icon).

![Extension screenshot](/extension-screenshot.png)

Chrome extension requires three inputs:
### 1. Slack API key
Click `GET SLACK API KEY` to install the slack app.
> Slack API key starts with `xoxp-` 

> Make sure to install the slack app to the correct workspace, where you want your status to be automatically updated.

See FAQs for more help.

### 2. Choose meeting status text
This will be the text displayed in your slack status, during the meeting. Default text is `On a meet call • Reply may be delayed`.

### 3. Choose meeting status emoji
This will be the emoji displayed in your slack status, during the meeting. Default emoji is 📞.

> Make sure to copy paste the full emoji text from slack, in the specified format `:telephone_receiver:`

> Custom emojis available in your slack workspace are supported.

**Click save** for the extension to start working. You should see a green banner which indicates that the extension is working.


# Usage
Join a meeting to test that your slack status updates automatically. Refresh meeting lobby page, if the extension does not load for the first time.

> **Pro-tip**: You can also use these keyboard shortcuts
> 
>  `CTRL+V` to join a meeting
> 
> `CTRL+Q` to quit a meeting

# Contributors
[Vivek G](https://github.com/yakshaG) and [Aditya](https://github.com/aditya-67)

# FAQs

### I am unable to install the slack app

Try re-installing. Make sure you are logged in to the right slack workspace.


### Slack app installation needs admin permission
Your slack workspace admin has made it mandatory to take their approval before installing any app to the workspace. Request them to approve your request by sending a note during the installation process.

You can assure them that this app is safe and does not collect or store any data. See [privacy policy](#privacy-policy).

### I am unable to generate Slack API key
Try re-installing the slack app and make sure you click allow during the installation.

### Slack status is not updating
1. Check if you have actually pasted the Slack API key. Generate and paste again, if in doubt.
2. Check status emoji format. `:smile:` will work whereas `smile` or `:P` will not work. To prevent confusion, copy paste the emoji directly from a slack chat.
3. The custom emoji used is not available in your slack workspace. Use only those emojis that are available in your slack workspace.

### Extension does not work sometimes
Refreshing the meeting page should bring the extension back.

### I want to uninstall this extension and slack app
1. Right click on the extension icon and remove the extension.
2. When you installed the slack app, you would have recieved an email from slack. Link to uninstall the slack app is present in that email. You can also visit https://app.slack.com/apps-manage, find GMeet-Status and revoke/remove the app from the configuration tab.


# Privacy policy
This extension or the slack app do not store any keys or data in any form. All data is stored locally inside chrome browser. Slack status API calls are made directly to Slack servers and no intermediate servers are used.
