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
    if (key[0] != 'q') continue; // Render only questions
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

  var totalAvailableAnswers = answerStatsGroups.perfect + answerStatsGroups.good + answerStatsGroups.ok + answerStatsGroups.bad
    , perfectAnswersPercentage = 100 * answerStatsGroups.perfect / totalQuestions
    , goodAnswersPercentage = 100 * answerStatsGroups.good / totalQuestions
    , okAnswersPercentage = 100 * answerStatsGroups.ok / totalQuestions
    , badAnswersPercentage = 100 * answerStatsGroups.bad / totalQuestions

  if (totalAvailableAnswers * 2 < totalQuestions) {
    if (perfectAnswersPercentage > 0) perfectAnswersPercentage = Math.max(2.5, perfectAnswersPercentage * 1.4)
    if (goodAnswersPercentage > 0) goodAnswersPercentage = Math.max(2.5, goodAnswersPercentage * 1.4)
    if (okAnswersPercentage > 0) okAnswersPercentage = Math.max(2.5, okAnswersPercentage * 1.4)
    if (badAnswersPercentage > 0) badAnswersPercentage = Math.max(2.5, badAnswersPercentage * 1.4)
  }

  $('[data-ui="question-stats-perfect"]').css('width', perfectAnswersPercentage + '%').children('[data-ui="value"]').text(answerStatsGroups.perfect)
  $('[data-ui="question-stats-good"]').css('width', goodAnswersPercentage + '%').children('[data-ui="value"]').text(answerStatsGroups.good)
  $('[data-ui="question-stats-ok"]').css('width', okAnswersPercentage + '%').children('[data-ui="value"]').text(answerStatsGroups.ok)
  $('[data-ui="question-stats-bad"]').css('width', badAnswersPercentage + '%').children('[data-ui="value"]').text(answerStatsGroups.bad)

  var testsPassed = parseInt(localStorage['testsPassed'] || 0)
    , testsFailed = parseInt(localStorage['testsFailed'] || 0)
    , totalTests = testsPassed + testsFailed
    , $testsStatsRow = $('[data-ui="tests-stats-row"]')

  if (totalTests > 0) {
    $testsStatsRow.show()

    $('[data-ui="tests-passed"]').css('width', (100 * testsPassed / totalTests) + '%').find('[data-ui="value"]').text(testsPassed)
    $('[data-ui="tests-failed"]').css('width', (100 * testsFailed / totalTests) + '%').find('[data-ui="value"]').text(testsFailed)
  } else {
    $testsStatsRow.hide()
  }

  $noStats = $('[data-ui="no-stats"]')

  if (totalAvailableAnswers > 0 && totalTests > 0) {
    $noStats.hide()
  } else {
    $noStats.show()
  }
}

renderQuestionsAndStats()

$('[data-action="remove-all"]').on('click', function(ev){
  ev.preventDefault()

  for (var key in localStorage) {
    if (key[0] != 'q') continue;
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

// Add analytics
;(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-34516109-3', 'auto');
ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
// ga('require', 'displayfeatures');
ga('send', 'pageview', '/options.html');
