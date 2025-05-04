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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel],
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const OWNER_ROLE_ID = process.env.OWNER_ROLE_ID;
const CATEGORY_ID = process.env.CATEGORY_ID;

let ticketCount = 10;

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || channel.type !== ChannelType.GuildText) {
    console.error('Invalid CHANNEL_ID or not a text channel');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎫 Open a Ticket')
    .setDescription('Click one of the buttons below to open a ticket.')
    .setColor(0x00AE86)
    .setFooter({ text: 'n2ce.mysellauth.com' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('support').setLabel('📩 Support').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('robux').setLabel('💸 Robux').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('pix').setLabel('🏦 Pix').setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { guild, user, customId } = interaction;

  // Handle close ticket confirmation
  async function promptClose(channel) {
    const confirmEmbed = new EmbedBuilder()
      .setTitle('Confirm Close Ticket')
      .setDescription('Are you sure you want to close this ticket?')
      .setColor(0xFF9900);
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_close').setLabel('Yes').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cancel_close').setLabel('No').setStyle(ButtonStyle.Secondary)
    );
    await channel.send({ embeds: [confirmEmbed], components: [confirmRow] });
  }

  if (customId === 'close_ticket') {
    return promptClose(interaction.channel);
  }
  if (customId === 'confirm_close') {
    return interaction.channel.delete();
  }
  if (customId === 'cancel_close') {
    return interaction.reply({ content: 'Ticket closure cancelled.', ephemeral: true });
  }

  // Handle ticket creation
  if (['support', 'robux', 'pix'].includes(customId)) {
    const ticketName = `${customId.charAt(0).toUpperCase() + customId.slice(1)}-${String(ticketCount).padStart(4, '0')}`;
    ticketCount++;

    // Create channel without inherited permissions
    const channel = await guild.channels.create({
      name: ticketName,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID,
    });

    // Set permissions: only author and owner role can see
    await channel.permissionOverwrites.set([
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      { id: OWNER_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
    ]);

    // User-facing embed
    const userEmbed = new EmbedBuilder().setColor(0x00AE86).setFooter({ text: 'n2ce.mysellauth.com' });
    if (customId === 'support') {
      userEmbed.setTitle('Support Ticket').setDescription('Please describe your issue below. A team member will assist you shortly.');
    } else if (customId === 'robux') {
      userEmbed
        .setTitle('Robux Payment')
        .setDescription('To pay via **Robux**, purchase this [PASS](https://www.roblox.com/pt/game-pass/1177416673/Vector-External) and send us proof of purchase.');
    } else {
      userEmbed
        .setTitle('Pix Payment')
        .setDescription('Choose your payment method below:')
        .addFields(
          { name: 'Email', value: 'pix.viniciuslisboa@proton.me\nVinícius Lisboa\nBanco: CloudWalk' },
          { name: 'Pix Copia e Cola', value: '`00020126580014br.gov.bcb.pix013632594ce7-4e02-4031-bb80-103603a651825204000053039865802BR5917S PAGAMENTOS LTDA6014BELO HORIZONTE62290525c6df3274d271430189ea9150b6304F91C`' }
        );
    }
    await channel.send({ content: `<@${user.id}>`, embeds: [userEmbed] });

    // Admin-only embed and close button
    const adminEmbed = new EmbedBuilder()
      .setTitle('🔒 Close Ticket')
      .setDescription('Only the owner role can close this ticket.')
      .setFooter({ text: 'n2ce.mysellauth.com' })
      .setColor(0xFF0000);
    const adminRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger)
    );
    await channel.send({ content: `<@&${OWNER_ROLE_ID}>`, embeds: [adminEmbed], components: [adminRow] });

    await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);