/*
 * Loads and agglomerates the JSON config files at startup
 *
 * We have to do this despite using webpack since the config files themselves are
 * not bundled with main executables. We keep it separate and load it with file-loader
 * which only returns a file
 *
 */
import fs from 'fs';

import logger from './logger';

import pomodoroConfig from '../config/pomodoroConfig.json';
import commmandConfig from '../config/commandConfig.json';
import controlConfig from '../config/controlConfig.json';

const configEntries = [
  {
    name: 'pomodoro',
    json: pomodoroConfig,
  },
  {
    name: 'commands',
    json: commmandConfig,
  },
  {
    name: 'control',
    json: controlConfig,
  },
];

function loadConfig() {
  return configEntries.reduce((consolidatedConfig, entry) => {
    try {
      // entry.json will be an object when app is run in debug mode
      // and a string when run from final bundle
      if (typeof entry.json === 'string') {
        const fileContents = fs.readFileSync(entry.json);
        const parsedJSON = JSON.parse(fileContents);
        return Object.assign({}, consolidatedConfig, { [entry.name]: parsedJSON });
      }
      return Object.assign({}, consolidatedConfig, { [entry.name]: entry.json });
    } catch (error) {
      logger.client.error(`Error loading config entry: ${entry.name} because: ${error}`);
      process.exit(1);
    }
    return {};
  }, {});
}

const config = loadConfig();

export default config;
