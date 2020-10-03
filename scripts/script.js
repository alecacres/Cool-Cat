const terminalVelocity = 0.530 * 2;
const maxVelocity = 1 * 2;
const acceleration = 0.200 * 2;
const gravity = 0.098 * 2;
let scale = 2;
const minScale = 1;
let arrowKeys = null;

class Level {
	constructor(plan) {
		this.width = (window.innerWidth - 1);
		this.height = (window.innerHeight - 4);
		this.startActors = [];

		let actorNames = Object.keys(plan);

		actorNames.forEach(actor => {
			let type = levelCharacters[plan[actor].type];
			if (typeof type === "string") return type;
			let position = new Vector((plan[actor].position.x * this.width / 100), plan[actor].position.y * this.height / 100);
			let velocity = plan[actor].velocity;
			this.startActors.push(
				type.create(position, velocity)
			);
			return "empty";
		});
	}
}

Level.prototype.touches = function(position, size) {
	var xStart = Math.floor(position.x);
	var xEnd = Math.ceil(position.x + size.x);
	var yStart = Math.floor(position.y);
	var yEnd = Math.ceil(position.y + size.y);

	for (var y = yStart; y < yEnd; y += 1) {
		for (var x = xStart; x < xEnd; x += 1) {
			let isOutside = x <= -1 || x >= this.width || 
							y <= -1 || y >= this.height;
			if (isOutside) return isOutside;
		}
	}
	return false;
};

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	plus(other) {
		return new Vector(this.x + other, this.y + other);
	}

	times(factor) {
		return new Vector(this.x * factor, this.y * factor);
	}
}

class Glasses {
	constructor(position, velocity) {
		this.position = position;
		if (velocity === undefined) {
			this.velocity = new Vector(0, 0);
		} else {
			this.velocity = velocity;
		}
	}

	static create(position, velocity) {
		return new Glasses(position, velocity);
	}

	get type() { return "glasses" }
}

Glasses.prototype.update = function(time, state, keys) {
	let position = this.position;
	let velocityX = this.velocity.x;
	let velocityY = this.velocity.y;
	let newVelocity = new Vector(0, 0);

	let gravityVelocity = velocityY + gravity * time;

	velocityY = (gravityVelocity < terminalVelocity) ? gravityVelocity : terminalVelocity;

	velocityY = addAcceleration(keys.ArrowUp, false, {"acceleration": acceleration, "velocity": velocityY, "time": time, "maxVelocity": maxVelocity});
	velocityY = addAcceleration(keys.ArrowDown, true, {"acceleration": acceleration, "velocity": velocityY, "time": time, "maxVelocity": maxVelocity});
	velocityX = addAcceleration(keys.ArrowLeft, false, {"acceleration": acceleration, "velocity": velocityX, "time": time, "maxVelocity": maxVelocity});
	velocityX = addAcceleration(keys.ArrowRight, true, {"acceleration": acceleration, "velocity": velocityX, "time": time, "maxVelocity": maxVelocity});

	let movedX = new Vector(position.x + velocityX, position.y);
	let movedY = new Vector(position.x, position.y + velocityY);

	for (actor of state.actors) {
		if (actor.type === "kitten" && overlap(this, actor, "both")) {
			var ultimatum = true;
		}
	}

	if (!ultimatum && !state.level.touches(position, this.size)) {
		newVelocity = new Vector(velocityX, velocityY);
		position = new Vector(movedX.x, movedY.y);
	}

	return new Glasses(position, newVelocity);
}

Glasses.prototype.size = new Vector(512 / 11, 512 / 11);

Glasses.prototype.explosion = new Vector(80, 100);

Glasses.prototype.hitboxes = [
						 	 	{"type": "failure",
								 "size": new Vector(35, 5),
								 "padding": new Vector(7, 15)},
							 	{"type": "failure",
								 "size": new Vector(12, 10),
								 "padding": new Vector(5, 20)},
							 	{"type": "failure",
								 "size": new Vector(12, 10),
								 "padding": new Vector(33, 20)},
								{"type": "success",
								 "size": new Vector(10, 5),
								 "padding": new Vector(20, 20)}
							];

