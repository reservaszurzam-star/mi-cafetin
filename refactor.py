import os, re

filepath = r'd:\cafetín-manager\src\hooks\useStore.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace useStore signature
content = content.replace('export function useStore() {', 'export function useStore(tenantId: string) {')

# Replace localStorage.getItem
content = re.sub(r'localStorage\.getItem\(\"(.*?)\"\)', r'localStorage.getItem(`${tenantId}_\1`)', content)
content = re.sub(r'localStorage\.getItem\(\'(.*?)\'\)', r'localStorage.getItem(`${tenantId}_\1`)', content)

# Replace localStorage.setItem
content = re.sub(r'localStorage\.setItem\(\"(.*?)\"\,', r'localStorage.setItem(`${tenantId}_\1`,', content)
content = re.sub(r'localStorage\.setItem\(\'(.*?)\'\,', r'localStorage.setItem(`${tenantId}_\1`,', content)

def repl_settings(m):
    return '''const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(`${tenantId}_cafetin_settings`);
    if (saved) return JSON.parse(saved);
    const defaults = { ...DEFAULT_SETTINGS };
    if (tenantId === 'laslomas') defaults.companyName = 'Las Lomas Grill';
    if (tenantId === 'paradero') defaults.companyName = 'Paradero 104';
    return defaults;
  });'''

content = re.sub(
    r'const \[settings, setSettings\] = useState\<Settings\>\(\(\) \=\> \{\s+const saved = localStorage\.getItem\(\`\$\{tenantId\}_cafetin_settings\`\);\s+return saved \? JSON\.parse\(saved\) \: DEFAULT_SETTINGS;\s+\}\);',
    repl_settings,
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Refactoring useStore.ts completed successfully.')
