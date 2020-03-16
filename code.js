var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    const selectedNodes = figma.currentPage.selection.filter(node => node.type == "TEXT" && regex.test(node.characters));
    selectedNodes.forEach(start);
    return selectedNodes.length > 0;
}
function checkForNodesThatBeginWithTimer() {
    const nodes = figma.currentPage.findAll(node => node.type === "TEXT" && node.characters.startsWith("Timer:"));
    nodes.forEach(start);
    return nodes.length > 0;
}
function start(node) {
    var timeString = node.characters;
    var startsWithTimer = false;
    if (timeString.startsWith("Timer:")) {
        timeString = timeString.replace("Timer: ", "");
        startsWithTimer = true;
    }
    var seconds = getRemainingSeconds(timeString);
    var template = getTeamplateFromString(timeString);
    startTimer(node, seconds, template, startsWithTimer);
}
function getRemainingSeconds(timeString) {
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
function getTeamplateFromString(timeString) {
    var result = "";
    for (const c of timeString) {
        if (c == ":") {
            result += c;
        }
        else {
            result += "0";
        }
    }
    return result;
}
/**
* Creates a new time string that conforms to the templates format
* e.g. 5:00 (timeString) and 00:00:00 (template) will return 00:05:00
*/
function fillUpTimeStringWithTempalte(timeString, template) {
    const trimmedTemplate = template.substring(0, template.length - timeString.length);
    return trimmedTemplate + timeString;
}
function secondsToInterval(seconds) {
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
    });
    return result;
}
function startTimer(node, seconds, template, startsWithTimer) {
    return __awaiter(this, void 0, void 0, function* () {
        yield figma.loadFontAsync(node.fontName);
        activeTimer += 1;
        var secondsToGo = seconds;
        while (secondsToGo > 0) {
            var newText = fillUpTimeStringWithTempalte(secondsToInterval(secondsToGo), template);
            if (startsWithTimer) {
                newText = "Timer: " + newText;
            }
            node.characters = newText;
            yield delay(1000);
            secondsToGo -= 1;
        }
        node.characters = "Done";
        activeTimer -= 1;
        if (activeTimer <= 0) {
            figma.closePlugin();
        }
    });
}
