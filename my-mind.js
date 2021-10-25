(() => {
  var __defProp = Object.defineProperty;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // .js/mm.js
  window.MM = { UI: {} };

  // .js/repo.js
  MM.Repo = {
    id: "",
    label: "",
    getAll: function() {
      var all = [];
      for (var p in this) {
        var val = this[p];
        if (this.isPrototypeOf(val)) {
          all.push(val);
        }
      }
      return all;
    },
    getByProperty: function(property, value) {
      return this.getAll().filter((item) => {
        return item[property] == value;
      })[0] || null;
    },
    getById: function(id) {
      return this.getByProperty("id", id);
    },
    buildOption: function() {
      var o = document.createElement("option");
      o.value = this.id;
      o.innerHTML = this.label;
      return o;
    }
  };

  // .js/format/format.js
  MM.Format = Object.create(MM.Repo, {
    extension: { value: "" },
    mime: { value: "" }
  });
  MM.Format.getByName = function(name) {
    var index2 = name.lastIndexOf(".");
    if (index2 == -1) {
      return null;
    }
    var extension = name.substring(index2 + 1).toLowerCase();
    return this.getByProperty("extension", extension);
  };
  MM.Format.getByMime = function(mime) {
    return this.getByProperty("mime", mime);
  };
  MM.Format.to = function(data) {
  };
  MM.Format.from = function(data) {
  };
  MM.Format.nl2br = function(str) {
    return str.replace(/\n/g, "<br/>");
  };
  MM.Format.br2nl = function(str) {
    return str.replace(/<br\s*\/?>/g, "\n");
  };

  // .js/format/format.json.js
  MM.Format.JSON = Object.create(MM.Format, {
    id: { value: "json" },
    label: { value: "Native (JSON)" },
    extension: { value: "mymind" },
    mime: { value: "application/vnd.mymind+json" }
  });
  MM.Format.JSON.to = function(data) {
    return JSON.stringify(data, null, "	") + "\n";
  };
  MM.Format.JSON.from = function(data) {
    return JSON.parse(data);
  };

  // .js/format/format.freemind.js
  MM.Format.FreeMind = Object.create(MM.Format, {
    id: { value: "freemind" },
    label: { value: "FreeMind" },
    extension: { value: "mm" },
    mime: { value: "application/x-freemind" }
  });
  MM.Format.FreeMind.to = function(data) {
    var doc = document.implementation.createDocument(null, null, null);
    var map = doc.createElement("map");
    map.setAttribute("version", "1.0.1");
    map.appendChild(this._serializeItem(doc, data.root));
    doc.appendChild(map);
    var serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  };
  MM.Format.FreeMind.from = function(data) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(data, "application/xml");
    if (doc.documentElement.nodeName.toLowerCase() == "parsererror") {
      throw new Error(doc.documentElement.textContent);
    }
    var root = doc.documentElement.getElementsByTagName("node")[0];
    if (!root) {
      throw new Error("No root node found");
    }
    var json = {
      root: this._parseNode(root, { shape: "underline" })
    };
    json.root.layout = "map";
    json.root.shape = "ellipse";
    return json;
  };
  MM.Format.FreeMind._serializeItem = function(doc, json) {
    var elm = this._serializeAttributes(doc, json);
    (json.children || []).forEach(function(child) {
      elm.appendChild(this._serializeItem(doc, child));
    }, this);
    return elm;
  };
  MM.Format.FreeMind._serializeAttributes = function(doc, json) {
    var elm = doc.createElement("node");
    elm.setAttribute("TEXT", MM.Format.br2nl(json.text));
    elm.setAttribute("ID", json.id);
    if (json.side) {
      elm.setAttribute("POSITION", json.side);
    }
    if (json.shape == "box") {
      elm.setAttribute("STYLE", "bubble");
    }
    if (json.collapsed) {
      elm.setAttribute("FOLDED", "true");
    }
    if (json.notes) {
      var notesElm = doc.createElement("richcontent");
      notesElm.setAttribute("TYPE", "NOTE");
      notesElm.appendChild(doc.createCDATASection("<html><head></head><body>" + json.notes + "</body></html>"));
      elm.appendChild(notesElm);
    }
    return elm;
  };
  MM.Format.FreeMind._parseNode = function(node9, parent) {
    var json = this._parseAttributes(node9, parent);
    for (var i = 0; i < node9.childNodes.length; i++) {
      var child = node9.childNodes[i];
      if (child.nodeName.toLowerCase() == "node") {
        json.children.push(this._parseNode(child, json));
      }
    }
    return json;
  };
  MM.Format.FreeMind._parseAttributes = function(node9, parent) {
    var json = {
      children: [],
      text: MM.Format.nl2br(node9.getAttribute("TEXT") || ""),
      id: node9.getAttribute("ID")
    };
    var position = node9.getAttribute("POSITION");
    if (position) {
      json.side = position;
    }
    var style = node9.getAttribute("STYLE");
    if (style == "bubble") {
      json.shape = "box";
    } else {
      json.shape = parent.shape;
    }
    if (node9.getAttribute("FOLDED") == "true") {
      json.collapsed = 1;
    }
    var children = node9.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      switch (child.nodeName.toLowerCase()) {
        case "richcontent":
          if (child.getAttribute("TYPE") == "NOTE") {
            var body = child.querySelector("body > *");
            if (body) {
              var serializer = new XMLSerializer();
              json.notes = serializer.serializeToString(body).trim();
            }
          }
          break;
        case "font":
          if (child.getAttribute("ITALIC") == "true") {
            json.text = "<i>" + json.text + "</i>";
          }
          if (child.getAttribute("BOLD") == "true") {
            json.text = "<b>" + json.text + "</b>";
          }
          break;
      }
    }
    return json;
  };

  // .js/format/format.mma.js
  MM.Format.MMA = Object.create(MM.Format.FreeMind, {
    id: { value: "mma" },
    label: { value: "Mind Map Architect" },
    extension: { value: "mma" }
  });
  MM.Format.MMA._parseAttributes = function(node9, parent) {
    var json = {
      children: [],
      text: MM.Format.nl2br(node9.getAttribute("title") || ""),
      shape: "box"
    };
    if (node9.getAttribute("expand") == "false") {
      json.collapsed = 1;
    }
    var direction = node9.getAttribute("direction");
    if (direction == "0") {
      json.side = "left";
    }
    if (direction == "1") {
      json.side = "right";
    }
    var color = node9.getAttribute("color");
    if (color) {
      var re = color.match(/^#(....)(....)(....)$/);
      if (re) {
        var r = parseInt(re[1], 16) >> 8;
        var g = parseInt(re[2], 16) >> 8;
        var b = parseInt(re[3], 16) >> 8;
        r = Math.round(r / 17).toString(16);
        g = Math.round(g / 17).toString(16);
        b = Math.round(b / 17).toString(16);
      }
      json.color = "#" + [r, g, b].join("");
    }
    json.icon = node9.getAttribute("icon");
    return json;
  };
  MM.Format.MMA._serializeAttributes = function(doc, json) {
    var elm = doc.createElement("node");
    elm.setAttribute("title", MM.Format.br2nl(json.text));
    elm.setAttribute("expand", json.collapsed ? "false" : "true");
    if (json.side) {
      elm.setAttribute("direction", json.side == "left" ? "0" : "1");
    }
    if (json.color) {
      var parts = json.color.match(/^#(.)(.)(.)$/);
      var r = new Array(5).join(parts[1]);
      var g = new Array(5).join(parts[2]);
      var b = new Array(5).join(parts[3]);
      elm.setAttribute("color", "#" + [r, g, b].join(""));
    }
    if (json.icon) {
      elm.setAttribute("icon", json.icon);
    }
    return elm;
  };

  // .js/format/format.mup.js
  MM.Format.Mup = Object.create(MM.Format, {
    id: { value: "mup" },
    label: { value: "MindMup" },
    extension: { value: "mup" }
  });
  MM.Format.Mup.to = function(data) {
    var root = this._MMtoMup(data.root);
    return JSON.stringify(root, null, 2);
  };
  MM.Format.Mup.from = function(data) {
    var source = JSON.parse(data);
    var root = this._MupToMM(source);
    root.layout = "map";
    var map = {
      root
    };
    return map;
  };
  MM.Format.Mup._MupToMM = function(item) {
    var json = {
      text: MM.Format.nl2br(item.title),
      id: item.id,
      shape: "box",
      icon: item.icon
    };
    if (item.attr && item.attr.style && item.attr.style.background) {
      json.color = item.attr.style.background;
    }
    if (item.attr && item.attr.collapsed) {
      json.collapsed = 1;
    }
    if (item.ideas) {
      var data = [];
      for (var key in item.ideas) {
        var child = this._MupToMM(item.ideas[key]);
        var num = parseFloat(key);
        child.side = num < 0 ? "left" : "right";
        data.push({
          child,
          num
        });
      }
      data.sort(function(a, b) {
        return a.num - b.num;
      });
      json.children = data.map(function(item2) {
        return item2.child;
      });
    }
    return json;
  };
  MM.Format.Mup._MMtoMup = function(item, side) {
    var result = {
      id: item.id,
      title: MM.Format.br2nl(item.text),
      icon: item.icon,
      attr: {}
    };
    if (item.color) {
      result.attr.style = { background: item.color };
    }
    if (item.collapsed) {
      result.attr.collapsed = true;
    }
    if (item.children) {
      result.ideas = {};
      for (var i = 0; i < item.children.length; i++) {
        var child = item.children[i];
        var childSide = side || child.side;
        var key = i + 1;
        if (childSide == "left") {
          key *= -1;
        }
        result.ideas[key] = this._MMtoMup(child, childSide);
      }
    }
    return result;
  };

  // .js/format/format.plaintext.js
  MM.Format.Plaintext = Object.create(MM.Format, {
    id: { value: "plaintext" },
    label: { value: "Plain text" },
    extension: { value: "txt" },
    mime: { value: "application/vnd.mymind+txt" }
  });
  MM.Format.Plaintext.to = function(data) {
    return this._serializeItem(data.root || data);
  };
  MM.Format.Plaintext.from = function(data) {
    var lines = data.split("\n").filter(function(line) {
      return line.match(/\S/);
    });
    var items = this._parseItems(lines);
    if (items.length == 1) {
      var result = {
        root: items[0]
      };
    } else {
      var result = {
        root: {
          text: "",
          children: items
        }
      };
    }
    result.root.layout = "map";
    return result;
  };
  MM.Format.Plaintext._serializeItem = function(item, depth) {
    depth = depth || 0;
    var lines = (item.children || []).map(function(child) {
      return this._serializeItem(child, depth + 1);
    }, this);
    var prefix = new Array(depth + 1).join("	");
    lines.unshift(prefix + item.text.replace(/\n/g, ""));
    return lines.join("\n") + (depth ? "" : "\n");
  };
  MM.Format.Plaintext._parseItems = function(lines) {
    var items = [];
    if (!lines.length) {
      return items;
    }
    var firstPrefix = this._parsePrefix(lines[0]);
    var currentItem2 = null;
    var childLines = [];
    var convertChildLinesToChildren = function() {
      if (!currentItem2 || !childLines.length) {
        return;
      }
      var children = this._parseItems(childLines);
      if (children.length) {
        currentItem2.children = children;
      }
      childLines = [];
    };
    lines.forEach(function(line, index2) {
      if (this._parsePrefix(line) == firstPrefix) {
        convertChildLinesToChildren.call(this);
        currentItem2 = { text: line.match(/^\s*(.*)/)[1] };
        items.push(currentItem2);
      } else {
        childLines.push(line);
      }
    }, this);
    convertChildLinesToChildren.call(this);
    return items;
  };
  MM.Format.Plaintext._parsePrefix = function(line) {
    return line.match(/^\s*/)[0];
  };

  // .js/backend/backend.js
  MM.Backend = Object.create(MM.Repo);
  MM.Backend.reset = function() {
  };
  MM.Backend.save = function(data, name) {
  };
  MM.Backend.load = function(name) {
  };

  // .js/backend/backend.local.js
  MM.Backend.Local = Object.create(MM.Backend, {
    label: { value: "Browser storage" },
    id: { value: "local" },
    prefix: { value: "mm.map." }
  });
  MM.Backend.Local.save = function(data, id, name) {
    localStorage.setItem(this.prefix + id, data);
    var names = this.list();
    names[id] = name;
    localStorage.setItem(this.prefix + "names", JSON.stringify(names));
  };
  MM.Backend.Local.load = function(id) {
    var data = localStorage.getItem(this.prefix + id);
    if (!data) {
      throw new Error("There is no such saved map");
    }
    return data;
  };
  MM.Backend.Local.remove = function(id) {
    localStorage.removeItem(this.prefix + id);
    var names = this.list();
    delete names[id];
    localStorage.setItem(this.prefix + "names", JSON.stringify(names));
  };
  MM.Backend.Local.list = function() {
    try {
      var data = localStorage.getItem(this.prefix + "names") || "{}";
      return JSON.parse(data);
    } catch (e) {
      return {};
    }
  };

  // .js/backend/backend.webdav.js
  MM.Backend.WebDAV = Object.create(MM.Backend, {
    id: { value: "webdav" },
    label: { value: "Generic WebDAV" }
  });
  MM.Backend.WebDAV.save = function(data, url) {
    return this._request("PUT", url, data);
  };
  MM.Backend.WebDAV.load = function(url) {
    return this._request("GET", url);
  };
  MM.Backend.WebDAV._request = async function(method, url, data) {
    let init16 = {
      method,
      credentials: "include"
    };
    if (data) {
      init16.body = data;
    }
    let response = await fetch(url, init16);
    let text = await response.text();
    if (response.status == 200) {
      return text;
    } else {
      throw new Error("HTTP/" + response.status + "\n\n" + text);
    }
  };

  // .js/backend/backend.image.js
  MM.Backend.Image = Object.create(MM.Backend, {
    id: { value: "image" },
    label: { value: "Image" },
    url: { value: "", writable: true }
  });
  MM.Backend.Image.save = function() {
    let serializer = new XMLSerializer();
    let xml = serializer.serializeToString(currentMap.node);
    let base64 = btoa(xml);
    let img = new Image();
    img.src = `data:image/svg+xml;base64,${base64}`;
    window.img = img;
    img.onload = () => {
      let canvas = document.createElement("canvas");
      window.canvas = canvas;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        let link = document.createElement("a");
        link.download = currentMap.name;
        link.href = URL.createObjectURL(blob);
        link.click();
      }, "image/png");
    };
  };

  // .js/backend/backend.file.js
  MM.Backend.File = Object.create(MM.Backend, {
    id: { value: "file" },
    label: { value: "File" },
    input: { value: document.createElement("input") }
  });
  MM.Backend.File.save = function(data, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = "data:text/plain;base64," + btoa(unescape(encodeURIComponent(data)));
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    return Promise.resolve();
  };
  MM.Backend.File.load = function() {
    this.input.type = "file";
    return new Promise((resolve, reject) => {
      this.input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) {
          return;
        }
        var reader = new FileReader();
        reader.onload = function() {
          resolve({ data: reader.result, name: file.name });
        };
        reader.onerror = function() {
          reject(reader.error);
        };
        reader.readAsText(file);
      }.bind(this);
      this.input.click();
    });
  };

  // .js/pubsub.js
  var subscribers = new Map();
  function publish(message, publisher, data) {
    let subs = subscribers.get(message) || [];
    subs.forEach((sub) => {
      if (typeof sub == "function") {
        sub(message, publisher, data);
      } else {
        sub.handleMessage(message, publisher, data);
      }
    });
  }
  function subscribe(message, subscriber) {
    if (!subscribers.has(message)) {
      subscribers.set(message, []);
    }
    let subs = subscribers.get(message) || [];
    let index2 = subs.indexOf(subscriber);
    if (index2 == -1) {
      subs.push(subscriber);
    }
  }
  function unsubscribe(message, subscriber) {
    let subs = subscribers.get(message) || [];
    let index2 = subs.indexOf(subscriber);
    if (index2 > -1) {
      subs.splice(index2, 1);
    }
  }

  // .js/backend/backend.firebase.js
  MM.Backend.Firebase = Object.create(MM.Backend, {
    label: { value: "Firebase" },
    id: { value: "firebase" },
    ref: { value: null, writable: true },
    _current: { value: {
      id: null,
      name: null,
      data: null
    } }
  });
  MM.Backend.Firebase.connect = function(server, auth) {
    var config = {
      apiKey: "AIzaSyBO_6uCK8pHjoz1c9htVwZi6Skpm8o4LtQ",
      authDomain: "my-mind.firebaseapp.com",
      databaseURL: "https://" + server + ".firebaseio.com",
      projectId: "firebase-my-mind",
      storageBucket: "firebase-my-mind.appspot.com",
      messagingSenderId: "666556281676"
    };
    firebase.initializeApp(config);
    this.ref = firebase.database().ref();
    this.ref.child("names").on("value", function(snap) {
      publish("firebase-list", this, snap.val() || {});
    }, this);
    if (auth) {
      return this._login(auth);
    } else {
      return new Promise().fulfill();
    }
  };
  MM.Backend.Firebase.save = function(data, id, name) {
    try {
      this.ref.child("names/" + id).set(name);
      return new Promise((resolve, reject) => {
        this.ref.child("data/" + id).set(data, (result) => {
          if (result) {
            reject(result);
          } else {
            resolve();
            this._listenStart(data, id);
          }
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };
  MM.Backend.Firebase.load = function(id) {
    return new Promise((resolve, reject) => {
      this.ref.child("data/" + id).once("value", (snap) => {
        var data = snap.val();
        if (data) {
          resolve(data);
          this._listenStart(data, id);
        } else {
          reject(new Error("There is no such saved map"));
        }
      });
    });
  };
  MM.Backend.Firebase.remove = function(id) {
    try {
      this.ref.child("names/" + id).remove();
      return new Promise((resolve, reject) => {
        this.ref.child("data/" + id).remove((result) => {
          result ? reject(result) : resolve();
        });
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };
  MM.Backend.Firebase.reset = function() {
    this._listenStop();
  };
  MM.Backend.Firebase.mergeWith = function(data, name) {
    var id = this._current.id;
    if (name != this._current.name) {
      this._current.name = name;
      this.ref.child("names/" + id).set(name);
    }
    var dataRef = this.ref.child("data/" + id);
    var oldData = this._current.data;
    this._listenStop();
    this._recursiveRefMerge(dataRef, oldData, data);
    this._listenStart(data, id);
  };
  MM.Backend.Firebase._recursiveRefMerge = function(ref, oldData, newData) {
    var updateObject = {};
    if (newData instanceof Array) {
      for (var i = 0; i < newData.length; i++) {
        var newValue = newData[i];
        if (!(i in oldData)) {
          updateObject[i] = newValue;
        } else if (typeof newValue == "object") {
          this._recursiveRefMerge(ref.child(i), oldData[i], newValue);
        } else if (newValue !== oldData[i]) {
          updateObject[i] = newValue;
        }
      }
      for (var i = newData.length; i < oldData.length; i++) {
        updateObject[i] = null;
      }
    } else {
      for (var p in newData) {
        var newValue = newData[p];
        if (!(p in oldData)) {
          updateObject[p] = newValue;
        } else if (typeof newValue == "object") {
          this._recursiveRefMerge(ref.child(p), oldData[p], newValue);
        } else if (newValue !== oldData[p]) {
          updateObject[p] = newValue;
        }
      }
      for (var p in oldData) {
        if (!(p in newData)) {
          updateObject[p] = null;
        }
      }
    }
    if (Object.keys(updateObject).length) {
      ref.update(updateObject);
    }
  };
  MM.Backend.Firebase._listenStart = function(data, id) {
    if (this._current.id && this._current.id == id) {
      return;
    }
    this._listenStop();
    this._current.id = id;
    this._current.data = data;
    this.ref.child("data/" + id).on("value", this._valueChange, this);
  };
  MM.Backend.Firebase._listenStop = function() {
    if (!this._current.id) {
      return;
    }
    this.ref.child("data/" + this._current.id).off("value");
    this._current.id = null;
    this._current.name = null;
    this._current.data = null;
  };
  MM.Backend.Firebase._valueChange = function(snap) {
    this._current.data = snap.val();
    if (this._changeTimeout) {
      clearTimeout(this._changeTimeout);
    }
    this._changeTimeout = setTimeout(function() {
      publish("firebase-change", this, this._current.data);
    }.bind(this), 200);
  };
  MM.Backend.Firebase._login = function(type) {
    var provider;
    switch (type) {
      case "github":
        provider = new firebase.auth.GithubAuthProvider();
        break;
      case "facebook":
        provider = new firebase.auth.FacebookAuthProvider();
        break;
      case "twitter":
        provider = new firebase.auth.TwitterAuthProvider();
        break;
      case "google":
        provider = new firebase.auth.GoogleAuthProvider();
        break;
    }
    return firebase.auth().signInWithPopup(provider).then(function(result) {
      return result.user;
    });
  };

  // .js/backend/backend.gdrive.js
  MM.Backend.GDrive = Object.create(MM.Backend, {
    id: { value: "gdrive" },
    label: { value: "Google Drive" },
    scope: { value: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.install" },
    clientId: { value: "767837575056-h87qmlhmhb3djhaaqta5gv2v3koa9hii.apps.googleusercontent.com" },
    apiKey: { value: "AIzaSyCzu1qVxlgufneOYpBgDJXN6Z9SNVcHYWM" },
    fileId: { value: null, writable: true }
  });
  MM.Backend.GDrive.reset = function() {
    this.fileId = null;
  };
  MM.Backend.GDrive.save = function(data, name, mime) {
    return this._connect().then(function() {
      return this._send(data, name, mime);
    }.bind(this));
  };
  MM.Backend.GDrive._send = function(data, name, mime) {
    var path = "/upload/drive/v2/files";
    var method = "POST";
    if (this.fileId) {
      path += "/" + this.fileId;
      method = "PUT";
    }
    var boundary = "b" + Math.random();
    var delimiter = "--" + boundary;
    var body = [
      delimiter,
      "Content-Type: application/json",
      "",
      JSON.stringify({ title: name }),
      delimiter,
      "Content-Type: " + mime,
      "",
      data,
      delimiter + "--"
    ].join("\r\n");
    var request = gapi.client.request({
      path,
      method,
      headers: {
        "Content-Type": "multipart/mixed; boundary='" + boundary + "'"
      },
      body
    });
    return new Promise((resolve, reject) => {
      request.execute((response) => {
        if (!response) {
          reject(new Error("Failed to upload to Google Drive"));
        } else if (response.error) {
          reject(response.error);
        } else {
          this.fileId = response.id;
          resolve();
        }
      });
    });
  };
  MM.Backend.GDrive.load = function(id) {
    return this._connect().then(this._load.bind(this, id));
  };
  MM.Backend.GDrive._load = function(id) {
    this.fileId = id;
    var request = gapi.client.request({
      path: "/drive/v2/files/" + this.fileId,
      method: "GET"
    });
    return new Promise((resolve, reject) => {
      request.execute(async (response) => {
        if (!response || !response.id) {
          return reject(response && response.error || new Error("Failed to download file"));
        }
        let headers = { "Authentication": "Bearer " + gapi.auth.getToken().access_token };
        let r = await fetch(`https://www.googleapis.com/drive/v2/files/${response.id}?alt=media`, { headers });
        let data = await r.text();
        if (r.status != 200) {
          return reject(data);
        }
        resolve({ data, name: response.title, mime: response.mimeType });
      });
    });
  };
  MM.Backend.GDrive.pick = function() {
    return this._connect().then(this._pick.bind(this));
  };
  MM.Backend.GDrive._pick = function() {
    var promise = new Promise();
    var token = gapi.auth.getToken();
    var formats = MM.Format.getAll();
    var mimeTypes = ["application/json; charset=UTF-8", "application/json"];
    formats.forEach(function(format) {
      if (format.mime) {
        mimeTypes.unshift(format.mime);
      }
    });
    var view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(mimeTypes.join(",")).setMode(google.picker.DocsViewMode.LIST);
    var picker = new google.picker.PickerBuilder().enableFeature(google.picker.Feature.NAV_HIDDEN).addView(view).setOAuthToken(token.access_token).setDeveloperKey(this.apiKey).setCallback(function(data) {
      switch (data[google.picker.Response.ACTION]) {
        case google.picker.Action.PICKED:
          var doc = data[google.picker.Response.DOCUMENTS][0];
          promise.fulfill(doc.id);
          break;
        case google.picker.Action.CANCEL:
          promise.fulfill(null);
          break;
      }
    }).build();
    picker.setVisible(true);
    return promise;
  };
  MM.Backend.GDrive._connect = function() {
    if (window.gapi && window.gapi.auth.getToken()) {
      return new Promise().fulfill();
    } else {
      return this._loadGapi().then(this._auth.bind(this));
    }
  };
  MM.Backend.GDrive._loadGapi = function() {
    var promise = new Promise();
    if (window.gapi) {
      return promise.fulfill();
    }
    var script = document.createElement("script");
    var name = ("cb" + Math.random()).replace(".", "");
    window[name] = promise.fulfill.bind(promise);
    script.src = "https://apis.google.com/js/client:picker.js?onload=" + name;
    document.body.appendChild(script);
    return promise;
  };
  MM.Backend.GDrive._auth = async function(forceUI) {
    return new Promise((resolve, reject) => {
      gapi.auth.authorize({
        "client_id": this.clientId,
        "scope": this.scope,
        "immediate": !forceUI
      }, async (token) => {
        if (token && !token.error) {
          resolve();
        } else if (!forceUI) {
          try {
            await this._auth(true);
            resolve();
          } catch (e) {
            reject(e);
          }
        } else {
          reject(token && token.error || new Error("Failed to authorize with Google"));
        }
      });
    });
  };

  // .js/ui/ui.io.js
  MM.UI.IO = function() {
    this._prefix = "mm.app.";
    this._mode = "";
    this._node = document.querySelector("#io");
    this._heading = this._node.querySelector("h3");
    this._backend = this._node.querySelector("#backend");
    this._currentBackend = null;
    this._backends = {};
    var ids = ["local", "firebase", "gdrive", "file", "webdav", "image"];
    ids.forEach(function(id) {
      var ui5 = MM.UI.Backend.getById(id);
      ui5.init(this._backend);
      this._backends[id] = ui5;
    }, this);
    this._backend.value = localStorage.getItem(this._prefix + "backend") || MM.Backend.File.id;
    this._backend.addEventListener("change", this);
    subscribe("map-new", this);
    subscribe("save-done", this);
    subscribe("load-done", this);
  };
  MM.UI.IO.prototype.restore = function() {
    var parts = {};
    location.search.substring(1).split("&").forEach(function(item) {
      var keyvalue = item.split("=");
      parts[decodeURIComponent(keyvalue[0])] = decodeURIComponent(keyvalue[1]);
    });
    if ("map" in parts) {
      parts.url = parts.map;
    }
    if ("url" in parts && !("b" in parts)) {
      parts.b = "webdav";
    }
    var backend = MM.UI.Backend.getById(parts.b);
    if (backend) {
      backend.setState(parts);
      return;
    }
    if (parts.state) {
      try {
        var state = JSON.parse(parts.state);
        if (state.action == "open") {
          state = {
            b: "gdrive",
            id: state.ids[0]
          };
          MM.UI.Backend.GDrive.setState(state);
        } else {
          history.replaceState(null, "", ".");
        }
        return;
      } catch (e) {
      }
    }
  };
  MM.UI.IO.prototype.handleMessage = function(message, publisher) {
    switch (message) {
      case "map-new":
        this._setCurrentBackend(null);
        break;
      case "save-done":
      case "load-done":
        this.hide();
        this._setCurrentBackend(publisher);
        break;
    }
  };
  MM.UI.IO.prototype.show = function(mode2) {
    this._mode = mode2;
    this._node.hidden = false;
    this._heading.innerHTML = mode2;
    this._syncBackend();
  };
  MM.UI.IO.prototype.hide = function() {
    if (this._node.hidden) {
      return;
    }
    this._node.hidden = true;
  };
  MM.UI.IO.prototype.quickSave = function() {
    if (this._currentBackend) {
      this._currentBackend.save();
    } else {
      this.show("save");
    }
  };
  MM.UI.IO.prototype.handleEvent = function(e) {
    switch (e.type) {
      case "change":
        this._syncBackend();
        break;
    }
  };
  MM.UI.IO.prototype._syncBackend = function() {
    [...this._node.querySelectorAll("div[id]")].forEach((node9) => node9.hidden = true);
    this._node.querySelector("#" + this._backend.value).hidden = false;
    this._backends[this._backend.value].show(this._mode);
  };
  MM.UI.IO.prototype._setCurrentBackend = function(backend) {
    if (this._currentBackend && this._currentBackend != backend) {
      this._currentBackend.reset();
    }
    if (backend) {
      localStorage.setItem(this._prefix + "backend", backend.id);
    }
    this._currentBackend = backend;
    try {
      this._updateURL();
    } catch (e) {
    }
  };
  MM.UI.IO.prototype._updateURL = function() {
    var data = this._currentBackend && this._currentBackend.getState();
    if (!data) {
      history.replaceState(null, "", ".");
    } else {
      var arr = Object.keys(data).map(function(key) {
        return encodeURIComponent(key) + "=" + encodeURIComponent(data[key]);
      });
      history.replaceState(null, "", "?" + arr.join("&"));
    }
  };

  // .js/html.js
  function node(name, attrs) {
    let node9 = document.createElement(name);
    Object.assign(node9, attrs);
    return node9;
  }

  // .js/svg.js
  var NS = "http://www.w3.org/2000/svg";
  function node2(name, attrs) {
    let node9 = document.createElementNS(NS, name);
    for (let attr in attrs) {
      node9.setAttribute(attr, attrs[attr]);
    }
    return node9;
  }
  function group() {
    return node2("g");
  }
  function foreignObject() {
    let fo = node2("foreignObject");
    fo.setAttribute("width", "1");
    fo.setAttribute("height", "1");
    return fo;
  }

  // .js/history.js
  var index = 0;
  var actions = [];
  function reset() {
    index = 0;
    actions = [];
  }
  function push(action2) {
    if (index < actions.length) {
      actions.splice(index, actions.length - index);
    }
    actions.push(action2);
    index++;
  }
  function back() {
    actions[--index].undo();
  }
  function forward() {
    actions[index++].do();
  }
  function canBack() {
    return !!index;
  }
  function canForward() {
    return index != actions.length;
  }

  // .js/ui/help.js
  var help_exports = {};
  __export(help_exports, {
    close: () => close,
    init: () => init,
    toggle: () => toggle
  });
  var node3 = document.querySelector("#help");
  var MAP = {
    8: "Backspace",
    9: "Tab",
    13: "\u21A9",
    32: "Spacebar",
    33: "PgUp",
    34: "PgDown",
    35: "End",
    36: "Home",
    37: "\u2190",
    38: "\u2191",
    39: "\u2192",
    40: "\u2193",
    45: "Insert",
    46: "Delete",
    65: "A",
    68: "D",
    83: "S",
    87: "W",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    "-": "\u2212"
  };
  function toggle() {
    node3.hidden = !node3.hidden;
  }
  function init() {
    let t = node3.querySelector(".navigation");
    buildRow(t, "pan");
    buildRow(t, "select");
    buildRow(t, "select-root");
    buildRow(t, "select-parent");
    buildRow(t, "center");
    buildRow(t, "zoom-in", "zoom-out");
    buildRow(t, "fold");
    t = node3.querySelector(".manipulation");
    buildRow(t, "insert-sibling");
    buildRow(t, "insert-child");
    buildRow(t, "swap");
    buildRow(t, "side");
    buildRow(t, "delete");
    t = node3.querySelector(".editing");
    buildRow(t, "value");
    buildRow(t, "yes", "no", "computed");
    buildRow(t, "edit");
    buildRow(t, "newline");
    buildRow(t, "bold");
    buildRow(t, "italic");
    buildRow(t, "underline");
    buildRow(t, "strikethrough");
    t = node3.querySelector(".other");
    buildRow(t, "undo", "redo");
    buildRow(t, "save");
    buildRow(t, "save-as");
    buildRow(t, "load");
    buildRow(t, "help");
    buildRow(t, "notes");
    buildRow(t, "ui");
  }
  function buildRow(table, ...commandNames) {
    var row = table.insertRow(-1);
    var labels = [];
    var keys = [];
    commandNames.forEach((name) => {
      let command = repo.get(name);
      if (!command) {
        console.warn(name);
        return;
      }
      labels.push(command.label);
      keys = keys.concat(command.keys.map(formatKey));
    });
    row.insertCell(-1).textContent = labels.join("/");
    row.insertCell(-1).textContent = keys.join("/");
  }
  function formatKey(key) {
    var str = "";
    if (key.ctrlKey) {
      str += "Ctrl+";
    }
    if (key.altKey) {
      str += "Alt+";
    }
    if (key.shiftKey) {
      str += "Shift+";
    }
    if (key.charCode) {
      var ch = String.fromCharCode(key.charCode);
      str += MAP[ch] || ch.toUpperCase();
    }
    if (key.keyCode) {
      str += MAP[key.keyCode] || String.fromCharCode(key.keyCode);
    }
    return str;
  }
  function close() {
    node3.hidden = true;
  }

  // .js/ui/notes.js
  var notes_exports = {};
  __export(notes_exports, {
    close: () => close2,
    init: () => init2,
    toggle: () => toggle2
  });
  var node4 = document.querySelector("#notes");
  function toggle2() {
    node4.hidden = !node4.hidden;
  }
  function close2() {
    if (node4.hidden) {
      return;
    }
    node4.hidden = true;
  }
  function update(html2) {
    if (html2.trim().length === 0) {
      currentItem.notes = null;
    } else {
      currentItem.notes = html2;
    }
    currentItem.update();
  }
  function onMessage(e) {
    if (!e.data || !e.data.action) {
      return;
    }
    switch (e.data.action) {
      case "setContent":
        update(e.data.value);
        break;
      case "closeEditor":
        close2();
        break;
    }
  }
  function init2() {
    window.addEventListener("message", onMessage);
  }

  // .js/ui/color.js
  var color_exports = {};
  __export(color_exports, {
    init: () => init3
  });

  // .js/action.js
  var Action = class {
    do() {
    }
    undo() {
    }
  };
  var Multi = class extends Action {
    constructor(actions12) {
      super();
      this.actions = actions12;
    }
    do() {
      this.actions.forEach((action2) => action2.do());
    }
    undo() {
      this.actions.slice().reverse().forEach((action2) => action2.undo());
    }
  };
  var InsertNewItem = class extends Action {
    constructor(parent, index2) {
      super();
      this.parent = parent;
      this.index = index2;
      this.item = new Item();
    }
    do() {
      this.parent.expand();
      this.parent.insertChild(this.item, this.index);
      selectItem(this.item);
    }
    undo() {
      this.parent.removeChild(this.item);
      selectItem(this.parent);
    }
  };
  var AppendItem = class extends Action {
    constructor(parent, item) {
      super();
      this.parent = parent;
      this.item = item;
    }
    do() {
      this.parent.insertChild(this.item);
      selectItem(this.item);
    }
    undo() {
      this.parent.removeChild(this.item);
      selectItem(this.parent);
    }
  };
  var RemoveItem = class extends Action {
    constructor(item) {
      super();
      this.item = item;
      this.parent = item.parent;
      this.index = this.parent.children.indexOf(this.item);
    }
    do() {
      this.parent.removeChild(this.item);
      selectItem(this.parent);
    }
    undo() {
      this.parent.insertChild(this.item, this.index);
      selectItem(this.item);
    }
  };
  var MoveItem = class extends Action {
    constructor(item, newParent, newIndex, newSide = "") {
      super();
      this.item = item;
      this.newParent = newParent;
      this.newIndex = newIndex;
      this.newSide = newSide;
      this.oldParent = item.parent;
      this.oldIndex = this.oldParent.children.indexOf(item);
      this.oldSide = item.side;
    }
    do() {
      const { item, newParent, newIndex, newSide } = this;
      item.side = newSide;
      if (newIndex === void 0) {
        newParent.insertChild(item);
      } else {
        newParent.insertChild(item, newIndex);
      }
      selectItem(item);
    }
    undo() {
      const { item, oldSide, oldIndex, oldParent, newParent } = this;
      item.side = oldSide;
      oldParent.insertChild(item, oldIndex);
      selectItem(newParent);
    }
  };
  var Swap = class extends Action {
    constructor(item, diff) {
      super();
      this.item = item;
      this.parent = item.parent;
      let children = this.parent.children;
      let sibling = this.parent.resolvedLayout.pickSibling(item, diff);
      this.sourceIndex = children.indexOf(item);
      this.targetIndex = children.indexOf(sibling);
    }
    do() {
      this.parent.insertChild(this.item, this.targetIndex);
    }
    undo() {
      this.parent.insertChild(this.item, this.sourceIndex);
    }
  };
  var SetLayout = class extends Action {
    constructor(item, layout) {
      super();
      this.item = item;
      this.layout = layout;
      this.oldLayout = item.layout;
    }
    do() {
      this.item.layout = this.layout;
    }
    undo() {
      this.item.layout = this.oldLayout;
    }
  };
  var SetShape = class extends Action {
    constructor(item, shape) {
      super();
      this.item = item;
      this.shape = shape;
      this.oldShape = item.shape;
    }
    do() {
      this.item.shape = this.shape;
    }
    undo() {
      this.item.shape = this.oldShape;
    }
  };
  var SetColor = class extends Action {
    constructor(item, color) {
      super();
      this.item = item;
      this.color = color;
      this.oldColor = item.color;
    }
    do() {
      this.item.color = this.color;
    }
    undo() {
      this.item.color = this.oldColor;
    }
  };
  var SetText = class extends Action {
    constructor(item, text) {
      super();
      this.item = item;
      this.text = text;
      this.oldText = item.text;
      this.oldValue = item.value;
    }
    do() {
      this.item.text = this.text;
      let numText = Number(this.text);
      if (String(numText) == this.text) {
        this.item.value = numText;
      }
    }
    undo() {
      this.item.text = this.oldText;
      this.item.value = this.oldValue;
    }
  };
  var SetValue = class extends Action {
    constructor(item, value) {
      super();
      this.item = item;
      this.value = value;
      this.oldValue = item.value;
    }
    do() {
      this.item.value = this.value;
    }
    undo() {
      this.item.value = this.oldValue;
    }
  };
  var SetStatus = class extends Action {
    constructor(item, status) {
      super();
      this.item = item;
      this.status = status;
      this.oldStatus = item.status;
    }
    do() {
      this.item.status = this.status;
    }
    undo() {
      this.item.status = this.oldStatus;
    }
  };
  var SetIcon = class extends Action {
    constructor(item, icon) {
      super();
      this.item = item;
      this.icon = icon;
      this.oldIcon = item.icon;
    }
    do() {
      this.item.icon = this.icon;
    }
    undo() {
      this.item.icon = this.oldIcon;
    }
  };
  var SetSide = class extends Action {
    constructor(item, side) {
      super();
      this.item = item;
      this.side = side;
      this.oldSide = item.side;
    }
    do() {
      this.item.side = this.side;
      this.item.map.update();
    }
    undo() {
      this.item.side = this.oldSide;
      this.item.map.update();
    }
  };

  // .js/ui/color.js
  var node5 = document.querySelector("#color");
  function init3() {
    node5.addEventListener("click", onClick);
    [...node5.querySelectorAll("[data-color]")].forEach((item) => {
      item.style.backgroundColor = item.dataset.color;
    });
  }
  function onClick(e) {
    e.preventDefault();
    let color = e.target.dataset.color || null;
    let action2 = new SetColor(currentItem, color);
    action(action2);
  }

  // .js/ui/value.js
  var value_exports = {};
  __export(value_exports, {
    init: () => init4,
    update: () => update2
  });
  var select = document.querySelector("#value");
  function init4() {
    select.addEventListener("change", onChange);
  }
  function update2() {
    let value = currentItem.value;
    if (value === null) {
      value = "";
    }
    if (typeof value == "number") {
      value = "num";
    }
    select.value = value;
  }
  function onChange() {
    let value = select.value;
    if (value == "num") {
      repo.get("value").execute();
    } else {
      let action2 = new SetValue(currentItem, value || null);
      action(action2);
    }
  }

  // .js/ui/layout.js
  var layout_exports = {};
  __export(layout_exports, {
    init: () => init5,
    update: () => update3
  });

  // .js/layout/layout.js
  var Layout = class {
    constructor(id, label, childDirection = "right") {
      this.id = id;
      this.label = label;
      this.childDirection = childDirection;
      this.SPACING_CHILD = 4;
      repo2.set(this.id, this);
    }
    getChildDirection(_child) {
      return this.childDirection;
    }
    computeAlignment(item) {
      let direction = item.isRoot ? this.childDirection : item.parent.resolvedLayout.getChildDirection(item);
      if (direction == "left") {
        return "right";
      }
      return "left";
    }
    pick(item, dir) {
      var opposite = {
        left: "right",
        right: "left",
        top: "bottom",
        bottom: "top"
      };
      if (!item.isCollapsed()) {
        var children = item.children;
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (this.getChildDirection(child) == dir) {
            return child;
          }
        }
      }
      if (item.isRoot) {
        return item;
      }
      var parentLayout = item.parent.resolvedLayout;
      var thisChildDirection = parentLayout.getChildDirection(item);
      if (thisChildDirection == dir) {
        return item;
      } else if (thisChildDirection == opposite[dir]) {
        return item.parent;
      } else {
        return parentLayout.pickSibling(item, dir == "left" || dir == "top" ? -1 : 1);
      }
    }
    pickSibling(item, dir) {
      if (item.isRoot) {
        return item;
      }
      var children = item.parent.children;
      var index2 = children.indexOf(item);
      index2 += dir;
      index2 = (index2 + children.length) % children.length;
      return children[index2];
    }
    anchorToggle(item, point, side) {
      var node9 = item.dom.toggle;
      var w = node9.offsetWidth;
      var h = node9.offsetHeight;
      let [l, t] = point;
      switch (side) {
        case "left":
          t -= h / 2;
          l -= w;
          break;
        case "right":
          t -= h / 2;
          break;
        case "top":
          l -= w / 2;
          t -= h;
          break;
        case "bottom":
          l -= w / 2;
          break;
      }
      node9.style.left = Math.round(l) + "px";
      node9.style.top = Math.round(t) + "px";
    }
    getChildAnchor(item, side) {
      let { position, contentPosition, contentSize } = item;
      if (side == "left" || side == "right") {
        var pos = position[0] + contentPosition[0];
        if (side == "left") {
          pos += contentSize[0];
        }
      } else {
        var pos = position[1] + contentPosition[1];
        if (side == "top") {
          pos += contentSize[1];
        }
      }
      return pos;
    }
    computeChildrenBBox(children, childIndex) {
      var bbox = [0, 0];
      var rankIndex = (childIndex + 1) % 2;
      children.forEach((child) => {
        const { size } = child;
        bbox[rankIndex] = Math.max(bbox[rankIndex], size[rankIndex]);
        bbox[childIndex] += size[childIndex];
      });
      if (children.length > 1) {
        bbox[childIndex] += this.SPACING_CHILD * (children.length - 1);
      }
      return bbox;
    }
  };
  var repo2 = new Map();

  // .js/layout/graph.js
  var SPACING_RANK = 16;
  var R = SPACING_RANK / 2;
  var GraphLayout = class extends Layout {
    update(item) {
      this.layoutItem(item, this.childDirection);
      if (this.childDirection == "left" || this.childDirection == "right") {
        this.drawLinesHorizontal(item, this.childDirection);
      } else {
        this.drawLinesVertical(item, this.childDirection);
      }
    }
    layoutItem(item, rankDirection) {
      var rankIndex = rankDirection == "left" || rankDirection == "right" ? 0 : 1;
      var childIndex = (rankIndex + 1) % 2;
      const { contentSize } = item;
      var bbox = this.computeChildrenBBox(item.children, childIndex);
      var rankSize = contentSize[rankIndex];
      if (bbox[rankIndex]) {
        rankSize += bbox[rankIndex] + SPACING_RANK;
      }
      var childSize = Math.max(bbox[childIndex], contentSize[childIndex]);
      var offset = [0, 0];
      if (rankDirection == "right") {
        offset[0] = contentSize[0] + SPACING_RANK;
      }
      if (rankDirection == "bottom") {
        offset[1] = contentSize[1] + SPACING_RANK;
      }
      offset[childIndex] = Math.round((childSize - bbox[childIndex]) / 2);
      this.layoutChildren(item.children, rankDirection, offset, bbox);
      var labelPos = 0;
      if (rankDirection == "left") {
        labelPos = rankSize - contentSize[0];
      }
      if (rankDirection == "top") {
        labelPos = rankSize - contentSize[1];
      }
      let contentPosition = [Math.round((childSize - contentSize[childIndex]) / 2), labelPos];
      if (rankIndex == 0) {
        contentPosition = contentPosition.reverse();
      }
      item.contentPosition = contentPosition;
    }
    layoutChildren(children, rankDirection, offset, bbox) {
      var rankIndex = rankDirection == "left" || rankDirection == "right" ? 0 : 1;
      var childIndex = (rankIndex + 1) % 2;
      children.forEach((child) => {
        const { size } = child;
        if (rankDirection == "left") {
          offset[0] = bbox[0] - size[0];
        }
        if (rankDirection == "top") {
          offset[1] = bbox[1] - size[1];
        }
        child.position = offset;
        offset[childIndex] += size[childIndex] + this.SPACING_CHILD;
      });
      return bbox;
    }
    drawLinesHorizontal(item, side) {
      const { contentPosition, contentSize, resolvedShape, resolvedColor, children, dom } = item;
      if (children.length == 0) {
        return;
      }
      let itemAnchor = [
        contentPosition[0] + (side == "right" ? contentSize[0] + 0.5 : -0.5),
        resolvedShape.getVerticalAnchor(item)
      ];
      this.anchorToggle(item, itemAnchor, side);
      if (item.isCollapsed()) {
        return;
      }
      let d = [];
      if (children.length == 1) {
        var child = children[0];
        const { position, resolvedShape: resolvedShape2 } = child;
        let childAnchor = [
          this.getChildAnchor(child, side),
          resolvedShape2.getVerticalAnchor(child) + position[1]
        ];
        let mid = (itemAnchor[0] + childAnchor[0]) / 2;
        d.push(`M ${itemAnchor}`, `C ${[mid, itemAnchor[1]]} ${[mid, childAnchor[1]]} ${childAnchor}`);
        let path2 = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
        dom.connectors.append(path2);
        return;
      }
      let center = [
        itemAnchor[0] + (side == "left" ? -R : R),
        itemAnchor[1]
      ];
      d.push(`M ${itemAnchor}`, `L ${center}`);
      const firstChild = children[0];
      const lastChild = children[children.length - 1];
      const cornerEndX = center[0] + (side == "left" ? -R : R);
      const sweep = cornerEndX < center[0] ? 1 : 0;
      let firstAnchor = [
        this.getChildAnchor(firstChild, side),
        firstChild.resolvedShape.getVerticalAnchor(firstChild) + firstChild.position[1]
      ];
      let lastAnchor = [
        this.getChildAnchor(lastChild, side),
        lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1]
      ];
      d.push(`M ${firstAnchor}`, `L ${cornerEndX} ${firstAnchor[1]}`, `A ${R} ${R} 0 0 ${sweep} ${center[0]} ${firstAnchor[1] + R}`, `L ${center[0]} ${lastAnchor[1] - R}`, `A ${R} ${R} 0 0 ${sweep} ${cornerEndX} ${lastAnchor[1]}`, `L ${lastAnchor}`);
      for (let i = 1; i < children.length - 1; i++) {
        const c = children[i];
        const y = c.resolvedShape.getVerticalAnchor(c) + c.position[1];
        let lineStart = [center[0], y];
        let childAnchor = [this.getChildAnchor(c, side), y];
        d.push(`M ${lineStart}`, `L ${childAnchor}`);
      }
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
    drawLinesVertical(item, side) {
      const { contentSize, size, resolvedShape, resolvedColor, children, dom } = item;
      if (children.length == 0) {
        return;
      }
      const height = children.length == 1 ? 2 * R : R;
      let itemAnchor = [
        resolvedShape.getHorizontalAnchor(item),
        side == "top" ? size[1] - contentSize[1] : resolvedShape.getVerticalAnchor(item)
      ];
      let center = [
        itemAnchor[0],
        (side == "top" ? itemAnchor[1] - height : contentSize[1] + height) + 0.5
      ];
      this.anchorToggle(item, itemAnchor, side);
      if (item.isCollapsed()) {
        return;
      }
      let d = [];
      d.push(`M ${itemAnchor}`, `L ${center}`);
      if (children.length == 1) {
        let path2 = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
        dom.connectors.append(path2);
        return;
      }
      const firstChild = children[0];
      const lastChild = children[children.length - 1];
      const cornerEndY = center[1] + (side == "top" ? -R : R);
      const sweep = cornerEndY > center[1] ? 1 : 0;
      let firstAnchor = [
        firstChild.resolvedShape.getHorizontalAnchor(firstChild) + firstChild.position[0],
        this.getChildAnchor(firstChild, side)
      ];
      let lastAnchor = [
        lastChild.resolvedShape.getHorizontalAnchor(lastChild) + lastChild.position[0],
        this.getChildAnchor(lastChild, side)
      ];
      d.push(`M ${firstAnchor}`, `L ${firstAnchor[0]} ${cornerEndY}`, `A ${R} ${R} 0 0 ${sweep} ${firstAnchor[0] + R} ${center[1]}`, `L ${lastAnchor[0] - R} ${center[1]}`, `A ${R} ${R} 0 0 ${sweep} ${lastAnchor[0]} ${cornerEndY}`, `L ${lastAnchor}`);
      for (var i = 1; i < children.length - 1; i++) {
        const c = children[i];
        const x = c.resolvedShape.getHorizontalAnchor(c) + c.position[0];
        let lineStart = [x, center[1]];
        let childAnchor = [x, this.getChildAnchor(c, side)];
        d.push(`M ${lineStart}`, `L ${childAnchor}`);
      }
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
  };
  new GraphLayout("graph-bottom", "Bottom", "bottom");
  new GraphLayout("graph-top", "Top", "top");
  new GraphLayout("graph-left", "Left", "left");
  new GraphLayout("graph-right", "Right", "right");

  // .js/layout/tree.js
  var SPACING_RANK2 = 32;
  var R2 = SPACING_RANK2 / 4;
  var LINE_OFFSET = SPACING_RANK2 / 2;
  var TreeLayout = class extends Layout {
    update(item) {
      this.layoutItem(item, this.childDirection);
      this.drawLines(item, this.childDirection);
    }
    layoutItem(item, rankDirection) {
      const { contentSize, children } = item;
      let bbox = this.computeChildrenBBox(children, 1);
      let rankSize = contentSize[0];
      if (bbox[0]) {
        rankSize = Math.max(rankSize, bbox[0] + SPACING_RANK2);
      }
      let offset = [SPACING_RANK2, contentSize[1] + this.SPACING_CHILD];
      if (rankDirection == "left") {
        offset[0] = rankSize - bbox[0] - SPACING_RANK2;
      }
      this.layoutChildren(children, rankDirection, offset, bbox);
      let labelPos = 0;
      if (rankDirection == "left") {
        labelPos = rankSize - contentSize[0];
      }
      item.contentPosition = [labelPos, 0];
    }
    layoutChildren(children, rankDirection, offset, bbox) {
      children.forEach((child) => {
        const { size } = child;
        let left = offset[0];
        if (rankDirection == "left") {
          left += bbox[0] - size[0];
        }
        child.position = [left, offset[1]];
        offset[1] += size[1] + this.SPACING_CHILD;
      });
    }
    drawLines(item, side) {
      const { size, resolvedShape, resolvedColor, children, dom } = item;
      let pointAnchor = [
        (side == "left" ? size[0] - LINE_OFFSET : LINE_OFFSET) + 0.5,
        resolvedShape.getVerticalAnchor(item)
      ];
      this.anchorToggle(item, pointAnchor, "bottom");
      if (children.length == 0 || item.isCollapsed()) {
        return;
      }
      let lastChild = children[children.length - 1];
      let lineEnd = [
        pointAnchor[0],
        lastChild.resolvedShape.getVerticalAnchor(lastChild) + lastChild.position[1] - R2
      ];
      let d = [`M ${pointAnchor}`, `L ${lineEnd}`];
      let cornerEndX = lineEnd[0] + (side == "left" ? -R2 : R2);
      let sweep = cornerEndX < lineEnd[0] ? 1 : 0;
      children.forEach((child) => {
        const { resolvedShape: resolvedShape2, position } = child;
        const y = resolvedShape2.getVerticalAnchor(child) + position[1];
        d.push(`M ${pointAnchor[0]} ${y - R2}`, `A ${R2} ${R2} 0 0 ${sweep} ${cornerEndX} ${y}`, `L ${this.getChildAnchor(child, side)} ${y}`);
      });
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
  };
  new TreeLayout("tree-left", "Left", "left");
  new TreeLayout("tree-right", "Right", "right");

  // .js/layout/map.js
  var MapLayout = class extends GraphLayout {
    constructor() {
      super(...arguments);
      this.LINE_THICKNESS = 8;
    }
    update(item) {
      if (item.isRoot) {
        this.layoutRoot(item);
      } else {
        var side = this.getChildDirection(item);
        repo2.get(`graph-${side}`).update(item);
      }
    }
    getChildDirection(child) {
      while (!child.parent.isRoot) {
        child = child.parent;
      }
      var side = child.side;
      if (side) {
        return side;
      }
      var counts = { left: 0, right: 0 };
      var children = child.parent.children;
      for (var i = 0; i < children.length; i++) {
        var side = children[i].side;
        if (!side) {
          side = counts.right > counts.left ? "left" : "right";
          children[i].side = side;
        }
        counts[side]++;
      }
      return child.side;
    }
    pickSibling(item, dir) {
      if (item.isRoot) {
        return item;
      }
      const parent = item.parent;
      var children = parent.children;
      if (parent.isRoot) {
        var side = this.getChildDirection(item);
        children = children.filter((child) => this.getChildDirection(child) == side);
      }
      var index2 = children.indexOf(item);
      index2 += dir;
      index2 = (index2 + children.length) % children.length;
      return children[index2];
    }
    layoutRoot(item) {
      const { children, contentSize } = item;
      let childrenLeft = [];
      let childrenRight = [];
      let contentPosition = [0, 0];
      children.forEach((child) => {
        var side = this.getChildDirection(child);
        if (side == "left") {
          childrenLeft.push(child);
        } else {
          childrenRight.push(child);
        }
      });
      var bboxLeft = this.computeChildrenBBox(childrenLeft, 1);
      var bboxRight = this.computeChildrenBBox(childrenRight, 1);
      var height = Math.max(bboxLeft[1], bboxRight[1], contentSize[1]);
      var left = 0;
      this.layoutChildren(childrenLeft, "left", [left, Math.round((height - bboxLeft[1]) / 2)], bboxLeft);
      left += bboxLeft[0];
      if (childrenLeft.length) {
        left += SPACING_RANK;
      }
      contentPosition[0] = left;
      left += contentSize[0];
      if (childrenRight.length) {
        left += SPACING_RANK;
      }
      this.layoutChildren(childrenRight, "right", [left, Math.round((height - bboxRight[1]) / 2)], bboxRight);
      left += bboxRight[0];
      contentPosition[1] = Math.round((height - contentSize[1]) / 2);
      item.contentPosition = contentPosition;
      this.drawRootConnectors(item, "left", childrenLeft);
      this.drawRootConnectors(item, "right", childrenRight);
    }
    drawRootConnectors(item, side, children) {
      if (children.length == 0 || item.isCollapsed()) {
        return;
      }
      const { contentSize, contentPosition, resolvedShape, dom } = item;
      let x1 = contentPosition[0] + contentSize[0] / 2;
      let y1 = resolvedShape.getVerticalAnchor(item);
      const half = this.LINE_THICKNESS / 2;
      let paths = children.map((child) => {
        const { resolvedColor, resolvedShape: resolvedShape2, position } = child;
        let x2 = this.getChildAnchor(child, side);
        let y2 = resolvedShape2.getVerticalAnchor(child) + position[1];
        let angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        let dx = Math.cos(angle) * half;
        let dy = Math.sin(angle) * half;
        let d = [
          `M ${x1 - dx} ${y1 - dy}`,
          `Q ${(x2 + x1) / 2} ${y2} ${x2} ${y2}`,
          `Q ${(x2 + x1) / 2} ${y2} ${x1 + dx} ${y1 + dy}`,
          `Z`
        ];
        let attrs = {
          d: d.join(" "),
          fill: resolvedColor,
          stroke: resolvedColor
        };
        return node2("path", attrs);
      });
      dom.connectors.append(...paths);
    }
  };
  new MapLayout("map", "Map");

  // .js/ui/layout.js
  var select2 = document.querySelector("#layout");
  function init5() {
    let layout = repo2.get("map");
    select2.append(new Option(layout.label, layout.id));
    let label = buildGroup("Graph");
    let graphOptions = ["right", "left", "bottom", "top"].map((name) => {
      let layout2 = repo2.get(`graph-${name}`);
      return new Option(layout2.label, layout2.id);
    });
    label.append(...graphOptions);
    label = buildGroup("Tree");
    let treeOptions = ["right", "left"].map((name) => {
      let layout2 = repo2.get(`tree-${name}`);
      return new Option(layout2.label, layout2.id);
    });
    label.append(...treeOptions);
    select2.addEventListener("change", onChange2);
  }
  function update3() {
    var value = "";
    var layout = currentItem.layout;
    if (layout) {
      value = layout.id;
    }
    select2.value = value;
    getOption("").disabled = currentItem.isRoot;
    getOption("map").disabled = !currentItem.isRoot;
  }
  function onChange2() {
    var layout = repo2.get(select2.value);
    var action2 = new SetLayout(currentItem, layout);
    action(action2);
  }
  function getOption(value) {
    return select2.querySelector(`option[value="${value}"]`);
  }
  function buildGroup(label) {
    let node9 = document.createElement("optgroup");
    node9.label = label;
    select2.append(node9);
    return node9;
  }

  // .js/ui/icon.js
  var icon_exports = {};
  __export(icon_exports, {
    init: () => init6,
    update: () => update4
  });
  var select3 = document.querySelector("#icons");
  function init6() {
    select3.addEventListener("change", onChange3);
  }
  function update4() {
    select3.value = currentItem.icon || "";
  }
  function onChange3() {
    let action2 = new SetIcon(currentItem, select3.value || null);
    action(action2);
  }

  // .js/ui/shape.js
  var shape_exports = {};
  __export(shape_exports, {
    init: () => init7,
    update: () => update5
  });

  // .js/shape/shape.js
  var VERTICAL_OFFSET = 0.5;
  var Shape = class {
    constructor(id, label) {
      this.id = id;
      this.label = label;
      repo3.set(this.id, this);
    }
    update(item) {
      item.dom.content.style.borderColor = item.resolvedColor;
    }
    getHorizontalAnchor(item) {
      const { contentPosition, contentSize } = item;
      return Math.round(contentPosition[0] + contentSize[0] / 2) + 0.5;
    }
    getVerticalAnchor(item) {
      const { contentPosition, contentSize } = item;
      return contentPosition[1] + Math.round(contentSize[1] * VERTICAL_OFFSET) + 0.5;
    }
  };
  var repo3 = new Map();

  // .js/shape/box.js
  var Box = class extends Shape {
    constructor() {
      super("box", "Box");
    }
  };
  new Box();

  // .js/shape/ellipse.js
  var Ellipse = class extends Shape {
    constructor() {
      super("ellipse", "Ellipse");
    }
  };
  new Ellipse();

  // .js/shape/underline.js
  var VERTICAL_OFFSET2 = -3;
  var Underline = class extends Shape {
    constructor() {
      super("underline", "Underline");
    }
    update(item) {
      const { contentPosition, resolvedColor, contentSize, dom } = item;
      let left = contentPosition[0];
      let right = left + contentSize[0];
      let top = this.getVerticalAnchor(item);
      let d = [
        `M ${left} ${top}`,
        `L ${right} ${top}`
      ];
      let path = node2("path", { d: d.join(" "), stroke: resolvedColor, fill: "none" });
      dom.connectors.append(path);
    }
    getVerticalAnchor(item) {
      const { contentPosition, contentSize } = item;
      return contentPosition[1] + contentSize[1] + VERTICAL_OFFSET2 + 0.5;
    }
  };
  new Underline();

  // .js/ui/shape.js
  var select4 = document.querySelector("#shape");
  function init7() {
    repo3.forEach((shape) => {
      select4.append(new Option(shape.label, shape.id));
    });
    select4.addEventListener("change", onChange4);
  }
  function update5() {
    let value = "";
    let shape = currentItem.shape;
    if (shape) {
      value = shape.id;
    }
    select4.value = value;
  }
  function onChange4() {
    let shape = repo3.get(this._select.value);
    let action2 = new SetShape(currentItem, shape);
    action(action2);
  }

  // .js/ui/status.js
  var status_exports = {};
  __export(status_exports, {
    init: () => init8,
    update: () => update6
  });
  var select5 = document.querySelector("#status");
  var STATUS_MAP = {
    "yes": true,
    "no": false,
    "": null
  };
  function statusToString(status) {
    for (let key in STATUS_MAP) {
      if (STATUS_MAP[key] === status) {
        return key;
      }
    }
    return String(status);
  }
  function stringToStatus(str) {
    return str in STATUS_MAP ? STATUS_MAP[str] : str;
  }
  function init8() {
    select5.addEventListener("change", onChange5);
  }
  function update6() {
    select5.value = statusToString(currentItem.status);
  }
  function onChange5() {
    let status = stringToStatus(select5.value);
    let action2 = new SetStatus(currentItem, status);
    action(action2);
  }

  // .js/ui/tip.js
  var tip_exports = {};
  __export(tip_exports, {
    init: () => init9
  });
  var node6 = document.querySelector("#tip");
  function init9() {
    node6.addEventListener("click", hide);
    subscribe("command-child", hide);
    subscribe("command-sibling", hide);
  }
  function hide() {
    unsubscribe("command-child", hide);
    unsubscribe("command-sibling", hide);
    node6.removeEventListener("click", hide);
    node6.hidden = true;
  }

  // .js/ui/ui.js
  var node7 = document.querySelector(".ui");
  function isActive() {
    return node7.contains(document.activeElement);
  }
  function toggle3() {
    node7.hidden = !node7.hidden;
    publish("ui-change", this);
  }
  function getWidth() {
    return node7.hidden ? 0 : node7.offsetWidth;
  }
  function update7() {
    [layout_exports, shape_exports, icon_exports, value_exports, status_exports].forEach((ui5) => ui5.update());
  }
  function onClick2(e) {
    let target = e.target;
    if (target == node7.querySelector("#toggle")) {
      toggle3();
      return;
    }
    let current2 = target;
    while (current2 != document) {
      let command = current2.dataset.command;
      if (command) {
        repo.get(command).execute();
        return;
      }
      current2 = current2.parentNode;
    }
  }
  function init10() {
    [
      layout_exports,
      shape_exports,
      icon_exports,
      value_exports,
      status_exports,
      color_exports,
      help_exports,
      tip_exports,
      notes_exports
    ].forEach((ui5) => ui5.init());
    subscribe("item-select", update7);
    subscribe("item-change", (_message, publisher) => {
      if (publisher == currentItem) {
        update7();
      }
    });
    node7.addEventListener("click", onClick2);
  }

  // .js/command/command.js
  var PAN_AMOUNT = 15;
  function isMac() {
    return !!navigator.platform.match(/mac/i);
  }
  var repo = new Map();
  var Command = class {
    constructor(id, label) {
      this.label = label;
      this.editMode = false;
      repo.set(id, this);
    }
    get isValid() {
      return this.editMode === null || this.editMode == editing;
    }
  };
  new class Notes extends Command {
    constructor() {
      super("notes", "Notes");
      this.keys = [{ keyCode: "M".charCodeAt(0), ctrlKey: true }];
    }
    execute() {
      toggle2();
    }
  }();
  new class Undo extends Command {
    constructor() {
      super("undo", "Undo");
      this.keys = [{ keyCode: "Z".charCodeAt(0), ctrlKey: true }];
    }
    get isValid() {
      return super.isValid && canBack();
    }
    execute() {
      back();
    }
  }();
  new class Redo extends Command {
    constructor() {
      super("redo", "Redo");
      this.keys = [{ keyCode: "Y".charCodeAt(0), ctrlKey: true }];
    }
    get isValid() {
      return super.isValid && canForward();
    }
    execute() {
      forward();
    }
  }();
  new class InsertSibling extends Command {
    constructor() {
      super("insert-sibling", "Insert a sibling");
      this.keys = [{ keyCode: 13 }];
    }
    execute() {
      let item = currentItem;
      let action2;
      if (item.isRoot) {
        action2 = new InsertNewItem(item, item.children.length);
      } else {
        let parent = item.parent;
        let index2 = parent.children.indexOf(item);
        action2 = new InsertNewItem(parent, index2 + 1);
      }
      action(action2);
      repo.get("edit").execute();
      publish("command-sibling");
    }
  }();
  new class InsertChild extends Command {
    constructor() {
      super("insert-child", "Insert a child");
      this.keys = [
        { keyCode: 9, ctrlKey: false },
        { keyCode: 45 }
      ];
    }
    execute() {
      let item = currentItem;
      let action2 = new InsertNewItem(item, item.children.length);
      action(action2);
      repo.get("edit").execute();
      publish("command-child");
    }
  }();
  new class Delete extends Command {
    constructor() {
      super("delete", "Delete an item");
      this.keys = [{ keyCode: isMac() ? 8 : 46 }];
    }
    get isValid() {
      return super.isValid && !currentItem.isRoot;
    }
    execute() {
      let action2 = new RemoveItem(currentItem);
      action(action2);
    }
  }();
  new class Swap2 extends Command {
    constructor() {
      super("swap", "Swap sibling");
      this.keys = [
        { keyCode: 38, ctrlKey: true },
        { keyCode: 40, ctrlKey: true }
      ];
    }
    execute(e) {
      let current2 = currentItem;
      if (current2.isRoot || current2.parent.children.length < 2) {
        return;
      }
      let diff = e.keyCode == 38 ? -1 : 1;
      let action2 = new Swap(current2, diff);
      action(action2);
    }
  }();
  new class SetSide2 extends Command {
    constructor() {
      super("side", "Change side");
      this.keys = [
        { keyCode: 37, ctrlKey: true },
        { keyCode: 39, ctrlKey: true }
      ];
    }
    execute(e) {
      let current2 = currentItem;
      if (current2.isRoot || !current2.parent.isRoot) {
        return;
      }
      let side = e.keyCode == 37 ? "left" : "right";
      let action2 = new SetSide(currentItem, side);
      action(action2);
    }
  }();
  new class Save extends Command {
    constructor() {
      super("save", "Save map");
      this.keys = [{ keyCode: "S".charCodeAt(0), ctrlKey: true, shiftKey: false }];
    }
    execute() {
      MM.App.io.quickSave();
    }
  }();
  new class SaveAs extends Command {
    constructor() {
      super("save-as", "Save as\u2026");
      this.keys = [{ keyCode: "S".charCodeAt(0), ctrlKey: true, shiftKey: true }];
    }
    execute() {
      MM.App.io.show("save");
    }
  }();
  new class Load extends Command {
    constructor() {
      super("load", "Load map");
      this.keys = [{ keyCode: "O".charCodeAt(0), ctrlKey: true }];
    }
    execute() {
      MM.App.io.show("load");
    }
  }();
  new class Center extends Command {
    constructor() {
      super("center", "Center map");
      this.keys = [{ keyCode: 35 }];
    }
    execute() {
      currentMap.center();
    }
  }();
  new class New extends Command {
    constructor() {
      super("new", "New map");
      this.keys = [{ keyCode: "N".charCodeAt(0), ctrlKey: true }];
    }
    execute() {
      if (!confirm("Throw away your current map and start a new one?")) {
        return;
      }
      showMap(new Map2());
      publish("map-new", this);
    }
  }();
  new class ZoomIn extends Command {
    constructor() {
      super("zoom-in", "Zoom in");
      this.keys = [{ charCode: "+".charCodeAt(0) }];
    }
    execute() {
      adjustFontSize(1);
    }
  }();
  new class ZoomOut extends Command {
    constructor() {
      super("zoom-out", "Zoom out");
      this.keys = [{ charCode: "-".charCodeAt(0) }];
    }
    execute() {
      adjustFontSize(-1);
    }
  }();
  new class Help extends Command {
    constructor() {
      super("help", "Show/hide help");
      this.keys = [{ charCode: "?".charCodeAt(0) }];
    }
    execute() {
      toggle();
    }
  }();
  new class UI extends Command {
    constructor() {
      super("ui", "Show/hide UI");
      this.keys = [{ charCode: "*".charCodeAt(0) }];
    }
    execute() {
      toggle3();
    }
  }();
  new class Pan extends Command {
    constructor() {
      super("pan", "Pan the map");
      this.keys = [
        { keyCode: "W".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false },
        { keyCode: "A".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false },
        { keyCode: "S".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false },
        { keyCode: "D".charCodeAt(0), ctrlKey: false, altKey: false, metaKey: false }
      ];
      this.chars = [];
    }
    execute(e) {
      var ch = String.fromCharCode(e.keyCode);
      var index2 = this.chars.indexOf(ch);
      if (index2 > -1) {
        return;
      }
      if (!this.chars.length) {
        window.addEventListener("keyup", this);
        this.interval = setInterval(() => this.step(), 50);
      }
      this.chars.push(ch);
      this.step();
    }
    step() {
      const dirs = {
        "W": [0, 1],
        "A": [1, 0],
        "S": [0, -1],
        "D": [-1, 0]
      };
      let offset = [0, 0];
      this.chars.forEach((ch) => {
        offset[0] += dirs[ch][0] * PAN_AMOUNT;
        offset[1] += dirs[ch][1] * PAN_AMOUNT;
      });
      currentMap.moveBy(offset);
    }
    handleEvent(e) {
      var ch = String.fromCharCode(e.keyCode);
      var index2 = this.chars.indexOf(ch);
      if (index2 > -1) {
        this.chars.splice(index2, 1);
        if (!this.chars.length) {
          window.removeEventListener("keyup", this);
          clearInterval(this.interval);
        }
      }
    }
  }();
  new class Fold extends Command {
    constructor() {
      super("fold", "Fold/Unfold");
      this.keys = [{ charCode: "f".charCodeAt(0), ctrlKey: false }];
    }
    execute() {
      let item = currentItem;
      if (item.isCollapsed()) {
        item.expand();
      } else {
        item.collapse();
      }
      currentMap.ensureItemVisibility(item);
    }
  }();

  // .js/item.js
  var COLOR = "#999";
  var RE = /\b(([a-z][\w-]+:\/\/\w)|(([\w-]+\.){2,}[a-z][\w-]+)|([\w-]+\.[a-z][\w-]+\/))[^\s]*([^\s,.;:?!<>\(\)\[\]'"])?($|\b)/i;
  var UPDATE_OPTIONS = {
    parent: true,
    children: false
  };
  var Item = class {
    constructor() {
      this._id = generateId();
      this._parent = null;
      this._collapsed = false;
      this._icon = null;
      this._notes = null;
      this._value = null;
      this._status = null;
      this._color = null;
      this._side = null;
      this._shape = null;
      this._layout = null;
      this.originalText = "";
      this.dom = {
        node: group(),
        connectors: group(),
        content: node("div"),
        notes: node("div"),
        status: node("span"),
        icon: node("span"),
        value: node("span"),
        text: node("div"),
        toggle: node("div")
      };
      this.children = [];
      const { dom } = this;
      dom.node.classList.add("item");
      dom.content.classList.add("content");
      dom.notes.classList.add("notes-indicator");
      dom.status.classList.add("status");
      dom.icon.classList.add("icon");
      dom.value.classList.add("value");
      dom.text.classList.add("text");
      dom.toggle.classList.add("toggle");
      dom.icon.classList.add("icon");
      let foContent = foreignObject();
      dom.node.append(dom.connectors, foContent);
      foContent.append(dom.content);
      dom.content.append(dom.status, dom.value, dom.icon, dom.text, dom.notes);
      dom.toggle.addEventListener("click", this);
    }
    static fromJSON(data) {
      return new this().fromJSON(data);
    }
    get id() {
      return this._id;
    }
    get parent() {
      return this._parent;
    }
    set parent(parent) {
      this._parent = parent;
      this.update({ children: true });
    }
    get size() {
      const bbox = this.dom.node.getBBox();
      return [bbox.width, bbox.height];
    }
    get position() {
      const { node: node9 } = this.dom;
      const transform = node9.getAttribute("transform");
      return transform.match(/\d+/g).map(Number);
    }
    set position(position) {
      const { node: node9 } = this.dom;
      const transform = `translate(${position.join(" ")})`;
      node9.setAttribute("transform", transform);
    }
    get contentSize() {
      const { content } = this.dom;
      const fo = content.parentNode;
      return [fo.getAttribute("width"), fo.getAttribute("height")].map(Number);
    }
    get contentPosition() {
      const { content } = this.dom;
      const fo = content.parentNode;
      return [fo.getAttribute("x"), fo.getAttribute("y")].map(Number);
    }
    set contentPosition(position) {
      const { content } = this.dom;
      const fo = content.parentNode;
      fo.setAttribute("x", String(position[0]));
      fo.setAttribute("y", String(position[1]));
    }
    toJSON() {
      let data = {
        id: this.id,
        text: this.text,
        notes: this.notes
      };
      if (this._side) {
        data.side = this._side;
      }
      if (this._color) {
        data.color = this._color;
      }
      if (this._icon) {
        data.icon = this._icon;
      }
      if (this._value) {
        data.value = this._value;
      }
      if (this._status) {
        data.status = this._status;
      }
      if (this._layout) {
        data.layout = this._layout.id;
      }
      if (this._shape) {
        data.shape = this._shape.id;
      }
      if (this._collapsed) {
        data.collapsed = 1;
      }
      if (this.children.length) {
        data.children = this.children.map((child) => child.toJSON());
      }
      return data;
    }
    fromJSON(data) {
      this.text = data.text;
      if (data.id) {
        this._id = data.id;
      }
      if (data.notes) {
        this.notes = data.notes;
      }
      if (data.side) {
        this._side = data.side;
      }
      if (data.color) {
        this._color = data.color;
      }
      if (data.icon) {
        this._icon = data.icon;
      }
      if (data.value) {
        this._value = data.value;
      }
      if (data.status) {
        if (data.status == "yes") {
          this._status = true;
        } else if (data.status == "no") {
          this._status = false;
        } else {
          this._status = data.status;
        }
      }
      if (data.collapsed) {
        this.collapse();
      }
      if (data.layout) {
        this._layout = repo2.get(data.layout);
      }
      if (data.shape) {
        this.shape = repo3.get(data.shape);
      }
      (data.children || []).forEach((child) => {
        this.insertChild(Item.fromJSON(child));
      });
      return this;
    }
    mergeWith(data) {
      var dirty = 0;
      if (this.text != data.text && !this.dom.text.contentEditable) {
        this.text = data.text;
      }
      if (this._side != data.side) {
        this._side = data.side;
        dirty = 1;
      }
      if (this._color != data.color) {
        this._color = data.color;
        dirty = 2;
      }
      if (this._icon != data.icon) {
        this._icon = data.icon;
        dirty = 1;
      }
      if (this._value != data.value) {
        this._value = data.value;
        dirty = 1;
      }
      if (this._status != data.status) {
        this._status = data.status;
        dirty = 1;
      }
      if (this._collapsed != !!data.collapsed) {
        this[this._collapsed ? "expand" : "collapse"]();
      }
      if (this.layout != data.layout) {
        this._layout = repo2.get(data.layout);
        dirty = 2;
      }
      if (this.shape != data.shape) {
        this.shape = repo3.get(data.shape);
      }
      (data.children || []).forEach((child, index2) => {
        if (index2 >= this.children.length) {
          this.insertChild(Item.fromJSON(child));
        } else {
          var myChild = this.children[index2];
          if (myChild.id == child.id) {
            myChild.mergeWith(child);
          } else {
            this.removeChild(this.children[index2]);
            this.insertChild(Item.fromJSON(child), index2);
          }
        }
      });
      var newLength = (data.children || []).length;
      while (this.children.length > newLength) {
        this.removeChild(this.children[this.children.length - 1]);
      }
      if (dirty == 1) {
        this.update({ children: false });
      }
      if (dirty == 2) {
        this.update({ children: true });
      }
    }
    clone() {
      var data = this.toJSON();
      var removeId = function(obj) {
        delete obj.id;
        obj.children && obj.children.forEach(removeId);
      };
      removeId(data);
      return Item.fromJSON(data);
    }
    select() {
      this.dom.node.classList.add("current");
      if (window.editor) {
        if (this.notes) {
          window.editor.setContent(this.notes);
        } else {
          window.editor.setContent("");
        }
      }
      this.map.ensureItemVisibility(this);
      publish("item-select", this);
    }
    deselect() {
      this.dom.node.classList.remove("current");
    }
    update(options = {}) {
      options = Object.assign({}, UPDATE_OPTIONS, options);
      const { map, children, parent } = this;
      if (!map || !map.isVisible) {
        return;
      }
      if (options.children) {
        let childUpdateOptions = { parent: false, children: true };
        children.forEach((child) => child.update(childUpdateOptions));
      }
      publish("item-change", this);
      this.updateStatus();
      this.updateIcon();
      this.updateValue();
      const { resolvedLayout, resolvedShape, dom } = this;
      dom.notes.classList.toggle("notes-indicator-visible", !!this.notes);
      dom.node.classList.toggle("collapsed", this._collapsed);
      dom.node.dataset.shape = resolvedShape.id;
      dom.node.dataset.align = resolvedLayout.computeAlignment(this);
      let fo = dom.content.parentNode;
      fo.setAttribute("width", String(dom.content.offsetWidth));
      fo.setAttribute("height", String(dom.content.offsetHeight));
      dom.connectors.innerHTML = "";
      resolvedLayout.update(this);
      resolvedShape.update(this);
      if (options.parent) {
        parent.update({ children: false });
      }
    }
    get text() {
      return this.dom.text.innerHTML;
    }
    set text(text) {
      this.dom.text.innerHTML = text;
      findLinks(this.dom.text);
      this.update();
    }
    get notes() {
      return this._notes;
    }
    set notes(notes3) {
      this._notes = notes3;
      this.update();
    }
    collapse() {
      if (this._collapsed) {
        return;
      }
      this._collapsed = true;
      this.update();
    }
    expand() {
      if (!this._collapsed) {
        return;
      }
      this._collapsed = false;
      this.update();
      this.update({ children: true });
    }
    isCollapsed() {
      return this._collapsed;
    }
    get value() {
      return this._value;
    }
    set value(value) {
      this._value = value;
      this.update();
    }
    get resolvedValue() {
      const value = this._value;
      if (typeof value == "number") {
        return value;
      }
      let childValues = this.children.map((child) => child.resolvedValue);
      switch (value) {
        case "max":
          return Math.max(...childValues);
          break;
        case "min":
          return Math.min(...childValues);
          break;
        case "sum":
          return childValues.reduce((prev, cur) => prev + cur, 0);
          break;
        case "avg":
          var sum = childValues.reduce((prev, cur) => prev + cur, 0);
          return childValues.length ? sum / childValues.length : 0;
          break;
        default:
          return 0;
          break;
      }
    }
    get status() {
      return this._status;
    }
    set status(status) {
      this._status = status;
      this.update();
    }
    get resolvedStatus() {
      let status = this._status;
      if (status == "computed") {
        return this.children.every((child) => {
          return child.resolvedStatus !== false;
        });
      } else {
        return status;
      }
    }
    get icon() {
      return this._icon;
    }
    set icon(icon) {
      this._icon = icon;
      this.update();
    }
    get side() {
      return this._side;
    }
    set side(side) {
      this._side = side;
    }
    get color() {
      return this._color;
    }
    set color(color) {
      this._color = color;
      this.update({ children: true });
    }
    get resolvedColor() {
      if (this._color) {
        return this._color;
      }
      const { parent } = this;
      if (parent instanceof Item) {
        return parent.resolvedColor;
      }
      return COLOR;
    }
    get layout() {
      return this._layout;
    }
    set layout(layout) {
      this._layout = layout;
      this.update({ children: true });
    }
    get resolvedLayout() {
      if (this._layout) {
        return this._layout;
      }
      const { parent } = this;
      if (!(parent instanceof Item)) {
        throw new Error("Non-connected item does not have layout");
      }
      return parent.resolvedLayout;
    }
    get shape() {
      return this._shape;
    }
    set shape(shape) {
      this._shape = shape;
      this.update();
    }
    get resolvedShape() {
      if (this._shape) {
        return this._shape;
      }
      let depth = 0;
      let node9 = this;
      while (!node9.isRoot) {
        depth++;
        node9 = node9.parent;
      }
      switch (depth) {
        case 0:
          return repo3.get("ellipse");
        case 1:
          return repo3.get("box");
        default:
          return repo3.get("underline");
      }
    }
    get map() {
      let item = this.parent;
      while (item) {
        if (item instanceof Map2) {
          return item;
        }
        item = item.parent;
      }
      return null;
    }
    get isRoot() {
      return this.parent instanceof Map2;
    }
    insertChild(child, index2) {
      if (!child) {
        child = new Item();
      } else if (child.parent && child.parent instanceof Item) {
        child.parent.removeChild(child);
      }
      if (!this.children.length) {
        this.dom.node.appendChild(this.dom.toggle);
      }
      if (arguments.length < 2) {
        index2 = this.children.length;
      }
      var next = null;
      if (index2 < this.children.length) {
        next = this.children[index2].dom.node;
      }
      this.dom.node.insertBefore(child.dom.node, next);
      this.children.splice(index2, 0, child);
      child.parent = this;
    }
    removeChild(child) {
      var index2 = this.children.indexOf(child);
      this.children.splice(index2, 1);
      var node9 = child.dom.node;
      node9.parentNode.removeChild(node9);
      child.parent = null;
      if (!this.children.length) {
        this.dom.toggle.parentNode.removeChild(this.dom.toggle);
      }
      this.update();
    }
    startEditing() {
      this.originalText = this.text;
      this.dom.text.contentEditable = "true";
      this.dom.text.focus();
      document.execCommand("styleWithCSS", null, "false");
      this.dom.text.addEventListener("input", this);
      this.dom.text.addEventListener("keydown", this);
      this.dom.text.addEventListener("blur", this);
    }
    stopEditing() {
      this.dom.text.removeEventListener("input", this);
      this.dom.text.removeEventListener("keydown", this);
      this.dom.text.removeEventListener("blur", this);
      this.dom.text.blur();
      this.dom.text.contentEditable = "false";
      var result = this.dom.text.innerHTML;
      this.dom.text.innerHTML = this.originalText;
      this.originalText = "";
      this.update();
      return result;
    }
    handleEvent(e) {
      switch (e.type) {
        case "input":
          this.update();
          this.map.ensureItemVisibility(this);
          break;
        case "keydown":
          if (e.keyCode == 9) {
            e.preventDefault();
          }
          break;
        case "blur":
          repo.get("finish").execute();
          break;
        case "click":
          if (this._collapsed) {
            this.expand();
          } else {
            this.collapse();
          }
          selectItem(this);
          break;
      }
    }
    updateStatus() {
      const { resolvedStatus, dom } = this;
      dom.status.className = "status";
      dom.status.hidden = false;
      switch (resolvedStatus) {
        case true:
          dom.status.classList.add("yes");
          break;
        case false:
          dom.status.classList.add("no");
          break;
        default:
          dom.status.hidden = true;
          break;
      }
    }
    updateIcon() {
      var icon = this._icon;
      this.dom.icon.className = "icon";
      this.dom.icon.hidden = !icon;
      if (icon) {
        this.dom.icon.classList.add("fa");
        this.dom.icon.classList.add(icon);
      }
    }
    updateValue() {
      const { dom, _value } = this;
      if (_value === null) {
        dom.value.hidden = true;
        return;
      }
      dom.value.hidden = false;
      if (typeof _value == "number") {
        dom.value.textContent = String(_value);
      } else {
        let resolved = this.resolvedValue;
        dom.value.textContent = String(Math.round(resolved) == resolved ? resolved : resolved.toFixed(3));
      }
    }
  };
  function findLinks(node9) {
    var children = [].slice.call(node9.childNodes);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      switch (child.nodeType) {
        case 1:
          if (child.nodeName.toLowerCase() == "a") {
            continue;
          }
          findLinks(child);
          break;
        case 3:
          var result = child.nodeValue.match(RE);
          if (result) {
            var before = child.nodeValue.substring(0, result.index);
            var after = child.nodeValue.substring(result.index + result[0].length);
            var link = document.createElement("a");
            link.innerHTML = link.href = result[0];
            if (before) {
              node9.insertBefore(document.createTextNode(before), child);
            }
            node9.insertBefore(link, child);
            if (after) {
              child.nodeValue = after;
              i--;
            } else {
              node9.removeChild(child);
            }
          }
          break;
      }
    }
  }
  function generateId() {
    let str = "";
    for (var i = 0; i < 8; i++) {
      let code = Math.floor(Math.random() * 26);
      str += String.fromCharCode("a".charCodeAt(0) + code);
    }
    return str;
  }
  MM.Item = Item;

  // .js/map.js
  var UPDATE_OPTIONS2 = {
    children: true
  };
  var Map2 = class {
    constructor(options) {
      this.node = node2("svg");
      this.position = [0, 0];
      options = Object.assign({
        root: "My Mind Map",
        layout: repo2.get("map")
      }, options);
      let root = new Item();
      root.text = options.root;
      root.layout = options.layout;
      this.root = root;
    }
    static fromJSON(data) {
      return new this().fromJSON(data);
    }
    toJSON() {
      let data = {
        root: this._root.toJSON()
      };
      return data;
    }
    fromJSON(data) {
      this.root = Item.fromJSON(data.root);
      return this;
    }
    get root() {
      return this._root;
    }
    set root(root) {
      const { node: node9 } = this;
      this._root = root;
      node9.innerHTML = "";
      node9.append(root.dom.node);
      root.parent = this;
    }
    mergeWith(data) {
      var ids = [];
      var current2 = currentItem;
      var node9 = current2;
      while (true) {
        ids.push(node9.id);
        if (node9.parent == this) {
          break;
        }
        node9 = node9.parent;
      }
      this._root.mergeWith(data.root);
      if (current2.map) {
        let node10 = current2;
        let hidden = false;
        while (true) {
          if (node10.parent == this) {
            break;
          }
          node10 = node10.parent;
          if (node10.isCollapsed()) {
            hidden = true;
          }
        }
        if (!hidden) {
          return;
        }
      }
      editing && stopEditing();
      var idMap = {};
      var scan = function(item) {
        idMap[item.id] = item;
        item.children.forEach(scan);
      };
      scan(this._root);
      while (ids.length) {
        var id = ids.shift();
        if (id in idMap) {
          selectItem(idMap[id]);
          return;
        }
      }
    }
    get isVisible() {
      return !!this.node.parentNode;
    }
    update(options) {
      options = Object.assign({}, UPDATE_OPTIONS2, options);
      options.children && this._root.update({ parent: false, children: true });
      const { node: node9 } = this;
      const { size } = this._root;
      node9.setAttribute("width", String(size[0]));
      node9.setAttribute("height", String(size[1]));
    }
    show(where) {
      where.append(this.node);
      this.update();
      this.center();
      selectItem(this._root);
    }
    hide() {
      this.node.remove();
    }
    center() {
      let { size } = this._root;
      let parent = this.node.parentNode;
      let position = [
        (parent.offsetWidth - size[0]) / 2,
        (parent.offsetHeight - size[1]) / 2
      ].map(Math.round);
      this.moveTo(position);
    }
    moveBy(diff) {
      let position = this.position.map((p, i) => p + diff[i]);
      return this.moveTo(position);
    }
    getClosestItem(point) {
      let all = [];
      function scan(item) {
        let rect = item.dom.content.getBoundingClientRect();
        let dx = rect.left + rect.width / 2 - point[0];
        let dy = rect.top + rect.height / 2 - point[1];
        let distance = dx * dx + dy * dy;
        all.push({ dx, dy, item, distance });
        if (!item.isCollapsed()) {
          item.children.forEach(scan);
        }
      }
      scan(this._root);
      all.sort((a, b) => a.distance - b.distance);
      return all[0];
    }
    getItemFor(node9) {
      let content = node9.closest(".content");
      if (!content) {
        return null;
      }
      function scanForContent(item) {
        if (item.dom.content == content) {
          return item;
        }
        for (let child of item.children) {
          let found = scanForContent(child);
          if (found) {
            return found;
          }
        }
        return null;
      }
      return scanForContent(this._root);
    }
    ensureItemVisibility(item) {
      const padding = 10;
      let itemRect = item.dom.content.getBoundingClientRect();
      var parentRect = this.node.parentNode.getBoundingClientRect();
      var delta = [0, 0];
      var dx = parentRect.left - itemRect.left + padding;
      if (dx > 0) {
        delta[0] = dx;
      }
      var dx = parentRect.right - itemRect.right - padding;
      if (dx < 0) {
        delta[0] = dx;
      }
      var dy = parentRect.top - itemRect.top + padding;
      if (dy > 0) {
        delta[1] = dy;
      }
      var dy = parentRect.bottom - itemRect.bottom - padding;
      if (dy < 0) {
        delta[1] = dy;
      }
      if (delta[0] || delta[1]) {
        this.moveBy(delta);
      }
    }
    get name() {
      let name = this._root.text;
      return MM.Format.br2nl(name).replace(/\n/g, " ").replace(/<.*?>/g, "").trim();
    }
    get id() {
      return this._root.id;
    }
    pick(item, direction) {
      var candidates = [];
      var currentRect = item.dom.content.getBoundingClientRect();
      this._getPickCandidates(currentRect, this._root, direction, candidates);
      if (!candidates.length) {
        return item;
      }
      candidates.sort((a, b) => a.dist - b.dist);
      return candidates[0].item;
    }
    _getPickCandidates(currentRect, item, direction, candidates) {
      if (!item.isCollapsed()) {
        item.children.forEach(function(child) {
          this._getPickCandidates(currentRect, child, direction, candidates);
        }, this);
      }
      var node9 = item.dom.content;
      var rect = node9.getBoundingClientRect();
      if (direction == "left" || direction == "right") {
        var x1 = currentRect.left + currentRect.width / 2;
        var x2 = rect.left + rect.width / 2;
        if (direction == "left" && x2 > x1) {
          return;
        }
        if (direction == "right" && x2 < x1) {
          return;
        }
        var diff1 = currentRect.top - rect.bottom;
        var diff2 = rect.top - currentRect.bottom;
        var dist = Math.abs(x2 - x1);
      } else {
        var y1 = currentRect.top + currentRect.height / 2;
        var y2 = rect.top + rect.height / 2;
        if (direction == "top" && y2 > y1) {
          return;
        }
        if (direction == "bottom" && y2 < y1) {
          return;
        }
        var diff1 = currentRect.left - rect.right;
        var diff2 = rect.left - currentRect.right;
        var dist = Math.abs(y2 - y1);
      }
      var diff = Math.max(diff1, diff2);
      if (diff > 0) {
        return;
      }
      if (!dist || dist < diff) {
        return;
      }
      candidates.push({ item, dist });
    }
    moveTo(point) {
      this.position = point;
      this.node.style.left = `${point[0]}px`;
      this.node.style.top = `${point[1]}px`;
    }
  };

  // .js/ui/backend/ui.backend.js
  MM.UI.Backend = Object.create(MM.Repo);
  MM.UI.Backend.init = function(select6) {
    this._backend = MM.Backend.getById(this.id);
    this._mode = "";
    this._prefix = "mm.app." + this.id + ".";
    this._node = document.querySelector("#" + this.id);
    this._cancel = this._node.querySelector(".cancel");
    this._cancel.addEventListener("click", this);
    this._go = this._node.querySelector(".go");
    this._go.addEventListener("click", this);
    select6.appendChild(this._backend.buildOption());
  };
  MM.UI.Backend.reset = function() {
    this._backend.reset();
  };
  MM.UI.Backend.setState = function(data) {
  };
  MM.UI.Backend.getState = function() {
    return null;
  };
  MM.UI.Backend.handleEvent = function(e) {
    switch (e.target) {
      case this._cancel:
        MM.App.io.hide();
        break;
      case this._go:
        this._action();
        break;
    }
  };
  MM.UI.Backend.save = function() {
  };
  MM.UI.Backend.load = function() {
  };
  MM.UI.Backend.show = function(mode2) {
    this._mode = mode2;
    this._go.innerHTML = mode2.charAt(0).toUpperCase() + mode2.substring(1);
    [...this._node.querySelectorAll("[data-for]")].forEach((node9) => node9.hidden = true);
    [...this._node.querySelectorAll(`[data-for~=${mode2}]`)].forEach((node9) => node9.hidden = false);
    this._go.focus();
  };
  MM.UI.Backend._action = function() {
    switch (this._mode) {
      case "save":
        this.save();
        break;
      case "load":
        this.load();
        break;
    }
  };
  MM.UI.Backend._saveDone = function() {
    setThrobber(false);
    publish("save-done", this);
  };
  MM.UI.Backend._loadDone = function(json) {
    setThrobber(false);
    try {
      showMap(Map2.fromJSON(json));
      publish("load-done", this);
    } catch (e) {
      this._error(e);
    }
  };
  MM.UI.Backend._error = function(e) {
    setThrobber(false);
    alert("IO error: " + e.message);
  };
  MM.UI.Backend._buildList = function(list, select6) {
    var data = [];
    for (var id in list) {
      data.push({ id, name: list[id] });
    }
    data.sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });
    data.forEach(function(item) {
      var o = document.createElement("option");
      o.value = item.id;
      o.innerHTML = item.name;
      select6.appendChild(o);
    });
  };

  // .js/ui/backend/ui.backend.file.js
  MM.UI.Backend.File = Object.create(MM.UI.Backend, {
    id: { value: "file" }
  });
  MM.UI.Backend.File.init = function(select6) {
    MM.UI.Backend.init.call(this, select6);
    this._format = this._node.querySelector(".format");
    this._format.appendChild(MM.Format.JSON.buildOption());
    this._format.appendChild(MM.Format.FreeMind.buildOption());
    this._format.appendChild(MM.Format.MMA.buildOption());
    this._format.appendChild(MM.Format.Mup.buildOption());
    this._format.appendChild(MM.Format.Plaintext.buildOption());
    this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
  };
  MM.UI.Backend.File.show = function(mode2) {
    MM.UI.Backend.show.call(this, mode2);
    this._go.innerHTML = mode2 == "save" ? "Save" : "Browse";
  };
  MM.UI.Backend.File._action = function() {
    localStorage.setItem(this._prefix + "format", this._format.value);
    MM.UI.Backend._action.call(this);
  };
  MM.UI.Backend.File.save = function() {
    var format = MM.Format.getById(this._format.value);
    var json = app.currentMap.toJSON();
    var data = format.to(json);
    var name = app.currentMap.name + "." + format.extension;
    this._backend.save(data, name).then(this._saveDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.File.load = function() {
    this._backend.load().then(this._loadDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.File._loadDone = function(data) {
    try {
      var format = MM.Format.getByName(data.name) || MM.Format.JSON;
      var json = format.from(data.data);
    } catch (e) {
      this._error(e);
    }
    MM.UI.Backend._loadDone.call(this, json);
  };

  // .js/ui/backend/ui.backend.webdav.js
  MM.UI.Backend.WebDAV = Object.create(MM.UI.Backend, {
    id: { value: "webdav" }
  });
  MM.UI.Backend.WebDAV.init = function(select6) {
    MM.UI.Backend.init.call(this, select6);
    this._url = this._node.querySelector(".url");
    this._url.value = localStorage.getItem(this._prefix + "url") || "";
    this._current = "";
  };
  MM.UI.Backend.WebDAV.getState = function() {
    var data = {
      url: this._current
    };
    return data;
  };
  MM.UI.Backend.WebDAV.setState = function(data) {
    this.load(data.url);
  };
  MM.UI.Backend.WebDAV.save = async function() {
    setThrobber(true);
    var map = currentMap;
    var url = this._url.value;
    localStorage.setItem(this._prefix + "url", url);
    if (url.match(/\.mymind$/)) {
    } else {
      if (url.charAt(url.length - 1) != "/") {
        url += "/";
      }
      url += map.name + "." + MM.Format.JSON.extension;
    }
    this._current = url;
    var json = map.toJSON();
    var data = MM.Format.JSON.to(json);
    try {
      await this._backend.save(data, url);
      this._saveDone();
    } catch (e) {
      this._error(e);
    }
  };
  MM.UI.Backend.WebDAV.load = async function(url = this._url.value) {
    this._current = url;
    setThrobber(true);
    var lastIndex = url.lastIndexOf("/");
    this._url.value = url.substring(0, lastIndex);
    localStorage.setItem(this._prefix + "url", this._url.value);
    try {
      let data = await this._backend.load(url);
      this._loadDone(data);
    } catch (e) {
      this._error(e);
    }
  };
  MM.UI.Backend.WebDAV._loadDone = function(data) {
    try {
      var json = MM.Format.JSON.from(data);
    } catch (e) {
      this._error(e);
    }
    MM.UI.Backend._loadDone.call(this, json);
  };

  // .js/ui/backend/ui.backend.image.js
  MM.UI.Backend.Image = Object.create(MM.UI.Backend, {
    id: { value: "image" }
  });
  MM.UI.Backend.Image.save = function() {
    this._backend.save();
  };
  MM.UI.Backend.Image.load = null;

  // .js/ui/backend/ui.backend.local.js
  MM.UI.Backend.Local = Object.create(MM.UI.Backend, {
    id: { value: "local" }
  });
  MM.UI.Backend.Local.init = function(select6) {
    MM.UI.Backend.init.call(this, select6);
    this._list = this._node.querySelector(".list");
    this._remove = this._node.querySelector(".remove");
    this._remove.addEventListener("click", this);
  };
  MM.UI.Backend.Local.handleEvent = function(e) {
    MM.UI.Backend.handleEvent.call(this, e);
    switch (e.target) {
      case this._remove:
        var id = this._list.value;
        if (!id) {
          break;
        }
        this._backend.remove(id);
        this.show(this._mode);
        break;
    }
  };
  MM.UI.Backend.Local.show = function(mode2) {
    MM.UI.Backend.show.call(this, mode2);
    this._go.disabled = false;
    if (mode2 == "load") {
      var list = this._backend.list();
      this._list.innerHTML = "";
      if (Object.keys(list).length) {
        this._go.disabled = false;
        this._remove.disabled = false;
        this._buildList(list, this._list);
      } else {
        this._go.disabled = true;
        this._remove.disabled = true;
        var o = document.createElement("option");
        o.innerHTML = "(no maps saved)";
        this._list.appendChild(o);
      }
    }
  };
  MM.UI.Backend.Local.setState = function(data) {
    this._load(data.id);
  };
  MM.UI.Backend.Local.getState = function() {
    var data = {
      b: this.id,
      id: currentMap.id
    };
    return data;
  };
  MM.UI.Backend.Local.save = function() {
    var json = currentMap.toJSON();
    var data = MM.Format.JSON.to(json);
    try {
      this._backend.save(data, currentMap.id, currentMap.name);
      this._saveDone();
    } catch (e) {
      this._error(e);
    }
  };
  MM.UI.Backend.Local.load = function() {
    this._load(this._list.value);
  };
  MM.UI.Backend.Local._load = function(id) {
    try {
      var data = this._backend.load(id);
      var json = MM.Format.JSON.from(data);
      this._loadDone(json);
    } catch (e) {
      this._error(e);
    }
  };

  // .js/ui/backend/ui.backend.firebase.js
  MM.UI.Backend.Firebase = Object.create(MM.UI.Backend, {
    id: { value: "firebase" }
  });
  MM.UI.Backend.Firebase.init = function(select6) {
    MM.UI.Backend.init.call(this, select6);
    this._online = false;
    this._itemChangeTimeout = null;
    this._list = this._node.querySelector(".list");
    this._server = this._node.querySelector(".server");
    this._server.value = localStorage.getItem(this._prefix + "server") || "my-mind";
    this._auth = this._node.querySelector(".auth");
    this._auth.value = localStorage.getItem(this._prefix + "auth") || "";
    this._remove = this._node.querySelector(".remove");
    this._remove.addEventListener("click", this);
    this._go.disabled = false;
    subscribe("firebase-list", this);
    subscribe("firebase-change", this);
  };
  MM.UI.Backend.Firebase.setState = function(data) {
    this._connect(data.s, data.a).then(this._load.bind(this, data.id), this._error.bind(this));
  };
  MM.UI.Backend.Firebase.getState = function() {
    var data = {
      id: currentMap.id,
      b: this.id,
      s: this._server.value
    };
    if (this._auth.value) {
      data.a = this._auth.value;
    }
    return data;
  };
  MM.UI.Backend.Firebase.show = function(mode2) {
    MM.UI.Backend.show.call(this, mode2);
    this._sync();
  };
  MM.UI.Backend.Firebase.handleEvent = function(e) {
    MM.UI.Backend.handleEvent.call(this, e);
    switch (e.target) {
      case this._remove:
        var id = this._list.value;
        if (!id) {
          break;
        }
        setThrobber(true);
        this._backend.remove(id).then(function() {
          setThrobber(false);
        }, this._error.bind(this));
        break;
    }
  };
  MM.UI.Backend.Firebase.handleMessage = function(message, publisher, data) {
    switch (message) {
      case "firebase-list":
        this._list.innerHTML = "";
        if (Object.keys(data).length) {
          this._buildList(data, this._list);
        } else {
          var o = document.createElement("option");
          o.innerHTML = "(no maps saved)";
          this._list.appendChild(o);
        }
        this._sync();
        break;
      case "firebase-change":
        if (data) {
          unsubscribe("item-change", this);
          currentMap.mergeWith(data);
          subscribe("item-change", this);
        } else {
          console.log("remote data disappeared");
        }
        break;
      case "item-change":
        if (this._itemChangeTimeout) {
          clearTimeout(this._itemChangeTimeout);
        }
        this._itemChangeTimeout = setTimeout(this._itemChange.bind(this), 200);
        break;
    }
  };
  MM.UI.Backend.Firebase.reset = function() {
    this._backend.reset();
    unsubscribe("item-change", this);
  };
  MM.UI.Backend.Firebase._itemChange = function() {
    var map = currentMap;
    this._backend.mergeWith(map.toJSON(), map.name);
  };
  MM.UI.Backend.Firebase._action = function() {
    if (!this._online) {
      this._connect(this._server.value, this._auth.value);
      return;
    }
    MM.UI.Backend._action.call(this);
  };
  MM.UI.Backend.Firebase.save = function() {
    setThrobber(true);
    var map = currentMap;
    this._backend.save(map.toJSON(), map.id, map.name).then(this._saveDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.Firebase.load = function() {
    this._load(this._list.value);
  };
  MM.UI.Backend.Firebase._load = function(id) {
    setThrobber(true);
    this._backend.load(id).then(this._loadDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.Firebase._connect = async function(server, auth) {
    var promise = new Promise();
    this._server.value = server;
    this._auth.value = auth;
    this._server.disabled = true;
    this._auth.disabled = true;
    localStorage.setItem(this._prefix + "server", server);
    localStorage.setItem(this._prefix + "auth", auth || "");
    this._go.disabled = true;
    setThrobber(true);
    await this._backend.connect(server, auth);
    this._connected();
  };
  MM.UI.Backend.Firebase._connected = function() {
    setThrobber(false);
    this._online = true;
    this._sync();
  };
  MM.UI.Backend.Firebase._sync = function() {
    if (!this._online) {
      this._go.innerHTML = "Connect";
      return;
    }
    this._go.disabled = false;
    if (this._mode == "load" && !this._list.value) {
      this._go.disabled = true;
    }
    this._go.innerHTML = this._mode.charAt(0).toUpperCase() + this._mode.substring(1);
  };
  MM.UI.Backend.Firebase._loadDone = function() {
    subscribe("item-change", this);
    MM.UI.Backend._loadDone.apply(this, arguments);
  };
  MM.UI.Backend.Firebase._saveDone = function() {
    subscribe("item-change", this);
    MM.UI.Backend._saveDone.apply(this, arguments);
  };

  // .js/ui/backend/ui.backend.gdrive.js
  MM.UI.Backend.GDrive = Object.create(MM.UI.Backend, {
    id: { value: "gdrive" }
  });
  MM.UI.Backend.GDrive.init = function(select6) {
    MM.UI.Backend.init.call(this, select6);
    this._format = this._node.querySelector(".format");
    this._format.appendChild(MM.Format.JSON.buildOption());
    this._format.appendChild(MM.Format.FreeMind.buildOption());
    this._format.appendChild(MM.Format.MMA.buildOption());
    this._format.appendChild(MM.Format.Mup.buildOption());
    this._format.appendChild(MM.Format.Plaintext.buildOption());
    this._format.value = localStorage.getItem(this._prefix + "format") || MM.Format.JSON.id;
  };
  MM.UI.Backend.GDrive.save = function() {
    setThrobber(true);
    var format = MM.Format.getById(this._format.value);
    var json = currentMap.toJSON();
    var data = format.to(json);
    var name = currentMap.name;
    var mime = "text/plain";
    if (format.mime) {
      mime = format.mime;
    } else {
      name += "." + format.extension;
    }
    this._backend.save(data, name, mime).then(this._saveDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.GDrive.load = function() {
    setThrobber(true);
    this._backend.pick().then(this._picked.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.GDrive._picked = function(id) {
    setThrobber(false);
    if (!id) {
      return;
    }
    setThrobber(true);
    this._backend.load(id).then(this._loadDone.bind(this), this._error.bind(this));
  };
  MM.UI.Backend.GDrive.setState = function(data) {
    this._picked(data.id);
  };
  MM.UI.Backend.GDrive.getState = function() {
    var data = {
      b: this.id,
      id: this._backend.fileId
    };
    return data;
  };
  MM.UI.Backend.GDrive._loadDone = function(data) {
    try {
      var format = MM.Format.getByMime(data.mime) || MM.Format.getByName(data.name) || MM.Format.JSON;
      var json = format.from(data.data);
    } catch (e) {
      this._error(e);
    }
    MM.UI.Backend._loadDone.call(this, json);
  };

  // .js/keyboard.js
  function handleEvent(e) {
    if (isActive()) {
      return;
    }
    let command = [...repo.values()].find((command2) => {
      if (!command2.isValid) {
        return false;
      }
      return command2.keys.find((key) => keyOK(key, e));
    });
    if (command) {
      e.preventDefault();
      command.execute(e);
    }
  }
  function init11() {
    window.addEventListener("keydown", handleEvent);
    window.addEventListener("keypress", handleEvent);
  }
  function keyOK(key, e) {
    if ("keyCode" in key && e.type != "keydown") {
      return false;
    }
    if ("charCode" in key && e.type != "keypress") {
      return false;
    }
    for (let p in key) {
      if (key[p] != e[p]) {
        return false;
      }
    }
    return true;
  }

  // .js/menu.js
  var node8 = document.querySelector("#menu");
  var port;
  function init12(port_) {
    port = port_;
    [...node8.querySelectorAll("[data-command]")].forEach((button) => {
      let commandName = button.dataset.command;
      button.textContent = repo.get(commandName).label;
    });
    port.addEventListener("mousedown", handleEvent2);
    node8.addEventListener("mousedown", handleEvent2);
    close3();
  }
  function open(point) {
    node8.hidden = false;
    let w = node8.offsetWidth;
    let h = node8.offsetHeight;
    let left = point[0];
    let top = point[1];
    if (left > port.offsetWidth / 2) {
      left -= w;
    }
    if (top > port.offsetHeight / 2) {
      top -= h;
    }
    node8.style.left = `${left}px`;
    node8.style.top = `${top}px`;
  }
  function handleEvent2(e) {
    if (e.currentTarget != node8) {
      close3();
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    let commandName = e.target.dataset.command;
    if (!commandName) {
      return;
    }
    let command = repo.get(commandName);
    if (!command.isValid) {
      return;
    }
    command.execute();
    close3();
  }
  function close3() {
    node8.hidden = true;
  }

  // .js/mouse.js
  var TOUCH_DELAY = 500;
  var SHADOW_OFFSET = 5;
  var touchContextTimeout = null;
  var current = {
    mode: "",
    cursor: [],
    item: null,
    ghost: null,
    ghostPosition: [],
    previousDragState: null
  };
  var port2;
  function init13(port_) {
    port2 = port_;
    port2.addEventListener("touchstart", onDragStart);
    port2.addEventListener("mousedown", onDragStart);
    port2.addEventListener("click", (e) => {
      let item = currentMap.getItemFor(e.target);
      if (editing && item == currentItem) {
        return;
      }
      item && selectItem(item);
    });
    port2.addEventListener("dblclick", (e) => {
      let item = currentMap.getItemFor(e.target);
      item && repo.get("edit").execute();
    });
    port2.addEventListener("wheel", (e) => {
      const { deltaY } = e;
      if (!deltaY) {
        return;
      }
      let dir = deltaY > 0 ? -1 : 1;
      adjustFontSize(dir);
    });
    port2.addEventListener("contextmenu", (e) => {
      onDragEnd(e);
      e.preventDefault();
      let item = currentMap.getItemFor(e.target);
      item && selectItem(item);
      open([e.clientX, e.clientY]);
    });
  }
  function onDragStart(e) {
    let point = eventToPoint(e);
    if (!point) {
      return;
    }
    let item = currentMap.getItemFor(e.target);
    if (editing) {
      if (item == currentItem) {
        return;
      }
      repo.get("finish").execute();
    }
    current.cursor = point;
    if (item && !item.isRoot) {
      current.mode = "drag";
      current.item = item;
    } else {
      current.mode = "pan";
      port2.style.cursor = "move";
    }
    if (e.type == "mousedown") {
      e.preventDefault();
      port2.addEventListener("mousemove", onDragMove);
      port2.addEventListener("mouseup", onDragEnd);
    }
    if (e.type == "touchstart") {
      touchContextTimeout = setTimeout(function() {
        item && selectItem(item);
        open(point);
      }, TOUCH_DELAY);
      port2.addEventListener("touchmove", onDragMove);
      port2.addEventListener("touchend", onDragEnd);
    }
  }
  function onDragMove(e) {
    let point = eventToPoint(e);
    if (!point) {
      return;
    }
    clearTimeout(touchContextTimeout);
    e.preventDefault();
    let delta = [
      point[0] - current.cursor[0],
      point[1] - current.cursor[1]
    ];
    current.cursor = point;
    switch (current.mode) {
      case "drag":
        if (!current.ghost) {
          port2.style.cursor = "move";
          buildGhost(current.item);
        }
        moveGhost(delta);
        let state = computeDragState();
        visualizeDragState(state);
        break;
      case "pan":
        currentMap.moveBy(delta);
        break;
    }
  }
  function onDragEnd(_e) {
    clearTimeout(touchContextTimeout);
    port2.style.cursor = "";
    port2.removeEventListener("mousemove", onDragMove);
    port2.removeEventListener("mouseup", onDragEnd);
    const { mode: mode2, ghost } = current;
    if (mode2 == "pan") {
      return;
    }
    if (ghost) {
      let state = computeDragState();
      finishDragDrop(state);
      ghost.remove();
      current.ghost = null;
    }
    current.item = null;
  }
  function buildGhost(item) {
    const { content } = item.dom;
    let ghost = content.cloneNode(true);
    ghost.classList.add("ghost");
    port2.append(ghost);
    let rect = content.getBoundingClientRect();
    current.ghost = ghost;
    current.ghostPosition = [rect.left, rect.top];
  }
  function moveGhost(delta) {
    let { ghost, ghostPosition } = current;
    ghostPosition[0] += delta[0];
    ghostPosition[1] += delta[1];
    ghost.style.left = ghostPosition[0] + "px";
    ghost.style.top = ghostPosition[1] + "px";
  }
  function finishDragDrop(state) {
    visualizeDragState(null);
    const { target, result, direction } = state;
    let action2;
    switch (result) {
      case "append":
        action2 = new MoveItem(current.item, target);
        break;
      case "sibling":
        let index2 = target.parent.children.indexOf(target);
        let targetIndex = index2 + (direction == "right" || direction == "bottom" ? 1 : 0);
        action2 = new MoveItem(current.item, target.parent, targetIndex, target.side);
        break;
      default:
        return;
        break;
    }
    action(action2);
  }
  function computeDragState() {
    let rect = current.ghost.getBoundingClientRect();
    let point = [rect.left + rect.width / 2, rect.top + rect.height / 2];
    let closest = currentMap.getClosestItem(point);
    let target = closest.item;
    let state = {
      result: "",
      target,
      direction: "left"
    };
    let tmp = target;
    while (!tmp.isRoot) {
      if (tmp == current.item) {
        return state;
      }
      tmp = tmp.parent;
    }
    let itemContentSize = current.item.contentSize;
    let targetContentSize = target.contentSize;
    const w = Math.max(itemContentSize[0], targetContentSize[0]);
    const h = Math.max(itemContentSize[1], targetContentSize[1]);
    if (target.isRoot) {
      state.result = "append";
    } else if (Math.abs(closest.dx) < w && Math.abs(closest.dy) < h) {
      state.result = "append";
    } else {
      state.result = "sibling";
      let childDirection = target.parent.resolvedLayout.getChildDirection(target);
      if (childDirection == "left" || childDirection == "right") {
        state.direction = closest.dy < 0 ? "bottom" : "top";
      } else {
        state.direction = closest.dx < 0 ? "right" : "left";
      }
    }
    return state;
  }
  function visualizeDragState(state) {
    let { previousDragState } = current;
    if (previousDragState && state && previousDragState.target == state.target && previousDragState.result == state.result) {
      return;
    }
    if (previousDragState) {
      previousDragState.target.dom.content.style.boxShadow = "";
    }
    if (!state) {
      return;
    }
    let x = 0, y = 0;
    if (state.result == "sibling") {
      if (state.direction == "left") {
        x = -1;
      }
      if (state.direction == "right") {
        x = 1;
      }
      if (state.direction == "top") {
        y = -1;
      }
      if (state.direction == "bottom") {
        y = 1;
      }
    }
    let spread = x || y ? -2 : 2;
    state.target.dom.content.style.boxShadow = `${x * SHADOW_OFFSET}px ${y * SHADOW_OFFSET}px 2px ${spread}px #000`;
    current.previousDragState = state;
  }
  function eventToPoint(e) {
    if ("touches" in e) {
      if (e.touches.length > 1) {
        return null;
      }
      return [e.touches[0].clientX, e.touches[0].clientY];
    } else {
      return [e.clientX, e.clientY];
    }
  }

  // .js/clipboard.js
  var storedItem = null;
  var mode = "";
  function init14() {
    document.body.addEventListener("cut", onCopyCut);
    document.body.addEventListener("copy", onCopyCut);
    document.body.addEventListener("paste", onPaste);
  }
  function onCopyCut(e) {
    if (isActive() || editing) {
      return;
    }
    e.preventDefault();
    endCut();
    switch (e.type) {
      case "copy":
        storedItem = currentItem.clone();
        break;
      case "cut":
        storedItem = currentItem;
        storedItem.dom.node.classList.add("cut");
        break;
    }
    let json = storedItem.toJSON();
    let plaintext = MM.Format.Plaintext.to(json);
    e.clipboardData.setData("text/plain", plaintext);
    mode = e.type;
  }
  function onPaste(e) {
    if (isActive() || editing) {
      return;
    }
    e.preventDefault();
    let pasted = e.clipboardData.getData("text/plain");
    if (!pasted) {
      return;
    }
    if (storedItem && pasted == MM.Format.Plaintext.to(storedItem.toJSON())) {
      pasteItem(storedItem, currentItem);
    } else {
      pastePlaintext(pasted, currentItem);
    }
    endCut();
  }
  function pasteItem(sourceItem, targetItem) {
    let action2;
    switch (mode) {
      case "cut":
        if (sourceItem == targetItem || sourceItem.parent == targetItem) {
          return;
        }
        let item = targetItem;
        while (true) {
          if (item == sourceItem) {
            return;
          }
          if (item.parent instanceof Map2) {
            break;
          }
          item = item.parent;
        }
        action2 = new MoveItem(sourceItem, targetItem);
        action(action2);
        break;
      case "copy":
        action2 = new AppendItem(targetItem, sourceItem.clone());
        action(action2);
        break;
    }
  }
  function pastePlaintext(plaintext, targetItem) {
    let json = MM.Format.Plaintext.from(plaintext);
    let map = Map2.fromJSON(json);
    let root = map.root;
    if (root.text) {
      let action2 = new AppendItem(targetItem, root);
      action(action2);
    } else {
      let subactions = root.children.map((item) => new AppendItem(targetItem, item));
      let action2 = new Multi(subactions);
      action(action2);
    }
  }
  function endCut() {
    if (mode != "cut") {
      return;
    }
    storedItem.dom.node.classList.remove("cut");
    storedItem = null;
    mode = "";
  }

  // .js/command/select.js
  new class Select extends Command {
    constructor() {
      super("select", "Move selection");
      this.keys = [
        { keyCode: 38, ctrlKey: false },
        { keyCode: 37, ctrlKey: false },
        { keyCode: 40, ctrlKey: false },
        { keyCode: 39, ctrlKey: false }
      ];
    }
    execute(e) {
      let dirs = {
        37: "left",
        38: "top",
        39: "right",
        40: "bottom"
      };
      let dir = dirs[e.keyCode];
      let layout = currentItem.resolvedLayout;
      let item = layout.pick(currentItem, dir);
      selectItem(item);
    }
  }();
  new class SelectRoot extends Command {
    constructor() {
      super("select-root", "Select root");
      this.keys = [{ keyCode: 36 }];
    }
    execute() {
      let item = currentItem;
      while (!item.isRoot) {
        item = item.parent;
      }
      selectItem(item);
    }
  }();
  if (!isMac()) {
    new class SelectParent extends Command {
      constructor() {
        super("select-parent", "Select parent");
        this.keys = [{ keyCode: 8 }];
      }
      execute() {
        if (currentItem.isRoot) {
          return;
        }
        selectItem(currentItem.parent);
      }
    }();
  }

  // .js/command/edit.js
  new class Edit extends Command {
    constructor() {
      super("edit", "Edit item");
      this.keys = [
        { keyCode: 32 },
        { keyCode: 113 }
      ];
    }
    execute() {
      startEditing();
    }
  }();
  new class Finish extends Command {
    constructor() {
      super("finish", "Finish editing");
      this.keys = [{ keyCode: 13, altKey: false, ctrlKey: false, shiftKey: false }];
      this.editMode = true;
    }
    execute() {
      let text = stopEditing();
      let action2;
      if (text) {
        action2 = new SetText(currentItem, text);
      } else {
        action2 = new RemoveItem(currentItem);
      }
      action(action2);
    }
  }();
  new class Newline extends Command {
    constructor() {
      super("newline", "Line break");
      this.keys = [
        { keyCode: 13, shiftKey: true },
        { keyCode: 13, ctrlKey: true }
      ];
      this.editMode = true;
    }
    execute() {
      let range = getSelection().getRangeAt(0);
      let br = document.createElement("br");
      range.insertNode(br);
      range.setStartAfter(br);
      currentItem.update({ parent: true, children: true });
    }
  }();
  new class Cancel extends Command {
    constructor() {
      super("cancel", "Cancel");
      this.keys = [{ keyCode: 27 }];
      this.editMode = null;
    }
    execute() {
      if (editing) {
        stopEditing();
        var oldText = currentItem.text;
        if (!oldText) {
          var action2 = new RemoveItem(currentItem);
          action(action2);
        }
      } else {
        close2();
        close();
        MM.App.io.hide();
      }
    }
  }();
  var Style = class extends Command {
    constructor() {
      super(...arguments);
      this.editMode = null;
    }
    execute() {
      if (editing) {
        document.execCommand(this.command, null, null);
      } else {
        repo.get("edit").execute();
        let selection = getSelection();
        let range = selection.getRangeAt(0);
        range.selectNodeContents(currentItem.dom.text);
        selection.removeAllRanges();
        selection.addRange(range);
        this.execute();
        repo.get("finish").execute();
      }
    }
  };
  new class Bold extends Style {
    constructor() {
      super("bold", "Bold");
      this.keys = [{ keyCode: "B".charCodeAt(0), ctrlKey: true }];
      this.command = "bold";
    }
  }();
  new class Underline2 extends Style {
    constructor() {
      super("underline", "Underline");
      this.keys = [{ keyCode: "U".charCodeAt(0), ctrlKey: true }];
      this.command = "underline";
    }
  }();
  new class Italic extends Style {
    constructor() {
      super("italic", "Italic");
      this.keys = [{ keyCode: "I".charCodeAt(0), ctrlKey: true }];
      this.command = "italic";
    }
  }();
  new class Strikethrough extends Style {
    constructor() {
      super("strikethrough", "Strike-through");
      this.keys = [{ keyCode: "S".charCodeAt(0), ctrlKey: true }];
      this.command = "strikeThrough";
    }
  }();
  new class Value extends Command {
    constructor() {
      super("value", "Set value");
      this.keys = [{ charCode: "v".charCodeAt(0), ctrlKey: false, metaKey: false }];
    }
    execute() {
      let item = currentItem;
      let oldValue = item.value;
      let newValue = prompt("Set item value", String(oldValue));
      if (newValue == null) {
        return;
      }
      if (!newValue.length) {
        newValue = null;
      }
      let numValue = parseFloat(newValue);
      let action2 = new SetValue(item, isNaN(numValue) ? newValue : numValue);
      action(action2);
    }
  }();
  new class Yes extends Command {
    constructor() {
      super("yes", "Yes");
      this.keys = [{ charCode: "y".charCodeAt(0), ctrlKey: false }];
    }
    execute() {
      let item = currentItem;
      let status = item.status === true ? null : true;
      let action2 = new SetStatus(item, status);
      action(action2);
    }
  }();
  new class No extends Command {
    constructor() {
      super("no", "No");
      this.keys = [{ charCode: "n".charCodeAt(0), ctrlKey: false }];
    }
    execute() {
      let item = currentItem;
      let status = item.status === false ? null : true;
      let action2 = new SetStatus(item, status);
      action(action2);
    }
  }();
  new class Computed extends Command {
    constructor() {
      super("computed", "Computed");
      this.keys = [{ charCode: "c".charCodeAt(0), ctrlKey: false, metaKey: false }];
    }
    execute() {
      let item = currentItem;
      let status = item.status == "computed" ? null : "computed";
      let action2 = new SetStatus(item, status);
      action(action2);
    }
  }();

  // .js/my-mind.js
  MM.App = {
    init: function() {
      this.io = new MM.UI.IO();
    }
  };
  var port3 = document.querySelector("#port");
  var throbber = document.querySelector("#throbber");
  var fontSize = 100;
  var currentMap;
  var currentItem;
  var editing = false;
  function showMap(map) {
    currentMap && currentMap.hide();
    reset();
    currentMap = map;
    currentMap.show(port3);
  }
  function action(action2) {
    push(action2);
    action2.do();
  }
  function selectItem(item) {
    if (currentItem && currentItem != item) {
      if (editing) {
        repo.get("finish").execute();
      }
      currentItem.deselect();
    }
    currentItem = item;
    currentItem.select();
  }
  function adjustFontSize(diff) {
    fontSize = Math.max(30, fontSize + 10 * diff);
    port3.style.fontSize = `${fontSize}%`;
    currentMap.update();
    currentMap.ensureItemVisibility(currentItem);
  }
  function setThrobber(visible) {
    throbber.hidden = !visible;
  }
  function startEditing() {
    editing = true;
    currentItem.startEditing();
  }
  function stopEditing() {
    editing = false;
    return currentItem.stopEditing();
  }
  function init15() {
    init10();
    init14();
    init11();
    init12(port3);
    init13(port3);
    MM.App.init();
    subscribe("item-change", (_message, publisher) => {
      if (publisher.isRoot && publisher.map == currentMap) {
        document.title = currentMap.name + " :: My Mind";
      }
    });
    subscribe("ui-change", syncPort);
    window.addEventListener("resize", syncPort);
    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      return "";
    });
    window.addEventListener("load", (e) => {
      MM.App.io.restore();
    });
    syncPort();
    showMap(new Map2());
  }
  function syncPort() {
    let portSize = [window.innerWidth - getWidth(), window.innerHeight];
    port3.style.width = portSize[0] + "px";
    port3.style.height = portSize[1] + "px";
    throbber.style.right = 20 + getWidth() + "px";
    currentMap && currentMap.ensureItemVisibility(currentItem);
  }
  init15();
})();
