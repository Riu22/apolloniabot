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
  .setName("nowplaying")
  .setDescription("Show the control panel for the current song")
  .setContexts(InteractionContextType.Guild);

export const execute = async function (
  interaction: ChatInputCommandInteraction | ButtonInteraction,
) {
  const queue = player.queues.get(interaction.guildId as string);
  if (!queue) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("Nothing is playing")
          .setColor(Colors.Red),
      ],
      
    });
  }

  const song = queue.songs[0];
  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎵 Now Playing")
        .setDescription(hyperlink(song.name || song.url || "", song.url || ""))
        .addFields(
          {
            name: "Duration",
            value: `${queue.formattedCurrentTime} / ${song.formattedDuration || "--:--"}`,
            inline: true,
          },
          {
            name: "Volume",
            value: `${queue.volume}%`,
            inline: true,
          },
          {
            name: "Queue",
            value: `${queue.songs.length} song${queue.songs.length === 1 ? "" : "s"}`,
            inline: true,
          },
        )
        .setThumbnail(song.thumbnail || null)
        .setColor(Colors.Blurple),
    ],
    components: buildControlPanel(queue.paused),
  });
};