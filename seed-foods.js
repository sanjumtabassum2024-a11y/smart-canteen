
const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb://127.0.0.1:27017/smart_canteen";

const FoodSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: String,
  price: Number,
  available: Boolean,
  emoji: String,
  image: String,
});

const Food = mongoose.model("Food", FoodSchema);

const foods = [
    // BREAKFAST
  { name: "Idli with Sambar", category: "Breakfast", price: 40, emoji: "🍘", image: "/assets/foods/idli-sambar.jpg" },
  { name: "Masala Dosa", category: "Breakfast", price: 60, emoji: "🥞", image: "/assets/foods/masala-dosa.jpg" },
  { name: "Pongal", category: "Breakfast", price: 45, emoji: "🍚", image: "/assets/foods/pongal.jpg" },
  { name: "Poori Masala", category: "Breakfast", price: 50, emoji: "🫓", image: "/assets/foods/poori-masala.jpg" },
  { name: "Vegetable Upma", category: "Breakfast", price: 35, emoji: "🥣", image: "/assets/foods/Vegetable_Upma.JPG" },
    // MEALS
  { name: "South Indian Meals", category: "Meals", price: 90, emoji: "🍚", image: "/assets/foods/south-indian-meals.jpg" },
  { name: "Vegetable Biryani", category: "Meals", price: 120, emoji: "🍛", image: "/assets/foods/vegetable-biryani.jpg" },
  { name: "Chapati with Kurma", category: "Meals", price: 100, emoji: "🫓", image: "/assets/foods/chapati-kurma.jpg" },
  { name: "Curd Rice", category: "Meals", price: 85, emoji: "🥣", image: "/assets/foods/curd-rice.jpg" },
  { name: "Lemon Rice", category: "Meals", price: 70, emoji: "🍋", image: "/assets/foods/lemon-rice.jpg" },
    // SNACKS
  { name: "Samosa", category: "Snacks", price: 20, emoji: "🥟", image: "/assets/foods/samosa.jpg" },
  { name: "Vegetable Pakora", category: "Snacks", price: 70, emoji: "🍽️", image: "/assets/foods/vegetable-pakora.jpg" },
  { name: "Medu Vada", category: "Snacks", price: 45, emoji: "🍩", image: "/assets/foods/medu-vada.jpg" },
  { name: "Vegetable Sandwich", category: "Snacks", price: 50, emoji: "🥪", image: "/assets/foods/vegetable-sandwich.jpg" },
  { name: "Onion Pakora", category: "Snacks", price: 65, emoji: "🍽️", image: "/assets/foods/onion-pakora.jpg" },
      // DRINKS
  { name: "Filter Coffee", category: "Drinks", price: 15, emoji: "☕", image: "/assets/foods/filter-coffee.jpg" },
  { name: "Mango Juice", category: "Drinks", price: 40, emoji: "🥭", image: "/assets/foods/mango-juice.jpg" },
  { name: "Sweet Lime Juice", category: "Drinks", price: 30, emoji: "🍋", image: "/assets/foods/sweet-lime-juice.jpg" },
  { name: "Chocolate Milkshake", category: "Drinks", price: 60, emoji: "🥛", image: "/assets/foods/chocolate-milkshake.jpg" },
  { name: "Masala Tea", category: "Drinks", price: 20, emoji: "🍵", image: "/assets/foods/masala-tea.jpg" },
    // DESSERTS
      // DESSERTS
  { name: "Kesari", category: "Desserts", price: 50, emoji: "🍮", image: "/assets/foods/kesari.jpg" },
  { name: "Gulab Jamun", category: "Desserts", price: 35, emoji: "🍮", image: "/assets/foods/gulab-jamun.jpg" },
  { name: "Ice Cream", category: "Desserts", price: 40, emoji: "🍨", image: "/assets/foods/ice-cream.jpg" },
  { name: "Fruit Salad", category: "Desserts", price: 45, emoji: "🍓", image: "/assets/foods/fruit-salad.jpg" },
  { name: "Payasam", category: "Desserts", price: 45, emoji: "🥣", image: "/assets/foods/payasam.jpg" }

].map(food => ({
  ...food,
  description: `Freshly prepared ${food.name.toLowerCase()}.`,
  available: true,
}));


async function seedFoods() {
  try {
    await mongoose.connect(MONGO_URI);

    // Replace the old menu with the new 25 dishes.
    await Food.deleteMany({});
    await Food.insertMany(foods);

    console.log(`Finished! Replaced menu with ${foods.length} dishes.`);
    console.log("Total dishes in menu:", await Food.countDocuments());
    console.log("Categories: Breakfast, Meals, Snacks, Drinks, Desserts");

  } catch (error) {
    console.error("Error replacing menu:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedFoods();

