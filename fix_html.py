import os
import re

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements for common HTML to React Native translations
    # 1. <span className="material-symbols-outlined...">icon</span> -> <ThemedText style={{fontFamily: "MaterialIcons", ...}}>icon</ThemedText>
    # Note: we will just replace span className="material-symbols-outlined..." with ThemedText and fix up later
    
    # Actually, simpler regex replacements:
    content = re.sub(r'<div style=\{styles\.([a-zA-Z0-9_]+)\}>', r'<View style={styles.\1}>', content)
    content = content.replace('</div>', '</View>')
    content = content.replace('<div className=', '<View className=')
    
    # material-symbols-outlined spans
    # <span className="material-symbols-outlined text-[20px]">cleaning_services</span>
    # <span className="material-symbols-outlined text-error text-[14px]">remove_circle</span>
    
    def span_replacer(match):
        attrs = match.group(1)
        inner = match.group(2)
        if 'material-symbols-outlined' in attrs:
            return f'<ThemedText style={{fontFamily: "MaterialIcons"}}>{inner}</ThemedText>'
        return f'<ThemedText {attrs}>{inner}</ThemedText>'
        
    content = re.sub(r'<span([^>]*)>([^<]*)</span>', span_replacer, content)
    
    # Empty spans like <span className="..."/>
    content = re.sub(r'<span([^>]*)\s*/>', r'<ThemedText \1 />', content)

    # <input ... /> -> <TextInput ... />
    content = content.replace('<input\n', '<TextInput\n')
    content = content.replace('onChange={(e) => handleBusinessNameChange(e.target.value)}', 'onChangeText={handleBusinessNameChange}')
    
    # <a> -> <TouchableOpacity>
    content = content.replace('<a className=', '<TouchableOpacity className=')
    content = content.replace('</a>', '</TouchableOpacity>')
    
    # <p> -> <ThemedText>
    content = content.replace('<p className=', '<ThemedText className=')
    content = content.replace('</p>', '</ThemedText>')
    
    with open(filepath, 'w') as f:
        f.write(content)

files = [
    'src/features/settings/DataResetScreen.tsx',
    'src/features/settings/ExportSettingsScreen.tsx',
    'src/features/settings/MoreScreen.tsx'
]

for f in files:
    if os.path.exists(f):
        fix_file(f)
        print(f"Fixed {f}")
    else:
        print(f"Missing {f}")
