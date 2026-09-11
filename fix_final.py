with open("src/features/settings/ExportSettingsScreen.tsx", "r") as f:
    text = f.read()

text = text.replace("const toggleTable = useCallback((value: string) => {", "const toggleTable = useCallback((value: TableName) => {")
text = text.replace("const index = prev.indexOf(value);", "const index = prev.indexOf(value as TableName);")
text = text.replace("return [...prev, value];", "return [...prev, value as TableName];")
text = text.replace("return prev.filter((v) => v !== value);", "return prev.filter((v) => v !== value as TableName);")

with open("src/features/settings/ExportSettingsScreen.tsx", "w") as f:
    f.write(text)

with open("src/features/sales/SaleDetailScreen.tsx", "r") as f:
    text2 = f.read()

text2 = text2.replace("setSale(data);", "setSale(data as SaleWithItems);")

with open("src/features/sales/SaleDetailScreen.tsx", "w") as f:
    f.write(text2)
