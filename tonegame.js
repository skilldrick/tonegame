(function () {
  var SAMPLE_RATE = 44100;
  var baseFreq = 220;
  var scale;
  var freqs;
  var tones;
  var chosenIndexes;
  var context = new webkitAudioContext();
  var timeouts = [];

  $(function () {
    var $playAll = $('<button>Play all</button>');
    var $stop = $('<button>Stop</button>').hide();
    var $play = $('<button>Play clue</button>');
    var $playGuess = $('<button>Test</button>');
    $('#controls').append($playAll);
    $('#controls').append($stop);
    $('#controls').append($play);
    $('#guess-controls').append($playGuess);

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
    });

    $play.click(function () {
      play();
    });

    $playGuess.click(function () {
      var guessedIndexes = $('#target .box').map(function () {
        return $(this).data('index');
      }).toArray();
      var guessedTones = guessedIndexes.map(function (index) {
        return tones[index];
      });
      console.log(guessedTones);

      var mixed = mix(guessedTones);

      playAudio(mixed);

      chosenIndexes.sort();
      guessedIndexes.sort();

      if (chosenIndexes.toString() == guessedIndexes.toString()) {
        alert('YOU WIN!!!\nClick OK to start a new game.');
        restart();
      }
    });

    restart();
  });

  function restart() {
    $('#target .box').click();
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
      $box = $('<span>').attr('class', 'box box-' + i).attr('data-index', i);
      hue = (360 / count) * i
      $box.css('background-color', "hsla(" + hue + ", 70%, 50%, 1)");
      $boxes.append($box);
      $box.attr('draggable', 'true');
      $box.on('dragstart', function (e) {
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        e.originalEvent.dataTransfer.setData('Text', $(this).attr('data-index'));
      });
    }

    $('#target').on('dragover', function (e) {
      e.preventDefault(); // allows us to drop
      $(this).addClass('over');
      e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    $('#target').on('dragleave', function (e) {
      $(this).removeClass('over');
    });

    $('#target').on('drop', function (e) {
      e.preventDefault();
      $(this).removeClass('over');
      var index = e.originalEvent.dataTransfer.getData('Text');
      var $el = $('#boxes .box[data-index=' + index + ']');
      var $newEl = $el.clone();
      $el.css('opacity', 0.3);
      $el.attr('draggable', 'false');

      $(this).append($newEl);
    });

    $('#target').on('click', '.box', function () {
      var index = $(this).attr('data-index');
      $(this).remove();
      var $el = $('#boxes .box[data-index=' + index + ']');
      $el.attr('draggable', 'true');
      $el.css('opacity', 1);
    });
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
})();
