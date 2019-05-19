const frames = 30;
const maximumVelocity = Math.round(100000 / frames);
const terminalVelocity = Math.round(53000 / frames);
const acceleration = Math.round(10000 / frames);
const gravity = Math.round(9800 / frames);
const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

const scale = 1 / 200;


class Level {
	constructor(plan) {
		this.height = plan.level.dimensions.x;
		this.width = plan.level.dimensions.y;
		this.startActors = [];
		let actorNames = Object.keys(plan);

		actorNames.forEach(actor => {
			let type = levelCharacters[actor];
			if (typeof type === "string") return type;
			let coordinates = plan[actor].coordinates;
			this.startActors.push(
				type.create(coordinates)
			);
			return "empty";
		});
	}
}

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
	constructor(position, speed) {
		this.coordinates = position;
		if (speed === undefined) {
			this.velocity = new Vector(9800, 9800);
		} else {
			this.velocity = speed;
		}
	}

	static create(position, velocity) {
		return new Glasses(position, velocity);
	}

	get type() { return "Glasses" }
}

Glasses.prototype.size = new Vector(10, 5);

Glasses.prototype.update = function(time, state, keys) {
	let velocity = this.velocity;
	let coordinates = this.coordinates;

	velocity.y = Math.min(Math.abs(velocity.y + gravity * time), terminalVelocity);
	velocity.y = keys.ArrowUp ? Math.min(Math.abs(velocity.y + acceleration * time), maximumVelocity) : velocity.y;
	velocity.y = keys.ArrowDown ? Math.min(Math.abs(velocity.y - acceleration * time), maximumVelocity) : velocity.y;
	velocity.x = keys.ArrowRight ? Math.min(Math.abs(velocity.x + acceleration * time), maximumVelocity) : velocity.x;
	velocity.x = keys.ArrowLeft ? Math.min(Math.abs(velocity.x - acceleration * time), maximumVelocity) : velocity.x;

	coordinates.x = coordinates.x + velocity.x;
	coordinates.y = coordinates.y + velocity.y;

	return new Glasses(coordinates, velocity);
}

class Kitten {
	constructor(position) {
		this.coordinates = position;
	}

	static create(position) {
		return new Kitten(position);
	}

	get type() { return "Kitten" }
}

Kitten.prototype.update = function(time) {
	let coordinates = this.coordinates;

	return new Kitten(coordinates);
}

Kitten.prototype.size = new Vector(10, 30);

class State {
	constructor(level, actors, status) {
		this.level = level;
		this.actors = actors;
		this.status = status;
	}

	static start(level) {
		console.log(level.startActors);
		return new State(level, level.startActors, "playing");
	}

	get glasses() {
		console.log(this.actors);
		return this.actors.find(a => a.type === "glasses");
	}
}

State.prototype.update = function(time, keys) {
	console.log(this.actors);
	let actors = this.actors
		.map(actor => {
			actor.update(time, this, keys);
		});
	let newState = new State(this.level, actors, this.status);

	if (newState.status !== "playing") return newState;

	let glasses = newState.glasses;
	// if (this.level.touches(glasses.position, glasses.size, "lava")) {
	// 	return new State(this.level, actors, "lost");
	// }

	// for (let actor of actors) {
	// 	if (actor != glasses && overlap(actor, glasses)) {
	// 		newState = actor.collide(newState);
	// 	}
	// }
	return newState;
}

let otherSprites = document.createElement("img");
let glassesSprites = document.createElement("img");
const glassesXOverlap = 4;
otherSprites.src = "http://eloquentjavascript.net/img/sprites.png"
glassesSprites.src = "http://eloquentjavascript.net/img/player.png"

class CanvasDisplay {
	constructor(parent, level) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = Math.min(600, level.width * scale);
		this.canvas.height = Math.min(450, level.height * scale);
		parent.appendChild(this.canvas);
		this.context = this.canvas.getContext("2d");

		this.viewport = {
			left: 0,
			top: 0,
			width: this.canvas.width / scale,
			height: this.canvas.height / scale
		}
	}

	clear() {
		this.canvas.remove();
	}
}

CanvasDisplay.prototype.setState = function(state) {
	this.updateViewport(state);
	this.clearDisplay(state.status);
	// this.drawBackground(state.level);
	this.drawActors(state.actors);
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
	if (status === "won") {
		this.context.fillStyle = "rgb(68, 191, 255)";
	} else if (status === "lost") {
		this.context.fillStyle = "rgb(44, 136, 214)";
	} else {
		this.context.fillStyle = "rgb(52, 166, 251)";
	}
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

// CanvasDisplay.prototype.drawBackground = function(level) {
// 	this.context.drawImage(otherSprites,
// 						   tileX, 0, scale, scale,
// 						   screenX, screenY, scale, scale)
// }

CanvasDisplay.prototype.drawGlasses = function(glasses, x, y, width, height) {
	width += glassesXOverlap * 2;
	x -= glassesXOverlap;

	let tile = 8;
	if (glasses.speed.y !== 0) {
		tile = 9;
	} else if (glasses.speed.x !== 0) {
		tile = Math.floor(Date.now() / 60) % 8;
	}

	this.context.save();
	let tileX = tile * width;
	this.context.drawImage(glassesSprites,
						   tileX, 0, width, height,
						   x, y, width, height);

	this.context.restore();
}

CanvasDisplay.prototype.drawActors = function(actors) {
	for (let actor of actors) {
		let width = actor.size.x * scale;
		let height = actor.size.y * scale;
		let x = (actor.position.x - this.viewport.left) * scale;
		let y = (actor.position.y - this.viewport.top) * scale;
		if (actor.type === "glasses") {
			this.drawGlasses(actor, x, y, width, height);
		} else {
			let tileX = scale;
			this.context.drawImage(otherSprites,
								   tileX, 0, width, height,
								   x, y, width, height);
		}
	}
}

function trackKeys(keys) {
	let down = Object.create(null);
	function track(event) {
		if (keys.includes(event.key)) {
			down[event.key] = event.type === "keydown";
			event.preventDefault();
		}
	}
	window.addEventListener("keydown", track);
	window.addEventListener("keyup", track);
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
	let ending = 1;
	return new Promise(resolve => {
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
				resolve(state.status);
				return false;
			}
		});
	});
}

async function runGame(plans, Display) {
	let plan = plans[0];
	let status = await runLevel(new Level(plan), Display);
	if (status === "won") console.log("You've won!");
}

const levelCharacters = {
	"glasses": Glasses,
	"kitten": Kitten,
	"level": "level"
};

let testPlans = [{"glasses": {
					"coordinates": new Vector(100, 10),
					"velocity": new Vector(9800, 9800)
				}, "kitten": {
					"coordinates": new Vector(100000, 50000)
				}, "level": {
					"dimensions": new Vector(100000, 100000)
				}
				}]
