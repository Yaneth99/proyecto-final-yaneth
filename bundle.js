const fs = require('fs');
const base = fs.readFileSync('balon.txt', 'utf8');

const content = "export const pinzaBaseData = " + JSON.stringify(base) + ";\n" +
                "export const pinzaMovilData = null;\n";

fs.writeFileSync('src/defaultModels.ts', content);
