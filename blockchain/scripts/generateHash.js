// Utility to generate a SHA-256 hash for certificate-like data.
// Usage: node scripts/generateHash.js "Alice Student" "B.Tech CSE" "2026-05-30" "IIT Madras"
import crypto from 'crypto';

export function generateHash({ name, degree, date, institution }) {
  const canonical = `${name}|${degree}|${date}|${institution}`;
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}

if (process.argv.length > 3) {
  const [name, degree, date, institution] = process.argv.slice(2);
  console.log(generateHash({ name, degree, date, institution }));
}
