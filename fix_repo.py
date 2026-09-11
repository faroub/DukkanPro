with open("src/database/repositories/saleRepository.ts", "r") as f:
    text = f.read()

text = text.replace("export async function getSaleById(id: number): Promise<Sale & { customer_name?: string | null } | null> {", "export async function getSaleById(id: number): Promise<Sale & { customer_name?: string | null, items?: any[] } | null> {")

with open("src/database/repositories/saleRepository.ts", "w") as f:
    f.write(text)
