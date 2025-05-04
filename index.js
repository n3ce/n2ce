const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, ChannelType, StringSelectMenuBuilder, ComponentType } = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers],
  partials: [Partials.Channel]
});

let ticketCount = 10;

client.once("ready", async () => {
  console.log(`Bot online como ${client.user.tag}`);

  const embed = new EmbedBuilder()
    .setTitle("Support Ticket")
    .setDescription("To create a ticket use the **Support** button\nn2ce.mysellauth.com")
    .setColor("#6571ff");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("support_ticket").setLabel("Support").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("robux_ticket").setLabel("Robux").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("pix_ticket").setLabel("Pix").setStyle(ButtonStyle.Danger)
  );

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);
  await channel.send({ embeds: [embed], components: [row] });
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const ticketType = interaction.customId.split("_")[0];
  const ticketNumber = ticketCount.toString().padStart(4, "0");
  const channelName = `${ticketType}-${ticketNumber}`;

  ticketCount++;

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
      },
      {
        id: process.env.ROLE_ID,
        allow: [PermissionsBitField.Flags.ViewChannel]
      }
    ]
  });

  await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });

  // Mensagens por tipo de ticket
  if (ticketType === "support") {
    const embed = new EmbedBuilder()
      .setTitle("Support Ticket")
      .setDescription("To speed up the process, please describe what you need.\nn2ce.mysellauth.com")
      .setColor("#6571ff");

    channel.send({ embeds: [embed] });
  }

  if (ticketType === "robux") {
    const embed = new EmbedBuilder()
      .setTitle("Robux Payment")
      .setDescription("To pay via **Robux**, purchase this [PASS](https://www.roblox.com/pt/game-pass/1177416673/Vector-External) on **Roblox** and send us proof of your purchase.\nn2ce.mysellauth.com")
      .setColor("#6571ff");

    channel.send({ embeds: [embed] });
  }

  if (ticketType === "pix") {
    const embed = new EmbedBuilder()
      .setTitle("Pagamento via Pix")
      .setDescription("Escolha qual dos métodos deseja pagar")
      .setColor("#6571ff");

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("pix_option")
        .setPlaceholder("Selecione uma opção")
        .addOptions(
          {
            label: "Email",
            value: "pix_email"
          },
          {
            label: "Pix copia e cola",
            value: "pix_copia"
          }
        )
    );

    channel.send({ embeds: [embed], components: [menu] });
  }
});

// Listener para selecionar opções no Pix
client.on("interactionCreate", async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "pix_option") {
    if (interaction.values[0] === "pix_email") {
      const embed = new EmbedBuilder()
        .setTitle("PIX via E-mail")
        .setDescription("**Pix e-mail:**\n```\npix.viniciuslisboa@proton.me\n```\n**Nome:** Vinícius Lisboa\n**Banco:** CloudWalk Instituição de Pagamento\nn2ce.mysellauth.com")
        .setColor("#6571ff");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.values[0] === "pix_copia") {
      const embed = new EmbedBuilder()
        .setTitle("PIX COPIA E COLA")
        .setDescription("```00020126580014br.gov.bcb.pix013632594ce7-4e02-4031-bb80-103603a651825204000053039865802BR5917S PAGAMENTOS LTDA6014BELO HORIZONTE62290525c6df3274d271430189ea9150b6304F91C```\nn2ce.mysellauth.com")
        .setColor("#6571ff");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
