with open("src/features/settings/ExportSettingsScreen.tsx", "r") as f:
    text = f.read()

# Fix the useState type definition
text = text.replace("""  const [selectedTables, setSelectedTables] = useState<
    | "products"
    | "customers"
    | "sales"
    | "saleItems"
    | "payments"
    | "inventoryMovements"
  >([]);""", """  const [selectedTables, setSelectedTables] = useState<
    ("products" | "customers" | "sales" | "saleItems" | "payments" | "inventoryMovements")[]
  >([]);""")

with open("src/features/settings/ExportSettingsScreen.tsx", "w") as f:
    f.write(text)
