const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");
const schedule = require('node-schedule');
const fs = require("fs");
const path = require('path');
require('dotenv').config();

// Configuración del cliente
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Configuración de canales y roles
const CONFIG = {
    CONTADOR_CHANNEL_ID: '1103333697551339541',
    TOP_ROLE_ID: '1315059891773112441',
};

// Sistema de puntos
class PointSystem {
    constructor() {
        this.dailyPoints = {};
        this.monthlyPoints = {};
        this.monthlyPointsFile = "monthlyPoints.json";
        this.loadMonthlyPoints();
    }

    // Cargar puntos mensuales
    loadMonthlyPoints() {
        try {
            if (fs.existsSync(this.monthlyPointsFile)) {
                const data = fs.readFileSync(this.monthlyPointsFile, "utf8");
                this.monthlyPoints = data.trim() ? JSON.parse(data) : {};
            }
        } catch (error) {
            console.error("Error loading monthly points:", error);
            this.monthlyPoints = {};
        }
    }

    // Guardar puntos mensuales
    saveMonthlyPoints() {
        try {
            fs.writeFileSync(this.monthlyPointsFile, JSON.stringify(this.monthlyPoints, null, 2));
        } catch (error) {
            console.error("Error saving monthly points:", error);
        }
    }

    // Añadir puntos
    addPoints(userId) {
        // Puntos diarios
        this.dailyPoints[userId] = (this.dailyPoints[userId] || 0) + 1;
        
        // Puntos mensuales
        this.monthlyPoints[userId] = (this.monthlyPoints[userId] || 0) + 1;
        this.saveMonthlyPoints();
    }

    // Establecer puntos mensuales
    setMonthlyPoints(userId, points) {
        this.monthlyPoints[userId] = points;
        this.saveMonthlyPoints();
        return this.monthlyPoints[userId];
    }

    // Obtener top usuarios diarios
    getDailyTopUsers() {
        return Object.entries(this.dailyPoints)
            .sort(([, a], [, b]) => b - a);
    }

    // Obtener top usuarios mensuales
    getMonthlyTopUsers() {
        return Object.entries(this.monthlyPoints)
            .sort(([, a], [, b]) => b - a);
    }

    // Reiniciar puntos diarios
    resetDailyPoints() {
        this.dailyPoints = {};
    }
}

const pointSystem = new PointSystem();

// Eventos del cliente
client.on(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Conteo de mensajes
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    
    // Contar mensajes en el canal específico
    if (message.channel.id === CONFIG.CONTADOR_CHANNEL_ID) {
        pointSystem.addPoints(message.author.id);
    }

    // Comando -top
    if (message.content.startsWith("-top")) {
        const args = message.content.split(" ");
        const limit = args[1] ? parseInt(args[1]) : 10;
        
        const topUsers = pointSystem.getMonthlyTopUsers().slice(0, limit);
        
        let response = `🏆 **TOP ${new Date().toLocaleString('default', { month: 'long' }).toUpperCase()} 👑**\n\n`;
        topUsers.forEach(([userId, points], index) => {
            response += `#${index + 1} <@${userId}>: ${points} 💦\n`;
        });
        
        message.channel.send(response);
    }

    // Comando -setpoints
    if (message.content.startsWith("-setpoints")) {
        const args = message.content.split(" ");
        const user = message.mentions.users.first();
        const points = parseInt(args[2]);

        if (!user || isNaN(points)) {
            return message.reply("Uso correcto: `-setpoints @usuario puntos`");
        }

        pointSystem.setMonthlyPoints(user.id, points);
        message.reply(`Puntos de <@${user.id}> actualizados a ${points}.`);

        // Enviar actualización del ranking
        const topUsers = pointSystem.getMonthlyTopUsers();
        let resumen = `🏆 **RECUENTO ACTUALIZADO 👑**\n\n`;
        topUsers.forEach(([userId, points], index) => {
            resumen += `#${index + 1} <@${userId}>: ${points} 💦\n`;
        });

        message.channel.send(resumen);
    }
});

// Resumen diario y asignación de roles
schedule.scheduleJob('59 23 * * *', async () => {
    try {
        const channel = await client.channels.fetch(CONFIG.CONTADOR_CHANNEL_ID);
        if (!channel) return;

        const topUsers = pointSystem.getDailyTopUsers();
        if (topUsers.length === 0) return;

        // Resumen diario
        let resumen = `:soccer: **Resumen Diario** 🍆\n\n`;
        resumen += `El **MVP del día** es <@${topUsers[0][0]}> con **${topUsers[0][1]} manualidades**! 🔥\n\n`;
        
        resumen += `**Tabla de goleadores:**\n`;
        topUsers.forEach(([userId, points], index) => {
            resumen += `#${index + 1} <@${userId}>: ${points}\n`;
        });

        await channel.send(resumen);

        // Asignar rol a los top users
        const guild = channel.guild;
        const role = await guild.roles.fetch(CONFIG.TOP_ROLE_ID);
        
        if (role) {
            // Obtener usuarios con máxima puntuación
            const maxPoints = topUsers[0][1];
            const topUserIds = topUsers
                .filter(([, points]) => points === maxPoints)
                .map(([userId]) => userId);

            // Actualizar roles
            const members = await guild.members.fetch();
            for (const [memberId, member] of members) {
                if (topUserIds.includes(memberId)) {
                    await member.roles.add(role);
                } else if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                }
            }
        }

        // Reiniciar puntos diarios
        pointSystem.resetDailyPoints();
    } catch (error) {
        console.error("Error in daily summary:", error);
    }
});

client.login(process.env.TOKEN);
