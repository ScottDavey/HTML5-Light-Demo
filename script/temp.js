/**********************
*****  ULILITIES  *****
**********************/
var RectangleExtensions = {
	GetIntersectionDepth: function (rectA, rectB) {
		var halfWidthA, halfWidthB, halfHeightA, halfHeightB, centerA, centerB, distanceX, distanceY, minDistanceX, minDistanceY, depthX, depthY;
		// Calculate Half sizes
		halfWidthA		= rectA.width / 2.0;
		halfWidthB		= rectB.width / 2.0;
		halfHeightA		= rectA.height / 2.0;
		halfHeightB		= rectB.height / 2.0;

		// Calculate centers
		centerA			= new Vector2(rectA.left + halfWidthA, rectA.top + halfHeightA);
		centerB			= new Vector2(rectB.left + halfWidthB, rectB.top + halfHeightB);

		distanceX		= centerA.x - centerB.x;
		distanceY		= centerA.y - centerB.y;
		minDistanceX	= halfWidthA + halfWidthB;
		minDistanceY	= halfHeightA + halfHeightB;

		// If we are not intersecting, return (0, 0)
		if (Math.abs(distanceX) >= minDistanceX || Math.abs(distanceY) >= minDistanceY)
			return new Vector2(0, 0);

		// Calculate and return intersection depths
		depthX			= distanceX > 0 ? minDistanceX - distanceX : -minDistanceX - distanceX;
		depthY			= distanceY > 0 ? minDistanceY - distanceY : -minDistanceY - distanceY;

		return new Vector2(depthX, depthY);
	}
};

