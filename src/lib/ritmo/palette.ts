export const HABIT_COLORS = [
  "#7F9A86",
  "#5B7C6A",
  "#3F6B5A",
  "#8AA3B0",
  "#5E7A8C",
  "#3D5A6C",
  "#C17B64",
  "#A85A4A",
  "#8B3E34",
  "#C4A574",
  "#A68654",
  "#8A6A3A",
  "#8B7BA8",
  "#6E5E8C",
  "#B07A8A",
  "#8E5A68",
  "#6A8F78",
  "#4F7A66",
  "#7A8F6A",
  "#9A7A5A",
  "#5A6E7A",
  "#7A5A4A",
  "#4A5A4A",
  "#6A4A4A",
  "#4A4A5A",
  "#5A7A8A",
  "#8A6A5A",
  "#6A5A4A",
  "#3A4A3A",
  "#4A3A3A",
  "#2A3A3A",
  "#3A3A4A",
] as const;

export const EMOJI_SET: { cat: string; items: string[] }[] = [
  {
    cat: "Ritmo",
    items: ["✦", "✧", "●", "■", "▲", "◆", "○", "□", "☀", "☾", "★", "☆"],
  },
  {
    cat: "Cuerpo",
    items: ["💧", "🚶", "🏃", "🚴", "🧘", "💪", "🥗", "🍎", "😴", "🧠", "🫀", "🦷"],
  },
  {
    cat: "Mente",
    items: ["📖", "✍️", "🎯", "🧩", "🎓", "💡", "🗣️", "📝", "🎹", "🎨", "📷", "🎧"],
  },
  {
    cat: "Casa",
    items: ["🧹", "🧺", "🍳", "🪴", "🛏️", "🧼", "🪙", "📦", "🛠️", "🔑", "🪵", "🕯️"],
  },
  {
    cat: "Vínculo",
    items: ["💬", "📞", "🤝", "💌", "👨‍👩‍👧", "🐕", "🙏", "🫶", "🫂", "✉️", "🎁", "☕"],
  },
];

export const STARTER_HABITS = [
  {
    name: "Agua",
    emoji: "💧",
    color: "#5E7A8C",
    description: "Un vaso al despertar y otro al mediodía.",
    tracking: "count" as const,
    dailyTarget: 6,
  },
  {
    name: "Caminar",
    emoji: "🚶",
    color: "#7F9A86",
    description: "Salir aunque sea una vuelta a la manzana.",
    tracking: "check" as const,
    dailyTarget: 1,
  },
  {
    name: "Leer",
    emoji: "📖",
    color: "#C17B64",
    description: "Diez páginas, sin negociar el sofá.",
    tracking: "check" as const,
    dailyTarget: 1,
  },
];

export function searchEmoji(q: string): string[] {
  const query = q.trim().toLowerCase();
  const all = EMOJI_SET.flatMap((c) => c.items);
  if (!query) return all;
  const names: Record<string, string> = {
    "💧": "agua water",
    "🚶": "caminar walk",
    "🏃": "correr run",
    "🚴": "bici bike",
    "🧘": "meditar yoga",
    "💪": "gym fuerza",
    "🥗": "comida ensalada",
    "🍎": "fruta manzana",
    "😴": "dormir sueño",
    "🧠": "mente cerebro",
    "📖": "leer libro",
    "✍️": "escribir",
    "🎯": "meta focus",
    "🧹": "limpiar",
    "🍳": "cocinar",
    "💬": "hablar",
    "🙏": "gracias oración",
    "☕": "cafe",
    "✦": "estrella ritmo",
  };
  return all.filter((e) => e.includes(query) || (names[e] ?? "").includes(query));
}
