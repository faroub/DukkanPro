import os
import re

filepath = 'src/features/settings/MoreScreen.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# I will just match by the preceding comment to know which route to push to

replacements = {
    'Business Profile': '/settings/business',
    'Language': '/settings/language',
    'Inventory Rules': '/settings/inventory',
    'Catalogue': '/settings/catalogue',
    'Data Export': '/settings/export',
    'Data Reset (Destructive)': '/settings/data-reset',
    'About': '#'
}

for title, route in replacements.items():
    # search for the comment
    pattern = rf'\{{\/\* {re.escape(title)} \*\/\}}\s*<TouchableOpacity[^>]*href="#"'
    if route != '#':
        replace = rf'{{/* {title} */}}\n        <TouchableOpacity className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt" onPress={{() => router.push("{route}" as any)}}'
    else:
        replace = rf'{{/* {title} */}}\n        <TouchableOpacity className="group flex items-center min-h-[56px] px-card-padding py-3.5 transition-colors active:bg-surface-alt"'
    
    # Actually just replace `href="#"` with `onPress={() => router.push(route)}` inside the line after the comment
    # Let's do it manually using split
    parts = content.split(f'{{/* {title} */}}')
    if len(parts) > 1:
        # replace the first href="#" in parts[1]
        if route != '#':
            parts[1] = parts[1].replace('href="#"', f'onPress={{() => router.push("{route}" as any)}}', 1)
        else:
            parts[1] = parts[1].replace('href="#"', '', 1)
        content = f'{{/* {title} */}}'.join(parts)

with open(filepath, 'w') as f:
    f.write(content)
