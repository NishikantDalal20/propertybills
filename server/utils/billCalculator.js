export function calculateBill({ rent, unitsConsumed, electricityRate, water, maintenance, otherCharges, discount = 0, lateFee = 0 }) {
  const electricity = unitsConsumed * electricityRate;
  const totalAmount = rent + electricity + water + maintenance + otherCharges - discount + lateFee;
  return { electricity, totalAmount };
}