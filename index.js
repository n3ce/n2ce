const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ]
});

let ticketCount = 10;  // Começando a contagem de tickets a partir de 0010

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!ticket') {
    const embed = new EmbedBuilder()
      .setTitle('Support Ticket')
      .setDescription('To create a ticket, use the buttons below.')
      .setFooter({ text: 'n2ce.mysellauth.com' })
      .setColor(0x00AE86);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('support')
          .setLabel('Support')
          .setStyle('Primary'),
        new ButtonBuilder()
          .setCustomId('robux')
          .setLabel('Robux')
          .setStyle('Primary'),
        new ButtonBuilder()
          .setCustomId('pix')
          .setLabel('Pix')
          .setStyle('Primary')
      );

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'support' || interaction.customId === 'robux' || interaction.customId === 'pix') {
    const ticketType = interaction.customId;
    const ticketName = `${ticketType.charAt(0).toUpperCase() + ticketType.slice(1)}-${String(ticketCount).padStart(4, '0')}`;

    // Criando o canal
    const guild = interaction.guild;
    const category = guild.channels.cache.get('1365076641038073868'); // ID da categoria
    const permissions = [
      {
        id: guild.roles.everyone.id,
        deny: ['ViewChannel'],
      },
      {
        id: '1364962719245275206', // Cargo owner
        allow: ['ViewChannel', 'ManageMessages'],
      },
      {
        id: interaction.user.id, // Usuário que criou o ticket
        allow: ['ViewChannel', 'ManageMessages'],
      },
    ];

    const channel = await guild.channels.create({
      name: ticketName,
      type: 'GUILD_TEXT',
      parent: category,
      permissionOverwrites: permissions,
    });

    // Embed de mensagem automática para o ticket
    let embed;
    if (ticketType === 'support') {
      embed = new EmbedBuilder()
        .setTitle(`${ticketName} - Support`)
        .setDescription('To speed up the process, please tell us what you need help with.')
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
    } else if (ticketType === 'robux') {
      embed = new EmbedBuilder()
        .setTitle(`${ticketName} - Robux`)
        .setDescription('To make your payment via **robux**, buy this [PASSE](https://www.roblox.com/pt/game-pass/1177416673/Vector-External) in **Roblox** and send us proof of your purchase.')
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
    } else if (ticketType === 'pix') {
      embed = new EmbedBuilder()
        .setTitle(`${ticketName} - Pix Payment`)
        .setDescription('Choose your payment method below.')
        .addFields(
          { name: 'Email', value: 'pix.viniciuslisboa@proton.me\nVinícius Lisboa\nBanco: CloudWalk' },
          { name: 'Pix Copy & Paste', value: '00020126580014br.gov.bcb.pix013632594ce7-4e02-4031-bb80-103603a651825204000053039865802BR5917S PAGAMENTOS LTDA6014BELO HORIZONTE62290525c6df3274d271430189ea9150b6304F91C' }
        )
        .setFooter({ text: 'n2ce.mysellauth.com' })
        .setColor(0x00AE86);
    }

    await channel.send({ embeds: [embed] });

    // Embed do administrador (only owner can see)
    const adminEmbed = new EmbedBuilder()
      .setTitle('Admin: Close Ticket')
      .setDescription('This is an admin-only view. You can close the ticket by clicking the button below.')
      .setColor(0xFF0000)
      .setFooter({ text: 'n2ce.mysellauth.com' });

    const adminRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('closeTicket')
          .setLabel('Close Ticket')
          .setStyle('Danger')
      );

    await channel.send({ embeds: [adminEmbed], components: [adminRow] });

    ticketCount++;
  }

  if (interaction.customId === 'closeTicket') {
    const embed = new EmbedBuilder()
      .setTitle('Confirm Close Ticket')
      .setDescription('Are you sure you want to close this ticket?')
      .setColor(0xFF0000);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirmClose')
          .setLabel('Yes')
          .setStyle('Danger'),
        new ButtonBuilder()
          .setCustomId('cancelClose')
          .setLabel('No')
          .setStyle('Secondary')
      );

    await interaction.channel.send({ embeds: [embed], components: [row] });
  }

  if (interaction.customId === 'confirmClose') {
    await interaction.channel.delete();
  } else if (interaction.customId === 'cancelClose') {
    await interaction.reply({ content: 'Ticket closure cancelled.', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
