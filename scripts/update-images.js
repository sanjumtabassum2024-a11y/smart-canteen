
const mongoose = require("mongoose");

const Food = mongoose.model(
  "Food",
  new mongoose.Schema({
    name: String,
    image: String,
    category: String
  })
);

const photos = {
  // BREAKFAST
  "Idli with Sambar": "/assets/foods/idli-sambar.jpg",
  "Masala Dosa": "/assets/foods/masala-dosa.jpg",
  "Pongal": "/assets/foods/pongal.jpg",
  "Poori Masala": "/assets/foods/poori-masala.jpg",
  "Vegetable Upma": "/assets/foods/Vegetable_Upma.JPG",
  // MEALS
  "South Indian Meals": "/assets/foods/south-indian-meals.jpg",
  "Vegetable Biryani": "/assets/foods/vegetable-biryani.jpg",
  "Chapati with Kurma": "/assets/foods/chapati-kurma.jpg",
  "Curd Rice": "/assets/foods/curd-rice.jpg",
  "Lemon Rice": "/assets/foods/lemon-rice.jpg",

  // SNACKS
  "Samosa": "/assets/foods/samosa.jpg",
  "Vegetable Pakora": "/assets/foods/vegetable-pakora.jpg",
  "Medu Vada": "/assets/foods/medu-vada.jpg",
  "Vegetable Sandwich": "/assets/foods/vegetable-sandwich.jpg",
  "Onion Pakora": "/assets/foods/onion-pakora.jpg",

  // DRINKS
  "Filter Coffee": "/assets/foods/filter-coffee.jpg",
  "Mango Juice": "/assets/foods/mango-juice.jpg",
  "Sweet Lime Juice": "/assets/foods/sweet-lime-juice.jpg",
  "Chocolate Milkshake": "/assets/foods/chocolate-milkshake.jpg",
  "Masala Tea": "/assets/foods/masala-tea.jpg",

  // DESSERTS
  "Kesari": "/assets/foods/kesari.jpg",
  "Gulab Jamun": "/assets/foods/gulab-jamun.jpg",
  "Ice Cream": "/assets/foods/ice-cream.jpg",
  "Fruit Salad": "/assets/foods/fruit-salad.jpg",
  "Payasam": "/assets/foods/payasam.jpg"
};
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/smart_canteen");

  for (const [name, image] of Object.entries(photos)) {
    const result = await Food.updateOne({ name }, { $set: { image } });
    console.log(name, result.matchedCount ? "updated" : "not found");
  }
    // Correct food categories
  await Food.updateOne(
    { name: "Masala Dosa" },
    { $set: { category: "Breakfast" } }
  );

  await Food.updateOne(
    { name: "Chapati with Kurma" },
    { $set: { category: "Meals" } }
  );

  console.log("Menu categories corrected.");

  await mongoose.disconnect();
  console.log("Image updates finished.");
}

main().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});

