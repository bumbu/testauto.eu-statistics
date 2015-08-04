var answer
  , $template = $('[data-ui="answer"]')
  , $questions = $('#questions')
  , locale = chrome.i18n.getMessage('@@ui_locale').split('_')[0]

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

function renderQuestions() {
  for (var key in localStorage) {
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
  }
}

renderQuestions()

$('[data-action="remove-all"]').on('click', function(ev){
  ev.preventDefault()

  for (var key in localStorage) {
    localStorage.removeItem(key)
  }

  $questions.empty()
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
    renderQuestions()
  }
})
