// Java’s String.hashCode()
// Returns a 10 digit string representing 32bit integer hash for a string
function hashCode(str) {
  var hash = 0
    , character
  if (!str || str.length == 0) return hash;

  for (var i = 0; i < str.length; i++) {
    character = str.charCodeAt(i)
    hash = (hash << 5) - hash + character
    hash = hash & hash // Convert to 32bit integer
  }
  return 'q' + ('00000000000' + (hash >>> 0)).substr(-10) // Make is always positive, length 10
}

function clone(obj) {
  var objClone = {}
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      objClone[key] = obj[key]
    }
  }

  return objClone
}

// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.indexOf('http://testauto.eu') == 0 || tab.url.indexOf('https://testauto.eu') == 0) {
  // Show the page action.
  chrome.pageAction.show(tabId);
  }
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);

// Listen for messages from injected scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action && request.action == 'store-answers') {
      // Check if test passed
      checkIfTestPassed(request.data)

      // Store answers
      request.data.map(function(response) {
        addResponseToStorage(response)
      })

      chrome.extension.sendRequest({action: 'options-updated'})
    }
    sendResponse();
  });

function checkIfTestPassed(list) {
  var rightAnswers = list.reduce(function(prev, response){
    return prev + (response.answer == response.rightAnswer ? 1 : 0)
  }, 0)

  if (rightAnswers >= 17) {
    // Test passed
    localStorage.setItem('testsPassed', 1 + parseInt(localStorage['testsPassed'] || 0 ))
  } else {
    // Test failed
    localStorage.setItem('testsFailed', 1 + parseInt(localStorage['testsFailed'] || 0 ))
  }
}

function addResponseToStorage(response) {
  var hash = hashCode(response.textRO)
    , storedValue = null

  if (localStorage.getItem(hash)) {
    // update
    storedValue = JSON.parse(localStorage.getItem(hash))
    storedValue.rightAnswer = response.rightAnswer // Update right answer in case it got updated on server
  } else {
    // new
    storedValue = clone(response)
    delete storedValue.answer
    storedValue.answeredTimes = 0
    storedValue.answeredRight = 0
  }

  if (response.answer) {
    storedValue.answeredTimes += 1
    if (response.answer == storedValue.rightAnswer) {
      storedValue.answeredRight += 1
    }
  }

  // By default questions are closed
  storedValue.isOpen = false

  localStorage.setItem(hash, JSON.stringify(storedValue))
}

/*
  hash:
    textRO
    textRU
    textEN
    rightAnswer
    answeredTimes
    answeredRight
    isOpen
 */

// Called when the user clicks on the browser action icon.
chrome.pageAction.onClicked.addListener(function(tab) {
  openOrFocusOptionsPage()
})

function openOrFocusOptionsPage() {
  var optionsUrl = chrome.extension.getURL('src/options/index.html')

  chrome.tabs.query({}, function(extensionTabs) {
    var found = false;
    for (var i=0; i < extensionTabs.length; i++) {
      if (optionsUrl == extensionTabs[i].url) {
        found = true;
        chrome.tabs.update(extensionTabs[i].id, {"selected": true});
      }
    }
    if (found == false) {
      chrome.tabs.create({url: "src/options/index.html"});
    }
  });
}
