function BaseSound(url) {
    this.file = undefined;
    this.filename = undefined;
    this.url = undefined;
    this.title = undefined;
    this.length = 0;
    this.checkAndSetUrl(url);
    this.downloading = undefined;
    this.timeRange = null;
}

BaseSound.prototype.checkAndSetUrl = function () {
    throw new Error('Implement BaseSound.checkUrl')
};

BaseSound.prototype.downloadFile = function () {
    throw new Error('Implement BaseSound.downloadFile');
};

BaseSound.prototype.getFile = function (cb) {
    if ('undefined' === typeof this.file) {
        this.downloadFile(cb);
    } else {
        setTimeout(cb, 5000);
    }
};

module.exports = BaseSound;
