function buildPopup(data) {
	buildHTML();
	attachEvents();
	processData(data);
}

function buildHTML() {
		$("#log-wrapper").remove();
		$("body").append('<div id="log-wrapper"></div>');
		$("#log-wrapper").append('<ul id="main-list"></ul>');

	
		$("#log-wrapper").append('<div id="log-message">If you want access to local files (file:///*) make sure to tick: <br /><span style="color: #993300">"Allow access to file URLs"</span> in: <span style="font-weight: bold;">chrome://settings/extensions</span></div>');

		$("#log-wrapper").append('<div id="score-wrapper"><div id="marker"></div><div id="your-score"></div> <div id="top-shadow"></div> <div id="left-shadow"></div> <ul id="score" title="Your score"> <li>Well done!</li> <li>Not bad</li> <li>Getting there.</li> <li>Good effort!</li> <li>Not bad, for an amateur.</li> <li>Trying to be funny?!</li> <li>Pull your finger out?</li> <li>Really?!</li> <li>Don\'t insult me!</li> <li>Fail!</li> <li class="last">Deep s&#$!</li> </ul> <div id="right-shadow"></div> <div id="bottom-shadow"></div> </div>');
		
	}
function processData(data) {
	$("#log-wrapper #log-message").hide();
	var total_score = 0;

	$.each(data, function(key, value) {
		if (key != "origin") {
			total_score += buildList(key, value);
		}
	});
	var your_score = Math.round(100 - Math.min((total_score / 100) * 100, 100));
	scrollScore(your_score);
}



function scrollScore(val) {
	$("#log-wrapper #your-score").text(val);
	var total_height = $("#log-wrapper #score").height() - $("#log-wrapper #score li:first").height();
	var target_height = ((val * total_height) / 100) - 20;
	var time = 300;
	var easing = 'swing';
	$("#log-wrapper #score").stop(true, true).animate({bottom: -(target_height + 25)}, time, easing, function() {
		$(this).animate({bottom: -(target_height - 25)}, time, easing, function() {
			$(this).animate({bottom: -(target_height + 10)}, time, easing, function() {
				$(this).animate({bottom: -(target_height - 10)}, time, easing, function() {
					$(this).animate({bottom: -(target_height + 4)}, time, easing, function() {
						$(this).animate({bottom: -(target_height - 4)}, time, easing, function() {
							$(this).animate({bottom: -(target_height)}, time, easing);
						});
					});

				});
			});
		});
	});
}



function buildList(listName, listValues) {
	var dom = '<li class="level_1"><strong>' + listValues[0] + '</strong>';
	var errors_count = listValues.length - 1;
	dom += '<span id="' + listName + '-count" class="count' + ((errors_count == 0)?" zero":"") + '">' + errors_count + '</span>';
	dom += '<ul id="' + listName + '-output" class="output">';

	if (errors_count > 0) {
		for (var i = 1; i <= errors_count; i++) {
			dom += '<li><code style="display: block"><em>[' + listValues[i][0] + ']</em> ';
			dom += listValues[i][1].replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/#start#/g, "<em>").replace(/#end#/g, "</em>");
			dom += '</code></li>';
		}
	}

	dom += '</ul></li>';

	$("#log-wrapper #main-list").append(dom);
	return errors_count;
}



function attachEvents() {
		$("#log-wrapper #main-list").on("click", "strong, span.count", function() {
			if ($(this).parent().children(".count").text() != "0") {
				var slideTime = $(this).parent().children("ul").children("li").size();
				$(this).parent().children("ul").slideToggle(slideTime * 5);
			}
		});

		$("#log-wrapper").on("click", function(e) {
			e.preventDefault();
			e.stopPropagation();
		});

		$("html").on("click", function(e) {
			$("#log-wrapper").remove();
		});

		$("#log-wrapper #score-wrapper").on("mouseover", function() {
			$(this).stop().fadeTo(500, 0.1);
		});

		$("#log-wrapper #score-wrapper").on("mouseout", function() {
			$(this).stop().fadeTo(500, 0.9);
		});
	}

