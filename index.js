const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  PermissionsBitField,
  ChannelType
} = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

let ticketCount = 10; // inicia em 0010

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // só responde ao comando no canal de texto de guilda e ignora bots
  if (message.author.bot || !message.guild) return;
  if (message.content === '!ticket') {
    const embed = new EmbedBuilder()
      .setTitle('Support Ticket')
      .setDescription('To create a ticket, use the buttons below.')
      .setFooter({ text: 'n2ce.mysellauth.com' })
      .setColor(0x00AE86);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('support')
        .setLabel('Support')
        .setStyle('Primary'),
      new ButtonBuilder()
        .setCustomId('robux')
        .setLabel('Robux')
        .setStyle('Success'),
      new ButtonBuilder()
        .setCustomId('pix')
        .setLabel('Pix')
        .setStyle('Danger')
    );

    // busca o canal via ENV CHANNEL_ID
    const targetChannel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
      return message.reply('🚫 O CHANNEL_ID está inválido ou o canal não foi encontrado.');
    }

    await targetChannel.send({ embeds: [embed], components: [row] });
    // confirmação ao autor
    await message.reply({ content: '✅ Ticket menu sent!', ephemeral: true });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { guild, user, customId } = interaction;
  const type = customId; // 'support' | 'robux' | 'pix'
  if (!['support','robux','pix','closeTicket','confirmClose','cancelClose'].includes(type)) return;

  // trata fechamento primeiro
  if (type === 'closeTicket') {
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirm Close Ticket')
      .setDescription('Are you sure you want to close this ticket?')
      .setColor(0xFF0000);
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirmClose').setLabel('Yes').setStyle('Danger'),
      new ButtonBuilder().setCustomId('cancelClose').setLabel('No').setStyle('Secondary')
    );
    return interaction.reply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true });
  }

  if (type === 'confirmClose') {
    // apenas author do ticket ou owner podem fechar
    if (interaction.channel.permissionsFor(user).has(PermissionsBitField.Flags.ViewChannel)) {
      return interaction.channel.delete();
    } else {
      return interaction.reply({ content: '🚫 You cannot close this ticket.', ephemeral: true });
    }
  }

  if (type === 'cancelClose') {
    return interaction.reply({ content: '❌ Ticket closure cancelled.', ephemeral: true });
  }

  // criação de ticket (support, robux, pix)
  const ticketName = `${type.charAt(0).toUpperCase() + type.slice(1)}-${String(ticketCount).padStart(4,'0')}`;
  ticketCount++;

  const categoryId = '1365076641038073868';
  const ownerRoleId = process.env.ROLE_ID; // 1364962719245275206
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: ownerRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels] },
    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
  ];

  const channel = await guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: overwrites
  });

  // mensagem inicial do ticket
  let ticketEmbed;
  if (type === 'support') {
    ticketEmbed = new EmbedBuilder()
      .setTitle(`${ticketName} - Support`)
      .setDescription('To speed up the process, please tell us what you need help with.')
      .setFooter({ text: 'n2ce.mysellauth.com' })
      .setColor(0x00AE86);
  } else if (type === 'robux') {
    ticketEmbed = new EmbedBuilder()
      .setTitle(`${ticketName} - Robux`)
      .setDescription('To make your payment via **Robux**, buy this [PASSE](https://www.roblox.com/pt/game-pass/1177416673/Vector-External) on **Roblox** and send us proof of purchase.')
      .setFooter({ text: 'n2ce.mysellauth.com' })
      .setColor(0x00AE86);
  } else { // pix
    ticketEmbed = new EmbedBuilder()
      .setTitle(`${ticketName} - Pix Payment`)
      .setDescription('Choose your payment method below.')
      .addFields(
        { name: 'Email', value: 'pix.viniciuslisboa@proton.me\nVinícius Lisboa\nBanco: CloudWalk' },
        { name: 'Pix Copy & Paste', value: '00020126580014br.gov.bcb.pix013632594ce7-4e02-4031-bb80-103603a651825204000053039865802BR5917S PAGAMENTOS LTDA6014BELO HORIZONTE62290525c6df3274d271430189ea9150b6304F91C' }
      )
      .setFooter({ text: 'n2ce.mysellauth.com' })
      .setColor(0x00AE86);
  }
  await channel.send({ embeds: [ticketEmbed] });

  // embed admin-only
  const adminEmbed = new EmbedBuilder()
    .setTitle('Admin: Close Ticket')
    .setDescription('Only the owner role can close this ticket.')
    .setFooter({ text: 'n2ce.mysellauth.com' })
    .setColor(0xFF0000);
  const adminRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('closeTicket').setLabel('Close Ticket').setStyle('Danger')
  );
  await channel.send({ embeds: [adminEmbed], components: [adminRow] });
});

client.login(process.env.DISCORD_TOKEN);
