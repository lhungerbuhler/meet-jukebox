var BaseSound = require('./BaseSound.js'),
    inherits = require('util').inherits,
    fs = require('fs'),
    config = require('../config.js'),
    ytdl = require('ytdl-core');

var horizon = require('horizon-youtube-mp3');

function YoutubeSound(url) {
    // console.log('Create youtube sound')
    this.mountpoint = config.dl_folder;
    BaseSound.call(this, url);
    this.ytdlOpts = { filter: 'audioonly'};
}

inherits(YoutubeSound, BaseSound);

YoutubeSound.prototype.checkAndSetUrl = function(url) {
    var pattern = new RegExp(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be|youtube\.fr))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/);
    var match = url.match(pattern);

    if (match === null) {
        throw new Error('The url is invalid');
    }

    var is_error = false;

    ytdl.getInfo(url, this.ytdlOpts, function(err, infos) {
        if ('undefined' === typeof infos) {
            is_error = true;
        }
    });

    if (is_error) {
        throw new Error('The url is invalid');
    }

    this.url = url;
    this.basename = "youtube-" + match[5] + "-" + new Date().getTime() + ".mp4";
    this.filename = this.mountpoint + this.basename;
};

YoutubeSound.prototype.downloadFile = function(cb) {
    var file = this.filename;
    var sound = this;

    console.log('### Start downloading "'+ file +'" from "' + this.url + '"');
    sound.file = file;

    /*
    horizon.getInfo(this.url, function(err, infos) {
        if (err) {
            console.log(err);
        } else {
            if (typeof infos !== "undefined") {
                sound.title = infos.videoName;

                if (!isNaN(infos.videoTimeSec)) {
                    sound.length = parseInt(infos.videoTimeSec);
                }
            }
        }
    });
    */


     ytdl.getInfo(this.url, this.ytdlOpts, function(err, infos) {
         if (err) {
             console.log(err);
         } else {
             if (typeof infos !== "undefined") {
                 sound.title = infos.title;

                 if (!isNaN(infos.length_seconds)) {
                     sound.length = parseInt(infos.length_seconds);
                 }
             }
         }
    });

    if (this.timeRange == null) {
        this.downloading = ytdl(this.url, this.ytdlOpts);

        this.downloading
            .pipe(fs.createWriteStream(file))
            .on('finish', function(test) {
                console.log('### End downloading ' + file);
            })
        ;
    } else {
        horizon.downloadToLocal(this.url, this.mountpoint, this.basename, this.timeRange, null, function(err, complete) {
            if (err) {
                console.log('Error during download', err);
            } else {
                console.log('### End downloading ' + file);
            }
        }, function(percent, timemark, targetSize){
            // console.log('Progress:', percent, 'Timemark:', timemark, 'Target Size:', targetSize);
            // Will return...
            // Progress: 90.45518257038955 Timemark: 00:02:20.04 Target Size: 2189
            // Progress: 93.73001672942894 Timemark: 00:02:25.11 Target Size: 2268
            // Progress: 100.0083970106642 Timemark: 00:02:34.83 Target Size: 2420
        });
    }

    if ('undefined' !== typeof cb) {
        setTimeout(cb, 5000);
    }
};

YoutubeSound.prototype.deleteFile = function() {
    var file = this.file;

    if ('undefined' !== typeof this.downloading) {
        this.downloading.destroy();
    }

    fs.unlink(this.file, function() {console.log(file + " => deleted")});
};



module.exports = YoutubeSound;
