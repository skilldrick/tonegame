(function () {
  var SAMPLE_RATE = 44100;

  $(function () {
    var $play = $('<button>Play</button>');
    $('body').append($play);

    $play.click(function () {
      var baseFreq = 220;
      var scale = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16];
      var freqs = scale.map(function (semitone) {
        return baseFreq * Math.pow(2, semitone/12);
      });

      var sines = freqs.map(function (freq) {
        var sine = generateSine(freq, 0.9, 40000);
        return fadeInOut(sine, 1000, 1000);
      });

      var index = Math.floor(Math.random() * scale.length);

      playAudio(sines[index]);
    });
  });


  function generateSine(freq, level, duration) {
    var sine = [];
    for (var i = 0; i < duration; i++) {
      sine.push(level * Math.sin(freq * i * 2 * Math.PI / SAMPLE_RATE));
    }
    return sine;
  }

  function generateRamp(duration) {
    var arr = [];
    for (var i = 0; i < duration; i++) {
      arr.push(1 - (i / duration));
    }
    return arr;
  }

  function fadeInOut(arr, inDuration, outDuration) {
    var midDuration = arr.length - inDuration - outDuration;
    if (midDuration < 0) {
      throw new Error("Fades longer than array");
    }
    var envelope = generateRamp(inDuration).reverse();
    for (var i = 0; i < midDuration; i++) {
      envelope.push(1);
    }
    envelope = envelope.concat(generateRamp(outDuration));

    return convolve(arr, envelope);
  }

  function convolve(arr1, arr2, filler) {
    if (! filler && arr1.length !== arr2.length) {
      throw new Error("Arrays not same length and no filler provided");
    }
    var result = [];
    for (var i = 0, len = arr1.length; i < len; i++) {
      if (typeof arr2[i] == 'undefined') {
        result.push(arr1[i]);
      } else {
        result.push(arr1[i] * arr2[i]);
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
    var mixdown = [];
    for (var i = 0, len = channels[0].length; i < len; i++) {
      mixdown[i] = 0;
      for (var j = 0; j < channelCount; j++) {
        mixdown[i] += channels[j][i] / channelCount;
      }
    }
    return mixdown;
  }

  function playAudio(data) {
    var normalised = data.map(function (datum) {
      return (datum * 127) + 127;
    });
    var wave = new RIFFWAVE(normalised);
    var audio = new Audio(wave.dataURI);
    audio.play();
  }
})();
