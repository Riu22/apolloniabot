import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  GuildMember,
  GuildTextBasedChannel,
  InteractionContextType,
  SlashCommandBuilder,
  hyperlink,
} from "discord.js";
import youtubeSr from "youtube-sr";
import player from "../player.js";
import { isShuffleEnabled } from "./shuffle.js";

const { default: yt } = youtubeSr;

export const data = new SlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song or playlist")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("URL de YouTube/Spotify o nombre de la canción/playlist")
      .setAutocomplete(true)
      .setRequired(true),
  )
  .addBooleanOption((option) =>
    option
      .setName("shuffle")
      .setDescription("Mezclar la playlist al añadirla (interruptor tipo Spotify)")
      .setRequired(false),
  )
  .setContexts(InteractionContextType.Guild);

export const autocomplete = async function (interaction: AutocompleteInteraction) {
  const query = interaction.options.getFocused();
  if (query.length === 0) {
    return interaction.respond([]);
  }

  const videos = await yt.search(query, { type: "video", limit: 10 });
  return interaction.respond(
    videos.map(({ title, url }) => ({ name: title || "", value: url })),
  );
};

export const buildControlPanel = (paused = false, shuffleEnabled = false) => {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("/pause")
      .setEmoji(paused ? "▶️" : "⏸️")
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("/next")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("/stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("/shuffle")
      .setEmoji("🔀")
      .setStyle(shuffleEnabled ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("/volume")
      .setEmoji("🔊")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("/queue")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary),
  );

  return [row1, row2];
};

export const execute = async function (interaction: ChatInputCommandInteraction) {
  const query = interaction.options.getString("query", true);
  const shouldShuffle = interaction.options.getBoolean("shuffle") || false;
  const member = interaction.member as GuildMember;
  const guildId = member.voice.channel.guild.id;

  if (!member.voice.channel) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription("I can't join you because you're not in a voice channel")
          .setColor(Colors.Red),
      ],
    });
  }

  const [url] = query.split(" ");
  const searchUrl =
    URL.canParse(url) && url.startsWith("http")
      ? url
      : hyperlink(
          query,
          `https://www.youtube.com/results?${String(
            new URLSearchParams({ search_query: query }),
          )}`,
        );

  // Obtenemos el estado actual del shuffle para pintar el botón del color correcto al inicio
  const isShuffleOn = isShuffleEnabled.get(guildId) || false;

  const interactionResponse = interaction
    .reply({
      embeds: [new EmbedBuilder().setDescription(`Searching "${searchUrl}"`)],
      components: buildControlPanel(false, isShuffleOn), // Pasamos el estado del shuffle
    })
    .catch(() => null);

  await player.play(member.voice.channel, query, {
    member,
    textChannel: interaction.channel as GuildTextBasedChannel,
    metadata: interactionResponse,
  });

  const queue = player.queues.get(guildId);
  if (queue && queue.songs.length > 1) {
    if (shouldShuffle || isShuffleOn) {
      await queue.shuffle();
    }
  }

  return interactionResponse;
};