import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const BG = "#0B1220";
const CARD = "#111827";
const CARD2 = "#0f172a";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const BORDER = "#1f2937";
const SUCCESS = "#10b981";

const CATEGORIES = [
  {
    id: 1,
    name: "Salads",
    icon: "leaf-outline",
    color: "#10b981",
    dishes: [
      {
        id: 1,
        name: "Quinoa & Chickpea Salad with Lemon-Tahini Dressing",
        image: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=500&q=80",
        time: "20–25 min",
        highlights: "High in protein & fiber",
        nutrition: "~350–400 kcal, 10–12g protein, 8–10g fiber",
        instructions: "Cook quinoa, mix chickpeas, chopped veggies (cucumber, tomato, bell pepper), parsley. Whisk tahini + lemon + garlic + olive oil. Toss."
      },
      {
        id: 2,
        name: "Greek Salad with Feta & Olives",
        image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=500&q=80",
        time: "10–15 min",
        highlights: "Good fats, vitamins, moderate protein",
        nutrition: "~200–250 kcal",
        instructions: "Chop tomato, cucumber, red onion, olives, add feta, drizzle olive oil + oregano + a bit of vinegar."
      },
      {
        id: 3,
        name: "Kale & Apple Slaw with Walnuts",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "High in antioxidants, fiber, omega-3 from walnuts",
        nutrition: "~180–220 kcal",
        instructions: "Thinly slice kale and apple, massage kale with a little olive oil, mix with walnuts, lemon juice, honey."
      },
      {
        id: 4,
        name: "Roasted Beet & Arugula Salad",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
        time: "35–40 min",
        highlights: "Nitrates, folate, antioxidants",
        nutrition: "~250–300 kcal",
        instructions: "Roast beet cubes, cool. Toss with arugula, goat cheese or ricotta, toasted nuts, vinaigrette."
      },
      {
        id: 5,
        name: "Warm Sweet Potato & Spinach Salad",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Complex carbs, iron, vitamins",
        nutrition: "~300–350 kcal",
        instructions: "Roast sweet potato, in same pan sauté garlic + spinach, combine with potatoes, top with seeds, light dressing."
      },
      {
        id: 6,
        name: "Mango & Black Bean Salad",
        image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Protein + fiber + vitamin C",
        nutrition: "~280–320 kcal",
        instructions: "Dice mango, bell pepper, red onion; mix black beans, cilantro, lime juice, olive oil."
      },
      {
        id: 7,
        name: "Asian Cabbage & Edamame Salad",
        image: "https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Plant protein, fiber",
        nutrition: "~220–260 kcal",
        instructions: "Shred cabbage, add cooked edamame, shredded carrot, scallions, sesame seeds. Dressing: soy/tamari + rice vinegar + sesame oil + ginger."
      }
    ]
  },
  {
    id: 2,
    name: "Soups & Stews",
    icon: "water-outline",
    color: "#f59e0b",
    dishes: [
      {
        id: 8,
        name: "Lentil & Vegetable Soup",
        image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=500&q=80",
        time: "40 min",
        highlights: "High in plant protein, fiber",
        nutrition: "~250–300 kcal, 12–15g protein",
        instructions: "Sauté onion, carrot, celery, garlic; add red lentils + stock + diced tomato + spices; simmer till lentils cook."
      },
      {
        id: 9,
        name: "Chicken & Vegetable Stew",
        image: "https://images.unsplash.com/photo-1604908815678-9cb2e8cda6de?auto=format&fit=crop&w=500&q=80",
        time: "1 hr",
        highlights: "Lean protein, minerals",
        nutrition: "~350–400 kcal",
        instructions: "Brown chicken pieces, set aside; sauté vegetables, add stock, herbs, return chicken, simmer."
      },
      {
        id: 10,
        name: "Minestrone (with beans & pasta)",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=500&q=80",
        time: "50 min",
        highlights: "Balanced carbs, protein, veggies",
        nutrition: "~300–350 kcal",
        instructions: "Sauté onion, garlic; add chopped veggies, beans, stock; near end add small pasta; season."
      },
      {
        id: 11,
        name: "Butternut Squash & Red Pepper Soup",
        image: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=500&q=80",
        time: "45 min",
        highlights: "Beta-carotene, vitamins",
        nutrition: "~180–220 kcal",
        instructions: "Roast squash & pepper (or sauté), then blend with stock, onion, garlic, season to taste."
      },
      {
        id: 12,
        name: "Tomato & White Bean Soup",
        image: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=500&q=80",
        time: "35 min",
        highlights: "Fiber, protein, lycopene",
        nutrition: "~220–260 kcal",
        instructions: "Sauté aromatics, add canned or cooked beans, tomatoes, herbs, simmer."
      },
      {
        id: 13,
        name: "Miso Soup with Tofu & Greens",
        image: "https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Low calorie, good for digestion",
        nutrition: "~70–100 kcal",
        instructions: "Bring dashi/light stock, add miso paste, cubes of tofu, seaweed or greens, scallions."
      },
      {
        id: 14,
        name: "Moroccan Chickpea & Sweet Potato Stew",
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=500&q=80",
        time: "1 hr",
        highlights: "Plant protein, complex carbs, spice",
        nutrition: "~320–360 kcal",
        instructions: "Sauté onion, garlic, ginger; add sweet potato, chickpeas, tomato or stock, spice mix (cumin, cinnamon), simmer."
      }
    ]
  },
  {
    id: 3,
    name: "Veggie-Based Mains",
    icon: "nutrition-outline",
    color: "#22c55e",
    dishes: [
      {
        id: 15,
        name: "Stir-fried Tofu with Broccoli & Bell Pepper",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Plant protein, vitamins",
        nutrition: "~250–350 kcal, 15–20g protein",
        instructions: "Press tofu, cube, sauté until golden; remove; stir-fry broccoli & pepper, add tofu, sauce (soy, garlic, ginger)."
      },
      {
        id: 16,
        name: "Stuffed Bell Peppers with Quinoa & Veggies",
        image: "https://images.unsplash.com/photo-1606850780554-b55ef539f1e7?auto=format&fit=crop&w=500&q=80",
        time: "45–50 min",
        highlights: "Balanced, fiber",
        nutrition: "~300–400 kcal",
        instructions: "Cook quinoa, mix with sautéed veggies & beans, fill halved bell peppers, top with cheese or breadcrumbs, bake."
      },
      {
        id: 17,
        name: "Cauliflower 'Steak' with Chimichurri",
        image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Low-carb, phytonutrients",
        nutrition: "~200–280 kcal",
        instructions: "Slice thick cauliflower, roast or grill; make chimichurri (herbs, garlic, lemon, oil) & spoon on top."
      },
      {
        id: 18,
        name: "Eggplant & Chickpea Curry",
        image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=500&q=80",
        time: "40 min",
        highlights: "Fiber, plant protein",
        nutrition: "~320–380 kcal",
        instructions: "Sauté onion, garlic, spices; add eggplant cubes, chickpeas, tomatoes, simmer till tender."
      },
      {
        id: 19,
        name: "Zucchini Noodles with Pesto & Cherry Tomatoes",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Low-carb, healthy fats",
        nutrition: "~250–300 kcal",
        instructions: "Spiralize zucchini, toss with fresh basil pesto, halved cherry tomatoes, optional pine nuts."
      },
      {
        id: 20,
        name: "Grilled Portobello Mushroom Burger",
        image: "https://images.unsplash.com/photo-1585238341710-c6de17b4b3ae?auto=format&fit=crop&w=500&q=80",
        time: "25 min",
        highlights: "Umami, lower calories",
        nutrition: "~200–280 kcal",
        instructions: "Marinate mushroom caps, grill; serve on bun or lettuce with veggies, sauce."
      },
      {
        id: 21,
        name: "Lentil & Mushroom 'Meatloaf'",
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80",
        time: "1 hr",
        highlights: "Protein, fiber",
        nutrition: "~300–380 kcal",
        instructions: "Cook lentils, sauté mushrooms & aromatics, mix with oats or breadcrumbs, shape loaf, bake."
      }
    ]
  },
  {
    id: 4,
    name: "Lean Proteins",
    icon: "fish-outline",
    color: "#60a5fa",
    dishes: [
      {
        id: 22,
        name: "Grilled Salmon with Lemon & Herbs",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Omega-3, protein",
        nutrition: "~350–450 kcal, 35–40g protein",
        instructions: "Season salmon with salt, pepper, herbs, grill or bake, finish with lemon juice."
      },
      {
        id: 23,
        name: "Baked Chicken Breast with Herbs",
        image: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Lean protein",
        nutrition: "~300–400 kcal, 40–50g protein",
        instructions: "Marinate chicken in yogurt + herbs + garlic, bake until internal temp safe."
      },
      {
        id: 24,
        name: "Turkey Meatballs in Tomato Sauce",
        image: "https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=500&q=80",
        time: "40 min",
        highlights: "Lean protein, flavorful",
        nutrition: "~320–380 kcal",
        instructions: "Mix ground turkey + spices + binder, form balls, bake or pan-sear, then simmer in tomato sauce."
      },
      {
        id: 25,
        name: "Lean Beef/Sirloin Steak with Veggies",
        image: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=500&q=80",
        time: "20–25 min",
        highlights: "Iron, B12, protein",
        nutrition: "~400–500 kcal",
        instructions: "Season steak, grill or pan-sear to desired doneness, serve with roasted or steamed vegetables."
      },
      {
        id: 26,
        name: "Grilled Shrimp Skewers with Veggies",
        image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Low calorie, high protein",
        nutrition: "~200–280 kcal, 25–30g protein",
        instructions: "Marinate shrimp, thread onto skewers alternately with veggies, grill."
      },
      {
        id: 27,
        name: "Baked Cod with Garlic & Spinach",
        image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80",
        time: "25–30 min",
        highlights: "Low-fat, high protein",
        nutrition: "~250–320 kcal",
        instructions: "Place cod on bed of spinach, drizzle garlic-olive oil, bake."
      },
      {
        id: 28,
        name: "Oven-roasted Turkey or Chicken with Roots",
        image: "https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?auto=format&fit=crop&w=500&q=80",
        time: "1 hr",
        highlights: "Balanced protein + veg",
        nutrition: "~400–500 kcal",
        instructions: "Season whole or half, roast with carrots, potatoes, herbs."
      }
    ]
  },
  {
    id: 5,
    name: "Grain & Legume Bowls",
    icon: "restaurant-outline",
    color: "#a78bfa",
    dishes: [
      {
        id: 29,
        name: "Buddha Bowl with Brown Rice, Roasted Veg & Chickpeas",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
        time: "35–40 min",
        highlights: "Balanced carbs + protein + veg",
        nutrition: "~400–480 kcal",
        instructions: "Roast veggies & chickpeas, cook brown rice, assemble bowl with greens, drizzle sauce."
      },
      {
        id: 30,
        name: "Barley Risotto with Mushrooms & Peas",
        image: "https://images.unsplash.com/photo-1600803907087-f56d462fd26b?auto=format&fit=crop&w=500&q=80",
        time: "45 min",
        highlights: "Whole grain + fiber",
        nutrition: "~350–420 kcal",
        instructions: "Use pearled barley, sauté onion, gradually add stock, stir, add mushrooms + peas."
      },
      {
        id: 31,
        name: "Quinoa Salad Bowl with Mixed Beans",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
        time: "25 min",
        highlights: "Protein, fiber",
        nutrition: "~380–450 kcal",
        instructions: "Cook quinoa, mix with beans, corn, veggies, citrus dressing."
      },
      {
        id: 32,
        name: "Farro Salad with Roasted Veg & Feta",
        image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=500&q=80",
        time: "40 min",
        highlights: "Whole grain, minerals",
        nutrition: "~400–470 kcal",
        instructions: "Cook farro, roast veg, combine with feta, olive oil, lemon."
      },
      {
        id: 33,
        name: "Lentil & Sweet Potato Bowl",
        image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=500&q=80",
        time: "35 min",
        highlights: "Protein, iron, complex carbs",
        nutrition: "~380–450 kcal",
        instructions: "Cook lentils, roast sweet potato, combine with greens, dressing."
      },
      {
        id: 34,
        name: "Millet & Veg Stir-fry Bowl",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Gluten-free grain, fiber",
        nutrition: "~350–420 kcal",
        instructions: "Cook millet, stir-fry colorful vegetables, mix with millet and sauce."
      },
      {
        id: 35,
        name: "Chickpea & Brown Rice Curry Bowl",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=500&q=80",
        time: "40 min",
        highlights: "Plant protein + whole grain",
        nutrition: "~400–480 kcal",
        instructions: "Cook brown rice, prepare curry with chickpeas & vegetables, serve over rice."
      }
    ]
  },
  {
    id: 6,
    name: "Healthy Breakfasts",
    icon: "sunny-outline",
    color: "#fbbf24",
    dishes: [
      {
        id: 36,
        name: "Overnight Oats with Berries & Nuts",
        image: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=500&q=80",
        time: "5 min prep",
        highlights: "Fiber, slow carbs, healthy fats",
        nutrition: "~300–380 kcal",
        instructions: "Combine oats + milk or plant milk + chia + sweetener + berries + nuts, refrigerate overnight."
      },
      {
        id: 37,
        name: "Chia Pudding with Fruit",
        image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80",
        time: "10 min prep + chill",
        highlights: "Omega-3, fiber",
        nutrition: "~250–320 kcal",
        instructions: "Mix chia seeds + milk + sweetener, let rest, top with fruit."
      },
      {
        id: 38,
        name: "Veggie Omelette/Scramble",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=80",
        time: "10 min",
        highlights: "Protein, vitamins",
        nutrition: "~250–350 kcal, 15–20g protein",
        instructions: "Whisk eggs, pour in pan, add chopped vegetables, cook gently."
      },
      {
        id: 39,
        name: "Smoothie Bowl (greens, fruit, protein)",
        image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=500&q=80",
        time: "5–10 min",
        highlights: "Quick, nutrient-dense",
        nutrition: "~300–400 kcal",
        instructions: "Blend spinach + banana + yogurt or plant protein + milk, pour in bowl, top with nuts/seeds."
      },
      {
        id: 40,
        name: "Whole-Grain Pancakes with Banana",
        image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Better carbs, fiber",
        nutrition: "~350–420 kcal",
        instructions: "Use whole-grain flour, mashed banana, egg/milk, cook pancake style, top with fruit."
      },
      {
        id: 41,
        name: "Avocado Toast on Whole Grain Bread",
        image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=500&q=80",
        time: "5–7 min",
        highlights: "Healthy fats, fiber",
        nutrition: "~280–350 kcal",
        instructions: "Mash avocado + lemon + salt, spread on toasted whole grain bread, top with seeds/tomato."
      },
      {
        id: 42,
        name: "Cottage Cheese/Greek Yogurt Parfait",
        image: "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=500&q=80",
        time: "5 min",
        highlights: "Protein, probiotics",
        nutrition: "~250–320 kcal, 20–25g protein",
        instructions: "Layer yogurt or cottage cheese + fruit + granola/nuts."
      }
    ]
  },
  {
    id: 7,
    name: "Low-Carb/Keto",
    icon: "barbell-outline",
    color: "#ef4444",
    dishes: [
      {
        id: 43,
        name: "Zucchini Noodles with Pesto & Chicken",
        image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Low-carb, protein",
        nutrition: "~350–420 kcal, <15g carbs",
        instructions: "Spiralize zucchini, sauté chicken, toss with pesto and zucchini 'noodles.'"
      },
      {
        id: 44,
        name: "Cauliflower Fried Rice",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Replace rice, reduce carbs",
        nutrition: "~200–280 kcal, <12g carbs",
        instructions: "Pulse cauliflower to rice texture, stir-fry with vegetables, egg, season."
      },
      {
        id: 45,
        name: "Eggplant Lasagna (no pasta)",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=80",
        time: "50 min",
        highlights: "Low-carb, hearty",
        nutrition: "~320–400 kcal, <15g carbs",
        instructions: "Slice eggplant, layer with tomato sauce + cheese + veggies, bake."
      },
      {
        id: 46,
        name: "Salmon with Asparagus & Hollandaise",
        image: "https://images.unsplash.com/photo-1580959375944-4985cdea3a77?auto=format&fit=crop&w=500&q=80",
        time: "25 min",
        highlights: "Omega-3, low-carb",
        nutrition: "~400–480 kcal, <8g carbs",
        instructions: "Bake or grill salmon & asparagus, top with low-carb hollandaise or lemon butter."
      },
      {
        id: 47,
        name: "Chicken & Spinach Stuffed Mushrooms",
        image: "https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Protein, low-carb",
        nutrition: "~280–350 kcal, <10g carbs",
        instructions: "Remove stems, stuff mushroom caps with cooked chicken + greens + cheese, bake."
      },
      {
        id: 48,
        name: "Beef & Broccoli Stir-Fry",
        image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Protein, low in carbs",
        nutrition: "~350–420 kcal, <12g carbs",
        instructions: "Sauté beef strips + broccoli in garlic, ginger, soy sauce, light oil."
      },
      {
        id: 49,
        name: "Shrimp & Avocado Salad",
        image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Healthy fats, low-carb",
        nutrition: "~320–380 kcal, <10g carbs",
        instructions: "Poach or grill shrimp, mix with greens, avocado, olive oil, lime juice."
      }
    ]
  },
  {
    id: 8,
    name: "Mediterranean",
    icon: "earth-outline",
    color: "#06b6d4",
    dishes: [
      {
        id: 50,
        name: "Grilled Fish with Olive, Tomato & Herb Salsa",
        image: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Good fats, lean protein",
        nutrition: "~300–380 kcal",
        instructions: "Grill fish, top with chopped tomato, olives, herbs, olive oil."
      },
      {
        id: 51,
        name: "Hummus & Falafel Wrap",
        image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Legumes, fiber",
        nutrition: "~380–450 kcal",
        instructions: "Make or heat falafel, spread hummus, add veggies, wrap."
      },
      {
        id: 52,
        name: "Tabbouleh with Quinoa",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Parsley, mint, fiber",
        nutrition: "~250–320 kcal",
        instructions: "Cook quinoa, cool, mix with parsley, mint, tomato, onion, lemon & olive oil."
      },
      {
        id: 53,
        name: "Greek Yogurt & Cucumber 'Tzatziki' with Grilled Veg",
        image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=500&q=80",
        time: "10 min",
        highlights: "Probiotics, light",
        nutrition: "~180–250 kcal",
        instructions: "Grate cucumber, mix with yogurt, garlic, dill. Serve with grilled vegetables."
      },
      {
        id: 54,
        name: "Mediterranean Chickpea Stew",
        image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500&q=80",
        time: "40 min",
        highlights: "Plant protein, tomato base",
        nutrition: "~320–380 kcal",
        instructions: "Sauté onion, garlic; add chickpeas, tomato, spinach, herbs, simmer."
      },
      {
        id: 55,
        name: "Baked Eggplant Parm (light)",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=80",
        time: "45 min",
        highlights: "Vegetables, moderate protein",
        nutrition: "~280–350 kcal",
        instructions: "Slice eggplant, bake or grill, layer with marinara & a little cheese, bake until golden."
      },
      {
        id: 56,
        name: "Orzo Salad with Olives & Feta",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=500&q=80",
        time: "25 min",
        highlights: "Balanced pasta, veg, healthy fats",
        nutrition: "~350–420 kcal",
        instructions: "Cook orzo, cool, add tomatoes, olives, feta, herbs, oil."
      }
    ]
  },
  {
    id: 9,
    name: "Wraps & Sandwiches",
    icon: "fast-food-outline",
    color: "#f472b6",
    dishes: [
      {
        id: 57,
        name: "Chicken Avocado Wrap",
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Lean protein + healthy fat",
        nutrition: "~380–450 kcal",
        instructions: "Use grilled chicken, avocado slices, greens, whole grain wrap."
      },
      {
        id: 58,
        name: "Hummus & Roasted Veg Wrap",
        image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=500&q=80",
        time: "20 min",
        highlights: "Plant-based, fiber",
        nutrition: "~320–380 kcal",
        instructions: "Roast vegetables, spread hummus on wrap, layer veggies, roll."
      },
      {
        id: 59,
        name: "Turkey & Spinach Whole Grain Sandwich",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=500&q=80",
        time: "10 min",
        highlights: "Lean meat, greens",
        nutrition: "~300–370 kcal",
        instructions: "Use lean turkey slices, spinach, mustard, whole grain bread."
      },
      {
        id: 60,
        name: "Tuna Salad Lettuce Wraps",
        image: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=500&q=80",
        time: "10 min",
        highlights: "Protein, low-carb",
        nutrition: "~220–280 kcal, <8g carbs",
        instructions: "Mix tuna + Greek yogurt/light mayo + celery, herbs. Wrap in lettuce leaves."
      },
      {
        id: 61,
        name: "Falafel Pita with Veggies & Tahini",
        image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80",
        time: "25 min",
        highlights: "Legumes, fiber",
        nutrition: "~380–450 kcal",
        instructions: "Warm pita, fill with falafel, fresh veggies, tahini sauce."
      },
      {
        id: 62,
        name: "Egg & Veggie Breakfast Sandwich",
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=500&q=80",
        time: "10 min",
        highlights: "Protein + veggies",
        nutrition: "~280–350 kcal",
        instructions: "Scramble or fry egg, add spinach/tomato, put on whole grain toast."
      },
      {
        id: 63,
        name: "Grilled Veg & Cheese Panini",
        image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Veggies, moderate protein",
        nutrition: "~320–380 kcal",
        instructions: "Use whole-grain bread, grilled vegetables, a slice of cheese, grill."
      }
    ]
  },
  {
    id: 10,
    name: "Veggie Sides",
    icon: "planet-outline",
    color: "#84cc16",
    dishes: [
      {
        id: 64,
        name: "Roasted Sweet Potato Cubes",
        image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Beta-carotene, fiber",
        nutrition: "~180–250 kcal",
        instructions: "Cube sweet potato, toss with olive oil, salt, roast until tender."
      },
      {
        id: 65,
        name: "Steamed Broccoli with Lemon & Garlic",
        image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=500&q=80",
        time: "10 min",
        highlights: "Vitamin C, fiber",
        nutrition: "~80–120 kcal",
        instructions: "Steam broccoli, toss with garlic, lemon juice, a bit olive oil."
      },
      {
        id: 66,
        name: "Grilled Asparagus with Parmesan",
        image: "https://images.unsplash.com/photo-1580959375944-4985cdea3a77?auto=format&fit=crop&w=500&q=80",
        time: "15 min",
        highlights: "Minerals, vitamins",
        nutrition: "~100–150 kcal",
        instructions: "Grill asparagus, sprinkle a bit of parmesan or nutritional yeast."
      },
      {
        id: 67,
        name: "Roasted Brussels Sprouts with Balsamic Glaze",
        image: "https://images.unsplash.com/photo-1569589424916-7f682e3f9f09?auto=format&fit=crop&w=500&q=80",
        time: "30 min",
        highlights: "Fiber, antioxidants",
        nutrition: "~120–180 kcal",
        instructions: "Halve sprouts, roast, drizzle reduction of balsamic vinegar."
      },
      {
        id: 68,
        name: "Steamed Green Beans with Almonds",
        image: "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=500&q=80",
        time: "12 min",
        highlights: "Fiber, healthy fat",
        nutrition: "~100–150 kcal",
        instructions: "Steam beans, toss with toasted slivered almonds & lemon."
      },
      {
        id: 69,
        name: "Roasted Carrot & Parsnip Medley",
        image: "https://images.unsplash.com/photo-1522184216316-3c25379f9760?auto=format&fit=crop&w=500&q=80",
        time: "35 min",
        highlights: "Root vegetable vitamins",
        nutrition: "~150–200 kcal",
        instructions: "Chop carrots & parsnips, toss with herbs & olive oil, roast."
      },
      {
        id: 70,
        name: "Cauliflower Florets with Curry Powder",
        image: "https://images.unsplash.com/photo-1568584711271-89fbaf75f198?auto=format&fit=crop&w=500&q=80",
        time: "25 min",
        highlights: "Low-carb, phytonutrients",
        nutrition: "~100–150 kcal",
        instructions: "Toss cauliflower with a little oil & curry powder, roast till edges crisp."
      }
    ]
  }
];

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";