class Kitten {
	constructor(position) {
		this.position = position;
	}

	static create(position) {
		return new Kitten(position);
	}

	get type() { return "kitten" }
}

Kitten.prototype.collide = function(state, velocity) {
	if (velocity.x < 0.3 && velocity.y < 0.4) {
		return new State(state.level, state.actors, "won", state.debug, state.timePassed);
	} else {
		return new State(state.level, state.actors, "lost", state.debug, state.timePassed);
	}
}

Kitten.prototype.update = function() {
	return new Kitten(this.position);
}

Kitten.prototype.size = new Vector(269 / 4, 478 / 4);

Kitten.prototype.hitboxes = [
							   {"type": "failure",
							    "size": new Vector(35, 75),
							    "padding": new Vector(10, 35)},
								{"type": "success",
							  	 "size": new Vector(5, 5),
								 "padding": new Vector(24, 28)}
							];

class Sofa {
	constructor(position) {
		this.position = position;
	}

	static create(position) {
		return new Sofa(position);
	}

	get type() { return "sofa" }
}

Sofa.prototype.collide = function(state, velocity) {
	return new State(state.level, state.actors, "lost", state.debug, state.timePassed);
}

Sofa.prototype.update = function() {
	return new Sofa(this.position);
}

Sofa.prototype.size = new Vector(269 / 4, 478 / 4);

Sofa.prototype.hitboxes = [
							   {"type": "failure",
							    "size": new Vector(35, 75),
							    "padding": new Vector(10, 35)}
							];


class Seat {
	constructor(position) {
		this.position = position;
	}

	static create(position) {
		return new Seat(position);
	}

	get type() { return "seat" }
}

Seat.prototype.collide = function(state, velocity) {
	return new State(state.level, state.actors, "lost", state.debug, state.timePassed);
}

Seat.prototype.update = function() {
	return new Seat(this.position);
}

Seat.prototype.size = new Vector(269 / 4, 478 / 4);

Seat.prototype.hitboxes = [
							   {"type": "failure",
							    "size": new Vector(35, 75),
							    "padding": new Vector(10, 35)}
							];

class State {
	constructor(level, actors, status, debug, time, timePassed) {
		this.level = level;
		this.actors = actors;
		this.status = status;
		this.debug = debug;
		this.time = time;
		this.timePassed = timePassed;
	}

	static start(level) {
		return new State(level, level.startActors, "playing", false, this.timePassed);
	}

	get glasses() {
		return this.actors.find(a => a.type === "glasses");
	}
}

State.prototype.update = function(time, timePassed, keys) {
	let actors = this.actors
		.map(actor => actor.update(time, this, keys));

	let newState = new State(this.level, actors, this.status, this.debug, time, timePassed);

	if (keys.Backquote) {
		newState = new State(this.level, actors, this.status, !this.debug, time, timePassed);
	}

	if (newState.status !== "playing") return newState;

	let glasses = newState.glasses;

	for (let actor of actors) {
		if (actor !== glasses && overlap(actor, glasses, "success")) {
			newState = actor.collide(newState, glasses.velocity);
		} else if (actor !== glasses && overlap(actor, glasses, "failure")) {
			newState = new State(this.level, actors, "lost", this.debug, time, timePassed);
		} else if (actor === glasses && newState.level.touches(actor.position, actor.size)) {
			newState = new State(this.level, actors, "lost", this.debug, time, timePassed);
		}
	}

	return newState;
}

let kittenSprite = document.createElement("img");
let glassesSprite = document.createElement("img");
let seatSprite = document.createElement("img");
let sofaSprite = document.createElement("img");
let explosionSprites = document.createElement("img");
let keySprites = document.createElement("img");
kittenSprite.src = "sprites/catStanding.png";
seatSprite.src = "sprites/seat.jpg"
sofaSprite.src = "sprites/sofa.jpg"
glassesSprite.src = "sprites/sunglasses.png";
explosionSprites.src = "sprites/explosion.png";
keySprites.src = "sprites/arrowKeys.png"

