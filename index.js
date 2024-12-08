const { Client, Events, GatewayIntentBits } = require("discord.js");
const schedule = require('node-schedule');
const keep_alive = require('./keep_alive.js')

require('dotenv').config();

// Cliente Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let messageCounts = {}; // Almacena el conteo de mensajes globales
let channelMessageCounts = {}; // Almacena el conteo de mensajes en el canal "contador"

// Evento de inicio
client.on(Events.ClientReady, () => {
    console.log(`Conectado como ${client.user.tag}!`);
});

// Sistema de bienvenida
client.on(Events.GuildMemberAdd, async (member) => {
    const welcomeChannelId = '1103302221904498732'; // ID del canal de bienvenida
    const channel = await client.channels.fetch(welcomeChannelId);

    if (channel) {
        channel.send(`**GOT A DROP 💨💢 ON THIS <@${member.user.id}> NIGGA 🔪🔫**`);
    }
});

// Contar los mensajes de los usuarios en el canal "contador"
client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;

    // Verificar si el mensaje es en el canal "contador"
    const contadorChannelId = '1103333697551339541'; // Reemplaza con el ID del canal "contador"
    if (message.channel.id === contadorChannelId) {
        const userId = message.author.id;

        // Incrementar el contador de mensajes en el canal "contador"
        channelMessageCounts[userId] = (channelMessageCounts[userId] || 0) + 1;
    }

    // Comandos
    if (message.content.startsWith('-')) {
        const args = message.content.slice(1).split(' ');
        const command = args[0];

        try {
            if (command === "top") {
                // Comando -top
                const topMessages = Object.entries(channelMessageCounts)
                    .sort((a, b) => b[1] - a[1]) // Ordenar de mayor a menor
                    .slice(0, 10); // Top 10

                let topMessage = ':bar_chart: **TOP 10  👽**\n';
                topMessages.forEach(([userId, count], index) => {
                    topMessage += `${index + 1}. <@${userId}>: ${count} mensajes\n`;
                });

                message.channel.send(topMessage);
            } 
            else if (command === "add") {
                // Comando -add
                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    message.channel.send("Por favor, ingresa una cantidad válida de mensajes.");
                    return;
                }

                const userId = message.author.id;

                // Añadir puntos al usuario en el canal "contador"
                channelMessageCounts[userId] = (channelMessageCounts[userId] || 0) + amount;

                message.channel.send(`Se han añadido **${amount}** goles a <@${userId}> en la temporada. Ahora tiene **${channelMessageCounts[userId]}** goles en total.`);
            }
        } catch (error) {
            console.log('Error en el comando:', error.message);
        }
    }
});

// Enviar resumen al final del día
schedule.scheduleJob('59 23 * * *', async () => {
    const channelId = '1103333697551339541'; // ID del canal para el resumen
    const channel = client.channels.cache.get(channelId);

    if (channel) {
        let summary = ':bar_chart: **RESUMEN 👽**\n';
        for (const [userId, count] of Object.entries(channelMessageCounts)) {
            summary += `<@${userId}>: ${count} goles"\n`;
        }
        await channel.send(summary);
    }

    // Reiniciar el conteo para el siguiente día
    messageCounts = {};
    channelMessageCounts = {};
});

// Asignar rol al final del día
schedule.scheduleJob('59 23 * * *', async () => {
    const targetChannel = client.channels.cache.get('1103333697551339541');
    if (!targetChannel || !targetChannel.guild) return console.error('No se encontró el canal o servidor.');

    const guild = targetChannel.guild;

    // Encuentra el número máximo de mensajes enviados en el canal "contador"
    const maxMessages = Math.max(...Object.values(channelMessageCounts));

    // Encuentra a todos los usuarios con el número máximo de mensajes
    const topUsers = Object.keys(channelMessageCounts).filter(userId => channelMessageCounts[userId] === maxMessages);

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

    // Reiniciar el conteo para el siguiente día
    messageCounts = {};
    channelMessageCounts = {};
});

// Conectar el bot
client.login(process.env.TOKEN);
