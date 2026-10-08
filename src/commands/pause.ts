import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
  hyperlink,
} from "discord.js";
import player from "../player.js";
import { buildControlPanel } from "./play.js";

export const data = new SlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause the playback")
  .setContexts(InteractionContextType.Guild);

export const execute = async function (
  interaction: ChatInputCommandInteraction | ButtonInteraction,
) {
  const queue = player.queues.get(interaction.guildId as string);

  // Si está pausado, reanudar
  if (queue?.paused) {
    await queue.resume();
    return interaction.reply({
      embeds: [
        new EmbedBuilder().setDescription(
          `▶️ Resumed ${hyperlink(
            queue.songs[0].name || queue.songs[0].url || "",
            queue.songs[0].url || "",
          )}`,
        ),
      ],
      components: buildControlPanel(false),
    });
  }

  if (!queue || queue.stopped) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("Nothing to pause")
          .setColor(Colors.Red),
      ],
      
    });
  }

  await queue.pause();
  return interaction.reply({
    embeds: [
      new EmbedBuilder().setDescription(
        `⏸️ Paused ${hyperlink(
          queue.songs[0].name || queue.songs[0].url || "",
          queue.songs[0].url || "",
        )} at ${queue.formattedCurrentTime}`,
      ),
    ],
    components: buildControlPanel(true),
  });
};