if ($("#mailer-checklist-wrapper").size() > 0) {
	$("#mailer-checklist-wrapper").remove();
} else {
	var source = "";
	xmlhttp = new XMLHttpRequest();
	var timestamp = Date.now();
	xmlhttp.open("GET", location.href + '?' + timestamp, true);
	xmlhttp.onreadystatechange=function() {
		switch (xmlhttp.readyState) {

			case 4:
				source = xmlhttp.responseText;
				// quick remove HTML comments, replace empty width attributes
				// to force error and split lines to array
				var v = source
					.replace(/<!.*?>/g, "")
					.replace(/width=""/g, 'width="0"')
					.split("\n");

				var data = {
					origin: "action"
				}

				var desc = "SYNTAX problems";
				data.syntax = testSyntax(desc, v);

				desc = "TDs without WIDTH attribute";
				data.tdwidth = testPattern(desc, v, /(<td)/g, /width/g);

				desc = "TDs widths don't add up";
				data.tdDontAddUp = testTdWidth(desc, v);

				desc = "IMGs without ALT attributes";
				data.imgAlt = testPattern(desc, v, /<img/g, /alt/g);

				desc = "IMGs without BORDER attributes";
				data.imgBorder = testPattern(desc, v, /<img/g, /border/g);

				desc = "IMGs width/height attributes";
				data.imageActualDimensions = [desc];

				desc = "IMGs with small height";
				data.imageSmallHeight = [desc];

				desc = "IMGs too wide";
				data.imgTooWide = testImageWidth(desc, v);

				desc = "You shouldn't use ROWSPANS/COLSPANS";
				data.spans = testPattern(desc, v, /(rowspan|colspan)/g, null);

				desc = "TABLEs without WIDTH attribute";
				data.tablewidth = testPattern(desc, v, /(<table)/g, /width/g);

				desc = "TABLEs without CELLPADDING attribute";
				data.cellpadding = testPattern(desc, v, /<table/g, /cellpadding/g);

				desc = "TABLEs without CELLSPACING attribute";
				data.cellspacing = testPattern(desc, v, /<table/g, /cellspacing/g);

				desc = "TABLEs without BORDER attribute";
				data.tableborder = testPattern(desc, v, /<table/g, /border/g);

				desc = "TABLEs too wide";
				data.tableTooWide = testTableWidth(desc, v);

				desc = "You should avoid % values";
				data.percent = testPattern(desc, v, /width=".*?%"/g, null);

				desc = "Outlook is funny about PX in attributes";
				data.outlook = testPattern(desc, v, /(height|width)="[0-9]*px?"/g, null);

				desc = "TDs with HEIGHT less than 16px";
				data.tdheight = testTDHeight(desc, v);


				// images are processed asynchronously
				// we'll use the counter to know when processing of images is finished
				var total_count_of_images = testImages(v);

				$("body").on("imageTested", function(event, result) {
					if (result.imageActualDimensions) {
						data.imageActualDimensions.push(result.imageActualDimensions);
					}
					if (result.imageSmallHeight) {
						data.imageSmallHeight.push(result.imageSmallHeight);
					}

					total_count_of_images--;
					if (total_count_of_images <= 0) {
						$("body").trigger("imagesReady");
					}
				});


				// images are processed asynchronously so we can't just call 'buildPopup()'
				// do it only if there are any images to process
				if (total_count_of_images > 0) {
					$("body").on("imagesReady", function() {
						buildPopup(data);
					});
				} else {
					buildPopup(data);
				}
		}
	}

	xmlhttp.send(null)
}


