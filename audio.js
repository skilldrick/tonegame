var audio = (function () {
  var SAMPLE_RATE = 44100;
  var baseFreq = 220;
  var context = new webkitAudioContext();
  var timeouts = [];
  var tones;

  function stop() {
    timeouts.forEach(clearTimeout);
    timeouts = [];
  }

  function setupTones(scale) {
    var freqs = scale.map(function (semitone) {
      return baseFreq * Math.pow(2, semitone/12);
    });

    tones = freqs.map(function (freq) {
      var tone = generateTone(freq, 0.8, 44100);
      return fadeInOut(tone, 1000, 1000);
    });
  }

  function playGuess(indexes) {
    var guessedTones = indexes.map(function (index) {
      return tones[index];
    });

    var mixed = mix(guessedTones);

    playAudio(mixed);
  }

  function play(chosenIndexes, startCallback, endCallback) {
    var chosenTones = chosenIndexes.map(function (index) {
      return tones[index];
    });
    var mixed = mix(chosenTones);

    playAudio(mixed, startCallback, endCallback);
  }


  function generateTone(freq, level, duration) {
    var tone = new Float32Array(duration);
    var factors = [0.5, 0.4, 0.3, 0.2, 0.1];
    var factorsLength = factors.length;
    var twoPiFreq = 2 * Math.PI * freq;
    var val;
    var omega;
    for (var i = 0; i < duration; i++) {
      var omega = twoPiFreq * i / SAMPLE_RATE;
      val = 0;
      for (var j = 0; j < factorsLength; j++) {
        val += factors[j] * Math.sin(omega * (j + 1));
      }
      tone[i] = level * val;
    }
    return tone;
  }

  function generateRamp(duration) {
    var arr = [];
    for (var i = 0; i < duration; i++) {
      arr.push(1 - (i / duration));
    }
    return arr;
  }

  function fadeInOut(arr, inDuration, outDuration) {
    var fadeOutStart = arr.length - outDuration;
    var envelope = new Float32Array(arr.length);

    //set the first portion to be a fade in
    envelope.set(generateRamp(inDuration).reverse());
    //set the mid portion to be all zeroes
    for (var i = inDuration; i < fadeOutStart; i++) {
      envelope[i] = 1;
    }
    //set the last portion to be a fade out
    envelope.set(generateRamp(outDuration), fadeOutStart);

    return multiply(arr, envelope);
  }

  function multiply(arr1, arr2) {
    var result = new Float32Array(arr1.length);
    for (var i = 0, len = arr1.length; i < len; i++) {
      if (arr2[i] == undefined) {
        result[i] = arr1[i];
      } else {
        result[i] = arr1[i] * arr2[i];
      }
    }
    return result;
  }

  function mix() {
    var channels;
    if (arguments.length === 1) {
      channels = arguments[0];
    } else {
      channels = [].slice.call(arguments);
    }
    var channelCount = channels.length;
    var mixdown = new Float32Array(channels[0].length);
    for (var i = 0, len = channels[0].length; i < len; i++) {
      mixdown[i] = 0;
      for (var j = 0; j < channelCount; j++) {
        mixdown[i] += channels[j][i] / channelCount;
      }
    }
    return mixdown;
  }

  function playAudio(data, startCallback, endCallback) {
    buffer = context.createBuffer(1, 44100, 44100);
    samples = new Float32Array(data);

    var dbuf = buffer.getChannelData(0);
    var num = 44100;
    var sbuf = samples;
    for (i = 0; i < num; i++) {
      dbuf[i] = sbuf[i];
    }

    var node = context.createBufferSource();
    node.buffer = buffer;
    node.gain.value = 0.5;
    node.connect(context.destination);
    node.noteOn(0);

    startCallback && startCallback();
    timeouts.push(setTimeout(endCallback, 1000));
  }

  return {
    setupTones: setupTones,
    play: play,
    playGuess: playGuess,
    stop: stop
  };
})();
