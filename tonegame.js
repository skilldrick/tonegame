(function () {
  var SAMPLE_RATE = 44100;
  var baseFreq = 220;
  var scale;
  var freqs;
  var tones;
  var chosenIndexes;
  var clickedIndexes = [];
  var context = new webkitAudioContext();
  var timeouts = [];

  $(function () {
    var $playAll = $('<button>Play all</button>');
    var $stop = $('<button>Stop</button>').hide();
    var $play = $('<button>Play notes</button>');
    $('#controls').append($playAll);
    $('#controls').append($stop);
    $('#controls').append($play);

    setup();

    $playAll.click(function () {
      playAll(function () {
        $playAll.show();
        $stop.hide();
      });
      $stop.show();
      $playAll.hide();
    });

    $stop.click(function () {
      timeouts.forEach(clearTimeout);
      timeouts = [];
      $('#boxes .box').css('outline-color', 'transparent');
      $playAll.show();
      $stop.hide();
    });

    $('#boxes .box').click(function () {
      var index = $(this).data('index');
      playAndHighlight(index);
      clickedIndexes.push(index);
      var lastTwo = clickedIndexes.slice(-2);
      lastTwo.sort();
      chosenIndexes.sort();

      if (lastTwo[0] === chosenIndexes[0] && lastTwo[1] === chosenIndexes[1]) {
        alert('YOU WIN!!!\nClick OK to start a new game.');
        restart();
      }
    });

    $play.click(function () {
      play();
    });

    restart();
  });

  function restart() {
    clickedIndexes = [];
    chosenIndexes = pickDistinct(scale.length, 2);
  }

  function play() {
    var chosenTones = chosenIndexes.map(function (index) {
      return tones[index];
    });
    var mixed = mix(chosenTones);

    playAudio(mixed);
  }

  function playAll(allDone) {
    var index = 0;

    function playNext() {
      if (index < scale.length) {
        playAndHighlight(index, playNext);
        index++;
      } else {
        allDone && allDone();
      }
    }
    playNext();
  }

  function playAndHighlight(index, callback) {
    var $box = $('#boxes [data-index=' + index + ']');
    playAudio(tones[index], function () {
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

    tones = freqs.map(function (freq) {
      var tone = generateTone(freq, 0.8, 44100);
      return fadeInOut(tone, 1000, 1000);
    });

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


  function generateTone(freq, level, duration) {
    var tone = [];
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
      tone.push(level * val);
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
    var midDuration = arr.length - inDuration - outDuration;
    if (midDuration < 0) {
      throw new Error("Fades longer than array");
    }
    var envelope = generateRamp(inDuration).reverse();
    for (var i = 0; i < midDuration; i++) {
      envelope.push(1);
    }
    envelope = envelope.concat(generateRamp(outDuration));

    return multiply(arr, envelope);
  }

  function multiply(arr1, arr2, filler) {
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
})();
