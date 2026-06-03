require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const BOT_TOKEN=proces...onst ALLOWED = (process.env.ALLOWED_USERS || '').split(',').map(Number);
const userData = {};
async function callAI(msg, prov) {
    const key = process.env[prov.toUpperCase() + '_API_KEY'];
    if (!key) return 'No API key';
    const cfg = { anthropic: { url: 'https://api.anthropic.com/v1/messages', body: { model: 'claude-sonnet-4-20250514', max_tokens: 4096, messages: [{ role: 'user', content: msg }] }, hdr: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, get: function(d) { return d.content[0].text; } }, deepseek: { url: 'https://api.deepseek.com/v1/chat/completions', body: { model: 'deepseek-chat', messages: [{ role: 'user', content: msg }], max_tokens: 4096 }, hdr: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, get: function(d) { return d.choices[0].message.content; } } };
    const c = cfg[prov] || cfg.anthropic;
    try { const r = await axios.post(c.url, c.body, { headers: c.hdr, timeout: 60000 }); return c.get(r.data); } catch (e) { return 'Error: ' + e.message.substring(0, 100); }
}
const bot = new Telegraf(BOT_TOKEN);
bot.use(function(ctx, next) { if (ALLOWED.length > 0 && ALLOWED.indexOf(ctx.from.id) === -1) { ctx.reply('Unauthorized'); return; } return next(); });
bot.command('start', function(ctx) { ctx.reply('NovaBot\n\n/start /help /model /reset'); });
bot.command('help', function(ctx) { ctx.reply('Commands:\n/start\n/help\n/model [name]\n/reset'); });
bot.command('model', function(ctx) { var arg = ctx.message.text.split(' ')[1]; if (arg && ['anthropic', 'deepseek'].indexOf(arg) !== -1) { userData[ctx.from.id] = arg; ctx.reply('Provider: ' + arg); } else { ctx.reply('Current: ' + (userData[ctx.from.id] || 'anthropic')); } });
bot.command('reset', function(ctx) { delete userData[ctx.from.id]; ctx.reply('Cleared'); });
bot.on('text', async function(ctx) { if (ctx.message.text.startsWith('/')) return; ctx.replyWithChatAction('typing'); var prov = userData[ctx.from.id] || 'anthropic'; var result = await callAI(ctx.message.text, prov); ctx.reply(result.substring(0, 4000)); });
console.log('NovaBot started!');
bot.launch();
process.once('SIGINT', function() { bot.stop('SIGINT'); });
process.once('SIGTERM', function() { bot.stop('SIGTERM'); });