class CanvasDisplay {
	constructor(parent, level) {
		this.canvas = document.createElement("canvas");
		this.viewport = {
			left: 0,
			top: 0
		}
		this.canvas.width = level.width;
		this.canvas.height = level.height;
		this.viewport.width = this.canvas.width;
		this.viewport.height = this.canvas.height;
		parent.appendChild(this.canvas);
		this.context = this.canvas.getContext("2d");
		this.time = null;

		this.context.font = "48px Bebas Neue";

	}

	clear() {
		this.canvas.remove();
	}
}

CanvasDisplay.prototype.setState = function(state, keyCoordinates, mobile) {
	let glasses = state.actors.find(a => a.type === "glasses");	
	this.updateViewport(state);
	this.clearDisplay(state.status);
	this.drawActors(state);
	this.drawInterface(state, keyCoordinates, mobile);
};

CanvasDisplay.prototype.updateViewport = function(state) {
	let timePassed = state.timePassed;
	let glasses = state.glasses;
	let center = glasses.position.plus(glasses.size.times(0.5));

	scale = timePassed < 2 ? 2 : Math.max(4 - timePassed, minScale);
};

CanvasDisplay.prototype.clearDisplay = function(status) {
	this.colors = [
		[153, 0, 255],
		[238, 17, 136],
		[85, 170, 102]
	];
	let offset = Math.round(Date.now() / 100) % 2;
	if (status === "won") {
		let barSize = 30;
		for (let i = 0, a = 0; i * 30 < this.canvas.width; i += 1, a = (i + offset) % this.colors.length) {
			this.context.fillStyle = "rgb(" + this.colors[a].join(", ") + ")";
			this.context.fillRect(i * barSize, 0, i * barSize + barSize, this.canvas.height);
		}
	} else {
		if (status === "lost") {
			this.context.fillStyle = "rgb(44, 136, 214)";
		} else {
			this.context.fillStyle = "rgb(52, 166, 251)";
		}
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}
	
};

CanvasDisplay.prototype.drawGlasses = function(state, x, y, width, height) {
	let actors = state.actors;
	let debug = state.debug;

	let glasses = actors.find(a => a.type === "glasses");

	for (actor of actors) {
		if (actor.type !== "glasses" && overlap(glasses, actor, "failure")) {
			var ultimatum = true; 
		} else if (actor.type !== "glasses" && overlap(glasses, actor, "success") && (glasses.velocity.x > 0.3 || glasses.velocity.y > 0.4)) {
			var ultimatum = true;
		}
	}

	if ((ultimatum || state.level.touches(glasses.position, glasses.size)) && !this.time) {
		this.time = Date.now();
	}

	if (!this.time) {
		this.context.drawImage(glassesSprite,
						 	   x, y, width, height);
	} else {
		var tile = Math.round((Date.now() - this.time) / 100);
		if (tile > 7) tile = 7; 
		var tileX = tile * glasses.explosion.x + 20 * tile;
		this.context.drawImage(explosionSprites,
							   tileX, 0, glasses.explosion.x, glasses.explosion.y,
							   x, y, width, height);
	}

	if (debug) {
		for (let objectKey in actor.hitboxes) {
			var hitbox = actor.hitboxes[objectKey];
			if (hitbox.type === "failure") this.context.fillStyle = "red";
			else if (hitbox.type === "success") this.context.fillStyle = "green";
			this.context.fillRect((actor.position.x  - this.viewport.left) * scale + hitbox.padding.x * scale,
								  (actor.position.y - this.viewport.top) * scale + hitbox.padding.y * scale,
								  hitbox.size.x * scale,
								  hitbox.size.y * scale);
		}
	}
}

