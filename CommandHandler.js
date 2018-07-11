var YoutubeSound = require('./sound/YoutubeSound.js');
var SampleSound = require('./sound/SampleSound.js');
var SampleManager = require('./SampleManager.js');
var PlaylistItem = require('./playlist/PlaylistItem.js');
var os = require('os');
var config = require('./config.js');

function CommandHandler(playlist) {
    this.playlist = playlist;
    this.url_regex = {
        youtube: new RegExp(/^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be|youtube\.fr))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/)
    };
}

CommandHandler.prototype.updateSample = function(url, sampleId, timeRange, botReply) {
    var sound = new YoutubeSound(url);
    sound.mountpoint = config.samples_folder;
    sound.basename = sampleId;
    sound.filename = config.samples_folder + sampleId;
    sound.timeRange = timeRange;

    botReply("Crafting sound *"+sampleId+"* in progress...");
    sound.downloadFile(function() {
        botReply("Sound *"+sampleId+"* is ready!");
    });
};

CommandHandler.prototype.deleteSample = function(sampleId, botReply) {
    SampleManager.deleteSampleById(sampleId, function(filename) {
        botReply("Delete sound *"+sampleId+"*: OK");
    });
};

CommandHandler.prototype.playSample = function(sampleId, provider, user_id, endPlaying) {
    var self = this;

    SampleManager.findSampleById(sampleId, function(filename) {
        var sound = new SampleSound(filename, sampleId);
        var item = new PlaylistItem(sound, provider, user_id, endPlaying);
        self.playlist.flushQueue();
        self.playlist.addToQueue(item);
    });
};

CommandHandler.prototype.listSamples = function(botReply) {
    SampleManager.listSamples(function(sampleList) {
        var output = "";

        if (typeof sampleList !== "undefined") {
            sampleList.forEach(function(sample) {
                if (!sample.match(/_tmp$/)) {
                    output += "- "+sample + "\n";
                }
            });
        } else {
            output = "Empty list"
        }

        botReply(output);
    });
};

CommandHandler.prototype.helpForSamples = function(botReply) {
    var helpItems = [
        '1. @Jukebox install [Youtube URL] [Identifiant du son (a-z0-9_)] [Début 00:00] [Fin 00:00] - Début et Fin sont facultatifs',
        '2. @Jukebox list',
        '3. @Jukebox send [Identifiant du son]',
        '4. @Jukebox uninstall [Identifiant du son] [Mot de passe]',
        '5. @Jukebox help'
    ];
    var output = "";

    helpItems.forEach(function(helpItem) {
        output += "" + helpItem + "\n";
    });

    botReply(output);
};

CommandHandler.prototype.addLike = function (playlist_items) {
    playlist_items.forEach(function(playlist_item) {
        playlist_item.like = playlist_item.like + 1;
    });
};

CommandHandler.prototype.removeLike = function (playlist_items) {
    playlist_items.forEach(function(playlist_item) {
        if (playlist_item.like > 0) {
            playlist_item.like = playlist_item.like - 1;
        }
    });
};

CommandHandler.prototype.addDislike = function (playlist_items) {
    playlist_items.forEach(function(playlist_item) {
        playlist_item.dislike = playlist_item.dislike + 1;
    });
};

CommandHandler.prototype.removeDislike = function (playlist_items) {
    playlist_items.forEach(function(playlist_item) {
        if (playlist_item.dislike > 0) {
            playlist_item.dislike = playlist_item.dislike - 1;
        }
    });
};

CommandHandler.prototype.playNext = function() {
    if ('undefined' !== typeof config.allow_playnext && config.allow_playnext) {
        console.log('playnext');
        this.playlist.playNext(true);
    }
};

CommandHandler.prototype.addUrlToPlaylist = function (url, provider, user_id, endPlaying) {
    var sound = undefined;

    if (url.match(this.url_regex['youtube']) !== null) {
        try {
            sound = new YoutubeSound(url);
        } catch (err) {
            console.log(url + ' is not good')
        }
    }

    if ('undefined' !== typeof sound) {
        var item = new PlaylistItem(sound, provider, user_id, endPlaying);
        this.playlist.addToQueue(item);
        return item;
    }

    return null;
};

CommandHandler.prototype.pause = function() {
    if ('undefined' !== typeof this.playlist.player.audio) {
        this.playlist.player.audio.stdin.write('pause' + os.EOL);
    }
};

CommandHandler.prototype.play = function() {
    if ('undefined' !== typeof this.playlist.player.audio) {
        this.playlist.player.audio.stdin.write('play' + os.EOL);
    }
};

CommandHandler.prototype.volume = function(volume) {
    if ('undefined' !== typeof this.playlist.player.audio) {
        if (!isNaN(volume)) {
            var vol = parseInt(volume);
            if (vol >= 0 && vol <= 256) {
                this.playlist.player.audio.stdin.write('volume ' + vol + os.EOL);
            }
        } else if (volume == 'up') {
            this.playlist.player.audio.stdin.write('volup' + os.EOL);
        } else if (volume == 'down') {
            this.playlist.player.audio.stdin.write('voldown' + os.EOL);
        }
    }
};

CommandHandler.prototype.deleteFromPlaylist = function(items, cb) {
    var self = this;
    items.forEach(function(item) {
        var index = self.playlist.queue.indexOf(item);
        if (index > -1) {
            self.playlist.queue.splice(index, 1);
            if ('undefined' !== cb) {
                cb()
            }
        }
    });
};

module.exports = CommandHandler;
