"use strict";
const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;
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
            li.dataset.size = file.size.toString();
            li.dataset.parent = file.parent;
            li.dataset.grandparent = file.grandparent;
            li.dataset.parentsize = file.parentsize.toString();
            lastfolder = file.grandparent;
            parentsize.innerHTML = file.parentsize.toString();
            pathInput.value = file.parent;
            fileList.appendChild(li);
        }
    });
});
