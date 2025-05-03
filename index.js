require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  EmbedBuilder
} = require('discord.js');
const axios = require('axios');
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) return;

  if (interaction.isButton() && interaction.customId === 'verify_invoice') {
    const modal = new ModalBuilder()
      .setCustomId('invoice_modal')
      .setTitle('Enter your Invoice');

    const invoiceInput = new TextInputBuilder()
      .setCustomId('invoice_code')
      .setLabel('Invoice Number')
      .setStyle(TextInputStyle.Short);

    const firstRow = new ActionRowBuilder().addComponents(invoiceInput);
    modal.addComponents(firstRow);

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'invoice_modal') {
    const invoice = interaction.fields.getTextInputValue('invoice_code');

    try {
      const response = await axios.get(`https://sellauth.com/api/invoices/${invoice}`, {
        headers: { Authorization: `Bearer ${process.env.SELLAUTH_API_KEY}` },
      });

      const isValid = response.data.valid;

      if (isValid) {
        const role = interaction.guild.roles.cache.get(process.env.ROLE_ID);
        const member = interaction.member;

        await member.roles.add(role);
        await interaction.reply({ content: `✅ Invoice verified! Role assigned.`, ephemeral: true });
      } else {
        await interaction.reply({ content: `❌ Invalid invoice.`, ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: `❌ Error checking invoice.`, ephemeral: true });
    }
  }
});

client.on('ready', async () => {
  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

  const embed = new EmbedBuilder()
    .setTitle('🧾 Invoice Verification')
    .setDescription('Click the button below to verify your purchase and receive your role automatically.')
    .setColor(0x00AEFF)
    .setFooter({ text: 'n2ce.mysellauth.com' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify_invoice')
      .setLabel('🧾 Verify Invoice')
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({
    embeds: [embed],
    components: [row],
  });
});

client.login(process.env.DISCORD_TOKEN);
