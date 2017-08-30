/*global $*/

$(document).ready(function() {
  console.log("Javascript Ready")
  function update() {
    gameLoop();
    requestAnimationFrame(update)
  }

  /*********************************
   ** Global Variable Definitions **
   *********************************/
  //DOM elements
  var canvas = $('#gameCanvas')[0];
  var ctx = canvas.getContext("2d");


  //Example of animating a sprite
  var state = 0;
  var delay = 0;
  var mX;
  var mY;
  var buttons = [];
  var texts = [];
  var tiles = [];
  var plots = [];
  var dragging = null;
  $("#gameCanvas").bind('mousemove', function(e) {
    mX = Math.round(e.pageX - $(this).offset().left);
    mY = Math.round(e.pageY - $(this).offset().top);
  });

  $("#gameCanvas").click(function() {
    console.log("clicked at: " + mX + " " + mY)
    if (buttons.filter(function(item) {
                          if (mX > item.x && mX < item.x+item.width && mY > item.y && mY < item.y+item.height) {
                            item.clicked();
                            return true;
                          }
                        }).length <= 0) {
      dragging.clicked();
    }
  })

  function createImage(path) {
    var newImage = new Image();
    newImage.src = path;
    return newImage;
  }

  function Tile(image, x, y, width, height, action) {
    this.image = image,
    this.x = x,
    this.y = y,
    this.width = width,
    this.height = height,
    this.action = action,
    this.draw = function() { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
  }

  function Plot(image, x, y, width, height, allowed) {
    this.image = image,
    this.x = x,
    this.y = y,
    this.width = width,
    this.height = height,
    this.action = function () {
      if (mX > item.x && mX < item.x+item.width && mY > item.y && mY < item.y+item.height) {
        this.draw = function() {
          //ctx.drawImage(<UNDERLAY IMAGE>, this.x, this.y, this.width, this.height)
          ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
      }
      else {
        this.draw = function() { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
      }
    },
    this.draw = function() { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); },
    this.allowed = allowed
  }

  plots.push(new Plot(createImage("images/loaf.png"), 100,100,400,400,['generator']));

  /**
    TODO: Plots will be used for the building locations,
     * Action should be if mouse over and dragging is not null,
     * display a highlighted area showing where that draggable
     * item can be dropped. Update DragSource.clicked to loop
     * through Plots and, similar to canvas.click, find which
     * one it is over before dropping there if allowed.

     * Consider making it such that you can only have one item in each
     * plot, and that the item will sit in a designated location
     * on the plot after it is dropped on the plot.
  **/

  function DragSource(type, image, x, y, width, height, offX, offY) {
    this.type,
    this.image = image,
    this.x = x,
    this.y = y,
    this.offX = offX,
    this.offY = offY,
    this.width = width,
    this.height = height,
    this.action = function() {
      this.x = mX - this.offX;
      this.y = mY - this.offY;
    },
    this.draw = function() { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); },
    this.clicked = function() {
      //check if over a plot
      if (plots.filter(function(item) {
                          if (mX > item.x && mX < item.x+item.width && mY > item.y && mY < item.y+item.height) {
                            //since in a plot, check if that plot accepts this type of item
                            return item.allowed.map(function(item) {
                              if (item == dragging.type) {
                                //since it does, drop here
                                return true
                              }
                              else {
                                return false
                              }
                            })
                          }
                          else {
                            return false
                          }
                        }).length > 0) {
        tiles.splice(tiles.indexOf(this),1,new Tile(this.image, this.x, this.y, this.width, this.height, function() {}))
        dragging = null;
      }
      else {
        this.abort();
        dragging = null;
      }
    },
    this.abort = function() {
      tiles.splice(tiles.indexOf(this),1);
    }
  }

  function Button(image, x, y, width, height, onClick) {
    this.image = image,
    this.x = x,
    this.y = y,
    this.width = width,
    this.height = height,
    this.clicked = onClick,
    this.draw = function () {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  function Text(phrase, x, y) {
    this.phrase = phrase,
    this.x = x,
    this.y = y,
    this.draw = function() {
      ctx.font="30px 8-BIT"
      ctx.fillStyle="#C07B25"
      ctx.fillText(this.phrase, this.x, this.y)
    }
  }

  buttons.push(new Button(createImage("images/loaf.png"), canvas.width/40, canvas.height/40,128,128,function() {
    console.log("Clicked loaf");
  }));
  buttons.push(new Button(createImage("images/loaf_button.png"), canvas.width/10, canvas.height/3,64,64,function() {
    if (dragging != null) {
      dragging.abort();
      dragging = null;
    }
    dragging = new DragSource('generator', createImage("images/loaf.png"), mX, mY,64,64,mX-this.x,mY-this.y);
    tiles.push(dragging);

  }));

  texts.push(new Text("0 Bread", canvas.width/5, canvas.height/6))

  function gameLoop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#da9538";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    //add to animation delay or trigger next animation
    delay >= 10 ? (delay = 0,
                    animateFrame()) : ++delay;

    drawPlayerTile(0,0,state);
    tiles.map(function(item) {item.action();});
    tiles.map(function(item) {item.draw();});
    buttons.map(function(item) {item.draw();});
    texts.map(function(item) {item.draw();});
  }

  function animateFrame() {
    state = state >= 7 ? 0 : ++state;
  }

  function drawPlayerTile(x,y,tileNum) {
    //Currently involves a wrapper, for any tile past 10, it assumes a new line down in the y axis
    var tileWidth = 64;
    var tileHeight = tileWidth;

    var playerSprites = new Image();
    playerSprites.src = "images/playerCharacter.png"

    drawTile(playerSprites, (tileNum % 10) * tileWidth, Math.floor(tileNum/10) * tileHeight, x, y, tileWidth, tileHeight);
  }
  function drawTile(spriteSrc,tileX,tileY,x,y,tileWidth,tileHeight) {
    ctx.drawImage(spriteSrc, tileX, tileY, tileWidth, tileHeight, x, y, tileWidth, tileHeight);
  }

  update();
});
