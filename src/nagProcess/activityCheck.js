/*
 * Utility to check the time elapsed since last keyboard activity
 *
 * Basically, just a wrapper around xprintidle
 *
 */

import { exec } from 'child_process';
import hasbin from 'hasbin';

// TODO: Make this configurable
const IDLE_CHECK_COMMAND = 'xprintidle';

export default function getTimeSinceLastActivity() {
  return new Promise((resolve, reject) => {
    if (!hasbin.sync(IDLE_CHECK_COMMAND)) {
      reject(new Error('Cannot access xprintidle. Idle activity check will not be performed'));
    }
    exec(IDLE_CHECK_COMMAND, (err, stdout, stderr) => {
      if (err || stderr) {
        reject(new Error(`While calling xprintidle, ${err || stderr}`));
      }
      const output = stdout.toString();
      resolve(+output);
    });
  });
}