var Vector2 = function(x, y) {
    this.x = x;
    this.y = y;
};

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function SecondsToTime (s) {
	var h, m, s;
	s = Number(s);
	h = Math.floor(s / 3600);
	m = Math.floor(s % 3600 / 60);
	s = Math.floor(s % 3600 % 60);
	return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

var fps = {
	startTime : 0,
	frameNumber : 0,
	getFPS : function () {
		var d, currentTime, result;
		this.frameNumber++;
		d 			= new Date().getTime();
		currentTime = (d - this.startTime) / 1000;
		//result 		= Math.floor(this.frameNumber / currentTime);
		result			= (this.frameNumber / currentTime).toFixed(2);

		if (currentTime > 1) {
			this.startTime 		= new Date().getTime();
			this.frameNumber 	= 0;
		}

		return result;
	}
};

/*******************************************
**************  INPUT OBJECT  **************
*******************************************/
var Input = {
	Keys: {
		_isPressed: {},
		W: 87,
		A: 65,
		S: 83,
		D: 68,
		SPACE: 32,
		R: 82,
		LEFT: 37,
		UP: 38,
		RIGHT: 39,
		DOWN: 40,
		GetKey: function (keyCode) {
			return Input.Keys._isPressed[keyCode];
		},
		onKeyDown: function (e) {
			Input.Keys._isPressed[e.keyCode] = true;
		},
		onKeyUp: function (e) {
			delete Input.Keys._isPressed[e.keyCode];
		}
	}
};

/****************************
*****  RECTANGLE CLASS  *****
****************************/
function Rectangle (x, y, width, height) {
	this.x		= x;
	this.y		= y;
	this.width	= width;
	this.height	= height;
	this.left	= this.x;
	this.top	= this.y;
	this.right	= this.x + this.width;
	this.bottom	= this.y + this.height;
	this.center	= new Vector2((this.x + (this.width/2)), (this.y + (this.height/2)));
}

/************************
*****  LIGHT CLASS  *****
************************/
function Lamp (pos, numRays, radius, isMoving, tileMap) {
	this.pos		= pos;
	this.tileMap	= tileMap;
	this.tiles		= [];
	this.isMoving	= isMoving;
	this.radius		= radius;
	this.numRays	= numRays;
	this.slice		= 2 * Math.PI / this.numRays;
}

Lamp.prototype.SetTileMap = function (tileMap) {
	this.tileMap	= tileMap;
};

Lamp.prototype.SetIlluminatedTiles = function (v0, v1) {
	var p0, p1, dx, dy, nx, ny, sign_x, sign_y, p, point, points, ix, iy, i, j , isUnique, tile, tileCenter, tX, tY, dist, distPrcnt, tileBG;

	// Convert x,y coordinates to tile x,y indexes
	p0		= new Vector2(Math.floor(v0.x / game.SQUARE), Math.floor(v0.y / game.SQUARE));
	p1		= new Vector2(Math.floor(v1.x / game.SQUARE), Math.floor(v1.y / game.SQUARE));

	dx		= p1.x - p0.x;
	dy		= p1.y - p0.y;
	nx		= Math.abs(dx);
	ny		= Math.abs(dy);
	sign_x	= (dx > 0) ? 1 : -1;
	sign_y	= (dy > 0) ? 1 : -1;
	p		= new Vector2(p0.x, p0.y);
	points 	= [new Vector2(p.x, p.y)];

	// Loop through tiles that the ray passes through and add their x,y tile indexes to an array
	for (ix = 0, iy = 0; ix < nx || iy < ny;) {

		if ((0.5+ix) / nx < (0.5+iy) / ny) {
			// next step is horizontal
			p.x += sign_x;
			ix++;
		} else {
			// next step is vertical
			p.y += sign_y;
			iy++;
		}

		points.push(new Vector2(p.x, p.y));

	}

	// Loop through the points array so we can adjust the appropriate tiles' colors
	for (i = 0; i < points.length; i++) {
		point = points[i];
		// Make sure we're working within the bounds of our canvas
		if (point.x >= 0 && point.x < game.MAP_SIZE_X && point.y >= 0 && point.y < game.MAP_SIZE_Y) {
			tile = this.tileMap[point.y][point.x];
			// Only conitue if we haven't hit a wall
			if (tile.collision !== 'IMPASSABLE') {
				// Get the distance between the light's source and the tile we're looping over so we can set the color on a gradient
				tileCenter	= new Vector2(tile.pos.x + (tile.size.x / 2), tile.pos.y + (tile.size.y / 2));
				tX			= v0.x - tileCenter.x;
				tY			= v0.y - tileCenter.y;
				dist		= Math.sqrt(tX*tX + tY*tY);
				distPrcnt	= Math.floor(this.radius - dist) / 100;

				// If the tile is the exit tile, give it a different color
				// Else, we're going to give the tile a color. It's opacity will be determined by by far away the tile is from the light source
				if (tile.collision === 'EXIT') {
					tileBG	= 'rgb(' + Math.floor(21*distPrcnt) + ', ' + Math.floor(226*distPrcnt) + ', ' + Math.floor(94*distPrcnt) + ')';
				} else {
					//tileBG	= 'rgb(' + Math.floor(255*distPrcnt) + ', ' + Math.floor(157*distPrcnt) + ', ' + Math.floor(78*distPrcnt) + ')';
					tileBG		= 'rgba(255, 157, 78, ' + distPrcnt + ')';
				}

				// Set the tile we're working on to a new Texture
				this.tiles[point.y][point.x] = new Texture(new Vector2(point.x * game.SQUARE, point.y * game.SQUARE), new Vector2(game.SQUARE, game.SQUARE), tileBG);
			} else {
				// We've hit a wall: abort
				break;
			}
		}
	}

};

Lamp.prototype.update = function (pos) {
	var i, angle, dX, dY, y, x;

	// We'll populate a new tiles array to match the size of the level map
	for (y = 0; y < this.tileMap.length; y++) {
		this.tiles[y] = [];
		for (x = 0; x < this.tileMap[y].length; x++) {
			// Set it to undefined - we'll change it later if it's affected by light
			this.tiles[y][x] = undefined;
		}
	}

	// If this light moves, update its position
	if (this.isMoving) this.pos = pos;

	// Set local bounds for the light's source
	lightRect	= new Rectangle(this.pos.x, this.pos.y, game.SQUARE, game.SQUARE);

	// Loop through the number of rays we want and determined how many tiles are affected.
	for (i = 0; i < this.numRays; i++) {
		angle	= this.slice * i;
		dX		= lightRect.center.x + this.radius * Math.cos(angle);
		dY		= lightRect.center.y + this.radius * Math.sin(angle);
		this.SetIlluminatedTiles(lightRect.center, new Vector2(dX, dY));
	}

};

Lamp.prototype.draw = function () {
	var y, x, tile;

	// Draw the tiles to the screen ONLY if they've been defined
	for (y = 0; y < this.tiles.length; y++) {
		for (x = 0; x < this.tiles[y].length; x++) {
			tile = this.tiles[y][x];
			if (typeof tile !== 'undefined')
				tile.draw();
		}
	}
};

/************************
*****  SOUND CLASS  *****
************************/
function Sound (path, isLooping, preloaded, hasControls, vol) {
	this.vol			= vol;
	this.audEl			= document.createElement('audio');
	this.audEl.volume 	= this.vol;
	this.audEl.setAttribute('src', path);
	this.audEl.setAttribute('preload', preloaded);
	this.audEl.setAttribute('controls', hasControls);
	if (isLooping) this.audEl.setAttribute('loop', true);
}

Sound.prototype.Play = function () {
	this.audEl.play();
};

Sound.prototype.Stop = function () {
	this.audEl.pause();
};

Sound.prototype.SetVolume = function (vol) {
	this.audEl.volume = vol;
};

Sound.prototype.IsPlaying = function () {
	return !this.audEl.paused;
};


/*************************
*****  SPRITE CLASS  *****
*************************/
function Sprite (path, pos, size) {
	this.pos	= pos;
	this.size	= size;
	this.img	= document.createElement('img');
	this.img.setAttribute('src', path);
}

Sprite.prototype.SetImage = function (path) {
	this.img.setAttribute('src', path);
};

Sprite.prototype.update = function (pos) {
	this.pos	= pos;
};

Sprite.prototype.draw = function () {
	game.context.drawImage(this.img, this.pos.x, this.pos.y);
};

/**************************
*****  TEXTURE CLASS  *****
**************************/
function Texture (pos, size, fillColor, lineWidth, lineColor)  {
	this.id			= pos.x + '-' + pos.y;
	this.pos		= pos;
	this.size		= size;
	this.fillColor	= fillColor;
	this.lineColor	= lineColor;
}

Texture.prototype.SetColor	= function (color) {
	this.fillColor	= color;
};

Texture.prototype.update = function (pos) {
	this.pos = pos;
};

Texture.prototype.draw = function () {
	game.context.save();
	game.context.beginPath();
	game.context.rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
	game.context.fillStyle = this.fillColor;
	game.context.fill();
	game.context.lineWidth = this.lineWidth;
	game.context.strokeStyle = this.lineColor;
	game.context.stroke();
	game.context.closePath();
	game.context.restore();
};

/***********************
*****  TILE CLASS  *****
************************/
function Tile (pos, tileBG, collision) {
	this.pos		= pos;
	this.size		= new Vector2(15, 15);
	this.tileBG		= tileBG;
	this.collision	= collision;
	this.texture	= new Texture(this.pos, this.size, this.tileBG);
}

Tile.prototype.SetTexture = function (tileBG, collision) {
	this.tileBG		= tileBG;
	this.texture = new Texture(this.pos, this.size, this.tileBG);
	if (typeof collision !== 'undefined') this.collision = collision;
};

Tile.prototype.draw = function () {
	this.texture.draw();
};

/*******************************************
**************  PLAYER CLASS  **************
*******************************************/
function Player (level) {
	this.level					= level;
	this.pos					= new Vector2(150, 100);
	this.size					= new Vector2(game.SQUARE, game.SQUARE);
	this.velocity				= new Vector2(0, 0);
	// Constants for controling movement
	this.MoveAcceleration 		= 500.0;
	this.MaxMoveSpeed 			= 2;
	this.GroundDragFactor 		= 0.6;
	this.movementX 				= 0;
	this.movementY 				= 0;

	this.texture				= new Texture(this.pos, this.size, 'white');
}

Player.prototype.Clamp = function (value, min, max) {
	return (value < min) ? min : ((value > max) ? max : value);
};

Player.prototype.SetPos = function (pos) {
	this.pos = pos;
};

Player.prototype.GetInput = function () {

	// Horizontal Movement
	if (Input.Keys.GetKey(Input.Keys.A) || Input.Keys.GetKey(Input.Keys.LEFT)) {
		this.movementX = -1.0;
	} else if (Input.Keys.GetKey(Input.Keys.D) || Input.Keys.GetKey(Input.Keys.RIGHT)) {
		this.movementX = 1.0;
	}

	// Vertical Movement
	if (Input.Keys.GetKey(Input.Keys.W) || Input.Keys.GetKey(Input.Keys.UP)) {
		this.movementY = -1.0;
	} else if (Input.Keys.GetKey(Input.Keys.S) || Input.Keys.GetKey(Input.Keys.DOWN)) {
		this.movementY = 1.0;
	}

};

Player.prototype.HandleCollision = function (gameTime) {
	// Set local variables
	var i, j, bottom, localBoundsRect, tileSize, topTile, leftTile, bottomTile, rightTile, tile, tileRect, depth, absDepthX, abdDepthY;

	// Prevent leaving the screen bounds (X AXIS)
	if (this.pos.x < 0) {
		this.pos.x = 0;
	} else if ((this.pos.x + this.size.x) > game.CANVAS_WIDTH) {
		this.pos.x = (game.CANVAS_WIDTH - this.size.x);
	}

	// Prevent leaving the screen bounds (Y AXIS)
	if (this.pos.y < 0) {
		this.pos.y = 0;
	} else if ((this.pos.y + this.size.y) > game.CANVAS_HEIGHT) {
		this.pos.y = (game.CANVAS_HEIGHT - this.size.y);
	}

	// Set bouding box for our player
	//localBoundsRect = {'left': this.pos.x, 'top': this.pos.y, 'right': this.pos.x + this.size.x, 'bottom': this.pos.y + this.size.y, 'Width': this.size.x, 'Height': this.size.y};
	localBoundsRect = new Rectangle(this.pos.x, this.pos.y, this.size.x, this.size.y);

	// Set the tile size (hard coded)
	tileSize		= new Vector2(game.SQUARE, game.SQUARE);

	// Get the closest tiles
	topTile			= parseInt(Math.floor(parseFloat(localBoundsRect.top / tileSize.y)), 10);
	leftTile		= parseInt(Math.floor(parseFloat(localBoundsRect.left / tileSize.x)), 10);
	bottomTile		= parseInt(Math.ceil(parseFloat(localBoundsRect.bottom / tileSize.y)) - 1, 10);
	rightTile		= parseInt(Math.ceil(parseFloat(localBoundsRect.right / tileSize.x)) - 1, 10);

	// Loop through each potentially colliding tile
	for (i = topTile; i <= bottomTile; ++i) {
		for (j = leftTile; j <= rightTile; ++j) {

			// Put the tile we're looping on in a variable for multiple use
			tile = this.level.tiles[i][j];
			// Create a bounding box for our tile
			//tileRect = {'left': tile.pos.x, 'top': tile.pos.y, 'right': tile.pos.x + tileSize.x, 'bottom': tile.pos.y + tileSize.y, 'Width': tileSize.x, 'Height': tileSize.y};
			tileRect = new Rectangle(tile.pos.x, tile.pos.y, tileSize.x, tileSize.y);

			// Check if this tile is collidable. Else, check if it's the exit tile
			if (tile.collision === 'IMPASSABLE') {


				// Now we know that this tile is being collided with, we'll figure out
				// the axis of least separation and push the player out along that axis

				// Get the intersection depths between the player and this tile
				depth = RectangleExtensions.GetIntersectionDepth(localBoundsRect, tileRect);

				// Only continue if depth != 0
				if (depth.x !== 0 && depth.y !== 0) {

					absDepthX = Math.abs(depth.x);
					absDepthY = Math.abs(depth.y);

					// If the Y depth is shallower than the X depth, correct player's y position and set y velocity to 0.
					// If the X depth is shallower, correct player's x position and set x velocity to 0.
					// Else, we've hit a corner (both intersection depths are equal). Correct both axes and set velocity to 0
					if (absDepthY < absDepthX) {
						//this.pos.y += depth.y;
						this.pos.y = localBoundsRect.top + depth.y;
						this.velocity.y = 0;
					} else if (absDepthX < absDepthY) {
						//this.pos.x += depth.x;
						this.pos.x = localBoundsRect.left + depth.x;
						this.velocity.x = 0;
					} /*else {
						this.pos = {'x': this.pos.x + depth.x, 'y': this.pos.y + depth.y};
					}*/

				}

			} else if (tile.collision === 'EXIT') {

				// Get the intersection depths between the player and this tile
				depth = RectangleExtensions.GetIntersectionDepth(localBoundsRect, tileRect);

				// Only allow exit if player's majority is over the exit tile
				if (Math.abs(depth.x) > (game.SQUARE / 2) && Math.abs(depth.y) > (game.SQUARE / 2))
					this.level.FoundExit(gameTime);

			}

		}
	}
};

Player.prototype.ApplyPhysics = function (gameTime) {

	this.velocity.x		+= this.movementX * this.MoveAcceleration;
	this.velocity.y		+= this.movementY * this.MoveAcceleration;

	// Apply pseudo-drag horizontally
	this.velocity.x 	*= this.GroundDragFactor;
	this.velocity.y 	*= this.GroundDragFactor;

	// Prevent player from going faster than top speed
	this.velocity.x 	= this.Clamp(this.velocity.x, -this.MaxMoveSpeed, this.MaxMoveSpeed);
	this.velocity.y 	= this.Clamp(this.velocity.y, -this.MaxMoveSpeed, this.MaxMoveSpeed);

	// Apply velocity to player
	this.pos.x 			+= Math.round(this.velocity.x);
	this.pos.y 			+= Math.round(this.velocity.y);

	// Handle Collisions
	this.HandleCollision();

};

Player.prototype.update = function () {

	this.GetInput();
	this.ApplyPhysics();

	// Update the player
	this.texture.update(this.pos);

	// Clear inputs
	this.movementX = 0;
	this.movementY = 0;

};

Player.prototype.draw = function () {
	// Draw player texture
	this.texture.draw();
};

/**********************
*****  CONTAINER  *****
**********************/

function Container (x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.center = new Vector2(Math.floor(this.x + (this.w/2)), Math.floor(this.y + (this.h/2))); // Must be a whole number as we're working with tiles
}

/*****************
*****  TREE  *****
*****************/

function Tree (leaf) {
    this.leaf 	= leaf;
    this.lchild = undefined;
    this.rchild = undefined;
}

Tree.prototype.getLeafs = function() {
    if (this.lchild === undefined && this.rchild === undefined)
        return [this.leaf];
    else
        return [].concat(this.lchild.getLeafs(), this.rchild.getLeafs());
};

Tree.prototype.getLevel = function(level, queue) {
    if (queue === undefined)
        queue = [];
    if (level == 1) {
        queue.push(this);
    } else {
        if (this.lchild !== undefined)
            this.lchild.getLevel(level-1, queue);
        if (this.rchild !== undefined)
            this.rchild.getLevel(level-1, queue);
    }
    return queue;
};

/*****************
*****  ROOM  *****
*****************/
function Room (container) {
	this.x	= container.x + random(0, Math.floor(container.w/3));
	this.y	= container.y + random(0, Math.floor(container.h/3));
	this.w	= container.w - (this.x - container.x);
	this.h	= container.h - (this.y - container.y);
	this.w -= random(0, this.w/3);
	this.h -= random(0, this.w/3);
}

/*****************
*****  HALL  *****
*****************/
function Hall (lchild, rchild) {
	var isSplitHorizontal;
	isSplitHorizontal	= (lchild.x != rchild.x);
	this.x				= lchild.center.x;
	this.y				= lchild.center.y;
	this.w				= (isSplitHorizontal) ? rchild.center.x - lchild.center.x : 1;
	this.h				= (isSplitHorizontal) ? 1 : rchild.center.y - lchild.center.y;
}

/******************
*****  LEVEL  *****
******************/
function Level () {
	// Dungeon Generation
	this.N_ITERATIONS		= 4;
	this.DISCARD_BY_RATIO	= true;
	this.H_RATIO			= 0.45;
	this.W_RATIO			= 0.45;
	this.main_container		= {};
	this.container_tree		= [];
	this.leafs				= [];
	this.tiles				= [];
	this.exitTile			= undefined;
	this.startTile			= undefined;
	this.rooms				= [];
	this.halls				= [];
	// Audio
	this.music				= new Sound('sounds/MUSIC_Dark_Chamber.mp3', true, true, false, 1);
	this.ambience			= new Sound('sounds/SFX_Dungeon_Ambience.mp3', true, true, false, 0.3);
	this.fireSound			= new Sound('sounds/SFX_Fire.mp3', true, true, false, 0.03);
	this.exitSound			= new Sound('sounds/SFX_Exit.mp3', false, true, false, 0.9);
	this.lampSound			= new Sound('sounds/SFX_Lamp.mp3', false, true, false, 0.3);
	this.LampFlickSound		= new Sound('sounds/SFX_Flick.mp3', false, true, false, 0.4);
	// Player
	this.player				= new Player(this);
	// Level Variables
	this.fps				= 0;
	this.levelBG			= new Texture(new Vector2(0, 0), new Vector2(game.CANVAS_WIDTH, game.CANVAS_HEIGHT), 'black');
	this.lightLimit			= 20;	// After 100 lights the frame rate dropped from 30 to 23
	this.lights				= [];
	this.playerLight		= undefined;
	this.tileColor			= 'black';
	this.isSpaceLocked		= false;
	this.spaceLockTime		= 0;
	this.isLoading			= true;
	this.foundExit			= false;
	this.levelStartTime		= 0;
	this.elapsedTime		= 0;
	this.reloadTimer		= 0;
	this.score				= 0;

	// Setup
	this.music.Play();
	this.ambience.Play();
	this.fireSound.Play();

	this.Initialize();
}

Level.prototype.DrawText = function (string, x, y, font, color) {
	game.context.save();
	game.context.font = font;
	game.context.fillStyle = color;
	game.context.fillText(string, x, y);
	game.context.restore();
};

Level.prototype.LoadEmptyTiles = function () {
	var i, j, x, y, tileBG;
	for (i = 0; i < game.MAP_SIZE_Y; i++) {
		this.tiles[i] = [];
		for (j = 0; j < game.MAP_SIZE_X; j++) {
			x = j * game.SQUARE;
			y = i * game.SQUARE;
			this.tiles[i][j] = new Tile(new Vector2(x, y), '#000000', 'IMPASSABLE');
		}
	}
};

Level.prototype.Reset = function (gameTime) {
	this.isLoading			= true;
	this.tiles				= [];
	this.leafs				= [];
	this.rooms				= [];
	this.halls	 			= [];
	this.main_container		= {};
	this.container_tree		= [];
	this.leafs				= [];
	this.lights				= [];

	this.Initialize();
};

Level.prototype.SetDifficulty = function (difficulty) {
	/*switch (difficulty) {
		case 1:
			this.tileColor = 'black';
			break;
		case 2:
			this.tileColor = '#222222';
			break;
		case 3:
			this.tileColor = '#444444';
			break;
		default:
			this.tileColor = '#666666';
			break;
	}*/
};

Level.prototype.Initialize = function () {
	// Level Generation
	this.main_container		= new Container(0, 0, game.MAP_SIZE_X, (game.canvas.height / game.SQUARE));
	this.container_tree		= this.split_container(this.main_container, this.N_ITERATIONS);
	this.leafs				= this.container_tree.getLeafs();
	this.LoadEmptyTiles();
	this.CreateRooms();
	this.CreateHalls(this.container_tree);
	this.CarveTiles();
	this.SetSpecialTiles();

	// Initialize lights (if not itialized - else, send new tile map)
	if (typeof this.playerLight === 'undefined')
		this.playerLight		= new Lamp(this.player.pos, 32, 75, true, this.tiles);	//pos, numRays, radius, isMoving, tileMap
	else
		this.playerLight.SetTileMap(this.tiles);

	// Initialize timer
	this.levelStartTime		= new Date().getTime() / 1000;
};

Level.prototype.split_container = function (container, iter) {
	var root, sr;
	root = new Tree(container);
	if (iter !== 0) {
		try {
			sr 			= this.random_split(container);
		} catch (e) {
			this.Reset();
		}
		root.lchild = this.split_container(sr[0], iter-1);
		root.rchild = this.split_container(sr[1], iter-1);
	}
    return root;
};

Level.prototype.random_split = function (container) {
	var r1, r2, r1_w_ratio, r2_w_ratio, r1_h_ratio, r2_h_ratio;
	if (random(0, 1) === 0) {
		// Vertical
		r1 = new Container(
			container.x, container.y,             // r1.x, r1.y
			random(1, container.w), container.h   // r1.w, r1.h
		);
		r2 = new Container(
			container.x + r1.w, container.y,      // r2.x, r2.y
			container.w - r1.w, container.h       // r2.w, r2.h
		);

		if (this.DISCARD_BY_RATIO) {
			r1_w_ratio = r1.w / r1.h;
			r2_w_ratio = r2.w / r2.h;
			if (r1_w_ratio < this.W_RATIO || r2_w_ratio < this.W_RATIO) {
				return this.random_split(container);
			}
		}
	} else {
		// Horizontal
		r1 = new Container(
			container.x, container.y,             // r1.x, r1.y
			container.w, random(1, container.h)   // r1.w, r1.h
		);
		r2 = new Container(
			container.x, container.y + r1.h,      // r2.x, r2.y
			container.w, container.h - r1.h       // r2.w, r2.h
		);

		if (this.DISCARD_BY_RATIO) {
			r1_h_ratio = r1.h / r1.w;
			r2_h_ratio = r2.h / r2.w;
			if (r1_h_ratio < this.H_RATIO || r2_h_ratio < this.H_RATIO) {
				return this.random_split(container);
			}
		}
	}
    return [r1, r2];
};

Level.prototype.CreateRooms = function () {
	var i;
	for (i = 0; i < this.leafs.length; i++) {
		this.rooms.push(new Room(this.leafs[i]));
	}
};

Level.prototype.CreateHalls = function (tree) {
	if (tree.lchild == undefined || tree.rchild == undefined)
		return;
	this.halls.push(new Hall(tree.lchild.leaf, tree.rchild.leaf));
	this.CreateHalls(tree.lchild);
	this.CreateHalls(tree.rchild);
};

Level.prototype.CarveTiles = function () {
	var i, j, k, rooms, halls, tileBG;

	// Carve Rooms
	for (i = 0; i < this.rooms.length; i++) {
		room = this.rooms[i];
		for (j = room.y; j < (room.y + room.h); j++) {
			for (k = room.x; k < (room.x + room.w); k++) {
				this.tiles[j][k].SetTexture('black', 'PASSABLE');
			}
		}
	}

	// Carve Halls
	for (i = 0; i < this.halls.length; i++) {
		hall = this.halls[i];
		for (j = hall.y; j < (hall.y + hall.h); j++) {
			for (k = hall.x; k < (hall.x + hall.w); k++) {
				this.tiles[j][k].SetTexture('#black', 'PASSABLE');
			}
		}
	}

};

Level.prototype.SetSpecialTiles = function () {
	var eRnd, eRoom, eX, eY, sRnd, sRoom, sX, sY;

	// PLAYER START TILE
	sRnd			= random(0, (this.rooms.length - 1));
	sRoom			= this.rooms[sRnd];
	sX				= random(sRoom.x + 1, (sRoom.x + sRoom.w) - 1);
	sY				= random(sRoom.y + 1, (sRoom.y + sRoom.h) - 1);
	this.startTile	= this.tiles[sY][sX];
	this.player.pos = new Vector2(sX * game.SQUARE, sY * game.SQUARE);
	this.player.update();

	// EXIT TILE
	eRnd			= random(0, (this.rooms.length - 1));

	while (eRnd == sRnd)
		eRnd		= random(0, (this.rooms.length - 1));

	eRoom			= this.rooms[eRnd];
	eX				= random(eRoom.x + 1, (eRoom.x + eRoom.w) - 1);
	eY				= random(eRoom.y + 1, (eRoom.y + eRoom.h) - 1);
	this.exitTile	= this.tiles[eY][eX];
	this.exitTile.SetTexture('black', 'EXIT');
};

Level.prototype.FoundExit = function () {
	this.exitSound = {};
	this.exitSound = new Sound('sounds/SFX_Exit.mp3', false, true, false, 0.9);
	this.exitSound.Play();
	this.score += ((this.elapsedTime <= 10) ? 200 : (this.elapsedTime <= 20) ? 100 : 50);
	this.Reset();
};

Level.prototype.update = function () {
	var gameTime, newLight;
	gameTime			= new Date().getTime() / 1000;
	this.elapsedTime	= Math.floor(gameTime - this.levelStartTime);

	this.fps = fps.getFPS();

	// clear key locks
	if (this.isLoading && (gameTime - this.reloadTimer) >= 0.5) this.isLoading = false;
	if (this.isSpaceLocked && (gameTime - this.spaceLockTime) >= 0.5) this.isSpaceLocked = false;

	/* Check for keyboard input */
	// Reload (R)
	if (Input.Keys.GetKey(Input.Keys.R) && !this.isLoading) {
		this.Reset();
		this.reloadTimer = gameTime;
	}

	// Add a light where the player is.
	if (Input.Keys.GetKey(Input.Keys.SPACE) && !this.isSpaceLocked) {

		this.isSpaceLocked = true;
		this.spaceLockTime = gameTime;

		this.LampFlickSound = {};
		this.LampFlickSound = new Sound('sounds/SFX_Flick.mp3', false, true, false, 0.4);
		this.LampFlickSound.Play();

		if (this.lightLimit > this.lights.length) {
			newLight = new Lamp(this.player.pos, 50, 100, false, this.tiles);
			newLight.update();
			this.lampSound = {};
			this.lampSound = new Sound('sounds/SFX_Lamp.mp3', false, true, false, 0.3);
			this.lampSound.Play();
			this.lights.push(newLight);
		}

	}

	// Update the player
	if (!this.isLoading) {
		this.player.update();
		this.playerLight.update(this.player.pos);
	}
};

Level.prototype.draw = function () {
	var i, y, x;

	this.levelBG.draw();

	// Draw Lights
	for (i = 0; i < this.lights.length; i++) {
		this.lights[i].draw();
	}

	this.playerLight.draw();
	this.player.draw();

	// Draw Score
	this.DrawText('SCORE: ' + this.score, 5, 20, 'normal 14pt Century Gothic', 'rgba(255, 255, 255, 0.7)');

	// Draw FPS
	this.DrawText('FPS: ' + this.fps, ((game.CANVAS_WIDTH / 2) - 40), 20, 'normal 14pt Century Gothic', 'rgba(255, 255, 255, 0.7)');

	// Draw Timer
	this.DrawText('TIMER: ' + SecondsToTime(this.elapsedTime), game.CANVAS_WIDTH - 106, 20, 'normal 14pt Century Gothic', 'rgba(255, 255, 255, 0.7)');

	// Draw Number of Lights Left
	this.DrawText('LIGHTS LEFT: ' + (this.lightLimit - this.lights.length), 5, (game.CANVAS_HEIGHT - 5), 'normal 14pt Century Gothic', 'rgba(255, 255, 255, 0.7)');
};


/*****************
*****  MAIN  *****
*****************/
var game = {
	init: function () {
		var difficultyBtns, i;
		this.isRunning				= true;
		this.FPS					= 60;
		this.CANVAS_WIDTH			= 750;
		this.CANVAS_HEIGHT			= 405;
		this.MAP_SIZE_X				= 50;	// In tiles
		this.MAP_SIZE_Y				= 27;	// In tiles
		this.SQUARE					= 15;
		this.canvas					= document.getElementById('viewport');
		this.context				= this.canvas.getContext('2d');
		this.level					= new Level();
		difficultyBtns				= document.getElementsByClassName('difficultyBtn');

		// Create event listeners
		window.addEventListener('keyup', function (e) { Input.Keys.onKeyUp(e); }, false);
		window.addEventListener('keydown', function (e) { Input.Keys.onKeyDown(e); }, false);

		for (i = 0; i < difficultyBtns.length; i++) {
			difficultyBtns[i].addEventListener('click', game.onDifficultyClick, false);
		}

		// Game Loop
		game.run();
	},
	onDifficultyClick: function () {
		var that;
		that = this;
		document.getElementsByClassName('active')[0].className = "difficultyBtn";
		that.className = "difficultyBtn active";
		game.level.SetDifficulty(that.getAttribute('val'));
	},
	run: function () {
		if (game.isRunning) {
			game.update();
			game.draw();
		}
		requestAnimationFrame(game.run);
		/*setInterval(function () {
			if (game.isRunning) {
				game.update();
				game.draw();
			}
		}, 1000 / game.FPS);*/
	},
	update: function () {
		game.level.update();
	},
	draw: function () {
		game.context.clearRect(0, 0, game.CANVAS_WIDTH, game.CANVAS_HEIGHT);
		game.level.draw();
	}
};