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

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  votes: Number,
});

const Project = mongoose.model('Project', projectSchema);

const userSchema = new mongoose.Schema({
  chatId: Number,
  tokens: Number,
});

const User = mongoose.model('User', userSchema);

const bot = new Telegraf(process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN');

bot.start(async (ctx) => {
  const chatId = ctx.chat.id;

  let user = await User.findOne({ chatId });

  if (!user) {
    user = new User({ chatId, tokens: 60 }); 
    await user.save();
    ctx.reply('Welcome to the bot! You have been added to the database and given 60 tokens.');
  } else {
    ctx.reply('Welcome back! You already have an account with 60 tokens.');
  }
});

bot.help((ctx) => {
  ctx.reply('Here are the available commands:\n/projects - List available projects for voting\n/vote - Vote for a project');
});

async function addProjects() {
  const projectsToAdd = [
    {
      name: 'github plag checker',
      description: 'plagcheck is a tool to check plagiarism in github repos. It is a command line tool which takes a github repo url as input and checks for plagiarism in the repo. It also provides a web interface to view the results.',
      votes: 0,
    },
    {
      name: 'github plag checker',
      description: 'plagcheck is a tool to check plagiarism in github repos. It is a command line tool which takes a github repo url as input and checks for plagiarism in the repo. It also provides a web interface to view the results.',
      votes: 0,
    },
  ];

  try {
    await Project.insertMany(projectsToAdd);
    console.log('Projects added to the database.');
  } catch (error) {
    console.error('Error adding projects:', error);
  }
}

bot.command('addprojects', async (ctx) => {
  const chatId = ctx.chat.id;

  if (ctx.from.id !== 1803838503) {
    ctx.reply('You are not authorized to add projects.');
    return;
  }

  await addProjects();

  ctx.reply('New projects have been added to the database.');
});

bot.command('projects', async (ctx) => {
  const chatId = ctx.chat.id;
  const projects = await Project.find();

  if (!projects || projects.length === 0) {
    ctx.reply("There are no projects available for voting.");
    return;
  }

  const keyboard = Markup.inlineKeyboard(
    projects.map((project: any) => Markup.button.callback(project.name, `vote:${String(project._id)}`)),
    {}
  );

  ctx.reply('Here are the projects you can vote for:', keyboard);

});

bot.action(/vote:(.*)/, async (ctx) => {
  const chatId = ctx?.chat?.id;
  const projectId = String(ctx.match[1]);

  // Find the project by ID
  const project = await Project.findById(projectId);
  if (!project) {
    ctx.answerCbQuery('Project not found.');
    return;
  }

  // Check if the user has already voted for this project
  const user = await User.findOne({ chatId });
  if (!user || !user.tokens || user.tokens <= 0) {
    ctx.answerCbQuery('You do not have enough tokens to vote.');
    return;
  }

  // Update the project's vote count and deduct one token from the user
  if (project.votes !== undefined) {
    project.votes += 5;
    await project.save();
  } else {
    ctx.answerCbQuery('Unable to vote for this project.');
    return;
  }

  // // Deduct one token from the user
  // user.tokens -= 1;
  // await user.save();

  ctx.answerCbQuery(`You have voted for ${project?.name}. You now have ${user.tokens} tokens left.`);
});

bot.launch();
