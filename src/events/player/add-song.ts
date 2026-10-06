import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionResponse,
  hyperlink,
} from "discord.js";
import { Events, Queue, Song } from "distube";
import { buildControlPanel } from "../../commands/play.js";

export const event = Events.ADD_SONG;
export const listener = async function (queue: Queue, song: Song) {
  const interactionResponse = song.metadata as Promise<InteractionResponse>;
  const response = await interactionResponse;
  if (!response || !response.interaction) {
    return;
  }
  const interaction = response.interaction as ChatInputCommandInteraction;
  await interaction.followUp({
    embeds: [
      new EmbedBuilder()
        .setTitle(queue.songs[0] === song ? "▶️ Playing" : "➕ Queued")
        .setDescription(
          hyperlink(song.name || song.url || "", song.url || ""),
        )
        .addFields(
          {
            name: "Duration",
            value: song.formattedDuration || "--:--",
            inline: true,
          },
          {
            name: "Position",
            value: queue.songs[0] === song ? "Now" : `#${queue.songs.indexOf(song) + 1}`,
            inline: true,
          },
          {
            name: "Queue",
            value: `${queue.songs.length} song${queue.songs.length === 1 ? "" : "s"}`,
            inline: true,
          },
        )
        .setThumbnail(song.thumbnail || null),
    ],
    components: [buildControlPanel(queue.paused)],
  });
};