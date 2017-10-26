# pomodoro-intrusive

> __NOTE: This is a work in progress. Please check back for when there is a release.__

![Sgt. Pomodoro](sgt_pomodoro.png)

pomodoro-intrusive is a utility that enforces the pomodoro discipline rather forcefully: by locking up your screen!
Currently, it's only available for Linux and those of them with `gnome-screensaver-command` installed and functional.

- [Overview](#overview)
- [Motivation](#motivation)
- [Installation](#installation)
- [Running](#running)
- [Configuration](#configuration)
- [Roadmap](#roadmap)

## <a name="overview">Overview</a>

Here's what it does:

1) On running pomodoro-intrusive, it forks off a background process called the pomodoro-nag.
2) pomodoro-nag waits for a specified time time of work (default: 25 mins)
3) It then locks your screen!
4) That's not all. Really annoyingly, during the duration of the break period (default: 5 mins) it repeatedly keeps locking your screen up. It's not called intrusive for nothing.
5) After the break period, it opens up your screen. But that's not all...
6) After unlocking your screen, it keeps monitoring for mouse/keyboard activity. If it doesn't detect any, it is most probably because you left your workstation and are wasting time on Twitter. So helpfully, pomodoro-nag periodically plays a sound alerting you to GET BACK TO WORK!
7) Once it detects that you're back at work, it resumes the work timer.

## <a name="motivation">Motivation</a>

- [Studies show](http://edition.cnn.com/2017/09/11/health/sitting-increases-risk-of-death-study/index.html) that sitting for prolonged periods of time have a terrible effect on your lifespan. Taking breaks by getting up and moving around [greatly alleviates the harms of sitting](http://edition.cnn.com/2015/08/06/health/how-to-move-more/index.html).
- This was especially significant in my case, since I was struggling with back issues. Frequent breaks were made mandatory by my physio.
- An ideal work discipline that helps with this is the 'pomodoro' technique.
- Most pomodoro workflow utilities are non-intrusive... to the point where you forget about them. This was a deal breaker for me. In most cases, I just tune out the subtle notifications in my taskbar telling me to go take a break.
- Moreover, these pomodoro utilities need to be manually restarted when you resume work. Most of the time, I just used to forget to do that.
- pomodoro technique is awesome, but the tools available to enforce this were far from adequate.
- This tool is an attempt at solving the problems stated above.

## <a name="installation">Installation</a>

### Pre-requisites

- node(v6.2+) with npm (On Ubuntu: `sudo apt-get install nodejs`)
- gnome-screensaver-command (On Ubuntu: `sudo apt-get install gnome-screensaver`)
    - Note that you can use gnome-screensaver-command even when running other desktop environments (though this would involve pulling in a bunch of other gtk dependencies). I have gnome-screensaver-command installed though I use i3-wm as my window manager.
    - If you still feel you want it done the way YOUR setup needs it done, take a look at the configuration section.
- xprintidle (On Ubuntu: `sudo apt-get install xprintidle`)

### Downloading from npm

```
npm install -g pomodoro-intrusive
```

## <a name="running">Running</a>

```
pomodoro-intrusive start            # Starts the pomodoro nag process
pomodoro-intrusive stop             # Terminates the pomodoro nag process
```

### In the Pipeline but not yet implemented

```
pomodoro-intrusive restart:work     # Restarts the work time
pomodoro-intrusive restart:break    # Restarts the break time
pomodoro-intrusive status           # Prints current pomodoro nag status
```

## <a name="configuration">Configuration</a>

- Configuration of the parameters such as the pomodoro activity intervals can be done by editing `config.json`.
- Configruation/overriding of the screen locking mechanism can be achieved by editing `lockCommand.json`.

## <a name="roadmap">Roadmap</a>

- I wrote this over a weekend, so though initially I intended to be ambitious and target Windows and OSX as well, the overhead of figuring out the platform specific calls of automatic screen locking and unlocking were too overwhelming to tackle.
- Drop me a mail/file an issue if you like this but need it for a different OS/desktop environment.
