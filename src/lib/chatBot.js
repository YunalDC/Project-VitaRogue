// src/lib/chatBot.js
// Lightweight rule-based assistant for fitness/health and in-app help.

export const BOT_USER_ID = "__bot__";
export const BOT_NAME = "VitaBot";

// Simple keyword maps for intent detection + smart Q&A
const INTENTS = [
  { key: "greeting", re: /(\bhi\b|\bhello\b|\bhey\b|\bgood (morning|afternoon|evening)\b)/i },
  { key: "goodbye", re: /(\bbye\b|\bsee you\b|\bthanks\b|\bthank you\b)/i },
  { key: "help_app", re: /(how|where).*(use|find|work|feature|help|navigate|start|scan|chat|message)/i },
  { key: "workout_plan", re: /(workout|exercise|plan|routine|program|sets?|reps?|timer)/i },
  { key: "nutrition", re: /(meal|diet|nutrition|protein|carb|calories?|macro|track.*food)/i },
  { key: "hydration", re: /(drink|water|hydrate|hydration)/i },
  { key: "sleep", re: /(sleep|rest|recovery|bed|insomnia)/i },
  { key: "motivation", re: /(motivat|discipline|consisten|struggle|hard)/i },
  // Smart Q&A targets
  { key: "calorie_lookup", re: /(how\s*many\s*cal(ories|s)|cal(ories|s)|kcal).*\b(banana|egg|apple|rice|bread|milk|chicken|oat|avocado|yogurt|potato|orange|mango|pear|grape|pasta|noodles|beef|fish|tuna|peanut|butter|cheese)\b/i },
  { key: "meal_frequency", re: /(eat(ing)?\s*\d+\s*(x|times)|meals?\s*(a|per)\s*day|how many meals)/i },
  { key: "protein_amount", re: /(how much.*protein|protein per (day|meal)|grams of protein)/i },
  { key: "water_amount", re: /(how much.*water|how many liters|litres|cups of water)/i },
  { key: "weight_loss", re: /(lose (fat|weight)|calorie deficit|cutting|fat loss)/i },
  { key: "weight_gain", re: /(gain (weight|mass)|bulk(ing)?|muscle gain)/i },
  { key: "rest_days", re: /(rest days?|how many rest|rest vs train)/i },
  { key: "cardio_vs_weights", re: /(cardio.*before|weights.*before|cardio vs (weights|lifting))/i },
  { key: "steps_goal", re: /(how many steps|steps per day|10k steps)/i },
  { key: "fasting", re: /(intermittent fasting|skip breakfast|fasting window)/i },
  { key: "cheat_meal", re: /(cheat meal|cheat day)/i },
  { key: "soreness", re: /(sore|DOMS|delayed onset)/i },
  { key: "warmup", re: /(warm ?up|cool ?down|stretch)/i },
  { key: "supplements", re: /(creatine|whey|multivitamin|supplement)/i },
  { key: "sugar_fruit", re: /(sugar|fruit sugar|fructose|is fruit (ok|okay))/i },
];

const OUT_OF_SCOPE = /(crypto|stock|tax|politic|relig|nsfw|sexual|violence|weapons?|hacking|illegal|diagnos|medical treatment|prescription|medication)/i;

function detectIntent(text) {
  for (const { key, re } of INTENTS) {
    if (re.test(text)) return key;
  }
  return "unknown";
}

