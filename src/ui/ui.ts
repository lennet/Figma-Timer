import {
  UIActionTypes,
  UIAction,
  WorkerActionTypes,
  WorkerAction,
} from "../types";

import "./ui.css";
import { start } from "repl";

const progressBar = {
  width: 200,
  height: 10,
  margin: 5,
};

function createTimerUIElements(timerID: string) {
  // create spacing between timers
  const spacing = document.createElement("div");
  const timers = document.getElementById("timers")!;
  //spacing.lineHeight = 3;
  spacing.textContent = "---";
  spacing.style.color = "white";
  timers.appendChild(spacing);

  // create a timer text e.g. Timer: 3:34
  const timerTextElement = document.createElement("div");
  timerTextElement.style.fontSize = "11";

  timerTextElement.style.color = "black";
  timerTextElement.style.textAlign = "left";
  timerTextElement.style.fontWeight = "200";
  timers.appendChild(timerTextElement);
  timerTextElement.id = timerID;

  // create a timer progress bar
  const mySVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const progressBarFront = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  const progressBarBack = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  progressBarFront.id = "progress" + timerID;
  mySVG.id = "svg" + timerID;

  mySVG.setAttribute("width", String(progressBar.width));
  mySVG.setAttribute("height", String(progressBar.height + 20));

  progressBarFront.setAttribute("y", String(progressBar.margin));
  progressBarFront.setAttribute("width", String(progressBar.width));
  progressBarFront.setAttribute("height", String(progressBar.height));
  progressBarFront.setAttribute("fill", "#009FC2");

  progressBarBack.setAttribute("y", String(progressBar.margin));
  progressBarBack.setAttribute("width", String(progressBar.width));
  progressBarBack.setAttribute("height", String(progressBar.height));
  progressBarBack.setAttribute("fill", "#E4E4E4");

  mySVG.appendChild(progressBarBack);
  mySVG.appendChild(progressBarFront);
  timers.appendChild(mySVG);
}

function updateTimer(
  timerID: string,
  timerText: string,
  newWidth: string
): void {
  const progressBarUpdate = document.getElementById("progress" + timerID)!;
  progressBarUpdate.setAttribute("width", newWidth);
  document.getElementById(timerID)!.textContent =
    "Timer " + timerID + ": " + timerText;
}

// Sends a message to the plugin worker
function postMessage({ type, payload }: UIAction): void {
  parent.postMessage({ pluginMessage: { type, payload } }, "*");
}

// Listen to messages received from the plugin worker (src/plugin/plugin.ts)
function listenToPluginMessages(): void {
  window.onmessage = function (event: MessageEvent): void {
    const eventType = event.data.pluginMessage[0];
    const timerText = event.data.pluginMessage[1];
    const timerID = event.data.pluginMessage[2];
    const secondsToGo = event.data.pluginMessage[3];
    const secondsToStart = event.data.pluginMessage[4];

    switch (eventType) {
      case "start timer":
        document.getElementById("timers-container")!.hidden = false;
        createTimerUIElements(timerID);
        break;

      case "counting":
        const newProgressBarWidth =
          (progressBar.width * secondsToGo) / secondsToStart;
        updateTimer(timerID, timerText, String(newProgressBarWidth));
        break;

      case "timer done":
        updateTimer(timerID, timerText, "0");
        break;
    }
  };
}

function startButtonClicked(button: HTMLElement): void {
  const currentButtonState = button.textContent;

  switch (currentButtonState) {
    case "Start":
      parent.postMessage({ pluginMessage: { type: "start" } }, "*");
      button.textContent = "Pause";
      break;

    case "Pause":
      parent.postMessage({ pluginMessage: { type: "pause" } }, "*");
      button.textContent = "Continue";
      break;

    case "Continue":
      parent.postMessage({ pluginMessage: { type: "continue" } }, "*");
      button.textContent = "Pause";
      break;

    default:
      console.log("button pressed, but event was not coded for");
  }
}

// Attach event listeners (for this specific demo)
function buttonListeners(): void {
  document.addEventListener("click", function (event: MouseEvent) {
    const target = event.target as HTMLElement;

    switch (target.id) {
      case "start":
        startButtonClicked(target);
        break;
      case "reset":
        parent.postMessage({ pluginMessage: { type: "reset" } }, "*");
        target.textContent = "Start";
        const timersHTMLelement = document.getElementById("timers")!;
        timersHTMLelement.innerHTML = "";
        break;
      case "help":
        const helpTextElement = document.getElementById("helptext")!;
        if (helpTextElement.hidden == true) {
          parent.postMessage({ pluginMessage: { type: "helpon" } }, "*");
        } else {
          parent.postMessage({ pluginMessage: { type: "helpoff" } }, "*");
        }
        helpTextElement.hidden = !helpTextElement.hidden;
        break;
    }
  });
}

// Initialize all the things
listenToPluginMessages();
buttonListeners();
