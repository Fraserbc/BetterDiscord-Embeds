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
    var el = $('.da-form');
    if (el.length == 0) return;

    // Remove handlers and injected script
    el[0].removeEventListener("keydown", this.handleKeypress);
};

SendEmbeds.prototype.getName = function() {
    return "Send Embeds";
};

SendEmbeds.prototype.getDescription = function() {
    return "Allows you to create fancy embed text.";
};

SendEmbeds.prototype.getVersion = function() {
    return "3.0";
};

SendEmbeds.prototype.getAuthor = function() {
    return "Originally written by Septeract - https://github.com/hepteract/, Modified by Fraserbc - https://github.com/Fraserbc";
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
        type: 0,
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

// Get the deepest child of a parent
let getDeepest = function(elem) {
    if(elem.firstChild == null) {
        return elem;
    } else {
        return getDeepest(elem.firstChild)
    }
}

// Split a string on only the first delimeter
let splitSingle = function(str, delimeter) {
    part1 = str.substr(0, str.indexOf(delimeter));
    part2 = str.substr(str.indexOf(delimeter) + 1);

    return [part1, part2]
}

let lastKey = 0;
SendEmbeds.prototype.attachHandler = function() {
    var el = $('form[class^="form-"]');
    if (el.length == 0) return;

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

        // Parse the text
        var elements = Array.from($('div[class^="textArea-"]')[0].children[0].children);
        var text = "";
        elements.forEach(function(l0) {
            Array.from(l0.children).forEach(function(l1) {
                Array.from(l1.children).forEach(function(elem) {
                    console.log(elem);
                    elem = getDeepest(elem);
                    if(elem.alt) {
                        text += elem.alt;
                    } else {
                        text += elem.textContent;
                    }
                });
            });
            text += "\n";
        });
        if (!text.startsWith("/e")) {
            //console.log(`Ignored text entry: ${text}`);
            return;
        }

        console.log(text);

        e.preventDefault();
        e.stopPropagation();

        // Strip away the /e
        text = text.replace("/e ", "");

        // Remove a stupid character discord adds
        text = text.replace("\uFEFF", "");

        // Split it by newlines
        text = text.replace(/\n\n/g, "\n");
        text = text.split("\n");

        // Create the embed
        fields = ["title", "description", "url", "color", "timestamp", "footer_image", "footer", "thumbnail", "image", "author", "author_url", "author_icon"]
        embed = {}
        last_attrb = ""
        for (var x = 0; x < text.length; x++) {
            var line = text[x]
            var split = splitSingle(line, ":");

            // Check if it is an attribute or continuation of previous
            if(fields.includes(split[0])) {
                // Check if there is a leading " "
                if(split[1].startsWith(" ")) {
                    embed[split[0]] = split[1].slice(1);
                } else {
                    embed[split[0]] = split[1];
                }

                // Store the last attribute to be set so we can have multi-line
                last_attrb = split[0];
            } else {
                embed[last_attrb] += "\n" + line;
            }
        }
        console.log(embed);

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
                if (!embed["timestamp"].toLowerCase().startsWith("true")) {
                    continue;
                }

                timestamp = (new Date).toISOString();
                console.log(timestamp)
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