var workingDocument = null
var workingWindow = null
if (document.getElementById('PopupFrame')) {
  workingDocument = document.getElementById('PopupFrame').contentDocument
  workingWindow = document.getElementById('PopupFrame').contentWindow
} else {
  workingDocument = document
  workingWindow = window
}

if (workingDocument) {
  jQuery(workingWindow).load(function(){

  // Recache document and window
  // It seems if we insert scripts in initial iframe - they get ignored
  if (document.getElementById('PopupFrame')) {
    workingDocument = document.getElementById('PopupFrame').contentDocument
    workingWindow = document.getElementById('PopupFrame').contentWindow
  } else {
    workingDocument = document
    workingWindow = window
  }

  setTimeout(function(){// start timeout
    var communicationScript = workingDocument.createElement("script")
    communicationScript.innerHTML = "jQuery('#ExamenResults').submit(function(ev){ev.preventDefault();console.log('poop', ev);window.postMessage({action: 'form-submited'}, '*');});"
    workingDocument.body.appendChild(communicationScript);

    var communicationScript2 = workingDocument.createElement("script")
    communicationScript2.innerHTML = "window.addEventListener('message', function(event) {if(event.data.action == 'get-problems') {window.postMessage({action: 'problems', data: problems}, '*')}});"
    workingDocument.body.appendChild(communicationScript2);

    var problemRightAnswers = []
    workingWindow.postMessage({action: 'get-problems'}, '*')

    function preProcessHtml(html) {
      // Add full path to image
      html = html.replace('/updocs/ut_problems', 'http://testauto.eu/updocs/ut_problems')

      // Remove question number
      html = html.replace(/\<b style=\".*underline\;\"\>.*\<\/b\>/, '')

      // Remove styles and IDs
      html = html.replace(/style=\".*?\"/g, '').replace(/id=\".*?\"/g, '')

      // Replace preceeding new lines
      html = html.replace(/(?:\<td(.*?)\>[^\<]*(\<br\>)+)/g, '<td$1>')

      return html
    }

    workingWindow.addEventListener("message", function(event) {
      var $form = jQuery('#ExamenResults', workingDocument)

      if (event.data.action == 'form-submited') {
        console.log('Form submited')

        var answers = []
          , input

        for (var i = 0; i < 20; i++) {
          input = $form.children('[name="ExamenAnswer_' + i + '"]')

          answers[i] = {
            answer: +input.val() || null
          , rightAnswer: problemRightAnswers[i] || 0
          , textRO: preProcessHtml(jQuery('#ProblemTableRom' + i, workingDocument).clone().children().last().remove().end().html())
          , textRU: preProcessHtml(jQuery('#ProblemTableRus' + i, workingDocument).clone().children().last().remove().end().html())
          , textEN: preProcessHtml(jQuery('#ProblemTableEng' + i, workingDocument).clone().children().last().remove().end().html())
          }
        }

        chrome.extension.sendMessage({action: 'store-answers', data: answers}, function(response) {
          $form.submit()
        });

        // Should wait for background response for no more than 3 seconds
        setTimeout(function() {
          $form.submit()
        }, 3000)

      // Right answers
      } else if (event.data.action == 'problems') {
        for (var i = 0; i < event.data.data.length; i++) {
          problemRightAnswers[i] = event.data.data[i].Answer
        }
      }
    }, false)
  }, 1000) // end timeout
  })
}
