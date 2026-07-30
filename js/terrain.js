class Terrain {
    /*
    * Represents a terrain in the game.
    * @param {string} name - The name of the terrain.
    * @param {array} palette - The colors palette of the terrain.
    * @param {number} width - The width of the terrain.
    * @param {function} effects - The effects of the terrain.
    */
    constructor(name, palette, width, effects) {
        this.name = name;
        this.palette = palette;
        this.width = width;
        this.effects = effects;
    }

    get backgroundGradient() {
        return `linear-gradient(to right, ${this.palette.join(", ")})`;
    }
}

export class FloodedCity extends Terrain {
    constructor() {
        super("Flooded City", ["var(--white)", "var(--white)"], 3, (robot) => {
            robot.moveEnergy *= 0.8;
        });
    }
}