var audio = (function () {

  var baseFreq = 220;
  var c = new (window.AudioContext || window.webkitAudioContext)();
  var freqs;

  function setupTones(scale) {
    freqs = scale.map(function (semitone) {
      return baseFreq * Math.pow(2, semitone/12);
    });
  }

  function play(chosenIndexes, startCallback, endCallback) {
    if (!(chosenIndexes instanceof Array)) {
      chosenIndexes = [chosenIndexes];
    }

    chosenIndexes.forEach(function (item, index) {
      playTone(freqs[item], startCallback, endCallback, index === 0);
    });
  }

  function playTone(freq, startCallback, endCallback, callCallbacks) {
    var length = 1;
    var osc = c.createOscillator();
    var g = c.createGain();

    osc.frequency.value = freq;

    setWaveform(osc);
    setFadeInAndOut(g, length);

    osc.start(c.currentTime);
    osc.stop(c.currentTime + length);

    osc.connect(g);
    g.connect(c.destination);

    if (callCallbacks) {
      startCallback && startCallback();
      osc.onended = endCallback;
    }
  }

  function setWaveform(osc) {
    try {
      // Create waveform with the following harmonic coefficients
      var real = new Float32Array([0, 1, 0.8, 0.6, 0.5, 0.3, 0.2, 0.2]);
      var imag = new Float32Array(8);
      var wave = c.createPeriodicWave(real, imag);
      osc.type = 'custom';
      osc.setPeriodicWave(wave);
    } catch (e) { // Not all audio contexts can support custom type
      osc.type = 'triangle';
    }
  }

  function setFadeInAndOut(g, length) {
    var maxGain = 1;
    var minGain = 0.01; // Exponential ramp can't start at zero
    var fadeTime = 0.05;
    var start = c.currentTime;
    var end = start + length;

    g.gain.setValueAtTime(minGain, start);
    g.gain.exponentialRampToValueAtTime(maxGain, start + fadeTime);
    g.gain.setValueAtTime(maxGain, end - fadeTime);
    g.gain.exponentialRampToValueAtTime(minGain, end);
  }


  return {
    setupTones: setupTones,
    play: play
  };
})();
