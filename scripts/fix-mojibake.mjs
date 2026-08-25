// One-shot mojibake repair: PowerShell Set-Content passes decoded UTF-8 as
// cp1252 and re-encoded, corrupting — § … ◆ · into â€"" â—† Â§ â€¦ Â·.
import fs from "node:fs";

const MAP = [
  ["â€”", "—"],
  ["â€\"", "—"],
  ["â€¦", "…"],
  ["â—†", "◆"],
  ["Â§", "§"],
  ["Â·", "·"],
  ["â€˜", "'"],
  ["â€™", "'"],
  ["â€œ", '"'],
  ["â€\x9d", '"'],
];

const files = process.argv.slice(2);
for (const file of files) {
  let src = fs.readFileSync(file, "utf8");
  let count = 0;
  for (const [bad, good] of MAP) {
    while (src.includes(bad)) {
      src = src.split(bad).join(good);
      count += 1;
    }
  }
  if (count) {
    fs.writeFileSync(file, src);
    console.log(`${file}: ${count} replacements`);
  } else {
    console.log(`${file}: clean`);
  }
}
