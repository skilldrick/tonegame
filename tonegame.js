(function () {
  var levels = [
    { notes: 1, scale: [0, 4, 7, 12] },
    { notes: 2, scale: [0, 4, 7, 12] },
    { notes: 2, scale: [0, 1, 4, 5, 7, 8, 10, 12] },
    { notes: 3, scale: [0, 1, 4, 5, 7, 8, 10, 12] },
    { notes: 4, scale: [0, 1, 4, 5, 7, 8, 10, 12, 13, 16] }
  ];
  var level = 0;
  var score = 10;
  var scale;
  var chosenIndexes;

  $(setup);

  function setup() {
    setupButtons();
    updateScore(0);
    restart();
  }

  function restart() {
    level = Math.floor(score / 50);
    updateScore(0);
    if (level >= levels.length) {
      alert('WHOA. I *never* expected anyone to get that far.\nGo buy yourself an icecream or something.');
      document.location = document.location;
    }
    scale = levels[level].scale;
    audio.setupTones(scale);
    setupBoxes(scale.length);
    $('#target .box').click();
    var numberOfNotes = levels[level].notes;
    chosenIndexes = pickDistinct(scale.length, numberOfNotes);
  }

  function setupButtons() {
    var $playAll = $('#playAll');
    var $stop = $('#stop').hide();
    var $playClue = $('#playClue');
    var $playGuess = $('#playGuess');


    $playAll.click(function () {
      updateScore(-4);
      playAll(function () {
        $playAll.show();
        $stop.hide();
      });
      $stop.show();
      $playAll.hide();
    });

    $stop.click(function () {
      audio.stop();
      $('#boxes .box').css('outline-color', 'transparent');
      $playAll.show();
      $stop.hide();
    });

    $playClue.click(function () {
      audio.play(chosenIndexes);
    });

    $playGuess.click(function () {
      updateScore(-2);
      var guessedIndexes = $('#target .box').map(function () {
        return $(this).data('index');
      }).toArray();
      audio.playGuess(guessedIndexes);
      winning(guessedIndexes);
    });
  }

  function updateScore(by) {
    score += by;
    $('#score').text(score);
    $('#level').text(level);
  }

  function winning(guessedIndexes) {
    chosenIndexes.sort();
    guessedIndexes.sort();

    if (chosenIndexes.toString() == guessedIndexes.toString()) {
      updateScore(12);
      alert('W00t!!!\nClick OK continue.');
      restart();
    }
  }

  function setupBoxes(count) {
    $('#target').off();
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
      $box.click(function () {
        updateScore(-1);
        var index = $(this).data('index');
        playAndHighlight(index);
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
    audio.play(index, function () {
      $box.css('outline-color', 'yellow');
    }, function () {
      $box.css('outline-color', 'transparent');
      callback && callback();
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
})();