export default function HealthyDishesScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (dishId) => {
    setImageErrors(prev => ({ ...prev, [dishId]: true }));
  };

  const filteredCategories = CATEGORIES.map(category => ({
    ...category,
    dishes: category.dishes.filter(dish =>
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.highlights.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.dishes.length > 0);

  const displayCategories = searchQuery ? filteredCategories : 
    selectedCategory ? [CATEGORIES.find(c => c.id === selectedCategory)] : CATEGORIES;

  const openDishModal = (dish) => {
    setSelectedDish(dish);
    setShowModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (selectedCategory) {
            setSelectedCategory(null);
          } else {
            navigation.goBack();
          }
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.name : "Healthy Dishes"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={MUTED} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dishes..."
          placeholderTextColor={MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={MUTED} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!selectedCategory && !searchQuery && (
          <View style={styles.introCard}>
            <Ionicons name="restaurant" size={32} color={SUCCESS} />
            <Text style={styles.introTitle}>Nutritious Recipes</Text>
            <Text style={styles.introText}>
              Explore 70+ healthy dishes across 10 categories. Each recipe includes prep time, nutrition info, and step-by-step instructions.
            </Text>
          </View>
        )}

        {displayCategories.map(category => (
          <View key={category.id}>
            {/* Category Header */}
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => setSelectedCategory(selectedCategory ? null : category.id)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryLeft}>
                <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
                  <Ionicons name={category.icon} size={24} color={category.color} />
                </View>
                <View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.dishes.length} recipes</Text>
                </View>
              </View>
              <Ionicons 
                name={selectedCategory === category.id ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={MUTED} 
              />
            </TouchableOpacity>

            {/* Dishes Grid */}
            {(selectedCategory === category.id || searchQuery) && (
              <View style={styles.dishesGrid}>
                {category.dishes.map(dish => (
                  <TouchableOpacity
                    key={dish.id}
                    style={styles.dishCard}
                    onPress={() => openDishModal(dish)}
                    activeOpacity={0.8}
                  >
                    <Image 
                      source={{ 
                        uri: imageErrors[dish.id] ? FALLBACK_IMAGE : dish.image 
                      }}
                      style={styles.dishImage}
                      onError={() => handleImageError(dish.id)}
                      resizeMode="cover"
                    />
                    <View style={styles.dishContent}>
                      <Text style={styles.dishName} numberOfLines={2}>{dish.name}</Text>
                      <View style={styles.dishMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color={MUTED} />
                          <Text style={styles.metaText}>{dish.time}</Text>
                        </View>
                      </View>
                      <Text style={styles.dishHighlights} numberOfLines={2}>{dish.highlights}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Dish Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedDish && (
                <>
                  <Image 
                    source={{ 
                      uri: imageErrors[selectedDish.id] ? FALLBACK_IMAGE : selectedDish.image 
                    }}
                    style={styles.modalImage}
                    onError={() => handleImageError(selectedDish.id)}
                    resizeMode="cover"
                  />
                  <View style={styles.modalBody}>
                    <Text style={styles.modalTitle}>{selectedDish.name}</Text>
                    
                    <View style={styles.modalTags}>
                      <View style={styles.tag}>
                        <Ionicons name="time-outline" size={16} color={SUCCESS} />
                        <Text style={styles.tagText}>{selectedDish.time}</Text>
                      </View>
                      <View style={styles.tag}>
                        <Ionicons name="flame-outline" size={16} color={SUCCESS} />
                        <Text style={styles.tagText}>{selectedDish.nutrition.split(',')[0]}</Text>
                      </View>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Highlights</Text>
                      <Text style={styles.sectionText}>{selectedDish.highlights}</Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Nutrition Info</Text>
                      <Text style={styles.sectionText}>{selectedDish.nutrition}</Text>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Instructions</Text>
                      <Text style={styles.sectionText}>{selectedDish.instructions}</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color={TEXT} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  introCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
  },
  categoryCount: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  dishesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  dishCard: {
    width: (width - 44) / 2,
    backgroundColor: CARD,
    borderRadius: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    overflow: "hidden",
  },
  dishImage: {
    width: "100%",
    height: 140,
    backgroundColor: CARD2,
  },
  dishContent: {
    padding: 12,
  },
  dishName: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
    lineHeight: 18,
  },
  dishMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: MUTED,
    marginLeft: 4,
  },
  dishHighlights: {
    fontSize: 12,
    color: MUTED,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalImage: {
    width: "100%",
    height: 250,
    backgroundColor: CARD2,
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 16,
    lineHeight: 28,
  },
  modalTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 13,
    color: TEXT,
    marginLeft: 6,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 22,
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});