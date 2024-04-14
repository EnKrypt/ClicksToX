import 'dotenv/config';

const config = {
  port: Number(process.env.PORT) || 9980,
  lobbyPlayerLimit: Number(process.env.LOBBY_PLAYER_LIMIT) || 10,
  wikipediaHost: process.env.WIKIPEDIA_HOST || 'en.wikipedia.org',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
