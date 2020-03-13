const delay = ms => new Promise(res => setTimeout(res, ms));
var activeTimer = 0;
const secondsSet = [86400, 3600, 60, 1];

if (checkForSelectedNodes() == false) {
  if (checkForNodesThatBeginWithTimer() == false) {
    throw new Error("Type the time to start Timer");
  }
}

function checkForSelectedNodes() {
  const regex = new RegExp("[0-9]{1,2}(:[0-9]{1,2})*");
  const selectedNodes =  figma.currentPage.selection.filter(node => node.type == "TEXT" && regex.test(node.characters));

  if (selectedNodes.length > 0) {
      selectedNodes.forEach(start);
      return true;
  }
  return false;
}

function checkForNodesThatBeginWithTimer() {
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
  
  var seconds =  getRemainingSeconds(timeString);
  startTimer(node, seconds, startsWithTimer);
}

function getRemainingSeconds(timeString: string) {
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

function secondsToInterval(seconds: number) {
  var result = "";
  var secondsToGo = seconds;
  secondsSet.forEach( (element) => {
    var count = Math.floor(secondsToGo/element);
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



async function startTimer(node: TextNode, seconds: number, startsWithTimer: boolean) {
  await figma.loadFontAsync(node.fontName as FontName);
  activeTimer += 1;

  var secondsToGo = seconds;
  while(secondsToGo > 0) {
    var newText = secondsToInterval(secondsToGo);
    if (startsWithTimer) {
        newText = "Timer: " + newText;
    }
    node.characters = newText;
    await delay(1000);
    secondsToGo -= 1;
  }

  node.characters = "Done";
  activeTimer -= 1;
  if (activeTimer <= 0) {
    figma.closePlugin();
  }
}