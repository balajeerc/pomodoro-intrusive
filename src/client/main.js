import parseArgs from 'minimist';
import 'babel-polyfill';

import store from './stateStore';
import { launch } from './actions';

import {
  SPAWN_POMODORO_NAG,
  SHUTDOWN_POMODORO_NAG,
  QUERY_POMODORO_NAG_STATUS,
  RESTART_BREAK,
  RESTART_WORK,
} from '../controlCommands';

const argv = parseArgs(process.argv.slice(2));

const supportedCommands = {
  start: { help: 'Starts the pomodoro nag process', command: SPAWN_POMODORO_NAG },
  'restart:work': { help: 'Restarts the work time', command: RESTART_WORK },
  'restart:break': { help: 'Restarts the break time', command: RESTART_BREAK },
  status: { help: 'Prints current pomodoro nag status', command: QUERY_POMODORO_NAG_STATUS },
  stop: { help: 'Terminates the pomodoro nag process', command: SHUTDOWN_POMODORO_NAG },
};

function printUsage() {
  console.error('Invalid usage'); // eslint-disable-line no-console
  const subCommandUsage = Object.keys(supportedCommands).reduce(
    (concated, key) => `${concated}\n    ${key} - ${supportedCommands[key]}`,
    '',
  );
  const usage = `pomodoro-intrusive <start|restart:work|restart:work|status|stop>\n  where${subCommandUsage}`;
  console.log(usage); // eslint-disable-line no-console
}

if (argv._.length === 0) {
  printUsage();
  process.exit(1);
}

const subCommand = argv._[0];
if (!(subCommand in supportedCommands)) {
  printUsage();
  process.exit(1);
}

// TODO: The below forced termination is a nasty kludge done to push
// out an alpha version. This must must replaced by a graceful shutdown
// initiated by sending a SHUTDOWN command over TCP to the nag process
if (subCommand === 'stop') {
  process.exit(1);
}

store.dispatch(launch(supportedCommands[subCommand].command));
