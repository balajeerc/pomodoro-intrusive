import { execSync } from 'child_process';

import parseArgs from 'minimist';
import 'babel-polyfill';

import store from './stateStore';
import { launch, spawnPomodoroNag } from './actions';

const argv = parseArgs(process.argv.slice(2));

const supportedCommands = {
  start: 'Starts the pomodoro nag process',
  'restart:work': 'Restarts the work time',
  'restart:break': 'Restarts the break time',
  status: 'Prints current pomodoro nag status',
  stop: 'Terminates the pomodoro nag process',
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
  try {
    execSync(
      "ps -eff | grep -v grep | grep pomodoro-nag | awk '{print $2}' | xargs kill -9 > /dev/null 2>&1",
    );
  } catch (_) {
    console.error('No existing pomodoro nag process running.'); // eslint-disable-line no-console
  }
  process.exit(1);
}

store.dispatch(launch());

if (subCommand === 'start') {
  // Dispatch an action to the application state machine to start
  // process state machine
  store.dispatch(spawnPomodoroNag());
}
