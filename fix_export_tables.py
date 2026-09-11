with open("src/features/settings/ExportSettingsScreen.tsx", "r") as f:
    text = f.read()

text = text.replace("const tableOptions = [", 'type TableName = "products" | "customers" | "sales" | "saleItems" | "payments" | "inventoryMovements";\n  const tableOptions: { value: TableName, label: string, bytes: number }[] = [')
text = text.replace('setSelectedTables(tableOptions.map(t => t.value));', 'setSelectedTables(tableOptions.map(t => t.value as TableName));')
text = text.replace('const handleExportSelect = useCallback((value: string) => {', 'const handleExportSelect = useCallback((value: TableName) => {')
text = text.replace('setSelectedTables((prev) =>\n      prev.includes(value)\n        ? prev.filter((v) => v !== value)\n        : [...prev, value]\n    );', 'setSelectedTables((prev) =>\n      prev.includes(value)\n        ? prev.filter((v) => v !== value)\n        : [...prev, value as TableName]\n    );')
text = text.replace('setSelectedTables(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);', 'setSelectedTables(prev => prev.includes(value as TableName) ? prev.filter(v => v !== value) : [...prev, value as TableName]);')

with open("src/features/settings/ExportSettingsScreen.tsx", "w") as f:
    f.write(text)
