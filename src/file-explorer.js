"use strict";
const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;
var interval;
window.addEventListener("DOMContentLoaded", () => {
    window.__TAURI__.invoke("list_files", { path: "/home/roger/Downloads/github/"
    });
    const backButton = document.getElementById("back-button");
    var lastfolder = "/home/roger/Downloads/github/";
    backButton.addEventListener("click", () => {
        if (lastfolder === "")
            lastfolder = ".";
        pathInput.value = lastfolder;
        htmlbase.innerHTML = "";
        window.__TAURI__.invoke("list_files", { path: lastfolder
        });
    });
    const pathInput = document.getElementById("path-input");
    const listButton = document.getElementById("list-button");
    const fileList = document.getElementById("file-list");
    const htmlbase = document.getElementById("htmlbase");
    const parentsize = document.getElementById("parent-size");
    listButton.addEventListener("click", async () => {
        let path = pathInput.value;
        await window.__TAURI__.invoke("list_files", { path: path
        });
        pathInput.value = path;
    });
    fileList.addEventListener("click", async (event) => {
        let target = event.target;
        parentsize.innerHTML = target.dataset.parentsize;
        if (target.tagName === "LI") {
            let name = target.dataset.name;
            let path = target.dataset.path;
            let isDir = target.dataset.isDir;
            if (isDir === "true") {
                pathInput.value = path;
                window.__TAURI__.invoke("list_files", {
                    path: path
                });
            }
            else {
                let mdext = ".md";
                console.log(target.dataset.name);
                console.log(target.dataset.parent);
                if (name.includes(mdext)) {
                    fileList.innerHTML = "";
                    htmlbase.innerHTML = await window.__TAURI__.invoke("loadmarkdown", { name: path });
                    var links = document.getElementsByTagName("a");
                    for (var i = 0; i < links.length; i++) {
                        var link = links[i];
                        link.setAttribute("target", "_blank");
                    }
                }
            }
        }
    });
    const datalist = document.getElementById("path-list");
    pathInput.addEventListener("input", () => {
        console.log("here");
        const path = pathInput.value;
        console.log(path);
        window.__TAURI__.invoke({
            cmd: "get_path_options",
            path: path,
        });
    });
    window.__TAURI__.event.listen("list-files", (data) => {
        console.log(data.payload);
        let files = JSON.parse(data.payload);
        fileList.innerHTML = "";
        for (let file of files) {
            let li = document.createElement("li");
            li.textContent = file.name + " " + file.size;
            li.dataset.name = file.name;
            li.dataset.path = file.path;
            li.dataset.isDir = file.is_dir.toString();
            if (file.is_dir) {
                li.id = "folder";
            }
            li.dataset.size = file.size.toString();
            fileList.appendChild(li);
        }
    });
    window.__TAURI__.event.listen("folder-size", (data) => {
        parentsize.innerHTML = data.payload.toString();
        console.log(data.payload.toString());
    });
    window.__TAURI__.event.listen("grandparent-loc", (data) => {
        lastfolder = data.payload.toString();
        console.log(data.payload.toString());
    });
    window.__TAURI__.event.listen("parent-loc", (data) => {
        pathInput.value = data.payload.toString();
        console.log(data.payload.toString());
    });
    window.__TAURI__.event.listen("start-timer", (data) => {
        updatetimer();
    });
    window.__TAURI__.event.listen("stop-timer", (data) => {
        clearInterval(interval);
    });
    window.__TAURI__.event.listen("pop-datalist", (data) => {
        datalist.innerHTML = "";
        for (const option of data.payload) {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            datalist.appendChild(optionElement);
        }
    });
});
function updatetimer() {
    let timer = document.getElementById("timer");
    let startTime = new Date();
    interval = setInterval(function () {
        let currentTime = new Date();
        let elapsedTime = currentTime.getTime() - startTime.getTime();
        let minutes = Math.floor(elapsedTime / 1000 / 60);
        let seconds = Math.floor((elapsedTime / 1000) % 60);
        let paddedMinutes = minutes < 10 ? "0" + minutes : minutes.toString();
        let paddedSeconds = seconds < 10 ? "0" + seconds : seconds.toString();
        timer.textContent = paddedMinutes + ":" + paddedSeconds;
    }, 1000);
}
