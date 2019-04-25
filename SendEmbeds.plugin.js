//META{"name":"SendEmbeds"}*//

function SendEmbeds() {
	return;
}

SendEmbeds.prototype.load = function() {};

SendEmbeds.prototype.unload = function() {};

SendEmbeds.prototype.start = function() {
	this.attachHandler();
};

SendEmbeds.prototype.onSwitch = function() {
	this.attachHandler();
};

SendEmbeds.prototype.stop = function() {
	var el = $('.da-channelTextArea textArea');
	if (el.length == 0) return;

	// Remove handlers and injected script
	el.unbind("click focus", this.focusHandler);
	el[0].removeEventListener("keydown", this.handleKeypress);
};

SendEmbeds.prototype.getName = function() {
	return "Send Embeds";
};

SendEmbeds.prototype.getDescription = function() {
	return "Allows you to create fancy embed text.";
};

SendEmbeds.prototype.getVersion = function() {
	return "0.2";
};

SendEmbeds.prototype.getAuthor = function() {
	return "Originally written by Septeract - https://github.com/hepteract/, Modified by Fraser Price - https://github.com/Fraserbc";
};

let sendEmbed = function(title, text, color) {
	var channelID = window.location.pathname.split('/').pop();
	var embed = {
		type : "rich",
		description : text
	};

	if (color) {
		embed.color = color;
	}

	if (title) {
		embed.title = title;
	}
	
	let MessageQueue = DiscordInternals.WebpackModules.findByUniqueProperties(['enqueue']);
	let MessageParser = DiscordInternals.WebpackModules.findByUniqueProperties(["createBotMessage"]);

	let msg = MessageParser.createMessage(channelID, "");

	MessageQueue.enqueue({
		type: "send",
		message: {
			channelId: channelID,
			content: this.msgContent,
			tts: false,
			nonce: msg.id,
			embed: embed
		}
	}, r => { return; })
}

let lastKey = 0;
SendEmbeds.prototype.attachHandler = function() {
	var el = $('.da-channelTextArea textArea');
	if (el.length == 0) return;
	var self = this;

	// Handler to catch key events
	this.handleKeypress = function (e) {
		var code = e.keyCode || e.which;
		console.log(lastKey);
		if (code !== 13) {
			//console.log(`Ignored keypress: ${code}`);
			lastKey = code;
			return;
		}
		
		//Catch Shift + Enter and allow multiline
		if (lastKey == 16) {
			console.log(lastKey);
			return;
		}

		var text = $(this).val();
		if (!text.startsWith("/e")) {
			//console.log(`Ignored text entry: ${text}`);
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		var color;
		var msg;
		if (text[3] == "#") {
			color = parseInt(text.slice(4, 10), 16);
			msg = text.substring(11);
		} else {
			msg = text.substring(3);
		}

		var title;
		if (msg[0] == "\"") {
			msg = msg.substring(1);
			let index = msg.indexOf("\"");

			title = msg.substring(0, index);
			msg = msg.substring(index + 2);
		}

		sendEmbed(title, msg, color);
		
		$(this).val("");
		$(this).css("height", "auto");
		lastKey = 0;
	}

	// bind handlers
	el[0].addEventListener("keydown", this.handleKeypress, false);
}
