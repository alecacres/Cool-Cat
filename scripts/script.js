const terminalVelocity = 0.530 * 2;
const maxVelocity = 1 * 2;
const acceleration = 0.200 * 2;
const gravity = 0.098 * 2;

class Level {
	constructor(plan) {
		this.width = plan.level.dimensions.x;
		this.height = plan.level.dimensions.y;
		this.startActors = [];

		let actorNames = Object.keys(plan);

		actorNames.forEach(actor => {
			let type = levelCharacters[plan[actor].type];
			if (typeof type === "string") return type;
			let position = plan[actor].position;
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

	get type() { return "Glasses" }
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
		if (actor.type === "Kitten" && overlap(this, actor, "both")) {
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

	get type() { return "Kitten" }
}

Kitten.prototype.collide = function(state, velocity) {
	if (velocity.x < 0.3 && velocity.y < 0.3) {
		return new State(state.level, state.actors, "won", state.debug);
	} else {
		return new State(state.level, state.actors, "lost", state.debug);
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

class State {
	constructor(level, actors, status, debug) {
		this.level = level;
		this.actors = actors;
		this.status = status;
		this.debug = debug;
	}

	static start(level) {
		return new State(level, level.startActors, "playing", false);
	}

	get glasses() {
		return this.actors.find(a => a.type === "Glasses");
	}
}

State.prototype.update = function(time, keys) {
		let actors = this.actors
			.map(actor => actor.update(time, this, keys));

	let newState = new State(this.level, actors, this.status, this.debug);

	if (keys.Backquote) {
		newState = new State(this.level, actors, this.status, !this.debug);
	}

	if (newState.status !== "playing") return newState;

	let glasses = newState.glasses;

	for (let actor of actors) {
		if (actor !== glasses && overlap(actor, glasses, "success")) {
			newState = actor.collide(newState, glasses.velocity);
		} else if (actor !== glasses && overlap(actor, glasses, "failure")) {
			newState = new State(this.level, actors, "lost", this.debug);
		} else if (actor === glasses && newState.level.touches(actor.position, actor.size)) {
			newState = new State(this.level, actors, "lost", this.debug);
		}
	}

	return newState;
}

let otherSprites = document.createElement("img");
let glassesSprites = document.createElement("img");
const glassesXOverlap = 4;
otherSprites.src = "sprites/catStanding.png"
glassesSprites.src = "sprites/sunglasses.png"

class CanvasDisplay {
	constructor(parent, level) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = Math.min(1500, level.width);
		this.canvas.height = Math.min(890, level.height);
		parent.appendChild(this.canvas);
		this.context = this.canvas.getContext("2d");

		this.viewport = {
			left: 0,
			top: 0,
			width: this.canvas.width,
			height: this.canvas.height
		}
	}

	clear() {
		this.canvas.remove();
	}
}

CanvasDisplay.prototype.setState = function(state) {
	let glasses = state.actors.find(a => a.type === "Glasses");	
	this.updateViewport(state);
	this.clearDisplay(state.status);
	this.drawActors(state.actors, state.debug);
	this.drawText(state.status, glasses);
};

CanvasDisplay.prototype.updateViewport = function(state) {
	let view = this.viewport;
	let hMargin = view.width * 2 / 5;
	let vMargin = view.height * 2 / 5;
	let glasses = state.glasses;
	let center = glasses.position.plus(glasses.size.times(0.5));

	if (center.x < view.left + hMargin) {
		view.left = Math.max(center.x - hMargin, 0);
	} else if (center.x > view.left + view.width - hMargin) {
		view.left = Math.min(center.x + hMargin - view.width,
							 state.level.width - view.width);
	}

	if (center.y < view.top + vMargin) {
		view.top = Math.max(center.y - vMargin, 0);
	} else if (center.y > view.top + view.height - vMargin) {
		view.top = Math.min(center.y + vMargin - view.height,
							state.level.height - view.height);
	}
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

CanvasDisplay.prototype.drawGlasses = function(actors, x, y, width, height, debug) {
	// let glasses = actors.find(a => a.type === "Glasses");

	// for (actor of actors) {
	// 	if (actor.type === "Kitten" && overlap(glasses, actor, "both")) {
	// 		var ultimatum = true; 
	// 	}
	// }

	// if (!ultimatum && !state.level.touches(position, this.size)) {
		this.context.drawImage(glassesSprites,
						 	   x, y, width, height);
	// } else {
	// 	this.context.drawImage(explosionSprites, 
	// 						   x, y, width, height)
	// 	if (exploded) {
	// }

	if (debug) {
		for (let objectKey in actor.hitboxes) {
			var hitbox = actor.hitboxes[objectKey];
			if (hitbox.type === "failure") this.context.fillStyle = "red";
			else if (hitbox.type === "success") this.context.fillStyle = "green";
			this.context.fillRect(actor.position.x + hitbox.padding.x,
								  actor.position.y + hitbox.padding.y,
								  hitbox.size.x,
								  hitbox.size.y);
		}
	}
}

CanvasDisplay.prototype.drawActors = function(actors, debug) {
	for (let actor of actors) {
		let width = actor.size.x;
		let height = actor.size.y;
		let x = (actor.position.x - this.viewport.left);
		let y = (actor.position.y - this.viewport.top);
		if (actor.type === "Glasses") {
			this.drawGlasses(actors, x, y, width, height, debug);
		} else {
			this.context.drawImage(otherSprites,
								   x, y, width, height);
			if (debug) {
				for (let objectKey in actor.hitboxes) {
					var hitbox = actor.hitboxes[objectKey];
					if (hitbox.type === "failure") this.context.fillStyle = "red";
					else if (hitbox.type === "success") this.context.fillStyle = "green";
					this.context.fillRect(actor.position.x + hitbox.padding.x,
										  actor.position.y + hitbox.padding.y,
										  hitbox.size.x,
										  hitbox.size.y);
				}
			}
		}
	}
}

CanvasDisplay.prototype.drawText = function(status, glasses) {
	this.context.font = "20px Courier New"
	if (glasses.velocity.y > 0.3) this.context.fillStyle = "rgb(255, 0, 0)";
	else this.context.fillStyle = "rgb(0, 0, 0)";
	if (status !== "won" && status !== "lost") this.context.fillText("Velocity: " + glasses.velocity.y.toFixed(2), 30, 30)

	this.context.font = "48px Impact";
	this.context.fillStyle = "rgb(255, 255, 255)";
	if (status === "won") {
		this.context.fillText("You Win!", (this.canvas.width - 130) / 2, (this.canvas.height - 10) / 2);
	} else if (status === "lost") {
		this.context.fillText("Try Again", (this.canvas.width - 130) / 2, (this.canvas.height - 10) / 2);
	}
}

function overlap(actor1, actor2, hitboxType) {
	let onePos = actor1.position;
	let twoPos = actor2.position;
	let hitbox1;
	let hitbox2;
	let commonality = false;

	if (hitboxType === "failure" || hitboxType === "both") {
		for (hitbox1 of actor1.hitboxes) {
			for (hitbox2 of actor2.hitboxes) {
				commonality = onePos.x + hitbox1.padding.x + hitbox1.size.x > twoPos.x + hitbox2.padding.x &&
							  onePos.x + hitbox1.padding.x < twoPos.x + hitbox2.size.x + hitbox2.padding.x &&
							  onePos.y + hitbox1.size.y + hitbox1.padding.y > twoPos.y + hitbox2.padding.y &&
							  onePos.y + hitbox1.padding.y < twoPos.y + hitbox2.size.y + hitbox2.padding.y;
				if (commonality) return commonality;
			}
		}
	}
	if (hitboxType === "success" || hitboxType === "both") {
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
		surrendersMax = varObject.velocity < varObject.maxVelocity;
	} else {
		surrendersMax = varObject.velocity > -varObject.maxVelocity;
	}

	if (key) {
		return (surrendersMax) ? velocity : sign * varObject.maxVelocity;
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
	let ending = 3;

	return new Promise(resolve => {
		arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Backquote"]);
		runAnimation(time => {
			state = state.update(time, arrowKeys);
			display.setState(state);
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

let arrowKeys;

const levelCharacters = {
	"glasses": Glasses,
	"kitten": Kitten,
	"level": "level"
};

let testPlans = [{"k1": 
					{"type": "kitten",
					 "position": new Vector(600, 750)},
				"glasses": 
					{"type": "glasses",
					 "position": new Vector(15, 15),
					 "velocity": new Vector(1, 0.3)},
				"level": 
					{"type": "level",
					 "dimensions": new Vector(890, 890)}
				}, {"k1": 
					{"type": "kitten",
					 "position": new Vector(500, 800)}, 
				"k2": 
					{"type": "kitten",
					 "position": new Vector(600, 700)},
				"k3": 
					{"type": "kitten",
					 "position": new Vector(700, 600)},
				"glasses": 
					{"type": "glasses", 
					 "position": new Vector(15, 15), 
					 "velocity": new Vector(1, 0.3)},
				"level": 
					{"type": "level",
					 "dimensions": new Vector(890, 890)}
				}];