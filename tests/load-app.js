const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const JS_FOLDER = path.join(__dirname, "..", "js");

// The browser files expect a page; this gives them just enough of one to be loaded in Node.
function makeFakeElement() {
  return {
    value: "",
    dataset: {},
    addEventListener() {},
    querySelectorAll: () => [],
    setAttribute() {},
  };
}

// Runs the given files from js/ the way the page does and returns the shared window.heroApp.
function loadApp(fileNames, fakeFetch) {
  const context = { document: { querySelector: makeFakeElement }, fetch: fakeFetch };
  context.window = context;
  vm.createContext(context);

  for (const fileName of fileNames) {
    const code = fs.readFileSync(path.join(JS_FOLDER, fileName), "utf8");
    vm.runInContext(code, context, { filename: fileName });
  }
  return context.heroApp;
}

module.exports = { loadApp };