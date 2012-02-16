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

			var data = {
				origin: "action"
			}

			data.width = testPattern(v, /(<td|<table)/g, /width/g);
			data.percent = testPattern(v, /width=".*?%"/g, null);
			data.spans = testPattern(v, /(rowspan|colspan)/g, null);
			data.img = testPattern(v, /<img/g, /alt/g);
			data.table = testPattern(v, /<table/g, /cellpadding/g);

			chrome.extension.sendRequest(data);
	}
}

xmlhttp.send(null)


function testPattern(v, pattern, not_pattern) {
	var result = [];

	for (var line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
		for (var j = 0; j < line_elements.length; j++) {
			if (line_elements[j].match(pattern) != null) {
				if (not_pattern == null) {
					result.push([line_number+1, line_elements[j]]);
				} else {
					if (line_elements[j].match(not_pattern) == null) {
						result.push([line_number+1, line_elements[j]]);
					}
				}
			}
		}
	}
	return result;
}

