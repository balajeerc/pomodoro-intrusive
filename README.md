# pomodoro-intrusive

pomodoro-intrusive is a utility that enforces the pomodoro discipline rather forcefully: by locking up your screen!
Currently, it's only available for Linux and those of them with `gnome-screensaver-command` installed and functional.

## Overview

Here's what it does:

1) On running pomodoro-intrusive, it forks off a background process called the pomodoro-nag.
2) pomodoro-nag waits for a specified time time of work (default: 25 mins)
3) It then locks your screen!
4) That's not all. Really annoyingly, during the duration of the break period (default: 5 mins) it repeatedly keeps locking your screen up. It's not called intrusive for nothing.
5) After the break period, it opens up your screen. But that's not all...
6) After unlocking your screen, it keeps monitoring for mouse/keyboard activity. If it doesn't detect any, it is most probably because you left your workstation and are wasting time on Twitter. So helpfully, pomodoro-nag periodically plays a sound alerting you to GET BACK TO WORK!
7) Once it detects that you're back at work, it resumes the work timer.

## Motivation

- Studies show that sitting for prolonged periods of time have a terrible effect on your lifespan. Taking breaks by getting up and moving around greatly alleviates the harms of sitting.
- This was especially significant in my case, since I was struggling with back issues. Frequent breaks were made mandatory by my physio.
- An ideal work discipline that helps with this is the 'pomodoro' technique.
- Most pomodoro workflow utilities are non-intrusive... to the point where you forget about them. This was a deal breaker for me. In most cases, I just tune out the subtle notifications in my taskbar telling me to go take a break.
- Moreover, these pomodoro utilities need to be manually restarted when you resume work. Most of the time, I just used to forget to do that.
- pomodoro technique is awesome, but the tools available to enforce this were far from adequate.
- This tool is an attempt at solving the problems stated above.

## Installation

This utility needs node and npm.

```
npm install -g pomodoro-intrusive
```

## Requirements

- Linux
- gnome-screensaver-command
    - Note that you can use gnome-screensaver-command even when running other desktop environments. I myself use i3-wm and gnome-screensaver-command works happily with that.
    - If you still feel you want it done the way YOUR setup needs it done, take a look at the configuration section.

## Configuration

Configuration of the parameters such as the pomodoro activity intervals can be done by editing `config.json`.

## Future work

- I wrote this over a weekend, so though initially I intended to be ambitious and target Windows and OSX as well, the overhead of figuring out the platform specific calls of automatic screen locking and unlocking were too overwhelming to tackle.
- Drop me a mail/file an issue if you like this but need it for a different OS/desktop environment.
