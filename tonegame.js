(function () {
  var levels = [
    { notes: 1, scale: [0, 4, 7, 12] },
    { notes: 2, scale: [0, 3, 6, 8, 12] },
    { notes: 2, scale: [0, 2, 4, 7, 11, 12, 14] },
    { notes: 3, scale: [0, 1, 4, 5, 7, 8, 10, 12] },
    { notes: 4, scale: [0, 2, 4, 5, 7, 9, 11, 12, 14] }
  ];
  var level = 0;
  var score = 10;
  var scale;
  var chosenIndexes;
  var numberOfNotes = 15;
  var exploring = true; //don't keep score to start with

  $(setup);

  //one-time setup
  function setup() {
    updateScore(0);
    setupHandlers();
    restart();
  }

  function setupHandlers() {
    $('#clue .boxes').click(function () {
      playClue();
    });

    $('#target .boxes').on('dragover', function (e) {
      e.preventDefault(); // allows us to drop
      $(this).addClass('over');
      e.originalEvent.dataTransfer.dropEffect = 'move';
    });

    $('#target .boxes').on('dragleave', function (e) {
      $(this).removeClass('over');
    });

    $('#target .boxes').on('drop', function (e) {
      e.preventDefault();
      $(this).removeClass('over');
      var index = e.originalEvent.dataTransfer.getData('Text');
      var $el = $('#scale .boxes .box[data-index=' + index + ']');
      var $newEl = $el.clone();
      $el.addClass('fade');
      $el.attr('draggable', 'false');

      $(this).append($newEl);

      var numberOfBoxes = $('#target .boxes .box').length;
      // if the player has chosen enough notes, test them
      if (numberOfBoxes == chosenIndexes.length) {
        playGuess();
      //if there are too many notes, remove the first and test
      } else if (numberOfBoxes > chosenIndexes.length) {
        $('#target .boxes .box:first-child').click(); //click to remove
        playGuess();
      }
    });

    $('#target .boxes').on('click', '.box', function () {
      var index = $(this).attr('data-index');
      $(this).remove();
      var $el = $('#scale .boxes .box[data-index=' + index + ']');
      $el.attr('draggable', 'true');
      $el.removeClass('fade');
    });
  }

  //Give console access to restart
  window.restart = restart;

  //run this for each new clue
  function restart(override) {
    level = Math.floor(score / 50); //Increase level every 50 points
    level = Math.max(0, level); //Keep level positive
    level = Math.min(level, levels.length - 1); //Cap level at top
    if (override) {
      level = override;
    }
    updateScore(0);
    scale = levels[level].scale;
    audio.setupTones(scale);
    var numberOfNotes = levels[level].notes;
    chosenIndexes = pickDistinct(scale.length, numberOfNotes, chosenIndexes);
    setupScaleBoxes();
    setupClueBoxes();
    $('#target .boxes .box').click(); //click to remove
    var boxWidth = $('#scale .boxes .box').width();
    $('#target .boxes').width(numberOfNotes * (boxWidth + 10));
  }

  function updateScore(by) {
    if (!exploring) {
      score += by;
    }
    $('#score').text(score);
    $('#level').text(level);
  }

  function playClue() {
    audio.play(chosenIndexes, function () {
      $('#clue').addClass('playing');
    }, function () {
      $('#clue').removeClass('playing');
    });
  }

  function playGuess() {
    exploring = false; //As soon as there is a guess, start keeping score
    var guessedIndexes = $('#target .box').map(function () {
      return $(this).data('scale-index');
    }).toArray();
    if (guessedIndexes.length) {
      audio.play(guessedIndexes, function () {
        $('#target').addClass('playing');
      }, function () {
        $('#target').removeClass('playing');
        updateScore(-2);
        winning(guessedIndexes);
      });
    }
  }

  function winning(guessedIndexes) {
    if (sameArray(chosenIndexes, guessedIndexes)) {
      updateScore((level * 2) + 12);
      $('#cross').hide();
      $('#tick').fadeIn(200).delay(1000).fadeOut(1000);
      restart();
    } else {
      $('#tick').hide();
      $('#cross').fadeIn(200).delay(1000).fadeOut(1000);
    }
  }

  function setupScaleBoxes() {
    var $boxes = $('#scale .boxes').empty();
    var $box;
    var hue;
    var saturation;
    var octave;
    for (var i = 0; i < numberOfNotes; i++) {
      $box = $('<span>').attr('class', 'box box-' + i);
      $box.attr('data-index', i);
      hue = (360 / 12) * i
      octave = Math.floor(i / 12);
      saturation = (octave === 0) ? 80 : 60;
      $box.css('background-color', "hsla(" + hue + ", " + saturation + "%, 50%, 1)");
      $boxes.append($box);
      if (scale.indexOf(i) > -1) { //this is a note
        $box.attr('data-scale-index', scale.indexOf(i));
        $box.addClass('in-scale');
        $box.attr('draggable', 'true');
        $box.on('dragstart', function (e) {
          e.originalEvent.dataTransfer.effectAllowed = 'move';
          e.originalEvent.dataTransfer.setData('Text', $(this).attr('data-index'));
        });
        $box.click(function () {
          updateScore(-1);
          var scaleIndex = $(this).data('scale-index');
          playAndHighlight(scaleIndex);
        });
      }
    }
  }

  function setupClueBoxes() {
    $('#clue .boxes').empty();

    for (var i = 0; i < chosenIndexes.length; i++) {
      $('#clue .boxes').append('<div class="box"><p class="question-mark">?</p></div>');
    }
  }

  function playAndHighlight(index, callback) {
    var $box = $('#scale .boxes [data-scale-index=' + index + ']');
    audio.play(index, function () {
      $box.addClass('playing');
    }, function () {
      $box.removeClass('playing');
      callback && callback();
    });
  }

  function sameArray(arr1, arr2) {
    if (!(arr1 && arr2)) { // check both arrays are defined
      return false;
    }
    arr1 = arr1.slice().sort();
    arr2 = arr2.slice().sort();
    //Will work as long as arr1 and arr2 are arrays of integers
    return arr1.toString() == arr2.toString();
  }

  function pickDistinct(max, count, previousChoices) {
    var choices = [];
    var choice;
    while (true) {
      choice = Math.floor(Math.random() * max);
      if (choices.indexOf(choice) == -1) {
        choices.push(choice);
      }
      if (choices.length === count) {
        if (sameArray(choices, previousChoices)) {
          choices = [];
        } else {
          return choices;
        }
      }
    }
  }
})();
