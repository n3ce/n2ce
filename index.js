// index.js
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
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
  const menuChannel = await client.channels.fetch(CHANNEL_ID);
  if (!menuChannel || menuChannel.type !== ChannelType.GuildText) return console.error('Invalid CHANNEL_ID');

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

  await menuChannel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'pix_option') {
    const choice = interaction.values[0];
    if (choice === 'email') {
      const emailEmbed = new EmbedBuilder()
        .setTitle('Pix Payment - Email')
        .setDescription('**Pix e-mail:**\npix.viniciuslisboa@proton.me\n**Name:** Vinícius Lisboa\n**Bank:** CloudWalk')
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
      return interaction.reply({ embeds: [emailEmbed], ephemeral: true });
    } else if (choice === 'copy') {
      const copyEmbed = new EmbedBuilder()
        .setTitle('Pix Payment - Copy & Paste')
        .setDescription('```00020126580014br.gov.bcb.pix013632594ce7-4e02-4031-bb80-103603a651825204000053039865802BR5917S PAGAMENTOS LTDA6014BELO HORIZONTE62290525c6df3274d271430189ea9150b6304F91C```')
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
      return interaction.reply({ embeds: [copyEmbed], ephemeral: true });
    }
  }

  if (!interaction.isButton()) return;
  const { guild, user, customId, channel: originChannel } = interaction;

  if (customId === 'close_ticket') {
    if (user.id !== ID_TICKET_CLOSE) {
      return interaction.reply({ content: '🚫 You do not have permission to close this ticket.', ephemeral: true });
    }
    return originChannel.delete();
  }

  if (['open_ticket', 'robux', 'pix'].includes(customId)) {
    const typeKey = customId === 'open_ticket' ? 'ticket' : customId;
    const ticketName = `${typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}-${String(ticketCount).padStart(4, '0')}`;
    ticketCount++;

    let parentId;
    if (customId === 'open_ticket') parentId = CATEGORY_ID_SUPPORT;
    if (customId === 'robux') parentId = CATEGORY_ID_ROBUX;
    if (customId === 'pix') parentId = CATEGORY_ID_PIX;

    const channel = await guild.channels.create({
      name: ticketName,
      type: ChannelType.GuildText,
      parent: parentId,
    });

    await channel.permissionOverwrites.set([
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: OWNER_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
    ]);

    let userEmbed;
    if (customId === 'open_ticket') {
      userEmbed = new EmbedBuilder()
        .setTitle('New Ticket')
        .setDescription('Please describe your issue below.')
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
    } else if (customId === 'robux') {
      userEmbed = new EmbedBuilder()
        .setTitle('Robux Payment')
        .setDescription('To pay via **Robux**, follow the steps below:')
        .addFields(
          { name: '1. Purchase Pass', value: 'Go to: https://www.roblox.com/pt/game-pass/1177416673/Vector-External' },
          { name: '2. Send Proof', value: 'Send your purchase receipt here.' }
        )
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
    } else {
      userEmbed = new EmbedBuilder()
        .setTitle('Pix Payment')
        .setDescription('Select your preferred Pix payment method:')
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('pix_option')
        .setPlaceholder('Choose method')
        .addOptions(
          { label: 'Email', value: 'email' },
          { label: 'Copy & Paste', value: 'copy' }
        );
      const menuRow = new ActionRowBuilder().addComponents(selectMenu);
      await channel.send({ content: `<@${user.id}>`, embeds: [userEmbed], components: [menuRow] });
      const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Close Ticket')
        .setDescription('Click the button below to close this ticket.')
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0xFF0000);
      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
      );
      await channel.send({ embeds: [closeEmbed], components: [closeRow] });
      return interaction.reply({ content: `✅ Pix ticket created: ${channel}`, ephemeral: true });
    }

    await channel.send({ content: `<@${user.id}>`, embeds: [userEmbed] });
    const closeEmbed = new EmbedBuilder()
      .setTitle('🔒 Close Ticket')
      .setDescription('Click the button below to close this ticket.')
      .setFooter({ text: 'n2ce.mysellauth.com' })
      .setColor(0xFF0000);
    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
    );
    await channel.send({ embeds: [closeEmbed], components: [closeRow] });
    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
