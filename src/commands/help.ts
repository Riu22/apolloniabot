import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionContextType,
  OAuth2Scopes,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import player from "../player.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show help")
  .setDescriptionLocalizations({ "es-ES": "Mostrar ayuda" })
  .setContexts(InteractionContextType.Guild);

export const execute = async function (
  interaction: ChatInputCommandInteraction,
) {
  const commands = await player.client.application?.commands.fetch();
  const isSpanish = interaction.locale.startsWith("es");

  const translations: Record<string, string> = {
    play: isSpanish ? "Reproduce una canción o lista de reproducción" : "Play a song or playlist",
    stop: isSpanish ? "Para la música y sale del canal de voz" : "Stop the playback and leave the voice channel",
    next: isSpanish ? "Salta a la siguiente canción" : "Skip to the next song",
    pause: isSpanish ? "Pausa la reproducción" : "Pause the playback",
    resume: isSpanish ? "Reanuda la reproducción" : "Resume the playback",
    volume: isSpanish ? "Ajusta el volumen (0-100)" : "Set the volume (0-100)",
    queue: isSpanish ? "Muestra la cola de canciones" : "Show the queue",
    now: isSpanish ? "Muestra la canción actual" : "Show what's playing now",
    nowplaying: isSpanish ? "Muestra el panel de control de la canción actual" : "Show the control panel for the current song",
    shuffle: isSpanish ? "Mezcla la cola aleatoriamente" : "Shuffle the queue",
    repeat: isSpanish ? "Cambia el modo de repetición" : "Change the repeat mode",
    seek: isSpanish ? "Salta a un momento de la canción" : "Seek to a position in the song",
    move: isSpanish ? "Mueve una canción en la cola" : "Move a song in the queue",
    remove: isSpanish ? "Elimina una canción de la cola" : "Remove a song from the queue",
    speed: isSpanish ? "Cambia la velocidad de reproducción" : "Change the playback speed",
    fx: isSpanish ? "Aplica efectos de audio" : "Apply audio effects",
    help: isSpanish ? "Muestra esta ayuda" : "Show this help",
    version: isSpanish ? "Muestra la versión del bot" : "Show the bot version",
    web: isSpanish ? "Obtén el enlace al panel de control web" : "Get the link to the web control panel",
  };

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(
          isSpanish
            ? `🎵 Comandos de ${player.client.user?.username || "Apollonia"}`
            : `🎵 ${player.client.user?.username || "Apollonia"} Commands`,
        )
        .setURL(
          player.client.generateInvite({
            permissions: new PermissionsBitField()
              .add([
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
              ])
              .toArray(),
            scopes: [OAuth2Scopes.ApplicationsCommands, OAuth2Scopes.Bot],
          }),
        )
        .setDescription(
          isSpanish
            ? "Aquí tienes todos los comandos disponibles:"
            : "Here are all the available commands:",
        )
        .addFields(
          Array.from(commands || [])
            .sort(([, a], [, b]) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
            .map(([, command]) => ({
              name: `/${command.name}`,
              value: translations[command.name] || command.description,
              inline: true,
            })),
        )
        .setFooter({
          text: isSpanish
            ? "Pulsa el título para invitar al bot a tu servidor"
            : "Click the title to invite the bot to your server",
        }),
    ],
    
  });
};