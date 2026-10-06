const fs = require("fs");

const inputFile =
    "./data/rooms.json";

const outputFile =
    "./data/rooms.json";

// Read broken JSON as plain text
let text = fs.readFileSync(inputFile, "utf8");

// Fix invisible non-breaking spaces
text = text.replace(/\u00A0/g, " ");

// Fix corrupted JSON symbols
text = text.replace(/"\*:\*/g, "\":");
text = text.replace(/\*:\*/g, ":");
text = text.replace(/\*}\*/g, "},");

// Fix the missing { before room 1402
text = text.replace(
    /(\},\s*)"blockName":\s*"PARMACUTICAL BLOCK"/,
    `$1{\n      "blockName": "PARMACUTICAL BLOCK"`
);

// Remove trailing commas before }
text = text.replace(
    /(".*?")\s*,\s*\n\s*}/g,
    `$1\n    }`
);

// Remove trailing comma before ]
text = text.replace(
    /,\s*\n\s*\]/g,
    "\n  ]"
);

// Parse to make sure JSON is valid
let data;

try {
    data = JSON.parse(text);
} catch (error) {
    console.error("JSON IS STILL INVALID");
    console.error(error.message);
    process.exit(1);
}

// Write clean formatted JSON
fs.writeFileSync(
    outputFile,
    JSON.stringify(data, null, 2),
    "utf8"
);

console.log("================================");
console.log("JSON FIXED SUCCESSFULLY");
console.log("================================");
console.log("Rooms:", data.rooms.length);
console.log("Output:");
console.log(outputFile);