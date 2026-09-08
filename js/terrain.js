class Terrain {
    /*
    * Represents a terrain in the game.
    * @param {string} name - The name of the terrain.
    * @param {array} palette - The colors palette of the terrain.
    * @param {number} width - The width of the terrain.
    * @param {function} effects - The effects of the terrain.
    * @param {string} [image] - Path to the terrain's background image.
    * @param {string} [themeColor] - Fill color behind the background image.
    */
    constructor(name, palette, width, effects, image, themeColor) {
        this.name = name;
        this.palette = palette;
        this.width = width;
        this.effects = effects;
        this.image = image;
        this.themeColor = themeColor;
    }

    get backgroundGradient() {
        return `linear-gradient(to right, ${this.palette.join(", ")})`;
    }
}

export class FloodedCity extends Terrain {
    constructor() {
        super("Flooded City", ["var(--white)", "var(--white)"], 3, (robot) => {
            robot.moveEnergy *= 0.8;
        }, "images/bg/water.jpg", "#182640");
    }
}

export class Sand extends Terrain {
    constructor() {
        super("Sand", ["var(--white)", "var(--white)"], 3, null, "images/bg/sand.png", "#8a4836");
    }
}

export class Steel extends Terrain {
    constructor() {
        super("Steel", ["var(--white)", "var(--white)"], 3, null, "images/bg/steel.png", "#1f201b");
    }
}