CanvasDisplay.prototype.drawActors = function(state) {
	let actors = state.actors;
	let debug = state.debug;
	for (let actor of actors) {
		let width = actor.size.x * scale;
		let height = actor.size.y * scale;
		let x = (actor.position.x - this.viewport.left) * scale;
		let y = (actor.position.y - this.viewport.top) * scale;
		if (actor.type === "glasses") {
			this.drawGlasses(state, x, y, width, height, debug);
		} else {
			if (actor.type === "sofa") {
				this.context.drawImage(sofaSprite,
									   x, y, width, height);
			} else if (actor.type === "seat") {
				this.context.drawImage(seatSprite,
									   x, y, width, height);
			} else if (actor.type === "kitten") {
				this.context.drawImage(kittenSprite,
									   x, y, width, height);
			}
			if (debug) {
				for (let objectKey in actor.hitboxes) {
					var hitbox = actor.hitboxes[objectKey];
					if (hitbox.type === "failure") this.context.fillStyle = "red";
					else if (hitbox.type === "success") this.context.fillStyle = "green";
					this.context.fillRect((actor.position.x - this.viewport.left) * scale + hitbox.padding.x * scale,
										  (actor.position.y - this.viewport.top) * scale + hitbox.padding.y * scale,
										  hitbox.size.x * scale,
										  hitbox.size.y * scale);
				}
			}
		}
	}
}

CanvasDisplay.prototype.drawInterface = function(state, keyCoordinates, mobile) {
	let { glasses, status, debug, timePassed } = state;

	this.context.font = "40px Courier New"
	this.context.fillStyle = "rgb(255, 255, 255)";
	if (status !== "won" && status !== "lost") {
		this.context.fillText("Velocity:", this.viewport.width - 400, this.viewport.height - 50);
		if (glasses.velocity.y > 0.3 && (Math.round(timePassed * 5) % 2 === 1)) {
			this.context.fillStyle = "rgb(255, 100, 0)";
			this.context.fillText(glasses.velocity.y.toFixed(2), this.viewport.width - 150, this.viewport.height - 50);
		} else if (glasses.velocity.y <= 0.3) {
			this.context.fillStyle = "rgb(0, 0, 0)"
			this.context.fillText(glasses.velocity.y.toFixed(2), this.viewport.width - 150, this.viewport.height - 50);
		}
	}

	this.context.font = "48px Bebas Neue";
	this.context.fillStyle = "rgb(255, 255, 255)";

	if (timePassed < 3) {
		this.centerText("Control acceleration with arrow keys", true, true);
	}

	if (status === "won") {
		this.centerText("You Win!", true, true);
	} else if (status === "lost") {
		this.centerText("Try Again", true, true);
	}

	if (mobile || debug) {
		this.context.drawImage(keySprites,
							   20, this.viewport.height - 250, 331, 222);
	}
	if (debug) {
		this.context.fillStyle = "yellow";
		for (let i = 0; i < 3; i += 1) {
			this.context.fillRect(35 + (keyCoordinates.Size + keyCoordinates.Gap) * i, this.viewport.height - keyCoordinates.Size - keyCoordinates.Gap - 30, keyCoordinates.Size, keyCoordinates.Size);
		}
		this.context.fillRect(35 + (keyCoordinates.Size + keyCoordinates.Gap), this.viewport.height - (keyCoordinates.Size + keyCoordinates.Gap) * 2 - 30, keyCoordinates.Size, keyCoordinates.Size)
	}
}

CanvasDisplay.prototype.centerText = function(text, horizontal, vertical) {
	console.log("Centering text");
	let measured = this.context.measureText(text);
	let x = vertical === true ? (this.canvas.width / 2 - measured.width / 2) : vertical;
	let y = horizontal === true ? (this.canvas.height / 2 + (measured.actualBoundingBoxAscent - measured.actualBoundingBoxDescent) / 2) : horizontal;
	console.log(text);
	console.log(this.canvas.width, x);
	console.log(this.canvas.height, y);
	this.context.fillText(text, x, y);
}

