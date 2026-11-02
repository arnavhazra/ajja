export function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function whatsAppHref(phone: string, text: string) {
  return `https://wa.me/${digits(phone)}?text=${encodeURIComponent(text)}`;
}

export function pieceMessage(input: {
  shop: string;
  title: string;
  price: string | null;
  url: string;
}) {
  const cleanTitle = (input.title || "").replace(/title not written yet/gi, "").trim();
  const name = cleanTitle || "a piece from the studio";
  const cleanPrice = input.price && !input.price.toLowerCase().includes("not written yet") ? input.price : null;
  const price = cleanPrice ? ` The price is ${cleanPrice}.` : "";
  return `Hello ${input.shop}, I would like to ask about ${name}.${price} ${input.url}`;
}
