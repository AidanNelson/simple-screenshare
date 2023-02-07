# Simple Screenshare

Connect a computer (i.e. Raspberry Pi) into a TV monitor and run this app. It will let you share you screen to the TV monitor (on the local network) using WebRTC.

# Raspberry Pi Setup

1. Create a fresh install of [Raspberry Pi OS](https://www.raspberrypi.com/software/) using the Raspberry Pi Imager or whichever method you prefer.

2. Start the Pi and update:

```sh
sudo apt update
sudo apt upgrade
```

3. Install Nodejs 18+ / npm from Nodesource per the [instructions](https://github.com/nodesource/distributions#installation-instructions).

4. Download this repo, install requirements and build the AppImage:

```sh
git clone https://github.com/AidanNelson/simple-screenshare.git
cd simple-screenshare
npm install
npm run dist
```

5. Move the AppImage into a convenient location on your computer (or leave it where it is...)

```sh
mv dist/simple-screenshare-1.0.0.AppImage ~/simple-screenshare.AppImage
```

6. Create a startup script to start the app on boot

```sh
sudo nano /etc/xdg/autostart/simple-screenshare.desktop

# add the following lines to the script (update the Exec filepath to match where you put the app)
[Desktop Entry]
Name=SimpleScreenshare
Exec=/home/pi/simple-screenshare.AppImage

# press control-x to exit and 'y' to save
```

7. Reboot and see if it works!

```sh
sudo reboot
```
