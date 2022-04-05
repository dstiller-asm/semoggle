function Player(name) {
    this.name = name
    this.render("form#semoggle_input")
}

Player.prototype = {
    render: function(selector) {
        var fs = document.createElement("fieldset")
        var label = document.createElement("label")
        this.input = document.createElement("input")
        this.input.type = "text"
        this.input.size = "100"

        $(fs).addClass("player").append($(label).text(this.name + ": ").append($(this.input)))

        $(selector).append(fs)
    },

    getWords: function() {
        return($(this.input).val().toLowerCase().split(" ").slice(0, 10))
    }
}

function Game() {
    this.players = []
    for (var i = 0; i < arguments.length; i++) {
        this.players.push(arguments[i])
    }
    this.getTargetWord()
}

Game.prototype = {
    ajaxhost: "http://127.0.0.1:5000",

    words: {},

    lookUp: function(word) {
        that = this
        return Number($.ajax({
            type: "GET",
            url: this.ajaxhost + "/similarity/" + this.target + "/" + word,
            async: false
        }).responseText);
    },

    getTargetWord: function() {
        that = this
        $.ajax(this.ajaxhost + "/get_target_word").done(function(data) {
            that.target = data
            that.render("form#semoggle_input")
        })
    },

    render: function(selector) {
        const game = this
        $("h2").text("The word is \"" + this.target + "\"") // show the target word in the h2 at top
        var button = document.createElement("button")
        $(button).click(function() {
            var unique_words = {}
            unique_words[game.target] = -1 // you can't choose the target word
            for (var i = 0; i < game.players.length; i++) {
                var player_words = game.players[i].getWords()
                for (var j = 0; j < player_words.length; j++) {
                    if ((player_words[j].length >= 2) && (!(player_words[j] in unique_words))) { // must be unique and not shorter than 2 characters
                        unique_words[player_words[j]] = i // give the word to the ith player
                    } else if (player_words[j] in unique_words) {
                        unique_words[player_words[j]] = -1 // disallow duplicate words
                    }
                }
            }
            var value
            for (word in unique_words) {
                if (unique_words[word] >= 0) {
                    value = game.lookUp(word)
                    if (!Number.isNaN(value)) { // reject NaN value words
                        game.words[word] = {
                            similarity: value * 100.0, // multiply percentage by 100
                            player: unique_words[word] // which player played it
                        }
                    }
                }
            }
            game.showResults()
            return false;
        })
        $(selector).append($(button).text("Play"))
    },

    showResults() {
        var parent = $("div#semoggle_output")
            parent.empty()
        
        var tr, th, td, table

        var scores = []
        for (var i = 0; i < this.players.length; i++) scores.push(0)
        
        var i = 0
        table = document.createElement("table")
        for (word in this.words) {
            if (i % 10 == 0) { // split table every 10 guesses
                parent.append($(table).css("float", "left"))
                table = document.createElement("table")
            }
            tr = document.createElement("tr")
            th = document.createElement("th")
            $(th).text(word).addClass(this.players[this.words[word].player].name)
            td = document.createElement("td")
            $(td).text(this.words[word].similarity.toFixed(2))
            $(tr).append($(th)).append($(td))
            $(table).append($(tr))
            scores[this.words[word].player] += this.words[word].similarity
            i += 1
        }
        parent.append($(table).css("float", "left"))
        
        table = document.createElement("table")
        for (var i = 0; i < this.players.length; i++) {
            tr = document.createElement("tr")
            th = document.createElement("th")
            $(th).text(this.players[i].name + ": ").addClass(this.players[i].name)
            td = document.createElement("td")
            $(td).text(Math.round(scores[i]))
            $(tr).append($(th)).append($(td))
            $(table).append($(tr))
        }

        parent.append($(table).css({
            "float": "left",
            "margin": "10px"
        }).addClass("results"))
    }
}

$(document).ready(function() {
    var p1 = new Player("Player1")
    var p2 = new Player("Player2")
    var p3 = new Player("Player3")
    var p4 = new Player("Player4")
    var p5 = new Player("Player5")
    var g = new Game(p1, p2, p3, p4, p5)
})