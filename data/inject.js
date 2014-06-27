
var gamelist = new Array(); //Format: gamelist[nametag] = DOMObject

//Am I on humble?
if(location.href.match(/humblebundle.com/g).length != 0) {
    $("body").bind("DOMNodeInserted", function (e) {
        if(!$(e.target).hasClass("js-sale-timer")) {
            $(".product-details-link").each(function() {
                if(!$(this).hasClass("arrayInsertedEntry"))
                {
                    var nametag;

                    if($(this).children().length == 0) {
                        nametag = $(this).parent().find("h3").text();
                    } else {
                        nametag = $(this).find(".game_name").children("a").text();
                    }
                    
                    gamelist[nametag] = this;
    
                    //Mark it as inserted.
    
                    $(this).addClass("arrayInsertedEntry");

                    console.log("Querying: " + nametag);
                    self.port.emit("gameQuery", nametag);
                    console.log(nametag);
                }
            });
        }
    });

    self.port.on("gameEntry", function (gameEntry) {

        //Debug: print own list.

        console.log(gameEntry);
        if(gameEntry != null) { 
            //Oh.. I have this game.

            var prodDetail = gamelist[gameEntry.name];
            var priceTag;

            if($(prodDetail).children().length == 0) {
                priceTag = $(prodDetail).parent().find(".prices");
            } else {
                priceTag = $(prodDetail).find(".prices");
            }

            priceTag.prepend("<span classs='full-price'>Already Own!</s>");
        }
    });
}
