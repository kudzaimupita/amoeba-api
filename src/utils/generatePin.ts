/* eslint-disable prettier/prettier */
export default function generatePin(n: number = 6): number {
  // Force n to be 6 if that's what we always want
  n = 6;

  // Generate a random number between 0 and 999999
  const min = 10 ** (n - 1); // 100000 for 6 digits
  const max = 10 ** n - 1; // 999999 for 6 digits

  // Generate random number in range [min, max]
  const pin = Math.floor(Math.random() * (max - min + 1)) + min;
  
  return pin;
}
