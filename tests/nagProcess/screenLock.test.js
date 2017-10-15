import { getLockCommand } from '../../src/nagProcess/screenLock';
import defaultCommandConfig from '../../lockCommand.json';

// Dummy function that always returns true for any execpath
// given to it
const dummyPathCheck = _ => true; // eslint-disable-line no-unused-vars
const dummyPathCheckFail = _ => false; // eslint-disable-line no-unused-vars

describe('getLockCommand', () => {
  it('should return empty string on undefined config', () => {
    expect(getLockCommand(undefined, 'lock', 'linux', dummyPathCheck)).toBe('');
  });

  it('should return empty string on empty config', () => {
    expect(getLockCommand({}, 'lock', 'linux', dummyPathCheck)).toBe('');
  });

  it('should return empty string on config with malformed default entry', () => {
    expect(getLockCommand({ default: {} }, 'lock', 'linux', dummyPathCheck)).toBe('');
  });

  it('should return empty string on unsupported os', () => {
    expect(getLockCommand(defaultCommandConfig, 'lock', 'win32', dummyPathCheck)).toBe('');
  });

  it('should return empty string on unsupported operation', () => {
    expect(getLockCommand(defaultCommandConfig, 'doSomething', 'win32', dummyPathCheck)).toBe('');
  });

  it('should return empty string if pathCheck input is not a function', () => {
    expect(getLockCommand(defaultCommandConfig, 'lock', 'win32', {})).toBe('');
  });

  it("should return 'gnome-screencommand' for valid default config", () => {
    expect(getLockCommand(defaultCommandConfig, 'lock', 'linux', dummyPathCheck)).toBe(
      'gnome-screensaver-command -l',
    );
    expect(getLockCommand(defaultCommandConfig, 'unlock', 'linux', dummyPathCheck)).toBe(
      'gnome-screensaver-command -d',
    );
  });

  it('should return empty string when path check returns false', () => {
    expect(getLockCommand(defaultCommandConfig, 'lock', 'linux', dummyPathCheckFail)).toBe('');
  });
});
