const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");
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


const fs = require("fs");
const path = require('path');

// Crear una colección para los comandos
client.commands = new Collection();

// Cargar los comandos desde la carpeta "commands"
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(file.replace('.js', ''), command);
}

// Manejar eventos de mensajes
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('-')) return;

    const args = message.content.slice(1).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.run(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Hubo un error ejecutando ese comando.');
    }
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


require("dotenv").config();

let dailyPoints = {}; // Recuento de puntos diarios
let monthlyPoints = {}; // Recuento de puntos mensuales

// Función para guardar puntos mensuales en un archivo JSON
function guardarPuntosMensuales() {
    fs.writeFileSync("monthlyPoints.json", JSON.stringify(monthlyPoints, null, 2));
}

function cargarPuntosMensuales() {
    const filePath = "monthlyPoints.json"; // Cambia el nombre si es necesario

    if (fs.existsSync(filePath)) {
        try {
            const fileContent = fs.readFileSync(filePath, "utf8");

            // Verifica si el archivo no está vacío y es un JSON válido
            if (fileContent.trim()) {
                monthlyPoints = JSON.parse(fileContent);
            } else {
                monthlyPoints = {}; // Si el archivo está vacío, inicializa con un objeto vacío
            }
        } catch (error) {
            console.error("Error al leer el archivo JSON:", error);
            monthlyPoints = {}; // Si ocurre un error, inicializa con un objeto vacío
        }
    } else {
        monthlyPoints = {}; // Si el archivo no existe, inicializa con un objeto vacío
    }
}

// Cargar puntos mensuales al iniciar el bot
cargarPuntosMensuales();

// Evento para contar mensajes en el canal "contador"
client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;

    const channelId = "1103333697551339541"; // Reemplaza con el ID del canal "contador"
    if (message.channel.id === channelId) {
        const userId = message.author.id;

        // Incrementar puntos diarios
        dailyPoints[userId] = (dailyPoints[userId] || 0) + 1;

        // Incrementar puntos mensuales
        monthlyPoints[userId] = (monthlyPoints[userId] || 0) + 1;
    }
});

schedule.scheduleJob("'59 23 * * *", async () => {
    const channelId = "1103333697551339541"; // Reemplaza con el ID del canal de resumen
    const channel = client.channels.cache.get(channelId);

    if (channel) {
        // Determinar el máximo goleador
        const topUserId = Object.keys(dailyPoints).reduce((a, b) =>
            dailyPoints[a] > dailyPoints[b] ? a : b
        );

        const topUserPoints = dailyPoints[topUserId];

        // Crear el resumen estilo partido de fútbol
        let resumen = `:soccer: **Resumen Diario** 🍆\n\n`;
        resumen += `El **MVP del día** es <@${topUserId}> con **${topUserPoints} manualidades**. ¡Alguna le habra dedicado a Fran! 🔥\n\n`;

        // Descripción de otros jugadores
        const sortedDaily = Object.entries(dailyPoints).sort((a, b) => b[1] - a[1]);
        resumen += `**Resto de la tabla de goleadores:**\n`;
        sortedDaily.forEach(([userId, points], index) => {
            resumen += `#${index + 1} <@${userId}>: ${points} \n`;
        });

        resumen += `\n¡Gran esfuerzo de todos los jugadores hoy! 🏆 Nos vemos mañana para otro partidazo.\n`;

        // Enviar el resumen al canal
        await channel.send(resumen);
    }

    // Reiniciar puntos diarios
    dailyPoints = {};
});

// Comando -top para mostrar el ranking mensual
client.on(Events.MessageCreate, (message) => {
    if (message.content.startsWith("-top")) {
        const args = message.content.split(" ");
        const topCount = args[1] ? parseInt(args[1], 10) : 10; // Número de usuarios a mostrar (por defecto 10)

        const sortedMonthly = Object.entries(monthlyPoints).sort((a, b) => b[1] - a[1]);
        const topUsers = sortedMonthly.slice(0, topCount);

        let response = `🏆 **TOP DICIEMBRE 👑**\n\n`;
        topUsers.forEach(([userId, points], index) => {
            response += `#${index + 1} <@${userId}>: ${points} 💦\n`;
        });

        message.channel.send(response);
    }

    // Comando -setpoints para editar puntos
    if (message.content.startsWith("-setpoints")) {
        const args = message.content.split(" ");
        const user = message.mentions.users.first();
        const points = parseInt(args[2], 10);

        // Comprobar si el mensaje es válido
        if (!user || isNaN(points)) {
            return message.reply("Por favor, usa el comando correctamente: `-setpoints @usuario puntos`");
        }

        // Cambiar los puntos del usuario
        monthlyPoints[user.id] = points;

        // Guardar los cambios en el archivo JSON
        guardarPuntosMensuales();

        // Confirmar la actualización
        message.reply(`Los puntos de <@${user.id}> han sido actualizados a ${points}.`);

        // Enviar el recuento actualizado a un canal específico
        const resumenChannelId = "1316185298560090204"; // Reemplaza con el ID del canal para el resumen
        const resumenChannel = client.channels.cache.get(resumenChannelId);

        if (resumenChannel) {
            const sortedMonthly = Object.entries(monthlyPoints).sort((a, b) => b[1] - a[1]);
            const topUsers = sortedMonthly;

            let resumen = `🏆 **RECUENTO ACTUALIZADO 👑** 🏆\n\n`;
            topUsers.forEach(([userId, points], index) => {
                resumen += `#${index + 1} <@${userId}>: ${points} 💦\n`;
            });

            resumenChannel.send(resumen);
        }
    }
});


// Conectar el bot
client.login(process.env.TOKEN);
