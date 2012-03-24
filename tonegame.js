(function () {
  var scale;
  var chosenIndexes;

  $(setup);

  function setup() {
    scale = [0, 1, 4, 5, 7, 8, 10, 12, 13];
    audio.setupTones(scale);
    setupBoxes(scale.length);
    setupButtons();
    restart();
  }

  function setupButtons() {
    var $playAll = $('#playAll');
    var $stop = $('#stop').hide();
    var $playClue = $('#playClue');
    var $playGuess = $('#playGuess');


    $playAll.click(function () {
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
      var guessedIndexes = $('#target .box').map(function () {
        return $(this).data('index');
      }).toArray();
      audio.playGuess(guessedIndexes);
      winning(guessedIndexes);
    });
  }

  function winning(guessedIndexes) {
    chosenIndexes.sort();
    guessedIndexes.sort();

    if (chosenIndexes.toString() == guessedIndexes.toString()) {
      alert('YOU WIN!!!\nClick OK to start a new game.');
      restart();
    }
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
      $box.click(function () {
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

  function restart() {
    $('#target .box').click();
    chosenIndexes = pickDistinct(scale.length, 2);
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
