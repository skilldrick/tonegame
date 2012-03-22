(function () {
  var SAMPLE_RATE = 44100;
  var baseFreq = 220;
  var scale;
  var freqs;
  var sines;
  var audios;
  var chosenIndexes;

  $(function () {
    var $playAll = $('<button>Play all</button>');
    var $stop = $('<button>Stop</button>').hide();
    var $play = $('<button>Play</button>');
    $('#controls').append($playAll);
    $('#controls').append($stop);
    $('#controls').append($play);

    setup();

    $playAll.click(function () {
      allAudios = [];
      playAll();
      $stop.show();
      $playAll.hide();
    });

    $stop.click(function () {
      audios.forEach(function (audio) {
        $(audio).off('ended');
        audio.pause();
        audio.currentTime = 0;
      });
      $('#boxes .box').css('outline-color', 'transparent');
      $playAll.show();
      $stop.hide();
    });

    $play.click(function () {
      play();
    });

  });

  function play() {
    if (!chosenIndexes) {
      chosenIndexes = pickDistinct(scale.length, 2);
    }
    var chosenSines = chosenIndexes.map(function (index) {
      return sines[index];
    });
    var mixed = mix(chosenSines);

    playAudio(mixed);
  }

  function playAll() {
    var index = 0;

    function playNext() {
      if (index < scale.length) {
        playAndHighlight(index, playNext);
        index++;
      }
    }
    playNext();
  }

  function playAndHighlight(index, callback) {
    $box = $('#boxes [data-index=' + index + ']');
    playAudio(audios[index], function () {
      $box.css('outline-color', 'yellow');
    }, function () {
      $box.css('outline-color', 'transparent');
      callback && callback();
    });
  }

  function setup() {
    scale = [0, 1, 4, 5, 7, 8, 10, 12, 13];

    freqs = scale.map(function (semitone) {
      return baseFreq * Math.pow(2, semitone/12);
    });

    sines = freqs.map(function (freq) {
      var sine = generateSine(freq, 0.9, 40000);
      return fadeInOut(sine, 1000, 1000);
    });

    audios = sines.map(dataToAudio);

    setupBoxes(scale.length);
  }

  function setupBoxes(count) {
    var $boxes = $('#boxes').empty();
    var $box;
    var hue;
    for (var i = 0; i < count; i++) {
      $box = $('<span>').attr('class', 'box').attr('data-index', i);
      hue = (360 / count) * i
      $box.css('background-color', "hsla(" + hue + ", 50%, 50%, 1)");
      $boxes.append($box);
    }
  }

  function pickDistinct(max, count) {
    var choices = [];
    var choice;
    while (true) {
      choice = Math.floor(Math.random() * max);
      if (choices.indexOf(choice) == -1) {
        choices.push(choice);
      }
      if (choices.length === count) {
        return choices;
      }
    }
  }


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

  function dataToAudio(data) {
    var normalised = data.map(function (datum) {
      return (datum * 127) + 127;
    });
    var wave = new RIFFWAVE(normalised);
    return new Audio(wave.dataURI);
  }

  function playAudio(data, startCallback, endCallback) {
    var audio;
    if (data instanceof Array) {
      audio = dataToAudio(data);
    } else {
      audio = data;
    }
    $(audio).on('playing', startCallback);
    $(audio).on('ended', endCallback);
    audio.play();
    allAudios.push(audio);
  }
})();