// Outlook 2013 fix.
// Table cells with height <= 15 need additional style attributes:
// 'line-height' & 'font-size'
// and can't be empty (&nbsp; is fine).
function testTDHeight(desc, v) {
	var result = [desc];
	var line_number = 0;
	var open_tds = [];
	var open_tds_content = [];
	var open_tds_keys = [];
	var last_open_td_key = '';

	for (line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number]
			.replace(/</g, "\n<")
			.replace(/>/g, ">\n")
			.split("\n");

		for (var j = 0; j < line_elements.length; j++) {
			var a = trim(line_elements[j]);
			if (! a) continue;

			if (a.match(/<td/)) {
				last_open_td_key = [line_number, j].join("_");
				open_tds_keys.push(last_open_td_key);
				open_tds[last_open_td_key] = a;
				open_tds_content[last_open_td_key] = "";

			} else if (a.match(/<\/td>/)) {
				open_tds_keys.pop(); // just remove, we have the value saved
				var last_open_td_content = trim(open_tds_content[last_open_td_key]);
				if (! last_open_td_content.match(/</)) {
					// so it's a TD without any html tags
					var open_td_line_number = parseInt(last_open_td_key.split("_")[0]) + 1;

					// now check it's height
					var last_open_td = open_tds[last_open_td_key];
					var td_height = parseInt(getAttr(last_open_td, "height"));
					if (td_height <= 15) {
						// it's a small TD, so it shouldn't be empty
						if (last_open_td_content.length == 0) {
							result.push([
								open_td_line_number,
								last_open_td + " - cell can't be empty " +
									" (try: #start#&amp;nbsp;#end# for bespoke or " +
									" #start#&amp;#160;#end# for template)"
							]);
						}
						// check if it has correct styles applied
						if (px2int($(last_open_td).css("line-height")) != td_height ||
							px2int($(last_open_td).css("font-size")) != td_height)
						{
							result.push([
								open_td_line_number,
								last_open_td + ' - #start#style="font-size: ' + td_height +
									'; line-height: ' + td_height + 'px"#end# required on TD'
							]);
						}
					}
				}
				// current TD is close so get the next key (FILO)
				// and append all content of the child TD (the one that just closed)
				var last_open_td_key = open_tds_keys[open_tds_keys.length - 1];
				open_tds_content[last_open_td_key] += last_open_td_content;

			} else {
				if (open_tds_keys.length > 0) {
					if (open_tds_content[last_open_td_key]) {
						open_tds_content[last_open_td_key] += a;
					} else {
						open_tds_content[last_open_td_key] = a;
					}
				}
			}
		}
	}

	return result;
}


// test if total width of TDs is larger that parent TABLE
function testTdWidth(desc, v) {
	var result = [desc];
	var t_width = [];
	for (var line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
		for (var j = 0; j < line_elements.length; j++) {
			var a = line_elements[j];
			if (a.length > 0) {
				if (a.match(/<table/) != null) {
					t_width.push(["table", getWidth(a, false), line_number + 1, a]);
				}
				if (a.match(/<tr/) != null) {
					t_width.push(["tr", line_number + 1]);
				}
				if (a.match(/<td/) != null) {
					t_width.push(["td", getWidth(a, false), line_number + 1]);
				}

				if (a.match(/<\/table/) != null) {
					// pop all elements until TABLE
					var total_td_width = 0;
					var max_width = 0;
					var min_width = 9999;
					var tr_under = 0;
					var tr_over = 0;
					while ((el = t_width.pop())[0] != "table") {
						if (el[0] == "tr") {
							if (total_td_width > max_width) {
								max_width = Math.max(total_td_width, max_width);
								tr_over = el[1];
							}
							if (total_td_width < min_width) {
								min_width = Math.min(total_td_width, min_width);
								tr_under = el[1];
							}
							total_td_width = 0;
						} else {
							total_td_width += el[1];
						}
					}
					// el[1] contains the width of the table
					// if it's the first table and has % value exit
					if ((t_width.length == 0) &&
						(el[1].toString().match(/%/g) != null))
					{
						break;
					} else {
						// under
						if (el[1] < max_width) {
							result.push([
								el[2],
								el[3] + " - total width of all TDs is: #start#" +
								max_width + "px #end# - (try line: #start#[" +
								tr_over + "]#end#)"
							]);
						}
						// over
						if (min_width > 0 && el[1] > min_width) {
							result.push([
								el[2],
								el[3] + " - total width of all TDs is: #start#" +
								min_width + "px #end# - (try line: #start#[" +
								tr_under + "]#end#)"
							]);
						}
					}
				}
			}
		}
	}
	return result;
}