export function generateBotReply(userText, ctx = {}) {
  const text = (userText || "").trim();
  if (!text) return "I can help with workouts, nutrition, hydration, sleep, and using the app.";

  // Guardrails
  if (OUT_OF_SCOPE.test(text)) {
    return "I’m here to help with fitness, nutrition, hydration, sleep, and how to use the app. I can’t assist with that topic.";
  }

  const intent = detectIntent(text);
  const offlinePrefix = ctx?.offline
    ? "Your coach is currently offline. I’m VitaBot, here to help for now. "
    : "";

  // Smart Q&A answers
  const smart = (key) => {
    switch (key) {
      case 'calorie_lookup': {
        const lower = text.toLowerCase();
        const table = [
          [/banana/, '~105 kcal (medium 118g)'],
          [/apple/, '~95 kcal (medium 182g)'],
          [/egg/, '~70 kcal (large)'],
          [/milk/, '~122 kcal (1 cup whole)'],
          [/bread/, '~80 kcal (1 slice, white)'],
          [/rice/, '~200 kcal (1 cup cooked)'],
          [/oat/, '~150 kcal (1/2 cup dry)'],
          [/chicken/, '~165 kcal (100g cooked breast)'],
          [/beef/, '~250 kcal (100g, varies by cut)'],
          [/fish|tuna/, '~120–150 kcal (100g, varies by type)'],
          [/yogurt/, '~150 kcal (1 cup plain)'],
          [/avocado/, '~240 kcal (1 medium)'],
          [/potato/, '~160 kcal (1 medium)'],
          [/pasta|noodles/, '~200 kcal (1 cup cooked)'],
          [/cheese/, '~110 kcal (28g slice)'],
          [/peanut|butter/, '~190 kcal (2 tbsp peanut butter)'],
          [/orange/, '~62 kcal (1 medium)'],
          [/grape/, '~62 kcal (1 cup)'],
          [/mango/, '~200 kcal (1 medium)'],
          [/pear/, '~100 kcal (1 medium)'],
        ];
        const match = table.find(([re]) => re.test(lower));
        const val = match ? match[1] : null;
        return offlinePrefix + (val
          ? `Approximate calories: ${val}. Values vary by size and preparation.`
          : 'For calories, tell me the food and serving size (e.g., “1 cup cooked rice”).');
      }
      case 'meal_frequency':
        return (
          offlinePrefix +
          "Yes—3–5 meals/snacks per day works for most people. Focus on:\n" +
          "• Total daily calories and protein matter more than exact meal count.\n" +
          "• Spread protein (20–40g) across meals.\n" +
          "• Pick a schedule you can stick to. (General guidance, not medical advice.)"
        );
      case 'protein_amount':
        return (
          offlinePrefix +
          "A common target is ~1.6–2.2 g/kg body weight per day (e.g., 100–150g for 68kg).\n" +
          "Split into meals (20–40g each) and include lean sources (eggs, dairy, poultry, legumes)."
        );
      case 'water_amount':
        return (
          offlinePrefix +
          "A simple guide: ~2–3L/day for many adults; more in heat or hard training.\n" +
          "Sip steadily and check urine color (pale straw is a good sign)."
        );
      case 'weight_loss':
        return (
          offlinePrefix +
          "Fat loss basics:\n" +
          "• Small calorie deficit (≈300–500 kcal/day).\n" +
          "• Prioritize protein, veggies, and fiber; lift 2–4x/week; walk daily.\n" +
          "• Sleep 7–9h. Be consistent for 4–6+ weeks."
        );
      case 'weight_gain':
        return (
          offlinePrefix +
          "Muscle gain basics:\n" +
          "• Small surplus (≈200–300 kcal/day).\n" +
          "• Protein ~1.6–2.2 g/kg; progressive strength training 3–5x/week.\n" +
          "• Sleep 7–9h; track strength and body weight weekly."
        );
      case 'rest_days':
        return (
          offlinePrefix +
          "Plan 1–3 rest days per week depending on intensity and level.\n" +
          "Light walking/mobility on rest days is great for recovery."
        );
      case 'cardio_vs_weights':
        return (
          offlinePrefix +
          "If strength is the priority, lift first; if endurance is the goal, do cardio first.\n" +
          "Or split sessions by time of day to avoid interference."
        );
      case 'steps_goal':
        return (
          offlinePrefix +
          "General activity target: 7k–10k steps/day for health; adjust to your baseline and goals."
        );
      case 'fasting':
        return (
          offlinePrefix +
          "Intermittent fasting can help adherence for some people.\n" +
          "What matters most is total calories, protein, and a routine you can sustain."
        );
      case 'cheat_meal':
        return (
          offlinePrefix +
          "An occasional higher‑calorie meal is okay if it fits weekly goals.\n" +
          "Plan ahead, enjoy mindfully, and get back on routine next meal."
        );
      case 'soreness':
        return (
          offlinePrefix +
          "Mild soreness (DOMS) is normal.\n" +
          "Move gently, hydrate, sleep well; train light or rest until it eases.\n" +
          "Severe pain or injury → consult a professional."
        );
      case 'warmup':
        return (
          offlinePrefix +
          "Warm‑up: 5–10 min easy cardio + dynamic moves for the muscles you’ll use.\n" +
          "Cool‑down: easy movement + light stretching for comfort."
        );
      case 'supplements':
        return (
          offlinePrefix +
          "Evidence‑based basics: whey (or other protein) for convenience, creatine monohydrate 3–5g/day.\n" +
          "Supplements help a little—nutrition, training, and sleep matter most."
        );
      case 'sugar_fruit':
        return (
          offlinePrefix +
          "Whole fruit is generally fine—fiber and nutrients slow sugar absorption.\n" +
          "Limit added sugars; emphasize whole foods and your calorie/protein targets."
        );
      default:
        return null;
    }
  };

  // Use smart Q&A first if matched
  const smartKeys = INTENTS.filter(i => i.key.includes('_') && i.re.test(text)).map(i => i.key);
  if (smartKeys.length) {
    const ans = smart(smartKeys[0]);
    if (ans) return ans;
  }

  switch (intent) {
    case "greeting":
      return offlinePrefix + "Hey! Ask me about workouts, nutrition, or how to use the app.";
    case "goodbye":
      return offlinePrefix + "You’re welcome! I’ll let your coach know you reached out. Keep up the great work!";
    case "help_app":
      return (
        offlinePrefix +
        "Here’s how I can help:\n" +
        "• Start a workout: Discover → pick an exercise → Start.\n" +
        "• Build nutrition plan: More → Nutrition Plan Builder.\n" +
        "• Track progress: Progress tab.\n" +
        "• Message a coach: open a chat and type here."
      );
    case "workout_plan":
      return (
        offlinePrefix +
        "For workouts: aim 3–5 sessions/week. Pick 4–6 exercises, 2–4 sets each.\n" +
        "Use proper form, start light, and rest 60–90s. Want a beginner full‑body template?"
      );
    case "nutrition":
      return (
        offlinePrefix +
        "Nutrition basics: include protein (lean meats, dairy, legumes), smart carbs (whole grains, fruit), and healthy fats.\n" +
        "Use the Food Scanner or Nutrition Plan Builder to plan and track meals."
      );
    case "hydration":
      return offlinePrefix + "Most people do well with ~2–3L water/day; more with heat or intense training. Sip steadily through the day.";
    case "sleep":
      return offlinePrefix + "Aim for 7–9 hours. Keep a consistent schedule, limit screens before bed, and keep your room cool and dark.";
    case "motivation":
      return offlinePrefix + "Motivation comes and goes—build routines. Set small goals, schedule sessions, and track streaks in Progress.";
    default:
      return (
        offlinePrefix +
        "I can help with workouts, nutrition, hydration, sleep, and app guidance.\n" +
        "Tell me your goal (e.g., ‘build muscle’, ‘lose fat’, ‘run 5K’)."
      );
  }
}

export function shouldBotRespond({ isCoach, coachOnline, lastActiveMs, offlineThresholdMs = 5 * 60 * 1000 }) {
  if (!isCoach) return false; // Only auto-reply on coach chats
  if (coachOnline === true) return false; // explicitly online → no bot
  if (coachOnline === false) return true; // explicitly offline → bot yes
  // Presence unknown: if we have lastActive, treat inactive beyond threshold as offline; if no signal at all, default to reply
  if (typeof lastActiveMs === "number") {
    return Date.now() - lastActiveMs > offlineThresholdMs;
  }
  return true; // no presence info → help by default
}
