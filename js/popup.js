function scrollScore(val) {
	$("#your-score").text(val);
	var total_height = $("#score").height() - $("#score li:first").height();
	var target_height = ((val * total_height) / 100) - 20;
	var time = 300;
	var easing = 'swing';
	$("#score").stop(true, true).animate({bottom: -(target_height + 25)}, time, easing, function() {
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

chrome.tabs.executeScript(null, {file:"action.js"});
chrome.extension.onMessage.addListener(function(data, sender, resp) {
	if (data.origin == "action") {
		$("#log-message").hide();
		var total_score = 0;
		$.each(data, function(key, value) {
			if (key != "origin") {
				total_score += buildList(key, value);
			}
		});
		var your_score = Math.round(100 - Math.min((total_score / 100) * 100, 100));
		scrollScore(your_score);
	} else if (data.origin == "message") {
		$("#log-message").text(data.msg);
	} else {
		console.log(data);
	}
});

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

	$("#main-list").append(dom);
	return errors_count;
}



(function() {
	$(document).ready(function() {
		$("#main-list").on("click", "strong, span.count", function() {
			if ($(this).parent().children(".count").text() != "0") {
				var slideTime = $(this).parent().children("ul").children("li").size();
				$(this).parent().children("ul").slideToggle(slideTime * 5);
			}
		});


		$("#score-wrapper").on("mouseover", function() {
			$(this).stop().fadeTo(500, 0.1);
		});

		$("#score-wrapper").on("mouseout", function() {
			$(this).stop().fadeTo(500, 0.9);
		});
	});
})(jQuery)

