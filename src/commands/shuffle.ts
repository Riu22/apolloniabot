import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import player from "../player.js";

export const data = new SlashCommandBuilder()
  .setName("shuffle")
  .setDescription("Activa o desactiva el modo aleatorio de la cola actual (como Spotify)")
  .setDescriptionLocalizations({ "es-ES": "Activa o desactiva el modo aleatorio de la cola actual" })
  .setContexts(InteractionContextType.Guild);

// Guardamos el estado de shuffle por servidor (en memoria)
export const isShuffleEnabled = new Map<string, boolean>();

export const execute = async function (interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId as string;
  const queue = player.queues.get(guildId);

  if (!queue || queue.songs.length <= 1) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("❌ No hay una cola activa con suficientes canciones para mezclar.")
          .setColor(Colors.Red),
      ],
      ephemeral: true,
    });
  }

  const currentState = isShuffleEnabled.get(guildId) || false;
  const newState = !currentState;
  isShuffleEnabled.set(guildId, newState);

  if (newState) {
    await queue.shuffle(); // Mezcla la cola actual al activarlo
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("🔀 Modo aleatorio **activado**. La cola ha sido mezclada.")
          .setColor(Colors.Green),
      ],
    });
  } else {
    // Nota: Desactivar el shuffle no "desmezcla" mágicamente la cola (Spotify tampoco lo hace),
    // pero las nuevas canciones se añadirán en su orden original.
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("➡️ Modo aleatorio **desactivado**. Las nuevas canciones se añadirán en orden.")
          .setColor(Colors.Yellow),
      ],
    });
  }
};