//React when a browser action's icon is clicked.
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(null, {file: "js/jquery-1.7.1.min.js"});
	chrome.tabs.insertCSS(null, {file: "css/popup.css"});
	chrome.tabs.executeScript(null, {file: "js/background_popup.js"});
	chrome.tabs.executeScript(null, {file: "js/action.js"});
});

