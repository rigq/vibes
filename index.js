//archivo index
const {Client, Events} = require("discord.js");

//cliente dc
const client = new Client({
    intents: 53608429
});

//evento
client.on(Events.ClientReady, async () => {
    console.log(`Conectando como ${client.user.name}!`)
});

//COMANDOS
client.on(Events.MessageCreate, async (message) => {
    if(message.author.bot) return;
    if(!message.content.startsWith('-')) return;

    const args = message.content.slice(1)

//comandos
try {
    const command = require(`./commands/${args}`);
    command.run(message);

} catch (error) {
    console.log(`SHUT UP NIGGER`, error.message);
}
});

client.on(Events.GuildMemberAdd, async (member) => {
    const welcomeChannelId = '1103302221904498732';
    const channel = await client.channels.fetch(welcomeChannelId);

    channel.send(`**GOT A DROP 💨💢 ON THIS <@{member.user.id}> NIGGA 🔪🔫**`);

})







const { GatewayIntentBits } = require('discord.js');


const botClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  let messageCounts = {};

  client.on('messageCreate', (message) => {
    if (!message.author.bot) {
      // Incrementar el contador del usuario
      const userId = message.author.id;
      if (!messageCounts[userId]) {
        messageCounts[userId] = 0;
      }
      messageCounts[userId]++;
    }
  });

  // Enviar el sumatorio al final del día
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 23 && now.getMinutes() === 59) { // Configura la hora deseada
      const channelId = '1103333697551339541'; // Cambia por el ID del canal donde enviarás el resumen
      const channel = client.channels.cache.get(channelId);
  
      if (channel) {
        let summary = ':bar_chart: **RESUMEN 👽**\n';
        for (const [userId, count] of Object.entries(messageCounts)) {
          summary += `<@${userId}>: ${count} goles\n`;
        }
  
        channel.send(summary);
      }
  
      // Reiniciar el conteo para el día siguiente
      messageCounts = {};
    }
  }, 60000); // Revisa cada minuto
  
//conectar
client.login("MTMxNDM3NTE3ODM4MTI5NTc0OA.GCh9-K.q4uS8_jvGqqzJ0jqWh0R3FpgLio-M-x2wSVChk");

