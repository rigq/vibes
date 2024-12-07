const { Client, Events, GatewayIntentBits } = require("discord.js");
const schedule = require('node-schedule');

// Cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

let messageCounts = {};

// Evento de inicio
client.on(Events.ClientReady, () => {
    console.log(`Conectando como ${client.user.username}!`);
});

// Sistema de bienvenida
client.on(Events.GuildMemberAdd, async (member) => {
    const welcomeChannelId = '1103302221904498732'; // ID del canal de bienvenida
    const channel = await client.channels.fetch(welcomeChannelId);

    channel.send(`**GOT A DROP 💨💢 ON THIS <@${member.user.id}> NIGGA 🔪🔫 **`);
});

// Contar los mensajes de los usuarios
client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;
    const userId = message.author.id;
    if (!messageCounts[userId]) {
        messageCounts[userId] = 0;
    }
    messageCounts[userId]++;
    
    // Comandos
    if (!message.content.startsWith('-')) return;

    const args = message.content.slice(1).split(' ');
    const command = args[0];

    try {
        // Asegúrate de tener una carpeta 'commands' con los archivos correspondientes
        const commandFile = require(`./commands/${command}`);
        commandFile.run(message, args);
    } catch (error) {
        console.log('Error en el comando:', error.message);
    }
});

// Enviar resumen al final del día
schedule.scheduleJob('59 23 * * *', async () => {
    const channelId = '1103333697551339541'; // ID del canal para el resumen
    const channel = client.channels.cache.get(channelId);

    if (channel) {
        let summary = ':bar_chart: **RESUMEN 👽**\n';
        for (const [userId, count] of Object.entries(messageCounts)) {
            summary += `<@${userId}>: ${count} mensajes\n`;
        }
        await channel.send(summary);
    }

    // Reiniciar el conteo para el siguiente día
    messageCounts = {};
});

// Asignar rol al final del día
schedule.scheduleJob('59 23 * * *', async () => {
    const targetChannel = client.channels.cache.get('1103333697551339541');
    if (!targetChannel || !targetChannel.guild) return console.error('No se encontró el canal o servidor.');

    const guild = targetChannel.guild;

    // Encuentra el número máximo de mensajes enviados
    const maxMessages = Math.max(...Object.values(messageCounts));

    // Encuentra a todos los usuarios con el número máximo de mensajes
    const topUsers = Object.keys(messageCounts).filter(userId => messageCounts[userId] === maxMessages);

    if (topUsers.length > 0) {
        try {
            const role = guild.roles.cache.get('1315059891773112441'); // ID del rol

            if (!role) return console.error('No se encontró el rol.');

            // Asignar el rol a todos los usuarios con el número máximo de mensajes
            for (let userId of topUsers) {
                const topMember = await guild.members.fetch(userId);
                await topMember.roles.add(role);
                console.log(`Rol asignado a ${topMember.user.tag}`);
            }

            // Retirar el rol de otros miembros (opcional)
            guild.members.cache.forEach(async (member) => {
                if (member.roles.cache.has('1315059891773112441') && !topUsers.includes(member.id)) {
                    await member.roles.remove(role);
                }
            });
        } catch (error) {
            console.error('Error asignando el rol:', error);
        }
    }

    // Reiniciar los conteos para el siguiente día
    messageCounts = {};
});

// Conectar el bot
client.login("MTMxNDM3NTE3ODM4MTI5NTc0OA.G5EVLf.NE2ILwykxX5durHYhC4-GIQ7mAy6z4Jul5uiRA");
