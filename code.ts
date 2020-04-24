const delay = ms => new Promise(res => setTimeout(res, ms));
var activeTimer = 0;
const secondsSet = [86400, 3600, 60, 1];
const progressBar = figma.createRectangle();
var pause = 0;
var userSetSeconds = 0;

figma.showUI(__html__, { width: 100, height: 50 })

figma.ui.onmessage = msg => {
 
  if (msg.type === 'start') {
    pause = 0;
    console.log ("start message from UI");
    checkAndStart();
  }

  if (msg.type === 'pause') {
    console.log ("pause message from UI");

    if (pause > 0) {
      pause = 0;
      console.log ("unpause");
      checkAndStart();
    } else {
      pause = 1;
    }
  }

  // figma.closePlugin();
};

function checkAndStart()
{
  if (checkForSelectedNodes() == false) {

    console.log ("This is the first if-thing in Leos code");
  
    if (checkForNodesThatBeginWithTimer() == false) {
      throw new Error("Type the time to start Timer");
    }
  }
}

function checkForSelectedNodes() : boolean {

  console.log ("checkforSelectedNodes");

  const regex = new RegExp("[0-9]{1,2}(:[0-9]{1,2})*");
  const selectedNodes =  figma.currentPage.selection.filter(node => node.type == "TEXT" && regex.test(node.characters));
  selectedNodes.forEach(start);
  return selectedNodes.length > 0;
}

function checkForNodesThatBeginWithTimer() : boolean {

  console.log ("checkforNodesThatBeginWithTimer");

  const nodes = figma.currentPage.findAll(node => node.type === "TEXT" && node.characters.startsWith("Timer:"));
  nodes.forEach(start);
  return nodes.length > 0;
}

function start(node: TextNode) {

  console.log ("start function");

  var timeString = node.characters;
  var startsWithTimer = false;
  if (timeString.startsWith("Timer:")) {
      timeString = timeString.replace("Timer: ", "");
      startsWithTimer = true;
  }
  
  var seconds =  getRemainingSeconds(timeString);
  var template = getTeamplateFromString(timeString);

  startTimer(node, seconds, template, startsWithTimer);
}

function getRemainingSeconds(timeString: string) : number {

  console.log ("getRemainingSeconds");

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
function getTeamplateFromString(timeString: string) : string {

  console.log ("getTemplateFromString");

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
function fillUpTimeStringWithTempalte(timeString: string, template: string) : string {

  console.log ("fillUpTimeStringWithTemplate");

  const trimmedTemplate = template.substring(0, template.length - timeString.length) 
  return trimmedTemplate + timeString;
}

function secondsToInterval(seconds: number) : string {
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


function createProgressBar(){

  const nodes: SceneNode[] = [];

  progressBar.x = 150;
  progressBar.fills = [{type: 'SOLID', color: {r: 0, g: 0.9, b: 0.0}}];
  figma.currentPage.appendChild(progressBar);
  nodes.push(progressBar);
}

function runProgressBar(secondsToGo: number){
  //console.log(secondsToGo + " this is secondsToGo");

  if (secondsToGo > 0) {
    progressBar.resizeWithoutConstraints(secondsToGo, 50);
  } else {
    //this means the timer is done
  }

}


async function startTimer(node: TextNode, seconds: number, template: string, startsWithTimer: boolean) {
  await figma.loadFontAsync(node.fontName as FontName);
  activeTimer += 1;

  console.log("Timer started / became active");
  
  //Jannes is also working in a progress bar feature. To be finished later.
  //createProgressBar();

  var secondsToGo = seconds;
  
  


  while(secondsToGo > 0) {

    if (pause == 0){
      var newText = fillUpTimeStringWithTempalte(secondsToInterval(secondsToGo), template);
      if (startsWithTimer) {
          newText = "Timer: " + newText;
      }
      node.characters = newText;
      await delay(1000);
      secondsToGo -= 1;

      runProgressBar(secondsToGo);
    } else {
      secondsToGo = 0;
    }
  }

  if (pause == 0){
    node.characters = "Done";
    activeTimer -= 1;
  }

  console.log("Timer finsihed / became in-active");

  if (activeTimer <= 0) {
    figma.closePlugin();
  }
}