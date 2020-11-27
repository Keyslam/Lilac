import TextureAtlas from "Lilac/Utility/TextureAtlas";

const TilemapMapping: TextureAtlas = {
	imagePath: "Assets/Tilemap/Source.png",
	
	defaultMin: "nearest",
	defaultMag: "nearest",

	defaultWidth: 16,
	defaultHeight: 16,

	subTextures: {
		floor_TL: {x: 170, y: 221},
		floor_TM: {x: 187, y: 221},
		floor_TR: {x: 204, y: 221},
		floor_CL: {x: 170, y: 238},
		floor_CM: {x: 187, y: 238},
		floor_CR: {x: 204, y: 238},
		floor_BL: {x: 170, y: 255},
		floor_BM: {x: 187, y: 255},
		floor_BR: {x: 204, y: 255},
	},
}

export default TilemapMapping;