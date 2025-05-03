const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

// ⚠️ Replace this with a secure method or environment variable
const DISCORD_TOKEN = 'MTM2NDk0NDgwNzA4NDE2MzE4Mw.GxN1l1.Kfjz8hvx5X3xQDRWJE85OWI2oZpUiUSLb1pr90';

// Channel ID where the embed will be sent
const INSTALL_CHANNEL_ID = '1365011390871371890';

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const installChannel = await client.channels.fetch(INSTALL_CHANNEL_ID);

    const installEmbed = new EmbedBuilder()
      .setTitle('💸 Want to pay with Robux or Pix?')
      .setColor(0x1e3a8a)
      .setDescription(`
Open a ticket and our team will help you complete your payment via Robux/Pix.
      `)
      .setFooter({ text: 'n2ce.mysellauth.com' });

    await installChannel.send({ embeds: [installEmbed] });
    console.log('📨 Embed sent successfully!');
  } catch (error) {
    console.error('❌ Error sending embed:', error);
  }
});

client.login(DISCORD_TOKEN);
