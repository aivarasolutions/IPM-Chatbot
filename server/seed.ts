import { db } from "./db";
import { properties } from "@shared/schema";
import { readFile } from "fs/promises";
import { join } from "path";

async function seed() {
  try {
    // Load properties from JSON
    const propertiesData = await readFile(
      join(process.cwd(), "server/knowledge/properties.json"),
      "utf-8"
    );
    const { featured_properties } = JSON.parse(propertiesData);

    // Check if properties already exist
    const existing = await db.select().from(properties);
    if (existing.length > 0) {
      console.log("Properties already seeded, skipping...");
      return;
    }

    // Insert properties
    for (const prop of featured_properties) {
      await db.insert(properties).values({
        id: prop.id,
        name: prop.name,
        location: prop.location,
        country: prop.country,
        priceRange: prop.priceRange,
        roi: prop.roi,
        features: prop.features,
        description: prop.description,
        imageUrl: prop.imageUrl,
        propertyType: prop.propertyType,
      });
    }

    console.log(`Seeded ${featured_properties.length} properties successfully!`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
