// index.js
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const CHANNEL_ID = process.env.CHANNEL_ID;
const OWNER_ROLE_ID = process.env.OWNER_ROLE_ID;
const CATEGORY_ID_SUPPORT = process.env.CATEGORY_ID;
const CATEGORY_ID_ROBUX = process.env.CATEGORY_ID_ROBUX;
const CATEGORY_ID_PIX = process.env.CATEGORY_ID_PIX;
const ID_TICKET_CLOSE = process.env.ID_TICKET_CLOSE;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

let ticketCount = 10;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || channel.type !== ChannelType.GuildText) return console.error('Invalid CHANNEL_ID');

  const embed = new EmbedBuilder()
    .setTitle('🎫 Open a Ticket')
    .setDescription('Click one of the buttons below to open a ticket.')
    .setColor(0x00AE86)
    .setFooter({ text: 'n2ce.mysellauth.com' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('open_ticket').setLabel('📩 Ticket').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('robux').setLabel('💸 Robux').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('pix').setLabel('🏦 Pix').setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  const { guild, user, customId, channel: originChannel } = interaction;

  // Handle close ticket
  if (customId === 'close_ticket') {
    if (user.id !== ID_TICKET_CLOSE) {
      return interaction.reply({ content: '🚫 You do not have permission to close this ticket.', ephemeral: true });
    }
    await originChannel.delete();
    return;
  }

  // Handle ticket creation
  if (['open_ticket', 'robux', 'pix'].includes(customId)) {
    const type = customId === 'open_ticket' ? 'ticket' : customId;
    const ticketName = `${type.charAt(0).toUpperCase() + type.slice(1)}-${String(ticketCount).padStart(4, '0')}`;
    ticketCount++;

    // choose category
    let parentId;
    if (customId === 'open_ticket') parentId = CATEGORY_ID_SUPPORT;
    if (customId === 'robux') parentId = CATEGORY_ID_ROBUX;
    if (customId === 'pix') parentId = CATEGORY_ID_PIX;

    const channel = await guild.channels.create({
      name: ticketName,
      type: ChannelType.GuildText,
      parent: parentId,
    });

    // set permissions
    await channel.permissionOverwrites.set([
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: OWNER_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
    ]);

    // user embed
    const userEmbed = new EmbedBuilder().setColor(0x00AE86).setFooter({ text: 'n2ce.mysellauth.com' });
    if (type === 'ticket') {
      userEmbed.setTitle('New Ticket').setDescription('Please describe your issue below.');
    } else if (type === 'robux') {
      userEmbed
        .setTitle('Robux Payment')
        .setDescription('To pay via **Robux**, purchase this [PASS](https://www.roblox.com/pt/game-pass/1177416673/Vector-External) and send proof here.');
    } else {
      userEmbed
        .setTitle('Pix Payment')
        .setDescription('Choose your payment method below:')
        .addFields(
          { name: 'Email', value: 'pix.viniciuslisboa@proton.me\nVinícius Lisboa\nBanco: CloudWalk' },
          { name: 'Pix Copy & Paste', value: '`00020126580014br.gov.bcb.pix013632594ce7-4e02-4031-bb80-103603a651825204000053039865802BR5917S PAGAMENTOS LTDA6014BELO HORIZONTE62290525c6df3274d271430189ea9150b6304F91C`' }
        );
    }
    await channel.send({ content: `<@${user.id}>`, embeds: [userEmbed] });

    // close button embed for all
    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Close Ticket')
      .setDescription('Click the button below to close this ticket.')
      .setColor(0xFF0000)
      .setFooter({ text: 'n2ce.mysellauth.com' });
    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
    );
    await channel.send({ embeds: [closeEmbed], components: [closeRow] });

    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
