import { Markup, Telegraf } from 'telegraf';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI as string, { useNewUrlParser: true, useUnifiedTopology: true } as any);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const userSchema = new mongoose.Schema({
    chatId: Number,
    tokens: Number,
    projects: Object,
  });
  
  const User = mongoose.model('User', userSchema);
  

  const bot = new Telegraf(process.env.BOT_TOKEN as string);

  bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    let user = await User.findOne({ chatId });

    if (ctx.message.text.startsWith('/')) {
      return;
    }
  
    if (!user) {
      user = new User({ chatId, tokens: 60, projects: {} });
      await user.save();
      ctx.reply('You have been added to the database and given 60 tokens.');
    } else if (Object.keys(user.projects || {}).length === 0) {
      ctx.reply('You have not voted for any projects yet.');
    } else {
      ctx.reply('You have already voted.');
    }
  });
  
  bot.command('projects', async (ctx) => {
    const chatId = ctx.chat.id;
    const user = await User.findOne({ chatId });
  
    if (!user) {
      ctx.reply("You are not able to vote for projects...");
      return;
    } else {
      ctx.reply(`you have ${user.tokens} tokens to vote with.`);
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
  
    const keyboard = Markup.inlineKeyboard(
      projects.map((project) => Markup.button.callback(project, `donate:${project}`)),
      {}
    );
  
    ctx.reply('Here are the projects you can donate to:', keyboard);
  });
  

  bot.action(/donate:(.*)/, async (ctx) => {
    const chatId = ctx?.chat?.id;
    let user = await User.findOne({ chatId });
  
    if (!user) {
      ctx.answerCbQuery('You need to vote first to donate tokens.');
      return;
    }
  
    const [, project] = String(ctx.match[1]).split(':');
    const tokensToDonate = parseInt(project.split(':')[2]);
  
    if (!user.tokens || tokensToDonate > user.tokens) {
      ctx.answerCbQuery('You do not have enough tokens to donate.');
      return;
    }
  
    user.tokens -= tokensToDonate;
    user.projects[project] = (user.projects[project] || 0) + tokensToDonate;
    await user.save();
  
    ctx.answerCbQuery(`You have donated ${tokensToDonate} tokens to ${project}.`);
  });
  
  
  bot.launch();
