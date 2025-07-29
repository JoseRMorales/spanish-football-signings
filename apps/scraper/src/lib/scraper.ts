import type { ScrapedSigning } from "@repo/shared-types";
import { chromium } from "playwright";

const PAGE_URL = process.env.PAGE_URL || "";

if (!PAGE_URL) {
	throw new Error("PAGE_URL environment variable is not set");
}

export const getTransfers = async (): Promise<ScrapedSigning[]> => {
	const browser = await chromium.launch({});
	const context = await browser.newContext({
		userAgent: process.env.USER_AGENT || undefined,
	});
	const page = await context.newPage();
	await page.goto(PAGE_URL);

	console.log("Waiting for page to load...");
	await page.waitForSelector("table tr td p");

	console.log("Page loaded, scraping data...");
	const rows = await page.$$eval("table tr", (trs) =>
		trs
			.filter((tr) => tr.querySelectorAll("td").length > 0)
			.map((tr) => {
				const tds = Array.from(tr.querySelectorAll("td"));
				return {
					date: tds[0]?.textContent?.trim() || "",
					player: tds[3]?.textContent?.trim() || "",
					destination: tds[4]?.textContent?.trim() || "",
					origin: tds[5]?.textContent?.trim() || "",
					type: tds[6]?.textContent?.trim() || "",
				};
			}),
	);

	return rows;
};
