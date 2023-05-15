import * as globals from './file-explorer';
// import MarkdownIt from 'markdown-it';

// const md=new MarkdownIt('commonmark',{
//   html:         true,        // Enable HTML tags in source
//   xhtmlOut:     false,        // Use '/' to close single tags (<br />).
//                               // This is only for full CommonMark compatibility.
//   breaks:       false,        // Convert '\n' in paragraphs into <br>
//   langPrefix:   'language-',  // CSS language prefix for fenced blocks. Can be
//                               // useful for external highlighters.
//   linkify:      false,        // Autoconvert URL-like text to links

//   // Enable some language-neutral replacement + quotes beautification
//   // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
//   typographer:  false,

//   // Double + single quotes replacement pairs, when typographer enabled,
//   // and smartquotes on. Could be either a String or an Array.
//   //
//   // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
//   // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
//   quotes: '“”‘’',

//   // Highlighter function. Should return escaped HTML,
//   // or '' if the source string is not changed and should be escaped externally.
//   // If result starts with <pre... internal wrapper is skipped.
//   highlight: function (/*str, lang*/) { return ''; }
// });
// var result = md.render('# Hello, world!');
// console.log(result);

export function openmarkdown(htmlfrommd: string) {
  globals.ousd.style.display="block";
  globals.filewatch.style.display="block";

  var arr = globals.pathInput.value.split("/"); // arr is ["a", "b", "c", "d"]
    var prefixes: string[] = [];
    var prefix = "";
    for (var i = 0; i < arr.length; i++) {
      prefix += arr[i]; // append the current element to the prefix
      prefixes.push(prefix); // add the prefix to the prefixes array
      prefix += "/"; // add a slash for the next iteration
    }
    var fols=[]
    console.log(globals.pathInput.value.split("/"))
    fols = globals.pathInput.value.split("/");
    console.log(fols.length);
    globals.pathline.replaceChildren();

    for (var i = 0; i < fols.length; i++){ 
    // fols.forEach(
      // function (fol, index) {
        let pathn = document.createElement("span");
        pathn.id="goloc"
        pathn.textContent = fols[i] + "\n";
        pathn.dataset.loc = prefixes[i];
        globals.pathline?.appendChild(pathn);
        // // console.log(index)
      }
    globals.fileList.innerHTML = ""
    globals.htmlbase.innerHTML = htmlfrommd;
    // document.body.innerHTML = await window.__TAURI__.invoke("loadmarkdown", { name: path });
    var links = document.getElementsByTagName("a"); // get all links
    for (var i = 0; i < links.length; i++) { // loop through them
      var link = links[i]; // get current link
      // var href = link.getAttribute("href"); // get href attribute
      // if (href && href.startsWith("http") && !href.includes("yourdomain")) { // check conditions
      link.setAttribute("target", "_blank"); // set target attribute
      // }
    }
  }

  export function loadmarkdown(){
      (window as any).__TAURI__.event.listen("load-markdown", (data: { payload: string }) => {
        console.log("loadmarkdown")
        
        openmarkdown(data.payload)
      });
    
  }