// test if TABLE is not wider than parent TD
function testTableWidth(desc, v) {
	var result = [desc];
	var table_width = [-987];
	var td_width = [-987];

	for (var line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
		for (var j = 0; j < line_elements.length; j++) {
			var a = line_elements[j];
			if (a.length > 0) {
				if (a.match(/<table/) != null) {
					// test if not bigger than latest TD
					table_width.push(getWidth(a));
					if ((td_width.last() != -987) &&
						(table_width.last() > td_width.last()))
					{
						result.push([
							line_number+1,
							a + " - parent TD is only #start#" + td_width.last() +
							"px #end# wide"
						]);
					}
				}
				if (a.match(/<td/) != null) {
					td_width.push(getWidth(a, true));
				}

			}

		}
	}
	return result;
}


// test if IMG is not wider than parent TD
function testImageWidth(desc, v) {
	var result = [desc];
	var img_width = [-987];
	var td_width = [-987];

	for (var line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
		for (var j = 0; j < line_elements.length; j++) {
			var a = line_elements[j];
			if (a.length > 0) {
				if (a.match(/<img/) != null) {
					// test if not bigger than latest TD
					img_width.push(getWidth(a));
					if ((td_width.last() != -987) &&
						(img_width.last() > td_width.last()))
					{
						result.push([
							line_number+1,
							a + " - parent TD is only #start#" + td_width.last() +
							"px #end# wide"
						]);
					}
				}
				if (a.match(/<td/) != null) {
					td_width.push(getWidth(a, true));
				}

			}

		}
	}
	return result;
}


