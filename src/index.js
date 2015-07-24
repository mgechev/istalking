/* global EventEmitter, window */

window.isTalking = (function (global) {
  'use strict';

  function Talking() {
    this.stream = null;
    this._isUserTalking = false;
    this._paused = false;
    this._checkStrategy = this._defaultStrategy;
    EventEmitter.call(this);
  }

  Talking.prototype = Object.create(EventEmitter.prototype);

  Talking.prototype.init = function (config) {
    this._checkStrategy = config.strategy || this._checkStrategy;
    this.stream = config.stream;
    var AudioCtx = (global.AudioContext || global.webkitAudioContext);
    this._ctx = new AudioCtx();
    this._analyser = this._ctx.createAnalyser();
    var source = this._ctx.createMediaStreamSource(this.stream);
    source.connect(this._analyser);
    this._analyser.fftSize = 2048;
    var bufferLength = this._analyser.frequencyBinCount;
    this._dataArray = new Uint8Array(bufferLength);
    this._startCheckInterval();
  };

  Talking.prototype._startCheckInterval = function () {
    setTimeout(this._startCheckInterval.bind(this), this.CHECK_TIMEOUT);
    this._check();
  };

  Talking.prototype._defaultStrategy = function (buffer) {
    var sum = 0;
    for (var i = 0; i < buffer.length; i += 1) {
      sum += Math.pow(buffer[i], 2);
    }
    return sum > 2000000;
  };

  Talking.prototype._startTalking = function () {
    this._isUserTalking = true;
    this.trigger(Talking.ON_START);
  };

  Talking.prototype._stopTalking = function () {
    this._isUserTalking = false;
    this.trigger(Talking.ON_STOP);
  };

  Talking.prototype._check = function () {
    this._analyser.getByteFrequencyData(this._dataArray);
    var currentlyTalking = this._checkStrategy(this._dataArray);
    if (!this._isUserTalking && currentlyTalking && !this._paused) {
      this._startTalking();
    } else {
      this._stopTalking();
    }
  };

  Talking.prototype.yes = function (cb) {
    this.on(Talking.ON_START, cb);
  };

  Talking.prototype.no = function (cb) {
    this.on(Talking.ON_STOP, cb);
  };

  Talking.prototype.pause = function () {
    this._paused = true;
  };

  Talking.prototype.resume = function () {
    this._paused = false;
  };

  Talking.ON_START = 'start-talking';
  Talking.ON_STOP = 'stop-talking';

  var instance = new Talking();
  instance.CHECK_TIMEOUT = 500;

  return instance;
}(window));
