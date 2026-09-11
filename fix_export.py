with open("src/features/settings/ExportSettingsScreen.tsx", "r") as f:
    text = f.read()

# Fix styles
text = text.replace("backgroundColor: selectedExport === option.value ? Colors.light.primary : Colors.light.surface,", "")
text = text.replace("color: selectedExport === option.value ? Colors.light.textPrimary : Colors.light.textSecondary,", "")

# Fix selected={selectedExport === "products"}
text = text.replace("selected={selectedExport === \"products\"}", "style={[styles.formatOptionItem, selectedExport === \"products\" ? {backgroundColor: Colors.light.primary} : {backgroundColor: Colors.light.surface}]}")
text = text.replace("selected={selectedExport === \"customers\"}", "style={[styles.formatOptionItem, selectedExport === \"customers\" ? {backgroundColor: Colors.light.primary} : {backgroundColor: Colors.light.surface}]}")
text = text.replace("selected={selectedExport === \"sales\"}", "style={[styles.formatOptionItem, selectedExport === \"sales\" ? {backgroundColor: Colors.light.primary} : {backgroundColor: Colors.light.surface}]}")
text = text.replace('style={styles.formatOptionItem}', '')

# formatOptionLabel inline style
# It is used inside the TouchableOpacity, we need to replace style={styles.formatOptionLabel}
text = text.replace('style={styles.formatOptionLabel}>Products</ThemedText>', 'style={[styles.formatOptionLabel, {color: selectedExport === "products" ? Colors.light.surface : Colors.light.textSecondary}]}>Products</ThemedText>')
text = text.replace('style={styles.formatOptionLabel}>\n                  {t("exportSettings.customers")}', 'style={[styles.formatOptionLabel, {color: selectedExport === "customers" ? Colors.light.surface : Colors.light.textSecondary}]}>\n                  {t("exportSettings.customers")}')
text = text.replace('style={styles.formatOptionLabel}>Sales</ThemedText>', 'style={[styles.formatOptionLabel, {color: selectedExport === "sales" ? Colors.light.surface : Colors.light.textSecondary}]}>Sales</ThemedText>')

# Fix toggleTable missing arg
text = text.replace('onPress={toggleTable}', 'onPress={() => {\n                  if (selectedTables.length === tableOptions.length) {\n                    setSelectedTables([]);\n                  } else {\n                    setSelectedTables(tableOptions.map(t => t.value));\n                  }\n                }}')

# Fix option.description
text = text.replace('{option.description || ""}', '')

# Fix accessibleRole -> accessibilityRole
text = text.replace('accessibleRole=', 'accessibilityRole=')

with open("src/features/settings/ExportSettingsScreen.tsx", "w") as f:
    f.write(text)
