//console.log("in action.js");
//
var source = "";
xmlhttp = new XMLHttpRequest();
xmlhttp.open("GET", location.href, true);
xmlhttp.onreadystatechange=function() {
	switch (xmlhttp.readyState) {
		case 0: 
			chrome.extension.sendRequest("!request not initialized!");
			break;

		case 1: 
			chrome.extension.sendRequest("server connection established");
			break;

		case 2: 
			chrome.extension.sendRequest("request received");
			break;

		case 3:
			chrome.extension.sendRequest("processing request");
			break;

		case 4: 
			chrome.extension.sendRequest("finished");
			source = xmlhttp.responseText;
			var v = source.split("\n");


			// TD has width
			var pattern = /<td/g;
			var pattern2 = /width/g;
			var td_result = [];

			for (var line_number = 0; line_number < v.length; line_number++) {
				var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
				for (var j = 0; j < line_elements.length; j++) {
					if (line_elements[j].match(pattern) != null) {
						if (line_elements[j].match(pattern2) == null) {
							td_result.push([line_number+1, line_elements[j]]);
						}
					}
				}
			}

			// has % value
			var pattern = /width=".*?%"/g;
			var percent_result = [];

			for (var line_number = 0; line_number < v.length; line_number++) {
				var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
				for (var j = 0; j < line_elements.length; j++) {
					if (line_elements[j].match(pattern) != null) {
						percent_result.push([line_number+1, line_elements[j]]);
					}
				}
			}


			chrome.extension.sendRequest({
				origin: "action",
				td: td_result,
				percent: percent_result
			});
	}
}
xmlhttp.send(null)
