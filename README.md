# pomodoro-intrusive

> __NOTE: This is a work in progress. Please check back for when there is a release.__

![Sgt. Pomodoro](sgt_pomodoro.png)

pomodoro-intrusive is a cross-platform utility that enforces the pomodoro discipline rather forcefully: by locking up your screen!
Currently, it is available for Linux, OSX and Windows.

- [Overview](#overview)
- [Motivation](#motivation)
- [Installation](#installation)
- [Running](#running)
- [Configuration](#configuration)
- [Roadmap](#roadmap)
- [Credits](#credits)

## <a name="overview">Overview</a>

Here's what it does:

1) On starting pomodoro-intrusive, it forks off a background process called the pomodoro-nag.
2) pomodoro-nag waits for a specified time time of work (default: 25 mins)
3) It then locks your screen! (Basically, shows a full screen window that is always on top of other windows.) You could try closing this, but...
4) During the duration of the break period (default: 5 mins), it repeatedly re-launches the lock screen window if it is closed. Hey, it's not called __intrusive__ for nothing!
5) After the break period, it opens up your screen. But that's not all...
6) After unlocking your screen, it keeps monitoring for mouse/keyboard activity. If it doesn't detect any, it is most probably because you left your workstation (and are wasting time checking your Twitter feed using your phone). So helpfully, pomodoro-nag periodically plays a sound alerting you to GET BACK TO WORK!
7) Once it detects a few keystrokes/mouse activity, it closes the screen lock and resumes the work timer. 
8) Rinse and repeat cycle.

## <a name="motivation">Motivation</a>

- [Studies show](http://annals.org/aim/article-abstract/2653704/patterns-sedentary-behavior-mortality-u-s-middle-aged-older-adults) that sitting for prolonged periods of time has a terrible effect on your lifespan. Taking frequent breaks by getting up and moving around [significantly alleviates the harms of sitting](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3404815/).
- This was especially significant in my case, since I was struggling with back issues. Frequent breaks were made mandatory by my physio.
- An ideal work discipline that helps with this is the 'pomodoro' technique.
- Most pomodoro workflow utilities are non-intrusive... to the point where you forget about them. This was a deal breaker for me since I just tune out the subtle notifications in my taskbar telling me to go take a break.
- Moreover, these pomodoro utilities need to be manually restarted when you resume work. Most of the time, I just used to forget to do that.
- pomodoro technique is awesome, but the tools available to enforce this were far from adequate.
- This tool is an attempt at solving these problems and enforcing a proper pomodoro discipline.

## <a name="installation">Installation</a>

### Pre-requisites

- node(v4.7+) with npm (On Ubuntu: `sudo apt-get install nodejs`)

### Download app from npm

```
npm install -g pomodoro-intrusive
```

## <a name="running">Running</a>

```
pomodoro-intrusive start            # Starts the pomodoro nag process
pomodoro-intrusive stop             # Terminates the pomodoro nag process
pomodoro-intrusive status           # Prints current pomodoro nag status
```

### In the Pipeline but not yet implemented

```
pomodoro-intrusive restart:work     # Restarts the work time
pomodoro-intrusive restart:break    # Restarts the break time
```

## <a name="configuration">Configuration</a>

- Configuration of the parameters such as the pomodoro activity intervals can be done by editing `<installation_dir>/dist/pomodoroConfig.json`.

## <a name="roadmap">Roadmap</a>

- Standalone installers/zip packages for Windows and OSX.
- Systray icon and menu to perform the various actions currently accessible only from commandline.
- GUI to configure options rather than having to edit the configuration files manually.

## <a name="credits">Credits</a>

- Sgt.Pomodoro graphic designed by Radhika Ayyangar
