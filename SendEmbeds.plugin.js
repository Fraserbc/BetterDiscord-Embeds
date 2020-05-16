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
    var el = $('.da-textArea');
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
    return "2.0";
};

SendEmbeds.prototype.getAuthor = function() {
    return "Originally written by Septeract - https://github.com/hepteract/, Modified by Fraser Price - https://github.com/Fraserbc";
};

let sendEmbed = function(embed) {
    // Get the ID of the channel we want ot send the embed to
    var channelID = window.location.pathname.split('/').pop();

    // Create the message
    let MessageQueue = DiscordInternals.WebpackModules.findByUniqueProperties(['enqueue']);
    let MessageParser = DiscordInternals.WebpackModules.findByUniqueProperties(["createBotMessage"]);

    let msg = MessageParser.createBotMessage(channelID, "");

    // Send the message
    MessageQueue.enqueue({
        type: "send",
        message: {
            channelId: channelID,
            content: "",
            tts: false,
            nonce: msg.id,
            embed: embed
        }
    }, r => {
        return;
    });
}

// Split a string on only the first delimeter
let splitSingle = function(str, delimeter) {
    part1 = str.substr(0, str.indexOf(delimeter));
    part2 = str.substr(str.indexOf(delimeter) + 1);

    return [part1, part2]
}

let lastKey = 0;
SendEmbeds.prototype.attachHandler = function() {
    var el = $('.da-textArea');
    if (el.length == 0) return;
    var self = this;

    // Handler to catch key events
    this.handleKeypress = function(e) {
        var code = e.keyCode || e.which;

        if (code !== 13) {
            //console.log(`Ignored keypress: ${code}`);
            lastKey = code;
            return;
        }

        //Catch Shift + Enter and allow multiline
        if (lastKey == 16) {
            return;
        }

        var text = $(this)[0].innerText;
        if (!text.startsWith("/e")) {
            //console.log(`Ignored text entry: ${text}`);
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        // Strip away the /e
        text = text.replace("/e ", "");

        // Split it by newlines
        text = text.split("\n");

        // For every line, split it by : to get the arguments
        for (var x = 0; x < text.length; x++) {
            text[x] = splitSingle(text[x], ":");

            if(text[x][1].startsWith(" ")) {
                text[x][1] = text[x][1].replace(" ", "", 1);
            }
        }

        // Create the embed structure
        embed = {
            title: "",
            description: "",
            url: "",
            color: "",
            timestamp: "",
            footer_image: "",
            footer: "",
            thumbnail: "",
            image: "",
            author: "",
            author_url: "",
            author_icon: ""
        }

        // Fill the embed
        var attrb_last = "";
        for (var x = 0; x < text.length; x++) {
            var attrb = text[x][0];
            var value = text[x][1];

            if (embed[attrb] != undefined) {
                embed[attrb] = value;
                attrb_last = attrb;
            } else {
                embed[attrb_last] += "\n" + value;
            }
        }

        // Find the unused fields
        unused = []
        keys = Object.keys(embed)
        for (var x = 0; x < keys.length; x++) {
            if (embed[keys[x]] == "") {
                unused.push(keys[x]);
            }
        }

        // Remove the unused fields
        for (var x = 0; x < unused.length; x++) {
            delete embed[unused[x]];
        }

        // Proccess color
        if (embed["color"]) {
            // Change the sepcified color from hex to decimal
            embed["color"] = parseInt(embed["color"].replace("#", "0x"));
        } else {
            // If a color was not specified, set it to black
            embed["color"] = parseInt("0x000000");
        }

        // Convert the embed to Discord's format
        discordEmbed = {
            type: "rich"
        }
        keys = Object.keys(embed)
        for (var x = 0; x < keys.length; x++) {
            if (keys[x] == "title") {
                discordEmbed["title"] = embed["title"];
            } else if (keys[x] == "description") {
                discordEmbed["description"] = embed["description"];
            } else if (keys[x] == "url") {
                discordEmbed["url"] = embed["url"];
            } else if (keys[x] == "color") {
                discordEmbed["color"] = embed["color"];
            } else if (keys[x] == "timestamp") {
                // Check if we want a timestamp
                if (embed["timestamp"].toLowerCase() != "true") {
                    continue;
                }

                timestamp = (new Date).toISOString();
                discordEmbed["timestamp"] = timestamp;
            } else if (keys[x] == "footer_image") {
                if (discordEmbed["footer"] == undefined) {
                    discordEmbed["footer"] = {};
                }

                if (discordEmbed["footer"]["text"] == undefined) {
                    discordEmbed["footer"]["text"] = "test";
                }

                discordEmbed["footer"]["icon_url"] = embed["footer_image"];
            } else if (keys[x] == "footer") {
                if (discordEmbed["footer"] == undefined) {
                    discordEmbed["footer"] = {};
                }

                discordEmbed["footer"]["text"] = embed["footer"];
            } else if (keys[x] == "thumbnail") {
                discordEmbed["thumbnail"] = {};
                discordEmbed["thumbnail"]["url"] = embed["thumbnail"];
            } else if (keys[x] == "image") {
                discordEmbed["image"] = {};
                discordEmbed["image"]["url"] = embed["image"];
            } else if (keys[x] == "author") {
                if (discordEmbed["author"] == undefined) {
                    discordEmbed["author"] = {};
                }

                discordEmbed["author"]["name"] = embed["author"];
            } else if (keys[x] == "author_url") {
                if (discordEmbed["author"] == undefined) {
                    discordEmbed["author"] = {};
                }

                if (discordEmbed["author"]["name"] == undefined) {
                    discordEmbed["author"]["name"] = "test";
                }

                discordEmbed["author"]["url"] = embed["author_url"];
            } else if (keys[x] == "author_icon") {
                if (discordEmbed["author"] == undefined) {
                    discordEmbed["author"] = {};
                }

                if (discordEmbed["author"]["name"] == undefined) {
                    discordEmbed["author"]["name"] = "test";
                }

                discordEmbed["author"]["icon_url"] = embed["author_icon"];
            }
        }

        //console.log(embed);

        // Send the embed
        sendEmbed(discordEmbed);

        //$(this)[0].innerText = "";
        $(this).css("height", "auto");
        lastKey = 0;
    }

    // bind handlers
    el[0].addEventListener("keydown", this.handleKeypress, false);
}