function overlap(actor1, actor2, hitboxType) {
	let onePos = actor1.position;
	let twoPos = actor2.position;
	let oneType = actor1.type;
	let twoType = actor2.type;
	let hitbox1;
	let hitbox2;
	let commonality = false;
	let mainActors = false;

	if ((oneType === "glasses" && twoType === "kitten") || (oneType === "kitten" && twoType === "glasses")) {
		mainActors = true;
	}

	if (hitboxType === "failure" || hitboxType === "both") {
		for (hitbox1 of actor1.hitboxes) {
			for (hitbox2 of actor2.hitboxes) {
				if (hitbox1.type === "failure" &&  hitbox2.type === "failure") {
					commonality = onePos.x + hitbox1.padding.x + hitbox1.size.x > twoPos.x + hitbox2.padding.x &&
								  onePos.x + hitbox1.padding.x < twoPos.x + hitbox2.size.x + hitbox2.padding.x &&
								  onePos.y + hitbox1.size.y + hitbox1.padding.y > twoPos.y + hitbox2.padding.y &&
								  onePos.y + hitbox1.padding.y < twoPos.y + hitbox2.size.y + hitbox2.padding.y;
					if (commonality) return commonality;
				}
			}
		}
	}
	if (mainActors && (hitboxType === "success" || hitboxType === "both")) {
		let success = (a) => { return a.type === "success" }
		hitbox1 = actor1.hitboxes.find(success);
		hitbox2 = actor2.hitboxes.find(success);
		commonality = onePos.x + hitbox1.padding.x + hitbox1.size.x > twoPos.x + hitbox2.padding.x &&
					  onePos.x + hitbox1.padding.x < twoPos.x + hitbox2.size.x + hitbox2.padding.x &&
					  onePos.y + hitbox1.size.y + hitbox1.padding.y > twoPos.y + hitbox2.padding.y &&
					  onePos.y + hitbox1.padding.y < twoPos.y + hitbox2.size.y + hitbox2.padding.y;
	}
	return commonality;
}

function addAcceleration(key, positive, varObject) {
	let sign = positive ? 1 : -1;
	let velocity = varObject.velocity + sign * varObject.acceleration * varObject.time;
	let surrendersTerminal;
	
	if (positive) {
		surrendersTerminal = varObject.velocity < varObject.maxVelocity;
	} else {
		surrendersTerminal = varObject.velocity > -varObject.maxVelocity;
	}

	if (key) {
		return (surrendersTerminal) ? velocity : sign * varObject.maxVelocity;
	} else {
		return varObject.velocity;
	}
}

function trackKeys(keys) {
	let down = Object.create(null);
	function track(event) {
		if (keys.includes(event.code)) {
			down[event.code] = event.type === "keydown";
			event.preventDefault();
		}
	}
	window.addEventListener("keydown", track);
	window.addEventListener("keyup", track);
	down.unregister = () => {
    	window.removeEventListener("keydown", track);
    	window.removeEventListener("keyup", track);
    };
	return down;
}

function trackTouch(Display, keyCoordinates) {
	let down = Object.create(null);
	let xStart;
	let xEnd;
	let yStart;
	let yEnd;
	let keyCodes = ["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"];

	function track(event) {
		for (let i = 0; i < 4; i += 1) {
			for (let touch of event.changedTouches) {
				xStart = i === 3 ? 35 + (keyCoordinates.Size + keyCoordinates.Gap) : 35 + (keyCoordinates.Size + keyCoordinates.Gap) * i;
				xEnd =  i === 3 ? 35 + (keyCoordinates.Size + keyCoordinates.Gap) + keyCoordinates.Size : 35 + (keyCoordinates.Size + keyCoordinates.Gap) * i + keyCoordinates.Size;
				yStart = Display.viewport.height - (keyCoordinates.Size + keyCoordinates.Gap) * (Math.floor(i / 3) + 1) - 30;
				yEnd = Display.viewport.height - (keyCoordinates.Size + keyCoordinates.Gap) * (Math.floor(i / 3) + 1) - 30 + keyCoordinates.Size;
				var touchesKey = touch.clientX > xStart &&
							  	 touch.clientX < xEnd &&
							  	 touch.clientY > yStart &&
							  	 touch.clientY < yEnd;

				if (touchesKey) {
					down[keyCodes[i]] = touch.force ? touch.identifier + 1 : 0;
					event.preventDefault();
				} else if (down[keyCodes[i]] === (touch.identifier + 1)) {
					down[keyCodes[i]] = 0;
				}
			}
		}
	}
	Display.canvas.addEventListener("touchstart", track);
	Display.canvas.addEventListener("touchmove", track);
	Display.canvas.addEventListener("touchend", track);
	down.unregister = () => {
		Display.canvas.removeEventListener("touchstart", track);
		Display.canvas.removeEventListener("touchmove", track);
		Display.canvas.removeEventListener("touchend", track);
	};
	return down;
}

