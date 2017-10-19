/*
 * Utility to lock and unlock screen
 *
 * Uses the commands specified in commandConfig.json to do the actual lock/unlock
 */

import os from 'os';
import { exec } from 'child_process';
import hasbin from 'hasbin';
import { call, cps } from 'redux-saga/effects';

import config from '../configLoader';

const commandConfiguration = config.commands;
/*
 * Returns a string containing the command to be run (with args concated in)
 * The choice is made on the command specified in command configuration specified
 *
 * @param {Object} commandConfig Configuration object containing commmand configuration
 * @param {string} commandType Either 'lock' or 'unlock'
 * @param {string} currentPlatform Name of current OS as returned by os.platform()
 *                  (eg. 'darwin', 'linux', 'win32' etc.)
 * @param {Function} pathCheck function to use to check whether the config specified exec is in PATH
 *
 */
export function getLockCommand(commandConfig, commandType, currentPlatform, pathCheck) {
  if (
    !commandConfig ||
    !commandType ||
    typeof commandType !== 'string' ||
    typeof commandConfig !== 'object' ||
    !pathCheck ||
    typeof pathCheck !== 'function'
  ) {
    return '';
  }

  // TODO: These checks are getting hairy. Replace these validation checks with jsonschema
  // based validation check
  if (
    'default' in commandConfig &&
    typeof commandConfig.default === 'object' &&
    currentPlatform in commandConfig.default &&
    typeof commandConfig.default[currentPlatform] === 'object' &&
    commandType in commandConfig.default[currentPlatform] &&
    'command' in commandConfig.default[currentPlatform][commandType] &&
    typeof commandConfig.default[currentPlatform][commandType].command === 'string' &&
    commandConfig.default[currentPlatform][commandType].command.length > 0 &&
    pathCheck(commandConfig.default[currentPlatform][commandType].command)
  ) {
    const lockObj = commandConfig.default[currentPlatform][commandType];
    if ('args' in lockObj && typeof lockObj.args === 'string') {
      return `${lockObj.command} ${lockObj.args}`;
    }
    return lockObj.command;
  }

  return '';
}

function* runScreenCommand(commandType) {
  const lockCmd = getLockCommand(commandConfiguration, commandType, os.platform(), hasbin.sync);
  if (!lockCmd) {
    throw new Error(
      'Checkc commandConfig.json for lock command used and verify that it is compatible with your setup and that specified lock command is in PATH',
    );
  }
  yield cps(exec, lockCmd);
}

export function* lockScreen() {
  yield call(runScreenCommand, 'lock');
}

export function* unlockScreen() {
  yield call(runScreenCommand, 'unlock');
}
