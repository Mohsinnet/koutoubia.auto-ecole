export function calculateRemaining(totalAmount: number, firstPayment: number, secondPayment: number) {
  return Math.max(0, totalAmount - firstPayment - secondPayment);
}

export function toggleMenu(isOpen: boolean) {
  return !isOpen;
}

export function formatMoney(value: number) {
  return `${value.toLocaleString("ar-DZ")} درهم`;
}
