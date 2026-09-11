with open("src/features/sales/SaleDetailScreen.tsx", "r") as f:
    text = f.read()

text = text.replace("import { getSaleById, SaleWithItems } from '@/database/repositories/saleRepository';", "import { getSaleById } from '@/database/repositories/saleRepository';\nimport { Sale, SaleItem } from '@/types/entities';\nexport type SaleWithItems = Sale & { customer_name?: string | null; items: SaleItem[] };")

with open("src/features/sales/SaleDetailScreen.tsx", "w") as f:
    f.write(text)

with open("src/database/repositories/saleRepository.ts", "r") as f:
    text2 = f.read()

text2 = text2.replace("return {\n    id: sale.id,", "return {\n    ...sale,\n    items: itemsRows,\n    id: sale.id,")

with open("src/database/repositories/saleRepository.ts", "w") as f:
    f.write(text2)
