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
  var statics = [];
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

  //Shortcut for creating a new image cause its a pain
  function createImage(path) {
    var newImage = new Image();
    newImage.src = path;
    return newImage;
  }

  /**Classes that draw to the canvas typically have a mixture of 3 additional funcs
   * action - run every tick like draw, meant to provide seperation of function from draw
   * draw - draw an image, like action but only for drawing the image saved with the object
   * clicked - what happens when clicked**/

  //Draw an image that does nothing
  function Static(image, x, y, width, height) {
    this.image = image,
    this.x = x,
    this.y = y,
    this.width = width,
    this.height = height,
    this.draw = function() { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
  }

  //Tiles are statics that also have an action that must be done every tick
  function Tile(image, x, y, width, height, action) {
    this.image = image,
    this.x = x,
    this.y = y,
    this.width = width,
    this.height = height,
    this.action = action,
    this.draw = function() { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
  }

  //Plots are empty spaces where objects can be 'dropped' into
  /**They are also effectively tiles which have a default action - display a guide
   * so it is easier to see the plot, but only if moused over or if an object that
   * the plot accepts is held currently**/
  function Plot(x, y, width, height, allowed) {
    this.image = null,
    this.x = x,
    this.y = y,
    this.width = width,
    this.height = height,
    this.action = function () {
      if (mX > this.x && mX < this.x+this.width && mY > this.y && mY < this.y+this.height) {
        if (dragging != null && this.allowed.map(function(item) { return item == dragging.type;})[0] == true) {
          ctx.drawImage(createImage("images/highlight.png"), this.x, this.y, this.width, this.height)
        }
        else if (dragging == null) {
          ctx.drawImage(createImage("images/overlay.png"), this.x, this.y, this.width, this.height)
        }
      }
      else {
        if (dragging != null && this.allowed.map(function(item) { return item == dragging.type;})[0] == true) {
          ctx.drawImage(createImage("images/overlay.png"), this.x, this.y, this.width, this.height)
        }
      }
    },
    this.draw = function() {
      if (this.image) { ctx.drawImage(this.image, this.x, this.y, this.width, this.height); }
    }
    this.allowed = allowed
  }

  plots.push(new Plot(300,272,128,128,['oven']));
  plots.push(new Plot(450,272,128,128,['farm']));
  plots.push(new Plot(600,272,128,128,['oven']));

  /**
    TODO: Plots will be used for the building locations,
     * Action should be if mouse over and dragging is not null,
     * display a highlighted area showing where that draggable
     * item can be dropped. Update DragObject.clicked to loop
     * through Plots and, similar to canvas.click, find which
     * one it is over before dropping there if allowed.

     * Consider making it such that you can only have one item in each
     * plot, and that the item will sit in a designated location
     * on the plot after it is dropped on the plot.

     * ALSO TODO: Instead of createImage'ing every time you need it, make an array
     * or object containing each unique image
  **/

  /**DragObjects are basically fancy buttons that move with the cursor where the
  * user clicked and are able to be dropped on an appropriate plot**/
  //They have both action, draw, and clicked
  function DragObject(type, image, x, y, width, height, offX, offY) {
    this.type = type,
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
      if (plots.filter(function(item, index) {
                          if (mX > item.x && mX < item.x+item.width && mY > item.y && mY < item.y+item.height) {
                            //since in a plot, check if that plot accepts this type of item
                            if (item.allowed.map(function(item) {
                              if (item == dragging.type) {
                                //since it does, drop here
                                return true
                              }
                              else {
                                return false
                              }
                            })[0] != false) {
                              plots[index].image = dragging.image; //set the plot's image to this image
                              //return true
                            }
                            else {
                              return false
                            }
                          }
                          else {
                            return false
                          }
                        }).length > 0) {
        //BUG: What does this do?
        tiles.splice(tiles.indexOf(this),1,new Tile(this.image, this.x, this.y, this.width, this.height, function() {}))
        dragging = null;
      }
      else { //clicked anything besides a valid Plot
        this.abort();
        dragging = null;
      }
    },
    this.abort = function() { //remove this tile from the tiles list
      tiles.splice(tiles.indexOf(this),1);
    }
  }

  function Button(image, selectedImage, x, y, width, height, onClick) {
    this.image = image,
    this.selectedImage = selectedImage,
    this.x = x,
    this.y = y,
    this.width = width,
    this.height = height,
    this.clicked = onClick,
    this.draw = function () {
      if (mX > this.x && mX < this.x+this.width && mY > this.y && mY < this.y+this.height) {
        ctx.drawImage(this.selectedImage, this.x, this.y, this.width, this.height);
      }
      else {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      }
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

  buttons.push(new Button(createImage("images/ovenT1-Button.png"), createImage("images/ovenT1-ButtonSelected.png"), 32, 432,64,64,function() {
    if (dragging != null) {
      dragging.abort();
      dragging = null;
    }
    dragging = new DragObject('oven', createImage("images/ovenT1.png"), mX, mY,64,64,mX-this.x,mY-this.y);
    tiles.push(dragging);

  }));

  texts.push(new Text("0 Bread", canvas.width/5, canvas.height/6))
  //function Tile(image, x, y, width, height, action)
  //sky
  for (var ix = 0; ix <= canvas.width; ix+=64) {
    for (var iy = 336; iy >= -64; iy-=64) {
      statics.push(new Static(createImage("images/sky.png"), ix, iy, 64, 64))
    }
  }
  //sandTop
  for (var ix = 0; ix <= canvas.width; ix+=64) {
    statics.push(new Static(createImage("images/sandTop.png"), ix, 368, 64, 64))
  }
  //sand
  for (var ix = 0; ix <= canvas.width; ix+=64) {
    for (var iy = 432; iy <= canvas.height; iy+=64) {
      statics.push(new Static(createImage("images/sand.png"), ix, iy, 64, 64))
    }
  }

  function gameLoop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#da9538";
    ctx.fillRect(0,0,canvas.width, canvas.height);
    //add to animation delay or trigger next animation
    delay >= 10 ? (delay = 0,
                    animateFrame()) : ++delay;

    statics.map(function(item) {item.draw();});
    plots.map(function(item) {item.action();});
    plots.map(function(item) {item.draw();});
    buttons.map(function(item) {item.draw();});
    tiles.map(function(item) {item.action();});
    tiles.map(function(item) {item.draw();});
    texts.map(function(item) {item.draw();});
    drawPlayerTile(0,0,state);
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
