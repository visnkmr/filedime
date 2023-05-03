"use strict";
const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;
var folcount = 0;
const pathInput = document.getElementById("path-input");
const listButton = document.getElementById("list-button");
const fileList = document.getElementById("file-list");
const tablist = document.getElementById("tabs-list");
const marklist = document.getElementsByClassName("markslist")[0];
const htmlbase = document.getElementById("htmlbase");
const pathline = document.getElementById("path");
const parentsize = document.getElementById("parent-size");
const menu = document.getElementById("menu");
const reload = document.getElementById("reload");
const newtab = document.getElementById("newtab");
const backButton = document.getElementById("back-button");
const nosize = document.getElementById("no-size");
var bname = document.querySelector(".tab-name");
var bclose = document.querySelector(".tab-close");
var thistory = [];
var tforward = [];
var frompath = "";
var lastfolder = "/home/roger/.cargo/registry/src/github.com-1ecc6299db9ec823/";
var loaded = 0;
window.__TAURI__.event.listen("list-files", (data) => {
    htmlbase.innerHTML = "";
    console.log("listfiles");
    pathline.replaceChildren();
    var arr = pathInput.value.split("/");
    var prefixes = [];
    var prefix = "";
    for (var i = 0; i < arr.length; i++) {
        prefix += arr[i];
        prefixes.push(prefix);
        prefix += "/";
    }
    var fols = [];
    console.log(pathInput.value.split("/"));
    fols = pathInput.value.split("/");
    console.log(fols.length);
    for (var i = 0; i < fols.length; i++) {
        let pathn = document.createElement("span");
        pathn.id = "goloc";
        pathn.textContent = fols[i] + "\n";
        pathn.dataset.loc = prefixes[i];
        pathline?.appendChild(pathn);
    }
    let files = JSON.parse(data.payload);
    fileList.innerHTML = "";
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    let th1 = document.createElement("th");
    let th2 = document.createElement("th");
    let th3 = document.createElement("th");
    let th4 = document.createElement("th");
    th1.textContent = "Filename";
    th2.textContent = "Filesize";
    th3.textContent = "Last modified";
    th4.textContent = "File type";
    th1.id = "filename";
    th2.id = "filesize";
    th3.id = "lastmod";
    th4.id = "ftype";
    tr.appendChild(th1);
    tr.appendChild(th4);
    tr.appendChild(th2);
    tr.appendChild(th3);
    thead.appendChild(tr);
    fileList.appendChild(thead);
    let tbody = document.createElement("tbody");
    loaded = files.length;
    var percomp = (loaded / folcount * 100);
    var setp = document.getElementById("myprogress");
    setp.value = percomp;
    if (percomp == 100)
        setp.className = "hide";
    else
        setp.className = "show";
    for (let file of files) {
        let tr = document.createElement("tr");
        let td1 = document.createElement("td");
        td1.textContent = file.name;
        td1.className = "td1";
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
        let td4 = document.createElement("td");
        td4.textContent = file.ftype;
        td4.dataset.value = file.ftype;
        tr.appendChild(td4);
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
            if (index !== 2)
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
    let ftype = document.getElementById("ftype");
    filename.addEventListener("click", function () {
        sortTable(0);
    });
    filesize.addEventListener("click", function () {
        sortTable(2);
    });
    lastmod.addEventListener("click", function () {
        sortTable(3);
    });
    ftype.addEventListener("click", function () {
        sortTable(1);
    });
});
window.__TAURI__.event.listen("folder-size", (data) => {
    console.log("foldersize");
    parentsize.innerHTML = data.payload.toString();
});
window.__TAURI__.event.listen("grandparent-loc", (data) => {
    console.log("grandloc");
    lastfolder = data.payload.toString();
});
window.__TAURI__.event.listen("parent-loc", (data) => {
    console.log("--------------parentloc---" + data.payload);
    pathInput.value = data.payload.toString();
});
window.__TAURI__.event.listen("start-timer", (data) => {
    timer.className = "show";
    updatetimer();
});
window.__TAURI__.event.listen("stop-timer", (data) => {
    timer.className = "hide";
    clearInterval(interval);
});
var tid = 0;
var interval;
window.addEventListener("DOMContentLoaded", () => {
    console.log("hui");
    window.__TAURI__.invoke("list_files", {
        oid: tid.toString(),
        path: "/home/roger/.cargo/registry/src/github.com-1ecc6299db9ec823/",
        ff: ""
    });
    nosize.addEventListener("click", () => {
        window.__TAURI__.invoke("nosize", {
            id: tid.toString(),
            path: pathInput.value
        });
    });
    listButton.addEventListener("click", async () => {
        let path = pathInput.value;
        await window.__TAURI__.invoke("list_files", {
            oid: tid.toString(),
            path: path,
            ff: ""
        });
        pathInput.value = path;
    });
    newtab.addEventListener("click", async () => {
        tid = tid + 1;
        await window.__TAURI__.invoke("newtab", {
            oid: tid.toString(),
            path: "/home/roger/Downloads/",
            ff: ""
        });
        await window.__TAURI__.invoke("load_tab", {
            oid: tid.toString()
        });
    });
    document.addEventListener("contextmenu", function (e) {
        if (e.target.className == "td1") {
            e.preventDefault();
            frompath = e.target.dataset.path;
            menu.replaceChildren();
            let o1 = document.createElement("li");
            o1.id = "o1";
            o1.textContent = "Open in new tab";
            menu.appendChild(o1);
            let o2 = document.createElement("li");
            o2.id = "o2";
            o2.textContent = "Copy";
            menu.appendChild(o2);
            let o3 = document.createElement("li");
            o3.id = "o3";
            o3.textContent = "paste";
            menu.appendChild(o3);
            let o4 = document.createElement("li");
            o4.id = "o4";
            o4.textContent = "add bookmark";
            menu.appendChild(o4);
            menu.style.display = "block";
            menu.style.left = e.pageX + "px";
            menu.style.top = e.pageY + "px";
        }
    });
    document.addEventListener("click", function (e) {
        if (e.target.id !== "td1" &&
            e.target.parentNode !== menu) {
            menu.style.display = "none";
        }
        if ((e.target.parentNode).parentNode === tablist) {
            tid = e.target.parentNode.id;
            var pen = e.target;
            if (pen.className === "tab-name") {
                e.stopPropagation();
                window.__TAURI__.invoke("load_tab", {
                    oid: tid.toString()
                });
            }
            else if (pen.className === "tab-close") {
                e.stopPropagation();
                window.__TAURI__.invoke("closetab", {
                    id: tid.toString()
                });
            }
        }
        if (e.target.parentNode === menu) {
            var id = e.target.id;
            switch (id) {
                case "o1":
                    break;
                case "o2":
                    break;
                case "o3":
                    break;
                case "o4":
                    console.log(frompath);
                    window.__TAURI__.invoke("addmark", {
                        path: frompath
                    });
                    break;
                default:
                    break;
            }
            menu.style.display = "none";
        }
        if (e.target.tagName === "TD") {
            let target = e.target;
            if (target.tagName === "TD") {
                let name = target.dataset.name;
                let path = target.dataset.path;
                let isDir = target.dataset.isDir;
                if (isDir === "true") {
                    pathInput.value = path;
                    parentsize.innerHTML = target.dataset.parentsize;
                    window.__TAURI__.invoke("list_files", {
                        oid: tid.toString(),
                        path: path,
                        ff: ""
                    });
                }
                else if (name.toLowerCase().endsWith(".md")) {
                    window.__TAURI__
                        .invoke("loadmarkdown", { name: path });
                }
                else {
                    openpath(path);
                }
            }
        }
        switch (e.target) {
            case reload:
                let path = pathInput.value;
                window.__TAURI__.invoke("list_files", {
                    oid: tid.toString(),
                    path: path,
                    ff: ""
                });
                break;
            case backButton:
                window.__TAURI__.invoke("back", {
                    oid: tid.toString(),
                })
                    .then((options) => {
                    if (options !== null) {
                        window.__TAURI__.invoke("list_files", {
                            oid: tid.toString(),
                            path: options,
                            ff: "back"
                        });
                    }
                })
                    .catch((error) => {
                });
                break;
        }
        if (e.target.id == "goloc") {
            var pathtg = e.target.dataset.loc;
            window.__TAURI__.invoke("list_files", {
                oid: tid.toString(),
                path: pathtg,
                ff: ""
            });
        }
        if (e.target.className == "mark-button") {
            var gpath = e.target.dataset.path;
            tid = tid + 1;
            window.__TAURI__.invoke("newtab", {
                oid: tid.toString(),
                path: gpath,
                ff: ""
            }).await;
            window.__TAURI__.invoke("load_tab", {
                oid: tid.toString()
            }).await;
        }
    });
    const datalist = document.getElementById("path-list");
    pathInput.addEventListener("input", async () => {
        const path = pathInput.value;
        await window.__TAURI__.invoke("get_path_options", {
            path: path,
        })
            .then((options) => {
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
        console.log("loadmarkdown");
        openmarkdown(data.payload);
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
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
window.__TAURI__.event.listen("folder-count", (data) => {
    console.log("folder-count");
    folcount = data.payload;
});
window.__TAURI__.event.listen("list-tabs", (data) => {
    console.log("listtabs ");
    let tabs = JSON.parse(data.payload);
    tablist.innerHTML = "";
    for (let tb of tabs) {
        let b = document.createElement("button");
        b.className = "tab-button";
        let sn = document.createElement("span");
        sn.className = "tab-name";
        let sc = document.createElement("span");
        sc.className = "tab-close";
        sn.textContent = tb.tabname;
        sc.textContent = "x";
        b.appendChild(sn);
        b.appendChild(sc);
        b.id = tb.id.toString();
        b.dataset.path = tb.path;
        b.dataset.ff = tb.ff;
        tablist.appendChild(b);
    }
});
window.__TAURI__.event.listen("load-marks", (data) => {
    console.log("listmarks ");
    marklist.replaceChildren();
    let r = JSON.parse(data.payload);
    console.log(r);
    for (var i = 0; i < r.length; i++) {
        let b = document.createElement("button");
        b.className = "mark-button";
        b.textContent = r[i].name;
        b.dataset.path = r[i].path;
        marklist.appendChild(b);
    }
});
