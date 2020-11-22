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
		case 'help':
			// showHelp(msg, arguments);
			break;
		case 'update': // update the list
			if (String(msg.author.id) === "310450863845933057")
				updatePhobia(msg, arguments);
			break;
		case 'phobia': // get a random phobia
			getPhobia(msg, arguments);
			break;
		case 'search': // look for a phobia
			searchPhobia(msg, arguments);
			break;
		case 'guess': // guess the description of a phobia
			// guessPhobia(msg, arguments);
			break;
		default:
			msgReply(msg, "this command doesn't exist.");
	}
}

function updatePhobia(msg, args) {
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

function searchPhobia(msg, args) {
	let search = String(args[0]);
	if (search === "undefined") search = "";
	let embed = new Discord.MessageEmbed().setTitle("Results for : " + search);
	let r = 0;
	let pages = [];
	let res = searchPhobias(phobia_list, search);
	if (res.length > 0) {
		let p = -1;
		for (phobia of res) {
			r++;
			if (r % 10 == 1) {
				p++;
				pages[p] = new Discord.MessageEmbed().setTitle("Results for : " + search);
			}
			pages[p].addField(phobia.name, phobia.description);
		}
	} else
		pages.push(new Discord.MessageEmbed().setTitle("Results for : " + search).addField("No result", "‎"));
	paginationEmbed(msg, pages);
}

function guessPhobia(msg, args) {
	let phobia = randomPhobia();
	msgSend(msg, "WIP: " + phobia.name + " - " + phobia.description);
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
	return phobia_list[randomInt(0, Object.keys(phobia_list).length)];
}
function randomInt(min, max) {
	return Math.round((Math.random()*Math.floor(max))+Math.floor(min));
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
