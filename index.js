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

// Função para salvar invoice no GitHub
async function saveInvoiceToGitHub(invoiceData) {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const owner = process.env.REPO_OWNER || 'n3ce';
    const repo = process.env.REPO_NAME || 'n2ce';
    const path = 'invoice.json';

    let sha;
    let invoices = [];
    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path });
      sha = data.sha;
      const currentContent = Buffer.from(data.content, 'base64').toString();
      invoices = JSON.parse(currentContent);
    } catch {
      // Arquivo ainda não existe, criar novo
    }

    invoices.push(invoiceData);

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: '🧾 Add new invoice',
      content: Buffer.from(JSON.stringify(invoices, null, 2)).toString('base64'),
      sha,
    });

    console.log('✅ Invoice saved to GitHub.');
  } catch (error) {
    console.error('❌ Error saving invoice to GitHub:', error);
  }
}

// Discord client setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

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

  await channel.send({ embeds: [embed], components: [row] });
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
    return;
  }

  if (interaction.isModalSubmit() && interaction.customId === 'invoice_modal') {
    const invoice = interaction.fields.getTextInputValue('invoice_code');

    try {
      const response = await axios.get(
        `https://sellauth.com/api/invoices/${invoice}`,
        { headers: { Authorization: `Bearer ${process.env.SELLAUTH_API_KEY}` } }
      );

      const isValid = response.data.valid;

      if (isValid) {
        const role = interaction.guild.roles.cache.get(process.env.ROLE_ID);
        const member = interaction.member;

        await member.roles.add(role);
        await interaction.reply({ content: '✅ Invoice verified! Role assigned.', ephemeral: true });

        const successEmbed = new EmbedBuilder()
          .setTitle('✅ Invoice Verified')
          .setDescription(`Invoice ID: \`${invoice}\`\nUser: <@${interaction.user.id}>`)
          .setColor(0x00ff00)
          .setTimestamp();

        const logChannel = await client.channels.fetch(process.env.CHANNEL_ID);
        await logChannel.send({ embeds: [successEmbed] });

        await saveInvoiceToGitHub({
          invoiceNumber: invoice,
          verified: true,
          userId: interaction.user.id,
          timestamp: new Date().toISOString(),
        });
      } else {
        await interaction.reply({ content: '❌ Invalid invoice.', ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Error checking invoice.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
