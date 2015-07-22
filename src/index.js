/* global EventEmitter, window */

window.isTalking = (function () {
  'use strict';

  function Talking() {
    this.stream = null;
    this._isUserTalking = false;
    this._checkStrategy = this._defaultStrategy;
    EventEmitter.call(this);
  }

  Talking.prototype = Object.create(EventEmitter.prototype);

  Talking.prototype.init = function (stream, strategy) {
    this.stream = stream;
    this._checkStrategy = strategy;

    var AudioCtx = (window.AudioContext || window.webkitAudioContext);
    this._ctx = new AudioCtx();
    this._analyser = this._ctx.createAnalyser();
    var source = this._ctx.createMediaStreamSource(stream);
    source.connect(this._analyser);
    this._analyser.fftSize = 2048;
    var bufferLength = this._analyser.frequencyBinCount;
    this._dataArray = new Uint8Array(bufferLength);
  };

  Talking.prototype._startCheckInterval = function () {
    setTimeout(this._startCheckInterval.bind(this), this.CHECK_TIMEOUT);
  };

  Talking.prototype._defaultStrategy = function () {
    return true;
  };

  Talking.prototype._check = function () {
    this._analyser.getByteTimeDomainData(this._dataArray);
    var currentlyTalking = this._checkStrategy(this._dataArray);
    if (!this._isUserTalking && currentlyTalking) {
      this._isUserTalking = true;
      this.trigger(Talking.ON_START);
    } else {
      this._isUserTalking = false;
      this.trigger(Talking.ON_STOP);
    }
  };

  Talking.prototype.yes = function (cb) {
    this.on(Talking.ON_START, cb);
  };

  Talking.prototype.no = function (cb) {
    this.on(Talking.ON_STOP, cb);
  };

  Talking.prototype.now = function () {
    return this._isUserTalking;
  };

  Talking.ON_START = 'start-talking';
  Talking.ON_STOP = 'stop-talking';

  var instance = new Talking();
  instance.CHECK_TIMEOUT = 500;

  return instance;
}());
