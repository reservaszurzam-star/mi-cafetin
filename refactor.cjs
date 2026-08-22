const fs = require('fs');

const filepath = 'd:\\cafetín-manager\\src\\hooks\\useStore.ts';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace('export function useStore() {', 'export function useStore(tenantId: string) {');

content = content.replace(/localStorage\.getItem\("(.*?)"\)/g, 'localStorage.getItem(`${tenantId}_$1`)');
content = content.replace(/localStorage\.getItem\('(.*?)'\)/g, 'localStorage.getItem(`${tenantId}_$1`)');

content = content.replace(/localStorage\.setItem\("(.*?)"\s*,/g, 'localStorage.setItem(`${tenantId}_$1`,');
content = content.replace(/localStorage\.setItem\('(.*?)'\s*,/g, 'localStorage.setItem(`${tenantId}_$1`,');

const regex = /const \[settings, setSettings\] = useState<Settings>\(\(\) => \{\s*const saved = localStorage\.getItem\(`\$\{tenantId\}_cafetin_settings`\);\s*return saved \? JSON\.parse\(saved\) : DEFAULT_SETTINGS;\s*\}\);/g;

const replacement = `const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(\`\${tenantId}_cafetin_settings\`);
    if (saved) return JSON.parse(saved);
    const defaults = { ...DEFAULT_SETTINGS };
    if (tenantId === 'laslomas') defaults.companyName = 'Las Lomas Grill';
    if (tenantId === 'paradero') defaults.companyName = 'Paradero 104';
    return defaults;
  });`;

content = content.replace(regex, replacement);

fs.writeFileSync(filepath, content, 'utf8');
console.log('Refactoring useStore.ts completed successfully.');