function isMobile() {
	let agent = navigator.userAgent
	return agent.match(/Android/i) || 
		   agent.match(/webOS/i) || 
		   agent.match(/iPhone/i) || 
		   agent.match(/iPad/i) || 
		   agent.match(/iPod/i) || 
		   agent.match(/BlackBerry/i) || 
		   agent.match(/Windows Phone/i);
}

function runAnimation(frameFunction) {
	let lastTime = null;
	function frame(time) {
		if (lastTime !== null) {
			let timeStep = Math.min(time - lastTime, 100) / 1000;
			if (frameFunction(timeStep) === false) return;
		}
		lastTime = time;
		requestAnimationFrame(frame);
	}
	requestAnimationFrame(frame);
}

function runLevel(level, Display) {
	let display = new Display(document.body, level);
	let state = State.start(level);
	let timePassed = 0;
	let ending = 3;

	return new Promise(resolve => {
		var keyCoordinates = {"Size": 100,
							  "Gap": 5
							};
		var mobile = isMobile();
		if(mobile) {
			arrowKeys = trackTouch(display, keyCoordinates);
		} else {
			arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Backquote"]);
		}
		runAnimation(time => {
			timePassed += time;
			state = state.update(time, timePassed, arrowKeys);
			display.setState(state, keyCoordinates, mobile);
			if (state.status === "playing") {
				return true;
			} else if (ending > 0) {
				ending -= time;
				return true;
			} else {
				display.clear();
          		arrowKeys.unregister();
				resolve(state.status);
				return false;
			}
		});
	});
}

async function runGame(plans, Display) {
	for (let level = 0; level < plans.length;) {
		let status = await runLevel(new Level(plans[level]), Display);
		if (status === "won") level += 1;
	}
}

const levelCharacters = {
	"glasses": Glasses,
	"kitten": Kitten,
	"seat": Seat,
	"sofa": Sofa,
	"level": "level"
};

let testPlans = [{"kitten": 
					{"type": "kitten",
					 "position": new Vector(70, 70)},
				"glasses": 
					{"type": "glasses",
					 "position": new Vector(1, 1),
					 "velocity": new Vector(1, 0)}
				}, {"kitten": 
					{"type": "kitten",
					 "position": new Vector(50, 50)}, 
				"sofa1": 
					{"type": "sofa",
					 "position": new Vector(50, 70)},
				"seat1": 
					{"type": "seat",
					 "position": new Vector(60, 60)},
				"glasses": 
					{"type": "glasses", 
					 "position": new Vector(1, 1), 
					 "velocity": new Vector(1, 0)},
				}, {"kitten": 
					{"type": "kitten",
					 "position": new Vector(40, 60)}, 
				"sofa1": 
					{"type": "sofa",
					 "position": new Vector(50, 70)},
				"seat1": 
					{"type": "seat",
					 "position": new Vector(60, 60)},
				"seat2": 
					{"type": "seat",
					 "position": new Vector(45, 70)},
				"sofa2": 
					{"type": "sofa",
					 "position": new Vector(55, 60)},
				"glasses": 
					{"type": "glasses", 
					 "position": new Vector(1, 1), 
					 "velocity": new Vector(1, 0)},
				}];