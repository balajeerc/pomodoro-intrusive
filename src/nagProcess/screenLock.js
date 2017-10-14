import os from 'os';
import { execSync } from 'child_process';
import lockCommand from '../lockCommand.json';

function getLockCommand(currentPlatform, desktopEnvironment) {
  // If user has entered a custom command to lock screen in the configuration.
  // then just use that
  if ('custom' in lockCommand && lockCommand.custom.length > 0) {
    return lockCommand.custom;
  }

  if (currentPlatform === 'darwin' || currentPlatform === 'win32') {
    return lockCommand[currentPlatform];
  } else if (currentPlatform === 'linux') {
    // Linux needs special handling for the various desktop environments possible
    const matchedEnv = Object.keys(lockCommand.linux).filter(
      desktopEnv => desktopEnvironment.search(desktopEnv) >= 0,
    );
    if (matchedEnv.length > 0) {
      return lockCommand.linux[matchedEnv];
    }
  }

  return '';
}

function getCurrentDesktopEnvironment() {
  if (os.platform() !== 'linux') {
    return '';
  }
  return execSync('echo $DESKTOP_SESSION').toString();
}

export default function lockScreen() {
  const lockCmd = getLockCommand(os.platform(), getCurrentDesktopEnvironment());
  if (lockCmd.length > 0) {
    execSync(getLockCommand());
    return;
  }
  // TODO: Log error properly
  console.error('error'); // eslint-disable-line no-console
}
