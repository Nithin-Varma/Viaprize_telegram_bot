"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const mongoose_1 = __importDefault(require("mongoose"));
mongoose_1.default.connect(process.env.MONGODB_URI);
const db = mongoose_1.default.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});
const userSchema = new mongoose_1.default.Schema({
    chatId: Number,
    tokens: Number,
    projects: Object,
});
const User = mongoose_1.default.model('User', userSchema);
const bot = new telegraf_1.Telegraf(process.env.BOT_TOKEN);
bot.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = ctx.chat.id;
    let user = yield User.findOne({ chatId });
    if (!user) {
        user = new User({ chatId, tokens: 60, projects: {} });
        yield user.save();
        ctx.reply('You have been added to the database and given 60 tokens.');
    }
    else {
        ctx.reply('You have already voted.');
    }
}));
bot.command('projects', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const chatId = ctx.chat.id;
    const user = yield User.findOne({ chatId });
    if (!user) {
        ctx.reply('You need to vote first to access the projects.');
        return;
    }
    const projects = [
        'Project 1',
        'Project 2',
        'Project 3',
        'Project 4',
        'Project 5',
        'Project 6',
        'Project 7',
        'Project 8',
    ];
    const keyboard = telegraf_1.Markup.inlineKeyboard(projects.map((project) => telegraf_1.Markup.button.callback(project, `donate:${project}`)), {});
    ctx.reply('Here are the projects you can donate to:', keyboard);
}));
// bot.action(/donate:(.*)/, async (ctx) => {
//   const chatId = ctx?.chat?.id;
//   let user = await User.findOne({ chatId });
//   if (!user) {
//       ctx.answerCbQuery('You need to vote first to donate tokens.');
//       return;
//   }
//   const [, project] = String(ctx.match).split(':');
//   const tokensToDonate = parseInt(ctx.split(':')[2]);
//   if (!user.tokens || tokensToDonate > user.tokens) {
//           ctx.answerCbQuery('You do not have enough tokens to donate.');
//           return;
//   }
//   user.tokens -= tokensToDonate;
//   user.projects[project] = (user.projects[project] || 0) + tokensToDonate;
//   await user.save();
//   ctx.answerCbQuery(`You have donated ${tokensToDonate} tokens to ${project}.`);
// });
bot.launch();
