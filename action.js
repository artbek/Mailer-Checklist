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

			data.width = testPattern("TDs and TABLEs without WIDTH attribute...", v, /(<td|<table)/g, /width/g);
			data.percent = testPattern("You should avoid % values...", v, /width=".*?%"/g, null);
			data.spans = testPattern("You shouldn't use ROWSPANS/COLSPANS...", v, /(rowspan|colspan)/g, null);
			data.img = testPattern("Images without ALT attributes...", v, /<img/g, /alt/g);
			data.cellpadding = testPattern("TABLEs without CELLPADDING attribute", v, /<table/g, /cellpadding/g);
			data.cellspacing = testPattern("TABLEs without CELLSPACING attribute", v, /<table/g, /cellspacing/g);

			chrome.extension.sendRequest(data);
	}
}

xmlhttp.send(null)


function testPattern(desc, v, pattern, not_pattern) {
	var result = [desc];

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

