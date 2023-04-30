"use strict";
const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;
var folcount = 0;
window.__TAURI__.event.listen("folder-count", (data) => {
    folcount = data.payload;
    console.log(folcount);
});
const pathInput = document.getElementById("path-input");
const listButton = document.getElementById("list-button");
const fileList = document.getElementById("file-list");
const htmlbase = document.getElementById("htmlbase");
const parentsize = document.getElementById("parent-size");
var menu = document.getElementById("menu");
var reload = document.getElementById("reload");
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
    const nosize = document.getElementById("no-size");
    nosize.addEventListener("click", () => {
        window.__TAURI__.invoke("nosize", {
            path: pathInput.value
        });
    });
    listButton.addEventListener("click", async () => {
        let path = pathInput.value;
        await window.__TAURI__.invoke("list_files", { path: path
        });
        pathInput.value = path;
    });
    reload.addEventListener("click", async () => {
        let path = pathInput.value;
        await window.__TAURI__.invoke("list_files", { path: path
        });
    });
    var loaded = 0;
    menu.addEventListener("click", function (e) {
        var id = e.target.id;
        switch (id) {
            case "o1":
                console.log("o1");
                console.log(e);
                break;
            case "o2":
                break;
            case "o3":
                break;
            default:
                break;
        }
        menu.style.display = "none";
    });
    document.addEventListener("click", function (e) {
        if (e.target.id !== "td1" && e.target.parentNode !== menu) {
            menu.style.display = "none";
        }
    });
    window.__TAURI__.event.listen("list-files", (data) => {
        let files = JSON.parse(data.payload);
        fileList.innerHTML = "";
        let thead = document.createElement("thead");
        let tr = document.createElement("tr");
        let th1 = document.createElement("th");
        let th2 = document.createElement("th");
        let th3 = document.createElement("th");
        th1.textContent = "Filename";
        th2.textContent = "Filesize";
        th3.textContent = "Last modified";
        th1.id = "filename";
        th2.id = "filesize";
        th3.id = "lastmod";
        tr.appendChild(th1);
        tr.appendChild(th2);
        tr.appendChild(th3);
        thead.appendChild(tr);
        fileList.appendChild(thead);
        let tbody = document.createElement("tbody");
        console.log(files.length);
        loaded = files.length;
        var percomp = (loaded / folcount * 100);
        var setp = document.getElementById("myprogress");
        setp.value = percomp;
        if (percomp == 100)
            setp.className = "hide";
        else
            setp.className = "show";
        console.log("here" + percomp.toString());
        for (let file of files) {
            let tr = document.createElement("tr");
            let td1 = document.createElement("td");
            td1.textContent = file.name;
            td1.id = "td1";
            td1.dataset.value = file.name;
            td1.dataset.name = file.name;
            td1.dataset.path = file.path;
            td1.dataset.isDir = file.is_dir.toString();
            if (file.is_dir) {
                td1.id = "folder";
                if (file.foldercon > 0) {
                    td1.textContent = file.name + " (" + file.foldercon + ")";
                }
                else {
                    td1.textContent = file.name;
                }
            }
            td1.dataset.size = file.size.toString();
            tr.appendChild(td1);
            td1.addEventListener("contextmenu", function (e) {
                e.preventDefault();
                menu.style.display = "block";
                menu.style.left = e.pageX + "px";
                menu.style.top = e.pageY + "px";
            });
            let td2 = document.createElement("td");
            td2.textContent = file.size.toString();
            td2.dataset.value = file.rawfs.toString();
            tr.appendChild(td2);
            let td3 = document.createElement("td");
            td3.textContent = file.lmdate.toString();
            td3.dataset.value = file.timestamp.toString();
            tr.appendChild(td3);
            tbody.appendChild(tr);
        }
        fileList.appendChild(tbody);
        let order = "asc";
        function compare(a, b) {
            if (order === "asc") {
                return a < b ? -1 : a > b ? 1 : 0;
            }
            else {
                return a > b ? -1 : a < b ? 1 : 0;
            }
        }
        function sortTable(index) {
            let rows = Array.from(tbody.rows);
            rows.sort(function (a, b) {
                if (index !== 1)
                    return compare(a.cells[index].dataset.value, b.cells[index].dataset.value);
                else
                    return compare(parseInt(a.cells[index].dataset.value), parseInt(b.cells[index].dataset.value));
            });
            for (let row of rows) {
                tbody.appendChild(row);
            }
            order = order === "asc" ? "desc" : "asc";
        }
        let filename = document.getElementById("filename");
        let filesize = document.getElementById("filesize");
        let lastmod = document.getElementById("lastmod");
        filename.addEventListener("click", function () {
            sortTable(0);
        });
        filesize.addEventListener("click", function () {
            sortTable(1);
        });
        lastmod.addEventListener("click", function () {
            sortTable(2);
        });
    });
    fileList.addEventListener("click", async (event) => {
        console.log("here");
        let target = event.target;
        console.log(target.tagName);
        if (target.tagName === "TD") {
            console.log(target.dataset);
            let name = target.dataset.name;
            let path = target.dataset.path;
            let isDir = target.dataset.isDir;
            if (isDir === "true") {
                console.log("dir");
                pathInput.value = path;
                parentsize.innerHTML = target.dataset.parentsize;
                window.__TAURI__.invoke("list_files", {
                    path: path
                });
            }
            else if (name.toLowerCase().endsWith(".md")) {
                openmarkdown(await window.__TAURI__.invoke("loadmarkdown", { name: path }));
            }
            else {
                openpath(path);
            }
        }
    });
    const datalist = document.getElementById("path-list");
    pathInput.addEventListener("input", async () => {
        console.log("here");
        const path = pathInput.value;
        console.log(path);
        await window.__TAURI__.invoke("get_path_options", {
            path: path,
        })
            .then((options) => {
            console.log(options);
            if (options !== null) {
                datalist.innerHTML = "";
                for (const option of options) {
                    const optionElement = document.createElement("option");
                    optionElement.value = option;
                    datalist.appendChild(optionElement);
                }
            }
        })
            .catch((error) => {
            console.error(error);
        });
    });
    window.__TAURI__.event.listen("load-markdown", (data) => {
        openmarkdown(data.payload);
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
        timer.className = "show";
        updatetimer();
    });
    window.__TAURI__.event.listen("stop-timer", (data) => {
        timer.className = "hide";
        clearInterval(interval);
    });
    document.addEventListener("keydown", function (e) {
        if (e.keyCode === 27) {
            menu.style.display = "none";
        }
    });
});
let timer = document.getElementById("timer");
timer.className = "hide";
function updatetimer() {
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
function notify() {
    var popup = document.getElementById("popup");
    popup.style.display = "block";
    setTimeout(function () {
        popup.style.display = "none";
    }, 5000);
}
function openmarkdown(htmlfrommd) {
    fileList.innerHTML = "";
    htmlbase.innerHTML = htmlfrommd;
    var links = document.getElementsByTagName("a");
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        link.setAttribute("target", "_blank");
    }
}
async function openpath(path) {
    window.__TAURI__.invoke("openpath", {
        path: path
    });
}
