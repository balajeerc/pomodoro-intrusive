import net from 'net';

import logger from '../logger';
import config from '../../config.json';

if (process.argv.length <= 2) {
  logger.error('Usage: pomodoro-intrusive <command>');
  process.exit(1);
}

const client = net.createConnection({ port: config.tcp.port }, () => {
  client.write(process.argv[2]);
  client.end();
  process.exit(0);
});

client.on('data', data => {
  logger.client.info(data);
  client.end();
});
