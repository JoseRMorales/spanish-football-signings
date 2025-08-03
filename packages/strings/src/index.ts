export const defaultLang = "en";

export const ui = {
	en: {
		transfer: "🔄 NEW SIGNING",
		player: "👤 Player",
		date: "📅 Date",
		type: "🏷️ Type",
		origin: "🏟️ From",
		destination: "🏟️ To",
		inscriptions: "#Inscriptions",
		spanishLeague: "#LaLiga",
	},
	es: {
		transfer: "🔄 NUEVA INSCRIPCIÓN",
		player: "👤 Jugador",
		date: "📅 Fecha",
		type: "🏷️ Tipo",
		origin: "🏟️ De",
		destination: "🏟️ A",
		inscriptions: "#Inscripciones",
		spanishLeague: "#LaLiga",
	},
} as const;

export type SupportedLang = keyof typeof ui;

export const getTranslation =
	(lang: SupportedLang) => (key: keyof (typeof ui)["en"]) =>
		ui[lang][key] || ui[defaultLang][key] || key;
