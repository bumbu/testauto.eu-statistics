var answer
  , $template = $('[data-ui="answer"]')
  , $questions = $('[data-ui="questions"]')
  , locale = chrome.i18n.getMessage('@@ui_locale').split('_')[0]
  , totalQuestions = 700

// Check for locale in cache
if (localStorage['locale']) {
  locale = localStorage['locale']
}

// Check if locale is available
if (!~['en', 'ro', 'ru'].indexOf(locale)) {
  locale = 'ro'
}

$('[data-l10n]').each(function() {
  var $this = $(this)
  $this.html(chrome.i18n.getMessage($this.data('l10n')))
})

$('[data-l10n-title]').each(function() {
  var $this = $(this)
  $this.attr('title', chrome.i18n.getMessage($this.data('l10nTitle')))
})

function renderQuestionsAndStats() {
  var answerStatsGroups = {
      perfect: 0 // 95%
    , good: 0 // 75%
    , ok: 0 // 50%
    , bad: 0 // 0%
    }

  function addQuestionToStatistics(question) {
    var rate
    if (question.answeredTimes > 0) {
      rate = question.answeredRight / question.answeredTimes

      if (rate >= 0.95) {
        answerStatsGroups.perfect += 1
      } else if (rate >= 0.75) {
        answerStatsGroups.good += 1
      } else if (rate >= 0.5) {
        answerStatsGroups.ok += 1
      } else {
        answerStatsGroups.bad += 1
      }
    }
  }

  for (var key in localStorage) {
    if (key[0] != 'q') break; // Render only questions
    answer = JSON.parse(localStorage[key])

    $template
      .clone()
      .data('key', key)
      .find('[data-ui="title"]').html(getTitle(answer['text' + locale.toUpperCase()])).end()
      .find('[data-ui="togglable"]').toggle(answer.isOpen).end()
      .find('[data-ui="text"]').html(answer['text' + locale.toUpperCase()]).end()
      .find('[data-ui="answered-times"]').html(answer.answeredTimes).end()
      .find('[data-ui="answered-right"]').html(answer.answeredRight).end()
      .find('[data-ui="answeres-percentage"]').html(answer.answeredTimes ? 100 * answer.answeredRight / answer.answeredTimes + '%' : '').end()
      .find('[data-ui="right-answer"]').html(answer.rightAnswer).end()
      .appendTo($questions)

    addQuestionToStatistics(answer)
  }

  $('[data-ui="question-stats-perfect"]').css('width', (100 * answerStatsGroups.perfect / totalQuestions) + '%').children('[data-ui="value"]').text(answerStatsGroups.perfect)
  $('[data-ui="question-stats-good"]').css('width', (100 * answerStatsGroups.good / totalQuestions) + '%').children('[data-ui="value"]').text(answerStatsGroups.good)
  $('[data-ui="question-stats-ok"]').css('width', (100 * answerStatsGroups.ok / totalQuestions) + '%').children('[data-ui="value"]').text(answerStatsGroups.ok)
  $('[data-ui="question-stats-bad"]').css('width', (100 * answerStatsGroups.bad / totalQuestions) + '%').children('[data-ui="value"]').text(answerStatsGroups.bad)

  var testsPassed = localStorage['testsPassed'] || 0
    , testsFailed = localStorage['testsFailed'] || 0
    , totalTests = testsPassed + testsFailed
    , $testsStatsRow = $('[data-ui="tests-stats-row"]')

  if (totalTests > 0) {
    $testsStatsRow.show()

    $('[data-ui="tests-passed"]').css('width', (100 * testsPassed / totalTests) + '%').find('[data-ui="value"]').text(testsPassed)
    $('[data-ui="tests-failed"]').css('width', (100 * testsFailed / totalTests) + '%').find('[data-ui="value"]').text(testsFailed)
  } else {
    $testsStatsRow.hide()
  }
}

renderQuestionsAndStats()

$('[data-action="remove-all"]').on('click', function(ev){
  ev.preventDefault()

  for (var key in localStorage) {
    if (key[0] != 'q') break;
    localStorage.removeItem(key)
  }

  localStorage.setItem('testsPassed', 0)
  localStorage.setItem('testsFailed', 0)

  $questions.empty()

  // Rerender questions and stats
  renderQuestionsAndStats()
})

function getTitle(html) {
  var match = html.match(/\<b\>(.*?)\<\/b\>/)
  if (match) {
    return match[1]
  } else {
    return ''
  }
}

$('body').on('click', '[data-action="toggle"]', function(){
  var $this = $(this)
    , $togglable = $this.siblings('[data-ui="togglable"]')
    , willOpen = $togglable.is(':hidden')

  $togglable.slideToggle()

  var key = $this.closest('[data-ui="answer"]').data('key')

  var keyValue = JSON.parse(localStorage[key])
  keyValue.isOpen = willOpen

  localStorage.setItem(key, JSON.stringify(keyValue))
})

$('body').on('click', '[data-action="toggle-right-answer"]', function(){
  $(this).siblings('[data-ui="right-answer"]').toggle()
})

$('[data-action="select-language"] a').click(function(ev) {
  var newLocale = $(this).data('language')

  if (!localStorage['locale'] || newLocale != localStorage['locale']) {
    // Update local variable
    locale = newLocale
    // Persist in local storage
    localStorage['locale'] = locale

    // Rerender questions
    $questions.empty()
    renderQuestionsAndStats()
  }
})

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})
