const self = require("sdk/self");
var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');
var pageMod = require("sdk/page-mod");
var request = require("sdk/request").Request;
var simplePrefs = require("sdk/simple-prefs");
var { indexedDB } = require('sdk/indexed-db');
var data = self.data;

var steamKey = "67B803D88D410F7BE6F830D5D6E52646";
var userSteamID = 0;

var gameList;

//Open IndexedDB for steam app cache.
var gameDatabase = {};
gameDatabase.onerror = function(e) {
    console.error(e.value);
}

function open(version) {
    var request = indexedDB.open("gameDB", version);

    request.onupgradeneeded = function(e) {
        var db = e.target.result;
        e.target.transaction.onerror = gameDatabase.onerror;

        if(db.objectStoreNames.contains("games")) {
            db.deleteObjectStore("games");
        }

        var store = db.createObjectStore("games", {keyPath: "name"});
    }

    request.onsuccess = function (e) {
        gameDatabase.db = e.target.result;
    }

    request.onerror = gameDatabase.onerror;
}

function putGame(gameEntryArr, length) {
    var db = gameDatabase.db;
    var trans = db.transaction(["games"], "readwrite");
    var store = trans.objectStore("games");

    trans.onerror = function (e) {
        console.error("Transaction failed");
    }

    trans.oncomplete = function (e) {
        console.log("Transaction completed");
    }

    //Flush store before we add games
    store.clear();

    var i;

    for ( i = 0; i < length; i++) {
        var request = store.put(gameEntryArr[i]);

        request.onerror = function (e) {
            console.error("Failed to put game in DB!");
        }
    }
}

function getGame(key, callback) {
    var cb = callback;
    var db = gameDatabase.db;
    var trans = db.transaction(["games"], "readonly");

    var result = null;
    
    trans.oncomplete = function() {
        cb(result);
    }

    var store = trans.objectStore("games");
    var request = store.get(key);

    request.onsuccess = function (e) {
        result = request.result;
    }

    request.onerror = function (e) {
        result = null;
    }
}

//Open Database.
open("1");

var steamRequest = null;

simplePrefs.on("updateCollection", function() {
    userSteamID = simplePrefs.prefs["userSteamID"];

    steamRequest = request({
        url: "http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?format=json&include_appinfo=1&key=" + steamKey + "&steamid=" + userSteamID,
        headers: {
            Referer: "addons.maneulyori.org"
        },
        onComplete: function (response) {
            var result = response.json.response;
    
            //Now, we have all games in result.
    
            putGame(result.games, result.game_count);
        }
    });

    if(userSteamID != 0)
        steamRequest.get();
});

pageMod.PageMod({
    include: ["*.humblebundle.com", "*.zerial.net", "*.steampowered.com"],
    contentScriptFile: [data.url("jquery.js"), data.url("inject.js")],
    contentScriptWhen: "ready",
    onAttach: function(worker) {
        worker.port.on("gameQuery", function(gameQuery) {
            console.log("Searching: " + gameQuery);
            getGame(gameQuery, function (gameEntry) {
                if(gameEntry != null)
                    worker.port.emit("gameEntry", gameEntry);
            });
        });
    }
});

function handleClick(state) {
    tabs.open("https://store.steampowered.com/");
}
