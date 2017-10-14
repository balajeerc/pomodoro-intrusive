import { createMessageQueue, writeMessage } from './src/messageQueue';
import config from './config.json';

if (process.argv.length > 2) {
  createMessageQueue(config.messageQueue.id).then(messageQueue => {
    writeMessage(messageQueue, process.argv[2]);
  });
}
