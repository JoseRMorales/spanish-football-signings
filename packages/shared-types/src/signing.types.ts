export interface ScrapedSigning {
	date: string; // Raw date from LaLiga (DD/MM/YYYY format)
	player: string; // Player name as scraped
	destination: string; // Destination team full name
	origin: string; // Origin team full name (or empty for free agents)
	type: string; // Transfer type in Spanish ('Libre', 'Traspaso', etc.)
}

export interface Signing {
	id: string; // Unique identifier for the signing
	player: string; // Player name
	date: string; // Date of the signing in ISO format
	type: string; // Transfer type (e.g., 'Traspaso', 'Libre')
	origin: string; // Origin team full name
	destination: string; // Destination team full name
	published_tg: boolean; // Whether the signing has been published on Telegram
	published_x: boolean; // Whether the signing has been published on X (formerly Twitter)
}
