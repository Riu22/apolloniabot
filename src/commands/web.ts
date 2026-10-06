import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("web")
  .setDescription("Get the link to the web control panel")
  .setDescriptionLocalizations({ "es-ES": "Obtén el enlace al panel de control web" })
  .setContexts(InteractionContextType.Guild);

export const execute = async function (
  interaction: ChatInputCommandInteraction,
) {
  const url = process.env.WEB_URL || `http://localhost:${process.env.WEB_PORT || 3000}`;
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🌐 Panel de Control")
        .setDescription(`Accede al panel web desde aquí:\n${url}`)
        .addFields(
          { name: "🎵 Controles", value: "Play, Pause, Skip, Stop", inline: true },
          { name: "📋 Cola", value: "Ver todas las canciones", inline: true },
          { name: "🔊 Volumen", value: "Ajustar en tiempo real", inline: true },
        )
        .setColor(0x1db954)
        .setFooter({ text: "El panel se actualiza en tiempo real" }),
    ],
    
  });
};