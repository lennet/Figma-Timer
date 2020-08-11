const delay = ms => new Promise(res => setTimeout(res, ms));
var totalTimers = 0;
const secondsSet = [86400, 3600, 60, 1];
var pause = false;
var reset = false;
var userSetSeconds = 0;

const uiWindow = {
  minHeight: 60,
  maxHeight: 300,
  helptextHeight: 200,
  width: 220,
}

var timerUIHeight = 50;

if (figma.command === 'timer') {
	figma.showUI(__html__, { width: uiWindow.width, height: uiWindow.minHeight })
}

figma.showUI(__html__, { width: uiWindow.width, height: uiWindow.minHeight })

figma.ui.onmessage = msg => {

  switch (msg.type) {

    case 'start':
      pause = false;
      reset = false;
      checkAndStart();
      break;

    case 'pause':
      pause = true;
      break;

    case 'continue':
      pause = false;
      break;

    case 'reset':
      reset = true;
      pause = true;
      totalTimers = 0;
      figma.ui.resize(uiWindow.width, uiWindow.minHeight);
      break;

    case 'helpon':
      figma.ui.resize(uiWindow.width, uiWindow.helptextHeight);
      break;

    case 'helpoff':
      figma.ui.resize(uiWindow.width, uiWindow.minHeight);
      break;

    default:
      console.log("no code for msg.type: " + msg.type);
      break;

  }
};

function checkAndStart() {
  if (checkForSelectedNodes() == false) {
    if (checkForNodesThatBeginWithTimer() == false) {
      throw new Error("Type the time to start Timer");
    }
  }
}

function checkForSelectedNodes(): boolean {
  const regex = new RegExp("[0-9]{1,2}(:[0-9]{1,2})*");
  const selectedNodes = figma.currentPage.selection.filter(node => node.type == "TEXT" && regex.test(node.characters));
  selectedNodes.forEach(start);
  return selectedNodes.length > 0;
}

function checkForNodesThatBeginWithTimer(): boolean {
  const nodes = figma.currentPage.findAll(node => node.type === "TEXT" && node.characters.startsWith("Timer:"));
  nodes.forEach(start);
  return nodes.length > 0;
}

function start(node: TextNode) {
  var timeString = node.characters;
  var startsWithTimer = false;
  if (timeString.startsWith("Timer:")) {
    timeString = timeString.replace("Timer: ", "");
    startsWithTimer = true;
  }

  var seconds = getRemainingSeconds(timeString);
  var template = getTemplateFromString(timeString);

  startTimer(node, seconds, template, startsWithTimer);

  //set plugin relaunch data for easy launching/installing of plugin
  node.setRelaunchData({ timer: '' });

}

function getRemainingSeconds(timeString: string): number {
  var seconds = 0;
  var components = timeString.split(":");
  secondsSet.reverse();

  components.reverse().forEach((element, index) => {
    var factor = secondsSet[index];
    seconds += factor * Number(element);
  });

  secondsSet.reverse();

  return seconds;
}

/**
 * Generates a template string from a timeString
 * e.g. converts 5:00 into 0:00
 */
function getTemplateFromString(timeString: string): string {
  var result = "";
  for (const c of timeString) {
    if (c == ":") {
      result += c;
    } else {
      result += "0";
    }
  }
  return result;
}

/** 
* Creates a new time string that conforms to the templates format
* e.g. 5:00 (timeString) and 00:00:00 (template) will return 00:05:00
*/
function fillUpTimeStringWithTemplate(timeString: string, template: string): string {
  const trimmedTemplate = template.substring(0, template.length - timeString.length)
  return trimmedTemplate + timeString;
}

function secondsToInterval(seconds: number): string {
  var result = "";
  var secondsToGo = seconds;
  secondsSet.forEach((element) => {
    var count = Math.floor(secondsToGo / element);
    if (count > 0 || result.length > 0) {
      secondsToGo -= count * element;
      if (result.length > 0) {
        result += ":";
        if (count < 10) {
          result += "0";
        }
      }
      result += String(count);
    }
  })
  return result;
}


/** 
* Code that updates all timers on the Figma stage
* will also send updates / messages to UI.html, so we can show timers there
*/

async function startTimer(node: TextNode, seconds: number, template: string, startsWithTimer: boolean) {
  await figma.loadFontAsync(node.fontName as FontName);
  totalTimers += 1

  console.log("Timer started / became active");

  var timerID = totalTimers;
  var keepItRunning = true;
  var secondsToGo = seconds;
  var eventType = "start timer";
  var newText = "";

  adjustUIWindowHeight();
  postMessageToUIWindow (eventType, newText, timerID, secondsToGo, seconds);

  // this loop updates all timers every second
  while (keepItRunning) {
    // checking if reset was clicked by user and if so resetting all timers
    if (reset) {
      newText = fillUpTimeStringWithTemplate(secondsToInterval(seconds), template);
      keepItRunning = false;
      updateTimerText(startsWithTimer, newText, node);
    } else if (!pause) {
      if (secondsToGo > 0) {
        newText = fillUpTimeStringWithTemplate(secondsToInterval(secondsToGo), template);
        eventType = "counting";
      } else {
        newText = "Done"
        eventType = "timer done";
      }
      postMessageToUIWindow(eventType, newText, timerID, secondsToGo, seconds);
      updateTimerText(startsWithTimer, newText, node);
      secondsToGo -= 1;
    }
    await delay(1000);
  }
  console.log("Timer finished / became in-active");
}

function postMessageToUIWindow(eventType: string, timerText: string, timerID: number, secondsToGo: number, secondsToStart: number) {
  figma.ui.postMessage([eventType, timerText, timerID, secondsToGo, secondsToStart]);
}

function updateTimerText(startsWithTimer: boolean, newText: string, node: TextNode) {
  if (startsWithTimer) {
    newText = "Timer: " + newText;
  }
  node.characters = newText;
}

// adjusting height of UI windows depending on amount of timers
function adjustUIWindowHeight() {
  var newUIHeight = 100 + totalTimers * 50;
  if (newUIHeight > uiWindow.maxHeight) {
    newUIHeight = uiWindow.maxHeight;
  }
  figma.ui.resize(uiWindow.width, newUIHeight);
}