// extract width of element: width attribute + padding
function getWidth(a, ignorePadding) {
	var width_string = a.match(/width=".*?"/);
	var padding_value = 0;

	if (! ignorePadding) {

		var padding_string = a.match(/style.*?".*padding.*?"/);

		// found padding attribute
		if (padding_string != null) {
			$("body").append("<div id='test-padding-dummy'></div>");
			var padding_string = padding_string[0].replace(/style|=|"/g, "");
			var split_styles = padding_string.split(";");
			for (st = 0; st < split_styles.length; st++) {
				if (trim(split_styles[st]).length > 0) {
					var key_val = split_styles[st].split(":");
					$("#test-padding-dummy").css(trim(key_val[0]), trim(key_val[1]));
				}
			}

			var padding_left = px2int($("#test-padding-dummy").css("padding-left"));
			var padding_right = px2int($("#test-padding-dummy").css("padding-right"));
			padding_value = padding_left + padding_right;
			$("#test-padding-dummy").remove();

		}
	}

	// found width attribute
	if (width_string != null) {
		var width_value = width_string[0].replace("width=", "").replace(/"/g, "");
		if (! isNaN(width_value)) {
			return parseInt(padding_value) + parseInt(width_value);
		} else {
			return width_value;
		}
	}

	// haven't found width attribute
	return -1;

}

function testSyntax(desc, v) {
	var result = [desc];
	var tags = [];

	for (var line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
		for (var j = 0; j < line_elements.length; j++) {

			// end tag
			if ((m = line_elements[j].match(/<\/.*?>/)) != null) {
				var tag_name = trim(m[0].replace(/<\/|>/g, "").split(" ")[0]);
				if (tags.length > 0) {
					if ((t = tags.pop()) != tag_name) {
						result.push([
							line_number+1,
							line_elements[j] + " - expected #start# </" + t + "> #end#"
						]);
						return result;
					}
				}

			// start tag
			} else if ((m = line_elements[j].match(/<.*?>/)) != null) {
				// if not closed on the same line, e.g. <br />
				if (line_elements[j].match(/\/>/) == null) {
					var tag_name = trim(m[0].replace(/<|>/g, "").split(" ")[0]);
					tags.push(tag_name);
				}
			}

		}
	}
	return result;
}


function testPattern(desc, v, pattern, not_pattern) {
	var result = [desc];
	var pastFirstTable = false;

	for (var line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
		for (var j = 0; j < line_elements.length; j++) {

			// ignore % value on the first table
			if ((! pastFirstTable) &&
				line_elements[j].match(/<table/) != null &&
				pattern.toString().match(/%/) != null)
			{
				pastFirstTable = true;
				break;
			}

			if ((m = line_elements[j].match(pattern)) != null) {
				if (not_pattern == null) {
					result.push([
						line_number+1,
						line_elements[j].replace(pattern, "#start#$&#end#")
					]);
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

// count images and attach necessary 'onload' event handlers, processing
// synchronously dosn't guarantee that '.width' & '.height' will be populated
function testImages(v) {
	var tags = [];
	var last_open_td = [];
	var total_count = 0;

	for (var line_number = 0; line_number < v.length; line_number++) {
		var line_elements = v[line_number].replace(/</g, "\n<").split("\n");
		for (var j = 0; j < line_elements.length; j++) {
			if (line_elements[j].match(/<td/) != null) {
				last_open_td = [line_number, line_elements[j]];

			} else if (line_elements[j].match(/<img/) != null) {
				if ((img_src = getAttr(line_elements[j], "src")) != null) {
					total_count++;

					var temp_img = new Image();
					temp_img.src = img_src;
					temp_img.user_given_img_tag = line_elements[j];
					temp_img.last_open_td = last_open_td;
					temp_img.line_number = line_number;

					temp_img.onload = function(event) {
						var that = this;
						var result = {};

						if ( actualDimensionsDifferent(that) ) {
							result.imageActualDimensions = [
								that.line_number + 1,
								that.user_given_img_tag + " - should be: #start#" + that.width +
								" x " + that.height + "#end#"
							];
						}

						// Outlook 2013 fix
						// check if under 20px in height & no fixes applied
						if (that.height < 20) {
							var td_wrap = that.last_open_td[1];
							var td_wrap_line_number = that.last_open_td[0];
							if (px2int($(td_wrap).attr("height")) != that.height ||
								px2int($(td_wrap).css("line-height")) != that.height) {
								result.imageSmallHeight = [
									td_wrap_line_number + 1,
									td_wrap + ' - small image (height < 20px) - #start#height="' +
									that.height +
									'"#end# and #start#style="line-height: ' +
									that.height + 'px"#end# required on TD'
								];
							}
						}

						$("body").trigger("imageTested", result);
					}

					temp_img.onerror = function(event) {
						alert("Couldn't load image: [" + img_src + "]");
					}
				}
			}

		}
	}
	return total_count;
}

function actualDimensionsDifferent(img_element) {
	var are_different = false;

	var user_img_width = getAttr(img_element.user_given_img_tag, "width");
	var user_img_height = getAttr(img_element.user_given_img_tag, "height");
	if ((user_img_width != img_element.width) || (user_img_height != img_element.height)) {
		are_different = true;
	}

	return are_different;
}


// UTILS

Array.prototype.last = function() {
	return this.slice(-1)[0];
}

function trim(stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g,"");
}

function px2int(str) {
	number = undefined;

	if (str) {
		number = parseInt(str.replace("px", ""));
	}

	return number;
}

function getAttr(str, attr) {
	if ((attr_string = str.match(new RegExp(attr + '=".*?"'))) != null) {
		var attr_value = attr_string[0]
			.replace(new RegExp(attr + '='), "")
			.replace(/"/g, "");
		return attr_value;
	} else {
		return null;
	}
}
