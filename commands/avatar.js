const {EmbedBuilder} = require('discord.js')

module.exports = {
    description: 'display avatar',
    run: async (message) => {
        const target = message.mentions.users.first() || message.author;
        const member = await message.guild.members.fetch(target.id);

        if(!member) return message.reply("ese negrata no esta en el server")

            const avatar = member.user.displayAvatarURL({size: 512})

            const embed = new EmbedBuilder()
            .setColor('Blurple')
            .setTitle(`⛓ foto de ${member.user.displayName}`)
            .setImage(avatar)

            message.reply({embeds : [embed]})
    }
}