const config = require('./config/secrets');
const Discord = require('discord.js');
const bot = new Discord.Client();
const rp = require('request-promise');
const $ = require('cheerio');
const fs = require('fs');
const phobia_list = require('./config/list');
const paginationEmbed = require('discord.js-pagination');

bot.on('ready', () => { console.log(bot.user.tag + " is online"); })

bot.on('message', msg => { if (msg.content.toLowerCase().startsWith(config.prefix)) { commandProcess(msg); } });

function commandProcess(msg) {
	let rawCommand = msg.content;
    let fullCommand = rawCommand.substr(config.prefix.length);
    let splitCommand = fullCommand.split(' ');
	splitCommand = splitCommand.filter(function(e){return e});
    let primaryCommand = splitCommand[0];
    let arguments = splitCommand.slice(1);

	switch (primaryCommand.toLowerCase()) {
		case 'help': // show helps
			showHelp(msg, arguments);
			break;

		case 'update': // update the list    /!\ only available for the bot owner /!\
			if (String(msg.author.id) === "310450863845933057")
				updatePhobia(msg, arguments);
			break;

		case 'phobia': // get a random phobia
			getPhobia(msg);
			break;

		case 'search': // look for a phobia
			searchPhobia(msg, String(arguments[0]));
			break;

		case 'list': // get the list of all phobias
			searchPhobia(msg, 'list');
			break;

		case 'guess': // guess the description of a phobia
			guessPhobia(msg);
			break;

		default:
			msgReply(msg, "this command doesn't exist.");
	}
}

function showHelp(msg) {
	let embed = new Discord.MessageEmbed()
		.setThumbnail(bot.user.displayAvatarURL())
		.setURL("https://github.com/Dastan21/PhobiaGuesser")
		.setFooter(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', dynamic: true}))
		.setTitle("HELP PANEL")
		.setDescription("‎PhobiaGuesser is a minigame bot to mainly guess what a phobia is, depending to its name.\n‎")
		.addFields(
			{ name: "Prefix `?`", value: "\n‎" },
			{ name: "Commands", value: "• `phobia` Get a random phobia\n• `search` Look for a phobia\n• `list` Get the list of all phobias\n• `guess` Guess the description of a phobia\n‎" }
		);
	msgSend(msg, "", embed);
}

function updatePhobia(msg) {
	let list = {};
	rp('https://fearof.org/phobias-list/')
		.then(function(html) {
			let listDOM = $('p a', $('.all-phobias', html));

			for (let i = 0; i < Object.keys(listDOM).length; i++) {
				if (listDOM[i] !== undefined) {
					list[i] = {
						name: listDOM[i].children[0].data,
						description: listDOM[i].next.data.replace(' – ', '')
					};
				}
			};
			fs.writeFile("./config/list.json", JSON.stringify(list), (err) => {
			    if (err) { console.error(err); return; }
			    msgReply(msg, "the list has been successfully updated!");
			});
		})
		.catch(function(err) { console.error(err); }
	);
}

function getPhobia(msg, args) {
	let phobia = randomPhobia();
	msgSend(msg, phobia.name + " - " + phobia.description);
}

function searchPhobia(msg, search) {
	if (search === "undefined") { msgReply(msg, "wrong usage: `?search [WORD]`"); return; }
	let title = "Results for `" + search + "`";
	if (search === "list") {
		search = "";
		title = "List of phobias"
	}
	let r = 0;
	let pages = [];
	let res = searchPhobias(phobia_list, search);
	if (res.length > 0) {
		let p = -1;
		for (phobia of res) {
			r++;
			if (r % 5 == 1) {
				p++;
				pages[p] = new Discord.MessageEmbed().setTitle(title).setDescription("\n‎");
			}
			pages[p].addFields({name: phobia.name, value: phobia.description + "\n‎"});
		}
	} else
		pages.push(new Discord.MessageEmbed().setTitle(title).setDescription("\n‎").addField("No phobia contains your search...", "‎"));
	paginationEmbed(msg, pages);
}

function guessPhobia(msg) {
	let phobia = randomPhobia();
	msgSend(msg, "Here is a phobia: `" + phobia.name + "`. You have 2 minutes to guess what type of phobia this one is.");
	const filter = m => phobia.description.includes(m.content.split(' ').filter(function(e){return e}));
	msg.channel.awaitMessages(filter, { max: 1, time: 120000, errors: ['time'] })
		.then(collected => msgReply(msg, "well done! You've guessed it! The description is: " + phobia.description))
		.catch(collected => msgSend(msg, "No one has guessed! The phobia description was: " + phobia.description));
}

async function msgSend(msg, content, attachment) {
	return await msg.channel
		.send(content, attachment)
		.catch(err => { console.log(err); }
	);
}
async function msgReply(msg, content) {
	return await msg
		.reply(content)
		.catch(err => { console.log(err); }
	);
}
function randomPhobia() {
	return phobia_list[Math.round((Math.random()*Math.floor(Object.keys(phobia_list).length))+Math.floor(0))];
}
function searchPhobias(json, search) {
	let res = [];
	for (let i = 0; i < Object.keys(json).length; i++) {
		if (json[i].description.includes(search))
			res.push(json[i]);
	}
	return res;
}

bot.login(config.token);
